// ================= DES CLASSES PLEINES DE VIE =================
// Des profs qui font cours (et qui préviennent le prof qui te cherche s'ils te voient),
// des élèves assis à leur table, et de temps en temps un élève qui balance…
const CLASS_NAMES = ['M. Dupont', 'Mme Bidule', 'M. Truc', 'Mme Machin', 'M. Moustache', 'Mme Ratatouille', 'M. Croquette', 'Mme Pantoufle', 'M. Gratin', 'Mme Biscotte', 'M. Cornichon', 'Mme Praline'];
const CT_SEEN = ['Hé ! Tu n’es pas dans ma classe, toi !', 'Mais qu’est-ce que tu fais là ?!', 'On ne se promène pas pendant les cours !', 'Halte-là ! Où vas-tu comme ça ?'];
const CT_CALL = n => pick(['Collègue ! Un élève par ici !', n + ' ! Il y a quelqu’un qui se sauve !', 'Je préviens ' + n + ', tu vas voir !']);
const SN_LINES = n => pick([n + ' ! Y a quelqu’un qui s’échappe !', 'Je vais le dire ! ' + n + ' !', 'Hé ! Elle est là ! Enfin… il est là !', 'MADAME ! MONSIEUR ! Par ici !', 'Je balance pas, mais… ' + n + ', c’est par là !']);
const CT_OFFICE = ['Hé ! Qu’est-ce que tu fais ici, toi ?', 'Les élèves n’ont rien à faire ici !', 'Tiens tiens… on se promène ?'];
const CT_CHALK = ['scritch', 'tac tac', 'scrrr'];
function classRect(m, r) { return { x: r.x, y: r.y, w: r.w, h: r.h, name: r.name }; }
function classSetup() {
  G.cls = null;
  const L = G.L, m = G.m; if (G.net || G.inf || !m) return;
  const P = G.P, T = G.T;
  const [sx, sy] = [L.start[0], L.start[1]], [tx, ty] = tileOf(T);
  const startRoom = m.roomAt(sx, sy), tRoom = m.roomAt(tx, ty);
  const seen = new Set(), rooms = [];
  for (const r of m.rooms) {
    if (!r.name || seen.has(r.name) || /Couloir|Cour|Préau|Terrain|Aire|Toilettes|Douches/.test(r.name)) continue;
    seen.add(r.name);
    const seats = classSeats(m, r).filter(([x, y]) => m.roomAt(x, y) === r.name);
    if (seats.length < 3 || r.name === startRoom || r.name === tRoom) continue;
    rooms.push({ r, seats });
  }
  const C = G.cls = { teachers: [], snitches: [], callT: 0 };
  const names = shuffle(CLASS_NAMES.slice()); let ni = 0;
  const taskRoom = rr => G.tasks.some(t => t.x >= rr.x && t.y >= rr.y && t.x < rr.x + rr.w && t.y < rr.y + rr.h);
  // de préférence les classes sans tâche (on n'y est pas obligé·e), mais pas toujours
  shuffle(rooms).sort((a, b) => (taskRoom(a.r) ? 1 : 0) - (taskRoom(b.r) ? 1 : 0));
  const nCls = Math.min(4, Math.max(rooms.length ? 1 : 0, Math.round(rooms.length * 0.65)));
  rooms.slice(0, nCls).forEach(({ r, seats }) => {
    // le prof devant le tableau
    const cx = r.x + (r.w >> 1); let home = null, bd = 1e9;
    for (let y = r.y; y < r.y + Math.min(3, r.h); y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR && m.roomAt(x, y) === r.name) { const d = Math.abs(x - cx) + (y - r.y) * 1.5; if (d < bd) { bd = d; home = [x, y]; } }
    if (!home) return;
    const pts = []; for (let y = r.y + 1; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR && m.roomAt(x, y) === r.name && (x === r.x || x === r.x + r.w - 1 || (y - r.y) % 2 === 0)) pts.push([x, y]);
    const name = names[ni++ % names.length], cfg = randomChar(name); cfg.name = name;
    const w = { cfg, v: { adult: true }, name, x: home[0] * 16 + 8, y: home[1] * 16 + 12, ang: Math.PI / 2, face: 0, anim: 0, moving: false, path: null, pi: 0,
      beh: 'cteach', state: 'teach', st: rand(2, 6), home, homeAng: Math.PI / 2, room: classRect(m, r), pts: pts.length ? pts : [home], prof: { range: 5.4, fov: 0.78 }, detect: 0,
      isWatcher: true, isKid: true, ph: Math.random() * 6, walkP: 0.4, boardP: 0.35, cool: 0, voice: { pitch: 0.8 + Math.random() * 0.6, rate: 1 + Math.random() * 0.2 } };
    G.kids.push(w); C.teachers.push(w);
    shuffle(seats.slice()).slice(0, Math.max(2, Math.round(seats.length * 0.75))).forEach(([x, y]) => {
      if (Math.abs(x - P.x / 16) + Math.abs(y - P.y / 16) < 3) return;
      G.kids.push({ cfg: randomChar(), x: x * 16 + 8, y: y * 16 + 13, ang: -Math.PI / 2, face: 1, anim: 0, moving: false, path: null, pi: 0, beh: 'sit', st: 0, ph: Math.random() * 6, isKid: true, inClass: true });
    });
  });
  // les bureaux : un adulte qui travaille (secrétaire, CPE…) et qui lève parfois les yeux
  const used = new Set(C.teachers.map(t => t.room.name)); let nOff = 0;
  for (const r of shuffle(m.rooms.slice())) {
    if (nOff >= 2) break;
    if (!r.name || used.has(r.name) || r.name === startRoom || r.name === tRoom || /Couloir|Cour|Préau|Terrain|Aire|Toilettes|Douches|Vestiaire|Escalier|Palier|Hall/.test(r.name)) continue;
    let home = null, ang = Math.PI / 2;
    for (let y = r.y; y < r.y + r.h && !home; y++) for (let x = r.x; x < r.x + r.w && !home; x++) {
      if (m.get(x, y) !== K.DESK || m.roomAt(x, y) !== r.name) continue;
      if (m.get(x, y - 1) === K.FLOOR && m.roomAt(x, y - 1) === r.name) { home = [x, y - 1]; ang = Math.PI / 2; }
      else if (m.get(x, y + 1) === K.FLOOR && m.roomAt(x, y + 1) === r.name) { home = [x, y + 1]; ang = -Math.PI / 2; }
    }
    if (!home || Math.abs(home[0] - sx) + Math.abs(home[1] - sy) < 6) continue;
    used.add(r.name); nOff++;
    const pts = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR && m.roomAt(x, y) === r.name) pts.push([x, y]);
    const name = names[ni++ % names.length], cfg = randomChar(name); cfg.name = name;
    const w = { cfg, v: { adult: true }, name, x: home[0] * 16 + 8, y: home[1] * 16 + 12, ang, face: faceFromAng(ang), anim: 0, moving: false, path: null, pi: 0,
      beh: 'cteach', state: 'teach', st: rand(3, 7), home, homeAng: ang, room: classRect(m, r), pts: shuffle(pts).slice(0, 8), prof: { range: 4.6, fov: 0.75 }, detect: 0, office: true,
      isWatcher: true, isKid: true, ph: Math.random() * 6, walkP: 0.3, boardP: 0, cool: 0, voice: { pitch: 0.8 + Math.random() * 0.6, rate: 1 + Math.random() * 0.2 } };
    G.kids.push(w); C.teachers.push(w);
  }
  // des élèves assis sur les bancs, canapés et gradins (salle d'attente, vestiaires, gymnase…)
  if (!L.outdoor) {
    const seatsB = [];
    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
      const k = m.get(x, y); if (k !== K.BENCH && k !== K.SOFA && k !== K.BLEACH) continue;
      const rn = m.roomAt(x, y); if (!rn || rn === startRoom || /Couloir/.test(rn)) continue;
      if (Math.abs(x - sx) + Math.abs(y - sy) < 5 || G.kids.some(o => Math.abs(o.x - x * 16 - 8) < 12 && Math.abs(o.y - y * 16 - 13) < 8)) continue;
      seatsB.push([x, y]);
    }
    shuffle(seatsB).slice(0, Math.min(5, Math.ceil(seatsB.length * 0.4))).forEach(([x, y]) => G.kids.push({ cfg: randomChar(), x: x * 16 + 8, y: y * 16 + 13, ang: Math.PI / 2, face: 0, anim: 0, moving: false, path: null, pi: 0, beh: 'bench', st: 0, ph: Math.random() * 6, isKid: true, noDoor: true }));
    // au gymnase : des élèves qui sautent à la corde
    const gym = m.rooms.find(r => /Gymnase/.test(r.name));
    if (gym) {
      const fl = []; for (let y = gym.y + 2; y < gym.y + gym.h - 2; y++) for (let x = gym.x + 2; x < gym.x + gym.w - 2; x++) if (m.get(x, y) === K.FLOOR && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => m.get(x + dx, y + dy) === K.FLOOR)) fl.push([x, y]);
      shuffle(fl).filter((s, i, a) => a.slice(0, i).every(o => Math.abs(o[0] - s[0]) + Math.abs(o[1] - s[1]) > 3)).slice(0, 3).forEach(([x, y]) => G.kids.push({ cfg: randomChar(), x: x * 16 + 8, y: y * 16 + 12, ang: Math.PI / 2, face: 0, anim: 0, moving: false, path: null, pi: 0, beh: 'jump', st: 0, ph: Math.random() * 6, isKid: true }));
    }
  }
  // 1 élève qui balance (2 dans les grands niveaux), choisi parmi les élèves qui ne font pas de foot
  const pool = G.kids.filter(k => !k.isWatcher && k.beh !== 'foot' && k.beh !== 'jump' && k.beh !== 'robot' && !k.noSnitch);
  const nSn = !pool.length ? 0 : G.lvl === 0 ? (Math.random() < 0.6 ? 1 : 0) : pool.length >= 12 ? 2 : 1;
  shuffle(pool).slice(0, nSn).forEach(k => { k.snitch = true; k.snT = 0; k.snCool = rand(4, 10); C.snitches.push(k); });
}
// le prof qui te cherche est prévenu : il vient voir
function callTeacher(x, y, by) {
  const T = G.T; if (!T || T.gone || G.mode !== 'play') return false;
  if (!['patrol', 'look', 'search', 'check', 'investigate', 'alert'].includes(T.state)) return false;
  T.lastSeen = [x, y]; setMark(T, '!', 1.4); T.heardT = G.time;
  say(pick(['J’arrive ! Personne ne bouge !', 'Où ça ? J’arrive !', 'Merci, j’y vais !', 'Ah ah, je te tiens !']));
  T.state = 'investigate'; const [tx, ty] = tileXY(x, y); if (!goTo(T, tx, ty)) { T.state = 'look'; T.st = 1; T.lookBase = T.ang; }
  AU.sfx('spot', 0.45); UI.hudSig = null;
  return true;
}
function classSees(k, range, fov, P = G.P) {
  if (P.hidden || P.out || P.under || G.mode !== 'play' || G.dark) return 0;
  const ex = k.x, ey = k.y - 12, px = P.x, py = P.y - (P.small > 0 ? 3 : 7), d = Math.hypot(px - ex, py - ey), R = range * 16 * (P.small > 0 ? 0.55 : 1);
  if (d > R) return 0;
  const inCone = d < 20 || fov >= 3.1 || Math.abs(angDiff(Math.atan2(py - ey, px - ex), k.ang)) < fov;
  if (!inCone || !los(ex, ey, px, py)) return 0;
  return d;
}
function classTeacher(k, dt) {
  const P = G.P;
  if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; }
  if (k.markT > 0) k.markT -= dt;
  if (k.cool > 0) k.cool -= dt;
  const atHome = () => Math.abs(k.x - (k.home[0] * 16 + 8)) < 3 && Math.abs(k.y - (k.home[1] * 16 + 12)) < 3;
  const turn = a => { k.ang += angDiff(a, k.ang) * Math.min(1, dt * 8); k.face = faceFromAng(k.ang); };
  switch (k.state) {
    case 'warn': { const W = k.warnWho || P; k.moving = false; turn(Math.atan2(W.y - k.y, W.x - k.x)); } k.st -= dt; if (k.st <= 0) { k.state = 'teach'; k.st = rand(2, 4); } break;
    case 'dark': {
      // noir complet : il cherche l'interrupteur à tâtons
      k.st -= dt; k.ang += dt * 1.4; k.face = faceFromAng(k.ang); k.moving = false;
      if (!G.dark) { k.state = 'teach'; k.st = rand(1, 3); }
      break;
    }
    case 'teach':
      if (!atHome()) { if (goTo(k, k.home[0], k.home[1])) { k.state = 'walk'; k.next = 'teach'; } else { k.x = k.home[0] * 16 + 8; k.y = k.home[1] * 16 + 12; } break; }
      k.moving = false; k.ang = k.homeAng + Math.sin(G.time * 0.7 + k.ph) * 0.55; k.face = faceFromAng(k.ang); k.st -= dt;
      if (k.st <= 0) {
        const r = Math.random();
        if (r < k.boardP) { k.state = 'board'; k.st = rand(3, 6.5); }
        else if (r < k.boardP + k.walkP) { const p = pick(k.pts); if (goTo(k, p[0], p[1])) { k.state = 'walk'; k.next = 'look'; } else k.st = 1; }
        else { k.state = 'look'; k.st = rand(1.5, 3); k.lookBase = k.ang; }
      }
      break;
    case 'board':
      k.moving = false; k.ang = -Math.PI / 2; k.face = 1; k.st -= dt;
      if (Math.random() < dt * 0.8 && dist(k.x, k.y, P.x, P.y) < 8 * 16) cue(k.x + rand(-6, 6), k.y - 30, 'word', pick(CT_CHALK), { col: '#ffffff', life: 0.8 });
      if (k.st <= 0) { k.state = 'teach'; k.st = rand(3, 7); k.ang = k.homeAng; }
      break;
    case 'walk': {
      const r = followPath(k, 1.2 * 16 * (G.slowT > 0 ? 0.4 : 1), dt);
      if (r === 'done' || !k.path) { k.state = k.next || 'look'; k.st = rand(1.2, 2.6); k.lookBase = k.ang; k.path = null; }
      break;
    }
    case 'look':
      k.moving = false; k.ang = k.lookBase + Math.sin(G.time * 2 + k.ph) * 1.1; k.face = faceFromAng(k.ang); k.st -= dt;
      if (k.st <= 0) { if (goTo(k, k.home[0], k.home[1])) { k.state = 'walk'; k.next = 'teach'; } else k.state = 'teach'; }
      break;
  }
  if (G.dark) { if (k.state !== 'dark') { k.state = 'dark'; k.path = null; k.st = 0; if (dist(k.x, k.y, P.x, P.y) < 12 * 16) infSay(k, pick(['Hé ! Qui a éteint la lumière ?!', 'Restez assis ! Personne ne bouge !', 'Mais… on n’y voit rien !']), 2); } k.detect = 0; return; }
  // vision : un prof qui fait cours voit ce qui se passe dans sa classe (et un peu par la porte)
  // (à deux : il surveille les deux élèves)
  let d = 0, W = P; if (k.cool <= 0) for (const t of classTargets()) { const dd = classSees(k, k.prof.range, k.prof.fov, t); if (dd && (!d || dd < d)) { d = dd; W = t; } }
  if (d) {
    const rate = (d < 36 ? 4.5 : 1 + 1.9 * (1 - d / (k.prof.range * 16))) * (W.running ? 1.5 : 1) * (W.disguised ? 0.3 : 1);
    const was = k.detect; k.detect = Math.min(1.2, k.detect + rate * dt);
    if (was < 0.3 && k.detect >= 0.3) { teamMark(k, '?', 0.8); if (k.state === 'board' || k.state === 'teach') { k.state = 'look'; k.st = 1.4; k.lookBase = Math.atan2(W.y - k.y, W.x - k.x); } }
    if (k.detect >= 1) {
      k.detect = 0; k.cool = 12; k.state = 'warn'; k.st = 2.4; k.path = null; k.warnWho = W; teamMark(k, '!', 1.4);
      const T = G.T, n = T.prof.name;
      infSay(k, (k.office ? pick(CT_OFFICE) : pick(CT_SEEN)) + ' ' + CT_CALL(n), 3);
      if (callTeacher(W.x, W.y, k)) ccTell(W, '📣 ' + k.name + ' t’a vu·e et prévient ' + n + ' ! Bouge de là !', 2.6);
      G.shake = Math.max(G.shake, 0.12);
    }
  } else k.detect = Math.max(0, k.detect - dt * 0.5);
}
// les élèves qui balancent : un « ! » au-dessus de la tête… et s'ils te voient encore une seconde, ils crient
function classSnitch(k, dt) {
  if (k.markT > 0) k.markT -= dt;
  if (k.snCool > 0) { k.snCool -= dt; k.snT = 0; return; }
  let d = 0, P = G.P; for (const t of classTargets()) { const dd = !t.disguised ? classSees(k, 4.5, k.beh === 'sit' || k.beh === 'bench' ? 3.2 : 1.4, t) : 0; if (dd && (!d || dd < d)) { d = dd; P = t; } }
  if (!d) { k.snT = Math.max(0, k.snT - dt * 0.8); return; }
  const was = k.snT; k.snT += dt * (P.running ? 1.4 : 1);
  if (was < 0.3 && k.snT >= 0.3) { teamMark(k, '!', 1.2); if (k.path) { k.path = null; k.moving = false; } k.face = faceFromAng(Math.atan2(P.y - k.y, P.x - k.x)); }
  if (k.snT >= 1.3) {
    k.snT = 0; k.snCool = 25; const n = G.T.prof.name;
    infSay(k, SN_LINES(n), 2.6); teamMark(k, '!', 1.6); hop(k, 90);
    if (callTeacher(P.x, P.y, k)) ccTell(P, '🙊 Un élève t’a balancé·e ! ' + n + ' arrive…', 2.6);
  }
}
function classUpdate(dt) {
  const C = G.cls; if (!C) return;
  C.snitches.forEach(k => { if (!k.gone) classSnitch(k, dt); });
}
