(function (root) {
  'use strict';
  const F = root.GDD1;
  // FNV-1a over explicit UTF-16LE bytes, including unpaired surrogate code units.
  F.hashIdentity = function (text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      h = Math.imul(h ^ (c & 255), 16777619) >>> 0;
      h = Math.imul(h ^ (c >>> 8), 16777619) >>> 0;
    }
    return h || 1;
  };
  F.createRng = function (seed, profile, difficulty) {
    if (typeof seed !== 'string' || seed.length > 1024 || !Object.hasOwn(F.PROFILES,profile) || difficulty !== 'Normal') throw Error('Invalid RNG identity');
    return Object.fromEntries(F.STREAMS.map(name => [name, {
      state:F.hashIdentity(JSON.stringify([F.RULES,F.CONTENT,profile,difficulty,seed,name])), consumed:0
    }]));
  };
  F.nextUint32 = function (rng, name) {
    if (!F.STREAMS.includes(name) || !rng || !rng[name]) throw Error('Unknown RNG stream');
    const r = rng[name];
    if (!Number.isInteger(r.state) || r.state < 1 || r.state > 0xffffffff ||
        !Number.isSafeInteger(r.consumed) || r.consumed < 0 || r.consumed === Number.MAX_SAFE_INTEGER) throw Error('Invalid RNG state/count');
    let x = r.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    r.state = x >>> 0;
    r.consumed++;
    return r.state;
  };
  F.random = (rng, name) => F.nextUint32(rng, name) / 4294967296;
  F.shuffle = function (values, rng, name) {
    const a = values.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(F.random(rng, name) * (i + 1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  };
})(typeof window !== 'undefined' ? window : globalThis);
