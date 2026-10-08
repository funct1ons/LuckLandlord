(function (G) {
  'use strict';
  G.adjacent = (a, b) => a !== b && Math.abs(a % 5 - b % 5) <= 1 &&
    Math.abs((a / 5 | 0) - (b / 5 | 0)) <= 1;
  G.targetScopes = {
    self: (a, b) => a === b,
    adj: (a, b) => G.adjacent(a, b),
    row: (a, b) => (a / 5 | 0) === (b / 5 | 0),
    column: (a, b) => a % 5 === b % 5,
    board: () => true,
    pool: () => true
  };
  G.instance = function (s, type) {
    if (!G.symbols[type] || s.symbols.length >= 200) throw Error('实例上限或未知符号');
    return {uid: 'u' + s.nextId++, type, permanent: 0, counters: {}};
  };
  G.resolve = function (s, fixed) {
    G.itemHook(s, 'spinStart');
    const drawTrace=[];
    let ids = fixed;
    if (s.reservations) {
      const valid = new Set(s.symbols.map(x => x.uid));
      s.reservations = s.reservations.filter(r => valid.has(r.uid) &&
        Number.isInteger(r.pos) && r.pos >= 0 && r.pos < 20);
    }
    if (!fixed) ids = G.drawBoard(s,drawTrace);
    const weightedDraw = !fixed && s.items.some(id => (G.items[id].effects || []).some(e => e.hook === 'draw'));
    if (!fixed && !weightedDraw && s.reservations && s.reservations.length) {
      const locked = new Map(s.reservations.map(r => [r.pos, r.uid]));
      const used = new Set(locked.values());
      const rest = ids.filter(uid => !used.has(uid));
      ids = Array.from({length: 20}, (_, pos) => locked.has(pos) ? locked.get(pos) : rest.shift() || null);
    }
    if (ids.length > 20 || new Set(ids.filter(Boolean)).size !== ids.filter(Boolean).length)
      throw Error('非法盘面');
    const board = Array.from({length: 20}, (_, pos) => {
      const obj = s.symbols.find(x => x.uid === ids[pos]);
      if (ids[pos] && !obj) throw Error('未知实例');
      return obj ? {
        obj, pos, alive: true, base: G.symbols[obj.type].baseValue,
        add: 0, mulNum: 1n, mulDen: 1n, tags: [...G.symbols[obj.type].tags],
        epoch: 0, visitedTypes: new Set([obj.type])
      } : null;
    });
    // Snapshot plain numeric templates before any tag/transform/structural mutation.
    // This never retains executable effects and therefore cannot recursively copy.
    const copySnapshots = new Map(board.filter(Boolean).map(c => {
      const templates = G.symbols[c.obj.type].effects.filter(x =>
        x.trigger === 'ON_APPEAR' && x.action === 'add' && x.scope === 'self' &&
        x.target === 'self' && !x.selector && !x.when && !x.emit && !x.limit &&
        (Number.isSafeInteger(x.amount) || (x.amount && Number.isSafeInteger(x.amount.constant))))
        .map(x => Object.freeze({amount: typeof x.amount === 'number' ? x.amount : x.amount.constant,
          copyable: x.copyable}));
      return [c.obj.uid, Object.freeze(templates)];
    }));
    const appearance = board.filter(Boolean).map(c => ({c, tags:[...c.tags],
      age:G.symbols[c.obj.type].effects.find(e => e.action === 'age')}));
    const log = drawTrace.map((x,id)=>Object.assign({id,parent:null,type:'itemDraw',depth:0},x)), queue = [], counts = {};
    const multiplierSources = new Map(), multiplierPairs = new Set();
    const spawnSources = new Set(), spawnDefinitions = new Map();
    const pressureChecks = new Map(), deferredReleases = [];
    let activeQueue = null;
    function skipLimit(t, component, reason, limit) {
      const q = activeQueue;
      log.push({id: log.length, parent: activeParent, type: 'limitSkipped',
        source: q.c.obj.uid, target: component === 'multiplier' && q.x.action === 'globalMultiply' ? '$board' : t.obj.uid, depth: q.depth, event: q.event,
        effectKey: q.effectKey, component, reason, limit});
    }
    function tryApplyMultiplier(t, ratio, global = false) {
      const q = activeQueue;
      if (q.profile === 'matrix-v1') {
        const target = global ? '$board' : t.obj.uid;
        const key = q.effectKey + '/multiplier/' + target;
        const pair = key + '/' + q.c.obj.uid;
        const sources = multiplierSources.get(key) || new Set();
        if (multiplierPairs.has(pair)) {
          skipLimit(t, 'multiplier', 'source-target-once', 1);
          return false;
        }
        if (sources.size >= 2) {
          skipLimit(t, 'multiplier', 'definition-target-sources', 2);
          return false;
        }
        multiplierPairs.add(pair);
        sources.add(q.c.obj.uid);
        multiplierSources.set(key, sources);
      }
      if (global) {
        globalNum *= BigInt(ratio[0]);
        globalDen *= BigInt(ratio[1]);
      } else {
        t.mulNum *= BigInt(ratio[0]);
        t.mulDen *= BigInt(ratio[1]);
      }
      return true;
    }
    const limits = {effects: 5000, depth: 32, spawns: 40}, cash = s.cash, paymentSnapshot = s.payment;
    let processed = 0, reward = 0, spawned = 0, seq = 0, activeParent = null;
    let globalNum = 1n, globalDen = 1n, conversionCount = 0, plantConversionCount = 0;
    const consumedScrapTypes = new Set(), riskGuards = new Set();
    function clearReservation(uid) {
      if (s.reservations) s.reservations = s.reservations.filter(r => r.uid !== uid);
    }
    function matrix(c, x) { return !!(G.symbols[c.obj.type].formal || x.policy === 'matrix-v1'); }
    function payloadFor(c, t, extra) {
      return Object.freeze(Object.assign({source: c.obj.uid, sourceType: c.obj.type,
        sourcePos: c.pos, sourceTags: Object.freeze([...c.tags]), target: t.obj.uid,
        targetType: t.obj.type, targetPos: t.pos, targetTags: Object.freeze([...t.tags]),
        kind: 'lifecycle'}, extra));
    }
    function trySpawn(c, t, type) {
      const q = activeQueue, soft = q.profile === 'matrix-v1';
      const key = q.effectKey + '/spawn';
      if (soft && spawnSources.has(c.obj.uid)) {
        skipLimit(t, 'spawn', 'source-spawn', 1); return false;
      }
      if (soft && (spawnDefinitions.get(key) || 0) >= 2) {
        skipLimit(t, 'spawn', 'definition-spawns', 2); return false;
      }
      const dead = new Set(board.filter(z => z && !z.alive).map(z => z.obj.uid));
      if (soft && s.symbols.filter(z => !dead.has(z.uid)).length >= 200) {
        skipLimit(t, 'spawn', 'pool-full', 200); return false;
      }
      if (spawned >= limits.spawns) throw Error('生成超限');
      if (!G.symbols[type]) throw Error('未知符号');
      if (soft) s.symbols = s.symbols.filter(z => !dead.has(z.uid));
      const obj = G.instance(s, type);
      s.symbols.push(obj); spawned++;
      if (soft) { spawnSources.add(c.obj.uid); spawnDefinitions.set(key, (spawnDefinitions.get(key) || 0) + 1); }
      return true;
    }
    function itemEvent(hook, c, t, p = {}) {
      const outerQueue = activeQueue, outerParent = activeParent;
      const typeCounts = {};
      for (const tag of G.tags) typeCounts[tag] = new Set(board.filter(z => z && z.alive && z.tags.includes(tag)).map(z => z.obj.type)).size;
      G.itemHook(s, hook, Object.assign({typeCounts}, p), (id, e, key, fire) => {
        const entry = {id:log.length, parent:outerParent, type:'itemEffect', itemId:id,
          effectKey:key, hook, action:e.action, source:c ? c.obj.uid : null,
          target:t ? t.obj.uid : null, depth:outerQueue ? outerQueue.depth : 0,
          amount:fire ? e.amount || 0 : 0, createdUid:null, reason:fire ? null : 'threshold-progress'};
        log.push(entry); activeParent=entry.id;
        const pseudo={obj:{uid:id}};
        activeQueue={c:pseudo, x:e, profile:'matrix-v1',effectKey:key,
          depth:entry.depth,event:hook==='consume'?'ON_CONSUME':'ON_APPEAR'};
        if (fire) {
          if (e.action==='add') { if(!t || !t.alive){log.pop();return false;} t.add+=e.amount; }
          else if(e.action==='reward')reward+=e.amount;
          else if(e.action==='removeToken')s.removeTokens+=e.amount;
          else if(e.action==='spawn'){
            const next=s.nextId,ok=trySpawn(pseudo,t,e.to);
            entry.createdUid=ok?'u'+next:null;entry.reason=ok?null:'pool-full';
          } else if(e.action==='age'){
            if(t.epoch!==0){entry.amount=0;entry.reason='already-transformed';}
            else handlers.age(t,t,Object.assign({},p.age,{steps:e.amount}),entry.depth);
          }
        }
        activeQueue=outerQueue;activeParent=outerParent;
      });
      activeQueue=outerQueue;activeParent=outerParent;
    }
    function boardChanged() { itemEvent('boardChange', null, null); }
    const tagMatch = (t, x) => {
      const q = x.tags || x.tag;
      return !q || q === '*' || (Array.isArray(q) ? q.every(z => t.tags.includes(z)) : t.tags.includes(q));
    };
    function targets(c, x) {
      const spec = x.selector || x.target || (x.area ? x : 'self');
      let area, tagsAny, tagsAll, excludeSelf, count = 'all';
      if (typeof spec === 'string') {
        const p = spec.split(':');
        area = p[0];
        if (p[1] && p[1] !== '*') tagsAny = [p[1]];
      } else {
        area = spec.area || 'self';
        tagsAny = spec.tagsAny;
        tagsAll = spec.tagsAll;
        excludeSelf = spec.excludeSelf;
        count = spec.count || 'all';
      }
      let arr = area === 'pool' ? s.symbols.map(o => ({
        obj: o, pos: -1, alive: true, tags: [...G.symbols[o.type].tags]
      })) : board.filter(Boolean);
      arr = arr.filter(t => (area === 'pool' || t.alive || area === 'self') &&
        G.targetScopes[area](c.pos, t.pos) && (!excludeSelf || t.obj.uid !== c.obj.uid) &&
        tagMatch(t, {tags: tagsAny}) && (!tagsAll || tagsAll.every(z => t.tags.includes(z))) &&
        !(spec.excludeTags || []).some(z => t.tags.includes(z)) &&
        (!spec.temporaryTagAdded || log.some(z => z.type === 'tagAdded' && z.target === t.obj.uid)));
      if (x.action === 'releasePressure') {
        arr = arr.filter(t => (t.obj.counters.pressure || 0) >= (x.amount || 3) &&
          !G.symbols[t.obj.type].effects.some(e => e.action === 'counter' && e.name === 'pressure' &&
            e.at !== undefined && (t.obj.counters.pressure || 0) >= e.at));
      }
      if (x.action === 'copy' && x.copyMode === 'explicit') {
        arr = arr.filter(t => (copySnapshots.get(t.obj.uid) || []).some(z => z.copyable === true));
      }
      arr.sort((a, b) => a.pos - b.pos || String(a.obj.uid).localeCompare(String(b.obj.uid)));
      return count === '1' || x.action === 'releasePressure' ? arr.slice(0, 1) : arr;
    }
    function val(v, c, payload) {
      if (typeof v === 'number') return v;
      if (v && v.constant !== undefined) return v.constant;
      if (v && v.counter) return c.obj.counters[v.counter] || 0;
      if (v && v.eventValue) return payload ? payload[v.eventValue] || 0 : 0;
      if (v && v.count) {
        const q = v.count;
        const arr = board.filter(z => z && z.alive && G.targetScopes[q.area || 'board'](c.pos, z.pos) &&
          (!q.excludeSelf || z.obj.uid !== c.obj.uid) && q.tags.every(t => z.tags.includes(t)));
        const n = q.uniqueTypes ? new Set(arr.map(z => z.obj.type)).size : arr.length;
        return Math.min(q.max ?? n, n);
      }
      if (v && v.add) return v.add.reduce((n, z) => n + val(z, c, payload), 0);
      if (v && v.mul) return v.mul.reduce((n, z) => n * val(z, c, payload), 1);
      if (v && v.min) return Math.min(...v.min.map(z => val(z, c, payload)));
      if (v && v.max) return Math.max(...v.max.map(z => val(z, c, payload)));
      return 0;
    }
    function predicate(w, c, payload) {
      if (!w) return true;
      if (w.all) return w.all.every(q => predicate(q, c, payload));
      if (w.any) return w.any.some(q => predicate(q, c, payload));
      if (w.not) return !predicate(w.not, c, payload);
      if (w.eventTargetTags !== undefined)
        return payload && w.eventTargetTags.every(tag => (payload.targetTags || []).includes(tag));
      if (w.eventTargetNeighbor !== undefined) {
        return !!(payload && G.adjacent(c.pos, payload.targetPos));
      }
      if (w.eventTargetType !== undefined)
        return payload && (payload.toType === w.eventTargetType || payload.targetType === w.eventTargetType);
      if (w.eventSourceSelf !== undefined) return !!(w.eventSourceSelf && payload && payload.source === c.obj.uid);
      if (w.eventTargetSelf !== undefined) return !!(w.eventTargetSelf && payload && payload.target === c.obj.uid);
      if (w.eventCause !== undefined) return payload && payload.cause === w.eventCause;
      if (w.cashSnapshot !== undefined) return cash < w.cashSnapshot;
      if (w.lowCash !== undefined) return cash < paymentSnapshot;
      if (w.cashBelowPaymentRatio) return BigInt(cash)*BigInt(w.cashBelowPaymentRatio[1]) < BigInt(paymentSnapshot)*BigInt(w.cashBelowPaymentRatio[0]);
      if (w.paymentShortfall) { const gap=paymentSnapshot-cash; return gap>=w.paymentShortfall.min && gap<=w.paymentShortfall.max; }
      if (w.poolTagCount) { const dead=new Set(board.filter(z=>z&&!z.alive).map(z=>z.obj.uid)); return s.symbols.filter(z=>!dead.has(z.uid)&&G.symbols[z.type].tags.includes(w.poolTagCount.tag)).length===w.poolTagCount.exact; }
      if (w.liveTypeCount) { const q=w.liveTypeCount; return new Set(board.filter(z=>z&&z.alive&&G.targetScopes[q.area](c.pos,z.pos)&&q.tags.every(t=>z.tags.includes(t))).map(z=>z.obj.type)).size>=q.at; }
      if (w.stageSpinsRemaining !== undefined) return s.spinsRemaining <= w.stageSpinsRemaining;
      if (w.counter) return (c.obj.counters[w.counter.name] || 0) >= (w.counter.at || 0);
      if (w.neighbor) return targets(c, {area: 'adj', tagsAny: w.neighbor.tags, count: '1'}).length > 0;
      if (w.neighborUniqueTypeCount !== undefined) {
        const q = w.neighborUniqueTypeCount;
        const n = val({count: {area: 'adj', tags: [], excludeSelf: true, uniqueTypes: true}}, c);
        return n >= q.at;
      }
      if (w.uniqueTypeCount !== undefined) {
        const tags = w.uniqueTypeCount.tags || [];
        if (tags.includes('scrap')) return consumedScrapTypes.size >= (w.uniqueTypeCount.at || 0);
        const arr = board.filter(Boolean).filter(z => tags.every(t => z.tags.includes(t)));
        return new Set(arr.map(z => z.obj.type)).size >= (w.uniqueTypeCount.at || 0);
      }
      if (w.poolSize !== undefined) return 20 - board.filter(Boolean).length >= (w.poolSize || 0);
      if (w.eventSourceNeighborTag !== undefined) {
        return !!(payload && payload.sourceTags && payload.sourceTags.includes(w.eventSourceNeighborTag) &&
          payload.source && G.adjacent(c.pos, payload.sourcePos));
      }
      if (w.event !== undefined) return !!payload;
      if (w.rowUniqueTypeCount !== undefined) {
        const q = w.rowUniqueTypeCount;
        const arr = board.filter(z => z && (z.pos / 5 | 0) === (c.pos / 5 | 0) &&
          (!q.excludeSelf || z.obj.uid !== c.obj.uid) && q.tags.every(t => z.tags.includes(t)));
        const n = new Set(arr.map(z => z.obj.type)).size;
        return q.exact !== undefined ? n === q.exact : n >= (q.at || 0);
      }
      if (w.convertCount !== undefined) return conversionCount >= w.convertCount;
      if (w.plantConvertCount !== undefined) return plantConversionCount >= w.plantConvertCount;
      if (w.count) return targets(c, {area: w.count.area || 'board', tagsAny: w.count.tags, count: 'all'}).length >= (w.count.at || 0);
      return true;
    }
    function emit(name, c, depth, payload) {
      if (name) collect(name, c.obj.uid, depth + 1, payload);
    }
    function eventMatches(x, payload) {
      const f = x.eventFilter;
      if (!f) return true;
      if (!payload) return false;
      if (f.cause !== undefined && payload.cause !== f.cause) return false;
      if (f.kind !== undefined && payload.kind !== f.kind) return false;
      if (f.sourceTags && (!payload.sourceTags || !f.sourceTags.every(t => payload.sourceTags.includes(t)))) return false;
      if (f.targetTags && (!payload.targetTags || !f.targetTags.every(t => payload.targetTags.includes(t)))) return false;
      return true;
    }
    function collect(event, subject, depth, payload, tagPass = false) {
      if (depth > limits.depth) throw Error('触发深度超限');
      for (const c of board.filter(Boolean)) {
        G.symbols[c.obj.type].effects.forEach((x, index) => {
          const isTagPass = event === 'ON_APPEAR' && x.action === 'tag';
          if (isTagPass !== tagPass) return;
          if (event === 'ON_APPEAR' && x.action === 'age' && G.symbols[c.obj.type].formal) return;
          if (x.trigger === event && eventMatches(x, payload) &&
              (['ON_SPIN', 'ON_END_SPIN'].includes(event) || x.scope === 'event' || c.obj.uid === subject) &&
              (c.alive || (matrix(c, x) ? x.allowDeadSource === true : x.scope === 'event' || event === 'ON_DESTROY'))) {
            const definition = G.symbols[c.obj.type];
            queue.push({c, x, index, event, depth, sourceType: c.obj.type,
              sourceEpoch: c.epoch, effectKey: definition.id + '/' + (x.effectId ?? index),
              profile: definition.formal || x.policy === 'matrix-v1' ? 'matrix-v1' : 'legacy',
              parent: activeParent, seq: seq++, payload});
          }
        });
      }
      queue.sort((a, b) => a.x.priority - b.x.priority || a.c.pos - b.c.pos || a.index - b.index || a.seq - b.seq);
    }
    const handlers = {
      add: (c, t, x, d, payload) => { t.add += val(x.amount, c, payload); },
      cycle: (c, t, x) => {
        const n = (t.obj.counters[x.name] || 0) + 1;
        t.obj.counters[x.name] = n;
        if (n >= (x.threshold || 1)) {
          t.add += x.amount || 0;
          t.obj.counters[x.name] = x.reset || 0;
        }
      },
      reward: (c, t, x) => { reward += x.reward ?? x.amount ?? 0; },
      grow: (c, t, x, depth, payload) => {
        const beforePermanent = t.obj.permanent, requestedIncrease = val(x.amount, c, payload);
        const afterPermanent = Math.max(beforePermanent, Math.min(30, beforePermanent + requestedIncrease));
        const actualIncrease = afterPermanent - beforePermanent;
        t.obj.permanent = afterPermanent;
        log[activeParent].actualIncrease = actualIncrease;
        if (actualIncrease > 0) {
          emit('ON_GROW', t, depth, payloadFor(c, t, {
            cause: 'grow', kind: 'growth',
            beforePermanent, afterPermanent, requestedIncrease, actualIncrease
          }));
        }
      },
      multiply: (c, t, x) => tryApplyMultiplier(t, x.ratio),
      globalMultiply: (c, t, x) => tryApplyMultiplier(t, x.ratio, true),
      tag: (c, t, x, depth) => {
        let chosen = x.tags || (x.tag ? [x.tag] : []);
        if (x.chooseTags) {
          const available = x.chooseTags.map(tag => [tag, targets(c, {area: 'adj', tagsAny: [tag]}).length]);
          if (x.choiceMode !== 'firstPresent') {
            available.sort((a, b) => b[1] - a[1] || x.chooseTags.indexOf(a[0]) - x.chooseTags.indexOf(b[0]));
          }
          const first = available.find(z => z[1] > 0);
          chosen = first ? [first[0]] : [];
        }
        const added = chosen.filter(tag => !t.tags.includes(tag));
        t.tags.push(...added);
        if (added.length) {
          log.push({id: log.length, parent: activeParent, type: 'tagAdded', source: c.obj.uid,
            target: t.obj.uid, depth, event: 'ON_APPEAR', amount: null, payload: null, tags: added});
        }
        if (x.ratio) handlers.multiply(c, t, x);
        if (added.length) boardChanged();
      },
      reserve: (c, t, x) => {
        s.reservations = s.reservations || [];
        if (s.reservations.length >= 2) return;
        let target = t;
        if (s.reservations.some(r => r.uid === target.obj.uid))
          target = targets(c, x).find(z => !s.reservations.some(r => r.uid === z.obj.uid));
        if (target && !s.reservations.some(r => r.uid === target.obj.uid))
          s.reservations.push({uid: target.obj.uid, pos: target.pos, source: c.obj.uid});
      },
      consume: (c, t, x, d) => {
        if (!t.alive) return false;
        if (t.tags.includes('scrap')) consumedScrapTypes.add(t.obj.type);
        clearReservation(t.obj.uid);
        t.alive = false;
        reward += x.rewardBaseTarget ? (x.amount || 0) + G.symbols[t.obj.type].baseValue : val(x.reward ?? x.amount ?? 0, c);
        const p = payloadFor(c, t, {cause: 'consume'});
        itemEvent('consume', c, t, {tags:p.targetTags});
        boardChanged();
        emit('ON_CONSUME', t, d, p);
        emit('ON_DESTROY', t, d, p);
      },
      destroy: (c, t, x, d) => {
        if (!t.alive) return false;
        clearReservation(t.obj.uid);
        t.alive = false;
        itemEvent('destroy', c, t, {tags:[...t.tags]});
        boardChanged();
        emit('ON_DESTROY', t, d, payloadFor(c, t, {cause: x.cause || 'destroy'}));
      },
      transform: (c, t, x, d) => {
        if (t.obj.type === x.to) return false;
        if (t.visitedTypes.has(x.to)) { skipLimit(t, 'transform', 'transform-cycle', 1); return false; }
        const before = t.obj.type, beforeTags = [...t.tags];
        const p = payloadFor(c, t, {cause: 'transform', fromType: before, toType: x.to});
        clearReservation(t.obj.uid);
        t.obj.type = x.to;
        t.epoch++; t.visitedTypes.add(x.to);
        t.obj.counters = {};
        t.base = G.symbols[x.to].baseValue;
        t.tags = [...G.symbols[x.to].tags];
        conversionCount++;
        if (beforeTags.includes('plant')) plantConversionCount++;
        itemEvent('transform', c, t, {tags:beforeTags, toTags:[...t.tags]});
        boardChanged();
        emit('ON_TRANSFORM', t, d, p);
      },
      age: (c, t, x, d) => {
        t.obj.counters.age = (t.obj.counters.age || 0) + (x.steps || 1);
        if (t.obj.counters.age >= (x.threshold || 1)) handlers.transform(c, t, x, d);
      },
      spawn: (c, t, x) => trySpawn(c, t, x.to),
      stageAdvance: (c,t,x) => {
        const effectKey=activeQueue.effectKey;
        if (!s.settings[x.setting] || s.stageState.claims.some(z=>z.source===c.obj.uid&&z.effectKey===effectKey)) return false;
        const payment=s.payment+x.paymentIncrease;
        if (!Number.isSafeInteger(payment) || payment>1e9) throw Error('Stage payment overflow');
        s.stageState.claims.push({source:c.obj.uid,effectKey});
        s.stageState.paymentModifiers.push({source:c.obj.uid,effectKey,amount:x.paymentIncrease});
        reward+=x.reward; s.payment=payment;
        const entry=log[activeParent],next=s.nextId;
        const created=trySpawn(c,t,x.to);
        entry.stageContract={reward:x.reward,paymentIncrease:x.paymentIncrease,paymentBefore:payment-x.paymentIncrease,paymentAfter:payment,createdUid:created?'u'+next:null};
      },
      counter: (c, t, x, d) => {
        const k = x.name || x.counter, current = t.obj.counters[k] || 0;
        if (k === 'age' && matrix(c, x)) {
          if (t.epoch !== 0) return false;
          const effect = G.symbols[t.obj.type].effects.find(e => e.action === 'age');
          if (!effect) {
            if (c.obj.uid !== t.obj.uid) return false;
            t.obj.counters.age = current + (x.delta ?? 1); return;
          }
          return handlers.age(c, t, Object.assign({}, effect, {steps: x.delta ?? 1}), d);
        }
        if (k === 'pressure' && matrix(c, x)) {
          if (!x.release) t.obj.counters[k] = Math.min(x.max ?? 1e9, current + (x.delta ?? 1));
          if (x.at !== undefined) pressureChecks.set(t.obj.uid, {c, t, x, q: activeQueue, parent: activeParent});
          return;
        }
        if (k === 'pressure' && t.releasedThisSpin) return;
        if (x.release) {
          if (current < (x.at ?? 0)) return;
          t.obj.counters[k] = x.reset ?? 0;
          if (x.reward) reward += val(x.reward, c);
          return;
        }
        t.obj.counters[k] = Math.min(x.max ?? 999, current + (x.delta ?? 1));
        if (x.at !== undefined && t.obj.counters[k] >= x.at) {
          t.obj.counters[k] = x.reset ?? 0;
          t.suppressed = false;
          if (x.reward) reward += val(x.reward, c);
        }
      },
      risk: (c, t, x) => {
        const ok = G.random(s) < x.chance;
        if (ok) t.add += x.amount;
        else {
          let loss = x.loss;
          const guards = c.tags.includes('pressure') ? board.filter(z => z && z.alive &&
            z.obj.uid !== c.obj.uid && G.symbols[z.obj.type].effects.some(e => e.action === 'riskGuard') &&
            G.adjacent(c.pos, z.pos) && !riskGuards.has(z.obj.uid)) : [];
          if (guards.length) {
            guards.sort((a, b) => a.pos - b.pos || String(a.obj.uid).localeCompare(String(b.obj.uid)));
            riskGuards.add(guards[0].obj.uid);
            loss = Math.min(0, loss + (x.guardReduction || 4));
          }
          t.add += loss;
          if (x.spawnOnFail) {
            trySpawn(c, t, x.spawnOnFail);
          }
        }
      },
      riskGuard: () => {},
      releasePressure: (c, t, x) => {
        const n = t.obj.counters.pressure || 0;
        if (n < (x.amount || 3)) return false;
        if (!tryApplyMultiplier(t, x.ratio)) return false;
        t.obj.counters.pressure = Math.max(0, n - (x.amount || 3));
        t.releasedThisSpin = true;
      },
      suppress: (c, t) => { t.suppressed = true; },
      condition: (c, t, x) => { if (cash < (x.threshold ?? 0)) t.add += x.amount; },
      copy: (c, t, x) => {
        const templates = (copySnapshots.get(t.obj.uid) || []).filter(z =>
          x.copyMode === 'explicit' ? z.copyable === true : z.copyable !== false);
        const amount = Math.min(x.maxAdd ?? 8, templates.reduce((n, z) => n + z.amount, 0));
        c.add += amount;
        log[activeParent].amount = amount;
      }
    };
    function drain() {
      while (queue.length) {
        const q = queue.shift(), {c, x, depth} = q;
        activeQueue = q;
        if ((!c.alive && (q.profile === 'matrix-v1' ? !x.allowDeadSource : x.scope !== 'event' && q.event !== 'ON_DESTROY')) ||
            c.obj.type !== q.sourceType || c.epoch !== q.sourceEpoch || !predicate(x.when, c, q.payload)) continue;
        if (q.profile === 'matrix-v1' && x.action === 'releasePressure' && !q.releasePass) {
          deferredReleases.push(q); continue;
        }
        const key = c.obj.uid + ':' + q.effectKey;
        if (++processed > limits.effects) throw Error('效果预算超限');
        if ((counts[key] || 0) >= (x.limit?.perSpin || 64)) continue;
        const ts = targets(c, x);
        if (!ts.length && q.profile === 'matrix-v1' && ['releasePressure','spawn','transform'].includes(x.action)) {
          activeParent = q.parent; skipLimit(c, x.action === 'releasePressure' ? 'multiplier' : x.action, 'no-legal-target', 0);
        }
        if (!ts.length && x.action === 'consume' && x.fallbackReward !== undefined) {
          const amount = val(x.fallbackReward, c);
          reward += amount;
          log.push({id: log.length, parent: q.parent, type: 'reward', source: c.obj.uid,
            target: c.obj.uid, depth, event: q.event, amount, payload: q.payload || null});
          continue;
        }
        let success = false;
        for (const t of ts) {
          if (!t.alive && q.event !== 'ON_DESTROY' && x.scope !== 'event') continue;
          activeParent = log.length;
          const entry = {id: activeParent, parent: q.parent, type: x.action, source: c.obj.uid,
            target: t.obj.uid, depth, event: q.event, amount: x.amount ?? null, payload: q.payload || null};
          log.push(entry);
          if (!handlers[x.action]) throw Error('未知动作 ' + x.action);
          if (handlers[x.action](c, t, x, depth, q.payload) === false) {
            if (log.length === entry.id + 1) log.pop();
          }
          // grow already emits its single actual-increase event, including legacy explicit emit.
          else {
            success = true;
            if (!(x.action === 'grow' && x.emit === 'ON_GROW')) emit(x.emit, c, depth, q.payload);
          }
        }
        if (success) counts[key] = (counts[key] || 0) + 1;
      }
    }
    for (const {c,tags} of appearance) itemEvent('appear', c, c, {tags});
    activeParent=null; boardChanged();
    // Temporary tag actions are a pre-processing pass, before all initial additions/counts.
    for (const c of board.filter(Boolean)) collect('ON_APPEAR', c.obj.uid, 0, undefined, true);
    drain();
    activeParent = null;
    // Formal natural aging precedes all extra-age effects; newly transformed definitions do not appear.
    for (const c of board.filter(Boolean)) {
      const def = G.symbols[c.obj.type];
      if (!def.formal) continue;
      def.effects.forEach((x, index) => {
        if (x.trigger === 'ON_APPEAR' && x.action === 'age') queue.push({c, x, index,
          event: 'ON_APPEAR', depth: 0, sourceType: def.id, sourceEpoch: c.epoch,
          effectKey: def.id + '/' + (x.effectId ?? index), profile: 'matrix-v1', parent: null, seq: seq++});
      });
    }
    const naturallyAged = new Set(queue.map(q => q.c.obj.uid));
    drain();
    activeParent=null;
    for (const {c,tags,age} of appearance) {
      itemEvent('extraAge', c, c, {tags,hasAge:!!age,age});
      if (c.epoch !== 0) naturallyAged.add(c.obj.uid);
    }
    drain();
    collect('ON_SPIN', null, 0);
    for (const c of board.filter(Boolean)) collect('ON_APPEAR', c.obj.uid, 0);
    for (const c of board.filter(Boolean)) collect('ON_ADJACENT', c.obj.uid, 0);
    for (let i = queue.length - 1; i >= 0; i--) {
      const q = queue[i];
      if (naturallyAged.has(q.c.obj.uid) && q.event === 'ON_APPEAR') queue.splice(i, 1);
    }
    drain();
    activeParent = null;
    collect('ON_END_SPIN', null, 0);
    drain();
    queue.push(...deferredReleases.map(q => Object.assign({}, q, {releasePass: true})));
    queue.sort((a, b) => a.x.priority - b.x.priority || a.c.pos - b.c.pos || a.index - b.index || a.seq - b.seq);
    drain();
    for (const {c, t, x, q, parent} of pressureChecks.values()) {
      if (!t.alive || t.releasedThisSpin || (t.obj.counters.pressure || 0) < x.at) continue;
      activeQueue = q; activeParent = parent;
      t.obj.counters.pressure = x.reset ?? 0;
      if (x.reward) reward += val(x.reward, c);
    }
    const ledger = board.filter(Boolean).map(c => {
      const value = c.base + c.obj.permanent + c.add;
      const n = BigInt(value) * c.mulNum * globalNum, d = c.mulDen * globalDen;
      const rounded = n >= 0n ? n / d : -((-n + d - 1n) / d);
      const amount = c.alive && !c.suppressed ? Number(rounded) : 0;
      return {uid: c.obj.uid, type: c.obj.type, amount, alive: c.alive,
        multiplier: Number(c.mulNum * globalNum) / Number(c.mulDen * globalDen),
        ratio: [(c.mulNum * globalNum).toString(), (c.mulDen * globalDen).toString()]};
    });
    const total = ledger.reduce((n, x) => n + x.amount, 0) + reward;
    if (!Number.isSafeInteger(total)) throw Error('金额超限');
    s.symbols = s.symbols.filter(x => !board.some(c => c && c.obj.uid === x.uid && !c.alive));
    return {resolvedRules: G.RULES, board: board.map(c => c ? {uid: c.obj.uid, type: c.obj.type, alive: c.alive} : null),
      ledger, reward, total, log, effects: processed};
  };
})(window.Game);
