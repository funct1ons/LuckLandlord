'use strict';
const fs=require('fs'),path=require('path');const contract=require('./f4-exact-contract.json');
const file=path.resolve(__dirname,'../../js/gdd1/full-effects.js');let text=fs.readFileSync(file,'utf8');
const start='// BEGIN EXACT FROZEN SYMBOL METADATA',end='// END EXACT FROZEN SYMBOL METADATA';
const rows=Object.fromEntries(contract.symbols.map(({id,name,rarity,tags,base,rule})=>[id,{name,rarity,tags,base,description:rule}]));
const block=start+'\nconst exactMetadata='+JSON.stringify(rows,null,2)+';\nfor(const [id,meta] of Object.entries(exactMetadata))Object.assign(S[id],meta);\nconst exactItemMetadata='+JSON.stringify(Object.fromEntries(contract.items.map(({id,name,rarity,rule})=>[id,{name,rarity,description:rule}])),null,2)+';\nfor(const [id,meta] of Object.entries(exactItemMetadata))Object.assign(F.fullItems[id],meta);\n'+end;
if(text.includes(start)){const a=text.indexOf(start),b=text.indexOf(end,a)+end.length;text=text.slice(0,a)+block+text.slice(b)}else text=text.replace('const I=F.fullItems;',block+'\nconst I=F.fullItems;');
fs.writeFileSync(file,text,'utf8');console.log('Synchronized exact metadata only; effects remain separately audited');
