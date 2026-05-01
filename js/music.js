// Procedural cyberpunk background music using Web Audio API.
// Three tracks: driving bass/arp, dark ambient pad, energetic synth.

class MusicSystem {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.currentTrack = -1;
    this.masterGain = null;
    this.trackGain = null;
    this.reverbGain = null;
    this.reverb = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.lookahead = null;
    this.scheduleAheadTime = 0.1;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.tracks = this._defineTracks();
  }

  init() {
    if (this.ctx) return;
    this.ctx = audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 4;
    this.compressor.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.45;
    this.masterGain.connect(this.compressor);

    this._setupReverb();
    this._createNoiseBuffer();
  }

  _setupReverb() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = buf;
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.06;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
  }

  _createNoiseBuffer() {
    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  _defineTracks() {
    const F = {
      'D2':73.42,'E2':82.41,'F2':87.31,'G2':98.00,'A2':110.00,'Bb2':116.54,'B2':123.47,
      'C3':130.81,'D3':146.83,'Eb3':155.56,'E3':164.81,'F3':174.61,'G3':196.00,'A3':220.00,'Bb3':233.08,
      'C4':261.63,'D4':293.66,'Eb4':311.13,'F4':349.23,'G4':392.00,'A4':440.00,'Bb4':466.16,
      'C5':523.25,'D5':587.33,'Eb5':622.25,'F5':698.46,
    };

    return [
      {
        name: 'NEON DRIVE',
        bpm: 120,
        stepDur: 0.25,
        bassGain: 0.18,
        arpGain: 0.10,
        kickGain: 0.35,
        hihatGain: 0.06,
        bass: [
          { step: 0, note: 'D2', dur: 0.35 },
          { step: 4, note: 'F2', dur: 0.35 },
          { step: 8, note: 'G2', dur: 0.35 },
          { step: 12, note: 'A2', dur: 0.35 },
        ],
        arp: [
          { step: 0, note: 'D3', dur: 0.12 },
          { step: 1, note: 'F3', dur: 0.12 },
          { step: 2, note: 'A3', dur: 0.12 },
          { step: 3, note: 'D4', dur: 0.12 },
          { step: 4, note: 'F3', dur: 0.12 },
          { step: 5, note: 'A3', dur: 0.12 },
          { step: 6, note: 'C4', dur: 0.12 },
          { step: 7, note: 'F4', dur: 0.12 },
          { step: 8, note: 'G3', dur: 0.12 },
          { step: 9, note: 'Bb3', dur: 0.12 },
          { step: 10, note: 'D4', dur: 0.12 },
          { step: 11, note: 'G4', dur: 0.12 },
          { step: 12, note: 'A3', dur: 0.12 },
          { step: 13, note: 'C4', dur: 0.12 },
          { step: 14, note: 'E4', dur: 0.12 },
          { step: 15, note: 'A4', dur: 0.12 },
        ],
        kick: [0, 4, 8, 12],
        hihat: [2, 6, 10, 14],
      },
      {
        name: 'DARK PULSE',
        bpm: 96,
        stepDur: 0.3125,
        bassGain: 0.16,
        arpGain: 0.07,
        kickGain: 0.30,
        hihatGain: 0.04,
        bass: [
          { step: 0, note: 'D2', dur: 0.6 },
          { step: 6, note: 'Bb2', dur: 0.6 },
          { step: 10, note: 'G2', dur: 0.6 },
        ],
        arp: [
          { step: 0, note: 'D3', dur: 0.2 },
          { step: 3, note: 'F3', dur: 0.2 },
          { step: 6, note: 'A3', dur: 0.2 },
          { step: 9, note: 'D4', dur: 0.2 },
          { step: 12, note: 'Eb4', dur: 0.2 },
          { step: 15, note: 'F4', dur: 0.2 },
        ],
        kick: [0, 8],
        hihat: [4, 12],
      },
      {
        name: 'SYNTH STORM',
        bpm: 130,
        stepDur: 0.2308,
        bassGain: 0.16,
        arpGain: 0.09,
        kickGain: 0.32,
        hihatGain: 0.05,
        bass: [
          { step: 0, note: 'D2', dur: 0.18 },
          { step: 2, note: 'D2', dur: 0.18 },
          { step: 4, note: 'F2', dur: 0.18 },
          { step: 6, note: 'G2', dur: 0.18 },
          { step: 8, note: 'A2', dur: 0.18 },
          { step: 10, note: 'A2', dur: 0.18 },
          { step: 12, note: 'Bb2', dur: 0.18 },
          { step: 14, note: 'A2', dur: 0.18 },
        ],
        arp: [
          { step: 0, note: 'D4', dur: 0.10 },
          { step: 1, note: 'F4', dur: 0.10 },
          { step: 2, note: 'A4', dur: 0.10 },
          { step: 3, note: 'D5', dur: 0.10 },
          { step: 4, note: 'C5', dur: 0.10 },
          { step: 5, note: 'Bb4', dur: 0.10 },
          { step: 6, note: 'A4', dur: 0.10 },
          { step: 7, note: 'F4', dur: 0.10 },
          { step: 8, note: 'G4', dur: 0.10 },
          { step: 9, note: 'Bb4', dur: 0.10 },
          { step: 10, note: 'D5', dur: 0.10 },
          { step: 11, note: 'G4', dur: 0.10 },
          { step: 12, note: 'F4', dur: 0.10 },
          { step: 13, note: 'Eb5', dur: 0.10 },
          { step: 14, note: 'D5', dur: 0.10 },
          { step: 15, note: 'Bb4', dur: 0.10 },
        ],
        kick: [0, 4, 8, 12],
        hihat: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    ].map(t => ({ ...t, F }));
  }

  play(idx) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.playing) this._stopTrack();
    this.currentTrack = ((idx % this.tracks.length) + this.tracks.length) % this.tracks.length;
    const track = this.tracks[this.currentTrack];

    this.trackGain = this.ctx.createGain();
    this.trackGain.gain.value = 0.8;
    this.trackGain.connect(this.masterGain);
    this.trackGain.connect(this.reverb);

    this.playing = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this._scheduleLoop(track);

    this._updateUI();
  }

  stop() {
    if (!this.playing) return;
    this._stopTrack();
    this.playing = false;
    this.currentTrack = -1;
    this._updateUI();
  }

  skip() {
    if (!this.playing) {
      this.play(0);
      return;
    }
    this.play(this.currentTrack + 1);
  }

  setVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  _stopTrack() {
    if (this.lookahead) { clearInterval(this.lookahead); this.lookahead = null; }
    if (this.trackGain) {
      try { this.trackGain.disconnect(); } catch(e) {}
      this.trackGain = null;
    }
  }

  _scheduleLoop(track) {
    if (this.lookahead) clearInterval(this.lookahead);
    this.lookahead = setInterval(() => {
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this._scheduleStep(track, this.currentStep, this.nextNoteTime);
        const stepSec = track.stepDur;
        this.nextNoteTime += stepSec;
        this.currentStep = (this.currentStep + 1) % 16;
      }
    }, 25);
  }

  _scheduleStep(track, step, time) {
    const { bass, arp, kick, hihat, F } = track;

    for (const n of bass) {
      if (n.step === step) this._bassVoice(F[n.note], track.bassGain, time, n.dur);
    }
    for (const n of arp) {
      if (n.step === step) this._arpVoice(F[n.note], track.arpGain, time, n.dur);
    }
    if (kick.includes(step)) this._kickVoice(track.kickGain, time);
    if (hihat.includes(step)) this._hihatVoice(track.hihatGain, time);

    if (step % 4 === 0) this._pulseUI();
  }

  _bassVoice(freq, gain, time, dur) {
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = freq;
    sub.type = 'sine'; sub.frequency.value = freq * 0.5;
    filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 4;
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.008);
    g.gain.setValueAtTime(gain, time + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter); sub.connect(filter);
    filter.connect(g); g.connect(this.trackGain);
    osc.start(time); osc.stop(time + dur + 0.01);
    sub.start(time); sub.stop(time + dur + 0.01);
  }

  _arpVoice(freq, gain, time, dur) {
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o1.type = 'sawtooth'; o1.frequency.value = freq;
    o2.type = 'sawtooth'; o2.frequency.value = freq * 1.004;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + dur);
    filter.Q.value = 2;
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o1.connect(filter); o2.connect(filter);
    filter.connect(g); g.connect(this.trackGain);
    o1.start(time); o1.stop(time + dur + 0.01);
    o2.start(time); o2.stop(time + dur + 0.01);
  }

  _kickVoice(gain, time) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(g); g.connect(this.trackGain);
    osc.start(time); osc.stop(time + 0.35);
  }

  _hihatVoice(gain, time) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 8000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    src.connect(hp); hp.connect(g); g.connect(this.trackGain);
    src.start(time); src.stop(time + 0.06);
  }

  _pulseUI() {
    const bars = document.querySelectorAll('.visualizer-bar');
    if (!bars.length) return;
    bars.forEach((b, i) => {
      const h = 3 + Math.random() * 12;
      b.style.height = h + 'px';
    });
  }

  _updateUI() {
    const nameEl = document.getElementById('music-track-name');
    const btnEl = document.getElementById('music-play-btn');
    if (!nameEl || !btnEl) return;
    if (this.playing && this.currentTrack >= 0) {
      nameEl.textContent = this.tracks[this.currentTrack].name;
      btnEl.textContent = '⏸';
    } else {
      nameEl.textContent = 'NO TRACK';
      btnEl.textContent = '▶';
    }
  }

  getTrackCount() { return this.tracks.length; }
  getTrackName(idx) { return this.tracks[idx]?.name ?? ''; }
}

const music = new MusicSystem();
