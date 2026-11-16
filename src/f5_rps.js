// ================= CHI-FOU-MI : un élève te bloque le passage =================
// De temps en temps (en solo), un élève qui traîne te barre la route : « Chi-fou-mi ! »
// Le jeu continue autour (le prof patrouille toujours !) et la partie dure jusqu'à 2 victoires d'affilée :
// une égalité ne compte pas, une défaite remet le compteur à zéro. Gagner = l'élève te donne un objet.
// On peut aussi abandonner… mais alors l'élève hurle et le prof fonce vers toi en courant.

const RPS_NAMES = ['Kenzo', 'Lina', 'Malo', 'Inès', 'Noah', 'Jade', 'Tom', 'Zoé', 'Sacha', 'Léa', 'Ethan', 'Chloé', 'Nino', 'Alba'];
const RPS_HANDS = ['✊', '✋', '✌'];                // pierre, feuille, ciseaux
const RPS_LAB = ['PIERRE', 'FEUILLE', 'CISEAUX'];
const RPS_TONES = ['\u{1F3FB}', '\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}'];   // teinte de peau des mains (comme le perso)
const RPS_KID_LINES = {
  start: ['Chi-fou-mi ! Tu passes pas !', 'Hé ! Un chi-fou-mi d’abord !', 'Péage ! Chi-fou-mi !', 'Pas si vite ! Chi-fou-mi !'],
  win: ['Hé hé ! Encore !', 'Trop facile !', 'Je lis dans tes pensées !', 'Re-chi-fou-mi !'],
  lose: ['Coup de chance…', 'Hmpf !', 'Attends, je me concentre…', 'Pas juste !'],
  tie: ['Pareil ! Encore !', 'Copieur·se !', 'Égalité, on refait !'],
  end: ['Pfff… t’es trop fort·e !', 'Bon, vas-y, passe…', 'Revanche à la récré !', 'T’as triché, c’est sûr !'],
  quit: ['MADAAAME ! Iel est là !', 'MONSIEUUUR ! Ici !', 'AU SECOURS, UN·E FUYARD·E !', 'IL EST LÀÀÀ !'],
};

// une main en gros pixels : l'émoji dessiné tout petit puis agrandi, avec contour (look rétro)
const RPS_IMG = new Map();
function rpsHandImg(h, tone) {
  const key = h + '|' + tone; let c = RPS_IMG.get(key); if (c) return c;
  const S = 26, [cv, x] = mkCanvas(S, S);
  x.font = '20px ' + EMOJI_FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#000';
  x.fillText(RPS_HANDS[h] + (RPS_TONES[tone] || ''), S / 2, S / 2 + 1);
  try {   // on durcit les bords (pixels nets) puis on ajoute le contour
    const id = x.getImageData(0, 0, S, S), d = id.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
    pixPasses(d, S, S); x.putImageData(id, 0, 0);
  } catch (e) { }
  RPS_IMG.set(key, cv); return cv;
}
function rpsTone(cfg) { const n = SKINS.length; return (((cfg && cfg.skin) || 0) % n + n) % n; }
function rpsDraw(cv, img) { const x = cv.getContext('2d'); cv.width = img.width; cv.height = img.height; x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0); }

const RPS = {
  el: null,
  // ---------- qui peut te défier, et quand ----------
  canKid(k) {
    return k && !k.gone && k.vis !== false && !k.snitch && !k.isWatcher && !k.rpsDone && !k.under && !k.hidden
      && ['wander', 'default', 'tag', 'bench', 'jump', 'ball', 'foot', 'pairF', 'crowd', undefined].includes(k.beh) && !(G.m.get(Math.floor(k.x / 16), Math.floor((k.y - 2) / 16)) === K.WATER);
  },
  tick(dt) {
    const P = G.P, T = G.T;
    if (G.rps) { this.update(dt); return; }
    if (G.net || G.mode !== 'play' || !P || P.hidden || P.busy || P.out || P.lesson || P.swim || P.under || (G.time || 0) < 18) return;
    if (G.rpsN >= 2 || G.time < (G.rpsNext || 0)) return;
    if (T && (['chase', 'alert', 'investigate', 'search', 'check', 'edge'].includes(T.state) || T.detect > 0.2)) return;
    this.chk = (this.chk || 0) - dt; if (this.chk > 0) return; this.chk = 1;
    const k = G.kids.find(k => this.canKid(k) && dist(k.x, k.y, P.x, P.y) < 30 && los(k.x, k.y - 8, P.x, P.y - 8));
    if (k && Math.random() < 0.3) this.start(k);
  },
  // ---------- l'élève te barre la route ----------
  start(k) {
    const P = G.P;
    G.rps = { kid: k, streak: 0, phase: 'intro', t: 0, busy: false, name: (k.cfg && k.cfg.name && k.cfg.name.length > 1 ? k.cfg.name : pick(RPS_NAMES)) };
    G.rpsN = (G.rpsN || 0) + 1; k.rpsDone = true;
    k.path = null; k.moving = false; k.face = k.x < P.x ? 2 : 3; P.face = P.x < k.x ? 2 : 3; P.moving = false;
    hop(k, 90); setMark(k, '!', 0.9); AU.sfx('boing', 0.6);
    cue(k.x, k.y - 30, 'kid', pick(RPS_KID_LINES.start), { life: 1.6 });
  },
  update(dt) {
    const R = G.rps, k = R.kid, P = G.P, T = G.T;
    R.t += dt;
    // l'élève reste planté devant toi
    k.moving = false; k.path = null; k.face = k.x < P.x ? 2 : 3;
    // le prof te tombe dessus : la partie s'arrête net
    if (T && (T.state === 'chase' || G.mode !== 'play')) { this.abort(); return; }
    if (R.phase === 'intro' && R.t > 0.45) { R.phase = 'play'; this.open(); }
  },
  // ---------- la tuile par-dessus l'écran ----------
  build() {
    if (this.el) return;
    this.el = $('rps');
    this.el.querySelectorAll('.rpsB').forEach(b => {
      const h = +b.dataset.h;
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.pick(h); });
    });
    $('rpsQuit').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.quit(); });
    this.el.addEventListener('pointerdown', e => e.stopPropagation());
  },
  open() {
    this.build(); const R = G.rps, el = this.el;
    R.tone = rpsTone(G.P.cfg); R.ktone = rpsTone(R.kid.cfg);
    $('rpsName').textContent = R.name;
    el.querySelectorAll('.rpsB').forEach(b => { const h = +b.dataset.h; rpsDraw(b.querySelector('canvas'), rpsHandImg(h, R.tone)); b.classList.remove('sel', 'dim'); b.disabled = false; });
    rpsDraw(el.querySelector('.me .rpsFace'), charCanvas(G.P.cfg, 0, 0, G.P.disguised ? G.P.v : null, 'idle'));
    rpsDraw(el.querySelector('.kid .rpsFace'), charCanvas(R.kid.cfg, 0, 0, R.kid.v, 'idle'));
    this.setHands(0, 0);
    $('rpsCall').textContent = 'VS'; $('rpsCall').className = 'rpsCall';
    this.say('Gagne 2 fois d’affilée pour passer !', '');
    $('rpsGift').classList.add('hidden');
    this.pips();
    const card = $('rpsCard'); card.className = 'rpsCard';
    el.classList.remove('hidden', 'out'); void el.offsetWidth; el.classList.add('in');
    AU.sfx('whoosh', 0.6);
  },
  setHands(a, b) {
    const R = G.rps, el = this.el;
    rpsDraw(el.querySelector('.me .rpsHand'), rpsHandImg(a, R.tone));
    rpsDraw(el.querySelector('.kid .rpsHand'), rpsHandImg(b, R.ktone));
  },
  say(t, cls) { const r = $('rpsRes'); r.textContent = t; r.className = 'rpsRes' + (cls ? ' ' + cls : ''); void r.offsetWidth; if (cls) r.classList.add('slam'); },
  pips(anim) { this.el.querySelectorAll('.rpsStreak i').forEach((p, i) => { const on = i < G.rps.streak; p.classList.toggle('on', on); if (anim === 'win' && i === G.rps.streak - 1) { p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); } }); if (anim === 'lose') { const s = this.el.querySelector('.rpsStreak'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); } },
  anim(sel, cls) { this.el.querySelectorAll(sel).forEach(e => { e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); }); },
  // ---------- une manche : on choisit en haut, « CHI… FOU… MI ! », on montre ----------
  pick(h) {
    const R = G.rps; if (!R || R.phase !== 'play' || R.busy) return;
    R.busy = true; AU.init();
    this.el.querySelectorAll('.rpsB').forEach(b => { const me = +b.dataset.h === h; b.classList.toggle('sel', me); b.classList.toggle('dim', !me); b.disabled = true; });
    this.setHands(0, 0); this.say('', '');
    const kidH = randi(0, 2), call = $('rpsCall'), beats = ['CHI', 'FOU', 'MI !'];
    const sides = this.el.querySelectorAll('.rpsSide');
    sides.forEach(s => s.classList.remove('win', 'lose', 'tie'));
    beats.forEach((w, i) => setTimeout(() => {
      if (G.rps !== R) return;
      call.textContent = w; call.className = 'rpsCall beat'; void call.offsetWidth; call.classList.add('go');
      this.anim('.rpsHand', 'pump'); AU.sfx('tick', 0.5 + i * 0.15);
    }, i * 170));
    setTimeout(() => { if (G.rps === R) this.reveal(h, kidH); }, 3 * 170 + 40);
  },
  reveal(h, kh) {
    const R = G.rps, card = $('rpsCard'), k = R.kid;
    this.setHands(h, kh); this.anim('.rpsHand', 'slam');
    card.classList.remove('flash', 'shake'); void card.offsetWidth; card.classList.add('flash', 'shake');
    const res = h === kh ? 0 : (h - kh + 3) % 3 === 1 ? 1 : -1;   // 1 : gagné, -1 : perdu
    const me = this.el.querySelector('.rpsSide.me'), kid = this.el.querySelector('.rpsSide.kid');
    $('rpsCall').textContent = res > 0 ? '★' : res < 0 ? '✖' : '=';
    if (res > 0) {
      R.streak++; me.classList.add('win'); kid.classList.add('lose'); this.pips('win'); AU.sfx('ding', 0.8);
      this.say(R.streak >= 2 ? 'TU PASSES !' : 'GAGNÉ ! Encore une !', 'win');
      this.burst();
      if (R.streak < 2) cue(k.x, k.y - 30, 'kid', pick(RPS_KID_LINES.lose), { life: 1.2 });
    } else if (res < 0) {
      R.streak = 0; me.classList.add('lose'); kid.classList.add('win'); this.pips('lose'); AU.sfx('fail', 0.6);
      this.say('PERDU ! On recommence…', 'lose'); cue(k.x, k.y - 30, 'kid', pick(RPS_KID_LINES.win), { life: 1.2 });
    } else {
      me.classList.add('tie'); kid.classList.add('tie'); AU.sfx('boing', 0.4);
      this.say('ÉGALITÉ ! Rejoue !', 'tie'); cue(k.x, k.y - 30, 'kid', pick(RPS_KID_LINES.tie), { life: 1.1 });
    }
    if (R.streak >= 2) { R.busy = true; setTimeout(() => { if (G.rps === R) this.win(); }, 420); return; }
    setTimeout(() => {
      if (G.rps !== R) return;
      R.busy = false; this.el.querySelectorAll('.rpsB').forEach(b => { b.classList.remove('sel', 'dim'); b.disabled = false; });
      this.setHands(0, 0); $('rpsCall').textContent = 'VS'; $('rpsCall').className = 'rpsCall';
    }, 620);
  },
  // de petites étoiles qui jaillissent
  burst() {
    const box = $('rpsCard');
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('span'); s.className = 'rpsStar'; s.textContent = pick(['★', '✦', '✧', '♥']);
      const a = rand(0, Math.PI * 2), d = rand(60, 140);
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.color = pick(['#ffd23f', '#ff8fbf', '#7ee05f', '#6fd6f0', '#ffffff']);
      box.appendChild(s); setTimeout(() => s.remove(), 650);
    }
  },
  // 2 victoires d'affilée : l'élève, beau joueur, te donne un objet
  win() {
    const R = G.rps, P = G.P, k = R.kid; R.phase = 'gift';
    const gift = (P.inv || []).length < 3 ? pick(ITEM_KEYS) : null;
    const g = $('rpsGift'), gc = g.querySelector('canvas');
    if (gift) {
      rpsDraw(gc, itemCanvas(gift)); gc.style.display = '';
      g.querySelector('b').textContent = R.name + ' te donne : ' + ITEMS[gift].n + ' !';
      AU.sfx('pickup'); AU.sfx('magic', 0.5);
    } else { gc.style.display = 'none'; g.querySelector('b').textContent = R.name + ' voulait te donner un objet… mais tes poches sont pleines !'; }
    g.classList.remove('hidden'); this.anim('#rpsGift', 'pop');
    this.burst();
    setTimeout(() => {
      if (G.rps !== R) return;
      if (gift) {
        P.inv.push(gift); UI.invSig = null;
        FX.flyers.push({ kind: gift, slot: P.inv.length - 1, wx: P.x, wy: P.y - 20, t: 0 });
        if (gift === 'squishy') squishyGot(P, true); else toast('🎁 ' + ITEMS[gift].n + ' : ' + ITEMS[gift].d, 3);
      }
      this.finish();
    }, 1250);
  },
  finish() {
    const R = G.rps, k = R.kid;
    cue(k.x, k.y - 30, 'kid', pick(RPS_KID_LINES.end), { life: 1.8 });
    AU.sfx('win', 0.5); this.close();
    // il s'écarte, et personne ne te redéfie tout de suite
    k.st = 2; k.path = null; hop(k, 60);
  },
  // on abandonne : on repart tout de suite… mais l'élève hurle, et le prof (ou le surveillant) fonce vers toi en courant
  quit() {
    const R = G.rps; if (!R || R.phase === 'gift' || R.busy) return;
    const k = R.kid, P = G.P, T = G.T;
    this.close(true);
    cue(k.x, k.y - 32, 'kid', pick(RPS_KID_LINES.quit), { life: 2.2 }); setMark(k, '!', 1.5); hop(k, 110);
    AU.sfx('kidscream', 0.9); G.shake = Math.max(G.shake, 0.2);
    makeNoise(P.x, P.y, 13, 'AAAAH !');
    if (T && !T.gone && G.mode === 'play') {
      T.lastSeen = [P.x, P.y]; T.heardT = G.time; setMark(T, '!', 1.4); hop(T, 80);
      say(pick(['J’arrive ! Personne ne bouge !', 'Où ça ?! J’arrive en courant !', 'Ah ah, je te tiens !']));
      if (T.state !== 'chase') { T.state = 'investigate'; T.rush = true; T.rushFull = true; T.rushRe = 99; T.path = null; const [tx, ty] = tileXY(P.x, P.y); if (!goTo(T, tx, ty)) { T.state = 'look'; T.st = 1; T.lookBase = T.ang; T.rush = false; } }
      if (AU.songName !== 'chase') AU.play('chase');
    }
    k.st = 2; k.path = null;
  },
  abort() {
    const R = G.rps; if (!R) return;
    if (R.kid && G.mode === 'play') { cue(R.kid.x, R.kid.y - 30, 'kid', 'Oups, le prof !', { life: 1.2 }); hop(R.kid, 80); }
    this.close(true);
  },
  close(fast) {
    G.rps = null; G.rpsNext = G.time + rand(55, 100);
    if (!this.el) return; const el = this.el;
    el.classList.remove('in'); el.classList.add('out');
    setTimeout(() => { if (!G.rps) el.classList.add('hidden'); }, fast ? 150 : 280);
  },
  // nouveau niveau, fin de partie : on range tout
  reset() { G.rps = null; G.rpsN = 0; G.rpsNext = 0; if (this.el) this.el.classList.add('hidden'); },
};
