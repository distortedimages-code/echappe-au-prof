// ================= FOUILLER, EN RIGOLANT =================
// Pendant une fouille, le perso plonge les bras dans le meuble en gigotant (il reste entier à l'écran),
// et tout le bazar vole par-dessus son épaule (chaussette, banane, livres, canard en plastique…).
// Si on ne trouve rien, il arrive qu'un truc lui retombe sur la tête.

// ---------- les petits objets (dessins de quelques pixels) ----------
const JUNK_ART = {
  boule: [['.ww.', 'wgww', 'wwgw', '.ww.'], { w: '#f4f1e6', g: '#c9c3b0' }],
  feuille: [['wwwww', 'wllww', 'wwwww', 'wllll', 'wwwww'], { w: '#fbfaf2', l: '#8fb4e8' }],
  crayon: [['pyyyyyws', 'pyyyyyw.'], { p: '#ff8fb0', y: '#ffcf33', w: '#f2d2a0', s: '#3a3040' }],
  gomme: [['pppbb', 'pppbb'], { p: '#ff9fc0', b: '#4f8fe0' }],
  chaussette: [['.ww', '.ww', '.rr', '.ww', 'www', 'ww.'], { w: '#f0f0f6', r: '#e0485a' }],
  banane: [['....b', '...yy', 'y.yy.', 'yyy..'], { y: '#ffd84a', b: '#7a5a20' }],
  livreR: [['dcccc', 'dcyyc', 'dcccc', 'dcccc'], { c: '#d84a4a', d: '#8a2a2a', y: '#ffd23f' }],
  livreB: [['dcccc', 'dcyyc', 'dcccc', 'dcccc'], { c: '#4a7ad8', d: '#2a3a8a', y: '#ffffff' }],
  livreV: [['dcccc', 'dcyyc', 'dcccc', 'dcccc'], { c: '#4ab86a', d: '#2a6a3a', y: '#ffd23f' }],
  bd: [['ccccc', 'cwkwc', 'cwwwc', 'ccccc'], { c: '#ff8c1a', w: '#fff6d0', k: '#1a1028' }],
  sandwich: [['.tttt.', 'tttttt', 'gggggg', 'rrrrrr', 'tttttt'], { t: '#e8c07a', g: '#6ccf5a', r: '#e04848' }],
  canette: [['sss', 'rrr', 'rwr', 'rrr', 'sss'], { s: '#c8ccd8', r: '#e03050', w: '#ffffff' }],
  trognon: [['.b.', 'rrr', '.w.', '.w.', 'rrr'], { r: '#e04848', w: '#f6e8c0', b: '#6a4020' }],
  dossier: [['oo...', 'ooooo', 'ooooo', 'ooooo'], { o: '#f0b44a' }],
  ballon: [['.rr.', 'rwrr', 'rrrr', '.rr.'], { r: '#e8483c', w: '#ffffff' }],
  balle: [['.yy.', 'ywyy', 'yyyy', '.yy.'], { y: '#c8f03c', w: '#ffffff' }],
  plot: [['..o..', '.ooo.', '.www.', 'ooooo'], { o: '#ff8c1a', w: '#ffffff' }],
  feuilleV: [['..gg', '.ggg', 'gggg', 'gl..'], { g: '#5cbf50', l: '#2e7d32' }],
  brindille: [['b...', '.b.b', '..b.', '..b.'], { b: '#8a5a2a' }],
  canard: [['.yy..', '.yko', 'yyyy.', '.yyy.'], { y: '#ffd23f', k: '#1a1028', o: '#ff8c1a' }],
  tong: [['.bb.', 'bwwb', 'bbbb', 'bbbb', '.bb.'], { b: '#2fb5e0', w: '#ffffff' }],
  serviette: [['pwpwp', 'pwpwp', 'pwpwp'], { p: '#ff6fa0', w: '#ffffff' }],
  os: [['ww...ww', '.wwwww.', 'ww...ww'], { w: '#f1ead2' }],
  coquillage: [['.ppp.', 'pwpwp', 'ppppp', '.p.p.'], { p: '#ffb0a0', w: '#fff0e8' }],
  caillou: [['.ss.', 'sssd', '.sd.'], { s: '#a8a0b0', d: '#706878' }],
  pq: [['www', 'wgw', 'www', 'w..', 'w..'], { w: '#ffffff', g: '#c8c8d0' }],
  plume: [['..w', '.ww', 'ww.', 'w..'], { w: '#ffffff' }],
  piece: [['.yy.', 'yooy', '.yy.'], { y: '#ffd23f', o: '#e0a020' }],
  pop: [['.w.', 'www', '.w.'], { w: '#fff6d0' }],
  lunettes: [['bb.bb', 'bkbkb'], { b: '#2fb5e0', k: '#1a1028' }],
};
const JUNK_IMG = new Map();
function junkCanvas(kind) {
  let cv = JUNK_IMG.get(kind); if (cv) return cv;
  const [rows, pal] = JUNK_ART[kind] || JUNK_ART.boule, h = rows.length, w = Math.max(...rows.map(r => r.length)), W = w + 2, H = h + 2;
  const px = new PixCtx(W, H);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { px.fillStyle = pal[ch]; px.fillRect(x + 1, y + 1, 1, 1); } }));
  pixPasses(px.d, W, H);   // petite ombre + contour foncé, comme les personnages
  const [c, x] = mkCanvas(W, H), id = x.createImageData(W, H); id.data.set(px.d); x.putImageData(id, 0, 0);
  JUNK_IMG.set(kind, c); return c;
}

// ce qu'on trouve selon le meuble
function junkSetAt(tx, ty) {
  const k = G.m ? G.m.get(tx, ty) : null, pool = !!(G.m && G.m.pools);
  if (pool && (k === K.LOCKER || k === K.CABIN || k === K.COUNTER)) return ['canard', 'tong', 'serviette', 'lunettes', 'chaussette', 'canard'];
  switch (k) {
    case K.DESK: case K.TABLE: case K.MEET: case K.COUNTER: case K.COPIER: return ['feuille', 'boule', 'crayon', 'gomme', 'dossier', 'feuille', 'trognon'];
    case K.ARMOIRE: return ['dossier', 'feuille', 'chaussette', 'livreB', 'boule', 'plume'];
    case K.SHELF: return ['livreR', 'livreB', 'livreV', 'livreR', 'bd', 'feuille'];
    case K.LOCKER: return ['chaussette', 'banane', 'sandwich', 'bd', 'boule', 'chaussette', 'canette'];
    case K.TRASH: return ['boule', 'banane', 'canette', 'trognon', 'boule', 'feuille'];
    case K.BALLBIN: return ['ballon', 'balle', 'ballon', 'plot', 'balle'];
    case K.MATS: case K.BLEACH: return ['balle', 'chaussette', 'plot', 'boule'];
    case K.BUSH: case K.TREE: case K.PLANT: case K.CABANE: return ['feuilleV', 'feuilleV', 'brindille', 'balle', 'feuilleV'];
    case K.VITRINE: return ['os', 'coquillage', 'caillou', 'os', 'feuille'];
    case K.CABIN: return ['tong', 'serviette', 'chaussette', 'canard'];
    case K.BED: return ['plume', 'plume', 'chaussette', 'plume'];
    case K.SOFA: return ['piece', 'pop', 'pop', 'chaussette', 'piece'];
    case K.STALL: return ['pq', 'pq', 'boule'];
    default: return ['boule', 'chaussette', 'feuille', 'balle'];
  }
}
const JUNK_WORDS = { chaussette: 'Beurk !', banane: 'Beurk !', trognon: 'Beurk !', canette: 'Beurk !', sandwich: 'Miam ?', canard: 'Coin !', pq: 'Oups…', plume: 'Atchoum !' };

// ---------- qui fouille, et où ----------
function junkList() { const m = G.m; if (!m) return []; return m.junk || (m.junk = []); }
// la fouille en cours d'un perso : [x, y] du meuble, ou rien
function digTarget(a) {
  if (!a || a.gone || a.hidden || a.out || a.x < -9000) return null;
  if (a.busy && a.busy.dig) return a.busy.dig;
  if (a.net && Array.isArray(a.net.rm)) return a.net.rm;
  // le prof qui inspecte une cachette : la cachette la plus proche
  // le prof qui fouille : ce qu'il est en train d'inspecter (cachette ou meuble)
  if ((a.isTeacher || a === G.T || a === G.T2) && a.state === 'check' && !a.moving && a.searchQ && a.searchQ[a.searchI]) { const s = a.searchQ[a.searchI]; return [s.x * 16 + 8, s.y * 16 + 8]; }
  if ((a.isTeacher || a === G.T || a === G.T2) && a.state === 'check' && !a.moving && G.L && G.L.hides) {
    let best = null, bd = 30;
    for (const s of G.L.hides) { const d = dist(a.x, a.y, s.x * 16 + 8, s.y * 16 + 8); if (d < bd) { bd = d; best = s; } }
    return best ? [best.x * 16 + 8, best.y * 16 + 8] : null;
  }
  return null;
}
// pour le réseau : ce que je fouille (l'autre joueur voit l'animation chez lui)
function digNet() { const b = G.P && G.P.busy; return b && b.dig ? [Math.round(b.dig[0]), Math.round(b.dig[1])] : 0; }

function digUpdate(dt) {
  const actors = [G.P, G.P2, G.T, G.T2];
  for (const a of actors) {
    if (!a) continue;
    const tg = digTarget(a);
    if (!tg) { if (a.digT > 0) { a.digT = 0; a.digSrc = null; } continue; }
    const [fx, fy] = tg, dx = fx - a.x, dy = fy - (a.y - 6), l = Math.hypot(dx, dy) || 1;
    if (!a.digT || !a.digSrc || a.digSrc[0] !== fx || a.digSrc[1] !== fy) {
      // début de fouille : un nuage de poussière, et on se tourne vers le meuble
      a.digSrc = [fx, fy]; a.digN = 0; a.digJ = 0.12; a.digWord = Math.random() < 0.55;
      a.digFace = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx > 0 ? 2 : 3) : dy < 0 ? 1 : 0;
      // derrière une porte, rien ne vole
      const k = G.m.get(Math.floor(fx / 16), Math.floor(fy / 16)); a.digJunk = k !== K.DOOR;
      if (a.vis !== false) for (let i = 0; i < 3; i++) part(fx + rand(-6, 6), fy - 3, 'puff', { vx: rand(-14, 14), vy: rand(-12, -4), life: 0.45, col: '#e8e0d4', size: 1.5 });
    }
    a.digT = 0.2;
    // on se penche vers le meuble, avec un petit tortillement (le perso reste entier, toujours bien visible)
    const wig = Math.sin(G.time * 31 + (a.ph || 0)) * 0.8;
    a.digLx = dx / l * 1.2 + (a.digFace === 1 ? wig : 0); a.digLy = dy / l * 1.2;
    // le bazar vole, un objet toutes les ~0,2 s (le prof, plus lentement)
    a.digJ -= dt;
    if (a.digJ <= 0) {
      const slow = a === G.T || a === G.T2;
      a.digJ = slow ? rand(0.26, 0.38) : rand(0.16, 0.24);
      if (a.digJunk && a.digN < (slow ? 4 : 7)) { a.digN++; junkThrow(a, fx, fy); if (Math.random() < 0.35) part(fx + rand(-7, 7), fy - 2, 'puff', { vx: rand(-12, 12), vy: rand(-10, -2), life: 0.4, col: '#e8e0d4', size: 1.5 }); }
    }
  }
  junkUpdate(dt);
}

// un objet sort du meuble et vole par-dessus l'épaule de celui qui fouille
function junkThrow(a, fx, fy, onHead) {
  const tx = Math.floor(fx / 16), ty = Math.floor(fy / 16), set = junkSetAt(tx, ty), kind = pick(set);
  const ux = a.x - fx, uy = a.y - fy, l = Math.hypot(ux, uy) || 1, sp = rand(28, 62), side = rand(-30, 30);
  const j = { kind, x: fx + rand(-3, 3), y: fy + 6, z: 12, vx: ux / l * sp + (-uy / l) * side, vy: uy / l * sp + (ux / l) * side, vz: rand(75, 120), rot: rand(0, 6.28), vr: rand(-14, 14), t: 0, life: rand(2.6, 3.6), tile: ty * G.m.w + tx, b: 0 };
  if (onHead) { j.head = a; j.hp = 0; j.x0 = j.x; j.y0 = j.y; }
  const L = junkList(); L.push(j); if (L.length > 45) L.shift();
  if (G.mode === 'play' && a.digWord && a.digN === 3 && dist(a.x, a.y, G.P.x, G.P.y) < 160) {
    a.digWord = false; cue(fx, fy - 10, 'word', JUNK_WORDS[kind] || pick(['Fouille, fouille…', 'Hmm…', 'Quel bazar !', 'Pas ça…', 'Ni ça…']), { col: '#ffe9a0', life: 1.1 });
  }
}
// rien trouvé : de temps en temps, un truc retombe pile sur la tête
function junkOnHead(a, tx, ty) { if (Math.random() < 0.4 && G.m.get(tx, ty) !== K.DOOR) junkThrow(a, tx * 16 + 8, ty * 16 + 8, true); }

// hauteur du haut de la tête (les profs sont plus grands ; le gâteau rétrécit)
function headZ(a) { return ((a === G.T || a === G.T2 || a.isTeacher) ? 28 : 22) * (a.small > 0 ? 0.5 : 1) + (a.hz || 0) + (a.lift > 0 ? a.lift : 0); }
function junkSolid(x, y, from) {
  const tx = Math.floor(x / 16), ty = Math.floor(y / 16), k = G.m.get(tx, ty);
  if (ty * G.m.w + tx === from) return false;
  return k == null || (KP[k] && KP[k].solid && k !== K.DOOR && k !== K.WATER);
}
function junkUpdate(dt) {
  const L = G.m && G.m.junk; if (!L || !L.length) return;
  for (let i = L.length - 1; i >= 0; i--) {
    const j = L[i]; j.t += dt;
    if (j.t > j.life) { L.splice(i, 1); continue; }
    if (j.head) {
      const a = j.head;
      if (j.hp < 1) {   // vol en cloche jusqu'à la tête
        j.hp = Math.min(1, j.hp + dt / 0.5); const e = j.hp;
        j.x = lerp(j.x0, a.x, e); j.y = lerp(j.y0, a.y + 0.6, e); j.z = lerp(12, headZ(a), e) + Math.sin(e * Math.PI) * 26; j.rot += j.vr * dt;
        if (j.hp >= 1) { j.rot = rand(-0.3, 0.3); j.stick = 1.5; j.t = 0; j.life = 3.5; squash(a, 3); AU.sfx('boing', 0.35); if (a === G.P) cue(a.x, a.y - 40, 'word', '?!', { col: '#ffffff', life: 0.9 }); }
      } else if (j.stick > 0) {   // posé sur la tête, ça suit le perso
        j.stick -= dt; j.x = a.x; j.y = a.y + 0.6; j.z = headZ(a) + Math.abs(Math.sin(j.t * 6)) * 0.6;
        if (j.stick <= 0 || a.moving || a.hidden) { j.head = null; j.vx = (a.face === 3 ? 1 : -1) * 22; j.vy = 6; j.vz = 40; j.vr = rand(-10, 10); j.b = 0; }
      }
      continue;
    }
    if (j.rest) continue;
    j.vz -= 330 * dt; j.z += j.vz * dt; j.rot += j.vr * dt;
    const nx = j.x + j.vx * dt, ny = j.y + j.vy * dt;
    if (junkSolid(nx, ny, j.tile)) { j.vx *= -0.25; j.vy *= -0.25; } else { j.x = nx; j.y = ny; }
    if (j.z <= 0 && j.vz < 0) {
      const k = G.m.get(Math.floor(j.x / 16), Math.floor(j.y / 16));
      if (k === K.WATER) { if (typeof splashFx === 'function') splashFx(j.x, j.y + 4, 3); L.splice(i, 1); continue; }   // plouf !
      if (j.b < 1) { j.b++; j.z = 0; j.vz = -j.vz * 0.32; j.vx *= 0.45; j.vy *= 0.45; j.vr *= 0.5; if (dist(j.x, j.y, G.P.x, G.P.y) < 120) AU.sfx('tick', 0.12); }
      else { j.z = 0; j.rest = true; j.rot = Math.round(j.rot / (Math.PI / 2)) * (Math.PI / 2) + rand(-0.25, 0.25); }
    }
  }
}
function drawJunk(c, j) {
  const im = junkCanvas(j.kind), a = Math.min(1, (j.life - j.t) / 0.5);
  if (a <= 0) return;
  c.globalAlpha = a;
  if (j.z > 0.5 && !j.head) { c.fillStyle = 'rgba(10,6,20,0.25)'; c.beginPath(); c.ellipse(j.x, j.y, 2.5, 1, 0, 0, 7); c.fill(); }
  c.save(); c.translate(rp(j.x), rp(j.y - j.z)); c.rotate(j.rot); c.drawImage(im, -im.width / 2, -im.height / 2); c.restore();
  c.globalAlpha = 1;
}
