// ================= À DEUX SUR N'IMPORTE QUEL NIVEAU =================
// « En équipe » (cc) : deux élèves contre le prof de l'ordinateur.
// « Surveillants » (cg) : deux surveillants contre les élèves qui sèchent (l'ordinateur).
// Le téléphone qui a créé la partie fait tourner l'ordinateur (prof, élèves, fugueurs) et envoie tout à l'autre.
const CC_TIME = 420;
const ccMe = () => G.ccMe || G.P;
function ccTargets() { return [ccMe(), G.P2].filter(p => p && !p.out && !p.jail && !p.lesson && p.x > -9000); }
const classTargets = () => (G.net && G.net.cc && Net.isHost) ? ccTargets() : [G.P];
function teamMark(k, m, d) { setMark(k, m, d); if (G.net && G.net.cc && Net.isHost) Net.send({ t: 'mk', i: G.kids.indexOf(k), m, d }); }
function ccTell(who, text, dur) { if (who === ccMe()) toast(text, dur || 2.6); else Net.send({ t: 'ccMsg', text, dur: dur || 2.6 }); }
// les infos des élèves de l'ordinateur à envoyer (avec les profs en classe, les élèves qui balancent…)
function teamKidsSetup() { return G.kids.map(k => ({ cfg: k.cfg, beh: k.beh, x: k.x, y: k.y, v: k.v || null, w: k.isWatcher ? 1 : 0, sn: k.snitch ? 1 : 0, pr: k.prof || null, nm: k.name || null })); }
function teamApplyKids(d) { (d.kids || []).forEach((s, i) => { const k = G.kids[i]; if (!k) return; if (s.v) k.v = s.v; if (s.w) { k.isWatcher = true; k.prof = s.pr || { range: 5, fov: 0.8 }; k.name = s.nm; } if (s.sn) k.snitch = true; }); }
// ---------- les portes : on envoie les changements de verrou ----------
function teamSyncDoors() {
  const st = G.doors.map(d => d.locked ? (d.byPlayer ? 2 : 1) : 0), last = G.doorSync || [];
  st.forEach((v, i) => { if (v !== last[i] && last.length) Net.send({ t: 'lock', i, l: v ? 1 : 0, bp: v === 2 ? 1 : 0 }); });
  G.doorSync = st;
}

// ================= EN ÉQUIPE =================
function ccHostRound() {
  const lv = Net.teamLevel, h = Object.assign({}, UI.cfg() || randomChar('Élève')), g = Object.assign({}, Net.them.cfg || randomChar(Net.them.name || 'Élève'));
  h.name = h.name || 'Joueur 1'; g.name = g.name || Net.them.name || 'Joueur 2';
  Net.role = 'student';
  startLevel(lv, h, null, { seed: UI.procOn() ? newSeed() : null });
  ccSetupTeam(g, null);
  const setup = {
    t: 'setup', mode: 'cc', lvl: lv, time: CC_TIME, seed: G.seed, cfgH: h, cfgG: g, hostRole: 'student',
    kids: teamKidsSetup(), items: [], secrets: G.L.exits.map(e => e.secret || null), ball: G.ball ? [G.ball.from, G.ball.to] : null,
    tasks: G.tasks.map(t => G.L.taskPool.findIndex(p => p.id === t.id && p.x === t.x && p.y === t.y)),
    stash: G.stash ? [...G.stash.entries()].map(([k, s]) => [k, s.kind]) : [], power: G.power ? [G.power.x, G.power.y] : null,
    jail: G.cc.jail ? { r: G.cc.jail.r, doors: G.cc.jail.doors, spots: G.cc.jail.spots } : null, p2: [G.P2.x, G.P2.y]
  };
  Net.setup = setup; Net.send(setup); Net.enter(setup);
}
function ccGuestRound(d) {
  Net.role = 'student';
  startLevel(d.lvl, d.cfgG, d);
  teamApplyKids(d);
  const m = G.m, w = m.w;
  G.stash = new Map((d.stash || []).map(([k, kind]) => [k, { kind, x: k % w, y: Math.floor(k / w) }])); G.disguiseAt = new Set();
  if (d.power) { m.dec(d.power[0], d.power[1], 'fuse'); G.power = { x: d.power[0], y: d.power[1], fx: d.power[0], fy: d.power[1] + 1, uses: POWER_USES, t: 0, auto: 0, bonkT: 0 }; G.mapCanvas = renderMapCanvas(G.L); }
  ccSetupTeam(d.cfgH, d);
  // je suis à la 2e place de départ, mon équipier à la 1re
  G.P.x = d.p2[0]; G.P.y = d.p2[1]; G.P2.x = G.L.start[0] * 16 + 8; G.P2.y = G.L.start[1] * 16 + 12;
}
function ccSetupTeam(cfg2, d) {
  const L = G.L, m = G.m, P = G.P;
  // la place de départ du coéquipier : une case libre à côté
  let s2 = [L.start[0], L.start[1]];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [2, 0], [-2, 0]]) { const x = L.start[0] + dx, y = L.start[1] + dy; if (m.get(x, y) === K.FLOOR && L.reach[y * m.w + x] >= 0) { s2 = [x, y]; break; } }
  G.P2 = { x: s2[0] * 16 + 8, y: s2[1] * 16 + 12, face: 1, moving: false, running: false, anim: 0, small: 0, slip: 0, hidden: null, busy: null, inv: [], cfg: cfg2, key: 'them', isPartner: true };
  P.key = 'me'; G.ccMe = P;
  G.cc = { jail: null, colles: 0 };
  if (d) { G.cc.jail = d.jail; if (d.jail) d.jail.doors.forEach(i => { const dr = G.doors[i]; if (dr) { dr.locked = true; dr.byPlayer = false; dr.pre = true; dr.jail = true; } }); return; }
  // la salle de colle : une pièce avec une porte, pas celle du départ ni celle du prof
  const [tx, ty] = tileOf(G.T), startR = m.roomAt(L.start[0], L.start[1]), tR = m.roomAt(tx, ty);
  const inR = (r, x, y) => x >= r.x - 1 && y >= r.y - 1 && x <= r.x + r.w && y <= r.y + r.h;
  const cands = m.rooms.filter(r => r.name && !/^Couloir|Cour|Préau|Terrain|Aire|Bassin|Patio|Escalier|Palier|Hall|Galerie des dinosaures/.test(r.name) && r.name !== startR && r.name !== tR && r.w * r.h >= 9 && r.w * r.h <= 120
    && G.doors.some(dr => inR(r, dr.x, dr.y)) && G.tasks.every(t => !(t.x >= r.x && t.y >= r.y && t.x < r.x + r.w && t.y < r.y + r.h)));
  const pref = cands.filter(r => /colle|étude|permanence|Réserve|Infirmerie|Archives|Local|Bureau|Vestiaire|Cabines/.test(r.name));
  const r = pick(pref.length ? pref : cands);
  if (!r) return;
  const doors = G.doors.map((dr, i) => inR(r, dr.x, dr.y) ? i : -1).filter(i => i >= 0);
  doors.forEach(i => { const dr = G.doors[i]; dr.locked = true; dr.byPlayer = false; dr.pre = true; dr.jail = true; });
  const spots = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (m.get(x, y) === K.FLOOR) spots.push([x, y]);
  if (G.stash) [...G.stash.keys()].forEach(k => { const x = k % m.w, y = Math.floor(k / m.w); if (inR(r, x, y)) G.stash.delete(k); });
  G.cc.jail = { r: { x: r.x, y: r.y, w: r.w, h: r.h, name: r.name }, doors, spots: spots.length ? spots : [[r.x, r.y]] };
}
// ---------- attrapé ----------
function ccCaught(who, reason) {
  const T = G.T, mine = who === ccMe(), eng = T.prof && T.prof.lesson, name = (who.cfg && who.cfg.name) || 'ton équipier';
  if (mine ? squishyCount(who) > 0 : (who.sqN || 0) > 0) {
    let id; if (mine) id = squishyTake(who); else { id = who.sqId || 0; who.sqN--; Net.send({ t: 'sqUse' }); }
    if (mine && who.hidden) { const s = who.hidden; who.hidden = null; const st = s.stand[0]; who.x = st[0] * 16 + 8; who.y = st[1] * 16 + 12; }
    squishyBlast(T, who, id, true);
    if (mine) squishyToast(T, id); else toast('🧸 SPLOTCH ! Le squishy de ' + name + ' aveugle ' + T.prof.name + ' !', 2.6);
    return;
  }
  if (who.pet && who.pet.charges > 0 && who.pet.leaveT == null) { petScare(T, who, !mine); if (!mine) Net.send({ t: 'petUse' }); return; }
  if (eng) {
    T.state = 'release'; T.st = 3.5; T.path = null; T.detect = 0; T.det = {}; T.knows = null;
    if (mine) { if ((G.lessons || 0) < LESSON_MAX) lessonStart(reason); else ccJail(); }
    else { Net.send({ t: 'caughtYou', eng: 1, r: reason }); toast((T.prof.lesson === 'hist' ? '🦴 ' : '🇬🇧 ') + T.prof.name + ' coince ' + name + ' !', 2.4); }
    return;
  }
  T.state = 'patrol'; T.path = null; T.detect = 0; T.det = {}; T.knows = null;
  say('ATTRAPÉ·E ! En colle, ' + name + ' !');
  AU.sfx('caught', 0.7); G.shake = 0.3; puff(who.x, who.y - 10, 16, '#ffffff');
  if (mine) ccJail();
  else { Net.send({ t: 'caughtYou', r: reason }); toast('😱 ' + name + ' s’est fait attraper !' + (G.cc.jail ? ' Va le/la libérer : « ' + G.cc.jail.r.name + ' ».' : ''), 3); }
}
function ccJail() {
  const P = G.P, J = G.cc.jail; if (P.hidden) unhide(); P.busy = null; P.small = 0; P.board = false; P.lift = 0; P.under = false;
  G.cc.colles++;
  if (!J) { P.x = G.L.start[0] * 16 + 8; P.y = G.L.start[1] * 16 + 12; G.camX = null; FX.iris = { mode: 'in', t: 0, dur: 0.6 }; UI.banner('🚨 Attrapé·e ! Retour au point de départ.'); return; }
  P.jail = true; P.jailT = 0;
  J.doors.forEach(i => { const d = G.doors[i]; if (d) { d.locked = true; d.byPlayer = false; d.target = 0; d.open = 0; } });
  const sp = pick(J.spots); P.x = sp[0] * 16 + 8; P.y = sp[1] * 16 + 12; G.camX = null;
  FX.iris = { mode: 'in', t: 0, dur: 0.6 }; AU.sfx('fail');
  UI.banner('🚨 Attrapé·e ! Direction : ' + J.r.name + ' (salle de colle).');
  toast('Coincé·e ! ' + (G.P2.cfg.name || 'Ton équipier') + ' peut venir t’ouvrir. Sinon : 60 s.', 3);
  Net.send({ t: 'ccJailLock' });
}
function ccRelease() {
  const P = G.P; P.jail = false; P.jailT = 0; P.x = G.L.start[0] * 16 + 8; P.y = G.L.start[1] * 16 + 12; G.camX = null;
  FX.iris = { mode: 'in', t: 0, dur: 0.6 }; UI.banner('🧑‍🏫 Fin de la colle… retour au point de départ !');
}
function ccEscape(ex, tx, ty) {
  const P = G.P; if (P.out) return;
  if (P.hidden) unhide(); P.busy = null; P.out = true;
  AU.sfx('win'); confetti(P.x, P.y - 10, 50); FX.winA = 0;
  UI.banner(G.P2.out ? '🎉 Vous êtes dehors tous les deux !' : '🎉 Tu es dehors ! Attends ' + (G.P2.cfg.name || 'ton équipier') + '…');
  Net.send({ t: 'ccOut', e: G.L.exits.indexOf(ex) });
}
// ---------- actions en plus : libérer l'équipier ----------
function ccActions(cand, P) {
  const J = G.cc && G.cc.jail, Q = G.P2; if (!J || !Q || !Q.jail || P.jail || P.out) return;
  const [ptx, pty] = tileOf(P);
  for (const [dx, dy] of D4) { const d = doorAt(ptx + dx, pty + dy); if (d && d.jail && d.locked) { cand.push({ id: 'ccFree', icon: '🔓', label: 'Libérer', sub: Q.cfg.name || 'ton équipier', prio: 0.05, d: 0 }); return; } }
}
function ccFree() {
  const J = G.cc.jail; G.P.busy = { label: 'Je crochète la serrure…', dur: 2, t: 0, done: () => {
    J.doors.forEach(i => { const d = G.doors[i]; if (d) { d.locked = false; d.byPlayer = false; } });
    Net.send({ t: 'ccFreed' }); AU.sfx('lock'); AU.sfx('found'); toast('🔓 ' + (G.P2.cfg.name || 'Ton équipier') + ' est libre !', 2.4);
  } }; AU.sfx('keys', 0.5);
}
// ---------- mise à jour ----------
function ccUpdate(dt) {
  const P = G.P, Q = G.P2, T = G.T, host = Net.isHost;
  G.ccMe = P;
  updatePlayer(dt); if (G.mode !== 'play') return;
  if (P.jail) { P.jailT = (P.jailT || 0) + dt; const J = G.cc.jail; if (J && !inRectT(P, J.r)) { P.jail = false; UI.banner('🏃 Sorti·e de la colle ! File !'); } else if (P.jailT > 60) ccRelease(); }
  if (Q.net) {
    Net.smooth(Q, dt); const s = Q.net;
    Q.small = s.sm ? 10 : 0; Q.slip = s.sl ? 1 : 0; Q.skidT = s.sk ? 0.1 : 0; Q.hidden = s.h >= 0 ? G.L.hides[s.h] : null; Q.under = !!s.u; Q.lift = s.lf || 0; Q.board = !!s.bd;
    Q.lesson = !!s.ls; Q.sqN = s.sq || 0; Q.sqId = s.sqi || 0; Q.disguised = !!s.dg; Q.swim = inWater(Q);
    if (s.pk >= 0 && PETS[s.pk]) { if (!Q.pet || Q.pet.i !== s.pk) Q.pet = { i: s.pk, e: PETS[s.pk].e, n: PETS[s.pk].n, charges: s.pc, x: Q.x, y: Q.y, t: 0 }; else Q.pet.charges = s.pc; } else Q.pet = null;
    const wasJ = Q.jail; Q.jail = !!s.jail; if (Q.jail && !wasJ) G.cc.colles++;
    if (s.out && !Q.out) { Q.out = true; if (!P.out) UI.banner('🎉 ' + (Q.cfg.name || 'Ton équipier') + ' est dehors ! À toi de sortir…'); }
  }
  if (host) {
    if (!T.gone) {
      const tg = ccTargets(); let tgt = tg.includes(T.tgtP) ? T.tgtP : null;
      const busy = ['chase', 'search', 'check', 'investigate', 'alert', 'warn', 'edge'].includes(T.state);
      if (!busy || !tgt) {
        let best = null, bs = -1;
        tg.forEach(p => { if (p.hidden || p.under) return; const ex = T.x, ey = T.y - 12, d = Math.hypot(p.x - ex, p.y - 7 - ey); let sc = 1 / (d + 1); if (d < T.prof.range * 16 && Math.abs(angDiff(Math.atan2(p.y - 7 - ey, p.x - ex), T.ang)) < T.prof.fov && los(ex, ey, p.x, p.y - 7)) sc += 10; if (sc > bs) { bs = sc; best = p; } });
        tgt = best || tg[0] || null;
      }
      if (tgt) {
        T.tgtP = tgt; T.det = T.det || {}; const key = tgt === P ? 'me' : 'them';
        G.P = tgt; T.detect = T.det[key] || 0;
        try { updateTeacher(dt); } finally { G.P = P; }
        T.det[key] = T.detect;
        Object.keys(T.det).forEach(k => { if (k !== key) T.det[k] = Math.max(0, T.det[k] - dt * 0.45); });
      } else { T.moving = false; if (T.bubble) { T.bubble.t += dt; if (T.bubble.t > T.bubble.dur) T.bubble = null; } }
    }
    updateKids(dt); if (G.cls) classUpdate(dt); if (G.power) powerUpdate(dt);
  } else {
    if (T.net) { Net.smooth(T, dt); T.ang = T.net.a; T.state = T.net.st; }
    if (T.bubble) { T.bubble.t += dt; if (T.bubble.t > T.bubble.dur) T.bubble = null; }
    if (T.markT > 0) T.markT -= dt;
    teamKidsSmooth(dt);
  }
  updateDoors(dt); petFollow(P, dt); if (Q.pet) petFollow(Q, dt);
  if (!T.gone) { const d = dist(T.x, T.y, P.x, P.y) / 16; G.heartT -= dt; if (d < 7 && T.state !== 'sleep' && G.heartT <= 0 && !P.out) { G.heartT = 0.35 + d * 0.11; AU.sfx('heart', clamp(1 - d / 7, 0.15, 1) * (T.state === 'chase' ? 1 : 0.6)); UI.heart(); } }
  AU.play((T.state === 'chase' || T.state === 'edge') && !T.gone ? 'chase' : 'sneak');
  if (P.out && Q.out) { G.mode = 'result'; Multi.resultCC('win'); return; }
  if (host && P.jail && Q.jail) { Net.send({ t: 'end', r: 'jail' }); G.mode = 'result'; Multi.resultCC('jail'); return; }
  Net.timeLeft -= dt;
  if (host && Net.timeLeft <= 0) { Net.send({ t: 'end', r: 'time' }); G.mode = 'result'; Multi.resultCC('time'); return; }
  ccNetTick(dt);
}
function teamKidsSmooth(dt) {
  G.kids.forEach(k => {
    if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; }
    if (k.markT > 0) k.markT -= dt;
    const a = k.net; if (!a) return;
    if (a[5] != null) k.ang = a[5];
    const ox = k.x, oy = k.y;
    if (Math.abs(a[0] - k.x) + Math.abs(a[1] - k.y) > 80) { k.x = a[0]; k.y = a[1]; } else { k.x += (a[0] - k.x) * Math.min(1, dt * 12); k.y += (a[1] - k.y) * Math.min(1, dt * 12); }
    k.dist = (k.dist || 0) + Math.hypot(k.x - ox, k.y - oy); k.face = a[2]; k.moving = !!a[3]; k.runK = !!a[4];
  });
}
function ccNetTick(dt) {
  const N = Net, P = G.P, T = G.T;
  N.sendT -= dt; N.kidsT -= dt;
  if (N.sendT <= 0) {
    N.sendT = 0.05;
    N.send({ t: 's', x: +P.x.toFixed(1), y: +P.y.toFixed(1), f: P.face, m: P.moving ? 1 : 0, r: P.running ? 1 : 0, sm: P.small > 0 ? 1 : 0, sl: P.slip > 0 ? 1 : 0, h: P.hidden ? P.hidden.idx : -1, sk: P.skidT > 0 ? 1 : 0,
      u: P.under ? 1 : 0, lf: P.lift > 0 ? Math.round(P.lift) : 0, bd: P.board ? 1 : 0, out: P.out ? 1 : 0, jail: P.jail ? 1 : 0, ls: P.lesson ? 1 : 0, dg: P.disguised ? 1 : 0, pk: P.pet && P.pet.leaveT == null ? P.pet.i : -1, pc: P.pet ? P.pet.charges : 0, sq: squishyCount(P), sqi: P.sqIds && P.sqIds.length ? P.sqIds[0] : 0 });
    if (N.isHost) N.send({ t: 'ai', x: +T.x.toFixed(1), y: +T.y.toFixed(1), a: +T.ang.toFixed(2), f: T.face, m: T.moving ? 1 : 0, r: T.running ? 1 : 0, st: T.state, dk: G.dark ? 1 : 0, pu: G.power ? G.power.uses : 0 });
  }
  if (N.isHost && N.kidsT <= 0) { N.kidsT = 0.1; N.send({ t: 'k', a: G.kids.map(k => [Math.round(k.x), Math.round(k.y), k.face, k.moving ? 1 : 0, k.runK ? 1 : 0, +((k.ang || 0).toFixed(2))]), b: G.ball ? [G.ball.from, G.ball.to, +G.ball.t.toFixed(2)] : null }); teamSyncDoors(); }
  const lag = (performance.now() - N.lastRecv) / 1000;
  if (lag > 4 && G.mode === 'play') { if (!N.lagShown) { N.lagShown = true; UI.banner('📶 Connexion lente… on attend ton équipier'); } } else N.lagShown = false;
}
function ccRecv(d) {
  const P = G.P, Q = G.P2, T = G.T;
  switch (d.t) {
    case 's': Q.net = d; return true;
    case 'ai': if (!Net.isHost) { T.net = d; if (G.power) { G.power.uses = d.pu; const dk = !!d.dk; if (dk !== !!G.dark) { G.dark = dk; if (dk) toast('⚡ Noir complet ! Le prof va devoir rallumer…', 2.4); else toast('💡 La lumière revient.', 1.6); } } } return true;
    case 'k': if (!Net.isHost) { d.a.forEach((a, i) => { const k = G.kids[i]; if (k) k.net = a; }); if (G.ball && d.b) { G.ball.from = d.b[0]; G.ball.to = d.b[1]; G.ball.t = d.b[2]; } } return true;
    case 'noise': if (Net.isHost) ccHostNoise(d.x, d.y, d.r, d.w); return true;
    case 'bub': { const k = G.kids[d.w]; if (k) { k.bub = { text: d.text, t: 0, dur: d.dur || 2.2 }; const dd = dist(k.x, k.y, P.x, P.y) / 16; if (dd < 14) AU.say(d.text, { voice: k.voice || { pitch: 1, rate: 1.1 } }, clamp(1.1 - dd / 12, 0.15, 1)); } return true; }
    case 'mk': { const k = G.kids[d.i]; if (k) setMark(k, d.m, d.d); return true; }
    case 'ccMsg': toast(d.text, d.dur || 2.6); return true;
    case 'ccStash': if (G.stash) G.stash.delete(d.k); return true;
    case 'ccTask': { const t = G.tasks[d.i]; if (t && !t.done) { t.done = true; G.tasksDone = G.tasks.filter(x => x.done).length; UI.hudSig = null; toast('📋 ' + (Q.cfg.name || 'Ton équipier') + ' a fini une tâche (' + G.tasksDone + '/' + G.tasks.length + ')' + (G.tasksDone >= G.tasks.length ? ' : sorties ouvertes ! 🚪' : ' !'), 2.4); AU.sfx('ding', 0.5); } return true; }
    case 'ccPower': if (Net.isHost && G.power && !G.dark && G.power.uses > 0) powerCut(); return true;
    case 'caughtYou': if (!P.jail && !P.out && !P.lesson) { if (d.eng && (G.lessons || 0) < LESSON_MAX) lessonStart(d.r); else ccJail(); } return true;
    case 'ccJailLock': if (G.cc.jail) G.cc.jail.doors.forEach(i => { const dr = G.doors[i]; if (dr) { dr.locked = true; dr.byPlayer = false; } }); return true;
    case 'ccFreed': if (G.cc.jail) G.cc.jail.doors.forEach(i => { const dr = G.doors[i]; if (dr) { dr.locked = false; dr.byPlayer = false; } }); if (P.jail) { P.jail = false; P.jailT = 0; UI.banner('🔓 ' + (Q.cfg.name || 'Ton équipier') + ' t’a libéré·e ! File !'); AU.sfx('found'); } return true;
    case 'ccOut': Q.out = true; return true;
    case 'petUse': if (P.pet) petUsed(P, G.T); return true;
    case 'look': Q.cfg = d.cfg; return true;
    case 'disguise': case 'undisguise': Q.cfg = d.cfg; Q.disguised = d.t === 'disguise'; return true;
    case 'lessonDone': toast(d.ok ? '✅ ' + (Q.cfg.name || 'Ton équipier') + ' a bien répondu !' : '❌ ' + (Q.cfg.name || 'Ton équipier') + ' s’est planté·e. Objets confisqués !', 2.4); return true;
    case 'end': if (G.mode !== 'result') { G.mode = 'result'; Multi.resultCC(d.r || 'time'); } return true;
  }
  return false;
}
// le bruit fait par l'équipier : le prof (sur le téléphone hôte) l'entend
function ccHostNoise(x, y, r, w) { const real = G.P; G.P = G.P2; try { makeNoise(x, y, r, w); } finally { G.P = real; } }

// ================= SURVEILLANTS EN ÉQUIPE =================
function cgProf2(lv) { const p = LEVELS[lv].prof; return p === 1 ? 0 : 1; }   // le collègue : Kévin ou M. Carnet
function cgHostRound() {
  const lv = Net.teamLevel, name = pick(SOLO_NAMES);
  Net.role = 'teacher';
  startLevel(lv, randomChar(name), null, { robots: true, seed: UI.procOn() ? newSeed() : null });
  const pr2 = cgProf2(lv);
  Solo.lv = lv; G.solo = { caught: 0, out: 0, lives: SOLO_LIVES, wave: 1, phase: 'hunt', calmT: 0, rumorT: 32, leaveT: 0, used: [name] };
  Bot.reset(G.P, 1);
  cgMakeT2(pr2, null);
  const setup = {
    t: 'setup', mode: 'cg', lvl: lv, time: SOLO_TIME, seed: G.seed, hostRole: 'teacher', pr2, student: G.P.cfg, fug: [G.P.x, G.P.y],
    kids: teamKidsSetup(), items: G.items.map(i => ({ id: i.id, x: i.x, y: i.y, kind: i.kind })), secrets: G.L.exits.map(e => e.secret || null), ball: G.ball ? [G.ball.from, G.ball.to] : null,
    tasks: G.tasks.map(t => G.L.taskPool.findIndex(p => p.id === t.id && p.x === t.x && p.y === t.y)), t2: [G.T2.x, G.T2.y]
  };
  Net.setup = setup; Net.send(setup); Net.enter(setup);
}
function cgGuestRound(d) {
  Net.role = 'teacher';
  startLevel(d.lvl, d.student, d);
  teamApplyKids(d);
  Solo.lv = d.lvl; G.solo = { caught: 0, out: 0, lives: SOLO_LIVES, wave: 1, phase: 'hunt' };
  G.P.x = d.fug[0]; G.P.y = d.fug[1];
  // moi : le collègue ; l'autre (l'hôte) : le prof du niveau
  const host = G.T; cgMakeT2(d.pr2, d.t2); const mine = G.T2; G.T = mine; G.T2 = host;
}
function cgMakeT2(pr2, at) {
  const L = G.L, m = G.m, T = G.T, T2 = newTeacher(PROFS[pr2], L);
  let p = at;
  if (!p) { const [tx, ty] = tileOf(T); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [1, 1], [-1, -1]]) { const x = tx + dx, y = ty + dy; if (m.get(x, y) === K.FLOOR && L.reach[y * m.w + x] >= 0) { p = [x * 16 + 8, y * 16 + 12]; break; } } }
  if (p) { T2.x = p[0]; T2.y = p[1]; }
  T2.state = 'free'; T2.isT2 = true; G.T2 = T2;
}
// vu par l'autre surveillant ?
function cgSeesFrom(A, P) {
  if (P.hidden || P.out || P.under || A.state === 'count') return false;
  const ex = A.x, ey = A.y - 12, d = Math.hypot(P.x - ex, P.y - 7 - ey); if (d > Math.max(7.5, A.prof.range) * 16) return false;
  const inC = d < 28 || Math.abs(angDiff(Math.atan2(P.y - 7 - ey, P.x - ex), A.ang)) < Math.max(1, A.prof.fov);
  return inC && los(ex, ey, P.x, P.y - 7);
}
function cgUpdate(dt) {
  const T = G.T, Q = G.T2, P = G.P, host = Net.isHost;
  updateTeacherLocal(dt); if (G.mode !== 'play') return;
  if (Q.net) { Net.smooth(Q, dt); Q.ang = Q.net.a; Q.state = Q.net.st; }
  if (Q.bubble) { Q.bubble.t += dt; if (Q.bubble.t > Q.bubble.dur) Q.bubble = null; }
  if (Q.markT > 0) Q.markT -= dt;
  if (host) {
    const S = G.solo;
    // le fugueur réagit au surveillant le plus proche
    if (S.phase === 'hunt' && dist(Q.x, Q.y, P.x, P.y) < dist(T.x, T.y, P.x, P.y)) {
      const pv = G.pVis; G.T = Q; G.pVis = cgSeesFrom(Q, P);
      try { Solo.tick(dt); } finally { G.T = T; G.pVis = pv; }
    } else Solo.tick(dt);
    if (G.mode !== 'play') return;
    G.kids.forEach(k => { if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; } });
    updateKids(dt);
  } else {
    if (P.net) {
      Net.smooth(P, dt); const s = P.net; P.small = s.sm ? 10 : 0;
      const hs = s.h >= 0 ? G.L.hides[s.h] : null;
      if (hs !== P.hidden) { if (hs && G.pVis) { puff(hs.x * 16 + 8, hs.y * 16 + 8, 8); hs.shake = 0.6; } P.hidden = hs; }
      P.out = !!s.out; if (P.out) { P.x = -9999; P.y = -9999; }
    }
    teamKidsSmooth(dt);
  }
  if (P.running && !P.hidden && !P.out) stepCues(P, G.pVis, dt, 0); else P.stcT = 0;
  updateDoors(dt);
  AU.play(G.pVis ? 'chase' : 'sneak');
  Net.timeLeft -= dt;
  if (host && Net.timeLeft <= 0) { cgEnd('time'); return; }
  cgNetTick(dt);
}
function cgNetTick(dt) {
  const N = Net, P = G.P, T = G.T;
  N.sendT -= dt; N.kidsT -= dt;
  if (N.sendT <= 0) {
    N.sendT = 0.05;
    N.send({ t: 'cgT', x: +T.x.toFixed(1), y: +T.y.toFixed(1), a: +T.ang.toFixed(2), f: T.face, m: T.moving ? 1 : 0, r: T.running ? 1 : 0, st: T.state });
    if (N.isHost) {
      N.send({ t: 's', x: +P.x.toFixed(1), y: +P.y.toFixed(1), f: P.face, m: P.moving ? 1 : 0, r: P.running ? 1 : 0, sm: P.small > 0 ? 1 : 0, h: P.hidden ? P.hidden.idx : -1, out: P.out ? 1 : 0 });
      const S = G.solo, sig = [S.phase, S.caught, S.out, S.lives, S.wave, P.cfg.name, G.tasksDone].join('|');
      if (sig !== N.cgSig) { N.cgSig = sig; N.send({ t: 'cgS', s: { phase: S.phase, caught: S.caught, out: S.out, lives: S.lives, wave: S.wave }, cfg: P.cfg, td: G.tasksDone, tl: Math.round(N.timeLeft) }); }
    }
  }
  if (N.isHost && N.kidsT <= 0) { N.kidsT = 0.1; N.send({ t: 'k', a: G.kids.map(k => [Math.round(k.x), Math.round(k.y), k.face, k.moving ? 1 : 0, k.runK ? 1 : 0, +((k.ang || 0).toFixed(2))]), b: G.ball ? [G.ball.from, G.ball.to, +G.ball.t.toFixed(2)] : null }); teamSyncDoors(); }
  const lag = (performance.now() - N.lastRecv) / 1000;
  if (lag > 4 && G.mode === 'play') { if (!N.lagShown) { N.lagShown = true; UI.banner('📶 Connexion lente… on attend ton collègue'); } } else N.lagShown = false;
}
// le collègue a attrapé (ou trouvé) le fugueur : c'est l'hôte qui vérifie
function cgCatch(d) {
  const S = G.solo, P = G.P, Q = G.T2, T = G.T; if (!S || S.phase !== 'hunt' || G.mode !== 'play') return;
  const gx = d.x != null ? d.x : Q.x, gy = d.y != null ? d.y : Q.y;   // la position du collègue au moment où il attrape (le réseau a un peu de retard)
  const ok = d.r === 'found' ? !!(P.hidden && (d.i == null || P.hidden.idx === d.i)) : (!P.hidden && !P.out && dist(gx, gy, P.x, P.y) < 48);
  if (d.x != null) { Q.x = d.x; Q.y = d.y; }
  if (!ok) return;
  G.T = Q; try { Solo.caught(d.r); } finally { G.T = T; }
}
function cgRecv(d) {
  const P = G.P, Q = G.T2;
  switch (d.t) {
    case 'cgT': Q.net = d; return true;
    case 's': if (!Net.isHost) P.net = d; return true;
    case 'k': if (!Net.isHost) { d.a.forEach((a, i) => { const k = G.kids[i]; if (k) k.net = a; }); if (G.ball && d.b) { G.ball.from = d.b[0]; G.ball.to = d.b[1]; G.ball.t = d.b[2]; } } return true;
    case 'caught': if (Net.isHost) cgCatch(d); return true;
    case 'cgS': {
      if (Net.isHost) return true;
      const S = G.solo, was = S.caught, wasOut = S.out;
      Object.assign(S, d.s); P.cfg = d.cfg; G.tasksDone = d.td || 0; G.tasksRemote = G.tasksDone; Net.timeLeft = d.tl; Solo.sig = null;
      if (S.caught > was) { FX.comic = { t: 0, text: 'ATTRAPÉ !' }; FX.punch(0.2); AU.sfx('caught'); G.shake = 0.3; }
      if (S.out > wasOut) { FX.comic = { t: 0, text: 'ÉVADÉ·E !' }; AU.sfx('fail'); }
      if (S.phase === 'hunt' && P.out) { P.out = false; P.x = -9999; }
      return true;
    }
    case 'cgBan': UI.banner(d.text); AU.sfx('ding', 0.4); return true;
    case 'cgToast': toast(d.text, d.dur || 2.4); return true;
    case 'cgEnd': if (!Net.isHost) { Object.assign(G.solo, d.s); cgShowEnd(d.why); } return true;
    case 'tcheck': { const s = G.L.hides[d.i]; if (s) s.shake = 1; return true; }
    case 'say': Q.bubble = { text: d.text, t: 0, dur: Math.max(2, d.text.length * 0.075) }; { const dd = dist(Q.x, Q.y, G.T.x, G.T.y) / 16; if (dd < 20) AU.say(d.text, Q.prof, clamp(1.25 - dd / 15, 0.15, 1)); } return true;
  }
  return false;
}
function soloBanner(text) { UI.banner(text); if (G.net && G.net.cg && Net.isHost) Net.send({ t: 'cgBan', text }); }
function cgEnd(why) {
  if (G.mode === 'result') return;
  const S = G.solo; Net.send({ t: 'cgEnd', why, s: { phase: S.phase, caught: S.caught, out: S.out, lives: S.lives, wave: S.wave } });
  cgShowEnd(why);
}
function cgShowEnd(why) {
  if (G.mode === 'result') return; G.mode = 'result'; $('hud').classList.remove('solo'); AU.play(null);
  const S = G.solo, t = SOLO_TIME - Math.max(0, Net.timeLeft), mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const title = why === 'time' ? 'FIN DE LA<br>JOURNÉE !' : 'FIN DE<br>SERVICE !', col = S.caught >= 3 ? 'var(--green)' : S.caught ? 'var(--yel)' : 'var(--red)';
  const verdict = S.caught >= 5 ? 'Duo légendaire. Les élèves parlent de vous en chuchotant.' : S.caught >= 3 ? 'Redoutables. La salle de colle affiche complet.' : S.caught >= 1 ? 'Pas mal. Mais certains courent encore.' : 'Personne en colle… Les élèves fêtent ça à la cantine.';
  const p = $('resPanel'), pr = G.T.prof, pr2 = G.T2.prof;
  p.innerHTML = `<div class="bigtitle" style="color:${col}">${title}</div>
    <div class="prof"><canvas id="rProf" width="20" height="34"></canvas><canvas id="rProf2" width="20" height="34"></canvas><div class="quote"></div></div>
    <div class="stats"><span>🚨 ${S.caught} en colle</span><span>😱 ${S.out} évadé${S.out > 1 ? 's' : ''}</span><span>⏱️ ${mm}</span></div>
    <button class="btn big green" id="rAgain">👮 Rejouer en surveillants</button>
    <button class="btn ghost" id="rQuit">🏠 Quitter la partie</button>
    <div class="tiny" id="rStat" style="text-align:center"></div>`;
  portrait($('rProf'), pr.cfg, pr.v, 1); portrait($('rProf2'), pr2.cfg, pr2.v, 1); p.querySelector('.quote').textContent = '« ' + verdict + ' »';
  $('rAgain').onclick = () => { AU.sfx('blip'); if (!Net.isHost) $('rStat').textContent = '⏳ Demande envoyée à ton collègue…'; Net.newRound(false); };
  $('rQuit').onclick = () => { AU.sfx('blip'); Net.close(); G.net = null; G.solo = null; $('hWanted').classList.add('hidden'); UI.openTitle(); };
  UI.show('sResult'); AU.sfx(S.caught ? 'win' : 'fail');
}
