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
    lines: Object.assign({}, p.lines, p.lesson ? { start: '' } : { spot: ['TOI ! Reviens ici, {n} !', 'Cette fois, je t’attrape, {n} !', 'Trois avertissements, ça suffit !'], start: '' })
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
  const R = mkRng(seed ^ 0x51ed), multi = !!mopt, coop = !!(mopt && mopt.coop), guard = !!(mopt && mopt.guard);
  const I = { seed, multi, coop, auth: !coop || !!mopt.host, role: mopt ? (mopt.role || 'student') : 'student', ping: null, floors: [], cur: INF_TOP, startFloor: INF_TOP, warn: 0, grace: 0, hunt: false, keys: false, plan: false, alarm: null, alarmUsed: false, t: 0, radio: null, chased: 0, route: '' };
  const first = R.ch(0.5) ? 'A' : 'B', other = first === 'A' ? 'B' : 'A';
  I.downVia = { 3: first, 2: other, 1: first };
  for (let f = 0; f <= INF_TOP; f++) {
    const L = buildInfFloor(f, f === INF_TOP, seed);
    const meta = INF_FLOOR_META[f];
    L.def = { prof: multi && meta.profMulti != null ? meta.profMulti : meta.prof, title: meta.name, place: meta.name, hints: [], inf: true };
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
  if (coop || guard) { const pair = seats.find(s => seats.some(o => o[1] === s[1] && o[0] === s[0] + 1)) || seats[0]; const nb = seats.find(o => o[1] === pair[1] && o[0] === pair[0] + 1) || seats.find(o => o !== pair); I.seatH = pair; I.seatG = nb; I.seat = guard || mopt.host ? pair : nb; I.seat2 = guard || mopt.host ? nb : pair; }
  I.maitresseName = R.p(INF_MAITRESSES);
  G.inf = I; G.net = null; G.seed = null;
  // personnages, objets, portes : un « monde » par étage
  const P = { x: I.seat[0] * 16 + 8, y: I.seat[1] * 16 + 12, face: 1, moving: false, running: false, anim: 0, small: 0, slip: 0, hidden: null, hideFrom: null, busy: null, inv: [], stepT: 0, cfg, unhideT: 0, bumpT: 0, fl: INF_TOP };
  P.seat = I.seat; P.key = 'me';
  if (coop) { G.P2 = { x: I.seat2[0] * 16 + 8, y: I.seat2[1] * 16 + 12, face: 1, moving: false, running: false, anim: 0, small: 0, slip: 0, hidden: null, busy: null, inv: [], cfg: mopt.cfg2, fl: INF_TOP, seat: I.seat2, key: 'them', isPartner: true }; }
  else G.P2 = null;
  if (multi && !coop) { const T = newTeacher(infProfMulti(), I.floors[1].L); T.state = 'free'; T.fl = 1; T.hasKeys = false; G.T = T; }
  G.P = P; G.lvl = 'inf'; G.lessons = 0; G.time = 0; G.spotted = 0; G.reveal = 0; G.slowT = 0; G.shake = 0; G.found = 0; G.petFound = false; G.alarmT = 0; G.pVis = true; G.appleId = 0;
  G.tasks = []; G.tasksDone = 0; G.tasksRemote = 0; G.banner = null; G.heartT = 0; G.intercomT = 999; G.kidCueT = 3; G.smallDoorTip = false;
  const itemPlan = R.sh(['cake', 'apple', 'lamp', 'slipper', 'watch', 'mirror', 'cake', 'apple']);
  I.floors.forEach(F => infSetupFloor(F, R, itemPlan));
  if (multi && !coop && I.role === 'teacher') { I.cur = 1; I.plan = true; }
  if (coop) coopSetupJail(R);
  if (guard) guardSetup(I, R, mopt);
  infLoad(guard ? I.cur : multi && !coop && I.role === 'teacher' ? 1 : INF_TOP, true);
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
  if (!I.multi || I.coop) { const T = newTeacher(infProf(L.def.prof), L); T.state = 'patrol'; T.st = 0; T.det = {}; G.T = T; }
  // objets magiques (2 par étage, posés hors de la salle de départ)
  const spots = L.itemSpots.filter(([x, y]) => !(I.startRoom && F.f === INF_TOP && x >= I.startRoom.x && y >= I.startRoom.y && x < I.startRoom.x + I.startRoom.w && y < I.startRoom.y + I.startRoom.h));
  R.sh(spots); const chosen = [];
  for (const s of spots) { if (chosen.length >= 3) break; if (chosen.every(c => Math.abs(c[0] - s[0]) + Math.abs(c[1] - s[1]) >= 8)) chosen.push(s); }
  G.items = chosen.map((s, i) => ({ id: F.f * 10 + i, x: s[0] * 16 + 8, y: s[1] * 16 + 12, kind: i === 2 ? 'squishy' : itemPlan[(F.f * 2 + i) % itemPlan.length], ph: Math.random() * 6 }));   // + un squishy par étage
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
      if (isStart && ((x === I.seat[0] && y === I.seat[1]) || (I.seat2 && x === I.seat2[0] && y === I.seat2[1]))) return;
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
  F.robotSpots = []; if (I.multi && !I.coop) infSpawnRobots(F, R);
  // des portes fermées à clé (dont la salle du trousseau) et des petites clés qui traînent
  F.lockedRooms = [];
  if (F.f > 0) {
    const inR = (r, x, y) => x >= r.x - 1 && y >= r.y - 1 && x <= r.x + r.w && y <= r.y + r.h;
    const doorsOf = r => G.doors.filter(d => inR(r, d.x, d.y));
    const lockRoom = r => { const ds = doorsOf(r); if (!ds.length) return; ds.forEach(d => { d.locked = true; d.byPlayer = false; d.pre = true; }); F.lockedRooms.push(r); };
    if (F.f === I.keysFloor) { const kr = L.rooms.find(r => I.keysDesk[0] >= r.x && I.keysDesk[1] >= r.y && I.keysDesk[0] < r.x + r.w && I.keysDesk[1] < r.y + r.h); if (kr) lockRoom(kr); }
    const extra = L.rooms.filter(r => !r.def.stair && !r.def.startCls && !F.lockedRooms.includes(r) && !(L.planPt && inR(r, L.planPt[0], L.planPt[1])) && doorsOf(r).length && doorsOf(r).every(d => !G.doors.some(o => o !== d && o.x === d.x && o.y === d.y)));
    R.sh(extra); extra.slice(0, R.i(1, 2)).forEach(lockRoom);
    const free = L.itemSpots.filter(([x, y]) => !F.lockedRooms.some(r => inR(r, x, y)) && !(I.startRoom && F.f === INF_TOP && inR(I.startRoom, x, y)) && !G.items.some(it => Math.abs(it.x - x * 16 - 8) + Math.abs(it.y - y * 16 - 12) < 48));
    R.sh(free); const nk = F.lockedRooms.length + 1, picked = [];
    for (const s of free) { if (picked.length >= nk) break; if (picked.every(c => Math.abs(c[0] - s[0]) + Math.abs(c[1] - s[1]) >= 7)) picked.push(s); }
    L.patrol = L.patrol.filter(([x, y]) => !F.lockedRooms.some(r => inR(r, x, y)));
    picked.forEach((s, i) => G.items.push({ id: F.f * 10 + 5 + i, x: s[0] * 16 + 8, y: s[1] * 16 + 12, kind: 'key', ph: R.f() * 6 }));
  }
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
  if (!G.inf.multi || G.inf.coop) F.T = G.T;
  if (G.inf.coop && G.inf.floors[G.inf.cur] === F) F.remote = !G.inf.auth;
  Object.assign(F, { kids: G.kids, items: G.items, apples: G.apples, doors: G.doors, doorIdx: G.doorIdx, searched: G.searched, pigeons: G.pigeons, disguiseAt: G.disguiseAt });
}
function infLoad(f, first) {
  const I = G.inf, F = I.floors[f];
  I.cur = f; G.L = F.L; G.m = F.L.m; if (!I.multi || I.coop) G.T = F.T; G.kids = F.kids; G.robotSpots = F.robotSpots; G.items = F.items; G.apples = F.apples; G.doors = F.doors; G.doorIdx = F.doorIdx;
  G.searched = F.searched; G.pigeons = F.pigeons || []; G.disguiseAt = F.disguiseAt; G.mapCanvas = F.mapCanvas; G.mapKeep = true; G.trees = F.trees;
  G.cues = []; G.parts = []; G.camX = null; G.ball = null;
  if (!first) { G.L.hides.forEach(s => s.shake = 0); }
}
function infGoFloor(nf, letter) {
  const I = G.inf, P = viewerA(), oldT = G.T, chased = (!I.multi || I.coop) && oldT.state === 'chase';
  infSave();
  if (chased) { oldT.state = 'search'; oldT.searchQ = []; oldT.path = null; }
  FX.iris = { mode: 'in', t: 0, dur: 0.5 };
  infLoad(nf);
  const sp = G.L.stairs[letter]; P.x = sp[0] * 16 + 8; P.y = sp[1] * 16 + 14; P.busy = null; P.moving = false; P.fl = nf;
  if (I.coop) { infRepark(); coopFloorAuth(); AU.sfx('tstep'); I.grace = Math.max(I.grace, 1.6); UI.banner('📍 ' + INF_FLOOR_META[nf].name + (nf === 0 ? ' · la cour est là !' : '')); UI.hudSig = null; return; }
  if (I.multi) { infRepark(); AU.sfx('tstep'); UI.banner('📍 ' + INF_FLOOR_META[nf].name); UI.hudSig = null; return; }
  AU.sfx(nf < I.cur + 1 ? 'tstep' : 'step'); AU.sfx('door', 0.4);
  I.grace = Math.max(I.grace, 1.6);
  UI.banner('📍 ' + INF_FLOOR_META[nf].name + (nf === 0 ? ' · la cour est là !' : ''));
  if (chased || I.hunt) { I.radio = { t: chased ? 2.5 : 5, x: P.x, y: P.y, from: INF_FLOOR_META[I.cur].short }; }
  UI.hudSig = null;
}
// ---------- règles : être « à sa place » ----------
function infOut(by) {
  const I = G.inf, P = G.P;
  if (P.out || P.jail) return false;
  if (I.alarm) return I.cur === 0 && !inRectT(P, I.floors[0].L.assembly);
  const inStart = I.cur === I.startFloor && inRectT(P, I.startRoom);
  const seat = P.seat || I.seat;
  if (by && by.maitresse) return !inStart || dist(P.x, P.y, seat[0] * 16 + 8, seat[1] * 16 + 12) > 26;
  return !inStart;
}
function infWarn(by) {
  const I = G.inf, P = G.P; if (I.grace > 0 || G.mode !== 'play') return;
  by.detect = 0;
  if (I.multi && (I.warn >= 3 || I.hunt)) {
    I.hunt = true; I.grace = 2.5; infSay(by, pick(INF_LINES.call), 2.4); setMark(by, '!', 1.4); hop(by, 80); AU.sfx('whistle', 0.7);
    infPing(by, true); toast('🚨 ' + by.name + ' appelle le surveillant. Balance !', 2); return;
  }
  if (I.warn >= 3 || I.hunt) {
    I.hunt = true; I.grace = 0.5;
    if (I.coop) Net.send({ t: 'twarn', n: I.warn, hunt: 1, you: P.key === 'them' ? 1 : 0, text: '' });
    if (by === G.T) { G.T.tgt = P.key; enterChase(); return; }
    infSay(by, pick(INF_LINES.call), 2.4); setMark(by, '!', 1.4); hop(by, 80); AU.sfx('whistle', 0.7);
    G.T.tgt = P.key; infAlertT(P.x, P.y, true);
    return;
  }
  I.warn++; I.grace = 4.5;
  const seat = by.maitresse && I.cur === I.startFloor && inRectT(P, I.startRoom);
  const line = nameLine(pick(I.alarm ? INF_LINES.crowd : seat ? INF_LINES.seat : INF_LINES.warn)) + ' (' + I.warn + '/3)';
  if (by === G.T) { G.T.bubble = { text: line, t: 0, dur: 2.6 }; if (I.coop) Net.send({ t: 'bub', w: 'T', text: line, dur: 2.6 }); AU.say(line, G.T.prof, 0.8); G.T.state = 'warn'; G.T.st = 1.8; G.T.path = null; G.T.detect = 0; }
  else { infSay(by, line, 2.6); by.state = 'warn'; by.st = 1.8; by.path = null; by.warnWho = P; }
  setMark(by, '!', 1.2); hop(by, 70); AU.sfx('whistle', 0.6);
  if (I.coop) { Net.send({ t: 'twarn', n: I.warn, hunt: I.hunt ? 1 : 0, you: P.key === 'them' ? 1 : 0, text: line }); if (P.key === 'them') { UI.hudSig = null; return; } }
  G.shake = 0.18;
  cue(by.x, by.y - 34, 'word', I.warn + '/3', { col: '#ffd23f', pop: true, life: 1.2 });
  if (I.multi) infPing(by, false);
  toast(I.warn < 3 ? '⚠️ Repéré·e ! ' + I.warn + '/3. Discrétion, on a dit.' : '🚨 3/3. La prochaine fois, ça court !', 2.8);
  UI.hudSig = null;
}
function infSay(k, text, dur) {
  k.bub = { text: nameLine(text), t: 0, dur: dur || 2.2 };
  if ((G.inf && G.inf.coop && G.inf.auth) || (G.net && G.net.cc && Net.isHost)) Net.send({ t: 'bub', w: G.kids.indexOf(k), text: k.bub.text, dur: k.bub.dur });
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
    case 'warn': {
      const W = k.warnWho || P;
      k.st -= dt; k.moving = false; k.ang += angDiff(Math.atan2(W.y - k.y, W.x - k.x), k.ang) * Math.min(1, dt * 8); k.face = faceFromAng(k.ang);
      if (k.st <= 0) { k.state = 'teach'; k.st = rand(2, 4); }
      break;
    }
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
      if (r === 'done' || !k.path) { k.state = k.next || 'look'; k.st = k.state === 'doorlook' ? 4 : rand(1.2, 2.6); k.lookBase = k.ang; k.path = null; }
      break;
    }
    case 'look':
      k.moving = false; k.ang = k.lookBase + Math.sin(G.time * 2 + k.ph) * 1.1; k.face = faceFromAng(k.ang); k.st -= dt;
      if (k.st <= 0) { if (goTo(k, k.home[0], k.home[1])) { k.state = 'walk'; k.next = 'teach'; } else k.state = 'teach'; }
      break;
    case 'doorlook': {
      // on a frappé : le prof ouvre la porte et regarde dans le couloir
      k.moving = false; k.ang = k.doorAng + Math.sin(G.time * 1.6 + k.ph) * 0.55; k.face = faceFromAng(k.ang); k.st -= dt;
      if (k.knockDoor) { k.knockDoor.forceT = 0.3; if (!k.knockSent && I.coop) { k.knockSent = true; Net.send({ t: 'dopen', i: G.doors.indexOf(k.knockDoor), d: k.st + 0.3 }); } }
      if (k.st <= 0) { k.knockDoor = null; k.knockSent = false; infSay(k, pick(['Bizarre… il n’y a personne.', 'Encore une farce !', 'Hmm… j’ai rêvé ?', 'Les petits plaisantins…']), 2); if (goTo(k, k.home[0], k.home[1])) { k.state = 'walk'; k.next = 'teach'; } else k.state = 'teach'; }
      break;
    }
    case 'guard':
      k.moving = false; k.ang = k.homeAng + Math.sin(G.time * 0.9 + k.ph) * 0.9; k.face = faceFromAng(k.ang);
      break;
  }
  // vision (en équipe : pour chaque élève présent à l'étage)
  if (I.coop) { const real = G.P; coopTargets().forEach(t => { G.P = t; k.detect = (k.det || (k.det = {}))[t.key] || 0; infWatcherSee(k, dt, t); k.det[t.key] = k.detect; }); G.P = real; return; }
  infWatcherSee(k, dt, P);
}
function infWatcherSee(k, dt, P) {
  const I = G.inf;
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
  UI.banner('🔥 ALARME INCENDIE ! Tout le monde dehors !');
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
    if (!I.multi || (I.coop && I.auth)) { const T = G.T, s = infNearestStair(T); T.state = 'evac'; T.bubble = { text: pick(INF_LINES.evac), t: 0, dur: 2 }; T.path = null; if (!goTo(T, s[0], s[1])) { T.gone = true; T.x = -9999; } }
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
  toast('🔥 Tout le monde dehors ! (Appel dans la cour, hein.)', 3);
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
  UI.banner('🔔 Fausse alerte. Tout le monde remonte !');
  toast(I.hunt ? '😱 Tous les profs te cherchent. Bravo.' : '🤫 Retour en classe : faufile-toi !', 3);
  AU.play(I.hunt ? 'chase' : 'sneak');
}
// ---------- mise à jour (appelée dans update) ----------
function infUpdate(dt) {
  const I = G.inf, P = G.P;
  I.t += dt; if (I.grace > 0) I.grace -= dt;
  if (G.T.state === 'chase') I.chased = Math.max(I.chased, 1);
  if (I.ping) I.ping.t += dt;
  const boss = I.coop ? Net.isHost : (!I.multi || I.role === 'student');
  // la traque s'épuise si l'élève reste caché 20 secondes
  if (boss) {
    const allHid = I.coop ? [P, G.P2].every(p => p.out || p.jail || (p === P ? p.hidden : p.hidF)) : P.hidden;
    if (I.hunt && allHid) {
      I.hideT = (I.hideT || 0) + dt;
      if (I.hideT >= 20) {
        I.hideT = 0; I.hunt = false; I.warn = 2;
        UI.banner(I.coop ? '😮‍💨 Ils ont lâché l’affaire. (Plus qu’1 avertissement.)' : '😮‍💨 Ils ont lâché l’affaire. (Plus qu’1 avertissement.)'); AU.play('sneak'); UI.hudSig = null; UI.infSig = null;
        if (I.multi) Net.send({ t: 'calm' });
        if (I.coop && G.T.state !== 'patrol' && !G.T.gone && I.auth) { G.T.state = 'patrol'; G.T.path = null; G.T.knows = null; }
        else if (!G.T.gone && G.T.state !== 'patrol' && G.T.state !== 'evac') { G.T.state = 'patrol'; G.T.path = null; G.T.knows = null; G.T.detect = 0; say('Bon… j’ai dû rêver. Je reprends ma ronde.'); }
      }
    } else I.hideT = 0;
  }
  // talkie-walkie entre surveillants
  if (I.radio) { I.radio.t -= dt; if (I.radio.t <= 0) { const r = I.radio; I.radio = null; if (!G.T.gone && G.T.state !== 'chase') { UI.banner('📻 Talkie : « Un élève arrive par l’escalier ! »'); infAlertT(r.x, r.y, false); } } }
  // l'alarme
  if (I.alarm) {
    const A = I.alarm; A.t += dt; A.sirenT -= dt;
    if (A.sirenT <= 0) { A.sirenT = 1.25; AU.sfx('alarm', 0.35); }
    G.alarmFlash = (G.time * 2) % 1 < 0.5;
    if (boss && !A.call && A.t > 32) {
      A.call = true;
      const inA = p => { if (p.out) return true; const q = p.x < -9000 && p.last ? p.last : p; return p.fl === 0 && inRectT(q, I.floors[0].L.assembly) && !(p === P ? p.hidden : p === G.P2 ? p.hidF : p.hidden); };
      const ok = I.coop ? (inA(P) && inA(G.P2)) : (I.cur === 0 && inRectT(P, I.floors[0].L.assembly) && !P.hidden);
      const T0 = I.floors[0].T;
      if (I.multi) Net.send({ t: 'call', ok: ok ? 1 : 0 });
      if (ok) { UI.banner('📋 L’appel… « ' + (P.cfg.name || 'Toi') + ' ? » — « Présent·e ! »'); toast('✅ Personne n’a rien vu. Classique.', 2.4); }
      else { I.hunt = true; I.warn = 3; UI.banner('📋 L’appel… « ' + (P.cfg.name || 'toi') + ' ? »… IL MANQUE ' + (P.cfg.name || 'UN ÉLÈVE').toUpperCase() + ' !'); toast('😱 Absent·e à l’appel. Tout le collège te cherche !', 3); AU.sfx('spot'); if (I.cur === 0 && T0 === G.T) infAlertT(P.x, P.y, false); }
    }
    if (boss && A.t >= A.dur) { if (I.multi) Net.send({ t: 'alarmEnd' }); infAlarmEnd(); }
  } else G.alarmFlash = false;
  // élèves et profs qui évacuent : les profs aussi
  if ((!I.multi || (I.coop && I.auth)) && G.T.state === 'evac') {
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
}
function infDo(a) {
  const I = G.inf, P = G.P;
  switch (a.id) {
    case 'stair': case 'stairUp':
      if (G.T.state === 'chase' && dist(G.T.x, G.T.y, P.x, P.y) < 40) { toast('Trop tard, il est juste derrière !', 1.4); return true; }
      infGoFloor(a.to, a.letter); return true;
    case 'stairLocked': AU.sfx('fail'); toast('🔒 Grille fermée. Trousseau… ou alarme incendie 🔥', 2.6); return true;
    case 'stairNo': AU.sfx('bump'); toast('🚧 Fermé pour travaux. Va voir l’autre escalier.', 2.2); return true;
    case 'alarm':
      P.busy = { label: 'Je tire la poignée…', dur: 0.8, t: 0, done: () => { makeNoise(P.x, P.y, 6, 'CLAC !'); infAlarm(); if (I.multi) Net.send({ t: 'alarm' }); } };
      return true;
    case 'plan':
      I.plan = true; if (I.multi) Net.send({ t: 'planTaken' }); AU.sfx('pickup'); sparkle(P.x, P.y - 20, 18); hop(P, 90);
      G.m.decor = G.m.decor.filter(d => d.t !== 'evac'); G.mapCanvas = I.floors[I.cur].mapCanvas = renderMapCanvas(G.L);
      toast('🗺️ Le plan ! Touche 🗺️ pour espionner les profs.', 3); UI.hudSig = null; return true;
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
    UI.banner('🔑 LE TROUSSEAU DU CONCIERGE !'); toast('Grille + portail : ouverts. Merci le concierge !', 3); UI.hudSig = null;
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
    if (k === K.WALL || k === K.FENCE) col = '#2a2140'; else if (k === K.DOOR) col = '#e0a030'; else if (k === K.FLOOR) col = null; else if (isExitK(k)) col = '#2ce8d5'; else col = '#b8ad90';
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
  if (I.multi && !I.coop) { const H = G.T; T = H.fl === f ? (H.x > -9000 ? H : H.last ? { x: H.last.x, y: H.last.y } : null) : null; }
  if (I.multi && I.ping && I.ping.fl === f && I.role === 'teacher' && I.ping.t < 30) icon([I.ping.x / 16 - 0.5, (I.ping.y - 6) / 16 - 0.5], '❗', 1.6);
  const dot = (a, col, r) => { if (!a || a.gone || a.x < 0) return; c.fillStyle = col; c.strokeStyle = '#1a1028'; c.lineWidth = 1.5; c.beginPath(); c.arc(ox + a.x / 16 * s, oy + (a.y - 6) / 16 * s, r, 0, 7); c.fill(); c.stroke(); };
  (kids || []).forEach(k => { if (k.isWatcher) dot(k, '#ff8a3a', Math.max(3, s * 0.42)); });
  if (!(I.multi && I.role === 'teacher')) dot(T, '#e43b44', Math.max(4, s * 0.55));
  if (I.guard) {
    const Q = G.T2, q = Q && (Q.x > -9000 ? Q : Q.last); if (q && Q.fl === f) { dot(q, '#7ff0ff', Math.max(4, s * 0.55)); c.font = `bold ${Math.max(9, s) | 0}px VT323, monospace`; c.fillStyle = '#1a6f8a'; c.fillText(guardName(Q), ox + q.x / 16 * s, oy + (q.y - 6) / 16 * s - s * 1.1); }
    if (I.ping && I.ping.fl === f && I.ping.x >= 0 && I.ping.t < 20) icon([I.ping.x / 16 - 0.5, (I.ping.y - 6) / 16 - 0.5], '📍', 1.5);
  }
  if (I.coop) {
    const Q = G.P2; if (Q && Q.fl === f && !Q.out) { const q = Q.x > -9000 ? Q : Q.last; if (q) { dot(q, '#7ff0ff', Math.max(4, s * 0.55)); c.font = `bold ${Math.max(9, s) | 0}px VT323, monospace`; c.fillStyle = '#1a6f8a'; c.fillText(Q.jail ? '🔒 ' + (Q.cfg.name || '') : (Q.cfg.name || ''), ox + q.x / 16 * s, oy + (q.y - 6) / 16 * s - s * 1.1); } }
    if (I.ping && I.ping.fl === f && I.ping.t < 20) icon([I.ping.x / 16 - 0.5, (I.ping.y - 6) / 16 - 0.5], '📍', 1.5);
    if (f === 1 && I.jail) { c.fillStyle = 'rgba(228,59,68,0.18)'; c.fillRect(ox + I.jail.r.x * s, oy + I.jail.r.y * s, I.jail.r.w * s, I.jail.r.h * s); }
  }
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
  const other = I.coop ? G.P2 : I.role === 'teacher' ? G.P : G.T;
  if (I.coop && other.out) { other.x = -9999; other.y = -9999; other.net = null; other.away = true; return; }
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
function infAuth() { const I = G.inf; if (I.coop) return I.auth; return I.role === 'student' || G.P.fl !== I.cur; }
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
}
function infDoT(a) {
  const T = G.T;
  switch (a.id) {
    case 'stair': case 'stairUp': infGoFloor(a.to, a.letter); return true;
    case 'stairNo': AU.sfx('bump'); toast('🚧 Fermé pour travaux.', 1.6); return true;
    case 'peek': T.busy = { label: 'Je regarde par la serrure…', dur: 1e9, t: 0, peek: a.door, dir: a.dir, done: () => { } }; AU.sfx('tick', 0.5); return true;
  }
  return false;
}
// messages d'un étage précis
function infFloorOf(d) { const I = G.inf; return I.floors[d.fl != null ? d.fl : I.cur]; }

// ================= INFILTRATION EN ÉQUIPE =================
// Deux élèves, mêmes profs (IA). Sur un étage partagé, un seul téléphone « a la main » sur les profs :
// celui qui y est arrivé en premier. L'autre reçoit leurs positions.
function coopTargets() {
  const I = G.inf, out = [];
  [I.me || G.P, G.P2].forEach(p => { if (p && !p.out && !p.jail && !p.lesson && !(p.jailMove && G.time - p.jailMove < 2.5) && p.x > -9000 && (p === (I.me || G.P) || p.fl === I.cur)) out.push(p); });
  return out;
}
// salle de colle au 1er étage
function coopSetupJail(R) {
  const I = G.inf, F = I.floors[1], L = F.L;
  const inRm = (r, p) => p && p[0] >= r.x && p[1] >= r.y && p[0] < r.x + r.w && p[1] < r.y + r.h;
  const ok = r => !r.def.stair && !r.def.staff && !F.lockedRooms.includes(r) && !(I.keysFloor === 1 && inRm(r, I.keysDesk)) && !inRm(r, L.planPt) && !inRm(r, L.alarmPt) && F.doors.some(d => d.x >= r.x - 1 && d.y >= r.y - 1 && d.x <= r.x + r.w && d.y <= r.y + r.h);
  const cands = L.rooms.filter(ok);
  let r = cands.find(r => r.def.n === 'Salle d’étude') || cands.find(r => r.def.cls && !F.kids.some(k => k.isWatcher && k.room === r)) || cands.find(r => r.def.cls) || cands[0];
  if (!r) return;
  F.kids = F.kids.filter(k => !(k.isWatcher && k.room === r));   // pas de prof dans la salle de colle : juste des élèves collés
  r.def = Object.assign({}, r.def, { n: 'Salle de colle' }); const mr = L.m.rooms.find(q => q.x === r.x && q.y === r.y && q.w === r.w); if (mr) mr.name = 'Salle de colle';
  const inR = (x, y) => x >= r.x - 1 && y >= r.y - 1 && x <= r.x + r.w && y <= r.y + r.h;
  I.jail = { r, doors: F.doors.map((d, i) => inR(d.x, d.y) ? i : -1).filter(i => i >= 0) };
  I.jail.doors.forEach(i => { const d = F.doors[i]; d.locked = true; d.byPlayer = false; d.pre = true; d.jail = true; });
  const free = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (L.m.get(x, y) === K.FLOOR) free.push([x, y]);
  I.jail.spots = free.length ? free : [[r.x, r.y]];
  F.items = F.items.filter(it => !inR(Math.floor(it.x / 16), Math.floor((it.y - 4) / 16)));
}
function coopPartnerNear(ex) { const Q = G.P2; return Q && !Q.out && Q.fl === G.inf.cur && Q.x > -9000 && Math.hypot(Q.x - (ex.x * 16 + 8), Q.y - (ex.y * 16 + 8)) < 52; }
// en arrivant sur un étage : qui fait bouger les profs ?
function coopFloorAuth() {
  const I = G.inf, Q = G.P2;
  if (Q.fl === I.cur && !Q.out && !Q.away) { I.auth = false; return; }
  if (I.floors[I.cur].remote) { I.auth = false; coopTakeAuth(); } else I.auth = true;
  I.floors[I.cur].remote = false;
}
// je deviens responsable des profs de mon étage (le coéquipier est parti)
function coopTakeAuth() {
  const I = G.inf, T = G.T; if (I.auth || G.P.out) return; I.auth = true;
  if (T) { T.net = null; T.path = null; if (!['patrol', 'evac', 'gone'].includes(T.state)) { T.state = I.hunt ? 'search' : 'patrol'; T.searchQ = []; } T.det = {}; }
  G.kids.forEach(k => { k.net = null; if (k.isWatcher && !k.gone && k.state !== 'evac' && k.state !== 'guard') { k.path = null; k.state = 'teach'; k.st = 1; } else if (k.path && k.beh !== 'sit') k.path = null; });
}
// ---------- mise à jour (remplace netUpdate en équipe) ----------
function coopUpdate(dt) {
  const I = G.inf, P = G.P, Q = G.P2, T = G.T;
  I.me = P;
  updatePlayer(dt); if (G.mode !== 'play') return;
  // sorti de la salle de colle (porte ouverte, clé…) : libre !
  if (P.jail && I.jail && I.cur === 1 && !inRectT(P, I.jail.r)) { P.jail = false; P.jailT = 0; UI.banner('🏃 Évadé·e de la colle. La classe !'); }
  // le coéquipier
  if (Q.net && Q.fl === I.cur) { Net.smooth(Q, dt); const s = Q.net; Q.small = s.sm ? 10 : 0; Q.slip = s.sl ? 1 : 0; Q.skidT = s.sk ? 0.1 : 0; Q.hidden = s.h >= 0 ? G.L.hides[s.h] : null; }
  if (I.auth) {
    // à qui le prof s'intéresse ?
    if (!T.gone && T.state !== 'evac') {
      const tg = coopTargets(); let tgt = tg.find(p => p.key === T.tgt);
      const busy = ['chase', 'search', 'check', 'investigate', 'alert', 'warn'].includes(T.state);
      if (!busy || !tgt) {
        let best = null, bs = -1;
        tg.forEach(p => { if (p.hidden) return; const ex = T.x, ey = T.y - 12, d = Math.hypot(p.x - ex, p.y - 7 - ey); let s = 1 / (d + 1); if (d < T.prof.range * 16 && Math.abs(angDiff(Math.atan2(p.y - 7 - ey, p.x - ex), T.ang)) < T.prof.fov && los(ex, ey, p.x, p.y - 7)) s += 10; if (s > bs) { bs = s; best = p; } });
        tgt = best || tg[0] || P;
      }
      T.tgt = tgt.key; T.det = T.det || {};
      const real = G.P; G.P = tgt; T.detect = T.det[tgt.key] || 0;
      updateTeacher(dt);
      T.det[tgt.key] = T.detect; G.P = real;
      Object.keys(T.det).forEach(k => { if (k !== tgt.key) T.det[k] = Math.max(0, T.det[k] - dt * 0.45); });
      T.detShow = T.det.me || 0;
    }
    updateKids(dt);
  } else {
    if (T.net) { Net.smooth(T, dt); T.ang = T.net.a; T.state = T.net.st; T.gone = !!T.net.g; T.detShow = T.net.dm || 0; if (T.gone) { T.x = -9999; T.y = -9999; } }
    if (T.bubble) { T.bubble.t += dt; if (T.bubble.t > T.bubble.dur) T.bubble = null; }
    if (T.markT > 0) T.markT -= dt;
    G.kids.forEach(k => { if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; } if (k.net) { const a = k.net; if (Math.abs(a[0] - k.x) + Math.abs(a[1] - k.y) > 80) { k.x = a[0]; k.y = a[1]; } else { const ox = k.x, oy = k.y; k.x += (a[0] - k.x) * Math.min(1, dt * 12); k.y += (a[1] - k.y) * Math.min(1, dt * 12); k.dist = (k.dist || 0) + Math.hypot(k.x - ox, k.y - oy); } k.face = a[2]; k.moving = !!a[3]; if (a.length > 5) k.ang = a[5]; } });
  }
  updateDoors(dt); petFollow(P, dt); if (Q.fl === I.cur) petFollow(Q, dt);
  infUpdate(dt); if (G.mode !== 'play') return;
  // cœur qui bat, musique
  if (!T.gone) { const d = dist(T.x, T.y, P.x, P.y) / 16; G.heartT -= dt; if (d < 7 && T.state !== 'sleep' && G.heartT <= 0) { G.heartT = 0.35 + d * 0.11; AU.sfx('heart', clamp(1 - d / 7, 0.15, 1) * (T.state === 'chase' ? 1 : 0.6)); UI.heart(); } }
  AU.play(T.state === 'chase' && !T.gone ? 'chase' : 'sneak');
  if (I.cdDiv > 0) I.cdDiv -= dt; if (I.cdPing > 0) I.cdPing -= dt;
  // fin de partie
  if (P.out && Q.out) { G.mode = 'result'; Multi.resultCoop('win'); return; }
  if (P.jail && Q.jail) { G.mode = 'result'; Multi.resultCoop('jail'); Net.send({ t: 'end', r: 'jail' }); return; }
  Net.timeLeft -= dt;
  if (Net.isHost && Net.timeLeft <= 0) { Net.send({ t: 'end', r: 'time' }); G.mode = 'result'; Multi.resultCoop('time'); return; }
  Net.tick(dt);
}
// ---------- attrapé : direction la salle de colle ----------
function coopCaught(who, reason) {
  const I = G.inf, T = G.T, eng = T.prof && T.prof.lesson;
  // un squishy dans le sac : SPLOTCH, seconde chance
  { const mine = who === (I.me || G.P);
    if (mine ? squishyCount(who) > 0 : (who.sqN || 0) > 0) {
      let id; if (mine) id = squishyTake(who); else { id = who.sqId || 0; who.sqN--; Net.send({ t: 'sqUse' }); }
      if (mine && who.hidden) { const s = who.hidden; who.hidden = null; const st = s.stand[0]; who.x = st[0] * 16 + 8; who.y = st[1] * 16 + 12; }
      const text = squishyBlast(T, who, id, true);
      Net.send({ t: 'sqFx', fl: I.cur, id, me: mine ? 1 : 0, text });
      if (mine) squishyToast(T, id); else toast('🧸 SPLOTCH ! Le squishy de ' + (who.cfg && who.cfg.name || 'ton équipier') + ' aveugle ' + T.prof.name + ' !', 2.6);
      return;
    } }
  // le compagnon fait fuir le prof
  if (who.pet && who.pet.charges > 0 && who.pet.leaveT == null) { const remote = who !== (I.me || G.P); petScare(T, who, remote); if (remote) Net.send({ t: 'petUse' }); return; }
  if (eng) {
    T.state = 'release'; T.st = 3.5; T.path = null; T.detect = 0; T.det = {}; T.knows = null; I.grace = Math.max(I.grace, 3);
    I.hunt = false; I.hideT = 0; I.warn = Math.min(I.warn, 2); UI.infSig = null; UI.hudSig = null; Net.send({ t: 'twarn', n: I.warn, hunt: 0, you: 0, text: '', silent: 1 });
    if (who === (I.me || G.P)) { if ((G.lessons || 0) < LESSON_MAX) lessonStart(reason); else coopJail(); }
    else { who.jailMove = G.time; Net.send({ t: 'caughtYou', eng: 1, r: reason }); toast((T.prof.lesson === 'hist' ? '🦴 ' : '🇬🇧 ') + T.prof.name + ' coince ' + (who.cfg.name || 'ton coéquipier') + ' : ' + (T.prof.lesson === 'hist' ? 'interro surprise !' : 'English lesson !'), 2.6); }
    return;
  }
  T.state = 'patrol'; T.path = null; T.detect = 0; T.det = {}; T.knows = null; I.grace = Math.max(I.grace, 3);
  // un élève attrapé : les profs se calment (mais un seul avertissement de plus avant la poursuite)
  I.hunt = false; I.hideT = 0; I.warn = Math.min(I.warn, 2); UI.infSig = null; UI.hudSig = null; Net.send({ t: 'twarn', n: I.warn, hunt: 0, you: 0, text: '', silent: 1 });
  T.bubble = { text: 'ATTRAPÉ·E ! Direction la salle de colle, ' + (who.cfg.name || 'toi') + ' !', t: 0, dur: 2.6 };
  Net.send({ t: 'bub', w: 'T', text: T.bubble.text, dur: 2.6 });
  AU.sfx('caught', 0.7); G.shake = 0.3; puff(who.x, who.y - 10, 16, '#ffffff');
  if (who === (I.me || G.P)) coopJail();
  else { who.jailMove = G.time; Net.send({ t: 'caughtYou' }); toast('😱 ' + (who.cfg.name || 'Ton coéquipier') + ' s’est fait coincer. Libère-le/la en salle de colle (1er) !', 3); }
}
function coopJail() {
  const I = G.inf, P = G.P; if (!I.jail) return;
  if (P.hidden) unhide(); P.hidden = null; P.busy = null; P.small = 0; P.jail = true; P.jailT = 0; I.colles = (I.colles || 0) + 1;
  infSave();
  if (I.cur !== 1) infLoad(1);
  I.floors[1].doors.forEach(d => { if (d.jail) { d.locked = true; d.byPlayer = false; d.target = 0; d.open = 0; } }); Net.send({ t: 'jailLock' });
  const sp = I.jail.spots[Math.floor(Math.random() * I.jail.spots.length)];
  P.x = sp[0] * 16 + 8; P.y = sp[1] * 16 + 12; P.fl = 1; G.camX = null;
  infRepark(); coopFloorAuth();
  FX.iris = { mode: 'in', t: 0, dur: 0.6 }; AU.sfx('fail');
  UI.banner('🚨 Attrapé·e ! Direction : salle de colle (1er).');
  toast('Coincé·e ! ' + (G.P2.cfg.name || 'Ton coéquipier') + ' peut te libérer. Sinon : 60 s.', 3);
}
function coopAutoRelease() {
  const I = G.inf, P = G.P; P.jail = false; P.jailT = 0;
  infSave(); if (I.cur !== INF_TOP) infLoad(INF_TOP);
  P.x = P.seat[0] * 16 + 8; P.y = P.seat[1] * 16 + 12; P.fl = INF_TOP; G.camX = null; infRepark(); coopFloorAuth();
  FX.iris = { mode: 'in', t: 0, dur: 0.6 };
  UI.banner('🧑‍🏫 La maîtresse te ramène en classe. Retour case départ !');
}
function coopEscape(ex, tx, ty) {
  const I = G.inf, P = G.P; if (P.out) return;
  if (P.hidden) unhide(); P.busy = null; P.out = true; P.outT = 0;
  AU.sfx('win'); confetti(P.x, P.y - 10, 50); FX.winA = 0;
  if (ex && ex.gate) Net.send({ t: 'gateDone' });
  I.auth = false; Net.send({ t: 's', fl: I.cur, x: -9999, y: -9999, f: 0, m: 0, r: 0, out: 1 });
  UI.banner(G.P2.out ? '🎉 Vous êtes dehors tous les deux !' : '🎉 Tu es dehors ! Guide ' + (G.P2.cfg.name || 'ton coéquipier') + ' avec 📍 et le plan.');
  I.plan = true; UI.hudSig = null;
}
// ---------- actions spéciales en équipe ----------
function coopActions(cand, P) {
  const I = G.inf, Q = G.P2;
  if (P.out) return;
  const [ptx, pty] = tileOf(P);
  for (const [dx, dy] of D4) {
    const x = ptx + dx, y = pty + dy; if (G.m.get(x, y) !== K.DOOR) continue; const dr = doorAt(x, y); if (!dr) continue;
    // libérer le coéquipier
    if (dr.jail && dr.locked && Q.jail && I.cur === 1 && !P.jail) cand.push({ id: 'free', door: dr, icon: '🔓', label: 'Libérer', sub: Q.cfg.name || 'ton coéquipier', prio: 0.05, d: 0 });
    // toc toc à une salle de classe occupée
    if (!dr.locked && dr.open < 0.3) { const w = coopWatcherBehind(dr); if (w && !inRectT(P, w.room)) cand.push({ id: 'knock', door: dr, icon: '✊', label: 'Toc toc !', sub: 'faire sortir le prof', prio: 3.2, d: 6 }); }
  }
}
function coopWatcherBehind(d) {
  return G.kids.find(k => k.isWatcher && k.room && d.x >= k.room.x - 1 && d.y >= k.room.y - 1 && d.x <= k.room.x + k.room.w && d.y <= k.room.y + k.room.h && !['warn', 'evac', 'door', 'doorlook'].includes(k.state));
}
function coopDo(a) {
  const I = G.inf, P = G.P, Q = G.P2;
  switch (a.id) {
    case 'gateTwo': AU.sfx('bump'); toast('🚧 Trop lourd ! Il faut être deux.', 2.2); return true;
    case 'free': P.busy = { label: 'Je crochète la serrure…', dur: 2, t: 0, done: () => {
      I.floors[1].doors.forEach((d, i) => { if (d.jail && d.locked) { d.locked = false; d.byPlayer = false; Net.send({ t: 'lock', i, l: 0, fl: 1 }); } });
      Net.send({ t: 'freed' }); AU.sfx('lock'); AU.sfx('found'); toast('🔓 ' + (Q.cfg.name || 'Ton coéquipier') + ' est libre !', 2.4); } }; AU.sfx('keys', 0.5); return true;
    case 'knock': {
      AU.sfx('door', 0.6); cue(a.door.x * 16 + 8, a.door.y * 16, 'word', 'TOC TOC !', { col: '#ffd23f', pop: true });
      const i = G.doors.indexOf(a.door);
      if (I.auth) coopKnock(i); else Net.send({ t: 'knock', i });
      toast('✊ Toc toc ! Le prof arrive… cache-toi !', 2.2); return true;
    }
  }
  return false;
}
// le prof va voir qui frappe
function coopKnock(i) {
  const d = G.doors[i]; if (!d) return; const w = coopWatcherBehind(d); if (!w) return;
  const inner = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [d.x + dx, d.y + dy]).find(([x, y]) => G.m.get(x, y) === K.FLOOR && x >= w.room.x && y >= w.room.y && x < w.room.x + w.room.w && y < w.room.y + w.room.h);
  if (!inner) return;
  infSay(w, pick(['Qui frappe ?', 'Entrez !', 'Oui ? C’est pour quoi ?', 'J’arrive, j’arrive…']), 1.8);
  if (goTo(w, inner[0], inner[1])) { w.state = 'walk'; w.next = 'doorlook'; w.knockDoor = d; w.knockSent = false; w.doorAng = Math.atan2(d.y * 16 + 8 - (inner[1] * 16 + 8), d.x * 16 + 8 - (inner[0] * 16 + 8)); }
}
// diversion : un grand BADABOUM pour attirer les profs
function coopDiversion() {
  const I = G.inf, P = G.P; if (!I || !I.coop || P.out || P.hidden || (I.cdDiv || 0) > 0 || G.mode !== 'play') return;
  I.cdDiv = 20; AU.sfx('bump'); AU.sfx('boing'); G.shake = 0.25; hop(P, 90);
  cue(P.x, P.y - 30, 'word', pick(['BADABOUM !', 'CRAAASH !', 'PATATRAS !']), { col: '#ff8a3a', pop: true, life: 1.3 });
  makeNoise(P.x, P.y, 11, 'BADABOUM !');
  if (I.auth) coopLookAt(P.x, P.y); else Net.send({ t: 'divert', x: Math.round(P.x), y: Math.round(P.y) });
  toast('🥁 BADABOUM ! Les profs rappliquent. Cache-toi !', 2.4);
}
function coopLookAt(x, y) { G.kids.forEach(k => { if (!k.isWatcher || k.state === 'evac' || dist(k.x, k.y, x, y) > 8 * 16) return; k.state = 'look'; k.st = 3.5; k.lookBase = Math.atan2(y - k.y, x - k.x); setMark(k, '?', 1); }); }
function coopPing() {
  const I = G.inf; if (!I || !(I.coop || I.guard) || (I.cdPing || 0) > 0) return; const P = I.guard ? G.T : G.P; I.cdPing = 1.5;
  Net.send({ t: 'ping', x: Math.round(P.x), y: Math.round(P.y), fl: I.cur }); AU.sfx('ding', 0.5);
  cue(P.x, P.y - 36, 'word', '📍', { pop: true, life: 1.2 });
}
// ---------- réception des messages d'équipe ----------
function coopRecv(d) {
  const I = G.inf, P = G.P, Q = G.P2, T = G.T;
  switch (d.t) {
    case 's': {
      const was = Q.fl; if (d.jail && !Q.jail) I.colles = (I.colles || 0) + 1; Q.out = !!d.out; Q.jail = !!d.jail; Q.pg = !!d.pg;
      if (Q.out) { Q.fl = d.fl; Q.x = -9999; Q.y = -9999; Q.net = null; Q.away = true; Q.last = null; if (!P.out) coopTakeAuth(); return true; }
      Q.hidF = d.h >= 0; Q.lesson = !!d.ls; Q.sqN = d.sq || 0; Q.sqId = d.sqi || 0;
      if (d.pk >= 0 && d.pc > 0) { if (!Q.pet || Q.pet.i !== d.pk) Q.pet = { i: d.pk, e: PETS[d.pk].e, n: PETS[d.pk].n, charges: d.pc, x: Q.x, y: Q.y, t: 0 }; else Q.pet.charges = d.pc; } else Q.pet = null;
      infRecvPos(Q, d); if (d.jail) Q.jailMove = 0;
      if (was === I.cur && Q.fl !== I.cur && !P.out) coopTakeAuth();   // il est parti : je reprends la main
      return true;
    }
    case 'ai': if (d.fl === I.cur) { if (I.auth && Net.isHost) return true; I.auth = false; T.net = d; } return true;
    case 'k': if (!I.auth && d.fl === I.cur) d.a.forEach(a => { const k = G.kids[a[0]]; if (k) k.net = a.slice(1); }); return true;
    case 'bub': if (d.fl === I.cur) { const tgt = d.w === 'T' ? T : G.kids[d.w]; if (tgt) { if (d.w === 'T') tgt.bubble = { text: d.text, t: 0, dur: d.dur }; else tgt.bub = { text: d.text, t: 0, dur: d.dur }; } } return true;
    case 'twarn':
      I.warn = d.n; I.hunt = !!d.hunt; UI.infSig = null; UI.hudSig = null;
      if (d.silent) return true;
      if (d.you) { G.shake = 0.18; AU.sfx('whistle', 0.6); toast(d.hunt && !d.text ? '🚨 On te court après !' : (I.warn < 3 ? '⚠️ Repéré·e ! ' + I.warn + '/3. Discrétion, on a dit.' : '🚨 3/3. La prochaine fois, ça court !'), 2.8); }
      else if (!d.hunt) toast('⚠️ ' + (Q.cfg.name || 'Ton coéquipier') + ' s’est fait repérer (' + I.warn + '/3). Bravo…', 2);
      return true;
    case 'look': Q.cfg = d.cfg; return true;
    case 'dopen': if (d.fl === I.cur && G.doors[d.i]) G.doors[d.i].forceT = d.d; return true;
    case 'calm': I.hunt = false; I.warn = 2; I.hideT = 0; UI.infSig = null; UI.hudSig = null; UI.banner('😮‍💨 Fausse alerte… ils ont arrêté de vous chercher !'); if (I.auth && !G.T.gone && G.T.state !== 'evac') { G.T.state = 'patrol'; G.T.path = null; G.T.knows = null; } AU.play('sneak'); return true;
    case 'cnoise': if (I.auth && d.fl === I.cur) makeNoise(d.x, d.y, d.r, d.w, d.k); return true;
    case 'divert': if (I.auth && d.fl === I.cur) coopLookAt(d.x, d.y); if (d.fl === I.cur) cue(d.x, d.y - 30, 'word', 'BADABOUM !', { col: '#ff8a3a', pop: true, life: 1.3 }); return true;
    case 'knock': if (I.auth && d.fl === I.cur) coopKnock(d.i); return true;
    case 'jailLock': I.floors[1].doors.forEach(dr => { if (dr.jail) { dr.locked = true; dr.byPlayer = false; } }); return true;
    case 'caughtYou': if (!P.jail && !P.out && !P.lesson) { if (d.eng && (G.lessons || 0) < LESSON_MAX) lessonStart(d.r); else coopJail(); } return true;
    case 'lessonDone': toast(d.ok ? '✅ ' + (Q.cfg.name || 'Ton coéquipier') + ' a bien répondu à ' + (d.who || 'la prof') + ' !' : '❌ ' + (Q.cfg.name || 'Ton coéquipier') + ' s’est planté·e. Objets confisqués !', 2.4); return true;
    case 'petUse': if (P.pet) petUsed(P, G.T); return true;
    case 'sqUse': case 'sqFx': squishyRecv(d); return true;
    case 'freed': if (P.jail) { P.jail = false; P.jailT = 0; UI.banner('🔓 ' + (Q.cfg.name || 'Ton coéquipier') + ' t’a libéré·e ! File !'); AU.sfx('found'); } return true;
    case 'ping': I.ping = { x: d.x, y: d.y, fl: d.fl, t: 0, room: '', who: Q.cfg.name }; AU.sfx('ding', 0.4); if (d.fl !== I.cur) toast('📍 ' + (Q.cfg.name || 'Ton coéquipier') + ' t’appelle (' + INF_FLOOR_META[d.fl].name + ')', 1.8); return true;
    case 'gateDone': { const ex = G.L.exits && G.L.exits.find(e => e.gate); if (I.cur === 0 && ex && P.busy && P.busy.ex === ex) { P.busy = null; escape(ex, ex.x, ex.y); } return true; }
    case 'planTaken': I.plan = true; toast('🗺️ ' + (Q.cfg.name || 'Ton coéquipier') + ' a le plan : touche 🗺️ !', 2.4); UI.hudSig = null; return true;
    case 'trousseau': I.keys = true; toast('🔑 ' + (Q.cfg.name || 'Ton coéquipier') + ' a piqué le trousseau !', 2.6); AU.sfx('keys'); UI.hudSig = null; return true;
    case 'call': if (d.ok) UI.banner('📋 L’appel : vous êtes là tous les deux. Anges innocents.'); else { I.hunt = true; I.warn = 3; UI.banner('📋 Il manque des élèves ! Tout le collège vous cherche…'); } return true;
    case 'end': if (G.mode !== 'result') { G.mode = 'result'; Multi.resultCoop(d.r || 'time'); } return true;
  }
  return false;
}
// envois réguliers : ma position (20 Hz) et, si j'ai la main sur l'étage du coéquipier, les profs et élèves
function coopNetTick(dt) {
  const I = G.inf, P = G.P, T = G.T, Q = G.P2, N = Net;
  N.sendT -= dt; N.kidsT -= dt;
  if (N.sendT <= 0) {
    N.sendT = 0.05;
    const pg = P.busy && P.busy.ex && P.busy.ex.gate ? 1 : 0;
    N.send({ t: 's', fl: I.cur, x: P.out ? -9999 : +P.x.toFixed(1), y: P.out ? -9999 : +P.y.toFixed(1), f: P.face, m: P.moving ? 1 : 0, r: P.running ? 1 : 0, sm: P.small > 0 ? 1 : 0, sl: P.slip > 0 ? 1 : 0, h: P.hidden ? P.hidden.idx : -1, sk: P.skidT > 0 ? 1 : 0, out: P.out ? 1 : 0, jail: P.jail ? 1 : 0, pg, ls: P.lesson ? 1 : 0, pk: P.pet && P.pet.leaveT == null ? P.pet.i : -1, pc: P.pet ? P.pet.charges : 0, sq: squishyCount(P), sqi: P.sqIds && P.sqIds.length ? P.sqIds[0] : 0 });
    if (I.auth && Q.fl === I.cur && T) N.send({ t: 'ai', x: +T.x.toFixed(1), y: +T.y.toFixed(1), a: +T.ang.toFixed(2), f: T.face, m: T.moving ? 1 : 0, r: T.running ? 1 : 0, st: T.state, g: T.gone ? 1 : 0, dm: +((T.det && T.det.them) || 0).toFixed(2) });
  }
  if (N.kidsT <= 0) {
    N.kidsT = 0.1;
    if (I.auth && Q.fl === I.cur) { const a = []; G.kids.forEach((k, i) => { if (k.beh !== 'sit' && k.beh !== 'crowd') a.push([i, Math.round(k.x), Math.round(k.y), k.face, k.moving ? 1 : 0, 0, +((k.ang || 0).toFixed(2))]); }); N.send({ t: 'k', a }); }
  }
  const lag = (performance.now() - N.lastRecv) / 1000;
  if (lag > 4 && G.mode === 'play') { if (!N.lagShown) { N.lagShown = true; UI.banner('📶 Connexion lente… on attend ton coéquipier'); } } else N.lagShown = false;
}
