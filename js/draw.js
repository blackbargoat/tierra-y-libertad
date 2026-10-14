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

// tile grid with autotiling (grass on top, dirt inside, platforms, spikes)
function drawGrid(g, L, c, vw) {
  const gs = GROUND[THEMES[L.theme].ground], G = L.grid, cols = G.cols;
  const c0 = Math.max(0, Math.floor(c.x / T) - 1), c1 = Math.min(cols - 1, Math.ceil((c.x + vw / c.z) / T) + 1);
  const r0 = Math.max(0, Math.floor(c.y / T) - 1), r1 = Math.min(ROWS - 1, Math.ceil((c.y + H / c.z) / T) + 1);
  const at = (cc, r) => cc < 0 || cc >= cols ? TL.solid : r < 0 ? TL.air : r >= ROWS ? TL.solid : G.t[r * cols + cc];
  const isS = (cc, r) => { const t = at(cc, r); return t === TL.solid || t === TL.spike; };
  for (let r = r0; r <= r1; r++) for (let cc = c0; cc <= c1; cc++) {
    const t = G.t[r * cols + cc], x = cc * T, y = r * T; if (t === TL.air) continue;
    if (t === TL.ladder) { tile(g, 'tiles', 71, x, y); continue; }
    if (t === TL.plat) { const l = at(cc - 1, r) === TL.plat, rr = at(cc + 1, r) === TL.plat; tile(g, gs.sheet, !l && !rr ? gs.plat[3] : !l ? gs.plat[0] : !rr ? gs.plat[2] : gs.plat[1], x, y); continue; }
    const open = !isS(cc, r - 1) && at(cc, r - 1) !== TL.plat;
    if (open && r < 26) { const l = isS(cc - 1, r) && !isS(cc - 1, r - 1), rr = isS(cc + 1, r) && !isS(cc + 1, r - 1); tile(g, gs.sheet, !l && !rr ? gs.top[3] : !l ? gs.top[0] : !rr ? gs.top[2] : gs.top[1], x, y); }
    else { tile(g, gs.sheet, gs.fill, x, y); if (open) { g.fillStyle = PAL.dirt2; g.fillRect(x, y, T, 4); } }
    if (t === TL.spike) tile(g, 'tiles', 68, x, y - T + 4);
    if (World.morphWarn && (World.tick >> 3) % 2 && L.morph && r >= 3 && r < FLOOR_ROW && cc >= L.morph.c0 * CW && cc < (L.morph.c1 + 1) * CW) { g.fillStyle = 'rgba(217,87,99,.55)'; g.fillRect(x, y, T, T); }
  }
}
function drawPlat(g, x, y, w, moving, L) {
  const n = Math.max(1, Math.round(w / T));
  for (let i = 0; i < n; i++) tile(g, 'tiles', 146, x + i * (w / n), y, Math.ceil(w / n) + 1);
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
function drawWorld(g, c, vw) {
  const L = World.L, tk = World.tick;
  // underground backdrop (behind caves)
  g.fillStyle = '#4a3530'; g.fillRect(c.x - 10, FLOOR_Y + T, vw / c.z + 20, L.h);
  g.fillStyle = '#56403a'; for (let i = 0; i < 70; i++) { const x = (i * 431) % L.w, y = FLOOR_Y + 2 * T + (i * 197) % (L.h - FLOOR_Y); g.fillRect(x, y, 10, 6); }
  L.decor.forEach(d => { if (d.k === 'torch') { g.fillStyle = PAL.dirt2; g.fillRect(d.x - 3, d.y - 40, 6, 22); g.fillStyle = (tk >> 3) % 2 ? PAL.sand : PAL.sun; g.fillRect(d.x - 6, d.y - 54, 12, 14); } else drawDecor(g, d); });
  for (const d of L.doors) { tile(g, 'tiles', 130, d.x - T / 2, d.y - 2 * T); tile(g, 'tiles', 150, d.x - T / 2, d.y - T); }
  if (L.gate) { const x = L.gate.x, y = L.gate.y; tile(g, 'tiles', 85, x - 2 * T, y - T); tile(g, 'tiles', 130, x, y - 2 * T); tile(g, 'tiles', 150, x, y - T); tile(g, 'tiles', 111, x + T + 6, y - 2 * T); tile(g, 'tiles', 131, x + T + 6, y - T); }
  drawGrid(g, L, c, vw);
  L.movers.forEach(m => m.cx !== undefined && drawPlat(g, m.cx, m.cy, m.w, true, L));
  L.pads.forEach(pd => tile(g, 'tiles', pd.t > 0 ? 108 : 107, pd.x, pd.y - T));
  L.saws.forEach(s => drawSaw(g, s));
  L.coins.forEach(c => { if (!c.got) tile(g, 'tiles', (tk >> 4) % 2 ? 151 : 152, c.x - 18, c.y - 18); });
  L.hearts.forEach(h => { if (h.alive) tile(g, 'tiles', 44, h.x - 18, h.y - 18); });
  L.notes.forEach(n => { if (n.got) return; const y = n.y + Math.sin(tk / 15) * 5; g.fillStyle = 'rgba(43,47,61,.25)'; g.fillRect(n.x - 14, n.y + 22, 28, 4); drawItem(g, n.icon || 'doc', n.x, y, 46); });
  (L.letters || []).forEach(l => { if (l.got) return; const y = l.y + Math.sin(tk / 14 + l.i) * 4; g.save(); g.translate(l.x, y); g.rotate(Math.PI / 4); g.fillStyle = PAL.ink; g.fillRect(-17, -17, 34, 34); g.fillStyle = PAL.sun; g.fillRect(-14, -14, 28, 28); g.restore(); txt(g, l.ch, l.x, y + 9, 15, PAL.ink, 'center'); });
  L.guns.forEach(gn => { if (!gn.alive) return; const y = gn.y + Math.sin(tk / 12 + gn.x) * 4; g.fillStyle = 'rgba(43,47,61,.25)'; g.fillRect(gn.x - 16, gn.y + 22, 32, 4); drawItem(g, gn.type, gn.x, y, 48); });
  L.crates.forEach(c => { if (!c.alive) return; tile(g, 'tiles', c.type === 'p' ? 67 : 10, c.x - 18, c.y - 18); });
  L.chests.forEach(c => { if (!c.alive) return; const x = c.x - 22, y = c.y - 14; g.fillStyle = PAL.ink; g.fillRect(x - 3, y - 13, 50, 44); g.fillStyle = PAL.dirt2; g.fillRect(x, y - 10, 44, 38); g.fillStyle = PAL.dirt; g.fillRect(x, y - 10, 44, 12); g.fillStyle = PAL.sand; g.fillRect(x, y + 2, 44, 4); g.fillRect(x + 18, y, 8, 10); });
  World.orbs.forEach((o, k) => { if (o.alive) drawOrb(g, o, k); });
  for (const m of World.mobs) {
    if (m.dead) continue;
    if (m.t === 's') { drawChar(g, 'federal', m.x + m.w / 2, m.y + m.h, 2.5, m.face, !m.ground ? 4 : Math.abs(m.vx) > .4 ? walkFrame(Math.floor(m.walk || 0)) : 0, m.flash ? .5 : 1); continue; }
    if (m.t === 'g') { drawChar(g, m.who, m.x + m.w / 2, m.y + m.h, 9, m.face, !m.ground ? 4 : Math.abs(m.vx) > .3 ? walkFrame(Math.floor(m.walk || 0)) : 0, m.flash ? .55 : 1); g.fillStyle = PAL.ink; g.fillRect(m.x - 14, m.y - 36, m.w + 28, 16); g.fillStyle = PAL.red; g.fillRect(m.x - 10, m.y - 32, (m.w + 20) * Math.max(0, m.hp) / m.hpMax, 8); if (m.armorMax) { g.fillStyle = PAL.grey; g.fillRect(m.x - 10, m.y - 24, (m.w + 20) * m.armor / m.armorMax, 3); } continue; }
    if (m.t === 'w') drawChar(g, 'federal', m.x + m.w / 2, m.y + m.h, 2.4, m.dir, walkFrame(Math.floor(m.anim)), m.flash ? .5 : 1);
    else if (m.t === 'f') { const s = vulture((tk >> 3) % 2); g.save(); g.translate(m.x + m.w / 2, m.y); if (m.dir < 0) g.scale(-1, 1); g.drawImage(s, -24, 0, 48, 36); g.restore(); }
    else {
      drawChar(g, m.who, m.x + m.w / 2, m.y + m.h, 6.2, m.dir, walkFrame(Math.floor(World.gt * 6)), m.flash ? .5 : 1);
      g.fillStyle = PAL.ink; g.fillRect(m.x - 4, m.y - 22, m.w + 8, 14); g.fillStyle = PAL.red; g.fillRect(m.x, m.y - 18, m.w * Math.max(0, m.hp) / m.hpMax, 6);
      if (m.armorMax) { g.fillStyle = PAL.grey; g.fillRect(m.x, m.y - 12, m.w * m.armor / m.armorMax, 3); }
    }
  }
  for (const n of L.npcs) {
    const ny = n.y || GY; drawChar(g, n.who, n.x, ny, 2.5, n.face, 0, 1, 1, 1 + Math.sin(tk / 22 + n.x) * .015);
    if (!n.talked && !n.guard) { const y = ny - 90 + Math.sin(tk / 12) * 3; box(g, n.x - 9, y - 22, 18, 24, PAL.paper); txt(g, '!', n.x, y - 3, 16, PAL.ink, 'center'); }
  }
  for (const s of World.shots) {
    if (s.enemy) { g.fillStyle = PAL.ink; g.fillRect(s.x - 7, s.y - 7, 14, 14); g.fillStyle = PAL.maroon; g.fillRect(s.x - 5, s.y - 5, 10, 10); continue; }
    if (s.laser || s.snipe) { g.fillStyle = PAL.sky; if (Math.abs(s.vy) > Math.abs(s.vx)) g.fillRect(s.x - 3, s.y - 30, 6, 60); else g.fillRect(s.x - 30, s.y - 3, 60, 6); continue; }
    if (s.melee) { g.strokeStyle = PAL.paper; g.lineWidth = 5; g.beginPath(); g.arc(s.x, s.y, 30, -1.2 + s.l * .2, .2 + s.l * .2); g.stroke(); continue; }
    if (s.wave) { g.fillStyle = PAL.ink; g.fillRect(s.x - 10, s.y - 10, 20, 14); g.fillStyle = PAL.dirt; g.fillRect(s.x - 8, s.y - 8, 16, 10); continue; }
    if (s.boom) { g.save(); g.translate(s.x, s.y); g.rotate(tk * .5); g.fillStyle = '#e8c070'; g.fillRect(-16, -3, 32, 6); g.fillRect(-6, -8, 12, 6); g.restore(); continue; }
    if (s.bomb) { g.fillStyle = PAL.ink; g.fillRect(s.x - 8, s.y - 8, 16, 16); g.fillStyle = PAL.sand; g.fillRect(s.x + 2, s.y - 12, 3, 5); continue; }
    if (s.rocket) { g.fillStyle = PAL.grey; g.fillRect(s.x - 8, s.y - 3, 16, 6); g.fillStyle = PAL.red; g.fillRect(s.x + (s.vx > 0 ? 6 : -10), s.y - 3, 4, 6); continue; }
    g.fillStyle = PAL.ink; g.fillRect(s.x - 6, s.y - 4, 12, 8); g.fillStyle = s.o ? s.o.color : PAL.sand; g.fillRect(s.x - 4, s.y - 2, 8, 4);
  }
  for (const t of L.turrets || []) { g.save(); g.translate(t.x, t.y - 34); g.rotate(t.ang); g.fillStyle = PAL.ink; g.fillRect(-6, -8, 52, 16); g.fillStyle = PAL.grey; g.fillRect(-4, -5, 48, 10); g.fillStyle = PAL.slate; g.fillRect(36, -7, 12, 14); g.restore(); g.fillStyle = PAL.ink; g.fillRect(t.x - 22, t.y - 34, 44, 34); g.fillStyle = PAL.dirt2; g.fillRect(t.x - 19, t.y - 31, 38, 31); g.fillStyle = PAL.dirt; g.fillRect(t.x - 19, t.y - 31, 38, 6); }
  for (const c of L.carts || []) { if (c.dead) continue; const x = c.x, y = c.y, f = c.face;
    g.fillStyle = PAL.ink; g.fillRect(x - 3, y + 6, c.w + 6, 40); g.fillStyle = PAL.dirt2; g.fillRect(x, y + 9, c.w, 34); g.fillStyle = PAL.grey; g.fillRect(x, y + 9, c.w, 8); g.fillStyle = PAL.slate; for (let i = 8; i < c.w; i += 18) g.fillRect(x + i, y + 22, 4, 4);
    g.fillStyle = PAL.ink; g.fillRect(x + c.w / 2 + f * 30 - (f < 0 ? 40 : 0), y + 8, 40, 10); g.fillStyle = PAL.grey; g.fillRect(x + c.w / 2 + f * 30 - (f < 0 ? 38 : -2), y + 10, 36, 6);
    for (const wx of [x + 22, x + c.w - 22]) { g.fillStyle = PAL.ink; g.beginPath(); g.arc(wx, y + 48, 13, 0, 7); g.fill(); g.fillStyle = PAL.dirt; g.beginPath(); g.arc(wx, y + 48, 9, 0, 7); g.fill(); g.strokeStyle = PAL.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(wx + Math.cos(c.wheel) * 9, y + 48 + Math.sin(c.wheel) * 9); g.lineTo(wx - Math.cos(c.wheel) * 9, y + 48 - Math.sin(c.wheel) * 9); g.stroke(); }
    if (c.hp < c.hpMax) { g.fillStyle = PAL.ink; g.fillRect(x, y - 10, c.w, 6); g.fillStyle = PAL.green; g.fillRect(x, y - 10, c.w * c.hp / c.hpMax, 6); } }
  for (const cv of L.covers || []) if (!cv.open) { const x = cv.c0 * T; g.fillStyle = PAL.ink; g.fillRect(x - 4, FLOOR_Y - 4, 2 * T + 8, 14); g.fillStyle = '#9f6a3a'; g.fillRect(x - 2, FLOOR_Y - 2, 2 * T + 4, 10); g.fillStyle = PAL.dirt2; for (let i = 0; i < 4; i++) g.fillRect(x + i * 18 + 2, FLOOR_Y - 2, 3, 10); }
  if (L.ammo) { const a = L.ammo; g.fillStyle = PAL.ink; g.fillRect(a.x - 34, a.y - 46, 68, 34); g.fillStyle = '#6a5a3a'; g.fillRect(a.x - 31, a.y - 43, 62, 28); g.fillStyle = PAL.sand; for (let i = 0; i < 5; i++) g.fillRect(a.x - 26 + i * 11, a.y - 52, 6, 12); for (const wx of [a.x - 20, a.x + 20]) { g.fillStyle = PAL.ink; g.fillRect(wx - 8, a.y - 14, 16, 14); } box(g, a.x - 50, a.y - 84, 100, 22, PAL.ink); txt(g, 'MUNICIÓN', a.x, a.y - 67, 9, PAL.sand, 'center'); }
  if (L.shop) { const s = L.shop; g.fillStyle = PAL.ink; g.fillRect(s.x - 54, s.y - 96, 108, 96); g.fillStyle = PAL.dirt2; g.fillRect(s.x - 50, s.y - 60, 100, 60); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? PAL.cream : PAL.red; g.fillRect(s.x - 54 + i * 18, s.y - 96, 18, 22); } g.fillStyle = PAL.sun; g.fillRect(s.x - 10, s.y - 50, 20, 14); box(g, s.x - 44, s.y - 124, 88, 22, PAL.ink); txt(g, 'TIENDA', s.x, s.y - 107, 9, PAL.sand, 'center'); }
  if (L.trap) { const tx = L.trap.c0 * T; if (!L.trap.open) { g.fillStyle = PAL.ink; g.fillRect(tx - 2, FLOOR_Y - 2, 2 * T + 4, 10); g.fillStyle = PAL.dirt2; for (let i = 0; i < 4; i++) g.fillRect(tx + i * 18, FLOOR_Y, 14, 6); } }
  for (const c of L.cages || []) { if (!c.alive) continue; drawChar(g, 'campesino', c.x, c.y, 2.3, -1, 0); g.fillStyle = PAL.ink; g.fillRect(c.x - 34, c.y - 80, 68, 8); for (let i = 0; i < 7; i++) g.fillRect(c.x - 32 + i * 11, c.y - 76, 4, 76); g.fillRect(c.x - 34, c.y - 4, 68, 4); }
  if (L.prison) { const P = L.prison; g.fillStyle = 'rgba(43,47,61,.35)'; g.fillRect(P.x0, P.y - 5 * T, P.x1 - P.x0, 5 * T); }
  for (const a of World.allies || []) if (!a.dead) drawChar(g, 'soldado', a.x + a.w / 2, a.y + a.h, 2.5, a.face, !a.ground ? 4 : Math.abs(a.vx) > .5 ? walkFrame(Math.floor(a.walk)) : 0, a.inv > 0 && (a.inv >> 2) % 2 ? .5 : 1);
  for (const p of World.players) {
    if (p.dead) continue;
    const fr = !p.ground ? (p.vy < 0 ? 4 : 6) : Math.abs(p.vx) > .6 ? walkFrame(Math.floor(p.walk)) : 0;
    const sq = (p.squash || 0) / 9, st = (p.stretch || 0) / 9, sx = 1 + .2 * sq - .12 * st, sy = 1 - .2 * sq + .14 * st;
    const a = p.inv > 0 && (p.inv >> 2) % 2 ? .4 : p.lock > 0 ? .55 : 1;
    drawChar(g, p.hero, p.x + p.w / 2, p.y + p.h, 2.5, p.face, fr, a, sx, sy);
    if (p.digT > 0) { g.fillStyle = PAL.ink; g.fillRect(p.x - 6, p.y - 30, p.w + 12, 8); g.fillStyle = PAL.sand; g.fillRect(p.x - 4, p.y - 28, (p.w + 8) * Math.min(1, p.digT / 240), 4); }
    if (p.lock > 0) { g.fillStyle = PAL.ink; g.fillRect(p.x - 6, p.y - 30, p.w + 12, 8); g.fillStyle = PAL.red; g.fillRect(p.x - 4, p.y - 28, (p.w + 8) * p.lock / p.lockMax, 4); }
    if (p.shieldT > 0) { g.strokeStyle = PAL.sky; g.lineWidth = 3; g.strokeRect(p.x - 8, p.y - 8, p.w + 16, p.h + 12); }
  }
  // name tag only when you click someone
  const lb = World.label;
  if (lb && lb.t > 0) {
    lb.t--; const o = lb.o, cx = Math.round(o.x + o.w / 2), top = Math.round(o.y) - 14;
    g.font = FONT(Math.round(11 * 1.75)); const w = Math.round(g.measureText(lb.text).width) + 16;
    g.globalAlpha = Math.min(1, lb.t / 15);
    g.fillStyle = lb.col; g.fillRect(cx - w / 2 - 2, top - 26, w + 4, 26); g.fillStyle = PAL.ink; g.fillRect(cx - w / 2, top - 24, w, 22);
    txt(g, lb.text, cx, top - 7, 11, lb.col, 'center'); g.fillStyle = lb.col; g.fillRect(cx - 3, top, 6, 4);
    g.globalAlpha = 1;
  }
  if (L.prison) { const P = L.prison; g.fillStyle = PAL.ink; for (let x = P.x0 + 8; x < P.x1; x += 22) g.fillRect(x, P.y - 5 * T, 5, 5 * T); box(g, P.door - 60, P.y - 7 * T, 150, 28, PAL.maroon); txt(g, 'PRISIÓN', P.door + 15, P.y - 7 * T + 21, 12, PAL.cream, 'center'); if (World.players.some(p => p.jail)) for (const sx of [P.door - 55, P.x1 + 60]) { box(g, sx - 37, P.y - 2 * T - 30, 74, 24, PAL.ink); txt(g, 'S: abrir', sx, P.y - 2 * T - 12, 10, PAL.sand, 'center'); } }
  for (const q of World.parts) { g.globalAlpha = q.dust ? Math.min(1, q.l / 12) * .8 : 1; g.fillStyle = q.c; g.fillRect(q.x | 0, q.y | 0, q.s, q.s); } g.globalAlpha = 1;
}

function playerCam(p, vw, L) {
  const z = vw >= 600 ? 1 : .78, view = vw / z, vh = H / z;
  let tx = p.x + p.w / 2 - view / 2 + p.face * 50; tx = L.w <= view ? (L.w - view) / 2 : clamp(tx, 0, L.w - view);
  let ty = clamp(p.y + p.h - vh * .62, 0, L.h - vh);
  if (p.cx === undefined || Math.abs(p.cx - tx) > 900 || Math.abs(p.cy - ty) > 700) { p.cx = tx; p.cy = ty; } else { p.cx += (tx - p.cx) * .12; p.cy += (ty - p.cy) * .1; }
  return { x: p.cx, y: p.cy, z };
}
function sharedCam(L) {
  const a = World.players.filter(p => !p.dead); if (!a.length) return World.cam || { x: 0, y: 0, z: 1 };
  const x0 = Math.min(...a.map(p => p.x)), x1 = Math.max(...a.map(p => p.x + p.w)), y0 = Math.min(...a.map(p => p.y)), y1 = Math.max(...a.map(p => p.y + p.h));
  const z = clamp(Math.min(W / (x1 - x0 + 700), H / (y1 - y0 + 420)), .5, 1);
  const c = World.cam || (World.cam = { x: 0, y: FLOOR_Y - 578, z: 1 }); c.z += (z - c.z) * .08;
  const view = W / c.z, vh = H / c.z;
  c.x = L.w <= view ? (L.w - view) / 2 : clamp(c.x + ((x0 + x1) / 2 - view / 2 - c.x) * .12, 0, L.w - view);
  c.y = clamp(c.y + ((y0 + y1) / 2 - vh * .55 - c.y) * .1, 0, L.h - vh); return c;
}
function drawHUD(g, p, x, y, w) {
  box(g, x, y, w, 70, PAL.slate);
  g.fillStyle = p.color; g.fillRect(x + 10, y + 10, 12, 12); txt(g, p.name, x + 30, y + 22, 13, PAL.cream);
  txt(g, String(p.score), x + w - 10, y + 22, 13, PAL.cream, 'right');
  const hearts = Math.ceil(p.hp / 20);
  for (let i = 0; i < 5; i++) tile(g, 'tiles', i < hearts ? 44 : 46, x + 6 + i * 24, y + 30, 24);
  if (p.armor > 0) { g.fillStyle = PAL.grey; g.fillRect(x + 8, y + 60, Math.min(118, p.armor * 1.2), 4); }
  if (World.mode === 'battle' || World.mode === 'master') {
    const wpn = p.gun ? `${p.gun.n} ${p.gun.ammo}` : `${World.weaponOf(p).n} ${p.ammo}`;
    txt(g, wpn, x + w - 10, y + 44, 13, PAL.cream, 'right');
    txt(g, p.jail ? 'Preso: S = cavar' : p.cart ? 'Carreta' : p.turret ? 'Ametralladora' : p.lock > 0 ? `Espera ${Math.ceil(p.lock / FPS)}` : `Racha ${p.streak}`, x + w - 10, y + 64, 13, p.lock > 0 ? PAL.red : PAL.sand, 'right');
  }
}
function renderWorld(split) {
  const L = World.L, ps = World.players, n = ps.length, sp = split && n > 1;
  const views = sp ? ps.map((p, i) => ({ x0: Math.round(i * W / n), w: Math.round(W / n), p })) : [{ x0: 0, w: W, p: null }];
  ctx.imageSmoothingEnabled = false;
  for (const v of views) {
    const c = v.p ? playerCam(v.p, v.w, L) : sharedCam(L); v.cam = c;
    ctx.save(); ctx.beginPath(); ctx.rect(v.x0, 0, v.w, H); ctx.clip(); ctx.translate(v.x0, 0);
    drawBackground(ctx, L.theme, c.x, v.w, c.y);
    ctx.save(); if (World.shake) ctx.translate((Math.random() - .5) * World.shake, (Math.random() - .5) * World.shake);
    ctx.scale(c.z, c.z); ctx.translate(-Math.round(c.x), -Math.round(c.y)); drawWorld(ctx, c, v.w); ctx.restore();
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
