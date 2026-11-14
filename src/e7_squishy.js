// ================= SQUISHY : LA SECONDE CHANCE =================
// On ramasse un squishy (un modèle au hasard de la collection) : il va dans le sac.
// Si un prof t'attrape, il sort tout seul… SPLOTCH ! Il explose à la figure du prof :
// étoiles dans les yeux, « trop mignon !! », il ne voit plus rien pendant 10 s.
const BLIND_T = 10;
const SQUISHY_HIT = ['Kyaaa ! Un squishy !! Trop mignon… mais je ne vois plus rien !', 'Awww trop chou… AÏE, ça colle partout !', 'Hiii ! Des paillettes plein les yeux !', 'Ooooh… trop kawaii… mais où es-tu passé·e ?!', 'Trop mignon !! Mes yeux… je ne vois que des cœurs !'];
const SQUISHY_MORE = ['Pouic… où es-tu ?', 'Je ne vois que des paillettes !', 'Trop mignon… mais ça colle !', 'Kyaa, ça sent la fraise !', 'Pouic pouic… hihi… euh, non !', 'Mes yeux ! Mes jolis yeux !', 'Qui a fait ça ?! Trop chou…'];
const SQUISHY_END = ['Hum… où en étais-je ?', 'Bon… on se reprend.', 'Ahem. Je n’ai rien vu.', 'Ça y est, je vois de nouveau !'];
function isBlind(A) { return !!A && (A.state === 'blind' || G.time < (A.blindUntil || 0)); }
// ---------- ramasser ----------
function squishyGot(P, quiet) {
  const id = SqCol.roll(); (P.sqIds || (P.sqIds = [])).push(id);
  const q = SQUISHIES[id], isNew = SqCol.add(id), n = SqCol.count(), R = SQ_RARITY[q.r];
  AU.sfx('squish', 0.8); if (q.r >= 2) AU.sfx('kawaii', 0.9);
  if (!quiet) {
    const head = q.r === 3 ? '🌟 LÉGENDAIRE !! ' : q.r === 2 ? '💜 Super rare ! ' : q.r === 1 ? '💙 Rare ! ' : '';
    toast('🧸 ' + head + '« ' + q.n + ' »' + (isNew ? ' (nouveau !)' : '') + ' · ' + n + '/' + SQUISHIES.length + '. Ton airbag anti-prof.', 3);
    if (q.r >= 2) { FX.flash = 0.4; FX.flashCol = q.r === 3 ? '255,230,120' : '210,160,255'; sparkle(P.x, P.y - 14, 20, R.col); }
  }
  UI.invSig = null;
  return id;
}
// numéro du modèle pour la i-ème case du sac
function squishyAt(P, i) { let j = 0; for (let k = 0; k < i; k++) if (P.inv[k] === 'squishy') j++; return P.sqIds ? P.sqIds[j] : 0; }
function squishyCount(P) { return P && P.inv ? P.inv.filter(k => k === 'squishy').length : 0; }
// enlève le premier squishy du sac (renvoie son modèle)
function squishyTake(P) {
  const i = P.inv.indexOf('squishy'); if (i < 0) return -1;
  P.inv.splice(i, 1); const id = P.sqIds && P.sqIds.length ? P.sqIds.shift() : 0; UI.invSig = null; return id;
}
// ---------- l'explosion ----------
// local : c'est ici que le prof est simulé (il passe en état « aveuglé »)
function squishyBlast(T, from, id, local, line) {
  T.blindUntil = G.time + BLIND_T; T.blindStart = G.time; T.sqT = 0.6; T.moreT = rand(2.8, 3.6); T.stumT = 0; T.sqId = id;
  if (local) {
    T.state = 'blind'; T.st = BLIND_T; T.path = null; T.moving = false; T.running = false; T.detect = 0; if (T.det) T.det = {};
    T.knows = null; T.lastSeen = null; T.chaseT = 0;
  }
  if (G.inf) G.inf.grace = Math.max(G.inf.grace || 0, 3);
  const text = line || pick(SQUISHY_HIT);
  T.bubble = { text, t: 0, dur: 3 };
  const d = dist(T.x, T.y, G.P.x, G.P.y) / 16;
  if (d < 14) AU.say(text, T.prof, clamp(1.2 - d / 12, 0.2, 1));
  G.squishFly = (G.squishFly || []).concat([{ x0: from.x, y0: from.y - 16, A: T, t: 0, id }]);
  AU.sfx('squish'); if (from.x > -9000) { hop(from, 100); squash(from, 4); }
  return text;
}
function squishySplat(T) {
  const x = T.x, y = T.y - 24;
  AU.sfx('squish', 1); AU.sfx('pouf', 0.7); AU.sfx('kawaii', 0.9); G.shake = Math.max(G.shake, 0.3); FX.flash = 0.45; FX.flashCol = '255,170,220';
  for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, s = rand(25, 70); part(x, y, 'puff', { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life: rand(0.4, 0.8), col: pick(['#ffb3d6', '#ff8fc0', '#ffe0ef', '#ffffff']), size: randi(2, 3) }); }
  for (let i = 0; i < 10; i++) part(x + rand(-6, 6), y + rand(-4, 4), 'heart', { vx: rand(-40, 40), vy: rand(-60, -20), g: 30, life: rand(1, 1.6), col: pick(['#ff6f9a', '#ff9fd8', '#ffb3d6']) });
  sparkle(x, y, 18, '#ffd23f');
  cue(x, y - 12, 'word', 'SPLOTCH !', { col: '#ff8fc0', pop: true, life: 1.3 });
}
function squishyToast(T, id) {
  const q = SQUISHIES[id] || SQUISHIES[0];
  toast('🧸 SPLOTCH ! ' + (T.prof && T.prof.name ? T.prof.name : 'Le prof') + ' ne voit plus rien (' + BLIND_T + ' s). File !', 2.8);
}
// attrapé·e en solo (ou infiltration seul·e) : seconde chance ?
function squishySave(T, P) {
  const id = squishyTake(P); if (id < 0) return false;
  if (P.hidden) { const s = P.hidden; P.hidden = null; if (s.k === K.DOOR) { const d = doorAt(s.x, s.y); if (d) d.hideP = false; } const st = s.stand[0]; P.x = st[0] * 16 + 8; P.y = st[1] * 16 + 12; puff(s.x * 16 + 8, s.y * 16 + 8, 12); }
  P.busy = null;
  squishyBlast(T, P, id, true); squishyToast(T, id);
  return true;
}
// ---------- le prof aveuglé : il titube, se frotte les yeux… et presse ce qu'il reste du squishy ----------
function teacherBlind(A, dt) {
  A.st -= dt; A.detect = 0; if (A.det) A.det = {}; A.running = false;
  A.stumT = (A.stumT || 0) - dt;
  if (A.stumT <= 0) { A.stumT = rand(0.8, 1.5); A.stumA = Math.random() * Math.PI * 2; A.stumGo = Math.random() < 0.6; }
  if (A.stumGo && A.st > 0.5) {
    const sp = 0.45 * 16 * dt, ox = A.x, oy = A.y;
    moveA(A, Math.cos(A.stumA) * sp, Math.sin(A.stumA) * sp, solidT, 5, 6);
    const mv = Math.hypot(A.x - ox, A.y - oy); A.moving = mv > 0.02; if (!A.moving) A.stumT = 0; A.dist = (A.dist || 0) + mv; A.anim = (A.anim || 0) + dt * 0.7;
  } else A.moving = false;
  A.ang = Math.PI / 2; A.face = 0;
  if (A.st <= 0) {
    A.blindUntil = 0; A.state = 'patrol'; A.path = null; A.knows = null; A.lastSeen = null; A.detect = 0;
    const text = pick(SQUISHY_END); A.bubble = { text, t: 0, dur: 2 };
    if (G.inf && G.inf.coop) Net.send({ t: 'bub', w: 'T', text, dur: 2 });
  }
}
// ---------- visuels et sons (sur chaque écran) ----------
function cuteTick(dt) {
  if (G.squishFly && G.squishFly.length) {
    G.squishFly.forEach(f => { f.t += dt / 0.25; if (f.t >= 1 && !f.done) { f.done = true; squishySplat(f.A); } });
    G.squishFly = G.squishFly.filter(f => f.t < 1);
  }
  const A = G.T; if (!A || !isBlind(A)) return;
  A.sqT = (A.sqT || 0) - dt;
  if (A.sqT <= 0) {
    A.sqT = rand(0.8, 1.3);
    const d = dist(A.x, A.y, G.P.x, G.P.y) / 16;
    if (d < 13) AU.sfx('squish', clamp(1 - d / 13, 0.12, 0.7));
    for (let i = 0; i < 2; i++) part(A.x + rand(-6, 6), A.y - rand(24, 32), 'heart', { vx: rand(-10, 10), vy: rand(-30, -16), life: rand(0.8, 1.3), col: pick(['#ff6f9a', '#ff9fd8', '#ffb3d6']) });
    if (Math.random() < 0.5) part(A.x + rand(-5, 5), A.y - 22, 'drop', { vy: rand(10, 20), g: 40, life: 0.8, col: '#ff9fc8' });
  }
  A.moreT = (A.moreT || 3) - dt;
  if (A.moreT <= 0) { A.moreT = rand(3, 4.2); if (!A.bubble) A.bubble = { text: pick(SQUISHY_MORE), t: 0, dur: 1.8 }; }
}
// guimauve rose et paillettes sur la figure du prof
function drawBlindGoo(c, A) {
  if (!isBlind(A)) return;
  const left = Math.max(0, (A.blindUntil || 0) - G.time), fade = A.state === 'blind' ? 1 : clamp(left / 1.2, 0, 1), x = A.x, y = A.y - (A.hz || 0);
  if (fade <= 0) return;
  c.globalAlpha = fade;
  [[-3, -28, 2.6], [3, -27, 2.2], [0, -30, 2], [-5, -24, 1.4], [5, -23, 1.5]].forEach(([dx, dy, r], i) => { c.fillStyle = i % 2 ? '#ff9fc8' : '#ffb3d6'; c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); });
  c.fillStyle = '#ffffff'; c.fillRect(x - 4, y - 29.5, 1, 1); c.fillRect(x + 2, y - 28.5, 1, 1);
  const dr = (G.time * 5) % 6; c.fillStyle = '#ff9fc8'; c.fillRect(x - 5, y - 23 + dr, 1, 2); c.fillRect(x + 5, y - 22 + ((dr + 3) % 6), 1, 2);
  if ((G.time * 8 | 0) % 2) { c.fillStyle = '#ffd23f'; c.fillRect(x - 6, y - 31, 1, 1); c.fillRect(x + 6, y - 26, 1, 1); c.fillRect(x + 1, y - 33, 1, 1); }
  c.globalAlpha = 1;
}
function drawSquishFly(c) {
  (G.squishFly || []).forEach(f => {
    const t = Math.min(1, f.t), e = t * t * (3 - 2 * t), tx = f.A.x, ty = f.A.y - 24;
    const x = lerp(f.x0, tx, e), y = lerp(f.y0, ty, e) - Math.sin(Math.PI * t) * 14, s = 1 + t * 0.7;
    c.save(); c.translate(x, y); c.rotate(t * 6); c.scale(s, s); c.drawImage(squishyCanvas(f.id || 0), -7, -7); c.restore();
  });
}
// ---------- réseau ----------
// duel : je suis le prof, j'attrape… et l'élève avait un squishy
function squishyOnMe(id) {
  const T = G.T; T.stunT = 2.5; T.state = 'stun';
  squishyBlast(T, { x: G.P.x, y: G.P.y }, id, false);
  toast('🥰 SPLOTCH ! Trop mignon… et tu ne vois plus rien (' + BLIND_T + ' s).', 3);
}
function squishyRecv(d) {
  const I = G.inf, T = G.T;
  switch (d.t) {
    case 'sqUse': {   // on m'a attrapé·e, mon squishy est parti (c'est l'autre écran qui gère le prof)
      const id = squishyTake(G.P); if (id < 0) return;
      if (G.net && !(I && I.coop)) { T.blindUntil = G.time + BLIND_T; T.blindStart = G.time; T.sqT = 0.6; G.squishFly = (G.squishFly || []).concat([{ x0: G.P.x, y0: G.P.y - 16, A: T, t: 0, id }]); AU.sfx('squish'); hop(G.P, 100); }
      squishyToast(T, id); if (I) I.grace = Math.max(I.grace || 0, 3);
      return;
    }
    case 'sqFx': {   // en équipe : l'explosion vue depuis l'écran du coéquipier
      if (!I || d.fl !== I.cur) return;
      const who = d.me ? G.P2 : G.P;
      T.blindUntil = G.time + BLIND_T; T.blindStart = G.time; T.sqT = 0.6; T.sqId = d.id;
      G.squishFly = (G.squishFly || []).concat([{ x0: who.x, y0: who.y - 16, A: T, t: 0, id: d.id }]);
      if (d.text) T.bubble = { text: d.text, t: 0, dur: 3 };
      return;
    }
  }
}
// ---------- album ----------
const SqAlbum = {
  back: 'title',
  open(back) {
    this.back = back || 'title'; const have = SqCol.get(), n = SqCol.count();
    $('sqCount').textContent = n + ' / ' + SQUISHIES.length;
    $('sqBar').style.width = Math.round(n / SQUISHIES.length * 100) + '%';
    $('sqInfo').innerHTML = n ? 'Touche un squishy pour voir sa fiche.' : 'Ramasse des squishies dans le collège pour remplir ta collection !';
    const g = $('sqGrid'); g.innerHTML = '';
    SQUISHIES.forEach(q => {
      const got = have[q.id] || 0, b = document.createElement('button'); b.className = 'sqCard r' + q.r + (got ? '' : ' unk');
      const cv = document.createElement('canvas'); cv.width = 14; cv.height = 14; cv.getContext('2d').drawImage(squishyCanvas(q.id, !got), 0, 0); b.appendChild(cv);
      const t = document.createElement('span'); t.className = 'nm'; t.textContent = got ? q.n : '???'; b.appendChild(t);
      if (got > 1) { const c = document.createElement('span'); c.className = 'nb'; c.textContent = '×' + got; b.appendChild(c); }
      b.onclick = () => { AU.sfx(got ? 'squish' : 'tick', 0.6); $('sqInfo').innerHTML = got ? `<b style="color:${SQ_RARITY[q.r].col}">${esc(q.n)}</b> · ${SQ_RARITY[q.r].n} · trouvé ${got} fois` : `<b style="color:${SQ_RARITY[q.r].col}">???</b> · un squishy ${SQ_RARITY[q.r].n.toLowerCase()} pas encore trouvé…`; };
      g.appendChild(b);
    });
    UI.show('sSquish');
  }
};
