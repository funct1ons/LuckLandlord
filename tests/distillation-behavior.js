'use strict';
(function (G) {
  const A=[];
  const fail=(m)=>{throw Error(m)};
  const ok=(v,m)=>{if(!v)fail(m)};
  const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))fail(`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)};
  function state(types){const s=G.newRun('DISTILLATION-BEHAVIOR');s.symbols=[];types.forEach(t=>s.symbols.push(G.instance(s,t)));return s;}
  function resolve(types, positions){const s=state(types);const b=(positions||types.map((_,i)=>i)).map(i=>s.symbols[i].uid);return {s,r:G.resolve(s,b)};}
  function run(id,name,fn){A.push({name:`distillation/${id}/${name}`,fn});}
  run('brine_strip','before-threshold',()=>eq(resolve(['brine_strip']).r.board[0].type,'brine_strip','一次上盘不转换'));
  run('brine_strip','threshold-converts',()=>{const {s}=resolve(['brine_strip']);s.symbols[0].counters.age=1;eq(G.resolve(s,[s.symbols[0].uid]).board[0].type,'saline_ampoule','第二次上盘转换');});
  run('brine_strip','uid-and-counter-clear',()=>{const {s}=resolve(['brine_strip']);const uid=s.symbols[0].uid;s.symbols[0].counters.age=1;s.symbols[0].permanent=7;const r=G.resolve(s,[uid]);eq(r.board[0].uid,uid,'转换保留UID');eq(s.symbols[0].permanent,7,'通用永久值保留');eq(s.symbols[0].counters,{},'类型计数清空');});
  run('saline_ampoule','exact-base',()=>eq(resolve(['saline_ampoule']).r.ledger[0].amount,2,'基础值精确为2'));
  run('saline_ampoule','no-hidden-effect',()=>{const r=resolve(['saline_ampoule']).r;eq(r.reward,0,'无独立奖励');eq(r.ledger[0].multiplier,1,'无倍率');});
  run('saline_ampoule','stable-direct',()=>eq(resolve(['saline_ampoule']).r.board[0].type,'saline_ampoule','直接抽中保留类型'));
  run('condense_coil','single-target',()=>{const {s,r}=resolve(['condense_coil','saline_ampoule','saline_ampoule']);eq(r.log.filter(x=>x.type==='transform').length,1,'每轮只转换一个原液');eq(s.symbols[2].type,'saline_ampoule','第二个目标未转换');});
  run('condense_coil','no-feedstock',()=>{const r=resolve(['condense_coil']).r;ok(!r.log.some(x=>x.type==='transform'),'无目标无转换');});
  run('condense_coil','product-boundary',()=>{const {s,r}=resolve(['condense_coil','tide_prism']);eq(r.log.filter(x=>x.type==='transform').length,0,'成品不属于feedstock');eq(s.symbols[1].type,'tide_prism','成品不变');});
  run('tide_prism','direct-no-bonus',()=>{const r=resolve(['tide_prism']).r;eq(r.ledger[0].amount,4,'直接抽中只有基础4');});
  run('tide_prism','transform-bonus',()=>{const {s,r}=resolve(['condense_coil','saline_ampoule']);eq(r.ledger.find(x=>x.type==='tide_prism').amount,7,'转换成为潮棱本轮加3');});
  run('tide_prism','conversion-no-appear',()=>{const {s,r}=resolve(['condense_coil','saline_ampoule']);ok(!r.log.some(x=>x.event==='ON_APPEAR'&&x.source===s.symbols[1].uid),'转换产物不重触发出现');});
  run('deep_still','consume-reward',()=>{const {r}=resolve(['deep_still','mist_pouch']);eq(r.reward,4,'成功消耗雾料独立奖励4');});
  run('deep_still','single-mist',()=>{const {s,r}=resolve(['deep_still','mist_pouch','mist_pouch']);eq(r.log.filter(x=>x.type==='consume').length,1,'只消耗一个雾料');eq(s.symbols.filter(x=>x.type==='mist_pouch').length,1,'另一个雾料保留');});
  run('deep_still','spawn-next-pool',()=>{const {s}=resolve(['deep_still','mist_pouch']);G.resolve(s,s.symbols.map(x=>x.uid));ok(s.symbols.some(x=>x.type==='saline_ampoule'),'成功消耗后生成安瓿进入池');});
  run('crystal_index','same-type-negative',()=>{const r=resolve(['crystal_index']).r;eq(r.ledger[0].amount,1,'仅自身晶体不满足异型门槛');});
  run('crystal_index','different-type-positive',()=>{const r=resolve(['crystal_index','tide_prism','blank_facet']).r;eq(r.ledger[0].amount,7,'两种crystal type加6');});
  run('crystal_index','one-type-boundary',()=>{const r=resolve(['crystal_index']).r;eq(r.ledger[0].amount,1,'仅一种晶体不触发');});
  run('pearl_separator','non-product-positive',()=>{const {s,r}=resolve(['pearl_separator','blank_facet']);eq(s.symbols[1].type,'tide_prism','非product晶体转为潮棱');ok(r.log.some(x=>x.type==='transform'),'记录转换事件');});
  run('pearl_separator','product-negative',()=>{const {s,r}=resolve(['pearl_separator','tide_prism']);eq(s.symbols[1].type,'tide_prism','product晶体排除');eq(r.log.filter(x=>x.type==='transform').length,0,'无错误转换');});
  run('pearl_separator','single-target',()=>{const {r}=resolve(['pearl_separator','blank_facet','blank_facet']);eq(r.log.filter(x=>x.type==='transform').length,1,'多个晶坯只选一个');});
  run('reserve_facet','consume-and-pressure',()=>{const {s,r}=resolve(['reserve_facet','wick_bed']);eq(r.reward,2,'消耗燃料奖励2');ok(!s.symbols.some(x=>x.type==='wick_bed'),'燃料被成功消耗');});
  run('reserve_facet','release-boundary',()=>{const s=state(['reserve_facet','wick_bed']);s.symbols[0].counters.pressure=4;const r=G.resolve(s,s.symbols.map(x=>x.uid));eq(r.reward,20,'达到6在轮末释放18并保留消费奖励2');eq(s.symbols[0].counters.pressure,0,'释放后清零');});
  run('reserve_facet','cap-six',()=>{const {s}=resolve(['reserve_facet','wick_bed']);s.symbols[0].counters.pressure=5;G.resolve(s,s.symbols.map(x=>x.uid));ok(s.symbols[0].counters.pressure<=6,'蓄压不超过6');});
  run('reserve_facet','two-instance-source-target-reward-pressure',()=>{const s=state(['reserve_facet','wick_bed','reserve_facet','wick_bed']);const u0=s.symbols[0].uid,u1=s.symbols[1].uid,u2=s.symbols[2].uid,u3=s.symbols[3].uid;s.symbols[0].counters.pressure=4;s.symbols[2].counters.pressure=4;const r=G.resolve(s,[u0,u1,u2,u3]);const consumes=r.log.filter(x=>x.type==='consume');const counters=r.log.filter(x=>x.type==='counter'&&x.event==='ON_CONSUME');eq(consumes.map(x=>[x.source,x.target]),[[u0,u1],[u2,u3]],'两个消费 source/target UID 稳定');eq(counters.map(x=>[x.source,x.payload.source,x.payload.target]),[[u0,u0,u1],[u2,u2,u3]],'pressure counter 只归因自身 source');eq(r.reward,40,'两次消费2+2与两次释放18+18');eq(r.ledger.filter(x=>x.type==='reserve_facet').map(x=>x.amount),[2,2],'最终账本保留两格基础产出');});
  run('reserve_facet','competing-reserves-one-fuel',()=>{const s=state(['reserve_facet','wick_bed','reserve_facet']);const u0=s.symbols[0].uid,uf=s.symbols[1].uid,u2=s.symbols[2].uid;s.symbols[0].counters.pressure=4;s.symbols[2].counters.pressure=4;const r=G.resolve(s,[u0,uf,u2]);eq(r.log.filter(x=>x.type==='consume').length,1,'竞争同 fuel 仅一次消费');eq(r.reward,20,'成功者消费2并释放18');eq(s.symbols[0].counters.pressure,0,'成功来源释放');eq(s.symbols.find(x=>x.uid===u2).counters.pressure,4,'失败来源不偷加 pressure');});
  run('reserve_facet','non-source-event-does-not-counter',()=>{const s=state(['reserve_facet','reserve_facet','wick_bed']);const u0=s.symbols[0].uid,u1=s.symbols[1].uid,uf=s.symbols[2].uid;s.symbols[0].counters.pressure=4;s.symbols[1].counters.pressure=4;const r=G.resolve(s,[u0,u1,uf]);ok(r.log.some(x=>x.type==='counter'&&x.payload&&x.payload.source===u1&&x.source===u1),'自身消费 counter 存在');eq(s.symbols.find(x=>x.uid===u0).counters.pressure,4,'非消费源不增加或清零 counter');});
  run('reserve_facet','per-spin-limit-resets',()=>{const s=state(['reserve_facet','wick_bed']);const uid=s.symbols[0].uid;const fuel=s.symbols[1].uid;let r=G.resolve(s,[uid,fuel]);eq(r.log.filter(x=>x.type==='consume').length,1,'第一轮消费一次');const extra=G.instance(s,'wick_bed');s.symbols.push(extra);r=G.resolve(s,[uid,extra.uid]);eq(r.log.filter(x=>x.type==='consume').length,1,'下一轮限额重置后可再次消费');});
  run('reserve_facet','three-independent-reserves',()=>{const s=state(['reserve_facet','wick_bed','reserve_facet','wick_bed','reserve_facet','wick_bed']);const ids=s.symbols.map(x=>x.uid);for(const i of [0,2,4])s.symbols[i].counters.pressure=4;const board=Array(20).fill(null);[[0,ids[0]],[1,ids[1]],[5,ids[2]],[6,ids[3]],[10,ids[4]],[11,ids[5]]].forEach(([p,u])=>board[p]=u);const r=G.resolve(s,board);eq(r.log.filter(x=>x.type==='consume').length,3,'三实例各自成功消费');eq(r.reward,60,'三次消费与三次释放独立结算');});
  G.distillationBehaviorTests=()=>A.map(t=>{try{t.fn();return {name:t.name,ok:true}}catch(e){return {name:t.name,ok:false,error:e.message}}});
})(window.Game);
