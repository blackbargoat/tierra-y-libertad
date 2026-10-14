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
  imposible: { label: 'Imposible', allies: 3, spawnEvery: 2.6, maxEnemies: 26, eHp: 5, eDmg: 22, eFire: 42, bossMul: 1.8, morph: 20, soloJail: 18, teamJail: 45,  recruitEvery: 50 },
};
const PHASES = [
  { boss: { who: 'huerta', name: 'VICTORIANO HUERTA', hp: 60, armor: 20 }, es: 'Fase 1: el ejército federal de Huerta', en: "Phase 1: Huerta's federal army" },
  { boss: { who: 'carranza', name: 'VENUSTIANO CARRANZA', hp: 80, armor: 30 }, es: 'Fase 2: Carranza y los constitucionalistas', en: 'Phase 2: Carranza and the constitutionalists' },
  { boss: { who: 'diaz', name: 'PORFIRIO DÍAZ', hp: 120, armor: 45 }, es: 'Fase 3: el dictador Porfirio Díaz', en: 'Phase 3: the dictator Porfirio Díaz' },
];
// platform shapes the middle of the arena can turn into (relative to a 20-wide chunk, rows above the floor)
// (all shapes use one-way platforms only, so nobody can get stuck inside a wall)
const SHAPES = {
  stairs:  c => { const o = []; for (let i = 0; i < 6; i++) o.push([2 + i * 3, 21 - i * 3, 3]); return o; },
  pyramid: c => [[3, 20, 14], [5, 17, 10], [7, 14, 6], [9, 11, 2]].map(([x, y, w]) => [x, y, w, true]),
  zigzag:  c => [[1, 20, 5], [8, 17, 5], [14, 14, 5], [8, 11, 5], [1, 8, 5], [8, 5, 5]],
  towers:  c => [[3, 16, 2, true], [3, 17, 2, true], [3, 18, 2, true], [3, 19, 2, true], [3, 20, 2, true], [3, 21, 2, true], [3, 22, 2, true], [15, 13, 2, true], [15, 14, 2, true], [15, 15, 2, true], [15, 16, 2, true], [15, 17, 2, true], [15, 18, 2, true], [15, 19, 2, true], [15, 20, 2, true], [15, 21, 2, true], [15, 22, 2, true], [6, 18, 8], [6, 12, 8], [1, 9, 4]],
  bridges: c => [[0, 18, 20], [0, 13, 7], [13, 13, 7], [6, 8, 8]],
  rings:   c => [[2, 20, 4], [14, 20, 4], [5, 16, 10], [2, 12, 4], [14, 12, 4], [6, 8, 8]],
  cross:   c => [[9, 9, 2, true], [9, 10, 2, true], [9, 11, 2, true], [9, 12, 2, true], [9, 13, 2, true], [4, 13, 12, true], [9, 14, 2, true], [9, 15, 2, true], [2, 19, 5], [13, 19, 5]],
};

// underground maze: 3 rows of rooms joined by tunnels and ladders, loot in every dead end
function buildMaze(L, set, px0) {
  const CWm = 6, NC = Math.floor((MCOLS - 4) / CWm), NR = 3, cx0 = 2, rowTop = r => 27 + r * 4, cellX = c => cx0 + c * CWm;
  const seen = new Set(), adj = new Map(), key = (r, c) => r + ',' + c, link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) for (let y = 0; y < 3; y++) for (let x = 1; x <= 4; x++) set(cellX(c) + x, rowTop(r) + y, TL.air);
  const stack = [[0, irand(0, NC - 1)]]; seen.add(key(...stack[0]));
  while (stack.length) {
    const [r, c] = stack[stack.length - 1], nb = shuf([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]).filter(([a, b]) => a >= 0 && a < NR && b >= 0 && b < NC && !seen.has(key(a, b)));
    if (!nb.length) { stack.pop(); continue; }
    const [a, b] = nb[0]; seen.add(key(a, b)); link(key(r, c), key(a, b)); stack.push([a, b]);
  }
  for (let k = 0; k < NC / 3; k++) { const r = irand(0, NR - 1), c = irand(0, NC - 2); link(key(r, c), key(r, c + 1)); }   // a few loops = more than one way
  for (const [ka, list] of adj) for (const kb of list) {
    const [r1, c1] = ka.split(',').map(Number), [r2, c2] = kb.split(',').map(Number);
    if (r1 === r2) { const c = Math.min(c1, c2); for (let y = 0; y < 3; y++) { set(cellX(c) + 5, rowTop(r1) + y, TL.air); set(cellX(c) + 6, rowTop(r1) + y, TL.air); } }
    else { const r = Math.min(r1, r2); for (let y = rowTop(r); y <= rowTop(r + 1) + 2; y++) set(cellX(c1) + 2, y, TL.ladder); set(cellX(c1) + 3, rowTop(r) + 3, TL.air); }
  }
  // entrances from the surface, each under a wooden cover
  L.covers = [];
  const entr = [7, 13, 19].map(c => Math.min(NC - 1, c));
  for (const c of entr) { const x0 = cellX(c) + 2; for (let y = 23; y <= rowTop(0) + 2; y++) { set(x0, y, TL.ladder); if (y < rowTop(0)) set(x0 + 1, y, TL.air); } L.covers.push({ c0: x0, c1: x0 + 1, hp: 4, open: 0 }); L.decor.push({ k: 'sign', x: (x0 - 1) * T, y: FLOOR_Y }); }
  L.covers.forEach(cv => { set(cv.c0, 23, TL.solid); set(cv.c1, 23, TL.solid); });
  // the trapdoor into the prison
  const tc = Math.floor((px0 + 3 - cx0) / CWm), t0 = cellX(tc) + 2; L.trap = { c0: t0, c1: t0 + 1, open: 0 };
  for (let y = 23; y <= 26; y++) { set(t0, y, TL.solid); set(t0 + 1, y, TL.solid); } for (let y = 27; y <= 29; y++) set(t0, y, TL.ladder);
  // loot in dead ends, coins along the tunnels
  const loot = ['minigun', 'dynamite', 'sniper', 'machinegun', 'boomerang', 'machete', 'coins', 'coins', 'chest', 'crate', 'star', 'heart'];
  for (const [k, list] of adj) { const [r, c] = k.split(',').map(Number), x = (cellX(c) + 3) * T, fy = (rowTop(r) + 3) * T;
    if (list.length === 1 && !entr.includes(c) && c !== tc) { const it = pick(loot);
      if (GUNS[it]) L.guns.push({ x, y: fy - 34, type: it, alive: true, t: 0 });
      else if (it === 'coins') for (let i = 0; i < 5; i++) L.coins.push({ x: x - 60 + i * 30, y: fy - 30, got: false, v: 10 });
      else if (it === 'chest') L.chests.push({ x, y: fy - 24, alive: true, t: 0 });
      else if (it === 'crate' || it === 'star') L.crates.push({ x, y: fy - 30, type: it === 'star' ? 'p' : 'q', alive: true, t: 0 });
      else L.hearts.push({ x, y: fy - 30, alive: true, t: 0 }); }
    else if (Math.random() < .5) L.coins.push({ x, y: fy - 30, got: false, v: 5 }); }
}
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
  for (let i = 0; i < 6; i++) for (let r = 22 - i; r <= 22; r++) { set(px0 - 6 + i, r, TL.solid); set(px1 + 6 - i, r, TL.solid); }   // full staircases over the prison on both sides
  // our base (left): flag and two machine guns
  L.turrets = [{ x: 6 * T, y: FLOOR_Y, ang: -0.15, user: null, cd: 0 }, { x: 13 * T, y: FLOOR_Y, ang: -0.3, user: null, cd: 0 }, { x: Math.floor(MCOLS / 2) * T, y: FLOOR_Y, ang: -0.4, user: null, cd: 0 }];
  buildMaze(L, set, px0);
  // our base: weapon rack, ammo cart and the shop
  [['shotgun', 20], ['sniper', 22], ['machinegun', 24], ['dynamite', 26]].forEach(([type, c]) => L.guns.push({ x: c * T, y: FLOOR_Y - 34, type, alive: true, t: 0 }));
  L.ammo = { x: 30 * T, y: FLOOR_Y }; L.shop = { x: 35 * T, y: FLOOR_Y };
  // armored cart with a cannon and a minigun, parked at our base
  L.carts = [{ x: 9 * T, y: FLOOR_Y - 60, w: 110, h: 60, vx: 0, vy: 0, face: 1, hp: 2200, hpMax: 2200, driver: null, cd: 0, ccd: 0, dead: 0, wheel: 0, home: 9 * T }];
  L.morph = { c0: 1, c1: 6 };   // chunks that reshape
  L.flags = { us: { hx: 2 * T, hy: FLOOR_Y, x: 2 * T, y: FLOOR_Y, carrier: null, home: true, side: 'us' }, them: { hx: (px0 - 12) * T, hy: FLOOR_Y, x: (px0 - 12) * T, y: FLOOR_Y, carrier: null, home: true, side: 'them' } };
  L.caps = { us: 0, them: 0 };
  L.spawns = [[3 * T, FLOOR_Y - 56], [4 * T + 20, FLOOR_Y - 56], [6 * T, FLOOR_Y - 56]];
  L.enemySpawn = (px0 - 16) * T;
  L.cages = []; L.mobs = []; L.allies = 0; L.orbSpots = [];
  return L;
}

const Master = {
  start(diff) {
    G.scene = this; closeAll(); this.D = DIFF[diff]; this.diff = diff;
    G.players.forEach(p => Object.assign(p, { hp: 100, ammo: 12, lock: 0, armor: 0, gun: null, jail: 0, turret: null, streak: 5 }));
    const L = buildMaster(); World.init(L, 'master', G.players, MEV); World.cam = null;
    const U = Save.get('unlocks', {});
    World.allies = []; for (let i = 0; i < this.D.allies + (U.army ? 3 : 0); i++) this.addAlly(L.spawns[0][0] + i * 40);
    G.players.forEach(p => { if (U.mg) p.gun = { ...GUNS.machinegun, key: 'machinegun' }; if (U.armor) p.armor = 100; });
    if (U.cart) L.carts.forEach(c => { c.hp = c.hpMax = 4400; });
    this.phase = -1; this.t = 0; this.spawnT = 0; this.morphT = this.D.morph * FPS; this.warn = 0; this.recruitT = 6 * FPS; this.itemT = 10 * FPS; this.kills = 0; this.over = false; this.caps = 0; this.won = false;
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
  addAlly(x) { const k = World.allies.length; World.allies.push({ side: 'us', role: ['asalto', 'defensor', 'francotirador', 'explorador'][k % 4], think: 0, k: k % 4, x, y: FLOOR_Y - 57, w: 28, h: 56, vx: 0, vy: 0, face: 1, hp: 60, cd: 20, dead: 0, inv: 60, walk: 0, perm: true }); },
  addCage() { const L = World.L, c = irand(L.morph.c0 * CW + 2, (L.morph.c1 + 1) * CW - 3); L.cages.push({ x: c * T + T / 2, y: FLOOR_Y, hp: 3, alive: true }); },
  addEnemy(x) { const D = this.D, r = Math.random(); World.mobs.push({ side: 'them', role: r < .4 ? 'asalto' : r < .65 ? 'soldado' : r < .82 ? 'defensor' : 'francotirador', think: 0, t: 's', x: x + Math.random() * 120, y: FLOOR_Y - 57, w: 28, h: 56, vx: 0, vy: 0, face: -1, hp: D.eHp, hpMax: D.eHp, cd: irand(20, D.eFire), dead: 0, flash: 0, armor: 0, walk: 0 }); },
  // ---- the arena changes shape ----
  morph(first) {
    const L = World.L, g = L.grid, names = Object.keys(SHAPES);
    for (let cx = L.morph.c0; cx <= L.morph.c1; cx++) {
      for (let r = 3; r < FLOOR_ROW; r++) for (let c = cx * CW; c < (cx + 1) * CW; c++) g.t[r * g.cols + c] = TL.air;
      for (const [x, y, w] of SHAPES[pick(names)](cx)) for (let i = 0; i < w; i++) { const c = cx * CW + x + i; if (y < FLOOR_ROW && c < g.cols) g.t[y * g.cols + c] = TL.plat; }
    }
    L.movers = [];
    for (let i = 0; i < 4; i++) { const cx = irand(L.morph.c0, L.morph.c1); L.movers.push({ x: cx * CW * T + irand(2, 12) * T, y: irand(6, 18) * T, w: 5 * T, bw: 5 * T, ax: irand(0, 1) ? 4 * T : 0, ay: 0, T: 3 + Math.random() * 2, pulse: true, ps: 1 + Math.random(), ph: Math.random() * 6 }); }
    // push anyone stuck inside a new block up to free air
    const free = b => World.unstick(b, L);
    [...World.players, ...World.allies, ...World.mobs].forEach(b => { if (!b.dead && b.t !== 'f') free(b); });
    if (!first) { Sound.sfx('morph'); World.shake = 12; msg('¡El campo de batalla cambia!'); }
  },
  // ---- events from the world ----
  use(p) { // action key: mount/leave a machine gun, open a cage, free the prisoners
    const L = World.L, cx = p.x + p.w / 2, cy = p.y + p.h;
    if (p.turret) { p.turret.user = null; p.turret = null; return true; }
    const cart = L.carts.find(c => !c.dead && !c.driver && Math.abs(c.x + c.w / 2 - cx) < 80 && Math.abs(c.y + c.h - cy) < 70); if (cart) { cart.driver = p; p.cart = cart; Sound.sfx('open'); msg(`${p.name} maneja la carreta: mover, disparar, tiro arriba = cañón, saltar = salir`); return true; }
    if (!L.trap.open && cx > L.trap.c0 * T - 90 && cx < (L.trap.c1 + 1) * T + 90 && cy > 26 * T && cy < 31 * T) { this.setTrap(true); return true; }
    const cv = L.covers.find(cv => !cv.open && cx > cv.c0 * T - 50 && cx < (cv.c1 + 1) * T + 50 && cy > FLOOR_Y - 40 && cy < 29 * T); if (cv) { this.setCover(cv, true); return true; }
    if (Math.abs(L.shop.x - cx) < 60 && Math.abs(L.shop.y - cy) < 60) { this.shop(p); return true; }
    if (Math.abs(L.ammo.x - cx) < 60 && Math.abs(L.ammo.y - cy) < 60) { p.ammo = Math.max(p.ammo, 40); if (p.gun && p.gun.key) p.gun.ammo = GUNS[p.gun.key].ammo; p.armor = Math.max(p.armor, 20); Sound.sfx('open'); msg(`${p.name}: ¡munición llena!`); return true; }
    const t = L.turrets.find(t => !t.user && Math.abs(t.x - cx) < 40 && Math.abs(t.y - cy) < 50); if (t) { t.user = p; p.turret = t; Sound.sfx('open'); return true; }
    const c = L.cages.find(c => c.alive && Math.abs(c.x - cx) < 46 && Math.abs(c.y - cy) < 60); if (c) { this.openCage(c); return true; }
    if (G.players.some(q => q.jail) && cx > L.prison.door - 110 && cx < L.prison.x1 + 150 && cy > L.prison.y - 7 * T) { this.freeAll(p); return true; }
    return false;
  },
  openCage(c) { this.addCoins(10); c.alive = false; Sound.sfx('recruit'); World.burst(c.x, c.y - 40, PAL.cream, 16, 6); if (World.allies.filter(a => !a.dead).length < 14) this.addAlly(c.x - 14); msg('¡Un campesino se une al Ejército Liberador del Sur!'); },
  captured(p, by) {
    if (by && by !== p && G.players.includes(by)) return false;   // knocked out by a teammate: just respawn
    const L = World.L; Sound.sfx('jail'); World.burst(p.x + p.w / 2, p.y + 20, p.color, 20, 8);
    Object.assign(p, { jail: 1, jailT: (G.players.length === 1 ? this.D.soloJail : this.D.teamJail) * FPS, x: (L.prison.x0 + L.prison.x1) / 2 - 14, y: FLOOR_Y - 57, vx: 0, vy: 0, hp: 100, gun: null, turret: null, inv: 0, stun: 0 });
    if (p.turret) p.turret.user = null;
    msg(`${p.name} fue capturado. ¡Ve a la prisión a liberarlo!`);
    this.caps = (this.caps || 0) + 1;
    if (G.players.length === 1 ? this.caps >= (this.diff === 'imposible' ? 2 : 3) : G.players.every(q => q.jail)) this.lose();
    return true;
  },
  freeAll(by) { const L = World.L, right = by && by.x > L.prison.x1; G.players.filter(q => q.jail).forEach(q => Object.assign(q, { jail: 0, x: right ? L.prison.x1 + 60 : L.prison.door - 80, y: FLOOR_Y - 57, inv: 150 })); Sound.sfx('recruit'); if (by) by.score += 200; msg('¡Prisioneros liberados!'); },
  crate(p, c) { const orig = Battle._orig || (Battle._orig = Battle.resume); Battle.crate(p, c); this.paused = true; Battle.resume = () => { Battle.resume = orig; closePanel(); clearPressed(); for (const k in keys) keys[k] = false; this.paused = false; G.scene = this; }; },
  chest(p, c) { const orig = Battle._orig || (Battle._orig = Battle.resume); Battle.chest(p, c); this.paused = true;
    Battle.resume = () => { Battle.resume = orig; G.scene = this; closePanel(); clearPressed(); for (const k in keys) keys[k] = false; this.paused = false; if (Battle.cq && Battle.cq.typed && Battle.cq.done && $('cres') && /Ganas|Perfecto|Bien/.test($('cres').textContent)) { this.addAlly(p.x); this.addAlly(p.x + 30); msg('Premio extra: 2 soldados nuevos'); } }; },
  // ---- AI for soldiers and ground bosses ----
  ai(m) {
    if (m.t === 's') return this.brain(m);
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
    if (goal && m.ground && World.holeAhead(m, goal)) m.vy = m.t === 'g' ? -15 : -12.5;
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
      if (--m.callT <= 0 && World.mobs.filter(x => x.t === 's' && !x.dead).length < this.D.maxEnemies * 1.4) { m.callT = 9 * FPS; for (let i = 0; i < (this.diff === 'imposible' ? 4 : 2); i++) this.addEnemy(m.x - 60 + i * 40); msg(`${m.name} llama a su ejército`); }
    }
  },
  setTrap(open) { const L = World.L, g = L.grid; for (let r = 23; r <= 26; r++) { g.t[r * g.cols + L.trap.c0] = open ? TL.ladder : TL.solid; g.t[r * g.cols + L.trap.c1] = open ? TL.air : TL.solid; } L.trap.open = open ? 15 * FPS : 0; if (open) { Sound.sfx('boom'); World.shake = 8; msg('¡El túnel está abierto! Bajen por el hueco.'); } },
  setCover(cv, open) { const g = World.L.grid, r = 23; g.t[r * g.cols + cv.c0] = open ? TL.ladder : TL.solid; g.t[r * g.cols + cv.c1] = open ? TL.air : TL.solid; cv.open = open ? 25 * FPS : 0; cv.hp = 4; if (open) { Sound.sfx('hit'); World.burst((cv.c0 + 1) * T, FLOOR_Y, PAL.dirt, 14, 6); } },
  // ---- coins (saved between games) ----
  get wallet() { return Save.get('coins', 0); }, addCoins(v) { Save.set('coins', this.wallet + v); },
  coin(p, v) { this.addCoins(v); },
  reward(m) { this.addCoins(m.t === 'g' ? 100 : 3); },
  shop(p) {
    this.paused = true; const it = SHOP;
    const html = () => `<h2>Tienda</h2><div>Monedas: <b style="color:#f4ac66">${this.wallet}</b></div>${it.map((x, i) => `<button class="opt" style="background:${this.wallet >= x.cost ? '#5a627a' : '#2b2f3d'}" onclick="Master.buy(${i})"><i>${i + 1}</i>${x.n} · ${x.cost} monedas</button>`).join('')}<div class="small">${x => ''}Gana monedas: federales (3), jefes (100), túneles (5-10), ganar (200).</div><button class="btn" onclick="Master.closeShop()">Salir (Enter)</button>`;
    this.shopP = p; panel(html(), { enter: () => this.closeShop(), key: e => { const d = /^Digit([1-9])$/.exec(e.code); if (d) { this.buy(+d[1] - 1); return true; } return false; } }); this.shopHtml = html;
  },
  buy(i) { const x = SHOP[i], p = this.shopP; if (!x || this.wallet < x.cost) { Sound.sfx('wrong'); return; } this.addCoins(-x.cost); x.f(p, this); Sound.sfx('recruit'); $('panel').innerHTML = this.shopHtml(); },
  closeShop() { closePanel(); clearPressed(); for (const k in keys) keys[k] = false; this.paused = false; },
  // ===== unit brains (both armies) =====
  // roles: asalto = steal the enemy flag, defensor = guard our flag, francotirador = shoot from far,
  //        explorador = free cages and prisoners, soldado = fight whoever is near
  foesOf(u) { return u.side === 'us' ? World.mobs.filter(m => !m.dead) : [...G.players.filter(p => !p.dead && !p.jail), ...World.allies.filter(a => !a.dead)]; },
  los(x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 18); for (let i = 1; i < n; i++) if (tileAt(World.L, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) === TL.solid) return false; return true; },
  brain(u) {
    const L = World.L, D = this.D, us = u.side === 'us', cx = u.x + u.w / 2, cy = u.y + 22;
    if (u.flash > 0) u.flash--; if (u.inv > 0) u.inv--; if (u.cd > 0) u.cd--;
    const role = u.role, range = { asalto: 430, defensor: 480, francotirador: 900, explorador: 380, soldado: 460 }[role];
    const own = us ? L.flags.us : L.flags.them, theirs = us ? L.flags.them : L.flags.us;
    // think about 1-2 times a second: pick where to go
    if (--u.think <= 0) {
      u.think = 40 + irand(0, 40);
      const foes = this.foesOf(u), near = foes.filter(f => Math.abs(f.x - cx) < 700 && Math.abs(f.y - u.y) < 260);
      if (u.carry) u.gx = own.hx;                                                         // bring the flag home
      else if (own.carrier) u.gx = own.carrier.x;                                         // chase whoever took our flag
      else if (!own.home && Math.abs(own.x - cx) < 900) u.gx = own.x;                     // pick our dropped flag back up
      else if (role === 'asalto') u.gx = theirs.carrier ? theirs.carrier.x : theirs.x;
      else if (role === 'defensor') u.gx = near.length && Math.abs(near[0].x - own.hx) < 700 ? near[0].x : own.hx + (us ? 240 : -240) + Math.sin((u.k || 0) + this.t / 200) * 120;
      else if (role === 'francotirador') { const f = near.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))[0]; u.gx = f ? f.x - Math.sign(f.x - cx || 1) * 620 : cx + (us ? 200 : -200); }
      else if (role === 'explorador') { const jail = G.players.some(p => p.jail), cage = L.cages.filter(c => c.alive).sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))[0]; u.gx = jail ? L.prison.door - 40 : cage ? cage.x : theirs.x; }
      else u.gx = near.length ? near[0].x : (us ? L.flags.them.x : L.flags.us.x);
      u.gx = clamp(u.gx, 20, L.w - 40);
    }
    // move toward the goal; jump walls, holes, and up to platforms
    const dx = u.gx - cx, dir = Math.abs(dx) > 24 ? Math.sign(dx) : 0, sp = role === 'francotirador' ? 2.4 : role === 'asalto' || role === 'explorador' ? 3.6 : 3;
    if (dir) { u.vx = clamp(u.vx + dir * .9, -sp, sp); if (!u.aimT) u.face = dir; } else u.vx *= .7;
    u.vy = Math.min(u.vy + (u.vy < 0 ? .62 : .9), 15);
    const wasWall = u.wall; World.moveBody(u, L); World.unstick(u, L);
    if (dir && u.ground && (u.wall || wasWall || World.holeAhead(u, dir))) u.vy = -12.8;
    u.walk = (u.walk || 0) + Math.abs(u.vx) * .07; if (u.aimT > 0) u.aimT--;
    if (u.y > L.h) { u.hp = 0; }
    // explorers open cages they reach
    if (us && role === 'explorador') for (const c of L.cages) if (c.alive && Math.abs(c.x - cx) < 40 && Math.abs(c.y - (u.y + u.h)) < 50) this.openCage(c);
    // shoot only at what is in range and in sight
    if (u.cd <= 0) {
      const tg = this.foesOf(u).filter(f => { const fx = f.x + f.w / 2, fy = f.y + Math.min(30, f.h / 2); return Math.hypot(fx - cx, fy - cy) < range && this.los(cx, cy, fx, fy); }).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0];
      if (tg) {
        const sniper = role === 'francotirador', fx = tg.x + tg.w / 2, fy = tg.y + Math.min(30, tg.h / 2), ang = Math.atan2(fy - cy, fx - cx) + (Math.random() - .5) * (sniper ? .04 : .2), v = sniper ? 17 : 11;
        u.face = Math.sign(fx - cx) || u.face; u.aimT = 20;
        const shot = { x: cx + u.face * 16, y: cy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, l: Math.ceil(range / v) + 4, o: null };
        if (us) World.shots.push({ ...shot, ally: true, w: { dmg: sniper ? 3 : 1, pdmg: 0 } }); else World.shots.push({ ...shot, enemy: true, dmg: Math.round(D.eDmg * (sniper ? 2 : 1)) });
        u.cd = Math.round((sniper ? 110 : role === 'defensor' ? 48 : 42) * (us ? 1 : D.eFire / 75)) + irand(0, 12); Sound.sfx('shoot');
      }
    }
  },
  allyAI(a) { if (a.dead) return; this.brain(a); if (a.hp <= 0) { World.burst(a.x + 14, a.y + 28, PAL.cream, 12, 7); a.dead = -1; this.dropFlag(a); } },
  // ===== capture the flag =====
  dropFlag(u) { for (const f of Object.values(World.L.flags)) if (f.carrier === u) { f.carrier = null; f.x = u.x + u.w / 2; let y = Math.min(u.y + u.h, World.L.h - T); while (y < World.L.h - T && tileAt(World.L, f.x, y + 2) !== TL.solid && tileAt(World.L, f.x, y + 2) !== TL.plat) y += 6; f.y = Math.floor((y + 2) / T) * T; f.dropT = 25 * FPS; u.carry = null; msg(f.side === 'us' ? 'Recuperen nuestra bandera' : 'La bandera federal está en el suelo'); } },
  flags() {
    const L = World.L, F = L.flags;
    const usUnits = [...G.players.filter(p => !p.dead && !p.jail), ...World.allies.filter(a => !a.dead)], themUnits = World.mobs.filter(m => !m.dead && m.t === 's');
    for (const f of Object.values(F)) {
      if (f.carrier) { const c = f.carrier; if (c.dead || c.jail || c.hp <= 0) this.dropFlag(c); else { f.x = c.x + c.w / 2; f.y = c.y; } continue; }
      const mine = f.side === 'us' ? usUnits : themUnits, enemy = f.side === 'us' ? themUnits : usUnits, touch = u => Math.abs(u.x + u.w / 2 - f.x) < 34 && Math.abs(u.y + u.h - f.y) < 70;
      if (!f.home && --f.dropT <= 0) { Object.assign(f, { x: f.hx, y: f.hy, home: true }); continue; }
      if (!f.home) { const r = mine.find(touch); if (r) { Object.assign(f, { x: f.hx, y: f.hy, home: true }); Sound.sfx('open'); msg(f.side === 'us' ? '¡Bandera recuperada!' : 'Los federales recuperaron su bandera'); continue; } }
      const thief = enemy.find(u => !u.carry && touch(u)); if (thief) { f.carrier = thief; f.home = false; thief.carry = f; Sound.sfx('horn'); msg(f.side === 'us' ? '¡Los federales se llevan nuestra bandera!' : `¡${thief.name || 'Un zapatista'} tiene la bandera federal!`); }
    }
    // scoring: a carrier reaching their own flag at home
    for (const [side, f] of Object.entries(F)) { const c = f.carrier; if (!c) continue; const home = side === 'us' ? F.them : F.us;
      if (home.home && Math.abs(c.x + c.w / 2 - home.hx) < 50 && Math.abs(c.y + c.h - home.hy) < 80) {
        c.carry = null; Object.assign(f, { carrier: null, x: f.hx, y: f.hy, home: true });
        if (side === 'them') { L.caps.us++; this.addCoins(50); const b = this.boss; if (b) { b.armor = 0; b.cd = 300; b.stompT = 8 * FPS; } Sound.sfx('recruit'); World.shake = 10; msg('¡Capturamos la bandera federal! El jefe pierde su armadura.'); }
        else { L.caps.them++; for (let i = 0; i < 4; i++) if (World.mobs.filter(x => x.t === 's' && !x.dead).length < this.D.maxEnemies * 2) this.addEnemy(L.enemySpawn + i * 30); if (this.boss) this.boss.hp = Math.min(this.boss.hpMax, this.boss.hp + Math.round(this.boss.hpMax * .2)); Sound.sfx('jail'); msg('Los federales capturaron nuestra bandera. Llegan refuerzos.'); }
      } }
  },
  // ---- per frame ----
  update() {
    if (this.paused || this.over) return;
    const L = World.L, D = this.D; this.t++;
    // trapdoor closes again after a while (if nobody is standing in the hole)
    if (L.trap.open && --L.trap.open <= 0) { const inHole = [...G.players, ...World.allies, ...World.mobs].some(b => !b.dead && b.x + b.w > L.trap.c0 * T && b.x < (L.trap.c1 + 1) * T && b.y + b.h > FLOOR_Y - 4 && b.y < 27 * T); if (inHole) L.trap.open = 60; else this.setTrap(false); }
    // climbing up into a closed cover or trapdoor pushes it open from below
    for (const p of [...G.players.filter(q => !q.dead), ...World.allies.filter(a => !a.dead)]) {
      const under = (c0, c1) => p.x + p.w > c0 * T - 4 && p.x < (c1 + 1) * T + 4 && p.y < 27 * T && p.y + p.h > 24 * T;
      for (const cv of L.covers) if (!cv.open && under(cv.c0, cv.c1)) this.setCover(cv, true);
      if (!L.trap.open && !p.jail && under(L.trap.c0, L.trap.c1)) this.setTrap(true);
    }
    // wooden covers over the maze entrances close again after a while
    for (const cv of L.covers) if (cv.open && --cv.open <= 0) { const inHole = [...G.players, ...World.allies, ...World.mobs].some(b => !b.dead && b.x + b.w > cv.c0 * T && b.x < (cv.c1 + 1) * T && b.y + b.h > FLOOR_Y - 4 && b.y < 27 * T); if (inHole) cv.open = 60; else this.setCover(cv, false); }
    for (const cv of L.covers) if (!cv.open) for (const s of World.shots) if (!s.enemy && s.l > 0 && s.x > cv.c0 * T - 4 && s.x < (cv.c1 + 1) * T + 4 && s.y > FLOOR_Y - 10 && s.y < FLOOR_Y + T) { s.l = 0; if (--cv.hp <= 0) this.setCover(cv, true); }
    // carts: drive with left/right, any shoot key fires, up-shot fires the cannon, jump gets out
    for (const c of L.carts) {
      if (c.dead > 0) { if (--c.dead === 0) Object.assign(c, { x: c.home, y: FLOOR_Y - 60, hp: c.hpMax, vx: 0, vy: 0 }); continue; }
      const p = c.driver;
      if (p) { const k = p.keys; p.x = c.x + c.w / 2 - p.w / 2; p.y = c.y - p.h + 14; p.vx = 0; p.vy = 0; p.inv = Math.max(p.inv, 2);
        const dir = (keys[k.r] ? 1 : 0) - (keys[k.l] ? 1 : 0); c.vx = clamp(c.vx + dir * .35, -4.2, 4.2); if (dir) c.face = dir; else c.vx *= .93;
        if (pressed[k.j] || p.jail || p.dead) { c.driver = null; p.cart = null; p.vy = -10; }
        else {
          if ((keys[k.f] || keys[k.sl] || keys[k.sr]) && --c.cd <= 0) { c.cd = 4; if (keys[k.sl]) c.face = -1; if (keys[k.sr]) c.face = 1; const a = (Math.random() - .5) * .1; World.shots.push({ x: c.x + c.w / 2 + c.face * 60, y: c.y + 14, vx: Math.cos(a) * 16 * c.face, vy: Math.sin(a) * 16, o: p, l: 70, w: { dmg: 1, pdmg: 8 }, pellet: true }); Sound.sfx('mg'); }
          if (keys[k.su] && --c.ccd <= 0) { c.ccd = 50; World.shots.push({ x: c.x + c.w / 2 + c.face * 50, y: c.y, vx: c.face * 9, vy: -8, o: p, l: 160, w: { dmg: 6, pdmg: 50, R: 140 }, bomb: true }); Sound.sfx('cannon'); World.shake = 6; }
        }
        pressed[k.j] = false; pressed[k.f] = false; pressed[k.su] = false; pressed[k.sl] = false; pressed[k.sr] = false;
      } else c.vx *= .9;
      c.vy = Math.min(c.vy + .9, 15); World.moveBody(c, L); c.wheel += c.vx * .08;
      for (const s of World.shots) if (s.enemy && s.l > 0 && s.x > c.x && s.x < c.x + c.w && s.y > c.y && s.y < c.y + c.h) { c.hp -= s.dmg || 15; if (!s.wave) s.l = 0; }
      for (const mb of World.mobs) if (!mb.dead && mb.t === 's' && Math.abs(c.vx) > 2.5 && mb.x < c.x + c.w && mb.x + mb.w > c.x && mb.y + mb.h > c.y) World.hitMob(mb, 99, p);   // run them over
      if (c.hp <= 0) { World.burst(c.x + c.w / 2, c.y + 30, PAL.sand, 40, 12); Sound.sfx('boom'); if (c.driver) { c.driver.cart = null; c.driver.vy = -12; } c.driver = null; c.dead = 30 * FPS; msg('¡La carreta explotó! Vuelve en 30 segundos.'); }
    }
    // machine guns: the player stays on it, left/right aims, any shoot key fires, jump gets off
    for (const p of G.players) if (p.turret) {
      const t = p.turret, k = p.keys; p.x = t.x - p.w / 2 - 8; p.vx = 0;
      if (keys[k.l]) t.ang = Math.max(-Math.PI + .1, t.ang - .03); if (keys[k.r]) t.ang = Math.min(-.02, t.ang + .03);
      if (t.ang < -Math.PI / 2) p.face = -1; else p.face = 1;
      if (pressed[k.j] || p.jail || p.dead) { t.user = null; p.turret = null; }
      else if ((keys[k.f] || keys[k.su] || keys[k.sl] || keys[k.sr]) && --t.cd <= 0) { t.cd = 5; const a = t.ang + (Math.random() - .5) * .06; World.shots.push({ x: t.x + Math.cos(a) * 40, y: t.y - 40 + Math.sin(a) * 40, vx: Math.cos(a) * 16, vy: Math.sin(a) * 16, o: p, l: 70, w: { dmg: 2, pdmg: 0 }, pellet: true, turret: true }); Sound.sfx('mg'); }
      pressed[k.j] = false; pressed[k.f] = false;
    }
    World.update(); this.flags();
    // prison: jailed players stay inside; timer frees them in solo / normal team play
    for (const p of G.players) if (p.jail) {
      if (p.y + p.h > FLOOR_Y + 8) { p.jail = 0; p.inv = 120; p.digT = 0; msg(`${p.name} escapó por el túnel`); Sound.sfx('recruit'); continue; }
      p.x = clamp(p.x, L.prison.x0 + 4, L.prison.x1 - p.w - 4); if (p.y < FLOOR_Y - 5 * T) p.y = FLOOR_Y - 5 * T;
      if (keys[p.keys.f] && p.ground && !L.trap.open) { p.digT = (p.digT || 0) + 1; if (p.digT % 12 === 0) { World.dust(p, 3); Sound.sfx('step'); } if (p.digT > 4 * FPS) { p.digT = 0; this.setTrap(true); msg(`${p.name} cavó un hoyo. ¡Escapa por el túnel!`); } } else p.digT = Math.max(0, (p.digT || 0) - 2);
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
    if (r < .45) L.guns.push({ x, y, type: pick(['minigun', 'machinegun', 'dynamite', 'machete', 'shotgun', 'sniper', 'bomb', 'boomerang']), alive: true, t: 0, once: true });
    else if (r < .75) L.crates.push({ x, y, type: Math.random() < .5 ? 'q' : 'p', alive: true, t: 0 });
    else L.chests.push({ x, y, alive: true, t: 0 });
    L.hearts.push({ x: x + 200, y, alive: true, t: 0 });
  },
  hud() {
    const b = this.boss, armyA = World.allies.filter(a => !a.dead).length, armyE = World.mobs.filter(m => m.t === 's' && !m.dead).length;
    $('qlv').textContent = `Nivel Maestro · ${this.D.label} · Fase ${this.phase + 1} / 3`;
    $('qq').textContent = b ? `${b.name}: ${Math.max(0, b.hp)} / ${b.hpMax}${b.armor > 0 ? ' · armadura ' + b.armor : ''}` : 'Prepárate';
    $('qa').innerHTML = `<span class="a">Tu ejército: ${armyA}</span><span class="a">Federales: ${armyE}</span><span class="a">${G.players.length === 1 ? `Capturas: ${this.caps} / ${this.diff === 'imposible' ? 2 : 3}` : `Presos: ${G.players.filter(p => p.jail).length}`}</span><span class="a">Cambio en: ${Math.ceil(Math.max(0, this.morphT) / FPS)}s</span><span class="a">Banderas ${World.L.caps.us} - ${World.L.caps.them}</span><span class="a">Monedas: ${this.wallet}</span>`;
    $('qtime').textContent = '';
  },
  win() {
    this.over = true; this.won = true; this.addCoins(200); Sound.play('title');
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
const MEV = { dropFlag: u => Master.dropFlag(u), allyAI: a => Master.allyAI(a), msg, interact() {}, note() {}, letter() {}, orb() {}, freeAll: by => Master.freeAll(by), coin: (p, v) => Master.coin(p, v), reward: m => Master.reward(m),
  crate: (p, c) => Master.crate(p, c), chest: (p, c) => Master.chest(p, c), use: p => Master.use(p), captured: (p, by) => Master.captured(p, by), ai: m => Master.ai(m) };
const MasterMenu = {
  open() {
    closeAll(); G.scene = Title;
    panel(`<h2>Nivel Maestro: La Revolución</h2><div>Tu ejército contra el ejército federal. El campo cambia de forma. Libera campesinos, usa las ametralladoras y derrota a Huerta, Carranza y Porfirio Díaz.</div>
      <div class="en">Your army vs the federal army. The arena changes shape. Free campesinos, use the machine guns, and defeat Huerta, Carranza and Porfirio Díaz.</div>
      <div class="small">La armadura de los jefes solo se rompe con dinamita, rifle, sombrero, cohetes o las ametralladoras fijas. / Boss armor only breaks with dynamite, rifle, sombrero, rockets or the mounted machine guns.</div>
      <div class="small">Túneles: rompe las tapas de madera (S o dispara), baja por la escalera y explora el laberinto. Hay armas y monedas en los túneles, y uno llega debajo de la prisión. Escaleras: mantén saltar para subir. / Break the wooden covers, climb down the ladders and explore the tunnel maze; one tunnel reaches under the prison. Hold jump to climb.</div>
      <div class="lbl">CONTROLES EXTRA</div><div class="small">${PKEYS.slice(0, G.players.length).map((k, i) => `Jugador ${i + 1}: disparar izq ${keyName(k.sl)}, der ${keyName(k.sr)}, arriba ${keyName(k.su)} · acción ${keyName(k.f)} = ametralladora / carreta / jaula / prisión`).join('<br>')}</div>
      <div class="lbl">MONEDAS: ${Master.wallet} · DESBLOQUEOS PERMANENTES</div>${UNLOCKS.map(u => { const h = Save.get('unlocks', {})[u.id]; return `<button class="opt" style="background:${h ? '#2eb082' : Master.wallet >= u.cost ? '#5a627a' : '#2b2f3d'}" onclick="buyUnlock('${u.id}')"><i>${h ? '' : ''}</i>${u.n} · ${h ? 'listo' : u.cost + ' monedas'}</button>`; }).join('')}
      <button class="btn" onclick="Master.start('normal')">Normal</button><button class="btn" style="background:#d95763;color:#fbf1e3" onclick="Master.start('imposible')">Imposible</button><button class="btn alt" onclick="Chapters.start()">Volver</button>`, { enter: () => Master.start('normal') });
  },
};

const SHOP = [
  { n: 'Minigun', cost: 60, f: p => { p.gun = { ...GUNS.minigun, key: 'minigun' }; } },
  { n: 'Dinamita', cost: 40, f: p => { p.gun = { ...GUNS.dynamite, key: 'dynamite' }; } },
  { n: 'Armadura +100', cost: 30, f: p => { p.armor = 100; } },
  { n: 'Vida llena', cost: 15, f: p => { p.hp = 100; } },
  { n: '3 soldados nuevos', cost: 50, f: (p, M) => { for (let i = 0; i < 3; i++) M.addAlly(p.x - 40 + i * 30); } },
  { n: 'Reparar la carreta', cost: 25, f: () => World.L.carts.forEach(c => { c.hp = c.hpMax; if (c.dead) c.dead = 1; }) },
];
const UNLOCKS = [
  { id: 'mg', n: 'Empezar con ametralladora', cost: 150 },
  { id: 'armor', n: 'Empezar con 100 de armadura', cost: 150 },
  { id: 'army', n: '+3 soldados al empezar', cost: 200 },
  { id: 'cart', n: 'Carreta blindada (doble vida)', cost: 250 },
];
function buyUnlock(id) { const u = UNLOCKS.find(x => x.id === id), have = Save.get('unlocks', {}); if (!u || have[id] || Master.wallet < u.cost) { Sound.sfx('wrong'); return; } Master.addCoins(-u.cost); have[id] = true; Save.set('unlocks', have); Sound.sfx('recruit'); MasterMenu.open(); }
