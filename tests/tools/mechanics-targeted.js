// 定向验证 v2：循环直到邻接条件满足，并打印真实 action 名称
const fs=require('fs'),vm=require('vm'),path=require('path');
const root='C:/files/code/LuckLandlord';
function fresh(){
  const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat};
  ctx.globalThis=ctx;ctx.window.window=ctx.window;
  vm.createContext(ctx);
  ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f}));
  return ctx.window.GDD1;
}
const F=fresh();
const cmd=(s,c)=>{const r=F.fullCommand(s,Object.assign({revision:s.revision,windowId:s.offer.windowId},c));return r};
function pool(seed,types){const s=F.fullNewRun(seed);s.pool=types.map(t=>F.instance(s,t));return s}

// 反复尝试直到出现目标 action
function seek(types,n,action,extra){
  for(let i=0;i<n;i++){
    let s=pool('SEEK-'+action+'-'+i,types);
    if(extra)Object.assign(s,extra(s)||{});
    const r=cmd(s,{op:'spin'});if(!r.ok)continue;
    const hits=r.state.last.log.filter(x=>x.action===action);
    if(hits.length)return{state:r.state,hits,attempt:i+1};
  }
  return null;
}

console.log('=== 1. 保留位 reserve ===');
{
 const found=seek(['switch_lamp','cleared_stub','cleared_stub','wick_bed','saline_ampoule','copper_burr'],60,'reserve');
 if(found){console.log('   第 '+found.attempt+' 次尝试出现 reserve ✓');
  console.log('   保留记录: '+JSON.stringify(found.state.reservations));
  // 下一轮保留是否生效：保留的 UID 应回到原格
  const res=found.state.reservations[0];
  const r2=cmd(found.state,{op:'choose',id:found.state.offer.choices[0]});
  if(r2.ok){const r3=cmd(r2.state,{op:'spin'});
   if(r3.ok){const cellPos=r3.state.last.board.findIndex(c=>c&&c.uid===res.uid);
    console.log('   下一轮该实例落位: '+cellPos+'   预约格位: '+res.pos+(cellPos===res.pos?'  ✓ 保留生效':'  (位置被占用或已失效)'));
    const rLog=r3.state.last.log.filter(x=>x.action==='reserve');
    console.log('   下一轮 reserve 动作: '+rLog.length);
   }}
 } else console.log('   60 次尝试未出现（邻接未满足）');
}

console.log('\n=== 2. 复制 copy（offset_reader 邻接 copyable）===');
{
 const found=seek(['offset_reader','blank_facet','pause_dial','cleared_stub','wick_bed'],80,'copy');
 if(found){console.log('   第 '+found.attempt+' 次尝试出现 copy ✓');
  console.log('   复制量: '+found.hits.map(x=>x.amount).join(', '));
 } else console.log('   80 次尝试未出现');
}

console.log('\n=== 3. 消耗 consume（sorting_runner 邻接 product）===');
{
 const found=seek(['sorting_runner','cleared_stub','dew_lantern','wick_bed'],60,'consume');
 if(found){console.log('   第 '+found.attempt+' 次尝试出现 consume ✓');
  const rw=found.state.last.log.filter(x=>x.action==='reward');
  console.log('   奖励动作: '+(rw.length?rw.map(x=>x.amount).join(', '):'（无）'));
 } else console.log('   60 次尝试未出现');
}

console.log('\n=== 4. 阶段义务 advance（确认 action 名与效果）===');
{
 const s=pool('ADV-2',['advance_stamp','wick_bed','saline_ampoule']);
 s.settings.advanceAccepted=true;
 const payBefore=s.payment;
 const r=cmd(s,{op:'spin'});
 if(r.ok){
  console.log('   payment: '+payBefore+' -> '+r.state.payment);
  console.log('   本轮全部 action: '+[...new Set(r.state.last.log.map(x=>x.action))].join(', '));
  const advLog=r.state.last.log.filter(x=>x.facts&&String(x.facts.cause||'').includes('advance'));
  console.log('   cause 含 advance 的动作: '+advLog.length);
  console.log('   本阶段义务: '+JSON.stringify(r.state.stageState.paymentModifiers));
  console.log('   生成欠条: '+(r.state.pool.some(x=>x.type==='arrears_slip')?'✓':'✗'));
  const reward=r.state.last.reward;
  console.log('   独立奖励: '+reward+(reward>=18?'  ✓ 含 +18':''));
 }
}

console.log('\n=== 5. 道具通过正式路径获取 ===');
{
 // 走到 ITEM_CHOICE 再选道具，之后验证效果
 let s=F.fullNewRun('ITEM-PATH');
 let got=null;
 for(let i=0;i<200;i++){
  if(s.phase==='READY'){const r=cmd(s,{op:'spin'});if(!r.ok)break;s=r.state}
  else if(s.phase==='SYMBOL_CHOICE'){const c=s.offer.choices;const r=cmd(s,(c&&c.length&&s.pool.length<200)?{op:'choose',id:c[0]}:{op:'skip'});if(!r.ok)break;s=r.state}
  else if(s.phase==='ITEM_CHOICE'){const c=s.offer.choices;const r=cmd(s,(c&&c.length)?{op:'item',id:c[0]}:{op:'skipItem'});if(!r.ok)break;s=r.state;got=s.items.slice();if(got.length>=3)break}
  else if(s.phase==='EVENT_CHOICE'){const r=cmd(s,{op:'event',option:'B',id:s.events.choice.id});if(!r.ok)break;s=r.state}
  else break;
 }
 console.log('   已获得道具: '+(got&&got.length?got.join(', '):'（无）'));
 if(got&&got.length){
  // 用获得道具的状态继续跑，检查道具是否产生动作
  let st=s;const itemActions=new Set();
  for(let i=0;i<60;i++){
   if(st.phase==='READY'){const r=cmd(st,{op:'spin'});if(!r.ok)break;st=r.state}
   else if(st.phase==='SYMBOL_CHOICE'){if(st.last)for(const row of st.last.log)if(String(row.source).startsWith('item_'))itemActions.add(row.source+'/'+row.action);
    const c=st.offer.choices;const r=cmd(st,(c&&c.length&&st.pool.length<200)?{op:'choose',id:c[0]}:{op:'skip'});if(!r.ok)break;st=r.state}
   else if(st.phase==='ITEM_CHOICE'){const c=st.offer.choices;const r=cmd(st,(c&&c.length)?{op:'item',id:c[0]}:{op:'skipItem'});if(!r.ok)break;st=r.state}
   else if(st.phase==='EVENT_CHOICE'){const r=cmd(st,{op:'event',option:'B',id:st.events.choice.id});if(!r.ok)break;st=r.state}
   else break;
  }
  console.log('   道具产生的动作: '+(itemActions.size?[...itemActions].join(', '):'（本轮未触发，属正常——取决于盘面）'));
 }
}
