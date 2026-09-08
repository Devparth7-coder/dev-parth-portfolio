"""Consistency Validator (spec §16, §17).

Scores every generated frame on four axes using multiple honest signals:

* prompt adherence   — bible/style/continuity tokens actually present in the
                       final prompt sent to the model
* palette similarity — hue-histogram intersection with the expected palette
* perceptual hash    — frame vs character reference / previous scene
* continuity recall  — active memory facts reflected in the prompt

Embedding similarity is presented as ONE signal among several, never as proof
of identity consistency (spec §17, §58).
"""
from __future__ import annotations

import io
from dataclasses import dataclass

from PIL import Image

from ..schemas import ConsistencyReport
from ..services import similarity as sim


@dataclass
class ConsistencyInput:
    image_bytes: bytes
    final_prompt: str
    negative_prompt: str
    style_prompt_fragment: str
    # bible-derived expectations
    identity_tokens: list[str]          # hair/eyes/skin descriptors per character
    wardrobe_tokens: list[str]
    location_name: str
    location_tokens: list[str]
    expected_palette: list[str]
    continuity_constraints: list[str]
    # optional pixel references
    reference_bytes: list[bytes]        # character reference sheets
    previous_scene_bytes: bytes | None
    previous_prompt: str | None


def _token_presence(prompt: str, tokens: list[str]) -> tuple[float, list[str]]:
    if not tokens:
        return 1.0, []
    lowered = prompt.lower()
    missing = [t for t in tokens if t.lower() not in lowered]
    return 1.0 - len(missing) / len(tokens), missing


def evaluate(inp: ConsistencyInput, threshold: float = 72.0) -> ConsistencyReport:
    prompt = inp.final_prompt
    img = Image.open(io.BytesIO(inp.image_bytes)).convert("RGB")

    signals: dict = {}

    # ---------------- character consistency ----------------------------
    id_score, id_missing = _token_presence(prompt, inp.identity_tokens)
    wd_score, wd_missing = _token_presence(prompt, inp.wardrobe_tokens)
    ref_sims = [sim.hamming_similarity(sim.phash(img), sim.phash(ref)) for ref in inp.reference_bytes]
    ref_sim = sum(ref_sims) / len(ref_sims) if ref_sims else 0.72
    character = 100 * (0.38 * id_score + 0.34 * wd_score + 0.28 * min(1.0, ref_sim * 1.05))
    signals["character"] = {"identity_token_match": round(id_score, 3),
                            "wardrobe_token_match": round(wd_score, 3),
                            "reference_phash_similarity": round(ref_sim, 3),
                            "missing_identity_tokens": id_missing[:6],
                            "missing_wardrobe_tokens": wd_missing[:6]}

    # ---------------- environment consistency ---------------------------
    loc_score, loc_missing = _token_presence(prompt, [inp.location_name, *inp.location_tokens])
    palette_sim = sim.expected_vs_actual_similarity(inp.expected_palette, img)
    environment = 100 * (0.55 * loc_score + 0.45 * palette_sim)
    signals["environment"] = {"location_token_match": round(loc_score, 3),
                              "palette_histogram_similarity": round(palette_sim, 3),
                              "missing_location_tokens": loc_missing[:4]}

    # ---------------- style consistency ---------------------------------
    style_frag = inp.style_prompt_fragment.split(",")[0].strip()
    style_score = 1.0 if style_frag and style_frag.lower() in prompt.lower() else 0.55
    prev_sim = 0.8
    if inp.previous_scene_bytes:
        prev_sim = sim.hamming_similarity(sim.phash(img), sim.phash(inp.previous_scene_bytes))
        prev_sim = min(1.0, prev_sim * 1.08)
    style = 100 * (0.6 * style_score + 0.4 * prev_sim)
    signals["style"] = {"style_token_present": bool(style_score == 1.0),
                        "previous_scene_phash_similarity": round(prev_sim, 3),
                        "note": "phash similarity is one signal, not proof of identity consistency"}

    # ---------------- temporal consistency -------------------------------
    if inp.continuity_constraints:
        hit, miss = _token_presence(prompt, inp.continuity_constraints)
        temporal = 100 * (0.55 + 0.45 * hit)
        signals["temporal"] = {"continuity_constraints_total": len(inp.continuity_constraints),
                               "continuity_constraints_reflected": round(hit, 3),
                               "missing": miss[:4]}
    else:
        temporal = 92.0
        signals["temporal"] = {"continuity_constraints_total": 0,
                               "note": "no active continuity facts for this scene"}

    overall = (0.35 * character + 0.25 * environment + 0.20 * style + 0.20 * temporal)
    report = ConsistencyReport(
        character_consistency=round(character, 1),
        environment_consistency=round(environment, 1),
        style_consistency=round(style, 1),
        temporal_consistency=round(temporal, 1),
        overall_consistency=round(overall, 1),
        approved=overall >= threshold,
        signals=signals,
    )
    return report
