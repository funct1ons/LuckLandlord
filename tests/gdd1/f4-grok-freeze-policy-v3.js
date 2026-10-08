'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const freezeOut = path.join(__dirname, 'f4-grok-freeze-policy-v3.json');
const FROZEN_GDD = 'e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07';
const FROZEN_FREEZE_V4 = 'cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953';
const FROZEN_AGG = 'af08f789b4b453e45a588f247a70a623f6c15ca62928f3995c2b65d23c5581a2';
const FROZEN_V2 = '6b2df68cb12937c5daeb99dd081e3330bd22cc7b209e6ebc83c62717652d2460';
const FROZEN_RESOLVER = 'e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b';
const FROZEN_EFFECTS = 'f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55';
const digest = rel => {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};
const mode = process.argv[2] || '--create';
function verifyNamed(rel, sha, countKey) {
  const freeze = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  const self = digest(rel);
  if (self.sha256 !== sha) throw Error(rel + ' mutated ' + self.sha256);
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error(rel + ' entry drifted ' + e.path);
  }
  return { self, entries: freeze.entries.length, countKey };
}
function collect() {
  const names = fs.readdirSync(__dirname).filter(n =>
    (n.startsWith('full-sim-policy-v3') ||
      n.startsWith('full-sim-') && n.includes('policy-v3') ||
      n.startsWith('f4-grok-audit-policy-v3') ||
      n === 'f4-grok-freeze-policy-v3.js') &&
    n !== 'f4-grok-freeze-policy-v3.json'
  );
  const docs = ['docs/GDD1_FULL_SIM_POLICY_V3_PROBE.md', 'docs/GDD1_FULL_SIM_POLICY_V3_PROBE_AUDIT.md'];
  return [...new Set(names.map(n => 'tests/gdd1/' + n).concat(docs.filter(p => fs.existsSync(path.join(root, p)))))].sort();
}
function verify() {
  if (!fs.existsSync(freezeOut)) throw Error('missing policy-v3 freeze');
  const freeze = JSON.parse(fs.readFileSync(freezeOut, 'utf8'));
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error('policy-v3 freeze mismatch ' + e.path);
  }
  const v4 = verifyNamed('tests/gdd1/f4-grok-freeze-v4.json', FROZEN_FREEZE_V4);
  const agg = verifyNamed('tests/gdd1/f4-grok-agg-freeze-v1.json', FROZEN_AGG);
  const v2 = verifyNamed('tests/gdd1/f4-grok-freeze-policy-v2.json', FROZEN_V2);
  console.log(JSON.stringify({
    mode: 'verify', pass: true, entries: freeze.entries.length,
    freeze: digest('tests/gdd1/f4-grok-freeze-policy-v3.json'),
    freezeV4: v4.self, aggFreeze: agg.self, freezePolicyV2: v2.self
  }, null, 2));
}
function create() {
  if (fs.existsSync(freezeOut)) throw Error('Refuse existing f4-grok-freeze-policy-v3.json');
  const gdd = digest('docs/GAME_DESIGN_V1.md');
  if (gdd.sha256 !== FROZEN_GDD) throw Error('GDD drifted');
  const resolver = digest('js/gdd1/resolver.js');
  const effects = digest('js/gdd1/full-effects.js');
  if (resolver.sha256 !== FROZEN_RESOLVER) throw Error('resolver drifted');
  if (effects.sha256 !== FROZEN_EFFECTS) throw Error('full-effects drifted');
  const v4 = verifyNamed('tests/gdd1/f4-grok-freeze-v4.json', FROZEN_FREEZE_V4);
  const agg = verifyNamed('tests/gdd1/f4-grok-agg-freeze-v1.json', FROZEN_AGG);
  const v2 = verifyNamed('tests/gdd1/f4-grok-freeze-policy-v2.json', FROZEN_V2);
  const required = [
    'docs/GDD1_FULL_SIM_POLICY_V3_PROBE.md',
    'docs/GDD1_FULL_SIM_POLICY_V3_PROBE_AUDIT.md',
    'tests/gdd1/full-sim-policy-v3-probe-summary.json',
    'tests/gdd1/full-sim-engine-policy-v3.js',
    'tests/gdd1/full-sim-run-policy-v3.js'
  ];
  for (const p of required) if (!fs.existsSync(path.join(root, p))) throw Error('missing ' + p);
  const entries = collect().map(p => ({ ...digest(p), vsPrior: 'NEW_POLICY_V3_EVIDENCE' }));
  const freeze = {
    status: 'POST-POLICY-V3-PROBE SNAPSHOT / DOES NOT SUPERSEDE freeze-v4, agg-freeze, or freeze-policy-v2 / NOT FORMAL NORMAL ACCEPTANCE',
    prefix: 'f4-grok-freeze-policy-v3',
    warning: 'Does not overwrite prior freezes, v1/v2 jsonl, or production. Economy NOT APPROVED. Phase B needs explicit auth.',
    gddSha256: FROZEN_GDD,
    freezeV4: v4.self,
    aggFreeze: agg.self,
    freezePolicyV2: v2.self,
    production: { resolver, effects },
    report: digest('docs/GDD1_FULL_SIM_POLICY_V3_PROBE.md'),
    audit: digest('docs/GDD1_FULL_SIM_POLICY_V3_PROBE_AUDIT.md'),
    selfExcluded: true,
    entryCount: entries.length,
    entries
  };
  fs.writeFileSync(freezeOut, JSON.stringify(freeze, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({
    mode: 'create',
    freeze: digest('tests/gdd1/f4-grok-freeze-policy-v3.json'),
    freezeV4: v4.self,
    aggFreeze: agg.self,
    freezePolicyV2: v2.self,
    entryCount: entries.length,
    audit: freeze.audit
  }, null, 2));
}
if (mode === '--verify') verify();
else if (mode === '--create') create();
else throw Error('Use --create or --verify');
