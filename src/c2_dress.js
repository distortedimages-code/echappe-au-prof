// ================= HABILLAGE DES DÉCORS =================
// Ajouté au moment de dessiner la carte : affiches, miroirs, porte-manteaux…, usure du sol,
// ombres au pied des murs, marelle et cages de foot dans la cour, et l'urinoir de l'élève-gag.
function dressMap(L) {
  const m = L.m; if (m.dressed) return; m.dressed = true;
  const R = mulberry(((m.w * 73856093) ^ (m.h * 19349663) ^ (m.rooms.length * 83492791)) >>> 0), rf = () => R();
  const used = new Set(); m.decor.forEach(d => { for (let i = 0; i < (d.w || 1); i++) used.add((d.x + i) + ',' + d.y); });
  const face = (x, y) => m.get(x, y) === K.WALL && !isWallish(m.get(x, y + 1)) && !KP[m.get(x, y + 1)].solid && m.get(x, y + 1) !== K.DOOR;
  const put = (x, y, t, o) => { if (used.has(x + ',' + y) || !face(x, y)) return false; used.add(x + ',' + y); m.decor.push(Object.assign({ x, y, t }, o || {})); return true; };
  const indoor = (x, y) => { const f = m.fs[y * m.w + x]; return f !== FS.GRASS && f !== FS.ASPHALT && f !== FS.SAND && f !== FS.PREAU; };
  m.npcGags = []; m.puddles = [];
  // --- murs des salles, selon le type de salle ---
  const KIND = [
    [/Toilettes/, ['mirror', 'sink', 'dryer', 'mirror', 'sink'], 0.75],
    [/Douches/, ['mirror', 'tp', 'dryer'], 0.4],
    [/Cantine|Réfectoire|Self/, ['menu', 'poster', 'drawing', 'clock'], 0.5],
    [/CDI|Biblio/, ['silence', 'poster', 'cork', 'frame'], 0.45],
    [/profs|Bureau|Direction|Secrétariat|Vie scolaire|Infirmerie|Principal|Loge|Accueil/, ['calendar', 'cork', 'frame', 'clock'], 0.45],
    [/sport|Gymnase|Vestiaire/, ['scoreboard', 'trophy', 'poster'], 0.35],
    [/Salle|Classe|Labo|Musique|Arts|Français|Maths|Anglais|Histoire|Sciences|SVT|Techno/, ['alphabet', 'drawing', 'cork', 'poster', 'drawing', 'map'], 0.5]
  ];
  m.rooms.forEach(r => {
    const kd = KIND.find(([re]) => re.test(r.name)); if (!kd) return;
    const [, list, dens] = kd; let n = 0;
    for (let x = r.x; x < r.x + r.w; x++) if (rf() < dens && put(x, r.y - 1, list[n % list.length])) n++;
  });
  // --- l'élève aux toilettes (devant un urinoir) ---
  m.rooms.filter(r => /^Toilettes/.test(r.name)).forEach(r => {
    const xs = []; for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, r.y) === K.FLOOR && m.get(x, r.y - 1) === K.WALL && !m.decor.some(d => d.x === x && d.y === r.y - 1 && d.t !== 'mirror' && d.t !== 'sink' && d.t !== 'dryer')) xs.push(x);
    if (!xs.length) return; const x = xs[Math.floor(rf() * xs.length)];
    m.decor = m.decor.filter(d => !(d.x === x && d.y === r.y - 1)); used.add(x + ',' + (r.y - 1));
    m.decor.push({ x, y: r.y - 1, t: 'urinal' });
    m.npcGags.push({ kind: 'pipi', x: x * 16 + 8, y: r.y * 16 + 11, home: [x * 16 + 8, r.y * 16 + 11], face: 1, st: 0, state: 'busy', cd: 0, n: 0, ph: rf() * 6, cfg: randomChar('', rf), anim: 0, moving: false });
  });
  // --- couloirs (murs sans salle) ---
  for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
    if (!face(x, y) || used.has(x + ',' + y) || !indoor(x, y + 1) || m.roomAt(x, y + 1)) continue;
    if (rf() < 0.16) put(x, y, pick2(rf, ['hooks', 'hooks', 'cork', 'extinguisher', 'drawing', 'trophy']));
  }
  // --- la cour : marelle, cages de foot, dessins à la craie ---
  const court = m.fdecor.find(d => d.t === 'court');
  if (court) { m.fdecor.push({ x: court.x, y: court.y + (court.h >> 1) - 1, t: 'goal', side: 0 }); m.fdecor.push({ x: court.x + court.w - 1, y: court.y + (court.h >> 1) - 1, t: 'goal', side: 1 }); }
  let marelle = 0;
  for (let y = 1; y < m.h - 5 && marelle < 1; y++) for (let x = 1; x < m.w - 1 && marelle < 1; x++) {
    let ok = true; for (let j = 0; j < 4 && ok; j++) { const k = m.get(x, y + j), f = m.fs[(y + j) * m.w + x]; if (k !== K.FLOOR || f !== FS.ASPHALT || m.roomAt(x, y + j) === 'Terrain de basket') ok = false; }
    if (ok && rf() < 0.08) { m.fdecor.push({ x, y, t: 'marelle' }); marelle++; }
  }
  for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) if (m.get(x, y) === K.FLOOR && m.fs[y * m.w + x] === FS.ASPHALT && rf() < 0.012) m.fdecor.push({ x, y, t: 'doodle', v: Math.floor(rf() * 4) });
}
function pick2(rf, a) { return a[Math.floor(rf() * a.length)]; }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// petits détails d'usure sur les sols (chewing-gum, papiers, traces, fissures…)
function floorDetails(c, m) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.get(x, y) !== K.FLOOR) continue;
    const f = m.fs[y * m.w + x], h = hash2(x * 3 + 11, y * 7 + 3), h2 = hash2(x + 101, y + 57), px = x * 16, py = y * 16;
    const R = (a, b, w, hh, col) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, hh); };
    const ax = (h2 * 11 | 0) + 2, ay = (h * 11 | 0) + 2;
    if (f === FS.ASPHALT) {
      if (h < 0.06) { R(ax, ay, 3, 1, '#6c6f80'); R(ax + 3, ay + 1, 2, 1, '#6c6f80'); R(ax + 5, ay + 2, 1, 2, '#6c6f80'); }   // fissure
      else if (h < 0.075) { R(ax, ay, 3, 2, '#c58a3a'); R(ax + 1, ay - 1, 1, 1, '#9a6a2a'); }   // feuille morte
      else if (h < 0.085) R(ax, ay, 2, 2, '#ff8fc0');   // chewing-gum
    } else if (f === FS.GRASS) {
      if (h < 0.05) { R(ax, ay, 1, 1, '#ffffff'); R(ax + 1, ay + 1, 1, 1, '#ffd23f'); R(ax + 2, ay, 1, 1, '#ffffff'); }   // pâquerette
      else if (h < 0.08) { R(ax, ay, 1, 3, '#3f8a38'); R(ax + 2, ay + 1, 1, 2, '#3f8a38'); }
    } else if (f !== FS.SAND && f !== FS.CARPET) {
      if (h < 0.05) { c.fillStyle = 'rgba(40,20,10,0.10)'; c.fillRect(px + ax, py + ay, 4, 1); c.fillRect(px + ax + 2, py + ay + 2, 3, 1); }   // traces de semelles
      else if (h < 0.065) { R(ax, ay, 3, 3, '#f4f4f4'); R(ax + 1, ay + 1, 1, 1, '#c8c8c8'); }   // boulette de papier
      else if (h < 0.075) R(ax, ay, 2, 2, '#ff8fc0');   // chewing-gum collé
      else if (h < 0.085 && f === FS.TILE) { c.fillStyle = 'rgba(120,150,170,0.25)'; c.fillRect(px + 1, py + 1, 14, 14); }   // carreau plus sombre
    } else if (f === FS.CARPET && h < 0.05) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(px + ax, py + ay, 5, 3); }
  }
}
// ombre douce sur le sol au pied des murs et des grands meubles (et un peu sur les côtés)
function aoPass(c, m) {
  const tall = k => TALL_KINDS.has(k) || k === K.FENCE;
  for (let y = 1; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = m.get(x, y); if (k !== K.FLOOR && k !== K.DOOR) continue;
    const px = x * 16, py = y * 16, outdoor = m.fs[y * m.w + x] === FS.GRASS || m.fs[y * m.w + x] === FS.ASPHALT || m.fs[y * m.w + x] === FS.SAND;
    const a = outdoor ? 0.16 : 0.24;
    if (tall(m.get(x, y - 1))) { for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(16,8,32,' + (a * (1 - i / 5)).toFixed(3) + ')'; c.fillRect(px, py + i, 16, 1); } }
    if (tall(m.get(x - 1, y))) { c.fillStyle = 'rgba(16,8,32,' + (a * 0.6).toFixed(3) + ')'; c.fillRect(px, py, 2, 16); }
    if (tall(m.get(x + 1, y))) { c.fillStyle = 'rgba(16,8,32,' + (a * 0.35).toFixed(3) + ')'; c.fillRect(px + 15, py, 1, 16); }
  }
}
function drawWallDecorX(c, px, py, d, i, R) {
  const h = hash2(d.x * 5 + 1, d.y * 9 + 2);
  switch (d.t) {
    case 'mirror': R(4, 4, 8, 7, '#8a96a6'); R(5, 5, 6, 5, '#cfe9f8'); R(6, 5, 1, 3, '#ffffff'); R(9, 8, 1, 1, '#ffffff'); break;
    case 'sink': R(7, 7, 2, 3, '#9aa8b8'); R(7, 7, 3, 1, '#b8c4d0'); R(3, 11, 10, 3, '#f4f6f8'); R(4, 11, 8, 1, '#c8d4dc'); R(3, 13, 10, 1, '#d6dee4'); if (h > 0.5) R(9, 10, 1, 1, '#7fd8ff'); break;
    case 'urinal': R(7, 3, 2, 3, '#b8c4cc'); R(5, 6, 6, 8, '#f4f6f8'); R(6, 7, 4, 6, '#dde6ec'); R(5, 6, 6, 1, '#ffffff'); R(7, 12, 2, 1, '#c8d4dc'); R(5, 13, 6, 1, '#c8d4dc'); break;
    case 'dryer': R(4, 6, 8, 5, '#e8e8ec'); R(4, 6, 8, 1, '#ffffff'); R(5, 10, 6, 1, '#9a9aa4'); R(6, 8, 4, 1, '#c8c8d0'); R(10, 7, 1, 1, '#63c74d'); break;
    case 'tp': R(6, 8, 4, 4, '#ffffff'); R(6, 9, 4, 1, '#dddddd'); R(5, 8, 1, 1, '#9aa8b8'); R(10, 8, 1, 1, '#9aa8b8'); R(7, 12, 2, 3, '#f4f4f4'); break;
    case 'cork': R(1, 4, 14, 9, '#a87440'); R(2, 5, 12, 7, '#d9a868'); R(3, 6, 3, 3, '#fff6a0'); R(7, 6, 3, 4, '#a8e0ff'); R(11, 7, 2, 3, '#ffb3d6'); R(4, 6, 1, 1, '#e43b44'); R(8, 6, 1, 1, '#3d7bff'); R(11, 7, 1, 1, '#63c74d'); R(3, 10, 3, 1, '#ffffff'); break;
    case 'hooks': {
      R(0, 6, 16, 1, '#8a8a94'); R(3, 5, 1, 2, '#6a6a74'); R(11, 5, 1, 2, '#6a6a74');
      const cols = ['#e43b44', '#3d7bff', '#63c74d', '#fec43a', '#7b45a8', '#f77622', '#2ce8d5'], a = cols[(h * 7) | 0], b = cols[((h * 13) | 0) % 7];
      if (h > 0.25) { R(1, 7, 5, 6, a); R(2, 7, 3, 1, shade(a, 0.2)); R(1, 12, 5, 1, shade(a, -0.25)); }   // veste
      if (h < 0.8) { R(9, 7, 5, 5, b); R(10, 8, 3, 2, shade(b, 0.25)); R(9, 11, 5, 1, shade(b, -0.3)); R(10, 6, 3, 1, shade(b, -0.3)); }   // sac à dos
      break;
    }
    case 'extinguisher': R(9, 4, 3, 1, '#222'); R(10, 5, 1, 2, '#222'); R(6, 6, 4, 8, '#e43b44'); R(6, 6, 4, 1, '#ff6b74'); R(7, 5, 2, 1, '#333'); R(7, 9, 2, 2, '#ffffff'); R(6, 13, 4, 1, '#a82a30'); break;
    case 'alphabet': { const cols = ['#e43b44', '#3d7bff', '#fec43a', '#63c74d', '#ff6fb5', '#2ce8d5']; R(0, 4, 16, 5, '#fff6e0'); R(0, 4, 16, 1, '#e8d8b8'); for (let k = 0; k < 4; k++) { R(1 + k * 4, 5, 3, 3, cols[(i * 4 + k + d.x) % 6]); R(2 + k * 4, 6, 1, 1, '#ffffff'); } break; }
    case 'drawing': {
      R(3, 4, 10, 9, '#ffffff'); R(3, 4, 3, 1, 'rgba(255,255,255,0.7)');
      const v = (h * 4) | 0;
      if (v === 0) { R(4, 5, 2, 2, '#ffd23f'); R(7, 8, 4, 3, '#e43b44'); R(8, 7, 2, 1, '#7a4b2a'); R(4, 11, 8, 1, '#63c74d'); }   // maison
      else if (v === 1) { R(6, 6, 4, 4, '#ffd23f'); R(7, 7, 1, 1, '#222'); R(8, 7, 1, 1, '#222'); R(7, 9, 2, 1, '#e43b44'); }   // smiley
      else if (v === 2) { R(5, 6, 1, 6, '#7a4b2a'); R(4, 5, 3, 3, '#63c74d'); R(9, 8, 3, 3, '#ff6fb5'); R(10, 7, 1, 1, '#63c74d'); }   // arbre + fleur
      else { R(5, 6, 6, 3, '#3d7bff'); R(4, 9, 8, 2, '#3d7bff'); R(6, 11, 1, 1, '#222'); R(10, 11, 1, 1, '#222'); }   // voiture
      break;
    }
    case 'menu': R(2, 4, 12, 9, '#2f3a46'); R(2, 4, 12, 1, '#7a4b2a'); R(4, 6, 8, 1, '#ffffff'); R(4, 8, 6, 1, '#ffd23f'); R(4, 10, 7, 1, '#ffffff'); break;
    case 'silence': R(2, 5, 12, 6, '#e43b44'); R(3, 6, 10, 4, '#ff6b74'); R(4, 7, 8, 2, '#ffffff'); R(7, 7, 2, 2, '#e43b44'); break;
    case 'calendar': R(4, 4, 8, 9, '#ffffff'); R(4, 4, 8, 2, '#e43b44'); for (let k = 0; k < 9; k++) R(5 + (k % 3) * 2, 7 + ((k / 3) | 0) * 2, 1, 1, k === 4 ? '#e43b44' : '#9a9aa4'); break;
    case 'trophy': R(1, 11, 14, 1, '#7a4b2a'); R(3, 6, 3, 4, '#ffd23f'); R(2, 6, 1, 2, '#ffd23f'); R(6, 6, 1, 2, '#ffd23f'); R(4, 10, 1, 1, '#c8a84a'); R(9, 7, 4, 3, '#c0c8d8'); R(10, 10, 2, 1, '#9aa0b0'); R(3, 6, 1, 1, '#fff6a0'); break;
    case 'scoreboard': R(2, 4, 12, 7, '#1a1a24'); R(2, 4, 12, 1, '#3a3a48'); R(4, 6, 2, 3, '#ff4040'); R(10, 6, 2, 3, '#ff4040'); R(7, 7, 2, 1, '#ffd23f'); break;
  }
}
function drawFloorDecorX(c, d, px, py) {
  switch (d.t) {
    case 'goal': {   // petite cage de foot (vue de dessus)
      c.fillStyle = '#ffffff'; const x = px + (d.side ? 10 : 0), y = py + 2;
      c.fillRect(x, y, 6, 1); c.fillRect(x, y + 27, 6, 1); c.fillRect(d.side ? x + 5 : x, y, 1, 28);
      c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 3; i < 27; i += 3) c.fillRect(x, y + i, 6, 1); for (let i = 1; i < 6; i += 2) c.fillRect(x + i, y, 1, 28);
      break;
    }
    case 'marelle': {   // marelle à la craie
      c.fillStyle = 'rgba(255,255,255,0.85)';
      const box = (bx, by) => { c.fillRect(bx, by, 10, 1); c.fillRect(bx, by + 10, 10, 1); c.fillRect(bx, by, 1, 10); c.fillRect(bx + 10, by, 1, 11); };
      box(px + 3, py + 52); box(px + 3, py + 41); box(px - 2, py + 30); box(px + 8, py + 30); box(px + 3, py + 19);
      c.fillRect(px + 2, py + 6, 12, 1); c.fillRect(px + 2, py + 6, 1, 13); c.fillRect(px + 13, py + 6, 1, 13); c.fillRect(px + 2, py + 18, 12, 1);   // « ciel »
      c.fillStyle = 'rgba(255,214,90,0.9)'; c.fillRect(px + 7, py + 56, 2, 2);
      break;
    }
    case 'doodle': {   // dessin à la craie
      const col = ['rgba(255,255,255,0.75)', 'rgba(255,170,210,0.8)', 'rgba(150,220,255,0.8)', 'rgba(255,230,120,0.8)'][d.v];
      c.fillStyle = col;
      if (d.v === 0) { c.fillRect(px + 5, py + 5, 6, 1); c.fillRect(px + 5, py + 10, 6, 1); c.fillRect(px + 4, py + 6, 1, 4); c.fillRect(px + 11, py + 6, 1, 4); c.fillRect(px + 6, py + 7, 1, 1); c.fillRect(px + 9, py + 7, 1, 1); c.fillRect(px + 7, py + 9, 2, 1); }
      else if (d.v === 1) { c.fillRect(px + 7, py + 4, 2, 2); c.fillRect(px + 4, py + 6, 8, 2); c.fillRect(px + 5, py + 8, 6, 1); c.fillRect(px + 6, py + 9, 4, 1); c.fillRect(px + 7, py + 10, 2, 1); }
      else if (d.v === 2) { for (let i = 0; i < 4; i++) { c.fillRect(px + 3 + i * 3, py + 8 - (i % 2) * 3, 3, 1); } }
      else { c.fillRect(px + 7, py + 3, 1, 9); c.fillRect(px + 4, py + 6, 7, 1); c.fillRect(px + 5, py + 4, 1, 1); c.fillRect(px + 9, py + 4, 1, 1); }
      break;
    }
  }
}
