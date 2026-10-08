'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{},console};vm.createContext(ctx);
for(const f of ['legacy/js/core/rng.js','legacy/js/data/content.js','legacy/js/engine/resolver.js','legacy/js/core/game.js','legacy/js/core/validation.js','legacy/js/core/save.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const G=ctx.window.Game, results=[];
const check=(name,expected,actual,detail)=>results.push({name,ok:JSON.stringify(expected)===JSON.stringify(actual),expected,actual,detail});
const state=types=>{const s=G.newRun('RECYCLING-AUDIT');s.symbols=[];types.forEach(t=>s.symbols.push(G.instance(s,t)));return s;};
const spin=(s,board)=>{const r=G.command(s,{revision:s.revision,type:'spin',board});if(!r.ok)throw Error(r.error);return r.state;};
const skip=s=>{const r=G.command(s,{revision:s.revision,type:'choose',index:null});if(!r.ok)throw Error(r.error);return r.state;};
// 1: ash_felt consume branch must suppress later maturity reward and preserve exactly one independent reward.
{let s=state(['ash_felt','sorting_tong']);s=spin(s,s.symbols.map(x=>x.uid));check('ash-felt-consume-cause-is-exclusive',6,s.last.reward,'consume reward is single and no extra self-mature reward');}
// 2: one source must not consume two scrap targets even when both are adjacent.
{let s=state(['sorting_tong','spent_gasket','ash_felt']);s=spin(s,s.symbols.map(x=>x.uid));check('sorting-tong-stable-single-target',1,s.last.log.filter(x=>x.type==='consume').length,'P1 default count=1 and stable selector');}
// 3: two independent heat_clerk listeners each have their own per-source limit.
{let s=state(['heat_clerk','heat_clerk','sorting_tong','spent_gasket','ash_felt']);s=spin(s,s.symbols.map(x=>x.uid));check('heat-clerk-listeners-independent',[1,1],[s.symbols[0].permanent,s.symbols[1].permanent],'P3 perSource/perListener limit');}
// 4: uniqueTypeCount counts distinct symbol types, not instances of one type.
{let s=state(['furnace_auditor','sorting_tong','sorting_tong','spent_gasket','ash_felt']);s=spin(s,s.symbols.map(x=>x.uid));check('furnace-auditor-type-not-instance',1,s.last.ledger[0].multiplier,'CONTENT_MATRIX B uniqueTypeCount');}
// 5: conversion keeps UID/permanent, clears all counters, and does not re-run appearance add.
{let s=state(['sieve_drum','spent_gasket']);const x=s.symbols[1];x.permanent=7;x.counters={age:9,pressure:4};const id=x.uid;s=spin(s,s.symbols.map(y=>y.uid));const y=s.symbols.find(z=>z.uid===id);check('conversion-preserves-uid-permanent-clears-counters',[id,7,{}],[y.uid,y.permanent,y.counters],'RULES conversion snapshot');}
// 6: dead target event listener must see target snapshot after consume/destroy.
{let s=state(['sorting_tong','ash_felt']);const listener={trigger:'ON_DESTROY',action:'reward',scope:'event',target:'self',when:{eventCause:'consume'},reward:1,priority:99};G.symbols.ash_felt.effects.push(listener);s=spin(s,s.symbols.map(x=>x.uid));const ev=s.last.log.filter(x=>x.type==='reward'&&x.payload&&x.payload.cause==='consume');G.symbols.ash_felt.effects.pop();check('dead-listener-target-snapshot',true,ev.length>0,'P4 consume cause payload after death');}
// 7: schema rejects an illegal selector count instead of silently accepting it.
{let threw=false;try{const raw=JSON.parse(G.encode(G.newRun('SCHEMA-AUDIT')));raw.symbols=[{uid:'u1',type:'spent_gasket',permanent:0,counters:{}},{uid:'u1',type:'ash_felt',permanent:0,counters:{}}];G.decode(JSON.stringify(raw));}catch(e){threw=true;}check('schema-illegal-save-rejected',true,threw,'duplicate UID rejection');}
// 8: save/restore after real spin settles with recycling state intact.
{let s=state(['sieve_drum','spent_gasket']);s=spin(s,s.symbols.map(x=>x.uid));const restored=G.decode(G.encode(s));check('spin-settle-save-restore',[s.revision,s.symbols[1].type,s.last.total],[restored.revision,restored.symbols[1].type,restored.last.total],'real settle-save recovery');}
// 9: repeated resolve starts a fresh event ledger; prior spin's consumed type set cannot leak.
{let a=state(['furnace_auditor','sorting_tong','spent_gasket','ash_felt']);const ids=a.symbols.map(x=>x.uid);const r1=G.resolve(a,ids);let b=state(['furnace_auditor','sorting_tong','spent_gasket','ash_felt']);const r2=G.resolve(b,b.symbols.map(x=>x.uid));check('event-dedup-state-is-per-spin',r1.reward,r2.reward,'consumed type set resets per resolve');}
// 10: resolver must not hard-code formal symbol IDs for recycling behavior.
{const text=fs.readFileSync(path.join(__dirname,'..','legacy/js/engine/resolver.js'),'utf8');check('resolver-no-symbol-id-hardcoding',true,!/(ash_felt|sorting_tong|furnace_auditor|heat_clerk|clinker_router)/.test(text),'generic resolver route check');}
for(const r of results)console.log(`${r.ok?'PASS':'FAIL'} ${r.name} expected=${JSON.stringify(r.expected)} actual=${JSON.stringify(r.actual)} 鈥?${r.detail}`);
const failed=results.filter(x=>!x.ok);console.log(`AUDIT-RECYCLING ${results.length-failed.length}/${results.length} passed; ${failed.length} failed`);process.exitCode=failed.length?1:0;
module.exports={results};
