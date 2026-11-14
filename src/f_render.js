// ================= RENDU (rétro moderne) =================
// qualité d'affichage : si le téléphone peine, on baisse un peu la résolution (le jeu est en pixel art)
const Q_LEVELS = [2, 1.6, 1.3, 1];
const Perf = {
  q: Math.min(Q_LEVELS.length - 1, Math.max(0, +(store.get('nds_q', 0)) || 0)), acc: 0, n: 0, lowered: false, good: 0,
  tick(dt) {
    if (G.mode !== 'play' || document.hidden) { this.acc = 0; this.n = 0; return; }
    this.acc += dt; this.n++;
    if (this.acc < 2) return;
    const avg = this.acc / this.n; this.acc = 0; this.n = 0;
    if (avg > 0.0215 && this.q < Q_LEVELS.length - 1 && (window.devicePixelRatio || 1) > Q_LEVELS[this.q + 1]) { this.q++; this.lowered = true; this.good = 0; store.set('nds_q', this.q); resizeView(); }
    else if (avg < 0.0175 && this.q > 0 && !this.lowered) { if (++this.good >= 6) { this.good = 0; this.q--; store.set('nds_q', this.q); resizeView(); } }
  }
};
const V = { cv: null, ctx: null, lo: null, lx: null, fog: null, fx: null, S: 3, lw: 0, lh: 0, dpr: 1, camX: 0, camY: 0, W: 0, H: 0, a: 1, e: 0, f: 0, post: null };
function setupView() {
  V.cv = document.getElementById('game'); V.ctx = V.cv.getContext('2d');
  [V.lo, V.lx] = mkCanvas(10, 10); [V.fog, V.fx] = mkCanvas(10, 10);
  resizeView(); addEventListener('resize', resizeView);
}
function resizeView() {
  const dpr = Math.min(Q_LEVELS[Perf.q], window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
  V.dpr = dpr; V.W = Math.round(w * dpr); V.H = Math.round(h * dpr); V.cv.width = V.W; V.cv.height = V.H;
  V.S = Math.max(2, Math.round(Math.min(w, h) / (12 * 16) * dpr));
  V.lw = Math.ceil(V.W / V.S) + 2; V.lh = Math.ceil(V.H / V.S) + 2;
  V.lo.width = V.lw; V.lo.height = V.lh; V.fog.width = V.lw; V.fog.height = V.lh;
  V.lx.imageSmoothingEnabled = false; V.ctx.imageSmoothingEnabled = false;
  bakePost();
}
// halo de lumière chaude, dessiné une seule fois
let GLOW = null;
function glowSprite() {
  if (GLOW) return GLOW; const [c, x] = mkCanvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,214,150,1)'); g.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (GLOW = c);
}
function bakePost() {
  const [c, x] = mkCanvas(V.W, V.H);
  const g = x.createRadialGradient(V.W / 2, V.H / 2, Math.min(V.W, V.H) * 0.42, V.W / 2, V.H / 2, Math.hypot(V.W, V.H) * 0.62);
  g.addColorStop(0, 'rgba(10,4,24,0)'); g.addColorStop(1, 'rgba(10,4,24,0.55)'); x.fillStyle = g; x.fillRect(0, 0, V.W, V.H);
  if (AU.set.crt) { const step = Math.max(3, Math.round(V.dpr * 2)); x.fillStyle = 'rgba(0,0,0,0.11)'; for (let y = 0; y < V.H; y += step) x.fillRect(0, y, V.W, Math.max(1, step / 3)); }
  V.post = c;
  // trame BD (points)
  const [h, hx] = mkCanvas(12, 12); hx.fillStyle = 'rgba(20,8,40,0.5)'; hx.beginPath(); hx.arc(6, 6, 2.2, 0, 7); hx.fill();
  V.halftone = V.ctx.createPattern(h, 'repeat');
}
const rp = v => Math.round(v * V.a) / V.a;
const TINTS = new WeakMap();
function tinted(cv, col) {
  let m = TINTS.get(cv); if (!m) { m = {}; TINTS.set(cv, m); }
  if (m[col]) return m[col];
  const [c, x] = mkCanvas(cv.width, cv.height); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, cv.width, cv.height);
  return (m[col] = c);
}
// Dessine un personnage (coordonnées monde, contexte déjà transformé)
function drawSprite(c, cfg, v, a, o = {}) {
  const scale = o.scale || 1, alpha = o.alpha == null ? 1 : o.alpha;
  const g = o.gait || gaitOf(a), fr = o.frame != null ? o.frame : frameOf(a, g), pose = poseOf(g, fr);
  const face = o.face != null ? o.face : a.face, dir = face === 3 ? 2 : face, side = dir === 2;
  let vv = v; if (a.blink > 0 && dir !== 1 && !o.noBlink) vv = Object.assign({}, v || {}, { eyes: 3 });
  let cv = charCanvas(cfg, dir, fr, vv, g); if (o.tint) cv = tinted(cv, o.tint);
  const hz = (o.hz != null ? o.hz : (a.hz || 0)) + (o.noPoseBob ? 0 : pose.bob * scale), x = a.x + (o.dx || 0), y = a.y;
  if (!o.noShadow) { const sw = (v && v.wide ? 7.5 : 5.5) * scale * (1 - Math.min(0.5, hz / 24)) * (o.shadowW || 1); c.fillStyle = `rgba(10,6,20,${0.3 * alpha})`; c.beginPath(); c.ellipse(x, y, sw, sw * 0.36, 0, 0, 7); c.fill(); }
  const sq = clamp((a.sq || 0) + pose.sq, -0.5, 0.5);
  let sx = (1 + sq) * (o.sx || 1), sy = (1 - sq) * (o.sy || 1);
  if (g === 'sneak') { sy *= 0.92; sx *= 1.05; }
  if ((g === 'idle' || g === 'tap') && !o.still) sy *= 1 + Math.sin(G.time * 3.4 + (a.ph || 0)) * 0.022;
  if (a.spin > 0 && !o.noSpin) sx *= Math.cos(a.spin * 22);
  const w = 20 * scale, h = 34 * scale;
  c.save(); c.globalAlpha = alpha; c.translate(rp(x), rp(y - hz + (o.bob || 0)));
  let rot = o.rot || 0;
  if (!o.noLean) {
    if (side) rot += (LEAN[g] || 0) * (face === 3 ? -1 : 1);
    if (g === 'sneak') rot += Math.sin((a.dist || 0) / STRIDE.sneak * Math.PI * 2) * 0.08;
    else if (g === 'walk') rot += Math.sin((a.dist || 0) / STRIDE.walk * Math.PI * 2) * 0.04;
    else if (g === 'run' && !side) rot += Math.sin((a.dist || 0) / STRIDE.run * Math.PI * 2) * 0.06;
  }
  if (rot) c.rotate(rot);
  c.scale(face === 3 ? -sx : sx, sy);
  c.drawImage(cv, -w / 2, -32 * scale, w, h);
  c.restore();
}
function drawDoor(c, d, px, py) {
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h); };
  const wood = '#a8703a', dark = '#6b4220', frame = '#4a2a14';
  if (d.horiz) {
    if (d.open < 0.5) { R(0, 0, 16, 16, frame); R(1, 1, 14, 15, wood); R(3, 3, 10, 4, dark); R(3, 9, 10, 5, dark); R(11, 8, 2, 2, '#ffd23f'); R(1, 1, 14, 1, '#c99260'); }
    else { const lw = Math.round(3 + (1 - Math.min(1, d.open)) * 8); R(0, 0, 2, 16, frame); R(14, 0, 2, 16, frame); R(0, 0, 16, 2, frame); R(2, 2, lw, 13, wood); R(2, 2, lw, 1, '#c99260'); }
  } else {
    if (d.open < 0.5) { R(5, 0, 6, 16, frame); R(6, 0, 4, 16, wood); R(6, 7, 4, 2, '#ffd23f'); }
    else { const lh = Math.round(3 + (1 - Math.min(1, d.open)) * 6); R(5, 0, 6, 2, frame); R(5, 14, 6, 2, frame); R(7, 2, 9, lh, wood); R(7, 2, 9, 1, '#c99260'); }
  }
  if (d.locked) { c.fillStyle = 'rgba(255,40,60,0.22)'; c.fillRect(px, py, 16, 16); const b = Math.round(Math.sin(G.time * 5) * 1); R(5, 7 + b, 6, 5, '#ffd23f'); R(6, 4 + b, 1, 3, '#d0d6e0'); R(9, 4 + b, 1, 3, '#d0d6e0'); R(6, 4 + b, 4, 1, '#d0d6e0'); R(7, 9 + b, 2, 2, frame); }
}
function drawDynamic(c, ox, oy) {
  const x0 = Math.floor(V.camX / 16) - 1, y0 = Math.floor(V.camY / 16) - 1, x1 = x0 + Math.ceil(V.lw / 16) + 2, y1 = y0 + Math.ceil(V.lh / 16) + 2;
  const inView = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const m = G.m, L = G.L;
  L.hides.forEach(s => {
    if (!(s.shake > 0) || !inView(s.x, s.y) || s.k === K.DOOR) return;
    const j = Math.round(Math.sin(G.time * 60) * (s.shake > 0.1 ? 1.2 : 0.7)), px = s.x * 16 + ox, py = s.y * 16 + oy;
    if (s.k === K.LOCKER && m.get(s.x, s.y - 1) === K.WALL) drawWallTile(c, px, py, m.ws[s.y * m.w + s.x], true, s.x, s.y);
    else drawFloorTile(c, px, py, m.fs[s.y * m.w + s.x], s.x, s.y);
    drawFurniture(c, s.k, px + j, py, s.x, s.y, m, L);
  });
  G.doors.forEach(d => { if (inView(d.x, d.y)) drawDoor(c, d, d.x * 16 + ox, d.y * 16 + oy); });
  L.exits.forEach(e => {
    if (e.type === 'hold') {
      const p = e.done ? 1 : e.progress; if (p <= 0 || !inView(e.x, e.y)) return;
      const px = e.x * 16 + ox, py = e.y * 16 + oy, k = m.get(e.x, e.y);
      const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h); };
      if (k === K.X_WINDOW) { R(3, 5, 10, 7, '#cfeeff'); R(3, 5, 10, Math.round(7 * (1 - p)), '#8fd3ff'); R(3, 5 + Math.round(7 * (1 - p)), 10, 1, '#ffffff'); if (p > 0.6) { const fl = Math.round(Math.sin(G.time * 8)); R(2 + fl, 4, 2, 9, '#ff6f91'); R(12 - fl, 4, 2, 9, '#ff6f91'); } }
      else if (k === K.X_GATE) { R(0, 3, 16, 12, '#5aa64e'); R(0, 3, Math.round(16 * (1 - p)), 12, '#2f5a3a'); for (let i = 2; i < 16 * (1 - p); i += 3) R(i, 4, 1, 10, '#4f8a5a'); }
      else if (k === K.X_DOOR) { R(2, 2, Math.round(12 * p), 14, '#fff6c8'); if ((G.time * 4 | 0) % 2) R(5, 0, 6, 2, '#ff3040'); }
      else if (k === K.X_ELEV) { if ((G.time * 3 | 0) % 2) R(7, 1, 2, 1, '#3cff6e'); const g = Math.round(6 * Math.max(0, (p - 0.6) / 0.4)); R(8 - g, 3, g * 2, 13, '#fff6c8'); }
    } else if (e.type === 'search' && e.revealed) {
      const [sx, sy] = e.secret; if (!inView(sx, sy)) return;
      const px = sx * 16 + ox, py = sy * 16 + oy;
      c.fillStyle = '#140d1c'; c.fillRect(px + 2, py + 2, 12, 13); c.fillStyle = '#3a2a4a'; c.fillRect(px + 2, py + 2, 12, 2);
      c.fillStyle = (G.time * 6 | 0) % 2 ? '#fff6a0' : '#ff9fd8'; c.fillRect(px + 7, py + 7, 2, 2);
    }
  });
  G.searched.forEach(key => {
    const x = key % m.w, y = (key / m.w) | 0; if (!inView(x, y)) return;
    const px = x * 16 + ox, py = y * 16 + oy; c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(px + 12, py + 1, 3, 1); c.fillRect(px + 13, py, 1, 3);
  });
}
function conePath(c, A) {
  const T = A || G.T, pr = T.prof, ex = T.x, ey = T.y - 12, R = pr.range * 16 * 0.92;
  c.beginPath(); c.moveTo(ex, ey);
  const n = 30;
  for (let i = 0; i <= n; i++) { const a = T.ang - pr.fov + 2 * pr.fov * i / n, d = castRay(ex, ey, a, R); c.lineTo(ex + Math.cos(a) * d, ey + Math.sin(a) * d); }
  c.closePath();
}
function drawCone(c, A) {
  const T = A || G.T, pr = T.prof, ex = T.x, ey = T.y - 12, R = pr.range * 16;
  conePath(c, T);
  const col = T.state === 'chase' ? '255,60,80' : ((G.inf && G.inf.coop ? T.detShow || 0 : T.detect) > 0.3 || T.state === 'alert' || T.state === 'investigate') ? '255,160,50' : '255,236,140';
  const g = c.createRadialGradient(ex, ey, 4, ex, ey, R);
  g.addColorStop(0, `rgba(${col},0.38)`); g.addColorStop(0.7, `rgba(${col},0.16)`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fill();
  c.strokeStyle = `rgba(${col},0.35)`; c.lineWidth = 0.6; c.setLineDash([2, 2]); c.lineDashOffset = -G.time * 8; c.stroke(); c.setLineDash([]);
}
function drawItemW(c, it) {
  const bob = Math.sin(G.time * 3 + it.ph) * 1.6, x = it.x, y = it.y;
  c.fillStyle = 'rgba(10,6,20,0.28)'; c.beginPath(); c.ellipse(x, y - 1, 4 - bob * 0.4, 1.4, 0, 0, 7); c.fill();
  const g = c.createRadialGradient(x, y - 9 + bob, 1, x, y - 9 + bob, 11); g.addColorStop(0, 'rgba(255,240,170,0.45)'); g.addColorStop(1, 'rgba(255,240,170,0)');
  c.fillStyle = g; c.fillRect(x - 11, y - 20 + bob, 22, 22);
  c.save(); c.translate(x, y - 9 + bob); const s = 1 + Math.sin(G.time * 6 + it.ph) * 0.06; c.scale(s, s);
  c.drawImage(itemCanvas(it.kind), -7, -7); c.restore();
  const tw = (G.time * 1.5 + it.ph) % 1.5; if (tw < 0.3) { const a = 1 - tw / 0.3; c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x + 4, y - 15 + bob, 1, 3); c.fillRect(x + 3, y - 14 + bob, 3, 1); }
}
function drawEyes(c, s) {
  const near = dist(G.T.x, G.T.y, G.P.x, G.P.y) < 3 * 16 && G.T.state !== 'sleep';
  const px = s.x * 16 + 8 + (near ? Math.sin(G.time * 50) * 0.4 : 0), py = s.y * 16 + 6;
  const blink = !near && (G.time % 3.2) < 0.13;
  c.fillStyle = 'rgba(10,6,20,0.6)'; c.fillRect(px - 6, py - 2.5, 12, 6);
  c.fillStyle = '#ffffff';
  if (blink) { c.fillRect(px - 4, py, 3, 1); c.fillRect(px + 1, py, 3, 1); return; }
  const big = near ? 1 : 0;
  c.fillRect(px - 4 - big * 0.5, py - 1 - big * 0.5, 3 + big, 3 + big); c.fillRect(px + 1 - big * 0.5, py - 1 - big * 0.5, 3 + big, 3 + big);
  const look = near ? Math.sign(G.T.x - px) : Math.round(Math.sin(G.time * 0.9)); c.fillStyle = '#1d1626';
  c.fillRect(px - 3 + look * 0.8, py, 1, 1.6); c.fillRect(px + 2 + look * 0.8, py, 1, 1.6);
  if (near) { c.fillStyle = '#7fd0ff'; c.fillRect(px + 5, py - 3 + ((G.time * 3) % 1) * 3, 1, 2); }
}
function drawParts(c) {
  for (const p of G.parts) {
    const a = 1 - p.t / p.life; c.globalAlpha = Math.max(0, a); c.fillStyle = p.col;
    const x = p.x, y = p.y;
    switch (p.type) {
      case 'puff': { const s = p.size * (1 + p.t / p.life * 1.8); c.beginPath(); c.arc(x, y, s * 0.7, 0, 7); c.fill(); break; }
      case 'spark': c.fillRect(x - 0.5, y - 0.5, 1, 1); if (a > 0.5) { c.fillRect(x - 1.5, y - 0.5, 3, 1); c.fillRect(x - 0.5, y - 1.5, 1, 3); } break;
      case 'star': { c.save(); c.translate(x, y); c.rotate(p.t * 8); c.fillRect(-2, -0.5, 4, 1); c.fillRect(-0.5, -2, 1, 4); c.restore(); break; }
      case 'drop': c.fillRect(x - 0.5, y - 1, 1.2, 2); c.fillRect(x - 1, y, 2, 1.2); break;
      case 'junk': { c.save(); c.translate(x, y); c.rotate(p.t * 10); c.fillRect(-1.5, -1, 3, 2); c.restore(); break; }
      case 'feather': { c.save(); c.translate(x, y); c.rotate(Math.sin(p.t * 6) * 0.8); c.fillRect(-1.5, -0.5, 3, 1); c.restore(); break; }
      case 'crumb': c.fillRect(x, y, 1, 1); break;
      case 'streak': { c.save(); c.translate(x, y); c.rotate(Math.atan2(p.vy, p.vx)); c.fillRect(-4 * a, -0.35, 8 * a, 0.7); c.restore(); break; }
      default: c.fillRect(x, y, p.size, p.size);
    }
  }
  c.globalAlpha = 1;
}
function drawFog() {
  const fx = V.fx, ox = -V.camX, oy = -V.camY;
  fx.globalCompositeOperation = 'source-over'; fx.clearRect(0, 0, V.lw, V.lh);
  if (G.net && G.net.role === 'teacher') {
    const T = G.T, counting = T.state === 'count';
    fx.fillStyle = counting ? 'rgba(8,4,20,0.97)' : (G.L.outdoor ? 'rgba(18,12,46,0.62)' : 'rgba(14,8,34,0.78)'); fx.fillRect(0, 0, V.lw, V.lh);
    if (counting) return;
    fx.globalCompositeOperation = 'destination-out';
    const [ex, ey] = G.eye, R = G.visR, sx = ex + ox, sy = ey + oy, fov = Math.max(1.0, T.prof.fov);
    const g = fx.createRadialGradient(sx, sy, R * 0.25, sx, sy, R); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.75, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    fx.fillStyle = g; fx.beginPath(); fx.moveTo(sx, sy);
    for (let i = 0; i <= 70; i++) { const a = T.ang - fov + 2 * fov * i / 70, d = castRay(ex, ey, a, R); fx.lineTo(sx + Math.cos(a) * d, sy + Math.sin(a) * d); }
    fx.closePath(); fx.fill();
    const g2 = fx.createRadialGradient(sx, sy, 6, sx, sy, 34); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
    fx.fillStyle = g2; fx.beginPath();
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, d = castRay(ex, ey, a, 34); if (i) fx.lineTo(sx + Math.cos(a) * d, sy + Math.sin(a) * d); else fx.moveTo(sx + Math.cos(a) * d, sy + Math.sin(a) * d); }
    fx.closePath(); fx.fill(); fx.globalCompositeOperation = 'source-over';
    return;
  }
  fx.fillStyle = G.L.outdoor ? 'rgba(18,12,46,0.56)' : 'rgba(14,8,34,0.74)'; fx.fillRect(0, 0, V.lw, V.lh);
  fx.globalCompositeOperation = 'destination-out';
  const [ex, ey] = G.eye, R = G.visR, sx = ex + ox, sy = ey + oy;
  const g = fx.createRadialGradient(sx, sy, R * 0.3, sx, sy, R);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,0.93)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  fx.fillStyle = g; fx.beginPath();
  const n = 200;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = castRay(ex, ey, a, R), px = sx + Math.cos(a) * d, py = sy + Math.sin(a) * d; if (i) fx.lineTo(px, py); else fx.moveTo(px, py); }
  fx.closePath(); fx.fill();
  fx.globalCompositeOperation = 'source-over';
  if (G.P.hidden) { const g2 = fx.createRadialGradient(sx, sy, R * 0.6, sx, sy, Math.max(V.lw, V.lh) * 0.7); g2.addColorStop(0, 'rgba(12,8,28,0)'); g2.addColorStop(1, 'rgba(12,8,28,0.5)'); fx.fillStyle = g2; fx.fillRect(0, 0, V.lw, V.lh); }
}
function updateCamera(dt) {
  const P = viewerA(), m = G.m, lw = V.lw - 2, lh = V.lh - 2;
  let tx = P.x + clamp(P.vx || 0, -90, 90) * 0.35 - lw / 2, ty = P.y - 10 + clamp(P.vy || 0, -90, 90) * 0.3 - lh * 0.45;
  if (G.net && G.net.role === 'teacher' && !P.moving) { tx += Math.cos(P.ang) * 22; ty += Math.sin(P.ang) * 18; }
  if (G.mode === 'caught') { tx = (P.x + G.T.x) / 2 - lw / 2; ty = (P.y + G.T.y) / 2 - 10 - lh * 0.45; }
  const mw = m.w * 16, mh = m.h * 16;
  tx = mw < lw ? (mw - lw) / 2 : clamp(tx, -8, mw - lw + 8);
  const se = screenEdges(), topPad = Math.max(40, se.t / V.a - 18), botPad = Math.max(60, (V.H - se.b) / V.a - 10);
  ty = mh < lh ? (mh - lh) / 2 : clamp(ty, -topPad, mh - lh + botPad);
  if (G.camX == null) { G.camX = tx; G.camY = ty; }
  const k = 1 - Math.exp(-dt * 6);
  G.camX += (tx - G.camX) * k; G.camY += (ty - G.camY) * k;
}
// perspective : un personnage juste derrière un mur ou un grand meuble est en partie caché
function occlude(c, a, fn) {
  const L = G.L, m = G.m; if (!L || !L.over || a.x < 0) { fn(); return; }
  const tx = Math.floor(a.x / 16), ty = Math.floor((a.y - 4) / 16), y = ty + 1, rects = [];
  if (y < m.h) for (let x = tx - 1; x <= tx + 1; x++) { if (x < 0 || x >= m.w || !L.over[y * m.w + x]) continue; const top = y * 16 - OVERHANG; if (a.y > top) rects.push([x * 16, top, 16, OVERHANG + 16]); }
  if (!rects.length) { fn(); return; }
  c.save(); c.beginPath(); c.rect(a.x - 48, a.y - 90, 96, 140); rects.forEach(r => c.rect(r[0], r[1], r[2], r[3])); c.clip('evenodd'); fn(); c.restore();
}
// « six seven ! » : les mains qui balancent comme une balance
function drawSixSeven(c, k, dy) {
  const skin = SKINS[k.cfg.skin] || SKINS[0], ph = Math.sin(G.time * 11 + k.ph), y0 = k.y - 15 + dy;
  [[-1, ph], [1, -ph]].forEach(([s, p]) => {
    const hx = k.x + s * 9, hy = y0 - p * 3.5;
    c.strokeStyle = '#1a1028'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(k.x + s * 4, y0 + 2); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = skin; c.lineWidth = 1.2; c.beginPath(); c.moveTo(k.x + s * 4, y0 + 2); c.lineTo(hx, hy); c.stroke();
    c.fillStyle = '#1a1028'; c.fillRect(hx - 2.5, hy - 1.5, 5, 3); c.fillStyle = skin; c.fillRect(hx - 2, hy - 1, 4, 2);
  });
}
// ---------- escaliers : on voit tout de suite s'ils montent, descendent ou sont fermés ----------
function stairKind(s) {
  const I = G.inf, st = I.floors[I.cur].stairs[s];
  if (st.down) return st.locked && !I.keys && !I.alarm ? 'locked' : 'down';
  return st.up ? 'up' : 'closed';
}
const STAIR_COL = { down: '63,200,110', up: '80,150,255', closed: '228,59,68', locked: '247,140,40' };
function drawStairsMarks(c) {
  const I = G.inf, L = G.L; if (!L.stairs) return;
  ['A', 'B'].forEach(s => {
    const pt = L.stairs[s]; if (!pt) return;
    const x0 = (pt[0] - 1) * 16, y0 = (pt[1] - 1) * 16, w = 48, h = 48, k = stairKind(s), col = STAIR_COL[k];
    c.fillStyle = `rgba(${col},0.28)`; c.fillRect(x0, y0, w, h);
    c.strokeStyle = `rgba(${col},0.9)`; c.lineWidth = 1.5; c.strokeRect(x0 + 0.75, y0 + 0.75, w - 1.5, h - 1.5);
    if (k === 'down' || k === 'up') {
      // chevrons qui défilent dans le sens de l'escalier
      const dir = k === 'down' ? 1 : -1, ph = ((G.time * 14) % 16) * dir;
      c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2.2; c.lineJoin = 'round'; c.lineCap = 'round';
      for (let i = -1; i < 4; i++) {
        const yy = y0 + 8 + i * 16 + ph, a = Math.max(0, Math.min(1, 1 - Math.abs(yy - (y0 + h / 2)) / 26));
        c.globalAlpha = a; c.beginPath(); c.moveTo(x0 + 13, yy - 5 * dir); c.lineTo(x0 + 24, yy + 5 * dir); c.lineTo(x0 + 35, yy - 5 * dir); c.stroke();
      }
      c.globalAlpha = 1; c.restore();
    } else if (k === 'closed') {
      c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
      for (let i = -3; i < 6; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,0.75)' : 'rgba(228,59,68,0.85)'; c.beginPath(); c.moveTo(x0 + i * 10, y0 + 20); c.lineTo(x0 + i * 10 + 10, y0 + 20); c.lineTo(x0 + i * 10 + 18, y0 + 28); c.lineTo(x0 + i * 10 + 8, y0 + 28); c.fill(); }
      c.restore();
    } else {
      c.fillStyle = 'rgba(40,30,50,0.85)'; for (let x = x0 + 4; x < x0 + w; x += 7) c.fillRect(x, y0 + 2, 2, h - 4);
      c.fillRect(x0 + 2, y0 + 10, w - 4, 2); c.fillRect(x0 + 2, y0 + h - 12, w - 4, 2);
    }
  });
}
function drawStairsSigns(c) {
  const I = G.inf, L = G.L; if (!L.stairs) return;
  ['A', 'B'].forEach(s => {
    const pt = L.stairs[s]; if (!pt) return;
    const k = stairKind(s), x = pt[0] * 16 + 8, y = (pt[1] - 1) * 16 - 7;
    const to = k === 'up' ? I.cur + 1 : I.cur - 1, nm = to === 0 ? 'RDC' : to >= 0 && to <= INF_TOP ? INF_FLOOR_META[to].short : '';
    const label = k === 'down' ? '⬇ DESCENDRE · ' + nm : k === 'up' ? '⬆ MONTER · ' + nm : k === 'locked' ? '🔒 GRILLE FERMÉE' : '🚧 FERMÉ';
    const col = k === 'down' ? '#7dff9e' : k === 'up' ? '#9cc4ff' : k === 'locked' ? '#ffb070' : '#ff8a96';
    txt(c, label, x, y + Math.sin(G.time * 3) * 0.8, 6, col);
  });
}
function renderGame(dt) {
  const { lx, lw, lh, ctx, S } = V, P = G.P, T = G.T;
  updateCamera(dt || 0.016);
  const ci = Math.floor(G.camX), cj = Math.floor(G.camY); V.camX = ci; V.camY = cj;
  // 1) carte en basse résolution
  lx.fillStyle = '#120c1e'; lx.fillRect(0, 0, lw, lh);
  lx.drawImage(G.mapCanvas, -ci, -cj); drawDynamic(lx, -ci, -cj);
  drawFog();
  // 2) transformation monde -> écran (zoom + tremblement)
  const z = FX.zoom, cxs = V.W / 2, cys = V.H * 0.45;
  let shx = 0, shy = 0; if (G.shake > 0) { const a = Math.min(1, G.shake * 3) * S * 1.6; shx = rand(-a, a); shy = rand(-a, a); }
  V.a = S * z; V.e = cxs + (-G.camX * S - cxs) * z + shx; V.f = cys + (-G.camY * S - cys) * z + shy;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#120c1e'; ctx.fillRect(0, 0, V.W, V.H);
  ctx.setTransform(V.a, 0, 0, V.a, V.e, V.f); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(V.lo, ci, cj);
  if (G.inf) drawStairsMarks(ctx);
  // 3) cône de vision, poussières
  const showT = G.tVis || G.mode === 'caught';
  if (showT && !T.gone && !['sleep', 'caught', 'count', 'evac'].includes(T.state)) drawCone(ctx);
  G.kids.forEach(k => { if (k.vis && k.isWatcher && !k.gone && k.state !== 'evac') { ctx.globalAlpha = 0.75; drawCone(ctx, k); ctx.globalAlpha = 1; } });
  if (!G.L.outdoor) { for (const mo of FX.motes) { const a = Math.sin(mo.t / mo.life * Math.PI) * (0.35 + 0.25 * Math.sin(G.time * 3 + mo.ph)); ctx.fillStyle = `rgba(255,240,200,${a})`; ctx.fillRect(mo.x, mo.y, 0.8, 0.8); } }
  // 4) entités triées par profondeur
  const ents = [];
  G.items.forEach(it => ents.push([it.y, () => drawItemW(ctx, it)]));
  G.apples.forEach(a => ents.push([a.y, () => { const w = Math.sin(G.time * 4) * 0.12; ctx.save(); ctx.translate(a.x, a.y - 6); ctx.rotate(w); ctx.drawImage(itemCanvas('apple'), -7, -7); ctx.restore(); }]));
  G.kids.forEach(k => {
    if (!k.vis) return;
    ents.push([k.y, () => occlude(ctx, k, () => {
      const bob = k.beh === 'jump' ? -Math.abs(Math.sin(G.time * 6 + k.ph)) * 5 : 0;
      if (k.beh === 'jump') { const up = Math.sin(G.time * 6 + k.ph) > 0; ctx.strokeStyle = '#e43b44'; ctx.lineWidth = 0.9; ctx.beginPath(); if (up) ctx.ellipse(k.x, k.y - 2, 8, 3, 0, 0.1, Math.PI - 0.1); else ctx.ellipse(k.x, k.y - 22 + bob, 8, 4, 0, Math.PI + 0.1, -0.1); ctx.stroke(); }
      if (k.beh === 'sit') { drawSprite(ctx, k.cfg, null, k, { sy: 0.86, bob: 2, noShadow: true }); if (k.sixT > 0) drawSixSeven(ctx, k, 3); return; }
      drawSprite(ctx, k.cfg, k.v || null, k, { bob, sy: k.beh === 'jump' && bob > -1 ? 0.9 : 1 });
      if (k.sixT > 0) drawSixSeven(ctx, k, 0);
      if (k.isWatcher && k.markT > 0 && k.mark) txt(ctx, k.mark, k.x, k.y - 40, 9, k.mark === '!' ? '#e43b44' : '#ffd23f');
    })]);
  });
  (G.pigeons || []).forEach(p => { if (p.st === 'gone') return; if (dist(G.eye[0], G.eye[1], p.x, p.y) > G.visR + 10 && p.z < 20) return; ents.push([p.y + (p.z > 4 ? 200 : 0), () => drawPigeon(ctx, p)]); });
  if (showT && !T.gone) ents.push([T.y, () => occlude(ctx, T, () => drawTeacher(ctx, T))]);
  FX.ghosts.forEach(g => ents.push([g.y - 0.1, () => drawSprite(ctx, P.cfg, null, { x: g.x, y: g.y, face: g.face, dist: g.dist, moving: true, running: true }, { tint: '#7ff0ff', alpha: 0.45 * (1 - g.t / 0.32), scale: g.small ? 0.5 : 1, noShadow: true, still: true, gait: 'run' })]));
  FX.zips.forEach(zp => ents.push([zp.y1, () => { const t = zp.t, e = t * t; drawSprite(ctx, P.cfg, null, { x: lerp(zp.x0, zp.x1, e), y: lerp(zp.y0, zp.y1, e), face: zp.face, moving: false }, { sx: 1 + t * 0.6, sy: 1 - t * 0.8, scale: zp.small ? 0.5 : 1, alpha: 1 - t * 0.5, still: true }); }]));
  if (!P.hidden && !P.out && G.pVis !== false) {
    let sc = P.small > 0 ? 0.5 : 1; if (P.small > 0 && P.small < 3 && (G.time * 7 | 0) % 2) sc = 0.75;
    let al = 1; if (G.mode === 'escape') { al = clamp(1 - (G.escT - 0.5) / 0.6, 0, 1); sc *= clamp(1 - (G.escT - 0.4) / 0.8, 0.2, 1); }
    ents.push([P.y, () => occlude(ctx, P, () => drawSprite(ctx, P.cfg, null, P, { scale: sc, alpha: al, dx: P.trem ? Math.sin(G.time * 70) * P.trem : 0 }))]);
  }
  // le coéquipier (toujours visible pour toi)
  const Q = G.P2;
  if (Q && G.inf && G.inf.coop && !Q.out && !Q.hidden && Q.x > -9000) ents.push([Q.y, () => occlude(ctx, Q, () => drawSprite(ctx, Q.cfg, null, Q, { scale: Q.small > 0 ? 0.5 : 1 }))]);
  // surveillants en équipe : le coéquipier et les fugueurs que je vois
  if (G.inf && G.inf.guard) {
    const Q2 = G.T2; if (Q2 && Q2.fl === G.inf.cur && Q2.x > -9000) ents.push([Q2.y, () => occlude(ctx, Q2, () => drawTeacher(ctx, Q2))]);
    G.inf.fugs.forEach(f => { if (!f.vis) return; ents.push([f.y, () => occlude(ctx, f, () => {
      if (f.st === 'seat') drawSprite(ctx, f.cfg, null, f, { sy: 0.86, bob: 2, noShadow: true }); else drawSprite(ctx, f.cfg, null, f, {});
      if (f.markT > 0) txt(ctx, '!', f.x, f.y - 38, 10, '#e43b44');
    })]); });
  }
  // les animaux de compagnie
  const drawPet = A => {
    const p = A && A.pet; if (!p || A.x < -9000 || A.out || p.x == null) return;
    const bob = p.moving || p.jump > 0 ? Math.abs(Math.sin(p.t * 12)) * 3 : Math.sin(p.t * 3) * 0.6;
    ents.push([p.y, () => {
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 2, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = p.leaveT != null ? Math.max(0, p.leaveT / 1.2) : 1;
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#000'; ctx.fillText(p.e, p.x, p.y + 1 - bob);
      ctx.globalAlpha = 1;
    }]);
  };
  drawPet(P); if (Q && G.inf && G.inf.coop && Q.fl === G.inf.cur) drawPet(Q);
  if (G.ball) {
    const a = G.kids[G.ball.from], b = G.kids[G.ball.to];
    if (a && b && (a.vis || b.vis)) { const t = G.ball.t, bx = lerp(a.x, b.x, t), by = lerp(a.y, b.y, t); ents.push([by, () => { const h = Math.sin(Math.PI * t) * 14 + 10; ctx.fillStyle = 'rgba(10,6,20,0.3)'; ctx.beginPath(); ctx.ellipse(bx, by, 2.2, 0.9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f77622'; ctx.beginPath(); ctx.arc(bx, by - h, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = '#ffb070'; ctx.fillRect(bx - 1, by - h - 1.5, 1, 1); }]); }
  }
  ents.sort((a, b) => a[0] - b[0]).forEach(e => e[1]());
  if (P.hidden && viewerA() === P) drawEyes(ctx, P.hidden);
  if (G.inf && G.inf.guard) { const Q2 = G.T2; if (Q2 && Q2.fl === G.inf.cur && Q2.x > -9000) { txt(ctx, Q2.prof.name, Q2.x, Q2.y - 44, 6, '#7ff0ff'); if (Q2.bubble) txt(ctx, Q2.bubble.text, Q2.x, Q2.y - 52, 6, '#ffffff'); } G.inf.fugs.forEach(f => { if (f.vis && f.bub) txt(ctx, f.bub.text, f.x, f.y - 30, 6, '#ffe6a0'); }); }
  if (Q && G.inf && G.inf.coop && !Q.out && Q.x > -9000) { const hs = Q.hidden; if (hs) txt(ctx, '🫣', hs.x * 16 + 8, hs.y * 16 - 6 + Math.sin(G.time * 4) * 1.5, 9, '#fff'); else txt(ctx, (Q.jail ? '🔒 ' : '') + (Q.cfg.name || ''), Q.x, Q.y - (Q.small > 0 ? 22 : 36), 6, '#7ff0ff'); }
  drawParts(ctx);
  // feuilles qui tombent
  for (const l of FX.leaves) { ctx.globalAlpha = l.rest > 0 ? Math.max(0, 1 - l.rest / 3) : 1; ctx.fillStyle = l.col; ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rest > 0 ? 0.4 : Math.sin(l.t * 4 + l.ph) * 0.9); ctx.fillRect(-1.5, -0.6, 3, 1.3); ctx.restore(); }
  ctx.globalAlpha = 1;
  // 5) brouillard doux + lumière chaude
  ctx.imageSmoothingEnabled = true; ctx.drawImage(V.fog, ci, cj); ctx.imageSmoothingEnabled = false;
  {
    const [ex, ey] = G.eye, R = G.visR;
    if (R > 0) { ctx.globalAlpha = G.L.outdoor ? 0.07 : 0.09; ctx.imageSmoothingEnabled = true; ctx.drawImage(glowSprite(), ex - R, ey - R, R * 2, R * 2); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; }
  }
  if (G.inf) drawStairsSigns(ctx);
  if (G.reveal > 0) {
    const blink = G.reveal > 2 || (G.time * 6 | 0) % 2;
    if (blink && !G.tVis) { drawCone(ctx); drawTeacher(ctx, T, { tint: '#c8b0ff', alpha: 0.8 }); }
    G.L.exits.forEach(e => {
      const [x, y] = e.type === 'search' ? e.secret : [e.x, e.y];
      const px = x * 16 + 8, py = y * 16 + 8, r = 6 + Math.sin(G.time * 8) * 2;
      ctx.save(); ctx.translate(px, py); ctx.rotate(G.time * 2); ctx.fillStyle = '#fff6a0'; ctx.fillRect(-r, -0.5, r * 2, 1); ctx.fillRect(-0.5, -r, 1, r * 2); ctx.restore();
      ctx.fillStyle = '#ff9fd8'; ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 7); ctx.fill();
    });
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawOverlay(); drawPost();
}
function drawTeacher(c, T, extra) {
  const pr = T.prof, o = Object.assign({}, extra || {});
  if (T.flashT > 0 && !o.tint) o.tint = '#ffffff';
  let v = pr.v;
  if (T.state === 'sleep') {
    v = Object.assign({}, pr.v, { eyes: 3 });
    drawSprite(c, pr.cfg, v, Object.assign({}, T, { moving: false, sq: 0, hz: 0, blink: 0 }), Object.assign(o, { rot: -Math.PI / 2, still: true, shadowW: 2.4, frame: 0, gait: 'idle', face: 0, noLean: true, bob: -3 }));
    // bulle de nez
    const ph = (G.time * 0.7) % 1, r = 1 + ph * 3.5, hx = T.x - 27, hy = T.y - 9;
    if (ph < 0.92) { c.fillStyle = 'rgba(170,220,255,0.55)'; c.strokeStyle = 'rgba(230,248,255,0.9)'; c.lineWidth = 0.5; c.beginPath(); c.arc(hx, hy - r, r, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#ffffff'; c.fillRect(hx - r * 0.4, hy - r * 1.5, 0.8, 0.8); }
    return;
  }
  if (T.state === 'eat') { o.sy = 1 + Math.sin(G.time * 22) * 0.06; if (Math.random() < 0.3) part(T.x + rand(-3, 3), T.y - 22, 'crumb', { vx: rand(-20, 20), vy: rand(-20, 0), g: 120, life: 0.5, col: '#ffe0a0' }); }
  if (T.state === 'tired') { o.sy = (o.sy || 1) * (0.86 + Math.sin(G.time * 10) * 0.03); o.rot = 0.12 * (T.face === 3 ? -1 : 1); }
  if (T.state === 'check') o.dx = Math.sin(G.time * 30) * 0.8;
  if (T.state === 'count') o.dx = Math.sin(G.time * 20) * 0.3;
  drawSprite(c, pr.cfg, v, T, o);
  if (G.slowT > 0) { c.fillStyle = 'rgba(140,190,255,0.25)'; c.beginPath(); c.ellipse(T.x, T.y - 14, 9, 17, 0, 0, 7); c.fill(); }
}
// ---------- Calque écran : textes, bulles, flèches ----------
const FONT = '"Press Start 2P", monospace';
function txt(c, s, x, y, size, col, align = 'center', outline = '#1a1028') {
  c.font = size + 'px ' + FONT; c.textAlign = align; c.textBaseline = 'middle';
  c.lineWidth = Math.max(2, size / 3); c.strokeStyle = outline; c.lineJoin = 'round';
  c.fillStyle = 'rgba(20,8,40,0.55)'; c.fillText(s, x + size * 0.12, y + size * 0.16);
  c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y);
}
function waveText(c, s, x, y, size, cols, t, amp, sc = 1) {
  c.font = size + 'px ' + FONT; c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
  const chars = [...s], ws = chars.map(ch => c.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0);
  let cx = x - total / 2;
  chars.forEach((ch, i) => {
    const yy = y + Math.sin(t * 9 + i * 0.7) * amp, col = Array.isArray(cols) ? cols[i % cols.length] : cols;
    c.save(); c.translate(cx + ws[i] / 2, yy); const s2 = sc * (1 + Math.sin(t * 9 + i * 0.7) * 0.06); c.scale(s2, s2);
    c.lineWidth = Math.max(3, size / 3.2); c.strokeStyle = '#1a1028'; c.fillStyle = 'rgba(20,8,40,0.6)'; c.fillText(ch, -ws[i] / 2 + size * 0.1, size * 0.14);
    c.strokeText(ch, -ws[i] / 2, 0); c.fillStyle = col; c.fillText(ch, -ws[i] / 2, 0); c.restore();
    cx += ws[i];
  });
}
function wrap(c, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
function screenEdges() { const d = V.dpr, narrow = V.W / d < 640; return { l: 16 * d, r: V.W - (narrow ? 16 : 120) * d, t: (narrow ? 158 : 70) * d, b: V.H - (narrow ? 200 : 110) * d }; }
function drawPartnerHint(c, d) {
  const I = G.inf, Q = I.guard ? G.T2 : G.P2; if (!Q) return;
  const qn = Q.cfg ? Q.cfg.name : Q.prof ? Q.prof.name : '';
  const pg = I.ping;
  if (pg && pg.fl === I.cur && pg.t < 6 && pg.x >= 0) {
    const [sx, sy] = toScreen(pg.x, pg.y - 10), [cx, cy, off] = clampEdge(sx, sy), al = clamp(1 - pg.t / 6, 0.3, 1), pul = 1 + Math.sin(G.time * 8) * 0.15;
    c.globalAlpha = al;
    if (off) { const an = Math.atan2(sy - cy, sx - cx); drawArrow(c, cx, cy, an, '#3fc8ff', 7 * d); txt(c, '📍', cx - Math.cos(an) * 15 * d, cy - Math.sin(an) * 15 * d, Math.round(12 * d), '#fff'); }
    else { c.strokeStyle = '#3fc8ff'; c.lineWidth = 3 * d; c.beginPath(); c.arc(sx, sy, 16 * d * pul, 0, 7); c.stroke(); txt(c, '📍', sx, sy - 24 * d, Math.round(13 * d), '#fff'); }
    c.globalAlpha = 1;
  }
  if (Q.out || Q.x < -9000) return;
  const [sx, sy] = toScreen(Q.x, Q.y - 14), [cx, cy, off] = clampEdge(sx, sy);
  if (!off) return;
  const an = Math.atan2(sy - cy, sx - cx);
  c.globalAlpha = 0.85; drawArrow(c, cx, cy, an, '#7ff0ff', 6 * d);
  txt(c, (Q.jail ? '🔒' : '🤝') + ' ' + (qn || ''), cx - Math.cos(an) * 26 * d, cy - Math.sin(an) * 16 * d, Math.round(8 * d), '#7ff0ff');
  c.globalAlpha = 1;
}
function toScreen(wx, wy) { return [wx * V.a + V.e, wy * V.a + V.f]; }
function clampEdge(sx, sy) { const e = screenEdges(); const cx = clamp(sx, e.l, e.r), cy = clamp(sy, e.t, e.b); return [cx, cy, cx !== sx || cy !== sy]; }
function drawArrow(c, x, y, ang, col, size) {
  c.save(); c.translate(x, y); c.rotate(ang); const p = 1 + Math.sin(G.time * 10) * 0.12; c.scale(p, p); c.fillStyle = col; c.strokeStyle = '#1a1028'; c.lineWidth = size / 4;
  c.beginPath(); c.moveTo(size, 0); c.lineTo(-size * 0.6, -size * 0.7); c.lineTo(-size * 0.3, 0); c.lineTo(-size * 0.6, size * 0.7); c.closePath(); c.stroke(); c.fill(); c.restore();
}
const easeOutBack = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function popScale(age) { if (age < 0.09) return age / 0.09 * 1.45; return 1 + 0.45 * Math.exp(-(age - 0.09) * 11) * Math.cos((age - 0.09) * 28); }
function drawOverlay() {
  const c = V.ctx, d = V.dpr, T = G.T, P = G.P, F = Math.round(9 * d), u = V.a;
  // indices sonores
  for (const q of G.cues) {
    const a = clamp(1 - q.t / q.life, 0, 1) * (q.t < 0.1 ? q.t / 0.1 : 1);
    let [sx, sy] = toScreen(q.x, q.y); const [cx, cy, off] = clampEdge(sx, sy);
    c.globalAlpha = a;
    if (off) { const an = Math.atan2(sy - cy, sx - cx); drawArrow(c, cx, cy, an, q.type === 'kid' ? '#c8c0d8' : '#ffb347', 7 * d); sx = cx - Math.cos(an) * 16 * d; sy = cy - Math.sin(an) * 16 * d; }
    if (q.type === 'step') {
      const s = (q.big ? 1.25 : 1) * u * (1 + Math.max(0, 0.12 - q.t) * 3), side = q.side ? 1 : -1;
      c.save(); c.translate(sx + Math.cos(q.ang + Math.PI / 2) * side * 2.5 * u, sy + Math.sin(q.ang + Math.PI / 2) * side * 2.5 * u); c.rotate(q.ang + Math.PI / 2);
      c.fillStyle = q.big ? '#ff5a5a' : '#ffb347'; c.strokeStyle = '#1a1028'; c.lineWidth = Math.max(1.5, u * 0.4);
      c.beginPath(); c.ellipse(0, -0.6 * s, 1.5 * s, 2.3 * s, 0, 0, 7); c.stroke(); c.fill();
      c.beginPath(); c.ellipse(0, 2.4 * s, 1.1 * s, 1.1 * s, 0, 0, 7); c.stroke(); c.fill();
      c.restore();
    } else if (q.type === 'word') {
      const size = Math.round((q.small ? 7 : 10) * d);
      if (q.pop) waveText(c, q.text, sx, sy - q.t * 10 * d, size, q.col || '#fff', q.t, 2 * d, popScale(q.t));
      else txt(c, q.text, sx, sy - q.t * 10 * d, size, q.col || '#fff');
    } else if (q.type === 'zzz') {
      txt(c, q.text, sx + Math.sin(q.t * 3) * 6 * d, sy - q.t * 16 * d, Math.round((8 + q.t * 5) * d), '#bfe4ff');
    } else if (q.type === 'kid') {
      txt(c, q.text, sx, sy - q.t * 8 * d, Math.round(7 * d), '#e8e0f8', 'center', '#3a3050');
    }
    c.globalAlpha = 1;
  }
  // icônes au-dessus du prof
  const [tsx, tsy] = toScreen(T.x, T.y - 36 - (T.hz || 0));
  const seeT = G.tVis || G.reveal > 0 || G.mode === 'caught';
  if (seeT && T.markT > 0 && T.mark) {
    const s = popScale(T.markA || 0);
    c.save(); c.translate(tsx, tsy - 10 * d); c.scale(s, s); c.rotate(Math.sin(G.time * 14) * 0.08);
    txt(c, T.mark, 0, 0, Math.round(18 * d), T.mark === '!' ? '#ff4040' : T.mark === '♥' ? '#ff6f91' : '#ffd23f'); c.restore();
  }
  if (seeT && T.state === 'chase') { // veine de colère
    const x = tsx + 9 * d, y = tsy + 6 * d, s = 1 + Math.abs(Math.sin(G.time * 12)) * 0.25;
    c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = '#ff3040'; c.lineWidth = 2.2 * d; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); c.beginPath(); c.moveTo(1.5 * d, 4 * d); c.quadraticCurveTo(1.5 * d, 1.5 * d, 4 * d, 1.5 * d); c.stroke(); c.restore(); }
    c.restore();
  }
  if (seeT && (T.state === 'search' || T.state === 'check' || T.state === 'tired')) { // goutte de sueur
    const ph = (G.time * 1.6) % 1; c.globalAlpha = 1 - ph; c.fillStyle = '#7fd0ff'; c.strokeStyle = '#1a1028'; c.lineWidth = 1.2 * d;
    const x = tsx - 10 * d, y = tsy + 8 * d + ph * 8 * d; c.beginPath(); c.moveTo(x, y - 4 * d); c.quadraticCurveTo(x + 3.5 * d, y + 1 * d, x, y + 2.5 * d); c.quadraticCurveTo(x - 3.5 * d, y + 1 * d, x, y - 4 * d); c.fill(); c.stroke(); c.globalAlpha = 1;
  }
  if (seeT && (T.state === 'keys' || T.state === 'unlock')) { const b = Math.sin(G.time * 12) * 3 * d; txt(c, '🔑', tsx, tsy - 6 * d + b, Math.round(13 * d), '#ffd23f'); }
  if (seeT && G.slowT > 0) txt(c, '⏱', tsx + 14 * d, tsy, Math.round(10 * d), '#bfe4ff');
  if (seeT && T.state === 'stun') { // étoiles d'étourdissement
    for (let i = 0; i < 4; i++) { const a = G.time * 5 + i * Math.PI / 2, x = tsx + Math.cos(a) * 13 * d, y = tsy + 4 * d + Math.sin(a) * 4 * d; txt(c, i % 2 ? '💫' : '⭐', x, y, Math.round((Math.sin(a) > 0 ? 9 : 7) * d), '#ffd23f'); }
  }
  if (G.inf && G.mode === 'play' && G.time < 6 && !P.hidden && viewerA() === P) { // « toi » au début
    const [qx, qy] = toScreen(P.x, P.y - 40), bob = Math.sin(G.time * 7) * 3 * d;
    txt(c, '▼', qx, qy + bob, Math.round(12 * d), '#3fd06a'); txt(c, 'TOI', qx, qy - 13 * d + bob, Math.round(8 * d), '#ffffff');
  }
  // bulles des élèves (« C'est pas moi ! »)
  G.kids.forEach(k => {
    if (!k.bub || !k.vis) return;
    const b = k.bub, al = Math.min(1, (b.dur - b.t) * 4), sc = b.t < 0.16 ? easeOutBack(b.t / 0.16) : 1, F2 = Math.round(8 * d);
    c.font = F2 + 'px ' + FONT; const w = c.measureText(b.text).width + F2 * 1.4, h = F2 * 2;
    let [bx, by] = toScreen(k.x, k.y - 36); by -= h / 2;
    c.save(); c.translate(bx, by); c.scale(sc, sc); c.globalAlpha = al;
    c.fillStyle = '#ffffff'; c.strokeStyle = '#1a1028'; c.lineWidth = 2 * d; rrect(c, -w / 2, -h / 2, w, h, 6 * d); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-4 * d, h / 2 - 1); c.lineTo(0, h / 2 + 6 * d); c.lineTo(4 * d, h / 2 - 1); c.fill();
    c.fillStyle = '#1a1028'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.text, 0, 1 * d);
    c.restore(); c.globalAlpha = 1;
  });
  // le coéquipier hors de l'écran ou à un autre étage, et ses appels 📍
  if (G.inf && (G.inf.coop || G.inf.guard) && G.mode === 'play') drawPartnerHint(c, d);
  // signalement d'un prof (surveillant en multi)
  if (G.inf && G.inf.multi && G.inf.role === 'teacher' && G.inf.ping && G.inf.ping.fl === G.inf.cur && G.inf.ping.t < 10 && G.mode === 'play') {
    const pg = G.inf.ping; let [sx, sy] = toScreen(pg.x, pg.y - 8); const [cx, cy, off] = clampEdge(sx, sy), pul = 1 + Math.sin(G.time * 8) * 0.15, al = clamp(1 - pg.t / 10, 0.25, 1);
    c.globalAlpha = al;
    if (off) { const an = Math.atan2(sy - cy, sx - cx); drawArrow(c, cx, cy, an, '#e43b44', 7 * d); txt(c, '❗', cx - Math.cos(an) * 15 * d, cy - Math.sin(an) * 15 * d, Math.round(12 * d), '#fff'); }
    else { c.strokeStyle = '#e43b44'; c.lineWidth = 3 * d; c.beginPath(); c.arc(sx, sy, 18 * d * pul, 0, 7); c.stroke(); txt(c, '❗', sx, sy - 26 * d, Math.round(12 * d), '#fff'); }
    c.globalAlpha = 1;
  }
  // tâches (côté élève)
  if (viewerA() === P && G.tasks && G.mode === 'play' && !P.taskOpen) {
    G.tasks.forEach((t, i) => {
      if (t.done) return;
      let [sx, sy] = toScreen(t.x * 16 + 8, t.y * 16 - 2); const [cx, cy, off] = clampEdge(sx, sy);
      const bob = Math.sin(G.time * 4 + i) * 3 * d, pulse = 1 + Math.sin(G.time * 6 + i) * 0.08;
      if (off) {
        const an = Math.atan2(sy - cy, sx - cx), bx = cx - Math.cos(an) * 6 * d, by = cy - Math.sin(an) * 6 * d, r = 12 * d * pulse;
        drawArrow(c, bx + Math.cos(an) * (r + 4 * d), by + Math.sin(an) * (r + 4 * d), an, '#ffd23f', 6 * d);
        c.fillStyle = '#ffd23f'; c.strokeStyle = '#1a1028'; c.lineWidth = 2.5 * d; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill(); c.stroke();
        c.font = Math.round(13 * d) + 'px ' + EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1a1028'; c.fillText(t.def.icon, bx, by + 1 * d);
      } else {
        c.save(); c.translate(sx, sy + bob); c.scale(pulse, pulse);
        c.fillStyle = 'rgba(255,210,63,0.3)'; c.beginPath(); c.arc(0, 0, 16 * d, 0, 7); c.fill();
        c.strokeStyle = '#ffd23f'; c.lineWidth = 2.5 * d; c.setLineDash([5 * d, 4 * d]); c.lineDashOffset = -G.time * 18 * d; c.beginPath(); c.arc(0, 0, 16 * d, 0, 7); c.stroke(); c.setLineDash([]);
        c.font = Math.round(18 * d) + 'px ' + EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1a1028'; c.fillText(t.def.icon, 0, 1 * d); c.restore();
        txt(c, '!', sx + 13 * d, sy - 13 * d + bob, Math.round(11 * d), '#ffd23f');
      }
    });
  }
  // bulle du prof
  if (T.bubble) {
    const heard = !(G.tVis || G.mode === 'caught');
    const dd = dist(T.x, T.y, P.x, P.y) / 16;
    if (!heard || dd < 20) {
      c.font = F + 'px ' + FONT;
      const maxW = Math.min(V.W * 0.62, 230 * d);
      const lines = wrap(c, (heard ? '🔊 ' : '') + T.bubble.text, maxW);
      const lh = F * 1.55, w = Math.max(...lines.map(l => c.measureText(l).width)) + F * 1.6, h = lines.length * lh + F * 1.1;
      let [bx, by] = toScreen(T.x, T.y - 40 - (T.hz || 0)); by -= h / 2 + (T.markT > 0 ? 22 * d : 0);
      const e = screenEdges();
      if (heard) { const r = clampEdge(bx, by); bx = r[0]; by = r[1]; }
      bx = clamp(bx, e.l + w / 2, e.r - w / 2); by = clamp(by, e.t + h / 2, e.b - h / 2);
      const al = Math.min(1, (T.bubble.dur - T.bubble.t) * 3), sc = T.bubble.t < 0.18 ? easeOutBack(T.bubble.t / 0.18) : 1;
      c.save(); c.translate(bx, by + (heard ? Math.sin(G.time * 3) * 1.5 * d : 0)); c.scale(sc, sc);
      c.globalAlpha = heard ? al * 0.94 : al;
      c.fillStyle = 'rgba(20,8,40,0.45)'; rrect(c, -w / 2 + 3 * d, -h / 2 + 4 * d, w, h, 7 * d); c.fill();
      c.fillStyle = heard ? 'rgba(40,28,70,0.95)' : '#ffffff'; c.strokeStyle = heard ? '#ffb347' : '#1a1028'; c.lineWidth = 2.5 * d;
      if (heard) { c.setLineDash([5 * d, 4 * d]); c.lineDashOffset = -G.time * 20 * d; }
      rrect(c, -w / 2, -h / 2, w, h, 7 * d); c.fill(); c.stroke(); c.setLineDash([]);
      if (!heard) { c.fillStyle = '#ffffff'; c.strokeStyle = '#1a1028'; c.beginPath(); c.moveTo(-6 * d, h / 2 - 1); c.lineTo(6 * d, h / 2 - 1); c.lineTo(0, h / 2 + 9 * d); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-6 * d, h / 2); c.lineTo(0, h / 2 + 9 * d); c.lineTo(6 * d, h / 2); c.stroke(); }
      c.fillStyle = heard ? '#ffe0b0' : '#1a1028'; c.textAlign = 'center'; c.textBaseline = 'middle';
      lines.forEach((l, i) => c.fillText(l, 0, -h / 2 + F * 0.55 + lh * (i + 0.5)));
      c.restore(); c.globalAlpha = 1;
    }
  }
  // repère du joueur
  const VA = viewerA();
  if (!VA.hidden && !VA.busy && G.mode === 'play') {
    const [px, py] = toScreen(VA.x, VA.y - (VA.small > 0 ? 20 : VA === T ? 42 : 38) - (VA.hz || 0)), b = Math.abs(Math.sin(G.time * 4)) * 3 * d, s = 5 * d;
    c.fillStyle = '#ffd23f'; c.strokeStyle = '#1a1028'; c.lineWidth = 2 * d;
    c.beginPath(); c.moveTo(px - s, py - s - b); c.lineTo(px + s, py - s - b); c.lineTo(px, py - b); c.closePath(); c.stroke(); c.fill();
  }
  // barre de progression
  if (VA.busy && !VA.hidden) {
    const [px, py] = toScreen(VA.x, VA.y - 32), w = 44 * d, h = 8 * d, p = clamp(VA.busy.t / VA.busy.dur, 0, 1);
    c.fillStyle = '#1a1028'; rrect(c, px - w / 2 - 3 * d, py - 3 * d, w + 6 * d, h + 6 * d, 4 * d); c.fill();
    c.fillStyle = '#3a2a5a'; c.fillRect(px - w / 2, py, w, h);
    const g = c.createLinearGradient(px - w / 2, 0, px + w / 2, 0); g.addColorStop(0, '#63c74d'); g.addColorStop(1, '#b8f060'); c.fillStyle = g; c.fillRect(px - w / 2, py, w * p, h);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px - w / 2, py, w * p, h / 3);
  }
  // objets qui volent vers le sac
  FX.flyers.forEach(f => {
    const slot = document.querySelectorAll('#inv .slot')[f.slot]; if (!slot) return;
    const r = slot.getBoundingClientRect(), tx = (r.left + r.width / 2) * d, ty = (r.top + r.height / 2) * d;
    if (f.sx == null) { [f.sx, f.sy] = toScreen(f.wx, f.wy); }
    const t = f.t, e = t * t * (3 - 2 * t), x = lerp(f.sx, tx, e), y = lerp(f.sy, ty, e) - Math.sin(Math.PI * t) * 90 * d, s = (1 + Math.sin(Math.PI * t) * 0.8) * 3 * d;
    c.save(); c.translate(x, y); c.rotate(t * 6.28); c.drawImage(itemCanvas(f.kind), -7 * s, -7 * s, 14 * s, 14 * s); c.restore();
    c.fillStyle = 'rgba(255,246,160,0.8)'; for (let i = 1; i < 4; i++) { const tt = Math.max(0, t - i * 0.06), ee = tt * tt * (3 - 2 * tt); c.fillRect(lerp(f.sx, tx, ee) - 2 * d, lerp(f.sy, ty, ee) - Math.sin(Math.PI * tt) * 90 * d - 2 * d, 4 * d / i, 4 * d / i); }
  });
}
// ---------- Post-traitement & effets plein écran ----------
function drawPost() {
  const c = V.ctx, W = V.W, H = V.H, d = V.dpr, T = G.T;
  if (G.inf && G.inf.alarm && (G.mode === 'play' || G.mode === 'paused')) { c.fillStyle = `rgba(255,40,40,${G.alarmFlash ? 0.16 : 0.05})`; c.fillRect(0, 0, W, H); }
  // vignette rouge en poursuite
  if (G.mode === 'play' && (G.net ? (G.net.role === 'student' && G.alarmT > 0) : T.state === 'chase')) {
    const pulse = 0.2 + Math.sin(G.time * 8) * 0.08;
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${pulse})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // lignes de vitesse façon manga
  if (FX.lines > 0) {
    c.save(); c.globalAlpha = Math.min(1, FX.lines * 1.3); c.fillStyle = '#ffffff'; c.translate(W / 2, H * 0.45);
    const R0 = Math.min(W, H) * 0.36, R1 = Math.hypot(W, H);
    for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2 + rand(-0.05, 0.05), r0 = R0 + rand(0, R0 * 0.4), wd = rand(0.008, 0.02); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a - wd) * R1, Math.sin(a - wd) * R1); c.lineTo(Math.cos(a + wd) * R1, Math.sin(a + wd) * R1); c.closePath(); c.fill(); }
    c.restore();
  }
  if (G.mode === 'caught') { c.fillStyle = `rgba(30,0,20,${Math.min(0.35, G.caughtT * 0.3)})`; c.fillRect(0, 0, W, H); }
  // vignette + lignes TV
  c.drawImage(V.post, 0, 0);
  // flash
  if (FX.flash > 0) { c.fillStyle = `rgba(${FX.flashCol},${FX.flash * 0.35})`; c.fillRect(0, 0, W, H); }
  // compte à rebours géant
  if (G.mode === 'play' && T.state === 'count' && FX.cntN > 0) {
    const s = popScale(FX.cntA), t = FX.cntN < 3 ? String(FX.cntN) : '3 !';
    c.save(); c.translate(W / 2, H * 0.32); c.scale(s, s); c.rotate(Math.sin(FX.cntA * 10) * 0.05);
    waveText(c, t, 0, 0, Math.round(46 * d), ['#ffd23f', '#ff4f8b', '#2ce8d5'][FX.cntN - 1], FX.cntA, 2 * d);
    c.restore();
    txt(c, G.net && G.net.role === 'teacher' ? 'Ferme les yeux et compte !' : T.prof.name + ' compte…', W / 2, H * 0.32 + 44 * d, Math.round(9 * d), '#ffffff');
  }
  if (G.mode === 'play' && FX.goA < 1) { const s = popScale(FX.goA); c.globalAlpha = Math.min(1, (1 - FX.goA) * 3); c.save(); c.translate(W / 2, H * 0.32); c.scale(s, s); waveText(c, 'FILE !', 0, 0, Math.round(40 * d), ['#63c74d', '#ffd23f', '#ff4f8b', '#2ce8d5', '#ffffff'], FX.goA, 3 * d); c.restore(); c.globalAlpha = 1; }
  // effet BD quand on se fait attraper
  // le « BOUM » de bande dessinée ne reste jamais collé à l'écran
  if (FX.comic && FX.comic.t > 2.6 && G.mode !== 'caught' && G.mode !== 'timeup' && G.mode !== 'lesson') FX.comic = null;
  if (FX.comic) {
    const a = FX.comic.t, s = a < 0.35 ? easeOutBack(Math.min(1, a / 0.35)) : 1 + Math.sin(a * 6) * 0.03;
    c.save(); c.globalAlpha = Math.min(1, a * 4) * 0.55; c.fillStyle = V.halftone; c.fillRect(0, 0, W, H); c.restore();
    c.save(); c.translate(W / 2, H * 0.3); c.scale(s, s); c.rotate(-0.08 + Math.sin(a * 3) * 0.03);
    const R = Math.min(W, H) * 0.3; c.beginPath();
    for (let i = 0; i < 28; i++) { const an = i / 28 * Math.PI * 2 + a * 0.4, r = i % 2 ? R * 0.68 : R * (0.98 + (i % 4 === 0 ? 0.12 : 0)); c.lineTo(Math.cos(an) * r * 1.25, Math.sin(an) * r * 0.8); }
    c.closePath(); c.fillStyle = 'rgba(20,8,40,0.6)'; c.save(); c.translate(6 * d, 8 * d); c.fill(); c.restore();
    c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 5 * d; c.strokeStyle = '#1a1028'; c.stroke();
    waveText(c, FX.comic.text, 0, -4 * d, Math.round(26 * d), ['#ff3040', '#e0249a'], a, 3 * d);
    c.restore();
  }
  // texte de victoire
  if (FX.winA >= 0 && FX.winA < 2) {
    const s = FX.winA < 0.4 ? easeOutBack(FX.winA / 0.4) : 1;
    c.save(); c.translate(W / 2, H * 0.3); c.scale(s, s); waveText(c, 'ÉVASION !', 0, 0, Math.round(30 * d), ['#ffd23f', '#63c74d', '#2ce8d5', '#ff6f91', '#ffffff'], FX.winA, 5 * d); c.restore();
  }
  // transition en iris
  if (FX.iris) {
    const ir = FX.iris, t = clamp(ir.t / ir.dur, 0, 1), e = t * t * (3 - 2 * t), maxR = Math.hypot(W, H);
    const [ix, iy] = ir.wx != null ? toScreen(ir.wx, ir.wy) : toScreen(G.P.x, G.P.y - 10);
    const r = ir.mode === 'in' ? e * maxR : (1 - e) * maxR;
    c.fillStyle = '#0b0616'; c.beginPath(); c.rect(0, 0, W, H); c.arc(ix, iy, Math.max(0, r), 0, Math.PI * 2, true); c.fill('evenodd');
    if (r > 4) { c.strokeStyle = '#ffd23f'; c.lineWidth = 4 * d; c.beginPath(); c.arc(ix, iy, r, 0, 7); c.stroke(); }
  }
}
// ---------- Petits portraits pour les menus ----------
function portrait(canvas, cfg, v, scale, dir = 0, frame = 0, gait = 'basic') {
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
  const cv = charCanvas(cfg, dir === 3 ? 2 : dir, frame, v, gait);
  const w = 20 * scale, h = 34 * scale, x = (canvas.width - w) / 2, y = canvas.height - h - scale;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(canvas.width / 2 - 5 * scale, canvas.height - 3 * scale, 10 * scale, 2 * scale);
  if (dir === 3) { c.save(); c.translate(canvas.width, 0); c.scale(-1, 1); c.drawImage(cv, x, y, w, h); c.restore(); } else c.drawImage(cv, x, y, w, h);
}
