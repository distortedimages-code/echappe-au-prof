// ================= ON VOIT PIÈCE PAR PIÈCE =================
// Plus de cône de vision pour l'élève : on voit les couloirs et la cour, et la pièce où l'on est.
// Les autres pièces restent dans le noir tant qu'on n'y est pas entré (pas de vue à travers les portes).
const OPEN_ROOMS = /^Couloir|^Hall|Escalier|Palier|Préau|Cour|Terrain|Aire de jeux|Casiers des élèves/;
function roomVisSetup(m) {
  const out = f => f === FS.GRASS || f === FS.ASPHALT || f === FS.SAND || f === FS.PREAU;
  m.vroomAt = new Int16Array(m.w * m.h).fill(-1); m.vrooms = [];
  m.rooms.slice().sort((a, b) => a.w * a.h - b.w * b.h).forEach(r => {
    if (OPEN_ROOMS.test(r.name)) return;
    let indoor = 0, tot = 0;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { tot++; if (!out(m.fs[y * m.w + x])) indoor++; }
    if (!tot || indoor < tot * 0.6) return;
    const id = m.vrooms.length; m.vrooms.push({ x: r.x, y: r.y, w: r.w, h: r.h, a: 1, name: r.name });
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.vroomAt[y * m.w + x] < 0) m.vroomAt[y * m.w + x] = id;
  });
}
function vroomOf(m, x, y) { const tx = Math.floor(x / 16), ty = Math.floor((y - 4) / 16); if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return -1; return m.vroomAt[ty * m.w + tx]; }
function roomVisUpdate(dt, P) {
  const m = G.m; if (!m) return; if (!m.vroomAt) roomVisSetup(m);
  const see = new Set(), add = (x, y) => { const i = vroomOf(m, x, y); if (i >= 0) see.add(i); };
  if (P.hidden) { const s = P.hidden; add(s.x * 16 + 8, s.y * 16 + 12); s.stand && s.stand.forEach(([x, y]) => add(x * 16 + 8, y * 16 + 12)); }
  else {
    add(P.x, P.y);
    // sur le pas d'une porte : on découvre la pièce derrière
    const tx = Math.floor(P.x / 16), ty = Math.floor((P.y - 4) / 16);
    if (m.get(tx, ty) === K.DOOR) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => add((tx + dx) * 16 + 8, (ty + dy) * 16 + 12));
  }
  const k = Math.min(1, dt * 7);
  m.vrooms.forEach((r, i) => { const t = see.has(i) || easyOn() ? 0 : 1; r.a += (t - r.a) * k; if (Math.abs(t - r.a) < 0.01) r.a = t; });
}
// une personne est-elle visible ? (dans un couloir, ou dans une pièce qui n'est pas dans le noir)
function regionVisible(x, y) { const m = G.m; if (!m || !m.vroomAt || easyOn()) return true; const i = vroomOf(m, x, y); return i < 0 || m.vrooms[i].a < 0.97; }
function drawRoomShade(fx, ox, oy) {
  const m = G.m; if (!m || !m.vrooms) return;
  for (const r of m.vrooms) {
    if (r.a <= 0.01) continue;
    fx.fillStyle = 'rgba(14,8,34,' + (0.93 * r.a).toFixed(3) + ')';
    fx.fillRect(r.x * 16 + ox, r.y * 16 + oy, r.w * 16, r.h * 16 - (TALL_KINDS.has(m.get(r.x, r.y + r.h)) ? OVERHANG : 0));
  }
}
