// 独立生命周期测试：node tests/tools/audio-lifecycle.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../js/gdd1UI/audio.js'), 'utf8');
function environment(fail) {
  const events = {}, nodes = [], sources = [];
  let created = 0;
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  function node(extra = {}) {
    const n = Object.assign({ disconnected: false, connect() {}, disconnect() { this.disconnected = true; } }, extra);
    nodes.push(n); return n;
  }
  function src(extra) {
    const n = node(Object.assign({ start() { this.started = true; }, stop() { this.stopped = true; }, onended: null }, extra));
    sources.push(n); return n;
  }
  const context = {
    state: 'running', currentTime: 0, sampleRate: 22050, destination: {},
    resume() { this.state = 'running'; return Promise.resolve(); },
    suspend() { this.state = 'suspended'; return Promise.resolve(); },
    close() { this.state = 'closed'; return Promise.resolve(); },
    createGain() { return node({ gain: param() }); },
    createOscillator() { return src({ frequency: param() }); },
    createBufferSource() { return src({}); },
    createBiquadFilter() { return node({ frequency: param(), Q: param() }); },
    createBuffer(ch, len) { const data = new Float32Array(len); return { getChannelData: () => data }; }
  };
  const document = { hidden: false, addEventListener(n, fn) { events[n] = fn; }, removeEventListener(n) { delete events[n]; } };
  const window = { document, AudioContext: function () { created++; if (fail) throw Error('blocked'); return context; } };
  vm.runInNewContext(source, { window, console, Math: Object.assign(Object.create(Math), { random() { throw Error('shared RNG'); } }) });
  return { s: window.SFX, events, document, context, nodes, sources, created: () => created };
}
(async () => {
  const defaults = environment();
  assert.equal(defaults.created(),0);
  defaults.events.pointerdown({isTrusted:true});
  assert.equal(defaults.sources.filter(n=>n.loop&&!n.stopped).length,1,'default music starts on first gesture');
  defaults.s.dispose();
  const e = environment(), s = e.s;
  assert.equal(s.getMaster(), 0.7); assert.equal(s.getVolume(), 0.65); assert.equal(s.getMusicVolume(), 0.2);
  s.setMusicVolume(0.5); s.play.spin(); assert.equal(e.created(), 0);
  e.events.pointerdown({ isTrusted: false }); assert.equal(e.created(), 0);
  s.setEnabled(false); s.unlock(); assert.equal(e.created(), 0);
  s.setEnabled(true); s.unlock(); assert.equal(e.created(), 1);
  assert.equal(e.sources.filter(n => n.loop && !n.stopped).length, 1);
  const data = e.sources[0].buffer.getChannelData(0);
  assert(data.some(v => Math.abs(v) > 0.01)); assert(data.every(v => Number.isFinite(v) && Math.abs(v) < 0.2));
  assert(Math.abs(data[0] - data[data.length - 1]) < 0.002);
  s.setMusicVolume(0.8); assert.equal(e.sources.length, 1);
  s.play.victory(); s.play.spin();
  assert.equal(e.sources.filter(n => !n.loop && !n.disconnected).length, 8);
  for (const n of e.sources.filter(n => !n.loop)) if (n.onended) n.onended();
  assert(e.sources.filter(n => !n.loop).every(n => n.disconnected));
  for (const name of s.names()) {
    const before = e.sources.length; s.play[name](2); assert(e.sources.length > before, name);
    for (const n of e.sources.slice(before)) if (n.onended) n.onended();
  }
  s.setVolume(0); const count = e.nodes.length; s.play.spin(); assert.equal(e.nodes.length, count);
  assert.equal(s.getMusicVolume(), 0.8);
  e.document.hidden = true; e.events.visibilitychange(); assert.equal(e.context.state, 'suspended');
  assert(e.sources.every(n => n.stopped || n.disconnected));
  e.document.hidden = false; e.events.visibilitychange(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(e.sources.filter(n => n.loop && !n.stopped).length, 1);
  s.setMaster(0); assert.equal(e.context.state, 'suspended');
  s.setMusicVolume(1); assert.equal(e.context.state, 'suspended');
  s.dispose(); assert(e.nodes.every(n => n.disconnected)); assert.equal(Object.keys(e.events).length, 0);
  const bad = environment(true); bad.s.unlock(); bad.s.play.spin(); assert.equal(bad.s.isSupported(), false);
  bad.s.unlock(); assert.equal(bad.created(), 1);
  console.log('PASS audio lifecycle: gesture, defaults, buses, loop, RNG isolation, voices, mute, visibility, cleanup, failure');
})().catch(error => { console.error(error); process.exitCode = 1; });
