'use strict';
// Shared Edge harness; isolated temporary profiles and page error collection.
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),{spawn}=require('child_process');
module.exports=async function run(check,{file=false,width=1366,height=768}={}){
 const root=path.resolve(__dirname,'../..'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'fog-shell-'));
 let server,browser,ws,seq=0;const pending=new Map(),errors=[],requests=[];
 const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
  const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},15000);
  pending.set(id,{resolve:v=>{clearTimeout(t);resolve(v);},reject:e=>{clearTimeout(t);reject(e);}});
  ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
 });
 try{
  server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.webp')?'image/webp':f.endsWith('.png')?'image/png':'text/html');res.end(b);});});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--window-size='+width+','+height,'--no-first-run','--allow-file-access-from-files','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
  let port;for(let i=0;i<150;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n');break;}catch{}await new Promise(r=>setTimeout(r,100));}
  if(!port)throw Error('Edge startup timeout');
  ws=new WebSocket('ws://127.0.0.1:'+port[0]+port[1]);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id&&pending.has(d.id)){const p=pending.get(d.id);pending.delete(d.id);d.error?p.reject(Error(JSON.stringify(d.error))):p.resolve(d.result);}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails);if(d.method==='Network.requestWillBeSent')requests.push(d.params.request.url);});
  const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
  const c=(m,p)=>call(m,p,sessionId);
  await c('Page.enable');await c('Runtime.enable');await c('Network.enable');
  const evaluate=async expression=>{const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const ready=()=>evaluate("new Promise((r,j)=>{let n=0;const t=setInterval(()=>{if(window.GDD1UI){clearInterval(t);r(true);}else if(n++>300){clearInterval(t);j(Error('UI startup'));}},25);})");
  const resize=(width,height)=>c('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await resize(width,height);
  const url=file?'file:///'+root.replace(/\\/g,'/')+'/gdd1.html':'http://127.0.0.1:'+server.address().port+'/gdd1.html';
  await c('Page.navigate',{url});await ready();
  const key=async(key,code)=>{const codes={Enter:13,Tab:9,Escape:27,' ':32,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40,Home:36,End:35};const vk=codes[key]||(key.length===1?key.toUpperCase().charCodeAt(0):0);const event={key,code:code||key,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk};await c('Input.dispatchKeyEvent',{type:'keyDown',...event,...(key==='Enter'?{text:'\r'}:{})});await c('Input.dispatchKeyEvent',{type:'keyUp',...event});};
  const shot=async name=>{const png=await c('Page.captureScreenshot',{format:'png'});const dest=path.resolve(root,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,Buffer.from(png.data,'base64'));};
  await check({evaluate,call:c,ready,resize,key,shot,errors,requests,url});
 }finally{
  if(ws&&ws.readyState===1){try{await call('Browser.close');}catch{}ws.close();}
  if(browser&&!browser.killed)browser.kill();if(server)await new Promise(r=>server.close(r));
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});}catch(_){}
 }
};
