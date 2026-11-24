"""Original Marah and Elim chamber score. Render locally with the Red Sea instrument voices."""
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np

spec = spec_from_file_location("onyou_voices", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def record(name, bpm, meter, roots, perform):
    rng = np.random.default_rng(1522 + bpm)
    beat = 60 / bpm
    mix = np.zeros((round(len(roots) * meter * beat * score.RATE), 2))
    for bar, root in enumerate(roots):
        def note(voice, interval, at, beats, volume, pan=.5):
            wave = score.voice(voice, root + interval, beats * beat, rng) * volume
            score.place(mix, wave, (bar * meter + at) * beat, pan)
        perform(note, bar)
    dry = mix.copy()
    for seconds, level in ((.073, .12), (.177, .065)):
        mix += np.roll(dry[:, ::-1], round(seconds * score.RATE), axis=0) * level
    score.encode("wild-" + name, mix, peak=.66)


def road(note, bar):
    # Footfall-length spaces between the pairs of notes. Leave the last step unanswered.
    note("bow", 0, 0, 3.88, .19)
    for at in (0, .8, 2.5):
        note("pluck", 12 if at != .8 else 19, at, .6, .38, .32)
    if bar % 2 == 0:
        note("reed", (19, 17, 15)[bar // 2], 1.4, 1.15, .19, .66)


def bitter(note, bar):
    # A close interval and a broken pulse under the people waiting at the water.
    note("bow", 0, 0, 2.9, .21, .33)
    note("bow", 13, .13, 2.5, .15, .68)
    note("low_drum", 0, 0, .32, .42)
    note("pluck", 19, 1.55, .5, .38, .62)
    if bar % 2 == 0:
        note("reed", 20, .55, .6, .15)
        note("reed", 19, 1.35, .5, .15)


def water(note, bar):
    # The same opening fifth opens into a rising answer over the first ripple.
    note("bow", 0, 0, 3.92, .19)
    for at, pitch, pan in ((0, 12, .3), (.5, 19, .48), (1, 24, .67), (2.5, 16, .4)):
        note("pluck", pitch, at, 1.3, .42, pan)
    note("reed", [19, 21, 24, 23, 21, 19][bar], 1.65, 1.95, .24, .62)


def springs(note, bar):
    # Offset plucks answer across the springs, leaving room for water and footsteps.
    for at, pitch, pan in ((0, 7, .31), (.75, 16, .65), (1.5, 19, .39), (2.5, 24, .67)):
        note("pluck", pitch, at, 1.3, .37, pan)
    note("bow", 0, .04, 2.96, .17)
    if bar % 2 == 0:
        note("reed", (24, 21, 19, 16)[bar // 2], .65, 1.7, .18, .58)


def tents(note, bar):
    # Let the walking pulse settle; a long reed phrase carries across the bar.
    note("bow", 0, 0, 4.05, .18, .39)
    note("bow", 16, .24, 3.7, .13, .65)
    note("pluck", 7, 0, 1.65, .38, .30)
    note("pluck", 19, 2, 1.25, .25, .68)
    note("reed", (19, 16, 14, 12, 16, 14)[bar], .32, 2.88, .22, .55)


if __name__ == "__main__":
    record("road", 77, 4, [45, 43, 45, 41, 43, 40], road)
    record("bitter", 66, 3, [45, 45, 43, 45, 46, 45], bitter)
    record("water", 84, 4, [50, 43, 48, 43, 45, 50], water)
    record("springs", 89, 3, [50, 55, 50, 48, 43, 50, 55, 48], springs)
    record("tents", 63, 4, [50, 43, 48, 50, 43, 50], tents)
