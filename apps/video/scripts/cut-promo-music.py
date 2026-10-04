"""Measure the beat grid for the 30 s promo and cut its music.

Usage: python3 scripts/cut-promo-music.py

Reuses the onset analysis from analyze-beats.py. The promo starts on the
section downbeat at ~128.47 s of House Two (the impact after the fill), runs
15 bars at 120 BPM and fades out over its last bar. Writes
src/promo/beats.json and public/audio/promo-music.wav.
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("beats", ROOT / "scripts/analyze-beats.py")
beats = importlib.util.module_from_spec(spec)
spec.loader.exec_module(beats)

OUT_AUDIO = ROOT / "public/audio/promo-music.wav"
OUT_JSON = ROOT / "src/promo/beats.json"
SECTION_GUESS = 128.47
BARS = 15
SECONDS = BARS * 4 * 0.5


def main() -> None:
    import numpy as np

    x = beats.decode(beats.SOURCE)
    sr = beats.SR
    window = x[int((SECTION_GUESS - 1) * sr) : int((SECTION_GUESS + SECONDS + 1) * sr)]
    flux, times = beats.onset_envelope(window)
    times = times + SECTION_GUESS - 1
    bpm, phase = beats.fit_grid(flux, times - times[0])
    period = 60 / bpm
    grid0 = times[0] + phase
    # Snap the grid to the beat nearest the guessed section downbeat.
    start_grid = grid0 + round((SECTION_GUESS - grid0) / period) * period
    measured = []
    for i in range(BARS * 4):
        g = start_grid + i * period
        mask = (times > g - 0.03) & (times < g + 0.03)
        measured.append(float(times[mask][np.argmax(flux[mask])]))
    start = measured[0]
    rel = [m - start for m in measured]
    fade = 4 * period
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y", "-ss", f"{start:.4f}", "-t", f"{SECONDS}",
            "-i", str(beats.SOURCE), "-ac", "2", "-ar", "48000",
            "-af", f"afade=t=in:d=0.004,afade=t=out:st={SECONDS - fade:.3f}:d={fade:.3f}",
            str(OUT_AUDIO),
        ],
        check=True,
    )
    OUT_JSON.write_text(
        json.dumps(
            {
                "source": "Mixkit #694 \"House Two\" (Mixkit Stock Music Free License)",
                "sourceStartSeconds": round(start, 4),
                "bpm": round(bpm, 3),
                "fps": beats.FPS,
                "beats": [
                    {"index": i, "bar": i // 4 + 1, "beat": i % 4 + 1, "seconds": round(t, 4), "frame": int(round(t * beats.FPS))}
                    for i, t in enumerate(rel)
                ],
            },
            indent=2,
        )
        + "\n"
    )
    devs = [float(round((t - i * period) * 1000, 1)) for i, t in enumerate(rel)]
    print(f"bpm {bpm:.2f}  start {start:.3f}s  max |dev| {max(map(abs, devs))} ms")


if __name__ == "__main__":
    main()
