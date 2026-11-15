// ================= NIVEAUX PROCÉDURAUX (un univers par niveau) =================
// Générateur à graine : même graine => même plan (indispensable pour le mode à deux).
function mkRng(seed) {
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = { f, i: (lo, hi) => lo + Math.floor(f() * (hi - lo + 1)), p: arr => arr[Math.floor(f() * arr.length)], ch: p => f() < p };
  R.sh = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return R;
}
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// outils communs à tous les générateurs
function PG(R, m) {
  const g = { R, m, keep: new Set(), rooms: [] };
  g.key = (x, y) => y * m.w + x;
  g.free = (x, y) => m.get(x, y) === K.FLOOR && !g.keep.has(g.key(x, y));
  g.hold = (x, y) => g.keep.add(g.key(x, y));
  g.put = (r, x, y, k) => { if (r && (x < r.x || y < r.y || x >= r.x + r.w || y >= r.y + r.h)) return false; if (!g.free(x, y)) return false; m.set(x, y, k); if (r) r.placed.push([x, y]); return true; };
  g.row = (r, x, y, n, k) => { for (let i = 0; i < n; i++) g.put(r, x + i, y, k); };
  g.col = (r, x, y, n, k) => { for (let i = 0; i < n; i++) g.put(r, x, y + i, k); };
  g.wall = (x, y) => m.get(x, y) === K.WALL;
  g.dec = (x, y, t, o) => { if (g.wall(x, y) && m.get(x, y + 1) === K.FLOOR) { m.dec(x, y, t, o); return true; } return false; };
  // toutes les cases libres d'une pièce doivent rester accessibles depuis ses portes
  g.repair = r => {
    const inR = (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
    for (let guard = 0; guard < 80; guard++) {
      const seeds = r.seeds.filter(([x, y]) => m.get(x, y) === K.FLOOR);
      if (!seeds.length) return;
      const seen = new Set(), q = [];
      seeds.forEach(([x, y]) => { const k = g.key(x, y); if (!seen.has(k)) { seen.add(k); q.push(k); } });
      for (let qi = 0; qi < q.length; qi++) {
        const k = q[qi], x = k % m.w, y = (k / m.w) | 0;
        for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (!inR(nx, ny)) continue; const nk = g.key(nx, ny); if (seen.has(nk) || m.get(nx, ny) !== K.FLOOR) continue; seen.add(nk); q.push(nk); }
      }
      let bad = false;
      for (let y = r.y; y < r.y + r.h && !bad; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR && !seen.has(g.key(x, y))) { bad = true; break; }
      if (!bad) return;
      const last = r.placed.pop(); if (!last) return; m.set(last[0], last[1], K.FLOOR);
    }
  };
  return g;
}

// ---------- ameublement selon le type de pièce ----------
const FURN = {
  classroom(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1, bw = Math.min(5, r.w - 4);
    if (bw >= 2) { const bx = r.x + ((r.w - bw) >> 1); g.m.dec(bx, r.y - 1, 'board', { w: bw }); r.board = []; for (let i = 0; i < bw; i++) if (g.wall(bx + i, r.y - 1)) r.board.push([bx + i, r.y]); }
    g.row(r, r.x + (r.w >> 1) - 1, r.y + 1, 2, K.DESK);
    for (let y = r.y + 3; y <= Y2 - 1; y += 2) for (let x = r.x + 1; x + 1 <= X2 - 1; x += 4) { g.put(r, x, y, K.TABLE); g.put(r, x + 1, y, K.TABLE); }
    g.put(r, X2, r.y, K.ARMOIRE); g.put(r, r.x, Y2, K.TRASH); g.put(r, X2, Y2, K.PLANT);
    g.dec(r.x + 1, r.y - 1, g.R.p(['poster', 'clock', 'map']));
  },
  permanence(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    if (r.w >= 7) { const bw = Math.min(4, r.w - 5), bx = r.x + ((r.w - bw) >> 1); g.m.dec(bx, r.y - 1, 'board', { w: bw }); r.board = []; for (let i = 0; i < bw; i++) if (g.wall(bx + i, r.y - 1)) r.board.push([bx + i, r.y]); }
    g.row(r, r.x + (r.w >> 1), r.y + 1, 2, K.DESK);
    for (let y = r.y + 3; y <= Y2 - 1; y += 2) for (let x = r.x + 1; x + 1 <= X2 - 1; x += 3) { g.put(r, x, y, K.TABLE); g.put(r, x + 1, y, K.TABLE); }
    g.put(r, X2, r.y, K.ARMOIRE); g.put(r, r.x, Y2, K.TRASH); g.put(r, X2, Y2, K.PLANT); g.dec(X2 - 1, r.y - 1, 'clock');
  },
  toilets(g, r) { for (let x = r.x; x <= r.x + r.w - 1; x += 2) g.put(r, x, r.y, K.STALL); if (r.h >= 5) g.put(r, r.x + r.w - 1, r.y + r.h - 1, K.TRASH); },
  showers(g, r) { for (let x = r.x; x <= r.x + r.w - 1; x += 2) g.put(r, x, r.y, K.STALL); if (r.h >= 6) for (let x = r.x + 1; x <= r.x + r.w - 1; x += 2) g.put(r, x, r.y + r.h - 1, K.STALL); },
  office(g, r, o) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    if (o && o.shelfTop) { r.search = []; for (let x = r.x + 1; x <= X2 - 2; x++) if (g.put(r, x, r.y, K.SHELF)) r.search.push([x, r.y]); }
    if (r.h >= 7) g.row(r, r.x, Y2 - 2, Math.max(2, r.w - 3), K.COUNTER);
    g.row(r, r.x + 2, r.y + 2, 2, K.DESK); if (r.w >= 10) g.row(r, r.x + 6, r.y + 2, 2, K.DESK);
    g.put(r, X2, r.y + 3, K.COPIER); g.put(r, X2, r.y, K.ARMOIRE); g.put(r, r.x, Y2, K.PLANT); g.put(r, X2, Y2, K.TRASH);
  },
  infirmary(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    for (let y = r.y + 1; y <= Y2 - 1; y += 3) g.put(r, r.x, y, K.BED);
    g.put(r, X2, r.y, K.ARMOIRE); g.row(r, X2 - 2, r.y + (r.h >> 1), 2, K.DESK); g.put(r, X2, Y2, K.PLANT); g.put(r, r.x + 2, Y2, K.TRASH);
    g.dec(r.x + 2, r.y - 1, 'poster');
  },
  storage(g, r) { const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; g.row(r, r.x, r.y, Math.min(3, r.w - 2), K.SHELF); g.put(r, X2, r.y, K.ARMOIRE); g.put(r, r.x, Y2, K.TRASH); if (r.h >= 6) g.row(r, r.x + 2, r.y + 3, Math.max(1, r.w - 4), K.SHELF); },
  cleaning(g, r) { const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; g.row(r, r.x, r.y, 2, K.SHELF); g.put(r, X2, r.y, K.ARMOIRE); g.put(r, r.x, Y2, K.TRASH); },
  lockers(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    g.row(r, r.x, r.y, r.w - 1, K.LOCKER);
    if (r.h >= 6) { const y = r.y + (r.h >> 1); g.row(r, r.x + 2, y, Math.max(2, r.w - 4), K.LOCKER); if (y + 2 <= Y2) g.row(r, r.x + 2, y + 2, Math.max(2, r.w - 5), K.BENCH); }
    else g.row(r, r.x + 1, Y2, Math.max(2, r.w - 3), K.BENCH);
  },
  stairs(g, r) { if (r.w >= 5 && r.h >= 5) g.m.fdec(r.x + ((r.w - 3) >> 1), r.y + ((r.h - 3) >> 1), 'stairs', { w: 3, h: 3 }); g.put(r, r.x + r.w - 1, r.y, K.PLANT); },
  cdi(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; r.search = [];
    for (let y = r.y; y <= Y2; y++) if (g.put(r, r.x, y, K.SHELF)) r.search.push([r.x, y]);
    for (let y = r.y + 2; y <= Y2 - 2; y += 4) { g.row(r, r.x + 3, y, Math.min(5, r.w - 7), K.SHELF); if (r.x + 14 <= X2 - 1) g.row(r, r.x + 10, y, Math.min(4, X2 - 1 - (r.x + 10)), K.SHELF); }
    for (let y = r.y + 4; y <= Y2 - 1; y += 4) [r.x + 4, r.x + 5].forEach(x => g.put(r, x, y, K.TABLE));
    g.row(r, X2 - 1, r.y + 1, 2, K.DESK); g.row(r, X2 - 2, Y2, 2, K.SOFA); g.put(r, X2, Y2, K.PLANT); g.put(r, X2, r.y, K.PLANT);
    g.dec(r.x + 3, r.y - 1, 'poster');
  },
  staff(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    g.row(r, r.x + 1, r.y + 1, 2, K.SOFA); if (r.w >= 8 && r.h >= 5) g.row(r, r.x + 3, r.y + 3, Math.min(4, r.w - 5), K.MEET);
    g.put(r, r.x, Y2, K.COPIER); g.put(r, X2, Y2, K.ARMOIRE); g.put(r, X2, r.y + 1, K.TRASH); g.put(r, X2 - 2, r.y, K.PLANT);
  },
  gym(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1, cx = r.x + (r.w >> 1);
    g.m.fdec(r.x, r.y, 'gymlines', { w: r.w, h: r.h - 2 });
    r.search = [];
    [[r.x + 1, r.y + 1], [r.x + 2, r.y + 1], [X2 - 2, r.y + 1], [X2 - 1, r.y + 1], [r.x + 1, Y2 - 5], [X2 - 1, Y2 - 5]].forEach(([x, y]) => { if (g.put(r, x, y, K.MATS)) r.search.push([x, y]); });
    g.put(r, cx - 1, r.y, K.BALLBIN); g.put(r, cx + 1, r.y, K.BALLBIN);
    g.dec(r.x + (r.w >> 2), r.y - 1, 'hoop'); g.dec(r.x + ((r.w * 3) >> 2), r.y - 1, 'hoop');
    const bl = Math.min(8, (r.w >> 1) - 3); g.row(r, r.x + 2, Y2, bl, K.BLEACH); g.row(r, X2 - 1 - bl, Y2, bl, K.BLEACH);
    g.row(r, r.x + 5, r.y + 7, 2, K.BENCH); g.row(r, X2 - 6, r.y + 7, 2, K.BENCH);
    g.put(r, r.x, r.y + 5, K.ARMOIRE); g.put(r, X2, Y2 - 3, K.TRASH);
  },
  equipment(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; r.search = [];
    g.row(r, r.x, r.y, 2, K.BALLBIN);
    for (let x = X2 - 3; x <= X2 - 1; x++) if (g.put(r, x, r.y, K.MATS)) r.search.push([x, r.y]);
    g.put(r, X2, Y2, K.ARMOIRE); g.put(r, r.x, Y2, K.SHELF);
  },
  sportoffice(g, r) { const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; g.row(r, r.x + 1, r.y + 2, 2, K.DESK); g.put(r, X2, r.y + 1, K.ARMOIRE); g.put(r, r.x, Y2, K.TRASH); g.put(r, X2, Y2, K.PLANT); },
  hall(g, r) { const X2 = r.x + r.w - 1, my = r.y + (r.h >> 1); g.col(r, X2, my - 1, 2, K.SHELF); g.col(r, r.x, my, 2, K.BENCH); g.put(r, r.x, r.y, K.PLANT); },
  muscu(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; r.search = [];
    g.put(r, r.x + 1, r.y + 2, K.BENCH); if (r.w >= 6) g.put(r, r.x + 4, r.y + 2, K.BENCH);
    [[r.x + 1, Y2], [r.x + 2, Y2]].forEach(([x, y]) => { if (g.put(r, x, y, K.MATS)) r.search.push([x, y]); });
    g.put(r, X2, r.y, K.ARMOIRE); g.put(r, X2, Y2, K.BALLBIN);
  },
  principal(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1, cx = r.x + (r.w >> 1); r.search = [];
    g.row(r, cx - 2, r.y + 3, 4, K.DESK);
    [r.x + 2, r.x + 5, r.x + 8].forEach((x, i) => { if (x < X2 - 4 && g.dec(x, r.y - 1, i === 1 ? 'portrait' : 'frame')) r.search.push([x, r.y - 1]); });
    for (let x = X2 - 3; x <= X2 - 1; x++) if (g.put(r, x, r.y, K.SHELF)) r.search.push([x, r.y]);
    if (r.h >= 7) g.row(r, X2 - 2, Y2 - 1, 2, K.SOFA);
    [[r.x, r.y], [X2, r.y], [X2, Y2]].forEach(([x, y]) => g.put(r, x, y, K.PLANT));
    g.put(r, r.x, r.y + 3, K.ARMOIRE);
    if (r.w >= 9 && r.h >= 8) g.m.fdec(cx - 3, r.y + 5, 'rug', { w: 6, h: Math.min(3, r.h - 6), col: '#c8a84a' });
  },
  meeting(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    const rows = Math.min(3, r.h - 4); for (let i = 0; i < rows; i++) g.row(r, r.x + 3, r.y + 2 + i, Math.max(2, r.w - 6), K.MEET);
    g.put(r, X2, r.y, K.ARMOIRE); g.put(r, r.x, r.y, K.PLANT); g.put(r, r.x, Y2, K.PLANT); g.put(r, X2, Y2, K.PLANT);
    if (r.w >= 7) g.m.dec(r.x + (r.w >> 1) - 1, r.y - 1, 'screen', { w: 3 });
  },
  archives(g, r) { const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; for (let y = r.y + 2; y <= Y2 - 1; y += 3) g.row(r, r.x + 2, y, Math.max(1, r.w - 4), K.SHELF); g.put(r, X2, r.y, K.ARMOIRE); },
  waiting(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1, cx = r.x + (r.w >> 1);
    g.col(r, r.x, r.y + 2, Math.min(3, r.h - 3), K.SOFA); if (r.h >= 7) g.row(r, cx - 1, Y2 - 2, 3, K.BENCH); g.row(r, cx, r.y + 2, 2, K.TABLE);
    g.put(r, X2, r.y, K.PLANT); g.put(r, r.x, Y2, K.PLANT); g.put(r, X2, Y2, K.TRASH); g.dec(cx, r.y - 1, 'clock');
  },
  landing(g, r) { const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; g.row(r, r.x + 2, r.y + 2, 2, K.BENCH); g.put(r, r.x, Y2, K.PLANT); g.put(r, X2, Y2 - 1, K.PLANT); g.col(r, X2, r.y + 1, 2, K.SHELF); g.dec(r.x + 2, r.y - 1, 'frame'); },
  copy(g, r) { const X2 = r.x + r.w - 1; g.put(r, r.x, r.y, K.COPIER); g.put(r, r.x + 2, r.y, K.COPIER); g.put(r, X2, r.y, K.SHELF); g.put(r, X2, r.y + r.h - 1, K.TRASH); },
  stairroom(g, r) {
    for (let y = r.y + 1; y <= r.y + 3; y++) for (let x = r.x + 1; x <= r.x + 3; x++) g.hold(x, y);
    g.m.fdec(r.x + 1, r.y + 1, 'stairs', { w: 3, h: 3 }); r.stairPt = [r.x + 2, r.y + 2];
    g.put(r, r.x, r.y + r.h - 1, K.PLANT); if (r.h >= 7) g.put(r, r.x + r.w - 1, r.y + r.h - 2, K.TRASH);
  },
  patio(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    g.R.sh([[r.x + 1, r.y + 1], [X2 - 1, Y2 - 1], [X2 - 1, r.y + 1], [r.x + 1, Y2 - 1]]).slice(0, r.w * r.h >= 50 ? 3 : 2).forEach(([x, y]) => g.put(r, x, y, K.TREE));
    for (let i = 0; i < 8; i++) { const x = g.R.i(r.x, X2), y = g.R.i(r.y, Y2); if (x === r.x || x === X2 || y === Y2) g.put(r, x, y, K.BUSH); }
    const cx = r.x + (r.w >> 1), cy = r.y + (r.h >> 1); g.put(r, cx - 1, cy, K.BENCH); if (r.w >= 8) g.put(r, cx + 1, cy, K.BENCH);
    for (let x = r.x; x <= X2; x += 2) g.dec(x, r.y - 1, 'window');
  },
  smalloffice(g, r) { const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; g.row(r, r.x + 1, r.y + 1, 2, K.DESK); g.put(r, X2, r.y, K.ARMOIRE); g.put(r, X2, Y2, K.PLANT); g.put(r, r.x, Y2, K.TRASH); }
};

// ---------- les univers intérieurs ----------
const UNIVERSES = {
  2: {
    w: [34, 38], h: [28, 32], fs: FS.LINO, ws: WS.GREEN, corFs: FS.CHECK, up: [8, 10], vcor: 0.75, minW: 5, maxW: 12, minH: 4, maxH: 10,
    teacher: 'Bureau de la vie scolaire', keys: 'Bureau de la vie scolaire', start: ['Salle de colle'],
    rooms: [
      { n: 'Bureau de la vie scolaire', fs: FS.OFFICE, f: 'office', o: { shelfTop: 1 }, sz: 'mid', minW: 7, minH: 5, search: 1 },
      { n: 'Infirmerie', fs: FS.TILE, f: 'infirmary', sz: 'mid', hold: 1 },
      { n: 'Local ménage', fs: FS.TILE, f: 'cleaning', sz: 'small', small: 1 },
      { n: 'Salle de colle', fs: FS.WOOD, f: 'classroom', sz: 'mid', minW: 6, minH: 6 },
      { n: 'Toilettes', fs: FS.TILE, f: 'toilets', sz: 'small' }
    ],
    fill: [{ n: 'Salle de permanence', fs: FS.WOOD, f: 'permanence' }, { n: 'Vestiaire', fs: FS.LINO, f: 'lockers' }, { n: 'Réserve', fs: FS.LINO, f: 'storage' }, { n: 'Escaliers', fs: FS.CHECK, f: 'stairs' }, { n: 'Bureau du CPE', fs: FS.OFFICE, f: 'smalloffice' }, { n: 'Salle d’étude', fs: FS.WOOD, f: 'permanence' }, { n: 'Salle de photocopie', fs: FS.LINO, f: 'copy' }, { n: 'Salle des délégués', fs: FS.WOOD, f: 'staff' }, { n: 'Casiers des élèves', fs: FS.LINO, f: 'lockers' }, { n: 'Bureau de l’assistante sociale', fs: FS.OFFICE, f: 'smalloffice' }],
    hold: { kind: K.X_WINDOW, label: 'Ouvrir la fenêtre', icon: '🪟', time: 2.5, noise: 9, snd: 'creak', word: 'CRIIIC' },
    search: { label: 'Fouiller les dossiers', reveal: 'Une porte secrète derrière les dossiers !', icon: '🗂️', kinds: [K.SHELF] },
    small: { label: 'Se faufiler dans le trou de souris', icon: '🐭' },
    meta: { binders: true, lockerCol: '#e07a3a', sofaCol: '#3d7bff', robots: 6 },
    tasks: ['tampon', 'photocopies', 'coussin', 'nounours', 'bisous', 'couleurs']
  },
  3: {
    w: [42, 46], h: [30, 34], fs: FS.WOOD, ws: WS.PAINT, corFs: FS.CHECK, up: [8, 10], vcor: 0.8, minW: 6, maxW: 13, minH: 5, maxH: 10,
    teacher: 'Salle 101 · Français', keys: 'Salle des profs', start: ['CDI', 'Toilettes'],
    rooms: [
      { n: 'Salle 101 · Français', fs: FS.WOOD, f: 'classroom', sz: 'mid', minW: 7, minH: 6 },
      { n: 'CDI', fs: FS.CARPET, f: 'cdi', sz: 'big', minW: 9, minH: 7, search: 1 },
      { n: 'Salle 104 · Sciences', fs: FS.LINO, f: 'classroom', sz: 'mid', minW: 7, minH: 6, hold: 1 },
      { n: 'Salle des profs', fs: FS.OFFICE, f: 'staff', sz: 'mid', minW: 7 },
      { n: 'Local ménage', fs: FS.TILE, f: 'cleaning', sz: 'small', small: 1 },
      { n: 'Toilettes', fs: FS.TILE, f: 'toilets', sz: 'small' }
    ],
    fill: [{ n: 'Salle 102 · Maths', fs: FS.WOOD, f: 'classroom' }, { n: 'Salle 103 · Histoire', fs: FS.WOOD, f: 'classroom' }, { n: 'Salle 105 · Anglais', fs: FS.WOOD, f: 'classroom' }, { n: 'Salle 106 · Musique', fs: FS.WOOD, f: 'classroom' }, { n: 'Salle d’arts plastiques', fs: FS.LINO, f: 'classroom' }, { n: 'Réserve', fs: FS.LINO, f: 'storage' }, { n: 'Salle 107 · Espagnol', fs: FS.WOOD, f: 'classroom' }, { n: 'Salle 108 · Latin', fs: FS.WOOD, f: 'classroom' }, { n: 'Labo de techno', fs: FS.LINO, f: 'permanence' }, { n: 'Salle info', fs: FS.LINO, f: 'permanence' }, { n: 'Vestiaire', fs: FS.LINO, f: 'lockers' }],
    hold: { kind: K.X_WINDOW, label: 'Ouvrir la fenêtre', icon: '🪟', time: 2.5, noise: 9, snd: 'creak', word: 'CRIIIC' },
    search: { label: 'Fouiller les livres', reveal: 'Un passage secret derrière les livres !', icon: '📚', kinds: [K.SHELF] },
    small: { label: 'Se faufiler dans le trou de souris', icon: '🐭' },
    meta: { lockerCol: '#d94a5a', sofaCol: '#7b45a8', robots: 8 },
    tasks: ['hamster', 'vacances', 'plante', 'moustache', 'sucre', 'squelette']
  },
  4: {
    w: [38, 42], h: [31, 34], fs: FS.GYM, ws: WS.BLUE, corFs: FS.LINO, up: [14, 16], vcor: 0.5, minW: 6, maxW: 13, minH: 5, maxH: 10,
    big: { n: 'Gymnase', fs: FS.GYM, f: 'gym', w: [20, 24], search: 1 },
    teacher: 'Gymnase', keys: 'Bureau du prof de sport', start: ['Vestiaire des filles', 'Vestiaire des garçons'],
    rooms: [
      { n: 'Local matériel', fs: FS.WOOD, f: 'equipment', sz: 'small', minW: 5, small: 1, search: 1 },
      { n: 'Bureau du prof de sport', fs: FS.OFFICE, f: 'sportoffice', sz: 'small' },
      { n: 'Hall', fs: FS.LINO, f: 'hall', sz: 'mid', hold: 1 },
      { n: 'Vestiaire des filles', fs: FS.TILE, f: 'lockers', sz: 'mid' },
      { n: 'Douches', fs: FS.TILE, f: 'showers', sz: 'small' }
    ],
    fill: [{ n: 'Vestiaire des garçons', fs: FS.TILE, f: 'lockers' }, { n: 'Salle de muscu', fs: FS.GYM, f: 'muscu', search: 1 }, { n: 'Infirmerie', fs: FS.TILE, f: 'infirmary' }, { n: 'Réserve', fs: FS.WOOD, f: 'storage' }, { n: 'Salle de danse', fs: FS.GYM, f: 'muscu', search: 1 }, { n: 'Local des arbitres', fs: FS.OFFICE, f: 'smalloffice' }, { n: 'Salle de ping-pong', fs: FS.GYM, f: 'permanence' }, { n: 'Douches des profs', fs: FS.TILE, f: 'showers' }, { n: 'Salle de judo', fs: FS.GYM, f: 'muscu', search: 1 }],
    hold: { kind: K.X_DOOR, label: 'Pousser l’issue de secours', icon: '🚨', time: 2, noise: 16, snd: 'alarm', word: 'DRIIIING', bottom: 1 },
    search: { label: 'Soulever les tapis', reveal: 'Une trappe secrète sous les tapis !', icon: '🤸', kinds: [K.MATS], any: 1 },
    small: { label: 'Se faufiler dans le trou', icon: '🐭' },
    meta: { lockerCol: '#3fae8e', sofaCol: '#3d7bff', robots: 7 },
    tasks: ['ballon', 'pompes', 'chrono', 'mousse', 'chaussettes']
  },
  5: {
    w: [40, 44], h: [28, 32], fs: FS.CARPET, ws: WS.WOOD, corFs: FS.CARPET, up: [8, 10], vcor: 0.75, minW: 6, maxW: 15, minH: 5, maxH: 11,
    teacher: 'Bureau de la directrice', keys: 'Secrétariat', start: ['Salle d’attente'],
    rooms: [
      { n: 'Bureau de la directrice', fs: FS.ROYAL, f: 'principal', sz: 'big', minW: 10, minH: 6, search: 1 },
      { n: 'Secrétariat', fs: FS.OFFICE, f: 'office', sz: 'mid', minW: 6 },
      { n: 'Palier de l’ascenseur', fs: FS.CHECK, f: 'landing', sz: 'mid', hold: 1 },
      { n: 'Archives', fs: FS.LINO, f: 'archives', sz: 'mid', small: 1 },
      { n: 'Salle d’attente', fs: FS.OFFICE, f: 'waiting', sz: 'mid', minH: 5 },
      { n: 'Toilettes', fs: FS.TILE, f: 'toilets', sz: 'small' }
    ],
    fill: [{ n: 'Salle de réunion', fs: FS.WOOD, f: 'meeting' }, { n: 'Salle de photocopie', fs: FS.LINO, f: 'copy' }, { n: 'Bureau du comptable', fs: FS.OFFICE, f: 'smalloffice' }, { n: 'Bureau de l’adjoint', fs: FS.OFFICE, f: 'smalloffice' }, { n: 'Salle du conseil', fs: FS.WOOD, f: 'meeting' }, { n: 'Réserve', fs: FS.LINO, f: 'storage' }, { n: 'Bureau de la gestionnaire', fs: FS.OFFICE, f: 'office' }, { n: 'Salle des trophées', fs: FS.ROYAL, f: 'landing' }, { n: 'Local informatique', fs: FS.LINO, f: 'copy' }],
    hold: { kind: K.X_ELEV, label: 'Appeler l’ascenseur', icon: '🛗', time: 4, noise: 7, snd: 'ding', word: 'DING !', bottom: 1 },
    search: { label: 'Regarder derrière', reveal: 'Un passage secret derrière le tableau !', icon: '🖼️', kinds: [K.SHELF] },
    small: { label: 'Ramper dans le conduit d’aération', icon: '🐭' },
    meta: { binders: true, lockerCol: '#8b5a2b', sofaCol: '#e0249a', robots: 6 },
    tasks: ['coussin', 'chocolat', 'photocopies', 'plante', 'couleurs', 'moustache']
  }
};

// ---------- les sorties « à tenir » ----------
const HOLD_KINDS = {
  win: { kind: K.X_WINDOW, label: 'Ouvrir la fenêtre', icon: '🪟', time: 2.5, noise: 9, snd: 'creak', word: 'CRIIIC' },
  door: { kind: K.X_DOOR, label: 'Pousser l’issue de secours', icon: '🚨', time: 2, noise: 16, snd: 'alarm', word: 'DRIIIING', bottom: 1 },
  elev: { kind: K.X_ELEV, label: 'Appeler l’ascenseur', icon: '🛗', time: 4, noise: 7, snd: 'ding', word: 'DING !', bottom: 1 }
};
UNIVERSES[2].holdMix = [['win', 0.55], ['door', 0.45]];
UNIVERSES[3].holdMix = [['win', 0.55], ['door', 0.45]];
UNIVERSES[4].holdMix = [['door', 0.7], ['win', 0.3]];
UNIVERSES[5].holdMix = [['elev', 0.6], ['door', 0.25], ['win', 0.15]];
const PATIO = { n: 'Patio', fs: FS.GRASS, f: 'patio', patio: 1 };
// découpe l'espace libre (hors couloirs et grandes salles, avec un mur d'1 case autour) en rectangles
function decompose(W, H, blocks) {
  const blk = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x === 0 || y === 0 || x === W - 1 || y === H - 1) blk[y * W + x] = 1;
  const mark = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) blk[y * W + x] = 1; };
  blocks.forEach(b => mark(b.x - 1, b.y - 1, b.x + b.w, b.y + b.h));
  const out = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (blk[y * W + x]) continue;
    let w = 0; while (!blk[y * W + x + w]) w++;
    let h = 1; for (; y + h < H - 1; h++) { let ok = true; for (let i = 0; i < w; i++) if (blk[(y + h) * W + x + i]) { ok = false; break; } if (!ok) break; }
    mark(x, y, x + w, y + h);
    if (w >= 3 && h >= 3) out.push({ x, y, w, h });
  }
  return out;
}
// les couloirs de chaque plan (rectangles de 3 cases de large)
function indoorTemplate(R, S, W, H, tpl) {
  const fl = Math.floor, H1 = H - 1;
  if (tpl === 'comb') {
    const up = R.i(S.up[0], S.up[1]), cy = up + 2; if (H1 - (cy + 4) < 6) return null;
    let x1 = R.i(fl(W * 0.22), fl(W * 0.32)), x2 = R.i(fl(W * 0.58), fl(W * 0.7));
    x2 = Math.min(W - 9, Math.max(x2, x1 + 10)); if (x2 - x1 < 10) return null;
    const cors = [{ x: 1, y: cy, w: W - 2, h: 3 }, { x: x1, y: cy + 3, w: 3, h: H1 - (cy + 3) }, { x: x2, y: cy + 3, w: 3, h: H1 - (cy + 3) }], pre = [];
    if (S.big) { const bw = R.i(S.big.w[0], S.big.w[1]), left = R.ch(0.5); pre.push({ x: left ? 1 : W - 1 - bw, y: 1, w: bw, h: up, def: S.big }); }
    return { cors, pre, cy, vx: x1, up };
  }
  if (tpl === 'ring') {
    const up = R.i(6, 8), cy = up + 2, bandB = R.i(5, 6), cy2 = H - bandB - 5;
    if (cy2 - cy - 5 < 5) return null;
    const ladder = R.ch(0.3), cors = [{ x: 1, y: cy, w: W - 2, h: 3 }], pre = [];
    if (ladder) {
      const xc = R.i(fl(W * 0.4), fl(W * 0.55));
      cors.push({ x: xc, y: cy + 3, w: 3, h: cy2 - cy - 3 }, { x: 1, y: cy2, w: W - 2, h: 3 });
      return { cors, pre, cy, vx: xc, up };
    }
    const xa = R.i(6, 9), xb = W - 4 - R.i(5, 8), full = R.ch(0.5);
    cors.push({ x: xa, y: cy + 3, w: 3, h: cy2 - cy - 3 }, { x: xb, y: cy + 3, w: 3, h: cy2 - cy - 3 }, full ? { x: 1, y: cy2, w: W - 2, h: 3 } : { x: xa, y: cy2, w: xb + 3 - xa, h: 3 });
    const pw = xb - xa - 5, ph = cy2 - cy - 5;
    if (pw >= 6 && ph >= 5 && R.ch(0.7)) pre.push({ x: xa + 4, y: cy + 4, w: pw, h: ph, def: PATIO });
    return { cors, pre, cy, vx: xa, up };
  }
  if (tpl === 'H') {
    const xa = R.i(fl(W * 0.24), fl(W * 0.32)), xb = R.i(fl(W * 0.6), fl(W * 0.68)), yb = R.i(fl(H * 0.4), fl(H * 0.55));
    if (xa < 8 || W - 5 - xb < 6 || xb - xa - 4 < 6) return null;
    return { cors: [{ x: xa + 3, y: yb, w: xb - xa - 3, h: 3 }, { x: xa, y: 1, w: 3, h: H - 2 }, { x: xb, y: 1, w: 3, h: H - 2 }], pre: [], cy: yb, vx: xa, up: yb - 2 };
  }
  if (tpl === 'Z') {
    const up = R.i(6, 8), cy = up + 2, xm = R.i(fl(W * 0.35), fl(W * 0.55));
    if (cy + 9 > H - 10) return null;
    const cyB = R.i(cy + 9, H - 10), left = R.ch(0.5);
    // le Z (ou son miroir) : couloir du haut d'un côté, descente, couloir du bas de l'autre côté
    const cors = left
      ? [{ x: 1, y: cy, w: xm + 2, h: 3 }, { x: xm, y: cy + 3, w: 3, h: cyB - cy - 3 }, { x: xm, y: cyB, w: W - 1 - xm, h: 3 }]
      : [{ x: xm, y: cy, w: W - 1 - xm, h: 3 }, { x: xm, y: cy + 3, w: 3, h: cyB - cy - 3 }, { x: 1, y: cyB, w: xm + 2, h: 3 }];
    return { cors, pre: [], cy, vx: xm, up };
  }
  return null;
}
// ---------- générateur des étages (couloirs + pièces) ----------
function genIndoor(R, S) {
  const W = R.i(S.w[0], S.w[1]), H = R.i(S.h[0], S.h[1]), m = B(W, H, S.fs, S.ws), g = PG(R, m);
  let up = R.i(S.up[0], S.up[1]), cy = up + 2;
  const cors = [], regions = [], leaves = [];
  let vx = -1, tpl = 'I';
  // des plans variés (mais cohérents) : un couloir en I, en peigne, en boucle autour d'un patio, en H, en Z…
  if (!S.stairs && S.holdMix) {
    tpl = R.p(S.big ? ['I', 'comb', 'comb'] : ['I', 'comb', 'ring', 'ring', 'H', 'Z', 'Z']);
    const t = indoorTemplate(R, S, W, H, tpl);
    if (t) { cors.push(...t.cors); leaves.push(...t.pre); cy = t.cy; vx = t.vx; up = t.up; decompose(W, H, cors.concat(t.pre)).forEach(r => regions.push(r)); }
    else tpl = 'I';
  }
  const lowY = cy + 4, lowH = H - 1 - lowY;
  if (tpl === 'I') cors.push({ x: 1, y: cy, w: W - 2, h: 3 });
  if (tpl !== 'I') { }
  else if (R.ch(S.vcor) && lowH >= 6) {
    vx = R.i(Math.floor(W * 0.3), Math.floor(W * 0.62));
    cors.push({ x: vx, y: cy + 3, w: 3, h: H - 1 - (cy + 3) });
    regions.push({ x: 1, y: lowY, w: vx - 2, h: lowH }, { x: vx + 4, y: lowY, w: W - vx - 5, h: lowH });
  } else regions.push({ x: 1, y: lowY, w: W - 2, h: lowH });
  // bande du haut (avec la grande salle éventuelle)
  if (tpl !== 'I') { }
  else if (S.stairs) {
    const sw = 5;
    leaves.push({ x: 1, y: 1, w: sw, h: up, def: { n: 'Escalier A', fs: FS.CHECK, f: 'stairroom', stair: 'A' } });
    leaves.push({ x: W - 1 - sw, y: 1, w: sw, h: up, def: { n: 'Escalier B', fs: FS.CHECK, f: 'stairroom', stair: 'B' } });
    regions.push({ x: sw + 2, y: 1, w: W - 2 * sw - 4, h: up });
  } else if (S.big) {
    const bw = R.i(S.big.w[0], S.big.w[1]), left = R.ch(0.5);
    const big = { x: left ? 1 : W - 1 - bw, y: 1, w: bw, h: up, def: S.big };
    leaves.push(big);
    regions.push(left ? { x: bw + 2, y: 1, w: W - bw - 3, h: up } : { x: 1, y: 1, w: W - bw - 3, h: up });
  } else regions.push({ x: 1, y: 1, w: W - 2, h: up });
  const bsp = (r, d) => {
    const canV = r.w >= 2 * S.minW + 1, canH = r.h >= 2 * S.minH + 1, wantV = r.w > S.maxW, wantH = r.h > S.maxH;
    let split = null;
    if (wantV && canV && (!(wantH && canH) || r.w / S.maxW >= r.h / S.maxH)) split = 'v';
    else if (wantH && canH) split = 'h';
    else if (d < 2 && canV && R.ch(0.25)) split = 'v';
    if (!split) { leaves.push(r); return; }
    if (split === 'v') { const s = R.i(S.minW, r.w - S.minW - 1); bsp({ x: r.x, y: r.y, w: s, h: r.h }, d + 1); bsp({ x: r.x + s + 1, y: r.y, w: r.w - s - 1, h: r.h }, d + 1); }
    else { const s = R.i(S.minH, r.h - S.minH - 1); bsp({ x: r.x, y: r.y, w: r.w, h: s }, d + 1); bsp({ x: r.x, y: r.y + s + 1, w: r.w, h: r.h - s - 1 }, d + 1); }
  };
  regions.forEach(r => { if (r.w >= 3 && r.h >= 3) bsp(r, 0); });
  // propriétaires des cases : -2 couloir, i pièce
  const own = new Int16Array(W * H).fill(-1);
  cors.forEach(c => { for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) own[y * W + x] = -2; });
  leaves.forEach((r, i) => { r.i = i; r.placed = []; r.seeds = []; r.doors = 0; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) own[y * W + x] = i; });
  // types de pièces
  const area = r => r.w * r.h, H1 = H - 1, W1 = W - 1;
  const tb = r => r.y === 1 || r.y + r.h === H1, side = r => r.x === 1 || r.x + r.w === W1;
  const pool = leaves.filter(r => !r.def);
  for (const d of S.rooms) {
    let c = pool.filter(r => r.w >= (d.minW || 4) && r.h >= (d.minH || 3) && (!d.hold || tb(r)) && (!d.small || tb(r) || side(r)));
    if (!c.length) c = pool.filter(r => (!d.hold || tb(r) || side(r)) && (!d.small || tb(r) || side(r)));
    if (!c.length) throw 'room ' + d.n;
    c.sort((a, b) => area(a) - area(b));
    const r = d.sz === 'big' ? c[c.length - 1] : d.sz === 'small' ? c[R.i(0, Math.min(1, c.length - 1))] : c[Math.min(c.length - 1, (c.length >> 1) + R.i(-1, 1) * (c.length > 2 ? 1 : 0))];
    r.def = d; pool.splice(pool.indexOf(r), 1);
  }
  const fills = R.sh(S.fill.slice()); let fi = 0;
  pool.sort((a, b) => area(b) - area(a)).forEach(r => { const d = fills[fi % fills.length]; r.def = fi >= fills.length ? Object.assign({}, d, { n: d.n + ' ' + (2 + Math.floor(fi / fills.length) - 1) }) : d; fi++; });
  // creuser
  cors.forEach(c => m.room('Couloir', c.x, c.y, c.w, c.h, S.corFs, false));
  leaves.forEach(r => m.room(r.def.n, r.x, r.y, r.w, r.h, r.def.fs, !r.def.noPatrol));
  // portes
  const doorAt = new Set(), cand = leaves.map(() => new Map());
  leaves.forEach((r, i) => {
    const addC = (x, y, ox, oy, ix, iy) => {
      if (x <= 0 || y <= 0 || x >= W1 || y >= H1 || m.get(x, y) !== K.WALL) return;
      const o = own[oy * W + ox]; if (o === -1 || o === i) return;
      if (!cand[i].has(o)) cand[i].set(o, []); cand[i].get(o).push({ x, y, ox, oy, ix, iy });
    };
    for (let x = r.x; x < r.x + r.w; x++) { addC(x, r.y - 1, x, r.y - 2, x, r.y); addC(x, r.y + r.h, x, r.y + r.h + 1, x, r.y + r.h - 1); }
    for (let y = r.y; y < r.y + r.h; y++) { addC(r.x - 1, y, r.x - 2, y, r.x, y); addC(r.x + r.w, y, r.x + r.w + 1, y, r.x + r.w - 1, y); }
  });
  const makeDoor = (i, c) => {
    if ([[0, 0], ...D4].some(([dx, dy]) => doorAt.has((c.y + dy) * W + c.x + dx))) return false;
    m.door(c.x, c.y); doorAt.add(c.y * W + c.x); g.hold(c.ix, c.iy); g.hold(c.ox, c.oy);
    leaves[i].seeds.push([c.ix, c.iy]); leaves[i].doors++;
    const o = own[c.oy * W + c.ox]; if (o >= 0) { leaves[o].seeds.push([c.ox, c.oy]); leaves[o].doors++; }
    return true;
  };
  const tryDoor = (i, o) => { const list = R.sh((cand[i].get(o) || []).slice()); for (const c of list) if (makeDoor(i, c)) return true; return false; };
  const conn = new Set();
  leaves.forEach((r, i) => {
    if (!cand[i].has(-2)) return;
    if (tryDoor(i, -2)) { conn.add(i); if (r.w >= 11 && R.ch(0.5)) tryDoor(i, -2); }
  });
  for (let changed = true; changed;) {
    changed = false;
    leaves.forEach((r, i) => { if (conn.has(i)) return; for (const o of R.sh([...cand[i].keys()])) if (o >= 0 && conn.has(o) && tryDoor(i, o)) { conn.add(i); changed = true; break; } });
  }
  if (conn.size < leaves.length) throw 'unconnected';
  leaves.forEach((r, i) => { for (const o of cand[i].keys()) if (o > i && R.ch(0.18)) tryDoor(i, o); });
  // sorties, clés
  const find = n => leaves.find(r => r.def.n === n);
  const exits = [];
  const perimCands = (r, prefBottom) => {
    const c = [];
    if (r.y === 1) for (let x = r.x + 1; x < r.x + r.w - 1; x++) c.push({ x, y: 0, ix: x, iy: 1, s: 't' });
    if (r.y + r.h === H1) for (let x = r.x + 1; x < r.x + r.w - 1; x++) c.push({ x, y: H1, ix: x, iy: H1 - 1, s: 'b' });
    if (r.x === 1) for (let y = r.y + 1; y < r.y + r.h - 1; y++) c.push({ x: 0, y, ix: 1, iy: y, s: 'l' });
    if (r.x + r.w === W1) for (let y = r.y + 1; y < r.y + r.h - 1; y++) c.push({ x: W1, y, ix: W1 - 1, iy: y, s: 'r' });
    const ok = c.filter(p => g.free(p.ix, p.iy));
    const tbOnly = ok.filter(p => p.s === 't' || p.s === 'b'); const bot = ok.filter(p => p.s === 'b');
    return prefBottom && bot.length ? bot : tbOnly.length ? tbOnly : ok;
  };
  const holdR = leaves.find(r => r.def.hold), smallR = leaves.find(r => r.def.small);
  // les bouts de couloir qui touchent le mur extérieur (en haut ou en bas) : parfait pour une issue de secours
  const corEnds = []; cors.forEach(c => { if (c.w !== 3) return; if (c.y + c.h === H1) corEnds.push({ x: c.x + 1, y: H1, ix: c.x + 1, iy: H1 - 1, s: 'b' }); if (c.y === 1) corEnds.push({ x: c.x + 1, y: 0, ix: c.x + 1, iy: 1, s: 't' }); });
  const placeHold = (kind, r, preferCor) => {
    const H0 = HOLD_KINDS[kind]; let p = null, where = r ? r.def.n : '';
    const far = q => !exits.some(e => e.x != null && Math.abs(e.x - q.x) + Math.abs(e.y - q.y) < 4);
    if (kind === 'door' && (preferCor || !r)) { const c = corEnds.filter(e => g.free(e.ix, e.iy) && m.get(e.x, e.y) === K.WALL && far(e)); if (c.length) { p = R.p(c); where = '@cor'; } }
    if (!p && r) { const c = perimCands(r, H0.bottom).filter(q => (q.s === 't' || q.s === 'b') && m.get(q.x, q.y) === K.WALL && far(q)); if (c.length) p = R.p(c); }
    if (!p) return false;
    m.put(p.x, p.y, H0.kind); g.hold(p.ix, p.iy); exits.push(Object.assign({ type: 'hold', x: p.x, y: p.y, where }, H0)); return true;
  };
  let hold2 = null;
  if (!S.noExits && S.holdMix) {
    let u = R.f(), k1 = S.holdMix[0][0]; for (const [k, pr] of S.holdMix) { if (u < pr) { k1 = k; break; } u -= pr; }
    if (!placeHold(k1, holdR, R.ch(0.5)) && !placeHold('door', holdR, true)) throw 'hold';
    // parfois une deuxième sortie « à tenir » d'un autre genre
    if (R.ch(0.4)) hold2 = k1 === 'win' ? 'door' : k1 === 'door' ? 'win' : R.p(['door', 'win']);
  } else if (!S.noExits) { const c = perimCands(holdR, S.hold.bottom); if (!c.length) throw 'hold'; const p = R.p(c); m.put(p.x, p.y, S.hold.kind); g.hold(p.ix, p.iy); exits.push(Object.assign({ type: 'hold', x: p.x, y: p.y }, S.hold)); }
  if (!S.noExits) { const c = perimCands(smallR, false).filter(p => m.get(p.x, p.y) === K.WALL); if (!c.length) throw 'small'; const p = R.p(c); m.put(p.x, p.y, K.X_HOLE); g.hold(p.ix, p.iy); exits.push(Object.assign({ type: 'small', x: p.x, y: p.y }, S.small)); }
  if (hold2) {
    const bad = r => r === holdR || r === smallR || S.start.includes(r.def.n) || r.def.n === S.teacher || r.def.patio;
    const c = R.sh(leaves.filter(r => !bad(r) && tb(r)));
    let ok = hold2 === 'door' && placeHold('door', null, true);
    for (const r of c) { if (ok) break; ok = placeHold(hold2, r, false); }
  }
  const keysR = find(S.keys); if (!keysR) throw 'keys';
  let keyPt = null;
  { const xs = []; for (let x = keysR.x; x < keysR.x + keysR.w; x++) if (g.wall(x, keysR.y - 1) && g.free(x, keysR.y)) xs.push(x); if (!xs.length) throw 'keyspot'; const x = R.ch(0.5) ? xs[xs.length - 1] : xs[0]; keyPt = [x, keysR.y]; g.hold(x, keysR.y); m.dec(x, keysR.y - 1, 'keys'); }
  // meubler
  leaves.forEach(r => { FURN[r.def.f](g, r, r.def.o); g.repair(r); });
  // casiers encastrés et déco des couloirs
  const decAt = new Set(); m.decor.forEach(d => { for (let i = 0; i < (d.w || 1); i++) decAt.add(d.y * W + d.x + i); });
  const lockerRun = (pts) => { let run = 0; pts.forEach(([x, y, cx, cy]) => {
    const okp = !decAt.has(y * W + x) && m.get(x, y) === K.WALL && m.get(cx, cy) === K.FLOOR && ![[0, 0], ...D4, [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => m.get(x + dx, y + dy) === K.DOOR || m.get(x + dx, y + dy) > 29);
    if (!okp) { run = 0; return; }
    if (run > 0) { m.set(x, y, K.LOCKER); run--; } else if (R.ch(0.16)) { run = R.i(1, 4); m.set(x, y, K.LOCKER); }
  }); };
  if (tpl === 'I') {
    { const p1 = [], p2 = []; for (let x = 2; x < W - 2; x++) { p1.push([x, cy - 1, x, cy]); p2.push([x, cy + 3, x, cy + 2]); } lockerRun(p1); lockerRun(p2); }
    if (vx > 0) { const a = [], b = []; for (let y = cy + 5; y < H - 2; y++) { a.push([vx - 1, y, vx, y]); b.push([vx + 3, y, vx + 2, y]); } lockerRun(a); lockerRun(b); }
    for (let x = 3; x < W - 3; x += R.i(5, 9)) if (m.get(x, cy - 1) === K.WALL && m.get(x - 1, cy - 1) !== K.DOOR && m.get(x + 1, cy - 1) !== K.DOOR) m.dec(x, cy - 1, R.p(['poster', 'clock', 'poster']));
    [[1, cy], [W - 2, cy + 2]].forEach(([x, y]) => { if (g.free(x, y) && R.ch(0.7)) m.set(x, y, R.p([K.PLANT, K.TRASH])); });
  } else cors.forEach(c => {
    if (c.h === 3 && c.w > 3) {
      const p1 = [], p2 = []; for (let x = c.x + 1; x < c.x + c.w - 1; x++) { p1.push([x, c.y - 1, x, c.y]); p2.push([x, c.y + 3, x, c.y + 2]); } lockerRun(p1); lockerRun(p2);
      for (let x = c.x + 2; x < c.x + c.w - 2; x += R.i(5, 9)) if (m.get(x, c.y - 1) === K.WALL && m.get(x, c.y) === K.FLOOR && m.get(x - 1, c.y - 1) !== K.DOOR && m.get(x + 1, c.y - 1) !== K.DOOR && !m.decor.some(d => d.y === c.y - 1 && x >= d.x - 1 && x <= d.x + (d.w || 1))) m.dec(x, c.y - 1, R.p(['poster', 'clock', 'poster']));
      [[c.x, c.y + R.i(0, 2)], [c.x + c.w - 1, c.y + R.i(0, 2)]].forEach(([x, y]) => { if (m.get(x - 1, y) === K.WALL && m.get(x + 1, y) === K.WALL) return; if ((x === 1 || x === W - 2) && g.free(x, y) && R.ch(0.6)) m.set(x, y, R.p([K.PLANT, K.TRASH])); });
    } else {
      const a = [], b = []; for (let y = c.y + 2; y < c.y + c.h - 1; y++) { a.push([c.x - 1, y, c.x, y]); b.push([c.x + 3, y, c.x + 2, y]); } lockerRun(a); lockerRun(b);
    }
  });
  // des fenêtres partout sur les murs extérieurs (la seule qui s'ouvre est entrouverte, avec son rideau qui vole)
  {
    const nearExit = (x, y) => [[0, 0], [1, 0], [-1, 0], [2, 0], [-2, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.get(x + dx, y + dy) > 29);
    const hasDec = (x, y) => m.decor.some(d => d.y === y && x >= d.x - 1 && x <= d.x + (d.w || 1));
    for (let x = 2; x < W - 2; x++) if (m.get(x, 0) === K.WALL && m.get(x, 1) === K.FLOOR && !nearExit(x, 0) && !hasDec(x, 0) && R.ch(0.5)) m.dec(x, 0, 'window');
    let lastB = -9; for (let x = 2; x < W - 2; x++) if (m.get(x, H1) === K.WALL && !isWallish(m.get(x, H1 - 1)) && m.get(x, H1 - 1) !== K.DOOR && !nearExit(x, H1) && x - lastB > 2 && R.ch(0.45)) { m.dec(x, H1, 'winb', { o: 'b' }); lastB = x; }
    [[0, 1, 'l'], [W1, W1 - 1, 'r']].forEach(([wx, ix, o]) => { let last = -9; for (let y = 2; y < H - 2; y++) if (m.get(wx, y) === K.WALL && !isWallish(m.get(ix, y)) && m.get(ix, y) !== K.DOOR && !nearExit(wx, y) && y - last > 2 && R.ch(0.4)) { m.dec(wx, y, 'winb', { o }); last = y; } });
  }
  // départ du prof et de l'élève
  const tR = S.teacher === '@corridor' ? { x: 2, y: cors[0].y, w: Math.max(3, cors[0].w - 2), h: 3 } : find(S.teacher); if (!tR) throw 'teacher';
  const freeIn = r => { const a = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR) a.push([x, y]); return a; };
  const tc = freeIn(tR); if (!tc.length) throw 'tstart';
  const tcx = tR.x + tR.w / 2, tcy = tR.y + tR.h / 2; tc.sort((a, b) => Math.hypot(a[0] - tcx, a[1] - tcy) - Math.hypot(b[0] - tcx, b[1] - tcy));
  const tStart = tc[0];
  const dist = bfs(m, tStart[0], tStart[1], (x, y) => passT(m, x, y));
  let start = null, bd = -1;
  const startRooms = leaves.filter(r => S.start.includes(r.def.n));
  (startRooms.length ? startRooms : leaves.filter(r => r !== tR)).forEach(r => freeIn(r).forEach(([x, y]) => { const d = dist[y * W + x]; if (d > bd && !g.keep.has(g.key(x, y))) { bd = d; start = [x, y]; } }));
  if (!start || bd < 18) { leaves.filter(r => r !== tR).forEach(r => freeIn(r).forEach(([x, y]) => { const d = dist[y * W + x]; if (d > bd) { bd = d; start = [x, y]; } })); }
  if (!start) throw 'start';
  // recherche (passage secret)
  let sc = [];
  if (!S.noExits) {
    if (S.search.any) leaves.forEach(r => (r.search || []).forEach(p => sc.push(p)));
    else { const sr = leaves.find(r => r.def.search); if (sr) sc = (sr.search || []).slice(); }
    sc = sc.filter(([x, y]) => S.search.kinds.includes(m.get(x, y)) || m.get(x, y) === K.WALL);
  }
  if (!S.noExits) { if (sc.length < 3) throw 'search'; exits.splice(1, 0, Object.assign({ type: 'search', cands: sc }, S.search)); }
  // rondes dans les couloirs
  const extraPatrol = [];
  if (tpl === 'I') {
    for (let x = 4; x < W - 3; x += 7) extraPatrol.push([x, cy + 1]);
    if (vx > 0) for (let y = cy + 6; y < H - 2; y += 6) extraPatrol.push([vx + 1, y]);
  } else cors.forEach(c => { if (c.h === 3 && c.w > 3) for (let x = c.x + 3; x < c.x + c.w - 2; x += 7) extraPatrol.push([x, c.y + 1]); else for (let y = c.y + 3; y < c.y + c.h - 1; y += 6) extraPatrol.push([c.x + 1, y]); });
  // les indices des sorties « à tenir » (fenêtre entrouverte, issue de secours, ascenseur), selon le plan du jour
  const holdHints = exits.filter(e => e.type === 'hold').map(e => {
    const w = e.where === '@cor' ? 'Au bout d’un couloir' : e.where || 'Quelque part';
    return e.kind === K.X_WINDOW ? '🪟 ' + w + ' : une fenêtre est restée entrouverte (son rideau vole au vent).' : e.kind === K.X_DOOR ? '🚨 ' + w + ' : une issue de secours… mais l’alarme va sonner !' : '🛗 ' + w + ' : l’ascenseur… s’il arrive à temps !';
  });
  const L = Object.assign({ m, start, tStart, keyPt, exits, extraPatrol, gen: true, rooms: leaves, cy, vx, W, H, tpl, cors, holdHints }, S.meta);
  L.tasks = S.tasks && S.tasks.length ? placeTasks(g, L, S.tasks) : [];
  L.g = g;
  return L;
}

// ---------- postes de tâches ----------
const TASK_ANCH = {
  pigeons: { k: [K.BENCH] }, craie: { fdec: 'marelle' }, toboggan: { k: [K.SLIDE] }, casquette: { k: [K.TRASH] }, cabane: { k: [K.CABANE] },
  chaussettes: { k: [K.LOCKER, K.BENCH], room: /Vestiaire|Terrain|Cour/ },
  tampon: { k: [K.DESK, K.COUNTER] }, photocopies: { k: [K.COPIER] }, coussin: { k: [K.SOFA, K.DESK] }, nounours: { k: [K.BED] },
  bisous: { wall: ['board'] }, vacances: { wall: ['board'] }, couleurs: { k: [K.SHELF, K.LOCKER] }, hamster: { k: [K.TABLE] }, plante: { k: [K.PLANT] },
  moustache: { wall: ['portrait', 'poster', 'frame', 'board'] }, sucre: { k: [K.MEET, K.COUNTER, K.SOFA] }, squelette: { k: [K.ARMOIRE], room: /Sciences/ },
  ballon: { k: [K.BALLBIN] }, pompes: { k: [K.MATS] }, chrono: { k: [K.DESK], room: /sport/ }, mousse: { k: [K.STALL], room: /Douches/ },
  chocolat: { k: [K.MEET, K.COUNTER, K.DESK] }
};
function placeTasks(g, L, ids) {
  const m = g.m, used = new Set(), out = [];
  const hasStand = (x, y) => m.get(x, y) === K.FLOOR || D4.some(([dx, dy]) => m.get(x + dx, y + dy) === K.FLOOR);
  ids.forEach(id => {
    const a = TASK_ANCH[id]; if (!a) return;
    let c = [];
    if (a.k) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (a.k.includes(m.get(x, y)) && hasStand(x, y)) c.push([x, y]);
    if (a.wall) m.decor.forEach(d => { if (!a.wall.includes(d.t)) return; for (let i = 0; i < (d.w || 1); i++) if (m.get(d.x + i, d.y) === K.WALL && m.get(d.x + i, d.y + 1) === K.FLOOR) c.push([d.x + i, d.y + 1]); });
    if (a.fdec) m.fdecor.forEach(d => { if (d.t === a.fdec && m.get(d.x, d.y + 1) === K.FLOOR) c.push([d.x, d.y + 1]); });
    if (a.floor) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.get(x, y) === K.FLOOR && a.floor.test(m.roomAt(x, y))) c.push([x, y]);
    if (a.room) { const f = c.filter(([x, y]) => a.room.test(m.roomAt(x, y) || m.roomAt(x, y + 1) || m.roomAt(x + 1, y) || m.roomAt(x - 1, y))); if (f.length) c = f; }
    c = c.filter(([x, y]) => !used.has(y * m.w + x) && !(L.keyPt && x === L.keyPt[0] && y === L.keyPt[1]));
    if (!c.length) return;
    const p = g.R.p(c); used.add(p[1] * m.w + p[0]); out.push([id, p[0], p[1]]);
  });
  return out;
}

// ---------- niveau 1 : la cour, en procédural ----------
function genYard(R) {
  const W = R.i(38, 44), H = R.i(30, 35), m = B(W, H, FS.ASPHALT, WS.BRICK), g = PG(R, m), T0 = 4;
  m.room('Cour de récré', 1, T0, W - 2, H - T0 - 1, FS.ASPHALT, false);
  for (let y = T0; y < H; y++) { m.set(0, y, K.FENCE); m.set(W - 1, y, K.FENCE); }
  for (let x = 0; x < W; x++) m.set(x, H - 1, K.FENCE);
  const gb = R.i(3, 5), gy = H - 1 - gb; m.style(1, gy, W - 2, gb, FS.GRASS);
  if (R.ch(0.6)) m.style(1, T0 + 8, 2, gy - T0 - 8, FS.GRASS);
  if (R.ch(0.6)) m.style(W - 3, T0 + 8, 2, gy - T0 - 8, FS.GRASS);
  const occ = new Uint8Array(W * H);
  const res = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) occ[j * W + i] = 1; };
  const clear = (x, y, w, h, pad) => { for (let j = y - pad; j < y + h + pad; j++) for (let i = x - pad; i < x + w + pad; i++) { if (i < 1 || j < T0 || i > W - 2 || j > H - 2) return false; if (occ[j * W + i]) return false; } for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.get(i, j) !== K.FLOOR) return false; return true; };
  const spot = (w, h, pad, y0, y1, tries = 80) => { for (let t = 0; t < tries; t++) { const x = R.i(2, W - 2 - w), y = R.i(y0, Math.max(y0, y1 - h)); if (clear(x, y, w, h, pad)) return [x, y]; } return null; };
  // bâtiments le long du collège
  const blocks = R.sh([{ t: 'preau', w: R.i(9, 12), h: R.i(6, 8) }, { t: 'wc', w: R.i(8, 9), h: R.i(6, 7) }, { t: 'loge', w: R.i(8, 9), h: R.i(6, 7) }]);
  let total = blocks.reduce((s, b) => s + b.w, 0); const room = W - 2;
  while (total > room - 6) { const p = blocks.find(b => b.t === 'preau'); if (p.w > 7) { p.w--; total--; } else break; }
  let free = room - total, x = 1; const gaps = [];
  for (let i = 0; i < 4; i++) { const v = i === 3 ? free : R.i(0, Math.max(0, Math.floor(free / 2))); gaps.push(v); free -= v; }
  let keyPt = null, loge = null, rooms = [];
  blocks.forEach((b, i) => {
    x += gaps[i]; b.x = x; x += b.w;
    if (b.t === 'preau') {
      m.room('Préau', b.x, T0, b.w, b.h, FS.PREAU);
      for (let px = b.x + 3; px < b.x + b.w - 1; px += 4) m.put(px, T0 + b.h - 1, K.PILLAR);
      m.row(b.x + 2, T0 + 2, 2, K.BENCH); if (b.w >= 10) m.row(b.x + 6, T0 + 2, 2, K.BENCH); m.put(b.x, T0 + b.h - 2, K.TRASH);
      res(b.x, T0, b.w, b.h + 1);
    } else {
      const wc = b.t === 'wc';
      m.fill(b.x, T0, b.w, b.h, K.WALL); m.wstyle(b.x, T0, b.w, b.h + 1, WS.PAINT);
      const r = { x: b.x + 1, y: T0 + 1, w: b.w - 2, h: b.h - 2, placed: [], seeds: [] };
      m.room(wc ? 'Toilettes' : 'Loge du surveillant', r.x, r.y, r.w, r.h, wc ? FS.TILE : FS.LINO);
      const dx = b.x + R.i(2, b.w - 3), dy = T0 + b.h - 1; m.door(dx, dy); g.hold(dx, dy - 1); g.hold(dx, dy + 1); r.seeds.push([dx, dy - 1]);
      if (wc) { for (let sx = r.x; sx < r.x + r.w; sx += 2) g.put(r, sx, r.y, K.STALL); g.dec(dx === b.x + 1 ? dx + 1 : b.x + 1, dy, 'sign', { col: '#3d7bff' }); }
      else {
        const kx = R.ch(0.5) ? r.x + r.w - 2 : r.x + 1; keyPt = [kx, r.y]; g.hold(kx, r.y); m.dec(kx, T0, 'keys');
        g.row(r, r.x + 1, r.y + 1, 2, K.DESK); g.put(r, kx === r.x + 1 ? r.x + r.w - 1 : r.x, r.y, K.ARMOIRE); g.put(r, r.x, r.y + r.h - 1, K.TRASH); g.put(r, r.x + r.w - 1, r.y + r.h - 1, K.PLANT);
        g.dec(dx === b.x + 1 ? dx + 1 : b.x + 1, dy, 'window'); loge = { dx, dy };
      }
      g.repair(r); rooms.push(r);
      res(b.x, T0, b.w, b.h + 2);
    }
  });
  // fenêtres du collège et grande porte
  const gapsX = []; for (let xx = 2; xx < W - 2; xx++) if (m.get(xx, T0) === K.FLOOR && !occ[T0 * W + xx]) gapsX.push(xx);
  for (let xx = 2; xx < W - 2; xx += 3) m.dec(xx, T0 - 1, 'window');
  if (gapsX.length) { const bx = R.p(gapsX); m.decor = m.decor.filter(d => !(d.y === T0 - 1 && d.x === bx)); m.dec(bx, T0 - 1, 'bigdoor'); m.gag(bx, T0 - 1, 'La grande porte du collège est fermée… et c’est le surveillant qui a la clé !'); }
  const yTop = T0 + 9;
  // portail et trou dans le grillage
  const gateLeft = R.ch(0.5), gyg = R.i(yTop + 2, gy - 3), hy = R.i(yTop + 2, gy - 3);
  const gxg = gateLeft ? 0 : W - 1, hx = gateLeft ? W - 1 : 0;
  m.put(gxg, gyg, K.X_GATE); m.put(hx, hy, K.X_HOLE);
  const gi = gateLeft ? 1 : W - 2, hi = gateLeft ? W - 2 : 1;
  res(Math.min(gi, gi) - 1, gyg - 2, 3, 5); res(hi - 1, hy - 2, 3, 5); g.hold(gi, gyg); g.hold(hi, hy);
  // terrain de basket, aire de jeux, marelle
  const cw = R.i(9, 11), ch = R.i(10, 12), cp = spot(cw, ch, 1, yTop, gy - 1);
  if (cp) { m.fdec(cp[0], cp[1], 'court', { w: cw, h: ch }); m.rooms.push({ name: 'Terrain de basket', x: cp[0], y: cp[1], w: cw, h: ch }); res(cp[0], cp[1], cw, ch); }
  const ap = spot(6, 7, 1, yTop - 2, gy - 1);
  if (!ap) throw 'aire';
  m.style(ap[0], ap[1], 6, 7, FS.SAND); m.rooms.push({ name: 'Aire de jeux', x: ap[0], y: ap[1], w: 6, h: 7 });
  m.put(ap[0] + 2, ap[1] + 1, K.SLIDE); m.put(ap[0] + 4, ap[1] + 4, K.CABANE); res(ap[0], ap[1], 6, 7);
  const mp = spot(1, 3, 1, yTop - 2, gy - 1); if (mp) { m.fdec(mp[0], mp[1], 'marelle'); res(mp[0], mp[1], 1, 3); }
  // buissons du fond (cachent le trou du grillage), haie sur le côté
  const cands = [];
  for (let k = 0, t = 0; k < 3 && t < 60; t++) { const bx = R.i(2, W - 6); if (!clear(bx, H - 2, 4, 1, 0)) continue; for (let i = 0; i < 4; i++) { m.put(bx + i, H - 2, K.BUSH); cands.push([bx + i, H - 2]); } res(bx - 1, H - 3, 6, 2); k++; }
  if (cands.length < 8) throw 'bushes';
  { const sx = gateLeft ? W - 2 : 1, sy = R.i(yTop, gy - 8); let n = 0; for (let y = sy; y < sy + 6; y++) if (clear(sx, y, 1, 1, 0) && Math.abs(y - hy) > 2) { m.put(sx, y, K.BUSH); n++; } }
  // vélos, arbres, bancs, poubelles
  { const p = spot(6, 1, 1, gy, gy + 1); if (p) { m.row(p[0], p[1], 6, K.BIKES); res(p[0], p[1], 6, 1); } }
  const trees = []; const nT = R.i(8, 11);
  for (let t = 0; t < 300 && trees.length < nT; t++) { const p = spot(1, 1, 1, yTop - 1, H - 2, 1); if (!p) continue; if (trees.some(q => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) < 5)) continue; m.put(p[0], p[1], K.TREE); res(p[0], p[1], 1, 1); trees.push(p); }
  for (let k = 0, n = R.i(4, 6); k < n; k++) { const p = spot(2, 1, 1, yTop - 1, gy); if (p) { m.row(p[0], p[1], 2, K.BENCH); res(p[0], p[1], 2, 1); } }
  for (let k = 0, n = R.i(2, 4); k < n; k++) { const p = spot(2, 1, 1, yTop, H - 3); if (p) { m.row(p[0], p[1], 2, K.BUSH); res(p[0], p[1], 2, 1); } }
  for (let k = 0; k < 4; k++) { const p = spot(1, 1, 1, yTop - 1, H - 2); if (p) { m.put(p[0], p[1], K.TRASH); res(p[0], p[1], 1, 1); } }
  if (!keyPt || !loge) throw 'loge';
  const tStart = [loge.dx, loge.dy + 2];
  const dist = bfs(m, tStart[0], tStart[1], (x, y) => passT(m, x, y));
  const far = []; let mx = 0;
  for (let y = T0; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (m.get(x, y) === K.FLOOR && m.fs[y * W + x] !== FS.GRASS && !m.roomAt(x, y).match(/Loge|Toilettes|Préau/)) { const d = dist[y * W + x]; if (d > mx) mx = d; far.push([x, y, d]); }
  const sp = far.filter(p => p[2] >= mx * 0.7); if (!sp.length) throw 'start';
  const s = R.p(sp), start = [s[0], s[1]];
  const extraPatrol = []; for (let y = T0 + 5; y < H - 2; y += 7) for (let xx = 5; xx < W - 3; xx += 8) extraPatrol.push([xx, y]);
  const L = {
    m, outdoor: true, start, tStart, keyPt, lockerCol: '#4f7fc0', extraPatrol, gen: true, kids: 10, robots: 10,
    exits: [
      { type: 'hold', x: gxg, y: gyg, label: 'Ouvrir le portail', icon: '🚧', time: 3, noise: 10, snd: 'creak', word: 'GRIIINC' },
      { type: 'search', cands, label: 'Fouiller le buisson', reveal: 'Un trou dans le grillage !', icon: '🌿' },
      { type: 'small', x: hx, y: hy, label: 'Se faufiler sous la grille', icon: '🐭' }
    ]
  };
  L.tasks = placeTasks(g, L, ['pigeons', 'craie', 'toboggan', 'casquette', 'cabane', 'chaussettes']);
  return L;
}

// ---------- vérification d'un plan généré ----------
function validateLevel(L) {
  const m = L.m, reach = L.reach, ok = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && reach[y * m.w + x] >= 0;
  if (m.get(L.start[0], L.start[1]) !== K.FLOOR) return 'start';
  if (!ok(L.tStart[0], L.tStart[1])) return 'tStart';
  if (!ok(L.keyPt[0], L.keyPt[1]) || m.get(L.keyPt[0], L.keyPt[1]) !== K.FLOOR) return 'keys';
  for (const d of m.doors) if (!ok(d.x, d.y)) return 'door';
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.get(x, y) === K.FLOOR && !ok(x, y)) return 'pocket ' + x + ',' + y;
  for (const e of L.exits) {
    if (e.type === 'search') { if (e.cands.length < 3) return 'search'; }
    else if (!e.from || !ok(e.from[0], e.from[1])) return 'exit ' + e.type;
  }
  if (L.taskPool.length < 3) return 'tasks';
  if (L.hides.length < 12) return 'hides';
  if (reach[L.tStart[1] * m.w + L.tStart[0]] < 16) return 'close';
  if (L.patrol.length < 4) return 'patrol';
  return null;
}
// l'étage des langues : comme les salles de classe, mais Miss Teacup règne sur la salle d'anglais
UNIVERSES[6] = Object.assign({}, UNIVERSES[3], {
  teacher: 'Salle 105 · Anglais',
  rooms: UNIVERSES[3].rooms.map(r => r.n === 'Salle 101 · Français' ? Object.assign({}, r, { n: 'Salle 105 · Anglais' }) : r),
  fill: UNIVERSES[3].fill.map(r => r.n === 'Salle 105 · Anglais' ? Object.assign({}, r, { n: 'Salle 101 · Français' }) : r)
});
// l'étage d'histoire-géo : M. Silex règne sur la salle d'histoire
UNIVERSES[7] = Object.assign({}, UNIVERSES[3], {
  teacher: 'Salle 103 · Histoire',
  rooms: UNIVERSES[3].rooms.map(r => r.n === 'Salle 101 · Français' ? Object.assign({}, r, { n: 'Salle 103 · Histoire' }) : r),
  fill: UNIVERSES[3].fill.map(r => r.n === 'Salle 103 · Histoire' ? Object.assign({}, r, { n: 'Salle 101 · Français' }) : r)
});
const PROC_GENS = [genYard, R => genIndoor(R, UNIVERSES[2]), R => genIndoor(R, UNIVERSES[3]), R => genIndoor(R, UNIVERSES[6]), R => genIndoor(R, UNIVERSES[7]), R => genIndoor(R, UNIVERSES[4]), R => genIndoor(R, UNIVERSES[5])];
function buildProcLevel(idx, seed) {
  let why = '';
  for (let a = 0; a < 40; a++) {
    try {
      const L = finalizeLevel(PROC_GENS[idx](mkRng((seed + a * 9973) >>> 0)));
      const w = validateLevel(L);
      if (!w) { L.seed = seed; L.tries = a; return L; }
      why = w;
    } catch (e) { why = String(e && e.message || e); }
  }
  console.warn('génération impossible', idx, seed, why);
  return null;
}
const newSeed = () => (Math.random() * 4294967295) >>> 0;

// ================= MODE INFILTRATION : les étages =================
const INF_FLOOR_META = [
  { name: 'Rez-de-chaussée', short: 'RDC', prof: 0 },
  { name: '1er étage', short: '1er', prof: 6, profMulti: 1, ws: WS.GREEN, fs: FS.LINO, corFs: FS.CHECK, lockerCol: '#e07a3a', sofaCol: '#3d7bff' },
  { name: '2e étage', short: '2e', prof: 5, profMulti: 2, ws: WS.PAINT, fs: FS.WOOD, corFs: FS.CHECK, lockerCol: '#d94a5a', sofaCol: '#7b45a8' },
  { name: '3e étage', short: '3e', prof: 4, ws: WS.BLUE, fs: FS.WOOD, corFs: FS.LINO, lockerCol: '#3fae8e', sofaCol: '#e0249a' }
];
const INF_SUBJECTS = ['Français', 'Maths', 'Histoire-géo', 'Anglais', 'Espagnol', 'SVT', 'Physique', 'Musique', 'Arts plastiques', 'Techno', 'Latin', 'Allemand'];
function infSpec(f, top, R) {
  const meta = INF_FLOOR_META[f], subj = R.sh(INF_SUBJECTS.slice()); let n = 1;
  const cls = s => ({ n: 'Salle ' + f + '0' + (n++) + ' · ' + s, fs: R.ch(0.7) ? FS.WOOD : FS.LINO, f: 'classroom', cls: 1, noPatrol: 1 });
  const rooms = [{ n: 'Salle des profs', fs: FS.OFFICE, f: 'staff', sz: 'mid', minW: 7, staff: 1 }, { n: 'Toilettes', fs: FS.TILE, f: 'toilets', sz: 'small' }];
  if (top) rooms.unshift(Object.assign(cls(subj[0]), { sz: 'big', minW: 8, minH: 7, startCls: 1 }));
  const fill = [];
  for (let i = top ? 1 : 0; i < 8; i++) fill.push(cls(subj[i % subj.length]));
  fill.splice(2, 0, f === 2 ? { n: 'CDI', fs: FS.CARPET, f: 'cdi', cdi: 1 } : { n: 'Salle d’étude', fs: FS.WOOD, f: 'permanence', cls: 1, noPatrol: 1 });
  fill.splice(5, 0, { n: 'Local ménage', fs: FS.TILE, f: 'cleaning' }, { n: 'Réserve', fs: FS.LINO, f: 'storage' });
  return {
    w: [40, 44], h: [27, 30], fs: meta.fs, ws: meta.ws, corFs: meta.corFs, up: [8, 9], vcor: 0.65, minW: 6, maxW: 12, minH: 5, maxH: 10,
    stairs: true, noExits: true, teacher: '@corridor', keys: 'Salle des profs', start: [], rooms, fill, tasks: [],
    meta: { lockerCol: meta.lockerCol, sofaCol: meta.sofaCol, binders: f === 1 }
  };
}
// places assises (sous les tables) d'une salle de classe
function classSeats(m, r) {
  const out = [];
  for (let y = r.y; y < r.y + r.h - 1; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.TABLE && m.get(x, y + 1) === K.FLOOR) out.push([x, y + 1]);
  return out;
}
function genInfFloor(R, f, top) {
  const S = infSpec(f, top, R), L = genIndoor(R, S), m = L.m, g = L.g;
  L.floor = f;
  const A = L.rooms.find(r => r.def.stair === 'A'), B = L.rooms.find(r => r.def.stair === 'B');
  if (!A || !B || !A.stairPt || !B.stairPt) throw 'stairs';
  L.stairs = { A: A.stairPt, B: B.stairPt };
  [A, B].forEach(r => g.dec(r.x + 2, r.y - 1, 'stairsign'));
  // bouton d'alarme et plan d'évacuation sur le mur du haut du couloir
  const wallSpots = [];
  for (let x = 3; x < L.W - 3; x++) { const y = L.cy - 1; if (m.get(x, y) === K.WALL && m.get(x, y + 1) === K.FLOOR && !m.decor.some(d => d.y === y && x >= d.x && x < d.x + (d.w || 1)) && m.get(x - 1, y) !== K.DOOR && m.get(x + 1, y) !== K.DOOR) wallSpots.push(x); }
  if (wallSpots.length < 4) throw 'wall';
  R.sh(wallSpots);
  const ax = wallSpots[0]; m.dec(ax, L.cy - 1, 'alarm'); L.alarmPt = [ax, L.cy];
  const px = wallSpots.find(x => Math.abs(x - ax) > 6) || wallSpots[1]; L.planWall = [px, L.cy - 1]; L.planPt = [px, L.cy];
  // salles de classe : profs et élèves
  L.classes = L.rooms.filter(r => r.def.cls).map(r => ({ r, seats: classSeats(m, r), start: !!r.def.startCls }));
  L.startCls = L.classes.find(c => c.start) || null;
  if (top && (!L.startCls || L.startCls.seats.length < 4)) throw 'startcls';
  L.staffRoom = L.rooms.find(r => r.def.staff);
  L.cdi = L.rooms.find(r => r.def.cdi) || null;
  // bureaux de prof (où peut être caché le trousseau)
  L.desks = [];
  L.rooms.forEach(r => { if (r.def.startCls || !(r.def.cls || r.def.staff)) return; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.DESK && D4.some(([dx, dy]) => m.get(x + dx, y + dy) === K.FLOOR)) L.desks.push([x, y]); });
  if (!L.desks.length) throw 'desks';
  return L;
}
// rez-de-chaussée : hall d'entrée + cour
function genInfRDC(R) {
  const W = R.i(40, 44), H = R.i(32, 35), m = B(W, H, FS.ASPHALT, WS.BRICK), g = PG(R, m), T0 = 7;
  m.room('Hall d’entrée', 1, 1, W - 2, 5, FS.CHECK, true);
  m.room('Cour de récré', 1, T0, W - 2, H - T0 - 1, FS.ASPHALT, false);
  for (let y = T0; y < H; y++) { m.set(0, y, K.FENCE); m.set(W - 1, y, K.FENCE); }
  for (let x = 0; x < W; x++) m.set(x, H - 1, K.FENCE);
  const gb = R.i(3, 4), gy = H - 1 - gb; m.style(1, gy, W - 2, gb, FS.GRASS);
  // escaliers dans le hall
  const hall = { x: 1, y: 1, w: W - 2, h: 5, placed: [], seeds: [] };
  const stA = [3, 2], stB = [W - 4, 2];
  [[2, 1], [W - 5, 1]].forEach(([x, y]) => { for (let j = y; j < y + 3; j++) for (let i = x; i < x + 3; i++) g.hold(i, j); m.fdec(x, y, 'stairs', { w: 3, h: 3 }); g.dec(x + 1, 0, 'stairsign'); });
  const occ = new Uint8Array(W * H);
  const res = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) occ[j * W + i] = 1; };
  const clear = (x, y, w, h, pad) => { for (let j = y - pad; j < y + h + pad; j++) for (let i = x - pad; i < x + w + pad; i++) { if (i < 1 || j < T0 || i > W - 2 || j > H - 2) return false; if (occ[j * W + i]) return false; } for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.get(i, j) !== K.FLOOR) return false; return true; };
  const spot = (w, h, pad, y0, y1, tries = 80) => { for (let t = 0; t < tries; t++) { const x = R.i(2, W - 2 - w), y = R.i(y0, Math.max(y0, y1 - h)); if (clear(x, y, w, h, pad)) return [x, y]; } return null; };
  // loge du surveillant et préau, accolés au bâtiment
  const blocks = R.sh([{ t: 'preau', w: R.i(8, 11), h: R.i(5, 7) }, { t: 'loge', w: R.i(7, 8), h: R.i(6, 7) }]);
  let x = R.i(4, 8); let keyPt = null, loge = null;
  blocks.forEach(b => {
    b.x = x; x += b.w + R.i(5, 9);
    if (b.t === 'preau') {
      m.room('Préau', b.x, T0, b.w, b.h, FS.PREAU);
      for (let px = b.x + 3; px < b.x + b.w - 1; px += 4) m.put(px, T0 + b.h - 1, K.PILLAR);
      m.row(b.x + 2, T0 + 2, 2, K.BENCH); m.put(b.x, T0 + b.h - 2, K.TRASH); res(b.x, T0, b.w, b.h + 1);
    } else {
      m.fill(b.x, T0, b.w, b.h, K.WALL); m.wstyle(b.x, T0, b.w, b.h + 1, WS.PAINT);
      const r = { x: b.x + 1, y: T0 + 1, w: b.w - 2, h: b.h - 2, placed: [], seeds: [] };
      m.room('Loge du surveillant', r.x, r.y, r.w, r.h, FS.LINO);
      const dx = b.x + R.i(2, b.w - 3), dy = T0 + b.h - 1; m.door(dx, dy); g.hold(dx, dy - 1); g.hold(dx, dy + 1); r.seeds.push([dx, dy - 1]);
      const kx = r.x + 1; keyPt = [kx, r.y]; g.hold(kx, r.y); m.dec(kx, T0, 'keys');
      g.row(r, r.x + 2, r.y + 1, 2, K.DESK); g.put(r, r.x + r.w - 1, r.y, K.ARMOIRE); g.put(r, r.x, r.y + r.h - 1, K.TRASH); g.put(r, r.x + r.w - 1, r.y + r.h - 1, K.PLANT);
      g.dec(dx === b.x + 1 ? dx + 1 : b.x + 1, dy, 'window'); loge = { dx, dy };
      g.repair(r); res(b.x, T0, b.w, b.h + 2);
    }
  });
  if (x > W - 2) throw 'blocks';
  // portes du hall vers la cour
  const doorXs = []; for (let xx = 3; xx < W - 3; xx++) if (m.get(xx, T0) === K.FLOOR && !occ[T0 * W + xx] && m.get(xx, T0 - 1) === K.WALL) doorXs.push(xx);
  R.sh(doorXs); const doors = [];
  for (const dx of doorXs) { if (doors.length >= 3) break; if (doors.some(d => Math.abs(d - dx) < 6)) continue; m.door(dx, T0 - 1); doors.push(dx); g.hold(dx, T0 - 2); g.hold(dx, T0); hall.seeds.push([dx, T0 - 2]); res(dx - 1, T0, 3, 2); }
  if (doors.length < 2) throw 'halldoors';
  for (let xx = 2; xx < W - 2; xx += 3) if (m.get(xx, T0 - 1) === K.WALL && m.get(xx - 1, T0 - 1) !== K.DOOR && m.get(xx + 1, T0 - 1) !== K.DOOR) m.dec(xx, T0 - 1, 'window');
  // meubles du hall
  const cx = W >> 1; g.row(hall, cx - 2, 2, 4, K.COUNTER); g.put(hall, cx - 1, 1, K.PLANT);
  g.row(hall, 8, 4, 2, K.BENCH); g.row(hall, W - 10, 4, 2, K.BENCH); g.put(hall, 6, 1, K.SHELF); g.put(hall, W - 7, 1, K.SHELF); g.put(hall, 1, 5, K.PLANT); g.put(hall, W - 2, 5, K.PLANT);
  g.repair(hall);
  // portail, trou du grillage
  const yTop = T0 + 8, gateLeft = R.ch(0.5), gyg = R.i(yTop, gy - 3), hy = R.i(yTop, gy - 3);
  const gxg = gateLeft ? 0 : W - 1, hx = gateLeft ? W - 1 : 0, gi = gateLeft ? 1 : W - 2, hi = gateLeft ? W - 2 : 1;
  m.put(gxg, gyg, K.X_GATE); m.put(hx, hy, K.X_HOLE); res(gi - 1, gyg - 2, 3, 5); res(hi - 1, hy - 2, 3, 5); g.hold(gi, gyg); g.hold(hi, hy);
  // point de rassemblement
  const aw = R.i(10, 12), ah = 5, ap = spot(aw, ah, 1, T0 + 4, gy - 1, 200);
  if (!ap) throw 'assembly';
  m.fdec(ap[0], ap[1], 'assembly', { w: aw, h: ah }); m.rooms.push({ name: 'Point de rassemblement', x: ap[0], y: ap[1], w: aw, h: ah }); res(ap[0] - 1, ap[1] - 2, aw + 2, ah + 5);
  // basket, aire de jeux, buissons
  const cw = R.i(8, 10), chh = R.i(9, 11), cp = spot(cw, chh, 1, yTop, gy - 1);
  if (cp) { m.fdec(cp[0], cp[1], 'court', { w: cw, h: chh }); m.rooms.push({ name: 'Terrain de basket', x: cp[0], y: cp[1], w: cw, h: chh }); res(cp[0], cp[1], cw, chh); }
  const pl = spot(6, 7, 1, yTop - 2, gy - 1); if (pl) { m.style(pl[0], pl[1], 6, 7, FS.SAND); m.rooms.push({ name: 'Aire de jeux', x: pl[0], y: pl[1], w: 6, h: 7 }); m.put(pl[0] + 2, pl[1] + 1, K.SLIDE); m.put(pl[0] + 4, pl[1] + 4, K.CABANE); res(pl[0], pl[1], 6, 7); }
  const cands = [];
  for (let k = 0, t = 0; k < 3 && t < 60; t++) { const bx = R.i(2, W - 6); if (!clear(bx, H - 2, 4, 1, 0)) continue; for (let i = 0; i < 4; i++) { m.put(bx + i, H - 2, K.BUSH); cands.push([bx + i, H - 2]); } res(bx - 1, H - 3, 6, 2); k++; }
  if (cands.length < 8) throw 'bushes';
  const trees = []; const nT = R.i(7, 10);
  for (let t = 0; t < 300 && trees.length < nT; t++) { const p = spot(1, 1, 1, yTop - 1, H - 2, 1); if (!p) continue; if (trees.some(q => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) < 5)) continue; m.put(p[0], p[1], K.TREE); res(p[0], p[1], 1, 1); trees.push(p); }
  for (let k = 0, n = R.i(3, 5); k < n; k++) { const p = spot(2, 1, 1, yTop - 1, gy); if (p) { m.row(p[0], p[1], 2, K.BENCH); res(p[0], p[1], 2, 1); } }
  for (let k = 0, n = R.i(2, 4); k < n; k++) { const p = spot(2, 1, 1, yTop, H - 3); if (p) { m.row(p[0], p[1], 2, K.BUSH); res(p[0], p[1], 2, 1); } }
  for (let k = 0; k < 3; k++) { const p = spot(1, 1, 1, yTop - 1, H - 2); if (p) { m.put(p[0], p[1], K.TRASH); res(p[0], p[1], 1, 1); } }
  { const p = spot(6, 1, 1, gy, gy + 1); if (p) m.row(p[0], p[1], 6, K.BIKES); }
  if (!keyPt || !loge) throw 'loge';
  const tStart = [loge.dx, loge.dy + 2];
  const extraPatrol = []; for (let y = T0 + 5; y < H - 2; y += 7) for (let xx = 5; xx < W - 3; xx += 8) extraPatrol.push([xx, y]);
  extraPatrol.push([cx, 3], [8, 3], [W - 9, 3]);
  const L = {
    m, outdoor: true, start: [cx, 4], tStart, keyPt, lockerCol: '#4f7fc0', extraPatrol, gen: true, floor: 0, W, H,
    stairs: { A: stA, B: stB }, assembly: { x: ap[0], y: ap[1], w: aw, h: ah },
    exits: [
      { type: 'hold', x: gxg, y: gyg, label: 'Ouvrir le portail', icon: '🚧', time: 3, noise: 10, snd: 'creak', word: 'GRIIINC', gate: true },
      { type: 'search', cands, label: 'Fouiller le buisson', reveal: 'Un trou dans le grillage !', icon: '🌿' },
      { type: 'small', x: hx, y: hy, label: 'Se faufiler sous la grille', icon: '🐭' }
    ], tasks: []
  };
  return L;
}
function validateInf(L, f) {
  const m = L.m, reach = L.reach, ok = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && reach[y * m.w + x] >= 0;
  if (!ok(L.tStart[0], L.tStart[1])) return 'tStart';
  if (!ok(L.keyPt[0], L.keyPt[1])) return 'keys';
  for (const d of m.doors) if (!ok(d.x, d.y)) return 'door';
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.get(x, y) === K.FLOOR && !ok(x, y)) return 'pocket';
  for (const s of ['A', 'B']) if (!ok(L.stairs[s][0], L.stairs[s][1])) return 'stair';
  if (f > 0) {
    if (!ok(L.alarmPt[0], L.alarmPt[1]) || !ok(L.planPt[0], L.planPt[1])) return 'alarm';
    if (L.startCls && !L.startCls.seats.every(([x, y]) => ok(x, y))) return 'seats';
  } else {
    for (const e of L.exits) { if (e.type === 'search') { if (e.cands.length < 3) return 'search'; } else if (!e.from || !ok(e.from[0], e.from[1])) return 'exit'; }
  }
  if (L.hides.length < 10) return 'hides';
  return null;
}
function buildInfFloor(f, top, seed) {
  let why = '';
  for (let a = 0; a < 40; a++) {
    try {
      const R = mkRng((seed + f * 7919 + a * 104729) >>> 0);
      const L = finalizeLevel(f === 0 ? genInfRDC(R) : genInfFloor(R, f, top));
      const w = validateInf(L, f);
      if (!w) { L.R = R; return L; }
      why = w;
    } catch (e) { why = String(e && e.message || e); }
  }
  throw new Error('étage ' + f + ' impossible : ' + why);
}
