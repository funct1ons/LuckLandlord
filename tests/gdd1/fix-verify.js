'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=__dirname,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const allowed=['js/gdd1/save.js','js/gdd1/schema.js'];
function verify(files){return files.map(before=>{const b=fs.readFileSync(path.join(root,before.path));const after={bytes:b.length,sha256:sha(b)};return {path:before.path,before:{bytes:before.bytes,sha256:before.sha256},after,unchanged:before.bytes===after.bytes&&before.sha256===after.sha256}})}
const original=verify(read('protected-before.json').files),entry=verify(read('fix-before.json').files),f1=verify(read('f1-deliverables.json').files);
const changed=entry.filter(x=>!x.unchanged),unexpected=changed.filter(x=>!allowed.includes(x.path));
const protectedSnapshotSha256=sha(fs.readFileSync(path.join(dir,'protected-before.json')));
const summary=rows=>({total:rows.length,unchanged:rows.filter(x=>x.unchanged).length});
const result={scope:'Repair hashes; original f1-deliverables remains a historical snapshot',original245:summary(original),repairEntry:summary(entry),historicalF1:summary(f1),allowedSourceChanges:changed,unexpectedChanges:unexpected,protectedSnapshotSha256,repairBeforeSha256:sha(fs.readFileSync(path.join(dir,'fix-before.json'))),originalRows:original,entryRows:entry,ok:original.every(x=>x.unchanged)&&unexpected.length===0&&JSON.stringify(changed.map(x=>x.path).sort())===JSON.stringify(allowed.slice().sort())&&protectedSnapshotSha256==='8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e'};
fs.writeFileSync(path.join(dir,'fix-protection.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({original245:result.original245,repairEntry:result.repairEntry,historicalF1:result.historicalF1,allowedSourceChanges:changed,unexpectedChanges:unexpected,ok:result.ok},null,2));process.exitCode=result.ok?0:1;
