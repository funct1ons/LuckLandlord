'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const prefix='tests/gdd1/full-sim-';
const report='docs/GDD1_FULL_SIM.md';
const runtime=['.pi/loops.json'];
function scan(dir=root){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);if(e.isDirectory()){if(e.name==='node_modules'||e.name==='.git')return [];return scan(p);}return [p];});}
function info(p){const b=fs.readFileSync(p);return {bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};}
const files=()=>scan().map(p=>path.relative(root,p).replace(/\\/g,'/')).sort();
const fresh=p=>p.startsWith(prefix)||p===report;
const mode=process.argv[2];
if(mode==='before'){
 const out=path.join(root,prefix+'before.json');if(fs.existsSync(out))throw Error('Baseline already exists');
 const entries=Object.fromEntries(files().filter(p=>!fresh(p)).map(p=>[p,info(path.join(root,p))]));
 fs.writeFileSync(out,JSON.stringify({scope:'All existing workspace files; excludes only authorized new prefix/report',entries},null,2)+'\n',{flag:'wx'});
 console.log('baseline',Object.keys(entries).length);
}else if(mode==='after'){
 const before=JSON.parse(fs.readFileSync(path.join(root,prefix+'before.json'))).entries;
 const changed=Object.entries(before).filter(([p,v])=>!fs.existsSync(path.join(root,p))||JSON.stringify(info(path.join(root,p)))!==JSON.stringify(v)).map(([p])=>p);
 const unexpected=files().filter(p=>!fresh(p)&&!Object.hasOwn(before,p));
 const runtimeHit=changed.filter(p=>p==='.pi/loops.json'||p.startsWith('.pi/loops/'));
 const other=changed.filter(p=>!(p==='.pi/loops.json'||p.startsWith('.pi/loops/')));
 const protection={existing:Object.keys(before).length,unchanged:Object.keys(before).length-changed.length,changed,runtimeExceptions:runtimeHit,unexpected,ok:!other.length&&!unexpected.length,note:'Runtime .pi/loops* is a disclosed exception and is not restored'};
 const dest=path.join(root,prefix+'protection.json');
 if(fs.existsSync(dest))throw Error('Do not overwrite evidence: '+dest);
 fs.writeFileSync(dest,JSON.stringify(protection,null,2)+'\n',{flag:'wx'});
 const deliv=path.join(root,prefix+'deliverables.json');
 const entries=Object.fromEntries(files().filter(p=>fresh(p)&&p!==prefix+'deliverables.json').map(p=>[p,info(path.join(root,p))]));
 if(fs.existsSync(deliv))throw Error('Do not overwrite evidence: '+deliv);
 fs.writeFileSync(deliv,JSON.stringify({selfExcluded:true,entries},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(protection));if(!protection.ok)process.exitCode=1;
}else throw Error('Use before or after');
