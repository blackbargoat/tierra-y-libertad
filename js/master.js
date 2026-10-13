'use strict';
// =====================================================================
// NIVEL MAESTRO: "La Revolución"  (Normal / Imposible)
// Your army vs the federal army. The arena reshapes itself, platforms pulse,
// you can man machine guns, free campesinos to grow your army,
// and if you get captured you go to prison until a teammate frees you.
// Win: defeat Huerta, then Carranza, then Porfirio Díaz.
// =====================================================================
const MCOLS = 8 * CW;   // 160 tiles wide
const DIFF = {
  normal:    { label: 'Normal',    allies: 5, spawnEvery: 5.5, maxEnemies: 14, eHp: 3, eDmg: 14, eFire: 75, bossMul: 1,   morph: 30, soloJail: 8,  teamJail: 25, recruitEvery: 35 },
  imposible: { label: 'Imposible', allies: 3, spawnEvery: 2.6, maxEnemies: 26, eHp: 5, eDmg: 22, eFire: 42, bossMul: 1.8, morph: 20, soloJail: 18, teamJail: 0,  recruitEvery: 50 },
};
const PHASES = [
  { boss: { who: 'huerta', name: 'VICTORIANO HUERTA', hp: 60, armor: 20 }, es: 'Fase 1: el ejército federal de Huerta', en: "Phase 1: Huerta's federal army" },
  { boss: { who: 'carranza', name: 'VENUSTIANO CARRANZA', hp: 80, armor: 30 }, es: 'Fase 2: Carranza y los constitucionalistas', en: 'Phase 2: Carranza and the constitutionalists' },
  { boss: { who: 'diaz', name: 'PORFIRIO DÍAZ', hp: 120, armor: 45 }, es: 'Fase 3: el dictador Porfirio Díaz', en: 'Phase 3: the dictator Porfirio Díaz' },
];
// platform shapes the middle of the arena can turn into (relative to a 20-wide chunk, rows above the floor)
const SHAPES = {
  stairs:  c => { const o = []; for (let i = 0; i < 6; i++) o.push([2 + i * 3, 21 - i * 3, 3]); return o; },
  pyramid: c => [[3, 20, 14], [5, 17, 10], [7, 14, 6], [9, 11, 2]].map(([x, y, w]) => [x, y, w, true]),
  zigzag:  c => [[1, 20, 5], [8, 17, 5], [14, 14, 5], [8, 11, 5], [1, 8, 5], [8, 5, 5]],
  towers:  c => [[3, 16, 2, true], [3, 17, 2, true], [3, 18, 2, true], [3, 19, 2, true], [3, 20, 2, true], [3, 21, 2, true], [3, 22, 2, true], [15, 13, 2, true], [15, 14, 2, true], [15, 15, 2, true], [15, 16, 2, true], [15, 17, 2, true], [15, 18, 2, true], [15, 19, 2, true], [15, 20, 2, true], [15, 21, 2, true], [15, 22, 2, true], [6, 18, 8], [6, 12, 8], [1, 9, 4]],
  bridges: c => [[0, 18, 20], [0, 13, 7], [13, 13, 7], [6, 8, 8]],
  rings:   c => [[2, 20, 4], [14, 20, 4], [5, 16, 10], [2, 12, 4], [14, 12, 4], [6, 8, 8]],
  cross:   c => [[9, 9, 2, true], [9, 10, 2, true], [9, 11, 2, true], [9, 12, 2, true], [9, 13, 2, true], [4, 13, 12, true], [9, 14, 2, true], [9, 15, 2, true], [2, 19, 5], [13, 19, 5]],
};

function buildMaster() {
  const L = baseLevel('night', 8);
  for (let c = 0; c < 8; c++) { stamp(L, 'air', c, 0); stamp(L, 'gate', c, 1); stamp(L, 'solid', c, 2); }
  L.npcSpots.length = 0; L.gate = null; L.spots.length = 0; L.decor.length = 0;
  const g = L.grid, set = (c, r, v) => { if (c >= 0 && c < g.cols && r >= 0 && r < ROWS) g.t[r * g.cols + c] = v; };
  // enemy base (right): the prison, a stone box on the ground
  const px0 = MCOLS - 13, px1 = MCOLS - 6;
  for (let r = 17; r <= 22; r++) { set(px0, r, TL.solid); set(px1, r, TL.solid); }
  for (let c = px0; c <= px1; c++) set(c, 16, TL.solid);
  L.prison = { x0: (px0 + 1) * T, x1: px1 * T, door: px0 * T, y: FLOOR_Y };
  for (let i = 0; i < 4; i++) set(px0 - 6 + i, 22 - i, TL.solid);           // steps beside the prison
  // our base (left): flag and two machine guns
  L.decor.push({ k: 'flag', x: 2 * T, y: FLOOR_Y });
  L.turrets = [{ x: 6 * T, y: FLOOR_Y, ang: -0.15, user: null, cd: 0 }, { x: 13 * T, y: FLOOR_Y, ang: -0.3, user: null, cd: 0 }, { x: Math.floor(MCOLS / 2) * T, y: FLOOR_Y, ang: -0.4, user: null, cd: 0 }];
  L.morph = { c0: 1, c1: 6 };   // chunks that reshape
  L.spawns = [[3 * T, FLOOR_Y - 56], [4 * T + 20, FLOOR_Y - 56], [6 * T, FLOOR_Y - 56]];
  L.enemySpawn = (px0 - 9) * T;
  L.cages = []; L.mobs = []; L.allies = 0; L.orbSpots = [];
  return L;
}

const Master = {
  start(diff) {
    G.scene = this; closeAll(); this.D = DIFF[diff]; this.diff = diff;
    G.players.forEach(p => Object.assign(p, { hp: 100, ammo: 12, lock: 0, armor: 0, gun: null, jail: 0, turret: null, streak: 5 }));
    const L = buildMaster(); World.init(L, 'master', G.players, MEV); World.cam = null;
    World.allies = []; for (let i = 0; i < this.D.allies; i++) this.addAlly(L.spawns[0][0] + i * 40);
    this.phase = -1; this.t = 0; this.spawnT = 0; this.morphT = this.D.morph * FPS; this.warn = 0; this.recruitT = 6 * FPS; this.itemT = 10 * FPS; this.kills = 0; this.over = false;
    for (let i = 0; i < 3; i++) this.addCage();
    this.morph(true); show('qbar'); Sound.play('war');
    this.card([[ 'La Revolución', 'The Revolution' ], [ `Nivel Maestro · ${this.D.label}`, 'Defeat the three dictators and their armies.' ]], () => this.nextPhase());
  },
  card(lines, done) {
    this.paused = true; show('card'); const box = $('cardlines'); box.innerHTML = lines.map(() => `<div class="l"><div class="es"></div><div class="en"></div></div>`).join('');
    const els = [...box.querySelectorAll('.l')]; let i = 0, tw = null, all = false;
    const nx = () => { if (i >= lines.length) { all = true; return; } const el = els[i]; tw = typewrite(el.querySelector('.es'), lines[i][0], 45, () => { el.querySelector('.en').textContent = lines[i][1]; i++; setTimeout(nx, 200); }); };
    const go = () => { show('card', false); this.paused = false; onEnter = null; clearPressed(); done && done(); };
    onEnter = () => { if (!all) { if (tw) tw.skip(); all = true; els.forEach((el, k) => { if (!lines[k]) return; el.querySelector('.es').textContent = lines[k][0]; el.querySelector('.en').textContent = lines[k][1]; }); } else go(); };
    openedAt = Date.now(); nx(); setTimeout(() => { if (this.paused && G.scene === this) go(); }, 6500);
  },
  nextPhase() {
    this.phase++; if (this.phase >= PHASES.length) return this.win();
    const P = PHASES[this.phase], m = this.D.bossMul; Sound.sfx('horn');
    if (this.phase === 2) Sound.play('warboss');
    const b = { t: 'g', ...P.boss, hp: Math.round(P.boss.hp * m), hpMax: Math.round(P.boss.hp * m), armor: Math.round(P.boss.armor * m), armorMax: Math.round(P.boss.armor * m), x: World.L.enemySpawn, y: FLOOR_Y - 220, w: 110, h: 220, vx: 0, vy: 0, face: -1, cd: 120, stompT: 5 * FPS, callT: 10 * FPS, dead: 0, flash: 0, ground: false };
    World.mobs.push(b); this.boss = b; msg(`${P.es}. ¡Viene ${P.boss.name}!`);
  },
  addAlly(x) { World.allies.push({ k: World.allies.length % 4, x, y: FLOOR_Y - 57, w: 28, h: 56, vx: 0, vy: 0, face: 1, hp: 60, cd: 20, dead: 0, inv: 60, walk: 0, perm: true }); },
  addCage() { const L = World.L, c = irand(L.morph.c0 * CW + 2, (L.morph.c1 + 1) * CW - 3); L.cages.push({ x: c * T + T / 2, y: FLOOR_Y, hp: 3, alive: true }); },
  addEnemy(x) { const D = this.D; World.mobs.push({ t: 's', x: x + Math.random() * 120, y: FLOOR_Y - 57, w: 28, h: 56, vx: 0, vy: 0, face: -1, hp: D.eHp, hpMax: D.eHp, cd: irand(20, D.eFire), dead: 0, flash: 0, armor: 0, walk: 0 }); },
  // ---- the arena changes shape ----
  morph(first) {
    const L = World.L, g = L.grid, names = Object.keys(SHAPES);
    for (let cx = L.morph.c0; cx <= L.morph.c1; cx++) {
      for (let r = 3; r < FLOOR_ROW; r++) for (let c = cx * CW; c < (cx + 1) * CW; c++) g.t[r * g.cols + c] = TL.air;
      for (const [x, y, w, solid] of SHAPES[pick(names)](cx)) for (let i = 0; i < w; i++) { const c = cx * CW + x + i; if (y < FLOOR_ROW && c < g.cols) g.t[y * g.cols + c] = solid ? TL.solid : TL.plat; }
    }
    L.movers = [];
    for (let i = 0; i < 4; i++) { const cx = irand(L.morph.c0, L.morph.c1); L.movers.push({ x: cx * CW * T + irand(2, 12) * T, y: irand(6, 18) * T, w: 5 * T, bw: 5 * T, ax: irand(0, 1) ? 4 * T : 0, ay: 0, T: 3 + Math.random() * 2, pulse: true, ps: 1 + Math.random(), ph: Math.random() * 6 }); }
    // push anyone stuck inside a new block up to free air
    const free = b => { let n = 0; while (n++ < 30 && [b.x + 3, b.x + b.w - 3].some(x => tileAt(L, x, b.y + b.h - 2) === TL.solid || tileAt(L, x, b.y + 4) === TL.solid)) b.y -= T; };
    [...World.players, ...World.allies, ...World.mobs].forEach(b => { if (!b.dead && b.t !== 'f') free(b); });
    if (!first) { Sound.sfx('morph'); World.shake = 12; msg('¡El campo de batalla cambia!'); }
  },
  // ---- events from the world ----
  use(p) { // action key: mount/leave a machine gun, open a cage, free the prisoners
    const L = World.L, cx = p.x + p.w / 2, cy = p.y + p.h;
    if (p.turret) { p.turret.user = null; p.turret = null; return true; }
    const t = L.turrets.find(t => !t.user && Math.abs(t.x - cx) < 40 && Math.abs(t.y - cy) < 50); if (t) { t.user = p; p.turret = t; Sound.sfx('open'); return true; }
    const c = L.cages.find(c => c.alive && Math.abs(c.x - cx) < 46 && Math.abs(c.y - cy) < 60); if (c) { this.openCage(c); return true; }
    if (G.players.some(q => q.jail) && Math.abs(L.prison.door - cx) < 70 && Math.abs(L.prison.y - cy) < 80) { this.freeAll(p); return true; }
    return false;
  },
  openCage(c) { c.alive = false; Sound.sfx('recruit'); World.burst(c.x, c.y - 40, PAL.cream, 16, 6); if (World.allies.filter(a => !a.dead).length < 14) this.addAlly(c.x - 14); msg('¡Un campesino se une al Ejército Liberador del Sur!'); },
  captured(p) {
    const L = World.L; Sound.sfx('jail'); World.burst(p.x + p.w / 2, p.y + 20, p.color, 20, 8);
    Object.assign(p, { jail: 1, jailT: (G.players.length === 1 ? this.D.soloJail : this.D.teamJail) * FPS, x: (L.prison.x0 + L.prison.x1) / 2 - 14, y: FLOOR_Y - 57, vx: 0, vy: 0, hp: 100, gun: null, turret: null, inv: 0, stun: 0 });
    if (p.turret) p.turret.user = null;
    msg(`${p.name} fue capturado. ¡Ve a la prisión a liberarlo!`);
    if (G.players.every(q => q.jail)) this.lose();
    return true;
  },
  freeAll(by) { const L = World.L; G.players.filter(q => q.jail).forEach(q => Object.assign(q, { jail: 0, x: L.prison.door - 80, y: FLOOR_Y - 57, inv: 150 })); Sound.sfx('recruit'); if (by) by.score += 200; msg('¡Prisioneros liberados!'); },
  crate(p, c) { const orig = Battle._orig || (Battle._orig = Battle.resume); Battle.crate(p, c); this.paused = true; Battle.resume = () => { Battle.resume = orig; closePanel(); clearPressed(); for (const k in keys) keys[k] = false; this.paused = false; G.scene = this; }; },
  chest(p, c) { const orig = Battle._orig || (Battle._orig = Battle.resume); Battle.chest(p, c); this.paused = true;
    Battle.resume = () => { Battle.resume = orig; G.scene = this; closePanel(); clearPressed(); for (const k in keys) keys[k] = false; this.paused = false; if (Battle.cq && Battle.cq.typed && Battle.cq.done && $('cres') && /Ganas|Perfecto|Bien/.test($('cres').textContent)) { this.addAlly(p.x); this.addAlly(p.x + 30); msg('Premio extra: 2 soldados nuevos'); } }; },
  // ---- AI for soldiers and ground bosses ----
  ai(m) {
    const L = World.L, D = this.D, cx = m.x + m.w / 2, cy = m.y + m.h / 2;
    if (m.flash > 0) m.flash--;
    const targets = [...G.players.filter(p => !p.dead && !p.jail), ...World.allies.filter(a => !a.dead)];
    const tg = targets.filter(t => Math.abs(t.x - cx) < (m.t === 'g' ? 1100 : 800)).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0];
    let goal = -1;
    if (tg) { const dx = tg.x + tg.w / 2 - cx; m.face = Math.sign(dx) || -1; goal = Math.abs(dx) > (m.t === 'g' ? 160 : 230) ? Math.sign(dx) : 0; }
    const sp = m.t === 'g' ? 1.3 : 2.6;
    if (goal) { m.vx += goal * .8; m.vx = clamp(m.vx, -sp, sp); } else m.vx *= .7;
    m.vy = Math.min(m.vy + (m.vy < 0 ? .62 : .9), 15);
    const wasG = m.ground, fall = m.vy; World.moveBody(m, L);
    if (goal && m.ground && m.wall) m.vy = m.t === 'g' ? -15 : -13;
    if (m.t === 's' && goal && m.ground && Math.random() < .01) m.vy = -12;
    m.walk = (m.walk || 0) + Math.abs(m.vx) * .07;
    if (m.y > L.h) m.dead = -1;
    if (!tg) return;
    const tx = tg.x + tg.w / 2, ty = tg.y + tg.h / 2, ang = Math.atan2(ty - cy, tx - cx);
    if (--m.cd <= 0) {
      if (m.t === 's') { m.cd = D.eFire + irand(0, 20); World.shots.push({ x: cx + m.face * 16, y: m.y + 22, vx: Math.cos(ang) * 8, vy: Math.sin(ang) * 8, o: null, enemy: true, l: 120, dmg: D.eDmg }); Sound.sfx('shoot'); }
      else { const low = m.hp < m.hpMax / 2, n = low ? 7 : 5; for (let i = 0; i < n; i++) { const a = ang + (i - (n - 1) / 2) * .14; World.shots.push({ x: cx, y: m.y + 70, vx: Math.cos(a) * 7.5, vy: Math.sin(a) * 7.5, o: null, enemy: true, l: 150, dmg: D.eDmg + 6 }); } m.cd = low ? 55 : 85; Sound.sfx('cannon'); }
    }
    if (m.t === 'g') {
      if (--m.stompT <= 0 && m.ground) { m.vy = -16; m.stomping = true; m.stompT = (m.hp < m.hpMax / 2 ? 4 : 6) * FPS; }
      if (m.stomping && m.ground && !wasG && fall > 4) { m.stomping = false; Sound.sfx('stomp'); World.shake = 18; for (const d of [-1, 1]) for (let k = 0; k < 3; k++) World.shots.push({ x: cx + d * (40 + k * 30), y: FLOOR_Y - 16, vx: d * (6 + k), vy: 0, o: null, enemy: true, l: 90, dmg: 25, wave: true }); }
      if (--m.callT <= 0) { m.callT = 9 * FPS; for (let i = 0; i < (this.diff === 'imposible' ? 4 : 2); i++) this.addEnemy(m.x - 60 + i * 40); msg(`${m.name} llama a su ejército`); }
    }
  },
  // ---- per frame ----
  update() {
    if (this.paused || this.over) return;
    const L = World.L, D = this.D; this.t++;
    // machine guns: the player stays on it, left/right aims, any shoot key fires, jump gets off
    for (const p of G.players) if (p.turret) {
      const t = p.turret, k = p.keys; p.x = t.x - p.w / 2 - 8; p.vx = 0;
      if (keys[k.l]) t.ang = Math.max(-Math.PI + .1, t.ang - .03); if (keys[k.r]) t.ang = Math.min(-.02, t.ang + .03);
      if (t.ang < -Math.PI / 2) p.face = -1; else p.face = 1;
      if (pressed[k.j] || p.jail || p.dead) { t.user = null; p.turret = null; }
      else if ((keys[k.f] || keys[k.su] || keys[k.sl] || keys[k.sr]) && --t.cd <= 0) { t.cd = 5; const a = t.ang + (Math.random() - .5) * .06; World.shots.push({ x: t.x + Math.cos(a) * 40, y: t.y - 40 + Math.sin(a) * 40, vx: Math.cos(a) * 16, vy: Math.sin(a) * 16, o: p, l: 70, w: { dmg: 2, pdmg: 0 }, pellet: true, turret: true }); Sound.sfx('mg'); }
      pressed[k.j] = false; pressed[k.f] = false;
    }
    World.update();
    // prison: jailed players stay inside; timer frees them in solo / normal team play
    for (const p of G.players) if (p.jail) {
      p.x = clamp(p.x, L.prison.x0 + 4, L.prison.x1 - p.w - 4); if (p.y < FLOOR_Y - 5 * T) p.y = FLOOR_Y - 5 * T;
      if (p.jailT > 0 && --p.jailT === 0) { p.jail = 0; p.x = L.prison.door - 80; p.inv = 150; msg(`${p.name} escapó de la prisión`); }
    }
    for (const c of L.cages) if (c.alive) for (const s of World.shots) if (!s.enemy && s.l > 0 && Math.abs(s.x - c.x) < 30 && s.y > c.y - 70 && s.y < c.y) { s.l = 0; if (--c.hp <= 0) this.openCage(c); }
    L.cages = L.cages.filter(c => c.alive);
    // enemy army keeps coming
    const alive = World.mobs.filter(m => m.t === 's' && !m.dead).length;
    if (++this.spawnT > D.spawnEvery * FPS && alive < D.maxEnemies) { this.spawnT = 0; const n = this.diff === 'imposible' ? 3 : 2; for (let i = 0; i < n; i++) this.addEnemy(L.enemySpawn + i * 30); }
    if (--this.recruitT <= 0) { this.recruitT = D.recruitEvery * FPS; if (L.cages.length < 4) this.addCage(); }
    if (--this.itemT <= 0) { this.itemT = 14 * FPS; this.dropItem(); }
    // the arena reshapes itself
    if (--this.morphT <= 0) { if (!this.warn) { this.warn = 3 * FPS; Sound.sfx('horn'); msg('¡Cuidado! El campo va a cambiar...'); } else if (--this.warn <= 0) { this.warn = 0; this.morph(false); this.morphT = D.morph * FPS; } }
    World.morphWarn = this.warn;
    // boss down -> next phase
    if (this.boss && this.boss.dead) { G.players.forEach(p => p.score += 500); this.boss = null; const P = PHASES[this.phase]; World.mobs.filter(m => m.t === 's').forEach(m => { if (Math.random() < .5) { m.dead = -1; World.burst(m.x + 14, m.y + 28, PAL.maroon, 8, 6); } });
      if (this.phase + 1 < PHASES.length) this.card([[`¡Derrotaste a ${P.boss.name}!`, `You defeated ${P.boss.name}!`], [PHASES[this.phase + 1].es, PHASES[this.phase + 1].en]], () => this.nextPhase()); else this.win(); }
    World.mobs = World.mobs.filter(m => !(m.dead === -1 && m.t === 's'));
    this.hud();
  },
  dropItem() { // weapons, crates (packet questions) and chests (type the verb) fall from the sky
    const L = World.L, x = irand(2 * CW, 7 * CW) * T, r = Math.random(), y = FLOOR_Y - irand(1, 6) * T;
    if (r < .45) L.guns.push({ x, y, type: pick(['machinegun', 'dynamite', 'machete', 'shotgun', 'sniper', 'bomb', 'boomerang']), alive: true, t: 0, once: true });
    else if (r < .75) L.crates.push({ x, y, type: Math.random() < .5 ? 'q' : 'p', alive: true, t: 0 });
    else L.chests.push({ x, y, alive: true, t: 0 });
    L.hearts.push({ x: x + 200, y, alive: true, t: 0 });
  },
  hud() {
    const b = this.boss, armyA = World.allies.filter(a => !a.dead).length, armyE = World.mobs.filter(m => m.t === 's' && !m.dead).length;
    $('qlv').textContent = `Nivel Maestro · ${this.D.label} · Fase ${this.phase + 1} / 3`;
    $('qq').textContent = b ? `${b.name}: ${Math.max(0, b.hp)} / ${b.hpMax}${b.armor > 0 ? ' · armadura ' + b.armor : ''}` : 'Prepárate';
    $('qa').innerHTML = `<span class="a">Tu ejército: ${armyA}</span><span class="a">Federales: ${armyE}</span><span class="a">Presos: ${G.players.filter(p => p.jail).length}</span><span class="a">Cambio en: ${Math.ceil(Math.max(0, this.morphT) / FPS)}s</span>`;
    $('qtime').textContent = '';
  },
  win() {
    this.over = true; Sound.play('title');
    const rows = G.players.slice().sort((a, b) => b.score - a.score).map(p => `<tr><td>${p.name}</td><td>${p.score}</td><td>${p.ko}</td></tr>`).join('');
    Cut.start([{ card: [['¡Tierra y Libertad!', 'Land and Liberty!'], ['La revolución ganó.', 'The revolution won.']] }], () => {
      panel(`<h2>¡Ganaste! Nivel Maestro (${this.D.label})</h2><table style="font-size:24px"><tr><td>Jugador</td><td>Puntos</td><td>KOs</td></tr>${rows}</table><button class="btn" onclick="MasterMenu.open()">Otra vez</button><button class="btn alt" onclick="Chapters.start()">Capítulos</button>`, { enter: () => Chapters.start() });
    });
  },
  lose() {
    this.over = true; Sound.play('sad');
    setTimeout(() => panel(`<h2>Todos fueron capturados</h2><div>Los federales ganaron esta vez. Libera a tus compañeros más rápido y usa las ametralladoras.</div><div class="en">Everyone was captured. Free your teammates faster and use the machine guns.</div><button class="btn" onclick="Master.start(Master.diff)">Intentar otra vez</button><button class="btn alt" onclick="Chapters.start()">Capítulos</button>`, { enter: () => Master.start(this.diff) }), 600);
  },
  draw() { renderWorld(G.split); },
};
const MEV = { msg, interact() {}, note() {}, letter() {}, orb() {},
  crate: (p, c) => Master.crate(p, c), chest: (p, c) => Master.chest(p, c), use: p => Master.use(p), captured: p => Master.captured(p), ai: m => Master.ai(m) };
const MasterMenu = {
  open() {
    closeAll(); G.scene = Title;
    panel(`<h2>Nivel Maestro: La Revolución</h2><div>Tu ejército contra el ejército federal. El campo cambia de forma. Libera campesinos, usa las ametralladoras y derrota a Huerta, Carranza y Porfirio Díaz.</div>
      <div class="en">Your army vs the federal army. The arena changes shape. Free campesinos, use the machine guns, and defeat Huerta, Carranza and Porfirio Díaz.</div>
      <div class="small">La armadura de los jefes solo se rompe con dinamita, rifle, sombrero, cohetes o las ametralladoras fijas. / Boss armor only breaks with dynamite, rifle, sombrero, rockets or the mounted machine guns.</div>
      <div class="lbl">CONTROLES EXTRA</div><div class="small">${PKEYS.slice(0, G.players.length).map((k, i) => `Jugador ${i + 1}: disparar izq ${keyName(k.sl)}, der ${keyName(k.sr)}, arriba ${keyName(k.su)} · acción ${keyName(k.f)} = ametralladora / jaula / prisión`).join('<br>')}</div>
      <button class="btn" onclick="Master.start('normal')">Normal</button><button class="btn" style="background:#d95763;color:#fbf1e3" onclick="Master.start('imposible')">Imposible</button><button class="btn alt" onclick="Chapters.start()">Volver</button>`, { enter: () => Master.start('normal') });
  },
};
