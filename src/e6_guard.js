// ================= SURVEILLANTS EN ÉQUIPE =================
// Les deux joueurs sont surveillants. Deux élèves (joués par l'ordinateur) tentent de s'échapper :
// ils quittent leur classe du 3e, descendent les escaliers (alternés), crochètent la grille du 1er
// et filent par la cour. S'ils voient un surveillant, ils se cachent ou s'enfuient.
// L'hôte fait bouger les fugueurs sur tous les étages et envoie leurs positions à l'invité.
const GUARD_TIME = 360;
const GUARD_LOOK = [1, 0];   // hôte : M. Carnet · invité : Kévin
const FUG_ST = ['seat', 'go', 'flee', 'hide', 'pick', 'exit', 'caught', 'out'];
function guardProf(i) {
  const p = PROFS[GUARD_LOOK[i]];
  return Object.assign({}, p, { title: 'le surveillant', intercom: false, hasKeys: false, lines: Object.assign({}, p.lines, { caught: 'Toi, tu passes la journée en salle de colle !' }) });
}
const guardName = T => T && T.prof ? T.prof.name : 'ton coéquipier';
// mise en place (appelée par infStart)
function guardSetup(I, R, mopt) {
  const me = mopt.host ? 0 : 1, startF = mopt.host ? 0 : 2, otherF = mopt.host ? 2 : 0;
  I.guard = true; I.plan = true; I.caughtN = 0; I.outN = 0; I.rumorT = 40; I.cur = startF;
  const T = newTeacher(guardProf(me), I.floors[startF].L); T.state = 'free'; T.fl = startF; T.hasKeys = false; G.T = T;
  const T2 = newTeacher(guardProf(1 - me), I.floors[otherF].L); T2.state = 'free'; T2.fl = otherF; T2.x = -9999; T2.y = -9999; T2.away = true; T2.isPartner = true; G.T2 = T2;
  const P = G.P; P.x = -9999; P.y = -9999; P.fl = -1; P.cfg = { name: 'les fugueurs' };
  const seats = [I.seat, I.seat2];
  I.fugs = mopt.fugs.map((cfg, i) => ({ i, cfg, fl: INF_TOP, x: seats[i][0] * 16 + 8, y: seats[i][1] * 16 + 12, face: 1, ang: -Math.PI / 2, st: 'seat', t: i ? 26 + R.f() * 12 : 8 + R.f() * 8,
    path: null, pi: 0, hide: -1, dist: 0, anim: 0, moving: false, running: false, markT: 0, calmT: 0, planT: 0, isFug: true, ph: R.f() * 6 }));
}
// ---------- déplacements des fugueurs (sur n'importe quel étage) ----------
function fugDoors(F) { const I = G.inf; return F === I.floors[I.cur] ? { doors: G.doors, idx: G.doorIdx } : { doors: F.doors, idx: F.doorIdx }; }
function fugPass(F) { const m = F.L.m, D = fugDoors(F); return (x, y) => { if (!passT(m, x, y)) return false; const i = D.idx[y * m.w + x]; return !(i >= 0 && D.doors[i] && D.doors[i].locked); }; }
function fugNear(F, x, y) { const pass = fugPass(F); if (pass(x, y)) return [x, y]; for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (pass(x + dx, y + dy)) return [x + dx, y + dy]; return [x, y]; }
function fugTile(f) { return [Math.floor(f.x / 16), Math.floor((f.y - 4) / 16)]; }
function fugPath(F, from, to) {
  const m = F.L.m, w = m.w, d = bfs(m, to[0], to[1], fugPass(F)); let [x, y] = from, k = d[y * w + x];
  if (k < 0) return null;
  const path = [];
  while (k > 0) { let ok = false; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || d[ny * w + nx] !== k - 1) continue; x = nx; y = ny; k--; path.push([x, y]); ok = true; break; } if (!ok) break; }
  return path;
}
function fugMove(f, sp, dt) {
  if (!f.path || f.pi >= f.path.length) { f.moving = false; return 'done'; }
  const [tx, ty] = f.path[f.pi], cx = tx * 16 + 8, cy = ty * 16 + 12, dx = cx - f.x, dy = cy - f.y, d = Math.hypot(dx, dy), st = sp * dt;
  if (d > 0.01) { f.ang = Math.atan2(dy, dx); f.face = faceFromAng(f.ang); }
  f.moving = true; f.dist += Math.min(st, d); f.anim += dt * sp / 22;
  if (d <= st) { f.x = cx; f.y = cy; f.pi++; if (f.pi >= f.path.length) { f.moving = false; return 'done'; } return 'moving'; }
  f.x += dx / d * st; f.y += dy / d * st; return 'moving';
}
function fugLos(F, ax, ay, bx, by) {
  const m = F.L.m, D = fugDoors(F), n = Math.ceil(Math.hypot(bx - ax, by - ay) / 4);
  for (let i = 1; i < n; i++) {
    const tx = Math.floor((ax + (bx - ax) * i / n) / 16), ty = Math.floor((ay + (by - ay) * i / n) / 16), k = m.get(tx, ty);
    if (k === K.DOOR) { const dr = D.doors[D.idx[ty * m.w + tx]]; if (dr && dr.open < 0.5) return false; continue; }
    if (KP[k] && KP[k].opaque === 1) return false;
  }
  return true;
}
// où sont les surveillants (vu par l'hôte)
function guardSurvs() {
  const I = G.inf, T = G.T, Q = G.T2, out = [{ x: T.x, y: T.y, fl: I.cur, T }];
  const q = Q.x > -9000 ? Q : Q.last; if (q && Q.fl != null) out.push({ x: q.x, y: q.y, fl: Q.fl, T: Q });
  return out;
}
function fugSay(f, text) { f.bub = { text, t: 0, dur: 1.8 }; }
// ---------- le cerveau des fugueurs (hôte) ----------
function fugPlan(f, F) {
  const I = G.inf; f.planT = 1;
  let goal;
  if (f.fl > 0) { const s = I.downVia[f.fl]; goal = fugNear(F, F.L.stairs[s][0], F.L.stairs[s][1]); f.goal = 'stairs'; }
  else {
    // le portail (on l'escalade) ou le trou sous la grille (on se faufile)
    const ex = (F.L.exits || []).filter(e => e.x != null && e.y != null && (e.from || e.type === 'small' || e.gate));
    f.ex = f.ex || pick(ex); const e = f.ex; if (!e) return;
    goal = e.from ? e.from.slice() : fugNear(F, e.x, e.y); f.goal = 'exit';
  }
  f.path = fugPath(F, fugNear(F, ...fugTile(f)), goal); f.pi = 0;
}
function fugDown(f) {
  const I = G.inf, s = I.downVia[f.fl]; f.fl -= 1;
  const NF = I.floors[f.fl], [x, y] = fugNear(NF, NF.L.stairs[s][0], NF.L.stairs[s][1]);
  f.x = x * 16 + 8; f.y = y * 16 + 12; f.st = 'go'; f.path = null; f.calmT = 0.6; f.ex = null;
}
function fugArrive(f, F) {
  const I = G.inf;
  if (f.goal === 'stairs') {
    if (f.fl === 1 && !I.keys && !I.alarm) { f.st = 'pick'; f.t = 12; f.pickT = 0; guardAlert('🔔 Cling, cling… Quelqu’un crochète la grille de l’escalier du 1er étage !', 1); }
    else fugDown(f);
  } else if (f.goal === 'exit') { f.st = 'exit'; f.t = f.ex && f.ex.gate ? 7 : 5; }
}
// vu par un surveillant : se cacher, ou s'enfuir
function fugReact(f, F, s, sd) {
  const I = G.inf, m = F.L.m, here = fugNear(F, ...fugTile(f)), d = bfs(m, here[0], here[1], fugPass(F));
  f.markT = 1.4; fugSay(f, pick(['Oups !', 'Il m’a vu·e !', 'Vite, on se cache !', 'Chut…', 'Aïe aïe aïe !']));
  let best = null, bs = -1e9;
  (F.L.hides || []).forEach(h => {
    const st = h.stand && h.stand[0]; if (!st) return;
    if (I.fugs.some(o => o !== f && o.fl === f.fl && o.hide === h.idx)) return;
    const pd = d[st[1] * m.w + st[0]]; if (pd < 0 || pd > 16) return;
    const ds = dist(st[0] * 16 + 8, st[1] * 16 + 12, s.x, s.y) / 16; if (ds < 3.5) return;
    const sc = ds * 1.1 - pd * 0.55 + Math.random() * 2; if (sc > bs) { bs = sc; best = h; }
  });
  let to = null;
  if (best) { to = best.stand[0]; f.hideSpot = best; }
  else {
    let bt = null, bd = -1; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const pd = d[y * m.w + x]; if (pd < 5 || pd > 14) continue; const ds = dist(x * 16 + 8, y * 16 + 12, s.x, s.y) + Math.random() * 20; if (ds > bd) { bd = ds; bt = [x, y]; } }
    to = bt; f.hideSpot = null;
  }
  f.path = to ? fugPath(F, here, to) : null; f.pi = 0; f.st = 'flee'; f.running = sd < 4.5 * 16; f.calmT = 0;
}
function fugHide(f, h) { f.hide = h.idx; f.stand = h.stand[0].slice(); f.x = h.x * 16 + 8; f.y = h.y * 16 + 12; f.st = 'hide'; f.t = rand(6, 11); f.moving = false; f.running = false; }
function fugUnhide(f) { f.hide = -1; if (f.stand) { f.x = f.stand[0] * 16 + 8; f.y = f.stand[1] * 16 + 12; } f.st = 'go'; f.path = null; f.calmT = 1.6; }
function fugSim(dt) {
  const I = G.inf, survs = guardSurvs();
  I.fugs.forEach(f => {
    if (f.st === 'caught' || f.st === 'out') return;
    f.t -= dt; if (f.markT > 0) f.markT -= dt; if (f.calmT > 0) f.calmT -= dt; if (f.planT > 0) f.planT -= dt;
    const F = I.floors[f.fl]; let seen = null, sd = 1e9;
    survs.forEach(s => { if (s.fl !== f.fl) return; const d = dist(s.x, s.y, f.x, f.y); if (d < 6.5 * 16 && d < sd && fugLos(F, f.x, f.y - 8, s.x, s.y - 10)) { seen = s; sd = d; } });
    switch (f.st) {
      case 'seat': f.beh = 'sit'; if (f.t <= 0) { f.st = 'go'; f.beh = null; f.path = null; } break;
      case 'go': {
        f.running = false;
        if (seen && f.calmT <= 0) { fugReact(f, F, seen, sd); break; }
        if (!f.path) { if (f.planT <= 0) fugPlan(f, F); if (!f.path) break; }
        if (fugMove(f, 2.15 * 16, dt) === 'done') fugArrive(f, F);
        break;
      }
      case 'flee':
        if (fugMove(f, (f.running ? 3.7 : 2.4) * 16, dt) === 'done') { if (f.hideSpot) fugHide(f, f.hideSpot); else { f.st = 'go'; f.path = null; f.calmT = 2; } }
        break;
      case 'hide':
        if (seen && sd < 3 * 16) f.t = Math.max(f.t, 2);
        if (f.t <= 0) fugUnhide(f);
        break;
      case 'pick':
        f.moving = false;
        if (seen && sd < 4 * 16) { fugReact(f, F, seen, sd); break; }
        if (f.t <= 0) fugDown(f);
        break;
      case 'exit':
        f.moving = false;
        if (seen && sd < 3 * 16) { fugReact(f, F, seen, sd); break; }
        if (f.t <= 0) { f.st = 'out'; I.outN++; Net.send({ t: 'gOut', i: f.i, n: I.outN }); guardOutFx(f); }
        break;
    }
  });
  // une rumeur de temps en temps
  I.rumorT -= dt;
  if (I.rumorT <= 0) {
    I.rumorT = 40;
    const free = I.fugs.filter(f => !['caught', 'out', 'seat'].includes(f.st));
    if (free.length) { const f = pick(free); guardAlert('📢 Un élève a été aperçu ' + (f.fl === 0 ? 'au rez-de-chaussée' : 'au ' + INF_FLOOR_META[f.fl].name) + ' !', f.fl); }
  }
}
// ---------- attraper ----------
function fugCatch(i, how, by) {
  const I = G.inf, f = I.fugs[i]; if (!f || f.st === 'caught' || f.st === 'out') return;
  f.st = 'caught'; f.hide = -1; I.caughtN++;
  Net.send({ t: 'gCaught', i, how, by, n: I.caughtN });
  guardCaughtFx(f, how, by);
}
function guardCaughtFx(f, how, by) {
  const I = G.inf, mine = by === guardName(G.T);
  if (f.fl === I.cur) { puff(f.x, f.y - 10, 18, '#ffffff'); cue(f.x, f.y - 34, 'word', how === 'found' ? 'TROUVÉ !' : 'ATTRAPÉ !', { col: '#ffd23f', pop: true, life: 1.4 }); }
  AU.sfx('caught', 0.7); G.shake = 0.3; FX.punch(0.12);
  UI.banner((mine ? '🎉 Bien joué ! ' : '🎉 ' + by + ' a ') + (mine ? 'Un fugueur attrapé' : 'attrapé un fugueur') + ' ! (' + I.caughtN + '/2) — direction la salle de colle !');
  UI.hudSig = null;
}
function guardOutFx(f) {
  const I = G.inf; AU.sfx('fail'); G.shake = 0.2;
  UI.banner('😱 Un fugueur s’est échappé du collège ! (' + I.outN + ' évadé' + (I.outN > 1 ? 's' : '') + ')'); UI.hudSig = null;
}
function guardAlert(text, fl) { Net.send({ t: 'gAlert', text, fl }); guardAlertFx(text, fl); }
function guardAlertFx(text, fl) { UI.banner(text); AU.sfx('ding', 0.5); const I = G.inf; I.ping = { x: -1, y: -1, fl, t: 0, room: '', who: 'rumeur' }; }
// un surveillant tente sa chance (bouton ✋ ou fouille)
function guardTry(f, how) {
  const T = G.T; hop(T, 60); AU.sfx('whistle', 0.4);
  if (Net.isHost) fugCatch(f.i, how, guardName(T)); else Net.send({ t: 'gGrab', i: f.i, how, by: guardName(T) });
}
// ---------- mise à jour (remplace netUpdate pour ce mode) ----------
function guardUpdate(dt) {
  const I = G.inf, T = G.T, Q = G.T2;
  updateTeacherLocal(dt); if (G.mode !== 'play') return;
  if (Q.net && Q.fl === I.cur) { Net.smooth(Q, dt); Q.ang = Q.net.a; Q.state = Q.net.st; }
  if (Q.bubble) { Q.bubble.t += dt; if (Q.bubble.t > Q.bubble.dur) Q.bubble = null; }
  G.kids.forEach(k => { if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; } });
  updateKids(dt);
  if (Net.isHost) fugSim(dt);
  else I.fugs.forEach(f => { const s = f.net; if (!s) return; if (Math.abs(s[1] - f.x) + Math.abs(s[2] - f.y) > 64) { f.x = s[1]; f.y = s[2]; } else { const ox = f.x, oy = f.y; f.x += (s[1] - f.x) * Math.min(1, dt * 12); f.y += (s[2] - f.y) * Math.min(1, dt * 12); f.dist += Math.hypot(f.x - ox, f.y - oy); } if (f.markT > 0) f.markT -= dt; });
  // ce que je vois des fugueurs
  const pr = T.prof, R = Math.max(7.5, pr.range) * 16, fov = Math.max(1.0, pr.fov), ex = T.x, ey = T.y - 12;
  I.fugs.forEach(f => {
    if (f.bub) { f.bub.t += dt; if (f.bub.t > f.bub.dur) f.bub = null; }
    f.vis = false; if (f.fl !== I.cur || f.st === 'caught' || f.st === 'out' || f.st === 'hide') return;
    const d = Math.hypot(f.x - ex, f.y - 10 - ey);
    if (d < R && (d < 28 || Math.abs(angDiff(Math.atan2(f.y - 10 - ey, f.x - ex), T.ang)) < fov) && los(ex, ey, f.x, f.y - 10)) f.vis = true;
    if (f.running && f.moving) stepCues(f, f.vis, dt, 0);
    if (f.st === 'pick') { f.pickT = (f.pickT || 0) - dt; if (f.pickT <= 0) { f.pickT = 1.1; const dd = dist(f.x, f.y, T.x, T.y) / 16; if (dd < 12) { cue(f.x, f.y - 26, 'word', 'CLING', { col: '#9fd7ff', life: 0.9 }); AU.sfx('keys', clamp(1 - dd / 12, 0.1, 0.5)); } } }
  });
  updateDoors(dt);
  infUpdate(dt); if (G.mode !== 'play') return;
  AU.play(I.fugs.some(f => f.vis && (f.st === 'flee' || f.running)) ? 'chase' : 'sneak');
  Net.timeLeft -= dt;
  if (Net.isHost) {
    const done = I.fugs.every(f => f.st === 'caught' || f.st === 'out');
    if (done || Net.timeLeft <= 0) { const r = { t: 'gEnd', c: I.caughtN, o: I.outN, time: Net.timeLeft <= 0 ? 1 : 0 }; Net.send(r); guardEnd(r); return; }
  }
  Net.tick(dt);
}
function guardEnd(r) { if (G.mode === 'result') return; G.mode = 'result'; Lesson.abort(); Multi.resultGuard(r.c, r.o, !!r.time); }
// ---------- réseau ----------
function guardNetTick(dt) {
  const I = G.inf;
  if (!Net.isHost) return;
  Net.fgT = (Net.fgT || 0) - dt; if (Net.fgT > 0) return; Net.fgT = 0.1;
  Net.send({ t: 'fg', a: I.fugs.map(f => [f.fl, Math.round(f.x), Math.round(f.y), f.face, f.moving ? 1 : 0, f.running ? 1 : 0, f.hide, FUG_ST.indexOf(f.st), f.markT > 0 ? 1 : 0, f.bub && f.bub.t < 0.2 ? f.bub.text : 0]) });
}
function guardRecv(d) {
  const I = G.inf, T = G.T, Q = G.T2;
  switch (d.t) {
    case 'T': infRecvPos(Q, d); return true;
    case 'fg': d.a.forEach((a, i) => { const f = I.fugs[i]; if (!f) return; const flChange = f.fl !== a[0]; f.fl = a[0]; f.net = a; if (flChange) { f.x = a[1]; f.y = a[2]; } f.face = a[3]; f.moving = !!a[4]; f.running = !!a[5]; f.hide = a[6]; const st = FUG_ST[a[7]]; if (f.st !== 'caught' && f.st !== 'out') f.st = st; f.beh = f.st === 'seat' ? 'sit' : null; if (a[8]) f.markT = 0.3; if (a[9]) fugSay(f, a[9]); }); return true;
    case 'gGrab': if (Net.isHost) fugCatch(d.i, d.how, d.by); return true;
    case 'gCaught': { const f = I.fugs[d.i]; if (f && f.st !== 'caught') { f.st = 'caught'; f.hide = -1; I.caughtN = d.n; guardCaughtFx(f, d.how, d.by); } return true; }
    case 'gOut': { const f = I.fugs[d.i]; if (f && f.st !== 'out') { f.st = 'out'; I.outN = d.n; guardOutFx(f); } return true; }
    case 'gAlert': guardAlertFx(d.text, d.fl); return true;
    case 'gEnd': guardEnd(d); return true;
    case 'say': Q.bubble = { text: d.text, t: 0, dur: Math.max(2, d.text.length * 0.075) }; return true;
    case 'ping': I.ping = { x: d.x, y: d.y, fl: d.fl, t: 0, room: '', who: guardName(Q) }; AU.sfx('ding', 0.4); if (d.fl !== I.cur) toast('📍 ' + guardName(Q) + ' t’appelle (' + INF_FLOOR_META[d.fl].name + ')', 1.8); return true;
    case 'tcheck': if (d.fl === I.cur && G.L.hides[d.i]) G.L.hides[d.i].shake = 0.8; return true;
    case 'grabfail': case 'spot': case 'seen': case 'keys': case 'caught': case 'escape': case 'eat': return true;
    case 'end': guardEnd({ c: I.caughtN, o: I.outN, time: 1 }); return true;
  }
  return false;
}
