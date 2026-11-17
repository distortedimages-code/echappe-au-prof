// ================= VUE ISOMÉTRIQUE (essai sur un niveau) =================
// Fausse 3D façon jeux des années 90, dessinée en canvas 2D :
//  - le sol en losanges, les murs fins et les meubles en volumes (on voit le dessus, la face avant et la face droite)
//  - les personnages restent les mêmes sprites, debout
//  - tout est dessiné du fond vers l'avant : un mur cache ce qui est derrière lui,
//    et la partie cachée d'un personnage reste visible en silhouette sombre
//  - rien n'est dessiné sur les faces qu'on ne voit jamais (nord et ouest)
// La logique du jeu (cases, collisions, regards, cachettes) ne change pas : seul l'affichage change.
// Le décor fixe est préparé une seule fois ; à chaque image on ne fait que recopier des petites images.
const ISO = { LV: 2, u: 2, C: Math.SQRT1_2, ZK: 0.82, HW: 24, TH: 4, built: null, cam: null, objs: [], doorCache: new Map(), tmp: [], ox: 0, oy: 0, pages: [], at: {}, scr: {} };
const isoOn = () => !!(G.iso && !G.inf && !G.net && G.m);
function isoP(x, y, z) { const u = ISO.u * ISO.C; return [(x - y) * u + ISO.ox, (x + y) * u * 0.5 - (z || 0) * ISO.u * ISO.ZK + ISO.oy]; }

// ---------- petites briques de dessin ----------
function isoPoly(c, pts, col) { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); }
// une image posée sur un parallélogramme : O = coin haut-gauche, A = haut-droit, B = bas-gauche
function isoTex(c, img, sx, sy, sw, sh, O, A, B) {
  c.save(); c.setTransform((A[0] - O[0]) / sw, (A[1] - O[1]) / sw, (B[0] - O[0]) / sh, (B[1] - O[1]) / sh, O[0], O[1]);
  c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); c.restore();
}
// une boîte : faces visibles = est, sud, dessus. Chaque face : couleur, texture [img, sx, sy, sw, sh] ou null (cachée)
function isoBox(c, Pl, x0, y0, z0, x1, y1, z1, st) {
  const face = (f, O, A, B, D) => { if (!f) return; if (typeof f === 'string') isoPoly(c, [O, A, D, B], f); else isoTex(c, f[0], f[1], f[2], f[3], f[4], O, A, B); };
  face(st.east, Pl(x1, y0, z1), Pl(x1, y1, z1), Pl(x1, y0, z0), Pl(x1, y1, z0));
  face(st.south, Pl(x0, y1, z1), Pl(x1, y1, z1), Pl(x0, y1, z0), Pl(x1, y1, z0));
  face(st.top, Pl(x0, y0, z1), Pl(x1, y0, z1), Pl(x0, y1, z1), Pl(x1, y1, z1));
}
// Mémoire : sur iPhone, chaque canvas coûte cher, et au-delà d'une limite le navigateur refuse d'en créer
// (c'est ce qui cassait le sprite du joueur). Donc : tous les objets du décor sont rangés dans quelques grandes
// planches (atlas), et les dessins intermédiaires se font sur une poignée de brouillons réutilisés.
function isoScratch(name, w, h) {
  let s = ISO.scr[name];
  if (!s) { const [cv, c] = mkCanvas(Math.max(64, w), Math.max(64, h)); s = ISO.scr[name] = { cv, c }; }
  if (s.cv.width < w || s.cv.height < h) { s.cv.width = Math.max(s.cv.width, w); s.cv.height = Math.max(s.cv.height, h); s.c = s.cv.getContext('2d'); }
  const c = s.c; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, s.cv.width, s.cv.height); c.imageSmoothingEnabled = false;
  return [s.cv, c];
}
function isoAlloc(w, h) {
  const A = ISO.at, P = 2, S = 1024;
  if (A.pg && A.x + w + P > S) { A.x = P; A.y += A.rowH + P; A.rowH = 0; }
  if (!A.pg || A.y + h + P > S) { const [cv, c] = mkCanvas(S, S); c.imageSmoothingEnabled = false; ISO.pages.push(cv); A.pg = cv; A.c = c; A.x = P; A.y = P; A.rowH = 0; }
  const r = { pg: A.pg, x: A.x, y: A.y, c: A.c }; A.x += w + P; A.rowH = Math.max(A.rowH, h); return r;
}
function isoFree() {
  ISO.pages.forEach(cv => { cv.width = 0; cv.height = 0; }); ISO.pages = []; ISO.at = {};
  Object.values(ISO.scr).forEach(s => { s.cv.width = 0; s.cv.height = 0; }); ISO.scr = {};
  ISO.tmp.forEach(cv => { cv.width = 0; cv.height = 0; }); ISO.tmp = [];
  if (ISO.floor) { ISO.floor.width = 0; ISO.floor.height = 0; } ISO.floor = null;
  ISO.objs = []; ISO.doorCache.clear(); ISO.built = null;
}
// un objet du décor = un morceau de planche, avec sa profondeur (key) pour l'ordre de dessin
function isoObj(x0, y0, z0, x1, y1, z1, draw, key, extra) {
  let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const [a, b] = isoP(x, y, z); mnx = Math.min(mnx, a); mny = Math.min(mny, b); mxx = Math.max(mxx, a); mxy = Math.max(mxy, b); }
  const sx = Math.floor(mnx) - 1, sy = Math.floor(mny) - 1, w = Math.ceil(mxx) - sx + 2, h = Math.ceil(mxy) - sy + 2;
  const [sc, c] = isoScratch('obj', w, h);
  draw(c, (x, y, z) => { const [a, b] = isoP(x, y, z); return [a - sx, b - sy]; });
  const r = isoAlloc(w, h); r.c.drawImage(sc, 0, 0, w, h, r.x, r.y, w, h);
  return Object.assign({ sx, sy, w, h, pg: r.pg, px: r.x, py: r.y, key, ri: -1 }, extra || {});
}
function isoDark(o) {
  const [sc, c] = isoScratch('dk', o.w, o.h); c.drawImage(o.pg, o.px, o.py, o.w, o.h, 0, 0, o.w, o.h);
  c.globalCompositeOperation = 'source-in'; c.fillStyle = 'rgb(14,8,34)'; c.fillRect(0, 0, o.w, o.h); c.globalCompositeOperation = 'source-over';
  const r = isoAlloc(o.w, o.h); r.c.drawImage(sc, 0, 0, o.w, o.h, r.x, r.y, o.w, o.h); o.dk = r;
}
function isoArt(k, x, y) { const [cv, c] = isoScratch('art', 16, 16); try { drawFurniture(c, k, 0, 0, x, y, G.m, G.L); } catch (e) { } return cv; }

// ---------- préparation du niveau (une seule fois) ----------
function isoBuild() {
  isoFree();
  const m = G.m, L = G.L, HW = ISO.HW, T0 = 8 - ISO.TH / 2, T1 = 8 + ISO.TH / 2;
  ISO.ox = m.h * 16 * ISO.u * ISO.C + 8; ISO.oy = HW * ISO.u * ISO.ZK + 12;
  const FW = Math.ceil((m.w + m.h) * 16 * ISO.u * ISO.C) + 16, FH = Math.ceil((m.w + m.h) * 16 * ISO.u * ISO.C * 0.5 + ISO.oy + 16);
  const inB = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h;
  const wb = (x, y) => { if (!inB(x, y)) return false; const k = m.get(x, y); if (k == null) return false; return k === K.WALL || k === K.X_WINDOW || k === K.X_DOOR || k === K.X_ELEV || k === K.X_HOLE || (k === K.LOCKER && !m.roomAt(x, y)); };
  const wk = (x, y) => wb(x, y) ? 1 : (inB(x, y) && m.get(x, y) === K.DOOR ? 2 : 0);
  const open = (x, y) => inB(x, y) && !wk(x, y);
  const objs = [];
  // 1) le sol, vu de dessus, puis couché en losanges
  const [fcv, fc] = mkCanvas(m.w * 16, m.h * 16);
  const fsOf = (x, y) => m.fs[y * m.w + x] || 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!wk(x, y)) { try { drawFloorTile(fc, x * 16, y * 16, fsOf(x, y), x, y); } catch (e) { } continue; }
    // sous un mur fin : chaque quart prend le sol de la pièce de son côté (ou rien, côté extérieur)
    [[0, 0, -1, -1], [8, 0, 1, -1], [0, 8, -1, 1], [8, 8, 1, 1]].forEach(([qx, qy, dx, dy]) => {
      const src = [[x, y + dy], [x + dx, y], [x + dx, y + dy]].find(([a, b]) => open(a, b)); if (!src) return;
      fc.save(); fc.beginPath(); fc.rect(x * 16 + qx, y * 16 + qy, 8, 8); fc.clip(); try { drawFloorTile(fc, x * 16, y * 16, fsOf(src[0], src[1]), x, y); } catch (e) { } fc.restore();
    });
  }
  try { floorDetails(fc, m); m.fdecor.forEach(d => drawFloorDecor(fc, d)); } catch (e) { }
  const shadow = (x0, y0, x1, y1, a) => { fc.fillStyle = `rgba(10,6,20,${a})`; fc.fillRect(x0 - 1.5, y0 - 1, x1 - x0 + 3, y1 - y0 + 2.5); };
  // 2) les murs fins : une « croix » par case de mur, reliée à ses voisins
  const faceTex = (slot, x, y, art, feature) => {   // texture d'une face de mur (16 de large × HW de haut), sur un brouillon
    const S = WSTYLE[m.ws[y * m.w + x]] || WSTYLE[0], [cv, c] = isoScratch(slot, 16, HW);
    c.fillStyle = S.face; c.fillRect(0, 0, 16, HW); c.fillStyle = S.trim; c.fillRect(0, 0, 16, 1);
    const src = art || (() => { const [t, tc] = isoScratch('wt', 16, 16); drawWallTile(tc, 0, 0, m.ws[y * m.w + x], true, x, y); return t; })();
    const r0 = feature ? 1 : 3; c.drawImage(src, 0, r0, 16, 16 - r0, 0, HW - (16 - r0), 16, 16 - r0);
    return cv;
  };
  const crop = (x, y) => { const [t, tc] = isoScratch('crop', 16, 16); tc.drawImage(G.mapCanvas, x * 16, y * 16, 16, 16, 0, 0, 16, 16); return t; };
  const isFeat = k => k === K.X_WINDOW || k === K.X_DOOR || k === K.X_ELEV || k === K.X_HOLE;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (wk(x, y) !== 1) continue;
    const k = m.get(x, y), S = WSTYLE[m.ws[y * m.w + x]] || WSTYLE[0];
    const n = wk(x, y - 1) > 0, s = wk(x, y + 1) > 0, w = wk(x - 1, y) > 0, e = wk(x + 1, y) > 0;
    const horiz = w || e || (!n && !s), vert = n || s;
    // face sud (vue depuis le sud) et face est : on y met le décor du mur s'il est tourné de ce côté
    const sOpen = open(x, y + 1) || !inB(x, y + 1), eOpen = open(x + 1, y) || !inB(x + 1, y);
    const lockS = k === K.LOCKER && open(x, y + 1), lockE = k === K.LOCKER && !lockS && open(x + 1, y);
    const texS = horiz ? faceTex('texS', x, y, isFeat(k) || (open(x, y + 1) && k !== K.LOCKER) ? crop(x, y) : null, isFeat(k) && !vert) : null;
    const texE = vert ? faceTex('texE', x, y, isFeat(k) && !horiz ? crop(x, y) : null, isFeat(k)) : null;
    const top = S.top, cap = shade(S.face, -0.35), capS = shade(S.face, -0.2);
    const lc = (L && L.lockerCol) || '#4f7fc0';
    // (chaque morceau déborde un peu sur son voisin : pas de fente entre deux morceaux de mur)
    const E = 0.6;
    objs.push(isoObj(x * 16 - 1, y * 16 - 1, 0, x * 16 + 17, y * 16 + 17, HW, (c, Pl0) => {
      const Pl = (a, b, z) => Pl0(x * 16 + a, y * 16 + b, z);
      if (n) isoBox(c, Pl, T0, -E, 0, T1, T0 + E, HW, { top, east: [texE, 0, 0, T0 + E, HW] });
      if (w) isoBox(c, Pl, -E, T0, 0, T0 + E, T1, HW, { top, south: [texS, 0, 0, T0 + E, HW] });
      isoBox(c, Pl, T0 - (w ? E : 0), T0 - (n ? E : 0), 0, T1 + (e ? E : 0), T1 + (s ? E : 0), HW, { top,
        south: s ? null : horiz ? [texS, T0 - E, 0, T1 - T0 + 2 * E, HW] : capS,
        east: e ? null : vert ? [texE, T0 - E, 0, T1 - T0 + 2 * E, HW] : cap });
      if (e) isoBox(c, Pl, T1 - E, T0, 0, 16 + E, T1, HW, { top, south: [texS, T1 - E, 0, 16 - T1 + E, HW] });
      if (s) isoBox(c, Pl, T0, T1 - E, 0, T1, 16 + E, HW, { top, east: [texE, T1 - E, 0, 16 - T1 + E, HW] });
      // casier encastré : il dépasse du mur, du côté où on le voit
      if (lockS) { const a = isoArt(K.LOCKER, x, y); isoBox(c, Pl, 0.5, T1, 0, 15.5, T1 + 6, HW - 3, { top: shade(lc, 0.15), east: wk(x + 1, y) === 1 && m.get(x + 1, y) === K.LOCKER ? null : shade(lc, -0.4), south: [a, 0, 0, 16, 16] }); }
      if (lockE) { const a = isoArt(K.LOCKER, x, y); isoBox(c, Pl, T1, 0.5, 0, T1 + 6, 15.5, HW - 3, { top: shade(lc, 0.15), south: shade(lc, -0.25), east: [a, 0, 0, 16, 16] }); }
    }, x * 16 + y * 16 + 16, { wall: true }));
    // ombre de contact au pied du mur
    if (horiz) shadow(x * 16 + (w ? 0 : T0), y * 16 + T0, x * 16 + (e ? 16 : T1), y * 16 + T1 + (lockS ? 6 : 0), 0.22);
    if (vert) shadow(x * 16 + T0, y * 16 + (n ? 0 : T0), x * 16 + T1 + (lockE ? 6 : 0), y * 16 + (s ? 16 : T1), 0.22);
  }
  // 3) les meubles, refaits en volume
  const hideAt = new Map(); L.hides.forEach(h => hideAt.set(h.y * m.w + h.x, h));
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = m.get(x, y); if (k == null || k === K.FLOOR || wk(x, y) || k === K.WATER) continue;
    const o = isoFurn(k, x, y, m, L, wk, shadow);
    if (!o) { // pas solide (tapis, marquage…) : dessiné à plat sur le sol
      try { drawFurniture(fc, k, x * 16, y * 16, x, y, m, L); } catch (e) { } continue;
    }
    const ri = m.vroomAt ? m.vroomAt[y * m.w + x] : -1; o.ri = ri == null ? -1 : ri; o.hide = hideAt.get(y * m.w + x) || null;
    if (o.ri >= 0) isoDark(o);
    objs.push(o);
  }
  // le sol couché en losanges
  const [flc, flx] = mkCanvas(FW, FH); flx.imageSmoothingEnabled = false;
  flx.setTransform(ISO.u * ISO.C, ISO.u * ISO.C * 0.5, -ISO.u * ISO.C, ISO.u * ISO.C * 0.5, ISO.ox, ISO.oy); flx.drawImage(fcv, 0, 0);
  fcv.width = 0; fcv.height = 0;   // le sol vu de dessus ne sert plus : on rend la mémoire tout de suite
  ISO.floor = flc; ISO.objs = objs; ISO.built = m;
}

// ---------- les meubles en volume ----------
function isoFurn(k, x, y, m, L, wk, shadow) {
  const same = (dx, dy) => x + dx >= 0 && y + dy >= 0 && x + dx < m.w && y + dy < m.h && m.get(x + dx, y + dy) === k, h = hash2(x, y), X = x * 16, Y = y * 16, key = X + Y + 16;
  const l = !same(-1, 0), r = !same(1, 0), nWall = wk(x, y - 1) === 1;
  const O = (x0, y0, z0, x1, y1, z1, fn, kk) => isoObj(X + x0, Y + y0, z0, X + x1, Y + y1, z1, (c, Pl0) => fn(c, (a, b, z) => Pl0(X + a, Y + b, z)), kk == null ? key : kk);
  const sh = (x0, y0, x1, y1, a) => shadow(X + x0, Y + y0, X + x1, Y + y1, a == null ? 0.18 : a);
  const leg = (c, Pl, a, b, z1, col) => isoBox(c, Pl, a, b, 0, a + 1.3, b + 1.3, z1, { top: col, south: col, east: shade(col, -0.2) });
  switch (k) {
    case K.TABLE: {   // table d'élève + sa chaise (l'élève regarde vers le tableau, au nord)
      const x0 = l ? 1 : 0, x1 = r ? 15 : 16, cc = ['#4f6fa8', '#c0392b', '#3e8948', '#7b45a8'][(h * 4) | 0];
      sh(x0, 3, x1, 10, 0.16); sh(5, 11, 11, 15, 0.12);
      return O(0, 2, 0, 16, 16, 13, (c, Pl) => {
        if (l) { leg(c, Pl, 1.5, 3.5, 9, '#6b4220'); }
        if (r) { leg(c, Pl, 13.2, 3.5, 9, '#6b4220'); }
        if (l) leg(c, Pl, 1.5, 8.2, 9, '#6b4220'); if (r) leg(c, Pl, 13.2, 8.2, 9, '#6b4220');
        isoBox(c, Pl, x0, 3, 9, x1, 10, 10.6, { top: '#dba86e', south: '#b07a45', east: r ? '#9a6838' : null });
        if (h > 0.4) isoBox(c, Pl, 4, 4.5, 10.6, 8, 7.5, 10.9, { top: '#ffffff', south: '#c8d0e0', east: '#c8d0e0' });
        if (h > 0.75) isoBox(c, Pl, 9, 5, 10.6, 13, 6, 11.2, { top: '#3d7bff', south: '#2a56b0', east: '#2a56b0' });
        // la chaise
        leg(c, Pl, 5.5, 11.5, 5, '#555'); leg(c, Pl, 9.3, 11.5, 5, '#555');
        isoBox(c, Pl, 5, 11, 5, 11, 15, 6.3, { top: cc, south: shade(cc, -0.3), east: shade(cc, -0.4) });
        isoBox(c, Pl, 5, 14.3, 6.3, 11, 15.3, 12.5, { top: shade(cc, 0.2), south: cc, east: shade(cc, -0.35) });
      });
    }
    case K.DESK: {   // bureau du prof : plateau épais, panneau devant, quelques affaires dessus
      const x0 = l ? 1 : 0, x1 = r ? 15 : 16;
      sh(x0, 2, x1, 12, 0.2);
      return O(0, 1, 0, 16, 13, 14, (c, Pl) => {
        if (l) leg(c, Pl, x0 + 0.5, 2.5, 10, '#57351a'); if (r) leg(c, Pl, x1 - 1.8, 2.5, 10, '#57351a');
        isoBox(c, Pl, x0, 9.5, 0, x1, 11.5, 10, { top: '#6b4220', south: '#6b4220', east: r ? '#4a2a14' : null });
        if (l) { isoBox(c, Pl, x0 + 1, 10.5, 2, x0 + 6, 11.6, 4, { south: '#57351a' }); isoBox(c, Pl, x0 + 1, 10.5, 5, x0 + 6, 11.6, 7, { south: '#57351a' }); }
        isoBox(c, Pl, x0, 2, 10, x1, 11.5, 12, { top: '#8b5a2b', south: '#a8703a', east: r ? '#6b4220' : null });
        if (h > 0.5) isoBox(c, Pl, 4, 4, 12, 9, 8, 12.3, { top: '#ffffff', south: '#c8d0e0', east: '#c8d0e0' });
        else isoBox(c, Pl, 9, 4, 12, 12, 7, 14.5, { top: '#ff5a64', south: '#e43b44', east: '#b02a33' });
        if (h > 0.3 && h < 0.7) isoBox(c, Pl, 11, 6, 12, 14, 7, 12.6, { top: '#fec43a', south: '#c99a20', east: '#c99a20' });
      });
    }
    case K.MEET: {
      const t = !same(0, -1), b = !same(0, 1), x0 = l ? 1 : 0, x1 = r ? 15 : 16, y0 = t ? 2 : 0, y1 = b ? 13 : 16;
      sh(x0, y0, x1, y1, 0.18);
      return O(0, 0, 0, 16, 16, 12, (c, Pl) => {
        if (l && t) leg(c, Pl, x0 + 0.5, y0 + 0.5, 9, '#4a2a18'); if (r && t) leg(c, Pl, x1 - 1.8, y0 + 0.5, 9, '#4a2a18');
        if (l && b) leg(c, Pl, x0 + 0.5, y1 - 1.8, 9, '#4a2a18'); if (r && b) leg(c, Pl, x1 - 1.8, y1 - 1.8, 9, '#4a2a18');
        isoBox(c, Pl, x0, y0, 9, x1, y1, 10.8, { top: '#6b4228', south: b ? '#4a2a18' : null, east: r ? '#3e2414' : null });
        if (h > 0.6) isoBox(c, Pl, 5, 6, 10.8, 10, 10, 11.1, { top: '#ffffff', south: '#c8d0e0', east: '#c8d0e0' });
      });
    }
    case K.SHELF: {   // bibliothèque : les livres du côté où on les voit
      const art = isoArt(k, x, y), vert = same(0, -1) || same(0, 1), wW = wk(x - 1, y) === 1;
      if (vert) {
        const x0 = wW ? 0.5 : 4.5, x1 = x0 + 7, y0 = same(0, -1) ? 0 : 1, y1 = same(0, 1) ? 16 : 15;
        sh(x0, y0, x1, y1, 0.2);
        return O(x0, y0, 0, x1, y1, 24, (c, Pl) => isoBox(c, Pl, x0, y0, 0, x1, y1, 24, { top: '#8b5a33', south: same(0, 1) ? null : '#4a2e16', east: [art, 0, 0, 16, 16] }));
      }
      const y0 = nWall ? 1 : 4.5, y1 = y0 + 7, x0 = l ? 0.5 : 0, x1 = r ? 15.5 : 16;
      sh(x0, y0, x1, y1, 0.2);
      return O(x0, y0, 0, x1, y1, 24, (c, Pl) => isoBox(c, Pl, x0, y0, 0, x1, y1, 24, { top: '#8b5a33', south: [art, 0, 0, 16, 16], east: r ? '#4a2e16' : null }));
    }
    case K.ARMOIRE: {
      const art = isoArt(k, x, y), y0 = nWall ? 1 : 4, y1 = y0 + 9;
      sh(1, y0, 15, y1, 0.22);
      return O(1, y0, 0, 15, y1, 27, (c, Pl) => isoBox(c, Pl, 1, y0, 0, 15, y1, 27, { top: '#9a6338', south: [art, 1, 0, 14, 15], east: '#5a351c' }));
    }
    case K.LOCKER: {
      const art = isoArt(k, x, y), lc = (L && L.lockerCol) || '#4f7fc0', y0 = nWall ? 1 : 4, y1 = y0 + 8, x0 = l ? 0.5 : 0, x1 = r ? 15.5 : 16;
      sh(x0, y0, x1, y1, 0.22);
      return O(x0, y0, 0, x1, y1, 26, (c, Pl) => isoBox(c, Pl, x0, y0, 0, x1, y1, 26, { top: shade(lc, 0.15), south: [art, 0, 0, 16, 16], east: r ? shade(lc, -0.4) : null }));
    }
    case K.SOFA: {
      const sc = (L && L.sofaCol) || '#c0392b', x0 = l ? 0.5 : 0, x1 = r ? 15.5 : 16;
      sh(x0, 3, x1, 14, 0.2);
      return O(0, 2, 0, 16, 15, 14, (c, Pl) => {
        isoBox(c, Pl, x0, 3, 0, x1, 7, 13, { top: shade(sc, -0.1), south: shade(sc, -0.2), east: r ? shade(sc, -0.4) : null });
        isoBox(c, Pl, x0, 7, 0, x1, 14, 6, { top: sc, south: shade(sc, -0.25), east: r ? shade(sc, -0.4) : null });
        if (l) isoBox(c, Pl, x0, 4, 0, x0 + 3, 14, 9, { top: shade(sc, 0.1), south: shade(sc, -0.2), east: shade(sc, -0.35) });
        if (r) isoBox(c, Pl, x1 - 3, 4, 0, x1, 14, 9, { top: shade(sc, 0.1), south: shade(sc, -0.2), east: shade(sc, -0.4) });
      });
    }
    case K.BENCH: {
      sh(1, 6, 15, 10, 0.16);
      return O(0, 5, 0, 16, 11, 8, (c, Pl) => {
        leg(c, Pl, 2, 6.5, 5, '#555'); leg(c, Pl, 12.7, 6.5, 5, '#555'); leg(c, Pl, 2, 8.5, 5, '#555'); leg(c, Pl, 12.7, 8.5, 5, '#555');
        isoBox(c, Pl, 1, 6, 5, 15, 10, 6.6, { top: '#cf9a60', south: '#b07a45', east: '#8a5a30' });
      });
    }
    case K.STALL: {
      const art = isoArt(k, x, y);
      sh(0, 0, 16, 16, 0.2);
      return O(0, 0, 0, 16, 16, 24, (c, Pl) => isoBox(c, Pl, 0, 0, 0, 16, 16, 24, { top: '#8fa3c8', south: [art, 0, 0, 16, 16], east: same(1, 0) ? null : '#5d6f92' }));
    }
  }
  if (!(KP[k] && KP[k].solid)) return null;
  // les autres : plantes, poubelles… debout comme les personnages (même échelle) ; sinon une boîte texturée
  const [acv, ac] = isoScratch('fb', 32, 44); try { drawFurniture(ac, k, 8, 24, x, y, m, L); } catch (e) { }
  const d = ac.getImageData(8, 24, 16, 16).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 100) n++;
  if (n / 256 > 0.78 && !FRONT_KINDS[k]) {
    sh(0, 0, 16, 16, 0.18); const tall = TALL_KINDS.has(k), H = tall ? 22 : 8;
    return O(0, 0, 0, 16, 16, H, (c, Pl) => isoBox(c, Pl, 0, 0, 0, 16, 16, H, { top: [acv, 8, 24, 16, tall ? 6 : 10], south: tall ? [acv, 8, 24, 16, 16] : [acv, 8, 34, 16, 6], east: shade('#7a6a8a', -0.2) }));
  }
  sh(4, 10, 12, 15, 0.16);
  const q = 0.92 * ISO.u, [px, py] = isoP(X + 8, Y + 13), w = Math.ceil(32 * q), hh = Math.ceil(44 * q), slot = isoAlloc(w, hh);
  slot.c.drawImage(acv, 0, 0, 32, 44, slot.x, slot.y, 32 * q, 44 * q);
  return { sx: px - 16 * q, sy: py - 37 * q, w, h: hh, pg: slot.pg, px: slot.x, py: slot.y, key: key + 3, ri: -1 };
}

// ---------- les portes : jusqu'en haut du mur, fermées, ouvertes ou verrouillées ----------
function isoDoorArt(locked) {
  const H = ISO.HW - 4, [cv, c] = isoScratch('door', 12, H), R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); };
  R(0, 0, 12, H, '#4a2a14'); R(1, 1, 10, H - 1, '#a8703a'); R(1, 1, 10, 1, '#c99260');
  R(2, 3, 8, 7, '#6b4220'); R(2, 12, 8, H - 15, '#6b4220'); R(3, 4, 6, 1, '#8b5a33'); R(3, 13, 6, 1, '#8b5a33');
  R(9, Math.round(H * 0.5), 1.5, 2, '#ffd23f');
  if (locked) { c.fillStyle = 'rgba(255,40,60,0.3)'; c.fillRect(0, 0, 12, H); R(4, 9, 4, 4, '#ffd23f'); R(4.5, 6.5, 1, 2.5, '#d0d6e0'); R(6.5, 6.5, 1, 2.5, '#d0d6e0'); R(4.5, 6.5, 3, 1, '#d0d6e0'); }
  return cv;
}
function isoDoor(d) {
  const m = G.m, st = d.locked ? 'l' : d.open < 0.5 ? 'c' : 'o', ws = m.ws[d.y * m.w + d.x] || 0, kk = (d.horiz ? 'h' : 'v') + st + ws;
  let o = ISO.doorCache.get(kk);
  if (!o) {
    const HW = ISO.HW, T0 = 8 - ISO.TH / 2, T1 = 8 + ISO.TH / 2, S = WSTYLE[ws] || WSTYLE[0], fr = '#4a2a14', frE = '#2f1a0c';
    const art = st === 'o' ? null : isoDoorArt(st === 'l');
    o = isoObj(0, 0, 0, 16, 16, HW, (c, Pl) => {
      if (d.horiz) {
        isoBox(c, Pl, 0, T0, 0, 2, T1, HW, { top: S.top, south: fr, east: frE });
        if (art) isoBox(c, Pl, 2, 7.4, 0, 14, 8.6, HW - 4, { top: '#6b4220', south: [art, 0, 0, 12, HW - 4] });
        isoBox(c, Pl, 2, T0, HW - 4, 14, T1, HW, { top: S.top, south: fr });
        isoBox(c, Pl, 14, T0, 0, 16, T1, HW, { top: S.top, south: fr, east: frE });
      } else {
        isoBox(c, Pl, T0, 0, 0, T1, 2, HW, { top: S.top, east: fr, south: frE });
        if (art) isoBox(c, Pl, 7.4, 2, 0, 8.6, 14, HW - 4, { top: '#6b4220', east: [art, 0, 0, 12, HW - 4] });
        isoBox(c, Pl, T0, 2, HW - 4, T1, 14, HW, { top: S.top, east: fr });
        isoBox(c, Pl, T0, 14, 0, T1, 16, HW, { top: S.top, east: fr, south: frE });
      }
    }, 0);
    const [ax, ay] = isoP(0, 0); o.ax = ax; o.ay = ay; ISO.doorCache.set(kk, o);
  }
  const [bx, by] = isoP(d.x * 16, d.y * 16);
  return { sx: o.sx + bx - o.ax, sy: o.sy + by - o.ay, w: o.w, h: o.h, pg: o.pg, px: o.px, py: o.py, key: d.x * 16 + d.y * 16 + 16, ri: -1, wall: true };
}

// ---------- commandes : « haut » sur le joystick = « haut » à l'écran ----------
function isoInput(r) {
  if (!r || !r.mag) return r;
  const wx = (r.x + 2 * r.y) / 2, wy = (2 * r.y - r.x) / 2, l = Math.hypot(wx, wy), n = Math.hypot(r.x, r.y);
  return l > 0 ? { x: wx / l * n, y: wy / l * n, mag: r.mag } : r;
}
// le sprite regarde dans la direction où il va… à l'écran
function isoFace(a) {
  let ang = null;
  if (a.moving && (a.vx || a.vy)) ang = Math.atan2(a.vy, a.vx); else if (a.ang != null && !isNaN(a.ang) && a !== G.P) ang = a.ang;
  if (ang == null) return a._isoF != null ? a._isoF : a.face;
  const c = Math.cos(ang), s = Math.sin(ang); return (a._isoF = faceFromAng(Math.atan2((c + s) * 0.5, c - s)));
}
function isoScreen(x, y, h) { const [a, b] = isoP(x, y); return [a * ISO.Z + ISO.offX, b * ISO.Z + ISO.offY - (h || 0) * ISO.sp]; }

// ---------- le dessin de chaque image ----------
function renderIso(dt) {
  const ctx = V.ctx, W = V.W, H = V.H, P = G.P, T = G.T, m = G.m;
  if (ISO.built !== m) isoBuild();
  V.blank = false;
  // caméra (dans le monde) qui suit le joueur
  const vp = viewerA(); let tx = vp.x + clamp(vp.vx || 0, -90, 90) * 0.3, ty = vp.y - 10 + clamp(vp.vy || 0, -90, 90) * 0.3;
  if (G.mode === 'caught') { tx = (P.x + T.x) / 2; ty = (P.y + T.y) / 2 - 10; }
  if (!ISO.cam) ISO.cam = [tx, ty];
  const kc = 1 - Math.exp(-(dt || 0.016) * 6); ISO.cam[0] += (tx - ISO.cam[0]) * kc; ISO.cam[1] += (ty - ISO.cam[1]) * kc;
  V.camX = ISO.cam[0] - V.lw / 2; V.camY = ISO.cam[1] - V.lh / 2;
  const s = V.S * 0.94 * (FX.zoom || 1), Z = s / ISO.u, sp = s * 0.92;
  let shx = 0, shy = 0; if (G.shake > 0) { const a = Math.min(1, G.shake * 3) * V.S * 1.6; shx = rand(-a, a); shy = rand(-a, a); }
  const [fx, fy] = isoP(ISO.cam[0], ISO.cam[1]);
  const offX = Math.round(W / 2 - fx * Z + shx), offY = Math.round(H * 0.52 - fy * Z + shy);
  Object.assign(ISO, { Z, sp, offX, offY }); V.a = sp; V.e = 0; V.f = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#120c1e'; ctx.fillRect(0, 0, W, H);
  // 1) le sol (seulement la partie visible)
  { const F = ISO.floor, x0 = Math.max(0, Math.floor(-offX / Z) - 1), y0 = Math.max(0, Math.floor(-offY / Z) - 1), x1 = Math.min(F.width, Math.ceil((W - offX) / Z) + 1), y1 = Math.min(F.height, Math.ceil((H - offY) / Z) + 1);
    if (x1 > x0 && y1 > y0) ctx.drawImage(F, x0, y0, x1 - x0, y1 - y0, x0 * Z + offX, y0 * Z + offY, (x1 - x0) * Z, (y1 - y0) * Z); }
  // 2) posé sur le sol : cônes de vision, flaques, pièces dans l'ombre
  const showT = G.tVis || G.mode === 'caught';
  { const a = ISO.u * ISO.C * Z; ctx.setTransform(a, a * 0.5, -a, a * 0.5, ISO.ox * Z + offX, ISO.oy * Z + offY);
    if (showT && !T.gone && !['sleep', 'caught', 'count', 'evac'].includes(T.state) && !isBlind(T)) drawCone(ctx);
    G.kids.forEach(k => {
      if (!k.vis || k.gone || k.state === 'evac') return;
      if (k.isWatcher) { ctx.globalAlpha = 0.75; drawCone(ctx, k); ctx.globalAlpha = 1; }
      else if (k.beh === 'cteach' && k.prof) { const v = detVal(k); if (v > 0.03) { ctx.globalAlpha = Math.min(0.85, v * 2.5); drawCone(ctx, k); ctx.globalAlpha = 1; } }
    });
    try { drawPuddles(ctx); } catch (e) { }
    if (!easyOn()) drawRoomShade(ctx, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0); }
  // 3) décor + personnages, du fond vers l'avant
  const list = [], vx0 = -offX / Z - 40, vy0 = -offY / Z - 60, vx1 = (W - offX) / Z + 40, vy1 = (H - offY) / Z + 60;
  const vis = o => o.sx + o.w > vx0 && o.sx < vx1 && o.sy + o.h > vy0 && o.sy < vy1;
  for (const o of ISO.objs) if (vis(o)) list.push({ key: o.key, o });
  G.doors.forEach(d => { const o = isoDoor(d); if (vis(o)) list.push({ key: o.key, o }); });
  const scr = (x, y) => { const [a, b] = isoP(x, y); return [a * Z + offX, b * Z + offY]; };
  const act = (a, key, fn, sil) => { const [X, Y] = scr(a.x, a.y); if (X < -200 || X > W + 200 || Y < -300 || Y > H + 300) return; list.push({ key, a, fn, sil, X, Y }); };
  const stand = (c, e, ox, oy, k) => { const a = e.a, q = k || 1; c.setTransform(sp * q, 0, 0, sp * q, (e.X - (ox || 0)) * q - a.x * sp * q, (e.Y - (oy || 0)) * q - a.y * sp * q); const f0 = a.face; if (e.sil) a.face = isoFace(a); try { e.fn(c); } finally { a.face = f0; } c.setTransform(1, 0, 0, 1, 0, 0); };
  G.items.forEach(it => act(it, it.x + it.y + 2, c => drawItemW(c, it)));
  (G.m.junk || []).forEach(j => act(j, (j.head ? j.head.x + j.head.y : j.x + j.y) + 1, c => drawJunk(c, j)));
  G.apples.forEach(ap => act(ap, ap.x + ap.y + 2, c => { const w = Math.sin(G.time * 4) * 0.12; c.translate(ap.x, ap.y - 6); c.rotate(w); c.drawImage(itemCanvas('apple'), -7, -7); }));
  (G.m.npcGags || []).forEach(g => { if (g.vis) act(g, g.x + g.y, c => drawGag(c, g), true); });
  G.kids.forEach(k => {
    if (!k.vis) return;
    act(k, k.x + k.y, c => {
      const bob = k.beh === 'jump' ? -Math.abs(Math.sin(G.time * 6 + k.ph)) * 5 : 0;
      if (k.beh === 'sit' || k.beh === 'bench') { drawSprite(c, k.cfg, null, k, { sy: 0.86, bob: 2, noShadow: true }); if (k.sixT > 0) drawSixSeven(c, k, 3); return; }
      drawSprite(c, k.cfg, k.v || null, k, { bob, sy: k.beh === 'jump' && bob > -1 ? 0.9 : 1 });
      if (k.sixT > 0) drawSixSeven(c, k, 0);
      if ((k.isWatcher || k.snitch) && k.markT > 0 && k.mark) txt(c, k.mark, k.x, k.y - 40, 9, k.mark === '!' ? '#e43b44' : '#ffd23f');
    }, true);
  });
  if (showT && !T.gone) act(T, T.x + T.y, c => drawTeacher(c, T), true);
  FX.ghosts.forEach(g => act(g, g.x + g.y - 0.1, c => drawSprite(c, P.cfg, null, { x: g.x, y: g.y, face: g.face, dist: g.dist, moving: true, running: true }, { tint: '#7ff0ff', alpha: 0.45 * (1 - g.t / 0.32), scale: g.small ? 0.5 : 1, noShadow: true, still: true, gait: 'run' })));
  if (!P.hidden && !P.out && G.pVis !== false) {
    let sc = P.small > 0 ? 0.5 : 1; if (P.small > 0 && P.small < 3 && (G.time * 7 | 0) % 2) sc = 0.75;
    let al = 1; if (G.mode === 'escape') { al = clamp(1 - (G.escT - 0.5) / 0.6, 0, 1); sc *= clamp(1 - (G.escT - 0.4) / 0.8, 0.2, 1); }
    act(P, P.x + P.y + (P.lift > 0 ? 40 : 0), c => drawSprite(c, P.cfg, null, P, { scale: sc, alpha: al, dx: P.trem ? Math.sin(G.time * 70) * P.trem : 0, hz: P.lift > 0 ? P.lift : undefined }), true);
  }
  const p = P.pet;
  if (p && !P.out && p.x != null && P.x > -9000) {
    const vv = (p.leaveT != null ? Math.max(0, p.leaveT / 1.2) : 1) * (1 - (p.inHide || 0));
    if (vv > 0.02) act(p, p.x + p.y, c => {
      c.globalAlpha = vv; c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(p.x, p.y, 5, 2, 0, 0, 7); c.fill(); c.globalAlpha = 1;
      const def = PETS[p.i]; if (def && def.px) { try { drawCutePet(c, p, def, vv); } catch (e) { } c.globalAlpha = 1; return; }
      const bob = p.moving || p.jump > 0 ? Math.abs(Math.sin(p.t * 12)) * 3 : Math.sin(p.t * 3) * 0.6;
      c.globalAlpha = vv; c.font = '12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillStyle = '#000'; c.fillText(p.e, p.x, p.y + 1 - bob); c.globalAlpha = 1;
    }, true);
  }
  if (G.ball) {
    const a = G.kids[G.ball.from], b = G.kids[G.ball.to];
    if (a && b && (a.vis || b.vis)) { const t = G.ball.t, bx = lerp(a.x, b.x, t), by = lerp(a.y, b.y, t); act({ x: bx, y: by }, bx + by, c => { const hh = Math.sin(Math.PI * t) * 14 + 10; c.fillStyle = 'rgba(10,6,20,0.3)'; c.beginPath(); c.ellipse(bx, by, 2.2, 0.9, 0, 0, 7); c.fill(); c.fillStyle = '#f77622'; c.beginPath(); c.arc(bx, by - hh, 2.2, 0, 7); c.fill(); }); }
  }
  if (P.hidden && viewerA() === P) { const hs = P.hidden; act({ x: hs.x * 16 + 8, y: hs.y * 16 + 22 }, hs.x * 16 + hs.y * 16 + 40, c => drawEyes(c, hs)); }
  list.sort((a, b) => a.key - b.key);
  // on dessine ; on retient où sont les personnages pour leur silhouette derrière les murs
  const drawO = (c, o, ox, oy, k) => {
    let jx = 0; if (o.hide && o.hide.shake > 0) jx = Math.sin(G.time * 60) * (o.hide.shake > 0.1 ? 1.2 : 0.7) * ISO.u;
    const q = k || 1, X = ((o.sx + jx) * Z + offX - (ox || 0)) * q, Y = (o.sy * Z + offY - (oy || 0)) * q;
    c.drawImage(o.pg, o.px, o.py, o.w, o.h, X, Y, o.w * Z * q, o.h * Z * q);
    if (k) return;
    if (o.dk) { const r = m.vrooms && m.vrooms[o.ri]; if (r && r.a > 0.01) { c.globalAlpha = 0.93 * r.a; c.drawImage(o.dk.pg, o.dk.x, o.dk.y, o.w, o.h, X, Y, o.w * Z, o.h * Z); c.globalAlpha = 1; } }
  };
  list.forEach(e => { if (e.o) drawO(ctx, e.o); else stand(ctx, e); });
  // la partie cachée d'un personnage : une silhouette plus sombre que le mur
  list.forEach((e, i) => {
    if (!e.sil) return;
    const bx0 = Math.floor(e.X - 18 * sp), by0 = Math.floor(e.Y - 54 * sp), bw = Math.ceil(36 * sp), bh = Math.ceil(62 * sp);
    const occ = []; for (let j = i + 1; j < list.length; j++) { const o = list[j].o; if (!o) continue; const X = o.sx * Z + offX, Y = o.sy * Z + offY; if (X < bx0 + bw && X + o.w * Z > bx0 && Y < by0 + bh && Y + o.h * Z > by0) occ.push(o); }
    if (!occ.length) return;
    // (calculée en demi-résolution : une ombre n'a pas besoin de détails, et c'est 4 fois moins de travail)
    const k = 0.5, hw = Math.ceil(bw * k), hh = Math.ceil(bh * k);
    const tA = isoTmp(0, hw, hh), tB = isoTmp(1, hw, hh), cA = tA.getContext('2d'), cB = tB.getContext('2d');
    cA.setTransform(1, 0, 0, 1, 0, 0); cA.globalCompositeOperation = 'source-over'; cA.clearRect(0, 0, hw, hh); cA.imageSmoothingEnabled = false;
    stand(cA, e, bx0, by0, k);
    cA.setTransform(1, 0, 0, 1, 0, 0); cA.globalCompositeOperation = 'source-in'; cA.fillStyle = '#120a22'; cA.fillRect(0, 0, hw, hh);
    cB.setTransform(1, 0, 0, 1, 0, 0); cB.clearRect(0, 0, hw, hh); cB.imageSmoothingEnabled = false; occ.forEach(o => drawO(cB, o, bx0, by0, k));
    cA.globalCompositeOperation = 'destination-in'; cA.drawImage(tB, 0, 0); cA.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.6; ctx.drawImage(tA, 0, 0, hw, hh, bx0, by0, hw / k, hh / k); ctx.globalAlpha = 1;
  });
  // 4) particules, interface
  drawParts(ctx, { x0: ISO.cam[0] - 600, y0: ISO.cam[1] - 600, x1: ISO.cam[0] + 600, y1: ISO.cam[1] + 600, t: (c, x, y) => { const [X, Y] = scr(x, y); c.setTransform(sp, 0, 0, sp, X - x * sp, Y - y * sp); } });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawOverlay(); drawPost();
}
function isoTmp(i, w, h) { let c = ISO.tmp[i]; if (!c) { c = document.createElement('canvas'); ISO.tmp[i] = c; } if (c.width < w) c.width = w; if (c.height < h) c.height = h; return c; }
