/* 替换原生 confirm()。测试若把 window.confirm 补成非 native 函数，仍走该桩，避免 CDP 用例卡住。 */
(function (root) {
  'use strict';

  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let host = null;
  let pending = null;
  let lastFocus = null;
  let background = [];
  const nativeConfirm = root.confirm;

  function cx(path, fb) {
    let v = root.GDD1COPY;
    for (const k of String(path).split('.')) {
      if (!v || typeof v !== 'object') return fb;
      v = v[k];
    }
    return v == null || v === '' ? fb : v;
  }

  function patchedConfirm() {
    try {
      const src = Function.prototype.toString.call(root.confirm);
      return src.indexOf('[native code]') === -1;
    } catch (e) {
      return root.confirm !== nativeConfirm;
    }
  }

  function ensure() {
    if (host && host.isConnected) return host;
    host = document.createElement('div');
    host.id = 'confirm-dialog';
    host.hidden = true;
    host.innerHTML = '<div class="confirm-scrim"></div>'
      + '<div class="confirm-panel" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body">'
      + '<h2 id="confirm-title"></h2>'
      + '<p id="confirm-body"></p>'
      + '<div class="confirm-actions">'
      + '<button type="button" class="primary" data-confirm="ok"></button>'
      + '<button type="button" data-confirm="cancel"></button>'
      + '</div></div>';
    document.body.appendChild(host);
    host.addEventListener('click', function (e) {
      const b = e.target.closest('[data-confirm]');
      if (!b) return;
      finish(b.getAttribute('data-confirm') === 'ok');
    });
    return host;
  }

  function finish(ok) {
    if (!pending) return;
    const done = pending;
    pending = null;
    ensure().hidden = true;
    document.body.classList.remove('confirm-open');
    background.forEach(row => { row.el.inert = row.inert; });
    background = [];
    const back = lastFocus;
    lastFocus = null;
    if (back && back.isConnected && !back.closest('[inert]') && back.getClientRects().length) back.focus();
    done(!!ok);
  }

  function ask(message, title) {
    if (patchedConfirm()) {
      try { return Promise.resolve(!!root.confirm(message)); }
      catch (e) { return Promise.resolve(true); }
    }
    // A second request cannot replace the resolver of an already open decision.
    if (pending) return Promise.resolve(false);
    ensure();
    lastFocus = document.activeElement;
    background = Array.from(document.querySelectorAll('body > header,body > main,#welcome,#overlay-root,#coach'))
      .map(el => ({ el: el, inert: el.inert }));
    background.forEach(row => { row.el.inert = true; });
    const titleEl = host.querySelector('#confirm-title');
    const bodyEl = host.querySelector('#confirm-body');
    const okBtn = host.querySelector('[data-confirm="ok"]');
    const cancelBtn = host.querySelector('[data-confirm="cancel"]');
    titleEl.textContent = title || cx('confirms.title', '请确认');
    bodyEl.textContent = message || '';
    okBtn.textContent = cx('confirms.ok', '确认');
    cancelBtn.textContent = cx('confirms.cancel', '取消');
    host.hidden = false;
    document.body.classList.add('confirm-open');
    try { cancelBtn.focus(); } catch (e) { /* ignore */ }
    return new Promise(resolve => { pending = resolve; });
  }

  document.addEventListener('keydown', function (e) {
    if (!pending) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      finish(false);
    } else if (e.key === 'Tab') {
      const buttons = Array.from(host.querySelectorAll('button:not(:disabled)'));
      const index = buttons.indexOf(document.activeElement);
      const next = index < 0 ? 0 : (index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      e.preventDefault();
      buttons[next].focus();
    } else if (e.key === 'Enter') {
      // Activate the focused action, never hard-code approval. Prevent native
      // duplicate activation so keypress differences between browsers are safe.
      e.preventDefault();
      const button = document.activeElement.closest('[data-confirm]');
      if (!e.repeat && button && host.contains(button)) button.click();
    } else if (e.key === ' ') {
      if (e.repeat || !host.contains(document.activeElement)) e.preventDefault();
    }
  });

  root.GDD1CONFIRM = {
    ask: ask,
    isOpen: () => !!pending,
    cancel: () => finish(false)
  };
})(typeof window !== 'undefined' ? window : globalThis);
