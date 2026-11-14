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
    const b = this.body(`<div class="modes"><button class="mode" data-m="classic"><b>🏃 Cache-cache</b><span>5 niveaux, tu choisis ton rôle</span></button><button class="mode" data-m="inf"><b>🕵️ Infiltration</b><span>4 étages, rôles tirés au sort</span></button><button class="mode" data-m="coop"><b>🤝 En équipe</b><span>2 élèves contre les profs</span></button><button class="mode" data-m="guard"><b>👮 Surveillants</b><span>2 surveillants contre 2 fugueurs</span></button></div>
      <div id="mGuardInfo" class="panel howto">👮 <b>Surveillants en équipe</b> : vous êtes <b>deux surveillants</b>. Deux élèves vont filer de leur classe du 3e étage pour s’échapper du collège. Trouvez-les parmi les autres élèves et attrapez-les (✋) avant qu’ils ne sortent !<br>🔍 Ils se cachent quand ils vous voient : fouillez les cachettes. 🔔 Écoutez : quelqu’un qui crochète la grille du 1er, ça fait du bruit… 📍 Appelez-vous et partagez-vous les étages !</div>
      <div id="mCoopInfo" class="panel howto">🤝 <b>Infiltration en équipe</b> : vous êtes <b>deux élèves</b>, assis côte à côte au 3e étage. Échappez-vous du collège <b>tous les deux</b> !<br>🥁 Faites diversion, ✊ frappez aux portes pour attirer les profs, 📍 appelez-vous… Si l’un se fait attraper, il part en <b>salle de colle</b> (1er étage) : l’autre doit venir le libérer. Le vieux portail ? Il faut être deux pour le pousser !</div>
      <div id="mInfInfo" class="panel howto">🕵️ <b>Infiltration à deux</b> : l’élève part de sa classe au 3e étage et doit s’échapper par la cour. L’autre joueur est <b>le surveillant</b> : il se promène dans tous les couloirs, d’étage en étage, pour l’attraper.<br>🎲 Les rôles sont tirés au sort à chaque partie, et l’élève choisit une nouvelle apparence au début.</div>
      <div id="mClassic"><h3 class="px" style="font-size:11px;color:var(--cyan)">Tu veux jouer…</h3>
      <div class="roles">
        <button class="role" data-r="student"><canvas width="20" height="34"></canvas><b>L’élève</b><span>avec ${esc(me ? me.name : 'ton perso')}</span></button>
        <button class="role" data-r="teacher"><canvas width="20" height="34"></canvas><b>Le prof</b><span>celui du niveau</span></button>
      </div>
      <h3 class="px" style="font-size:11px;color:var(--cyan)">Niveau</h3>
      <div class="lvlpick">${LEVELS.map((L, i) => PROFS[L.prof].lesson ? '' : `<button data-l="${i}"><b>${i + 1}</b><span>${esc(L.title)}</span></button>`).join('')}</div>
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
      $('mClassic').classList.toggle('hidden', this.mode !== 'classic'); $('mInfInfo').classList.toggle('hidden', this.mode !== 'inf'); $('mCoopInfo').classList.toggle('hidden', this.mode !== 'coop'); $('mGuardInfo').classList.toggle('hidden', this.mode !== 'guard');
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
    if (G.inf && G.inf.guard) { this.introGuard(); return; }
    if (G.inf && G.inf.coop) { this.introCoop(); return; }
    if (G.inf) { this.introInf(); return; }
    const role = Net.role, L = LEVELS[Net.level], pr = PROFS[L.prof], st = G.P.cfg, them = Net.them.name || 'l’autre joueur';
    $('inNum').textContent = 'PARTIE À DEUX · NIVEAU ' + (Net.level + 1) + ' · ' + L.place.toUpperCase();
    $('inTitle').textContent = role === 'student' ? 'Tu es l’élève !' : 'Tu es ' + pr.name + ' !';
    if (role === 'student') { portrait($('inProf'), st, null, 1); $('inName').textContent = st.name; $('inRole').textContent = 'Le prof (' + pr.name + ') est joué par ' + them + '.'; $('inQuote').textContent = '« Je dois trouver une sortie avant la sonnerie ! »'; }
    else { portrait($('inProf'), pr.cfg, pr.v, 1); $('inName').textContent = pr.name; $('inRole').textContent = 'L’élève, c’est ' + st.name + ' (joué par ' + them + ').'; $('inQuote').textContent = '« ' + st.name + ', je vais t’attraper avant la sonnerie ! »'; }
    $('inMission').innerHTML = role === 'student' ? '<b style="color:var(--yel)">Ta mission :</b> 3 <b>tâches</b>, puis <b>une</b> sortie. Avant la sonnerie. 😏' : '<b style="color:var(--yel)">Ta mission :</b> trouver <b>' + esc(st.name) + '</b> parmi les faux élèves et l’attraper avant la sonnerie.';
    const hints = role === 'student' ? ['🎭 Look secret à chaque manche. Le prof ne sait pas qui tu es.', '📋 3 tâches (les ⭐ jaunes), sinon sorties fermées.', '🤖 Les faux élèves marchent comme des robots. Imite-les.', '🥸 Un déguisement traîne dans un meuble. Fouille.'].concat(L.hints.slice(0, 2)) : [
      '🎭 L’élève change de look. Regarde comment il bouge.',
      '🤖 Les faux élèves marchent comme des robots. Le vrai, non.',
      '✋ Approche et « Attraper ! ». Si tu te trompes : tête qui tourne.',
      '📋 Il doit faire 3 tâches avant de sortir. Surveille le compteur.',
      '🥸 Il peut se déguiser en faux élève. Fourbe.',
      '👀 Tu ne vois que devant toi.',
      '👣 Traces orange = il court. « CLAC ! » = une porte.',
      '🔍 Fouille les cachettes. S’il est dedans : gagné.',
      '🔑 Porte fermée à clé ? Va prendre les clés au tableau à clés.',
      '🔑 Porte fermée ? Va prendre les clés au tableau à clés.'].slice(0, 7);
    $('inHints').innerHTML = ''; $('inHints').dataset.title = '💡 Comment jouer'; hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    $('inTips').innerHTML = role === 'student'
      ? '⏰ 3 minutes chrono.<br>👆 Un peu = discret · à fond = bruyant (et ça laisse des traces).'
      : '⏰ Sonnerie (3 min) = tu gagnes.<br>🙈 Au début, tu comptes jusqu’à 3. Pas de triche.';
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
      $('inMission').innerHTML = '<b style="color:var(--yel)">Ta mission :</b> du 3e jusqu’à la <b>cour</b>, en 6 min. Sans te faire choper. 😏';
    } else {
      portrait($('inProf'), pr.cfg, pr.v, 1); $('inName').textContent = 'Tu es ' + pr.name; $('inRole').textContent = 'L’élève (' + st.name + ') est joué par ' + them + '.';
      $('inQuote').textContent = '« ' + st.name + ' ne sortira pas de ce collège ! »';
      $('inMission').innerHTML = '<b style="color:var(--yel)">Ta mission :</b> attraper <b>' + esc(st.name) + '</b> en 6 min. Sans savoir à quoi il/elle ressemble. Bonne chance.';
    }
    const hints = role === 'student' ? [
      '🎭 Choisis ton look : le surveillant ne le connaît pas.',
      '🪑 Elle écrit au tableau ? File.',
      '🤖 Marche comme les autres élèves. Ni vu ni connu.',
      '⚠️ Les profs en classe te balancent au surveillant.',
      '🔑 Le trousseau ouvre la grille du 1er et le portail.',
      '🔥 L’alarme vide les étages. Mais gare à l’appel.'
    ] : [
      '🚶 Tu commences au 1er. Tous les étages sont à toi.',
      '📢 Les profs te signalent les élèves hors de classe (❗).',
      '🤖 Repère celui qui ne marche pas comme les autres.',
      '✋ Approche-toi et appuie sur « Attraper ! ». Si tu te trompes, ta tête tourne 3 secondes.',
      '🗺️ Tu as le plan dès le début (🗺️).',
      '👁️ Serrures, cachettes, grille : tu as le passe.'
    ];
    $('inHints').innerHTML = ''; $('inHints').dataset.title = '💡 Comment jouer'; hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
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
  introGuard() {
    const I = G.inf, pr = G.T.prof, Q = G.T2;
    $('inNum').textContent = '👮 SURVEILLANTS EN ÉQUIPE · 4 ÉTAGES';
    $('inTitle').textContent = 'Rattrapez les fugueurs !';
    portrait($('inProf'), pr.cfg, pr.v, 1); $('inName').textContent = pr.name; $('inRole').textContent = 'Ton coéquipier : ' + guardName(Q) + ' (il commence ' + (Q.fl === 0 ? 'au rez-de-chaussée' : 'au ' + INF_FLOOR_META[Q.fl].name) + ')';
    $('inQuote').textContent = '« Personne ne quitte ce collège sans autorisation ! »';
    $('inMission').innerHTML = '<b style="color:var(--yel)">Votre mission :</b> deux élèves du 3e veulent s’évader. Attrapez-les <b>tous les deux</b> en 6 min.';
    const hints = [
      '🧒 Les fugueurs ressemblent aux autres. Sauf qu’ils sèchent.',
      '❗ Ils te voient ? Ils filent se cacher. Fouille (🔍).',
      '✋ Attraper un innocent = tournis 3 s. Bien fait.',
      '🔔 Pour descendre, ils crochètent la grille du 1er. Long et bruyant.',
      '📢 Écoute les rumeurs : quelqu’un les voit parfois.',
      '📍 Partagez-vous les étages. 🗺️ montre ton coéquipier.'
    ];
    $('inHints').innerHTML = ''; $('inHints').dataset.title = '💡 Comment jouer'; hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    $('inTips').innerHTML = '🎲 Nouveau collège à chaque partie · 🕐 6 minutes<br>👆 Un peu = marcher · à fond = courir.';
    $('bGo').textContent = 'Prêt !'; $('bGo').disabled = false;
    G.mode = 'intro'; UI.show('sIntro'); UI.hudSig = null; UI.invSig = null; UI.infSig = null;
    $('toast').classList.add('hidden'); $('banner').classList.add('hidden');
    AU.play('sneak');
  },
  resultGuard(c, o, timeUp) {
    const p = $('resPanel'), t = G.time, mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    const win = o === 0, title = win ? (c === 2 ? 'TOUS<br>ATTRAPÉS !' : 'PERSONNE<br>N’EST SORTI !') : o === 2 ? 'ILS SE SONT<br>ÉCHAPPÉS !' : 'UN FUGUEUR<br>S’EST ÉCHAPPÉ…';
    const line = win ? (c === 2 ? 'Bravo, les deux fugueurs passent la journée en salle de colle !' : 'DRIIING ! La sonnerie : les fugueurs retournent en classe, penauds.') : o === 2 ? 'Les deux fugueurs ont filé… La directrice va vous convoquer !' : c ? 'Vous en avez attrapé un… mais l’autre court encore !' : 'Un fugueur a filé… il faudra faire mieux !';
    p.innerHTML = `<div class="bigtitle" style="color:${win ? 'var(--green)' : o === 2 ? 'var(--red)' : 'var(--yel)'}">${title}</div>
      <div class="stars">${win ? '🏆🏆' : o === 2 ? '😵' : '🏆'}</div>
      <div class="quote" style="text-align:center">${esc(line)}</div>
      <div class="stats"><span>⏱️ ${mm}</span><span>🔒 ${c}/2 attrapés</span><span>🌳 ${o} évadé${o > 1 ? 's' : ''}</span></div>
      <button class="btn big green" id="rAgain">👮 Rejouer en surveillants</button>
      <button class="btn ghost" id="rQuit">🏠 Quitter la partie</button>
      <div class="tiny" id="rStat" style="text-align:center"></div>`;
    $('rAgain').onclick = () => { AU.sfx('blip'); if (!Net.isHost) $('rStat').textContent = '⏳ Demande envoyée à ton coéquipier…'; Net.newRound(false); };
    $('rQuit').onclick = () => { AU.sfx('blip'); Net.close(); G.net = null; G.inf = null; UI.openTitle(); };
    $('bDiv').classList.add('hidden'); $('bPing').classList.add('hidden'); $('bPlan').classList.add('hidden');
    if (win) AU.sfx('win'); else AU.sfx('fail');
    UI.show('sResult');
  },
  introCoop() {
    const I = G.inf, me = G.P.cfg, Q = G.P2, them = Net.them.name || 'ton coéquipier';
    $('inNum').textContent = '🤝 INFILTRATION EN ÉQUIPE · 4 ÉTAGES';
    $('inTitle').textContent = 'Évasion à deux !';
    portrait($('inProf'), me, null, 1); $('inName').textContent = me.name; $('inRole').textContent = 'Ton équipier : ' + (Q.cfg.name || them) + ' (assis·e à côté de toi)';
    $('inQuote').textContent = '« On sort ensemble… ou pas du tout ! »';
    $('inMission').innerHTML = '<b style="color:var(--yel)">Votre mission :</b> vous évader <b>tous les deux</b> du 3e jusqu’à la cour. 8 min. Pas de jaloux.'
      + '<div class="looks"><button class="btn cyan" id="bLook">🎲 Changer d’apparence</button><button class="btn ghost" id="bMine">😀 Mon perso</button></div>';
    const hints = [
      '⚠️ Avertissements partagés : à 3, ça court pour vous deux.',
      '🥁 BADABOUM attire les profs. Pendant ce temps, l’autre file.',
      '✊ « Toc toc » : le prof vient ouvrir. Cache-toi vite.',
      '🔒 Attrapé·e ? Salle de colle (1er). Ton équipier peut te libérer.',
      '🚧 Le vieux portail se pousse à deux. Le grillage : chacun son tour.',
      '📍 Appelle ton équipier. 🗺️ montre où il est.'
    ];
    $('inHints').innerHTML = ''; $('inHints').dataset.title = '💡 Comment jouer'; hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    $('inTips').innerHTML = '🎲 Nouveau collège à chaque partie · 🕐 8 minutes<br>👆 Un peu = marcher sans bruit · à fond = courir (ça s’entend !).';
    const setLook = cfg => { cfg.name = me.name; G.P.cfg = cfg; portrait($('inProf'), cfg, null, 1); Net.send({ t: 'look', cfg }); AU.sfx('pouf', 0.5); };
    $('bLook').onclick = () => setLook(randomChar(me.name));
    $('bMine').onclick = () => { const c = UI.cfg(); if (c) setLook(Object.assign({}, c)); };
    $('bGo').textContent = 'Prêt !'; $('bGo').disabled = false;
    G.mode = 'intro'; UI.show('sIntro'); UI.hudSig = null; UI.invSig = null; UI.infSig = null;
    $('toast').classList.add('hidden'); $('banner').classList.add('hidden');
    AU.play('sneak');
  },
  resultCoop(outcome) {
    const I = G.inf, p = $('resPanel'), P = G.P, Q = G.P2, out = (P.out ? 1 : 0) + (Q.out ? 1 : 0);
    const t = G.time, mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    let title, line, win = outcome === 'win';
    if (win) { title = 'LIBRES<br>TOUS LES DEUX !'; line = 'Vous avez quitté le collège ensemble. Quelle équipe !'; AU.sfx('win'); }
    else if (outcome === 'jail') { title = 'COLLÉS<br>TOUS LES DEUX !'; line = '« Vous deux, vous passez la journée en salle de colle ! »'; }
    else { title = 'DRIIING !'; line = out ? 'La sonnerie a sonné : ' + (P.out ? 'tu es sorti·e, mais pas ' + (Q.cfg.name || 'ton équipier') : (Q.cfg.name || 'Ton équipier') + ' est sorti·e, mais pas toi') + '…' : 'La sonnerie a sonné… vous êtes encore dans le collège !'; }
    p.innerHTML = `<div class="bigtitle" style="color:${win ? 'var(--green)' : out ? 'var(--yel)' : 'var(--red)'}">${title}</div>
      <div class="stars">${win ? '🏆🏆' : out ? '🏆' : '😵'}</div>
      <div class="quote" style="text-align:center">${esc(line)}</div>
      <div class="stats"><span>⏱️ ${mm}</span><span>🌳 ${out}/2 dehors</span><span>⚠️ ${I.warn}/3</span><span>🔒 colle ×${I.colles || 0}</span><span>${I.keys ? '🔑' : ''}${I.alarmUsed ? '🔥' : ''}</span></div>
      <div class="prof"><canvas id="rLook" width="20" height="34"></canvas><canvas id="rLook2" width="20" height="34"></canvas><div class="quote">${esc(P.cfg.name || 'Toi')} &amp; ${esc(Q.cfg.name || 'ton équipier')}</div></div>
      <button class="btn big green" id="rAgain">🤝 Rejouer en équipe</button>
      <button class="btn ghost" id="rQuit">🏠 Quitter la partie</button>
      <div class="tiny" id="rStat" style="text-align:center"></div>`;
    portrait($('rLook'), P.cfg, null, 1); portrait($('rLook2'), Q.cfg, null, 1);
    $('rAgain').onclick = () => { AU.sfx('blip'); if (!Net.isHost) $('rStat').textContent = '⏳ Demande envoyée à ton équipier…'; Net.newRound(false); };
    $('rQuit').onclick = () => { AU.sfx('blip'); Net.close(); G.net = null; G.inf = null; UI.openTitle(); };
    $('bDiv').classList.add('hidden'); $('bPing').classList.add('hidden'); $('bPlan').classList.add('hidden');
    UI.show('sResult');
  },
  result(outcome) {
    if (G.inf && G.inf.coop) { this.resultCoop(outcome === 'escaped' ? 'win' : 'time'); return; }
    if (G.inf) { this.resultInf(outcome); return; }
    const role = Net.role, p = $('resPanel'), st = G.P.cfg.name || 'l’élève', pr = G.T.prof;
    const win = (role === 'student') === (outcome === 'escaped');
    const t = G.time, mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    let title, line;
    if (outcome === 'escaped') { title = role === 'student' ? 'ÉVASION<br>RÉUSSIE !' : 'RATÉ !'; line = role === 'student' ? 'Tu as trouvé la sortie !' : st + ' a trouvé la sortie…'; }
    else if (outcome === 'caught') { title = role === 'student' ? 'HEURE<br>DE COLLE !' : 'ATTRAPÉ !'; line = role === 'student' ? '« ' + pr.lines.caught + ' »' : 'Bravo, tu as attrapé ' + st + ' !'; }
    else { title = 'DRIIING !'; line = role === 'student' ? 'La sonnerie a sonné… le prof gagne !' : 'La sonnerie a sonné : tu gagnes !'; }
    // les cours d'anglais et d'histoire-géo sont pour le jeu en solo
    let nextLvl = Net.level + 1; while (nextLvl < LEVELS.length && PROFS[LEVELS[nextLvl].prof].lesson) nextLvl++;
    const lastLvl = nextLvl >= LEVELS.length;
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
    if ($('rNext')) $('rNext').onclick = () => ask(false, nextLvl);
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
