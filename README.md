# Échappe au prof ! · Collège Notre-Dame de Sion

Petit jeu rétro en pixel art, vu du dessus : il faut échapper au prof, se cacher (armoires, casiers, sous les bureaux, derrière les portes…) et faire 3 tâches rigolotes, puis trouver une des 3 sorties secrètes de chaque niveau.

**Jouer :** https://distortedimages-code.github.io/echappe-au-prof/

## Modes

- **Solo** : 5 niveaux (la cour avec le surveillant, la vie scolaire, la prof de français, le prof de sport, la directrice), avec des objets magiques tirés des contes (gâteau « Mange-moi », lampe magique, pantoufle de verre, pomme dormeuse, miroir, montre du Lapin blanc).
- **À deux en ligne** : chacun sur son téléphone. Un joueur crée la partie et reçoit un code de 4 lettres, l’autre le tape. L’un joue l’élève, l’autre le prof, qui doit l’attraper avant la sonnerie (3 minutes).
- **Mode infiltration** (« La grande évasion ») : tu commences assis·e en classe au 3e étage, la maîtresse fait des rondes. Il faut descendre jusqu’à la cour sans te faire prendre. Si un prof te voit hors de ta classe, il t’avertit. Au bout de 3 avertissements, on te court après ! Regarde par le trou des serrures, trouve le trousseau de clés caché dans le bureau d’un prof et le plan d’évacuation qui montre où sont les profs. Tu peux aussi déclencher l’alarme incendie : tout le monde descend dans la cour… mais il y a un appel.
- **Plans surprise** : chaque niveau garde son univers (la cour, la vie scolaire, les salles de classe, le gymnase, l’étage de la direction), mais le plan est tiré au hasard à chaque partie. À deux, les deux téléphones reçoivent le même plan. Un interrupteur sur l’écran des niveaux permet de revenir aux plans fixes.
- **Tâches** : avant de pouvoir s’échapper, l’élève doit faire 3 tâches rigolotes (nourrir les pigeons, photocopier 100 chats, mettre des lunettes au squelette…). Il y a aussi un déguisement caché dans les meubles.
- **Faux élèves** : à deux, des élèves robots se promènent toujours de la même façon. Le prof doit repérer le vrai élève parmi eux. S’il attrape la mauvaise personne, il a la tête qui tourne pendant 3 secondes.

Le mode à deux relie les deux téléphones directement (WebRTC via [PeerJS](https://peerjs.com/), licence MIT). Ça marche le mieux sur le même Wi-Fi.

## Modifier le jeu

Le code est dans `src/`. Après une modification :

```
python3 build.py
```

qui regénère `index.html`.
