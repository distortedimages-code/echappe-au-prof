// ================= LES INTERROS DU MENU : M. SILEX (histoire) ET MISS TEACUP (anglais) =================
// 10 questions sur un chapitre du cahier, 3 réponses au choix, une antisèche par interro.
// Chaque correction dit où revérifier : la photo du cahier et l'endroit, avec la zone surlignée.
// Toutes les 3 bonnes réponses : un squishy pour la collection. Les erreurs sont gardées pour les revoir.
const HIST_CH = [
  { k: 'intro', e: '⏳', n: 'Qu’est-ce que la Préhistoire ?', s: 'La frise, les dates, les périodes' },
  { k: 'arch', e: '🔎', n: 'Comment connaît-on les débuts de l’humanité ?', s: 'Archéologues, vestiges, fouilles' },
  { k: 'hum', e: '🦴', n: 'Qui étaient les premiers humains ?', s: 'Habilis, erectus, sapiens…' },
  { k: 'migr', e: '🌍', n: 'Comment ont-ils peuplé la planète ?', s: 'Les migrations' },
  { k: 'vie', e: '🏹', n: 'Comment vivaient-ils ?', s: 'Nomades, outils, chasse' },
  { k: 'neo', e: '🌾', n: 'La révolution néolithique', s: 'Agriculture, élevage, villages' },
];
const QZ_N = 10, QZ_GIFT = 3;   // un squishy toutes les 3 bonnes réponses
const QZ_SUBJ = {
  hist: {
    bank: () => HIST_BANK, ch: () => HIST_CH, key: 'nds_quiz', cls: '', flag: '🦴', title: 'L’interro d’histoire',
    prof: () => PROFS.find(p => p.lesson === 'hist') || PROFS[0],
    src: p => 'lecons/p' + String(p).padStart(2, '0') + '.jpg', ratio: 2576 / 1450, label: p => 'Photo ' + p,
    all: ['Tout le chapitre, mélangé', 'Les débuts de l’humanité'],
    hello: ['Interro surprise ! Choisis ton chapitre… avant que je change d’avis.', 'Rangez vos affaires, sortez une feuille. Enfin, un doigt.', 'Pas de panique : c’est seulement noté. Sur 20.', 'Ton cahier, tu l’as relu ? On va vite le savoir.'],
    first: 'Première question. Pas de copiage.',
    good: ['Exact. Je suis presque fier.', 'Bonne réponse. Pas de quoi prendre la grosse tête.', 'Correct ! Tu as ouvert ton cahier, toi.', 'Juste. Même Lucy n’aurait pas trouvé.', 'Bravo, petit Homo sapiens.', 'Bien. Très bien. Bon, ça va.'],
    streak: ['{n} de suite ! Tu as une antisèche dans la manche ?', '{n} d’affilée… Je surveille, hein.', 'Série de {n} ! Le mammouth est impressionné.', '{n} sans faute. Suspect. Très suspect.'],
    bad: ['Raté. Ton cahier ne mord pas, tu sais.', 'Non ! Même un mammouth le savait.', 'Faux. Tu dormais au fond de la classe ?', 'Perdu. Le cahier, ce n’est pas décoratif.', 'Aïe. Retour à la pierre taillée.', 'Mauvaise réponse. Je note. Je note tout.'],
    joker: ['Je n’ai RIEN vu. Cette fois.', 'Une antisèche ? Où ça ? Bon, d’accord…', 'Je regarde par la fenêtre… 3 secondes.'],
    verdict: [['✅ Bravo !', '✅ Exact !', '✅ Parfait !'], '❌ Raté !'],
    gift: 'M. Silex te donne un squishy (confisqué à un autre élève…)',
    bulletin: n => n >= 20 ? 'Vingt sur vingt. Je vérifie ta trousse… Rien. Félicitations, sincèrement.' : n >= 16 ? 'Très bien. Je suis obligé de te féliciter. Ça me coûte.' : n >= 12 ? 'Bien. Peut mieux faire, comme tout le monde.' : n >= 8 ? 'Moyen. Ton cahier s’ennuie de toi.' : 'Catastrophe préhistorique. Même l’homme de Tautavel aurait fait mieux.'
  },
  en: {
    bank: () => EN_BANK, ch: () => EN_CH, key: 'nds_quiz_en', cls: 'en', flag: '🇬🇧', title: 'Le quiz d’anglais',
    prof: () => PROFS.find(p => p.lesson === 'en') || PROFS[5],
    src: p => 'lecons/en' + String(p).padStart(2, '0') + '.jpg', ratio: 2016 / 1512, label: p => 'Photo ' + p + ' d’anglais',
    all: ['Tout mélangé', 'Have, vocabulaire, matières, nombres'],
    hello: ['Good morning! Choisis ton chapitre, please.', 'Sit down, please. Sortez une feuille… ou un doigt.', 'Ready? Steady? Quiz!', 'Hello, darling! Tu as révisé ? We’ll see…'],
    first: 'First question. No cheating, please!',
    good: ['Very good! Je suis presque impressed.', 'Correct. Don’t get a big head!', 'Lovely! Tu as ouvert ton cahier, toi.', 'Yes! My cup of tea est fière de toi.', 'Well done, darling.', 'Perfect. Bon, ça va, ça va.'],
    streak: ['{n} in a row! Tu as une antisèche, darling ?', '{n} de suite… I’m watching you.', '{n} sans faute ! Brilliant… suspicious, but brilliant.', 'Série de {n} ! I need more tea.'],
    bad: ['Oops! Ton cahier n’est pas décoratif, darling.', 'No, no, no. My cup of tea is shocked.', 'Wrong! Tu dormais pendant le cours ?', 'Oh dear… Relis ta fiche, please.', 'Nope. Je note. I write everything.', 'Hmm… not quite, sweetie.'],
    joker: ['I saw nothing. This time.', 'An antisèche? Where? Oh well…', 'Je regarde par la fenêtre… three seconds.'],
    verdict: [['✅ Very good!', '✅ Perfect!', '✅ Excellent!'], '❌ Oops!'],
    gift: 'Miss Teacup te donne un squishy (confisqué pendant le cours…)',
    bulletin: n => n >= 20 ? 'Twenty out of twenty! Je vérifie ta trousse… Nothing. Brilliant!' : n >= 16 ? 'Very good! Je suis obligée de te féliciter. Cheers!' : n >= 12 ? 'Good. Peut mieux faire, darling.' : n >= 8 ? 'Hmm… average. Ton cahier misses you.' : 'Oh dear. Even my teapot would do better.'
  }
};
// où revérifier : le texte et la photo à montrer
function qzRef(r, subj) {
  if (!r) return null;
  const S = QZ_SUBJ[subj] || QZ_SUBJ.hist;
  const [p, y0, y1, what, x0 = 0.03, x1 = 0.97] = r, cy = (y0 + y1) / 2;
  const v = cy < 0.36 ? 'en haut' : cy < 0.64 ? 'au milieu' : 'en bas';
  const h = x1 - x0 < 0.62 ? ((x0 + x1) / 2 < 0.5 ? ', à gauche' : ', à droite') : '';
  return { p, y0, y1, x0, x1, what, src: S.src(p), ratio: S.ratio, txt: S.label(p) + ' · ' + v + h + ' : ' + what };
}
function histRef(r) { return qzRef(r, 'hist'); }
// l'encadré « photo du cahier » : la zone à revoir, surlignée. Sans les photos (version publique), il reste caché.
function histShot(box, ref) {
  box.innerHTML = ''; box.classList.add('hidden'); box.onclick = null; if (!ref) return;
  const img = new Image(), hl = document.createElement('i'), tip = document.createElement('span');
  img.alt = ref.txt; img.draggable = false; tip.className = 'zoomTip'; tip.textContent = '🔍 agrandir';
  img.onload = () => {
    if (!box.isConnected) return;
    box.append(img, hl, tip); box.classList.remove('hidden');
    const W = box.clientWidth || 300, IH = W * ref.ratio, rh = (ref.y1 - ref.y0) * IH;
    const H = Math.round(Math.min(230, Math.max(120, rh + 40)));
    const top = Math.max(0, Math.min(IH - H, (ref.y0 + ref.y1) / 2 * IH - H / 2));
    box.style.height = H + 'px'; img.style.transform = 'translateY(' + (-top) + 'px)';
    hl.style.top = (ref.y0 * IH - top - 3) + 'px'; hl.style.height = (rh + 6) + 'px';
    hl.style.left = (ref.x0 * 100) + '%'; hl.style.width = ((ref.x1 - ref.x0) * 100) + '%';
    box.onclick = () => histZoom(ref);
  };
  img.onerror = () => box.classList.add('hidden');
  img.src = ref.src;
}
// la photo en grand, défilée jusqu'à la zone
function histZoom(ref) {
  AU.sfx('blip');
  const z = $('qzZoom'), w = $('qzZoomPage'); $('qzZoomT').textContent = '📸 ' + ref.txt;
  w.innerHTML = `<img src="${ref.src}" alt="${esc(ref.txt)}"><i style="top:${ref.y0 * 100}%;height:${(ref.y1 - ref.y0) * 100}%;left:${ref.x0 * 100}%;width:${(ref.x1 - ref.x0) * 100}%"></i>`;
  z.classList.remove('hidden');
  const go = () => { const s = $('qzZoomScroll'); s.scrollTop = Math.max(0, ref.y0 * w.clientHeight - 90); };
  const im = w.querySelector('img'); if (im.complete) go(); else im.onload = go;
}

const Quiz = {
  bound: false, subj: 'hist', ch: null, qs: [], i: 0, ok: 0, streak: 0, joker: true, opts: [], answered: false, wrong: [], marks: [], gifts: [],
  S() { return QZ_SUBJ[this.subj]; },
  bank() { return this.S().bank(); },
  prof() { return this.S().prof(); },
  data() { const d = store.get(this.S().key, {}); return d && typeof d === 'object' ? d : {}; },
  save(d) { store.set(this.S().key, d); },
  missed() { const m = this.data().missed, B = this.bank(); return Array.isArray(m) ? m.filter(t => B.some(q => q.q === t)) : []; },
  say(t) { AU.say(t, this.prof(), 0.6); },
  bind() {
    if (this.bound) return; this.bound = true;
    $('qzList').addEventListener('click', e => { const b = e.target.closest('.qzCh'); if (!b) return; AU.init(); AU.sfx('blip'); this.start(b.dataset.k); });
    $('qzChoices').addEventListener('click', e => { const b = e.target.closest('.choice'); if (!b || b.disabled) return; this.choose(+b.dataset.i); });
    $('qzJoker').addEventListener('click', () => this.useJoker());
    $('qzNext').addEventListener('click', () => { AU.sfx('blip'); this.next(); });
    $('qzQuit').addEventListener('click', () => { AU.sfx('blip'); this.home(); });
    $('qzBack').addEventListener('click', () => { AU.sfx('blip'); UI.openTitle(); });
    $('qzAgain').addEventListener('click', () => { AU.sfx('blip'); this.start(this.ch); });
    $('qzRetry').addEventListener('click', () => { AU.sfx('blip'); this.start('miss', this.wrong.map(w => w.q)); });
    $('qzOther').addEventListener('click', () => { AU.sfx('blip'); this.home(); });
    $('qzEndBack').addEventListener('click', () => { AU.sfx('blip'); UI.openTitle(); });
    $('qzZoom').addEventListener('click', e => { if (e.target.id === 'qzZoom' || e.target.closest('#qzZoomX')) { AU.sfx('blip'); $('qzZoom').classList.add('hidden'); } });
  },
  open(subj) {
    this.bind(); this.subj = QZ_SUBJ[subj] ? subj : 'hist'; const S = this.S(), P = this.prof();
    $('sQuiz').classList.toggle('en', S.cls === 'en');
    document.querySelectorAll('#sQuiz .qzPname').forEach(el => el.textContent = P.name);
    document.querySelectorAll('#sQuiz .qzFlag').forEach(el => el.textContent = S.flag);
    $('qzTitle0').textContent = S.title;
    this.home(); UI.show('sQuiz');
  },
  view(v) { ['qzHome', 'qzPlay', 'qzEnd'].forEach(id => $(id).classList.toggle('hidden', id !== v)); $('qzZoom').classList.add('hidden'); $('sQuiz').scrollTop = 0; },
  face(id) { const P = this.prof(); portrait($(id), P.cfg, P.v, 1); },
  home() {
    const S = this.S(), B = this.bank();
    this.view('qzHome'); this.face('qzProf0');
    const line = pick(S.hello); $('qzHello').textContent = line;
    const best = this.data().best || {}, cnt = k => B.filter(q => k === 'all' || q.c === k).length;
    const rec = k => k === 'miss' ? '' : best[k] != null ? 'Record : ' + best[k] + '/20' : 'Jamais tenté';
    const row = (k, e, n, s) => `<button class="qzCh" data-k="${k}"><span class="em">${e}</span><span class="tx"><b>${esc(n)}</b><small>${esc(s)}</small></span><span class="rec${best[k] >= 16 ? ' top' : ''}">${rec(k)}</span></button>`;
    let h = S.ch().map(c => row(c.k, c.e, c.n, c.s + ' · ' + cnt(c.k) + ' questions')).join('');
    h += row('all', '🎲', S.all[0], S.all[1] + ' · ' + cnt('all') + ' questions');
    const m = this.missed(); if (m.length) h += row('miss', '🎯', 'Mes erreurs à revoir', m.length + ' question' + (m.length > 1 ? 's' : '') + ' ratée' + (m.length > 1 ? 's' : ''));
    $('qzList').innerHTML = h;
    this.say(line);
  },
  start(k, list) {
    const B = this.bank(); let pool;
    if (k === 'miss') { const m = list || this.missed(); pool = B.filter(q => m.includes(q.q)); }
    else pool = B.filter(q => k === 'all' || q.c === k);
    if (!pool.length) { this.home(); return; }
    this.ch = k; this.qs = shuffle(pool.slice()).slice(0, QZ_N); this.i = 0; this.ok = 0; this.streak = 0; this.joker = true; this.wrong = []; this.marks = []; this.gifts = [];
    const c = this.S().ch().find(c => c.k === k);
    $('qzChap').textContent = c ? c.e + ' ' + c.n : k === 'all' ? '🎲 ' + this.S().all[0] : '🎯 Mes erreurs';
    this.view('qzPlay'); this.face('qzProf1'); $('qzSay').textContent = this.S().first;
    this.ask();
  },
  sub() { return 'Question ' + (this.i + 1) + ' / ' + this.qs.length + ' · 🧸 ' + (this.ok % QZ_GIFT) + '/' + QZ_GIFT + (this.streak >= 2 ? ' · 🔥 ' + this.streak : ''); },
  ask() {
    const q = this.qs[this.i]; this.answered = false;
    $('qzSub').textContent = this.sub();
    $('qzDots').innerHTML = this.qs.map((_, k) => `<i class="${this.marks[k] || (k === this.i ? 'cur' : '')}"></i>`).join('');
    $('qzQ').textContent = q.q;
    const ch = [{ t: q.a, good: true }, { t: q.w[0] }, { t: q.w[1] }]; shuffle(ch); this.opts = ch;
    $('qzChoices').innerHTML = ch.map((c, k) => `<button class="choice" data-i="${k}"><b>${'ABC'[k]}</b><span>${esc(c.t)}</span></button>`).join('');
    $('qzJoker').disabled = !this.joker; $('qzJoker').textContent = this.joker ? '📝 Antisèche (1)' : '📝 Antisèche utilisée';
    $('qzJoker').classList.remove('hidden'); $('qzRes').classList.add('hidden');
    $('sQuiz').scrollTop = 0;
  },
  useJoker() {
    if (!this.joker || this.answered) return; this.joker = false; AU.sfx('tick');
    const bad = this.opts.map((o, k) => o.good ? -1 : k).filter(k => k >= 0), k = pick(bad);
    const b = $('qzChoices').children[k]; b.disabled = true; b.classList.add('off');
    $('qzJoker').disabled = true; $('qzJoker').textContent = '📝 Antisèche utilisée';
    $('qzSay').textContent = pick(this.S().joker);
  },
  choose(i) {
    if (this.answered) return; this.answered = true;
    const S = this.S(), q = this.qs[this.i], o = this.opts[i], good = !!o.good;
    [...$('qzChoices').children].forEach((b, k) => { b.disabled = true; b.classList.add(this.opts[k].good ? 'good' : k === i ? 'bad' : 'off'); });
    if (good) { this.ok++; this.streak++; } else { this.streak = 0; this.wrong.push(q); }
    this.marks[this.i] = good ? 'ok' : 'ko';
    $('qzDots').children[this.i].className = this.marks[this.i];
    $('qzSay').textContent = good ? (this.streak >= 3 ? pick(S.streak).replace('{n}', this.streak) : pick(S.good)) : pick(S.bad);
    $('qzVerdict').className = 'lsVerdict ' + (good ? 'ok' : 'ko'); $('qzVerdict').textContent = good ? pick(S.verdict[0]) : S.verdict[1];
    $('qzYou').innerHTML = good ? '' : 'Ta réponse : <s>' + esc(o.t) + '</s>';
    $('qzAns').textContent = q.a; $('qzTip').textContent = (good ? '📚 ' : '💡 ') + q.e;
    const ref = qzRef(q.r, this.subj); $('qzRef').textContent = ref ? '📸 Revérifie dans ton cahier — ' + ref.txt : '';
    $('qzNext').textContent = this.i + 1 < this.qs.length ? 'Question suivante ▶' : 'Voir ma note 📝';
    $('qzJoker').classList.add('hidden'); $('qzRes').classList.remove('hidden');
    histShot($('qzShot'), ref);
    AU.sfx(good ? 'found' : 'fail');
    // en anglais, Miss Teacup prononce la bonne réponse (si c'est de l'anglais)
    if (this.subj === 'en' && /^[A-Za-z][A-Za-z ,.?!’'-]*$/.test(q.a) && !/^(rien|une |des |un )/.test(q.a)) setTimeout(() => AU.sayEn(q.a, this.prof()), 350);
    // toutes les 3 bonnes réponses : un squishy !
    const gf = $('qzGift'); gf.innerHTML = ''; gf.classList.add('hidden');
    if (good && this.ok % QZ_GIFT === 0) { const g = this.gift(); gf.append(g.cv, g.t); gf.classList.remove('hidden'); setTimeout(() => AU.sfx('squish'), 300); }
    $('qzSub').textContent = this.sub();
    setTimeout(() => { const r = $('qzRes'); if (r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
  },
  // un squishy tiré au sort (rareté pondérée), rangé tout de suite dans la collection
  gift() {
    const id = SqCol.roll(), isNew = SqCol.add(id), s = SQUISHIES[id]; this.gifts.push(id);
    const cv = document.createElement('canvas'); cv.width = 14; cv.height = 14; cv.getContext('2d').drawImage(squishyCanvas(id), 0, 0);
    const t = document.createElement('div');
    t.innerHTML = `🎁 ${this.ok} bonnes réponses ! ${esc(this.S().gift)} :<br><b>${esc(s.n)}</b> <span class="qzRar" style="background:${SQ_RARITY[s.r].col}">${SQ_RARITY[s.r].n}</span>${isNew ? ' <b class="qzNew">nouveau !</b>' : ''}`;
    return { cv, t };
  },
  next() { if (!this.answered) return; this.i++; if (this.i < this.qs.length) this.ask(); else this.end(); },
  end() {
    const S = this.S();
    this.view('qzEnd'); this.face('qzProf2');
    const n = Math.round(this.ok / this.qs.length * 20), d = this.data(); d.best = d.best || {};
    // erreurs à revoir : on ajoute les ratées, on retire celles qu'on vient de réussir
    const okNow = this.qs.filter(q => !this.wrong.includes(q)).map(q => q.q);
    d.missed = this.missed().filter(t => !okNow.includes(t)).concat(this.wrong.map(q => q.q).filter(t => !(d.missed || []).includes(t)));
    const rec = this.ch !== 'miss' && (d.best[this.ch] == null || n > d.best[this.ch]); if (rec) d.best[this.ch] = n;
    this.save(d);
    $('qzNote').innerHTML = '<span>' + n + '</span>/20';
    $('qzNote').className = 'qzNote ' + (n >= 16 ? 'top' : n >= 10 ? 'mid' : 'low');
    const line = S.bulletin(n); $('qzBull').textContent = '« ' + line + ' »';
    $('qzRec').textContent = rec && this.ch !== 'miss' ? '🏆 Nouveau record pour ce chapitre !' : this.ch === 'miss' ? '🎯 Révision des erreurs' : '';
    // les squishies gagnés pendant l'interro
    const rw = $('qzReward'); rw.innerHTML = ''; rw.classList.toggle('hidden', !this.gifts.length);
    if (this.gifts.length) {
      const row = document.createElement('div'); row.className = 'qzGifts';
      this.gifts.forEach(id => { const cv = document.createElement('canvas'); cv.width = 14; cv.height = 14; cv.getContext('2d').drawImage(squishyCanvas(id), 0, 0); cv.title = SQUISHIES[id].n; row.appendChild(cv); });
      const t = document.createElement('div'); t.textContent = '🧸 ' + this.gifts.length + ' squishy' + (this.gifts.length > 1 ? 's' : '') + ' gagné' + (this.gifts.length > 1 ? 's' : '') + ' : ' + this.gifts.map(id => SQUISHIES[id].n).join(', ') + '. Collection : ' + SqCol.count() + '/' + SQUISHIES.length;
      rw.append(row, t);
    }
    // les erreurs, avec où revérifier
    $('qzMissT').classList.toggle('hidden', !this.wrong.length);
    $('qzMiss').innerHTML = this.wrong.map(q => { const r = qzRef(q.r, this.subj); return `<div class="qzM"><b>${esc(q.q)}</b><span>✅ ${esc(q.a)}</span>${r ? `<small>📸 ${esc(r.txt)}</small>` : ''}</div>`; }).join('');
    $('qzRetry').classList.toggle('hidden', !this.wrong.length);
    $('qzAgain').classList.toggle('hidden', this.ch === 'miss');
    AU.sfx(n >= 10 ? 'found' : 'fail'); if (n >= 16 || this.gifts.length) confettiScreen();
    this.say(line);
  }
};
// petite pluie de confettis sur l'écran de note
function confettiScreen() {
  const box = $('qzEnd'); const cols = ['#ffd23f', '#ff6fb5', '#5fd3ff', '#7dff9a', '#ff8a3a'];
  for (let k = 0; k < 26; k++) {
    const p = document.createElement('i'); p.className = 'qzConf';
    p.style.left = Math.random() * 100 + '%'; p.style.background = pick(cols);
    p.style.animationDelay = (Math.random() * 0.5) + 's'; p.style.animationDuration = (1.4 + Math.random()) + 's';
    box.appendChild(p); setTimeout(() => p.remove(), 3200);
  }
}
