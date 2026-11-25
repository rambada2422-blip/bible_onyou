"""Render the three original Exodus 32 observation loops. Requires NumPy, SciPy and FFmpeg."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def percussion(kind, pitch, seconds, rng):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    if kind == "rings":
        # Two contact points scrape before their small metal overtones separate.
        friction = signal.sosfilt(
            signal.butter(2, [860, 2470], fs=score.RATE, btype="bandpass", output="sos"),
            rng.normal(size=len(t)))
        wave = (.19 * friction * np.exp(-9 * t) + .48 * np.sin(phase) * np.exp(-9 * t)
                + .32 * np.sin(2.71 * phase) * np.exp(-13 * t)
                + .24 * np.sin(2.78 * phase) * np.exp(-15 * t))
        attack, release = .022, .08
    else:
        # A damped slab with a low, rounded attack and two audible upper modes.
        wave = (.69 * np.sin(phase) * np.exp(-3.4 * t)
                + .46 * np.sin(2.49 * phase) * np.exp(-4.2 * t)
                + .31 * np.sin(3.43 * phase) * np.exp(-7.5 * t))
        attack, release = .037, .20
    return wave * np.minimum(t / attack, 1) * np.minimum((seconds - t) / release, 1)


def camp(note, bar):
    # A 2+2+3 division never quite settles into a regular march.
    basses = (45, 45, 41, 43, 45, 41, 40, 45)
    bass = basses[bar]
    note("rings", 69, .015, .63, .35, .42)
    note("short_strings", bass + 12, .05, .43, .34, .40)
    note("short_strings", 64 if bar % 2 == 0 else 65, 1, .41, .34, .61)
    note("bow", bass, .21, 2.88, .17, .45)
    if bar not in (3, 7):
        note("rings", 72, 1.47, .48, .26, .65)
        note("short_strings", 62, 2.08, .52, .22, .59)
    if bar % 2 == 1:
        note("rings", 67, 2.75, .62, .21, .44)


def stone(note, bar):
    # The opening leaves a beat and a half empty. Later the broken
    # F–E half-step returns low in the strings, apart from the initial strike.
    basses = (38, 38, 41, 36, 38)
    note("slab", 50 if bar % 2 == 0 else 48, .02, 1.32, .46 if bar == 0 else .34, .48)
    note("bow", basses[bar], .05, 2.03 if bar in (0, 3) else 3.42, .22, .45)
    note("bow", basses[bar] + 19, .16, 1.65, .095, .58)
    upper = (None, 53, 52, None, 50)[bar]
    if upper:
        note("bow", upper, .70, 2.11, .16, .61)
    if bar == 2:
        note("slab", 55, 2.38, 1.01, .25, .56)


def return_walk(note, bar):
    # The next morning begins with a single reed. The last phrase rests on
    # scale degree two above D, leaving the petition open at the loop boundary.
    basses = (50, 46, 48, 43, 45, 50)
    tune = ((65, 64), (62, None), (64, 65), (62, 60), (62, 65), (64, None))
    opening, answer = tune[bar]
    note("reed", opening, .04, 1.36 if answer else 2.32, .24, .53)
    note("bow", basses[bar], .26, 2.63, .15, .38)
    if answer:
        note("reed", answer, 1.74, .92, .20, .53)
    if bar in (0, 2, 4):
        note("bow", 57, 1.12, 1.60, .08, .65)


def render(name, bpm, beats_per_bar, bars, perform, reflections, peak):
    beat = 60 / bpm
    mix = np.zeros((round(bars * beats_per_bar * beat * score.RATE), 2))
    rng = np.random.default_rng(3230)
    for bar in range(bars):
        def note(kind, pitch, at, beats, volume, pan):
            seconds = beats * beat
            if kind in ("rings", "slab"):
                wave = percussion(kind, pitch, seconds, rng)
            else:
                wave = score.voice(kind, pitch, seconds, rng)
            score.place(mix, wave * volume, (bar * beats_per_bar + at) * beat, pan)
        perform(note, bar)
    dry = mix.copy()
    for seconds, level in reflections:
        mix += level * np.roll(dry[:, ::-1], round(seconds * score.RATE), axis=0)
    score.encode("wild-calf-" + name, mix, peak)


if __name__ == "__main__":
    render("camp", 80, 3.5, 8, camp, ((.065, .10),), .60)
    render("stone", 60, 4, 5, stone, ((.143, .10), (.252, .06)), .54)
    render("return", 50, 3, 6, return_walk, ((.103, .13), (.232, .06)), .27)
