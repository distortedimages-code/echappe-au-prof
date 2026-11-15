// ================= SORTIES SCOLAIRES : la piscine et le musée (profs, plans, mobilier) =================
PROFS.push({
  name: 'Bruno', title: 'le maître nageur', pool: true,
  cfg: { skin: 2, hair: 1, hairCol: 4, eyes: 4, mouth: 1, face: 4, top: 0, topCol: 0, bottom: 1, botCol: 2, shoes: 0, acc: 1, accCol: 0 },
  v: { adult: true, extras: ['sifflet'] }, voice: { pitch: 0.85, rate: 1.2 },
  patrol: 1.9, chase: 3.9, range: 8, fov: 1.0, hear: 1.1, searchN: 3, whistle: true,
  lines: {
    start: 'On ne court pas au bord du bassin ! Un… deux… trois !',
    spot: ['PRIIIT ! {n}, on ne court pas au bord du bassin !', '{n} ! Reviens ici, bonnet de bain !', 'Je te vois, {n} !'],
    lost: ['Où est passé·e {n} ? Sous l’eau ?', 'Pas de plongeon sans autorisation !', 'Je surveille le bassin, tu sais…'],
    heard: ['Qui a fait PLOUF ?', 'C’était quoi ce bruit ?', 'On ne crie pas à la piscine !'],
    search: ['Là-dedans ?', 'Personne…', 'Pas ici…', 'Hmm…'],
    give: ['Bon, je remonte sur ma chaise.', 'Je finirai par te repêcher !'],
    chat: ['On ne court pas au bord du bassin !', 'Bonnet de bain obligatoire !', 'Qui a laissé une frite ici ?', 'Douche avant d’entrer dans l’eau !', 'Pas de bombe dans le petit bain !'],
    caught: 'Hors de l’eau ! Dix longueurs… en brasse coulée !'
  }
});
PROFS.push({
  name: 'M. Fossile', title: 'le gardien du musée', museum: true,
  cfg: { skin: 1, hair: 0, hairCol: 6, eyes: 0, mouth: 4, face: 3, top: 6, topCol: 7, bottom: 0, botCol: 7, shoes: 1, acc: 1, accCol: 7 },
  v: { adult: true, extras: ['talkie', 'moustache'] }, voice: { pitch: 0.7, rate: 0.95 },
  patrol: 1.7, chase: 3.6, range: 8, fov: 1.0, hear: 1.3, searchN: 4, hasKeys: true, smart: true,
  lines: {
    start: 'Le musée est fermé aux petits curieux. Un… deux… trois !',
    spot: ['Halte ! On ne touche pas aux vitrines, {n} !', '{n} ! On ne court pas dans un musée !', 'Je t’ai vu·e, {n} ! Reviens ici !'],
    lost: ['Où se cache {n} ? Derrière le T-Rex ?', 'Je connais ce musée par cœur…', 'Rien ne m’échappe, ici.'],
    heard: ['Qui a touché à mes fossiles ?', 'Chut ! On est dans un musée !', 'C’était quoi, ce bruit ?'],
    search: ['Voyons voir…', 'Pas ici…', 'Ni là…', 'Hmm…'],
    give: ['Bon. Je retourne à mes caméras.', 'Je finirai par te trouver.'],
    chat: ['On ne touche pas les œuvres !', 'Chut, on est dans un musée !', 'Qui a collé un chewing-gum sur le mammouth ?', 'Ce dinosaure a 66 millions d’années, lui !', 'Pas de flash, s’il vous plaît !'],
    locked: 'Fermé ? J’ai les clés de tout le musée.',
    caught: 'Attrapé·e ! Tu vas épousseter TOUS les squelettes du musée.'
  }
});
// le plan « fixe » (plans surprise coupés) : toujours le même tirage
const fixedPlan = (idx, seed) => () => { const L = buildProcLevel(idx, seed); if (L) { delete L.seed; return L; } return buildL1(); };
LEVELS.push(
  { title: 'La piscine', place: 'Sortie à la piscine', prof: 7, bonus: true, build: fixedPlan(7, 4242),
    hints: ['🔐 Au vestiaire des garçons, un casier n’a pas de fond…', '🚨 Une issue de secours… mais l’alarme va sonner !', '🐭 Une bouche d’évacuation dans le local technique…'] },
  { title: 'Le musée', place: 'Musée d’histoire naturelle', prof: 8, bonus: true, build: fixedPlan(8, 1789),
    hints: ['💎 Dans la salle des minéraux, une vitrine pivote…', '🚨 Une issue de secours… mais l’alarme va sonner !', '🐭 Un conduit d’aération dans le local technique…'] }
);

// ---------- mobilier ----------
Object.assign(FURN, {
  pool(g, r) {
    const m = g.m, X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    const x0 = r.x + 3, x1 = X2 - 3, y0 = r.y + 4, y1 = Y2 - 2;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g.put(r, x, y, K.WATER);
    (m.pools || (m.pools = [])).push({ x0, y0, x1, y1, lanes: true });
    // le plongeoir (d'un côté) et la chaise du maître nageur (de l'autre)
    const dir = g.R.ch(0.5) ? 1 : -1, ly = y0 + 1 + 3 * g.R.i(0, Math.max(0, Math.floor((y1 - y0 - 2) / 3))), lx = dir > 0 ? x0 - 1 : x1 + 1;
    if (g.put(r, lx, ly, K.LADDER)) m.board = { lx, ly, ex: lx + dir * 3, ey: ly, land: [lx + dir * 6, ly], len: 3, dir };
    g.put(r, dir > 0 ? x1 + 1 : x0 - 1, y0 + Math.floor((y1 - y0) / 2), K.LGCHAIR);
    // gradins, bancs, plantes, bouées
    for (let x = x0; x <= x1; x++) if ((x - x0) % 9 < 6) g.put(r, x, r.y, K.BLEACH);
    for (let x = x0 + 1; x < x1; x += g.R.i(5, 7)) g.put(r, x, Y2, K.BENCH);
    [[r.x, r.y], [X2, r.y], [r.x, Y2], [X2, Y2]].forEach(([x, y]) => g.put(r, x, y, g.R.p([K.PLANT, K.TRASH])));
    for (let x = r.x + 2; x < X2 - 1; x += 7) g.dec(x, r.y - 1, g.R.p(['buoy', 'clock', 'buoy']));
  },
  kidpool(g, r) {
    const m = g.m, X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    if (r.w >= 6 && r.h >= 5) {
      const x0 = r.x + 2, x1 = X2 - 2, y0 = r.y + 2, y1 = Y2 - 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g.put(r, x, y, K.WATER);
      (m.pools || (m.pools = [])).push({ x0, y0, x1, y1, kid: true });
    }
    g.put(r, r.x, r.y, K.PLANT); g.put(r, X2, r.y, K.BENCH); g.dec(r.x + 1, r.y - 1, 'buoy');
  },
  poolLockers(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1; r.search = [];
    for (let x = r.x; x < X2; x++) if (g.put(r, x, r.y, K.LOCKER)) r.search.push([x, r.y]);
    if (r.h >= 6) { const y = r.y + (r.h >> 1); for (let x = r.x + 2; x < X2 - 1; x++) if (g.put(r, x, y, K.LOCKER)) r.search.push([x, y]); }
    g.row(r, r.x + 1, Y2, Math.max(2, r.w - 3), K.BENCH); g.dec(X2 - 1, r.y - 1, 'mirror'); g.dec(X2, r.y - 1, 'mirror');
  },
  cabins(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    for (let x = r.x; x <= X2; x++) g.put(r, x, r.y, K.CABIN);
    if (r.h >= 6) for (let x = r.x + 1; x < X2; x++) if ((x - r.x) % 4) g.put(r, x, r.y + 3, K.CABIN);
    g.put(r, r.x, Y2, K.BENCH); g.put(r, X2, Y2, K.TRASH);
  },
  poolGear(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    g.row(r, r.x, r.y, Math.min(3, r.w - 2), K.SHELF); g.put(r, X2, r.y, K.BALLBIN); g.put(r, X2, Y2, K.ARMOIRE); g.put(r, r.x, Y2, K.BALLBIN); g.dec(r.x + 1, r.y - 1, 'buoy');
  },
  poolDesk(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1, cy = r.y + Math.min(2, r.h - 3);
    g.row(r, r.x + 1, cy, Math.max(2, r.w - 4), K.COUNTER); g.put(r, X2, r.y, K.SHELF); g.put(r, r.x, Y2, K.PLANT); g.put(r, X2, Y2, K.BENCH); g.dec(r.x + 2, r.y - 1, 'panel');
  },
  // ----- le musée -----
  dinohall(g, r) {
    const m = g.m, X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    const placeDino = (t, w, h, x, y) => {
      const pts = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (!g.put(r, x + i, y + j, K.DINO)) { pts.forEach(([a, b]) => m.set(a, b, K.FLOOR)); r.placed.length -= pts.length; return false; } pts.push([x + i, y + j]); }
      (m.dinos || (m.dinos = [])).push({ x, y, w, h, t }); return true;
    };
    const big = r.w >= 14 && g.R.ch(0.5) ? ['diplo', 6, 2] : r.w >= 9 && r.h >= 7 ? ['trex', 5, 3] : ['trice', 4, 2];
    placeDino(big[0], big[1], big[2], r.x + ((r.w - big[1]) >> 1), r.y + ((r.h - big[2]) >> 1) + (r.h >= 8 ? 1 : 0));
    if (r.w >= 18) placeDino('trice', 4, 2, r.x + 1, Y2 - 2);
    g.put(r, r.x, r.y, K.VITRINE); g.put(r, X2, r.y, K.VITRINE); g.put(r, X2, Y2, K.PLANT); g.put(r, r.x, Y2, K.BENCH);
    for (let x = r.x + 1; x < X2; x += 4) g.dec(x, r.y - 1, g.R.p(['panel', 'frame', 'panel']));
  },
  gallery(g, r, o) {
    const m = g.m, X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1, kind = (o && o.k) || K.VITRINE; r.search = [];
    for (let x = r.x + 1; x < X2; x += 2) if (g.put(r, x, r.y, K.VITRINE)) r.search.push([x, r.y]);
    for (let y = r.y + 2; y < Y2; y += 3) for (let x = r.x + 2; x < X2 - 1; x += 3) { if (g.put(r, x, y, kind) && kind === K.VITRINE) r.search.push([x, y]); }
    if (o && o.dino && r.w >= 7 && r.h >= 5) { const x = r.x + ((r.w - 3) >> 1), y = Y2 - 2; let ok = true; const pts = []; for (let j = 0; j < 2 && ok; j++) for (let i = 0; i < 3; i++) { if (!g.put(r, x + i, y + j, K.DINO)) { ok = false; break; } pts.push([x + i, y + j]); } if (ok) (m.dinos || (m.dinos = [])).push({ x, y, w: 3, h: 2, t: 'mammoth' }); else { pts.forEach(([a, b]) => m.set(a, b, K.FLOOR)); r.placed.length -= pts.length; } }
    g.put(r, X2, Y2, K.PLANT); g.put(r, r.x, Y2, K.BENCH);
    g.dec(r.x + 2, r.y - 1, g.R.p(['panel', 'frame'])); if (o && o.aqua && r.w >= 6) g.m.dec(r.x + 2, r.y - 1, 'aquarium', { w: Math.min(4, r.w - 4) });
  },
  guardpost(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    g.row(r, r.x + 1, r.y + 1, 2, K.DESK); g.put(r, X2, r.y, K.ARMOIRE); g.put(r, X2, Y2, K.LOCKER); g.put(r, r.x, Y2, K.PLANT); g.dec(r.x + 1, r.y - 1, 'screens'); g.dec(r.x + 2, r.y - 1, 'screens');
  },
  workshop(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    for (let y = r.y + 2; y <= Y2 - 1; y += 2) for (let x = r.x + 1; x + 1 <= X2 - 1; x += 4) { g.put(r, x, y, K.TABLE); g.put(r, x + 1, y, K.TABLE); }
    g.put(r, X2, r.y, K.ARMOIRE); g.put(r, r.x, r.y, K.SHELF); g.put(r, X2, Y2, K.TRASH); g.dec(r.x + 2, r.y - 1, 'poster');
  },
  shop(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    for (let y = r.y; y < Y2 - 1; y += 3) g.row(r, r.x + 1, y, Math.max(1, r.w - 4), K.SHELF);
    g.row(r, X2 - 2, Y2, 2, K.COUNTER); g.put(r, r.x, Y2, K.PLANT);
  },
  cafe(g, r) {
    const X2 = r.x + r.w - 1, Y2 = r.y + r.h - 1;
    g.row(r, r.x, r.y, Math.min(4, r.w - 2), K.COUNTER);
    for (let y = r.y + 2; y < Y2; y += 2) for (let x = r.x + 1; x < X2; x += 3) g.put(r, x, y, K.TABLE);
    g.put(r, X2, Y2, K.PLANT);
  }
});
// ---------- les univers ----------
UNIVERSES.pool = {
  w: [42, 46], h: [32, 35], fs: FS.TILE, ws: WS.BLUE, corFs: FS.TILE, up: [15, 17], vcor: 0.5, minW: 5, maxW: 12, minH: 5, maxH: 10,
  big: { n: 'Bassin', fs: FS.TILE, f: 'pool', w: [26, 30], hold: 1 },
  teacher: 'Bassin', keys: 'Bureau du maître nageur', start: ['Vestiaire des filles', 'Cabines'],
  rooms: [
    { n: 'Vestiaire des garçons', fs: FS.TILE, f: 'poolLockers', sz: 'mid', search: 1 },
    { n: 'Cabines', fs: FS.TILE, f: 'cabins', sz: 'mid', minW: 6 },
    { n: 'Local technique', fs: FS.LINO, f: 'cleaning', sz: 'small', small: 1 },
    { n: 'Bureau du maître nageur', fs: FS.OFFICE, f: 'smalloffice', sz: 'small' },
    { n: 'Vestiaire des filles', fs: FS.TILE, f: 'poolLockers', sz: 'mid' },
    { n: 'Douches', fs: FS.TILE, f: 'showers', sz: 'small' },
    { n: 'Local matériel', fs: FS.LINO, f: 'poolGear', sz: 'small' }
  ],
  fill: [{ n: 'Pataugeoire', fs: FS.TILE, f: 'kidpool' }, { n: 'Infirmerie', fs: FS.TILE, f: 'infirmary' }, { n: 'Accueil', fs: FS.LINO, f: 'poolDesk' }, { n: 'Toilettes', fs: FS.TILE, f: 'toilets' }, { n: 'Salle d’attente', fs: FS.LINO, f: 'waiting' }, { n: 'Réserve', fs: FS.LINO, f: 'storage' }],
  hold: HOLD_KINDS.door, holdMix: [['door', 0.65], ['win', 0.35]],
  search: { label: 'Fouiller les casiers', reveal: 'Un casier sans fond… un passage secret !', icon: '🔐', kinds: [K.LOCKER] },
  small: { label: 'Se faufiler dans la bouche d’évacuation', icon: '🐭' },
  meta: { lockerCol: '#2ec4c4', sofaCol: '#3d7bff', robots: 7, pool: true },
  tasks: ['canards', 'bouee', 'maillot', 'frites', 'mousse', 'chaussettes', 'plouf']
};
UNIVERSES.museum = {
  w: [42, 46], h: [30, 34], fs: FS.WOOD, ws: WS.PAINT, corFs: FS.CHECK, up: [9, 11], vcor: 0.6, minW: 6, maxW: 14, minH: 5, maxH: 10,
  teacher: 'Poste du gardien', keys: 'Poste du gardien', start: ['Atelier des enfants'],
  rooms: [
    { n: 'Galerie des dinosaures', fs: FS.CHECK, f: 'dinohall', sz: 'big', minW: 9, minH: 7 },
    { n: 'Salle des minéraux', fs: FS.CARPET, f: 'gallery', sz: 'mid', minW: 6, search: 1 },
    { n: 'Poste du gardien', fs: FS.OFFICE, f: 'guardpost', sz: 'small' },
    { n: 'Galerie des animaux', fs: FS.WOOD, f: 'gallery', o: { k: K.ANIMAL }, sz: 'mid', minW: 6, hold: 1 },
    { n: 'Local technique', fs: FS.LINO, f: 'cleaning', sz: 'small', small: 1 },
    { n: 'Atelier des enfants', fs: FS.LINO, f: 'workshop', sz: 'mid', minW: 6, minH: 5 },
    { n: 'Toilettes', fs: FS.TILE, f: 'toilets', sz: 'small' }
  ],
  fill: [
    { n: 'Salle des insectes', fs: FS.WOOD, f: 'gallery' }, { n: 'Salle des fossiles', fs: FS.WOOD, f: 'gallery', o: { dino: 1 } },
    { n: 'Salle des océans', fs: FS.CARPET, f: 'gallery', o: { aqua: 1 } }, { n: 'Salle des mammouths', fs: FS.WOOD, f: 'gallery', o: { k: K.ANIMAL, dino: 1 } },
    { n: 'Salle des oiseaux', fs: FS.WOOD, f: 'gallery', o: { k: K.ANIMAL } }, { n: 'Boutique du musée', fs: FS.LINO, f: 'shop' },
    { n: 'Salle des météorites', fs: FS.CARPET, f: 'gallery' }, { n: 'Cafétéria', fs: FS.LINO, f: 'cafe' },
    { n: 'Salle de l’évolution', fs: FS.WOOD, f: 'gallery', o: { k: K.ANIMAL } }, { n: 'Réserves', fs: FS.LINO, f: 'storage' }
  ],
  hold: HOLD_KINDS.door, holdMix: [['door', 0.55], ['win', 0.45]],
  search: { label: 'Examiner la vitrine', reveal: 'La vitrine pivote… un passage secret !', icon: '💎', kinds: [K.VITRINE] },
  small: { label: 'Ramper dans le conduit d’aération', icon: '🐭' },
  noLockers: true, meta: { lockerCol: '#8b5a2b', sofaCol: '#7b45a8', robots: 7, museum: true },
  tasks: ['tchapeau', 'poussiere', 'ours', 'dinovitre', 'selfie', 'moustache']
};
// la grande galerie a besoin de place : pas de grande salle à part, mais une salle « big »
PROC_GENS.push(R => genIndoor(R, UNIVERSES.pool), R => genIndoor(R, UNIVERSES.museum));
Object.assign(TASK_ANCH, {
  canards: { near: K.WATER }, bouee: { k: [K.SHELF, K.BALLBIN], room: /matériel/ }, maillot: { k: [K.LGCHAIR] }, frites: { k: [K.SHELF], room: /matériel/ },
  plouf: { wall: ['mirror'] },
  tchapeau: { k: [K.DINO] }, poussiere: { k: [K.VITRINE], room: /fossiles|minéraux|dinosaures|météorites/i }, ours: { k: [K.ANIMAL] }, dinovitre: { k: [K.VITRINE] }, selfie: { k: [K.DINO] }
});
