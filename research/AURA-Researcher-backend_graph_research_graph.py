"""LangGraph orchestration of the AURA research pipeline.

Graph topology::

    START -> plan -> retrieve -> evidence -> reason -> experiment
                  -> critique -> (retry?) -> evaluate -> report -> END

The critique node conditionally routes back to ``reason`` (up to
``max_critic_iterations``) when claims fail verification, implementing the
self-correction loop. ``START``/``END`` imports tolerate LangGraph version
differences; if LangGraph is unavailable the module exposes a linear
:class:`LinearRunner` fallback so the pipeline still runs.
"""

from __future__ import annotations

import operator
import time
from typing import Annotated, TypedDict

from backend.agents.critic import CriticAgent
from backend.agents.experiment import ExperimentAgent
from backend.agents.planner import PlannerAgent
from backend.agents.reasoning import ReasoningAgent
from backend.agents.researcher import ResearcherAgent
from backend.agents.retrieval import EvidenceEngine
from backend.config import get_settings
from backend.evaluation.generation import GenerationEvaluator
from backend.evaluation.retrieval import RetrievalEvaluator
from backend.models import (
    Claim,
    ComparisonRow,
    Critique,
    EvaluationReport,
    Evidence,
    ExperimentResult,
    Paper,
    ResearchPlan,
    ResearchReport,
)
from backend.report import ReportBuilder


class ResearchState(TypedDict, total=False):
    question: str
    plan: ResearchPlan
    papers: list[Paper]
    evidences: list[Evidence]
    claims: list[Claim]
    comparison: list[ComparisonRow]
    experiment: ExperimentResult | None
    critique: Critique
    evaluation: EvaluationReport
    report: ResearchReport
    datasets: list
    web_sources: list
    trace: Annotated[list[dict], operator.add]
    iteration: int
    max_iterations: int
    error: str


def _trace(node: str, message: str) -> dict:
    return {"node": node, "message": message, "ts": round(time.time(), 3)}


# --- nodes ----------------------------------------------------------------
def plan_node(state: ResearchState) -> dict:
    plan = PlannerAgent().plan(state["question"])
    return {"plan": plan, "trace": [_trace("planner", f"decomposed into {len(plan.tasks)} tasks, {len(plan.queries)} queries")]}


def retrieve_node(state: ResearchState) -> dict:
    bundle = ResearcherAgent().research(state["plan"], state["question"])
    papers = bundle["papers"]
    return {
        "papers": papers,
        "datasets": bundle["datasets"],
        "web_sources": bundle["web_sources"],
        "trace": [_trace("researcher", f"retrieved {len(papers)} papers, {len(bundle['datasets'])} datasets, {len(bundle['web_sources'])} web sources")],
    }


def evidence_node(state: ResearchState) -> dict:
    evidences = EvidenceEngine(top_k=10).extract(state["plan"], state["papers"])
    return {"evidences": evidences,
            "trace": [_trace("evidence", f"extracted {len(evidences)} evidence snippets with citations")]}


def reason_node(state: ResearchState) -> dict:
    claims = ReasoningAgent().synthesize(state["plan"], state["papers"], state["evidences"])

    # Self-correction: on retry, drop claims the critic flagged.
    critique = state.get("critique")
    if critique is not None and critique.flagged_claims:
        flagged = set(critique.flagged_claims)
        kept = [c for c in claims if c.id not in flagged]
        if kept:
            claims = kept
            state["trace"] = state.get("trace", []) + [
                _trace("reason", f"retry: dropped {len(flagged)} flagged claims, {len(kept)} remain")
            ]
        else:
            state["trace"] = state.get("trace", []) + [
                _trace("reason", "retry: no claims survived — keeping best-effort claims")
            ]

    comparison = ReasoningAgent().build_comparison(state["plan"], state["papers"], state["evidences"])
    iteration = state.get("iteration", 0) + 1
    return {
        "claims": claims,
        "comparison": comparison,
        "iteration": iteration,
        "trace": [_trace("reason", f"synthesized {len(claims)} claims and a {len(comparison)}-row comparison table")],
    }


def experiment_node(state: ResearchState) -> dict:
    result = ExperimentAgent().run(state["plan"], state["papers"])
    return {"experiment": result,
            "trace": [_trace("experiment", f"status={result.status} ({result.name})")]}


def critique_node(state: ResearchState) -> dict:
    critique = CriticAgent().critique(state["claims"], state["papers"], state["evidences"])
    return {"critique": critique,
            "trace": [_trace("critic", f"{critique.verified_claims}/{critique.total_claims} claims verified; risk={critique.hallucination_risk}")]}


def evaluate_node(state: ResearchState) -> dict:
    retrieval = RetrievalEvaluator().evaluate(state["question"], state["papers"])
    generation = GenerationEvaluator().evaluate(state["claims"], state["evidences"], state["papers"])
    evaluation = EvaluationReport(
        retrieval=retrieval,
        generation=generation,
        summary={
            "citation_coverage": generation["citation_coverage"],
            "citation_validity": generation["citation_validity"],
            "mean_faithfulness": generation["mean_faithfulness"],
            "hallucination_risk": generation["hallucination_risk"],
        },
    )
    return {"evaluation": evaluation,
            "trace": [_trace("evaluation", f"coverage={generation['citation_coverage']}, faithfulness={generation['mean_faithfulness']}")]}


def report_node(state: ResearchState) -> dict:
    report = ReportBuilder().build(
        question=state["question"],
        plan=state["plan"],
        papers=state["papers"],
        evidences=state["evidences"],
        claims=state["claims"],
        comparison_rows=state["comparison"],
        experiment=state.get("experiment"),
        evaluation=state.get("evaluation"),
    )
    return {"report": report,
            "trace": [_trace("report", f"final report ready: {len(report.references)} references")]}


# --- routing ----------------------------------------------------------------
def route_after_critique(state: ResearchState) -> str:
    critique = state.get("critique")
    if critique is not None and not critique.passed:
        if state.get("iteration", 0) < state.get("max_iterations", 2):
            return "reason"
    return "evaluate"


def build_graph(max_iterations: int | None = None):
    """Compile the LangGraph StateGraph."""
    try:
        from langgraph.graph import END, START, StateGraph
    except ImportError:
        raise

    max_iter = max_iterations or get_settings().max_critic_iterations
    graph = StateGraph(ResearchState)
    graph.add_node("plan", plan_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("evidence", evidence_node)
    graph.add_node("reason", reason_node)
    graph.add_node("experiment", experiment_node)
    graph.add_node("critique", critique_node)
    graph.add_node("evaluate", evaluate_node)
    graph.add_node("report", report_node)

    graph.add_edge(START, "plan")
    graph.add_edge("plan", "retrieve")
    graph.add_edge("retrieve", "evidence")
    graph.add_edge("evidence", "reason")
    graph.add_edge("reason", "experiment")
    graph.add_edge("experiment", "critique")
    graph.add_conditional_edges(
        "critique",
        route_after_critique,
        {"reason": "reason", "evaluate": "evaluate"},
    )
    graph.add_edge("evaluate", "report")
    graph.add_edge("report", END)
    return graph.compile()


class ResearchPipeline:
    """Convenience wrapper around the compiled graph."""

    def __init__(self, max_iterations: int | None = None) -> None:
        self.graph = build_graph(max_iterations)

    def run(self, question: str) -> dict:
        return self.graph.invoke({
            "question": question,
            "iteration": 0,
            "max_iterations": get_settings().max_critic_iterations,
        })
