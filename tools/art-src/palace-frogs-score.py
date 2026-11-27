"""Original Exodus 8 kitchen and courtyard music. Render with NumPy, SciPy and FFmpeg.

The frog calls and bowl use synthesized tones and noise. The instrumental
voices come from this game's red-sea-score.py. No recordings are sampled.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def croak(pitch, seconds, rng):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    freq = 440 * 2 ** ((pitch - 69) / 12)
    phase = 2 * np.pi * freq * t + .75 * np.sin(2 * np.pi * 2.3 * t)
    pulses = .32 + .68 * (.5 + .5 * np.sin(2 * np.pi * rng.uniform(18, 28) * t)) ** 2
    throat = .34 * np.sin(phase) + .48 * np.sin(2 * phase) + .33 * np.sin(4 * phase)
    band = signal.butter(2, [330, 1020], fs=score.RATE, btype="bandpass", output="sos")
    rasp = signal.sosfilt(band, rng.normal(size=len(t)))
    return (throat + .47 * rasp) * pulses * np.sin(np.pi * t / seconds) ** 1.3


def bowl(pitch, seconds):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    wave = (np.sin(phase) * np.exp(-9 * t) + .38 * np.sin(1.74 * phase) * np.exp(-14 * t)
            + .24 * np.sin(3.62 * phase) * np.exp(-27 * t))
    return wave * np.minimum(t / .012, 1) * np.minimum((seconds - t) / .055, 1)


def kitchen(note, bar):
    bass = (38, 38, 43, 41, 38, 36, 41, 43, 36, 38)[bar]
    # The everyday sound of a bowl trying to keep a phrase going. Two lower,
    # overlapping calls interrupt it from either side of the hearth.
    note("bowl", 62, .02, .67, .26, .53)
    note("bowl", 65, 1.32, .52, .20, .44)
    if bar not in (3, 9):
        note("bowl", 64, 2.76, .64, .21, .56)
    note("short_strings", bass + 12, .30, 1.03, .36, .43)
    note("croak", 44 + bar % 3, .045, .95, .33, .33)
    note("croak", 49 - bar % 3, .67 if bar % 2 == 0 else 1.14, .73, .28, .70)
    if bar % 3 != 2:
        note("croak", 46, 1.96, .61, .26, .62)
        note("short_strings", bass + 19, 2.20, .70, .23, .59)
    if bar in (1, 4, 7):
        note("croak", 42, 3.07, .74, .28, .35)


def yard(note, bar):
    # Stretch the same D–F–E across two bars. The gaps are left empty, so the
    # newly quiet courtyard is audible before the next palace decision.
    bass = (50, 50, 46, 46, 48, 50)[bar]
    note("bow", bass, .12, 3.44, .16, .40)
    if bar % 2 == 0:
        note("reed", 62, .045, 1.47, .19, .57)
        note("reed", 65, 2.22, 1.12, .16, .54)
    else:
        note("reed", 64, .26, 1.87, .18, .56)
        note("pluck", bass + 7, 2.42, .91, .16, .40)


def render(name, bpm, bars, perform, reflections, peak):
    beat = 60 / bpm
    mix = np.zeros((round(bars * 4 * beat * score.RATE), 2))
    rng = np.random.default_rng(815)
    for bar in range(bars):
        def note(kind, pitch, at, beats, volume, pan):
            seconds = beats * beat
            if kind == "croak":
                wave = croak(pitch, seconds, rng)
            elif kind == "bowl":
                wave = bowl(pitch, seconds)
            else:
                wave = score.voice(kind, pitch, seconds, rng)
            score.place(mix, wave * volume, (4 * bar + at) * beat, pan)
        perform(note, bar)
    dry = mix.copy()
    for seconds, level in reflections:
        mix += level * np.roll(dry[:, ::-1], round(seconds * score.RATE), axis=0)
    score.encode("palace-frogs-" + name, mix, peak)


if __name__ == "__main__":
    render("kitchen", 112, 10, kitchen, ((.045, .105), (.103, .055)), .65)
    render("yard", 60, 6, yard, ((.103, .10),), .29)
