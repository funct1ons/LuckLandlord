(function(root){
'use strict';
const F=root.GDD1;
const effect=(phase,op,extra)=>Object.assign({phase,op},extra||{});
const adj=(tag,extra)=>Object.assign({scope:'adjacent',tag},extra||{});
const all=tag=>({scope:'all',tag});
const self={scope:'self'};
const rows=[
['mist_pouch','凝雾软囊','common','plant mist',1,{age:{threshold:3,to:'dew_lantern'}}],['wick_bed','灯芯苗床','common','plant fuel',2,{}],['dew_lantern','露灯苞','uncommon','plant mist product',3,{age:{threshold:2,to:'amber_frond'}}],['amber_frond','琥露扇叶','uncommon','plant fuel product cargo',4,{},[effect('listen','reward',{event:'consume',match:{targetSelf:true},amount:4})]],['fog_stitcher','补雾工','uncommon','machine support',1,{},[effect('age-extra','age',{selector:adj('plant',{age:true}),amount:1})]],['root_ledger','根须账簿','rare','plant contract',1,{},[effect('listen','grow',{event:'transform',match:{beforeTag:'plant'},amount:1,limit:2})]],['warm_pod','温灯荚','common','plant pressure',1,{},[effect('appearance','add',{selector:self,predicate:{count:adj('fuel'),min:1},amount:3})]],['nursery_gauge','苗圃指针','rare','machine plant',2,{},[effect('summary','multiply',{selector:all('plant'),predicate:{events:'transform',min:2},ratio:[3,2]})]],
['ash_felt','灰温毡','common','scrap fuel',1,{age:{threshold:3,destroy:true}},[effect('listen','spawn',{event:'consume',match:{targetSelf:true},type:'copper_burr'}),effect('end','destroy',{selector:self,predicate:{counter:'age',min:3},reward:3,cause:'self_mature'})]],['sorting_tong','分温夹','common','machine',1,{},[effect('structure','consume',{selector:adj('scrap'),reward:6})]],['copper_burr','铜毛刺','common','scrap product cargo',2,{},[effect('appearance','add',{selector:self,predicate:{count:adj('machine'),min:1},amount:2})]],['spent_gasket','过役垫圈','common','scrap junk',-1,{candidate:false}],['sieve_drum','除滞滚筒','uncommon','machine support',2,{},[effect('structure','transform',{selector:adj('junk'),type:'copper_burr'})]],['heat_clerk','余温录员','uncommon','machine contract',1,{},[effect('listen','grow',{event:'consume',match:{beforeTag:'scrap'},amount:1})]],['clinker_router','灰渣分路器','rare','machine pressure',2,{},[effect('structure','destroy',{selector:adj('junk')}),effect('listen','pressure',{event:'destroy',match:{beforeTag:'junk',notCause:'consume'},selector:all('pressure'),amount:2})]],['furnace_auditor','炉账稽核灯','rare','machine',2,{},[effect('summary','multiply',{selector:all('machine'),predicate:{events:'consume',min:2},ratio:[3,2]})]],
['brine_strip','盐雾滤带','common','mist feedstock',1,{age:{threshold:2,to:'saline_ampoule'}}],['saline_ampoule','微盐安瓿','common','feedstock cargo',2,{}],['condense_coil','凝潮盘管','common','machine',1,{},[effect('structure','transform',{selector:adj('feedstock'),type:'tide_prism'})]],['tide_prism','潮棱块','uncommon','crystal product cargo',4,{},[effect('listen','add',{event:'transform',match:{targetSelf:true},amount:3})]],['deep_still','深盐分馏器','uncommon','machine',2,{},[effect('structure','consume',{selector:adj('mist'),reward:4,spawn:'saline_ampoule'})]],['crystal_index','晶层索引','uncommon','crystal support',1,{},[effect('appearance','add',{selector:self,predicate:{count:all('crystal'),distinct:true,min:2},amount:6})]],['pearl_separator','浮珠分离器','rare','machine',2,{},[effect('structure','transform',{selector:adj('crystal',{notTag:'product'}),type:'tide_prism'})]],['reserve_facet','留温晶面','rare','crystal pressure',2,{pressure:{cap:6,reward:18}},[effect('structure','consume',{selector:adj('fuel'),reward:2,pressure:2})]]
];
F.sliceSymbols=Object.fromEntries(rows.map(([id,name,rarity,tags,base,mechanics,effects=[]])=>[id,{id,name,rarity,tags:tags.split(' '),base,mechanics,effects:effects.map((e,i)=>Object.assign({key:id+':'+i,limit:1},e))}]));
const items=[['dew_calendar','露班轮历','common',[effect('step3','age',{selector:all('plant'),age:true,amount:1})]],['root_wrap','根温绑带','uncommon',[effect('listen','add',{event:'transform',match:{beforeTag:'plant'},amount:4})]],['frost_glass','防寒窄窗','uncommon',[effect('initial','add',{selector:all('mist'),amount:3,limit:2})]],['sorting_apron','分温围裙','common',[effect('listen','reward',{event:'consume',match:{beforeTag:'scrap'},amount:3})]],['waste_log','滞物登记本','uncommon',[effect('listen','token',{event:'destroy',match:{beforeTag:'junk'},threshold:3,resource:'removeTokens',amount:1})]],['offcut_chute','边料回流槽','rare',[effect('listen','spawn',{event:'consume',match:{beforeTag:'scrap'},type:'ash_felt'})]],['clean_mesh','清栈细网','uncommon',[effect('step1','weight',{tag:'junk',ratio:[1,2]})]],['brine_lining','盐雾内衬','common',[effect('listen','add',{event:'transform',match:{beforeTag:'feedstock',afterTag:'crystal'},amount:4})]],['fraction_gauge','分馏格尺','uncommon',[effect('change','reward',{predicate:{count:all('crystal'),distinct:true,min:3},amount:7})]],['residue_stamp','残液验章','uncommon',[effect('listen','reward',{event:'consume',match:{beforeTag:'mist'},amount:2})]]];
F.sliceItems=Object.fromEntries(items.map(([suffix,name,rarity,effects])=>{const id='item_'+suffix;return[id,{id,name,rarity,effects}]}));
F.sliceEvents={event_fog_shift:{name:'雾班调换',tag:'plant',age:true,cost:4,op:'modifier',remaining:2},event_copper_queue:{name:'铜屑排队',tag:'junk',cost:0,op:'transform',type:'copper_burr',spawn:'spent_gasket'},event_brine_inspection:{name:'盐雾抽检',tag:'feedstock',cost:0,op:'remove',guarantee:'eventCrystalPending'}};
// Listener permissions and windows are explicit data, not resolver type branches.
F.sliceSymbols.amber_frond.effects[0].deathAllowed=true;
F.sliceSymbols.ash_felt.effects[0].deathAllowed=true;
F.sliceSymbols.clinker_router.effects[1].match.notCause='consume';
F.sliceSymbols.clinker_router.effects[1].limit=2;
F.sliceSymbols.clinker_router.effects[1].selector.pressureMechanism=true;
Object.assign(F.sliceSymbols.nursery_gauge.effects[0],{each:true});
Object.assign(F.sliceSymbols.nursery_gauge.effects[0].predicate,{beforeTag:'plant'});
Object.assign(F.sliceSymbols.furnace_auditor.effects[0],{each:true});
Object.assign(F.sliceSymbols.furnace_auditor.effects[0].predicate,{beforeTag:'scrap',distinct:true});
F.sliceSymbols.tide_prism.effects[0].match.afterSelfType=true;
F.sliceItems.item_dew_calendar.effects[0].selector.age=true;
Object.assign(F.sliceItems.item_root_wrap.effects[0],{eventTarget:true});
Object.assign(F.sliceItems.item_brine_lining.effects[0],{eventTarget:true});
Object.assign(F.sliceItems.item_frost_glass.effects[0],{window:'stage',each:true});
Object.assign(F.sliceItems.item_waste_log.effects[0],{window:'stage'});
F.sliceItems.item_waste_log.effects[0].match.notCause='consume';
F.sliceItems.item_offcut_chute.effects[0].match.notBeforeTag='junk';
for(const d of Object.values(F.sliceItems))d.effects=d.effects.map((e,i)=>Object.assign({key:d.id+':'+i,limit:1},e));
F.instance=function(s,type){const d=F.sliceSymbols[type];if(!d)throw Error('Unknown slice definition');const uid='u'+s.nextUid++;return{uid,type,permanent:0,epoch:0,counters:d.mechanics.age?{age:0}:d.mechanics.pressure?{pressure:0}:{}}};
F.sliceNewRun=function(seed){const s=F.createFoundationState(seed,'slice-abd-v1');const types=['mist_pouch','mist_pouch','wick_bed','wick_bed','ash_felt','ash_felt','copper_burr','copper_burr','saline_ampoule','saline_ampoule','brine_strip','spent_gasket'];s.pool=types.map(t=>F.instance(s,t));F.validateState(s);return s};
})(typeof window!=='undefined'?window:globalThis);
