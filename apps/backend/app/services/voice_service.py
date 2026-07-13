"""Voice command parsing and local text-to-speech output."""

from __future__ import annotations

import base64
import importlib.util
import platform
import subprocess
from pathlib import Path
from uuid import uuid4

from app.core.config import settings


def parse_command(transcript: str) -> str:
    text = transcript.lower().strip()
    if any(word in text for word in ("next", "continue", "go on", "proceed")):
        return "next"
    if any(word in text for word in ("repeat", "again", "say that")):
        return "repeat"
    if any(word in text for word in ("stop", "cancel", "end flow")):
        return "stop"
    if any(word in text for word in ("status", "where am i", "current step")):
        return "status"
    return "unknown"


def speak(text: str, *, voice: str = "Jasper", speed: float = 1.0) -> dict[str, str | bool]:
    """Speak locally, preferring KittenTTS when its optional extra is installed."""
    clean = text.strip()
    if not clean:
        return {"spoken": False, "engine": "none", "reason": "No text supplied"}
    if importlib.util.find_spec("kittentts") is not None:
        try:
            return _speak_kitten(clean, voice=voice, speed=speed)
        except Exception:
            # A missing model cache or audio device should not stop a flow.
            pass
    return _speak_native(clean)


def _speak_kitten(text: str, *, voice: str, speed: float) -> dict[str, str | bool]:
    from kittentts import KittenTTS  # type: ignore[import-not-found]

    output_dir = Path(settings.data_dir) / "voice"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"flowsense-{uuid4().hex}.wav"
    model = KittenTTS("KittenML/kitten-tts-nano-0.8")
    model.generate_to_file(text, str(output_path), voice=voice, speed=max(0.5, min(speed, 2.0)))
    if platform.system() == "Windows":
        import winsound

        winsound.PlaySound(str(output_path), winsound.SND_FILENAME | winsound.SND_ASYNC)
    elif platform.system() == "Darwin":
        subprocess.Popen(["afplay", str(output_path)])
    else:
        subprocess.Popen(["aplay", str(output_path)])
    return {"spoken": True, "engine": "kitten_tts", "audio_path": str(output_path)}


def _speak_native(text: str) -> dict[str, str | bool]:
    system = platform.system()
    if system == "Windows":
        encoded = base64.b64encode(text.encode("utf-8")).decode("ascii")
        script = (
            "$t=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('"
            + encoded
            + "'));(New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak($t)"
        )
        subprocess.Popen(["powershell", "-NoProfile", "-Command", script])
    elif system == "Darwin":
        subprocess.Popen(["say", text])
    else:
        subprocess.Popen(["spd-say", text])
    return {"spoken": True, "engine": "native"}
