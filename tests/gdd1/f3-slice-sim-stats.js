'use strict';
const fs=require('fs'),readline=require('readline'),path=require('path'),crypto=require('crypto');
const E=require('./f3-slice-sim-engine');
const q=a=>{if(!a.length)return {n:0,P10:null,P50:null,P90:null,P99:null};a.sort((a,b)=>a-b);return {n:a.length,...Object.fromEntries([10,50,90,99].map(p=>['P'+p,a[Math.ceil(p/100*a.length)-1]]))}};
function rate(k,n){if(!n)return {k,n,rate:null,lo:null,hi:null};const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,r=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return {k,n,rate:p,lo:c-r,hi:c+r};}
function group(){return {n:0,wins:0,errors:[],income:[],pool:[],winPool:[],ms:[],commandMs:[],logActions:[],commands:0,modelCommands:0,actions:{},events:{A:0,B:0},formed:0,mixed:0,formationSpins:[],stage:Array.from({length:10},()=>({reached:0,paid:0,spinIncome:[],periodIncome:[],margin:[],pool:[],formed:0})),ids:{},acquisitionStrata:{},extremes:[]};}
function idstats(g,id){return g.ids[id]||(g.ids[id]={exposures:0,exposedGames:0,selected:0,acquiredGames:0,acquiredWins:0,contribution:0,contributingGames:0,contributionByStage:{},exposureByStage:{},selectedByStage:{},origins:{initial:0,choice:0,generated:0,event:0}})}
async function main(){
 const partial=process.argv.includes('--partial');
 const files=fs.readdirSync(__dirname).filter(p=>/^f3-slice-sim-batch-.*\.jsonl$/.test(p)&&(!partial||fs.existsSync(path.join(__dirname,p.replace('.jsonl','-index.json'))))).sort();const groups={},seeds=new Set(),checks={files:files.length,games:0,errors:[],indexHashes:0,replays:[]};
 for(const name of files){const meta=JSON.parse(fs.readFileSync(path.join(__dirname,name.replace('.jsonl','-index.json'))));let line=0,offset=0;const input=readline.createInterface({input:fs.createReadStream(path.join(__dirname,name)),crlfDelay:Infinity});
 for await(const text of input){const game=JSON.parse(text),idx=meta.index[line++],bytes=Buffer.from(text+'\n'),h=crypto.createHash('sha256').update(bytes).digest('hex');if(idx.seed!==game.seed||idx.offset!==offset||idx.bytes!==bytes.length||idx.sha256!==h)throw Error('Index mismatch '+name+':'+line);offset+=bytes.length;checks.indexHashes++;if(seeds.has(game.seed))throw Error('Overlapping seed '+game.seed);seeds.add(game.seed);checks.games++;
 const key=game.bot+'/'+game.split,g=groups[key]||(groups[key]=group());g.n++;g.wins+=game.won?1:0;if(game.error)g.errors.push({seed:game.seed,error:game.error});g.ms.push(game.ms);g.commands+=game.actions.length;g.modelCommands+=game.modelCommands;g.pool.push(game.finalState.pool.length);if(game.won)g.winPool.push(game.finalState.pool.length);
 for(const a of game.actions){const key=a.command.op==='event'?'event'+a.command.option:a.command.op;g.actions[key]=(g.actions[key]||0)+1;g.commandMs.push(a.ms);if(a.command.op==='event')g.events[a.command.option]++;if(!a.ok)checks.errors.push({seed:game.seed,command:a});}
 const sum=Object.values(game.contributions).reduce((a,b)=>a+b,0),total=game.spins.reduce((a,b)=>a+b.income,0);if(sum!==total)throw Error('Whole game attribution '+game.seed);
 const formed=Object.values(game.firstFormation);if(formed.length){g.formed++;g.formationSpins.push(Math.min(...formed.map(x=>x.spin)));}if(formed.length>=2)g.mixed++;
 for(let stage=1;stage<=10;stage++){const stat=g.stage[stage-1],ss=game.spins.filter(x=>x.stage===stage),payment=game.payments.find(x=>x.stage===stage);if(ss.length){stat.reached++;stat.spinIncome.push(...ss.map(x=>x.income));stat.pool.push(ss[ss.length-1].pool);stat.formed+=formed.some(x=>x.stage<=stage)?1:0;}if(payment){stat.paid+=payment.paid?1:0;stat.periodIncome.push(payment.income);stat.margin.push(payment.margin);}}
 for(const s of game.spins){g.income.push(s.income);g.logActions.push(s.logActions);for(const [id,c] of Object.entries(s.bySource)){const t=idstats(g,id);t.contributionByStage[s.stage]=(t.contributionByStage[s.stage]||0)+c;}}
 const exposed=new Set();for(const x of game.exposures)for(const id of x.ids){const t=idstats(g,id);t.exposures++;t.exposureByStage[x.stage]=(t.exposureByStage[x.stage]||0)+1;exposed.add(id);}for(const id of exposed)idstats(g,id).exposedGames++;
 const acquired=new Set();for(const x of game.acquisitions){const t=idstats(g,x.id);t.selected++;t.selectedByStage[x.stage]=(t.selectedByStage[x.stage]||0)+1;acquired.add(x.id);const build=x.preFormations.join('+')||'unformed';const pool=x.prePool<20?'<20':x.prePool<=26?'20-26':'>26';const k=[x.id,x.stage,build,pool].join('/');const bucket=g.acquisitionStrata[k]||(g.acquisitionStrata[k]={id:x.id,stage:x.stage,preFormation:build,prePoolBand:pool,n:0,wins:0});bucket.n++;bucket.wins+=game.won?1:0;}
 for(const id of acquired){const t=idstats(g,id);t.acquiredGames++;t.acquiredWins+=game.won?1:0;}
 for(const x of Object.values(game.uidHistory)){const t=idstats(g,x.initialType);t.origins[x.origin]=(t.origins[x.origin]||0)+1;}
 for(const [id,c] of Object.entries(game.contributions)){const t=idstats(g,id);t.contribution+=c;t.contributingGames++;}
 g.extremes.push({seed:game.seed,won:game.won,total,peak:Math.max(...game.spins.map(x=>x.income)),stage:game.finalState.stageId,margin:game.payments.at(-1)?.margin,finalHash:game.finalHash});
 if(game.index===0){let s=E.F.sliceNewRun(game.seed);for(const x of game.actions){const r=E.F.sliceCommand(s,{...x.command,revision:s.revision});if(!r.ok)throw Error('Replay command '+r.error);s=r.state;}const h=crypto.createHash('sha256').update(JSON.stringify(s)).digest('hex');if(h!==game.finalHash)throw Error('Replay final hash');checks.replays.push({seed:game.seed,actions:game.actions.length,finalHash:h,ok:true});}
 }
 if(line!==meta.n)throw Error('Incomplete file '+name);console.log('verified',name,line);
 }
 if(!partial&&checks.games!==8000)throw Error('Expected 8000, got '+checks.games);
 for(const [key,g] of Object.entries(groups)){
 if(g.n!==1000)throw Error('Expected 1000 '+key);g.winRate=rate(g.wins,g.n);g.income=q(g.income);g.pool=q(g.pool);g.winPool=q(g.winPool);g.ms=q(g.ms);g.commandMs=q(g.commandMs);g.logActions=q(g.logActions);g.formationRate=rate(g.formed,g.n);g.mixedRate=rate(g.mixed,g.n);g.formationSpins=q(g.formationSpins);g.eventAcceptance=rate(g.events.A,g.events.A+g.events.B);
 g.stage=g.stage.map((s,i)=>({stage:i+1,reached:rate(s.reached,g.n),survival:rate(s.paid,g.n),conditionalPayment:rate(s.paid,s.reached),spinIncome:q(s.spinIncome),periodIncome:q(s.periodIncome),margin:q(s.margin),pool:q(s.pool),formedAmongReached:rate(s.formed,s.reached)}));
 for(const t of Object.values(g.ids)){t.selectionRate=rate(t.selected,t.exposures);t.acquiredWinRate=rate(t.acquiredWins,t.acquiredGames);}
 g.acquisitionStrata=Object.values(g.acquisitionStrata).map(x=>({...x,winRate:rate(x.wins,x.n)}));const extremes=g.extremes;g.extremes={lowestTotal:extremes.slice().sort((a,b)=>a.total-b.total).slice(0,3),highestTotal:extremes.slice().sort((a,b)=>b.total-a.total).slice(0,3),highestPeak:extremes.slice().sort((a,b)=>b.peak-a.peak).slice(0,3),worstMargin:extremes.slice().sort((a,b)=>a.margin-b.margin).slice(0,3)};
 }
 fs.writeFileSync(__dirname+`/f3-slice-sim-${partial?'partial-':''}statistics.json`,JSON.stringify({quantiles:'nearest rank; surviving/reached cohort only; period income completed payment periods only',proportions:'Wilson 95%; unconditional survival denominator 1000; conditional metrics labeled',groups},null,2)+'\n');fs.writeFileSync(__dirname+`/f3-slice-sim-${partial?'partial-':''}recompute.json`,JSON.stringify(checks,null,2)+'\n');
 console.log(JSON.stringify(Object.fromEntries(Object.entries(groups).map(([k,g])=>[k,{win:g.winRate,errors:g.errors.length,ms:g.ms,actions:g.actions}]))));
}
module.exports={q,rate};if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
