// ================= PLUS DE VIE DANS LE COLLÈGE =================
// Match de foot dans la cour, élèves qui se baladent par deux, bavardages sur les bancs,
// et l'élève aux toilettes qu'il ne faut pas surprendre en courant…
function lifeSetup() {
  const L = G.L, m = G.m; G.foot = null;
  if (G.net || G.inf) return;
  const outdoor = !!L.outdoor;
  // les endroits où les élèves se promènent : la cour, ou les couloirs et grandes salles à l'intérieur
  if (!L.kidSpots || !L.kidSpots.length) {
    const sp = [];
    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
      if (m.get(x, y) !== K.FLOOR || /Toilettes|Loge|Infirmerie|Douches/.test(m.roomAt(x, y))) continue;
      let free = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (m.get(x + dx, y + dy) === K.FLOOR) free++; });
      if (free >= 3 && Math.abs(x - L.start[0]) + Math.abs(y - L.start[1]) > 6) sp.push([x, y]);
    }
    L.kidSpots = shuffle(sp).slice(0, 60);
  }
  const spots = L.kidSpots; if (!spots.length) return;
  const mk = (x, y, beh, o) => { const k = Object.assign({ cfg: randomChar(), x, y, ang: Math.PI / 2, face: 0, anim: 0, moving: false, path: null, pi: 0, beh, st: rand(0, 2), ph: Math.random() * 6, isKid: true }, o || {}); G.kids.push(k); return k; };
  // 1) match de foot sur le terrain
  const court = m.fdecor.find(d => d.t === 'court');
  if (outdoor && court) {
    const f = { x0: court.x * 16 + 6, y0: court.y * 16 + 6, x1: (court.x + court.w) * 16 - 6, y1: (court.y + court.h) * 16 - 6 };
    G.foot = { x: (f.x0 + f.x1) / 2, y: (f.y0 + f.y1) / 2, vx: 0, vy: 0, z: 0, vz: 0, f, score: [0, 0], resetT: 0, kickT: 0 };
    for (let i = 0; i < 6; i++) {
      const team = i % 2, k = mk(lerp(f.x0, f.x1, team ? 0.65 : 0.35) + rand(-14, 14), lerp(f.y0, f.y1, 0.2 + (i >> 1) * 0.3), 'foot', { team, kcd: 0 });
      k.cfg = Object.assign({}, k.cfg, { top: 7, topCol: team ? 6 : 0 }); k.home = [k.x, k.y];   // maillot de foot rouge ou bleu (index de la palette, pas une couleur !)
    }
  }
  // 2) des élèves qui se baladent par deux (en bavardant)
  const nPairs = outdoor ? 2 : 2;
  for (let p = 0; p < nPairs; p++) {
    const s = pick(spots), a = mk(s[0] * 16 + 8, s[1] * 16 + 12, 'pairL'), b = mk(a.x + 10, a.y, 'pairF');
    b.mate = a; a.mate = b; a.slow = true;
  }
  // 3) sur les bancs de la cour
  if (outdoor) {
    const benches = []; for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) if (m.get(x, y) === K.BENCH && m.get(x, y + 1) === K.FLOOR) benches.push([x, y]);
    shuffle(benches).slice(0, 3).forEach(([x, y]) => { const k = mk(x * 16 + 8, y * 16 + 13, 'bench'); k.face = 0; k.noDoor = true; });
  }
}
// ---------- le foot ----------
function lifeFootBall(dt) {
  const B = G.foot; if (!B) return; const f = B.f;
  if (B.resetT > 0) { B.resetT -= dt; if (B.resetT <= 0) { B.x = (f.x0 + f.x1) / 2; B.y = (f.y0 + f.y1) / 2; B.vx = B.vy = 0; } return; }
  B.x += B.vx * dt; B.y += B.vy * dt; const fr = Math.pow(0.35, dt); B.vx *= fr; B.vy *= fr;
  B.vz -= 260 * dt; B.z = Math.max(0, B.z + B.vz * dt); if (B.z === 0 && B.vz < 0) B.vz = Math.abs(B.vz) > 40 ? -B.vz * 0.4 : 0;
  const midY = (f.y0 + f.y1) / 2, gh = 14;
  // but !
  if ((B.x < f.x0 + 2 || B.x > f.x1 - 2) && Math.abs(B.y - midY) < gh) {
    const team = B.x > f.x1 - 2 ? 0 : 1; B.score[team]++; B.resetT = 1.6;
    const fans = G.kids.filter(k => k.beh === 'foot' && k.team === team); fans.forEach(k => hop(k, 120));
    const sp = fans[0]; if (sp) { sp.bub = { text: pick(['BUUUT !! ⚽', 'GOOOAL !', 'Et c’est le but !', 'Trop fort !!']), t: 0, dur: 1.8 }; const d = dist(sp.x, sp.y, G.P.x, G.P.y) / 16; if (d < 12) { AU.babble(clamp(1 - d / 12, 0.1, 0.8), panOf(sp.x), true); AU.sfx('whistle', clamp(0.6 - d / 20, 0.05, 0.4)); } }
    return;
  }
  if (B.x < f.x0) { B.x = f.x0; B.vx = Math.abs(B.vx) * 0.6; } if (B.x > f.x1) { B.x = f.x1; B.vx = -Math.abs(B.vx) * 0.6; }
  if (B.y < f.y0) { B.y = f.y0; B.vy = Math.abs(B.vy) * 0.6; } if (B.y > f.y1) { B.y = f.y1; B.vy = -Math.abs(B.vy) * 0.6; }
  // le joueur peut taper dans le ballon en passant
  const P = G.P; if (P && !P.hidden && B.z < 4 && dist(P.x, P.y - 2, B.x, B.y) < 8 && P.moving) { const a = Math.atan2(B.y - P.y, B.x - P.x), sp = P.running ? 150 : 80; B.vx = Math.cos(a) * sp; B.vy = Math.sin(a) * sp; B.vz = P.running ? 70 : 20; footKickFx(B); }
}
function footKickFx(B) { const d = dist(B.x, B.y, G.P.x, G.P.y) / 16; if (d < 12) AU.foot('wood', 'adult', clamp(1 - d / 12, 0.05, 0.6) * 0.8, panOf(B.x)); }
function lifeFoot(k, dt) {
  const B = G.foot; if (!B) { k.moving = false; return; }
  const f = B.f, mates = G.kids.filter(o => o.beh === 'foot' && o.team === k.team);
  const chaser = mates.reduce((a, o) => dist(o.x, o.y, B.x, B.y) < dist(a.x, a.y, B.x, B.y) ? o : a, mates[0]);
  let tx, ty, spd;
  if (B.resetT > 0) { tx = k.home[0]; ty = k.home[1]; spd = 1.6 * 16; }
  else if (k === chaser) { const goalX = k.team ? f.x0 : f.x1; tx = B.x - Math.sign(goalX - B.x) * 5; ty = B.y; spd = 2.9 * 16; }
  else { tx = lerp(k.home[0], B.x, 0.35); ty = lerp(k.home[1], B.y, 0.25); spd = 2.2 * 16; }
  // (avec un peu d'hystérésis : sinon il repart / s'arrête / se retourne à chaque image et le sprite clignote)
  if (!lifeWalk(k, tx, ty, spd, dt, 6, 2.5)) steadyFace(k, faceFromAng(Math.atan2(B.y - k.y, B.x - k.x)), dt, 0.25);
  k.runK = spd > 2.5 * 16;
  k.kcd = (k.kcd || 0) - dt;
  if (k === chaser && B.resetT <= 0 && k.kcd <= 0 && B.z < 5 && dist(k.x, k.y - 2, B.x, B.y) < 9) {
    const goalX = k.team ? f.x0 : f.x1, goalY = (f.y0 + f.y1) / 2 + rand(-12, 12), a = Math.atan2(goalY - B.y, goalX - B.x) + rand(-0.6, 0.6), sp = rand(70, 140);
    B.vx = Math.cos(a) * sp; B.vy = Math.sin(a) * sp; B.vz = Math.random() < 0.3 ? rand(50, 90) : 10; k.kcd = rand(0.6, 1.1); hop(k, 70); footKickFx(B);
  }
}
function drawFootBall(c) {
  const B = G.foot; if (!B || B.resetT > 0.8) return;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(B.x, B.y + 1, 3, 1.4, 0, 0, 7); c.fill();
  const y = B.y - 2 - B.z; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(B.x, y, 2.4, 0, 7); c.fill();
  c.fillStyle = '#222'; c.fillRect(Math.round(B.x) - 1, Math.round(y) - 1, 1, 1); c.fillRect(Math.round(B.x) + 1, Math.round(y), 1, 1);
}
// ---------- balades à deux ----------
// marche vers une cible avec hystérésis (départ au-delà de « go », arrêt sous « stop ») et une pose stable
function lifeWalk(k, tx, ty, spd, dt, go, stop) {
  const dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy);
  k.lw = k.lw ? d >= stop : d > go;
  if (!k.lw) { k.mvT = (k.mvT || 0) - dt; if (k.mvT <= 0) k.moving = false; return false; }
  const st = Math.min(d, spd * dt), ox = k.x, oy = k.y;
  moveA(k, dx / d * st, dy / d * st, solidP, 4, 4);
  const mv = Math.hypot(k.x - ox, k.y - oy);
  if (mv > 0.05) { k.moving = true; k.mvT = 0.2; k.dist = (k.dist || 0) + mv; k.anim = (k.anim || 0) + dt; k.ang = Math.atan2(dy, dx); steadyFace(k, faceFromAng(k.ang), dt, 0.12); }
  else { k.mvT = (k.mvT || 0) - dt; if (k.mvT <= 0) k.moving = false; }
  return true;
}
// on ne change de direction que si la nouvelle dure un peu (évite le clignotement gauche/droite)
function steadyFace(k, nf, dt, hold) {
  if (nf === k.face) { k.fT = 0; k.fC = nf; return; }
  if (k.fC !== nf) { k.fC = nf; k.fT = 0; }
  k.fT = (k.fT || 0) + dt; if (k.fT >= hold) { k.face = nf; k.fT = 0; }
}
function lifePairF(k, dt) {
  const a = k.mate; if (!a) { k.moving = false; return; }
  const ang = a.moving ? a.ang || 0 : (k.sideA != null ? k.sideA : 0); if (a.moving) k.sideA = ang;
  const tx = a.x + Math.cos(ang + Math.PI / 2) * 11, ty = a.y + Math.sin(ang + Math.PI / 2) * 6;
  const dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy);
  if (d > 40) { const [kx, ky] = tileOf(k), [ax, ay] = tileOf(a); if ((!k.path || k.pi >= k.path.length || (k.repT = (k.repT || 0) - dt) <= 0) && (G.pathBudget = (G.pathBudget || 0) - 1) >= 0) { k.repT = 1.2; const p = astar(kx, ky, ax, ay, passTeach(false)); if (p) { k.path = p; k.pi = 0; } } followPath(k, 2.4 * 16, dt); return; }
  // en marchant avec le copain : on colle à sa vitesse (rattrapage doux), à l'arrêt : petite marge pour ne pas trembloter
  if (a.moving) { if (!lifeWalk(k, tx, ty, Math.min(2.6 * 16, 1.5 * 16 + d * 5), dt, 0.6, 0.3)) steadyFace(k, a.face, dt, 0.2); }
  else if (!lifeWalk(k, tx, ty, 1.4 * 16, dt, 3, 1.2)) steadyFace(k, faceFromAng(Math.atan2(a.y - k.y, a.x - k.x)), dt, 0.25);
  if (!a.moving && !k.moving) a.face = faceFromAng(Math.atan2(k.y - a.y, k.x - a.x));
}
// ---------- l'élève aux toilettes ----------
const PIPI_SCARED = ['AAAH ! T’as failli me faire rater !', 'WOUAH ! Tu m’as fait peur !!', 'Oh nooon… à côté !', 'MAIS ÇA VA PAS ?!'];
const PIPI_BUSY = ['Hé ! C’est occupé ! 😤', 'On frappe avant d’entrer…', 'Ça se fait pas de regarder !'];
function gagsUpdate(dt) {
  const m = G.m; if (!m || !m.npcGags) return;
  const P = G.P, local = !(G.net && !(G.inf && G.inf.coop));
  m.npcGags.forEach(g => {
    if (g.bub) { g.bub.t += dt; if (g.bub.t > g.bub.dur) g.bub = null; }
    g.cd -= dt; g.st -= dt;
    const d = P && !P.hidden && !P.out ? dist(P.x, P.y, g.x, g.y) / 16 : 99;
    if (g.state === 'busy') {
      g.face = 1; g.moving = false; g.hz = 0;
      if (local && g.cd <= 0) {
        const fast = P.running && !(P.slip > 0) && !(P.small > 0);
        if (fast && d < 2.8) gagScare(g);
        else if (!fast && d < 1.2 && P.lastG !== 'sneak' && P.moving) { g.bub = { text: pick(PIPI_BUSY), t: 0, dur: 1.8 }; g.cd = 6; g.face = faceFromAng(Math.atan2(P.y - g.y, P.x - g.x)); g.state = 'look'; g.st = 1.4; }
      }
    } else if (g.st <= 0) { g.state = 'busy'; g.x = g.home[0]; g.y = g.home[1]; }
    else if (g.state === 'scared' || g.state === 'look') { if (P) g.face = faceFromAng(Math.atan2(P.y - g.y, P.x - g.x)); }
    g.vis = G.net && G.net.role === 'teacher' ? (G.eye && Math.hypot(g.x - G.eye[0], g.y - G.eye[1]) < G.visR && los(G.eye[0], G.eye[1], g.x, g.y - 10)) : regionVisible(g.x, g.y);
  });
  // flaques : elles sèchent, et font glisser
  m.puddles = (m.puddles || []).filter(p => G.time - p.t < 50);
  m.puddles.forEach(p => {
    p.r = Math.min(p.max, p.r + dt * 14);
    if (P && !P.hidden && P.running && !(P.skidT > 0) && dist(P.x, P.y, p.x, p.y) < p.r + 2) {
      P.skidT = 0.45; P.skv = [P.lastDir ? P.lastDir[0] * PL_RUN : 0, P.lastDir ? P.lastDir[1] * PL_RUN : 0]; AU.sfx('splash'); squash(P, 6);
      if (!G.puddleTold) { G.puddleTold = true; toast('🤢 Beurk, ça glisse… et c’est pas de l’eau.', 2.2); }
    }
    const T = G.T;
    if (T && !T.gone && (T.state === 'chase' || T.running) && !(T.slipT > 0) && dist(T.x, T.y, p.x, p.y) < p.r + 2 && (!G.net || (G.inf && G.inf.coop && G.inf.auth))) {
      T.slipT = 1.6; AU.sfx('splash'); T.bubble = { text: pick(['WAAAH ! C’est quoi ça ?!', 'Ouh là là… ça glisse !', 'BEURK !']), t: 0, dur: 1.8 }; hop(T, 130);
    }
  });
}
function gagScare(g) {
  const m = G.m; g.state = 'scared'; g.st = 2.6; g.cd = 7; hop(g, 140); squash(g, 6);
  g.bub = { text: pick(PIPI_SCARED), t: 0, dur: 2.2 };
  const d = dist(g.x, g.y, G.P.x, G.P.y) / 16;
  AU.sfx('kidscream', clamp(1.1 - d / 10, 0.3, 1)); AU.babble(0.8, panOf(g.x), true);
  makeNoise(g.x, g.y, 6, 'AAAH !', 'scream');
  if (g.n < 3) { g.n++; m.puddles.push({ x: g.x + rand(-6, 6), y: g.y + 5 + rand(-1, 2), r: 1, max: rand(5, 7), t: G.time }); }
}
function drawGag(c, g) { drawSprite(c, g.cfg, null, g, {}); }
function drawPuddles(c) {
  (G.m && G.m.puddles || []).forEach(p => {
    const a = clamp(1 - (G.time - p.t - 40) / 10, 0, 1); c.globalAlpha = a;
    c.fillStyle = 'rgba(232,206,60,0.55)'; c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * 0.5, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,246,170,0.6)'; c.fillRect(Math.round(p.x - p.r * 0.4), Math.round(p.y - p.r * 0.2), 2, 1);
    c.globalAlpha = 1;
  });
}
