// ================= LA COUPURE DE COURANT =================
// Un disjoncteur dans le couloir : on coupe tout, le collège passe en noir et blanc,
// tout le monde se cogne… et le prof part à tâtons rallumer. Parfait pour faire diversion.
const POWER_USES = 2, POWER_AUTO = 30;
const isDark = () => !!(G.dark && G.power && !G.inf && !G.net);
function powerSetup() {
  G.power = null; G.dark = false;
  const L = G.L, m = G.m; if (G.net || G.inf || !m || L.outdoor) return;
  const [sx, sy] = L.start, [tx, ty] = tileOf(G.T), good = [], ok = [];
  const decNear = (x, y) => m.decor.some(d => d.y === y && x >= d.x - 1 && x <= d.x + (d.w || 1));
  for (let y = 1; y < m.h - 2; y++) for (let x = 2; x < m.w - 2; x++) {
    if (m.get(x, y) !== K.WALL || m.get(x, y + 1) !== K.FLOOR || decNear(x, y)) continue;
    if ([[-1, 0], [1, 0], [-1, 1], [1, 1], [0, 2]].some(([dx, dy]) => m.get(x + dx, y + dy) === K.DOOR || m.get(x + dx, y + dy) > 29)) continue;
    if (Math.abs(x - sx) + Math.abs(y + 1 - sy) < 7 || Math.abs(x - tx) + Math.abs(y + 1 - ty) < 6) continue;
    if (G.tasks.some(t => Math.abs(t.x - x) + Math.abs(t.y - y) < 2)) continue;
    const rn = m.roomAt(x, y + 1);
    if (/^Couloir|Hall|Palier|Escalier/.test(rn)) good.push([x, y]); else if (rn && !/Toilettes|Douches/.test(rn)) ok.push([x, y]);
  }
  const c = good.length ? good : ok; if (!c.length) return;
  const [x, y] = pick(c); m.dec(x, y, 'fuse');
  G.power = { x, y, fx: x, fy: y + 1, uses: POWER_USES, t: 0, auto: 0, bonkT: 0 };
}
function powerNear(P) { const W = G.power; return W && Math.hypot(W.x * 16 + 8 - P.x, (W.y + 1) * 16 + 4 - P.y) < 22; }
function powerCut() {
  const W = G.power, P = G.P, T = G.T; if (!W || G.dark || W.uses <= 0) return;
  G.dark = true; W.uses--; W.t = 0; W.auto = POWER_AUTO; W.bonkT = 0.6;
  AU.sfx('lock'); AU.sfx('pouf', 0.5); G.shake = 0.2;
  cue(W.x * 16 + 8, W.y * 16 + 2, 'word', 'CLAC !', { col: '#ffd23f', pop: true, life: 1 });
  toast('⚡ Noir complet ! Tout le monde se cogne… ' + T.prof.name + ' va devoir rallumer. Profites-en !', 3.2);
  if (!T.gone && ['patrol', 'look', 'search', 'check', 'investigate', 'alert', 'chase', 'warn'].includes(T.state)) {
    T.state = 'power'; T.pwPhase = 'stun'; T.st = 1; T.path = null; T.detect = 0; T.pwStop = 0; T.bumpT = 0.8;
    say(pick(['Hé ! Qui a éteint la lumière ?!', 'AAAH ! Le noir !', 'Une panne ?! Je vais au disjoncteur…', 'Personne ne bouge ! J’arrive !']));
    setMark(T, '?', 1.2);
  }
  G.kids.forEach(k => {
    if (k.gone) return;
    if (!k.isWatcher && Math.random() < 0.3 && dist(k.x, k.y, P.x, P.y) < 14 * 16) k.bub = { text: pick(['Hiii ! Le noir !', 'Trop bien, plus de cours !', 'Qui a éteint ?!', 'J’y vois rien !', 'Maman !', 'Ouuuuh, les fantômes !']), t: 0, dur: 2.2 };
    if (!k.isWatcher && k.path) { k.path = null; k.st = rand(2, 4); }
  });
}
function powerRestore(by) {
  const W = G.power, T = G.T; if (!G.dark) return;
  G.dark = false; AU.sfx('lock'); AU.sfx('ding', 0.5);
  if (W) cue(W.x * 16 + 8, W.y * 16 + 2, 'word', 'CLIC !', { col: '#ffffff', pop: true, life: 0.9 });
  toast(by === 'prof' ? '💡 ' + T.prof.name + ' a rallumé la lumière.' : '💡 Le courant revient tout seul.', 2);
  if (T.state === 'power') { T.state = 'look'; T.st = 1.6; T.lookBase = T.ang; T.path = null; say(pick(['Et la lumière fut !', 'Bon. Où en étais-je ?', 'Qui a fait ça ?! Je vais le trouver…', 'Ah, c’est mieux comme ça.'])); }
}
// le prof va rallumer, à tâtons
function teacherPower(T, dt, slow) {
  const W = G.power; if (!W) { T.state = 'patrol'; return; }
  if (T.pwPhase === 'stun') {
    T.moving = false; T.st -= dt; T.ang += dt * 2.6; T.face = faceFromAng(T.ang);
    if (T.st <= 0) { T.pwPhase = 'go'; if (!goTo(T, W.fx, W.fy)) { T.pwPhase = 'fix'; T.st = 2.4; } }
    return;
  }
  if (T.pwPhase === 'go') {
    T.bumpT -= dt;
    if (T.bumpT <= 0) {
      T.bumpT = rand(1.8, 3.2);
      if (Math.random() < 0.45) { T.pwStop = 0.55; hop(T, 70); squash(T, -4); AU.sfx('bump'); cue(T.x, T.y - 30, 'word', pick(['BONK !', 'AÏE !', 'OUILLE !', 'Mon orteil !', 'Qui a mis ce mur là ?!']), { col: '#ffd23f', pop: true, life: 0.9 }); }
    }
    if (T.pwStop > 0) { T.pwStop -= dt; T.moving = false; return; }
    const r = followPath(T, T.prof.patrol * 0.9 * 16 * slow, dt);
    if (r === 'done') { T.pwPhase = 'fix'; T.st = 2.2; T.ang = -Math.PI / 2; T.face = 1; say('Le disjoncteur… le voilà !'); }
    else if (r && r.x !== undefined) onLocked(T, r);
    return;
  }
  T.moving = false; T.face = 1; T.st -= dt;
  if (T.st <= 0) powerRestore('prof');
}
function powerUpdate(dt) {
  const W = G.power; if (!W || !G.dark) return;
  W.t += dt; W.auto -= dt;
  if (W.auto <= 0) { powerRestore('auto'); return; }
  // tout le monde se cogne
  W.bonkT -= dt;
  if (W.bonkT <= 0) {
    W.bonkT = rand(0.7, 1.6);
    const c = G.kids.filter(k => !k.gone && k.vis && !k.isWatcher && dist(k.x, k.y, G.P.x, G.P.y) < 10 * 16);
    if (c.length) { const k = pick(c); hop(k, 60); cue(k.x, k.y - 28, 'word', pick(['BONK', 'AÏE', 'OUPS', 'BOING', 'Pardon !']), { col: '#ffd23f', pop: true, life: 0.8 }); AU.sfx('bump', 0.35); }
  }
}
// le voile noir (en plus du noir et blanc) : on ne voit presque plus que autour de soi
function darkFog(fx, ox, oy) {
  const P = G.P, sx = P.x + ox, sy = P.y - 10 + oy;
  fx.globalCompositeOperation = 'source-over';
  fx.fillStyle = 'rgba(4,4,12,0.62)'; fx.fillRect(0, 0, V.lw, V.lh);
  fx.globalCompositeOperation = 'destination-out';
  const g = fx.createRadialGradient(sx, sy, 8, sx, sy, 62); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  fx.fillStyle = g; fx.fillRect(sx - 64, sy - 64, 128, 128);
  fx.globalCompositeOperation = 'source-over';
}
