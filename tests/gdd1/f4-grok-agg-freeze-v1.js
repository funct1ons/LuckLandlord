'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const freezeOut = path.join(__dirname, 'f4-grok-agg-freeze-v1.json');
const FROZEN_GDD = 'e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07';
const FROZEN_FREEZE_V4 = 'cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953';
const FROZEN_SIM_AUDIT = 'e08580281e482d8bec0fce9414290401149fbecd171dc4a0f7d17177350ff437';
const digest = rel => {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};
const mode = process.argv[2] || '--create';
const NEW_FILES = [
  'docs/GDD1_FULL_SIM_AUDIT_AGG.md',
  'docs/GDD1_FULL_SIM_DIAGNOSIS.md',
  'docs/GDD1_FULL_SIM_CLARIFICATION.md',
  'docs/GDD1_FULL_SIM_HANDOFF.md',
  'tests/gdd1/f4-grok-audit-sim-agg-v1.json',
  'tests/gdd1/full-sim-diagnosis-v1.json',
  'tests/gdd1/full-sim-diagnosis.js',
  'tests/gdd1/f4-grok-agg-freeze-v1.js'
];

function verifyV4() {
  const freeze = JSON.parse(fs.readFileSync(path.join(root, 'tests/gdd1/f4-grok-freeze-v4.json'), 'utf8'));
  const self = digest('tests/gdd1/f4-grok-freeze-v4.json');
  if (self.sha256 !== FROZEN_FREEZE_V4) throw Error('freeze-v4 mutated ' + self.sha256);
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error('freeze-v4 entry drifted ' + e.path);
  }
  return { freezeV4: self, entries: freeze.entries.length };
}

function verify() {
  if (!fs.existsSync(freezeOut)) throw Error('missing agg freeze');
  const freeze = JSON.parse(fs.readFileSync(freezeOut, 'utf8'));
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error('agg freeze mismatch ' + e.path);
  }
  const v4 = verifyV4();
  console.log(JSON.stringify({ mode: 'verify', pass: true, entries: freeze.entries.length, freeze: digest('tests/gdd1/f4-grok-agg-freeze-v1.json'), freezeV4: v4.freezeV4 }, null, 2));
}

function create() {
  if (fs.existsSync(freezeOut)) throw Error('Refuse existing f4-grok-agg-freeze-v1.json');
  const gdd = digest('docs/GAME_DESIGN_V1.md');
  if (gdd.sha256 !== FROZEN_GDD) throw Error('GDD drifted');
  const prior = digest('docs/GDD1_FULL_SIM_AUDIT.md');
  if (prior.sha256 !== FROZEN_SIM_AUDIT) throw Error('prior sim audit mutated');
  const v4 = verifyV4();
  const required = [
    'docs/GDD1_FULL_SIM_AUDIT_AGG.md',
    'tests/gdd1/f4-grok-audit-sim-agg-v1.json',
    'docs/GDD1_FULL_SIM_DIAGNOSIS.md',
    'docs/GDD1_FULL_SIM_HANDOFF.md'
  ];
  for (const p of required) if (!fs.existsSync(path.join(root, p))) throw Error('missing ' + p);
  const entries = [];
  for (const p of NEW_FILES) {
    if (!fs.existsSync(path.join(root, p))) continue;
    if (p === 'tests/gdd1/f4-grok-agg-freeze-v1.json') continue;
    entries.push({ ...digest(p), vsV4: 'NEW_AGG_EVIDENCE' });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const freeze = {
    status: 'POST-AGGREGATION-AUDIT SNAPSHOT / DOES NOT SUPERSEDE freeze-v4 / NOT FORMAL NORMAL ACCEPTANCE',
    prefix: 'f4-grok-agg-v1',
    warning: 'Does not overwrite freeze-v4 or prior reports. Economy NOT APPROVED. Human play pending.',
    gddSha256: FROZEN_GDD,
    freezeV4: v4.freezeV4,
    priorSimAudit: prior,
    aggAudit: digest('docs/GDD1_FULL_SIM_AUDIT_AGG.md'),
    selfExcluded: true,
    entryCount: entries.length,
    entries
  };
  fs.writeFileSync(freezeOut, JSON.stringify(freeze, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ mode: 'create', freeze: digest('tests/gdd1/f4-grok-agg-freeze-v1.json'), freezeV4: v4.freezeV4, entryCount: entries.length, aggAudit: freeze.aggAudit }, null, 2));
}

if (mode === '--verify') verify();
else if (mode === '--create') create();
else throw Error('Use --create or --verify');
