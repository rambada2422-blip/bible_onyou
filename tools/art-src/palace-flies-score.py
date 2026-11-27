"""Original listening-station cues for Exodus 8:20–32.

Render with PYTHONDONTWRITEBYTECODE=1 python tools/art-src/palace-flies-score.py.
Both pieces share a three-note motif. The Egypt scene breaks it up between
short wing passes. At Goshen, a reed finishes the phrase over a breeze.
All voices are synthesized here or in the project's red-sea-score.py.
"""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def fly_pass(seconds, rng):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    progress = t / seconds
    frequency = rng.uniform(166, 188) + 13 * np.sin(np.pi * progress) - 19 * progress
    phase = 2 * np.pi * np.cumsum(frequency) / score.RATE
    shimmer = 1 + .17 * np.sin(2 * np.pi * 13 * t)
    wings = np.sin(phase) + .48 * np.sin(phase * 2) + .19 * np.sin(phase * 4)
    return wings * shimmer * np.sin(np.pi * progress) ** 2


def breeze(seconds, rng):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    band = signal.butter(2, [290, 1470], fs=score.RATE, btype="bandpass", output="sos")
    air = signal.sosfilt(band, rng.normal(size=len(t)))
    return air * np.sin(np.pi * t / seconds) ** 2


def house():
    # Seven eighths in groups of 2, 2 and 3. Leave a little space in the last
    # group so the circling wing sounds cross between the muted string notes.
    pulse = 60 / 180
    roots = (50, 50, 48, 50, 46, 48, 50, 45)
    mix = np.zeros((round(len(roots) * 7 * pulse * score.RATE), 2))
    rng = np.random.default_rng(824)

    for bar, root in enumerate(roots):
        start = 7 * bar * pulse
        for at, interval, length, gain, pan in (
            (.02, 0, 1.3, .30, .43), (1.54, 12, .46, .19, .56),
            (2.03, 14, .76, .23, .57), (4.01, 7, 1.1, .30, .42)
        ):
            wave = score.voice("pluck", root + interval, length * pulse, rng)
            score.place(mix, wave * gain, start + at * pulse, pan)
        answer = score.voice("short_strings", root + 19, .23, rng)
        score.place(mix, answer * .13, start + (5.48 if bar % 2 else 5.04) * pulse, .63)
        side = .36 if bar % 2 == 0 else .62
        score.place(mix, fly_pass(.71, rng) * .074, start + .06, side)
        if bar not in (2, 7):
            score.place(mix, fly_pass(.93, rng) * .059, start + 3.91 * pulse, 1 - side)

    mix += .055 * np.roll(mix[:, ::-1], round(.049 * score.RATE), axis=0)
    score.encode("palace-flies-house", mix, .49)


def goshen():
    beat = 60 / 56
    # One breath of melody per bar; the rests leave room to hear the field.
    phrases = ((50, 62, 1.88), (50, 64, 1.45), (55, 69, 2.27), (48, 67, 1.32),
               (50, 64, 2.06), (46, 62, 1.38), (48, 57, 1.92), (50, 62, 2.17))
    mix = np.zeros((round(len(phrases) * 3 * beat * score.RATE), 2))
    rng = np.random.default_rng(822)

    for bar, (root, melody, length) in enumerate(phrases):
        start = 3 * bar * beat
        reed = score.voice("reed", melody, length * beat, rng)
        entry = .04 if bar % 2 == 0 else .63
        score.place(mix, reed * .22, start + entry * beat, .56)
        low = score.voice("bow", root, 2.48 * beat, rng)
        score.place(mix, low * .088, start + .04, .40)
        if bar % 2 == 0:
            air = breeze(4.5 * beat, rng)
            score.place(mix, air * .095, start + .20, .34 if bar % 4 else .65)

    mix += .09 * np.roll(mix[:, ::-1], round(.142 * score.RATE), axis=0)
    score.encode("palace-flies-goshen", mix, .31)


if __name__ == "__main__":
    house()
    goshen()
