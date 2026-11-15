'use strict';
// ================= UTILITAIRES =================
const TS = 16;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function shade(hex, amt) {
  const c = parseInt(hex.slice(1), 16); let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return '#' + ((1 << 24) | ((r | 0) << 16) | ((g | 0) << 8) | (b | 0)).toString(16).slice(1);
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ================= AUDIO (chiptune maison) =================
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const AU = {
  ctx: null, out: null, sfxG: null, musG: null, noiseBuf: null, song: null, songName: null, step: 0, nextT: 0, timer: null,
  set: Object.assign({ music: true, sfx: true, voice: true, crt: true, easy: false }, store.get('nds_settings', {})),
  frVoice: null, _unlocked: false,
  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ctx = new AC();
        this.out = this.ctx.createGain(); this.out.gain.value = 0.9; this.out.connect(this.ctx.destination);
        this.sfxG = this.ctx.createGain(); this.sfxG.connect(this.out);
        this.musG = this.ctx.createGain(); this.musG.connect(this.out);
        const n = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, n, n);
        const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.applySet();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { }
    try {
      if (window.speechSynthesis) {
        const pickV = () => { const vs = speechSynthesis.getVoices(); this.frVoice = vs.find(v => /^fr[-_]FR/i.test(v.lang)) || vs.find(v => /^fr/i.test(v.lang)) || null; this.enVoice = vs.find(v => /^en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; };
        pickV(); speechSynthesis.onvoiceschanged = pickV;
        if (!this._unlocked) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); this._unlocked = true; }
      }
    } catch (e) { }
  },
  applySet() {
    store.set('nds_settings', this.set);
    if (!this.ctx) return;
    this.sfxG.gain.value = this.set.sfx ? 0.55 : 0;
    this.musG.gain.value = this.set.music ? 0.3 : 0;
    if (!this.set.voice) { try { speechSynthesis.cancel(); } catch (e) { } }
  },
  tone(f, dur, o = {}) {
    if (!this.ctx) return;
    const { type = 'square', vol = 0.2, at = 0, to = null, dest = null, attack = 0.005 } = o;
    const c = this.ctx, t0 = c.currentTime + at; const os = c.createOscillator(), g = c.createGain();
    os.type = type; os.frequency.setValueAtTime(f, t0);
    if (to) os.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    os.connect(g); g.connect(dest || this.sfxG); os.start(t0); os.stop(t0 + dur + 0.03);
  },
  noise(dur, o = {}) {
    if (!this.ctx) return;
    const { vol = 0.2, at = 0, freq = 1200, q = 1, type = 'bandpass', to = null, dest = null } = o;
    const c = this.ctx, t0 = c.currentTime + at; const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur); f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(Math.max(0.0002, vol), t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxG); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.03);
  },
  // un « tuyau » stéréo vers les bruitages (pan : -1 gauche … 1 droite)
  panTo(p) { if (!this.ctx || !p || !this.ctx.createStereoPanner) return null; const n = this.ctx.createStereoPanner(); n.pan.value = clamp(p, -1, 1); n.connect(this.sfxG); return n; },
  // bruits de pas selon le sol (mat) et la façon de marcher (kind)
  foot(mat, kind, v = 1, pan = 0) {
    if (!this.ctx || !this.set.sfx || v <= 0.01) return; const T = this, d = this.panTo(pan) || null, r = 0.9 + Math.random() * 0.2;
    const adult = kind === 'adult', tiny = kind === 'tiny', k = adult ? 0.72 : tiny ? 1.6 : kind === 'kid' ? 1.15 : 1, run = kind === 'run';
    switch (mat) {
      case 'grass': T.noise(0.09, { vol: 0.2 * v, freq: 3000 * k * r, q: 0.7, dest: d }); T.noise(0.05, { vol: 0.12 * v, freq: 5200 * k, q: 0.8, at: 0.03, dest: d }); break;
      case 'sand': for (let i = 0; i < 3; i++) T.noise(0.025, { vol: 0.16 * v, freq: 1900 * k * r, q: 1.4, at: i * 0.017, dest: d }); break;
      case 'carpet': T.noise(0.07, { vol: 0.3 * v, freq: 420 * k * r, q: 0.5, type: 'lowpass', dest: d }); break;
      case 'wood': case 'gym':
        T.noise(0.06, { vol: 0.32 * v, freq: 650 * k * r, q: 1, dest: d }); T.tone(120 * k * r, 0.07, { type: 'sine', vol: 0.3 * v, to: 70 * k, dest: d });
        if (mat === 'gym' && run && Math.random() < 0.18) T.tone(1700 * r, 0.08, { type: 'sine', vol: 0.06 * v, to: 2400, dest: d });
        break;
      default:   // carrelage, lino, bitume…
        T.noise(0.035, { vol: 0.34 * v, freq: 2300 * k * r, q: 1.2, dest: d }); T.tone(190 * k * r, 0.03, { type: 'triangle', vol: 0.14 * v, to: 95 * k, dest: d });
        if (adult) T.noise(0.02, { vol: 0.22 * v, freq: 4200 * r, q: 2, at: 0.05, dest: d });   // talon : « clac »
    }
  },
  // les élèves bavardent : petits « blablabla » (sans voix)
  babble(v = 1, pan = 0, high = false) {
    if (!this.ctx || !this.set.sfx || v <= 0.02) return; const d = this.panTo(pan), base = (high ? 760 : 560) * (0.85 + Math.random() * 0.3);
    for (let i = 0, n = 4 + (Math.random() * 3 | 0); i < n; i++) this.tone(base * (0.8 + Math.random() * 0.5), 0.06, { type: 'square', vol: 0.035 * v, at: i * 0.075, dest: d });
  },
  sfx(name, v = 1) {
    if (!this.ctx || !this.set.sfx || v <= 0.01) return; const T = this;
    switch (name) {
      case 'step': T.noise(0.05, { vol: 0.06 * v, freq: 900, q: 2 }); break;
      case 'tstep': T.noise(0.07, { vol: 0.12 * v, freq: 450, q: 1.5 }); T.tone(85, 0.07, { type: 'sine', vol: 0.12 * v }); break;
      case 'door': T.noise(0.12, { vol: 0.3 * v, freq: 320, q: 0.8 }); T.tone(120, 0.12, { vol: 0.08 * v, to: 70 }); break;
      case 'creak': T.tone(260 + Math.random() * 90, 0.4, { type: 'sawtooth', vol: 0.05 * v, to: 430 }); break;
      case 'lock': T.tone(1900, 0.04, { vol: 0.1 * v }); T.tone(1250, 0.05, { vol: 0.1 * v, at: 0.07 }); break;
      case 'pickup': [72, 76, 79, 84].forEach((m, i) => T.tone(mtof(m), 0.09, { vol: 0.12, at: i * 0.06 })); break;
      case 'magic': for (let i = 0; i < 9; i++) T.tone(mtof(84 + i * 2), 0.08, { type: 'triangle', vol: 0.1, at: i * 0.035 }); break;
      case 'slow': for (let i = 0; i < 6; i++) T.tone(mtof(84 - i * 3), 0.14, { type: 'triangle', vol: 0.1, at: i * 0.09 }); break;
      case 'shrink': T.tone(900, 0.6, { vol: 0.1, to: 110 }); T.tone(1800, 0.6, { type: 'triangle', vol: 0.05, to: 200 }); break;
      case 'grow': T.tone(110, 0.5, { vol: 0.1, to: 900 }); break;
      case 'spot': T.tone(mtof(76), 0.12, { vol: 0.2 }); T.tone(mtof(83), 0.3, { vol: 0.2, at: 0.12 }); break;
      case 'whistle': T.tone(2700, 0.55, { type: 'sine', vol: 0.12 * v }); T.tone(2860, 0.55, { type: 'sine', vol: 0.07 * v }); T.noise(0.5, { vol: 0.04 * v, freq: 3000, q: 4 }); break;
      case 'caught': [67, 63, 60, 55].forEach((m, i) => T.tone(mtof(m), 0.24, { vol: 0.16, at: i * 0.2 })); break;
      case 'win': [60, 64, 67, 72, 67, 72, 76, 79, 84].forEach((m, i) => T.tone(mtof(m), 0.14, { vol: 0.14, at: i * 0.09 })); break;
      case 'search': T.noise(0.35, { vol: 0.12, freq: 2200, q: 0.7, to: 700 }); break;
      case 'fail': T.tone(230, 0.18, { vol: 0.1, to: 160 }); break;
      case 'found': [79, 83, 86, 91, 95].forEach((m, i) => T.tone(mtof(m), 0.12, { type: 'triangle', vol: 0.14, at: i * 0.07 })); break;
      case 'pouf': T.noise(0.45, { vol: 0.28, freq: 380, to: 3200, q: 0.6 }); break;
      case 'hide': T.noise(0.15, { vol: 0.15, freq: 700 }); T.tone(320, 0.12, { type: 'triangle', vol: 0.12, to: 150 }); break;
      case 'locker': T.noise(0.08, { vol: 0.22, freq: 3200, q: 3 }); [523, 784, 1046].forEach((f, i) => T.tone(f, 0.25, { type: 'square', vol: 0.05, at: 0.02 + i * 0.01 })); T.tone(140, 0.12, { type: 'triangle', vol: 0.12, to: 90 }); break;
      case 'wardrobe': T.tone(300, 0.35, { type: 'sawtooth', vol: 0.04, to: 520 }); T.noise(0.1, { vol: 0.16, freq: 500, at: 0.3 }); T.tone(110, 0.1, { type: 'triangle', vol: 0.14, at: 0.3, to: 70 }); break;
      case 'rustle': for (let i = 0; i < 5; i++) T.noise(0.06, { vol: 0.12, freq: 3500 + Math.random() * 2000, q: 0.8, at: i * 0.05 }); break;
      case 'trash': T.noise(0.12, { vol: 0.18, freq: 2400, q: 2 }); T.tone(660, 0.18, { type: 'square', vol: 0.04, to: 620 }); T.tone(990, 0.14, { type: 'square', vol: 0.025, at: 0.02 }); break;
      case 'kidscream': T.tone(820, 0.22, { type: 'square', vol: 0.05 * v, to: 1500 }); T.tone(1500, 0.3, { type: 'square', vol: 0.045 * v, to: 1100, at: 0.2 }); T.noise(0.3, { vol: 0.05 * v, freq: 2500, q: 2 }); break;
      case 'splash': T.noise(0.22, { vol: 0.2 * v, freq: 1300, to: 500, q: 1.2 }); T.tone(320, 0.12, { type: 'sine', vol: 0.1 * v, to: 120 }); for (let i = 0; i < 3; i++) T.tone(1800 + i * 400, 0.05, { type: 'sine', vol: 0.03 * v, at: 0.05 + i * 0.04 }); break;
      case 'whoosh': T.noise(0.18, { vol: 0.12 * v, freq: 600, to: 2600, q: 0.6 }); break;
      case 'unhide': T.tone(160, 0.12, { type: 'triangle', vol: 0.12, to: 380 }); break;
      case 'heart': T.tone(62, 0.12, { type: 'sine', vol: 0.3 * v }); T.tone(55, 0.12, { type: 'sine', vol: 0.22 * v, at: 0.15 }); break;
      case 'ding': T.tone(mtof(84), 0.6, { type: 'sine', vol: 0.16 * v }); T.tone(mtof(79), 0.9, { type: 'sine', vol: 0.16 * v, at: 0.32 }); break;
      case 'keys': for (let i = 0; i < 5; i++) T.tone(2900 + Math.random() * 1600, 0.04, { type: 'triangle', vol: 0.06 * v, at: i * 0.08 }); break;
      case 'snore': T.noise(0.7, { vol: 0.07 * v, freq: 180, q: 3 }); break;
      case 'alarm': for (let i = 0; i < 6; i++) { T.tone(900, 0.14, { vol: 0.09, at: i * 0.28 }); T.tone(680, 0.14, { vol: 0.09, at: i * 0.28 + 0.14 }); } break;
      case 'blip': T.tone(700, 0.05, { vol: 0.08 }); break;
      case 'tick': T.tone(1200, 0.03, { vol: 0.05 }); break;
      case 'go': T.tone(mtof(72), 0.1, { vol: 0.15 }); T.tone(mtof(84), 0.28, { vol: 0.15, at: 0.1 }); break;
      case 'count': T.tone(mtof(67), 0.12, { vol: 0.12 }); break;
      case 'bump': T.tone(140, 0.06, { vol: 0.06, to: 90 }); break;
      case 'flap': for (let i = 0; i < 6; i++) T.noise(0.05, { vol: 0.12 * v, freq: 600 + i * 90, q: 1.2, at: i * 0.045 }); break;
      case 'skid': T.noise(0.28, { vol: 0.16 * v, freq: 2600, q: 3, to: 900 }); T.tone(900, 0.2, { type: 'sawtooth', vol: 0.03 * v, to: 400 }); break;
      case 'squish': // on presse le squishy : pchhh + pouic
        T.noise(0.2, { vol: 0.24 * v, freq: 1400, to: 300, q: 1.8, type: 'lowpass' });
        T.tone(560 + Math.random() * 80, 0.15, { type: 'sine', vol: 0.13 * v, to: 1500, at: 0.04 });
        T.tone(1500, 0.1, { type: 'sine', vol: 0.06 * v, to: 900, at: 0.19 });
        break;
      case 'kawaii': [88, 91, 95, 100].forEach((m, i) => T.tone(mtof(m), 0.18, { type: 'triangle', vol: 0.08 * v, at: i * 0.06 })); T.tone(mtof(103), 0.5, { type: 'sine', vol: 0.06 * v, at: 0.26, to: mtof(98) }); break;
      case 'boing': T.tone(220, 0.25, { type: 'triangle', vol: 0.1 * v, to: 660 }); break;
      case 'crunch': T.noise(0.18, { vol: 0.2, freq: 1500, q: 1 }); T.noise(0.15, { vol: 0.15, freq: 1100, q: 1, at: 0.2 }); break;
    }
  },
  play(name) {
    if (this.songName === name) return; this.songName = name; this.song = SONGS[name] || null; this.step = 0;
    if (this.ctx) this.nextT = this.ctx.currentTime + 0.06;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 25);
  },
  tick() {
    if (!this.ctx || !this.song) return; const s = this.song, spb = 60 / s.bpm / 4, now = this.ctx.currentTime;
    if (this.nextT < now - 0.3) this.nextT = now + 0.02;
    while (this.nextT < now + 0.12) {
      const i = this.step % 32, at = Math.max(0, this.nextT - now);
      const b = s.bass[i]; if (b) this.tone(mtof(b), spb * 0.85, { type: s.bassT, vol: s.bv, at, dest: this.musG });
      const l = s.lead[i]; if (l) this.tone(mtof(l), spb * 1.7, { type: s.leadT, vol: s.lv, at, dest: this.musG });
      if (s.hat[i] === 'x') this.noise(0.03, { vol: 0.05, freq: 8000, type: 'highpass', at, dest: this.musG });
      if (s.kick && s.kick[i] === 'x') this.tone(150, 0.13, { type: 'sine', vol: 0.35, to: 45, at, dest: this.musG });
      this.nextT += spb; this.step++;
    }
  },
  // en anglais (Miss Teacup) ; force = même si les voix sont coupées (bouton 🔊)
  sayEn(text, prof, force) {
    if (!window.speechSynthesis || (!force && !this.set.voice)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/[«»]/g, '')); u.lang = 'en-GB'; if (this.enVoice) u.voice = this.enVoice; u.pitch = prof && prof.voice ? prof.voice.pitch : 1.1; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) { }
  },
  say(text, prof, vol = 1) {
    if (!this.set.voice || !window.speechSynthesis || vol < 0.05) return;
    // pas trop de voix d'affilée : la synthèse vocale peut faire « accrocher » l'image sur téléphone
    const now = performance.now(); if (vol < 0.9 && now - (this.lastSay || -1e9) < 2600) return; this.lastSay = now;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu, ''));
      const en = prof && prof.english; u.lang = en ? 'en-GB' : 'fr-FR'; if (en ? this.enVoice : this.frVoice) u.voice = en ? this.enVoice : this.frVoice;
      u.pitch = prof && prof.voice ? prof.voice.pitch : 1; u.rate = prof && prof.voice ? prof.voice.rate : 1.1;
      u.volume = clamp(vol, 0, 1); speechSynthesis.speak(u);
    } catch (e) { }
  }
};
const SONGS = {
  menu: {
    bpm: 118, bassT: 'triangle', leadT: 'square', lv: 0.04, bv: 0.22,
    bass: [48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 48, 0, 52, 0, 41, 0, 48, 0, 45, 0, 48, 0, 43, 0, 50, 0, 47, 0, 50, 0],
    lead: [72, 0, 0, 74, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0, 69, 0, 0, 71, 72, 0, 74, 0, 71, 0, 67, 0, 0, 0, 0, 0],
    hat: '..x...x...x...x...x...x...x...x.', kick: 'x.......x.......x.......x.......'
  },
  sneak: {
    bpm: 100, bassT: 'triangle', leadT: 'square', lv: 0.035, bv: 0.24,
    bass: [45, 0, 52, 0, 45, 0, 52, 0, 48, 0, 50, 0, 51, 0, 52, 0, 45, 0, 52, 0, 45, 0, 52, 0, 55, 0, 53, 0, 52, 0, 50, 0],
    lead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 0, 75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 72, 0, 71, 0, 69, 0, 0, 0],
    hat: '..x...x...x...x...x...x...x...x.', kick: ''
  },
  chase: {
    bpm: 152, bassT: 'square', leadT: 'square', lv: 0.045, bv: 0.1,
    bass: [40, 40, 52, 40, 40, 52, 40, 50, 40, 40, 52, 40, 43, 45, 47, 50, 40, 40, 52, 40, 40, 52, 40, 50, 48, 48, 47, 47, 45, 45, 43, 43],
    lead: [76, 0, 74, 0, 71, 0, 74, 0, 76, 0, 79, 0, 78, 0, 74, 0, 76, 0, 74, 0, 71, 0, 69, 0, 67, 0, 69, 0, 71, 0, 0, 0],
    hat: 'x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.', kick: 'x.......x.......x.......x.......'
  },
  win: {
    bpm: 140, bassT: 'triangle', leadT: 'square', lv: 0.05, bv: 0.2,
    bass: [48, 0, 48, 0, 55, 0, 55, 0, 53, 0, 53, 0, 55, 0, 55, 0, 48, 0, 48, 0, 52, 0, 52, 0, 53, 0, 55, 0, 48, 0, 0, 0],
    lead: [72, 0, 76, 0, 79, 0, 84, 0, 81, 0, 79, 0, 76, 0, 79, 0, 72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 79, 0, 84, 0, 0, 0],
    hat: '..x...x...x...x...x...x...x...x.', kick: 'x.......x.......x.......x.......'
  }
};
