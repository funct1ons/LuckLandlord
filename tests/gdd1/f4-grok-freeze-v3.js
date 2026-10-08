'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const diffOut = path.join(__dirname, 'f4-grok-authorized-diff-v3.json');
const protOut = path.join(__dirname, 'f4-grok-protection-v3.json');
const freezeOut = path.join(__dirname, 'f4-grok-freeze-v3.json');
const AUTHORIZED = new Set(['js/gdd1/resolver.js', 'js/gdd1/full-effects.js']);
const PRIOR_F4 = new Set(['gdd1.html', 'js/gdd1/offers.js', 'js/gdd1/schema.js', 'js/gdd1UI/main.js', 'js/gdd1/resolver.js']);
const MUST_HOLD_245 = new Set([
  'docs/GAME_DESIGN_V1.md',
  'docs/GDD1_F0_FREEZE.md',
  'prompt.txt',
  'EXECUTION_PLAN.md',
  'tests/gdd1/protected-before.json'
]);
const FROZEN_GDD = 'e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07';
const FROZEN_158 = 'c715a8a3e95aa66aef89cffce36d15604acbeee6fd3d28066987a06eefdec529';
const FROZEN_V4 = '48b9045350a34a078f0c48a559dfc96de01423dd6c3edfdcdd644687b98ec676';
const FROZEN_SUPPLEMENT = '8b83cc616b41a6b115cfb20f70b8d04dfe214de6c66cbdd33096449ffb229824';
const FROZEN_AUDIT = '19884a37955c48d4a468684aac87e05d3ae3d91c628f1cbaff99cb1487f5d23d';
const FROZEN_FREEZE_V1 = 'f78d91d01a1a1d9bfb1b5c4c1b5db2bfb09d489b23de91ee97e41d9c2f0170bf';
const FROZEN_FREEZE_V2 = '893c09699ed96752b8dccdce86ddeff0010c44d051fb45c03f5f88762b69f8b4';
const EFFECTS_CLOTH_BOOK = { bytes: 38059, sha256: 'b602a74a9e485454b3d5801e7a1a648ffa7fc8bdc220cc8928b483728c8af205' };
const digest = rel => {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8').replace(/^\uFEFF/, ''));
const mode = process.argv[2] || '--create';

function grokEvidence() {
  return fs.readdirSync(__dirname).filter(n => n.startsWith('f4-grok-') && n !== 'f4-grok-freeze-v3.json').map(n => 'tests/gdd1/' + n).sort();
}

function compare158() {
  const freeze = readJson('tests/gdd1/f4-review-freeze-v1.json');
  const freezeHash = digest('tests/gdd1/f4-review-freeze-v1.json');
  if (freezeHash.sha256 !== FROZEN_158) throw Error('f4-review-freeze-v1.json hash drifted');
  if (freeze.entryCount !== 158 || freeze.entries.length !== 158) throw Error('158 entry count drifted');
  const rows = freeze.entries.map(e => {
    const now = digest(e.path);
    const same = now.bytes === e.bytes && now.sha256 === e.sha256;
    let status = 'UNCHANGED';
    if (!same) status = AUTHORIZED.has(e.path) ? 'AUTHORIZED_F4_GROK_FIX' : 'UNAUTHORIZED';
    return { path: e.path, freeze: { bytes: e.bytes, sha256: e.sha256 }, current: now, status };
  });
  const unauthorized = rows.filter(x => x.status === 'UNAUTHORIZED');
  if (unauthorized.length) throw Error('Unauthorized 158 mismatches: ' + unauthorized.map(x => x.path).join(','));
  return { freezeHash, gddSha256: freeze.gddSha256, rows, authorized: rows.filter(x => x.status === 'AUTHORIZED_F4_GROK_FIX'), unchanged: rows.filter(x => x.status === 'UNCHANGED').length };
}

function compare245(c158) {
  const before = readJson('tests/gdd1/protected-before.json');
  if (before.files.length !== 245) throw Error('protected-before is not 245 files');
  const snap = digest('tests/gdd1/protected-before.json');
  if (snap.sha256 !== '8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e') throw Error('protected-before.json mutated');
  const freeze158 = new Set(c158.rows.map(x => x.path));
  const rows = before.files.map(e => {
    const now = digest(e.path);
    const same = now.bytes === e.bytes && now.sha256 === e.sha256.toLowerCase();
    let status = 'UNCHANGED';
    if (!same) {
      if (AUTHORIZED.has(e.path)) status = 'AUTHORIZED_F4_GROK_FIX';
      else if (PRIOR_F4.has(e.path)) status = 'DISCLOSED_PRIOR_F4_SOURCE';
      else status = 'HISTORICAL_SCOPE_DRIFT_VS_F1_245';
    }
    if (MUST_HOLD_245.has(e.path) && !same) throw Error('Immutable 245 path changed: ' + e.path);
    return { path: e.path, in158: freeze158.has(e.path), before: { bytes: e.bytes, sha256: e.sha256 }, current: now, status };
  });
  const only158 = c158.rows.filter(x => !before.files.some(f => f.path === x.path)).map(x => x.path);
  return { snapshot: snap, total: 245, unchanged: rows.filter(x => x.status === 'UNCHANGED').length, rows, only158 };
}

function verify() {
  for (const p of [diffOut, protOut, freezeOut]) if (!fs.existsSync(p)) throw Error('missing ' + p);
  const freeze = readJson('tests/gdd1/f4-grok-freeze-v3.json');
  for (const e of freeze.entries) {
    const now = digest(e.path);
    if (now.bytes !== e.bytes || now.sha256 !== e.sha256) throw Error('freeze mismatch ' + e.path);
  }
  const self = digest('tests/gdd1/f4-grok-freeze-v3.json');
  console.log(JSON.stringify({ mode: 'verify', pass: true, entries: freeze.entries.length, selfExcluded: true, freeze: self }, null, 2));
}

function create() {
  for (const p of [diffOut, protOut, freezeOut]) if (fs.existsSync(p)) throw Error('Refuse existing output ' + path.basename(p));
  const gdd = digest('docs/GAME_DESIGN_V1.md');
  if (gdd.sha256 !== FROZEN_GDD) throw Error('GDD drifted');
  const v4 = digest('tests/gdd1/f4-audit-semantic-v4-results.json');
  if (v4.sha256 !== FROZEN_V4) throw Error('v4 results mutated');
  const supplement = digest('docs/GDD1_F4_AUDIT_SUPPLEMENT.md');
  if (supplement.sha256 !== FROZEN_SUPPLEMENT) throw Error('supplement hash mismatch, actual ' + supplement.sha256);
  const audit = digest('docs/GDD1_F4_GROK_AUDIT.md');
  if (audit.sha256 !== FROZEN_AUDIT) throw Error('independent audit hash mismatch, actual ' + audit.sha256);
  const freezeV1 = digest('tests/gdd1/f4-grok-freeze-v1.json');
  if (freezeV1.sha256 !== FROZEN_FREEZE_V1) throw Error('freeze v1 mutated');
  const freezeV2 = digest('tests/gdd1/f4-grok-freeze-v2.json');
  if (freezeV2.sha256 !== FROZEN_FREEZE_V2) throw Error('freeze v2 mutated');
  const c158 = compare158();
  const c245 = compare245(c158);
  const productionBefore = {
    resolver: { path: 'js/gdd1/resolver.js', bytes: 27757, sha256: '435bf3266b0b3d161f2d26d5345c9b21e2a669a316c9c4bbaf09e3c6ab34351c' },
    fullEffects158: { path: 'js/gdd1/full-effects.js', bytes: 38016, sha256: '82b207481c292270bb73109854ecd2f474ae4e191317f8476a4ccf80e7e338a3' },
    fullEffectsClothBook: { path: 'js/gdd1/full-effects.js', ...EFFECTS_CLOTH_BOOK }
  };
  const productionAfter = { resolver: digest('js/gdd1/resolver.js'), fullEffects: digest('js/gdd1/full-effects.js') };
  const diff = {
    status: 'AUTHORIZED SOURCE DIFF VS 158 FREEZE; freeze v3 is post-independent-audit snapshot of current production plus grok evidence',
    warning: 'Does not overwrite f4-review-freeze-v1.json, f4-grok-freeze-v1.json, f4-grok-freeze-v2.json, or v4 results. freeze-v2 --verify is expected to fail: auditor later mutated tests/gdd1/f4-grok-audit-edge-v1.js after the v2 snapshot; the v2 JSON file itself is unchanged.',
    supersedes: {
      retained: ['tests/gdd1/f4-grok-authorized-diff-v1.json', 'tests/gdd1/f4-grok-authorized-diff-v2.json', 'tests/gdd1/f4-grok-freeze-v1.json', 'tests/gdd1/f4-grok-freeze-v2.json'],
      basis: 'v3 captures independent auditor PASS plus cloudy_negative data repair; freeze v2 remains the engineering cloudy snapshot'
    },
    gddSha256: FROZEN_GDD,
    freeze158: c158.freezeHash,
    semanticV4: v4,
    supplement,
    independentAudit: audit,
    productionBefore,
    productionAfter,
    authorizedPaths: [...AUTHORIZED],
    unchanged158: c158.unchanged,
    authorized158: c158.authorized,
    mechanism: {
      resolver: 'generic select() orders by first tagAdded log index when receivedTag or order===tagAdded; no symbolID branches',
      alignment_cloth: 'data: selector adjacent+receivedTag+order tagAdded, amount 5, lockFirst',
      item_spectrum_book: 'data: listen add event tagAdded eventTarget defer amount 3',
      cloudy_negative: 'data: natural mechanics.age threshold 3 to blank_facet; no age-extra self'
    }
  };
  fs.writeFileSync(diffOut, JSON.stringify(diff, null, 2) + '\n', { flag: 'wx' });
  const protection = {
    status: '245 vs 158 vs current after cloth/book/cloudy and independent audit; historical 245 is a different F1 scope',
    protectedBefore: c245.snapshot,
    original245: { total: c245.total, unchanged: c245.unchanged, drifted: c245.total - c245.unchanged },
    review158: { total: 158, unchanged: c158.unchanged, authorized: c158.authorized.map(x => x.path) },
    onlyIn158: c245.only158,
    drifted245: c245.rows.filter(x => x.status !== 'UNCHANGED').map(x => ({ path: x.path, status: x.status, before: x.before, current: x.current })),
    runtimeExceptions: ['.pi/loops.json', '.pi/loops/'],
    freezeV2Verify: 'fails on tests/gdd1/f4-grok-audit-edge-v1.js because the auditor continued editing after freeze v2 create; freeze v2 JSON SHA still holds',
    note: 'Runtime scheduler files were not restored. Historical failures and old freezes were not rewritten. freeze v1 and v2 retained.'
  };
  fs.writeFileSync(protOut, JSON.stringify(protection, null, 2) + '\n', { flag: 'wx' });
  const extra = [
    'docs/GDD1_F4_AUDIT_SUPPLEMENT.md',
    'docs/GDD1_F4_GROK_FIX.md',
    'docs/GDD1_F4_GROK_FIX_V2.md',
    'docs/GDD1_F4_GROK_AUDIT.md',
    'tests/gdd1/f4-grok-authorized-diff-v1.json',
    'tests/gdd1/f4-grok-protection-v1.json',
    'tests/gdd1/f4-grok-freeze-v1.json',
    'tests/gdd1/f4-grok-authorized-diff-v2.json',
    'tests/gdd1/f4-grok-protection-v2.json',
    'tests/gdd1/f4-grok-freeze-v2.json',
    'tests/gdd1/f4-grok-authorized-diff-v3.json',
    'tests/gdd1/f4-grok-protection-v3.json',
    ...grokEvidence().filter(p => !p.endsWith('f4-grok-freeze-v3.json'))
  ];
  const seen = new Set();
  const entries = [];
  for (const e of c158.rows) {
    seen.add(e.path);
    entries.push({ path: e.path, bytes: e.current.bytes, sha256: e.current.sha256, vs158: e.status });
  }
  for (const p of extra) {
    if (seen.has(p) || !fs.existsSync(path.join(root, p))) continue;
    const now = digest(p);
    seen.add(p);
    entries.push({ path: now.path, bytes: now.bytes, sha256: now.sha256, vs158: 'NEW_F4_GROK_EVIDENCE' });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const freeze = {
    status: 'POST-INDEPENDENT-AUDIT SNAPSHOT / NOT HUMAN PLAY / NOT BOT-SIM COMPLETION',
    warning: 'Supersedes 158 hashes only for authorized resolver.js and full-effects.js. freeze v1 and v2 retained. Old 158 freeze, v4 29/32 failures, and historical reports remain originals.',
    independentAudit: { judgment: 'PASS', path: 'docs/GDD1_F4_GROK_AUDIT.md', ...audit },
    gddSha256: FROZEN_GDD,
    priorFreeze: c158.freezeHash,
    priorGrokFreezeV1: freezeV1,
    priorGrokFreezeV2: freezeV2,
    authorizedDiff: digest('tests/gdd1/f4-grok-authorized-diff-v3.json'),
    protection: digest('tests/gdd1/f4-grok-protection-v3.json'),
    selfExcluded: true,
    entryCount: entries.length,
    entries
  };
  fs.writeFileSync(freezeOut, JSON.stringify(freeze, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({
    mode: 'create',
    freeze: digest('tests/gdd1/f4-grok-freeze-v3.json'),
    diff: freeze.authorizedDiff,
    protection: freeze.protection,
    entryCount: entries.length,
    unchanged158: c158.unchanged,
    authorized158: c158.authorized.map(x => x.path),
    drifted245: protection.original245.drifted,
    independentAudit: audit.sha256
  }, null, 2));
}

if (mode === '--verify') verify();
else if (mode === '--create') create();
else throw Error('Use --create or --verify');
