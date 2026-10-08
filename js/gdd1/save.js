(function (root) {
  'use strict';
  const F = root.GDD1;
  const MAX = 1024 * 1024;
  const size = text => {
    // Count UTF-8 bytes, not JS UTF-16 length (JSON import limit is <=1 MiB).
    let bytes = 0;
    for (let i=0; i<text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 128) bytes++;
      else if (c < 2048) bytes += 2;
      else if (c >= 0xd800 && c <= 0xdbff && i+1 < text.length && text.charCodeAt(i+1) >= 0xdc00 && text.charCodeAt(i+1) <= 0xdfff) { bytes += 4; i++; }
      else bytes += 3;
    }
    return bytes;
  };
  const bounded = (text, max) => {
    if (typeof text !== 'string' || text.length > max || size(text) > max) throw Error('GDD1 save exceeds byte limit');
  };
  F.encode = function (state) {
    F.validateState(state);
    const text = JSON.stringify(state); bounded(text,MAX); return text;
  };
  F.decode = function (text, expectedProfile) {
    bounded(text,MAX);
    const state = JSON.parse(text);
    // Intentionally no migration, missing-field defaults, RNG generation, or resolver call.
    F.validateState(state);
    if (expectedProfile !== undefined && (!Object.hasOwn(F.PROFILES,expectedProfile) || state.profile !== expectedProfile)) throw Error('GDD1 profile mismatch');
    return state;
  };
  F.decodeStorageRecord = function (text, expectedProfile) {
    bounded(text,2*MAX+256);
    const record = JSON.parse(text);
    if (!record || record.storageVersion !== 1 || Object.keys(record).sort().join(',') !== 'current,previous,storageVersion') throw Error('GDD1 invalid envelope');
    // Unknown future/schema/profile must not be masked by a compatible previous save.
    // Recovery is explicit (recoverPrevious), never silent on an invalid current.
    return F.decode(JSON.stringify(record.current),expectedProfile);
  };
  F.recoverPrevious = function (text) {
    bounded(text,2*MAX+256);
    const record = JSON.parse(text);
    if (!record || record.storageVersion !== 1 || Object.keys(record).sort().join(',') !== 'current,previous,storageVersion' || record.previous === null) throw Error('GDD1 no valid previous record');
    return F.decode(JSON.stringify(record.previous));
  };
  F.store = function (storage, state) {
    try {
      const current = JSON.parse(F.encode(state));
      const old = storage.getItem(F.SAVE_KEY);
      let previous = null;
      if (old !== null) {
        // Invalid old bytes remain intact: user must explicitly export/clear before replacing.
        previous = F.decodeStorageRecord(old);
      }
      const envelope = JSON.stringify({storageVersion:1,current,previous});
      bounded(envelope,2*MAX+256);
      storage.setItem(F.SAVE_KEY,envelope); // exactly one write; legacy keys never touched
      return {ok:true};
    } catch (error) { return {ok:false,error:'Session-only: ' + error.message}; }
  };
  F.load = function (storage, expectedProfile) {
    try {
      const text = storage.getItem(F.SAVE_KEY);
      if (text === null) return {ok:false,error:'No GDD1 save'};
      return {ok:true,state:F.decodeStorageRecord(text,expectedProfile)};
    } catch (error) { return {ok:false,error:error.message}; }
  };
  F.commitImport = function (storage, text, preview, expectedProfile) {
    // Preview is synchronous, returns undefined, and works on a disposable clone.
    // Validate completion before store performs any storage read/write or state publication.
    try {
      const next = F.decode(text,expectedProfile);
      if (typeof preview !== 'function') throw Error('GDD1 import requires pre-render validation');
      const returned = preview(F.clone(next));
      if (returned !== undefined) throw Error('GDD1 preview must be synchronous and return undefined');
      const result = F.store(storage,next);
      return result.ok ? {ok:true,state:next} : result;
    } catch (error) { return {ok:false,error:error.message}; }
  };
  F.readLegacy = function (storage) {
    return F.LEGACY_KEYS.map(key => {
      const text = storage.getItem(key);
      let summary = null;
      if (typeof text === 'string') {
        try {
          bounded(text,2*MAX+256);
          const parsed = JSON.parse(text), s = parsed && parsed.storageVersion === 1 ? parsed.current : parsed;
          if (s && typeof s === 'object') summary = {version:s.version ?? null,rules:s.rules ?? null,
            contentVersion:s.contentVersion ?? null,phase:s.phase ?? null,cash:s.cash ?? null,
            pendingSettlement:s.pendingSettlement ?? null};
        } catch (_) { /* raw export remains available even for corrupt legacy bytes */ }
      }
      return {key,text,summary,readOnly:true};
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
