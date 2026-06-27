"""Normalize raw activity events into a canonical sequence for pattern detection."""

from collections.abc import Iterable
from dataclasses import dataclass

TRACKING_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "ref",
    "src",
}

PROCESS_NAME_MAP = {
    "chrome.exe": "Chrome",
    "msedge.exe": "Edge",
    "firefox.exe": "Firefox",
    "code.exe": "VS Code",
    "cursor.exe": "Cursor",
    "idea64.exe": "IntelliJ",
    "terminal.exe": "Terminal",
    "explorer.exe": "File Explorer",
    "discord.exe": "Discord",
    "slack.exe": "Slack",
    "spotify.exe": "Spotify",
    "notion.exe": "Notion",
    "figma.exe": "Figma",
    "winword.exe": "Word",
    "excel.exe": "Excel",
    "powerpnt.exe": "PowerPoint",
}


@dataclass(frozen=True, slots=True)
class NormalizedEvent:
    application: str
    window_title: str
    url: str | None
    timestamp: int  # epoch seconds


def normalize_application(process_name: str) -> str:
    key = process_name.strip().lower()
    return PROCESS_NAME_MAP.get(key, process_name)


def normalize_url(url: str | None) -> str | None:
    if not url:
        return None
    try:
        from urllib.parse import urlparse, urlunparse

        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return None
        cleaned = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, "", parsed.fragment))
        return cleaned
    except Exception:
        return url


def normalize_events(events: Iterable[dict]) -> list[NormalizedEvent]:
    result: list[NormalizedEvent] = []
    last_app: str | None = None
    for e in events:
        app = normalize_application(e.get("application", "Unknown"))
        if app == last_app and not e.get("url"):
            continue
        last_app = app
        ts = e.get("timestamp")
        if isinstance(ts, str):
            from datetime import datetime

            try:
                ts_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                ts_epoch = int(ts_dt.timestamp())
            except Exception:
                ts_epoch = 0
        elif hasattr(ts, "timestamp"):
            ts_epoch = int(ts.timestamp())
        else:
            ts_epoch = 0
        result.append(
            NormalizedEvent(
                application=app,
                window_title=e.get("window_title", "") or "",
                url=normalize_url(e.get("url")),
                timestamp=ts_epoch,
            )
        )
    return result
