/* 玩家可见文案表。纯展示数据，不读写 GDD1 定义或状态。 */
(function (root) {
  'use strict';
  const COPY = {
    gameTitle: '雾港回收工坊',
    profile: {
      default: '完整模式 / 精简模式（试验）',
      full: '完整模式 · 标准难度',
      slice: '精简模式（试验） · 标准难度'
    },
    modes: {
      full: '完整模式',
      slice: '精简模式（试验）',
      difficulty: '标准难度'
    },
    start: {
      title: '雾港回收工坊',
      tagline: '组合赚钱，按期付账，保住工坊',
      identity: '你接手了一间负债的回收工坊。让材料、设备与帮手配合赚钱，在每期截止前付清账单。',
      goal: '付清10期，保住工坊；到期付款时现金不足，本局经营失败。',
      intro: '随机上盘，组合赚钱；每轮选择一张生产牌或跳过，逐步救活工坊。',
      story: '雾港的空气潮湿，铜管边缘结着锈，工坊深处的回收机仍在轰鸣。你接手这间负债工坊时，留下来的材料不多，账单却会按期到来。',
      settle: '现金是已经到账、可以付款的金额；待入账是本轮已算好、尚未加入现金的收益。选择或跳过后才会入账。新选的生产牌不改变本轮已定收益；若本期还有运行，它仍可能在未来运行帮本期赚钱；只有本期最后一轮新增的牌不能补救本期缺口。',
      settleSummary: '现金如何入账',
      startFull: '开始完整模式',
      startSlice: '开始精简模式（试验）',
      continueFull: '继续完整模式',
      continueSlice: '继续精简模式',
      noFullSave: '没有完整模式存档',
      noSliceSave: '没有精简模式存档',
      continueHint: '有存档时可在此继续；完整模式与精简模式分开保存。',
      sliceNote: '仅培育、回收、蒸馏；基础账单约低35%；试验规则，通关记录与完整模式分开。',
      offline: '完全离线。纯虚拟现金。规则 GDD1。',
      skipTutorial: '本局不看教程',
      replayTutorial: '再看一轮教程'
    },
    /* 局内教程（GDD §10.3 六步）。数字由 JS 按当局实际结果替换，{...} 是占位符。 */
    tutorial: {
      title: '局内教程',
      counter: '教程 {n}/6',
      next: '下一步',
      skip: '跳过教程',
      finish: '完成教程',
      done: '六步看完了。以后想再看，可在开场勾「再看一轮教程」。',
      steps: {
        draw: {
          name: '第一步 · 运行抽牌',
          body: '生产牌库现有 {pool} 张；运行会无放回抽取至多 20 张，随机排进 5×4 盘面。',
          hint: '不能手动摆牌；点「运行」开始这一轮。'
        },
        output: {
          name: '第二步 · 普通产出',
          body: '本轮净额 {total} ＝ 普通产出 {ordinary} ＋ 独立奖励 {reward}。',
          hint: '待入账 {pending}：已经算好，还没进现金。'
        },
        choose: {
          name: '第三步 · 选牌或跳过并入账',
          body: '候选：{choices}。选一张会加入生产牌库，从未来运行起才可能上盘。',
          hint: '「跳过并入账」不拿牌，照样提交本轮收益；选或跳过后，待入账 {pending} 才进现金。'
        },
        adjacency: {
          name: '第四步 · 相邻连线',
          body: '本轮有 {count} 处相邻加值或倍率：',
          none: '本轮没有相邻加值——不是每轮都会出现连线。',
          rule: '邻接包括上下、左右和斜角；同时上盘不等于一定相邻。',
          add: '{source} 给 {target} 加值 {amount}',
          multiply: '{source} 让 {target} 产出 ×{ratio}',
          multiplyPlain: '{source} 放大了 {target} 的产出'
        },
        payment: {
          name: '第五步 · 付款倒计时',
          body: '第 {stage}/10 期：本期应付 {payment}，现金 {cash}，本期剩余运行 {remaining}。',
          gap: '现金还差 {gap}，按剩余运行摊到每轮约需 {perSpin}——只是参考，不是保证。',
          enough: '现金已经够本期应付。'
        },
        remove: {
          name: '第六步 · 移除与出现机会',
          body: '生产牌库现有 {pool} 张。移除会移出一张生产牌。',
          small: '生产牌库不超过 20 张：移除不会提高其他生产牌的上盘率——起手 12 张，开局就在这条里。',
          large: '生产牌库超过 20 张：每轮只有至多 20 张上盘，移出低贡献牌可能改善关键件的出现机会。',
          weight: '有抽取权重时，不能把出现机会说成每张一样。',
          cost: '移除消耗 1 张删除券（现有 {tokens} 张），不触发销毁奖励，也不撤销本轮已定收益。',
          noNeed: '本轮不必真的花删除券。'
        }
      }
    },
    chrome: {
      pool: '生产牌库',
      items: '本局升级 / 临时效果',
      ledger: '本轮账本',
      log: '逐格收入与因果日志',
      legacy: '旧局只读摘要',
      menu: '开场',
      codex: '图鉴',
      inspect: '查阅',
      newSlice: '新精简模式',
      newFull: '新完整模式',
      continueSlice: '继续精简模式',
      continueFull: '继续完整模式',
      symbol: '生产牌'
    },
    overlay: {
      close: '关闭'
    },
    codex: {
      title: '图鉴',
      kind: '种类',
      symbols: '生产牌',
      items: '本局升级',
      events: '事件',
      route: '路线',
      rarity: '稀有度',
      seen: '发现',
      all: '全部',
      found: '已发现',
      note: '发现只影响这里的筛选，不改变候选。',
      empty: '没有符合筛选的条目。',
      pick: '点一张卡查阅说明。',
      unknown: '尚未记录',
      unknownHint: '发现后才会写下完整效果。发现不改变候选。'
    },
    details: {
      title: '查阅',
      base: '基础值',
      uid: '技术编号',
      nextAge: '下次阈值',
      missing: '没有可显示的说明。'
    },
    stats: {
      cash: '现金',
      pending: '待入账',
      payment: '本期应付',
      remaining: '本期剩余运行',
      stage: '期',
      basePayment: '基础账单',
      eventAdd: '事件增额',
      advanceAdd: '借支增额'
    },
    phases: {
      READY: '等待运行',
      SYMBOL_CHOICE: '选择生产牌 · 收益待入账',
      ITEM_CHOICE: '已付款 · 选择本局升级',
      EVENT_CHOICE: '新期 · 事件确认'
    },
    win: {
      full: '工坊保住了！你已付清10期账单。',
      slice: '精简模式完成：已付清10期试验账单。',
      sliceNote: '试验模式通关，不代表完整模式通关。'
    },
    lose: {
      title: '本局经营失败：本期账单未付清。',
      payment: '本期应付',
      payable: '可付现金',
      gap: '缺口'
    },
    buttons: {
      spin: '运行',
      skip: '跳过并入账',
      skipItem: '放弃本局升级',
      reroll: '刷新',
      remove: '移除',
      eventA: '确认方案 A',
      eventB: '不参与',
      eventTarget: '选择目标',
      eventCost: '现金费用'
    },
    hints: {
      lastSpin: '选择或跳过后入账并付款；新增生产牌不能补本期缺口',
      symbol: '本轮收益已确定；新选生产牌从未来运行起才可能上盘',
      item: '选择一项本局升级；不上盘，只在本局生效，可放弃',
      refresh: '消耗1刷新券，换整组候选，不改变本轮盘面或待入账',
      emptyBoard: '尚未运行',
      emptyBoardMeta: '从生产牌库抽取至多20张，随机放入5×4盘面'
    },
    tokens: {
      remove: '删除券',
      reroll: '刷新券'
    },
    guarantees: {
      'event-crystal': '本组首位保底精良晶体',
      'item-product': '本组首位保底普通成品',
      'stage-common': '本组首位保底普通'
    },
    counters: {
      age: '上盘次数',
      pressure: '蓄压',
      beat: '拍点计数',
      permanent: '永久成长（本局内）'
    },
    tags: {
      plant: '植物',
      fuel: '燃料',
      scrap: '废料',
      junk: '垃圾',
      machine: '装置',
      resonance: '共鸣',
      crystal: '晶体',
      magic: '异相',
      contract: '契据',
      cargo: '货运',
      pressure: '蓄压类',
      mist: '雾料',
      feedstock: '原液',
      product: '成品',
      support: '支援'
    },
    rarity: {
      common: '普通',
      uncommon: '精良',
      rare: '稀有',
      epic: '史诗'
    },
    stamp: {
      label: '先支邮戳：默认拒绝，仅可在等待运行时切换。每张邮戳每期首次在接受状态下上盘，向本轮待入账发放独立奖励 18（选择或跳过后才入现金），本期账单 +12，并尝试生成待核欠条。拒绝状态下此前上盘不耗资格。生成失败不撤销奖励与义务；关闭或移除也不撤销已经加入的义务。'
    },
    events: {
      event_fog_shift: {
        name: '雾班调换',
        description: '现金费用 4。选择一张带上盘次数的植物生产牌。接下来 2 次合法上盘推进各额外 +1；若本轮自然成熟，额外推进失败且不消耗剩余次数，也不转绑。转换后仅当仍是带上盘次数的植物（凝雾软囊、露灯苞）才保留该修饰。不参与无效果。'
      },
      event_copper_queue: {
        name: '铜屑排队',
        description: '免费。将一张垃圾生产牌转为铜毛刺，保留该张牌的编号与永久成长，并生成一张过役垫圈；生产牌库数量 +1。牌库已满 200 时不可确认方案 A。不参与无效果。'
      },
      event_silent_bell: {
        name: '停鸣通知',
        description: '现金费用 0。选择共鸣目标。本期内前 3 次运行：第 1、2 次全盘共鸣 ×1/2，第 3 次 ×2。即使盘面没有共鸣也会消耗窗口。本期剩余运行须至少 3。不参与无效果。'
      },
      event_brine_inspection: {
        name: '盐雾抽检',
        description: '免费。移除一张原液生产牌，不消耗删除券。下次自然生产牌候选的首位保底精良晶体。不参与无效果。'
      },
      event_empty_manifest: {
        name: '空白夜单',
        description: '免费。生产牌库至少 21 张。移除一张普通且非垃圾的生产牌。本期内第一次运行时，至多 5 张货运生产牌各普通收入 +2；错过第一次运行不补。不参与无效果。'
      },
      event_boiler_test: {
        name: '压锅试鸣',
        description: '现金费用 0。本期应付 +12，立即获得现金 10。给所选带蓄压机制的生产牌蓄压 +2（不超过其上限）；若无合格目标则生成余压软袋并初压 2。本轮不释放。若需生成而牌库已满，不可确认方案 A。不参与无效果。'
      },
      event_misprint_window: {
        name: '错版窗口',
        description: '现金费用 6。本期内前 3 次运行：每次盘面上第一张异相生产牌临时获得货运标签，并普通收入 +2；每轮最多 1 张。盘面无异相则不补。不参与无效果。'
      },
      event_quota_recount: {
        name: '配额复点',
        description: '本期账单 +10。生成一张核清存根，刷新券 +1（上限 9）。生产牌库须少于 200。不参与无效果。'
      }
    },
    confirms: {
      title: '请确认',
      ok: '确认',
      cancel: '取消',
      removeTitle: '移除这张生产牌？',
      remove: '将消耗1张删除券。不撤销本轮已定收益，不触发销毁奖励。',
      removeEmpty: '若这是最后一张，将清空生产牌库。',
      reroll: '刷新将消耗本组保底。继续？',
      newRun: '确认覆盖当前工坊存档？完整模式与精简模式分开保存。'
    },
    notices: {
      newSlice: '精简模式（试验） · 标准难度 · 12张生产牌起手 · 70轮',
      newFull: '完整模式 · 标准难度 · 12张生产牌起手 · 70轮',
      restored: '已恢复'
    }
  };

  function freeze(o) {
    if (!o || typeof o !== 'object' || Object.isFrozen(o)) return o;
    Object.keys(o).forEach(function (k) { freeze(o[k]); });
    return Object.freeze(o);
  }
  freeze(COPY);

  root.GDD1COPY = COPY;
  if (typeof module !== 'undefined' && module.exports) module.exports = COPY;
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
