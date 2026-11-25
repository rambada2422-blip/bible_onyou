"""Render the two original Rephidim game loops with Python, NumPy, SciPy and FFmpeg."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def rephidim_voice(kind, pitch, seconds, rng):
    if kind not in ("wood", "glass", "air"):
        return score.voice(kind, pitch, seconds, rng)
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    frequency = 440 * 2 ** ((pitch - 69) / 12)
    phase = 2 * np.pi * frequency * t
    if kind == "wood":
        # Hollow knock. Two shorter, off-pitch resonances colour the attack.
        wave = (np.sin(phase) * np.exp(-12 * t) +
                .39 * np.sin(2.33 * phase) * np.exp(-29 * t) +
                .16 * np.sin(4.23 * phase) * np.exp(-46 * t))
        attack, release = .008, .07
    elif kind == "glass":
        # A slight settling of the pitch and crossing partials soften the mallet.
        phase += .13 * (1 - np.exp(-22 * t))
        wave = (np.sin(phase) * np.exp(-2.6 * t) +
                .27 * np.sin(2.014 * phase) * np.exp(-4.2 * t) +
                .15 * np.sin(3.995 * phase) * np.exp(-7.4 * t))
        attack, release = .015, .14
    else:
        # Air passing an empty vessel, made from filtered noise alone.
        band = signal.butter(2, [320, 1140], fs=score.RATE, btype="bandpass", output="sos")
        wave = signal.sosfilt(band, rng.normal(size=len(t)))
        attack, release = .3, .42
    return wave * np.minimum(t / attack, 1) * np.minimum((seconds - t) / release, 1)


def dry_camp(note, bar):
    # Five eighths, grouped 3+2. The second knock suggests a reply, then waits.
    basses = (45, 45, 43, 43, 41, 45, 43, 41, 40, 45)
    bass = basses[bar]
    note("wood", 64, 0, .74, .53, .42)
    if bar not in (3, 9):
        note("wood", 62 if bar % 2 == 0 else 57, 1.5, .64, .39, .59)
    if bar in (2, 5, 7):
        note("wood", 69, 2.09, .34, .23, .60)
    note("bow", bass, .08, 2.22, .18, .40)
    if bar % 2 == 0:
        note("bow", 59, .78, 1.22, .10, .66)
    else:
        note("air", 0, .35, 1.68, .26, .57)


def flowing_water(note, bar):
    # Three dotted beats. A falling E–D gesture from the camp keeps flowing
    # through the next note; the strings above it can finish their phrase.
    voicings = ((48, 64, 62, 59), (43, 62, 59, 57), (45, 64, 62, 60), (41, 65, 64, 60),
                (48, 67, 64, 62), (41, 65, 64, 60), (43, 62, 59, 57), (48, 64, 62, 60))
    bass, high, middle, low = voicings[bar]
    note("glass", high, 0, 1.05, .40, .45)
    note("glass", middle, 1/3, .94, .25, .56)
    note("glass", low, 2/3, 1.18, .29, .66)
    note("pluck", bass, .01, 2.15, .51, .40)
    note("bow", bass + 7, .18, 2.75, .13, .64)
    if bar < 7:
        note("glass", middle, 1 + 2/3, 1.1, .24, .55)
        note("glass", high, 2 + 1/3, 1.0, .22, .45)
    melody = (67, 69, 72, 69, 71, 69, 67, 64)[bar]
    note("bow", melody, 1.05, 1.90, .18, .53)
    if bar == 7:
        note("glass", 60, 1.42, 1.52, .25, .53)


def render(name, bars, meter, perform, reflections, peak):
    beat = 60 / 72
    mix = np.zeros((round(bars * meter * beat * score.RATE), 2))
    rng = np.random.default_rng(1706)
    for bar in range(bars):
        def note(kind, pitch, at, beats, volume, pan):
            wave = rephidim_voice(kind, pitch, beats * beat, rng)
            score.place(mix, wave * volume, (bar * meter + at) * beat, pan)
        perform(note, bar)
    dry = mix.copy()
    for seconds, level in reflections:
        mix += level * np.roll(dry[:, ::-1], round(seconds * score.RATE), axis=0)
    score.encode(name, mix, peak)


if __name__ == "__main__":
    render("wild-rock-dry", 10, 2.5, dry_camp, ((.049, .055),), .69)
    render("wild-rock-flow", 8, 3, flowing_water, ((.117, .135), (.281, .08)), .72)
