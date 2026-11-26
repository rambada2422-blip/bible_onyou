"""Original music for the court visit and the Nile bank. Run with Python, NumPy, SciPy and FFmpeg.

The notes and sound models are written for Bible Onyou. All instruments are
synthesized here or in red-sea-score.py without external recordings.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def voice(kind, pitch, seconds, rng):
    if kind not in ("skin", "drop", "rush"):
        return score.voice(kind, pitch, seconds, rng)
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    freq = 440 * 2 ** ((pitch - 69) / 12)
    phase = 2 * np.pi * freq * t
    if kind == "skin":
        # Finger on a dry frame: a low membrane with quickly damped upper modes.
        phase += .74 * (1 - np.exp(-t / .020))
        wave = (.82 * np.sin(phase) * np.exp(-8.2 * t)
                + .49 * np.sin(1.62 * phase) * np.exp(-15 * t)
                + .31 * np.sin(2.31 * phase) * np.exp(-23 * t)
                + .20 * np.sin(3.11 * phase) * np.exp(-42 * t)
                + .28 * np.sin(3.96 * phase) * np.exp(-13 * t))
        attack, release = .010, .05
    elif kind == "drop":
        # A short rising bubble under a more stable, hollow partial.
        phase -= 2 * np.pi * freq * .0042 * (1 - np.exp(-t / .022))
        wave = (np.sin(phase) * np.exp(-8.3 * t)
                + .34 * np.sin(2.21 * phase) * np.exp(-18 * t))
        attack, release = .010, .085
    else:
        band = signal.butter(2, [520, 2240], btype="bandpass", fs=score.RATE, output="sos")
        air = signal.sosfilt(band, rng.normal(size=len(t)))
        wave = air * (.72 + .28 * np.sin(2 * np.pi * 4.7 * t))
        attack, release = .16, .24
    return wave * np.minimum(t / attack, 1) * np.minimum((seconds - t) / release, 1)


def court(note, bar):
    # A weighted first beat, then space for the answer in the room.
    bass = (43, 43, 41, 39, 41, 43)[bar]
    note("skin", 43, .018, .68, .49, .50)
    note("bow", bass, .09, 3.65, .25, .41)
    note("short_strings", bass + 24, .10, .75, .14, .42)
    note("bow", (58, 57, 56, 55, 57, 57)[bar], .62, 2.15, .15, .62)
    if bar in (0, 2, 4):
        note("skin", 52, 2.43, .40, .25, .55)
        note("pluck", bass + 19, 3.18, .67, .16, .69)
    if bar in (1, 3):
        note("skin", 47, 2, .50, .27, .51)
    if bar == 2:
        note("skin", 52, 2.91, .35, .18, .55)


def river(note, bar):
    # Drops move against slow triple time; their two-note question remains open.
    high = (69, 67, 69, 70, 67, 65, 67, 69, 67)[bar]
    lower = (62, 64, 65, 65, 62, 62, 64, 65, 64)[bar]
    root = (50, 48, 46, 46, 50, 43, 48, 46, 50)[bar]
    note("drop", high, .025 if bar % 2 == 0 else .38, .76, .35, .60)
    note("drop", lower, 1.12 if bar in (0, 3, 6) else 1.68, .69, .25, .41)
    note("rush", 0, .11 if bar % 2 == 0 else 1.09, 1.28, .16, .57)
    note("pluck", root, .42, 1.69, .31, .41)
    if bar in (1, 3, 5, 7):
        note("reed", lower, 1.04, 1.60, .15, .55)
    if bar in (2, 5, 7):
        note("drop", high + 2, 2.39, .57, .17, .63)


def render(name, bpm, meter, bars, perform, reflections, peak):
    beat = 60 / bpm
    mix = np.zeros((round(bars * meter * beat * score.RATE), 2))
    rng = np.random.default_rng(724)
    for bar in range(bars):
        def note(kind, pitch, at, beats, volume, pan):
            wave = voice(kind, pitch, beats * beat, rng) * volume
            score.place(mix, wave, (bar * meter + at) * beat, pan)
        perform(note, bar)
    dry = mix.copy()
    for delay, level in reflections:
        mix += level * np.roll(dry[:, ::-1], round(delay * score.RATE), axis=0)
    score.encode("palace-" + name, mix, peak)


if __name__ == "__main__":
    render("court", 64, 4, 6, court, ((.075, .10), (.147, .06)), .69)
    render("river", 81, 3, 9, river, ((.047, .11), (.121, .055)), .585)
