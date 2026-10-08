(function (G) {
  'use strict';
  const KEY = 'fog-port.save.v1', BACK = KEY + '.backup', MAX = 1024 * 1024;
  G.encode = function (s) {
    G.validateState(s);
    const text = JSON.stringify(s);
    if (text.length > MAX) throw Error('Save too large');
    return text;
  };
  G.decode = function (text) {
    if (typeof text !== 'string' || text.length > MAX) throw Error('Save too large');
    const s = JSON.parse(text);
    if (s && s.version === G.VERSION && ['0.2', G.RULES].includes(s.rules) &&
        !Object.prototype.hasOwnProperty.call(s, 'pendingSettlement') &&
        ['READY','ITEM_CHOICE','WON','LOST'].includes(s.phase)) s.pendingSettlement = null;
    if (s && s.version === 1 && s.rules === '0.2') {
      if (!Object.prototype.hasOwnProperty.call(s, 'pendingSettlement') &&
          ['READY','ITEM_CHOICE','WON','LOST'].includes(s.phase)) s.pendingSettlement = null;
      s.rules = G.RULES;
      if (s.last) s.last.resolvedRules = '0.2';
    }
    if (s && s.version===G.VERSION && s.rules===G.RULES && !Object.prototype.hasOwnProperty.call(s,'contentVersion')) {
      if (Object.prototype.hasOwnProperty.call(s,'stageState') || (s.settings && Object.prototype.hasOwnProperty.call(s.settings,'advanceAccepted'))) throw Error('Ambiguous legacy stage state');
      s.contentVersion=G.CONTENT_VERSION;
      s.stageState={claims:[],paymentModifiers:[]};
      if(s.settings && typeof s.settings==='object' && !Array.isArray(s.settings))s.settings.advanceAccepted=false;
    }
    if (s && s.version===G.VERSION && s.rules===G.RULES && s.contentVersion==='H-1') {
      if (Object.prototype.hasOwnProperty.call(s,'itemState')) throw Error('Ambiguous legacy item state');
      s.contentVersion=G.CONTENT_VERSION;
      s.itemState=G.emptyItemState(s.stage,s.spin);
    }
    if (s && s.version===G.VERSION && s.rules===G.RULES && s.contentVersion===G.CONTENT_VERSION && !s.itemState && !Object.prototype.hasOwnProperty.call(JSON.parse(text),'contentVersion')) s.itemState=G.emptyItemState(s.stage,s.spin);
    G.validateState(s);
    return s;
  };
  G.decodeStorageRecord = function (text) {
    if (typeof text !== 'string' || text.length > 2 * MAX + 256) throw Error('Storage record too large');
    const record = JSON.parse(text);
    if (!record || !Object.prototype.hasOwnProperty.call(record, 'storageVersion')) return G.decode(text);
    if (record.storageVersion !== 1 || Object.keys(record).sort().join(',') !== 'current,previous,storageVersion' ||
        !record.current || (record.previous !== null && !record.previous)) throw Error('Invalid storage envelope');
    try { return G.decode(JSON.stringify(record.current)); }
    catch (error) {
      if (record.previous === null) throw error;
      return G.decode(JSON.stringify(record.previous));
    }
  };
  G.commitImport = function (storage, s) {
    const current = JSON.parse(G.encode(s));
    const old = storage.getItem(KEY);
    let previous = null;
    if (old) { try { previous = JSON.parse(G.encode(G.decodeStorageRecord(old))); } catch (e) { /* No valid previous state. */ } }
    const envelope = JSON.stringify({storageVersion: 1, current, previous});
    if (envelope.length > 2 * MAX + 256) throw Error('Storage envelope too large');
    storage.setItem(KEY, envelope);
    return {ok: true};
  };
  G.store = function (storage, s) {
    try {
      const text = G.encode(s), old = storage.getItem(KEY);
      if (old) {
        let previous = null;
        try { previous = G.encode(G.decodeStorageRecord(old)); } catch (e) { /* Preserve valid backup. */ }
        if (previous !== null) storage.setItem(BACK, previous);
      }
      storage.setItem(KEY, text);
      return {ok: true};
    } catch (e) { return {ok: false, error: 'Session-only save: ' + e.message}; }
  };
  G.load = function (storage) {
    try {
      const current = storage.getItem(KEY);
      if (current) {
        try { return {ok: true, state: G.decodeStorageRecord(current)}; }
        catch (e) {
          const backup = storage.getItem(BACK);
          if (backup) return {ok: true, state: G.decodeStorageRecord(backup), warning: 'Recovered backup'};
          throw e;
        }
      }
      const backup = storage.getItem(BACK);
      if (backup) return {ok: true, state: G.decodeStorageRecord(backup), warning: 'Recovered backup'};
      return {ok: false, error: 'No save'};
    } catch (e) { return {ok: false, error: 'Save unavailable: ' + e.message}; }
  };
})(window.Game);
