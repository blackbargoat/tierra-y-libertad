'use strict';
// =====================================================================
// ART: Kenney tile sheets (CC0) + pixel characters drawn in code
// =====================================================================
const IMG = {};
const FLOOR_Y_BG = 23 * 36;
const SHEETS = { tiles: { src: 'assets/tiles.png', ts: 18, cols: 20 }, farm: { src: 'assets/farm.png', ts: 18, cols: 16 }, bgs: { src: 'assets/bgs.png', ts: 24, cols: 8 } };
function loadArt() {
  return Promise.all(Object.entries(SHEETS).map(([k, s]) => new Promise(res => { const i = new Image(); i.onload = () => { IMG[k] = i; res(); }; i.onerror = res; i.src = s.src; })));
}
function tile(g, sheet, idx, x, y, size, flip) {
  const s = SHEETS[sheet], im = IMG[sheet]; if (!im) return;
  const sx = (idx % s.cols) * s.ts, sy = (idx / s.cols | 0) * s.ts; size = size || T;
  if (flip) { g.save(); g.translate(x + size, y); g.scale(-1, 1); g.drawImage(im, sx, sy, s.ts, s.ts, 0, 0, size, size); g.restore(); }
  else g.drawImage(im, sx, sy, s.ts, s.ts, Math.round(x), Math.round(y), size, size);
}

// ---------- ground sets per theme ----------
const GROUND = {
  grass: { sheet: 'tiles', top: [21, 22, 23, 20], fill: 4, plat: [1, 2, 3, 0] },
  sand:  { sheet: 'tiles', top: [61, 62, 63, 60], fill: 4, plat: [41, 42, 43, 40] },
  farm:  { sheet: 'farm',  top: [17, 18, 19, 16], fill: 33, plat: [1, 2, 3, 0] },
  stone: { sheet: 'tiles', top: [147, 147, 147, 147], fill: 104, plat: [146, 146, 146, 146] },
};
const THEMES = {
  village: { ground: 'grass', bg: [7, 15, 23], sky: '#7ff0a5', tint: null, deco: ['tree', 'bush', 'house', 'fence'] },
  farm:    { ground: 'farm', bg: [5, 13, 21], sky: '#fbc97b', tint: null, deco: ['corn', 'hay', 'sunflower', 'farmfence', 'house'] },
  desert:  { ground: 'sand', bg: [4, 12, 20], sky: '#fbc97b', tint: 'rgba(120,60,90,.18)', deco: ['cactus', 'cactus', 'rock', 'sign'] },
  forest:  { ground: 'grass', bg: [6, 14, 22], sky: '#7ff0a5', tint: 'rgba(40,70,60,.22)', deco: ['tree', 'tree', 'bush'] },
  city:    { ground: 'stone', bg: [2, 10, 18], sky: '#dff6f5', tint: null, city: true, deco: ['lamp', 'bush'] },
  night:   { ground: 'sand', bg: [4, 12, 20], sky: '#fbc97b', tint: 'rgba(28,24,52,.66)', stars: true, deco: ['cactus', 'rock', 'arch'] },
  sky:     { ground: 'grass', bg: [1, 9, 17], sky: '#dff6f5', tint: null, deco: ['tree', 'flag', 'bush'] },
};

// Parallax background (screen space). camX scrolls the layers.
function drawBackground(g, theme, camX, vw, camY) {
  const th = THEMES[theme], S = 144, sc = 0.3, hy = camY == null ? 400 : Math.round(400 - (camY - (FLOOR_Y_BG - 578)) * .45);
  g.fillStyle = th.sky; g.fillRect(0, 0, vw, H);
  if (IMG.bgs) {
    const ox = -((camX * sc) % S + S) % S, n = Math.ceil(vw / S) + 2;
    for (let i = -1; i < n; i++) {
      const x = ox + i * S, k = ((Math.floor((camX * sc) / S) + i) % 2 + 2) % 2;
      if (hy > H) continue;
      tile(g, 'bgs', th.bg[1] + (k && th.bg[1] % 2 === 0 ? 1 : 0), x, hy, S);
      for (let yy = hy + S; yy < H; yy += S) tile(g, 'bgs', th.bg[2], x, yy, S);
    }
  }
  if (th.city && hy < H) drawCity(g, camX * .5, vw, hy);
  if (th.tint) { g.fillStyle = th.tint; g.fillRect(0, 0, vw, H); }
  if (th.stars) { g.fillStyle = PAL.paper; for (let i = 0; i < 60; i++) { const x = ((i * 197 - camX * .05) % vw + vw) % vw, y = (i * 83) % 300; g.fillRect(x | 0, y, 3, 3); } g.fillStyle = PAL.paper; g.fillRect(vw - 200, 80, 48, 48); g.fillStyle = th.sky; g.globalAlpha = .4; g.fillRect(vw - 186, 80, 34, 34); g.globalAlpha = 1; }
}
function drawCity(g, ox, vw, hy) { const base = (hy || 400) + 160;
  for (let i = -1; i < vw / 90 + 2; i++) {
    const k = Math.floor(ox / 90) + i, x = i * 90 - (ox % 90), h = 120 + (k * 53 % 140);
    g.fillStyle = k % 3 ? PAL.grey : PAL.slate2; g.fillRect(x, base - h, 80, h + 400);
    g.fillStyle = PAL.sky2; for (let y = base + 20 - h; y < base - 20; y += 24) for (let wx = x + 10; wx < x + 70; wx += 20) if ((k + y + wx) % 3) g.fillRect(wx, y, 8, 12);
  }
}

// =====================================================================
// PIXEL CHARACTERS (16 x 24 grid), built from a short description
// =====================================================================
const SKIN = { a: '#b07850', b: '#c98d62', c: '#d9a27a', d: '#e8b890' };
const CHARS = {
  zapata:   { skin: SKIN.a, hat: 'sombrero', hatC: '#2b2a33', band: '#d8b060', hair: '#1a1410', must: 'big', mustC: '#1a1410', top: 'jacket', topC: '#2b2a33', trim: '#d8b060', pants: '#2b2a33', boots: '#1a1410', bando: true },
  campesino:{ skin: SKIN.b, hat: 'sombrero', hatC: '#e8c070', band: '#9f5a52', hair: '#2a1a10', must: 'small', mustC: '#2a1a10', top: 'shirt', topC: '#f4ead8', sash: '#d95763', pants: '#f4ead8', boots: '#6f3e43' },
  villa:    { skin: SKIN.c, hat: 'tejano', hatC: '#8a6a4a', band: '#5a3a2a', hair: '#3a2a1a', must: 'big', mustC: '#3a2a1a', top: 'shirt', topC: '#c9a46a', pants: '#6f5a3a', boots: '#3a2a1a', bando: true },
  madero:   { skin: SKIN.d, hat: 'none', hair: '#2a1a10', beard: 'goatee', beardC: '#2a1a10', must: 'small', mustC: '#2a1a10', top: 'suit', topC: '#434a5f', pants: '#434a5f', boots: '#1a1a20' },
  diaz:     { skin: SKIN.b, hat: 'kepi', hatC: '#2b3a5a', band: '#d8b060', hair: '#e8e8e8', must: 'big', mustC: '#eeeeee', top: 'uniform', topC: '#2b3a5a', trim: '#d8b060', medals: true, pants: '#2b3a5a', boots: '#1a1a20' },
  huerta:   { skin: SKIN.c, hat: 'kepi', hatC: '#4a5a3a', band: '#2a2a2a', hair: '#9a9a9a', must: 'small', mustC: '#9a9a9a', glasses: 'dark', top: 'uniform', topC: '#4a5a3a', trim: '#2a2a2a', pants: '#4a5a3a', boots: '#1a1a20' },
  carranza: { skin: SKIN.d, hat: 'none', hair: '#dddddd', beard: 'long', beardC: '#eeeeee', glasses: 'round', top: 'suit', topC: '#3a3f50', pants: '#3a3f50', boots: '#1a1a20' },
  gonzalez: { skin: SKIN.c, hat: 'kepi', hatC: '#5a4a3a', band: '#d8b060', hair: '#2a1a10', must: 'small', mustC: '#2a1a10', top: 'uniform', topC: '#5a4a3a', trim: '#d8b060', pants: '#5a4a3a', boots: '#1a1a20' },
  guajardo: { skin: SKIN.b, hat: 'kepi', hatC: '#3a2a2a', band: '#6f3e43', hair: '#1a1410', must: 'thin', mustC: '#1a1410', top: 'uniform', topC: '#3a2a2a', trim: '#6f3e43', pants: '#2a2020', boots: '#1a1a20' },
  hacendado:{ skin: SKIN.d, hat: 'top', hatC: '#1a1a20', band: '#6f3e43', hair: '#2a1a10', must: 'big', mustC: '#2a1a10', top: 'suit', topC: '#6f3e43', vest: '#d8b060', fat: true, pants: '#2b2f3d', boots: '#1a1a20' },
  capataz:  { skin: SKIN.b, hat: 'sombrero', hatC: '#9f5a52', band: '#2b2f3d', hair: '#2a1a10', must: 'small', mustC: '#2a1a10', top: 'shirt', topC: '#6f3e43', pants: '#434a5f', boots: '#2a1a10' },
  mama:     { skin: SKIN.b, hat: 'rebozo', hatC: '#6f3e43', hair: '#1a1410', top: 'blouse', topC: '#5a627a', skirt: '#345551' },
  papa:     { skin: SKIN.a, hat: 'sombrero', hatC: '#e8c070', band: '#6f3e43', hair: '#1a1410', must: 'small', mustC: '#1a1410', top: 'shirt', topC: '#f4ead8', sash: '#2eb082', pants: '#f4ead8', boots: '#6f3e43' },
  viejo:    { skin: SKIN.a, hat: 'sombrero', hatC: '#c9a46a', band: '#6f3e43', hair: '#dddddd', must: 'big', mustC: '#eeeeee', top: 'shirt', topC: '#f4ead8', sash: '#5b6ee1', pants: '#f4ead8', boots: '#6f3e43' },
  campesina:{ skin: SKIN.c, hat: 'rebozo', hatC: '#d95763', hair: '#1a1410', top: 'blouse', topC: '#f4ead8', skirt: '#9f5a52' },
  vecina:   { skin: SKIN.b, hat: 'rebozo', hatC: '#2eb082', hair: '#1a1410', top: 'blouse', topC: '#f4cca1', skirt: '#434a5f' },
  maestra:  { skin: SKIN.c, hat: 'bun', hair: '#2a1a10', top: 'blouse', topC: '#f4ead8', skirt: '#345551', glasses: 'round' },
  soldado:  { skin: SKIN.a, hat: 'sombrero', hatC: '#c9a46a', band: '#d95763', hair: '#1a1410', must: 'small', mustC: '#1a1410', top: 'shirt', topC: '#f4ead8', pants: '#f4ead8', boots: '#6f3e43', bando: true, rifle: true },
  guardia:  { skin: SKIN.b, hat: 'sombrero', hatC: '#9f5a52', band: '#d8b060', hair: '#1a1410', must: 'big', mustC: '#1a1410', top: 'shirt', topC: '#f4cca1', pants: '#434a5f', boots: '#2a1a10', bando: true, rifle: true },
  federal:  { skin: SKIN.c, hat: 'kepi', hatC: '#3a4a6a', band: '#d8b060', hair: '#1a1410', must: 'small', mustC: '#1a1410', top: 'uniform', topC: '#3a4a6a', trim: '#d8b060', pants: '#2b2f3d', boots: '#1a1a20', rifle: true },
  ninio:    { skin: SKIN.a, hat: 'sombrero', hatC: '#e8c070', band: '#6f3e43', hair: '#1a1410', top: 'shirt', topC: '#f4ead8', pants: '#f4ead8', boots: '#6f3e43', child: true },
  nina:     { skin: SKIN.c, hat: 'none', hair: '#1a1410', braid: true, top: 'blouse', topC: '#d95763', skirt: '#5b6ee1', child: true },
};
CHARS.narr = CHARS.zapata;
const spriteCache = {};
const WALK = [1, 2, 3, 2], walkFrame = n => WALK[((n % 4) + 4) % 4];
// frame: 0-3 walk, 4 jump, 5 fallen
function sprite(id, frame) {
  const key = id + ':' + (frame || 0); if (spriteCache[key]) return spriteCache[key];
  const d = CHARS[id] || CHARS.campesino, c = document.createElement('canvas'); c.width = 16; c.height = 24;
  const g = c.getContext('2d'), p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const fr = frame || 0, dress = !!d.skirt;
  // upper body sinks 1px on the stride frames = walking bob
  const oy = fr === 1 || fr === 3 ? 1 : 0, q = (x, y, w, h, col) => p(x, y + oy, w, h, col);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) * k, gg = (n >> 8 & 255) * k, b = (n & 255) * k; return `rgb(${r | 0},${gg | 0},${b | 0})`; };
  // legs: 0 idle, 1 stride, 2 passing, 3 stride (other leg in front), 4 jump, 6 falling
  if (!dress) {
    const P = d.pants, Pd = shade(d.pants, .72), B = d.boots;
    const leg = (pts, boot, col) => { for (const [x, y, w, h] of pts) p(x, y, w, h, col); p(boot[0], boot[1], boot[2], 1, B); };
    if (fr === 1 || fr === 3) { const back = fr === 1 ? Pd : P, front = fr === 1 ? P : Pd;
      leg([[4, 19, 2, 2], [3, 21, 2, 2]], [2, 23, 3], back); leg([[9, 19, 2, 2], [10, 21, 2, 2]], [10, 23, 3], front); }
    else if (fr === 2) { leg([[7, 19, 2, 4]], [7, 23, 3], P); leg([[8, 19, 2, 2], [9, 20, 2, 1]], [9, 21, 3], Pd); }
    else if (fr === 4) { leg([[5, 19, 2, 2], [6, 21, 2, 1]], [6, 22, 3], Pd); leg([[9, 19, 2, 2], [10, 20, 2, 1]], [10, 21, 3], P); }
    else if (fr === 6) { leg([[4, 19, 2, 4]], [3, 23, 3], Pd); leg([[10, 19, 2, 4]], [10, 23, 3], P); }
    else { leg([[5, 19, 2, 4]], [5, 23, 3], Pd); leg([[9, 19, 2, 4]], [9, 23, 3], P); }
  } else {
    const sway = fr === 1 ? -1 : fr === 3 ? 1 : 0;
    q(4, 17, 8, 4, d.skirt); p(3 + sway, 20, 10, 3, d.skirt);
    if (fr === 4) { p(5, 23, 2, 1, '#2a1a10'); p(10, 22, 2, 1, '#2a1a10'); } else { p(5 + sway, 23, 2, 1, '#2a1a10'); p(9 - sway, 23, 2, 1, '#2a1a10'); }
  }
  // body
  const bx = d.fat ? 3 : 4, bw = d.fat ? 10 : 8;
  q(bx, 12, bw, dress ? 6 : 7, d.topC);
  if (d.top === 'suit') { q(7, 12, 2, 3, '#f4ead8'); q(7, 13, 1, 4, '#2b2f3d'); if (d.vest) { q(6, 14, 4, 3, d.vest); q(7, 16, 1, 1, '#2b2f3d'); } }
  if (d.top === 'jacket') { for (let y = 13; y < 18; y += 2) q(10, y, 1, 1, d.trim); q(4, 12, 1, 7, d.trim); }
  if (d.top === 'uniform') { q(bx, 12, bw, 1, d.trim); for (let y = 13; y < 18; y += 2) q(8, y, 1, 1, d.trim); }
  if (d.medals) { q(5, 14, 1, 1, '#d8b060'); q(6, 14, 1, 1, '#d95763'); q(5, 15, 1, 1, '#d8b060'); }
  if (d.sash) q(bx, 17, bw, 2, d.sash);
  if (!dress && !d.sash) q(bx, 18, bw, 1, '#2b2f3d');
  if (d.bando) for (let i = 0; i < 7; i++) { q(5 + i, 12 + i, 1, 1, '#8a6a3a'); if (i % 2) q(5 + i, 12 + i, 1, 1, '#d8c070'); }
  // arms: swing while walking, up when jumping, out when falling
  const back = shade(d.topC, .78);
  if (fr === 4) { q(bx - 1, 9, 1, 4, back); q(bx - 1, 8, 1, 1, d.skin); q(bx + bw, 9, 1, 4, d.topC); q(bx + bw, 8, 1, 1, d.skin); }
  else if (fr === 6) { q(bx - 2, 12, 2, 1, back); q(bx - 3, 12, 1, 1, d.skin); q(bx + bw, 12, 2, 1, d.topC); q(bx + bw + 2, 12, 1, 1, d.skin); }
  else {
    const sw = fr === 1 ? 1 : fr === 3 ? -1 : 0;
    q(bx - 1 - (sw > 0 ? 1 : 0), 13, 1, 4, back); q(bx - 1 - (sw > 0 ? 1 : 0), 17, 1, 1, d.skin);
    q(bx + bw + (sw < 0 ? 1 : 0), 13, 1, 4, d.topC); q(bx + bw + (sw < 0 ? 1 : 0), 17, 1, 1, d.skin);
  }
  if (d.rifle) { q(12, 11, 1, 8, '#5a3a2a'); q(12, 9, 1, 2, '#434a5f'); }
  // head
  q(5, 5, 6, 7, d.skin); q(11, 7, 1, 2, d.skin);
  q(9, 8, 1, 1, '#1a1410'); q(6, 8, 1, 1, '#1a1410');
  if (d.hair) { q(5, 4, 6, 2, d.hair); q(5, 6, 1, 3, d.hair); }
  if (d.braid) { q(4, 6, 1, 7, d.hair); q(4, 13, 1, 1, '#d95763'); }
  if (d.beard === 'goatee') q(7, 10, 3, 3, d.beardC);
  if (d.beard === 'long') { q(5, 9, 6, 6, d.beardC); q(6, 15, 4, 1, d.beardC); }
  if (d.must === 'small') q(7, 10, 4, 1, d.mustC);
  if (d.must === 'thin') q(8, 10, 3, 1, d.mustC);
  if (d.must === 'big') { q(6, 10, 6, 1, d.mustC); q(6, 11, 1, 1, d.mustC); q(11, 11, 1, 1, d.mustC); }
  if (d.glasses === 'dark') q(6, 8, 5, 1, '#1a1a20');
  if (d.glasses === 'round') { q(6, 7, 2, 2, '#d8d8e0'); q(9, 7, 2, 2, '#d8d8e0'); q(6, 8, 1, 1, '#1a1410'); q(9, 8, 1, 1, '#1a1410'); }
  // hats
  if (d.hat === 'sombrero') { q(0, 5, 16, 1, d.hatC); q(1, 4, 14, 1, d.hatC); q(5, 0, 6, 4, d.hatC); q(6, -1, 4, 1, d.hatC); q(5, 3, 6, 1, d.band); }
  if (d.hat === 'tejano') { q(2, 4, 12, 1, d.hatC); q(1, 3, 1, 1, d.hatC); q(14, 3, 1, 1, d.hatC); q(5, 1, 6, 3, d.hatC); q(7, 1, 2, 1, d.band); q(5, 3, 6, 1, d.band); }
  if (d.hat === 'kepi') { q(5, 2, 6, 3, d.hatC); q(5, 4, 6, 1, d.band); q(9, 5, 4, 1, '#1a1a20'); }
  if (d.hat === 'top') { q(5, -1, 6, 5, d.hatC); q(4, 4, 8, 1, d.hatC); q(5, 3, 6, 1, d.band); }
  if (d.hat === 'rebozo') { q(4, 3, 8, 3, d.hatC); q(4, 6, 1, 7, d.hatC); q(11, 6, 1, 4, d.hatC); q(3, 11, 2, 6, d.hatC); }
  if (d.hat === 'bun') { q(5, 4, 6, 2, d.hair); q(3, 4, 2, 2, d.hair); }
  if (fr === 5) { const r = document.createElement('canvas'); r.width = 24; r.height = 24; const rg = r.getContext('2d'); rg.translate(4, 24); rg.rotate(-Math.PI / 2); rg.drawImage(c, 0, 0); spriteCache[key] = r; return r; }
  spriteCache[key] = c; return c;
}
// draw a character with feet at (x, y)
function drawChar(g, id, x, y, scale, face, frame, alpha, sx, sy) {
  const s = sprite(id, frame), d = CHARS[id] || {}, sc = scale * (d.child ? .78 : 1);
  g.save(); if (alpha != null) g.globalAlpha = alpha;
  g.translate(Math.round(x), Math.round(y)); if (face < 0) g.scale(-1, 1); if (sx) g.scale(sx, sy);
  g.drawImage(s, -s.width * sc / 2, -s.height * sc, s.width * sc, s.height * sc);
  g.restore();
}
function portrait(id) { // head crop for dialogue
  const k = 'por:' + id; if (spriteCache[k]) return spriteCache[k];
  const s = sprite(id, 0), c = document.createElement('canvas'); c.width = 96; c.height = 96; const g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(s, 0, -1, 16, 16, 0, 0, 96, 96); spriteCache[k] = c; return c;
}
// vulture (flying enemy), 2 frames
function vulture(frame) {
  const k = 'vul' + frame; if (spriteCache[k]) return spriteCache[k];
  const c = document.createElement('canvas'); c.width = 16; c.height = 12; const g = c.getContext('2d'), p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  p(5, 4, 7, 5, '#2b2f3d'); p(12, 3, 3, 3, '#c46a6a'); p(15, 4, 1, 1, '#d8b060'); p(13, 4, 1, 1, '#1a1410');
  if (frame) { p(1, 1, 5, 3, '#2b2f3d'); p(6, 1, 4, 3, '#434a5f'); } else { p(1, 7, 5, 3, '#2b2f3d'); p(6, 8, 4, 3, '#434a5f'); }
  p(3, 8, 3, 2, '#2b2f3d'); spriteCache[k] = c; return c;
}

// ---------- decor ----------
function drawDecor(g, d) {
  const x = d.x, y = d.y;
  if (d.k === 'tree') { tile(g, 'tiles', 126, x - 36, y - 72, 72); }
  else if (d.k === 'bush') tile(g, 'tiles', 124 + (d.v || 0), x - 18, y - 36);
  else if (d.k === 'cactus') tile(g, 'tiles', 127, x - 27, y - 54, 54);
  else if (d.k === 'fence') { for (let i = 0; i < (d.n || 3); i++) tile(g, 'tiles', 105, x + i * T, y - T); }
  else if (d.k === 'farmfence') { for (let i = 0; i < (d.n || 3); i++) tile(g, 'farm', 39 + (i % 2), x + i * T, y - T); }
  else if (d.k === 'corn') { for (let i = 0; i < (d.n || 4); i++) { tile(g, 'farm', 59, x + i * 30, y - 2 * T); tile(g, 'farm', 75, x + i * 30, y - T); } }
  else if (d.k === 'hay') { tile(g, 'farm', 9, x, y - T); tile(g, 'farm', 10, x + T, y - T); }
  else if (d.k === 'sunflower') { tile(g, 'farm', 20, x, y - 2 * T); tile(g, 'farm', 36, x, y - T); }
  else if (d.k === 'sign') tile(g, 'tiles', 86, x - 18, y - T);
  else if (d.k === 'arrow') tile(g, 'tiles', 85, x - 18, y - T);
  else if (d.k === 'flag') { tile(g, 'tiles', 111, x, y - 2 * T); tile(g, 'tiles', 131, x, y - T); }
  else if (d.k === 'rock') { g.fillStyle = PAL.grey; g.fillRect(x - 20, y - 18, 40, 18); g.fillStyle = PAL.slate2; g.fillRect(x - 20, y - 6, 40, 6); }
  else if (d.k === 'lamp') { g.fillStyle = PAL.ink; g.fillRect(x - 3, y - 110, 6, 110); g.fillRect(x - 12, y - 118, 24, 10); g.fillStyle = PAL.sun; g.fillRect(x - 8, y - 108, 16, 8); }
  else if (d.k === 'house') drawHouse(g, x, y, d.w || 180, d.h || 130, d.c);
  else if (d.k === 'arch') drawArches(g, x, y);
}
function drawHouse(g, x, y, w, h, c) {
  const wall = c || PAL.cream;
  g.fillStyle = PAL.ink; g.fillRect(x - 4, y - h - 4, w + 8, h + 4);
  g.fillStyle = wall; g.fillRect(x, y - h, w, h);
  g.fillStyle = PAL.dirt; for (let i = 0; i < 12; i++) g.fillRect(x + (i * 37) % (w - 10), y - h + 12 + (i * 23) % (h - 30), 8, 4);
  g.fillStyle = PAL.dirt2; g.fillRect(x - 10, y - h - 18, w + 20, 18); g.fillStyle = PAL.maroon; for (let i = 0; i < w + 20; i += 14) g.fillRect(x - 10 + i, y - h - 18, 7, 18);
  g.fillStyle = PAL.maroon; g.fillRect(x + w / 2 - 18, y - 60, 36, 60); g.fillStyle = PAL.ink; g.fillRect(x + w / 2 - 2, y - 32, 4, 4);
  g.fillStyle = PAL.teal; g.fillRect(x + 18, y - h + 30, 30, 26); g.fillRect(x + w - 48, y - h + 30, 30, 26);
  g.fillStyle = PAL.sky2; g.fillRect(x + 22, y - h + 34, 22, 18); g.fillRect(x + w - 44, y - h + 34, 22, 18);
}
function drawArches(g, x, y) {
  g.fillStyle = '#c9a07a'; g.fillRect(x, y - 150, 300, 150); g.fillStyle = PAL.dirt2; g.fillRect(x - 8, y - 164, 316, 16);
  g.fillStyle = PAL.ink; for (let i = 0; i < 3; i++) { g.fillRect(x + 24 + i * 96, y - 110, 60, 110); g.beginPath(); g.arc(x + 54 + i * 96, y - 110, 30, Math.PI, 0); g.fill(); }
}

// ---------- item sprites (12 x 12 pixel maps, outlined) ----------
const ITEM_COL = { g: '#5a627a', G: '#959ab1', b: '#8a5a3a', B: '#5a3a2a', k: '#2b2f3d', w: '#fbf1e3', y: '#f4ac66', o: '#d95763', h: '#e8c070', H: '#9f5a52', r: '#d95763', n: '#2eb082', p: '#fbf1e3', l: '#9f5a52', d: '#d8b060', s: '#434a5f', z: '#2b2a33' };
const ITEMS = {
  shotgun: ['............', '............', '............', 'gggggggggg..', 'GGGGGGGGGGgg', '..bbbbbggg..', '.bbbb.......', 'bbbb........', 'bbB.........', '............', '............', '............'],
  sniper: ['............', '....ss......', '...ssss.....', 'gggggggggggg', 'bbbbbbggg...', 'bbbb........', 'bbb.........', 'bB..........', '............', '............', '............', '............'],
  rifle: ['............', '............', '............', 'gggggggggggg', 'bbbbbbbb....', 'bbbb........', 'bbb.........', 'bB..........', '............', '............', '............', '............'],
  bomb: ['........y...', '.......o....', '......kk....', '...kkkkkk...', '..kkkkkkkk..', '.kkwkkkkkkk.', '.kkwkkkkkkk.', '.kkkkkkkkkk.', '.kkkkkkkkkk.', '..kkkkkkkk..', '...kkkkkk...', '............'],
  boomerang: ['............', '............', '............', '....hhhh....', '...hhhhhh...', '...HHHHHH...', 'hhhhhhhhhhhh', '.hhhhhhhhhh.', '............', '............', '............', '............'],
  hat: ['............', '............', '....zzzz....', '...zzzzzz...', '...dddddd...', 'zzzzzzzzzzzz', '.zzzzzzzzzz.', '............', '............', '............', '............', '............'],
  doc: ['.pppppppppp.', '.pllllllllp.', '.pppppppppp.', '.pllllllp.p.', '.pppppppppp.', '.pllllllllp.', '.pppppppppp.', '.plllllp..p.', '.pppppppppp.', '............', '............', '............'],
  flag: ['k...........', 'knnnnwwwrrr.', 'knnnnwwwrrr.', 'knnnnwdwrrr.', 'knnnnwwwrrr.', 'knnnnwwwrrr.', 'k...........', 'k...........', 'k...........', 'k...........', 'k...........', 'k...........'],
  book: ['............', '..HHHHHHHH..', '.HppppppppH.', '.HpllllllpH.', '.HppppppppH.', '.HplllllppH.', '.HppppppppH.', '.HHHHHHHHHH.', '............', '............', '............', '............'],
  machinegun: ['............', '..kk........', 'gggggggggggg', 'GGGGGGGGGGGG', 'gggggggggg..', '.bbbbk.k....', 'bbbb..kk....', 'bbb.........', 'bB..........', '............', '............', '............'],
  dynamite: ['.........y..', '........o...', '.......k....', '..rrrrrr....', '.rrrrrrrr...', '.rrrrrrrr...', '.rrrrrrrr...', '..rrrrrr....', '..rrrrrr....', '..rrrrrr....', '...rrrr.....', '............'],
  machete: ['..........GG', '.........GGG', '........GGG.', '.......GGG..', '......GGG...', '.....GGG....', '....GGG.....', '..bbG.......', '.bbb........', 'bbb.........', 'bb..........', '............'],
  medal: ['...rr..rr...', '...rr..rr...', '....rrrr....', '.....rr.....', '....dddd....', '...dddddd...', '...ddyydd...', '...dddddd...', '....dddd....', '............', '............', '............'],
};
const itemCache = {};
function itemSprite(type) {
  if (itemCache[type]) return itemCache[type];
  const m = ITEMS[type] || ITEMS.doc, c = document.createElement('canvas'); c.width = 14; c.height = 14; const g = c.getContext('2d');
  for (const pass of [0, 1]) for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const k = m[y][x]; if (k === '.') continue;
    if (pass === 0) { g.fillStyle = '#2b2f3d'; g.fillRect(x, y, 3, 3); } else { g.fillStyle = ITEM_COL[k]; g.fillRect(x + 1, y + 1, 1, 1); } }
  itemCache[type] = c; return c;
}
function drawItem(g, type, x, y, size) { const s = itemSprite(type), z = size || 42; g.drawImage(s, Math.round(x - z / 2), Math.round(y - z / 2), z, z); }
