import wave
import struct
import math
import os

os.makedirs("assets/sounds", exist_ok=True)
sample_rate = 44100.0

def save_wav(filename, samples):
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(int(sample_rate))
        raw_data = bytearray()
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            val = int(clamped * 32767.0)
            raw_data.extend(struct.pack('<h', val))
        wav_file.writeframesraw(raw_data)

def gen_default_alarm(duration=10.0):
    # Alternating 880Hz / 660Hz alarm
    samples = []
    total_samples = int(sample_rate * duration)
    for i in range(total_samples):
        t = i / sample_rate
        cycle = t % 1.0
        freq = 880.0 if cycle < 0.5 else 660.0
        pulse = 0.5 + 0.5 * math.sin(2.0 * math.pi * 8.0 * t)
        val = 0.8 * math.sin(2.0 * math.pi * freq * t) * pulse
        samples.append(val)
    return samples

def gen_classic_alarm(duration=10.0):
    # Twin bell mechanical alarm clock ringing
    samples = []
    total_samples = int(sample_rate * duration)
    for i in range(total_samples):
        t = i / sample_rate
        # Ring bursts: 0.8s on, 0.2s off
        burst = 1.0 if (t % 1.0) < 0.8 else 0.0
        # Fast 25Hz clapper hammer strike
        clapper = 0.5 + 0.5 * math.sin(2.0 * math.pi * 25.0 * t)
        # Dual bell resonance
        bell1 = math.sin(2.0 * math.pi * 740.0 * t)
        bell2 = math.sin(2.0 * math.pi * 790.0 * t)
        val = 0.7 * (bell1 + bell2) * clapper * burst
        samples.append(val)
    return samples

def gen_digital_alarm(duration=10.0):
    # Digital clock: 4 beeps then silence
    samples = []
    total_samples = int(sample_rate * duration)
    for i in range(total_samples):
        t = i / sample_rate
        cycle = t % 1.5
        # 4 beeps in 0.8s, each beep 0.1s on, 0.1s off
        in_beep = False
        if cycle < 0.8:
            beep_idx = int(cycle / 0.2)
            beep_pos = cycle % 0.2
            if beep_pos < 0.1:
                in_beep = True
        val = (0.75 * math.sin(2.0 * math.pi * 1250.0 * t)) if in_beep else 0.0
        samples.append(val)
    return samples

def gen_gentle_alarm(duration=10.0):
    # Soft melodic chiming arpeggio
    samples = []
    total_samples = int(sample_rate * duration)
    notes = [440.0, 554.37, 659.25, 880.0]
    for i in range(total_samples):
        t = i / sample_rate
        cycle = t % 2.0
        note_idx = min(3, int(cycle / 0.5))
        note_time = cycle % 0.5
        decay = math.exp(-4.0 * note_time)
        freq = notes[note_idx]
        val = 0.6 * math.sin(2.0 * math.pi * freq * t) * decay
        samples.append(val)
    return samples

def gen_loud_alarm(duration=10.0):
    # Piercing emergency frequency sweep siren
    samples = []
    total_samples = int(sample_rate * duration)
    phase = 0.0
    for i in range(total_samples):
        t = i / sample_rate
        # Siren sweep from 850Hz to 1600Hz at 2Hz
        mod = 0.5 + 0.5 * math.sin(2.0 * math.pi * 2.0 * t)
        freq = 850.0 + 750.0 * mod
        phase += 2.0 * math.pi * freq / sample_rate
        # Square-ish harmonics for maximum cut-through
        val = 0.7 * (math.sin(phase) + 0.3 * math.sin(3.0 * phase))
        samples.append(val)
    return samples

def gen_bell_alarm(duration=10.0):
    # Deep church/reception bell chime
    samples = []
    total_samples = int(sample_rate * duration)
    for i in range(total_samples):
        t = i / sample_rate
        cycle = t % 2.5
        decay = math.exp(-2.2 * cycle)
        f0 = 587.33 # D5
        val = decay * (
            0.5 * math.sin(2.0 * math.pi * f0 * t) +
            0.3 * math.sin(2.0 * math.pi * f0 * 2.0 * t) +
            0.2 * math.sin(2.0 * math.pi * f0 * 3.01 * t)
        )
        samples.append(0.75 * val)
    return samples

def gen_beep_alarm(duration=10.0):
    # Rapid military/aviation pulsed beeps
    samples = []
    total_samples = int(sample_rate * duration)
    for i in range(total_samples):
        t = i / sample_rate
        pulse = 1.0 if (t % 0.25) < 0.125 else 0.0
        val = 0.75 * math.sin(2.0 * math.pi * 1050.0 * t) * pulse
        samples.append(val)
    return samples

def gen_urgent_alarm(duration=10.0):
    # Fast alternating warble
    samples = []
    total_samples = int(sample_rate * duration)
    for i in range(total_samples):
        t = i / sample_rate
        freq = 1150.0 if (t % 0.2) < 0.1 else 880.0
        val = 0.8 * math.sin(2.0 * math.pi * freq * t)
        samples.append(val)
    return samples

if __name__ == "__main__":
    sounds = [
        ("assets/sounds/alarm1.wav", gen_default_alarm),
        ("assets/sounds/alarm2.wav", gen_classic_alarm),
        ("assets/sounds/alarm3.wav", gen_digital_alarm),
        ("assets/sounds/alarm4.wav", gen_gentle_alarm),
        ("assets/sounds/alarm5.wav", gen_loud_alarm),
        ("assets/sounds/alarm6.wav", gen_bell_alarm),
        ("assets/sounds/alarm7.wav", gen_beep_alarm),
        ("assets/sounds/alarm8.wav", gen_urgent_alarm),
    ]
    for path, gen in sounds:
        save_wav(path, gen(10.0))
        print(f"Generated: {path}")
    print("All 8 alarm ringtones generated successfully!")
