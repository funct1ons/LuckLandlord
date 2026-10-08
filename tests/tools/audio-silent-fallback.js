// 音效系统自检：无声环境下必须静默降级，绝不抛错
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../..');
const ctx={window:{},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,setTimeout,clearTimeout,isFinite};
ctx.globalThis=ctx;ctx.window.window=ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/gdd1UI/audio.js'),'utf8'),ctx,{filename:'audio.js'});

const SFX=ctx.window.SFX;
console.log('=== 无声环境（无 AudioContext）===');
console.log('isSupported:', SFX.isSupported());
console.log('isEnabled  :', SFX.isEnabled());
console.log('names      :', SFX.names().join(', '));

let threw=0;
for(const n of SFX.names()){
  try{ SFX.play[n](2); }catch(e){ threw++; console.log('  !! '+n+' 抛错: '+e.message); }
}
console.log('全部音效调用抛错数: '+threw+(threw===0?'  ✓ 静默降级正常':'  ✗'));

try{ SFX.unlock(); SFX.setVolume(0.5); SFX.setEnabled(false); SFX.setEnabled(true); console.log('控制接口: ✓ 无异常'); }
catch(e){ console.log('控制接口: ✗ '+e.message); }

// 模拟浏览器 AudioContext，验证真实发声路径不会抛错
console.log('\n=== 模拟 AudioContext ===');
let nodesCreated=0, started=0;
function fakeParam(){return{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}};}
const fakeCtx={
  currentTime:0, sampleRate:44100, state:'running',
  destination:{},
  resume(){return Promise.resolve();},
  createGain(){nodesCreated++;return{gain:fakeParam(),connect(){},disconnect(){}};},
  createOscillator(){nodesCreated++;return{type:'',frequency:fakeParam(),connect(){},start(){started++;},stop(){},set onended(f){}};},
  createBuffer(ch,len){return{getChannelData(){return new Float32Array(len);}};},
  createBufferSource(){nodesCreated++;return{buffer:null,connect(){},start(){started++;},set onended(f){}};},
  createBiquadFilter(){nodesCreated++;return{type:'',frequency:{value:0},Q:{value:0},connect(){}};}
};
const ctx2={window:{AudioContext:function(){return fakeCtx;}},console,Object,JSON,Math,Array,String,Number,Boolean,Date,Set,Map,Error,setTimeout,clearTimeout,isFinite};
ctx2.globalThis=ctx2;ctx2.window.window=ctx2.window;
vm.createContext(ctx2);
vm.runInContext(fs.readFileSync(path.join(root,'js/gdd1UI/audio.js'),'utf8'),ctx2,{filename:'audio.js'});
const S2=ctx2.window.SFX;
console.log('isSupported:', S2.isSupported());
let threw2=0;
for(const n of S2.names()){ try{ S2.play[n](3); }catch(e){ threw2++; console.log('  !! '+n+': '+e.message); } }
console.log('创建音频节点数: '+nodesCreated+'   启动音源数: '+started);
console.log('抛错数: '+threw2+(threw2===0?'  ✓ 合成路径正常':'  ✗'));
console.log('\n注意: setTimeout 在 vm 外执行，release() 可能异步报错——已用 try 包裹');
