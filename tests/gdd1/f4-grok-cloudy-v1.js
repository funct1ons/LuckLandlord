'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dest = path.join(__dirname, 'f4-grok-cloudy-v1.json');
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);
const root = path.join(__dirname, '../..');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
}
const F = ctx.GDD1;
const eq = (a, b, msg) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw Error((msg || 'eq') + ' expected ' + JSON.stringify(b) + ' actual ' + JSON.stringify(a));
};

const extra = (F.fullSymbols.cloudy_negative.effects || []).some(e => e.phase === 'age-extra');
eq(extra, false, 'no age-extra self effect');
eq(F.fullSymbols.cloudy_negative.mechanics.age, { threshold: 3, to: 'blank_facet' }, 'natural age contract');

function board() {
  const s = F.fullNewRun('CLOUDY-V1');
  s.pool = [];
  s.nextUid = 1;
  const b = Array(20).fill(null);
  const x = F.instance(s, 'cloudy_negative');
  s.pool.push(x);
  b[0] = x;
  return { s, b };
}

const spins = [];
{
  const { s, b } = board();
  for (let i = 0; i < 3; i++) {
    const last = F.sliceResolve(s, b);
    spins.push({
      i: i + 1,
      type: s.pool[0].type,
      age: s.pool[0].counters.age,
      epoch: s.pool[0].epoch,
      total: last.total
    });
  }
}
eq(spins[0], { i: 1, type: 'cloudy_negative', age: 1, epoch: 0, total: 1 }, 'spin1');
eq(spins[1], { i: 2, type: 'cloudy_negative', age: 2, epoch: 0, total: 1 }, 'spin2');
eq(spins[2].type, 'blank_facet', 'spin3 type');
eq(spins[2].epoch, 1, 'spin3 epoch');
eq(spins[2].total, 3, 'converted blank base 3, no appearance +2');

const preset = (() => {
  const s = F.fullNewRun('CLOUDY-PRESET');
  s.pool = [];
  s.nextUid = 1;
  const b = Array(20).fill(null);
  const x = F.instance(s, 'cloudy_negative');
  x.counters.age = 2;
  s.pool.push(x);
  b[0] = x;
  const last = F.sliceResolve(s, b);
  return { type: s.pool[0].type, total: last.total, add: last.log.some(e => e.action === 'add') };
})();
eq(preset, { type: 'blank_facet', total: 3, add: false }, 'age2 preset');

const mist = (() => {
  const s = F.fullNewRun('MIST');
  s.pool = [];
  s.nextUid = 1;
  const b = Array(20).fill(null);
  const x = F.instance(s, 'mist_pouch');
  s.pool.push(x);
  b[0] = x;
  const ages = [];
  const types = [];
  for (let i = 0; i < 3; i++) {
    F.sliceResolve(s, b);
    ages.push(s.pool[0].counters.age);
    types.push(s.pool[0].type);
  }
  return { ages, types };
})();
eq(mist.types[2], 'dew_lantern', 'mist still 3rd appearance');
eq(mist.ages[0], 1, 'mist spin1');

const resolverSrc = fs.readFileSync(path.join(root, 'js/gdd1/resolver.js'), 'utf8');
if (/cloudy_negative/.test(resolverSrc)) throw Error('resolver names cloudy');

const result = {
  scope: 'GDD 5.G/5.I.1 cloudy_negative natural age only; third appearance converts; no appearance replay',
  extraSelfAgeRemoved: true,
  spins,
  preset,
  mist,
  ok: true
};
fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-cloudy-v1.json', spins, ok: true }, null, 2));
