"""Sliding-window sequence mining with frequency counting and confidence scoring."""

import hashlib
from collections import defaultdict
from dataclasses import dataclass
from urllib.parse import urlparse

from app.algorithms.normalizer import NormalizedEvent

WorkflowStep = tuple[str, str | None]

@dataclass(slots=True)
class DetectedWorkflow:
    hash: str
    steps: list[WorkflowStep]
    frequency: int
    confidence: float
    first_seen: int
    last_seen: int

    @property
    def applications(self) -> list[str]:
        """Application labels for presentation and AI naming."""
        return [application for application, _url in self.steps]

def get_step_id(e: NormalizedEvent) -> str:
    if e.url:
        try:
            parsed = urlparse(e.url)
            return f"web:{parsed.netloc}"
        except Exception:
            return e.application
    return e.application

def _sequence_hash(identifiers: tuple[str, ...]) -> str:
    return hashlib.sha256("|".join(identifiers).encode("utf-8")).hexdigest()


def detect_workflows(
    events: list[NormalizedEvent],
    *,
    min_steps: int = 3,
    max_steps: int = 8,
    min_frequency: int = 3,
    min_confidence: float = 0.75,
    max_gap_seconds: int = 600,
) -> list[DetectedWorkflow]:
    if len(events) < min_steps:
        return []

    freq: dict[str, int] = defaultdict(int)
    first_seen: dict[str, int] = {}
    last_seen: dict[str, int] = {}
    step_map: dict[str, tuple[WorkflowStep, ...]] = {}

    for window_size in range(min_steps, max_steps + 1):
        if len(events) < window_size:
            continue
        for i in range(len(events) - window_size + 1):
            window = events[i : i + window_size]
            if any(
                not 0 <= window[j + 1].timestamp - window[j].timestamp <= max_gap_seconds
                for j in range(len(window) - 1)
            ):
                continue
            if any(get_step_id(window[j]) == get_step_id(window[j + 1]) for j in range(len(window) - 1)):
                continue
            identifiers = tuple(get_step_id(e) for e in window)
            h = _sequence_hash(identifiers)
            freq[h] += 1
            step_map[h] = tuple((e.application, e.url) for e in window)
            last_seen[h] = max(last_seen.get(h, 0), window[-1].timestamp)
            if h not in first_seen:
                first_seen[h] = window[0].timestamp

    results: list[DetectedWorkflow] = []
    for h, count in freq.items():
        if count < min_frequency:
            continue
        steps = step_map[h]
        unique_apps = len({application for application, _url in steps})
        consistency = unique_apps / len(steps)
        frequency_score = min(1.0, count / 20)
        confidence = (
            0.4 * frequency_score
            + 0.3 * consistency
            + 0.2 * min(1.0, count / 10)
            + 0.1 * min(1.0, count / 5)
        )
        confidence = max(0.0, min(1.0, confidence))
        if confidence < min_confidence:
            continue
        results.append(
            DetectedWorkflow(
                hash=h,
                steps=list(steps),
                frequency=count,
                confidence=round(confidence, 3),
                first_seen=first_seen[h],
                last_seen=last_seen[h],
            )
        )

    results.sort(key=lambda w: (-w.frequency, -w.confidence))
    return results
