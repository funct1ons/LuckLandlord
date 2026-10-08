/* Offline overlay stack. Mounted controls retain their DOM identity and listeners. */
(function(root){
'use strict';
const layers=Object.create(null),stack=[];
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const top=()=>stack[stack.length-1]||null;
function focusables(panel){return Array.from(panel.querySelectorAll('button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"])')).filter(e=>e.getClientRects().length&&!e.closest('[inert]'));}
function sync(){
 stack.forEach((id,i)=>{layers[id].el.style.zIndex=20+i;layers[id].el.inert=i!==stack.length-1;});
 document.body.classList.toggle('overlay-open',!!stack.length);
 for(const e of document.querySelectorAll('body > header,body > main,#welcome'))e.inert=!!stack.length;
}
function open(id,opts){
 opts=opts||{};let rec=layers[id];
 if(!rec){
  const el=document.createElement('div');el.id='overlay-'+id;el.className='overlay-layer';el.hidden=true;
  el.innerHTML='<div class="overlay-scrim"></div><div class="overlay-panel" role="dialog" aria-modal="true" tabindex="-1"><div class="overlay-bar"><h2 class="overlay-title"></h2><button class="overlay-close" type="button">关闭</button></div><div class="overlay-body"></div></div>';
  document.getElementById('overlay-root').appendChild(el);rec=layers[id]={el,opts:{},mounts:[]};
  el.querySelector('.overlay-close').onclick=()=>{if(rec.opts.dismissible!==false)close(id);};
  el.querySelector('.overlay-scrim').onclick=()=>{if(rec.opts.dismissible!==false)close(id);};
 }
 const reopening=!rec.el.hidden;rec.opts=opts;
 if(!reopening)rec.lastFocus=document.activeElement;
 rec.el.querySelector('.overlay-title').textContent=opts.title||'';
 const panel=rec.el.querySelector('.overlay-panel'),body=rec.el.querySelector('.overlay-body');
 panel.setAttribute('aria-label',opts.title||id);
 if(opts.html!=null)body.innerHTML=opts.html;
 rec.el.querySelector('.overlay-close').hidden=opts.dismissible===false;
 rec.el.classList.toggle('overlay-wide',!!opts.wide);rec.el.classList.toggle('overlay-drawer',!!opts.drawer);
 rec.el.hidden=false;document.body.classList.add('overlay-'+id);
 const idx=stack.indexOf(id);if(idx>=0)stack.splice(idx,1);stack.push(id);sync();
 if(opts.onOpen)opts.onOpen(body,rec.el);
 const first=(opts.focus&&rec.el.querySelector(opts.focus))||focusables(panel)[0]||panel;
 first.focus();return body;
}
function mount(id,node){
 const rec=layers[id];if(!rec||!node||rec.mounts.some(m=>m.node===node))return;
 const marker=document.createComment('overlay return '+node.id);node.parentNode.insertBefore(marker,node);
 rec.mounts.push({node,marker});rec.el.querySelector('.overlay-body').appendChild(node);
}
function close(id){
 const rec=layers[id];if(!rec||rec.el.hidden)return;
 rec.mounts.forEach(({node,marker})=>{marker.replaceWith(node);});rec.mounts=[];
 rec.el.hidden=true;rec.el.inert=false;
 rec.el.querySelector('.overlay-body').innerHTML='';document.body.classList.remove('overlay-'+id);
 const idx=stack.indexOf(id);if(idx>=0)stack.splice(idx,1);sync();
 if(rec.opts.onClose)rec.opts.onClose();
 const back=rec.lastFocus;rec.lastFocus=null;
 if(back&&back.isConnected&&!back.closest('[inert]')&&back.getClientRects().length)back.focus();
 else if(top()){const p=layers[top()].el.querySelector('.overlay-panel');(focusables(p)[0]||p).focus();}
}
function closeTop(){const id=top();if(!id||layers[id].opts.dismissible===false)return false;close(id);return true;}
function closeAll(){stack.slice().reverse().forEach(close);}
document.addEventListener('keydown',e=>{
 if(root.GDD1CONFIRM&&root.GDD1CONFIRM.isOpen())return;
 if(e.key==='Escape'&&stack.length){closeTop();e.preventDefault();return;}
 if(e.key!=='Tab'||!stack.length)return;
 const panel=layers[top()].el.querySelector('.overlay-panel'),list=focusables(panel),first=list[0],last=list[list.length-1];
 if(!first){e.preventDefault();panel.focus();return;}
 if(!panel.contains(document.activeElement)||(e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){
  (e.shiftKey?last:first).focus();e.preventDefault();
 }
});
root.GDD1OVERLAY={open,close,closeTop,closeAll,mount,top,esc,isOpen:id=>!!layers[id]&&!layers[id].el.hidden,body:id=>layers[id]&&layers[id].el.querySelector('.overlay-body'),layer:id=>layers[id]&&layers[id].el};
})(window);
