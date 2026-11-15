// ================= MODE À DEUX (pair-à-pair, PeerJS) =================
const PAGES_URL = 'https://distortedimages-code.github.io/echappe-au-prof/';
const Net = {
  peer: null, conn: null, role: null, isHost: false, mode: 'classic', code: '', connected: false, closing: false,
  ready: { me: false, them: false }, lastRecv: 0, sendT: 0, kidsT: 0, seenT: 0, them: { name: '', cfg: null }, level: 0, timeLeft: 180, setup: null, joinTimer: null,
  available() { return typeof RTCPeerConnection !== 'undefined' && (location.protocol === 'file:' || /github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)); },
  loadLib() {
    return new Promise((res, rej) => {
      if (window.Peer) return res();
      const add = (src, ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); };
      add('peerjs.min.js', () => res(), () => add('https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', () => res(), () => rej(new Error('lib'))));
    });
  },
  // serveurs pour se trouver à travers les box et la 4G/5G : STUN (adresse publique) + relais TURN si le direct est bloqué
  // RELAY : relais perso (ex. ExpressTURN) — vide tant qu'on n'en a pas ; on peut aussi en coller un via ?turn=…&tu=…&tp=…
  RELAY: null,
  iceServers() {
    const q = new URLSearchParams(location.search), list = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478', 'turn:eu-0.turn.peerjs.com:3478?transport=tcp'], username: 'peerjs', credential: 'peerjsp' }
    ];
    let mine = this.RELAY;
    try { const st = JSON.parse(localStorage.getItem('nds_turn') || 'null'); if (st && st.urls) mine = st; } catch (e) { }
    if (q.get('turn')) mine = { urls: q.get('turn').split(','), username: q.get('tu') || '', credential: q.get('tp') || '' };
    if (mine) list.unshift(mine);
    return list;
  },
  opts() {
    const q = new URLSearchParams(location.search), o = { debug: 0, config: { iceServers: this.iceServers(), sdpSemantics: 'unified-plan' } };
    if (q.get('peerhost')) { o.host = q.get('peerhost'); o.port = +q.get('peerport') || 9000; o.path = q.get('peerpath') || '/'; o.secure = false; o.config = { iceServers: [] }; }
    return o;
  },
  // direct ou par le relais ? (affiché dans le salon, pratique pour comprendre un souci de 5G)
  async linkKind() {
    try {
      const pc = this.conn && this.conn.peerConnection; if (!pc) return '';
      const st = await pc.getStats(); let pair = null, loc = {};
      st.forEach(r => { if (r.type === 'transport' && r.selectedCandidatePairId) pair = st.get(r.selectedCandidatePairId); });
      if (!pair) st.forEach(r => { if (r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded') pair = r; });
      if (!pair) return ''; st.forEach(r => { if (r.id === pair.localCandidateId || r.id === pair.remoteCandidateId) loc[r.id] = r.candidateType; });
      return Object.values(loc).includes('relay') ? 'relais' : 'direct';
    } catch (e) { return ''; }
  },
  idFor(code) { return 'echappe-au-prof-v1-' + code.toLowerCase(); },
  newCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; },
  errText(e) {
    const t = e && e.type;
    if (t === 'peer-unavailable') return 'Code introuvable : vérifie les 4 lettres (et que l’autre joueur attend bien).';
    if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return 'Pas de connexion au service de mise en relation. Vérifie internet et réessaie.';
    if (t === 'browser-incompatible') return 'Ce navigateur ne permet pas le jeu à deux.';
    return 'Oups, la connexion a échoué (' + (t || 'inconnu') + ').';
  },
  async host(role, level) {
    try { await this.loadLib(); } catch (e) { Multi.error('Impossible de charger le module réseau.'); return; }
    this.close(true); this.closing = false; this.isHost = true; this.role = role; this.level = level; this.ready = { me: false, them: false };
    this.tryHost(0);
  },
  tryHost(n) {
    this.code = this.newCode();
    const p = new Peer(this.idFor(this.code), this.opts()); this.peer = p;
    p.on('open', () => Multi.waiting(this.code));
    p.on('connection', c => { if (this.conn && this.conn.open) { c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); }); return; } this.bind(c); });
    p.on('error', e => { if (e.type === 'unavailable-id' && n < 6) { p.destroy(); this.tryHost(n + 1); } else if (!this.connected) Multi.error(this.errText(e)); });
    p.on('disconnected', () => { if (!this.closing) try { p.reconnect(); } catch (e) { } });
  },
  async join(code) {
    try { await this.loadLib(); } catch (e) { Multi.error('Impossible de charger le module réseau.'); return; }
    this.close(true); this.closing = false; this.isHost = false; this.code = code; this.ready = { me: false, them: false };
    const p = new Peer(undefined, this.opts()); this.peer = p;
    p.on('open', () => {
      const c = p.connect(this.idFor(code), { reliable: true, serialization: 'json' }); this.bind(c);
      this.joinTimer = setTimeout(() => { if (!this.connected) Multi.error('Impossible de rejoindre. Vérifiez internet… En 4G/5G, réessayez : la mise en relation passe parfois au 2e essai.'); }, 20000);
    });
    p.on('error', e => { if (!this.connected) Multi.error(this.errText(e)); });
  },
  bind(c) {
    this.conn = c;
    c.on('open', () => {
      this.connected = true; clearTimeout(this.joinTimer); this.lastRecv = performance.now();
      const me = UI.cfg(); this.send({ t: 'hello', name: me ? me.name : 'Joueur', cfg: me || randomChar('Élève') });
      Multi.status('Connecté ! Préparation de la partie…');
      setTimeout(async () => { const k = await this.linkKind(); this.kind = k; if (k && !$('sMulti').classList.contains('hidden')) Multi.status('Connecté' + (k === 'relais' ? ' (via le relais 🛰️)' : ' en direct ⚡') + ' ! Préparation de la partie…'); }, 1200);
    });
    c.on('data', d => { this.lastRecv = performance.now(); try { this.recv(d); } catch (e) { console.error(e); } });
    c.on('close', () => this.lost());
    c.on('error', () => this.lost());
  },
  send(o) { if (G.inf && G.inf.multi && o.fl == null) o.fl = G.inf.cur; if (this.conn && this.conn.open) try { this.conn.send(o); } catch (e) { } },
  close(silent) {
    this.closing = true;
    if (this.conn) { try { if (!silent) this.conn.send({ t: 'bye' }); } catch (e) { } try { this.conn.close(); } catch (e) { } }
    if (this.peer) { try { this.peer.destroy(); } catch (e) { } }
    this.conn = null; this.peer = null; this.connected = false; clearTimeout(this.joinTimer);
  },
  lost() {
    if (this.closing) return;
    this.close(true); G.net = null;
    if (['play', 'intro', 'escape', 'caught', 'timeup', 'result', 'paused'].includes(G.mode) || $('sMulti').classList.contains('hidden') === false) {
      G.mode = 'menu'; Multi.open(); Multi.error('La connexion avec l’autre joueur a été perdue 😢');
    }
  },
  // ---------- déroulement ----------
  studentCfg() { return this.role === 'student' ? UI.cfg() : this.them.cfg; },
  newRound(swap, level) {
    if (!this.isHost) { this.send({ t: 'rematch', swap: !!swap, lvl: level }); return; }
    if (this.mode === 'guard') {
      // deux surveillants contre deux fugueurs (l'ordinateur)
      this.role = 'teacher';
      const seed = newSeed(), fugs = [randomChar('Fugueur'), randomChar('Fugueuse')];
      infStart(UI.cfg() || randomChar('Surveillant'), seed, { role: 'teacher', guard: true, host: true, fugs });
      this.setup = { t: 'setup', mode: 'guard', seed, time: GUARD_TIME, fugs };
      this.send(this.setup); this.enter(this.setup); return;
    }
    if (this.mode === 'coop') {
      // en équipe : deux élèves contre les profs, chacun avec son perso (modifiable dans l'intro)
      this.role = 'student';
      const h = Object.assign({}, UI.cfg() || randomChar('Élève')), g = Object.assign({}, this.them.cfg || randomChar(this.them.name || 'Élève')), seed = newSeed();
      h.name = h.name || 'Joueur 1'; g.name = g.name || this.them.name || 'Joueur 2';
      infStart(h, seed, { coop: true, host: true, cfg2: g });
      this.setup = { t: 'setup', mode: 'coop', seed, time: 480, cfgH: h, cfgG: g };
      this.send(this.setup); this.enter(this.setup); return;
    }
    if (this.mode === 'inf') {
      // infiltration : rôles tirés au sort, nouveau collège, nouveau look secret pour l'élève
      this.role = Math.random() < 0.5 ? 'student' : 'teacher';
      const sname = this.role === 'student' ? (UI.cfg() || {}).name : this.them.name, scfg = randomChar(sname || 'Élève'), seed = newSeed();
      infStart(scfg, seed, { role: this.role });
      this.setup = { t: 'setup', mode: 'inf', seed, hostRole: this.role, time: 360, student: scfg };
      this.send(this.setup); this.enter(this.setup); return;
    }
    if (swap) this.role = this.role === 'student' ? 'teacher' : 'student';
    if (level != null) this.level = clamp(level, 0, LEVELS.length - 1);
    // nouvelle apparence secrète à chaque manche : le prof ne sait pas à quoi ressemble l'élève
    const base = this.studentCfg(), scfg = randomChar((base && base.name) || 'Élève');
    const seed = UI.procOn() ? newSeed() : null;
    startLevel(this.level, scfg, null, { robots: true, seed });
    this.setup = {
      t: 'setup', lvl: this.level, hostRole: this.role, time: 180,
      items: G.items.map(i => ({ id: i.id, x: i.x, y: i.y, kind: i.kind })),
      secrets: G.L.exits.map(e => e.secret || null),
      kids: G.kids.map(k => ({ cfg: k.cfg, beh: k.beh, x: k.x, y: k.y })), ball: G.ball ? [G.ball.from, G.ball.to] : null,
      student: scfg, seed: G.seed, tasks: G.tasks.map(t => G.L.taskPool.findIndex(p => p.id === t.id && p.x === t.x && p.y === t.y))
    };
    this.send(this.setup);
    this.enter(this.setup);
  },
  enter(setup) {
    this.timeLeft = setup.time; this.ready = { me: false, them: false };
    G.net = { role: this.role };
    const T = G.T; T.hasKeys = !!T.prof.hasKeys; T.netLocal = this.role === 'teacher'; G.alarmT = 0;
    Multi.intro();
  },
  setReady() {
    this.ready.me = true; this.send({ t: 'ready' });
    $('bGo').textContent = '⏳ On attend l’autre…'; $('bGo').disabled = true;
    this.maybeGo();
  },
  maybeGo() { if (this.isHost && this.ready.me && this.ready.them) { this.send({ t: 'go' }); this.start(); } },
  start() {
    G.mode = 'play'; UI.show('play'); FX.iris = { mode: 'in', t: 0, dur: 0.75 }; AU.play('sneak');
    UI.hudSig = null; UI.invSig = null; $('bGo').disabled = false;
    const T = G.T; if (G.inf) { if (!G.inf.coop) T.state = 'free'; G.inf.grace = 2; } else { T.state = 'count'; T.st = 3.3; T.countN = 0; }
    $('hint').classList.add('hidden');
  },
  // ---------- réception ----------
  recv(d) {
    const P = G.P, T = G.T, L = G.L;
    switch (d.t) {
      case 'full': Multi.error('Cette partie est déjà complète.'); this.close(true); break;
      case 'hello':
        this.them = { name: d.name || 'Joueur', cfg: d.cfg };
        if (this.isHost) this.newRound(false);
        break;
      case 'setup':
        this.role = d.hostRole === 'student' ? 'teacher' : 'student'; this.setup = d; this.mode = d.mode || 'classic';
        if (d.mode === 'guard') { this.role = 'teacher'; infStart(UI.cfg() || randomChar('Surveillant'), d.seed, { role: 'teacher', guard: true, host: false, fugs: d.fugs }); }
        else if (d.mode === 'coop') { this.role = 'student'; infStart(d.cfgG, d.seed, { coop: true, host: false, cfg2: d.cfgH }); }
        else if (d.mode === 'inf') infStart(d.student, d.seed, { role: this.role });
        else { this.level = d.lvl; startLevel(d.lvl, d.student, d); }
        this.enter(d);
        break;
      case 'ready': this.ready.them = true; this.maybeGo(); break;
      case 'go': this.start(); break;
      case 'rematch': if (this.isHost) this.newRound(d.swap, d.lvl); break;
      case 'bye': this.closing = true; this.close(true); G.net = null; G.mode = 'menu'; Multi.open(); Multi.error('L’autre joueur a quitté la partie.'); break;
    }
    if (!G.net || !G.P) return;
    if (G.inf && G.inf.coop && coopRecv(d)) return;
    if (G.inf && G.inf.guard && guardRecv(d)) return;
    switch (d.t) {
      case 's': if (this.role === 'teacher') { P.sqN = d.sq || 0; P.sqId = d.sqi || 0; if (G.inf) infRecvPos(P, d); else P.net = d; } break;
      case 'T': if (this.role === 'student') { if (G.inf) infRecvPos(T, d); else T.net = d; } break;
      case 'k': if (G.inf) { if (d.fl === G.inf.cur && !infAuth()) d.a.forEach(a => { const k = G.kids[a[0]]; if (k) k.net = a.slice(1); }); break; }
        if (!this.isHost) { d.a.forEach((a, i) => { const k = G.kids[i]; if (k) k.net = a; }); if (G.ball && d.b) { G.ball.from = d.b[0]; G.ball.to = d.b[1]; G.ball.t = d.b[2]; } } break;
      case 'lock': { const dr = (G.inf ? infFloorOf(d).doors : G.doors)[d.i]; if (G.inf && d.fl !== G.inf.cur) { if (dr) { dr.locked = !!d.l; dr.byPlayer = !!d.l; } break; } if (dr) { dr.locked = !!d.l; dr.byPlayer = !!d.l; if (dr.locked) { dr.target = 0; dr.closeT = 0; } const V0 = viewerA(), dd = dist(dr.x * 16, dr.y * 16, V0.x, V0.y) / 16; if (dd < 16) { AU.sfx('lock', clamp(1 - dd / 16, 0.2, 1)); cue(dr.x * 16 + 8, dr.y * 16 + 4, 'word', 'CLIC !', { col: '#ffd23f', pop: true }); } } break; }
      case 'item': if (G.inf) { const arr = infFloorOf(d).items, j = arr.findIndex(i => i.id === d.id); if (j >= 0) arr.splice(j, 1); } else G.items = G.items.filter(i => i.id !== d.id); break;
      case 'apple': if (G.inf && d.fl !== G.inf.cur) { infFloorOf(d).apples.push({ id: d.id, x: d.x, y: d.y, eaten: false }); break; } G.apples.push({ id: d.id, x: d.x, y: d.y, eaten: false }); break;
      case 'eat': { const a = G.apples.find(a => a.id === d.id); if (a) { a.eaten = true; G.apples = G.apples.filter(b => b !== a); } AU.sfx('crunch', 0.6); break; }
      case 'sqUse': squishyRecv(d); break;
      case 'slow': G.slowT = d.d; FX.flash = 0.6; FX.flashCol = '140,190,255'; AU.sfx('slow'); toast('⏱️ Montre magique : mode tortue activé.', 2.2); break;
      case 'pouf': if (G.inf && d.fl !== G.inf.cur) break; puff(d.x, d.y - 6, 16, '#c8b0ff'); AU.sfx('pouf', 0.6); if (dist(d.x, d.y, T.x, T.y) < 12 * 16) cue(d.x, d.y - 20, 'word', 'POUF !', { col: '#c8b0ff', pop: true }); break;
      case 'noise': if (G.inf && d.fl !== G.inf.cur) break; if (this.role === 'teacher') { const dd = dist(T.x, T.y, d.x, d.y) / 16; if (dd < d.r * 1.8 && !G.pVis) cue(d.x, d.y - 8, 'word', d.w || '?!', { col: '#ffb347', pop: true, life: 1.2 }); } break;
      case 'tcheck': { if (G.inf && d.fl !== G.inf.cur) break; const s = L.hides[d.i]; if (s) { s.shake = 1; const dd = dist(T.x, T.y, P.x, P.y) / 16; AU.sfx('search', clamp(1 - dd / 14, 0, 0.8)); if (!G.tVis && dd < 14) cue(s.x * 16 + 8, s.y * 16, 'word', 'frrr…', { col: '#ffd0a0', life: 1 }); T.state = 'check'; T.checkT = 1; } break; }
      case 'keys': T.hasKeys = true; if (dist(T.x, T.y, P.x, P.y) < 16 * 16 && !G.tVis) cue(T.x, T.y - 24, 'word', 'cling cling', { col: '#ffd23f', life: 1 }); AU.sfx('keys', 0.5); break;
      case 'say': if (G.inf && d.fl !== G.inf.cur) break; T.bubble = { text: d.text, t: 0, dur: Math.max(2, d.text.length * 0.075) }; { const dd = dist(T.x, T.y, P.x, P.y) / 16; if (dd < 20) AU.say(d.text, T.prof, clamp(1.25 - dd / 15, 0.15, 1)); } break;
      case 'spot':
        G.spotted++; FX.spotted(); setMark(T, '!', 1.3); T.flashT = 0.18; hop(T, 90); G.shake = 0.25; AU.sfx('spot');
        if (T.prof.whistle) { AU.sfx('whistle', 0.8); cue(T.x, T.y - 26, 'word', 'PRIIIT !', { col: '#9fe0ff', life: 1 }); }
        G.alarmT = 3; AU.play('chase'); break;
      case 'seen': G.alarmT = Math.max(G.alarmT || 0, 2.5); break;
      case 'caught': caught(d.r, true); break;
      case 'grabfail': if (G.inf && d.fl !== G.inf.cur) break; grabFail(d.i, true, d.li); if (this.role === 'student') { T.state = 'stun'; T.checkT = 0; const k = G.kids[d.i]; if (k && dist(k.x, k.y, P.x, P.y) < 14 * 16) cue(T.x, T.y - 30, 'word', 'RATÉ !', { col: '#9fe0ff', pop: true }); } break;
      case 'task': G.tasksRemote = d.n; if (this.role === 'teacher') { toast('📋 ' + (P.cfg.name || 'L’élève') + ' a fini une tâche (' + d.n + '/' + (G.tasks.length || 3) + ')' + (d.n >= (G.tasks.length || 3) ? ' : sorties ouvertes ! 😱' : ' !'), 2.4); AU.sfx('ding', 0.5); } break;
      case 'undisguise': if (this.role === 'teacher') { if (G.pVis) { puff(P.x, P.y - 10, 14, '#ffffff'); cue(P.x, P.y - 36, 'word', 'DÉMASQUÉ !', { col: '#ff9fd8', pop: true }); } P.cfg = d.cfg; P.disguised = false; } break;
      case 'disguise': if (this.role === 'teacher') { if (G.pVis) { puff(P.x, P.y - 10, 18, '#ffffff'); cue(P.x, P.y - 36, 'word', 'POUF !', { col: '#ffd23f', pop: true }); } P.cfg = d.cfg; P.disguised = true; } break;
      case 'escape': {
        if (G.inf && G.inf.cur !== 0) { G.mode = 'escape'; G.escT = 1.9; G.escFrom = [-9999, -9999]; G.escTo = [-9999, -9999]; break; }
        const ex = (G.inf ? G.inf.floors[0].L : L).exits[d.e]; if (ex) escape(ex, d.x, d.y, true); break;
      }
      case 'look': if (this.role === 'teacher') { P.cfg = d.cfg; } break;
      case 'warn': if (G.inf) infRecvWarn(d); break;
      case 'alarm': if (G.inf && !G.inf.alarmUsed) { infAlarm(); UI.banner('🔥 ALARME au ' + INF_FLOOR_META[d.fl].name + ' ! Tout le monde dehors.'); } break;
      case 'call': if (G.inf) { if (d.ok) { UI.banner('📋 L’appel : « ' + (P.cfg.name || 'l’élève') + ' » : présent·e. L’innocence même.'); } else { G.inf.hunt = true; G.inf.warn = 3; UI.banner('📋 Il manque ' + (P.cfg.name || 'l’élève') + ' à l’appel : encore dans le bâtiment !'); } AU.sfx('ding'); } break;
      case 'alarmEnd': if (G.inf && G.inf.alarm) infAlarmEnd(); break;
      case 'calm': if (G.inf) { G.inf.hunt = false; G.inf.warn = 2; toast('😮‍💨 ' + (P.cfg.name || 'L’élève') + ' est resté·e planqué·e. Traque terminée.', 2.8); UI.infSig = null; } break;
      case 'trousseau': if (G.inf) { G.inf.keys = true; toast('🔑 Trousseau volé (' + INF_FLOOR_META[G.inf.keysFloor].name + ') ! Grille et portail en danger…', 3); AU.sfx('keys'); } break;
      case 'planTaken': if (G.inf) { toast('🗺️ Le plan d’évacuation du ' + INF_FLOOR_META[d.fl].name + ' arraché : l’élève te voit venir !', 3); } break;
      case 'end': timeUp(); break;
    }
  },
  // ---------- envoi régulier ----------
  tick(dt) {
    if (G.inf && G.inf.coop) { coopNetTick(dt); return; }
    this.sendT -= dt;
    if (this.sendT <= 0) {
      this.sendT = 0.05;
      const P = G.P, T = G.T;
      if (this.role === 'student') this.send({ t: 's', fl: G.inf ? G.inf.cur : undefined, x: +P.x.toFixed(1), y: +P.y.toFixed(1), f: P.face, m: P.moving ? 1 : 0, r: P.running ? 1 : 0, sm: P.small > 0 ? 1 : 0, sl: P.slip > 0 ? 1 : 0, h: P.hidden ? P.hidden.idx : -1, sk: P.skidT > 0 ? 1 : 0, sq: squishyCount(P), sqi: P.sqIds && P.sqIds.length ? P.sqIds[0] : 0 });
      else this.send({ t: 'T', fl: G.inf ? G.inf.cur : undefined, x: +T.x.toFixed(1), y: +T.y.toFixed(1), a: +T.ang.toFixed(2), f: T.face, m: T.moving ? 1 : 0, r: T.running ? 1 : 0, st: T.state, k: T.hasKeys ? 1 : 0 });
    }
    if (G.inf && G.inf.guard) guardNetTick(dt);
    if (G.inf) {
      this.kidsT -= dt;
      if (this.role === 'student' && G.T.fl === G.inf.cur && this.kidsT <= 0) { this.kidsT = 0.1; const a = []; G.kids.forEach((k, i) => { if (k.beh !== 'sit' && k.beh !== 'crowd') a.push([i, Math.round(k.x), Math.round(k.y), k.face, k.moving ? 1 : 0, k.runK ? 1 : 0, +((k.ang || 0).toFixed(2))]); }); this.send({ t: 'k', a }); }
    } else if (this.isHost && G.kids.length) {
      this.kidsT -= dt;
      if (this.kidsT <= 0) { this.kidsT = 0.1; this.send({ t: 'k', a: G.kids.map(k => [Math.round(k.x), Math.round(k.y), k.face, k.moving ? 1 : 0, k.runK ? 1 : 0]), b: G.ball ? [G.ball.from, G.ball.to, +G.ball.t.toFixed(2)] : null }); }
    }
    const lag = (performance.now() - this.lastRecv) / 1000;
    if (lag > 4 && G.mode === 'play') { if (!this.lagShown) { this.lagShown = true; UI.banner('📶 Connexion lente… on attend l’autre joueur'); } } else this.lagShown = false;
  },
  smooth(A, dt) {
    const s = A.net; if (!s) return;
    const k = Math.min(1, dt * 15), ox = A.x, oy = A.y;
    if (Math.hypot(s.x - A.x, s.y - A.y) > 64) { A.x = s.x; A.y = s.y; } else { A.x += (s.x - A.x) * k; A.y += (s.y - A.y) * k; }
    const moved = Math.hypot(A.x - ox, A.y - oy); A.dist = (A.dist || 0) + moved;
    A.vx = (A.x - ox) / Math.max(dt, 1e-3); A.vy = (A.y - oy) / Math.max(dt, 1e-3);
    A.moving = !!s.m || moved > 0.15; A.running = !!s.r; A.face = s.f;
  }
};
const viewerA = () => (G.net && G.net.role === 'teacher') ? G.T : G.P;
// pas entendus d'un personnage distant
function stepCues(A, visible, dt, hearR) {
  if (!A.moving) return;
  A.stcT = (A.stcT || 0) - dt;
  if (A.stcT > 0) return;
  A.stcT = A.running ? 0.27 : 0.44; A.stSide = (A.stSide || 0) ^ 1;
  const V0 = viewerA(), d = dist(A.x, A.y, V0.x, V0.y) / 16, hr = A.running ? 16 : hearR;
  if (d < hr) {
    AU.foot(floorMat(A.x, A.y), A.isFug ? 'kid' : 'adult', clamp(1 - d / hr, 0, 1) * (A.isFug ? 0.6 : 1.1), panOf(A.x));
    if (!visible) cue(A.x, A.y, 'step', null, { ang: Math.hypot(A.vx || 0, A.vy || 0) > 1 ? Math.atan2(A.vy, A.vx) : (A.ang || 0), side: A.stSide, big: A.running, life: 1.6 });
  }
}
function countdownStep(T, dt) {
  T.st -= dt; T.moving = false;
  const n = 3 - Math.ceil(T.st - 0.3);
  if (n > T.countN && n <= 3) { T.countN = n; FX.cntN = n; FX.cntA = 0; T.bubble = { text: n + (n < 3 ? '…' : ' !'), t: 0, dur: 0.9 }; AU.sfx(n < 3 ? 'count' : 'go'); }
  if (T.st <= 0) { FX.goA = 0; return false; }
  return true;
}
function solidT(x, y) {
  const k = G.m.get(x, y);
  if (k === K.DOOR) return doorAt(x, y).locked;
  return KP[k].solid === 1;
}
// ---------- la maîtresse jouée par un humain ----------
function updateTeacherLocal(dt) {
  const T = G.T, P = G.P, inp = Input.get();
  T.vx = 0; T.vy = 0;
  if (T.bubble) { T.bubble.t += dt; if (T.bubble.t > T.bubble.dur) T.bubble = null; }
  if (T.markT > 0) T.markT -= dt;
  if (T.state === 'count') { if (!countdownStep(T, dt)) { T.state = 'free'; toast('À toi : trouve ' + (P.cfg.name || 'l’élève') + ' et attrape ! ✋', 2.4); } return; }
  if (T.stunT > 0) { T.stunT -= dt; T.state = 'stun'; T.moving = false; T.running = false; if (T.stunT <= 0) T.state = 'free'; return; }
  if (T.sleepT > 0) {
    T.sleepT -= dt; T.state = 'sleep'; T.moving = false; T.running = false; T.zT = (T.zT || 0) - dt;
    if (T.zT <= 0) { T.zT = 0.9; cue(T.x + 6, T.y - 28, 'zzz', 'Z', { life: 1.4 }); AU.sfx('snore', 0.6); }
    if (T.sleepT <= 0) { T.state = 'free'; toast('Hein ?! Tu te réveilles !', 1.6); }
    return;
  }
  if (T.busy) {
    const b = T.busy; T.moving = false; T.running = false;
    if (inp.mag > 0.35) { T.busy = null; T.state = 'free'; return; }
    b.t += dt; if (b.t >= b.dur) { T.busy = null; T.state = 'free'; b.done(); }
    return;
  }
  if (inp.mag > 0.08) {
    const run = inp.mag > 0.62, nx = inp.x / inp.mag, ny = inp.y / inp.mag;
    let sp = (run ? 4.0 : 2.1) * 16; if (G.slowT > 0) sp *= 0.5;
    const ox = T.x, oy = T.y; moveA(T, nx * sp * dt, ny * sp * dt, solidT, 5, 6);
    const moved = Math.hypot(T.x - ox, T.y - oy); T.dist = (T.dist || 0) + moved;
    T.vx = (T.x - ox) / dt; T.vy = (T.y - oy) / dt; T.moving = moved > 0.05; T.running = run && T.moving;
    T.ang = Math.atan2(ny, nx); T.face = faceFromAng(T.ang); T.state = T.running ? 'chase' : 'free';
    if (T.moving) { T.stepT = (T.stepT || 0) - dt; if (T.stepT <= 0) { T.stepT = T.running ? 0.28 : 0.45; AU.foot(floorMat(T.x, T.y), 'adult', T.running ? 0.5 : 0.28, 0); } }
  } else { T.moving = false; T.running = false; T.state = 'free'; }
  for (const a of G.apples) {
    if (!a.eaten && dist(T.x, T.y, a.x, a.y) < 12) {
      a.eaten = true; G.apples = G.apples.filter(b => b !== a); Net.send({ t: 'eat', id: a.id });
      AU.sfx('crunch'); T.sleepT = 7; T.state = 'sleep'; say('Oh, une pomme ! Miam… Zzz');
      toast('🍎 Pomme dormeuse… zzz (7 s).', 2.2); return;
    }
  }
  if (G.pVis) {
    if (!T.sawP && G.time - (T.lastSpotT || -99) > 4) { T.lastSpotT = G.time; Net.send({ t: 'spot' }); G.spotted++; setMark(T, '!', 1.2); hop(T, 80); FX.lines = 0.5; FX.punch(0.08); AU.sfx('spot'); if (T.prof.whistle) AU.sfx('whistle', 0.7); }
    Net.seenT -= dt; if (Net.seenT <= 0) { Net.seenT = 1; Net.send({ t: 'seen' }); }
  }
  T.sawP = G.pVis;
}
// qui le prof peut attraper ? (l'élève ou un faux élève)
function grabTarget() {
  const T = G.T, P = G.P, R = 22; let best = null, bd = R;
  if (!P.hidden && G.pVis) { const d = dist(T.x, T.y, P.x, P.y); if (d < bd) { bd = d; best = P; } }
  G.kids.forEach(k => { if (!k.vis || k.fleeT > 0 || k.isWatcher || k.gone) return; const d = dist(T.x, T.y, k.x, k.y); if (d < bd) { bd = d; best = k; } });
  if (G.inf && G.inf.guard) G.inf.fugs.forEach(f => { if (!f.vis) return; const d = dist(T.x, T.y, f.x, f.y) - 4; if (d < bd) { bd = d; best = f; } });
  return best;
}
const GRAB_LINES = ['C’est pas moi !', 'Hé ! Lâchez-moi !', 'Je suis un élève modèle, moi !', 'Bip boup… erreur !', 'Mauvaise personne !', 'Je dirai tout à mes parents !'];
function grabFail(i, fromNet, li) {
  const k = G.kids[i], T = G.T; if (!k) return;
  if (li == null) li = randi(0, GRAB_LINES.length - 1);
  k.bub = { text: GRAB_LINES[li % GRAB_LINES.length], t: 0, dur: 1.8 };
  puff(k.x, k.y - 8, 10); hop(k, 70);
  if (G.inf ? infAuth() : Net.isHost) fleeKid(k);
  if (!fromNet) { Net.send({ t: 'grabfail', i, li }); T.stunT = 3; T.state = 'stun'; FX.punch(0.1); G.shake = 0.3; AU.sfx('boing'); setMark(T, '?', 1.4); toast('😵 Raté ! Pas ' + (G.P.cfg.name || 'l’élève') + '. Tête qui tourne 3 s.', 2.2); }
  else { AU.sfx('boing', 0.5); }
}
function computeActionsT() {
  const T = G.T, P = G.P, m = G.m, L = G.L, acts = [];
  if (G.mode !== 'play' || T.state === 'count' || T.state === 'sleep' || T.stunT > 0) return acts;
  if (T.busy) return [{ id: 'busy', icon: '⏳', label: T.busy.label, sub: 'Bouge pour annuler', progress: T.busy.t / T.busy.dur }];
  const [ptx, pty] = tileOf(T), cx0 = T.x, cy0 = T.y - 6, cand = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const tx = ptx + dx, ty = pty + dy, d = Math.hypot(tx * 16 + 8 - cx0, ty * 16 + 8 - cy0);
    if (d > 21) continue;
    const hs = L.hideAt.get(ty * m.w + tx);
    if (hs) cand.push({ id: 'tcheck', spot: hs, icon: '🔍', label: 'Fouiller', sub: hs.n, prio: 1, d });
    if (m.get(tx, ty) === K.DOOR) { const dr = doorAt(tx, ty); if (dr.locked) cand.push(T.hasKeys ? { id: 'tunlock', door: dr, icon: '🔓', label: 'Ouvrir la porte', sub: 'avec tes clés', prio: 0, d } : { id: 'nokey', icon: '🔒', label: 'Fermé à clé !', sub: 'va chercher les clés', prio: 2, d }); }
  }
  if (G.inf) infActsT(cand);
  if (!T.hasKeys && dist(T.x, T.y - 4, L.keyPt[0] * 16 + 8, L.keyPt[1] * 16 + 8) < 22) cand.push({ id: 'tkeys', icon: '🔑', label: 'Prendre les clés', sub: 'tableau à clés', prio: 0, d: 0 });
  cand.sort((a, b) => a.prio - b.prio || a.d - b.d);
  const gt = grabTarget();
  if (gt) acts.push({ id: 'grab', who: gt, icon: '✋', label: 'Attraper !', sub: 'tente ta chance !' });
  if (cand[0]) acts.push(cand[0]);
  if (acts.length < 2) acts.push({ id: 'shout', icon: '📣', label: 'Crier', sub: '' });
  return acts;
}
function doActionT(a) {
  const T = G.T, P = G.P;
  if (G.inf && infDoT(a)) return;
  switch (a.id) {
    case 'grab': {
      const w = a.who; hop(T, 60); AU.sfx('whistle', 0.4); T.ang = Math.atan2(w.y - T.y, w.x - T.x); T.face = faceFromAng(T.ang);
      cue(w.x, w.y - 30, 'word', 'ATTRAPÉ ?!', { col: '#ffd23f', pop: true, life: 0.9 });
      if (w.isFug) guardTry(w, 'grab');
      else if (w === P) { if (!P.hidden && dist(T.x, T.y, P.x, P.y) < 30) { if (P.sqN > 0) { P.sqN = 0; Net.send({ t: 'sqUse' }); squishyOnMe(P.sqId); } else { Net.send({ t: 'caught', r: 'chase' }); caught('chase', true); } } }
      else grabFail(G.kids.indexOf(w));
      break;
    }
    case 'tcheck': {
      const spot = a.spot; T.state = 'check'; spot.shake = 1; hop(T, 50); AU.sfx('search', 0.6);
      T.ang = Math.atan2(spot.y * 16 + 8 - T.y, spot.x * 16 + 8 - T.x); T.face = faceFromAng(T.ang);
      for (let i = 0; i < 7; i++) part(spot.x * 16 + 8, spot.y * 16 + 4, 'junk', { vx: rand(-45, 45), vy: rand(-80, -30), g: 200, life: 0.9, col: pick(['#ffffff', '#ff6f91', '#fec43a', '#9fd7ff', '#63c74d']), size: 2 });
      Net.send({ t: 'tcheck', i: spot.idx });
      T.busy = { label: 'Je fouille…', dur: 0.9, t: 0, done: () => { const fh = G.inf && G.inf.guard && G.inf.fugs.find(f => f.fl === G.inf.cur && f.st === 'hide' && f.hide === spot.idx); if (fh) { guardTry(fh, 'found'); return; } if (P.hidden === spot) { if (P.sqN > 0) { P.sqN = 0; Net.send({ t: 'sqUse' }); squishyOnMe(P.sqId); } else { Net.send({ t: 'caught', r: 'found' }); caught('found', true); } } else { AU.sfx('fail'); toast(pick(['Personne…', 'Vide !', 'Raté, pas ici !', 'Juste de la poussière…']), 1.2); } } };
      break;
    }
    case 'tkeys': T.state = 'keys'; AU.sfx('keys'); T.busy = { label: 'Je prends les clés…', dur: 1.3, t: 0, done: () => { T.hasKeys = true; Net.send({ t: 'keys' }); toast('🔑 Clés en poche. Aucune porte ne te résiste.', 2.2); } }; break;
    case 'tunlock': { const d = a.door; T.state = 'unlock'; AU.sfx('keys'); T.busy = { label: 'J’ouvre…', dur: 1.0, t: 0, done: () => { d.locked = false; d.byPlayer = false; Net.send({ t: 'lock', i: G.doors.indexOf(d), l: 0 }); AU.sfx('lock'); cue(d.x * 16 + 8, d.y * 16 + 4, 'word', 'CLIC !', { col: '#ffd23f', pop: true }); } }; break; }
    case 'nokey': toast('🔒 Fermé à clé. Les clés sont au tableau (' + G.m.roomAt(G.L.keyPt[0], G.L.keyPt[1]) + ').', 2.4); AU.sfx('bump'); break;
    case 'shout': {
      if (G.time - (T.shoutT || -9) < 2.2) return; T.shoutT = G.time;
      const n = P.cfg.name || 'toi';
      const lines = T.prof.lines.spot.concat(['{n} ! Où es-tu ?', 'Je vais te trouver, {n} !', 'Heure de colle, {n} !', 'Sors de ta cachette, {n} !']);
      const text = pick(lines).replace(/\{n\}/g, n);
      T.bubble = { text, t: 0, dur: Math.max(2, text.length * 0.075) }; AU.say(text, T.prof, 0.7); Net.send({ t: 'say', text }); hop(T, 70);
      break;
    }
  }
}
function timeUp() {
  if (G.mode !== 'play') return;
  G.mode = 'timeup'; G.caughtT = 0; FX.comic = { t: 0, text: 'DRIIING !' }; FX.punch(0.15); FX.flash = 1; FX.flashCol = '255,255,255';
  AU.sfx('alarm'); AU.play(null); G.P.busy = null; if (G.T.busy) G.T.busy = null;
}
function netUpdate(dt) {
  if (G.inf && G.inf.coop) { coopUpdate(dt); return; }
  if (G.inf && G.inf.guard) { guardUpdate(dt); return; }
  const P = G.P, T = G.T;
  if (G.net.role === 'student') {
    updatePlayer(dt); if (G.mode !== 'play') return;
    if (T.state === 'count') { if (!countdownStep(T, dt)) T.state = 'free'; }
    else if (T.net) {
      Net.smooth(T, dt); T.ang = T.net.a; T.hasKeys = !!T.net.k;
      if (T.checkT > 0) { T.checkT -= dt; T.state = 'check'; } else T.state = T.net.st === 'count' ? 'free' : T.net.st;
    }
    if (T.bubble) { T.bubble.t += dt; if (T.bubble.t > T.bubble.dur) T.bubble = null; }
    if (T.markT > 0) T.markT -= dt;
    if (T.state === 'sleep') { T.zT = (T.zT || 0) - dt; if (T.zT <= 0) { T.zT = 0.9; cue(T.x + 6, T.y - 28, 'zzz', 'Z', { life: 1.4 }); } }
    stepCues(T, G.tVis, dt, 12);
    if (G.alarmT > 0) G.alarmT -= dt;
    const d = dist(T.x, T.y, P.x, P.y) / 16; G.heartT -= dt;
    if (d < 7 && T.state !== 'sleep' && G.heartT <= 0) { G.heartT = 0.35 + d * 0.11; AU.sfx('heart', clamp(1 - d / 7, 0.15, 1) * (G.alarmT > 0 ? 1 : 0.6)); UI.heart(); }
    AU.play(G.alarmT > 0 ? 'chase' : 'sneak');
  } else {
    updateTeacherLocal(dt); if (G.mode !== 'play') return;
    if (P.net) {
      Net.smooth(P, dt); const s = P.net;
      P.small = s.sm ? 10 : 0; P.slip = s.sl ? 1 : 0; P.skidT = s.sk ? 0.1 : 0;
      const hs = s.h >= 0 ? G.L.hides[s.h] : null;
      if (hs !== P.hidden) {
        if (P.hidden && P.hidden.k === K.DOOR) { const dr = doorAt(P.hidden.x, P.hidden.y); if (dr) dr.hideP = false; }
        if (hs && hs.k === K.DOOR) { const dr = doorAt(hs.x, hs.y); if (dr) dr.hideP = true; }
        if (hs && G.pVis) { puff(hs.x * 16 + 8, hs.y * 16 + 8, 8); hs.shake = 0.6; }
        P.hidden = hs;
      }
    }
    if (P.running && !P.slip && !P.hidden) stepCues(P, G.pVis, dt, 0); else P.stcT = 0;
    AU.play(G.pVis ? 'chase' : 'sneak');
  }
  G.kids.forEach(k => { if (k.bub) { k.bub.t += dt; if (k.bub.t > k.bub.dur) k.bub = null; } });
  if (G.inf ? infAuth() : Net.isHost) updateKids(dt);
  else G.kids.forEach(k => { if (k.net) { if (G.inf && k.net.length > 5) k.ang = k.net[5]; const ox = k.x, oy = k.y, a = k.net; if (Math.abs(a[0] - k.x) + Math.abs(a[1] - k.y) > 80) { k.x = a[0]; k.y = a[1]; } else { k.x += (a[0] - k.x) * Math.min(1, dt * 12); k.y += (a[1] - k.y) * Math.min(1, dt * 12); } k.dist = (k.dist || 0) + Math.hypot(k.x - ox, k.y - oy); k.face = a[2]; k.moving = !!a[3]; k.runK = !!a[4]; } });
  updateDoors(dt);
  if (G.inf) { infUpdate(dt); if (G.mode !== 'play') return; }
  Net.timeLeft -= dt;
  if (Net.isHost && Net.timeLeft <= 0) { Net.send({ t: 'end' }); timeUp(); }
  Net.tick(dt);
}
