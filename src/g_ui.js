// ================= ENTRÉES (joystick + clavier) =================
const Input = {
  jx: 0, jy: 0, mag: 0, pid: null, ox: 0, oy: 0, keys: {}, used: false, pending: null, el: null, joyEl: null,
  // relâche le joystick (doigt perdu, écran qui change, appli en arrière-plan…)
  reset() {
    if (this.pid !== null && this.el) { try { this.el.releasePointerCapture(this.pid); } catch (er) { } }
    this.pid = null; this.pending = null; this.mag = 0; this.jx = this.jy = 0;
    if (this.joyEl) this.joyEl.classList.add('hidden');
  },
  get() {
    let x = 0, y = 0; const k = this.keys;
    if (k.ArrowLeft || k.KeyA || k.KeyQ) x -= 1; if (k.ArrowRight || k.KeyD) x += 1;
    if (k.ArrowUp || k.KeyW || k.KeyZ) y -= 1; if (k.ArrowDown || k.KeyS) y += 1;
    if (x || y) { const m = Math.hypot(x, y), s = (k.ShiftLeft || k.ShiftRight) ? 0.5 : 1; return { x: x / m * s, y: y / m * s, mag: s }; }
    return { x: this.jx, y: this.jy, mag: this.mag };
  },
  init() {
    const t = document.getElementById('touch'), joy = document.getElementById('joy'), knob = document.getElementById('joyKnob'), lbl = document.getElementById('joyLbl');
    const R = 58; this.el = t; this.joyEl = joy;
    const upd = (cx, cy) => {
      let dx = cx - this.ox, dy = cy - this.oy; const d = Math.hypot(dx, dy);
      if (d > R) { this.ox += dx / d * (d - R); this.oy += dy / d * (d - R); joy.style.left = this.ox + 'px'; joy.style.top = this.oy + 'px'; dx = cx - this.ox; dy = cy - this.oy; }
      const dd = Math.hypot(dx, dy); this.mag = Math.min(1, dd / R); this.jx = dd ? dx / dd * this.mag : 0; this.jy = dd ? dy / dd * this.mag : 0;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      lbl.textContent = this.mag > 0.62 ? 'COURSE !' : this.mag > 0.08 ? 'chut…' : '';
      lbl.style.color = this.mag > 0.62 ? '#ff8a96' : '#b8f0a8';
    };
    const begin = (id, x, y) => {
      this.pid = id; this.pending = null; this.ox = x; this.oy = y; this.mag = 0; this.jx = this.jy = 0;
      joy.style.left = this.ox + 'px'; joy.style.top = this.oy + 'px'; joy.classList.remove('hidden'); knob.style.transform = 'translate(0,0)'; lbl.textContent = '';
      try { t.setPointerCapture(id); } catch (er) { }
    };
    t.addEventListener('pointerdown', e => {
      AU.init(); e.preventDefault();
      if (this.pid !== null) {
        // un doigt est déjà sur le joystick… sauf si son « lâcher » s'est perdu (geste système, écran qui a changé…)
        if (e.pointerType === 'touch' && e.pointerId !== this.pid) { this.pending = { id: e.pointerId, x: e.clientX, y: e.clientY }; return; }
        this.reset();
      }
      begin(e.pointerId, e.clientX, e.clientY);
      if (!this.used) { this.used = true; const h = document.getElementById('hint'); h.style.opacity = 0; setTimeout(() => h.classList.add('hidden'), 500); }
    });
    const move = e => { if (e.pointerId === this.pid) { upd(e.clientX, e.clientY); e.preventDefault(); } else if (this.pending && e.pointerId === this.pending.id) { this.pending.x = e.clientX; this.pending.y = e.clientY; } };
    t.addEventListener('pointermove', move);
    const end = e => { if (this.pending && e.pointerId === this.pending.id) this.pending = null; if (e.pointerId !== this.pid) return; this.reset(); };
    t.addEventListener('pointerup', end); t.addEventListener('pointercancel', end); t.addEventListener('lostpointercapture', end);
    // filets de sécurité : les vrais doigts sur l'écran font foi
    document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
    document.addEventListener('touchstart', e => {
      // le seul doigt posé est le nouveau : l'ancien a disparu sans prévenir -> le nouveau prend le joystick
      if (this.pending && e.touches.length === 1) { const p = this.pending; this.reset(); begin(p.id, p.x, p.y); }
    }, { capture: true, passive: true });
    const allUp = e => { if (e.touches.length === 0 && (this.pid !== null || this.pending)) this.reset(); };
    document.addEventListener('touchend', allUp, { capture: true, passive: true }); document.addEventListener('touchcancel', allUp, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.reset(); this.keys = {}; } });
    addEventListener('pagehide', () => { this.reset(); this.keys = {}; });
    addEventListener('keydown', e => {
      if (e.target && e.target.tagName === 'INPUT') return;
      this.keys[e.code] = true;
      if (G.mode === 'intro' && !$('sIntro').classList.contains('hidden')) {
        if (e.code === 'ArrowRight') { UI.inGo(UI.inP + 1); e.preventDefault(); }
        if (e.code === 'ArrowLeft') { UI.inGo(UI.inP - 1); e.preventDefault(); }
        if (e.code === 'Enter' && UI.inP < UI.inN - 1) { UI.inGo(UI.inP + 1); e.preventDefault(); }
      }
      if (G.mode === 'play') {
        if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') { doAction(G.actions[0]); e.preventDefault(); }
        if (e.code === 'KeyR' || e.code === 'KeyF') doAction(G.actions[1]);
        if (e.code === 'Digit1') useItem(0); if (e.code === 'Digit2') useItem(1); if (e.code === 'Digit3') useItem(2);
        if (e.code === 'Escape' || e.code === 'KeyP') UI.pause();
        if (e.code.startsWith('Arrow')) e.preventDefault();
      }
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; this.reset(); });
    // pincer pour zoomer : bloqué… sauf si on est déjà zoomé (pour pouvoir dézoomer)
    document.addEventListener('gesturestart', e => { if (!(window.visualViewport && visualViewport.scale > 1.02)) e.preventDefault(); });
    this.antiZoom();
  },
  // empêche le zoom par double tap (iOS) dans le jeu et les mini-jeux
  antiZoom() {
    const block = e => {
      const b = e.target.closest && e.target.closest('button, input, select, textarea, a');
      if (b && !b.classList.contains('act') && !b.classList.contains('slot')) return;
      if (e.cancelable) e.preventDefault();
    };
    ['tkCv', 'sTask', 'touch', 'game', 'hud', 'joy'].forEach(id => { const el = $(id); if (!el) return; el.addEventListener('touchstart', block, { passive: false }); el.addEventListener('touchend', block, { passive: false }); });
    let lastEnd = 0;
    document.addEventListener('touchend', e => { const now = performance.now(), quick = now - lastEnd < 320; lastEnd = now; if (quick && e.cancelable && !(e.target.closest && e.target.closest('input, textarea, select, button, a'))) e.preventDefault(); }, { passive: false });
    // filet de sécurité : si la page s'est quand même zoomée, on la remet à 100 %
    const unzoom = () => {
      const vv = window.visualViewport; if (!vv || vv.scale <= 1.02) return;
      const m = document.querySelector('meta[name=viewport]'); if (!m) return; const c = m.content;
      m.content = 'width=device-width, initial-scale=1.0001, maximum-scale=1, user-scalable=no'; setTimeout(() => { m.content = c; }, 80);
    };
    if (window.visualViewport) visualViewport.addEventListener('resize', () => { clearTimeout(this.uzT); this.uzT = setTimeout(unzoom, 400); });
  }
};

// ================= INTERFACE =================
const $ = id => document.getElementById(id);
const UI = {
  chars: store.get('nds_chars', []), cur: store.get('nds_cur', 0),
  prog: (() => {
    const p = Object.assign({ unlocked: 1, stars: [0, 0, 0, 0, 0, 0, 0] }, store.get('nds_prog', {}));
    // v2 : le cours d'anglais s'insère en niveau 4 (le gymnase et la directrice passent en 5 et 6)
    if (!p.v) { const s = p.stars || []; p.stars = [s[0] || 0, s[1] || 0, s[2] || 0, 0, s[3] || 0, s[4] || 0]; if (p.unlocked >= 4) p.unlocked++; p.v = 2; }
    // v3 : le cours d'histoire-géo s'insère en niveau 5
    if (p.v === 2) { const s = p.stars || []; p.stars = [s[0] || 0, s[1] || 0, s[2] || 0, s[3] || 0, 0, s[4] || 0, s[5] || 0]; if (p.unlocked >= 5) p.unlocked++; p.v = 3; }
    return p;
  })(),
  editing: null, editIdx: -1, prevDir: 0, prevT: 0, after: 'levels', toastTimer: null, bannerTimer: null, hudSig: null, invSig: null, hudT: 0,
  save() { store.set('nds_chars', this.chars); store.set('nds_cur', this.cur); store.set('nds_prog', this.prog); },
  cfg() { return this.chars[this.cur] || this.chars[0]; },
  show(id) {
    Input.reset();
    if (['sTitle', 'sLevels', 'sResult', 'sMulti', 'sIntro', 'sChars', 'sCreator'].includes(id)) Lesson.abort();
    ['sTitle', 'sChars', 'sCreator', 'sLevels', 'sIntro', 'sPause', 'sResult', 'sMulti', 'sSquish'].forEach(s => $(s).classList.toggle('hidden', s !== id));
    $('hud').classList.toggle('hidden', !['play'].includes(id) && !['sIntro', 'sPause', 'sResult'].includes(id));
    if (id === 'sIntro') this.introPages();
  },
  // ---------- briefing écran par écran (on glisse, puis « C'est parti ! » sur le dernier) ----------
  introPages() {
    const tr = $('inTrack'); tr.querySelectorAll('.inPage.gen').forEach(e => e.remove());
    const emo = /^((?:\p{Regional_Indicator}{2})|(?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*))\s*/u;
    const card = (html, cls) => { const m = html.match(emo); return `<div class="inCard${cls ? ' ' + cls : ''}"><span class="em">${m ? m[1] : '✨'}</span><span>${m ? html.slice(m[0].length) : html}</span></div>`; };
    const hints = [...$('inHints').children].map(li => esc(li.textContent));
    const tips = $('inTips').innerHTML.split(/<br\s*\/?>/i).map(x => x.trim()).filter(Boolean);
    const groups = [[$('inHints').dataset.title || '💡 Comment jouer', hints, ''], ['🎒 Bon à savoir', tips, 'tip']];
    groups.forEach(([title, list, cls]) => {
      const nP = Math.ceil(list.length / 4);   // 4 cartes max, réparties équitablement
      let at = 0;
      for (let p = 0; p < nP; p++) {
        const cnt = Math.floor(list.length / nP) + (p < list.length % nP ? 1 : 0);
        const sec = document.createElement('section'); sec.className = 'inPage gen';
        sec.innerHTML = `<div class="inBody"><h3>${title}${nP > 1 ? ' ' + (p + 1) + '/' + nP : ''}</h3>${list.slice(at, at + cnt).map(h => card(h, cls)).join('')}</div>`; at += cnt;
        tr.appendChild(sec);
      }
    });
    this.inN = tr.children.length; this.inGo(0, true);
  },
  inGo(i, instant) {
    const n = this.inN || 1, tr = $('inTrack'); i = clamp(i, 0, n - 1);
    if (i !== this.inP && !instant) AU.sfx('tick');
    this.inP = i;
    if (instant) tr.classList.add('drag');
    tr.style.transform = 'translateX(' + (-i * 100) + '%)';
    if (instant) { void tr.offsetWidth; tr.classList.remove('drag'); }
    const last = i === n - 1;
    $('bInPrev').classList.toggle('hidden', i === 0); $('bInNext').classList.toggle('hidden', last); $('bGo').classList.toggle('hidden', !last);
    $('bInSkip').classList.toggle('gone', last);
    $('inDots').innerHTML = n > 1 ? Array.from({ length: n }, (_, k) => `<i data-k="${k}" class="${k === i ? 'on' : ''}"></i>`).join('') : '';
    const pg = tr.children[i]; if (pg) pg.scrollTop = 0;
  },
  initIntroSwipe() {
    const v = $('inView'), tr = $('inTrack'); let st = null;
    v.addEventListener('pointerdown', e => { if (e.target.closest('button, input')) return; st = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, drag: false }; });
    v.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.drag) { if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return; st.drag = true; tr.classList.add('drag'); try { v.setPointerCapture(e.pointerId); } catch (er) { } }
      const edge = (this.inP === 0 && dx > 0) || (this.inP === this.inN - 1 && dx < 0); st.dx = edge ? dx * 0.3 : dx;
      tr.style.transform = 'translateX(calc(' + (-this.inP * 100) + '% + ' + Math.round(st.dx) + 'px))'; e.preventDefault();
    });
    const end = e => {
      if (!st || e.pointerId !== st.id) return; const s0 = st; st = null; if (!s0.drag) return;
      tr.classList.remove('drag'); const w = v.clientWidth || 300;
      this.inGo(this.inP + (s0.dx < -w * 0.18 ? 1 : s0.dx > w * 0.18 ? -1 : 0));
    };
    v.addEventListener('pointerup', end); v.addEventListener('pointercancel', end); v.addEventListener('lostpointercapture', e => { if (e.target === v) end(e); });
    $('inDots').addEventListener('click', e => { const k = e.target.dataset && e.target.dataset.k; if (k != null) this.inGo(+k); });
  },
  init() {
    // boutons généraux
    const tap = (id, f) => $(id).addEventListener('click', e => { AU.init(); AU.sfx('blip'); f(e); });
    tap('bPlay', () => { if (!this.chars.length) this.openCreator(-1, 'levels'); else this.openLevels(); });
    tap('bChars', () => this.openChars('title'));
    tap('bSquish', () => SqAlbum.open('title')); tap('bSqBack', () => this.openTitle());
    tap('bMulti', () => Multi.open());
    tap('bInf', () => { AU.init(); if (!this.chars.length) this.openCreator(-1, 'inf'); else this.launchInf(); });
    tap('bPlan', () => this.openPlan());
    tap('bDiv', () => coopDiversion());
    tap('bPing', () => coopPing());
    tap('plClose', () => this.closePlan());
    tap('pkClose', () => { const A = G.P && viewerA(); if (A && A.busy && A.busy.peek) A.busy = null; });
    tap('bCharsBack', () => this.charsBack === 'levels' ? this.openLevels() : this.charsBack === 'multi' ? Multi.open() : this.openTitle());
    tap('bCharsGo', () => { if (!this.chars.length) this.openCreator(-1, 'levels'); else this.openLevels(); });
    tap('cRand', () => { const n = this.editing.name; this.editing = randomChar(n); this.renderOpts(); });
    tap('cTurn', () => { this.prevDir = (this.prevDir + 1) % 4; this.prevT = 0; });
    tap('cCancel', () => { if (this.after === 'inf') { this.openTitle(); return; } if (this.after === 'multi') { if (this.chars.length) Multi.open(); else this.openTitle(); } else if (this.after === 'levels' && this.chars.length) this.openLevels(); else if (this.after === 'levels') this.openTitle(); else this.openChars(this.charsBack); });
    tap('cSave', () => this.saveCreator());
    tap('bWho', () => this.openChars('levels'));
    tap('bLvlBack', () => this.openTitle());
    tap('bInNext', () => this.inGo(this.inP + 1)); tap('bInPrev', () => this.inGo(this.inP - 1)); tap('bInSkip', () => this.inGo(this.inN - 1));
    this.initIntroSwipe();
    tap('bGo', () => { if (G.net) { Net.setReady(); return; } G.mode = 'play'; this.show('play'); AU.play('sneak'); FX.iris = { mode: 'in', t: 0, dur: 0.75 }; this.hudSig = null; this.invSig = null; if (G.L.def.prof === 4) G.intercomT = 12; });
    tap('bPause', () => this.pause());
    tap('pResume', () => { if (!G.net) G.mode = this.pausedFrom || 'play'; this.show('play'); });
    tap('pRestart', () => { if (G.inf) this.launchInf(true); else this.launch(G.lvl, true); });
    tap('pLevels', () => { if (G.inf) { G.inf = null; G.mode = 'menu'; AU.play('menu'); this.openTitle(); return; } if (G.net) { Net.close(); G.net = null; G.mode = 'menu'; this.openTitle(); return; } AU.play('menu'); this.openLevels(); G.mode = 'menu'; });
    document.querySelectorAll('.tog').forEach(b => {
      b.addEventListener('click', () => { AU.init(); const k = b.dataset.k; AU.set[k] = !AU.set[k]; AU.applySet(); this.syncTogs(); if (k === 'crt') bakePost(); if (k === 'music' && AU.set.music && G.mode === 'menu') AU.play('menu'); });
    });
    this.syncTogs();
    $('cName').addEventListener('input', e => { this.editing.name = e.target.value.slice(0, 12); });
    // HUD
    ['act1', 'act2'].forEach((id, i) => $(id).addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); doAction(G.actions[i]); this.hudSig = null; }));
    $('hTasks').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); this.tasksOpen = !this.tasksOpen; this.taskPeekT = 0; this.taskSig = null; this.infSig = null; AU.sfx('tick'); });
    $('inv').addEventListener('pointerdown', e => { const b = e.target.closest('.slot'); if (!b) return; e.stopPropagation(); e.preventDefault(); useItem(+b.dataset.i); this.invSig = null; });
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play' && !G.net) this.pause(); });
    this.waveTitle(); this.openTitle();
  },
  waveTitle() { document.querySelectorAll('.logo span').forEach((sp, j) => { const t = sp.textContent; sp.innerHTML = [...t].map((ch, i) => `<i style="animation-delay:${(i * 0.08 + j * 0.3).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</i>`).join(''); }); },
  syncTogs() { document.querySelectorAll('.tog').forEach(b => b.classList.toggle('off', !AU.set[b.dataset.k])); this.paintEasy($('bEasy')); this.paintEasy($('pEasy')); },
  openTitle() { G.mode = 'menu'; this.show('sTitle'); AU.play('menu'); $('bSquish').textContent = '🧸 Mes squishies (' + SqCol.count() + '/' + SQUISHIES.length + ')'; },
  // ---------- liste des persos ----------
  openChars(back) {
    this.charsBack = back || 'title'; this.show('sChars');
    const g = $('charGrid'); g.innerHTML = '';
    this.chars.forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'card' + (i === this.cur ? ' sel' : '');
      d.innerHTML = `<canvas width="20" height="34"></canvas><div class="nm"></div><div class="mini"><button data-a="e" aria-label="Modifier">✏️</button><button data-a="d" aria-label="Supprimer">🗑️</button></div>`;
      d.querySelector('.nm').textContent = c.name || 'Sans nom';
      portrait(d.querySelector('canvas'), c, null, 1);
      d.addEventListener('click', e => {
        AU.init(); const a = e.target.closest('button'); AU.sfx('blip');
        if (a && a.dataset.a === 'e') { this.openCreator(i, 'chars'); return; }
        if (a && a.dataset.a === 'd') { if (d.dataset.confirm) { this.chars.splice(i, 1); if (this.cur >= this.chars.length) this.cur = 0; this.save(); this.openChars(this.charsBack); } else { d.dataset.confirm = 1; a.textContent = 'Sûr ?'; } return; }
        this.cur = i; this.save(); if (this.charsBack === 'levels') this.openLevels(); else if (this.charsBack === 'multi') Multi.open(); else this.openChars(this.charsBack);
      });
      g.appendChild(d);
    });
    if (this.chars.length < 8) {
      const a = document.createElement('div'); a.className = 'card add'; a.innerHTML = '＋<br><br>Nouveau<br>perso';
      a.addEventListener('click', () => { AU.init(); AU.sfx('blip'); this.openCreator(-1, 'chars'); }); g.appendChild(a);
    }
  },
  // ---------- créateur ----------
  openCreator(idx, after) {
    this.after = after; this.editIdx = idx;
    this.editing = idx >= 0 ? Object.assign({}, this.chars[idx]) : randomChar('');
    $('crTitle').textContent = idx >= 0 ? '✏️ Modifie ton perso' : '✏️ Crée ton perso';
    $('cName').value = this.editing.name || '';
    this.show('sCreator'); this.renderOpts(); $('sCreator').scrollTop = 0;
  },
  renderOpts() {
    const box = $('cOpts'); box.innerHTML = '';
    CHAR_FIELDS.forEach(f => {
      if (f.k === 'accCol' && !this.editing.acc) return;
      if (f.k === 'botCol' && (this.editing.top === 3 || this.editing.top === 4)) return;
      if (f.k === 'bottom' && (this.editing.top === 3 || this.editing.top === 4)) return;
      const row = document.createElement('div'); row.className = 'opt';
      const v = this.editing[f.k], col = f.swatch ? colOf(f.list, v) : null, nm = f.swatch ? (nameOf(f.list, v) || 'Teinte ' + (v + 1)) : f.list[v];
      row.innerHTML = `<div class="ol">${f.label}</div><button aria-label="précédent">◀</button><div class="ov">${col ? `<span class="sw" style="background:${col}"></span>` : ''}<span></span></div><button aria-label="suivant">▶</button>`;
      row.querySelector('.ov span:last-child').textContent = nm;
      const [bp, bn] = row.querySelectorAll('button');
      const step = d => { AU.init(); AU.sfx('tick'); this.editing[f.k] = (this.editing[f.k] + d + f.list.length) % f.list.length; this.renderOpts(); };
      bp.addEventListener('click', () => step(-1)); bn.addEventListener('click', () => step(1));
      box.appendChild(row);
    });
  },
  saveCreator() {
    const c = this.editing; c.name = ($('cName').value || '').trim().slice(0, 12);
    if (!c.name) { $('cName').focus(); $('cName').placeholder = 'Écris ton prénom !'; $('cName').style.outline = '3px solid #ff4a5a'; return; }
    $('cName').style.outline = '';
    if (this.editIdx >= 0) this.chars[this.editIdx] = c; else { this.chars.push(c); this.cur = this.chars.length - 1; }
    this.save();
    if (this.after === 'levels') this.openLevels(); else if (this.after === 'multi') Multi.open(); else if (this.after === 'inf') this.launchInf(); else this.openChars(this.charsBack);
  },
  tickCreator(dt) {
    if ($('sCreator').classList.contains('hidden')) return;
    this.prevT += dt; if (this.prevT > 2.2) { this.prevT = 0; this.prevDir = (this.prevDir + 1) % 4; }
    const cv = $('cPrev'), walking = this.prevT > 1.1;
    portrait(cv, this.editing, null, 1, [0, 2, 1, 3][this.prevDir], walking ? Math.floor(this.prevT * 9) % 6 : 0, walking ? 'run' : 'idle');
  },
  // ---------- niveaux ----------
  openLevels() {
    G.mode = 'menu'; this.show('sLevels'); AU.play('menu');
    const c = this.cfg(); portrait($('whoCv'), c, null, 1); $('whoName').textContent = c.name;
    this.paintProc($('bProc'));
    const list = $('lvlList'); list.innerHTML = '';
    LEVELS.forEach((L, i) => {
      const pr = PROFS[L.prof], lock = i + 1 > this.prog.unlocked, st = this.prog.stars[i] || 0;
      const b = document.createElement('button'); b.className = 'lvl' + (lock ? ' lock' : '');
      b.innerHTML = `<canvas width="22" height="34"></canvas><div style="flex:1"><div class="ln">NIVEAU ${i + 1}</div><div class="lt"></div><div class="lp"></div><div class="st">${lock ? '🔒' : '★'.repeat(st) + '<span style="opacity:.25">' + '★'.repeat(3 - st) + '</span>'}</div></div>`;
      b.querySelector('.lt').textContent = L.title; b.querySelector('.lp').textContent = pr.name + ', ' + pr.title;
      portrait(b.querySelector('canvas'), pr.cfg, pr.v, 1);
      b.addEventListener('click', () => { AU.init(); if (lock) { AU.sfx('fail'); b.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 200); return; } AU.sfx('blip'); this.launch(i); });
      b.style.animationDelay = (i * 0.07) + 's'; list.appendChild(b);
    });
  },
  procOn() { return store.get('proc', true) !== false; },
  // mode facile : pas de brouillard, on voit tout le collège (solo et en équipe)
  paintEasy(b) {
    if (!b) return; const on = !!AU.set.easy; b.classList.toggle('on', on);
    b.innerHTML = `<span class="pi">${on ? '👀' : '🌫️'}</span><span><b>${on ? 'MODE FACILE : TOUT VOIR' : 'CHAMP DE VISION'}</b>${on ? 'Pas de brouillard : tu vois tout le collège et les profs.' : 'Tu ne vois que ce qui est autour de toi. Touche pour tout voir.'}</span><span class="sw"></span>`;
    b.onclick = () => { AU.init(); AU.sfx('tick'); AU.set.easy = !AU.set.easy; AU.applySet(); this.paintEasy($('bEasy')); this.paintEasy($('pEasy')); };
  },
  paintProc(b) {
    if (!b) return; const on = this.procOn(); b.classList.toggle('on', on);
    b.innerHTML = `<span class="pi">${on ? '🎲' : '🗺️'}</span><span><b>${on ? 'PLANS SURPRISE' : 'PLANS FIXES'}</b>${on ? 'Un nouveau plan du collège à chaque partie !' : 'Toujours les mêmes plans dessinés à la main.'}</span><span class="sw"></span>`;
    b.onclick = () => { AU.init(); AU.sfx('tick'); store.set('proc', !this.procOn()); this.paintProc(b); };
  },
  hudInf() {
    const I = G.inf, el = $('hTasks');
    if (I.guard) {
      $('bPlan').classList.toggle('hidden', G.mode !== 'play'); $('bPing').classList.toggle('hidden', G.mode !== 'play'); $('bDiv').classList.add('hidden');
      const Q = G.T2, free = I.fugs.filter(f => f.st !== 'caught' && f.st !== 'out').length;
      const sig3 = ['G', free, I.caughtN, I.outN, Q.fl, I.cur].join('|');
      if (sig3 === this.infSig && !el.classList.contains('hidden')) return; this.infSig = sig3; el.classList.remove('hidden');
      el.innerHTML = `<div class="hd">🏃 ${free} FUGUEUR${free > 1 ? 'S' : ''} EN FUITE</div><div class="tl">🔒 ${I.caughtN} attrapé${I.caughtN > 1 ? 's' : ''} · 🌳 ${I.outN} évadé${I.outN > 1 ? 's' : ''}</div><div class="tl">🤝 ${esc(guardName(Q))} : ${Q.fl === I.cur ? '👀 ' : ''}${INF_FLOOR_META[Q.fl] ? INF_FLOOR_META[Q.fl].short : '?'}</div>`;
      return;
    }
    if (I.multi && I.role === 'teacher') {
      $('bPlan').classList.toggle('hidden', G.mode !== 'play');
      const pg = I.ping, age = pg ? Math.floor(pg.t) : 0;
      const sig2 = ['T', I.warn, I.hunt, I.keys, !!I.alarm, pg ? pg.fl + pg.room + Math.floor(age / 5) : '', I.alarm ? Math.ceil((I.alarm.dur - I.alarm.t) / 5) : 0].join('|');
      if (sig2 === this.infSig && !el.classList.contains('hidden')) return; this.infSig = sig2; el.classList.remove('hidden');
      const dots = [0, 1, 2].map(i => i < I.warn ? '🟡' : '⚪').join('');
      el.innerHTML = `<div class="hd">🎯 TROUVE ${esc((G.P.cfg.name || 'L’ÉLÈVE').toUpperCase())} · ${dots}</div>`
        + `<div class="tl">📢 ${pg ? INF_FLOOR_META[pg.fl].short + ' · ' + esc(pg.room) + ' (' + age + ' s)' : 'aucun signalement'}</div>`
        + (I.keys || I.alarm ? `<div class="tl">${I.keys ? '🔑 trousseau volé ' : ''}${I.alarm ? '🔥 alerte !' : ''}</div>` : '');
      el.classList.toggle('all', !!(pg && pg.t < 8));
      return;
    }
    const hideLeft = I.hunt && G.P.hidden ? Math.ceil(20 - (I.hideT || 0)) : 0;
    const Q = I.coop ? G.P2 : null, P = G.P;
    const qs = Q ? (Q.out ? '🌳 dehors !' : Q.jail ? '🔒 en colle (1er)' : (Q.fl === I.cur ? '👀 ' : '') + INF_FLOOR_META[Q.fl].short) : '';
    const jailLeft = P.jail ? Math.ceil(60 - (P.jailT || 0)) : 0;
    const sig = [I.keys, I.plan, I.alarmUsed, !!I.alarm, I.warn, I.hunt, I.cur, I.alarm ? Math.ceil(Math.max(0, I.alarm.dur - I.alarm.t) / 5) : 0, hideLeft, G.P.keys || 0, qs, P.out, Math.ceil(jailLeft / 5)].join('|');
    $('bPlan').classList.toggle('hidden', !I.plan || G.mode !== 'play');
    $('bDiv').classList.toggle('hidden', !I.coop || G.mode !== 'play' || P.out || P.jail); $('bDiv').classList.toggle('cd', (I.cdDiv || 0) > 0);
    $('bPing').classList.toggle('hidden', !I.coop || G.mode !== 'play');
    if (sig === this.infSig && !el.classList.contains('hidden')) return; this.infSig = sig;
    el.classList.remove('hidden');
    const dots = [0, 1, 2].map(i => i < I.warn ? '🟡' : '⚪').join('');
    const kf = I.plan && !I.keys ? ' (' + INF_FLOOR_META[I.keysFloor].short + ')' : '';
    const st = (ok, ic) => ok ? '✅' : ic;
    const al = I.alarm ? `🔥 ${I.alarm.call ? 'fin' : 'appel'} ${Math.ceil(Math.max(0, (I.alarm.call ? I.alarm.dur : 32) - I.alarm.t))} s` : st(I.alarmUsed, '🔥');
    const head = P.out ? '🌳 TU ES DEHORS ! guide ton équipier' : P.jail ? '🔒 EN COLLE… (' + jailLeft + ' s)' : I.hunt ? (hideLeft ? '🫣 RESTE CACHÉ·E ' + hideLeft + ' s' : (I.coop ? '🚨 ON VOUS CHERCHE ! cachez-vous 20 s' : '🚨 ON TE CHERCHE ! cache-toi 20 s')) : '⚠️ ' + dots;
    const objs = `${st(I.keys, '🔑')}${kf} ${st(I.plan, '🗺️')} ${al}${G.P.keys ? ' 🗝️×' + G.P.keys : ''}`;
    const calm = !P.out && !P.jail && !I.hunt;
    el.innerHTML = (calm ? `<div class="tl">⚠️${dots} · ${objs}</div>` : `<div class="hd">${head}</div><div class="tl">${objs}</div>`) + (Q ? `<div class="tl">🤝 ${esc(Q.cfg.name || 'Équipier')} : ${qs}</div>` : '');
    el.classList.toggle('all', I.keys);
  },
  launch(i, keepSeed) {
    startLevel(i, this.cfg(), null, { seed: keepSeed && G.seed != null ? G.seed : (this.procOn() ? newSeed() : null) });
    const L = LEVELS[i], pr = PROFS[L.prof];
    $('inNum').textContent = 'NIVEAU ' + (i + 1) + ' · ' + L.place.toUpperCase();
    $('inTitle').textContent = L.title;
    $('inName').textContent = pr.name; $('inRole').textContent = pr.title.charAt(0).toUpperCase() + pr.title.slice(1);
    $('inQuote').textContent = '« ' + pr.lines.start + ' »';
    $('inMission').innerHTML = '<b style="color:var(--yel)">Mission :</b> 3 <b>tâches</b> débiles, puis <b>une</b> sortie secrète. Facile. 😏';
    portrait($('inProf'), pr.cfg, pr.v, 1);
    $('inHints').innerHTML = ''; $('inHints').dataset.title = '🚪 Les 3 sorties secrètes'; L.hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    const extra = ['📋 Les <b>tâches</b> = les ⭐ jaunes. Ensuite seulement, la sortie.', '🥸 Un <b>déguisement</b> traîne dans un meuble. Fouille.', '🧸 Un <b>squishy</b> est caché : ton joker anti-prof.'];
    if (pr.tires) extra.push('💨 Rapide… mais vite essoufflé.');
    if (pr.chatty) extra.push('🗣️ Parle non-stop. Pratique pour la repérer.');
    if (pr.hasKeys) extra.push('🔑 A TOUTES les clés. Et connaît toutes les cachettes.');
    if (pr.hear > 1.2) extra.push('👂 Oreille de chauve-souris. Marche doucement.');
    if (i === 0) extra.push('🧒 Les autres élèves ne balancent pas. Normalement.');
    if (G.seed != null) extra.unshift('🎲 <b>Plan surprise</b> : collège différent à chaque fois. Les indices restent vrais.');
    $('inTips').innerHTML = (extra.length ? extra.join('<br>') + '<br>' : '') + '👆 Un peu = discret · à fond = bruyant.';
    G.mode = 'intro'; this.show('sIntro'); this.hudSig = null; this.invSig = null; $('bGo').textContent = 'C’est parti !'; $('bGo').disabled = false;
    $('hint').classList.remove('hidden'); $('hint').style.opacity = 1; Input.used = false;
    $('toast').classList.add('hidden'); $('banner').classList.add('hidden');
    AU.play('sneak');
  },
  launchInf(same) {
    try { infStart(this.cfg(), same && G.inf ? G.inf.seed : null); }
    catch (e) { console.error(e); this.toast('Oups, le collège n’a pas pu être construit… réessaie !', 2.5); return; }
    const I = G.inf;
    $('inNum').textContent = '🕵️ MODE INFILTRATION · 4 ÉTAGES';
    $('inTitle').textContent = 'La grande évasion';
    $('inName').textContent = I.maitresseName; $('inRole').textContent = 'Ta maîtresse. Elle a des yeux partout.';
    $('inQuote').textContent = '« Personne ne quitte la classe avant la sonnerie ! »';
    $('inMission').innerHTML = '<b style="color:var(--yel)">Mission :</b> t’évader. Tu es au <b>3e</b>. Descends jusqu’à la <b>cour</b> et sors. Simple, non ? 😏';
    portrait($('inProf'), I.maitresseCfg || this.cfg(), { adult: true }, 1);
    const hints = ['⚠️ Vu hors de classe = avertissement. À 3, ça court.',
      '🪑 Elle écrit au tableau ? C’est le moment de filer.',
      '🪜 Escaliers alternés : traverse chaque étage. Merci l’architecte.',
      '🔑 Le trousseau (bureau d’un prof) ouvre la grille du 1er et le portail.',
      '👁️ Porte fermée ? Regarde par la serrure d’abord.',
      '🗺️ Un plan dans un couloir montre où sont les profs.',
      '🔥 L’alarme vide les étages. Mais gare à l’appel !',
      '🇬🇧 2e : Miss Teacup donne des leçons d’anglais. Bonne réponse = cadeau.',
      '🦴 1er : interro d’histoire avec M. Silex. Bonne réponse = un garde du corps à poils.',
      '🧸 Un squishy par étage. Si on t’attrape : SPLOTCH.'];
    $('inHints').innerHTML = ''; $('inHints').dataset.title = '💡 Comment jouer'; hints.forEach(h => { const li = document.createElement('li'); li.textContent = h; $('inHints').appendChild(li); });
    $('inTips').innerHTML = '🎲 Collège différent à chaque partie.<br>👆 Un peu = discret · à fond = bruyant.';
    G.mode = 'intro'; this.show('sIntro'); this.hudSig = null; this.invSig = null; this.infSig = null; $('bGo').textContent = 'C’est parti !'; $('bGo').disabled = false;
    $('hint').classList.remove('hidden'); $('hint').style.opacity = 1; Input.used = false;
    $('toast').classList.add('hidden'); $('banner').classList.add('hidden'); $('bPlan').classList.add('hidden'); $('bDiv').classList.add('hidden'); $('bPing').classList.add('hidden');
    AU.play('sneak');
  },
  openPlan(f) {
    const I = G.inf; if (!I || !I.plan || G.mode !== 'play') return;
    AU.sfx('tick'); Input.reset(); this.planF = f == null ? I.cur : f; this.planOpen = true; G.overlay = G.net ? null : 'plan'; $('sPlan').classList.remove('hidden');
    $('plTabs').innerHTML = I.floors.map(F => `<button data-f="${F.f}" class="${F.f === this.planF ? 'on' : ''}">${F.f === I.cur ? '📍' : ''}${INF_FLOOR_META[F.f].short}</button>`).reverse().join('');
    $('plTabs').querySelectorAll('button').forEach(b => b.onclick = () => this.openPlan(+b.dataset.f));
  },
  closePlan() { G.overlay = null; this.planOpen = false; $('sPlan').classList.add('hidden'); },
  tickInf() {
    const I = G.inf, P = G.P && viewerA(), pk = $('sPeek');
    const peeking = !!(I && P && P.busy && P.busy.peek && G.mode === 'play');
    pk.classList.toggle('hidden', !peeking);
    if (peeking) infDrawPeek($('peekCv'));
    if (this.planOpen) { if (!I || G.mode !== 'play') this.closePlan(); else infDrawPlan($('planCv'), this.planF); }
  },
  pause() {
    if (G.mode !== 'play') return;
    $('pRestart').classList.toggle('hidden', !!G.net); $('pLevels').textContent = G.net ? '🏠 Quitter la partie' : '🏫 Niveaux'; $('pResume').textContent = G.net ? '▶ Continuer (la partie tourne !)' : '▶ Reprendre';
    if (!G.net) { this.pausedFrom = G.mode; G.mode = 'paused'; }
    this.show('sPause'); this.syncTogs();
    $('pDiag').textContent = '🛠️ qualité ' + Perf.q + ' · sprites ' + CHAR_CACHE.size + ' · ratés ' + ((window.__sprErr || 0) + (window.__canvasFail || 0)) + (window.__lastErr ? ' · ' + window.__lastErr : '');
  },
  // ---------- résultat ----------
  result(win) {
    if (G.inf) { this.resultInf(win); return; }
    const i = G.lvl, pr = G.T.prof, p = $('resPanel'), t = G.time;
    const mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    if (win) {
      const par = [180, 210, 230, 230, 230, 230, 270][i];
      const stars = 1 + (G.spotted <= 1 ? 1 : 0) + (t < par ? 1 : 0);
      this.prog.stars[i] = Math.max(this.prog.stars[i] || 0, stars);
      this.prog.unlocked = Math.max(this.prog.unlocked, Math.min(LEVELS.length, i + 2)); this.save();
      const last = i === LEVELS.length - 1;
      p.innerHTML = `<div class="bigtitle" style="color:var(--green)">ÉVASION<br>RÉUSSIE !</div>
        <div class="stars">${[0, 1, 2].map(k => `<span class="${k < stars ? '' : 'off'}">⭐</span>`).join('')}</div>
        <div class="stats"><span>⏱️ ${mm}</span><span>👀 vu ${G.spotted}×</span></div>
        <div class="tips" style="text-align:center">⭐ sortie trouvée · ⭐ vu 1 fois max · ⭐ en moins de ${Math.floor(par / 60)}:${String(par % 60).padStart(2, '0')}</div>
        ${last ? '<div class="quote" style="text-align:center">🏆 Bravo ' + esc(G.P.cfg.name) + ' ! Tu as échappé à TOUT le collège Notre-Dame de Sion !</div>' : ''}
        ${!last ? '<button class="btn big green" id="rNext">Niveau suivant ▶</button>' : ''}
        <div class="row"><button class="btn" id="rAgain">↻ Rejouer</button><button class="btn ghost" id="rLv">🏫 Niveaux</button></div>`;
      if (!last) $('rNext').onclick = () => { AU.sfx('blip'); this.launch(i + 1); };
    } else {
      p.innerHTML = `<div class="bigtitle" style="color:var(--red)">HEURE<br>DE COLLE !</div>
        <div class="prof"><canvas id="rProf" width="20" height="34"></canvas><div class="quote"></div></div>
        <div class="stats"><span>⏱️ ${mm}</span><span>👀 vu ${G.spotted}×</span></div>
        <div class="tips">💡 ${esc(pick(['Marche doucement (joystick à moitié) : le prof ne t’entend pas.', 'Cache-toi seulement quand le prof ne te voit pas, sinon il fonce sur ta cachette !', 'Ferme une porte à clé derrière toi pour gagner du temps.', 'Les traces orange montrent où le prof marche, même à travers les murs.', 'La pomme dormeuse l’endort 8 secondes : pose-la sur son chemin.', 'Le gâteau te fait rétrécir : tu passes sous les portes fermées !']))}</div>
        <button class="btn big green" id="rAgain">↻ Réessayer${G.seed != null ? ' (même plan)' : ''}</button>
        ${G.seed != null ? '<button class="btn" id="rNew">🎲 Nouveau plan</button>' : ''}
        <button class="btn ghost" id="rLv">🏫 Niveaux</button>`;
      portrait($('rProf'), pr.cfg, pr.v, 1);
      p.querySelector('.quote').textContent = '« ' + pr.lines.caught + ' »';
    }
    $('rAgain').onclick = () => { AU.sfx('blip'); this.launch(i, !win); };
    if ($('rNew')) $('rNew').onclick = () => { AU.sfx('blip'); this.launch(i); };
    $('rLv').onclick = () => { AU.sfx('blip'); this.openLevels(); };
    this.show('sResult');
  },
  resultInf(win) {
    const I = G.inf, p = $('resPanel'), t = G.time, pr = G.T.prof;
    const mm = Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    if (win) {
      const stars = 1 + (!I.chased ? 1 : 0) + (I.warn <= 1 ? 1 : 0);
      const best = store.get('infBest', 0); if (!best || t < best) store.set('infBest', t);
      p.innerHTML = `<div class="bigtitle" style="color:var(--green)">LIBRE !<br>TU AS QUITTÉ<br>LE COLLÈGE !</div>
        <div class="stars">${[0, 1, 2].map(k => `<span class="${k < stars ? '' : 'off'}">⭐</span>`).join('')}</div>
        <div class="stats"><span>⏱️ ${mm}</span><span>⚠️ ${I.warn}/3</span><span>${I.keys ? '🔑' : ''}${I.plan ? '🗺️' : ''}${I.alarmUsed ? '🔥' : ''}</span></div>
        <div class="tips" style="text-align:center">⭐ évadé·e · ⭐ jamais poursuivi·e · ⭐ 1 avertissement max</div>
        <button class="btn big green" id="rAgain">🎲 Un autre collège</button>
        <div class="row"><button class="btn" id="rSame">↻ Même collège</button><button class="btn ghost" id="rLv">🏠 Menu</button></div>`;
      $('rAgain').onclick = () => { AU.sfx('blip'); this.launchInf(false); };
      $('rSame').onclick = () => { AU.sfx('blip'); this.launchInf(true); };
    } else {
      p.innerHTML = `<div class="bigtitle" style="color:var(--red)">RETOUR<br>EN CLASSE !</div>
        <div class="prof"><canvas id="rProf" width="20" height="34"></canvas><div class="quote"></div></div>
        <div class="stats"><span>⏱️ ${mm}</span><span>📍 ${INF_FLOOR_META[I.cur].name}</span></div>
        <div class="tips">💡 ${esc(pick(['Regarde par la serrure avant d’ouvrir une porte !', 'File quand la maîtresse écrit au tableau : elle te tourne le dos.', 'Le plan d’évacuation montre où sont tous les profs.', 'L’alarme incendie vide les étages… sois dans le rang au moment de l’appel !', 'Le trousseau ouvre la grille du 1er étage ET le portail.', 'Cache-toi dans un casier quand le surveillant approche.']))}</div>
        <button class="btn big green" id="rAgain">↻ Réessayer (même collège)</button>
        <button class="btn" id="rNew">🎲 Un autre collège</button>
        <button class="btn ghost" id="rLv">🏠 Menu</button>`;
      portrait($('rProf'), pr.cfg, pr.v, 1);
      p.querySelector('.quote').textContent = '« ' + (pr.lines.caught || 'En retenue !') + ' »';
      $('rAgain').onclick = () => { AU.sfx('blip'); this.launchInf(true); };
      $('rNew').onclick = () => { AU.sfx('blip'); this.launchInf(false); };
    }
    $('rLv').onclick = () => { AU.sfx('blip'); G.inf = null; G.mode = 'menu'; AU.play('menu'); this.openTitle(); };
    this.show('sResult');
  },
  toast(text, dur) {
    const t = $('toast'); t.textContent = text; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => t.classList.add('hidden'), dur * 1000);
  },
  banner(text) {
    const b = $('banner'); b.textContent = text; b.classList.remove('hidden');
    clearTimeout(this.bannerTimer); this.bannerTimer = setTimeout(() => b.classList.add('hidden'), 4200);
  },
  bumpSlot(i) { const s = document.querySelector('#inv .slot[data-i="' + i + '"]'); if (!s) return; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); AU.sfx('blip'); },
  heart() { const h = $('hHeart'); h.style.transform = 'scale(1.5)'; setTimeout(() => h.style.transform = '', 110); },
  // ---------- HUD ----------
  hud(dt) {
    if (!G.P || !['play', 'intro', 'paused', 'escape', 'caught', 'timeup', 'result'].includes(G.mode)) return;
    G.actions = computeActions();
    const P = G.P, T = G.T;
    // actions
    const sig = G.actions.map(a => a.id + a.label + a.sub + (a.progress != null ? Math.round(a.progress * 20) : '')).join('|');
    if (sig !== this.hudSig) {
      this.hudSig = sig;
      [$('act1'), $('act2')].forEach((b, i) => {
        const a = G.actions[i];
        if (!a) { b.classList.add('hidden'); return; }
        const was = b.classList.contains('hidden') || b.dataset.id !== a.id; b.dataset.id = a.id;
        b.classList.remove('hidden');
        if (was) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
        b.innerHTML = `<span class="ai">${a.icon}</span>${esc(a.label)}${a.sub ? `<span class="as">${esc(a.sub)}</span>` : ''}${a.progress != null ? `<span class="pg" style="width:${Math.round(a.progress * 100)}%"></span>` : ''}`;
      });
    }
    const isig = P.inv.join(',') + '|' + (P.sqIds || []).join(',');
    if (isig !== this.invSig) {
      this.invSig = isig; const inv = $('inv'); inv.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const k = P.inv[i]; if (!k) continue;   // pas de cases vides : moins d'encombrement
        const b = document.createElement('button'); b.className = 'slot'; b.dataset.i = i;
        if (k) { const cv = document.createElement('canvas'); cv.width = 14; cv.height = 14; cv.getContext('2d').drawImage(k === 'squishy' ? squishyCanvas(squishyAt(P, i)) : itemCanvas(k), 0, 0); b.appendChild(cv); const s = document.createElement('span'); s.textContent = ITEMS[k].short; b.appendChild(s); b.setAttribute('aria-label', ITEMS[k].n); }
        inv.appendChild(b);
      }
    }
    this.hudT -= dt; if (this.hudT > 0) return; this.hudT = 0.12;
    const VA = viewerA(), teach = G.net && G.net.role === 'teacher';
    const [tx, ty] = tileOf(VA); let rn = G.m.roomAt(tx, ty) || '…';
    if (G.inf && /^Escalier [AB]$/.test(rn)) { const k = stairKind(rn.slice(-1)), to = k === 'up' ? G.inf.cur + 1 : G.inf.cur - 1; rn += k === 'down' ? ' ⬇ descend ' + (to === 0 ? 'au RDC' : 'au ' + INF_FLOOR_META[to].short) : k === 'up' ? ' ⬆ monte au ' + INF_FLOOR_META[to].short : k === 'locked' ? ' 🔒 grille fermée' : ' 🚧 fermé'; }
    const rt = '📍 ' + (G.inf ? INF_FLOOR_META[G.inf.cur].short + ' · ' : '') + rn; if ($('hRoom').textContent !== rt) $('hRoom').textContent = rt;
    if (G.inf) this.hudInf(); else { $('bDiv').classList.add('hidden'); $('bPing').classList.add('hidden'); }
    $('inv').style.visibility = teach ? 'hidden' : '';
    const st = $('hStatus'); let s = '😌 Calme', cls = '';
    if (G.net && !(G.inf && G.inf.coop)) {
      if (teach) {
        if (T.state === 'count') { s = '🙈 Tu comptes…'; cls = 'warn'; } else if (T.state === 'sleep') { s = '💤 Tu dors…'; cls = 'cool'; } else if (T.state === 'stun') { s = '😵 La tête qui tourne…'; cls = 'cool'; }
        else if (G.pVis) { s = '👀 En vue ! Attrape !'; cls = 'alarm'; } else if (G.slowT > 0) { s = '🐢 Ralenti…'; cls = 'cool'; } else s = '🎯 Trouve ' + (P.cfg.name || 'l’élève');
      } else {
        if (T.state === 'count') { s = '⏳ Ça compte… file !'; cls = 'warn'; } else if (G.alarmT > 0) { s = '🚨 POURSUITE !'; cls = 'alarm'; }
        else if (T.state === 'sleep') { s = '💤 Dodo !'; cls = 'cool'; } else if (T.state === 'stun') { s = '😵 Le prof est sonné !'; cls = 'cool'; } else if (T.state === 'check') { s = '🔎 Fouille une cachette'; cls = 'warn'; }
        else if (T.state === 'keys' || T.state === 'unlock') { s = '🔑 Prend ses clés'; cls = 'cool'; } else if (T.running) { s = '🏃 Le prof court !'; cls = 'warn'; } else s = '👀 Le prof te cherche';
      }
    } else switch (T.gone ? 'gone' : T.state) {
      case 'gone': s = '🔥 Étage vide !'; cls = 'cool'; break;
      case 'evac': s = '🔥 Évacuation !'; cls = 'cool'; break;
      case 'warn': s = '☝️ Avertissement !'; cls = 'warn'; break;
      case 'count': s = '⏳ Ça compte… file !'; cls = 'warn'; break;
      case 'alert': case 'investigate': s = '🤨 Méfiance…'; cls = 'warn'; break;
      case 'search': case 'check': s = '🔎 Fouille les cachettes'; cls = 'warn'; break;
      case 'chase': s = '🚨 POURSUITE !'; cls = 'alarm'; break;
      case 'tired': s = '😮‍💨 Essoufflé !'; cls = 'cool'; break;
      case 'fetch': case 'keys': case 'toDoor': case 'unlock': s = '🔑 Cherche ses clés'; cls = 'cool'; break;
      case 'eat': s = '🍎 Miam, une pomme !'; cls = 'cool'; break;
      case 'sleep': s = '💤 Dodo !'; cls = 'cool'; break;
      case 'caught': s = '😱 Oh non !'; cls = 'alarm'; break;
      case 'blind': s = '🙈 Aveuglé par le squishy !'; cls = 'cool'; break;
    }
    st.textContent = s; st.className = 'chip ' + cls;
    const t = G.net ? Math.max(0, Net.timeLeft) : G.time, ht = $('hTime');
    ht.textContent = (G.net ? '⏰ ' : '⏱ ') + Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    ht.style.color = G.net && t < 30 ? '#ff8a96' : '';
    const tOpen = !!this.tasksOpen || G.time < 6 || G.time < (this.taskPeekT || 0);
    if (G.inf) { /* objectifs gérés par hudInf */ } else if (G.tasks !== this.taskRef || (teach ? 'T' + (G.tasksRemote || 0) : G.tasks.map(t => t.done ? 1 : 0).join('') + tOpen) !== this.taskSig) {
      if (G.tasks === this.taskRef && !teach && G.tasksDone > (this.taskDoneN || 0)) { this.taskPeekT = G.time + 3.5; }
      this.taskDoneN = G.tasksDone;
      this.taskRef = G.tasks; this.taskSig = teach ? 'T' + (G.tasksRemote || 0) : G.tasks.map(t => t.done ? 1 : 0).join('') + (!!this.tasksOpen || G.time < 6 || G.time < (this.taskPeekT || 0));
      const el = $('hTasks'), n = G.tasks.length; el.classList.toggle('hidden', !n || G.mode === 'intro');
      if (teach) { const r = G.tasksRemote || 0; el.innerHTML = `<div class="hd">TÂCHES DE L’ÉLÈVE</div><div class="tl">📋 ${r}/${n} ${r >= n ? '😱 SORTIES OUVERTES' : '· sorties 🔒'}</div>`; el.classList.toggle('all', r >= n); }
      else {
        const open = this.taskSig.endsWith('true'), all = tasksLeft() === 0;
        el.innerHTML = all ? `<div class="hd">📋 TÂCHES ${n}/${n} ✅</div><div class="tl">🚪 File vers une sortie !</div>`
          : open ? `<div class="hd">📋 TÂCHES ${G.tasksDone}/${n}<span class="tg">▴</span></div>` + G.tasks.map(t => `<div class="tl${t.done ? ' ok' : ''}">${t.done ? '✅' : t.def.icon} ${esc(t.def.name)}</div>`).join('')
          : `<div class="hd">📋 TÂCHES ${G.tasksDone}/${n}<span class="tg">▾</span></div><div class="ic">${G.tasks.map(t => t.done ? '✅' : t.def.icon).join('')}</div>`;
        el.classList.toggle('all', all);
      }
    }
    if (G.mode === 'intro') $('hTasks').classList.add('hidden'); else if (G.tasks.length) $('hTasks').classList.remove('hidden');
    $('hLocks').textContent = teach ? (T.hasKeys ? '🔑 ✔' : '🔑 ✘') : '🔑×' + locksLeft();
    { const pt = G.P && G.P.pet, txt = pt && pt.leaveT == null ? pt.e + ' ' + '❤'.repeat(Math.max(0, pt.charges)) : ''; const el = $('hPet'); el.classList.toggle('hidden', !txt); if (el.textContent !== txt) el.textContent = txt; }
    const d = dist(T.x, T.y, P.x, P.y) / 16; $('hHeart').textContent = teach ? '🎯' : (T.state === 'chase' || G.alarmT > 0) ? '❤️‍🔥' : d < 4 ? '💓' : d < 8 ? '💗' : '🤍';
    const eff = [];
    if (teach) { if (G.slowT > 0) eff.push('🐢 Ralenti ' + Math.ceil(G.slowT) + 's'); $('hEffects').innerHTML = eff.map(e => `<div>${e}</div>`).join(''); $('hHidden').classList.add('hidden'); return; }
    if (P.small > 0) eff.push('🍰 Petit ' + Math.ceil(P.small) + 's');
    if (P.slip > 0) eff.push('👠 Silence ' + Math.ceil(P.slip) + 's');
    if (G.reveal > 0) eff.push('🪞 Miroir ' + Math.ceil(G.reveal) + 's');
    if (G.slowT > 0) eff.push('⏱️ Ralenti ' + Math.ceil(G.slowT) + 's');
    $('hEffects').innerHTML = eff.map(e => `<div>${e}</div>`).join('');
    const hh = $('hHidden');
    if (P.hidden) { hh.classList.remove('hidden'); hh.textContent = '🤫 Chut… ' + P.hidden.n; } else hh.classList.add('hidden');
  }
};
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// ================= ÉCRAN TITRE ANIMÉ =================
const Title = {
  t: 0, kid: null,
  draw(dt) {
    if ($('sTitle').classList.contains('hidden')) return;
    this.t += dt; const cv = $('titleCv'), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    if (!this.kid) this.kid = UI.cfg() || randomChar('');
    c.fillStyle = '#7d5a8a'; c.fillRect(0, 0, 176, 20);
    for (let x = 0; x < 176; x += 16) drawWallTile(c, x, 4, WS.PAINT, true, x, 0);
    for (let x = 0; x < 176; x += 16) { drawFloorTile(c, x, 20, FS.CHECK, x / 16, 1); drawFloorTile(c, x, 36, FS.CHECK, x / 16, 2); }
    drawWallDecor(c, 32, 4, { t: 'poster', x: 1, y: 2 }, 0); drawWallDecor(c, 112, 4, { t: 'clock' }, 0); drawFurniture(c, K.LOCKER, 64, 4, 3, 0, { get: () => K.FLOOR }, { lockerCol: '#d94a5a' }); drawFurniture(c, K.LOCKER, 80, 4, 4, 0, { get: () => K.FLOOR }, { lockerCol: '#d94a5a' });
    const span = 176 + 80, x = ((this.t * 46) % span) - 40;
    const fk = Math.floor(this.t * 14) % 6, ft = Math.floor(this.t * 12 + 2) % 6;
    const k = charCanvas(this.kid, 2, fk, null, 'run'), pr = PROFS[(Math.floor(this.t * 46 / span)) % 5], tc = charCanvas(pr.cfg, 2, ft, pr.v, 'run');
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 6, 52, 9, 2); c.fillRect(x - 30, 52, 11, 2);
    const bk = Math.round(POSE.run[fk].bob * 0.7), bt = Math.round(POSE.run[ft].bob * 0.7);
    c.save(); c.translate(x + 10, 52 - bk); c.rotate(0.15); c.drawImage(k, -10, -32); c.restore();
    c.save(); c.translate(x - 24, 52 - bt); c.rotate(0.15); c.drawImage(tc, -10, -32); c.restore();
    if (fk === 0 || fk === 3) { c.fillStyle = '#e6ddd0'; c.fillRect(x + 2, 50, 3, 2); }
    if ((this.t * 3 | 0) % 2) { c.fillStyle = '#ff4040'; c.fillRect(x - 26, 12, 2, 6); c.fillRect(x - 26, 19, 2, 2); }
    c.fillStyle = '#d8d0c4'; c.fillRect(x + 2 - (this.t * 30 % 6), 51, 2, 2);
  }
};

// ================= BOUCLE PRINCIPALE =================
let lastT = 0;
function loop(ts) {
  const raw = (ts - lastT) / 1000 || 0.016, dt = Math.min(0.05, raw); lastT = ts;
  try {
    Perf.tick(raw);
    FX.update(dt);
    if (['play', 'escape', 'caught', 'timeup'].includes(G.mode) && !G.overlay) update(dt);
    TaskUI.tick(dt); UI.tickInf();
    if (G.P && ['play', 'intro', 'paused', 'escape', 'caught', 'timeup', 'result'].includes(G.mode)) renderGame(dt);
    else { V.ctx.setTransform(1, 0, 0, 1, 0, 0); V.ctx.fillStyle = '#22163f'; V.ctx.fillRect(0, 0, V.W, V.H); }
    UI.hud(dt); UI.tickCreator(dt); Title.draw(dt);
  } catch (e) { console.error(e); window.__err = (window.__err || '') + e.stack + '\n'; }
  requestAnimationFrame(loop);
}
function boot() {
  setupView(); Input.init(); UI.init(); TaskUI.init();
  const go = () => requestAnimationFrame(loop);
  if (document.fonts && document.fonts.load) Promise.race([document.fonts.load('10px "Press Start 2P"'), new Promise(r => setTimeout(r, 1500))]).then(go, go); else go();
}
boot();
