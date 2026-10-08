(function (G) {
  "use strict";
  const e = (trigger, action, extra = {}) =>
    Object.assign(
      { trigger, action, scope: "self", target: "self", priority: 0 },
      extra,
    );
  G.tags = [
    "plant",
    "fuel",
    "scrap",
    "junk",
    "machine",
    "resonance",
    "crystal",
    "magic",
    "contract",
    "cargo",
    "pressure",
    "mist",
    "feedstock",
    "product",
    "support",
  ];
  const formal = [
    ["mist_pouch", "mist_pouch", 1, ["plant", "mist"], "grow"],
    ["wick_bed", "wick_bed", 2, ["plant", "fuel"]],
    ["dew_lantern", "dew_lantern", 3, ["plant", "mist", "product"], "grow"],
    [
      "amber_frond",
      "鐞ラ湶鎵囧彾",
      4,
      ["plant", "fuel", "product", "cargo"],
      "consume",
    ],
    ["fog_stitcher", "fog_stitcher", 1, ["machine", "support"], "adjplant"],
    ["root_ledger", "root_ledger", 1, ["plant", "contract"], "convertgrow"],
    ["warm_pod", "warm_pod", 1, ["plant", "pressure"], "fuelfour"],
    ["nursery_gauge", "nursery_gauge", 2, ["machine", "plant"], "plantmult"],
    ["ash_felt", "ash_felt", 1, ["scrap", "fuel"], "consume"],
    ["sorting_tong", "sorting_tong", 1, ["machine"], "consumescrap"],
    ["copper_burr", "copper_burr", 2, ["scrap", "product", "cargo"], "machadd"],
    ["spent_gasket", "spent_gasket", -1, ["scrap", "junk"]],
    ["sieve_drum", "sieve_drum", 2, ["machine", "support"], "junkconvert"],
    ["heat_clerk", "heat_clerk", 1, ["machine", "contract"], "scrapgrow"],
    ["clinker_router", "clinker_router", 2, ["machine", "pressure"], "junkdestroy"],
    ["furnace_auditor", "furnace_auditor", 2, ["machine"], "scrapmult"],
    ["dock_chime", "dock_chime", 2, ["resonance", "cargo"], "rescount"],
    ["pitch_fork", "pitch_fork", 1, ["resonance", "support"], "adjres"],
    ["fog_reed", "fog_reed", 1, ["resonance", "mist"], "adjmist"],
    ["beat_spool", "beat_spool", 1, ["resonance", "machine"], "cycle"],
    ["chord_frame", "chord_frame", 2, ["resonance", "machine"], "resmult"],
    ["prism_hum", "prism_hum", 2, ["resonance", "crystal"], "adjcrystal"],
    ["silence_keeper", "silence_keeper", 1, ["resonance", "contract"], "sparse"],
    ["harbor_conductor", "harbor_conductor", 2, ["resonance"], "resmult"],
    ["brine_strip", "brine_strip", 1, ["mist", "feedstock"], "grow"],
    ["saline_ampoule", "saline_ampoule", 2, ["feedstock", "cargo"]],
    ["condense_coil", "condense_coil", 1, ["machine"], "feedconvert"],
    [
      "tide_prism",
      "娼１鍧?",
      4,
      ["crystal", "product", "cargo"],
      "transformadd",
    ],
    ["deep_still", "deep_still", 2, ["machine"], "consumemist"],
    ["crystal_index", "crystal_index", 1, ["crystal", "support"], "crystalcount"],
    ["pearl_separator", "pearl_separator", 2, ["machine"], "crystalconvert"],
    ["reserve_facet", "reserve_facet", 2, ["crystal", "pressure"], "fuelpressure"],
    ["cargo_rope", "cargo_rope", 1, ["cargo", "support"], "adjproduct"],
    ["route_stub", "route_stub", 2, ["cargo", "contract"], "cargocount"],
    ["parcel_cage", "parcel_cage", 2, ["cargo", "machine"], "empties"],
    ["sorting_runner", "sorting_runner", 1, ["cargo"], "consumeproduct"],
    ["manifest_desk", "manifest_desk", 2, ["cargo", "contract"], "cargomult"],
    ["switch_lamp", "switch_lamp", 1, ["cargo", "machine"], "reserve"],
    ["transit_seal", "transit_seal", 2, ["cargo", "magic"], "wildtag"],
    ["return_station", "return_station", 2, ["cargo", "machine"], "returnreward"],
    ["pressure_pouch", "pressure_pouch", 1, ["pressure"], "pressure"],
    ["feed_valve", "feed_valve", 1, ["machine", "pressure"], "fuelpressure"],
    ["pause_dial", "pause_dial", 2, ["pressure", "support"], "copyadd"],
    ["surge_vessel", "surge_vessel", 1, ["pressure", "machine"], "release"],
    ["cracked_regulator", "cracked_regulator", 2, ["pressure", "machine"], "risk"],
    ["safety_shim", "safety_shim", 1, ["pressure", "support"], "riskguard"],
    ["release_spire", "release_spire", 2, ["pressure", "machine"], "releaseboost"],
    ["demand_coupler", "demand_coupler", 1, ["pressure", "contract"], "lowcash"],
    ["phase_chip", "phase_chip", 2, ["magic"], "wildtag"],
    ["spectrum_pin", "spectrum_pin", 1, ["magic", "support"], "typediversity"],
    ["cloudy_negative", "cloudy_negative", 1, ["magic", "feedstock"], "grow"],
    ["blank_facet", "blank_facet", 3, ["magic", "crystal"], "copyadd"],
    ["offset_reader", "offset_reader", 1, ["magic", "machine"], "copy"],
    ["alignment_cloth", "alignment_cloth", 1, ["magic", "support"], "tagbonus"],
    ["echo_plate", "echo_plate", 1, ["magic", "resonance"], "growbonus"],
    ["split_register", "split_register", 2, ["magic", "contract"], "productmult"],
    ["arrears_slip", "arrears_slip", -1, ["contract", "junk"]],
    ["lean_receipt", "lean_receipt", 1, ["contract"], "lowcash"],
    ["compliance_desk", "compliance_desk", 1, ["contract", "machine"], "junkconvert"],
    [
      "cleared_stub",
      "鏍告竻瀛樻牴",
      3,
      ["contract", "product", "cargo"],
      "copyadd",
    ],
    ["cancellation_clerk", "cancellation_clerk", 1, ["contract"], "consumejunk"],
    ["quota_margin", "quota_margin", 2, ["contract", "pressure"], "lowcash"],
    ["advance_stamp", "advance_stamp", 2, ["contract"], "stagebonus"],
    ["settlement_beacon", "settlement_beacon", 2, ["contract", "machine"], "cleanmult"],
  ];
  const proto = [
    ["slag", "slag", 1, ["scrap"]],
    ["hook", "hook", 1, ["machine"], "consumescrap"],
    ["echo", "echo", 1, ["resonance"]],
    ["meter", "meter", 1, ["machine"]],
    ["lens", "lens", 1, ["resonance"]],
    ["bud", "bud", 1, ["plant"], "grow"],
    ["bloom", "bloom", 3, ["plant", "fuel"]],
    ["still", "still", 1, ["machine"]],
    ["crystal", "crystal", 4, ["crystal"]],
    ["tuner", "tuner", 1, ["resonance"], "adjres"],
    ["press", "press", 1, ["machine"]],
    ["mirror", "mirror", 1, ["magic"], "copy"],
    ["spark", "spark", 0, ["fuel"]],
    ["warden", "warden", 1, ["machine"]],
    ["seedbox", "seedbox", 1, ["plant"]],
    ["wild", "wild", 1, ["magic"], "wildtag"],
    ["gambit", "gambit", 1, ["machine"], "risk"],
    ["voucher", "voucher", 1, ["contract"], "lowcash"],
    ["rust", "rust", -1, ["scrap", "junk"]],
    ["battery", "battery", 2, ["machine"]],
  ];
  G.symbols = {};
  function make(r, i, formalFlag) {
    const [id, name, base, tags, kind] = r;
    let effects = [];
    if (kind === "grow")
      effects = [
        e("ON_APPEAR", "age", {
          to:
            id === "mist_pouch"
              ? "dew_lantern"
              : id === "dew_lantern"
                ? "amber_frond"
                : id === "brine_strip"
                  ? "saline_ampoule"
                  : "bloom",
          threshold: 2,
          priority: 10,
        }),
      ];
    if (kind === "consumescrap")
      effects = [
        e("ON_ADJACENT", "consume", {
          target: "adj:scrap",
          amount: 6,
          priority: 10,
        }),
      ];
    if (kind === "consume")
      effects = [
        e("ON_CONSUME", "add", { scope: "event", amount: 4, emit: "ON_GAIN" }),
      ];
    if (kind === "adjres")
      effects = [
        e("ON_ADJACENT", "add", { target: "adj:resonance", amount: 3 }),
      ];
    if (kind === "adjmist")
      effects = [e("ON_ADJACENT", "add", { target: "adj:mist", amount: 3 })];
    if (kind === "adjplant")
      effects = [e("ON_ADJACENT", "add", { target: "adj:plant", amount: 2 })];
    if (kind === "adjproduct")
      effects = [e("ON_ADJACENT", "add", { target: "adj:product", amount: 3 })];
    if (kind === "machadd")
      effects = [e("ON_ADJACENT", "add", { target: "adj:machine", amount: 2 })];
    if (
      kind === "resmult" ||
      kind === "cargomult" ||
      kind === "cleanmult" ||
      kind === "productmult" ||
      kind === "plantmult"
    )
      effects = [
        e("ON_ADJACENT", "multiply", {
          target:
            "adj:" +
            ({
              resmult: "resonance",
              cargomult: "cargo",
              cleanmult: "contract",
              productmult: "product",
              plantmult: "plant",
            }[kind] || "resonance"),
          ratio: [3, 2],
          priority: 20,
        }),
      ];
    if (kind === "risk")
      effects = [e("ON_APPEAR", "risk", { chance: 0.75, amount: 8, loss: -6 })];
    if (kind === "lowcash")
      effects = [e("ON_APPEAR", "condition", { threshold: 50, amount: 4 })];
    if (kind === "copyadd")
      effects = [e("ON_APPEAR", "add", { amount: 2, copyable: true })];
    if (kind === "copy")
      effects = [e("ON_APPEAR", "copy", { target: "adj:machine" })];
    if (kind === "junkdestroy")
      effects = [
        e("ON_ADJACENT", "destroy", { target: "adj:junk", priority: 10 }),
      ];
    if (kind === "consumejunk")
      effects = [
        e("ON_ADJACENT", "consume", {
          target: "adj:junk",
          amount: 5,
          priority: 10,
        }),
      ];
    if (kind === "junkconvert")
      effects = [
        e("ON_ADJACENT", "transform", {
          target: "adj:junk",
          to: "cleared_stub",
          priority: 10,
        }),
      ];
    if (kind === "feedconvert")
      effects = [
        e("ON_ADJACENT", "transform", {
          target: "adj:feedstock",
          to: "tide_prism",
          priority: 10,
        }),
      ];
    if (kind === "consumemist")
      effects = [
        e("ON_ADJACENT", "consume", {
          target: "adj:mist",
          amount: 4,
          priority: 10,
        }),
      ];
    if (kind === "fuelpressure")
      effects = [e("ON_ADJACENT", "add", { target: "adj:fuel", amount: 3 })];
    if (kind === "pressure") effects = [e("ON_APPEAR", "add", { amount: 3 })];
    if (kind === "release") effects = [e("ON_APPEAR", "add", { amount: 5 })];
    if (
      kind === "typediversity" ||
      kind === "rescount" ||
      kind === "cargocount" ||
      kind === "crystalcount" ||
      kind === "empties" ||
      kind === "sparse" ||
      kind === "returnreward" ||
      kind === "stagebonus" ||
      kind === "tagbonus" ||
      kind === "growbonus" ||
      kind === "reserve" ||
      kind === "wildtag" ||
      kind === "transformadd" ||
      kind === "cycle" ||
      kind === "lowcash"
    )
      effects.push(
        e("ON_APPEAR", "add", { amount: kind === "sparse" ? 8 : 2 }),
      );
    return {
      id,
      name,
      baseValue: base,
      tags,
      effects,
      triggers: [...new Set(effects.map((x) => x.trigger))],
      rarity: formalFlag
        ? i < 26
          ? "common"
          : i < 47
            ? "uncommon"
            : i < 62
              ? "rare"
              : "epic"
        : i < 10
          ? "common"
          : i < 18
            ? "uncommon"
            : "rare",
      icon: String(i + 1).padStart(2, "0"),
      description: formalFlag
        ? "Formal content: " + name + " via " + (kind || "base")
        : effects.length
          ? effects.map((x) => x.trigger + ": " + x.action).join("; ")
          : "绋冲畾鍩虹浜у嚭",
      formal: !!formalFlag,
    };
  }
  formal.forEach((r, i) => (G.symbols[r[0]] = make(r, i, true)));
  proto.forEach((r, i) => (G.symbols[r[0]] = make(r, i, false)));
  // Preserve the audited M0-M2 prototype semantics for regression fixtures.
  const pe = {
    slag: [],
    hook: [
      e("ON_ADJACENT", "consume", {
        target: "adj:scrap",
        amount: 5,
        priority: 10,
      }),
    ],
    echo: [
      e("ON_CONSUME", "add", { scope: "event", amount: 2, emit: "ON_GAIN" }),
    ],
    meter: [
      e("ON_GAIN", "grow", { scope: "event", amount: 1, emit: "ON_GROW" }),
    ],
    lens: [e("ON_GROW", "multiply", { scope: "event", ratio: [2, 1] })],
    bud: [e("ON_APPEAR", "age", { to: "bloom", threshold: 2, priority: 10 })],
    bloom: [],
    still: [
      e("ON_ADJACENT", "transform", {
        target: "adj:fuel",
        to: "crystal",
        priority: 10,
      }),
    ],
    crystal: [e("ON_TRANSFORM", "add", { amount: 2, emit: "ON_GAIN" })],
    tuner: [e("ON_ADJACENT", "add", { target: "adj:resonance", amount: 2 })],
    press: [
      e("ON_ADJACENT", "multiply", {
        target: "adj:machine",
        ratio: [3, 2],
        priority: 20,
      }),
    ],
    mirror: [e("ON_APPEAR", "copy", { target: "adj:machine" })],
    spark: [
      e("ON_APPEAR", "add", { amount: 6 }),
      e("ON_ADJACENT", "destroy", { priority: 10, emit: "ON_GAIN" }),
    ],
    warden: [
      e("ON_DESTROY", "add", { scope: "event", amount: 3, emit: "ON_GAIN" }),
    ],
    seedbox: [e("ON_APPEAR", "spawn", { to: "bud", priority: 10 })],
    wild: [e("ON_APPEAR", "tag", { tag: "resonance", priority: -10 })],
    gambit: [e("ON_APPEAR", "risk", { chance: 0.75, amount: 5, loss: -4 })],
    voucher: [e("ON_APPEAR", "condition", { threshold: 50, amount: 3 })],
    rust: [],
    battery: [e("ON_APPEAR", "add", { amount: 2 })],
  };
  Object.keys(pe).forEach((id) => {
    G.symbols[id].effects = pe[id];
    G.symbols[id].triggers = [...new Set(pe[id].map((x) => x.trigger))];
  });
  // M3 formal A/B/D effects: explicit reusable primitives, no kind fallback.
  const fe = (t,a,o={}) => e(t,a,Object.assign({priority:0},o));
  const one = (area,tags,extra={}) => Object.assign({area,tagsAny:tags,count:'1',excludeSelf:true},extra);
  const formalM3 = {
    mist_pouch:[fe('ON_APPEAR','age',{to:'dew_lantern',threshold:3})],
    wick_bed:[],
    sorting_runner:[fe('ON_ADJACENT','consume',{selector:one('adj',['product']),amount:6,limit:{perSpin:1}})],
    dew_lantern:[fe('ON_APPEAR','age',{to:'amber_frond',threshold:2})],
    amber_frond:[fe('ON_CONSUME','reward',{scope:'event',target:'self',reward:4,when:{eventSourceSelf:true}})],
    fog_stitcher:[fe('ON_ADJACENT','counter',{selector:one('adj',['plant']),name:'age',delta:1,limit:{perSpin:1}})],
    root_ledger:[fe('ON_TRANSFORM','grow',{scope:'event',target:'self',amount:1,when:{eventTargetTags:['plant']},limit:{perSpin:2}})],
    warm_pod:[fe('ON_APPEAR','add',{target:'self',amount:3,when:{neighbor:{tags:['fuel']}}})],
    nursery_gauge:[fe('ON_END_SPIN','multiply',{target:{area:'board',tagsAny:['plant'],count:'all'},ratio:[3,2],when:{plantConvertCount:2},limit:{perSpin:1}})],
    ash_felt:[fe('ON_APPEAR','counter',{target:'self',name:'age',delta:1}),fe('ON_CONSUME','spawn',{scope:'event',target:'self',to:'copper_burr'}),fe('ON_END_SPIN','destroy',{target:'self',when:{counter:{name:'age',at:3}},cause:'self_mature'}),fe('ON_DESTROY','reward',{scope:'event',target:'self',when:{eventCause:'self_mature'},reward:3})],
    sorting_tong:[fe('ON_ADJACENT','consume',{selector:one('adj',['scrap']),amount:6,fallbackReward:1,limit:{perSpin:1}})],
    copper_burr:[fe('ON_APPEAR','add',{target:'self',amount:2,when:{neighbor:{tags:['machine']}}})],
    spent_gasket:[],
    sieve_drum:[fe('ON_ADJACENT','transform',{selector:one('adj',['junk']),to:'copper_burr',limit:{perSpin:1}})],
    heat_clerk:[fe('ON_CONSUME','grow',{scope:'event',target:'self',amount:1,when:{eventTargetTags:['scrap']},limit:{perSpin:1}})],
    clinker_router:[fe('ON_ADJACENT','destroy',{selector:one('adj',['junk']),limit:{perSpin:1}}),fe('ON_DESTROY','counter',{scope:'event',target:{area:'board',tagsAny:['pressure'],count:'1',order:'position'},name:'pressure',delta:2,max:6,when:{all:[{eventCause:'destroy'},{eventTargetTags:['junk']}]},limit:{perSpin:1}}) ],
    furnace_auditor:[fe('ON_END_SPIN','multiply',{target:{area:'board',tagsAny:['machine'],count:'all'},ratio:[3,2],when:{uniqueTypeCount:{area:'board',tags:['scrap'],at:2}},limit:{perSpin:1}})],
    brine_strip:[fe('ON_APPEAR','age',{to:'saline_ampoule',threshold:2})],
    saline_ampoule:[],
    condense_coil:[fe('ON_ADJACENT','transform',{selector:one('adj',['feedstock']),to:'tide_prism',limit:{perSpin:1}})],
    tide_prism:[fe('ON_TRANSFORM','add',{scope:'event',target:'self',amount:3,when:{eventTargetType:'tide_prism'}})],
    deep_still:[fe('ON_ADJACENT','consume',{selector:one('adj',['mist']),amount:4,limit:{perSpin:1}}),fe('ON_CONSUME','spawn',{scope:'event',target:'self',to:'saline_ampoule',when:{eventTargetTags:['mist']}})],
    crystal_index:[fe('ON_APPEAR','add',{target:'self',amount:6,when:{uniqueTypeCount:{tags:['crystal'],at:2}}})],
    pearl_separator:[fe('ON_ADJACENT','transform',{selector:one('adj',['crystal'],{excludeTags:['product']}),to:'tide_prism',limit:{perSpin:1}})],
    reserve_facet:[fe('ON_ADJACENT','consume',{selector:one('adj',['fuel']),amount:2,limit:{perSpin:1}}),fe('ON_CONSUME','counter',{scope:'event',target:'self',name:'pressure',delta:2,max:6,when:{all:[{eventTargetTags:['fuel']},{eventSourceSelf:true}]}}),fe('ON_END_SPIN','counter',{target:'self',name:'pressure',at:6,release:true,reward:18,when:{counter:{name:'pressure',at:6}}})],
    dock_chime:[fe('ON_APPEAR','add',{target:'self',amount:{count:{area:'row',tags:['resonance'],excludeSelf:true,uniqueTypes:true,max:3}}})],
    pitch_fork:[fe('ON_ADJACENT','add',{selector:one('adj',['resonance']),amount:3})],
    fog_reed:[fe('ON_APPEAR','add',{target:'self',amount:3,when:{neighbor:{tags:['mist']}}})],
    beat_spool:[fe('ON_APPEAR','cycle',{target:'self',name:'beat',threshold:3,amount:9,reset:0})],
    chord_frame:[fe('ON_APPEAR','multiply',{selector:one('adj',['resonance']),ratio:[2,1],when:{rowUniqueTypeCount:{tags:['resonance'],excludeSelf:true,at:2}}})],
    prism_hum:[fe('ON_APPEAR','add',{target:'self',amount:4,when:{neighbor:{tags:['crystal']}}})],
    silence_keeper:[fe('ON_APPEAR','add',{target:'self',amount:10,when:{rowUniqueTypeCount:{tags:['resonance'],exact:1}}})],
    harbor_conductor:[fe('ON_APPEAR','multiply',{target:{area:'row',tagsAny:['resonance'],count:'all'},ratio:[2,1],when:{rowUniqueTypeCount:{tags:['resonance'],at:3}},limit:{perSpin:1}})],
    cargo_rope:[fe('ON_ADJACENT','add',{target:{area:'row',tagsAny:['product'],count:'1',excludeSelf:true},amount:3,limit:{perSpin:1}})],
    route_stub:[fe('ON_APPEAR','add',{target:'self',amount:4,when:{uniqueTypeCount:{tags:['cargo'],at:3}}})],
    parcel_cage:[fe('ON_APPEAR','add',{target:'self',amount:3,when:{poolSize:4}})],
    sorting_runner:[fe('ON_ADJACENT','consume',{selector:one('adj',['product']),amount:6,rewardBaseTarget:true,limit:{perSpin:1}})],
    manifest_desk:[fe('ON_APPEAR','multiply',{target:'self',ratio:[3,1],when:{uniqueTypeCount:{tags:['cargo'],at:4}},limit:{perSpin:1}})],
    switch_lamp:[fe('ON_ADJACENT','reserve',{selector:one('adj',['product']),limit:{perSpin:1}})],
    transit_seal:[fe('ON_APPEAR','tag',{target:'self',chooseTags:['plant','crystal','resonance'],temporary:true,neighborCount:true})],
    return_station:[fe('ON_CONSUME','reward',{scope:'event',target:'self',reward:8,when:{eventSourceNeighborTag:'cargo'},limit:{perSpin:1}})],
    cloudy_negative:[fe('ON_APPEAR','age',{to:'blank_facet',threshold:3})],
    pressure_pouch:[fe('ON_APPEAR','counter',{target:'self',name:'pressure',delta:1,max:4,at:4,reward:10,reset:0,limit:{perSpin:1}})],
    feed_valve:[fe('ON_ADJACENT','consume',{selector:one('adj',['fuel']),amount:3,limit:{perSpin:1}}),fe('ON_CONSUME','counter',{scope:'event',target:'self',name:'pressure',delta:2,max:6,at:6,reward:14,reset:0,when:{eventSourceSelf:true},limit:{perSpin:1}})],
    pause_dial:[fe('ON_APPEAR','add',{target:'self',amount:1,copyable:true}),fe('ON_APPEAR','add',{target:'self',amount:2,when:{neighbor:{tags:['pressure']}},copyable:false,limit:{perSpin:1}})],
    surge_vessel:[fe('ON_APPEAR','counter',{target:'self',name:'pressure',delta:1,max:3,at:3,reward:16,reset:0,limit:{perSpin:1}}),fe('ON_APPEAR','suppress',{target:'self'})],
    cracked_regulator:[fe('ON_APPEAR','risk',{target:'self',chance:0.75,amount:8,loss:-6,guardReduction:4,spawnOnFail:'spent_gasket',limit:{perSpin:1}})],
    safety_shim:[fe('ON_APPEAR','riskGuard',{target:'self',priority:-30})],
    release_spire:[fe('ON_ADJACENT','releasePressure',{selector:{area:'adj',tagsAny:['pressure'],count:'1',excludeSelf:true},amount:3,ratio:[3,1],priority:-20,limit:{perSpin:1}})],
    demand_coupler:[fe('ON_APPEAR','multiply',{target:'self',ratio:[4,1],when:{all:[{lowCash:true},{stageSpinsRemaining:2}]},limit:{perSpin:1}}),fe('ON_APPEAR','spawn',{target:'self',to:'spent_gasket',when:{all:[{lowCash:true},{stageSpinsRemaining:2}]},limit:{perSpin:1}})]
  };
  Object.keys(formalM3).forEach(id=>{G.symbols[id].effects=formalM3[id];G.symbols[id].triggers=[...new Set(formalM3[id].map(x=>x.trigger))];});

  G.prototypeSymbolIds = proto.map((x) => x[0]);
  G.formalSymbolIds = formal.map((x) => x[0]);
  G.prototypeSymbolIds = proto.map((x) => x[0]);
  const itemNames = [
    "鏍规俯缁戝甫",
    "鑻楀渻杞荤Г",
    "闃插瘨绐勭獥",
    "鍒嗘俯鍥磋",
    "婊炵墿鐧昏鏈?",
    "杈规枡鍥炴祦妲?",
    "娓呮爤缁嗙綉",
    "杞ㄨ竟鎷嶆澘",
    "浼戞媿鍒绘Ы",
    "闊抽珮璁扮",
    "鍏敤鑺傛媿鍣?",
    "鐩愰浘鍐呰‖",
    "鍒嗛鏍煎昂",
    "瀹夌摽鏋?",
    "娈嬫恫楠岀珷",
    "澶滃崟澶?",
    "绌鸿繑渚ц建",
    "灏忚埍闄愯浇鐗?",
    "鎹㈣鎸傞挬",
    "鍘嬬彮绱㈠紩",
    "闅旀俯鎶竷",
    "娉勫帇鍥炴墽",
    "澶囩敤鎸℃澘",
    "瀹夊叏澶嶅啓鑶?",
    "璋辩被鎵嬪唽",
    "瀵圭増瀹氫綅閽?",
    "澧為噺搴曠墖鍐?",
    "鍚堣澶嶆牳绾?",
    "绋芥牳澶?",
    "浣欒处鐏?",
    "鍥炴敹澧炲箙鍣?",
    "鍥炴敹澧炲箙鍣?",
  ];
  G.items = {};
  itemNames.forEach((name, i) => {
    const id =
      "item_" +
      [
        "dew_calendar",
        "root_wrap",
        "nursery_scale",
        "frost_glass",
        "sorting_apron",
        "waste_log",
        "offcut_chute",
        "clean_mesh",
        "lane_clapper",
        "rest_notch",
        "pitch_marker",
        "shared_metronome",
        "brine_lining",
        "fraction_gauge",
        "jar_rack",
        "residue_stamp",
        "manifest_clip",
        "return_track",
        "small_hold",
        "exchange_hook",
        "pressure_index",
        "insulation_shawl",
        "release_receipt",
        "spare_baffle",
        "safe_carbon",
        "spectrum_book",
        "registration_pin",
        "growth_negative",
        "compliance_carbon",
        "audit_clip",
        "margin_lantern",
        "salvage_pump",
      ][i];
    G.items[id] = {
      id,
      name,
      rarity: i < 12 ? "common" : i < 25 ? "uncommon" : "rare",
      description: "Persistent item: " + name,
      hook: ["draw", "resolve", "choice"][i % 3],
    };
  });
  G.events = [
    ["event_fog_shift", "闆剧彮璋冩崲"],
    ["event_copper_queue", "閾滃睉鎺掗槦"],
    ["event_silent_bell", "鍋滈福閫氱煡"],
    ["event_brine_inspection", "鐩愰浘鎶芥"],
    ["event_empty_manifest", "绌虹櫧澶滃崟"],
    ["event_boiler_test", "鍘嬮攨璇曢福"],
    ["event_misprint_window", "閿欑増绐楀彛"],
    ["event_quota_recount", "閰嶉澶嶇偣"],
  ].map(([id, name]) => ({
    id,
    name,
    description: "Stage event: " + name,
  }));
  G.stages = Array.from({ length: 10 }, (_, i) => ({
    spins: 6 + (i % 3),
    payment: 30 + i * 24 + i * i * 5,
  }));
  G.actions = [
    "add",
    "consume",
    "destroy",
    "transform",
    "grow",
    "multiply",
    "globalMultiply",
    "age",
    "copy",
    "spawn",
    "tag",
    "risk",
    "condition",
    "reward",
    "counter",
    "cycle",
    "reserve",
    "releasePressure",
    "suppress",
    "riskGuard",
  ];
  G.triggers = [
    "ON_SPIN",
    "ON_APPEAR",
    "ON_ADJACENT",
    "ON_CONSUME",
    "ON_DESTROY",
    "ON_TRANSFORM",
    "ON_GAIN",
    "ON_GROW",
    "ON_END_SPIN",
  ];
  G.validateContent = function () {
    const ids = Object.keys(G.symbols);
    const knownAreas = new Set(["self", "adj", "row", "column", "board", "pool"]);
    const knownOrders = new Set(["position", "positionThenUid", "uid"]);
    const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
    const isInt = (v) => Number.isSafeInteger(v);
    const fail = (id, what) => { throw Error("Invalid " + what + " " + id); };
    const checkValue = (v, id, depth = 0) => {
      if (depth > 8) fail(id, "expression depth");
      if (isInt(v)) return;
      if (!isObj(v)) fail(id, "expression");
      const keys = Object.keys(v);
      if (keys.length !== 1) fail(id, "expression");
      if (keys[0] === "constant" || keys[0] === "counter") {
        if (keys[0] === "constant" && !isInt(v.constant)) fail(id, "constant");
        if (keys[0] === "counter" && (typeof v.counter !== "string" || !/^[a-z][a-z0-9_]*$/.test(v.counter))) fail(id, "counter expression");
        return;
      }
      if (keys[0] === "count") { if (!isObj(v.count) || !knownAreas.has(v.count.area || "board") || !Array.isArray(v.count.tags) || v.count.tags.some((t) => !G.tags.includes(t)) || Object.keys(v.count).some((k) => !["area","tags","uniqueTypes","max","excludeSelf"].includes(k)) || (v.count.uniqueTypes !== undefined && typeof v.count.uniqueTypes !== "boolean") || (v.count.max !== undefined && (!isInt(v.count.max) || v.count.max < 0)) || (v.count.excludeSelf !== undefined && typeof v.count.excludeSelf !== "boolean")) fail(id, "count expression"); return; }
      if (["min", "max", "add", "mul"].includes(keys[0])) {
        if (!Array.isArray(v[keys[0]]) || v[keys[0]].length < 2 || v[keys[0]].length > 8) fail(id, "expression operands");
        v[keys[0]].forEach((x) => checkValue(x, id, depth + 1));
        return;
      }
      fail(id, "expression operator");
    };
    const checkSelector = (v, id) => {
      if (typeof v === "string") {
        if (v === "self" || v === "event") return;
        const m = /^(adj|row|column|board):(\*|[a-z][a-z0-9_]*)$/.exec(v);
        if (!m || (m[2] !== "*" && !G.tags.includes(m[2]))) fail(id, "target");
        return;
      }
      if (!isObj(v) || !knownAreas.has(v.area || "self")) fail(id, "selector");
      if (v.tagsAny !== undefined && (!Array.isArray(v.tagsAny) || v.tagsAny.some((t) => typeof t !== "string" || !G.tags.includes(t)))) fail(id, "selector tags");
      if (v.tagsAll !== undefined && (!Array.isArray(v.tagsAll) || v.tagsAll.some((t) => typeof t !== "string" || !G.tags.includes(t)))) fail(id, "selector tags");
      if (v.excludeTags !== undefined && (!Array.isArray(v.excludeTags) || v.excludeTags.some((t) => typeof t !== "string" || !G.tags.includes(t)))) fail(id, "selector exclusions");
      if (v.count !== undefined && v.count !== "1" && v.count !== "all") fail(id, "selector count");
      if (v.order !== undefined && !knownOrders.has(v.order)) fail(id, "selector order");
      if (v.excludeSelf !== undefined && typeof v.excludeSelf !== "boolean") fail(id, "selector excludeSelf");
      if (Object.keys(v).some((k) => !["area","tagsAny","tagsAll","excludeTags","excludeSelf","count","order"].includes(k))) fail(id, "selector field");
    };
    const checkPredicate = (v, id, depth = 0) => {
      if (v === undefined) return;
      if (depth > 8 || !isObj(v)) fail(id, "predicate");
      const keys = Object.keys(v);
      if (keys.length !== 1) fail(id, "predicate");
      const k = keys[0], x = v[k];
      if (["all", "any"].includes(k)) { if (!Array.isArray(x) || x.length > 16) fail(id, "predicate list"); x.forEach((q) => checkPredicate(q, id, depth + 1)); return; }
      if (k === "not") { checkPredicate(x, id, depth + 1); return; }
      if (k === "count") { if (!isObj(x) || !knownAreas.has(x.area || "board") || !Array.isArray(x.tags) || x.tags.some((t) => !G.tags.includes(t)) || Object.keys(x).some((q) => !["area","tags","at"].includes(q)) || !isInt(x.at) || x.at < 1) fail(id, "count predicate"); return; }
      if (k === "neighbor") { if (!isObj(x) || !Array.isArray(x.tags) || x.tags.some((t) => !G.tags.includes(t))) fail(id, "neighbor predicate"); return; }
      if (k === "counter") { if (!isObj(x) || typeof x.name !== "string" || !isInt(x.at) || x.at < 0) fail(id, "counter predicate"); return; }
      if (k === "cashSnapshot" || k === "poolSize") { if (!isInt(x)) fail(id, "predicate value"); return; }
      if (k === "lowCash") { if (x !== true) fail(id, "low cash predicate"); return; }
      if (k === "stageSpinsRemaining") { if (!isInt(x) || x < 0) fail(id, "stage spins predicate"); return; }
      if (k === "rowUniqueTypeCount") { if (!isObj(x) || !Array.isArray(x.tags) || x.tags.some((t) => !G.tags.includes(t)) || Object.keys(x).some((q) => !["tags","at","exact","excludeSelf"].includes(q)) || (x.at === undefined) === (x.exact === undefined) || (x.at !== undefined && (!isInt(x.at) || x.at < 1)) || (x.exact !== undefined && (!isInt(x.exact) || x.exact < 1)) || (x.excludeSelf !== undefined && typeof x.excludeSelf !== "boolean")) fail(id, "row type predicate"); return; }
      if (k === "uniqueTypeCount" || k === "event") { if (!isObj(x)) fail(id, "predicate payload"); return; }
      if (k === "eventSourceNeighborTag") { if (typeof x !== "string" || !G.tags.includes(x)) fail(id, "event source neighbor tag"); return; }
      if (k === "eventTargetTags") { if (!Array.isArray(x) || x.some((t) => !G.tags.includes(t))) fail(id, "event target tags"); return; }
      if (k === "eventTargetType") { if (typeof x !== "string" || !G.symbols[x]) fail(id, "event target type"); return; }
      if (k === "eventSourceSelf") { if (x !== true) fail(id, "event source self"); return; }
      if (k === "eventCause") { if (typeof x !== "string") fail(id, "event cause"); return; }
      if (k === "plantConvertCount" || k === "convertCount") { if (!isInt(x) || x < 0) fail(id, "conversion count"); return; }
      fail(id, "predicate operator");
    };
    if (G.formalSymbolIds.length !== 64 || G.prototypeSymbolIds.length !== 20 || ids.length !== 84 || Object.keys(G.items).length !== 32 || G.events.length !== 8) fail("content", "content count mismatch");
    for (const [id, d] of Object.entries(G.symbols)) {
      if (d.id !== id || !d.name || !d.icon || !d.description || !Array.isArray(d.tags) || d.tags.some((t) => !G.tags.includes(t)) || !Array.isArray(d.effects)) fail(id, "definition");
      const effectIds = new Set();
      for (const x of d.effects) {
        if (!x || !G.actions.includes(x.action) || !G.triggers.includes(x.trigger) || !isInt(x.priority)) fail(id, "effect");
        if (x.effectId !== undefined) { if (typeof x.effectId !== "string" || effectIds.has(x.effectId)) fail(id, "effectId"); effectIds.add(x.effectId); }
        if (x.target !== undefined) checkSelector(x.target, id);
        if (x.selector !== undefined) checkSelector(x.selector, id);
        if (x.target === undefined && x.selector === undefined) fail(id, "target");
        if (!["self", "event", "boardEvent", "runEvent"].includes(x.scope)) fail(id, "scope");
        if (x.emit !== undefined && !G.triggers.includes(x.emit)) fail(id, "emit");
        if (x.to !== undefined && !G.symbols[x.to]) fail(id, "transform target");
        if (x.when !== undefined) checkPredicate(x.when, id);
        if (x.amount !== undefined) checkValue(x.amount, id);
        if (x.reward !== undefined) checkValue(x.reward, id);
        if (x.ratio !== undefined && (!Array.isArray(x.ratio) || x.ratio.length !== 2 || !x.ratio.every((v) => isInt(v) && v > 0))) fail(id, "ratio");
        if (["multiply", "globalMultiply"].includes(x.action) && x.ratio === undefined) fail(id, "ratio");
        if (x.chance !== undefined && (!Number.isFinite(x.chance) || x.chance < 0 || x.chance > 1)) fail(id, "chance");
        if (x.action === "risk" && (x.guardReduction !== undefined && (!isInt(x.guardReduction) || x.guardReduction < 0 || x.guardReduction > 1e9) || x.spawnOnFail !== undefined && (typeof x.spawnOnFail !== "string" || !G.symbols[x.spawnOnFail]))) fail(id, "risk");
        if (x.action === "riskGuard" && Object.keys(x).some((k) => !["trigger","action","scope","target","selector","priority","limit","when","effectId"].includes(k))) fail(id, "risk guard");
        if (["counter", "releasePressure", "risk"].includes(x.action)) {
          const common = ["trigger", "action", "scope", "target", "selector", "priority", "limit", "when", "emit", "effectId"];
          const fields = {
            counter: ["name", "counter", "delta", "max", "at", "reset", "reward", "release"],
            releasePressure: ["amount", "ratio"],
            risk: ["amount", "loss", "chance", "guardReduction", "spawnOnFail"]
          };
          if (Object.keys(x).some(k => !common.concat(fields[x.action]).includes(k))) fail(id, "action field");
          if (x.action === "counter") {
            if (!["age", "beat", "pressure"].includes(x.name || x.counter) ||
                (x.name !== undefined && x.counter !== undefined && x.name !== x.counter) ||
                (x.release !== undefined && typeof x.release !== "boolean") ||
                ["delta", "max", "at", "reset"].some(k => x[k] !== undefined && (!isInt(x[k]) || x[k] < 0))) fail(id, "counter action");
          }
          if (x.action === "releasePressure" &&
              (!isInt(x.amount) || x.amount <= 0 || !Array.isArray(x.ratio) || x.ratio.length !== 2 || !x.ratio.every(v => isInt(v) && v > 0))) fail(id, "release action");
          if (x.action === "risk" &&
              (!isInt(x.loss) || !isInt(x.amount) || typeof x.chance !== "number" || !Number.isFinite(x.chance) || x.chance < 0 || x.chance > 1)) fail(id, "risk amount");
        }
        if (x.action === "tag" && x.chooseTags !== undefined) { if (!Array.isArray(x.chooseTags) || x.chooseTags.length < 1 || x.chooseTags.some((t) => typeof t !== "string" || !G.tags.includes(t)) || new Set(x.chooseTags).size !== x.chooseTags.length) fail(id, "chooseTags"); }
        if (x.action === "tag" && x.tag !== undefined && (typeof x.tag !== "string" || !G.tags.includes(x.tag))) fail(id, "tag");
        if (x.action === "cycle") { if (Object.keys(x).some((k) => !["trigger","action","scope","target","selector","priority","name","threshold","amount","reset","limit","when","emit","effectId"].includes(k)) || typeof x.name !== "string" || !/^[a-z][a-z0-9_]*$/.test(x.name) || !isInt(x.threshold) || x.threshold < 1 || (x.reset !== undefined && (!isInt(x.reset) || x.reset < 0))) fail(id, "cycle action"); }
        if (x.limit !== undefined) { if (!isObj(x.limit) || Object.keys(x.limit).some((k) => !["perSpin","perStage","perSource","perTarget"].includes(k)) || Object.values(x.limit).some((v) => !isInt(v) || v < 1)) fail(id, "limit"); }
      }
    }
    return true;
  };
})(window.Game);
