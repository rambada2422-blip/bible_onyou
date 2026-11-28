"""Original sixth-plague observation music. No external instruments or samples.

Run with PYTHONDONTWRITEBYTECODE=1 python tools/art-src/palace-kiln-score.py.
The dry kiln cue leaves a gap in each group of pulses. The workshop cue lets
three progressively softer, more widely spaced tool resonances trail into air.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def ash_brush(seconds, rng):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    band = signal.butter(2, [630, 3250], fs=score.RATE, btype="bandpass", output="sos")
    grit = signal.sosfilt(band, rng.normal(size=len(t)))
    flicker = .27 + .73 * np.sin(2 * np.pi * 7.1 * t + np.sin(16 * t)) ** 2
    return grit * flicker * np.sin(np.pi * t / seconds) ** 2


def kiln():
    beat = .8
    roots = (45, 45, 43, 48, 45, 40)
    mix = np.zeros((round(len(roots) * 4 * beat * score.RATE), 2))
    rng = np.random.default_rng(908)
    for bar, root in enumerate(roots):
        start = 4 * beat * bar
        # A kiln pulse, two dry grains, and a conspicuously missing fourth beat.
        score.place(mix, score.voice("low_drum", root, .38, rng) * .20, start + .03, .46)
        for at, interval, gain in ((.12, 12, .26), (1.08, 19, .18), (2.18, 17, .14)):
            note = score.voice("pluck", root + interval, .56, rng)
            score.place(mix, note * gain, start + at * beat, .43 + .035 * at)
        score.place(mix, ash_brush(.72, rng) * .19, start + .23, .59)
        for at in rng.uniform(1.25, 2.84, 4):
            grain = ash_brush(rng.uniform(.019, .049), rng)
            score.place(mix, grain * .16, start + at, rng.uniform(.34, .64))
    mix += .055 * np.roll(mix[:, ::-1], round(.061 * score.RATE), axis=0)
    score.encode("palace-kiln-ash", mix, .36)


def metal_tail(pitch, seconds):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * (440 * 2 ** ((pitch - 69) / 12)) * t
    tone = sum(
        gain * np.sin(ratio * phase) * np.exp(-decay * t)
        for ratio, gain, decay in ((1, .70, 4.8), (2.61, .27, 7.8), (4.16, .12, 12))
    )
    return tone * np.minimum(t / .012, 1) * np.minimum((seconds - t) / .16, 1)


def workshop():
    seconds = 22.8
    mix = np.zeros((round(seconds * score.RATE), 2))
    rng = np.random.default_rng(911)
    for start, root in ((0, 45), (11.4, 43)):
        # Room echoes of the set-down tool grow farther apart, then stop.
        for at, pitch, gain in ((.06, 68, .29), (.75, 68, .14), (1.91, 68, .073)):
            ring = metal_tail(pitch, 1.18)
            score.place(mix, ring * gain, start + at, .39 + .08 * at)
        for at, interval, duration, gain, pan in (
            (.10, 0, 4.65, .13, .41), (2.51, 12, 2.25, .097, .58),
            (5.23, 7, 4.70, .12, .48), (7.05, 10, 2.84, .091, .61)
        ):
            bowed = score.voice("bow", root + interval, duration, rng)
            score.place(mix, bowed * gain, start + at, pan)
    mix += .12 * np.roll(mix[:, ::-1], round(.195 * score.RATE), axis=0)
    score.encode("palace-kiln-workshop", mix, .34)


if __name__ == "__main__":
    kiln()
    workshop()
