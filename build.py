# Assemble le jeu en un seul fichier index.html à partir de src/
import glob, os
d = os.path.dirname(os.path.abspath(__file__))
js = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(d, 'src', '*.js'))))
html = open(os.path.join(d, 'src', 'page.html'), encoding='utf-8').read().replace('/*__JS__*/', js)
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html :', len(html), 'octets')
