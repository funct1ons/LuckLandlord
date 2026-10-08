'use strict';
/**
 * Edge CDP check for the no-save welcome door. Does not replace F2/F4.
 *   node tests/gdd1/welcome-shot.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'welcome-shot-'));
const outDir = path.join(__dirname, 'welcome-shots');
fs.mkdirSync(outDir, { recursive: true });

let browser, ws, server;
const pending = new Map();
let seq = 0;

async function call(method, params, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(Error('CDP timeout ' + method));
    }, 20000);
    pending.set(id, {
      resolve: v => { clearTimeout(timeout); resolve(v); },
      reject: e => { clearTimeout(timeout); reject(e); }
    });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

(async () => {
  server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (e, b) => {
      if (e) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(b);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + server.address().port + '/gdd1.html';
  assert(fs.existsSync(edge), 'Edge not found: ' + edge);
  browser = spawn(edge, [
    '--headless', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: 'ignore' });

  const deadline = Date.now() + 20000;
  let port;
  while (Date.now() < deadline) {
    try {
      port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n');
      break;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert(port, 'Edge did not publish CDP endpoint');
  ws = new WebSocket('ws://127.0.0.1:' + port[0] + port[1]);
  await new Promise((r, j) => {
    ws.addEventListener('open', r, { once: true });
    ws.addEventListener('error', j, { once: true });
  });
  ws.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      data.error ? p.reject(Error(JSON.stringify(data.error))) : p.resolve(data.result);
    }
  });

  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  await call('Page.enable', {}, sessionId);
  await call('Runtime.enable', {}, sessionId);
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.confirm=()=>true;'
  }, sessionId);

  const evaluate = async expression => {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const uiReady = () => evaluate("new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(window.GDD1UI){clearInterval(timer);resolve(true)}else if(Date.now()-start>8000){clearInterval(timer);reject(Error('UI failed to initialize'))}},25)})");

  const shot = async name => {
    const png = await call('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(outDir, name), Buffer.from(png.data, 'base64'));
  };

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false
  }, sessionId);
  await call('Page.navigate', { url }, sessionId);
  await uiReady();
  await evaluate('localStorage.clear();location.reload();true');
  await uiReady();
  await new Promise(r => setTimeout(r, 200));

  const door = await evaluate(`({
    welcomeOpen: document.body.classList.contains('welcome-open'),
    welcomeHidden: document.getElementById('welcome').hidden,
    startFull: !!document.getElementById('start-full'),
    startSlice: !!document.getElementById('start-slice'),
    title: document.querySelector('#welcome h1') && document.querySelector('#welcome h1').textContent,
    tagline: document.querySelector('.welcome-tagline') && document.querySelector('.welcome-tagline').textContent,
    story: document.querySelector('.welcome-story') && document.querySelector('.welcome-story').textContent,
    settle: document.querySelector('.welcome-settle') && document.querySelector('.welcome-settle').textContent,
    headerDisplay: getComputedStyle(document.querySelector('header')).display,
    mainDisplay: getComputedStyle(document.querySelector('main')).display,
    newExists: !!document.getElementById('new'),
    newFullExists: !!document.getElementById('new-full'),
    continueFullDisabled: document.getElementById('welcome-continue-full').disabled,
    continueSliceDisabled: document.getElementById('welcome-continue-slice').disabled,
    continueFullMeta: document.querySelectorAll('.welcome-continue-meta')[0].textContent,
    state: GDD1UI.getState()
  })`);
  assert.strictEqual(door.welcomeOpen, true, 'welcome-open on no-save');
  assert.strictEqual(door.welcomeHidden, false, 'welcome visible');
  assert.strictEqual(door.startFull, true);
  assert.strictEqual(door.startSlice, true);
  assert.strictEqual(door.title, '雾港回收工坊');
  assert.ok(door.tagline.includes('组合赚钱'), door.tagline);
  assert.ok(door.story.includes('雾港'), door.story);
  assert.ok(door.settle.includes('待入账'), door.settle);
  assert.strictEqual(door.headerDisplay, 'none');
  assert.strictEqual(door.mainDisplay, 'none');
  assert.strictEqual(door.newExists, true, 'hidden #new still in DOM');
  assert.strictEqual(door.newFullExists, true);
  assert.strictEqual(door.continueFullDisabled, true);
  assert.strictEqual(door.continueSliceDisabled, true);
  assert.ok(door.continueFullMeta.includes('没有完整模式存档'), door.continueFullMeta);
  assert.strictEqual(door.state, null);
  await shot('01-welcome-1280.png');

  await call('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true
  }, sessionId);
  await new Promise(r => setTimeout(r, 150));
  await shot('02-welcome-390.png');

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false
  }, sessionId);

  await evaluate("document.getElementById('start-full').click();true");
  await new Promise(r => setTimeout(r, 150));
  const started = await evaluate(`({
    welcomeOpen: document.body.classList.contains('welcome-open'),
    welcomeHidden: document.getElementById('welcome').hidden,
    headerDisplay: getComputedStyle(document.querySelector('header')).display,
    profile: GDD1UI.getState() && GDD1UI.getState().profile,
    pool: GDD1UI.getState() && GDD1UI.getState().pool.length,
    stats: document.getElementById('stats').children.length
  })`);
  assert.strictEqual(started.welcomeOpen, false);
  assert.strictEqual(started.welcomeHidden, true);
  assert.notStrictEqual(started.headerDisplay, 'none');
  assert.strictEqual(started.profile, 'full-v1');
  assert.strictEqual(started.pool, 12);
  assert.ok(started.stats > 0);
  await shot('03-after-start-full.png');

  await evaluate("document.getElementById('save').click();true");
  const saved = await evaluate('GDD1UI.getState()');
  await call('Page.reload', {}, sessionId);
  await uiReady();
  const restored = await evaluate(`({
    welcomeOpen: document.body.classList.contains('welcome-open'),
    welcomeHidden: document.getElementById('welcome').hidden,
    profile: GDD1UI.getState() && GDD1UI.getState().profile,
    pool: GDD1UI.getState() && GDD1UI.getState().pool.length,
    spin: GDD1UI.getState() && GDD1UI.getState().spin
  })`);
  assert.strictEqual(restored.welcomeOpen, true, 'saved games must also start at welcome');
  assert.strictEqual(restored.welcomeHidden, false);
  assert.strictEqual(restored.profile, null);
  assert.strictEqual(await evaluate("document.getElementById('welcome-continue-full').disabled"), false);
  assert.deepStrictEqual(await evaluate("GDD1.load(localStorage,'full-v1').state"), saved, 'startup preserves save');
  await shot('04-welcome-with-save.png');
  await evaluate("document.getElementById('welcome-continue-full').click();true");
  assert.deepStrictEqual(await evaluate('GDD1UI.getState()'), saved, 'continue restores exact saved state');

  await evaluate("document.getElementById('menu').click();true");
  await new Promise(r => setTimeout(r, 150));
  const fromMenu = await evaluate(`({
    welcomeOpen: document.body.classList.contains('welcome-open'),
    headerDisplay: getComputedStyle(document.querySelector('header')).display,
    continueFullDisabled: document.getElementById('welcome-continue-full').disabled,
    continueMeta: document.querySelectorAll('.welcome-continue-meta')[0].textContent,
    state: GDD1UI.getState()
  })`);
  assert.strictEqual(fromMenu.welcomeOpen, true, '开场 returns to welcome without deleting save');
  assert.strictEqual(fromMenu.headerDisplay, 'none');
  assert.strictEqual(fromMenu.continueFullDisabled, false);
  assert.ok(/第 \d+\/10/.test(fromMenu.continueMeta), fromMenu.continueMeta);
  assert.strictEqual(fromMenu.state, null);
  await shot('05-menu-with-save.png');
  await evaluate("document.getElementById('welcome-continue-full').click();true");
  await new Promise(r => setTimeout(r, 150));
  const continued = await evaluate('GDD1UI.getState()');
  assert.strictEqual(continued.profile, saved.profile);
  assert.strictEqual(continued.spin, saved.spin);

  await evaluate('localStorage.clear();location.reload();true');
  await uiReady();
  await evaluate("document.getElementById('new').click();true");
  await new Promise(r => setTimeout(r, 150));
  const fromHiddenNew = await evaluate(`({
    welcomeOpen: document.body.classList.contains('welcome-open'),
    profile: GDD1UI.getState() && GDD1UI.getState().profile,
    pool: GDD1UI.getState() && GDD1UI.getState().pool.length
  })`);
  assert.strictEqual(fromHiddenNew.welcomeOpen, false);
  assert.strictEqual(fromHiddenNew.profile, 'slice-abd-v1');
  assert.strictEqual(fromHiddenNew.pool, 12);
  const sliceSaved=await evaluate('GDD1UI.getState()');
  await call('Page.reload', {}, sessionId);await uiReady();
  assert.strictEqual(await evaluate('GDD1UI.getState()'),null);
  assert.strictEqual(await evaluate("document.getElementById('welcome').hidden"),false);
  assert.strictEqual(await evaluate("document.getElementById('welcome-continue-slice').disabled"),false);
  await evaluate("document.getElementById('welcome-continue-slice').click()");
  assert.deepStrictEqual(await evaluate('GDD1UI.getState()'),sliceSaved);

  console.log('PASS welcome on every startup, explicit continue, start-full, hidden #new');
  console.log('shots ' + outDir);
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
}).finally(async () => {
  if (ws && ws.readyState === 1) {
    try { await call('Browser.close'); } catch {}
    ws.close();
  }
  if (browser && !browser.killed) browser.kill();
  if (server) await new Promise(r => server.close(r));
});
