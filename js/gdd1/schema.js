(function (root) {
  'use strict';
  const F = root.GDD1;
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const int = (x, lo = 0, hi = 1e9) => Number.isSafeInteger(x) && x >= lo && x <= hi;
  const fail = message => { throw Error('GDD1: ' + message); };
  const require = (ok, message) => { if (!ok) fail(message); };
  const exact = (x, keys, name) => require(object(x) && Object.keys(x).sort().join('|') === keys.slice().sort().join('|'), name + ' fields');
  const uid = x => typeof x === 'string' && /^u[1-9]\d*$/.test(x) && int(Number(x.slice(1)), 1, Number.MAX_SAFE_INTEGER);
  const unique = a => new Set(a).size === a.length;
  const list = (x, max, name) => require(Array.isArray(x) && x.length <= max, name);
  const nullable = (x, predicate) => x === null || predicate(x);
  F.validateState = function (s) {
    exact(s, ['schema','rules','content','saveKey','rngAlgorithm','profile','difficulty','seed','rng','revision',
      'phase','stageId','spin','stageSpin','spinsRemaining','basePayment','payment','cash','pendingSettlement','last',
      'pool','nextUid','items','rerollTokens','removeTokens','offer','events','reservations','fractionGaugeReserved',
      'itemState','stageState','settings'], 'state');
    require(s.schema === 2 && s.rules === F.RULES && s.content === F.CONTENT && s.saveKey === F.SAVE_KEY &&
      s.rngAlgorithm === F.RNG_ALGORITHM && Object.hasOwn(F.PROFILES,s.profile) && s.difficulty === 'Normal', 'incompatible version/profile');
    const profile = F.PROFILES[s.profile];
    require(typeof s.seed === 'string' && s.seed.length <= 1024 && int(s.revision,0,Number.MAX_SAFE_INTEGER), 'identity/revision');
    exact(s.rng, F.STREAMS, 'rng');
    const initialRng = F.createRng(s.seed,s.profile,s.difficulty);
    for (const name of F.STREAMS) {
      exact(s.rng[name], ['state','consumed'], 'rng.' + name);
      require(int(s.rng[name].state,1,0xffffffff) && int(s.rng[name].consumed,0,Number.MAX_SAFE_INTEGER), 'rng.' + name);
      require(s.rng[name].consumed !== 0 || s.rng[name].state === initialRng[name].state, 'unconsumed RNG identity');
    }
    require(F.STABLE_PHASES.includes(s.phase) && int(s.stageId,1,10) && int(s.spin,0,70) && int(s.stageSpin,0,F.NORMAL_SPINS[s.stageId-1]), 'phase/stage/spin');
    require(s.spin === F.NORMAL_SPINS.slice(0,s.stageId-1).reduce((a,b) => a+b,0) + s.stageSpin &&
      s.spinsRemaining === F.NORMAL_SPINS[s.stageId-1]-s.stageSpin, 'spin window');
    require(s.basePayment === profile.payments[s.stageId-1] && int(s.payment,1) && int(s.cash) &&
      int(s.nextUid,1,Number.MAX_SAFE_INTEGER) && int(s.rerollTokens,0,9) && int(s.removeTokens,0,9), 'money/resources');
    require((s.phase !== 'READY' || s.spinsRemaining > 0) &&
      (s.phase !== 'SYMBOL_CHOICE' || s.stageSpin > 0) &&
      (!['ITEM_CHOICE','WON','LOST'].includes(s.phase) || s.spinsRemaining === 0) &&
      (s.phase !== 'ITEM_CHOICE' || s.stageId < 10) && (s.phase !== 'WON' || s.stageId === 10) &&
      (s.phase !== 'EVENT_CHOICE' || (s.stageId >= 3 && s.stageId <= 9 && s.stageSpin === 0)), 'stable phase window');
    const track = x => { require(uid(x) && Number(x.slice(1)) < s.nextUid, 'UID/nextUid'); return x; };
    list(s.pool,200,'pool');
    require(unique(s.pool.map(x => x && x.uid)), 'duplicate pool UID');
    const pool = new Map();
    for (const x of s.pool) {
      exact(x, ['uid','type','permanent','epoch','counters'], 'instance'); track(x.uid);
      require(profile.symbols.includes(x.type) && int(x.permanent,0,30) && int(x.epoch,0,Number.MAX_SAFE_INTEGER), 'instance values');
      const counterKeys = F.AGE_TYPES[x.type] || x.type === 'ash_felt' ? ['age'] :
        F.PRESSURE_TYPES[x.type] ? ['pressure'] : x.type === 'beat_spool' ? ['beat'] : [];
      exact(x.counters,counterKeys,'counters');
      for (const [key,value] of Object.entries(x.counters)) {
        const max = key === 'age' ? (F.AGE_TYPES[x.type] || (x.type === 'ash_felt' ? 3 : -1)) :
          key === 'pressure' ? F.PRESSURE_TYPES[x.type] : key === 'beat' && x.type === 'beat_spool' ? 2 : -1;
        require(int(value,0,max === undefined ? -1 : max), 'counter mechanism');
        if (key === 'age') require(value < max,'uncommitted maturity');
      }
      pool.set(x.uid,x);
    }
    list(s.items,9,'items'); require(unique(s.items) && s.items.every(x => profile.items.includes(x)), 'items/profile');
    require(s.items.length <= (s.phase === 'ITEM_CHOICE' ? s.stageId-1 : Math.min(s.stageId-1,9)), 'item acquisition window');
    exact(s.offer, ['windowId','kind','choices','choiceRefreshesUsed','guarantees'], 'offer');
    require(int(s.offer.windowId,0,Number.MAX_SAFE_INTEGER) && int(s.offer.choiceRefreshesUsed,0,3), 'offer window/refresh');
    const g = s.offer.guarantees;
    exact(g, ['applied','stageCommonHandled','eventCrystalPending','itemProductPending'], 'guarantees');
    require([null,'stage-common','event-crystal','item-product'].includes(g.applied) &&
      [g.stageCommonHandled,g.eventCrystalPending,g.itemProductPending].every(x => typeof x === 'boolean'), 'guarantees');
    list(s.offer.choices,3,'choices'); require(unique(s.offer.choices), 'duplicate offers');
    const kind = s.phase === 'SYMBOL_CHOICE' ? 'symbol' : s.phase === 'ITEM_CHOICE' ? 'item' : null;
    require(s.offer.kind === kind && (kind ? s.offer.windowId > 0 && s.offer.choices.length > 0 : s.offer.choices.length === 0), 'offer phase');
    require(s.offer.choices.every(x => kind === 'symbol' ? profile.symbols.includes(x) && !['spent_gasket','arrears_slip'].includes(x) :
      kind === 'item' && profile.items.includes(x) && !s.items.includes(x)), 'offer definitions');
    require(kind === 'symbol' || (s.offer.choiceRefreshesUsed === 0 && g.applied === null), 'refresh/applied phase');
    require(s.offer.choiceRefreshesUsed === 0 || g.applied === null, 'refresh consumed guarantee');
    exact(s.events, ['seenIds','count','cooldownPayments','activeModifiers','choice'], 'events');
    list(s.events.seenIds,3,'seen events');
    require(unique(s.events.seenIds) && s.events.seenIds.every(x => profile.events.includes(x)) && s.events.count === s.events.seenIds.length &&
      int(s.events.cooldownPayments,0,1), 'event count/cooldown');
    list(s.events.activeModifiers,200,'modifiers');
    const modifierIds = new Set();
    for (const m of s.events.activeModifiers) {
      exact(m,['eventId','uid','stageId','remaining'], 'modifier');
      require(s.events.seenIds.includes(m.eventId) && int(m.stageId,3,s.stageId), 'modifier event/stage');
      const k = m.eventId + '/' + m.uid;
      require(!modifierIds.has(k), 'duplicate modifier'); modifierIds.add(k);
      if (m.eventId === 'event_fog_shift') {
        track(m.uid); const target = pool.get(m.uid);
        // Only age-bearing plant definitions qualify; UID-bound uses survive stages
        // and mist -> dew conversion, but not conversion to an age-less product/deletion.
        require(target && ['mist_pouch','dew_lantern'].includes(target.type) &&
          F.AGE_TYPES[target.type] && int(m.remaining,1,2), 'fog modifier target/remaining');
      } else {
        const window = m.eventId === 'event_empty_manifest' ? 1 : 3;
        // stageSpin counts completed spins, including an unresolved symbol choice.
        // Fixed windows expire at spin commit even if no eligible symbol appeared.
        require(['event_silent_bell','event_empty_manifest','event_misprint_window'].includes(m.eventId) && m.uid === null &&
          m.stageId === s.stageId && s.stageSpin < window && m.remaining === window-s.stageSpin, 'stage modifier');
      }
    }
    if (s.phase === 'EVENT_CHOICE') {
      const c = s.events.choice; exact(c,['id','options','targetUids','cost','stageId'], 'event choice');
      require(profile.events.includes(c.id) && s.events.seenIds.includes(c.id) && s.events.cooldownPayments === 1 &&
        c.stageId === s.stageId && JSON.stringify(c.options) === '["A","B"]' &&
        c.cost === (c.id === 'event_fog_shift' ? 4 : c.id === 'event_misprint_window' ? 6 : 0), 'event choice values');
      require(!s.events.activeModifiers.some(m=>m.eventId === c.id), 'event effect applied before confirmation');
      list(c.targetUids,200,'event targets'); require(unique(c.targetUids), 'event targets duplicated');
      c.targetUids.forEach(track); // saved quotation can become stale; confirmation must revalidate it.
    } else require(s.events.choice === null, 'event choice phase');
    list(s.reservations,2,'reservations');
    require(unique(s.reservations.map(x=>x&&x.uid)) && unique(s.reservations.map(x=>x&&x.pos)), 'reservation duplicates');
    for (const r of s.reservations) {
      exact(r,['uid','pos','epoch','source','expiresSpin'], 'reservation'); track(r.uid);
      const target = pool.get(r.uid);
      require(target && target.epoch === r.epoch && int(r.pos,0,19) && r.expiresSpin === s.spin+1 &&
        (uid(r.source) || s.items.includes(r.source)), 'reservation validity');
      if (uid(r.source)) track(r.source); // source may have left the pool.
    }
    require(s.fractionGaugeReserved === false, 'transient gauge reservation');
    exact(s.itemState,['stageId','spin','quotas','used'], 'itemState');
    require(s.itemState.stageId === s.stageId && s.itemState.spin === s.spin, 'item window');
    exact(s.itemState.quotas,s.items,'item quotas'); exact(s.itemState.used,s.items,'item used');
    for (const id of s.items) {
      exact(s.itemState.quotas[id],['spin','stage','run'],'quota');
      const q = s.itemState.quotas[id];
      require(int(q.spin,0,64) && int(q.stage,0,5000) && int(q.run,0,350000), 'quota counts');
      exact(s.itemState.used[id],['spin','stage'],'used');
      require(typeof s.itemState.used[id].spin === 'boolean' && typeof s.itemState.used[id].stage === 'boolean','used flags');
    }
    exact(s.stageState,['advanceClaims','paymentModifiers','skipCount'], 'stageState');
    list(s.stageState.advanceClaims,200,'advance claims'); require(unique(s.stageState.advanceClaims),'duplicate advance claims');
    s.stageState.advanceClaims.forEach(track);
    require(profile.symbols.includes('advance_stamp') || s.stageState.advanceClaims.length === 0,'slice advance');
    list(s.stageState.paymentModifiers,203,'payment modifiers');
    let obligation = 0; const sources = new Set();
    for (const m of s.stageState.paymentModifiers) {
      exact(m,['source','amount','cause'],'payment modifier');
      require(!sources.has(m.source),'duplicate obligation'); sources.add(m.source);
      if (m.cause === 'advance') require(s.stageState.advanceClaims.includes(track(m.source)) && m.amount === 12,'advance obligation');
      else require(m.cause === 'event' && s.events.seenIds.includes(m.source) &&
        (s.events.choice === null || s.events.choice.id !== m.source) &&
        ((m.source === 'event_boiler_test' && m.amount === 12) || (m.source === 'event_quota_recount' && m.amount === 10)), 'event obligation');
      obligation += m.amount;
    }
    require(s.stageState.advanceClaims.every(x=>sources.has(x)) && s.payment === s.basePayment+obligation &&
      int(s.stageState.skipCount,0,s.stageSpin), 'actual payment/skipCount');
    exact(s.settings,['autosave','advanceAccepted'],'settings');
    require(typeof s.settings.autosave === 'boolean' && typeof s.settings.advanceAccepted === 'boolean','settings');
    if (s.last !== null) {
      const r = s.last;
      exact(r,['spin','total','reward','board','ledger','log'], 'last');
      require(r.spin === s.spin && r.spin > 0 && int(r.total,-1e9) && int(r.reward,-1e9), 'last values');
      require(Array.isArray(r.board) && r.board.length === 20,'board');
      const board = new Map();
      for (let pos=0; pos<20; pos++) {
        const c = r.board[pos]; if (c === null) continue;
        exact(c,['uid','type','epoch','alive'],'cell'); track(c.uid);
        require(!board.has(c.uid) && profile.symbols.includes(c.type) && int(c.epoch,0,Number.MAX_SAFE_INTEGER) &&
          typeof c.alive === 'boolean','board cell'); board.set(c.uid,c);
      }
      list(r.ledger,20,'ledger'); const seen = new Set(); let sum = r.reward;
      for (const x of r.ledger) {
        exact(x,Object.hasOwn(x,'contributions')?['uid','type','amount','alive','ratio','contributions']:['uid','type','amount','alive','ratio'],'ledger entry');
        const c = board.get(x.uid);
        require(c && !seen.has(x.uid) && c.type === x.type && c.alive === x.alive && int(x.amount,-1e9) &&
          (x.alive || x.amount === 0) && Array.isArray(x.ratio) && x.ratio.length === 2 &&
          x.ratio.every(n=>typeof n === 'string' && /^[1-9]\d{0,255}$/.test(n)), 'ledger facts');
        if (Object.hasOwn(x,'contributions')) {
          list(x.contributions,5000,'contributions'); const contributors=new Set();let contributed=0;
          for (const part of x.contributions) {
            exact(part,['source','amount'],'contribution');
            require((uid(part.source)||s.items.includes(part.source)||s.profile==='full-v1'&&s.events.seenIds.includes(part.source)) && !contributors.has(part.source) && int(part.amount,-1e9),'contribution facts');
            if (uid(part.source)) track(part.source);contributors.add(part.source);contributed+=part.amount;
          }
          require(contributed===x.amount,'contribution conservation');
        }
        seen.add(x.uid); sum += x.amount;
      }
      require(seen.size === board.size && sum === r.total,'ledger conservation');
      list(r.log,5000,'log');
      const actions = ['age','transform','consume','destroy','grow','tagAdded','add','multiply','reward','pressureIncrease','release','spawn','copy','risk','reserve','limitSkipped'];
      for (let i=0; i<r.log.length; i++) {
        const e = r.log[i];
        const baseLog=['id','parent','depth','phase','action','source','target','amount'];
        const extendedLog=['id','parent','depth','phase','action','source','target','amount','facts'];
        require(object(e) && (Object.keys(e).sort().join('|')===baseLog.slice().sort().join('|') || Object.keys(e).sort().join('|')===extendedLog.slice().sort().join('|')), 'causal log fields');
        require(e.id === i && int(e.depth,0,32) && F.PHASES.includes(e.phase) && (actions.includes(e.action) || s.profile==='full-v1' && e.action==='cycle') &&
          nullable(e.amount,x=>int(x,-1e9)) && nullable(e.source,x=>uid(x)||s.items.includes(x)||s.profile==='full-v1'&&s.events.seenIds.includes(x)) && nullable(e.target,uid),'log facts');
        if (Object.hasOwn(e,'facts')) {
          exact(e.facts,['effectKey','sourcePos','targetPos','beforeType','afterType','beforeTags','afterTags','cause','actualIncrease','createdUid','skipReason'],'causal facts');
          require(typeof e.facts.effectKey==='string' && nullable(e.facts.sourcePos,x=>int(x,0,19)) && nullable(e.facts.targetPos,x=>int(x,0,19)) &&
            nullable(e.facts.beforeType,x=>profile.symbols.includes(x)) && nullable(e.facts.afterType,x=>profile.symbols.includes(x)) &&
            Array.isArray(e.facts.beforeTags) && Array.isArray(e.facts.afterTags) && typeof e.facts.cause==='string' && int(e.facts.actualIncrease,-1e9) &&
            nullable(e.facts.createdUid,uid) && nullable(e.facts.skipReason,x=>typeof x==='string') &&
            e.facts.beforeTags.every(x=>typeof x==='string') && e.facts.afterTags.every(x=>typeof x==='string') &&
            unique(e.facts.beforeTags) && unique(e.facts.afterTags),'causal facts values');
          if(e.facts.createdUid!==null)track(e.facts.createdUid);
        }
        if (e.source !== null && uid(e.source)) track(e.source);
        if (e.target !== null) track(e.target);
        if (e.parent === null) require(e.depth === 0,'root depth');
        else require(int(e.parent,0,i-1) && r.log[e.parent].depth+1 === e.depth,'future/cyclic parent/depth');
      }
    }
    require(s.phase === 'SYMBOL_CHOICE' ? int(s.pendingSettlement,-1e9) && s.last !== null && s.pendingSettlement === s.last.total :
      s.pendingSettlement === null, 'pending settlement');
    require(s.spin === 0 ? s.last === null : s.last !== null, 'missing last');
    return true;
  };
  // Revision + clone + validation. No F2 commands are dispatched here.
  F.transact = function (state, revision, operation) {
    try {
      F.validateState(state);
      require(revision === state.revision && typeof operation === 'function' && state.revision < Number.MAX_SAFE_INTEGER, 'stale/invalid command');
      const next = F.clone(state);
      const returned = operation(next);
      require(returned === undefined, 'operation must be synchronous and return undefined');
      require(['schema','rules','content','saveKey','rngAlgorithm','profile','difficulty','seed'].every(k=>next[k] === state[k]), 'operation changed run identity');
      require(next.revision === state.revision, 'operation changed revision');
      next.revision++;
      F.validateState(next);
      return {ok:true, state:F.clone(next)}; // callback cannot retain an alias to the committed candidate
    } catch (error) { return {ok:false,state,error:error.message}; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
