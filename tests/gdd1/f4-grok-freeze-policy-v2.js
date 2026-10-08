'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const freezeOut = path.join(__dirname, 'f4-grok-freeze-policy-v2.json');
const FROZEN_GDD = 'e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07';
const FROZEN_FREEZE_V4 = 'cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953';
const FROZEN_AGG = 'af08f789b4b453e45a588f247a70a623f6c15ca62928f3995c2b65d23c5581a2';
const FROZEN_RESOLVER = 'e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b';
const FROZEN_EFFECTS = 'f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55';
const digest = rel => {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};
const mode = process.argv[2] || '--create';

function verifyV4() {
  const freeze = JSON.parse(fs.readFileSync(path.join(root, 'tests/gdd1/f4-grok-freeze-v4.json'), 'utf8'));
  const self = digest('tests/gdd1/f4-grok-freeze-v4.json');
  if (self.sha256 !== FROZEN_FREEZE_V4) throw Error('freeze-v4 mutated ' + self.sha256);
  if (freeze.entryCount !== 436 || freeze.entries.length !== 436) throw Error('freeze-v4 count drifted');
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error('freeze-v4 entry drifted ' + e.path);
  }
  return { freezeV4: self, entries: freeze.entries.length };
}

function verifyAgg() {
  const freeze = JSON.parse(fs.readFileSync(path.join(root, 'tests/gdd1/f4-grok-agg-freeze-v1.json'), 'utf8'));
  const self = digest('tests/gdd1/f4-grok-agg-freeze-v1.json');
  if (self.sha256 !== FROZEN_AGG) throw Error('agg-freeze mutated ' + self.sha256);
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error('agg-freeze entry drifted ' + e.path);
  }
  return { aggFreeze: self, entries: freeze.entries.length };
}

function collect() {
  const names = fs.readdirSync(__dirname).filter(n =>
    (n.startsWith('full-sim-policy-v2') ||
      n.startsWith('full-sim-') && n.includes('policy-v2') ||
      n.startsWith('f4-grok-audit-policy-v2') ||
      n === 'f4-grok-freeze-policy-v2.js') &&
    n !== 'f4-grok-freeze-policy-v2.json'
  );
  const docs = ['docs/GDD1_FULL_SIM_POLICY_V2.md', 'docs/GDD1_FULL_SIM_POLICY_V2_AUDIT.md'];
  const rows = names.map(n => 'tests/gdd1/' + n).concat(docs.filter(p => fs.existsSync(path.join(root, p))));
  return [...new Set(rows)].sort();
}

function verify() {
  if (!fs.existsSync(freezeOut)) throw Error('missing policy-v2 freeze');
  const freeze = JSON.parse(fs.readFileSync(freezeOut, 'utf8'));
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error('policy-v2 freeze mismatch ' + e.path);
  }
  const v4 = verifyV4();
  const agg = verifyAgg();
  console.log(JSON.stringify({
    mode: 'verify',
    pass: true,
    entries: freeze.entries.length,
    freeze: digest('tests/gdd1/f4-grok-freeze-policy-v2.json'),
    freezeV4: v4.freezeV4,
    aggFreeze: agg.aggFreeze
  }, null, 2));
}

function create() {
  if (fs.existsSync(freezeOut)) throw Error('Refuse existing f4-grok-freeze-policy-v2.json');
  const gdd = digest('docs/GAME_DESIGN_V1.md');
  if (gdd.sha256 !== FROZEN_GDD) throw Error('GDD drifted');
  const resolver = digest('js/gdd1/resolver.js');
  const effects = digest('js/gdd1/full-effects.js');
  if (resolver.sha256 !== FROZEN_RESOLVER) throw Error('resolver drifted');
  if (effects.sha256 !== FROZEN_EFFECTS) throw Error('full-effects drifted');
  const v4 = verifyV4();
  const agg = verifyAgg();
  const required = [
    'docs/GDD1_FULL_SIM_POLICY_V2.md',
    'docs/GDD1_FULL_SIM_POLICY_V2_AUDIT.md',
    'tests/gdd1/full-sim-policy-v2-statistics.json',
    'tests/gdd1/full-sim-policy-v2-gates.json',
    'tests/gdd1/full-sim-policy-v2-integrity.json',
    'tests/gdd1/full-sim-engine-policy-v2.js',
    'tests/gdd1/full-sim-run-policy-v2.js'
  ];
  for (const p of required) if (!fs.existsSync(path.join(root, p))) throw Error('missing ' + p);
  const entries = collect().map(p => ({ ...digest(p), vsV4: 'NEW_POLICY_V2_EVIDENCE' }));
  const freeze = {
    status: 'POST-POLICY-V2 SNAPSHOT / DOES NOT SUPERSEDE freeze-v4 OR agg-freeze / NOT FORMAL NORMAL ACCEPTANCE',
    prefix: 'f4-grok-freeze-policy-v2',
    warning: 'Does not overwrite freeze-v4, agg-freeze, v1 jsonl, or production. Economy NOT APPROVED. Phase B needs explicit auth. Human play pending.',
    gddSha256: FROZEN_GDD,
    freezeV4: v4.freezeV4,
    aggFreeze: agg.aggFreeze,
    production: { resolver, effects },
    report: digest('docs/GDD1_FULL_SIM_POLICY_V2.md'),
    audit: digest('docs/GDD1_FULL_SIM_POLICY_V2_AUDIT.md'),
    selfExcluded: true,
    entryCount: entries.length,
    entries
  };
  fs.writeFileSync(freezeOut, JSON.stringify(freeze, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({
    mode: 'create',
    freeze: digest('tests/gdd1/f4-grok-freeze-policy-v2.json'),
    freezeV4: v4.freezeV4,
    aggFreeze: agg.aggFreeze,
    entryCount: entries.length,
    audit: freeze.audit
  }, null, 2));
}

if (mode === '--verify') verify();
else if (mode === '--create') create();
else throw Error('Use --create or --verify');
