// ================= LA LEÇON D'ANGLAIS DE MISS TEACUP =================
// Attrapé·e par la prof d'anglais : elle pose une question (« Comment dit-on en anglais… ? »).
// 3 réponses au choix (ou l'écrire soi-même, réponse approximative acceptée).
// Bonne réponse : elle te laisse filer et t'offre un objet magique au hasard.
// Faute : elle corrige… et confisque tous tes objets magiques. Au bout de 3 leçons : heure de colle !
//
// Réponses : {a|b} = au choix, [x] = facultatif. Contractions, majuscules, ponctuation,
// « 2 p.m. / 2pm / two pm », colour/color, maths/math… sont acceptés automatiquement.
const LESSON_MAX = 3;
const LESSON_BANK = [
  // --- have / has ---
  { fr: 'J’ai un cahier.', en: 'I have a notebook.', p: 'i {have|have got} a {notebook|spiral notebook|composition notebook|exercise book}' },
  { fr: 'Tu as un stylo.', en: 'You have a pen.', p: 'you {have|have got} a pen' },
  { fr: 'Elle a une règle.', en: 'She has a ruler.', p: 'she {has|has got} a ruler' },
  { fr: 'Il a un surligneur.', en: 'He has a highlighter.', p: 'he {has|has got} a highlighter' },
  { fr: 'Nous avons un classeur.', en: 'We have a binder.', p: 'we {have|have got} a [ring ]binder' },
  { fr: 'Ils ont des crayons de couleur.', en: 'They have colored pencils.', p: 'they {have|have got} [some ]{colored|coloring|color} pencils' },
  { fr: 'J’ai une gomme.', en: 'I have an eraser.', p: 'i {have|have got} {an eraser|a rubber}' },
  { fr: 'Elle a une paire de ciseaux.', en: 'She has a pair of scissors.', p: 'she {has|has got} {a pair of scissors|scissors}' },
  { fr: 'Mon ami Tom a un bâton de colle.', en: 'My friend Tom has a glue stick.', p: 'my friend tom {has|has got} a glue stick' },
  { fr: 'Ils ont des écouteurs.', en: 'They have earbuds.', p: 'they {have|have got} [some |a set of ]{earbuds|earphones|headphones}' },
  { fr: 'J’ai un stylo indigo.', en: 'I have an indigo pen.', p: 'i {have|have got} an indigo pen' },
  { fr: 'Tu as un feutre effaçable.', en: 'You have a dry erase marker.', p: 'you {have|have got} a {dry erase|whiteboard|erasable} marker' },
  { fr: 'Nous avons une pochette cartonnée.', en: 'We have a folder.', p: 'we {have|have got} a folder' },
  // --- forme négative ---
  { fr: 'Je n’ai pas de classeur.', en: 'I don’t have a binder.', p: 'i {do not have|have not got} {a|any} [ring ]binder' },
  { fr: 'Elle n’a pas de trousse.', en: 'She doesn’t have a pencil pouch.', p: 'she {does not have|has not got} {a|any} {pencil pouch|pencil case}' },
  { fr: 'Il n’a pas de règle.', en: 'He doesn’t have a ruler.', p: 'he {does not have|has not got} {a|any} ruler' },
  { fr: 'Nous n’avons pas de bâton de colle.', en: 'We don’t have a glue stick.', p: 'we {do not have|have not got} {a|any} glue stick' },
  { fr: 'Tu n’as pas de gomme.', en: 'You don’t have an eraser.', p: 'you {do not have|have not got} {an eraser|any eraser|a rubber|any rubber}' },
  { fr: 'Ils n’ont pas de cahier.', en: 'They don’t have a notebook.', p: 'they {do not have|have not got} {a|any} {notebook|exercise book}' },
  { fr: 'Mon chat n’a pas de stylo !', en: 'My cat doesn’t have a pen!', p: 'my cat {does not have|has not got} {a|any} pen' },
  // --- questions et réponses courtes ---
  { fr: 'Est-ce que tu as un stylo ? — Oui.', en: 'Do you have a pen? Yes, I do.', p: '{do you have a pen yes i do|have you got a pen yes i have}' },
  { fr: 'Est-ce qu’elle a une trousse ? — Non.', en: 'Does she have a pencil pouch? No, she doesn’t.', p: '{does she have {a|any} {pencil pouch|pencil case} no she does not|has she got {a|any} {pencil pouch|pencil case} no she has not}' },
  { fr: 'As-tu des crayons de couleur ?', en: 'Do you have colored pencils?', p: '{do you have|have you got} [any |some ]{colored|coloring|color} pencils' },
  { fr: 'Est-ce qu’il a un surligneur ? — Non.', en: 'Does he have a highlighter? No, he doesn’t.', p: '{does he have {a|any} highlighter no he does not|has he got {a|any} highlighter no he has not}' },
  { fr: 'Est-ce qu’ils ont des écouteurs ? — Oui.', en: 'Do they have earbuds? Yes, they do.', p: '{do they have [any |some ]{earbuds|earphones} yes they do|have they got [any |some ]{earbuds|earphones} yes they have}' },
  { fr: 'Est-ce que tu as un cahier ? — Oui.', en: 'Do you have a notebook? Yes, I do.', p: '{do you have a notebook yes i do|have you got a notebook yes i have}' },
  // --- but / too ---
  { fr: 'J’ai aussi une règle.', en: 'I have a ruler too.', p: '{i {have|have got} a ruler too|i also have a ruler|i have also got a ruler}' },
  { fr: 'Elle a des ciseaux aussi.', en: 'She has scissors too.', p: '{she {has|has got} {scissors|a pair of scissors} too|she also has {scissors|a pair of scissors}}' },
  { fr: 'J’ai une trousse mais je n’ai pas de règle.', en: 'I have a pencil pouch but I don’t have a ruler.', p: 'i {have|have got} a {pencil pouch|pencil case} but i {do not have|have not got} {a|any} ruler' },
  { fr: 'Il a un cahier mais il n’a pas de stylo.', en: 'He has a notebook but he doesn’t have a pen.', p: 'he {has|has got} a notebook but he {does not have|has not got} {a|any} pen' },
  // --- matières et heures ---
  { fr: 'Ils ont histoire à 2 h de l’aprèm.', en: 'They have history at 2 p.m.', p: 'they {have|have got} history at {2 pm|2|2 oclock|2 in the afternoon|2 oclock in the afternoon|14}' },
  { fr: 'J’ai anglais à 10 heures.', en: 'I have English at 10 o’clock.', p: 'i {have|have got} english at {10|10 oclock|10 am|10 in the morning|10 oclock in the morning}' },
  { fr: 'Nous avons sport à 3 heures.', en: 'We have PE at 3 o’clock.', p: 'we {have|have got} {pe|p e|sport|sports|physical education} at {3|3 oclock|3 pm|15|3 in the afternoon}' },
  { fr: 'Elle a maths le matin.', en: 'She has math in the morning.', p: 'she {has|has got} math in the morning' },
  { fr: 'Tu as géographie aujourd’hui ?', en: 'Do you have geography today?', p: '{do you have|have you got} geography today' },
  { fr: 'Il n’a pas allemand.', en: 'He doesn’t have German.', p: 'he {does not have|has not got} german' },
  { fr: 'Est-ce qu’elle a chorale ? — Oui.', en: 'Does she have choir? Yes, she does.', p: '{does she have choir yes she does|has she got choir yes she has}' },
  { fr: 'Nous avons sciences et technologie.', en: 'We have science and technology.', p: 'we {have|have got} science and {technology|techno}' },
  { fr: 'J’ai français à 9 heures.', en: 'I have French at 9 o’clock.', p: 'i {have|have got} french at {9|9 oclock|9 am|9 in the morning}' },
  // --- articles ---
  { fr: 'L’anglais, c’est génial !', en: 'English is great!', p: 'english is {great|cool|awesome|super|fantastic}' },
  { fr: 'J’ai des livres dans mon sac à dos.', en: 'I have books in my backpack.', p: 'i {have|have got} [some ]books in my {backpack|bag|schoolbag|school bag|rucksack}' },
  // --- couleurs ---
  { fr: 'Le ciel est bleu.', en: 'The sky is blue.', p: 'the sky is blue' },
  { fr: 'La neige est blanche.', en: 'Snow is white.', p: '[the ]snow is white' },
  { fr: 'Mon stylo est rouge.', en: 'My pen is red.', p: 'my pen is red' },
  { fr: 'Elle a un classeur vert.', en: 'She has a green binder.', p: 'she {has|has got} a green [ring ]binder' },
  { fr: 'J’ai un surligneur jaune.', en: 'I have a yellow highlighter.', p: 'i {have|have got} a yellow highlighter' },
  { fr: 'La banane est jaune.', en: 'The banana is yellow.', p: '{the banana is|a banana is|bananas are} yellow' },
];
// mots « de grammaire » : une faute dessus n'est jamais une simple faute de frappe
const LS_KEYW = new Set(['a', 'an', 'the', 'have', 'has', 'do', 'does', 'not', 'is', 'are', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'at', 'in', 'too', 'but', 'and', 'my', 'yes', 'no', 'got', 'any', 'some', 'also', 'of']);
const LS_DAYS = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const LS_DAYS_FR = new Set(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']);
const NUM_W = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'one hundred', 1000: 'one thousand', 1000000: 'one million' };
const LS_NUM = {}; Object.keys(NUM_W).forEach(n => { if (n < 100) LS_NUM[NUM_W[n]] = +n; });
const LS_NUMW = new Set(Object.keys(LS_NUM).concat(['hundred', 'thousand', 'million']));

// {a|b} et [x] -> toutes les phrases possibles
function lsExpand(p) {
  let i = 0;
  const cross = (a, b) => { const o = []; for (const x of a) for (const y of b) { if (o.length < 600) o.push(x + y); } return o; };
  const seq = stop => {
    let res = [''];
    while (i < p.length && !stop.includes(p[i])) {
      const ch = p[i];
      if (ch === '{') { i++; const alts = []; for (;;) { alts.push(...seq('|}')); if (p[i] === '|') { i++; continue; } i++; break; } res = cross(res, alts); }
      else if (ch === '[') { i++; const alts = []; for (;;) { alts.push(...seq('|]')); if (p[i] === '|') { i++; continue; } i++; break; } res = cross(res, ['', ...alts]); }
      else { res = res.map(r => r + ch); i++; }
    }
    return res;
  };
  return seq('');
}
function lsNorm(s, keepNum) {
  let t = ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + ' ';
  t = t.replace(/[’‘`´]/g, "'").replace(/[-_]/g, ' ');
  t = t.replace(/(\d{1,2})\s*h\s*(\d{2})?(?![a-z])/g, (m, a, b) => ' ' + a + (b && b !== '00' ? ' ' + b : '') + ' ');
  t = t.replace(/(\d{1,2}):(\d{2})/g, (m, a, b) => a + (b === '00' ? '' : ' ' + b));
  if (!keepNum) t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g, m => LS_NUM[m]);
  t = t.replace(/(\d)\s*([ap])\s*\.?\s*m\b\.?/g, '$1 $2m ');
  [[/\bdoesn'?t\b/g, 'does not'], [/\bdon'?t\b/g, 'do not'], [/\bhasn'?t\b/g, 'has not'], [/\bhaven'?t\b/g, 'have not'], [/\bisn'?t\b/g, 'is not'], [/\baren'?t\b/g, 'are not'],
   [/\b(i|you|we|they)'ve\b/g, '$1 have'], [/\b(he|she|it)'s got\b/g, '$1 has got'], [/\bit's\b/g, 'it is'], [/\bi'm\b/g, 'i am'], [/\bo\s*'?\s*clock\b/g, 'oclock'],
   [/colour/g, 'color'], [/\bmaths\b/g, 'math'], [/\bgrey\b/g, 'gray']].forEach(([a, b]) => { t = t.replace(a, b); });
  return t.replace(/'/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function lsLev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  // Damerau (deux lettres inversées = une seule faute)
  let pp = null;
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1); } pp = prev; prev = cur; }
  return prev[n];
}
// mêmes mots à quelques fautes de frappe près ? -> liste des fautes, sinon null
function lsTypos(a, v) {
  const A = a.split(' '), V = v.split(' '); if (A.length !== V.length) return null;
  const out = [];
  for (let k = 0; k < A.length; k++) {
    if (A[k] === V[k]) continue;
    if (LS_KEYW.has(A[k]) || LS_KEYW.has(V[k]) || /\d/.test(A[k] + V[k])) return null;   // pas de « presque » pour les chiffres
    if (LS_DAYS.has(A[k].replace(/s$/, '')) || LS_DAYS_FR.has(A[k]) || LS_NUMW.has(A[k])) return null;   // un autre jour / nombre n'est pas une faute de frappe
    const L = V[k].length, lim = L >= 7 ? 2 : L >= 4 ? 1 : 0;
    if (lsLev(A[k], V[k]) > lim) return null;
    out.push([A[k], V[k]]); if (out.length > 2) return null;
  }
  return out;
}
function lsVars(q) { if (!q.vars) q.vars = [...new Set(lsExpand(q.p).map(x => lsNorm(x, q.num)))]; return q.vars; }
function lsCheck(answer, q) {
  const a = lsNorm(answer, q.num); if (!a) return { ok: false, empty: true };
  const vs = lsVars(q);
  if (vs.includes(a)) return { ok: true, typos: [] };
  let best = null; for (const v of vs) { const t = lsTypos(a, v); if (t && (!best || t.length < best.length)) best = t; }
  if (best) return { ok: true, typos: best };
  return { ok: false, hint: lsHint(a, q) };
}
// petit rappel de la leçon selon l'erreur
function lsHint(a, q) {
  const en = lsNorm(q.en);
  if (q.num) {
    if (q.spell) return 'Attention à l’orthographe : ' + q.en + '.';
    return '13 à 19 finissent en -teen (thirteen), les dizaines en -ty (thirty). Attention : fifteen, fifty, forty (sans u) !';
  }
  if (/\b(i|you|he|she|we|they) (have|has) [0-9]+ years\b/.test(a)) return 'Pour l’âge, on utilise be : I am eleven (pas « I have eleven years »).';
  if (q.day) {
    if (/\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/.test(a)) return 'Avec un jour, on dit on : on Monday, on Friday…';
    if (q.spell) return 'Attention à l’orthographe : ' + q.en + ' (avec une majuscule !).';
    if (q.toFr) return 'Monday = lundi, Tuesday = mardi, Wednesday = mercredi, Thursday = jeudi, Friday = vendredi, Saturday = samedi, Sunday = dimanche.';
    if (q.next) return 'Dans l’ordre : Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.';
    if (!/\s/.test(q.en)) return 'Les jours : Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.';
  }
  if (/\b(he|she|it|tom|cat|friend)\b( [a-z]+)? do not have\b/.test(a)) return 'Avec he / she / it, on dit doesn’t have (does not have).';
  if (/\bdoes not has\b|\bdoes [a-z]+ has\b|\bdoesnt has\b/.test(a)) return 'Après does / doesn’t, on garde have : She doesn’t have…';
  if (/\b(i|you|we|they) has\b/.test(a)) return 'I / you / we / they → have.';
  if (/\b(he|she|it|tom|cat) have\b/.test(a) && !/\bdoes\b/.test(a)) return 'He / she / it → has !';
  if (/\ba (eraser|indigo|apple|orange|english)\b/.test(a)) return 'Devant une voyelle, on met an : an eraser, an indigo pen.';
  if (/\ban (pen|ruler|notebook|binder|highlighter|glue|pencil|green|yellow|red|folder)\b/.test(a)) return 'Devant une consonne, on met a : a pen, a ruler.';
  if (/\b(have|has) too\b|\btoo (a|an)\b/.test(a)) return 'too se met à la fin : I have a ruler too.';
  if (/^(do|does)\b/.test(en) && !/^(do|does|have|has)\b/.test(a)) return 'Pour poser une question : Do / Does + sujet + have… ?';
  if (/\b(yes|no)\b/.test(en) && !/\b(yes|no)\b/.test(a)) return 'N’oublie pas la réponse courte : Yes, I do. / No, she doesn’t.';
  if (/\bthe (english|history|math|french|german|science|geography)\b/.test(a)) return 'Pas d’article devant une matière : I have English.';
  return 'Compare bien ta phrase avec celle de Miss Teacup !';
}

// ---------- déroulé dans le jeu ----------
function lessonStart(reason) {
  const P = G.P, T = G.T, I = G.inf;
  if (P.hidden) unhide();
  P.busy = null; P.moving = false; P.running = false;
  G.lessons = (G.lessons || 0) + 1;
  T.state = 'release'; T.st = 99; T.moving = false; T.path = null; T.detect = 0; if (T.det) T.det = {};
  T.ang = Math.atan2(P.y - T.y, P.x - T.x); T.face = faceFromAng(T.ang); P.face = faceFromAng(T.ang + Math.PI);
  T.bubble = { text: reason === 'found' ? 'Found you! English lesson!' : 'Got you! English lesson!', t: 0, dur: 2.2 };
  AU.sayEn(T.bubble.text, T.prof); AU.sfx('caught', 0.55); G.shake = 0.3; FX.comic = { t: 0, text: 'ENGLISH LESSON !' };
  puff((P.x + T.x) / 2, (P.y + T.y) / 2 - 10, 14, '#ffffff');
  if (G.net) { P.lesson = true; } else { G.mode = 'lesson'; }
  const n = G.lessons;
  setTimeout(() => { if (G.mode === 'lesson' || P.lesson) Lesson.open(T.prof, n, (ok, lost, gift) => lessonEnd(ok, lost, gift)); }, 650);
}
function lessonEnd(ok, lost, gift) {
  const P = G.P, T = G.T, I = G.inf;
  P.lesson = false;
  if (!(G.inf && G.inf.coop && !G.inf.auth)) { T.state = 'release'; T.st = 2.6; }
  T.bubble = { text: ok ? pick(['Very good! Off you go!', 'Well done! Go back to class!', 'Excellent! You can go…']) : pick(['Practice makes perfect!', 'Revise your lesson, please!']), t: 0, dur: 2.4 };
  AU.sayEn(T.bubble.text, T.prof);
  if (I) {
    I.hunt = false; I.warn = Math.min(I.warn, 2); I.grace = Math.max(I.grace || 0, 3); I.hideT = 0; UI.infSig = null;
    if (I.coop) { Net.send({ t: 'twarn', n: I.warn, hunt: 0, you: 0, text: '', silent: 1 }); Net.send({ t: 'lessonDone', ok: ok ? 1 : 0 }); }
  }
  if (!G.net) G.mode = 'play';
  UI.hudSig = null; UI.invSig = null;
  if (lost && lost.length) toast('🎒 Miss Teacup a confisqué : ' + lost.map(k => ITEMS[k].n).join(', '), 3);
  if (gift) { toast('🎁 Cadeau de Miss Teacup : ' + ITEMS[gift].n + ' ! ' + ITEMS[gift].d, 3.4); FX.flyers.push({ kind: gift, slot: P.inv.length - 1, wx: P.x, wy: P.y - 20, t: 0 }); sparkle(P.x, P.y - 14, 14); }
  if (G.lessons >= LESSON_MAX) setTimeout(() => toast('⚠️ Plus de leçon de rattrapage : la prochaine fois, c’est l’heure de colle !', 3), 1200);
}

// ---------- les jours de la semaine (questions fabriquées à la volée) ----------
const DAYS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_BAD = { Monday: ['Munday', 'Mondey'], Tuesday: ['Tusday', 'Teusday'], Wednesday: ['Wensday', 'Wednesdey'], Thursday: ['Thirsday', 'Tursday'], Friday: ['Fryday', 'Fridey'], Saturday: ['Saterday', 'Saturdey'], Sunday: ['Sonday', 'Sundey'] };
const DAYS_TWIN = [6, 3, 1, 1, 5, 6, 5];   // le jour qu'on confond le plus souvent (Tuesday ↔ Thursday…)
const DAY_SENT = [
  (d, D, D2) => ({ fr: 'J’ai anglais le ' + d + '.', en: 'I have English on ' + D + '.', p: 'i {have|have got} english on ' + D + '[s]', c: ['I have English in ' + D + '.', 'I have English on ' + D2 + '.'] }),
  (d, D, D2) => ({ fr: 'Nous avons sport le ' + d + '.', en: 'We have PE on ' + D + '.', p: 'we {have|have got} {pe|p e|sport|sports} on ' + D + '[s]', c: ['We has PE on ' + D + '.', 'We have PE on ' + D2 + '.'] }),
  (d, D, D2) => ({ fr: 'Elle a chorale le ' + d + '.', en: 'She has choir on ' + D + '.', p: 'she {has|has got} choir on ' + D + '[s]', c: ['She have choir on ' + D + '.', 'She has choir in ' + D + '.'] }),
  (d, D, D2) => ({ fr: 'Il n’a pas école le ' + d + '.', en: 'He doesn’t have school on ' + D + '.', p: 'he {does not have|has not got} school on ' + D + '[s]', c: ['He don’t have school on ' + D + '.', 'He doesn’t have school on ' + D2 + '.'] }),
  (d, D, D2) => ({ fr: 'Est-ce que tu as maths le ' + d + ' ? — Oui.', en: 'Do you have math on ' + D + '? Yes, I do.', p: '{do you have math on ' + D + '[s] yes i do|have you got math on ' + D + '[s] yes i have}', c: ['Does you have math on ' + D + '? Yes, I do.', 'Do you have math on ' + D + '? Yes, I have.'] }),
  (d, D, D2) => ({ fr: 'Ils ont histoire le ' + d + ' matin.', en: 'They have history on ' + D + ' morning.', p: 'they {have|have got} history on ' + D + '[s] morning[s]', c: ['They has history on ' + D + ' morning.', 'They have history on ' + D2 + ' morning.'] }),
];
function lsDayQ() {
  const i = Math.floor(Math.random() * 7), D = DAYS_EN[i], d = DAYS_FR[i], tw = DAYS_TWIN[i];
  let o; do { o = Math.floor(Math.random() * 7); } while (o === i || o === tw);
  switch (Math.floor(Math.random() * 5)) {
    case 0: return { day: 1, show: '« ' + d + ' »', ask: 'Days of the week! Comment dit-on ce jour en anglais ?', en: D, p: D, c: [DAYS_EN[tw], DAYS_EN[o]] };
    case 1: return { day: 1, spell: 1, show: '« ' + d + ' »', ask: 'Spelling! Comment s’écrit ce jour en anglais ?', en: D, p: D, c: DAYS_BAD[D].slice() };
    case 2: return { day: 1, toFr: 1, show: '« ' + D + ' »', ask: 'What does it mean? Que veut dire ce jour ?', en: d, p: d, c: [DAYS_FR[tw], DAYS_FR[o]] };
    case 3: { const n = (i + 1) % 7; return { day: 1, next: 1, show: 'Quel jour vient après « ' + D + ' » ?', ask: 'What day comes after…?', en: DAYS_EN[n], p: DAYS_EN[n], c: [DAYS_EN[(i + 6) % 7], DAYS_EN[(i + 2) % 7]] }; }
    default: return Object.assign({ day: 1 }, pick(DAY_SENT)(d, D, DAYS_EN[DAYS_TWIN[i]]));
  }
}
// ---------- les nombres ----------
const NUM_BAD = { 2: ['tow', 'to'], 3: ['tree', 'thre'], 5: ['fiv', 'fife'], 7: ['sevin', 'seveen'], 8: ['eigth', 'eihgt'], 9: ['nin', 'nien'], 11: ['elevin', 'eleveen'], 12: ['twelf', 'twelv'], 13: ['threeteen', 'thirdteen'], 14: ['forteen', 'fourtheen'], 15: ['fiveteen', 'fivteen'], 18: ['eightteen', 'eigthteen'], 20: ['twoty', 'twenti'], 30: ['threety', 'thirdy'], 40: ['fourty', 'fourthy'], 50: ['fivety', 'fivty'], 80: ['eightty', 'eigthy'], 90: ['ninty', 'nynety'], 1000: ['one tousand', 'one thousend'] };
// les pièges : -teen / -ty / l'unité
function lsNumTwins(n) {
  if (n >= 13 && n <= 19) return [(n - 10) * 10, n - 10];
  if (n >= 30 && n <= 90) return [n / 10 + 10, n / 10];
  if (n >= 3 && n <= 9) return [n + 10, n * 10];
  if (n === 11) return [12, 1];
  if (n === 12) return [20, 2];
  if (n === 20) return [12, 2];
  if (n === 2) return [12, 20];
  if (n === 1) return [11, 10];
  if (n === 10) return [100, 1];
  if (n === 100) return [1000, 10];
  if (n === 1000) return [100, 1000000];
  return [1000, 100];
}
const NUM_SENT = [
  n => ({ fr: 'J’ai ' + n + ' crayons de couleur.', en: 'I have ' + NUM_W[n] + ' colored pencils.', p: 'i {have|have got} ' + NUM_W[n] + ' {colored|coloring|color} pencils', c: ['I has ' + NUM_W[n] + ' colored pencils.', 'I have ' + NUM_W[lsNumTwins(n)[0]] + ' colored pencils.'] }),
  n => ({ fr: 'Il a ' + n + ' stylos.', en: 'He has ' + NUM_W[n] + ' pens.', p: 'he {has|has got} ' + NUM_W[n] + ' pens', c: ['He have ' + NUM_W[n] + ' pens.', 'He has ' + NUM_W[lsNumTwins(n)[0]] + ' pens.'] }),
  n => ({ fr: 'Nous avons ' + n + ' livres.', en: 'We have ' + NUM_W[n] + ' books.', p: 'we {have|have got} ' + NUM_W[n] + ' books', c: ['We have a ' + NUM_W[n] + ' books.', 'We have ' + NUM_W[lsNumTwins(n)[0]] + ' books.'] }),
];
const AGE_SENT = [
  n => ({ fr: 'J’ai ' + n + ' ans.', en: 'I am ' + NUM_W[n] + '.', p: 'i am ' + NUM_W[n] + '[ years old]', c: ['I have ' + NUM_W[n] + ' years.', 'I am ' + NUM_W[lsNumTwins(n)[0]] + '.'] }),
  n => ({ fr: 'Elle a ' + n + ' ans.', en: 'She is ' + NUM_W[n] + '.', p: 'she is ' + NUM_W[n] + '[ years old]', c: ['She has ' + NUM_W[n] + ' years.', 'She is ' + NUM_W[lsNumTwins(n)[0]] + '.'] }),
];
const lsFmt = n => n.toLocaleString('en-US');
function lsNumQ() {
  const small = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], tens = [30, 40, 50, 60, 70, 80, 90], big = [100, 1000, 1000000];
  const r = Math.random(), n = r < 0.55 ? pick(small) : r < 0.9 ? pick(tens) : pick(big);
  const tw = lsNumTwins(n).filter(x => NUM_W[x] && x !== n).slice(0, 2);
  const say = () => ({ num: 1, show: '« ' + lsFmt(n) + ' »', ask: 'Numbers! Comment dit-on ce nombre en anglais ?', en: NUM_W[n], p: n >= 100 ? '{one|a} ' + NUM_W[n].split(' ')[1] : NUM_W[n], c: tw.map(x => NUM_W[x]) });
  switch (Math.floor(Math.random() * 6)) {
    case 0: case 1: return say();
    case 2: return { num: 1, toNum: 1, show: '« ' + NUM_W[n] + ' »', ask: 'What number is it? Écris-le en chiffres !', en: lsFmt(n), p: '{' + n + '|' + lsFmt(n) + '}', c: tw.map(lsFmt) };
    case 3: return NUM_BAD[n] ? { num: 1, spell: 1, show: '« ' + lsFmt(n) + ' »', ask: 'Spelling! Comment s’écrit ce nombre en anglais ?', en: NUM_W[n], p: NUM_W[n], c: NUM_BAD[n].slice() } : say();
    case 4: {
      if (n >= 2 && n <= 20) { const a = 1 + Math.floor(Math.random() * (n - 1)); return { num: 1, show: NUM_W[a] + ' + ' + NUM_W[n - a] + ' = ?', ask: 'Quick! How much is…?', en: NUM_W[n], p: NUM_W[n], c: tw.map(x => NUM_W[x]) }; }
      if (n >= 30 && n <= 90) return { num: 1, show: NUM_W[n - 10] + ' + ten = ?', ask: 'Quick! How much is…?', en: NUM_W[n], p: NUM_W[n], c: tw.map(x => NUM_W[x]) };
      return say();
    }
    default:
      if (Math.random() < 0.4) return pick(AGE_SENT)(pick([10, 11, 12, 13, 14]));
      return pick(NUM_SENT)(pick([3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 40, 50]));
  }
}
// 3 réponses possibles : la bonne + 2 pièges (écrits à la main, ou fabriqués avec les erreurs classiques)
const LS_MUT = [
  s => /\bhave\b/.test(s) ? s.replace(/\bhave\b/, 'has') : /\bhas\b/.test(s) ? s.replace(/\bhas\b/, 'have') : null,
  s => /\bdon’t\b/.test(s) ? s.replace(/\bdon’t\b/, 'doesn’t') : /\bdoesn’t\b/.test(s) ? s.replace(/\bdoesn’t\b/, 'don’t') : /^Do\b/.test(s) ? s.replace(/^Do\b/, 'Does') : /^Does\b/.test(s) ? s.replace(/^Does\b/, 'Do') : null,
  s => /\ban\b/.test(s) ? s.replace(/\ban\b/, 'a') : /\ba\b/.test(s) ? s.replace(/\ba\b/, 'an') : null,
  s => / too\.$/.test(s) ? s.replace(/^(\w+ (?:have|has)) (.*) too\.$/, '$1 too $2.') : null,
  s => /\bYes, (\w+) (do|does)\./.test(s) ? s.replace(/\bYes, (\w+) (do|does)\./, (m, w, v) => 'Yes, ' + w + ' ' + (v === 'do' ? 'have' : 'has') + '.') : /\bNo, (\w+) (don’t|doesn’t)\./.test(s) ? s.replace(/\bNo, (\w+) (don’t|doesn’t)\./, (m, w, v) => 'No, ' + w + ' ' + (v === 'don’t' ? 'haven’t' : 'hasn’t') + '.') : null,
  s => / at /.test(s) ? s.replace(/ at /, ' in ') : / in the morning/.test(s) ? s.replace(/ in the morning/, ' at the morning') : null,
  s => / is /.test(s) ? s.replace(/ is /, ' are ') : / are /.test(s) ? s.replace(/ are /, ' is ') : null,
  s => { const C = { blue: 'red', white: 'black', red: 'green', yellow: 'blue', green: 'pink' }; const m = s.match(/\b(blue|white|red|yellow|green)\b/); return m ? s.replace(m[0], C[m[0]]) : null; },
  s => /^English\b/.test(s) ? 'The ' + s : /\b(geography|German|history|math|science)\b/.test(s) ? s.replace(/\b(geography|German|history|math|science)\b/, 'the $1') : null,
  s => /\b(have|has) (books|scissors|earbuds|colored pencils)\b/.test(s) ? s.replace(/\b(have|has) (books|scissors|earbuds|colored pencils)\b/, '$1 a $2') : null,
];
function lsChoices(q) {
  if (q.c) return [q.en, q.c[0], q.c[1]];
  const out = [q.en], seen = new Set([lsNorm(q.en)]);
  for (const f of LS_MUT) {
    const m = f(q.en); if (!m) continue; const k = lsNorm(m);
    if (seen.has(k) || lsCheck(m, q).ok) continue;
    seen.add(k); out.push(m); if (out.length === 3) break;
  }
  return out;
}

// ---------- la fiche de leçon (écran) ----------
const Lesson = {
  used: new Set(), q: null, done: null, res: null, bound: false, opts: [],
  pick() {
    const r = Math.random();
    if (r < 0.28) return lsDayQ();
    if (r < 0.56) return lsNumQ();
    let idx = LESSON_BANK.map((q, i) => i).filter(i => !this.used.has(i));
    if (!idx.length) { this.used.clear(); idx = LESSON_BANK.map((q, i) => i); }
    const i = idx[Math.floor(Math.random() * idx.length)]; this.used.add(i); return LESSON_BANK[i];
  },
  bind() {
    if (this.bound) return; this.bound = true;
    const inp = $('lsIn');
    $('lsOk').addEventListener('click', () => this.submit());
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.submit(); } });
    $('lsBack').addEventListener('click', () => { AU.sfx('tick'); const w = inp.value.trim().split(/\s+/); w.pop(); inp.value = w.join(' ') + (w.length ? ' ' : ''); });
    $('lsTiles').addEventListener('click', e => { const b = e.target.closest('.tile'); if (!b) return; AU.sfx('tick'); inp.value = (inp.value.trim() + ' ' + b.dataset.w).trim() + ' '; b.classList.add('used'); setTimeout(() => b.classList.remove('used'), 250); });
    $('lsChoices').addEventListener('click', e => { const b = e.target.closest('.choice'); if (!b) return; this.choose(+b.dataset.i); });
    $('lsType').addEventListener('click', () => { AU.sfx('tick'); const typing = $('lsAsk').classList.contains('hidden'); $('lsAsk').classList.toggle('hidden', !typing); $('lsChoices').classList.toggle('hidden', typing); $('lsType').textContent = typing ? '🔘 Voir les 3 réponses' : '✍️ Je préfère l’écrire moi-même'; if (typing && !matchMedia('(pointer:coarse)').matches) inp.focus(); });
    $('lsEar').addEventListener('click', () => { if (this.q) AU.sayEn(this.q.en, PROFS[5], true); });
    $('lsDone').addEventListener('click', () => this.close());
  },
  open(prof, n, done) {
    this.bind(); this.done = done; this.res = null;
    const q = this.q = this.pick();
    portrait($('lsProf'), prof.cfg, prof.v, 1);
    $('lsName').textContent = prof.name; $('lsSub').textContent = 'Leçon ' + n + ' / ' + LESSON_MAX + (n >= LESSON_MAX ? ' · dernière chance !' : '');
    $('lsQ').textContent = q.ask || pick(['Hello! How do you say in English…', 'Repeat after me… in English, please!', 'Now, translate this sentence!', 'Ready? In English, please…']);
    $('lsFr').textContent = q.show || '« ' + q.fr + ' »';
    // les 3 réponses, mélangées
    const ch = lsChoices(q).map((t, k) => ({ t, good: k === 0 }));
    for (let k = ch.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [ch[k], ch[j]] = [ch[j], ch[k]]; }
    this.opts = ch;
    $('lsChoices').innerHTML = ch.map((c, k) => `<button class="choice" data-i="${k}"><b>${'ABC'[k]}</b><span>${esc(c.t)}</span></button>`).join('');
    // écrire soi-même (réponse approximative acceptée)
    const inp = $('lsIn'); inp.value = ''; inp.placeholder = q.toFr ? 'En français…' : q.toNum ? 'En chiffres…' : 'In English…';
    const words = q.en.replace(/[.!?,]/g, '').split(/\s+/);
    if (words.length >= 3) {
      const SW = { have: 'has', has: 'have', do: 'does', does: 'do', 'don’t': 'doesn’t', 'doesn’t': 'don’t', a: 'an', an: 'a', on: 'in', at: 'in' };
      const extra = []; for (const w of words) { const s = SW[w] || SW[w.toLowerCase()]; if (s && !words.includes(s) && !extra.includes(s)) extra.push(s); if (extra.length >= 2) break; }
      const all = words.concat(extra); for (let k = all.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [all[k], all[j]] = [all[j], all[k]]; }
      $('lsTiles').innerHTML = all.map(w => `<button class="tile" data-w="${esc(w)}">${esc(w)}</button>`).join(''); $('lsHelp').classList.remove('hidden');
    } else { $('lsTiles').innerHTML = ''; $('lsHelp').classList.add('hidden'); }
    $('lsChoices').classList.remove('hidden'); $('lsAsk').classList.add('hidden'); $('lsType').classList.remove('hidden'); $('lsType').textContent = '✍️ Je préfère l’écrire moi-même';
    $('lsRes').classList.add('hidden');
    $('sLesson').classList.remove('hidden'); Input.reset();
    AU.sfx('blip');
  },
  choose(i) {
    if (!this.q || this.res) return; const o = this.opts[i]; if (!o) return;
    [...$('lsChoices').children].forEach((b, k) => b.classList.add(this.opts[k].good ? 'good' : k === i ? 'bad' : 'off'));
    this.finish({ ok: o.good, typos: [], picked: o.t, hint: o.good ? '' : lsHint(lsNorm(o.t), this.q) });
  },
  submit() {
    if (!this.q || this.res) return;
    const val = $('lsIn').value, r = lsCheck(val, this.q);
    if (r.empty) { AU.sfx('bump'); $('lsIn').classList.remove('shake'); void $('lsIn').offsetWidth; $('lsIn').classList.add('shake'); return; }
    r.picked = val.trim(); $('lsIn').blur(); this.finish(r);
  },
  finish(r) {
    this.res = r;
    const P = G.P; let lost = [], gift = null;
    if (!r.ok) { lost = (P.inv || []).filter(k => k !== 'key'); P.inv = (P.inv || []).filter(k => k === 'key'); }
    else if ((P.inv || []).length < 3) { gift = pick(ITEM_KEYS); P.inv.push(gift); }
    UI.invSig = null; r.lost = lost; r.gift = gift;
    const good = r.ok && !r.typos.length;
    $('lsVerdict').className = 'lsVerdict ' + (r.ok ? 'ok' : 'ko');
    $('lsVerdict').textContent = r.ok ? (good ? pick(['✅ Very good!', '✅ Perfect!', '✅ Excellent!']) : '✅ Good! (presque parfait)') : '❌ Oops! Pas tout à fait…';
    $('lsYou').innerHTML = r.ok ? '' : 'Ta réponse : <s>' + esc(r.picked) + '</s>';
    $('lsAns').textContent = this.q.en;
    $('lsTip').textContent = r.ok ? (r.typos.length ? '✏️ Attention à l’orthographe : ' + r.typos.map(t => t[0] + ' → ' + t[1]).join(', ') : '👍 Tu peux filer… mais sans courir dans les couloirs !') : '💡 ' + r.hint;
    const box = $('lsLost'); box.innerHTML = '';
    const icons = list => { const d = document.createElement('div'); d.className = 'lsLostI' + (r.ok ? ' gift' : ''); list.forEach(k => { const cv = document.createElement('canvas'); cv.width = 14; cv.height = 14; cv.getContext('2d').drawImage(itemCanvas(k), 0, 0); d.appendChild(cv); }); return d; };
    const line = (cls, t) => { const d = document.createElement('div'); d.className = cls; d.textContent = t; box.appendChild(d); };
    if (!r.ok) { if (lost.length) { line('lsLostT', '🎒 « Et je te confisque tes objets magiques ! »'); box.appendChild(icons(lost)); } else line('lsLostT', '🎒 « Tu n’as aucun objet magique… lucky you! »'); }
    else if (gift) { line('lsGiftT', '🎁 « Here is a present! » Miss Teacup t’offre : ' + ITEMS[gift].n); box.appendChild(icons([gift])); }
    else line('lsGiftT', '🎁 Miss Teacup voulait t’offrir un objet magique… mais ton sac est plein !');
    $('lsDone').textContent = r.ok ? 'Thank you, Miss! 🏃' : 'Sorry, Miss… 😔';
    $('lsAsk').classList.add('hidden'); $('lsType').classList.add('hidden'); $('lsRes').classList.remove('hidden');
    AU.sfx(r.ok ? 'found' : 'fail'); if (gift) AU.sfx('pickup'); if (r.ok) confetti(G.P.x, G.P.y - 10, 24);
    if (!this.q.toFr && !this.q.toNum) setTimeout(() => { if (this.res) AU.sayEn(this.q.en, PROFS[5]); }, 350);
  },
  close() {
    if (!this.res) return;
    const r = this.res, d = this.done; this.res = null; this.q = null; this.done = null;
    $('sLesson').classList.add('hidden'); AU.sfx('blip');
    if (d) d(r.ok, r.lost, r.gift);
  },
  // partie interrompue (quitter, fin de partie…)
  abort() { this.res = null; this.q = null; this.done = null; const s = $('sLesson'); if (s) s.classList.add('hidden'); if (G.P) G.P.lesson = false; }
};
