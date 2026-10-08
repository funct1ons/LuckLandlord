'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
for(const name of ['legacy-readonly','retest-run']){
 let src=fs.readFileSync(path.join(__dirname,name+'.js'),'utf8');
 const outputs={'legacy-readonly-results.json':'f2-legacy.json','retest-node.json':'f2-f1-regression.json'};
 for(const [old,next] of Object.entries(outputs))src=src.replaceAll(old,next);
 const module={exports:{}};
 vm.runInThisContext('(function(require,module,__dirname,process){'+src+'\n})',{filename:'read-only-'+name})(require,module,__dirname,process);
}
