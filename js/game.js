'use strict';
// =====================================================================
// GAME FLOW: title -> character select -> chapters
//   each chapter: cutscene -> calm walk (talk + notes) -> gate quiz -> battle -> end card
// =====================================================================
const SHORT = { zapata: 'Zapata', campesino: 'Campesino', villa: 'Villa', madero: 'Madero', diaz: 'Díaz', huerta: 'Huerta', carranza: 'Carranza', guajardo: 'Guajardo' };
const G = { scene: null, nP: Save.get('np', 2), split: Save.get('split', true), heroes: Save.get('heroes', ['zapata', 'villa', 'campesino']), players: [], ch: null, t: 0 };
const show = (id, on = true) => $(id).classList.toggle('hide', !on);
function fitStage() { const s = Math.min(innerWidth / W, innerHeight / H); $('stage').style.transform = `scale(${s})`; }
addEventListener('resize', fitStage);

// ---------- input for menus / panels ----------
let onEnter = null, onKey = null, openedAt = 0;
addEventListener('keydown', e => {
  Sound.init();
  if (Settings.capture) { e.preventDefault(); Settings.setKey(e.code); return; }
  if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return;
  if (e.code === 'Escape') { e.preventDefault(); Settings.isOpen ? Settings.close() : Settings.open(); return; }
  if (Settings.isOpen) return;
  if (Date.now() - openedAt < 250) return;
  if (onKey && onKey(e)) { e.preventDefault(); return; }
  if ((e.code === 'Enter' || e.code === 'Space') && onEnter) { e.preventDefault(); onEnter(); }
});
['mousedown', 'pointerdown', 'click', 'touchstart'].forEach(ev => addEventListener(ev, () => Sound.init(), true));
// click a character to see their name
cv.addEventListener('mousedown', e => {
  if (!World.views || !World.L || ![Explore, Battle].includes(G.scene)) return;
  const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W, sy = (e.clientY - r.top) / r.height * H;
  const v = World.views.find(v => sx >= v.x0 && sx < v.x0 + v.w); if (!v || !v.cam) return;
  const wx = (sx - v.x0) / v.cam.z + v.cam.x, wy = sy / v.cam.z + v.cam.y;
  const hits = World.players.filter(p => !p.dead).map(p => ({ o: p, x0: p.x - 10, x1: p.x + p.w + 10, y0: p.y - 18, y1: p.y + p.h, text: `Jugador ${p.i + 1}`, col: p.color }));
  const h = hits.find(h => wx >= h.x0 && wx <= h.x1 && wy >= h.y0 && wy <= h.y1);
  if (h) World.label = { o: h.o, text: h.text, col: h.col, t: 120 };
});
function panel(html, opt = {}) {
  const p = $('panel'); p.innerHTML = html; p.style.top = opt.top || ''; p.style.width = opt.width || '';
  show('panel'); show('dim', !opt.noDim); p.scrollTop = 0; onEnter = opt.enter || null; onKey = opt.key || null; openedAt = Date.now();
}
function closePanel() { show('panel', false); show('dim', false); onEnter = null; onKey = null; $('tip').style.display = 'none'; }
let msgT = null;
function msg(t) { const m = $('msg'); m.textContent = t; show('msg'); clearTimeout(msgT); msgT = setTimeout(() => show('msg', false), 2600); }

// ---------- typewriter ----------
function typewrite(el, text, speed, done) {
  let i = 0, finished = false; el.textContent = '';
  const fin = () => { if (finished) return; finished = true; clearInterval(id); el.innerHTML = wrapWords(text); done && done(); };
  const id = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i % 3 === 0) Sound.sfx('type'); if (i >= text.length) fin(); }, speed);
  return { skip: fin, get done() { return finished; } };
}

// ---------- one spoken line (subtitle bar) ----------
// lines: [{who, es, en, vo}] ; done when all finished
function speak(lines, done, opt = {}) {
  let i = -1, tw = null, voDone = false, adv = null;
  const next = () => {
    clearTimeout(adv); Sound.stopVoice(); i++;
    if (i >= lines.length) { show('sub', false); onEnter = null; return done && done(); }
    const L = lines[i], who = L.who; show('sub');
    const pc = $('subpor'), g = pc.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 96, 96);
    pc.style.display = who && who !== 'narr' ? '' : 'none'; if (who && who !== 'narr') g.drawImage(portrait(who), 0, 0);
    $('subname').textContent = who && who !== 'narr' ? CAST[who].name : '';
    $('suben').textContent = ''; voDone = !L.vo; G.speaker = who;
    tw = typewrite($('subes'), L.es, 32, () => { $('suben').textContent = L.en || ''; maybeAuto(); });
    if (L.vo) Sound.voice(L.vo, () => { voDone = true; maybeAuto(); });
    else setTimeout(() => { voDone = true; maybeAuto(); }, 900 + L.es.length * 45);
  };
  const maybeAuto = () => { if (tw && tw.done && voDone && opt.auto !== false) { clearTimeout(adv); adv = setTimeout(next, 900); } };
  onEnter = () => { if (tw && !tw.done) tw.skip(); else next(); };
  openedAt = Date.now(); next();
}

// =====================================================================
// TITLE
// =====================================================================
const Title = {
  start() {
    G.scene = this; this.x = 0; Sound.play('title'); closeAll();
    const opt = (k, v, label) => `<button class="btn ${G[k] === v ? 'on' : 'alt'}" onclick="G.${k}=${JSON.stringify(v)};Save.set('${k === 'nP' ? 'np' : k}',${JSON.stringify(v)});Title.start()">${label}</button>`;
    panel(`<div style="text-align:center">
      <div class="lbl">JUGADORES</div>${opt('nP', 1, '1')}${opt('nP', 2, '2')}${opt('nP', 3, '3')}
      <div class="lbl">PANTALLA</div>${opt('split', true, 'Dividida')}${opt('split', false, 'Compartida')}
      <div><button class="btn" style="font-size:30px;margin-top:16px" onclick="Select.start()">Jugar</button><button class="btn alt" onclick="Settings.open()">Ajustes</button></div>
      <div class="small">Enter para jugar. Esc = ajustes (sonido y controles). <a href="index.html" style="color:#c2e3e8">Modo estudio</a></div></div>`, { top: '74%', width: '520px', noDim: true, enter: () => Select.start() });
  },
  update() { this.x += 1.2; },
  draw() {
    drawBackground(ctx, 'village', this.x, W);
    for (let x = -((this.x) % T); x < W; x += T) { tile(ctx, 'tiles', 22, x, 520); for (let y = 520 + T; y < H; y += T) tile(ctx, 'tiles', 4, x, y); }
    const ids = ['zapata', 'campesino', 'soldado', 'campesina', 'villa'];
    ids.forEach((id, i) => drawChar(ctx, id, ((G.t * 1.4 + i * 110) % (W + 300)) - 150, 520, 4, 1, walkFrame(Math.floor(G.t / 8 + i))));
    ctx.fillStyle = 'rgba(43,47,61,.55)'; ctx.fillRect(0, 70, W, 170);
    ctx.font = '84px Future, Pixel'; ctx.textAlign = 'center'; ctx.fillStyle = PAL.ink; ctx.fillText('TIERRA Y LIBERTAD', W / 2 + 4, 174); ctx.fillStyle = PAL.paper; ctx.fillText('TIERRA Y LIBERTAD', W / 2, 170);
    txt(ctx, 'La historia de Emiliano Zapata', W / 2, 222, 22, PAL.sand, 'center');
  },
};
function closeAll() { closePanel(); ['qbar', 'obj', 'msg', 'sub', 'card', 'topbar'].forEach(id => show(id, false)); Sound.stopVoice(); }

// =====================================================================
// CHARACTER SELECT
// =====================================================================
const Select = {
  start() {
    G.scene = this; closeAll(); Sound.play('title'); this.ready = Array(G.nP).fill(false); this.idx = G.heroes.slice(0, G.nP).map(h => Math.max(0, HEROES.findIndex(x => x.id === h)));
    while (this.idx.length < G.nP) this.idx.push(this.idx.length);
    this.render();
  },
  render() {
    const cols = this.idx.map((k, i) => { const h = HEROES[k]; return `<div class="selcol" style="border-color:${this.ready[i] ? PAL.cream : PAL.ink}">
      <div style="font-size:22px;color:#c2e3e8"><span style="display:inline-block;width:14px;height:14px;background:${PCOL[i]};margin-right:8px"></span>Jugador ${i + 1}</div><div class="small">${keysLabel(i)}</div><canvas id="sel${i}" width="160" height="200"></canvas>
      <div style="font-size:28px;color:#fbf1e3">${h.name}</div><div style="color:#959ab1;font-size:20px;letter-spacing:1px">HABILIDAD: ${h.ab.toUpperCase()}</div>
      <div style="font-size:20px">${h.es}</div><div class="en">${h.en}</div>
      <div class="small" style="color:${this.ready[i] ? '#2eb082' : '#959ab1'}">${this.ready[i] ? 'LISTO' : 'Izq / Der: cambiar. Saltar: listo'}</div></div>`; }).join('');
    panel(`<h2>Elige tu personaje</h2><div class="cols">${cols}</div><button class="btn" onclick="Select.go()">Empezar</button>`, { width: G.nP === 3 ? '1000px' : '760px', key: e => this.key(e), enter: () => this.go() });
  },
  key(e) {
    for (let i = 0; i < G.nP; i++) { const k = PKEYS[i];
      if (e.code === k.l || e.code === k.r) { this.idx[i] = (this.idx[i] + (e.code === k.r ? 1 : HEROES.length - 1)) % HEROES.length; this.ready[i] = false; Sound.sfx('select'); this.render(); return true; }
      if (e.code === k.j) { this.ready[i] = true; Sound.sfx('coin'); if (this.ready.every(Boolean)) this.go(); else this.render(); return true; } }
    return false;
  },
  go() {
    G.heroes = this.idx.map(k => HEROES[k].id); Save.set('heroes', G.heroes.concat(['zapata', 'villa', 'campesino']).slice(0, 3));
    G.players = G.heroes.map((h, i) => ({ i, hero: h, name: SHORT[h], color: PCOL[i], keys: PKEYS[i], w: 28, h: 56, face: 1, hp: 100, ammo: 3, streak: 0, best: 0, armor: 0, speedT: 0, jumpT: 0, megaT: 0, shieldT: 0, score: 0, stun: 0, jumps: 0, inv: 0, cd: 0, ko: 0, lock: 0, lockMax: 1, dead: 0, walk: 0, on: null, right: 0, gun: null }));
    Chapters.start();
  },
  update() {},
  draw() {
    Title.draw.call({ x: G.t });
    this.idx.forEach((k, i) => { const c = $('sel' + i); if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = PAL.slate2; g.fillRect(0, 0, 160, 200); drawChar(g, HEROES[k].id, 80, 190, 6.5, 1, walkFrame(Math.floor(G.t / 9))); });
  },
};

// =====================================================================
// CHAPTER LIST
// =====================================================================
const Chapters = {
  start() {
    G.scene = Title; closeAll(); Sound.play('title');
    const un = CHAPTERS.length; // TESTING: all chapters unlocked (was Save.get('unlocked', 1))
    const rows = CHAPTERS.map(ch => `<div class="chap ${ch.id > un ? 'lock' : ''}" onclick="${ch.id <= un ? `Chapters.play(${ch.id})` : ''}"><span>Capítulo ${ch.id}: ${ch.title}</span><span style="color:#959ab1">${ch.years}</span></div>`).join('');
    panel(`<h2>Capítulos</h2>${rows}<button class="btn" onclick="Chapters.play(${Math.min(un, CHAPTERS.length)})">Continuar: Capítulo ${Math.min(un, CHAPTERS.length)}</button><button class="btn alt" onclick="Title.start()">Volver</button>`, { enter: () => this.play(Math.min(un, CHAPTERS.length)) });
  },
  play(id) { G.ch = CHAPTERS[id - 1]; closeAll(); Cut.start(G.ch.cut, () => Explore.start(G.ch), true); },
};

// =====================================================================
// CUTSCENES: animated stage + black typewriter cards
// =====================================================================
const Cut = {
  start(steps, done, withTitle) {
    G.scene = this; closeAll(); Sound.play(G.ch && G.ch.id === 7 ? 'sad' : 'story');
    this.steps = withTitle ? [{ card: [[`Capítulo ${G.ch.id}`, G.ch.years], [G.ch.title, '']] }, ...steps] : steps;
    this.i = -1; this.done = done; this.actors = {}; this.theme = 'village'; this.pan = 0; this.shake = 0; this.wait = 0; this.waitFor = null;
    onKey = null;
    this.next();
  },
  finish() { Sound.stopVoice(); show('card', false); show('sub', false); show('topbar', false); onKey = null; onEnter = null; const d = this.done; this.done = null; d && d(); },
  next() {
    this.i++; this.waitFor = null; this.wait = 0;
    if (this.i >= this.steps.length) return this.finish();
    const s = this.steps[this.i];
    if (s.card) return this.card(s);
    show('card', false); show('topbar');
    if (s.scene) { this.theme = s.scene; this.actors = {}; for (const [id, x, face] of s.actors) this.actors[id] = { x, face, walkTo: null, jump: 0 }; return this.next(); }
    if (s.say || s.narr) { G.speaker = s.say || null; return speak([{ who: s.say || 'narr', es: s.es || s.narr, en: s.en, vo: s.vo }], () => { G.speaker = null; show('sub', false); this.next(); }); }
    show('sub', false); onEnter = () => this.next();
    if (s.enter) { this.actors[s.enter] = { x: s.from === 'left' ? -80 : W + 80, face: s.from === 'left' ? 1 : -1, walkTo: s.to, jump: 0 }; this.waitFor = () => this.actors[s.enter].walkTo == null; }
    else if (s.exit) { const a = this.actors[s.exit]; a.walkTo = s.to === 'left' ? -120 : W + 120; this.waitFor = () => a.walkTo == null; }
    else if (s.walk) { const a = this.actors[s.walk]; a.walkTo = s.to; this.waitFor = () => a.walkTo == null; }
    else if (s.jump) { this.actors[s.jump].jump = 40; this.wait = 45; }
    else if (s.fall) { this.actors[s.fall].fallen = true; Sound.sfx('ko'); this.wait = 50; }
    else if (s.shake) { this.shake = 30; Sound.sfx('boom'); this.wait = 40; }
    else if (s.flag) { this.actors[s.flag].flag = true; Sound.sfx('open'); this.wait = 40; }
    else this.wait = 30;
  },
  card(s) {
    show('sub', false); show('topbar', false); show('card');
    const box = $('cardlines'); box.innerHTML = s.card.map(() => `<div class="l"><div class="es"></div><div class="en"></div></div>`).join('');
    const els = [...box.querySelectorAll('.l')]; let li = 0, tw = null, voDone = !s.vo, adv = null, allDone = false;
    const typeNext = () => { if (li >= s.card.length) { allDone = true; return auto(); } const [es, en] = s.card[li], el = els[li]; tw = typewrite(el.querySelector('.es'), es, 55, () => { el.querySelector('.en').textContent = en || ''; li++; setTimeout(typeNext, 250); }); };
    const auto = () => { if (allDone && voDone) { clearTimeout(adv); adv = setTimeout(go, 1300); } };
    const go = () => { clearTimeout(adv); Sound.stopVoice(); if (this.steps[this.i] === s) this.next(); };
    if (s.vo) setTimeout(() => Sound.voice(s.vo, () => { voDone = true; auto(); }), 300); else setTimeout(() => { voDone = true; auto(); }, 1500);
    onEnter = () => { if (!allDone) { if (tw) tw.skip(); els.forEach((el, k) => { if (!s.card[k]) return; el.querySelector('.es').innerHTML = wrapWords(s.card[k][0]); el.querySelector('.en').textContent = s.card[k][1] || ''; }); li = s.card.length; allDone = true; } else go(); };
    openedAt = Date.now(); typeNext();
  },
  update() {
    this.pan += .3; if (this.shake > 0) this.shake--;
    for (const id in this.actors) { const a = this.actors[id];
      if (a.walkTo != null) { const d = a.walkTo - a.x; if (Math.abs(d) < 3) { a.x = a.walkTo; a.walkTo = null; if (a.x < -100 || a.x > W + 100) delete this.actors[id]; } else { a.x += Math.sign(d) * 3; a.face = Math.sign(d); a.walking = true; if (G.t % 16 === 0) Sound.sfx('step'); } } else a.walking = false;
      if (a.jump > 0) a.jump--; }
    if (this.waitFor && this.waitFor()) { this.waitFor = null; this.next(); }
    else if (this.wait > 0 && --this.wait === 0) this.next();
  },
  draw() {
    const gy = 540; ctx.save(); if (this.shake) ctx.translate((Math.random() - .5) * 10, (Math.random() - .5) * 10);
    drawBackground(ctx, this.theme, this.pan, W);
    const gs = GROUND[THEMES[this.theme].ground];
    for (let x = 0; x < W; x += T) { tile(ctx, gs.sheet, gs.top[1], x, gy); for (let y = gy + T; y < H; y += T) tile(ctx, gs.sheet, gs.fill, x, y); }
    if (this.theme === 'village' || this.theme === 'farm') drawHouse(ctx, 120, gy, 200, 150);
    if (this.theme === 'night') drawArches(ctx, 880, gy);
    if (this.theme === 'desert') { drawDecor(ctx, { k: 'cactus', x: 200, y: gy }); drawDecor(ctx, { k: 'cactus', x: 1100, y: gy }); }
    if (this.theme === 'forest') [100, 260, 1050, 1180].forEach(x => drawDecor(ctx, { k: 'tree', x, y: gy }));
    if (this.theme === 'sky') { drawDecor(ctx, { k: 'flag', x: 1080, y: gy }); drawDecor(ctx, { k: 'tree', x: 150, y: gy }); }
    for (const id in this.actors) {
      const a = this.actors[id], talking = G.speaker === id, bob = talking ? Math.abs(Math.sin(G.t / 6)) * 4 : 0, jy = a.jump ? Math.abs(Math.sin(a.jump / 40 * Math.PI * 2)) * 40 : 0;
      const fr = a.fallen ? 5 : a.walking ? walkFrame(Math.floor(G.t / 8)) : a.jump ? 4 : 0;
      drawChar(ctx, id, a.x, gy - bob - jy + (a.fallen ? 4 : 0), 5, a.face, fr);
      if (talking) { ctx.fillStyle = PAL.paper; ctx.beginPath(); ctx.moveTo(a.x - 10, gy - 150); ctx.lineTo(a.x + 10, gy - 150); ctx.lineTo(a.x, gy - 136); ctx.fill(); }
      if (a.flag) { ctx.fillStyle = PAL.dirt2; ctx.fillRect(a.x + 34, gy - 230, 6, 210); ctx.fillStyle = PAL.ink; ctx.fillRect(a.x + 40, gy - 232, 236, 74); ctx.fillStyle = PAL.maroon; ctx.fillRect(a.x + 43, gy - 229, 230, 68); txt(ctx, 'TIERRA Y', a.x + 158, gy - 200, 18, PAL.paper, 'center'); txt(ctx, 'LIBERTAD', a.x + 158, gy - 170, 18, PAL.paper, 'center'); }
    }
    ctx.restore();
  },
};

// =====================================================================
// CALM PART: walk, talk, collect notes, reach the gate
// =====================================================================
const EV = {
  msg, interact(p) { G.scene.interact && G.scene.interact(p); }, note(n, p) { G.scene.note && G.scene.note(n, p); },
  orb(p, ok, o) { G.scene.orb && G.scene.orb(p, ok, o); }, letter(l, p) { G.scene.letter && G.scene.letter(l, p); }, crate(p, c) { Battle.crate(p, c); }, chest(p, c) { Battle.chest(p, c); },
};
const Explore = {
  start(ch) {
    G.scene = this; closeAll(); this.ch = ch; this.paused = false; this.doorCd = 0;
    G.players.forEach(p => Object.assign(p, { hp: 100, lock: 0, gun: null }));
    World.init(buildExplore2(ch), 'explore', G.players, EV); World.cam = null;
    Sound.play(ch.id === 7 ? 'sad' : 'calm'); show('obj'); this.obj();
    msg('Habla con todos y busca los 3 objetos. Sube alto, baja bajo tierra y entra por las puertas (S).');
  },
  obj() {
    const L = World.L, ppl = L.npcs.filter(n => !n.guard), got = L.notes.filter(n => n.got).length;
    const word = [...L.word].map((c, i) => L.letters.find(l => l.i === i && l.got) ? c : '_').join(' ');
    const ready = ppl.every(n => n.talked) && got === L.notes.length;
    const talked = ppl.filter(n => n.talked).length, nextObj = L.notes.find(n => !n.got);
    const hint = talked < ppl.length ? 'habla con ' + CAST[ppl.find(n => !n.talked).who].name : nextObj ? 'busca ' + nextObj.where : 'camina a la puerta (derecha)';
    $('obj').innerHTML = `<b>Cap. ${this.ch.id} · ${this.ch.title}</b><br>Personas ${talked}/${ppl.length} · Objetos ${got}/${L.notes.length}<br>Palabra: ${word}<br><span class="small">Pista: ${hint}</span>`;
  },
  interact(p) {
    if (this.paused) return; const L = World.L, cx = p.x + p.w / 2, cy = p.y + p.h;
    const d = L.doors.find(d => d.to && Math.abs(d.x - cx) < 40 && Math.abs(d.y - cy) < 60);
    if (d) { // secret door: go through
      const to = d.to; Sound.sfx('open'); World.burst(cx, p.y + 20, PAL.cream, 10, 5);
      Object.assign(p, { x: to.x - p.w / 2, y: to.y - p.h - 1, vx: 0, vy: 0, cx: undefined, inv: 30 }); return;
    }
    const n = L.npcs.filter(n => Math.abs(n.x - cx) < 80 && Math.abs((n.y || GY) - cy) < 90).sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))[0];
    if (!n) return; if (n.guard) return this.guard();
    this.paused = true; n.face = Math.sign(cx - n.x) || -1;
    speak(n.lines.map(([es, en, vo]) => ({ who: n.who, es, en, vo })), () => { n.talked = true; this.paused = false; this.obj(); clearPressed(); });
  },
  guard() {
    const L = World.L, ppl = L.npcs.filter(n => !n.guard); this.paused = true;
    if (!ppl.every(n => n.talked)) { const left = ppl.filter(n => !n.talked).map(n => CAST[n.who].name).join(', '); msg('Te falta hablar con: ' + left); return speak([{ who: 'guardia', es: 'Primero habla con todos.', en: 'Talk to everyone first. Missing: ' + left, vo: 'g2' }], () => { this.paused = false; clearPressed(); }); }
    const miss = L.notes.filter(n => !n.got);
    if (miss.length) { msg('Te faltan objetos: ' + miss.map(n => n.where).join(', ')); return speak([{ who: 'guardia', es: 'Busca los objetos históricos primero.', en: 'Find the historical objects first: ' + miss.map(n => n.where).join(', ') }], () => { this.paused = false; clearPressed(); }); }
    speak([{ who: 'guardia', es: 'Para pasar, contesta mis preguntas.', en: 'Answer my questions to pass.', vo: 'g1' }], () => Gate.start(this.ch));
  },
  letter(l) {
    const L = World.L; this.obj();
    if (L.letters.every(x => x.got)) { G.players.forEach(p => p.score += 100); Sound.sfx('open'); msg(`Palabra completa: ${L.word} = ${WORD_EN[L.word] || ''}`); }
  },
  note(n) {
    this.paused = true; Sound.sfx('open'); const [t, es, en] = n.note;
    panel(`<div class="lbl">OBJETO HISTÓRICO</div><canvas id="noteico" width="96" height="96" style="float:right;image-rendering:pixelated"></canvas><h2>${t}</h2><div class="big">${wrapWords(es)}</div><div class="en" style="margin-top:8px">${en}</div><button class="btn" onclick="Explore.closeNote()">Seguir (Enter)</button>`, { enter: () => this.closeNote() });
    const c = $('noteico'); if (c && c.getContext) { const g2 = c.getContext('2d'); g2.imageSmoothingEnabled = false; drawItem(g2, n.icon || 'doc', 48, 48, 90); }
  },
  closeNote() { closePanel(); this.paused = false; this.obj(); clearPressed(); },
  update() {
    if (this.paused) return; World.update();
    // walking into the gate opens it (or the guard says what is missing)
    const gt = World.L.gate; if (this.doorCd > 0) this.doorCd--;
    if (gt && !this.doorCd && World.players.some(p => !p.dead && p.x + p.w > gt.x - 10 && p.x < gt.x + T + 10 && Math.abs(p.y + p.h - gt.y) < 60)) { this.doorCd = 300; this.guard(); }
  },
  draw() { renderWorld(G.split); },
};

// =====================================================================
// GATE QUIZ (must get everything right to pass)
// =====================================================================
const WRITE_EN = ['What was the motto of the Plan de Ayala and what did it mean for the farmers?', 'Why did Zapata break his alliance with Madero after Díaz fell?', 'What position did Zapata hold in 1909 in his hometown, and what was his main job?', 'How was Zapata tricked so he could be killed at Chinameca?', 'How did the Zapatista movement influence the 1917 Constitution, and what is its legacy today?'];
const Gate = {
  start(ch) { G.scene = this; this.ch = ch; this.q = ch.gate.slice(); this.fails = 0; show('obj', false); this.nextQ(); },
  nextQ() {
    const it = this.q.shift(); if (!it) return this.pass();
    this.it = it; this.fails = 0;
    if (it.write != null) return this.write(it.write);
    const order = shuf([0, 1, 2, 3]); this.order = order;
    panel(`<div class="lbl">LA PUERTA · ${this.ch.gate.length - this.q.length} / ${this.ch.gate.length}</div><div class="big">${wrapWords(it.q)}</div><div class="en">${it.en}</div>
      <div id="gopts">${order.map((o, k) => `<button class="opt" style="background:${ANS[k]}" onclick="Gate.answer(${k})"><i>${k + 1}</i>${it.o[o]}</button>`).join('')}</div><div id="gres"></div>`,
      { key: e => { const d = /^Digit([1-4])$/.exec(e.code); if (d && !this.answered) { this.answer(+d[1] - 1); return true; } return false; } });
    this.answered = false;
  },
  answer(k) {
    if (this.answered) return; this.answered = true; const ok = this.order[k] === 0, it = this.it;
    document.querySelectorAll('#gopts .opt').forEach((b, i) => { b.disabled = true; b.style.opacity = this.order[i] === 0 ? 1 : .35; });
    Sound.sfx(ok ? 'right' : 'wrong'); if (!ok) this.q.push(it);
    $('gres').innerHTML = `<div class="${ok ? 'ok' : 'bad'}">${ok ? 'Correcto' : 'Es: ' + it.o[0]}</div>${ok ? '' : `<div class="small">Elegiste "${it.o[this.order[k]]}": ${whyWrong(it.o[this.order[k]])}</div>`}<div>${wrapWords(it.ex)}</div>${ok ? '' : '<div class="small">Esta pregunta vuelve al final.</div>'}<button class="btn" onclick="Gate.nextQ()">Seguir (Enter)</button>`;
    onEnter = () => this.nextQ();
  },
  write(idx) {
    const w = WRITE[idx]; this.tries = 0;
    panel(`<div class="lbl">ESCRIBE UNA FRASE CORTA</div><div class="big">${wrapWords(w.q)}</div><div class="en">${w.en}</div>
      <div class="small">Ideas que necesitas: ${w.ideas.length}. Los errores de ortografía están bien.</div><textarea id="gw" rows="2" placeholder="Escribe en español..."></textarea>
      <div id="gres"></div><button class="btn" id="gbtn" onclick="Gate.check(${idx})">Revisar</button>`);
    setTimeout(() => $('gw').focus(), 50);
  },
  check(idx) {
    const w = WRITE[idx], { have, miss } = gradeWriting($('gw').value, w.ideas), n = w.ideas.length; this.tries++;
    const full = miss.length === 0, half = have.length >= Math.ceil(n / 2), pass = full || half || this.tries >= 2;
    G.players.forEach(p => p.score += full ? 100 : half ? 50 : 0);
    Sound.sfx(full || half ? 'right' : 'wrong');
    $('gres').innerHTML = `<div class="${full || half ? 'ok' : 'bad'}">${full ? 'Muy bien. +100' : half ? 'Casi. Medio punto: +50' : 'Todavía no'}</div>
      ${have.length ? `<div class="small">Tienes: ${have.join(', ')}</div>` : ''}${miss.length ? `<div class="small">Te falta: ${miss.join(', ')}</div>` : ''}
      <div class="lbl">UNA BUENA RESPUESTA</div><div>${wrapWords(w.model)}</div>`;
    const b = $('gbtn'); if (pass) { b.textContent = 'Seguir (Enter)'; b.onclick = () => this.nextQ(); onEnter = () => this.nextQ(); } else b.textContent = 'Revisar otra vez';
  },
  pass() { closePanel(); Sound.sfx('open'); Battle.start(this.ch); },
  update() { World.update && 0; },
  draw() { renderWorld(G.split); },
};

// =====================================================================
// BATTLE (the hard part)
// =====================================================================
const CONJ_BY_CH = { 3: [['pres', 'pret'], 2], 4: [['pret', 'imp'], 2], 5: [['pret', 'imp'], 2], 6: [['pres', 'pret', 'imp'], 2], 7: [['pp', 'plu', 'pret'], 2], 8: [null, 3] };
const allQs = () => CHAPTERS.flatMap(c => c.qs);
const Battle = {
  start(ch) {
    this.ch = ch; closeAll(); G.scene = this;
    const L = buildBattle2(ch); World.init(L, 'battle', G.players, EV); World.cam = null;
    G.players.forEach(p => Object.assign(p, { hp: 100, ammo: 3, lock: 0, armor: 0, gun: null }));
    let qs = shuf(ch.qs);
    const cj = CONJ_BY_CH[ch.id]; if (cj) for (let i = 0; i < cj[1]; i++) qs.splice(irand(1, qs.length), 0, conjQ(cj[0]));
    if (ch.battle.review) qs = qs.concat(shuf(allQs().filter(q => !ch.qs.includes(q))).slice(0, 4));
    this.qs = qs; this.qi = 0; this.state = 'intro'; this.bossPhase = false; this.endT = 0;
    Sound.play(ch.battle.boss ? 'boss' : 'battle');
    show('card'); const box = $('cardlines'); box.innerHTML = `<div class="l"><div class="es"></div><div class="en"></div></div>`;
    const el = box.querySelector('.l'); const tw = typewrite(el.querySelector('.es'), ch.battle.name, 60, () => { el.querySelector('.en').textContent = ch.battle.boss ? 'Jefe: ' + ch.battle.boss.name : 'Agarra la respuesta correcta.'; });
    const go = () => { show('card', false); show('qbar'); this.nextQ(); };
    onEnter = () => { if (!tw.done) tw.skip(); else go(); }; openedAt = Date.now(); setTimeout(() => { if (this.state === 'intro' && G.scene === this) go(); }, 3500);
  },
  spots() { // 4 answers spread over the sky, the surface and underground
    const all = shuf(World.L.orbSpots), out = [];
    for (const layer of shuf([0, 1, 2])) { const s = all.find(s => s.layer === layer && !out.includes(s)); if (s && out.length < 4) out.push(s); }
    for (const s of all) { if (out.length >= 4) break; if (!out.includes(s) && out.every(o => Math.hypot(o.x - s.x, o.y - s.y) > 360)) out.push(s); }
    for (const s of all) { if (out.length >= 4) break; if (!out.includes(s)) out.push(s); }
    return shuf(out).map(s => [s.x, s.y]);
  },
  nextQ() {
    if (this.state === 'intro') this.state = 'read';
    if (this.qi >= this.qs.length) return this.afterQs();
    const q = this.qs[this.qi++], order = shuf([0, 1, 2, 3]), sp = this.spots(); this.cur = q; this.order = order; this.wrongs = [];
    World.orbs = order.map((o, k) => ({ x: sp[k][0], y: sp[k][1], k, o, right: o === 0, alive: true }));
    G.players.forEach((p, i) => { World.spawn(p, i); p.lock = 0; if (p.hero === 'zapata' && p.streak < 1) p.streak = 1; });
    World.shots = World.shots.filter(s => !s.enemy);
    $('qlv').textContent = `Capítulo ${this.ch.id} · ${this.qi} / ${this.qs.length}`;
    $('qq').innerHTML = wrapWords(q.q);
    $('qa').innerHTML = order.map((o, k) => `<span class="a"><i style="background:${ANS[k]}">${LET[k]}</i>${wrapWords(q.o[o])}</span>`).join('');
    this.timer = 60 * FPS; this.read();
  },
  read() {
    this.state = 'read'; const q = this.cur;
    panel(`<div class="lbl">PREGUNTA ${this.qi} DE ${this.qs.length}</div><div class="big">${wrapWords(q.q)}</div>
      <button class="btn alt" style="font-size:20px" onclick="this.nextElementSibling.classList.remove('hide');this.remove()">Inglés</button><div class="en hide">${q.en || ''}</div>
      <div class="lbl">LAS RESPUESTAS (estarán en el mapa)</div>${this.order.map((o, k) => `<div class="opt" style="background:${ANS[k]}"><i>${LET[k]}</i>${wrapWords(q.o[o])}</div>`).join('')}
      <div class="small">Haz clic en una palabra para traducirla.</div><button class="btn" onclick="Battle.play()">Listo (Enter)</button>`, { enter: () => this.play() });
  },
  play() { closePanel(); clearPressed(); this.state = 'play'; },
  orb(p, ok, o) {
    if (ok) {
      p.streak++; p.best = Math.max(p.best, p.streak); p.score += 100; p.right++; p.ammo += 3; p.hp = Math.min(100, p.hp + 30);
      Sound.sfx('right'); World.burst(p.x + p.w / 2, p.y, PAL.lime, 24, 10); this.reveal(p);
    } else {
      const sec = p.hero === 'madero' ? 5 : 10; p.lock = p.lockMax = sec * FPS; p.score = Math.max(0, p.score - 50); p.stun = 25; p.vy = -8;
      (this.wrongs = this.wrongs || []).push([p, this.cur.o[o.o]]);
      if (p.hero !== 'guajardo') p.streak = 0; Sound.sfx('wrong'); msg(`${p.name}: incorrecto. Espera ${sec} segundos.`);
    }
  },
  reveal(p) {
    this.state = 'reveal'; const q = this.cur;
    const verbs = (q.v || []).map(([f, inf, t, m]) => `<div><span style="color:#f4ac66">${f}</span> = ${m} <span class="small">(${inf}, ${t})</span></div>`).join('');
    panel(`<h2>${p ? 'Correcto: ' + p.name : 'Se acabó el tiempo'}</h2><div>${wrapWords(q.q)}</div><div class="en">${q.en || ''}</div>
      <div class="ok">${wrapWords(q.o[0])}</div>${(this.wrongs || []).map(([pl, opt]) => `<div class="small" style="color:${pl.color}">Jugador ${pl.i + 1} eligió "${opt}": ${whyWrong(opt)}</div>`).join('')}<div>${q.conj ? q.ex : wrapWords(q.ex)}</div>${verbs ? '<div class="lbl">VERBOS</div>' + verbs : ''}
      <button class="btn" onclick="Battle.nextQ()">Siguiente (Enter)</button>`, { enter: () => this.nextQ() });
  },
  afterQs() {
    closePanel(); const boss = World.mobs.find(m => m.t === 'b' && !m.dead);
    if (boss && !this.bossPhase) {
      this.bossPhase = true; this.state = 'play'; World.orbs = [];
      G.players.forEach(p => { p.streak = Math.max(p.streak, 5); p.ammo += 20; });
      $('qq').textContent = `Vence a ${boss.name}`; $('qa').innerHTML = '<span class="a">Tienes cohetes: dispara</span>'; $('qtime').textContent = '';
      return;
    }
    this.finish();
  },
  finish() {
    this.state = 'end'; closeAll();
    const un = Save.get('unlocked', 1); if (this.ch.id + 1 > un) Save.set('unlocked', Math.min(CHAPTERS.length, this.ch.id + 1));
    Cut.start([{ card: this.ch.end, vo: this.ch.endVo }], () => this.summary());
  },
  summary() {
    G.scene = this; this.state = 'end'; Sound.play('title');
    const last = this.ch.id === CHAPTERS.length, rows = G.players.slice().sort((a, b) => b.score - a.score).map(p => `<tr><td style="color:${p.color}">${p.name}</td><td>${p.score}</td><td>${p.right}</td><td>${p.best}</td></tr>`).join('');
    this._go = () => last ? Cut.start([{ card: [['Fin.', 'The end.'], ['Tierra y Libertad.', 'Land and Liberty.']], vo: 'fin' }], () => Credits.start()) : Chapters.play(this.ch.id + 1);
    panel(`<h2>Capítulo ${this.ch.id} terminado</h2><div class="lbl">LO QUE APRENDISTE</div>${this.ch.notes.map(n => `<div>${wrapWords(n[1])}</div>`).join('')}
      <table style="margin-top:12px;font-size:22px"><tr><td>Jugador</td><td>Puntos</td><td>Correctas</td><td>Mejor racha</td></tr>${rows}</table>
      <button class="btn" onclick="Battle._go()">${last ? 'Final' : 'Siguiente capítulo'} (Enter)</button><button class="btn alt" onclick="Chapters.start()">Capítulos</button>`, { enter: () => this._go() });
  },
  // ---- crates, stars, chests ----
  crate(p, c) {
    this.state = 'crate'; let q;
    if (c.type === 'p') q = conjQ(); else { const x = pick(allQs()); q = x; }
    const order = shuf([0, 1, 2, 3]); this.cq = { p, c, q, order, done: false };
    panel(`<h2>${c.type === 'p' ? 'Poder' : 'Caja'}: ${p.name}</h2><div class="small">${c.type === 'p' ? 'Conjuga bien para ganar un poder.' : 'Contesta bien para ganar armadura y vida.'}</div>
      <div class="big" style="margin-top:8px">${wrapWords(q.q)}</div><div id="copts">${order.map((o, k) => `<button class="opt" style="background:${ANS[k]}" onclick="Battle.answerCrate(${k})"><i>${k + 1}</i>${q.o[o]}</button>`).join('')}</div><div id="cres"></div>`,
      { key: e => { const d = /^Digit([1-4])$/.exec(e.code); if (d && !this.cq.done) { this.answerCrate(+d[1] - 1); return true; } return false; } });
  },
  answerCrate(k) {
    const cq = this.cq; if (!cq || cq.done) return; cq.done = true; const ok = cq.order[k] === 0, p = cq.p; let reward = '';
    if (ok) { if (cq.c.type === 'p') { const pw = pick(POWERS); pw.f(p); reward = pw.n; } else { p.armor = Math.min(100, p.armor + 50); p.hp = 100; p.ammo += 4; reward = 'Armadura, vida y balas'; } p.score += 50; }
    Sound.sfx(ok ? 'right' : 'wrong');
    document.querySelectorAll('#copts .opt').forEach((b, i) => { b.disabled = true; b.style.opacity = cq.order[i] === 0 ? 1 : .35; });
    $('cres').innerHTML = `<div class="${ok ? 'ok' : 'bad'}">${ok ? 'Correcto. Ganas: ' + reward : 'Es: ' + cq.q.o[0]}</div>${ok ? '' : `<div class="small">Elegiste "${cq.q.o[cq.order[k]]}": ${whyWrong(cq.q.o[cq.order[k]])}</div>`}<div>${cq.q.ex}</div><button class="btn" onclick="Battle.resume()">Seguir (Enter)</button>`;
    onEnter = () => this.resume();
  },
  chest(p, c) {
    this.state = 'crate'; const g = genConj(); this.cq = { p, c, g, typed: true, done: false, hints: 0 };
    panel(`<h2>Cofre: ${p.name}</h2><div class="small">Escribe el verbo para abrirlo. Premio: un arma.</div>
      <div class="big" style="margin-top:8px">${g.v} <span class="small">(${g.mean})</span> &rarr; ${PERS[g.pi]} &middot; ${TENSES[g.t].n}</div><div class="small">${TENSES[g.t].n} = ${TENSES[g.t].hint}</div>
      <input type="text" id="tin" autocomplete="off" spellcheck="false" placeholder="escribe aquí"><div id="thint" class="small"></div><div id="cres"></div>
      <button class="btn" id="tbtn" onclick="Battle.checkTyped()">Revisar (Enter)</button><button class="btn alt" onclick="Battle.hint()">Pista</button>`);
    const inp = $('tin'); inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { if (this.cq.done) this.resume(); else this.checkTyped(); } }); for (const k in keys) keys[k] = false; setTimeout(() => inp.focus(), 40);
  },
  hint() { const q = this.cq; if (!q || q.done) return; q.hints++; $('thint').innerHTML = q.hints === 1 ? 'Regla: ' + RULES[q.g.t] : 'Regla: ' + RULES[q.g.t] + '<br>Empieza con: ' + q.g.right.slice(0, Math.ceil(q.g.right.length / 2)); },
  checkTyped() {
    const q = this.cq; if (!q || q.done) return; const val = $('tin').value; if (!val.trim()) return; q.done = true;
    const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const exact = val.trim().toLowerCase().replace(/\s+/g, ' ') === q.g.right, ok = exact || plain(val) === plain(q.g.right); let reward = '';
    if (ok) { const k = pick(Object.keys(GUNS)); q.p.gun = { ...GUNS[k] }; q.p.armor = Math.min(100, q.p.armor + 25); q.p.score += 100 - q.hints * 25; reward = GUNS[k].n; }
    Sound.sfx(ok ? 'right' : 'wrong');
    $('cres').innerHTML = `<div class="${ok ? 'ok' : 'bad'}">${ok ? (exact ? 'Perfecto. ' : 'Bien, pero mira el acento: ' + q.g.right + '. ') + 'Ganas: ' + reward : 'No. Es: ' + q.g.right}</div><div>${q.g.ex}</div>`;
    $('tbtn').textContent = 'Seguir (Enter)'; $('tbtn').onclick = () => this.resume(); onEnter = () => this.resume();
  },
  resume() { closePanel(); clearPressed(); for (const k in keys) keys[k] = false; this.state = this.bossPhase ? 'play' : 'play'; },
  update() {
    if (this.state !== 'play') return; World.update();
    if (this.bossPhase) { if (!World.mobs.some(m => m.t === 'b' && !m.dead)) { if (++this.endT > 120) this.finish(); } return; }
    if (--this.timer <= 0) { World.orbs.forEach(o => o.alive = false); Sound.sfx('wrong'); this.reveal(null); return; }
    const s = Math.ceil(this.timer / FPS), el = $('qtime'); el.textContent = s + 's'; el.className = 'meta' + (s <= 10 ? ' low' : '');
  },
  draw() { renderWorld(G.split); },
};

// =====================================================================
// CREDITS
// =====================================================================
const Credits = {
  start() { G.scene = Title; closeAll(); Sound.play('title');
    panel(`<h2>Gracias por jugar</h2><div>Tierra y Libertad: la historia de Emiliano Zapata.</div><div class="lbl">ARTE</div><div class="small">Kenney (kenney.nl), CC0. Música: dizzy-crow, vitalezzz y karatestudios (OpenGameArt, CC0). Personajes y efectos hechos en código.</div><div class="lbl">VOCES</div><div class="small">Generadas con Higgsfield (ElevenLabs).</div><button class="btn" onclick="Title.start()">Menú (Enter)</button>`, { enter: () => Title.start() }); },
};

// =====================================================================
// SETTINGS (Esc): volume, screen, key bindings
// =====================================================================
const Settings = {
  isOpen: false, capture: null,
  open() {
    this.isOpen = true; if (Sound.vo) Sound.vo.pause(); this.render(); show('settings');
  },
  close() { this.isOpen = false; this.capture = null; show('settings', false); if (Sound.vo) Sound.vo.play().catch(() => {}); for (const k in keys) keys[k] = false; clearPressed(); },
  render() {
    const sl = (k, label) => `<div class="srow"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(Sound.vol[k] * 100)}" oninput="Sound.vol.${k}=this.value/100;Sound.applyVol();this.nextElementSibling.textContent=this.value"><b>${Math.round(Sound.vol[k] * 100)}</b></div>`;
    const acts = [['j', 'Saltar'], ['l', 'Izquierda'], ['r', 'Derecha'], ['f', 'Disparar / hablar']];
    const used = {}; PKEYS.forEach(k => acts.forEach(([a]) => used[k[a]] = (used[k[a]] || 0) + 1));
    const rows = PKEYS.map((k, i) => `<tr><td style="color:${PCOL[i]}">Jugador ${i + 1}</td>${acts.map(([a]) => { const cap = this.capture && this.capture[0] === i && this.capture[1] === a; return `<td><button class="kb${used[k[a]] > 1 ? ' dup' : ''}" onclick="Settings.capture=[${i},'${a}'];Settings.render()">${cap ? '...' : keyName(k[a])}</button></td>`; }).join('')}</tr>`).join('');
    const inCut = G.scene === Cut;
    $('settings').innerHTML = `<h2>Ajustes</h2>
      <div class="lbl">SONIDO</div><button class="btn ${!Sound.muted ? 'on' : 'alt'}" onclick="if(Sound.muted)Sound.toggle();Settings.render()">Sí</button><button class="btn ${Sound.muted ? 'on' : 'alt'}" onclick="if(!Sound.muted)Sound.toggle();Settings.render()">No</button>
      <div class="lbl">VOLUMEN</div>${sl('music', 'Música')}${sl('voice', 'Voces')}${sl('sfx', 'Efectos')}
      <div class="lbl">PANTALLA</div><button class="btn ${G.split ? 'on' : 'alt'}" onclick="G.split=true;Save.set('split',true);Settings.render()">Dividida</button><button class="btn ${!G.split ? 'on' : 'alt'}" onclick="G.split=false;Save.set('split',false);Settings.render()">Compartida</button>
      <div class="lbl">CONTROLES ${this.capture ? '· presiona una tecla (Esc cancela)' : '· haz clic para cambiar'}</div>
      <table class="kt"><tr><td></td>${acts.map(([, n]) => `<td class="small">${n}</td>`).join('')}</tr>${rows}</table>
      <button class="btn alt" onclick="Settings.resetKeys()">Controles originales</button>
      <div style="margin-top:8px"><button class="btn" onclick="Settings.close()">Seguir (Esc)</button>${inCut ? '<button class="btn alt" onclick="Settings.close();Sound.stopVoice();Cut.finish()">Saltar escena</button>' : ''}<button class="btn alt" onclick="Settings.close();Chapters.start()">Capítulos</button><button class="btn alt" onclick="Settings.close();Title.start()">Menú</button></div>`;
  },
  setKey(code) {
    const [i, a] = this.capture; this.capture = null;
    if (code !== 'Escape') { PKEYS[i][a] = code; Save.set('keys', PKEYS.map(({ l, r, j, f }) => ({ l, r, j, f }))); Sound.sfx('select'); }
    this.render();
  },
  resetKeys() { PKEYS.forEach((k, i) => Object.assign(k, DEFAULT_KEYS[i])); Save.set('keys', []); this.render(); },
};

// =====================================================================
// MAIN LOOP
// =====================================================================
// fixed 60 updates per second, no matter the screen refresh rate (120 Hz Macs ran the game 2x fast)
let lastT = 0, acc = 0; const STEP = 1000 / 60;
function loop(t) {
  requestAnimationFrame(loop); if (!lastT) lastT = t; acc += Math.min(100, t - lastT); lastT = t;
  ctx.imageSmoothingEnabled = false;
  while (acc >= STEP) { acc -= STEP; if (Settings.isOpen) continue; G.t++; if (G.scene && G.scene.update) G.scene.update(); }
  if (G.scene && G.scene.draw) G.scene.draw();
}
fitStage();
Promise.all([loadArt(), document.fonts ? document.fonts.load('32px Pixel').catch(() => {}) : 0, document.fonts ? document.fonts.load('32px Future').catch(() => {}) : 0]).then(() => { Title.start(); requestAnimationFrame(loop); });

// forgiving grader: accents ignored, small spelling mistakes allowed
function gradeWriting(text, ideas) {
  const plain = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = plain(text).split(/[^a-z0-9ñ]+/).filter(Boolean), full = ' ' + words.join(' ') + ' ';
  const dist = (a, b) => { // Damerau-Levenshtein (swapped letters count as 1)
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    } return d[a.length][b.length];
  };
  const hit = k => { k = plain(k); if (full.includes(' ' + k + ' ')) return true; const tol = k.length >= 8 ? 2 : k.length >= 4 ? 1 : 0; return words.some(w => dist(w, k) <= tol || (k.length >= 5 && w.startsWith(k.slice(0, 5)))); };
  const have = [], miss = []; for (const [name, ks] of ideas) (ks.some(hit) ? have : miss).push(name);
  return { have, miss };
}
