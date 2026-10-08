'use strict';
/**
 * UI copy checks for 雾港回收工坊. Does not write files.
 *   node tests/tools/story-copy.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
const htmlPath = path.join(root, 'gdd1.html');
const copyPath = path.join(root, 'js/gdd1UI/copy.js');
const mainPath = path.join(root, 'js/gdd1UI/main.js');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log('  PASS ' + name);
  } else {
    fail++;
    console.log('  FAIL ' + name + (detail ? ': ' + detail : ''));
  }
}

const html = fs.readFileSync(htmlPath, 'utf8');
const copySrc = fs.readFileSync(copyPath, 'utf8');
const mainSrc = fs.readFileSync(mainPath, 'utf8');

console.log('=== 1. gdd1.html chrome ===');
check('title 雾港回收工坊', /<title>雾港回收工坊<\/title>/.test(html));
check('h1 雾港回收工坊', /<h1>雾港回收工坊<\/h1>/.test(html));
check('button 开场', html.includes('>开场<'));
check('button 新精简模式', html.includes('>新精简模式<'));
check('button 新完整模式', html.includes('>新完整模式<'));
check('button 继续精简模式', html.includes('>继续精简模式<'));
check('button 继续完整模式', html.includes('>继续完整模式<'));
check('heading 生产牌库', html.includes('生产牌库'));
check('heading 本局升级', html.includes('本局升级'));
const copyIdx = html.indexOf('js/gdd1UI/copy.js');
const mainIdx = html.indexOf('js/gdd1UI/main.js');
check('copy.js before main.js', copyIdx >= 0 && mainIdx > copyIdx);
const ids = [
  'welcome', 'menu', 'profile-summary', 'seed', 'new', 'new-full', 'continue', 'continue-full',
  'save', 'export', 'export-error', 'import', 'autosave', 'audio-on', 'audio-vol',
  'anim-speed', 'notice', 'stats', 'board', 'decision', 'summary', 'ledger',
  'log', 'pool-count', 'pool', 'items', 'legacy'
];
for (const id of ids) {
  check('id ' + id, html.includes('id="' + id + '"'));
}
check('html 不含实例池', !html.includes('实例池'));
check('css/gdd1.css 仍引用', html.includes('css/gdd1.css'));
check('本轮账本', html.includes('本轮账本'));
check('逐格收入与因果日志', html.includes('逐格收入与因果日志'));
check('旧局只读摘要', html.includes('旧局只读摘要'));

console.log('\n=== 1b. COPY.start welcome copy ===');
const COPY = require(copyPath);
check('COPY.start.tagline 组合赚钱', !!(COPY.start && COPY.start.tagline && COPY.start.tagline.includes('组合赚钱')));
check('COPY.start.story 雾港', !!(COPY.start && COPY.start.story && COPY.start.story.includes('雾港')));
check('COPY.start.offline 完全离线', !!(COPY.start && COPY.start.offline && COPY.start.offline.includes('完全离线')));
check('COPY.start.settleSummary 现金如何入账', !!(COPY.start && COPY.start.settleSummary && COPY.start.settleSummary.includes('现金如何入账')));

console.log('\n=== 2. copy.js events + stamp ===');
const EVENT_IDS = [
  'event_fog_shift', 'event_copper_queue', 'event_silent_bell', 'event_brine_inspection',
  'event_empty_manifest', 'event_boiler_test', 'event_misprint_window', 'event_quota_recount'
];
check('GDD1COPY / module.exports 存在', !!COPY && typeof COPY === 'object');
check('8 event keys', EVENT_IDS.every(id => COPY.events && COPY.events[id]));
const stampText = JSON.stringify(COPY.stamp || {});
check('stamp 含 18', stampText.includes('18'));
check('stamp 含 +12', stampText.includes('+12'));
check('stamp 含 待入账', stampText.includes('待入账'));
check('stamp 含 拒绝', stampText.includes('拒绝'));
check('stamp 含 不撤销', stampText.includes('不撤销'));

const vmCopy = { window: {}, console };
vmCopy.globalThis = vmCopy;
vm.createContext(vmCopy);
vm.runInContext(copySrc, vmCopy, { filename: 'copy.js' });
check('vm 暴露 GDD1COPY', !!vmCopy.GDD1COPY && !!vmCopy.GDD1COPY.events);

console.log('\n=== 3. required player-facing terms ===');
function collect(v, out) {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') Object.keys(v).forEach(k => collect(v[k], out));
}
const copyStrings = [];
collect(COPY, copyStrings);
const htmlVisible = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
const mainLiterals = [...mainSrc.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g)]
  .map(m => (m[1] != null ? m[1] : m[2]))
  .filter(s => /[\u4e00-\u9fff]/.test(s));
const playerCorpus = copyStrings.concat(htmlVisible, mainLiterals).join('\n');
const required = ['完整模式', '精简模式（试验）', '生产牌', '生产牌库', '本局升级', '本期应付', '待入账', '现金'];
for (const term of required) check('含 ' + term, playerCorpus.includes(term));

console.log('\n=== 4. forbidden player chrome ===');
const forbidden = [
  '雾港余热局', '供能配额', '城市供能', '能源条', '总债务', '利息', '手牌', '真钱',
  '简单模式', '保证易过', '保证通关', '开始 Normal', '开始切片'
];
for (const term of forbidden) check('不含 ' + term, !playerCorpus.includes(term));

console.log('\n=== 5. win / lose copy ===');
check('slice win 不代表完整模式通关', (COPY.win && COPY.win.sliceNote || '').includes('不代表完整模式通关') || (COPY.win && COPY.win.slice || '').includes('不代表完整模式通关'));
check('full win 工坊保住了', (COPY.win && COPY.win.full || '').includes('工坊保住了'));
check('lose 本期账单未付清', (COPY.lose && COPY.lose.title || '').includes('本期账单未付清'));

console.log('\n=== 6. main.js logic preserved ===');
check('full-v1', mainSrc.includes('full-v1'));
check('slice-abd-v1', mainSrc.includes('slice-abd-v1'));
check('if(busy||!state)return', mainSrc.includes('if(busy||!state)return'));
check('data-rarity d.rarity', mainSrc.includes('data-rarity') && mainSrc.includes('d.rarity'));
for (const op of ['spin', 'choose', 'skip', 'item', 'skipItem', 'reroll', 'remove', 'event']) {
  check('data-op ' + op, mainSrc.includes(op));
}
check('GDD1UI', mainSrc.includes('GDD1UI'));
check('advance-accepted', mainSrc.includes('advance-accepted'));
check('start-full', mainSrc.includes('start-full'));
check('start-slice', mainSrc.includes('start-slice'));
check('welcome-open', mainSrc.includes('welcome-open'));
check('hideWelcome', mainSrc.includes('hideWelcome'));
check('peekSave', mainSrc.includes('peekSave'));
check('persist prefix', mainSrc.includes('仅本次会话可保存: '));
check('filename profile-spin', mainSrc.includes("gdd1-'+state.profile+'-'+state.spin+'.json") || mainSrc.includes('gdd1-\'+state.profile+\'-\'+state.spin+\'.json'));

console.log('\n=== 7. copy.js does not mutate defs ===');
check('no F.sliceEvents', !copySrc.includes('F.sliceEvents'));
check('no .description=', !copySrc.includes('.description='));
check('no GDD1.', !copySrc.includes('GDD1.'));

console.log('\n=== 8. event copy numbers ===');
const ev = COPY.events || {};
const d = id => JSON.stringify(ev[id] || {});
check('fog 4 and +1', d('event_fog_shift').includes('4') && d('event_fog_shift').includes('+1'));
check('copper 铜毛刺 and 过役垫圈', d('event_copper_queue').includes('铜毛刺') && d('event_copper_queue').includes('过役垫圈'));
check('silent 1/2 and ×2', d('event_silent_bell').includes('1/2') && /[×x]2/.test(d('event_silent_bell')));
check('brine 晶体', d('event_brine_inspection').includes('晶体'));
check('empty +2 and 5', d('event_empty_manifest').includes('+2') && d('event_empty_manifest').includes('5'));
check('boiler +12 and 10', d('event_boiler_test').includes('+12') && d('event_boiler_test').includes('10'));
check('misprint 6 and +2', d('event_misprint_window').includes('6') && d('event_misprint_window').includes('+2'));
check('quota +10', d('event_quota_recount').includes('+10'));

console.log('\n=== 9. missing GDD1COPY does not throw ===');
let missingOk = false;
try {
  vm.runInNewContext('(function(){var C=typeof GDD1COPY!=="undefined"?GDD1COPY:{}; return C;})()', {});
  missingOk = true;
} catch (e) {
  missingOk = false;
}
check('GDD1COPY||{} stub', missingOk);

function cxFallback(src, path) {
  const needle = "cx('" + path + "','";
  const i = src.indexOf(needle);
  if (i < 0) return null;
  let j = i + needle.length, out = '';
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { out += src[j + 1]; j += 2; continue; }
    if (c === "'") return out;
    out += c;
    j++;
  }
  return null;
}

console.log('\n=== 10. settle last-round boundary (engine + copy) ===');
const settleCopy = COPY.start && COPY.start.settle || '';
const settleFb = cxFallback(mainSrc, 'start.settle');
const lastSpinCopy = COPY.hints && COPY.hints.lastSpin || '';
const lastSpinFb = cxFallback(mainSrc, 'hints.lastSpin');
check('settle copy === showStart fallback', settleCopy === settleFb && settleCopy.length > 0);
check('lastSpin copy/fallback 未改', lastSpinCopy === '选择或跳过后入账并付款；新增生产牌不能补本期缺口' && lastSpinCopy === lastSpinFb);
check('settle 去掉任意一轮不能补本期缺口', !settleCopy.includes('不能补救本轮已定收益或本期缺口'));
{
  const gapClauses = settleCopy.split(/[。；]/).filter(c => c.includes('本期缺口'));
  check('settle 缺口条款均带最后一轮', gapClauses.length > 0 && gapClauses.every(c => c.includes('最后一轮')));
  check('settle 只有本期最后一轮才不能补缺口', /只有本期最后一轮/.test(settleCopy) && /不能补救本期缺口/.test(settleCopy));
  check('settle 本轮已定收益不改且余轮仍可帮本期', /不改变本轮已定收益/.test(settleCopy) && /若本期还有运行/.test(settleCopy) && /未来运行/.test(settleCopy) && /帮本期/.test(settleCopy));
}
check('main lastSpin 仍按 spinsRemaining===0 分支', /spinsRemaining===0\?cx\('hints\.lastSpin'/.test(mainSrc));

global.GDD1 = {};
const engineFiles = ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller'];
for (const f of engineFiles) require(path.join(root, 'js/gdd1/' + f + '.js'));
const F = global.GDD1;
const cmd = (s, extra) => F.fullCommand(s, Object.assign({ revision: s.revision, windowId: s.offer && s.offer.windowId }, extra));

{
  let s = F.fullNewRun('STORY-SETTLE-REMAIN');
  let r = cmd(s, { op: 'spin' });
  check('非末轮 spin 成功', r.ok, r.error);
  s = r.state;
  const pending = s.pendingSettlement;
  const lastTotal = s.last && s.last.total;
  const lastBoard = JSON.stringify(s.last && s.last.board);
  const remainingAfter = s.spinsRemaining;
  const choice = s.offer && s.offer.choices && s.offer.choices[0];
  const beforeUids = new Set(s.pool.map(x => x.uid));
  check('非末轮仍有后续运行', remainingAfter > 0 && s.phase === 'SYMBOL_CHOICE' && pending === lastTotal);
  r = cmd(s, { op: 'choose', id: choice });
  check('非末轮 choose 成功', r.ok, r.error);
  s = r.state;
  const added = s.pool.find(x => !beforeUids.has(x.uid));
  check('choose 不改本轮已定 last', JSON.stringify(s.last && s.last.board) === lastBoard && s.last.total === lastTotal);
  check('choose 只把待入账转入现金', s.pendingSettlement === null && s.cash === Math.max(0, pending) && s.phase === 'READY');
  check('新牌入库存但未进入本轮盘面', !!added && added.type === choice && !(s.last.board || []).some(c => c && c.uid === added.uid));
  r = cmd(s, { op: 'spin' });
  check('本期后续运行成功', r.ok, r.error);
  s = r.state;
  check('新牌可出现在本期后续盘面', !!(s.last && s.last.board && s.last.board.some(c => c && c.uid === added.uid)));
}

{
  let s = F.fullNewRun('STORY-SETTLE-LAST');
  let guard = 0, lastOk = true;
  while (guard++ < 20 && !(s.phase === 'SYMBOL_CHOICE' && s.spinsRemaining === 0)) {
    if (s.phase === 'READY') {
      const r = cmd(s, { op: 'spin' });
      if (!r.ok) { lastOk = false; break; }
      s = r.state;
    } else if (s.phase === 'SYMBOL_CHOICE') {
      const r = cmd(s, { op: 'skip' });
      if (!r.ok) { lastOk = false; break; }
      s = r.state;
    } else {
      lastOk = false;
      break;
    }
  }
  check('走到本期最后一轮候选', lastOk && s.phase === 'SYMBOL_CHOICE' && s.spinsRemaining === 0);
  const pending = s.pendingSettlement;
  const cashBefore = s.cash;
  const payment = s.payment;
  const lastTotal = s.last.total;
  const choice = s.offer.choices[0];
  const beforeUids = new Set(s.pool.map(x => x.uid));
  const r = cmd(s, { op: 'choose', id: choice });
  check('末轮 choose 成功', r.ok, r.error);
  s = r.state;
  const added = s.pool.find(x => !beforeUids.has(x.uid));
  const payable = cashBefore + pending;
  check('末轮新牌不改本轮已定收益', s.last.total === lastTotal && s.cash === Math.max(0, payable));
  check('末轮新牌入库存但不能再跑本期', !!added && added.type === choice && s.spinsRemaining === 0 && s.phase !== 'READY' && s.phase !== 'SYMBOL_CHOICE');
  check('末轮缺口只看已定现金+待入账', payable < payment ? s.phase === 'LOST' : (s.phase === 'ITEM_CHOICE' || s.phase === 'WON'));
}

console.log('\n=== 11. stamp accepted-state claim (resolver + copy) ===');
const stampCopy = COPY.stamp && COPY.stamp.label || '';
// The approved shell replaced the long inline wall with a short toggle + details.
const stampDetail = fs.readFileSync(path.join(root, 'js/gdd1UI/playerText.js'), 'utf8').match(/symbol\('advance_stamp'.*/);
check('stamp 代价详情入口与完整政策保留', mainSrc.includes('data-inspect="symbol:advance_stamp"') && !!stampDetail &&
  stampDetail[0].includes('每张邮戳每期首次在接受状态下上盘') && stampDetail[0].includes('默认拒绝') &&
  stampDetail[0].includes('18') && stampDetail[0].includes('+12') && stampDetail[0].includes('不撤销'));
check('stamp 每张每期首次在接受状态下上盘', /每张邮戳每期首次在接受状态下上盘/.test(stampCopy));
check('stamp 拒绝状态下此前上盘不耗资格', /拒绝状态下此前上盘不耗资格/.test(stampCopy));
check('stamp 去掉接受后首次上盘误导', !/接受后，每枚邮戳在每期首次上盘/.test(stampCopy));
check('stamp 保留默认拒绝/READY切换/18待入账/账单+12/不撤销',
  /默认拒绝/.test(stampCopy) && /等待运行时切换/.test(stampCopy) && stampCopy.includes('18') &&
  stampCopy.includes('待入账') && /选择或跳过后才入现金/.test(stampCopy) && stampCopy.includes('+12') &&
  /生成失败不撤销奖励与义务/.test(stampCopy) && /关闭或移除也不撤销已经加入的义务/.test(stampCopy));
check('stamp checkbox 仅在 READY 且持有邮戳时呈现', /if\(s\.profile==='full-v1'&&s\.phase==='READY'&&s\.pool\.some\(x=>x\.type==='advance_stamp'\)\)[^\n]*id="advance-accepted"/.test(mainSrc));

{
  const resolverSrc = fs.readFileSync(path.join(root, 'js/gdd1/resolver.js'), 'utf8');
  const adv = resolverSrc.match(/if\(e\.op==='advance'\)\{[^;]*;[^;]*;/);
  check('advance 拒绝或已领取时直接 return false',
    !!(adv && adv[0].includes('!s.settings.advanceAccepted') &&
      adv[0].includes('advanceClaims.includes(source.id)') &&
      adv[0].includes('return false')));
  check('advance 成功后才写入 claims',
    /return false;s\.stageState\.advanceClaims\.push\(source\.id\)/.test(resolverSrc));
}

{
  const s = F.fullNewRun('STORY-STAMP-REJECT-THEN-ACCEPT');
  s.pool = [F.instance(s, 'advance_stamp')];
  const uid = s.pool[0].uid;
  const board = () => { const b = Array(20).fill(null); b[0] = s.pool[0]; return b; };
  check('默认拒绝', s.settings.advanceAccepted === false);
  const off = F.sliceResolve(s, board());
  check('拒绝上盘只有基础收益且不入 claims',
    off.total === 2 && off.reward === 0 && s.stageState.advanceClaims.length === 0 &&
    s.payment === s.basePayment && !s.pool.some(x => x.type === 'arrears_slip'));
  s.settings.advanceAccepted = true;
  const on = F.sliceResolve(s, board());
  check('拒绝后首次接受上盘仍可领取 18/+12/欠条',
    on.total === 20 && on.reward === 18 && s.payment === s.basePayment + 12 &&
    JSON.stringify(s.stageState.advanceClaims) === JSON.stringify([uid]) &&
    s.pool.some(x => x.type === 'arrears_slip'));
  const again = F.sliceResolve(s, board());
  check('同张本期再次上盘不再重复领取',
    again.total === 2 && again.reward === 0 && s.payment === s.basePayment + 12 &&
    s.stageState.advanceClaims.length === 1);
}

console.log('\n=== 核验结果: ' + pass + ' 通过 / ' + fail + ' 失败 ===');
process.exitCode = fail ? 1 : 0;
