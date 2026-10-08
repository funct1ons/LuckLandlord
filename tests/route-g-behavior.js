(function (G) {
  'use strict';
  G.routeGBehaviorTests = function () {
    const results = [];
    const eq = (a, b) => {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw Error(JSON.stringify(a) + ' != ' + JSON.stringify(b));
    };
    const test = (name, fn) => {
      try { fn(); results.push({name: 'route-g/' + name, ok: true}); }
      catch (e) { results.push({name: 'route-g/' + name, ok: false, error: e.message}); }
    };
    function state() {
      const s = G.newRun('ROUTE-G');
      s.symbols = [];
      s.symbols.push(G.instance(s, 'cloudy_negative'));
      return s;
    }
    test('cloudy_negative/first-appearance-exact', () => {
      const s = state(), uid = s.symbols[0].uid;
      const r = G.resolve(s, [uid]);
      eq(r.total, 1);
      eq(s.symbols[0], {uid, type: 'cloudy_negative', permanent: 0, counters: {age: 1}});
    });
    test('cloudy_negative/second-appearance-no-conversion', () => {
      const s = state(), uid = s.symbols[0].uid;
      s.symbols[0].counters.age = 1;
      const r = G.resolve(s, [uid]);
      eq(r.total, 1);
      eq(s.symbols[0], {uid, type: 'cloudy_negative', permanent: 0, counters: {age: 2}});
      eq(r.log.filter(x => x.type === 'transform').length, 0);
    });
    test('cloudy_negative/third-preserves-identity-clears-counters-no-appear', () => {
      const s = state(), uid = s.symbols[0].uid;
      Object.assign(s.symbols[0], {permanent: 4, counters: {age: 2, beat: 7}});
      const r = G.resolve(s, [uid]);
      eq(r.total, 7);
      eq(s.symbols[0], {uid, type: 'blank_facet', permanent: 4, counters: {}});
      eq(r.ledger[0].ratio, ['1', '1']);
      eq(r.log.filter(x => x.type === 'age').length, 1);
      eq(r.log.filter(x => x.type === 'add').length, 0);
    });
    function fixture(entries) {
      const s = G.newRun('ROUTE-G');
      s.symbols = [];
      const board = Array(20).fill(null);
      for (const [type, pos] of entries) {
        const obj = G.instance(s, type);
        s.symbols.push(obj);
        board[pos] = obj.uid;
      }
      return {s, board, run: () => G.resolve(s, board)};
    }
    function tags(r) {
      return r.log.filter(x => x.type === 'tagAdded').map(x => ({
        source: x.source, target: x.target, tags: x.tags
      }));
    }
    function money(r) {
      return r.ledger.map(x => [x.amount, x.ratio]);
    }
    test('phase_chip/resonance-first-not-crystal-majority', () => {
      const f = fixture([['phase_chip', 0], ['echo', 1], ['crystal', 5], ['crystal', 6]]);
      const r = f.run(), uid = f.board[0];
      eq(r.total, 11);
      eq(tags(r), [{source: uid, target: uid, tags: ['resonance']}]);
      eq(f.s.symbols[0], {uid, type: 'phase_chip', permanent: 0, counters: {}});
    });
    test('phase_chip/crystal-fallback-diagonal', () => {
      const f = fixture([['phase_chip', 0], ['crystal', 6]]), r = f.run();
      eq(r.total, 6);
      eq(tags(r), [{source: f.board[0], target: f.board[0], tags: ['crystal']}]);
    });
    test('phase_chip/no-neighbor-no-temporary-tag', () => {
      const f = fixture([['phase_chip', 0], ['echo', 19]]), r = f.run();
      eq(r.total, 3);
      eq(tags(r), []);
    });
    test('spectrum_pin/three-distinct-neighbors-plus-four', () => {
      const f = fixture([['spectrum_pin', 0], ['echo', 1], ['battery', 5], ['crystal', 6]]), r = f.run();
      eq(r.total, 14);
      eq(money(r), [[5, ['1', '1']], [1, ['1', '1']], [4, ['1', '1']], [4, ['1', '1']]]);
    });
    test('spectrum_pin/duplicates-count-once', () => {
      const f = fixture([['spectrum_pin', 0], ['echo', 1], ['echo', 5], ['crystal', 6]]), r = f.run();
      eq(r.total, 7);
      eq(r.ledger[0].amount, 1);
    });
    test('spectrum_pin/self-and-distant-type-excluded', () => {
      const f = fixture([['spectrum_pin', 0], ['echo', 1], ['battery', 5], ['crystal', 19]]), r = f.run();
      eq(r.total, 10);
      eq(r.ledger[0].amount, 1);
    });
    test('blank_facet/plain-plus-two', () => {
      const f = fixture([['blank_facet', 0]]), r = f.run();
      eq(r.total, 5);
      eq(money(r), [[5, ['1', '1']]]);
      eq(r.log.map(x => [x.type, x.amount]), [['add', 2]]);
    });
    test('blank_facet/permanent-kept-no-growth', () => {
      const f = fixture([['blank_facet', 0]]), uid = f.board[0];
      f.s.symbols[0].permanent = 2;
      const r = f.run();
      eq(r.total, 7);
      eq(f.s.symbols[0], {uid, type: 'blank_facet', permanent: 2, counters: {}});
    });
    test('blank_facet/not-product-not-consumed', () => {
      const f = fixture([['blank_facet', 0], ['sorting_runner', 1]]), r = f.run();
      eq(r.total, 6);
      eq(r.reward, 0);
      eq(r.ledger.map(x => [x.type, x.alive]), [['blank_facet', true], ['sorting_runner', true]]);
      eq(G.symbols.blank_facet.tags, ['magic', 'crystal']);
    });
    test('alignment_cloth/actual-tag-added-target-plus-five', () => {
      const f = fixture([['phase_chip', 0], ['alignment_cloth', 1], ['echo', 5]]), r = f.run();
      eq(r.total, 9);
      eq(money(r), [[7, ['1', '1']], [1, ['1', '1']], [1, ['1', '1']]]);
      eq(r.log.filter(x => x.source === f.board[1] && x.type === 'add').map(x => [x.target, x.amount]), [[f.board[0], 5]]);
    });
    test('alignment_cloth/native-tag-does-not-qualify', () => {
      const f = fixture([['alignment_cloth', 0], ['echo', 1]]), r = f.run();
      eq(r.total, 2);
      eq(r.log.filter(x => x.type === 'add'), []);
    });
    test('alignment_cloth/two-tagged-neighbors-only-first-once', () => {
      const f = fixture([['phase_chip', 0], ['alignment_cloth', 1], ['phase_chip', 2], ['echo', 6]]), r = f.run();
      eq(r.total, 11);
      eq(money(r), [[7, ['1', '1']], [1, ['1', '1']], [2, ['1', '1']], [1, ['1', '1']]]);
      eq(r.log.filter(x => x.source === f.board[1] && x.type === 'add').map(x => x.target), [f.board[0]]);
    });
    test('split_register/dual-tag-single-product-rational-floor', () => {
      const f = fixture([['split_register', 0], ['copper_burr', 1]]);
      f.s.symbols[1].permanent = 1;
      const r = f.run();
      eq(r.total, 6);
      eq(money(r), [[2, ['1', '1']], [4, ['3', '2']]]);
      eq(tags(r), [{source: f.board[0], target: f.board[1], tags: ['resonance', 'crystal']}]);
      eq(f.s.symbols[1], {uid: f.board[1], type: 'copper_burr', permanent: 1, counters: {}});
    });
    test('split_register/two-products-first-only', () => {
      const f = fixture([['split_register', 0], ['tide_prism', 1], ['amber_frond', 5]]), r = f.run();
      eq(r.total, 12);
      eq(money(r), [[2, ['1', '1']], [6, ['3', '2']], [4, ['1', '1']]]);
      eq(tags(r), [{source: f.board[0], target: f.board[1], tags: ['resonance']}]);
    });
    test('split_register/non-product-no-tag-no-ratio', () => {
      const f = fixture([['split_register', 0], ['echo', 1]]), r = f.run();
      eq(r.total, 3);
      eq(money(r), [[2, ['1', '1']], [1, ['1', '1']]]);
      eq(tags(r), []);
    });
    function effects(type, replacements, fn) {
      const prior = G.symbols[type].effects;
      G.symbols[type].effects = replacements;
      try { fn(); } finally { G.symbols[type].effects = prior; }
    }
    const effect = (action, extra) => Object.assign({
      trigger: 'ON_APPEAR', action, scope: 'self', target: 'self', priority: 0
    }, extra);
    test('offset_reader/explicit-blank-plus-two', () => {
      const f = fixture([['offset_reader', 0], ['blank_facet', 1]]), r = f.run();
      eq(r.total, 8);
      eq(money(r), [[3, ['1', '1']], [5, ['1', '1']]]);
      eq(r.log.filter(x => x.type === 'copy').map(x => [x.source, x.target, x.amount]), [[f.board[0], f.board[1], 2]]);
    });
    test('offset_reader/two-whitelisted-neighbors-one-template', () => {
      const f = fixture([['offset_reader', 0], ['blank_facet', 1], ['blank_facet', 5]]), r = f.run();
      eq(r.total, 13);
      eq(money(r), [[3, ['1', '1']], [5, ['1', '1']], [5, ['1', '1']]]);
      eq(r.log.filter(x => x.type === 'copy').map(x => x.target), [f.board[1]]);
    });
    test('offset_reader/unmarked-legacy-battery-not-formal-whitelist', () => {
      const f = fixture([['offset_reader', 0], ['battery', 1]]), r = f.run();
      eq(r.total, 5);
      eq(r.log.filter(x => x.type === 'copy'), []);
    });
    test('offset_reader/pause-flat-only-not-conditional', () => {
      const f = fixture([['offset_reader', 0], ['pause_dial', 1], ['pressure_pouch', 6]]), r = f.run();
      eq(r.total, 8);
      eq(money(r), [[2, ['1', '1']], [5, ['1', '1']], [1, ['1', '1']]]);
      eq(f.s.symbols[2].counters, {pressure: 1});
      eq(r.log.filter(x => x.type === 'copy').map(x => x.amount), [1]);
    });
    test('offset_reader/conditional-and-h-placeholder-not-copyable', () => {
      const f = fixture([['offset_reader', 0], ['copper_burr', 1], ['cleared_stub', 5]]), r = f.run();
      // H-1: cleared_stub is the third explicit flat template; copper's condition stays excluded.
      eq(r.total, 10);
      eq(money(r), [[2, ['1', '1']], [4, ['1', '1']], [4, ['1', '1']]]);
      eq(r.log.filter(x => x.type === 'copy').map(x=>[x.target,x.amount]), [[f.board[5],1]]);
    });
    test('offset_reader/newly-transformed-facet-not-in-start-snapshot', () => {
      const f = fixture([['offset_reader', 0], ['cloudy_negative', 1]]);
      f.s.symbols[1].counters.age = 2;
      const r = f.run();
      eq(r.total, 4);
      eq(f.s.symbols[1], {uid: f.board[1], type: 'blank_facet', permanent: 0, counters: {}});
      eq(r.log.filter(x => x.type === 'copy'), []);
    });
    test('copy/snapshot-retains-numeric-template-after-conversion', () => {
      effects('press', [effect('transform', {target: 'adj:crystal', to: 'battery', priority: -5})], () => {
        const f = fixture([['offset_reader', 0], ['blank_facet', 1], ['press', 2]]), r = f.run();
        eq(r.total, 6);
        eq(money(r), [[3, ['1', '1']], [2, ['1', '1']], [1, ['1', '1']]]);
        eq(f.s.symbols[1], {uid: f.board[1], type: 'battery', permanent: 0, counters: {}});
        eq(r.log.filter(x => x.type === 'copy').map(x => x.amount), [2]);
      });
    });
    test('copy/total-eight-cap-not-per-effect-cap', () => {
      effects('blank_facet', [effect('add', {amount: 7, copyable: true}), effect('add', {amount: 6, copyable: true})], () => {
        const f = fixture([['offset_reader', 0], ['blank_facet', 1]]), r = f.run();
        eq(r.total, 25);
        eq(money(r), [[9, ['1', '1']], [16, ['1', '1']]]);
        eq(r.log.filter(x => x.type === 'copy').map(x => x.amount), [8]);
      });
    });
    test('copy/two-readers-no-recursion-no-derived-events', () => {
      const f = fixture([['offset_reader', 0], ['offset_reader', 1], ['blank_facet', 5]]), r = f.run();
      eq(r.total, 11);
      eq(money(r), [[3, ['1', '1']], [3, ['1', '1']], [5, ['1', '1']]]);
      eq(r.log.filter(x => x.type === 'copy').map(x => [x.target, x.depth, x.parent]), [[f.board[5], 0, null], [f.board[5], 0, null]]);
      eq(r.log.filter(x => x.depth > 0), []);
    });
    test('copy/legacy-mirror-unmarked-battery-compatible', () => {
      const f = fixture([['mirror', 0], ['battery', 1]]), r = f.run();
      eq(r.total, 7);
      eq(money(r), [[3, ['1', '1']], [4, ['1', '1']]]);
    });
    test('echo_plate/actual-increase-two-times-four', () => {
      effects('battery', [effect('grow', {amount: 2})], () => {
        const f = fixture([['echo_plate', 0], ['battery', 1]]), r = f.run();
        eq(r.total, 13);
        eq(money(r), [[9, ['1', '1']], [4, ['1', '1']]]);
        eq(f.s.symbols[1].permanent, 2);
        eq(r.log.filter(x => x.source === f.board[0] && x.type === 'add').map(x => [x.target, x.payload.target, x.payload.actualIncrease]), [[f.board[0], f.board[1], 2]]);
      });
    });
    test('echo_plate/non-neighbor-growth-no-reward', () => {
      effects('battery', [effect('grow', {amount: 2})], () => {
        const f = fixture([['echo_plate', 0], ['battery', 19]]), r = f.run();
        eq(r.total, 5);
        eq(money(r), [[1, ['1', '1']], [4, ['1', '1']]]);
        eq(r.log.filter(x => x.type === 'add'), []);
      });
    });
    test('echo_plate/cap-truncation-actual-one-not-requested-three', () => {
      effects('battery', [effect('grow', {amount: 3})], () => {
        const f = fixture([['echo_plate', 0], ['battery', 1]]);
        f.s.symbols[1].permanent = 29;
        const r = f.run();
        eq(r.total, 37);
        eq(money(r), [[5, ['1', '1']], [32, ['1', '1']]]);
        eq(f.s.symbols[1].permanent, 30);
        eq(r.log.filter(x => x.type === 'add').map(x => [x.payload.beforePermanent, x.payload.afterPermanent, x.payload.actualIncrease]), [[29, 30, 1]]);
      });
    });
    test('growth/at-cap-no-event-no-legacy-lens-multiply', () => {
      effects('battery', [effect('grow', {amount: 1, emit: 'ON_GROW'})], () => {
        const f = fixture([['echo_plate', 0], ['battery', 1], ['lens', 5]]);
        f.s.symbols[1].permanent = 30;
        const r = f.run();
        eq(r.total, 34);
        eq(money(r), [[1, ['1', '1']], [32, ['1', '1']], [1, ['1', '1']]]);
        eq(r.log.filter(x => x.type === 'add' || x.type === 'multiply'), []);
      });
    });
    test('echo_plate/two-events-limit-third-growth-still-applies', () => {
      effects('battery', [effect('grow', {amount: 1}), effect('grow', {amount: 1}), effect('grow', {amount: 1})], () => {
        const f = fixture([['echo_plate', 0], ['battery', 1]]), r = f.run();
        eq(r.total, 14);
        eq(money(r), [[9, ['1', '1']], [5, ['1', '1']]]);
        eq(f.s.symbols[1].permanent, 3);
        eq(r.log.filter(x => x.type === 'add').map(x => x.payload.actualIncrease), [1, 1]);
      });
    });
    test('growth/two-listeners-independent-not-consumed-event', () => {
      effects('battery', [effect('grow', {amount: 2})], () => {
        const f = fixture([['echo_plate', 0], ['battery', 1], ['echo_plate', 2]]), r = f.run();
        eq(r.total, 22);
        eq(money(r), [[9, ['1', '1']], [4, ['1', '1']], [9, ['1', '1']]]);
        eq(r.log.filter(x => x.type === 'add').map(x => [x.source, x.payload.target, x.payload.actualIncrease]), [[f.board[0], f.board[1], 2], [f.board[2], f.board[1], 2]]);
      });
    });
    test('growth/explicit-legacy-emit-deduplicated-lens-once', () => {
      effects('battery', [effect('grow', {amount: 2, emit: 'ON_GROW'})], () => {
        const f = fixture([['echo_plate', 0], ['battery', 1], ['lens', 5]]), r = f.run();
        eq(r.total, 15);
        eq(money(r), [[9, ['1', '1']], [4, ['1', '1']], [2, ['2', '1']]]);
        eq(r.log.filter(x => x.type === 'multiply').map(x => [x.source, x.payload.actualIncrease]), [[f.board[5], 2]]);
      });
    });
    test('growth/adjacency-tests-target-not-growth-source', () => {
      effects('battery', [effect('grow', {target: 'board:crystal', amount: 2})], () => {
        const f = fixture([['echo_plate', 0], ['crystal', 1], ['battery', 19]]), r = f.run();
        eq(r.total, 17);
        eq(money(r), [[9, ['1', '1']], [6, ['1', '1']], [2, ['1', '1']]]);
        eq(r.log.filter(x => x.type === 'add').map(x => [x.payload.source, x.payload.target]), [[f.board[19], f.board[1]]]);
      });
    });
    test('tags/preprocessing-before-earlier-position-addition', () => {
      const f = fixture([['pitch_fork', 0], ['phase_chip', 1], ['echo', 2]]), r = f.run();
      eq(r.total, 7);
      eq(money(r), [[1, ['1', '1']], [5, ['1', '1']], [1, ['1', '1']]]);
      eq(r.log.map(x => x.type), ['tag', 'tagAdded', 'add']);
    });
    test('tags/split-labels-visible-to-addition-before-ordinary-floor', () => {
      const f = fixture([['pitch_fork', 0], ['copper_burr', 1], ['split_register', 2]]), r = f.run();
      eq(r.total, 10);
      eq(money(r), [[1, ['1', '1']], [7, ['3', '2']], [2, ['1', '1']]]);
      eq(tags(r), [{source: f.board[2], target: f.board[1], tags: ['resonance', 'crystal']}]);
    });
    test('tags/no-persistent-tags-or-ratio-next-turn-without-source', () => {
      const f = fixture([['pitch_fork', 0], ['copper_burr', 1], ['split_register', 2]]);
      eq(f.run().total, 10);
      const saved = G.decode(G.encode(f.s));
      eq(saved.symbols, f.s.symbols);
      eq(saved.symbols[1], {uid: f.board[1], type: 'copper_burr', permanent: 0, counters: {}});
      const r = G.resolve(saved, [f.board[0], f.board[1]]);
      eq(r.total, 3);
      eq(money(r), [[1, ['1', '1']], [2, ['1', '1']]]);
      eq(tags(r), []);
    });
    test('alignment_cloth/works-for-non-g-transit-tag-provenance', () => {
      const f = fixture([['transit_seal', 0], ['alignment_cloth', 1], ['wick_bed', 5]]), r = f.run();
      eq(r.total, 10);
      eq(tags(r), [{source: f.board[0], target: f.board[0], tags: ['plant']}]);
      eq(money(r), [[7, ['1', '1']], [1, ['1', '1']], [2, ['1', '1']]]);
    });
    test('alignment_cloth/tag-history-not-transformed-final-tags', () => {
      effects('press', [effect('transform', {target: 'adj:magic', to: 'battery', priority: -5})], () => {
        const f = fixture([['alignment_cloth', 0], ['phase_chip', 1], ['press', 2], ['crystal', 6]]), r = f.run();
        eq(r.total, 13);
        eq(money(r), [[1, ['1', '1']], [7, ['1', '1']], [1, ['1', '1']], [4, ['1', '1']]]);
        eq(tags(r), [{source: f.board[1], target: f.board[1], tags: ['crystal']}]);
        eq(f.s.symbols[1], {uid: f.board[1], type: 'battery', permanent: 0, counters: {}});
      });
    });
    test('phase_chip/previous-turn-tag-is-not-current-turn-tag', () => {
      const f = fixture([['phase_chip', 0], ['alignment_cloth', 1], ['echo', 5]]);
      eq(f.run().total, 9);
      const r = G.resolve(f.s, [f.board[0], f.board[1]]);
      eq(r.total, 3);
      eq(tags(r), []);
      eq(r.log.filter(x => x.type === 'add'), []);
      eq(f.s.symbols[0], {uid: f.board[0], type: 'phase_chip', permanent: 0, counters: {}});
    });
    test('content/formal-copy-whitelist-exact-two-and-prototype-unmarked', () => {
      const whitelist = G.formalSymbolIds.flatMap(id => G.symbols[id].effects
        .filter(x => x.copyable === true).map(x => [id, x.trigger, x.action, x.amount, x.target, x.scope]));
      eq(whitelist, [['pause_dial', 'ON_APPEAR', 'add', 1, 'self', 'self'], ['blank_facet', 'ON_APPEAR', 'add', 2, 'self', 'self'], ['cleared_stub', 'ON_APPEAR', 'add', 1, 'self', 'self']]);
      eq(G.symbols.battery.effects[0].copyable, undefined);
      eq(G.symbols.offset_reader.effects[0].copyMode, 'explicit');
    });
    test('command/save-restore-pending-once-with-g-tags-copy-growth', () => {
      effects('battery', [effect('grow', {amount: 2, emit: 'ON_GROW'})], () => {
        const f = fixture([['split_register', 0], ['copper_burr', 1], ['alignment_cloth', 2], ['offset_reader', 6], ['blank_facet', 7], ['echo_plate', 11], ['battery', 12]]);
        f.s.cash = 23;
        const before = G.encode(f.s);
        const a = G.command(f.s, {revision: f.s.revision, type: 'spin', board: f.board});
        eq(a.ok, true);
        eq(G.encode(f.s), before);
        const s = a.state;
        // register2 + floor((copper2+machine-neighbor2+cloth5)*3/2)=13
        // cloth1 + reader3 + facet5 + plate9 + grown battery4 = 37.
        eq(s.last.total, 37);
        eq(s.pendingSettlement, 37);
        eq(s.cash, 23);
        eq(s.symbols[1], {uid: f.board[1], type: 'copper_burr', permanent: 0, counters: {}});
        eq(s.symbols[6], {uid: f.board[12], type: 'battery', permanent: 2, counters: {}});
        const memory = new Map();
        const storage = {getItem: k => memory.get(k) || null, setItem: (k, v) => memory.set(k, v)};
        eq(G.store(storage, f.s).ok, true);
        eq(G.store(storage, s).ok, true);
        const restored = G.load(storage);
        eq(restored.ok, true);
        eq(G.encode(restored.state), G.encode(s));
        const invalid = G.command(restored.state, {revision: s.revision, type: 'choose', index: 7});
        eq(invalid.ok, false);
        eq(G.encode(invalid.state), G.encode(s));
        const chosen = G.command(restored.state, {revision: s.revision, type: 'choose', index: null});
        eq(chosen.ok, true);
        eq([chosen.state.phase, chosen.state.cash, chosen.state.pendingSettlement], ['READY', 60, null]);
        eq(G.store(storage, chosen.state).ok, true);
        const again = G.load(storage).state;
        eq(G.encode(again), G.encode(chosen.state));
        const replay = G.command(again, {revision: again.revision, type: 'choose', index: null});
        eq(replay.ok, false);
        eq([replay.state.cash, replay.state.pendingSettlement], [60, null]);
        eq(G.encode(replay.state), G.encode(again));
      });
    });
    test('command/save-main-write-failure-keeps-valid-pending-backup', () => {
      const f = fixture([['phase_chip', 0], ['alignment_cloth', 1], ['echo', 5]]);
      f.s.cash = 17;
      const a = G.command(f.s, {revision: f.s.revision, type: 'spin', board: f.board});
      eq(a.ok, true);
      eq([a.state.cash, a.state.pendingSettlement], [17, 9]);
      const pending = G.encode(a.state);
      const b = G.command(a.state, {revision: a.state.revision, type: 'choose', index: null});
      eq(b.ok, true);
      eq([b.state.cash, b.state.pendingSettlement], [26, null]);
      const memory = new Map([['fog-port.save.v1', pending]]);
      const storage = {getItem: k => memory.get(k) || null, setItem: (k, v) => {
        if (k === 'fog-port.save.v1') throw Error('main-write-failed');
        memory.set(k, v);
      }};
      eq(G.store(storage, b.state).ok, false);
      eq(memory.get('fog-port.save.v1'), pending);
      eq(memory.get('fog-port.save.v1.backup'), pending);
      const restored = G.load(storage).state;
      eq([restored.cash, restored.pendingSettlement], [17, 9]);
      const committed = G.command(restored, {revision: restored.revision, type: 'choose', index: null});
      eq(committed.ok, true);
      eq([committed.state.cash, committed.state.pendingSettlement], [26, null]);
    });
    function schema(name, candidate, valid) {
      test('schema/' + name, () => effects('battery', [candidate], () => {
        let accepted = false;
        try { accepted = G.validateContent(); } catch (_) { accepted = false; }
        eq(accepted, valid);
      }));
    }
    const tag = extra => effect('tag', Object.assign({tags: ['resonance', 'crystal'], temporary: true}, extra));
    const copy = extra => effect('copy', Object.assign({
      selector: {area: 'adj', count: '1', excludeSelf: true}, copyMode: 'explicit', maxAdd: 8
    }, extra));
    const growthAdd = extra => effect('add', Object.assign({
      trigger: 'ON_GROW', scope: 'event', amount: {mul: [{eventValue: 'actualIncrease'}, 4]},
      when: {eventTargetNeighbor: true}
    }, extra));
    [
      ['tag-multiple', tag()],
      ['tag-first-present', effect('tag', {chooseTags: ['resonance', 'crystal'], choiceMode: 'firstPresent', temporary: true})],
      ['tag-majority-explicit', effect('tag', {chooseTags: ['plant', 'crystal'], choiceMode: 'mostNeighbors', temporary: true})],
      ['tag-positive-ratio', tag({ratio: [3, 2]})],
      ['copy-cap-one', copy({maxAdd: 1})], ['copy-cap-eight', copy()],
      ['copy-legacy-mode', effect('copy', {target: 'adj:machine', copyMode: 'legacy'})],
      ['event-actual-increase', growthAdd()],
      ['neighbor-types-one', effect('add', {amount: 4, when: {neighborUniqueTypeCount: {at: 1}}})],
      ['neighbor-types-eight', effect('add', {amount: 4, when: {neighborUniqueTypeCount: {at: 8}}})],
      ['temporary-history', effect('add', {amount: 5, selector: {area: 'adj', temporaryTagAdded: true}})],
      ['grow-zero', effect('grow', {amount: 0})], ['grow-cap-increment', effect('grow', {amount: 30})],
      ['flat-copyable-constant', effect('add', {amount: {constant: 2}, copyable: true})]
    ].forEach(([name, x]) => schema('legal-' + name, x, true));
    [
      ['tag-empty', tag({tags: []})], ['tag-duplicate', tag({tags: ['resonance', 'resonance']})],
      ['tag-unknown', tag({tags: ['bogus']})], ['tag-nonstring', tag({tags: ['crystal', 3]})],
      ['tag-two-shapes', tag({tag: 'crystal'})], ['tag-choose-and-tags', tag({chooseTags: ['crystal']})],
      ['tag-no-shape', effect('tag', {temporary: true})], ['tag-persistent', tag({temporary: false})],
      ['tag-bad-mode', effect('tag', {chooseTags: ['crystal'], choiceMode: 'lastPresent'})],
      ['tag-mode-without-choice', tag({choiceMode: 'firstPresent'})],
      ['tag-unknown-field', tag({sticky: true})], ['tag-nonappear', tag({trigger: 'ON_GROW', scope: 'event'})],
      ['copy-cap-zero', copy({maxAdd: 0})], ['copy-cap-nine', copy({maxAdd: 9})],
      ['copy-cap-fraction', copy({maxAdd: 1.5})], ['copy-cap-string', copy({maxAdd: '8'})],
      ['copy-cap-missing', copy({maxAdd: undefined})], ['copy-mode-unknown', copy({copyMode: 'all'})],
      ['copy-mode-null', copy({copyMode: null})], ['copy-emits', copy({emit: 'ON_GAIN'})],
      ['copy-multiple-targets', copy({selector: {area: 'adj', count: 'all', excludeSelf: true}})],
      ['copy-unknown-field', copy({recursive: true})],
      ['event-value-unknown', growthAdd({amount: {eventValue: 'requestedIncrease'}})],
      ['event-value-nonstring', growthAdd({amount: {eventValue: 2}})],
      ['event-value-without-event', growthAdd({trigger: 'ON_APPEAR'})],
      ['event-neighbor-false', growthAdd({when: {eventTargetNeighbor: false}})],
      ['neighbor-type-zero', effect('add', {amount: 4, when: {neighborUniqueTypeCount: {at: 0}}})],
      ['neighbor-type-nine', effect('add', {amount: 4, when: {neighborUniqueTypeCount: {at: 9}}})],
      ['neighbor-type-fraction', effect('add', {amount: 4, when: {neighborUniqueTypeCount: {at: 2.5}}})],
      ['neighbor-type-extra-field', effect('add', {amount: 4, when: {neighborUniqueTypeCount: {at: 3, tags: []}}})],
      ['temporary-history-false', effect('add', {amount: 5, selector: {area: 'adj', temporaryTagAdded: false}})],
      ['temporary-history-string', effect('add', {amount: 5, selector: {area: 'adj', temporaryTagAdded: 'true'}})],
      ['grow-negative', effect('grow', {amount: -1})], ['grow-missing', effect('grow')],
      ['copyable-conditional', effect('add', {amount: 2, copyable: true, when: {lowCash: true}})],
      ['copyable-event', effect('add', {trigger: 'ON_GROW', scope: 'event', amount: 2, copyable: true})],
      ['copyable-emit', effect('add', {amount: 2, copyable: true, emit: 'ON_GAIN'})],
      ['copyable-neighbor', effect('add', {target: 'adj:crystal', amount: 2, copyable: true})],
      ['copyable-growth', effect('grow', {amount: 2, copyable: true})],
      ['copyable-dynamic', effect('add', {amount: {counter: 'age'}, copyable: true})],
      ['copyable-nonboolean', effect('add', {amount: 2, copyable: 'yes'})]
    ].forEach(([name, x]) => schema('reject-' + name, x, false));
    test('content/eight-matrix-base-tags-rarity-exact', () => {
      eq(['phase_chip', 'spectrum_pin', 'cloudy_negative', 'blank_facet', 'offset_reader', 'alignment_cloth', 'echo_plate', 'split_register'].map(id => {
        const d = G.symbols[id];
        return [id, d.baseValue, d.tags, d.rarity];
      }), [
        ['phase_chip', 2, ['magic'], 'common'],
        ['spectrum_pin', 1, ['magic', 'support'], 'common'],
        ['cloudy_negative', 1, ['magic', 'feedstock'], 'common'],
        ['blank_facet', 3, ['magic', 'crystal'], 'uncommon'],
        ['offset_reader', 1, ['magic', 'machine'], 'rare'],
        ['alignment_cloth', 1, ['magic', 'support'], 'uncommon'],
        ['echo_plate', 1, ['magic', 'resonance'], 'rare'],
        ['split_register', 2, ['magic', 'contract'], 'epic']
      ]);
    });
    test('echo_plate/real-root-ledger-conversion-growth', () => {
      const f = fixture([['root_ledger', 0], ['echo_plate', 1], ['mist_pouch', 5]]);
      f.s.symbols[2].counters.age = 2;
      const r = f.run();
      eq(r.total, 10);
      eq(money(r), [[2, ['1', '1']], [5, ['1', '1']], [3, ['1', '1']]]);
      eq(f.s.symbols, [
        {uid: f.board[0], type: 'root_ledger', permanent: 1, counters: {}},
        {uid: f.board[1], type: 'echo_plate', permanent: 0, counters: {}},
        {uid: f.board[5], type: 'dew_lantern', permanent: 0, counters: {}}
      ]);
      eq(r.log.filter(x => x.type === 'add').map(x => [x.source, x.payload.target, x.payload.actualIncrease]), [[f.board[1], f.board[0], 1]]);
    });
    test('echo_plate/real-heat-clerk-consumption-growth', () => {
      const f = fixture([['heat_clerk', 0], ['echo_plate', 1], ['sorting_tong', 5], ['slag', 6]]), r = f.run();
      eq(r.total, 14);
      eq(r.reward, 6);
      eq(money(r), [[2, ['1', '1']], [5, ['1', '1']], [1, ['1', '1']], [0, ['1', '1']]]);
      eq(f.s.symbols.map(x => [x.uid, x.type, x.permanent, x.counters]), [
        [f.board[0], 'heat_clerk', 1, {}], [f.board[1], 'echo_plate', 0, {}], [f.board[5], 'sorting_tong', 0, {}]
      ]);
    });
    test('spectrum_pin/earlier-dead-neighbor-not-counted', () => {
      effects('press', [effect('destroy', {target: 'board:scrap', priority: -5})], () => {
        const f = fixture([['spectrum_pin', 0], ['echo', 1], ['slag', 5], ['crystal', 6], ['press', 19]]), r = f.run();
        eq(r.total, 7);
        eq(money(r), [[1, ['1', '1']], [1, ['1', '1']], [0, ['1', '1']], [4, ['1', '1']], [1, ['1', '1']]]);
        eq(r.log.filter(x => x.type === 'add'), []);
      });
    });
    test('cloudy_negative/transform-clears-reservation-and-all-counters', () => {
      const f = fixture([['cloudy_negative', 0]]);
      Object.assign(f.s.symbols[0], {permanent: 3, counters: {age: 2, pressure: 4, beat: 6}});
      f.s.reservations = [{uid: f.board[0], pos: 0, source: f.board[0]}];
      const r = f.run();
      eq(r.total, 6);
      eq(f.s.reservations, []);
      eq(f.s.symbols[0], {uid: f.board[0], type: 'blank_facet', permanent: 3, counters: {}});
      eq(r.log.filter(x => x.type === 'add'), []);
    });
    [
      ['tag-ratio-zero', tag({ratio: [0, 2]})],
      ['tag-ratio-denominator-zero', tag({ratio: [3, 0]})],
      ['tag-ratio-fraction', tag({ratio: [1.5, 2]})],
      ['tag-list-scalar', tag({tags: 'resonance'})],
      ['copy-scope-event', copy({scope: 'event'})],
      ['copy-not-adjacent', copy({selector: {area: 'board', count: '1', excludeSelf: true}})],
      ['copy-does-not-exclude-self', copy({selector: {area: 'adj', count: '1'}})],
      ['copyable-negative', effect('add', {amount: -1, copyable: true})],
      ['copyable-counter-limit', effect('add', {amount: 2, copyable: true, limit: {perSpin: 1}})],
      ['grow-negative-expression', effect('grow', {amount: {add: [1, -2]}})],
      ['grow-infinite', effect('grow', {amount: Infinity})],
      ['grow-unknown-field', effect('grow', {amount: 1, cap: 80})]
    ].forEach(([name, x]) => schema('reject-' + name, x, false));
    test('save/tagAdded-log-strict-invalid-boundaries', () => {
      const f = fixture([['phase_chip', 0], ['echo', 1]]);
      const a = G.command(f.s, {revision: f.s.revision, type: 'spin', board: f.board});
      eq(a.ok, true);
      for (const patch of [{tags: []}, {tags: ['bogus']}, {tags: ['resonance', 'resonance']}, {target: 'missing'}, {source: 'missing'}, {event: 'ON_GROW'}, {amount: 5}]) {
        const s = G.clone(a.state);
        Object.assign(s.last.log.find(x => x.type === 'tagAdded'), patch);
        let rejected = false;
        try { G.encode(s); } catch (_) { rejected = true; }
        eq(rejected, true);
      }
      eq(G.decode(G.encode(a.state)), a.state);
    });
    return results;
  };
})(window.Game);
