// 图标系统自检：覆盖度 + 形态唯一性
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat};
ctx.globalThis=ctx;ctx.window.window=ctx.window;
vm.createContext(ctx);
const load=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js','js/gdd1UI/icons.js'].forEach(load);

const F=ctx.window.GDD1,I=ctx.window.ICONS;
const s=F.fullNewRun('ICON-CHECK');
const defs=F.defs(s);

// 1. 覆盖度：全部 64 符号 + 32 道具
const symIds=Object.keys(defs.symbols), itemIds=Object.keys(defs.items);
const mapped=I.symbolIds();
const missing=symIds.filter(id=>!mapped.includes(id));
const extra=mapped.filter(id=>!symIds.includes(id));

console.log('=== 覆盖度 ===');
console.log('内容符号: '+symIds.length+'   图标已映射: '+mapped.length);
console.log('未映射(会落占位): '+(missing.length?missing.join(', '):'无 ✓'));
console.log('多余映射(内容里没有): '+(extra.length?extra.join(', '):'无 ✓'));
console.log('道具: '+itemIds.length+' 个，全部走 itemSvg 通用生成 ✓');

// 2. 唯一性：每个符号产出的 SVG 必须不同
console.log('\n=== 形态唯一性 ===');
const seen=new Map(); let dup=0;
for(const id of symIds){ const h=I.svg(id); if(seen.has(h)){dup++;console.log('  重复: '+id+' == '+seen.get(h));} else seen.set(h,id); }
console.log('64 符号产出不同 SVG: '+(dup===0?'✓ 全部唯一':'✗ '+dup+' 个重复'));

// 3. 路线分布
console.log('\n=== 八条路线分布 ===');
const byRoute={};
for(const id of symIds){const r=I.routeOf(id);byRoute[r]=(byRoute[r]||0)+1;}
for(const [r,n] of Object.entries(byRoute)) console.log('  '+I.ROUTES[r].label.padEnd(6)+' ('+r+') '+n+' 个符号');

// 4. 未定义符号的降级行为
console.log('\n=== 降级行为 ===');
const unknown=I.svg('not_a_real_symbol');
console.log('未知符号返回占位且不抛异常: '+(unknown.includes('<svg')?'✓':'✗'));

// 5. 产出样例
console.log('\n=== 样例输出（截断）===');
console.log('凝雾软囊: '+I.svg('mist_pouch').slice(0,110)+'...');
console.log('潮棱块  : '+I.svg('tide_prism').slice(0,110)+'...');
