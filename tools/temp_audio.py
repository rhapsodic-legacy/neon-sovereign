"""Temp audio for the Pink Wyvern grey-box animatic.

Makes placeholder WAVs (numpy only): a 120 bpm synth rock riff standing in for the Wildfires'
song, crowd walla, the count-in, mop slaps, a spill, the door and the stranger's low note.
The real song (Suno stems) and ElevenLabs voices replace all of this later.

Usage: python3 tools/temp_audio.py godot/wyvern/audio
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
BEAT = 0.5  # 120 bpm
LENGTH = 128.0  # seconds; the animatic runs about 2:05
MUSIC_START = 3.0  # the lights slam on here
BREAK = (41.0, 59.0)  # the band stops so Roxy can do her pep talk
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def bandpass_noise(n, lo, hi):
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    out = np.fft.irfft(spec, n)
    return out / (np.abs(out).max() + 1e-9)


def env(n, attack, decay):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def add(buf, at, sig, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw(freq, sec, harmonics=12):
    t = t_axis(sec)
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        out += np.sin(2 * np.pi * freq * k * t) / k
    return out * 0.6


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    freq = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9)


def snare():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    return (bandpass_noise(n, 1500, 9000) * 0.8 + np.sin(2 * np.pi * 190 * t) * 0.4) * np.exp(-t * 18)


def hat():
    n = int(0.06 * SR)
    return bandpass_noise(n, 7000, 16000) * env(n, 0.001, 0.015)


def music():
    buf = np.zeros(int(LENGTH * SR))
    # A minor rock progression, one bar (4 beats) per chord: Am F C G
    roots = [45, 41, 48, 43]
    lead = [69, 72, 76, 72, 74, 72, 69, 67]  # an eight-note hook over two bars
    t = MUSIC_START
    bar = 0
    while t < LENGTH - 2:
        in_break = BREAK[0] <= t < BREAK[1]
        if not in_break:
            root = roots[bar % 4]
            for b in range(4):
                bt = t + b * BEAT
                add(buf, bt, kick(), 0.9 if b % 2 == 0 else 0.0)
                if b % 2 == 1:
                    add(buf, bt, snare(), 0.55)
                for h in range(2):
                    add(buf, bt + h * BEAT / 2, hat(), 0.18)
                # driving eighth-note bass
                for h in range(2):
                    s = saw(note_hz(root), BEAT / 2 * 0.95, 8) * env(int(BEAT / 2 * 0.95 * SR), 0.003, 0.2)
                    add(buf, bt + h * BEAT / 2, s, 0.35)
            # power-chord stab on the one, held for the bar
            for iv in (0, 7, 12):
                s = saw(note_hz(root + 12 + iv), 4 * BEAT, 10) * env(int(4 * BEAT * SR), 0.01, 1.4)
                add(buf, t, s, 0.12)
            # the hook, as a stand-in for Roxy's vocal line
            if bar % 8 >= 4:
                for k in range(4):
                    m = lead[(bar % 2) * 4 + k]
                    s = saw(note_hz(m), BEAT * 0.9, 6) * env(int(BEAT * 0.9 * SR), 0.02, 0.5)
                    add(buf, t + k * BEAT, s, 0.16)
        t += 4 * BEAT
        bar += 1
    # an amp-feedback tail into the break
    add(buf, BREAK[0], np.sin(2 * np.pi * 880 * t_axis(2.5)) * env(int(2.5 * SR), 0.05, 0.8), 0.08)
    return buf


def crowd():
    n = int(LENGTH * SR)
    base = bandpass_noise(n, 250, 2500)
    # slow random swells so it reads as people, not hiss
    k = int(LENGTH * 3)
    swell = np.interp(np.arange(n), np.linspace(0, n, k), 0.6 + 0.4 * rng.random(k))
    level = np.interp(np.arange(n) / SR, [0, 0.5, 2.8, 3.0, 6, 128], [0, 0.25, 0.35, 1.0, 0.55, 0.55])
    out = base * swell * level * 0.25
    roar = bandpass_noise(int(4 * SR), 300, 4000) * env(int(4 * SR), 0.05, 1.2)
    add(out, 3.0, roar, 0.5)
    for at in (8.5, 44.6, 59.0, 66.0, 92.0):
        add(out, at, bandpass_noise(int(2.5 * SR), 400, 3500) * env(int(2.5 * SR), 0.1, 0.7), 0.3)
    return out


def click():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 120)


def mop():
    n = int(0.45 * SR)
    return bandpass_noise(n, 150, 1800) * env(n, 0.005, 0.09)


def spill():
    n = int(0.8 * SR)
    return bandpass_noise(n, 600, 5000) * env(n, 0.01, 0.2)


def door():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    creak = np.sin(2 * np.pi * (180 + 60 * np.sin(t * 7)) * t) * env(n, 0.2, 0.6) * 0.4
    thud = np.sin(2 * np.pi * 70 * t) * np.exp(-(t - 1.2).clip(0) * 12) * (t > 1.2)
    return creak + thud * 0.7


def low_note():
    sec = 12.0
    t = t_axis(sec)
    tone = np.sin(2 * np.pi * 55 * t) + 0.3 * np.sin(2 * np.pi * 110.4 * t) + 0.15 * np.sin(2 * np.pi * 164.6 * t)
    fade = np.clip(t / 2.5, 0, 1) * np.clip((sec - t) / 2.0, 0, 1)
    return tone * fade * 0.5


def clap():
    n = int(0.2 * SR)
    return bandpass_noise(n, 900, 6000) * env(n, 0.001, 0.03)


def write(path, sig):
    sig = sig / max(1.0, np.abs(sig).max() / 0.95)
    data = (sig * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "godot/wyvern/audio")
    out.mkdir(parents=True, exist_ok=True)
    write(out / "music_temp.wav", music())
    write(out / "crowd_temp.wav", crowd())
    write(out / "click.wav", click())
    write(out / "mop.wav", mop())
    write(out / "spill.wav", spill())
    write(out / "door.wav", door())
    write(out / "low_note.wav", low_note())
    write(out / "clap.wav", clap())
    print("wrote temp audio to", out)


if __name__ == "__main__":
    main()
