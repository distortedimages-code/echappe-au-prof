// ================= MOTEUR DE JEU =================
const PL_SNEAK = 2.3 * 16, PL_RUN = 4.4 * 16;
const G = {
  mode: 'menu', lvl: 0, L: null, m: null, P: null, T: null, kids: [], items: [], apples: [], cues: [], parts: [], doors: [], doorIdx: null,
  time: 0, spotted: 0, reveal: 0, slowT: 0, shake: 0, searched: new Set(), toastT: 0, intercomT: 30, kidCueT: 4, escT: 0, caughtT: 0,
  tVis: false, visR: 120, pigeons: [], trees: [], camX: null, camY: null, flapCD: 0, eye: [0, 0], actions: [], ball: null, tagIt: 4, found: 0, msgCD: 0, heartT: 0, smallDoorTip: false, banner: null
};
const SEARCH_MSG = ['Un vieux chewing-gum… beurk !', 'Une chaussette orpheline.', 'Rien… à part de la poussière.', 'Une copie notée 3/20. Aïe.', 'Un trognon de pomme. Miam ?', 'Des miettes de goûter.', 'Une gomme en forme de licorne !', 'Une araignée ! Elle te fait coucou.', 'Que des vieux magazines.', 'Un crayon mâchouillé.', 'Une bille bleue toute brillante.', 'Un bonbon collé… non merci.'];

const doorAt = (x, y) => { if (x < 0 || y < 0 || x >= G.m.w || y >= G.m.h) return null; const i = G.doorIdx[y * G.m.w + x]; return i >= 0 ? G.doors[i] : null; };
function opaqueAt(x, y) {
  const k = G.m.get(x, y);
  if (k === K.DOOR) { const d = doorAt(x, y); return d.open < 0.5 && !d.hideP; }
  return KP[k].opaque === 1;
}
function solidP(x, y) {
  const k = G.m.get(x, y), P = G.P;
  if (k === K.DOOR) { const d = doorAt(x, y); return d.locked && !(P.small > 0); }
  if (k === K.X_HOLE) return !(P.small > 0);
  if (k === K.WATER) return false;   // à la piscine : on peut nager
  return KP[k].solid === 1;
}
const passTeach = (allowLocked) => (x, y) => { const k = G.m.get(x, y); if (k === K.DOOR) return allowLocked || !doorAt(x, y).locked; return KP[k].solid === 0; };
const tileOf = a => [Math.floor(a.x / 16), Math.floor((a.y - 4) / 16)];
const tileXY = (x, y) => [Math.floor(x / 16), Math.floor((y - 4) / 16)];
const faceFromAng = a => { const c = Math.cos(a), s = Math.sin(a); return Math.abs(c) > Math.abs(s) * 1.05 ? (c > 0 ? 2 : 3) : (s > 0 ? 0 : 1); };

// les yeux (ou le point visé) sont un peu au-dessus des pieds : collé sous un mur ou un casier, ce point dépasse
// dans la case du mur → on le ramène juste sous le mur, sinon la vue (et le prof) traversent le mur
function sightY(x, y) {
  const tx = Math.floor(x / 16), ty = Math.floor(y / 16);
  if (!opaqueAt(tx, ty) || opaqueAt(tx, ty + 1)) return y;
  const b = (ty + 1) * 16; return b - y < 14 ? b + 0.5 : y;
}
function los(ax, ay, bx, by) {
  ay = sightY(ax, ay); by = sightY(bx, by);
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy), n = Math.ceil(d / 4);
  const t0x = Math.floor(ax / 16), t0y = Math.floor(ay / 16), t1x = Math.floor(bx / 16), t1y = Math.floor(by / 16);
  for (let i = 1; i < n; i++) {
    const tx = Math.floor((ax + dx * i / n) / 16), ty = Math.floor((ay + dy * i / n) / 16);
    if ((tx === t0x && ty === t0y) || (tx === t1x && ty === t1y)) continue;
    if (opaqueAt(tx, ty)) return false;
  }
  return true;
}
// mode facile (réglage) : seulement là où il n'y a pas d'adversaire humain
// champ de vision de l'élève : un grand cône devant lui + un petit cercle tout autour (on « sent » ce qui est juste derrière)
const VIS_FOV = 1.05, VIS_SOFT = 0.4, VIS_NEAR = 2.5 * 16, FACE_ANG = [Math.PI / 2, -Math.PI / 2, 0, Math.PI];
function visRAt(a) {
  if (!G.visCone) return G.visR;
  const d = Math.abs(angDiff(a, G.visAng)), near = Math.min(G.visR, VIS_NEAR);
  if (d <= VIS_FOV) return G.visR;
  if (d >= VIS_FOV + VIS_SOFT) return near;
  const t = (d - VIS_FOV) / VIS_SOFT; return G.visR + (near - G.visR) * t * t * (3 - 2 * t);
}
function playerViewAng(P) {
  if (P.vang == null || (!P.moving && faceFromAng(P.vang + (P.lookOff || 0)) !== P.face)) { P.vang = FACE_ANG[P.face] || 0; P.lookOff = 0; P.lookTo = 0; }
  return P.vang + (P.lookOff || 0);
}
const FLOOR_MAT = ['sand', 'grass', 'sand', 'hard', 'wood', 'hard', 'hard', 'carpet', 'gym', 'hard', 'hard', 'carpet'];
function floorMat(x, y) { const m = G.m; if (!m || !m.fs) return 'hard'; const tx = Math.floor(x / 16), ty = Math.floor((y - 4) / 16); if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return 'hard'; return FLOOR_MAT[m.fs[ty * m.w + tx]] || 'hard'; }
// position gauche/droite d'un bruit par rapport à celui qu'on suit
function panOf(x) { const V0 = viewerA(); return V0 ? clamp((x - V0.x) / (8 * 16), -0.85, 0.85) : 0; }
function playerEye(P) { return [P.x, sightY(P.x, P.y - 7)]; }
function easyOn() { return !!AU.set.easy && (!G.net || !!(G.inf && G.inf.coop)); }
function castRay(ox, oy, ang, maxD) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let mx = Math.floor(ox / 16), my = Math.floor(oy / 16);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(16 / dx) : 1e9, tdy = dy !== 0 ? Math.abs(16 / dy) : 1e9;
  let tmx = dx !== 0 ? (dx > 0 ? ((mx + 1) * 16 - ox) / dx : (ox - mx * 16) / -dx) : 1e9;
  let tmy = dy !== 0 ? (dy > 0 ? ((my + 1) * 16 - oy) / dy : (oy - my * 16) / -dy) : 1e9;
  for (let guard = 0; guard < 64; guard++) {
    let t, side;
    if (tmx < tmy) { t = tmx; tmx += tdx; mx += sx; side = 0; } else { t = tmy; tmy += tdy; my += sy; side = 1; }
    if (t > maxD) return maxD;
    if (opaqueAt(mx, my)) {
      // on montre un peu la face du mur… sans jamais ressortir de l'autre côté (murs fins, coins, casiers)
      let ext = (side === 1 && dy < 0) ? Math.min(15 / -dy, 22) : 5;
      for (let k = 0; k < 4; k++) { const nb = Math.min(tmx, tmy); if (nb >= t + ext) break; if (tmx < tmy) { tmx += tdx; mx += sx; } else { tmy += tdy; my += sy; } if (!opaqueAt(mx, my)) { ext = Math.max(0, nb - t - 0.5); break; } }
      return Math.min(maxD, t + ext);
    }
  }
  return maxD;
}
function astar(sx, sy, gx, gy, pass) {
  const m = G.m, W = m.w, H = m.h, N = W * H;
  if (sx === gx && sy === gy) return [];
  if (!pass(gx, gy)) return null;
  const gS = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N), heap = [];
  const push = (f, i) => { heap.push([f, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; const t = heap[p]; heap[p] = heap[c]; heap[c] = t; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (; ;) { const l = c * 2 + 1, r = l + 1; let s = c; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (r < heap.length && heap[r][0] < heap[s][0]) s = r; if (s === c) break; const t = heap[s]; heap[s] = heap[c]; heap[c] = t; c = s; } } return top; };
  const hf = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  const isDoor = (x, y) => m.get(x, y) === K.DOOR;
  const s = sy * W + sx; gS[s] = 0; push(hf(sx, sy), s);
  const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let it = 0;
  while (heap.length && it++ < 8000) {
    const i = pop()[1]; if (closed[i]) continue; closed[i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x === gx && y === gy) { const p = []; let c = i; while (c !== s) { p.push([c % W, (c / W) | 0]); c = came[c]; } return p.reverse(); }
    for (const [dx, dy, cost] of D) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (!pass(nx, ny)) continue;
      if (dx && dy && (!pass(x + dx, y) || !pass(x, y + dy) || isDoor(x, y) || isDoor(nx, ny) || isDoor(x + dx, y) || isDoor(x, y + dy))) continue;
      const j = ny * W + nx; if (closed[j]) continue;
      const ng = gS[i] + cost; if (ng < gS[j]) { gS[j] = ng; came[j] = i; push(ng + hf(nx, ny), j); }
    }
  }
  return null;
}
function goTo(a, gx, gy, keepGoal) {
  const [sx, sy] = tileOf(a);
  let g = [gx, gy];
  if (!passTeach(true)(gx, gy)) {
    let best = null, bd = 1e9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = gx + dx, y = gy + dy; if (passTeach(true)(x, y)) { const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = [x, y]; } } }
    if (!best) return false; g = best;
  }
  let p = astar(sx, sy, g[0], g[1], passTeach(false)); if (!p) p = astar(sx, sy, g[0], g[1], passTeach(true));
  if (!p) return false;
  a.path = p; a.pi = 0; if (!keepGoal) a.goal = g; return true;
}
function followPath(a, spd, dt) {
  if (!a.path || a.pi >= a.path.length) { a.moving = false; return 'done'; }
  const [tx, ty] = a.path[a.pi];
  if (a.isTeacher && G.m.get(tx, ty) === K.DOOR) { const d = doorAt(tx, ty); if (d.locked && !(d.pre && !d.byPlayer)) { a.moving = false; return d; } }
  const cx = tx * 16 + 8, cy = ty * 16 + 12, dx = cx - a.x, dy = cy - a.y, d = Math.hypot(dx, dy), st = spd * dt;
  if (d > 0.01) { a.ang += angDiff(Math.atan2(dy, dx), a.ang) * Math.min(1, dt * 12); a.face = faceFromAng(a.ang); }
  a.moving = true; a.anim += dt * spd / 22; a.dist = (a.dist || 0) + Math.min(st, d);
  if (d <= st) { a.x = cx; a.y = cy; a.pi++; if (a.pi >= a.path.length) { a.moving = false; return 'done'; } return 'moving'; }
  a.x += dx / d * st; a.y += dy / d * st; return 'moving';
}
// ---------- Indices visuels / particules ----------
function cue(x, y, type, text, o) { G.cues.push(Object.assign({ x, y, type, text, t: 0, life: 1.4 }, o || {})); if (G.cues.length > 40) G.cues.shift(); }
function part(x, y, type, o) { G.parts.push(Object.assign({ x, y, vx: 0, vy: 0, t: 0, life: 0.6, type, col: '#fff', size: 1, g: 0 }, o || {})); if (G.parts.length > 300) G.parts.shift(); }
function puff(x, y, n = 10, col = '#f2ecff') { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = rand(10, 35); part(x, y, 'puff', { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 8, life: rand(0.35, 0.7), col, size: randi(2, 3) }); } }
function sparkle(x, y, n = 8, col) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = rand(15, 45); part(x, y, 'spark', { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life: rand(0.4, 0.9), col: col || pick(['#fff6a0', '#ffffff', '#9fe0ff', '#ff9fd8']), size: 1 }); } }
function confetti(x, y, n = 40) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + rand(-1.2, 1.2), s = rand(40, 110); part(x, y, 'conf', { vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 120, life: rand(1, 1.8), col: pick(['#e43b44', '#fec43a', '#63c74d', '#3d7bff', '#ff6fb5', '#2ce8d5']), size: 2 }); } }
function toast(text, dur = 2.4) { UI.toast(text, dur); }

// ---------- Démarrage d'un niveau ----------
function startLevel(idx, cfg, setup, opts) {
  const def = LEVELS[idx], seed = setup ? setup.seed : (opts && opts.seed);
  let L = seed != null ? buildProcLevel(idx, seed) : null;
  if (!L) L = finalizeLevel(def.build());
  L.def = def; G.seed = L.seed != null ? L.seed : null; G.net = null; G.inf = null; G.alarmFlash = false; G.appleId = 0; G.alarmT = 0; G.pVis = true;
  G.L = L; G.m = L.m; G.lvl = idx; G.lessons = 0; G.time = 0; RPS.reset(); G.spotted = 0; G.reveal = 0; G.slowT = 0; G.shake = 0; G.found = 0; G.petFound = false; G.cls = null; G.power = null; G.dark = false; G.P2 = null; G.T2 = null; G.cc = null; G.ccMe = null; G.doorSync = null;
  G.cues = []; G.parts = []; G.apples = []; G.searched = new Set(); G.intercomT = 24; G.kidCueT = 3; G.smallDoorTip = false; G.banner = null; G.heartT = 0;
  G.doorIdx = new Int16Array(L.m.w * L.m.h).fill(-1);
  G.doors = L.m.doors.map((d, i) => { G.doorIdx[d.y * L.m.w + d.x] = i; return { x: d.x, y: d.y, open: 0, target: 0, closeT: 0, locked: false, byPlayer: false, hideP: false, horiz: L.m.get(d.x - 1, d.y) !== K.FLOOR && L.m.get(d.x + 1, d.y) !== K.FLOOR }; });
  G.P = { x: L.start[0] * 16 + 8, y: L.start[1] * 16 + 12, face: 0, moving: false, running: false, anim: 0, small: 0, slip: 0, hidden: null, hideFrom: null, busy: null, inv: [], stepT: 0, cfg, unhideT: 0, bumpT: 0 };
  const pr = PROFS[def.prof];
  G.T = newTeacher(pr, L);
  if (setup) {
    G.items = setup.items.map(o => Object.assign({ ph: Math.random() * 6 }, o));
    L.exits.forEach((e, i) => { if (e.type === 'search' && setup.secrets[i]) e.secret = setup.secrets[i]; });
    G.kids = setup.kids.map(k => ({ cfg: k.cfg, x: k.x, y: k.y, ang: Math.PI / 2, face: 0, anim: 0, moving: false, path: null, pi: 0, beh: k.beh, st: 0, ph: Math.random() * 6, isKid: true }));
    G.ball = setup.ball ? { from: setup.ball[0], to: setup.ball[1], t: 0 } : null; G.tagIt = 4;
    L.kidSpots = L.itemSpots.filter(([x, y]) => { const f = L.m.fs[y * L.m.w + x]; return f === FS.ASPHALT || f === FS.GRASS || f === FS.SAND; });
  } else if (opts && opts.robots) { spawnItems(); spawnRobots(L.robots || 6); }
  else { G.items = []; spawnKids(L.kids || 0); }
  if (!setup) { lifeSetup(); poolSetup(); }
  G.tasks = (setup && setup.tasks ? setup.tasks.map(i => L.taskPool[i]).filter(Boolean) : shuffle(L.taskPool.slice()).slice(0, 3)).map(t => Object.assign({ def: TASKDEFS[t.id], done: false, room: L.m.roomAt(t.x, t.y) }, t)); G.tasksDone = 0; G.tasksRemote = 0;
  { const keys = []; for (let y = 0; y < L.m.h; y++) for (let x = 0; x < L.m.w; x++) { const key = y * L.m.w + x; if (!SEARCHABLE_KINDS.has(L.m.get(x, y)) || L.candAt.has(key) || G.tasks.some(t => t.x === x && t.y === y)) continue; if ([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => L.reach[(y + dy) * L.m.w + x + dx] >= 0 && L.m.get(x + dx, y + dy) === K.FLOOR)) keys.push(key); } G.disguiseAt = new Set(shuffle(keys).slice(0, 2)); }
  // solo : les objets magiques sont cachés dans les meubles, un seul par pièce
  G.stash = null; if (!setup && !(opts && opts.robots)) { spawnStash(); G.disguiseAt = new Set(); }
  if (!setup && !(opts && opts.robots)) { classSetup(); powerSetup(); }
  spawnPigeons(); FX.reset(); G.camX = null;
  G.trees = []; for (let y = 0; y < L.m.h; y++) for (let x = 0; x < L.m.w; x++) if (L.m.get(x, y) === K.TREE) G.trees.push([x, y]);
  if (G.mapCanvas && !(G.mapKeep)) { try { G.mapCanvas.width = 0; G.mapCanvas.height = 0; } catch (e) { } }
  G.mapKeep = false; G.mapCanvas = renderMapCanvas(L);
  G.mode = 'intro';
}
function spawnItems() {
  const L = G.L, spots = shuffle(L.itemSpots.slice());
  const kinds = ['cake', 'squishy'].concat(shuffle(ITEM_KEYS.filter(k => k !== 'cake' && k !== 'squishy')).slice(0, 2));   // un squishy à collectionner par niveau
  const chosen = [];
  for (const s of spots) { if (chosen.length >= kinds.length) break; if (chosen.every(c => Math.abs(c[0] - s[0]) + Math.abs(c[1] - s[1]) >= 8)) chosen.push(s); }
  G.items = chosen.map((s, i) => ({ id: i, x: s[0] * 16 + 8, y: s[1] * 16 + 12, kind: kinds[i], ph: Math.random() * 6 }));
}
// ---------- les objets magiques cachés dans les meubles (solo : un seul par pièce) ----------
const STASH_KINDS = new Set([K.DESK, K.ARMOIRE, K.LOCKER, K.SHELF, K.TRASH, K.BALLBIN, K.COUNTER, K.MATS, K.BUSH, K.CABIN, K.VITRINE]);
const STASH_LABEL = { [K.DESK]: 'Fouiller le bureau', [K.ARMOIRE]: 'Fouiller l’armoire', [K.LOCKER]: 'Fouiller le casier', [K.SHELF]: 'Fouiller l’étagère', [K.TRASH]: 'Fouiller la poubelle', [K.BALLBIN]: 'Fouiller le bac', [K.COUNTER]: 'Fouiller le comptoir', [K.MATS]: 'Soulever les tapis', [K.BUSH]: 'Fouiller le buisson', [K.CABIN]: 'Fouiller la cabine', [K.VITRINE]: 'Regarder la vitrine' };
const STASH_PREF = new Set([K.DESK, K.ARMOIRE, K.LOCKER, K.SHELF, K.COUNTER]);
function stashRoomOf(m, x, y) {
  const r = m.roomAt(x, y); if (r) return r;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (m.get(x + dx, y + dy) === K.FLOOR) { const n = m.roomAt(x + dx, y + dy); if (n) return n; }
  return '';
}
function spawnStash() {
  const L = G.L, m = G.m, w = m.w; G.stash = new Map();
  const startRoom = m.roomAt(L.start[0], L.start[1]), byRoom = new Map();
  for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const k = m.get(x, y), key = y * w + x; if (!STASH_KINDS.has(k)) continue;
    if (L.candAt.has(key) || G.tasks.some(t => t.x === x && t.y === y)) continue;
    if (![[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => L.reach[(y + dy) * w + x + dx] >= 0 && m.get(x + dx, y + dy) === K.FLOOR)) continue;
    // dehors (la cour), pas de pièces : on découpe en zones de 8×8 cases
    const rn = stashRoomOf(m, x, y), room = L.outdoor && (!rn || /^Cour|Préau|Terrain|Aire/.test(rn)) ? 'zone ' + Math.floor(x / 9) + '-' + Math.floor(y / 9) : rn;
    if (!room || room === startRoom || /Toilettes|Douches/.test(room) || Math.abs(x - L.start[0]) + Math.abs(y - L.start[1]) < 4) continue;
    if (!byRoom.has(room)) byRoom.set(room, []); byRoom.get(room).push({ key, x, y, k });
  }
  // le gâteau d'abord (il ouvre le trou de souris), puis le squishy, le déguisement et deux surprises
  const kinds = ['cake', 'squishy', 'disguise'].concat(shuffle(ITEM_KEYS.filter(k => k !== 'cake' && k !== 'squishy')).slice(0, 2));
  if (Math.random() < 0.75) kinds[Math.random() < 0.5 ? 3 : 4] = 'pet';   // souvent, un compagnon tout mignon caché quelque part
  // des pièces bien réparties : on prend à chaque fois la pièce la plus loin de celles déjà choisies
  const rooms = [...byRoom.keys()], center = n => { const a = byRoom.get(n); return [a.reduce((s, o) => s + o.x, 0) / a.length, a.reduce((s, o) => s + o.y, 0) / a.length]; };
  const chosen = [];
  while (chosen.length < kinds.length && rooms.length) {
    let bi = 0, bs = -1;
    rooms.forEach((n, i) => { const [cx, cy] = center(n); const d = chosen.length ? Math.min(...chosen.map(c => { const [ox, oy] = center(c); return Math.abs(cx - ox) + Math.abs(cy - oy); })) : Math.random() * 10; const s = d + Math.random() * 6; if (s > bs) { bs = s; bi = i; } });
    chosen.push(rooms.splice(bi, 1)[0]);
  }
  chosen.forEach((n, i) => {
    const c = byRoom.get(n), pref = c.filter(o => STASH_PREF.has(o.k)), o = pick(pref.length ? pref : c);
    G.stash.set(o.key, { kind: kinds[i], x: o.x, y: o.y, room: n });
  });
}
function spawnRobots(n) {
  const L = G.L, spots = [];
  L.hides.forEach(s => { if (!s.small) spots.push(s.stand[0]); }); L.taskPool.forEach(t => spots.push(t.stand[0]));
  const far = spots.filter(([x, y]) => Math.abs(x - L.start[0]) + Math.abs(y - L.start[1]) > 5);
  G.kids = []; G.ball = null; G.robotSpots = far;
  L.kidSpots = L.itemSpots.filter(([x, y]) => { const f = L.m.fs[y * L.m.w + x]; return f === FS.ASPHALT || f === FS.GRASS || f === FS.SAND; });
  for (let i = 0; i < n; i++) {
    const route = shuffle(far.slice()).slice(0, 4), s = route[0];
    let cfg = randomChar('');
    if (i < 2 && G.P && G.P.cfg) { const pc = G.P.cfg; cfg = Object.assign(cfg, i === 0 ? { top: pc.top, topCol: pc.topCol, bottom: pc.bottom, botCol: pc.botCol } : { hair: pc.hair, hairCol: pc.hairCol, topCol: pc.topCol, skin: pc.skin }); }
    G.kids.push({ cfg, x: s[0] * 16 + 8, y: s[1] * 16 + 12, ang: 0, face: 0, anim: 0, moving: false, path: null, pi: 0, beh: 'robot', route, ri: 0, st: rand(0.3, 2.5), pause: pick([2, 2.5, 3]), ph: Math.random() * 6, isKid: true });
  }
}
function fleeKid(k) {
  const T = G.T, spots = G.robotSpots || []; if (!spots.length) return;
  let best = spots[0], bd = -1; spots.forEach(s => { const d = dist(s[0] * 16, s[1] * 16, T.x, T.y) + rand(0, 40); if (d > bd) { bd = d; best = s; } });
  const [kx, ky] = tileOf(k), p = astar(kx, ky, best[0], best[1], passTeach(false)); if (p) { k.path = p; k.pi = 0; } k.fleeT = 2.5;
}
function spawnKids(n) {
  G.kids = []; G.ball = null; if (!n) return;
  const L = G.L, m = G.m;
  const spots = L.itemSpots.filter(([x, y]) => { const f = m.fs[y * m.w + x]; return (f === FS.ASPHALT || f === FS.GRASS || f === FS.SAND) && !m.roomAt(x, y).match(/Toilettes|Loge/); });
  L.kidSpots = spots;
  for (let i = 0; i < n; i++) {
    const s = pick(spots);
    G.kids.push({ cfg: randomChar(), x: s[0] * 16 + 8, y: s[1] * 16 + 12, ang: Math.PI / 2, face: 0, anim: 0, moving: false, path: null, pi: 0, beh: i < 2 ? 'jump' : i < 4 ? 'ball' : i < 7 ? 'tag' : 'wander', st: rand(0, 2), ph: Math.random() * 6, isKid: true });
  }
  // duo de ballon : deux enfants face à face
  const a = G.kids[2], b = G.kids[3];
  const row = spots.find(([x, y]) => [0, 1, 2, 3].every(d => m.get(x + d, y) === K.FLOOR) && Math.abs(x - L.start[0]) + Math.abs(y - L.start[1]) > 6);
  if (row && a && b) { a.x = row[0] * 16 + 8; a.y = row[1] * 16 + 12; b.x = (row[0] + 3) * 16 + 8; b.y = a.y; a.face = 2; b.face = 3; G.ball = { from: 2, to: 3, t: 0 }; }
  else if (a && b) { a.beh = b.beh = 'wander'; }
  G.tagIt = 4;
}
// ---------- Bruits ----------
function makeNoise(x, y, r, word, kind) {
  const T = G.T; if (!T || T.gone || G.mode !== 'play') return;
  if (G.inf && G.inf.coop) { if (!G.inf.auth) { Net.send({ t: 'cnoise', x: Math.round(x), y: Math.round(y), r, w: word || null, k: kind || null }); return; } }
  else if (G.net && G.net.cc) { if (!Net.isHost) { Net.send({ t: 'noise', x: Math.round(x), y: Math.round(y), r, w: word || null }); return; } }
  else if (G.net) { if (G.net.role === 'student' && kind !== 'step' && kind !== 'door') Net.send({ t: 'noise', x: Math.round(x), y: Math.round(y), r, w: word || null }); return; }
  if (!['patrol', 'look', 'search', 'check', 'investigate', 'alert'].includes(T.state)) return;
  const d = Math.hypot(T.x - x, T.y - y) / 16; let R = r * T.prof.hear;
  if (!los(T.x, T.y - 12, x, y - 6)) R *= 0.6;
  if (d > R) return;
  T.lastSeen = [x, y];
  if (G.time - T.heardT > 3.5) say(pick(T.prof.lines.heard));
  T.heardT = G.time; setMark(T, '?', 1);
  T.state = 'investigate'; const [tx, ty] = tileXY(x, y); if (!goTo(T, tx, ty)) { T.state = 'look'; T.st = 1; T.lookBase = T.ang; }
}
function say(text) {
  const T = G.T; if (!T || !text) return;
  text = text.replace(/\{n\}/g, (G.P.cfg && G.P.cfg.name) || 'toi');
  T.bubble = { text, t: 0, dur: Math.max(2, text.length * 0.075) };
  if (G.inf && G.inf.coop && G.inf.auth) Net.send({ t: 'bub', w: 'T', text, dur: T.bubble.dur });
  if (G.net && G.net.cc && Net.isHost) Net.send({ t: 'say', text });
  const d = dist(T.x, T.y, G.P.x, G.P.y) / 16;
  if (d < 20) AU.say(text, T.prof, clamp(1.25 - d / 15, 0.15, 1));
}
// ---------- les élèves parlent (bêtises de collège) ----------
const KID_LINES = ['Quoi ? Feur !', 'Skibidi !', 'C’est quand la récré ?', 'J’ai faim…', 'On mange quoi à la cantine ?', 'Mon chat a mangé mes devoirs.', 'T’as fait l’exo 4 ?', 'Flemme…', 'Tu me prêtes ta gomme ?', 'J’ai perdu ma trousse !', 'C’est pas moi, c’est lui !', 'Wesh !', 'Tranquille ou quoi ?', 'Ça sonne quand ?', 'Trop la flemme de l’interro…', 'Mdr', 'J’ai vu un pigeon avec un chapeau !', 'Chut, le prof !', 'J’ai oublié mon cahier…', 'Il est quelle heure ?', 'Bouge pas, y a une abeille !', 'T’as vu ma nouvelle trousse ?', 'Je suis trop fort au foot !', 'Hein ? Quoi ? J’ai rien fait !'];
const SIX_LINES = ['Six seven ! 🤲', 'SIX… SEVEN !', 'Six seven…'];
const PROF_CHAT = ['Ouvrez vos cahiers page 42.', 'Silence au fond !', 'Qui mâche un chewing-gum ?', 'Interro surprise !', 'On ne dit pas « six seven » en classe !', 'Rangez vos portables !', 'Je ne veux plus entendre « feur » !', 'Qui veut passer au tableau ?', 'Les devoirs pour lundi !'];
function npcChatter(dt) {
  const own = !G.net;
  G.kids.forEach(k => { if (k.sixT > 0) k.sixT -= dt; if (own && k.bub && k.beh !== 'sit' && k.beh !== 'crowd' && k.beh !== 'watch' && k.beh !== 'cteach') { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; } });
  G.chatT = (G.chatT == null ? 5 : G.chatT) - dt;
  if (G.chatT > 0) return;
  G.chatT = rand(6, 11);   // moins de bulles : une de temps en temps, pas un brouhaha
  const V0 = viewerA(), cand = G.kids.filter(k => k.vis && !k.gone && !k.bub && dist(k.x, k.y, V0.x, V0.y) < 10 * 16);
  if (!cand.length) return;
  const k = pick(cand);
  if (k.isWatcher) { if (k.state === 'warn' || k.state === 'evac' || k.detect > 0.2) return; k.bub = { text: pick(PROF_CHAT), t: 0, dur: 2.4 }; return; }
  const six = Math.random() < 0.1, text = six ? pick(SIX_LINES) : pick(KID_LINES);
  k.bub = { text, t: 0, dur: 2.2 };
  { const dd = dist(k.x, k.y, V0.x, V0.y) / 16; AU.babble(clamp(1 - dd / 10, 0, 1), panOf(k.x), true); }
  if (six) {
    k.sixT = 2.4;
    const nb = G.kids.find(o => o !== k && !o.isWatcher && o.vis && !o.bub && dist(o.x, o.y, k.x, k.y) < 3 * 16);
    if (nb && Math.random() < 0.35) { nb.bub = { text: 'SEVEN !', t: 0, dur: 1.9 }; nb.sixT = 2.2; }
  }
}
// ---------- Le temps qu'il faut pour « tilter » ----------
// Quelqu'un qui te voit met un moment avant de réagir : très vite si tu passes collé à lui,
// plus longtemps au bout de son champ de vision, et entre les deux, de plus en plus long avec la distance.
// (courir le fait tilter plus vite, être déguisé·e plus lentement ; le mode facile laisse plus de temps)
const DETECT_NEAR = 0.45, DETECT_FAR = 2.2, DETECT_NEAR_EASY = 0.8, DETECT_FAR_EASY = 3.2;
function detectRate(d, range) {
  const f = clamp((d - 18) / Math.max(1, range - 18), 0, 1), e = easyOn();
  const n = e ? DETECT_NEAR_EASY : DETECT_NEAR, fa = e ? DETECT_FAR_EASY : DETECT_FAR;
  return 1 / (n + (fa - n) * f);
}
// ---------- Le prof ----------
function perceive(dt) {
  const T = G.T, P = G.P, pr = T.prof;
  let sees = false;
  if (T.gone || ['sleep', 'eat', 'caught', 'count', 'evac', 'gone', 'blind'].includes(T.state)) { T.seeNow = false; T.detect = 0; return false; }
  if (!P.hidden && !P.under && G.mode === 'play') {
    const ex = T.x, ey = T.y - 12, px = P.x, py = P.y - (P.small > 0 ? 3 : 7);
    const d = Math.hypot(px - ex, py - ey), range = pr.range * 16 * (P.small > 0 ? 0.55 : 1) * (isDark() ? 0.4 : 1);
    if (d < range) {
      let inCone = d < 22;
      if (!inCone) inCone = Math.abs(angDiff(Math.atan2(py - ey, px - ex), T.ang)) < pr.fov;
      if (inCone && los(ex, ey, px, py)) sees = true;
    }
    T.seeD = d; T.seeR = range;
    if (sees && G.inf && T.state !== 'chase' && (G.inf.grace > 0 || !infOut(T))) sees = false;
    if (sees && G.inf && T.state === 'chase' && !infOut(T)) sees = false;
    if (sees) {
      const rate = detectRate(d, range) * (P.running ? 1.8 : 1) * (P.disguised ? 0.5 : 1);
      T.detect = Math.min(1.3, T.detect + rate * dt); T.lastSeen = [P.x, P.y];
    }
  }
  if (!sees) T.detect = Math.max(0, T.detect - dt * (T.state === 'chase' ? 0.25 : 0.3));
  T.seeNow = sees;
  if (sees && T.state !== 'tired') {
    if (T.detect >= 1 && T.state !== 'chase' && T.state !== 'edge') {
      if (G.inf && !G.inf.hunt) infWarn(T);
      // vu de près : il court ; vu au loin : il tilte (« Hé ?! ») et vient voir d'un bon pas, il ne court qu'une fois assez près
      else if (T.seeD <= Math.max(4 * 16, T.seeR * 0.65) || G.m.pools) enterChase();
      else if (!T.rush) { T.rush = true; T.rushRe = 0; T.state = 'investigate'; T.path = null; setMark(T, '!', 1.1); hop(T, 70); say(pick(RUSH_LINES)); AU.sfx('spot', 0.45); }
    }
    else if (T.detect > 0.3 && !T.rush && ['patrol', 'look', 'search', 'check', 'investigate'].includes(T.state)) { T.state = 'alert'; T.st = 0.55; T.path = null; setMark(T, '?', 0.8); hop(T, 60); }
  }
  return sees;
}
const RUSH_LINES = ['Hé ?!', 'Qui va là ?!', 'Hé, toi, là-bas !', 'J’ai vu quelque chose…', 'Une minute, toi !'];
const INSPECT_LINES = ['Hmm… y a quelqu’un par ici ?', 'Je vais jeter un œil…', 'Ça sent l’élève caché, ça…', 'Voyons voir par là…', 'Je suis sûr d’avoir entendu quelque chose…'];
function enterChase() {
  const T = G.T, pr = T.prof;
  T.rush = false; T.rushFull = false; T.state = 'chase'; T.chaseT = 0; T.repathT = 0; T.goingLast = false; T.goingSpot = false; T.path = null; T.lostT = 0;
  if (G.time - T.lastSpotT > 4) {
    G.spotted++; say(pick(pr.lines.spot)); AU.sfx('spot'); G.shake = 0.25; setMark(T, '!', 1.3); FX.spotted(); T.flashT = 0.18; hop(T, 90);
    if (pr.whistle) { AU.sfx('whistle', 0.8); cue(T.x, T.y - 26, 'word', 'PRIIIT !', { col: '#9fe0ff', life: 1 }); }
  }
  T.lastSpotT = G.time; AU.play('chase');
}
function onLocked(T, door) {
  const pr = T.prof;
  T.keyDoor = door; T.resume = { state: T.state, goal: T.goal || tileOf(T) };
  if (T.hasKeys || pr.hasKeys) { T.state = 'unlock'; T.st = T.hasKeys ? 1.4 : 2.4; say(pr.lines.locked || 'Fermé ? J’ai mes clés, cette fois !'); }
  else { T.state = 'fetch'; say('Fermé à clé ?! Je vais chercher mes clés…'); setMark(T, '?', 1); if (!goTo(T, G.L.keyPt[0], G.L.keyPt[1], true)) { T.state = 'unlock'; T.st = 4; } }
  if (AU.songName === 'chase') AU.play('sneak');
}
// les meubles qu'on peut fouiller autour d'un point (pas des cachettes : on y fouille pour le suspense, sans danger)
function searchFurn(center, R) {
  const m = G.m, out = [], cx = Math.floor(center[0] / 16), cy = Math.floor(center[1] / 16), hid = new Set(G.L.hides.map(s => s.y * m.w + s.x));
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
    if (x < 1 || y < 1 || x >= m.w - 1 || y >= m.h - 1 || hid.has(y * m.w + x)) continue;
    const k = m.get(x, y); if (!(SEARCHABLE_KINDS.has(k) || STASH_KINDS.has(k))) continue;
    const stand = [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]].filter(([a, b]) => { const kk = m.get(a, b); return KP[kk] && KP[kk].solid === 0 && kk !== K.WATER && kk !== K.DOOR; });
    if (stand.length) out.push({ x, y, stand, furn: true });
  }
  return out;
}
// la fouille du prof : quelques cachettes et quelques meubles autour, dans un ordre un peu au hasard
// opt.excl : cachettes à ne pas ouvrir (inspection « au cas où » : on fouille autour de toi, pas chez toi)
function startSearch(center, n, opt = {}) {
  const T = G.T, pr = T.prof; if (!center) center = [T.x, T.y];
  const dC = s => Math.hypot(s.x * 16 + 8 - center[0], s.y * 16 + 8 - center[1]);
  const excl = opt.excl || [];
  let spots = G.L.hides.filter(s => (!s.small || pr.smart) && !excl.includes(s) && dC(s) < 6.5 * 16);
  spots = spots.map(s => [s, dC(s) + rand(0, 45)]).sort((a, b) => a[1] - b[1]).slice(0, n || pr.searchN);
  const furn = searchFurn(center, 5).map(s => [s, dC(s) + rand(0, 60)]).sort((a, b) => a[1] - b[1]).slice(0, opt.furn != null ? opt.furn : 2);
  spots = spots.concat(furn).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  if (T.knows && !excl.includes(T.knows)) { spots = spots.filter(s => s !== T.knows); spots.unshift(T.knows); }
  T.searchQ = spots; T.searchI = 0; T.state = 'search'; T.path = null; T.rush = false; T.rushFull = false;
  if (AU.songName === 'chase') AU.play('sneak');
}
function goToSpot(T, s) {
  let best = s.stand[0], bd = 1e9;
  s.stand.forEach(st => { const d = Math.hypot(st[0] * 16 + 8 - T.x, st[1] * 16 + 12 - T.y); if (d < bd) { bd = d; best = st; } });
  return goTo(T, best[0], best[1]);
}
function pickPatrol(T) {
  const pts = G.L.patrol; if (!pts.length) return false;
  const [tx, ty] = tileOf(T);
  for (let tries = 0; tries < 6; tries++) {
    const p = pick(pts); if (Math.abs(p[0] - tx) + Math.abs(p[1] - ty) < 4) continue;
    if (goTo(T, p[0], p[1])) return true;
  }
  return false;
}
function updateTeacher(dt) {
  const T = G.T, P = G.P, pr = T.prof, slow = G.slowT > 0 ? 0.4 : 1;
  if (T.gone || T.state === 'evac' || T.state === 'gone') return;
  if (T.bubble) { T.bubble.t += dt; if (T.bubble.t > T.bubble.dur) T.bubble = null; }
  if (T.markT > 0) T.markT -= dt;
  if (T.state === 'caught') return;
  // après une leçon d'anglais : la prof reste plantée là quelques secondes, le temps de filer
  if (T.state === 'release') { T.st -= dt; T.moving = false; if (T.st <= 0) { T.state = 'patrol'; T.path = null; T.detect = 0; } return; }
  // un compagnon lui a sauté dessus : il s'enfuit
  if (T.state === 'scared') { teacherScared(T, dt); return; }
  // un squishy lui a explosé à la figure : il ne voit plus rien
  if (T.state === 'blind') { teacherBlind(T, dt); return; }
  // il a glissé dans une flaque…
  if (T.slipT > 0) { T.slipT -= dt; T.moving = false; T.running = false; return; }
  if (T.state === 'count') {
    T.st -= dt; T.moving = false;
    const n = 3 - Math.ceil(T.st - 0.3);
    if (n > T.countN && n <= 3) { T.countN = n; FX.cntN = n; FX.cntA = 0; T.bubble = { text: n + (n < 3 ? '…' : ' !'), t: 0, dur: 0.9 }; AU.sfx(n < 3 ? 'count' : 'go'); }
    if (T.st <= 0) { FX.goA = 0; T.state = 'patrol'; T.path = null; say(pr.lines.start ? 'Prêt ou pas, j’arrive !' : ''); }
    return;
  }
  const sees = perceive(dt);
  if (!['eat', 'sleep', 'caught', 'fetch', 'keys', 'unlock'].includes(T.state)) checkApples();
  if (G.m.pools && poolTeacher(T, dt, sees, slow)) return;
  const L = pr.lines;
  // tu es caché·e pas loin : de temps en temps il vient fouiller les meubles et cachettes autour de toi (jamais la tienne, s'il ne t'a pas vu·e)
  if ((T.state === 'patrol' || T.state === 'look') && !T.after && !T.knows) {
    T.inspT = (T.inspT == null ? rand(4, 8) : T.inspT) - dt;
    if (T.inspT <= 0) {
      T.inspT = rand(7, 12);
      const hid = [G.P, G.P2].filter(a => a && a.hidden && !a.out && a.x > -9000);
      const H = hid.find(a => dist(T.x, T.y, a.hidden.x * 16 + 8, a.hidden.y * 16 + 8) < 8 * 16);
      if (H && Math.random() < 0.65) { startSearch([H.hidden.x * 16 + 8, H.hidden.y * 16 + 8], 3, { excl: hid.map(a => a.hidden), furn: 2 }); if (T.searchQ.length) say(pick(INSPECT_LINES)); else T.state = 'patrol'; }
    }
  }
  switch (T.state) {
    case 'power': teacherPower(T, dt, slow); break;
    case 'warn':
      T.st -= dt; T.moving = false; T.ang += angDiff(Math.atan2(P.y - T.y, P.x - T.x), T.ang) * Math.min(1, dt * 8); T.face = faceFromAng(T.ang);
      if (T.st <= 0) { T.state = 'patrol'; T.path = null; }
      break;
    case 'patrol': {
      if (!T.path || T.pi >= T.path.length) { if (!pickPatrol(T)) { T.state = 'look'; T.st = 1; T.lookBase = T.ang; break; } }
      const r = followPath(T, pr.patrol * 16 * slow, dt);
      if (r === 'done') { T.state = 'look'; T.st = rand(1, 2.2); T.lookBase = T.ang; T.path = null; }
      else if (r && r.x !== undefined) onLocked(T, r);
      break;
    }
    case 'look':
      T.st -= dt; T.moving = false; T.ang = T.lookBase + Math.sin(G.time * 2.4) * 1.2; T.face = faceFromAng(T.ang);
      if (T.st <= 0) { if (T.after === 'search') { T.after = null; startSearch(T.lastSeen, 2); } else { T.state = 'patrol'; T.path = null; } }
      break;
    case 'alert':
      T.st -= dt; T.moving = false;
      if (T.lastSeen) { T.ang += angDiff(Math.atan2(T.lastSeen[1] - T.y, T.lastSeen[0] - T.x), T.ang) * Math.min(1, dt * 8); T.face = faceFromAng(T.ang); }
      if (T.st <= 0) { T.state = 'investigate'; const [x, y] = tileXY(T.lastSeen[0], T.lastSeen[1]); if (!goTo(T, x, y)) { T.state = 'look'; T.st = 1; T.lookBase = T.ang; } }
      break;
    case 'investigate': {
      // il a tilté au loin : il va voir d'un bon pas, en visant là où il te voit
      if (T.rush && sees && T.lastSeen) { T.rushRe -= dt; if (T.rushRe <= 0 || !T.path) { T.rushRe = 0.5; const [x, y] = tileXY(T.lastSeen[0], T.lastSeen[1]); goTo(T, x, y); } }
      if (!T.path && T.rush && T.lastSeen) { const [x, y] = tileXY(T.lastSeen[0], T.lastSeen[1]); if (!goTo(T, x, y)) { T.rush = false; T.state = 'look'; T.st = 1; T.lookBase = T.ang; break; } }
      const r = followPath(T, (T.rushFull ? pr.chase : T.rush ? pr.patrol * 0.2 + pr.chase * 0.8 : (pr.patrol + pr.chase) / 2) * 16 * slow, dt);
      if (r === 'done') { T.rush = false; T.rushFull = false; T.state = 'look'; T.st = 1.3; T.lookBase = T.ang; T.after = 'search'; T.path = null; }
      else if (r && r.x !== undefined) onLocked(T, r);
      break;
    }
    case 'chase': {
      T.chaseT += dt; T.steamT = (T.steamT || 0) - dt;
      if (T.steamT <= 0 && G.tVis) { T.steamT = 0.2; part(T.x + rand(-4, 4), T.y - 33, 'puff', { vx: rand(-10, 10), vy: -24, life: 0.55, col: '#f4f2ff', size: 2 }); }
      if (pr.tires && T.chaseT > 6.5) { T.state = 'tired'; T.st = 2.6; say(L.tired); T.chaseT = 0; T.moving = false; break; }
      if (sees) {
        T.lostT = 0; T.goingLast = false; T.goingSpot = false; T.repathT -= dt;
        const d = dist(T.x, T.y, P.x, P.y);
        if (d < 22) { const st = pr.chase * 16 * slow * dt, a = Math.atan2(P.y - T.y, P.x - T.x); T.x += Math.cos(a) * Math.min(st, d); T.y += Math.sin(a) * Math.min(st, d); T.ang = a; T.face = faceFromAng(a); T.moving = true; T.anim += dt * 3; T.dist = (T.dist || 0) + Math.min(st, d); T.path = null; }
        else if (T.repathT <= 0 || !T.path) { T.repathT = 0.3; const [px, py] = tileOf(P); goTo(T, px, py); }
      } else {
        T.lostT += dt;
        if (P.hidden && T.knows === P.hidden) { if (!T.goingSpot) { T.goingSpot = true; goToSpot(T, P.hidden); } }
        else if (!T.goingLast && T.lastSeen) { T.goingLast = true; const [x, y] = tileXY(T.lastSeen[0], T.lastSeen[1]); goTo(T, x, y); }
      }
      if (T.path) {
        const r = followPath(T, pr.chase * 16 * slow, dt);
        if (r === 'done' && !sees) {
          if (T.goingSpot && P.hidden) { T.searchQ = [P.hidden]; T.searchI = 0; T.state = 'check'; T.st = 0.7; P.hidden.shake = 0.8; T.path = null; }
          else { say(pick(L.lost)); startSearch(T.lastSeen); }
        } else if (r && r.x !== undefined) onLocked(T, r);
      }
      if (!P.hidden && G.mode === 'play' && dist(T.x, T.y, P.x, P.y) < 11) caught('chase');
      break;
    }
    case 'tired':
      T.st -= dt; T.moving = false;
      if (Math.random() < dt * 3) cue(T.x + rand(-6, 6), T.y - 30, 'word', 'pff', { col: '#ffffff', life: 0.8, small: true });
      if (T.st <= 0) { T.state = 'chase'; T.chaseT = 0; T.path = null; T.goingLast = false; }
      break;
    case 'search': {
      if (T.searchI >= T.searchQ.length) { say(pick(L.give)); T.state = 'patrol'; T.path = null; T.knows = null; break; }
      const spot = T.searchQ[T.searchI];
      if (!T.path) { if (!goToSpot(T, spot)) { T.searchI++; break; } }
      const r = followPath(T, pr.patrol * 1.35 * 16 * slow, dt);
      if (r === 'done') {
        T.state = 'check'; T.st = 1.0; T.path = null; spot.shake = 1; hop(T, 50);
        for (let i = 0; i < 7; i++) part(spot.x * 16 + 8, spot.y * 16 + 4, 'junk', { vx: rand(-45, 45), vy: rand(-80, -30), g: 200, life: 0.9, col: pick(['#ffffff', '#ff6f91', '#fec43a', '#9fd7ff', '#63c74d', '#f2f2f2']), size: 2 });
        T.ang = Math.atan2(spot.y * 16 + 8 - T.y, spot.x * 16 + 8 - T.x); T.face = faceFromAng(T.ang);
        const d = dist(T.x, T.y, P.x, P.y) / 16; AU.sfx('search', clamp(1 - d / 14, 0, 0.8));
        if (!G.tVis && d < 14) cue(spot.x * 16 + 8, spot.y * 16, 'word', 'frrr…', { col: '#ffd0a0', life: 1 });
        if (Math.random() < 0.5) say(pick(L.search));
      } else if (r && r.x !== undefined) onLocked(T, r);
      break;
    }
    case 'check':
      T.st -= dt; T.moving = false;
      if (T.st <= 0) {
        const spot = T.searchQ[T.searchI];
        if (spot && P.hidden === spot) { caught('found'); return; }
        if (spot && Math.random() < 0.25 && G.m.get(spot.x, spot.y) !== K.DOOR) junkThrow(T, spot.x * 16 + 8, spot.y * 16 + 8, true);   // une chaussette sur la tête du prof !
        T.searchI++; T.state = 'search'; T.path = null;
      }
      break;
    case 'fetch': {
      const r = followPath(T, pr.chase * 0.8 * 16 * slow, dt);
      if (r === 'done') { T.state = 'keys'; T.st = 2.2; T.keyCueT = 0; }
      else if (r && r.x !== undefined) { T.state = 'unlock'; T.st = 4; }
      break;
    }
    case 'keys':
      T.st -= dt; T.moving = false; T.keyCueT -= dt;
      if (T.keyCueT <= 0) { T.keyCueT = 0.7; const d = dist(T.x, T.y, P.x, P.y) / 16; if (d < 16) { AU.sfx('keys', clamp(1 - d / 16, 0.1, 1)); if (!G.tVis) cue(T.x, T.y - 24, 'word', 'cling cling', { col: '#ffd23f', life: 0.9 }); } }
      if (T.st <= 0) { T.hasKeys = true; say('Ah ! Les voilà, mes clés !'); const kd = T.keyDoor; if (kd && kd.locked) { T.state = 'toDoor'; goTo(T, kd.x, kd.y, true); } else resumeAfterKey(T); }
      break;
    case 'toDoor': {
      const r = followPath(T, pr.chase * 0.85 * 16 * slow, dt);
      if (r && r.x !== undefined) { T.state = 'unlock'; T.st = 1.4; T.keyDoor = r; }
      else if (r === 'done') resumeAfterKey(T);
      break;
    }
    case 'unlock':
      T.st -= dt; T.moving = false; T.keyCueT = (T.keyCueT || 0) - dt;
      if (T.keyCueT <= 0) { T.keyCueT = 0.7; const d = dist(T.x, T.y, P.x, P.y) / 16; if (d < 16) AU.sfx('keys', clamp(1 - d / 16, 0.1, 1)); if (!G.tVis && d < 16) cue(T.x, T.y - 24, 'word', 'cliquetis…', { col: '#ffd23f', life: 0.9 }); }
      if (T.st <= 0) {
        const kd = T.keyDoor; if (kd) { kd.locked = false; kd.byPlayer = false; const d = dist(kd.x * 16, kd.y * 16, P.x, P.y) / 16; if (d < 16) { AU.sfx('lock', 0.7); cue(kd.x * 16 + 8, kd.y * 16 + 4, 'word', 'CLIC !', { col: '#ffd23f' }); } }
        resumeAfterKey(T);
      }
      break;
    case 'eat': {
      const a = T.apple;
      if (!a || a.eaten) { T.state = 'patrol'; T.path = null; break; }
      const r = followPath(T, pr.patrol * 1.6 * 16 * slow, dt);
      if (r === 'done' || dist(T.x, T.y, a.x, a.y) < 12) {
        a.eaten = true; G.apples = G.apples.filter(b => b !== a);
        AU.sfx('crunch', clamp(1 - dist(T.x, T.y, P.x, P.y) / 16 / 14, 0, 1)); say('Miam ! Croc croc…');
        T.state = 'sleep'; T.st = 8; T.zT = 0; T.detect = 0; T.knows = null; T.moving = false; if (AU.songName === 'chase') AU.play('sneak');
      } else if (r && r.x !== undefined) onLocked(T, r);
      break;
    }
    case 'sleep':
      T.st -= dt; T.moving = false; T.zT -= dt;
      if (T.zT <= 0) { T.zT = 0.9; cue(T.x + 6, T.y - 28, 'zzz', 'Z', { life: 1.4 }); const d = dist(T.x, T.y, P.x, P.y) / 16; AU.sfx('snore', clamp(1 - d / 12, 0, 1)); }
      if (T.st <= 0) { say('Hein ?! J’ai dormi, moi ?'); T.state = 'look'; T.st = 1.2; T.lookBase = T.ang; }
      break;
  }
  // bruits de pas
  if (T.moving) {
    T.stepT -= dt;
    if (T.stepT <= 0) {
      T.stepT = T.state === 'chase' ? 0.26 : 0.44; T.stepSide ^= 1;
      const d = dist(T.x, T.y, P.x, P.y) / 16, hr = T.state === 'chase' ? 16 : 12;
      if (d < hr) { AU.foot(floorMat(T.x, T.y), 'adult', clamp(1 - d / hr, 0, 1) * 1.1, panOf(T.x)); if (!G.tVis) cue(T.x, T.y, 'step', null, { ang: T.ang, side: T.stepSide, big: T.state === 'chase', life: 1.6 }); }
    }
  }
  if (['patrol', 'look'].includes(T.state)) { T.chatT -= dt; if (T.chatT <= 0) { T.chatT = pr.chatty ? rand(4, 7) : rand(8, 13); say(pick(L.chat)); } }
  if (pr.intercom) { G.intercomT -= dt; if (G.intercomT <= 0) { G.intercomT = rand(28, 40); const t = L.intercom.replace(/\{n\}/g, G.P.cfg.name || 'toi'); UI.banner('📢 ' + t); AU.sfx('ding', 0.8); setTimeout(() => AU.say(t, pr, 0.8), 700); } }
}
function resumeAfterKey(T) {
  const rs = T.resume || { state: 'patrol' }; T.resume = null; T.keyDoor = null; T.path = null;
  if (rs.state === 'search') { T.state = 'search'; return; }
  if (rs.goal) { T.state = 'investigate'; if (goTo(T, rs.goal[0], rs.goal[1])) return; }
  T.state = 'patrol';
}
function checkApples() {
  const T = G.T, pr = T.prof;
  for (const a of G.apples) {
    if (a.eaten) continue;
    const d = dist(T.x, T.y, a.x, a.y);
    if (d > pr.range * 16) continue;
    const inCone = d < 26 || Math.abs(angDiff(Math.atan2(a.y - T.y, a.x - T.x), T.ang)) < pr.fov + 0.3;
    if (!inCone || !los(T.x, T.y - 12, a.x, a.y - 4)) continue;
    if (T.state === 'chase' && d > 3.5 * 16) continue;
    T.state = 'eat'; T.apple = a; setMark(T, '♥', 1.2); say('Oh ! Une belle pomme !');
    const [x, y] = tileXY(a.x, a.y); if (!goTo(T, x, y)) { T.state = 'patrol'; T.path = null; }
    if (AU.songName === 'chase') AU.play('sneak');
    return;
  }
}
// ---------- Les enfants de la cour ----------
function updateKids(dt) {
  if (!G.kids.length) return;
  const P = G.P, pass = passTeach(false); G.pathBudget = 3;   // pas trop de calculs de chemin par image (sinon ça accroche)
  const kidTarget = (k, r) => { if (G.pathBudget-- <= 0) return; const [kx, ky] = tileOf(k); const near = G.L.kidSpots.filter(([x, y]) => Math.abs(x - kx) + Math.abs(y - ky) < r); const t = pick(near.length ? near : G.L.kidSpots); const p = astar(kx, ky, t[0], t[1], pass); if (p) { k.path = p; k.pi = 0; } };
  G.kids.forEach((k, i) => {
    if (k.gone) return;
    if (G.rps && G.rps.kid === k) { k.moving = false; return; }
    switch (k.beh) {
      case 'watch': infWatcher(k, dt); break;
      case 'cteach': classTeacher(k, dt); break;
      case 'swim': poolSwimKid(k, dt); break;
      case 'evac': infEvacStep(k, dt); break;
      case 'sit': case 'crowd': k.moving = false; if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; } break;
      case 'jump': k.moving = false; k.face = 0; break;
      case 'foot': lifeFoot(k, dt); break;
      case 'pairF': lifePairF(k, dt); break;
      case 'bench': k.moving = false; k.face = 0; if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; } break;
      case 'ball': if (G.ball) { const o = G.kids[G.ball.from === i ? G.ball.to : G.ball.from]; k.face = o.x > k.x ? 2 : 3; } k.moving = false; break;
      case 'robot': {
        if (!k.route) break;
        if (k.fleeT > 0) { k.fleeT -= dt; k.runK = true; if (k.path && k.pi < k.path.length) followPath(k, 3.3 * 16, dt); else k.moving = false; break; }
        k.runK = false;
        if (!k.path || k.pi >= k.path.length) {
          k.moving = false; k.st -= dt; if (k.st < k.pause - 0.4) k.face = k.ri % 2 ? 1 : 0;
          if (k.st <= 0) { k.ri = (k.ri + 1) % k.route.length; const t = k.route[k.ri], [kx, ky] = tileOf(k), p = astar(kx, ky, t[0], t[1], pass); if (p) { k.path = p; k.pi = 0; } k.st = k.pause; }
        } else followPath(k, 1.9 * 16, dt);
        break;
      }
      case 'tag': {
        k.runK = true;
        if (i === G.tagIt) {
          k.st -= dt; if (k.st > 0) { k.moving = false; break; }
          let tgt = null, bd = 1e9; G.kids.forEach((o, j) => { if (o.beh === 'tag' && j !== i) { const d = dist(o.x, o.y, k.x, k.y); if (d < bd) { bd = d; tgt = j; } } });
          if (tgt == null) break;
          k.rp = (k.rp || 0) - dt; if ((k.rp <= 0 || !k.path) && G.pathBudget-- > 0) { k.rp = 0.9; const [ox, oy] = tileOf(G.kids[tgt]); const [kx, ky] = tileOf(k); const p = astar(kx, ky, ox, oy, pass); if (p) { k.path = p; k.pi = 0; } }
          followPath(k, 3.0 * 16, dt);
          if (bd < 12) { G.tagIt = tgt; G.kids[tgt].st = 1.2; hop(G.kids[tgt], 90); G.kids[tgt].path = null; k.path = null; const d = dist(k.x, k.y, P.x, P.y) / 16; if (d < 12 && k.vis) cue(k.x, k.y - 24, 'kid', 'Chat !'); }
        } else {
          if (!k.path || k.pi >= k.path.length) kidTarget(k, 10);
          followPath(k, 2.6 * 16, dt);
        }
        break;
      }
      default: {
        if (!k.path || k.pi >= k.path.length) { k.moving = false; k.st -= dt; if (k.st <= 0) { k.st = rand(1, 3); kidTarget(k, 8); } }
        else followPath(k, 1.8 * 16, dt);
      }
    }
  });
  if (G.ball) { G.ball.t += dt / 0.9; if (G.ball.t >= 1) { G.ball.t = 0; const f = G.ball.from; G.ball.from = G.ball.to; G.ball.to = f; } }
  G.kidCueT -= dt;
  if (G.kidCueT <= 0) {
    G.kidCueT = rand(3, 7);
    const k = pick(G.kids), d = dist(k.x, k.y, P.x, P.y) / 16;
    if (k.vis && d < 14) cue(k.x, k.y - 24, 'kid', pick(['hihi !', 'Ballon !', 'À toi !', 'Ha ha !', 'Trop fort !', 'Attends-moi !']));
  }
}
// ---------- Portes ----------
function updateDoors(dt) {
  const T = G.T, P = G.P, actors = [T];
  if (!P.hidden && !P.out) actors.push(P);
  if (G.P2 && !G.P2.hidden && !G.P2.out && G.P2.x > -9000) actors.push(G.P2);
  G.kids.forEach(k => actors.push(k));
  if (G.inf && G.inf.guard) { G.inf.fugs.forEach(f => { if (f.fl === G.inf.cur && f.st !== 'hide' && f.st !== 'caught' && f.st !== 'out') actors.push(f); }); if (G.T2 && G.T2.x > -9000) actors.push(G.T2); }
  for (const d of G.doors) {
    const cx = d.x * 16 + 8, cy = d.y * 16 + 8; let opener = null;
    if (!d.locked) for (const a of actors) { if (doorNear(d, a, cx, cy)) { opener = a; break; } }
    if (d.hideP) opener = opener || P;
    if (d.forceT > 0) { d.forceT -= dt; if (!d.locked) opener = opener || T; }
    if (opener) { if (d.target === 0) { d.target = 1; onDoorOpen(d, opener); } d.closeT = 1.1; }
    else if (d.target === 1) { d.closeT -= dt; if (d.closeT <= 0) d.target = 0; }
    d.open += (d.target - d.open) * Math.min(1, dt * 14);
  }
}
// une porte s'ouvre quand on est juste devant (pas quand on passe à côté) ; l'élève qui longe le couloir ne l'ouvre pas
function doorNear(d, a, cx, cy) {
  const ddx = a.x - cx, ddy = a.y - 5 - cy;
  if (d.horiz ? (Math.abs(ddx) >= 10 || Math.abs(ddy) >= 15) : (Math.abs(ddx) >= 15 || Math.abs(ddy) >= 11)) return false;
  if (a === G.P && a.moving && !(Math.floor(a.x / 16) === d.x && Math.floor((a.y - 4) / 16) === d.y)) {
    const vx = a.vx || 0, vy = a.vy || 0, along = Math.abs(d.horiz ? vx : vy), toward = d.horiz ? -Math.sign(ddy) * vy : -Math.sign(ddx) * vx;
    if (toward <= 5 && along > 10) return false;
  }
  return true;
}
function onDoorOpen(d, a) {
  const V0 = viewerA(), dd = dist(d.x * 16 + 8, d.y * 16 + 8, V0.x, V0.y) / 16;
  if (a === G.P) { G.P.lastDoor = d; G.P.lastDoorT = G.time; }
  if (a === V0) { AU.sfx('door', 0.3); if (a === G.P) makeNoise(d.x * 16 + 8, d.y * 16 + 10, 2.5, null, 'door'); return; }
  if (a === G.T || a === G.P) {
    const vis = a === G.T ? G.tVis : G.pVis;
    if (dd < 5) G.shake = Math.max(G.shake, 0.12);
    if (dd < 18) { AU.sfx('door', clamp(1 - dd / 18, 0.1, 1)); if (!vis) cue(d.x * 16 + 8, d.y * 16 + 4, 'word', 'CLAC !', { col: '#ffb347', pop: true }); }
  } else if (dd < 9) AU.sfx('door', 0.15);
}
// ---------- Le joueur ----------
function boxFree(x, y, hw, hh, solid) {
  solid = solid || solidP;
  const x0 = Math.floor((x - hw) / 16), x1 = Math.floor((x + hw) / 16), y0 = Math.floor((y - hh) / 16), y1 = Math.floor(y / 16);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solid(tx, ty)) return false;
  return true;
}
function moveP(dx, dy) { const P = G.P; return moveA(P, dx, dy, solidP, P.small > 0 ? 3 : 5, P.small > 0 ? 4 : 6); }
function moveA(P, dx, dy, solid, hw, hh) {
  const bf = (x, y, a, b) => boxFree(x, y, a, b, solid);
  let blockedX = false, blockedY = false;
  if (dx) { if (bf(P.x + dx, P.y, hw, hh)) P.x += dx; else blockedX = true; }
  if (dy) { if (bf(P.x, P.y + dy, hw, hh)) P.y += dy; else blockedY = true; }
  // aide aux coins (pour passer les portes facilement)
  const assist = (main, axis) => {
    for (let o = 1; o <= 6; o++) for (const sg of [1, -1]) {
      const ox = axis === 'x' ? 0 : sg * o, oy = axis === 'x' ? sg * o : 0;
      if (bf(P.x + ox + (axis === 'x' ? main : 0), P.y + oy + (axis === 'y' ? main : 0), hw, hh)) {
        const stp = Math.min(o, Math.abs(main) + 0.6) * sg;
        if (axis === 'x') { if (bf(P.x, P.y + stp, hw, hh)) P.y += stp; } else { if (bf(P.x + stp, P.y, hw, hh)) P.x += stp; }
        return true;
      }
    }
    return false;
  };
  if (blockedX && Math.abs(dx) > Math.abs(dy) * 1.5) assist(dx, 'x');
  if (blockedY && Math.abs(dy) > Math.abs(dx) * 1.5) assist(dy, 'y');
  return blockedX || blockedY;
}
// le déguisement tient 15 secondes, puis la perruque tombe
const DISGUISE_T = 15;
function undisguise() {
  const P = G.P; if (!P.disguised) return;
  if (P.cfgOrig) P.cfg = P.cfgOrig; P.disguised = false; P.disguiseT = 0; P.cfgOrig = null; P.spin = 0.5;
  if (P.hidden) { AU.sfx('pouf'); toast('🥸 Ton déguisement est tombé dans ta cachette.', 1.8); }
  else { puff(P.x, P.y - 10, 16, '#ffffff'); AU.sfx('pouf'); cue(P.x, P.y - 40, 'word', 'OUPS !', { col: '#ff9fd8', pop: true }); toast('🥸 Fin du déguisement : c’est re-toi !', 1.8); }
  if (G.net) Net.send({ t: 'undisguise', cfg: P.cfg });
}
function updatePlayer(dt) {
  const P = G.P, inp = Input.get(), T = G.T;
  if (P.out) { P.moving = false; return; }
  if (P.jail) { P.jailT = (P.jailT || 0) + dt; if (P.jailT > 60) coopAutoRelease(); }
  if (P.lesson) { P.moving = false; P.running = false; return; }
  if (G.rps) { P.moving = false; P.running = false; P.vx = 0; P.vy = 0; return; }   // un élève te tient en chi-fou-mi
  P.vx = 0; P.vy = 0;
  { const dT = dist(T.x, T.y, P.x, P.y) / 16, danger = ['chase', 'search', 'check', 'investigate', 'alert'].includes(T.state);
    P.trem = 0;
    if (!P.hidden && dT < 4.5 && danger) { P.trem = 0.5; P.sweatT = (P.sweatT || 0) - dt; if (P.sweatT <= 0) { P.sweatT = 0.45; part(P.x + (Math.random() < 0.5 ? -6 : 6), P.y - 27, 'drop', { vx: rand(-12, 12), vy: -22, g: 160, life: 0.6, col: '#7fd0ff' }); } }
    if (P.hidden && dT < 3 && T.state !== 'sleep') { P.hidden.shake = Math.max(P.hidden.shake || 0, 0.06); P.glupT = (P.glupT || 0) - dt; if (P.glupT <= 0) { P.glupT = rand(2.5, 4); cue(P.hidden.x * 16 + 8, P.hidden.y * 16 - 4, 'word', pick(['glups…', 'gloups', '*tremble*']), { col: '#bfe4ff', small: true, life: 1 }); } } }
  if (P.small > 0) { const was = P.small; P.small -= dt; if (P.small <= 0) unshrink(); else if (was > 3 && P.small <= 3) toast('⏳ Le gâteau s’épuise…', 1.6); }
  if (P.slip > 0) { P.slip -= dt; if (P.slip <= 0) toast('Pantoufle : plus de magie.', 1.4); }
  if (P.disguised && P.disguiseT > 0) { const was = P.disguiseT; P.disguiseT -= dt; if (P.disguiseT <= 0) undisguise(); else if (was > 3 && P.disguiseT <= 3) toast('⏳ La moustache se décolle…', 1.6); }
  if (P.hidden) {
    P.moving = false; P.running = false;
    if (inp.mag > 0.6) { P.unhideT += dt; if (P.unhideT > 0.18) unhide(); } else P.unhideT = 0;
    return;
  }
  if (P.taskOpen) { P.moving = false; P.running = false; P.runT = 0; return; }
  if (G.m.pools && poolPlayer(dt)) return;
  if (P.skidT > 0) {
    P.skidT -= dt; P.moving = false; P.running = false;
    moveP(P.skv[0] * dt, P.skv[1] * dt); const dec = Math.max(0, 1 - dt * 9); P.skv[0] *= dec; P.skv[1] *= dec;
    if (Math.random() < dt * 30) part(P.x - P.skv[0] * 0.03 + rand(-2, 2), P.y - 1, 'puff', { vx: -P.skv[0] * 0.2 + rand(-6, 6), vy: rand(-12, -4), life: 0.45, col: '#e6ddd0', size: 2 });
    return;
  }
  if (P.busy) {
    const b = P.busy;
    if (inp.mag > 0.35) { if (b.ex) b.ex.progress = b.t / b.dur; P.busy = null; if (!b.peek) toast('Action annulée', 0.9); return; }
    const waitPartner = G.inf && G.inf.coop && b.ex && b.ex.gate && !(G.P2 && G.P2.pg);
    if (waitPartner) { b.label = 'Attends ' + (G.P2.cfg.name || 'ton coéquipier') + '…'; P.moving = false; P.running = false; return; }
    if (b.ex && b.ex.gate && G.inf && G.inf.coop) b.label = b.ex.label + '…';
    b.t += dt; if (b.ex) b.ex.progress = b.t / b.dur;
    if (b.noise) { b.noiseT -= dt; if (b.noiseT <= 0) { b.noiseT = 0.7; makeNoise(b.nx, b.ny, b.noise, b.word); if (b.snd) AU.sfx(b.snd, 0.8); if (b.word) cue(b.nx, b.ny - 8, 'word', b.word, { col: '#ffffff', pop: true, life: 0.9 }); } }
    P.moving = false; P.running = false;
    if (b.t >= b.dur) { P.busy = null; b.done(); }
    return;
  }
  const want = inp.mag > 0.08 ? [inp.x / inp.mag, inp.y / inp.mag] : null;
  if (P.runT > 0.28 && !P.swim && (!want || (P.lastDir && want[0] * P.lastDir[0] + want[1] * P.lastDir[1] < -0.35))) {
    P.skidT = 0.24; P.skv = [P.lastDir[0] * PL_RUN * 0.75, P.lastDir[1] * PL_RUN * 0.75]; P.runT = 0;
    AU.sfx('skid'); makeNoise(P.x, P.y, 3, 'SKRRR'); squash(P, 5);
    cue(P.x, P.y - 36, 'word', pick(['HIIIIK !', 'SKRRR !', 'OUPS !']), { col: '#ffffff', pop: true, small: true, life: 0.7 });
    return;
  }
  if (want) { P.idleT = 0; P.tapping = false; } else if (!P.hidden && !P.busy) {
    P.idleT = (P.idleT || 0) + dt;
    P.tapping = P.idleT > 3.5 && ((P.idleT * 2.5) | 0) % 2 === 1;
    if (P.idleT > 6) { P.lookT = (P.lookT || 0) - dt; if (P.lookT <= 0) { P.lookT = rand(1.2, 2.4); P.lookTo = pick([-0.6, 0.6, 0, 0]); } }
    if (P.vang != null) { P.lookOff = (P.lookOff || 0) + ((P.lookTo || 0) - (P.lookOff || 0)) * Math.min(1, dt * 5); P.face = faceFromAng(P.vang + P.lookOff); }
  }
  if (inp.mag > 0.08) {
    const run = inp.mag > 0.62;
    let sp = run ? PL_RUN : PL_SNEAK * (0.45 + 0.55 * Math.min(1, inp.mag / 0.62));
    if (P.small > 0) sp *= 0.85; if (P.slip > 0 && run) sp *= 1.3; if (isDark()) sp *= 0.85; if (P.swim) sp *= P.under ? 0.55 : 0.62;
    const nx = inp.x / inp.mag, ny = inp.y / inp.mag;
    const ox = P.x, oy = P.y;
    const blocked = moveP(nx * sp * dt, ny * sp * dt);
    P.vx = (P.x - ox) / dt; P.vy = (P.y - oy) / dt;
    const moved = Math.hypot(P.x - ox, P.y - oy); P.dist = (P.dist || 0) + moved;
    P.moving = moved > 0.05; P.running = run && P.moving;
    const nf = faceFromAng(Math.atan2(ny, nx)); if (nf !== P.face && P.running) { squash(P, 3); puff(P.x, P.y - 1, 2, '#e6ddd0'); }
    if (P.running) { P.runT = (P.runT || 0) + dt; P.lastDir = [nx, ny]; if (Math.abs(nx) > 0.5 && Math.random() < dt * 16) part(P.x - nx * 7 + rand(-3, 3), P.y - rand(5, 24), 'streak', { vx: -nx * 50, vy: -ny * 50, life: 0.22, col: '#ffffff' }); }
    else P.runT = 0;
    if (P.slip > 0 && P.running) { FX.ghostT -= dt; if (FX.ghostT <= 0) { FX.ghostT = 0.05; FX.ghosts.push({ x: P.x, y: P.y, face: P.face, dist: P.dist, small: P.small > 0, t: 0 }); } }
    P.vang = Math.atan2(ny, nx); P.lookOff = 0; P.lookTo = 0; P.face = faceFromAng(P.vang); P.anim += dt * (run ? 1.5 : 0.9) * (P.moving ? 1 : 0);
    if (blocked && !P.moving) { P.bumpT -= dt; if (P.bumpT <= 0) { P.bumpT = 0.6; AU.sfx('bump'); squash(P, -4); if (isDark()) cue(P.x, P.y - 34, 'word', pick(['BONK', 'AÏE', 'OUILLE']), { col: '#ffd23f', pop: true, small: true, life: 0.7 }); if (run) { for (let i = 0; i < 4; i++) part(P.x + nx * 6, P.y - 18, 'star', { vx: rand(-30, 30), vy: rand(-40, -10), g: 60, life: 0.6, col: '#ffd23f' }); cue(P.x, P.y - 34, 'word', 'BONK', { col: '#ffd23f', pop: true, small: true, life: 0.7 }); } } }
    if (P.running) {
      P.stepT -= dt;
      if (P.stepT <= 0) {
        P.stepT = 0.3;
        if (!(P.slip > 0) && !P.swim) makeNoise(P.x, P.y, P.small > 0 ? 2.5 : 4.5, null, 'step');
        part(P.x - nx * 4, P.y, 'puff', { vx: -nx * 10 + rand(-5, 5), vy: -6, life: 0.4, col: P.slip > 0 ? '#bfefff' : '#d8d0c4', size: 2 });
        if (P.slip > 0) sparkle(P.x, P.y - 4, 2, '#bfefff');
      }
    } else P.stepT = Math.min(P.stepT, 0.12);
  } else { P.moving = false; P.running = false; P.runT = 0; }
  gaitFx(P, true);
  if (G.m.pools) poolAfterMove(dt);
  // petite porte : astuce
  if (P.small > 0 && !G.smallDoorTip) { const [tx, ty] = tileOf(P); const d = doorAt(tx, ty); if (d && d.locked) { G.smallDoorTip = true; toast('Mini-toi passe sous les portes. Pratique.', 2); } }
  // ramassage
  for (let i = G.items.length - 1; i >= 0; i--) {
    const it = G.items[i];
    if (dist(it.x, it.y, P.x, P.y) < 11) {
      if (it.kind === 'key') { P.keys = (P.keys || 0) + 1; G.items.splice(i, 1); if (G.net) Net.send({ t: 'item', id: it.id }); AU.sfx('keys'); sparkle(it.x, it.y - 6, 14); hop(P, 110); toast('🗝️ Petite clé : une porte fermée de moins !', 2.2); UI.hudSig = null; continue; }
      if (P.inv.length >= 3) { if (G.msgCD <= 0) { toast('Sac plein ! (3 objets, pas plus)', 1.6); G.msgCD = 2.5; } continue; }
      P.inv.push(it.kind); G.items.splice(i, 1); if (G.net) Net.send({ t: 'item', id: it.id }); AU.sfx('pickup'); sparkle(it.x, it.y - 6, 12); hop(P, 110);
      const sid = it.kind === 'squishy' ? squishyGot(P) : null; FX.flyers.push({ kind: it.kind, sid, slot: P.inv.length - 1, wx: it.x, wy: it.y - 10, t: 0 });
      if (sid == null) toast('✨ ' + ITEMS[it.kind].n + ' : ' + ITEMS[it.kind].d, 3.2);
    }
  }
  // trou de souris
  if (P.small > 0) { for (const e of G.L.exits) if (e.type === 'small') { if (Math.abs(P.x - (e.x * 16 + 8)) < 13 && Math.abs(P.y - 6 - (e.y * 16 + 8)) < 13) { if (tasksLeft() > 0) { if (G.msgCD <= 0) { G.msgCD = 3; toast('🔒 Tâches d’abord (' + G.tasksDone + '/' + G.tasks.length + ') !', 2); } } else { escape(e, e.x, e.y); return; } } } }
}
function unshrink() {
  const P = G.P; P.small = 0; P.spin = 0.5; AU.sfx('grow'); puff(P.x, P.y - 6, 10);
  if (P.hidden && P.hidden.small) { const s = P.hidden; P.hidden = null; const st = s.stand[0]; P.x = st[0] * 16 + 8; P.y = st[1] * 16 + 12; toast('POP ! Trop grand·e pour ta cachette. Oups.', 2); if (G.T.seeNow) G.T.detect = 1; }
  if (!boxFree(P.x, P.y, 5, 6)) {
    const [tx, ty] = tileOf(P); let best = null, bd = 1e9;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = tx + dx, y = ty + dy; if (G.m.get(x, y) === K.FLOOR && boxFree(x * 16 + 8, y * 16 + 12, 5, 6)) { const d = Math.abs(dx) + Math.abs(dy); if (d < bd) { bd = d; best = [x, y]; } } }
    if (best) { P.x = best[0] * 16 + 8; P.y = best[1] * 16 + 12; }
  }
  toast('Retour à ta taille normale.', 1.5);
}
function hide(spot) {
  const P = G.P, T = G.T;
  if (spot.k === K.DOOR) { const d = doorAt(spot.x, spot.y); if (d.locked) return; d.hideP = true; }
  FX.zips.push({ x0: P.x, y0: P.y, x1: spot.x * 16 + 8, y1: spot.y * 16 + 12, face: P.face, small: P.small > 0, t: 0 });
  P.hidden = spot; P.hideFrom = [P.x, P.y]; P.busy = null; P.unhideT = 0; spot.shake = 0.6;
  AU.sfx(spot.k === K.LOCKER ? 'locker' : (spot.k === K.ARMOIRE || spot.k === K.STALL || spot.k === K.CABANE) ? 'wardrobe' : (spot.k === K.BUSH || spot.k === K.TREE) ? 'rustle' : spot.k === K.TRASH ? 'trash' : 'hide'); puff(spot.x * 16 + 8, spot.y * 16 + 8, 8);
  if (T.seeNow || (T.state === 'chase' && T.lostT < 0.25 && los(T.x, T.y - 12, P.x, P.y - 7) && dist(T.x, T.y, P.x, P.y) < T.prof.range * 16)) { T.knows = spot; say('Je sais où tu te caches, {n} !'); setMark(T, '!', 1); }
}
function unhide() {
  const P = G.P, s = P.hidden; if (!s) return;
  if (s.k === K.DOOR) { const d = doorAt(s.x, s.y); if (d) d.hideP = false; }
  P.hidden = null; let [x, y] = P.hideFrom || [s.stand[0][0] * 16 + 8, s.stand[0][1] * 16 + 12];
  if (!boxFree(x, y, 5, 6)) { const st = s.stand[0]; x = st[0] * 16 + 8; y = st[1] * 16 + 12; }
  P.x = x; P.y = y; AU.sfx('unhide'); puff(s.x * 16 + 8, s.y * 16 + 8, 6); s.shake = 0.4; squash(P, -6); hop(P, 95);
  if (G.T.knows === s) G.T.knows = null;
}
// ---------- Actions contextuelles ----------
function computeActions() {
  if (G.net && G.net.role === 'teacher') return computeActionsT();
  const P = G.P, acts = [], m = G.m, L = G.L;
  if (G.mode !== 'play' || G.rps) return acts;
  if (P.hidden) { acts.push({ id: 'unhide', icon: '👀', label: 'Sortir', sub: P.hidden.n }); return acts; }
  if (P.busy) return [{ id: 'busy', icon: '⏳', label: P.busy.label, sub: 'Bouge pour annuler', progress: P.busy.t / P.busy.dur }];
  if (G.m.pools) { const pa = poolActions(P); if (pa) return pa; }
  const [ptx, pty] = tileOf(P), cx0 = P.x, cy0 = P.y - 6;
  const cand = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const tx = ptx + dx, ty = pty + dy, d = Math.hypot(tx * 16 + 8 - cx0, ty * 16 + 8 - cy0);
    if (d > 21 && !(d < 30 && G.inf && G.inf.coop && (G.L.exitAt.get(ty * m.w + tx) || {}).gate)) continue;
    const key = ty * m.w + tx, k = m.get(tx, ty);
    const ex = L.exitAt.get(key);
    const locked = tasksLeft() > 0, lockSub = 'Finis tes tâches (' + G.tasksDone + '/' + G.tasks.length + ')';
    const tk = G.tasks.find(t => !t.done && t.x === tx && t.y === ty);
    if (tk) cand.push({ id: 'task', task: tk, icon: tk.def.icon, label: 'Tâche !', sub: tk.def.name, prio: 0.5, d });
    if (ex && !ex.done && G.inf && ex.gate && !G.inf.keys && !G.inf.alarm) cand.push({ id: 'gateLocked', icon: '🔒', label: ex.label, sub: 'fermé à clé', prio: 0, d });
    else if (ex && !ex.done && G.inf && G.inf.coop && ex.gate && !coopPartnerNear(ex)) cand.push({ id: 'gateTwo', icon: '🚧', label: ex.label, sub: 'il faut être deux !', prio: 0, d });
    else if (ex && !ex.done && locked && (ex.type === 'hold' || P.small > 0)) cand.push({ id: 'locked', icon: '🔒', label: ex.label, sub: lockSub, prio: 0, d });
    else if (ex && !ex.done) {
      if (ex.type === 'hold') cand.push({ id: 'exit', ex, icon: ex.icon, label: ex.label, sub: ex.progress > 0 ? Math.round(ex.progress * 100) + ' %' : '', prio: 0, d });
      else if (ex.type === 'small') cand.push({ id: 'small', ex, icon: ex.icon, label: P.small > 0 ? 'Se faufiler !' : 'Un trou minuscule…', sub: P.small > 0 ? '' : 'il faudrait rétrécir', prio: 0, d });
    }
    const sx = L.candAt.get(key);
    if (sx && sx.revealed && sx.secret[0] === tx && sx.secret[1] === ty) cand.push(locked ? { id: 'locked', icon: '🔒', label: 'Passage secret', sub: lockSub, prio: 0, d } : { id: 'secretGo', ex: sx, tx, ty, icon: '🚪', label: 'Prendre le passage !', sub: '', prio: 0, d });
    else if (sx && !G.searched.has(key)) cand.push({ id: 'search', tx, ty, ex: sx, icon: '🔍', label: sx.label, sub: '', prio: 2, d });
    else if ((SEARCHABLE_KINDS.has(k) || (G.inf && k === K.DESK) || (G.stash && STASH_KINDS.has(k))) && !G.searched.has(key)) cand.push({ id: 'search', tx, ty, icon: '🔍', label: STASH_LABEL[k] || 'Fouiller', sub: G.stash && G.stash.has(key) ? '✨' : '', prio: G.stash && G.stash.has(key) ? 0.8 : k === K.DESK ? 1.5 : 3, d });
    const hs = L.hideAt.get(key);
    if (hs && (!hs.small || P.small > 0)) {
      let okd = true; if (hs.k === K.DOOR) { const dr = doorAt(tx, ty); okd = !dr.locked && !actorInDoor(dr); }
      if (okd) cand.push({ id: 'hide', spot: hs, icon: '🙈', label: 'Se cacher', sub: hs.n, prio: 1, d });
    }
    if (k === K.DOOR) {
      const dr = doorAt(tx, ty);
      if (dr.locked && !dr.byPlayer) {
        const confisc = dr.jail && P.jail, canKey = ((P.keys || 0) > 0 || (G.inf && G.inf.keys)) && !confisc;
        if (confisc) cand.push({ id: 'lockedDoor', icon: '🔒', label: 'Fermé à clé', sub: 'clés confisquées !', prio: 0.7, d }); else cand.push(canKey ? { id: 'openKey', door: dr, icon: '🗝️', label: 'Ouvrir', sub: G.inf && G.inf.keys ? 'avec le trousseau' : 'avec ta clé', prio: 0.4, d } : { id: 'lockedDoor', icon: '🔒', label: 'Fermé à clé', sub: 'il faut une clé 🗝️', prio: 0.7, d });
      }
      else if (!actorInDoor(dr)) {
        if (dr.locked && dr.byPlayer) cand.push({ id: 'unlock', door: dr, icon: '🔓', label: 'Déverrouiller', sub: '', prio: 0.45, d });
        else if (!dr.locked && locksLeft() > 0) cand.push({ id: 'lock', door: dr, icon: '🔒', label: 'Fermer à clé', sub: locksLeft() + ' clé' + (locksLeft() > 1 ? 's' : ''), prio: 0.45, d });
      }
    }
    const gag = m.gags.find(g => g.x === tx && g.y === ty);
    if (gag) cand.push({ id: 'gag', gag, icon: '🚪', label: 'Pousser', sub: 'la grande porte', prio: 5, d });
  }
  if (P.lastDoor && G.time - P.lastDoorT < 3.5 && !P.lastDoor.locked && locksLeft() > 0 && !actorInDoor(P.lastDoor)) {
    const d0 = P.lastDoor, dd = Math.hypot(d0.x * 16 + 8 - P.x, d0.y * 16 + 8 - (P.y - 6));
    if (dd > 12 && dd < 44) cand.push({ id: 'lock', door: d0, icon: '🔒', label: 'Fermer à clé', sub: 'derrière moi !', prio: 0.15, d: 0 });
  }
  if (G.m.board && Math.hypot(G.m.board.lx * 16 + 8 - P.x, G.m.board.ly * 16 + 8 - (P.y - 6)) < 26) cand.push({ id: 'pclimb', icon: '🪜', label: 'Monter au plongeoir', sub: 'tout là-haut !', prio: 0.6, d: 0 });
  if (G.power && !G.dark && G.power.uses > 0 && !(G.net && !G.net.cc) && !G.inf && powerNear(P)) cand.push({ id: 'power', icon: '⚡', label: 'Couper le courant', sub: G.power.uses + '/' + POWER_USES, prio: 0.9, d: 0 });
  if (G.net && G.net.cc) ccActions(cand, P);
  if (G.inf) infActions(cand, P);
  if (G.inf && G.inf.coop) coopActions(cand, P);
  cand.sort((a, b) => a.prio - b.prio || a.d - b.d);
  const seen = new Set();
  for (const c of cand) { if (seen.has(c.id)) continue; seen.add(c.id); acts.push(c); }   // toutes : chaque gros bouton prend la meilleure de sa catégorie
  return acts;
}
function actorInDoor(d) {
  const cx = d.x * 16 + 8, cy = d.y * 16 + 8;
  const near = a => Math.abs(a.x - cx) < 11 && Math.abs(a.y - 5 - cy) < 11;
  return near(G.T) || (!G.P.hidden && near(G.P)) || d.hideP;
}
function locksLeft() { return 3 - G.doors.filter(d => d.locked && d.byPlayer).length; }
// on note quel gros bouton a lancé l'action en cours (pour y afficher la barre de progression)
function doAction(a) {
  doAction0(a);
  const A = G.net && G.net.role === 'teacher' ? G.T : G.P;
  if (a && A && A.busy && !A.busy.cat) A.busy.cat = actCat(a.id);
}
function doAction0(a) {
  const P = G.P; if (!a || G.mode !== 'play') return;
  AU.init();
  if (G.net && G.net.role === 'teacher') { doActionT(a); return; }
  if (G.inf && G.inf.coop && coopDo(a)) return;
  if (G.inf && infDo(a)) return;
  switch (a.id) {
    case 'gateLocked': AU.sfx('fail'); toast('🔒 Portail fermé. Trousseau… ou alarme incendie 🔥', 2.6); break;
    case 'unhide': unhide(); break;
    case 'pdive': poolDive(); break;
    case 'psurface': poolSurface(false); break;
    case 'pclimb': poolClimb(); break;
    case 'pjump': poolJump(); break;
    case 'pdown': poolDown(); break;
    case 'power': AU.sfx('search', 0.5); P.busy = { label: 'J’ouvre le disjoncteur…', dur: 1.2, t: 0, done: () => { if (G.net && G.net.cc && !Net.isHost) Net.send({ t: 'ccPower' }); else powerCut(); } }; break;
    case 'ccFree': ccFree(); break;
    case 'hide': hide(a.spot); break;
    case 'task': TaskUI.open(a.task); break;
    case 'locked': AU.sfx('fail'); toast('🔒 Encore ' + tasksLeft() + ' tâche' + (tasksLeft() > 1 ? 's' : '') + ' 📋. Pas de raccourci !', 2.4); break;
    case 'secretGo': escape(a.ex, a.tx, a.ty); break;
    case 'exit': {
      const ex = a.ex;
      P.busy = { label: ex.label + '…', dur: ex.time, t: ex.progress * ex.time, ex, noise: ex.noise, noiseT: 0, snd: ex.snd, word: ex.word, nx: ex.x * 16 + 8, ny: ex.y * 16 + 8, done: () => { ex.done = true; escape(ex, ex.x, ex.y); } };
      break;
    }
    case 'small':
      if (P.small > 0) escape(a.ex, a.ex.x, a.ex.y);
      else toast('🐭 Trop petit. Un gâteau « Mange-moi », peut-être ?', 2.4);
      break;
    case 'search': {
      const key = a.ty * G.m.w + a.tx;
      AU.sfx('search', 0.6); makeNoise(a.tx * 16 + 8, a.ty * 16 + 8, 2.5, 'frrr…');
      P.busy = {
        label: 'Je fouille…', dur: 1.1, t: 0, dig: [a.tx * 16 + 8, a.ty * 16 + 8], done: () => {
          G.searched.add(key);
          const ex = a.ex;
          if (G.inf && infSearchDesk(a, key)) return;
          if (ex && ex.secret && ex.secret[0] === a.tx && ex.secret[1] === a.ty) {
            ex.revealed = true; AU.sfx('found'); sparkle(a.tx * 16 + 8, a.ty * 16 + 6, 24);
            if (tasksLeft() > 0) toast('🎉 ' + ex.reveal + ' Mais tâches d’abord !', 2.8);
            else { ex.done = true; toast('🎉 ' + ex.reveal, 2.2); setTimeout(() => { if (G.mode === 'play') escape(ex, a.tx, a.ty); }, 700); }
          } else if (G.stash && G.stash.has(key) && G.stash.get(key).kind === 'pet') {
            G.stash.delete(key); if (G.net && G.net.cc) Net.send({ t: 'ccStash', k: key });
            if (P.pet) { P.pet.leaveT = 1.2; }
            setTimeout(() => { if (G.mode === 'play' || G.mode === 'paused') cutePetFound(P, a.tx * 16 + 8, (a.ty + 1) * 16 + 4); }, P.pet ? 600 : 0);
          } else if (G.stash && G.stash.has(key)) {
            const s = G.stash.get(key);
            if (P.inv.length >= 3) { G.searched.delete(key); toast('✨ Il y a quelque chose… mais ton sac est plein (3 objets).', 2.4); }
            else {
              G.stash.delete(key); if (G.net && G.net.cc) Net.send({ t: 'ccStash', k: key }); P.inv.push(s.kind); AU.sfx('pickup'); AU.sfx('magic', 0.5); sparkle(a.tx * 16 + 8, a.ty * 16 + 6, 18); hop(P, 110);
              const sid = s.kind === 'squishy' ? squishyGot(P) : null; FX.flyers.push({ kind: s.kind, sid, slot: P.inv.length - 1, wx: a.tx * 16 + 8, wy: a.ty * 16, t: 0 });
              if (sid == null) toast('✨ Trouvé : ' + ITEMS[s.kind].n + ' ! ' + ITEMS[s.kind].d, 3.4);
            }
          } else if (G.disguiseAt && G.disguiseAt.has(key)) {
            if (P.inv.length >= 3) { G.searched.delete(key); toast('🥸 Un déguisement… et pas de place. Dommage.', 2.2); }
            else { G.disguiseAt.delete(key); P.inv.push('disguise'); AU.sfx('pickup'); sparkle(a.tx * 16 + 8, a.ty * 16 + 6, 16); hop(P, 100); FX.flyers.push({ kind: 'disguise', slot: P.inv.length - 1, wx: a.tx * 16 + 8, wy: a.ty * 16, t: 0 }); toast('🥸 Un déguisement ! ' + ITEMS.disguise.d, 3.4); }
          } else if (!G.stash && !P.pet && !G.petFound && !(G.net && !G.net.cc && !G.inf) && Math.random() < 0.1) {
            G.petFound = true; cutePetFound(P, a.tx * 16 + 8, (a.ty + 1) * 16 + 4);
          } else if (!G.stash && Math.random() < 0.18 && G.found < 2 && P.inv.length < 3) {
            G.found++; const kd = pick(ITEM_KEYS); P.inv.push(kd); AU.sfx('pickup'); sparkle(a.tx * 16 + 8, a.ty * 16 + 6, 12);
            if (kd === 'squishy') squishyGot(P); else toast('😮 Trouvé : ' + ITEMS[kd].n + ' ! ' + ITEMS[kd].d, 3);
          } else { AU.sfx('fail'); toast(pick(SEARCH_MSG) + (ex ? ' Pas de passage ici…' : ''), 1.8); junkOnHead(P, a.tx, a.ty); }
        }
      };
      break;
    }
    case 'lock': {
      const d = a.door;
      P.busy = { label: 'Je ferme à clé…', dur: 0.35, t: 0, done: () => { if (actorInDoor(d)) return; d.locked = true; d.byPlayer = true; d.target = 0; d.closeT = 0; AU.sfx('lock'); makeNoise(d.x * 16 + 8, d.y * 16 + 8, 4, 'CLIC !'); if (G.net) Net.send({ t: 'lock', i: G.doors.indexOf(d), l: 1 }); cue(d.x * 16 + 8, d.y * 16 + 4, 'word', 'CLIC !', { col: '#ffd23f', pop: true, life: 0.9 }); toast('🔒 Verrouillé ! Le prof va devoir chercher ses clés. Hihi.', 2); } };
      break;
    }
    case 'openKey': {
      const d = a.door;
      P.busy = { label: 'J’ouvre…', dur: 0.6, t: 0, done: () => { if (!d.locked) return; d.locked = false; d.byPlayer = false; if (!(G.inf && G.inf.keys)) P.keys = Math.max(0, (P.keys || 0) - 1); AU.sfx('lock'); AU.sfx('keys', 0.5); cue(d.x * 16 + 8, d.y * 16 + 4, 'word', 'CLIC !', { col: '#ffd23f', pop: true }); if (G.net) Net.send({ t: 'lock', i: G.doors.indexOf(d), l: 0 }); UI.hudSig = null; } };
      break;
    }
    case 'lockedDoor': AU.sfx('bump'); if (P.jail) { toast('🔒 Clés confisquées. Attends ton équipier !', 2.2); break; } toast('🔒 Fermé à clé. Une petite clé 🗝️ qui brille par terre ? Ou le trousseau.', 2.6); break;
    case 'unlock': { const d = a.door; d.locked = false; d.byPlayer = false; AU.sfx('lock'); if (G.net) Net.send({ t: 'lock', i: G.doors.indexOf(d), l: 0 }); break; }
    case 'gag': toast(a.gag.text, 2.4); AU.sfx('bump'); makeNoise(a.gag.x * 16 + 8, a.gag.y * 16 + 16, 3, 'BOUM'); break;
  }
}
function useItem(i) {
  const P = G.P; if (G.mode !== 'play') return; const kind = P.inv[i]; if (!kind) return; AU.init();
  let used = true;
  switch (kind) {
    case 'cake':
      if (P.hidden && !P.hidden.small) { /* ok */ }
      P.small = Math.max(P.small, 0) + 20; P.spin = 0.6; AU.sfx('shrink'); sparkle(P.x, P.y - 8, 16, '#ff9fd8'); toast('🍰 Croc ! Mini-toi pendant 20 s.', 2);
      break;
    case 'lamp': {
      const T = G.T;
      let spots = G.L.hides.filter(s => (!s.small || P.small > 0) && s.k !== K.DOOR && s !== P.hidden && dist(s.x * 16, s.y * 16, T.x, T.y) > 9 * 16);
      if (!spots.length) spots = G.L.hides.filter(s => !s.small && s !== P.hidden);
      spots.sort((a, b) => dist(b.x * 16, b.y * 16, T.x, T.y) - dist(a.x * 16, a.y * 16, T.x, T.y));
      const s = pick(spots.slice(0, 6));
      const ox = P.x, oy = P.y;
      if (P.hidden) unhide();
      puff(ox, oy - 6, 16, '#c8b0ff'); AU.sfx('pouf'); AU.sfx('magic'); if (G.net) Net.send({ t: 'pouf', x: Math.round(ox), y: Math.round(oy) });
      const st = s.stand[0]; P.x = st[0] * 16 + 8; P.y = st[1] * 16 + 12; P.busy = null;
      P.hidden = s; P.hideFrom = [P.x, P.y]; puff(s.x * 16 + 8, s.y * 16 + 8, 16, '#c8b0ff');
      if (T.state === 'chase') { T.lastSeen = [ox, oy]; T.goingLast = false; T.goingSpot = false; T.path = null; }
      T.knows = null; T.detect = Math.min(T.detect, 0.5);
      toast('🧞 Pouf ! Le génie te planque ' + s.n + '.', 2.2);
      break;
    }
    case 'slipper': P.slip = 10; hop(P, 90); AU.sfx('magic'); sparkle(P.x, P.y - 6, 14, '#bfefff'); toast('👠 Rapide et silencieux·se : 10 s. Fonce !', 2); break;
    case 'apple':
      if (P.hidden) { toast('Sors d’abord de ta cachette.', 1.4); used = false; break; }
      { const ap = { id: (G.appleId = (G.appleId || 0) + 1) + (G.net && Net.isHost ? 0 : 1000), x: P.x, y: P.y + 2, eaten: false }; G.apples.push(ap); if (G.net) Net.send({ t: 'apple', id: ap.id, x: Math.round(ap.x), y: Math.round(ap.y) }); } AU.sfx('blip'); toast('🍎 Pomme posée. Les profs adorent les pommes. Trop.', 2);
      break;
    case 'disguise': {
      if (P.hidden) { toast('Sors d’abord de ta cachette.', 1.4); used = false; break; }
      const src = G.kids.length ? pick(G.kids).cfg : randomChar('');
      if (!P.disguised) P.cfgOrig = P.cfg;
      const nc = Object.assign({}, src, { name: P.cfg.name }); P.cfg = nc; P.disguised = true; P.disguiseT = DISGUISE_T; P.spin = 0.7;
      puff(P.x, P.y - 10, 20, '#ffffff'); sparkle(P.x, P.y - 12, 16); AU.sfx('pouf'); AU.sfx('magic'); cue(P.x, P.y - 40, 'word', 'TADAAA !', { col: '#ffd23f', pop: true });
      if (G.net) Net.send({ t: 'disguise', cfg: nc }); else if (!G.T.seeNow) { G.T.knows = null; G.T.detect = 0; }
      toast('🥸 Déguisé·e pour 15 s ! ' + (G.kids.length ? 'Personne ne te reconnaît. Normalement.' : 'Le prof n’y verra que du feu.'), 2.4);
      break;
    }
    case 'mirror': G.reveal = 8; FX.flash = 0.7; FX.flashCol = '220,240,255'; AU.sfx('magic'); toast('🪞 Miroir : prof et sorties révélés !', 2); break;
    case 'squishy': { const q = SQUISHIES[squishyAt(P, i)] || SQUISHIES[0]; toast('🧸 « ' + q.n + ' » : il sort tout seul si on t’attrape.', 2.2); used = false; break; }
    case 'watch': G.slowT = 8; if (G.net) Net.send({ t: 'slow', d: 8 }); FX.flash = 0.6; FX.flashCol = '140,190,255'; AU.sfx('slow'); toast('⏱️ Prof en mode escargot !', 2); break;
  }
  if (used) P.inv.splice(i, 1);
}
// ---------- Fin de niveau ----------
function escape(ex, tx, ty, fromNet) {
  if (G.mode !== 'play') return;
  if (G.inf && G.inf.coop) { coopEscape(ex, tx, ty); return; }
  if (G.net && G.net.cc) { if (!fromNet) ccEscape(ex, tx, ty); return; }
  if (G.net && G.net.role === 'student' && !fromNet) Net.send({ t: 'escape', e: G.L.exits.indexOf(ex), x: tx, y: ty });
  const P = G.P; if (P.hidden) unhide(); P.busy = null;
  G.mode = 'escape'; G.escT = 0; G.escFrom = [P.x, P.y]; G.escTo = [tx * 16 + 8, ty * 16 + 12];
  AU.sfx('win'); AU.play('win'); confetti(P.x, P.y - 10, 50); hop(P, 150); P.spin = 0.9; FX.winA = 0; FX.punch(0.1);
}
function caught(reason, fromNet) {
  if (G.mode !== 'play') return;
  if (G.net && G.net.cg && !Net.isHost) return;   // surveillants à deux : c'est l'hôte qui vérifie
  if (G.net && G.net.solo) { Solo.caught(reason); return; }
  if (G.net && G.net.cc) { if (!fromNet) ccCaught(G.P, reason); return; }
  if (G.inf && G.inf.coop && !fromNet) { coopCaught(G.P, reason); return; }
  const P = G.P, T = G.T;
  // un squishy dans le sac : seconde chance, il explose à la figure du prof
  if (!G.net && squishyCount(P) > 0 && squishySave(T, P)) return;
  // le compagnon fait fuir le prof (3 fois)
  if (!G.net && P.pet && P.pet.charges > 0 && P.pet.leaveT == null) { petScare(T, P); return; }
  // Miss Teacup / M. Silex : une leçon au lieu de l'heure de colle (3 fois maximum)
  if (!G.net && T.prof && T.prof.lesson && (G.lessons || 0) < LESSON_MAX) { lessonStart(reason); return; }
  if (P.hidden) { const s = P.hidden; P.hidden = null; if (s.k === K.DOOR) { const d = doorAt(s.x, s.y); if (d) d.hideP = false; } const st = s.stand[0]; P.x = st[0] * 16 + 8; P.y = st[1] * 16 + 12; puff(s.x * 16 + 8, s.y * 16 + 8, 12); }
  P.busy = null; G.mode = 'caught'; G.caughtT = 0; T.state = 'caught'; T.moving = false; setMark(T, '!', 3);
  T.bubble = { text: reason === 'found' ? 'TROUVÉ ! Heure de colle !' : 'ATTRAPÉ ! Heure de colle !', t: 0, dur: 3 };
  AU.say(reason === 'found' ? 'Trouvé ! Heure de colle !' : 'Attrapé ! Heure de colle !', T.prof, 1);
  AU.sfx('caught'); AU.play(null); G.shake = 0.5; P.face = 0;
  FX.comic = { t: 0, text: reason === 'found' ? 'TROUVÉ !' : 'ATTRAPÉ !' }; FX.freeze = 0.22; FX.punch(0.22); FX.flash = 1; FX.flashCol = '255,255,255'; P.caught = true; hop(P, 80);
  const mx = (P.x + T.x) / 2, my = (P.y + T.y) / 2 - 10; puff(mx, my, 22, '#ffffff'); for (let i = 0; i < 8; i++) part(mx, my, 'star', { vx: rand(-60, 60), vy: rand(-70, 10), g: 80, life: 1, col: pick(['#ffd23f', '#ffffff', '#ff6f91']) });
  T.ang = Math.atan2(P.y - T.y, P.x - T.x); T.face = faceFromAng(T.ang);
}
function update(dt) {
  G.msgCD -= dt;
  if (G.shake > 0) G.shake -= dt;
  if (G.mode === 'play') {
    if (FX.freeze > 0) { FX.freeze -= dt; return; }
    G.time += dt;
    if (G.reveal > 0) G.reveal -= dt;
    if (G.slowT > 0) { G.slowT -= dt; if (G.slowT <= 0) toast('Le prof a retrouvé ses jambes.', 1.4); }
    if (G.net) { netUpdate(dt); if (G.mode !== 'play') return; }
    else {
    updatePlayer(dt); if (G.mode !== 'play') return;
    updateTeacher(dt); updateKids(dt); if (G.cls) classUpdate(dt); if (G.power) powerUpdate(dt); updateDoors(dt); petFollow(G.P, dt);
    if (G.inf) { infUpdate(dt); if (G.mode !== 'play') return; }
    // cœur qui bat
    const d = dist(G.T.x, G.T.y, G.P.x, G.P.y) / 16;
    G.heartT -= dt;
    if (d < 7 && G.T.state !== 'sleep') { if (G.heartT <= 0) { G.heartT = 0.35 + d * 0.11; AU.sfx('heart', clamp(1 - d / 7, 0.15, 1) * (G.T.state === 'chase' ? 1 : 0.6)); UI.heart(); } }
    if (AU.songName === 'chase' && G.T.state !== 'chase' && G.T.state !== 'edge' && !['tired'].includes(G.T.state)) AU.play('sneak');
    if (AU.songName == null || AU.songName === 'menu') AU.play('sneak');
    }
    if (G.mode === 'play') { npcChatter(dt); cuteTick(dt); lifeFootBall(dt); gagsUpdate(dt); digUpdate(dt); RPS.tick(dt); }
  } else if (G.mode === 'escape') {
    G.escT += dt; const P = G.P, t = Math.min(1, G.escT / 0.8);
    const ex0 = P.x, ey0 = P.y; P.x = lerp(G.escFrom[0], G.escTo[0], t); P.y = lerp(G.escFrom[1], G.escTo[1], t); P.moving = t < 1; P.running = true; P.dist = (P.dist || 0) + Math.hypot(P.x - ex0, P.y - ey0) + dt * 30; P.skidT = 0;
    if (Math.random() < dt * 8) sparkle(P.x, P.y - 8, 2);
    updateDoors(dt); if (!G.net || Net.isHost) updateKids(dt);
    if (G.escT > 0.85 && !FX.iris) FX.iris = { mode: 'out', t: 0, dur: 0.7, wx: G.escTo[0], wy: G.escTo[1] - 8 };
    if (G.escT > 1.9) { G.mode = 'result'; if (G.net) Multi.result('escaped'); else UI.result(true); }
  } else if (G.mode === 'caught') {
    if (FX.freeze > 0) { FX.freeze -= dt; return; }
    G.caughtT += dt; const T = G.T; if (T.bubble) T.bubble.t = Math.min(T.bubble.t + dt, 1);
    G.P.dist = (G.P.dist || 0) + dt * 90; G.P.moving = true; G.P.running = true; G.P.skidT = 0; G.P.hz = Math.max(G.P.hz || 0, 4 + Math.sin(G.caughtT * 18) * 1.5);
    if (Math.random() < dt * 6) puff((G.P.x + T.x) / 2 + rand(-10, 10), (G.P.y + T.y) / 2 - rand(4, 20), 2, '#ffffff');
    if (G.caughtT > 1.5 && !FX.iris) FX.iris = { mode: 'out', t: 0, dur: 0.6, wx: (G.P.x + T.x) / 2, wy: (G.P.y + T.y) / 2 - 12 };
    if (G.caughtT > 2.2) { G.mode = 'result'; if (G.net) Multi.result('caught'); else UI.result(false); }
  } else if (G.mode === 'timeup') {
    G.caughtT += dt;
    if (G.caughtT > 1.4 && !FX.iris) FX.iris = { mode: 'out', t: 0, dur: 0.6 };
    if (G.caughtT > 2.1) { if (G.net && G.net.solo) Solo.end('time'); else { G.mode = 'result'; Multi.result('time'); } }
  }
  // indices & particules
  for (let i = G.cues.length - 1; i >= 0; i--) { const c = G.cues[i]; c.t += dt; if (c.t > c.life) G.cues.splice(i, 1); }
  for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96; if (p.type === 'puff') p.vy *= 0.94; if (p.t > p.life) G.parts.splice(i, 1); }
  G.L && G.L.hides.forEach(s => { if (s.shake > 0) s.shake -= dt; });
  if (G.P) {
    animStep(G.P, dt); animStep(G.T, dt); G.kids.forEach(k => animStep(k, dt));
    gaitFx(G.T, G.tVis); G.kids.forEach(k => gaitFx(k, k.vis)); if (G.net && G.net.role === 'teacher') gaitFx(G.P, G.pVis);
    if (G.T.flashT > 0) G.T.flashT -= dt; G.T.markA = (G.T.markA || 0) + dt;
    if (G.mode === 'play') updatePigeons(dt);
    updateAmbient(dt);
  }
  // visibilité du joueur
  if (G.P) {
    const P = G.P;
    const T = G.T;
    if (G.net && G.net.role === 'teacher') {
      const pr = T.prof, R = Math.max(7.5, pr.range) * 16, fov = Math.max(1.0, pr.fov);
      const blind = isBlind(T); G.eye = [T.x, sightY(T.x, T.y - 12)]; G.visR = T.state === 'count' || blind ? 0 : R; G.tVis = true; G.visCone = false;
      let vis = false;
      if (!P.hidden && !P.under && T.state !== 'count' && !blind) {
        const px = P.x, py = P.y - (P.small > 0 ? 3 : 7), d = Math.hypot(px - G.eye[0], py - G.eye[1]);
        if (d < R * (P.small > 0 ? 0.6 : 1)) { let inC = d < 28; if (!inC) inC = Math.abs(angDiff(Math.atan2(py - G.eye[1], px - G.eye[0]), T.ang)) < fov; if (inC && los(G.eye[0], G.eye[1], px, py)) vis = true; }
      }
      G.pVis = vis || (G.mode !== 'play' && G.mode !== 'paused');
      G.kids.forEach(k => { const d = Math.hypot(k.x - G.eye[0], k.y - 10 - G.eye[1]); let v = false; if (T.state !== 'count' && !blind && d < R) { let inC = d < 28; if (!inC) inC = Math.abs(angDiff(Math.atan2(k.y - 10 - G.eye[1], k.x - G.eye[0]), T.ang)) < fov; v = inC && los(G.eye[0], G.eye[1], k.x, k.y - 10); } k.vis = v; });
    } else {
    // l'élève voit pièce par pièce (plus de cône de vision)
    G.pVis = true; G.visCone = false; G.visR = 9999;
    G.eye = P.hidden ? [P.hidden.x * 16 + 8, P.hidden.y * 16 + 8] : playerEye(P);
    roomVisUpdate(dt, P);
    G.tVis = !T.gone && regionVisible(T.x, T.y);
    G.kids.forEach(k => k.vis = !k.gone && regionVisible(k.x, k.y));
    }
  }
}
