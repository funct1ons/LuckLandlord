(function(root){
'use strict';
const F=root.GDD1,I=root.ICONS,SFX=root.SFX,$=id=>document.getElementById(id),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let state=null,busy=false,lastError=null;
const COPY=root.GDD1COPY||{};
const TUT=root.GDD1TUTORIAL;
const pick=(v,fb)=>v==null||v===''?fb:v;
const cx=(path,fb)=>{let v=COPY;for(const k of path.split('.')){if(!v||typeof v!=='object')return fb;v=v[k];}return pick(v,fb);};
const ml=(g,id,fb)=>{const m=COPY[g];return m&&id!=null&&m[id]!=null&&m[id]!==''?m[id]:(fb!=null?fb:id);};
const notice=(text,error=false)=>{$('notice').textContent=text;$('notice').className=error?'error':''};
function desc(d,kind){
 const T=root.GDD1TEXT;
 if(T&&d&&d.id)return T.effect(d.id,kind||(String(d.id).indexOf('item_')===0?'item':'symbol'),state)||T.purpose(d.id,kind||'symbol',state);
 if(T&&d&&d.description)return T.sanitize(d.description,state);
 return d.description||'基础产出';
}
function askOk(message,title){
 const C=root.GDD1CONFIRM;
 if(C&&C.ask)return C.ask(message,title);
 return Promise.resolve(!!root.confirm(message));
}
const PHASE_FB={READY:'等待运行',SYMBOL_CHOICE:'选择生产牌 · 收益待入账',ITEM_CHOICE:'已付款 · 选择本局升级',EVENT_CHOICE:'新期 · 事件确认'};
function phaseLabel(s){
 if(!s)return '';
 if(s.phase==='WON')return s.profile==='full-v1'?cx('win.full','工坊保住了！你已付清10期账单。'):cx('win.slice','精简模式完成：已付清10期试验账单。');
 if(s.phase==='LOST')return cx('lose.title','本局经营失败：本期账单未付清。');
 return cx('phases.'+s.phase,PHASE_FB[s.phase]||s.phase);
}
function rarityText(id){return ml('rarity',id,id);}
function tagText(tags,sep){return (tags||[]).map(t=>ml('tags',t,t)).join(sep);}
function eventView(id,e){const ev=COPY.events&&COPY.events[id];return{name:pick(ev&&ev.name,e.name),description:pick(ev&&ev.description,e.description||'')};}
function openPool(){const O=root.GDD1OVERLAY;O.open('pool',{title:'整理生产牌库',wide:true});O.mount('pool',document.querySelector('main > aside'));}
function openBoard(){root.GDD1OVERLAY.open('board',{title:'本轮盘面 · 收益已经确定',wide:true,html:'<div class="board">'+$('board').innerHTML+'</div>'});}
function paymentTitle(s){
 if(s.payment===s.basePayment)return '';
 let eventAdd=0,advanceAdd=0;
 for(const m of (s.stageState&&s.stageState.paymentModifiers)||[]){
  if(m.cause==='event')eventAdd+=m.amount;else if(m.cause==='advance')advanceAdd+=m.amount;
 }
 return cx('stats.basePayment','基础账单')+' '+s.basePayment+' + '+cx('stats.eventAdd','事件增额')+' '+eventAdd+' + '+cx('stats.advanceAdd','借支增额')+' '+advanceAdd;
}

/* 路线色令牌名，供 CSS 变量注入 */
const ROUTE_VAR={plant:'--route-plant',scrap:'--route-scrap',resonance:'--route-resonance',distill:'--route-distill',cargo:'--route-cargo',pressure:'--route-pressure',phase:'--route-phase',contract:'--route-contract'};

/** 生成一个盘面/列表用的图标包装；未知符号时 ICONS 自身降级为中性占位 */
function icon(type){return I?I.svg(type):'';}
function itemIcon(id){return I?I.itemSvg(id):'';}

/* 上一帧状态，用于推导该播什么音效（表现层，不影响逻辑） */
let prev=null;

function sfxFor(next,command){
 if(!SFX||!state)return;
 const before=prev;
 try{
  if(command==='spin')SFX.play.spin();
  else if(command==='choose'||command==='skip'){
   // 结算：收益 + 按路线触发 + 倍率 + 消耗
   const L=next.last;
   if(L){
    SFX.play.gain(L.total);
    const routes=new Set();
    for(const row of L.ledger){
     if(row.amount>0)routes.add(I?I.routeOf(row.type):null);
     const r=row.ratio&&Number(row.ratio[0])/Number(row.ratio[1]);
     if(r&&r>1)SFX.play.multiplier(Math.round(r));
    }
    let c=0;for(const rt of routes){if(!rt)continue;if(c<3)setTimeout(()=>SFX.play.trigger(rt),c*70);c++;}
    if(L.ledger.some(x=>!x.amount&&x.alive===false))SFX.play.consume();
   }
  }
  else if(command==='item')SFX.play.rareChoice();
  else if(command==='event')SFX.play.rareChoice();
  if(next&&next.phase==='WON')SFX.play.victory();
  else if(next&&next.phase==='LOST')SFX.play.gameOver();
  else if(before&&before.phase==='SYMBOL_CHOICE'&&next.phase==='ITEM_CHOICE')SFX.play.debtPaid();
 }catch(e){/* 音效失败绝不影响游戏 */}
}

/** 单个盘面格的 HTML。抽成独立函数，供正常渲染与滚轮动画复用。 */
function cellHtml(s,defs,c,pos){
 if(!c)return'<div class="cell empty" aria-label="空插槽"></div>';
 const d=defs.symbols[c.type],route=I?I.routeOf(c.type):null;
 const row=(s.last&&s.last.ledger.find(x=>x.uid===c.uid))||{amount:0,ratio:['1','1']};
 const attr='data-route="'+(route||'')+'" data-rarity="'+esc(d.rarity)+'" style="--route-color:var('+(ROUTE_VAR[route]||'--line-dim')+')"';
 return'<div class="cell '+(c.alive?'':'dead')+'" tabindex="0" data-uid="'+esc(c.uid)+'" data-type="'+esc(c.type)+'" '+attr+'>'+icon(c.type)+'<b>'+esc(d.name)+'</b><span class="value">'+row.amount+'</span><span class="meta">'+(row.ratio[0]!=='1'?'×'+row.ratio.join('/'):'')+'</span></div>';
}

function render(s,preview=false){
 if(!preview)hideWelcome();
 if(!preview&&root.GDD1PREFS)root.GDD1PREFS.markState(s);
 const defs=F.defs(s);
 const nodes={},$=preview?id=>(nodes[id]||(nodes[id]=document.createElement('div'))):id=>document.getElementById(id);
 F.validateState(s);
 var led=document.querySelector('.ledger'); if(led&&!preview)led.style.display='';
 var mac=document.querySelector('.machine'); if(mac&&!preview)mac.style.display='';
 $('profile-summary').textContent=s.profile==='full-v1'?cx('profile.full','完整模式 · 标准难度'):cx('profile.slice','精简模式（试验） · 标准难度');
 if(!preview)document.title=cx('gameTitle','雾港回收工坊')+' · '+phaseLabel(s);
 $('seed').value=s.seed;$('autosave').checked=root.GDD1SETTINGS.get().autosave!==false;
 const payTip=paymentTitle(s);
 $('stats').innerHTML=[[cx('stats.cash','现金'),s.cash],[cx('stats.pending','待入账'),s.pendingSettlement===null?'—':s.pendingSettlement]].map(([a,b],i)=>'<div class="stat '+(i===1?'pending':'cash')+'"><small>'+esc(a)+'</small><strong>'+esc(b)+'</strong></div>').join('');
 const gap=Math.max(0,s.payment-s.cash);
 $('bill').innerHTML='<div class="bill-period">第 <b>'+s.stageId+'</b> / 10 期</div><div class="bill-amount"><small>'+esc(cx('stats.payment','本期应付'))+'</small><strong>'+s.payment+'</strong></div><div class="bill-modifier">'+esc(payTip||'本期基础账单')+'</div><div class="bill-deadline '+(s.spinsRemaining<=3?'urgent':'')+'"><small>'+esc(cx('stats.remaining','本期剩余运行'))+'</small><strong>'+s.spinsRemaining+' <span>次</span></strong></div><div class="bill-gap">'+(gap?'距应付尚差 <b>'+gap+'</b>':'现金已达到本期应付')+'</div>';
 $('tickets').innerHTML='<div class="ticket"><span>刷新券</span><b>'+s.rerollTokens+'</b></div><div class="ticket"><span>删除券</span><b>'+s.removeTokens+'</b></div>';
 $('items-count').textContent=s.items.length;


 // 盘面：图标 + 名称 + 收益；UID 收进 title，不再上盘面
 const board=s.last?s.last.board:[];
 const hasBoard=board.some(c=>c);
 const boardEl=$('board');
 if(!hasBoard){
  // 待机状态：20个空格带呼吸动画
  if(boardEl){boardEl.classList.add('idle');boardEl.classList.remove('is-rolling','is-flash');}
  $('board').innerHTML=Array.from({length:20},(_,i)=>'<div class="cell empty" aria-label="空插槽"></div>').join('')+'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none"><span style="background:rgb(0 0 0/55%);padding:6px 14px;border-radius:6px;font-size:var(--text-sm);color:var(--line-bright)">'+esc(cx('hints.emptyBoard','尚未运行'))+'</span></div>';
 } else {
  if(boardEl){boardEl.classList.remove('idle');}
  $('board').innerHTML=board.map((c,pos)=>cellHtml(s,defs,c,pos)).join('');
 }

 let html='<h2>'+esc(phaseLabel(s))+(s.phase==='WON'&&s.profile!=='full-v1'?' '+esc(cx('win.sliceNote','试验模式通关，不代表完整模式通关。')):'')+'</h2>';
 if(s.profile==='full-v1'&&s.phase==='READY'&&s.pool.some(x=>x.type==='advance_stamp'))html+='<div class="stamp-control"><label><input id="advance-accepted" type="checkbox" '+(s.settings.advanceAccepted?'checked':'')+'> 接受先支邮戳</label><span>奖励 +18 · 本期应付 +12</span><button type="button" data-inspect="symbol:advance_stamp">查看代价</button></div>';
 if(s.phase==='READY')html+='<div class="controls"><span class="console-note">从牌库随机上盘 · 第 '+(s.spin+1)+' / 70 轮</span><button class="primary" data-op="spin">'+esc(cx('buttons.spin','运行'))+'<span class="keycap">Space</span></button></div>';
 if(['SYMBOL_CHOICE','ITEM_CHOICE'].includes(s.phase)){
  const symbol=s.phase==='SYMBOL_CHOICE',defs2=symbol?defs.symbols:defs.items;
  html+='<div class="choice-tools"><button type="button" data-shell="pool">整理牌库</button><button type="button" data-shell="board">查看盘面</button><button type="button" data-shell="codex">查阅图鉴</button></div>';
  html+='<div class="choices">'+s.offer.choices.map(id=>{const d=defs2[id],route=symbol&&I?I.routeOf(id):null;return'<button class="choice" data-op="'+(symbol?'choose':'item')+'" data-id="'+id+'" data-rarity="'+esc(d.rarity)+'" '+(symbol&&s.pool.length>=200?'disabled':'')+'>'+(symbol?icon(id):itemIcon(id))+'<b>'+esc(d.name)+(symbol&&d.base!=null?' · '+d.base:'')+'</b><small>'+esc(rarityText(d.rarity)+(d.tags?' · '+tagText(d.tags,' / '):''))+(route?' · '+esc(I.routeLabel(id)):'')+'</small><p class="purpose">'+esc(root.GDD1TEXT.purpose(id,symbol?'symbol':'item',s))+'</p><p>'+esc(desc(d,symbol?'symbol':'item'))+'</p><span class="inspect" role="button" tabindex="0" data-inspect="'+(symbol?'symbol:':'item:')+esc(id)+'">'+esc(cx('chrome.inspect','查阅'))+'</span><span class="choice-action">'+(symbol?'选择并入账':'获得本局升级')+' <span aria-hidden="true">↗</span></span></button>'}).join('')+'</div><div class="controls"><button data-op="'+(symbol?'skip':'skipItem')+'">'+(symbol?esc(cx('buttons.skip','跳过并入账')):esc(cx('buttons.skipItem','放弃本局升级')))+'</button>';
  if(symbol){
   const applied=s.offer.guarantees.applied,g=applied?ml('guarantees',applied,applied):'';
   const hint=s.spinsRemaining===0?cx('hints.lastSpin','选择或跳过后入账并付款；新增生产牌不能补本期缺口'):cx('hints.symbol','本轮收益已确定；新选生产牌从未来运行起才可能上盘');
   html+='<button data-op="reroll" '+(!s.rerollTokens||s.offer.choiceRefreshesUsed>=3?'disabled':'')+' title="'+esc(cx('hints.refresh','消耗1刷新券，换整组候选，不改变本轮盘面或待入账'))+'">'+esc(cx('buttons.reroll','刷新'))+' '+s.offer.choiceRefreshesUsed+'/3 · 券 '+s.rerollTokens+'</button><span class="phase">'+(g?esc(g)+' · ':'')+esc(hint)+'</span>';
  }else html+='<span class="phase">'+esc(cx('hints.item','选择一项本局升级；不上盘，只在本局生效，可放弃'))+'</span>';
  html+='</div>';
 }
 if(s.phase==='EVENT_CHOICE'){const c=s.events.choice,e=defs.events[c.id],ev=eventView(c.id,e);html+='<p>'+esc(root.GDD1TEXT.effect(c.id,'event',s)||ev.description)+'</p><div class="event-controls"><b>'+esc(ev.name)+'</b><span>'+esc(cx('buttons.eventCost','现金费用'))+' '+e.cost+'</span><select id="event-target"><option value="">'+esc(cx('buttons.eventTarget','选择目标'))+'</option>'+c.targetUids.map(uid=>{const x=s.pool.find(x=>x.uid===uid);return'<option value="'+uid+'">'+esc(x?defs.symbols[x.type].name:'已失效')+' · 成长 '+(x?x.permanent:0)+'</option>'}).join('')+'</select><button data-op="event" data-option="A" data-id="'+c.id+'">'+esc(root.GDD1TEXT.action(c.id))+'</button><button data-op="event" data-option="B" data-id="'+c.id+'">'+esc(cx('buttons.eventB','不参与'))+'</button></div>'}
 if(['WON','LOST'].includes(s.phase)){
  if(s.phase==='LOST')html+='<div class="final lost">'+esc(cx('lose.title','本局经营失败：本期账单未付清。'))+' · '+esc(cx('lose.payment','本期应付'))+' '+s.payment+' · '+esc(cx('lose.payable','可付现金'))+' '+s.cash+' · '+esc(cx('lose.gap','缺口'))+' '+(s.payment-s.cash)+' · Seed '+esc(s.seed)+' · '+esc(cx('chrome.pool','生产牌库'))+' '+s.pool.length+'</div>';
  else html+='<div class="final won">'+esc(phaseLabel(s))+(s.profile!=='full-v1'?' '+esc(cx('win.sliceNote','试验模式通关，不代表完整模式通关。')):'')+' · Seed '+esc(s.seed)+' · '+esc(cx('chrome.pool','生产牌库'))+' '+s.pool.length+'</div>';
 }
 $('decision').innerHTML=html;if(!preview&&$('advance-accepted'))$('advance-accepted').onchange=()=>send('advanceAccepted',{value:$('advance-accepted').checked});$('pool-count').textContent=s.pool.length+'/200';
 $('pool').innerHTML=s.pool.map(x=>{const d=defs.symbols[x.type],allowed=['READY','SYMBOL_CHOICE'].includes(s.phase)&&s.removeTokens>0,route=I?I.routeOf(x.type):null;
  const counters=Object.entries(x.counters).map(([k,v])=>ml('counters',k,k)+' '+v).join(' ');
  return'<div class="pool-row" tabindex="0" data-uid="'+esc(x.uid)+'" data-type="'+esc(x.type)+'" style="--route-color:var('+(ROUTE_VAR[route]||'--line-dim')+')">'+icon(x.type)+'<div style="flex:1;min-width:0"><b>'+esc(d.name)+'</b><small>'+esc(rarityText(d.rarity))+' · '+d.base+' · 成长 +'+x.permanent+(counters?' · '+esc(counters):'')+'</small></div><button class="remove" data-op="remove" data-uid="'+x.uid+'" '+(allowed?'':'disabled')+'>'+esc(cx('buttons.remove','移除'))+'</button></div>'}).join('');
 $('items').innerHTML=s.items.map(id=>'<div class="item-row" tabindex="0" data-item="'+esc(id)+'">'+itemIcon(id)+'<b>'+esc(defs.items[id].name)+'</b>'+esc(desc(defs.items[id],'item'))+'<small>本轮 '+s.itemState.quotas[id].spin+' / 本期 '+s.itemState.quotas[id].stage+'</small></div>').join('')+s.events.activeModifiers.map(m=>{const x=s.pool.find(p=>p.uid===m.uid);return'<div class="item-row">'+esc(defs.events[m.eventId].name)+(x?' · '+esc(defs.symbols[x.type].name):'')+' · 剩余 '+m.remaining+'</div>';}).join('');
 $('summary').textContent=s.last?'净额 '+s.last.total+' = 普通 '+(s.last.total-s.last.reward)+' + 独立奖励 '+s.last.reward:'尚无运行';
 $('ledger').innerHTML=root.GDD1LOG?root.GDD1LOG.html(s):'';
 $('log').textContent='';
 prev=F.clone(s);
 if(!preview){syncShell(s);if(TUT)TUT.sync(s);}
}
let endKey='',presentationGeneration=0;
function stopPresentation(){presentationGeneration++;if(root.ANIM)root.ANIM.skip();busy=false;root.GDD1OVERLAY.closeAll();endKey='';}
function syncShell(s){
 const O=root.GDD1OVERLAY,choice=['SYMBOL_CHOICE','ITEM_CHOICE','EVENT_CHOICE'].includes(s.phase);
 if(choice&&!busy){
  if(!O.isOpen('choice')){O.open('choice',{title:s.phase==='EVENT_CHOICE'?'码头来信':s.phase==='ITEM_CHOICE'?'本期账单已付清':'选择下一轮的生产牌',wide:true,dismissible:false});O.mount('choice',$('decision'));O.mount('choice',$('coach'));}
 }else if(!choice||busy)O.close('choice');
 if(['WON','LOST'].includes(s.phase)&&!busy){
  const key=s.profile+'/'+s.seed+'/'+s.revision;
  if(endKey!==key){endKey=key;root.GDD1END.open(s,{again:()=>s.profile==='full-v1'?newFullRun():newRun(),menu:showStart,toast:notice});}
 }else if(!['WON','LOST'].includes(s.phase)){endKey='';root.GDD1END.close();}
 document.body.classList.toggle('is-busy',busy);
}
/* 演出编排：逻辑已在 send() 中同步提交，这里只做重放。
   若动画不可用或抛错，render() 已经画出真实结果，绝不回退逻辑。 */
function playSpinAnimation(s){
 const A=root.ANIM;
 if(!A||!A.shouldAnimate())return Promise.resolve();
 const boardEl=$('board');
 if(!boardEl)return Promise.resolve();
 const defs=F.defs(s);
 const finalBoard=s.last?s.last.board:[];
 return A.reels(boardEl,finalBoard,(c,pos)=>{const box=document.createElement('div');box.innerHTML=cellHtml(s,defs,c,pos);return box.firstElementChild.innerHTML;},col=>{if(SFX)SFX.play.reelStop(col)})
  .then(()=>{
   // 聚合反馈：浮字 + 总额定格 + 邻接连线
   if(!s.last||s!==state)return;
   for(const row of s.last.ledger){
    const pos=finalBoard.findIndex(c=>c&&c.uid===row.uid);
    if(pos<0)continue;
    if(row.amount)A.floatText(boardEl,pos,(row.amount>0?'+':'')+row.amount,row.amount>0?'gain':'loss');
   }
   A.totalBadge(document.querySelector('.machine'),s.last.total);
   for(const row of s.last.log){
    if(row.action==='add'||row.action==='multiply'){
     const from=finalBoard.findIndex(c=>c&&c.uid===row.source),to=finalBoard.findIndex(c=>c&&c.uid===row.target);
     if(from>=0&&to>=0&&from!==to)A.link(boardEl,from,to);
    }
   }
  })
  .catch(()=>{});
}
function persist(){if(state&&root.GDD1SETTINGS.get().autosave!==false){try{const r=F.store(localStorage,state);if(!r.ok)notice(r.error,true)}catch(e){notice('仅本次会话可保存: '+e.message,true)}}}
/* send：逻辑同步提交 -> 存档 -> 再播动画。
   busy 必须在所有路径（含命令被拒、异常、动画卡住）都释放，否则界面会永久锁死。
   因此用 release() 统一收口，并给动画加超时保险。 */
function send(op,extra={}){
 if(busy||!state)return;
 busy=true;
 const generation=presentationGeneration;
 let released=false;
 const release=()=>{if(!released){released=true;if(generation!==presentationGeneration)return;busy=false;if(state)syncShell(state)}};
 try{
  const cmd=Object.assign({revision:state.revision,op,windowId:state.offer.windowId},extra);
  const r=(state.profile==='full-v1'?F.fullCommand:F.sliceCommand)(state,cmd);
  if(!r.ok){
   if(state.profile==='full-v1'){lastError={profile:state.profile,error:r.error,command:F.clone(cmd),input:F.clone(state)};if($('export-error'))$('export-error').disabled=false;}
   notice(r.error,true);release();return;
  }
  state=r.state;sfxFor(state,op);if(TUT)TUT.onCommand(op);if(op==='spin'&&root.GDD1PREFS)root.GDD1PREFS.recordSpin(state);render(state);notice(phaseLabel(state));persist();
  // 逻辑与存档已完成，此后仅是表现。
  if(op==='spin'&&root.ANIM&&root.ANIM.shouldAnimate()){
   const guard=setTimeout(release,6000);
   playSpinAnimation(state).then(()=>{
    clearTimeout(guard);
    if(generation!==presentationGeneration||!state)return;
    // 胜利/失败过渡在滚动演出结束后触发
    const boardEl=document.getElementById('board');
    if(state.phase==='WON'&&root.ANIM.victoryFanfare)root.ANIM.victoryFanfare(boardEl);
    else if(state.phase==='LOST'&&root.ANIM.defeatHalt)root.ANIM.defeatHalt(boardEl);
    release();
   },()=>{clearTimeout(guard);release()});
  }else if(['choose','skip'].includes(op)&&root.ANIM&&root.ANIM.shouldAnimate()){
   const guard=setTimeout(release,2000);
   root.ANIM.settlement(document.querySelector('.machine'),{amount:state.last?state.last.total:0,payment:state.phase==='ITEM_CHOICE'||state.phase==='WON'?state.payment:0,failed:state.phase==='LOST'}).then(()=>{clearTimeout(guard);release();},()=>{clearTimeout(guard);release();});
  }else{
   // 非 spin 命令也可能触发胜败（如 choose/skip 末轮）
   if(state.phase==='WON'&&root.ANIM&&root.ANIM.victoryFanfare)root.ANIM.victoryFanfare(document.getElementById('board'));
   else if(state.phase==='LOST'&&root.ANIM&&root.ANIM.defeatHalt)root.ANIM.defeatHalt(document.getElementById('board'));
   release();
  }
 }catch(e){notice(e.message,true);release()}
}
document.addEventListener('click',e=>{
 const shell=e.target.closest('[data-shell]');if(shell){if(shell.dataset.shell==='pool')openPool();else if(shell.dataset.shell==='board')openBoard();else root.GDD1CODEX.open();return;}
 const b=e.target.closest('button[data-op]');
 if(!b||b.disabled||e.detail>1)return;
 if(b.closest('#coach,#confirm-dialog')||(b.closest('.overlay-layer')&&!b.closest('#overlay-choice,#overlay-pool')))return;
 if(SFX)SFX.unlock();
 const op=b.dataset.op;
 const fire=()=>{if(op==='remove')root.GDD1OVERLAY.close('pool');send(op,{id:b.dataset.id,uid:op==='event'?$('event-target')?.value:b.dataset.uid,option:b.dataset.option,confirmEmpty:op==='remove'});};
 if(op==='remove'){
  const inst=state&&state.pool.find(x=>x.uid===b.dataset.uid);
  const nm=inst&&root.GDD1TEXT?root.GDD1TEXT.nameOf(inst.type,'symbol',state):'';
  askOk(cx('confirms.removeTitle','移除这张生产牌？')+(nm?' '+nm+'。':'')+cx('confirms.remove','将消耗1张删除券。不撤销本轮已定收益，不触发销毁奖励。')+(state.pool.length===1?cx('confirms.removeEmpty','若这是最后一张，将清空生产牌库。'):'')).then(ok=>{if(ok)fire();});
  return;
 }
 if(op==='reroll'&&state.offer&&state.offer.guarantees.applied){
  askOk(cx('confirms.reroll','刷新将消耗本组保底。继续？')).then(ok=>{if(ok)fire();});
  return;
 }
 fire();
});
function beginSlice(){stopPresentation();if(SFX)SFX.unlock();if(TUT)TUT.abort();if(root.GDD1PREFS)root.GDD1PREFS.resetTelemetry();state=F.sliceNewRun($('seed').value);render(state);notice(cx('notices.newSlice','精简模式（试验） · 标准难度 · 12张生产牌起手 · 70轮'));persist();}
function beginFull(){stopPresentation();if(SFX)SFX.unlock();if(TUT)TUT.abort();if(root.GDD1PREFS)root.GDD1PREFS.resetTelemetry();state=F.fullNewRun($('seed').value);render(state);notice(cx('notices.newFull','完整模式 · 标准难度 · 12张生产牌起手 · 70轮'));persist();}
function newRun(after){const go=()=>{beginSlice();if(typeof after==='function')after();};if(state||peekSave('slice-abd-v1')){askOk(cx('confirms.newRun','确认覆盖当前工坊存档？完整模式与精简模式分开保存。')).then(ok=>{if(ok)go();});return;}go();}
function newFullRun(after){const go=()=>{beginFull();if(typeof after==='function')after();};if(state||peekSave('full-v1')){askOk(cx('confirms.newRun','确认覆盖当前工坊存档？完整模式与精简模式分开保存。')).then(ok=>{if(ok)go();});return;}go();}
function continueRun(profile='slice-abd-v1'){if(SFX)SFX.unlock();if(TUT)TUT.abort();try{let r=F.load(localStorage,profile);if(r.ok){stopPresentation();state=r.state;render(state);notice(cx('notices.restored','已恢复'))}else notice(r.error,true)}catch(e){notice(e.message,true)}}
/* 教程只从欢迎门的两个开始按钮进入：勾选「本局不看教程」则本局不开始，
   也不会写任何偏好键；已看过（skipped / done）时勾选表示再看一轮。 */
function startFromDoor(makeRun){
 const box=$('tutorial-choice'),skipChecked=!!(box&&box.checked);
 makeRun(function(){if(TUT&&state&&TUT.shouldStart({skipChecked}))TUT.begin(state.profile);});
}
function download(text,name){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
/* 音效开关与音量（持久化到 localStorage，与游戏存档分离） */
const AUDIO_KEY='fog-port.audio.v1';
function loadAudio(){try{const v=JSON.parse(localStorage.getItem(AUDIO_KEY)||'{}');if(SFX){SFX.setEnabled(v.on!==false);SFX.setVolume(v.vol==null?0.65:v.vol);}if($('audio-on'))$('audio-on').checked=v.on!==false;if($('audio-vol'))$('audio-vol').value=v.vol==null?0.65:v.vol;
 if(root.ANIM){root.ANIM.setSpeed(v.speed||'normal');if($('anim-speed'))$('anim-speed').value=v.speed||'normal';}
}catch(e){}}
function saveAudio(){try{if(SFX)localStorage.setItem(AUDIO_KEY,JSON.stringify({on:SFX.isEnabled(),vol:SFX.getVolume(),speed:root.ANIM?root.ANIM.getSpeed():'normal'}));}catch(e){}}
if($('audio-on'))$('audio-on').onchange=()=>{if(SFX){SFX.unlock();SFX.setEnabled($('audio-on').checked);}saveAudio()};
if($('audio-vol'))$('audio-vol').oninput=()=>root.GDD1SETTINGS.set({sfxVolume:Number($('audio-vol').value)});
if($('anim-speed'))$('anim-speed').onchange=()=>root.GDD1SETTINGS.set({speed:$('anim-speed').value});
if($('export-error'))$('export-error').onclick=()=>{if(lastError)download(JSON.stringify(lastError,null,2),'gdd1-full-error.json')};
if($('menu'))$('menu').onclick=showStart;
$('new').onclick=newRun;$('new-full').onclick=newFullRun;$('continue').onclick=()=>continueRun('slice-abd-v1');$('continue-full').onclick=()=>continueRun('full-v1');$('save').onclick=()=>{if(!state)return;try{const r=F.store(localStorage,state);notice(r.ok?'存档完成':r.error,!r.ok)}catch(e){notice(e.message,true)}};$('export').onclick=()=>{if(state)download(F.encode(state),'gdd1-'+state.profile+'-'+state.spin+'.json')};$('autosave').onchange=()=>root.GDD1SETTINGS.set({autosave:$('autosave').checked});
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(TUT)TUT.abort();try{if(file.size>1048576)throw Error('导入超过 1 MiB');const text=await file.text(),r=F.commitImport(localStorage,text,preview=>render(preview,true),F.decode(text).profile);if(!r.ok)throw Error(r.error);stopPresentation();state=r.state;render(state);notice('导入完成')}catch(error){notice(error.message,true)}finally{e.target.value=''}};
function hideWelcome(){
 document.body.classList.remove('welcome-open');
 const w=$('welcome');
 if(w){w.hidden=true;w.innerHTML='';}
}
function peekSave(profile){
 try{const r=F.load(localStorage,profile);return r&&r.ok?r.state:null;}catch(e){return null;}
}
// 每次启动都先进入欢迎门；已有存档由玩家主动点击继续。
function showStart(){stopPresentation();state=null;prev=null;
 if(TUT)TUT.abort();
 notice('');
 document.title=cx('gameTitle','雾港回收工坊');
 $('profile-summary').textContent=cx('profile.default','完整模式 / 精简模式（试验）');
 $('stats').innerHTML='';$('bill').innerHTML='';$('tickets').innerHTML='';$('items-count').textContent='';
 // 待机盘面：20 个空格 + 呼吸动画 + 居中文字提示
 const boardEl=$('board');
 if(boardEl){boardEl.classList.add('idle');boardEl.classList.remove('is-rolling','is-flash');}
 $('board').innerHTML=Array.from({length:20},(_,i)=>'<div class="cell empty" aria-label="空插槽"></div>').join('')+'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none"><span style="background:rgb(0 0 0/60%);padding:8px 18px;border-radius:8px;font-size:var(--text-sm);color:var(--line-bright)">'+esc(cx('hints.emptyBoard','尚未运行'))+'</span></div>';
 $('pool').innerHTML='';$('items').innerHTML='';$('summary').textContent='';$('ledger').innerHTML='';$('log').textContent='';$('pool-count').textContent='';
 var led=document.querySelector('.ledger'); if(led)led.style.display='none';
 var mac=document.querySelector('.machine'); if(mac)mac.style.display='none';
 const settle=cx('start.settle','现金是已经到账、可以付款的金额；待入账是本轮已算好、尚未加入现金的收益。选择或跳过后才会入账。新选的生产牌不改变本轮已定收益；若本期还有运行，它仍可能在未来运行帮本期赚钱；只有本期最后一轮新增的牌不能补救本期缺口。');
 const full=peekSave('full-v1'),slice=peekSave('slice-abd-v1');
 const w=$('welcome');
 if(w){
  document.body.classList.add('welcome-open');
  let cells='';
  for(let r=0;r<4;r++)for(let c=0;c<5;c++)cells+='<rect class="welcome-cell" x="'+(248+c*54)+'" y="'+(194+r*46)+'" width="44" height="36" rx="3"/>';
  const art='<svg viewBox="0 0 640 480" stroke-width="2"><ellipse class="welcome-fog" cx="430" cy="72" rx="170" ry="48"/><ellipse class="welcome-fog" cx="540" cy="148" rx="130" ry="42"/><ellipse class="welcome-fog" cx="348" cy="208" rx="112" ry="34"/><rect class="welcome-pipe" x="168" y="64" width="26" height="108" rx="6"/><rect class="welcome-pipe" x="168" y="86" width="72" height="16" rx="6"/><rect class="welcome-pipe" x="546" y="96" width="22" height="140" rx="6"/><rect class="welcome-pipe" x="500" y="132" width="68" height="16" rx="6"/><rect class="welcome-machine" x="210" y="148" width="340" height="268" rx="14"/>'+cells+'<circle class="welcome-rivet" cx="228" cy="166" r="5"/><circle class="welcome-rivet" cx="532" cy="166" r="5"/><circle class="welcome-rivet" cx="228" cy="398" r="5"/><circle class="welcome-rivet" cx="532" cy="398" r="5"/></svg>';
  const fullMeta=full?('第 '+full.stageId+'/10 '+cx('stats.stage','期')+' · '+cx('stats.cash','现金')+' '+full.cash):cx('start.noFullSave','没有完整模式存档');
  const sliceMeta=slice?('第 '+slice.stageId+'/10 '+cx('stats.stage','期')+' · '+cx('stats.cash','现金')+' '+slice.cash):cx('start.noSliceSave','没有精简模式存档');
  const seenTutorial=!!(TUT&&TUT.prefStatus&&TUT.prefStatus());
  const tutChoice='<label class="welcome-tutorial"><input id="tutorial-choice" type="checkbox"> '+esc(seenTutorial?cx('start.replayTutorial','再看一轮教程'):cx('start.skipTutorial','本局不看教程'))+'</label>';
  w.hidden=false;
  const continuation=full||slice;
  const intro='<p class="welcome-story">'+esc(cx('start.story','雾港的空气潮湿，铜管边缘结着锈，工坊深处的回收机仍在轰鸣。'))+'</p><p>'+esc(cx('start.identity','你接手了一间负债的回收工坊。让材料、设备与帮手配合赚钱，在每期截止前付清账单。'))+'</p><p>'+esc(cx('start.intro','随机上盘，组合赚钱；每轮选择一张生产牌或跳过，逐步救活工坊。'))+'</p>';
  const continueRows='<div class="welcome-continue-row"><button id="welcome-continue-full"'+(full?'':' disabled')+'>'+esc(cx('start.continueFull','继续完整模式'))+'</button><span class="welcome-continue-meta">'+esc(fullMeta)+'</span></div><div class="welcome-continue-row"><button id="welcome-continue-slice"'+(slice?'':' disabled')+'>'+esc(cx('start.continueSlice','继续精简模式'))+'</button><span class="welcome-continue-meta">'+esc(sliceMeta)+'</span></div>';
  w.innerHTML='<div class="welcome-stage"><div class="welcome-art" aria-hidden="true">'+(root.GDD1SCENE?root.GDD1SCENE.welcome():art)+'</div><div class="welcome-shade" aria-hidden="true"></div><div class="welcome-door"><div class="welcome-eyebrow">雾港 · 夜班工坊</div><h1>'+esc(cx('start.title','雾港回收工坊'))+'</h1><p class="welcome-tagline">'+esc(cx('start.tagline','组合赚钱，按期付账，保住工坊'))+'</p><p class="welcome-lead">一盏灯，一台旧机器。<br>让留下来的材料，撑过下一张账单。</p><p class="welcome-goal">付清10期，保住工坊；到期现金不足则本局失败。</p><div class="welcome-actions">'+(continuation?'<div class="saved-runs">'+continueRows+'</div>':'')+'<button class="'+(continuation?'':'primary')+'" id="start-full">'+esc(cx('start.startFull','开始完整模式'))+'</button><details class="welcome-mode"><summary>精简模式（试验）</summary><p>'+esc(cx('start.sliceNote','仅培育、回收、蒸馏；基础账单约低35%；试验规则，通关记录与完整模式分开。'))+'</p><button id="start-slice">'+esc(cx('start.startSlice','开始精简模式（试验）'))+'</button></details>'+tutChoice+'<div class="welcome-links"><button type="button" id="welcome-codex">图鉴</button><button type="button" id="welcome-settings">设置</button><button type="button" id="welcome-help">帮助</button></div></div><details class="welcome-background"><summary>这间工坊的故事</summary>'+intro+'</details><details class="welcome-settle"><summary>'+esc(cx('start.settleSummary','现金如何入账'))+'</summary><p>'+esc(settle)+'</p></details>'+(continuation?'':'<details class="welcome-saves"><summary>本地存档</summary>'+continueRows+'</details>')+'<p class="welcome-offline">完全离线 · 纯虚拟现金 · 独立模式存档</p></div><div class="welcome-location" aria-hidden="true"><span>回收机 07</span><span>雾港的灯，还亮着。</span></div></div>';

 }else{
  $('decision').innerHTML='<h2>'+esc(cx('start.title','雾港回收工坊'))+'</h2><p>'+esc(cx('start.identity','你接手了一间负债的回收工坊。让材料、设备与帮手配合赚钱，在每期截止前付清账单。'))+'</p><p>'+esc(cx('start.goal','付清10期，保住工坊；到期付款时现金不足，本局经营失败。'))+'</p><p>'+esc(cx('start.intro','随机上盘，组合赚钱；每轮选择一张生产牌或跳过，逐步救活工坊。'))+'</p><p>'+esc(settle)+'</p><p>'+esc(cx('start.continueHint','有存档时可在此继续；完整模式与精简模式分开保存。'))+'</p><div class="controls"><button class="primary" id="start-full">'+esc(cx('start.startFull','开始完整模式'))+'</button><button id="start-slice">'+esc(cx('start.startSlice','开始精简模式（试验）'))+'</button></div>'+tutChoice+'<p>'+esc(cx('start.sliceNote','仅培育、回收、蒸馏；基础账单约低35%；试验规则，通关记录与完整模式分开。'))+'</p>';
 }
 $('start-full').onclick=()=>startFromDoor(newFullRun);$('start-slice').onclick=()=>startFromDoor(newRun);
 if($('welcome-continue-full')&&full)$('welcome-continue-full').onclick=()=>continueRun('full-v1');
 if($('welcome-continue-slice')&&slice)$('welcome-continue-slice').onclick=()=>continueRun('slice-abd-v1');
 if($('welcome-settings'))$('welcome-settings').onclick=()=>root.GDD1SETTINGS.open();
 if($('welcome-codex'))$('welcome-codex').onclick=()=>{if(root.GDD1CODEX)root.GDD1CODEX.open();};
 if($('welcome-help'))$('welcome-help').onclick=()=>root.GDD1HELP.open();
 const welcomeFocus=full?$('welcome-continue-full'):slice?$('welcome-continue-slice'):$('start-full');if(welcomeFocus)welcomeFocus.focus();
}
function selectCabinet(kind){
 for(const id of ['pool','items']){const on=id===kind;$('tab-'+id).setAttribute('aria-selected',String(on));$('tab-'+id).tabIndex=on?0:-1;$(id+'-panel').hidden=!on;}
}
for(const kind of ['pool','items']){$('tab-'+kind).onclick=()=>selectCabinet(kind);$('tab-'+kind).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'pool':e.key==='End'?'items':kind==='pool'?'items':'pool';selectCabinet(next);$('tab-'+next).focus();}};}
selectCabinet('pool');
if($('help-open'))$('help-open').onclick=()=>root.GDD1HELP.open();
if($('settings-open'))$('settings-open').onclick=()=>root.GDD1SETTINGS.open();
if($('codex-open'))$('codex-open').onclick=()=>{if(root.GDD1CODEX)root.GDD1CODEX.open();};
loadAudio();
if(root.GDD1SETTINGS&&root.GDD1SETTINGS.apply)root.GDD1SETTINGS.apply();
if(root.GDD1SCENE&&root.GDD1SCENE.room&&$('room-scene'))$('room-scene').innerHTML=root.GDD1SCENE.room();
if(root.GDD1SCENE&&$('machine-scene'))$('machine-scene').innerHTML=root.GDD1SCENE.machine();
try{
 $('legacy').innerHTML=F.readLegacy(localStorage).map((x,i)=>'<div class="item-row">'+esc(x.key)+'<pre>'+esc(JSON.stringify(x.summary,null,2))+'</pre>'+(x.text!==null?'<button data-legacy="'+i+'">导出原字节</button>':'')+'</div>').join('');$('legacy').onclick=e=>{const b=e.target.closest('[data-legacy]');if(b){const r=F.readLegacy(localStorage)[Number(b.dataset.legacy)];download(r.text,'legacy-readonly.json')}};
 showStart();
}catch(e){showStart()}
if(root.GDD1KEYS)root.GDD1KEYS.install({getState:()=>state,send});
root.GDD1UI={getState:()=>F.clone(state),getErrorReport:()=>lastError?F.clone(lastError):null,send,renderPreview:s=>render(s,true)};
})(window);
