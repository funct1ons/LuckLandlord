'use strict';
const fs = require('node:fs'), path = require('node:path');
const node = JSON.parse(fs.readFileSync(path.join(__dirname, 'suite-manifest.json'), 'utf8'));
function requirePass(condition, message) {
  if (!condition) throw Error(message);
}
function checkSuite(dom) {
  const body = /<body\b[^>]*>/.exec(dom);
  requirePass(body && /data-result="pass"/.test(body[0]), 'Suite body must strictly say pass');
  const match = /<script id="suite-manifest" type="application\/json">([\s\S]*?)<\/script>/.exec(dom);
  requirePass(match, 'Missing browser machine manifest');
  const browser = JSON.parse(match[1]);
  requirePass(browser.failed === 0 && browser.total === node.total && browser.passed === node.passed,
    'Browser/Node pass counts differ');
  requirePass(browser.baseline.expected === 357 && browser.baseline.total === 357 && browser.baseline.passed === 357,
    'Browser lost old 357 cases');
  requirePass(JSON.stringify(browser.suites) === JSON.stringify(node.suites), 'Browser/Node suite counts differ');
  requirePass(JSON.stringify(browser.cases) === JSON.stringify(node.cases), 'Browser/Node case names or results differ');
  return {total: browser.total, routeG: browser.suites.routeG, baseline: 357, exactNodeParity: true};
}
function checkBody(dom, attribute) {
  const body = /<body\b[^>]*>/.exec(dom);
  requirePass(body && body[0].includes(attribute + '="pass"'), 'Strict body failed: ' + attribute);
}
function checkPressure(dom) {
  checkBody(dom, 'data-smoke');
  checkBody(dom, 'data-pressure');
  const match = /<pre id="pressure-independent">([\s\S]*?)<\/pre>/.exec(dom);
  requirePass(match, 'Missing independent HTTP pressure results');
  const cases = JSON.parse(match[1]);
  requirePass(cases.length === 4 && cases.every(x => x.ok === true), 'HTTP pressure 4 cases must all pass');
  return {strictSmoke: true, strictPressure: true, passed: cases.length};
}
module.exports = {checkSuite, checkBody, checkPressure};
if (require.main === module) {
  const suite = checkSuite(fs.readFileSync(path.join(__dirname, 'browser-result.html'), 'utf8'));
  checkBody(fs.readFileSync(path.join(__dirname, 'ui-smoke-result.html'), 'utf8'), 'data-smoke');
  checkBody(fs.readFileSync(path.join(__dirname, 'storage-write-result.html'), 'utf8'), 'data-result');
  checkBody(fs.readFileSync(path.join(__dirname, 'storage-read-result.html'), 'utf8'), 'data-result');
  const result = {fileChecks: 4, suite};
  if (process.argv[2]) result.pressureHttp = checkPressure(fs.readFileSync(process.argv[2], 'utf8'));
  console.log(JSON.stringify(result, null, 2));
}
