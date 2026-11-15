// ================= PERSONNAGES (pixel art procédural) =================
const SKINS = ['#ffe3c8', '#f6c79a', '#e0a46e', '#b97a4a', '#8a5534', '#5e3a22'];
const HAIRS = ['Court', 'Hérissé', 'Longs', 'Queue de cheval', 'Couettes', 'Afro', 'Rasé', 'Mèche', 'Chignon', 'Au bol', 'Bouclés', 'Crête'];
const HAIRCOLS = [['Noir', '#2b2333'], ['Brun', '#5a3620'], ['Châtain', '#8c5a2e'], ['Roux', '#d0601e'], ['Blond', '#f2c65a'], ['Platine', '#f3ead2'], ['Gris', '#9fa0aa'], ['Bleu', '#3d7bff'], ['Rose', '#ff6fb5'], ['Vert', '#36c46a'], ['Violet', '#9b5cff']];
const EYES = ['Points', 'Grands yeux', 'Heureux', 'Endormis', 'Pétillants', 'Clin d’œil'];
const MOUTHS = ['Sourire', 'Grand sourire', 'Langue tirée', 'Oh !', 'Neutre', 'Dents de lapin'];
const FACEX = ['Rien', 'Taches de rousseur', 'Joues roses', 'Lunettes', 'Lunettes de soleil', 'Pansement'];
const TOPS = ['T-shirt', 'Sweat à capuche', 'Chemise et cravate', 'Robe', 'Salopette', 'Marinière', 'Veste', 'Maillot de foot'];
const CLOTHCOLS = [['Rouge', '#e43b44'], ['Orange', '#f77622'], ['Jaune', '#fec43a'], ['Vert', '#3e8948'], ['Vert pomme', '#63c74d'], ['Turquoise', '#2ce8d5'], ['Bleu', '#0099db'], ['Marine', '#1f4e99'], ['Violet', '#7b45a8'], ['Rose', '#f6757a'], ['Fuchsia', '#e0249a'], ['Blanc', '#f2f2f2'], ['Gris', '#8b9bb4'], ['Noir', '#2a2d44']];
const BOTTOMS = ['Pantalon', 'Short', 'Jupe'];
const SHOECOLS = [['Blanches', '#f4f4f4'], ['Noires', '#25222e'], ['Rouges', '#e43b44'], ['Bleues', '#2b7bd6'], ['Jaunes', '#fec43a'], ['Roses', '#ff8fc8']];
const ACCS = ['Rien', 'Casquette', 'Nœud', 'Couronne', 'Casque audio', 'Bonnet', 'Sac à dos', 'Cape de héros'];
const CHAR_FIELDS = [
  { k: 'skin', label: 'Peau', list: SKINS, swatch: true },
  { k: 'hair', label: 'Coiffure', list: HAIRS },
  { k: 'hairCol', label: 'Couleur des cheveux', list: HAIRCOLS, swatch: true },
  { k: 'eyes', label: 'Yeux', list: EYES },
  { k: 'mouth', label: 'Bouche', list: MOUTHS },
  { k: 'face', label: 'Visage', list: FACEX },
  { k: 'top', label: 'Haut', list: TOPS },
  { k: 'topCol', label: 'Couleur du haut', list: CLOTHCOLS, swatch: true },
  { k: 'bottom', label: 'Bas', list: BOTTOMS },
  { k: 'botCol', label: 'Couleur du bas', list: CLOTHCOLS, swatch: true },
  { k: 'shoes', label: 'Chaussures', list: SHOECOLS, swatch: true },
  { k: 'acc', label: 'Accessoire', list: ACCS },
  { k: 'accCol', label: 'Couleur accessoire', list: CLOTHCOLS, swatch: true },
];
const colOf = (list, i) => { const v = list[((i % list.length) + list.length) % list.length]; return Array.isArray(v) ? v[1] : v; };
const nameOf = (list, i) => { const v = list[((i % list.length) + list.length) % list.length]; return Array.isArray(v) ? v[0] : (typeof v === 'string' && v[0] === '#' ? '' : v); };
function randomChar(name, rf) {
  const r = rf || Math.random, c = { name: name || '' };
  CHAR_FIELDS.forEach(f => c[f.k] = Math.floor(r() * f.list.length));
  if (r() < 0.55) c.acc = 0; if (r() < 0.5) c.face = 0;
  return c;
}
const CHAR_CACHE = new Map();
// libère les sprites les plus anciens (et leur mémoire tout de suite : width = 0, important sur iPhone)
function freeSpriteCache(keep = 0) {
  const n = CHAR_CACHE.size - keep; let i = 0;
  for (const [k, cv] of CHAR_CACHE) { if (i++ >= n) break; CHAR_CACHE.delete(k); try { cv.width = 0; cv.height = 0; } catch (e) { } }
}
function charKey(c, v) {
  let k = CHAR_FIELDS.map(f => c[f.k]).join(',');
  if (v) k += '|' + (v.adult ? 1 : 0) + (v.wide ? 1 : 0) + (v.eyes != null ? v.eyes : '') + (v.extras || []).join('');
  return k;
}
// volume : un peu de lumière en haut à gauche, un peu d'ombre en bas à droite (avant le contour)
function shadePass(cv, x) {
  const w = cv.width, h = cv.height, id = x.getImageData(0, 0, w, h), d = id.data, s = new Uint8ClampedArray(d);
  const op = (i, y) => i >= 0 && i < w && y >= 0 && y < h && s[(y * w + i) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const p = (y * w + i) * 4; if (!s[p + 3]) continue;
    let f = 1;
    if (!op(i + 1, y)) f -= 0.16; if (!op(i, y + 1)) f -= 0.1;
    if (!op(i - 1, y)) f += 0.08; if (!op(i, y - 1)) f += 0.1;
    if (f !== 1) { d[p] = Math.min(255, s[p] * f); d[p + 1] = Math.min(255, s[p + 1] * f); d[p + 2] = Math.min(255, s[p + 2] * f); }
  }
  x.putImageData(id, 0, 0);
}
function outlinePass(cv, x) {
  const w = cv.width, h = cv.height, id = x.getImageData(0, 0, w, h), d = id.data, s = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const p = (y * w + i) * 4; if (s[p + 3]) continue;
    if ((i > 0 && s[p - 1]) || (i < w - 1 && s[p + 7]) || (y > 0 && s[p - w * 4 + 3]) || (y < h - 1 && s[p + w * 4 + 3])) {
      d[p] = 28; d[p + 1] = 18; d[p + 2] = 40; d[p + 3] = 255;
    }
  }
  x.putImageData(id, 0, 0);
}
// ---------- Poses d'animation (exagérées, style dessin animé) ----------
// n = jambe proche, f = jambe éloignée : [avance, levée (fraction)] ; na/fa = bras : [avance, hauteur]
const POSE = {
  idle: [{ n: [0.5, 0], f: [-0.5, 0], na: [0, 0], fa: [0, 0], bob: 0, sq: 0 }],
  tap: [{ n: [1.5, 0.4], f: [-0.5, 0], na: [0, 0], fa: [0, 0], bob: 0, sq: 0.04 }],
  walk: [
    { n: [3, 0], f: [-3, 0.15], na: [-2, 0], fa: [2, -1], bob: 0, sq: 0.08 },
    { n: [0, 0], f: [0.5, 0.65], na: [0, 0], fa: [0, 0], bob: 2.2, sq: -0.06 },
    { n: [-3, 0.15], f: [3, 0], na: [2, -1], fa: [-2, 0], bob: 0, sq: 0.08 },
    { n: [0.5, 0.65], f: [0, 0], na: [0, 0], fa: [0, 0], bob: 2.2, sq: -0.06 }],
  run: [
    { n: [4, 0], f: [-4, 0.3], na: [-3, -1], fa: [4, -3], bob: 0, sq: 0.15 },
    { n: [1, 0], f: [-1, 0.85], na: [-1, 0], fa: [2, -1], bob: 1.8, sq: 0.05 },
    { n: [-3, 0.35], f: [3, 0.95], na: [2, -2], fa: [-2, 0], bob: 5, sq: -0.17 },
    { n: [-4, 0.3], f: [4, 0], na: [4, -3], fa: [-3, -1], bob: 0, sq: 0.15 },
    { n: [-1, 0.85], f: [1, 0], na: [2, -1], fa: [-1, 0], bob: 1.8, sq: 0.05 },
    { n: [3, 0.95], f: [-3, 0.35], na: [-2, 0], fa: [2, -2], bob: 5, sq: -0.17 }],
  sneak: [
    { n: [3, 1], f: [-1, 0.15], na: [3, -4], fa: [4, -3], bob: 2.8, sq: -0.02, arms: 'sneak' },
    { n: [3, 0.15], f: [-2, 0.3], na: [3, -3.5], fa: [4, -3.5], bob: 0.8, sq: 0.1, arms: 'sneak' },
    { n: [-1, 0.15], f: [3, 1], na: [4, -3], fa: [3, -4], bob: 2.8, sq: -0.02, arms: 'sneak' },
    { n: [-2, 0.3], f: [3, 0.15], na: [3.5, -3.5], fa: [3, -3.5], bob: 0.8, sq: 0.1, arms: 'sneak' }],
  skid: [{ n: [5, 0], f: [-1, 0.5], na: [-3, -4], fa: [-2, -3], bob: 0, sq: 0.12, arms: 'skid' }],
};
const STRIDE = { walk: 20, run: 30, sneak: 14 };
const CONTACT = { walk: [0, 2], run: [0, 3], sneak: [1, 3] };
const LEAN = { run: 0.17, walk: 0.03, sneak: 0.07, skid: -0.26, idle: 0, tap: 0 };
function poseOf(gait, frame) {
  if (gait === 'basic') return frame === 1 ? POSE.walk[0] : frame === 2 ? POSE.walk[2] : POSE.idle[0];
  const L = POSE[gait] || POSE.idle; return L[((frame % L.length) + L.length) % L.length];
}
function limb(R, x0, y0, x1, y1, col, col2, split) {
  const L = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), n = Math.max(1, Math.ceil(L * 1.6));
  for (let i = 0; i <= n; i++) { const t = i / n; R(Math.round(x0 + (x1 - x0) * t - 1), Math.round(y0 + (y1 - y0) * t - 0.5), 2, 2, (col2 && t > split) ? col2 : col); }
}
// dir: 0 face, 1 dos, 2 profil (droite)
function charCanvas(cfg, dir, frame, v, gait = 'basic') {
  const key = charKey(cfg, v) + '|' + dir + '|' + gait + frame;
  let c = CHAR_CACHE.get(key); if (c) return c;
  const [cv, x] = mkCanvas(20, 34);
  drawCharInto(x, cfg, dir, frame, v || {}, gait);
  shadePass(cv, x); outlinePass(cv, x);
  if (CHAR_CACHE.size > 1400) freeSpriteCache(700);
  CHAR_CACHE.set(key, cv); return cv;
}
function drawCharInto(x, c, dir, frame, v, gait) {
  const R = (a, b, w, h, col) => { if (w <= 0 || h <= 0) return; x.fillStyle = col; x.fillRect(a, b, w, h); };
  const pose = poseOf(gait, frame);
  const adult = !!v.adult, W = !!v.wide;
  const H = adult ? 6 : 12, T = adult ? 16 : 22, TR = adult ? 8 : 5, HIP = T + TR, S = 31, LL = S - (HIP + 1);
  const sk = SKINS[((c.skin % SKINS.length) + SKINS.length) % SKINS.length], skd = shade(sk, -0.2);
  const hc = colOf(HAIRCOLS, c.hairCol), hd = shade(hc, -0.32), hl = shade(hc, 0.28);
  const tc = colOf(CLOTHCOLS, c.topCol), td = shade(tc, -0.28);
  let bc = colOf(CLOTHCOLS, c.botCol); if (c.top === 4) bc = tc; const bd = shade(bc, -0.28);
  const sc = colOf(SHOECOLS, c.shoes), sd = shade(sc, -0.35);
  const ac = colOf(CLOTHCOLS, c.accCol), ad = shade(ac, -0.28);
  const ex = v.extras || [];
  const eyes = v.eyes != null ? v.eyes : c.eyes;
  const pants = (c.bottom === 0 || c.top === 4) && c.top !== 3;
  const shorts = c.bottom === 1 && c.top !== 3 && c.top !== 4;
  const legCol = pants ? bc : sk, thighCol = (pants || shorts) ? bc : sk;
  const GOLD = '#ffd23f';
  const dk = col => shade(col, -0.2);
  let sleeveN = 2, sleeveC = tc;
  if (c.top === 1 || c.top === 2 || c.top === 5 || c.top === 6) sleeveN = 12;
  if (c.top === 3) sleeveN = 1;
  if (c.top === 4 || c.top === 5) sleeveC = '#f2f2f2';
  const liftPx = l => Math.min(LL - 1, Math.round(l * LL));

  if (dir === 0 || dir === 1) {
    const back = dir === 1;
    const tx0 = W ? 3 : 6, tw = W ? 14 : 8, tx1 = tx0 + tw - 1;
    if (c.acc === 7 && !back) R(tx0 - 1, T + 1, tw + 2, TR + 3, ad);
    // jambes (éloignée à gauche, proche à droite)
    [[7, pose.f, -1], [11, pose.n, 1]].forEach(([lx, [dx, l], out]) => {
      const lp = liftPx(l), spread = (lp === 0 && Math.abs(dx) >= 3) ? out : 0, top = HIP + 1, xx = lx + spread, len = S - top - lp;
      R(xx, top, 2, len, legCol); if (shorts) R(xx, top, 2, Math.max(1, Math.round(len * 0.35)), bc);
      if (lp >= 2) R(xx, top + len - 1, 2, 1, dk(legCol));
      const sx0 = lx === 7 ? xx - 1 : xx; R(sx0, S - lp, 3, 2, sc); R(sx0, S + 1 - lp, 3, 1, sd);
      if (lp >= 2 && !back) R(sx0, S + 1 - lp, 3, 1, shade(sc, -0.5));
    });
    // haut
    switch (c.top) {
      case 0: R(tx0, T, tw, TR, tc); R(tx0, T + TR - 1, tw, 1, td); if (!back) R(9, T, 2, 1, sk); break;
      case 1: R(tx0, T, tw, TR, tc); R(tx0 + 1, T, tw - 2, 1, td);
        if (!back) { R(tx0 + 2, T + TR - 2, tw - 4, 2, td); R(9, T + 1, 1, 2, '#f2f2f2'); R(10, T + 1, 1, 2, '#f2f2f2'); } else R(tx0 + 2, T, tw - 4, 2, td); break;
      case 2: R(tx0, T, tw, TR, tc); if (!back) { R(8, T, 1, 1, '#ffffff'); R(11, T, 1, 1, '#ffffff'); R(9, T, 2, 1, '#b71c1c'); R(9, T + 1, 2, TR - 2, '#d32f2f'); R(9, T + TR - 1, 2, 1, '#b71c1c'); } break;
      case 3: R(tx0, T, tw, TR, tc); R(tx0, T + TR - 1, tw, 1, td); if (!back) R(9, T, 2, 1, sk); break;
      case 4: R(tx0, T, tw, TR, '#f2f2f2'); R(tx0 + 1, T + 1, tw - 2, TR - 1, tc); R(tx0 + 1, T, 1, 1, tc); R(tx1 - 1, T, 1, 1, tc); if (!back) R(9, T + 2, 2, 1, td); break;
      case 5: R(tx0, T, tw, TR, '#f2f2f2'); for (let r = 1; r < TR; r += 2) R(tx0, T + r, tw, 1, tc); break;
      case 6: R(tx0, T, tw, TR, tc); if (!back) { R(tx0 + 2, T, tw - 4, TR, '#f2f2f2'); R(tx0 + 2, T, 1, 2, td); R(tx1 - 2, T, 1, 2, td); } break;
      case 7: R(tx0, T, tw, TR, tc); R(tx0, T, 1, TR, '#ffffff'); R(tx1, T, 1, TR, '#ffffff'); R(9, T + 1, 2, 1, '#ffffff'); R(10, T + 2, 1, TR - 3, '#ffffff'); break;
    }
    if (W) { x.clearRect(tx0, T, 1, 1); x.clearRect(tx1, T, 1, 1); R(tx0 + 2, T + TR - 2, tw - 4, 1, td); }
    // bras
    let handY = T + TR - 1;
    const armF = (ax, out, [dx, dy], isRight) => {
      if (pose.arms === 'sneak') { R(ax, T, 1, 3, sleeveC); R(ax - out, T + 2, 1, 1, sleeveC); R(ax - out * 2, T + 1, 1, 2, sk); if (isRight) handY = T + 1; return; }
      if (pose.arms === 'skid') { R(ax + out, T - 3, 1, 4, sleeveC); R(ax + out, T - 4, 1, 1, sk); R(ax + out * 2, T - 5, 1, 1, sk); if (isRight) handY = T - 4; return; }
      const fore = clamp(Math.round(-dy), 0, 3), len = TR - fore, ox = Math.abs(dx) >= 3 ? out : 0;
      R(ax + ox, T, 1, len, sk); R(ax + ox, T, 1, Math.min(sleeveN, len - 1), sleeveC);
      if (c.top === 5 && sleeveN > 2) for (let r = 1; r < len - 1; r += 2) R(ax + ox, T + r, 1, 1, tc);
      if (isRight) handY = T + len - 1;
    };
    armF(tx0 - 1, -1, pose.fa, false); armF(tx1 + 1, 1, pose.na, true);
    // bas
    if (c.top === 3) { R(tx0 - 1, HIP, tw + 2, 3, tc); R(tx0 - 1, HIP + 2, tw + 2, 1, td); }
    else if (c.bottom === 2) { R(tx0 - 1, HIP, tw + 2, 2, bc); R(tx0 - 1, HIP + 1, tw + 2, 1, bd); }
    else R(tx0, HIP, tw, 1, bc);
    if (!back) {
      if (ex.includes('perles')) { R(7, T + 1, 1, 1, '#fff'); R(8, T + 2, 1, 1, '#fff'); R(9, T + 2, 1, 1, '#fff'); R(10, T + 2, 1, 1, '#fff'); R(11, T + 2, 1, 1, '#fff'); R(12, T + 1, 1, 1, '#fff'); }
      if (ex.includes('sifflet')) { R(8, T, 1, 2, '#dddddd'); R(9, T + 2, 1, 1, '#dddddd'); R(9, T + 3, 2, 1, '#c0c8d8'); }
      if (c.acc === 6) { R(tx0 + 1, T, 1, TR - 1, ad); R(tx1 - 1, T, 1, TR - 1, ad); }
      if (c.acc === 7) R(tx0, T, 2, 1, GOLD);
    }
    if (ex.includes('carnet')) { R(tx1 + 1, handY - 2, 3, 4, '#2f6fdf'); R(tx1 + 1, handY - 2, 3, 1, '#9fc0ff'); }
    if (ex.includes('livre')) { R(tx1 + 1, handY - 2, 3, 4, '#c0392b'); R(tx1 + 3, handY - 2, 1, 4, '#fff6e0'); }
    if (ex.includes('talkie')) { R(tx0 - 3, T + 2, 2, 4, '#222'); R(tx0 - 3, T, 1, 2, '#222'); }
    // tête
    R(6, H, 8, 10, sk); R(5, H + 1, 10, 8, sk); R(6, H + 9, 8, 1, skd);
    R(4, H + 4, 1, 2, skd); R(15, H + 4, 1, 2, skd);
    if (!back) faceFront(R, H, eyes, c, sk, hd, ex);
    hairFB(R, c.hair, back, H, hc, hd, hl, adult);
    headAccFB(R, c.acc, back, H, ac, ad, ex);
    if (back) {
      if (c.acc === 6) { R(tx0 + 1, T + 1, tw - 2, TR - 1, ac); R(tx0 + 2, T + 2, tw - 4, 1, ad); R(tx0 + 3, T + TR - 2, tw - 6, 1, ad); }
      if (c.acc === 7) { R(tx0 - 1, T, tw + 2, TR + 4, ac); R(tx0 - 1, T + TR + 3, tw + 2, 1, ad); }
    }
  } else {
    // ---------- profil droit ----------
    const stx0 = W ? 4 : 7, stw = W ? 11 : 6, stx1 = stx0 + stw - 1, hipX = 9.5;
    if (c.acc === 7) R(stx0 - 2, T + 1, 3, TR + 4, ad);
    if (c.acc === 6) { R(stx0 - 3, T + 1, 3, TR - 1, ac); R(stx0 - 3, T + 2, 3, 1, ad); }
    const k = adult ? 1.15 : 1;
    const leg = ([dx, l], far) => {
      const lp = liftPx(l), fx = hipX + dx * k, fy = S - 1 - lp, top = HIP + 1;
      const th = far ? dk(thighCol) : thighCol, sh = far ? dk(legCol) : legCol;
      if (lp >= 2 && LL >= 5) { const kx = hipX + Math.max(dx * k, 0) * 0.55 + 2.2, ky = top + LL * 0.42; limb(R, hipX, top, kx, ky, th); limb(R, kx, ky, fx, fy, sh); }
      else limb(R, hipX, top, fx, fy, th, sh, 0.4);
      const sx0 = Math.round(fx - 1); R(sx0, S - lp, 3, 2, far ? sd : sc); R(sx0, S + 1 - lp, 3, 1, sd);
    };
    const arm = ([dx, dy], far) => {
      const hx = clamp(9.5 + dx * (adult ? 1.1 : 0.9), 1, 18), hy = clamp(T + TR - 1 + dy * (adult ? 1 : 0.8), T - 4, 31);
      const sf = Math.min(sleeveN, TR - 1) / TR;
      const s1 = far ? dk(sleeveC) : sleeveC, s2 = far ? dk(sk) : sk;
      limb(R, 9.5, T + 1, hx, hy, s1, s2, sf);
      R(Math.round(hx - 1), Math.round(hy - 0.5), 2, 2, s2);
      return [hx, hy];
    };
    leg(pose.f, true);
    arm(pose.fa, true);
    leg(pose.n, false);
    switch (c.top) {
      case 4: R(stx0, T, stw, TR, '#f2f2f2'); R(stx0 + 2, T + 1, stw - 2, TR - 1, tc); R(stx1 - 1, T, 1, 1, tc); break;
      case 5: R(stx0, T, stw, TR, '#f2f2f2'); for (let r = 1; r < TR; r += 2) R(stx0, T + r, stw, 1, tc); break;
      case 6: R(stx0, T, stw, TR, tc); R(stx1 - 1, T, 2, TR, '#f2f2f2'); break;
      case 2: R(stx0, T, stw, TR, tc); R(stx1, T + 1, 1, TR - 2, '#d32f2f'); R(stx1, T, 1, 1, '#fff'); break;
      case 1: R(stx0, T, stw, TR, tc); R(stx0 - 1, T, 2, 2, td); R(stx1 - 1, T + TR - 2, 2, 2, td); break;
      case 7: R(stx0, T, stw, TR, tc); R(stx0 + 2, T + 1, 2, TR - 2, '#fff'); break;
      default: R(stx0, T, stw, TR, tc); R(stx0, T + TR - 1, stw, 1, td);
    }
    if (W) { R(stx1 + 1, T + 2, 1, TR - 3, tc); x.clearRect(stx0, T, 1, 1); }
    if (c.top === 3) { R(stx0 - 1, HIP, stw + 2, 3, tc); R(stx0 - 1, HIP + 2, stw + 2, 1, td); }
    else if (c.bottom === 2) { R(stx0 - 1, HIP, stw + 2, 2, bc); R(stx0 - 1, HIP + 1, stw + 2, 1, bd); }
    else R(stx0, HIP, stw, 1, bc);
    if (ex.includes('perles')) { R(stx1 - 1, T + 1, 1, 1, '#fff'); R(stx1, T + 2, 1, 1, '#fff'); }
    if (ex.includes('sifflet')) { R(stx1, T + 1, 1, 2, '#ddd'); R(stx1 + 1, T + 3, 1, 1, '#c0c8d8'); }
    const [hx, hy] = arm(pose.na, false);
    if (ex.includes('carnet')) R(Math.round(hx), Math.round(hy - 2), 3, 3, '#2f6fdf');
    if (ex.includes('livre')) R(Math.round(hx), Math.round(hy - 2), 3, 3, '#c0392b');
    // tête
    R(6, H, 8, 10, sk); R(5, H + 1, 10, 8, sk); R(6, H + 9, 8, 1, skd);
    R(15, H + 5, 1, 2, sk); R(8, H + 4, 2, 2, skd);
    faceSide(R, H, eyes, c, sk, hd, ex);
    hairSide(R, c.hair, H, hc, hd, hl);
    headAccSide(R, c.acc, H, ac, ad, ex);
  }
}
function faceFront(R, H, eyes, c, sk, hd, ex) {
  const E = '#1d1626', M = '#7a2836', ey = H + 5, my = H + 8;
  switch (eyes) {
    case 0: R(7, ey, 2, 2, E); R(11, ey, 2, 2, E); R(7, ey, 1, 1, '#fff'); R(11, ey, 1, 1, '#fff'); break;
    case 1: R(7, ey - 1, 2, 3, '#fff'); R(11, ey - 1, 2, 3, '#fff'); R(8, ey, 1, 2, E); R(12, ey, 1, 2, E); break;
    case 2: R(7, ey + 1, 1, 1, E); R(8, ey, 1, 1, E); R(9, ey + 1, 1, 1, E); R(10, ey + 1, 1, 1, E); R(11, ey, 1, 1, E); R(12, ey + 1, 1, 1, E); break;
    case 3: R(7, ey + 1, 2, 1, E); R(11, ey + 1, 2, 1, E); break;
    case 4: R(7, ey - 1, 2, 3, E); R(11, ey - 1, 2, 3, E); R(7, ey - 1, 1, 1, '#fff'); R(11, ey - 1, 1, 1, '#fff'); R(8, ey + 1, 1, 1, '#9fd7ff'); R(12, ey + 1, 1, 1, '#9fd7ff'); break;
    case 5: R(7, ey, 2, 2, E); R(7, ey, 1, 1, '#fff'); R(11, ey + 1, 2, 1, E); R(13, ey, 1, 1, E); break;
    case 6: [8, 12].forEach(x => { R(x, ey - 1, 1, 3, '#ffd23f'); R(x - 1, ey, 3, 1, '#ffd23f'); R(x, ey, 1, 1, '#ffffff'); }); R(6, ey + 2, 1, 1, '#ff8fb0'); R(13, ey + 2, 1, 1, '#ff8fb0'); break;
  }
  if (eyes === 6) { R(8, my - 1, 4, 2, M); R(9, my, 2, 1, '#ff6b8a'); if (ex.includes('moustache')) R(8, my - 2, 4, 1, hd); return; }   // bouche toute émerveillée, pas de lunettes devant les étoiles
  switch (c.mouth) {
    case 0: R(9, my, 2, 1, M); R(8, my - 1, 1, 1, M); R(11, my - 1, 1, 1, M); break;
    case 1: R(8, my - 1, 4, 2, M); R(9, my - 1, 2, 1, '#fff'); break;
    case 2: R(8, my, 4, 1, M); R(10, my + 1, 1, 1, '#ff6b8a'); break;
    case 3: R(9, my - 1, 2, 2, '#5b1a24'); break;
    case 4: R(9, my, 2, 1, M); break;
    case 5: R(8, my - 1, 4, 1, M); R(9, my, 2, 1, '#fff'); break;
  }
  const fc = shade(sk, -0.32), F = '#2a2a3a';
  switch (c.face) {
    case 1: R(6, ey + 2, 1, 1, fc); R(8, ey + 2, 1, 1, fc); R(11, ey + 2, 1, 1, fc); R(13, ey + 2, 1, 1, fc); break;
    case 2: R(6, ey + 2, 2, 1, '#ff8fa3'); R(12, ey + 2, 2, 1, '#ff8fa3'); break;
    case 3: [7, 11].forEach(e => { R(e - 1, ey - 1, 4, 1, F); R(e - 1, ey + 2, 4, 1, F); R(e - 1, ey - 1, 1, 4, F); R(e + 2, ey - 1, 1, 4, F); }); break;
    case 4: R(6, ey - 1, 8, 3, '#15151f'); R(5, ey, 1, 1, '#15151f'); R(14, ey, 1, 1, '#15151f'); R(7, ey - 1, 1, 1, '#6a7cff'); R(11, ey - 1, 1, 1, '#6a7cff'); break;
    case 5: R(11, ey + 2, 3, 2, '#f5d6a0'); R(12, ey + 2, 1, 2, '#e3b67a'); break;
  }
  if (ex.includes('moustache')) R(8, my - 1, 4, 1, hd);
}
function faceSide(R, H, eyes, c, sk, hd, ex) {
  const E = '#1d1626', M = '#7a2836', ey = H + 5, my = H + 8;
  switch (eyes) {
    case 1: R(12, ey - 1, 2, 3, '#fff'); R(13, ey, 1, 2, E); break;
    case 2: R(11, ey + 1, 1, 1, E); R(12, ey, 1, 1, E); R(13, ey + 1, 1, 1, E); break;
    case 3: R(12, ey + 1, 2, 1, E); break;
    case 4: R(12, ey - 1, 2, 3, E); R(12, ey - 1, 1, 1, '#fff'); break;
    case 6: R(13, ey - 1, 1, 3, '#ffd23f'); R(12, ey, 3, 1, '#ffd23f'); R(13, ey, 1, 1, '#ffffff'); break;
    default: R(12, ey, 2, 2, E); R(12, ey, 1, 1, '#fff');
  }
  switch (c.mouth) {
    case 1: R(12, my - 1, 3, 2, M); R(13, my - 1, 2, 1, '#fff'); break;
    case 2: R(12, my, 3, 1, M); R(14, my + 1, 1, 1, '#ff6b8a'); break;
    case 3: R(13, my - 1, 2, 2, '#5b1a24'); break;
    case 4: R(12, my, 2, 1, M); break;
    case 5: R(12, my - 1, 3, 1, M); R(13, my, 1, 1, '#fff'); break;
    default: R(12, my, 2, 1, M); R(14, my - 1, 1, 1, M);
  }
  const fc = shade(sk, -0.32), F = '#2a2a3a';
  switch (c.face) {
    case 1: R(11, ey + 2, 1, 1, fc); R(13, ey + 2, 1, 1, fc); break;
    case 2: R(11, ey + 2, 2, 1, '#ff8fa3'); break;
    case 3: R(11, ey - 1, 4, 1, F); R(11, ey + 2, 4, 1, F); R(11, ey - 1, 1, 4, F); R(14, ey - 1, 1, 4, F); R(8, ey, 3, 1, F); break;
    case 4: R(11, ey - 1, 4, 3, '#15151f'); R(8, ey, 3, 1, '#15151f'); R(12, ey - 1, 1, 1, '#6a7cff'); break;
    case 5: R(12, ey + 2, 3, 1, '#f5d6a0'); break;
  }
  if (ex.includes('moustache')) R(13, my - 1, 3, 1, hd);
}
function hairFB(R, st, back, H, hc, hd, hl, adult) {
  const L = adult ? 10 : 11;
  const cap = (h) => { R(6, H - 1, 8, 1, hc); R(5, H, 10, h, hc); };
  if (back) {
    const gen = () => { R(6, H - 1, 8, 1, hc); R(5, H, 10, 7, hc); R(6, H + 7, 8, 1, hc); };
    switch (st) {
      case 0: gen(); R(7, H - 1, 4, 1, hl); break;
      case 1: gen(); R(6, H - 3, 1, 2, hc); R(8, H - 4, 2, 3, hc); R(10, H - 3, 1, 2, hc); R(12, H - 4, 2, 3, hc); break;
      case 2: gen(); R(5, H + 7, 10, 6, hc); R(4, H + 2, 1, 10, hc); R(15, H + 2, 1, 10, hc); R(7, H + 9, 1, 3, hd); R(12, H + 9, 1, 3, hd); break;
      case 3: gen(); R(9, H + 7, 2, 7, hc); R(9, H + 6, 2, 1, '#ff4f8b'); break;
      case 4: gen(); R(2, H + 3, 3, 4, hc); R(15, H + 3, 3, 4, hc); R(4, H + 4, 1, 2, '#ff4f8b'); R(15, H + 4, 1, 2, '#ff4f8b'); break;
      case 5: R(5, H - 4, 10, 1, hc); R(4, H - 3, 12, 2, hc); R(3, H - 1, 14, 9, hc); R(5, H + 8, 10, 1, hc); R(6, H - 2, 2, 1, hl); R(11, H, 2, 1, hl); break;
      case 6: R(6, H - 1, 8, 1, hd); R(5, H, 10, 7, hd); break;
      case 7: gen(); break;
      case 8: gen(); R(7, H - 4, 6, 4, hc); R(8, H - 5, 4, 1, hc); R(8, H - 4, 2, 1, hl); break;
      case 9: R(6, H - 2, 8, 1, hc); R(5, H - 1, 10, 8, hc); R(4, H, 1, 6, hc); R(15, H, 1, 6, hc); break;
      case 10: gen(); R(4, H - 1, 1, 8, hc); R(15, H - 1, 1, 8, hc); R(6, H, 1, 1, hl); R(9, H + 2, 1, 1, hl); R(12, H + 1, 1, 1, hl); R(7, H + 5, 1, 1, hl); R(11, H + 5, 1, 1, hl); break;
      case 11: R(5, H, 10, 6, hd); R(8, H - 5, 4, 12, hc); R(9, H - 6, 2, 1, hc); break;
    }
    return;
  }
  switch (st) {
    case 0: cap(3); R(5, H + 3, 1, 2, hc); R(14, H + 3, 1, 2, hc); R(7, H + 3, 2, 1, hc); R(11, H + 3, 1, 1, hc); R(7, H - 1, 3, 1, hl); break;
    case 1: cap(3); R(6, H - 3, 1, 2, hc); R(7, H - 2, 1, 1, hc); R(8, H - 4, 2, 3, hc); R(10, H - 3, 1, 2, hc); R(12, H - 4, 2, 3, hc); R(14, H - 2, 1, 2, hc); R(5, H + 3, 1, 1, hc); R(8, H + 3, 1, 1, hc); R(12, H + 3, 1, 1, hc); R(9, H - 3, 1, 1, hl); break;
    case 2: cap(3); R(4, H + 1, 2, L, hc); R(14, H + 1, 2, L, hc); R(6, H + 3, 3, 1, hc); R(11, H + 3, 2, 1, hc); R(7, H - 1, 3, 1, hl); R(4, H + 4, 1, 4, hd); R(15, H + 4, 1, 4, hd); break;
    case 3: cap(3); R(5, H + 3, 1, 2, hc); R(14, H + 3, 1, 2, hc); R(6, H + 3, 2, 1, hc); R(8, H - 3, 4, 2, hc); R(9, H - 2, 2, 1, '#ff4f8b'); R(7, H - 1, 3, 1, hl); break;
    case 4: cap(3); R(6, H + 3, 3, 1, hc); R(11, H + 3, 3, 1, hc); R(2, H + 3, 3, 4, hc); R(15, H + 3, 3, 4, hc); R(4, H + 4, 1, 2, '#ff4f8b'); R(15, H + 4, 1, 2, '#ff4f8b'); R(7, H - 1, 3, 1, hl); break;
    case 5: R(5, H - 4, 10, 1, hc); R(4, H - 3, 12, 2, hc); R(3, H - 1, 14, 4, hc); R(3, H + 3, 2, 3, hc); R(15, H + 3, 2, 3, hc); R(6, H - 3, 2, 1, hl); R(11, H - 2, 1, 1, hl); R(4, H, 1, 1, hl); R(13, H + 1, 1, 1, hl); break;
    case 6: R(6, H - 1, 8, 1, hc); R(5, H, 10, 1, hc); R(5, H + 1, 1, 2, hc); R(14, H + 1, 1, 2, hc); break;
    case 7: cap(3); R(5, H + 3, 6, 2, hc); R(5, H + 5, 2, 1, hc); R(14, H + 3, 1, 2, hc); R(6, H, 4, 1, hl); break;
    case 8: cap(3); R(5, H + 3, 1, 1, hc); R(14, H + 3, 1, 1, hc); R(7, H - 5, 6, 4, hc); R(8, H - 6, 4, 1, hc); R(8, H - 5, 2, 1, hl); break;
    case 9: R(6, H - 2, 8, 1, hc); R(5, H - 1, 10, 5, hc); R(4, H, 1, 6, hc); R(15, H, 1, 6, hc); R(7, H - 1, 4, 1, hl); break;
    case 10: R(5, H - 2, 10, 5, hc); R(4, H - 1, 1, 7, hc); R(15, H - 1, 1, 7, hc); R(6, H - 3, 2, 1, hc); R(9, H - 3, 2, 1, hc); R(12, H - 3, 2, 1, hc); R(6, H + 3, 1, 1, hc); R(9, H + 3, 1, 1, hc); R(12, H + 3, 1, 1, hc); R(6, H - 1, 1, 1, hl); R(9, H, 1, 1, hl); R(12, H - 1, 1, 1, hl); R(4, H + 2, 1, 1, hl); R(15, H + 3, 1, 1, hl); break;
    case 11: R(8, H - 5, 4, 7, hc); R(9, H - 6, 2, 1, hc); R(9, H - 5, 1, 3, hl); R(5, H, 3, 2, hd); R(12, H, 3, 2, hd); break;
  }
}
function hairSide(R, st, H, hc, hd, hl) {
  const base = () => { R(6, H - 1, 8, 1, hc); R(5, H, 10, 3, hc); R(5, H + 3, 4, 4, hc); R(5, H + 7, 2, 1, hc); };
  switch (st) {
    case 0: base(); R(12, H + 3, 2, 1, hc); R(7, H - 1, 4, 1, hl); break;
    case 1: base(); R(4, H - 2, 2, 2, hc); R(6, H - 3, 2, 2, hc); R(9, H - 4, 2, 3, hc); R(12, H - 3, 2, 2, hc); R(14, H - 1, 1, 2, hc); break;
    case 2: base(); R(4, H + 2, 5, 11, hc); R(12, H + 3, 2, 1, hc); R(5, H + 4, 1, 8, hd); break;
    case 3: base(); R(2, H + 2, 3, 6, hc); R(3, H + 1, 2, 1, '#ff4f8b'); R(2, H + 4, 1, 3, hd); break;
    case 4: base(); R(2, H + 3, 3, 4, hc); R(4, H + 3, 1, 2, '#ff4f8b'); break;
    case 5: R(4, H - 4, 11, 1, hc); R(3, H - 3, 13, 6, hc); R(3, H + 3, 7, 4, hc); R(6, H - 3, 2, 1, hl); R(11, H - 2, 1, 1, hl); break;
    case 6: R(6, H - 1, 7, 1, hd); R(5, H, 9, 1, hd); R(5, H + 1, 3, 4, hd); break;
    case 7: base(); R(11, H + 3, 4, 2, hc); R(13, H + 5, 2, 1, hc); R(8, H, 4, 1, hl); break;
    case 8: base(); R(3, H - 3, 5, 4, hc); R(4, H - 2, 2, 1, hl); break;
    case 9: R(5, H - 2, 10, 1, hc); R(4, H - 1, 12, 5, hc); R(4, H + 4, 5, 3, hc); R(7, H - 1, 4, 1, hl); break;
    case 10: base(); R(4, H - 2, 9, 3, hc); R(4, H + 2, 2, 6, hc); R(6, H - 1, 1, 1, hl); R(10, H - 1, 1, 1, hl); R(5, H + 4, 1, 1, hl); break;
    case 11: R(6, H - 5, 8, 5, hc); R(7, H - 6, 6, 1, hc); R(5, H + 1, 4, 4, hd); R(8, H - 4, 4, 1, hl); break;
  }
}
function headAccFB(R, acc, back, H, ac, ad, ex) {
  const GOLD = '#ffd23f';
  if (ex.includes('bandeau')) { R(5, H + 2, 10, 1, '#ffffff'); }
  switch (acc) {
    case 1: R(5, H - 2, 10, 3, ac); if (!back) { R(4, H + 1, 12, 1, ad); R(9, H - 2, 2, 1, shade(ac, 0.3)); } else { R(5, H + 1, 10, 1, ac); R(7, H + 1, 6, 1, ad); } break;
    case 2: R(10, H - 3, 2, 2, '#ff4f8b'); R(13, H - 3, 2, 2, '#ff4f8b'); R(12, H - 2, 1, 1, '#c2185b'); break;
    case 3: R(6, H - 3, 8, 2, GOLD); R(6, H - 5, 1, 2, GOLD); R(9, H - 6, 2, 3, GOLD); R(13, H - 5, 1, 2, GOLD); R(9, H - 3, 2, 1, '#e43b44'); break;
    case 4: R(5, H - 3, 10, 1, '#25222e'); R(4, H - 2, 1, 4, '#25222e'); R(15, H - 2, 1, 4, '#25222e'); R(3, H + 3, 2, 4, ac); R(15, H + 3, 2, 4, ac); break;
    case 5: R(5, H - 3, 10, 5, ac); R(5, H + 1, 10, 1, ad); R(9, H - 5, 2, 2, '#ffffff'); R(6, H - 2, 1, 2, shade(ac, 0.25)); break;
  }
}
function headAccSide(R, acc, H, ac, ad, ex) {
  const GOLD = '#ffd23f';
  if (ex.includes('bandeau')) R(5, H + 2, 10, 1, '#ffffff');
  switch (acc) {
    case 1: R(5, H - 2, 10, 3, ac); R(13, H + 1, 4, 1, ad); break;
    case 2: R(6, H - 3, 2, 2, '#ff4f8b'); R(9, H - 3, 2, 2, '#ff4f8b'); R(8, H - 2, 1, 1, '#c2185b'); break;
    case 3: R(6, H - 3, 8, 2, GOLD); R(6, H - 5, 1, 2, GOLD); R(9, H - 6, 2, 3, GOLD); R(13, H - 5, 1, 2, GOLD); R(10, H - 3, 2, 1, '#e43b44'); break;
    case 4: R(5, H - 3, 9, 1, '#25222e'); R(7, H + 2, 3, 5, ac); R(8, H + 3, 1, 3, ad); break;
    case 5: R(5, H - 3, 10, 5, ac); R(5, H + 1, 10, 1, ad); R(3, H - 4, 2, 2, '#ffffff'); break;
  }
}

// ================= OBJETS MAGIQUES =================
const ITEMS = {
  cake: { n: 'Gâteau « Mange-moi »', d: 'Rétrécis et passe sous les portes.', short: 'Rétrécir' },
  lamp: { n: 'Lampe magique', d: 'Le génie te planque loin du prof.', short: 'Génie' },
  slipper: { n: 'Pantoufle de verre', d: '10 s de course rapide et muette.', short: 'Silence' },
  apple: { n: 'Pomme dormeuse', d: 'Pose-la : le prof la croque et ronfle.', short: 'Dodo' },
  mirror: { n: 'Miroir magique', d: 'Révèle le prof et les sorties (8 s).', short: 'Voir' },
  watch: { n: 'Montre du Lapin blanc', d: 'Prof en mode escargot (8 s).', short: 'Ralenti' },
  key: { n: 'Petite clé', d: 'Ouvre une porte fermée à clé.', short: 'Clé' },
  squishy: { n: 'Squishy kawaii', d: 'Si on t’attrape : SPLOTCH ! Le prof voit flou 10 s.', short: 'Squishy' },
  disguise: { n: 'Déguisement', d: 'Perruque + moustache : nouveau look. (Pas devant le prof.)', short: 'Déguise' },
};
const ITEM_KEYS = Object.keys(ITEMS).filter(k => k !== 'disguise' && k !== 'key');
const ITEM_CACHE = {};
function itemCanvas(kind) {
  if (ITEM_CACHE[kind]) return ITEM_CACHE[kind];
  const [cv, c] = mkCanvas(14, 14);
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a + 1, b + 1, w, h); };
  switch (kind) {
    case 'key': R(1, 3, 5, 5, '#ffd23f'); R(2, 4, 3, 3, '#1a1028'); R(3, 5, 1, 1, '#ffd23f'); R(5, 5, 7, 2, '#ffd23f'); R(9, 7, 1, 2, '#ffd23f'); R(11, 7, 1, 3, '#ffd23f'); R(1, 3, 5, 1, '#fff2a8'); R(5, 5, 7, 1, '#fff2a8'); break;
    case 'cake': R(1, 9, 10, 2, '#e8e8f0'); R(2, 5, 8, 4, '#f4b6c2'); R(2, 4, 8, 2, '#fff4f8'); R(2, 6, 8, 1, '#ff6f91'); R(3, 8, 1, 1, '#c94a6b'); R(6, 8, 1, 1, '#c94a6b'); R(8, 7, 1, 1, '#c94a6b'); R(5, 1, 2, 3, '#e43b44'); R(6, 0, 1, 1, '#3e8948'); R(5, 1, 1, 1, '#ff8a8a'); break;
    case 'lamp': R(1, 6, 8, 3, '#f2c14e'); R(3, 5, 4, 1, '#ffd76e'); R(8, 5, 3, 2, '#f2c14e'); R(10, 4, 2, 1, '#f2c14e'); R(0, 6, 2, 2, '#c99a2e'); R(3, 9, 5, 2, '#c99a2e'); R(4, 4, 2, 1, '#c99a2e'); R(2, 7, 3, 1, '#ffe9a8'); R(4, 2, 1, 2, '#d8e8ff'); R(5, 0, 1, 2, '#d8e8ff'); break;
    case 'slipper': R(1, 7, 9, 3, '#bfefff'); R(7, 5, 4, 3, '#bfefff'); R(2, 6, 5, 1, '#e8fbff'); R(1, 10, 10, 1, '#7fcfe8'); R(9, 3, 1, 1, '#ffffff'); R(3, 2, 1, 3, '#ffffff'); R(2, 3, 3, 1, '#ffffff'); break;
    case 'apple': R(2, 4, 8, 7, '#d6243a'); R(1, 5, 10, 5, '#d6243a'); R(3, 5, 2, 2, '#ff7a8a'); R(5, 1, 1, 3, '#6b4220'); R(6, 1, 3, 2, '#3e8948'); R(8, 8, 2, 2, '#a3162a'); R(3, 11, 6, 1, '#a3162a'); break;
    case 'mirror': R(3, 0, 6, 9, '#f2c14e'); R(2, 1, 8, 7, '#f2c14e'); R(4, 1, 4, 7, '#bfe4ff'); R(3, 2, 6, 5, '#bfe4ff'); R(4, 2, 1, 3, '#ffffff'); R(5, 9, 2, 2, '#c99a2e'); R(3, 11, 6, 1, '#c99a2e'); break;
    case 'disguise': R(1, 2, 10, 1, '#3a2414'); R(1, 4, 4, 3, '#1d1626'); R(7, 4, 4, 3, '#1d1626'); R(2, 5, 2, 1, '#9fd7ff'); R(8, 5, 2, 1, '#9fd7ff'); R(5, 5, 2, 1, '#1d1626'); R(5, 6, 2, 3, '#f6a0a0'); R(2, 9, 8, 2, '#4a2a14'); R(1, 10, 2, 1, '#4a2a14'); R(9, 10, 2, 1, '#4a2a14'); break;
    case 'squishy': { // petit chat-guimauve tout doux
      const B = '#ffb3d6', BD = '#ec86b6', BL = '#ffe0ef';
      R(2, 2, 2, 2, B); R(8, 2, 2, 2, B); R(3, 3, 1, 1, '#ff7fb0'); R(8, 3, 1, 1, '#ff7fb0');
      R(2, 4, 8, 1, B); R(1, 5, 10, 5, B); R(2, 10, 8, 1, BD); R(1, 9, 10, 1, BD);
      R(3, 5, 2, 1, BL); R(2, 6, 1, 1, BL);
      R(4, 6, 1, 2, '#1d1626'); R(7, 6, 1, 2, '#1d1626'); R(4, 6, 1, 1, '#ffffff'); R(7, 6, 1, 1, '#ffffff');
      R(3, 8, 1, 1, '#ff6f9a'); R(8, 8, 1, 1, '#ff6f9a'); R(5, 8, 1, 1, '#7a2836'); R(6, 8, 1, 1, '#7a2836');
      break;
    }
    case 'watch': R(2, 3, 8, 8, '#f2c14e'); R(1, 4, 10, 6, '#f2c14e'); R(3, 4, 6, 6, '#fff8e0'); R(2, 5, 8, 4, '#fff8e0'); R(5, 5, 1, 3, '#2a2230'); R(6, 7, 2, 1, '#2a2230'); R(5, 1, 2, 2, '#c99a2e'); R(7, 0, 4, 1, '#c99a2e'); R(10, 1, 1, 2, '#c99a2e'); break;
  }
  shadePass(cv, c); outlinePass(cv, c);
  ITEM_CACHE[kind] = cv; return cv;
}
