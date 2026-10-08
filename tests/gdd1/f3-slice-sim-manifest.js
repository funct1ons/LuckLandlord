'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const prefix='tests/gdd1/f3-slice-sim-';
const report='docs/GDD1_SLICE_SIMULATION.md';
function scan(dir=root){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?scan(p):[p]});}
function info(p){const b=fs.readFileSync(p);return {bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};}
const files=()=>scan().map(p=>path.relative(root,p).replace(/\\/g,'/')).sort();
const fresh=p=>p.startsWith(prefix)||p===report;
const mode=process.argv[2];
if(mode==='before'){
 const out=prefix+'before.json';if(fs.existsSync(path.join(root,out)))throw Error('Baseline already exists');
 const entries=Object.fromEntries(files().filter(p=>!fresh(p)).map(p=>[p,info(path.join(root,p))]));
 fs.writeFileSync(path.join(root,out),JSON.stringify({scope:'All existing workspace files; excludes only authorized new prefix/report',entries},null,2)+'\n');console.log('baseline',Object.keys(entries).length);
}else if(mode==='after'){
 const before=JSON.parse(fs.readFileSync(path.join(root,prefix+'before.json'))).entries;
 const changed=Object.entries(before).filter(([p,v])=>!fs.existsSync(path.join(root,p))||JSON.stringify(info(path.join(root,p)))!==JSON.stringify(v)).map(([p])=>p);
 const unexpected=files().filter(p=>!fresh(p)&&!Object.hasOwn(before,p));
 const protection={existing:Object.keys(before).length,unchanged:Object.keys(before).length-changed.length,changed,unexpected,ok:!changed.length&&!unexpected.length};
 fs.writeFileSync(path.join(root,prefix+'protection.json'),JSON.stringify(protection,null,2)+'\n');
 const entries=Object.fromEntries(files().filter(p=>fresh(p)&&p!==prefix+'deliverables.json').map(p=>[p,info(path.join(root,p))]));
 fs.writeFileSync(path.join(root,prefix+'deliverables.json'),JSON.stringify({selfExcluded:true,entries},null,2)+'\n');console.log(JSON.stringify(protection));if(!protection.ok)process.exitCode=1;
}else throw Error('Use before or after');
