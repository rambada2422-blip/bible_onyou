"""Render the original EX-00 music with Python, NumPy, SciPy and FFmpeg."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def yard_sound(kind, pitch, seconds, rng):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    if kind == "step":
        # A foot settles and drags across grit after contact.
        grit = signal.sosfilt(
            signal.butter(2, [340, 1800], fs=score.RATE, btype="bandpass", output="sos"),
            rng.normal(size=len(t)))
        slide = np.clip((t - .09) / .105, 0, 1) * np.exp(-5.5 * np.maximum(0, t - .19))
        wave = ((np.sin(phase) + .42 * np.sin(2.7 * phase)) * np.exp(-13 * t)
                + .53 * grit * slide)
        attack, release = .019, .12
    else:
        # A damp brick settling against its wooden mould. No sharp high click.
        wave = (.72 * np.sin(phase) * np.exp(-14 * t)
                + .46 * np.sin(2.15 * phase) * np.exp(-19 * t)
                + .27 * np.sin(3.70 * phase) * np.exp(-29 * t))
        attack, release = .012, .065
    return wave * np.minimum(t / attack, 1) * np.minimum((seconds - t) / release, 1)


def pipe(pitch, seconds, rng):
    """A mellow stopped pipe with air before the sustained note."""
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    phase += .16 * np.sin(2 * np.pi * 4.4 * t) * (1 - np.exp(-1.9 * t))
    tone = np.sin(phase) + .17 * np.sin(3 * phase) + .035 * np.sin(5 * phase)
    air = signal.sosfilt(
        signal.butter(2, [630, 2450], fs=score.RATE, btype="bandpass", output="sos"),
        rng.normal(size=len(t)))
    tone *= np.clip((t - .045) / .145, 0, 1)
    air *= np.minimum(t / .049, 1) * (.095 + .27 * np.exp(-6 * t))
    return (tone + air) * np.minimum((seconds - t) / .25, 1)


def yard(note, bar):
    # The second step comes late or goes missing. Each bar has a different wait.
    roots = (40, 40, 43, 41, 40, 40)
    late_steps = (2.28, 2.69, 2.13, None, 2.42, None)
    root = roots[bar]
    note("step", 45, .015, .74, .48, .45)
    note("bow", root, .13, 3.29, .19, .43)
    note("brick", 55 if bar % 2 == 0 else 53, .92, .47, .48, .57)
    note("bow", 59 if bar in (0, 3, 5) else 60, 1.40, 1.74, .11, .61)
    if late_steps[bar]:
        note("step", 48, late_steps[bar], .72, .40, .56)
    if bar in (1, 3, 4):
        note("brick", 60, 3.38, .48, .29, .36)


def cry(note, bar):
    # The E–F interval in the workyard bass becomes a long woodwind call.
    # A quieter, lower answer leaves space around it, without a final cadence.
    phrases = (
        ((.045, 64, 1.62), (1.92, 65, .71)),
        ((.18, 62, 1.77),),
        ((.065, 60, 1.12), (1.49, 62, 1.19)),
        ((.44, 64, 1.8),),
        ((.08, 65, 1.45), (1.91, 64, .72)),
        ((.14, 62, 1.61),),
    )
    for offset, pitch, length in phrases[bar]:
        note("pipe", pitch, offset, length, .23, .55)
    root = (45, 43, 41, 40, 45, 45)[bar]
    note("bow", root, .27, 2.29, .19, .41)
    if bar in (1, 3, 5):
        note("bow", 55 if bar == 1 else 57, 1.36, 1.37, .105, .61)


def render(name, bpm, beats_per_bar, bars, perform, reflections, peak):
    beat = 60 / bpm
    mix = np.zeros((round(bars * beats_per_bar * beat * score.RATE), 2))
    rng = np.random.default_rng(223)
    for bar in range(bars):
        def note(kind, pitch, at, beats, volume, pan):
            seconds = beats * beat
            if kind in ("step", "brick"):
                wave = yard_sound(kind, pitch, seconds, rng)
            elif kind == "pipe":
                wave = pipe(pitch, seconds, rng)
            else:
                wave = score.voice(kind, pitch, seconds, rng)
            score.place(mix, wave * volume, (bar * beats_per_bar + at) * beat, pan)
        perform(note, bar)
    dry = mix.copy()
    for delay, level in reflections:
        mix += level * np.roll(dry[:, ::-1], round(delay * score.RATE), axis=0)
    score.encode("bondage-" + name, mix, peak)


if __name__ == "__main__":
    render("yard", 66, 4, 6, yard, ((.057, .085),), .725)
    render("cry", 54, 3, 6, cry, ((.125, .13), (.237, .07)), .238)
