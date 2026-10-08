/* Independent presentation preferences. Never dispatches a game command or writes a game save. */
(function (root) {
  'use strict';
  const KEY = 'fog-port.ui.gdd1.settings';
  const defaults = Object.freeze({ masterVolume: 0.7, sfxVolume: 0.65, musicVolume: 0.2,
    speed: 'normal', reducedMotion: false, shake: true, highContrast: false, autosave: true });
  const listeners = new Set();
  let values = normalize(read());
  let contrastBackup = null;
  function read() {
    try {
      if (root.GDD1PREFS) return root.GDD1PREFS.read(KEY, {});
      return JSON.parse(root.localStorage.getItem(KEY) || '{}');
    } catch (_) { return {}; }
  }
  function normalize(raw) {
    const result = Object.assign({}, defaults);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
    for (const key of ['masterVolume', 'sfxVolume', 'musicVolume']) {
      if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) result[key] = Math.max(0, Math.min(1, raw[key]));
    }
    if (['normal', 'fast', 'instant'].includes(raw.speed)) result.speed = raw.speed;
    for (const key of ['reducedMotion', 'shake', 'highContrast', 'autosave']) {
      if (typeof raw[key] === 'boolean') result[key] = raw[key];
    }
    return result;
  }
  function get() { return Object.assign({}, values); }
  // Calling apply again also supports audio/animation modules loaded after this script.
  function apply() {
    const s = root.SFX, a = root.ANIM;
    if (s) {
      if (s.setMaster) s.setMaster(values.masterVolume);
      if (s.setVolume) s.setVolume(values.sfxVolume);
      if (s.setMusicVolume) s.setMusicVolume(values.musicVolume);
    }
    if (a) {
      if (a.setSpeed) a.setSpeed(values.speed);
      if (a.setReducedMotion) a.setReducedMotion(values.reducedMotion);
      if (a.setShake) a.setShake(values.shake);
    }
    const el = root.document && root.document.documentElement;
    if (el) {
      const colors = { '--paper': '#ffffff', '--paper-dim': '#f2f2e8', '--line-dim': '#a9c5c0', '--line-bright': '#d5eee3' };
      if (values.highContrast && !contrastBackup) {
        contrastBackup = {};
        for (const key of Object.keys(colors)) {
          contrastBackup[key] = [el.style.getPropertyValue(key), el.style.getPropertyPriority(key)];
          el.style.setProperty(key, colors[key]);
        }
      } else if (!values.highContrast && contrastBackup) {
        for (const key of Object.keys(contrastBackup)) {
          const old = contrastBackup[key];
          if (old[0]) el.style.setProperty(key, old[0], old[1]); else el.style.removeProperty(key);
        }
        contrastBackup = null;
      }
      el.classList.toggle('gdd1-high-contrast', values.highContrast);
    }
    return get();
  }
  /** set(patch) returns whether the UI preference was persisted; runtime changes still apply on failure. */
  function set(patch) {
    values = normalize(Object.assign({}, values, patch));
    apply();
    let saved = false;
    try {
      if (root.GDD1PREFS) saved = root.GDD1PREFS.write(KEY, values);
      else { root.localStorage.setItem(KEY, JSON.stringify(values)); saved = true; }
    } catch (_) {}
    for (const listener of listeners) { try { listener(get(), saved); } catch (_) {} }
    return saved;
  }
  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('settings.subscribe requires a function');
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function open() {
    const O = root.GDD1OVERLAY;
    if (!O || (root.GDD1CONFIRM && root.GDD1CONFIRM.isOpen()) ||
      (root.GDD1TUTORIAL && root.GDD1TUTORIAL.isActive())) return null;
    // Do not cover a mandatory choice with a new settings dialog.
    const top = O.top();
    if (top) {
      const layer = O.layer(top), close = layer && layer.querySelector('.overlay-close');
      if (!close || close.hidden) return null;
    }
    if (O.isOpen('settings')) return O.body('settings');
    apply();
    const range = (key, label) => '<p><label for="gdd1-setting-' + key + '">' + label
      + '</label> <input id="gdd1-setting-' + key + '" data-setting="' + key
      + '" type="range" min="0" max="100" step="1" value="' + Math.round(values[key] * 100)
      + '"> <output for="gdd1-setting-' + key + '">' + Math.round(values[key] * 100) + '%</output></p>';
    const toggle = (key, label) => '<p><label><input data-setting="' + key + '" type="checkbox"'
      + (values[key] ? ' checked' : '') + '> ' + label + '</label></p>';
    const copy = root.GDD1COPY || {}, buttons = copy.buttons || {};
    let unsubscribe;
    return O.open('settings', { title: '设置', html:
      '<section><h3>声音</h3>' + range('masterVolume', '总音量') + range('sfxVolume', '音效') + range('musicVolume', '音乐')
      + '<p>0 为静音。音乐默认音量为20%；首次点击或按键后开始播放，可随时调整。</p></section>'
      + '<section><h3>表现与辅助</h3><p><label for="gdd1-setting-speed">速度</label> '
      + '<select id="gdd1-setting-speed" data-setting="speed">'
      + [['normal', '正常'], ['fast', '快速'], ['instant', '即时']].map(([id, label]) => '<option value="' + id + '"'
        + (values.speed === id ? ' selected' : '') + '>' + label + '</option>').join('') + '</select></p>'
      + toggle('reducedMotion', '减少动态') + toggle('shake', '屏震') + toggle('highContrast', '对比增强')
      + '<p>减少动态也会遵循系统设置，并停用屏震；关闭后保留所选速度和屏震偏好。</p></section>'
      + '<section><h3>保存</h3>' + toggle('autosave', '自动保存偏好')
      + '<p>开启后，每次有效操作都会自动保存进度。关闭后请在「存档与工具」中手动保存；已有存档仍保留。</p></section>'
      + '<section><h3>快捷键</h3><dl><dt>Space</dt><dd>' + esc(buttons.spin || '运行') + '；选牌时'
      + esc(buttons.skip || '跳过并入账') + '；升级时' + esc(buttons.skipItem || '放弃本局升级')
      + '。演出中仅跳过演出。</dd><dt>1 / 2 / 3</dt><dd>选择对应生产牌或升级。</dd>'
      + '<dt>S</dt><dd>跳过生产牌或升级候选。</dd><dt>R</dt><dd>刷新生产牌候选；消耗保底前仍需确认。</dd>'
      + '<dt>Esc</dt><dd>关闭最上层可关闭的覆盖层。</dd></dl>'
      + '<p>输入框、长按和组合键不会触发快捷键；教程与确认期间请使用界面按钮。候选层支持数字、S 和 R，Esc 不会替你作选择。</p></section>'
      + '<details><summary>本地保存与导入</summary><p>进度保存在当前浏览器，完整模式与精简模式分开保存。导出可备份到文件；导入会恢复备份中的对局。设置与发现记录独立保存在当前设备，不随对局文件转移。</p></details>'
      + '<p data-settings-status role="status" aria-live="polite"></p>',
      onOpen(body) {
        const render = (next, saved) => {
          for (const input of body.querySelectorAll('[data-setting]')) {
            const key = input.dataset.setting;
            if (input.type === 'checkbox') input.checked = next[key];
            else input.value = input.type === 'range' ? Math.round(next[key] * 100) : next[key];
            if (input.type === 'range') input.nextElementSibling.textContent = input.value + '%';
          }
          body.querySelector('[data-settings-status]').textContent = saved ? '设置已保存。' : '设置已应用，但浏览器未能保存；刷新后可能丢失。';
        };
        unsubscribe = subscribe(render);
        function change(event) {
          const input = event.target, key = input.dataset && input.dataset.setting;
          if (!key || (event.type === 'input' && input.type !== 'range')) return;
          const value = input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) / 100 : input.value;
          if (value === values[key]) return;
          set({ [key]: value });
          if (root.SFX && root.SFX.unlock) root.SFX.unlock();
        }
        body.oninput = change; body.onchange = change;
      },
      onClose() { if (unsubscribe) unsubscribe(); }
    });
  }
  root.GDD1SETTINGS = { KEY, defaults, get, set, apply, subscribe, open,
    close() { if (root.GDD1OVERLAY) root.GDD1OVERLAY.close('settings'); },
    isOpen() { return !!(root.GDD1OVERLAY && root.GDD1OVERLAY.isOpen('settings')); } };
  apply();
})(typeof window !== 'undefined' ? window : globalThis);
