// ================= LE QUIZ D'ANGLAIS DE MISS TEACUP (questions tirées du cahier) =================
// Toutes les questions viennent des 7 photos d'anglais du cahier de Faustine (dans l'ordre d'envoi).
// r = [photo, haut, bas, ce qu'il faut regarder, gauche, droite] (fractions de la page)
const EN_CH = [
  { k: 'have', e: '✋', n: 'Le verbe have', s: 'have / has, don’t / doesn’t, Do / Does' },
  { k: 'voc', e: '✏️', n: 'Les fournitures', s: 'notebook, ruler, eraser…' },
  { k: 'art', e: '🔤', n: 'a, an… ou rien ?', s: 'Les articles' },
  { k: 'subj', e: '🏫', n: 'Les matières', s: 'School subjects' },
  { k: 'num', e: '🔢', n: 'Les nombres', s: 'Numbers' },
];
// où trouver un nombre sur la fiche « Numbers » (photo 7)
const EN_ROWS = [[.25, .28], [.29, .33], [.34, .37], [.385, .42], [.43, .47], [.48, .52], [.54, .57], [.59, .62], [.645, .675], [.70, .73]];
const EN_TENS = { 30: [.245, .28], 40: [.285, .32], 50: [.33, .365], 60: [.375, .41], 70: [.42, .455], 80: [.465, .50], 90: [.52, .55], 100: [.64, .67], 1000: [.69, .72], 1000000: [.73, .76] };
function enNumRef(n) {
  if (n >= 1 && n <= 10) return [7, ...EN_ROWS[n - 1], 'la colonne « 1 to 10 »', .05, .31];
  if (n >= 11 && n <= 20) return [7, ...EN_ROWS[n - 11], 'la colonne « 11 to 20 »', .32, .59];
  if (EN_TENS[n]) return [7, ...EN_TENS[n], n >= 100 ? '« Bigger numbers »' : 'la colonne « Tens »', .61, .90];
  return [7, .10, .76, 'la fiche « Numbers »'];
}
// la liste de l'exercice 2.1 (photo 2) : une ligne par fourniture
const EN_VOC = y => [2, y - .017, y + .017];
const EN_BANK = [
  // ===== ✋ Le verbe have =====
  { c: 'have', r: [5, .33, .37, 'la ligne She / He / It has (surlignée)', .06, .46], q: 'Complète : She ___ a ruler.', a: 'has', w: ['have', 'is'], e: 'Avec he, she, it : HAS. Avec I, you, we, they : HAVE.' },
  { c: 'have', r: [1, .43, .455, 'l’exercice 1.1, phrase 1'], q: 'Complète : I ___ a blue pen.', a: 'have', w: ['has', 'am'], e: 'I have · You have · He/She/It has · We have · They have.' },
  { c: 'have', r: [1, .49, .51, 'l’exercice 1.1, phrase 4'], q: 'Complète : My friend Tom ___ a pair of scissors.', a: 'has', w: ['have', 'haves'], e: 'My friend Tom = he → has.' },
  { c: 'have', r: [1, .47, .495, 'l’exercice 1.1, phrase 3'], q: 'Complète : We ___ two folders.', a: 'have', w: ['has', 'haves'], e: 'We → have. Seuls he, she, it prennent has.' },
  { c: 'have', r: [1, .525, .55, 'l’exercice 1.1, phrase 6'], q: 'Complète : The school ___ a gym.', a: 'has', w: ['have', 'are'], e: 'The school = it → has.' },
  { c: 'have', r: [1, .585, .61, 'l’exercice 1.2, phrase 1'], q: 'À la forme négative : « She has a binder. »', a: 'She doesn’t have a binder.', w: ['She don’t have a binder.', 'She doesn’t has a binder.'], e: 'Avec she : doesn’t + have (et plus jamais has après doesn’t !).' },
  { c: 'have', r: [1, .605, .63, 'l’exercice 1.2, phrase 2'], q: 'À la forme négative : « We have a glue stick. »', a: 'We don’t have a glue stick.', w: ['We doesn’t have a glue stick.', 'We don’t has a glue stick.'], e: 'Avec we : don’t have.' },
  { c: 'have', r: [1, .64, .665, 'l’exercice 1.2, phrase 4'], q: 'À la forme négative : « He has a ruler. »', a: 'He doesn’t have a ruler.', w: ['He don’t have a ruler.', 'He doesn’t has a ruler.'], e: 'He / She / It → doesn’t have.' },
  { c: 'have', r: [1, .806, .826, 'l’exercice 1.4, phrase 1'], q: 'Corrige l’erreur : « She have a red pen. »', a: 'She has a red pen.', w: ['She haves a red pen.', 'She is have a red pen.'], e: 'She → has.' },
  { c: 'have', r: [1, .824, .844, 'l’exercice 1.4, phrase 2'], q: 'Corrige l’erreur : « Do he have a notebook? »', a: 'Does he have a notebook?', w: ['Do he has a notebook?', 'Does he has a notebook?'], e: 'Question avec he, she, it : Does… have ?' },
  { c: 'have', r: [1, .841, .861, 'l’exercice 1.4, phrase 3'], q: 'Corrige l’erreur : « I don’t has a ruler. »', a: 'I don’t have a ruler.', w: ['I doesn’t have a ruler.', 'I don’t haves a ruler.'], e: 'Après don’t ou doesn’t, toujours have.' },
  { c: 'have', r: [5, .685, .715, '4 Attention ! (« seul l’auxiliaire suffit »)'], q: '« Do you have a pen? » — Oui :', a: 'Yes, I do.', w: ['Yes, I have.', 'Yes, I does.'], e: 'Pour répondre, seul l’auxiliaire suffit : Yes, I do. (C’était le piège de l’exercice 1.4 !)' },
  { c: 'have', r: [5, .58, .605, 'la 2e ligne de la forme interrogative'], q: '« Does she have a pencil pouch? » — Non :', a: 'No, she doesn’t.', w: ['No, she don’t.', 'No, she hasn’t.'], e: 'Yes, she does. / No, she doesn’t.' },
  { c: 'have', r: [5, .47, .61, '3 Forme interrogative'], q: 'Pour poser une question avec « she », on commence par…', a: 'Does', w: ['Do', 'Has'], e: 'Auxiliaire do / does + pronom sujet + have + complément + ?' },
  { c: 'have', r: [5, .22, .44, 'le tableau de la forme négative', .47, .91], q: '« I don’t have », en forme pleine (à l’écrit), c’est…', a: 'I do not have', w: ['I does not have', 'I not have'], e: 'Forme pleine à l’écrit : I do not have. Forme contractée à l’oral : I don’t have.' },
  { c: 'have', r: [1, .904, .924, 'l’exercice 1.5, phrase 1'], q: '« J’ai une trousse mais je n’ai pas de règle. »', a: 'I have a pencil pouch but I don’t have a ruler.', w: ['I have a pencil pouch too I don’t have a ruler.', 'I has a pencil pouch but I doesn’t have a ruler.'], e: 'Mais = but. On compare deux choses différentes.' },
  { c: 'have', r: [1, .925, .945, 'l’exercice 1.5, phrase 2'], q: '« Elle a des ciseaux aussi. »', a: 'She has scissors too.', w: ['She has too scissors.', 'She have scissors too.'], e: 'Too (aussi) se met à la fin de la phrase.' },
  { c: 'have', r: [5, .76, .85, 'la bulle « but et too »', .63, .92], q: 'Comment dit-on « aussi » en anglais ?', a: 'too', w: ['but', 'and'], e: 'But = mais (différence). Too = aussi (similitude).' },
  { c: 'have', r: [4, .86, .93, 'le point bonus (la correction en vert)'], q: '« J’ai aussi une règle. »', a: 'I have a ruler too.', w: ['I have too a ruler.', 'I has a ruler too.'], e: 'Too va à la fin : I have a ruler too.' },
  { c: 'have', r: [5, .655, .685, '4 Attention !'], q: 'En anglais, « tu » et « vous » se disent…', a: 'you, dans les deux cas', w: ['you et vous', 'thou et you'], e: 'Le tutoiement et le vouvoiement n’existent pas en anglais !' },
  { c: 'have', r: [4, .375, .405, 'le test, phrase 4 (la correction en rouge)'], q: '« Nous avons un surligneur. »', a: 'We have a highlighter.', w: ['We has a highlighter.', 'We have an highlighter.'], e: 'We → have. Et « a highlighter », pas « an ».' },
  { c: 'have', r: [4, .41, .44, 'le test, phrase 5'], q: '« Elles ont un stylo. »', a: 'They have a pen.', w: ['They has a pen.', 'She have a pen.'], e: 'Elles = they → have.' },
  { c: 'have', r: [4, .34, .37, 'le test, phrase 3'], q: '« Il a une règle. »', a: 'He has a ruler.', w: ['He have a ruler.', 'He is a ruler.'], e: 'He → has.' },
  { c: 'have', r: [4, .52, .555, 'le test, phrase 8'], q: '« Elle n’a pas de trousse. »', a: 'She doesn’t have a pencil pouch.', w: ['She don’t have a pencil pouch.', 'She doesn’t has a pencil pouch.'], e: 'She → doesn’t have.' },
  { c: 'have', r: [4, .565, .595, 'le test, phrase 9'], q: '« Nous n’avons pas de tube de colle. »', a: 'We don’t have a glue stick.', w: ['We doesn’t have a glue stick.', 'We don’t has a glue stick.'], e: 'We → don’t have.' },
  { c: 'have', r: [4, .60, .635, 'le test, phrase 10'], q: '« As-tu des crayons de couleur ? »', a: 'Do you have any colored pencils?', w: ['Does you have any colored pencils?', 'You have any colored pencils?'], e: 'Question avec you : Do you have… ?' },
  { c: 'have', r: [1, .746, .766, 'l’exercice 1.3, phrase 3'], q: 'they / earbuds ✓ — la question et la réponse :', a: 'Do they have earbuds? Yes, they do.', w: ['Does they have earbuds? Yes, they do.', 'Do they have earbuds? Yes, they have.'], e: 'They → Do… ? Yes, they do.' },
  { c: 'have', r: [1, .727, .747, 'l’exercice 1.3, phrase 2'], q: 'he / a ruler ✗ — la question et la réponse :', a: 'Does he have a ruler? No, he doesn’t.', w: ['Do he have a ruler? No, he doesn’t.', 'Does he have a ruler? No, he don’t.'], e: 'He → Does… ? No, he doesn’t.' },

  // ===== ✏️ Les fournitures =====
  { c: 'voc', r: [...EN_VOC(.35), 'l’exercice 2.1, ligne 1'], q: 'Comment dit-on « un cahier » ?', a: 'a notebook', w: ['a binder', 'a folder'], e: 'Un cahier = a notebook.' },
  { c: 'voc', r: [...EN_VOC(.38), 'l’exercice 2.1, ligne 2'], q: 'Comment dit-on « une pochette cartonnée » ?', a: 'a folder', w: ['a pencil pouch', 'a binder'], e: 'Une pochette cartonnée = a folder.' },
  { c: 'voc', r: [...EN_VOC(.415), 'l’exercice 2.1, ligne 3'], q: 'Comment dit-on « une trousse » ?', a: 'a pencil pouch', w: ['a pen', 'a binder'], e: 'Une trousse = a pencil pouch.' },
  { c: 'voc', r: [...EN_VOC(.445), 'l’exercice 2.1, ligne 4'], q: 'Comment dit-on « un crayon de couleur » ?', a: 'a colored pencil', w: ['a highlighter', 'a dry erase marker'], e: 'Un crayon de couleur = a colored pencil.' },
  { c: 'voc', r: [...EN_VOC(.48), 'l’exercice 2.1, ligne 5'], q: 'Comment dit-on « une paire de ciseaux » ?', a: 'a pair of scissors', w: ['a pair of rulers', 'a set of earbuds'], e: 'Une paire de ciseaux = a pair of scissors.' },
  { c: 'voc', r: [...EN_VOC(.51), 'l’exercice 2.1, ligne 6'], q: 'Comment dit-on « un classeur » ?', a: 'a binder', w: ['a folder', 'a notebook'], e: 'Un classeur = a binder.' },
  { c: 'voc', r: [...EN_VOC(.545), 'l’exercice 2.1, ligne 7'], q: 'Comment dit-on « un bâton de colle » ?', a: 'a glue stick', w: ['a stick glue', 'a highlighter'], e: 'Un bâton de colle = a glue stick (glue d’abord !).' },
  { c: 'voc', r: [...EN_VOC(.578), 'l’exercice 2.1, ligne 8'], q: 'Comment dit-on « un stylo » ?', a: 'a pen', w: ['a pencil', 'a ruler'], e: 'Un stylo = a pen.' },
  { c: 'voc', r: [...EN_VOC(.61), 'l’exercice 2.1, ligne 9'], q: 'Comment dit-on « des écouteurs » ?', a: 'a set of earbuds', w: ['a pair of scissors', 'a highlighter'], e: 'Des écouteurs = a set of earbuds.' },
  { c: 'voc', r: [...EN_VOC(.645), 'l’exercice 2.1, ligne 10'], q: 'Comment dit-on « un marqueur effaçable » ?', a: 'a dry erase marker', w: ['a highlighter', 'an eraser'], e: 'Un marqueur effaçable = a dry erase marker.' },
  { c: 'voc', r: [...EN_VOC(.677), 'l’exercice 2.1, ligne 11'], q: 'Comment dit-on « un surligneur » ?', a: 'a highlighter', w: ['a dry erase marker', 'a ruler'], e: 'Un surligneur = a highlighter.' },
  { c: 'voc', r: [...EN_VOC(.71), 'l’exercice 2.1, ligne 12'], q: 'Comment dit-on « une règle » ?', a: 'a ruler', w: ['a rule', 'an eraser'], e: 'Une règle (pour tracer) = a ruler.' },
  { c: 'voc', r: [...EN_VOC(.742), 'l’exercice 2.1, ligne 13'], q: 'Comment dit-on « une gomme » ?', a: 'an eraser', w: ['a eraser', 'a gum'], e: 'Une gomme = an eraser (an, car eraser commence par une voyelle).' },
  { c: 'voc', r: [6, .14, .25, 'la carte Vocabulary : « a folder »', .27, .37], q: '« a folder », c’est…', a: 'une pochette cartonnée', w: ['un classeur', 'une trousse'], e: 'A folder = une pochette cartonnée.' },
  { c: 'voc', r: [6, .14, .25, 'la carte Vocabulary : « a binder »', .72, .83], q: '« a binder », c’est…', a: 'un classeur', w: ['une pochette cartonnée', 'un cahier'], e: 'A binder = un classeur.' },
  { c: 'voc', r: [6, .14, .25, 'la carte Vocabulary : « colored pencils »', .50, .59], q: '« colored pencils », ce sont…', a: 'des crayons de couleur', w: ['des stylos', 'des surligneurs'], e: 'Colored pencils = des crayons de couleur.' },
  { c: 'voc', r: [6, .26, .365, 'la carte Vocabulary : « a highlighter »', .55, .65], q: '« a highlighter », c’est…', a: 'un surligneur', w: ['un marqueur effaçable', 'une lampe de poche'], e: 'A highlighter = un surligneur.' },
  { c: 'voc', r: [6, .26, .365, 'la carte Vocabulary : « a set of earbuds »', .35, .44], q: '« a set of earbuds », ce sont…', a: 'des écouteurs', w: ['des ciseaux', 'des crayons'], e: 'A set of earbuds = des écouteurs.' },

  // ===== 🔤 a, an… ou rien ? =====
  { c: 'art', r: [6, .725, .79, '« an + mot qui commence par une voyelle »'], q: 'Complète : ___ eraser', a: 'an', w: ['a', 'rien (Ø)'], e: 'An + mot qui commence par une voyelle : an eraser.' },
  { c: 'art', r: [6, .725, .79, 'l’exemple « an indigo pen »'], q: 'Complète : ___ indigo pen', a: 'an', w: ['a', 'rien (Ø)'], e: 'Indigo commence par une voyelle : an indigo pen.' },
  { c: 'art', r: [6, .675, .72, 'l’exemple « a book »'], q: 'Complète : ___ book', a: 'a', w: ['an', 'rien (Ø)'], e: 'A + mot qui commence par une consonne : a book.' },
  { c: 'art', r: [6, .675, .72, '« a + mot qui commence par une consonne »'], q: 'Complète : ___ ruler', a: 'a', w: ['an', 'rien (Ø)'], e: 'Ruler commence par une consonne : a ruler.' },
  { c: 'art', r: [4, .375, .405, 'le test, phrase 4 (la correction en rouge)'], q: 'Complète : We have ___ highlighter.', a: 'a', w: ['an', 'e'], e: 'H est une consonne : a highlighter. (Corrigé en rouge sur ton test !)' },
  { c: 'art', r: [6, .895, .925, '« Ø English is great »'], q: 'Complète : « ___ English is great! »', a: 'rien (Ø)', w: ['The', 'An'], e: 'Pas d’article pour une généralité : English is great!' },
  { c: 'art', r: [6, .935, .975, '« I have Ø books in my backpack »'], q: 'Complète : I have ___ books in my backpack.', a: 'rien (Ø)', w: ['a', 'an'], e: 'Au pluriel, pas d’article : I have books.' },
  { c: 'art', r: [6, .605, .655, 'le 1er point rose'], q: 'Pour présenter une chose pour la première fois, on utilise…', a: 'a ou an', w: ['the', 'rien (Ø)'], e: 'Pour présenter un élément la première fois : les articles indéfinis a et an (singulier).' },
  { c: 'art', r: [6, .725, .79, '« an + mot qui commence par une voyelle »'], q: '« an » se met devant un mot qui commence par…', a: 'une voyelle', w: ['une consonne', 'une majuscule'], e: 'A + consonne, an + voyelle.' },

  // ===== 🏫 Les matières =====
  { c: 'subj', r: [3, .605, .645, 'Horizontal 1', .21, .47], q: '« It is the subject about books, poems and novels. »', a: 'literature', w: ['history', 'art'], e: 'Books, poems and novels → literature.' },
  { c: 'subj', r: [3, .645, .68, 'Horizontal 3', .21, .47], q: '« It is the subject with images, video, music and computers. »', a: 'multimedia', w: ['technology', 'art'], e: 'Images, video, music, computers → multimedia.' },
  { c: 'subj', r: [3, .675, .71, 'Horizontal 5', .21, .47], q: '« It is the subject about machines, robots and computers. »', a: 'technology', w: ['multimedia', 'science'], e: 'Machines, robots, computers → technology.' },
  { c: 'subj', r: [3, .705, .755, 'Horizontal 10', .21, .47], q: '« It is the subject for sport and physical activity. »', a: 'PE', w: ['science', 'choir'], e: 'PE = Physical Education : le sport !' },
  { c: 'subj', r: [3, .755, .80, 'Horizontal 11', .21, .47], q: '« A class with a teacher to talk about school, projects and problems. »', a: 'advisory', w: ['choir', 'French'], e: 'Advisory : un cours avec un prof pour parler de l’école, des projets et des problèmes.' },
  { c: 'subj', r: [3, .805, .84, 'Horizontal 13', .21, .47], q: '« It is the subject with numbers, problems and geometry. »', a: 'math', w: ['science', 'geography'], e: 'Numbers, problems, geometry → math.' },
  { c: 'subj', r: [3, .835, .875, 'Horizontal 14', .21, .47], q: '« It is the subject about nature, animals, plants and experiments. »', a: 'science', w: ['geography', 'history'], e: 'Nature, animals, plants, experiments → science.' },
  { c: 'subj', r: [3, .87, .9, 'Horizontal 15', .21, .47], q: '« It is the language of France. »', a: 'French', w: ['English', 'German'], e: 'The language of France → French.' },
  { c: 'subj', r: [3, .605, .65, 'Vertical 2', .49, .75], q: '« It is the subject about God, Christian, Muslim and Jewish traditions. »', a: 'religion', w: ['history', 'literature'], e: 'God and traditions → religion.' },
  { c: 'subj', r: [3, .655, .69, 'Vertical 4', .49, .75], q: '« It is the subject about countries, maps, continents and nature. »', a: 'geography', w: ['history', 'science'], e: 'Countries, maps, continents → geography.' },
  { c: 'subj', r: [3, .69, .725, 'Vertical 6', .49, .75], q: '« It is a group of people who sing together. »', a: 'choir', w: ['art', 'PE'], e: 'People who sing together → choir (la chorale).' },
  { c: 'subj', r: [3, .72, .75, 'Vertical 7', .49, .75], q: '« It is the language of England and the United States. »', a: 'English', w: ['French', 'German'], e: 'England and the United States → English.' },
  { c: 'subj', r: [3, .75, .78, 'Vertical 8', .49, .75], q: '« It is the language of Germany. »', a: 'German', w: ['English', 'French'], e: 'Germany → German (l’allemand, noté « almand » en haut de la page !).' },
  { c: 'subj', r: [3, .775, .805, 'Vertical 9', .49, .75], q: '« It is the subject about the past, important events and people. »', a: 'history', w: ['geography', 'literature'], e: 'The past, important events → history.' },
  { c: 'subj', r: [3, .805, .84, 'Vertical 11', .49, .75], q: '« It is the subject with colors, pictures and artists. »', a: 'art', w: ['multimedia', 'literature'], e: 'Colors, pictures, artists → art.' },
  { c: 'subj', r: [3, .02, .07, 'la liste des matières, en haut (« almand »)'], q: 'Comment dit-on « l’allemand » ?', a: 'German', w: ['English', 'French'], e: 'L’allemand = German.' },
  { c: 'subj', r: [2, .78, .88, 'l’exercice 2.2'], q: 'Remets les lettres dans l’ordre : GENSLIH', a: 'English', w: ['German', 'French'], e: 'GENSLIH → ENGLISH.' },
  { c: 'subj', r: [2, .78, .88, 'l’exercice 2.2'], q: 'Remets les lettres dans l’ordre : SHATM', a: 'math', w: ['science', 'art'], e: 'SHATM → MATHS / MATH.' },
  { c: 'subj', r: [2, .78, .88, 'l’exercice 2.2'], q: 'Remets les lettres dans l’ordre : RHOTSYI', a: 'history', w: ['geography', 'choir'], e: 'RHOTSYI → HISTORY.' },
  { c: 'subj', r: [2, .78, .88, 'l’exercice 2.2'], q: 'Remets les lettres dans l’ordre : HGPOGRAYE', a: 'geography', w: ['history', 'technology'], e: 'HGPOGRAYE → GEOGRAPHY.' },
  { c: 'subj', r: [2, .78, .88, 'l’exercice 2.2'], q: 'Remets les lettres dans l’ordre : ULTEIRTRAE', a: 'literature', w: ['multimedia', 'science'], e: 'ULTEIRTRAE → LITERATURE.' },

  // ===== 🔢 Les nombres =====
  { c: 'num', r: enNumRef(3), q: 'Comment dit-on 3 en anglais ?', a: 'three', w: ['thirteen', 'thirty'], e: '3 = three, 13 = thirteen, 30 = thirty.' },
  { c: 'num', r: enNumRef(8), q: 'Comment dit-on 8 en anglais ?', a: 'eight', w: ['eighteen', 'eighty'], e: '8 = eight, 18 = eighteen, 80 = eighty.' },
  { c: 'num', r: enNumRef(12), q: 'Comment dit-on 12 en anglais ?', a: 'twelve', w: ['twenty', 'two'], e: '12 = twelve, 20 = twenty, 2 = two.' },
  { c: 'num', r: enNumRef(13), q: 'Comment dit-on 13 en anglais ?', a: 'thirteen', w: ['thirty', 'three'], e: 'De 13 à 19 : -teen. Les dizaines : -ty.' },
  { c: 'num', r: enNumRef(15), q: 'Comment dit-on 15 en anglais ?', a: 'fifteen', w: ['fifty', 'five'], e: '15 = fifteen, 50 = fifty.' },
  { c: 'num', r: enNumRef(18), q: 'Comment dit-on 18 en anglais ?', a: 'eighteen', w: ['eighty', 'eight'], e: '18 = eighteen, 80 = eighty.' },
  { c: 'num', r: enNumRef(20), q: 'Comment dit-on 20 en anglais ?', a: 'twenty', w: ['twelve', 'two'], e: '20 = twenty (le -ty est surligné sur ta fiche !).' },
  { c: 'num', r: enNumRef(40), q: 'Comment dit-on 40 en anglais ?', a: 'forty', w: ['fourteen', 'four'], e: '40 = forty. 14 = fourteen.' },
  { c: 'num', r: enNumRef(50), q: 'Comment dit-on 50 en anglais ?', a: 'fifty', w: ['fifteen', 'five'], e: '50 = fifty, 15 = fifteen.' },
  { c: 'num', r: enNumRef(90), q: 'Comment dit-on 90 en anglais ?', a: 'ninety', w: ['nineteen', 'nine'], e: '90 = ninety, 19 = nineteen.' },
  { c: 'num', r: enNumRef(100), q: 'Sur ta fiche, comment dit-on 100 ?', a: 'hundred', w: ['thousand', 'million'], e: '100 = hundred, 1,000 = thousand, 1,000,000 = million.' },
  { c: 'num', r: enNumRef(1000), q: 'Sur ta fiche, comment dit-on 1,000 ?', a: 'thousand', w: ['hundred', 'million'], e: '1,000 = thousand.' },
  { c: 'num', r: enNumRef(1000000), q: 'Sur ta fiche, comment dit-on 1,000,000 ?', a: 'million', w: ['thousand', 'hundred'], e: '1,000,000 = million.' },
  { c: 'num', r: enNumRef(11), q: '« eleven », c’est…', a: '11', w: ['7', '12'], e: 'Eleven = 11, seven = 7, twelve = 12.' },
  { c: 'num', r: enNumRef(70), q: '« seventy », c’est…', a: '70', w: ['17', '7'], e: 'Seventy = 70, seventeen = 17.' },
  { c: 'num', r: enNumRef(14), q: '« fourteen », c’est…', a: '14', w: ['40', '4'], e: 'Fourteen = 14, forty = 40.' },
  { c: 'num', r: enNumRef(60), q: '« sixty », c’est…', a: '60', w: ['16', '6'], e: 'Sixty = 60, sixteen = 16.' },
  { c: 'num', r: enNumRef(40), q: 'Comment s’écrit 40 ?', a: 'forty', w: ['fourty', 'fortey'], e: 'Forty, sans u ! (mais fourteen avec un u).' },
  { c: 'num', r: [7, .19, .73, 'la colonne « 11 to 20 »', .32, .59], q: 'De 13 à 19, les nombres finissent par…', a: '-teen', w: ['-ty', '-ten'], e: 'Thirteen, fourteen… nineteen : -teen.' },
  { c: 'num', r: [7, .19, .55, 'la colonne « Tens (30 to 90) »', .61, .90], q: 'Les dizaines (30, 40, 50…) finissent par…', a: '-ty', w: ['-teen', '-ten'], e: 'Thirty, forty, fifty… ninety : -ty.' },
];
// ---------- où revérifier, pour la leçon de Miss Teacup en jeu ----------
function lsRefFor(q) {
  if (!q || q.day) return null;
  if (q.r) return q.r;
  if (q.num) return [7, .10, .76, 'la fiche « Numbers »'];
  const s = q.en || '';
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\w+teen|\w+ty|hundred|thousand|million)\b/.test(s)) return [7, .10, .76, 'la fiche « Numbers »'];
  if (/English is great/.test(s)) return [6, .895, .925, '« Ø English is great »'];
  if (/books in my backpack/.test(s)) return [6, .935, .975, '« I have Ø books in my backpack »'];
  if (/ too\.| but /.test(s)) return [5, .74, .93, '5 Je peux donner des exemples (but / too)'];
  if (/^(Do|Does)\b/.test(s)) return [5, .47, .61, '3 Forme interrogative'];
  if (/\b(don’t|doesn’t)\b/.test(s)) return [5, .22, .44, 'le tableau de la forme négative', .47, .91];
  if (/\b(history|English|PE|math|geography|German|choir|science|French)\b/.test(s)) return [3, .02, .07, 'la liste des matières, en haut'];
  if (/ is (blue|white|red|yellow|green)/.test(s)) return [2, .89, .99, 'l’exercice 2.3 (les couleurs)'];
  if (/\bhas\b/.test(s)) return [5, .33, .37, 'la ligne She / He / It has', .06, .46];
  if (/\bhave\b/.test(s)) return [5, .27, .44, 'le tableau de la forme affirmative', .06, .46];
  return null;
}
