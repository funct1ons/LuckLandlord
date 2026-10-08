'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const assert = require('assert');
const root = path.resolve(__dirname, '../..');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const htmlDest = path.join(__dirname, 'f4-grok-audit-edge-v1-prod.html');
const resultsDest = path.join(__dirname, 'f4-grok-audit-edge-v1-results.json');
const nodeDest = path.join(__dirname, process.argv[2] || 'f4-grok-audit-semantic-v1-current-results.json');
if (!/^f4-grok-audit-[\w.-]+\.json$/.test(path.basename(nodeDest))) throw Error('Unsafe node dest ' + nodeDest);
for (const p of [htmlDest, resultsDest]) if (fs.existsSync(p)) throw Error('Refuse existing output ' + p);
if (!fs.existsSync(nodeDest)) throw Error('Node 32 results missing; run semantic v1 first');
const compact = r => ({
  total: r.total,
  passed: r.passed,
  cases: r.cases.map(c => {
    const last = c.actual && c.actual.last;
    return {
      name: c.name,
      ok: c.ok,
      error: c.error || null,
      expected: c.expected,
      total: last ? last.total : null,
      reward: last ? last.reward : null,
      ledger: last && last.ledger ? last.ledger.map(x => ({ uid: x.uid, type: x.type, amount: x.amount, alive: x.alive })) : null,
      log: last && last.log ? last.log.map(e => ({ action: e.action, source: e.source, target: e.target, phase: e.phase, amount: e.amount })) : null
    };
  })
});
const nodeCompact = compact(JSON.parse(fs.readFileSync(nodeDest, 'utf8')));
let src = fs.readFileSync(path.join(__dirname, 'f4-audit-semantic-v3.js'), 'utf8');
src = src.replace(
  "'5.G/6: copper2+reader3 no carbon', [['copper_burr',0],['offset_reader',1]],5",
  "'5.B/5.G/6: copper2+machine-neighbor2+reader3, no carbon', [['copper_burr',0],['offset_reader',1]],7"
);
src = src.replace(/if\(typeof module!=='undefined'&&module.exports\)module.exports=globalThis.runF4IndependentV3;/, '');
const inline = name => {
  const body = fs.readFileSync(path.join(root, 'js/gdd1', name + '.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
  return '<script>\n' + body + '\n</script>';
};
const scripts = ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller'].map(inline).join('');
const html = '<!doctype html><html><head><meta charset="utf-8"><title>f4-grok-audit-edge-v1</title></head><body>' +
  scripts +
  '<div id="ready">production</div></body></html>';
const harness = src + `
function __compact(r) {
  return {
    total: r.total,
    passed: r.passed,
    cases: r.cases.map(function(c) {
      var last = c.actual && c.actual.last;
      return {
        name: c.name,
        ok: c.ok,
        error: c.error || null,
        expected: c.expected,
        total: last ? last.total : null,
        reward: last ? last.reward : null,
        ledger: last && last.ledger ? last.ledger.map(function(x) { return { uid: x.uid, type: x.type, amount: x.amount, alive: x.alive }; }) : null,
        log: last && last.log ? last.log.map(function(e) { return { action: e.action, source: e.source, target: e.target, phase: e.phase, amount: e.amount }; }) : null
      };
    })
  };
}
window.__f4GrokAudit = function() { return __compact(runF4IndependentV3()); };
true;
`;
fs.writeFileSync(htmlDest, html, { flag: 'wx' });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f4-grok-audit-edge-'));
let browser, ws, server;
const pending = new Map();
let seq = 0;
async function call(method, params, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout ' + method)); }, 20000);
    pending.set(id, { resolve: v => { clearTimeout(timeout); resolve(v); }, reject: e => { clearTimeout(timeout); reject(e); } });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
async function callLong(method, params, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout ' + method)); }, 120000);
    pending.set(id, { resolve: v => { clearTimeout(timeout); resolve(v); }, reject: e => { clearTimeout(timeout); reject(e); } });
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
  browser = spawn(edge, ['--headless', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  const deadline = Date.now() + 20000;
  let port;
  while (Date.now() < deadline) {
    try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n'); break; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert(port, 'Edge did not publish CDP endpoint');
  ws = new WebSocket('ws://127.0.0.1:' + port[0] + port[1]);
  await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  ws.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      data.error ? p.reject(Error(JSON.stringify(data.error))) : p.resolve(data.result);
    }
  });
  const fileUrl = 'file:///' + htmlDest.replace(/\\/g, '/');
  const httpUrl = 'http://127.0.0.1:' + server.address().port + '/tests/gdd1/f4-grok-audit-edge-v1-prod.html';
  const routes = {};
  for (const [route, url] of [['file', fileUrl], ['http', httpUrl]]) {
    const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    await call('Page.enable', {}, sessionId);
    await call('Runtime.enable', {}, sessionId);
    await call('Page.navigate', { url }, sessionId);
    const evaluate = async (expression, long) => {
      const r = await (long ? callLong : call)('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };
    const ready = await evaluate("new Promise(resolve=>{const start=Date.now(),t=setInterval(()=>{if(window.GDD1&&window.GDD1.sliceResolve&&window.GDD1.fullNewRun){clearInterval(t);resolve({ok:true})}else if(Date.now()-start>12000){clearInterval(t);resolve({ok:false,href:location.href,scripts:document.scripts.length,gdd:typeof window.GDD1})}},25)})");
    if (!ready || !ready.ok) throw Error('edge production failed to initialize ' + JSON.stringify(ready));
    const injected = await evaluate(harness, true);
    assert.strictEqual(injected, true);
    const live = await evaluate('window.__f4GrokAudit()', true);
    routes[route] = live;
    await call('Target.closeTarget', { targetId });
  }
  const fileJson = JSON.stringify(routes.file);
  const httpJson = JSON.stringify(routes.http);
  const nodeJson = JSON.stringify(nodeCompact);
  const fileEqHttp = fileJson === httpJson;
  const fileEqNode = fileJson === nodeJson;
  const httpEqNode = httpJson === nodeJson;
  const mismatches = [];
  if (!fileEqHttp || !fileEqNode || !httpEqNode) {
    const names = nodeCompact.cases.map(c => c.name);
    for (const name of names) {
      const n = nodeCompact.cases.find(c => c.name === name);
      const f = routes.file.cases.find(c => c.name === name);
      const h = routes.http.cases.find(c => c.name === name);
      if (JSON.stringify(n) !== JSON.stringify(f) || JSON.stringify(n) !== JSON.stringify(h) || JSON.stringify(f) !== JSON.stringify(h)) {
        mismatches.push({ name, nodeOk: n && n.ok, fileOk: f && f.ok, httpOk: h && h.ok, nodeTotal: n && n.total, fileTotal: f && f.total, httpTotal: h && h.total });
      }
    }
  }
  const report = {
    scope: 'Independent 32 fixtures Edge file:// AND HTTP vs Node compact; old 22 implementer parity is not this oracle',
    browser: 'Edge',
    chromeClaimed: false,
    node: { total: nodeCompact.total, passed: nodeCompact.passed },
    file: { total: routes.file.total, passed: routes.file.passed },
    http: { total: routes.http.total, passed: routes.http.passed },
    fileEqHttp,
    fileEqNode,
    httpEqNode,
    mismatches,
    cases: nodeCompact.cases.map(n => {
      const f = routes.file.cases.find(c => c.name === n.name);
      const h = routes.http.cases.find(c => c.name === n.name);
      return { name: n.name, node: n.ok, file: f && f.ok, http: h && h.ok, equal: JSON.stringify(n) === JSON.stringify(f) && JSON.stringify(n) === JSON.stringify(h) };
    })
  };
  report.ok = fileEqHttp && fileEqNode && httpEqNode && nodeCompact.passed === 32 && routes.file.passed === 32 && routes.http.passed === 32;
  fs.writeFileSync(resultsDest, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-audit-edge-v1-results.json', ok: report.ok, fileEqHttp, fileEqNode, httpEqNode, node: [nodeCompact.passed, nodeCompact.total], file: [routes.file.passed, routes.file.total], http: [routes.http.passed, routes.http.total], mismatches }, null, 2));
  if (!report.ok) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => {
  if (ws && ws.readyState === 1) { try { await call('Browser.close'); } catch {} ws.close(); }
  if (browser && !browser.killed) browser.kill();
  if (server) await new Promise(r => server.close(r));
});
