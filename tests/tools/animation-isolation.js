// 关键验证：动画/演出档位绝不能影响逻辑结果
// 方法：同一 seed 跑完整一局，逐命令比对不同 ANIM 档位下的状态哈希
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const root='C:/files/code/LuckLandlord';

function fresh(speed){
  const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat,crypto};
  ctx.globalThis=ctx;ctx.window.window=ctx.window;
  // 极简 DOM / matchMedia 桩，验证 anim.js 在无真实 DOM 时也不抛错
  const noop=()=>{};
  ctx.window.matchMedia=()=>({matches:false,addListener:noop,removeListener:noop});
  ctx.window.setTimeout=setTimeout;ctx.window.setInterval=setInterval;ctx.window.clearTimeout=clearTimeout;ctx.window.clearInterval=clearInterval;
  ctx.window.document={createElement:()=>({classList:{add:noop,remove:noop,contains:()=>false},style:{},dataset:{},appendChild:noop,children:[],innerHTML:'',remove:noop,getBoundingClientRect:()=>({left:0,top:0,width:0,height:0}),querySelector:()=>null}),querySelector:()=>null};
  vm.createContext(ctx);
  ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js','js/gdd1UI/icons.js','js/gdd1UI/anim.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f}));
  if(ctx.window.ANIM)ctx.window.ANIM.setSpeed(speed);
  return ctx.window;
}

function playThrough(speed,seed){
  const W=fresh(speed);
  const F=W.GDD1;
  let s=F.fullNewRun(seed);
  const trace=[];
  const cmd=(c)=>{const r=F.fullCommand(s,Object.assign({revision:s.revision,windowId:s.offer.windowId},c));if(!r.ok)throw Error(c.op+' -> '+r.error);s=r.state};
  for(let i=0;i<400;i++){
    if(s.phase==='WON'||s.phase==='LOST')break;
    if(s.phase==='READY'){cmd({op:'spin'});trace.push('spin')}
    else if(s.phase==='SYMBOL_CHOICE'){const c=s.offer.choices;const pick=(c&&c.length&&s.pool.length<200);cmd(pick?{op:'choose',id:c[0]}:{op:'skip'});trace.push(pick?'choose:'+c[0]:'skip')}
    else if(s.phase==='ITEM_CHOICE'){const c=s.offer.choices;const pick=(c&&c.length);cmd(pick?{op:'item',id:c[0]}:{op:'skipItem'});trace.push(pick?'item:'+c[0]:'skipItem')}
    else if(s.phase==='EVENT_CHOICE'){cmd({op:'event',option:'B',id:s.events.choice.id});trace.push('eventB')}
    else break;
  }
  return {phase:s.phase,cash:s.cash,spin:s.spin,stage:s.stageId,pool:s.pool.length,items:s.items.length,
    traceHash:crypto.createHash('sha256').update(trace.join('|')).digest('hex').slice(0,16),
    stateHash:crypto.createHash('sha256').update(JSON.stringify({c:s.cash,p:s.pool.map(x=>x.uid+':'+x.type+':'+x.permanent),i:s.items.slice().sort(),ph:s.phase,st:s.stageId,sp:s.spin})).digest('hex').slice(0,16)};
}

console.log('=== 动画档位隔离性验证（同 seed 三方对比）===');
const seeds=['ISO-A','ISO-B','ISO-C'];
let allMatch=true;
for(const seed of seeds){
  const n=playThrough('normal',seed), f=playThrough('fast',seed), i=playThrough('instant',seed);
  const same=n.stateHash===f.stateHash&&f.stateHash===i.stateHash;
  const traceSame=n.traceHash===f.traceHash&&f.traceHash===i.traceHash;
  if(!same||!traceSame)allMatch=false;
  console.log('  seed '+seed+': '+n.phase+' cash='+n.cash+' spin='+n.spin);
  console.log('    stateHash normal/fast/instant: '+n.stateHash+' / '+f.stateHash+' / '+i.stateHash+(same?'  ✓ 一致':'  ✗ 不一致'));
  console.log('    操作序列一致: '+(traceSame?'✓':'✗'));
}
console.log('\n结论: '+(allMatch?'✓ 动画档位完全不影响逻辑':'✗ 存在差异，必须修复'));

// 再验证：减少动态（prefers-reduced-motion）也走同一条逻辑
console.log('\n=== 减少动态模拟 ===');
{
 const ctx=fresh('normal');
 // 重新加载一个 matchMedia 返回 true 的环境
 const ctx2={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat,crypto};
 ctx2.globalThis=ctx2;ctx2.window.window=ctx2.window;
 const noop=()=>{};
 ctx2.window.matchMedia=()=>({matches:true});  // 系统偏好"减少动态"
 ctx2.window.setTimeout=setTimeout;ctx2.window.setInterval=setInterval;ctx2.window.clearTimeout=clearTimeout;ctx2.window.clearInterval=clearInterval;
 ctx2.window.document={createElement:()=>({classList:{add:noop,remove:noop,contains:()=>false},style:{},dataset:{},appendChild:noop,children:[],innerHTML:'',remove:noop,getBoundingClientRect:()=>({left:0,top:0,width:0,height:0}),querySelector:()=>null}),querySelector:()=>null};
 vm.createContext(ctx2);
 ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js','js/gdd1UI/anim.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx2,{filename:f}));
 const A=ctx2.window.ANIM;
 console.log('  getSpeed(): '+A.getSpeed()+'  shouldAnimate(): '+A.shouldAnimate());
 console.log('  '+(A.getSpeed()==='instant'&&!A.shouldAnimate()?'✓ 系统偏好生效，动画被禁用':'✗ 未生效'));
}
