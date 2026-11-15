// ================= TUILES =================
const K = {
  FLOOR: 0, WALL: 1, FENCE: 2, DOOR: 3, DESK: 4, TABLE: 5, ARMOIRE: 6, SHELF: 7, LOCKER: 8, TRASH: 9, PLANT: 10, BUSH: 11, TREE: 12,
  BENCH: 13, SLIDE: 14, BED: 15, STALL: 16, MATS: 17, BALLBIN: 18, COPIER: 19, SOFA: 20, COUNTER: 21, BLEACH: 22, BIKES: 23,
  CABANE: 24, MEET: 25, PILLAR: 26,
  X_WINDOW: 30, X_GATE: 31, X_HOLE: 32, X_DOOR: 33, X_ELEV: 34
};
const KP = [];
function kp(k, o) { KP[k] = Object.assign({ solid: 1, opaque: 0, hide: null }, o); }
kp(K.FLOOR, { solid: 0 });
kp(K.WALL, { opaque: 1 }); kp(K.FENCE, {}); kp(K.DOOR, { solid: 0, hide: { n: 'derrière la porte', peek: 4 } });
kp(K.DESK, { hide: { n: 'sous le bureau', peek: 4 } });
kp(K.TABLE, { hide: { n: 'sous la table', peek: 4, small: 1 } });
kp(K.ARMOIRE, { opaque: 1, hide: { n: 'dans l’armoire', peek: 2 } });
kp(K.SHELF, { opaque: 1 });
kp(K.LOCKER, { opaque: 1, hide: { n: 'dans le casier', peek: 2 } });
kp(K.TRASH, { hide: { n: 'derrière la poubelle', peek: 4.5 } });
kp(K.PLANT, { hide: { n: 'dans le pot de fleurs', peek: 3.5, small: 1 } });
kp(K.BUSH, { hide: { n: 'dans le buisson', peek: 4 } });
kp(K.TREE, { opaque: 1, hide: { n: 'derrière l’arbre', peek: 5 } });
kp(K.BENCH, { hide: { n: 'sous le banc', peek: 4, small: 1 } });
kp(K.SLIDE, { hide: { n: 'sous le toboggan', peek: 4 } });
kp(K.BED, { hide: { n: 'sous le lit', peek: 3 } });
kp(K.STALL, { opaque: 1, hide: { n: 'dans les toilettes', peek: 2 } });
kp(K.MATS, { hide: { n: 'sous les tapis', peek: 2.5 } });
kp(K.BALLBIN, { hide: { n: 'dans le bac à ballons', peek: 3 } });
kp(K.COPIER, { hide: { n: 'derrière la photocopieuse', peek: 3, small: 1 } });
kp(K.SOFA, { hide: { n: 'derrière le canapé', peek: 4 } });
kp(K.COUNTER, { hide: { n: 'derrière le comptoir', peek: 4 } });
kp(K.BLEACH, { hide: { n: 'sous les gradins', peek: 3.5 } });
kp(K.BIKES, {});
kp(K.CABANE, { opaque: 1, hide: { n: 'dans la cabane', peek: 3 } });
kp(K.MEET, { hide: { n: 'sous la grande table', peek: 4 } });
kp(K.PILLAR, { opaque: 1 });
kp(K.X_WINDOW, { opaque: 1 }); kp(K.X_GATE, {}); kp(K.X_HOLE, { opaque: 1 }); kp(K.X_DOOR, { opaque: 1 }); kp(K.X_ELEV, { opaque: 1 });
const SEARCHABLE_KINDS = new Set([K.SHELF, K.BUSH, K.MATS, K.ARMOIRE, K.LOCKER, K.TRASH, K.BALLBIN]);

const FS = { ASPHALT: 0, GRASS: 1, SAND: 2, PREAU: 3, WOOD: 4, LINO: 5, TILE: 6, CARPET: 7, GYM: 8, OFFICE: 9, CHECK: 10, ROYAL: 11 };
const WS = { BRICK: 0, PAINT: 1, GREEN: 2, BLUE: 3, WOOD: 4 };
const WSTYLE = [
  { top: '#4a3d55', face: '#b5523b', faceD: '#8e3a2a', trim: '#d9d0c4', base: '#6b2b20' },
  { top: '#4d4660', face: '#f0e3c4', faceD: '#d8c8a4', trim: '#ffffff', base: '#8a6a4a' },
  { top: '#3f5550', face: '#a8d5c2', faceD: '#86b8a4', trim: '#e8f5ef', base: '#3e6b5a' },
  { top: '#3d4766', face: '#8fb4e8', faceD: '#6e93c8', trim: '#e0ecff', base: '#2a3f7a' },
  { top: '#4a3428', face: '#9a6a44', faceD: '#7a5034', trim: '#d4a86a', base: '#4a2a18' },
];
function drawFloorTile(c, px, py, fs, tx, ty) {
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h); };
  const h = hash2(tx, ty), h2 = hash2(tx + 77, ty * 3 + 5);
  switch (fs) {
    case FS.ASPHALT: R(0, 0, 16, 16, '#83869a'); for (let i = 0; i < 6; i++) R((h2 * 61 + i * 23) % 16 | 0, (h * 89 + i * 41) % 16 | 0, 1, 1, i % 3 ? '#8c8fa2' : '#6c6f80'); for (let i = 0; i < 6; i++) R((h * 97 + i * 37) % 16 | 0, (h2 * 53 + i * 71) % 16 | 0, 1, 1, i % 2 ? '#9396a8' : '#74778a'); break;
    case FS.GRASS: R(0, 0, 16, 16, '#5aa64e'); for (let i = 0; i < 5; i++) { const a = (h * 91 + i * 29) % 15 | 0, b = (h2 * 61 + i * 43) % 14 | 0; R(a, b, 1, 2, '#6fbf5e'); R(a + 1, b + 1, 1, 1, '#4a8f40'); } if (h > 0.85) { R(6, 6, 2, 2, '#fff6a0'); R(7, 7, 1, 1, '#f2a33a'); } break;
    case FS.SAND: R(0, 0, 16, 16, '#ecce86'); for (let i = 0; i < 6; i++) R((h * 83 + i * 31) % 16 | 0, (h2 * 47 + i * 59) % 16 | 0, 1, 1, i % 2 ? '#d9b868' : '#f6e0a6'); break;
    case FS.PREAU: R(0, 0, 16, 16, '#9c928a'); R(0, 0, 16, 1, '#8a8078'); R(0, 0, 1, 16, '#8a8078'); R(8, 0, 1, 16, '#938980'); R(0, 8, 16, 1, '#938980'); break;
    case FS.WOOD: { for (let r = 0; r < 4; r++) { const row = ty * 4 + r, hv = hash2(tx + ((row * 5) % 3), row); R(0, r * 4, 16, 4, shade('#c99260', (hv - 0.5) * 0.18)); R(0, r * 4, 16, 1, shade('#c99260', 0.1 + (hv - 0.5) * 0.1)); R(0, r * 4 + 3, 16, 1, '#a06c3a'); const sx = ((row * 7 + tx * 16) % 23) % 16; R(sx, r * 4, 1, 3, '#a8743f'); R(((hv * 97) | 0) % 13, r * 4 + 1, 3, 1, shade('#c99260', -0.1)); if (hv > 0.85) R(((hv * 53) | 0) % 14, r * 4 + 2, 1, 1, '#8a5a30'); } break; }
    case FS.LINO: R(0, 0, 16, 16, '#cdd5dc'); R(0, 0, 16, 1, '#bfc8d0'); R(0, 0, 1, 16, '#bfc8d0'); R(1, 1, 15, 1, '#d8dfe5'); for (let i = 0; i < 7; i++) R((h * 71 + i * 37) % 16 | 0, (h2 * 33 + i * 51) % 16 | 0, 1, 1, i % 3 ? '#b8c2cc' : '#e2e8ec'); break;
    case FS.TILE: R(0, 0, 16, 16, '#eaf0f2'); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const hv = hash2(tx * 4 + a, ty * 4 + b); if (hv > 0.7) R(a * 4 + 1, b * 4 + 1, 3, 3, hv > 0.93 ? '#dfe8ec' : '#f2f6f7'); R(a * 4 + 1, b * 4 + 1, 1, 1, '#ffffff'); } for (let i = 0; i < 16; i += 4) { R(i, 0, 1, 16, '#c8d3d9'); R(0, i, 16, 1, '#c8d3d9'); } break;
    case FS.CARPET: R(0, 0, 16, 16, '#b8344a'); for (let i = 0; i < 16; i += 4) for (let j = 0; j < 16; j += 4) R(i + ((j / 4) % 2) * 2, j + 1, 1, 1, '#a32b3f'); R(0, 0, 16, 1, '#c44a5e'); break;
    case FS.GYM: R(0, 0, 16, 16, '#e3b675'); for (let i = 0; i < 16; i += 4) R(i, 0, 1, 16, '#d2a160'); R(((tx % 4) * 4 + 1) | 0, ((h * 12) | 0), 2, 3, '#eac487'); break;
    case FS.OFFICE: R(0, 0, 16, 16, '#d9caa8'); for (let i = 0; i < 16; i += 2) R(i, (i * 3) % 16, 1, 1, '#c9b994'); R(0, 0, 16, 1, '#cdbd99'); break;
    case FS.CHECK: { const a = shade('#ebe6da', (h - 0.5) * 0.04), b = shade('#c2b9a8', (h2 - 0.5) * 0.05); R(0, 0, 8, 8, a); R(8, 8, 8, 8, a); R(8, 0, 8, 8, b); R(0, 8, 8, 8, b); R(0, 0, 8, 1, '#f6f2ea'); R(8, 8, 8, 1, '#f6f2ea'); R(8, 0, 8, 1, '#ccc4b4'); R(0, 8, 8, 1, '#ccc4b4'); R(7, 0, 1, 16, 'rgba(0,0,0,0.04)'); break; }
    case FS.ROYAL: R(0, 0, 16, 16, '#3b4f9a'); R(0, 0, 16, 1, '#4a60ae'); if ((tx + ty) % 2 === 0) { R(7, 7, 2, 2, '#c8a84a'); R(6, 8, 4, 0, '#c8a84a'); } break;
  }
}
function drawWallTile(c, px, py, ws, face, tx, ty) {
  const S = WSTYLE[ws];
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h); };
  if (!face) { R(0, 0, 16, 16, S.top); R(0, 0, 16, 1, shade(S.top, 0.12)); if (hash2(tx, ty) > 0.7) R(5, 6, 2, 1, shade(S.top, -0.15)); return; }
  R(0, 0, 16, 16, S.face); R(0, 0, 16, 3, S.top); R(0, 3, 16, 1, S.trim);
  if (ws === WS.BRICK) {
    for (let r = 0; r < 4; r++) { const yy = 4 + r * 3; const o = (r % 2) * 4; for (let i = o - 8; i < 16; i += 8) { const hv = hash2(tx * 3 + ((i + 16) >> 3), ty * 5 + r); R(Math.max(0, i + 1), yy, Math.min(7, 16 - i - 1, i + 8), 2, shade(S.face, (hv - 0.5) * 0.16)); R(Math.max(0, i + 1), yy, Math.min(7, 16 - i - 1, i + 8), 1, shade(S.face, 0.08)); } R(0, yy + 2, 16, 1, S.faceD); for (let i = o; i < 16; i += 8) R(i, yy, 1, 2, S.faceD); }
  } else if (ws === WS.WOOD) {
    for (let i = 1; i < 16; i += 5) R(i, 4, 1, 10, S.faceD); R(0, 9, 16, 1, S.trim);
    R(0, 13, 16, 3, S.base);
  } else {
    const hv = hash2(tx * 7, ty * 3); for (let i = 0; i < 4; i++) R(((hv * 97 + i * 37) | 0) % 16, 4 + (((hv * 53 + i * 29) | 0) % 8), 1, 1, shade(S.face, i % 2 ? -0.04 : 0.04));
    R(0, 4, 16, 1, shade(S.face, 0.06)); R(0, 11, 16, 1, shade(S.face, -0.06)); R(0, 12, 16, 1, S.faceD); R(0, 13, 16, 3, S.base); R(0, 13, 16, 1, shade(S.base, 0.25));
    if (ws === WS.BLUE) { R(0, 7, 16, 2, '#f2f6ff'); }
  }
}
function drawWallDecor(c, px, py, d, i) {
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h); };
  switch (d.t) {
    case 'window': R(3, 5, 10, 7, '#ffffff'); R(4, 6, 8, 5, '#8fd3ff'); R(8, 6, 1, 5, '#ffffff'); R(4, 8, 8, 1, '#ffffff'); R(5, 6, 2, 1, '#d6f1ff'); break;
    case 'bigdoor': R(1, 3, 14, 13, '#5a351c'); R(2, 4, 12, 12, '#7a4b2a'); R(8, 4, 1, 12, '#4a2a14'); R(6, 9, 1, 2, '#ffd23f'); R(9, 9, 1, 2, '#ffd23f'); R(2, 4, 12, 1, '#9a6338'); break;
    case 'board': R(0, 4, 16, 8, '#2f5a3a'); R(0, 4, 16, 1, '#7a4b2a'); R(0, 11, 16, 1, '#7a4b2a'); if (i === 0) R(0, 4, 1, 8, '#7a4b2a'); if (i === d.w - 1) R(15, 4, 1, 8, '#7a4b2a');
      R(2 + (i * 5) % 7, 6, 4, 1, '#e8f2ea'); R(3, 8, 2 + (i * 3) % 6, 1, '#e8f2ea'); break;
    case 'poster': { const cols = ['#ff6f91', '#3d7bff', '#fec43a', '#63c74d']; const col = cols[(d.x * 7 + d.y) % 4]; R(4, 5, 8, 8, '#ffffff'); R(5, 6, 6, 4, col); R(5, 11, 6, 1, '#888'); break; }
    case 'clock': R(5, 5, 6, 6, '#ffffff'); R(6, 4, 4, 8, '#ffffff'); R(4, 6, 8, 4, '#ffffff'); R(8, 6, 1, 3, '#222'); R(8, 8, 2, 1, '#222'); break;
    case 'keys': R(2, 4, 12, 8, '#a8703a'); R(2, 4, 12, 1, '#c08a54'); for (let k = 0; k < 4; k++) { R(4 + k * 2.5 | 0, 6, 1, 1, '#555'); R(4 + k * 2.5 | 0, 7, 1, 3, k % 2 ? '#ffd23f' : '#c0c8d8'); } break;
    case 'frame': R(3, 4, 10, 9, '#c8a84a'); R(4, 5, 8, 7, '#7ec8ff'); R(4, 9, 8, 3, '#4fa04a'); R(9, 6, 2, 2, '#fff6a0'); break;
    case 'portrait': R(2, 3, 12, 11, '#c8a84a'); R(3, 4, 10, 9, '#6b3a5a'); R(6, 5, 4, 4, '#f6c79a'); R(5, 4, 6, 2, '#f2c65a'); R(5, 9, 6, 4, '#e0249a'); R(7, 9, 2, 1, '#fff'); break;
    case 'hoop': R(5, 3, 6, 6, '#ffffff'); R(5, 3, 6, 1, '#e43b44'); R(6, 9, 4, 1, '#f77622'); R(6, 10, 1, 3, '#ddd'); R(9, 10, 1, 3, '#ddd'); R(7, 12, 2, 1, '#ddd'); break;
    case 'screen': R(0, 4, 16, 8, '#e8eef8'); R(0, 4, 16, 1, '#555'); R(3, 6, 10, 1, '#9fb4d8'); R(3, 8, 7, 1, '#9fb4d8'); break;
    case 'map': R(2, 4, 12, 9, '#f6e7c1'); R(4, 6, 4, 3, '#63c74d'); R(9, 7, 3, 4, '#63c74d'); R(2, 4, 12, 1, '#7a4b2a'); break;
    case 'sign': R(3, 5, 10, 5, d.col || '#3d7bff'); R(4, 7, 8, 1, '#ffffff'); break;
    case 'alarm': R(4, 4, 8, 9, '#1a1028'); R(5, 5, 6, 7, '#e43b44'); R(6, 6, 4, 3, '#ffffff'); R(7, 7, 2, 1, '#e43b44'); R(6, 10, 4, 1, '#ff9fa8'); R(5, 5, 6, 1, '#ff6b74'); break;
    case 'evac': R(1, 3, 14, 11, '#1a6b3a'); R(2, 4, 12, 9, '#f6f2e0'); R(3, 5, 4, 3, '#9ad0a0'); R(8, 5, 4, 3, '#9ad0a0'); R(3, 9, 9, 1, '#63c74d'); R(11, 9, 1, 3, '#e43b44'); R(10, 11, 3, 1, '#e43b44'); break;
    case 'stairsign': R(3, 4, 10, 8, '#2f9e5a'); R(4, 5, 8, 6, '#3fc070'); R(6, 6, 1, 4, '#ffffff'); R(6, 9, 4, 1, '#ffffff'); R(9, 6, 1, 3, '#ffffff'); break;
    default: drawWallDecorX(c, px, py, d, i, R);
  }
}
function drawFurniture(c, k, px, py, tx, ty, m, L) {
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h); };
  const same = (dx, dy) => m.get(tx + dx, ty + dy) === k;
  const h = hash2(tx, ty);
  switch (k) {
    case K.DESK: {
      const l = !same(-1, 0), r = !same(1, 0), x0 = l ? 1 : 0, w = 16 - x0 - (r ? 1 : 0);
      R(x0, 2, w, 9, '#8b5a2b'); R(x0, 2, w, 1, '#a8703a'); R(x0, 11, w, 4, '#6b4220'); R(x0, 15, w, 1, '#4a2a14');
      if (l) R(x0 + 2, 12, 4, 2, '#57351a'); if (r) R(10, 12, 4, 2, '#57351a');
      if (h > 0.5) { R(4, 4, 5, 4, '#ffffff'); R(5, 5, 3, 1, '#9fb4d8'); } else { R(9, 4, 3, 3, '#e43b44'); R(10, 3, 1, 1, '#3e8948'); }
      if (h > 0.3 && h < 0.7) R(11, 6, 3, 1, '#fec43a');
      break;
    }
    case K.TABLE: {
      R(1, 2, 14, 7, '#dba86e'); R(1, 2, 14, 1, '#ecc08a'); R(1, 9, 14, 2, '#b07a45'); R(2, 11, 1, 2, '#6b4220'); R(13, 11, 1, 2, '#6b4220');
      const cc = ['#4f6fa8', '#c0392b', '#3e8948', '#7b45a8'][(h * 4) | 0];
      R(5, 12, 6, 3, cc); R(5, 15, 6, 1, shade(cc, -0.3));
      if (h > 0.4) { R(4, 4, 4, 3, '#ffffff'); R(5, 5, 2, 1, '#9fb4d8'); } if (h > 0.75) R(9, 5, 4, 1, '#3d7bff');
      break;
    }
    case K.MEET: {
      const t = !same(0, -1), b = !same(0, 1), l = !same(-1, 0), r = !same(1, 0);
      R(l ? 1 : 0, t ? 2 : 0, 16 - (l ? 1 : 0) - (r ? 1 : 0), 16 - (t ? 2 : 0) - (b ? 3 : 0), '#6b4228');
      if (t) { R(l ? 1 : 0, 2, 16 - (l ? 1 : 0) - (r ? 1 : 0), 1, '#8b5a38'); R(5, 0, 6, 2, '#2f3346'); }
      if (b) { R(l ? 1 : 0, 13, 16 - (l ? 1 : 0) - (r ? 1 : 0), 2, '#4a2a18'); R(5, 15, 6, 1, '#2f3346'); }
      if (h > 0.6) { R(5, 6, 5, 4, '#ffffff'); } if (h < 0.25) R(9, 8, 3, 3, '#c0d8f0');
      break;
    }
    case K.ARMOIRE: R(1, 0, 14, 15, '#7a4b2a'); R(1, 0, 14, 2, '#9a6338'); R(8, 3, 1, 11, '#5a351c'); R(2, 3, 12, 1, '#5a351c'); R(6, 8, 1, 2, '#ffd23f'); R(10, 8, 1, 2, '#ffd23f'); R(1, 14, 14, 1, '#4a2a14'); R(2, 4, 1, 9, '#8b5a33'); break;
    case K.SHELF: {
      R(0, 0, 16, 15, '#6b4423'); R(0, 0, 16, 1, '#8b5a33'); R(0, 15, 16, 1, '#3a2414');
      const binders = L && L.binders;
      const pal = binders ? ['#e43b44', '#3d7bff', '#fec43a', '#63c74d', '#ff6fb5', '#2ce8d5'] : ['#c0392b', '#2f6fdf', '#3e8948', '#fec43a', '#7b45a8', '#f77622', '#e8e8e8', '#1f4e99'];
      for (let r = 0; r < 3; r++) {
        const yy = 1 + r * 5; R(1, yy, 14, 4, '#3a2414');
        let xx = 1; let n = 0;
        while (xx < 15) {
          const bw = binders ? 3 : 1 + ((hash2(tx * 13 + n, ty * 7 + r) * 2) | 0);
          const bh = binders ? 4 : 3 + ((hash2(tx + n * 3, ty + r * 11) * 2) | 0);
          const col = pal[(hash2(tx * 5 + n, ty * 3 + r) * pal.length) | 0];
          R(xx, yy + 4 - bh, Math.min(bw, 15 - xx), bh, col);
          if (binders) R(xx + 1, yy + 1, 1, 2, '#ffffff');
          xx += bw + (binders ? 0 : (hash2(n, r) > 0.8 ? 1 : 0)); n++;
        }
      }
      break;
    }
    case K.LOCKER: { const lc = (L && L.lockerCol) || '#4f7fc0'; R(0, 0, 16, 16, shade(lc, -0.45)); R(1, 0, 14, 15, lc); R(1, 0, 14, 1, shade(lc, 0.25)); R(8, 0, 1, 15, shade(lc, -0.3)); for (let v = 0; v < 3; v++) { R(3, 2 + v * 2, 3, 1, shade(lc, -0.3)); R(10, 2 + v * 2, 3, 1, shade(lc, -0.3)); } R(6, 8, 1, 3, '#e0e0e0'); R(10, 8, 1, 3, '#e0e0e0'); R(1, 15, 14, 1, shade(lc, -0.5)); break; }
    case K.TRASH: R(4, 4, 8, 10, '#3e8948'); R(3, 3, 10, 2, '#2f6b37'); R(6, 6, 1, 6, '#2f6b37'); R(9, 6, 1, 6, '#2f6b37'); R(5, 14, 6, 1, '#1f4a25'); if (h > 0.4) { R(6, 1, 3, 2, '#ffffff'); R(9, 2, 2, 1, '#fec43a'); } break;
    case K.PLANT: R(5, 10, 6, 5, '#c0603a'); R(4, 9, 8, 2, '#d97a4a'); R(3, 3, 4, 5, '#3e8948'); R(9, 2, 4, 6, '#3e8948'); R(6, 0, 4, 9, '#63c74d'); R(4, 6, 2, 1, '#63c74d'); R(11, 4, 1, 2, '#8fd86e'); R(7, 1, 1, 3, '#8fd86e'); break;
    case K.BUSH: R(1, 4, 14, 11, '#3e8948'); R(2, 2, 12, 3, '#4fa04a'); R(0, 7, 16, 6, '#3e8948'); R(4, 4, 3, 2, '#63c74d'); R(9, 6, 3, 2, '#63c74d'); R(3, 10, 2, 2, '#63c74d'); R(1, 14, 14, 1, '#2a5e30'); if (h > 0.6) { R(11, 10, 1, 1, '#ff6fb5'); R(5, 7, 1, 1, '#fff6a0'); } break;
    case K.TREE: c.fillStyle = 'rgba(10,6,20,0.28)'; c.beginPath(); c.ellipse(px + 8, py + 15, 8, 2.6, 0, 0, 7); c.fill(); drawTree(c, px, py); break;
    case K.BENCH: R(1, 5, 14, 2, '#b07a45'); R(1, 8, 14, 2, '#b07a45'); R(1, 5, 14, 1, '#cf9a60'); R(2, 10, 1, 4, '#555'); R(13, 10, 1, 4, '#555'); break;
    case K.SLIDE: R(3, 0, 10, 4, '#e43b44'); R(4, 4, 8, 12, '#fec43a'); for (let i = 6; i < 16; i += 3) R(4, i, 8, 1, '#f77622'); R(3, 4, 1, 12, '#d0d6e0'); R(12, 4, 1, 12, '#d0d6e0'); R(5, 1, 6, 1, '#ff6f6f'); break;
    case K.CABANE: R(1, 5, 14, 11, '#c08a54'); for (let i = 7; i < 16; i += 3) R(1, i, 14, 1, '#a8743f'); R(6, 9, 4, 7, '#5a351c'); c.fillStyle = '#e43b44'; for (let i = 0; i < 6; i++) c.fillRect(px + 2 - i + 2, py - 3 + i, 12 + i * 2 - 4, 1); R(0, 2, 16, 3, '#c62828'); R(10, 7, 3, 2, '#8fd3ff'); break;
    case K.BED: R(2, 0, 12, 16, '#d0d6e0'); R(3, 4, 10, 11, '#9fd7ff'); R(3, 4, 10, 1, '#c8ecff'); R(4, 1, 8, 3, '#ffffff'); R(2, 15, 12, 1, '#8890a0'); break;
    case K.STALL: R(0, 0, 16, 16, '#6f83a8'); R(1, 1, 14, 13, '#8fa3c8'); R(2, 2, 12, 11, '#7b8fb8'); R(11, 7, 1, 2, '#eeeeee'); R(2, 14, 12, 2, '#3a3a4a'); R(12, 3, 1, 1, '#3ccf6e'); break;
    case K.MATS: R(1, 3, 14, 11, '#3d6fd0'); R(1, 6, 14, 1, '#2a4fa0'); R(1, 9, 14, 1, '#2a4fa0'); R(1, 12, 14, 1, '#2a4fa0'); R(1, 3, 14, 1, '#6a96f0'); R(3, 11, 2, 1, '#ffffff'); R(11, 11, 2, 1, '#ffffff'); R(1, 14, 14, 1, '#1f3a7a'); break;
    case K.BALLBIN: R(1, 6, 14, 9, '#8b9bb4'); for (let i = 3; i < 15; i += 3) R(i, 6, 1, 9, '#6b7b94'); R(1, 6, 14, 1, '#aab8cc'); R(2, 2, 4, 4, '#f77622'); R(6, 1, 4, 4, '#e43b44'); R(10, 3, 4, 4, '#fec43a'); R(4, 4, 3, 3, '#2ce8d5'); R(3, 3, 1, 1, '#ffffff'); R(7, 2, 1, 1, '#ffffff'); break;
    case K.COPIER: R(1, 4, 14, 11, '#c8ccd6'); R(1, 2, 14, 3, '#a8acb6'); R(10, 5, 4, 2, '#2a2d44'); R(13, 5, 1, 1, '#3ccf6e'); R(3, 11, 8, 2, '#ffffff'); R(1, 14, 14, 1, '#888c96'); break;
    case K.SOFA: { const sc = (L && L.sofaCol) || '#c0392b'; const l = !same(-1, 0), r = !same(1, 0); R(0, 2, 16, 4, shade(sc, -0.25)); R(0, 6, 16, 8, sc); if (l) R(0, 4, 3, 10, shade(sc, -0.15)); if (r) R(13, 4, 3, 10, shade(sc, -0.15)); R(8, 7, 1, 6, shade(sc, -0.25)); R(0, 14, 16, 1, shade(sc, -0.45)); R(4, 7, 3, 1, shade(sc, 0.2)); break; }
    case K.COUNTER: R(0, 3, 16, 12, '#8b5a2b'); R(0, 3, 16, 3, '#c99260'); R(0, 3, 16, 1, '#ddb07a'); R(0, 14, 16, 1, '#4a2a14'); for (let i = 3; i < 16; i += 5) R(i, 7, 1, 7, '#6b4220'); if (h > 0.6) { R(4, 0, 5, 3, '#ffffff'); } else if (h > 0.3) { R(10, 1, 3, 2, '#2a2d44'); } break;
    case K.BLEACH: R(0, 0, 16, 5, '#a8743f'); R(0, 5, 16, 1, '#6b4423'); R(0, 6, 16, 5, '#c08a54'); R(0, 11, 16, 1, '#6b4423'); R(0, 12, 16, 4, '#d9a066'); break;
    case K.BIKES: { R(0, 7, 16, 1, '#8890a0'); const fc = ['#e43b44', '#3d7bff', '#63c74d', '#fec43a'][(h * 4) | 0]; c.strokeStyle = '#25222e'; c.lineWidth = 1; c.beginPath(); c.arc(px + 4.5, py + 10.5, 3, 0, 7); c.stroke(); c.beginPath(); c.arc(px + 11.5, py + 10.5, 3, 0, 7); c.stroke(); R(5, 7, 6, 1, fc); R(7, 7, 1, 3, fc); R(10, 5, 2, 1, '#25222e'); break; }
    case K.PILLAR: R(4, 0, 8, 16, '#bcb1a7'); R(4, 0, 8, 2, '#d6ccc2'); R(10, 2, 2, 14, '#9c9188'); R(3, 14, 10, 2, '#8a8078'); break;
    case K.FENCE: {
      const hz = m.get(tx - 1, ty) === K.FENCE || m.get(tx + 1, ty) === K.FENCE || m.get(tx - 1, ty) === K.X_GATE || m.get(tx + 1, ty) === K.X_GATE;
      c.fillStyle = 'rgba(70,78,96,0.55)';
      if (hz) { for (let i = 0; i < 16; i += 3) c.fillRect(px + i, py + 4, 1, 10); c.fillRect(px, py + 4, 16, 1); c.fillRect(px, py + 9, 16, 1); R(0, 3, 2, 12, '#5a6070'); R(0, 3, 16, 1, '#7a8090'); }
      else { for (let i = 0; i < 16; i += 3) c.fillRect(px + 6, py + i, 4, 1); R(7, 0, 2, 16, '#5a6070'); R(6, 0, 1, 16, '#7a8090'); }
      break;
    }
    case K.X_GATE: R(0, 3, 16, 12, '#2f5a3a'); for (let i = 2; i < 16; i += 3) R(i, 4, 1, 10, '#4f8a5a'); R(0, 3, 16, 1, '#6fb07a'); R(0, 14, 16, 1, '#1f3a26'); R(7, 7, 3, 3, '#ffd23f'); break;
    case K.X_HOLE: {
      const fence = m.get(tx, ty - 1) === K.FENCE || m.get(tx, ty + 1) === K.FENCE;
      if (fence) { c.fillStyle = 'rgba(70,78,96,0.55)'; for (let i = 0; i < 16; i += 3) c.fillRect(px + 6, py + i, 4, 1); R(7, 0, 2, 9, '#5a6070'); R(4, 10, 8, 6, '#1a1222'); R(5, 9, 6, 1, '#1a1222'); R(5, 14, 6, 2, '#3a2a1a'); }
      else { R(5, 11, 6, 5, '#140d1c'); R(6, 10, 4, 1, '#140d1c'); R(4, 15, 8, 1, '#3a2a2a'); }
      break;
    }
    case K.X_DOOR: R(1, 1, 14, 15, '#2f8a4a'); R(2, 2, 12, 14, '#3fae5e'); R(3, 7, 10, 1, '#d0d6e0'); R(3, 7, 1, 3, '#d0d6e0'); R(4, 3, 8, 3, '#ffffff'); R(6, 3, 2, 1, '#2f8a4a'); R(7, 4, 2, 2, '#2f8a4a'); break;
    case K.X_ELEV: R(0, 1, 16, 15, '#8a909c'); R(1, 3, 14, 13, '#c4ccd8'); R(8, 3, 1, 13, '#7a8290'); R(5, 1, 6, 2, '#2a2d44'); R(7, 1, 2, 1, '#ff6060'); R(2, 4, 2, 11, '#d6dde8'); R(11, 4, 2, 11, '#d6dde8'); break;
    case K.X_WINDOW: R(2, 4, 12, 9, '#ffffff'); R(3, 5, 10, 7, '#8fd3ff'); R(8, 5, 1, 7, '#ffffff'); R(3, 8, 10, 1, '#ffffff'); R(4, 5, 3, 1, '#d6f1ff'); R(1, 12, 14, 2, '#d8d0c4'); break;
  }
}
function drawFloorDecor(c, d) {
  const px = d.x * 16, py = d.y * 16;
  switch (d.t) {
    case 'assembly': {
      c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.setLineDash([5, 4]); c.strokeRect(px + 2, py + 2, d.w * 16 - 4, d.h * 16 - 4); c.setLineDash([]);
      for (let i = 0; i < d.w; i += 2) { c.fillStyle = 'rgba(255,210,63,0.18)'; c.fillRect(px + i * 16 + 4, py + 4, 8, d.h * 16 - 8); }
      c.fillStyle = '#2f9e5a'; c.fillRect(px + (d.w * 8) - 14, py - 9, 28, 10); c.fillStyle = '#ffffff'; c.fillRect(px + (d.w * 8) - 10, py - 6, 20, 1); c.fillRect(px + (d.w * 8) - 10, py - 3, 14, 1);
      break;
    }
    case 'court': c.fillStyle = '#f2f2f2';
      c.fillRect(px + 2, py + 2, d.w * 16 - 4, 1); c.fillRect(px + 2, py + d.h * 16 - 3, d.w * 16 - 4, 1);
      c.fillRect(px + 2, py + 2, 1, d.h * 16 - 4); c.fillRect(px + d.w * 16 - 3, py + 2, 1, d.h * 16 - 4);
      c.fillRect(px + 2, py + (d.h * 8) | 0, d.w * 16 - 4, 1);
      c.strokeStyle = '#f2f2f2'; c.beginPath(); c.arc(px + d.w * 8, py + d.h * 8, 18, 0, 7); c.stroke();
      c.fillStyle = '#e43b44'; c.fillRect(px + d.w * 8 - 1, py + 4, 2, 2); c.fillRect(px + d.w * 8 - 1, py + d.h * 16 - 6, 2, 2); break;
    case 'marelle': { const cols = ['#ffffff', '#fec43a', '#ff6fb5']; for (let i = 0; i < 5; i++) { c.strokeStyle = cols[i % 3]; c.strokeRect(px + 4.5 + (i % 2 ? 8 : 0) * (i === 2 ? 0 : 0), py + 0.5 + i * 9, 10, 8); } c.fillStyle = '#ffffff'; c.fillRect(px + 8, py + 4, 2, 2); break; }
    case 'gymlines': c.fillStyle = 'rgba(228,59,68,0.7)';
      c.fillRect(px + 8, py + 8, d.w * 16 - 16, 1); c.fillRect(px + 8, py + d.h * 16 - 9, d.w * 16 - 16, 1); c.fillRect(px + 8, py + 8, 1, d.h * 16 - 16); c.fillRect(px + d.w * 16 - 9, py + 8, 1, d.h * 16 - 16);
      c.fillRect(px + (d.w * 8) | 0, py + 8, 1, d.h * 16 - 16);
      c.strokeStyle = 'rgba(61,123,255,0.7)'; c.beginPath(); c.arc(px + d.w * 8, py + d.h * 8, 26, 0, 7); c.stroke(); break;
    case 'stairs': for (let i = 0; i < d.h * 4; i++) { c.fillStyle = i % 2 ? '#a8a090' : '#c8c0b0'; c.fillRect(px, py + i * 4, d.w * 16, 4); } c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(px, py, 3, d.h * 16); break;
    case 'rug': c.fillStyle = d.col || '#7b45a8'; c.fillRect(px + 2, py + 2, d.w * 16 - 4, d.h * 16 - 4); c.fillStyle = shade(d.col || '#7b45a8', 0.3); c.fillRect(px + 4, py + 4, d.w * 16 - 8, 1); c.fillRect(px + 4, py + d.h * 16 - 5, d.w * 16 - 8, 1); break;
    default: drawFloorDecorX(c, d, px, py);
  }
}
// un arbre vu de 3/4 : le feuillage dépasse sur la case du dessus (on passe derrière)
function drawTree(c, px, py) {
  const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h); };
  R(6, 5, 4, 11, '#7a4b2a'); R(7, 5, 1, 11, '#9a6a3c'); R(9, 6, 1, 10, '#5a351c'); R(5, 14, 6, 2, '#5a351c');
  R(-2, -9, 20, 14, '#245a2e'); R(0, -14, 16, 21, '#245a2e'); R(2, -16, 12, 3, '#245a2e');
  R(-1, -10, 18, 12, '#2f6b37'); R(1, -14, 14, 19, '#2f6b37');
  R(0, -12, 15, 11, '#3e8948'); R(2, -15, 11, 6, '#3e8948'); R(-1, -7, 8, 7, '#3e8948'); R(9, -6, 8, 6, '#3e8948');
  R(3, -14, 5, 3, '#4fa04a'); R(10, -11, 4, 3, '#4fa04a'); R(1, -6, 4, 3, '#4fa04a'); R(11, -3, 4, 2, '#4fa04a');
  R(4, -14, 2, 1, '#63c74d'); R(11, -11, 2, 1, '#63c74d'); R(2, -6, 2, 1, '#63c74d'); R(6, -9, 2, 1, '#63c74d');
  R(-1, 2, 18, 2, '#1d4a26'); R(1, 4, 14, 2, '#1d4a26');
}
// ce qui dépasse vers le haut et cache ce qui passe derrière : redessiné par-dessus, trié avec les personnages
const FRONT_KINDS = { [K.TREE]: { x: -2, y: -16, w: 20, h: 32 }, [K.CABANE]: { x: 0, y: -3, w: 16, h: 19 } };
const FRONT_CACHE = {};
function frontSprite(k) {
  if (FRONT_CACHE[k]) return FRONT_CACHE[k];
  const f = FRONT_KINDS[k], [cv, c] = mkCanvas(f.w, f.h);
  if (k === K.TREE) drawTree(c, -f.x, -f.y); else drawFurniture(c, k, -f.x, -f.y, 0, 0, { get: () => -1 }, null);
  return (FRONT_CACHE[k] = cv);
}
const OVERHANG = 9;
const TALL_KINDS = new Set([K.WALL, K.LOCKER, K.ARMOIRE, K.SHELF, K.STALL, K.COPIER, K.PILLAR, K.X_WINDOW, K.X_DOOR, K.X_ELEV]);
function isWallish(k) { return k === K.WALL || k === K.X_WINDOW || k === K.X_DOOR || k === K.X_ELEV || k === K.LOCKER; }
function renderMapCanvas(L) {
  const m = L.m; dressMap(L); const [cv, c] = mkCanvas(m.w * 16, m.h * 16);
  // 1) sols
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = m.get(x, y); if (k === K.WALL) continue;
    drawFloorTile(c, x * 16, y * 16, m.fs[y * m.w + x], x, y);
  }
  // 2) usure, petits détails, puis décor au sol, puis ombres au pied des murs
  floorDetails(c, m);
  m.fdecor.forEach(d => drawFloorDecor(c, d));
  aoPass(c, m);
  // 3) murs + objets (de haut en bas)
  L.fronts = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = m.get(x, y), px = x * 16, py = y * 16;
    const below = m.get(x, y + 1);
    const face = !isWallish(below) || y === m.h - 1;
    if (k === K.WALL) { drawWallTile(c, px, py, m.ws[y * m.w + x], face && y < m.h - 1, x, y); continue; }
    if (k === K.FLOOR || k === K.DOOR) continue;
    if (k === K.X_WINDOW || k === K.X_DOOR || k === K.X_ELEV || (k === K.LOCKER && m.get(x, y - 1) === K.WALL && !KP[m.get(x, y + 1)].solid)) drawWallTile(c, px, py, m.ws[y * m.w + x], true, x, y);
    if (k === K.X_HOLE && !(m.get(x, y - 1) === K.FENCE || m.get(x, y + 1) === K.FENCE)) drawWallTile(c, px, py, m.ws[y * m.w + x], true, x, y);
    drawFurniture(c, k, px, py, x, y, m, L);
    const fk = FRONT_KINDS[k]; if (fk) L.fronts.push({ k, x: px + fk.x, y: py + fk.y, w: fk.w, h: fk.h, base: py + 15 });
  }
  // 4) décor mural
  m.decor.forEach(d => { const w = d.w || 1; for (let i = 0; i < w; i++) { if (isWallish(m.get(d.x + i, d.y + 1)) || m.get(d.x + i, d.y) !== K.WALL) continue; drawWallDecor(c, (d.x + i) * 16, d.y * 16, d, i); } });
  // 5) perspective : le haut des murs et des grands meubles dépasse un peu vers le haut (ce qui est derrière est en partie caché)
  L.over = new Uint8Array(m.w * m.h);
  for (let y = 1; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = m.get(x, y), up = m.get(x, y - 1); if (!TALL_KINDS.has(k) || TALL_KINDS.has(up) || up === K.DOOR || up === K.FENCE) continue;
    const px = x * 16, py = y * 16;
    if (k === K.WALL || k === K.X_WINDOW || k === K.X_DOOR || k === K.X_ELEV) { const S = WSTYLE[m.ws[y * m.w + x]]; c.fillStyle = S.top; c.fillRect(px, py - OVERHANG, 16, OVERHANG); c.fillStyle = shade(S.top, 0.14); c.fillRect(px, py - OVERHANG, 16, 1); c.fillStyle = 'rgba(10,6,20,0.25)'; c.fillRect(px, py - OVERHANG - 1, 16, 1); }
    else c.drawImage(cv, px, py, 16, OVERHANG, px, py - OVERHANG, 16, OVERHANG);
    L.over[y * m.w + x] = 1;
  }
  return cv;
}
