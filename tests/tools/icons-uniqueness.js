const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,isFinite,parseInt,parseFloat};
ctx.globalThis=ctx;ctx.window.window=ctx.window;
vm.createContext(ctx);
['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js','js/gdd1UI/icons.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f}));
const F=ctx.window.GDD1,I=ctx.window.ICONS;
console.log('=== 道具图标唯一性 ===');
const seen=new Map();let dup=0;
for(const id of F.ITEM_IDS){const svg=I.itemSvg(id);if(seen.has(svg)){dup++;console.log('  碰撞: '+id+' == '+seen.get(svg));}else seen.set(svg,id);}
console.log('32 件道具 -> '+seen.size+' 种不同图标，碰撞 '+dup+' 次');
console.log('\n=== 符号图标唯一性（对照）===');
const s2=new Map();let d2=0;
for(const id of Object.keys(F.fullSymbols)){const svg=I.svg(id);if(s2.has(svg)){d2++;console.log('  碰撞: '+id+' == '+s2.get(svg));}else s2.set(svg,id);}
console.log('64 符号 -> '+s2.size+' 种不同图标，碰撞 '+d2+' 次');
