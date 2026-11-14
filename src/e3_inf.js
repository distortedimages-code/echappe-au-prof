// ================= MODE INFILTRATION : « La grande évasion » =================
// Plusieurs étages, une salle de classe de départ, des profs dans les classes,
// un surveillant par étage, des avertissements, l'alarme incendie, la serrure…
const INF_TOP = 3;
const INF_MAITRESSES = ['Mme Lafleur', 'Mme Tartine', 'Mme Bonbon', 'Mme Pistache', 'Mme Crayon', 'Mme Gribouille'];
const INF_PROFS = ['M. Dupont', 'Mme Bidule', 'M. Truc', 'Mme Machin', 'M. Moustache', 'Mme Ratatouille', 'M. Croquette', 'Mme Pantoufle', 'M. Gratin', 'Mme Biscotte', 'M. Cornichon', 'Mme Praline'];
const INF_LINES = {
  warn: ['{n} ! Qu’est-ce que tu fais là ?! Retourne en classe !', 'Hé toi ! File dans ta classe, {n} !', 'On ne se promène pas pendant les cours, {n} !', '{n} ! En classe, et que ça saute !', 'Tu as un mot d’excuse, {n} ? Non ? ALORS EN CLASSE !'],
  seat: ['{n}, retourne à ta place !', 'Assis, {n} ! Tout de suite !', '{n} ! On ne se lève pas sans permission !', '{n}, je t’ai vu·e ! À ta place !'],
  call: ['SURVEILLANT ! {n} se promène dans les couloirs !', 'Au secours ! Un élève en fuite !', 'Là ! Attrapez {n} !', 'ÇA SUFFIT ! Surveillant, venez vite !'],
  evac: ['Allez, on descend dans le calme !', 'Tout le monde dans la cour !', 'On ne court pas dans les escaliers !'],
  crowd: ['{n} ! Reviens dans le rang !', 'On reste au point de rassemblement, {n} !', 'Où tu vas comme ça, {n} ?!']
};
const nameLine = s => s.replace(/\{n\}/g, (G.P && G.P.cfg && G.P.cfg.name) || 'toi');
const inRectT = (a, r, pad = 0) => { const [x, y] = tileOf(a); return x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad; };

function newTeacher(pr, L) {
  return { prof: pr, isTeacher: true, x: L.tStart[0] * 16 + 8, y: L.tStart[1] * 16 + 12, ang: -Math.PI / 2, face: 1, moving: false, anim: 0, state: 'count', st: 3.3, path: null, pi: 0, goal: null, detect: 0, lastSeen: null, searchQ: [], searchI: 0, knows: null, keyDoor: null, resume: null, hasKeys: false, bubble: null, mark: null, markT: 0, stepT: 0, stepSide: 0, chatT: rand(5, 9), lastSpotT: -99, heardT: -99, chaseT: 0, lostT: 0, repathT: 0, seeNow: false, after: null, lookBase: -Math.PI / 2, apple: null, countN: 0 };
}
// le prof de l'étage, version infiltration (pas d'interphone, répliques adaptées)
function infProf(i) {
  const p = PROFS[i];
  return Object.assign({}, p, {
    intercom: false, hasKeys: false,
    lines: Object.assign({}, p.lines, { spot: ['TOI ! Reviens ici, {n} !', 'Cette fois, je t’attrape, {n} !', 'Trois avertissements, ça suffit !'], start: '' })
  });
}
// qui descend par où : escaliers alternés pour obliger à traverser chaque étage
function infStairsOf(I, f) {
  const out = {};
  ['A', 'B'].forEach(s => {
    out[s] = { down: f > 0 && I.downVia[f] === s, up: f < INF_TOP && I.downVia[f + 1] === s, locked: f === 1 && I.downVia[1] === s };
  });
  return out;
}

// ---------- création de la partie ----------
function infStart(cfg, seed, mopt) {
  if (seed == null) seed = newSeed();
  const R = mkRng(seed ^ 0x51ed), multi = !!mopt;
  const I = { seed, multi, role: mopt ? mopt.role : 'student', ping: null, floors: [], cur: INF_TOP, startFloor: INF_TOP, warn: 0, grace: 0, hunt: false, keys: false, plan: false, alarm: null, alarmUsed: false, t: 0, radio: null, chased: 0, route: '' };
  const first = R.ch(0.5) ? 'A' : 'B', other = first === 'A' ? 'B' : 'A';
  I.downVia = { 3: first, 2: other, 1: first };
  for (let f = 0; f <= INF_TOP; f++) {
    const L = buildInfFloor(f, f === INF_TOP, seed);
    const meta = INF_FLOOR_META[f];
    L.def = { prof: meta.prof, title: meta.name, place: meta.name, hints: [], inf: true };
    I.floors.push({ f, L, meta, stairs: infStairsOf(I, f) });
  }
  // trousseau : dans un bureau de prof d'un étage (pas dans la salle de départ)
  I.keysFloor = R.p([1, 2, 2, 3, 3]); const KF = I.floors[I.keysFloor].L;
  I.keysDesk = R.p(KF.desks); I.keysKey = I.keysDesk[1] * KF.m.w + I.keysDesk[0];
  // plan d'évacuation : sur le mur d'un étage (3e ou 2e)
  I.planFloor = R.p([2, 3, 3]);
  I.floors.forEach(F => { if (F.f > 0 && F.f !== I.planFloor) { F.L.m.decor = F.L.m.decor.filter(d => !(d.x === F.L.planWall[0] && d.y === F.L.planWall[1])); } else if (F.f === I.planFloor) F.L.m.dec(F.L.planWall[0], F.L.planWall[1], 'evac'); });
  // salle de départ, place de l'élève
  const SL = I.floors[INF_TOP].L, sc = SL.startCls;
  I.startRoom = { x: sc.r.x, y: sc.r.y, w: sc.r.w, h: sc.r.h };
  const seats = sc.seats.slice().sort((a, b) => b[1] - a[1]);
  I.seat = seats[Math.min(seats.length - 1, R.i(0, Math.min(4, seats.length - 1)))];
  I.maitresseName = R.p(INF_MAITRESSES);
  G.inf = I; G.net = null; G.seed = null;
  // personnages, objets, portes : un « monde » par étage
  const P = { x: I.seat[0] * 16 + 8, y: I.seat[1] * 16 + 12, face: 1, moving: false, running: false, anim: 0, small: 0, slip: 0, hidden: null, hideFrom: null, busy: null, inv: [], stepT: 0, cfg, unhideT: 0, bumpT: 0, fl: INF_TOP };
  if (multi) { const T = newTeacher(infProfMulti(), I.floors[1].L); T.state = 'free'; T.fl = 1; T.hasKeys = false; G.T = T; }
  G.P = P; G.lvl = 'inf'; G.time = 0; G.spotted = 0; G.reveal = 0; G.slowT = 0; G.shake = 0; G.found = 0; G.alarmT = 0; G.pVis = true; G.appleId = 0;
  G.tasks = []; G.tasksDone = 0; G.tasksRemote = 0; G.banner = null; G.heartT = 0; G.intercomT = 999; G.kidCueT = 3; G.smallDoorTip = false;
  const itemPlan = R.sh(['cake', 'apple', 'lamp', 'slipper', 'watch', 'mirror', 'cake', 'apple']);
  I.floors.forEach(F => infSetupFloor(F, R, itemPlan));
  if (multi && I.role === 'teacher') { I.cur = 1; I.plan = true; }
  infLoad(multi && I.role === 'teacher' ? 1 : INF_TOP, true);
  if (multi) infRepark();
  FX.reset(); G.camX = null;
  G.mode = 'intro';
}
function infSetupFloor(F, R, itemPlan) {
  const L = F.L, m = L.m, I = G.inf;
  G.L = L; G.m = m;
  G.doorIdx = new Int16Array(m.w * m.h).fill(-1);
  G.doors = m.doors.map((d, i) => { G.doorIdx[d.y * m.w + d.x] = i; return { x: d.x, y: d.y, open: 0, target: 0, closeT: 0, locked: false, byPlayer: false, hideP: false, horiz: m.get(d.x - 1, d.y) !== K.FLOOR && m.get(d.x + 1, d.y) !== K.FLOOR }; });
  G.searched = new Set(); G.apples = []; G.disguiseAt = new Set(); G.ball = null;
  if (!I.multi) { const T = newTeacher(infProf(F.meta.prof), L); T.state = 'patrol'; T.st = 0; G.T = T; }
  // objets magiques (2 par étage, posés hors de la salle de départ)
  const spots = L.itemSpots.filter(([x, y]) => !(I.startRoom && F.f === INF_TOP && x >= I.startRoom.x && y >= I.startRoom.y && x < I.startRoom.x + I.startRoom.w && y < I.startRoom.y + I.startRoom.h));
  R.sh(spots); const chosen = [];
  for (const s of spots) { if (chosen.length >= 2) break; if (chosen.every(c => Math.abs(c[0] - s[0]) + Math.abs(c[1] - s[1]) >= 8)) chosen.push(s); }
  G.items = chosen.map((s, i) => ({ id: F.f * 10 + i, x: s[0] * 16 + 8, y: s[1] * 16 + 12, kind: itemPlan[(F.f * 2 + i) % itemPlan.length], ph: Math.random() * 6 }));
  // élèves assis et profs dans les classes
  G.kids = [];
  const used = new Set(); let pi = 0;
  const profNames = R.sh(INF_PROFS.slice());
  (L.classes || []).forEach(cl => {
    const isStart = F.f === INF_TOP && cl.start;
    if (!isStart && !R.ch(0.72)) return;
    const r = cl.r;
    // le prof : devant le tableau
    const hx = r.x + (r.w >> 1) + 1, hy = r.y + 1;
    let home = [hx, hy]; if (m.get(hx, hy) !== K.FLOOR) { const c = []; for (let y = r.y; y < r.y + 3; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR) c.push([x, y]); c.sort((a, b) => Math.abs(a[0] - hx) + Math.abs(a[1] - hy) - Math.abs(b[0] - hx) - Math.abs(b[1] - hy)); if (!c.length) return; home = c[0]; }
    const pts = []; for (let y = r.y + 1; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR && (x === r.x || x === r.x + r.w - 1 || (y - r.y) % 2 === 0)) pts.push([x, y]);
    const w = infMakeWatcher(isStart ? I.maitresseName : profNames[pi++ % profNames.length], home, r, pts, R);
    if (isStart) { w.maitresse = true; w.walkP = 0.5; w.boardP = 0.3; I.maitresseCfg = w.cfg; }
    G.kids.push(w);
    cl.seats.forEach(([x, y]) => {
      if (isStart && x === I.seat[0] && y === I.seat[1]) return;
      if (!isStart && !R.ch(0.85)) return;
      G.kids.push(infMakeKid([x, y], R));
    });
  });
  // la salle des profs : un ou deux profs qui boivent leur café
  if (L.staffRoom) {
    const r = L.staffRoom, c = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR) c.push([x, y]);
    R.sh(c); const n = R.i(1, 2);
    for (let i = 0; i < n && i < c.length; i++) { const w = infMakeWatcher(profNames[pi++ % profNames.length], c[i], r, c.slice(0, 8), R); w.homeAng = R.f() * 6.28; w.walkP = 0.25; w.boardP = 0; G.kids.push(w); }
  }
  if (L.cdi) {
    const r = L.cdi, c = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR) c.push([x, y]);
    R.sh(c); if (c.length) { const w = infMakeWatcher('la documentaliste', c[0], r, c.slice(0, 10), R); w.walkP = 0.6; w.boardP = 0; G.kids.push(w); }
  }
  F.robotSpots = []; if (I.multi) infSpawnRobots(F, R);
  if (F.f === 0) { L.kidSpots = L.itemSpots.filter(([x, y]) => { const fs = m.fs[y * m.w + x]; return fs === FS.ASPHALT || fs === FS.GRASS || fs === FS.SAND; }); G.pigeons = []; spawnPigeons(); }
  else G.pigeons = [];
  G.kids.forEach(k => { k.orig = { x: k.x, y: k.y, beh: k.beh, ang: k.ang }; });
  F.mapCanvas = renderMapCanvas(L);
  F.trees = []; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.get(x, y) === K.TREE) F.trees.push([x, y]);
  infSave(F);
}
function infMakeKid([x, y], R) {
  return { cfg: randomChar('', R.f), x: x * 16 + 8, y: y * 16 + 13, ang: -Math.PI / 2, face: 1, anim: 0, moving: false, path: null, pi: 0, beh: 'sit', st: 0, ph: R.f() * 6, isKid: true };
}
function infMakeWatcher(name, home, room, pts, R) {
  const cfg = randomChar(name, R.f); cfg.name = name;
  return {
    cfg, v: { adult: true }, name, x: home[0] * 16 + 8, y: home[1] * 16 + 12, ang: Math.PI / 2, face: 0, anim: 0, moving: false, path: null, pi: 0,
    beh: 'watch', state: 'teach', st: rand(2, 6), home, homeAng: Math.PI / 2, room, pts: pts.length ? pts : [home], prof: { range: 6.2, fov: 0.85 }, detect: 0,
    isWatcher: true, ph: R.f() * 6, walkP: 0.4, boardP: 0.35, voice: { pitch: 0.8 + R.f() * 0.6, rate: 1 + R.f() * 0.2 }
  };
}
// ---------- sauvegarde / chargement d'un étage ----------
function infSave(F) {
  F = F || G.inf.floors[G.inf.cur];
  if (!G.inf.multi) F.T = G.T;
  Object.assign(F, { kids: G.kids, items: G.items, apples: G.apples, doors: G.doors, doorIdx: G.doorIdx, searched: G.searched, pigeons: G.pigeons, disguiseAt: G.disguiseAt });
}
function infLoad(f, first) {
  const I = G.inf, F = I.floors[f];
  I.cur = f; G.L = F.L; G.m = F.L.m; if (!I.multi) G.T = F.T; G.kids = F.kids; G.robotSpots = F.robotSpots; G.items = F.items; G.apples = F.apples; G.doors = F.doors; G.doorIdx = F.doorIdx;
  G.searched = F.searched; G.pigeons = F.pigeons || []; G.disguiseAt = F.disguiseAt; G.mapCanvas = F.mapCanvas; G.trees = F.trees;
  G.cues = []; G.parts = []; G.camX = null; G.ball = null;
  if (!first) { G.L.hides.forEach(s => s.shake = 0); }
}
function infGoFloor(nf, letter) {
  const I = G.inf, P = viewerA(), oldT = G.T, chased = !I.multi && oldT.state === 'chase';
  infSave();
  if (chased) { oldT.state = 'search'; oldT.searchQ = []; oldT.path = null; }
  FX.iris = { mode: 'in', t: 0, dur: 0.5 };
  infLoad(nf);
  const sp = G.L.stairs[letter]; P.x = sp[0] * 16 + 8; P.y = sp[1] * 16 + 14; P.busy = null; P.moving = false; P.fl = nf;
  if (I.multi) { infRepark(); AU.sfx('tstep'); UI.banner('📍 ' + INF_FLOOR_META[nf].name); UI.hudSig = null; return; }
  AU.sfx(nf < I.cur + 1 ? 'tstep' : 'step'); AU.sfx('door', 0.4);
  I.grace = Math.max(I.grace, 1.6);
  UI.banner('📍 ' + INF_FLOOR_META[nf].name + (nf === 0 ? ' · la cour est toute proche !' : ''));
  if (chased || I.hunt) { I.radio = { t: chased ? 2.5 : 5, x: P.x, y: P.y, from: INF_FLOOR_META[I.cur].short }; }
  UI.hudSig = null;
}
// ---------- règles : être « à sa place » ----------
function infOut(by) {
  const I = G.inf, P = G.P;
  if (I.alarm) return I.cur === 0 && !inRectT(P, I.floors[0].L.assembly);
  const inStart = I.cur === I.startFloor && inRectT(P, I.startRoom);
  if (by && by.maitresse) return !inStart || dist(P.x, P.y, I.seat[0] * 16 + 8, I.seat[1] * 16 + 12) > 26;
  return !inStart;
}
function infWarn(by) {
  const I = G.inf, P = G.P; if (I.grace > 0 || G.mode !== 'play') return;
  by.detect = 0;
  if (I.multi && (I.warn >= 3 || I.hunt)) {
    I.hunt = true; I.grace = 2.5; infSay(by, pick(INF_LINES.call), 2.4); setMark(by, '!', 1.4); hop(by, 80); AU.sfx('whistle', 0.7);
    infPing(by, true); toast('🚨 ' + by.name + ' prévient le surveillant !', 2); return;
  }
  if (I.warn >= 3 || I.hunt) {
    I.hunt = true; I.grace = 0.5;
    if (by === G.T) { enterChase(); return; }
    infSay(by, pick(INF_LINES.call), 2.4); setMark(by, '!', 1.4); hop(by, 80); AU.sfx('whistle', 0.7);
    infAlertT(P.x, P.y, true);
    return;
  }
  I.warn++; I.grace = 4.5;
  const seat = by.maitresse && I.cur === I.startFloor && inRectT(P, I.startRoom);
  const line = nameLine(pick(I.alarm ? INF_LINES.crowd : seat ? INF_LINES.seat : INF_LINES.warn)) + ' (' + I.warn + '/3)';
  if (by === G.T) { G.T.bubble = { text: line, t: 0, dur: 2.6 }; AU.say(line, G.T.prof, 0.8); G.T.state = 'warn'; G.T.st = 1.8; G.T.path = null; G.T.detect = 0; }
  else { infSay(by, line, 2.6); by.state = 'warn'; by.st = 1.8; by.path = null; }
  setMark(by, '!', 1.2); hop(by, 70); AU.sfx('whistle', 0.6); G.shake = 0.18;
  cue(by.x, by.y - 34, 'word', I.warn + '/3', { col: '#ffd23f', pop: true, life: 1.2 });
  if (I.multi) infPing(by, false);
  toast(I.warn < 3 ? '⚠️ Avertissement ' + I.warn + '/3 ! Ne te fais plus voir hors de ta classe…' : '🚨 DERNIER avertissement ! La prochaine fois, on te court après !', 2.8);
  UI.hudSig = null;
}
function infSay(k, text, dur) {
  k.bub = { text: nameLine(text), t: 0, dur: dur || 2.2 };
  const d = dist(k.x, k.y, G.P.x, G.P.y) / 16;
  if (d < 14) AU.say(k.bub.text, { voice: k.voice || { pitch: 1, rate: 1.1 } }, clamp(1.1 - d / 12, 0.15, 1));
}
// le surveillant de l'étage est prévenu : il fonce
function infAlertT(x, y, run) {
  const T = G.T; if (T.gone || T.state === 'chase' || T.state === 'evac') return;
  T.lastSeen = [x, y]; setMark(T, '!', 1.2);
  if (run) { T.state = 'chase'; T.chaseT = 0; T.repathT = 0; T.path = null; T.lostT = 0; T.lastSpotT = G.time; AU.play('chase'); say('J’arrive ! Personne ne bouge !'); }
  else { T.state = 'investigate'; const [tx, ty] = tileXY(x, y); if (!goTo(T, tx, ty)) { T.state = 'look'; T.st = 1; T.lookBase = T.ang; } }
}
// ---------- les profs dans les classes ----------
function infWatcher(k, dt) {
  const P = G.P, I = G.inf;
  if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; }
  if (k.markT > 0) k.markT -= dt;
  const atHome = () => Math.abs(k.x - (k.home[0] * 16 + 8)) < 3 && Math.abs(k.y - (k.home[1] * 16 + 12)) < 3;
  switch (k.state) {
    case 'warn':
      k.st -= dt; k.moving = false; k.ang += angDiff(Math.atan2(P.y - k.y, P.x - k.x), k.ang) * Math.min(1, dt * 8); k.face = faceFromAng(k.ang);
      if (k.st <= 0) { k.state = 'teach'; k.st = rand(2, 4); }
      break;
    case 'teach':
      if (!atHome()) { if (goTo(k, k.home[0], k.home[1])) { k.state = 'walk'; k.next = 'teach'; } else { k.x = k.home[0] * 16 + 8; k.y = k.home[1] * 16 + 12; } break; }
      k.moving = false; k.ang = k.homeAng + Math.sin(G.time * 0.7 + k.ph) * 0.55; k.face = faceFromAng(k.ang); k.st -= dt;
      if (k.st <= 0) {
        const r = Math.random();
        if (r < k.boardP) { k.state = 'board'; k.st = rand(3, 6.5); }
        else if (r < k.boardP + k.walkP) { const p = k.pts[Math.floor(Math.random() * k.pts.length)]; if (goTo(k, p[0], p[1])) { k.state = 'walk'; k.next = 'look'; } else k.st = 1; }
        else { k.state = 'look'; k.st = rand(1.5, 3); k.lookBase = k.ang; }
      }
      break;
    case 'board':
      k.moving = false; k.ang = -Math.PI / 2; k.face = 1; k.st -= dt;
      if (Math.random() < dt * 0.8 && dist(k.x, k.y, P.x, P.y) < 8 * 16) cue(k.x + rand(-6, 6), k.y - 30, 'word', pick(['scritch', 'tac tac', 'scrrr']), { col: '#ffffff', life: 0.8 });
      if (k.st <= 0) { k.state = 'teach'; k.st = rand(3, 7); k.ang = k.homeAng; }
      break;
    case 'walk': {
      const r = followPath(k, 1.25 * 16 * (G.slowT > 0 ? 0.4 : 1), dt);
      if (r === 'done' || !k.path) { k.state = k.next || 'look'; k.st = rand(1.2, 2.6); k.lookBase = k.ang; k.path = null; }
      break;
    }
    case 'look':
      k.moving = false; k.ang = k.lookBase + Math.sin(G.time * 2 + k.ph) * 1.1; k.face = faceFromAng(k.ang); k.st -= dt;
      if (k.st <= 0) { if (goTo(k, k.home[0], k.home[1])) { k.state = 'walk'; k.next = 'teach'; } else k.state = 'teach'; }
      break;
    case 'guard':
      k.moving = false; k.ang = k.homeAng + Math.sin(G.time * 0.9 + k.ph) * 0.9; k.face = faceFromAng(k.ang);
      break;
  }
  // vision
  let sees = false;
  if (!P.hidden && G.mode === 'play' && I.grace <= 0 && k.state !== 'evac' && infOut(k)) {
    const ex = k.x, ey = k.y - 12, px = P.x, py = P.y - (P.small > 0 ? 3 : 7), d = Math.hypot(px - ex, py - ey), range = k.prof.range * 16 * (P.small > 0 ? 0.55 : 1);
    if (d < range) {
      let inCone = d < 20;
      if (!inCone) inCone = Math.abs(angDiff(Math.atan2(py - ey, px - ex), k.ang)) < k.prof.fov;
      if (inCone && los(ex, ey, px, py)) sees = true;
    }
    if (sees) {
      const rate = (d < 36 ? 6 : 1.4 + 2.4 * (1 - d / range)) * (P.running ? 1.5 : 1) * (P.disguised ? 0.6 : 1);
      const was = k.detect; k.detect = Math.min(1.2, k.detect + rate * dt);
      if (was < 0.3 && k.detect >= 0.3) { setMark(k, '?', 0.7); if (k.state === 'board' || k.state === 'teach') { k.state = 'look'; k.st = 1; k.lookBase = Math.atan2(py - ey, px - ex); } }
      if (k.detect >= 1) infWarn(k);
    }
  }
  if (!sees) k.detect = Math.max(0, k.detect - dt * 0.5);
}
// ---------- élèves et profs qui évacuent ----------
function infEvacStep(k, dt) {
  if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; }
  const r = followPath(k, (k.isTeacher ? 2.2 : 2.4) * 16, dt);
  if (r === 'done' || !k.path) { k.gone = true; k.x = -9999; k.y = -9999; k.moving = false; }
}
function infNearestStair(a) {
  const st = G.L.stairs; let best = st.A, bd = 1e9;
  ['A', 'B'].forEach(s => { const d = Math.hypot(st[s][0] * 16 - a.x, st[s][1] * 16 - a.y); if (d < bd) { bd = d; best = st[s]; } });
  return best;
}
// ---------- l'alarme incendie ----------
function infAlarm() {
  const I = G.inf; if (I.alarmUsed) return; I.alarmUsed = true;
  I.alarm = { t: 0, dur: 60, call: false, sirenT: 0 };
  AU.sfx('alarm'); G.shake = 0.4; FX.punch && FX.punch(0.12);
  UI.banner('🔥 ALARME INCENDIE ! Tout le monde descend dans la cour !');
  infSave();
  I.floors.forEach(F => {
    F.kidsBak = F.kids; if (F.T) F.tBak = { x: F.T.x, y: F.T.y };
    if (F.f === 0) return;
    if (F.f === I.cur) return;
    F.kids = []; if (F.T) { F.T.gone = true; F.T.state = 'gone'; F.T.x = -9999; F.T.y = -9999; }
  });
  // étage actuel : tout le monde rejoint l'escalier le plus proche
  if (I.cur !== 0) {
    G.kids.forEach(k => { const s = infNearestStair(k); k.beh = 'evac'; k.state = 'evac'; k.bub = null; if (!goTo(k, s[0], s[1])) { k.gone = true; k.x = -9999; } });
    if (!I.multi) { const T = G.T, s = infNearestStair(T); T.state = 'evac'; T.bubble = { text: pick(INF_LINES.evac), t: 0, dur: 2 }; T.path = null; if (!goTo(T, s[0], s[1])) { T.gone = true; T.x = -9999; } }
    G.kids.filter(k => k.isWatcher).slice(0, 2).forEach(k => infSay(k, pick(INF_LINES.evac), 2));
  }
  // la cour : élèves en rangs au point de rassemblement, profs devant
  const F0 = I.floors[0], A = F0.L.assembly, crowd = [], CR = mkRng(I.seed + 77);
  for (let y = A.y + 1; y < A.y + A.h - 1; y++) for (let x = A.x + 1; x < A.x + A.w - 1; x++) if (CR.f() < 0.72) crowd.push({ cfg: randomChar('', CR.f), x: x * 16 + 8 + (CR.f() * 4 - 2), y: y * 16 + 12, ang: -Math.PI / 2, face: 1, anim: 0, moving: false, beh: 'crowd', ph: Math.random() * 6, isKid: true });
  const allW = []; I.floors.forEach(F => (F.kidsBak || []).forEach(k => { if (k.isWatcher) allW.push(k); }));
  const guards = [], gs = [[A.x - 1, A.y + 1], [A.x + A.w, A.y + 2], [A.x + 2, A.y - 1], [A.x + A.w - 3, A.y - 1], [A.x + (A.w >> 1), A.y + A.h], [A.x - 1, A.y + A.h - 2]];
  gs.forEach(([x, y], i) => {
    if (F0.L.m.get(x, y) !== K.FLOOR) return; const src = allW[i % Math.max(1, allW.length)];
    const w = infMakeWatcher(src ? src.name : pick(INF_PROFS), [x, y], A, [[x, y]], mkRng(i + 3)); if (src) w.cfg = src.cfg;
    w.state = 'guard'; w.homeAng = Math.atan2((A.y + A.h / 2) * 16 - w.y, (A.x + A.w / 2) * 16 - w.x) + Math.PI; w.prof = { range: 7, fov: 0.9 }; guards.push(w);
  });
  F0.kids = crowd.concat(guards);
  if (I.cur === 0) { G.kids = F0.kids; }
  else infSave();
  toast('🔥 Les étages se vident… mais attention : un appel aura lieu dans la cour !', 3.4);
}
function infAlarmEnd() {
  const I = G.inf, P = G.P;
  infSave();
  I.floors.forEach(F => {
    F.kids = F.kidsBak || F.kids; F.kidsBak = null;
    F.kids.forEach(k => { if (!k.orig) return; Object.assign(k, { x: k.orig.x, y: k.orig.y, beh: k.orig.beh, ang: k.orig.ang, state: k.isWatcher ? 'teach' : k.state, path: null, gone: false, moving: false, detect: 0, bub: null }); });
    const T = F.T; if (!T) return; if (T.gone || T.state === 'evac') { T.gone = false; T.x = F.tBak.x; T.y = F.tBak.y; if (T.x < 0) { T.x = F.L.tStart[0] * 16 + 8; T.y = F.L.tStart[1] * 16 + 12; } }
    T.state = I.hunt ? 'search' : 'patrol'; T.path = null; T.searchQ = []; T.detect = 0;
  });
  I.alarm = null;
  infLoad(I.cur); G.camX = G.camX;
  I.grace = Math.max(I.grace, 3);
  UI.banner('🔔 Fin de l’alerte : tout le monde remonte en classe !');
  toast(I.hunt ? '😱 Tous les profs te cherchent maintenant…' : '🤫 Profite du retour en classe pour te faufiler !', 3);
  AU.play(I.hunt ? 'chase' : 'sneak');
}
// ---------- mise à jour (appelée dans update) ----------
function infUpdate(dt) {
  const I = G.inf, P = G.P;
  I.t += dt; if (I.grace > 0) I.grace -= dt;
  if (G.T.state === 'chase') I.chased = Math.max(I.chased, 1);
  if (I.ping) I.ping.t += dt;
  const boss = !I.multi || I.role === 'student';
  // talkie-walkie entre surveillants
  if (I.radio) { I.radio.t -= dt; if (I.radio.t <= 0) { const r = I.radio; I.radio = null; if (!G.T.gone && G.T.state !== 'chase') { UI.banner('📻 Talkie : « Un élève arrive par l’escalier ! »'); infAlertT(r.x, r.y, false); } } }
  // l'alarme
  if (I.alarm) {
    const A = I.alarm; A.t += dt; A.sirenT -= dt;
    if (A.sirenT <= 0) { A.sirenT = 1.25; AU.sfx('alarm', 0.35); }
    G.alarmFlash = (G.time * 2) % 1 < 0.5;
    if (boss && !A.call && A.t > 32) {
      A.call = true;
      const ok = I.cur === 0 && inRectT(P, I.floors[0].L.assembly) && !P.hidden;
      const T0 = I.floors[0].T;
      if (I.multi) Net.send({ t: 'call', ok: ok ? 1 : 0 });
      if (ok) { UI.banner('📋 L’appel… « ' + (P.cfg.name || 'Toi') + ' ? » — « Présent·e ! »'); toast('✅ Personne ne se doute de rien !', 2.4); }
      else { I.hunt = true; I.warn = 3; UI.banner('📋 L’appel… « ' + (P.cfg.name || 'toi') + ' ? »… IL MANQUE ' + (P.cfg.name || 'UN ÉLÈVE').toUpperCase() + ' !'); toast('😱 Tu n’étais pas à l’appel : tout le collège te cherche !', 3.2); AU.sfx('spot'); if (I.cur === 0 && T0 === G.T) infAlertT(P.x, P.y, false); }
    }
    if (boss && A.t >= A.dur) { if (I.multi) Net.send({ t: 'alarmEnd' }); infAlarmEnd(); }
  } else G.alarmFlash = false;
  // élèves et profs qui évacuent : les profs aussi
  if (!I.multi && G.T.state === 'evac') {
    const T = G.T; if (T.bubble) { T.bubble.t += dt; if (T.bubble.t > T.bubble.dur) T.bubble = null; }
    const r = followPath(T, 2.2 * 16, dt); if (r === 'done' || !T.path) { T.gone = true; T.state = 'gone'; T.x = -9999; T.y = -9999; T.moving = false; }
  }
}
// ---------- actions spéciales ----------
function infActions(cand, P) {
  const I = G.inf, F = I.floors[I.cur], L = G.L, cx0 = P.x, cy0 = P.y - 6;
  const near = (pt, r) => Math.hypot(pt[0] * 16 + 8 - cx0, pt[1] * 16 + 8 - cy0) < r;
  ['A', 'B'].forEach(s => {
    const pt = L.stairs[s]; if (!near(pt, 24)) return; const st = F.stairs[s], d = 0;
    if (st.down) {
      if (st.locked && !I.keys && !I.alarm) cand.push({ id: 'stairLocked', icon: '🔒', label: 'Descendre', sub: 'grille fermée à clé', prio: 0.2, d });
      else cand.push({ id: 'stair', to: I.cur - 1, letter: s, icon: '⬇️', label: 'Descendre', sub: I.cur - 1 === 0 ? 'vers la cour' : 'au ' + INF_FLOOR_META[I.cur - 1].name, prio: 0.2, d });
    }
    if (st.up) cand.push({ id: 'stairUp', to: I.cur + 1, letter: s, icon: '⬆️', label: 'Monter', sub: 'au ' + INF_FLOOR_META[I.cur + 1].name, prio: 0.3, d });
    if (!st.down && !st.up) cand.push({ id: 'stairNo', icon: '🚧', label: 'Escalier ' + s, sub: 'fermé (travaux)', prio: 0.4, d });
  });
  if (I.cur > 0) {
    if (L.alarmPt && !I.alarmUsed && near(L.alarmPt, 20)) cand.push({ id: 'alarm', icon: '🔥', label: 'Alarme incendie', sub: 'tout le monde dehors !', prio: 0.6, d: 0 });
    if (!I.plan && I.cur === I.planFloor && near(L.planPt, 20)) cand.push({ id: 'plan', icon: '🗺️', label: 'Prendre le plan', sub: 'du collège', prio: 0.5, d: 0 });
  }
  // regarder par le trou de la serrure
  const [ptx, pty] = tileOf(P);
  for (const [dx, dy] of D4) {
    const x = ptx + dx, y = pty + dy; if (G.m.get(x, y) !== K.DOOR) continue;
    const dr = doorAt(x, y); if (!dr || dr.open > 0.3 || actorInDoor(dr)) continue;
    const back = dr.horiz ? [0, y > pty ? 1 : -1] : [x > ptx ? 1 : -1, 0];
    if (G.m.get(x + back[0], y + back[1]) !== K.FLOOR && !KP[G.m.get(x + back[0], y + back[1])]) continue;
    cand.push({ id: 'peek', door: dr, dir: back, icon: '👁️', label: 'Serrure', sub: 'regarder derrière', prio: 3.5, d: Math.hypot(dx, dy) * 10 });
    break;
  }
}
function infDo(a) {
  const I = G.inf, P = G.P;
  switch (a.id) {
    case 'stair': case 'stairUp':
      if (G.T.state === 'chase' && dist(G.T.x, G.T.y, P.x, P.y) < 40) { toast('Trop tard, il est juste derrière toi !', 1.4); return true; }
      infGoFloor(a.to, a.letter); return true;
    case 'stairLocked': AU.sfx('fail'); toast('🔒 La grille de l’escalier est fermée à clé. Il te faut le trousseau… ou une bonne raison d’évacuer 🔥', 3); return true;
    case 'stairNo': AU.sfx('bump'); toast('🚧 Escalier fermé pour travaux. Trouve l’autre escalier !', 2.2); return true;
    case 'alarm':
      P.busy = { label: 'Je tire la poignée…', dur: 0.8, t: 0, done: () => { makeNoise(P.x, P.y, 6, 'CLAC !'); infAlarm(); if (I.multi) Net.send({ t: 'alarm' }); } };
      return true;
    case 'plan':
      I.plan = true; if (I.multi) Net.send({ t: 'planTaken' }); AU.sfx('pickup'); sparkle(P.x, P.y - 20, 18); hop(P, 90);
      G.m.decor = G.m.decor.filter(d => d.t !== 'evac'); G.mapCanvas = I.floors[I.cur].mapCanvas = renderMapCanvas(G.L);
      toast('🗺️ Le plan du collège ! Touche 🗺️ en haut pour voir où sont les profs.', 3.4); UI.hudSig = null; return true;
    case 'peek':
      P.busy = { label: 'Je regarde par la serrure…', dur: 1e9, t: 0, peek: a.door, dir: a.dir, done: () => { } };
      AU.sfx('tick', 0.5); return true;
  }
  return false;
}
// fouiller un bureau : le trousseau ?
function infSearchDesk(a, key) {
  const I = G.inf, P = G.P;
  if (I.cur === I.keysFloor && key === I.keysKey && !I.keys) {
    I.keys = true; if (I.multi) Net.send({ t: 'trousseau' }); AU.sfx('found'); AU.sfx('keys'); sparkle(a.tx * 16 + 8, a.ty * 16 + 6, 24); hop(P, 110);
    UI.banner('🔑 LE TROUSSEAU DU CONCIERGE !'); toast('Il ouvre la grille de l’escalier… et le portail de la cour !', 3.2); UI.hudSig = null;
    return true;
  }
  return false;
}
// ---------- vue par le trou de la serrure ----------
function infDrawPeek(cv) {
  const P = viewerA(), b = P.busy; if (!b || !b.peek) return;
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, d = b.peek, dir = b.dir;
  const eye = [d.x * 16 + 8 + dir[0] * 9, d.y * 16 + 8 + dir[1] * 9];
  const VW = 9 * 16, ctr = [eye[0] + dir[0] * 4 * 16, eye[1] + dir[1] * 4 * 16], vx = ctr[0] - VW / 2, vy = ctr[1] - VW / 2, s = W / VW;
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#05030a'; c.fillRect(0, 0, W, H);
  c.save();
  // forme de serrure
  c.beginPath(); c.arc(W / 2, H * 0.4, W * 0.34, 0, Math.PI * 2); c.moveTo(W * 0.38, H * 0.55); c.lineTo(W * 0.3, H * 0.97); c.lineTo(W * 0.7, H * 0.97); c.lineTo(W * 0.62, H * 0.55); c.closePath(); c.clip();
  c.setTransform(s, 0, 0, s, -vx * s, -vy * s); c.imageSmoothingEnabled = false;
  // ce qu'on voit depuis la serrure
  const base = Math.atan2(dir[1], dir[0]);
  c.save(); c.beginPath(); c.moveTo(eye[0], eye[1]);
  for (let i = 0; i <= 40; i++) { const an = base - 1.15 + 2.3 * i / 40, r = castRay(eye[0], eye[1], an, 8 * 16); c.lineTo(eye[0] + Math.cos(an) * r, eye[1] + Math.sin(an) * r); }
  c.closePath(); c.clip();
  c.drawImage(G.mapCanvas, 0, 0);
  const ents = [];
  const vis = a => a && !a.gone && a.x > vx - 20 && a.x < vx + VW + 20 && a.y > vy - 20 && a.y < vy + VW + 40 && los(eye[0], eye[1], a.x, a.y - 10);
  G.items.forEach(it => { if (vis(it)) ents.push([it.y, () => drawItemW(c, it)]); });
  G.kids.forEach(k => { if (vis(k)) ents.push([k.y, () => { drawSprite(c, k.cfg, k.v || null, k, k.beh === 'sit' ? { sy: 0.86, bob: 2 } : {}); if (k.isWatcher && !['board'].includes(k.state)) { c.globalAlpha = 0.5; drawCone(c, k); c.globalAlpha = 1; } }]); });
  if (vis(G.T) && G.T !== P) ents.push([G.T.y, () => { drawCone(c, G.T); drawTeacher(c, G.T); }]);
  if (G.inf.multi && P === G.T && vis(G.P) && !G.P.hidden) ents.push([G.P.y, () => drawSprite(c, G.P.cfg, null, G.P)]);
  ents.sort((a, b2) => a[0] - b2[0]).forEach(e => e[1]());
  c.restore();
  c.restore();
  // ombre au bord du trou
  c.setTransform(1, 0, 0, 1, 0, 0);
  const g = c.createRadialGradient(W / 2, H * 0.45, W * 0.18, W / 2, H * 0.45, W * 0.55); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#3a2a14'; c.lineWidth = W * 0.02; c.beginPath(); c.arc(W / 2, H * 0.4, W * 0.34, 0, Math.PI * 2); c.stroke();
}
// ---------- le plan du collège ----------
function infDrawPlan(cv, f) {
  const I = G.inf, F = I.floors[f], L = F.L, m = L.m, c = cv.getContext('2d');
  const W = cv.width, H = cv.height, s = Math.min(W / m.w, (H - 4) / m.h), ox = (W - m.w * s) / 2, oy = (H - m.h * s) / 2;
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#f6efd8'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const k = m.get(x, y); let col = null;
    if (k === K.WALL || k === K.FENCE) col = '#2a2140'; else if (k === K.DOOR) col = '#e0a030'; else if (k === K.FLOOR) col = null; else if (k >= 30) col = '#2ce8d5'; else col = '#b8ad90';
    if (col) { c.fillStyle = col; c.fillRect(ox + x * s, oy + y * s, Math.ceil(s), Math.ceil(s)); }
  }
  c.font = `bold ${Math.max(8, s * 0.9) | 0}px VT323, monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  m.rooms.forEach(r => { if (r.name === 'Couloir' || r.w < 4) return; c.fillStyle = 'rgba(42,33,64,0.55)'; c.fillText(r.name.replace(/^Salle (\d+) · /, '$1 · ').slice(0, 16), ox + (r.x + r.w / 2) * s, oy + (r.y + r.h / 2) * s); });
  const icon = (pt, ch, sz) => { c.font = `${Math.max(12, s * (sz || 1.6)) | 0}px ${EMOJI_FONT}`; c.fillText(ch, ox + (pt[0] + 0.5) * s, oy + (pt[1] + 0.5) * s); };
  ['A', 'B'].forEach(l => { const st = F.stairs[l], pt = L.stairs[l]; icon(pt, st.down ? (st.locked && !I.keys ? '🔒' : '⬇️') : st.up ? '⬆️' : '🚧'); c.font = `bold ${Math.max(9, s) | 0}px VT323, monospace`; c.fillStyle = '#2f9e5a'; c.fillText(l, ox + (pt[0] + 0.5) * s, oy + (pt[1] - 1) * s); });
  if (f > 0 && L.alarmPt && !I.alarmUsed) icon(L.alarmPt, '🔥', 1.3);
  if (!I.keys && f === I.keysFloor) icon(I.keysDesk, '🔑', 1.5);
  if (f === 0) L.exits.forEach(e => { if (e.type !== 'search') icon([e.x, e.y], e.type === 'hold' ? '🚧' : '🐭', 1.4); });
  if (f === 0 && L.assembly) { c.strokeStyle = '#2f9e5a'; c.setLineDash([3, 2]); c.strokeRect(ox + L.assembly.x * s, oy + L.assembly.y * s, L.assembly.w * s, L.assembly.h * s); c.setLineDash([]); }
  // les adultes (positions en direct)
  const live = f === I.cur, kids = live ? G.kids : F.kids;
  let T = live ? G.T : F.T;
  if (I.multi) { const H = G.T; T = H.fl === f ? (H.x > -9000 ? H : H.last ? { x: H.last.x, y: H.last.y } : null) : null; }
  if (I.multi && I.ping && I.ping.fl === f && I.role === 'teacher' && I.ping.t < 30) icon([I.ping.x / 16 - 0.5, (I.ping.y - 6) / 16 - 0.5], '❗', 1.6);
  const dot = (a, col, r) => { if (!a || a.gone || a.x < 0) return; c.fillStyle = col; c.strokeStyle = '#1a1028'; c.lineWidth = 1.5; c.beginPath(); c.arc(ox + a.x / 16 * s, oy + (a.y - 6) / 16 * s, r, 0, 7); c.fill(); c.stroke(); };
  (kids || []).forEach(k => { if (k.isWatcher) dot(k, '#ff8a3a', Math.max(3, s * 0.42)); });
  if (!(I.multi && I.role === 'teacher')) dot(T, '#e43b44', Math.max(4, s * 0.55));
  if (live) { const pulse = 1 + Math.sin(G.time * 6) * 0.25; dot(viewerA(), '#3fd06a', Math.max(4, s * 0.55) * pulse); }
}

// ================= INFILTRATION À DEUX =================
// le surveillant joué par un humain
function infProfMulti() {
  const p = PROFS[1];
  return Object.assign({}, p, { name: 'M. Carnet', title: 'le surveillant', intercom: false, hasKeys: false, lines: Object.assign({}, p.lines, { caught: 'Toi, tu passes la journée en salle de colle !' }) });
}
// des élèves qui circulent dans les couloirs (ils vont aux toilettes, au CDI…) : l'élève peut se fondre parmi eux
function infSpawnRobots(F, R) {
  const L = F.L, m = L.m, pts = [];
  const add = (x, y) => { if (m.get(x, y) === K.FLOOR && L.reach[y * m.w + x] >= 0) pts.push([x, y]); };
  if (F.f === 0) { for (let y = L.T0 || 8; y < m.h - 2; y += 4) for (let x = 3; x < m.w - 3; x += 6) add(x, y); for (let x = 4; x < m.w - 4; x += 6) add(x, 3); }
  else {
    for (let x = 3; x < m.w - 3; x += 5) add(x, L.cy + 1);
    if (L.vx > 0) for (let y = L.cy + 5; y < m.h - 2; y += 4) add(L.vx + 1, y);
    L.rooms.forEach(r => { if (r.def.cls || r.def.staff) return; add(r.x + (r.w >> 1), r.y + (r.h >> 1)); });
  }
  if (pts.length < 4) return;
  F.robotSpots = pts;
  const n = F.f === 0 ? 5 : R.i(5, 7);
  for (let i = 0; i < n; i++) {
    const route = R.sh(pts.slice()).slice(0, 4), s = route[0];
    G.kids.push({ cfg: randomChar('', R.f), x: s[0] * 16 + 8, y: s[1] * 16 + 12, ang: 0, face: 0, anim: 0, moving: false, path: null, pi: 0, beh: 'robot', route, ri: 0, st: 0.5 + R.f() * 2, pause: R.p([2, 2.5, 3]), ph: R.f() * 6, isKid: true });
  }
}
// l'autre joueur n'est pas à mon étage : on le range hors de la carte
function infRepark() {
  const I = G.inf; if (!I || !I.multi) return;
  const other = I.role === 'teacher' ? G.P : G.T;
  if (other.fl !== I.cur) { other.x = -9999; other.y = -9999; other.net = null; other.away = true; if (other === G.P) G.P.hidden = null; }
  else if (other.away && other.last) { other.x = other.last.x; other.y = other.last.y; other.net = other.last; other.away = false; }
}
// réception d'une position (élève ou surveillant) avec son étage
function infRecvPos(A, d) {
  const I = G.inf; A.last = d; A.fl = d.fl;
  if (d.fl !== I.cur) { A.net = null; A.x = -9999; A.y = -9999; A.away = true; if (A === G.P) G.P.hidden = null; return; }
  if (A.away) { A.x = d.x; A.y = d.y; A.away = false; }
  A.net = d;
}
// qui fait bouger les élèves et les profs d'un étage : l'élève, sinon le surveillant
function infAuth() { const I = G.inf; return I.role === 'student' || G.P.fl !== I.cur; }
// un prof prévient le surveillant
function infPing(by, hunt) {
  const I = G.inf, P = G.P;
  Net.send({ t: 'warn', n: I.warn, hunt: hunt ? 1 : 0, who: by.name || 'Un prof', room: G.m.roomAt(...tileOf(P)) || '', x: Math.round(P.x), y: Math.round(P.y), fl: I.cur });
}
function infRecvWarn(d) {
  const I = G.inf; I.warn = d.n; I.hunt = !!d.hunt;
  I.ping = { x: d.x, y: d.y, fl: d.fl, t: 0, room: d.room, who: d.who, hunt: !!d.hunt };
  if (I.role === 'teacher') {
    UI.banner('📢 ' + d.who + ' (' + INF_FLOOR_META[d.fl].short + ' · ' + d.room + ') : « ' + (d.hunt ? 'Surveillant ! Venez vite !' : 'Un élève hors de sa classe !') + ' »');
    AU.sfx(d.hunt ? 'whistle' : 'ding', 0.6); UI.hudSig = null;
  }
}
// escaliers et serrure pour le surveillant
function infActsT(cand) {
  const I = G.inf, F = I.floors[I.cur], L = G.L, T = G.T, cx0 = T.x, cy0 = T.y - 6;
  const near = (pt, r) => Math.hypot(pt[0] * 16 + 8 - cx0, pt[1] * 16 + 8 - cy0) < r;
  ['A', 'B'].forEach(s => {
    const pt = L.stairs[s]; if (!near(pt, 24)) return; const st = F.stairs[s];
    if (st.down) cand.push({ id: 'stair', to: I.cur - 1, letter: s, icon: '⬇️', label: 'Descendre', sub: I.cur - 1 === 0 ? 'vers la cour' : 'au ' + INF_FLOOR_META[I.cur - 1].name, prio: 0.2, d: 0 });
    if (st.up) cand.push({ id: 'stairUp', to: I.cur + 1, letter: s, icon: '⬆️', label: 'Monter', sub: 'au ' + INF_FLOOR_META[I.cur + 1].name, prio: 0.3, d: 0 });
    if (!st.down && !st.up) cand.push({ id: 'stairNo', icon: '🚧', label: 'Escalier ' + s, sub: 'fermé (travaux)', prio: 0.4, d: 0 });
  });
  const [ptx, pty] = tileOf(T);
  for (const [dx, dy] of D4) {
    const x = ptx + dx, y = pty + dy; if (G.m.get(x, y) !== K.DOOR) continue;
    const dr = doorAt(x, y); if (!dr || dr.open > 0.3 || dr.locked || actorInDoor(dr)) continue;
    const back = dr.horiz ? [0, y > pty ? 1 : -1] : [x > ptx ? 1 : -1, 0];
    if (G.m.get(x + back[0], y + back[1]) === K.WALL) continue;
    cand.push({ id: 'peek', door: dr, dir: back, icon: '👁️', label: 'Serrure', sub: 'regarder derrière', prio: 3.5, d: 9 });
    break;
  }
}
function infDoT(a) {
  const T = G.T;
  switch (a.id) {
    case 'stair': case 'stairUp': infGoFloor(a.to, a.letter); return true;
    case 'stairNo': AU.sfx('bump'); toast('🚧 Escalier fermé pour travaux.', 1.6); return true;
    case 'peek': T.busy = { label: 'Je regarde par la serrure…', dur: 1e9, t: 0, peek: a.door, dir: a.dir, done: () => { } }; AU.sfx('tick', 0.5); return true;
  }
  return false;
}
// messages d'un étage précis
function infFloorOf(d) { const I = G.inf; return I.floors[d.fl != null ? d.fl : I.cur]; }
