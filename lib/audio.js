let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playHotsSound = (type) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } 
    else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99]; 
      notes.forEach((freq, index) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, now + index * 0.1);
        g.gain.setValueAtTime(0.08, now + index * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.25);
        o.start(now + index * 0.1);
        o.stop(now + index * 0.1 + 0.25);
      });
    } 
    else if (type === 'cheat_alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);
      osc.frequency.linearRampToValueAtTime(400, now + 0.3);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn("Konteks audio Web Audio API belum diizinkan oleh browser.");
  }
};

let lofiInterval = null;
let activeNodes = [];

export const startLofiAmbient = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    stopLofiAmbient();
    
    const chords = [
      [196.00, 246.94, 293.66], 
      [174.61, 220.00, 261.63], 
      [220.00, 261.63, 329.63]  
    ];
    let chordIndex = 0;

    const playChord = () => {
      const now = ctx.currentTime;
      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      currentChord.forEach(freq => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.015, now + 0.8);
        gainNode.gain.setValueAtTime(0.015, now + 2.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.start(now);
        osc.stop(now + 4.0);
        activeNodes.push(osc);
      });
    };

    playChord();
    lofiInterval = setInterval(playChord, 4000);
  } catch (err) {
    console.warn("Gagal memulai lofi ambient");
  }
};

export const stopLofiAmbient = () => {
  if (lofiInterval) {
    clearInterval(lofiInterval);
    lofiInterval = null;
  }
  activeNodes.forEach(node => {
    try { node.stop(); } catch(e) {}
  });
  activeNodes = [];
};
