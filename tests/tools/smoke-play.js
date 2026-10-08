// 无头跑一局完整 GDD1 Normal 游戏，报告在哪里卡住。
const fs=require('fs'),vm=require('vm'),path=require('path');
const root='C:/files/code/LuckLandlord';
const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat,Symbol,Promise};
ctx.globalThis=ctx;ctx.window.window=ctx.window;
vm.createContext(ctx);

const files=['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js'];
for(const f of files){
  try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});}
  catch(e){console.log('加载失败 '+f+' -> '+e.message);process.exit(1);}
}
const F=ctx.window.GDD1;
console.log('=== 可用入口 ===');
for(const k of ['fullNewRun','sliceNewRun','fullCommand','sliceCommand','defs','validateState','transact'])
  console.log('  '+k+': '+typeof F[k]);

// 跑一局
console.log('\n=== 跑一局 Normal (full-v1) ===');
let state;
try { state=F.fullNewRun('SMOKE-TEST-1'); console.log('新局创建 OK'); }
catch(e){ console.log('新局创建失败: '+e.message); process.exit(1); }

const show=s=>`phase=${s.phase} stage=${s.stageId}/10 spin=${s.spin} cash=${s.cash} pay=${s.payment} 余轮=${s.spinsRemaining} 池=${s.pool.length} 道具=${s.items.length}`;
console.log('初始: '+show(state));

let steps=0, MAXSTEPS=2000, stuck=null;
const history=[];
while(steps<MAXSTEPS){
  steps++;
  const before=state.phase+'|'+state.spin+'|'+state.spinsRemaining;
  if(state.phase==='WON'||state.phase==='LOST'){console.log('\n结束: '+state.phase+' at spin '+state.spin+', cash '+state.cash);break;}
  let cmd=null;
  if(state.phase==='READY'){
    if(!state.last){cmd={op:'spin'};}
    else cmd={op:'spin'};
  } else if(state.phase==='SYMBOL_CHOICE'){
    // 简单策略：选第一个候选（若满池则跳过）
    if(state.pool.length>=200) cmd={op:'skip'};
    else if(state.offer.choices&&state.offer.choices.length) cmd={op:'choose',id:state.offer.choices[0]};
    else cmd={op:'skip'};
  } else if(state.phase==='ITEM_CHOICE'){
    cmd=(state.offer.choices&&state.offer.choices.length)?{op:'item',id:state.offer.choices[0]}:{op:'skipItem'};
  } else if(state.phase==='EVENT_CHOICE'){
    cmd={op:'event',option:'B',id:state.events.choice.id};
  } else { stuck='未知 phase: '+state.phase; break; }

  cmd.revision=state.revision;
  if(cmd.op==='choose'||cmd.op==='item'||cmd.op==='reroll'||cmd.op==='skip'||cmd.op==='skipItem')cmd.windowId=state.offer.windowId;
  if(cmd.op==='event')cmd.windowId=state.offer.windowId;

  let r;
  try{ r=F.fullCommand(state,cmd); }
  catch(e){ console.log('\n!! 命令抛异常 at step '+steps+': '+cmd.op+' -> '+e.message); console.log('   state: '+show(state)); stuck='抛异常: '+e.message; break; }

  if(!r.ok){ console.log('\n!! 命令被拒绝 at step '+steps+': '+cmd.op+' -> '+r.error); console.log('   state: '+show(state)); stuck='拒绝: '+r.error; break; }

  const after=r.state.phase+'|'+r.state.spin+'|'+r.state.spinsRemaining;
  if(after===before && cmd.op!=='event'){ console.log('\n!! 状态未推进 at step '+steps+': '+cmd.op); stuck='无进展'; break; }
  state=r.state;
  if(steps%50===0)console.log('  step '+steps+': '+show(state));
}
if(steps>=MAXSTEPS){console.log('\n!! 达到步数上限，可能死循环');stuck='步数上限';}

console.log('\n=== 结果 ===');
console.log('总步数: '+steps);
console.log('最终: '+show(state));
console.log('卡住原因: '+(stuck||'无 —— 正常结束'));
