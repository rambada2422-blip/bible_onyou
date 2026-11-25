"""Original wilderness music. Use --manna for the morning or --sabbath for the two days."""
import argparse
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

import numpy as np

spec = spec_from_file_location("onyou_voices", Path(__file__).with_name("red-sea-score.py"))
score = module_from_spec(spec)
spec.loader.exec_module(score)


def camp_voice(kind, pitch, seconds, rng):
    if kind not in ("clay", "flute"):
        return score.voice(kind, pitch, seconds, rng)
    t = np.arange(round(seconds * score.RATE)) / score.RATE
    frequency = 440 * 2 ** ((pitch - 69) / 12)
    phase = 2 * np.pi * frequency * t
    if kind == "clay":
        # A pitched hollow strike, with a brief wash of upper, inharmonic modes.
        wave = (np.sin(phase) * np.exp(-10 * t)
                + .44 * np.sin(phase * 2.71) * np.exp(-20 * t)
                + .25 * np.sin(phase * 4.13) * np.exp(-37 * t))
        attack, release = .004, .045
    else:
        phase += .16 * np.sin(2 * np.pi * 4.3 * t) * (1 - np.exp(-2 * t))
        wave = np.sin(phase) + .12 * np.sin(2 * phase) + .07 * np.sin(3 * phase)
        wave *= .97 + .03 * np.sin(2 * np.pi * 1.13 * t)
        attack, release = .15, .25
    return wave * np.minimum(t / attack, 1) * np.minimum((seconds - t) / release, 1)


def record(name, bpm, meter, roots, perform, peak=.66):
    rng = np.random.default_rng(1522 + bpm)
    beat = 60 / bpm
    mix = np.zeros((round(len(roots) * meter * beat * score.RATE), 2))
    for bar, root in enumerate(roots):
        def note(voice, interval, at, beats, volume, pan=.5):
            wave = camp_voice(voice, root + interval, beats * beat, rng) * volume
            score.place(mix, wave, (bar * meter + at) * beat, pan)
        perform(note, bar)
    dry = mix.copy()
    for seconds, level in ((.073, .12), (.177, .065)):
        mix += np.roll(dry[:, ::-1], round(seconds * score.RATE), axis=0) * level
    score.encode("wild-" + name, mix, peak=peak)


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


# Four views follow the same family of pitches (D, E, F sharp, A, B).
# The sustained open fifth, bright plucked answer, hand rhythm and closing duet
# each have their own entrance so a player can turn the observation lens either way.
def morning_dew(note, bar):
    note("bow", 0, 0, 4.15, .20, .43)
    note("bow", 7, .12, 3.65, .09, .62)
    if bar in (0, 2, 4):
        note("reed", (19, 16, 14)[bar // 2], .24, 2.25, .16, .60)
        note("pluck", 26, 3.20, 1.25, .12, .32)
    else:
        note("reed", 14, .56, .98, .16, .60)
        note("reed", 12, 1.82, 1.66, .18, .57)


def morning_grain(note, bar):
    # Two plucked registers act like a single struck harmonic, then answer to the left.
    top = (24, 23, 24, 26, 24, 21, 26, 24)[bar]
    note("pluck", top, 0, 1.42, .52, .53)
    note("pluck", top + 12, .028, 1.06, .21, .67)
    note("pluck", 19, .64, 1.12, .28, .30)
    note("short_strings", 0, .99, .67, .22, .40)
    if bar % 2 == 0:
        note("pluck", 14, 1.64, .87, .25, .36)
        note("pluck", 19, 2.13, 1.22, .31, .54)
    else:
        note("reed", 12, 1.39, 1.44, .16, .57)


def morning_gather(note, bar):
    # Two interlocking figures work across a four-beat bar in a 3+3+2 grouping.
    for at, pitch, weight in ((0, 0, .38), (1.5, 7, .33), (3, 12, .28)):
        note("short_strings", pitch, at, .48, weight, .36)
        note("low_drum", 0, at, .28, weight * .68, .49)
    for at, pitch in ((.5, 12), (1.25, 19), (2.25, 16), (2.75, 12)):
        note("pluck", pitch, at, .58, .34, .64)
    if bar in (1, 3, 5, 7):
        note("reed", (19, 16, 21, 14)[bar // 2], .75, 1.34, .19, .51)
        note("pluck", 19, 3.52, .58, .29, .66)


def morning_measure(note, bar):
    # Two voices resolve the questioning opening motif together. The last reed note
    # carries over the bar line while the work rhythm gives way to breathing room.
    note("bow", 0, 0, 3.18, .19, .44)
    note("pluck", 7, .04, 1.48, .42, .32)
    melody = ((19, 16), (19, 21), (16, 14), (19, 16), (14, 16), (14, 12))[bar]
    note("reed", melody[0], .12, .91, .23, .63)
    note("reed", melody[1], 1.2, 1.91, .22, .64)
    note("bow", (12, 16, 7, 12, 7, 4)[bar], 1.18, 1.96, .14, .37)


def render_manna():
    record("manna-dew", 72, 4, [50, 50, 55, 45, 47, 50], morning_dew, peak=.32)
    record("manna-grain", 96, 3, [50, 55, 47, 45, 50, 43, 45, 50], morning_grain, peak=.75)
    record("manna-gather", 106, 4, [50, 55, 50, 45, 47, 55, 45, 50], morning_gather, peak=.63)
    record("manna-measure", 64, 3, [50, 43, 47, 50, 45, 50], morning_measure, peak=.41)


def sixth_day(note, bar):
    # The two strong beats divide into threes. A rising second falls a fourth.
    if bar % 2 == 0:
        for at, pitch, level in ((0, 24, .43), (1/3, 26, .30), (2/3, 21, .37)):
            note("clay", pitch, at, .43, level, .42)
    note("pluck", 0, 0, .95, .47, .45)
    note("low_drum", 0, 1, .29, .31, .5)
    note("short_strings", 7, 1, .43, .31, .36)
    if bar % 2 == 0:
        note("pluck", 16, 1 + 2/3, .46, .36, .65)
    else:
        note("flute", 19 if bar % 4 == 1 else 16, 0, .88, .21, .59)
        note("clay", 12, 1, .45, .31, .61)
        note("clay", 19, 1 + 1/3, .42, .27, .63)
        if bar % 4 == 1:
            note("pluck", 14, 1 + 2/3, .47, .29, .34)


def seventh_day(note, bar):
    # The same three pitches now occupy two bars with breath between phrases.
    note("bow", 0, 0, 3.72, .17, .43)
    if bar % 2 == 0:
        note("flute", 24, .15, 1.47, .26, .54)
        note("flute", 26, 2.11, 1.12, .21, .56)
        note("pluck", 7, 3.28, .61, .14, .34)
    else:
        note("flute", 21, .08, 2.08, .23, .54)
        note("bow", 7, .15, 2.30, .10, .65)
        # The final bar leaves a little clear air before the loop begins again.
        if bar == 5:
            note("flute", 19, 2.74, .78, .15, .54)


def render_sabbath():
    record("sabbath-sixth", 100, 2, [43, 48, 40, 50, 43, 47, 48, 50,
                                     43, 48, 40, 45, 48, 50, 43, 43], sixth_day, peak=.74)
    record("sabbath-rest", 68, 4, [43, 43, 48, 48, 43, 43], seventh_day, peak=.28)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--manna", action="store_true")
    group.add_argument("--sabbath", action="store_true")
    args = parser.parse_args()
    if args.manna:
        render_manna()
    elif args.sabbath:
        render_sabbath()
    else:
        record("road", 77, 4, [45, 43, 45, 41, 43, 40], road)
        record("bitter", 66, 3, [45, 45, 43, 45, 46, 45], bitter)
        record("water", 84, 4, [50, 43, 48, 43, 45, 50], water)
        record("springs", 89, 3, [50, 55, 50, 48, 43, 50, 55, 48], springs)
        record("tents", 63, 4, [50, 43, 48, 50, 43, 50], tents)
