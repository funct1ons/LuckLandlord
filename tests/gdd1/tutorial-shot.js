'use strict';
/**
 * Edge CDP check for the in-run skippable tutorial (GDD §10.3 six steps).
 *   node tests/gdd1/tutorial-shot.js
 * Uses its own user-data-dir inside the repo (tests/gdd1/tutorial-shots/_profile)
 * so no writes outside the workspace are needed.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const outDir = path.join(__dirname, 'tutorial-shots');
const profile = path.join(outDir, '_profile');
fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(profile, { recursive: true, force: true });
fs.mkdirSync(profile, { recursive: true });

const TUT_KEY = 'fog-port.ui.gdd1.tutorial';
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
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
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
    } catch { }
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
  const uiReady = () => evaluate("new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(window.GDD1UI&&window.GDD1TUTORIAL){clearInterval(timer);resolve(true)}else if(Date.now()-start>8000){clearInterval(timer);reject(Error('UI failed to initialize'))}},25)})");
  const waitPhase = phase => evaluate("new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{const s=GDD1UI.getState();if(s&&s.phase==='" + phase + "'){clearInterval(timer);resolve(true)}else if(Date.now()-start>8000){clearInterval(timer);reject(Error('phase timeout, now '+(s&&s.phase)))}},25)})");
  /* 演出期间 send() 仍在 busy，真实点击会被忽略；等到停轮再动手 */
  const waitIdle = () => evaluate("new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{const b=document.getElementById('board');if(b&&!b.classList.contains('is-rolling')){clearInterval(timer);setTimeout(()=>resolve(true),80)}else if(Date.now()-start>10000){clearInterval(timer);reject(Error('reels never stopped'))}},50)})");
  const reset = async () => {
    await evaluate('localStorage.clear();location.reload();true');
    await uiReady();
    await new Promise(r => setTimeout(r, 150));
  };
  const coach = () => evaluate(`({
    hidden: document.getElementById('coach').hidden,
    step: document.getElementById('coach').dataset.step || null,
    active: document.getElementById('coach').dataset.active || null,
    text: document.getElementById('coach').textContent,
    skipLabel: (document.querySelector('#coach button[data-op="coach-skip"]') || {}).textContent || null,
    storage: localStorage.getItem('${TUT_KEY}')
  })`);
  const shot = async name => {
    const png = await call('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(outDir, name), Buffer.from(png.data, 'base64'));
  };

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false
  }, sessionId);
  await call('Page.navigate', { url }, sessionId);
  await uiReady();
  await reset();

  /* 1. 欢迎门勾选框 */
  const door = await evaluate(`({
    choiceExists: !!document.getElementById('tutorial-choice'),
    choiceChecked: document.getElementById('tutorial-choice').checked,
    choiceLabel: document.querySelector('.welcome-tutorial') && document.querySelector('.welcome-tutorial').textContent,
    storage: localStorage.getItem('${TUT_KEY}'),
    coachHidden: document.getElementById('coach').hidden
  })`);
  assert.strictEqual(door.choiceExists, true, 'welcome door has tutorial checkbox');
  assert.strictEqual(door.choiceChecked, false, 'checkbox unchecked by default');
  assert.ok(door.choiceLabel.includes('本局不看教程'), door.choiceLabel);
  assert.strictEqual(door.storage, null, 'no tutorial key before start');
  assert.strictEqual(door.coachHidden, true, 'coach hidden on welcome');
  await shot('01-welcome-with-checkbox.png');

  /* 2. 开始完整模式 -> 教练第一步 */
  await evaluate("document.getElementById('start-full').click();true");
  await new Promise(r => setTimeout(r, 200));
  const step1 = await coach();
  const started = await evaluate('GDD1UI.getState()');
  assert.strictEqual(step1.hidden, false, 'coach visible after start-full');
  assert.strictEqual(step1.step, 'draw', 'first step is draw');
  assert.ok(step1.text.includes(String(started.pool.length)), 'body shows real pool size: ' + step1.text);
  assert.ok(step1.text.includes('20'), 'body mentions 20 cells');
  assert.strictEqual(step1.skipLabel.trim(), '跳过教程', 'skip button always visible');
  assert.ok(step1.text.includes('生产牌库'), 'player wording');
  await shot('02-step-draw.png');

  /* 3. 卡片不挡真实运行按钮：滚动后仍可点到，且不与运行 / 候选相交 */
  const blocking = await evaluate(`(()=>{
    const spin=document.querySelector('#decision button[data-op="spin"]');
    const c=document.getElementById('coach');
    if(!spin)return {err:'no spin button'};
    spin.scrollIntoView({block:'center'});
    const r=spin.getBoundingClientRect(), cr=c.getBoundingClientRect();
    const overlap=!(r.right<cr.left||r.left>cr.right||r.bottom<cr.top||r.top>cr.bottom);
    const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    const vw=innerWidth,vh=innerHeight;
    return {overlap, hitIsSpin:!!(hit&&hit.closest('button[data-op="spin"]')), rect:{w:cr.width,h:cr.height}, vw, vh,
      areaShare:(cr.width*cr.height)/(vw*vh)};
  })()`);
  assert.ok(!blocking.err, blocking.err);
  assert.strictEqual(blocking.overlap, false, '#coach must not overlap the run button: ' + JSON.stringify(blocking));
  assert.strictEqual(blocking.hitIsSpin, true, 'run button must stay clickable');
  assert.ok(blocking.areaShare < 0.3, 'coach card stays small: ' + JSON.stringify(blocking));

  /* 4. 点真实运行 -> 教练进入产出 / 待入账，数字与 pendingSettlement 一致 */
  await evaluate('document.querySelector(\'#decision button[data-op="spin"]\').click();true');
  await waitPhase('SYMBOL_CHOICE');
  await waitIdle();
  await new Promise(r => setTimeout(r, 150));
  const step2 = await coach();
  const afterSpin = await evaluate('GDD1UI.getState()');
  assert.strictEqual(afterSpin.spin, 1, 'exactly one spin happened (coach sent no command)');
  assert.ok(['output', 'choose'].includes(step2.step), 'advanced past draw, got ' + step2.step);
  assert.ok(step2.text.includes(String(afterSpin.pendingSettlement)), 'pending number matches state: ' + step2.text);
  assert.strictEqual(step2.storage, null, 'no key written while tutorial runs');
  /* 候选也不能被卡片挡住 */
  const candBlocking = await evaluate(`(()=>{
    const c=document.querySelector('#decision .choices button.choice'), card=document.getElementById('coach');
    if(!c)return {err:'no candidate'};
    c.scrollIntoView({block:'center'});
    const r=c.getBoundingClientRect(), cr=card.getBoundingClientRect();
    const overlap=!(r.right<cr.left||r.left>cr.right||r.bottom<cr.top||r.top>cr.bottom);
    const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    return {overlap, hitIsChoice:!!(hit&&hit.closest('#decision .choices button.choice'))};
  })()`);
  assert.ok(!candBlocking.err, candBlocking.err);
  assert.strictEqual(candBlocking.overlap, false, 'coach must not overlap candidates: ' + JSON.stringify(candBlocking));
  assert.strictEqual(candBlocking.hitIsChoice, true, 'candidates must stay clickable');
  await shot('03-step-output-pending.png');

  /* 5. 点跳过并入账：现金按待入账增加；相邻步要么点名真实连线，要么诚实说没有 */
  const beforeSkip = await evaluate('GDD1UI.getState()');
  await waitIdle();
  await evaluate('document.querySelector(\'#decision button[data-op="skip"]\').click();true');
  await new Promise(r => setTimeout(r, 250));
  const afterSkip = await evaluate('GDD1UI.getState()');
  assert.strictEqual(afterSkip.cash, beforeSkip.cash + beforeSkip.pendingSettlement, 'cash increased by pending');
  const step3 = await coach();
  assert.ok(['adjacency', 'payment', 'remove'].includes(step3.step), 'advanced after settle, got ' + step3.step);
  if (step3.step === 'adjacency') {
    const links = (afterSkip.last.log || []).filter(r =>
      (r.action === 'add' || r.action === 'multiply') && r.source && r.target && r.source !== r.target &&
      (afterSkip.last.board || []).some(c => c && c.uid === r.source) &&
      (afterSkip.last.board || []).some(c => c && c.uid === r.target));
    if (links.length) {
      const names = links.slice(0, 2).map(r => {
        const src = afterSkip.pool.find(x => x.uid === r.source);
        return src ? src.type : null;
      }).filter(Boolean);
      assert.ok(names.length > 0, 'link rows resolvable');
      assert.ok(/加值|产出|放大/.test(step3.text), 'names the real link: ' + step3.text);
    } else {
      assert.ok(step3.text.includes('本轮没有相邻加值'), 'honest no-link wording: ' + step3.text);
    }
    assert.ok(step3.text.includes('邻接包括上下、左右和斜角'), 'adjacency rule note present');
  }
  await shot('04-after-settle.png');

  /* 6. 六步走到底 -> 收工偏好 done（此刻无论停在哪一步都点得完） */
  for (let i = 0; i < 6 && (await coach()).hidden === false; i++) {
    const st = await coach();
    if (st.step === 'draw' || st.step === 'choose') break;   // 这两步只接真实对局操作，不硬点
    await evaluate('document.querySelector(\'#coach button[data-op="coach-next"]\').click();true');
    await new Promise(r => setTimeout(r, 60));
  }
  const finished = await coach();
  assert.strictEqual(finished.hidden, true, 'tutorial closes after the last step');
  assert.deepStrictEqual(JSON.parse(await evaluate("localStorage.getItem('" + TUT_KEY + "')")), { status: 'done' }, 'done preference persisted');
  await shot('05-tutorial-done.png');

  /* 7. 跳过教程 -> 独立键 skipped，且对局能继续 */
  await reset();
  await evaluate("document.getElementById('start-full').click();true");
  await new Promise(r => setTimeout(r, 200));
  assert.strictEqual((await coach()).hidden, false, 'coach starts again on a fresh run');
  await evaluate('document.querySelector(\'#coach button[data-op="coach-skip"]\').click();true');
  await new Promise(r => setTimeout(r, 100));
  const skipped = await coach();
  assert.strictEqual(skipped.hidden, true, 'coach closed after skip');
  assert.deepStrictEqual(JSON.parse(await evaluate("localStorage.getItem('" + TUT_KEY + "')")), { status: 'skipped' }, 'skipped preference persisted');
  await evaluate('document.querySelector(\'#decision button[data-op="spin"]\').click();true');
  await waitPhase('SYMBOL_CHOICE');
  await waitIdle();
  const afterContinue = await evaluate('GDD1UI.getState()');
  assert.strictEqual(afterContinue.spin, 1, 'game continues after tutorial skip');
  assert.deepStrictEqual(JSON.parse(await evaluate("localStorage.getItem('" + TUT_KEY + "')")), { status: 'skipped' }, 'skip preference unchanged by playing on');

  /* 8. 刷新先显示欢迎；主动继续后无教练 */
  await call('Page.reload', {}, sessionId);
  await uiReady();
  await new Promise(r => setTimeout(r, 150));
  const restored = await evaluate(`({
    welcomeOpen: document.body.classList.contains('welcome-open'),
    coach: document.getElementById('coach').hidden,
    profile: GDD1UI.getState() && GDD1UI.getState().profile,
    spin: GDD1UI.getState() && GDD1UI.getState().spin
  })`);
  assert.strictEqual(restored.welcomeOpen, true, 'reload always shows welcome');
  assert.strictEqual(restored.coach, true, 'welcome has no tutorial');
  assert.strictEqual(restored.profile, null);
  await evaluate("document.getElementById('welcome-continue-full').click();true");
  assert.strictEqual(await evaluate('GDD1UI.getState().profile'), 'full-v1');
  assert.strictEqual(await evaluate('GDD1UI.getState().spin'), 1);
  assert.strictEqual((await coach()).hidden, true, 'explicit continue does not restart tutorial');
  await shot('06-continue-no-coach.png');

  /* 9. 欢迎门勾「本局不看教程」-> 本局无教练且不写键 */
  await reset();
  await evaluate("document.getElementById('tutorial-choice').checked=true;true");
  await evaluate("document.getElementById('start-full').click();true");
  await new Promise(r => setTimeout(r, 200));
  const optedOut = await coach();
  assert.strictEqual(optedOut.hidden, true, 'checkbox suppresses the tutorial for this run');
  assert.strictEqual(optedOut.storage, null, 'opting out writes no preference');
  const optState = await evaluate('GDD1UI.getState()');
  assert.strictEqual(optState.profile, 'full-v1', 'run still starts');
  await shot('07-opt-out-no-coach.png');

  /* 10. 隐藏 #new（F2/F4 与 welcome-shot 会点）不开始教程 */
  await reset();
  await evaluate("document.getElementById('new').click();true");
  await new Promise(r => setTimeout(r, 200));
  const fromHiddenNew = await coach();
  const sliceState = await evaluate('GDD1UI.getState()');
  assert.strictEqual(fromHiddenNew.hidden, true, 'hidden #new must not start the tutorial');
  assert.strictEqual(fromHiddenNew.storage, null, 'hidden #new writes no preference');
  assert.strictEqual(sliceState.profile, 'slice-abd-v1');
  assert.strictEqual(sliceState.pool.length, 12);

  /* 11. 顶栏「开场」中途撤回教练 */
  await reset();
  await evaluate("document.getElementById('start-slice').click();true");
  await new Promise(r => setTimeout(r, 150));
  assert.strictEqual((await coach()).hidden, false, 'slice start also begins the tutorial');
  const sliceCoach = await coach();
  assert.strictEqual(sliceCoach.step, 'draw');
  assert.ok(sliceCoach.text.includes('12'), 'slice pool number is real: ' + sliceCoach.text);
  await evaluate("document.getElementById('menu').click();true");
  await new Promise(r => setTimeout(r, 150));
  const backToDoor = await evaluate(`({
    coach: document.getElementById('coach').hidden,
    welcomeOpen: document.body.classList.contains('welcome-open'),
    storage: localStorage.getItem('${TUT_KEY}')
  })`);
  assert.strictEqual(backToDoor.coach, true, '开场 aborts the tutorial');
  assert.strictEqual(backToDoor.welcomeOpen, true);
  assert.strictEqual(backToDoor.storage, null, 'abort writes no preference');

  /* 12. 已看过（done）时欢迎门显示「再看一轮教程」，勾了才重看 */
  await evaluate("localStorage.setItem('" + TUT_KEY + "',JSON.stringify({status:'done'}));true");
  await evaluate("document.getElementById('menu').click();true");
  await new Promise(r => setTimeout(r, 150));
  const replayLabel = await evaluate("document.querySelector('.welcome-tutorial') && document.querySelector('.welcome-tutorial').textContent");
  assert.ok(replayLabel.includes('再看一轮教程'), replayLabel);
  await evaluate("document.getElementById('start-slice').click();true");
  await new Promise(r => setTimeout(r, 200));
  assert.strictEqual((await coach()).hidden, true, 'seen tutorial does not replay unasked');
  await evaluate("document.getElementById('menu').click();true");
  await new Promise(r => setTimeout(r, 150));
  await evaluate("document.getElementById('tutorial-choice').checked=true;true");
  await evaluate("document.getElementById('start-slice').click();true");
  await new Promise(r => setTimeout(r, 200));
  const replay = await coach();
  assert.strictEqual(replay.hidden, false, 'checked replay runs the tutorial again');
  assert.strictEqual(replay.step, 'draw');
  await shot('08-replay.png');

  console.log('PASS tutorial: 6 steps on real results, skip, opt-out, hidden #new, restore, replay');
  console.log('shots ' + outDir);
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
}).finally(async () => {
  if (ws && ws.readyState === 1) {
    try { await call('Browser.close'); } catch { }
    ws.close();
  }
  if (browser && !browser.killed) browser.kill();
  if (server) await new Promise(r => server.close(r));
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { }
});
