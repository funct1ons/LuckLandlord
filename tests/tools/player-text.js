'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
const sandbox={};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync(path.join(root,'js/gdd1UI/playerText.js'),'utf8'),sandbox);
const T=sandbox.GDD1TEXT;
let fail=0;
function check(name,ok){if(ok)console.log('PASS '+name);else{console.log('FAIL '+name);fail++;}}
const ids=Object.keys(T.CARDS);
check('64 production cards',ids.filter(id=>!id.startsWith('item_')&&!id.startsWith('event_')).length===64);
check('32 upgrades',ids.filter(id=>id.startsWith('item_')).length===32);
check('8 events',ids.filter(id=>id.startsWith('event_')).length===8);
check('every entry has purpose/effect',ids.every(id=>T.purpose(id)&&T.effect(id)));
check('event action API',ids.filter(id=>id.startsWith('event_')).every(id=>T.action(id)));
check('legacy API',typeof T.nameOf==='function'&&typeof T.defsOf==='function'&&typeof T.sanitize==='function'&&typeof T.copyableNote==='function');
check('no internal step wording',ids.every(id=>!/步骤\s*\d|ON_APPEAR|adjacency-add/.test(T.effect(id))));
check('all player prose is Chinese',ids.every(id=>!/[A-Za-z_]/.test(T.purpose(id)+T.effect(id)+(T.CARDS[id].action||''))));
for(const file of ['contract','schema','content','descriptions','full-content','full-effects']) {
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/gdd1/'+file+'.js'),'utf8'),sandbox,{filename:file+'.js'});
}
const F=sandbox.GDD1;
const before=JSON.stringify([F.fullSymbols,F.fullItems,F.fullEvents,F.sliceSymbols,F.sliceItems,F.sliceEvents]);
for(const profile of ['full-v1','slice-abd-v1']) {
  const state={profile},defs=T.defsOf(state);
  for(const [kind,bag] of [['symbol',defs.symbols],['item',defs.items],['event',defs.events]]) {
    check(profile+' '+kind+' coverage and names',Object.keys(bag).every(id=>T.CARDS[id]&&T.purpose(id,kind,state)&&T.effect(id,kind,state)&&T.nameOf(id,kind,state)===bag[id].name));
    if(kind==='symbol')check(profile+' bases match engine',Object.keys(bag).every(id=>T.effect(id,kind,state).startsWith('基础值 '+bag[id].base+'。')));
  }
}
check('no unrecognized extra entries',ids.every(id=>F.fullSymbols[id]||F.fullItems[id]||F.fullEvents[id]));
check('display calls do not mutate definitions',before===JSON.stringify([F.fullSymbols,F.fullItems,F.fullEvents,F.sliceSymbols,F.sliceItems,F.sliceEvents]));
check('sanitize converts known IDs and terms',T.sanitize('dew_lantern plant ON_APPEAR')==='露灯苞 植物 上盘时');
const required={
 advance_stamp:['18','12','默认拒绝','待入账','不撤销'],
 release_spire:['至少 3','尚未达到','本轮未释放','独立奖励 8'],
 quota_margin:['轮初','缺口不超过 15'],
 item_shared_metronome:['降低 1','最低 2','下一次上盘'],
 event_boiler_test:['应付 +12','现金 10','蓄压 +2','200'],
 event_misprint_window:['费用 6','前 3 次','最多一张','不补发']
};
for(const [id,parts] of Object.entries(required))check(id+' critical conditions',parts.every(x=>T.effect(id).includes(x)));
check('copyable filter follows numeric template contract',T.copyableNote({effects:[{copyable:true,op:'multiply',phase:'appearance',amount:2}]}).includes('没有'));
process.exitCode=fail?1:0;
