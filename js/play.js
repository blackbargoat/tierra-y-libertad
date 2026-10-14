'use strict';
// =====================================================================
// GAMEPLAY: players, physics, enemies, shots, items
// =====================================================================
const PKEYS = [
  { l: 'KeyA', r: 'KeyD', j: 'KeyW', f: 'KeyS', sl: 'KeyQ', sr: 'KeyE', su: 'KeyR', label: 'W A S D' },
  { l: 'ArrowLeft', r: 'ArrowRight', j: 'ArrowUp', f: 'ArrowDown', sl: 'Comma', sr: 'Period', su: 'Slash', label: 'Flechas' },
  { l: 'KeyJ', r: 'KeyL', j: 'KeyI', f: 'KeyK', sl: 'KeyU', sr: 'KeyO', su: 'KeyP', label: 'I J K L' },
];
const DEFAULT_KEYS = PKEYS.map(k => ({ ...k }));
(Save.get('keys', []) || []).forEach((k, i) => { if (PKEYS[i] && k) Object.assign(PKEYS[i], k); });
function keyName(c) {
  const m = { ArrowUp: 'Arriba', ArrowDown: 'Abajo', ArrowLeft: 'Izq', ArrowRight: 'Der', Space: 'Espacio', ShiftLeft: 'Shift', ShiftRight: 'Shift D', ControlLeft: 'Ctrl', ControlRight: 'Ctrl D', AltLeft: 'Alt', AltRight: 'Alt D', Enter: 'Enter', Slash: '/', Period: '.', Comma: ',', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']' };
  return m[c] || c.replace(/^Key|^Digit|^Numpad/, '');
}
const keysLabel = i => { const k = PKEYS[i]; return `${keyName(k.j)} saltar, ${keyName(k.l)}/${keyName(k.r)} mover, ${keyName(k.f)} acción`; };
const PCOL = [PAL.sand, PAL.blue, PAL.green];
const WEAPONS = [
  { n: 'Pistola', need: 0, cd: 18, dmg: 1, pdmg: 25, kind: 'ball' },
  { n: 'Triple', need: 2, cd: 20, dmg: 1, pdmg: 20, kind: 'triple' },
  { n: 'Rayo', need: 3, cd: 14, dmg: 3, pdmg: 30, kind: 'laser' },
  { n: 'Cohetes', need: 5, cd: 22, dmg: 5, pdmg: 35, kind: 'rocket' },
];
const GUNS = {
  shotgun: { n: 'Escopeta', ammo: 8, cd: 28, dmg: 1, pdmg: 12, kind: 'shotgun', col: PAL.sand },
  boomerang: { n: 'Sombrero', ammo: 10, cd: 30, dmg: 2, pdmg: 22, kind: 'boom', col: '#e8c070' },
  bomb: { n: 'Bombas', ammo: 6, cd: 34, dmg: 4, pdmg: 40, kind: 'bomb', col: PAL.ink },
  sniper: { n: 'Rifle', ammo: 5, cd: 45, dmg: 6, pdmg: 50, kind: 'snipe', col: PAL.blue },
  machinegun: { n: 'Ametralladora', ammo: 70, cd: 6, dmg: 1, pdmg: 9, kind: 'mg', col: PAL.grey },
  dynamite: { n: 'Dinamita', ammo: 5, cd: 40, dmg: 7, pdmg: 55, kind: 'bomb', R: 175, col: PAL.red },
  minigun: { n: 'Minigun', ammo: 220, cd: 3, dmg: 1, pdmg: 7, kind: 'mg', heavy: true, col: PAL.grey },
  machete: { n: 'Machete', ammo: 40, cd: 20, dmg: 4, pdmg: 35, kind: 'melee', col: PAL.grey },
};
const POWERS = [
  { n: 'Botas rápidas', f: p => p.speedT = 15 * FPS }, { n: 'Súper salto', f: p => p.jumpT = 15 * FPS },
  { n: 'Doble daño', f: p => p.megaT = 15 * FPS }, { n: 'Escudo', f: p => p.shieldT = 8 * FPS },
  { n: 'Racha +2', f: p => { p.streak += 2; p.best = Math.max(p.best, p.streak); } },
];
const keys = {}, pressed = {};
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true; if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const clearPressed = () => { for (const k in pressed) delete pressed[k]; };

const World = {
  L: null, mode: 'explore', players: [], mobs: [], shots: [], parts: [], gt: 0, tick: 0, shake: 0, orbs: [], cur: null, events: null,
  init(L, mode, players, events) {
    this.L = L; this.mode = mode; this.players = players; this.events = events; this.gt = 0; this.shots = []; this.parts = []; this.orbs = [];
    this.mobs = L.mobs.map((d, k) => this.mkMob(d, k));
    L.movers.forEach(m => m.cx = undefined);
    players.forEach((p, i) => this.spawn(p, i));
    this.allies = Array.from({ length: L.allies || 0 }, (_, k) => ({ k, x: L.spawns[1][0] + (k - 1) * 60, y: L.spawns[1][1], w: 28, h: 56, vx: 0, vy: 0, face: 1, hp: 60, cd: 30 + k * 13, dead: 0, inv: 0, walk: 0 }));
  },
  spawn(p, i) { const s = this.L.spawns[i] || this.L.spawns[0]; Object.assign(p, { x: s[0], y: s[1], vx: 0, vy: 0, dead: 0, inv: 60, on: null, jumps: 0, stun: 0, cx: undefined }); if (p.hp <= 0) p.hp = 100; },
  mkMob(d, k) {
    if (d.t === 'w') return { ...d, x: (d.min + d.max) / 2, w: 30, h: 54, dir: k % 2 ? 1 : -1, hp: 2, dead: 0, anim: 0, s: 1.3 + Math.random() * .8 };
    if (d.t === 'f') return { ...d, yb: d.yb ?? d.y, w: 40, h: 30, dir: k % 2 ? -1 : 1, hp: 1, dead: 0, ph: k };
    return { ...d, t: 'b', x: d.x ?? (d.min + d.max) / 2, y: 60, w: 96, h: 150, dir: 1, s: d.s || 1.8, hp: d.hpMax || d.hp, hpMax: d.hpMax || d.hp, armor: d.armorMax ?? d.armor ?? 0, armorMax: d.armorMax ?? d.armor ?? 0, dead: 0, cd: 120, flash: 0 };
  },
  ease(Tp, ph = 0) { return .5 - .5 * Math.cos(2 * Math.PI * (this.gt / Tp + ph)); },
  sawPos(s) { if (s.rad) { const a = 2 * Math.PI * (this.gt / s.T + (s.ph || 0)); return [s.cx + Math.cos(a) * s.rad, s.cy + Math.sin(a) * s.rad]; } const k = this.ease(s.T, s.ph || 0); return [s.x1 + (s.x2 - s.x1) * k, s.y1 + (s.y2 - s.y1) * k]; },
  weaponOf(p) { return WEAPONS.filter(w => p.streak >= w.need).pop(); },
  dust(p, n) { for (let i = 0; i < n; i++) this.parts.push({ x: p.x + p.w / 2 + (Math.random() - .5) * 20, y: p.y + p.h - 2, vx: (Math.random() - .5) * 2.4 - p.vx * .15, vy: -Math.random() * 1.6, l: 14 + Math.random() * 10, c: PAL.cream, s: 4, dust: true }); },
  burst(x, y, c, n = 10, sp = 6) { if (this.parts.length > 600) return; for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - .5) * sp, vy: (Math.random() - .8) * sp, l: 24 + Math.random() * 16, c, s: 4 }); },

  hurt(p, dmg, by) {
    if (p.inv > 0 || p.dead || p.jail) return;
    if (p.shieldT > 0) { p.inv = 20; return; }
    if (p.hero === 'diaz') dmg = Math.ceil(dmg / 2);
    if (p.armor > 0) { const a = Math.min(p.armor, dmg); p.armor -= a; dmg -= a; }
    if (dmg > 0) { p.hp -= dmg; this.shake = Math.max(this.shake, 5); Sound.sfx('hit'); }
    if (p.hp <= 0) this.ko(p, by); else p.inv = 30;
  },
  ko(p, by) {
    if (p.dead || p.jail) return;
    if (this.events.captured && this.events.captured(p, by)) return; this.burst(p.x + p.w / 2, Math.min(p.y + p.h / 2, H - 20), p.color, 30, 10); this.shake = 10; Sound.sfx('ko');
    if (by) { by.score += 150; by.ko++; this.events.msg(`${by.name} derrotó a ${p.name}`); } else { p.score = Math.max(0, p.score - 50); this.events.msg(`${p.name} se cayó`); }
    Object.assign(p, { dead: 3 * FPS, vx: 0, vy: 0, stun: 0, on: null });
  },
  killMob(m, by) {
    if (m.carry && this.events.dropFlag) this.events.dropFlag(m);
    if (m.t === 's' || m.t === 'g') { m.hp = 0; m.dead = -1; this.burst(m.x + m.w / 2, m.y + m.h / 2, m.t === 'g' ? PAL.sand : PAL.maroon, m.t === 'g' ? 70 : 14, m.t === 'g' ? 16 : 7); Sound.sfx(m.t === 'g' ? 'boom' : 'hit'); if (by) { by.score += m.t === 'g' ? 500 : 40; by.ko++; } if (this.events.reward) this.events.reward(m, by); if (m.t === 'g') this.shake = 25; return; }
    m.hp = 0; m.dead = m.t === 'b' ? -1 : 8 * FPS; this.burst(m.x + m.w / 2, m.y + m.h / 2, m.t === 'b' ? PAL.sand : PAL.maroon, m.t === 'b' ? 60 : 16, m.t === 'b' ? 14 : 8);
    if (by) by.score += m.t === 'b' ? 300 : 30; Sound.sfx(m.t === 'b' ? 'boom' : 'hit');
    if (m.t === 'b') this.events.msg(`${by ? by.name : 'Alguien'} venció a ${m.name}`);
  },
  hitMob(m, dm, by) {
    if (m.dead) return; m.flash = 6;
    if (m.armor > 0) { if (dm >= 2 || (by && by.megaT > 0)) m.armor = Math.max(0, m.armor - dm); return; }
    m.hp -= dm; if (m.hp <= 0) this.killMob(m, by);
  },
  explode(s) {
    this.burst(s.x, s.y, PAL.sand, 30, 12); this.burst(s.x, s.y, PAL.ink, 14, 8); this.shake = Math.max(this.shake, 10); Sound.sfx('boom');
    const R = s.w.R || 110, mul = s.o.megaT > 0 || s.o.hero === 'carranza' ? 2 : 1;
    for (const m of this.mobs) if (!m.dead && Math.hypot(m.x + m.w / 2 - s.x, m.y + m.h / 2 - s.y) < R + m.w / 2) this.hitMob(m, s.w.dmg * mul, s.o);
    for (const p of this.players) if (p !== s.o && !p.dead && Math.hypot(p.x + p.w / 2 - s.x, p.y + p.h / 2 - s.y) < R) { p.vx += Math.sign(p.x - s.x || 1) * 10; p.vy = -10; this.hurt(p, s.w.pdmg * mul, s.o); }
  },
  // aim: 'face' (default), 'L', 'R' or 'U' (shoot up)
  fire(p, aim) {
    const fx = aim === 'U' ? 0 : aim === 'L' ? -1 : aim === 'R' ? 1 : p.face, fy = aim === 'U' ? -1 : 0;
    if (fx) p.face = fx;
    const x = p.x + p.w / 2 + fx * 20, y = p.y + (fy ? 4 : 24); let w;
    if (p.gun) { w = p.gun; p.gun.ammo--; if (p.gun.ammo <= 0) p.gun = null; }
    else { if (p.ammo <= 0) return; p.ammo--; w = this.weaponOf(p); }
    p.cd = w.cd * (p.hero === 'huerta' ? .5 : 1); Sound.sfx(w.kind === 'mg' ? 'mg' : 'shoot');
    const S = o => this.shots.push({ x, y, vx: 0, vy: 0, o: p, l: 90, w, ...o });
    const rot = (a, sp) => { const c = Math.cos(a), s2 = Math.sin(a); return { vx: (fx * c - fy * s2) * sp, vy: (fx * s2 + fy * c) * sp }; };
    if (w.kind === 'ball') S(rot(0, 13));
    else if (w.kind === 'triple') [-.2, 0, .2].forEach(a => S(rot(a, 13)));
    else if (w.kind === 'laser') S({ ...rot(0, 26), l: 60, pierce: new Set(), laser: true });
    else if (w.kind === 'rocket') { S({ ...rot(-.25, 7), l: 200, rocket: true }); S({ ...rot(.25, 7), l: 200, rocket: true }); }
    else if (w.kind === 'shotgun') for (let i = 0; i < 5; i++) S({ ...rot((i - 2) * .13, 12 + Math.random() * 2), l: 24, pellet: true });
    else if (w.kind === 'mg') S({ ...rot((Math.random() - .5) * .12, 15), l: 60, pellet: true });
    else if (w.kind === 'boom') S({ ...rot(0, 13), ax: -fx * .42, ay: -fy * .42, l: 140, boom: true, pierce: new Set() });
    else if (w.kind === 'bomb') S(fy ? { vx: p.vx * .3, vy: -14, l: 180, bomb: true } : { vx: fx * 7 + p.vx * .5, vy: -9, l: 180, bomb: true });
    else if (w.kind === 'snipe') S({ ...rot(0, 36), l: 50, snipe: true, pierce: new Set() });
    else if (w.kind === 'melee') { S({ x: x + fx * 18, y: y + fy * 30, vx: fx * 2, vy: fy * 2, l: 9, melee: true, pierce: new Set() }); this.burst(x + fx * 30, y + fy * 30, PAL.cream, 5, 4); }
  },

  // move a body through the tile grid: solid walls/ceilings, one-way platforms, moving platforms
  moveBody(p, L) {
    const solid = (x, y) => tileAt(L, x, y) === TL.solid;
    p.x += p.vx;
    if (p.x < 0) { p.x = 0; p.vx = 0; } if (p.x + p.w > L.w) { p.x = L.w - p.w; p.vx = 0; }
    const ys = [p.y + 3, p.y + p.h / 2, p.y + p.h - 3];
    if (p.vx > 0 && ys.some(y => solid(p.x + p.w, y))) { p.x = Math.floor((p.x + p.w) / T) * T - p.w - .01; p.vx = 0; p.wall = 1; }
    else if (p.vx < 0 && ys.some(y => solid(p.x, y))) { p.x = (Math.floor(p.x / T) + 1) * T + .01; p.vx = 0; p.wall = -1; } else p.wall = 0;
    const prevB = p.y + p.h; p.y += p.vy; p.ground = false; p.on = null;
    const xs = [p.x + 3, p.x + p.w / 2, p.x + p.w - 3];
    if (p.vy >= 0) {
      const b = p.y + p.h, top = Math.floor(b / T) * T;
      for (const x of xs) { const t = tileAt(L, x, b); if (t === TL.solid || t === TL.spike || (t === TL.plat && prevB <= top + 2)) { p.y = top - p.h; p.vy = 0; p.ground = true; break; } }
      if (!p.ground) for (const m of L.movers) if (m.cx !== undefined && p.x + p.w > m.cx && p.x < m.cx + m.w && prevB <= m.cy + 2 + Math.abs(m.dy) && p.y + p.h >= m.cy) { p.y = m.cy - p.h; p.vy = 0; p.ground = true; p.on = m; break; }
    } else for (const x of xs) if (solid(x, p.y)) { p.y = (Math.floor(p.y / T) + 1) * T; p.vy = 0; break; }
    if (p.ground) p.jumps = 0;
  },
  // if a body ends up inside a wall (a moving map, a closing cover...), pop it out
  unstick(b, L) { const inWall = () => [b.x + 4, b.x + b.w - 4].some(x => [b.y + 6, b.y + b.h / 2, b.y + b.h - 6].some(y => tileAt(L, x, y) === TL.solid)); let n = 0; while (inWall() && n++ < 14) b.y -= T / 2; if (n) b.vy = 0; },
  holeAhead(b, dir) { const x = b.x + b.w / 2 + dir * (b.w / 2 + 14), y = b.y + b.h + 6, t = tileAt(this.L, x, y), t2 = tileAt(this.L, x, y + T); return t !== TL.solid && t !== TL.plat && t2 !== TL.solid && t2 !== TL.plat; },
  // the Liberating Army of the South: helpers that walk and shoot enemies
  updateAllies() {
    const L = this.L;
    if (this.events.allyAI) { for (const a of this.allies) this.events.allyAI(a); return; }
    for (const a of this.allies) {
      if (a.dead < 0) continue;
      if (a.dead > 0) { if (--a.dead === 0) Object.assign(a, { x: L.spawns[1][0], y: L.spawns[1][1], hp: 60, vx: 0, vy: 0 }); continue; }
      if (a.inv > 0) a.inv--; if (a.cd > 0) a.cd--;
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
      const foes = this.mobs.filter(m => !m.dead);
      const tgt = foes.filter(m => Math.abs(m.x + m.w / 2 - ax) < 700 && Math.abs(m.y + m.h / 2 - ay) < 260).sort((p, q) => Math.abs(p.x - ax) - Math.abs(q.x - ax))[0];
      let goal = null;
      if (tgt) { const dx = tgt.x + tgt.w / 2 - ax; a.face = Math.sign(dx) || 1; if (Math.abs(dx) > 200 + a.k * 25) goal = Math.sign(dx);
        if (a.cd <= 0) { a.cd = 36 + (a.k % 3) * 6; this.shots.push({ x: ax + a.face * 18, y: a.y + 24, vx: a.face * 12, vy: (tgt.y + tgt.h / 2 - ay) / 55, o: null, ally: true, l: 70, w: { dmg: 1, pdmg: 0 } }); Sound.sfx('shoot'); } }
      else if (foes.length && this.mode === 'master') { const f = foes.reduce((m, q) => Math.abs(q.x - ax) < Math.abs(m.x - ax) ? q : m); goal = Math.sign(f.x - ax); }   // march on the enemy
      else { const pl = this.players.filter(p => !p.dead && !p.jail).sort((p, q) => Math.abs(p.x - ax) - Math.abs(q.x - ax))[0]; if (pl && Math.abs(pl.x - ax) > 140 + a.k * 40) goal = Math.sign(pl.x - ax); }
      // reaching the prison frees anyone locked up
      if (L.prison && this.players.some(p => p.jail) && ax > L.prison.door - 90 && ax < L.prison.x1 + 130 && Math.abs(a.y + a.h - L.prison.y) < 60 && this.events.freeAll) this.events.freeAll(null);
      if (goal) { a.vx += goal * 1.1; a.vx = clamp(a.vx, -3.8, 3.8); if (!tgt) a.face = goal; } else a.vx *= .7;
      a.vy = Math.min(a.vy + (a.vy < 0 ? .62 : .9), 15);
      const wasWall = a.wall; this.moveBody(a, L);
      if (goal && a.ground && (a.wall || wasWall)) { a.vy = -13; }
      if (goal && a.ground && this.holeAhead(a, goal)) a.vy = -12.5;
      a.walk += Math.abs(a.vx) * .07;
      for (const m of this.mobs) if (!m.dead && a.inv <= 0 && a.x < m.x + m.w && a.x + a.w > m.x && a.y < m.y + m.h && a.y + a.h > m.y) { a.hp -= 15; a.inv = 40; a.vx = Math.sign(a.x - m.x || 1) * 6; a.vy = -6; }
      if (a.hp <= 0 || a.y > L.h) { this.burst(ax, ay, PAL.cream, 14, 8); a.dead = a.perm ? -1 : 10 * FPS; }
    }
  },
  update() {
    this.tick++; this.gt += 1 / FPS; const L = this.L, battle = this.mode === 'battle' || this.mode === 'master';
    for (const m of L.movers) { if (m.pulse) { m.w = Math.round(m.bw * (.3 + .7 * (.5 + .5 * Math.sin(this.gt * m.ps + m.ph)))); } const k = this.ease(m.T), nx = m.x + m.ax * k + (m.pulse ? (m.bw - m.w) / 2 : 0), ny = m.y + m.ay * k; m.dx = m.cx === undefined ? 0 : nx - m.cx; m.dy = m.cy === undefined ? 0 : ny - m.cy; m.cx = nx; m.cy = ny; }
    for (const p of this.players) {
      const k = p.keys;
      if (p.dead > 0) { if (--p.dead === 0) { this.spawn(p, this.players.indexOf(p)); p.hp = 100; p.inv = 120; } continue; }
      if (p.on) { p.x += p.on.dx; p.y += p.on.dy; }
      if (p.inv > 0) p.inv--; if (p.cd > 0) p.cd--; if (p.lock > 0) p.lock--;
      for (const b of ['speedT', 'jumpT', 'megaT', 'shieldT']) if (p[b] > 0) p[b]--;
      // ---- movement: snappy run, coyote time, jump buffer, variable jump height ----
      const dir = p.stun > 0 || p.turret || p.cart ? 0 : (keys[k.r] ? 1 : 0) - (keys[k.l] ? 1 : 0);
      const maxV = (p.hero === 'campesino' ? 6.4 : 5.2) * (p.speedT > 0 ? 1.35 : 1) * (p.gun && p.gun.heavy ? .6 : 1);
      if (p.stun > 0) { p.stun--; p.vx *= .88; }
      else if (dir) {
        const turning = Math.sign(p.vx) === -dir && Math.abs(p.vx) > .5; if (turning && p.ground && Math.abs(p.vx) > 3) this.dust(p, 2);
        p.vx += dir * (p.ground ? (turning ? 2.4 : 1.4) : .8);
        if (Math.abs(p.vx) > maxV) p.vx = Math.sign(p.vx) * maxV;
        p.face = dir;
      } else p.vx *= p.ground ? .62 : .93;
      if (Math.abs(p.vx) < .05) p.vx = 0;
      p.coyote = p.ground ? 7 : Math.max(0, (p.coyote || 0) - 1);
      if (pressed[k.j]) p.jbuf = 8; else if (p.jbuf > 0) p.jbuf--;
      const maxJ = (p.hero === 'villa' ? 3 : 2) + (p.jumpT > 0 ? 1 : 0);
      const cxp = p.x + p.w / 2, onLadder = tileAt(L, cxp, p.y + p.h / 2) === TL.ladder || tileAt(L, cxp, p.y + p.h - 4) === TL.ladder;
      p.climb = onLadder && !p.jail;
      if (p.climb) { p.vy = keys[k.j] ? -4.5 : 3.5; p.jbuf = 0; p.jumps = 1; p.vx *= .8; }
      else if (p.jbuf > 0 && p.stun <= 0) {
        if (p.coyote > 0) { p.vy = -13.2; p.jumps = 1; p.coyote = 0; p.jbuf = 0; p.on = null; p.stretch = 9; this.dust(p, 5); Sound.sfx('jump'); }
        else if (p.jumps < maxJ && pressed[k.j]) { p.vy = -11.6; p.jumps = Math.max(p.jumps, 1) + 1; p.jbuf = 0; p.on = null; p.stretch = 7; Sound.sfx('jump'); this.dust(p, 4); }
      }
      if (p.padT > 0) p.padT--; else if (!keys[k.j] && p.vy < -4) p.vy *= .6;   // let go early = short hop
      const can = p.stun <= 0 && !p.jail && !p.turret && !p.cart;
      if (can && battle) {
        if (pressed[k.f] && this.events.use && this.events.use(p)) {}  // mount a gun / open a cage / free prisoners
        else { const aim = pressed[k.su] || (keys[k.su] && p.gun && p.gun.kind === 'mg') ? 'U' : pressed[k.sl] || (keys[k.sl] && p.gun && p.gun.kind === 'mg') ? 'L' : pressed[k.sr] || (keys[k.sr] && p.gun && p.gun.kind === 'mg') ? 'R' : pressed[k.f] || (keys[k.f] && p.gun && p.gun.kind === 'mg') ? 'face' : null;
          if (aim && p.cd <= 0 && (p.gun || p.ammo > 0)) this.fire(p, aim); }
      } else if (pressed[k.f] && p.stun <= 0 && !battle) this.events.interact(p);
      p.walk += Math.abs(p.vx) * .07; if (p.squash > 0) p.squash--; if (p.stretch > 0) p.stretch--;
      if (!p.climb) p.vy = Math.min(p.vy + (p.vy < 0 ? .62 : .9), 15);
      const wasG = p.ground, fallV = p.vy, prevB = p.y + p.h; this.moveBody(p, L);
      this.unstick(p, L);
      if (p.ground && !wasG && fallV > 4) { p.squash = 9; this.dust(p, 6); Sound.sfx('step'); }
      if (p.ground && Math.abs(p.vx) > 4 && this.tick % 9 === 0) this.dust(p, 2);
      for (const pd of L.pads) if (p.x + p.w > pd.x && p.x < pd.x + T && p.y + p.h >= pd.y - 14 && p.y + p.h <= pd.y + 2 && p.vy >= 0) { p.vy = -25; p.jumps = 1; p.on = null; p.ground = false; p.padT = 45; pd.t = 12; Sound.sfx('pad'); }
      if (p.ground && tileAt(L, p.x + p.w / 2, p.y + p.h + 2) === TL.spike) { this.hurt(p, 30, null); if (!p.dead) { p.vy = -11; p.jumps = 1; p.stun = 12; } }
      if (p.y > L.h) { this.ko(p, null); continue; }
      for (const s of L.saws) { const [x, y] = this.sawPos(s); if (Math.hypot(p.x + p.w / 2 - x, p.y + p.h / 2 - y) < s.r + 20) { this.hurt(p, 25, null); if (!p.dead) { p.vx = Math.sign(p.x - x || 1) * 9; p.vy = -8; p.stun = 18; } } }
      if (p.dead) continue;
      for (const m of this.mobs) {
        if (m.dead || !(p.x < m.x + m.w && p.x + p.w > m.x && p.y < m.y + m.h && p.y + p.h > m.y)) continue;
        if (m.t !== 'b' && m.t !== 'g' && p.vy > 0 && prevB <= m.y + 12) { if (m.t === 's' && m.hp > 1) { m.hp--; m.flash = 8; } else this.killMob(m, p); p.vy = -11; p.jumps = 1; continue; }
        if (p.jail) continue; this.hurt(p, m.t === 'b' || m.t === 'g' ? 30 : 20, null); if (!p.dead) { p.vx = Math.sign(p.x - m.x || 1) * 9; p.vy = -8; p.stun = 16; }
      }
      if (p.dead) continue;
      const near = (o, r) => Math.hypot(p.x + p.w / 2 - o.x, p.y + p.h / 2 - o.y) < r;
      for (const c of L.coins) if (!c.got && near(c, 30)) { c.got = true; p.score += 10; Sound.sfx('coin'); if (this.events.coin) this.events.coin(p, c.v || 5); }
      for (const n of L.notes) if (!n.got && near(n, 36)) { n.got = true; p.score += 50; this.events.note(n, p); return; }
      for (const l of L.letters || []) if (!l.got && near(l, 32)) { l.got = true; p.score += 30; Sound.sfx('coin'); this.events.letter && this.events.letter(l, p); }
      for (const h of L.hearts) if (h.alive && near(h, 30) && p.hp < 100) { h.alive = false; h.t = 20 * FPS; p.hp = Math.min(100, p.hp + 40); Sound.sfx('coin'); }
      for (const g of L.guns) if (g.alive && near(g, 32)) { g.alive = false; g.t = 15 * FPS; p.gun = { ...GUNS[g.type], key: g.type }; Sound.sfx('open'); this.events.msg(`${p.name} tiene: ${GUNS[g.type].n}`); }
      for (const c of L.crates) if (c.alive && near(c, 34)) { c.alive = false; c.t = 20 * FPS; this.events.crate(p, c); return; }
      for (const c of L.chests) if (c.alive && near(c, 34)) { c.alive = false; c.t = 25 * FPS; this.events.chest(p, c); return; }
      if (battle && p.lock === 0) for (const o of this.orbs) {
        if (!o.alive || !near(o, 36)) continue;
        if (o.right) { this.orbs.forEach(x => x.alive = false); this.events.orb(p, true, o); return; }
        o.tried = o.tried || new Set(); if (o.tried.has(p)) continue; o.tried.add(p);
        this.events.orb(p, false, o); break;
      }
    }
    clearPressed();
    for (const pd of L.pads) if (pd.t > 0) pd.t--;
    for (const arr of [L.crates, L.chests, L.guns, L.hearts]) for (const c of arr) if (!c.alive && --c.t <= 0) c.alive = true;
    if (this.allies) this.updateAllies(); this.updateMobs(); this.updateShots();
    for (const q of this.parts) { q.x += q.vx; q.y += q.vy; q.vy += q.dust ? .02 : .3; q.l--; } this.parts = this.parts.filter(q => q.l > 0);
    if (this.shake > 0) this.shake *= .85; if (this.shake < .5) this.shake = 0;
  },
  updateMobs() {
    const alive = this.players.filter(p => !p.dead);
    for (const m of this.mobs) {
      if ((m.t === 's' || m.t === 'g') && !m.dead) { this.events.ai && this.events.ai(m); continue; }
      if (m.flash > 0) m.flash--;
      if (m.dead) { if (m.dead > 0 && --m.dead === 0) Object.assign(m, this.mkMob(m, this.mobs.indexOf(m))); continue; }
      if (m.t === 'w') { m.x += m.s * m.dir; if (m.x < m.min || m.x + m.w > m.max) m.dir *= -1; m.y = m.yy ?? (m.yy = m.y - m.h); m.anim += .15; }
      else if (m.t === 'f') { m.x += m.s * m.dir; if (m.x < 0 || m.x + m.w > this.L.w) m.dir *= -1; m.y = m.yb + Math.sin(this.gt * 2.2 + m.ph) * m.amp; }
      else {
        m.x += m.s * m.dir; if (m.x < m.min || m.x + m.w > m.max) m.dir *= -1; m.y = (m.flyY ?? 70) + Math.sin(this.gt * 1.4) * 16;
        const nr = alive.filter(p => Math.abs(p.x - m.x) < 900), low = m.hp < m.hpMax / 2, bx = m.x + m.w / 2, by = m.y + 60;
        if (--m.cd <= 0 && nr.length) {
          if (m.ring && Math.random() < .5) { const n = low ? 12 : 8; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + this.gt; this.shots.push({ x: bx, y: by, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, o: null, enemy: true, l: 220 }); } }
          else { const t = pick(nr), ang = Math.atan2(t.y + 20 - by, t.x + 14 - bx), sp = m.hard ? (low ? [-.32, -.16, 0, .16, .32] : [-.2, 0, .2]) : (low ? [-.22, 0, .22] : [0]); sp.forEach(a => this.shots.push({ x: bx, y: by, vx: Math.cos(a + ang) * 6.5, vy: Math.sin(a + ang) * 6.5, o: null, enemy: true, l: 220 })); }
          m.cd = m.hard ? (low ? 55 : 85) : (low ? 75 : 105); Sound.sfx('shoot');
        }
      }
    }
  },
  updateShots() {
    for (const s of this.shots) {
      if (s.rocket) { const tg = this.mobs.filter(m => !m.dead).concat(this.players.filter(p => p !== s.o && !p.dead)).sort((a, b) => ((a.t === 'b' || a.t === 'g') ? -1e6 : 0) + Math.hypot(a.x - s.x, a.y - s.y) - (((b.t === 'b' || b.t === 'g') ? -1e6 : 0) + Math.hypot(b.x - s.x, b.y - s.y)))[0];
        if (tg) { const ang = Math.atan2(tg.y + tg.h / 2 - s.y, tg.x + tg.w / 2 - s.x); s.vx += Math.cos(ang) * .7; s.vy += Math.sin(ang) * .7; const sp = Math.hypot(s.vx, s.vy); if (sp > 9) { s.vx *= 9 / sp; s.vy *= 9 / sp; } } }
      if (s.boom) { s.vx += s.ax; s.vy += s.ay; if (s.l < 120) { if (Math.hypot(s.o.x - s.x, s.o.y - s.y) < 40) s.l = 0; s.vx += (s.o.x - s.x) * .004; s.vy += (s.o.y + 20 - s.y) * .004; } }
      if (s.bomb) s.vy += .45;
      s.x += s.vx; s.y += s.vy; s.l--;
      if (s.bomb && s.l <= 0) { this.explode(s); continue; }
      const mul = s.o && (s.o.megaT > 0 || s.o.hero === 'carranza') ? 2 : 1;
      if (s.enemy && this.allies) for (const a of this.allies) if (!a.dead && a.inv <= 0 && s.l > 0 && s.x > a.x && s.x < a.x + a.w && s.y > a.y && s.y < a.y + a.h) { a.hp -= Math.round((s.dmg || 18) * .8); a.inv = 20; if (!s.wave) s.l = 0; }
      for (const p of this.players) {
        if (s.ally || p === s.o || p.dead || p.inv > 0 || s.l <= 0) continue;
        if (s.x > p.x - 6 && s.x < p.x + p.w + 6 && s.y > p.y - 6 && s.y < p.y + p.h + 6) {
          if (s.bomb) { this.explode(s); s.l = 0; break; }
          if (s.pierce) { if (s.pierce.has(p)) continue; s.pierce.add(p); } else s.l = 0;
          p.vx += Math.sign(s.vx || 1) * 8; p.vy = -7; p.stun = Math.max(p.stun, 18); this.hurt(p, s.enemy ? (s.dmg || 20) : s.w.pdmg * mul, s.o);
        }
      }
      if (!s.enemy) for (const m of this.mobs) {
        if (m.dead || s.l <= 0) continue;
        if (s.x > m.x && s.x < m.x + m.w && s.y > m.y && s.y < m.y + m.h) {
          if (s.bomb) { this.explode(s); s.l = 0; break; }
          if (s.pierce) { if (s.pierce.has(m)) continue; s.pierce.add(m); } else s.l = 0;
          this.burst(s.x, s.y, PAL.paper, 5, 5); this.hitMob(m, s.w.dmg * mul, s.o);
        }
      }
      if (s.l > 0 && !s.pierce && tileAt(this.L, s.x, s.y) === TL.solid) { if (s.bomb) this.explode(s); else this.burst(s.x, s.y, PAL.cream, 3, 3); s.l = 0; }
    }
    this.shots = this.shots.filter(s => s.l > 0 && s.x > -40 && s.x < this.L.w + 40 && s.y > -400 && s.y < this.L.h + 40);
  },
};
