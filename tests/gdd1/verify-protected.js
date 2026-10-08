'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),snapshot=path.join(__dirname,'protected-before.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const snapshotHash=sha(fs.readFileSync(snapshot));
if(snapshotHash!=='8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e')throw Error('Initial protection snapshot modified');
const before=JSON.parse(fs.readFileSync(snapshot,'utf8'));
const files=before.files.map(row=>{
  const file=path.join(root,row.path);
  if(!fs.existsSync(file))return {...row,ok:false,error:'missing'};
  const bytes=fs.readFileSync(file),after={bytes:bytes.length,sha256:sha(bytes)};
  return {path:row.path,before:{bytes:row.bytes,sha256:row.sha256},after,ok:row.bytes===after.bytes&&row.sha256===after.sha256};
});
const report={snapshotHash,total:files.length,unchanged:files.filter(x=>x.ok).length,changed:files.filter(x=>!x.ok),files};
fs.writeFileSync(path.join(__dirname,'protected-after.json'),JSON.stringify(report,null,2)+'\n');
console.log(`${report.unchanged}/${report.total} protected files byte-identical`);
report.changed.forEach(x=>console.error(x));
process.exitCode=report.changed.length?1:0;
