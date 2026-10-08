/* Run: node tests/tools/settings-keys.js */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function load(ctx, name) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/gdd1UI', name + '.js'), 'utf8'), ctx);
}
function harness(raw) {
  const writes = [], handlers = [], audio = {}, animation = {}, properties = new Map();
  let top = null, closes = 0, mandatory = false, running = false, skipped = 0, tutorial = false, confirm = false;
  const doc = { hidden: false, documentElement: { style: {
    getPropertyValue: key => properties.get(key) || '', getPropertyPriority: () => '',
    setProperty: (key, value) => properties.set(key, value), removeProperty: key => properties.delete(key)
  }, classList: { toggle() {} } }, getElementById: () => null,
    addEventListener: (type, fn) => handlers.push(fn), removeEventListener: (type, fn) => handlers.splice(handlers.indexOf(fn), 1) };
  const ctx = vm.createContext({ document: doc, localStorage: {
    getItem: () => raw || null, setItem: (key, value) => writes.push([key, JSON.parse(value)])
  }, SFX: { setMaster: v => audio.master = v, setVolume: v => audio.sfx = v,
    setMusicVolume: v => audio.music = v, unlock() {} },
  ANIM: { setSpeed: v => animation.speed = v, setReducedMotion: v => animation.reduced = v,
    setShake: v => animation.shake = v, isRunning: () => running, skip: () => skipped++ },
  GDD1TUTORIAL: { isActive: () => tutorial }, GDD1CONFIRM: { isOpen: () => confirm },
  GDD1OVERLAY: { top: () => top, closeTop() { if (!mandatory) { top = null; closes++; } },
    isOpen: () => false, layer: () => ({ querySelector: () => ({ hidden: mandatory }) }),
    open: (id, options) => ({ id, options }) }
  });
  return { ctx, writes, audio, animation, properties, handlers,
    top(value, required = false) { top = value; mandatory = required; },
    tutorial(value) { tutorial = value; }, confirm(value) { confirm = value; },
    running(value) { running = value; }, closes: () => closes, skipped: () => skipped,
    press(key, extra = {}) {
      const event = Object.assign({ key, target: { closest: () => null }, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; } }, extra);
      handlers.slice().forEach(fn => fn(event)); return event;
    }
  };
}
(async function () {
  const fresh=harness();load(fresh.ctx,'settings');
  assert.equal(fresh.ctx.GDD1SETTINGS.get().musicVolume,0.2,'fresh preferences enable music');
  const muted=harness('{"musicVolume":0}');load(muted.ctx,'settings');
  assert.equal(muted.audio.music,0,'explicit saved mute is preserved');
  const h = harness('{"masterVolume":2,"sfxVolume":-1,"musicVolume":"bad","speed":"bad","autosave":false,"extra":42}');
  load(h.ctx, 'prefs'); load(h.ctx, 'settings');
  const settings = h.ctx.GDD1SETTINGS;
  assert.equal(h.audio.master, 1); assert.equal(h.audio.sfx, 0); assert.equal(h.audio.music, 0.2);
  assert.equal(h.animation.speed, 'normal'); assert.equal(settings.get().autosave, false);
  assert.equal(h.writes.length, 0, 'loading preferences does not write storage');
  h.properties.set('--paper', 'original');
  let notifications = 0;
  const off = settings.subscribe(() => notifications++);
  assert.equal(settings.set({ highContrast: true, speed: 'fast', reducedMotion: true, shake: false }), true);
  assert.equal(h.properties.get('--paper'), '#ffffff'); assert.equal(h.animation.speed, 'fast');
  assert.equal(h.animation.reduced, true); assert.equal(h.animation.shake, false);
  const snapshot = settings.get(); snapshot.autosave = true;
  assert.equal(settings.get().autosave, false, 'get returns a copy');
  settings.set({ highContrast: false });
  assert.equal(h.properties.get('--paper'), 'original'); assert.equal(notifications, 2);
  off(); settings.set({ musicVolume: 0.3 }); assert.equal(notifications, 2);
  assert.ok(h.writes.every(([key]) => key === 'fog-port.ui.gdd1.settings'));
  assert.equal(h.writes[0][1].extra, undefined);
  const view = settings.open();
  for (const name of Object.keys(settings.defaults)) assert.ok(view.options.html.includes('data-setting="' + name + '"'));
  assert.ok(view.options.html.includes('本地保存与导入'));
  h.top('required', true); assert.equal(settings.open(), null); h.top(null);
  h.ctx.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(settings.set({ masterVolume: 0.4 }), false); assert.equal(h.audio.master, 0.4);

  load(h.ctx, 'keys');
  const commands = [];
  let state = { phase: 'READY', revision: 1, pool: [], rerollTokens: 1,
    offer: { choices: ['a', 'b', 'c'], choiceRefreshesUsed: 0, windowId: 'w', guarantees: {} } };
  const config = { getState: () => state, send: (op, extra) => commands.push([op, extra]) };
  const keys = h.ctx.GDD1KEYS;
  const dispose = keys.install(config);
  h.press(' '); assert.equal(commands.at(-1)[0], 'spin');
  state.phase = 'SYMBOL_CHOICE';
  h.press('2'); assert.equal(commands.at(-1)[0], 'choose'); assert.equal(commands.at(-1)[1].id, 'b');
  h.press(' '); assert.equal(commands.at(-1)[0], 'skip');
  h.press('s'); assert.equal(commands.at(-1)[0], 'skip');
  h.press('r'); assert.equal(commands.at(-1)[0], 'reroll');
  state.phase = 'ITEM_CHOICE';
  h.press('3'); assert.equal(commands.at(-1)[0], 'item'); assert.equal(commands.at(-1)[1].id, 'c');
  h.press(' '); assert.equal(commands.at(-1)[0], 'skipItem');
  h.press('s'); assert.equal(commands.at(-1)[0], 'skipItem');
  let count = commands.length;
  h.press('1', { repeat: true }); h.press('1', { ctrlKey: true }); h.press('1', { isComposing: true });
  h.press('1', { target: { closest: () => ({}) } });
  h.tutorial(true); h.press('1'); h.tutorial(false);
  h.confirm(true); h.press('1'); h.confirm(false);
  h.top('required', true); h.press('1'); h.press(' '); h.press('Escape'); assert.equal(h.closes(), 0);
  h.top('details'); h.press('1'); assert.equal(h.press('Escape').stopped, true); assert.equal(h.closes(), 1);
  state.phase = 'EVENT_CHOICE'; h.press('1'); h.press(' '); h.press('s'); h.press('r');
  state.phase = 'WON'; h.press(' ');
  assert.equal(commands.length, count, 'protected contexts never dispatch');
  state.phase = 'SYMBOL_CHOICE'; h.running(true); h.press(' '); h.press('1');
  assert.equal(h.skipped(), 1); assert.equal(commands.length, count); h.running(false);
  state.pool = Array(200); h.press('1'); state.pool = [];
  state.rerollTokens = 0; h.press('r'); state.rerollTokens = 1;
  state.offer.choiceRefreshesUsed = 3; h.press('r'); state.offer.choiceRefreshesUsed = 0;
  assert.equal(commands.length, count);
  let answer;
  h.ctx.GDD1CONFIRM.ask = () => new Promise(resolve => { answer = resolve; });
  state.offer.guarantees.applied = true;
  h.press('r'); h.press('r'); state.revision++; answer(true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(commands.length, count, 'stale confirmation cannot reroll');
  h.press('r'); answer(true); await new Promise(resolve => setImmediate(resolve));
  assert.equal(commands.length, ++count);
  const dispose2 = keys.install(config); dispose(); assert.equal(h.handlers.length, 1);
  h.press('r'); dispose2(); answer(true); await new Promise(resolve => setImmediate(resolve));
  assert.equal(commands.length, count, 'uninstalled pending confirmation cannot dispatch');
  assert.equal(h.handlers.length, 0);
  console.log('settings-keys: preference isolation, API application, controls, shortcuts, modal guards and confirmation lifecycle passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
