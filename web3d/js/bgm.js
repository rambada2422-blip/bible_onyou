/* 배경음악 플레이어 (BO3D.bgm)
 * 출처: DH AI DEV DIRECTOR REQ-20261116-153502-gk6i03 (Antigravity 작성) + Claude 고침 2026-11-16
 *   고침 1) iOS Safari는 audio.volume을 무시한다 -> 게임 소리 장치(fx.js)의 음악 묶음으로 연결해 GainNode로 음량 조절
 *   고침 2) 파일을 두 번 눌러 연(file://) 화면에서는 연결하면 크롬이 무음으로 만든다 -> 그때는 연결하지 않고 audio.volume
 *   고침 3) unlock(): 소리 파일이 없는 오디오는 짧은 무음 파일(audio/_unlock.mp3)로 깨우고, 재생이 시작된 뒤에 멈춘다
 *          (바로 멈추면 재생 약속이 거절돼 한 번뿐인 경고를 써 버린다). 첫 터치·클릭 때 저절로 부른다.
 * 장면표: js/bgmplan.js (BO3D.bgmPlan). 음악 파일: audio/<곡id>.mp3 (Kevin MacLeod, CC BY 4.0) */
(function (win) {
  'use strict';
  var root = win.BO3D = win.BO3D || {};
  var STEP_MS = 50;
  var DEFAULT_VOL = 0.3;
  var MAX_VOL = 0.35;
  var CROSSFADE_SEC = 1.5;
  var SILENCE_FADE_SEC = 0.5;
  var STOP_FADE_SEC = 1.0;
  var MUTE_FADE_SEC = 0.1;

  var warned = false;
  var targetVol = DEFAULT_VOL;
  var muted = false;
  var silenced = false;
  var currentReq = null;
  var activeIdx = 0;
  var activeTrack = null;
  var fadeTimer = null;
  var unlocked = false;
  var graphTried = false;
  var decks = [];

  function warnOnce(msg) {
    if (!warned) {
      warned = true;
      if (win.console && typeof win.console.warn === 'function') {
        try { win.console.warn('[BO3D.bgm] ' + msg); } catch (e) {}
      }
    }
  }

  function clampVol(v) {
    var n = Number(v);
    if (isNaN(n)) { return targetVol; }
    if (n < 0) { return 0; }
    if (n > MAX_VOL) { return MAX_VOL; }
    return n;
  }

  function clearFade() {
    if (fadeTimer !== null) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  }

  function safePause(el) {
    if (!el) { return; }
    try { el.pause(); } catch (e) { warnOnce('Audio pause error'); }
  }

  /* 음량 읽기·쓰기: 소리 장치에 연결됐으면 GainNode, 아니면 audio.volume */
  function getVol(i) {
    var d = decks[i];
    if (!d) { return 0; }
    if (d.gain) { return d.gain.gain.value; }
    return d.el.volume || 0;
  }

  function setVol(i, v) {
    var d = decks[i];
    if (!d) { return; }
    var c = v < 0 ? 0 : (v > MAX_VOL ? MAX_VOL : v);
    try {
      if (d.gain) { d.gain.gain.value = c; } else { d.el.volume = c; }
    } catch (e) { warnOnce('Audio volume error'); }
  }

  function safePlay(el) {
    if (!el) { return; }
    try {
      var p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(null, function () { warnOnce('Audio playback rejected'); });
      }
    } catch (e) {
      warnOnce('Audio playback failed');
    }
  }

  function initDecks() {
    if (decks.length === 2) { return true; }
    if (typeof win.Audio !== 'function') {
      warnOnce('Audio API unsupported');
      return false;
    }
    try {
      for (var i = 0; i < 2; i++) {
        var el = new win.Audio();
        el.loop = true;
        el.preload = 'auto';
        el.volume = 0;
        el.onerror = function () { warnOnce('Audio asset load failed'); };
        decks.push({ el: el, track: null, gain: null });
      }
      return true;
    } catch (e) {
      decks = [];
      warnOnce('Audio initialization failed');
      return false;
    }
  }

  /* 게임 소리 장치(BO3D.fx.audio)가 켜져 있으면 두 오디오를 그 음악 묶음에 한 번만 연결한다.
   * 연결 뒤에는 게임의 소리 끄기 버튼(주 음량)도 음악에 함께 적용된다. */
  function attachGraph() {
    if (graphTried || decks.length !== 2) { return; }
    if (win.location && win.location.protocol === 'file:') { graphTried = true; return; }
    var fa = root.fx && root.fx.audio;
    var ctx = fa && typeof fa.context === 'function' ? fa.context() : null;
    var bus = fa && typeof fa.musicBus === 'function' ? fa.musicBus() : null;
    if (!ctx || !bus || typeof ctx.createMediaElementSource !== 'function') { return; }
    graphTried = true;
    for (var i = 0; i < 2; i++) {
      var d = decks[i];
      try {
        var node = ctx.createMediaElementSource(d.el), g = ctx.createGain();
        g.gain.value = d.el.volume || 0;
        node.connect(g); g.connect(bus);
        d.gain = g; d.el.volume = 1;
      } catch (e) { d.gain = null; warnOnce('Audio graph connect failed'); }
    }
  }

  function loadTrack(deck, trackId) {
    if (!deck || !deck.el || !trackId || trackId === 'silence') { return; }
    var src = 'audio/' + trackId + '.mp3';
    if (deck.track !== trackId) {
      deck.track = trackId;
      try {
        deck.el.src = src;
        if (typeof deck.el.load === 'function') { deck.el.load(); }
      } catch (e) {
        warnOnce('Audio source assignment failed');
      }
    } else {
      try { deck.el.currentTime = 0; } catch (e) {}
    }
  }

  function runFade(goals, durationSec, onDone) {
    clearFade();
    if (!initDecks()) {
      if (onDone) { onDone(); }
      return;
    }
    var dur = Number(durationSec);
    if (isNaN(dur) || dur < 0) { dur = 0; }
    var steps = dur === 0 ? 1 : Math.max(1, Math.round((dur * 1000) / STEP_MS));
    var start0 = getVol(0);
    var start1 = getVol(1);
    var goal0 = goals[0];
    var goal1 = goals[1];
    if (steps <= 1) {
      setVol(0, goal0);
      setVol(1, goal1);
      if (goal0 === 0) { safePause(decks[0].el); }
      if (goal1 === 0) { safePause(decks[1].el); }
      if (onDone) { onDone(); }
      return;
    }
    var step = 0;
    fadeTimer = setInterval(function () {
      step += 1;
      var ratio = step >= steps ? 1 : (step / steps);
      setVol(0, start0 + (goal0 - start0) * ratio);
      setVol(1, start1 + (goal1 - start1) * ratio);
      if (step >= steps) {
        clearFade();
        if (goal0 === 0) { safePause(decks[0].el); }
        if (goal1 === 0) { safePause(decks[1].el); }
        if (onDone) { onDone(); }
      }
    }, STEP_MS);
  }

  function fadeOutAll(durationSec) {
    activeTrack = null;
    if (!decks.length) { clearFade(); return; }
    runFade([0, 0], durationSec);
  }

  function startOrCrossfade(trackId, durationSec) {
    if (!initDecks()) { return; }
    attachGraph();
    var effVol = (muted || silenced) ? 0 : targetVol;
    if (activeTrack === trackId && decks[activeIdx].track === trackId) {
      var keepGoals = [0, 0];
      keepGoals[activeIdx] = effVol;
      if (effVol > 0 && decks[activeIdx].el.paused) { safePlay(decks[activeIdx].el); }
      runFade(keepGoals, durationSec);
      return;
    }
    var nextIdx = activeTrack === null ? activeIdx : (1 - activeIdx);
    var nextDeck = decks[nextIdx];
    loadTrack(nextDeck, trackId);
    setVol(nextIdx, 0);
    if (!muted && !silenced) { safePlay(nextDeck.el); }
    activeIdx = nextIdx;
    activeTrack = trackId;
    var goals = [0, 0];
    goals[activeIdx] = effVol;
    runFade(goals, durationSec);
  }

  initDecks();

  root.bgm = {
    play: function (sceneId, part) {
      if (silenced) { return; }
      var plan = root.bgmPlan;
      if (!plan || !sceneId || !part || !plan[sceneId]) { return; }
      var track = plan[sceneId][part];
      if (typeof track !== 'string' || !track) { return; }
      var isSame = currentReq && currentReq.track === track && activeTrack === track;
      currentReq = { scene: String(sceneId), part: String(part), track: track };
      if (track === 'silence') {
        fadeOutAll(SILENCE_FADE_SEC);
        return;
      }
      if (isSame) { return; }
      startOrCrossfade(track, CROSSFADE_SEC);
    },
    stop: function (fadeSec) {
      currentReq = null;
      var dur = arguments.length === 0 || fadeSec === undefined ? STOP_FADE_SEC : Number(fadeSec);
      if (isNaN(dur) || dur < 0) { dur = STOP_FADE_SEC; }
      fadeOutAll(dur);
    },
    silence: function (flag) {
      var next = Boolean(flag);
      if (next === silenced) { return; }
      silenced = next;
      if (silenced) {
        fadeOutAll(SILENCE_FADE_SEC);
      } else if (currentReq && currentReq.track && currentReq.track !== 'silence') {
        startOrCrossfade(currentReq.track, CROSSFADE_SEC);
      }
    },
    mute: function (flag) {
      muted = Boolean(flag);
      if (!decks.length) { return; }
      if (muted) {
        runFade([0, 0], MUTE_FADE_SEC);
      } else if (!silenced && currentReq && currentReq.track && currentReq.track !== 'silence') {
        startOrCrossfade(currentReq.track, CROSSFADE_SEC);
      }
    },
    isMuted: function () {
      return muted;
    },
    current: function () {
      if (!currentReq) { return null; }
      return { scene: currentReq.scene, part: currentReq.part, track: currentReq.track };
    },
    setVolume: function (v) {
      targetVol = clampVol(v);
      if (!muted && !silenced && activeTrack && decks.length === 2) {
        var goals = [0, 0];
        goals[activeIdx] = targetVol;
        runFade(goals, MUTE_FADE_SEC);
      }
    },
    unlock: function () {
      if (!initDecks() || unlocked) { return; }
      unlocked = true;
      for (var i = 0; i < 2; i++) { primeDeck(i); }
      if (!muted && !silenced && currentReq && currentReq.track && currentReq.track !== 'silence') {
        startOrCrossfade(currentReq.track, CROSSFADE_SEC);
      }
    },
    /* 자동 점검용(화면에는 영향 없음): 두 오디오의 상태 */
    debug: function () {
      var out = [];
      for (var i = 0; i < decks.length; i++) {
        out.push({ track: decks[i].track, paused: decks[i].el.paused, vol: Math.round(getVol(i) * 100) / 100, t: Math.round((decks[i].el.currentTime || 0) * 10) / 10, graph: !!decks[i].gain });
      }
      return { active: activeTrack, muted: muted, silenced: silenced, unlocked: unlocked, decks: out };
    }
  };

  /* 재생 중인 오디오는 그대로 두고, 나머지는 무음으로 한 번 재생했다가 멈춘다(모바일이 이 오디오를 허락해 두게) */
  function inUse(i) { return i === activeIdx && activeTrack !== null && !muted && !silenced; }
  function primeDeck(i) {
    var d = decks[i];
    if (!d || inUse(i)) { return; }
    setVol(i, 0);
    if (!d.track) { try { d.el.src = 'audio/_unlock.mp3'; } catch (e) {} }
    try {
      var p = d.el.play();
      var after = function () { if (!inUse(i)) { safePause(d.el); } };
      if (p && typeof p.then === 'function') { p.then(after, function () {}); } else { after(); }
    } catch (e) {}
  }

  /* 터치·클릭 때: 첫 번에 음악을 깨우고, 소리 장치가 잠들어 있으면(모바일) 깨운다.
   * 소리 장치를 새로 만들지는 않는다(만들면 지도 화면에서도 바람 소리가 난다) */
  var doc = win.document;
  function onGesture() {
    var fa = root.fx && root.fx.audio, ctx = fa && typeof fa.context === 'function' ? fa.context() : null;
    try { if (ctx && ctx.state === 'suspended') { ctx.resume(); } } catch (e) {}
    if (!unlocked) { root.bgm.unlock(); }
  }
  if (doc && typeof doc.addEventListener === 'function') {
    doc.addEventListener('touchend', onGesture, true);
    doc.addEventListener('click', onGesture, true);
    doc.addEventListener('keydown', onGesture, true);
  }
})(typeof window !== 'undefined' ? window : this);
