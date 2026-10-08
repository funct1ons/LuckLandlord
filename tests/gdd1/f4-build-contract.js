'use strict';
// Read-only extraction of frozen GDD tables. Writes only a new F4 contract artifact.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),text=fs.readFileSync(path.join(root,'docs/GAME_DESIGN_V1.md'),'utf8');
const symbols=[];
for(const line of text.split(/\r?\n/)){
 const c=line.split('|').slice(1,-1).map(x=>x.trim());
 if(c.length===7&&/^[a-z][a-z_]+$/.test(c[0])&&/^(common|uncommon|rare|epic)$/.test(c[2])&&/^-?\d+$/.test(c[4]))symbols.push({id:c[0],name:c[1],rarity:c[2],tags:c[3].split(','),base:Number(c[4]),rule:c[5],role:c[6]});
}
if(symbols.length!==64||new Set(symbols.map(x=>x.id)).size!==64)throw Error('Frozen symbol table extraction mismatch: '+symbols.length);
const items=[],events=[];
for(const line of text.split(/\r?\n/)){
 const c=line.split('|').slice(1,-1).map(x=>x.trim());
 if(c.length===5&&/^item_[a-z_]+$/.test(c[0])&&/^(common|uncommon|rare)$/.test(c[2]))items.push({id:c[0],name:c[1],rarity:c[2],rule:c[3],role:c[4]});
 if(c.length===5&&/^event_[a-z_]+ \/ /.test(c[0])){const [id,name]=c[0].split(' / ');events.push({id,name,qualification:c[1],optionA:c[2],optionB:c[3],boundary:c[4]});}
}
if(items.length!==32||events.length!==8)throw Error('Item/event extraction mismatch '+items.length+'/'+events.length);
const artifact={source:'docs/GAME_DESIGN_V1.md',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'docs/GAME_DESIGN_V1.md'))).digest('hex').toUpperCase(),status:'CONTRACT EXTRACTION ONLY / NOT BEHAVIOR ACCEPTANCE',symbols,items,events};
fs.writeFileSync(path.join(__dirname,'f4-exact-contract.json'),JSON.stringify(artifact,null,2)+'\n');
console.log('Extracted '+symbols.length+'/'+items.length+'/'+events.length+' exact frozen contracts');
