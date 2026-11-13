// ================= CONSTRUCTION DES NIVEAUX =================
function B(w, h, fs, ws) {
  const m = { w, h, k: new Uint8Array(w * h).fill(K.WALL), fs: new Uint8Array(w * h).fill(fs), ws: new Uint8Array(w * h).fill(ws), decor: [], fdecor: [], rooms: [], doors: [], patrol: [], gags: [] };
  const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  m.get = (x, y) => inb(x, y) ? m.k[y * w + x] : K.WALL;
  m.set = (x, y, k) => { if (inb(x, y)) m.k[y * w + x] = k; };
  m.fill = (x, y, ww, hh, k) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) m.set(i, j, k); };
  m.floor = (x, y, ww, hh, f) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) { m.set(i, j, K.FLOOR); if (f != null && inb(i, j)) m.fs[j * w + i] = f; } };
  m.style = (x, y, ww, hh, f) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (inb(i, j)) m.fs[j * w + i] = f; };
  m.wstyle = (x, y, ww, hh, s) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (inb(i, j)) m.ws[j * w + i] = s; };
  m.room = (name, x, y, ww, hh, f, patrol = true) => { m.floor(x, y, ww, hh, f); m.rooms.push({ name, x, y, w: ww, h: hh }); if (patrol) m.patrol.push([x + (ww >> 1), y + (hh >> 1)]); };
  m.door = (x, y) => { m.set(x, y, K.DOOR); m.doors.push({ x, y }); };
  m.put = (x, y, k) => m.set(x, y, k);
  m.row = (x, y, n, k) => { for (let i = 0; i < n; i++) m.set(x + i, y, k); };
  m.col = (x, y, n, k) => { for (let i = 0; i < n; i++) m.set(x, y + i, k); };
  m.dec = (x, y, t, o) => m.decor.push(Object.assign({ x, y, t }, o || {}));
  m.fdec = (x, y, t, o) => m.fdecor.push(Object.assign({ x, y, t }, o || {}));
  m.gag = (x, y, text) => m.gags.push({ x, y, text });
  m.roomAt = (x, y) => { for (let i = m.rooms.length - 1; i >= 0; i--) { const r = m.rooms[i]; if (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) return r.name; } return ''; };
  return m;
}
function lockersAt(m, y, xs) { xs.forEach(x => m.put(x, y, K.LOCKER)); }

// ---------- Niveau 1 : la cour de récré ----------
function buildL1() {
  const m = B(40, 34, FS.ASPHALT, WS.BRICK);
  m.room('Cour de récré', 1, 4, 38, 29, FS.ASPHALT, false);
  m.style(1, 28, 38, 5, FS.GRASS); m.style(1, 4, 2, 24, FS.GRASS); m.style(37, 12, 2, 16, FS.GRASS);
  for (let y = 4; y < 34; y++) { m.set(0, y, K.FENCE); m.set(39, y, K.FENCE); }
  for (let x = 0; x < 40; x++) m.set(x, 33, K.FENCE);
  for (let x = 2; x < 38; x += 3) if (x !== 26) m.dec(x, 3, 'window');
  m.dec(26, 3, 'bigdoor'); m.gag(26, 3, 'La grande porte du collège est fermée… et c’est le surveillant qui a la clé !');
  // préau
  m.room('Préau', 2, 4, 12, 8, FS.PREAU);
  [5, 9, 13].forEach(x => m.put(x, 11, K.PILLAR));
  m.row(4, 6, 2, K.BENCH); m.row(9, 6, 2, K.BENCH); m.put(2, 10, K.TRASH);
  // toilettes
  m.fill(15, 4, 9, 7, K.WALL); m.room('Toilettes', 16, 5, 7, 5, FS.TILE); m.door(19, 10);
  [16, 18, 20, 22].forEach(x => m.put(x, 5, K.STALL));
  m.wstyle(15, 4, 9, 7, WS.PAINT); m.dec(16, 10, 'sign', { col: '#3d7bff' });
  // loge du surveillant
  m.fill(29, 4, 9, 7, K.WALL); m.room('Loge du surveillant', 30, 5, 7, 5, FS.LINO); m.door(33, 10);
  m.wstyle(29, 4, 9, 7, WS.PAINT);
  m.dec(35, 4, 'keys'); m.put(31, 6, K.DESK); m.put(32, 6, K.DESK); m.put(36, 5, K.ARMOIRE); m.put(30, 9, K.TRASH); m.put(36, 9, K.PLANT);
  m.dec(31, 10, 'window');
  // aire de jeux
  m.style(24, 14, 6, 7, FS.SAND); m.rooms.push({ name: 'Aire de jeux', x: 24, y: 14, w: 6, h: 7 });
  m.put(26, 15, K.SLIDE); m.put(28, 18, K.CABANE);
  [[3, 21], [12, 27], [33, 15], [21, 27], [34, 26], [8, 30], [29, 30], [18, 19]].forEach(([x, y]) => m.put(x, y, K.TREE));
  m.fdec(4, 14, 'court', { w: 11, h: 12 }); m.rooms.push({ name: 'Terrain de basket', x: 4, y: 14, w: 11, h: 12 });
  m.fdec(20, 22, 'marelle');
  m.row(15, 13, 2, K.BENCH); m.row(31, 22, 2, K.BENCH); m.row(20, 31, 2, K.BENCH);
  [[14, 12], [23, 12], [36, 21], [3, 26]].forEach(([x, y]) => m.put(x, y, K.TRASH));
  const cands = [];
  [2, 14, 26].forEach(x0 => { for (let x = x0; x < x0 + 4; x++) { m.put(x, 32, K.BUSH); cands.push([x, 32]); } });
  for (let y = 13; y < 19; y++) m.put(38, y, K.BUSH);
  m.row(31, 28, 6, K.BIKES);
  m.put(39, 24, K.X_GATE); m.put(0, 20, K.X_HOLE);
  return {
    m, outdoor: true, start: [9, 19], tStart: [33, 12], keyPt: [35, 5], lockerCol: '#4f7fc0',
    extraPatrol: [[8, 9], [20, 14], [27, 23], [34, 20], [8, 27], [20, 29], [32, 30], [26, 8], [10, 20], [36, 12]],
    exits: [
      { type: 'hold', x: 39, y: 24, label: 'Ouvrir le portail', icon: '🚧', time: 3, noise: 10, snd: 'creak', word: 'GRIIINC' },
      { type: 'search', cands, label: 'Fouiller le buisson', reveal: 'Un trou dans le grillage !', icon: '🌿' },
      { type: 'small', x: 0, y: 20, label: 'Se faufiler sous la grille', icon: '🐭' }
    ],
    kids: 10
  };
}
// ---------- Niveau 2 : la vie scolaire ----------
function buildL2() {
  const m = B(36, 30, FS.LINO, WS.GREEN);
  m.room('Couloir', 1, 12, 34, 3, FS.CHECK, false);
  m.room('Bureau de la vie scolaire', 1, 1, 11, 10, FS.OFFICE);
  m.room('Salle de permanence', 13, 1, 12, 10, FS.WOOD);
  m.room('Infirmerie', 26, 1, 9, 10, FS.TILE);
  m.room('Salle de colle', 1, 16, 10, 13, FS.WOOD);
  m.room('Toilettes', 12, 16, 6, 7, FS.TILE);
  m.room('Réserve', 12, 24, 6, 5, FS.LINO);
  m.room('Couloir des casiers', 19, 15, 3, 14, FS.CHECK, false);
  m.room('Vestiaire', 23, 16, 12, 6, FS.LINO);
  m.room('Local ménage', 23, 23, 6, 6, FS.TILE);
  m.room('Escaliers', 30, 23, 5, 6, FS.CHECK);
  [[5, 11], [10, 11], [17, 11], [22, 11], [30, 11], [5, 15], [14, 15], [18, 26], [22, 18], [22, 25], [32, 22]].forEach(([x, y]) => m.door(x, y));
  // bureau vie scolaire
  m.row(1, 7, 8, K.COUNTER); m.row(3, 3, 2, K.DESK); m.row(7, 3, 2, K.DESK);
  const cands = []; for (let x = 2; x <= 7; x++) { m.put(x, 1, K.SHELF); cands.push([x, 1]); }
  m.put(11, 1, K.ARMOIRE); m.put(11, 5, K.COPIER); m.dec(10, 0, 'keys'); m.put(1, 10, K.PLANT); m.put(11, 9, K.TRASH);
  m.dec(2, 11, 'sign', { col: '#e0249a' });
  // permanence
  m.dec(16, 0, 'board', { w: 4 }); m.row(18, 2, 2, K.DESK);
  [5, 7, 9].forEach(y => [14, 15, 17, 18, 21, 22].forEach(x => m.put(x, y, K.TABLE)));
  m.put(24, 1, K.ARMOIRE); m.put(13, 10, K.TRASH); m.put(24, 10, K.PLANT); m.dec(23, 0, 'clock');
  // infirmerie
  [2, 5, 8].forEach(y => m.put(27, y, K.BED)); m.put(34, 1, K.ARMOIRE); m.put(34, 10, K.PLANT); m.row(32, 6, 2, K.DESK); m.put(26, 10, K.TRASH);
  m.put(31, 0, K.X_WINDOW); m.dec(28, 0, 'poster');
  // salle de colle
  m.dec(6, 15, 'board', { w: 3 }); m.row(4, 17, 2, K.DESK);
  [20, 22, 24, 26].forEach(y => [2, 3, 7, 8].forEach(x => m.put(x, y, K.TABLE)));
  m.put(10, 16, K.ARMOIRE); m.put(10, 28, K.TRASH); m.put(1, 28, K.PLANT); m.dec(2, 15, 'clock');
  // toilettes, réserve
  [12, 14, 16].forEach(x => m.put(x, 22, K.STALL));
  m.row(12, 24, 3, K.SHELF); m.put(12, 28, K.ARMOIRE); m.put(17, 24, K.TRASH);
  // casiers
  [17, 18, 19, 20, 21].forEach(y => m.put(18, y, K.LOCKER));
  [20, 21, 27, 28].forEach(y => m.put(22, y, K.LOCKER));
  lockersAt(m, 15, [24, 25, 26, 27, 28, 29, 30, 31, 32, 33]);
  lockersAt(m, 11, [13, 14, 15, 23, 24, 27, 28]);
  // vestiaire
  m.row(25, 19, 8, K.LOCKER); [26, 27, 29, 30].forEach(x => m.put(x, 21, K.BENCH));
  // local ménage
  m.row(23, 23, 2, K.SHELF); m.put(28, 23, K.ARMOIRE); m.put(23, 28, K.TRASH); m.put(26, 29, K.X_HOLE);
  // escaliers
  m.fdec(31, 25, 'stairs', { w: 3, h: 3 }); m.put(34, 23, K.PLANT);
  return {
    m, start: [5, 23], tStart: [6, 9], keyPt: [10, 1], binders: true, lockerCol: '#e07a3a', sofaCol: '#3d7bff',
    extraPatrol: [[6, 13], [17, 13], [29, 13], [20, 20], [20, 27], [6, 9]],
    exits: [
      { type: 'hold', x: 31, y: 0, label: 'Ouvrir la fenêtre', icon: '🪟', time: 2.5, noise: 9, snd: 'creak', word: 'CRIIIC' },
      { type: 'search', cands, label: 'Fouiller les dossiers', reveal: 'Une porte secrète derrière les dossiers !', icon: '🗂️' },
      { type: 'small', x: 26, y: 29, label: 'Se faufiler dans le trou de souris', icon: '🐭' }
    ]
  };
}
// ---------- Niveau 3 : la prof de français ----------
function buildL3() {
  const m = B(44, 32, FS.WOOD, WS.PAINT);
  m.room('Couloir', 1, 11, 42, 3, FS.CHECK, false);
  m.room('Salle 101 · Français', 1, 1, 12, 9, FS.WOOD);
  m.room('Salle 102 · Maths', 14, 1, 12, 9, FS.WOOD);
  m.room('Salle 103 · Histoire', 27, 1, 9, 9, FS.WOOD);
  m.room('Local ménage', 37, 1, 6, 9, FS.TILE);
  m.room('Couloir', 19, 14, 3, 17, FS.CHECK, false);
  m.room('CDI', 1, 15, 17, 16, FS.CARPET);
  m.room('Toilettes', 23, 15, 6, 7, FS.TILE);
  m.room('Salle des profs', 30, 15, 13, 7, FS.OFFICE);
  m.room('Salle 104 · Sciences', 23, 23, 20, 8, FS.LINO);
  [[6, 10], [13, 5], [19, 10], [31, 10], [39, 10], [9, 14], [18, 22], [25, 14], [35, 14], [22, 27], [36, 22]].forEach(([x, y]) => m.door(x, y));
  // salle 101
  m.dec(3, 0, 'board', { w: 5 }); m.row(5, 2, 2, K.DESK);
  [4, 6, 8].forEach(y => [2, 3, 6, 7, 10, 11].forEach(x => m.put(x, y, K.TABLE)));
  m.put(12, 1, K.ARMOIRE); m.put(1, 9, K.TRASH); m.put(12, 9, K.PLANT); m.dec(10, 0, 'poster');
  // salle 102
  m.dec(16, 0, 'board', { w: 5 }); m.row(18, 2, 2, K.DESK);
  [4, 6, 8].forEach(y => [15, 16, 19, 20, 23, 24].forEach(x => m.put(x, y, K.TABLE)));
  m.put(25, 1, K.ARMOIRE); m.put(14, 9, K.TRASH); m.dec(23, 0, 'clock');
  // salle 103
  m.row(30, 2, 2, K.DESK); [5, 7].forEach(y => [28, 29, 32, 33].forEach(x => m.put(x, y, K.TABLE)));
  m.put(35, 1, K.ARMOIRE); m.put(27, 9, K.TRASH); m.dec(28, 0, 'map');
  // local ménage
  m.row(37, 1, 2, K.SHELF); m.put(42, 1, K.ARMOIRE); m.put(37, 9, K.TRASH); m.put(43, 5, K.X_HOLE);
  // casiers du couloir
  lockersAt(m, 10, [2, 3, 4, 8, 9, 10, 15, 16, 17, 21, 22, 23, 28, 29, 33, 34]);
  lockersAt(m, 14, [2, 3, 4, 5, 12, 13, 14, 15, 16, 24, 27, 28, 30, 31, 32, 33, 38, 39, 40, 41]);
  // CDI
  const cands = []; for (let y = 16; y <= 29; y++) { m.put(1, y, K.SHELF); cands.push([1, y]); }
  [18, 22, 26].forEach(y => { m.row(4, y, 5, K.SHELF); m.row(11, y, 5, K.SHELF); });
  [20, 24, 28].forEach(y => [6, 7, 12, 13].forEach(x => m.put(x, y, K.TABLE)));
  m.row(15, 16, 2, K.DESK); m.row(15, 30, 2, K.SOFA); m.put(17, 30, K.PLANT); m.put(17, 15, K.PLANT);
  m.dec(12, 14, 'poster');
  // toilettes
  [23, 25, 27].forEach(x => m.put(x, 21, K.STALL));
  // salle des profs
  m.dec(41, 14, 'keys'); m.row(31, 16, 2, K.SOFA); m.row(34, 18, 4, K.MEET); m.put(42, 21, K.ARMOIRE); m.put(30, 21, K.COPIER); m.put(42, 16, K.TRASH); m.put(39, 15, K.PLANT);
  // salle 104
  m.dec(28, 22, 'board', { w: 4 }); m.row(31, 24, 2, K.DESK);
  [26, 28].forEach(y => [25, 26, 27, 28, 31, 32, 33, 34, 37, 38, 39, 40].forEach(x => m.put(x, y, K.TABLE)));
  m.put(42, 23, K.ARMOIRE); m.put(42, 30, K.TRASH); m.put(23, 23, K.PLANT); m.put(38, 31, K.X_WINDOW);
  return {
    m, start: [20, 29], tStart: [6, 3], keyPt: [41, 15], lockerCol: '#d94a5a', sofaCol: '#7b45a8',
    extraPatrol: [[6, 12], [20, 12], [33, 12], [20, 22], [20, 28], [9, 16], [16, 20]],
    exits: [
      { type: 'hold', x: 38, y: 31, label: 'Ouvrir la fenêtre', icon: '🪟', time: 2.5, noise: 9, snd: 'creak', word: 'CRIIIC' },
      { type: 'search', cands, label: 'Fouiller les livres', reveal: 'Un passage secret derrière les livres !', icon: '📚' },
      { type: 'small', x: 43, y: 5, label: 'Se faufiler dans le trou de souris', icon: '🐭' }
    ]
  };
}
// ---------- Niveau 4 : le prof de sport ----------
function buildL4() {
  const m = B(40, 32, FS.GYM, WS.BLUE);
  m.room('Gymnase', 1, 1, 25, 19, FS.GYM);
  m.room('Local matériel', 27, 1, 12, 6, FS.WOOD);
  m.room('Couloir', 27, 8, 12, 3, FS.LINO, false);
  m.room('Bureau du prof de sport', 27, 12, 6, 8, FS.OFFICE);
  m.room('Hall', 34, 12, 5, 19, FS.LINO);
  m.room('Vestiaire des filles', 1, 21, 9, 10, FS.TILE);
  m.room('Douches', 11, 21, 6, 10, FS.TILE);
  m.room('Vestiaire des garçons', 18, 21, 8, 10, FS.TILE);
  m.room('Salle de muscu', 27, 21, 6, 10, FS.GYM);
  [[26, 4], [26, 9], [32, 7], [29, 11], [36, 11], [5, 20], [21, 20], [10, 27], [17, 27], [26, 25], [33, 27]].forEach(([x, y]) => m.door(x, y));
  // gymnase
  m.fdec(1, 1, 'gymlines', { w: 25, h: 17 });
  const cands = [];
  [[2, 2], [3, 2], [23, 2], [24, 2], [2, 12], [24, 12]].forEach(([x, y]) => { m.put(x, y, K.MATS); cands.push([x, y]); });
  m.put(12, 1, K.BALLBIN); m.put(14, 1, K.BALLBIN); m.dec(7, 0, 'hoop'); m.dec(19, 0, 'hoop');
  m.row(3, 18, 8, K.BLEACH); m.row(15, 18, 8, K.BLEACH);
  m.row(6, 8, 2, K.BENCH); m.row(18, 8, 2, K.BENCH); m.put(1, 6, K.ARMOIRE); m.put(25, 15, K.TRASH);
  // local matériel
  m.row(28, 1, 2, K.BALLBIN); [34, 35, 36].forEach(x => { m.put(x, 1, K.MATS); cands.push([x, 1]); });
  m.put(38, 1, K.ARMOIRE); m.put(31, 1, K.SHELF); m.put(39, 4, K.X_HOLE);
  m.put(38, 10, K.PLANT);
  // bureau
  m.dec(31, 11, 'keys'); m.row(28, 14, 2, K.DESK); m.put(32, 13, K.ARMOIRE); m.put(27, 19, K.TRASH); m.put(32, 19, K.PLANT);
  // hall
  m.put(38, 15, K.SHELF); m.put(38, 16, K.SHELF); m.put(34, 20, K.BENCH); m.put(34, 21, K.BENCH); m.put(34, 12, K.PLANT);
  m.put(36, 31, K.X_DOOR);
  // vestiaires
  for (let y = 22; y <= 29; y++) m.put(1, y, K.LOCKER);
  m.row(4, 25, 4, K.BENCH);
  [11, 13, 15].forEach(x => m.put(x, 21, K.STALL));
  [22, 23, 24, 26, 27, 28, 29].forEach(y => m.put(25, y, K.LOCKER));
  m.row(20, 25, 4, K.BENCH);
  // muscu
  m.put(28, 23, K.BENCH); m.put(31, 23, K.BENCH); [[28, 29], [29, 29]].forEach(([x, y]) => { m.put(x, y, K.MATS); cands.push([x, y]); });
  m.put(32, 21, K.ARMOIRE); m.put(27, 30, K.BALLBIN);
  return {
    m, start: [5, 28], tStart: [13, 9], keyPt: [31, 12], lockerCol: '#3fae8e', sofaCol: '#3d7bff',
    extraPatrol: [[6, 4], [20, 4], [6, 15], [20, 15], [32, 9], [36, 18], [36, 27], [13, 19]],
    exits: [
      { type: 'hold', x: 36, y: 31, label: 'Pousser l’issue de secours', icon: '🚨', time: 2, noise: 16, snd: 'alarm', word: 'DRIIIING' },
      { type: 'search', cands, label: 'Soulever les tapis', reveal: 'Une trappe secrète sous les tapis !', icon: '🤸' },
      { type: 'small', x: 39, y: 4, label: 'Se faufiler dans le trou', icon: '🐭' }
    ]
  };
}
// ---------- Niveau 5 : l'étage de la direction ----------
function buildL5() {
  const m = B(42, 30, FS.CARPET, WS.WOOD);
  m.room('Couloir de la direction', 1, 12, 40, 3, FS.CARPET, false);
  m.room('Secrétariat', 1, 1, 10, 10, FS.OFFICE);
  m.room('Salle de réunion', 12, 1, 13, 10, FS.WOOD);
  m.room('Bureau de la directrice', 26, 1, 15, 10, FS.ROYAL);
  m.room('Archives', 1, 16, 11, 13, FS.LINO);
  m.room('Toilettes', 13, 16, 5, 6, FS.TILE);
  m.room('Salle d’attente', 19, 16, 8, 13, FS.OFFICE);
  m.room('Palier de l’ascenseur', 28, 16, 13, 13, FS.CHECK);
  [[5, 11], [11, 5], [18, 11], [25, 6], [30, 11], [6, 15], [15, 15], [22, 15], [32, 15], [38, 15]].forEach(([x, y]) => m.door(x, y));
  // secrétariat
  m.row(1, 7, 6, K.COUNTER); m.row(3, 3, 2, K.DESK); m.put(10, 1, K.COPIER); m.row(1, 1, 6, K.SHELF); m.put(10, 8, K.ARMOIRE); m.put(10, 10, K.PLANT);
  // réunion
  for (let y = 4; y <= 6; y++) m.row(15, y, 7, K.MEET);
  m.put(24, 1, K.ARMOIRE); m.put(12, 1, K.PLANT); m.put(12, 10, K.PLANT); m.put(24, 10, K.PLANT); m.dec(17, 0, 'screen', { w: 3 });
  // bureau de la directrice
  m.row(32, 4, 4, K.DESK); m.row(37, 8, 2, K.SOFA); [[26, 1], [40, 1], [40, 10]].forEach(([x, y]) => m.put(x, y, K.PLANT));
  m.put(26, 4, K.ARMOIRE); m.row(37, 1, 3, K.SHELF);
  m.dec(28, 0, 'frame'); m.dec(31, 0, 'frame'); m.dec(34, 0, 'portrait');
  m.fdec(31, 6, 'rug', { w: 6, h: 3, col: '#c8a84a' });
  const cands = [[28, 0], [31, 0], [34, 0], [37, 1], [38, 1], [39, 1]];
  // archives
  [18, 21, 24].forEach(y => m.row(3, y, 7, K.SHELF)); m.put(11, 16, K.ARMOIRE); m.put(0, 22, K.X_HOLE);
  // toilettes
  [13, 15, 17].forEach(x => m.put(x, 21, K.STALL));
  // salle d'attente
  m.col(19, 18, 3, K.SOFA); m.row(22, 24, 3, K.BENCH); m.put(26, 16, K.PLANT); m.put(19, 28, K.PLANT); m.put(26, 28, K.TRASH); m.row(22, 20, 2, K.TABLE);
  m.dec(24, 15, 'clock');
  // palier
  m.put(28, 28, K.PLANT); m.put(40, 28, K.PLANT); m.row(30, 20, 2, K.BENCH); m.put(40, 18, K.SHELF); m.put(40, 19, K.SHELF); m.put(34, 29, K.X_ELEV);
  m.dec(30, 15, 'frame'); m.dec(9, 11, 'portrait');
  return {
    m, start: [23, 26], tStart: [33, 6], keyPt: [8, 1], binders: true, lockerCol: '#8b5a2b', sofaCol: '#e0249a',
    extraPatrol: [[6, 13], [20, 13], [33, 13], [6, 27], [34, 22], [30, 8]],
    exits: [
      { type: 'hold', x: 34, y: 29, label: 'Appeler l’ascenseur', icon: '🛗', time: 4, noise: 7, snd: 'ding', word: 'DING !' },
      { type: 'search', cands, label: 'Regarder derrière', reveal: 'Un passage secret derrière le tableau !', icon: '🖼️' },
      { type: 'small', x: 0, y: 22, label: 'Ramper dans le conduit d’aération', icon: '🐭' }
    ]
  };
}

// ================= LES PROFS =================
const PROFS = [
  {
    name: 'Kévin', title: 'le surveillant de la cour',
    cfg: { skin: 1, hair: 0, hairCol: 1, eyes: 0, mouth: 0, face: 0, top: 1, topCol: 1, bottom: 0, botCol: 7, shoes: 0, acc: 1, accCol: 0 },
    v: { adult: true, extras: ['sifflet', 'talkie'] }, voice: { pitch: 1.05, rate: 1.15 },
    patrol: 1.8, chase: 3.45, range: 7, fov: 0.95, hear: 0.9, searchN: 3, whistle: true,
    lines: {
      start: 'Je compte jusqu’à trois… et j’arrive !',
      spot: ['Hé ! {n} ! Reviens ici !', 'PRIIIT ! {n}, je te vois !', 'On ne quitte pas la cour, {n} !'],
      lost: ['Hein ? Où est {n} ?', 'Je vais te trouver, {n}…', 'Tu ne perds rien pour attendre !'],
      heard: ['Hein ? C’était quoi ce bruit ?', 'J’ai entendu quelque chose…', 'Qui est là ?'],
      search: ['Voyons voir là-dedans…', 'Pas ici…', 'Ni là…', 'Hmm…'],
      give: ['Bon… je reprends ma ronde.', 'Tant pis… pour l’instant !'],
      chat: ['Pas de bousculade !', 'Qui a lancé ce ballon ?!', 'On ne grimpe pas aux arbres !', 'Doucement sur le toboggan !'],
      caught: 'Toi, tu vas ramasser tous les papiers de la cour !'
    }
  },
  {
    name: 'M. Carnet', title: 'le surveillant de la vie scolaire',
    cfg: { skin: 0, hair: 6, hairCol: 6, eyes: 0, mouth: 4, face: 3, top: 2, topCol: 6, bottom: 0, botCol: 12, shoes: 1, acc: 0, accCol: 0 },
    v: { adult: true, extras: ['carnet', 'moustache'] }, voice: { pitch: 0.75, rate: 1.0 },
    patrol: 1.8, chase: 3.6, range: 7, fov: 1.0, hear: 1.1, searchN: 5,
    lines: {
      start: 'Personne ne s’échappe de la salle de colle !',
      spot: ['{n} ! Ton carnet de correspondance !', '{n} ! Au bureau, tout de suite !', 'On ne court pas dans les couloirs, {n} !'],
      lost: ['Où se cache {n} ?', 'Je finirai par te trouver…', 'Je note, je note…'],
      heard: ['Qui fait ce bruit ?', 'Silence dans les couloirs !', 'J’ai entendu quelque chose…'],
      search: ['Vérifions ici…', 'Rien ici…', 'Hmm, pas là…', 'Et là-dedans ?'],
      give: ['Bon, je retourne à mon bureau.', 'Je t’aurai, va.'],
      chat: ['Je note, je note…', 'Encore un retard…', 'Qui a perdu son carnet ?', 'Où est mon tampon ?'],
      caught: 'Un mot dans le carnet ET une heure de colle en plus !'
    }
  },
  {
    name: 'Mme Virgule', title: 'la prof de français',
    cfg: { skin: 2, hair: 8, hairCol: 3, eyes: 1, mouth: 4, face: 3, top: 3, topCol: 8, bottom: 2, botCol: 8, shoes: 2, acc: 0, accCol: 0 },
    v: { adult: true, extras: ['livre'] }, voice: { pitch: 1.3, rate: 1.05 },
    patrol: 1.7, chase: 3.7, range: 7, fov: 1.05, hear: 1.5, searchN: 3, chatty: true,
    lines: {
      start: 'Je compte jusqu’à trois. Un… deux… trois !',
      spot: ['{n} ! On ne quitte pas mon cours !', '{n} ! Conjugue-moi le verbe s’enfuir !', 'Je te vois, {n} ! Au tableau !'],
      lost: ['Mais où est {n} ?', 'Point, virgule… où es-tu ?', 'Tu ne m’échapperas pas !'],
      heard: ['J’entends des chuchotements !', 'Qui fait du bruit ?', 'Silence, on travaille !'],
      search: ['Voyons là-dedans…', 'Personne ici…', 'Ni ici…', 'Hmm…'],
      give: ['Bon. Reprenons la dictée.', 'Je retourne en classe.'],
      chat: ['Ouvrez vos cahiers page 42 !', 'Ah… l’imparfait du subjonctif…', 'Qui a écrit « je sui » sans S ?', 'Silence, on travaille !', 'Une virgule, pas un point !'],
      caught: 'Tu me copieras cent fois : « Je ne fuirai plus le cours de français. »'
    }
  },
  {
    name: 'M. Chrono', title: 'le prof de sport',
    cfg: { skin: 4, hair: 1, hairCol: 0, eyes: 4, mouth: 1, face: 0, top: 7, topCol: 3, bottom: 1, botCol: 13, shoes: 0, acc: 0, accCol: 0 },
    v: { adult: true, extras: ['sifflet', 'bandeau'] }, voice: { pitch: 0.9, rate: 1.3 },
    patrol: 2.3, chase: 4.15, range: 7.5, fov: 1.0, hear: 1.0, searchN: 3, whistle: true, tires: true,
    lines: {
      start: 'Échauffement ! Je compte jusqu’à trois !',
      spot: ['PRIIIT ! {n}, on accélère !', '{n} ! Dix tours de gymnase !', 'Allez {n}, pas de triche !'],
      lost: ['Où es-tu, {n} ?', 'Allez, sors de là !', 'On ne se cache pas pendant l’échauffement !'],
      heard: ['Hé ! Qui court là ?', 'C’était quoi ce bruit ?', 'J’ai entendu quelqu’un !'],
      search: ['Là-dedans ?', 'Personne…', 'Pas ici…', 'Hmm…'],
      give: ['Bon, on reprend les étirements.', 'Je finirai par te trouver !'],
      chat: ['Une, deux ! Une, deux !', 'Allez, échauffement !', 'Qui a caché les ballons ?', 'On s’étire, on s’étire !'],
      tired: 'Pff… pff… attends… je souffle…',
      caught: 'Vingt tours de gymnase. Allez, hop hop hop !'
    }
  },
  {
    name: 'Mme la Directrice', title: 'la directrice',
    cfg: { skin: 0, hair: 8, hairCol: 4, eyes: 0, mouth: 0, face: 3, top: 6, topCol: 10, bottom: 2, botCol: 10, shoes: 1, acc: 0, accCol: 0 },
    v: { adult: true, wide: true, extras: ['perles'] }, voice: { pitch: 0.7, rate: 0.9 },
    patrol: 1.5, chase: 3.4, range: 8.5, fov: 1.1, hear: 1.25, searchN: 5, smart: true, hasKeys: true, intercom: true,
    lines: {
      start: 'Mon établissement est sous MA surveillance.',
      spot: ['{n} ! Dans mon bureau. IMMÉDIATEMENT !', 'On ne court pas dans MON établissement, {n} !', '{n} ! Je te vois !'],
      lost: ['Où se cache {n} ?', 'Je connais toutes les cachettes, tu sais…', 'Rien ne m’échappe.'],
      heard: ['Qui ose faire du bruit ?', 'Hmm ? Il y a quelqu’un ?', 'J’ai entendu quelque chose…'],
      search: ['Voyons voir…', 'Pas ici…', 'Ni là…', 'Hmm hmm…'],
      give: ['Bien. Je retourne à mes dossiers.', 'Je finirai par te trouver.'],
      chat: ['Une tache sur MA moquette ?', 'Où sont passés mes trombones ?', 'Mon café est froid…', 'Tout doit être impeccable.'],
      locked: 'Fermé ? J’ai TOUTES les clés, moi.',
      intercom: 'Ding-dong ! {n}, présente-toi immédiatement au bureau de la directrice !',
      caught: 'Convocation des parents. Vendredi. 17 heures.'
    }
  }
];
const LEVELS = [
  { title: 'La cour de récré', place: 'Cour de récréation', prof: 0, build: buildL1,
    hints: ['🌿 Un des buissons du fond cache un trou dans le grillage.', '🚧 Le portail sur le côté grince… mais il s’ouvre.', '🐭 Un passage minuscule sous la grille… pour les tout petits !'] },
  { title: 'La vie scolaire', place: 'Bureau de la vie scolaire', prof: 1, build: buildL2,
    hints: ['🗂️ Derrière les dossiers du bureau, il y a peut-être une porte secrète.', '🪟 La fenêtre de l’infirmerie s’ouvre (en grinçant).', '🐭 Un trou de souris dans le local ménage…'] },
  { title: 'Le cours de français', place: 'Couloirs et salles de classe', prof: 2, build: buildL3,
    hints: ['📚 Au CDI, un livre n’est pas comme les autres.', '🪟 La fenêtre de la salle de sciences donne dehors.', '🐭 Un trou de souris dans le local ménage…'] },
  { title: 'Le gymnase', place: 'Gymnase et vestiaires', prof: 3, build: buildL4,
    hints: ['🤸 Une trappe secrète est cachée sous des tapis de gym.', '🚨 L’issue de secours du hall… mais l’alarme va sonner !', '🐭 Un petit trou dans le mur du local matériel.'] },
  { title: 'Le bureau de la directrice', place: 'L’étage de la direction', prof: 4, build: buildL5,
    hints: ['🖼️ Derrière un tableau ou une étagère de la directrice : un passage secret !', '🛗 L’ascenseur du palier… s’il arrive à temps !', '🐭 Un conduit d’aération dans les archives.'] },
];

// ---------- Finalisation : cachettes, rondes, objets ----------
function passT(m, x, y) { const k = m.get(x, y); return KP[k].solid === 0; }
function bfs(m, sx, sy, pass) {
  const N = m.w * m.h, d = new Int16Array(N).fill(-1), q = [sy * m.w + sx]; d[q[0]] = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi], x = i % m.w, y = (i / m.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const j = ny * m.w + nx; if (d[j] >= 0 || !pass(nx, ny)) continue; d[j] = d[i] + 1; q.push(j);
    }
  }
  return d;
}
function nearestPassable(m, x, y, reach) {
  let best = null, bd = 1e9;
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
    if (m.get(i, j) !== K.FLOOR || reach[j * m.w + i] < 0) continue;
    const d = Math.abs(i - x) + Math.abs(j - y); if (d < bd) { bd = d; best = [i, j]; }
  }
  return best;
}
function finalizeLevel(L) {
  const m = L.m;
  const reach = bfs(m, L.start[0], L.start[1], (x, y) => passT(m, x, y));
  L.reach = reach;
  const ok = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && reach[y * m.w + x] >= 0;
  // cachettes
  L.hides = []; L.hideAt = new Map();
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = m.get(x, y), p = KP[k]; if (!p || !p.hide) continue;
    const stand = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => m.get(a, b) === K.FLOOR && ok(a, b));
    if (!stand.length) continue;
    const s = { x, y, k, n: p.hide.n, peek: p.hide.peek, small: !!p.hide.small, stand, idx: L.hides.length };
    L.hides.push(s); L.hideAt.set(y * m.w + x, s);
  }
  // rondes
  const pts = m.patrol.concat(L.extraPatrol || []); L.patrol = [];
  const tReach = bfs(m, L.tStart[0], L.tStart[1], (x, y) => passT(m, x, y));
  pts.forEach(([x, y]) => {
    let p = (m.get(x, y) === K.FLOOR && tReach[y * m.w + x] >= 0) ? [x, y] : nearestPassable(m, x, y, tReach);
    if (p && !L.patrol.some(q => q[0] === p[0] && q[1] === p[1])) L.patrol.push(p);
  });
  // sorties
  L.exitAt = new Map(); L.candAt = new Map();
  L.exits.forEach(e => {
    e.progress = 0; e.done = false;
    if (e.type === 'search') {
      e.cands = e.cands.filter(([x, y]) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => m.get(x + dx, y + dy) === K.FLOOR && ok(x + dx, y + dy)));
      e.secret = pick(e.cands); e.cands.forEach(([x, y]) => L.candAt.set(y * m.w + x, e));
    } else {
      L.exitAt.set(e.y * m.w + e.x, e);
      e.from = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [e.x + dx, e.y + dy]).find(([a, b]) => m.get(a, b) === K.FLOOR);
    }
  });
  // emplacements pour les objets
  L.itemSpots = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.get(x, y) !== K.FLOOR || !ok(x, y)) continue;
    const d = Math.abs(x - L.start[0]) + Math.abs(y - L.start[1]);
    if (d < 6) continue;
    let walls = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (m.get(x + dx, y + dy) === K.DOOR) walls += 5;
    if (walls) continue;
    L.itemSpots.push([x, y]);
  }
  return L;
}
