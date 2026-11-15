// ================= COLLECTION DE SQUISHIES =================
// 40 modèles originaux (dessinés pour le jeu), du plus courant au légendaire.
const SQ_RARITY = [
  { n: 'Commun', col: '#c9c2e6', w: 0.62 },
  { n: 'Rare', col: '#5fb8ff', w: 0.27 },
  { n: 'Super rare', col: '#c77dff', w: 0.09 },
  { n: 'Légendaire', col: '#ffd23f', w: 0.02 }
];
// formes 12×12 : B corps, D ombre, L reflet, A/C accents, W blanc, K noir, P joues, M bouche
const SQ_SHAPES = {
  cat: ['.BB......BB.', '.BAB....BAB.', '.BBBBBBBBBB.', 'BBBBBBBBBBBB', 'BLBBBBBBBBBB', 'BBBKBBBBKBBB', 'BBBKBBBBKBBB', 'BPBBBMMBBBPB', 'BBBBBBBBBBBB', 'DBBBBBBBBBBD', '.DDDDDDDDDD.', '............'],
  bunny: ['..BB....BB..', '..BA....AB..', '..BA....AB..', '..BB....BB..', '.BBBBBBBBBB.', 'BLBBBBBBBBBB', 'BBBKBBBBKBBB', 'BPBBBMMBBBPB', 'BBBBBBBBBBBB', 'DBBBBBBBBBBD', '.DDDDDDDDDD.', '............'],
  bear: ['.AA......AA.', '.ABB....BBA.', '.BBBBBBBBBB.', 'BBBBBBBBBBBB', 'BLBBBBBBBBBB', 'BBBKBBBBKBBB', 'BBBBBCCBBBBB', 'BPBBCMMCBBPB', 'BBBBBCCBBBBB', 'DBBBBBBBBBBD', '.DDDDDDDDDD.', '............'],
  frog: ['.BBB....BBB.', 'BWKWB..BWKWB', 'BWWWBBBBWWWB', 'BBBBBBBBBBBB', 'BLBBBBBBBBBB', 'BBBBBBBBBBBB', 'BPBMBBBBMBPB', 'BBBBMMMMBBBB', 'BBBBBBBBBBBB', 'DBBBBBBBBBBD', '.DDDDDDDDDD.', '............'],
  panda: ['.KK......KK.', '.KKB....BKK.', '.BBBBBBBBBB.', 'BBBBBBBBBBBB', 'BKKBBBBBBKKB', 'BKWKBBBBKWKB', 'BKKBBBBBBKKB', 'BPBBBMMBBBPB', 'BBBBBBBBBBBB', 'DBBBBBBBBBBD', '.DDDDDDDDDD.', '............'],
  chick: ['.....A......', '....AA......', '..BBBBBBBB..', '.BBBBBBBBBB.', 'BLBBBBBBBBBB', 'BBBKBBBBKBBB', 'BPBBBCCBBBPB', 'BBBBBBCBBBBB', 'BBBBBBBBBBBB', 'DBBBBBBBBBBD', '.DDDDDDDDDD.', '............'],
  axolotl: ['............', 'A..BBBBBB..A', 'AABBBBBBBBAA', '.ABBBBBBBBA.', 'AABLBBBBBBAA', '.BBKBBBBKBB.', '.BPBBMMBBPB.', '.BBBBBBBBBB.', '.BBBBBBBBBB.', '.DBBBBBBBBD.', '..DDDDDDDD..', '............'],
  dino: ['....A.A.A...', '...AAAAAAA..', '..BBBBBBBBB.', '.BBBBBBBBBBB', 'BLBBBBBBBBBB', 'BBBKBBBBKBBB', 'BPBBBBBBBBPB', 'BBBBBMMBBBBB', 'BBBBBBBBBBBB', 'DBBBBBBBBBBD', '.DDDDDDDDDD.', '............'],
  unicorn: ['.....AA.....', '.....A......', '.CCBBBBBBB..', 'CCBBBBBBBBB.', 'CBLBBBBBBBBB', 'CBBKBBBBKBBB', '.BPBBBBBBBPB', '.BBBBBMMBBBB', '.BBBBBBBBBBB', '.DBBBBBBBBBD', '..DDDDDDDDD.', '............'],
  ghost: ['...BBBBBB...', '..BBBBBBBB..', '.BBBBBBBBBB.', '.BLBBBBBBBB.', '.BBKBBBBKBB.', '.BPBBBBBBPB.', '.BBBBMMBBBB.', '.BBBBBBBBBB.', '.BBBBBBBBBB.', '.BBBBBBBBBB.', '.B.BB.BB.BB.', '............'],
  octopus: ['...BBBBBB...', '..BBBBBBBB..', '.BLBBBBBBBB.', '.BBBBBBBBBB.', '.BBKBBBBKBB.', '.BPBBMMBBPB.', '.BBBBBBBBBB.', '.DBDBDBDBDB.', '.B.B.B.B.B..', 'B..B.B.B..B.', '............', '............'],
  strawberry: ['....AAAA....', '...AACCAA...', '..BBBBBBBB..', '.BBWBBBBWBB.', 'BBLBBBBBBBWB', 'BBBKBBBBKBBB', 'BWPBBBBBBPBB', 'BBBBBMMBBBWB', '.BWBBBBBBBB.', '..BBBBBWBB..', '...DDDDDD...', '............'],
  peach: ['.....CA.....', '....AA......', '..BBBBBBBB..', '.BBBBBDBBBB.', 'BLBBBBDBBBBB', 'BBBKBBBBKBBB', 'BPBBBBBBBBPB', 'BBBBBMMBBBBB', 'BBBBBBBBBBBB', '.DBBBBBBBBD.', '..DDDDDDDD..', '............'],
  avocado: ['....AAAA....', '...ABBBBA...', '..ABBBBBBA..', '..ABKBBKBA..', '.ABBPBBPBBA.', '.ABBBMMBBBA.', '.ABBBCCBBBA.', 'AABBCCCCBBAA', 'ABBBCCCCBBBA', 'ABBBBCCBBBBA', '.AABBBBBBAA.', '...AAAAAA...'],
  onigiri: ['.....BB.....', '....BBBB....', '...BBBBBB...', '..BLBBBBBB..', '..BKBBBBKB..', '.BBPBMMBPBB.', '.BBBBBBBBBB.', 'BBBAAAAAABBB', 'BBBAAAAAABBB', 'BBBAAAAAABBB', '.DDAAAAAADD.', '............'],
  toast: ['.DDDD..DDDD.', 'DBBBBDDBBBBD', 'DBLBBBBBBBBD', 'DBBBBBBBBBBD', '.DBKBBBBKBD.', '.DBPBMMBPBD.', '.DBBBBBBBBD.', '.DBBBBBBBBD.', '.DBBBBBBBBD.', '.DDDDDDDDDD.', '............', '............'],
  cupcake: ['....AWA.....', '...AAAAAA...', '..AAAAAAAA..', '.AALAAAAAAA.', '.AAKAAAAKAA.', '.APAAMMAAPA.', '.CCCCCCCCCC.', '..BCBCBCBC..', '..CBCBCBCB..', '..BCBCBCBC..', '...DDDDDD...', '............'],
  boba: ['.....K......', '....K.......', '..WWWWWWWW..', '..BBBBBBBB..', '..BLBBBBBB..', '..BKBBBBKB..', '..BPBMMBPB..', '..BBBBBBBB..', '..BKBKBKBB..', '..BBKBKBKB..', '...DDDDDD...', '............'],
  icecream: ['...AAAAAA...', '..AAWAAAAA..', '.AAAAAAAAAA.', '.AKAAAAAAKA.', '.APAAMMAAPA.', '.AAAAAAAAAA.', '..BBBBBBBB..', '...BCBCBC...', '...CBCBCB...', '....BCBC....', '.....BB.....', '............'],
  cloud: ['............', '...BBB.BB...', '..BBBBBBBB..', '.BBBBBBBBBB.', 'BBLBBBBBBBBB', 'BBBKBBBBKBBB', 'BPBBBMMBBBPB', 'BBBBBBBBBBBB', '.DDDDDDDDDD.', '............', '............', '............'],
  star: ['.....BB.....', '.....BB.....', '....BBBB....', 'BBBBBBBBBBBB', '.BBKBBBBKBB.', '..BPBMMBPB..', '..BBBBBBBB..', '.BBBBBBBBBB.', '.BBB....BBB.', '.BB......BB.', '............', '............'],
  mushroom: ['...AAAAAA...', '.AAWAAAAWAA.', 'AAAAAAWAAAAA', 'AWAAAAAAAAWA', 'AAAAAAAAAAAA', '..BBBBBBBB..', '..BKBBBBKB..', '..BPBMMBPB..', '..BBBBBBBB..', '..DBBBBBBD..', '...DDDDDD...', '............'],
  penguin: ['...BBBBBB...', '..BBBBBBBB..', '.BBWWWWWWBB.', '.BWKWWWWKWB.', '.BWPWCCWPWB.', '.BWWWWWWWWB.', 'BBWWWWWWWWBB', 'BBWWWWWWWWBB', '.BWWWWWWWWB.', '..BBBBBBBB..', '..CC....CC..', '............']
};
// n nom, s forme, r rareté, c couleurs [corps, accent, accent 2], fx : paillettes / arc-en-ciel
const SQUISHIES = [
  ['Chat Guimauve', 'cat', 0, ['#ffb3d6', '#ff7fb0', '#ffffff']],
  ['Lapin Nuage', 'bunny', 0, ['#f4f0ff', '#ffb3d6', '#ffffff']],
  ['Ourson Miel', 'bear', 0, ['#f2b25c', '#c98236', '#ffe0a8']],
  ['Grenouille Bonbon', 'frog', 0, ['#8ee07a', '#4ea84a', '#ffffff']],
  ['Poussin Citron', 'chick', 0, ['#ffe066', '#ff9a3c', '#ff9a3c']],
  ['Fraise Câline', 'strawberry', 0, ['#ff5d73', '#5fbf4a', '#2f7a36']],
  ['Pêche Douce', 'peach', 0, ['#ffb894', '#6cc25a', '#8a5a2c']],
  ['Onigiri Rigolo', 'onigiri', 0, ['#fbfbf6', '#2c3a2e', '#2c3a2e']],
  ['Tartine Toute Molle', 'toast', 0, ['#ffe2a8', '#c98a45', '#c98a45']],
  ['Boba Lait', 'boba', 0, ['#e8c9a0', '#5a3a26', '#fff6e8']],
  ['Nuage Dodo', 'cloud', 0, ['#cfe9ff', '#9fd0ff', '#ffffff']],
  ['Champi Pois', 'mushroom', 0, ['#fff3e0', '#ff5d5d', '#ffffff']],
  ['Cupcake Myrtille', 'cupcake', 0, ['#f2e8ff', '#9fa8ff', '#6c78e8']],
  ['Glace Vanille', 'icecream', 0, ['#e6a95c', '#fff6dc', '#c98236']],
  ['Cochon Rose', 'bear', 0, ['#ffc2d4', '#ff94b4', '#ff94b4']],
  ['Hamster Joufflu', 'bear', 0, ['#f5d8b0', '#e8a878', '#fff2e0']],
  ['Renard Roux', 'cat', 0, ['#ff9a4a', '#ffffff', '#ffffff']],
  ['Fantôme Timide', 'ghost', 0, ['#f6f4ff', '#d8d0ff', '#ffffff']],
  ['Pingouin Glaçon', 'penguin', 0, ['#3c4a78', '#ffffff', '#ffb03c']],
  ['Avocat Zen', 'avocado', 0, ['#dff2a0', '#4f8a3a', '#8a5a2c']],
  ['Panda Bambou', 'panda', 1, ['#ffffff', '#2a2a3a', '#ffffff']],
  ['Axolotl Rose', 'axolotl', 1, ['#ffc2dd', '#ff6fa8', '#ffffff']],
  ['Dino Menthe', 'dino', 1, ['#9ff0c8', '#4fc08a', '#ffffff']],
  ['Pieuvre Lilas', 'octopus', 1, ['#c9a8ff', '#a07ae8', '#ffffff']],
  ['Étoile Filante', 'star', 1, ['#ffe066', '#ffb03c', '#ffffff']],
  ['Chat Matcha', 'cat', 1, ['#a8d88a', '#6aa84a', '#ffffff']],
  ['Lapin Chocolat', 'bunny', 1, ['#a8744a', '#ffc2d4', '#ffffff']],
  ['Boba Taro', 'boba', 1, ['#c9a8e8', '#4a2a5a', '#fff6e8']],
  ['Grenouille Fraise', 'frog', 1, ['#ff9ab8', '#e8607e', '#ffffff']],
  ['Glace Pistache', 'icecream', 1, ['#e6a95c', '#b8e89a', '#c98236']],
  ['Fantôme Citrouille', 'ghost', 1, ['#ffb05c', '#ff8a2c', '#ffffff']],
  ['Ourson Myrtille', 'bear', 1, ['#9fb8ff', '#6c84e8', '#dfe8ff']],
  ['Licorne Pastel', 'unicorn', 2, ['#fff4fb', '#ffd23f', '#c9a8ff'], 'rainbow'],
  ['Chat Galaxie', 'cat', 2, ['#3a3a8a', '#ff9fd8', '#ffffff'], 'stars'],
  ['Axolotl Doré', 'axolotl', 2, ['#ffd86a', '#ff9a3c', '#ffffff'], 'stars'],
  ['Dino Cristal', 'dino', 2, ['#bff4ff', '#7fd8ff', '#ffffff'], 'stars'],
  ['Nuage Arc-en-ciel', 'cloud', 2, ['#ffffff', '#ff9fd8', '#ffffff'], 'rainbow'],
  ['Panda Sakura', 'panda', 2, ['#ffe8f0', '#e8608a', '#ffffff'], 'stars'],
  ['Licorne Dorée', 'unicorn', 3, ['#ffe9a0', '#ffffff', '#ff8fc8'], 'gold'],
  ['Étoile Cosmique', 'star', 3, ['#4a3a9a', '#ffd23f', '#ffffff'], 'gold']
].map(([n, s, r, c, fx], id) => ({ id, n, s, r, c, fx }));
const SQ_CACHE = {};
function squishyCanvas(id, silhouette) {
  const key = id + (silhouette ? 's' : ''); if (SQ_CACHE[key]) return SQ_CACHE[key];
  const q = SQUISHIES[id] || SQUISHIES[0], [cv, c] = mkCanvas(14, 14), rows = SQ_SHAPES[q.s];
  const [b, a, a2] = q.c, pal = { B: b, D: shade(b, -0.22), L: shade(b, 0.45), A: a, C: a2, W: '#ffffff', K: '#1d1626', P: '#ff7fa8', M: '#7a2836' };
  if (q.s === 'toast') pal.D = a;
  { const n = parseInt(b.slice(1), 16), lum = ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11); if (lum < 110 && q.s !== 'penguin') { pal.K = '#ffffff'; pal.M = '#ff9fc8'; } }
  rows.forEach((r, y) => { for (let x = 0; x < 12; x++) { const ch = r[x]; if (ch === '.') continue; c.fillStyle = silhouette ? '#2a1f44' : (pal[ch] || b); c.fillRect(x + 1, y + 1, 1, 1); } });
  if (!silhouette) {
    // petits plus pour les modèles rares
    const on = (x, y) => { const r = rows[y - 1]; return r && r[x - 1] && r[x - 1] !== '.'; };
    if (q.fx === 'stars' || q.fx === 'gold') [[3, 5], [9, 4], [10, 9], [4, 10], [7, 3]].forEach(([x, y]) => { if (on(x, y)) { c.fillStyle = q.fx === 'gold' ? '#fff6a0' : '#ffffff'; c.fillRect(x, y, 1, 1); } });
    if (q.fx === 'rainbow' || q.fx === 'gold') { const rb = ['#ff6f7a', '#ffb03c', '#ffe066', '#7fe08a', '#7fc8ff', '#c99aff']; for (let x = 2; x <= 12; x++) { const y = q.s === 'cloud' ? 9 : 11; if (on(x, y)) { c.fillStyle = rb[(x - 2) % 6]; c.fillRect(x, y, 1, 1); } } }
  }
  if (!silhouette) shadePass(cv, c); outlinePass(cv, c);
  SQ_CACHE[key] = cv; return cv;
}
// collection (gardée sur l'appareil)
const SqCol = {
  get() { const a = store.get('nds_squish', []); return Array.isArray(a) ? a : []; },
  count() { return this.get().filter(n => n > 0).length; },
  add(id) { const a = this.get(); while (a.length < SQUISHIES.length) a.push(0); const isNew = !a[id]; a[id] = (a[id] || 0) + 1; store.set('nds_squish', a); return isNew; },
  // tirage : rareté pondérée, et un petit coup de pouce vers ceux qu'on n'a pas encore
  roll() {
    let x = Math.random(), r = 0; for (; r < SQ_RARITY.length - 1; r++) { if (x < SQ_RARITY[r].w) break; x -= SQ_RARITY[r].w; }
    const have = this.get(), tier = SQUISHIES.filter(q => q.r === r), fresh = tier.filter(q => !have[q.id]);
    return (fresh.length && Math.random() < 0.5 ? pick(fresh) : pick(tier)).id;
  }
};
