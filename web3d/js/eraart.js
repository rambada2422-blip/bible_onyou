/* 이야기 카드의 배경: 시대마다 코드로 그린 단순한 풍경 (SVG 문자열).
 * 스타일가이드 2절을 지킨다: 하나님·천사의 형상 없음, 사람 없음(세 아이도 넣지 않는다), 글자 없음, 폭력 없음.
 * 먼 산은 뾰족한 뿔 모양으로 그리지 않는다(8절). 성경에 근거가 없는 건물·우상은 그리지 않는다. 시대의 분위기만 낸다.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var Wd = 900, Ht = 600;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  /* 부드러운 능선: 사인 몇 개를 겹친다. y는 기준 높이, amp는 굴곡 */
  function ridge(seed, y, amp, freq) {
    var r = rng(seed), ph = [r() * 6, r() * 6, r() * 6], pts = [], x;
    for (x = -20; x <= Wd + 20; x += 30) {
      var u = x / Wd, h = Math.sin(u * 6.28 * freq + ph[0]) * 0.55 + Math.sin(u * 6.28 * freq * 2.3 + ph[1]) * 0.3 + Math.sin(u * 6.28 * freq * 5.1 + ph[2]) * 0.15;
      pts.push([x, y - h * amp]);
    }
    var d = 'M' + pts[0][0] + ',' + Ht + ' L' + pts[0][0] + ',' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      d += ' Q' + p0[0] + ',' + p0[1].toFixed(1) + ' ' + mx + ',' + my.toFixed(1);
    }
    return d + ' L' + (Wd + 20) + ',' + Ht + ' Z';
  }
  function P(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function grad(id, stops) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join('') + '</linearGradient>';
  }
  function stars(seed, n, ymax) {
    var r = rng(seed), out = '', i;
    for (i = 0; i < n; i++) {
      var x = r() * Wd, y = r() * ymax, s = 0.8 + r() * 1.8;
      out += '<circle class="ea-tw' + (i % 3) + '" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + s.toFixed(1) + '" fill="#FFF6D8"/>';
    }
    return out;
  }
  function sun(x, y, r, c, glow) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 2.6) + '" fill="' + glow + '" opacity=".35"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.5) + '" fill="' + glow + '" opacity=".45"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>';
  }
  function cloud(x, y, s, c, cls) {
    return '<g class="' + (cls || 'ea-drift') + '" opacity=".85"><ellipse cx="' + x + '" cy="' + y + '" rx="' + 70 * s + '" ry="' + 16 * s + '" fill="' + c + '"/><ellipse cx="' + (x - 28 * s) + '" cy="' + (y - 10 * s) + '" rx="' + 32 * s + '" ry="' + 18 * s + '" fill="' + c + '"/><ellipse cx="' + (x + 18 * s) + '" cy="' + (y - 14 * s) + '" rx="' + 38 * s + '" ry="' + 22 * s + '" fill="' + c + '"/></g>';
  }
  function tent(x, y, s, c, dark) {
    return '<g><path d="M' + (x - 46 * s) + ',' + y + ' Q' + (x - 30 * s) + ',' + (y - 40 * s) + ' ' + x + ',' + (y - 52 * s) + ' Q' + (x + 30 * s) + ',' + (y - 40 * s) + ' ' + (x + 46 * s) + ',' + y + ' Z" fill="' + c + '"/>' +
      '<path d="M' + (x - 8 * s) + ',' + y + ' L' + x + ',' + (y - 30 * s) + ' L' + (x + 8 * s) + ',' + y + ' Z" fill="' + dark + '"/></g>';
  }
  function palm(x, y, s, trunk, leaf) {
    var out = '<path d="M' + x + ',' + y + ' Q' + (x + 8 * s) + ',' + (y - 50 * s) + ' ' + (x + 4 * s) + ',' + (y - 96 * s) + '" stroke="' + trunk + '" stroke-width="' + (7 * s) + '" fill="none" stroke-linecap="round"/>';
    var tx = x + 4 * s, ty = y - 96 * s, a;
    for (a = 0; a < 6; a++) {
      var ang = -2.9 + a * 0.55, ex = tx + Math.cos(ang) * 46 * s, ey = ty + Math.sin(ang) * 30 * s + 18 * s;
      out += '<path d="M' + tx + ',' + ty + ' Q' + ((tx + ex) / 2) + ',' + (ty - 16 * s) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1) + '" stroke="' + leaf + '" stroke-width="' + (6 * s) + '" fill="none" stroke-linecap="round"/>';
    }
    return out;
  }
  function tree(x, y, s, trunk, leaf, leaf2) {
    return '<rect x="' + (x - 4 * s) + '" y="' + (y - 34 * s) + '" width="' + (8 * s) + '" height="' + (34 * s) + '" rx="' + (3 * s) + '" fill="' + trunk + '"/>' +
      '<ellipse cx="' + x + '" cy="' + (y - 48 * s) + '" rx="' + (34 * s) + '" ry="' + (26 * s) + '" fill="' + leaf + '"/><ellipse cx="' + (x + 10 * s) + '" cy="' + (y - 56 * s) + '" rx="' + (20 * s) + '" ry="' + (15 * s) + '" fill="' + leaf2 + '"/>';
  }
  function walls(x, y, w, h, c, dark, seed, broken) {
    var r = rng(seed), out = '<rect x="' + x + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>', i, n = Math.floor(w / 18);
    for (i = 0; i < n; i++) if (!broken || r() > 0.35) out += '<rect x="' + (x + i * 18 + 2) + '" y="' + (y - h - 9) + '" width="10" height="9" fill="' + c + '"/>';
    for (i = 0; i < 3; i++) { var tx = x + (w - 30) * (i / 2); out += '<rect x="' + tx + '" y="' + (y - h - 22) + '" width="30" height="' + (h + 22) + '" fill="' + c + '"/><rect x="' + (tx + 11) + '" y="' + (y - h - 8) + '" width="8" height="12" rx="4" fill="' + dark + '"/>'; }
    for (i = 0; i < n * 2; i++) out += '<rect x="' + (x + r() * w).toFixed(0) + '" y="' + (y - r() * h).toFixed(0) + '" width="14" height="5" fill="' + dark + '" opacity=".25"/>';
    return out;
  }
  function birds(seed, n, c) {
    var r = rng(seed), out = '', i;
    for (i = 0; i < n; i++) { var x = 120 + r() * 660, y = 90 + r() * 140, s = 0.7 + r() * 0.6; out += '<path class="ea-drift" d="M' + (x - 12 * s) + ',' + y + ' Q' + (x - 6 * s) + ',' + (y - 7 * s) + ' ' + x + ',' + y + ' Q' + (x + 6 * s) + ',' + (y - 7 * s) + ' ' + (x + 12 * s) + ',' + y + '" stroke="' + c + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; }
    return out;
  }
  function water(y, c1, c2, seed) {
    var r = rng(seed), out = '<rect x="0" y="' + y + '" width="' + Wd + '" height="' + (Ht - y) + '" fill="' + c1 + '"/>', i;
    for (i = 0; i < 18; i++) { var wy = y + 8 + r() * (Ht - y - 10), wx = r() * Wd, ww = 30 + r() * 80; out += '<rect class="ea-shim" x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="' + ww.toFixed(0) + '" height="3" rx="1.5" fill="' + c2 + '" opacity=".55"/>'; }
    return out;
  }
  function river(y0, c1, c2) {
    return '<path d="M-20,' + (y0 + 40) + ' C200,' + (y0 + 10) + ' 320,' + (y0 + 90) + ' 470,' + (y0 + 70) + ' S760,' + (y0 + 20) + ' 920,' + (y0 + 50) + ' L920,' + (y0 + 110) + ' C760,' + (y0 + 80) + ' 640,' + (y0 + 140) + ' 470,' + (y0 + 130) + ' S180,' + (y0 + 80) + ' -20,' + (y0 + 110) + ' Z" fill="' + c1 + '"/>' +
      '<path class="ea-shim" d="M60,' + (y0 + 62) + ' C200,' + (y0 + 48) + ' 330,' + (y0 + 100) + ' 470,' + (y0 + 96) + '" stroke="' + c2 + '" stroke-width="3" fill="none" opacity=".6"/>';
  }
  function grain(seed, y, c) {
    var r = rng(seed), out = '', i;
    for (i = 0; i < 70; i++) { var x = r() * Wd, yy = y + r() * (Ht - y); out += '<path d="M' + x.toFixed(0) + ',' + yy.toFixed(0) + ' l2,-14" stroke="' + c + '" stroke-width="2" opacity=".55"/>'; }
    return out;
  }
  function stones(seed, y, n, c, c2) {
    var r = rng(seed), out = '', i;
    for (i = 0; i < n; i++) { var x = r() * Wd, yy = y + r() * (Ht - y - 10), w = 18 + r() * 30; out += '<ellipse cx="' + x.toFixed(0) + '" cy="' + yy.toFixed(0) + '" rx="' + w.toFixed(0) + '" ry="' + (w * 0.45).toFixed(0) + '" fill="' + (i % 2 ? c : c2) + '"/>'; }
    return out;
  }

  var ART = {
    /* 창조(OT-01)는 대목마다 지어진 것만 보이게 한다(창 1:2 흑암과 물 → 1:3 빛 → 1:6-13 궁창·땅·풀과 나무 → 1:14-19 해와 달과 별 → 1:20 새). 사람과 짐승은 그리지 않는다 */
    creation: function (st) {
      if (st === undefined) st = 9;
      if (st <= 0) return grad('ea-sky', [[0, '#05080F'], [1, '#101A30']]) + '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + water(300, '#0C1424', '#24324E', 5);
      if (st === 1) return grad('ea-sky', [[0, '#3A4A6A'], [0.6, '#C9D8E4'], [1, '#FBF7EE']]) + '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + water(320, '#5A7A92', '#FBF7EE', 5);
      return grad('ea-sky', [[0, '#2B4C8C'], [0.55, '#7AD0C8'], [1, '#F6E7C3']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + (st >= 3 ? sun(450, 330, 46, '#FFF6D8', '#FFF1B8') : '') +
        cloud(200, 140, 1.1, '#FBF7EE') + cloud(700, 110, 0.9, '#FBF7EE') + (st >= 4 ? birds(3, 5, '#22345B') : '') +
        water(340, '#3E8FA6', '#BFEDEA', 5) + P(ridge(11, 420, 30, 1.2), '#6F8448') + P(ridge(12, 470, 24, 1.8), '#4F6A36') +
        tree(150, 470, 1.2, '#7A4E2C', '#5C7A3A', '#7E9C4C') + tree(760, 486, 1.0, '#7A4E2C', '#5C7A3A', '#7E9C4C') + P(ridge(13, 540, 14, 2.5), '#3D5A2E');
    },
    patriarchs: function () {
      return grad('ea-sky', [[0, '#0E1730'], [0.6, '#22345B'], [1, '#5A4A82']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + stars(7, 140, 360) +
        '<circle cx="720" cy="110" r="30" fill="#FFF6D8"/><circle cx="734" cy="100" r="28" fill="#16233F"/>' +
        P(ridge(21, 380, 34, 0.9), '#3A3460') + P(ridge(22, 440, 26, 1.4), '#6B5A54') +
        tent(300, 470, 1.3, '#9A6238', '#4A2E1C') + tent(430, 482, 1.0, '#B07A48', '#4A2E1C') + tent(560, 474, 1.15, '#8A5A34', '#4A2E1C') +
        P(ridge(23, 510, 16, 2.2), '#7A5E46') + P(ridge(24, 560, 10, 3), '#5E4636');
    },
    exodus: function () {
      return grad('ea-sky', [[0, '#5A4A82'], [0.5, '#EA6A2A'], [1, '#F7B733']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + sun(640, 290, 40, '#FFE9A8', '#F7B733') +
        P(ridge(31, 300, 70, 0.6), '#7A4A5A') + water(372, '#3E7FA0', '#F7D9A0', 9) +
        P(ridge(32, 420, 22, 1.6), '#C98E52') + palm(150, 480, 1.1, '#6B4426', '#4F6A36') + palm(220, 492, 0.8, '#6B4426', '#5C7A3A') +
        P(ridge(33, 500, 18, 2.4), '#E4BE7E') + stones(34, 520, 9, '#B88A58', '#9A6238');
    },
    wilderness: function () {
      var t = '', i;
      for (i = 0; i < 9; i++) t += tent(130 + i * 82 + (i % 2) * 18, 452 + (i % 3) * 10, 0.55 + (i % 3) * 0.1, i % 2 ? '#B07A48' : '#9A6238', '#4A2E1C');
      return grad('ea-sky', [[0, '#7AD0C8'], [0.7, '#F6E7C3'], [1, '#FBE9DC']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + sun(180, 120, 34, '#FFF6D8', '#FFF1B8') + cloud(620, 130, 1, '#FBF7EE') +
        P(ridge(41, 330, 80, 0.5), '#B98A6A') + P(ridge(42, 410, 20, 1.1), '#D9A86A') + t +
        P(ridge(43, 500, 14, 2.4), '#E4BE7E') + stones(44, 520, 7, '#C99A64', '#B07A48');
    },
    conquest: function () {
      return grad('ea-sky', [[0, '#5FB3C8'], [0.7, '#CDEBE4'], [1, '#F6E7C3']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + cloud(240, 120, 1, '#FBF7EE') + cloud(720, 150, 0.8, '#FBF7EE') +
        P(ridge(51, 330, 40, 0.8), '#8FA27A') + walls(560, 336, 220, 46, '#C9A26A', '#6B4A2A', 52) +
        P(ridge(53, 400, 22, 1.4), '#7E9C4C') + river(410, '#3E8FA6', '#BFEDEA') +
        palm(120, 470, 1, '#6B4426', '#4F6A36') + palm(780, 476, 1.1, '#6B4426', '#5C7A3A') + P(ridge(54, 540, 12, 2.6), '#5C7A3A');
    },
    judges: function () {
      return grad('ea-sky', [[0, '#8CC8D8'], [0.75, '#F6E7C3'], [1, '#FBE9DC']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + sun(720, 140, 36, '#FFF6D8', '#FFE9A8') + cloud(250, 120, 0.9, '#FBF7EE') +
        P(ridge(61, 330, 34, 0.9), '#93A86E') + P(ridge(62, 390, 28, 1.3), '#B9A85A') + P(ridge(63, 450, 22, 1.8), '#D8B860') +
        grain(64, 452, '#A07E30') + tree(170, 470, 1.0, '#6B4426', '#6F8448', '#8FA65A') + tree(640, 490, 1.2, '#6B4426', '#6F8448', '#8FA65A') +
        P(ridge(65, 540, 12, 2.8), '#B49444');
    },
    kingdom: function () {
      return grad('ea-sky', [[0, '#3E6FA8'], [0.6, '#F2C58A'], [1, '#F7B733']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + sun(200, 230, 38, '#FFF1C8', '#F7B733') + cloud(660, 120, 1, '#FBE9DC') +
        P(ridge(71, 360, 50, 0.7), '#8A6A6A') + P(ridge(72, 380, 70, 0.4), '#A27A5A') + walls(330, 330, 260, 60, '#E4BE7E', '#7A5232', 73) +
        P(ridge(74, 450, 22, 1.5), '#9A7A4A') + tree(120, 500, 1.1, '#5E3E22', '#5C7A3A', '#6F8448') + tree(800, 494, 1.0, '#5E3E22', '#5C7A3A', '#6F8448') +
        P(ridge(75, 540, 14, 2.6), '#7A6038');
    },
    divided: function () {
      return grad('ea-sky', [[0, '#3A3460'], [0.55, '#B4532A'], [1, '#F7B733']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + sun(450, 320, 44, '#FFE0A0', '#EA6A2A') +
        P(ridge(81, 320, 60, 0.6), '#4A3A5A') + water(380, '#4A5E8A', '#F7B733', 15) +
        '<path d="M-20,600 L-20,330 Q120,300 260,340 Q360,370 420,420 L460,600 Z" fill="#5A4A4A"/><path d="M920,600 L920,350 Q780,310 640,360 Q560,390 520,440 L480,600 Z" fill="#4E3E44"/>' +
        P(ridge(82, 550, 10, 2.8), '#3A2E34');
    },
    exile: function () {
      return grad('ea-sky', [[0, '#5A4A82'], [0.6, '#C98EA0'], [1, '#F2C58A']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + sun(720, 210, 32, '#FFF1C8', '#F2C58A') + birds(9, 4, '#3A3460') +
        P(ridge(91, 360, 12, 0.6), '#9A7A8A') + walls(80, 370, 520, 74, '#C9A26A', '#6B4A2A', 92) +
        '<rect x="300" y="318" width="70" height="52" rx="35" fill="#4A3A3A"/>' +
        water(420, '#4A7A9A', '#F2C58A', 21) + palm(680, 470, 1.2, '#5E3E22', '#4F6A36') + palm(770, 480, 0.9, '#5E3E22', '#5C7A3A') +
        P(ridge(93, 560, 8, 2), '#6B5A4A');
    },
    return: function () {
      return grad('ea-sky', [[0, '#5FB3C8'], [0.6, '#FBE9DC'], [1, '#F7D9A0']]) +
        '|<rect width="900" height="600" fill="url(#ea-sky)"/>' + sun(170, 300, 40, '#FFF6D8', '#F7D9A0') + cloud(600, 120, 1.1, '#FBF7EE') +
        P(ridge(101, 360, 44, 0.8), '#9AA27A') + walls(240, 410, 480, 70, '#D9B27A', '#7A5232', 102, true) +
        stones(103, 430, 14, '#C99A64', '#B07A48') + P(ridge(104, 520, 16, 2.4), '#A88A5A') + stones(105, 540, 8, '#9A7A4A', '#B49464');
    }
  };
  /* key의 풍경을 SVG 문자열로 돌려준다 */
  /* opts.stage: 단계가 있는 풍경(창조)의 단계, opts.align: 'bottom'이면 아래쪽(땅)을 맞춰 자른다(지도의 띠 그림)
   * opts.scene, opts.at: 장면과 대목이 주어지고 그 장면의 그림이 sceneart.js에 있으면 그것을 쓴다(없으면 시대 풍경 그대로) */
  var uid = 0;
  function art(key, opts) {
    opts = opts || {};
    var SA = window.BO3D.sceneArt, str = null;
    if (opts.scene && SA) { try { str = SA.draw(opts.scene, opts.at); } catch (e) { str = null; } }
    if (!str) str = (ART[key] || ART.wilderness)(opts.stage);
    /* 한 화면에 그림이 여러 장 있어도(시대 지도) 하늘 색이 서로 섞이지 않게 id를 그림마다 다르게 한다 */
    var parts = str.split('ea-sky').join('ea-sky' + (uid++)).split('|');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" preserveAspectRatio="xMidY' + (opts.align === 'bottom' ? 'Max' : 'Mid') + ' slice" aria-hidden="true"><defs>' + parts[0] + '</defs>' + parts.slice(1).join('') + '</svg>';
  }
  /* kit: 장면 그림(sceneart.js)이 같은 붓을 쓰도록 내놓는다 */
  BO3D.eraArt = { art: art, keys: Object.keys(ART), kit: { rng: rng, ridge: ridge, P: P, grad: grad, stars: stars, sun: sun, cloud: cloud, tent: tent, palm: palm, tree: tree, walls: walls, birds: birds, water: water, river: river, grain: grain, stones: stones } };
})();
