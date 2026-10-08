'use strict';
// Node 22+, local Edge. No engine source or direct board DOM mutation.
const assert=require('assert'),fs=require('fs'),path=require('path'),run=require('./shell-harness');
const out=path.join(__dirname,'visual-shots');fs.mkdirSync(out,{recursive:true});
const report={viewports:[],failures:[],networkFailures:[],responses:[],consoleErrors:[]};
// Observe the shared harness's CDP socket without changing its assertions or API.
const NativeWebSocket=global.WebSocket;
global.WebSocket=class extends NativeWebSocket{constructor(...args){super(...args);this.addEventListener('message',event=>{const d=JSON.parse(event.data),p=d.params;if(d.method==='Network.loadingFailed')report.networkFailures.push(p);if(d.method==='Network.responseReceived')report.responses.push({url:p.response.url,status:p.response.status,mime:p.response.mimeType});if(d.method==='Runtime.consoleAPICalled'&&p.type==='error')report.consoleErrors.push(p.args);});}};
(async()=>{
 for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[390,844]]){
  await run(async({evaluate:e,key,shot,errors,requests,call})=>{
   const label=width+'x'+height,checks=[];report.viewports.push({width,height,checks});
   const check=(name,value)=>{checks.push({name,pass:!!value});if(!value)report.failures.push(label+': '+name);};
   const capture=async name=>{await e('Promise.all([...document.images].map(im=>im.decode()))');await e('document.fonts.ready');await e('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await shot('tests/gdd1/visual-shots/'+label+'-'+name+'.png');};
   const overflow=()=>e('document.documentElement.scrollWidth<=innerWidth');
   const visible=selector=>e(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled||b.closest('[inert]'))return false;const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()`);
   const click=async selector=>{assert.ok(await visible(selector),label+' clickable '+selector);const p=await e(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
   check('welcome shown',await e("!document.getElementById('welcome').hidden"));
   check('welcome no horizontal overflow',await overflow());
   if(width>390)check('desktop welcome no document scrolling',await e('document.documentElement.scrollHeight<=innerHeight'));
   check('start button in viewport',await visible('#start-full'));await capture('welcome');
   await e("document.getElementById('tutorial-choice').checked=true");await click('#start-full');await e("GDD1SETTINGS.set({speed:'instant',musicVolume:0})");
   check('READY after actual pointer start',await e("GDD1UI.getState().phase==='READY'"));
   check('run in viewport',await visible('[data-op="spin"]'));
   await click('[data-op="spin"]');
   check('run opens three choices',await e("GDD1UI.getState().phase==='SYMBOL_CHOICE'&&document.querySelectorAll('#decision button[data-op=choose]').length===3"));
   check('native board exactly 20 nonnested cells',await e("document.querySelectorAll('#board > .cell').length===20&&!document.querySelector('#board .cell .cell')"));
   check('board five columns four rows',await e("(()=>{const s=getComputedStyle(document.getElementById('board'));return s.gridTemplateColumns.split(' ').length===5&&s.gridTemplateRows.split(' ').length===4})()"));
   check('choice initial focus inside dialog',await e("document.getElementById('overlay-choice').contains(document.activeElement)"));
   for(let i=0;i<18;i++){await key('Tab');check('choice Tab trapped '+i,await e("document.getElementById('overlay-choice').contains(document.activeElement)"));}
   check('choice no horizontal overflow',await overflow());await capture('choice');
   await key('1','Digit1');check('choice keyboard committed',await e("GDD1UI.getState().phase==='READY'"));
   // Import a legal full-profile save, adding instances through the engine API.
   // Resolver output (not manually painted cells) supplies the full native board.
   await e(`(()=>{const F=GDD1,s=F.fullNewRun('VISUAL-FULL');const types=s.pool.map(x=>x.type);while(s.pool.length<20)s.pool.push(F.instance(s,types[(s.pool.length-types.length)%types.length]));F.validateState(s);const text=F.encode(s);F.validateState(F.decode(text));const d=new DataTransfer();d.items.add(new File([text],'visual-full.json',{type:'application/json'}));const input=document.getElementById('import');input.files=d.files;input.dispatchEvent(new Event('change'));})()`);
   await e("new Promise((r,j)=>{let n=0;const t=setInterval(()=>{if(GDD1UI.getState().seed==='VISUAL-FULL'){clearInterval(t);r(true)}else if(n++>100){clearInterval(t);j(Error('fixture import timeout'))}},25)})");
   check('imported exactly 20 instances',await e('GDD1UI.getState().pool.length===20'));
   await click('[data-op="spin"]');await key('1','Digit1');
   check('native main board full 20 symbols',await e("document.querySelectorAll('#board > .cell:not(.empty)').length===20"));
   check('full board five columns',await e("getComputedStyle(document.getElementById('board')).gridTemplateColumns.split(' ').length===5"));
   check('main run in viewport after full board',await visible('[data-op="spin"]'));
   check('main no horizontal overflow',await overflow());await capture('full-board');
   if(width===1366)await shot('docs/images/08-workbench.png');
   await e("(()=>{const x=GDD1UI.getState().pool[0];GDD1DETAILS.open({kind:'symbol',uid:x.uid})})()");
   check('details has readable effect',await e("!!document.querySelector('#overlay-details .detail-effect')?.textContent.trim()"));check('details no horizontal overflow',await overflow());await capture('details');await key('Escape');
   await e('GDD1CODEX.open()');
   check('undiscovered tiles exist',await e("!!document.querySelector('#overlay-codex .undiscovered')"));
   await e("document.querySelector('#overlay-codex [data-codex-id].undiscovered').click()");
   check('unknown details hide effect',await e("!document.querySelector('#overlay-codex .codex-inspect .detail-effect')"));
   // Color artwork may be absent, hidden, or desaturated; never fully colored on unknown entries.
   check('unknown artwork not leaked',await e(`(()=>{const nodes=[...document.querySelectorAll('#overlay-codex .undiscovered img,#overlay-codex .undiscovered svg')];return nodes.every(n=>{for(let a=n;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0||/grayscale\\(1(?:00%)?\\)|grayscale\\(100%\\)/.test(s.filter))return true;}return false;})})()`));
   check('codex no horizontal overflow',await overflow());await capture('codex');await key('Escape');
   check('no Runtime exceptions',errors.length===0);check('no remote requests',!requests.some(u=>/^https?:/.test(u)&&!u.startsWith('http://127.0.0.1:')));
  },{width,height});
 }
 assert.equal(report.networkFailures.length,0,'Network.loadingFailed must be zero (no expected exceptions)');
 assert.equal(report.consoleErrors.length,0,'console errors');
 for(const r of report.responses){const ext=new URL(r.url).pathname.match(/\.(svg|webp|png)$/i);if(ext){assert.equal(r.mime,({svg:'image/svg+xml',webp:'image/webp',png:'image/png'})[ext[1].toLowerCase()],r.url);assert.equal(r.status,200,r.url);}}
 assert.deepStrictEqual(report.failures,[]);console.log('PASS visual acceptance: four viewports, welcome/full native board/choices/details/codex, focus, offline assets and MIME');
})().catch(error=>{report.error=error.stack;console.error(error);process.exitCode=1;}).finally(()=>{global.WebSocket=NativeWebSocket;fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));});
