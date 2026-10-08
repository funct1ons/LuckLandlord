'use strict';
const assert=require('assert'),run=require('./shell-harness');
run(async({evaluate:e,key,call,errors})=>{
 await e("document.getElementById('tutorial-choice').checked=true;document.getElementById('start-full').click();GDD1SETTINGS.set({speed:'instant',musicVolume:0})");
 const before=await e('GDD1.encode(GDD1UI.getState())');
 const ask=()=>e("document.querySelector('#pool .remove:not(:disabled)').focus();document.activeElement.click()");
 await ask();assert.equal(await e('GDD1CONFIRM.isOpen()'),true);
 assert.equal(await e('document.activeElement.dataset.confirm'),'cancel');
 assert.equal(await e("document.querySelector('main').inert"),true);
 for(let i=0;i<8;i++){await key('Tab');assert.equal(await e("document.getElementById('confirm-dialog').contains(document.activeElement)"),true);}
 assert.equal(await e("GDD1CONFIRM.ask('another request').then(Boolean)"),false,'another request cannot replace the pending decision');
 await e("document.querySelector('[data-confirm=ok]').focus()");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13,autoRepeat:true});
 assert.equal(await e('GDD1CONFIRM.isOpen()'),true);assert.equal(await e('GDD1.encode(GDD1UI.getState())'),before,'repeat Enter cannot approve');
 await e("document.querySelector('[data-confirm=cancel]').focus()");await key('Enter');
 assert.equal(await e('GDD1.encode(GDD1UI.getState())'),before,'Enter on Cancel must not spend a token or remove an instance');
 assert.equal(await e('GDD1CONFIRM.isOpen()'),false);
 assert.equal(await e("document.querySelector('main').inert"),false);
 assert.equal(await e("document.activeElement.classList.contains('remove')"),true);
 await ask();await key(' ','Space');assert.equal(await e('GDD1.encode(GDD1UI.getState())'),before,'Space on Cancel');
 await ask();await key('Tab');assert.equal(await e('document.activeElement.dataset.confirm'),'ok');await key('Enter');
 assert.equal(await e('GDD1UI.getState().pool.length'),11);assert.equal(await e('GDD1UI.getState().removeTokens'),1);
 // Nested confirmation must restore the pool dialog, not unlock the underlying choice.
 await e("GDD1UI.send('spin');document.querySelector('[data-shell=pool]').click()");
 const nested=await e('GDD1.encode(GDD1UI.getState())');await ask();
 assert.equal(await e("document.getElementById('overlay-root').inert"),true);await key('Escape');
 assert.equal(await e('GDD1.encode(GDD1UI.getState())'),nested);assert.equal(await e("document.getElementById('overlay-root').inert"),false);
 assert.equal(await e('GDD1OVERLAY.top()'),'pool');assert.equal(await e("document.activeElement.classList.contains('remove')"),true);
 await key('Escape');assert.equal(await e('GDD1OVERLAY.top()'),'choice');await key('s','KeyS');assert.equal(await e('GDD1UI.getState().phase'),'READY');
 assert.deepStrictEqual(errors,[]);console.log('PASS confirm: safe default, Enter/Space cancel, explicit approval, Tab trap, nested inert and focus restoration');
}).catch(e=>{console.error(e);process.exitCode=1;});
