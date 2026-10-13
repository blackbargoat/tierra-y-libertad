'use strict';
// =====================================================================
// BIG LEVELS: a tile grid built from hand-made 20 x 13 chunks, in 3 layers
//   sky (rows 0-12)  ·  surface (rows 13-25, floor at row 23)  ·  underground (rows 26-38)
// Legend:  # solid   = one-way platform   ^ spikes   S spring   I item spot   N person
//          D secret door   P spawn   H house   G gate   T torch   c coin
// =====================================================================
const CW = 20, CH = 13, ROWS = 39, FLOOR_ROW = 23, FLOOR_Y = FLOOR_ROW * T;
const CHUNKS = {
  // ---------- surface ----------
  flat: [
    '....................', '....................', '....................', '....................', '....................',
    '..........I.........', '.........===........', '....................', '...c..c........c....', '.........N..........',
    '####################', '####################', '####################'],
  house: [
    '....................', '....................', '....................', '....................', '......I.............',
    '.....======.........', '....................', '....................', '.c...........c......', '...H....D......N....',
    '####################', '####################', '####################'],
  hill: [
    '....................', '....................', '....................', '.........I..........', '....................',
    '........####........', '.......######.......', '......########......', '..c..##########..c..', '....############..N.',
    '####################', '####################', '####################'],
  tower: [
    '..........==........', '....................', '.......==...........', '....................', '...........==.......',
    '....................', '.......==...........', '....................', '...........==.......', '.........S......N...',
    '####################', '####################', '####################'],
  shaft: [
    '....................', '....................', '....................', '....................', '....................',
    '.....=====..........', '....................', '...............I....', '..c.............c...', '.....N..............',
    '#########..#########', '#########..#########', '#########..#########'],
  spikes: [
    '....................', '....................', '....................', '....................', '.........I..........',
    '........====........', '....................', '....==........==....', '....................', '....................',
    '#####^^^^^^^^^^#####', '####################', '####################'],
  gate: [
    '....................', '....................', '....................', '....................', '....................',
    '....................', '....................', '....................', '....................', '..........N....G....',
    '####################', '####################', '####################'],
  // ---------- underground ----------
  solid: Array(13).fill('####################'),
  cave: [
    '####################', '####################', '####################', '####################', '######...######.....',
    '...................T', '.....I..............', '.........==.........', '..c..........c......', '....................',
    '####...#######...###', '####################', '####################'],
  caveShaft: [
    '#########..#########', '#########..#########', '#########..#########', '#########..#########', '####.............###',
    'T...................', '...............I....', '......==............', '..c.............c...', '.........S..........',
    '####################', '####################', '####################'],
  caveEndL: [
    '####################', '####################', '####################', '####################', '#####...............',
    '####...............T', '####..I.............', '####=====...........', '####.........c......', '####................',
    '####################', '####################', '####################'],
  caveEndR: [
    '####################', '####################', '####################', '####################', '...............#####',
    'T..............#####', '.............I.#####', '..........=====#####', '......c........#####', '...............#####',
    '####################', '####################', '####################'],
  room: [
    '####################', '####################', '####################', '#####..........#####', '#####T........T#####',
    '#####..........#####', '#####.....I....#####', '#####...====...#####', '#####..........#####', '#####...D......#####',
    '####################', '####################', '####################'],
  // ---------- sky ----------
  air: Array(13).fill('....................'),
  skyLand: [
    '....................', '.........I..........', '........====........', '....................', '...==..........==...',
    '....................', '.......===..........', '....................', '...............===..', '..===...............',
    '....................', '.........====.......', '....................'],
  sky: [
    '....................', '....................', '...I................', '..====.......===....', '....................',
    '.........==.........', '....................', '...............I....', '.....====....====...', '....................',
    '.==..............==.', '....................', '....................'],
};

function newGrid(cols) { return { cols, rows: ROWS, t: new Uint8Array(cols * ROWS) }; }
// tile codes
const TL = { air: 0, solid: 1, plat: 2, spike: 3 };
function stamp(L, name, cx, layer) {
  const rows = CHUNKS[name], ox = cx * CW, oy = layer * CH;
  for (let r = 0; r < CH; r++) for (let c = 0; c < CW; c++) {
    const ch = rows[r][c], gx = ox + c, gy = oy + r, x = gx * T, y = gy * T, i = gy * L.grid.cols + gx;
    L.grid.t[i] = ch === '#' ? TL.solid : ch === '=' ? TL.plat : ch === '^' ? TL.spike : TL.air;
    if (ch === 'I') L.spots.push({ x: x + T / 2, y: y + T / 2, layer });
    else if (ch === 'N') L.npcSpots.push({ x: x + T / 2, y: y + T, layer, cx });
    else if (ch === 'S') L.pads.push({ x, y: y + T, t: 0 });
    else if (ch === 'D') L.doors.push({ x: x + T / 2, y: y + T, layer, cx });
    else if (ch === 'G') L.gate = { x, y: y + T };
    else if (ch === 'H') L.decor.push({ k: 'house', x: x - 40, y: y + T, w: 170, h: 130 });
    else if (ch === 'T') L.decor.push({ k: 'torch', x: x + T / 2, y: y + T });
    else if (ch === 'c') L.coins.push({ x: x + T / 2, y: y + T / 2, got: false });
  }
}
function baseLevel(theme, nCols) {
  return { theme, w: nCols * CW * T, h: ROWS * T, grid: newGrid(nCols * CW), spots: [], npcSpots: [], pads: [], doors: [], decor: [], coins: [],
    movers: [], saws: [], npcs: [], notes: [], letters: [], hearts: [], guns: [], crates: [], chests: [], orbs: [], mobs: [], spawns: [], gate: null, surfY: FLOOR_Y };
}
// which surface chunks get what underneath / above
function fillLayers(L, surf) {
  const n = surf.length;
  surf.forEach((s, i) => stamp(L, s, i, 1));
  // sky above towers (and their neighbors)
  const sky = Array(n).fill('air');
  surf.forEach((s, i) => { if (s === 'tower') { sky[i] = 'skyLand'; if (i > 0 && sky[i - 1] === 'air') sky[i - 1] = 'sky'; if (i < n - 1) sky[i + 1] = 'sky'; } });
  sky.forEach((s, i) => stamp(L, s, i, 0));
  // caves under shafts, spreading 1 chunk each side, with dead ends
  const und = Array(n).fill('solid');
  surf.forEach((s, i) => { if (s === 'shaft') { und[i] = 'caveShaft'; if (i > 0 && und[i - 1] === 'solid') und[i - 1] = 'cave'; if (i < n - 1 && und[i + 1] === 'solid') und[i + 1] = 'cave'; } });
  for (let i = 0; i < n; i++) if (und[i] !== 'solid') { if (i === 0 || und[i - 1] === 'solid') und[i] = und[i] === 'caveShaft' ? 'caveShaft' : 'caveEndL'; if (i === n - 1 || und[i + 1] === 'solid') und[i] = und[i] === 'caveShaft' ? und[i] : 'caveEndR'; }
  return { und, sky };
}
function placeSecretRoom(L, und) {
  const free = und.map((u, i) => u === 'solid' ? i : -1).filter(i => i >= 0);
  if (!free.length || !L.doors.length) return;
  const i = pick(free); und[i] = 'room'; stamp(L, 'room', i, 2);
  const a = L.doors[0], b = L.doors.find(d => d.layer === 2); if (a && b) { a.to = b; b.to = a; }
}
// floor runs (for enemies that walk): solid/platform tile with air above, at least `min` long
function floorRuns(L, min) {
  const g = L.grid, out = [];
  for (let r = 1; r < ROWS; r++) { let start = -1;
    for (let c = 0; c <= g.cols; c++) {
      const ok = c < g.cols && (g.t[r * g.cols + c] === TL.solid || g.t[r * g.cols + c] === TL.plat) && g.t[(r - 1) * g.cols + c] === TL.air && (r < 2 || g.t[(r - 2) * g.cols + c] === TL.air);
      if (ok && start < 0) start = c; if (!ok && start >= 0) { if (c - start >= min) out.push({ x0: start * T, x1: c * T, y: r * T, layer: Math.floor(r / CH) }); start = -1; }
    } }
  return out;
}

const WORDS = { 1: 'TIERRA', 2: 'CONSEJO', 3: 'AYALA', 4: 'HUERTA', 5: 'VILLA', 6: 'MORELOS', 7: 'TRAMPA', 8: 'LEGADO' };
const WORD_EN = { TIERRA: 'land', CONSEJO: 'council', AYALA: 'the Plan de Ayala', HUERTA: 'the dictator of 1913', VILLA: 'his ally from the north', MORELOS: "Zapata's home state", TRAMPA: 'trap', LEGADO: 'legacy' };

// ---------------- calm level: talk, explore up/down, find 3 objects + the hidden word ----------------
function buildExplore2(ch) {
  const n = 8, surf = Array(n).fill('flat');
  surf[0] = 'flat'; surf[7] = 'gate';
  const mids = shuf([1, 2, 3, 4, 5, 6]);
  surf[mids[0]] = 'tower'; surf[mids[1]] = 'shaft'; surf[mids[2]] = 'house'; surf[mids[3]] = 'hill';
  if (ch.id >= 4) surf[mids[4]] = 'tower';
  const L = baseLevel(ch.theme, n), { und } = fillLayers(L, surf);
  und.forEach((u, i) => stamp(L, u, i, 2));
  placeSecretRoom(L, und);
  // people: 3 teaching people on the surface + the guard by the gate
  const spots = shuf(L.npcSpots.filter(s => s.cx > 0 && s.cx < n - 1)).sort((a, b) => a.x - b.x);
  const used = [spots[0], spots[Math.floor(spots.length / 2)], spots[spots.length - 1]].filter(Boolean);
  ch.npcs.forEach((p, i) => { const s = used[i] || spots[i]; if (s) L.npcs.push({ who: p.who, x: s.x, y: s.y, lines: p.lines, talked: false, face: -1 }); });
  const gs = L.npcSpots.find(s => s.cx === n - 1); if (gs) L.npcs.push({ who: 'guardia', x: gs.x, y: gs.y, lines: [], guard: true, face: -1 });
  // 3 historical objects: one high in the sky, one deep underground, one behind the secret door
  const sky = L.spots.filter(s => s.layer === 0).sort((a, b) => a.y - b.y), deep = L.spots.filter(s => s.layer === 2), room = deep.filter(s => und[Math.floor(s.x / (CW * T))] === 'room');
  const caveSpots = deep.filter(s => !room.includes(s)).sort((a, b) => b.x - a.x);
  const objSpots = [sky[0], caveSpots[0], room[0]].map((s, i) => s || pick(L.spots));
  const where = ['en el cielo', 'bajo tierra', 'detrás de una puerta secreta'];
  ch.notes.forEach((note, i) => { const s = objSpots[i]; L.notes.push({ x: s.x, y: s.y, note, got: false, icon: ch.icons ? ch.icons[i] : ['doc', 'hat', 'flag'][i], where: where[i] }); s.used = true; });
  // the hidden word: one letter per remaining spot, spread over all layers
  const word = WORDS[ch.id] || 'ZAPATA', free = shuf(L.spots.filter(s => !s.used));
  [...word].forEach((ltr, i) => { const s = free[i]; if (s) { L.letters.push({ x: s.x, y: s.y, ch: ltr, i, got: false }); s.used = true; } });
  L.word = word;
  L.spawns = [[60, FLOOR_Y - 56], [110, FLOOR_Y - 56], [160, FLOOR_Y - 56]];
  L.decor.push({ k: 'sign', x: 220, y: FLOOR_Y });
  return L;
}

// ---------------- battle: answers hidden up high, down low, and far away ----------------
function buildBattle2(ch) {
  const B = ch.battle, n = Math.max(5, Math.min(7, Math.round(B.size / 14))), mid = Math.floor(n / 2);
  const pool = ['tower', 'shaft', 'hill', 'flat', 'house'].concat(B.hazard > .3 ? ['spikes', 'spikes'] : []).concat(B.hazard > .6 ? ['spikes'] : []);
  const surf = Array.from({ length: n }, () => pick(pool)); surf[mid] = 'flat';
  if (!surf.includes('tower')) surf[mid - 1] = 'tower'; if (!surf.includes('shaft')) surf[mid + 1] = 'shaft';
  const L = baseLevel(B.theme, n), { und } = fillLayers(L, surf);
  und.forEach((u, i) => stamp(L, u, i, 2));
  L.doors.length = 0; L.npcSpots.length = 0;
  const c = mid * CW * T + CW * T / 2;
  L.spawns = [[c - 70, FLOOR_Y - 56], [c, FLOOR_Y - 56], [c + 70, FLOOR_Y - 56]];
  // answer spots: the item spots, never right next to the spawn
  L.orbSpots = L.spots.filter(s => Math.hypot(s.x - c, s.y - FLOOR_Y) > 300);
  const items = shuf(L.spots.slice());
  (B.guns || []).forEach(type => { const s = items.pop(); if (s) L.guns.push({ x: s.x, y: s.y, type, alive: true, t: 0 }); });
  for (let i = 0; i < (B.crates || 0); i++) { const s = items.pop(); if (s) L.crates.push({ x: s.x, y: s.y, type: 'q', alive: true, t: 0 }); }
  for (let i = 0; i < (B.stars || 0); i++) { const s = items.pop(); if (s) L.crates.push({ x: s.x, y: s.y, type: 'p', alive: true, t: 0 }); }
  for (let i = 0; i < (B.chests || 0); i++) { const s = items.pop(); if (s) L.chests.push({ x: s.x, y: s.y + 6, alive: true, t: 0 }); }
  for (let i = 0; i < 3; i++) { const s = items.pop(); if (s) L.hearts.push({ x: s.x, y: s.y, alive: true, t: 0 }); }
  // moving saws in the air on harder chapters
  for (let i = 0; i < (B.saws || 0); i++) { const cx = irand(0, n - 1); if (cx === mid) continue; const x = cx * CW * T + 4 * T; L.saws.push({ x1: x, y1: FLOOR_Y - 5 * T, x2: x + 11 * T, y2: FLOOR_Y - 5 * T, r: 20, T: 3 + Math.random() * 1.5, ph: Math.random() }); }
  // enemies on floors (not near the spawn), birds in the sky
  const runs = floorRuns(L, 5).filter(r => !(r.x0 < c + 200 && r.x1 > c - 200 && r.layer === 1));
  for (let i = 0; i < (B.walkers || 0) + 1; i++) { const r = pick(runs); if (r) L.mobs.push({ t: 'w', min: r.x0, max: r.x1, y: r.y }); }
  for (let i = 0; i < (B.flyers || 0); i++) L.mobs.push({ t: 'f', x: irand(1, n - 1) * CW * T, y: irand(4, 10) * T, amp: 40, s: 2 + Math.random() });
  if (B.boss) L.mobs.push({ t: 'b', ...B.boss, min: 40, max: L.w - 40, flyY: FLOOR_Y - 330 });
  // allies: the Liberating Army of the South fights with you from chapter 3 on
  L.allies = ch.id >= 3 ? Math.min(4, 1 + Math.floor(ch.id / 2)) : 0;
  return L;
}
// grid helpers
function tileAt(L, x, y) { const c = Math.floor(x / T), r = Math.floor(y / T); if (c < 0 || c >= L.grid.cols) return TL.solid; if (r < 0) return TL.air; if (r >= ROWS) return TL.solid; return L.grid.t[r * L.grid.cols + c]; }
