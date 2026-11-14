// ================= TÂCHES RIGOLOTES (mini-jeux) =================
const TASKDEFS = {
  pigeons: { name: 'Nourrir les pigeons', icon: '🍞', type: 'tap', target: '🍞', n: 6, pops: ['Rrrou !', 'Miam !', 'Croc !'], decor: '🐦', hint: 'Tape sur le pain pour lancer des miettes aux pigeons !', noise: { r: 4, w: 'rrrou rrrou' } },
  craie: { name: 'Dessiner un bonhomme à la craie', icon: '🖍️', type: 'trace', shape: 'smiley', hint: 'Suis les pointillés avec ton doigt, sans lever !' },
  toboggan: { name: 'Savonner le toboggan', icon: '🧼', type: 'hold', grow: '🧼', fail: 'SPLATCH !', hint: 'Maintiens, puis lâche dans la zone verte (pas trop de savon !).' },
  casquette: { name: 'Cacher la casquette du surveillant', icon: '🧢', type: 'drag', obj: '🧢', n: 1, target: '🗑️', done: 'Hihi !', hint: 'Glisse la casquette dans la poubelle !' },
  cabane: { name: 'Peindre la cabane en rose', icon: '🎨', type: 'tap', target: '🖌️', n: 7, pops: ['Splash !', 'Rose !', 'Hihi !'], decor: '🏠', splat: '#ff6fb5', hint: 'Tape sur le pinceau pour tout peindre en rose !', noise: { r: 3, w: 'splash !' } },
  chaussettes: { name: 'Lancer des chaussettes dans le panier', icon: '🧦', type: 'drag', obj: '🧦', n: 3, target: '🧺', done: 'Panier !', hint: 'Glisse les chaussettes sales dans le panier !' },
  tampon: { name: 'Tamponner les carnets (licorne)', icon: '🦄', type: 'tap', target: '📒', n: 5, pops: ['TAMP !', 'Licorne !', 'Paf !'], decor: '🦄', hint: 'Tape sur les carnets pour les tamponner !', noise: { r: 4, w: 'TAMP !' } },
  photocopies: { name: 'Photocopier 100 chats', icon: '🐱', type: 'hold', grow: '🐱', fail: 'BOURRAGE !', spit: '🐱', hint: 'Maintiens le bouton, lâche dans la zone verte !', noise: { r: 6, w: 'BZZZ BZZZ' } },
  coussin: { name: 'Cacher un coussin péteur', icon: '💨', type: 'drag', obj: '🟣', n: 1, target: '🪑', done: 'PROOOUT !', hint: 'Glisse le coussin péteur sur la chaise !' },
  nounours: { name: 'Border le nounours', icon: '🧸', type: 'drag', obj: '🧸', n: 1, target: '🛏️', done: 'Bonne nuit !', hint: 'Couche le nounours dans le lit !' },
  bisous: { name: 'Écrire BISOUS au tableau', icon: '✏️', type: 'order', word: 'BISOUS', hint: 'Tape les lettres dans l’ordre : B-I-S-O-U-S' },
  couleurs: { name: 'Ranger par couleur', icon: '🌈', type: 'order', colors: true, hint: 'Tape les couleurs dans l’ordre de l’arc-en-ciel : rouge, orange, jaune, vert, bleu, violet.' },
  hamster: { name: 'Nourrir le hamster de la classe', icon: '🐹', type: 'tap', target: '🌻', n: 6, pops: ['Couic !', 'Miam !', 'Croc !'], decor: '🐹', hint: 'Tape sur les graines pour nourrir le hamster !', noise: { r: 3, w: 'couic !' } },
  vacances: { name: 'Écrire VACANCES au tableau', icon: '✏️', type: 'order', word: 'VACANCES', hint: 'Tape les lettres dans l’ordre : V-A-C-A-N-C-E-S' },
  plante: { name: 'Arroser la plante carnivore', icon: '🪴', type: 'hold', grow: '🪴', fail: 'BUUURP !', hint: 'Maintiens pour arroser, lâche dans la zone verte !' },
  moustache: { name: 'Dessiner une moustache', icon: '🥸', type: 'trace', shape: 'moustache', hint: 'Suis les pointillés pour dessiner une moustache !' },
  sucre: { name: 'Mettre du sel dans les cafés', icon: '🧂', type: 'drag', obj: '🧂', n: 3, target: '☕', done: 'Beurk, hihi !', hint: 'Glisse le sel dans le café des profs !' },
  squelette: { name: 'Mettre des lunettes au squelette', icon: '💀', type: 'drag', obj: '🕶️', n: 1, target: '💀', done: 'Trop stylé !', hint: 'Glisse les lunettes de soleil sur le squelette !' },
  ballon: { name: 'Gonfler un ballon géant', icon: '🎈', type: 'hold', grow: '🎈', fail: 'BOUM !', hint: 'Maintiens pour gonfler, lâche dans la zone verte !', noise: { r: 4, w: 'fffff' } },
  pompes: { name: 'Faire 10 pompes', icon: '💪', type: 'tap', target: '💪', n: 10, pops: ['Une !', 'Hop !', 'Ouf !', 'Allez !'], decor: '😤', hint: 'Tape vite pour faire tes pompes !' },
  chrono: { name: 'Cacher le chrono du prof', icon: '⏱️', type: 'drag', obj: '⏱️', n: 1, target: '🧺', done: 'Tic tac… disparu !', hint: 'Glisse le chrono dans le panier à linge !' },
  mousse: { name: 'Mettre de la mousse dans les douches', icon: '🧽', type: 'tap', target: '🧴', n: 8, pops: ['Pschit !', 'Mousse !', 'Blop !'], decor: '🚿', hint: 'Tape sur le flacon pour faire de la mousse !', noise: { r: 3, w: 'pschit !' } },
  chocolat: { name: 'Remplacer le café par du chocolat', icon: '🍫', type: 'drag', obj: '🍫', n: 2, target: '☕', done: 'Miam !', hint: 'Glisse le chocolat dans les tasses !' },
};
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function completeTask(t) {
  if (t.done) return;
  t.done = true; G.tasksDone = G.tasks.filter(x => x.done).length;
  const P = G.P; AU.sfx('found'); confetti(P.x, P.y - 12, 26); hop(P, 100);
  if (G.net) Net.send({ t: 'task', n: G.tasksDone });
  if (G.tasksDone >= G.tasks.length) { UI.banner('🎉 Tâches finies ! Maintenant : la sortie.'); FX.flash = 0.6; FX.flashCol = '200,255,200'; AU.sfx('win'); }
  else toast('✅ Tâche faite ! (' + G.tasksDone + '/' + G.tasks.length + ')', 2);
}
const tasksLeft = () => G.tasks ? G.tasks.filter(t => !t.done).length : 0;
const TaskUI = {
  task: null, st: null, cv: null, cx: null, W: 300, H: 210, ptr: null, noiseT: 0,
  init() {
    this.cv = $('tkCv'); this.cx = this.cv.getContext('2d');
    $('tkClose').onclick = e => { e.stopPropagation(); AU.sfx('blip'); this.close(); };
    $('sTask').addEventListener('pointerdown', e => e.stopPropagation());
    const pos = e => { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * this.W, (e.clientY - r.top) / r.height * this.H]; };
    this.cv.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); AU.init(); try { this.cv.setPointerCapture(e.pointerId); } catch (x) { } this.ptr = pos(e); if (this.st && !this.st.won) this.down(this.ptr); });
    this.cv.addEventListener('pointermove', e => { if (!this.ptr) return; e.preventDefault(); this.ptr = pos(e); if (this.st && !this.st.won) this.move(this.ptr); });
    const up = () => { if (!this.ptr) return; if (this.st && !this.st.won) this.up(this.ptr); this.ptr = null; };
    this.cv.addEventListener('pointerup', up); this.cv.addEventListener('pointercancel', up); this.cv.addEventListener('lostpointercapture', up);
  },
  open(task) {
    this.task = task; const d = task.def;
    $('tkTitle').textContent = d.icon + ' ' + d.name; $('tkHint').textContent = d.hint;
    const dpr = Math.min(2, window.devicePixelRatio || 1); this.cv.width = this.W * dpr; this.cv.height = this.H * dpr; this.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.st = task.st || this.setup(d); task.st = null; this.st.pops = []; if (this.st.grab) this.st.grab = null; if (this.st.holding) this.st.holding = false; this.noiseT = 0.6; $('tkWarn').classList.add('hidden');
    $('sTask').classList.remove('hidden'); Input.reset(); G.P.taskOpen = task; AU.sfx('blip');
  },
  close() { $('sTask').classList.add('hidden'); if (G.P) G.P.taskOpen = null; if (this.task && this.st && !this.st.won) this.task.st = this.st; this.task = null; this.st = null; this.ptr = null; },
  setup(d) {
    const W = this.W, H = this.H, st = { t: 0, pops: [], won: false, wonT: 0 };
    if (d.type === 'tap') Object.assign(st, { x: W / 2, y: H / 2, vx: 70, vy: 50, n: 0, splats: [] });
    if (d.type === 'hold') Object.assign(st, { v: 0, holding: false, zone: [0.66, 0.84], failT: 0, spits: [] });
    if (d.type === 'trace') { st.pts = traceShape(d.shape, W, H); st.i = 0; }
    if (d.type === 'drag') { st.target = { x: W - 70, y: H / 2 + 10 }; st.objs = []; for (let i = 0; i < d.n; i++) { const o = { x: 50 + (i % 2) * 50, y: 50 + i * 50 }; o.ox = o.x; o.oy = o.y; st.objs.push(o); } st.n = 0; st.grab = null; }
    if (d.type === 'order') {
      const seq = d.colors ? ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪'] : [...d.word]; st.seq = seq; st.next = 0;
      const sh = shuffle(seq.map((c, i) => ({ c, i }))), cols = Math.min(4, sh.length), tw = 58, th = 46;
      st.tiles = sh.map((o, k) => ({ c: o.c, used: false, shake: 0, x: (W - cols * (tw + 8) + 8) / 2 + (k % cols) * (tw + 8), y: 70 + Math.floor(k / cols) * (th + 10), w: tw, h: th }));
    }
    return st;
  },
  pop(x, y, text, col) { this.st.pops.push({ x, y, text, col: col || '#1a1028', t: 0 }); },
  win() {
    const st = this.st; if (st.won) return; st.won = true; st.wonT = 0;
    const d = this.task.def; if (d.done) this.pop(this.W / 2, this.H / 2 - 10, d.done, '#e0249a');
    AU.sfx('pickup');
  },
  down(p) {
    const d = this.task.def, st = this.st;
    if (d.type === 'tap') {
      if (Math.hypot(p[0] - st.x, p[1] - st.y) < 40) {
        st.n++; this.pop(st.x, st.y - 24, pick(d.pops)); AU.sfx('blip');
        if (d.splat) st.splats.push({ x: st.x + rand(-30, 30), y: st.y + rand(-20, 20), r: rand(10, 22) });
        st.x = rand(40, this.W - 90); st.y = rand(40, this.H - 40); const a = rand(0, 6.28), s = 70 + st.n * 12; st.vx = Math.cos(a) * s; st.vy = Math.sin(a) * s;
        if (st.n >= d.n) this.win();
      } else AU.sfx('tick');
    } else if (d.type === 'hold') { if (st.failT <= 0) st.holding = true; }
    else if (d.type === 'drag') { for (const o of st.objs) if (!o.done && Math.hypot(p[0] - o.x, p[1] - o.y) < 36) { st.grab = o; AU.sfx('tick'); break; } }
    else if (d.type === 'order') {
      for (const t of st.tiles) {
        if (t.used || p[0] < t.x || p[0] > t.x + t.w || p[1] < t.y || p[1] > t.y + t.h) continue;
        if (t.c === st.seq[st.next]) { t.used = true; st.next++; AU.sfx('blip'); if (st.next >= st.seq.length) this.win(); }
        else { t.shake = 0.35; AU.sfx('fail'); }
        break;
      }
    } else if (d.type === 'trace') this.move(p);
  },
  move(p) {
    const d = this.task.def, st = this.st;
    if (d.type === 'drag' && st.grab) { st.grab.x = p[0]; st.grab.y = p[1]; }
    if (d.type === 'trace') {
      for (let k = 0; k < 3 && st.i < st.pts.length; k++) {
        const q = st.pts[st.i]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 30) { st.i++; if (st.i % 4 === 0) AU.sfx('tick'); } else break;
      }
      if (st.i >= st.pts.length) this.win();
    }
  },
  up(p) {
    const d = this.task.def, st = this.st;
    if (d.type === 'hold' && st.holding) {
      st.holding = false;
      if (st.v >= st.zone[0] && st.v <= st.zone[1]) this.win();
    }
    if (d.type === 'drag' && st.grab) {
      const o = st.grab; st.grab = null;
      if (Math.hypot(o.x - st.target.x, o.y - st.target.y) < 52) { o.done = true; st.n++; AU.sfx('pickup'); this.pop(st.target.x, st.target.y - 40, pick(['Hop !', 'Et voilà !', 'Hihi !'])); if (st.n >= d.n) this.win(); }
      else { o.x = o.ox; o.y = o.oy; AU.sfx('bump'); }
    }
  },
  tick(dt) {
    if (!this.task) return;
    if (G.mode !== 'play' || !G.P || G.P.taskOpen !== this.task) { this.close(); return; }
    const d = this.task.def, st = this.st, W = this.W, H = this.H; st.t += dt;
    if (d.noise && !st.won) { this.noiseT -= dt; if (this.noiseT <= 0) { this.noiseT = 1.6; makeNoise(G.P.x, G.P.y, d.noise.r, d.noise.w); cue(G.P.x, G.P.y - 34, 'word', d.noise.w, { col: '#ffffff', small: true, life: 0.9 }); } }
    if (d.type === 'tap' && !st.won) { st.x += st.vx * dt; st.y += st.vy * dt; if (st.x < 30 || st.x > W - 90) { st.vx *= -1; st.x = clamp(st.x, 30, W - 90); } if (st.y < 30 || st.y > H - 30) { st.vy *= -1; st.y = clamp(st.y, 30, H - 30); } }
    if (d.type === 'hold' && !st.won) {
      if (st.failT > 0) { st.failT -= dt; st.v = Math.max(0, st.v - dt * 2); }
      else if (st.holding) { st.v += dt * 0.42; if (d.spit && Math.random() < dt * 10) st.spits.push({ x: W / 2 + 20, y: H / 2, vx: rand(40, 120), vy: rand(-120, -40), t: 0 }); if (st.v > 1) { st.holding = false; st.failT = 0.9; this.pop(W / 2, H / 2 - 30, d.fail, '#e43b44'); AU.sfx('pouf'); } }
      else st.v = Math.max(0, st.v - dt * 0.08);
    }
    st.pops.forEach(p => p.t += dt); st.pops = st.pops.filter(p => p.t < 1);
    if (st.spits) { st.spits.forEach(s => { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; }); st.spits = st.spits.filter(s => s.t < 1.5); }
    if (st.tiles) st.tiles.forEach(t => { if (t.shake > 0) t.shake -= dt; });
    { const T = G.T, near = dist(T.x, T.y, G.P.x, G.P.y) < 7 * 16 && T.state !== 'count' && T.state !== 'sleep' && (G.tVis || T.state === 'chase' || dist(T.x, T.y, G.P.x, G.P.y) < 4.5 * 16); $('tkWarn').classList.toggle('hidden', !near); }
    if (st.won) { st.wonT += dt; if (st.wonT > 0.8) { const t = this.task; this.close(); completeTask(t); return; } }
    this.draw();
    const prog = d.type === 'tap' ? st.n / d.n : d.type === 'hold' ? (st.won ? 1 : 0) : d.type === 'trace' ? st.i / st.pts.length : d.type === 'drag' ? st.n / d.n : st.next / st.seq.length;
    $('tkProg').style.width = Math.round(clamp(prog, 0, 1) * 100) + '%';
  },
  draw() {
    const c = this.cx, d = this.task.def, st = this.st, W = this.W, H = this.H;
    const emo = (e, x, y, s, rot) => { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.font = s + 'px ' + EMOJI_FONT; c.fillStyle = '#1a1028'; c.globalAlpha = 1; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, 0, 0); c.restore(); };
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fff6e6'); g.addColorStop(1, '#f2e2c4'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(26,16,40,0.06)'; for (let x = 0; x < W; x += 14) for (let y = 0; y < H; y += 14) c.fillRect(x, y, 2, 2);
    if (d.type === 'tap') {
      st.splats.forEach(s => { c.fillStyle = d.splat; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); });
      const k = 1 + st.n / d.n * 0.7; emo(d.decor, W - 50, H - 50, 54 * k, Math.sin(st.t * 6) * 0.08);
      const b = Math.sin(st.t * 10) * 3; emo(d.target, st.x, st.y + b, 46, Math.sin(st.t * 5) * 0.15);
      c.strokeStyle = 'rgba(224,36,154,0.5)'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.arc(st.x, st.y + b, 30 + Math.sin(st.t * 8) * 3, 0, 7); c.stroke(); c.setLineDash([]);
      this.label(st.n + ' / ' + d.n, 14, 22, 'left');
    } else if (d.type === 'hold') {
      const gx = 24, gy = 24, gw = 26, gh = H - 48;
      c.fillStyle = '#2f2156'; c.fillRect(gx - 3, gy - 3, gw + 6, gh + 6);
      c.fillStyle = '#5a4a8a'; c.fillRect(gx, gy, gw, gh);
      c.fillStyle = '#63c74d'; c.fillRect(gx, gy + gh * (1 - st.zone[1]), gw, gh * (st.zone[1] - st.zone[0]));
      const fillC = st.v > st.zone[1] ? '#e43b44' : st.v >= st.zone[0] ? '#b8f060' : '#fec43a';
      c.fillStyle = fillC; c.fillRect(gx + 5, gy + gh * (1 - Math.min(1, st.v)), gw - 10, gh * Math.min(1, st.v));
      const s = 30 + st.v * 70 + (st.holding ? Math.sin(st.t * 30) * 2 : 0); emo(d.grow, W / 2 + 20, H / 2 + 6, s, st.holding ? Math.sin(st.t * 20) * 0.05 : 0);
      (st.spits || []).forEach(sp => emo(d.spit, sp.x, sp.y, 20, sp.t * 6));
      const bx = W - 70, by = H - 36; c.fillStyle = st.holding ? '#e0249a' : '#ff4f8b'; c.beginPath(); c.arc(bx, by, 26 + (st.holding ? 0 : Math.sin(st.t * 5) * 2), 0, 7); c.fill();
      c.strokeStyle = '#1a1028'; c.lineWidth = 3; c.stroke(); this.label(st.holding ? '…' : 'MAINTIENS', bx, by + 1, 'center', '#ffffff', 9);
    } else if (d.type === 'trace') {
      if (d.shape === 'moustache') { emo('😐', W / 2, H / 2 - 18, 150); if (st.won) emo('😄', W / 2, H / 2 - 18, 150); }
      c.strokeStyle = 'rgba(26,16,40,0.3)'; c.lineWidth = 4; c.setLineDash([3, 7]); c.beginPath(); st.pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.setLineDash([]);
      if (st.i > 0) { c.strokeStyle = d.shape === 'moustache' ? '#4a2a14' : '#3d7bff'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); for (let i = 0; i < st.i; i++) { const q = st.pts[i]; i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke(); }
      if (!st.won && st.i < st.pts.length) { const q = st.pts[st.i]; c.fillStyle = 'rgba(224,36,154,0.35)'; c.beginPath(); c.arc(q[0], q[1], 16 + Math.sin(st.t * 8) * 4, 0, 7); c.fill(); if (st.i === 0) emo('👆', q[0] + 14, q[1] + 22, 26); }
      if (st.won && d.shape === 'smiley') { c.fillStyle = '#3d7bff'; c.beginPath(); c.arc(W / 2 - 22, H / 2 - 16, 7, 0, 7); c.arc(W / 2 + 22, H / 2 - 16, 7, 0, 7); c.fill(); c.strokeStyle = '#3d7bff'; c.lineWidth = 7; c.beginPath(); c.arc(W / 2, H / 2 + 4, 30, 0.3, Math.PI - 0.3); c.stroke(); }
    } else if (d.type === 'drag') {
      c.strokeStyle = 'rgba(99,199,77,0.8)'; c.lineWidth = 4; c.setLineDash([8, 6]); c.lineDashOffset = -st.t * 20; c.beginPath(); c.arc(st.target.x, st.target.y, 46, 0, 7); c.stroke(); c.setLineDash([]);
      emo(d.target, st.target.x, st.target.y, 62 + (st.won ? Math.sin(st.wonT * 30) * 8 : 0));
      st.objs.forEach(o => { if (!o.done) emo(d.obj, o.x, o.y, 42, o === st.grab ? Math.sin(st.t * 20) * 0.2 : 0); });
      if (!st.won && !st.grab) { const a = (st.t * 1.5) % 1; emo('👉', lerp(110, st.target.x - 60, a), st.target.y, 24); }
      this.label(st.n + ' / ' + d.n, 14, 22, 'left');
    } else if (d.type === 'order') {
      const word = st.seq.map((ch, i) => i < st.next ? ch : (d.colors ? '⬜' : '_')).join(d.colors ? '' : ' ');
      if (d.colors) emo(word, W / 2, 34, 24); else this.label(word, W / 2, 34, 'center', '#1a1028', 16);
      st.tiles.forEach(t => {
        const sx = t.shake > 0 ? Math.sin(t.shake * 60) * 4 : 0;
        c.fillStyle = t.used ? '#cfc6ef' : '#ffd23f'; c.strokeStyle = '#1a1028'; c.lineWidth = 3;
        c.fillRect(t.x + sx, t.y, t.w, t.h); c.strokeRect(t.x + sx, t.y, t.w, t.h);
        if (d.colors) emo(t.c, t.x + t.w / 2 + sx, t.y + t.h / 2 + 1, 26); else this.label(t.c, t.x + t.w / 2 + sx, t.y + t.h / 2 + 1, 'center', t.used ? '#8a80b0' : '#1a1028', 18);
      });
    }
    st.pops.forEach(p => { c.globalAlpha = 1 - p.t; this.label(p.text, p.x, p.y - p.t * 30, 'center', p.col, 13); c.globalAlpha = 1; });
    if (st.won) { c.fillStyle = `rgba(99,199,77,${Math.min(0.35, st.wonT)})`; c.fillRect(0, 0, W, H); this.label('BRAVO !', W / 2, H / 2, 'center', '#1a1028', 24 + Math.sin(st.wonT * 20) * 2); }
  },
  label(text, x, y, align, col, size) {
    const c = this.cx; c.font = (size || 12) + 'px "Press Start 2P", monospace'; c.textAlign = align || 'left'; c.textBaseline = 'middle';
    c.lineWidth = 4; c.strokeStyle = col === '#ffffff' ? '#1a1028' : '#ffffff'; c.lineJoin = 'round'; c.strokeText(text, x, y); c.fillStyle = col || '#1a1028'; c.fillText(text, x, y);
  }
};
function traceShape(shape, W, H) {
  const pts = [];
  if (shape === 'smiley') { const cx = W / 2, cy = H / 2, r = 72; for (let i = 0; i <= 28; i++) { const a = -Math.PI / 2 + i / 28 * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92]); } }
  else {
    const cy = H / 2 + 22;
    for (let i = 0; i <= 6; i++) { const a = Math.PI * 1.5 - i / 6 * Math.PI * 1.2; pts.push([62 + Math.cos(a) * 14, cy - 18 + Math.sin(a) * 14]); }
    for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push([68 + t * 164, cy - 4 + Math.abs(Math.sin(t * Math.PI * 2)) * 22 - (Math.abs(t - 0.5) < 0.06 ? 6 : 0)]); }
    for (let i = 0; i <= 6; i++) { const a = Math.PI * 0.7 + i / 6 * Math.PI * 1.1; pts.push([238 + Math.cos(a) * 14, cy - 18 + Math.sin(a) * 14]); }
  }
  return pts;
}
