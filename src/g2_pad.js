// ================= LES GROS BOUTONS D'ACTION (rétro, toujours au même endroit) =================
// Quatre boutons fixes en bas à droite : CLÉ, ACTION / FOUILLER, CACHER.
// Ils sont toujours là ; grisés quand ils ne servent à rien ici, en couleur quand on peut s'en servir.

// ---------- les dessins (pixel art 14×14, contour ajouté automatiquement) ----------
const PAD_ART = {
  loupe: [[
    '...yyyyy......',
    '..yYYYYYy.....',
    '.yYbbbbbYy....',
    'yYbwwbbbbYy...',
    'yYbwbbbbbYy...',
    'yYbbbbbbbYy...',
    'yYbbbbbbbYy...',
    'yYbbbbbbbYy...',
    '.yYbbbbbYy....',
    '..yYYYYYyhh...',
    '...yyyyy.hhh..',
    '..........hhh.',
    '...........hhh',
    '............hh'], { y: '#c98a12', Y: '#ffd23f', b: '#9fe0ff', w: '#ffffff', h: '#7a4a20' }],
  buisson: [[
    '...gg...gg....',
    '..gGGg.gGGg.g.',
    '.gGlGGgGlGGgGg',
    'gGGGGGGGGGGGGg',
    'gGdGGGGGGGGdGg',
    '.gGwwkGGwwkGg.',
    'gGGwwkGGwwkGGg',
    'gGdGGGGGGGGGdg',
    '.gGGGGlGGGGGg.',
    'gGGlGGGGGGlGGg',
    'gGGGGGGdGGGGGg',
    '.ggGGGGGGGGgg.',
    '..gggggggggg..',
    '....bb..bb....'], { g: '#2e8b3a', G: '#5cc94e', l: '#9be86a', d: '#3fa83e', w: '#ffffff', k: '#1a1028', b: '#7a4a20' }],
  sortir: [[
    '......ww......',
    '.....wwww.....',
    '....wwwwww....',
    '...wwwwwwww...',
    '..wwwwwwwwww..',
    '.....wwww.....',
    '.....wwww.....',
    '.....wwww.....',
    '.bbb.wwww.bbb.',
    '.bBb......bBb.',
    '.bBBBBBBBBBBb.',
    '.bBBBBBBBBBBb.',
    '.bbbbbbbbbbbb.',
    '..............'], { w: '#ffffff', b: '#7a4a20', B: '#b8783a' }],
  vague: [[
    '...o.....o....',
    '..o.o...o.o...',
    '...o.....o....',
    '......o.......',
    '.....o.o......',
    '......o.......',
    '..............',
    '.b...b...b...b',
    'bBb.bBb.bBb.bB',
    'BBBBBBBBBBBBBB',
    'BBlBBBBBlBBBBB',
    'BBBBBBBBBBBBBB',
    'bbbbbbbbbbbbbb',
    '..............'], { o: '#ffffff', b: '#2a7ad0', B: '#4fb0f0', l: '#bfefff' }],
  cle: [[
    '..............',
    '..............',
    '..............',
    '.YYYY.........',
    'YyyyyY........',
    'Yy..yYYYYYYYYY',
    'Yy..yyyyyyyyyY',
    'Yy..yYYYYYyYyY',
    'YyyyyY....Y.Y.',
    '.YYYY.........',
    '..............',
    '..............',
    '..............',
    '..............'], { Y: '#ffd23f', y: '#c98a12' }],
  main: [[
    '......ww......',
    '...ww.ww.ww...',
    '...ww.ww.ww...',
    '...ww.ww.ww.ww',
    '...ww.ww.ww.ww',
    '...wwwwwwww.ww',
    '...wwwwwwwwwww',
    'ww.wwwwwwwwwww',
    'wwwwwwwwwwwww.',
    '.wwwwwwwwwwww.',
    '..wwwwwwwwwww.',
    '...wwwwwwwww..',
    '....wwwwwww...',
    '....wwwwwww...'], { w: '#ffffff' }],
  sablier: [[
    '.kkkkkkkkkkkk.',
    '..wwwwwwwwww..',
    '..wyyyyyyyyw..',
    '...wyyyyyyw...',
    '....wyyyyw....',
    '.....wyyw.....',
    '......ww......',
    '......yy......',
    '.....w..w.....',
    '....w....w....',
    '...w..yy..w...',
    '..w.yyyyyy.w..',
    '..wwwwwwwwww..',
    '.kkkkkkkkkkkk.'], { k: '#7a4a20', w: '#ffffff', y: '#ffd23f' }],
};
const PAD_IMG = new Map();
function padIcon(name) {
  let c = PAD_IMG.get(name); if (c) return c;
  const [rows, pal] = PAD_ART[name], W = 16, H = 16, px = new PixCtx(W, H);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { px.fillStyle = pal[ch]; px.fillRect(x + 1, y + 1, 1, 1); } }));
  pixPasses(px.d, W, H);
  const [cv, x] = mkCanvas(W, H), id = x.createImageData(W, H); id.data.set(px.d); x.putImageData(id, 0, 0);
  PAD_IMG.set(name, cv); return cv;
}

// ---------- quelle action va sur quel bouton ----------
const PAD_ORDER = ['key', 'act', 'search', 'hide'];   // grille 2×2 : en bas à droite, CACHER (le bouton panique)
const PAD_DEF = {
  search: { lab: 'FOUILLER', ic: 'loupe', name: 'Fouiller' },
  hide: { lab: 'CACHER', ic: 'buisson', name: 'Se cacher' },
  key: { lab: 'CLÉ', ic: 'cle', name: 'Clé : fermer ou ouvrir une porte' },
  act: { lab: 'ACTION', ic: 'main', name: 'Action' },
};
const PAD_KEY_IDS = new Set(['lock', 'unlock', 'openKey', 'lockedDoor', 'tunlock', 'tkeys', 'nokey', 'ccFree', 'free', 'stairLocked']);
function actCat(id) {
  if (id === 'search' || id === 'tcheck') return 'search';
  if (id === 'hide' || id === 'unhide' || id === 'pdive' || id === 'psurface') return 'hide';
  if (PAD_KEY_IDS.has(id)) return 'key';
  return 'act';
}
// le mot écrit sur le bouton (8 lettres au plus)
const ACT_SHORT = {
  task: 'TÂCHE', exit: 'FILER !', secretGo: 'FILER !', small: 'FILER !', locked: 'TÂCHES', gateLocked: 'FERMÉ', gateTwo: 'À DEUX', gag: 'POUSSER',
  pclimb: 'GRIMPER', pjump: 'SAUTER', pdown: 'RETOUR', power: 'COUPER', alarm: 'ALARME', plan: 'PLAN', stair: 'ESCALIER', stairUp: 'ESCALIER', stairNo: 'FERMÉ',
  grab: 'ATTRAPE', shout: 'CRIER', knock: 'TOC TOC', unhide: 'SORTIR', pdive: 'PLONGER', psurface: 'REMONTER',
  lock: 'FERMER', unlock: 'OUVRIR', openKey: 'OUVRIR', lockedDoor: 'FERMÉ', tunlock: 'OUVRIR', tkeys: 'CLÉS', nokey: 'FERMÉ', ccFree: 'LIBÉRER', free: 'LIBÉRER', stairLocked: 'FERMÉ',
};
// actions « pour info » (on explique pourquoi ça ne marche pas) : bouton allumé mais sans éclat
const PAD_INFO = new Set(['locked', 'gateLocked', 'gateTwo', 'lockedDoor', 'nokey', 'stairNo', 'stairLocked']);

const PAD = {
  els: null, best: {}, sig: {},
  init() {
    if (this.els) return;
    this.els = {};
    for (const c of PAD_ORDER) {
      const b = document.querySelector('#padGrid .pb[data-c="' + c + '"]'); if (!b) continue;
      const cv = b.querySelector('canvas'); cv.width = 16; cv.height = 16;
      this.els[c] = { b, cv, x: cv.getContext('2d'), lab: b.querySelector('b'), bd: b.querySelector('.bd'), pg: b.querySelector('.pg'), ic: '' };
      b.addEventListener('pointerdown', e => {
        e.stopPropagation(); e.preventDefault();
        const a = this.best[c];
        if (!a || a.id === 'busy') { b.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'none' }], 160); return; }
        doAction(a); UI.hudSig = null; this.sig = {};
      });
    }
  },
  // appelé par le HUD à chaque changement d'actions possibles
  update(acts) {
    this.init(); if (!this.els) return;
    const A = G.net && G.net.role === 'teacher' ? G.T : G.P, best = {};
    const busy = acts[0] && acts[0].id === 'busy' ? acts[0] : null;
    if (busy) best[(A && A.busy && A.busy.cat) || 'act'] = busy;
    else acts.forEach(a => { const c = actCat(a.id); if (!best[c]) best[c] = a; });
    this.best = best;
    const top = busy ? null : acts[0], hotC = top && !PAD_INFO.has(top.id) ? actCat(top.id) : null;
    for (const c of PAD_ORDER) {
      const E = this.els[c]; if (!E) continue;
      const a = best[c], D = PAD_DEF[c];
      let ic = D.ic, lab = D.lab, badge = '', st = a ? (PAD_INFO.has(a.id) ? 'info' : 'on') : 'off';
      if (a) {
        if (a.id === 'busy') ic = 'sablier';   // en cours : sablier + barre de progression
        else {
          if (a.id === 'unhide' || a.id === 'psurface') ic = 'sortir';
          else if (a.id === 'pdive') ic = 'vague';
          lab = ACT_SHORT[a.id] || D.lab;
          if (c === 'act' || c === 'key' || PAD_INFO.has(a.id)) badge = a.icon || '';
          if (c === 'search' && a.sub === '✨') badge = '✨';
        }
      }
      const pg = a && a.progress != null ? Math.round(a.progress * 100) : -1;
      const sig = [st, ic, lab, badge, pg, c === hotC].join('|');
      if (this.sig[c] === sig) continue; this.sig[c] = sig;
      E.b.classList.toggle('off', st === 'off'); E.b.classList.toggle('info', st === 'info'); E.b.classList.toggle('hot', c === hotC);
      if (E.ic !== ic) { E.ic = ic; E.x.clearRect(0, 0, 16, 16); E.x.drawImage(padIcon(ic), 0, 0); }
      if (E.lab.textContent !== lab) E.lab.textContent = lab;
      if (E.bd.textContent !== badge) E.bd.textContent = badge;
      E.pg.style.width = pg >= 0 ? pg + '%' : '0';
      E.b.setAttribute('aria-label', a ? a.label + (a.sub ? ' (' + a.sub + ')' : '') : D.name + ' (rien ici)');
    }
    // la phrase complète de l'action la plus utile, au-dessus des boutons
    const tip = $('padTip'), t = busy ? busy.label + ' · bouge pour annuler' : top ? top.icon + ' ' + top.label + (top.sub ? ' · ' + top.sub : '') : '';
    if (tip) { setTxt(tip, t); hideEl(tip, !t); }
  },
};
