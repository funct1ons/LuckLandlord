(function (root) {
  'use strict';
  const F = root.GDD1 = root.GDD1 || {};
  F.SCHEMA = 2;
  F.RULES = 'GDD1';
  F.CONTENT = 'GDD1';
  F.SAVE_KEY = 'fog-port.save.v1.gdd1';
  F.LEGACY_KEYS = Object.freeze(['fog-port.save.v1', 'fog-port.save.v1.backup']);
  F.RNG_ALGORITHM = 'fnv1a-utf16le-xorshift32-v1';
  F.STREAMS = Object.freeze(['draw', 'effect', 'symbolOffer', 'itemOffer', 'event']);
  F.STABLE_PHASES = Object.freeze(['READY', 'SYMBOL_CHOICE', 'ITEM_CHOICE', 'EVENT_CHOICE', 'WON', 'LOST']);
  F.PHASES = Object.freeze(['step1/draw', 'step2/tagAdded', 'step3/age', 'step4/appearance',
    'step4/pressure-injection', 'step4/risk', 'step4/copy', 'step5/adjacency-add',
    'step5/structural-event', 'step6/lifecycle', 'step6/pressure-injection',
    'step7/pressure', 'step8/end-summary', 'step9/ledger', 'choice/commit']);
  F.NORMAL_SPINS = Object.freeze([6,6,7,7,7,7,7,7,8,8]);
  // 配额表：2026-10 平衡调整（定稿）。
  //
  // 原表 [70,125,210,320,460,630,850,1120,1460,1880] 经实测（tests/tools/balance-lab.js）
  // 三策略全部 0% 胜率、技能差距 0pp。根因不是"整体太高"，而是【曲线形状】错了：
  //
  //   实测可达收入（中位，tests/tools/derive-payments.js）:
  //     第1期 169 → 第3期 444 → 第4期 470 → 第6期 491 → 第9期 611
  //   收入在第 4 期后基本平坦（盘面固定 20 格，池子增长只增加选择、不增加产出面积），
  //   而原表每期近乎翻倍，后期配额达到可达收入的约 3 倍——数学上不可能通过。
  //
  // 调整方式：让配额跟随【实际可达收入】的形状（先陡后平），取中位收入的 ×0.90。
  // 实测（tests/tools/fit-payments.js，25 局/策略）：
  //   随机选牌 36%、温和删除 92%、激进精简 80%，技能差距 44pp。
  //
  // 与首版尝试的区别：首版只做整体缩放（×0.72），形状不变，因此只把墙挪了位置
  // 而没有解决"后期必然失败"；本版改的是曲线形状。
  // 不改时序、阶段、随机流或存档结构；规则版本仍为 GDD1。
  F.NORMAL_PAYMENTS = Object.freeze([150,265,400,425,445,450,455,475,550,585]);
  // 切片配额 = Normal × 0.65 向上取整（与 F1 契约 §1 一致）
  F.SLICE_PAYMENTS = Object.freeze(F.NORMAL_PAYMENTS.map(x => Math.ceil(x * 65 / 100)));
  const groups = [
    'mist_pouch wick_bed dew_lantern amber_frond fog_stitcher root_ledger warm_pod nursery_gauge',
    'ash_felt sorting_tong copper_burr spent_gasket sieve_drum heat_clerk clinker_router furnace_auditor',
    'dock_chime pitch_fork fog_reed beat_spool chord_frame prism_hum silence_keeper harbor_conductor',
    'brine_strip saline_ampoule condense_coil tide_prism deep_still crystal_index pearl_separator reserve_facet',
    'cargo_rope route_stub parcel_cage sorting_runner manifest_desk switch_lamp transit_seal return_station',
    'pressure_pouch feed_valve pause_dial surge_vessel cracked_regulator safety_shim release_spire demand_coupler',
    'phase_chip spectrum_pin cloudy_negative blank_facet offset_reader alignment_cloth echo_plate split_register',
    'arrears_slip lean_receipt compliance_desk cleared_stub cancellation_clerk quota_margin advance_stamp settlement_beacon'
  ].map(x => x.split(' '));
  F.SYMBOL_IDS = Object.freeze(groups.flat());
  F.ITEM_IDS = Object.freeze(('dew_calendar root_wrap nursery_scale frost_glass sorting_apron waste_log offcut_chute clean_mesh lane_clapper rest_notch pitch_marker shared_metronome brine_lining fraction_gauge jar_rack residue_stamp manifest_clip return_track small_hold exchange_hook pressure_index insulation_shawl release_receipt spare_baffle safe_carbon spectrum_book registration_pin growth_negative low_balance_tab compliance_carbon audit_clip margin_lantern').split(' ').map(x => 'item_' + x));
  F.EVENT_IDS = Object.freeze(('fog_shift copper_queue silent_bell brine_inspection empty_manifest boiler_test misprint_window quota_recount').split(' ').map(x => 'event_' + x));
  F.PROFILES = Object.freeze({
    'full-v1': Object.freeze({symbols:F.SYMBOL_IDS, items:F.ITEM_IDS, events:F.EVENT_IDS, payments:F.NORMAL_PAYMENTS}),
    'slice-abd-v1': Object.freeze({symbols:Object.freeze([...groups[0], ...groups[1], ...groups[3]]),
      items:Object.freeze(('dew_calendar root_wrap frost_glass sorting_apron waste_log offcut_chute clean_mesh brine_lining fraction_gauge residue_stamp').split(' ').map(x => 'item_' + x)),
      events:Object.freeze(['event_fog_shift','event_copper_queue','event_brine_inspection']), payments:F.SLICE_PAYMENTS})
  });
  F.AGE_TYPES = Object.freeze({mist_pouch:3, dew_lantern:2, brine_strip:2, cloudy_negative:3});
  F.PRESSURE_TYPES = Object.freeze({pressure_pouch:4, feed_valve:6, surge_vessel:3, reserve_facet:6});
  F.clone = x => JSON.parse(JSON.stringify(x));
  // A schema scaffold only: deliberately NOT a playable newRun or F2 controller.
  F.createFoundationState = function (seed, profile = 'slice-abd-v1') {
    if (!Object.hasOwn(F.PROFILES,profile) || typeof seed !== 'string' || seed.length > 1024) throw Error('Invalid identity');
    const s = {schema:F.SCHEMA, rules:F.RULES, content:F.CONTENT, saveKey:F.SAVE_KEY,
      rngAlgorithm:F.RNG_ALGORITHM, profile, difficulty:'Normal', seed, rng:F.createRng(seed, profile, 'Normal'),
      revision:0, phase:'READY', stageId:1, spin:0, stageSpin:0, spinsRemaining:6,
      basePayment:F.PROFILES[profile].payments[0], payment:F.PROFILES[profile].payments[0],
      cash:0, pendingSettlement:null, last:null, pool:[], nextUid:1, items:[],
      rerollTokens:2, removeTokens:2, offer:{windowId:0, kind:null, choices:[], choiceRefreshesUsed:0,
        guarantees:{applied:null, stageCommonHandled:false, eventCrystalPending:false, itemProductPending:false}},
      events:{seenIds:[], count:0, cooldownPayments:0, activeModifiers:[], choice:null},
      reservations:[], fractionGaugeReserved:false,
      itemState:{stageId:1, spin:0, quotas:{}, used:{}},
      stageState:{advanceClaims:[], paymentModifiers:[], skipCount:0},
      settings:{autosave:true, advanceAccepted:false}};
    F.validateState(s);
    return s;
  };
})(typeof window !== 'undefined' ? window : globalThis);
