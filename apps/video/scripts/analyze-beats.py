"""Measure the beat grid of the terminal video's track and cut the 8-bar loop.

Usage: python3 scripts/analyze-beats.py

Decodes public/audio/house-two.mp3 with ffmpeg, finds phrase-start downbeats,
picks the 8-bar window whose last bar best matches the bar before its first
downbeat (so the loop seam is inaudible), measures every beat inside that
window, writes src/terminal/beats.json and cuts public/audio/terminal-music.wav.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/audio/house-two.mp3"
OUT_AUDIO = ROOT / "public/audio/terminal-music.wav"
OUT_JSON = ROOT / "src/terminal/beats.json"

SR = 22050
FPS = 60
BARS = 8
BEATS_PER_BAR = 4
LOOP_SECONDS = 16.0


def decode(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def onset_envelope(x: np.ndarray, hop: int = 64, n: int = 1024) -> tuple[np.ndarray, np.ndarray]:
    """Log-spectral flux, one value per hop, with frame-centre timestamps."""
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    spectrum = np.log1p(1000 * np.abs(np.fft.rfft(frames, axis=1)))
    flux = np.maximum(0, np.diff(spectrum, axis=0)).sum(axis=1)
    flux = np.convolve(flux, np.ones(3) / 3, "same")
    times = (np.arange(len(flux)) + 1) * hop / SR + n / 2 / SR
    return flux, times


def fit_grid(flux: np.ndarray, times: np.ndarray) -> tuple[float, float]:
    """Tempo and phase that put the most onset energy on the grid."""
    best = (0.0, 0.0, 0.0)
    for bpm in np.arange(118, 122.5, 0.01):
        period = 60 / bpm
        for phase in np.arange(0, period, 0.002):
            grid = np.arange(phase, times[-1] - 0.05, period)
            score = np.interp(grid, times, flux).mean()
            if score > best[0]:
                best = (score, bpm, phase)
    return best[1], best[2]


def rms(x: np.ndarray, a: float, b: float) -> float:
    return float(np.sqrt(np.mean(x[int(a * SR) : int(b * SR)] ** 2)) + 1e-6)


def bar_spectrum(x: np.ndarray, a: float, b: float) -> np.ndarray:
    seg = x[int(a * SR) : int(b * SR)]
    s = np.log1p(np.abs(np.fft.rfft(seg * np.hanning(len(seg))))[: len(seg) // 4])
    return s / np.linalg.norm(s)


def main() -> None:
    x = decode(SOURCE)
    duration = len(x) / SR

    # 1. Global grid from a steady 32 s stretch in the middle of the track.
    probe = (duration * 0.7, duration * 0.7 + 32)
    flux, times = onset_envelope(x[int(probe[0] * SR) : int(probe[1] * SR)])
    bpm, phase = fit_grid(flux, times)
    period = 60 / bpm
    anchor = probe[0] + phase

    # 2. Phrase starts: beats where loudness jumps across a 2-bar boundary.
    beats = anchor + np.arange(-int(anchor / period), int((duration - anchor) / period)) * period
    beats = beats[(beats > 2 * BEATS_PER_BAR * period) & (beats < duration - 2 * BEATS_PER_BAR * period)]
    span = 2 * period
    novelty = np.array([abs(np.log(rms(x, b, b + span) / rms(x, b - span, b))) for b in beats])
    phrase_starts = beats[np.argsort(novelty)[::-1][:6]]
    index_of = lambda t: int(round((t - anchor) / period))
    bar_phase = int(np.bincount([index_of(t) % BEATS_PER_BAR for t in phrase_starts]).argmax())

    # 3. Candidate windows start on a downbeat 0 or 8 bars after a phrase start.
    loop_beats = BARS * BEATS_PER_BAR
    candidates = sorted({t + k * loop_beats * period for t in phrase_starts for k in (0, 1)})
    candidates = [t for t in candidates if index_of(t) % BEATS_PER_BAR == bar_phase]
    candidates = [t for t in candidates if t + loop_beats * period < duration - 1]

    def seam(start: float) -> float:
        end = start + loop_beats * period
        bar = BEATS_PER_BAR * period
        steady = 1 - np.std([rms(x, start + i * bar, start + (i + 1) * bar) for i in range(BARS)]) / rms(x, start, end)
        return float(bar_spectrum(x, start - bar, start) @ bar_spectrum(x, end - bar, end)) * steady

    start = max(candidates, key=seam)

    # 4. Measure every beat inside the window: local flux peak within ±30 ms.
    window = x[int((start - 0.2) * SR) : int((start + LOOP_SECONDS + 0.2) * SR)]
    flux, times = onset_envelope(window)
    times = times - 0.2
    local_bpm, local_phase = fit_grid(flux, times + 0.2)
    local_period = 60 / local_bpm
    grid_start = local_phase - 0.2
    grid_start -= round(grid_start / local_period) * local_period
    measured = []
    for i in range(loop_beats):
        g = grid_start + i * local_period
        mask = (times > g - 0.03) & (times < g + 0.03)
        measured.append(float(times[mask][np.argmax(flux[mask])]))
    offset = measured[0]
    start += offset
    measured = [m - offset for m in measured]

    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y", "-ss", f"{start:.4f}", "-t", f"{LOOP_SECONDS}",
            "-i", str(SOURCE), "-ac", "2", "-ar", "48000",
            "-af", "afade=t=in:d=0.004,afade=t=out:st=15.994:d=0.006", str(OUT_AUDIO),
        ],
        check=True,
    )

    OUT_JSON.write_text(
        json.dumps(
            {
                "source": "Mixkit #694 \"House Two\" (Mixkit Stock Music Free License)",
                "sourceStartSeconds": round(start, 4),
                "bpm": round(local_bpm, 3),
                "fps": FPS,
                "seamSimilarity": round(seam(start), 4),
                "beats": [
                    {
                        "index": i,
                        "bar": i // BEATS_PER_BAR + 1,
                        "beat": i % BEATS_PER_BAR + 1,
                        "seconds": round(t, 4),
                        "frame": int(round(t * FPS)),
                    }
                    for i, t in enumerate(measured)
                ],
            },
            indent=2,
        )
        + "\n"
    )
    devs = [float(round((t - i * local_period) * 1000, 1)) for i, t in enumerate(measured)]
    print(f"bpm {local_bpm:.2f}  start {start:.3f}s  seam {seam(start):.4f}")
    print("beat deviation from grid (ms):", devs)


if __name__ == "__main__":
    main()
