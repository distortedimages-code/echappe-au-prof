// ================= TÂCHES DES SORTIES SCOLAIRES (piscine, musée) =================
Object.assign(TASKDEFS, {
  canards: { name: 'Lâcher des canards dans le bassin', icon: '🦆', type: 'tap', target: '🦆', n: 6, pops: ['Coin !', 'Plouf !', 'Coin coin !'], decor: '🌊', hint: 'Tape sur les canards pour les lancer dans l’eau !', noise: { r: 4, w: 'coin coin !' } },
  bouee: { name: 'Gonfler une bouée licorne', icon: '🦄', type: 'hold', grow: '🦄', fail: 'PSCHHH !', hint: 'Maintiens pour gonfler, lâche dans la zone verte !', noise: { r: 4, w: 'fffff' } },
  maillot: { name: 'Mettre un maillot rigolo sur la chaise', icon: '🩲', type: 'drag', obj: '🩲', n: 1, target: '🪑', done: 'Hihi !', hint: 'Glisse le maillot sur la chaise du maître nageur !' },
  frites: { name: 'Ranger les frites par couleur', icon: '🌈', type: 'order', colors: true, hint: 'Tape les frites en mousse dans l’ordre de l’arc-en-ciel : rouge, orange, jaune, vert, bleu, violet.' },
  plouf: { name: 'Écrire PLOUF sur la buée du miroir', icon: '✏️', type: 'order', word: 'PLOUF', hint: 'Tape les lettres dans l’ordre : P-L-O-U-F' },
  tchapeau: { name: 'Mettre un chapeau au dinosaure', icon: '🎩', type: 'drag', obj: '🎩', n: 1, target: '🦖', done: 'Trop chic !', hint: 'Glisse le chapeau sur la tête du dinosaure !' },
  poussiere: { name: 'Dépoussiérer les fossiles', icon: '🪶', type: 'tap', target: '🪶', n: 6, pops: ['Fffft !', 'Atchoum !', 'Pfff !'], decor: '🦴', hint: 'Tape sur le plumeau pour faire voler la poussière !', noise: { r: 3, w: 'ATCHOUM !' } },
  ours: { name: 'Donner des bonbons à l’animal empaillé', icon: '🍬', type: 'drag', obj: '🍬', n: 3, target: '🐻', done: 'Miam… ?', hint: 'Glisse les bonbons jusqu’à l’animal !' },
  dinovitre: { name: 'Écrire DINO sur la vitrine', icon: '✏️', type: 'order', word: 'DINO', hint: 'Tape les lettres dans l’ordre : D-I-N-O' },
  selfie: { name: 'Faire un selfie avec le dinosaure', icon: '📸', type: 'hold', grow: '📸', fail: 'FLOU !', hint: 'Maintiens pour faire la mise au point, lâche dans la zone verte !', noise: { r: 4, w: 'CLIC-CLAC' } }
});
