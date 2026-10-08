/* 独立 UI 偏好。绝不写入游戏存档字段。 */
(function (root) {
  'use strict';

  const KEYS = {
    tutorial: 'fog-port.ui.gdd1.tutorial',
    audio: 'fog-port.audio.v1',
    settings: 'fog-port.ui.gdd1.settings',
    discovery: 'fog-port.ui.gdd1.discovery',
    telemetry: 'fog-port.ui.gdd1.telemetry'
  };

  function read(key, fallback) {
    try {
      const raw = root.localStorage.getItem(key);
      if (raw == null || raw === '') return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      root.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function emptyDiscovery() {
    return { symbols: Object.create(null), items: Object.create(null), events: Object.create(null) };
  }

  function getDiscovery() {
    const v = read(KEYS.discovery, null);
    if (!v || typeof v !== 'object') return emptyDiscovery();
    return {
      symbols: v.symbols && typeof v.symbols === 'object' ? v.symbols : Object.create(null),
      items: v.items && typeof v.items === 'object' ? v.items : Object.create(null),
      events: v.events && typeof v.events === 'object' ? v.events : Object.create(null)
    };
  }

  function markDiscovery(kind, id) {
    if (!id) return;
    const d = getDiscovery();
    if (!d[kind]) return;
    d[kind][id] = true;
    write(KEYS.discovery, d);
  }

  function markState(state) {
    if (!state) return;
    // main.render calls this only for committed states (never import previews).
    // Reconcile immediately on load/import, before another spin can advance time.
    getTelemetry(state);
    const d = getDiscovery();
    const pool = state.pool || [];
    for (let i = 0; i < pool.length; i++) {
      if (pool[i] && pool[i].type) d.symbols[pool[i].type] = true;
    }
    const items = state.items || [];
    for (let i = 0; i < items.length; i++) d.items[items[i]] = true;
    const seen = state.events && state.events.seenIds || [];
    for (let i = 0; i < seen.length; i++) d.events[seen[i]] = true;
    const offer = state.offer;
    if (offer && offer.choices && offer.choices.length) {
      const bucket = offer.kind === 'item' ? d.items : d.symbols;
      if (offer.kind === 'symbol' || offer.kind === 'item') {
        for (let i = 0; i < offer.choices.length; i++) bucket[offer.choices[i]] = true;
      }
    }
    if (state.events && state.events.choice && state.events.choice.id) d.events[state.events.choice.id] = true;
    write(KEYS.discovery, d);
  }

  function known(kind, id) {
    const d = getDiscovery();
    return !!(d[kind] && d[kind][id]);
  }

  // Read against the current state on restore/import as well as before recording.
  // Truncation is persisted, so abandoned future rounds cannot return later.
  function getTelemetry(state) {
    const empty = { profile: state ? state.profile : '', seed: state ? state.seed : '', spins: [] };
    const raw = read(KEYS.telemetry, null);
    if (!raw || !Array.isArray(raw.spins)) return empty;
    if (state && (raw.profile !== state.profile || raw.seed !== state.seed)) return empty;
    const seen = new Set();
    const spins = raw.spins.filter(row => row && Number.isSafeInteger(row.spin) && row.spin > 0
      && Number.isFinite(row.total) && (!state || row.spin <= state.spin)
      && (!state || !Number.isSafeInteger(row.revision) || row.revision <= state.revision))
      .sort((a, b) => a.spin - b.spin).filter(row => {
        if (seen.has(row.spin)) return false;
        seen.add(row.spin); return true;
      }).slice(-70);
    const result = { profile: raw.profile, seed: raw.seed, spins: spins };
    if (state && JSON.stringify(result) !== JSON.stringify(raw)) write(KEYS.telemetry, result);
    return result;
  }

  function recordSpin(state) {
    if (!state || !state.last || !Number.isSafeInteger(state.spin) || state.spin < 1) return;
    const last = state.last;
    const spin = Number.isSafeInteger(last.spin) ? last.spin : state.spin;
    if (spin !== state.spin || !Number.isFinite(last.total)) return;
    const cur = getTelemetry(state);
    const types = Object.create(null), initialTypes = Object.create(null), sources = Object.create(null);
    const board = last.board || [], log = last.log || [];
    for (const c of (state.pool || []).concat(board)) if (c) sources[c.uid] = c.type;
    // Board is the final snapshot; first beforeType recovers cards transformed this round.
    for (const row of log) {
      const f = row.facts || {};
      if (row.target && f.beforeType && !initialTypes[row.target]) initialTypes[row.target] = f.beforeType;
    }
    for (const c of board) if (c && c.type) {
      const type = initialTypes[c.uid] || c.type;
      types[type] = (types[type] || 0) + 1;
      sources[c.uid] = type;
    }
    const contributions = Object.create(null);
    function add(source, amount) {
      if (!source || !Number.isFinite(amount)) return;
      const id = sources[source] || (/^u\d+$/.test(source) ? null : source);
      if (id) contributions[id] = (contributions[id] || 0) + amount;
    }
    for (const row of last.ledger || []) for (const part of row.contributions || []) add(part.source, part.amount);
    for (const row of log) if (row.action === 'reward') add(row.source, row.amount);
    const record = { spin: spin, revision: state.revision, total: last.total,
      pool: (state.pool || []).length, types: types, contributions: contributions };
    cur.spins = cur.spins.filter(row => row.spin < spin).concat([record]).slice(-70);
    write(KEYS.telemetry, cur);
  }

  function resetTelemetry() {
    write(KEYS.telemetry, { profile: '', seed: '', spins: [] });
  }

  root.GDD1PREFS = {
    getSettings: () => read(KEYS.settings, {}) || {},
    setSettings: patch => write(KEYS.settings, Object.assign({}, read(KEYS.settings, {}) || {}, patch)),
    KEYS: KEYS,
    read: read,
    write: write,
    getDiscovery: getDiscovery,
    markDiscovery: markDiscovery,
    markState: markState,
    known: known,
    recordSpin: recordSpin,
    resetTelemetry: resetTelemetry,
    getTelemetry: getTelemetry
  };
})(typeof window !== 'undefined' ? window : globalThis);
