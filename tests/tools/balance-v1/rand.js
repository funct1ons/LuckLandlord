'use strict';
/**
 * tests/tools/balance-v1/rand.js
 *
 * Bot 决策用 RNG。与游戏 RNG 完全独立：
 *   - 不读也不推进 js/gdd1/rng.js 的任何 stream；
 *   - 只由字符串种子决定，便于复现。
 * 算法与游戏一致的 FNV-1a + xorshift32，但状态是工具自己的实例。
 */

function fnv1a(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h = Math.imul(h ^ (c & 255), 16777619) >>> 0;
    h = Math.imul(h ^ (c >>> 8), 16777619) >>> 0;
  }
  return h || 1;
}

function makeRng(seedText) {
  let state = fnv1a(String(seedText));
  const api = {
    nextUint32() {
      let x = state;
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      state = x >>> 0;
      return state;
    },
    float() { return api.nextUint32() / 4294967296; },
    int(n) { return Math.floor(api.float() * n); },
    pick(arr) { return arr[api.int(arr.length)]; },
    chance(p) { return api.float() < p; }
  };
  return api;
}

module.exports = { makeRng, fnv1a };
