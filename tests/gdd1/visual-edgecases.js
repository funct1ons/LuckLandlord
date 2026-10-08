'use strict';
const assert=require('assert'),run=require('./shell-harness');
run(async({evaluate:e,key,call,shot,errors})=>{
 await e("document.getElementById('tutorial-choice').checked=true;document.getElementById('start-full').click();GDD1SETTINGS.set({musicVolume:0})");
 // Legal imported fixture, never a rules change or manually painted board.
 await e(`(()=>{const F=GDD1,s=F.fullNewRun('VISUAL-LONG');s.cash=888888888;s.pool=[];const defs=F.defs(s).symbols;Object.keys(defs).sort((a,b)=>defs[b].name.length-defs[a].name.length).slice(0,20).forEach(id=>s.pool.push(F.instance(s,id)));F.validateState(s);const d=new DataTransfer();d.items.add(new File([F.encode(s)],'long-values.json',{type:'application/json'}));const input=document.getElementById('import');input.files=d.files;input.dispatchEvent(new Event('change'));})()`);
 await e("new Promise((r,j)=>{let n=0;const t=setInterval(()=>{if(GDD1UI.getState().seed==='VISUAL-LONG'){clearInterval(t);r(true)}else if(n++>100){clearInterval(t);j(Error('fixture import timeout'))}},25)})");
 assert.equal(await e('document.documentElement.scrollWidth<=innerWidth'),true,'large cash/long names horizontal overflow');
 assert.equal(await e("document.querySelector('[data-op=spin]').getBoundingClientRect().bottom<=innerHeight"),true,'large cash must not push run out of viewport');
 const before=await e('GDD1.encode(GDD1UI.getState())');
 await e("document.getElementById('tab-pool').focus()");await key('ArrowRight');
 assert.equal(await e("document.getElementById('tab-items').getAttribute('aria-selected')"),'true');assert.equal(await e("document.getElementById('pool-panel').hidden"),true);
 await key('ArrowLeft');assert.equal(await e("document.getElementById('pool-panel').hidden"),false);
 assert.equal(await e('GDD1.encode(GDD1UI.getState())'),before,'cabinet tab does not change state');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await e("ANIM.getReducedMotion()&&ANIM.getSpeed()==='instant'"),true);
 await e("GDD1UI.send('spin');GDD1UI.send('skip')");
 assert.equal(await e('ANIM.isRunning()'),false);assert.equal(await e("GDD1UI.getState().phase"),'READY');assert.equal(await e('GDD1UI.getErrorReport()'),null);assert.equal(await e("document.querySelectorAll('#board > .cell').length"),20);
 await shot('tests/gdd1/visual-shots/extreme-values.png');
 await e("(()=>{const s=GDD1UI.getState(),bag=GDD1.defs(s).symbols;const id=Object.keys(bag).sort((a,b)=>GDD1TEXT.effect(b,'symbol',s).length-GDD1TEXT.effect(a,'symbol',s).length)[0];window.longId=id;GDD1DETAILS.open({kind:'symbol',id})})()");
 assert.equal(await e("document.querySelector('#overlay-details .detail-effect').textContent===GDD1TEXT.effect(longId,'symbol',GDD1UI.getState())"),true,'long effect must remain complete');
 assert.equal(await e('document.documentElement.scrollWidth<=innerWidth'),true);
 const snapshot=await e('GDD1.encode(GDD1UI.getState())');await e('GDD1SETTINGS.set({highContrast:true})');
 assert.equal(await e('GDD1.encode(GDD1UI.getState())'),snapshot);assert.equal(await e("document.documentElement.classList.contains('gdd1-high-contrast')"),true);
 await shot('tests/gdd1/visual-shots/long-effect-contrast.png');await key('Escape');
 assert.deepStrictEqual(errors,[]);console.log('PASS visual edge cases: large cash, long names/effects, cabinet keys, system reduced motion and contrast isolation');
}).catch(e=>{console.error(e);process.exitCode=1;});
