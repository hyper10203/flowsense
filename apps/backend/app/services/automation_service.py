"""Local automation capabilities with explicit confirmation gates.

The service deliberately separates planning from execution: vision and LLM
output are untrusted until a user confirms the specific action. Optional
backends are discovered at runtime so FlowSense remains usable on a minimal
installation and across Windows, macOS, and Linux.
"""

from __future__ import annotations

import importlib.util
import os
import platform
import subprocess
import webbrowser
from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class Capability:
    name: str
    layer: str
    available: bool
    detail: str


def _has_module(module: str) -> bool:
    return importlib.util.find_spec(module) is not None


def capabilities() -> list[Capability]:
    """Report installed automation adapters without importing heavy packages."""
    system = platform.system()
    accessibility = {
        "Windows": ("pywinauto", "pywinauto UI Automation"),
        "Darwin": ("ApplicationServices", "macOS Accessibility (AX API)"),
        "Linux": ("pyatspi", "AT-SPI"),
    }
    module, label = accessibility.get(system, ("", "Unsupported platform"))
    accessibility_available = _has_module(module) if module else False
    return [
        Capability("accessibility", "accessibility", accessibility_available, label),
        Capability("ocr", "vision", _has_module("pytesseract") and _has_module("PIL"), "Tesseract OCR"),
        Capability("omniparser", "vision", _has_module("omniparser"), "Microsoft OmniParser adapter"),
        Capability("input", "input", _has_module("pynput"), "pynput"),
        Capability("web", "web", _has_module("playwright"), "Playwright"),
        Capability("kitten_tts", "voice", _has_module("kittentts"), "KittenTTS local ONNX voice"),
    ]


def capability_response() -> list[dict[str, Any]]:
    return [asdict(item) for item in capabilities()]


def plan_instruction(instruction: str) -> dict[str, Any]:
    """Create a deterministic plan for common local automation requests.

    An LLM planner can refine this plan in a future pass, but the deterministic
    baseline keeps commands private and predictable when no provider is set.
    """
    text = instruction.strip()
    lowered = text.lower()
    if not text:
        return {"action": "none", "requires_confirmation": False, "reason": "Empty instruction"}
    if lowered.startswith(("open ", "launch ")):
        target = text.split(maxsplit=1)[1].strip()
        if target.startswith(("http://", "https://")):
            return {"action": "open_url", "url": target, "requires_confirmation": True}
        return {"action": "launch_app", "application": target, "requires_confirmation": True}
    if lowered.startswith(("press ", "type ", "click ")):
        return {
            "action": "input",
            "instruction": text,
            "requires_confirmation": True,
            "reason": "Direct input is never executed without confirmation",
        }
    return {
        "action": "observe",
        "instruction": text,
        "requires_confirmation": False,
        "reason": "Use accessibility, vision, or an AI planner to inspect before acting",
    }


def execute_plan(plan: dict[str, Any], *, confirmed: bool) -> dict[str, Any]:
    """Execute only narrow, reversible actions after an explicit confirmation."""
    action = str(plan.get("action", "none"))
    if plan.get("requires_confirmation") and not confirmed:
        return {"executed": False, "reason": "Confirmation required", "plan": plan}
    if action == "open_url":
        url = str(plan.get("url", ""))
        if not url.startswith(("https://", "http://")):
            return {"executed": False, "reason": "Only HTTP(S) URLs may be opened", "plan": plan}
        webbrowser.open(url, new=2)
        return {"executed": True, "action": action}
    if action == "launch_app":
        application = str(plan.get("application", "")).strip()
        if not application:
            return {"executed": False, "reason": "No application supplied", "plan": plan}
        # `shell=False` keeps the supplied app name from being interpreted as
        # shell syntax. Platform launchers resolve the executable normally.
        subprocess.Popen([application], shell=False)  # noqa: S603
        return {"executed": True, "action": action}
    return {"executed": False, "reason": "This plan is inspect-only", "plan": plan}


def environment_summary() -> dict[str, str]:
    return {
        "platform": platform.system(),
        "automation_enabled": str(os.environ.get("FLOWSENSE_AUTOMATION_ENABLED", "false")).lower(),
    }
