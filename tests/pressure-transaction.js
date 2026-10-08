(function (G) {
  'use strict';
  G.pressureTransactionTests = function () {
    const results = [];
    function test(name, fn) {
      try { fn(); results.push({name: 'pressure-transaction/' + name, ok: true}); }
      catch (e) { results.push({name: 'pressure-transaction/' + name, ok: false, error: e.message}); }
    }
    function eq(a, b) {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw Error(JSON.stringify(a) + ' != ' + JSON.stringify(b));
    }
    function reject(fn) {
      let rejected = false;
      try { fn(); } catch (e) { rejected = true; }
      if (!rejected) throw Error('expected rejection');
    }
    function base(types = ['pressure_pouch']) {
      const s = G.newRun('PRESSURE-TRANSACTION');
      s.symbols = [];
      types.forEach(type => s.symbols.push(G.instance(s, type)));
      return s;
    }
    function command(s, type, extra = {}) {
      const r = G.command(s, Object.assign({type, revision: s.revision}, extra));
      if (!r.ok) throw Error(r.error);
      return r.state;
    }
    function pending(types) {
      const s = base(types);
      return command(s, 'spin', {board: s.symbols.map(x => x.uid)});
    }
    function mutate(id, patch, fn) {
      const old = G.clone(G.symbols[id].effects);
      try { Object.assign(G.symbols[id].effects[0], patch); fn(); }
      finally { G.symbols[id].effects = old; }
    }
    const damaged = [null, '1', {amount: 1}, true, 1.5, 1000000001, -1000000001, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, 8, undefined];
    damaged.forEach((value, i) => test('pending-damaged-' + i, () => {
      const s = pending();
      s.pendingSettlement = value;
      const before = JSON.stringify(s);
      reject(() => G.validateState(s));
      reject(() => G.decode(JSON.stringify(s)));
      const r = G.command(s, {type: 'choose', index: null, revision: s.revision});
      eq(r.ok, false); eq(JSON.stringify(s), before); eq(JSON.stringify(r.state), before);
    }));
    ['READY', 'ITEM_CHOICE', 'WON', 'LOST'].forEach(phase => test('settled-phase-' + phase, () => {
      let s = pending();
      if (phase === 'READY') s = command(s, 'choose', {index: null});
      else {
        s = base(); s.spinsRemaining = 1;
        s.cash = phase === 'LOST' ? 0 : G.stages[phase === 'ITEM_CHOICE' ? 0 : 9].payment;
        if (phase !== 'ITEM_CHOICE') { s.stage = 9; s.payment = G.stages[9].payment; }
        s = command(command(s, 'spin', {board: s.symbols.map(x => x.uid)}), 'choose', {index: null});
      }
      eq(s.phase, phase); eq(s.pendingSettlement, null); G.decode(G.encode(s));
      const bad = G.clone(s); bad.pendingSettlement = 1; reject(() => G.encode(bad));
      delete s.pendingSettlement;
      eq(G.decode(JSON.stringify(s)).pendingSettlement, null);
    }));
    [-1000000000, -1, 0, 1000000000].forEach(amount => test('signed-pending-boundary-' + amount, () => {
      const s = pending();
      s.last.ledger.forEach(x => x.amount = 0); s.last.reward = amount; s.last.total = amount; s.pendingSettlement = amount;
      const next = command(G.decode(G.encode(s)), 'choose', {index: null});
      eq(next.cash, Math.max(0, amount)); eq(next.pendingSettlement, null);
    }));
    test('legacy-undecided-rejected', () => {
      const s = pending(); delete s.pendingSettlement;
      reject(() => G.decode(JSON.stringify(s))); reject(() => G.encode(s));
    });
    test('primary-backup-strict-and-unchanged', () => {
      const good = pending(), bad = G.clone(good); bad.pendingSettlement = 8;
      const entries = new Map([['fog-port.save.v1', JSON.stringify(bad)], ['fog-port.save.v1.backup', G.encode(good)]]);
      const storage = {getItem: k => entries.get(k) || null, setItem: (k, v) => entries.set(k, v)};
      const before = JSON.stringify([...entries]);
      eq(G.load(storage).state.pendingSettlement, 1); eq(JSON.stringify([...entries]), before);
      entries.set('fog-port.save.v1.backup', JSON.stringify(bad));
      eq(G.load(storage).ok, false);
      const broken = JSON.stringify([...entries]);
      eq(G.store(storage, bad).ok, false); eq(JSON.stringify([...entries]), broken);
    });
    test('two-legal-targets-one-release', () => {
      const s = base(['release_spire', 'feed_valve', 'feed_valve']);
      s.symbols[1].counters.pressure = 3; s.symbols[2].counters.pressure = 3;
      const b = Array(20).fill(null); [0, 1, 5].forEach((pos, i) => b[pos] = s.symbols[i].uid);
      const r = G.resolve(s, b);
      eq(s.symbols.map(x => x.counters.pressure || 0), [0, 0, 3]);
      eq(r.ledger.map(x => x.amount), [2, 3, 1]); eq(r.total, 6);
    });
    const invalid = {
      pressure_pouch: [{name: 'unknown'}, {name: undefined}, {release: 'yes'}, {release: null}, {delta: -1}, {max: 1.5}, {at: Number.MAX_SAFE_INTEGER + 1}, {reset: -1}, {unknown: 1}],
      release_spire: [{amount: undefined}, {amount: -3}, {amount: 0}, {amount: '3'}, {ratio: undefined}, {ratio: [0, 1]}, {unknown: 1}],
      cracked_regulator: [{loss: undefined}, {chance: undefined}, {amount: undefined}, {loss: -1.5}, {chance: '0.75'}, {chance: 1.01}, {chance: NaN}, {unknown: 1}]
    };
    Object.entries(invalid).forEach(([id, patches]) => patches.forEach((patch, i) => test('schema-invalid-' + id + '-' + i, () => mutate(id, patch, () => reject(() => G.validateContent())))));
    test('schema-legal-formal-and-legacy', () => G.validateContent());
    test('schema-legal-counter-alias-zero', () => mutate('pressure_pouch', {name: undefined, counter: 'pressure', delta: 0, max: 0, at: 0, reset: 0, release: false}, () => G.validateContent()));
    [0, 1].forEach(chance => test('schema-legal-risk-chance-' + chance, () => mutate('cracked_regulator', {chance, amount: 0, loss: -1}, () => G.validateContent())));
    test('schema-legal-release-positive', () => mutate('release_spire', {amount: 1, ratio: [1, 1]}, () => G.validateContent()));
    return results;
  };
})(window.Game);
