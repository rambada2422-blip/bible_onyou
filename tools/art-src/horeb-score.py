"""Horeb pasture music and close-up fire ambience. Render with NumPy, SciPy and FFmpeg.

The melody, bell model and arrangement were written for this game. All tones
and air are synthesized here or in red-sea-score.py, with no source recordings.
Use --embers-only to render just the quiet fire for Exodus 3:2–3.
"""
import argparse
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np
from scipy import signal

spec = spec_from_file_location("onyou_score", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def flock_bell(pitch, seconds):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    modes = ((1, .62, 7.1), (1.82, .32, 9.0), (2.53, .23, 11.1), (3.26, .11, 15.0))
    wave = sum(weight * np.sin(phase * ratio) * np.exp(-decay * t)
               for ratio, weight, decay in modes)
    return wave * np.minimum(t / .014, 1) * np.minimum((seconds - t) / .11, 1)


def wind_reed(pitch, seconds, rng):
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    phase += .12 * np.sin(2 * np.pi * 4.1 * t) * (1 - np.exp(-2 * t))
    partials = np.sin(phase) + .20 * np.sin(2 * phase) + .13 * np.sin(3 * phase)
    band = signal.butter(2, [770, 3010], btype="bandpass", fs=score.RATE, output="sos")
    air = signal.sosfilt(band, rng.normal(size=len(t)))
    wave = (partials * np.clip((t - .038) / .105, 0, 1)
            + air * (.075 + .30 * np.exp(-7 * t)) * np.minimum(t / .04, 1))
    return wave * np.minimum((seconds - t) / .21, 1)


def render():
    # Open strings carry the contours of the hill. The woodwind has room to
    # breathe between short calls, above the unhurried bell on beats one and three.
    roots = (43, 45, 48, 50, 43, 52, 48, 43)
    calls = (
        ((.08, 69, .71), (1.05, 67, 1.43), (2.86, 62, .83)),
        ((.60, 64, 1.22), (2.29, 67, 1.18)),
        ((.08, 69, 1.21), (1.61, 72, .64), (2.64, 69, 1.0)),
        ((.41, 67, .90), (1.75, 62, 1.65)),
        ((.12, 64, .84), (1.31, 67, .65), (2.32, 69, 1.18)),
        ((.46, 71, 1.31), (2.16, 67, 1.28)),
        ((.02, 69, .72), (1.06, 67, 1.20), (2.83, 64, .77)),
        ((.39, 62, 1.05), (1.95, 67, 1.27)),
    )
    beat = 60 / 75
    mix = np.zeros((round(len(roots) * 4 * beat * score.RATE), 2))
    rng = np.random.default_rng(301)
    for bar, root in enumerate(roots):
        def play(kind, pitch, beat_in_bar, beats, volume, pan):
            seconds = beats * beat
            if kind == "bell":
                wave = flock_bell(pitch, seconds)
            elif kind == "wind_reed":
                wave = wind_reed(pitch, seconds, rng)
            else:
                wave = score.voice(kind, pitch, seconds, rng)
            score.place(mix, wave * volume, (4 * bar + beat_in_bar) * beat, pan)

        play("bell", 74, .02, .80, .27, .40)
        play("bell", 67, 2.0, .72, .20, .64)
        play("pluck", root, .05, 1.75, .43, .39)
        play("bow", root + 7, .24, 3.51, .105, .59)
        if bar % 2 == 0:
            play("pluck", root + 14, 2.51, 1.13, .24, .66)
        for at, pitch, length in calls[bar]:
            play("wind_reed", pitch, at, length, .20, .52)

    dry = mix.copy()
    for delay, level in ((.078, .105), (.193, .065)):
        mix += level * np.roll(dry[:, ::-1], round(delay * score.RATE), axis=0)
    score.encode("horeb-flock", mix, peak=.565)


def render_embers():
    seconds = 10.5
    size = round(seconds * score.RATE)
    rng = np.random.default_rng(302)
    t = np.arange(size) / score.RATE
    wind_band = signal.butter(2, [105, 640], btype="bandpass", fs=score.RATE, output="sos")
    hiss_band = signal.butter(2, [520, 1600], btype="bandpass", fs=score.RATE, output="sos")
    common = signal.sosfilt(wind_band, rng.normal(size=size))
    swell = .8 + .11 * np.sin(2 * np.pi * t / seconds) + .09 * np.sin(6 * np.pi * t / seconds)
    mix = np.empty((size, 2))
    for channel in range(2):
        hush = signal.sosfilt(hiss_band, rng.normal(size=size))
        mix[:, channel] = (.71 * common + .12 * hush) * swell

    # The tiny clusters are noise transients, with neither a tuned nor a regular pulse.
    at = .22
    while at < seconds - .52:
        cluster_size = rng.choice((1, 2, 3), p=(.47, .42, .11))
        for _ in range(cluster_size):
            duration = rng.uniform(.024, .076)
            age = np.arange(round(duration * score.RATE)) / score.RATE
            band = signal.butter(2, [rng.uniform(470, 850), rng.uniform(1750, 3200)],
                                 btype="bandpass", fs=score.RATE, output="sos")
            crackle = signal.sosfilt(band, rng.normal(size=len(age)))
            envelope = np.minimum(age / .003, 1) * np.exp(-age * rng.uniform(49, 83))
            envelope *= np.minimum((duration - age) / .008, 1)
            score.place(mix, crackle * envelope * rng.uniform(.5, 1.2), at, rng.uniform(.30, .70))
            at += rng.uniform(.045, .12)
        at += rng.uniform(.28, .92)

    # Only the first/last 24 ms taper, so the low air continues naturally on repeat.
    edge = np.clip(np.minimum(t, t[-1] - t) / .024, 0, 1)
    mix *= (.5 - .5 * np.cos(np.pi * edge))[:, None]
    score.encode("horeb-embers", mix, peak=.215)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--embers-only", action="store_true")
    if not parser.parse_args().embers_only:
        render()
    render_embers()
