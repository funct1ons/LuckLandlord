'use strict';
const assert=require('assert'),run=require('./shell-harness');
run(async({evaluate:e,key,shot,errors})=>{
 await e("document.getElementById('welcome-codex').focus();document.getElementById('welcome-codex').click()");
 assert.deepStrictEqual(await e('GDD1CODEX.counts()'),{symbols:64,items:32,events:8,profile:'full-v1'});
 for(const [kind,n] of [['symbol',64],['item',32],['event',8]]){
  await e(`document.querySelector('[data-filter="kind"][data-value="${kind}"]').click()`);
  assert.equal(await e("document.querySelectorAll('.codex-tile').length"),n);
  await e("document.querySelector('.codex-tile').click()");
  assert.equal(await e("document.querySelectorAll('.codex-inspect .undiscovered').length"),1);
 }
 await shot('tests/gdd1/shell-shots/codex.png');await key('Escape');
 assert.equal(await e('document.activeElement.id'),'welcome-codex');
 await e("document.getElementById('tutorial-choice').checked=true;document.getElementById('start-full').click();ANIM.setSpeed('instant');");
 await e("document.querySelector('#pool .pool-row').focus()");await key('Enter');
 assert.equal(await e("GDD1OVERLAY.top()"),'details');await key('Escape');
 assert.equal(await e("document.activeElement.classList.contains('pool-row')"),true);
 await e("document.querySelector('[data-op=spin]').click();document.querySelector('#board .cell[data-uid]').click()");
 assert.equal(await e("GDD1OVERLAY.top()"),'details');await key('Escape');
 assert.equal(await e("/\\bu\\d+\\b/.test(document.getElementById('pool').innerText)"),false);
 await e("GDD1CODEX.open();document.querySelector('[data-filter=kind][data-value=symbol]').click();document.querySelector('[data-filter=seen][data-value=found]').click()");
 assert.ok(await e("document.querySelectorAll('.codex-tile').length>0"));
 await e("document.querySelector('.codex-tile').click()");
 assert.ok(await e("document.querySelector('.codex-inspect .detail-effect').textContent.length>0"));
 assert.deepStrictEqual(errors,[]);console.log('PASS codex 64/32/8, undiscovered effects hidden, discovery, details, Esc and focus');
}).catch(e=>{console.error(e);process.exitCode=1;});
