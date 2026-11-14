// ================= L'INTERRO D'HISTOIRE DE M. SILEX + LES ANIMAUX DE COMPAGNIE =================
// Attrapé·e par M. Silex (histoire-géo) : une question sur la Préhistoire, 3 réponses au choix.
// Bonne réponse : il te confie un animal de compagnie au hasard, qui te suit
// et fait fuir les profs qui t'attrapent (3 fois). Faute : il corrige… et confisque tes objets magiques.
// q = question, a = bonne réponse, w = 2 pièges, e = le rappel de la leçon
const HIST_BANK = [
  // --- la frise : Préhistoire et Histoire ---
  { q: 'Quand commence la Préhistoire ?', a: 'Il y a environ 3 millions d’années', w: ['Il y a 3 000 ans', 'En 476'], e: 'La Préhistoire commence il y a environ 3 millions d’années, avec l’apparition des premiers humains.' },
  { q: 'Quel événement marque la fin de la Préhistoire ?', a: 'L’apparition de l’écriture', w: ['La découverte du feu', 'La chute de l’Empire romain'], e: 'La Préhistoire se termine vers 3000 av. J.-C. avec l’apparition de l’écriture.' },
  { q: 'Vers quelle date apparaît l’écriture ?', a: 'Vers 3000 av. J.-C.', w: ['Vers 8000 av. J.-C.', 'En 1492'], e: 'L’écriture apparaît vers 3000 avant J.-C. : c’est le début de l’Histoire (l’Antiquité).' },
  { q: 'Quelle période vient juste après la Préhistoire ?', a: 'L’Antiquité', w: ['Le Moyen Âge', 'Le Néolithique'], e: 'Préhistoire → Antiquité → Moyen Âge → Temps modernes → XIXe → XXe siècle.' },
  { q: 'La Préhistoire, c’est…', a: 'La période avant l’apparition de l’écriture', w: ['La période des châteaux forts', 'La période juste après l’écriture'], e: 'Préhistoire = période de l’histoire humaine qui a précédé l’apparition de l’écriture.' },
  { q: 'Quelle est la plus longue période de la vie de l’humanité ?', a: 'La Préhistoire', w: ['L’Antiquité', 'Les Temps modernes'], e: 'La Préhistoire dure environ 3 millions d’années : c’est de loin la plus longue !' },
  { q: 'Quel événement marque le début du Moyen Âge ?', a: 'La chute de l’Empire romain (476)', w: ['La découverte de l’Amérique (1492)', 'La Révolution française (1789)'], e: 'La frise : 476 chute de l’Empire romain, 1492 découverte de l’Amérique, 1789 Révolution française.' },
  { q: 'Quel événement marque le début des Temps modernes ?', a: 'La découverte de l’Amérique (1492)', w: ['La Révolution française (1789)', 'L’apparition de l’écriture'], e: 'Les Temps modernes commencent en 1492 avec la découverte de l’Amérique.' },
  { q: '« -3000 », sur une frise, ça veut dire…', a: '3000 ans avant la naissance de Jésus-Christ', w: ['L’an 3000, dans le futur', 'Il y a 3000 jours'], e: 'Le signe « - » veut dire « avant J.-C. » (avant notre ère).' },
  { q: 'Le Paléolithique va de…', a: '-3 millions d’années à -8000', w: ['-8000 à -3000', '-3000 à 476'], e: 'Paléolithique : de -3 millions d’années à -8000. Puis Néolithique : de -8000 à -3000.' },
  { q: 'Le Néolithique va de…', a: '-8000 à -3000', w: ['-3 millions d’années à -8000', '476 à 1492'], e: 'Néolithique : de -8000 à -3000, juste avant l’apparition de l’écriture.' },
  { q: '« Paléolithique », ça veut dire…', a: 'La pierre ancienne (pierre taillée)', w: ['La pierre nouvelle', 'L’âge du fer'], e: 'Paléolithique = « pierre ancienne » : l’âge de la pierre taillée.' },
  { q: '« Néolithique », ça veut dire…', a: 'La pierre nouvelle', w: ['La pierre ancienne', 'La pierre précieuse'], e: 'Néolithique = « pierre nouvelle » en grec. Il succède au Paléolithique.' },
  // --- les sources : archéologie ---
  { q: 'Un archéologue, c’est…', a: 'Un scientifique qui étudie les traces laissées par les humains du passé', w: ['Un scientifique qui étudie les volcans', 'Le chef d’une tribu préhistorique'], e: 'Archéologue : scientifique qui étudie les traces laissées par les hommes et les femmes du passé.' },
  { q: 'Des vestiges, ce sont…', a: 'Ce qui reste du passé : objets, outils, traces…', w: ['Des vêtements de la Préhistoire', 'Des animaux disparus'], e: 'Vestiges : ce qui reste du passé (objets, traces dans le sol, outils, monuments…).' },
  { q: 'Un fossile, c’est…', a: 'Un débris de plante ou d’animal conservé dans le sol', w: ['Une pierre taillée en forme de couteau', 'Une peinture dans une grotte'], e: 'Fossile : débris de plante ou d’animal conservé dans des couches anciennes du sol.' },
  { q: 'Comment les archéologues trouvent-ils les vestiges ?', a: 'En faisant des fouilles dans le sol', w: ['En lisant des livres écrits à la Préhistoire', 'En regardant des films'], e: 'Les archéologues mettent les vestiges au jour en faisant des fouilles dans le sol.' },
  { q: 'Quels outils utilisent les archéologues ?', a: 'Truelle, pinceau, balayette', w: ['Marteau-piqueur et pelleteuse', 'Ciseaux, colle et surligneur'], e: 'La truelle dégage le sédiment, le pinceau nettoie autour des objets, la balayette retire la terre.' },
  { q: 'Pourquoi l’archéologie est-elle notre seule source sur la Préhistoire ?', a: 'Parce que l’écriture n’existait pas', w: ['Parce que les livres ont brûlé', 'Parce que les humains ne parlaient pas'], e: 'Sans écriture, il ne reste que les vestiges : outils, campements, peintures, restes de repas…' },
  { q: 'Où a-t-on trouvé le plus ancien crâne humain de France ?', a: 'Dans la grotte de Tautavel', w: ['Dans la grotte de Lascaux', 'À Paris'], e: 'Le crâne de l’homme de Tautavel (Pyrénées-Orientales) a environ 450 000 ans.' },
  { q: 'Quel âge a le crâne de l’homme de Tautavel ?', a: 'Environ 450 000 ans', w: ['Environ 4 500 ans', 'Environ 45 millions d’années'], e: 'Environ 450 000 ans : c’est le plus ancien crâne humain trouvé en France.' },
  { q: 'Pourquoi les fouilles autour d’un foyer sont-elles intéressantes ?', a: 'Les humains vivaient et travaillaient autour du feu', w: ['C’est là qu’ils écrivaient leurs livres', 'C’est là qu’ils rangeaient leurs trésors en or'], e: 'Le foyer donnait lumière et chaleur : on y taillait le silex, on préparait la viande…' },
  // --- les premiers humains ---
  { q: 'Où sont apparus les premiers humains ?', a: 'En Afrique', w: ['En Europe', 'En Amérique'], e: 'Les premiers humains apparaissent en Afrique, il y a environ 2,4 millions d’années.' },
  { q: 'Les premiers humains apparaissent il y a…', a: '2,4 millions d’années', w: ['24 000 ans', '240 millions d’années'], e: 'Homo habilis, le premier humain, apparaît il y a 2,4 millions d’années en Afrique.' },
  { q: 'Quelle est la première espèce humaine ?', a: 'Homo habilis', w: ['Homo sapiens', 'Lucy, l’australopithèque'], e: 'Homo habilis (« l’homme habile ») est le premier humain à fabriquer des outils. Lucy n’était pas une humaine !' },
  { q: '« Homo habilis », ça veut dire…', a: 'L’homme habile', w: ['L’homme debout', 'L’homme savant'], e: 'Habilis = habile (il fabrique des outils), erectus = debout, sapiens = savant.' },
  { q: '« Homo erectus », ça veut dire…', a: 'L’homme debout (dressé)', w: ['L’homme habile', 'L’homme savant'], e: 'Homo erectus = « l’homme debout ». Il apparaît il y a 1,9 million d’années.' },
  { q: '« Homo sapiens », ça veut dire…', a: 'L’homme savant', w: ['L’homme debout', 'L’homme habile'], e: 'Homo sapiens = « l’homme savant » : c’est notre espèce !' },
  { q: 'Quelle espèce a maîtrisé le feu ?', a: 'Homo erectus', w: ['Homo habilis', 'L’australopithèque'], e: 'Homo erectus domestique le feu (vers 500 000 ans) et sort d’Afrique.' },
  { q: 'Quelle est notre espèce, la seule humaine qui a survécu ?', a: 'Homo sapiens', w: ['Homo erectus', 'L’homme de Néandertal'], e: 'Tous les humains d’aujourd’hui sont des Homo sapiens, apparus en Afrique.' },
  { q: 'La bipédie, c’est…', a: 'Marcher sur ses deux pieds', w: ['Marcher à quatre pattes', 'Savoir nager'], e: 'Bi = 2, pédie = pied : l’humain marche debout sur ses deux jambes.' },
  { q: 'Qu’est-ce qui sépare les humains des autres primates ?', a: 'Position debout, mains libérées, gros cerveau', w: ['Des poils et une longue queue', 'Savoir grimper aux arbres'], e: 'Position debout → les mains se libèrent → le cerveau se développe → fabrication d’outils.' },
  { q: 'Lucy, c’était…', a: 'Une australopithèque (pas encore une humaine)', w: ['La première Homo sapiens', 'Une archéologue célèbre'], e: 'Toumaï et Lucy ne sont pas des humains : ce sont des ancêtres plus anciens.' },
  { q: 'Qui enterre ses morts et invente l’art ?', a: 'Homo sapiens', w: ['Homo habilis', 'L’australopithèque'], e: 'Vers 35 000 av. J.-C., les humains peignent, sculptent et enterrent leurs morts.' },
  { q: 'Où vivait l’homme de Néandertal ?', a: 'En Europe et en Asie', w: ['En Amérique', 'En Océanie'], e: 'L’homme de Néandertal vivait en Europe et en Asie, de -350 000 à -30 000 ans.' },
  // --- les migrations ---
  { q: 'Où se trouve le berceau de l’humanité ?', a: 'En Afrique (vallée du Grand Rift)', w: ['En Asie', 'En Europe, à Tautavel'], e: 'Les plus anciens restes d’hominidés ont été trouvés dans la vallée du Grand Rift, en Afrique.' },
  { q: 'Quelles sont les plus anciennes migrations ?', a: 'Celles d’Homo erectus', w: ['Celles d’Homo sapiens', 'Celles des Vikings'], e: 'Homo erectus, bon marcheur, sort d’Afrique il y a environ 2 millions d’années.' },
  { q: 'Quand Homo sapiens commence-t-il ses migrations ?', a: 'À partir de -300 000 ans', w: ['À partir de -3000 ans', 'Il y a 30 millions d’années'], e: 'Homo sapiens quitte l’Afrique à partir de -300 000 ans et peuple toute la planète.' },
  { q: 'Quel continent Homo sapiens atteint-il en dernier ?', a: 'L’Amérique', w: ['L’Europe', 'L’Asie'], e: 'Homo sapiens peuple l’Europe, l’Asie, l’Océanie… et en dernier l’Amérique.' },
  // --- la vie au Paléolithique ---
  { q: '« Nomade », ça veut dire…', a: 'Qui n’a pas d’habitat fixe', w: ['Qui habite toujours au même endroit', 'Qui cultive des champs'], e: 'Nomade : personne dont l’habitat n’est pas fixe. Au Paléolithique, les humains sont nomades.' },
  { q: '« Sédentaire », ça veut dire…', a: 'Qui habite un lieu fixe', w: ['Qui se déplace tout le temps', 'Qui chasse le mammouth'], e: 'Être sédentaire, c’est habiter un lieu fixe : le contraire d’être nomade.' },
  { q: 'Au Paléolithique, les humains vivent de…', a: 'La chasse, la pêche et la cueillette', w: ['L’agriculture et l’élevage', 'Leur boutique au village'], e: 'Peu nombreux, ils vivent de la chasse, de la pêche et de la cueillette.' },
  { q: 'Pourquoi les nomades se déplacent-ils ?', a: 'Pour suivre les troupeaux', w: ['Pour aller à l’école', 'Pour visiter les grandes villes'], e: 'Ils poursuivent le gibier : ils se déplacent pour suivre les troupeaux.' },
  { q: 'Avec quoi fabrique-t-on les outils au Paléolithique ?', a: 'Silex taillé, bois, os et ivoire', w: ['Plastique et métal', 'Or et argent'], e: 'Paléolithique = âge de la pierre taillée : silex, mais aussi bois, os et ivoire.' },
  { q: 'À quoi sert une aiguille en os ?', a: 'À coudre du cuir pour faire des vêtements', w: ['À pêcher des poissons', 'À allumer le feu'], e: 'L’aiguille en os permet de coudre des morceaux de cuir pour faire des vêtements.' },
  { q: 'À quoi sert un harpon en os ?', a: 'À pêcher', w: ['À coudre', 'À peindre les grottes'], e: 'Le harpon en os permet le développement de la pêche.' },
  { q: 'À quoi sert le propulseur ?', a: 'À lancer la sagaie plus vite', w: ['À allumer le feu', 'À couper la viande'], e: 'Une sagaie lancée avec un propulseur va trois fois plus vite qu’à la main !' },
  { q: 'Une sagaie, c’est…', a: 'Une sorte de lance', w: ['Une tente en peaux', 'Un petit bateau'], e: 'Sagaie = lance, qu’on lance avec un propulseur.' },
  { q: 'À quoi servaient les bêtes tuées à la chasse ?', a: 'À tout : viande, peaux, os et nerfs', w: ['Seulement à la viande', 'À rien : c’était un sport'], e: 'Viande à manger, peau pour vêtements et tentes, os pour outils, nerfs pour faire du fil.' },
  { q: 'À quoi voit-on que les gens de Pincevent sont nomades ?', a: 'Ils vivent dans des tentes en peaux', w: ['Ils ont des maisons en pierre', 'Ils ont des champs de blé'], e: 'Des tentes qu’on démonte et emporte : ils sont nomades.' },
  { q: 'Que montre la peinture de la grotte de Niaux ?', a: 'Une chasse au bison', w: ['Une fête de village', 'Un champ de blé'], e: 'Un bison touché par une sagaie : c’est une scène de chasse (vers 12 000 av. J.-C.).' },
  { q: 'Vers quand les humains développent-ils l’art (peinture, sculpture) ?', a: 'Vers 35 000 av. J.-C.', w: ['Vers 1789', 'Il y a 3 millions d’années'], e: 'Vers 35 000 av. J.-C., ils peignent, sculptent et commencent à enterrer leurs morts.' },
  // --- le Néolithique ---
  { q: 'Qu’est-ce que la « révolution néolithique » ?', a: 'L’invention de l’agriculture et de l’élevage', w: ['L’invention de l’écriture', 'La découverte du feu'], e: 'Néolithique : agriculture, domestication des animaux, élevage… et les humains se fixent.' },
  { q: 'Où apparaît le plus ancien foyer de la révolution néolithique ?', a: 'Au Proche-Orient', w: ['En Chine', 'Au Mexique'], e: 'Au Proche-Orient, vers 10 000 - 9 000 av. J.-C. (blé, orge, mouton, chèvre…).' },
  { q: 'Que cultive-t-on d’abord au Proche-Orient ?', a: 'Le blé et l’orge', w: ['Le maïs et l’avocat', 'La pomme de terre et le piment'], e: 'Proche-Orient : blé, orge. Mexique : maïs, avocat. Andes : pomme de terre, piment.' },
  { q: 'Au Néolithique, les humains deviennent…', a: 'Sédentaires : ils fondent des villages', w: ['Nomades', 'Des chasseurs de mammouths'], e: 'Vers 10 000 - 8000 av. J.-C., ils cultivent la terre, deviennent sédentaires et fondent des villages.' },
  { q: 'Qu’est-ce qui change au Néolithique ?', a: 'Maisons en dur, villages, outils en métal', w: ['Les humains apprennent à marcher debout', 'Les humains inventent l’ordinateur'], e: 'Maisons en dur, sédentarisation, urbanisation, plus de population, outils en métal…' },
  { q: 'Un « boom démographique », c’est…', a: 'Une forte augmentation de la population', w: ['Une éruption de volcan', 'Un très gros orage'], e: 'La sédentarité permet un boom démographique : la population augmente fortement.' },
  // --- méthode ---
  { q: 'Un document avec une légende et des flèches sur le monde, c’est…', a: 'Une carte', w: ['Un article de presse', 'Un tableau'], e: 'Nature d’un document : carte, article de presse, tableau, interview, article de dictionnaire, extrait d’un site.' },
  { q: 'Un entretien publié sur LePoint.fr, c’est…', a: 'Une interview dans un article de presse', w: ['Une carte', 'Un tableau'], e: 'Interview (entretien) publiée dans un article de journal : c’est sa nature.' },
];

// ---------- les animaux de compagnie ----------
const PETS = [
  { k: 'wolf', e: '🐺', n: 'Petit loup', scare: 'AAAH ! Un loup !' },
  { k: 'mammoth', e: '🦣', n: 'Bébé mammouth', scare: 'UN MAMMOUTH ?! Au secours !' },
  { k: 'dog', e: '🐕', n: 'Chien', scare: 'Ouaf ?! Il va me mordre !' },
  { k: 'cat', e: '🐈', n: 'Chat', scare: 'Pas les griffes, pas les griffes !' },
  { k: 'hedgehog', e: '🦔', n: 'Hérisson', scare: 'Aïe ! Ça pique !' },
  { k: 'parrot', e: '🦜', n: 'Perroquet', scare: 'Il me crie dans les oreilles !' },
  { k: 'rabbit', e: '🐇', n: 'Lapin', scare: 'Un lapin… GÉANT ?!' },
  { k: 'owl', e: '🦉', n: 'Chouette', scare: 'Hou hou ?! Elle me fonce dessus !' },
];
const PET_CHARGES = 3;
function petGive(P) {
  const def = pick(PETS);
  P.pet = { i: PETS.indexOf(def), e: def.e, n: def.n, charges: PET_CHARGES, x: P.x - 10, y: P.y + 2, hop: 0, t: 0 };
  return def;
}
// le compagnon suit son élève (petits bonds), et attend devant la cachette
function petFollow(A, dt) {
  const p = A && A.pet; if (!p || A.x < -9000) return;
  p.t += dt; if (p.leaveT != null) { p.leaveT -= dt; p.y -= dt * 20; if (p.leaveT <= 0) A.pet = null; return; }
  if (p.jump > 0) { p.jump -= dt; const T = p.jumpTo; if (T) { p.x += (T.x - p.x) * Math.min(1, dt * 9); p.y += (T.y - p.y) * Math.min(1, dt * 9); } return; }
  const fx = A.face === 2 ? 1 : A.face === 3 ? -1 : 0, fy = A.face === 0 ? 1 : A.face === 1 ? -1 : 0;
  const tx = A.hidden ? A.hidden.x * 16 + 8 + 12 : A.x - fx * 14 - (fx ? 0 : 8), ty = A.hidden ? A.hidden.y * 16 + 14 : A.y - fy * 12 + 2;
  const d = Math.hypot(tx - p.x, ty - p.y);
  if (d > 4) { const k = Math.min(1, dt * (d > 60 ? 10 : 5)); p.x += (tx - p.x) * k; p.y += (ty - p.y) * k; p.moving = true; } else p.moving = false;
  if (d > 160) { p.x = tx; p.y = ty; }
}
// le compagnon saute sur le prof qui t'attrape : il s'enfuit !
function petScare(T, A, remote) {
  const p = A.pet, def = PETS[p ? p.i : 0];
  T.state = 'scared'; T.st = 3.4; T.path = null; T.detect = 0; if (T.det) T.det = {}; T.knows = null; T.moving = false;
  T.bubble = { text: def.scare, t: 0, dur: 2.2 }; setMark(T, '!', 1.5);
  if (G.inf && G.inf.coop) Net.send({ t: 'bub', w: 'T', text: def.scare, dur: 2.2 });
  AU.say(def.scare, T.prof, 0.9); AU.sfx('boing'); AU.sfx('bump'); G.shake = 0.25;
  puff(T.x, T.y - 10, 14, '#ffffff'); cue(T.x, T.y - 34, 'word', def.e + ' GRRR !', { col: '#ffd23f', pop: true, life: 1.3 });
  if (G.inf) { G.inf.grace = Math.max(G.inf.grace || 0, 2.5); }
  if (remote) return;   // le compagnon du coéquipier : c'est lui qui compte
  petUsed(A, T);
}
function petUsed(A, T) {
  const p = A.pet; if (!p) return;
  p.charges--; p.jump = 0.45; p.jumpTo = T ? { x: T.x, y: T.y } : null;
  if (p.charges > 0) UI.banner(p.e + ' ' + p.n + ' fait fuir ' + (T ? T.prof.name : 'le prof') + ' ! (encore ' + p.charges + ' fois)');
  else { UI.banner(p.e + ' ' + p.n + ' est épuisé·e : retour à la maison ! Merci, ' + p.n.toLowerCase() + ' !'); setTimeout(() => { if (A.pet === p) p.leaveT = 1.2; }, 1400); }
  UI.hudSig = null;
}
// fuite du prof effrayé (appelée par updateTeacher)
function teacherScared(T, dt) {
  const P = G.P; T.st -= dt;
  if (T.st > 2.5) { T.moving = false; T.dist = (T.dist || 0) + dt * 30; T.ang += Math.sin(G.time * 45) * 0.08; }
  else {
    if (!T.path) {
      const pts = (G.L.patrol || []).slice().sort((a, b) => dist(b[0] * 16, b[1] * 16, P.x, P.y) - dist(a[0] * 16, a[1] * 16, P.x, P.y));
      for (const pt of pts.slice(0, 3)) { if (goTo(T, pt[0], pt[1])) break; }
    }
    if (T.path) { const r = followPath(T, T.prof.chase * 16 * 0.95, dt); T.running = true; if (r === 'done' || (r && r.x !== undefined)) { T.path = null; T.moving = false; } }
  }
  if (T.st <= 0) { T.state = 'patrol'; T.path = null; T.detect = 0; T.running = false; }
}
