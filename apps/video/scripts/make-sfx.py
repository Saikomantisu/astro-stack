"""Synthesize the videos' UI sounds and record where each one peaks.

Usage: python3 scripts/make-sfx.py

Every sound is padded so its measured peak lands exactly PEAK_FRAMES video
frames after the start of the file. src/shared/sfx.json records the measured
peak, and the composition starts each sound that many frames before its event.
"""

from __future__ import annotations

import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public/audio/sfx"
OUT_JSON = ROOT / "src/shared/sfx.json"

SR = 48000
FPS = 60
PEAK_FRAMES = 2
rng = np.random.default_rng(7)


def t(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def bandpass(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    spectrum = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / SR)
    spectrum[(freqs < lo) | (freqs > hi)] = 0
    return np.fft.irfft(spectrum, len(x))


def env(length: float, attack: float, decay: float) -> np.ndarray:
    tt = t(length)
    return np.minimum(1, tt / attack) * np.exp(-tt / decay)


def noise(length: float, lo: float, hi: float, attack: float, decay: float) -> np.ndarray:
    return bandpass(rng.standard_normal(int(length * SR)), lo, hi) * env(length, attack, decay)


def tone(length: float, freq: float, decay: float, sweep: float = 0) -> np.ndarray:
    tt = t(length)
    phase = 2 * np.pi * np.cumsum(freq + sweep * tt) / SR
    return np.sin(phase) * env(length, 0.0008, decay)


def mix(*parts: tuple[np.ndarray, float, float]) -> np.ndarray:
    """(signal, gain, offset seconds) → summed signal."""
    length = max(len(p) + int(o * SR) for p, _, o in parts)
    out = np.zeros(length)
    for p, g, o in parts:
        i = int(o * SR)
        out[i : i + len(p)] += g * p / (np.abs(p).max() + 1e-9)
    return out


def key(variant: int) -> np.ndarray:
    pitch = [1.0, 1.06, 0.95, 1.1][variant]
    return mix(
        (noise(0.05, 1800 * pitch, 7000, 0.0006, 0.007), 0.9, 0),
        (tone(0.04, 210 * pitch, 0.012), 0.45, 0.001),
        (noise(0.03, 3500, 9000, 0.0003, 0.003), 0.5, 0.018),
    )


SOUNDS = {
    "key-0": key(0),
    "key-1": key(1),
    "key-2": key(2),
    "key-3": key(3),
    "enter": mix(
        (noise(0.09, 900, 5000, 0.0008, 0.014), 0.9, 0),
        (tone(0.09, 120, 0.03), 0.8, 0.002),
        (noise(0.04, 2500, 8000, 0.0004, 0.005), 0.45, 0.032),
    ),
    "tick": mix(
        (tone(0.05, 2900, 0.009), 0.7, 0),
        (noise(0.02, 4000, 11000, 0.0002, 0.002), 0.6, 0),
    ),
    "soft-tick": mix(
        (tone(0.06, 1750, 0.014), 0.6, 0),
        (noise(0.02, 3000, 9000, 0.0002, 0.002), 0.3, 0),
    ),
    # A wide space-bar thock, a short arrow-key tap, a quiet
    # print tick and a two-note chime for the ready line.
    "space": mix(
        (noise(0.08, 500, 3500, 0.0008, 0.012), 0.9, 0),
        (tone(0.08, 150, 0.025), 0.7, 0.001),
        (noise(0.03, 2000, 7000, 0.0004, 0.004), 0.35, 0.026),
    ),
    "move": mix(
        (noise(0.03, 2500, 8000, 0.0003, 0.0035), 0.8, 0),
        (tone(0.03, 900, 0.006), 0.4, 0),
    ),
    "print": mix(
        (tone(0.03, 3600, 0.005), 0.6, 0),
        (noise(0.015, 5000, 11000, 0.0002, 0.0015), 0.4, 0),
    ),
    "ready": mix(
        (tone(0.9, 784, 0.32), 0.7, 0),
        (tone(0.9, 1175, 0.28), 0.55, 0.075),
        (tone(0.9, 1568, 0.2), 0.25, 0.075),
    ),
}


def measured_peak(x: np.ndarray) -> int:
    """Sample index of the loudest 1 ms of the sound."""
    window = int(0.001 * SR)
    energy = np.convolve(x**2, np.ones(window) / window, "same")
    return int(np.argmax(energy))


def write(path: Path, x: np.ndarray) -> None:
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    target = round(PEAK_FRAMES / FPS * SR)
    manifest = {}
    for name, x in SOUNDS.items():
        x = 0.8 * x / np.abs(x).max()
        x = np.concatenate([np.zeros(max(0, target - measured_peak(x))), x, np.zeros(int(0.02 * SR))])
        peak = measured_peak(x)
        write(OUT_DIR / f"{name}.wav", x)
        manifest[name] = {"file": f"audio/sfx/{name}.wav", "peakSeconds": round(peak / SR, 5)}
        print(f"{name:10} peak {peak / SR * 1000:.2f} ms")
    OUT_JSON.write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
