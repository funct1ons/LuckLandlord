/* 可钉住详情层。盘面 / 牌库 / 候选查阅 / 图鉴共用同一套正文。 */
(function (root) {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let pinned = false;

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

  function state() {
    try { return root.GDD1UI && root.GDD1UI.getState ? root.GDD1UI.getState() : null; } catch (e) { return null; }
  }

  function icon(kind, id) {
    const I = root.ICONS;
    if (!I) return '';
    if (kind === 'item') return I.itemSvg(id, 'sym-lg');
    if (kind === 'symbol') return I.svg(id, 'sym-lg');
    return '';
  }

  function instanceOf(s, uid) {
    if (!s || !uid) return null;
    const pool = s.pool || [];
    for (let i = 0; i < pool.length; i++) if (pool[i] && pool[i].uid === uid) return pool[i];
    const board = s.last && s.last.board || [];
    for (let i = 0; i < board.length; i++) if (board[i] && board[i].uid === uid) return board[i];
    return null;
  }

  function payloadFromInspect(raw) {
    const text = String(raw || '');
    const i = text.indexOf(':');
    if (i < 0) return null;
    const kind = text.slice(0, i);
    const id = text.slice(i + 1);
    if (kind === 'uid') return { kind: 'symbol', uid: id, id: null };
    return { kind: kind, id: id, uid: null };
  }

  function resolve(p, s) {
    const T = root.GDD1TEXT;
    const F = root.GDD1;
    const inst = p.uid ? instanceOf(s, p.uid) : null;
    const id = p.id || (inst && inst.type);
    const kind = p.kind || 'symbol';
    const def = T ? T.defOf(id, kind, s) : null;
    return { kind: kind, id: id, inst: inst, def: def, s: s };
  }

  function counterLine(inst, def) {
    if (!inst) return '';
    const F = root.GDD1;
    const bits = [];
    bits.push(esc(cx('counters.permanent', '永久成长（本局内）')) + ' +' + inst.permanent);
    const c = inst.counters || {};
    if (Object.prototype.hasOwnProperty.call(c, 'age')) {
      const next = def && def.mechanics && def.mechanics.age && def.mechanics.age.threshold;
      bits.push(esc(cx('counters.age', '上盘次数')) + ' ' + c.age + (next != null ? ' / ' + next : ''));
      if (next != null) bits.push(esc(cx('details.nextAge', '下次阈值')) + ' ' + next);
    }
    if (Object.prototype.hasOwnProperty.call(c, 'pressure')) {
      const cap = def && def.mechanics && def.mechanics.pressure && def.mechanics.pressure.cap;
      bits.push(esc(cx('counters.pressure', '蓄压')) + ' ' + c.pressure + (cap != null ? ' / ' + cap : ''));
    }
    if (Object.prototype.hasOwnProperty.call(c, 'beat')) {
      const s=state(),reduced=s&&s.items.some(id=>{const d=F.defs(s).items[id];return d.mechanics&&d.mechanics.cycleThresholdReduction;});
      const threshold=Math.max(2,(def.mechanics&&def.mechanics.cycle_count||3)-(reduced?1:0));
      bits.push(esc(cx('counters.beat', '拍点计数')) + ' ' + c.beat + ' / ' + threshold);
    }
    return bits.join(' · ');
  }

  function html(p, s, opts) {
    opts = opts || {};
    const T = root.GDD1TEXT;
    const I = root.ICONS;
    const got = resolve(p, s);
    if (!got.id && !got.def) {
      return '<p class="detail-empty">' + esc(cx('details.missing', '没有可显示的说明。')) + '</p>';
    }
    const kind = got.kind;
    const id = got.id;
    const def = got.def || {};
    const name = T ? T.nameOf(id, kind, s) : (def.name || id);
    const rarity = def.rarity ? ml('rarity', def.rarity, def.rarity) : '';
    const tags = (def.tags || []).map(t => T ? T.tagLabel(t) : t);
    const route = kind === 'symbol' && I && I.routeLabel ? I.routeLabel(id) : '';
    const purpose = T ? T.purpose(id, kind, s) : '';
    const effect = T ? T.effect(id, kind, s) : (def.description || '');
    const copyNote = kind === 'symbol' && T ? T.copyableNote(def) : '';
    let body = '<div class="detail-card" data-kind="' + esc(kind) + '" data-id="' + esc(id || '') + '">';
    body += '<div class="detail-hero">' + icon(kind, id) + '<div>';
    body += '<h3>' + esc(name) + '</h3>';
    body += '<p class="detail-purpose">' + esc(purpose) + '</p>';
    body += '<p class="detail-meta">';
    if (rarity) body += '<span>' + esc(rarity) + '</span>';
    if (route) body += '<span>' + esc(route) + '</span>';
    if (def.base != null && kind === 'symbol') body += '<span>' + esc(cx('details.base', '基础值')) + ' ' + def.base + '</span>';
    if (kind === 'event' && def.cost != null) body += '<span>' + esc(cx('buttons.eventCost', '现金费用')) + ' ' + def.cost + '</span>';
    body += '</p>';
    if (tags.length) body += '<p class="detail-tags">' + tags.map(t => '<span>' + esc(t) + '</span>').join('') + '</p>';
    body += '</div></div>';
    body += '<p class="detail-effect">' + esc(effect) + '</p>';
    if (got.inst) {
      const line = counterLine(got.inst, def);
      if (line) body += '<p class="detail-counters">' + line + '</p>';
      body += '<p class="detail-uid">' + esc(cx('details.uid', '技术编号')) + ' ' + esc(got.inst.uid) + '</p>';
    }
    if (copyNote) body += '<p class="detail-copy">' + esc(copyNote) + '</p>';
    if (opts.undiscovered) {
      body = '<div class="detail-card undiscovered"><div class="detail-hero">' + icon(kind, id)
        + '<div><h3>' + esc(cx('codex.unknown', '尚未记录')) + '</h3>'
        + '<p class="detail-purpose">' + esc(cx('codex.unknownHint', '发现后才会写下完整效果。发现不改变候选。')) + '</p></div></div></div>';
    }
    return body;
  }

  function open(p, opts) {
    opts = opts || {};
    const O = root.GDD1OVERLAY;
    if (!O) return;
    const s = state();
    const T = root.GDD1TEXT;
    const got = resolve(p, s);
    const title = (got.id && T) ? T.nameOf(got.id, got.kind, s) : cx('details.title', '查阅');
    hidePreview();
    pinned = true;
    O.open('details', {
      title: title,
      html: html(p, s, opts),
      drawer: true,
      dismissible: true,
      onClose: function () { pinned = false; }
    });
  }

  function close() {
    const O = root.GDD1OVERLAY;
    if (O && O.isOpen('details')) O.close('details');
    pinned = false;
  }

  function fromEventTarget(target) {
    if (!target || !target.closest) return null;
    if (target.closest('button.remove, button[data-op="remove"]')) return null;
    const ins = target.closest('[data-inspect]');
    if (ins) return payloadFromInspect(ins.getAttribute('data-inspect'));
    const cell = target.closest('#board .cell[data-uid],#overlay-board .cell[data-uid]');
    if (cell && !cell.classList.contains('empty')) return { kind: 'symbol', uid: cell.getAttribute('data-uid') };
    const row = target.closest('#pool .pool-row[data-uid]');
    if (row) return { kind: 'symbol', uid: row.getAttribute('data-uid') };
    const item = target.closest('#items .item-row[data-item]');
    if (item) return { kind: 'item', id: item.getAttribute('data-item') };
    return null;
  }

  document.addEventListener('click', function (e) {
    const ins = e.target.closest && e.target.closest('[data-inspect]');
    if (ins) {
      e.preventDefault();
      e.stopPropagation();
      const p = payloadFromInspect(ins.getAttribute('data-inspect'));
      if (p) open(p, { preview: false });
      return;
    }
    if (e.target.closest && (e.target.closest('#confirm-dialog, #coach, #welcome') || (e.target.closest('.overlay-layer') && !e.target.closest('#overlay-pool,#overlay-board')))) return;
    const p = fromEventTarget(e.target);
    if (!p) return;
    if (e.target.closest('button[data-op]')) return;
    open(p, { preview: false });
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const inspect=e.target.closest&&e.target.closest('[data-inspect]');
    if(inspect){e.preventDefault();e.stopPropagation();open(payloadFromInspect(inspect.getAttribute('data-inspect')),{preview:false});return;}
    const p = fromEventTarget(e.target);
    if (!p) return;
    if (e.target.closest && e.target.closest('button[data-op], input, select, textarea')) return;
    e.preventDefault();
    open(p, { preview: false });
  });

  let previewTimer=null,previewEl=null;
  function hidePreview(){clearTimeout(previewTimer);if(previewEl)previewEl.remove();previewEl=null;}
  document.addEventListener('pointerover',e=>{
    if(root.innerWidth<760||e.pointerType==='touch'||pinned||e.target.closest('#overlay-root,#coach'))return;
    const p=fromEventTarget(e.target);if(!p)return;
    hidePreview();
    previewTimer=setTimeout(()=>{
      previewEl=document.createElement('div');previewEl.className='detail-preview';previewEl.setAttribute('role','tooltip');
      previewEl.innerHTML=html(p,state(),{});document.body.appendChild(previewEl);
      const r=e.target.getBoundingClientRect(),w=previewEl.offsetWidth,h=previewEl.offsetHeight;
      previewEl.style.left=Math.max(8,Math.min(root.innerWidth-w-8,r.right+12))+'px';
      previewEl.style.top=Math.max(8,Math.min(root.innerHeight-h-8,r.top))+'px';
    },250);
  });
  document.addEventListener('pointerout',hidePreview);
  document.addEventListener('keydown',hidePreview);
  document.addEventListener('scroll',hidePreview,true);
  root.GDD1DETAILS = {
    open: open,
    close: close,
    html: html,
    isPinned: () => pinned
  };
})(typeof window !== 'undefined' ? window : globalThis);
