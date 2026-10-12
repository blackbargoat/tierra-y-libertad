'use strict';
// ---------- constants ----------
const W = 1280, H = 720, FPS = 60, T = 36, GY = 648;   // T = tile size, GY = ground top
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.random() * a.length | 0];
function shuf(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Colors taken from the Kenney tiles so the UI matches the levels
const PAL = {
  ink: '#2b2f3d', slate: '#434a5f', slate2: '#5a627a', grey: '#959ab1', cream: '#f4cca1', paper: '#fbf1e3',
  sand: '#f4ac66', dirt: '#cb815e', dirt2: '#9f5a52', maroon: '#6f3e43', green: '#2eb082', lime: '#36e377',
  mint: '#7ff0a5', teal: '#345551', sky: '#dff6f5', sky2: '#c2e3e8', sun: '#fbc97b', red: '#d95763', blue: '#5b6ee1',
};
const ANS = [PAL.red, PAL.blue, PAL.green, PAL.sand];
const LET = ['A', 'B', 'C', 'D'];

// ---------- save ----------
const Save = {
  d: (() => { try { return JSON.parse(localStorage.zz3 || '{}'); } catch (e) { return {}; } })(),
  get(k, v) { return k in this.d ? this.d[k] : v; },
  set(k, v) { this.d[k] = v; try { localStorage.zz3 = JSON.stringify(this.d); } catch (e) {} },
};

// ---------- click a word to translate it ----------
const GLOSS2 = {
  pobres: 'poor', nuestra: 'our', nuestras: 'our', protege: 'protects', grande: 'big / grown up', sea: 'I am (sea grande = I grow up)',
  recuperar: 'to get back', 'líder': 'leader', defender: 'to defend', confiscadas: 'confiscated (taken)', basta: 'enough',
  ayudo: 'I help', ganaron: 'they won', 'llegó': 'arrived', paciencia: 'patience', rompo: 'I break', usted: 'you (formal)',
  'pedía': 'asked for', mando: 'I command', nuevo: 'new', aliados: 'allies', unieron: 'joined together', 'perdió': 'lost',
  pelear: 'to fight', jefe: 'boss', juntos: 'together', aprobaron: 'approved', entraron: 'they entered', 'regresó': 'returned',
  gobierno: 'government', repartir: 'to share out', escuelas: 'schools', cooperativas: 'cooperatives (groups that work together)',
  'niños': 'children', estudiar: 'to study', 'persíganlo': 'chase him', 'años': 'years', atrapar: 'to catch', prometer: 'to promise',
  trampa: 'trap', bienvenido: 'welcome', gracias: 'thank you', 'murió': 'died', ideas: 'ideas', inspiraron: 'inspired',
  dice: 'says', 'símbolo': 'symbol', pueblos: 'peoples / towns', hoy: 'today', 'día': 'day', 'nació': 'was born', familia: 'family',
  trabajamos: 'we work', ahora: 'now', 'mía': 'mine', 'mías': 'mine', presidente: 'president', cuando: 'when', voy: 'I am going',
  hombre: 'man', 'quería': 'wanted', necesitamos: 'we need', 'eligió': 'chose / elected', trabajo: 'job / work', empieza: 'begins',
  vamos: "let's go / we're going", devuelva: 'give back (command)', ya: 'now / already', este: 'this', nuestro: 'our',
  'tomó': 'took', poder: 'power', otro: 'another', 'él': 'him / he', desde: 'from', 'también': 'also', lucho: 'I fight',
  ahora: 'now', 'unirse': 'to join', 'pierde': 'loses', empezaron: 'they started', ellos: 'them', 'aquí': 'here',
  'están': 'are', armas: 'weapons', municiones: 'ammunition', 'fue': 'was', asesinado: 'killed', tiros: 'gunshots', ideas: 'ideas',
  propiedad: 'ownership / property', 'indígenas': 'Indigenous', memoria: 'memory', vive: 'lives', bandera: 'flag', movimientos: 'movements',
  recuerda: 'remembers', gente: 'people', 'reunión': 'meeting', 'hubo': 'there was', capital: 'capital city', persiguen: 'chase',
  soldados: 'soldiers', llaman: 'call', constitucionalistas: "constitutionalists (Carranza's army)", trabajar: 'to work', entre: 'among',
  todos: 'everyone', aprenden: 'learn', cuidado: 'careful', 'llama': 'is called', 'está': 'is', 'quiere': 'wants', decir: 'to say',
  quitadas: 'taken away', 'azúcar': 'sugar', grandes: 'big', haciendas: 'big ranches', despojo: 'taking land away',
  naciste: 'you were born', somos: 'we are', 'después': 'later / after', 'tiempo': 'time', 'propia': 'own', libres: 'free',
  'por eso': 'that is why', planeó: 'planned', hizo: 'did / made', 'emboscada': 'ambush', 'quién': 'who', 'cuál': 'which', 'qué': 'what',
};
const norm = w => w.toLowerCase().replace(/^[¿¡"'(]+|[?!.,;:"')…]+$/g, '');
function wrapWords(text, hl) {
  hl = hl || new Set();
  return String(text).split(/(\s+)/).map(t => {
    if (!/[a-záéíóúñü]/i.test(t)) return t;
    const n = norm(t);
    return `<span class="w${hl.has(n) ? ' hl' : ''}" data-w="${n.replace(/"/g, '')}">${t}</span>`;
  }).join('');
}
const tipCache = {};
function lookupWord(w) {
  if (typeof GLOSS !== 'undefined' && GLOSS[w]) return GLOSS[w];
  if (GLOSS2[w]) return GLOSS2[w];
  if (/^\d+$/.test(w)) return 'the number ' + w;
  if (typeof findVerb === 'function') { const v = findVerb(w); if (v) return v; }
  return tipCache[w] || null;
}
document.addEventListener('click', async e => {
  const tip = $('tip'); const t = e.target.closest && e.target.closest('.w');
  if (!t) { tip.style.display = 'none'; return; }
  const w = t.dataset.w;
  tip.style.left = Math.min(e.clientX + 10, innerWidth - 300) + 'px'; tip.style.top = (e.clientY + 18) + 'px'; tip.style.display = 'block';
  let tr = lookupWord(w);
  if (!tr) {
    tip.innerHTML = `<b>${w}</b> = ...`;
    try { const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(w) + '&langpair=es|en'); const j = await r.json(); tr = tipCache[w] = j.responseData.translatedText; }
    catch (_) { tr = '(no internet)'; }
  }
  tip.innerHTML = `<b>${w}</b> = ${tr}`;
});
