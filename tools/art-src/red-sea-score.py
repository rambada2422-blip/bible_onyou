"""Render Bible Onyou's original Red Sea loops. No external samples or instrument bank.
Run with Python, NumPy, SciPy and ffmpeg when changing the score, outside the web build.
"""
from pathlib import Path
import subprocess

import numpy as np
from scipy import signal

RATE = 32000
DEST = Path(__file__).resolve().parents[2] / 'web/assets/audio/score'
# Each bar gives a bass note, a three-note voicing and the reed's (beat, pitch, length) phrase.
COAST = [
    (38, (57, 62, 64), [(1.5, 69, 1.1)]),
    (38, (55, 62, 65), [(0, 67, .8), (2.5, 62, .8)]),
    (34, (53, 58, 64), []),
    (36, (55, 60, 62), [(1, 64, .6), (2, 65, 1.3)]),
    (38, (57, 62, 65), [(1.5, 69, 1.5)]),
    (41, (55, 60, 65), [(0, 72, .6), (1, 69, 1.4)]),
    (36, (55, 62, 64), [(2, 67, 1.1)]),
    (45, (57, 60, 64), [(0, 64, 1.5)]),
]
PASSAGE = [
    (38, (53, 57, 64), [(0, 62, .8), (1.5, 65, .75), (2.5, 69, 1.1)]),
    (41, (53, 60, 67), [(0, 72, 1.7), (2.5, 69, .9)]),
    (43, (55, 62, 67), [(1, 67, 1), (2.5, 74, 1)]),
    (36, (55, 60, 64), [(0, 72, 2.1)]),
    (34, (53, 58, 65), [(1, 65, .6), (2, 69, .6), (3, 72, .7)]),
    (41, (57, 60, 65), [(0, 77, 1.6), (2, 74, 1.2)]),
    (43, (55, 58, 62), [(0, 72, .8), (1.5, 67, 1.1)]),
    (45, (55, 57, 64), [(0, 69, 1.6), (2.5, 64, .8)]),
]
MORNING = [
    (41, (57, 60, 65), [(0, 69, .8), (1, 72, .4), (1.5, 74, 1)]),
    (36, (55, 60, 64), [(0, 72, 1.5), (2, 67, .65)]),
    (38, (57, 62, 65), [(0, 69, 1.6)]),
    (34, (53, 58, 62), [(1, 65, .5), (2, 67, .65)]),
    (41, (57, 60, 65), [(0, 69, .65), (1, 72, .5), (2, 77, .65)]),
    (43, (55, 58, 62), [(0, 74, 1.7), (2, 72, .65)]),
    (36, (55, 60, 64), [(0, 67, 1), (1.5, 69, .5), (2, 67, .65)]),
    (41, (53, 57, 60), [(0, 65, 1.8)]),
]


def voice(kind, note, length, rng):
    t = np.arange(round(length * RATE)) / RATE
    freq = 440 * 2 ** ((note - 69) / 12)
    phase = 2 * np.pi * freq * t
    if kind == 'pluck':
        # A plucked string's upper partials fall away before its fundamental.
        wave = sum(np.sin(phase * h * (1 + .00009*h*h)) * np.sin(.39*h) / h
                   * np.exp(-t * (1.8 + .7*h)) for h in range(1, 11))
        attack, release = .005, .09
    elif kind == 'short_strings':
        wave = np.zeros_like(t)
        for detune in (.996, 1.002):
            p = phase*detune + .045*np.sin(29*t)
            wave += sum(np.sin(h*p)/h**1.3 for h in range(1,9))*.44
        wave *= np.exp(-4*t)
        attack, release = .012, .045
    elif kind == 'hoof':
        # Hollow clop and a short, bright contact against hard ground.
        p = phase + 2*np.pi*.012*freq*(1-np.exp(-t/.016))
        knock = np.sin(p)+.48*np.sin(1.78*p)+.22*np.sin(2.93*p)
        grit = signal.sosfilt(signal.butter(2,[850,2800],fs=RATE,btype='bandpass',output='sos'),
                              rng.normal(size=len(t)))
        wave = knock*np.exp(-39*t)+.58*grit*np.exp(-87*t)
        attack, release = .002, .016
    elif kind == 'low_drum':
        p = phase + 2*np.pi*.035*freq*(1-np.exp(-t/.038))
        wave = (.90*np.sin(p)+.27*np.sin(2.27*p)+.19*np.sin(3.8*p))*np.exp(-11*t)
        attack, release = .003, .045
    elif kind == 'horn':
        p = phase + .07*np.sin(25*t)
        wave = np.sin(p)+.40*np.sin(2*p)+.22*np.sin(3*p)+.10*np.sin(4*p)
        attack, release = .05, .09
    elif kind == 'reed':
        breath = signal.sosfilt(signal.butter(2, [900, 3600], btype='bandpass', fs=RATE, output='sos'),
                                rng.normal(0, .035, len(t)))
        p = phase + .25 * np.sin(2*np.pi*4.8*t) * (1 - np.exp(-3*t))
        wave = (.77*np.sin(p)+.17*np.sin(2*p)+.09*np.sin(3*p)+breath) * (1+.06*np.sin(13*t))
        attack, release = .12, .19
    else:
        wave = np.zeros_like(t)
        for detune in (.997, 1, 1.003):
            p = phase * detune + .15*np.sin(2*np.pi*4.3*t+rng.uniform(0, 6))
            wave += (np.sin(p)+.25*np.sin(2*p)+.13*np.sin(3*p)+.055*np.sin(5*p))/3
        attack, release = .25, .45
    return wave * np.minimum(t/attack, 1) * np.minimum((length-t)/release, 1)


def place(mix, wave, start, pan):
    stereo = wave[:, None] * [np.cos(pan*np.pi/2), np.sin(pan*np.pi/2)]
    pos = round(start*RATE) % len(mix)
    n = min(len(wave), len(mix)-pos)
    mix[pos:pos+n] += stereo[:n]
    if n < len(wave):
        mix[:len(wave)-n] += stereo[n:]


def encode(name, mix, peak=.78):
    mix *= peak/np.max(np.abs(mix))
    subprocess.run(['ffmpeg','-loglevel','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i','pipe:0',
                    '-c:a','libmp3lame','-b:a','112k','-map_metadata','-1',str(DEST/(name+'.mp3'))],
                   input=mix.astype('<f4').tobytes(), check=True)


def render(name, bars, bpm, beats, pattern, seed):
    rng = np.random.default_rng(seed)
    beat = 60/bpm
    size = round(len(bars)*beats*beat*RATE)
    mix = np.zeros((size, 2))
    def add(kind, note, start, length, level, pan):
        place(mix, voice(kind,note,length,rng)*level, start, pan)
    for i, (bass, chord, tune) in enumerate(bars):
        start = i*beats*beat
        add('bow', bass, start, beats*beat+.24, .21, .48)
        for n in (0, 2):
            add('bow', chord[n], start+.06*n, beats*beat+.16, .07, .25+.22*n)
        for j, (offset, idx) in enumerate(pattern):
            add('pluck', chord[idx], start+offset*beat+rng.uniform(0,.017), 1.5,
                (.60 if j==0 else .43)*rng.uniform(.87,1.10), .24+.14*(j%4))
        for offset, note, duration in tune:
            add('reed', note, start+offset*beat+.025, duration*beat+.10, .21, .63)
    # Quiet, irregular shoreline wash; in the passage a narrower band suggests wind.
    t = np.arange(size)/RATE
    phase = t/(size/RATE)*2*np.pi
    swell = (.5+.5*np.sin(3*phase+.7*np.sin(phase)))**2
    edge = np.minimum(1,np.minimum(t,(size-1)/RATE-t)/.12)
    band = [180, 770] if name.endswith('passage') else [430, 2400]
    shore_filter = signal.butter(2, band, btype='bandpass', fs=RATE, output='sos')
    for channel in range(2):
        air = signal.sosfilt(shore_filter, rng.normal(size=size))
        mix[:,channel] += air * (.015+.065*swell) * edge
    # Wrap a short stereo room tail around the loop boundary.
    for channel in range(2):
        time = np.arange(round(.84*RATE)) / RATE
        tail = rng.normal(size=len(time))*np.exp(-7.8*time)
        tail = signal.sosfilt(signal.butter(2, 2800, fs=RATE, output='sos'), tail)
        tail[:round(.026*RATE)] = 0
        tail *= .14/np.sqrt(np.sum(tail*tail))
        wet = signal.fftconvolve(mix[:,channel], tail)
        mix[:,channel] += wet[:size]
        mix[:len(wet)-size,channel] += wet[size:]
    encode(name,mix)


def render_chase():
    # Twelve bars. A dry three-contact gallop is audible on the very first beat.
    rng = np.random.default_rng(1410)
    beat = 60/144
    roots = [38,38,39,45,38,41,43,45,46,43,39,45]
    mix = np.zeros((round(len(roots)*4*beat*RATE), 2))
    def hit(kind, pitch, at, length, level, pan):
        place(mix, voice(kind,pitch,length,rng)*level, at*beat, pan)
    for bar,root in enumerate(roots):
        start = 4*bar
        intensity = (.79,.87,1)[bar//4]
        for stride in range(4):
            side = .28 if stride%2==0 else .65
            for contact,(offset,pitch,weight) in enumerate(((0,55,.55),(.24,61,.39),(.52,57,.47))):
                if bar%4==3 and stride==3 and contact==2:
                    continue
                at = start+stride+offset+(rng.uniform(0,.015) if offset else 0)
                hit('hoof',pitch+rng.uniform(-1,1),at,.105,weight*intensity,side+.038*contact)
        for offset,pitch,weight in ((0,root,.80),(1.5,root+7,.42),(2,root,.69),(3.5,root+7,.51)):
            hit('low_drum',pitch, start+offset,.31,weight,.49)
        for offset,interval in ((0,12),(.5,19),(1.25,12),(1.75,13),(2,12),(2.5,19),(3.25,15)):
            hit('short_strings',root+interval,start+offset,.14,.43*intensity,.35)
        if bar%4 in (1,3):
            for offset,interval in ((.75,24),(2.5,22),(3.25,19)):
                hit('short_strings',root+interval,start+offset,.17,.32,.71)
        if bar in (2,6,8,10):
            hit('horn',root+19,start+.5,.56,.29,.60)
            hit('horn',root+18,start+2.75,.25,.25,.60)
    # Short outdoor reflections keep the attack clear on a phone speaker.
    dry = mix.copy()
    for delay,level in ((.046,.135),(.092,.075),(.157,.038)):
        mix += level*np.roll(dry[:,::-1],round(delay*RATE),axis=0)
    encode('red-sea-chase',mix)


if __name__ == '__main__':
    DEST.mkdir(parents=True,exist_ok=True)
    render('red-sea-coast',COAST,66,4,[(0,0),(1.5,1),(3.25,0)],619)
    render('red-sea-passage',PASSAGE,78,4,[(0,0),(.75,1),(1.5,2),(2.5,1),(3.25,2)],907)
    render('red-sea-morning',MORNING,79,3,[(0,0),(1,2),(1.5,1),(2.5,2)],123)
    render_chase()
