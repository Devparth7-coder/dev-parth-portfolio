"""Workflow engine (spec §29, §46).

The engine is deliberately queue-agnostic: `execute_run(run_id)` is a plain
synchronous function over PostgreSQL state. In local/demo mode it executes in
a background task; on serverless deployments the same function is invoked by
an external worker/queue without changing a line. Every step persists events
so progress is reconstructable (spec §41, §47), and regeneration loops are
hard-capped by MAX_REGENERATIONS (spec §29).
"""
from __future__ import annotations

import asyncio
import random
import time
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..agents import consistency_agent, prompt_agent
from ..agents.scene_planner import plan_scenes
from ..config import get_settings
from ..providers.image import get_image_provider
from ..providers.image.base import ImageProviderError, ImageRequest
from ..providers.llm import get_llm_provider
from ..schemas import (CharacterBatch, ConsistencyReport, ScenePlan, WorldBatch)
from .continuity import build_continuity
from .storage import get_storage

ASPECT_SIZES = {"16:9": (1024, 576), "21:9": (1176, 504), "4:3": (896, 672),
                "1:1": (832, 832), "9:16": (576, 1024)}


# --------------------------------------------------------------------------
# run management
# --------------------------------------------------------------------------
def create_run(project_id: str, kind: str, params: dict | None = None) -> str:
    with Session(get_engine()) as db:
        run = models.WorkflowRun(project_id=project_id, kind=kind, status="queued",
                                 stats=params or {})
        db.add(run)
        db.commit()
        return run.id


def get_engine():
    from ..database import engine
    return engine


def emit(db: Session, run: models.WorkflowRun, step: str, status: str, message: str,
         **data) -> None:
    seq = (db.query(models.WorkflowEvent).filter_by(run_id=run.id).count())
    db.add(models.WorkflowEvent(run_id=run.id, seq=seq, step=step, status=status,
                                message=message, data=data))
    db.flush()


def _set_run(db: Session, run: models.WorkflowRun, **kw) -> None:
    for k, v in kw.items():
        setattr(run, k, v)
    db.commit()


async def launch_run(run_id: str) -> None:
    """Fire the engine without blocking the HTTP request (spec §46)."""
    asyncio.create_task(_run_task(run_id))


async def _run_task(run_id: str) -> None:
    await asyncio.to_thread(execute_run, run_id)


# --------------------------------------------------------------------------
# main entrypoint
# --------------------------------------------------------------------------
def execute_run(run_id: str) -> None:
    settings = get_settings()
    started = time.perf_counter()
    with Session(get_engine()) as db:
        run = db.get(models.WorkflowRun, run_id)
        if not run or run.status == "running":
            return
        project = db.get(models.Project, run.project_id)
        _set_run(db, run, status="running", started_at=datetime.now(timezone.utc),
                 progress=0.02)
        try:
            if run.kind == "full_pipeline":
                _full_pipeline(db, run, project, settings)
            elif run.kind == "generate_images":
                _generate_all_images(db, run, project, settings)
            elif run.kind == "character_reference":
                _character_reference(db, run, project, settings)
            else:
                raise ValueError(f"unknown run kind {run.kind}")
            _set_run(db, run, status="succeeded", progress=1.0,
                     current_step="complete", finished_at=datetime.now(timezone.utc))
        except Exception as exc:  # noqa: BLE001 — surfaced to the UI, never lost
            db.rollback()
            run = db.get(models.WorkflowRun, run_id)
            emit(db, run, "pipeline", "failed", str(exc))
            _set_run(db, run, status="failed", error=str(exc)[:2000],
                     finished_at=datetime.now(timezone.utc))
        finally:
            run = db.get(models.WorkflowRun, run_id)
            if run:
                run.stats["duration_ms"] = int((time.perf_counter() - started) * 1000)
                db.commit()


# --------------------------------------------------------------------------
# pipeline steps
# --------------------------------------------------------------------------
def _full_pipeline(db: Session, run, project: models.Project, settings) -> None:
    story = project.story
    if not story or not story.text.strip():
        raise ValueError("Project has no story text. Add narrative input first.")

    llm = get_llm_provider()

    # --- 1. story analysis ------------------------------------------------
    emit(db, run, "story_analyzer", "start", "Analyzing narrative…")
    analysis = asyncio.run(_run_sync(llm.structured_generate(
        "story_analysis", {"text": story.text, "title_hint": project.title},
        schemas.StoryAnalysis)))
    if project.title in {"Untitled Project", ""}:
        project.title = analysis.title
    project.analysis = analysis.model_dump()
    project.status = "analyzed"
    emit(db, run, "story_analyzer", "done",
         f"Story analyzed — {analysis.genre}, tones: {', '.join(analysis.tone[:3])}",
         genre=analysis.genre)
    _set_run(db, run, progress=0.10, current_step="Story analyzed")

    # --- 2. character extraction -------------------------------------------
    emit(db, run, "character_agent", "start", "Extracting characters…")
    chars: CharacterBatch = asyncio.run(_run_sync(llm.structured_generate(
        "character_extraction", {"text": story.text}, CharacterBatch)))
    db.query(models.Character).filter_by(project_id=project.id).delete()
    char_rows: list[models.Character] = []
    for profile in [schemas.CharacterProfile(**c) for c in chars.characters]:
        row = models.Character(
            project_id=project.id, name=profile.name, role=profile.role,
            age=profile.age, gender=profile.gender,
            immutable=profile.appearance.model_dump(),
            variable={"primary": profile.clothing.primary,
                      "colors": profile.clothing.colors,
                      "accessories": profile.clothing.accessories,
                      "expression": "neutral"},
            personality=profile.personality, description=profile.description,
            inferred=profile.inferred)
        db.add(row)
        char_rows.append(row)
    db.flush()
    emit(db, run, "character_agent", "done",
         f"{len(char_rows)} characters detected — "
         + ", ".join(c.name for c in char_rows[:4]),
         count=len(char_rows))
    _set_run(db, run, progress=0.20, current_step=f"{len(char_rows)} characters detected")

    # --- 2b. character reference sheets (identity anchors, spec §5) ----------
    for char in char_rows:
        if char.reference_locked and char.reference_image_url:
            continue
        try:
            url = asyncio.run(_run_sync(_generate_character_sheet(char, project)))
            if url:
                char.reference_image_url = url
        except Exception:  # noqa: BLE001 — reference sheets are non-fatal
            pass
    db.flush()
    emit(db, run, "character_agent", "done",
         f"Character reference sheets generated for {sum(1 for c in char_rows if c.reference_image_url)} characters")

    # --- 3. world extraction -------------------------------------------------
    emit(db, run, "world_agent", "start", "Extracting locations & props…")
    world: WorldBatch = asyncio.run(_run_sync(llm.structured_generate(
        "world_extraction", {"text": story.text}, WorldBatch)))
    db.query(models.PropEntity).filter_by(project_id=project.id).delete()
    db.query(models.LocationEntity).filter_by(project_id=project.id).delete()
    loc_rows = [models.LocationEntity(project_id=project.id,
                                      **{k: v for k, v in l.items() if k != "location_id"})
                for l in world.locations]
    prop_rows = [models.PropEntity(project_id=project.id,
                                   **{k: v for k, v in p.items() if k != "object_id"})
                 for p in world.props]
    db.add_all(loc_rows + prop_rows)
    db.flush()
    emit(db, run, "world_agent", "done",
         f"{len(loc_rows)} locations, {len(prop_rows)} props detected",
         locations=len(loc_rows), props=len(prop_rows))
    _set_run(db, run, progress=0.28, current_step=f"{len(loc_rows)} locations detected")

    # --- 4. scene planning -----------------------------------------------------
    emit(db, run, "scene_planner", "start", "Planning scenes…")
    target = project.settings.get("scene_target")
    if target == "auto":
        target = None
    char_profiles = [_profile_from_row(c) for c in char_rows]
    loc_profiles = [_loc_profile_from_row(l) for l in loc_rows]
    prop_profiles = [_prop_profile_from_row(p) for p in prop_rows]
    plans = plan_scenes(story.text, char_profiles, loc_profiles, prop_profiles, target)
    if not plans:
        raise ValueError("Scene planner produced no scenes — story may be too short.")

    db.query(models.Scene).filter_by(project_id=project.id).delete()
    db.query(models.ContinuityFact).filter_by(project_id=project.id).delete()
    # map plan ids -> row ids (for FK links) and plan ids -> names (for continuity)
    plan_id_to_row = {}
    for i, row in enumerate(char_rows):
        plan_id_to_row[f"char_{i + 1:03d}"] = row.id
    char_name_by_plan = {f"char_{i + 1:03d}": row.name for i, row in enumerate(char_rows)}
    loc_plan_to_row = {f"loc_{i + 1:03d}": row.id for i, row in enumerate(loc_rows)}
    loc_name_by_plan = {f"loc_{i + 1:03d}": row.name for i, row in enumerate(loc_rows)}
    prop_plan_to_row = {f"prop_{i + 1:03d}": row.id for i, row in enumerate(prop_rows)}

    memory = build_continuity(plans, char_name_by_plan, loc_name_by_plan)
    scene_rows: list[models.Scene] = []
    for plan in plans:
        row = models.Scene(
            project_id=project.id, index=plan.index, summary=plan.summary,
            excerpt=plan.excerpt,
            character_ids=[plan_id_to_row.get(cid, cid) for cid in plan.characters],
            location_id=loc_plan_to_row.get(plan.location) if plan.location else None,
            time=plan.time, weather=plan.weather, action=plan.action,
            emotion=plan.emotion, camera=plan.camera.model_dump(),
            composition=plan.composition, lighting=plan.lighting,
            palette=plan.color_palette,
            object_ids=[prop_plan_to_row.get(oid, oid) for oid in plan.important_objects],
            continuity=plan.continuity, motion=plan.motion, status="pending")
        db.add(row)
        scene_rows.append(row)
    for fact in memory.facts:
        db.add(models.ContinuityFact(
            project_id=project.id, subject=fact.subject, kind=fact.kind, fact=fact.fact,
            starts_scene=fact.starts_scene, ends_scene=fact.ends_scene))
    db.flush()
    emit(db, run, "scene_planner", "done", f"{len(scene_rows)} scenes planned",
         count=len(scene_rows))
    _set_run(db, run, progress=0.34, current_step=f"{len(scene_rows)} scenes planned")

    # --- 5/6/7. prompt → image → consistency per scene ----------------------
    _generate_all_images(db, run, project, settings, start_progress=0.34)

    project.status = "storyboard"
    db.commit()


def _generate_all_images(db: Session, run, project, settings, start_progress: float = 0.0) -> None:
    scenes = sorted(project.scenes, key=lambda s: s.index)
    pending = [s for s in scenes if not any(g.selected and g.image_url for g in s.generations)]
    total = max(len(scenes), 1)
    for i, scene in enumerate(scenes):
        if scene not in pending:
            continue
        emit(db, run, "image_generator", "start", f"Generating scene {scene.index + 1:02d}…",
             scene_index=scene.index)
        try:
            generate_scene(db, project, scene, run=run)
            status = db.get(models.Scene, scene.id).status
            emit(db, run, "consistency_validator",
                 "done" if status == "ai_approved" else "warn",
                 f"Scene {scene.index + 1:02d} {'approved' if status == 'ai_approved' else 'kept for review'}",
                 scene_index=scene.index)
        except ImageProviderError as exc:
            emit(db, run, "image_generator", "failed", f"Scene {scene.index + 1:02d}: {exc}",
                 scene_index=scene.index)
        db.commit()
        _set_run(db, run, progress=start_progress + (1 - start_progress) * (i + 1) / total,
                 current_step=f"Generating scene {scene.index + 1:02d}")


def _character_reference(db: Session, run, project, settings) -> None:
    for char in project.characters:
        url = asyncio.run(_run_sync(_generate_character_sheet(char, project)))
        char.reference_image_url = url
        emit(db, run, "character_reference", "done", f"Reference sheet: {char.name}")
    db.commit()


async def _run_sync(coro):
    return await coro


# --------------------------------------------------------------------------
# per-scene generation (used by pipeline + regeneration endpoint)
# --------------------------------------------------------------------------
def generate_scene(db: Session, project: models.Project, scene: models.Scene,
                   options: schemas.RegenerateOptions | None = None,
                   run=None) -> models.ImageGeneration:
    settings = get_settings()
    options = options or schemas.RegenerateOptions()
    provider = get_image_provider(project.settings.get("image_provider", "mock"))

    characters = [c for c in project.characters if c.id in scene.character_ids]
    location = db.get(models.LocationEntity, scene.location_id) if scene.location_id else None
    props = [p for p in project.props if p.id in scene.object_ids]
    prev_scene = next((s for s in sorted(project.scenes, key=lambda x: x.index)
                       if s.index == scene.index - 1), None)

    # ---- prompt assembly --------------------------------------------------
    plan = scene_plan_from_row(scene, characters, location, props)
    version = db.query(models.Prompt).filter_by(scene_id=scene.id).count() + 1
    extra_changes: dict[str, str] = {}
    if options.change_camera:
        extra_changes["CAMERA"] = _alternate_camera(scene)
    if options.change_lighting:
        extra_changes["LIGHTING"] = _alternate_lighting(scene)
    if options.change_composition:
        extra_changes["COMPOSITION"] = "strong diagonal composition, leading lines"
    if options.change_expression and characters:
        extra_changes["EXPRESSION"] = f"{characters[0].name} with a hardened, intense expression"

    assembly = prompt_agent.assemble_prompt(
        plan, characters, location, props,
        scene_plan_from_row(prev_scene, characters, location, props) if prev_scene else None,
        project.style.get("key", "cinematic-realism"),
        project.style.get("locked", True),
        version=version,
        manual_prompt=options.edit_prompt or None,
        extra_changes=extra_changes or None,
    )
    prompt_row = models.Prompt(scene_id=scene.id, version=version,
                               sections=assembly.sections, final_prompt=assembly.final_prompt,
                               negative_prompt=assembly.negative_prompt,
                               manual_override=bool(options.edit_prompt))
    db.add(prompt_row)
    db.flush()

    # ---- seed management (spec §15) ----------------------------------------
    caps = provider.capabilities()
    if options.seed is not None:
        seed = options.seed
        scene.seed_locked = True
    elif scene.seed_locked and scene.seed is not None:
        seed = scene.seed
    else:
        seed = random.randrange(0, 2**31 - 1)
    if not caps.get("seed"):
        seed = None

    # ---- image request ------------------------------------------------------
    aspect = project.settings.get("aspect_ratio", "16:9")
    width, height = ASPECT_SIZES.get(aspect, ASPECT_SIZES["16:9"])
    request = ImageRequest(
        prompt=assembly.final_prompt, negative_prompt=assembly.negative_prompt,
        seed=seed, width=width, height=height,
        steps=int(project.settings.get("steps", 28)),
        guidance_scale=float(project.settings.get("guidance_scale", 7.0)),
        style_strength=float(project.settings.get("style_strength", 1.0)),
        reference_strength=float(project.settings.get("reference_strength", 0.7)),
        model=project.settings.get("image_model") or provider.default_model,
        context=_mock_context(project, scene, characters, location, props),
    )

    # ---- generation with retries/backoff (spec §42) -------------------------
    gen_version = db.query(models.ImageGeneration).filter_by(scene_id=scene.id).count() + 1
    generation = models.ImageGeneration(scene_id=scene.id, prompt_id=prompt_row.id,
                                        version=gen_version, provider=provider.name,
                                        model=request.model, params={}, seed=seed)
    db.add(generation)
    scene.status = "generating"
    db.flush()

    started = time.perf_counter()
    last_error: Exception | None = None
    for attempt in range(settings.image_max_retries):
        try:
            if request.reference_image_path:
                result = asyncio.run(_run_sync(provider.generate_with_reference(request)))
            else:
                result = asyncio.run(_run_sync(provider.generate(request)))
            last_error = None
            break
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(min(2 ** attempt * 0.3, 5))
    if last_error is not None:
        generation.error = str(last_error)[:1000]
        scene.status = "needs_review"
        db.commit()
        raise ImageProviderError(str(last_error))

    url = asyncio.run(_run_sync(get_storage().upload(
        f"projects/{project.id}/scene_{scene.index + 1:02d}_v{gen_version}.png",
        result.image_bytes)))
    generation.image_url = url
    generation.seed = result.seed
    generation.latency_ms = int((time.perf_counter() - started) * 1000)
    generation.cost = 0.0 if provider.name == "mock" else settings.pricing_image_each
    generation.params = {"aspect_ratio": aspect, **result.params}

    # deselect other versions, select this one
    for g in scene.generations:
        if g.id != generation.id:
            g.selected = False
    generation.selected = True
    scene.seed = result.seed if result.seed is not None else seed

    # ---- consistency validation loop (spec §16, §29) ------------------------
    report = _evaluate(db, project, scene, generation, characters, location, result.image_bytes)
    attempt = 0
    while (not report.approved and attempt < settings.max_regenerations
           and provider.name == "mock" and not scene.seed_locked):
        attempt += 1
        if run:
            emit(db, run, "consistency_validator", "warn",
                 f"Scene {scene.index + 1:02d} scored {report.overall_consistency} — regenerating "
                 f"({attempt}/{settings.max_regenerations})", scene_index=scene.index)
        # refine: new seed, same prompt (prompt refiner = continuity constraints reinforced)
        request.seed = random.randrange(0, 2**31 - 1)
        result = asyncio.run(_run_sync(provider.generate(request)))
        gen_version += 1
        generation = models.ImageGeneration(
            scene_id=scene.id, prompt_id=prompt_row.id, version=gen_version,
            provider=provider.name, model=request.model, seed=request.seed,
            params={"aspect_ratio": aspect, **result.params},
            latency_ms=int((time.perf_counter() - started) * 1000),
            cost=0.0 if provider.name == "mock" else settings.pricing_image_each)
        db.add(generation)
        url = asyncio.run(_run_sync(get_storage().upload(
            f"projects/{project.id}/scene_{scene.index + 1:02d}_v{gen_version}.png",
            result.image_bytes)))
        generation.image_url = url
        for g in scene.generations:
            if g.id != generation.id:
                g.selected = False
        generation.selected = True
        scene.seed = request.seed
        report = _evaluate(db, project, scene, generation, characters, location, result.image_bytes)

    scene.status = "ai_approved" if report.approved else "needs_review"
    db.commit()
    return generation


def _evaluate(db: Session, project, scene, generation, characters, location,
              image_bytes: bytes) -> ConsistencyReport:
    settings = get_settings()
    style_key = project.style.get("key", "cinematic-realism")
    from ..agents.lexicon import STYLE_PRESETS
    style_frag = STYLE_PRESETS.get(style_key, {}).get("prompt", "")

    identity_tokens, wardrobe_tokens = [], []
    reference_bytes: list[bytes] = []
    for c in characters:
        imm = c.immutable or {}
        identity_tokens += [t for t in [imm.get("hair"), imm.get("eyes")] if t]
        var = c.variable or {}
        if var.get("primary"):
            wardrobe_tokens.append(var["primary"])
        wardrobe_tokens += var.get("colors", [])[:2]
        if c.reference_image_url and c.reference_image_url.startswith("/media/"):
            key = c.reference_image_url.removeprefix("/media/")
            try:
                reference_bytes.append(asyncio.run(_run_sync(get_storage().download(key))))
            except Exception:  # noqa: BLE001
                pass

    prev_bytes = None
    prev_prompt = None
    prev = next((s for s in sorted(project.scenes, key=lambda x: x.index)
                 if s.index == scene.index - 1), None)
    if prev:
        pg = [g for g in prev.generations if g.selected and g.image_url]
        if pg and pg[0].image_url.startswith("/media/"):
            try:
                prev_bytes = asyncio.run(_run_sync(
                    get_storage().download(pg[0].image_url.removeprefix("/media/"))))
            except Exception:  # noqa: BLE001
                pass
        pp = [p for p in db.query(models.Prompt).filter_by(scene_id=prev.id)
              .order_by(models.Prompt.version.desc())]
        prev_prompt = pp[0].final_prompt if pp else None

    expected_palette = list(scene.palette or [])
    if location and location.dominant_colors:
        expected_palette = list(dict.fromkeys(location.dominant_colors + expected_palette))

    report = consistency_agent.evaluate(consistency_agent.ConsistencyInput(
        image_bytes=image_bytes,
        final_prompt=generation_prompt_text(db, generation) or "",
        negative_prompt="",
        style_prompt_fragment=style_frag,
        identity_tokens=identity_tokens,
        wardrobe_tokens=wardrobe_tokens,
        location_name=location.name if location else "",
        location_tokens=[location.architecture.split(",")[0]] if location and location.architecture else [],
        expected_palette=expected_palette,
        continuity_constraints=list(scene.continuity or []),
        reference_bytes=reference_bytes,
        previous_scene_bytes=prev_bytes,
        previous_prompt=prev_prompt,
    ), threshold=settings.consistency_threshold)

    db.add(models.ConsistencyEvaluation(
        generation_id=generation.id,
        character_consistency=report.character_consistency,
        environment_consistency=report.environment_consistency,
        style_consistency=report.style_consistency,
        temporal_consistency=report.temporal_consistency,
        overall_consistency=report.overall_consistency,
        approved=report.approved, signals=report.signals))
    db.flush()
    return report


def generation_prompt_text(db: Session, generation: models.ImageGeneration) -> str | None:
    if generation.prompt_id:
        p = db.get(models.Prompt, generation.prompt_id)
        return p.final_prompt if p else None
    return None


# --------------------------------------------------------------------------
# character reference sheets
# --------------------------------------------------------------------------
async def _generate_character_sheet(char: models.Character, project: models.Project) -> str:
    provider = get_image_provider(project.settings.get("image_provider", "mock"))
    if not hasattr(provider, "generate_reference_sheet"):
        return ""
    imm = char.immutable or {}
    var = char.variable or {}
    result = await provider.generate_reference_sheet({
        "name": char.name, "hair": imm.get("hair", ""), "skin_tone": imm.get("skin_tone", ""),
        "clothing_primary": var.get("primary", ""), "clothing_colors": var.get("colors", []),
    })
    return await get_storage().upload(
        f"projects/{project.id}/ref_{char.name.lower().replace(' ', '_')}.png",
        result.image_bytes)


# --------------------------------------------------------------------------
# adapters / helpers
# --------------------------------------------------------------------------
def _profile_from_row(row: models.Character) -> schemas.CharacterProfile:
    imm = row.immutable or {}
    var = row.variable or {}
    return schemas.CharacterProfile(
        character_id=row.id, name=row.name, role=row.role or "supporting",
        age=row.age, gender=row.gender,
        appearance=schemas.Appearance(**{k: imm.get(k, "") for k in schemas.Appearance.model_fields}),
        clothing=schemas.Clothing(primary=var.get("primary", ""), colors=var.get("colors", []),
                                  accessories=var.get("accessories", "")),
        personality=row.personality or [], description=row.description or "",
        inferred=row.inferred)


def _loc_profile_from_row(row: models.LocationEntity) -> schemas.LocationProfile:
    return schemas.LocationProfile(location_id=row.id, name=row.name, type=row.type,
                                   architecture=row.architecture, materials=row.materials,
                                   dominant_colors=row.dominant_colors or [],
                                   weather=row.weather, time_period=row.time_period,
                                   visual_style=row.visual_style)


def _prop_profile_from_row(row: models.PropEntity) -> schemas.PropProfile:
    return schemas.PropProfile(object_id=row.id, name=row.name, category=row.category,
                               appearance=row.appearance, material=row.material,
                               shape=row.shape, markings=row.markings)


def scene_plan_from_row(scene, characters, location, props) -> ScenePlan:
    cam = scene.camera or {}
    return ScenePlan(
        scene_id=scene.id, index=scene.index, summary=scene.summary, excerpt=scene.excerpt,
        characters=[c.id for c in characters],
        location=location.id if location else None,
        time=scene.time, weather=scene.weather, action=scene.action, emotion=scene.emotion,
        camera=schemas.CameraPlan(**{k: cam.get(k, "medium") for k in
                                     ("shot", "angle", "movement", "distance")}),
        composition=scene.composition, lighting=scene.lighting,
        color_palette=scene.palette or [],
        important_objects=[p.name for p in props],
        continuity=scene.continuity or [], motion=scene.motion or {})


def _mock_context(project, scene, characters, location, props) -> dict:
    facts = sorted(get_facts_for_project(scene.project_id), key=lambda f: f.starts_scene)

    def fact_active(f) -> bool:
        return f.starts_scene <= scene.index and (f.ends_scene is None or f.ends_scene > scene.index)

    char_ctx = []
    for c in characters:
        injured = any(f.kind == "injury" and f.subject == c.name and fact_active(f) for f in facts)
        carrying = any(f.kind == "carrying" and f.subject == c.name and fact_active(f) for f in facts)
        imm = c.immutable or {}
        var = c.variable or {}
        char_ctx.append({"name": c.name, "hair": imm.get("hair", ""),
                         "skin_tone": imm.get("skin_tone", ""),
                         "clothing_primary": var.get("primary", ""),
                         "clothing_colors": var.get("colors", []),
                         "injured": injured, "carrying": carrying})
    return {
        "style_key": project.style.get("key", "cinematic-realism"),
        "time": scene.time, "weather": scene.weather,
        "shot": (scene.camera or {}).get("shot", "medium-wide"),
        "lighting": scene.lighting, "palette": scene.palette or [],
        "location_type": location.type if location else "city",
        "characters": char_ctx,
        "props": [p.name for p in props],
    }


def get_facts_for_project(project_id: str) -> list:
    from ..database import SessionLocal
    with SessionLocal() as db:
        return list(db.query(models.ContinuityFact).filter_by(project_id=project_id).all())


def _alternate_camera(scene) -> str:
    shot = (scene.camera or {}).get("shot", "medium")
    options = ["dutch angle close-up, handheld camera", "sweeping wide establishing shot, crane up",
               "over-the-shoulder medium shot, slow push", "low angle heroic wide shot"]
    return options[(scene.index or 0) % len(options)]


def _alternate_lighting(scene) -> str:
    options = ["dramatic chiaroscuro, single hard key light",
               "soft diffused overcast light, muted shadows",
               "golden hour backlight with lens flare",
               "cold practical lighting, deep shadows"]
    return options[(scene.index or 0) % len(options)]
