(async function(){
'use strict';
const cases=runGdd1F2Tests(),F=GDD1,frame=document.getElementById('ui'),J=JSON.stringify,A=(x,m)=>{if(!x)throw Error(m||'assert')},eq=(a,b)=>{const x=J(a),y=J(b);let i=0;while(i<Math.min(x.length,y.length)&&x[i]===y[i])i++;A(x===y,'bytes differ at '+i+': '+x.slice(i,i+160)+' / '+y.slice(i,i+160))};
const test=async(name,fn)=>{try{await fn();cases.push({name:'f2-ui/'+name,ok:true})}catch(e){cases.push({name:'f2-ui/'+name,ok:false,error:e.message})}};
const load=()=>new Promise((resolve,reject)=>{frame.onload=()=>{try{A(frame.contentWindow.GDD1UI,'UI boot');resolve()}catch(e){reject(e)}};frame.src='../../gdd1.html?f2='+Math.random()});
const win=()=>frame.contentWindow,doc=()=>frame.contentDocument,st=()=>win().GDD1UI.getState(),click=sel=>{const el=doc().querySelector(sel);A(el,'missing '+sel);el.click()},wait=()=>new Promise(r=>setTimeout(r,10));
const importState=async s=>{const w=win(),file=new w.File([J(s)],'f2.json',{type:'application/json'}),dt=new w.DataTransfer();dt.items.add(file);const input=doc().getElementById('import');input.files=dt.files;await input.onchange({target:input})};
let checkpoint;
try{
 const mode=new URLSearchParams(location.search).get('mode')||'write';
 if(mode==='write'){localStorage.removeItem(F.SAVE_KEY);localStorage.setItem(F.LEGACY_KEYS[0],'{"version":1,"cash":777}');localStorage.setItem('f2-legacy-bytes',localStorage.getItem(F.LEGACY_KEYS[0]))}
 await load();win().confirm=()=>true;
 if(mode==='write'){
 await test('actual-new-spin-pending-board',async()=>{click('#new');eq(st().pool.length,12);click('[data-op="spin"]');A(st().phase==='SYMBOL_CHOICE');eq(st().cash,0);eq(doc().querySelectorAll('.cell').length,20);eq(doc().querySelectorAll('.choice').length,3);checkpoint=st();localStorage.setItem('f2-checkpoint',J(checkpoint))});
 await test('reload-pending-exact-no-rng-replay',async()=>{await load();win().confirm=()=>true;eq(st(),checkpoint);eq(st().pendingSettlement,checkpoint.last.total)});
 await test('actual-refresh-remove-choose',async()=>{click('[data-op="reroll"]');eq(st().offer.choiceRefreshesUsed,1);const uid=st().pool[0].uid;click('[data-uid="'+uid+'"]');A(!st().pool.some(x=>x.uid===uid));const pending=st().pendingSettlement;click('[data-op="choose"]');eq(st().cash,pending);eq(st().phase,'READY')});
 await test('actual-payment-item-choice-stage-setup',async()=>{let s=st();s.cash=10000;await importState(s);for(let i=s.stageSpin;i<6;i++){click('[data-op="spin"]');click('[data-op="skip"]')}eq(st().phase,'ITEM_CHOICE');s=st();await load();win().confirm=()=>true;eq(st(),s);click('[data-op="item"]');eq(st().stageId,2);eq(st().items.length,1);eq(st().phase,'READY')});
 await test('event-target-required-confirm-reload',async()=>{let s=F.sliceNewRun('UI-event');s.stageId=3;s.spin=12;s.stageSpin=0;s.spinsRemaining=7;s.basePayment=s.payment=137;s.cash=20;s.itemState.stageId=3;s.itemState.spin=12;s.last={spin:12,total:0,reward:0,board:Array(20).fill(null),ledger:[],log:[]};s.phase='EVENT_CHOICE';s.events={seenIds:['event_fog_shift'],count:1,cooldownPayments:1,activeModifiers:[],choice:{id:'event_fog_shift',options:['A','B'],targetUids:F.sliceEventTargets(s,'event_fog_shift'),cost:4,stageId:3}};await importState(s);eq(st(),s);await load();win().confirm=()=>true;eq(st(),s);click('[data-option="A"]');eq(st(),s);doc().getElementById('event-target').value='u1';click('[data-option="A"]');eq(st().cash,16);eq(st().events.activeModifiers[0].uid,'u1');eq(st().phase,'READY')});
 await test('import-render-fault-atomic',async()=>{const before=st(),bytes=localStorage.getItem(F.SAVE_KEY),create=doc().createElement.bind(doc());doc().createElement=()=>{throw Error('injected render fault')};try{const next=F.clone(before);next.cash=99;await importState(next)}finally{doc().createElement=create}eq(st(),before);eq(localStorage.getItem(F.SAVE_KEY),bytes);A(doc().getElementById('notice').textContent.includes('injected'))});
 await test('import-storage-fault-atomic',async()=>{const before=st(),bytes=localStorage.getItem(F.SAVE_KEY),proto=win().Storage.prototype,original=proto.setItem;proto.setItem=function(){throw Error('injected quota fault')};try{const next=F.clone(before);next.cash=999;await importState(next)}finally{proto.setItem=original}eq(st(),before);eq(localStorage.getItem(F.SAVE_KEY),bytes)});
 await test('export-download-real-control',async()=>{let downloads=0;const proto=win().HTMLAnchorElement.prototype,old=proto.click;proto.click=function(){A(this.download.endsWith('.json'));A(this.href.startsWith('blob:'));downloads++};try{click('#export')}finally{proto.click=old}eq(downloads,1)});
 await test('mobile-layout-no-horizontal-overflow',async()=>{frame.style.width='390px';win().dispatchEvent(new (win().Event)('resize'));await wait();A(doc().documentElement.scrollWidth<=win().innerWidth+1,'horizontal overflow');frame.style.width='1200px'});
 await test('preserve-legacy-bytes',async()=>eq(localStorage.getItem(F.LEGACY_KEYS[0]),localStorage.getItem('f2-legacy-bytes')));
 await test('cross-process-stable-checkpoint',async()=>{click('[data-op="spin"]');checkpoint=st();localStorage.setItem('f2-final-checkpoint',J(checkpoint));click('#save')});
 }else{
 await test('cross-process-reload-exact-pending',async()=>{checkpoint=JSON.parse(localStorage.getItem('f2-final-checkpoint'));eq(st(),checkpoint);A(st().phase==='SYMBOL_CHOICE');eq(st().cash,checkpoint.cash)});
 await test('legacy-still-immutable',async()=>eq(localStorage.getItem(F.LEGACY_KEYS[0]),localStorage.getItem('f2-legacy-bytes')));
 }
}catch(e){cases.push({name:'f2-ui/harness',ok:false,error:e.stack})}
const out={total:cases.length,passed:cases.filter(c=>c.ok).length,cases,engineCases:cases.filter(c=>!c.name.startsWith('f2-ui/')),checkpoint,protocol:location.protocol,userAgent:navigator.userAgent};document.getElementById('result').textContent=J(out);document.documentElement.dataset.passed=String(out.total===out.passed);
})();
