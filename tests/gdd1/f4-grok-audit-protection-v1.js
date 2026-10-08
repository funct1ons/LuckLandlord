'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const destName = process.argv[2] || 'f4-grok-audit-protection-v1.json';
if (!/^f4-grok-audit-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe output ' + destName);
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);
const root = path.resolve(__dirname, '../..');
const digest = rel => {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8').replace(/^\uFEFF/, ''));
const AUTHORIZED = new Set(['js/gdd1/resolver.js', 'js/gdd1/full-effects.js']);
const PRIOR_F4 = new Set(['gdd1.html', 'js/gdd1/offers.js', 'js/gdd1/schema.js', 'js/gdd1UI/main.js', 'js/gdd1/resolver.js']);
const MUST_HOLD_245 = new Set([
  'docs/GAME_DESIGN_V1.md',
  'docs/GDD1_F0_FREEZE.md',
  'prompt.txt',
  'EXECUTION_PLAN.md',
  'tests/gdd1/protected-before.json'
]);
const FROZEN = {
  gdd: 'e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07',
  freeze158: 'c715a8a3e95aa66aef89cffce36d15604acbeee6fd3d28066987a06eefdec529',
  supplement: '8b83cc616b41a6b115cfb20f70b8d04dfe214de6c66cbdd33096449ffb229824',
  v4: '48b9045350a34a078f0c48a559dfc96de01423dd6c3edfdcdd644687b98ec676',
  protectedBefore: '8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e',
  resolverAfter: 'e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b',
  effectsClothBook: 'b602a74a9e485454b3d5801e7a1a648ffa7fc8bdc220cc8928b483728c8af205',
  effectsAfter: 'f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55',
  grokFreeze: 'f78d91d01a1a1d9bfb1b5c4c1b5db2bfb09d489b23de91ee97e41d9c2f0170bf',
  resolverBefore: '435bf3266b0b3d161f2d26d5345c9b21e2a669a316c9c4bbaf09e3c6ab34351c',
  effectsBefore: '82b207481c292270bb73109854ecd2f474ae4e191317f8476a4ccf80e7e338a3'
};
const authorities = {
  gdd: digest('docs/GAME_DESIGN_V1.md'),
  freeze158file: digest('tests/gdd1/f4-review-freeze-v1.json'),
  supplement: digest('docs/GDD1_F4_AUDIT_SUPPLEMENT.md'),
  v4: digest('tests/gdd1/f4-audit-semantic-v4-results.json'),
  protectedBefore: digest('tests/gdd1/protected-before.json'),
  grokFreeze: digest('tests/gdd1/f4-grok-freeze-v1.json'),
  prompt: digest('prompt.txt'),
  executionPlan: digest('EXECUTION_PLAN.md'),
  resolver: digest('js/gdd1/resolver.js'),
  fullEffects: digest('js/gdd1/full-effects.js'),
  gdd1Html: digest('gdd1.html'),
  uiMain: digest('js/gdd1UI/main.js')
};
const authorityHold = {
  gdd: authorities.gdd.sha256 === FROZEN.gdd,
  freeze158: authorities.freeze158file.sha256 === FROZEN.freeze158,
  supplement: authorities.supplement.sha256 === FROZEN.supplement,
  v4: authorities.v4.sha256 === FROZEN.v4,
  protectedBefore: authorities.protectedBefore.sha256 === FROZEN.protectedBefore,
  grokFreeze: authorities.grokFreeze.sha256 === FROZEN.grokFreeze,
  resolver: authorities.resolver.sha256 === FROZEN.resolverAfter && authorities.resolver.bytes === 27996,
  fullEffects: authorities.fullEffects.sha256 === FROZEN.effectsAfter && authorities.fullEffects.bytes === 37993
};
const freeze = readJson('tests/gdd1/f4-review-freeze-v1.json');
if (freeze.entryCount !== 158 || freeze.entries.length !== 158) throw Error('158 entry count drifted');
const rows158 = freeze.entries.map(e => {
  const now = digest(e.path);
  const same = now.bytes === e.bytes && now.sha256 === e.sha256;
  let status = 'UNCHANGED';
  if (!same) status = AUTHORIZED.has(e.path) ? 'AUTHORIZED_F4_GROK_FIX' : 'UNAUTHORIZED';
  return { path: e.path, freeze: { bytes: e.bytes, sha256: e.sha256 }, current: now, status };
});
const unauthorized158 = rows158.filter(x => x.status === 'UNAUTHORIZED');
const authorized158 = rows158.filter(x => x.status === 'AUTHORIZED_F4_GROK_FIX');
const unchanged158 = rows158.filter(x => x.status === 'UNCHANGED');
const before = readJson('tests/gdd1/protected-before.json');
if (before.files.length !== 245) throw Error('protected-before is not 245 files');
const freeze158set = new Set(rows158.map(x => x.path));
const rows245 = before.files.map(e => {
  const now = digest(e.path);
  const same = now.bytes === e.bytes && now.sha256 === e.sha256.toLowerCase();
  let status = 'UNCHANGED';
  if (!same) {
    if (AUTHORIZED.has(e.path)) status = 'AUTHORIZED_F4_GROK_FIX';
    else if (PRIOR_F4.has(e.path)) status = 'DISCLOSED_PRIOR_F4_SOURCE';
    else status = 'HISTORICAL_SCOPE_DRIFT_VS_F1_245';
  }
  if (MUST_HOLD_245.has(e.path) && !same) throw Error('Immutable 245 path changed: ' + e.path);
  return { path: e.path, in158: freeze158set.has(e.path), before: { bytes: e.bytes, sha256: e.sha256 }, current: now, status };
});
const only158 = rows158.filter(x => !before.files.some(f => f.path === x.path)).map(x => x.path);
const naming = {
  'tests/gdd1/f4-ui-cdp-v7-results.json': fs.existsSync(path.join(root, 'tests/gdd1/f4-ui-cdp-v7-results.json')),
  'tests/gdd1/f4-f2-safe-v6-node.json': fs.existsSync(path.join(root, 'tests/gdd1/f4-f2-safe-v6-node.json'))
};
const report = {
  scope: 'Independent 245 vs 158 vs current after grok cloth/book fix; originals not overwritten',
  authorities,
  authorityHold,
  frozenExpected: FROZEN,
  review158: {
    total: 158,
    unchanged: unchanged158.length,
    authorized: authorized158.map(x => ({ path: x.path, freeze: x.freeze, current: x.current })),
    unauthorized: unauthorized158.map(x => x.path)
  },
  original245: {
    total: 245,
    unchanged: rows245.filter(x => x.status === 'UNCHANGED').length,
    drifted: rows245.filter(x => x.status !== 'UNCHANGED').map(x => ({ path: x.path, status: x.status, before: x.before, current: x.current }))
  },
  onlyIn158: only158,
  namingDeviationsRetained: naming,
  runtimeExceptionsNotRestored: ['.pi/loops.json', '.pi/loops/'],
  productionClaim: {
    resolverMatches: authorityHold.resolver,
    fullEffectsMatches: authorityHold.fullEffects,
    onlyTwoAuthorizedSourceDiffs: unauthorized158.length === 0 && authorized158.length === 2
  }
};
const ok = Object.values(authorityHold).every(Boolean) && unauthorized158.length === 0 && authorized158.length === 2 && authorized158.every(x => AUTHORIZED.has(x.path)) && naming['tests/gdd1/f4-ui-cdp-v7-results.json'] && naming['tests/gdd1/f4-f2-safe-v6-node.json'];
report.ok = ok;
fs.writeFileSync(dest, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({
  dest: 'tests/gdd1/' + destName,
  ok,
  authorityHold,
  unchanged158: unchanged158.length,
  authorized158: authorized158.map(x => x.path),
  unauthorized158: unauthorized158.map(x => x.path),
  unchanged245: report.original245.unchanged,
  drifted245: report.original245.drifted.map(x => x.path),
  naming
}, null, 2));
if (!ok) process.exitCode = 1;
