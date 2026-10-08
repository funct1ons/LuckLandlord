(function(root){
'use strict';
const F=root.GDD1;
const baseSymbols=F.clone(F.sliceSymbols),baseItems=F.clone(F.sliceItems),baseEvents=F.clone(F.sliceEvents);
const names={
 dock_chime:'栈桥鸣片',pitch_fork:'港音分叉',fog_reed:'雾笛簧',beat_spool:'拍点线轴',chord_frame:'和音框',prism_hum:'晶腔哼鸣器',silence_keeper:'静拍保管员',harbor_conductor:'港湾拍长',
 cargo_rope:'夜班扎绳',route_stub:'转栈短票',parcel_cage:'铜格货笼',sorting_runner:'分栈跑员',manifest_desk:'夜单台',switch_lamp:'换轨灯',transit_seal:'联运封蜡',return_station:'空箱返程站',
 pressure_pouch:'余压软袋',feed_valve:'添温小阀',pause_dial:'歇拍刻盘',surge_vessel:'脉冲釜',cracked_regulator:'裂缝调压器',safety_shim:'卸压薄衬',release_spire:'泄峰塔',demand_coupler:'配额耦合器',
 phase_chip:'偏相小片',spectrum_pin:'谱别别针',cloudy_negative:'雾面底片',blank_facet:'无谱晶坯',offset_reader:'偏印读头',alignment_cloth:'对相织布',echo_plate:'迟相印板',split_register:'双谱登记器',
 arrears_slip:'待核欠条',lean_receipt:'薄账回执',compliance_desk:'合规小台',cleared_stub:'核清存根',cancellation_clerk:'撤账员',quota_margin:'配额边签',advance_stamp:'先支邮戳',settlement_beacon:'清算信标'};
const groups=[
 ['dock_chime','pitch_fork','fog_reed','beat_spool','chord_frame','prism_hum','silence_keeper','harbor_conductor'],
 ['cargo_rope','route_stub','parcel_cage','sorting_runner','manifest_desk','switch_lamp','transit_seal','return_station'],
 ['pressure_pouch','feed_valve','pause_dial','surge_vessel','cracked_regulator','safety_shim','release_spire','demand_coupler'],
 ['phase_chip','spectrum_pin','cloudy_negative','blank_facet','offset_reader','alignment_cloth','echo_plate','split_register'],
 ['arrears_slip','lean_receipt','compliance_desk','cleared_stub','cancellation_clerk','quota_margin','advance_stamp','settlement_beacon']];
const tags=[['resonance','cargo'],['cargo'],['pressure'],['magic'],['contract']];
const rar=['common','common','common','uncommon','uncommon','uncommon','rare','epic'];
const base=[2,1,1,1,2,2,1,2];
for(let g=0;g<groups.length;g++)for(let i=0;i<8;i++){const id=groups[g][i];if(!F.sliceSymbols[id])F.sliceSymbols[id]={id,name:names[id],rarity:rar[i],tags:[...tags[g]],base:base[i],mechanics:{},effects:[],description:'数据驱动效果定义；按阶段登记执行'};}
// Full profile retains the frozen mechanics contract for all counter-bearing definitions.
// Pressure mechanisms remain structured {cap,reward} contracts; never replace
// inherited mechanisms with a numeric placeholder.
Object.assign(F.sliceSymbols.cloudy_negative && F.sliceSymbols.cloudy_negative.mechanics || {},{age:{threshold:3}});
Object.assign(F.sliceSymbols.ash_felt && F.sliceSymbols.ash_felt.mechanics || {},{age:{threshold:3,destroy:true}});
const itemNames=['露班轮历','根温绑带','苗圃轻秤','防寒窄窗','分温围裙','滞物登记本','边料回流槽','清栈细网','轨边拍板','休拍刻槽','音高记签','公用节拍器','盐雾内衬','分馏格尺','安瓿架','残液验章','夜单夹','空返侧轨','小舱限载牌','换装挂钩','压班索引','隔温披布','泄压回执','备用挡板','安全复写膜','谱类手册','对版定位针','增量底片册','薄账分页条','合规复核纸','稽核夹','余账灯'];
const itemR=['common','common','rare','uncommon','common','uncommon','rare','uncommon','common','uncommon','rare','uncommon','common','uncommon','rare','uncommon','common','uncommon','rare','uncommon','common','uncommon','rare','uncommon','common','uncommon','rare','uncommon','common','uncommon','rare','uncommon'];
F.ITEM_IDS.forEach((id,i)=>{if(!F.sliceItems[id])F.sliceItems[id]={id,name:itemNames[i]||id,rarity:itemR[i]||'common',effects:[],description:'持续道具；按 activationPhase → targetSelectionPhase → commitPhase 执行'};});
const eventData={event_fog_shift:['雾班调换',4,'plant'],event_copper_queue:['铜屑排队',0,'junk'],event_silent_bell:['停鸣通知',0,'resonance'],event_brine_inspection:['盐雾抽检',0,'feedstock'],event_empty_manifest:['空白夜单',0,'cargo'],event_boiler_test:['压锅试鸣',0,'pressure'],event_misprint_window:['错版窗口',6,'magic'],event_quota_recount:['配额复点',0,'contract']};
for(const [id,[name,cost,tag]] of Object.entries(eventData))if(!F.sliceEvents[id])F.sliceEvents[id]={id,name,cost,tag,op:'modifier',remaining:2,description:'可选事件；A/B确认事务，资格、成本、容量和到期均重新验证'};
F.fullSymbols=F.sliceSymbols;F.fullItems=F.sliceItems;F.fullEvents=F.sliceEvents;
// Frozen schema counter contracts are owned by contract.js, not by mutable content.
// Do not replace them while provisional full metadata is being registered.
F.sliceSymbols=baseSymbols;F.sliceItems=baseItems;F.sliceEvents=baseEvents;
F.defs=function(s){return s&&s.profile==='full-v1'?{symbols:F.fullSymbols,items:F.fullItems,events:F.fullEvents}:{symbols:F.sliceSymbols,items:F.sliceItems,events:F.sliceEvents}};
F.instance=function(s,type){const d=F.defs(s).symbols[type];if(!d)throw Error('Unknown symbol definition');const uid='u'+s.nextUid++;return{uid,type,permanent:0,epoch:0,counters:d.mechanics&&d.mechanics.age?{age:0}:d.mechanics&&d.mechanics.pressure?{pressure:0}:d.mechanics&&d.mechanics.cycle_count?{beat:0}:{}}};
F.FULL_INITIAL=['mist_pouch','mist_pouch','wick_bed','wick_bed','ash_felt','copper_burr','dock_chime','saline_ampoule','pressure_pouch','phase_chip','lean_receipt','spent_gasket'];
F.fullNewRun=function(seed){const s=F.createFoundationState(seed,'full-v1');s.pool=F.FULL_INITIAL.map(t=>F.instance(s,t));F.validateState(s);return s};
})(typeof window!=='undefined'?window:globalThis);