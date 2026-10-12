'use strict';
// Conjugation engine: presente, pretérito, imperfecto, presente perfecto, pluscuamperfecto
const CVERBS = [['luchar', 'to fight'], ['tomar', 'to take'], ['quitar', 'to take away'], ['planear', 'to plan'], ['trabajar', 'to work'],
  ['ganar', 'to win'], ['nacer', 'to be born'], ['romper', 'to break'], ['devolver', 'to give back'], ['vivir', 'to live'],
  ['repartir', 'to share out'], ['morir', 'to die'], ['ser', 'to be'], ['tener', 'to have']];
const PERS = ['yo', 'tú', 'él (Zapata)', 'nosotros', 'ellos'];
const TENSES = {
  pres: { n: 'presente', hint: 'now' },
  pret: { n: 'pretérito', hint: 'finished, one time' },
  imp:  { n: 'imperfecto', hint: 'was ___ing / used to' },
  pp:   { n: 'presente perfecto', hint: 'has / have ___ed' },
  plu:  { n: 'pluscuamperfecto', hint: 'had ___ed' },
};
const RULES = {
  pres: '-ar: o, as, a, amos, an.  -er: o, es, e, emos, en.  -ir: o, es, e, imos, en',
  pret: '-ar: é, aste, ó, amos, aron.  -er / -ir: í, iste, ió, imos, ieron',
  imp:  '-ar: aba, abas, aba, ábamos, aban.  -er / -ir: ía, ías, ía, íamos, ían',
  pp:   'he, has, ha, hemos, han + -ado / -ido',
  plu:  'había, habías, había, habíamos, habían + -ado / -ido',
};
const IRR = {
  ser: { pres: ['soy', 'eres', 'es', 'somos', 'son'], pret: ['fui', 'fuiste', 'fue', 'fuimos', 'fueron'], imp: ['era', 'eras', 'era', 'éramos', 'eran'] },
  tener: { pres: ['tengo', 'tienes', 'tiene', 'tenemos', 'tienen'], pret: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvieron'] },
  devolver: { pres: ['devuelvo', 'devuelves', 'devuelve', 'devolvemos', 'devuelven'] },
  nacer: { pres: ['nazco', 'naces', 'nace', 'nacemos', 'nacen'] },
  morir: { pres: ['muero', 'mueres', 'muere', 'morimos', 'mueren'], pret: ['morí', 'moriste', 'murió', 'morimos', 'murieron'] },
};
const IRRPART = { romper: 'roto', devolver: 'devuelto', morir: 'muerto' };
const HABER = { pp: ['he', 'has', 'ha', 'hemos', 'han'], plu: ['había', 'habías', 'había', 'habíamos', 'habían'] };
const participle = v => IRRPART[v] || v.slice(0, -2) + (v.endsWith('ar') ? 'ado' : 'ido');
function conj(v, t) {
  if (t === 'pp' || t === 'plu') return HABER[t].map(h => h + ' ' + participle(v));
  if (IRR[v] && IRR[v][t]) return IRR[v][t];
  const st = v.slice(0, -2), e = v.slice(-2);
  if (t === 'pres') return e === 'ar' ? [st + 'o', st + 'as', st + 'a', st + 'amos', st + 'an'] : e === 'er' ? [st + 'o', st + 'es', st + 'e', st + 'emos', st + 'en'] : [st + 'o', st + 'es', st + 'e', st + 'imos', st + 'en'];
  if (t === 'pret') return e === 'ar' ? [st + 'é', st + 'aste', st + 'ó', st + 'amos', st + 'aron'] : [st + 'í', st + 'iste', st + 'ió', st + 'imos', st + 'ieron'];
  return e === 'ar' ? [st + 'aba', st + 'abas', st + 'aba', st + 'ábamos', st + 'aban'] : [st + 'ía', st + 'ías', st + 'ía', st + 'íamos', st + 'ían'];
}
// "luchábamos" -> "a form of luchar (to fight)"
function findVerb(w) {
  if (['he', 'has', 'ha', 'hemos', 'han', 'había', 'habías', 'habíamos', 'habían'].includes(w)) return 'a form of haber (has / had), used before -ado / -ido';
  for (const [v, m] of CVERBS) for (const t in TENSES) if (conj(v, t).some(f => f.split(' ').includes(w))) return `a form of ${v} (${m})`;
  return null;
}
function genConj(tenses) {
  tenses = tenses || Object.keys(TENSES);
  const [v, mean] = pick(CVERBS), t = pick(tenses), pi = Math.random() * 5 | 0, forms = conj(v, t), right = forms[pi], Tn = TENSES[t];
  const cands = [...forms.filter(f => f !== right), ...Object.keys(TENSES).filter(x => x !== t).map(x => conj(v, x)[pi])].filter(f => f !== right);
  const wrong = shuf([...new Set(cands)]).slice(0, 3);
  const ex = `${Tn.n} = ${Tn.hint}.<div class="small">Rule: ${RULES[t]}</div><div class="small">${forms.map((f, i) => `${PERS[i]}: ${i === pi ? '<b>' + f + '</b>' : f}`).join(' &middot; ')}</div>`;
  return { v, mean, t, pi, right, wrong, ex, q: `${v} (${mean}) &rarr; ${PERS[pi]}, ${Tn.n}`, en: `Conjugate ${v} for ${PERS[pi]} in the ${Tn.n} (${Tn.hint}).` };
}
// conjugation as a normal multiple-choice question object
function conjQ(tenses) {
  const g = genConj(tenses);
  return { q: `Conjuga: ${g.v} (${g.mean}), ${PERS[g.pi]}, ${TENSES[g.t].n}`, en: g.en, o: [g.right, ...g.wrong], ex: g.ex, v: [[g.right, g.v, TENSES[g.t].n, TENSES[g.t].hint]], conj: true };
}
