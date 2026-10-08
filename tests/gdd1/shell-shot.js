'use strict';
const assert=require('assert'),run=require('./shell-harness');
(async()=>{
await run(async({evaluate:e,key,resize,shot,errors,requests,call})=>{
 await shot('docs/images/01-start.png');
 await e("document.getElementById('tutorial-choice').checked=true;document.getElementById('start-full').click();GDD1SETTINGS.set({speed:'instant'})");
 const before=await e('GDD1.encode(GDD1UI.getState())');
 await e('GDD1SETTINGS.open()');await shot('docs/images/07-settings.png');
 await e("GDD1SETTINGS.set({masterVolume:.6,musicVolume:.1,highContrast:true,autosave:false});");
 assert.equal(await e('GDD1.encode(GDD1UI.getState())'),before,'settings must not change save');
 await key('Escape');
 await e("GDD1SETTINGS.set({musicVolume:0,highContrast:false,autosave:true});document.querySelector('[data-op=spin]').click()");
 assert.equal(await e('GDD1UI.getState().phase'),'SYMBOL_CHOICE');
 assert.equal(await e("document.querySelectorAll('#board > .cell').length"),20);
 assert.equal(await e("document.querySelectorAll('#board .cell .cell').length"),0);
 assert.equal(await e('GDD1OVERLAY.top()'),'choice');await key('Escape');assert.equal(await e('GDD1OVERLAY.top()'),'choice');
 await shot('docs/images/02-choice.png');
 await e("document.querySelector('[data-shell=board]').click()");await shot('docs/images/03-board.png');await key('Escape');
 await e("document.querySelector('[data-shell=pool]').click()");await shot('docs/images/04-pool.png');
 const tokens=await e('GDD1UI.getState().removeTokens');
 await e("document.querySelector('#pool .remove:not(:disabled)').click()");assert.equal(await e('GDD1CONFIRM.isOpen()'),true);await shot('docs/images/09-remove-confirm.png');await key('Escape');
 assert.equal(await e('GDD1UI.getState().removeTokens'),tokens);await key('Escape');
 const n=await e('GDD1UI.getState().pool.length');await key('1','Digit1');
 assert.equal(await e('GDD1UI.getState().pool.length'),n+1);assert.equal(await e('GDD1UI.getState().pendingSettlement'),null);
 await shot('docs/images/10-first-workbench.png');
 await e('GDD1CODEX.open()');await shot('docs/images/06-codex.png');await key('Escape');
 await resize(390,844);await e("GDD1UI.send('spin')");
 assert.equal(await e("getComputedStyle(document.getElementById('board')).gridTemplateColumns.split(' ').length"),5);
 assert.equal(await e('document.documentElement.scrollWidth<=innerWidth'),true);await shot('tests/gdd1/shell-shots/choice-mobile.png');
 await e("document.querySelector('[data-shell=pool]').click();document.querySelector('#pool .pool-row').click()");
 assert.equal(await e('GDD1OVERLAY.top()'),'details');await shot('tests/gdd1/shell-shots/details-mobile.png');await key('Escape');await key('Escape');
 await key('s','KeyS');await resize(1366,768);
 // Follow real commands until a normal loss, recording each round in the UI telemetry.
 await e("(()=>{for(let i=0;i<250;i++){let s=GDD1UI.getState();if(['WON','LOST'].includes(s.phase))break;GDD1UI.send(s.phase==='READY'?'spin':s.phase==='SYMBOL_CHOICE'?'skip':s.phase==='ITEM_CHOICE'?'skipItem':'event',s.phase==='EVENT_CHOICE'?{id:s.events.choice.id,option:'B'}:{});}})()");
 assert.equal(await e('GDD1OVERLAY.top()'),'end');assert.equal(await e('GDD1UI.getState().phase'),'LOST');
 assert.ok(await e("document.querySelector('.end-summary').textContent.includes('近五轮净额均值')"));await shot('docs/images/05-end.png');
 // An imported, valid high-cash fixture permits exercising a complete win without changing rules.
 await e("(()=>{let s=GDD1.fullNewRun('SHELL-WIN');s.cash=100000;const text=GDD1.encode(s),f=new File([text],'run.json',{type:'application/json'}),d=new DataTransfer();d.items.add(f);const input=document.getElementById('import');input.files=d.files;input.dispatchEvent(new Event('change'));})()");
 await e("new Promise(r=>setTimeout(r,100))");
 await e("(()=>{for(let i=0;i<300;i++){let s=GDD1UI.getState();if(['WON','LOST'].includes(s.phase))break;GDD1UI.send(s.phase==='READY'?'spin':s.phase==='SYMBOL_CHOICE'?'skip':s.phase==='ITEM_CHOICE'?'skipItem':'event',s.phase==='EVENT_CHOICE'?{id:s.events.choice.id,option:'B'}:{});}})()");
 assert.equal(await e('GDD1UI.getState().phase'),'WON');assert.equal(await e('GDD1OVERLAY.top()'),'end');await shot('tests/gdd1/shell-shots/win.png');
 assert.deepStrictEqual(errors,[]);assert.equal(requests.some(u=>/^https?:/.test(u)&&!u.startsWith('http://127.0.0.1:')),false);
 console.log('PASS shell: settings isolated, modal keys, removal cancel, 5x4 mobile, real loss, imported win, no remote requests');
});
await run(async({evaluate:e,errors,requests})=>{
 await e("document.getElementById('tutorial-choice').checked=true;document.getElementById('start-full').click();GDD1SETTINGS.set({speed:'instant'});GDD1UI.send('spin');GDD1UI.send('skip');");
 assert.equal(await e('GDD1UI.getState().spin'),1);assert.deepStrictEqual(errors,[]);
 assert.equal(requests.some(u=>/^https?:/.test(u)),false);console.log('PASS file:// offline start and settlement');
},{file:true});
})().catch(e=>{console.error(e);process.exitCode=1;});
