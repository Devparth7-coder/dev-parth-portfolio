"""Continuity Memory (spec §18).

Builds a timeline of *state facts* — injuries, wardrobe changes, carried
props, world state — and yields the set of constraints active at any scene.
Facts are detected from narrative cues and automatically injected into future
scene prompts, so "Aria injured her left arm in Scene 5" keeps a bandage in
every later scene unless the story explicitly removes it.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from ..schemas import ScenePlan


@dataclass
class Fact:
    subject: str
    kind: str          # injury | wardrobe | carrying | state | world
    fact: str
    starts_scene: int
    ends_scene: int | None = None  # None = ongoing

    def active_at(self, index: int) -> bool:
        # half-open interval [starts, ends): a fact removed in scene N is
        # already gone in scene N's frame.
        if index < self.starts_scene:
            return False
        return self.ends_scene is None or index < self.ends_scene


INJURY_RE = re.compile(
    r"\b(?:injur|wound|hurt|cut|bleed|bleeding|burn|broke|broken|twist|gash|bruise)[a-z]*\b[^.!?]{0,60}"
    r"?\b(arm|leg|hand|shoulder|side|head|knee|back)\b",
    re.IGNORECASE,
)
BANDAGE_REMOVE_RE = re.compile(r"\b(?:heal(?:ed)?|recover(?:ed)?|bandage[sd]? (?:removed|gone)|mended)\b", re.IGNORECASE)
WARDROBE_RE = re.compile(
    r"\b(?:put on|puts on|changed into|changes into|donned|dons|takes off|took off|removed|removes)\b\s+"
    r"(?:her|his|the|a|an)?\s*([a-z'’-]+\s*){0,2}(coat|cloak|dress|armor|uniform|robe|jacket|hood|mask|gloves|boots)",
    re.IGNORECASE,
)
PICKUP_RE = re.compile(r"\b(?:picked up|picks up|grabbed|grabs|took|takes|seized|seizes|drew|draws|pocketed)\b\s+"
                       r"(?:her|his|the|a|an)\s+([a-z'’-]+(?:\s+[a-z'’-]+)?)\b", re.IGNORECASE)
PUTDOWN_RE = re.compile(r"\b(?:dropped|drops|set down|sets down|left behind|gave away|handed over)\b", re.IGNORECASE)
WORLD_STATE_RE = re.compile(
    r"\b(?:caught fire|burned down|collapsed|destroyed|flooded|exploded|crumbled|fell silent|sealed|awoke|awakened)\b",
    re.IGNORECASE,
)


class ContinuityMemory:
    """Scene-stream state tracker. Feed it scenes in order, read constraints."""

    def __init__(self) -> None:
        self.facts: list[Fact] = []

    # ------------------------------------------------------------ learning
    def observe(self, scene: ScenePlan, char_names: list[str]) -> None:
        text = scene.excerpt or ""
        idx = scene.index

        # world-state changes attach to the location (by display name)
        loc_name = getattr(self, "location_names", {}).get(scene.location, scene.location)
        if scene.location and WORLD_STATE_RE.search(text):
            m = WORLD_STATE_RE.search(text)
            self.facts.append(Fact(loc_name, "world", f"location changed: {m.group(0)}", idx))

        for name in char_names:
            if not re.search(rf"\b{re.escape(name)}\b", text, re.IGNORECASE):
                continue

            m = INJURY_RE.search(text)
            if m:
                self.facts.append(Fact(name, "injury", f"{name} injured {m.group(1)}", idx))

            m = WARDROBE_RE.search(text)
            if m:
                verb = m.group(0).split()[0].lower()
                garment = m.group(0).split()[-1].lower()
                if verb in {"takes", "took", "removed", "removes"}:
                    # remove the matching wardrobe fact
                    for f in reversed(self.facts):
                        if f.subject == name and f.kind == "wardrobe" and f.ends_scene is None and garment in f.fact:
                            f.ends_scene = idx
                            break
                else:
                    self.facts.append(Fact(name, "wardrobe", f"{name} now wears {garment}", idx))

            m = PICKUP_RE.search(text)
            if m and not PUTDOWN_RE.search(text):
                item_words = [w for w in m.group(1).strip().split()
                              if w.lower() not in {"and", "the", "a", "an", "of", "then"}]
                item = " ".join(item_words[-3:])
                if 3 <= len(item) <= 30 and item not in {"breath", "hand", "step", "look",
                                                         "chance", "place", "time"}:
                    self.facts.append(Fact(name, "carrying", f"{name} carries the {item}", idx))

            if BANDAGE_REMOVE_RE.search(text):
                for f in reversed(self.facts):
                    if f.subject == name and f.kind == "injury" and f.ends_scene is None:
                        f.ends_scene = idx
                        break

    # ------------------------------------------------------------ recall
    def constraints_at(self, index: int, subjects: list[str]) -> list[str]:
        out: list[str] = []
        for fact in self.facts:
            if not fact.active_at(index):
                continue
            if fact.subject in subjects:
                if fact.kind == "injury":
                    out.append(f"{fact.fact} — show a bandage/wound on the {fact.fact.split()[-1]}")
                elif fact.kind == "wardrobe":
                    out.append(f"{fact.fact} (wardrobe continuity)")
                elif fact.kind == "carrying":
                    out.append(f"{fact.fact} in frame")
                elif fact.kind == "world":
                    out.append(f"{fact.fact} (environment state must reflect this)")
        return out

    # helpers kept simple for readability
    @staticmethod
    def cont_prompt(f: Fact) -> str:
        return f"{f.fact} (wardrobe continuity)"

    @staticmethod
    def environment_changed(f: Fact) -> str:
        return f"{f.fact} (environment state must reflect this)"


def build_continuity(plans: list[ScenePlan], char_names_by_id: dict[str, str],
                     location_names_by_id: dict[str, str]) -> ContinuityMemory:
    memory = ContinuityMemory()
    memory.location_names = location_names_by_id  # plan loc id -> display name
    all_names = list(char_names_by_id.values())
    for plan in plans:
        # observe every known character; mention-scanning filters relevance
        names = list({char_names_by_id.get(cid, cid) for cid in plan.characters} | set(all_names))
        memory.observe(plan, names)
    # attach per-scene constraint lists
    for plan in plans:
        subjects = list({char_names_by_id.get(cid, cid) for cid in plan.characters} | set(all_names))
        if plan.location:
            subjects.append(location_names_by_id.get(plan.location, plan.location))
        plan.continuity = memory.constraints_at(plan.index, subjects)
    return memory
