/* 局内可跳过教程（GDD §10.3 六步）——纯表现层。
 *
 * 硬约束：
 *   - 只读 state（以及只读 defs 取生产牌名字），绝不发送游戏命令、不改规则、不读 RNG。
 *   - 不写游戏存档：跳过 / 完成偏好只落在独立 UI 键 fog-port.ui.gdd1.tutorial
 *     （JSON {status:'skipped'|'done'}），仿 fog-port.audio.v1 的写法。
 *   - 步骤由真实操作推进（运行 / 选牌 / 跳过并入账），教练不替玩家点任何按钮；
 *     「下一步」只翻教练卡，不触碰对局。
 *   - render 非 preview 后由 main.js 调 sync(state) 重贴高亮：
 *     #board / #stats / #decision / #pool 会整段重写，旧高亮必须每次重建。
 *
 * main.js 只接线：shouldStart / begin / abort / sync / onCommand（另外读 prefStatus 定欢迎门标签）。
 */
(function (root) {
  'use strict';

  const KEY = 'fog-port.ui.gdd1.tutorial';
  const STEPS = ['draw', 'output', 'choose', 'adjacency', 'payment', 'remove'];
  const F = root.GDD1;
  const $ = id => document.getElementById(id);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** 读 COPY 路径，缺失时用同文案兜底（与 main.js 的 cx 同义） */
  function cp(path, fb) {
    let v = root.GDD1COPY;
    for (const k of path.split('.')) { if (!v || typeof v !== 'object') return fb; v = v[k]; }
    return v == null || v === '' ? fb : v;
  }
  /** 把 {name} 占位换成当局数字 / 名字 */
  const fill = (text, map) => String(text).replace(/\{(\w+)\}/g, (m, k) => (map && map[k] != null ? String(map[k]) : m));

  let active = false;
  let idx = 0;
  let lastState = null;

  /* ── 偏好：独立 UI 键，绝不进游戏存档 ───────────────────── */
  function prefStatus() {
    try {
      const v = JSON.parse(root.localStorage.getItem(KEY) || '{}');
      return v && (v.status === 'skipped' || v.status === 'done') ? v.status : null;
    } catch (e) { return null; }
  }
  function writePref(status) { try { root.localStorage.setItem(KEY, JSON.stringify({ status: status })); } catch (e) { } }

  /** 只有欢迎门开始按钮会问：勾了就只在看过之后重看，没勾就只在没看过时开始 */
  function shouldStart(opts) {
    const seen = prefStatus() !== null;
    return !!(opts && opts.skipChecked) ? seen : !seen;
  }

  /* ── 只读取数：全部来自当局 state，绝不臆造 ─────────────── */
  const boardOf = s => (s && s.last && s.last.board) || [];
  function typeOf(s, uid) {
    for (const c of boardOf(s)) if (c && c.uid === uid) return c.type;
    return null;
  }
  function nameOf(s, type) {
    try {
      const d = F && F.defs ? F.defs(s) : null;
      const n = d && d.symbols && d.symbols[type] && d.symbols[type].name;
      return n || type;
    } catch (e) { return type; }
  }
  /**
   * 相邻加值：只认 last.log 里 action 为 add / multiply、source≠target、
   * 且两端都在本轮盘面上的行（与 main.js 画连线时的过滤一致）。
   * 自身加值（source===target）、本局升级 / 事件来源（不在盘面）都不算相邻。
   */
  function pairsOf(s) {
    const on = new Set();
    for (const c of boardOf(s)) if (c) on.add(c.uid);
    const out = [], seen = new Set();
    for (const row of ((s && s.last && s.last.log) || [])) {
      if (!row || (row.action !== 'add' && row.action !== 'multiply')) continue;
      if (!row.source || !row.target || row.source === row.target) continue;
      if (!on.has(row.source) || !on.has(row.target)) continue;
      const k = row.action + '/' + row.source + '/' + row.target;
      if (seen.has(k)) continue;
      seen.add(k);
      if (row.action === 'add' && typeof row.amount !== 'number') continue;
      out.push(row);
    }
    return out;
  }
  /** 倍率行的倍数不在日志里，只能回到来源牌定义按 effectKey 找；找不到就不报数字 */
  function ratioOf(s, row) {
    try {
      const type = typeOf(s, row.source);
      const key = row.facts && row.facts.effectKey;
      const fx = ((F.defs(s).symbols[type] || {}).effects || []).find(e => e.key === key && e.op === 'multiply' && e.ratio);
      return fx ? fx.ratio.join('/') : null;
    } catch (e) { return null; }
  }

  /* ── 高亮：每次 paint 重建，只加 outline 不改布局 ───────── */
  function clearSpots() {
    for (const el of document.querySelectorAll('.coach-spot')) el.classList.remove('coach-spot');
  }
  function spot(selectors) {
    for (const sel of selectors) {
      let list;
      try { list = document.querySelectorAll(sel); } catch (e) { continue; }
      for (const el of list) el.classList.add('coach-spot');
    }
  }

  /* ── 每一步的正文 / 旁注 / 高亮 / 能否翻页 ─────────────── */
  function view(s, name) {
    const p = 'tutorial.steps.' + name + '.';
    const v = { title: cp(p + 'name', name), body: '', hint: '', spots: [], canNext: true, nextLabel: cp('tutorial.next', '下一步'), nextWhy: '' };
    const pending = s.pendingSettlement === null || s.pendingSettlement === undefined ? '—' : s.pendingSettlement;

    if (name === 'draw') {
      v.body = esc(fill(cp(p + 'body', '生产牌库现有 {pool} 张；运行会无放回抽取至多 20 张，随机排进 5×4 盘面。'), { pool: (s.pool || []).length }));
      v.hint = esc(cp(p + 'hint', '不能手动摆牌；点「运行」开始这一轮。'));
      v.spots = ['#board', '#decision button[data-op="spin"]', '#pool'];
      v.canNext = false;                      // 必须真的点「运行」，教练不替玩家发命令
      v.nextWhy = v.hint;
    } else if (name === 'output') {
      const total = s.last ? s.last.total : 0, reward = s.last ? s.last.reward : 0;
      v.body = esc(fill(cp(p + 'body', '本轮净额 {total} ＝ 普通产出 {ordinary} ＋ 独立奖励 {reward}。'), { total: total, ordinary: total - reward, reward: reward }));
      v.hint = esc(fill(cp(p + 'hint', '待入账 {pending}：已经算好，还没进现金。'), { pending: pending }));
      v.spots = ['#stats', '#summary'];
    } else if (name === 'choose') {
      const names = ((s.offer && s.offer.choices) || []).map(id => nameOf(s, id)).join('、') || '—';
      v.body = esc(fill(cp(p + 'body', '候选：{choices}。选一张会加入生产牌库，从未来运行起才可能上盘。'), { choices: names }));
      v.hint = esc(fill(cp(p + 'hint', '「跳过并入账」不拿牌，照样提交本轮收益；选或跳过后，待入账 {pending} 才进现金。'), { pending: pending }));
      v.spots = ['#decision .choices button.choice', '#decision button[data-op="skip"]', '#stats .stat.pending'];
      v.canNext = s.pendingSettlement === null;   // 未入账时只能用真实的选牌 / 跳过按钮推进
      v.nextWhy = v.hint;
    } else if (name === 'adjacency') {
      const pairs = pairsOf(s);
      if (pairs.length) {
        const lines = pairs.slice(0, 2).map(row => {
          const src = nameOf(s, typeOf(s, row.source)), dst = nameOf(s, typeOf(s, row.target));
          if (row.action === 'add') return esc(fill(cp(p + 'add', '{source} 给 {target} 加值 {amount}'), { source: src, target: dst, amount: row.amount }));
          const ratio = ratioOf(s, row);
          return ratio
            ? esc(fill(cp(p + 'multiply', '{source} 让 {target} 产出 ×{ratio}'), { source: src, target: dst, ratio: ratio }))
            : esc(fill(cp(p + 'multiplyPlain', '{source} 放大了 {target} 的产出'), { source: src, target: dst }));
        });
        v.body = esc(fill(cp(p + 'body', '本轮有 {count} 处相邻加值或倍率：'), { count: pairs.length }));
        v.body += '<ul class="coach-lines">' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul>';
        v.spots = [];
        for (const row of pairs.slice(0, 2)) v.spots.push('#board .cell[data-uid="' + row.source + '"]', '#board .cell[data-uid="' + row.target + '"]');
      } else {
        v.body = esc(cp(p + 'none', '本轮没有相邻加值——不是每轮都会出现连线。'));
        v.spots = ['#board'];
      }
      v.hint = esc(cp(p + 'rule', '邻接包括上下、左右和斜角；同时上盘不等于一定相邻。'));
    } else if (name === 'payment') {
      const gap = Math.max(0, s.payment - s.cash);
      v.body = esc(fill(cp(p + 'body', '第 {stage}/10 期：本期应付 {payment}，现金 {cash}，本期剩余运行 {remaining}。'), { stage: s.stageId, payment: s.payment, cash: s.cash, remaining: s.spinsRemaining }));
      v.hint = gap > 0
        ? esc(fill(cp(p + 'gap', '现金还差 {gap}，按剩余运行摊到每轮约需 {perSpin}——只是参考，不是保证。'), { gap: gap, perSpin: Math.ceil(gap / Math.max(1, s.spinsRemaining)) }))
        : esc(cp(p + 'enough', '现金已经够本期应付。'));
      v.spots = ['#stats .stat'];
    } else if (name === 'remove') {
      const pool = (s.pool || []).length;
      v.body = esc(fill(cp(p + 'body', '生产牌库现有 {pool} 张。移除会移出一张生产牌。'), { pool: pool }));
      v.hint = esc(pool <= 20 ? cp(p + 'small', '生产牌库不超过 20 张：移除不会提高其他生产牌的上盘率。') : cp(p + 'large', '生产牌库超过 20 张：每轮只有至多 20 张上盘，移出低贡献牌可能改善关键件的出现机会。'));
      v.spots = ['#pool', '#pool .remove:not([disabled])'];
      v.nextLabel = cp('tutorial.finish', '完成教程');
      v.extra = [
        esc(cp(p + 'weight', '有抽取权重时，不能把出现机会说成每张一样。')),
        esc(fill(cp(p + 'cost', '移除消耗 1 张删除券（现有 {tokens} 张），不触发销毁奖励，也不撤销本轮已定收益。'), { tokens: s.removeTokens })),
        esc(cp(p + 'noNeed', '本轮不必真的花删除券。'))
      ];
    }
    return v;
  }

  function paint(s) {
    const el = $('coach');
    if (!el) return;
    clearSpots();
    if (!active || !s) {
      el.hidden = true; el.innerHTML = '';
      el.removeAttribute('data-step'); el.removeAttribute('data-active'); el.removeAttribute('aria-label');
      return;
    }
    const name = STEPS[idx];
    const v = view(s, name);
    el.hidden = false;
    el.dataset.step = name;
    el.dataset.active = '1';
    el.setAttribute('aria-label', cp('tutorial.title', '局内教程'));
    el.innerHTML = '<div class="coach-head"><span class="coach-count">' + esc(fill(cp('tutorial.counter', '教程 {n}/6'), { n: idx + 1 })) + '</span><h3>' + esc(v.title) + '</h3></div>'
      + '<p class="coach-body" aria-live="polite">' + v.body + '</p>'
      + (v.hint ? '<p class="coach-hint">' + v.hint + '</p>' : '')
      + (v.extra ? '<ul class="coach-notes">' + v.extra.map(x => '<li>' + x + '</li>').join('') + '</ul>' : '')
      + '<div class="coach-actions"><button type="button" data-op="coach-next"' + (v.canNext ? '' : ' disabled') + (v.nextWhy ? ' title="' + esc(v.nextWhy) + '"' : '') + '>' + esc(v.nextLabel) + '</button>'
      + '<button type="button" data-op="coach-skip" class="coach-skip">' + esc(cp('tutorial.skip', '跳过教程')) + '</button></div>';
    spot(v.spots);
    // 主区底部按卡片实测高度留白（CSS 变量），滚到运行 / 候选时不会被卡片压住
    try { document.body.style.setProperty('--coach-h', el.offsetHeight + 'px'); } catch (e) { }
  }

  /* ── 生命周期 ─────────────────────────────────────────── */
  function begin(profile) {
    if (!root.localStorage) return;
    active = true; idx = 0;
    document.body.classList.add('coach-open');   // 给主区留出底部空间，卡片不会压住运行 / 候选
    sync(lastState);
  }
  function abort() {
    active = false;
    document.body.classList.remove('coach-open');
    try { document.body.style.removeProperty('--coach-h'); } catch (e) { }
    const el = $('coach');
    if (el) { el.hidden = true; el.innerHTML = ''; el.removeAttribute('data-step'); el.removeAttribute('data-active'); el.removeAttribute('aria-label'); }
    clearSpots();
  }
  function notify(text) {
    if (!text) return;
    const n = $('notice');
    if (n) { n.className = ''; n.textContent = text; }
  }
  function finish(status, silent) {
    const was = active;
    active = false;
    if (was) writePref(status);
    abort();
    if (was && !silent && status === 'done') notify(cp('tutorial.done', ''));
  }

  /** 真实命令成功后调用（main.js 在 render 前调，随后 sync 会按新 state 重画） */
  function onCommand(op) {
    if (!active) return;
    if (op === 'spin') {
      if (idx >= 5) { finish('done', true); return; }   // 已经看到移除步：玩家继续经营，教程收工
      idx = 1;                                          // 新一轮：回到普通产出讲起
      return;
    }
  }

  /** render 非 preview 后调用：先按 state 推进，再重贴高亮（#board/#stats/#decision/#pool 是整段重写的） */
  function sync(s) {
    if (s) lastState = s;
    if (!active || !s) return;
    if (s.phase === 'WON' || s.phase === 'LOST') { abort(); return; }   // 终局不写偏好
    if (idx === 0 && s.last) idx = 1;
    if (s.pendingSettlement !== null && s.pendingSettlement !== undefined) {
      if (idx >= 3) idx = 2;                     // 新一轮候选：先讲第三步
    } else if (s.last && idx <= 2) idx = 3;      // 已经入账：讲相邻连线
    paint(s);
  }

  /* ── 教练自己的按钮：stopPropagation，别让对局委托处理器当成游戏命令 ── */
  function next() {
    if (!active || !lastState) return;
    const name = STEPS[idx], s = lastState;
    if (name === 'draw') return;                                  // 先点真实「运行」
    if (name === 'choose' && s.pendingSettlement !== null) return; // 先选牌或跳过并入账
    if (name === 'remove') { finish('done'); return; }
    idx++;
    sync(s);
  }
  function mount() {
    const el = $('coach');
    if (!el || el.dataset.bound === '1') return;
    el.dataset.bound = '1';
    el.addEventListener('click', e => {
      const b = e.target && e.target.closest ? e.target.closest('#coach button[data-op]') : null;
      if (!b) return;
      e.stopPropagation();
      const op = b.dataset.op;
      if (op === 'coach-next') next();
      else if (op === 'coach-skip') finish('skipped');
    });
  }
  mount();

  root.GDD1TUTORIAL = {
    shouldStart: shouldStart,
    begin: begin,
    abort: abort,
    sync: sync,
    onCommand: onCommand,
    prefStatus: prefStatus,
    isActive: () => active,
    step: () => (active ? STEPS[idx] : null)
  };
})(window);
