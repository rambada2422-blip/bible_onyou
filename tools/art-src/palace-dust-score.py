"""Render the original Bible Onyou sheepfold music for Exodus 8:16–19.

Run python tools/art-src/palace-dust-score.py with NumPy, SciPy and FFmpeg.
The composition and the brush synthesis were made for this game. The string
voices use its own red-sea-score.py synthesizer. No samples or external score.
Ten bars of five eighth notes at 150 eighth notes per minute give a 20 s loop.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def brush(seconds, rng):
    """A short uneven brushing gesture against a coarse surface."""
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    band = signal.butter(2, [720, 2450], btype="bandpass", fs=score.RATE, output="sos")
    grain = signal.sosfilt(band, rng.normal(size=len(t)))
    # Vary the friction during the gesture without introducing a buzzing pitch.
    pressures = np.r_[0, rng.uniform(.2, 1, 6), 0]
    pressure = np.interp(t, np.linspace(0, seconds, len(pressures)), pressures)
    return grain * pressure * np.sin(np.pi * t / seconds)


def render():
    pulse = 60 / 150
    bass_line = (50, 50, 48, 53, 50, 50, 48, 46, 48, 45)
    mix = np.zeros((round(len(bass_line) * 5 * pulse * score.RATE), 2))
    rng = np.random.default_rng(81619)
    for bar, bass in enumerate(bass_line):
        start = 5 * bar * pulse

        def note(kind, pitch, at, duration, volume, pan):
            wave = score.voice(kind, pitch, duration * pulse, rng)
            score.place(mix, volume * wave, start + at * pulse, pan)

        # Two short pulses, then a longer pause. The answering scrape moves
        # across the pen, like shifting attention from the shepherd to the goat.
        for at, seconds, volume, pan in ((.02, .21, .40, .37), (.74, .12, .32, .39),
                                         (2.62, .36, .42, .66)):
            if bar in (3, 8) and at == .74:
                continue
            score.place(mix, brush(seconds, rng) * volume, start + at * pulse, pan)
        note("short_strings", bass, .18, 1.5, .32, .49)
        note("pluck", bass + 7, 1.8, 1.15, .27, .59)
        if bar % 2 == 0:
            note("pluck", bass + 15, 3.27, 1.3, .32, .42)
            note("pluck", bass + 14, 4.16, .78, .24, .48)
        else:
            note("bow", bass + 12, 2.85, 2.05, .16, .49)

    # A single quiet reflection keeps the dry articulation clear on a phone.
    mix += .06 * np.roll(mix[:, ::-1], round(.042 * score.RATE), axis=0)
    score.encode("palace-dust-pen", mix, .49)


if __name__ == "__main__":
    render()
