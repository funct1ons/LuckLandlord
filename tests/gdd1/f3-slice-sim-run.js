'use strict';
const fs=require('fs'),os=require('os'),crypto=require('crypto');
const E=require('./f3-slice-sim-engine'),{F,copy}=E;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function play(bot,split,index){
 const seed=`F3-SLICE-v1/${bot}/${split}/${String(index).padStart(4,'0')}`,policySeed=`decision-v1/${bot}/${split}/${index}`;
 const rng=E.policyRng(policySeed),start=performance.now();let s=F.sliceNewRun(seed),modelCommands=0,error=null;
 const actions=[],spins=[],payments=[],exposures=[],acquisitions=[],firstFormation={},uidHistory={},contributions={},recent=[];
 const remember=(state,origin)=>{for(const x of state.pool){if(!uidHistory[x.uid])uidHistory[x.uid]={initialType:x.type,acquiredStage:state.stageId,origin};uidHistory[x.uid].type=x.type}};
 remember(s,'initial');
 const expose=()=>{if(['SYMBOL_CHOICE','ITEM_CHOICE'].includes(s.phase))exposures.push({kind:s.offer.kind,stage:s.stageId,spin:s.spin,window:s.offer.windowId,refresh:s.offer.choiceRefreshesUsed,guarantee:s.offer.guarantees.applied,ids:copy(s.offer.choices)});else if(s.phase==='EVENT_CHOICE')exposures.push({kind:'event',stage:s.stageId,spin:s.spin,ids:[s.events.choice.id],targets:copy(s.events.choice.targetUids)});};
 while(!['WON','LOST'].includes(s.phase)&&actions.length<600){
  const v=E.publicView(s),decision=E.decide(bot,v,rng),a=decision.action;modelCommands+=decision.modelCommands;
  const before=s,stamp={revision:s.revision,stage:s.stageId,spin:s.spin,phase:s.phase,command:copy(a)};
  const t=performance.now();const result=F.sliceCommand(s,{...a,revision:s.revision});stamp.ms=performance.now()-t;stamp.ok=result.ok;
  if(!result.ok){stamp.error=result.error;actions.push(stamp);error=result.error;break;}
  s=result.state;stamp.after={phase:s.phase,cash:s.cash,pending:s.pendingSettlement,pool:s.pool.length,remove:s.removeTokens,reroll:s.rerollTokens};actions.push(stamp);
  if(a.op==='choose'||a.op==='item'||a.op==='event'&&a.option==='A')acquisitions.push({id:a.id,stage:before.stageId,spin:before.spin,kind:a.op,uid:a.op==='choose'?'u'+before.nextUid:a.uid||null,prePool:before.pool.length,preFormations:E.formation(v,recent),preTypes:copy(before.pool.map(x=>x.type))});
  if(a.op==='spin'){
   const types={};for(const c of before.pool)types[c.uid]=c.type;for(const c of s.last.board.filter(Boolean))types[c.uid]=c.type;
   for(const row of s.last.log){if(row.action==='transform')types[row.target]=row.facts.afterType;if(row.action==='spawn')types[row.facts.createdUid]=row.facts.afterType;}
   const bySource={};const add=(source,amount)=>{const id=source.startsWith('item_')?source:types[source]||uidHistory[source]?.type;if(!id)throw Error('Unknown contribution source '+source);bySource[id]=(bySource[id]||0)+amount;contributions[id]=(contributions[id]||0)+amount;};
   for(const cell of s.last.ledger)for(const part of cell.contributions)add(part.source,part.amount);
   for(const log of s.last.log)if(log.action==='reward')add(log.source,log.amount||0);
   if(Object.values(bySource).reduce((a,b)=>a+b,0)!==s.last.total)throw Error('Simulation contribution mismatch');
   const stat={stage:s.stageId,spin:s.spin,stageSpin:s.stageSpin,income:s.last.total,pool:s.pool.length,logActions:s.last.log.length,bySource,board:copy(s.last.board),ledger:copy(s.last.ledger),plantTransforms:s.last.log.filter(x=>x.action==='transform'&&x.facts.beforeTags.includes('plant')).length,plantProductIncome:s.last.ledger.filter(x=>F.sliceSymbols[x.type].tags.includes('plant')&&F.sliceSymbols[x.type].tags.includes('product')).reduce((a,b)=>a+b.amount,0),scrapProcessed:s.last.log.filter(x=>['consume','transform'].includes(x.action)&&x.facts.beforeTags.includes('scrap')).length};
   spins.push(stat);recent.push(stat);if(recent.length>3)recent.shift();
   for(const route of E.formation(E.publicView(s),recent))if(!firstFormation[route])firstFormation[route]={stage:s.stageId,spin:s.spin};
  }
  if(['choose','skip'].includes(a.op)&&before.spinsRemaining===0)payments.push({stage:before.stageId,spin:before.spin,payment:before.payment,available:Math.max(0,before.cash+before.pendingSettlement),margin:Math.max(0,before.cash+before.pendingSettlement)-before.payment,paid:s.phase!=='LOST',pool:s.pool.length,income:spins.filter(x=>x.stage===before.stageId).reduce((n,x)=>n+x.income,0)});
  remember(s,a.op==='choose'?'choice':a.op==='event'?'event':'generated');
  if(['spin','reroll'].includes(a.op)||['choose','skip'].includes(a.op)&&s.phase==='ITEM_CHOICE'||['item','skipItem'].includes(a.op)&&s.phase==='EVENT_CHOICE')expose();
 }
 if(actions.length>=600&&!['WON','LOST'].includes(s.phase))error='Simulator action guard exceeded';
 return {version:'f3-slice-sim-v1',bot,split,index,seed,policySeed,outcome:error?'ERROR':s.phase,won:!error&&s.phase==='WON',error,ms:performance.now()-start,modelCommands,actions,spins,payments,exposures,acquisitions,firstFormation,uidHistory,contributions,policyRng:rng.snapshot(),finalState:copy(s),finalHash:hash(s)};
}
function main(){const mode=process.argv[2]||'pilot',bot=process.argv[3]||'Value',split=process.argv[4]||'pilot',n=Number(process.argv[5]||10),startIndex=Number(process.argv[6]||0);if(!E.bots.includes(bot)||!['pilot','train','holdout'].includes(split)||!Number.isInteger(n)||n<1)throw Error('Arguments');
 const target=__dirname+`/f3-slice-sim-${mode}-${bot.toLowerCase()}-${split}${mode==='batch'?'-'+startIndex:''}.jsonl`;if(fs.existsSync(target))throw Error('Do not overwrite evidence: '+target);
 const fd=fs.openSync(target,'wx'),index=[],start=performance.now();let wins=0,errors=0;
 try{for(let i=0;i<n;i++){const g=play(bot,split,i+startIndex);const bytes=Buffer.from(JSON.stringify(g)+'\n');const offset=index.reduce((a,b)=>a+b.bytes,0);fs.writeSync(fd,bytes);index.push({seed:g.seed,policySeed:g.policySeed,line:i+1,offset,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),outcome:g.outcome,finalHash:g.finalHash});wins+=g.won?1:0;errors+=g.error?1:0;if((i+1)%100===0)console.log(bot,split,i+1,'wins',wins,'seconds',((performance.now()-start)/1000).toFixed(1));}}finally{fs.closeSync(fd)}
 const summary={bot,split,n,wins,errors,ms:performance.now()-start,node:process.version,platform:process.platform,cpu:os.cpus()[0].model,index};fs.writeFileSync(target.replace('.jsonl','-index.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({...summary,index:undefined}));if(errors)process.exitCode=1;
}
module.exports={play,hash};if(require.main===module)main();
