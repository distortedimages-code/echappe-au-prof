// ================= LA PISCINE : nager, plonger 10 secondes, le plongeoir =================
const AIR_MAX = 10, BOARD_LIFT = 38;
const inWater = a => !!(G.m && G.m.pools) && G.m.get(Math.floor(a.x / 16), Math.floor((a.y - 4) / 16)) === K.WATER;
function splashFx(x, y, n, big) {
  for (let i = 0; i < n; i++) { const a = rand(Math.PI * 1.1, Math.PI * 1.9), s = rand(25, big ? 90 : 50); part(x + rand(-4, 4), y - 6, 'drop', { vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 180, life: rand(0.4, 0.8), col: pick(['#bfefff', '#ffffff', '#7fd8f0']) }); }
  puff(x, y - 4, big ? 10 : 4, '#e8f8ff');
}
// les élèves qui font des longueurs
function poolSetup() {
  const m = G.m; if (!m.pools) return;
  m.pools.forEach(p => {
    const rows = []; for (let y = p.y0 + (p.kid ? 0 : 1); y <= p.y1; y += p.kid ? 1 : 3) rows.push(y);
    shuffle(rows).slice(0, p.kid ? 1 : Math.min(3, rows.length)).forEach(y => {
      const x = rand(p.x0 * 16 + 10, (p.x1 + 1) * 16 - 10);
      G.kids.push({ cfg: randomChar(), x, y: y * 16 + 12, ang: 0, face: 2, anim: 0, moving: true, path: null, pi: 0, beh: 'swim', st: 0, ph: Math.random() * 6, isKid: true, sdir: Math.random() < 0.5 ? -1 : 1, spd: rand(0.6, 1.0) });
    });
  });
}
function poolSwimKid(k, dt) {
  const nx = Math.floor((k.x + k.sdir * 9) / 16), ty = Math.floor((k.y - 4) / 16);
  if (G.m.get(nx, ty) !== K.WATER) { k.sdir *= -1; }
  const ox = k.x; k.x += k.sdir * k.spd * 16 * dt; k.dist = (k.dist || 0) + Math.abs(k.x - ox);
  k.moving = true; k.face = k.sdir > 0 ? 2 : 3; k.ang = k.sdir > 0 ? 0 : Math.PI;
  if (k.vis && Math.random() < dt * 1.5) part(k.x - k.sdir * 6, k.y - 8, 'drop', { vx: -k.sdir * rand(10, 30), vy: rand(-40, -15), g: 160, life: 0.4, col: '#ffffff' });
}
// ---------- l'élève ----------
function poolPlayer(dt) {
  const P = G.P;
  if (P.jumpA) {
    const J = P.jumpA; J.t += dt / 0.85; const t = Math.min(1, J.t);
    P.x = lerp(J.x0, J.x1, t); P.y = lerp(J.y0, J.y1, t); P.lift = (1 - t) * BOARD_LIFT + Math.sin(t * Math.PI) * 22;
    P.moving = false; P.running = false; P.face = J.face; P.spin = t < 0.9 ? 0.6 : 0;
    if (t >= 1) poolSplash();
    return true;
  }
  if (P.board) { P.moving = false; P.running = false; P.lift = BOARD_LIFT + Math.sin(G.time * 3) * 0.5; P.face = G.m.board.dir > 0 ? 2 : 3; return true; }
  return false;
}
function poolAfterMove(dt) {
  const P = G.P, was = !!P.swim; P.swim = inWater(P);
  if (P.air == null) P.air = AIR_MAX;
  if (P.swim && !was) {
    const loud = P.running; splashFx(P.x, P.y, loud ? 16 : 6, loud); AU.sfx('splash', loud ? 1 : 0.45);
    makeNoise(P.x, P.y, loud ? 7 : 2.5, loud ? 'PLOUF !' : 'ploc');
    if (!G.poolTip) { G.poolTip = true; toast('🏊 Dans l’eau ! Le maître nageur ne nage pas… 🤿 Plonge pour disparaître (10 s max).', 3.4); }
  }
  if (!P.swim && was) { P.under = false; P.dripT = 3; }
  if (P.dripT > 0) { P.dripT -= dt; if (Math.random() < dt * 6) part(P.x + rand(-4, 4), P.y - rand(4, 20), 'drop', { vx: 0, vy: 10, g: 120, life: 0.4, col: '#bfefff' }); }
  if (P.swim && !P.under && P.running && P.moving) { P.splT = (P.splT || 0) - dt; if (P.splT <= 0) { P.splT = 0.45; makeNoise(P.x, P.y, 4.5, 'splash'); splashFx(P.x, P.y, 4); AU.sfx('splash', 0.25); } }
  if (P.under) {
    P.air -= dt;
    if (Math.random() < dt * 5) part(P.x + rand(-3, 3), P.y - 6, 'drop', { vx: 0, vy: -18, g: -10, life: 0.6, col: '#ffffff' });
    if (P.air <= 0) poolSurface(true);
    else if (P.air < 3 && !P.airWarn) { P.airWarn = true; toast('🫧 Plus beaucoup d’air…', 1.4); }
  } else { P.air = Math.min(AIR_MAX, P.air + dt * 1.6); P.airWarn = false; }
}
function poolDive() {
  const P = G.P; if (!P.swim || P.under) return;
  if (P.air < 2.5) { toast('😮‍💨 Reprends ton souffle d’abord…', 1.4); return; }
  P.under = true; AU.sfx('splash', 0.35); splashFx(P.x, P.y, 5); cue(P.x, P.y - 22, 'word', 'blub', { col: '#bfefff', life: 0.8 });
}
function poolSurface(gasp) {
  const P = G.P; if (!P.under) return; P.under = false; splashFx(P.x, P.y, 4);
  for (let i = 0; i < 9; i++) part(P.x + rand(-1, 1), P.y - 22, 'drop', { vx: rand(-14, 14), vy: rand(-90, -55), g: 220, life: 0.7, col: pick(['#ffffff', '#bfefff', '#7fd8f0']) });   // pfff ! le jet d'eau
  if (gasp) { cue(P.x, P.y - 30, 'word', 'GASP !', { col: '#ffffff', pop: true, life: 0.9 }); makeNoise(P.x, P.y, 3.5, 'GASP !'); toast('😮‍💨 Plus d’air ! Il fallait remonter respirer.', 2); AU.sfx('boing', 0.4); }
}
function poolLadderFoot(B) {
  const m = G.m; for (const [dx, dy] of [[-B.dir, 0], [0, 1], [0, -1]]) if (m.get(B.lx + dx, B.ly + dy) === K.FLOOR) return [B.lx + dx, B.ly + dy];
  return null;
}
function poolClimb() {
  const P = G.P, B = G.m.board; if (!B) return;
  AU.sfx('tick', 0.5);
  P.busy = { label: 'Je grimpe au plongeoir…', dur: 1.4, t: 0, done: () => {
    P.board = true; P.hidden = null; P.x = B.ex * 16 + 8; P.y = B.ey * 16 + 12; P.lift = BOARD_LIFT; AU.sfx('boing', 0.4);
    toast('🪜 Tout là-haut ! 🤸 Saute quand le maître nageur arrive : il ne te suivra pas dans l’eau.', 3.2);
  } };
}
function poolDown() {
  const P = G.P, B = G.m.board, f = B && poolLadderFoot(B); P.board = false; P.lift = 0;
  if (f) { P.x = f[0] * 16 + 8; P.y = f[1] * 16 + 12; }
}
function poolJump() {
  const P = G.P, B = G.m.board; if (!P.board || !B) return;
  P.board = false; P.jumpA = { t: 0, x0: P.x, y0: P.y, x1: B.land[0] * 16 + 8, y1: B.land[1] * 16 + 12, face: P.face };
  AU.sfx('whoosh'); hop(P, 40);
  cue(P.x, P.y - 56, 'word', pick(['BOMBE !!', 'YOUHOUUU !', 'GERONIMOOO !', 'À L’EAU !']), { col: '#ffd23f', pop: true, life: 1 });
}
function poolSplash() {
  const P = G.P, T = G.T; P.jumpA = null; P.lift = 0; P.spin = 0; P.swim = true; P.under = true; P.air = AIR_MAX;
  splashFx(P.x, P.y, 34, true); AU.sfx('splash'); G.shake = 0.35; FX.punch && FX.punch(0.08);
  cue(P.x, P.y - 34, 'word', 'SPLAAASH !', { col: '#bfefff', pop: true, life: 1.2 });
  makeNoise(P.x, P.y, 10, 'SPLASH !');
  if (T && !T.gone && !['sleep', 'caught', 'count'].includes(T.state)) {
    if (dist(T.x, T.y, P.x, P.y) < 5 * 16) { T.slipT = 2.6; T.path = null; T.detect = 0; T.state = 'look'; T.st = 3; T.lookBase = T.ang; say('BEURK ! Je suis trempé !'); toast('💦 Le maître nageur est trempé ! Il ne voit plus rien. Nage !', 2.6); }
    else if (T.state === 'edge' || T.state === 'chase') { T.state = 'look'; T.st = 2.5; T.lookBase = T.ang; T.path = null; T.detect = 0; }
  }
}
function poolActions(P) {
  if (P.jumpA) return [];
  if (P.board) return [{ id: 'pjump', icon: '🤸', label: 'Sauter !', sub: 'PLOUF', prio: 0 }, { id: 'pdown', icon: '🪜', label: 'Redescendre', sub: '' }];
  if (P.swim) return [P.under ? { id: 'psurface', icon: '⬆️', label: 'Remonter', sub: Math.ceil(P.air) + ' s d’air' } : { id: 'pdive', icon: '🤿', label: 'Plonger', sub: P.air < 2.5 ? 'souffle…' : '10 s sous l’eau' }];
  const B = G.m.board;
  if (B && Math.hypot(B.lx * 16 + 8 - P.x, B.ly * 16 + 8 - (P.y - 6)) < 24) return null;   // l'échelle : proposée avec le reste (voir computeActions)
  return null;
}
// ---------- le maître nageur : il ne nage pas, il attend au bord en sifflant ----------
function poolNearestDeck(P) {
  const m = G.m, [px, py] = tileOf(P); let best = null, bd = 1e9;
  for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
    const x = px + dx, y = py + dy; if (m.get(x, y) !== K.FLOOR || !D4.some(([a, b]) => m.get(x + a, y + b) === K.WATER)) continue;
    const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
function poolTeacher(T, dt, sees, slow) {
  const P = G.P, B = G.m.board, wet = P.swim && !P.under, high = !!(P.board || P.jumpA), away = wet || high || P.under;
  if (T.state === 'edge') {
    if (!away) { T.state = 'chase'; T.chaseT = 0; T.repathT = 0; T.path = null; T.lostT = 0; return false; }
    if (P.under || P.jumpA) {
      T.edgeLost = (T.edgeLost || 0) + dt;
      if (T.edgeLost > 3) { T.state = 'look'; T.st = 2.5; T.lookBase = T.ang; T.path = null; T.detect = 0; say(nameLine(pick(['Où est passé·e {n} ?!', 'Sous l’eau ?! Je t’attends, tu vas bien remonter…', 'Disparu·e ?! Comme un poisson…']))); return true; }
    } else T.edgeLost = 0;
    T.edgeRe = (T.edgeRe || 0) - dt;
    if (T.edgeRe <= 0) { T.edgeRe = 0.9; const g = high && B ? poolLadderFoot(B) : poolNearestDeck(P); if (g) goTo(T, g[0], g[1]); }
    const r = followPath(T, T.prof.chase * 0.75 * 16 * slow, dt);
    if (r && r.x !== undefined) { onLocked(T, r); return true; }
    if (!T.moving) { T.ang += angDiff(Math.atan2(P.y - T.y, P.x - T.x), T.ang) * Math.min(1, dt * 6); T.face = faceFromAng(T.ang); }
    T.whT = (T.whT || 0) - dt;
    if (T.whT <= 0 && !P.under) {
      T.whT = 2.8; AU.sfx('whistle', 0.6); cue(T.x, T.y - 30, 'word', 'PRIIIT !', { col: '#9fe0ff', life: 0.9 });
      say(nameLine(high ? pick(['Descends de ce plongeoir, {n} !', 'Interdit de sauter sans moi, {n} !', 'Je monte te chercher, {n} !']) : pick(['Sors de l’eau, {n} !', 'Hors de l’eau, tout de suite !', 'Je t’attends au bord, {n}…'])));
    }
    // au bord, il t'attrape par le bras
    if (wet && dist(T.x, T.y, P.x, P.y) < 21) { caught('chase'); return true; }
    // au pied du plongeoir : s'il attend trop, il grimpe
    if (P.board && B) {
      const f = poolLadderFoot(B);
      if (f && Math.abs(T.x - (f[0] * 16 + 8)) + Math.abs(T.y - (f[1] * 16 + 12)) < 12) {
        T.climbT = (T.climbT || 0) + dt;
        if (T.climbT > 1.2 && !T.climbSaid) { T.climbSaid = true; cue(T.x, T.y - 36, 'word', 'Il grimpe !', { col: '#ff8a96', pop: true, life: 1.2 }); toast('😱 Il grimpe à l’échelle ! SAUTE !', 2); }
        if (T.climbT > 4.5) { P.board = false; P.lift = 0; caught('chase'); return true; }
      }
    }
    return true;
  }
  if (away && !P.under && !P.jumpA && (T.state === 'chase' || (sees && T.detect >= 1))) { T.state = 'edge'; T.edgeRe = 0; T.whT = 0.2; T.path = null; T.climbT = 0; T.climbSaid = false; T.edgeLost = 0; return true; }
  return false;
}
// ---------- dessin : on ne voit que la tête qui dépasse (ou des bulles) ----------
function drawSwimmer(c, cfg, v, a, o) {
  const x = a.x, mv = !!a.moving, t = G.time + (a.ph || 0), sk = colOf(SKINS, cfg.skin || 0);
  const capCol = colOf(CLOTHCOLS, (cfg.topCol || 0) + 3), dir = a.face === 3 ? -1 : 1, side = a.face === 2 || a.face === 3, back = a.face === 1;
  const bob = mv ? Math.round(Math.sin(t * 9)) : Math.round(Math.sin(t * 3) * 1.4);
  const y = a.y + bob, wl = Math.round(a.y - 6);   // la ligne d'eau (fixe), le nageur bouge un peu autour
  const P = (px, py, w, h, col) => { c.fillStyle = col; c.fillRect(rp(px), rp(py), w, h); };
  if (a.under) {
    // sous l'eau : une silhouette qui bat des pieds, et des bulles
    const k = Math.sin(t * 14) > 0;
    c.save(); c.globalAlpha = 0.34; c.fillStyle = '#0c2f4a';
    c.beginPath(); c.ellipse(x, a.y - 4, side ? 7 : 4, side ? 2.5 : 4, 0, 0, 7); c.fill();
    if (side) { P(x - dir * 9, a.y - 5 + (k ? -1 : 1), 3, 1, '#0c2f4a'); P(x - dir * 9, a.y - 3 + (k ? 1 : -1), 3, 1, '#0c2f4a'); } else { P(x - 3 + (k ? 1 : 0), a.y + 1, 2, 2, '#0c2f4a'); P(x + 1 - (k ? 1 : 0), a.y + 1, 2, 2, '#0c2f4a'); }
    c.globalAlpha = 0.5; c.fillStyle = capCol; c.beginPath(); c.ellipse(x + (side ? dir * 4 : 0), a.y - 5, 2.5, 2, 0, 0, 7); c.fill();
    c.restore();
    const tt = G.time * 1.8 + (a.ph || 0);
    for (let i = 0; i < 3; i++) { const f = (tt + i * 0.33) % 1, bx = rp(x + (side ? dir * 4 : 0) - 1 + i + Math.sin(tt * 3 + i) * 1.5), by = rp(a.y - 7 - f * 10); P(bx, by, 1, 1, 'rgba(255,255,255,0.85)'); if (i === 0 && f > 0.5) { P(bx + 1, by - 2, 2, 2, 'rgba(255,255,255,0.5)'); } }
  } else {
    // ronds dans l'eau (sur place) ou sillage (en nageant)
    c.lineWidth = 1;
    if (!mv) for (let kk = 0; kk < 2; kk++) { const r = (t * 0.8 + kk * 0.5) % 1; c.strokeStyle = `rgba(255,255,255,${(1 - r) * 0.55})`; c.beginPath(); c.ellipse(x, wl + 1, 6 + r * 9, 2 + r * 3, 0, 0, 7); c.stroke(); }
    else {
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.beginPath();
      if (side) { c.moveTo(x - dir * 5, wl); c.lineTo(x - dir * 17, wl - 4); c.moveTo(x - dir * 5, wl + 2); c.lineTo(x - dir * 17, wl + 6); }
      else { const sy = back ? 1 : -1; c.moveTo(x - 4, wl - sy); c.lineTo(x - 9, wl - sy * 9); c.moveTo(x + 4, wl - sy); c.lineTo(x + 9, wl - sy * 9); }
      c.stroke();
      if (Math.random() < 0.3) P(x - (side ? dir * rand(6, 14) : rand(-6, 6)), wl + rand(-2, 3), 1, 1, '#ffffff');
    }
    // le corps sous l'eau, bleuté
    c.save(); c.beginPath(); c.rect(x - 16, wl + 1, 32, 20); c.clip(); c.globalAlpha = 0.18;
    drawSprite0(c, cfg, v, Object.assign({}, a, { y: y + 3 }), Object.assign({}, o, { noShadow: true, tint: '#3a86b8', noLean: true }));
    c.restore();
    // la tête et les épaules qui dépassent
    c.save(); c.beginPath(); c.rect(x - 16, wl - 40, 32, 41); c.clip();
    drawSprite0(c, cfg, v, Object.assign({}, a, { y: y + 3, moving: false }), Object.assign({}, o, { noShadow: true, noLean: true, gait: 'idle', frame: 0 }));
    c.restore();
    // bonnet de bain et lunettes
    const hy = y + 3 - 32;   // le haut du dessin du personnage
    P(x - 4, hy + 8, 8, 1, capCol); P(x - 6, hy + 9, 12, 4, capCol); P(x - 5, hy + 9, 3, 1, 'rgba(255,255,255,0.55)');
    if (!back) {
      if (side) { P(x - dir * 5 - (dir < 0 ? 1 : 0), hy + 14, 6, 1, '#2a2a3a'); P(x + dir * 2 - 1, hy + 13, 3, 3, '#2a2a3a'); P(x + dir * 2, hy + 14, 1, 1, '#9fe0ff'); }
      else { P(x - 6, hy + 14, 12, 1, '#2a2a3a'); P(x - 4, hy + 13, 3, 3, '#2a2a3a'); P(x + 1, hy + 13, 3, 3, '#2a2a3a'); P(x - 3, hy + 14, 1, 1, '#9fe0ff'); P(x + 2, hy + 14, 1, 1, '#9fe0ff'); }
    }
    // les bras qui font le crawl (ou qui battent l'eau sur place)
    const ph = mv ? (a.dist || 0) * 0.32 : t * 3.2;
    for (let s2 = 0; s2 < 2; s2++) {
      const th = ph + s2 * Math.PI, up = Math.sin(th);
      if (mv && up > 0) {
        const sx = side ? x + dir * 1 : x + (s2 ? 6 : -6), sy2 = wl - 2;
        const tx = side ? sx + dir * Math.cos(th) * -7 : sx + (s2 ? 1 : -1) * Math.cos(th) * 2, ty = sy2 - up * 8;
        for (let i = 0; i <= 4; i++) P(lerp(sx, tx, i / 4) - 1, lerp(sy2, ty, i / 4) - 1, 2, 2, sk);
        P(tx - 1, ty - 2, 3, 2, sk);
      } else if (!mv && s2 === 0) { const hx = Math.round(Math.sin(t * 6) * 2); P(x - 9 + hx, wl - 1, 3, 2, sk); P(x + 6 - hx, wl - 1, 3, 2, sk); }
      // l'eau qui gicle quand le bras replonge
      const key = 'arm' + s2, was = a[key]; a[key] = up > 0;
      if (mv && was && up <= 0 && a.vis !== false && Math.random() < 0.9) {
        const ex = side ? x - dir * 6 : x + (s2 ? 7 : -7);
        for (let i = 0; i < 3; i++) part(ex, wl - 1, 'drop', { vx: rand(-25, 25), vy: rand(-55, -30), g: 200, life: 0.45, col: pick(['#ffffff', '#bfefff']) });
      }
    }
    // ligne d'eau nette, avec de l'écume
    P(x - 7, wl, 14, 1, 'rgba(255,255,255,0.9)'); P(x - 8, wl + 1, 2, 1, 'rgba(255,255,255,0.6)'); P(x + 6, wl + 1, 2, 1, 'rgba(255,255,255,0.6)');
    if ((t * 4 | 0) % 3 === 0) P(x + (Math.sin(t * 5) > 0 ? -9 : 8), wl - 1, 1, 1, '#ffffff');
  }
  if (a === G.P && (a.under || a.air < AIR_MAX - 0.05)) {
    const n = Math.ceil(a.air), y0 = a.y - (a.under ? 18 : 34);
    for (let i = 0; i < AIR_MAX; i++) { c.fillStyle = i < n ? (a.air < 3 ? '#ff8a96' : '#bfefff') : 'rgba(255,255,255,0.2)'; c.fillRect(rp(x - 10 + i * 2), rp(y0), 1, 2); }
  }
}
// reflets qui bougent sur l'eau, et l'ombre de la planche
function poolDynamic(c, ox, oy, inView) {
  const m = G.m; if (!m.pools) return;
  c.fillStyle = 'rgba(255,255,255,0.16)';
  m.pools.forEach(p => {
    for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) {
      if (!inView(x, y)) continue;
      const t = G.time * 0.9 + x * 0.7 + y * 1.3, a = (Math.sin(t) + 1) * 0.5;
      c.fillRect(x * 16 + ox + ((a * 10) | 0) + 1, y * 16 + oy + ((x * 7 + y * 5) % 11) + 2, 4, 1);
    }
  });
  const B = m.board;
  if (B && inView(B.lx, B.ly)) { c.fillStyle = 'rgba(10,30,60,0.28)'; const xa = B.dir > 0 ? (B.lx + 1) * 16 : B.ex * 16, xb = B.dir > 0 ? (B.ex + 1) * 16 : B.lx * 16; c.fillRect(xa + ox, B.ly * 16 + oy + 3, xb - xa, 3); }
}
