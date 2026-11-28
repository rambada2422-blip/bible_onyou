"""Original underscoring for the fifth plague, Exodus 9:1–7.

Regenerate with PYTHONDONTWRITEBYTECODE=1 python tools/art-src/palace-cattle-score.py
and the project's NumPy, SciPy and FFmpeg tools. The empty pen leaves the last
note of a falling phrase unanswered. In the herd a reed completes it over a
slow four-foot gait. All sounds are synthesized without recorded samples.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def timber(seconds, rng):
    """Uneven stick-slip pulses exciting the resonances of a wooden gate."""
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    rate = 27 + 34 * np.sin(np.pi * t / seconds) ** 2 + 3 * np.sin(52 * t)
    phase = np.cumsum(rate) / score.RATE
    release = np.diff(np.floor(phase), prepend=0) > 0
    push = np.zeros(len(t))
    push[release] = rng.uniform(.55, 1, release.sum())
    tail = np.arange(round(.065 * score.RATE)) / score.RATE
    wood = sum(
        gain * np.exp(-decay * tail) * np.sin(2 * np.pi * frequency * tail)
        for frequency, decay, gain in ((318, 95, 1), (587, 118, .52), (905, 150, .21))
    )
    return signal.fftconvolve(push, wood)[:len(t)] * np.sin(np.pi * t / seconds) ** 2


def empty_pen():
    beat = 60 / 68
    basses = (43, 43, 41, 46, 43, 38)
    mix = np.zeros((round(len(basses) * 4 * beat * score.RATE), 2))
    rng = np.random.default_rng(905)
    for bar, bass in enumerate(basses):
        start = 4 * bar * beat
        # The second pluck lingers over the space where a third might answer.
        for offset, pitch, length, gain, pan in (
            (.03, bass, .51, .32, .43), (.91, bass + 12, .49, .24, .52),
            (1.59, bass + 10, .69, .22, .59)
        ):
            wave = score.voice("pluck", pitch, length * beat, rng)
            score.place(mix, wave * gain, start + offset * beat, pan)
        if bar in (0, 3):
            score.place(mix, timber(.43, rng) * .14, start + .14 * beat, .27)
        if bar in (1, 4):
            low = score.voice("bow", bass + 7, 1.65 * beat, rng)
            score.place(mix, low * .085, start + 1.34 * beat, .42)
    mix += .10 * np.roll(mix[:, ::-1], round(.081 * score.RATE), axis=0)
    score.encode("palace-cattle-pen", mix, .40)


def living_herd():
    beat = 60 / 84
    basses = (43, 43, 48, 50, 43, 40, 48, 45, 43, 48, 50, 43)
    # One breathing melodic gesture every two bars of a lilting 6/8.
    phrases = (
        ((.18, 67, .64), (1.08, 65, .68), (2.02, 62, 1.48)),
        ((.24, 64, 1.05), (1.64, 67, .61), (2.53, 69, .92)),
        ((.18, 67, .64), (1.07, 65, .62), (2.05, 62, 1.41)),
        ((.31, 64, .87), (1.59, 60, .81), (2.66, 62, .80)),
        ((.24, 62, .85), (1.39, 64, .64), (2.43, 67, 1.00)),
        ((.21, 69, .64), (1.14, 62, .69), (2.12, 67, 1.31)),
    )
    mix = np.zeros((round(len(basses) * 2 * beat * score.RATE), 2))
    rng = np.random.default_rng(907)
    for bar, bass in enumerate(basses):
        start = 2 * bar * beat
        for at, note, level, pan in (
            (.02, 48, .26, .34), (.61, 52, .16, .41),
            (1.05, 46, .22, .60), (1.67, 51, .15, .64)
        ):
            contact = score.voice("hoof", note, .13, rng)
            score.place(mix, contact * level, start + at * beat, pan)
        lower = score.voice("bow", bass, 1.81 * beat, rng)
        score.place(mix, lower * .14, start + .07 * beat, .42)
        if bar % 2 == 0:
            for at, pitch, length in phrases[bar // 2]:
                melody = score.voice("reed", pitch, length * beat, rng)
                score.place(mix, melody * .19, start + at * beat, .59)
    mix += .075 * np.roll(mix[:, ::-1], round(.104 * score.RATE), axis=0)
    score.encode("palace-cattle-herd", mix, .41)


if __name__ == "__main__":
    empty_pen()
    living_herd()
