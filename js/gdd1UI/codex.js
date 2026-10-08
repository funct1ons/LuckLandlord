/* 图鉴：查阅 64 / 32 / 8。发现只影响筛选，不改候选。 */
(function (root) {
  'use strict';

  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ROUTES = ['plant', 'scrap', 'resonance', 'distill', 'cargo', 'pressure', 'phase', 'contract'];
  const RARITIES = ['common', 'uncommon', 'rare', 'epic'];

  let filter = { kind: 'symbol', route: '', rarity: '', seen: 'all' };
  let selected = null;

  function cx(path, fb) {
    let v = root.GDD1COPY;
    for (const k of String(path).split('.')) {
      if (!v || typeof v !== 'object') return fb;
      v = v[k];
    }
    return v == null || v === '' ? fb : v;
  }

  function ml(g, id, fb) {
    const m = root.GDD1COPY && root.GDD1COPY[g];
    return m && id != null && m[id] != null && m[id] !== '' ? m[id] : (fb != null ? fb : id);
  }

  function playState() {
    try { return root.GDD1UI && root.GDD1UI.getState ? root.GDD1UI.getState() : null; } catch (e) { return null; }
  }

  function profileId(state) {
    return (state && state.profile) || 'full-v1';
  }

  function defs(state) {
    const F = root.GDD1;
    const profile = profileId(state);
    return F.defs({ profile: profile });
  }

  function idList(kind, state) {
    const F = root.GDD1;
    const p = F.PROFILES[profileId(state)];
    if (!p) return [];
    if (kind === 'item') return p.items.slice();
    if (kind === 'event') return p.events.slice();
    return p.symbols.slice();
  }

  function routeOf(id) {
    return root.ICONS && root.ICONS.routeOf ? root.ICONS.routeOf(id) : null;
  }

  function routeLabel(id) {
    if (root.ICONS && root.ICONS.routeLabel) return root.ICONS.routeLabel(id);
    return id;
  }

  function routeName(route) {
    const I = root.ICONS;
    if (I && I.ROUTES && I.ROUTES[route]) return I.ROUTES[route].label;
    return route;
  }

  function icon(kind, id) {
    const I = root.ICONS;
    if (!I) return '';
    if (kind === 'item') return I.itemSvg(id);
    if (kind === 'symbol') return I.svg(id);
    return '';
  }

  function matches(kind, id, def, state) {
    if (filter.kind !== kind) return false;
    if (kind === 'symbol' && filter.route && routeOf(id) !== filter.route) return false;
    if (filter.rarity && def && def.rarity !== filter.rarity) return false;
    if (filter.seen === 'found') {
      const P = root.GDD1PREFS;
      const bucket = kind === 'item' ? 'items' : kind === 'event' ? 'events' : 'symbols';
      if (P && !P.known(bucket, id)) return false;
    }
    return true;
  }

  function paint() {
    const O = root.GDD1OVERLAY;
    if (!O || !O.isOpen('codex')) return;
    const body = O.body('codex');
    if (!body) return;
    const focus = document.activeElement;
    const selector = focus && focus.dataset.filter ? '[data-filter="'+focus.dataset.filter+'"][data-value="'+focus.dataset.value+'"]' : focus && focus.dataset.codexId ? '[data-codex-id="'+focus.dataset.codexId+'"]' : null;
    body.innerHTML = shell();
    bind(body);
    if(selector && body.querySelector(selector))body.querySelector(selector).focus();
  }

  function chip(name, value, current, label) {
    const on = current === value;
    return '<button type="button" class="codex-chip' + (on ? ' is-on' : '') + '" data-filter="' + esc(name) + '" data-value="' + esc(value) + '"' + (on ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(label) + '</button>';
  }

  function shell() {
    const s = playState();
    const d = defs(s);
    const kind = filter.kind;
    const bag = kind === 'item' ? d.items : kind === 'event' ? d.events : d.symbols;
    const ids = idList(kind, s).filter(id => matches(kind, id, bag[id], s));
    let filters = '<div class="codex-filters">';
    filters += '<div class="codex-row"><span>' + esc(cx('codex.kind', '种类')) + '</span>';
    filters += chip('kind', 'symbol', kind, cx('codex.symbols', '生产牌'));
    filters += chip('kind', 'item', kind, cx('codex.items', '本局升级'));
    filters += chip('kind', 'event', kind, cx('codex.events', '事件'));
    filters += '</div>';
    if (kind === 'symbol') {
      filters += '<div class="codex-row"><span>' + esc(cx('codex.route', '路线')) + '</span>';
      filters += chip('route', '', filter.route, cx('codex.all', '全部'));
      for (let i = 0; i < ROUTES.length; i++) {
        const rt = ROUTES[i];
        if (ids.length || true) filters += chip('route', rt, filter.route, routeName(rt));
      }
      filters += '</div>';
    }
    if (kind !== 'event') {
      filters += '<div class="codex-row"><span>' + esc(cx('codex.rarity', '稀有度')) + '</span>';
      filters += chip('rarity', '', filter.rarity, cx('codex.all', '全部'));
      for (let i = 0; i < RARITIES.length; i++) filters += chip('rarity', RARITIES[i], filter.rarity, ml('rarity', RARITIES[i], RARITIES[i]));
      filters += '</div>';
    }
    filters += '<div class="codex-row"><span>' + esc(cx('codex.seen', '发现')) + '</span>';
    filters += chip('seen', 'all', filter.seen, cx('codex.all', '全部'));
    filters += chip('seen', 'found', filter.seen, cx('codex.found', '已发现'));
    filters += '</div>';
    filters += '<p class="codex-note">' + esc(cx('codex.note', '发现只影响这里的筛选，不改变候选。')) + '</p>';
    filters += '</div>';

    let grid = '<div class="codex-grid" role="list">';
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const def = bag[id] || {};
      const name = root.GDD1TEXT ? root.GDD1TEXT.nameOf(id, kind, s) : (def.name || id);
      const rarity = def.rarity ? ml('rarity', def.rarity, def.rarity) : '';
      const on = selected && selected.kind === kind && selected.id === id;
      const route = kind === 'symbol' ? routeOf(id) : '';
      const bucket = kind === 'item' ? 'items' : kind === 'event' ? 'events' : 'symbols';
      const found = root.GDD1PREFS.known(bucket,id);
      grid += '<button type="button" class="codex-tile' + (!found ? ' undiscovered' : '') + (on ? ' is-on' : '') + '" role="listitem" data-codex-id="' + esc(id) + '" data-codex-kind="' + esc(kind) + '"'
        + (route ? ' data-route="' + esc(route) + '" style="--route-color:var(--route-' + esc(route) + ')"' : '') + '>'
        + icon(kind, id)
        + '<b>' + esc(found ? name : cx('codex.unknown','尚未记录')) + '</b>'
        + (rarity ? '<small>' + esc(rarity) + '</small>' : '')
        + '</button>';
    }
    if (!ids.length) grid += '<p class="codex-empty">' + esc(cx('codex.empty', '没有符合筛选的条目。')) + '</p>';
    grid += '</div>';

    let inspect = '<div class="codex-inspect">';
    if (selected && selected.kind === kind) {
      const bucket=kind==='item'?'items':kind==='event'?'events':'symbols';
      inspect += root.GDD1DETAILS ? root.GDD1DETAILS.html(selected, s, {undiscovered:!root.GDD1PREFS.known(bucket,selected.id)}) : '';
    } else {
      inspect += '<p class="detail-empty">' + esc(cx('codex.pick', '点一张卡查阅说明。')) + '</p>';
    }
    inspect += '</div>';

    return '<div class="codex">' + filters + '<div class="codex-main">' + grid + inspect + '</div></div>';
  }

  function bind(body) {
    body.onclick = function (e) {
      const chipBtn = e.target.closest('[data-filter]');
      if (chipBtn) {
        filter[chipBtn.getAttribute('data-filter')] = chipBtn.getAttribute('data-value');
        selected = null;
        paint();
        return;
      }
      const tile = e.target.closest('[data-codex-id]');
      if (!tile) return;
      selected = { kind: tile.getAttribute('data-codex-kind'), id: tile.getAttribute('data-codex-id') };
      paint();
    };
  }

  function open() {
    const O = root.GDD1OVERLAY;
    if (!O) return;
    selected = null;
    const opener = document.activeElement;
    O.open('codex', {
      title: cx('codex.title', '图鉴'),
      html: '',
      wide: true,
      dismissible: true,
      onOpen: paint,
      onClose: function () {
        if (opener && opener.focus && document.contains(opener)) {
          try { opener.focus(); } catch (e) { /* ignore */ }
        }
      }
    });
    paint();
  }

  function countForTest() {
    const s = playState();
    return {
      symbols: idList('symbol', s).length,
      items: idList('item', s).length,
      events: idList('event', s).length,
      profile: profileId(s)
    };
  }

  root.GDD1CODEX = {
    open: open,
    close: function () { if (root.GDD1OVERLAY) root.GDD1OVERLAY.close('codex'); },
    isOpen: function () { return !!(root.GDD1OVERLAY && root.GDD1OVERLAY.isOpen('codex')); },
    counts: countForTest
  };
})(typeof window !== 'undefined' ? window : globalThis);
