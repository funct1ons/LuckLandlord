/* 雾港余热局 · 原创离线 WebAudio。unlock 由用户手势调用；播放/设置不创建上下文。 */
(function (root) {
  'use strict';
  const MAX_CONCURRENT = 4, MAX_TOTAL = 8, MAX_SEMITONE = 12;
  const doc = root.document;
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  let enabled = true, volume = 0.65, masterVolume = 0.7, musicVolume = 0.2;
  let unlocked = false, unavailable = false, disposed = false, pageHidden = false;
  let musicSource = null, musicBuffer = null, active = 0, batch = null;
  const voices = new Set(), playing = Object.create(null);
  const clamp = v => Math.max(0, Math.min(1, Number(v) || 0));
  const hidden = () => pageHidden || !!(doc && doc.hidden);
  // 私有 PRNG，不访问 Math.random 或游戏 RNG。
  let noiseSeed = 0x6f67706f;
  function random() {
    noiseSeed ^= noiseSeed << 13; noiseSeed ^= noiseSeed >>> 17; noiseSeed ^= noiseSeed << 5;
    return (noiseSeed >>> 0) / 4294967296;
  }
  function disconnect(node) { try { node.disconnect(); } catch (_) {} }
  function quietCall(method) {
    try { if (ctx && ctx[method]) return Promise.resolve(ctx[method]()).catch(() => {}); }
    catch (_) {}
    return Promise.resolve();
  }
  function stopMusic() {
    const source = musicSource;
    musicSource = null;
    if (source) { source.onended = null; try { source.stop(); } catch (_) {} disconnect(source); }
  }
  function stopVoices() { for (const voice of Array.from(voices)) voice.stop(); }
  function ensure() {
    if (ctx) return ctx;
    if (!unlocked || disposed || unavailable || hidden() || !enabled || !masterVolume) return null;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) { unavailable = true; return null; }
    try {
      ctx = new AC();
      master = ctx.createGain(); sfxBus = ctx.createGain(); musicBus = ctx.createGain();
      master.gain.value = masterVolume; sfxBus.gain.value = volume; musicBus.gain.value = musicVolume;
      sfxBus.connect(master); musicBus.connect(master); master.connect(ctx.destination);
    } catch (_) {
      unavailable = true;
      [master, sfxBus, musicBus].filter(Boolean).forEach(disconnect);
      quietCall('close'); ctx = master = sfxBus = musicBus = null;
    }
    return ctx;
  }
  // 32 秒原创循环：低通棕噪似雾，C/G 远港低频，C 大调五声音阶稀疏铜击。
  // 单个循环 BufferSource，没有音乐调度计时器、远程资源或游戏随机数。
  function compose(c) {
    const rate = 22050, seconds = 32, length = rate * seconds;
    const buffer = c.createBuffer(1, length, rate), data = buffer.getChannelData(0);
    const notes = [[1,196],[6,261.6256],[12,329.6276],[19,293.6648],[25,220]];
    let brown = 0;
    for (let i = 0; i < length; i++) {
      const t = i / rate, phase = t / seconds;
      brown = (brown + 0.02 * (random() * 2 - 1)) / 1.02;
      // 雾的首尾归零；低频在循环长度内恰好整周期，避免接缝爆音。
      const edge = Math.min(1, t / 2, (seconds - t) / 2);
      let sample = brown * 0.12 * edge * (0.75 + 0.25 * Math.sin(2 * Math.PI * phase));
      sample += 0.018 * Math.sin(2 * Math.PI * 65.40625 * t);
      sample += 0.009 * Math.sin(2 * Math.PI * 98 * t);
      for (const [at, freq] of notes) {
        const age = t - at;
        if (age >= 0 && age < 3) {
          const env = Math.min(1, age / 0.008) * Math.exp(-age * 2.5) * Math.min(1, (3 - age) / 0.1);
          sample += env * (0.037 * Math.sin(2 * Math.PI * freq * age)
            + 0.009 * Math.sin(2 * Math.PI * freq * 2.01 * age)
            + 0.003 * Math.sin(2 * Math.PI * freq * 3.97 * age));
        }
      }
      data[i] = sample;
    }
    return buffer;
  }
  function startMusic() {
    if (!ctx || ctx.state === 'suspended' || musicSource || !musicVolume || hidden() || !enabled || !masterVolume) return;
    let source;
    try {
      if (!musicBuffer) musicBuffer = compose(ctx);
      source = ctx.createBufferSource(); source.buffer = musicBuffer; source.loop = true;
      source.connect(musicBus); source.start(); musicSource = source;
    } catch (_) { if (source) { try { source.stop(); } catch (_) {} disconnect(source); } }
  }
  function sync() {
    if (!ctx || disposed) return;
    const audible = enabled && masterVolume > 0 && !hidden();
    master.gain.value = audible ? masterVolume : 0;
    sfxBus.gain.value = volume; musicBus.gain.value = musicVolume;
    if (!audible) { stopMusic(); stopVoices(); quietCall('suspend'); return; }
    if (!volume) stopVoices();
    if (!musicVolume) stopMusic();
    if (ctx.state === 'suspended') quietCall('resume').then(() => {
      if (disposed) return;
      if (hidden() || !enabled || !masterVolume) { quietCall('suspend'); return; }
      startMusic();
    });
    else startMusic();
  }
  /** 调用方须在用户手势内调用；自动监听也支持页面首次键盘/指针操作。 */
  function unlock() { if (disposed) return; unlocked = true; ensure(); sync(); }
  function gesture(event) { if (event.isTrusted) unlock(); }
  function canPlay(name) {
    return !!(ctx && unlocked && !disposed && enabled && volume && masterVolume && !hidden()
      && ctx.state !== 'suspended' && active < MAX_TOTAL && (playing[name] || 0) < MAX_CONCURRENT);
  }
  function track(source, nodes, owner) {
    active++; if (owner) owner.count++;
    let ended = false;
    const voice = {
      release() {
        if (ended) return; ended = true;
        source.onended = null; nodes.forEach(disconnect); voices.delete(voice); active--;
        if (owner && --owner.count === 0) playing[owner.name]--;
      },
      stop() { try { source.stop(); } catch (_) {} voice.release(); }
    };
    voices.add(voice); source.onended = voice.release;
    return voice;
  }
  function tone(o) {
    if (!ctx || active >= MAX_TOTAL) return;
    const nodes = []; let voice;
    try {
      const c = ctx, t0 = c.currentTime + (o.delay || 0), dur = o.dur || 0.08;
      const osc = c.createOscillator(); nodes.push(osc);
      const g = c.createGain(); nodes.push(g);
      osc.type = o.type || 'triangle'; osc.frequency.setValueAtTime(o.freq, t0);
      if (o.to && o.sweep !== false) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, o.gain == null ? 0.28 : o.gain), t0 + Math.min(0.012, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(sfxBus);
      voice = track(osc, nodes, batch); osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (_) { if (voice) voice.stop(); else nodes.forEach(disconnect); }
  }
  function noise(o) {
    if (!ctx || active >= MAX_TOTAL) return;
    const nodes = []; let voice;
    try {
      const c = ctx, dur = o.dur || 0.06, t0 = c.currentTime + (o.delay || 0);
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = random() * 2 - 1;
      const src = c.createBufferSource(); nodes.push(src); src.buffer = buf;
      const filt = c.createBiquadFilter(); nodes.push(filt);
      filt.type = o.filter || 'bandpass'; filt.frequency.value = o.freq || 1400; filt.Q.value = o.q == null ? 1.1 : o.q;
      const g = c.createGain(); nodes.push(g);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(o.gain == null ? 0.18 : o.gain, t0 + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filt); filt.connect(g); g.connect(sfxBus);
      voice = track(src, nodes, batch); src.start(t0); src.stop(t0 + dur + 0.01);
    } catch (_) { if (voice) voice.stop(); else nodes.forEach(disconnect); }
  }
  function play(name, fn) {
    if (!canPlay(name)) return;
    // count 的哨兵避免同步失败释放时提前结清同名并发。
    const owner = { name, count: 1 }; batch = owner;
    playing[name] = (playing[name] || 0) + 1;
    try { fn(); } catch (_) {} finally {
      batch = null; if (--owner.count === 0) playing[name]--;
    }
  }

  const SFX = {
    /** Spin：80–120ms 低频机械启动 + 轻微噪声门 */
    spin: combo => play('spin', () => {
      tone({ freq: 66, to: 110, dur: 0.13, type: 'sawtooth', gain: 0.16 });
      tone({ freq: 176, to: 220, dur: 0.09, type: 'square', gain: 0.06 });
      noise({ freq: 380, dur: 0.1, gain: 0.13, filter: 'lowpass' });
      noise({ freq: 1800, dur: 0.05, gain: 0.05, filter: 'bandpass', q: 1.4 });
    }),

    /** Reel Stop：每列 45ms 闩扣，列序音高略升 */
    reelStop: (col = 0) => play('reelStop', () => {
      const step = Math.min(4, Math.max(0, col | 0));
      const f = 380 * Math.pow(2, step / 12);
      tone({ freq: f, dur: 0.042, type: 'square', gain: 0.11 });
      tone({ freq: f * 2, dur: 0.028, type: 'triangle', gain: 0.05, delay: 0.008 });
      noise({ freq: 2800, dur: 0.032, gain: 0.10, q: 2.8 });
    }),

    /** 普通 Gain：70ms 清脆铜片，音量随金额分档 */
    gain: amount => play('gain', () => {
      const a = Math.abs(Number(amount) || 0);
      const g = a >= 60 ? 0.28 : a >= 20 ? 0.22 : 0.17;
      // 基音：清脆铜片
      tone({ freq: 1120, dur: 0.072, type: 'triangle', gain: g });
      // 二次谐波：增加金属亮度
      tone({ freq: 2240, dur: 0.05, type: 'sine', gain: g * 0.35, delay: 0.008 });
      // 高频泛音：铜片余韵
      tone({ freq: 3360, dur: 0.038, type: 'sine', gain: g * 0.12, delay: 0.018 });
    }),

    /** Symbol Trigger：90ms 中频脉冲，按路线做音色差异 */
    trigger: route => play('trigger', () => {
      // 每条路线有独立的基音、谐波结构和波形，增加辨识度
      const profiles = {
        plant:     { f: 480, type: 'sine',     harm: 960,  harmG: 0.22, dur: 0.10 },
        scrap:     { f: 260, type: 'sawtooth', harm: 520,  harmG: 0.12, dur: 0.09 },
        resonance: { f: 820, type: 'sine',     harm: 1640, harmG: 0.18, dur: 0.11 },
        distill:   { f: 600, type: 'triangle', harm: 900,  harmG: 0.14, dur: 0.09 },
        cargo:     { f: 380, type: 'square',   harm: 760,  harmG: 0.10, dur: 0.08 },
        pressure:  { f: 200, type: 'sawtooth', harm: 400,  harmG: 0.10, dur: 0.10 },
        phase:     { f: 900, type: 'sine',     harm: 1350, harmG: 0.20, dur: 0.10 },
        contract:  { f: 540, type: 'triangle', harm: 810,  harmG: 0.13, dur: 0.09 },
      };
      const p = profiles[route] || profiles.plant;
      tone({ freq: p.f, to: p.f * 1.12, dur: p.dur, type: p.type, gain: 0.14 });
      tone({ freq: p.harm, dur: p.dur * 0.7, type: 'sine', gain: p.harmG * 0.55, delay: 0.01 });
    }),

    /** Consume / Destroy：110ms 吸入式降调 + 细碎金属落点 */
    consume: () => play('consume', () => {
      tone({ freq: 340, to: 80, dur: 0.13, type: 'sawtooth', gain: 0.16 });
      tone({ freq: 680, to: 160, dur: 0.09, type: 'triangle', gain: 0.07, delay: 0.01 });
      noise({ freq: 3400, dur: 0.055, gain: 0.11, delay: 0.08, q: 3.0 });
    }),

    /** Multiplier：两个上行音程，×2/×3 逐级升调 */
    multiplier: ratio => play('multiplier', () => {
      const n = Math.min(4, Math.max(1, Math.round(Number(ratio) || 2)));
      const f = 560 * Math.pow(2, (n - 1) / 12);
      // 基音 + 纯五度谐波，构成更饱满的金属质感
      tone({ freq: f,       dur: 0.08,  type: 'square',   gain: 0.14 });
      tone({ freq: f * 1.5, dur: 0.09,  type: 'triangle', gain: 0.12, delay: 0.055 });
      tone({ freq: f * 2,   dur: 0.06,  type: 'sine',     gain: 0.07, delay: 0.10 });
    }),

    /** Rare Choice：180ms 柔和双音，不刺耳、不循环 */
    rareChoice: () => play('rareChoice', () => {
      // 柔和双音 + 微弱泛音，增加"稀有物品浮现"的质感
      tone({ freq: 660, dur: 0.18, type: 'sine', gain: 0.15 });
      tone({ freq: 990, dur: 0.20, type: 'sine', gain: 0.12, delay: 0.07 });
      tone({ freq: 1320, dur: 0.14, type: 'sine', gain: 0.05, delay: 0.13 });
    }),

    /** Debt Paid：240ms 三音确认，末音落在稳定音 */
    debtPaid: () => play('debtPaid', () => {
      // 三音确认：纯五度 + 八度叠层，更饱满的工业仪式感
      [523.25, 659.25, 783.99].forEach((f, i) => {
        tone({ freq: f,   dur: 0.15, type: 'triangle', gain: 0.17, delay: i * 0.08 });
        tone({ freq: f*2, dur: 0.10, type: 'sine',     gain: 0.06, delay: i * 0.08 + 0.015 });
      });
    }),

    /** Game Over：300ms 低沉两音，尾音短 */
    gameOver: () => play('gameOver', () => {
      tone({ freq: 185, to: 147, dur: 0.25, type: 'sawtooth', gain: 0.18 });
      tone({ freq: 370, to: 294, dur: 0.18, type: 'triangle', gain: 0.08, delay: 0.02 });
      tone({ freq: 139, to: 110, dur: 0.32, type: 'sawtooth', gain: 0.16, delay: 0.18 });
    }),

    /** Victory：500ms 三段上行和弦 */
    victory: () => play('victory', () => {
      // 三段上行和弦：基音 + 纯五度 + 八度，每段依次叠入
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ freq: f,     dur: 0.36, type: 'triangle', gain: 0.18, delay: i * 0.11 });
        tone({ freq: f*1.5, dur: 0.28, type: 'sine',     gain: 0.07, delay: i * 0.11 + 0.02 });
      });
    }),

    /** 连击：音高逐次上移一个小音程，封顶 12 半音 */
    combo: count => play('combo', () => {
      const n = Math.min(MAX_SEMITONE, Math.max(0, (count | 0) - 1));
      const f = 620 * Math.pow(2, n / 12);
      tone({ freq: f,     dur: 0.065, type: 'sine',     gain: 0.12 });
      tone({ freq: f * 2, dur: 0.040, type: 'triangle', gain: 0.04, delay: 0.01 });
    })
  };

  function visibility() { sync(); }
  function pagehide() { pageHidden = true; sync(); }
  function pageshow() { pageHidden = false; sync(); }
  if (doc && doc.addEventListener) {
    doc.addEventListener('pointerdown', gesture, true);
    doc.addEventListener('keydown', gesture, true);
    doc.addEventListener('visibilitychange', visibility);
  }
  if (root.addEventListener) {
    root.addEventListener('pagehide', pagehide);
    root.addEventListener('pageshow', pageshow);
  }
  root.SFX = {
    play: SFX, unlock,
    setVolume(v) { volume = clamp(v); sync(); },
    getVolume: () => volume,
    setMaster(v) { masterVolume = clamp(v); sync(); },
    getMaster: () => masterVolume,
    setMusicVolume(v) { musicVolume = clamp(v); sync(); },
    getMusicVolume: () => musicVolume,
    setEnabled(on) { enabled = !!on; sync(); },
    isEnabled: () => enabled,
    isSupported: () => !unavailable && !!(root.AudioContext || root.webkitAudioContext),
    names: () => Object.keys(SFX),
    // 兼容旧环境开关：开启使用低音量；新设置直接控制 musicVolume。
    setAmbient(on) { musicVolume = on ? (musicVolume || 0.25) : 0; sync(); },
    isAmbientEnabled: () => musicVolume > 0,
    dispose() {
      disposed = true; stopMusic(); stopVoices();
      [master, sfxBus, musicBus].filter(Boolean).forEach(disconnect);
      quietCall('close'); ctx = master = sfxBus = musicBus = musicBuffer = null;
      if (doc && doc.removeEventListener) {
        doc.removeEventListener('pointerdown', gesture, true);
        doc.removeEventListener('keydown', gesture, true);
        doc.removeEventListener('visibilitychange', visibility);
      }
      if (root.removeEventListener) {
        root.removeEventListener('pagehide', pagehide); root.removeEventListener('pageshow', pageshow);
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
