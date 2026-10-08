'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=__dirname,root=path.resolve(dir,'../..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const protection=JSON.parse(fs.readFileSync(path.join(dir,'fix-protection.json'),'utf8'));
for(const row of protection.entryRows){const bytes=fs.readFileSync(path.join(root,row.path));if(bytes.length!==row.after.bytes||hash(bytes)!==row.after.sha256)throw Error('Change since repair verification: '+row.path)}
const paths=['docs/GDD1_F1_FIX.md',...['contract','rng','schema','save'].map(n=>'js/gdd1/'+n+'.js'),...fs.readdirSync(dir).filter(n=>n.startsWith('fix-')&&n!=='fix-deliverables.json').map(n=>'tests/gdd1/'+n)].sort();
const files=paths.map(p=>{const b=fs.readFileSync(path.join(root,p));return {path:p,bytes:b.length,sha256:hash(b)}});
const result={scope:'New F1 repair hashes; excludes this manifest itself, preserves original f1-deliverables snapshot',files,modifiedSources:protection.allowedSourceChanges,original245:protection.original245,repairEntry:protection.repairEntry,frozenGddSha256:hash(fs.readFileSync(path.join(root,'docs/GAME_DESIGN_V1.md'))),historicalF1ManifestSha256:hash(fs.readFileSync(path.join(dir,'f1-deliverables.json'))),node:process.version};
fs.writeFileSync(path.join(dir,'fix-deliverables.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({files:files.length,original245:result.original245,repairEntry:result.repairEntry,frozenGddSha256:result.frozenGddSha256,node:result.node},null,2));
