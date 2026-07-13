
from app.algorithms.detector import detect_workflows
from app.algorithms.normalizer import NormalizedEvent, normalize_application, normalize_url


def _event(app: str, seconds_offset: int = 0) -> NormalizedEvent:
    return NormalizedEvent(
        application=app,
        window_title=app,
        url=None,
        timestamp=1_700_000_000 + seconds_offset,
    )


def test_detect_repeated_sequence():
    base = (
        [_event("Chrome", 0)]
        + [_event("VS Code", 60)]
        + [_event("Terminal", 120)]
        + [_event("Chrome", 180)]
    )
    events = base * 5
    results = detect_workflows(events, min_frequency=3, min_confidence=0.5)
    assert len(results) >= 1
    assert any("Chrome" in r.applications and "VS Code" in r.applications for r in results)


def test_ignore_single_app_sequence():
    events = [_event("Chrome", i * 60) for i in range(10)]
    results = detect_workflows(events, min_frequency=3)
    assert results == []


def test_skip_large_gaps():
    events = [
        _event("Chrome", 0),
        _event("VS Code", 10),
        _event("Terminal", 10_000),
        _event("Chrome", 10_010),
    ]
    results = detect_workflows(events, min_frequency=1, min_confidence=0.1)
    assert results == []


def test_normalize_application():
    assert normalize_application("chrome.exe") == "Chrome"
    assert normalize_application("Code.exe") == "VS Code"
    assert normalize_application("unknown.exe") == "unknown.exe"


def test_normalize_url_strips_tracking():
    url = "https://example.com/page?utm_source=twitter&utm_medium=social&id=123"
    cleaned = normalize_url(url)
    assert "utm_source" not in (cleaned or "")
    assert "utm_medium" not in (cleaned or "")
    assert cleaned is not None and "example.com/page" in cleaned


def test_confidence_in_range():
    events = (
        [_event("Chrome", i * 60) for i in range(10)]
        + [_event("VS Code", i * 60 + 10) for i in range(10)]
        + [_event("Terminal", i * 60 + 20) for i in range(10)]
        + [_event("Chrome", i * 60 + 30) for i in range(10)]
    )
    results = detect_workflows(events, min_frequency=3, min_confidence=0.0)
    for r in results:
        assert 0.0 <= r.confidence <= 1.0
