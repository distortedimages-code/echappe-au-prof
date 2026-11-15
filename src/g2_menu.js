// ================= MENU PRINCIPAL EN TUILES : une petite scène animée par mode de jeu =================
// Chaque <canvas data-ill="…"> du menu est redessiné ~10 fois par seconde avec les vrais sprites du jeu.
const MenuArt = {
  t: 0, acc: 1, pool: null,
  // un personnage, pieds en (x, y). dir : 0 face, 1 dos, 2 droite, 3 gauche
  spr(c, cfg, v, x, y, dir, fr, gait) {
    const cv = charCanvas(cfg, dir === 3 ? 2 : dir, fr || 0, v || null, gait || 'basic');
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(Math.round(x) - 5, y - 1, 10, 2);
    c.save(); c.translate(Math.round(x), Math.round(y)); if (dir === 3) c.scale(-1, 1); c.drawImage(cv, -10, -32); c.restore();
  },
  floor(c, fs, y0, W) { for (let y = y0, r = 0; y < 60; y += 16, r++) for (let x = 0; x < W; x += 16) drawFloorTile(c, x, y, fs, x / 16, r + 3); },
  wall(c, ws, y0, W) { for (let x = 0; x < W; x += 16) drawWallTile(c, x, y0, ws, true, x / 16, 0); },
  kids() {
    if (!this.pool) { const cs = (UI.chars || []).slice(0, 3); while (cs.length < 3) cs.push(randomChar('')); this.pool = cs; }
    return this.pool;
  },
  refresh() { this.pool = null; this.acc = 1; },
  tick(dt) {
    this.t += dt; this.acc += dt; if (this.acc < 0.09) return; this.acc = 0;
    document.querySelectorAll('#sTitle canvas[data-ill]').forEach(cv => {
      const c = cv.getContext('2d'); if (!c) return; c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height);
      try { this[cv.dataset.ill](c, this.t, cv.width, cv.height); } catch (e) { }
    });
  },
  // 🕵️ la nuit, on passe dans le dos du surveillant pour rejoindre l'escalier
  inf(c, t, W, H) {
    c.fillStyle = '#1a1430'; c.fillRect(0, 0, W, H);
    this.wall(c, WS.BLUE, 0, W); this.floor(c, FS.LINO, 16, W);
    c.fillStyle = '#2a2d44'; c.fillRect(34, 2, 20, 12); c.fillStyle = '#0d1a3a'; c.fillRect(35, 3, 18, 10); c.fillStyle = '#fff3b0'; c.fillRect(47, 4, 3, 3); c.fillStyle = '#ffffff'; c.fillRect(38, 6, 1, 1); c.fillRect(42, 10, 1, 1);
    // l'escalier, en bas à droite
    const sx = 68, sy = 28; c.fillStyle = 'rgba(63,200,110,.3)'; c.fillRect(sx, sy, 20, 28); c.strokeStyle = 'rgba(63,200,110,.95)'; c.lineWidth = 1; c.strokeRect(sx + .5, sy + .5, 19, 27);
    c.strokeStyle = '#ffffff'; for (let i = 0; i < 2; i++) { const yy = sy + 8 + ((t * 10 + i * 12) % 22); c.beginPath(); c.moveTo(sx + 5, yy - 3); c.lineTo(sx + 10, yy + 1); c.lineTo(sx + 15, yy - 3); c.stroke(); }
    // nuit
    c.fillStyle = 'rgba(10,6,30,.45)'; c.fillRect(0, 0, W, H);
    // le surveillant regarde ailleurs, avec sa lampe
    const g = PROFS[1], gx = 20, gy = 50;
    c.fillStyle = 'rgba(255,230,120,.28)'; c.beginPath(); c.moveTo(gx - 4, gy - 16); c.lineTo(-10, gy - 34); c.lineTo(-10, gy + 6); c.closePath(); c.fill();
    this.spr(c, g.cfg, g.v, gx, gy, 3, Math.floor(t * 5) % 4, 'walk');
    // deux élèves sur la pointe des pieds
    const [a, b] = this.kids(), ph = Math.floor(t * 7) % 6, bob = (t * 2) % 1;
    this.spr(c, a, null, 44 + bob * 2, 46, 2, ph, 'sneak');
    this.spr(c, b, null, 58 + bob * 2, 52, 2, (ph + 3) % 6, 'sneak');
    if ((t * 2 | 0) % 2) { c.fillStyle = '#bfe4ff'; c.fillRect(50, 12, 1, 3); c.fillRect(52, 11, 1, 4); }
  },
  // 👥 élève contre prof
  multi(c, t, W, H) {
    c.fillStyle = '#3d6fd0'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e43b44'; c.beginPath(); c.moveTo(50, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(38, H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 6; i++) c.fillRect(((t * 30 + i * 17) % (W + 20)) - 10, 6 + i * 8, 8, 1);
    c.fillStyle = 'rgba(20,11,38,.35)'; c.fillRect(0, 44, W, 12);
    const k = this.kids()[0], p = PROFS[2], f = Math.floor(t * 9) % 6;
    this.spr(c, k, null, 22, 50, 2, f, 'run');
    this.spr(c, p.cfg, p.v, 68, 50, 3, (f + 2) % 6, 'run');
    const s = 1 + Math.sin(t * 6) * 0.08; c.save(); c.translate(44, 24); c.scale(s, s);
    c.font = '11px "Press Start 2P", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#140b26'; c.fillText('VS', 1, 1); c.fillStyle = '#ffd23f'; c.fillText('VS', 0, 0); c.restore();
    // les deux téléphones
    [[6, 4], [74, 4]].forEach(([x, y], i) => { c.fillStyle = '#140b26'; c.fillRect(x, y, 8, 12); c.fillStyle = i ? '#ff9fb0' : '#9fd7ff'; c.fillRect(x + 1, y + 1, 6, 9); const on = (t * 3 + i) % 2 < 1; c.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,.4)'; c.fillRect(x + 3, y + 3, 2, 1); c.fillRect(x + 2, y + 5, 4, 1); });
  },
  // 👕 la garde-robe
  chars(c, t, W, H) {
    c.fillStyle = '#c2b9a8'; c.fillRect(0, 0, W, H);
    this.wall(c, WS.PAINT, 0, W); this.floor(c, FS.WOOD, 16, W);
    drawWallDecor(c, 4, 0, { t: 'poster', x: 1, y: 2 }, 0); drawWallDecor(c, 68, 0, { t: 'poster', x: 2, y: 1 }, 0);
    const ks = this.kids();
    ks.forEach((k, i) => { const x = 18 + i * 26, sel = i === 1, by = sel ? Math.round(Math.abs(Math.sin(t * 3)) * -2) : 0; this.spr(c, k, null, x, 50 + by, 0, 0, 'basic'); });
    const tw = (t * 4 | 0) % 4; c.fillStyle = '#fff6a0'; if (tw < 2) { c.fillRect(54, 14, 1, 3); c.fillRect(53, 15, 3, 1); } else { c.fillRect(34, 12, 1, 3); c.fillRect(33, 13, 3, 1); }
  },
  // 🧸 la collection
  squish(c, t, W, H) {
    c.fillStyle = '#ffd6ea'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffc0dd'; for (let y = 2; y < H; y += 8) for (let x = (y / 8 % 2) * 4; x < W; x += 8) c.fillRect(x, y, 2, 2);
    c.fillStyle = '#c08a54'; c.fillRect(0, 44, W, 4); c.fillStyle = '#9a6a3c'; c.fillRect(0, 48, W, 2); c.fillStyle = '#e0b07a'; c.fillRect(0, 44, W, 1);
    const have = SqCol.get(), got = SQUISHIES.filter(q => have[q.id]).map(q => q.id);
    const ids = got.length ? got : [0, 5, 12, 20, 33];
    const pickN = n => ids[Math.floor((t / 2.2) + n * 3) % ids.length];
    [[2, 30], [17, 30], [58, 30], [73, 30]].forEach(([x, y], i) => c.drawImage(squishyCanvas(pickN(i + 1), !got.length && i % 2 === 1), x, y));
    const sq = 1 + Math.max(0, Math.sin(t * 5)) * 0.18, big = squishyCanvas(pickN(0));
    c.save(); c.translate(44, 44); c.scale(2 * (1 + (sq - 1) * 0.6), 2 / sq); c.drawImage(big, -7, -14); c.restore();
    if ((t * 2 | 0) % 2) { c.fillStyle = '#ff4f8b'; c.fillRect(30, 6, 2, 2); c.fillRect(33, 6, 2, 2); c.fillRect(30, 8, 5, 2); c.fillRect(31, 10, 3, 1); c.fillRect(32, 11, 1, 1); }
  },
  // 🦴 le tableau de M. Silex
  hist(c, t, W, H) {
    c.fillStyle = '#c9b48a'; c.fillRect(0, 0, W, H); this.floor(c, FS.WOOD, 42, W);
    c.fillStyle = '#7a4b2a'; c.fillRect(3, 3, 58, 34); c.fillStyle = '#2f5a3a'; c.fillRect(5, 5, 54, 30);
    c.fillStyle = 'rgba(255,255,255,.9)';
    // un mammouth à la craie
    [[12, 15, 15, 8], [10, 17, 2, 5], [25, 12, 7, 8], [30, 19, 2, 8], [31, 26, 3, 1], [26, 21, 5, 1], [13, 23, 2, 5], [18, 23, 2, 5], [23, 23, 2, 5], [14, 13, 9, 2]].forEach(r => c.fillRect(...r));
    c.fillStyle = '#2f5a3a'; c.fillRect(27, 14, 1, 1);
    // la frise
    c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(37, 27, 19, 1); [37, 43, 50, 55].forEach(x => c.fillRect(x, 25, 1, 5));
    c.fillStyle = '#ffd23f'; c.fillRect(37, 10, 9, 2); c.fillRect(36, 9, 2, 4); c.fillRect(45, 9, 2, 4);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(49, 9, 6, 1); c.fillRect(49, 12, 4, 1); c.fillRect(49, 15, 6, 1);
    const p = PROFS[6], wav = Math.sin(t * 2.5) > 0.6;
    this.spr(c, p.cfg, p.v, 74, 52, wav ? 3 : 0, wav ? Math.floor(t * 8) % 4 : 0, wav ? 'walk' : 'basic');
    if ((t * 1.5 | 0) % 3 === 0) { c.fillStyle = '#ffffff'; c.fillRect(64, 10, 9, 7); c.fillRect(66, 17, 2, 2); c.fillStyle = '#140b26'; c.fillRect(67, 11, 2, 1); c.fillRect(68, 12, 1, 2); c.fillRect(68, 15, 1, 1); }
  },
  // 🇬🇧 le cours de Miss Teacup
  en(c, t, W, H) {
    c.fillStyle = '#d8e4f0'; c.fillRect(0, 0, W, H); this.floor(c, FS.CARPET, 42, W);
    c.fillStyle = '#7a4b2a'; c.fillRect(3, 3, 50, 30); c.fillStyle = '#2f5a3a'; c.fillRect(5, 5, 46, 26);
    c.font = '7px "Press Start 2P", monospace'; c.textBaseline = 'top'; c.fillStyle = 'rgba(255,255,255,.9)'; c.fillText('ABC', 8, 9); c.fillStyle = '#ffd23f'; c.fillText('Hi!', 8, 19);
    // le drapeau
    const fx = 37, fy = 8; c.fillStyle = '#1f3a8a'; c.fillRect(fx, fy, 12, 8); c.fillStyle = '#ffffff'; c.fillRect(fx + 5, fy, 3, 8); c.fillRect(fx, fy + 3, 12, 2); c.fillStyle = '#d0283a'; c.fillRect(fx + 6, fy, 1, 8); c.fillRect(fx, fy + 4, 12, 1);
    // le bureau et la tasse de thé
    c.fillStyle = '#8b5a2b'; c.fillRect(48, 40, 26, 4); c.fillStyle = '#5a351c'; c.fillRect(50, 44, 2, 8); c.fillRect(70, 44, 2, 8);
    c.fillStyle = '#ffffff'; c.fillRect(56, 34, 7, 6); c.fillRect(63, 35, 2, 3); c.fillStyle = '#d0d6e0'; c.fillRect(54, 39, 11, 1); c.fillStyle = '#a0522d'; c.fillRect(57, 35, 5, 1); c.fillStyle = '#ff6f91'; c.fillRect(58, 37, 3, 1);
    c.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 2; i++) { const s = (t * 8 + i * 5) % 10; c.fillRect(58 + i * 2 + Math.round(Math.sin(t * 4 + i) * 1), 32 - s, 1, 2); }
    const p = PROFS[5];
    this.spr(c, p.cfg, p.v, 80, 52, 0, 0, 'basic');
  }
};
