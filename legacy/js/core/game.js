(function(G){'use strict';
G.emptyItemState=(stage=0,spin=0)=>({version:1,stage,spin,runCounts:{},stageCounts:{},spinCounts:{}});
G.itemHook=function(s,hook,p={},apply=()=>true){
  const state=s.itemState;
  if(hook==='stageStart'){state.stage=s.stage;state.stageCounts={};state.spinCounts={};}
  if(hook==='spinStart'){if(state.stage!==s.stage){state.stage=s.stage;state.stageCounts={};}state.spin=s.spin+1;state.spinCounts={};}
  for(const id of Object.keys(G.items)){
    if(!s.items.includes(id))continue;
    (G.items[id].effects||[]).forEach((e,index)=>{
      if(e.hook!==hook || (e.tag&&!(p.tags||[]).includes(e.tag)) || (e.excludeTag&&(p.tags||[]).includes(e.excludeTag)) ||
        (e.toTag&&!(p.toTags||[]).includes(e.toTag)) || (e.needsAge&&!p.hasAge) ||
        (e.typesAt&&(p.typeCounts?.[e.typeTag]||0)<e.typesAt))return;
      const key=id+'/'+index,counts=state[e.window+'Counts'];
      if(counts&&(counts[key]||0)>=e.limit)return;
      // Reserve the window before a callback can emit another matching hook.
      const previous=counts?counts[key]||0:0;
      if(counts)counts[key]=previous+1;
      const fire=!e.threshold||previous+1===e.threshold;
      const result=apply(id,e,key,fire);
      if(result===false){if(counts){if(previous)counts[key]=previous;else delete counts[key];}return;}
      state.runCounts[key]=(state.runCounts[key]||0)+1;
    });
  }
};
G.itemDrawWeight=function(s,obj,trace=[]){let weight=1;G.itemHook(s,'draw',{tags:G.symbols[obj.type].tags},(id,e,key)=>{weight*=e.ratio[0]/e.ratio[1];trace.push({itemId:id,effectKey:key,uid:obj.uid,ratio:[...e.ratio]});});return Math.max(0.25,Math.min(2,weight));};
G.drawBoard=function(s,trace=[]){
  const weighted=s.items.some(id=>(G.items[id].effects||[]).some(e=>e.hook==='draw'));
  if(!weighted)return G.shuffle(s.symbols.map(x=>x.uid),s).slice(0,20);
  const locks=new Map((s.reservations||[]).map(r=>[r.pos,r.uid])),used=new Set(locks.values());
  const pool=s.symbols.filter(o=>!used.has(o.uid)).map(o=>({uid:o.uid,weight:G.itemDrawWeight(s,o,trace)}));
  const selected=[];
  while(pool.length&&selected.length<20-locks.size){const sum=pool.reduce((n,x)=>n+x.weight,0);let pick=G.random(s)*sum,index=0;for(;index<pool.length-1;index++){pick-=pool[index].weight;if(pick<0)break;}selected.push(pool.splice(index,1)[0].uid);}
  return Array.from({length:20},(_,pos)=>locks.has(pos)?locks.get(pos):selected.shift()||null);
};
G.newRun=function(seed='FOG-PORT'){const s={version:G.VERSION,rules:G.RULES,contentVersion:G.CONTENT_VERSION,stageState:{claims:[],paymentModifiers:[]},itemState:G.emptyItemState(),seed:String(seed),rngState:G.hash(seed),revision:0,phase:'READY',stage:0,spin:0,spinsRemaining:G.stages[0].spins,payment:G.stages[0].payment,cash:0,symbols:[],items:[],nextId:1,rerollTokens:2,removeTokens:2,activeModifiers:[],stats:{spins:0,total:0,best:0,removed:0,stages:0,chosen:{},skipped:0,rerolls:0,events:0},settings:{autosave:true,advanceAccepted:false},history:[],choices:[],last:null,pendingSettlement:null,event:null,reservations:[]};['slag','slag','hook','echo','meter','bud','tuner','battery','voucher','rust'].forEach(t=>s.symbols.push(G.instance(s,t)));return s;};
G.choices=function(s){const pool=G.formalSymbolIds.filter(id=>!['spent_gasket','arrears_slip'].includes(id));return G.shuffle(pool,s).slice(0,3);};
G.itemChoices=function(s){const owned=new Set(s.items);return Object.keys(G.items).filter(id=>!owned.has(id)).slice(0,3);};
G.command=function(state,cmd){try{if(cmd.revision!==state.revision)throw Error('过期命令');G.validateState(state);const s=G.clone(state);const requirePhase=(...p)=>{if(!p.includes(s.phase))throw Error('当前状态不允许此操作');};
function payment(){if(s.spinsRemaining)return;s.phase='PAYMENT';if(s.cash<s.payment){s.phase='LOST';return;}s.cash-=s.payment;s.stats.stages++;if(s.stage===G.stages.length-1){s.phase='WON';s.choices=[];}else{s.phase='ITEM_CHOICE';s.choices=G.itemChoices(s);s.stats.events+=0;}}
switch(cmd.type){case 'spin':requirePhase('READY');s.phase='RESOLVING';s.last=G.resolve(s,cmd.board);const live=s.last.board.filter(Boolean).filter(c=>c.alive);let itemBonus=0;for(const item of s.items){const d=G.items[item];if(!d)continue;if(item.includes('manifest_clip')&&new Set(live.filter(c=>G.symbols[c.type].tags.includes('cargo')).map(c=>c.type)).size>=2)itemBonus+=6;if(item.includes('low_balance_tab')&&s.cash<s.payment/2)itemBonus+=3;}s.last.reward+=itemBonus;s.last.total+=itemBonus;s.pendingSettlement=s.last.total; s.spin++;s.spinsRemaining--;s.stats.spins++;s.stats.total+=s.last.total;s.stats.best=Math.max(s.stats.best,s.last.total);s.history.push({spin:s.spin,total:s.last.total});s.history=s.history.slice(-50);s.phase='SYMBOL_CHOICE';s.choices=G.choices(s);break;
case 'choose':requirePhase('SYMBOL_CHOICE');if(cmd.index!==null){if(!Number.isInteger(cmd.index)||!s.choices[cmd.index])throw Error('非法候选');const chosen=s.choices[cmd.index];s.symbols.push(G.instance(s,chosen));s.stats.chosen[chosen]=(s.stats.chosen[chosen]||0)+1;}else s.stats.skipped++;if(s.pendingSettlement!==null){s.cash=Math.max(0,s.cash+s.pendingSettlement);s.pendingSettlement=null;}s.choices=[];G.itemHook(s,'choice',{skipped:cmd.index===null});s.phase='READY';payment();break;
case 'reward':requirePhase('ITEM_CHOICE');if(!Number.isInteger(cmd.index)||!s.choices[cmd.index])throw Error('非法奖励');const r=s.choices[cmd.index];s.items.push(r);if(G.items[r]){if(r.includes('return_track'))s.rerollTokens++;}s.stage++;G.itemHook(s,'stageStart');s.stageState={claims:[],paymentModifiers:[]};s.activeModifiers=[];Object.assign(s,{spinsRemaining:G.stages[s.stage].spins,payment:G.stages[s.stage].payment,phase:'READY',choices:[]});break;
case 'configureStage':requirePhase('READY');if(typeof cmd.accepted!=='boolean'||Object.keys(cmd).some(k=>!['revision','type','accepted'].includes(k)))throw Error('非法阶段设置');s.settings.advanceAccepted=cmd.accepted;break;
case 'reroll':requirePhase('SYMBOL_CHOICE');if(s.rerollTokens<1)throw Error('没有刷新券');s.rerollTokens--;s.stats.rerolls++;s.choices=G.choices(s);break;
case 'remove':requirePhase('READY','SYMBOL_CHOICE');if(s.removeTokens<1||!s.symbols.some(x=>x.uid===cmd.uid))throw Error('无法删除');s.symbols=s.symbols.filter(x=>x.uid!==cmd.uid);if(Array.isArray(s.reservations))s.reservations=s.reservations.filter(r=>r.uid!==cmd.uid);s.removeTokens--;s.stats.removed++;break;
case 'debug':requirePhase('READY');if(cmd.symbol)s.symbols.push(G.instance(s,cmd.symbol));if(cmd.cash!==undefined)s.cash=cmd.cash;if(cmd.stage!==undefined){s.stage=cmd.stage;G.itemHook(s,'stageStart');s.stageState={claims:[],paymentModifiers:[]};s.activeModifiers=[];s.stats.stages=cmd.stage;const d=G.stages[s.stage];if(!d)throw Error('未知阶段');s.payment=d.payment;s.spinsRemaining=d.spins;}break;
default:throw Error('未知命令');}s.revision++;G.validateState(s);return {ok:true,state:s};}catch(e){return {ok:false,state,error:e.message};}};
})(window.Game);
