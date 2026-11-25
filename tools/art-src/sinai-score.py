"""Render the original 30-second Sinai observation loop with Python, NumPy, SciPy and FFmpeg."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def metal(pitch, seconds):
    """Soft mallet on a suspended plate. Each mode rings for a different time."""
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    partials = ((1, .68, 1.4), (1.49, .34, 1.9), (2.69, .19, 2.3), (3.86, .11, 3.5))
    wave = sum(level * np.sin(ratio * phase) * np.exp(-decay * t)
               for ratio, level, decay in partials)
    return wave * np.minimum(t / .035, 1) * np.minimum((seconds - t) / .23, 1)


def render():
    beat = 60 / 64
    bar = 4 * beat
    mix = np.zeros((round(8 * bar * score.RATE), 2))
    rng = np.random.default_rng(1903)

    def play(voice, pitch, bar_number, offset, beats, volume, pan):
        seconds = beats * beat
        if voice == "metal":
            wave = metal(pitch, seconds)
        else:
            wave = score.voice(voice, pitch, seconds, rng)
        if voice == "horn":
            # A distant, breath-length horn. Soften both the onset and the release.
            t = np.arange(len(wave)) / score.RATE
            wave *= np.minimum(t / .26, 1) * np.minimum((seconds - t) / .53, 1)
        score.place(mix, volume * wave, bar_number * bar + offset * beat, pan)

    # A D pedal and falling seconds tighten as the cloud appears. The final
    # two bars leave the open fifth and space to look at the people below.
    basses = (38, 38, 34, 36, 38, 31, 38, 38)
    upper = (57, 55, 57, 58, 57, 55, 52, 50)
    for i, bass in enumerate(basses):
        weight = (1, 1.03, 1.10, 1.16, 1.1, .91, .73, .49)[i]
        play("bow", bass, i, 0, 4.05, .27 * weight, .45)
        play("bow", upper[i], i, .22, 3.65, .11 * weight, .65)
        if i in (2, 3, 4):
            for offset in (.35, 1.85, 2.85):
                play("short_strings", bass + 12, i, offset, .66, .22, .35)

    for i, at, pitch, length, level in (
            (0, .04, 50, 2.55, .29), (1, .53, 48, 1.18, .26),
            (1, 2.0, 45, 1.65, .32), (3, .22, 50, 2.32, .32),
            (4, .12, 53, 1.35, .36), (4, 1.82, 52, 1.93, .34),
            (5, .54, 50, 2.65, .29), (6, .36, 45, 2.72, .19)):
        play("horn", pitch, i, at, length, level, .52)
    for i, at, pitch, level in ((0, 0, 62, .29), (2, 2.4, 60, .21), (3, 3.52, 65, .19),
                                (4, 1.81, 64, .17), (6, 2.5, 57, .16), (7, .82, 62, .14)):
        play("metal", pitch, i, at, 2.75, level, .39)

    t = np.arange(len(mix)) / score.RATE
    swell = .5 - .5 * np.cos(2 * np.pi * t / (8 * bar))
    edge = np.clip(np.minimum(t, t[-1] - t) / .18, 0, 1)
    wind_band = signal.butter(2, [180, 870], fs=score.RATE, btype="bandpass", output="sos")
    for channel in range(2):
        wind = signal.sosfilt(wind_band, rng.normal(size=len(t)))
        mix[:, channel] += wind * (.033 + .095 * swell) * edge
    dry = mix.copy()
    for delay, level in ((.126, .13), (.268, .079), (.447, .039)):
        mix += level * np.roll(dry[:, ::-1], round(delay * score.RATE), axis=0)
    score.encode("wild-sinai-witness", mix, peak=.585)


if __name__ == "__main__":
    render()
