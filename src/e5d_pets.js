// ================= LES COMPAGNONS TROP MIGNONS (à trouver en fouillant) =================
// Des petits personnages originaux, clins d'œil à la pop culture : un dragonnet, un chat ninja,
// un fantôme rigolo, un hamster astronaute et une licorne-chiot. Ils te suivent partout.
PETS.push(
  { k: 'dragon', px: 'dragon', e: '🐉', n: 'Mochi le dragonnet', scare: 'UN DRAGON ?! Il crache du feu !', hi: 'Pfff ! (petite fumée)' },
  { k: 'ninja', px: 'ninja', e: '🐈‍⬛', n: 'Ninja-Minou', scare: 'Un chat NINJA ?! Hiyaaa !', hi: 'Miaou-hiya !' },
  { k: 'ghost', px: 'ghost', e: '👻', n: 'Boubou le fantôme', scare: 'BOUUUH ! Un fantôme !', hi: 'Bouh… (tout doux)' },
  { k: 'astro', px: 'astro', e: '🐹', n: 'Cosmo le hamster astronaute', scare: 'Un hamster… de l’ESPACE ?!', hi: 'Bip bip ! Couic !' },
  { k: 'unicorn', px: 'unicorn', e: '🦄', n: 'Paillettes la licorne-chiot', scare: 'Une licorne ?! Elle va m’embrocher !', hi: 'Ouaf ! ✨' }
);
const CUTE_PETS = () => PETS.filter(p => p.px);
function cutePetGive(P, def) {
  def = def || pick(CUTE_PETS());
  P.pet = { i: PETS.indexOf(def), e: def.e, n: def.n, charges: PET_CHARGES, x: P.x - 10, y: P.y + 2, hop: 0, t: 0, face: 1, blinkT: 2, emoteT: 4 };
  return def;
}
// trouvé en fouillant un meuble
function cutePetFound(P, x, y) {
  const def = cutePetGive(P); const p = P.pet; p.x = x; p.y = y; p.jump = 0; p.joy = 1.2;
  AU.sfx('kawaii', 0.7); AU.sfx('found', 0.5); hop(P, 110);
  for (let i = 0; i < 10; i++) part(x, y - 8, 'heart', { vx: rand(-40, 40), vy: rand(-70, -30), g: 40, life: rand(0.8, 1.3), col: pick(['#ff6fb5', '#ff9fd8', '#ffd23f']) });
  sparkle(x, y - 8, 16);
  UI.banner('🐾 ' + def.n + ' t’a trouvé·e ! Il te suit partout… et fera fuir le prof 3 fois.');
  cue(x, y - 26, 'word', def.hi, { col: '#ff9fd8', pop: true, life: 1.6 });
  UI.hudSig = null;
  return def;
}
// petites humeurs : il te fait des cœurs quand tu ne bouges plus
function cutePetMood(A, dt) {
  const p = A.pet; if (!p) return; const def = PETS[p.i]; if (!def || !def.px) return;
  if (p.blinkT == null) p.blinkT = 2; if (p.emoteT == null) p.emoteT = 4; if (p.face == null) p.face = 1;
  p.blinkT -= dt; if (p.blinkT < -0.13) p.blinkT = rand(2.2, 4.5);
  if (p.joy > 0) p.joy -= dt;
  if (Math.abs(p.vx || 0) > 6) p.face = p.vx > 0 ? 1 : -1;
  if (p.flip > 0) p.flip -= dt;
  p.emoteT -= dt;
  if (p.emoteT <= 0) {
    p.emoteT = rand(5, 9);
    if (!A.moving && A === G.P && G.mode === 'play' && dist(p.x, p.y, A.x, A.y) < 40) {
      if (def.px === 'ninja' && Math.random() < 0.6) { p.flip = 0.55; cue(p.x, p.y - 22, 'word', 'HIYA !', { col: '#ffffff', pop: true, small: true, life: 0.8 }); }
      else { part(p.x, p.y - 16, 'heart', { vx: rand(-8, 8), vy: -24, g: 0, life: 1.2, col: '#ff6fb5' }); p.joy = 0.6; }
      if (Math.random() < 0.4) AU.sfx('kawaii', 0.18);
    }
  }
  // traînées : paillettes de la licorne, petites étoiles du fantôme
  if (p.moving && Math.random() < dt * 9) {
    if (def.px === 'unicorn') part(p.x - p.face * 5, p.y - 6, 'spark', { vx: -p.face * rand(5, 20), vy: rand(-20, -5), life: rand(0.4, 0.8), col: pick(['#ff6f91', '#ffd23f', '#63c74d', '#3d7bff', '#b06fff']), size: 1 });
    if (def.px === 'ghost') part(p.x - p.face * 4, p.y - 7, 'spark', { vx: -p.face * 6, vy: -4, life: 0.5, col: '#e8e0ff', size: 1 });
  }
}
// ---------- dessin (pixel art, coordonnées monde : pieds en p.x, p.y) ----------
function drawCutePet(c, p, def, alpha) {
  const t = p.t, f = p.face || 1, mv = p.moving || p.jump > 0, blink = p.blinkT < 0;
  let x = p.x, y = p.y, rot = 0, sx = 1, sy = 1;
  // animations propres à chaque animal
  if (def.px === 'dragon' || def.px === 'ghost') y -= 4 + Math.sin(t * (def.px === 'ghost' ? 2.6 : 5)) * 1.6;   // ils volent
  else if (def.px === 'astro') { const ph = (t * (mv ? 2.2 : 1.1)) % 1; y -= Math.sin(ph * Math.PI) * (mv ? 7 : 3); sy = ph < 0.08 ? 0.85 : 1; sx = 2 - sy; }   // bonds en apesanteur
  else { const ph = Math.abs(Math.sin(t * (mv ? 12 : 2.4))); y -= mv ? ph * 2.5 : (Math.sin(t * 2.4) > 0.55 ? 1 : 0); }   // petite respiration, sans flou
  if (p.joy > 0) { y -= Math.abs(Math.sin(p.joy * 14)) * 3; }
  if (p.flip > 0) rot = (1 - p.flip / 0.55) * Math.PI * 2 * f;
  // ombre
  c.fillStyle = 'rgba(10,6,20,.22)'; c.beginPath(); c.ellipse(p.x, p.y, 5, 1.8, 0, 0, 7); c.fill();
  c.save(); c.globalAlpha = alpha * (def.px === 'ghost' ? 0.93 : 1); c.translate(Math.round(x), Math.round(y)); if (rot) { c.translate(0, -6); c.rotate(rot); c.translate(0, 6); } c.scale(sx, sy);
  const R = (dx, dy, w, h, col) => { c.fillStyle = col; c.fillRect(f > 0 ? dx : -dx - w, dy, w, h); };
  const eyes = (ex, ey, col) => { if (blink) { R(ex, ey + 1, 2, 1, col); R(ex + 4, ey + 1, 2, 1, col); } else { R(ex, ey, 2, 2, col); R(ex + 4, ey, 2, 2, col); R(ex, ey, 1, 1, '#ffffff'); R(ex + 4, ey, 1, 1, '#ffffff'); } };
  const blush = (bx, by) => { R(bx, by, 2, 1, '#ff8fb5'); R(bx + 7, by, 2, 1, '#ff8fb5'); };
  switch (def.px) {
    case 'dragon': {
      const G1 = '#7fe0a8', G2 = '#4fb880', flap = Math.sin(t * (mv ? 22 : 9)) > 0 ? 0 : 2;
      R(-8, -10 + flap, 3, 3, '#ffb3d1'); R(-9, -12 + flap, 2, 2, '#ffb3d1'); R(-7, -8 + flap, 2, 1, '#e88fb5');   // l'aile
      R(-7, -4, 2, 2, G1); R(-8, -5, 1, 1, G1); R(-9, -6, 1, 1, '#ffb3d1');   // la queue
      R(-5, -11, 10, 9, G1); R(-4, -12, 8, 1, G1); R(-4, -2, 8, 1, G2); R(-5, -4, 10, 2, G2);
      R(-2, -6, 5, 4, '#fff2c8'); R(-3, -13, 1, 2, '#fff2c8'); R(2, -13, 1, 2, '#fff2c8');   // ventre, cornes
      R(-4, -1, 2, 1, G2); R(2, -1, 2, 1, G2);
      eyes(-3, -9, '#2a1a2a'); blush(-5, -6); R(0, -6, 1, 1, '#2a1a2a');
      if (p.joy > 0 || Math.sin(t * 0.7) > 0.97) { R(6, -8, 2, 2, 'rgba(255,255,255,0.8)'); R(8, -10, 2, 2, 'rgba(255,255,255,0.5)'); }   // une petite fumée
      break;
    }
    case 'ninja': {
      const K1 = '#2a2433', K2 = '#4a4058', tail = Math.round(Math.sin(t * (mv ? 10 : 3)) * 2), leg = mv ? Math.round(Math.sin(t * 16)) : 0;
      R(-7, -9 + tail, 2, 6, K1); R(-8, -10 + tail, 2, 2, K1);   // la queue qui ondule
      R(-4, -6, 8, 5, K1); R(-3, -1, 2, 1 + (leg > 0 ? 1 : 0), K1); R(1, -1, 2, 1 + (leg < 0 ? 1 : 0), K1);
      R(-5, -13, 10, 8, K1); R(-5, -15, 2, 2, K1); R(3, -15, 2, 2, K1); R(-4, -14, 1, 1, '#ff8fb5'); R(4, -14, 1, 1, '#ff8fb5');   // tête, oreilles
      R(-5, -12, 10, 2, '#e43b44'); const rib = Math.round(Math.sin(t * 14) * 1.5); R(-8, -12 + rib, 3, 1, '#e43b44'); R(-10, -11 - rib, 2, 1, '#e43b44');   // le bandeau
      if (blink) { R(-3, -9, 2, 1, '#c8ff6a'); R(1, -9, 2, 1, '#c8ff6a'); } else { R(-3, -10, 2, 2, '#c8ff6a'); R(1, -10, 2, 2, '#c8ff6a'); R(-2, -10, 1, 2, '#111'); R(2, -10, 1, 2, '#111'); }
      R(-1, -7, 2, 1, '#ff8fb5'); R(-4, -7, 1, 1, K2); R(3, -7, 1, 1, K2); R(-2, -5, 4, 1, K2);
      break;
    }
    case 'ghost': {
      const W1 = '#f6f4ff', W2 = '#d8d0ff', wav = Math.floor(t * 6) % 2;
      R(-5, -13, 10, 11, W1); R(-4, -14, 8, 1, W1); R(-6, -11, 1, 7, W1); R(5, -11, 1, 7, W1);
      for (let i = -5; i < 5; i += 3) R(i + wav, -2, 2, 2, W1);   // le bas ondulé
      R(-5, -3, 10, 1, W2); R(4, -12, 1, 8, W2);
      R(2, -15, 3, 2, '#ff8fb5'); R(3, -14, 1, 1, '#ffffff');   // le nœud
      eyes(-3, -10, '#3a2a4a'); blush(-5, -7);
      R(-1, -7, 2, 1 + (p.joy > 0 ? 1 : 0), '#3a2a4a');
      const arm = mv ? 0 : Math.round(Math.sin(t * 2) * 1); R(-8, -8 + arm, 2, 2, W1); R(6, -8 - arm, 2, 2, W1);
      break;
    }
    case 'astro': {
      const O1 = '#f2a33a', O2 = '#d07a2a', C1 = '#fff2c8';
      R(-5, -9, 10, 8, O1); R(-4, -10, 8, 1, O1); R(-4, -1, 8, 1, O2); R(-3, -6, 6, 4, C1);   // corps
      R(-4, -1, 2, 1, '#ff9fd8'); R(2, -1, 2, 1, '#ff9fd8');   // petites pattes
      R(-4, -12, 2, 2, O2); R(2, -12, 2, 2, O2);   // oreilles
      eyes(-3, -8, '#2a1a2a'); R(-5, -5, 2, 2, C1); R(3, -5, 2, 2, C1); R(0, -5, 1, 1, '#ff6f91');   // joues gonflées, nez
      c.strokeStyle = 'rgba(191,239,255,0.9)'; c.lineWidth = 1; c.beginPath(); c.arc(0, -7, 7.5, 0, 7); c.stroke();   // le casque
      c.fillStyle = 'rgba(191,239,255,0.18)'; c.beginPath(); c.arc(0, -7, 7, 0, 7); c.fill();
      R(-4, -12, 2, 1, '#ffffff'); R(-5, -11, 1, 2, '#ffffff');   // reflet
      R(0, -17, 1, 3, '#c8d0dc'); R(-1, -18, 3, 1, (Math.floor(t * 3) % 2) ? '#ff3a5a' : '#ff9fb0');   // antenne qui clignote
      break;
    }
    case 'unicorn': {
      const W1 = '#ffffff', W2 = '#e8e0f0', wag = Math.round(Math.sin(t * (mv ? 20 : 8)) * 1.5), leg = mv ? Math.round(Math.sin(t * 16)) : 0;
      const RB = ['#ff6f91', '#ffb347', '#ffe66d', '#7fe0a8', '#7fb8ff', '#c79bff'];
      for (let i = 0; i < 3; i++) R(-9 + wag, -8 + i, 3, 1, RB[i * 2]);   // la queue arc-en-ciel qui remue
      R(-6, -7, 11, 5, W1); R(-6, -3, 11, 1, W2); R(-5, -2, 2, 2 - (leg > 0 ? 1 : 0), W1); R(2, -2, 2, 2 - (leg < 0 ? 1 : 0), W1);
      R(0, -13, 8, 7, W1); R(1, -14, 6, 1, W1); R(6, -9, 3, 3, W1); R(8, -8, 1, 1, '#ff8fb5');   // tête, museau
      for (let i = 0; i < 6; i++) R(-1 + (i % 2), -14 + i, 2, 1, RB[i]);   // crinière
      R(1, -12, 2, 4, W2); R(1, -9, 2, 1, '#ffb3d1');   // oreille tombante
      R(4, -17, 1, 3, '#ffd23f'); R(5, -18, 1, 2, '#ffe66d');   // la corne dorée
      if (blink) R(4, -10, 2, 1, '#3a2a4a'); else { R(4, -11, 2, 2, '#3a2a4a'); R(4, -11, 1, 1, '#ffffff'); }
      R(3, -8, 2, 1, '#ff8fb5');
      break;
    }
  }
  c.restore();
}
