// ================= SAUVEGARDE : un code à garder pour ne jamais perdre ses squishies =================
// Tout est rangé sur l'appareil (localStorage). Une mise à jour du jeu n'efface rien, mais changer
// de navigateur, d'appareil, d'adresse du jeu ou vider Safari, si. Le code de sauvegarde permet de tout récupérer.
const SAVE_KEYS = ['nds_squish', 'nds_chars', 'nds_cur', 'nds_prog', 'nds_quiz', 'nds_quiz_en', 'nds_settings'];
// (pas de escape()/unescape() ici : le jeu a sa propre fonction escape(), celle de la sortie secrète !)
// on demande au navigateur de ne pas effacer les données du jeu quand il manque de place
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { }); } catch (e) { }
const Save = {
  data() { const o = {}; SAVE_KEYS.forEach(k => { const v = store.get(k, null); if (v != null) o[k] = v; }); return o; },
  code() {
    const json = JSON.stringify({ v: 1, t: Date.now(), d: this.data() });
    const by = new TextEncoder().encode(json); let bin = ''; by.forEach(x => bin += String.fromCharCode(x));
    return 'NDS1-' + btoa(bin).replace(/=+$/, '');
  },
  read(code) {
    const m = String(code || '').replace(/\s+/g, '').match(/NDS1-([A-Za-z0-9+/]+)/); if (!m) return null;
    try { let b = m[1]; while (b.length % 4) b += '='; const bin = atob(b), by = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) by[i] = bin.charCodeAt(i); const o = JSON.parse(new TextDecoder().decode(by)); return o && o.d && typeof o.d === 'object' ? o : null; } catch (e) { return null; }
  },
  // on fusionne : on ne perd jamais un squishy, un record ou un personnage déjà présent
  merge(d) {
    const sq = store.get('nds_squish', []), nsq = Array.isArray(d.nds_squish) ? d.nds_squish : [];
    const out = []; for (let i = 0; i < Math.max(sq.length, nsq.length); i++) out[i] = Math.max(+sq[i] || 0, +nsq[i] || 0);
    if (out.length) store.set('nds_squish', out);
    for (const k of ['nds_quiz', 'nds_quiz_en']) {
      const a = store.get(k, {}) || {}, b = d[k]; if (!b || typeof b !== 'object') continue;
      const best = Object.assign({}, b.best || {}); Object.entries(a.best || {}).forEach(([c, n]) => { best[c] = Math.max(n, best[c] || 0); });
      const missed = [...new Set([...(a.missed || []), ...(b.missed || [])])];
      store.set(k, { best, missed });
    }
    if (d.nds_prog) {
      const a = Object.assign({ unlocked: 1, stars: [] }, store.get('nds_prog', {})), b = d.nds_prog;
      store.set('nds_prog', { unlocked: Math.max(a.unlocked || 1, b.unlocked || 1), stars: (a.stars.length > (b.stars || []).length ? a.stars : b.stars || []).map((_, i) => Math.max(a.stars[i] || 0, (b.stars || [])[i] || 0)) });
    }
    if (Array.isArray(d.nds_chars)) {
      const a = store.get('nds_chars', []) || [], seen = new Set(a.map(c => JSON.stringify(c)));
      const all = a.concat(d.nds_chars.filter(c => !seen.has(JSON.stringify(c))));
      store.set('nds_chars', all); if (!a.length && d.nds_cur != null) store.set('nds_cur', d.nds_cur);
    }
    if (d.nds_settings && store.get('nds_settings', null) == null) store.set('nds_settings', d.nds_settings);
  },
  open(back) {
    this.back = back || 'title'; this.bind();
    const c = this.code(); $('svCode').value = c; $('svIn').value = ''; $('svMsg').textContent = '';
    $('svStat').textContent = '🧸 ' + SqCol.count() + '/' + SQUISHIES.length + ' squishies · 👕 ' + (store.get('nds_chars', []) || []).length + ' personnage(s)';
    $('svShare').classList.toggle('hidden', !navigator.share);
    UI.show('sSave');
  },
  msg(t, ok) { const m = $('svMsg'); m.textContent = t; m.className = 'svMsg ' + (ok ? 'ok' : 'ko'); },
  bind() {
    if (this.bound) return; this.bound = true;
    $('svCopy').addEventListener('click', async () => {
      AU.sfx('blip'); const c = this.code(), ta = $('svCode'); ta.value = c;
      try { await navigator.clipboard.writeText(c); this.msg('✅ Code copié ! Colle-le dans Notes, ou envoie-le à papa.', true); }
      catch (e) { ta.focus(); ta.select(); try { document.execCommand('copy'); this.msg('✅ Code copié ! Colle-le dans Notes, ou envoie-le à papa.', true); } catch (e2) { this.msg('Sélectionne le code et copie-le à la main.', false); } }
    });
    $('svShare').addEventListener('click', () => { AU.sfx('blip'); navigator.share({ title: 'Échappe au prof ! — ma sauvegarde', text: this.code() }).catch(() => { }); });
    $('svGo').addEventListener('click', () => {
      const o = this.read($('svIn').value);
      if (!o) { AU.sfx('bump'); this.msg('❌ Ce code ne marche pas. Il doit commencer par NDS1-', false); return; }
      const before = SqCol.count(); this.merge(o.d); const after = SqCol.count();
      AU.sfx('squish'); this.msg('✅ Sauvegarde récupérée ! ' + after + '/' + SQUISHIES.length + ' squishies' + (after > before ? ' (+' + (after - before) + ')' : '') + '. Le jeu redémarre…', true);
      setTimeout(() => location.reload(), 1600);
    });
    $('svBack').addEventListener('click', () => { AU.sfx('blip'); if (this.back === 'squish') SqAlbum.open('title'); else UI.openTitle(); });
  }
};
