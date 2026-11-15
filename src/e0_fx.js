// ================= EFFETS « JUICE » =================
const FX = {
  zoom: 1, flash: 0, flashCol: '255,255,255', lines: 0, freeze: 0, iris: null, ghosts: [], flyers: [], zips: [], comic: null, winA: -1,
  cntN: 0, cntA: 9, goA: 9, motes: [], leaves: [], ghostT: 0, leafT: 0,
  reset() { this.zoom = 1; this.flash = 0; this.lines = 0; this.freeze = 0; this.iris = null; this.ghosts = []; this.flyers = []; this.zips = []; this.comic = null; this.winA = -1; this.cntN = 0; this.cntA = 9; this.goA = 9; this.motes = []; this.leaves = []; },
  punch(z) { this.zoom = Math.max(this.zoom, 1 + z); },
  spotted() { this.freeze = 0.13; this.punch(0.14); this.flash = 1; this.flashCol = '255,60,80'; this.lines = 0.9; },
  update(dt) {
    this.zoom += (1 - this.zoom) * Math.min(1, dt * 6);
    this.flash = Math.max(0, this.flash - dt * 2.8); this.lines = Math.max(0, this.lines - dt * 1.4);
    if (this.iris) { this.iris.t += dt; if (this.iris.t >= this.iris.dur && this.iris.cb) { const cb = this.iris.cb; this.iris.cb = null; cb(); } if (this.iris.mode === 'in' && this.iris.t > this.iris.dur) this.iris = null; }
    this.flyers.forEach(f => f.t += dt / 0.55); this.flyers = this.flyers.filter(f => { if (f.t >= 1) { UI.bumpSlot(f.slot); return false; } return true; });
    this.zips.forEach(z => z.t += dt / 0.16); this.zips = this.zips.filter(z => z.t < 1);
    this.ghosts.forEach(g => g.t += dt); this.ghosts = this.ghosts.filter(g => g.t < 0.32);
    if (this.comic) this.comic.t += dt;
    if (this.winA >= 0) this.winA += dt;
    this.cntA += dt; this.goA += dt;
  }
};
// ressort d'écrasement / saut pour un personnage
function animStep(a, dt) {
  const k = 340, d = 15;
  a.sqv = (a.sqv || 0) + (-k * (a.sq || 0) - d * (a.sqv || 0)) * dt; a.sq = (a.sq || 0) + a.sqv * dt;
  if ((a.hz || 0) > 0 || (a.hzv || 0) > 0) { a.hzv = (a.hzv || 0) - 520 * dt; a.hz = (a.hz || 0) + a.hzv * dt; if (a.hz <= 0) { a.hz = 0; a.hzv = 0; a.sqv -= 3.5; } }
  a.blinkT = (a.blinkT == null ? rand(1, 4) : a.blinkT) - dt;
  if (a.blinkT <= 0) { a.blink = 0.13; a.blinkT = rand(2, 4.5); }
  if (a.blink > 0) a.blink -= dt;
  if (a.spin > 0) a.spin -= dt;
}
function gaitOf(a) {
  if (a.skidT > 0) return 'skid';
  if (!a.moving) return a.tapping ? 'tap' : 'idle';
  if (a.isTeacher) return a.state === 'chase' ? 'run' : 'walk';
  if (a.isKid) return a.runK ? 'run' : 'walk';
  return a.running ? 'run' : 'sneak';
}
function frameOf(a, g) { const L = POSE[g]; if (!L || L.length === 1) return 0; return Math.floor(((a.dist || 0) / STRIDE[g]) * L.length) % L.length; }
// poussière / vitesse au contact des pieds
// le bruit de chaque pas : le sien (doux en marchant sur la pointe des pieds), ceux des élèves tout près
function stepSound(a, g) {
  if (G.mode !== 'play' || a.hidden) return;
  if (a.swim) return;
  if (a === G.P) {
    if (a.slip > 0 || (G.net && G.net.role === 'teacher')) return;
    AU.foot(floorMat(a.x, a.y), a.small > 0 ? 'tiny' : g === 'run' ? 'run' : 'walk', g === 'run' ? 0.55 : g === 'sneak' ? 0.13 : 0.3, 0);
    return;
  }
  if (!a.isKid || a.isWatcher) return;
  const V0 = viewerA(), d = dist(a.x, a.y, V0.x, V0.y) / 16; if (d > 5) return;
  if (G.time - (G.kidStepT || -1) < 0.11) return; G.kidStepT = G.time;
  AU.foot(floorMat(a.x, a.y), 'kid', (g === 'run' ? 0.22 : 0.1) * (1 - d / 5), panOf(a.x));
}
function gaitFx(a, visible) {
  const g = gaitOf(a), f = frameOf(a, g);
  if (g !== a.lastG) {
    if (a.lastG === 'idle' || a.lastG === 'tap' || a.lastG == null) { if (g === 'run') { squash(a, 6); if (visible) puff(a.x, a.y - 1, 4, '#e8e0d4'); if (a === G.P && !(a.slip > 0)) AU.sfx('whoosh', 0.35); } else if (g === 'sneak' || g === 'walk') squash(a, 2.5); }
    a.lastG = g; a.lastF = -1;
  }
  if (f !== a.lastF) {
    if (CONTACT[g] && CONTACT[g].includes(f)) stepSound(a, g);
    if (visible && CONTACT[g] && CONTACT[g].includes(f)) {
      const back = a.face === 2 ? -4 : a.face === 3 ? 4 : 0;
      if (g === 'run') { for (let i = 0; i < 2; i++) part(a.x + back + rand(-2, 2), a.y - 1, 'puff', { vx: back * 4 + rand(-8, 8), vy: rand(-10, -3), life: 0.4, col: '#e6ddd0', size: 2 }); }
      else if (g === 'sneak') part(a.x + back, a.y - 1, 'puff', { vx: rand(-4, 4), vy: -3, life: 0.3, col: 'rgba(230,220,210,0.6)', size: 1 });
      else part(a.x + back, a.y - 1, 'puff', { vx: back * 2, vy: -4, life: 0.3, col: '#e6ddd0', size: 1.5 });
    }
    a.lastF = f;
  }
}
const hop = (a, v) => { if ((a.hz || 0) <= 0.5) { a.hzv = v; a.hz = 0.6; a.sqv = (a.sqv || 0) + 4; } };
const squash = (a, v) => { a.sqv = (a.sqv || 0) + v; };
function setMark(T, m, t) { T.mark = m; T.markT = t; T.markA = 0; }

// ---------- Pigeons de la cour ----------
function spawnPigeons() {
  G.pigeons = []; if (!G.L.outdoor) return;
  const spots = G.L.kidSpots.filter(([x, y]) => Math.abs(x - G.L.start[0]) + Math.abs(y - G.L.start[1]) > 5);
  for (let f = 0; f < 3; f++) {
    const s = pick(spots);
    for (let i = 0; i < 3; i++) G.pigeons.push({ x: s[0] * 16 + 8 + rand(-12, 12), y: s[1] * 16 + 12 + rand(-8, 8), st: 'peck', t: rand(0, 2), face: Math.random() < 0.5 ? 1 : -1, z: 0, vx: 0, vy: 0, flap: 0, ph: rand(0, 6), respawn: 0 });
  }
  G.flapCD = 0;
}
function scarePigeon(p, src) {
  const P = G.P;
  G.pigeons.forEach(q => {
    if (q.st !== 'peck' && q.st !== 'walk') return;
    if (dist(q.x, q.y, p.x, p.y) > 42) return;
    const a = Math.atan2(q.y - src.y, q.x - src.x) + rand(-0.6, 0.6), s = rand(70, 95);
    q.st = 'fly'; q.vx = Math.cos(a) * s; q.vy = Math.sin(a) * s * 0.7; q.face = q.vx > 0 ? 1 : -1; q.flap = 0;
    for (let i = 0; i < 2; i++) part(q.x, q.y - 4, 'feather', { vx: rand(-20, 20), vy: rand(-25, -5), g: 30, life: 1.2, col: '#d8dce8' });
  });
  if (G.flapCD > 0) return; G.flapCD = 1.2;
  const d = dist(p.x, p.y, P.x, P.y) / 16;
  AU.sfx('flap', clamp(1 - d / 14, 0.1, 1));
  if (src === P) { makeNoise(p.x, p.y, 6, 'FRRRT !'); cue(p.x, p.y - 14, 'word', 'FRRRT !', { col: '#e8ecff', pop: true, life: 1 }); }
  else if (d < 16) cue(p.x, p.y - 14, 'word', 'FRRRT !', { col: '#e8ecff', pop: true, life: 1 });
}
function updatePigeons(dt) {
  if (!G.pigeons || !G.pigeons.length) return;
  const P = G.P, T = G.T, m = G.m; G.flapCD -= dt;
  for (const p of G.pigeons) {
    if (p.st === 'gone') {
      p.respawn -= dt;
      if (p.respawn <= 0) { const s = pick(G.L.kidSpots); if (dist(s[0] * 16, s[1] * 16, P.x, P.y) > 90) { p.x = s[0] * 16 + 8; p.y = s[1] * 16 + 12; p.z = 70; p.st = 'land'; p.face = Math.random() < 0.5 ? 1 : -1; } }
      continue;
    }
    if (p.st === 'land') { p.z -= 45 * dt; p.flap += dt * 22; if (p.z <= 0) { p.z = 0; p.st = 'peck'; p.t = rand(1, 2); } continue; }
    if (p.st === 'fly') { p.x += p.vx * dt; p.y += p.vy * dt; p.z += 34 * dt; p.flap += dt * 26; if (p.z > 110 || p.x < -30 || p.y < -30 || p.x > m.w * 16 + 30 || p.y > m.h * 16 + 30) { p.st = 'gone'; p.respawn = rand(14, 24); } continue; }
    const dP = dist(p.x, p.y, P.x, P.y), dT = dist(p.x, p.y, T.x, T.y);
    if (!P.hidden && (dP < 16 || (dP < 36 && P.running))) { scarePigeon(p, P); continue; }
    if (dT < 24 && T.state !== 'sleep') { scarePigeon(p, T); continue; }
    p.t -= dt;
    if (p.t <= 0) {
      if (p.st === 'peck') { p.st = 'walk'; p.t = rand(0.4, 1.2); const a = rand(0, 6.28); p.vx = Math.cos(a) * 12; p.vy = Math.sin(a) * 7; p.face = p.vx > 0 ? 1 : -1; }
      else { p.st = 'peck'; p.t = rand(1, 3); }
    }
    if (p.st === 'walk') { const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt; if (KP[m.get(Math.floor(nx / 16), Math.floor((ny - 4) / 16))].solid === 0) { p.x = nx; p.y = ny; } else p.st = 'peck'; }
  }
}
function drawPigeon(c, p) {
  const x = p.x, y = p.y, f = p.face, z = p.z;
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(f > 0 ? x + a : x - a - w, y + b - z, w, h); };
  // ombre
  const sh = Math.max(0.25, 1 - z / 90); c.fillStyle = `rgba(10,6,20,${0.28 * sh})`; c.beginPath(); c.ellipse(x, y, 4 * sh, 1.5 * sh, 0, 0, 7); c.fill();
  const flying = p.st === 'fly' || p.st === 'land';
  const peck = p.st === 'peck' && Math.sin(G.time * 9 + p.ph) > 0.3;
  R(-3, -5, 6, 3, '#8f95ad'); R(-3, -3, 5, 1, '#7a7f98'); R(-5, -5, 2, 1, '#5a5f78');
  if (peck) { R(2, -3, 2, 2, '#5a5f78'); R(4, -2, 1, 1, '#f2a33a'); }
  else { R(2, -7, 2, 3, '#5a5f78'); R(2, -5, 1, 1, '#6fae9a'); R(4, -6, 1, 1, '#f2a33a'); R(3, -7, 1, 1, '#1d1626'); }
  if (flying) { const up = (p.flap | 0) % 2 === 0; if (up) { R(-2, -10, 3, 4, '#c8ccdc'); R(-1, -11, 2, 1, '#c8ccdc'); } else { R(-4, -4, 4, 2, '#c8ccdc'); } }
  else { R(-1, -2, 1, 2, '#e05050'); R(1, -2, 1, 2, '#e05050'); R(-2, -5, 3, 1, '#a8aec4'); }
}
// ---------- Feuilles et poussières ----------
function updateAmbient(dt) {
  const L = G.L;
  if (L.outdoor && G.trees && G.trees.length) {
    FX.leafT -= dt;
    if (FX.leafT <= 0) {
      FX.leafT = rand(0.25, 0.6);
      const vis = G.trees.filter(([x, y]) => x * 16 > V.camX - 32 && x * 16 < V.camX + V.lw + 32 && y * 16 > V.camY - 32 && y * 16 < V.camY + V.lh + 32);
      if (vis.length) { const [tx, ty] = pick(vis); FX.leaves.push({ x: tx * 16 + rand(0, 16), y: ty * 16 + rand(-8, 2), gy: ty * 16 + rand(14, 34), t: 0, rest: 0, ph: rand(0, 6), col: pick(['#63c74d', '#8fd86e', '#f2a33a', '#e8c35a']) }); }
    }
    FX.leaves.forEach(l => { l.t += dt; if (l.y < l.gy) { l.y += 11 * dt; l.x += Math.sin(l.t * 3 + l.ph) * 10 * dt; } else l.rest += dt; });
    FX.leaves = FX.leaves.filter(l => l.rest < 3).slice(-60);
  } else {
    while (FX.motes.length < 26) FX.motes.push({ x: V.camX + rand(0, V.lw), y: V.camY + rand(0, V.lh), vx: rand(-3, 3), vy: rand(-4, -1), t: 0, life: rand(3, 7), ph: rand(0, 6) });
    FX.motes.forEach(mo => { mo.t += dt; mo.x += (mo.vx + Math.sin(mo.t + mo.ph) * 2) * dt; mo.y += mo.vy * dt; });
    FX.motes = FX.motes.filter(mo => mo.t < mo.life && mo.x > V.camX - 20 && mo.x < V.camX + V.lw + 20 && mo.y > V.camY - 20 && mo.y < V.camY + V.lh + 20);
  }
}
