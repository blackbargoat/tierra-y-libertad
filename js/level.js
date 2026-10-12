'use strict';
// =====================================================================
// LEVEL BUILDERS
//  explore = calm walk: people to talk to, notes to find, a gate at the end
//  battle  = hard arena: pits, saws, moving platforms, enemies, answer orbs
// A level is plain data: ground segments, one-way platforms, hazards, items.
// =====================================================================
function emptyLevel(theme, wTiles) {
  return { theme, w: wTiles * T, ground: [], plats: [], movers: [], pits: [], spikes: [], saws: [], pads: [], decor: [],
    npcs: [], notes: [], coins: [], hearts: [], guns: [], crates: [], chests: [], orbs: [], mobs: [], spawns: [], gate: null };
}

function buildExplore(ch) {
  const L = emptyLevel(ch.theme, 66), th = THEMES[ch.theme];
  L.ground.push([0, L.w]);
  // three stops along the road, one person at each, a note on a small platform nearby
  const stops = [620, 1260, 1900];
  ch.npcs.forEach((n, i) => L.npcs.push({ who: n.who, x: stops[i], lines: n.lines, talked: false, face: -1 }));
  ch.notes.forEach((n, i) => { const x = stops[i] - 250; L.plats.push([x - 54, GY - 108, 108]); L.notes.push({ x, y: GY - 150, note: n, got: false }); });
  for (let i = 0; i < 18; i++) L.coins.push({ x: 300 + i * 120, y: GY - 60 - (i % 3) * 30, got: false });
  L.gate = { x: L.w - 220 };
  L.npcs.push({ who: 'guardia', x: L.w - 300, lines: [], guard: true, face: -1 });
  // decor
  L.decor.push({ k: 'sign', x: 200, y: GY });
  let x = 120;
  while (x < L.w - 400) {
    const k = pick(th.deco); const near = stops.some(s => Math.abs(s - x) < 140);
    if (!near) L.decor.push({ k, x, y: GY, n: irand(2, 4), v: irand(0, 1) });
    x += k === 'house' ? 300 : irand(150, 260);
  }
  L.spawns = [[80, GY - 60], [140, GY - 60], [200, GY - 60]];
  return L;
}

function buildBattle(ch) {
  const B = ch.battle, wt = B.size, L = emptyLevel(B.theme, wt), th = THEMES[B.theme], c = Math.floor(wt / 2);
  // ground with gaps (never near the middle, where everyone spawns)
  const gaps = [];
  for (let gx = 9; gx < wt - 8; gx += irand(11, 15)) if (Math.abs(gx - c) > 8 && Math.random() < B.gaps) gaps.push([gx, irand(3, 5)]);
  let start = 0;
  for (const [gx, gw] of gaps) { L.ground.push([start * T, (gx - start) * T]); L.pits.push([gx * T, gw * T]); start = gx + gw; }
  L.ground.push([start * T, (wt - start) * T]);
  // moving platform over each wide pit
  for (const [px, pw] of L.pits) if (pw >= 4 * T || Math.random() < .5) L.movers.push({ x: px + 6, y: GY - 60, w: 108, ax: pw - 120, ay: 0, T: 2.6 + Math.random() });
  // tiered one-way platforms
  const tiers = [[GY - 108, .7], [GY - 216, .6], [GY - 324, .45], [GY - 432, .2]];
  for (let bx = 1; bx < wt - 4; bx += 8) for (const [y, prob] of tiers) if (Math.random() < prob) { const w = irand(3, 5) * T, x = (bx + irand(0, 3)) * T; L.plats.push([x, y, w]); }
  // spikes on some platform ends
  for (const p of L.plats) if (p[2] >= 4 * T && Math.random() < B.hazard * .5) L.spikes.push([Math.random() < .5 ? p[0] : p[0] + p[2] - T, p[1], T]);
  // answer orb spots: above platforms and above the ground
  for (const p of L.plats) L.orbs.push([p[0] + p[2] / 2, p[1] - 44]);
  for (let tx = 4; tx < wt - 3; tx += 7) if (onGround(L, tx * T) && Math.abs(tx - c) > 6) L.orbs.push([tx * T, GY - 50]);
  L.orbs = L.orbs.filter(([ox, oy]) => !(Math.abs(ox - c * T) < 200 && oy > GY - 150));
  // saws and vertical movers
  for (let i = 0; i < (B.saws || 0); i++) { const x = irand(4, wt - 14) * T; if (Math.random() < .5) L.saws.push({ x1: x, y1: GY - 270, x2: x + irand(6, 10) * T, y2: GY - 270, r: 20, T: 3 + Math.random() * 1.5, ph: Math.random() }); else L.saws.push({ cx: x, cy: GY - 300, rad: 100, r: 18, T: 3.2, ph: Math.random() }); }
  for (let i = 0; i < Math.max(0, (B.movers || 0) - L.movers.length); i++) { const x = irand(3, wt - 4) * T; L.movers.push({ x, y: GY - 80, w: 90, ax: 0, ay: -300, T: 4 + Math.random() }); }
  // launch pads, items, enemies
  const groundSpot = (avoid = 6) => { for (let k = 0; k < 40; k++) { const tx = irand(2, wt - 3); if (Math.abs(tx - c) > avoid && onGround(L, tx * T) && onGround(L, tx * T + T)) return tx * T; } return 2 * T; };
  for (let i = 0; i < (B.pads || 0); i++) L.pads.push({ x: groundSpot(4), y: GY, t: 0 });
  (B.guns || []).forEach(type => { const p = pick(L.plats.length ? L.plats : [[groundSpot(), GY, T]]); L.guns.push({ x: p[0] + 18, y: p[1] - 30, type, alive: true, t: 0 }); });
  for (let i = 0; i < (B.crates || 0); i++) L.crates.push({ x: groundSpot(), y: GY - 30, type: 'q', alive: true, t: 0 });
  for (let i = 0; i < (B.stars || 0); i++) { const p = pick(L.plats); L.crates.push({ x: p[0] + p[2] - 20, y: p[1] - 34, type: 'p', alive: true, t: 0 }); }
  for (let i = 0; i < (B.chests || 0); i++) L.chests.push({ x: groundSpot(), y: GY - 24, alive: true, t: 0 });
  for (let i = 0; i < 3; i++) { const p = pick(L.plats); L.hearts.push({ x: p[0] + 20, y: p[1] - 30, alive: true, t: 0 }); }
  for (let i = 0; i < (B.walkers || 0); i++) {
    const seg = pick(L.ground.filter(([gx, gw]) => gw > 5 * T && !(gx < c * T && gx + gw > c * T)) .concat(L.plats.filter(p => p[2] >= 4 * T).map(p => [p[0], p[2], p[1]])));
    if (!seg) continue; const y = seg[2] || GY; L.mobs.push({ t: 'w', min: seg[0], max: seg[0] + seg[1], y });
  }
  for (let i = 0; i < (B.flyers || 0); i++) L.mobs.push({ t: 'f', x: irand(2, wt - 2) * T, y: irand(180, 380), amp: 40, s: 2 + Math.random() });
  if (B.boss) L.mobs.push({ t: 'b', ...B.boss, min: 40, max: L.w - 40 });
  // decor on the ground (behind everything)
  for (let x = 100; x < L.w - 100; x += irand(200, 360)) if (onGround(L, x) && Math.abs(x - c * T) > 120) L.decor.push({ k: pick(th.deco.filter(k => k !== 'house')), x, y: GY, n: irand(2, 3), v: irand(0, 1) });
  L.spawns = [[c * T - 80, GY - 60], [c * T, GY - 60], [c * T + 80, GY - 60]];
  return L;
}
function onGround(L, x) { return L.ground.some(([gx, gw]) => x >= gx && x <= gx + gw); }
