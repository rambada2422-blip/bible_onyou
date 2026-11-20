/* 불붙은 떨기나무 압도 장면 — 그림판(그림 + 위쪽 하늘 띠), 가까이 보기와 전체 보기, 글자 자리, 모래색 덮개, 순서 0~6 진행.
 * docs/09_떨기나무_압도장면.md 1절, 3.1~3.3절, 4절, 7절, 10절의 식과 숫자를 그대로 따른다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.awe = function (G) {
  'use strict';
  var IW = 1024, IH = 1536, NEAR_W = 703, BUSH_CY = 681, CAP_H = 150, SAFE_Y = 1300;
  var STEP_DURS = [3.5, 1.5, 5.0, 6.0, 8.0, 9.0, 1.5];
  var STEP_PAUSE_T = [3.5, 1.1, 0.0, 6.0, 4.0, 5.0, 0.35];
  var rootEl, stageEl, skyEl, boardEl, img2, img3, capEl, textWrap, metaEl, lineEl, veilEl;
  var active = false, seqActive = false, seqStep = null, seqTime = 0, swapPhase = '', doneCb = null, rafId = 0, lastTick = 0;
  var reqView = 'near', curView = 'near', curPic = 2, curP = 0, curVeil = 0, shownText = '', shownRef = '';
  var ready2 = false, ready3 = false;

  function imgSrc(num) {
    var key = 'bush_' + num;
    var b64 = BO3D.aweData && BO3D.aweData[key];
    return b64 ? ('data:image/jpeg;base64,' + b64) : ('assets/awe/' + key + '.jpg');
  }

  /* 맨 윗줄의 색을 가로로 고르게 다듬어 위쪽 하늘 띠 배경으로 칠한다 (세로 줄무늬 방지) */
  function bakeSkyBand(im) {
    try {
      var c = document.createElement('canvas');
      c.width = IW; c.height = 4;
      var ctx = c.getContext('2d');
      ctx.drawImage(im, 0, 0, IW, 4, 0, 0, IW, 4);
      var data = ctx.getImageData(0, 0, IW, 4).data;
      var stops = 9, raw = [], i, x, y, x0, x1;
      for (i = 0; i < stops; i++) {
        x0 = Math.floor(i * IW / stops);
        x1 = Math.max(x0 + 1, Math.floor((i + 1) * IW / stops));
        var sr = 0, sg = 0, sb = 0, cnt = 0;
        for (y = 0; y < 4; y++) {
          for (x = x0; x < x1; x++) {
            var o = (y * IW + x) * 4;
            sr += data[o]; sg += data[o + 1]; sb += data[o + 2]; cnt++;
          }
        }
        raw.push([sr / cnt, sg / cnt, sb / cnt]);
      }
      var grad = [];
      for (i = 0; i < stops; i++) {
        var p0 = raw[Math.max(0, i - 1)], p1 = raw[i], p2 = raw[Math.min(stops - 1, i + 1)];
        var r = Math.round((p0[0] + p1[0] * 2 + p2[0]) / 4);
        var g = Math.round((p0[1] + p1[1] * 2 + p2[1]) / 4);
        var b = Math.round((p0[2] + p1[2] * 2 + p2[2]) / 4);
        var pct = Math.round(i / (stops - 1) * 1000) / 10;
        grad.push('rgb(' + r + ',' + g + ',' + b + ') ' + pct + '%');
      }
      skyEl.style.background = 'linear-gradient(90deg, ' + grad.join(', ') + ')';
    } catch (e) { /* 오프스크린 캔버스 실패 시 기본 하늘색 유지 */ }
  }

  /* 10절의 식과 숫자로 배율과 자리를 계산한다 */
  function computeLayout(viewMode, W, H) {
    var landscape = W > H || (window.innerWidth > window.innerHeight);
    var v = (viewMode === 'near' && !landscape) ? 'near' : 'wide';
    var scale, drawW, drawH, left, top, x0, x1, y0, y1, capY = null, skyH = 0;
    if (v === 'near') {
      scale = W / NEAR_W;
      drawW = IW * scale;
      drawH = IH * scale;
      left = 0;
      var visH = H * NEAR_W / W;
      if (visH <= IH) {
        y0 = Math.max(0, Math.min(IH - visH, BUSH_CY - visH / 2));
        y1 = y0 + visH;
        top = -y0 * scale;
      } else {
        top = H - drawH;
        y0 = 0;
        y1 = IH;
        skyH = Math.max(0, top);
      }
      x0 = 0;
      x1 = NEAR_W;
    } else {
      scale = Math.min(W / IW, (H - CAP_H) / SAFE_Y);
      drawW = IW * scale;
      drawH = IH * scale;
      left = (W - drawW) / 2;
      top = Math.max(0, (H - CAP_H) - drawH);
      capY = (H - CAP_H - top) / scale;
      x0 = 0;
      x1 = IW;
      y0 = 0;
      y1 = Math.min(IH, capY);
      skyH = Math.max(0, top);
    }
    return {
      view: v, scale: scale, drawW: drawW, drawH: drawH,
      left: left, top: top, x0: x0, x1: x1, y0: y0, y1: y1,
      capY: capY, skyH: skyH, W: W, H: H
    };
  }

  /* p: 0(가까이 보기) ~ 1(전체 보기) 보간 배치 */
  function applyBoardProgress(p) {
    if (!rootEl || !G.root) return null;
    curP = Math.max(0, Math.min(1, p));
    var W = G.root.clientWidth || 390, H = G.root.clientHeight || 844;
    var L0 = computeLayout('near', W, H);
    var L1 = computeLayout('wide', W, H);
    if (L0.view === 'wide' || curP >= 1) {
      curView = 'wide';
      reqView = (L0.view === 'wide' && curP === 0) ? 'near' : 'wide';
      var dw1 = Math.floor(L1.drawW * 64) / 64, dh1 = Math.floor(L1.drawH * 64) / 64;
      boardEl.style.left = L1.left + 'px';
      boardEl.style.top = L1.top + 'px';
      boardEl.style.width = dw1 + 'px';
      boardEl.style.height = dh1 + 'px';
      if (L1.skyH > 0) {
        skyEl.hidden = false;
        skyEl.style.left = L1.left + 'px';
        skyEl.style.top = '0px';
        skyEl.style.width = dw1 + 'px';
        skyEl.style.height = (Math.ceil(L1.skyH) + 2) + 'px';
      } else {
        skyEl.hidden = true;
      }
      return L1;
    }
    if (curP <= 0) {
      curView = 'near';
      var dw0 = Math.ceil(L0.drawW * 64) / 64, dh0 = Math.ceil(L0.drawH * 64) / 64;
      boardEl.style.left = L0.left + 'px';
      boardEl.style.top = L0.top + 'px';
      boardEl.style.width = dw0 + 'px';
      boardEl.style.height = dh0 + 'px';
      if (L0.skyH > 0) {
        skyEl.hidden = false;
        skyEl.style.left = L0.left + 'px';
        skyEl.style.top = '0px';
        skyEl.style.width = dw0 + 'px';
        skyEl.style.height = (Math.ceil(L0.skyH) + 2) + 'px';
      } else {
        skyEl.hidden = true;
      }
      return L0;
    }
    curView = curP < 0.5 ? 'near' : 'wide';
    var left = L0.left + (L1.left - L0.left) * curP;
    var top = L0.top + (L1.top - L0.top) * curP;
    var dw = L0.drawW + (L1.drawW - L0.drawW) * curP;
    var dh = L0.drawH + (L1.drawH - L0.drawH) * curP;
    var skyH = Math.max(0, top);
    boardEl.style.left = left + 'px';
    boardEl.style.top = top + 'px';
    boardEl.style.width = dw + 'px';
    boardEl.style.height = dh + 'px';
    if (skyH > 0) {
      skyEl.hidden = false;
      skyEl.style.left = left + 'px';
      skyEl.style.top = '0px';
      skyEl.style.width = dw + 'px';
      skyEl.style.height = (Math.ceil(skyH) + 2) + 'px';
    } else {
      skyEl.hidden = true;
    }
    return null;
  }

  function layoutAwe() {
    if (!rootEl || !G.root) return null;
    if (seqActive && seqStep !== null) {
      applySeqState(seqStep, seqTime);
      return null;
    }
    var W = G.root.clientWidth || 390, H = G.root.clientHeight || 844;
    var L = computeLayout(reqView, W, H);
    curView = L.view;
    var dw = (curView === 'near') ? (Math.ceil(L.drawW * 64) / 64) : (Math.floor(L.drawW * 64) / 64);
    var dh = (curView === 'near') ? (Math.ceil(L.drawH * 64) / 64) : (Math.floor(L.drawH * 64) / 64);
    boardEl.style.left = L.left + 'px';
    boardEl.style.top = L.top + 'px';
    boardEl.style.width = dw + 'px';
    boardEl.style.height = dh + 'px';
    if (L.skyH > 0) {
      skyEl.hidden = false;
      skyEl.style.left = L.left + 'px';
      skyEl.style.top = '0px';
      skyEl.style.width = dw + 'px';
      skyEl.style.height = (Math.ceil(L.skyH) + 2) + 'px';
    } else {
      skyEl.hidden = true;
    }
    capEl.hidden = (curView !== 'wide');
    capEl.style.opacity = '1';
    return L;
  }

  function setPic(pic) {
    curPic = (Number(pic) === 3) ? 3 : 2;
    if (!img2 || !img3) return;
    /* 두 그림을 같은 자리에 미리 그려 두고 겹치지 않게 한 번에 보이는 쪽만 바꾼다 */
    img2.style.visibility = (curPic === 2) ? 'visible' : 'hidden';
    img3.style.visibility = (curPic === 3) ? 'visible' : 'hidden';
  }

  function setVeil(op) {
    curVeil = Math.max(0, Math.min(1, op || 0));
    if (veilEl) veilEl.style.opacity = String(curVeil);
  }

  function setCaptionText(entry, alpha) {
    var a = Math.max(0, Math.min(1, alpha || 0));
    if (!entry || a <= 0.001) {
      shownText = '';
      shownRef = '';
      if (textWrap) textWrap.style.opacity = '0';
      if (metaEl) metaEl.replaceChildren();
      if (lineEl) lineEl.textContent = '';
      return;
    }
    var txt = G.tx(entry);
    shownRef = entry.ref || '';
    shownText = txt || '';
    metaEl.replaceChildren(shownRef ? G.refChip(shownRef) : null);
    lineEl.textContent = shownText;
    textWrap.style.opacity = String(a);
  }

  function easeInOut(u) {
    u = Math.max(0, Math.min(1, u));
    return u * u * (3 - 2 * u);
  }

  /* ── 소리 (docs/09 5절 표, 10절) ──
   * 순서에 들어갈 때(또는 시험용 값으로 그 순서의 t초로 옮길 때) 한 번만 정한다. 매 프레임 부르지 않는다.
   * 지금 있는 바람, 불 타는 소리, 낮은 음악만 쓴다. 하나님의 음성은 소리로 만들지 않는다. */
  var aweBase = null;
  function audioApi() {
    var A = G.FX && G.FX.audio;
    return (A && A.levels && A.levels()) ? A : null;
  }
  /* from에서 to까지 dur초 동안 바뀌는 소리의 t초 자리에서 시작해 남은 시간 동안 바꾼다 */
  function rampAt(A, name, from, to, t, dur) {
    var u = dur > 0 ? Math.max(0, Math.min(1, t / dur)) : 1;
    A.glide(name, to, Math.max(0, dur - t), from + (to - from) * u);
  }
  function applyAudio(step, t) {
    var A = audioApi(); if (!A) return;
    t = Math.max(0, t || 0);
    /* 장면 동안에는 떨기나무와의 거리로 불 소리를 정하는 계산을 멈춘다 */
    A.hold(true);
    if (!aweBase) { var L0 = A.levels(); aweBase = { wind: L0.wind, fire: L0.fire, crackle: L0.crackle }; }
    var b = aweBase, half = { wind: b.wind / 2, fire: b.fire / 2, crackle: b.crackle / 2 };
    /* 다 커졌을 때의 불 소리 = 지금 게임에서 넘지 못하는 선에 섰을 때의 크기. 그보다 크게 하지 않는다 */
    var top = A.fireLevel(G.P.witnessRadius);
    var full = { fire: Math.max(half.fire, top.fire), crackle: Math.max(half.crackle, top.crackle) };
    if (step !== 4) A.glide('scene', 1, 0);
    if (step === 0) {
      /* 0. 직전: 바람, 멀리 불 소리 (그때 크기 그대로) */
      A.glide('wind', b.wind, 0); A.glide('fire', b.fire, 0); A.glide('crackle', b.crackle, 0);
    } else if (step === 1) {
      /* 1. 넘어감: 바람과 불 타는 소리가 1.5초 동안 그때 크기의 절반으로 낮아진다 */
      rampAt(A, 'wind', b.wind, half.wind, t, 1.5);
      rampAt(A, 'fire', b.fire, half.fire, t, 1.5);
      rampAt(A, 'crackle', b.crackle, half.crackle, t, 1.5);
    } else if (step === 2) {
      /* 2. 떨기나무: 불 타는 소리만 5초에 걸쳐 차츰 커진다. 바람은 낮아진 그대로 */
      A.glide('wind', half.wind, 0);
      rampAt(A, 'fire', half.fire, full.fire, t, 5.0);
      rampAt(A, 'crackle', half.crackle, full.crackle, t, 5.0);
    } else if (step === 3) {
      /* 3. 모세: 그대로 이어진다 */
      A.glide('wind', half.wind, 0); A.glide('fire', full.fire, 0); A.glide('crackle', full.crackle, 0);
    } else if (step === 4) {
      /* 4. 부르심: 바람과 불 소리를 포함한 모든 소리가 0.5초에 걸쳐 멎고 4번이 끝날 때까지 조용하다 */
      rampAt(A, 'scene', 1, 0, t, 0.5);
      rampAt(A, 'wind', half.wind, 0, t, 0.5);
      rampAt(A, 'fire', full.fire, 0, t, 0.5);
      rampAt(A, 'crackle', full.crackle, 0, t, 0.5);
      A.glide('music', 0, 0);
    } else if (step === 5) {
      /* 5. 얼굴을 가림: 낮고 조용한 음악이 지켜보기 음악과 같은 크기로 2초에 걸쳐 시작된다. 불과 바람 소리는 없다 */
      A.glide('wind', 0, 0); A.glide('fire', 0, 0); A.glide('crackle', 0, 0);
      A.pad(true);
      rampAt(A, 'music', 0, A.NORMAL.music, t, 2.0);
    } else if (step === 6) {
      /* 6. 돌아옴: 음악이 이어지고, 바람과 불 소리가 평소 크기로 돌아온다 */
      A.pad(true);
      A.glide('music', A.NORMAL.music, 0);
      rampAt(A, 'wind', 0, A.NORMAL.wind, t, 1.5);
      A.hold(false);
    }
  }
  /* 장면이 끝나거나 멈추면 거리 계산과 평소 크기로 되돌린다. 음악은 부른 쪽(지켜보기, 처음 화면)이 정한다 */
  function releaseAudio() {
    var A = audioApi();
    if (!A || !aweBase) { aweBase = null; return; }
    A.hold(false);
    A.glide('scene', 1, 0);
    A.glide('wind', A.NORMAL.wind, 0.5);
    aweBase = null;
  }

  /* 순서 0~6의 시각 t(초) 상태를 화면에 반영한다 */
  function applySeqState(step, t) {
    var aweData = G.C3 && G.C3.horeb && G.C3.horeb.awe;
    var callEntry = aweData && aweData.call;
    var hideEntry = aweData && aweData.hide;
    if (step === 0) {
      /* 0. 직전: 인형풍 세계에서 카메라가 언덕 위를 올려다본다 */
      stageEl.hidden = true;
      capEl.hidden = true;
      setCaptionText(null, 0);
      setVeil(0);
      return;
    }
    if (step === 1) {
      /* 1. 넘어감(1.5초): 0.7초 동안 모래색으로 덮이고, 곧바로 0.8초 동안 가까이 보기 그림이 나타난다 */
      setPic(2);
      reqView = 'near';
      applyBoardProgress(0);
      capEl.hidden = true;
      setCaptionText(null, 0);
      if (t < 0.7) {
        stageEl.hidden = true;
        setVeil(easeInOut(t / 0.7));
      } else {
        stageEl.hidden = false;
        setVeil(1 - easeInOut((t - 0.7) / 0.8));
      }
      return;
    }
    if (step === 2) {
      /* 2. 떨기나무(5초): 가까이 보기. 5초 동안 한 가지 빠르기로 전체 움직임의 5%를 물러난다 */
      stageEl.hidden = false;
      setVeil(0);
      setPic(2);
      var p2 = 0.05 * Math.max(0, Math.min(1, t / 5.0));
      applyBoardProgress(p2);
      capEl.hidden = (curView !== 'wide');
      setCaptionText(null, 0);
      return;
    }
    if (step === 3) {
      /* 3. 모세(6초): 멈추지 않고 이어받아 6초 동안 나머지 95%를 물러나며 끝에서만 천천히 멈춘다 */
      stageEl.hidden = false;
      setVeil(0);
      setPic(2);
      var u3 = Math.max(0, Math.min(1, t / 6.0));
      var p3 = 0.05 + 0.95 * (1 - Math.pow(1 - u3, 2.4));
      applyBoardProgress(p3);
      capEl.hidden = false;
      capEl.style.opacity = String(1 - Math.pow(1 - u3, 2));
      setCaptionText(null, 0);
      return;
    }
    if (step === 4) {
      /* 4. 부르심(8초): 화면이 멈춘다. 글자가 0~1초에 떠오르고 7초까지 보이다가 7~8초에 사라진다 */
      stageEl.hidden = false;
      setVeil(0);
      setPic(2);
      reqView = 'wide';
      applyBoardProgress(1);
      capEl.hidden = false;
      capEl.style.opacity = '1';
      var a4 = 0;
      if (t < 1.0) a4 = Math.max(0, t / 1.0);
      else if (t <= 7.0) a4 = 1;
      else if (t < 8.0) a4 = Math.max(0, 1 - (t - 7.0) / 1.0);
      else a4 = 0;
      setCaptionText(callEntry, a4);
      return;
    }
    if (step === 5) {
      /* 5. 얼굴을 가림(9초): 4번 글자가 다 사라진 바로 뒤 그림이 한 번에 바뀐다. 글자는 1~2초에 떠올라 끝까지 보인다 */
      stageEl.hidden = false;
      setVeil(0);
      setPic(3);
      reqView = 'wide';
      applyBoardProgress(1);
      capEl.hidden = false;
      capEl.style.opacity = '1';
      var a5 = 0;
      if (t <= 1.0) a5 = 0;
      else if (t < 2.0) a5 = (t - 1.0) / 1.0;
      else a5 = 1;
      setCaptionText(hideEntry, a5);
      return;
    }
    if (step === 6) {
      /* 6. 돌아옴(1.5초): 0.7초 동안 글자와 그림이 함께 모래색에 덮이고, 0.8초 동안 인형풍 세계가 나타난다 */
      if (t < 0.7) {
        stageEl.hidden = false;
        setPic(3);
        reqView = 'wide';
        applyBoardProgress(1);
        capEl.hidden = false;
        capEl.style.opacity = '1';
        setCaptionText(hideEntry, 1);
        setVeil(easeInOut(t / 0.7));
      } else {
        stageEl.hidden = true;
        capEl.hidden = true;
        setCaptionText(null, 0);
        setVeil(1 - easeInOut((t - 0.7) / 0.8));
      }
    }
  }

  function stopAwe() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    active = false;
    seqActive = false;
    seqStep = null;
    seqTime = 0;
    swapPhase = '';
    doneCb = null;
    setCaptionText(null, 0);
    setVeil(0);
    releaseAudio();
    if (rootEl) rootEl.hidden = true;
    if (G.root) G.root.classList.remove('awe-on');
  }

  function finishAwe() {
    var cb = doneCb;
    stopAwe();
    if (cb) cb();
  }

  function tickAwe(now) {
    if (!seqActive) return;
    var dt = Math.min(0.1, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    if (!window.BO3D_TEST) {
      seqTime += dt;
      var dur = STEP_DURS[seqStep] || 1.5;
      if (seqTime >= dur) {
        if (seqStep < 6) {
          seqStep++;
          seqTime = 0;
          applySeqState(seqStep, 0);
          applyAudio(seqStep, 0);
        } else {
          finishAwe();
          return;
        }
      } else {
        applySeqState(seqStep, seqTime);
      }
    }
    if (seqActive) rafId = requestAnimationFrame(tickAwe);
  }

  function startAwe(onDone) {
    stopAwe();
    active = true;
    seqActive = true;
    seqStep = 0;
    swapPhase = '';
    doneCb = onDone || null;
    seqTime = window.BO3D_TEST ? STEP_PAUSE_T[0] : 0;
    if (G.root) G.root.classList.add('awe-on');
    rootEl.hidden = false;
    applySeqState(seqStep, seqTime);
    applyAudio(seqStep, seqTime);
    lastTick = performance.now();
    rafId = requestAnimationFrame(tickAwe);
    return aweState();
  }

  function aweNext(arg) {
    if (!seqActive) return null;
    if (arg === 'beforeSwap') {
      seqStep = 4;
      seqTime = 8.0;
      swapPhase = 'before';
      applySeqState(seqStep, seqTime);
      applyAudio(seqStep, seqTime);
      return aweState();
    }
    if (arg === 'afterSwap') {
      seqStep = 5;
      seqTime = 0.0;
      swapPhase = 'after';
      applySeqState(seqStep, seqTime);
      applyAudio(seqStep, seqTime);
      return aweState();
    }
    if (seqStep === 5 && swapPhase === 'after') {
      swapPhase = '';
      seqTime = STEP_PAUSE_T[5];
      applySeqState(seqStep, seqTime);
      applyAudio(seqStep, seqTime);
      return aweState();
    }
    if (seqStep < 6) {
      seqStep++;
      swapPhase = '';
      seqTime = window.BO3D_TEST ? STEP_PAUSE_T[seqStep] : 0;
      applySeqState(seqStep, seqTime);
      applyAudio(seqStep, seqTime);
      return aweState();
    }
    finishAwe();
    return aweState();
  }

  function aweState() {
    return {
      active: seqActive,
      step: seqActive ? seqStep : null,
      text: shownText,
      ref: shownRef,
      pic: curPic,
      view: curView,
      veil: curVeil,
      t: seqTime
    };
  }

  function showAwe(view, pic) {
    if (!view || view === 'off') {
      stopAwe();
      return null;
    }
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    seqActive = false;
    seqStep = null;
    active = true;
    reqView = (view === 'near') ? 'near' : 'wide';
    setPic(pic || 2);
    setVeil(0);
    setCaptionText(null, 0);
    if (G.root) G.root.classList.add('awe-on');
    stageEl.hidden = false;
    rootEl.hidden = false;
    layoutAwe();
    return aweRect();
  }

  function aweRect() {
    if (!active || !rootEl || rootEl.hidden || !G.root) return null;
    var rRoot = G.root.getBoundingClientRect();
    var rBoard = boardEl.getBoundingClientRect();
    var rCap = capEl.getBoundingClientRect();
    var W = rRoot.width, H = rRoot.height;
    var scale = rBoard.width / IW;
    var visBottom = (curView === 'wide' && !capEl.hidden) ? rCap.top : rRoot.bottom;
    var x0 = Math.max(0, (rRoot.left - rBoard.left) / scale);
    var x1 = Math.min(IW, (rRoot.right - rBoard.left) / scale);
    var y0 = Math.max(0, (rRoot.top - rBoard.top) / scale);
    var y1 = Math.min(IH, (visBottom - rBoard.top) / scale);
    var capY = (curView === 'wide' && !capEl.hidden) ? ((rCap.top - rBoard.top) / scale) : null;
    var skyH = Math.max(0, rBoard.top - rRoot.top);
    return {
      view: curView,
      requestedView: reqView,
      pic: curPic,
      W: W,
      H: H,
      x0: x0,
      x1: x1,
      y0: y0,
      y1: y1,
      capY: capY,
      skyH: skyH,
      scale: scale,
      left: rBoard.left - rRoot.left,
      top: rBoard.top - rRoot.top,
      width: rBoard.width,
      height: rBoard.height,
      ready: ready2 && ready3
    };
  }

  G.showAwe = showAwe;
  G.aweRect = aweRect;
  G.layoutAwe = layoutAwe;
  G.computeAweLayout = computeLayout;
  G.startAwe = startAwe;
  G.stopAwe = stopAwe;
  G.aweNext = aweNext;
  G.aweState = aweState;

  return function initAwe() {
    var el = G.el;
    skyEl = el('div', { class: 'awe-sky', hidden: true });
    img2 = el('img', { alt: '', decoding: 'sync' });
    img3 = el('img', { alt: '', decoding: 'sync' });
    img2.onload = function () { ready2 = true; bakeSkyBand(img2); };
    img3.onload = function () { ready3 = true; };
    img2.src = imgSrc(2);
    img3.src = imgSrc(3);
    boardEl = el('div', { class: 'awe-board' }, img2, img3);
    metaEl = el('div', { class: 'awe-meta' });
    lineEl = el('p', { class: 'awe-line' });
    textWrap = el('div', { class: 'awe-text' }, metaEl, lineEl);
    capEl = el('div', { class: 'awe-cap', hidden: true }, textWrap);
    stageEl = el('div', { class: 'awe-stage' }, skyEl, boardEl, capEl);
    veilEl = el('div', { class: 'awe-veil' });
    rootEl = el('div', { class: 'awe3', hidden: true }, stageEl, veilEl);
    G.root.appendChild(rootEl);
    setPic(2);
    window.addEventListener('resize', function () { if (active) layoutAwe(); });
  };
};
