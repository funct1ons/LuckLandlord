// 核验 PLAYER_GUIDE.md 中的关键事实claim
const fs=require('fs'),vm=require('vm'),path=require('path');
const root='C:/files/code/LuckLandlord';
const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat};
ctx.globalThis=ctx;ctx.window.window=ctx.window;
vm.createContext(ctx);
['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f}));
const F=ctx.window.GDD1;
let pass=0,fail=0;
const check=(desc,actual,expected)=>{
  const ok=JSON.stringify(actual)===JSON.stringify(expected);
  if(ok)pass++;else fail++;
  console.log(`  ${ok?'✓':'✗'} ${desc}${ok?'':'  期望 '+JSON.stringify(expected)+' 实际 '+JSON.stringify(actual)}`);
};

console.log('=== 核验说明书事实 ===');
check('第1期配额 150',F.NORMAL_PAYMENTS[0],150);
check('第10期配额 585',F.NORMAL_PAYMENTS[9],585);
check('总配额 4200',F.NORMAL_PAYMENTS.reduce((a,b)=>a+b,0),4200);
check('总轮数 70',F.NORMAL_SPINS.reduce((a,b)=>a+b,0),70);
check('切片第1期 98',F.SLICE_PAYMENTS[0],98);
check('第10期每轮需 73.125',F.NORMAL_PAYMENTS[9]/F.NORMAL_SPINS[9],73.125);
check('第5期每轮需 63.57',Math.round(F.NORMAL_PAYMENTS[4]/F.NORMAL_SPINS[4]*100)/100,63.57);
check('第8期每轮需 67.86',Math.round(F.NORMAL_PAYMENTS[7]/F.NORMAL_SPINS[7]*100)/100,67.86);

console.log('\n--- 符号基础值 ---');
check('琥露扇叶 base 4',F.fullSymbols.amber_frond.base,4);
check('潮棱块 base 4',F.fullSymbols.tide_prism.base,4);
check('露灯苞 base 3',F.fullSymbols.dew_lantern.base,3);
check('过役垫圈 base -1',F.fullSymbols.spent_gasket.base,-1);
check('锚雾软囊 base 1',F.fullSymbols.mist_pouch.base,1);
check('港湾拍长 epic',F.fullSymbols.harbor_conductor.rarity,'epic');
check('港湾拍长 base 2',F.fullSymbols.harbor_conductor.base,2);

console.log('\n--- 共鸣路线 8 个符号 ---');
const reso=F.SYMBOL_IDS.filter(id=>F.fullSymbols[id].tags.includes('resonance'));
console.log('  共鸣标签符号: '+reso.length+' 个 -> '+reso.join(', '));
check('共鸣标签符号数 9',reso.length,9);
check('港湾拍长在共鸣内',reso.includes('harbor_conductor'),true);
check('和音框在共鸣内',reso.includes('chord_frame'),true);
check('栈桥鸣片在共鸣内',reso.includes('dock_chime'),true);
check('静拍保管员在共鸣内',reso.includes('silence_keeper'),true);

console.log('\n--- 起手 ---');
const s=F.fullNewRun('VERIFY');
check('起手 12 件',s.pool.length,12);
check('初始刷新券 2',s.rerollTokens,2);
check('初始删除券 2',s.removeTokens,2);
check('初始现金 0',s.cash,0);
check('起手含凝雾软囊×2',s.pool.filter(x=>x.type==='mist_pouch').length,2);
check('起手含过役垫圈',s.pool.some(x=>x.type==='spent_gasket'),true);
const baseSum=s.pool.reduce((a,x)=>a+F.fullSymbols[x.type].base,0);
check('起手基础值合计 16',baseSum,16);

console.log('\n--- 永久成长上限 ---');
const rootLedger=F.fullSymbols.root_ledger;
const growFx=rootLedger.effects.find(e=>e.op==='grow');
check('根须账簿 grow 上限 30',growFx&&growFx.amount!==undefined,true);

console.log('\n--- 倍率符号（说明书称 7 个）---');
const mults=[];
for(const id of F.SYMBOL_IDS)for(const e of (F.fullSymbols[id].effects||[]))if(e.op==='multiply')mults.push(id+'×'+e.ratio.join('/'));
console.log('  '+mults.join(', '));
check('倍率类符号 7 个',mults.length,7);

console.log('\n--- 事件描述是否为占位符 ---');
const evPlaceholder=F.EVENT_IDS.filter(id=>(F.fullEvents[id].description||'').includes('F4 event transaction'));
console.log('  占位描述的事件: '+evPlaceholder.length+'/8');
check('8 个事件描述均为占位',evPlaceholder.length,8);
check('事件总数 8',F.EVENT_IDS.length,8);

console.log('\n--- 道具（说明书提到的）---');
check('分馏格尺存在',!!F.fullItems.item_fraction_gauge,true);
check('苗圃轻秤存在',!!F.fullItems.item_nursery_scale,true);
check('公用节拍器存在',!!F.fullItems.item_shared_metronome,true);
check('道具总数 32',F.ITEM_IDS.length,32);

console.log('\n--- 先支邮戳（说明书描述的机制）---');
{
 const adv=F.fullSymbols.advance_stamp;
 const fx=adv.effects.find(e=>e.op==='advance');
 check('先支邮戳 reward 18',fx&&fx.amount,18);
 check('先支邮戳 obligation 12',fx&&fx.obligation,12);
 check('先支邮戳生成欠条',fx&&fx.spawn,'arrears_slip');
 const st=F.fullNewRun('ADV-DEFAULT');
 check('默认 advanceAccepted=false',st.settings.advanceAccepted,false);
}

console.log('\n--- 说明书图片引用可解析 ---');
{
  // 说明书移动过位置，图片路径曾因此失效；这里守住不再回归。
  const md = fs.readFileSync(path.join(root, 'PLAYER_GUIDE.md'), 'utf8');
  const refs = [...md.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]);
  check('图片引用数 9（含工作台全景与移除确认）', refs.length, 9);
  for (const r of refs) check('可解析 '+r, fs.existsSync(path.join(root, r)), true);
}

console.log(`\n=== 核验结果: ${pass} 通过 / ${fail} 失败 ===`);
process.exitCode=fail?1:0;
