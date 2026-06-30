import { store } from './state.js';

let audioCtx = null;

export function getAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function playTone(freq, duration, type = 'sine', volume = 0.18, slideTo = null) {
  try {
    const ctx = getAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        slideTo,
        ctx.currentTime + duration
      );
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export function curPack() {
  return store.state?.settings?.soundPack || 'classic';
}

export function soundClick() {
  const pack = curPack();

  if (pack === 'bubbles') {
    playTone(800, 0.12, 'sine', 0.14, 400);
  } else if (pack === 'arcade') {
    playTone(880, 0.05, 'square', 0.14);
  } else {
    playTone(620, 0.07, 'square', 0.12);
  }
}

export function soundValid() {
  const pack = curPack();

  if (pack === 'bubbles') {
    playTone(880, 0.15, 'sine', 0.18);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.18), 100);
    setTimeout(() => playTone(1320, 0.22, 'sine', 0.18), 200);
    return;
  }

  if (pack === 'arcade') {
    playTone(660, 0.1, 'square', 0.15);
    setTimeout(() => playTone(880, 0.1, 'square', 0.15), 90);
    setTimeout(() => playTone(1320, 0.18, 'square', 0.15), 180);
    return;
  }

  playTone(523, 0.13);
  setTimeout(() => playTone(659, 0.13), 110);
  setTimeout(() => playTone(784, 0.22), 220);
}

export function soundVictory() {
  const pack = curPack();
  let notes;
  let type = 'sine';

  if (pack === 'bubbles') {
    notes = [1047, 1319, 1568, 2093, 1568, 2093, 2637];
  } else if (pack === 'arcade') {
    notes = [440, 880, 1320, 1760, 1320, 1760, 2200];
    type = 'square';
  } else {
    notes = [523, 659, 784, 1047, 784, 1047, 1319];
  }

  notes.forEach((note, index) => {
    setTimeout(() => playTone(note, 0.22, type, 0.18), index * 140);
  });
}

export function soundUnlock() {
  const pack = curPack();

  if (pack === 'arcade') {
    playTone(440, 0.1, 'square', 0.16);
    setTimeout(() => playTone(660, 0.1, 'square', 0.16), 90);
    setTimeout(() => playTone(880, 0.3, 'square', 0.16), 180);
    return;
  }

  if (pack === 'bubbles') {
    playTone(660, 0.12, 'sine', 0.18);
    setTimeout(() => playTone(990, 0.12, 'sine', 0.18), 100);
    setTimeout(() => playTone(1320, 0.3, 'sine', 0.18), 200);
    return;
  }

  playTone(440, 0.1);
  setTimeout(() => playTone(660, 0.1), 90);
  setTimeout(() => playTone(880, 0.3), 180);
}

export function soundFail() {
  const pack = curPack();

  if (pack === 'arcade') {
    playTone(330, 0.15, 'square', 0.13);
    setTimeout(() => playTone(247, 0.25, 'square', 0.13), 130);
    return;
  }

  if (pack === 'bubbles') {
    playTone(440, 0.3, 'sine', 0.14, 220);
    return;
  }

  playTone(392, 0.18, 'sine', 0.16);
  setTimeout(() => playTone(294, 0.28, 'sine', 0.14), 160);
}

export function soundError() {
  playTone(220, 0.2, 'sawtooth', 0.1);
}

export function soundAlarm() {
  const pack = curPack();
  let type = 'sine';

  if (pack === 'arcade') type = 'square';

  const burst = [880, 1100, 1320];
  const burstDur = 0.18;
  const burstGap = 0.05;
  const cycleGap = 0.35;
  const cycleDur = burst.length * (burstDur + burstGap) * 1000 + cycleGap * 1000;

  for (let cycle = 0; cycle < 3; cycle++) {
    burst.forEach((freq, index) => {
      const delay = cycle * cycleDur + index * (burstDur + burstGap) * 1000;
      setTimeout(() => playTone(freq, burstDur, type, 0.25), delay);
    });
  }
}