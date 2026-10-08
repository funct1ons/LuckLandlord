/* 雾港余热局 · 纯表现层。调用方必须先提交/保存逻辑结果，再调用演出。
 * 不接收控制器或 state，不读 RNG；skip 同步落到最终视觉，Promise 随后完成。
 */
(function (root) {
  'use strict';
  const doc = root.document;
  const SPEEDS = {
    normal: { lever: 100, roll: 450, stopStep: 120, flash: 150, total: 620 },
    fast: { lever: 30, roll: 160, stopStep: 45, flash: 60, total: 180 },
    instant: { lever: 0, roll: 0, stopStep: 0, flash: 0, total: 0 }
  };
  let speed = 'normal', reduced = false, shake = true, disposed = false;
  let media = null;
  try { media = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)'); } catch (_) {}
  const jobs = new Set();
  const getReducedMotion = () => reduced || !!(media && media.matches);
  const getShake = () => shake && !getReducedMotion();
  const profile = () => SPEEDS[getReducedMotion() ? 'instant' : speed];
  const shouldAnimate = () => !disposed && !(doc && doc.hidden) && profile().roll > 0;

  // 所有等待、临时 DOM 和 Web Animations 都由同一生命周期收回。
  function job(blocking, final) {
    const cleanups = new Set(), waits = new Set();
    const j = {
      blocking, done: false,
      own(fn) { if (j.done) fn(); else cleanups.add(fn); },
      wait(ms) {
        if (j.done || ms <= 0) return Promise.resolve();
        return new Promise(resolve => {
          const finish = () => { root.clearTimeout(timer); waits.delete(finish); resolve(); };
          const timer = root.setTimeout(finish, ms); waits.add(finish);
        });
      },
      finish() {
        if (j.done) return;
        j.done = true; jobs.delete(j);
        for (const finish of waits) finish();
        for (const cleanup of cleanups) { try { cleanup(); } catch (_) {} }
        cleanups.clear();
        if (final) final();
      }
    };
    jobs.add(j); return j;
  }
  function skip() { for (const j of Array.from(jobs)) j.finish(); }
  function animate(j, el, frames, duration) {
    if (!shouldAnimate() || !el.animate) return;
    try {
      const animation = el.animate(frames, { duration, easing: 'ease-out', fill: 'none' });
      // cancel() rejects finished; consume it even when callers only await the job.
      if (animation.finished) animation.finished.catch(() => {});
      j.own(() => animation.cancel());
    } catch (_) { /* 无 Web Animations 时保留即时静态反馈 */ }
  }
  function temporary(j, host, tag, className, text) {
    if (!doc || !host) return null;
    const el = doc.createElement(tag); el.className = className;
    if (text != null) el.textContent = text;
    if (!shouldAnimate()) { el.style.animation = 'none'; el.style.transition = 'none'; }
    host.appendChild(el); j.own(() => el.remove()); return el;
  }
  function later(j, ms) { j.wait(ms).then(() => j.finish()); }

  async function reels(boardEl, finalBoard, renderCell, onStop) {
    if (!boardEl || disposed || Array.from(jobs).some(j => j.blocking)) return;
    const cells = Array.from(boardEl.children).filter(el => el.classList.contains('cell'));
    const paintFinal = () => {
      boardEl.classList.remove('is-rolling', 'is-flash');
      cells.forEach((el, pos) => {
        el.classList.remove('tick', 'stopped'); el.dataset.rolling = '0';
        el.innerHTML = renderCell(finalBoard[pos], pos);
      });
    };
    if (!shouldAnimate()) { paintFinal(); return; }
    const p = profile(), j = job(true, paintFinal);
    try {
      boardEl.classList.add('is-rolling');
      cells.forEach(el => { el.dataset.rolling = '1'; el.classList.add('tick'); });
      await j.wait(p.lever + p.roll);
      if (j.done) return;
      const stopDelays = [0.60, 0.80, 1.00, 1.25, 1.55];
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 4; row++) {
          const pos = row * 5 + col, el = cells[pos];
          if (!el) continue;
          el.dataset.rolling = '0'; el.classList.remove('tick');
          el.innerHTML = renderCell(finalBoard[pos], pos); el.classList.add('stopped');
        }
        if (onStop) onStop(col);
        await j.wait(Math.round(p.stopStep * stopDelays[col]));
        if (j.done) return;
      }
      boardEl.classList.remove('is-rolling'); boardEl.classList.add('is-flash');
      await j.wait(p.flash);
    } finally { j.finish(); }
  }
  function floatText(boardEl, pos, text, kind) {
    if (!boardEl || !shouldAnimate() || !boardEl.children[pos]) return;
    const j = job(false);
    temporary(j, boardEl.children[pos], 'span', 'float' + (kind ? ' ' + kind : ''), text);
    later(j, profile().total + 200);
  }
  function totalBadge(hostEl, total) {
    if (!hostEl || disposed) return;
    const j = job(false);
    temporary(j, hostEl, 'div', 'total-badge' + (total < 0 ? ' negative' : ''), (total >= 0 ? '+' : '') + total);
    later(j, shouldAnimate() ? profile().total + 400 : 900);
  }
  function link(boardEl, fromPos, toPos) {
    if (!boardEl || !shouldAnimate()) return;
    const a = boardEl.children[fromPos], b = boardEl.children[toPos];
    if (!a || !b) return;
    const j = job(false), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    // 每条线拥有自己的临时容器，避免共享容器被另一条线提前删除。
    const layer = temporary(j, boardEl, 'div', 'link-layer');
    const line = temporary(j, layer, 'div', 'link');
    if (!line) { j.finish(); return; }
    const base = boardEl.getBoundingClientRect();
    line.style.setProperty('--link-color', a.dataset.route
      ? `var(--route-${a.dataset.route}, rgb(242 197 111 / 85%))` : 'rgb(242 197 111 / 85%)');
    const x1 = ra.left - base.left + ra.width / 2, y1 = ra.top - base.top + ra.height / 2;
    const x2 = rb.left - base.left + rb.width / 2, y2 = rb.top - base.top + rb.height / 2;
    Object.assign(line.style, { left: x1 + 'px', top: y1 + 'px',
      width: Math.hypot(x2 - x1, y2 - y1) + 'px',
      transform: 'rotate(' + Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 'deg)' });
    later(j, profile().total + 200);
  }
  function victoryFanfare(boardEl) {
    if (!boardEl || !shouldAnimate()) return;
    const j = job(false);
    const cells = Array.from(boardEl.children).filter(el => el.classList.contains('cell') && !el.classList.contains('empty') && !el.classList.contains('dead'));
    cells.forEach(el => animate(j, el, [
      { filter: 'brightness(1)', boxShadow: '0 0 0 0 transparent' },
      { filter: 'brightness(1.12)', boxShadow: '0 0 0 2px rgb(241 197 90 / 70%)', offset: 0.35 },
      { filter: 'brightness(1)', boxShadow: '0 0 0 0 transparent' }
    ], 900));
    later(j, 900);
  }
  function defeatHalt(boardEl) {
    if (!boardEl || !shouldAnimate()) return;
    const j = job(false);
    animate(j, boardEl, [{ filter: 'brightness(1)' }, { filter: 'saturate(0.4) brightness(0.75)' }, { filter: 'brightness(1)' }], 300);
    later(j, 300);
  }

  /** 已提交结果的短反馈。payment 为已付金额或付款标记；failed 为失败标记。
   * 返回 Promise<void>（附 .skip()）；instant/reduced/缺少目标时立即完成。
   * 不覆盖目标文本、不写 state、不调用付款/收益逻辑，也不重复播放 SFX。
   */
  function settlement(target, { amount = 0, payment = 0, failed = false } = {}) {
    if (!target || !shouldAnimate()) return Object.assign(Promise.resolve(), { skip() {} });
    // 与滚轮/上次结算互斥；已有表现直接结束，逻辑结果早已由调用方提交。
    skip();
    const j = job(true), duration = speed === 'fast' ? 180 : 620;
    const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
    const paid = Number.isFinite(Number(payment)) ? Number(payment) : 0;
    const label = failed ? '付款未完成' : payment ? '付款完成' : '已入账';
    const badge = temporary(j, target, 'div', 'total-badge' + (failed ? ' negative' : ''),
      label + ' · ' + (payment ? (paid > 0 && typeof payment !== 'boolean' ? '−' + paid : '') : (value >= 0 ? '+' : '') + value));
    if (badge) {
      badge.style.animation = 'none'; badge.setAttribute('role', 'status');
      animate(j, badge, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1 }], duration);
    }
    if (failed && getShake()) animate(j, target,
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-1px)' },
        { transform: 'translateX(1px)' }, { transform: 'translateX(0)' }], Math.min(duration, 180));
    const finished = j.wait(duration).then(() => j.finish());
    finished.skip = () => j.finish();
    return finished;
  }
  function preferenceChanged() { if (getReducedMotion()) skip(); }
  function visibility() { if (doc.hidden) skip(); }
  if (media && media.addEventListener) media.addEventListener('change', preferenceChanged);
  else if (media && media.addListener) media.addListener(preferenceChanged);
  if (doc && doc.addEventListener) doc.addEventListener('visibilitychange', visibility);
  if (root.addEventListener) root.addEventListener('pagehide', skip);

  root.ANIM = {
    reels, floatText, totalBadge, link, victoryFanfare, defeatHalt, settlement, shouldAnimate, skip,
    setSpeed(s) { if (SPEEDS[s]) { speed = s; if (s === 'instant') skip(); } },
    getSpeed: () => getReducedMotion() ? 'instant' : speed,
    setReducedMotion(on) { reduced = !!on; preferenceChanged(); },
    getReducedMotion, isReduced: getReducedMotion,
    setShake(on) { shake = !!on; if (!shake) skip(); }, getShake,
    isRunning: () => Array.from(jobs).some(j => j.blocking),
    dispose() {
      disposed = true; skip();
      if (media && media.removeEventListener) media.removeEventListener('change', preferenceChanged);
      else if (media && media.removeListener) media.removeListener(preferenceChanged);
      if (doc && doc.removeEventListener) doc.removeEventListener('visibilitychange', visibility);
      if (root.removeEventListener) root.removeEventListener('pagehide', skip);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
