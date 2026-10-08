'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{},console};vm.createContext(ctx);
for(const f of ['legacy/js/core/rng.js','legacy/js/data/content.js','legacy/js/engine/resolver.js','legacy/js/core/game.js','legacy/js/core/validation.js','legacy/js/core/save.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const G=ctx.window.Game, results=[];
const check=(name,expected,actual,detail)=>{const ok=JSON.stringify(expected)===JSON.stringify(actual);results.push({name,ok,expected,actual,detail});};
function state(types){const s=G.newRun('AUDIT');s.symbols=[];types.forEach(t=>s.symbols.push(G.instance(s,t)));return s;}
function spin(s,board){const r=G.command(s,{revision:s.revision,type:'spin',board});if(!r.ok)throw Error(r.error);return r.state;}
// Boundary 1: independent root ledgers must each receive the first two plant conversions.
{let s=state(['root_ledger','root_ledger','mist_pouch','dew_lantern','mist_pouch']);s.symbols[2].counters.age=2;s.symbols[3].counters.age=1;s.symbols[4].counters.age=2;const ids=s.symbols.map(x=>x.uid);s=spin(s,ids);check('two-root-ledgers-each-per-spin-cap',[2,2],[s.symbols[0].permanent,s.symbols[1].permanent],'CONTENT_MATRIX A root_ledger');}
// Boundary 2: ash_felt maturity is specified after three appearances and must self-destroy/reward.
{let s=state(['ash_felt']);const id=s.symbols[0].uid;for(let i=0;i<3;i++){s=spin(s,[id]);if(i<2){const r=G.command(s,{revision:s.revision,type:'choose',index:null});if(!r.ok)throw Error(r.error);s=r.state;}}const alive=s.last.board[0]?.alive;check('ash-felt-three-appear-self-destroy',[false,3],[alive,s.last.reward],'CONTENT_MATRIX A row 116 / section 7');}
// Boundary 3: pearl_separator must reject product crystals as targets.
{const s=state(['pearl_separator','tide_prism']);const ids=s.symbols.map(x=>x.uid);const out=spin(s,ids);check('pearl-separator-excludes-product','tide_prism',out.last.board[1].type,'CONTENT_MATRIX A pearl_separator');}
// Boundary 4: conversion keeps UID/permanent, clears counters, and does not re-appear.
{const s=state(['condense_coil','saline_ampoule']);s.symbols[1].permanent=7;s.symbols[1].counters.age=9;const id=s.symbols[1].uid;const out=spin(s,s.symbols.map(x=>x.uid));const x=out.symbols.find(z=>z.uid===id);check('conversion-snapshot-uid-permanent-counter',[id,7,{}],[x.uid,x.permanent,x.counters],'RULES conversion');}
// Boundary 5: nursery multiplier applies once to all surviving plants after two successful conversions.
{const s=state(['nursery_gauge','mist_pouch','mist_pouch','wick_bed']);s.symbols[1].counters.age=2;s.symbols[2].counters.age=2;const out=spin(s,s.symbols.map(x=>x.uid));const vals=out.last.ledger.map(x=>x.amount);check('nursery-full-board-once',[3,3],[vals[0],vals[3]],'CONTENT_MATRIX A row 110');}
// Boundary 6: save transaction must preserve original state on failed write.
{const s=G.newRun('SAVE-AUDIT');const before=G.encode(s);let current=before;const storage={getItem:k=>k.endsWith('.backup')?before:current,setItem:(k,v)=>{if(k.endsWith('.backup'))throw Error('quota');current=v;}};const r=G.store(storage,G.newRun('SAVE-B'));check('save-failure-no-commit',false,r.ok,'RULES transaction');}
// Static audit: cultivation behavior count and hard-coded implementation signals.
{const text=fs.readFileSync(path.join(__dirname,'cultivation-behavior.js'),'utf8');const cases=(text.match(/run\(/g)||[]).length;check('cultivation-behavior-case-count-at-least-20',true,cases>=20,`count=${cases}`);}
for(const r of results)console.log(`${r.ok?'PASS':'FAIL'} ${r.name} expected=${JSON.stringify(r.expected)} actual=${JSON.stringify(r.actual)}${r.detail?' 鈥?'+r.detail:''}`);
const failed=results.filter(x=>!x.ok);console.log(`AUDIT ${results.length-failed.length}/${results.length} passed; ${failed.length} failed`);process.exitCode=failed.length?1:0;
