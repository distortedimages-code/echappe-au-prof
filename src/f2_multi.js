// ================= SALON DU MODE À DEUX =================
const Multi = {
  role: 'student', level: 0, mode: 'classic',
  open() {
    if (!UI.chars.length && Net.available()) { UI.openCreator(-1, 'multi'); return; }
    G.mode = 'menu'; UI.show('sMulti'); AU.play('menu'); this.menu();
  },
  body(html) { const b = $('mBody'); b.innerHTML = html; return b; },
  menu() {
    if (!Net.available()) {
      this.body(`<div class="panel howto">Le jeu à deux se joue sur <b>la version en ligne du jeu</b>, chacun sur son téléphone :<br><br>
        <a class="btn cyan" style="display:block;text-align:center;text-decoration:none" href="${PAGES_URL}" target="_blank" rel="noopener">🌐 Ouvrir la version en ligne</a><br>
        <span class="tiny">Adresse à ouvrir sur les deux téléphones :<br><b style="user-select:text;-webkit-user-select:text;word-break:break-all">${PAGES_URL}</b></span></div>
        <button class="btn ghost" id="mBack">◀ Retour</button>`);
      $('mBack').onclick = () => { AU.sfx('blip'); UI.openTitle(); };
      return;
    }
    const me = UI.cfg();
    this.body(`<div class="panel howto">Jouez à deux, <b>chacun sur son téléphone</b> : l’un est <b>l’élève</b> qui doit s’échapper, l’autre est <b>le prof</b> qui doit l’attraper avant la sonnerie (3 minutes).<br><span class="tiny">📶 Le même Wi-Fi, c’est encore mieux. Ton perso : <b style="color:var(--yel)">${esc(me ? me.name : '?')}</b></span></div>
      <button class="btn big green" id="mCreate">🎲 Créer une partie</button>
      <button class="btn cyan" id="mJoin">🔑 Rejoindre une partie</button>
      <div class="row"><button class="btn ghost" id="mBack">◀ Retour</button><button class="btn ghost" id="mChar">👕 Changer de perso</button></div>`);
    $('mCreate').onclick = () => { AU.sfx('blip'); this.create(); };
    $('mJoin').onclick = () => { AU.sfx('blip'); this.join(); };
    $('mBack').onclick = () => { AU.sfx('blip'); Net.close(true); UI.openTitle(); };
    $('mChar').onclick = () => { AU.sfx('blip'); UI.openChars('multi'); };
  },
  create() {
    const me = UI.cfg();
    const b = this.body(`<div class="modes"><button class="mode" data-m="classic"><b>🏃 Cache-cache</b><span>5 niveaux, tu choisis ton rôle</span></button><button class="mode" data-m="inf"><b>🕵️ Infiltration</b><span>4 étages, rôles tirés au sort</span></button></div>
      <div id="mInfInfo" class="panel howto">🕵️ <b>Infiltration à deux</b> : l’élève part de sa classe au 3e étage et doit s’échapper par la cour. L’autre joueur est <b>le surveillant</b> : il se promène dans tous les couloirs, d’étage en étage, pour l’attraper.<br>🎲 Les rôles sont tirés au sort à chaque partie, et l’élève choisit une nouvelle apparence au début.</div>
      <div id="mClassic"><h3 class="px" style="font-size:11px;color:var(--cyan)">Tu veux jouer…</h3>
      <div class="roles">
        <button class="role" data-r="student"><canvas width="20" height="34"></canvas><b>L’élève</b><span>avec ${esc(me ? me.name : 'ton perso')}</span></button>
        <button class="role" data-r="teacher"><canvas width="20" height="34"></canvas><b>Le prof</b><span>celui du niveau</span></button>
      </div>
      <h3 class="px" style="font-size:11px;color:var(--cyan)">Niveau</h3>
      <div class="lvlpick">${LEVELS.map((L, i) => `<button data-l="${i}"><b>${i + 1}</b><span>${esc(L.title)}</span></button>`).join('')}</div>
      <button class="procTog" id="mProc"></button></div>
      <button class="btn big green" id="mGo">Créer ▶</button>
      <button class="btn ghost" id="mBack">◀ Retour</button>`);
    const paint = () => {
      b.querySelectorAll('.role').forEach(r => r.classList.toggle('sel', r.dataset.r === this.role));
      b.querySelectorAll('.lvlpick button').forEach(r => r.classList.toggle('sel', +r.dataset.l === this.level));
      const pr = PROFS[LEVELS[this.level].prof], cvs = b.querySelectorAll('.role canvas');
      portrait(cvs[0], me, null, 1); portrait(cvs[1], pr.cfg, pr.v, 1);
      b.querySelector('.role[data-r="teacher"] span').textContent = pr.name;
      b.querySelectorAll('.mode').forEach(r => r.classList.toggle('sel', r.dataset.m === this.mode));
      $('mClassic').classList.toggle('hidden', this.mode === 'inf'); $('mInfInfo').classList.toggle('hidden', this.mode !== 'inf');
    };
    b.querySelectorAll('.mode').forEach(r => r.onclick = () => { AU.sfx('tick'); this.mode = r.dataset.m; paint(); });
    b.querySelectorAll('.role').forEach(r => r.onclick = () => { AU.sfx('tick'); this.role = r.dataset.r; paint(); });
    b.querySelectorAll('.lvlpick button').forEach(r => r.onclick = () => { AU.sfx('tick'); this.level = +r.dataset.l; paint(); });
    paint(); UI.paintProc($('mProc'));
    $('mGo').onclick = () => { AU.init(); AU.sfx('blip'); this.status('Création de la partie…', true); Net.mode = this.mode; Net.host(this.role, this.level); };
    $('mBack').onclick = () => { AU.sfx('blip'); this.menu(); };
  },
  waiting(code) {
    this.body(`<div class="panel center" style="display:flex;flex-direction:column;gap:10px;align-items:center">
      <div class="tiny">Code de la partie</div>
      <div class="bigcode">${code.split('').map(ch => `<i>${ch}</i>`).join('')}</div>
      <div>Donne ce code à l’autre joueur :<br>il choisit <b style="color:var(--yel)">« Rejoindre une partie »</b>.</div>
      <div class="tiny" id="mStat">⏳ En attente de l’autre joueur…</div></div>
      <button class="btn ghost" id="mBack">✖ Annuler</button>`);
    $('mBack').onclick = () => { AU.sfx('blip'); Net.close(true); this.menu(); };
  },
  join() {
    this.body(`<div class="panel center" style="display:flex;flex-direction:column;gap:10px;align-items:center">
      <label class="lbl" for="mCode">Code de la partie (4 lettres)</label>
      <input id="mCode" class="name code" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD">
      <div class="tiny" id="mStat"></div></div>
      <button class="btn big green" id="mGo">Rejoindre ▶</button>
      <button class="btn ghost" id="mBack">◀ Retour</button>`);
    const inp = $('mCode');
    inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); });
    const go = () => { const c = inp.value; if (c.length !== 4) { $('mStat').textContent = 'Il faut 4 lettres ou chiffres.'; return; } AU.init(); AU.sfx('blip'); this.status('Connexion à la partie ' + c + '…', true); Net.join(c); };
    $('mGo').onclick = go; inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    $('mBack').onclick = () => { AU.sfx('blip'); this.menu(); };
    setTimeout(() => { try { inp.focus(); } catch (e) { } }, 100);
  },
  status(msg, full) {
    if (full) { this.body(`<div class="panel center"><div class="spin">⏳</div><div>${esc(msg)}</div></div><button class="btn ghost" id="mBack">✖ Annuler</button>`); $('mBack').onclick = () => { Net.close(true); this.menu(); }; return; }
    const s = $('mStat'); if (s) s.textContent = msg;
  },
  error(msg) {
    if ($('sMulti').classList.contains('hidden')) UI.show('sMulti');
    this.body(`<div class="panel center"><div style="font-size:40px">😕</div><div>${esc(msg)}</div></div>
      <button class="btn green" id="mRetry">↻ Réessayer</button><button class="btn ghost" id="mBack">◀ Accueil</button>`);
    $('mRetry').onclick = () => { AU.sfx('blip'); Net.close(true); this.menu(); };
    $('mBack').onclick = () => { AU.sfx('blip'); Net.close(true); G.net = null; UI.openTitle(); };
  },
  intro() {
    if (G.inf) { this.introInf(); return; }
    const role = Net.role, L = LEVELS[Net.level], pr = PROFS[L.prof], st = G.P.cfg, them = Net.them.name || 'l’autre joueur';
    $('inNum').textContent = 'PARTIE À DEUX · NIVEAU ' + (Net.level + 1) + ' · ' + L.place.toUpperCase();
    $('inTitle').textContent = role === 'student' ? 'Tu es l’élève !' : 'Tu es ' + pr.name + ' !';
    if (role === 'student') { portrait($('inProf'), st, null, 1); $('inName').textContent = st.name; $('inRole').textContent = 'Le prof (' + pr.name + ') est joué par ' + them + '.'; $('inQuote').textContent = '« Je dois trouver une sortie avant la sonnerie ! »'; }
    else { portrait($('inProf'), pr.cfg, pr.v, 1); $('inName').textContent = pr.name; $('inRole').textContent = 'L’élève, c’est ' + st.name + ' (joué par ' + them + ').'; $('inQuote').textContent = '« ' + st.name + ', je vais t’attraper avant la sonnerie ! »'; }
    $('inMission').innerHTML = role === 'student' ? '<b style="color:var(--yel)">Ta mission :</b> faire tes <b>3 tâches</b>, puis trouver <b>UNE</b> des 3 sorties secrètes avant la sonnerie.' : '<b style="color:var(--yel)">Ta mission :</b> repérer <b>' + esc(st.name) + '</b> parmi les faux élèves et l’attraper avant la sonnerie.';
    const hints = role === 'student' ? ['🎭 Nouvelle apparence secrète à chaque manche : le prof ne sait pas à quoi tu ressembles !', '📋 Fais tes 3 tâches rigolotes (cercles jaunes) : sans elles, les sorties restent fermées !', '🤖 Des faux élèves se promènent comme des robots : imite-les (marche, pauses) pour te fondre dans la masse !', '🥸 Un déguisement est caché dans un meuble : fouille, il change ton look pour toute la partie !'].concat(L.hints.slice(0, 2)) : [
      '🎭 L’élève a un nouveau look secret à chaque manche : fie-toi à sa façon de bouger !',
      '🤖 Attention : plein de faux élèves ! Ils marchent comme des robots, d’un point à un autre, avec des pauses régulières.',
      '✋ Approche-toi et appuie sur « Attraper ! ». Si tu te trompes, ta tête tourne 3 secondes.',
      '📋 L’élève doit faire 3 tâches avant de pouvoir sortir : surveille le compteur !',
      '🥸 L’élève peut trouver un déguisement… et ressembler à un faux élève !',
      '👀 Tu ne vois que devant toi (le cône de lumière).',
      '👣 Les traces orange : l’élève qui court. Les « CLAC ! » : une porte qui s’ouvre.',
      '🔍 Approche-toi d’une cachette et fouille-la : s’il est dedans, c’est gagné !',
      '🔑 Porte fermée à clé ? Va prendre les clés au tableau à clés.',
      '🔑 Porte fermée ? Va prendre les clés au tableau à clés.'].slice(0, 7);
    $('inHints').innerHTML = ''; hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    $('inTips').innerHTML = role === 'student'
      ? '⏰ Trouve une sortie en moins de 3 minutes !<br>👆 Un peu = marcher sans bruit · à fond = courir (le prof voit tes traces !).'
      : '⏰ Si la sonnerie sonne (3 minutes), tu gagnes !<br>🙈 Au début, tu fermes les yeux 3 secondes.';
    $('bGo').textContent = 'Prêt !'; $('bGo').disabled = false;
    G.mode = 'intro'; UI.show('sIntro'); UI.hudSig = null; UI.invSig = null;
    $('toast').classList.add('hidden'); $('banner').classList.add('hidden');
    AU.play('sneak');
  },
  introInf() {
    const role = Net.role, st = G.P.cfg, pr = G.T.prof, them = Net.them.name || 'l’autre joueur';
    $('inNum').textContent = '🕵️ INFILTRATION À DEUX · 4 ÉTAGES';
    $('inTitle').textContent = role === 'student' ? '🎲 Tu es l’élève !' : '🎲 Tu es le surveillant !';
    if (role === 'student') {
      portrait($('inProf'), st, null, 1); $('inName').textContent = st.name; $('inRole').textContent = 'Le surveillant est joué par ' + them + '.';
      $('inQuote').textContent = '« Personne ne me reconnaîtra ! »';
      $('inMission').innerHTML = '<b style="color:var(--yel)">Ta mission :</b> sortir de ta classe du 3e étage et t’échapper par la <b>cour</b> avant la sonnerie (6 min), sans te faire attraper par le surveillant.';
    } else {
      portrait($('inProf'), pr.cfg, pr.v, 1); $('inName').textContent = 'Tu es ' + pr.name; $('inRole').textContent = 'L’élève (' + st.name + ') est joué par ' + them + '.';
      $('inQuote').textContent = '« ' + st.name + ' ne sortira pas de ce collège ! »';
      $('inMission').innerHTML = '<b style="color:var(--yel)">Ta mission :</b> retrouver <b>' + esc(st.name) + '</b> et l’attraper avant la sonnerie (6 min). Tu ne sais pas à quoi il/elle ressemble !';
    }
    const hints = role === 'student' ? [
      '🎭 Choisis ton apparence ci-dessous : le surveillant ne la connaît pas.',
      '🪑 Sors de ta classe quand la maîtresse écrit au tableau.',
      '🤖 Des élèves circulent dans les couloirs : marche comme eux pour passer inaperçu·e.',
      '⚠️ Les profs dans les classes t’avertissent… et préviennent le surveillant !',
      '🔑 Le trousseau (dans le bureau d’un prof) ouvre la grille du 1er et le portail.',
      '🔥 L’alarme incendie vide les étages… mais il y a un appel dans la cour.'
    ] : [
      '🚶 Tu commences au 1er étage. Tu peux aller dans tous les couloirs et tous les étages.',
      '📢 Quand un prof voit un élève hors de sa classe, il te prévient (❗ sur ton écran et sur ton plan).',
      '🤖 Des élèves circulent dans les couloirs : repère celui qui ne bouge pas comme les autres.',
      '✋ Approche-toi et appuie sur « Attraper ! ». Si tu te trompes, ta tête tourne 3 secondes.',
      '🗺️ Tu as le plan du collège dès le début (bouton 🗺️).',
      '👁️ Regarde par les serrures, fouille les cachettes, et passe la grille avec ton passe.'
    ];
    $('inHints').innerHTML = ''; hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    if (role === 'student') {
      $('inMission').innerHTML += '<div class="looks"><button class="btn cyan" id="bLook">🎲 Changer d’apparence</button><button class="btn ghost" id="bMine">😀 Mon perso</button></div>';
      $('inTips').innerHTML = '⏰ 6 minutes avant la sonnerie !';
      const setLook = cfg => { cfg.name = st.name; G.P.cfg = cfg; portrait($('inProf'), cfg, null, 1); Net.send({ t: 'look', cfg }); AU.sfx('pouf', 0.5); };
      $('bLook').onclick = () => setLook(randomChar(st.name));
      $('bMine').onclick = () => { const me = UI.cfg(); if (me) setLook(Object.assign({}, me)); };
    } else $('inTips').innerHTML = '⏰ Si la sonnerie sonne (6 min), tu gagnes !';
    $('bGo').textContent = 'Prêt !'; $('bGo').disabled = false;
    G.mode = 'intro'; UI.show('sIntro'); UI.hudSig = null; UI.invSig = null; UI.infSig = null;
    $('toast').classList.add('hidden'); $('banner').classList.add('hidden');
    AU.play('sneak');
  },
  result(outcome) {
    if (G.inf) { this.resultInf(outcome); return; }
    const role = Net.role, p = $('resPanel'), st = G.P.cfg.name || 'l’élève', pr = G.T.prof;
    const win = (role === 'student') === (outcome === 'escaped');
    const t = G.time, mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    let title, line;
    if (outcome === 'escaped') { title = role === 'student' ? 'ÉVASION<br>RÉUSSIE !' : 'RATÉ !'; line = role === 'student' ? 'Tu as trouvé la sortie !' : st + ' a trouvé la sortie…'; }
    else if (outcome === 'caught') { title = role === 'student' ? 'HEURE<br>DE COLLE !' : 'ATTRAPÉ !'; line = role === 'student' ? '« ' + pr.lines.caught + ' »' : 'Bravo, tu as attrapé ' + st + ' !'; }
    else { title = 'DRIIING !'; line = role === 'student' ? 'La sonnerie a sonné… le prof gagne !' : 'La sonnerie a sonné : tu gagnes !'; }
    const lastLvl = Net.level >= LEVELS.length - 1;
    p.innerHTML = `<div class="bigtitle" style="color:${win ? 'var(--green)' : 'var(--red)'}">${title}</div>
      <div class="stars">${win ? '🏆' : '😵'}</div>
      <div class="quote" style="text-align:center">${esc(line)}</div>
      <div class="stats"><span>⏱️ ${mm}</span><span>👀 vu ${G.spotted}×</span></div>
      <button class="btn big green" id="rAgain">↻ Revanche</button>
      <button class="btn cyan" id="rSwap">🔄 Échanger les rôles</button>
      ${Net.isHost && !lastLvl ? '<button class="btn" id="rNext">Niveau suivant ▶</button>' : ''}
      <button class="btn ghost" id="rQuit">🏠 Quitter la partie</button>
      <div class="tiny" id="rStat" style="text-align:center"></div>`;
    const ask = (swap, lvl) => { AU.sfx('blip'); if (!Net.isHost) $('rStat').textContent = '⏳ Demande envoyée à l’autre joueur…'; Net.newRound(swap, lvl); };
    $('rAgain').onclick = () => ask(false);
    $('rSwap').onclick = () => ask(true);
    if ($('rNext')) $('rNext').onclick = () => ask(false, Net.level + 1);
    $('rQuit').onclick = () => { AU.sfx('blip'); Net.close(); G.net = null; UI.openTitle(); };
    UI.show('sResult');
  },
  resultInf(outcome) {
    const role = Net.role, p = $('resPanel'), st = G.P.cfg.name || 'l’élève', pr = G.T.prof, I = G.inf;
    const win = (role === 'student') === (outcome === 'escaped');
    const t = G.time, mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    let title, line;
    if (outcome === 'escaped') { title = role === 'student' ? 'LIBRE !' : 'ÉVADÉ·E !'; line = role === 'student' ? 'Tu as quitté le collège !' : st + ' a quitté le collège sous ton nez…'; }
    else if (outcome === 'caught') { title = role === 'student' ? 'ATTRAPÉ·E !' : 'BIEN JOUÉ !'; line = role === 'student' ? '« ' + pr.lines.caught + ' »' : 'Tu as attrapé ' + st + ' (' + INF_FLOOR_META[I.cur].name + ') !'; }
    else { title = 'DRIIING !'; line = role === 'student' ? 'La sonnerie a sonné… le surveillant gagne !' : 'La sonnerie a sonné : tu gagnes !'; }
    p.innerHTML = `<div class="bigtitle" style="color:${win ? 'var(--green)' : 'var(--red)'}">${title}</div>
      <div class="stars">${win ? '🏆' : '😵'}</div>
      <div class="quote" style="text-align:center">${esc(line)}</div>
      <div class="stats"><span>⏱️ ${mm}</span><span>⚠️ ${I.warn}/3</span><span>${I.keys ? '🔑' : ''}${I.alarmUsed ? '🔥' : ''}</span></div>
      <div class="prof"><canvas id="rLook" width="20" height="34"></canvas><div class="quote">${role === 'student' ? 'Ton look secret' : 'Le look secret de ' + esc(st)}</div></div>
      <button class="btn big green" id="rAgain">🎲 Nouvelle partie (rôles au hasard)</button>
      <button class="btn ghost" id="rQuit">🏠 Quitter la partie</button>
      <div class="tiny" id="rStat" style="text-align:center"></div>`;
    portrait($('rLook'), G.P.cfg, null, 1);
    $('rAgain').onclick = () => { AU.sfx('blip'); if (!Net.isHost) $('rStat').textContent = '⏳ Demande envoyée à l’autre joueur…'; Net.newRound(false); };
    $('rQuit').onclick = () => { AU.sfx('blip'); Net.close(); G.net = null; G.inf = null; UI.openTitle(); };
    UI.show('sResult');
  }
};
