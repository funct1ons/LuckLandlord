(function(root){
'use strict';
const F=root.GDD1;
const symbolWeights=[[72,25,3,0],[58,34,8,0],[43,42,14,1],[32,45,21,2],[25,45,27,3]];
const itemWeights=[[55,40,5,0],[30,50,20,0],[20,50,30,0]];
const rarities=['common','uncommon','rare','epic'];
F.weightedIndex=function(weights,rng,stream){const sum=weights.reduce((a,b)=>a+b,0);if(sum<=0)throw Error('Empty weights');let x=F.random(rng,stream)*sum;for(let i=0;i<weights.length;i++){x-=weights[i];if(x<0)return i}return weights.length-1};
const pick=(ids,s,stream)=>ids[Math.floor(F.random(s.rng,stream)*ids.length)];
F.sliceOffer=function(s,kind,natural=true){
 const symbols=kind==='symbol',defs=symbols?F.defs(s).symbols:F.defs(s).items,stream=symbols?'symbolOffer':'itemOffer';
 let remaining=Object.values(defs).filter(d=>symbols?d.mechanics.candidate!==false:!s.items.includes(d.id));
 const weights=symbols?symbolWeights[Math.floor((s.stageId-1)/2)]:itemWeights[Math.min(2,Math.floor((s.stageId-1)/3))];
 const choices=[],g=s.offer.guarantees;g.applied=null;
 if(symbols&&natural){
  let eligible=[];
  if(g.eventCrystalPending){eligible=remaining.filter(d=>d.rarity==='uncommon'&&d.tags.includes('crystal'));g.applied='event-crystal'}
  else if(g.itemProductPending){eligible=remaining.filter(d=>d.rarity==='common'&&d.tags.includes('product'));g.applied='item-product'}
  else if(!g.stageCommonHandled){eligible=remaining.filter(d=>d.rarity==='common');g.applied='stage-common'}
  if(eligible.length){const id=pick(eligible.map(d=>d.id),s,stream);choices.push(id);remaining=remaining.filter(d=>d.id!==id);if(g.applied==='event-crystal')g.eventCrystalPending=false;if(g.applied==='item-product')g.itemProductPending=false}
  else g.applied=null;
  g.stageCommonHandled=true;
 }
 while(choices.length<3&&remaining.length){const layerWeights=rarities.map((r,i)=>remaining.some(d=>d.rarity===r)?weights[i]:0);const rarity=rarities[F.weightedIndex(layerWeights,s.rng,stream)];const id=pick(remaining.filter(d=>d.rarity===rarity).map(d=>d.id),s,stream);choices.push(id);remaining=remaining.filter(d=>d.id!==id)}
 s.offer.kind=kind;s.offer.choices=choices;
 if(natural){s.offer.windowId++;s.offer.choiceRefreshesUsed=0}
};
F.sliceDraw=function(s){
 const board=Array(20).fill(null),reserved=new Set();
 for(const r of s.reservations){const x=s.pool.find(x=>x.uid===r.uid&&x.epoch===r.epoch);if(x&&r.expiresSpin===s.spin+1){board[r.pos]=x;reserved.add(x.uid)}}
 s.reservations=[];
 const rest=s.pool.filter(x=>!reserved.has(x.uid)),selected=[];
 const slots=board.map((x,i)=>x?null:i).filter(x=>x!==null);
 if(rest.length<=slots.length)selected.push(...rest);
 else while(selected.length<slots.length){const weights=rest.map(x=>{let w=1;for(const id of s.items)for(const e of F.defs(s).items[id].effects)if(e.op==='weight'&&(!e.poolMax||s.pool.length<=e.poolMax)&&F.defs(s).symbols[x.type].tags.includes(e.tag))w*=e.ratio[0]/e.ratio[1];return Math.max(.25,Math.min(2,w))});const index=F.weightedIndex(weights,s.rng,'draw');selected.push(rest.splice(index,1)[0])}
 // Shuffle all unlocked slots, including empties: no top-left packing.
 const positions=F.shuffle(slots,s.rng,'draw');selected.forEach((x,i)=>{board[positions[i]]=x});return board;
};
})(typeof window!=='undefined'?window:globalThis);
