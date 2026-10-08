'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),ctx={window:{},console};vm.createContext(ctx);
const files=['legacy/js/core/rng.js','legacy/js/data/content.js','legacy/js/engine/resolver.js','legacy/js/core/game.js','legacy/js/core/validation.js','legacy/js/core/save.js',
  'tests/fixtures/combos.js','tests/suite.js','tests/formal-symbols.js','tests/cultivation-behavior.js','tests/recycling-behavior.js',
  'tests/distillation-behavior.js','tests/resonance-behavior.js','tests/cargo-behavior.js','tests/pressure-suite.js','tests/pressure-transaction.js',
  'tests/route-g-behavior.js','tests/mechanics-contract.js','tests/route-h-behavior.js','tests/route-m3-behavior.js'];
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f}));
const G=ctx.window.Game;
const suites=['runTests','formalSymbolTests','cultivationBehaviorTests','recyclingBehaviorTests','distillationBehaviorTests',
  'resonanceBehaviorTests','cargoBehaviorTests','pressureBehaviorTests','pressureTransactionTests','routeGBehaviorTests','mechanicsContractTests','routeHBehaviorTests'];
const old=suites.flatMap(name=>G[name]());
const oldNames=JSON.parse(fs.readFileSync(path.join(root,'tests/route-m3-suite-manifest.json'),'utf8')).cases.map(x=>x.name);
const oldNamesPreserved=JSON.stringify(oldNames)===JSON.stringify(old.map(x=>x.name));
const m3=G.routeM3BehaviorTests();
const summary={scope:'Read-only existing regression; M3 is not independently accepted',old:{total:old.length,passed:old.filter(x=>x.ok).length,namesPreserved:oldNamesPreserved},
  m3:{total:m3.length,passed:m3.filter(x=>x.ok).length,failures:m3.filter(x=>!x.ok)}};
// New evidence path ONLY; never call legacy runner or freeze/manifest generators.
fs.writeFileSync(path.join(__dirname,'legacy-readonly-results.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
// Existing M3 failures are preserved/report-only. They cannot be fixed to claim GDD1.
process.exitCode=old.some(x=>!x.ok)||!oldNamesPreserved?1:0;
