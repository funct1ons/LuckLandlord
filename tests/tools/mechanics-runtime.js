// gdd1 机制运行时验证：确认关键原语真的被执行，而非仅有代码
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
function fresh(){
  const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat};
  ctx.globalThis=ctx;ctx.window.window=ctx.window;
  vm.createContext(ctx);
  ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f}));
  return ctx.window.GDD1;
}
const F=fresh();
const cmd=(s,c)=>{const r=F.fullCommand(s,Object.assign({revision:s.revision,windowId:s.offer.windowId},c));if(!r.ok)throw Error(c.op+' -> '+r.error);return r.state};
const run=(s,n=40)=>{let st=s;for(let i=0;i<n;i++){
  if(st.phase==='READY')st=cmd(st,{op:'spin'});
  else if(st.phase==='SYMBOL_CHOICE'){const c=st.offer.choices;st=(c&&c.length&&st.pool.length<200)?cmd(st,{op:'choose',id:c[0]}):cmd(st,{op:'skip'})}
  else if(st.phase==='ITEM_CHOICE'){const c=st.offer.choices;st=(c&&c.length)?cmd(st,{op:'item',id:c[0]}):cmd(st,{op:'skipItem'})}
  else if(st.phase==='EVENT_CHOICE')st=cmd(st,{op:'event',option:'B',id:st.events.choice.id});
  else break;
 } return st};

console.log('=== 机制运行时验证 ===\n');

// 1. 稀有度分层抽样（offer 应含不同稀有度，且阶段1不该出 epic）
let s=F.fullNewRun('MECH-1');s=run(s,3);
console.log('1. 候选抽样');
for(let i=0;i<3;i++){const ph=s.phase;if(ph!=='SYMBOL_CHOICE'){s=cmd(s,{op:'spin'})}
 console.log('   候选: '+s.offer.choices.map(id=>id+'('+F.defs(s).symbols[id].rarity+')').join(', '));
 s=cmd(s,{op:'choose',id:s.offer.choices[0]});}

// 2. 阶段保底：每阶段首个候选应含 common
console.log('\n2. 阶段保底（首个候选含 common）');
s=F.fullNewRun('MECH-2');let guaranteeHits=0,checks=0;
for(let i=0;i<40;i++){
 if(s.phase==='READY'){const had=!s.offer.guarantees.stageCommonHandled;s=cmd(s,{op:'spin'});
  if(had){checks++;const first=s.offer.choices[0];if(F.defs(s).symbols[first].rarity==='common')guaranteeHits++;}}
 else if(s.phase==='SYMBOL_CHOICE')s=cmd(s,{op:'choose',id:s.offer.choices[0]});
 else if(s.phase==='ITEM_CHOICE')s=(s.offer.choices&&s.offer.choices.length)?cmd(s,{op:'item',id:s.offer.choices[0]}):cmd(s,{op:'skipItem'});
 else if(s.phase==='EVENT_CHOICE')s=cmd(s,{op:'event',option:'B',id:s.events.choice.id});
}
console.log('   阶段首抽 '+checks+' 次，首候选为 common: '+guaranteeHits+' 次');

// 3. 图形/效果执行：统计一次结算的 action 种类
console.log('\n3. 结算原语覆盖（真实跑出的 action 种类）');
s=F.fullNewRun('MECH-3');const seen=new Set();let totalActions=0;
for(let i=0;i<300;i++){
 if(s.phase==='READY')s=cmd(s,{op:'spin'});
 else if(s.phase==='SYMBOL_CHOICE'){if(s.last){for(const r of s.last.log){seen.add(r.action);totalActions++}}
  const c=s.offer.choices;s=(c&&c.length&&s.pool.length<200)?cmd(s,{op:'choose',id:c[0]}):cmd(s,{op:'skip'});}
 else if(s.phase==='ITEM_CHOICE')s=(s.offer.choices&&s.offer.choices.length)?cmd(s,{op:'item',id:s.offer.choices[0]}):cmd(s,{op:'skipItem'});
 else if(s.phase==='EVENT_CHOICE')s=cmd(s,{op:'event',option:'B',id:s.events.choice.id});
 else break;
}
console.log('   累计动作数: '+totalActions);
console.log('   出现的原语: '+[...seen].sort().join(', '));

// 4. 保留位（reserve）
console.log('\n4. 保留位机制');
let foundReserve=false;
s=F.fullNewRun('MECH-4');
for(let i=0;i<200&&!foundReserve;i++){
 if(s.phase==='READY')s=cmd(s,{op:'spin'});
 else if(s.phase==='SYMBOL_CHOICE'){if(s.last&&s.last.log.some(r=>r.action==='reserve'))foundReserve=true;
  const c=s.offer.choices;s=(c&&c.length&&s.pool.length<200)?cmd(s,{op:'choose',id:c[0]}):cmd(s,{op:'skip'});}
 else if(s.phase==='ITEM_CHOICE')s=(s.offer.choices&&s.offer.choices.length)?cmd(s,{op:'item',id:s.offer.choices[0]}):cmd(s,{op:'skipItem'});
 else if(s.phase==='EVENT_CHOICE')s=cmd(s,{op:'event',option:'B',id:s.events.choice.id});
 else break;
}
console.log('   200 轮内出现 reserve 动作: '+(foundReserve?'是 ✓':'否（可能未持有该符号）'));

// 5. 事件触发
console.log('\n5. 事件系统');
let events=0;
s=F.fullNewRun('MECH-5');
for(let i=0;i<400;i++){
 if(s.phase==='READY')s=cmd(s,{op:'spin'});
 else if(s.phase==='SYMBOL_CHOICE'){const c=s.offer.choices;s=(c&&c.length&&s.pool.length<200)?cmd(s,{op:'choose',id:c[0]}):cmd(s,{op:'skip'});}
 else if(s.phase==='ITEM_CHOICE')s=(s.offer.choices&&s.offer.choices.length)?cmd(s,{op:'item',id:s.offer.choices[0]}):cmd(s,{op:'skipItem'});
 else if(s.phase==='EVENT_CHOICE'){events++;s=cmd(s,{op:'event',option:'B',id:s.events.choice.id});}
 else break;
}
console.log('   400 步内触发事件: '+events+' 次   最终 phase='+s.phase+' stage='+s.stageId);
