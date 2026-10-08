'use strict';
// Development proof only; no dependency or network access is added to the game.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const cp = require('node:child_process'), os = require('node:os'), crypto = require('node:crypto');
const {checkSuite, checkBody} = require('./route-g-evidence-check.js');
const root = path.resolve(__dirname, '..');
const edge = process.env.EDGE_EXE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = path.join(os.tmpdir(), 'route-g-http-' + crypto.randomUUID());
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' :
      file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8');
    res.end(data);
  });
});
function run(url, artifact) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(edge, ['--headless', '--disable-gpu', '--no-first-run',
      '--user-data-dir=' + profile, '--dump-dom', url]);
    let dom = '', stderr = '';
    child.stdout.on('data', data => dom += data);
    child.stderr.on('data', data => stderr += data);
    child.on('error', reject);
    child.on('close', code => {
      fs.writeFileSync(path.join(__dirname, artifact + '.html'), dom);
      fs.writeFileSync(path.join(__dirname, artifact + '-stderr.txt'), stderr);
      if (code !== 0) reject(Error('Edge exit=' + code));
      else resolve(dom);
    });
  });
}
server.listen(0, '127.0.0.1', async () => {
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    const suite = checkSuite(await run(origin + '/tests/index.html', 'route-g-http-suite'));
    checkBody(await run(origin + '/tests/ui-smoke.html', 'route-g-http-smoke'), 'data-smoke');
    const proof = {protocol: 'http', freshProfile: profile, checks: 2, suite, strictSmoke: true};
    fs.writeFileSync(path.join(__dirname, 'route-g-http-proof.json'), JSON.stringify(proof, null, 2));
    console.log(JSON.stringify(proof, null, 2));
  } catch (error) {
    console.error(error.stack);
    process.exitCode = 1;
  } finally { server.close(); }
});
