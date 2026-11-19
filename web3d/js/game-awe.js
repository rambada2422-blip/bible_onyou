/* 불붙은 떨기나무 압도 장면 — 그림판(그림 + 위쪽 하늘 띠), 가까이 보기와 전체 보기, 글자 자리, 모래색 덮개.
 * docs/09_떨기나무_압도장면.md 3.2절, 3.3절, 10절의 식과 숫자를 그대로 따른다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.awe = function (G) {
  'use strict';
  var IW = 1024, IH = 1536, NEAR_W = 703, BUSH_CY = 681, CAP_H = 150, SAFE_Y = 1300;
  var rootEl, skyEl, boardEl, img2, img3, capEl, veilEl;
  var active = false, reqView = 'near', curView = 'near', curPic = 2, ready2 = false, ready3 = false;

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

  function layoutAwe() {
    if (!rootEl || !G.root) return null;
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
    return L;
  }

  function setPic(pic) {
    curPic = (Number(pic) === 3) ? 3 : 2;
    if (!img2 || !img3) return;
    /* 두 그림을 같은 자리에 미리 그려 두고 겹치지 않게 한 번에 보이는 쪽만 바꾼다 */
    img2.style.visibility = (curPic === 2) ? 'visible' : 'hidden';
    img3.style.visibility = (curPic === 3) ? 'visible' : 'hidden';
  }

  function showAwe(view, pic) {
    if (!view || view === 'off') {
      active = false;
      if (rootEl) rootEl.hidden = true;
      if (G.root) G.root.classList.remove('awe-on');
      return null;
    }
    active = true;
    reqView = (view === 'near') ? 'near' : 'wide';
    setPic(pic || 2);
    if (veilEl) veilEl.style.opacity = '0';
    if (G.root) G.root.classList.add('awe-on');
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
    capEl = el('div', { class: 'awe-cap', hidden: true });
    veilEl = el('div', { class: 'awe-veil' });
    rootEl = el('div', { class: 'awe3', hidden: true }, skyEl, boardEl, capEl, veilEl);
    G.root.appendChild(rootEl);
    setPic(2);
    window.addEventListener('resize', function () { if (active) layoutAwe(); });
  };
};
