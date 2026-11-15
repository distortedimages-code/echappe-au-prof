// ================= L'INTERRO D'HISTOIRE DE M. SILEX + LES ANIMAUX DE COMPAGNIE =================
// Attrapé·e par M. Silex (histoire-géo) : une question sur la Préhistoire, 3 réponses au choix.
// Bonne réponse : il te confie un animal de compagnie au hasard, qui te suit
// et fait fuir les profs qui t'attrapent (3 fois). Faute : il corrige… et confisque tes objets magiques.
// Toutes les questions viennent des photos du cahier de Faustine (16 photos, dans l'ordre d'envoi).
// c = chapitre, r = [photo, haut, bas, ce qu'il faut regarder, gauche, droite] (fractions de la page)
// q = question, a = bonne réponse, w = 2 pièges, e = le rappel de la leçon
const HIST_BANK = [
  // ===== ⏳ Qu’est-ce que la Préhistoire ? (la frise) =====
  { c: 'intro', r: [11, .08, .16, 'la réponse 1)'], q: 'Quand commence la Préhistoire ?', a: 'Il y a environ 3 millions d’années', w: ['Il y a 3 000 ans', 'En 476'], e: 'La Préhistoire commence il y a environ 3 millions d’années, avec l’apparition des premiers humains.' },
  { c: 'intro', r: [11, .08, .16, 'la réponse 1)'], q: 'Quel événement marque la fin de la Préhistoire ?', a: 'L’apparition de l’écriture', w: ['La découverte du feu', 'La chute de l’Empire romain'], e: 'La Préhistoire se termine vers 3000 av. J.-C. avec l’apparition de l’écriture.' },
  { c: 'intro', r: [8, .55, .77, 'la frise : « -3000 : apparition de l’écriture »'], q: 'Vers quelle date apparaît l’écriture ?', a: 'Vers 3000 av. J.-C.', w: ['Vers 8000 av. J.-C.', 'En 1492'], e: 'L’écriture apparaît vers 3000 avant J.-C. : c’est le début de l’Histoire (l’Antiquité).' },
  { c: 'intro', r: [11, .08, .16, 'la fin de la réponse 1)'], q: 'Quelle période vient juste après la Préhistoire ?', a: 'L’Antiquité', w: ['Le Moyen Âge', 'Le Néolithique'], e: 'Préhistoire → Antiquité → Moyen Âge → Temps modernes → XIXe → XXe siècle.' },
  { c: 'intro', r: [11, .16, .22, 'la définition en rouge'], q: 'La Préhistoire, c’est…', a: 'La période avant l’apparition de l’écriture', w: ['La période des châteaux forts', 'La période juste après l’écriture'], e: 'Préhistoire = période de l’histoire humaine qui a précédé l’apparition de l’écriture.' },
  { c: 'intro', r: [11, .22, .27, 'la réponse 2)'], q: 'Quelle est la plus longue période de la vie de l’humanité ?', a: 'La Préhistoire', w: ['L’Antiquité', 'Les Temps modernes'], e: 'La Préhistoire dure environ 3 millions d’années : c’est de loin la plus longue !' },
  { c: 'intro', r: [8, .55, .77, 'les dates sous la frise B'], q: 'Quel événement marque le début du Moyen Âge ?', a: 'La chute de l’Empire romain (476)', w: ['La découverte de l’Amérique (1492)', 'La Révolution française (1789)'], e: 'La frise : 476 chute de l’Empire romain, 1492 découverte de l’Amérique, 1789 Révolution française.' },
  { c: 'intro', r: [8, .55, .77, 'les dates sous la frise B'], q: 'Quel événement marque le début des Temps modernes ?', a: 'La découverte de l’Amérique (1492)', w: ['La Révolution française (1789)', 'L’apparition de l’écriture'], e: 'Les Temps modernes commencent en 1492 avec la découverte de l’Amérique.' },
  { c: 'intro', r: [11, .28, .35, '« en 3000 avant notre ère »'], q: '« -3000 », sur une frise, ça veut dire…', a: '3000 ans avant la naissance de Jésus-Christ', w: ['L’an 3000, dans le futur', 'Il y a 3000 jours'], e: 'Le signe « - » veut dire « avant J.-C. » (avant notre ère).' },
  { c: 'intro', r: [11, .35, .41, 'Paléolithique puis Néolithique'], q: 'Le Paléolithique va de…', a: '-3 millions d’années à -8000', w: ['-8000 à -3000', '-3000 à 476'], e: 'Paléolithique : de -3 millions d’années à -8000. Puis Néolithique : de -8000 à -3000.' },
  { c: 'intro', r: [11, .35, .41, 'Paléolithique puis Néolithique'], q: 'Le Néolithique va de…', a: '-8000 à -3000', w: ['-3 millions d’années à -8000', '476 à 1492'], e: 'Néolithique : de -8000 à -3000, juste avant l’apparition de l’écriture.' },
  { c: 'intro', r: [15, .14, .21, 'la définition en rouge'], q: '« Paléolithique », ça veut dire…', a: 'La pierre ancienne (pierre taillée)', w: ['La pierre nouvelle', 'L’âge du fer'], e: 'Paléolithique = « pierre ancienne » : l’âge de la pierre taillée.' },
  { c: 'intro', r: [15, .14, .21, 'la définition en rouge'], q: '« Néolithique », ça veut dire…', a: 'La pierre nouvelle', w: ['La pierre ancienne', 'La pierre précieuse'], e: 'Néolithique = « pierre nouvelle » en grec. Il succède au Paléolithique.' },
  { c: 'intro', r: [15, .14, .21, 'la définition en rouge'], q: 'Le Néolithique vient…', a: 'Juste après le Paléolithique', w: ['Juste avant le Paléolithique', 'Juste après l’Antiquité'], e: 'Le Néolithique succède à la « pierre ancienne », le Paléolithique.' },
  { c: 'intro', r: [8, .55, .77, 'la légende des couleurs de la frise'], q: 'Sur la frise, quelles périodes étudie-t-on en 6e ?', a: 'La Préhistoire et l’Antiquité', w: ['Le Moyen Âge et les Temps modernes', 'Le XIXe et le XXe siècle'], e: 'En vert : Préhistoire et Antiquité (6e). Moyen Âge et Temps modernes : 5e. XIXe : 4e. XXe : 3e.' },
  { c: 'intro', r: [8, .55, .77, 'les dates sous la frise B'], q: 'Qu’est-ce qui se passe en 1789, sur la frise ?', a: 'La Révolution française', w: ['La révolution néolithique', 'La chute de l’Empire romain'], e: '1789 : Révolution française. Elle ouvre le XIXe siècle sur la frise.' },
  { c: 'intro', r: [8, .12, .26, 'le titre du thème 1'], q: 'Comment s’appelle le thème 1 de ton cahier ?', a: 'La longue histoire de l’humanité et des migrations', w: ['Les châteaux forts et les chevaliers', 'La Révolution française'], e: 'Thème 1 : la longue histoire de l’humanité et des migrations. Chapitre 1 : les débuts de l’humanité.' },

  // ===== 🔎 Comment connaît-on les débuts de l’humanité ? (archéologie) =====
  { c: 'arch', r: [11, .44, .50, 'Archéologue (en rouge)'], q: 'Un archéologue, c’est…', a: 'Un scientifique qui étudie les traces laissées par les humains du passé', w: ['Un scientifique qui étudie les volcans', 'Le chef d’une tribu préhistorique'], e: 'Archéologue : scientifique qui étudie les traces laissées par les hommes et les femmes du passé.' },
  { c: 'arch', r: [11, .52, .58, 'Vestiges (en rouge)'], q: 'Des vestiges, ce sont…', a: 'Ce qui reste du passé : objets, outils, traces…', w: ['Des vêtements de la Préhistoire', 'Des animaux disparus'], e: 'Vestiges : ce qui reste du passé (objets, traces dans le sol, outils, monuments…).' },
  { c: 'arch', r: [11, .57, .64, 'Fossiles (en rouge)'], q: 'Un fossile, c’est…', a: 'Un débris de plante ou d’animal conservé dans le sol', w: ['Une pierre taillée en forme de couteau', 'Une peinture dans une grotte'], e: 'Fossile : débris de plante ou d’animal conservé dans des couches anciennes du sol.' },
  { c: 'arch', r: [4, .48, .53, 'la phrase sous le texte écrit'], q: 'Comment les archéologues trouvent-ils les vestiges ?', a: 'En faisant des fouilles dans le sol', w: ['En lisant des livres écrits à la Préhistoire', 'En regardant des films'], e: 'Les archéologues mettent les vestiges au jour en faisant des fouilles dans le sol.' },
  { c: 'arch', r: [6, .57, .65, 'la réponse 1)'], q: 'Quels outils utilisent les archéologues ?', a: 'Truelle, pinceau, balayette', w: ['Marteau-piqueur et pelleteuse', 'Ciseaux, colle et surligneur'], e: 'La truelle dégage le sédiment, le pinceau nettoie autour des objets, la balayette retire la terre.' },
  { c: 'arch', r: [6, .71, .79, 'la réponse 2)'], q: 'Pourquoi l’archéologie est-elle notre seule source sur la Préhistoire ?', a: 'Parce que l’écriture n’existait pas', w: ['Parce que les livres ont brûlé', 'Parce que les humains ne parlaient pas'], e: 'Sans écriture, il ne reste que les vestiges : outils, campements, peintures, restes de repas…' },
  { c: 'arch', r: [4, .15, .34, 'la légende du crâne', .53, .95], q: 'Où a-t-on trouvé le plus ancien crâne humain de France ?', a: 'Dans la grotte de Tautavel', w: ['Dans la grotte de Lascaux', 'À Paris'], e: 'Le crâne de l’homme de Tautavel (Pyrénées-Orientales) a environ 450 000 ans.' },
  { c: 'arch', r: [4, .15, .34, 'la légende du crâne', .53, .95], q: 'Quel âge a le crâne de l’homme de Tautavel ?', a: 'Environ 450 000 ans', w: ['Environ 4 500 ans', 'Environ 45 millions d’années'], e: 'Environ 450 000 ans : c’est le plus ancien crâne humain trouvé en France.' },
  { c: 'arch', r: [9, .43, .67, 'les réponses 2) (en bleu et en vert)'], q: 'Pourquoi les fouilles autour d’un foyer sont-elles intéressantes ?', a: 'Les humains vivaient et travaillaient autour du feu', w: ['C’est là qu’ils écrivaient leurs livres', 'C’est là qu’ils rangeaient leurs trésors en or'], e: 'Le foyer donnait lumière et chaleur : on y taillait le silex, on préparait la viande…' },
  { c: 'arch', r: [6, .15, .40, 'la carte de France', .52, .92], q: 'Dans quel département se trouve la grotte de Tautavel ?', a: 'Les Pyrénées-Orientales', w: ['La Corse', 'Paris'], e: 'La grotte de Tautavel se trouve dans les Pyrénées-Orientales.' },
  { c: 'arch', r: [6, .25, .40, 'la légende « L’entrée de la grotte de Tautavel »', .52, .92], q: 'Pourquoi la grotte de Tautavel était-elle pratique pour les chasseurs ?', a: 'En hauteur, on surveillait le gibier', w: ['Elle avait le chauffage central', 'Il y avait un supermarché à côté'], e: 'Située en hauteur, la grotte permettait d’observer le gibier, qui venait boire à la rivière en contrebas.' },
  { c: 'arch', r: [6, .33, .45, '« Les outils de la fouille »', .15, .52], q: 'À quoi sert la truelle, sur un chantier de fouilles ?', a: 'À dégager le sédiment plus précisément qu’une pelle', w: ['À peindre les murs de la grotte', 'À allumer le feu'], e: 'La truelle dégage le sédiment de façon plus précise qu’une pelle. Le pinceau, lui, nettoie autour des objets.' },
  { c: 'arch', r: [6, .25, .45, 'la légende du chantier', .03, .5], q: 'Comment prépare-t-on le chantier de fouilles ?', a: 'On le découpe en carrés numérotés, avec des cordes', w: ['On le découpe en triangles, à la tronçonneuse', 'On creuse partout au hasard'], e: 'Le site est quadrillé avec des cordes : chaque carré est numéroté pour noter où l’on trouve chaque vestige.' },
  { c: 'arch', r: [4, .14, .27, 'la photo des deux archéologues', .1, .55], q: 'Qu’ont dégagé les archéologues à Sollacaro, en Corse ?', a: 'Des ossements humains d’environ 9 000 ans', w: ['Le crâne de l’homme de Tautavel', 'Une peinture de bison'], e: 'Deux archéologues dégagent des ossements humains vieux d’environ 9 000 ans, à Sollacaro, en Corse.' },
  { c: 'arch', r: [4, .34, .49, 'le texte écrit sous les images'], q: 'Sans traces écrites, quels vestiges nous renseignent ?', a: 'Outils, campements, peintures, restes alimentaires', w: ['Journaux, lettres et cartes postales', 'Photos et vidéos'], e: 'Les sources viennent des vestiges des premières sociétés humaines : outils, campements, peintures, restes alimentaires…' },
  { c: 'arch', r: [14, .71, .82, 'la réponse 1)', .42, .97], q: 'Comment les archéologues repèrent-ils un ancien campement ?', a: 'Aux pierres des foyers et aux trous des tentes', w: ['Aux panneaux indicateurs', 'Aux traces de pneus'], e: 'Ils fouillent les anciens campements, repérables aux pierres des foyers et aux trous des poteaux des tentes.' },
  { c: 'arch', r: [14, .60, .84, 'la photo du document 1', .02, .44], q: 'Où a-t-on découvert un foyer du Paléolithique en 2004-2005 ?', a: 'À Mareuil-sur-Cher', w: ['À Tautavel', 'Dans la grotte de Niaux'], e: 'Document 1 « Sur les traces de Cro-Magnon » : un foyer du Paléolithique découvert à Mareuil-sur-Cher.' },
  { c: 'arch', r: [9, .15, .31, 'le texte du document 2', .1, .6], q: 'D’après le document 2, qu’est-ce qui « fait le bonheur des archéologues » ?', a: 'Les tas de déchets près des foyers', w: ['Les trésors en or', 'Les squelettes de dinosaures'], e: 'Les amas de déchets formés près des structures de chauffe font le bonheur des archéologues.' },

  // ===== 🦴 Qui étaient les premiers humains ? =====
  { c: 'hum', r: [5, .35, .47, 'le texte sous l’arbre'], q: 'Où sont apparus les premiers humains ?', a: 'En Afrique', w: ['En Europe', 'En Amérique'], e: 'Les premiers humains apparaissent en Afrique, il y a environ 2,4 millions d’années.' },
  { c: 'hum', r: [5, .35, .47, 'le texte sous l’arbre'], q: 'Les premiers humains apparaissent il y a…', a: '2,4 millions d’années', w: ['24 000 ans', '240 millions d’années'], e: 'Homo habilis, le premier humain, apparaît il y a 2,4 millions d’années en Afrique.' },
  { c: 'hum', r: [16, .19, .28, 'la réponse 1.', .57, .97], q: 'Quelle est la première espèce humaine ?', a: 'Homo habilis', w: ['Homo sapiens', 'Lucy, l’australopithèque'], e: 'Homo habilis (« l’homme habile ») est le premier humain à fabriquer des outils. Lucy n’était pas une humaine !' },
  { c: 'hum', r: [16, .59, .66, 'Homo habilis (souligné)'], q: '« Homo habilis », ça veut dire…', a: 'L’homme habile', w: ['L’homme debout', 'L’homme savant'], e: 'Habilis = habile (il fabrique des outils), erectus = debout, sapiens = savant.' },
  { c: 'hum', r: [16, .66, .75, 'Homo erectus, en bas'], q: '« Homo erectus », ça veut dire…', a: 'L’homme debout (dressé)', w: ['L’homme habile', 'L’homme savant'], e: 'Homo erectus = « l’homme debout ». Il apparaît il y a 1,9 million d’années.' },
  { c: 'hum', r: [7, .09, .16, 'la première phrase'], q: '« Homo sapiens », ça veut dire…', a: 'L’homme savant', w: ['L’homme debout', 'L’homme habile'], e: 'Homo sapiens = « l’homme savant » : c’est notre espèce !' },
  { c: 'hum', r: [16, .66, .75, 'Homo erectus, en bas'], q: 'Quelle espèce a maîtrisé le feu ?', a: 'Homo erectus', w: ['Homo habilis', 'L’australopithèque'], e: 'Homo erectus domestique le feu (vers 500 000 ans) et sort d’Afrique.' },
  { c: 'hum', r: [7, .09, .16, 'la première phrase'], q: 'Quelle est notre espèce, la seule humaine qui a survécu ?', a: 'Homo sapiens', w: ['Homo erectus', 'L’homme de Néandertal'], e: 'Notre espèce, Homo sapiens, est la seule espèce humaine survivante.' },
  { c: 'hum', r: [5, .68, .72, 'Bipédie (en rouge)'], q: 'La bipédie, c’est…', a: 'Marcher sur ses deux pieds', w: ['Marcher à quatre pattes', 'Savoir nager'], e: 'Bi = 2, pédie = pied : l’humain marche debout sur ses deux jambes.' },
  { c: 'hum', r: [10, .24, .41, 'le schéma', .42, .94], q: 'Qu’est-ce qui sépare les humains des autres primates ?', a: 'Position debout, mains libérées, gros cerveau', w: ['Des poils et une longue queue', 'Savoir grimper aux arbres'], e: 'Position debout → les mains se libèrent → le cerveau se développe → fabrication d’outils.' },
  { c: 'hum', r: [4, .55, .79, 'le texte de « La galerie de l’humanité »', .46, .84], q: 'Dans « La galerie de l’humanité », Lucy et Toumaï…', a: 'N’étaient pas encore des humains', w: ['Étaient les premiers Homo sapiens', 'Étaient des archéologues célèbres'], e: 'Toumaï et Lucy sont dans la galerie avec la lignée humaine… mais ce n’étaient pas des hommes.' },
  { c: 'hum', r: [16, .46, .59, 'la 3e réponse', .57, .97], q: 'Qui enterre ses morts et invente l’art ?', a: 'Homo sapiens', w: ['Homo habilis', 'L’australopithèque'], e: 'Homo sapiens perfectionne les outils, enterre ses morts et invente l’art (vers 35 000 av. J.-C.).' },
  { c: 'hum', r: [16, .33, .43, 'l’homme de Néandertal, en bas du tableau', .03, .55], q: 'Où vivait l’homme de Néandertal ?', a: 'En Europe et en Asie', w: ['En Amérique', 'En Océanie'], e: 'L’homme de Néandertal vivait en Europe et en Asie, de -350 000 à -30 000 ans.' },
  { c: 'hum', r: [4, .15, .34, 'la légende du crâne', .53, .95], q: 'À quoi reconnaît-on le crâne de l’homme de Tautavel ?', a: 'Grosses arcades sourcilières, front bas et fuyant', w: ['Front haut et menton pointu', 'Il a de petites cornes'], e: 'Grosses arcades sourcilières, front bas et fuyant, et un cerveau bien plus petit que le nôtre.' },
  { c: 'hum', r: [10, .24, .41, 'le texte et le schéma'], q: 'Dans quel ordre les humains se sont-ils séparés des primates ?', a: 'Debout, puis mains libérées, puis gros cerveau', w: ['Gros cerveau, puis debout', 'Outils, puis debout'], e: 'Ils marchent sur leurs pieds, leurs mains se libèrent, leur cerveau se développe… puis ils fabriquent des outils.' },
  { c: 'hum', r: [10, .49, .79, 'l’image de 1965'], q: 'Pourquoi l’image de 1965 (du singe à l’homme) est-elle fausse ?', a: 'Elle ne correspond plus à ce qu’on sait aujourd’hui', w: ['Elle est en noir et blanc', 'Les personnages sont tout nus'], e: 'Une représentation erronée : elle n’est pas conforme à ce que nous savons aujourd’hui de l’évolution des humains.' },
  { c: 'hum', r: [16, .17, .26, 'Homo habilis dans le tableau', .14, .52], q: 'D’après le tableau, où vivait Homo habilis ?', a: 'En Afrique de l’Est et du Sud', w: ['En Europe', 'Dans le monde entier'], e: 'Homo habilis : Afrique de l’Est et du Sud, de -2,4 à -1,6 millions d’années.' },
  { c: 'hum', r: [16, .26, .36, 'Homo sapiens dans le tableau', .28, .56], q: 'Quelle espèce vit dans le monde entier ?', a: 'Homo sapiens', w: ['Homo habilis', 'L’homme de Néandertal'], e: 'Homo sapiens : lieu = monde entier, de -200 000 ans à aujourd’hui.' },
  { c: 'hum', r: [16, .10, .18, 'l’australopithèque, en haut du tableau', .06, .34], q: 'Qui avait une bipédie « imparfaite » ?', a: 'L’australopithèque', w: ['Homo sapiens', 'Homo erectus'], e: 'L’australopithèque marchait debout, mais pas encore parfaitement. Homo habilis : bipédie permanente.' },
  { c: 'hum', r: [16, .32, .42, 'la 2e réponse', .57, .97], q: 'Qu’est-ce qui différencie Homo erectus d’Homo habilis ?', a: 'Il est plus grand, a un plus gros cerveau et domestique le feu', w: ['Il invente l’écriture', 'Il marche à quatre pattes'], e: 'Homo erectus : cerveau plus grand, plus grand, domestique le feu, change de lieu de vie, se redresse.' },
  { c: 'hum', r: [4, .55, .79, 'le texte de « La galerie de l’humanité »', .46, .84], q: 'Qui a reconstitué l’apparence des premiers hommes de la galerie ?', a: 'Des sculpteurs aidés de paléontologues', w: ['Les peintres de la grotte de Niaux', 'Des robots'], e: 'Aidés par des paléontologues, des sculpteurs reconstituent l’apparence des premiers hommes à partir de leurs fossiles.' },
  { c: 'hum', r: [5, .55, .69, 'le 2e tiret'], q: 'À quoi sert le développement du cerveau des premiers humains ?', a: 'Fabriquer des outils, maîtriser le feu, peindre…', w: ['Voler comme les oiseaux', 'Respirer sous l’eau'], e: 'Mains libres + cerveau plus gros = fabriquer des outils et maîtriser des environnements différents (feu, peinture…).' },

  // ===== 🌍 Comment ont-ils peuplé la planète ? =====
  { c: 'migr', r: [7, .28, .55, 'la légende de la carte', .68, .92], q: 'Où se trouve le berceau de l’humanité ?', a: 'En Afrique (vallée du Grand Rift)', w: ['En Asie', 'En Europe, à Tautavel'], e: 'Les plus anciens restes d’hominidés ont été trouvés dans la vallée du Grand Rift, en Afrique.' },
  { c: 'migr', r: [13, .46, .53, 'la réponse 5)'], q: 'Quelles sont les plus anciennes migrations ?', a: 'Celles d’Homo erectus', w: ['Celles d’Homo sapiens', 'Celles des Vikings'], e: 'Les plus anciennes migrations sont celles d’Homo erectus : environ 2 millions d’années.' },
  { c: 'migr', r: [13, .53, .59, 'la réponse 6)'], q: 'Quand Homo sapiens commence-t-il ses migrations ?', a: 'À partir de -300 000 ans', w: ['À partir de -3000 ans', 'Il y a 30 millions d’années'], e: 'Homo sapiens quitte l’Afrique à partir de -300 000 ans et peuple toute la planète.' },
  { c: 'migr', r: [13, .73, .79, 'l’avant-dernier paragraphe'], q: 'Quel continent Homo sapiens atteint-il en dernier ?', a: 'L’Amérique', w: ['L’Europe', 'L’Asie'], e: 'Homo sapiens peuple l’Europe, l’Asie, l’Océanie… et parvient enfin en Amérique.' },
  { c: 'migr', r: [7, .28, .55, 'les dates en rouge sur la carte'], q: 'Homo sapiens arrive en Europe vers…', a: '-40 000 ans', w: ['-3000 ans', '-3 millions d’années'], e: 'Sur la carte, les dates en rouge : Europe -40 000, Océanie -50 000.' },
  { c: 'migr', r: [7, .28, .55, 'les dates en rouge sur la carte'], q: 'Homo sapiens arrive en Océanie (Australie) vers…', a: '-50 000 ans', w: ['-500 ans', '-5 millions d’années'], e: 'Sur la carte, les dates en rouge : Océanie -50 000, Europe -40 000.' },
  { c: 'migr', r: [13, .80, .87, 'la dernière phrase'], q: 'De qui descendent tous les humains d’aujourd’hui ?', a: 'Des Homo sapiens apparus en Afrique', w: ['Des hommes de Néandertal d’Europe', 'De l’homme de Tautavel'], e: 'Tous les humains aujourd’hui descendent des Homo sapiens apparus en Afrique.' },
  { c: 'migr', r: [13, .59, .66, 'la réponse 7)'], q: 'Sur la carte des migrations, que montrent les points rouges ?', a: 'Les sites archéologiques de l’Homo sapiens', w: ['Les grandes villes', 'Les volcans'], e: 'Points rouges = sites archéologiques, flèches rouges = migrations de l’Homo sapiens.' },
  { c: 'migr', r: [7, .46, .54, 'l’encadré Homo sapiens, sous la carte', .42, .64], q: 'D’après la carte, quels talents a Homo sapiens ?', a: 'Très habile de ses mains, il sait parler', w: ['Il sait lire et écrire', 'Il sait voler'], e: 'Homo sapiens : fort semblable à l’homme moderne, très habile de ses mains, il sait parler.' },
  { c: 'migr', r: [7, .46, .54, 'l’encadré Homo erectus, sous la carte', .08, .29], q: 'Comment Homo erectus a-t-il pu migrer si loin ?', a: 'Mieux équilibré, il marche sur de longues distances', w: ['Il avait apprivoisé des chevaux', 'Il prenait le bateau à moteur'], e: 'Homo erectus utilise le feu, fabrique des outils, et, mieux équilibré, peut marcher sur de longues distances.' },
  { c: 'migr', r: [13, .25, .31, 'la réponse en vert'], q: 'Le thème de la carte des migrations, c’est…', a: 'Les premières grandes migrations de l’humanité', w: ['Les foyers de la révolution néolithique', 'Les châteaux forts'], e: 'Le thème : les premières grandes migrations de l’humanité au cours de la Préhistoire.' },

  // ===== 🏹 Comment vivaient-ils ? (Paléolithique) =====
  { c: 'vie', r: [7, .205, .245, 'la définition en rose'], q: '« Nomade », ça veut dire…', a: 'Qui n’a pas d’habitat fixe', w: ['Qui habite toujours au même endroit', 'Qui cultive des champs'], e: 'Nomade : personne dont l’habitat n’est pas fixe. Au Paléolithique, les humains sont nomades.' },
  { c: 'vie', r: [15, .20, .26, 'la définition en rouge'], q: '« Sédentaire », ça veut dire…', a: 'Qui habite un lieu fixe', w: ['Qui se déplace tout le temps', 'Qui chasse le mammouth'], e: 'Être sédentaire, c’est habiter un lieu fixe : le contraire d’être nomade.' },
  { c: 'vie', r: [15, .25, .33, '« Peu nombreux, les Hommes… »'], q: 'Au Paléolithique, les humains vivent de…', a: 'La chasse, la pêche et la cueillette', w: ['L’agriculture et l’élevage', 'Leur boutique au village'], e: 'Peu nombreux, ils vivent de la chasse, de la pêche et de la cueillette.' },
  { c: 'vie', r: [12, .56, .61, 'la réponse 7)'], q: 'Pourquoi les nomades se déplacent-ils ?', a: 'Pour suivre les troupeaux', w: ['Pour aller à l’école', 'Pour visiter les grandes villes'], e: 'Ils poursuivent le gibier : ils se déplacent pour suivre les troupeaux.' },
  { c: 'vie', r: [14, .45, .54, 'le paragraphe « A) Les premiers humains »'], q: 'Avec quoi fabrique-t-on les outils au Paléolithique ?', a: 'Silex taillé, bois, os et ivoire', w: ['Plastique et métal', 'Or et argent'], e: 'Paléolithique = âge de la pierre taillée : silex, mais aussi bois, os et ivoire.' },
  { c: 'vie', r: [14, .30, .40, 'l’aiguille en os', .44, .61], q: 'À quoi sert une aiguille en os ?', a: 'À coudre du cuir pour faire des vêtements', w: ['À pêcher des poissons', 'À allumer le feu'], e: 'L’aiguille en os permet de coudre des morceaux de cuir pour faire des vêtements.' },
  { c: 'vie', r: [14, .33, .40, 'le harpon en os', .12, .45], q: 'À quoi sert un harpon en os ?', a: 'À pêcher', w: ['À coudre', 'À peindre les grottes'], e: 'Le harpon en os permet le développement de la pêche.' },
  { c: 'vie', r: [14, .18, .31, 'le propulseur', .36, .61], q: 'À quoi sert le propulseur ?', a: 'À lancer la sagaie plus vite', w: ['À allumer le feu', 'À couper la viande'], e: 'Une sagaie lancée avec un propulseur va trois fois plus vite qu’à la main !' },
  { c: 'vie', r: [1, .67, .72, 'la réponse 4)'], q: 'Une sagaie, c’est…', a: 'Une sorte de lance', w: ['Une tente en peaux', 'Un petit bateau'], e: 'Sagaie = lance, qu’on lance avec un propulseur.' },
  { c: 'vie', r: [12, .44, .505, 'la réponse 5)'], q: 'À quoi servaient les bêtes tuées à la chasse ?', a: 'À tout : viande, peaux, os et nerfs', w: ['Seulement à la viande', 'À rien : c’était un sport'], e: 'Viande à manger, peau pour vêtements et tentes, os pour outils, nerfs pour faire du fil.' },
  { c: 'vie', r: [12, .52, .56, 'la réponse 6)'], q: 'À quoi voit-on que les gens de Pincevent sont nomades ?', a: 'Ils vivent dans des tentes en peaux', w: ['Ils ont des maisons en pierre', 'Ils ont des champs de blé'], e: 'Ils vivent dans des tentes en peaux d’animaux : ils sont nomades.' },
  { c: 'vie', r: [1, .32, .38, 'le titre du document 3'], q: 'Que montre la peinture de la grotte de Niaux ?', a: 'Une chasse au bison', w: ['Une fête de village', 'Un champ de blé'], e: 'Un bison touché par une sagaie : c’est une scène de chasse (vers 12 000 av. J.-C.).' },
  { c: 'vie', r: [15, .33, .41, '« Vers 35 000 av. J.-C. »'], q: 'Vers quand les humains développent-ils l’art (peinture, sculpture) ?', a: 'Vers 35 000 av. J.-C.', w: ['Vers 1789', 'Il y a 3 millions d’années'], e: 'Vers 35 000 av. J.-C., ils peignent, sculptent et commencent à enterrer leurs morts.' },
  { c: 'vie', r: [1, .09, .31, 'la légende de l’image de Pincevent'], q: 'Au bord de quel fleuve se trouve le campement de Pincevent ?', a: 'La Seine', w: ['Le Nil', 'L’Amazone'], e: 'Sur l’image de Pincevent, le n°6 est un gué de la Seine.' },
  { c: 'vie', r: [12, .12, .31, 'la légende « Des nomades »', .56, .76], q: 'De quand date le campement de Pincevent ?', a: 'Vers 14 000 ans av. J.-C.', w: ['De 1492', 'D’il y a 3 millions d’années'], e: 'Campement d’hommes de Cro-Magnon, reconstitué à partir du site de Pincevent (vers 14 000 ans av. J.-C.).' },
  { c: 'vie', r: [1, .09, .31, 'la légende de l’image de Pincevent'], q: 'À Pincevent, que fait-on avec les peaux des animaux ?', a: 'On les tanne', w: ['On les mange', 'On les peint en bleu'], e: 'Légende de Pincevent : 1 foyer, 2 taille du silex, 3 sagaie et propulseur, 4 tannage des peaux, 5 chasse.' },
  { c: 'vie', r: [15, .25, .33, '« Ils habitent dans des huttes… »'], q: 'Où habitent les nomades du Paléolithique ?', a: 'Dans des huttes, des grottes ou des tentes de peaux', w: ['Dans des maisons en dur', 'Dans des châteaux forts'], e: 'Pourchassant le gibier, ils n’ont pas d’habitat fixe : huttes, grottes ou tentes de peaux.' },
  { c: 'vie', r: [14, .18, .36, 'le biface « feuille de laurier »', .12, .3], q: 'Le biface « feuille de laurier » est taillé…', a: 'Sur les deux faces, pour être plus tranchant', w: ['Sur une seule face, pour faire joli', 'Il n’est pas taillé, il est moulé'], e: 'Le silex est taillé sur les deux faces pour le rendre plus tranchant.' },
  { c: 'vie', r: [14, .19, .33, 'la pointe de sagaie en silex', .24, .42], q: 'Qu’est-ce qui apparaît à l’époque des pointes de sagaie en silex ?', a: 'Les premiers arcs', w: ['Les premiers vélos', 'L’écriture'], e: 'Pointe de sagaie en silex (vers 19 000 - 16 500 av. J.-C.) : les premiers arcs apparaissent.' },
  { c: 'vie', r: [14, .74, .84, 'les objets trouvés autour du foyer', .17, .37], q: 'À quoi sert un grattoir ?', a: 'À retirer la chair de la peau du gibier', w: ['À se gratter le dos', 'À écrire sur les murs'], e: 'Grattoir : pour retirer la chair de la peau du gibier.' },
  { c: 'vie', r: [9, .61, .68, 'la correction en vert'], q: 'Pourquoi le feu était-il si important ?', a: 'Lumière, chaleur et protection contre les bêtes sauvages', w: ['Pour faire des feux d’artifice', 'Pour envoyer des messages'], e: 'Le foyer : source de lumière, de chaleur et de protection contre les bêtes sauvages.' },
  { c: 'vie', r: [1, .32, .38, 'le titre du document 3'], q: 'Une peinture « rupestre », c’est une peinture…', a: 'Sur la paroi d’une grotte', w: ['Sur une toile, dans un musée', 'Sur un mur de château'], e: 'Document 3 : la chasse au bison, peinture rupestre de la grotte de Niaux.' },
  { c: 'vie', r: [9, .52, .61, 'la réponse 3)'], q: 'Que trouve-t-on en fouillant les campements ?', a: 'Des bifaces, des grattoirs, des pointes de flèches', w: ['Des pièces de monnaie', 'Des fourchettes en métal'], e: 'On trouve des bifaces, des grattoirs et des pointes de flèches (et des aiguilles en os).' },

  // ===== 🌾 La révolution néolithique =====
  { c: 'neo', r: [2, .34, .54, 'le document 2 (le texte)', .03, .52], q: 'Qu’est-ce que la « révolution néolithique » ?', a: 'L’invention de l’agriculture et de l’élevage', w: ['L’invention de l’écriture', 'La découverte du feu'], e: 'Néolithique : agriculture, domestication des animaux, élevage… et les humains se fixent.' },
  { c: 'neo', r: [3, .44, .49, 'la réponse 5)'], q: 'Où apparaît le plus ancien foyer de la révolution néolithique ?', a: 'Au Proche-Orient', w: ['En Chine', 'Au Mexique'], e: 'Au Proche-Orient, vers 10 000 - 9 000 av. J.-C. (blé, orge, mouton, chèvre…).' },
  { c: 'neo', r: [2, .12, .19, 'la carte : Proche-Orient', .49, .66], q: 'Que cultive-t-on d’abord au Proche-Orient ?', a: 'Le blé et l’orge', w: ['Le maïs et l’avocat', 'La pomme de terre et le piment'], e: 'Proche-Orient : blé, orge. Mexique : maïs, avocat. Andes : pomme de terre, piment.' },
  { c: 'neo', r: [15, .415, .48, '« Vers 10 000 - 8000 av. J.-C. »'], q: 'Au Néolithique, les humains deviennent…', a: 'Sédentaires : ils fondent des villages', w: ['Nomades', 'Des chasseurs de mammouths'], e: 'Vers 10 000 - 8000 av. J.-C., ils cultivent la terre, deviennent sédentaires et fondent des villages.' },
  { c: 'neo', r: [3, .60, .81, 'la réponse 8)'], q: 'Qu’est-ce qui change au Néolithique ?', a: 'Maisons en dur, villages, outils en métal', w: ['Les humains apprennent à marcher debout', 'Les humains inventent l’ordinateur'], e: 'Maisons en dur, sédentarisation, urbanisation, plus de population, outils en métal…' },
  { c: 'neo', r: [2, .34, .54, 'la note 1 sous le texte', .03, .52], q: 'Un « boom démographique », c’est…', a: 'Une forte augmentation de la population', w: ['Une éruption de volcan', 'Un très gros orage'], e: 'La sédentarité permet un boom démographique : la population augmente fortement.' },
  { c: 'neo', r: [2, .34, .53, '« A RETENIR : Nature d’un document »', .55, .97], q: 'Un document avec une légende et des flèches sur le monde, c’est…', a: 'Une carte', w: ['Un article de presse', 'Un tableau'], e: 'Nature d’un document : carte, article de presse, tableau, interview, article de dictionnaire, extrait d’un site.' },
  { c: 'neo', r: [3, .12, .16, 'la réponse 2.'], q: 'Un entretien publié sur LePoint.fr, c’est…', a: 'Une interview dans un article de presse', w: ['Une carte', 'Un tableau'], e: 'Interview (entretien) publiée dans un article de journal : c’est sa nature.' },
  { c: 'neo', r: [2, .18, .24, 'la carte : Chine', .56, .68], q: 'Que cultive-t-on en Chine au Néolithique ?', a: 'Le riz et le millet', w: ['Le blé et l’orge', 'La pomme de terre'], e: 'Chine, 8 000 - 7 000 av. J.-C. : riz, millet… et on élève porc, chien, poulet.' },
  { c: 'neo', r: [2, .25, .31, 'la carte : Andes', .13, .28], q: 'Quels animaux domestique-t-on dans les Andes ?', a: 'Le lama, l’alpaga et le cobaye', w: ['Le mouton et la chèvre', 'Le kangourou'], e: 'Andes, 5 000 - 3 000 av. J.-C. : piment, pomme de terre, maïs… lama, alpaga et cobaye.' },
  { c: 'neo', r: [2, .18, .24, 'la carte : Chine', .56, .68], q: 'Vers quand l’agriculture apparaît-elle en Chine ?', a: 'Vers 8 000 - 7 000 av. J.-C.', w: ['Vers 2 000 - 1 000 av. J.-C.', 'En 1492'], e: 'Chine : 8 000 - 7 000 av. J.-C. C’est le n°2, juste après le Proche-Orient.' },
  { c: 'neo', r: [2, .15, .20, 'la carte : Est américain', .27, .42], q: 'Quel est le foyer le plus récent sur la carte ?', a: 'L’Est américain (2 000 - 1 000 av. J.-C.)', w: ['Le Proche-Orient', 'La Chine'], e: 'Du plus ancien au plus récent : Proche-Orient, Chine, Nouvelle-Guinée, Andes, Afrique, Est américain.' },
  { c: 'neo', r: [2, .34, .54, 'le document 2 (le texte)', .03, .52], q: 'Au Néolithique, que deviennent les huttes ?', a: 'Des maisons en dur', w: ['Des tentes en peaux', 'Des igloos'], e: 'Les huttes deviennent des maisons en dur. L’urbanisation débute.' },
  { c: 'neo', r: [2, .34, .54, 'le document 2 (le texte)', .03, .52], q: 'Pourquoi faut-il de nouveaux outils au Néolithique ?', a: 'Pour cultiver les champs', w: ['Pour chasser le mammouth', 'Pour écrire des livres'], e: 'Pour cultiver les champs, il faut des outils nouveaux : la pierre taillée ne suffit plus, on utilise les métaux.' },
  { c: 'neo', r: [2, .11, .21, 'la légende de la carte', .74, .91], q: 'Quelles activités se diffusent à partir des foyers néolithiques ?', a: 'L’agriculture et l’élevage', w: ['La chasse et la cueillette', 'La lecture et l’écriture'], e: 'Les flèches vertes de la carte : diffusion de l’agriculture et de l’élevage.' },
  { c: 'neo', r: [3, .16, .20, 'la réponse 3.'], q: 'Le thème du document 2 (l’interview), c’est…', a: 'La naissance de l’agriculture au Néolithique', w: ['Les migrations d’Homo erectus', 'La chasse au bison'], e: 'Le thème est la naissance de l’agriculture au Néolithique.' },
  { c: 'neo', r: [2, .34, .54, 'le document 2 (le texte)', .03, .52], q: 'Au Néolithique, qu’est-ce qui commence ?', a: 'L’urbanisation (les premières villes)', w: ['La bipédie', 'Les migrations vers l’Amérique'], e: 'Les huttes deviennent des maisons en dur : l’urbanisation débute.' },
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
