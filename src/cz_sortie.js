// ================= SORTIES SCOLAIRES : la piscine et le musée (tuiles et dessins) =================
// Nouvelles tuiles (40+ : les sorties restent entre 30 et 34)
Object.assign(K, { WATER: 40, LADDER: 41, CABIN: 42, LGCHAIR: 43, VITRINE: 44, DINO: 45, ANIMAL: 46 });
kp(K.WATER, { solid: 1 });   // l'élève, lui, peut nager (voir solidP) ; le prof et les élèves de l'ordinateur restent au bord
kp(K.LADDER, {});
kp(K.CABIN, { opaque: 1, hide: { n: 'dans la cabine', peek: 2 } });
kp(K.LGCHAIR, { hide: { n: 'sous la chaise du maître nageur', peek: 4, small: 1 } });
kp(K.VITRINE, { hide: { n: 'derrière la vitrine', peek: 4.5 } });
kp(K.DINO, { hide: { n: 'sous le squelette', peek: 4 } });
kp(K.ANIMAL, { hide: { n: 'derrière l’animal empaillé', peek: 4 } });
TALL_KINDS.add(K.CABIN);
FRONT_KINDS[K.LGCHAIR] = { x: -1, y: -24, w: 18, h: 40 };
const isExitK = k => k >= 30 && k <= 34;

// ---------- dessins des nouvelles tuiles ----------
function vitrineTheme(name) {
  if (/minéraux|Météorites/i.test(name)) return /Météorites/i.test(name) ? 'meteor' : 'min';
  if (/insectes|papillons/i.test(name)) return 'bug';
  if (/fossiles|dinosaures|mammouths/i.test(name)) return 'fos';
  if (/océans|mer/i.test(name)) return 'sea';
  if (/oiseaux/i.test(name)) return 'egg';
  return ['min', 'bug', 'fos', 'egg'][(hash2(name.length, 7) * 4) | 0];
}
function drawFurniture2(c, k, px, py, tx, ty, m, L, R, h) {
  const front = m.get(0, 0) === -1;
  switch (k) {
    case K.WATER: {
      const P0 = (m.pools || []).find(p => tx >= p.x0 && tx <= p.x1 && ty >= p.y0 && ty <= p.y1);
      const t = P0 ? (tx - P0.x0) / Math.max(1, P0.x1 - P0.x0) : 0.5, kid = P0 && P0.kid;
      const base = kid ? '#7fd8f0' : (t < 0.5 ? '#5cc4e6' : t < 0.8 ? '#45addb' : '#348fcb');
      R(0, 0, 16, 16, base);
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(px, py + 15, 16, 1); c.fillRect(px + 15, py, 1, 16);
      if (P0 && P0.lanes && !kid) {
        const ly = (ty - P0.y0) % 3;
        if (ly === 1 && tx > P0.x0 && tx < P0.x1) R(0, 7, 16, 2, 'rgba(18,40,120,0.35)');
        if (ly === 2 && ty < P0.y1) for (let i = 0; i < 16; i += 4) R(i, 14, 3, 2, ((tx * 4 + i) / 4 | 0) % 2 ? '#e43b44' : '#ffffff');
      }
      if (h > 0.55) { R((h * 97 | 0) % 12 + 1, (h * 53 | 0) % 12 + 1, 3, 1, 'rgba(255,255,255,0.35)'); }
      if (m.get(tx, ty - 1) !== K.WATER) { R(0, 0, 16, 3, '#1f6f9f'); R(0, 3, 16, 1, 'rgba(0,0,0,0.15)'); }
      if (m.get(tx - 1, ty) !== K.WATER) R(0, 0, 2, 16, 'rgba(20,80,130,0.55)');
      if (m.get(tx + 1, ty) !== K.WATER) R(14, 0, 2, 16, 'rgba(20,80,130,0.35)');
      if (P0 && !kid && tx === P0.x1 && ty === P0.y0) { R(4, 4, 8, 6, '#ffffff'); c.fillStyle = '#1f6f9f'; c.font = '5px monospace'; c.fillText('2m', px + 5, py + 9); }
      return true;
    }
    case K.LADDER:   // le pied du plongeoir (la tour est dessinée par-dessus, avec les personnages)
      R(3, 0, 2, 16, '#c8d0dc'); R(11, 0, 2, 16, '#c8d0dc'); for (let i = 2; i < 16; i += 4) R(5, i, 6, 1, '#e8eef6'); R(2, 14, 12, 2, 'rgba(0,0,0,0.25)'); return true;
    case K.CABIN: {
      const col = ['#fec43a', '#3d7bff', '#63c74d', '#ff6fb5', '#2ce8d5'][(h * 5) | 0];
      R(0, 0, 16, 16, '#d8dde6'); R(1, 1, 14, 13, col); R(1, 1, 14, 1, shade(col, 0.3)); R(3, 3, 10, 4, shade(col, -0.15)); R(12, 8, 1, 2, '#ffffff'); R(1, 14, 14, 2, '#3a3a4a');
      if (h > 0.6) { R(5, 14, 2, 2, '#f2c09a'); R(9, 14, 2, 2, '#f2c09a'); }   // des pieds sous la porte
      return true;
    }
    case K.LGCHAIR: {
      if (!front) { R(2, 0, 2, 15, '#e8e8f0'); R(12, 0, 2, 15, '#e8e8f0'); R(2, 7, 12, 1, '#c8d0dc'); R(1, 14, 14, 2, 'rgba(0,0,0,0.25)'); return true; }
      R(2, -10, 2, 25, '#f4f4f8'); R(12, -10, 2, 25, '#f4f4f8'); R(2, -2, 12, 1, '#c8d0dc'); R(2, 6, 12, 1, '#c8d0dc');
      R(1, -12, 14, 3, '#e43b44'); R(2, -22, 12, 10, '#e43b44'); R(2, -22, 12, 1, '#ff7b84'); R(4, -19, 8, 4, '#ffffff'); R(5, -18, 1, 2, '#e43b44'); R(10, -18, 1, 2, '#e43b44'); R(6, -17, 4, 1, '#e43b44');
      return true;
    }
    case K.VITRINE: {
      const th = vitrineTheme(m.roomAt ? m.roomAt(tx, ty) : '');
      R(1, 10, 14, 5, '#efe8da'); R(1, 15, 14, 1, '#b8ae9e'); R(1, 10, 14, 1, '#fffaf0');
      R(1, 2, 14, 8, th === 'sea' ? '#7fc8e8' : '#cfeaf6');
      const S = (a, b, w, hh, col) => R(a, b, w, hh, col);
      if (th === 'min') { S(3, 6, 2, 3, '#9b59d0'); S(4, 5, 1, 1, '#d7b0ff'); S(7, 7, 2, 2, '#2ecc71'); S(7, 6, 1, 1, '#9ff0c0'); S(11, 6, 2, 3, '#e43b44'); S(12, 5, 1, 1, '#ffb0b8'); }
      else if (th === 'bug') { S(3, 5, 2, 2, '#3d7bff'); S(6, 5, 2, 2, '#3d7bff'); S(5, 5, 1, 3, '#222'); S(10, 6, 2, 3, '#3e8948'); S(10, 5, 2, 1, '#222'); S(12, 4, 1, 1, '#ffd23f'); }
      else if (th === 'fos') { S(3, 5, 5, 4, '#d8c08a'); S(4, 6, 3, 2, '#b89a5a'); S(5, 7, 1, 1, '#8a6a3a'); S(10, 7, 4, 1, '#efe6d0'); S(10, 6, 1, 3, '#efe6d0'); S(13, 6, 1, 3, '#efe6d0'); }
      else if (th === 'sea') { S(3, 6, 3, 2, '#ff9f43'); S(6, 6, 1, 2, '#ffbf73'); S(4, 6, 1, 1, '#222'); S(10, 6, 3, 3, '#ffd0dc'); S(9, 8, 1, 1, '#ffffff'); S(12, 4, 1, 1, '#ffffff'); }
      else if (th === 'meteor') { S(4, 6, 6, 3, '#6a6a7a'); S(5, 5, 4, 1, '#8a8a9a'); S(6, 7, 1, 1, '#c0c0d0'); S(8, 6, 1, 1, '#4a4a5a'); S(11, 7, 2, 2, '#9a8a6a'); }
      else { S(4, 7, 2, 3, '#f0e8d0'); S(8, 7, 2, 3, '#b8e0f0'); S(11, 7, 2, 3, '#e8d0b0'); }
      R(1, 2, 14, 1, '#ffffff'); R(1, 2, 1, 8, '#ffffff'); R(14, 2, 1, 8, '#ffffff'); R(3, 3, 2, 1, '#ffffff');
      return true;
    }
    case K.DINO: {
      const g = (m.dinos || []).find(d => tx >= d.x && ty >= d.y && tx < d.x + d.w && ty < d.y + d.h);
      if (g && tx === g.x && ty === g.y) c.drawImage(dinoSprite(g.t, g.w, g.h), px, py);
      return true;
    }
    case K.ANIMAL: {
      const rn = m.roomAt ? m.roomAt(tx, ty) : '', pool = /oiseaux/i.test(rn) ? ['owl', 'flamingo', 'penguin'] : /évolution|singes/i.test(rn) ? ['gorilla', 'gorilla', 'bear'] : ['bear', 'deer', 'penguin', 'bear', 'deer', 'owl'];
      const v = pool[(h * pool.length) | 0];
      R(1, 12, 14, 4, '#4a4458'); R(1, 12, 14, 1, '#6a6478');
      if (v === 'bear') { R(3, 4, 10, 8, '#7a4b2a'); R(5, 1, 6, 5, '#7a4b2a'); R(4, 0, 2, 2, '#5a351c'); R(10, 0, 2, 2, '#5a351c'); R(7, 4, 2, 2, '#c89a6a'); R(6, 2, 1, 1, '#111'); R(9, 2, 1, 1, '#111'); R(4, 6, 2, 3, '#5a351c'); }
      else if (v === 'penguin') { R(5, 2, 6, 10, '#222'); R(6, 4, 4, 7, '#ffffff'); R(7, 3, 2, 1, '#f2a33a'); R(6, 3, 1, 1, '#fff'); R(9, 3, 1, 1, '#fff'); R(5, 11, 2, 1, '#f2a33a'); R(9, 11, 2, 1, '#f2a33a'); }
      else if (v === 'deer') { R(3, 6, 9, 4, '#a8743f'); R(4, 10, 1, 2, '#6b4423'); R(10, 10, 1, 2, '#6b4423'); R(11, 3, 3, 4, '#a8743f'); R(10, 0, 1, 3, '#e8d8b0'); R(14, 0, 1, 3, '#e8d8b0'); R(12, 1, 1, 2, '#e8d8b0'); R(13, 4, 1, 1, '#111'); R(4, 7, 1, 1, '#ffffff'); }
      else if (v === 'owl') { R(6, 9, 4, 2, '#6b4423'); R(5, 2, 6, 8, '#8b5a2b'); R(6, 4, 2, 2, '#ffd23f'); R(9, 4, 2, 2, '#ffd23f'); R(7, 5, 1, 1, '#111'); R(9, 5, 1, 1, '#111'); R(8, 6, 1, 1, '#f2a33a'); R(5, 1, 1, 2, '#6b4423'); R(10, 1, 1, 2, '#6b4423'); }
      else if (v === 'flamingo') { R(5, 4, 5, 4, '#ff8fb5'); R(9, 0, 1, 5, '#ff8fb5'); R(9, 0, 3, 2, '#ff8fb5'); R(12, 1, 1, 1, '#222'); R(7, 8, 1, 4, '#e86a90'); }
      else { R(3, 3, 10, 9, '#3a3a3a'); R(5, 0, 6, 5, '#3a3a3a'); R(6, 2, 4, 3, '#6a5a5a'); R(6, 2, 1, 1, '#fff'); R(9, 2, 1, 1, '#fff'); R(2, 6, 2, 5, '#3a3a3a'); R(12, 6, 2, 5, '#3a3a3a'); }
      return true;
    }
  }
  return false;
}
// la tour du plongeoir et la planche, dessinées par-dessus (on passe dessous en nageant)
function boardSprite(len, dir) {
  const key = 'board' + len + dir; if (FRONT_CACHE[key]) return FRONT_CACHE[key];
  const W = 16 * (len + 1) + 8, H = 52, [cv, c] = mkCanvas(W, H), R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(dir > 0 ? a : W - a - w, b, w, h); };
  R(5, 8, 5, 44, '#2a3450'); R(14, 8, 5, 44, '#2a3450'); R(6, 8, 3, 44, '#7a8aa8'); R(15, 8, 3, 44, '#7a8aa8'); R(6, 8, 1, 44, '#c8d0dc'); R(15, 8, 1, 44, '#c8d0dc');
  for (let y = 12; y < 50; y += 5) { R(9, y, 6, 2, '#2a3450'); R(9, y, 6, 1, '#e8eef6'); }
  R(3, 6, 18, 4, '#3d7bff'); R(3, 6, 18, 1, '#7aa8ff'); R(4, 0, 1, 7, '#e8e8f0'); R(19, 0, 1, 7, '#e8e8f0'); R(4, 0, 16, 1, '#e8e8f0');
  R(18, 10, W - 20, 3, '#f4f4f8'); R(18, 10, W - 20, 1, '#ffffff'); R(18, 13, W - 20, 1, '#9aa4b8'); R(W - 4, 10, 2, 3, '#e43b44');
  return (FRONT_CACHE[key] = cv);
}
// squelettes du musée (vus de profil, sur leur estrade)
const DINO_CACHE = {};
function dinoSprite(t, w, h) {
  const key = t + w + 'x' + h; if (DINO_CACHE[key]) return DINO_CACHE[key];
  const W = w * 16, H = h * 16, [cv, c] = mkCanvas(W, H);
  // l'estrade sombre (vue un peu de haut), pour que les os blancs ressortent
  c.fillStyle = '#2f2a3c'; c.fillRect(1, 2, W - 2, H - 3); c.fillStyle = '#3e3850'; c.fillRect(2, 3, W - 4, H - 10); c.fillStyle = '#5a5470'; c.fillRect(2, 3, W - 4, 1);
  c.fillStyle = '#4a4458'; c.fillRect(1, H - 7, W - 2, 6); c.fillStyle = '#6a6478'; c.fillRect(1, H - 7, W - 2, 1); c.fillStyle = '#211d2c'; c.fillRect(1, H - 2, W - 2, 1);
  c.fillStyle = '#c8a84a'; for (let x = 4; x < W - 4; x += 6) c.fillRect(x, 1, 2, 2);   // le cordon doré autour
  c.fillStyle = '#d8c08a'; c.fillRect(W / 2 - 6, H - 5, 12, 2);   // la petite plaque
  c.lineCap = 'round'; c.lineJoin = 'round';
  const bone = '#efe6d0', dark = '#b8ad92';
  const line = (pts, lw, col) => { c.strokeStyle = col || bone; c.lineWidth = lw || 2; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H)); c.stroke(); };
  const ribs = (x0, x1, y, len, n) => { for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; line([[x, y], [x + 0.01, y + len * (0.6 + 0.4 * Math.sin(Math.PI * i / n))]], 1.2); } };
  const legs = (x, y, kneeX, ft) => { line([[x, y], [kneeX, (y + ft) / 2], [x, ft]], 2.2); line([[x - 0.02, ft], [x + 0.04, ft]], 1.5); };
  if (t === 'trex') {
    line([[0.03, 0.5], [0.2, 0.42], [0.38, 0.36], [0.55, 0.38], [0.66, 0.34], [0.72, 0.24]], 2.4, dark); line([[0.03, 0.49], [0.2, 0.41], [0.38, 0.35], [0.55, 0.37], [0.66, 0.33], [0.72, 0.23]], 1.6);
    ribs(0.42, 0.6, 0.38, 0.2, 5);
    c.fillStyle = bone; c.fillRect(0.7 * W, 0.1 * H, 0.22 * W, 0.14 * H); c.fillStyle = dark; c.fillRect(0.7 * W, 0.24 * H, 0.2 * W, 0.04 * H); c.fillRect(0.8 * W, 0.13 * H, 3, 3);
    c.fillStyle = '#ffffff'; for (let x = 0.72; x < 0.9; x += 0.04) c.fillRect(x * W, 0.23 * H, 1, 2);
    legs(0.4, 0.4, 0.46, 0.84); legs(0.46, 0.41, 0.52, 0.84); line([[0.6, 0.46], [0.64, 0.52]], 1.4); line([[0.62, 0.45], [0.66, 0.51]], 1.4);
  } else if (t === 'trice') {
    line([[0.04, 0.48], [0.25, 0.4], [0.5, 0.36], [0.7, 0.4], [0.78, 0.44]], 2.4);
    ribs(0.32, 0.62, 0.4, 0.22, 6);
    c.fillStyle = bone; c.beginPath(); c.arc(0.8 * W, 0.36 * H, 0.16 * H, 0, 7); c.fill(); c.fillStyle = dark; c.beginPath(); c.arc(0.8 * W, 0.36 * H, 0.08 * H, 0, 7); c.fill();
    c.fillStyle = bone; c.fillRect(0.84 * W, 0.42 * H, 0.12 * W, 0.12 * H); line([[0.88, 0.42], [0.98, 0.26]], 1.5); line([[0.84, 0.36], [0.96, 0.18]], 1.5);
    legs(0.3, 0.44, 0.34, 0.84); legs(0.62, 0.42, 0.66, 0.84);
  } else if (t === 'diplo') {
    line([[0.02, 0.6], [0.2, 0.5], [0.42, 0.42], [0.6, 0.44], [0.72, 0.3], [0.8, 0.14], [0.88, 0.08]], 2.4);
    ribs(0.38, 0.6, 0.44, 0.18, 6);
    c.fillStyle = bone; c.fillRect(0.86 * W, 0.04 * H, 0.08 * W, 0.1 * H); c.fillStyle = dark; c.fillRect(0.9 * W, 0.07 * H, 2, 2);
    legs(0.4, 0.46, 0.43, 0.84); legs(0.58, 0.46, 0.61, 0.84);
  } else {   // mammouth
    c.strokeStyle = bone; c.lineWidth = 2.4; c.beginPath(); c.arc(0.5 * W, 0.55 * H, 0.32 * W, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    ribs(0.3, 0.68, 0.36, 0.22, 5);
    c.fillStyle = bone; c.fillRect(0.72 * W, 0.22 * H, 0.16 * W, 0.2 * H);
    c.strokeStyle = '#fff8e8'; c.lineWidth = 2; c.beginPath(); c.moveTo(0.84 * W, 0.42 * H); c.quadraticCurveTo(0.98 * W, 0.6 * H, 0.86 * W, 0.66 * H); c.stroke();
    legs(0.3, 0.5, 0.31, 0.84); legs(0.68, 0.5, 0.69, 0.84);
  }
  return (DINO_CACHE[key] = cv);
}
// décors muraux en plus
function drawWallDecor2(c, px, py, d, i, R) {
  if (!['panel', 'mirror', 'screens', 'buoy', 'aquarium'].includes(d.t)) return false;
  switch (d.t) {
    case 'panel': R(2, 3, 12, 9, '#2a2d44'); R(2, 3, 12, 1, '#4a4e6a'); R(4, 5, 8, 1, '#d0d6e0'); R(4, 7, 6, 1, '#9aa4b8'); R(4, 9, 7, 1, '#9aa4b8'); R(10, 5, 2, 2, '#ffd23f'); break;
    case 'mirror': R(3, 2, 10, 11, '#e8e8f0'); R(4, 3, 8, 9, '#bfe2f2'); R(5, 4, 2, 4, '#ffffff'); R(9, 7, 1, 3, '#ffffff'); break;
    case 'screens': R(1, 3, 6, 5, '#222'); R(2, 4, 4, 3, '#2a5a3a'); R(9, 3, 6, 5, '#222'); R(10, 4, 4, 3, '#2a3a5a'); R(3, 5, 1, 1, '#3cff6e'); R(12, 5, 1, 1, '#9fd7ff'); R(1, 9, 14, 2, '#5a6070'); break;
    case 'buoy': c.strokeStyle = '#e43b44'; c.lineWidth = 3; c.beginPath(); c.arc(px + 8, py + 8, 4.5, 0, 7); c.stroke(); R(7, 2, 2, 2, '#ffffff'); R(7, 12, 2, 2, '#ffffff'); R(2, 7, 2, 2, '#ffffff'); R(12, 7, 2, 2, '#ffffff'); break;
    case 'aquarium': R(0, 3, 16, 10, '#1f6f9f'); R(0, 3, 16, 1, '#e8e8f0'); R(0, 12, 16, 1, '#e8e8f0'); if (i === 0) R(0, 3, 1, 10, '#e8e8f0'); if (i === d.w - 1) R(15, 3, 1, 10, '#e8e8f0');
      R(3 + (i * 5) % 8, 6, 3, 2, i % 2 ? '#ff9f43' : '#ffd23f'); R(9, 9, 2, 1, '#9fd7ff'); R(5, 11, 4, 1, '#3e8948'); break;
  }
  return true;
}
