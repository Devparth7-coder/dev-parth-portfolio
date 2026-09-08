"""SQLAlchemy models — spec §27 entities with UUIDs + timestamps."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class _Common:
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class User(_Common, Base):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), default="Storyteller")


class Project(_Common, Base):
    __tablename__ = "projects"
    user_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(32), default="draft")  # draft|analyzed|generating|storyboard
    # StyleProfile (spec §12 global style lock)
    style: Mapped[dict] = mapped_column(JSON, default=dict)
    # Generation settings: scene target, aspect ratio, provider, params
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    # Aggregate story analysis (genre/tone/themes/events)
    analysis: Mapped[dict] = mapped_column(JSON, default=dict)

    story = relationship("Story", back_populates="project", uselist=False, cascade="all, delete-orphan")
    characters = relationship("Character", back_populates="project", cascade="all, delete-orphan")
    locations = relationship("LocationEntity", back_populates="project", cascade="all, delete-orphan")
    props = relationship("PropEntity", back_populates="project", cascade="all, delete-orphan")
    scenes = relationship("Scene", back_populates="project", cascade="all, delete-orphan",
                          order_by="Scene.index")
    runs = relationship("WorkflowRun", back_populates="project", cascade="all, delete-orphan")


class Story(_Common, Base):
    __tablename__ = "stories"
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id"), index=True)
    text: Mapped[str] = mapped_column(Text, default="")
    source_filename: Mapped[str | None] = mapped_column(String(300), nullable=True)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    project = relationship("Project", back_populates="story")


class Character(_Common, Base):
    """Character Bible entry (spec §4)."""
    __tablename__ = "characters"
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(60), default="supporting")  # protagonist|antagonist|supporting
    age: Mapped[str | None] = mapped_column(String(60), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Immutable attributes: facial structure, hair, eyes, skin, body, marks
    immutable: Mapped[dict] = mapped_column(JSON, default=dict)
    # Variable attributes: clothing, pose, expression, injuries, accessories
    variable: Mapped[dict] = mapped_column(JSON, default=dict)
    personality: Mapped[list] = mapped_column(JSON, default=list)
    description: Mapped[str] = mapped_column(Text, default="")
    reference_image_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    reference_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    consistency_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    inferred: Mapped[bool] = mapped_column(Boolean, default=False)  # AI-filled vs text-grounded
    project = relationship("Project", back_populates="characters")
    versions = relationship("CharacterVersion", back_populates="character", cascade="all, delete-orphan")


class CharacterVersion(_Common, Base):
    __tablename__ = "character_versions"
    character_id: Mapped[str] = mapped_column(String(32), ForeignKey("characters.id"), index=True)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    note: Mapped[str | None] = mapped_column(String(300), nullable=True)
    character = relationship("Character", back_populates="versions")


class LocationEntity(_Common, Base):
    """World / Environment Bible entry (spec §6)."""
    __tablename__ = "locations"
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(220))
    type: Mapped[str] = mapped_column(String(80), default="place")
    architecture: Mapped[str] = mapped_column(Text, default="")
    materials: Mapped[str] = mapped_column(String(300), default="")
    dominant_colors: Mapped[list] = mapped_column(JSON, default=list)
    weather: Mapped[str] = mapped_column(String(120), default="")
    time_period: Mapped[str] = mapped_column(String(120), default="")
    visual_style: Mapped[str] = mapped_column(String(300), default="")
    reference_image_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    project = relationship("Project", back_populates="locations")
    versions = relationship("LocationVersion", back_populates="location", cascade="all, delete-orphan")


class LocationVersion(_Common, Base):
    __tablename__ = "location_versions"
    location_id: Mapped[str] = mapped_column(String(32), ForeignKey("locations.id"), index=True)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    location = relationship("LocationEntity", back_populates="versions")


class PropEntity(_Common, Base):
    """Object / Prop Bible entry (spec §7)."""
    __tablename__ = "props"
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(220))
    category: Mapped[str] = mapped_column(String(80), default="object")
    appearance: Mapped[str] = mapped_column(Text, default="")
    material: Mapped[str] = mapped_column(String(200), default="")
    shape: Mapped[str] = mapped_column(String(200), default="")
    markings: Mapped[str] = mapped_column(String(300), default="")
    project = relationship("Project", back_populates="props")


class Scene(_Common, Base):
    __tablename__ = "scenes"
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id"), index=True)
    index: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[str] = mapped_column(Text, default="")
    excerpt: Mapped[str] = mapped_column(Text, default="")
    character_ids: Mapped[list] = mapped_column(JSON, default=list)
    location_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    time: Mapped[str] = mapped_column(String(60), default="day")
    weather: Mapped[str] = mapped_column(String(80), default="clear")
    action: Mapped[str] = mapped_column(Text, default="")
    emotion: Mapped[str] = mapped_column(String(80), default="neutral")
    camera: Mapped[dict] = mapped_column(JSON, default=dict)     # shot/angle/movement
    composition: Mapped[str] = mapped_column(String(200), default="")
    lighting: Mapped[str] = mapped_column(String(200), default="natural light")
    palette: Mapped[list] = mapped_column(JSON, default=list)
    object_ids: Mapped[list] = mapped_column(JSON, default=list)
    continuity: Mapped[list] = mapped_column(JSON, default=list)  # active constraints for this scene
    # Human-in-the-loop status (spec §23)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    # pending|generating|ai_approved|ai_rejected|needs_review|human_approved|human_rejected
    seed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seed_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    # Future video/animation metadata (spec §37)
    motion: Mapped[dict] = mapped_column(JSON, default=dict)
    project = relationship("Project", back_populates="scenes")
    generations = relationship("ImageGeneration", back_populates="scene", cascade="all, delete-orphan",
                               order_by="ImageGeneration.version")
    versions = relationship("SceneVersion", back_populates="scene", cascade="all, delete-orphan")
    prompts = relationship("Prompt", backref="scene", cascade="all, delete-orphan",
                           order_by="Prompt.version")


class SceneVersion(_Common, Base):
    __tablename__ = "scene_versions"
    scene_id: Mapped[str] = mapped_column(String(32), ForeignKey("scenes.id"), index=True)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    note: Mapped[str | None] = mapped_column(String(300), nullable=True)
    scene = relationship("Scene", back_populates="versions")


class Prompt(_Common, Base):
    """Versioned, inspectable prompts (spec §35)."""
    __tablename__ = "prompts"
    scene_id: Mapped[str] = mapped_column(String(32), ForeignKey("scenes.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    sections: Mapped[dict] = mapped_column(JSON, default=dict)   # SUBJECT / IDENTITY / WARDROBE / ...
    final_prompt: Mapped[str] = mapped_column(Text, default="")
    negative_prompt: Mapped[str] = mapped_column(Text, default="")
    manual_override: Mapped[bool] = mapped_column(Boolean, default=False)


class ImageGeneration(_Common, Base):
    __tablename__ = "image_generations"
    scene_id: Mapped[str] = mapped_column(String(32), ForeignKey("scenes.id"), index=True)
    prompt_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("prompts.id"), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    provider: Mapped[str] = mapped_column(String(60), default="mock")
    model: Mapped[str] = mapped_column(String(120), default="")
    params: Mapped[dict] = mapped_column(JSON, default=dict)     # aspect, steps, cfg, seed...
    seed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(600), nullable=True)
    selected: Mapped[bool] = mapped_column(Boolean, default=False)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    scene = relationship("Scene", back_populates="generations")
    prompt = relationship("Prompt")  # ordering hint for cascaded deletes
    evaluations = relationship("ConsistencyEvaluation", back_populates="generation",
                               cascade="all, delete-orphan")


class ConsistencyEvaluation(_Common, Base):
    __tablename__ = "consistency_evaluations"
    generation_id: Mapped[str] = mapped_column(String(32), ForeignKey("image_generations.id"), index=True)
    character_consistency: Mapped[float] = mapped_column(Float, default=0)
    environment_consistency: Mapped[float] = mapped_column(Float, default=0)
    style_consistency: Mapped[float] = mapped_column(Float, default=0)
    temporal_consistency: Mapped[float] = mapped_column(Float, default=0)
    overall_consistency: Mapped[float] = mapped_column(Float, default=0)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    signals: Mapped[dict] = mapped_column(JSON, default=dict)    # honest per-signal breakdown
    generation = relationship("ImageGeneration", back_populates="evaluations")


class ContinuityFact(_Common, Base):
    """Continuity memory (spec §18): state that must persist across scenes."""
    __tablename__ = "continuity_facts"
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id"), index=True)
    subject: Mapped[str] = mapped_column(String(220))            # character/prop/location name
    kind: Mapped[str] = mapped_column(String(60))                # injury|wardrobe|carrying|state|world
    fact: Mapped[str] = mapped_column(Text)
    starts_scene: Mapped[int] = mapped_column(Integer, default=0)
    ends_scene: Mapped[int | None] = mapped_column(Integer, nullable=True)  # null = ongoing


class WorkflowRun(_Common, Base):
    __tablename__ = "workflow_runs"
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40), default="full_pipeline")
    status: Mapped[str] = mapped_column(String(24), default="queued")  # queued|running|succeeded|failed
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    current_step: Mapped[str | None] = mapped_column(String(200), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    stats: Mapped[dict] = mapped_column(JSON, default=dict)      # tokens/cost/latency aggregates
    project = relationship("Project", back_populates="runs")
    events = relationship("WorkflowEvent", back_populates="run", cascade="all, delete-orphan",
                          order_by="WorkflowEvent.seq")


class WorkflowEvent(_Common, Base):
    __tablename__ = "workflow_events"
    run_id: Mapped[str] = mapped_column(String(32), ForeignKey("workflow_runs.id"), index=True)
    seq: Mapped[int] = mapped_column(Integer, default=0)
    step: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(20), default="info")  # info|start|done|failed|warn
    message: Mapped[str] = mapped_column(String(400), default="")
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    run = relationship("WorkflowRun", back_populates="events")
