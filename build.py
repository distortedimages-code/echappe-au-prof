# Assemble le jeu en un seul fichier index.html à partir de src/
import glob, os, datetime
from zoneinfo import ZoneInfo
d = os.path.dirname(os.path.abspath(__file__))
js = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(d, 'src', '*.js'))))
html = open(os.path.join(d, 'src', 'page.html'), encoding='utf-8').read().replace('/*__JS__*/', js)
# date de la version (affichée sur l'accueil, à côté du bouton « Mettre à jour le jeu »)
now = datetime.datetime.now(ZoneInfo('Europe/Paris'))
mois = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
html = html.replace('__BUILD__', '%d %s · %dh%02d' % (now.day, mois[now.month - 1], now.hour, now.minute))
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html :', len(html), 'octets')
