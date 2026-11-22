/* 3D 샘플의 소리 (전부 합성).
 * 소리 파일 없이 Web Audio API로 만든다.
 * 신학 규칙: 하나님의 음성은 소리로 만들지 않는다.
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';

  var audio = (function () {
    var ctx = null, master, sceneG, windG, fireG, crackleG, padG, muted = false, nextPop = 0;
    /* held: 압도 장면 동안 거리로 불 소리를 정하는 계산을 멈춘다. padOn·musicStarts: 지켜보기 음악이 켜져 있는지, 몇 번 새로 켜졌는지 */
    var held = false, padOn = false, musicStarts = 0;
    var NORMAL = { master: 0.9, wind: 0.16, music: 0.9 };
    function noiseBuf(sec) {
      var b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0), last = 0;
      for (var i = 0; i < d.length; i++) { var wn = Math.random() * 2 - 1; last = (last + 0.02 * wn) / 1.02; d[i] = last * 3.2 + wn * 0.12; }
      return b;
    }
    function loop(buf, filterType, freq, q) {
      var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      var f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 0.7;
      var g = ctx.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(master); s.start();
      return { gain: g, filter: f };
    }
    function start() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try {
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : NORMAL.master;
        /* 장면용 전체 크기: 소리 끄기(master)와 따로 둔다. 압도 장면의 '모든 소리가 멎음'에 쓴다 */
        sceneG = ctx.createGain(); sceneG.gain.value = 1; master.connect(sceneG); sceneG.connect(ctx.destination);
        var nb = noiseBuf(3);
        var wind = loop(nb, 'lowpass', 420, 0.5); windG = wind.gain; windG.gain.value = NORMAL.wind;
        var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 160; lfo.connect(lg); lg.connect(wind.filter.frequency); lfo.start();
        var fr = loop(nb, 'bandpass', 520, 0.6); fireG = fr.gain;
        crackleG = ctx.createGain(); crackleG.gain.value = 0; crackleG.connect(master);
        padG = ctx.createGain(); padG.gain.value = 0; padG.connect(master);
      } catch (e) { ctx = null; }
    }
    /* 떨기나무와의 거리에 따른 불 소리 크기 (불 타는 소리, 탁탁 튀는 소리) */
    function fireLevel(dist) {
      var v = Math.max(0, Math.min(1, 1 - (dist - 8) / 34)); v = v * v;
      return { fire: 0.02 + v * 0.5, crackle: v * 0.55, v: v };
    }
    /* 떨기나무와의 거리에 따라 불 소리가 커진다. 압도 장면 동안(held)은 거리 계산을 멈추고 장면이 정한 크기를 따른다 */
    function setFire(dist) {
      if (!ctx) return;
      var v;
      if (held) v = Math.max(0, Math.min(1, crackleG.gain.value / 0.55));
      else {
        var L = fireLevel(dist); v = L.v;
        fireG.gain.setTargetAtTime(L.fire, ctx.currentTime, 0.3);
        crackleG.gain.setTargetAtTime(L.crackle, ctx.currentTime, 0.3);
      }
      if (ctx.currentTime > nextPop && v > 0.05) {
        nextPop = ctx.currentTime + 0.04 + Math.random() * 0.22;
        var o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime;
        o.type = 'square'; o.frequency.value = 900 + Math.random() * 2600;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.12, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03 + Math.random() * 0.04);
        o.connect(g); g.connect(crackleG); o.start(t0); o.stop(t0 + 0.09);
      }
    }
    function tone(freq, t0, dur, vol, type, dest) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.05, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function chime() { if (!ctx) return; var t = ctx.currentTime; [659.3, 880, 1318.5].forEach(function (f, i) { tone(f, t + i * 0.09, 0.7, 0.14, 'sine'); }); }
    /* 사건을 지켜보는 동안 깔리는 낮고 조용한 화음 */
    function pad(on) {
      if (!ctx) return;
      on = !!on;
      /* 이미 켜져 있으면 다시 켜지 않는다 (음악이 처음부터 다시 시작되지 않게) */
      if (on === padOn) return;
      padOn = on;
      if (on) musicStarts++;
      if (on && !pad.nodes) {
        pad.nodes = [146.83, 220, 293.66, 369.99].map(function (f, i) {
          var o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 4;
          var g = ctx.createGain(); g.gain.value = 0.05 - i * 0.008; o.connect(g); g.connect(padG); o.start(); return o;
        });
      }
      padG.gain.cancelScheduledValues(ctx.currentTime); padG.gain.setValueAtTime(padG.gain.value, ctx.currentTime);
      padG.gain.setTargetAtTime(on ? NORMAL.music : 0, ctx.currentTime, on ? 1.6 : 0.8);
    }
    function shutter() { if (!ctx) return; var t = ctx.currentTime; tone(2100, t, 0.035, 0.1, 'square'); tone(1300, t + 0.055, 0.05, 0.08, 'square'); }
    function rise() { if (!ctx) return; var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + 3.6);
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3200, t + 3.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 4.1); }
    function mute(m) { muted = m; if (ctx) master.gain.setTargetAtTime(m ? 0 : NORMAL.master, ctx.currentTime, 0.05); }
    /* ── 압도 장면이 쓰는 것 ── */
    function param(name) {
      if (!ctx) return null;
      return { scene: sceneG, wind: windG, fire: fireG, crackle: crackleG, music: padG }[name].gain;
    }
    /* 지금 크기(또는 from)에서 value까지 sec초 동안 고르게 바꾼다. 앞서 잡아 둔 변화는 지운다 */
    function glide(name, value, sec, from) {
      var p = param(name); if (!p) return;
      var t = ctx.currentTime;
      p.cancelScheduledValues(t);
      p.setValueAtTime(typeof from === 'number' ? from : p.value, t);
      if (sec > 0.001) p.linearRampToValueAtTime(value, t + sec);
      else p.setValueAtTime(value, t);
    }
    /* 거리 계산을 멈추거나(true) 되돌린다(false). 되돌릴 때는 지금 크기에서 이어서 거리 계산을 따른다 */
    function hold(on) {
      held = !!on;
      if (!held && ctx) { glide('fire', fireG.gain.value, 0); glide('crackle', crackleG.gain.value, 0); }
    }
    /* 시험용: 지금 소리 크기. total은 소리 끄기와 장면용 크기를 함께 곱한 전체 크기다 */
    function levels() {
      if (!ctx) return null;
      return {
        total: master.gain.value * sceneG.gain.value, master: master.gain.value, scene: sceneG.gain.value,
        wind: windG.gain.value, fire: fireG.gain.value, crackle: crackleG.gain.value, music: padG.gain.value,
        normal: NORMAL.master, muted: muted, held: held, musicOn: padOn, musicStarts: musicStarts, running: ctx.state
      };
    }
    return { start: start, setFire: setFire, chime: chime, shutter: shutter, rise: rise, pad: pad, mute: mute, isMuted: function () { return muted; },
      fireLevel: fireLevel, glide: glide, hold: hold, levels: levels, NORMAL: NORMAL };
  })();

  BO3D.fx = BO3D.fx || {};
  BO3D.fx.audio = audio;
})();
