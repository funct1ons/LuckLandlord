'use strict';
// Bake expensive filters once; runtime loads local PNG + lightweight SVG structure.
// Node22+, Windows Edge. Editable SVG source remains in the repository.
const run=require('../../tests/gdd1/shell-harness');
run(async({call,evaluate,shot,url})=>{
 for(const name of ['welcome-workshop','room-workshop']){
  const target=new URL('assets/art/scenes/'+name+'.svg',url).href;
  await call('Page.navigate',{url:target});
  // Navigation acceptance is not load completion. Never bake the previous document.
  let ready=false;
  for(let tries=0;tries<200;tries++){
   try{ready=await evaluate(`location.href===${JSON.stringify(target)}&&document.documentElement.localName==='svg'&&document.readyState==='complete'`);}catch(error){if(!/context|navigat/i.test(error.message))throw error;}
   if(ready)break;await new Promise(resolve=>setTimeout(resolve,25));
  }
  if(!ready)throw Error('Scene navigation did not complete: '+name);
  await evaluate("document.documentElement.setAttribute('width','1920');document.documentElement.setAttribute('height','1080');new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
  await shot('assets/art/scenes/'+name+'.png');
  console.log('Baked '+name+' at 1920x1080');
 }
},{width:1920,height:1080}).catch(error=>{console.error(error);process.exitCode=1;});
