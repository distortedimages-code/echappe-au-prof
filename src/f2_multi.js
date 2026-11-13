// ================= SALON DU MODE À DEUX =================
const Multi = {
  role: 'student', level: 0,
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
    const b = this.body(`<h3 class="px" style="font-size:11px;color:var(--cyan)">Tu veux jouer…</h3>
      <div class="roles">
        <button class="role" data-r="student"><canvas width="20" height="34"></canvas><b>L’élève</b><span>avec ${esc(me ? me.name : 'ton perso')}</span></button>
        <button class="role" data-r="teacher"><canvas width="20" height="34"></canvas><b>Le prof</b><span>celui du niveau</span></button>
      </div>
      <h3 class="px" style="font-size:11px;color:var(--cyan)">Niveau</h3>
      <div class="lvlpick">${LEVELS.map((L, i) => `<button data-l="${i}"><b>${i + 1}</b><span>${esc(L.title)}</span></button>`).join('')}</div>
      <button class="procTog" id="mProc"></button>
      <button class="btn big green" id="mGo">Créer ▶</button>
      <button class="btn ghost" id="mBack">◀ Retour</button>`);
    const paint = () => {
      b.querySelectorAll('.role').forEach(r => r.classList.toggle('sel', r.dataset.r === this.role));
      b.querySelectorAll('.lvlpick button').forEach(r => r.classList.toggle('sel', +r.dataset.l === this.level));
      const pr = PROFS[LEVELS[this.level].prof], cvs = b.querySelectorAll('.role canvas');
      portrait(cvs[0], me, null, 1); portrait(cvs[1], pr.cfg, pr.v, 1);
      b.querySelector('.role[data-r="teacher"] span').textContent = pr.name;
    };
    b.querySelectorAll('.role').forEach(r => r.onclick = () => { AU.sfx('tick'); this.role = r.dataset.r; paint(); });
    b.querySelectorAll('.lvlpick button').forEach(r => r.onclick = () => { AU.sfx('tick'); this.level = +r.dataset.l; paint(); });
    paint(); UI.paintProc($('mProc'));
    $('mGo').onclick = () => { AU.init(); AU.sfx('blip'); this.status('Création de la partie…', true); Net.host(this.role, this.level); };
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
  result(outcome) {
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
  }
};
