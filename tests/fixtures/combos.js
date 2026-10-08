(function(G){'use strict';
// Hand-derived base: slag consumed; hook 1; echo 1+2; meter 1+1; lens 1*2; reward 5 = 13.
// Genuine causal chain: hook consume(depth0) -> echo add(depth1) -> meter grow(depth2) -> lens multiply(depth3).
G.fixtures=[
{name:'回收链',extra:null,expected:13,reason:'1+3+2+2+5=13'},
{name:'复制接入链',extras:[['battery',4],['mirror',3]],expected:20,reason:'13+定热芯4+薄相纸(1+复制2)=20'},
{name:'竞争消耗链',extra:'hook',pos:5,expected:14,reason:'两钩争残片仅一次奖励；第二钩基础1：13+1=14'},
{name:'邻接调频',extra:'tuner',pos:11,expected:16,reason:'调频邻接echo加2，梳基础1：13+2+1=16'},
{name:'销毁哨增幅',extra:'warden',expected:20,reason:'哨1+3，额外GAIN使表+1、镜由2到4：13+4+1+2=20'},
{name:'转换后因果链',layout:[['still',0],['bloom',1],['meter',10],['lens',15],['echo',19]],expected:12,reason:'釜转换0→晶加法1→表成长2→镜倍率3；1+6+2+2+1=12'},
{name:'永久成长双乘区',extras:[['press',16],['press',11]],expected:17,reason:'表floor(2×1.5×1.5)=4，两环各floor(1×1.5)=1：13+2+2=17'},
{name:'雾芽成熟',extra:'bud',age:1,expected:16,reason:'第二次出现转灯花基础3：13+3=16'},
{name:'自毁哨因果链',layout:[['spark',0],['warden',1],['meter',10],['lens',15],['tuner',19]],expected:12,reason:'签自毁0→哨加法1→表成长2→镜倍率3；签额外GAIN另使表+1/镜×2：哨4+表3+镜4+梳1=12'},
{name:'育匣新生',extra:'seedbox',expected:14,reason:'13+1=14；生成雾芽只下轮出现'}
];G.fixtureState=function(f){const s=G.newRun('FIXTURE');s.symbols=[];s.nextId=1;const board=Array(20).fill(null);(f.layout||[['slag',0],['hook',1],['echo',10],['meter',15],['lens',19]]).forEach(([type,pos])=>{const x=G.instance(s,type);s.symbols.push(x);board[pos]=x.uid;});if(f.extra){const x=G.instance(s,f.extra);if(f.age)x.counters.age=f.age;s.symbols.push(x);board[f.pos??4]=x.uid;}for(const [type,pos] of f.extras||[]){const x=G.instance(s,type);s.symbols.push(x);board[pos]=x.uid;}return {s,board};};
})(window.Game);
