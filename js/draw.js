'use strict';
// =====================================================================
// DRAWING the world (split screen aware) and the in-game HUD
// =====================================================================
const cv = $('c'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = n => `${n}px Pixel, monospace`;
function txt(g, s, x, y, size, col, align, outline) {
  g.font = FONT(Math.round(size * 1.75)); g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
  if (outline) { g.fillStyle = outline; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) g.fillText(s, x + dx, y + dy); }
  g.fillStyle = col; g.fillText(s, x, y);
}
function box(g, x, y, w, h, fill, border) { g.fillStyle = border || PAL.ink; g.fillRect(x - 3, y - 3, w + 6, h + 6); g.fillStyle = fill; g.fillRect(x, y, w, h); }

function drawGround(g, L) {
  const gs = GROUND[THEMES[L.theme].ground];
  for (const [gx, gw] of L.ground) {
    const n = Math.round(gw / T);
    for (let i = 0; i < n; i++) {
      const top = n === 1 ? gs.top[3] : i === 0 ? gs.top[0] : i === n - 1 ? gs.top[2] : gs.top[1];
      tile(g, gs.sheet, top, gx + i * T, GY); for (let r = 1; r < 5; r++) tile(g, gs.sheet, gs.fill, gx + i * T, GY + r * T);
    }
  }
  for (const [px, pw] of L.pits) { for (let x = px; x < px + pw; x += T) tile(g, 'tiles', 68, x, H - T); }
}
function drawPlat(g, x, y, w, moving, L) {
  const gs = GROUND[THEMES[L.theme].ground], n = Math.max(1, Math.round(w / T));
  for (let i = 0; i < n; i++) {
    const id = moving ? 146 : n === 1 ? gs.plat[3] : i === 0 ? gs.plat[0] : i === n - 1 ? gs.plat[2] : gs.plat[1];
    tile(g, moving ? 'tiles' : gs.sheet, id, x + i * T, y);
  }
}
function drawSaw(g, s) {
  const [x, y] = World.sawPos(s), a = World.tick * .25;
  g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = PAL.grey;
  g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? s.r : s.r + 8, t = i / 16 * Math.PI * 2; g.lineTo(Math.cos(t) * r, Math.sin(t) * r); } g.fill();
  g.fillStyle = PAL.slate; g.fillRect(-6, -6, 12, 12); g.restore();
}
function drawOrb(g, o, k) {
  const y = o.y + Math.sin(World.tick / 18 + k) * 5, c = ANS[o.k];
  g.fillStyle = PAL.ink; g.fillRect(o.x - 22, y - 22, 44, 44);
  g.fillStyle = c; g.fillRect(o.x - 19, y - 19, 38, 38);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(o.x - 19, y - 19, 38, 6);
  txt(g, LET[o.k], o.x, y + 11, 20, PAL.paper, 'center');
}
function drawWorld(g) {
  const L = World.L, tk = World.tick;
  L.decor.forEach(d => drawDecor(g, d));
  if (L.gate) { const x = L.gate.x; tile(g, 'tiles', 130, x, GY - 2 * T); tile(g, 'tiles', 150, x, GY - T); tile(g, 'tiles', 111, x + T + 6, GY - 2 * T); tile(g, 'tiles', 131, x + T + 6, GY - T); }
  drawGround(g, L);
  L.plats.forEach(([x, y, w]) => drawPlat(g, x, y, w, false, L));
  L.movers.forEach(m => m.cx !== undefined && drawPlat(g, m.cx, m.cy, m.w, true, L));
  L.spikes.forEach(([x, y, w]) => { for (let i = 0; i < w; i += T) tile(g, 'tiles', 68, x + i, y - T); });
  L.pads.forEach(pd => tile(g, 'tiles', pd.t > 0 ? 108 : 107, pd.x, pd.y - T));
  L.saws.forEach(s => drawSaw(g, s));
  L.coins.forEach(c => { if (!c.got) tile(g, 'tiles', (tk >> 4) % 2 ? 151 : 152, c.x - 18, c.y - 18); });
  L.hearts.forEach(h => { if (h.alive) tile(g, 'tiles', 44, h.x - 18, h.y - 18); });
  L.notes.forEach(n => { if (n.got) return; const y = n.y + Math.sin(tk / 15) * 4; g.fillStyle = PAL.ink; g.fillRect(n.x - 15, y - 19, 30, 38); g.fillStyle = PAL.paper; g.fillRect(n.x - 12, y - 16, 24, 32); g.fillStyle = PAL.dirt; for (let i = 0; i < 4; i++) g.fillRect(n.x - 8, y - 10 + i * 7, 16, 2); });
  L.guns.forEach(gn => { if (!gn.alive) return; const G = GUNS[gn.type], y = gn.y + Math.sin(tk / 12 + gn.x) * 3; box(g, gn.x - 26, y - 14, 52, 28, PAL.slate); txt(g, G.n, gn.x, y + 7, 11, PAL.cream, 'center'); });
  L.crates.forEach(c => { if (!c.alive) return; tile(g, 'tiles', c.type === 'p' ? 67 : 10, c.x - 18, c.y - 18); });
  L.chests.forEach(c => { if (!c.alive) return; const x = c.x - 22, y = c.y - 14; g.fillStyle = PAL.ink; g.fillRect(x - 3, y - 13, 50, 44); g.fillStyle = PAL.dirt2; g.fillRect(x, y - 10, 44, 38); g.fillStyle = PAL.dirt; g.fillRect(x, y - 10, 44, 12); g.fillStyle = PAL.sand; g.fillRect(x, y + 2, 44, 4); g.fillRect(x + 18, y, 8, 10); });
  World.orbs.forEach((o, k) => { if (o.alive) drawOrb(g, o, k); });
  for (const m of World.mobs) {
    if (m.dead) continue;
    if (m.t === 'w') drawChar(g, 'federal', m.x + m.w / 2, m.y + m.h, 2.4, m.dir, walkFrame(Math.floor(m.anim)), m.flash ? .5 : 1);
    else if (m.t === 'f') { const s = vulture((tk >> 3) % 2); g.save(); g.translate(m.x + m.w / 2, m.y); if (m.dir < 0) g.scale(-1, 1); g.drawImage(s, -24, 0, 48, 36); g.restore(); }
    else {
      drawChar(g, m.who, m.x + m.w / 2, m.y + m.h, 6.2, m.dir, walkFrame(Math.floor(World.gt * 6)), m.flash ? .5 : 1);
      g.fillStyle = PAL.ink; g.fillRect(m.x - 4, m.y - 22, m.w + 8, 14); g.fillStyle = PAL.red; g.fillRect(m.x, m.y - 18, m.w * Math.max(0, m.hp) / m.hpMax, 6);
      if (m.armorMax) { g.fillStyle = PAL.grey; g.fillRect(m.x, m.y - 12, m.w * m.armor / m.armorMax, 3); }
    }
  }
  for (const n of L.npcs) {
    drawChar(g, n.who, n.x, GY, 2.5, n.face, 0, 1, 1, 1 + Math.sin(tk / 22 + n.x) * .015);
    if (!n.talked && !n.guard) { const y = GY - 90 + Math.sin(tk / 12) * 3; box(g, n.x - 9, y - 22, 18, 24, PAL.paper); txt(g, '!', n.x, y - 3, 16, PAL.ink, 'center'); }
  }
  for (const s of World.shots) {
    if (s.enemy) { g.fillStyle = PAL.ink; g.fillRect(s.x - 7, s.y - 7, 14, 14); g.fillStyle = PAL.maroon; g.fillRect(s.x - 5, s.y - 5, 10, 10); continue; }
    if (s.laser || s.snipe) { g.fillStyle = PAL.sky; g.fillRect(s.x - 30, s.y - 3, 60, 6); continue; }
    if (s.boom) { g.save(); g.translate(s.x, s.y); g.rotate(tk * .5); g.fillStyle = '#e8c070'; g.fillRect(-16, -3, 32, 6); g.fillRect(-6, -8, 12, 6); g.restore(); continue; }
    if (s.bomb) { g.fillStyle = PAL.ink; g.fillRect(s.x - 8, s.y - 8, 16, 16); g.fillStyle = PAL.sand; g.fillRect(s.x + 2, s.y - 12, 3, 5); continue; }
    if (s.rocket) { g.fillStyle = PAL.grey; g.fillRect(s.x - 8, s.y - 3, 16, 6); g.fillStyle = PAL.red; g.fillRect(s.x + (s.vx > 0 ? 6 : -10), s.y - 3, 4, 6); continue; }
    g.fillStyle = PAL.ink; g.fillRect(s.x - 6, s.y - 4, 12, 8); g.fillStyle = s.o ? s.o.color : PAL.sand; g.fillRect(s.x - 4, s.y - 2, 8, 4);
  }
  for (const p of World.players) {
    if (p.dead) continue;
    const fr = !p.ground ? (p.vy < 0 ? 4 : 6) : Math.abs(p.vx) > .6 ? walkFrame(Math.floor(p.walk)) : 0;
    const sq = (p.squash || 0) / 9, st = (p.stretch || 0) / 9, sx = 1 + .2 * sq - .12 * st, sy = 1 - .2 * sq + .14 * st;
    const a = p.inv > 0 && (p.inv >> 2) % 2 ? .4 : p.lock > 0 ? .55 : 1;
    drawChar(g, p.hero, p.x + p.w / 2, p.y + p.h, 2.5, p.face, fr, a, sx, sy);
    if (p.lock > 0) { g.fillStyle = PAL.ink; g.fillRect(p.x - 6, p.y - 30, p.w + 12, 8); g.fillStyle = PAL.red; g.fillRect(p.x - 4, p.y - 28, (p.w + 8) * p.lock / p.lockMax, 4); }
    if (p.shieldT > 0) { g.strokeStyle = PAL.sky; g.lineWidth = 3; g.strokeRect(p.x - 8, p.y - 8, p.w + 16, p.h + 12); }
  }
  // name tag only when you click someone
  const lb = World.label;
  if (lb && lb.t > 0) {
    lb.t--; const o = lb.o, cx = o.x + (o.w ? o.w / 2 : 0), top = (o.y != null ? o.y : GY - 70) - 18;
    g.font = FONT(Math.round(13 * 1.75)); const w = g.measureText(lb.text).width + 20;
    g.globalAlpha = Math.min(1, lb.t / 15);
    box(g, cx - w / 2, top - 30, w, 28, PAL.slate); txt(g, lb.text, cx, top - 9, 13, lb.col || PAL.cream, 'center');
    g.fillStyle = PAL.ink; g.fillRect(cx - 4, top - 1, 8, 4); g.globalAlpha = 1;
  }
  for (const q of World.parts) { g.globalAlpha = q.dust ? Math.min(1, q.l / 12) * .8 : 1; g.fillStyle = q.c; g.fillRect(q.x | 0, q.y | 0, q.s, q.s); } g.globalAlpha = 1;
}

function playerCam(p, vw, L) {
  const z = vw >= 600 ? 1 : .78, view = vw / z; let tx = p.x + p.w / 2 - view / 2 + p.face * 50;
  tx = L.w <= view ? (L.w - view) / 2 : clamp(tx, 0, L.w - view);
  if (p.cx === undefined || Math.abs(p.cx - tx) > 900) p.cx = tx; else p.cx += (tx - p.cx) * .12;
  return { x: p.cx, y: GY - 578 / z, z };
}
function sharedCam(L) {
  const a = World.players.filter(p => !p.dead); if (!a.length) return World.cam || { x: 0, y: 0, z: 1 };
  const x0 = Math.min(...a.map(p => p.x)), x1 = Math.max(...a.map(p => p.x + p.w)), z = clamp(W / (x1 - x0 + 700), .55, 1);
  const c = World.cam || (World.cam = { x: 0, y: 0, z: 1 }); c.z += (z - c.z) * .08;
  const view = W / c.z; c.x = L.w <= view ? (L.w - view) / 2 : clamp(c.x + ((x0 + x1) / 2 - view / 2 - c.x) * .12, 0, L.w - view); c.y = GY - 578 / c.z; return c;
}
function drawHUD(g, p, x, y, w) {
  box(g, x, y, w, 70, PAL.slate);
  txt(g, p.name, x + 10, y + 22, 13, p.color);
  txt(g, String(p.score), x + w - 10, y + 22, 13, PAL.cream, 'right');
  const hearts = Math.ceil(p.hp / 20);
  for (let i = 0; i < 5; i++) tile(g, 'tiles', i < hearts ? 44 : 46, x + 6 + i * 24, y + 30, 24);
  if (p.armor > 0) { g.fillStyle = PAL.grey; g.fillRect(x + 8, y + 60, Math.min(118, p.armor * 1.2), 4); }
  if (World.mode === 'battle') {
    const wpn = p.gun ? `${p.gun.n} ${p.gun.ammo}` : `${World.weaponOf(p).n} ${p.ammo}`;
    txt(g, wpn, x + w - 10, y + 44, 13, PAL.cream, 'right');
    txt(g, p.lock > 0 ? `Espera ${Math.ceil(p.lock / FPS)}` : `Racha ${p.streak}`, x + w - 10, y + 64, 13, p.lock > 0 ? PAL.red : PAL.sand, 'right');
  }
}
function renderWorld(split) {
  const L = World.L, ps = World.players, n = ps.length, sp = split && n > 1;
  const views = sp ? ps.map((p, i) => ({ x0: Math.round(i * W / n), w: Math.round(W / n), p })) : [{ x0: 0, w: W, p: null }];
  ctx.imageSmoothingEnabled = false;
  for (const v of views) {
    const c = v.p ? playerCam(v.p, v.w, L) : sharedCam(L); v.cam = c;
    ctx.save(); ctx.beginPath(); ctx.rect(v.x0, 0, v.w, H); ctx.clip(); ctx.translate(v.x0, 0);
    drawBackground(ctx, L.theme, c.x, v.w);
    ctx.save(); if (World.shake) ctx.translate((Math.random() - .5) * World.shake, (Math.random() - .5) * World.shake);
    ctx.scale(c.z, c.z); ctx.translate(-Math.round(c.x), -c.y); drawWorld(ctx); ctx.restore();
    // arrows to answer orbs that are off this screen
    for (const o of World.orbs) {
      if (!o.alive) continue; const sx = (o.x - c.x) * c.z, sy = (o.y - c.y) * c.z; if (sx > 0 && sx < v.w && sy > 0 && sy < H) continue;
      const ax = clamp(sx, 26, v.w - 26), ay = clamp(sy, 40, H - 100); box(ctx, ax - 14, ay - 14, 28, 28, ANS[o.k]); txt(ctx, LET[o.k], ax, ay + 8, 14, PAL.paper, 'center');
    }
    if (v.p) { if (v.p.dead) { ctx.fillStyle = 'rgba(43,47,61,.7)'; ctx.fillRect(0, 0, v.w, H); txt(ctx, `Vuelves en ${Math.ceil(v.p.dead / FPS)}`, v.w / 2, H / 2, 32, PAL.paper, 'center'); } drawHUD(ctx, v.p, 12, H - 82, Math.min(290, v.w - 24)); }
    else ps.forEach((p, i) => drawHUD(ctx, p, 12 + i * 306, H - 82, 290));
    ctx.restore();
  }
  if (sp) { ctx.fillStyle = PAL.ink; views.slice(1).forEach(v => ctx.fillRect(v.x0 - 3, 0, 6, H)); }
  World.views = views;
}
