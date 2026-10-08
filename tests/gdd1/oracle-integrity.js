(function(root){
  'use strict';
  root.runGdd1OracleIntegrityTests=function(){
    const results=[],F=root.GDD1;
    function assert(ok,message){if(!ok)throw Error(message);}
    for(const c of root.GDD1_HAND_ORACLES.cases){
      try{
        assert(new Set(c.initial.map(x=>x[2])).size>=4,'fewer than four symbol definitions');
        assert(c.chain.length>=4,'fewer than three causal edges');
        const ids=c.initial.map(x=>x[1]);
        assert(new Set(ids).size===ids.length,'duplicate input UID');
        assert(c.initial.every(x=>F.PROFILES[c.profile].symbols.includes(x[2])),'unknown initial symbol');
        assert(c.items.every(x=>F.ITEM_IDS.includes(x)),'unknown item');
        assert(c.ledger.length===c.initial.length,'missing original ledger cells');
        let total=c.rewards.reduce((sum,x)=>sum+x[1],0);
        for(const row of c.ledger){
          const [pos,uid,type,flat,n,d,amount,alive]=row;
          assert(ids.includes(uid)&&F.SYMBOL_IDS.includes(type),'unknown result UID/type');
          assert(c.initial.some(x=>x[0]===pos&&x[1]===uid),'UID moved unexpectedly');
          // Independent arithmetic check only. Does NOT execute effects or infer expected facts.
          const scaled=BigInt(flat)*BigInt(n),den=BigInt(d);
          const quotient=scaled/den-(scaled<0n&&scaled%den!==0n?1n:0n);
          assert(amount===(alive?Number(quotient):0),'hand ledger arithmetic error');
          assert(c.removed.includes(uid)===!alive,'removed/liveness disagreement');
          total+=amount;
        }
        assert(total===c.pending,'hand total arithmetic error');
        assert(new Set([...ids,...c.created.map(x=>x[0])]).size===ids.length+c.created.length,'reused spawn UID');
        assert(c.facts.length>0,'missing state/quota oracle');
        results.push({name:'gdd1/f1/oracle-integrity/'+c.id,ok:true});
      }catch(e){results.push({name:'gdd1/f1/oracle-integrity/'+c.id,ok:false,error:e.message});}
    }
    return results;
  };
})(typeof window!=='undefined'?window:globalThis);
