/* Opt-in keyboard adapter. send(op, extra) is the same boundary used by main.js. */
(function (root) {
  'use strict';
  let uninstall = null;
  function protectedUI() {
    return !!((root.GDD1CONFIRM && root.GDD1CONFIRM.isOpen()) ||
      (root.GDD1TUTORIAL && root.GDD1TUTORIAL.isActive()));
  }
  function editable(event) {
    const path = event.composedPath ? event.composedPath() : [event.target];
    return path.some(el => el && (el.isContentEditable || (el.closest &&
      el.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="slider"]'))));
  }
  /** Returns an idempotent disposer. Reinstall replaces the previous handler. */
  function install({ getState, send } = {}) {
    if (typeof getState !== 'function' || typeof send !== 'function') throw new TypeError('keys.install requires getState and send');
    const doc = root.document;
    if (!doc) throw new Error('keys.install requires a document');
    if (uninstall) uninstall();
    let active = true, pending = false;
    function handler(event) {
      if (!active || event.defaultPrevented || event.repeat || event.isComposing || event.keyCode === 229 ||
        event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || editable(event) || protectedUI() || pending) return;
      const key = event.key === ' ' || event.code === 'Space' ? 'space' : String(event.key).toLowerCase();
      const O = root.GDD1OVERLAY;
      if (key === 'escape') {
        if (O && O.top()) {
          // Own one Escape in capture phase so overlay.js cannot close a second layer.
          O.closeTop();
          event.preventDefault(); event.stopImmediatePropagation();
        }
        return;
      }
      if (!['space', 's', 'r', '1', '2', '3'].includes(key) || (O && O.top() && O.top() !== 'choice')) return;
      if (doc.hidden) return;
      const welcome = doc.getElementById('welcome');
      if (welcome && !welcome.hidden && welcome.getClientRects().length) return;
      const anim = root.ANIM;
      if (anim && anim.isRunning && anim.isRunning()) {
        if (key === 'space') { event.preventDefault(); anim.skip(); }
        return;
      }
      // With no animation, preserve native Space activation on focused controls.
      if (key === 'space' && event.target && event.target.closest && event.target.closest('button,a[href],summary,[role="button"]')) return;
      const state = getState();
      if (!state) return;
      const phase = state.phase, offer = state.offer;
      const symbol = phase === 'SYMBOL_CHOICE', item = phase === 'ITEM_CHOICE';
      let op = null, extra = {};
      if (key === 'space' && phase === 'READY') op = 'spin';
      else if ((key === 'space' || key === 's') && (symbol || item)) op = symbol ? 'skip' : 'skipItem';
      else if (/^[123]$/.test(key) && (symbol || item)) {
        const id = offer && Array.isArray(offer.choices) && offer.choices[Number(key) - 1];
        if (!id || (symbol && state.pool && state.pool.length >= 200)) return;
        op = symbol ? 'choose' : 'item'; extra = { id };
      } else if (key === 'r' && symbol && offer && state.rerollTokens > 0 && offer.choiceRefreshesUsed < 3) op = 'reroll';
      if (!op) return;
      event.preventDefault();
      if (root.SFX && root.SFX.unlock) root.SFX.unlock();
      if (op === 'reroll' && offer.guarantees && offer.guarantees.applied) {
        const message = root.GDD1COPY && root.GDD1COPY.confirms && root.GDD1COPY.confirms.reroll || '刷新将消耗本组保底。继续？';
        const revision = state.revision, windowId = offer.windowId;
        pending = true;
        let answer;
        try {
          answer = root.GDD1CONFIRM ? root.GDD1CONFIRM.ask(message) : (root.confirm ? root.confirm(message) : false);
        } catch (_) { pending = false; return; }
        Promise.resolve(answer).then(ok => {
          if (!active || !ok || protectedUI() || (O && O.top() && O.top() !== 'choice')) return;
          const now = getState();
          if (!now || now.phase !== 'SYMBOL_CHOICE' || now.revision !== revision || !now.offer ||
            now.offer.windowId !== windowId || now.rerollTokens <= 0 || now.offer.choiceRefreshesUsed >= 3) return;
          return send(op, extra);
        }).catch(() => {}).finally(() => { pending = false; });
      } else send(op, extra);
    }
    // Capture is needed only to coordinate Escape with overlay.js's existing bubble handler.
    doc.addEventListener('keydown', handler, true);
    const dispose = () => {
      if (!active) return;
      active = false; doc.removeEventListener('keydown', handler, true);
      if (uninstall === dispose) uninstall = null;
    };
    uninstall = dispose;
    return dispose;
  }
  root.GDD1KEYS = { install, uninstall() { if (uninstall) uninstall(); } };
})(typeof window !== 'undefined' ? window : globalThis);
