/* 独立胜败层：仅阅读游戏状态，统计保存在 UI 遥测中。 */
(function (root) {
  'use strict';
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const routeNames = {plant:'培育',scrap:'回收',resonance:'共鸣',distill:'蒸馏',cargo:'货运',pressure:'蓄压',phase:'异相',contract:'契据'};
  function close() {
    if (root.GDD1OVERLAY) { root.GDD1OVERLAY.close('end-build'); root.GDD1OVERLAY.close('end'); }
  }
  function open(state, callbacks) {
    const O = root.GDD1OVERLAY;
    if (!O || !state || !['WON', 'LOST'].includes(state.phase)) return null;
    callbacks = callbacks || {};
    const won = state.phase === 'WON', copy = root.GDD1COPY || {};
    const defs = root.GDD1TEXT ? root.GDD1TEXT.defsOf(state) : root.GDD1.defs(state);
    const pool = state.pool || [], items = state.items || [];
    const name = id => { const d = defs.symbols[id] || defs.items[id] || defs.events[id]; return d && d.name || '未识别条目'; };
    const telemetry = root.GDD1PREFS ? root.GDD1PREFS.getTelemetry(state) : null;
    const spins = telemetry && telemetry.profile === state.profile && telemetry.seed === state.seed && Array.isArray(telemetry.spins)
      ? telemetry.spins.filter(r => r && Number.isSafeInteger(r.spin) && r.spin <= state.spin && Number.isFinite(r.total)) : [];
    // Only the actual last five rounds; do not substitute older records for missing rounds.
    const recent = spins.filter(r => r.spin > state.spin - 5);
    const mean = recent.length ? (recent.reduce((sum, r) => sum + r.total, 0) / recent.length).toFixed(1) : null;
    const scores = Object.create(null), appearances = Object.create(null), rounds = Object.create(null);
    for (const r of spins) {
      for (const id of Object.keys(r.contributions || {})) if (Number.isFinite(r.contributions[id])) scores[id] = (scores[id] || 0) + r.contributions[id];
      for (const id of Object.keys(r.types || {})) if (Number.isSafeInteger(r.types[id]) && r.types[id] > 0) {
        appearances[id] = (appearances[id] || 0) + r.types[id];
        if (!rounds[id]) rounds[id] = [];
        rounds[id].push(r.spin);
      }
    }
    const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a] || a.localeCompare(b));
    const positive = ranked.length && scores[ranked[0]] > 0;
    const winners = positive ? ranked.filter(id => scores[id] === scores[ranked[0]]) : [];
    const mvp = winners.length ? winners.map(id => name(id)).join('、') + '：' + scores[winners[0]] + (winners.length > 1 ? '（并列）' : '') : '暂无可确认的正向可归因收益';
    const routeCounts = Object.create(null);
    const I = root.ICONS;
    if (I && I.routeOf) for (const id of pool.map(c => c.type).concat(items)) {
      const route = I.routeOf(id);
      if (route && routeNames[route]) routeCounts[route] = (routeCounts[route] || 0) + 1;
    }
    const routes = Object.keys(routeCounts).sort((a, b) => routeCounts[b] - routeCounts[a] || a.localeCompare(b));
    const levels = [...new Set(routes.map(r => routeCounts[r]))];
    const routeAt = index => levels[index] == null ? '暂无' : routes.filter(r => routeCounts[r] === levels[index]).map(r => routeNames[r] + '（' + routeCounts[r] + '）').join('、');
    const keyIds = [...new Set(winners.filter(id => defs.symbols[id]).concat(pool.filter(c => {
      const d = defs.symbols[c.type]; return d && ['rare', 'epic'].includes(d.rarity);
    }).map(c => c.type)))];
    if (!keyIds.length) keyIds.push(...Object.keys(appearances).sort((a, b) => appearances[b] - appearances[a] || a.localeCompare(b)).slice(0, 3));
    const keyHtml = keyIds.length ? '<ul>' + keyIds.map(id => '<li>' + esc(name(id)) + '：'
      + (appearances[id] ? esc(appearances[id]) + '张次，出现在第' + esc(rounds[id].join('、')) + '轮' : '暂无上盘记录') + '</li>').join('') + '</ul>' : '<p>暂无关键牌上盘记录。</p>';
    const title = won ? state.profile === 'full-v1' ? copy.win && copy.win.full || '工坊保住了！' : copy.win && copy.win.slice || '精简模式完成' : copy.lose && copy.lose.title || '本局经营失败';
    const number = x => Number.isFinite(x) ? x : '未记录';
    const gap = won ? 0 : Number.isFinite(state.payment) && Number.isFinite(state.cash) ? Math.max(0, state.payment - state.cash) : '未记录';
    const buildHtml = '<h3>生产牌库（' + pool.length + '张）</h3><ul>' + pool.map(c => '<li>' + esc(name(c.type))
      + (Number.isFinite(c.permanent) ? ' · 永久成长 ' + esc(c.permanent) : '') + '</li>').join('')
      + '</ul><h3>本局升级（' + items.length + '项）</h3>' + (items.length ? '<ul>' + items.map(id => '<li>' + esc(name(id)) + '</li>').join('') + '</ul>' : '<p>没有本局升级。</p>');
    const body = O.open('end', { title: title, wide: true, focus: '[data-end="again"]', html:
      '<section class="end-summary ' + (won ? 'won' : 'lost') + '">'
      + (won && state.profile !== 'full-v1' ? '<p>试验模式通关，不代表完整模式通关。</p>' : '')
      + '<dl><dt>本期应付' + (won ? '（已付清）' : '') + '</dt><dd>' + esc(number(state.payment)) + '</dd><dt>' + (won ? '付清后剩余现金' : '可付现金') + '</dt><dd>' + esc(number(state.cash))
      + '</dd><dt>缺口</dt><dd>' + esc(gap) + '</dd><dt>Seed</dt><dd class="end-seed" style="overflow-wrap:anywhere">' + esc(state.seed) + '</dd>'
      + '<dt>生产牌库 / 本局升级</dt><dd>' + pool.length + '张 / ' + items.length + '项</dd>'
      + '<dt>近五轮净额均值</dt><dd>' + (mean === null ? '暂无记录' : esc(mean) + '（近五轮范围内记录到' + recent.length + '轮）') + '</dd>'
      + '<dt>MVP · 可归因收益</dt><dd>' + esc(mvp) + '</dd><dt>主路线</dt><dd>' + esc(routeAt(0)) + '</dd><dt>副路线</dt><dd>' + esc(routeAt(1)) + '</dd></dl>'
      + '<p>路线按最终生产牌与本局升级的数量计数，同数并列；不代表实际收益占比。</p>'
      + '<p>MVP按已记录' + spins.length + '轮的同类来源合计：普通产出的归因份额加独立奖励；生产牌按该轮最早可追溯牌种归类，升级与事件按各自来源归类。含基础收益、加值与倍率带来的实际增量；不是整局总收入或反事实贡献，未记录的收益不推算。</p>'
      + '<h3>关键牌上盘记录</h3>' + keyHtml + '<p>优先展示MVP生产牌及最终稀有、史诗牌；否则展示记录中上盘最多的三种牌。同种多张按张次计，缺失记录不等于从未上盘。</p>'
      + '<p>上盘牌种按本轮最早可追溯的牌种记录；转换后的产物不倒算成抽取时的牌。</p>'
      + (!won ? '<p>现金未达到本期应付。可结合已记录净额、关键牌上盘与最终构筑复盘；记录不足时无法判定失败原因。</p>' : '')
      + '<div class="controls"><button type="button" data-end="again">再来一局</button><button type="button" data-end="copy">复制 Seed</button>'
      + '<button type="button" data-end="build">查看最终构筑</button><button type="button" data-end="menu">返回开场</button></div>'
      + '<p class="end-toast" role="status" aria-live="polite"></p></section>' });
    function toast(message, error) {
      const status = body.querySelector('.end-toast');
      if (status) status.textContent = message;
      if (typeof callbacks.toast === 'function') callbacks.toast(message, !!error);
    }
    body.querySelector('[data-end="again"]').onclick = function () { if (typeof callbacks.again === 'function') { close(); callbacks.again(); } };
    body.querySelector('[data-end="menu"]').onclick = function () { if (typeof callbacks.menu === 'function') { close(); callbacks.menu(); } };
    body.querySelector('[data-end="again"]').disabled = typeof callbacks.again !== 'function';
    body.querySelector('[data-end="menu"]').disabled = typeof callbacks.menu !== 'function';
    body.querySelector('[data-end="build"]').onclick = function () { O.open('end-build', { title: '最终构筑', wide: true, html: buildHtml }); };
    body.querySelector('[data-end="copy"]').onclick = async function () {
      const seed = String(state.seed == null ? '' : state.seed);
      let copied = false;
      try { if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) { await root.navigator.clipboard.writeText(seed); copied = true; } } catch (e) { /* file: fallback below */ }
      if (!copied) {
        let area = null;
        const previous = root.document && root.document.activeElement;
        try {
          const doc = root.document;
          area = doc.createElement('textarea'); area.value = seed; area.setAttribute('readonly', '');
          area.style.cssText = 'position:fixed;left:-10000px;top:0'; body.appendChild(area); area.select();
          copied = typeof doc.execCommand === 'function' && doc.execCommand('copy') === true;
        } catch (e) { copied = false; }
        finally { if (area) area.remove(); if (previous && previous.isConnected && previous.focus) previous.focus(); }
      }
      toast(copied ? 'Seed 已复制。' : '复制失败，请手动选择并复制上方 Seed。', !copied);
    };
    return body;
  }
  root.GDD1END = { open: open, close: close };
})(typeof window !== 'undefined' ? window : globalThis);
