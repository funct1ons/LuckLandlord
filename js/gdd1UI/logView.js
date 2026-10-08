/* 中文因果日志；技术数据只放在独立 details 中。 */
(function (root) {
  'use strict';
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function html(state) {
    const last = state && state.last;
    if (!last) return '<p class="muted">尚无运行记录。</p>';
    const defs = root.GDD1TEXT ? root.GDD1TEXT.defsOf(state) : root.GDD1.defs(state);
    const names = Object.create(null);
    const card = type => defs.symbols[type] && defs.symbols[type].name || '未识别生产牌';
    for (const row of (state.pool || []).concat(last.board || [], last.ledger || [])) if (row) names[row.uid] = card(row.type);
    const log = Array.isArray(last.log) ? last.log : [];
    // Roll back final types to the earliest known name, then advance with each event.
    const first = new Set();
    for (const row of log) if (row.target && row.facts && row.facts.beforeType && !first.has(row.target)) {
      names[row.target] = card(row.facts.beforeType); first.add(row.target);
    }
    function name(id) {
      if (!id) return '工坊';
      const d = defs.items[id] || defs.events[id] || defs.symbols[id];
      return names[id] || d && d.name || '未识别来源';
    }
    const lines = log.map(row => {
      const f = row.facts || {}, source = name(row.source), target = row.target ? name(row.target) : '工坊';
      const n = Number.isFinite(row.amount) ? String(row.amount) : '未记录';
      const verbs = {
        age: source + '使' + target + '的上盘次数推进' + n + '。',
        transform: source + '将' + (f.beforeType ? card(f.beforeType) : target) + '转换为' + (f.afterType ? card(f.afterType) : '未记录牌种') + '。',
        consume: source + '消耗了' + target + '。', destroy: source + '使' + target + '离开牌库（销毁）。',
        grow: source + '使' + target + '永久成长' + n + '。',
        tagAdded: source + '为' + target + '添加标签：' + (f.afterTags || []).filter(t => !(f.beforeTags || []).includes(t)).map(t => root.GDD1TEXT ? root.GDD1TEXT.tagLabel(t) : '新标签').join('、') + '。',
        add: source + '给' + target + '本轮加值' + n + '。',
        multiply: source + '调整了' + target + '的产出倍率；最终收入见账本。',
        reward: source + '产生独立奖励' + n + '。',
        pressureIncrease: source + '使' + target + '蓄压增加' + n + '。',
        release: target + '释放了蓄压；收益另列为独立奖励。',
        spawn: source + '生成了' + (f.afterType ? card(f.afterType) : '生产牌') + '。',
        copy: source + '从' + target + '复制固定加值' + n + '；实际加值另列。',
        risk: source + '进行了风险判定；实际收益变化见后续记录。',
        reserve: source + '保留了' + target + '，供下轮上盘。',
        limitSkipped: source + '的效果本次未执行（次数或条件限制）。',
        cycle: source + '使' + target + '的拍点计数推进' + n + '。'
      };
      let line = verbs[row.action] || source + '触发了效果，详情见技术日志。';
      if (row.action === 'reward' && f.cause === 'token') line = source + '补充了操作券；不计作现金奖励。';
      if (row.action === 'reward' && f.cause === 'offer-guarantee') line = source + '设置了候选保底；不计作现金奖励。';
      if (row.target && f.afterType) names[row.target] = card(f.afterType);
      if (f.createdUid && f.afterType) names[f.createdUid] = card(f.afterType);
      return '<li>' + esc(line) + '</li>';
    });
    const ledger = (last.ledger || []).map(row => '<li>' + esc(card(row.type)) + '：' + esc(row.amount) + (row.alive === false ? '（已离场）' : '') + '</li>').join('');
    return '<section class="log-view"><h3>本轮收入</h3><p>净额 ' + esc(last.total) + ' · 独立奖励 ' + esc(last.reward)
      + '</p><ul>' + ledger + '</ul><h3>因果记录</h3>' + (lines.length ? '<ol>' + lines.join('') + '</ol>' : '<p>本轮没有额外效果记录。</p>')
      + '<details class="technical-log"><summary>技术日志（JSON）</summary><pre>' + esc(JSON.stringify(log, null, 2)) + '</pre></details></section>';
  }
  root.GDD1LOG = { html: html };
})(typeof window !== 'undefined' ? window : globalThis);
