(function (G) {
  'use strict';
  G.validatePendingSettlement = function (s) {
    if (s.phase === 'SYMBOL_CHOICE') {
      if (!Number.isSafeInteger(s.pendingSettlement) || Math.abs(s.pendingSettlement) > 1e9 ||
          !s.last || s.pendingSettlement !== s.last.total) throw Error('Invalid pending settlement');
    } else if (s.pendingSettlement !== null) throw Error('Invalid settlement phase');
  };
  G.validateState = function (s) {
    const obj = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const integer = (x, min = 0, max = 1e9) => Number.isSafeInteger(x) && x >= min && x <= max;
    const uid = x => typeof x === 'string' && /^u[1-9]\d*$/.test(x) && integer(Number(x.slice(1)), 1, Number.MAX_SAFE_INTEGER);
    const fail = text => { throw Error(text); };
    if (!obj(s) || s.version !== G.VERSION || s.rules !== G.RULES) fail('Incompatible save version');
    if (typeof s.seed !== 'string' || s.seed.length > 1024 || !integer(s.rngState, 1, 0xffffffff) ||
        !integer(s.revision, 0, Number.MAX_SAFE_INTEGER) || !integer(s.spin, 0, Number.MAX_SAFE_INTEGER) ||
        !integer(s.stage, 0, 9) || !integer(s.cash) || !integer(s.payment) ||
        !integer(s.nextId, 1, Number.MAX_SAFE_INTEGER) || !integer(s.rerollTokens) || !integer(s.removeTokens) ||
        !obj(s.settings) || typeof s.settings.autosave !== 'boolean' || typeof s.settings.advanceAccepted !== 'boolean' || Object.keys(s.settings).some(k=>!['autosave','advanceAccepted'].includes(k))) fail('Invalid state values');
    if (s.contentVersion !== G.CONTENT_VERSION || !obj(s.stageState) || Object.keys(s.stageState).sort().join(',')!=='claims,paymentModifiers' || !Array.isArray(s.stageState.claims) || !Array.isArray(s.stageState.paymentModifiers) || s.stageState.claims.length>1000 || s.stageState.paymentModifiers.length>1000 || !Array.isArray(s.activeModifiers) || s.activeModifiers.length) fail('Invalid stage state');
    const keys=new Set();
    const effectKey=k=>typeof k==='string'&&k.length<=160&&/^[a-z][a-z0-9_]*\/[a-z0-9_-]+$/.test(k);
    for(const x of s.stageState.claims){if(!obj(x)||Object.keys(x).sort().join(',')!=='effectKey,source'||!uid(x.source)||!effectKey(x.effectKey)||keys.has(x.source+'/'+x.effectKey))fail('Invalid stage claim');const definition=G.symbols[x.effectKey.split('/')[0]],effect=definition&&definition.effects.find((e,i)=>definition.id+'/'+(e.effectId??i)===x.effectKey&&e.action==='stageAdvance');if(!effect)fail('Unknown stage claim effect');keys.add(x.source+'/'+x.effectKey);trackStageUid(x.source);}
    const mods=new Set();let obligations=0;
    for(const x of s.stageState.paymentModifiers){const key=x&&x.source+'/'+x.effectKey;if(!obj(x)||Object.keys(x).sort().join(',')!=='amount,effectKey,source'||!uid(x.source)||!effectKey(x.effectKey)||!integer(x.amount,1)||!keys.has(key)||mods.has(key))fail('Invalid payment modifier');const definition=G.symbols[x.effectKey.split('/')[0]],effect=definition.effects.find((e,i)=>definition.id+'/'+(e.effectId??i)===x.effectKey);if(x.amount!==effect.paymentIncrease)fail('Mismatched payment obligation');mods.add(key);obligations+=x.amount;if(!Number.isSafeInteger(obligations)||obligations>s.payment)fail('Invalid payment obligations');}
    if(mods.size!==keys.size)fail('Missing payment obligation');
    function trackStageUid(x){if(Number(x.slice(1))>=s.nextId)fail('Invalid stage UID');}
    if (!['READY','SYMBOL_CHOICE','ITEM_CHOICE','WON','LOST'].includes(s.phase)) fail('Invalid phase');
    const remaining = G.stages[s.stage].spins;
    if (!integer(s.spinsRemaining, 0, remaining) || (s.phase === 'READY' && s.spinsRemaining < 1) ||
        (s.phase === 'SYMBOL_CHOICE' && s.spinsRemaining >= remaining) ||
        (['ITEM_CHOICE','WON','LOST'].includes(s.phase) && s.spinsRemaining !== 0) ||
        (s.phase === 'WON' && s.stage !== 9) || (s.phase === 'ITEM_CHOICE' && s.stage === 9)) fail('Invalid stage');
    if (!Array.isArray(s.symbols) || s.symbols.length > 200) fail('Invalid pool');
    const seen = new Set(); let greatest = 0;
    const track = x => { if (!uid(x)) fail('Invalid UID'); greatest = Math.max(greatest, Number(x.slice(1))); };
    for (const x of s.symbols) {
      if (!obj(x) || !uid(x.uid) || seen.has(x.uid) || !G.symbols[x.type] ||
          !integer(x.permanent, 0, Number.MAX_SAFE_INTEGER) || !obj(x.counters) ||
          Object.keys(x.counters).some(k => !['age','beat','pressure'].includes(k) || !integer(x.counters[k])) ||
          Object.keys(x).some(k => !['uid','type','permanent','counters'].includes(k))) fail('Invalid instance');
      seen.add(x.uid); track(x.uid);
    }
    if (!Array.isArray(s.items) || s.items.length > 9 || new Set(s.items).size !== s.items.length || s.items.some(x => !G.items[x])) fail('Invalid items');
    const item=s.itemState;
    if(!obj(item)||Object.keys(item).sort().join(',')!=='runCounts,spin,spinCounts,stage,stageCounts,version'||item.version!==1||!integer(item.stage,0,9)||(item.stage!==s.stage&&Object.keys(item.stageCounts||{}).length)||!integer(item.spin,0,Number.MAX_SAFE_INTEGER)||item.spin<s.spin||item.spin>s.spin+1)fail('Invalid item state');
    for(const window of ['run','stage','spin']){
      const counts=item[window+'Counts'];if(!obj(counts))fail('Invalid item counts');
      for(const [key,n] of Object.entries(counts)){
        const parts=key.split('/'),d=G.items[parts[0]],index=Number(parts[1]),e=d&&d.effects&&d.effects[index];
        if(parts.length!==2||!/^\d+$/.test(parts[1])||!e||!s.items.includes(d.id)||!integer(n,1,Number.MAX_SAFE_INTEGER)||(window!=='run'&&(e.window!==window||n>e.limit)))fail('Invalid item counter');
      }
    }
    if (!Array.isArray(s.choices) || new Set(s.choices).size !== s.choices.length ||
        (s.phase === 'SYMBOL_CHOICE' ? s.choices.length !== 3 || s.choices.some(x => !G.symbols[x]) :
         s.phase === 'ITEM_CHOICE' ? s.choices.length < 1 || s.choices.length > 3 || s.choices.some(x => !G.items[x] || s.items.includes(x)) :
         s.choices.length !== 0)) fail('Invalid choices');
    if (!Array.isArray(s.reservations) || s.reservations.length > 2 ||
        new Set(s.reservations.map(x => x && x.uid)).size !== s.reservations.length ||
        new Set(s.reservations.map(x => x && x.pos)).size !== s.reservations.length ||
        s.reservations.some(x => !obj(x) || !seen.has(x.uid) || !integer(x.pos, 0, 19) || !uid(x.source))) fail('Invalid reservations');
    if (!obj(s.stats) || !obj(s.stats.chosen) ||
        ['spins','removed','stages','skipped','rerolls','events'].some(k => !integer(s.stats[k], 0, Number.MAX_SAFE_INTEGER)) ||
        !integer(s.stats.total, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) ||
        !integer(s.stats.best, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) ||
        Object.entries(s.stats.chosen).some(([k,v]) => !G.symbols[k] || !integer(v, 0, Number.MAX_SAFE_INTEGER))) fail('Invalid statistics');
    if (!Array.isArray(s.history) || s.history.length > 50 || s.history.some(x => !obj(x) ||
        !integer(x.spin, 0, Number.MAX_SAFE_INTEGER) || !integer(x.total, -1e9))) fail('Invalid history');
    if (s.last !== null) {
      const r = s.last;
      if (!obj(r) || !Array.isArray(r.board) || r.board.length !== 20 || !Array.isArray(r.ledger) ||
          !Array.isArray(r.log) || !integer(r.total, -1e9) || !integer(r.reward, -1e9)) fail('Invalid snapshot shape');
      const snaps = new Map();
      for (const c of r.board) {
        if (c === null) continue;
        if (!obj(c) || !uid(c.uid) || snaps.has(c.uid) || !G.symbols[c.type] || typeof c.alive !== 'boolean') fail('Invalid snapshot board');
        snaps.set(c.uid, c); track(c.uid);
      }
      const ledgers = new Set(); let total = r.reward;
      for (const x of r.ledger) {
        const c = obj(x) && snaps.get(x.uid);
        if (!c || ledgers.has(x.uid) || c.type !== x.type || c.alive !== x.alive || !integer(x.amount, -1e9) ||
            (!x.alive && x.amount !== 0) || !Array.isArray(x.ratio) || x.ratio.length !== 2 ||
            !x.ratio.every(v => typeof v === 'string' && /^[1-9]\d*$/.test(v))) fail('Invalid snapshot ledger');
        ledgers.add(x.uid); total += x.amount;
        if (!Number.isSafeInteger(total)) fail('Snapshot overflow');
      }
      if (ledgers.size !== snaps.size || total !== r.total) fail('Invalid snapshot total');
      const actions = new Set(G.actions.concat(['tagAdded','limitSkipped','itemEffect','itemDraw']));
      const reasons = ['source-target-once','definition-target-sources','source-spawn','definition-spawns','pool-full','no-legal-target','transform-cycle'];
      r.log.forEach((x, i) => {
        if (!obj(x) || x.id !== i || !actions.has(x.type) || !integer(x.depth, 0, 32) ||
            (x.parent !== null && !integer(x.parent, 0, i - 1))) fail('Invalid causal log');
        if(x.type==='itemDraw'){
          const d=G.items[x.itemId],e=d&&d.effects&&d.effects[Number(x.effectKey?.split('/')[1])];
          if(Object.keys(x).sort().join(',')!=='depth,effectKey,id,itemId,parent,ratio,type,uid'||!s.items.includes(x.itemId)||!e||e.hook!=='draw'||x.effectKey!==x.itemId+'/'+Number(x.effectKey.split('/')[1])||x.parent!==null||x.depth!==0||JSON.stringify(x.ratio)!==JSON.stringify(e.ratio)||!uid(x.uid))fail('Invalid item draw log');track(x.uid);
        }
        if(x.type==='itemEffect'){
          const definition=G.items[x.itemId],effect=definition&&definition.effects&&definition.effects[Number(x.effectKey?.split('/')[1])];
          if(Object.keys(x).sort().join(',')!=='action,amount,createdUid,depth,effectKey,hook,id,itemId,parent,reason,source,target,type'||!definition||!s.items.includes(x.itemId)||!effect||x.effectKey!==x.itemId+'/'+Number(x.effectKey.split('/')[1])||effect.hook!==x.hook||effect.action!==x.action||!integer(x.amount)||!['threshold-progress','already-transformed','pool-full',null].includes(x.reason)||(x.source!==null&&!snaps.has(x.source))||(x.target!==null&&!snaps.has(x.target))||(x.createdUid!==null&&!uid(x.createdUid)))fail('Invalid item log');
          if(x.createdUid!==null)track(x.createdUid);
        }
        if (x.type === 'limitSkipped' && ((!snaps.has(x.source) && !(G.items[x.source] && s.items.includes(x.source) && x.effectKey.startsWith(x.source+'/'))) || (!snaps.has(x.target) && x.target !== '$board') ||
            typeof x.effectKey !== 'string' || !x.effectKey.includes('/') || !['multiplier','spawn','transform'].includes(x.component) ||
            !reasons.includes(x.reason) || !integer(x.limit) || !G.triggers.includes(x.event))) fail('Invalid limit log');
        if(x.stageContract!==undefined){const z=x.stageContract;if(x.type!=='stageAdvance'||!obj(z)||Object.keys(z).sort().join(',')!=='createdUid,paymentAfter,paymentBefore,paymentIncrease,reward'||!integer(z.reward)||!integer(z.paymentIncrease,1)||!integer(z.paymentBefore)||!integer(z.paymentAfter)||z.paymentBefore+z.paymentIncrease!==z.paymentAfter||(z.createdUid!==null&&!uid(z.createdUid)))fail('Invalid stage contract log');if(z.createdUid!==null)track(z.createdUid);}
        if (x.type === 'tagAdded' && (!Array.isArray(x.tags) || !x.tags.length || x.tags.some(t => !G.tags.includes(t)) ||
            new Set(x.tags).size !== x.tags.length || !snaps.has(x.source) || !snaps.has(x.target) ||
            x.event !== 'ON_APPEAR' || x.amount !== null || x.payload !== null)) fail('Invalid tag log');
        if (x.actualIncrease !== undefined && (x.type !== 'grow' || !integer(x.actualIncrease, 0, 30))) fail('Invalid growth log');
      });
    }
    if (s.nextId <= greatest) fail('Invalid next UID');
    G.validatePendingSettlement(s);
    return true;
  };
})(window.Game);
