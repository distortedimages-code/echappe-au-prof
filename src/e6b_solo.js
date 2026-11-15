// ================= SOLO : TU ES LE SURVEILLANT =================
// Le joueur joue l'adulte du niveau (contrôles du prof en ligne). Un élève joué par l'ordinateur
// fait ses 3 tâches, se cache, s'enfuit, ferme des portes… puis file vers une sortie, comme un vrai joueur.
// Attrapé : il part en colle, on patrouille jusqu'au prochain signalement. 3 évasions = fin de service.
const SOLO_TIME = 420, SOLO_LIVES = 3;
const SOLO_NAMES = ['Léa', 'Hugo', 'Inès', 'Nathan', 'Jade', 'Lucas', 'Chloé', 'Tom', 'Manon', 'Noah', 'Zoé', 'Adam', 'Lina', 'Gabin', 'Rose', 'Sacha', 'Mila', 'Théo', 'Alice', 'Malo'];
const netLive = () => !!(G.net && !G.net.solo);

// ---------- l'élève ordinateur ----------
const Bot = {
  pass(x, y) { const m = G.m; if (!passT(m, x, y)) return false; const i = G.doorIdx[y * m.w + x]; const d = i >= 0 ? G.doors[i] : null, B = G.P && G.P.bot; return !(d && d.locked && !d.byPlayer && !(B && B.keys)); },
  reach(x, y) { const L = G.L; return !L.reach || L.reach[y * L.m.w + x] >= 0; },
  tile(P) { return [Math.floor(P.x / 16), Math.floor((P.y - 4) / 16)]; },
  route(P, gx, gy) {
    const [sx, sy] = this.tile(P); let g = [gx, gy];
    if (!this.pass(gx, gy)) {
      let best = null, bd = 1e9;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = gx + dx, y = gy + dy; if (this.pass(x, y)) { const d = Math.hypot(x - sx, y - sy) + (dx && dy ? 0.5 : 0); if (d < bd) { bd = d; best = [x, y]; } } }
      if (!best) return false; g = best;
    }
    const p = astar(sx, sy, g[0], g[1], (x, y) => this.pass(x, y));
    if (!p) return false; P.path = p; P.pi = 0; return true;
  },
  reset(P, wave) {
    const lv = Math.min(4, (wave || 1) - 1);
    P.ang = P.ang || 0; P.path = null; P.pi = 0; P.out = false; P.hidden = null; P.busy = null; P.moving = false; P.running = false;
    P.bot = { st: 'plan', t: rand(0.5, 1.2), goal: null, seenT: -99, lastT: null, peekT: rand(4, 8), pauseT: 0, noiseT: 0, fleeT: 0, locks: 0, lockTried: null, taskK: 1 - lv * 0.07, brave: 0.25 + lv * 0.12 };
  },
  stop(P) { P.bot = null; P.path = null; P.moving = false; P.running = false; },
  // un bruit que le surveillant peut entendre (comme le message « noise » en ligne)
  noise(x, y, r, word, snd) {
    const T = G.T, dd = dist(T.x, T.y, x, y) / 16;
    if (dd < r * 1.8 && !G.pVis) cue(x, y - 8, 'word', word || '?!', { col: '#ffb347', pop: true, life: 1.2 });
    if (snd && dd < r * 2) AU.sfx(snd, clamp(1 - dd / (r * 2), 0.1, 0.8));
  },
  sense(P, B) {
    const T = G.T, d = dist(T.x, T.y, P.x, P.y) / 16;
    let see = false;
    if (T.state === 'count') return { d, see: false, hear: false, spotted: false };
    if (P.hidden) { const hx = P.hidden.x * 16 + 8, hy = P.hidden.y * 16 + 8; see = d < 7 && los(hx, hy - 4, T.x, T.y - 12); }
    else see = d < 10 && los(P.x, P.y - 7, T.x, T.y - 12);
    const hear = !see && T.running && d < 8;
    if (see || hear) { B.seenT = G.time; B.lastT = [T.x, T.y]; }
    return { d, see, hear, spotted: !!G.pVis };
  },
  // les cachettes proches, que le surveillant ne regarde pas
  hideSpot(P, maxD) {
    const T = G.T; let best = null, bd = maxD * 16;
    for (const h of G.L.hides) {
      if (h.small || h.k === K.DOOR) continue;
      const st = h.stand[0], sx = st[0] * 16 + 8, sy = st[1] * 16 + 12, d = dist(P.x, P.y, sx, sy);
      if (d > bd) continue;
      const hx = h.x * 16 + 8, hy = h.y * 16 + 8, dt = dist(T.x, T.y, hx, hy);
      if (dt < 3 * 16) continue;
      if (dt < 9 * 16 && los(T.x, T.y - 12, hx, hy) && Math.abs(angDiff(Math.atan2(hy - T.y, hx - T.x), T.ang)) < 1.2) continue;
      if (dist(T.x, T.y, sx, sy) < d) continue;   // pas de cachette du côté du surveillant
      bd = d; best = h;
    }
    return best;
  },
  // un endroit loin du surveillant
  flee(P, B, hurry) {
    const T = G.T, L = G.L, spots = [];
    L.taskPool.forEach(t => spots.push(t.stand[0])); L.hides.forEach(h => { if (!h.small) spots.push(h.stand[0]); });
    (L.itemSpots || []).forEach((s, i) => { if (i % 3 === 0) spots.push(s); });
    let best = null, bs = -1e9; const dPT = dist(P.x, P.y, T.x, T.y);
    for (const s of shuffle(spots).slice(0, 30)) {
      const x = s[0] * 16 + 8, y = s[1] * 16 + 12, dT = dist(x, y, T.x, T.y), dP = dist(x, y, P.x, P.y);
      if (dT < dPT + 32 || dP < 48) continue;
      // éviter de passer à côté du surveillant
      const ax = x - P.x, ay = y - P.y, bx = T.x - P.x, by = T.y - P.y, tow = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) + 1e-3);
      const sc = dT - dP * 0.5 - tow * 140;
      if (sc > bs) { bs = sc; best = s; }
    }
    if (!best || !this.route(P, best[0], best[1])) { B.st = 'plan'; B.t = 0.4; return; }
    B.st = 'flee'; B.hurry = hurry; B.fleeT = rand(3, 5);
  },
  plan(P, B) {
    const L = G.L, T = G.T, near = B.lastT && G.time - B.seenT < 15;
    const danger = (x, y) => near ? Math.max(0, 9 * 16 - dist(x, y, B.lastT[0], B.lastT[1])) * 1.6 : 0;
    const todo = G.tasks.filter(t => !t.done);
    if (todo.length) {
      const ts = todo.map(t => ({ t, s: dist(P.x, P.y, t.stand[0][0] * 16 + 8, t.stand[0][1] * 16 + 12) + danger(t.stand[0][0] * 16 + 8, t.stand[0][1] * 16 + 12) })).sort((a, b) => a.s - b.s);
      for (const o of ts) if (this.route(P, o.t.stand[0][0], o.t.stand[0][1])) { B.st = 'go'; B.goal = { k: 'task', task: o.t }; return; }
    } else {
      const ex = L.exits.filter(e => e.type === 'hold' || (e.type === 'search' && e.cands && e.cands.length));
      const opts = ex.map(e => { const x = (e.type === 'hold' ? e.x : e.cands[0][0]) * 16 + 8, y = (e.type === 'hold' ? e.y : e.cands[0][1]) * 16 + 8; return { e, s: dist(P.x, P.y, x, y) + danger(x, y) * 1.5 + rand(0, 60) }; }).sort((a, b) => a.s - b.s);
      for (const o of opts) {
        const e = o.e;
        if (e.type === 'hold') { if (this.route(P, e.x, e.y)) { B.st = 'go'; B.goal = { k: 'exit', ex: e }; return; } }
        else {
          // comme un joueur : on fouille les meubles possibles un par un (le bon n'est pas forcément le premier)
          const c = shuffle(e.cands.filter(([x, y]) => !G.searched.has(y * G.m.w + x)));
          if (!c.length) continue;
          if (this.route(P, c[0][0], c[0][1])) { B.st = 'go'; B.goal = { k: 'search', ex: e, cands: c, ci: 0 }; return; }
        }
      }
    }
    // coincé derrière une porte fermée : comme un joueur, il finit par trouver une clé
    B.fails = (B.fails || 0) + 1; if (B.fails > 2) B.keys = true;
    B.t = 1; B.st = 'plan';
  },
  hide(P, B, h) {
    P.hidden = h; P.hideFrom = [P.x, P.y]; P.moving = false; P.running = false; P.path = null; h.shake = 0.6;
    if (G.pVis) puff(h.x * 16 + 8, h.y * 16 + 8, 8);
    const dd = dist(G.T.x, G.T.y, h.x * 16, h.y * 16) / 16; if (dd < 6) AU.sfx(h.k === K.LOCKER ? 'locker' : (h.k === K.BUSH || h.k === K.TREE) ? 'rustle' : 'hide', clamp(1 - dd / 6, 0.15, 0.6));
    B.st = 'hide'; B.t = rand(5, 9) + (1 - B.brave) * 4;
  },
  unhide(P, B) {
    const s = P.hidden; if (!s) return;
    P.hidden = null; let [x, y] = P.hideFrom || [s.stand[0][0] * 16 + 8, s.stand[0][1] * 16 + 12];
    if (!boxFree(x, y, 5, 6)) { x = s.stand[0][0] * 16 + 8; y = s.stand[0][1] * 16 + 12; }
    P.x = x; P.y = y; s.shake = 0.4; if (G.pVis) puff(s.x * 16 + 8, s.y * 16 + 8, 6);
  },
  // ferme une porte à clé derrière soi quand on est poursuivi (comme les joueurs !)
  lockBehind(P, B) {
    const d = P.lastDoor; if (!d || d === B.lockTried || G.time - (P.lastDoorT || -9) > 2.5 || d.locked || B.locks >= 2) return;
    const dd = dist(P.x, P.y, d.x * 16 + 8, d.y * 16 + 8); if (dd < 22) return;
    B.lockTried = d; if (Math.random() > 0.55 || actorInDoor(d) || dist(G.T.x, G.T.y, d.x * 16 + 8, d.y * 16 + 8) < 26) return;
    d.locked = true; d.byPlayer = true; d.target = 0; d.closeT = 0; B.locks++;
    this.noise(d.x * 16 + 8, d.y * 16 + 8, 5, 'CLIC !', 'lock');
  },
  // l'élève ouvre lui-même une porte qu'il avait fermée
  unlockAhead(P) {
    const n = P.path && P.path[P.pi]; if (!n) return; const i = G.doorIdx[n[1] * G.m.w + n[0]]; const d = i >= 0 ? G.doors[i] : null;
    const B = P.bot; if (d && d.locked && (d.byPlayer || (B && B.keys))) { d.locked = false; d.byPlayer = false; this.noise(d.x * 16 + 8, d.y * 16 + 8, 4, 'CLIC !', 'lock'); }
  },
  react(P, B, s) {
    const T = G.T;
    if (['flee', 'toHide'].includes(B.st)) return;
    if (T.state === 'stun' || T.state === 'sleep' || isBlind(T)) return;   // le surveillant est sonné : on en profite
    const busy = B.st === 'task' || B.st === 'exit' || B.st === 'search';
    const prog = B.st === 'exit' ? B.goal.ex.progress : B.st === 'task' ? (B.goal.task.botP || 0) : 0;
    if (s.spotted) {
      if (busy && prog > 0.75 && s.d > 4) return;   // presque fini : on tente le coup
      this.flee(P, B, true); return;
    }
    if (s.see && s.d < 7) {
      if (busy && prog > 0.6 && s.d > 5) return;
      const h = Math.random() < 0.8 ? this.hideSpot(P, 4) : null;
      if (h && this.route(P, h.stand[0][0], h.stand[0][1])) { B.st = 'toHide'; B.spot = h; return; }
      this.flee(P, B, s.d < 4); return;
    }
    if (s.hear && s.d < 5 && !busy && Math.random() < 0.5) { const h = this.hideSpot(P, 3); if (h && this.route(P, h.stand[0][0], h.stand[0][1])) { B.st = 'toHide'; B.spot = h; } }
  },
  update(dt) {
    const P = G.P, B = P.bot; if (!B) return;
    const ox = P.x, oy = P.y, s = this.sense(P, B);
    if (!P.hidden) this.react(P, B, s);
    P.running = false;
    switch (B.st) {
      case 'plan': P.moving = false; B.t -= dt; if (B.t <= 0) this.plan(P, B); break;
      case 'go': {
        if (B.pauseT > 0) { B.pauseT -= dt; P.moving = false; if (Math.random() < dt * 2) P.ang += rand(-1.2, 1.2); P.face = faceFromAng(P.ang); break; }
        B.peekT -= dt; if (B.peekT <= 0) { B.peekT = rand(5, 10); B.pauseT = rand(0.4, 1.1); }
        this.unlockAhead(P);
        if (followPath(P, PL_SNEAK * 0.92, dt) === 'done') {
          const g = B.goal;
          if (g.k === 'task') { const t = g.task; P.ang = Math.atan2(t.y * 16 + 8 - P.y, t.x * 16 + 8 - P.x); P.face = faceFromAng(P.ang); B.st = 'task'; B.dur = rand(6, 10) * B.taskK; t.botP = t.botP || 0; }
          else if (g.k === 'exit') { B.st = 'exit'; g.ex.progress = g.ex.progress || 0; }
          else { B.st = 'search'; B.t = 1.1; }
        }
        break;
      }
      case 'task': {
        const t = B.goal.task; P.moving = false;
        if (t.done) { B.st = 'plan'; B.t = 0.3; break; }
        t.botP += dt / B.dur;
        B.noiseT -= dt; if (B.noiseT <= 0) { B.noiseT = rand(1.4, 2.6); const nz = t.def.noise; if (nz) this.noise(t.x * 16 + 8, t.y * 16 + 8, nz.r, nz.w); }
        if (t.botP >= 1) {
          t.done = true; G.tasksDone = G.tasks.filter(x => x.done).length; G.tasksRemote = G.tasksDone;
          const n = G.tasks.length; toast('📋 ' + P.cfg.name + ' a fini une tâche (' + G.tasksDone + '/' + n + ')' + (G.tasksDone >= n ? ' : sorties ouvertes ! 😱' : ' !'), 2.4); AU.sfx('ding', 0.5);
          B.st = 'plan'; B.t = rand(0.4, 1);
        }
        break;
      }
      case 'exit': {
        const ex = B.goal.ex; P.moving = false; ex.progress += dt / (ex.time || 3);
        B.noiseT -= dt; if (B.noiseT <= 0) { B.noiseT = 0.7; this.noise(ex.x * 16 + 8, ex.y * 16 + 8, ex.noise || 6, ex.word, ex.snd); }
        if (ex.progress >= 1) { ex.done = true; Solo.escaped(ex, ex.x, ex.y); }
        break;
      }
      case 'search': {
        P.moving = false; B.t -= dt; B.noiseT -= dt; if (B.noiseT <= 0) { B.noiseT = 0.8; this.noise(P.x, P.y - 4, 2.5, 'frrr…'); }
        if (B.t > 0) break;
        const g = B.goal, c = g.cands[g.ci]; G.searched.add(c[1] * G.m.w + c[0]);
        if (g.ex.secret && c[0] === g.ex.secret[0] && c[1] === g.ex.secret[1]) { g.ex.revealed = true; g.ex.done = true; Solo.escaped(g.ex, c[0], c[1]); break; }
        g.ci++;
        if (g.ci < g.cands.length && this.route(P, g.cands[g.ci][0], g.cands[g.ci][1])) B.st = 'go'; else { B.st = 'plan'; B.t = 0.5; }
        break;
      }
      case 'toHide': {
        const h = B.spot; this.unlockAhead(P);
        const r = followPath(P, PL_SNEAK * 1.35, dt);
        if (r === 'done') { if (P.hidden) break; this.hide(P, B, h); }
        break;
      }
      case 'hide': {
        P.moving = false; B.t -= dt;
        if (s.d < 1.6 && Math.random() < dt * (0.15 + B.brave * 0.3)) { this.unhide(P, B); this.flee(P, B, true); break; }   // panique !
        if (B.t <= 0) { if (G.time - B.seenT > 2.5) { this.unhide(P, B); B.st = 'plan'; B.t = rand(0.3, 0.8); } else B.t = 1.2; }
        break;
      }
      case 'flee': {
        this.unlockAhead(P);
        const sp = B.hurry ? PL_RUN : PL_SNEAK * 1.3; P.running = B.hurry;
        const r = followPath(P, sp, dt); B.fleeT -= dt;
        if (B.hurry) this.lockBehind(P, B);
        if (r === 'done' || B.fleeT <= 0) {
          if (G.time - B.seenT > 1.2) { const h = this.hideSpot(P, 3); if (h && Math.random() < 0.6 && this.route(P, h.stand[0][0], h.stand[0][1])) { B.st = 'toHide'; B.spot = h; break; } }
          if (s.see && s.d < 6) this.flee(P, B, s.spotted); else { B.st = 'plan'; B.t = rand(0.3, 0.9); }
        }
        break;
      }
    }
    P.vx = (P.x - ox) / Math.max(dt, 1e-3); P.vy = (P.y - oy) / Math.max(dt, 1e-3);
    if (!P.moving) P.running = false;
  }
};

// ---------- la partie ----------
const Solo = {
  lv: 0,
  on() { return !!(G.net && G.net.solo); },
  best() { const b = store.get('nds_solo', {}); return b && typeof b === 'object' ? b : {}; },
  levels() {
    UI.openLevels();
    $('lvlH').textContent = '🚨 Où surveilles-tu ?'; document.querySelector('#sLevels .who').classList.add('hidden');
    const list = $('lvlList'); list.innerHTML = ''; const best = this.best();
    LEVELS.forEach((L, i) => {
      const pr = PROFS[L.prof], b = document.createElement('button'); b.className = 'lvl';
      b.innerHTML = `<canvas width="22" height="34"></canvas><div style="flex:1"><div class="ln">NIVEAU ${i + 1}</div><div class="lt"></div><div class="lp"></div><div class="st">${best[i] ? '🚨 Record : ' + best[i] + ' attrapé' + (best[i] > 1 ? 's' : '') : '<span style="opacity:.5">Jamais surveillé</span>'}</div></div>`;
      b.querySelector('.lt').textContent = L.title; b.querySelector('.lp').textContent = 'Tu es ' + pr.name + ', ' + pr.title;
      portrait(b.querySelector('canvas'), pr.cfg, pr.v, 1);
      b.addEventListener('click', () => { AU.init(); AU.sfx('blip'); this.start(i); });
      b.style.animationDelay = (i * 0.07) + 's'; list.appendChild(b);
    });
  },
  start(lv) {
    this.lv = lv; if (Net.conn) Net.close(true);
    const name = pick(SOLO_NAMES), seed = UI.procOn() ? newSeed() : null;
    startLevel(lv, randomChar(name), null, { robots: true, seed });
    G.net = { role: 'teacher', solo: true }; Net.isHost = true; Net.timeLeft = SOLO_TIME; Net.seenT = 1;
    const T = G.T; T.hasKeys = !!T.prof.hasKeys; T.netLocal = true;
    G.solo = { caught: 0, out: 0, lives: SOLO_LIVES, wave: 1, phase: 'hunt', calmT: 0, rumorT: 32, leaveT: 0, used: [name] };
    Bot.reset(G.P, 1);
    this.intro();
  },
  intro() {
    const L = LEVELS[this.lv], pr = G.T.prof;
    $('inNum').textContent = 'SURVEILLANCE · NIVEAU ' + (this.lv + 1);
    $('inTitle').textContent = L.title;
    $('inName').textContent = pr.name; $('inRole').textContent = 'C’est toi ! Garde l’œil ouvert.';
    $('inQuote').textContent = '« Personne ne sèche les cours quand je suis de service. »';
    $('inMission').innerHTML = '<b style="color:var(--yel)">Mission :</b> attrape les élèves qui sèchent. Tu as leur <b>photo</b> 📸. Au bout de 3 évasions, fin de service.';
    portrait($('inProf'), pr.cfg, pr.v, 1);
    $('inHints').innerHTML = ''; $('inHints').dataset.title = '🚪 Les sorties à surveiller'; L.hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    $('inTips').innerHTML = ['📸 La <b>photo</b> de l’élève recherché·e est en haut à droite.', '✋ Attrape de près. Pas le bon ? La tête qui tourne 3 s.', '🔍 Fouille les cachettes : ça adore s’y planquer.', '📋 L’élève fait 3 <b>tâches</b>, puis file vers une sortie.', '👂 « CLAC ! », bruits, traces de pas : il n’est pas loin.', '🔑 Porte fermée à clé ? Les clés sont au tableau.', '📻 Attrapé·e ? Patrouille jusqu’au prochain signalement.'].join('<br>');
    G.mode = 'intro'; UI.show('sIntro'); UI.hudSig = null; UI.invSig = null; $('bGo').textContent = 'En service ! 🚨'; $('bGo').disabled = false;
    $('toast').classList.add('hidden'); $('banner').classList.add('hidden'); $('hint').classList.add('hidden');
    AU.play('sneak');
  },
  go() {
    G.mode = 'play'; UI.show('play'); FX.iris = { mode: 'in', t: 0, dur: 0.75 }; AU.play('sneak'); UI.hudSig = null; UI.invSig = null; this.sig = null;
    const T = G.T; T.state = 'count'; T.st = 3.3; T.countN = 0;
    $('hud').classList.add('solo');
  },
  tick(dt) {
    const S = G.solo, P = G.P;
    if (S.phase === 'hunt') { Bot.update(dt); this.rumor(dt); }
    else if (S.phase === 'gone') {
      S.leaveT -= dt; P.moving = false;
      if (S.leaveT <= 0) {
        if (G.pVis) puff(P.x, P.y - 10, 14, '#ffffff');
        P.out = true; P.x = -9999; P.y = -9999; P.hidden = null;
        if (S.lives <= 0) { this.end('lives'); return; }
        S.phase = 'calm'; S.calmT = rand(9, 15) * (S.wave > 3 ? 0.8 : 1);
      }
    } else if (S.phase === 'calm') { S.calmT -= dt; if (S.calmT <= 0) this.signal(); }
  },
  // personne ne l'a vu depuis longtemps ? un élève donne un indice
  rumor(dt) {
    const S = G.solo, P = G.P; if (G.pVis || G.T.state === 'count') { S.rumorT = Math.max(S.rumorT, 20); return; }
    S.rumorT -= dt; if (S.rumorT > 0) return; S.rumorT = 30;
    const [x, y] = P.hidden ? [P.hidden.x, P.hidden.y] : Bot.tile(P), room = G.m.roomAt(x, y) || 'le couloir';
    UI.banner('📻 Un élève a vu ' + P.cfg.name + ' : « ' + room + ' »'); AU.sfx('ding', 0.4);
  },
  caught(reason) {
    const S = G.solo, P = G.P, T = G.T; if (!S || S.phase !== 'hunt') return;
    if (P.hidden) { const s = P.hidden; P.hidden = null; if (s.k === K.DOOR) { const d = doorAt(s.x, s.y); if (d) d.hideP = false; } const st = s.stand[0]; P.x = st[0] * 16 + 8; P.y = st[1] * 16 + 12; puff(s.x * 16 + 8, s.y * 16 + 8, 12); }
    Bot.stop(P); S.caught++; S.phase = 'gone'; S.leaveT = 1.7; S.wave++;
    const n = P.cfg.name, line = pick(['Direction la salle de colle, {n} !', 'Heure de colle, {n} !', 'Attrapé·e, {n} ! En colle !', 'On ne m’échappe pas, {n} !']).replace('{n}', n);
    T.bubble = { text: line, t: 0, dur: 2.6 }; AU.say(line, T.prof, 1); setMark(T, '!', 1.5); hop(T, 90);
    cue(P.x, P.y - 38, 'word', pick(['Nooon !', 'Pas juste !', 'Zut !', 'J’ai rien fait !']), { col: '#ffffff', pop: true, life: 1.5 });
    FX.comic = { t: 0, text: reason === 'found' ? 'TROUVÉ !' : 'ATTRAPÉ !' }; FX.punch(0.22); FX.flash = 0.8; FX.flashCol = '255,255,255'; G.shake = 0.4; AU.sfx('caught');
    const mx = (P.x + T.x) / 2, my = (P.y + T.y) / 2 - 10; puff(mx, my, 18, '#ffffff'); for (let i = 0; i < 8; i++) part(mx, my, 'star', { vx: rand(-60, 60), vy: rand(-70, 10), g: 80, life: 1, col: pick(['#ffd23f', '#ffffff', '#ff6f91']) });
    UI.banner('🚨 ' + n + ' file en colle ! (' + S.caught + ' attrapé' + (S.caught > 1 ? 's' : '') + ')');
    G.tasksRemote = 0; this.sig = null;
  },
  escaped(ex, x, y) {
    const S = G.solo, P = G.P, T = G.T; if (S.phase !== 'hunt') return;
    Bot.stop(P); P.hidden = null; S.out++; S.lives--; S.phase = 'gone'; S.leaveT = 1.2; S.wave++;
    const wx = x * 16 + 8, wy = y * 16 + 10, n = P.cfg.name;
    confetti(wx, wy, 30); sparkle(wx, wy, 16); cue(wx, wy - 24, 'word', 'ÉVADÉ·E !', { col: '#ff8a96', pop: true, life: 1.8 });
    FX.comic = { t: 0, text: 'ÉVADÉ·E !' }; FX.punch(0.15); AU.sfx('fail');
    T.bubble = { text: pick(['Mais… ! Reviens ici !', 'Noooon !', 'Pas encore une évasion !', 'Le directeur va me tuer…']), t: 0, dur: 2.4 };
    UI.banner('😱 ' + n + ' s’est évadé·e ! ' + (S.lives > 0 ? '❤️'.repeat(S.lives) + ' restant' + (S.lives > 1 ? 's' : '') : 'Fin de service…'));
    G.tasksRemote = 0; this.sig = null;
  },
  // un nouvel élève sèche les cours
  signal() {
    const S = G.solo, P = G.P, L = G.L, T = G.T;
    const names = SOLO_NAMES.filter(n => !S.used.includes(n)), name = pick(names.length ? names : SOLO_NAMES); S.used.push(name);
    const cfg = randomChar(name); P.cfg = cfg; P.disguised = false;
    G.tasks = shuffle(L.taskPool.slice()).slice(0, 3).map(t => Object.assign({ def: TASKDEFS[t.id], done: false, room: L.m.roomAt(t.x, t.y) }, t)); G.tasksDone = 0; G.tasksRemote = 0;
    L.exits.forEach(e => { e.done = false; e.progress = 0; e.revealed = false; if (e.type === 'search' && e.cands) e.secret = pick(e.cands); });
    G.searched = new Set();
    // les deux sosies changent de tenue
    G.kids.slice(0, 2).forEach((k, i) => Object.assign(k.cfg, i === 0 ? { top: cfg.top, topCol: cfg.topCol, bottom: cfg.bottom, botCol: cfg.botCol } : { hair: cfg.hair, hairCol: cfg.hairCol, topCol: cfg.topCol, skin: cfg.skin }));
    const spots = []; L.taskPool.forEach(t => spots.push(t.stand[0])); L.hides.forEach(h => { if (!h.small) spots.push(h.stand[0]); });
    const far = spots.filter(([x, y]) => Bot.reach(x, y) && dist(x * 16 + 8, y * 16 + 12, T.x, T.y) > 14 * 16), s = pick(far.length ? far : spots);
    P.x = s[0] * 16 + 8; P.y = s[1] * 16 + 12;
    Bot.reset(P, S.wave); S.phase = 'hunt'; S.rumorT = 32; this.sig = null;
    const room = G.m.roomAt(s[0], s[1]) || 'le couloir';
    UI.banner('📻 Signalement : ' + name + ' sèche les cours (« ' + room + ' ») !'); AU.sfx('ding'); setMark(T, '!', 1.2);
    T.bubble = { text: pick(['Encore un·e !', 'On ne m’échappe pas, ' + name + ' !', 'Allez, au travail…', 'Je t’ai à l’œil, ' + name + ' !']), t: 0, dur: 2.2 };
  },
  // la photo de l'élève recherché, en haut à droite
  hud() {
    const S = G.solo, el = $('hWanted'); if (!S) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const P = G.P, sig = S.phase + '|' + (P.cfg && P.cfg.name) + '|' + S.caught + '|' + S.lives;
    if (sig === this.sig) return; this.sig = sig;
    const hunt = S.phase === 'hunt';
    el.classList.toggle('calm', !hunt);
    $('wantT').textContent = hunt ? 'RECHERCHÉ·E' : '📻 CALME';
    if (hunt) portrait($('wantCv'), P.cfg, null, 1); else { const c = $('wantCv').getContext('2d'); c.clearRect(0, 0, 22, 34); }
    $('wantN').textContent = hunt ? P.cfg.name : 'Patrouille…';
    $('wantS').textContent = '🚨' + S.caught + ' ' + '❤️'.repeat(Math.max(0, S.lives)) + '🖤'.repeat(Math.max(0, SOLO_LIVES - S.lives));
    if (hunt) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  },
  end(why) {
    if (G.mode === 'result') return; G.mode = 'result'; $('hud').classList.remove('solo'); AU.play(null);
    const S = G.solo, best = this.best(), lv = this.lv, rec = S.caught > (best[lv] || 0);
    if (rec) { best[lv] = S.caught; store.set('nds_solo', best); }
    const pr = G.T.prof, t = SOLO_TIME - Math.max(0, Net.timeLeft), mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    const title = why === 'time' ? 'FIN DE LA<br>JOURNÉE !' : 'FIN DE<br>SERVICE !', col = S.caught >= 3 ? 'var(--green)' : S.caught ? 'var(--yel)' : 'var(--red)';
    const verdict = S.caught >= 5 ? 'Légende de la surveillance. Les élèves parlent de toi en chuchotant.' : S.caught >= 3 ? 'Redoutable. La salle de colle affiche complet.' : S.caught >= 1 ? 'Pas mal. Mais certains courent encore.' : 'Personne en colle… Les élèves fêtent ça à la cantine.';
    const p = $('resPanel');
    p.innerHTML = `<div class="bigtitle" style="color:${col}">${title}</div>
      <div class="prof"><canvas id="rProf" width="20" height="34"></canvas><div class="quote"></div></div>
      <div class="stats"><span>🚨 ${S.caught} en colle</span><span>😱 ${S.out} évadé${S.out > 1 ? 's' : ''}</span><span>⏱️ ${mm}</span></div>
      ${rec && S.caught ? '<div class="tips" style="text-align:center">🏆 Nouveau record sur ce niveau !</div>' : ''}
      <button class="btn big green" id="rAgain">↻ Reprendre le service</button>
      <div class="row"><button class="btn" id="rLv">🏫 Autre niveau</button><button class="btn ghost" id="rHome">🏠 Menu</button></div>`;
    portrait($('rProf'), pr.cfg, pr.v, 1); p.querySelector('.quote').textContent = '« ' + verdict + ' »';
    $('rAgain').onclick = () => { AU.sfx('blip'); this.start(lv); };
    $('rLv').onclick = () => { AU.sfx('blip'); this.quit(); this.levels(); };
    $('rHome').onclick = () => { AU.sfx('blip'); this.quit(); UI.openTitle(); };
    UI.show('sResult'); AU.sfx(S.caught ? 'win' : 'fail');
  },
  quit() { G.net = null; G.solo = null; G.mode = 'menu'; $('hud').classList.remove('solo'); $('hWanted').classList.add('hidden'); }
};
