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
    return results;
  };
})(window.Game);
