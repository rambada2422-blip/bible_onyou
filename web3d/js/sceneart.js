/* 이야기 카드의 장면별·대목별 배경 (SVG 문자열). 시대 풍경(eraart.js) 대신, 본문에 나오는 장소와 물건으로 대목마다 달리 그린다.
 * 규칙(스타일가이드 2절, docs/auto/art_지시.md):
 *  - 하나님·천사의 형상 없음, 사람 없음(세 아이도), 글자 없음, 폭력 없음.
 *  - 본문에 근거가 없는 건물·우상·짐승을 그리지 않는다. 그리는 것마다 근거 장절을 주석에 적는다.
 *  - 본문이 생김새를 말하지 않으면 멀리, 단순하게. 심판·죽음의 대목은 그 자리의 하늘·땅·빈 길(사건 앞뒤의 풍경)만.
 *  - 움직임은 story.css의 ea-/sa- 클래스만(움직임 줄이기 설정이면 멈춘다).
 * 그림판은 900×600. 휴대폰에서는 가운데 x 110~790, y 90~510쯤만 보인다(위는 단추, 아래는 글 시트가 가린다). 중요한 것은 그 안에 둔다.
 * 쓰는 법: SA.reg('OT-NN', { beats: [그림 함수, ...], arrive: 번호 또는 함수(기본 0), end: 번호 또는 함수(기본 마지막 대목) })
 *          그림 함수는 SVG 조각 문자열을 돌려준다. 같은 그림을 여러 대목에 쓰려면 같은 함수를 넣는다.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var EA = BO3D.eraArt; if (!EA || !EA.kit) return;
  var K = EA.kit, rng = K.rng, ridge = K.ridge, P = K.P;
  var W = 900, H = 600, defs = '', gid = 0;
  function f1(v) { return Math.round(v * 10) / 10; }
  /* 색 섞기: a와 b를 t만큼 */
  function mix(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), o = '#', i, x, y;
    for (i = 16; i >= 0; i -= 8) { x = (pa >> i) & 255; y = (pb >> i) & 255; o += ('0' + Math.round(x + (y - x) * t).toString(16)).slice(-2); }
    return o;
  }
  function dk(c, t) { return mix(c, '#16233F', t === undefined ? 0.25 : t); }
  function lt(c, t) { return mix(c, '#FBF7EE', t === undefined ? 0.25 : t); }
  /* 그라데이션(위→아래, horiz면 왼→오른). 돌려주는 값을 fill에 쓴다 */
  function lg(stops, horiz) {
    var id = 'sa-g' + (gid++);
    defs += '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (horiz ? 1 : 0) + '" y2="' + (horiz ? 0 : 1) + '">' + stops.map(function (s, i) { return '<stop offset="' + (s.length === 2 && typeof s !== 'string' ? s[0] : i / (stops.length - 1)) + '" stop-color="' + (typeof s === 'string' ? s : s[1]) + '"/>'; }).join('') + '</linearGradient>';
    return 'url(#' + id + ')';
  }
  function rgl(c, o0) {   /* 가운데가 밝은 둥근 빛 */
    var id = 'sa-g' + (gid++);
    defs += '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity="' + (o0 === undefined ? 0.9 : o0) + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>';
    return 'url(#' + id + ')';
  }
  function R(x, y, w, h, fill, ex) { return '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="' + fill + '"' + (ex || '') + '/>'; }
  function E(x, y, rx, ry, fill, ex) { return '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="' + fill + '"' + (ex || '') + '/>'; }
  function Gp(inner, ex) { return '<g' + (ex || '') + '>' + inner + '</g>'; }
  function op(v) { return ' opacity="' + v + '"'; }

  /* ── 하늘 ── */
  var SKY = {
    deepnight: ['#070B18', '#131E3A', '#2A2F5A'], night: ['#0E1730', '#22345B', '#5A4A82'], predawn: ['#1B2548', '#4A4A82', '#C98E8A'],
    dawn: ['#5A6EA8', '#E8A98A', '#FBE3B0'], morning: ['#7FC4D6', '#D6EEE4', '#FBEFD0'], day: ['#5FB3C8', '#CDEBE4', '#F6E7C3'],
    noon: ['#8CC8D8', '#E9EBD8', '#FBE9DC'], dry: ['#B9C4B8', '#E8DCC0', '#EFD9B0'], gold: ['#3E6FA8', '#F2C58A', '#F7B733'],
    dusk: ['#5A4A82', '#EA6A2A', '#F7B733'], evening: ['#3A3460', '#B4532A', '#F2A65A'], afterglow: ['#22345B', '#5A4A82', '#E08A5A'],
    grey: ['#6E7C8C', '#A9B4BC', '#D8D6CC'], storm: ['#2A3040', '#4A5568', '#8A8F98']
  };
  function sky(name) { var s = SKY[name] || SKY.day; return R(0, 0, W, H, lg([[0, s[0]], [0.6, s[1]], [1, s[2]]])); }
  function moon(x, y, r, skyc) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#FFF6D8"/><circle cx="' + (x + r * 0.45) + '" cy="' + (y - r * 0.3) + '" r="' + (r * 0.92) + '" fill="' + (skyc || '#16233F') + '"/>'; }
  function glow(x, y, r, c, o) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + rgl(c, o) + '"/>'; }
  function hill(seed, y, amp, freq, c) { return P(ridge(seed, y, amp, freq), c); }
  function ground(y, c) { return R(0, y, W, H - y, c); }

  /* ── 땅 위의 것 ── */
  /* 멀어지는 길: 앞(아래)에서 뒤(위)로 좁아진다. bend는 휘는 정도 */
  function road(x0, y0, w0, x1, y1, w1, c, bend, c2) {
    var b = bend || 0, mx = (x0 + x1) / 2 + b, my = (y0 + y1) / 2;
    var d = 'M' + f1(x0 - w0 / 2) + ',' + y0 + ' Q' + f1(mx - (w0 + w1) / 4) + ',' + my + ' ' + f1(x1 - w1 / 2) + ',' + y1 + ' L' + f1(x1 + w1 / 2) + ',' + y1 + ' Q' + f1(mx + (w0 + w1) / 4) + ',' + my + ' ' + f1(x0 + w0 / 2) + ',' + y0 + ' Z';
    return P(d, c) + (c2 ? '<path d="M' + f1(x0 - w0 * 0.2) + ',' + y0 + ' Q' + f1(mx - (w0 + w1) * 0.1) + ',' + my + ' ' + f1(x1 - w1 * 0.2) + ',' + y1 + '" stroke="' + c2 + '" stroke-width="3" fill="none" opacity=".5"/>' : '');
  }
  /* 돌: 둥글게 깎인 덩어리 + 어두운 면 + 밝은 윗면 */
  function rock(x, y, w, h, c, d) {
    d = d || dk(c);
    return E(x, y + 2, w * 0.62, h * 0.16, '#16233F', op(0.18)) +
      '<path d="M' + f1(x - w / 2) + ',' + y + ' Q' + f1(x - w * 0.52) + ',' + f1(y - h * 0.7) + ' ' + f1(x - w * 0.2) + ',' + f1(y - h) + ' Q' + f1(x + w * 0.2) + ',' + f1(y - h * 1.08) + ' ' + f1(x + w * 0.42) + ',' + f1(y - h * 0.62) + ' Q' + f1(x + w * 0.56) + ',' + f1(y - h * 0.2) + ' ' + f1(x + w / 2) + ',' + y + ' Z" fill="' + c + '"/>' +
      '<path d="M' + f1(x + w * 0.08) + ',' + y + ' Q' + f1(x + w * 0.2) + ',' + f1(y - h * 0.5) + ' ' + f1(x + w * 0.42) + ',' + f1(y - h * 0.62) + ' Q' + f1(x + w * 0.56) + ',' + f1(y - h * 0.2) + ' ' + f1(x + w / 2) + ',' + y + ' Z" fill="' + d + '"/>' +
      '<path d="M' + f1(x - w * 0.3) + ',' + f1(y - h * 0.78) + ' Q' + f1(x - w * 0.05) + ',' + f1(y - h * 0.98) + ' ' + f1(x + w * 0.2) + ',' + f1(y - h * 0.86) + '" stroke="' + lt(c, 0.35) + '" stroke-width="' + f1(Math.max(2, h * 0.07)) + '" fill="none" stroke-linecap="round" opacity=".7"/>';
  }
  function rocks(seed, y0, y1, n, c, x0, x1) {
    var r = rng(seed), out = '', i, a = [];
    for (i = 0; i < n; i++) a.push([(x0 || 0) + r() * ((x1 || W) - (x0 || 0)), y0 + r() * (y1 - y0), 0.6 + r() * 0.8]);
    a.sort(function (p, q) { return p[1] - q[1]; });
    for (i = 0; i < n; i++) out += rock(a[i][0], a[i][1], 34 * a[i][2], 18 * a[i][2], i % 2 ? c : lt(c, 0.12));
    return out;
  }
  /* 풀 포기 */
  function tufts(seed, y0, y1, n, c, x0, x1) {
    var r = rng(seed), out = '', i, j;
    for (i = 0; i < n; i++) {
      var x = (x0 || 0) + r() * ((x1 || W) - (x0 || 0)), y = y0 + r() * (y1 - y0), s = 0.6 + (y - y0) / Math.max(1, y1 - y0) * 0.7, d = '';
      for (j = -2; j <= 2; j++) d += 'M' + f1(x) + ',' + f1(y) + ' q' + f1(j * 3 * s) + ',' + f1(-9 * s) + ' ' + f1(j * 6 * s) + ',' + f1(-(15 - Math.abs(j) * 3) * s) + ' ';
      out += '<path d="' + d + '" stroke="' + c + '" stroke-width="' + f1(2 * s) + '" fill="none" stroke-linecap="round"/>';
    }
    return out;
  }
  function bush(x, y, s, c, c2) {
    return E(x, y, 30 * s, 5 * s, '#16233F', op(0.15)) + E(x - 14 * s, y - 12 * s, 20 * s, 15 * s, c) + E(x + 12 * s, y - 14 * s, 22 * s, 17 * s, c) + E(x, y - 24 * s, 18 * s, 14 * s, c2 || lt(c, 0.2));
  }
  /* 곡식 밭: 익은 이삭이 선 밭. 위로 갈수록 촘촘하고 작다 */
  function field(seed, y0, y1, c, c2, x0, x1) {
    var r = rng(seed), out = '', i, n = Math.round(110 * (x1 === undefined || x0 === undefined ? 1 : Math.max(0.35, ((x1 || W) - (x0 || 0)) / W)));
    x0 = x0 || 0; x1 = x1 || W;
    for (i = 0; i < n; i++) {
      var t = Math.pow(i / n, 1.6), y = y0 + t * (y1 - y0), x = x0 + r() * (x1 - x0), s = 0.45 + t * 1.2;
      out += '<path d="M' + f1(x) + ',' + f1(y) + ' q' + f1(2 * s) + ',' + f1(-12 * s) + ' ' + f1(1 * s) + ',' + f1(-22 * s) + '" stroke="' + c + '" stroke-width="' + f1(1.8 * s) + '" fill="none" stroke-linecap="round"/>' +
        E(x + 1.5 * s, y - 25 * s, 2.4 * s, 6 * s, c2);
    }
    return out;
  }
  /* 벤 자리(그루터기) */
  function stubble(seed, y0, y1, n, c, x0, x1) {
    var r = rng(seed), out = '', i;
    for (i = 0; i < n; i++) { var t = r(), y = y0 + t * (y1 - y0), x = (x0 || 0) + r() * ((x1 || W) - (x0 || 0)), s = 0.5 + t; out += '<path d="M' + f1(x) + ',' + f1(y) + ' l' + f1(1.5 * s) + ',' + f1(-6 * s) + ' M' + f1(x + 4 * s) + ',' + f1(y) + ' l' + f1(-1 * s) + ',' + f1(-5 * s) + '" stroke="' + c + '" stroke-width="' + f1(1.6 * s) + '" stroke-linecap="round"/>'; }
    return out;
  }
  /* 곡식 단: 가운데를 묶은 다발 */
  function sheaf(x, y, s, c, d) {
    d = d || dk(c, 0.3);
    var out = E(x, y + 1, 22 * s, 5 * s, '#16233F', op(0.18)), i;
    out += '<path d="M' + f1(x - 16 * s) + ',' + y + ' L' + f1(x - 7 * s) + ',' + f1(y - 34 * s) + ' L' + f1(x + 7 * s) + ',' + f1(y - 34 * s) + ' L' + f1(x + 16 * s) + ',' + y + ' Z" fill="' + c + '"/>';
    out += '<path d="M' + f1(x + 3 * s) + ',' + y + ' L' + f1(x + 3 * s) + ',' + f1(y - 34 * s) + ' L' + f1(x + 7 * s) + ',' + f1(y - 34 * s) + ' L' + f1(x + 16 * s) + ',' + y + ' Z" fill="' + d + '" opacity=".5"/>';
    for (i = -3; i <= 3; i++) out += '<path d="M' + f1(x + i * 2 * s) + ',' + f1(y - 34 * s) + ' Q' + f1(x + i * 5 * s) + ',' + f1(y - 50 * s) + ' ' + f1(x + i * 8 * s) + ',' + f1(y - (60 - Math.abs(i) * 4) * s) + '" stroke="' + lt(c, 0.15) + '" stroke-width="' + f1(4 * s) + '" fill="none" stroke-linecap="round"/>';
    return out + R(x - 8 * s, y - 37 * s, 16 * s, 5 * s, d, ' rx="' + f1(2 * s) + '"');
  }
  /* 낟알 더미 */
  function heap(x, y, w, h, c) {
    return E(x, y, w * 0.56, h * 0.16, '#16233F', op(0.18)) + '<path d="M' + f1(x - w / 2) + ',' + y + ' Q' + f1(x - w * 0.2) + ',' + f1(y - h * 1.1) + ' ' + x + ',' + f1(y - h) + ' Q' + f1(x + w * 0.24) + ',' + f1(y - h * 0.9) + ' ' + f1(x + w / 2) + ',' + y + ' Z" fill="' + c + '"/>' +
      '<path d="M' + f1(x + w * 0.05) + ',' + y + ' Q' + f1(x + w * 0.12) + ',' + f1(y - h * 0.7) + ' ' + x + ',' + f1(y - h) + ' Q' + f1(x + w * 0.24) + ',' + f1(y - h * 0.9) + ' ' + f1(x + w / 2) + ',' + y + ' Z" fill="' + dk(c, 0.2) + '" opacity=".6"/>';
  }
  /* 항아리, 바구니, 두루마리, 등잔 */
  function jar(x, y, s, c, d) {
    d = d || dk(c);
    return E(x, y, 15 * s, 4 * s, '#16233F', op(0.2)) + '<path d="M' + f1(x - 7 * s) + ',' + f1(y - 38 * s) + ' L' + f1(x + 7 * s) + ',' + f1(y - 38 * s) + ' L' + f1(x + 6 * s) + ',' + f1(y - 32 * s) + ' Q' + f1(x + 20 * s) + ',' + f1(y - 22 * s) + ' ' + f1(x + 9 * s) + ',' + y + ' L' + f1(x - 9 * s) + ',' + y + ' Q' + f1(x - 20 * s) + ',' + f1(y - 22 * s) + ' ' + f1(x - 6 * s) + ',' + f1(y - 32 * s) + ' Z" fill="' + c + '"/>' +
      '<path d="M' + f1(x + 2 * s) + ',' + f1(y - 32 * s) + ' L' + f1(x + 6 * s) + ',' + f1(y - 32 * s) + ' Q' + f1(x + 20 * s) + ',' + f1(y - 22 * s) + ' ' + f1(x + 9 * s) + ',' + y + ' L' + f1(x + 3 * s) + ',' + y + ' Q' + f1(x + 10 * s) + ',' + f1(y - 20 * s) + ' ' + f1(x + 2 * s) + ',' + f1(y - 32 * s) + ' Z" fill="' + d + '" opacity=".55"/>' +
      E(x, y - 38 * s, 7 * s, 2 * s, d);
  }
  function basket(x, y, s, c, fillc) {
    return E(x, y, 22 * s, 4 * s, '#16233F', op(0.2)) + (fillc ? E(x, y - 22 * s, 19 * s, 8 * s, fillc) : '') +
      '<path d="M' + f1(x - 22 * s) + ',' + f1(y - 22 * s) + ' Q' + x + ',' + f1(y - 14 * s) + ' ' + f1(x + 22 * s) + ',' + f1(y - 22 * s) + ' L' + f1(x + 16 * s) + ',' + y + ' L' + f1(x - 16 * s) + ',' + y + ' Z" fill="' + c + '"/>' +
      '<path d="M' + f1(x - 19 * s) + ',' + f1(y - 13 * s) + ' Q' + x + ',' + f1(y - 6 * s) + ' ' + f1(x + 19 * s) + ',' + f1(y - 13 * s) + ' M' + f1(x - 17 * s) + ',' + f1(y - 6 * s) + ' Q' + x + ',' + f1(y + 0 * s) + ' ' + f1(x + 17 * s) + ',' + f1(y - 6 * s) + '" stroke="' + dk(c, 0.3) + '" stroke-width="' + f1(2 * s) + '" fill="none" opacity=".6"/>';
  }
  /* 두루마리: open이면 조금 펼친 것. 글자는 그리지 않는다 */
  function scroll(x, y, s, open) {
    var pc = '#EAD9B0', pd = '#C9B07A', rod = '#7A5232', w = open ? 70 * s : 0, out = E(x, y + 2 * s, (34 + w / 2) * s / s, 4 * s, '#16233F', op(0.2));
    if (open) out += R(x - w / 2, y - 14 * s, w, 14 * s, pc) + R(x - w / 2, y - 3 * s, w, 3 * s, pd, op(0.5));
    function roll(cx) { return R(cx - 8 * s, y - 16 * s, 16 * s, 16 * s, pc, ' rx="' + f1(7 * s) + '"') + R(cx - 8 * s, y - 6 * s, 16 * s, 6 * s, pd, ' rx="' + f1(3 * s) + '" opacity=".6"') + R(cx - 2.5 * s, y - 21 * s, 5 * s, 26 * s, rod, ' rx="' + f1(2 * s) + '"'); }
    if (open) return out + roll(x - w / 2 - 6 * s) + roll(x + w / 2 + 6 * s);
    return out + '<g transform="rotate(90 ' + f1(x) + ' ' + f1(y - 8 * s) + ')">' + roll(x) + '</g>' + R(x - 21 * s, y - 16 * s, 42 * s, 16 * s, pc, ' rx="' + f1(7 * s) + '"') + R(x - 21 * s, y - 6 * s, 42 * s, 6 * s, pd, ' rx="' + f1(3 * s) + '" opacity=".6"') + R(x - 26 * s, y - 10.5 * s, 6 * s, 5 * s, rod, ' rx="' + f1(2 * s) + '"') + R(x + 20 * s, y - 10.5 * s, 6 * s, 5 * s, rod, ' rx="' + f1(2 * s) + '"');
  }
  function lamp(x, y, s) {
    return glow(x + 14 * s, y - 16 * s, 60 * s, '#F7B733', 0.5) + E(x, y, 16 * s, 3 * s, '#16233F', op(0.2)) +
      '<path d="M' + f1(x - 16 * s) + ',' + f1(y - 8 * s) + ' Q' + x + ',' + f1(y - 14 * s) + ' ' + f1(x + 18 * s) + ',' + f1(y - 10 * s) + ' Q' + f1(x + 8 * s) + ',' + f1(y + 2 * s) + ' ' + f1(x - 8 * s) + ',' + y + ' Q' + f1(x - 16 * s) + ',' + f1(y - 2 * s) + ' ' + f1(x - 16 * s) + ',' + f1(y - 8 * s) + ' Z" fill="#9A6238"/>' +
      '<path class="sa-flick" d="M' + f1(x + 16 * s) + ',' + f1(y - 10 * s) + ' q' + f1(-5 * s) + ',' + f1(-8 * s) + ' 0,' + f1(-18 * s) + ' q' + f1(6 * s) + ',' + f1(9 * s) + ' 0,' + f1(18 * s) + ' Z" fill="#F7B733"/>';
  }
  /* 불: 모닥불·제단의 불. 얼굴이나 사람 모양이 생기지 않게 좌우가 다른 혀 세 겹만 */
  function fire(x, y, s) {
    function fl(w, h, c, dx) { return '<path class="sa-flick" d="M' + f1(x - w + dx) + ',' + y + ' Q' + f1(x - w * 1.1 + dx) + ',' + f1(y - h * 0.5) + ' ' + f1(x - w * 0.2 + dx) + ',' + f1(y - h) + ' Q' + f1(x + w * 0.1 + dx) + ',' + f1(y - h * 0.55) + ' ' + f1(x + w * 0.55 + dx) + ',' + f1(y - h * 0.8) + ' Q' + f1(x + w * 1.2 + dx) + ',' + f1(y - h * 0.35) + ' ' + f1(x + w + dx) + ',' + y + ' Z" fill="' + c + '"/>'; }
    return glow(x, y - 20 * s, 90 * s, '#F7B733', 0.45) + fl(22 * s, 58 * s, '#EA6A2A', 0) + fl(14 * s, 40 * s, '#F7B733', 2 * s) + fl(7 * s, 22 * s, '#FFF1B8', 3 * s);
  }
  function smoke(x, y, s, c) {
    var out = '', i;
    for (i = 0; i < 5; i++) out += E(x + Math.sin(i * 1.7) * 14 * s + i * 6 * s, y - i * 26 * s, (14 + i * 6) * s, (10 + i * 4) * s, c || '#D8D6CC', op(f1(0.5 - i * 0.08)));
    return Gp(out, ' class="ea-drift"');
  }
  /* 돌을 쌓은 단 */
  function altar(x, y, s, c) {
    var out = E(x, y + 2, 60 * s, 8 * s, '#16233F', op(0.2)), row, i, r = rng(Math.round(x * 7 + y));
    for (row = 0; row < 3; row++) {
      var n = 4 - (row === 2 ? 1 : 0), w = 104 * s / 4, x0 = x - n * w / 2;
      for (i = 0; i < n; i++) out += R(x0 + i * w + 1, y - (row + 1) * 20 * s, w - 2, 19 * s, (i + row) % 2 ? c : lt(c, 0.12), ' rx="' + f1(6 * s) + '"') + R(x0 + i * w + 1, y - (row + 1) * 20 * s + 13 * s, w - 2, 6 * s, dk(c, 0.3), ' rx="' + f1(3 * s) + '" opacity="' + f1(0.3 + r() * 0.2) + '"');
    }
    return out;
  }
  /* 양(멀리 작게): 몸통과 머리만 */
  function sheep(x, y, s, c) {
    c = c || '#F1EADB';
    return E(x, y, 15 * s, 3 * s, '#16233F', op(0.16)) + R(x - 9 * s, y - 9 * s, 3 * s, 9 * s, '#6B5A4A') + R(x + 6 * s, y - 9 * s, 3 * s, 9 * s, '#6B5A4A') +
      E(x, y - 15 * s, 15 * s, 10 * s, c) + E(x - 6 * s, y - 20 * s, 8 * s, 6 * s, lt(c, 0.3)) + E(x + 15 * s, y - 19 * s, 5.5 * s, 4.5 * s, '#5E4636');
  }

  /* ── 집과 성읍 ── */
  /* 흙벽돌 집: 평평한 지붕, 문 하나, 작은 창 */
  function house(x, y, w, h, c, o) {
    o = o || {};
    var d = dk(c, 0.28), l = lt(c, 0.18), out = '';
    out += R(x, y - h, w, h, c) + R(x + w * 0.66, y - h, w * 0.34, h, d, op(0.35)) + R(x - 3, y - h - 5, w + 6, 7, l, ' rx="2"');
    if (o.door !== false) out += '<path d="M' + f1(x + w * (o.doorAt || 0.3)) + ',' + y + ' v' + f1(-h * 0.42) + ' q' + f1(w * 0.08) + ',' + f1(-h * 0.1) + ' ' + f1(w * 0.16) + ',0 v' + f1(h * 0.42) + ' Z" fill="' + (o.lit ? '#F4C272' : dk(c, 0.6)) + '"/>';
    if (o.win !== false) out += R(x + w * 0.62, y - h * 0.72, w * 0.12, h * 0.16, o.lit ? '#F4C272' : dk(c, 0.55), ' rx="1.5"');
    if (o.stairs) out += '<path d="M' + f1(x + w) + ',' + y + ' l' + f1(h * 0.5) + ',0 l0,' + f1(-h * 0.14) + ' l' + f1(-h * 0.12) + ',0 l0,' + f1(-h * 0.14) + ' l' + f1(-h * 0.12) + ',0 l0,' + f1(-h * 0.14) + ' l' + f1(-h * 0.12) + ',0 l0,' + f1(-h * 0.14) + ' l' + f1(-h * 0.14) + ',0 Z" fill="' + d + '"/>';
    return out;
  }
  /* 성읍: 집 여러 채가 겹쳐 선 덩어리. 뒤는 흐리고 앞은 진하다. cx 가운데, y 밑선, w 너비 */
  function town(seed, cx, y, w, n, c, s, o) {
    var r = rng(seed), out = '', i, rows = 3, row;
    s = s || 1; o = o || {};
    for (row = 0; row < rows; row++) {
      var cnt = Math.max(2, Math.round(n * (0.5 + row * 0.25))), rw = w * (0.62 + row * 0.19), col = mix(c, o.haze || '#C9D8E4', 0.36 - row * 0.18);
      for (i = 0; i < cnt; i++) {
        var hw = (rw / cnt) * (0.85 + r() * 0.5), hh = (26 + r() * 22) * s, hx = cx - rw / 2 + (i / cnt) * rw + r() * 6, hy = y - (rows - 1 - row) * 15 * s;
        out += house(hx, hy, hw, hh, i % 3 === 1 ? lt(col, 0.12) : col, { door: row === rows - 1 && r() > 0.3, win: r() > 0.35, lit: o.lit && r() > 0.45 });
      }
    }
    return out;
  }
  /* 성문: 양쪽 망대와 가운데 문 구멍 */
  function gate(x, y, w, h, c) {
    var d = dk(c, 0.3), l = lt(c, 0.15), tw = w * 0.3, out = '';
    out += R(x - w / 2, y - h, w, h, c) + R(x - w / 2, y - h * 1.22, tw, h * 1.22, c) + R(x + w / 2 - tw, y - h * 1.22, tw, h * 1.22, c) + R(x + w / 2 - tw * 0.4, y - h * 1.22, tw * 0.4, h * 1.22, d, op(0.4));
    out += R(x - w / 2 - 3, y - h * 1.22 - 6, tw + 6, 8, l, ' rx="2"') + R(x + w / 2 - tw - 3, y - h * 1.22 - 6, tw + 6, 8, l, ' rx="2"');
    out += '<path d="M' + f1(x - w * 0.13) + ',' + y + ' v' + f1(-h * 0.5) + ' q' + f1(w * 0.13) + ',' + f1(-h * 0.26) + ' ' + f1(w * 0.26) + ',0 v' + f1(h * 0.5) + ' Z" fill="' + dk(c, 0.62) + '"/>';
    return out;
  }
  /* 성벽 한 줄(성가퀴 있음) */
  function wall(x, y, w, h, c, seed) {
    var r = rng(seed || 3), out = R(x, y - h, w, h, c) + R(x, y - h * 0.35, w, h * 0.35, dk(c, 0.25), op(0.3)), i, n = Math.floor(w / 16);
    for (i = 0; i < n; i++) out += R(x + i * 16 + 2, y - h - 7, 9, 8, c);
    for (i = 0; i < n; i++) out += R(x + r() * (w - 14), y - r() * h * 0.9, 12, 4, dk(c, 0.3), op(0.22));
    return out;
  }
  /* 기둥 */
  function column(x, y, w, h, c) {
    return R(x - w / 2, y - h, w, h, c) + R(x + w * 0.1, y - h, w * 0.4, h, dk(c, 0.3), op(0.35)) + R(x - w * 0.75, y - h - w * 0.5, w * 1.5, w * 0.55, lt(c, 0.12), ' rx="3"') + R(x - w * 0.75, y - w * 0.4, w * 1.5, w * 0.45, dk(c, 0.15), ' rx="3"');
  }
  /* 층계 */
  function steps(x, y, w, n, sh, c) {
    var out = '', i;
    for (i = 0; i < n; i++) out += R(x - w / 2 + i * 9, y - (i + 1) * sh, w - i * 18, sh, i % 2 ? c : lt(c, 0.1)) + R(x - w / 2 + i * 9, y - (i + 1) * sh + sh * 0.7, w - i * 18, sh * 0.3, dk(c, 0.3), op(0.3));
    return out;
  }
  /* 여호와의 전(솔로몬이 지은 전)을 멀리서: 높은 본채, 앞의 낭실과 두 기둥, 옆의 다락(왕상 6:2-5, 7:15-21). 생김새의 나머지는 단순하게 */
  function temple(x, y, s, c) {
    var d = dk(c, 0.3), l = lt(c, 0.2);
    return R(x - 62 * s, y - 46 * s, 124 * s, 46 * s, mix(c, d, 0.25)) + R(x - 66 * s, y - 50 * s, 132 * s, 6 * s, l, ' rx="2"') +
      R(x - 36 * s, y - 104 * s, 72 * s, 104 * s, c) + R(x + 12 * s, y - 104 * s, 24 * s, 104 * s, d, op(0.3)) + R(x - 40 * s, y - 109 * s, 80 * s, 7 * s, l, ' rx="2"') +
      R(x - 13 * s, y - 62 * s, 26 * s, 62 * s, dk(c, 0.6)) + column(x - 26 * s, y, 9 * s, 78 * s, '#B07A48') + column(x + 26 * s, y, 9 * s, 78 * s, '#B07A48');
  }
  /* 방 안: 벽과 바닥, 창 하나(창밖 하늘색). 창에서 드는 빛은 자연의 빛이다 */
  function room(wallc, floorc, fy, o) {
    o = o || {};
    var out = R(0, 0, W, fy, lg([dk(wallc, 0.18), wallc])) + R(0, fy, W, H - fy, lg([floorc, dk(floorc, 0.25)])) + R(0, fy - 5, W, 9, dk(wallc, 0.3), op(0.35));
    if (o.win) {
      var wx = o.win[0], wy = o.win[1], ww = o.win[2] || 110, wh = o.win[3] || 150;
      out += R(wx - 8, wy - 8, ww + 16, wh + 16, dk(wallc, 0.22), ' rx="6"') + R(wx, wy, ww, wh, o.sky || '#CDEBE4', ' rx="3"') + R(wx, wy + wh - 10, ww, 10, lt(wallc, 0.3), op(0.8));
      if (o.beam !== false) out += '<path d="M' + wx + ',' + (wy + wh) + ' L' + (wx + ww) + ',' + (wy + wh) + ' L' + (wx + ww + 150) + ',' + H + ' L' + (wx - 60) + ',' + H + ' Z" fill="' + (o.beamc || '#FFF6D8') + '" opacity=".16"/>';
    }
    return out;
  }
  /* 낮은 상(탁자) */
  function table(x, y, w, h, c) {
    return E(x, y + 2, w * 0.56, 6, '#16233F', op(0.2)) + R(x - w / 2 + 8, y - h, 9, h, dk(c, 0.3)) + R(x + w / 2 - 17, y - h, 9, h, dk(c, 0.3)) + R(x - w / 2, y - h - 9, w, 11, c, ' rx="3"') + R(x - w / 2, y - h - 1, w, 3, dk(c, 0.35), op(0.5));
  }
  /* 다듬은 돌 더미, 재목 더미 */
  function blocks(x, y, s, c) {
    var out = E(x, y + 2, 62 * s, 7 * s, '#16233F', op(0.2)), a = [[-50, 0, 46], [0, 0, 50], [-28, 1, 52]], i;
    for (i = 0; i < a.length; i++) { var bx = x + a[i][0] * s, by = y - a[i][1] * 24 * s; out += R(bx, by - 24 * s, a[i][2] * s, 24 * s, i % 2 ? lt(c, 0.12) : c) + R(bx + a[i][2] * s * 0.7, by - 24 * s, a[i][2] * s * 0.3, 24 * s, dk(c, 0.3), op(0.35)) + R(bx, by - 24 * s, a[i][2] * s, 3 * s, lt(c, 0.35), op(0.7)); }
    return out;
  }
  function timber(x, y, s, c) {
    var out = E(x, y + 2, 70 * s, 6 * s, '#16233F', op(0.2)), i, d = dk(c, 0.3);
    for (i = 0; i < 5; i++) { var row = i < 3 ? 0 : 1, k = i < 3 ? i : i - 3, bx = x - 62 * s + k * 14 * s + row * 8 * s, by = y - row * 12 * s; out += R(bx, by - 12 * s, 110 * s, 11 * s, i % 2 ? c : lt(c, 0.1), ' rx="' + f1(3 * s) + '"') + E(bx + 110 * s, by - 6.5 * s, 4 * s, 5.5 * s, lt(c, 0.35)) + R(bx, by - 4 * s, 110 * s, 3 * s, d, op(0.3)); }
    return out;
  }
  /* 큰 산 한 덩어리(뿔처럼 뾰족하지 않게) */
  function mount(cx, y, w, h, c) {
    return '<path d="M' + f1(cx - w / 2) + ',' + y + ' Q' + f1(cx - w * 0.3) + ',' + f1(y - h * 0.7) + ' ' + f1(cx - w * 0.1) + ',' + f1(y - h * 0.96) + ' Q' + f1(cx + w * 0.04) + ',' + f1(y - h * 1.04) + ' ' + f1(cx + w * 0.16) + ',' + f1(y - h * 0.9) + ' Q' + f1(cx + w * 0.36) + ',' + f1(y - h * 0.5) + ' ' + f1(cx + w / 2) + ',' + y + ' Z" fill="' + c + '"/>' +
      '<path d="M' + f1(cx + w * 0.02) + ',' + y + ' Q' + f1(cx + w * 0.1) + ',' + f1(y - h * 0.6) + ' ' + f1(cx + w * 0.02) + ',' + f1(y - h) + ' Q' + f1(cx + w * 0.1) + ',' + f1(y - h * 1.0) + ' ' + f1(cx + w * 0.16) + ',' + f1(y - h * 0.9) + ' Q' + f1(cx + w * 0.36) + ',' + f1(y - h * 0.5) + ' ' + f1(cx + w / 2) + ',' + y + ' Z" fill="' + dk(c, 0.3) + '" opacity=".4"/>';
  }

  /* ── 등록과 그리기 ── */
  var REG = {};
  function reg(id, def) { REG[id] = def; }
  function pick(def, at) {
    var b = def.beats || [], v;
    if (at === -1 || at === undefined || at === null) { v = def.arrive; if (typeof v === 'function') return v; return b[typeof v === 'number' ? v : 0]; }
    if (at === 'end') { v = def.end; if (typeof v === 'function') return v; return b[typeof v === 'number' ? v : b.length - 1]; }
    return b[Math.max(0, Math.min(b.length - 1, at))];
  }
  /* '정의|본문' 꼴(eraart.js의 art가 svg로 감싼다). 그림이 없는 장면이면 null */
  function draw(id, at) {
    var def = REG[id]; if (!def) return null;
    var f = pick(def, at); if (!f) return null;
    defs = '';
    var body = f(at);
    return defs + '|' + body;
  }
  var KIT = { W: W, H: H, rng: rng, ridge: ridge, P: P, R: R, E: E, G: Gp, op: op, f1: f1, mix: mix, dk: dk, lt: lt, lg: lg, rgl: rgl,
    sky: sky, SKY: SKY, moon: moon, glow: glow, hill: hill, ground: ground, stars: K.stars, sun: K.sun, cloud: K.cloud, birds: K.birds, water: K.water, river: K.river,
    tent: K.tent, palm: K.palm, tree: K.tree, road: road, rock: rock, rocks: rocks, tufts: tufts, bush: bush, field: field, stubble: stubble, sheaf: sheaf, heap: heap,
    jar: jar, basket: basket, scroll: scroll, lamp: lamp, fire: fire, smoke: smoke, altar: altar, sheep: sheep,
    house: house, town: town, gate: gate, wall: wall, column: column, steps: steps, temple: temple, room: room, table: table, blocks: blocks, timber: timber, mount: mount };
  BO3D.sceneArt = { reg: reg, draw: draw, has: function (id) { return !!REG[id]; }, ids: function () { return Object.keys(REG); }, count: function (id) { return REG[id] ? REG[id].beats.length : 0; }, kit: KIT };
})();

/* ═══ 장면 그림 (아래부터 장면마다 한 묶음. 장면 번호 순서) ═══ */

/* ── OT-02 에덴 동산과 사람의 범죄 (창 2:15-17, 3:1-24) ──
 * 그린 것과 근거: 동산의 여러 나무(창 2:9, 2:16) · 동산을 적시는 강(2:10) · 동산 가운데의 두 나무(2:9, 3:3. 열매는 종류·빛깔을 알 수 없어 잎보다 조금 밝은 작은 낟으로만) · 무화과나무 잎(3:7)
 * · 날이 서늘할 때의 동산 나무 사이(3:8) · 동산 안의 드러난 흙(3:17, 3:19) · 동산 동편의 길과 갈아야 할 땅(3:23-24).
 * 그리지 않은 것: 사람(아담, 하와), 뱀(3:1-5, 3:14), 하나님의 형상·발·그림자(3:8), 엮은 치마와 가죽옷(3:7, 3:21), 그룹들과 두루 도는 화염검(3:24),
 * 가시덤불과 엉겅퀴(3:18. 앞으로 "낼 것이라"는 말씀이라 그리지 않았다), 특정 과일로 보이는 열매(빨강·주황의 둥근 열매). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = k.f1, TR = '#6B4426', FR = '#BDD08E';
  /* 잎이 우거진 나무. fr를 주면 잎보다 조금 밝은 작고 길쭉한 낟(종류·빛깔을 특정하지 않는다) */
  function gt(x, y, s, lf, fr, sd) {
    var d = k.dk(lf, 0.22), l = k.lt(lf, 0.22), r = k.rng(sd || 201), i, o = k.E(x, y, 36 * s, 6 * s, '#16233F', k.op(0.18));
    o += k.P('M' + f(x - 8 * s) + ',' + y + ' Q' + f(x - 3 * s) + ',' + f(y - 40 * s) + ' ' + f(x - 5 * s) + ',' + f(y - 84 * s) + ' L' + f(x + 5 * s) + ',' + f(y - 84 * s) + ' Q' + f(x + 4 * s) + ',' + f(y - 40 * s) + ' ' + f(x + 10 * s) + ',' + y + ' Z', TR);
    o += k.E(x - 30 * s, y - 82 * s, 30 * s, 22 * s, d) + k.E(x + 32 * s, y - 80 * s, 30 * s, 22 * s, d) + k.E(x, y - 100 * s, 46 * s, 32 * s, lf) + k.E(x - 26 * s, y - 112 * s, 28 * s, 20 * s, lf) + k.E(x + 24 * s, y - 116 * s, 30 * s, 22 * s, lf) + k.E(x - 10 * s, y - 126 * s, 24 * s, 13 * s, l) + k.E(x + 30 * s, y - 112 * s, 14 * s, 9 * s, l);
    if (fr) for (i = 0; i < 11; i++) o += k.E(x - 48 * s + r() * 96 * s, y - 118 * s + r() * 44 * s, 1.7 * s, 3 * s, fr);
    return o;
  }
  function grove(sd, y, n, s, c, c2, x0, x1) { var r = k.rng(sd), o = '', i; for (i = 0; i < n; i++) o += k.tree(f(x0 + (i + r() * 0.7) * (x1 - x0) / n), f(y + r() * 10), f(s * (0.8 + r() * 0.5)), TR, i % 2 ? c : c2, k.lt(c, 0.2)); return o; }
  /* 동산의 바탕: 먼 언덕, 멀리 줄지은 나무, 풀밭, 흘러가는 강(창 2:8-10) */
  function garden(sky, far, g1, g2, wc, bend) {
    return k.sky(sky) + k.hill(202, 318, 30, 0.7, far) + k.hill(203, 350, 16, 1.2, k.mix(far, g1, 0.5)) + grove(204, 356, 16, 0.6, k.mix(g1, far, 0.35), k.mix(g2, far, 0.35), 0, 900) +
      k.ground(352, g1) + k.hill(205, 400, 8, 1.6, g2) + k.road(240, 600, 250, 560, 356, 12, wc, bend, k.lt(wc, 0.5)) + grove(206, 392, 5, 0.9, k.dk(g1, 0.1), g2, 590, 900);
  }
  function sk(a, b, c) { return k.R(0, 0, 900, 600, k.lg([[0, a], [0.6, b], [1, c]])); }
  /* 강 밖의 풀 포기 */
  function tf(sd, c) { return k.tufts(sd, 490, 590, 4, c, 10, 120) + k.tufts(sd + 1, 470, 590, 9, c, 640, 890); }
  var G1 = '#8DB36A', G2 = '#7AA35C', WC = '#7AD0C8';
  /* 1) 에덴 동산(창 2:15-17, 2:8-10): 아침, 여러 나무와 강, 동산 가운데 두 나무 */
  function eden() {
    return garden('morning', '#A9C8C0', G1, G2, WC, 170) + k.cloud(250, 150, 0.9, '#FBF7EE') + gt(160, 450, 0.9, '#5E8F4A') + gt(430, 478, 1.25, '#4F8A52', FR, 211) + gt(640, 462, 1.1, '#6F8448', FR, 212) +
      k.bush(770, 500, 1.1, '#6F9A50') + tf(213, '#5E8A44');
  }
  /* 2) 동산 가운데 있는 나무(창 3:1-5, 3:3): 한낮, 가까이서 본 그 나무. 뱀은 그리지 않는다 */
  function midst() {
    return k.sky('day') + k.hill(202, 330, 26, 0.7, '#A9C8C0') + grove(214, 372, 13, 0.85, '#7FA862', '#6F9A58', 0, 900) + k.ground(370, G1) + k.hill(215, 410, 8, 1.4, G2) +
      gt(180, 440, 0.8, '#5E8F4A') + gt(480, 500, 2.2, '#6F8448', FR, 216) + k.bush(250, 510, 1.2, '#5E8A44') + k.bush(740, 490, 1, '#6F9A50') + k.tufts(217, 480, 590, 12, '#5E8A44');
  }
  /* 무화과나무 잎(창 3:7): 손바닥처럼 갈라진 잎 */
  function fig(x, y, s, a, c) {
    var o = '', i;
    for (i = -2; i <= 2; i++) o += k.E(x, y - 17 * s, 6.5 * s, (19 - Math.abs(i) * 3) * s, c, ' transform="rotate(' + (a + i * 34) + ' ' + f(x) + ' ' + f(y) + ')"');
    return o;
  }
  /* 3) 보암직한 나무와 무화과나무 잎(창 3:6-7): 금빛 볕, 열매 달린 가지 아래와 곁의 무화과나무 */
  function fruit() {
    var r = k.rng(221), o = '', i;
    for (i = 0; i < 17; i++) { var x = 520 + r() * 250, y = 300 + r() * 150; o += fig(f(x), f(y), 1 + r() * 0.5, f(r() * 60 - 30), i % 3 ? '#5E8F4A' : '#79A85A'); }
    return k.sky('gold') + k.hill(202, 340, 24, 0.7, '#B8B48A') + grove(222, 378, 12, 0.8, '#8FA65A', '#7E9A50', 0, 900) + k.ground(376, '#9DB060') + k.hill(223, 420, 8, 1.4, '#8AA254') +
      gt(250, 520, 2.5, '#6F8448', FR, 216) + k.P('M640,500 Q650,420 620,330 M645,440 Q690,400 720,330', 'none', ' stroke="#7A5232" stroke-width="9" stroke-linecap="round"') + o + k.tufts(224, 490, 590, 10, '#6F8448');
  }
  /* 4) 날이 서늘할 때 동산 나무 사이(창 3:8): 묽은 저녁빛, 빽빽한 나무 그늘. 걷는 발이나 그림자는 없다 */
  function among() {
    return sk('#4A4A80', '#A88AA0', '#E8B48A') + k.hill(202, 340, 24, 0.7, '#5A5278') + grove(231, 384, 15, 1, '#4A6A52', '#3E5E4C', 0, 900) + k.ground(380, '#4E7250') + k.hill(232, 420, 8, 1.4, '#456A4A') +
      gt(330, 440, 1.2, '#3E6A4A') + gt(590, 446, 1.3, '#44704A') + gt(150, 500, 1.9, '#356044') + gt(760, 510, 2, '#2F5A40') + gt(455, 520, 1.5, '#3A6646') + k.bush(300, 520, 1.2, '#2F5A40') + k.tufts(233, 490, 590, 10, '#2A4A3A');
  }
  /* 5) 땅은 너로 인하여 저주를 받고, 너는 흙이니(창 3:17, 3:19): 같은 동산, 더 저문 때. 나무 사이로 드러난 맨흙과 돌. 가시덤불·엉겅퀴(3:18 앞으로의 일)와 뱀은 그리지 않는다 */
  function soil() {
    return sk('#343462', '#7A6490', '#D89A78') + k.hill(202, 340, 24, 0.7, '#4E4A74') + grove(242, 384, 14, 0.9, '#43624E', '#3A5848', 0, 900) + k.ground(380, '#486A4C') + k.hill(232, 420, 8, 1.4, '#40624A') +
      k.P('M20,600 Q150,424 450,404 Q740,420 880,600 Z', '#7E6650') + k.P('M180,600 Q300,462 480,446 Q660,460 760,600 Z', '#8C7258') + gt(120, 470, 1.5, '#33583F') + gt(790, 480, 1.6, '#2D543C') +
      k.rocks(245, 426, 560, 7, '#7A7078', 230, 690) + k.tufts(246, 470, 590, 6, '#2A4A3A', 700, 890);
  }
  /* 6) 동산의 저녁(창 3:20-21. 본문은 자리를 더 말하지 않는다): 대목 1과 같은 자리, 해 진 뒤의 강과 나무들. 가죽옷은 그리지 않는다 */
  function dusk() {
    return garden('afterglow', '#4A4A78', '#4E7058', '#45684E', '#8A9AC0', 170) + gt(160, 450, 0.9, '#356044') + gt(430, 478, 1.25, '#2F5A40', '#6A8C6C', 211) + gt(640, 462, 1.1, '#3E6046', '#6A8C6C', 212) + k.bush(770, 500, 1.1, '#2F5A40') + tf(251, '#2A4A3A');
  }
  /* 7) 동산 동편(창 3:23-24): 해 진 뒤, 멀어진 동산과 밖으로 난 빈 길, 아직 갈지 않은 맨땅. 그룹들과 화염검은 그리지 않는다 */
  function east() {
    return k.sky('afterglow') + k.hill(202, 330, 26, 0.7, '#4A4A78') + k.hill(261, 352, 14, 0.9, '#3E5A52') + grove(262, 350, 14, 0.7, '#2F5444', '#3A5E4A', 230, 680) + k.hill(263, 380, 10, 1.3, '#6A5858') + k.ground(398, '#766058') +
      k.hill(264, 436, 8, 1.9, '#80685C') + k.road(450, 600, 280, 460, 362, 14, '#A08C88', 70, '#6A5A5C') + k.rocks(265, 440, 570, 8, '#6A6270', 100, 330) + k.rocks(266, 450, 570, 4, '#6A6270', 620, 800) + k.tufts(268, 450, 590, 7, '#4A4E48');
  }
  SA.reg('OT-02', { beats: [eden, midst, fruit, among, soil, dusk, east], arrive: 0, end: 6 });
})();

/* ── OT-04 바벨에서 흩어짐 (창 11:1-9) ──
 * 그린 것과 근거: 시날 평지(창 11:2. 산과 강 없이 평평한 땅) · 구운 벽돌과 역청(11:3) · 쌓고 있는 성과 대(11:4-5. 생김새는 본문에 없어 층층이 쌓다 만 벽돌 덩어리로 멀리, 단순하게)
 * · 쌓기를 그친 성(11:8) · 온 지면으로 흩어져 간 여러 갈래 길(11:8-9).
 * 그리지 않은 것: 사람, 하나님이 내려오시는 모습과 빛줄기(11:5), 하늘에 닿은 완성된 대, 무너지거나 벼락 맞는 대(본문에 없음), 특정 나라의 신전 꾸밈(나선 길·신당). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = k.f1, BR = '#B8724A';
  function plain(sky, far, c1, c2) { return (k.SKY[sky] ? k.sky(sky) : k.R(0, 0, 900, 600, sky)) + k.hill(401, 352, 4, 0.5, far) + k.ground(356, c1) + k.hill(402, 402, 4, 1.1, k.mix(c1, c2, 0.5)) + k.hill(403, 450, 5, 1.7, c2); }
  /* 벽돌 더미: 엇갈려 쌓은 구운 벽돌(창 11:3). p를 주면 벽돌 사이를 검은 역청으로 메운다 */
  function bricks(x, y, cols, rows, s, c, sd, p) {
    var r = k.rng(sd || 411), o = k.E(x + cols * 11 * s, y + 2, cols * 13 * s, 5 * s, '#16233F', k.op(0.2)), i, j;
    if (p) for (j = 0; j < rows; j++) o += k.R(x + (j % 2) * 11 * s, y - (j + 1) * 10 * s - 1, (cols - (j % 2)) * 22 * s - s, 10 * s + 1, '#2A2226');
    for (j = 0; j < rows; j++) for (i = 0; i < cols - (j % 2); i++) o += k.R(x + (i + (j % 2) * 0.5) * 22 * s, y - (j + 1) * 10 * s, 21 * s, 9.2 * s, k.mix(c, r() > 0.5 ? '#E0A070' : '#7A4A30', r() * 0.3), ' rx="' + f(1.5 * s) + '"');
    return o;
  }
  /* 쌓다 만 대: 층층이 쌓은 벽돌 덩어리, 꼭대기는 들쭉날쭉(창 11:4-5, 11:8) */
  function tower(x, y, w, h, n, c, sd) {
    var r = k.rng(sd || 421), o = '', i, j, th = h / n, d = k.dk(c, 0.3);
    for (i = 0; i < n; i++) {
      var tw = w * (1 - i * 0.62 / n), ty = y - (i + 1) * th;
      o += k.R(x - tw / 2, ty, tw, th + 1, i % 2 ? k.lt(c, 0.07) : c) + k.R(x + tw * 0.18, ty, tw * 0.32, th + 1, d, k.op(0.3)) + k.R(x - tw / 2, ty, tw, th * 0.1, k.lt(c, 0.3), k.op(0.6));
      for (j = 0; j < 5; j++) o += k.R(x - tw / 2 + r() * (tw - tw * 0.12), ty + th * (0.2 + r() * 0.6), tw * 0.1, th * 0.07, d, k.op(0.25));
      if (i === n - 1) for (j = 0; j < 6; j++) { var bh = th * (0.1 + r() * 0.5); o += k.R(x - tw / 2 + j * tw / 6, ty - bh, tw / 6 - 1, bh + 1, j > 3 ? k.mix(c, d, 0.3) : c); }
    }
    return o;
  }
  /* 쌓다 만 성벽: 높이가 고르지 않은 토막들 */
  function cwall(x, y, w, h, c, sd) {
    var r = k.rng(sd || 431), o = '', i, n = Math.round(w / 34);
    for (i = 0; i < n; i++) { var hh = h * (0.35 + r() * 0.65); o += k.R(x + i * w / n, y - hh, w / n + 0.5, hh, i % 2 ? c : k.lt(c, 0.08)) + k.R(x + i * w / n, y - hh * 0.3, w / n + 0.5, hh * 0.3, k.dk(c, 0.3), k.op(0.25)); }
    return o;
  }
  function city(x, y, s, c, sd) { return cwall(x - 250 * s, y, 500 * s, 46 * s, k.mix(c, '#C9D0D0', 0.2), sd) + tower(x + 30 * s, y, 190 * s, 170 * s, 4, c, sd + 1) + cwall(x - 190 * s, y + 8 * s, 150 * s, 34 * s, c, sd + 2) + cwall(x + 150 * s, y + 8 * s, 120 * s, 30 * s, c, sd + 3); }
  /* 1) 시날 평지(창 11:1-2): 동방에서 옮겨 와 만난 넓은 평지, 아침 */
  function shinar() {
    return plain('morning', '#B8C8B0', '#C8BE84', '#B8A868') + k.sun(660, 300, 28, '#FFF6D8', '#FBE9B8') + k.cloud(260, 170, 1, '#FBF7EE') + k.cloud(560, 130, 0.7, '#FBF7EE') + k.road(330, 600, 240, 600, 358, 10, '#DCCB9A', -120, '#B89A68') +
      k.bush(170, 430, 0.8, '#8A9A58') + k.bush(720, 470, 1.1, '#7E8C54') + k.rocks(441, 470, 580, 4, '#A8946E', 560, 850) + k.tufts(442, 380, 590, 26, '#8A9450');
  }
  /* 2) 벽돌을 굽고 역청을 씀(창 11:3): 말리는 벽돌 줄, 굽는 더미의 불과 연기, 역청으로 메운 벽돌 더미와 그 곁의 납작한 역청 얼룩 */
  function brickyard() {
    var o = '', i, j;
    for (j = 0; j < 3; j++) for (i = 0; i < 9; i++) o += k.R(140 + i * (30 + j * 5) + j * 22, 408 + j * 26, 22 + j * 4, 8 + j * 2, j % 2 ? '#C89A6A' : '#B88A5E', ' rx="2"');
    return plain('noon', '#C4C4A8', '#CDB682', '#BFA26A') + k.cloud(300, 150, 0.9, '#FBF7EE') + k.smoke(640, 330, 1.5, '#B8B0A4') + k.fire(640, 420, 0.8) + bricks(560, 428, 7, 6, 1.1, BR, 451, 1) +
      o + k.E(505, 436, 40, 5, '#2A2226') +
      bricks(660, 520, 5, 4, 1.5, BR, 452) + k.rocks(454, 480, 580, 3, '#A8946E', 120, 420) + k.tufts(453, 490, 590, 8, '#8A9450', 100, 800);
  }
  /* 3) 성과 대를 쌓자(창 11:4): 평지에 올라가는 성과 대, 앞에는 쌓을 벽돌 */
  function building() {
    return plain('day', '#B8C8B8', '#CDB682', '#BFA26A') + k.cloud(200, 190, 0.9, '#FBF7EE') + k.cloud(720, 150, 0.8, '#FBF7EE') + city(450, 392, 0.8, '#C08A62', 461) + k.road(300, 600, 260, 430, 398, 30, '#DCC89A', -40, '#B89A68') +
      bricks(560, 500, 6, 5, 1.4, BR, 465) + bricks(130, 480, 5, 3, 1.2, BR, 466) + k.tufts(467, 440, 590, 8, '#8A9450');
  }
  /* 4) 사람들이 쌓는 성과 대(창 11:5-7): 낮, 더 가까이서 본 쌓다 만 대. 꼭대기 위로 하늘이 넓게 남고 구름은 훨씬 위에 있다. 내려오심은 그리지 않는다 */
  function tall() {
    return plain('noon', '#B4BCA8', '#C4AA78', '#B09462') + k.cloud(260, 118, 1.1, '#FBF7EE') + k.cloud(650, 104, 0.8, '#FBF7EE') + cwall(60, 400, 780, 60, '#B08462', 471) + tower(430, 420, 380, 176, 3, '#B87E56', 472) +
      cwall(100, 440, 180, 50, '#A8744E', 473) + cwall(640, 446, 200, 44, '#A8744E', 474) + k.ground(446, '#B09462') + bricks(180, 520, 6, 3, 1.4, '#A86A44', 475) + k.tufts(476, 470, 590, 8, '#7E7A44');
  }
  /* 5) 성 쌓기를 그침(창 11:8): 흐린 낮, 버려둔 벽돌과 쌓다 만 벽, 밖으로 난 빈 길 */
  function ceased() {
    return plain('dry', '#B8B8A4', '#C4AE80', '#B49A6A') + city(300, 384, 0.6, '#B88E6C', 481) + k.road(640, 600, 300, 880, 400, 30, '#DAC69A', -60, '#B09468') + k.road(420, 600, 200, 60, 420, 24, '#DAC69A', 60, '#B09468') +
      cwall(470, 470, 260, 56, '#B07A54', 485) + bricks(250, 500, 6, 4, 1.4, BR, 486) + bricks(540, 520, 4, 2, 1.5, BR, 487) + k.rocks(488, 480, 580, 3, '#A8946E', 110, 240) + k.tufts(489, 440, 590, 14, '#8A8450');
  }
  /* 6) 그 이름을 바벨이라 함(창 11:9): 붉은 기 없는 저녁, 멀어진 성과 온 지면으로 갈라진 길들 */
  function babel() {
    return plain(k.lg([[0, '#5A6EA8'], [0.45, '#C4C0C4'], [0.6, '#F2D9B0']]), '#8A86A0', '#A88E6E', '#987E5E') + city(450, 366, 0.5, '#A08878', 491) + k.road(120, 600, 130, 400, 372, 10, '#C0A078', -60) + k.road(450, 600, 150, 450, 372, 10, '#C0A078', 0, '#8A6A48') + k.road(790, 600, 130, 500, 372, 10, '#C0A078', 60) +
      k.road(-40, 470, 60, 380, 372, 8, '#B49470', 0) + k.road(940, 470, 60, 520, 372, 8, '#B49470', 0) + k.rocks(495, 470, 580, 5, '#7A6458', 110, 800) + k.tufts(496, 420, 590, 16, '#6E6440');
  }
  SA.reg('OT-04', { beats: [shinar, brickyard, building, tall, ceased, babel], arrive: 0, end: 5 });
})();

/* ── OT-06 모리아 산의 아브라함과 이삭 (창 22:1-19) ──
 * 그린 것과 근거: 부르심을 받은 곳의 동트기 전 땅과 길(창 22:1-2. 산은 아직 보이지 않는다) · 아침 일찍 안장 지운 나귀와 쪼갠 번제 나무(22:3) · 제삼일에 멀리 보이는 그곳(22:4) · 나귀가 기다리는 자리(22:5)
 * · 산으로 오르는 길(22:6-8) · 쌓은 단과 벌여 놓은 나무(22:9) · 하늘(22:11 "하늘에서부터") · 뿔이 수풀에 걸린 숫양(22:13) · 브엘세바로 돌아가는 길(22:19).
 * 그리지 않은 것: 사람(아브라함, 이삭, 사환), 여호와의 사자, 칼과 불(22:6, 22:10), 결박(22:9), 숫양을 잡는 일과 번제의 불(22:13), 하늘에서 내려오는 빛, 약속의 말씀 속 별과 모래(22:17. 비유의 말씀이라 그리지 않았다). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = k.f1;
  /* 안장 지운 나귀(창 22:3): 멀리 작게 */
  function donkey(x, y, s, c) {
    var d = k.dk(c, 0.3), o = k.E(x, y, 26 * s, 4 * s, '#16233F', k.op(0.18)), i, L = [-17, -11, 11, 17];
    for (i = 0; i < 4; i++) o += k.R(x + L[i] * s - 2 * s, y - 20 * s, 4 * s, 20 * s, i % 2 ? c : d);
    return o + k.E(x, y - 27 * s, 23 * s, 11 * s, c) + k.P('M' + f(x + 14 * s) + ',' + f(y - 30 * s) + ' L' + f(x + 27 * s) + ',' + f(y - 50 * s) + ' L' + f(x + 35 * s) + ',' + f(y - 46 * s) + ' L' + f(x + 22 * s) + ',' + f(y - 22 * s) + ' Z', c) +
      k.E(x + 34 * s, y - 46 * s, 10 * s, 6 * s, c, ' transform="rotate(25 ' + f(x + 34 * s) + ' ' + f(y - 46 * s) + ')"') + k.E(x + 27 * s, y - 58 * s, 3 * s, 9 * s, d, ' transform="rotate(-12 ' + f(x + 27 * s) + ' ' + f(y - 52 * s) + ')"') + k.E(x + 32 * s, y - 59 * s, 3 * s, 9 * s, c, ' transform="rotate(10 ' + f(x + 32 * s) + ' ' + f(y - 52 * s) + ')"') +
      k.R(x - 11 * s, y - 39 * s, 20 * s, 14 * s, '#A8553A', ' rx="' + f(4 * s) + '"') + k.R(x - 11 * s, y - 39 * s, 20 * s, 4 * s, '#D9B56A', ' rx="' + f(2 * s) + '"') + k.P('M' + f(x - 22 * s) + ',' + f(y - 30 * s) + ' q' + f(-6 * s) + ',' + f(8 * s) + ' ' + f(-3 * s) + ',' + f(18 * s), 'none', ' stroke="' + d + '" stroke-width="' + f(2.5 * s) + '" stroke-linecap="round"');
  }
  /* 쪼갠 번제 나무 한 묶음(창 22:3, 22:6) */
  function wood(x, y, s) {
    var o = k.E(x, y + 1, 44 * s, 5 * s, '#16233F', k.op(0.2)), i, a = [[-36, 0], [-30, -9], [-38, -17], [-33, -25]];
    for (i = 0; i < 4; i++) o += k.R(x + a[i][0] * s, y + (a[i][1] - 9) * s, 70 * s, 9 * s, i % 2 ? '#B8864E' : '#A8743E', ' rx="' + f(3 * s) + '"') + k.E(x + (a[i][0] + 70) * s, y + (a[i][1] - 4.5) * s, 3 * s, 4.5 * s, '#E0C08A');
    return o + k.R(x - 16 * s, y - 36 * s, 5 * s, 36 * s, '#6B5A44') + k.R(x + 14 * s, y - 36 * s, 5 * s, 36 * s, '#6B5A44');
  }
  /* 숫양(창 22:13): 양에 굽은 뿔 */
  function ram(x, y, s) {
    return k.sheep(x, y, s, '#E8DCC4') + k.P('M' + f(x + 11 * s) + ',' + f(y - 23 * s) + ' q' + f(-9 * s) + ',' + f(-7 * s) + ' ' + f(-12 * s) + ',' + f(3 * s) + ' q0,' + f(8 * s) + ' ' + f(7 * s) + ',' + f(5 * s), 'none', ' stroke="#B89A6A" stroke-width="' + f(3.4 * s) + '" stroke-linecap="round"');
  }
  function land(sky, far, mc, c1, c2, mx, mw, mh) { return k.sky(sky) + k.hill(601, 340, 30, 0.6, far) + k.mount(mx, 392, mw, mh, mc) + k.hill(602, 392, 16, 1.2, c1) + k.ground(420, c2) + k.hill(603, 440, 8, 2, c2); }
  /* 1) 모리아 땅으로 가라(창 22:1-2): 동트기 전의 낮은 언덕과 길. 그 산은 사흘 길 뒤에야 멀리 보이므로(22:4) 여기에는 없다 */
  function call() {
    return land('predawn', '#3E3E6E', '#4E4A78', '#5A5470', '#6A6070', 0, 0, 0) + k.stars(611, 50, 220) + k.road(300, 600, 220, 520, 400, 12, '#8A7E88', 90) + k.rocks(612, 430, 570, 8, '#5E5A72', 110, 800) + k.bush(700, 480, 1, '#4A5458') + k.tufts(613, 450, 590, 9, '#4A4E52');
  }
  /* 2) 아침 일찍 떠나 제삼일에 그곳을 멀리 봄(창 22:3-5): 나귀와 번제 나무, 멀리 그 산 */
  function journey() {
    return land('dawn', '#9A96B8', '#A89AB0', '#C0A27C', '#CDAE78', 600, 300, 110) + k.sun(250, 318, 26, '#FFF1C8', '#FBE3B0') + k.road(420, 600, 260, 590, 398, 10, '#E4CFA0', 130, '#B89260') + donkey(330, 470, 1.25, '#9A8674') + wood(520, 484, 1) +
      k.bush(160, 470, 1, '#7E8C54') + k.rocks(621, 450, 570, 4, '#A88A64', 600, 820) + k.tufts(622, 450, 590, 10, '#8E9A56');
  }
  function slope(c, d) { return k.P('M-20,600 L-20,470 Q300,430 520,300 Q640,236 760,214 Q840,204 920,210 L920,600 Z', c) + k.P('M520,300 Q640,236 760,214 Q840,204 920,210 L920,600 L640,600 Q700,380 520,300 Z', d, k.op(0.35)); }
  /* 3) 함께 산을 오름(창 22:6-8): 한낮의 비탈과 오르는 길. 불과 칼은 그리지 않는다 */
  function climb() {
    return k.sky('noon') + k.cloud(250, 170, 0.9, '#FBF7EE') + k.hill(631, 372, 30, 0.6, '#A8B4C0') + k.hill(632, 420, 16, 1.1, '#B8AE8A') + slope('#C0A070', '#8A6E4A') + k.road(250, 600, 200, 700, 232, 16, '#E4CFA0', 60, '#B08A58') +
      k.bush(600, 330, 0.8, '#7E8C54') + k.bush(420, 430, 1.1, '#6F8448') + k.bush(760, 300, 0.6, '#7E8C54') + k.rocks(633, 440, 580, 6, '#A88A64', 420, 820) + k.rock(180, 500, 90, 40, '#A8947E') + k.tufts(634, 460, 590, 8, '#8E9A56', 100, 500);
  }
  function top(sky, far, c, c2) { return k.sky(sky) + k.hill(641, 400, 24, 0.5, far) + k.hill(642, 436, 12, 0.9, k.mix(far, c, 0.5)) + k.P('M-20,600 L-20,470 Q200,420 450,412 Q700,420 920,480 L920,600 Z', c) + k.P('M450,412 Q700,420 920,480 L920,600 L600,600 Z', c2, k.op(0.3)); }
  function woodAltar(x, y, s) { return k.altar(x, y, s, '#A89A8E') + k.timber(x - 4 * s, y - 60 * s, s * 0.72, '#A8743E'); }
  /* 4) 단을 쌓고 나무를 벌여 놓음(창 22:9): 산 위의 돌단과 그 위의 나무. 그다음 일(결박, 칼)은 그리지 않는다 */
  function altarTop() {
    return top('day', '#A8B8C4', '#BCA47C', '#8A7250') + k.cloud(240, 160, 0.9, '#FBF7EE') + k.bush(620, 446, 1.4, '#6F8448') + k.bush(676, 456, 0.9, '#7E8C54') + woodAltar(250, 478, 1.3) + k.rocks(651, 470, 580, 6, '#A8947E', 110, 800) + k.tufts(652, 480, 590, 8, '#8E9A56');
  }
  /* 5) 하늘에서 부르는 소리(창 22:11-12): 같은 산 위(단은 왼쪽, 수풀은 오른쪽 그 자리), 넓게 올려다본 하늘. 사자도 빛줄기도 새도 없다 */
  function heaven() {
    return k.sky('day') + k.cloud(280, 200, 1.5, '#FBF7EE') + k.cloud(620, 150, 1.1, '#FBF7EE') + k.cloud(520, 300, 0.8, '#FBF7EE') + k.P('M-20,600 L-20,480 Q300,440 600,446 Q780,452 920,490 L920,600 Z', '#BCA47C') +
      woodAltar(250, 474, 0.8) + k.bush(620, 464, 1, '#6F8448') + k.rocks(662, 480, 580, 5, '#A8947E', 330, 800) + k.tufts(663, 480, 590, 8, '#8E9A56');
  }
  /* 6) 뿔이 수풀에 걸린 숫양(창 22:13-14): 나무를 벌여 놓은 단(22:9)과 그 뒤쪽 수풀, 수풀에 반쯤 가리고 뿔에 가지가 걸린 숫양. 번제 드리는 일은 그리지 않는다 */
  function thicket() {
    return top('gold', '#9A8E9A', '#B89A70', '#806848') + woodAltar(250, 480, 1) + k.bush(540, 452, 1.2, '#5E7A48') + k.bush(620, 440, 2, '#6F8448') + ram(560, 472, 1.7) + k.bush(672, 478, 1.1, '#5E7A48') + k.bush(606, 484, 1, '#7E9450') +
      k.P('M556,412 Q580,426 574,448 M594,406 Q584,428 600,446', 'none', ' stroke="#4E6A3E" stroke-width="4" stroke-linecap="round"') + k.rocks(671, 480, 580, 5, '#A8947E', 110, 800) + k.tufts(672, 480, 590, 8, '#8E8A4A');
  }
  /* 7) 브엘세바로 돌아감(창 22:19): 저녁, 뒤에 남은 산과 돌아가는 길 */
  function home() {
    return land('evening', '#5A4A78', '#6A5078', '#8A6458', '#9A7258', 280, 380, 150) + k.road(600, 600, 260, 330, 398, 12, '#C8A07A', -110, '#8A6A50') + k.rocks(682, 450, 570, 5, '#7A6462', 110, 440) + k.bush(720, 470, 1, '#5E5E4A') + k.tufts(683, 450, 590, 9, '#6A5E40');
  }
  SA.reg('OT-06', { beats: [call, journey, climb, altarTop, heaven, thicket, home], arrive: 0, end: 6 });
})();

/* ── OT-07 벧엘에서 야곱이 꾼 꿈 (창 28:10-22) ──
 * 그린 것과 근거: 브엘세바에서 하란으로 가는 길(창 28:10, 28:20 "가는 이 길") · 해가 진 뒤의 한 곳(28:11) · 그곳의 돌들과 베개로 삼은 돌 하나(28:11)
 * · 밤하늘(28:11 거기서 유숙) · 아침 일찍(28:18) · 기둥으로 세운 돌과 그 위에 부은 기름(28:18) · 멀리 루스 성(28:19 "이 성").
 * 그리지 않은 것: 사람(야곱), 달(본문에 없음), 하나님과 하나님의 사자의 형상, 꿈속의 사닥다리(28:12. 그 위에 여호와께서 서 계셨다고 하므로 그리지 않는 쪽을 기본값으로 했다. 대표 결정 대기에 적음),
 *   돌 여러 개로 쌓은 제단(본문은 베개로 삼았던 돌 하나를 기둥으로 세웠다고 한다), 야곱의 짐·지팡이·천막(본문에 없음). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  var ST = '#9A8E86';
  function land(c1, c2, c3, c4) { return k.hill(71, 345, 34, 0.7, c1) + k.hill(72, 392, 20, 1.3, c2) + k.ground(425, c3) + k.hill(73, 440, 8, 2.2, c3) + k.road(250, 600, 230, 610, 398, 14, c4, 120); }
  function stonesAround(c) { return k.rocks(74, 440, 500, 6, c, 110, 420) + k.rocks(75, 450, 560, 5, c, 620, 820); }
  /* 1) 해가 진 한 곳(창 28:10-11): 지는 볕, 길, 그곳의 돌들 */
  function sunset() {
    return k.sky('dusk') + k.glow(640, 420, 170, '#FFE0A0', 0.5) + land('#6B4A6A', '#8A5A4A', '#A8744A', '#C99A6A') + stonesAround('#8A6E62') + k.rock(450, 500, 96, 38, '#A8887A') + k.tufts(76, 450, 585, 8, '#7A6A3A');
  }
  /* 2) 밤, 돌을 베개 삼아 누운 자리(창 28:11-12): 별이 뜬 하늘과 베개로 삼은 돌. 꿈의 내용은 그리지 않는다 */
  function night() {
    return k.sky('night') + k.stars(77, 150, 330) + land('#2A2A52', '#34365E', '#3E4468', '#525A7C') + stonesAround('#4A506E') + k.rock(450, 500, 96, 38, '#7A7E98') + k.tufts(76, 450, 585, 8, '#2E3A52');
  }
  /* 3) 누운 땅(창 28:13-14 "너 누운 땅"): 같은 밤, 사방으로 펼쳐진 땅을 넓게 */
  function nightLand() {
    return k.sky('deepnight') + k.stars(78, 190, 360) + k.hill(79, 372, 26, 0.5, '#20244A') + k.hill(80, 404, 14, 1.1, '#2A3058') + k.ground(425, '#343C62') + k.hill(81, 452, 8, 1.8, '#3E4468') +
      k.rocks(82, 440, 470, 7, '#4A506E', 110, 800) + k.rock(450, 500, 96, 38, '#7A7E98') + k.tufts(83, 450, 585, 10, '#2E3A52');
  }
  /* 4) 가는 길(창 28:15 "네가 어디로 가든지"): 같은 밤, 멀리 이어지는 길 */
  function nightRoad() {
    return k.sky('night') + k.stars(84, 150, 330) + k.hill(71, 345, 34, 0.7, '#2A2A52') + k.hill(72, 392, 20, 1.3, '#34365E') + k.ground(425, '#3E4468') +
      k.road(780, 600, 280, 600, 396, 12, '#5A6286', -40, '#7A82A6') + k.rocks(85, 450, 560, 6, '#4A506E', 110, 330) + k.rock(450, 500, 96, 38, '#7A7E98') + k.tufts(86, 450, 585, 9, '#2E3A52');
  }
  /* 5) 잠이 깸(창 28:16-17): 동트기 전, 돌은 아직 누워 있다 */
  function predawn() {
    return k.sky('predawn') + k.stars(77, 40, 200) + k.glow(230, 390, 170, '#F2B89A', 0.55) + land('#4A4470', '#6A5A78', '#7A6A72', '#A08A86') + stonesAround('#6E6672') + k.rock(450, 500, 96, 38, '#9A8E96') + k.tufts(76, 450, 585, 8, '#5A5A4A');
  }
  /* 기둥으로 세운 돌(창 28:18): 베개로 삼았던 그 돌 하나를 세운 것(누운 돌과 같은 크기). 사람처럼 보이지 않게 낮고 모나고 좌우가 다르게. 부은 기름은 윗면만 젖어 번들거리게 */
  function pillar(x, y, c) {
    return k.E(x + 20, y + 2, 62, 9, '#16233F', k.op(0.2)) +
      '<path d="M' + (x - 34) + ',' + y + ' L' + (x - 40) + ',' + (y - 52) + ' L' + (x - 22) + ',' + (y - 84) + ' L' + (x + 16) + ',' + (y - 90) + ' L' + (x + 38) + ',' + (y - 60) + ' L' + (x + 34) + ',' + y + ' Z" fill="' + c + '"/>' +
      '<path d="M' + (x + 8) + ',' + y + ' L' + (x + 12) + ',' + (y - 62) + ' L' + (x + 16) + ',' + (y - 90) + ' L' + (x + 38) + ',' + (y - 60) + ' L' + (x + 34) + ',' + y + ' Z" fill="' + k.dk(c, 0.3) + '" opacity=".5"/>' +
      '<path d="M' + (x - 40) + ',' + (y - 52) + ' L' + (x - 22) + ',' + (y - 84) + ' L' + (x + 16) + ',' + (y - 90) + ' L' + (x + 12) + ',' + (y - 72) + ' L' + (x - 30) + ',' + (y - 60) + ' Z" fill="' + k.mix(c, '#7A6A4A', 0.35) + '"/>' +
      '<path d="M' + (x - 20) + ',' + (y - 80) + ' L' + (x + 10) + ',' + (y - 85) + '" stroke="#FFF1C8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>';
  }
  /* 6) 아침 일찍 돌을 기둥으로 세우고 기름을 부음, 그곳의 본래 이름은 루스(창 28:18-19): 멀리 성 하나 */
  function morningPillar() {
    return k.sky('dawn') + k.sun(230, 322, 28, '#FFF1C8', '#FBE3B0') + k.hill(71, 345, 34, 0.7, '#9A8AA0') + k.town(87, 690, 362, 150, 4, '#C9B098', 0.7) + k.hill(72, 392, 20, 1.3, '#B89A7A') + k.ground(425, '#C9A470') +
      k.hill(73, 440, 8, 2.2, '#C9A470') + k.road(250, 600, 230, 610, 398, 14, '#E0C89A', 120) + stonesAround('#9A8472') + pillar(450, 505, '#A89A8E') + k.tufts(76, 450, 585, 8, '#8A8A4A');
  }
  /* 7) 서원(창 28:20-22): 세운 돌과 가는 길. 환한 아침 */
  function vow() {
    return k.sky('morning') + k.cloud(260, 150, 0.9, '#FBF7EE') + k.hill(71, 345, 34, 0.7, '#A8B0B8') + k.hill(72, 392, 20, 1.3, '#BCA47C') + k.ground(425, '#CDAA72') +
      k.road(600, 600, 300, 380, 396, 14, '#E6D0A2', -60, '#B89260') + k.rocks(88, 450, 560, 6, '#9A8472', 560, 820) + pillar(300, 500, '#A89A8E') + k.tufts(89, 450, 585, 10, '#8A8A4A');
  }
  SA.reg('OT-07', { beats: [sunset, night, nightLand, nightRoad, predawn, morningPillar, vow], arrive: 0, end: 6 });
})();

/* ── OT-08 요셉이 애굽으로 팔려 가고 형들을 다시 만남 (창 37:12-36, 45:1-15) ──
 * 그린 것과 근거: 헤브론 골짜기에서 세겜·도단으로 가는 들과 양 떼(창 37:12-17) · 광야의 구덩이(37:22) · 물이 없는 빈 구덩이(37:24)
 * · 길르앗에서 애굽으로 내려가는 길과 향품·유향·몰약을 실은 약대(37:25) · 요셉이 없는 구덩이(37:29) · 애굽에서 요셉이 있던 곳(45:1-2. 생김새는 본문에 없어 민벽·바닥·문·창만)
 * · 밭갈이도 추수도 못 하는 흉년의 땅(45:6) · 아버지께 올라가는 길(45:9).
 * 그리지 않은 것: 사람(요셉, 형들, 상인, 야곱), 채색옷과 피 묻은 옷(37:23, 37:31-33), 숫염소, 은 이십, 결박, 애굽의 신상·벽화·피라미드·왕좌, 방 안의 꾸밈(색 띠, 기둥, 층계, 항아리), 문으로 드는 빛줄기(45:9 대목). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = k.f1;
  function flock(sd, x0, x1, y0, y1, n, s) { var r = k.rng(sd), a = [], o = '', i; for (i = 0; i < n; i++) a.push([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)]); a.sort(function (p, q) { return p[1] - q[1]; }); for (i = 0; i < n; i++) o += k.sheep(f(a[i][0]), f(a[i][1]), f(s * (0.7 + (a[i][1] - y0) / (y1 - y0 + 1) * 0.5)), i % 3 ? '#F1EADB' : '#D8CDB8'); return o; }
  /* 구덩이(창 37:24): 돌로 가장자리를 두른 마른 구덩이. 안은 비어 있다 */
  function pit(x, y, w, c) {
    var r = k.rng(811), o = '', i, n = 9, h = w * 0.26;
    for (i = 0; i < n; i++) { var a = Math.PI + (i + 0.5) * Math.PI / n; o += k.rock(f(x + Math.cos(a) * w * 0.54), f(y + Math.sin(a) * h * 1.1 + 4), w * 0.17, w * (0.08 + r() * 0.05), i % 2 ? c : k.lt(c, 0.12)); }
    o += k.E(x, y, w / 2, h, '#6A4E3A') + k.E(x, y + h * 0.2, w * 0.44, h * 0.76, '#3A2A26') + k.E(x + w * 0.05, y + h * 0.42, w * 0.3, h * 0.46, '#1E1A20');
    for (i = 0; i < n; i++) { var b = (i + 0.5) * Math.PI / n; o += k.rock(f(x + Math.cos(b) * w * 0.56), f(y + Math.sin(b) * h * 1.15 + w * 0.06), w * 0.19, w * (0.09 + r() * 0.05), i % 2 ? k.lt(c, 0.1) : c); }
    return o;
  }
  /* 짐 실은 약대(창 37:25): 멀리 작게 */
  function camel(x, y, s, c, load) {
    var d = k.dk(c, 0.3), o = k.E(x, y, 30 * s, 4 * s, '#16233F', k.op(0.18)), i, L = [-18, -11, 13, 19];
    for (i = 0; i < 4; i++) o += k.R(x + L[i] * s - 2 * s, y - 30 * s, 4 * s, 30 * s, i % 2 ? c : d);
    return o + k.E(x, y - 36 * s, 25 * s, 11 * s, c) + k.E(x - 2 * s, y - 47 * s, 11 * s, 9 * s, c) + k.P('M' + f(x + 18 * s) + ',' + f(y - 36 * s) + ' Q' + f(x + 32 * s) + ',' + f(y - 38 * s) + ' ' + f(x + 33 * s) + ',' + f(y - 64 * s), 'none', ' stroke="' + c + '" stroke-width="' + f(7 * s) + '" stroke-linecap="round"') +
      k.E(x + 38 * s, y - 66 * s, 9 * s, 5 * s, c) + k.R(x - 16 * s, y - 52 * s, 13 * s, 20 * s, load, ' rx="' + f(4 * s) + '"') + k.R(x - 1 * s, y - 54 * s, 13 * s, 20 * s, k.dk(load, 0.2), ' rx="' + f(4 * s) + '"') + k.R(x - 17 * s, y - 44 * s, 32 * s, 3 * s, '#E8DCC4');
  }
  function wild(sky, far, c1, c2, c3) { return k.sky(sky) + k.hill(801, 330, 34, 0.7, far) + k.hill(802, 380, 20, 1.2, c1) + k.ground(412, c2) + k.hill(803, 440, 8, 2, c3); }
  /* 1) 헤브론 골짜기에서 세겜으로, 양 떼를 치는 들(창 37:12-17): 아침의 골짜기와 풀밭, 멀리 양 떼 */
  function fields() {
    return k.sky('morning') + k.cloud(260, 150, 0.9, '#FBF7EE') + k.hill(801, 320, 40, 0.6, '#A9B8C8') + k.hill(804, 366, 30, 0.9, '#9AB088') + k.hill(805, 404, 16, 1.4, '#8FA868') + k.ground(430, '#98B068') + k.road(260, 600, 220, 560, 386, 10, '#E0CFA0', 140, '#B89A68') +
      flock(806, 420, 760, 420, 478, 9, 0.9) + k.bush(180, 468, 1, '#7E9450') + k.bush(740, 500, 1, '#6F8448') + k.tufts(807, 440, 590, 14, '#6E8A48');
  }
  /* 2) 도단, 멀리서 봄(창 37:17-22): 한낮의 들 끝 광야와 그 구덩이, 풀 뜯는 양 떼 */
  function dothan() {
    return wild('noon', '#B4BCB8', '#B8B084', '#C4AE74', '#BCA468') + k.sun(680, 150, 28, '#FFF6D8', '#FFE9A8') + flock(821, 130, 420, 400, 440, 7, 0.75) + k.road(700, 600, 240, 420, 400, 10, '#E0CFA0', -80, '#B89A68') + pit(560, 462, 150, '#A8947E') +
      k.bush(200, 490, 1.1, '#7E8C54') + k.rocks(822, 480, 580, 4, '#A88A64', 110, 420) + k.tufts(823, 440, 590, 10, '#8E9A56');
  }
  /* 3) 빈 구덩이, 물이 없었더라(창 37:23-24): 가까이서 본 마른 구덩이. 옷도 사람도 없다 */
  function pitNear() {
    return wild('dry', '#B8B4A4', '#C0AA80', '#C8A870', '#BE9E66') + k.rocks(832, 404, 440, 4, '#B09A7A', 640, 800) + k.bush(170, 400, 0.9, '#8A8E5A') + pit(450, 440, 380, '#A8947E') + k.tufts(833, 420, 480, 5, '#8E9A56', 690, 820);
  }
  /* 4) 길르앗에서 애굽으로 내려가는 약대들(창 37:25-28): 기우는 볕(해는 대목 2와 같은 오른쪽, 약대가 가는 쪽), 먼 길 위의 짐 실은 약대 */
  function caravan() {
    return wild('gold', '#A89AA0', '#B89A70', '#C4A068', '#B89460') + k.sun(690, 296, 26, '#FFF1C8', '#F7D58A') + k.road(900, 600, 300, 150, 404, 16, '#E0C898', -160, '#A88A58') + camel(380, 420, 0.7, '#B08A5E', '#8A5A6A') + camel(450, 428, 0.8, '#A88254', '#6F8448') + camel(535, 440, 0.9, '#B08A5E', '#A8553A') +
      pit(250, 500, 140, '#A8947E') + k.rocks(841, 470, 580, 4, '#A88A64', 420, 700) + k.tufts(842, 450, 590, 10, '#8E8A4A');
  }
  /* 5) 구덩이에 돌아와 보니 요셉이 없음(창 37:29-36): 해 진 뒤의 빈 구덩이와 애굽 쪽으로 난 빈 길. 옷과 숫염소는 그리지 않는다 */
  function gone() {
    return wild('afterglow', '#3E3E6E', '#5A5074', '#6A5E6C', '#625866') + k.stars(851, 20, 180) + k.road(120, 600, 260, 640, 404, 12, '#9A8A8A', 150, '#6E6270') + pit(600, 480, 220, '#6E6A80') + k.rocks(852, 470, 580, 4, '#5E5A72', 110, 420) + k.tufts(853, 450, 590, 10, '#4A4E52');
  }
  /* 애굽의 그 방(창 45:1-4): 민벽과 바닥, 문 하나와 창 하나. 두 대목에서 자리가 같고 빛만 다르다 */
  function hall(wallc, skyc, beam) {
    return k.room(wallc, '#B8946A', 430, { win: [370, 150, 180, 280], sky: skyc, beam: beam }) + k.P('M370,430 L550,430 L550,360 Q470,340 370,356 Z', '#B89A68') + k.P('M370,430 L550,430 L550,384 Q460,372 370,388 Z', '#C8A870') + k.road(460, 430, 90, 486, 380, 8, '#EAD8B0', 0) +
      k.R(642, 162, 116, 136, k.dk(wallc, 0.22), ' rx="6"') + k.R(650, 170, 100, 120, skyc, ' rx="3"');
  }
  /* 6) 애굽, 요셉이 형들에게 자기를 알린 곳(창 45:1-4): 낮, 빈 방 */
  function egyptRoom() { return hall('#D8C098', k.lg(['#BFE4E0', '#E6EEDC']), true); }
  /* 7) 아직 다섯 해가 남은 흉년(창 45:5-8, 45:6): 밭갈이도 추수도 못 하는 마른 땅, 멀리 성읍 */
  function famine() {
    var r = k.rng(871), d = '', i;
    for (i = 0; i < 16; i++) { var x = 120 + r() * 660, y = 440 + r() * 130; d += 'M' + f(x) + ',' + f(y) + ' l' + f(18 + r() * 20) + ',' + f(6 - r() * 12) + ' l' + f(10 + r() * 14) + ',' + f(10 - r() * 6) + ' '; }
    return k.sky('dry') + k.sun(640, 170, 30, '#FFF6D8', '#F4E3B8') + k.hill(872, 352, 8, 0.6, '#C8BC9C') + k.town(873, 300, 372, 240, 5, '#D6BC90', 0.8) + k.ground(372, '#CDAE78') + k.hill(874, 420, 6, 1.4, '#C4A26A') +
      k.P(d, 'none', ' stroke="#9A7A4E" stroke-width="2.5" stroke-linecap="round" opacity=".7"') + k.rocks(876, 400, 580, 9, '#B09A74', 110, 800);
  }
  /* 8) 속히 아버지께 올라가라(창 45:9-15): 같은 방, 저물녘. 열린 문밖으로 올라가는 길. 빛줄기는 넣지 않는다 */
  function sendHome() { return hall('#C4A680', k.lg(['#F2C58A', '#F7D9A0']), false); }
  SA.reg('OT-08', { beats: [fields, dothan, pitNear, caravan, gone, egyptRoom, famine, sendHome], arrive: 0, end: 7 });
})();

/* ── OT-10 마지막 재앙과 유월절 (출 11:1-12:42) ──
 * 그린 것과 근거: 애굽 땅 이스라엘 자손의 집들(출 12:7 "양을 먹을 집", 12:22 "자기 집 문") · 바로가 있는 곳(11:8. 본문은 장소의 생김새를 말하지 않음. 멀리 성읍만)
 * · 집 문의 좌우 설주와 인방(12:7, 12:22) · 지팡이(12:11) · 무교병(12:15) · 아침까지 닫힌 문(12:22) · 밤중(12:29)의 고요한 거리
 * · 라암셋에서 숙곳으로 가는 길(12:37) · 옷에 싼 반죽 그릇(12:34) · 구해 받은 은금 패물(12:35).
 * 그리지 않은 것: 사람, 하나님의 형상, 멸하는 자(12:23), 집 위를 지나는 그림자·빛·안개, 문에 바른 피와 그릇의 피·우슬초(기본값: 문만 그린다. 대표 결정 대기),
 *   어린 양과 잡는 모습·고기, 쓴 나물, 상·등잔, 죽음과 우는 모습(12:29-30), 애굽의 신상·피라미드·신전·성벽, 애굽 사람의 집 안. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = Math.round, WD = '#8A5E36';
  /* 문: 나무 설주와 인방(출 12:7). shut이면 닫힌 문(12:22). cx 가운데, by 밑, w·h 문짝 */
  function door(cx, by, w, h, shut, c) {
    var p = w * 0.16, x = cx - w / 2, y = by - h, o = k.R(x, y, w, h, shut ? k.dk(WD, 0.25) : k.mix(c, '#4A3428', 0.75)), i;
    if (shut) for (i = 1; i < 4; i++) o += k.R(x + i * w / 4, y, Math.max(1.5, w * 0.022), h, k.dk(WD, 0.5), k.op(0.6));
    return o + k.R(x - p, y - 4, p, h + 4, WD) + k.R(x + w, y - 4, p, h + 4, WD) + k.R(x + w + p * 0.7, y - 4, p * 0.3, h + 4, k.dk(WD, 0.4), k.op(0.5)) + k.R(x - p * 1.6, y - p * 1.3, w + p * 3.2, p * 1.2, k.lt(WD, 0.12), ' rx="2"');
  }
  /* 가까이서 본 집과 그 문(출 12:7, 12:22) */
  function doorHouse(x, c, shut, lit) {
    var r = k.rng(1001), o = k.R(x, 160, 560, 400, c) + k.R(x + 400, 160, 160, 400, k.dk(c, 0.3), k.op(0.3)) + k.R(x - 8, 148, 576, 16, k.lt(c, 0.2), ' rx="3"'), i;
    for (i = 0; i < 16; i++) o += k.R(f(x + 14 + r() * 500), f(180 + r() * 290), 34, 9, k.dk(c, 0.3), ' rx="2" opacity=".2"');
    return o + door(x + 280, 560, 136, 310, shut, c) + k.R(x + 450, 270, 50, 56, lit ? '#F4C272' : k.dk(c, 0.6), ' rx="3"');
  }
  /* 은금 패물(출 12:35): 천 위의 작은 고리들 */
  function jewels(x, y) {
    var r = k.rng(1002), o = k.E(x, y + 3, 50, 8, '#16233F', k.op(0.18)) + k.E(x, y, 46, 8, '#D9CDB8'), i;
    for (i = 0; i < 7; i++) o += '<circle cx="' + f(x + (r() - 0.5) * 64) + '" cy="' + f(y - 3 + r() * 4) + '" r="' + f(3 + r() * 3) + '" fill="none" stroke="' + (i % 2 ? '#F2C84A' : '#E4E8EE') + '" stroke-width="2.5"/>';
    return o;
  }
  /* 1) 한 가지 재앙을 더 내리신다는 말씀(출 11:1-3): 낮, 애굽 땅의 집들과 빈 거리 */
  function street() {
    return k.sky('day') + k.cloud(250, 170, 0.8, '#FBF7EE') + k.hill(1003, 340, 14, 0.6, '#B9C0BC') + k.town(1004, 450, 392, 660, 8, '#C99C6C', 1.15) + k.hill(1023, 392, 5, 1.3, '#C2986A') + k.ground(396, '#C2986A') +
      k.road(450, 600, 320, 450, 398, 60, '#D9B88A', 0, '#A88460') + k.rocks(1024, 430, 470, 4, '#A8846A', 110, 300) + k.rocks(1025, 440, 580, 4, '#A8846A', 620, 800) + k.tufts(1005, 420, 585, 8, '#8A7A44');
  }
  /* 2) 바로에게 여호와의 말씀을 전함(출 11:4-8): 낮, 멀리 성읍만 */
  function pharaoh() {
    return k.sky('dry') + k.sun(210, 150, 28, '#FFF6D8', '#F4E3B8') + k.hill(1006, 330, 14, 0.7, '#C9BCA0') + k.mount(560, 420, 760, 90, '#CDB086') + k.town(1007, 560, 352, 400, 7, '#DCC8A4', 1) +
      k.hill(1009, 404, 8, 1.3, '#D2B078') + k.ground(410, '#D2B078') +
      k.road(300, 600, 280, 560, 356, 30, '#E6D2A6', -70, '#B89260') + k.rocks(1010, 440, 580, 5, '#B09068', 500, 860) + k.tufts(1011, 430, 585, 9, '#9A8A4A');
  }
  /* 3) 문의 좌우 설주와 인방(출 12:7), 지팡이(12:11): 해 질 때(12:6)의 집 문. 하늘은 옅은 살구색 */
  function posts() {
    return k.R(0, 0, 900, 600, k.lg([[0, '#6E6A9A'], [0.6, '#D9B8B4'], [1, '#F4DCB4']])) + k.town(1012, 450, 336, 900, 8, '#B88A62', 1.2, { haze: '#A894A8' }) + k.ground(336, '#9A7250') + doorHouse(170, '#C99C6C') + k.ground(545, '#8A6444') +
      '<path d="M606,548 L584,300" stroke="#6B4426" stroke-width="8" stroke-linecap="round"/>';
  }
  /* 4) 무교병(출 12:15-20): 밤, 방 바닥에 놓인 무교병. 빛은 창밖 밤하늘뿐 */
  function bread() {
    var b = '', i;
    for (i = 0; i < 4; i++) b += k.E(420 + i * 5, 448 - i * 11, 86, 15, i % 2 ? '#DCC08C' : '#CDAC74') + k.E(396 + i * 14, 446 - i * 11, 12, 3, '#A8844E', k.op(0.6));
    return k.room('#6A6480', '#4A4660', 404, { win: [600, 150, 120, 140], sky: '#22345B', beamc: '#C9D4F0' }) + k.E(430, 470, 190, 26, '#16233F', k.op(0.3)) + k.E(430, 462, 170, 24, '#8A7A70') + b;
  }
  /* 5) 아침까지 문밖에 나가지 않음(출 12:22): 밤, 닫힌 문 */
  function shut() {
    return k.sky('night') + k.stars(1013, 60, 150) + k.town(1014, 760, 400, 300, 4, '#4A4E74', 1, { lit: true, haze: '#3A3E66' }) + k.ground(400, '#343A5C') + doorHouse(60, '#565A80', true, true) + k.ground(545, '#2E3250') +
      k.rocks(1027, 556, 590, 3, '#4A4E70', 640, 860);
  }
  /* 6) 밤중(출 12:29): 문 닫힌 집들(12:22)의 고요한 거리와 하늘만 */
  function midnight() {
    return k.sky('deepnight') + k.stars(1015, 170, 330) + k.hill(1016, 350, 12, 0.7, '#1A2040') + k.town(1017, 450, 396, 520, 7, '#343858', 1.1, { haze: '#22284A' }) + k.ground(396, '#2A2E4C') +
      k.road(450, 600, 260, 450, 400, 50, '#3E4468', 0) + k.house(70, 520, 250, 180, '#3E4266', { door: false, lit: true }) + door(160, 520, 54, 100, true) + k.house(590, 506, 240, 160, '#383C5E', { door: false, lit: true }) + door(660, 506, 50, 92, true);
  }
  /* 옷에 싼 반죽 그릇(출 12:34): 납작한 보따리, 한쪽으로 늘어진 매듭 끈 */
  function bundle(x, y, s, c) {
    return k.E(x, y + 2, 50 * s, 7 * s, '#16233F', k.op(0.18)) + k.P('M' + (x - 46 * s) + ',' + y + ' Q' + (x - 52 * s) + ',' + (y - 22 * s) + ' ' + (x - 12 * s) + ',' + (y - 30 * s) + ' Q' + (x + 24 * s) + ',' + (y - 34 * s) + ' ' + (x + 44 * s) + ',' + (y - 16 * s) + ' Q' + (x + 52 * s) + ',' + (y - 6 * s) + ' ' + (x + 46 * s) + ',' + y + ' Z', c) +
      k.P('M' + (x + 10 * s) + ',' + y + ' Q' + (x + 26 * s) + ',' + (y - 16 * s) + ' ' + (x + 14 * s) + ',' + (y - 32 * s) + ' Q' + (x + 54 * s) + ',' + (y - 20 * s) + ' ' + (x + 46 * s) + ',' + y + ' Z', k.dk(c, 0.25), k.op(0.5)) +
      '<path d="M' + (x - 8 * s) + ',' + (y - 30 * s) + ' q' + (-20 * s) + ',' + 2 * s + ' ' + (-30 * s) + ',' + 16 * s + '" stroke="' + k.lt(c, 0.2) + '" stroke-width="' + 6 * s + '" fill="none" stroke-linecap="round"/>';
  }
  /* 7) 라암셋을 떠나 숙곳으로(출 12:37), 옷에 싼 반죽 그릇(12:34), 구해 받은 은금 패물(12:35): 새벽, 성읍에서 나오는 길 */
  function exodus() {
    return k.sky('dawn') + k.sun(660, 336, 28, '#FFF1C8', '#FBE3B0') + k.hill(1018, 352, 16, 0.7, '#9A8AA0') + k.town(1019, 215, 372, 220, 5, '#C9B098', 0.8) +
      k.hill(1021, 388, 8, 1.2, '#C9A470') + k.ground(394, '#C9A470') + k.road(520, 600, 340, 222, 380, 16, '#E6D0A2', 90, '#B89260') + bundle(600, 452, 1.1, '#B9C8CC') + bundle(652, 466, 1.2, '#D9CDB8') + jewels(742, 462) + k.rocks(1028, 420, 450, 3, '#B09068', 400, 560) + k.tufts(1022, 410, 585, 9, '#8A8A4A', 110, 330);
  }
  SA.reg('OT-10', { beats: [street, pharaoh, posts, bread, shut, midnight, exodus], arrive: 0, end: 6 });
})();

/* ── OT-12 시내 산에서 주신 열 가지 말씀 (출 19:1-20:21) ──
 * 그린 것과 근거: 시내 광야와 산 앞에 친 장막들(출 19:2) · 산으로 오르는 비탈(19:3, 19:20) · 빤 옷(19:10, 19:14. 바위에 펴 넌 것으로) · 산 사면에 정한 경계(19:12, 19:23. 생김새는 본문에 없어 산기슭에 놓인 돌 줄로만)
 * · 셋째 날 아침의 우레·번개·빽빽한 구름(19:16) · 불과 가마 연기 같은 연기(19:18. 불은 산꼭대기 뒤의 붉은 빛으로만) · 산기슭(19:17) · 멀리 선 자리에서 본 산(20:18, 20:21).
 * 그리지 않은 것: 사람(모세, 아론, 백성), 하나님의 형상, 구름·불 속의 어떤 모양, 돌판(이 범위에 없음), 나팔과 나팔 부는 이(19:16은 소리만), 불길의 모양, 빨랫줄·장대,
 *   독수리(19:4는 비유의 말씀), 구름 안쪽의 짙은 어둠 속(20:21), 말씀의 번호나 글자. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = Math.round, TC = '#EFE3C8', TD = '#6B4A32';
  /* 진의 장막들(출 19:2) */
  function camp(seed, n, x0, x1, y0, y1, s0, c, d) {
    var r = k.rng(seed), a = [], i, out = '';
    for (i = 0; i < n; i++) a.push([f(x0 + r() * (x1 - x0)), f(y0 + r() * (y1 - y0)), r()]);
    a.sort(function (p, q) { return p[1] - q[1]; });
    for (i = 0; i < n; i++) { var s = k.f1(s0 * (0.75 + (a[i][1] - y0) / (y1 - y0 + 1) * 0.7)); out += k.E(a[i][0], a[i][1] + 1, 50 * s, 6 * s, '#16233F', k.op(0.16)) + k.tent(a[i][0], a[i][1], s, a[i][2] > 0.5 ? c : k.lt(c, 0.14), d); }
    return out;
  }
  /* 시내 산과 비탈의 골 */
  function sinai(cx, y, w, h, c) {
    var g = '', i, d = k.dk(c, 0.3);
    for (i = 0; i < 5; i++) { var u = i - 2.2; g += '<path d="M' + f(cx + u * w * 0.11) + ',' + f(y - h * (0.76 - Math.abs(u) * 0.13)) + ' q' + f(w * 0.02) + ',' + f(h * 0.2) + ' ' + f(u * w * 0.03) + ',' + f(h * 0.42) + '" stroke="' + d + '" stroke-width="' + f(w * 0.012 + 2) + '" fill="none" stroke-linecap="round" opacity=".3"/>'; }
    return k.mount(cx - w * 0.36, y, w * 0.6, h * 0.55, k.lt(c, 0.2)) + k.mount(cx + w * 0.37, y, w * 0.56, h * 0.46, k.lt(c, 0.12)) + k.mount(cx, y, w, h, c) + g;
  }
  /* 빽빽한 구름(출 19:16). 안에 모양을 만들지 않는다 */
  function bank(seed, cx, cy, w, h, c, n) {
    var r = k.rng(seed), a = '', b = '', i;
    for (i = 0; i < n; i++) { var x = f(cx + (r() - 0.5) * w), y = f(cy + (r() - 0.5) * h), rx = f(w * (0.16 + r() * 0.1)), ry = f(h * (0.34 + r() * 0.2)); a += k.E(x, y + ry * 0.4, rx, ry * 0.8, k.dk(c, 0.4)); b += k.E(x, y, rx, ry * 0.8, c); }
    return k.G(a + b, ' class="ea-drift"');
  }
  /* 가마의 연기처럼 오르는 연기(출 19:18): 능선 한쪽에서 비스듬히 한 줄 */
  function reek(x, y, h, c, dx) { var o = '', i; for (i = 0; i < 7; i++) o += k.E(f(x + i * dx + Math.sin(i * 2.1) * 8), f(y - i * h / 7), 20 + i * 5, 15 + i * 3, c, k.op(k.f1(0.6 - i * 0.06))); return k.G(o, ' class="ea-drift"'); }
  /* 번개(출 19:16) */
  function bolt(seed, x, y, h) {
    var r = k.rng(seed), d = 'M' + x + ',' + y, i;
    for (i = 1; i <= 5; i++) { x += f((r() - 0.45) * 46); d += ' L' + x + ',' + f(y + h * i / 5); }
    return '<path d="' + d + '" stroke="#FFF6D8" stroke-width="10" fill="none" opacity=".22" stroke-linejoin="round"/><path d="' + d + '" stroke="#FFFBE8" stroke-width="3.5" fill="none" stroke-linejoin="round"/>';
  }
  /* 산 사면에 정한 경계(출 19:12): 산기슭을 따라 고르게 놓인 돌 한 줄 */
  function line(seed, y, x0, x1, c) { var r = k.rng(seed), o = '', x; for (x = x0; x < x1; x += 27) o += k.rock(f(x + r() * 6), f(y + r() * 4), 24, 13, c); return o; }
  /* 1) 시내 광야에 이르러 산 앞에 장막을 침(출 19:1-2) */
  function arrive() {
    return k.sky('day') + k.cloud(210, 160, 0.8, '#FBF7EE') + k.hill(1201, 366, 24, 0.7, '#B9B4B8') + sinai(500, 436, 720, 300, '#B08468') + k.hill(1202, 432, 8, 1.4, '#D2AC74') + k.ground(440, '#DDB878') +
      camp(1203, 13, 120, 780, 442, 476, 0.6, TC, TD) + k.rocks(1204, 500, 585, 6, '#B08C68') + k.tufts(1205, 480, 585, 8, '#9A8A4A');
  }
  /* 2) 모세가 하나님 앞에 올라감(출 19:3): 산으로 오르는 비탈의 오솔길 자국, 아래의 진 */
  function slope() {
    return k.sky('morning') + sinai(600, 500, 1250, 400, '#B58A6C') + k.road(300, 470, 30, 590, 196, 3, '#C29A7A', -70) + k.hill(1206, 456, 8, 1.5, '#D9B67C') + k.ground(470, '#DDB878') +
      camp(1207, 6, 110, 360, 458, 480, 0.5, TC, TD) + k.rocks(1208, 470, 580, 6, '#A8806A', 380, 860) + k.tufts(1209, 480, 585, 7, '#9A8A4A');
  }
  /* 3) 옷을 빨고 셋째 날을 기다림, 산 사면의 경계(출 19:10-14, 19:12): 장막 앞 바위에 펴 넌 옷과 산기슭의 돌 줄 */
  function bounds() {
    var cl = '', a = [[330, 498, 120, 54, '#FBF7EE'], [570, 506, 140, 60, '#C9D4D8'], [452, 462, 84, 38, '#D9CDB8']], i;
    for (i = 0; i < 3; i++) { var x = a[i][0], y = a[i][1], w = a[i][2], h = a[i][3]; cl += k.rock(x, y, w, h, '#A8907A') + k.P('M' + (x - w * 0.47) + ',' + (y - h * 0.4) + ' Q' + (x - w * 0.34) + ',' + (y - h * 1.1) + ' ' + x + ',' + (y - h * 1.08) + ' Q' + (x + w * 0.34) + ',' + (y - h * 1.04) + ' ' + (x + w * 0.48) + ',' + (y - h * 0.38) + ' l' + (-w * 0.17) + ',' + h * 0.06 + ' l' + (-w * 0.18) + ',' + (-h * 0.1) + ' l' + (-w * 0.22) + ',' + h * 0.11 + ' l' + (-w * 0.2) + ',' + (-h * 0.09) + ' Z', a[i][4]); }
    return k.sky('gold') + k.hill(1210, 350, 20, 0.8, '#8E86A0') + sinai(520, 404, 640, 250, '#A87C66') + k.ground(400, '#D0A66E') + line(1211, 410, 110, 790, '#8E7460') +
      k.tent(190, 506, 1.6, TC, TD) + k.tent(710, 496, 1.4, k.lt(TC, 0.14), TD) + cl + k.tufts(1212, 500, 585, 8, '#9A8A4A');
  }
  /* 산 위의 불(출 19:18): 산꼭대기 뒤의 붉은 빛으로만. 그 앞에 연기와 빽빽한 구름(19:16) */
  function fire(x, y, s) { return k.glow(x, y + 40 * s, 200 * s, '#EA6A2A', 0.85); }
  function top(x, y, s, c, n) { return reek(x + 150 * s, y + 70 * s, 110 * s, '#6E6A76', 24 * s) + bank(1213, x, y, 520 * s, 80 * s, c, n); }
  /* 4) 셋째 날 아침: 우레와 번개와 빽빽한 구름, 불과 연기(출 19:16-18). 진은 아래에 작게 */
  function thunder() {
    return k.sky('storm') + k.hill(1214, 370, 22, 0.7, '#4A4E60') + fire(480, 136, 1) + sinai(480, 436, 700, 296, '#4E465A') + top(480, 136, 1, '#3A3E50', 12) + bolt(1215, 250, 150, 170) + bolt(1216, 700, 160, 130) +
      k.ground(440, '#6A5A56') + camp(1203, 13, 120, 780, 442, 476, 0.6, '#9A8E88', '#2A2434') + k.rocks(1218, 500, 585, 6, '#5A4E52');
  }
  /* 5) 하나님이 이 모든 말씀을 하심(출 20:1): 산기슭(19:17)에서 올려다본 산, 구름과 연기. 경계의 돌 줄(19:23) */
  function words() {
    return k.sky('storm') + sinai(450, 560, 1500, 466, '#5A4E5E') + k.G(k.glow(0, 0, 200, '#EA6A2A', 0.7), ' transform="translate(450 180) scale(2.6 .6)"') + reek(640, 300, 170, '#77727C', 14) + bank(1219, 450, 130, 880, 90, '#3A3E50', 14) +
      k.hill(1220, 462, 8, 1.3, '#6E5E58') + k.ground(470, '#6E5E58') + line(1221, 462, 110, 790, '#8A7A74') + k.tufts(1222, 490, 585, 6, '#4E4A44');
  }
  /* 6) 이어지는 말씀(출 20:12-17): 진에서 장막 사이로 바라본 산 */
  function fromCamp() {
    return k.sky('storm') + k.hill(1223, 372, 18, 0.8, '#4A4E60') + fire(450, 168, 0.7) + sinai(450, 404, 560, 240, '#4E465A') + top(450, 168, 0.7, '#3A3E50', 10) + k.ground(400, '#6A5A56') +
      camp(1224, 6, 260, 640, 418, 452, 0.5, '#9A8E88', '#2A2434') + k.tent(175, 530, 2.3, '#A89C94', '#2A2434') + k.tent(735, 520, 2.0, '#9A8E88', '#2A2434') + k.tufts(1225, 500, 585, 6, '#4E4A44', 300, 620);
  }
  /* 7) 백성이 떨며 멀리 섬(출 20:18-21): 먼 산의 번개와 연기, 산기슭의 경계, 넓은 빈 들 */
  function afar() {
    return k.sky('storm') + k.hill(1226, 352, 18, 0.6, '#4A4E60') + fire(600, 172, 0.62) + sinai(600, 372, 430, 190, '#4A4458') + top(600, 172, 0.62, '#343848', 9) + bolt(1227, 500, 196, 110) +
      k.ground(368, '#75645A') + line(1229, 372, 390, 800, '#8A7A74') + k.hill(1228, 410, 10, 1.1, '#6A5A52') + camp(1230, 7, 115, 400, 446, 478, 0.7, '#9A8E88', '#2A2434') + k.rocks(1231, 500, 585, 5, '#5A4E52');
  }
  SA.reg('OT-12', { beats: [arrive, slope, bounds, thunder, words, fromCamp, afar], arrive: 0, end: 6 });
})();

/* ── OT-14 금송아지 (출 32장) ──
 * 그린 것과 근거: 산과 산 아래의 진(출 32:1, 32:17, 32:19) · 빼어 온 귀의 금고리(32:2-3. 고리 몇 개만) · 이튿날 이른 아침의 진(32:6)
 * · 산 위(32:7 "내려가라", 32:15 "산에서 내려오는데") · 산 아래에 깨진 판 조각(32:19. 글자 없이) · 진 문(32:26) · 이튿날 다시 산으로 오르는 길(32:30-31).
 * 그리지 않은 것: 사람(모세, 아론, 백성, 레위 자손), 하나님과 여호와의 사자의 형상, 금송아지와 그 앞의 단(우상), 번제·화목제의 제물, 춤추는 모습,
 *   먹고 마시는 자리와 음식(32:6), 하늘의 별(32:13은 아뢴 말 속의 약속), 송아지를 사른 불과 가루를 뿌린 물(32:20), 칼과 죽음(32:27-28), 백성을 치심(32:35), 산 위의 구름·불·빛(이 범위의 본문에 없음), 판의 글자. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = Math.round, TC = '#EFE3C8', TD = '#6B4A32';
  /* 진의 장막들(출 32:17) */
  function camp(seed, n, x0, x1, y0, y1, s0, c, d) {
    var r = k.rng(seed), a = [], i, out = '';
    for (i = 0; i < n; i++) a.push([f(x0 + r() * (x1 - x0)), f(y0 + r() * (y1 - y0)), r()]);
    a.sort(function (p, q) { return p[1] - q[1]; });
    for (i = 0; i < n; i++) { var s = k.f1(s0 * (0.75 + (a[i][1] - y0) / (y1 - y0 + 1) * 0.7)); out += k.E(a[i][0], a[i][1] + 1, 50 * s, 6 * s, '#16233F', k.op(0.16)) + k.tent(a[i][0], a[i][1], s, a[i][2] > 0.5 ? c : k.lt(c, 0.14), d); }
    return out;
  }
  /* 산(출 32:1): 큰 덩어리 하나와 양 어깨, 비탈의 골. 구름이나 불은 얹지 않는다 */
  function sinai(cx, y, w, h, c) {
    var g = '', i, d = k.dk(c, 0.3);
    for (i = 0; i < 5; i++) { var u = i - 2.2; g += '<path d="M' + f(cx + u * w * 0.11) + ',' + f(y - h * (0.76 - Math.abs(u) * 0.13)) + ' q' + f(w * 0.02) + ',' + f(h * 0.2) + ' ' + f(u * w * 0.03) + ',' + f(h * 0.42) + '" stroke="' + d + '" stroke-width="' + f(w * 0.012 + 2) + '" fill="none" stroke-linecap="round" opacity=".3"/>'; }
    return k.mount(cx - w * 0.36, y, w * 0.6, h * 0.55, k.lt(c, 0.2)) + k.mount(cx + w * 0.37, y, w * 0.56, h * 0.46, k.lt(c, 0.12)) + k.mount(cx, y, w, h, c) + g;
  }
  /* 귀의 금고리(출 32:2-3): 천 위에 납작하게 놓인 고리 몇 개 */
  function gold(x, y) {
    var r = k.rng(1401), o = k.E(x, y + 5, 96, 14, '#16233F', k.op(0.16)) + k.E(x, y, 90, 14, '#D9CDB8') + k.E(x + 20, y + 4, 64, 8, '#B8A88E', k.op(0.5)), i;
    for (i = 0; i < 10; i++) o += '<circle cx="' + f(x + (r() - 0.5) * 130) + '" cy="' + f(y - 5 + r() * 7) + '" r="' + f(4 + r() * 3) + '" fill="none" stroke="' + (i % 3 ? '#E2B840' : '#C8922A') + '" stroke-width="2.5"/>';
    return o;
  }
  /* 산 위의 바위 턱 */
  function ledge(c) {
    return k.P('M0,600 L0,318 Q120,296 220,348 Q300,398 430,432 Q570,458 710,440 Q820,424 900,384 L900,600 Z', c) +
      k.P('M0,600 L0,372 Q110,360 200,404 Q300,452 440,470 Q600,486 900,440 L900,600 Z', k.dk(c, 0.22)) +
      '<path d="M10,326 Q118,304 214,352 M250,376 Q330,412 430,438" stroke="' + k.lt(c, 0.3) + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>' + k.rock(600, 452, 90, 44, k.lt(c, 0.1)) + k.rock(170, 380, 70, 34, k.lt(c, 0.06));
  }
  /* 깨진 판 조각(출 32:19): 납작한 돌 조각. 글자 없음 */
  function shards(x, y, c) {
    var a = [[-84, 0, '0,0 38,-9 52,11 22,24 -7,15'], [-14, -16, '0,0 34,4 30,27 2,29 -11,11'], [44, 2, '0,0 30,-11 50,2 41,22 9,20'], [100, -8, '0,0 20,-5 25,13 7,18'], [-40, 22, '0,0 18,-5 27,9 7,13'], [26, 28, '0,0 25,2 16,15 -2,11']], o = k.E(x + 10, y + 22, 130, 16, '#16233F', k.op(0.14)), i;
    for (i = 0; i < a.length; i++) o += '<polygon points="' + a[i][2] + '" transform="translate(' + (x + a[i][0]) + ' ' + (y + a[i][1] + 5) + ')" fill="' + k.dk(c, 0.35) + '"/><polygon points="' + a[i][2] + '" transform="translate(' + (x + a[i][0]) + ' ' + (y + a[i][1]) + ')" fill="' + (i % 2 ? c : k.lt(c, 0.2)) + '"/>';
    return o;
  }
  /* 1) 산 아래의 진, 빼어 온 금고리(출 32:1-3) */
  function rings() {
    return k.sky('day') + k.hill(1402, 362, 24, 0.7, '#B9B4B8') + sinai(560, 424, 660, 280, '#B08468') + k.hill(1403, 420, 8, 1.4, '#D2AC74') + k.ground(428, '#DDB878') +
      camp(1404, 11, 110, 790, 426, 444, 0.5, TC, TD) + gold(450, 462) + k.rocks(1405, 500, 585, 6, '#B08C68') + k.tufts(1406, 486, 585, 8, '#9A8A4A');
  }
  /* 2) "이튿날에 일찌기 일어나"(출 32:6): 이른 아침의 진만. 단과 제물, 먹고 마시는 자리는 그리지 않는다 */
  function early() {
    return k.sky('dawn') + k.sun(210, 340, 26, '#FFF1C8', '#FBE3B0') + k.hill(1407, 362, 24, 0.7, '#A898B0') + sinai(580, 424, 640, 270, '#A08A96') + k.ground(424, '#C9A470') +
      camp(1408, 12, 110, 790, 430, 474, 0.6, '#E6D6BC', '#5E4636') + k.rocks(1425, 500, 585, 5, '#A88A70') + k.tufts(1409, 486, 585, 8, '#8A8A4A');
  }
  /* 3) "내려가라"(출 32:7): 산 위의 바위 턱과 멀리 흐릿한 들. 진은 산 위에서 보이지 않는다(32:17-19) */
  function above() {
    return k.sky('day') + k.cloud(640, 150, 0.8, '#FBF7EE') + k.hill(1410, 262, 16, 0.6, '#A9B4C8') + k.ground(268, '#D0C4A8') + k.hill(1411, 300, 6, 1.2, '#D6C6A0') + k.hill(1412, 350, 8, 0.8, '#DCC494') + ledge('#9A7058');
  }
  /* 4) 모세가 여호와께 구함(출 32:11-14): 같은 낮, 산 중턱에서 올려다본 산꼭대기와 하늘 */
  function summit() {
    return k.sky('day') + k.cloud(250, 170, 1, '#FBF7EE') + sinai(520, 640, 1400, 500, '#A87C62') + k.hill(1413, 452, 12, 1.1, '#8E6850') + k.ground(462, '#8E6850') + k.rocks(1426, 440, 470, 5, '#B08C74', 110, 790) + k.rocks(1427, 500, 585, 4, '#A07E68');
  }
  /* 5) 산 아래에서 깨뜨린 판(출 32:19): 산기슭의 깨진 돌 조각, 멀리 진 */
  function broken() {
    return k.sky('gold') + k.hill(1414, 366, 20, 0.8, '#8E86A0') + sinai(780, 440, 900, 360, '#A87C66') + k.ground(432, '#D2A870') + camp(1415, 8, 110, 400, 420, 440, 0.42, TC, TD) +
      k.rocks(1416, 440, 470, 5, '#9A7A64', 600, 800) + shards(450, 440, '#B9B6AE') + k.rocks(1417, 500, 585, 5, '#9A7A64') + k.tufts(1418, 486, 585, 7, '#9A8A4A');
  }
  /* 6) 진 문(출 32:26): 흐린 낮, 장막 사이로 난 길. 칼과 죽음은 그리지 않는다 */
  function gateCamp() {
    var a = [[392, 414, 0.4], [508, 416, 0.42], [350, 430, 0.62], [556, 432, 0.66], [286, 456, 0.95], [628, 458, 1.0], [180, 500, 1.5], [742, 504, 1.6]], o = '', i;
    for (i = 0; i < a.length; i++) o += k.E(a[i][0], a[i][1] + 1, 50 * a[i][2], 6 * a[i][2], '#16233F', k.op(0.2)) + k.tent(a[i][0], a[i][1], a[i][2], i % 3 ? '#CDBFA6' : '#D9CBB0', '#4A3440');
    return k.sky('grey') + k.hill(1419, 360, 20, 0.7, '#8A90A0') + sinai(450, 404, 700, 240, '#8A7470') + k.ground(400, '#A89070') + k.road(450, 600, 300, 450, 404, 34, '#C4AC88', 0, '#8A7458') + o + k.tufts(1420, 500, 585, 6, '#6E6A4A');
  }
  /* 7) 이튿날 모세가 다시 여호와께로 올라감(출 32:30-31): 아침의 산과 오솔길 자국, 아래의 진 */
  function again() {
    return k.sky('morning') + sinai(360, 484, 1000, 380, '#B58A6C') + k.road(560, 468, 10, 410, 200, 3, '#C29A7A', 60) + k.hill(1421, 454, 8, 1.5, '#D9B67C') + k.ground(468, '#DDB878') +
      camp(1422, 7, 520, 790, 456, 478, 0.5, TC, TD) + k.rocks(1423, 470, 580, 6, '#A8806A', 60, 460) + k.tufts(1424, 482, 585, 7, '#9A8A4A');
  }
  SA.reg('OT-14', { beats: [rings, early, above, summit, broken, gateCamp, again], arrive: 0, end: 6 });
})();

/* ── OT-15 열두 정탐꾼 (민 13:1-14:38) ──
 * 그린 것과 근거: 바란 광야(민 13:3)와 가데스(13:26)에 친 진의 장막들(12:16 "바란 광야에 진을 치니라") · 남방 길과 산지(13:17) · 에스골 골짜기(13:23)
 * · 포도 한 송이 달린 가지를 꿴 막대기, 석류, 무화과(13:23) · 밤(14:1) · 회막과 땅의 돌(14:10) · 내일 갈 홍해 길 쪽 광야(14:25) · 광야(14:33).
 * 그리지 않은 것: 사람(정탐꾼, 모세, 아론, 여호수아, 갈렙, 회중), 포도를 메는 사람, 아낙 자손(13:28, 13:33), 견고한 성읍(13:28은 회보하는 말 속), 달(14:1은 "밤새도록"뿐), 하나님의 형상,
 *   회막에 나타난 여호와의 영광(14:10. 본문이 모습을 말하지 않아 글로만), 구름 기둥과 불 기둥(14:14는 아뢴 말 속), 돌로 치는 모습, 재앙과 죽음(14:37). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, f = Math.round, TC = '#EFE3C8', TD = '#6B4A32';
  /* 장막들 */
  function camp(seed, n, x0, x1, y0, y1, s0, c, d, d2) {
    var r = k.rng(seed), a = [], i, out = '';
    for (i = 0; i < n; i++) a.push([f(x0 + r() * (x1 - x0)), f(y0 + r() * (y1 - y0)), r()]);
    a.sort(function (p, q) { return p[1] - q[1]; });
    for (i = 0; i < n; i++) { var s = k.f1(s0 * (0.75 + (a[i][1] - y0) / (y1 - y0 + 1) * 0.7)); out += k.E(a[i][0], a[i][1] + 1, 50 * s, 6 * s, '#16233F', k.op(0.16)) + k.tent(a[i][0], a[i][1], s, a[i][2] > 0.5 ? c : k.lt(c, 0.14), d2 && i % 3 === 0 ? d2 : d); }
    return out;
  }
  function grapes(x, y, s) {
    var n = [3, 4, 4, 3, 2, 1], o = '<path d="M' + x + ',' + (y - 8 * s) + ' v' + 12 * s + '" stroke="#6B4426" stroke-width="' + 3 * s + '"/>' + k.E(x + 13 * s, y - 2 * s, 12 * s, 7 * s, '#6F8448', ' transform="rotate(-20 ' + (x + 13 * s) + ' ' + (y - 2 * s) + ')"'), i, j;
    for (j = 0; j < 6; j++) for (i = 0; i < n[j]; i++) o += '<circle cx="' + k.f1(x + (i - (n[j] - 1) / 2) * 11 * s) + '" cy="' + k.f1(y + (j * 9.5 + 9) * s) + '" r="' + k.f1(6.4 * s) + '" fill="' + ((i + j) % 2 ? '#6A3E7A' : '#80509A') + '"/>';
    return o;
  }
  /* 포도 한 송이, 석류, 무화과(민 13:23) */
  function pome(x, y, s) { return k.E(x, y - 11 * s, 11 * s, 11 * s, '#B8402E') + k.P('M' + (x - 4 * s) + ',' + (y - 21 * s) + ' l2,-6 l2,4 l2,-4 l2,6 Z', '#8E2E26'); }
  function fig(x, y, s) { return k.P('M' + x + ',' + (y - 20 * s) + ' Q' + (x + 12 * s) + ',' + (y - 8 * s) + ' ' + (x + 8 * s) + ',' + y + ' Q' + x + ',' + (y + 3 * s) + ' ' + (x - 8 * s) + ',' + y + ' Q' + (x - 12 * s) + ',' + (y - 8 * s) + ' ' + x + ',' + (y - 20 * s) + ' Z', '#5E4A6E'); }
  function fruits(x, y) { return pome(x, y, 1.2) + pome(x + 28, y + 5, 1.1) + pome(x + 12, y - 12, 1) + fig(x + 190, y + 3, 1.1) + fig(x + 210, y + 6, 1) + fig(x + 201, y - 9, 0.9) + fig(x + 228, y + 2, 1); }
  /* 회막(민 14:10): 긴 장막. 처진 천과 줄, 앞의 휘장만 단순하게 */
  function tabernacle(x, y, s) {
    var t = y - 60 * s, l = x - 104 * s, r = x + 104 * s;
    return k.E(x, y + 2, 130 * s, 10 * s, '#16233F', k.op(0.18)) + '<path d="M' + l + ',' + t + ' L' + (l - 46 * s) + ',' + y + ' M' + r + ',' + t + ' L' + (r + 46 * s) + ',' + y + '" stroke="#6B4A32" stroke-width="2.5"/>' +
      k.P('M' + (x - 118 * s) + ',' + y + ' L' + l + ',' + t + ' Q' + (x - 50 * s) + ',' + (t + 12 * s) + ' ' + x + ',' + (t + 3 * s) + ' Q' + (x + 54 * s) + ',' + (t + 13 * s) + ' ' + r + ',' + t + ' L' + (x + 118 * s) + ',' + y + ' Z', '#B89A78') +
      k.P('M' + (x + 30 * s) + ',' + y + ' L' + (x + 40 * s) + ',' + (t + 10 * s) + ' Q' + (x + 60 * s) + ',' + (t + 13 * s) + ' ' + r + ',' + t + ' L' + (x + 118 * s) + ',' + y + ' Z', '#8A6E58', k.op(0.5)) + k.R(x - 92 * s, y - 44 * s, 36 * s, 44 * s, '#6A6A9A');
  }
  function wild(g, far, mid) { return k.hill(1501, 318, 34, 0.5, far) + k.hill(1502, 362, 20, 0.9, mid) + k.hill(1503, 404, 8, 1.4, g) + k.ground(410, g); }
  /* 1) 바란 광야에서 그 땅을 살피러 보냄(민 13:3, 13:17): 진과 산지로 올라가는 길 */
  function paran() {
    return k.sky('day') + k.cloud(650, 160, 0.8, '#FBF7EE') + wild('#DDBE84', '#9FB0C4', '#B8B49C') + k.road(470, 600, 170, 500, 372, 10, '#EBD6A8', 30, '#B89260') +
      camp(1504, 6, 110, 360, 420, 468, 0.6, TC, TD) + camp(1505, 6, 580, 790, 420, 468, 0.6, TC, TD) + k.rocks(1506, 500, 585, 5, '#B08C68') + k.tufts(1507, 480, 585, 8, '#9A8A4A');
  }
  /* 2) 에스골 골짜기의 포도송이와 석류와 무화과(민 13:23): 시냇가 풀밭에 놓인 것으로 */
  function eshcol() {
    var v = '', r = k.rng(1508), i;
    for (i = 0; i < 16; i++) { var l = i % 2, t = r(), x = l ? 120 + t * 250 : 530 + t * 260, y = 330 + r() * 80 + (l ? t : 1 - t) * 30; v += k.bush(f(x), f(y), 0.45 + (y - 330) / 300, '#5E8A48', '#7EA85A'); }
    return k.sky('morning') + k.hill(1509, 300, 40, 0.5, '#9AB0A8') + k.P('M0,600 L0,250 Q210,320 400,440 L400,600 Z', '#86A060') + k.P('M900,600 L900,230 Q680,330 500,440 L500,600 Z', '#789654') + k.ground(436, '#A8B468') +
      k.road(450, 600, 110, 452, 400, 10, '#9AD0D0', 16) + v + k.E(290, 472, 150, 9, '#16233F', k.op(0.12)) +
      '<path d="M160,458 L410,450" stroke="#7A5232" stroke-width="8" stroke-linecap="round"/><g transform="rotate(-62 290 454)">' + grapes(290, 454, 1.05) + '</g>' + fruits(150, 470) + k.tufts(1533, 450, 580, 6, '#6E8A40', 520, 790);
  }
  /* 3) 가데스로 돌아와 그 땅의 열매를 보임(민 13:26-27): 장막 앞 땅에 놓인 열매 */
  function report() {
    return k.sky('noon') + wild('#D9B87C', '#A9B4C8', '#BDB294') + camp(1510, 9, 110, 790, 412, 432, 0.6, TC, TD) + k.E(450, 468, 200, 10, '#16233F', k.op(0.12)) +
      '<path d="M270,452 L630,446" stroke="#7A5232" stroke-width="8" stroke-linecap="round"/><g transform="rotate(-62 450 450)">' + grapes(450, 450, 1.05) + '</g>' + fruits(300, 468) + k.tufts(1511, 486, 585, 8, '#9A8A4A');
  }
  /* 4) "올라가서 그 땅을 취하자"(민 13:30), 올라가지 못하리라(13:31): 가데스의 진과 산지로 올라가는 남방 길(13:17) */
  function wayUp() {
    return k.sky('gold') + k.hill(1512, 290, 30, 0.6, '#8E86A0') + k.mount(330, 420, 760, 150, '#A89878') + k.mount(680, 420, 520, 110, '#B8A47E') + k.hill(1514, 404, 8, 1.4, '#D0AC74') + k.ground(410, '#D0AC74') +
      k.road(620, 600, 180, 420, 318, 5, '#E2C898', -50, '#B89260') + camp(1513, 5, 110, 380, 440, 474, 0.8, TC, TD) + k.rocks(1516, 430, 580, 6, '#A8886A', 620, 800) + k.tufts(1517, 470, 585, 8, '#9A8A4A');
  }
  /* 5) 백성이 밤새도록 곡함(민 14:1): 밤의 장막들 */
  function night() {
    return k.sky('night') + k.stars(1518, 150, 320) + wild('#3E4468', '#2A2A52', '#34365E') + camp(1519, 15, 110, 790, 418, 476, 0.62, '#5A6088', '#1E2440', '#F4C272') + k.rocks(1520, 500, 585, 5, '#4A506E');
  }
  /* 6) 회막(민 14:10)과 땅의 돌: 이른 아침 */
  function tentOfMeeting() {
    return k.sky('dawn') + wild('#C9A470', '#9A8AA0', '#B89A7A') + camp(1521, 7, 110, 790, 414, 426, 0.5, '#E6D6BC', '#5E4636') + tabernacle(520, 452, 1.15) + k.rocks(1522, 446, 470, 8, '#9A8472', 120, 360) + k.tufts(1523, 486, 585, 7, '#8A8A4A');
  }
  /* 7) "내일 돌이켜 홍해 길로 하여 광야로 들어갈지니라"(민 14:25): 낮, 내일 갈 광야 길 */
  function wayBack() {
    return k.sky('day') + k.cloud(600, 170, 1, '#FBF7EE') + wild('#D2B078', '#A4B0C0', '#BCAE90') + k.road(560, 600, 300, 250, 378, 10, '#E6D0A2', -170, '#B89260') + camp(1524, 5, 600, 790, 424, 460, 0.6, TC, TD) + k.rocks(1525, 440, 580, 6, '#A8886A', 110, 420);
  }
  /* 8) 사십 년 동안 광야에서(민 14:33): 넓은 광야와 작은 진 */
  function forty() {
    return k.sky('dry') + k.sun(640, 150, 26, '#FFF6D8', '#F4E3B8') + k.hill(1526, 300, 26, 0.4, '#C4B8A4') + k.hill(1527, 340, 18, 0.8, '#CDB890') + k.hill(1528, 384, 14, 1.2, '#D2B480') + k.ground(392, '#D9B878') +
      camp(1529, 12, 300, 640, 388, 408, 0.26, TC, TD) + k.hill(1530, 440, 12, 1.0, '#CDA86A') + k.rocks(1531, 446, 580, 9, '#B08C68') + k.tufts(1532, 450, 585, 8, '#A08A50');
  }
  SA.reg('OT-15', { beats: [paran, eshcol, report, wayUp, night, tentOfMeeting, wayBack, forty], arrive: 0, end: 7 });
})();

/* ── OT-16 느보 산에서 모세의 마지막 (신 34:1-12) ──
 * 그린 것과 근거: 모압 평지와 느보 산, 비스가 꼭대기(신 34:1) · 평지의 진(34:8 모압 평지에서 애곡. 장막만) · 꼭대기에서 내려다본 땅: 겹겹이 먼 땅(34:1-2 길르앗에서 단까지, 유다 온 땅),
 * 하늘 끝의 서해(34:2), 남방(34:3), 종려의 성읍 여리고의 골짜기 평지(34:3. 성읍은 멀리 작게, 종려 몇 그루) · 벧브올 맞은편 모압 땅의 골짜기(34:6. 고요한 골짜기만. 길도 두지 않음).
 * 같은 자리는 같은 쪽에: 평지에서 본 산과 진(1·5·6), 꼭대기에서 본 성읍과 바위(2·3).
 * 그리지 않은 것: 사람(모세, 여호수아, 애곡하는 백성), 하나님의 형상과 빛·구름(본문에 없음), 무덤과 그 표시(34:6 묻힌 곳을 아는 자 없음), 장사하는 모습,
 *   요단 강(34:1-4에 강이 적혀 있지 않아 뺐다), 소알 성(이름만 나와 따로 그리지 않음), 애굽의 이적(34:11-12. 말씀으로만). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  /* 평지의 장막들(신 34:8 모압 평지): 멀수록 작고 흐리게 */
  function camp(seed, x0, x1, y0, y1, n, c, d) {
    var r = k.rng(seed), a = [], i, out = '';
    for (i = 0; i < n; i++) a.push([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)]);
    a.sort(function (p, q) { return p[1] - q[1]; });
    for (i = 0; i < n; i++) { var t = (a[i][1] - y0) / Math.max(1, y1 - y0), s = 0.3 + t * 0.75; out += k.E(a[i][0], a[i][1] + 1, 44 * s, 5 * s, '#16233F', k.op(0.14)) + k.tent(k.f1(a[i][0]), k.f1(a[i][1]), s, i % 3 ? k.mix(c, '#C9D8E4', 0.3 - t * 0.3) : k.lt(c, 0.2), d); }
    return out;
  }
  /* 1) 모압 평지를 떠나 느보 산으로(신 34:1): 평지의 진, 산으로 오르는 길, 비스가 꼭대기 */
  function plain() {
    return k.sky('morning') + k.cloud(230, 150, 0.9, '#FBF7EE') + k.hill(1601, 330, 26, 0.6, '#B4BECC') + k.mount(560, 420, 620, 250, '#B49A82') + k.mount(300, 420, 420, 120, '#BEA688') +
      k.road(400, 440, 24, 524, 200, 4, '#D8C4A0', 120) + k.hill(1602, 408, 10, 1.3, '#C9AE78') + k.ground(425, '#D0B078') + camp(1603, 110, 420, 425, 475, 9, '#D8C8A8', '#6B5A4A') +
      k.road(250, 600, 200, 384, 440, 50, '#E0CCA0', 60) + k.rocks(1604, 470, 580, 6, '#A88A64', 500, 860) + k.tufts(1605, 455, 585, 12, '#8E8A4E');
  }
  /* 꼭대기에서 본 땅: 하늘 끝의 바다, 겹겹의 먼 땅, 골짜기 평지와 종려의 성읍, 발아래 꼭대기의 바위 */
  function view(skyName, f, sea, g, seed) {
    var jx = 560, out = k.sky(skyName), i, r = k.rng(seed);
    out += k.R(0, 236, 900, 30, sea) + k.R(0, 240, 900, 3, k.lt(sea, 0.4), ' class="ea-shim" opacity=".6"');
    out += k.hill(seed + 1, 262, 12, 0.7, k.mix(f, sea, 0.6)) + k.hill(seed + 2, 286, 16, 0.9, k.mix(f, sea, 0.35)) + k.hill(seed + 3, 312, 16, 1.2, f) + k.hill(seed + 4, 338, 10, 1.6, k.mix(f, g, 0.5));
    out += k.ground(352, g) + k.E(jx, 376, 250, 22, k.lt(g, 0.18), k.op(0.7)) + k.E(jx + 150, 396, 200, 12, k.dk(g, 0.12), k.op(0.5));
    out += k.town(seed + 5, jx, 372, 110, 4, k.mix(g, '#F0DEB8', 0.7), 0.42);
    for (i = 0; i < 9; i++) { var px = jx - 110 + r() * 220, py = 370 + r() * 20; out += k.palm(k.f1(px), k.f1(py), 0.24 + r() * 0.1, '#7A6248', '#5E7A46'); }
    return out;
  }
  function summit(c) {
    return '<g transform="translate(0,-44)">' + k.P('M-20,600 L-20,452 Q70,420 200,412 Q380,400 570,446 Q750,430 920,470 L920,600 Z', c) + k.P('M200,412 Q380,400 570,446 Q420,470 300,440 Z', k.lt(c, 0.2), k.op(0.6)) +
      k.rock(290, 452, 150, 56, k.lt(c, 0.1)) + k.rock(180, 468, 90, 34, k.dk(c, 0.1)) + k.rocks(1611, 490, 600, 7, c) + k.tufts(1612, 450, 610, 12, k.mix(c, '#6F8448', 0.6)) + '</g>' + k.R(0, 556, 900, 44, c);
  }
  /* 2) 비스가 꼭대기에서 보이신 땅(신 34:1-3): 낮. 먼 땅과 서해, 여리고 골짜기 평지 */
  function seen() { return view('day', '#9FB4B8', '#8CC4D6', '#B9BE84', 1620) + k.cloud(640, 150, 0.8, '#FBF7EE') + summit('#A88868'); }
  /* 3) 맹세하신 땅, 눈으로 보게 하심(신 34:4): 같은 꼭대기, 같은 쪽, 같은 낮. 본문에 때가 없어 해를 두지 않고 땅빛만 따뜻하게 */
  function promised() { return view('noon', '#B4AE9C', '#9CCAD2', '#C8BE7C', 1620) + k.cloud(300, 160, 1.1, '#FBF7EE') + summit('#A07C58'); }
  /* 4) 벧브올 맞은편 모압 땅의 골짜기(신 34:5-6): 저문 뒤의 고요한 골짜기. 무덤도 길도 그리지 않는다 */
  function valley() {
    return k.sky('afterglow') + k.stars(1641, 26, 200) + k.hill(1642, 300, 30, 0.5, '#5E5680') +
      k.P('M-20,600 L-20,190 Q170,230 300,350 Q390,430 470,600 Z', '#6E5A6E') + k.P('M-20,600 L-20,300 Q150,330 260,420 Q340,480 400,600 Z', '#5A4A60', k.op(0.5)) +
      k.P('M920,600 L920,160 Q720,220 590,350 Q500,440 420,600 Z', '#7E6470') + k.P('M920,600 L920,290 Q760,330 650,420 Q560,500 520,600 Z', '#8E7078', k.op(0.6)) +
      k.bush(250, 430, 0.8, '#4E5A52') + k.bush(660, 404, 0.7, '#56624E') + k.bush(730, 470, 1.1, '#4E5A52') +
      k.rocks(1643, 440, 580, 8, '#7A6A78', 180, 720) + k.tufts(1644, 430, 590, 12, '#4A5650');
  }
  /* 5) 모압 평지에서 삼십 일을 애곡함(신 34:8-9): 평지에 가득한 진, 흐린 저녁. 사람은 그리지 않는다 */
  function mourn() {
    return k.sky('grey') + k.mount(560, 400, 620, 250, '#8E8E98') + k.mount(300, 400, 420, 120, '#9A98A0') + k.hill(1651, 372, 18, 0.8, '#9C988E') + k.ground(392, '#A89A7C') + k.hill(1652, 440, 6, 1.8, '#A08E6E') +
      camp(1653, 60, 860, 398, 470, 26, '#C4B8A0', '#4E4A50') + k.tufts(1654, 480, 590, 12, '#7A7A56') + k.rocks(1655, 500, 585, 5, '#8A8072');
  }
  /* 6) 그 뒤(신 34:10-12): 동틀 녘, 1과 같은 자리의 느보 산과 진, 평지의 빈 길 */
  function after() {
    return k.sky('dawn') + k.glow(200, 380, 200, '#FFE9B8', 0.6) + k.hill(1661, 340, 24, 0.5, '#8E8AA8') + k.mount(560, 420, 620, 250, '#8A7A8E') + k.mount(300, 420, 420, 120, '#9A8690') +
      k.hill(1662, 410, 10, 1.2, '#B49A7C') + k.ground(428, '#C2A478') + camp(1603, 110, 420, 425, 475, 9, '#D8C8A8', '#6B5A4A') + k.road(250, 600, 200, 384, 440, 50, '#DEC8A0', 60) +
      k.rocks(1664, 470, 580, 6, '#A0846A', 500, 860) + k.tufts(1665, 450, 588, 12, '#8A8650');
  }
  SA.reg('OT-16', { beats: [plain, seen, promised, valley, mourn, after], arrive: 0, end: 5 });
})();

/* ── OT-17 라합과 두 정탐꾼 (수 2:1-24) ──
 * 그린 것과 근거: 여리고(수 2:1) · 밤(2:2, 2:5) · 성문(2:5, 2:7) · 성벽과 성벽 위에 있는 집(2:15) · 지붕과 지붕에 벌여 놓은 삼대(2:6, 2:8)
 * · 요단으로 가는 길(2:7) · 위로 하늘, 아래로 땅(2:11) · 창(2:15)과 창에 맨 붉은 줄(2:18, 2:21. 창턱의 매듭과 짧은 끝자락만) · 산(2:16, 2:22) · 강(2:23).
 * 그리지 않은 것: 사람(두 정탐꾼, 라합과 그 가족, 왕이 보낸 사람들, 쫓는 사람들), 왕의 궁, 창으로 달아 내린 줄(2:15. 붉은 줄과 같은 줄인지 그림으로 정하지 않으려고 뺐다),
 *   삼대 속에 숨은 모습, 등잔 같은 집 안의 물건, 종려, 달, 새벽빛(이 본문에 없음). 창의 불빛은 밤의 집을 나타내는 것뿐이다. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, LIT = '#F4C272';
  /* 가까이 본 성벽: 돌 자국과 성가퀴 */
  function bigWall(x0, top, c, seed, m) {
    var r = k.rng(seed), out = k.R(x0, top, 900 - x0, 600 - top, k.lg([c, k.dk(c, 0.22)])) + k.R(x0, top, 26, 600 - top, k.lt(c, 0.12), k.op(0.5)), i;
    for (i = 0; x0 + i * m * 2 < 900; i++) out += k.R(x0 + i * m * 2, top - m * 0.8, m, m * 0.8 + 1, c);
    for (i = 0; i < 46; i++) out += k.R(x0 + 8 + r() * (880 - x0), top + 8 + r() * (590 - top), 26 + r() * 22, 7, k.dk(c, 0.3), ' rx="3" opacity="' + k.f1(0.14 + r() * 0.16) + '"');
    return out;
  }
  /* 성벽 위에 있는 집과 창(수 2:15). cord면 창에 맨 붉은 줄(2:21) */
  function wallHouse(x, top, w, h, c, lit, cord) {
    var wx = x + w * 0.2, ww = w * 0.2, wy = top - h * 0.62, wh = h * 0.34, out = k.house(x, top, w, h, c, { door: false, win: false });
    out += k.R(x - 4, top - 3, w + 8, 8, k.dk(c, 0.2)) + k.R(wx - 4, wy - 4, ww + 8, wh + 8, k.dk(c, 0.35), ' rx="3"') + k.R(wx, wy, ww, wh, lit ? LIT : k.dk(c, 0.62), ' rx="2"') + k.R(wx - 6, wy + wh + 2, ww + 12, 5, k.lt(c, 0.2), ' rx="2"');
    if (cord) out += '<path d="M' + k.f1(wx + ww * 0.5) + ',' + k.f1(wy + wh - 2) + ' q4,' + k.f1(wh * 0.4) + ' -1,' + k.f1(wh * 0.75) + '" stroke="#C0322A" stroke-width="4" fill="none" stroke-linecap="round"/>' + k.E(wx + ww * 0.5, wy + wh, 6, 5, '#A82A24');
    return out;
  }
  /* 지붕에 벌여 놓은 삼대(수 2:6): 길게 눕힌 줄기 다발 */
  function flax(seed, x, y, w, n, c) {
    var r = k.rng(seed), out = k.E(x + w / 2, y + 4, w * 0.56, 9, '#16233F', k.op(0.25)), i;
    for (i = 0; i < n; i++) { var dy = (i - n / 2) * 2.6, a = (r() - 0.5) * 10; out += '<path d="M' + k.f1(x + r() * 12) + ',' + k.f1(y + dy) + ' L' + k.f1(x + w - r() * 14) + ',' + k.f1(y + dy + a) + '" stroke="' + (i % 3 ? c : k.lt(c, 0.25)) + '" stroke-width="3" stroke-linecap="round"/>'; }
    return out + k.R(x + w * 0.3, y - n * 1.4, 7, n * 2.9, k.dk(c, 0.35), ' rx="3"');
  }
  function roof(c, seed, n) {
    var out = k.R(0, 384, 900, 216, k.lg([c, k.dk(c, 0.2)])) + k.R(0, 372, 900, 16, k.lt(c, 0.16)) + k.R(0, 386, 900, 6, k.dk(c, 0.4), k.op(0.4)), r = k.rng(seed), i;
    for (i = 0; i < n; i++) out += flax(seed + i, 110 + (i % 4) * 172 + r() * 20, 420 + Math.floor(i / 4) * 48 + (i % 2) * 14, 150, 13, '#A89A5A');
    return out;
  }
  function jericho(seed, x, y, s, c, lit, haze) {
    var out = k.town(seed, x, y - 14 * s, 300 * s, 6, c, s, { lit: lit, haze: haze }) + k.wall(x - 190 * s, y, 380 * s, 30 * s, k.dk(c, 0.08), seed + 1) + k.gate(x - 60 * s, y, 70 * s, 42 * s, c);
    return out;
  }
  /* 1) 싯딤에서 여리고로(수 2:1): 저물녘, 멀리 성벽과 성문이 선 여리고 */
  function approach() {
    return k.sky('gold') + k.sun(690, 300, 26, '#FFF1C8', '#FBD98A') + k.hill(1701, 330, 40, 0.6, '#8E7E96') + k.hill(1702, 372, 16, 1.1, '#B49A7A') + k.ground(398, '#C9A468') + jericho(1703, 420, 400, 1, '#D6B484') +
      k.road(300, 600, 240, 362, 404, 26, '#E2CCA0', 70, '#B08E62') + k.rocks(1704, 460, 580, 6, '#A0845E', 520, 860) + k.tufts(1705, 440, 588, 12, '#8A8650');
  }
  /* 2) 이 밤에 왕이 사람을 보냄(수 2:2-3): 밤의 성문과 성벽, 성벽 위의 집 */
  function gateNight() {
    return k.sky('night') + k.stars(1711, 40, 230) + k.hill(1712, 300, 30, 0.7, '#283258') + k.town(1713, 400, 318, 620, 9, '#5A5878', 1.1, { lit: true, haze: '#34406A' }) + bigWall(0, 318, '#5E5A74', 1714, 20) +
      wallHouse(560, 304, 190, 96, '#6E6880', true) + k.gate(290, 480, 230, 190, '#6A6680') + k.ground(478, '#454A66') + k.road(290, 600, 190, 290, 478, 60, '#62688A', 0) + k.tufts(1715, 500, 590, 8, '#343C56');
  }
  /* 3) 지붕의 삼대, 요단으로 가는 길(수 2:6-7): 지붕 위에서 성 밖을 봄. 닫힌 성문 쪽 성벽과 나루로 가는 길 */
  function roofRoad() {
    return k.sky('night') + k.stars(1721, 34, 200) + k.hill(1722, 270, 22, 0.6, '#2C3660') + k.ground(292, '#3A4468') + k.R(0, 286, 900, 9, '#6E86A8', ' class="ea-shim" opacity=".8"') +
      k.road(600, 384, 90, 480, 294, 8, '#8A8494', -70) + k.tufts(1725, 300, 380, 9, '#2E3A52', 440, 880) + k.wall(0, 384, 420, 44, '#56546E', 1723) + roof('#7A7286', 1724, 7);
  }
  /* 4) 위로 하늘, 아래로 땅(수 2:8-11): 같은 지붕(삼대도 3과 같은 자리)에서 본 깊은 밤의 넓은 하늘과 산 쪽 땅 */
  function roofSky() {
    return k.sky('deepnight') + k.stars(1731, 110, 350) + k.hill(1732, 300, 44, 0.5, '#1E2748') + k.hill(1733, 340, 22, 1.0, '#27305A') + k.ground(362, '#2E3860') + roof('#62607C', 1724, 7);
  }
  function outside(skyName, wc, hc, x0, lit, cord, far) {
    return k.sky(skyName) + far + bigWall(x0, 300, wc, 1741, 22) + wallHouse(x0 + 70, 286, 250, 120, hc, lit, cord) + k.P('M-20,600 L-20,470 Q' + (x0 - 120) + ',452 ' + x0 + ',470 L900,486 L900,600 Z', k.dk(wc, 0.3)) + k.tufts(1742, 480, 590, 10, k.dk(wc, 0.5));
  }
  /* 5) 맹세(수 2:12-14): 성 밖에서 본 성벽 위의 집, 불 켜진 창. 밤 */
  function oath() { return outside('night', '#5E5A74', '#746E86', 300, true, false, k.stars(1743, 30, 240) + k.hill(1744, 400, 24, 0.7, '#283258') + k.ground(440, '#343C62')); }
  /* 6) 창에 맨 붉은 줄, 산으로 가라(수 2:15-21): 같은 밤, 성벽 위의 집 창턱에 맨 붉은 줄과 그 뒤의 산 */
  function cord() { return outside('night', '#6A6480', '#807A92', 430, false, true, k.stars(1751, 26, 200) + k.mount(190, 450, 520, 210, '#2C3460') + k.mount(380, 450, 300, 120, '#343E6A') + k.ground(440, '#3A4268')); }
  /* 7) 산에서 사흘, 강을 건너 돌아감(수 2:22-23): 아침의 산, 아래로 강과 멀리 여리고 */
  function hills() {
    return k.sky('morning') + k.cloud(620, 140, 0.9, '#FBF7EE') + k.hill(1761, 300, 26, 0.6, '#A9B6C8') + k.ground(318, '#BDB488') +
      k.P('M-20,330 C200,318 330,346 500,338 S780,320 920,332 L920,348 C760,338 640,360 480,354 S180,336 -20,350 Z', '#7FC0CC') + k.R(380, 342, 120, 3, '#D6EEE4', ' class="ea-shim" rx="1.5" opacity=".7"') +
      k.road(330, 420, 30, 470, 350, 8, '#D8C8A0', 40) + jericho(1762, 300, 404, 0.5, '#D6C09A') +
      k.hill(1763, 440, 8, 1.3, '#B49E70') + k.mount(660, 600, 700, 250, '#A8865E') + k.mount(160, 620, 520, 190, '#B4946A') + k.rock(560, 470, 130, 60, '#9A7E62') + k.rock(690, 440, 90, 44, '#A88A6A') + k.rocks(1764, 470, 585, 8, '#8E7256') + k.bush(300, 474, 0.9, '#6F8448') + k.tufts(1765, 450, 590, 12, '#7E8A4A');
  }
  SA.reg('OT-17', { beats: [approach, gateNight, roofRoad, roofSky, oath, cord, hills], arrive: 0, end: 6 });
})();

/* ── OT-20 세겜에서 언약을 다시 세움 (수 24:1-28) ──
 * 그린 것과 근거: 세겜(수 24:1. 성읍은 멀리 단순하게) · 상수리나무(24:26) · 강 저편(24:2-3. 넓은 강과 그 건너 땅만) · 오래 거한 광야(24:7)
 * · 수고하지 않은 땅, 건축하지 않은 성읍, 심지 않은 포도원과 감람원(24:13) · 상수리나무 아래 세운 큰 돌(24:26-27. 낮고 넓은 돌, 글자 없음) · 하나님의 율법책(24:26. 두루마리 하나, 글자 없음).
 * 세겜의 대목(1·5·6·7)은 성읍이 왼쪽, 상수리나무가 오른쪽으로 같은 자리다.
 * 그리지 않은 것: 사람(여호수아, 장로들, 백성), 이방 신들(24:14, 24:23), 여호와의 성소(24:26. 생김새가 본문에 없어 그리지 않았다), 애굽의 재앙과 홍해·흑암, 병거와 마병, 발람, 왕벌, 여리고의 싸움(24:5-12. 말씀으로만),
 *   돌에 새긴 글(본문은 책에 기록했다고 한다). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  /* 상수리나무(수 24:26): 굵은 줄기와 넓게 퍼진 잎 덩어리 */
  function oak(x, y, s, tr, lf) {
    var d = k.dk(lf, 0.28), l = k.lt(lf, 0.2), out = k.E(x + 30 * s, y + 3, 150 * s, 13 * s, '#16233F', k.op(0.2)), i,
      b = [[-88, -150, 62, 44], [84, -146, 66, 46], [-30, -128, 70, 40], [40, -120, 60, 36]], t = [[-70, -176, 58, 40], [0, -196, 70, 46], [66, -178, 58, 40], [-112, -150, 40, 30], [112, -148, 40, 30]], h = [[-44, -206, 40, 22], [24, -216, 38, 20], [-90, -176, 28, 16], [70, -196, 30, 16]];
    function q(a) { return a.map(function (v, j) { return k.f1(j % 2 ? y + v * s : x + v * s); }); }
    var m = q([-26, 0, -12, -50, -16, -96, -62, -140, -46, -146, -2, -112, 44, -150, 58, -140, 18, -92, 14, -40, 30, 0, 4, 0, 8, -50, 2, -100]);
    out += k.P('M' + m[0] + ',' + m[1] + ' Q' + m[2] + ',' + m[3] + ' ' + m[4] + ',' + m[5] + ' L' + m.slice(6, 18).join(' ') + ' Q' + m[18] + ',' + m[19] + ' ' + m[20] + ',' + m[21] + ' Z', tr) +
      k.P('M' + m[22] + ',' + m[23] + ' Q' + m[24] + ',' + m[25] + ' ' + m[26] + ',' + m[27] + ' L' + m[16] + ',' + m[17] + ' Q' + m[18] + ',' + m[19] + ' ' + m[20] + ',' + m[21] + ' Z', k.dk(tr, 0.35), k.op(0.55));
    for (i = 0; i < b.length; i++) out += k.E(x + b[i][0] * s, y + b[i][1] * s, b[i][2] * s, b[i][3] * s, d);
    for (i = 0; i < t.length; i++) out += k.E(x + t[i][0] * s, y + t[i][1] * s, t[i][2] * s, t[i][3] * s, lf);
    for (i = 0; i < h.length; i++) out += k.E(x + h[i][0] * s, y + h[i][1] * s, h[i][2] * s, h[i][3] * s, l, k.op(0.8));
    return out;
  }
  /* 세겜의 자리: 낮은 언덕, 멀리 성읍, 들 */
  function place(skyName, far, mid, g, tx, tc, o) {
    return k.sky(skyName) + k.hill(2001, 320, 34, 0.5, far) + k.hill(2002, 366, 18, 0.9, mid) + k.town(2003, tx, 384, 210, 5, tc, 0.7, o) + k.hill(2004, 400, 10, 1.4, k.mix(mid, g, 0.6)) + k.ground(424, g);
  }
  /* 1) 모든 지파를 세겜에 모음(수 24:1): 아침의 세겜 들과 상수리나무, 멀리 성읍 */
  function shechem() {
    return place('morning', '#A9B8C4', '#A8B48A', '#B4B26E', 250, '#DCC49A') + k.cloud(300, 150, 0.9, '#FBF7EE') + k.road(330, 600, 230, 270, 400, 16, '#DCCB9C', 80, '#B09A62') + oak(620, 470, 0.95, '#6B4A2E', '#5E7A40') +
      k.rocks(2005, 470, 585, 5, '#A0947A', 110, 420) + k.tufts(2006, 440, 590, 14, '#7A8A46');
  }
  /* 2) 조상들이 살던 강 저편(수 24:2-3): 동틀 녘의 넓은 강과 그 건너의 땅 */
  function river() {
    return k.sky('dawn') + k.glow(450, 300, 220, '#FFE9B8', 0.55) + k.hill(2011, 286, 20, 0.5, '#8E8AA8') + k.hill(2012, 306, 8, 1.2, '#A8929A') + k.water(312, '#8AA6BE', '#F6DDB8', 2013) + k.R(0, 312, 900, 12, '#F2C8A0', k.op(0.45)) +
      k.hill(2014, 446, 10, 0.8, '#A8906A') + k.ground(462, '#B49A70') + k.tufts(2015, 440, 470, 18, '#6E7A4E') + k.tufts(2016, 470, 590, 12, '#7A8450') + k.rocks(2017, 470, 585, 6, '#9A8468');
  }
  /* 3) 광야에 오래 거함(수 24:7): 마른 광야의 모래 언덕과 바위 */
  function desert() {
    return k.sky('dry') + k.sun(640, 170, 30, '#FFF6D8', '#F4E3B8') + k.hill(2021, 320, 40, 0.5, '#C4B49C') + k.hill(2022, 370, 26, 0.8, '#D4B888') + k.hill(2023, 414, 20, 1.1, '#DCC08A') + k.hill(2024, 452, 12, 1.5, '#E0C690') +
      k.rock(250, 440, 160, 70, '#B89A78') + k.rock(360, 456, 90, 38, '#A88A6A') + k.rocks(2025, 470, 585, 8, '#B49672') + k.tufts(2026, 440, 590, 7, '#A89A62');
  }
  /* 포도원의 줄(수 24:13) */
  function vines(seed, x0, x1, y0, rows) {
    var r = k.rng(seed), out = '', i, x;
    for (i = 0; i < rows; i++) { var y = y0 + i * (13 + i * 3), s = 0.6 + i * 0.22; for (x = x0 - i * 14; x < x1 + i * 10; x += 20 * s) out += k.R(x, y - 9 * s, 2.5 * s, 9 * s, '#7A5A3A') + k.E(x + 1, y - 12 * s, 10 * s, 6.5 * s, r() > 0.4 ? '#5E8444' : '#739A50'); }
    return out;
  }
  /* 4) 수고하지 않은 땅, 건축하지 않은 성읍, 심지 않은 포도원과 감람원(수 24:13) */
  function land() {
    var out = k.sky('day') + k.cloud(640, 150, 1, '#FBF7EE') + k.hill(2031, 300, 30, 0.6, '#A4B8BC') + k.mount(300, 420, 560, 120, '#B0B480') + k.town(2032, 300, 322, 230, 6, '#E0C89C', 0.8) + k.wall(190, 334, 220, 16, '#CDB486', 2033) +
      k.hill(2034, 380, 14, 1.0, '#A8B46A') + k.ground(404, '#B0B060') + vines(2035, 110, 440, 404, 5), i, r = k.rng(2036);
    for (i = 0; i < 7; i++) out += k.tree(k.f1(520 + (i % 4) * 78 + r() * 20), 404 + Math.floor(i / 4) * 52 + (i % 2) * 14, 0.7 + Math.floor(i / 4) * 0.35, '#6B5A44', '#7E9272', '#A2B292');
    return out + k.tufts(2037, 500, 590, 10, '#7A8A46');
  }
  /* 5) 섬길 이를 오늘 택하라(수 24:14-15): 한낮, 가까이 본 상수리나무와 세겜 들 */
  function choose() {
    return place('noon', '#B4C0C4', '#B0B88C', '#BDB670', 250, '#E2CCA2') + k.sun(330, 150, 28, '#FFF6D8', '#FFE9A8') + oak(620, 500, 1.35, '#6B4A2E', '#5A7A3E') + k.rocks(2041, 460, 580, 5, '#A0947A', 110, 400) + k.tufts(2042, 440, 590, 14, '#7E8C48');
  }
  /* 6) 우리가 여호와를 섬기겠나이다(수 24:16-24): 볕이 기운 때, 상수리나무 그늘에서 내다본 세겜 */
  function answer() {
    var lf = '#4E6A3A', out = place('gold', '#9C8E9A', '#B09A70', '#B89C5C', 250, '#E0BE8E') + k.sun(500, 296, 24, '#FFF1C8', '#FBD98A') + k.road(330, 600, 260, 270, 404, 18, '#DCC08A', 80, '#A8844E') + k.tufts(2051, 440, 590, 14, '#7A7A40'), i, r = k.rng(2052);
    out += k.P('M700,600 Q676,420 706,270 L810,220 L800,600 Z', '#5A3E28') + k.P('M706,270 Q560,230 440,180 L450,162 Q600,196 760,226 Z', '#5A3E28');
    for (i = 0; i < 16; i++) out += k.E(60 + i * 56 + r() * 20, 100 + r() * 70 + (i > 10 ? 30 : 0), 70 + r() * 30, 42 + r() * 16, i % 3 ? lf : k.dk(lf, 0.2));
    for (i = 0; i < 8; i++) out += k.E(90 + i * 110 + r() * 30, 184 + r() * 26, 44, 20, k.lt(lf, 0.14));
    return out;
  }
  /* 7) 율법책에 기록하고 큰 돌을 상수리나무 아래 세움(수 24:25-27): 해 진 뒤, 나무 아래 세운 낮고 넓은 큰 돌과 그 발치의 두루마리. 돌에 글자 없음 */
  function stone() {
    var c = '#A89C90', s = ' L504,386 L540,408 L552,446 L558,486 Z';
    return place('afterglow', '#5E5278', '#6E6470', '#7E7052', 250, '#B49A7E', { lit: true, haze: '#7A6A8A' }) + oak(620, 474, 1.15, '#4E3626', '#4A5E3A') + k.E(520, 489, 84, 10, '#16233F', k.op(0.22)) +
      k.P('M444,486 L448,430 L470,396' + s, c) + k.P('M510,486' + s, k.dk(c, 0.35), k.op(0.5)) + k.scroll(392, 488, 1.1, false) + k.rocks(2061, 480, 585, 5, '#7A6A5E', 110, 800) + k.tufts(2062, 496, 590, 12, '#5E6238');
  }
  SA.reg('OT-20', { beats: [shechem, river, desert, land, choose, answer, stone], arrive: 0, end: 6 });
})();

/* ── OT-22 삼손 (삿 16:4-31) ──
 * 그린 것과 근거: 소렉 골짜기(삿 16:4)와 그곳의 집(16:9, 16:12 방 안. 생김새는 본문에 없어 흙벽돌 집 한 채) · 마르지 않은 푸른 칡 일곱(16:7-8) · 쓰지 않은 새 줄(16:11-12) · 베틀과 바디(16:13-14)
 * · 방백들이 올라온 길(16:5, 16:18) · 가사(16:21. 옥의 생김새는 본문에 없어 벽과 작은 창만)와 옥 안의 맷돌(16:21. 물건만) · 집을 버틴 가운데 두 기둥(16:26, 16:29. 기둥만) · 소라와 에스다올 사이의 들(16:31).
 * 그리지 않은 것: 사람(삼손, 들릴라, 방백들, 소년, 모인 사람들), 머리털과 삭도, 은, 놋줄, 눈을 뺀 일, 맷돌 돌리는 모습, 다곤의 신상과 제사(16:23), 집이 무너지는 순간과 죽음(16:30),
 *   마노아의 무덤(16:31. 들과 언덕만), 하나님의 형상이나 삼손에게 내리는 빛(본문에 없음. 옥의 창에도 빛줄기를 두지 않음),
 *   집의 층계와 나무, 밤·달·별(삿 16:4-20에 집의 생김새도 때도 없음). 골짜기의 집은 대목 1·3·4에서 같은 자리다. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  /* 소렉 골짜기(삿 16:4): 양쪽 비탈 사이의 골짜기 들과 집 한 채. s는 집의 크기 */
  function vale(skyName, far, a, b, g, hx, hy, s, hc) {
    return k.sky(skyName) + k.hill(2201, 300, 30, 0.6, far) + k.P('M-20,600 L-20,220 Q180,250 330,360 Q420,420 470,470 L-20,520 Z', a) + k.P('M-20,600 L-20,330 Q140,350 250,420 L330,480 L-20,520 Z', k.dk(a, 0.14), k.op(0.6)) +
      k.P('M920,600 L920,200 Q740,240 600,350 Q520,410 470,470 L920,520 Z', b) + k.P('M920,600 L920,320 Q780,350 690,420 L620,490 L920,520 Z', k.lt(b, 0.14), k.op(0.6)) +
      k.hill(2202, 452, 8, 1.2, g) + k.ground(470, g) + k.house(hx, hy, 150 * s, 92 * s, hc, { doorAt: 0.3 });
  }
  /* 1) 소렉 골짜기(삿 16:4-5): 아침의 골짜기와 집, 올라오는 길 */
  function sorek() {
    return vale('morning', '#A9B8C4', '#A8AE7C', '#B4AA78', '#BDB272', 410, 452, 0.62, '#DCC49A') + k.cloud(300, 150, 0.9, '#FBF7EE') + k.road(330, 600, 220, 440, 452, 14, '#DECBA0', 70, '#B09A62') +
      k.bush(230, 440, 0.9, '#7A8C50') + k.bush(700, 420, 0.8, '#7A8C50') + k.rocks(2203, 480, 585, 5, '#A0947A', 520, 860) + k.tufts(2204, 460, 590, 12, '#7A8A46');
  }
  /* 베틀(삿 16:13-14): 선 틀, 날실, 짜던 위선, 바디. 머리털은 그리지 않는다 */
  function loom(x, y, w, h) {
    var c = '#8A5E36', out = k.E(x + w / 2, y + 3, w * 0.62, 8, '#16233F', k.op(0.2)), i;
    for (i = 0; i <= 16; i++) out += k.R(x + 12 + i * (w - 26) / 16, y - h + 10, 1.6, h - 34, '#E6D8B8');
    out += k.R(x + 10, y - h + 10, w - 20, h * 0.36, '#D8C29A') + k.R(x + 10, y - h + 10 + h * 0.3, w - 20, h * 0.06, '#B89A6A') + k.R(x - 6, y - h * 0.5, w + 12, 7, '#A87A48', ' rx="3"') + k.R(x + 6, y - 28, w - 12, 8, k.dk(c, 0.2), ' rx="3"');
    return out + k.R(x, y - h, 11, h, c, ' rx="3"') + k.R(x + w - 11, y - h, 11, h, k.dk(c, 0.2), ' rx="3"') + k.R(x - 10, y - h - 4, w + 20, 13, k.lt(c, 0.12), ' rx="4"');
  }
  /* 2) 푸른 칡 일곱, 새 줄, 베틀(삿 16:7-14): 방 안에 놓인 물건들. 칡은 곧게 나란히 묶은 다발, 새 줄은 사리 */
  function things() {
    var out = k.room('#C9AE84', '#A8845A', 400, { win: [600, 130, 120, 150], sky: '#CDEBE4' }) + loom(170, 430, 190, 270), i;
    for (i = 0; i < 7; i++) out += '<path d="M420,' + (444 + i * 6) + ' q85,-5 170,0" stroke="' + (i % 2 ? '#6F9A48' : '#86AE58') + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
    out += k.R(444, 438, 9, 46, '#4E7A38', ' rx="4"') + k.E(680, 474, 62, 16, '#16233F', k.op(0.2));
    for (i = 0; i < 4; i++) out += '<ellipse cx="680" cy="' + (466 - i * 9) + '" rx="' + (54 - i * 3) + '" ry="' + (17 - i) + '" fill="none" stroke="' + (i % 2 ? '#C9A468' : '#DEBE84') + '" stroke-width="9"/>';
    return out;
  }
  /* 3) 날마다 재촉함(삿 16:15-17): 볕이 기운 골짜기, 같은 자리의 그 집을 가까이 봄 */
  function press() {
    return vale('gold', '#9C8E9A', '#A8905E', '#B4985E', '#BC9C5A', 344, 474, 1.5, '#D8B484') + k.sun(680, 250, 24, '#FFF1C8', '#FBD98A') + k.road(330, 600, 300, 430, 474, 44, '#DCC08A', 50, '#A8844E') + k.rocks(2212, 480, 585, 5, '#A08A62', 560, 860) + k.tufts(2211, 480, 590, 12, '#7A7A40');
  }
  /* 4) 방백들이 올라옴(삿 16:18-20): 본문에 때가 없어 구름 낀 흐린 날의 같은 골짜기, 같은 집과 올라오는 길 */
  function night() {
    return vale('grey', '#8E98A4', '#8A8E78', '#94907A', '#9C9478', 410, 452, 0.62, '#B4A68E') + k.cloud(260, 170, 1.5, '#C4CAD0') + k.cloud(620, 130, 1.8, '#B8C0C8') + k.cloud(760, 220, 1.1, '#CCD0D4') + k.road(330, 600, 220, 440, 452, 14, '#B8AE94', 70, '#8E866E') +
      k.bush(230, 440, 0.9, '#6A745A') + k.bush(700, 420, 0.8, '#6A745A') + k.rocks(2203, 480, 585, 5, '#8A8478', 520, 860) + k.tufts(2204, 460, 590, 12, '#666C50');
  }
  /* 5) 가사의 옥(삿 16:21-22): 어두운 방, 높고 작은 창(빛줄기 없음), 놓인 맷돌. 사람은 그리지 않는다 */
  function prison() {
    var x = 470, y = 432, c = '#8A8480';
    return k.room('#5E5650', '#4A4038', 400, { win: [610, 150, 70, 60], sky: '#B8D0D8', beam: false }) + k.R(0, 0, 900, 600, '#16233F', k.op(0.25)) + k.E(x, y + 8, 110, 16, '#16233F', k.op(0.3)) +
      k.R(x - 90, y - 26, 180, 30, k.dk(c, 0.2)) + k.E(x, y + 4, 90, 16, k.dk(c, 0.2)) + k.E(x, y - 26, 90, 16, c) + k.R(x - 70, y - 60, 140, 32, k.lt(c, 0.1)) + k.E(x, y - 28, 70, 12, k.lt(c, 0.1)) + k.R(x + 30, y - 60, 40, 34, k.dk(c, 0.3), k.op(0.4)) + k.E(x, y - 60, 70, 12, k.lt(c, 0.3)) +
      k.E(x, y - 60, 12, 3.5, '#3A342E') + k.R(x + 44, y - 92, 8, 34, '#7A5232', ' rx="3"');
  }
  /* 6) 집을 버틴 가운데 두 기둥(삿 16:25-27, 16:29): 큰 집 안, 들보를 받친 두 기둥. 신상과 사람은 그리지 않는다 */
  function pillars() {
    var w = '#CDB48C', out = k.sky('noon') + k.hill(2231, 360, 16, 0.8, '#B8BEA8') + k.R(0, 372, 900, 228, k.lg(['#D8C4A0', '#B89A6E'])) + k.R(0, 0, 200, 430, w) + k.R(700, 0, 200, 430, k.dk(w, 0.14)) + k.R(200, 300, 500, 76, k.lt(w, 0.1)) + k.R(200, 296, 500, 8, k.lt(w, 0.3)), i;
    for (i = 0; i < 6; i++) out += k.R(60 + i * 150, 128, 34, 26, '#8A5E36');
    return out + k.R(0, 96, 900, 40, '#9A6E44') + k.R(0, 128, 900, 9, '#6B4A2E', k.op(0.5)) + k.R(0, 0, 900, 98, '#7A5636') + k.E(350, 478, 70, 10, '#16233F', k.op(0.2)) + k.E(570, 478, 70, 10, '#16233F', k.op(0.2)) +
      k.column(350, 478, 62, 318, '#D6C6AC') + k.column(570, 478, 62, 318, '#D6C6AC');
  }
  /* 7) 소라와 에스다올 사이(삿 16:31): 저녁의 고요한 들과 언덕, 멀리 두 성읍. 무덤은 그리지 않는다 */
  function rest() {
    return k.sky('afterglow') + k.stars(2241, 18, 170) + k.hill(2242, 310, 30, 0.5, '#5A527C') + k.mount(210, 400, 420, 90, '#6E6080') + k.town(2243, 200, 326, 120, 4, '#B89A8A', 0.5, { lit: true, haze: '#7A6A90' }) +
      k.mount(700, 400, 440, 80, '#75658A') + k.town(2244, 690, 334, 110, 4, '#B89A8A', 0.45, { lit: true, haze: '#7A6A90' }) + k.hill(2245, 392, 12, 1.0, '#6E6672') + k.ground(416, '#786E66') + k.hill(2246, 450, 8, 1.6, '#80745E') +
      k.hill(2249, 500, 10, 2.2, '#867A60') + k.bush(470, 440, 0.7, '#4E5A4C') + k.rocks(2247, 470, 585, 6, '#6E6670') + k.tufts(2248, 440, 590, 14, '#525C46');
  }
  SA.reg('OT-22', { beats: [sorek, things, press, night, prison, pillars, rest], arrive: 0, end: 6 });
})();

/* ── OT-23 룻과 나오미 (룻 1~2장, 4:13-17) ──
 * 그린 것과 근거: 흉년 든 땅(룻 1:1) · 모압 지방에서 유다 땅으로 돌아가는 길(1:7) · 베들레헴 성읍(1:19, 2:18)과 성문(4:1) · 보리 추수를 시작할 때의 밭(1:22, 2:3)
 * · 곡식 단과 떨어뜨린 이삭(2:7, 2:15-16) · 물 그릇(2:9) · 볶은 곡식(2:14) · 떨어 낸 보리 한 에바쯤(2:17) · 성읍의 집(2:18, 4:13-17은 장소를 더 말하지 않아 성읍만).
 * 그리지 않은 것: 사람(나오미, 룻, 보아스, 베는 사람들, 아기), 무덤, 본문에 없는 짐승. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  function bethFar(x, y, s, lit) { return k.hill(231, y + 6, 10, 1.2, '#B9A27A') + k.town(232, x, y, 190 * s, 5, '#D9B98A', s * 0.8, { lit: lit }); }
  /* 1) 흉년 든 베들레헴 땅을 떠나는 길(룻 1:1): 마른 밭, 흐린 볕, 멀리 성읍 */
  function famine() {
    return k.sky('dry') + k.sun(660, 150, 30, '#FFF6D8', '#F4E3B8') + k.hill(233, 330, 26, 0.8, '#C9B894') + bethFar(300, 352, 1) +
      k.hill(234, 390, 16, 1.4, '#C8A870') + k.ground(430, '#C29A62') + k.road(520, 600, 240, 420, 372, 22, '#D8BE92', 60, '#B08A58') +
      k.stubble(235, 440, 590, 46, '#9A7A4A') + k.rocks(236, 470, 580, 5, '#A88A64', 100, 380) + k.tufts(237, 450, 560, 7, '#A08A50', 600, 820);
  }
  /* 2) 모압 지방에서 유다 땅으로 돌아가는 길(룻 1:6-7): 고원의 들과 먼 산줄기, 길 하나 */
  function roadHome() {
    return k.sky('morning') + k.cloud(250, 150, 0.9, '#FBF7EE') + k.cloud(650, 190, 0.7, '#FBF7EE') + k.hill(241, 320, 44, 0.6, '#A9B4C8') + k.hill(242, 370, 26, 1.1, '#B8AE8A') +
      k.hill(243, 420, 16, 1.6, '#C9B078') + k.ground(455, '#C8A468') + k.road(330, 600, 260, 560, 392, 16, '#E4CFA0', -90, '#B89260') +
      k.bush(170, 480, 1.1, '#7E8C54') + k.bush(700, 452, 0.8, '#7E8C54') + k.rocks(244, 480, 585, 5, '#A88A64', 560, 860) + k.tufts(245, 462, 580, 12, '#8E9A56');
  }
  /* 3) 베들레헴에 이름, 보리 추수를 시작할 때(룻 1:19, 1:22): 성문과 성읍, 누렇게 익은 밭 */
  function bethGate() {
    return k.sky('day') + k.cloud(240, 140, 1, '#FBF7EE') + k.hill(251, 330, 30, 0.9, '#A8B890') + k.town(252, 470, 372, 420, 7, '#DDBE8E', 1.15) +
      k.wall(210, 392, 520, 34, '#CFAE7C', 253) + k.gate(470, 392, 110, 62, '#D6B684') + k.ground(392, '#D9B45E') +
      k.road(470, 600, 300, 470, 392, 34, '#E6D2A6', 0, '#B89260') + k.field(254, 410, 600, '#B8902E', '#E2B93E', 0, 330) + k.field(255, 410, 600, '#B8902E', '#E2B93E', 610, 900);
  }
  /* 4) 보아스의 밭(룻 2:3, 2:7): 베는 밭, 곡식 단, 멀리 성읍 */
  function barley() {
    return k.sky('noon') + k.sun(700, 130, 30, '#FFF6D8', '#FFE9A8') + k.hill(261, 330, 24, 1, '#A8B890') + bethFar(240, 348, 0.8) + k.hill(262, 380, 12, 1.5, '#D2B050') +
      k.ground(400, '#D6B25A') + k.field(263, 400, 520, '#B8902E', '#E6BE44', 0, 520) + k.R(520, 400, 380, 200, '#C9A860') + k.stubble(264, 410, 590, 60, '#A8843A', 520, 900) +
      k.sheaf(610, 470, 1.0, '#D9B044') + k.sheaf(700, 452, 0.85, '#D9B044') + k.sheaf(770, 500, 1.15, '#D9B044') + k.field(265, 520, 600, '#B8902E', '#E6BE44', 0, 470);
  }
  /* 5) 밭에서의 끼니와 떨어뜨려 둔 이삭(룻 2:9, 2:14-16): 물 그릇, 볶은 곡식, 곡식 단 사이의 이삭 */
  function meal() {
    var ears = '', r = k.rng(271), i;
    for (i = 0; i < 14; i++) { var x = 150 + r() * 380, y = 450 + r() * 60; ears += '<path d="M' + k.f1(x) + ',' + k.f1(y) + ' l16,-5" stroke="#B8902E" stroke-width="2.4" stroke-linecap="round"/>' + k.E(x + 19, y - 6, 6, 2.6, '#E6BE44', ' transform="rotate(-17 ' + k.f1(x + 19) + ' ' + k.f1(y - 6) + ')"'); }
    return k.sky('noon') + k.cloud(300, 150, 0.8, '#FBF7EE') + k.hill(272, 320, 22, 1, '#A8B890') + k.field(273, 345, 395, '#B8902E', '#E6BE44') + k.ground(392, '#CDAE66') +
      k.stubble(274, 400, 590, 70, '#A8843A') + k.sheaf(190, 440, 1.2, '#D9B044') + k.sheaf(300, 420, 0.95, '#D9B044') + k.sheaf(520, 430, 1.05, '#D9B044') + ears +
      k.jar(650, 470, 1.5, '#B07A48') + k.jar(716, 484, 1.2, '#C08A56') + k.basket(596, 488, 0.9, '#B89260', '#E2C06A');
  }
  /* 6) 저녁, 떨어 낸 보리를 가지고 성읍으로(룻 2:17-18): 보리 한 에바쯤, 저녁빛의 성읍 */
  function evening() {
    return k.sky('evening') + k.sun(190, 330, 30, '#FFE0A0', '#EA6A2A') + k.hill(281, 330, 26, 0.9, '#6B5A7A') + k.town(282, 560, 372, 360, 7, '#C89A6A', 1.1, { lit: true, haze: '#8A6A8A' }) +
      k.wall(360, 390, 420, 30, '#B88A5E', 283) + k.gate(560, 390, 96, 56, '#C0926A') + k.ground(390, '#A8824E') + k.road(430, 600, 280, 560, 390, 30, '#C9A878', 40, '#8A6A44') +
      k.stubble(284, 410, 590, 30, '#7A6034', 0, 300) + k.R(212, 462, 100, 9, '#E8DCC4', ' rx="4"') + k.heap(262, 464, 62, 24, '#E0B84A') + k.tufts(285, 430, 580, 6, '#7A6A3A', 640, 860);
  }
  /* 7) 베들레헴 성읍의 집(룻 4:13-17, 장소는 성읍이라는 것까지만): 아침의 골목과 집 */
  function homeTown() {
    return k.sky('morning') + k.cloud(620, 150, 0.9, '#FBF7EE') + k.hill(291, 330, 20, 1, '#A8B890') + k.town(292, 450, 380, 620, 8, '#DDBE8E', 1.2) + k.ground(380, '#D6BC8E') +
      k.house(150, 500, 250, 160, '#E2C596', { doorAt: 0.42 }) + k.house(520, 484, 230, 130, '#D4B282', { doorAt: 0.2, stairs: true }) +
      k.road(450, 600, 200, 450, 400, 60, '#E6D6B4', 0);
  }
  SA.reg('OT-23', { beats: [famine, roadHome, bethGate, barley, meal, evening, homeTown], arrive: 0, end: 6 });
})();

/* ── OT-24 한나의 기도와 사무엘을 부르심 (삼상 1:9-28, 3:1-21) ──
 * 그린 것과 근거: 실로 여호와의 전 문설주와 그 곁의 의자(삼상 1:9. 전의 생김새는 본문에 없어 흙벽과 문 하나로) · 돌아가는 길(1:18)
 * · 라마의 집(1:19) · 가루 한 에바와 포도주 한 가죽부대(1:24) · 여호와의 전 안, 아직 꺼지지 않은 하나님의 등불과 사무엘이 누운 자리(3:3, 3:9. 등불은 벽의 턱 위에)
 * · 아침에 연 여호와의 집 문(3:15) · 실로(3:21)와 온 이스라엘 땅(3:20).
 * 그리지 않은 것: 사람(한나, 엘리, 사무엘), 하나님의 형상·빛줄기·음성(3:4-10), 하나님의 궤(3:3)와 휘장(이 본문에 없음), 수소(1:24-25), 엘리의 처소(3:2), 등대의 모양(본문에 없어 벽의 턱으로만). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, n = k.f1, WL = '#D9BE92', PW = '#8A5E36', SH = '#16233F';
  /* 여호와의 전 앞면(삼상 1:9): 벽, 문, 두 문설주. x 문 가운데, y 밑선 */
  function front(x, y, s, c, dc) {
    var d = k.dk(c, 0.28), r = k.rng(2401), i, o = k.R(x - 270 * s, y - 300 * s, 540 * s, 300 * s, c) + k.R(x + 170 * s, y - 300 * s, 100 * s, 300 * s, d, k.op(0.3)) + k.R(x - 278 * s, y - 312 * s, 556 * s, 16 * s, k.lt(c, 0.2), ' rx="3"');
    for (i = 0; i < 18; i++) o += k.R(x - 262 * s + r() * 500 * s, y - 284 * s + r() * 266 * s, 34 * s, 8 * s, d, ' rx="2" opacity=".15"');
    return o + k.R(x - 55 * s, y - 205 * s, 110 * s, 205 * s, dc) + k.R(x - 73 * s, y - 205 * s, 18 * s, 205 * s, PW) + k.R(x + 55 * s, y - 205 * s, 18 * s, 205 * s, k.dk(PW, 0.22)) + k.R(x - 84 * s, y - 224 * s, 168 * s, 20 * s, k.lt(PW, 0.12), ' rx="2"');
  }
  /* 문설주 곁의 의자(삼상 1:9): 낮고 넓은 나무 걸상 */
  function seat(x, y) {
    var c = '#A87A48', d = k.dk(c, 0.35);
    return k.E(x, y + 2, 50, 7, SH, k.op(0.2)) + k.R(x - 36, y - 64, 7, 30, d) + k.R(x + 29, y - 64, 7, 30, d) + k.R(x - 40, y - 68, 80, 9, c, ' rx="2"') +
      k.R(x - 38, y - 30, 9, 30, d) + k.R(x + 29, y - 30, 9, 30, d) + k.R(x - 44, y - 40, 88, 12, k.lt(c, 0.12), ' rx="2"') + k.R(x - 44, y - 31, 88, 3, d, k.op(0.5));
  }
  function far(a, b) { return k.hill(2402, 318, 34, 0.7, a) + k.hill(2403, 372, 20, 1.2, b); }
  /* 1) 실로 여호와의 전 문설주와 그 곁의 의자(삼상 1:9) */
  function doorSeat() {
    return k.sky('day') + k.cloud(720, 150, 0.8, '#FBF7EE') + far('#A9B8B4', '#B4B48A') + k.ground(412, '#CDB078') + front(330, 452, 1, WL, '#5A4634') +
      k.R(0, 452, 900, 148, '#C9A870') + k.R(60, 452, 540, 8, SH, k.op(0.12)) + seat(480, 474) + k.rocks(2404, 470, 560, 4, '#A88A64', 640, 860) + k.tufts(2405, 440, 580, 9, '#8A8A4A', 620, 880);
  }
  /* 2) 평안히 가라는 말을 듣고 가는 길(삼상 1:17-18): 같은 문설주와 의자를 한쪽에, 떠나는 길 */
  function wayOut() {
    return k.sky('noon') + k.cloud(640, 150, 0.8, '#FBF7EE') + far('#A9B8B4', '#B4B48A') + k.ground(412, '#CDB078') + k.hill(2406, 436, 8, 1.8, '#D2B680') +
      k.road(560, 600, 250, 660, 396, 14, '#E6D2A6', -70, '#B89260') + front(65, 452, 1, WL, '#5A4634') + k.R(0, 452, 340, 9, SH, k.op(0.14)) + seat(236, 474) +
      k.rocks(2407, 470, 570, 4, '#A88A64', 660, 860) + k.tufts(2408, 440, 580, 9, '#8A8A4A', 360, 880);
  }
  function sh(x, y, s, t, c, ex) { return k.P(t.replace(/(-?[\d.]+),(-?[\d.]+)/g, function (m, a, b) { return n(x + a * s) + ',' + n(y + b * s); }), c, ex); }
  /* 가루 한 에바 자루와 포도주 한 가죽부대(삼상 1:24). 한 사람이 들 만하게 */
  function sack(x, y) {
    return k.E(x, y + 2, 40, 6, SH, k.op(0.2)) + sh(x, y, 1, 'M-34,0 Q-42,-32 -12,-44 L-20,-58 L10,-54 L4,-43 Q40,-28 32,0 Z', '#E2D4B0') + sh(x, y, 1, 'M6,0 Q16,-26 4,-43 Q40,-28 32,0 Z', '#B8A47C', k.op(0.6)) + k.R(x - 15, y - 48, 21, 5, '#8A6A44', ' rx="2"');
  }
  function skin(x, y) {
    return k.E(x, y + 2, 34, 5, SH, k.op(0.2)) + sh(x, y, 1, 'M-28,0 Q-36,-26 -6,-36 L10,-52 L22,-46 L14,-32 Q34,-16 26,0 Z', '#7A5234') + sh(x, y, 1, 'M6,0 Q16,-18 14,-32 Q34,-16 26,0 Z', '#4E3422', k.op(0.6)) + sh(x, y, 1, 'M2,-40 L8,-46 L22,-36 L16,-30 Z', '#D8C8A4');
  }
  /* 3) 라마의 집(삼상 1:19), 실로로 가져간 가루와 포도주(1:24) */
  function ramah() {
    return k.sky('morning') + k.cloud(640, 150, 0.9, '#FBF7EE') + k.hill(2411, 322, 36, 0.6, '#A9B8C0') + k.town(2412, 590, 372, 300, 5, '#D9BC8E', 0.9) + k.hill(2413, 398, 14, 1.3, '#B8B078') + k.ground(425, '#C9B078') +
      k.road(640, 600, 230, 760, 398, 14, '#E6D2A6', -50, '#B89260') + k.house(140, 470, 260, 160, '#E0C296', { doorAt: 0.5 }) + sack(480, 474) + skin(574, 480) +
      k.rocks(2414, 490, 580, 4, '#A88A64', 100, 420) + k.tufts(2415, 445, 580, 10, '#8E9A56', 420, 880);
  }
  /* 사무엘이 누운 자리(삼상 3:3, 3:9): 빈 깔개, 한쪽 끝에 낮게 접힌 덮개 */
  function mat(x, y, s) {
    return sh(x, y, s, 'M-120,4 Q-124,-4 -112,-12 L-88,-36 Q-84,-40 -74,-40 L112,-40 Q122,-40 119,-32 L106,-2 Q104,4 96,4 Z', '#7E7068') + sh(x, y, s, 'M-120,4 Q-122,-2 -116,-6 L104,-6 Q104,4 96,4 Z', '#5A5058') +
      sh(x, y, s, 'M56,-8 Q50,-12 56,-22 L64,-36 Q68,-44 80,-43 L108,-42 Q120,-40 116,-30 L108,-12 Q106,-7 98,-7 Z', '#93847A');
  }
  /* 밤의 전 안(삼상 3:3): 어두운 흙벽과 바닥 */
  function inside(fy) {
    var o = k.room('#3C3A5E', '#4A4460', fy), r = k.rng(2421), i;
    for (i = 0; i < 14; i++) o += k.R(r() * 860, 40 + r() * (fy - 90), 44, 9, SH, ' rx="2" opacity=".18"');
    return o;
  }
  /* 4) 밤, 여호와의 전 안(삼상 3:3): 아직 꺼지지 않은 하나님의 등불을 가운데에. 궤는 그리지 않는다 */
  function lampNight() {
    return inside(420) + k.glow(470, 262, 270, '#F7B733', 0.32) + k.R(330, 300, 240, 16, '#6A5E6E', ' rx="2"') + k.R(330, 312, 240, 6, SH, k.op(0.3)) + k.lamp(440, 300, 2.3);
  }
  /* 5) 가서 자기 자리에 누움(삼상 3:9): 같은 밤, 누운 자리. 등불은 화면 밖의 빛으로만. 음성은 그리지 않는다 */
  function bedNight() { return inside(330) + k.glow(40, 230, 330, '#F7B733', 0.26) + k.E(470, 442, 250, 20, SH, k.op(0.3)) + mat(470, 440, 1.7); }
  /* 6) 아침, 사무엘이 연 여호와의 집 문(삼상 3:15): 안에서 내다본 열린 문과 아침 하늘 */
  function openDoor() {
    var o = k.R(0, 0, 900, 600, k.lg(['#4A4058', '#6A5A62'])) + k.R(330, 120, 240, 322, k.lg(['#7FA8D0', '#F2C8A0', '#FBE3B0'])) + k.glow(450, 372, 120, '#FFF1C8', 0.8) +
      k.P('M330,380 Q400,350 470,372 T570,366 L570,442 L330,442 Z', '#A8A0A8') + k.P('M330,410 Q450,392 570,408 L570,442 L330,442 Z', '#C2A878');
    o += k.P('M330,120 L244,96 L244,480 L330,442 Z', '#7A5232') + k.P('M570,120 L656,96 L656,480 L570,442 Z', '#8A5E36') + k.R(312, 104, 276, 18, '#5E4028', ' rx="2"');
    o += k.P('M256,130 L318,146 L318,270 L256,268 Z M256,290 L318,290 L318,424 L256,446 Z M644,130 L582,146 L582,270 L644,268 Z M644,290 L582,290 L582,424 L644,446 Z', '#16233F', k.op(0.16));
    return o + k.R(0, 442, 900, 158, k.lg(['#7A6A66', '#5A4E56'])) + k.P('M330,442 L570,442 L690,600 L250,600 Z', '#FFF1C8', k.op(0.3));
  }
  /* 7) 실로와 온 이스라엘 땅(삼상 3:20-21): 1과 같은 평지에 멀리 여호와의 집, 넓은 땅 */
  function land() {
    return k.sky('day') + k.cloud(250, 140, 1, '#FBF7EE') + k.cloud(660, 190, 0.7, '#FBF7EE') + k.hill(2431, 300, 26, 0.5, '#B4C4CC') + far('#A9B8B4', '#B4B48A') + k.ground(384, '#C4B47C') +
      front(590, 396, 0.3, WL, '#5A4634') + k.hill(2434, 430, 12, 1.7, '#C4B470') + k.ground(455, '#C9B070') +
      k.road(300, 600, 240, 575, 396, 8, '#E6D2A6', -110, '#B89260') + k.rocks(2435, 470, 570, 5, '#A88A64', 540, 860) + k.tufts(2436, 440, 585, 14, '#8E9A56');
  }
  SA.reg('OT-24', { beats: [doorSeat, wayOut, ramah, lampNight, bedNight, openDoor, land], arrive: 0, end: 6 });
})();

/* ── OT-25 백성이 왕을 구하고 사울이 왕이 됨 (삼상 8:4-22, 10:17-25) ──
 * 그린 것과 근거: 라마(삼상 8:4. 생김새는 본문에 없어 언덕 위 성읍으로 멀리) · 밭과 곡식(8:12, 8:14-15), 포도원과 감람원(8:14) · 각기 성읍으로 돌아가는 길(8:22)
 * · 미스바(10:17. 생김새는 본문에 없어 건물 없는 높은 땅으로) · 짐 더미(10:22) · 나라의 제도를 기록한 책(10:25. 두루마리, 글자 없음) · 각기 집으로 가는 길(10:25).
 * 그리지 않은 것: 사람(사무엘, 장로들, 백성, 사울), 하나님의 형상, 병거·말·병기(8:11-12), 나귀·양 떼(8:16-17), 뽑는 방법(10:20-21), 왕관·기름 부음(이 범위에 없음),
 *   짐 사이에 숨은 사람과 큰 키(10:22-23), 짐 속의 물건(본문에 없음), 책을 둔 곳의 생김새(10:25 "여호와 앞에"라고만 하여 단이나 상 없이 그 땅의 낮은 돌 위에). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, SH = '#16233F';
  /* 라마(삼상 8:4): 언덕 위의 성읍 */
  function ramahHill(x, y, s, c, hc, o) { return k.mount(x, y + 70 * s, 620 * s, 120 * s, hc) + k.town(2501, x - 10 * s, y, 300 * s, 6, c, s, o); }
  /* 1) 장로들이 라마로 사무엘에게 나아감(삼상 8:4-5): 라마와 그리로 오르는 길 */
  function ramah() {
    return k.sky('day') + k.cloud(230, 150, 1, '#FBF7EE') + k.cloud(700, 200, 0.7, '#FBF7EE') + k.hill(2502, 340, 30, 0.7, '#A8B8B0') + ramahHill(470, 356, 1, '#DCC090', '#B4AC7C') +
      k.hill(2503, 428, 12, 1.5, '#B8B070') + k.ground(450, '#C4B06C') + k.road(330, 600, 250, 470, 372, 16, '#E6D2A6', -100, '#B89260') + k.rocks(2504, 470, 575, 5, '#A88A64', 560, 860) + k.tufts(2505, 445, 585, 13, '#8E9A56');
  }
  /* 2) 사무엘이 여호와께 기도함(삼상 8:6. 자리는 라마라는 것까지만): 라마 안의 집들과 넓은 하늘 */
  function ramahIn() {
    return k.sky('noon') + k.cloud(480, 170, 1.2, '#FBF7EE') + k.hill(2511, 330, 20, 0.9, '#B4BCA8') + k.town(2512, 450, 384, 760, 9, '#D9BC8C', 1.15) + k.ground(384, '#CDB48A') +
      k.house(110, 488, 250, 150, '#E2C596', { doorAt: 0.55 }) + k.house(560, 476, 240, 124, '#D2B080', { doorAt: 0.25 }) + k.road(450, 600, 190, 450, 398, 70, '#E6D6B4', 0);
  }
  /* 포도원(삼상 8:14): 줄지어 선 낮은 포도나무 */
  function vines(x0, x1, y0, y1) {
    var o = '', i, x, t, y, s;
    for (i = 0; i < 5; i++) { t = i / 4; y = y0 + (y1 - y0) * Math.pow(t, 1.3); s = 0.55 + t * 0.9; o += k.R(x0, y - 2 * s, x1 - x0, 5 * s, '#8A6A40', k.op(0.5)); for (x = x0 + (i % 2) * 14 * s; x < x1; x += 34 * s) o += k.E(x, y - 9 * s, 15 * s, 9 * s, i % 2 ? '#6F8448' : '#7E9450'); }
    return o;
  }
  /* 3) 왕의 제도를 일러 줌(삼상 8:10-18): 백성의 밭(8:12, 8:14)과 포도원·감람원(8:14). 병거와 말은 그리지 않는다 */
  function fields() {
    var ol = '#8FA07A', ol2 = '#A8B890';
    return k.sky('noon') + k.sun(690, 140, 28, '#FFF6D8', '#FFE9A8') + k.hill(2521, 318, 28, 0.8, '#A8B8B0') + k.hill(2522, 372, 20, 1.1, '#A8AC70') +
      k.tree(250, 372, 0.6, '#6B5A40', ol, ol2) + k.tree(330, 366, 0.7, '#6B5A40', ol, ol2) + k.tree(430, 374, 0.6, '#6B5A40', ol, ol2) + k.tree(540, 364, 0.75, '#6B5A40', ol, ol2) + k.tree(640, 372, 0.6, '#6B5A40', ol, ol2) +
      k.ground(384, '#C9A85E') + k.R(450, 384, 450, 216, '#B8945A') + k.field(2523, 392, 600, '#B8902E', '#E6BE44', 0, 440) + k.field(2524, 388, 520, '#A8842A', '#DDB23A', 0, 440) + vines(470, 900, 404, 560);
  }
  /* 4) 각기 성읍으로 돌아가라(삼상 8:22): 라마에서 갈라져 나가는 두 길과 먼 성읍 */
  function goHome() {
    return k.sky('day') + k.cloud(560, 160, 0.9, '#FBF7EE') + k.hill(2531, 338, 30, 0.7, '#A8B8B0') + ramahHill(250, 352, 0.8, '#DCC090', '#B4AC7C') + k.town(2532, 720, 366, 110, 3, '#CDBC9C', 0.5) +
      k.hill(2533, 400, 14, 1.3, '#B8B070') + k.ground(428, '#C4B06C') + k.road(470, 600, 230, 300, 394, 14, '#E6D2A6', 60, '#B89260') + k.road(560, 600, 150, 730, 390, 10, '#E6D2A6', -30) +
      k.rocks(2534, 470, 575, 5, '#A88A64', 110, 330) + k.tufts(2535, 440, 585, 12, '#8E9A56');
  }
  function top(sky, a, b, g) { return k.sky(sky) + k.hill(2541, 352, 22, 0.6, a) + k.hill(2542, 384, 14, 1.0, b) + k.ground(404, g) + k.hill(2543, 420, 7, 2.1, k.lt(g, 0.08)); }
  /* 5) 백성을 미스바로 불러 모음(삼상 10:17): 멀리서 본 미스바, 건물 없는 높은 땅과 오르는 길, 아침 */
  function mizpah() {
    return k.sky('morning') + k.sun(190, 250, 24, '#FFF6D8', '#FBEFD0') + k.hill(2544, 350, 26, 0.6, '#A9B8C4') + k.mount(480, 452, 760, 170, '#B8AC80') + k.hill(2545, 440, 12, 1.4, '#B4B070') + k.ground(462, '#BFB06C') +
      k.road(260, 600, 220, 470, 300, 10, '#E2D0A4', -150, '#B89260') + k.rocks(2546, 292, 318, 5, '#A89878', 380, 600) + k.rocks(2547, 475, 575, 5, '#A88A64', 520, 860) + k.tufts(2548, 450, 585, 12, '#8E9A56');
  }
  /* 묶은 짐 하나: 윗면이 평평한 네모 꾸러미, 끈은 아래쪽에 십자로. w 너비, h 높이 */
  function bale(x, y, w, h, c) {
    var d = k.dk(c, 0.35);
    return k.R(x - w / 2, y - h, w, h, c, ' rx="5"') + k.R(x + w * 0.2, y - h, w * 0.3, h, d, ' rx="5" opacity=".45"') + k.R(x - w / 2, y - h * 0.42, w, 4, '#6B4A2E', k.op(0.7)) + k.R(x - w * 0.12, y - h, 4, h, '#6B4A2E', k.op(0.7));
  }
  /* 6) 사울이 짐 사이에 숨었다 하심(삼상 10:22): 미스바 한쪽의 짐 더미. 사람은 그리지 않는다 */
  function baggage() {
    var a = [[250, 438, 96, 62, '#C8B08A'], [352, 438, 120, 44, '#B89A70'], [470, 438, 84, 76, '#D6C4A0'], [566, 438, 110, 52, '#A88A62'], [652, 440, 70, 36, '#C2A47A'], [296, 472, 130, 58, '#D2BE98'], [424, 474, 104, 70, '#B49468'], [548, 472, 140, 50, '#D8C6A2']], o = '', i;
    for (i = 0; i < a.length; i++) o += bale(a[i][0], a[i][1], a[i][2], a[i][3], a[i][4]);
    return top('noon', '#A9B8C4', '#B4B48C', '#C8B274') + k.cloud(300, 170, 0.9, '#FBF7EE') + k.E(450, 474, 280, 16, SH, k.op(0.2)) + o + k.rocks(2551, 440, 470, 3, '#A88A64', 720, 820) + k.tufts(2552, 480, 585, 12, '#8E9A56');
  }
  /* 7) 나라의 제도를 책에 기록하여 여호와 앞에 둠, 백성을 집으로 보냄(삼상 10:25): 그 땅의 낮은 돌 위의 두루마리와 내려가는 길 */
  function book() {
    return top('day', '#A9B8C4', '#B4B48C', '#C8B274') + k.cloud(640, 160, 1, '#FBF7EE') + k.cloud(250, 210, 0.6, '#FBF7EE') + k.road(700, 600, 260, 560, 404, 16, '#E6D2A6', 90, '#B89260') +
      k.rock(340, 464, 320, 40, '#B8A078') + k.scroll(322, 432, 2, false) + k.rocks(2561, 480, 575, 4, '#A88A64', 110, 520) + k.tufts(2562, 430, 585, 12, '#8E9A56');
  }
  SA.reg('OT-25', { beats: [ramah, ramahIn, fields, goHome, mizpah, baggage, book], arrive: 0, end: 6 });
})();

/* ── OT-27 다윗에게 주신 언약 (삼하 7:1-17) ──
 * 그린 것과 근거: 왕의 백향목 궁(삼하 7:1-2. 생김새는 본문에 없어 백향목 널과 기둥의 평지붕 집으로 멀리, 대목마다 같은 자리) · 궁 안(7:2 "백향목 궁에 거하거늘") · 그 밤의 하늘(7:4).
 * 그리지 않은 것: 사람(다윗, 나단), 하나님의 형상과 묵시의 모습(7:17), 하나님의 궤와 휘장·장막·회막(7:2, 7:6. 말 속에만 나온다), 목장과 양(7:8. 말씀 속의 지난날), 성읍(본문에 없음),
 *   왕좌·왕관·홀(약속의 '위'와 '나라'를 물건으로 꾸미지 않음), 장차 지을 집(7:13), 날 자식의 모습(7:12), 달(본문에 없음), 막대기와 채찍(7:14). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, SH = '#16233F', CE = '#A8643A', STN = '#D2C2A0', NC = '#3A3252', NS = '#4A4C6C';
  /* 백향목 궁(삼하 7:2): 백향목 널 벽과 앞의 기둥, 평지붕. 멀리 단순하게 */
  function palace(x, y, s, c, st) {
    var d = k.dk(c, 0.35), l = k.lt(c, 0.18), o = k.E(x, y + 3 * s, 215 * s, 10 * s, SH, k.op(0.18)) + k.R(x - 96 * s, y - 212 * s, 192 * s, 62 * s, k.mix(c, d, 0.3)) + k.R(x - 104 * s, y - 220 * s, 208 * s, 11 * s, l, ' rx="2"') +
      k.R(x - 176 * s, y - 152 * s, 352 * s, 138 * s, c) + k.R(x + 96 * s, y - 152 * s, 80 * s, 138 * s, d, k.op(0.3)), i;
    for (i = 0; i < 13; i++) o += k.R(x - 170 * s + i * 27 * s, y - 150 * s, 2.5 * s, 134 * s, d, k.op(0.3));
    o += k.R(x - 22 * s, y - 92 * s, 44 * s, 78 * s, k.dk(c, 0.62)) + k.R(x - 194 * s, y - 14 * s, 388 * s, 14 * s, st) + k.R(x - 194 * s, y - 5 * s, 388 * s, 5 * s, k.dk(st, 0.3), k.op(0.4));
    for (i = 0; i < 4; i++) o += k.column(x - 160 * s + i * 107 * s, y - 14 * s, 13 * s, 118 * s, k.dk(c, 0.18));
    return o + k.R(x - 188 * s, y - 164 * s, 376 * s, 13 * s, l, ' rx="2"') + k.R(x - 188 * s, y - 154 * s, 376 * s, 4 * s, d, k.op(0.4));
  }
  function hilltop(sky, a, b, g, x) { return k.sky(sky) + (x || '') + k.hill(2701, 330, 30, 0.7, a) + k.hill(2702, 378, 16, 1.2, b) + k.ground(408, g) + k.hill(2703, 446, 7, 2, k.lt(g, 0.07)); }
  function grass(c, r) { return k.rocks(2704, 470, 575, 4, r, 110, 300) + k.tufts(2705, 452, 585, 12, c); }
  /* 1) 왕이 백향목 궁에 평안히 거함(삼하 7:1-2): 낮의 궁을 멀리. 궤와 휘장은 그리지 않는다 */
  function palaceDay() {
    return hilltop('day', '#A8B8B4', '#B8B48A', '#C9B27A') + k.cloud(250, 140, 1, '#FBF7EE') + k.cloud(680, 190, 0.7, '#FBF7EE') + palace(350, 440, 0.6, CE, STN) + grass('#8E9A56', '#A88A64');
  }
  /* 궁 안(삼하 7:2): 백향목 널 벽과 기둥, 창밖의 하늘. wx 창의 자리, sk 창밖 하늘색 */
  function hall(wx, cx, sk, w) {
    var o = k.room(w, '#C2A478', 424, { win: [wx, 150, 120, 160], sky: sk, beam: false }), i;
    for (i = 0; i < 16; i++) o += k.R(20 + i * 58, 0, 3, 420, '#6E3E24', k.op(0.28));
    return o + k.R(0, 60, 900, 26, '#7E4A2A') + k.R(0, 82, 900, 6, SH, k.op(0.25)) + k.column(cx, 424, 34, 330, '#B4703E') + k.column(cx + 280, 424, 34, 330, '#B4703E') + k.R(0, 424, 900, 7, '#8A5E36');
  }
  /* 2) 나단이 왕께 대답함(삼하 7:3): 백향목 궁 안, 창밖의 낮 하늘 */
  function hallDay() { return hall(596, 190, '#CDEBE4', '#A2623A'); }
  /* 3) 그 밤에 말씀이 임함(삼하 7:4): 밤하늘과 별, 어두운 언덕, 멀리 작은 궁. 장막과 회막(7:6)은 그리지 않는다 */
  function farNight() {
    return hilltop('night', '#2A2A52', '#32345C', '#3C4266') + k.stars(2711, 150, 300) + palace(480, 404, 0.3, NC, NS) + k.rocks(2713, 470, 575, 4, '#4A4C6C', 560, 800) + k.tufts(2712, 462, 585, 10, '#2E3A52');
  }
  /* 4) 같은 밤(삼하 7:4), 말씀이 이어짐(7:8-11): 궁 둘레의 밤 언덕과 풀·돌, 별. 목장과 양(7:8)은 그리지 않는다 */
  function nightHills() {
    return k.sky('deepnight') + k.stars(2721, 190, 350) + k.hill(2722, 350, 40, 0.5, '#1E2A48') + k.hill(2723, 400, 26, 0.9, '#263A4C') + k.hill(2724, 446, 16, 1.4, '#2E4650') + k.ground(470, '#34504E') +
      k.rocks(2725, 420, 575, 7, '#4A586A', 150, 800) + k.tufts(2726, 452, 585, 16, '#3E6456');
  }
  /* 5) 여호와가 너를 위하여 집을 이루리라(삼하 7:11-13): 같은 밤, 1과 같은 자리의 궁과 별이 가득한 하늘. 지을 집은 그리지 않는다 */
  function palaceNight() {
    return hilltop('deepnight', '#1E2244', '#282C52', '#323A5C') + k.stars(2731, 240, 330) + palace(350, 440, 0.6, NC, NS) + grass('#2E3A52', '#464C68');
  }
  /* 6) 네 집과 네 나라가 영원히 보전되리라(삼하 7:16): 동트기 전의 넓은 하늘, 같은 궁을 조금 멀리. 성읍은 그리지 않는다 */
  function dawnSky() {
    return hilltop('predawn', '#4A4878', '#565480', '#62607A', k.stars(2741, 70, 230) + k.glow(760, 380, 200, '#F2B89A', 0.5)) + palace(350, 428, 0.42, '#6A4E5A', '#8A8298') + grass('#4A506A', '#6A6884');
  }
  /* 7) 나단이 이 모든 말씀대로 다윗에게 고함(삼하 7:17): 궁 안, 창밖의 아침 하늘(2와 같은 방을 다른 쪽에서) */
  function hallMorning() { return hall(190, 440, '#FBE3B0', '#AE6E44'); }
  SA.reg('OT-27', { beats: [palaceDay, hallDay, farNight, nightHills, palaceNight, dawnSky, hallMorning], arrive: 0, end: 6 });
})();

/* ── OT-28 솔로몬이 성전을 봉헌함 (왕상 8:1-30, 8:54-61) ──
 * 그린 것과 근거: 예루살렘과 다윗 성 곧 시온, 올라가는 길(왕상 8:1, 8:4) · 여호와의 전(8:6, 8:10. 생김새는 왕상 6:2-5, 7:15-21의 본채·낭실·두 기둥까지만)과 전의 문짝(6:34)
 * · 전에 가득한 구름(8:10-11) · 전 앞뜰(8:64)과 온 회중이 선 쪽(8:14) · 여호와의 단, 곧 놋단(8:22, 8:64. 생김새는 단순하게) · 하늘(8:22-23, 8:27, 8:54).
 * 그리지 않은 것: 사람(솔로몬, 제사장, 회중), 하나님의 형상과 구름 속의 어떤 모양, 궤와 채·그룹·지성소 안·돌판(8:6-9), 회막과 기구들(8:4. 모양이 본문에 없음),
 *   제물인 양과 소(8:5), 단 위의 불과 연기(이 범위에 불이 적혀 있지 않음), 단의 뿔, 층계와 성가퀴, 왕관. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, SH = '#16233F', TC = '#E6D2A2', CL = '#F6F2E8';
  /* 전 앞뜰(왕상 8:64): 낮은 뜰 담과 돌바닥 */
  function court(sky, fl) {
    var o = k.sky(sky) + k.hill(2801, 330, 20, 0.8, '#B4B8A4') + k.R(0, 336, 900, 36, '#D2B88A') + k.R(0, 332, 900, 6, '#E2CCA2') + k.ground(372, fl || '#DCC8A0') + k.R(0, 372, 900, 10, '#B89A6A', k.op(0.4)), i;
    for (i = 0; i < 5; i++) o += k.R(0, 398 + i * i * 9, 900, 2, '#A88A5E', k.op(0.22));
    return o;
  }
  /* 닫힌 전의 문짝(왕상 6:34): temple() 붓의 문 자리에 나무 문 두 짝 */
  function doors(x, y, s) { return k.R(x - 13 * s, y - 62 * s, 26 * s, 62 * s, '#8A5E36') + k.R(x - 0.7 * s, y - 62 * s, 1.4 * s, 62 * s, '#4E3422') + k.R(x - 13 * s, y - 62 * s, 26 * s, 3 * s, '#A87A48'); }
  /* 여호와의 단(왕상 8:22, 놋단 8:64): 낮고 넓은 놋빛 단. 불은 그리지 않는다 */
  function altar(x, y, s) {
    var c = '#B8843E';
    return k.E(x, y + 3 * s, 98 * s, 9 * s, SH, k.op(0.2)) + k.R(x - 80 * s, y - 50 * s, 160 * s, 50 * s, c) + k.R(x + 30 * s, y - 50 * s, 50 * s, 50 * s, k.dk(c, 0.4), k.op(0.4)) +
      k.R(x - 86 * s, y - 58 * s, 172 * s, 10 * s, k.lt(c, 0.35), ' rx="2"') + k.R(x - 86 * s, y - 9 * s, 172 * s, 9 * s, k.dk(c, 0.25), ' rx="2"') + k.R(x - 66 * s, y - 42 * s, 5 * s, 28 * s, '#F2D08A', k.op(0.35));
  }
  /* 구름 더미(왕상 8:10-11): 넓고 낮은 덩이를 겹친다. 어떤 모양도 만들지 않는다 */
  function bank(seed, x0, x1, y0, y1, m, c) {
    var r = k.rng(seed), o = '', i;
    for (i = 0; i < m; i++) o += k.E(x0 + r() * (x1 - x0), y0 + (i / m) * (y1 - y0), 70 + r() * 70, 20 + r() * 16, i % 3 ? c : k.dk(c, 0.07));
    return k.G(o, ' class="ea-drift" opacity=".94"');
  }
  /* 1) 예루살렘, 다윗 성 곧 시온에서 전으로 올라가는 길(왕상 8:1-2, 8:4) */
  function zion() {
    return k.sky('day') + k.cloud(230, 140, 1, '#FBF7EE') + k.cloud(420, 200, 0.6, '#FBF7EE') + k.hill(2811, 350, 30, 0.7, '#A8B49A') + k.mount(560, 450, 820, 170, '#B8A47C') + k.temple(620, 300, 0.62, TC) +
      k.road(330, 398, 44, 600, 300, 16, '#E2CFA2', 110, '#B89260') + k.town(2812, 290, 400, 320, 6, '#D9BC8C', 0.9) + k.hill(2813, 432, 12, 1.5, '#A8A868') + k.ground(455, '#B4A862') +
      k.road(420, 600, 220, 330, 420, 30, '#E2CFA2', 40) + k.rocks(2814, 475, 575, 4, '#A88A64', 560, 860) + k.tufts(2815, 462, 585, 12, '#7E8C4A');
  }
  /* 2) 궤를 그 처소로 메어 들임(왕상 8:6): 전 바깥과 닫힌 문만. 궤와 지성소 안은 그리지 않는다 */
  function closed() { return court('morning') + k.temple(450, 412, 2, TC) + doors(450, 412, 2); }
  /* 3) 구름이 여호와의 전에 가득함(왕상 8:10-11): 전의 문과 뜰을 덮은 구름 */
  function cloudFill() {
    return court('day', '#E2D4B4') + k.temple(450, 412, 2, TC) + bank(2821, 350, 550, 280, 350, 10, CL) + bank(2822, 130, 770, 340, 480, 30, CL) + bank(2823, 60, 840, 470, 590, 14, '#FBF8F0');
  }
  /* 4) 얼굴을 돌이켜 온 회중을 위하여 축복함(왕상 8:14): 전 쪽에서 내다본 뜰(8:64)과 예루살렘(8:1) */
  function toCourt() {
    return k.sky('day') + k.cloud(520, 150, 1.1, '#FBF7EE') + k.cloud(230, 210, 0.7, '#FBF7EE') + k.hill(2831, 322, 30, 0.6, '#A8B8B4') + k.hill(2832, 356, 16, 1.1, '#B4B48A') + k.town(2833, 500, 372, 760, 9, '#D6BA8A', 0.8) +
      k.R(0, 366, 900, 34, '#D2B88A') + k.R(0, 362, 900, 6, '#E2CCA2') + k.ground(400, '#DCC8A0') + k.R(0, 400, 900, 9, '#B89A6A', k.op(0.4)) + k.R(0, 430, 900, 2, '#A88A5E', k.op(0.22)) + k.R(0, 478, 900, 3, '#A88A5E', k.op(0.22));
  }
  /* 5) 여호와의 단 앞에서 하늘을 향함(왕상 8:22-23): 뜰의 단과 전, 넓은 하늘 */
  function altarSky() { return court('noon') + k.cloud(260, 150, 0.9, '#FBF7EE') + k.cloud(650, 110, 0.7, '#FBF7EE') + k.temple(450, 394, 1.2, TC) + doors(450, 394, 1.2) + altar(450, 464, 1.15); }
  /* 6) 하늘과 하늘들의 하늘이라도(왕상 8:27): 겹겹이 높은 하늘 아래 작게 보이는 전 */
  function heavens() {
    var o = k.R(0, 0, 900, 600, k.lg(['#2E5E9A', '#6FB0CC', '#D8ECE0', '#F6E7C3'])), i, r = k.rng(2841);
    for (i = 0; i < 9; i++) o += k.cloud(120 + r() * 660, 96 + i * 30 + r() * 10, 1.25 - i * 0.11, i < 4 ? '#FBF7EE' : '#F4EEDC');
    return o + k.hill(2842, 418, 16, 0.7, '#A8B49A') + k.mount(450, 500, 760, 90, '#B4A67C') + k.temple(520, 416, 0.6, TC) + k.town(2843, 310, 452, 260, 5, '#D4B888', 0.5) + k.hill(2844, 462, 8, 1.6, '#A8A868') + k.ground(476, '#B0A662');
  }
  /* 7) 기도를 마치고 여호와의 단 앞에서 일어나 축복함(왕상 8:54-55): 뜰 한쪽에서 비껴 본 단과 전, 회중이 선 넓은 뜰(8:55). 5와 같은 크기 */
  function altarNear() { return court('day') + k.cloud(600, 160, 1, '#FBF7EE') + k.temple(250, 394, 1.2, TC) + doors(250, 394, 1.2) + altar(400, 464, 1.15); }
  SA.reg('OT-28', { beats: [zion, closed, cloudFill, toCourt, altarSky, heavens, altarNear], arrive: 0, end: 6 });
})();

/* ── OT-29 나라가 둘로 갈라짐 (왕상 12:1-24) ──
 * 그린 것과 근거: 세겜(왕상 12:1. 생김새는 본문에 없어 멀리 흙벽돌 집들의 성읍으로만) · 사흘(12:5, 12:12. 사흘째만 흐린 날로)
 * · 이스라엘 사람들의 장막(12:16 "너희의 장막으로 돌아가라". 멀리 작게)과 흩어지는 빈 길 · 예루살렘(12:18, 12:21. 멀리 성벽과 집들만)과 각기 집으로 돌아가는 길(12:24).
 * 그리지 않은 것: 사람(르호보암, 여로보암, 회중, 노인들, 소년들, 스마야, 용사 십팔만), 멍에·채찍·전갈(12:4, 12:11 말 속의 비유), 아도니람의 죽음과 돌·수레(12:18),
 *   군대와 무기(12:21), 금송아지(범위 밖), 의논한 방·궁(본문에 없음), 저녁·밤·별(12:6-11에 때가 없음), 예루살렘의 여호와의 전(이 본문에 없음), 스마야에게 임한 말씀을 나타내는 빛(12:22). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  /* 세겜 쪽 땅: 먼 산, 두 언덕 사이의 성읍(왕상 12:1), 앞으로 오는 길. */
  function shechem(skyName, far, mid, g, tc, rc, o) {
    return k.sky(skyName) + (o && o.pre || '') + k.hill(2901, 318, 26, 0.6, far) + k.mount(190, 400, 520, 150, k.mix(far, mid, 0.5)) + k.mount(760, 400, 480, 170, k.mix(far, mid, 0.6)) +
      k.hill(2902, 388, 12, 1.1, mid) + k.town(2903, 470, 392, 300, 7, tc, 0.8, o) + k.ground(398, g) + k.hill(2904, 420, 8, 1.9, g) +
      k.road(330, 600, 230, 470, 398, 26, rc, 90, k.dk(rc, 0.2));
  }
  function fore(seed, rk, tf) { return k.rocks(seed, 450, 570, 6, rk, 560, 840) + k.rock(170, 520, 80, 30, rk) + k.tufts(seed + 1, 440, 588, 12, tf); }
  /* 1) 세겜(왕상 12:1-3): 아침, 온 이스라엘이 이른 성읍과 그리로 가는 길 */
  function come() {
    return shechem('morning', '#A9B8C4', '#B6B088', '#C9B078', '#DCC49C', '#E6D2A6', { pre: k.cloud(250, 150, 0.9, '#FBF7EE') }) + fore(2905, '#A08A6A', '#86904E');
  }
  /* 2) "갔다가 삼일 후에 다시 오라 하매 백성이 가니라"(왕상 12:5): 낮, 세겜을 등지고 본 떠나는 길 */
  function leave() {
    return k.sky('noon') + k.cloud(620, 160, 1.0, '#FBF7EE') + k.hill(2911, 322, 22, 0.8, '#B4C0C4') + k.hill(2912, 368, 18, 1.2, '#B8B48C') + k.ground(392, '#CDB47C') + k.hill(2913, 426, 8, 2.1, '#C6AA70') +
      k.road(560, 600, 300, 300, 372, 12, '#E8D6AC', -70, '#C2A470') + k.house(96, 452, 150, 96, '#D2B284', { doorAt: 0.5 }) + k.house(60, 474, 120, 84, '#C8A678', { doorAt: 0.3 }) + k.rocks(2914, 480, 570, 5, '#A88E6A', 240, 420) + k.tufts(2915, 440, 588, 12, '#8A8E4E');
  }
  /* 3) 노인들과 의논함(왕상 12:6-7): 낮의 세겜(12:1). 의논한 자리는 본문에 없어 성읍만 */
  function elders() {
    return shechem('noon', '#B0BCC0', '#B4AA80', '#C2A66C', '#D8BE94', '#E2CCA0', { pre: k.cloud(640, 140, 1.1, '#FBF7EE') }) + fore(2905, '#9C8462', '#84884A');
  }
  /* 4) 소년들과 의논함(왕상 12:8-11): 조금 가까이 본 세겜(12:1) */
  function youths() {
    return k.sky('dry') + k.hill(2921, 310, 24, 0.7, '#B0B0A4') + k.mount(640, 400, 620, 170, '#B4A888') + k.town(2922, 330, 394, 400, 8, '#D6BC92', 1.05) +
      k.ground(396, '#C2A870') + k.hill(2923, 428, 9, 1.6, '#B89C64') + k.road(640, 600, 260, 380, 398, 40, '#E0CCA0', -80, '#BCA070') + k.rocks(2924, 470, 575, 6, '#9E8864', 110, 420) + k.tufts(2925, 445, 588, 12, '#84844A');
  }
  /* 5) 사흘 만에 백성이 다시 옴, 왕이 듣지 아니함(왕상 12:12-15): 사흘째 흐린 아침, 길 위에서 가까이 본 세겜 */
  function third() {
    return k.sky('grey') + k.cloud(300, 170, 1.2, '#E4E2DA') + k.cloud(650, 130, 0.9, '#DAD8D0') + k.hill(2931, 300, 24, 0.7, '#98A2AC') + k.mount(120, 390, 520, 190, '#9EA094') + k.mount(800, 390, 520, 210, '#A4A090') +
      k.town(2932, 450, 396, 520, 9, '#CDB490', 1.25) + k.ground(396, '#B8A47C') + k.hill(2933, 430, 8, 1.7, '#B09A70') + k.road(450, 600, 320, 450, 400, 90, '#D6C4A0', 0, '#B49C74') +
      k.rocks(2934, 460, 570, 5, '#9A8A70', 120, 300) + k.tufts(2935, 445, 588, 12, '#7E8250');
  }
  /* 멀리 작은 장막 몇 채(왕상 12:16) */
  function tents(a, c) { var o = '', i; for (i = 0; i < a.length; i++) o += k.tent(a[i][0], a[i][1], a[i][2], i % 2 ? c : k.lt(c, 0.15), '#5E4E44'); return o; }
  /* 6) "이스라엘아 너희의 장막으로 돌아가라"(왕상 12:16): 흩어지는 빈 길과 먼 장막들. 돌과 수레(12:18)는 그리지 않는다 */
  function scatter() {
    return k.sky('dry') + k.cloud(480, 150, 1.1, '#F4EEDC') + k.hill(2941, 316, 24, 0.7, '#A8AEA8') + k.hill(2942, 356, 16, 1.2, '#B4AA88') +
      tents([[190, 372, 0.34], [250, 378, 0.4], [690, 366, 0.32], [750, 374, 0.42]], '#D8C8A6') + k.ground(378, '#C4AA76') + k.hill(2943, 422, 9, 1.8, '#BCA06C') +
      k.road(430, 600, 190, 215, 380, 10, '#E2CEA2', -110) + k.road(470, 600, 190, 725, 378, 10, '#E2CEA2', 110) +
      k.rocks(2944, 470, 575, 6, '#A28C68', 110, 300) + k.rocks(2945, 480, 575, 4, '#A28C68', 640, 820) + k.tufts(2946, 445, 588, 12, '#8A8A4E');
  }
  /* 7) 예루살렘(왕상 12:21), "각기 집으로 돌아가라"(12:24): 늦은 볕, 언덕 위의 성과 갈라지는 빈 길. 군대는 그리지 않는다 */
  function home() {
    return k.sky('gold') + k.glow(720, 380, 180, '#FFE6B0', 0.5) + k.hill(2951, 330, 26, 0.6, '#9C94A8') + k.mount(450, 420, 780, 140, '#B09A7A') +
      k.town(2952, 450, 352, 400, 8, '#DCC094', 0.9) + k.wall(210, 376, 480, 26, '#C6A676', 2953) + k.gate(330, 376, 70, 40, '#CEAE7E') +
      k.hill(2954, 426, 12, 1.4, '#A89A62') + k.ground(444, '#B2A062') + k.road(330, 444, 44, 330, 376, 18, '#E0CCA0', 0) +
      k.road(170, 600, 200, 320, 440, 30, '#E0CCA0', 50) + k.road(640, 600, 200, 342, 440, 30, '#E0CCA0', -90) + k.rocks(2955, 480, 575, 5, '#9C8660', 300, 480) + k.tufts(2956, 455, 588, 12, '#7E8448');
  }
  SA.reg('OT-29', { beats: [come, leave, elders, youths, third, scatter, home], arrive: 0, end: 6 });
})();

/* ── OT-31 요나와 니느웨 (욘 1:1-4:11) ──
 * 그린 것과 근거: 욥바, 다시스로 가는 배(욘 1:3) · 폭풍의 바다와 배, 바다에 던진 물건(1:4-5) · 잔잔해진 바다(1:15) · 육지(2:10. 빈 바닷가)
 * · 큰 성읍 니느웨(3:3) · 굵은 베와 재(3:6) · 성 동편의 초막(4:5) · 시든 박 넝쿨, 뜨는 해, 동풍(4:6-8). 성읍은 서쪽(왼쪽), 해는 동쪽(오른쪽).
 * 그리지 않은 것: 사람, 큰 물고기와 그 배 속(1:17, 2:1, 2:10), 던져지는 모습(1:15), 깊음·바다 풀·산의 뿌리(2:3-6 기도의 말), 저녁·밤(본문에 없음), 제비·노, 사공들의 신과 제물, 보좌(3:6), 짐승(3:7), 벌레(4:7), 앗수르의 신상, 무너지는 성. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  function grad(a) { return k.R(0, 0, 900, 600, k.lg(a)); }
  function ln(d, c, w, ex) { return '<path d="' + d + '" stroke="' + c + '" stroke-width="' + w + '" fill="none" stroke-linecap="round"' + (ex || '') + '/>'; }
  /* 배(욘 1:3): 선체, 돛대, 돛(sail이 false면 걷은 돛) */
  function ship(x, y, s, rot, sail) {
    var h = '#8A5A34', o = k.P('M-104,-22 Q-98,22 -62,30 L58,30 Q96,24 112,-30 L84,-18 L-80,-18 Z', h) +
      k.R(-82, -22, 168, 6, k.lt(h, 0.25), ' rx="3"') + k.R(-4, sail ? -150 : -118, 8, sail ? 132 : 100, '#6B4426', ' rx="3"') + (sail ? k.R(-62, -146, 124, 6, '#6B4426', ' rx="3"') : '');
    o += sail ? k.P('M-58,-140 Q-44,-90 -56,-44 L56,-44 Q70,-90 58,-140 Z', '#EFE3C4') : k.R(-35, -112, 70, 12, '#E2D4B2', ' rx="6"');
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + s + ')">' + o + '</g>';
  }
  /* 바람결(욘 1:4, 4:8) */
  function wind(n, x0, dx, y0, len, c) { var o = '', i; for (i = 0; i < n; i++) o += ln('M' + (x0 + i * dx) + ',' + (y0 + (i * 53) % 140) + ' q' + len + ',-12 ' + len * 2 + ',6', c, 3.5, k.op(0.45)); return k.G(o, ' class="ea-drift"'); }
  function wave(seed, y, amp, f, c, foam) {
    var r = k.rng(seed), o = k.hill(seed, y, amp, f, c), i;
    for (i = 0; i < (foam || 0); i++) o += ln('M' + k.f1(40 + r() * 820) + ',' + k.f1(y + 10 + r() * 30) + ' q20,-9 ' + k.f1(36 + r() * 40) + ',0', '#F1F4EE', 3, ' class="ea-shim" opacity=".6"');
    return o;
  }
  /* 1) 욥바, 다시스로 가는 배(욘 1:3): 바닷가의 성읍과 물가에 댄 배 */
  function joppa() {
    return k.sky('day') + k.cloud(600, 150, 1, '#FBF7EE') + k.water(318, '#5FA9C0', '#CDEBE4', 3101) + k.hill(3102, 316, 14, 0.9, '#B4B49A') + k.P('M230,318 L920,318 L920,450 L400,450 Z', '#5FA9C0') +
      k.town(3103, 250, 326, 250, 6, '#DCC49C', 0.8) + ship(610, 410, 1.0, -2, true) + wave(3104, 436, 5, 3.1, '#4E97B2', 6) + k.P('M-20,600 L-20,330 Q200,318 330,380 Q410,430 430,500 Q440,560 430,600 Z', '#D8C08C') +
      k.rocks(3105, 450, 560, 5, '#A89274', 120, 360) + k.tufts(3106, 430, 580, 7, '#8A8E4E', 110, 340);
  }
  /* 2) 큰 바람과 폭풍, 거의 깨어지게 된 배, 바다에 던진 물건(욘 1:4-5) */
  function storm() {
    return k.sky('storm') + k.cloud(260, 130, 1.8, '#3E4656') + k.cloud(650, 110, 2.0, '#454E5E') + wind(9, 60, 95, 120, 60, '#C9D2D8') +
      wave(3111, 330, 26, 1.7, '#3C5E72') + wave(3112, 372, 30, 2.3, '#345468', 5) + ship(430, 380, 1.0, -15, false) + wave(3113, 420, 30, 2.1, '#2C4A60', 6) +
      k.R(610, 404, 34, 20, '#8A6A44', ' rx="3" transform="rotate(14 627 414)"') + k.R(676, 420, 26, 16, '#7E6040', ' rx="3" transform="rotate(-20 689 428)"') +
      wave(3114, 476, 26, 2.7, '#243E54', 6);
  }
  /* 3) 바다의 뛰노는 것이 그침(욘 1:15): 잔잔한 바다와 먼 배 */
  function calm() {
    return grad(['#7E97AE', '#C9D6D8', '#F3E4C4']) + k.cloud(250, 170, 1.3, '#EEF0EA') + k.water(330, '#6FA6B8', '#E6F0EA', 3121) +
      ship(560, 372, 0.5, 0, true);
  }
  /* 4) 육지(욘 2:10): 잔잔한 바다와 빈 모래 바닷가. 물고기는 그리지 않는다 */
  function shore() {
    return k.sky('morning') + k.cloud(620, 160, 1.1, '#FBF7EE') + k.water(300, '#6FA6B8', '#E6F0EA', 3131) + wave(3132, 386, 5, 2.6, '#E4EEE6', 5) + k.hill(3133, 398, 7, 1.3, '#E2CC9A') + k.ground(412, '#DCC490') +
      k.hill(3134, 470, 9, 1.7, '#D2B884') + k.rocks(3135, 440, 575, 6, '#A89274') + k.tufts(3136, 490, 590, 8, '#8A8E4E', 560, 860);
  }
  function nineveh(cx, y, w, c, s, o) {
    return k.town(3141, cx, y - 16 * s, w * 0.9, 12, k.lt(c, 0.1), 0.7 * s, o) + k.wall(cx - w / 2, y, w, 26 * s, c, 3142) + k.gate(cx - w * 0.2, y, 60 * s, 34 * s, k.lt(c, 0.06)) + k.gate(cx + w * 0.28, y, 60 * s, 34 * s, k.lt(c, 0.06));
  }
  /* 5) 극히 큰 성읍 니느웨(욘 3:3): 평지 끝까지 이어진 성읍과 길 */
  function great() {
    return k.sky('noon') + k.cloud(280, 150, 1, '#FBF7EE') + k.hill(3143, 318, 14, 0.6, '#B8C0C0') + nineveh(450, 372, 860, '#D2B88E', 1) + k.ground(372, '#CBB07A') + k.hill(3144, 420, 8, 1.8, '#C2A66E') +
      k.road(300, 600, 240, 270, 372, 22, '#E6D4A8', 60, '#BFA272') + k.rocks(3145, 450, 575, 6, '#A48C68', 540, 830) + k.tufts(3146, 440, 588, 12, '#8A8A4E');
  }
  /* 6) 굵은 베와 재(욘 3:6): 낮, 성읍 앞 땅의 재와 갠 굵은 베 한 장 */
  function ashes() {
    var a = '#A8A4A0';
    return k.sky('day') + k.cloud(640, 140, 1.1, '#FBF7EE') + k.hill(3151, 330, 14, 0.6, '#B4BCC0') + nineveh(450, 366, 860, '#D2B88E', 0.9) + k.ground(366, '#C6AC78') + k.hill(3152, 430, 8, 1.5, '#BEA26C') +
      k.E(336, 500, 112, 7, a, k.op(0.6)) + k.heap(330, 496, 170, 24, a) + k.E(200, 506, 34, 6, a, k.op(0.7)) + k.E(452, 510, 28, 5, a, k.op(0.7)) + k.E(400, 484, 20, 4, a, k.op(0.6)) +
      k.P('M528,494 Q580,500 652,492 L668,474 Q600,468 548,472 Z', '#5E4A3A') + k.P('M548,472 Q600,468 668,474 L660,483 Q600,477 543,481 Z', '#75604C') + ln('M536,488 Q586,493 656,487', '#4A3A2E', 1.5) + k.tufts(3153, 450, 588, 8, '#8A8A4E');
  }
  /* 초막(욘 4:5): 가지 기둥과 가지 지붕. vine이면 시든 박 넝쿨(4:7) */
  function booth(x, y, vine) {
    var o = k.E(x, y + 4, 120, 14, '#16233F', k.op(0.22)) + k.P('M' + (x - 84) + ',' + (y - 94) + ' L' + (x + 92) + ',' + (y - 102) + ' L' + (x + 84) + ',' + y + ' L' + (x - 92) + ',' + y + ' Z', '#3E3428', k.op(0.35)), i, p = [-90, -48, 52, 86];
    for (i = 0; i < 4; i++) o += ln('M' + (x + p[i]) + ',' + (y - (i % 3 ? 14 : 0)) + ' l' + (i < 2 ? 6 : -4) + ',-96', '#7A5232', 8);
    for (i = 0; i < 9; i++) o += ln('M' + (x - 112 + i * 4) + ',' + (y - 92 - i * 3) + ' Q' + x + ',' + (y - 122 - (i % 3) * 5) + ' ' + (x + 118 - i * 3) + ',' + (y - 98 - i * 2), i % 2 ? '#8A6E44' : '#9A8250', 7);
    if (vine) { o += ln('M' + (x + 96) + ',' + y + ' Q' + (x + 108) + ',' + (y - 70) + ' ' + (x + 80) + ',' + (y - 118) + ' Q' + (x + 20) + ',' + (y - 136) + ' ' + (x - 50) + ',' + (y - 122), '#8A7A3E', 5); for (i = 0; i < 7; i++) o += k.E(x + 96 - i * 24, y - 100 - (i % 2) * 12, 8, 15, i % 2 ? '#A8924E' : '#8E7A40'); }
    return o;
  }
  function east(skyName, far, g, c, pre) { return k.sky(skyName) + (pre || '') + k.hill(3161, 322, 16, 0.6, far) + nineveh(150, 372, 470, c, 0.8) + k.ground(372, g) + k.hill(3162, 410, 12, 1.2, k.dk(g, 0.06)) + k.mount(600, 520, 560, 90, k.lt(g, 0.06)) + k.rocks(3163, 480, 580, 5, k.dk(g, 0.2), 120, 400) + k.tufts(3164, 450, 588, 10, k.mix(g, '#6F8448', 0.5)); }
  /* 7) 성 동편의 초막(욘 4:5): 낮 */
  function hut() {
    return east('day', '#B4C0C0', '#C6B078', '#D2B88E') + k.cloud(520, 150, 1, '#FBF7EE') + booth(590, 462, 0);
  }
  /* 8) 시든 박 넝쿨, 해가 뜰 때의 뜨거운 동풍(욘 4:6-8): 같은 자리의 아침 */
  function gourd() {
    return east('dry', '#C4B8A0', '#D2B478', '#D8BC8E', k.sun(740, 318, 30, '#FFF1C8', '#FBE3B0')) + booth(590, 462, 1) + wind(7, 820, -100, 250, -70, '#F6E2B4');
  }
  SA.reg('OT-31', { beats: [joppa, storm, calm, shore, great, ashes, hut, gourd], arrive: 0, end: 7 });
})();

/* ── OT-32 북 이스라엘이 사로잡혀 감 (왕하 17:1-23) ──
 * 그린 것과 근거: 사마리아(왕하 17:1, 17:5-6. 생김새는 본문에 없어 멀리 언덕 위의 성벽·성문·집들로만) · 성읍들과 망대, 견고한 성(17:9. 멀리)
 * · 산과 푸른 나무(17:10. 풍경으로만) · 사로잡혀 간 뒤의 빈 땅(17:18)
 * · 앗수르(17:23. 낯선 평지와 먼 고을. 생김새는 본문에 없어 단순하게).
 * 그리지 않은 것: 사람(호세아, 살만에셀, 사자들, 사로잡혀 가는 사람들, 선지자들), 군대·에워싼 진·사슬(17:5-6), 조공과 옥(17:3-4. 생김새가 본문에 없음),
 *   산당·주상·목상·아세라상·송아지 형상·바알(17:9-12, 17:16), 분향의 연기(17:11), 불(17:17), 해·달·별(17:16. 섬긴 대상), 밤, 고산 강(17:6은 대목 3), 붉은 하늘. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  function grad(a) { return k.R(0, 0, 900, 600, k.lg(a)); }
  /* 언덕 위의 사마리아(왕하 17:1): 집들, 성벽, 성문 */
  function city(cx, y, s, c, hc) {
    return k.mount(cx, y + 70 * s, 640 * s, 120 * s, hc) + k.town(3201, cx, y - 12 * s, 330 * s, 7, k.lt(c, 0.1), 0.85 * s) + k.wall(cx - 200 * s, y, 400 * s, 26 * s, c, 3202) + k.gate(cx, y, 70 * s, 40 * s, k.lt(c, 0.05));
  }
  /* 1) 사마리아(왕하 17:1-2): 낮, 언덕 위의 성과 올라가는 길 */
  function reign() {
    return k.sky('day') + k.cloud(240, 150, 1, '#FBF7EE') + k.hill(3203, 330, 26, 0.7, '#A9B8B4') + city(470, 360, 1, '#CDAE80', '#B2A27A') + k.hill(3204, 428, 12, 1.4, '#9EA864') + k.ground(446, '#A8A660') +
      k.road(300, 600, 210, 470, 432, 30, '#E0CCA0', 80) + k.road(470, 432, 30, 470, 360, 16, '#E0CCA0', 0) + k.rocks(3205, 470, 575, 5, '#9A8A66', 560, 830) + k.tufts(3206, 455, 588, 12, '#7E8C4A');
  }
  /* 2) 조공을 드리다가 그침(왕하 17:3-4): 늦은 볕, 성문 곁에서 본 먼 길. 조공과 옥은 그리지 않는다 */
  function tribute() {
    return k.sky('gold') + k.glow(200, 380, 180, '#FFE6B0', 0.5) + k.hill(3211, 340, 24, 0.6, '#9A92A6') + k.hill(3212, 384, 16, 1.1, '#A8966E') + k.ground(408, '#B89A62') + k.hill(3213, 440, 8, 1.8, '#B09058') +
      k.wall(520, 452, 400, 150, '#C6A470', 3214) + k.gate(640, 452, 170, 150, '#CEAE7C') + k.road(640, 600, 260, 640, 452, 60, '#E2CEA2', 0) + k.road(560, 520, 110, 190, 392, 10, '#E2CEA2', -110) +
      k.rocks(3215, 470, 575, 5, '#9C8660', 120, 400) + k.tufts(3216, 450, 588, 10, '#7E8448', 110, 520);
  }
  /* 3) 삼 년을 에워싸고 사로잡아 감(왕하 17:5-6): 흐린 날, 빈 성과 멀리 떠나는 빈 길. 군대는 그리지 않는다 */
  function taken() {
    return k.sky('grey') + k.cloud(560, 150, 1.3, '#DEDCD4') + k.hill(3221, 322, 20, 0.6, '#98A2AA') + city(250, 372, 0.72, '#B8A68A', '#A09C88') + k.hill(3222, 420, 10, 1.3, '#A09C76') + k.ground(436, '#A89E74') +
      k.road(380, 600, 230, 250, 424, 20, '#D2C4A2', 40) + k.road(330, 520, 90, 800, 340, 6, '#D2C4A2', 150) + k.rocks(3223, 470, 575, 5, '#8E8674', 500, 820) + k.tufts(3224, 450, 588, 12, '#7A7E56');
  }
  /* 산과 푸른 나무(왕하 17:10), 멀리 성읍과 망대(17:9). 우상과 산당은 그리지 않는다 */
  function hills(skyName, far, a, b, g, lf, tc, pre, bare) {
    function tr(x, y, s) { return k.tree(x, y, s, k.dk(lf, 0.5), lf, k.lt(lf, 0.18)); }
    return k.sky(skyName) + pre + k.hill(3231, 300, 28, 0.6, far) + k.mount(250, 420, 560, 190, a) + k.mount(690, 430, 600, 150, k.lt(a, 0.08)) +
      k.town(3232, 690, 300, 120, 4, tc, 0.5) + (bare ? '' : k.R(735, 262, 16, 38, tc) + k.R(732, 258, 22, 6, k.lt(tc, 0.2)) + tr(215, 250, 0.9) + tr(300, 262, 0.6) + tr(150, 290, 0.7)) +
      k.hill(3233, 400, 18, 1.2, b) + (bare ? '' : tr(560, 400, 0.8) + tr(830, 410, 0.9)) + k.ground(430, g) + k.hill(3234, 450, 8, 2, g) +
      (bare ? k.road(330, 600, 230, 640, 400, 14, k.lt(g, 0.3), 120, k.dk(g, 0.12)) : tr(170, 500, 1.5) + k.bush(650, 500, 1.1, lf)) +
      k.rocks(3235, 480, 575, 5, k.mix(b, '#8A8070', 0.5), 300, 560) + k.tufts(3236, 450, 588, 12, k.dk(lf, 0.1));
  }
  /* 4) 모든 산 위와 모든 푸른 나무 아래(왕하 17:9-10): 낮 */
  function green() { return hills('morning', '#A9BCC0', '#9FAE84', '#8FA264', '#9CA85C', '#5E8448', '#D6C4A0', k.cloud(560, 140, 1, '#FBF7EE')); }
  /* 5) 경계하셨으나 듣지 아니함(왕하 17:13-14): 흐린 날, 산과 성읍으로 가는 빈 길 */
  function deaf() { return hills('grey', '#9CA4AC', '#A4A490', '#A09A78', '#AEA47C', '#7E8456', '#C8B898', k.cloud(300, 150, 1.3, '#DEDCD4'), 1); }
  /* 6) 유다 지파 외에는 남은 자가 없음(왕하 17:18-20): 빈 땅과 멀리 빈 성. 길 없음 */
  function empty() {
    return k.sky('dry') + k.cloud(620, 160, 1.2, '#F2ECDC') + k.hill(3251, 322, 22, 0.6, '#AEB0A6') + city(250, 356, 0.5, '#C2AE8C', '#ACA486') + k.hill(3252, 404, 14, 1.0, '#B4A878') + k.ground(424, '#BCA874') +
      k.hill(3253, 462, 10, 1.6, '#B09C68') + k.stubble(3254, 430, 590, 70, '#8E8250') + k.rocks(3255, 450, 575, 7, '#9A8A6A') + k.tufts(3256, 440, 588, 14, '#868650');
  }
  /* 7) 앗수르에 사로잡혀 감(왕하 17:23): 낯선 평지와 먼 고을 */
  function exile() {
    return grad(['#6E86A8', '#C4C6C8', '#F0DCB8']) + k.cloud(620, 170, 1.1, '#EEEAE0') + k.hill(3261, 318, 10, 0.5, '#9AA4B4') + k.town(3262, 620, 330, 260, 6, '#B8AC9C', 0.55) + k.ground(330, '#B4AA84') +
      k.hill(3268, 400, 6, 0.9, '#A89E74') + k.hill(3263, 478, 8, 1.4, '#9C9468') + k.tufts(3264, 420, 470, 9, '#6E7E4A', 110, 420) + k.rocks(3265, 490, 580, 6, '#8A8470') + k.tufts(3266, 480, 590, 14, '#6E7E4A');
  }
  SA.reg('OT-32', { beats: [reign, tribute, taken, green, deaf, empty, exile], arrive: 0, end: 6 });
})();

/* ── OT-33 히스기야의 기도와 앗수르 (왕하 18:13-19:37) ──
 * 그린 것과 근거: 예루살렘(왕하 18:17)과 여호와의 전(18:15-16. 전의 생김새는 왕상 6:2-5, 7:15-21의 본채·낭실·두 기둥까지만) · 윗못과 수도, 세탁자의 밭, 큰 길(18:17)
 * · 성 위(18:26. 빈 성벽 위) · 여호와의 전(19:1) · 여호와 앞에 펴 놓은 편지(19:14. 전 앞 바닥의 펼친 두루마리. 글자 없음) · 이 성과 오던 길(19:32-34)
 * · 아침(19:35 "아침에 일찌기". 고요한 빈 들과 떠나 돌아간 길 19:36).
 * 그리지 않은 것: 사람(히스기야, 이사야, 엘리야김·셉나·요아, 성 위의 백성, 랍사게), 앗수르 군대·진·무기·토성(18:17, 19:32), 여호와의 사자와 주검(19:35), 니스록의 묘와 칼(19:37),
 *   전의 안쪽·궤·그룹(19:15 기도의 말), 밤·별(19:20-34에 때가 없음), 해(19:35), 벗긴 금(18:16), 굵은 베와 찢은 옷(19:1), 갈대 지팡이·말·포도와 무화과(랍사게의 말), 하늘에서 내리는 빛. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  function grad(a) { return k.R(0, 0, 900, 600, k.lg(a)); }
  /* 언덕 위의 예루살렘과 여호와의 전(왕하 18:15, 18:17) */
  function jer(far, hc, c, g, tf) {
    return k.hill(3301, 340, 28, 0.7, far) + k.mount(450, 430, 760, 130, hc) + k.temple(450, 318, 0.7, k.lt(c, 0.25)) + k.town(3302, 450, 372, 470, 8, c, 1) + k.wall(190, 398, 520, 30, k.dk(c, 0.12), 3303) +
      k.gate(330, 398, 80, 46, k.dk(c, 0.06)) + k.hill(3304, 432, 12, 1.5, g) + k.ground(455, g) + k.tufts(3305, 465, 588, 12, tf);
  }
  /* 1) 히스기야 십사년의 예루살렘(왕하 18:13-16): 아침, 언덕 위의 성과 여호와의 전 */
  function city() {
    return k.sky('morning') + k.glow(170, 380, 180, '#FFF1C8', 0.5) + k.cloud(640, 150, 0.9, '#FBF7EE') + jer('#A8B49A', '#B8A47C', '#D9BC8C', '#A8A460', '#7E8C4A') + k.rocks(3306, 480, 575, 5, '#9A8A66', 500, 820);
  }
  /* 2) 윗못 수도 곁 세탁자의 밭에 있는 큰 길(왕하 18:17): 못, 수도, 밭, 넓은 길, 성벽. 군대는 그리지 않는다 */
  function conduit() {
    return k.sky('noon') + k.cloud(300, 150, 1, '#FBF7EE') + k.hill(3311, 300, 20, 0.7, '#B4BEB4') + k.town(3312, 620, 318, 420, 7, '#D6BA8C', 0.8) + k.wall(380, 356, 540, 44, '#C6A676', 3313) +
      k.ground(356, '#BFB06E') + k.R(0, 372, 900, 70, '#C8BC7C') + k.road(640, 600, 330, 560, 356, 60, '#E4D2A8', -30, '#BEA476') +
      k.E(215, 404, 118, 30, '#B8A684') + k.E(215, 402, 100, 22, '#6FB0C0') + k.E(200, 398, 50, 6, '#CDEBE4', ' class="ea-shim" opacity=".6"') +
      k.P('M300,414 L318,398 Q420,420 470,500 Q500,550 505,600 L462,600 Q456,552 430,510 Q390,440 300,414 Z', '#B8A684') + k.P('M312,408 Q408,430 452,506 Q478,552 484,600', 'none', ' stroke="#6FB0C0" stroke-width="12"') +
      k.rocks(3314, 470, 575, 5, '#A08E6A', 110, 330) + k.tufts(3315, 440, 588, 10, '#7E8C4A', 110, 420);
  }
  /* 3) 성 위(왕하 18:26): 빈 성벽과 성가퀴. 백성과 랍사게는 그리지 않는다 */
  function onWall() {
    var c = '#C8A878', o = '', d = '', i, j, x;
    for (i = 0; i < 17; i++) { x = i * 56 - 10; o += k.P('M' + x + ',' + k.f1(198 + x * 0.1) + ' v-22 l34,3.4 v22 Z', k.lt(c, 0.25)); }
    for (j = 0; j < 7; j++) { d += 'M0,' + (270 + j * 44) + ' l900,88'; for (i = 0; i < 8; i++) { x = i * 120 + (j % 2) * 60 + 20; d += 'M' + x + ',' + k.f1(270 + j * 44 + x * 0.098) + ' v44'; } }
    o += k.P(d, 'none', ' stroke="' + k.dk(c, 0.3) + '" stroke-width="3" opacity=".22"');
    return k.sky('day') + k.cloud(250, 130, 1.2, '#FBF7EE') + k.cloud(650, 170, 0.8, '#FBF7EE') + k.P('M0,214 L900,300 L900,600 L0,600 Z', k.lg([c, k.dk(c, 0.25)])) + k.P('M0,196 L900,286 L900,304 L0,218 Z', k.lt(c, 0.25)) +
      k.P('M0,218 L900,304 L900,314 L0,230 Z', k.dk(c, 0.3), k.op(0.3)) + o + k.ground(556, '#A8945E') + k.hill(3323, 560, 6, 2, '#A8945E') + k.tufts(3322, 545, 596, 12, '#7E8448');
  }
  function court(skyName, fl) { return k.sky(skyName) + k.hill(3331, 330, 20, 0.8, '#B4B8A4') + k.R(0, 336, 900, 36, '#D2B88A') + k.R(0, 332, 900, 6, '#E2CCA2') + k.ground(372, fl) + k.R(0, 372, 900, 10, '#B89A6A', k.op(0.4)); }
  /* 4) 히스기야가 여호와의 전에 들어감(왕하 19:1): 전 앞뜰. 굵은 베와 찢은 옷은 그리지 않는다 */
  function house() { return court('gold', '#D6BE94') + k.temple(450, 440, 1.8, '#E2CC9C'); }
  /* 5) 편지를 여호와 앞에 펴 놓음(왕하 19:14): 전 앞 바닥의 편 두루마리. 글자 없음 */
  function letter() {
    return court('day', '#DCC8A0') + k.temple(450, 404, 2.2, '#E6D2A2') + k.R(0, 404, 900, 196, k.lg(['#DCC8A0', '#C4AC80'])) + k.R(0, 404, 900, 8, '#B89A6A', k.op(0.4)) + k.scroll(450, 462, 2.0, true);
  }
  /* 6) "이 성을 보호하여 구원하리라", 오던 길(왕하 19:32-34): 예루살렘과 멀어지는 빈 길. 활과 토성은 그리지 않는다 */
  function guard() {
    return grad(['#6E86A8', '#C4C6C8', '#F0DCB8']) + k.cloud(620, 150, 1.1, '#EEEAE0') + jer('#9CA4AC', '#A89C80', '#CCB48C', '#9E9A64', '#767E4A') +
      k.road(620, 600, 220, 330, 410, 18, '#DCCBA2', -90) + k.rocks(3352, 480, 575, 5, '#948868', 120, 380);
  }
  /* 7) 아침에 일찍(왕하 19:35-36): 새벽 하늘빛, 빈 들과 돌아간 길. 진과 주검, 여호와의 사자는 그리지 않는다 */
  function morning() {
    return k.sky('dawn') + k.hill(3361, 322, 24, 0.6, '#9C9AB4') + k.hill(3362, 364, 16, 1.0, '#B4A88E') + k.E(520, 372, 420, 12, '#FBF1DC', k.op(0.5)) + k.ground(384, '#BEAE78') +
      k.E(300, 402, 360, 10, '#FBF1DC', k.op(0.4)) + k.hill(3363, 430, 10, 1.5, '#B2A46C') + k.road(520, 600, 240, 640, 372, 10, '#DCCBA2', 110, '#B8A27A') + k.stubble(3364, 420, 590, 50, '#8E8A52') +
      k.rocks(3365, 460, 575, 6, '#9C8E70', 110, 400) + k.tufts(3366, 440, 588, 14, '#84884E');
  }
  SA.reg('OT-33', { beats: [city, conduit, onWall, house, letter, guard, morning], arrive: 0, end: 6 });
})();

/* ── OT-34 요시야와 율법책 (왕하 22:1-23:3) ──
 * 그린 것과 근거: 예루살렘(왕하 22:1)과 여호와의 전(22:3-5. 전의 생김새는 왕상 6:2-5, 7:15-21의 본채·낭실·두 기둥까지만, 멀리) · 전을 고치려고 산 재목과 다듬은 돌(22:6)
 * · 율법책, 곧 언약책(22:8, 23:2. 두루마리 하나, 빛나게 꾸미지 않고 글자도 그리지 않는다) · 왕 앞에서 읽음(22:10. 방의 생김새는 본문에 없어 벽·창·낮은 상만)
 * · 예루살렘 둘째 구역(22:14. 집들만) · 여호와의 전과 왕이 선 대(23:2-3. 대의 생김새는 본문에 없어 낮은 돌단으로 단순하게. 층계는 본문에 없어 그리지 않음).
 * 그리지 않은 것: 사람(요시야, 힐기야, 사반, 훌다, 백성), 찢은 옷, 우상과 산당, 전의 안쪽(지성소·궤), 은을 담은 궤(이 본문에 없음). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  /* 1) 예루살렘(왕하 22:1): 언덕 위의 성과 여호와의 전 */
  function city() {
    return k.sky('day') + k.cloud(230, 150, 1, '#FBF7EE') + k.cloud(690, 200, 0.7, '#FBF7EE') + k.hill(341, 350, 30, 0.7, '#A8B49A') + k.mount(450, 430, 760, 130, '#B8A47C') +
      k.temple(450, 318, 0.7, '#E6D2A2') + k.town(342, 450, 372, 470, 8, '#D9BC8C', 1) + k.wall(190, 398, 520, 30, '#C9A878', 343) + k.gate(330, 398, 80, 46, '#D0B080') +
      k.hill(344, 430, 14, 1.6, '#9AA86A') + k.ground(455, '#A8A460') + k.tree(160, 480, 1.0, '#6B4426', '#6F8448', '#8FA65A') + k.tree(760, 500, 1.2, '#6B4426', '#6F8448', '#8FA65A') + k.tufts(345, 470, 585, 12, '#7E8C4A');
  }
  function court(skyName, fl) { return k.sky(skyName) + k.hill(346, 330, 20, 0.8, '#B4B8A4') + k.R(0, 336, 900, 36, '#D2B88A') + k.R(0, 332, 900, 6, '#E2CCA2') + k.ground(372, fl || '#DCC8A0') + k.R(0, 372, 900, 10, '#B89A6A', k.op(0.4)); }
  /* 2) 여호와의 전을 고침(왕하 22:5-6): 재목과 다듬은 돌. 22:6은 그것을 사서 고치라는 왕의 명령의 내용이다 */
  function repair() {
    return court('morning') + k.temple(330, 420, 1.35, '#E6D2A2') + k.timber(610, 500, 1.15, '#A8743E') + k.blocks(700, 448, 0.95, '#D9CDB4') + k.blocks(170, 505, 0.8, '#D9CDB4');
  }
  function chamber(skyc, wallc) { return k.room(wallc || '#C9AE84', '#A8845A', 420, { win: [610, 130, 120, 170], sky: skyc || '#CDEBE4' }) + k.column(170, 420, 30, 300, '#B89A70'); }
  /* 3) 사반이 왕 앞에서 그 책을 읽음(왕하 22:10): 상 위의 두루마리 하나. 책을 발견한 자리는 본문에 없어 그리지 않는다 */
  function book() { return chamber() + k.table(440, 500, 300, 60, '#8A5E36') + k.scroll(440, 430, 2.0, false); }
  /* 4) 왕이 율법책의 말을 들음(왕하 22:10-11): 같은 방, 펼쳐 읽은 두루마리 */
  function heard() { return chamber('#D6EEE4', '#C2A67C') + k.table(440, 500, 300, 60, '#8A5E36') + k.scroll(440, 430, 2.0, true); }
  function quarter(skyName, c, far) {
    return k.sky(skyName) + k.hill(348, 320, 20, 0.9, far) + k.town(349, 450, 372, 720, 9, c, 1.2) + k.ground(372, k.mix(c, '#9A6238', 0.25)) +
      k.house(120, 498, 240, 150, k.lt(c, 0.08), { doorAt: 0.5, stairs: true }) + k.house(560, 486, 230, 128, c, { doorAt: 0.25 }) + k.road(450, 600, 170, 450, 392, 70, k.lt(c, 0.3), 0);
  }
  /* 5) 예루살렘 둘째 구역(왕하 22:14): 집들이 선 골목 */
  function second() { return quarter('day', '#D6B484', '#A8B49A'); }
  /* 6) 사람들이 돌아가 왕에게 알림(왕하 22:20): 같은 구역에서 올려다본 전 쪽. 재앙을 그림으로 보이지 않게 차분한 늦은 볕 */
  function back() { return k.sky('gold') + k.mount(450, 420, 700, 150, '#A8906E') + k.temple(450, 290, 0.8, '#E2C898') + k.town(350, 450, 380, 720, 9, '#CFA878', 1.15) + k.ground(380, '#B08A5E') + k.road(450, 600, 220, 450, 396, 60, '#D8BE94', 0) + k.house(90, 520, 230, 150, '#C89E6E', { doorAt: 0.5 }) + k.house(610, 510, 220, 130, '#BC9264', { doorAt: 0.3 }); }
  /* 7) 여호와의 전에 올라가 언약책을 읽고 대 위에서 언약을 세움(왕하 23:2-3): 전 앞뜰, 낮은 돌단(대). 층계와 성가퀴는 본문에 없어 그리지 않는다 */
  function covenant() {
    return court('day') + k.cloud(700, 150, 0.9, '#FBF7EE') + k.temple(450, 404, 1.45, '#E6D2A2') +
      k.E(640, 506, 86, 10, '#16233F', k.op(0.18)) + k.R(566, 468, 148, 36, '#CDB68C', ' rx="4"') + k.R(566, 468, 148, 7, '#E6D6B4', ' rx="3"') + k.R(660, 468, 54, 36, '#A88A5E', ' rx="4" opacity=".4"');
  }
  SA.reg('OT-34', { beats: [city, repair, book, heard, second, back, covenant], arrive: 0, end: 6 });
})();

/* ── OT-35 예루살렘이 무너지고 바벨론으로 끌려감 (왕하 25:1-21) ──
 * 그린 것과 근거: 예루살렘 성과 성벽(왕하 25:1, 25:4. 에워싸이기 전의 성. 여호와의 전은 25:9, 생김새는 OT-34와 같게 멀리)
 * · 밤중의 두 성벽 사이 길과 곁문, 왕의 동산(25:4. 동산은 담 위로 나무 윗부분만) · 여리고 평지와 아라바 길(25:4-5)
 * · 헐린 사면 성벽의 돌무더기와 빈 터(25:9-10. 사건 뒤의 풍경. 불·연기 없음) · 남겨 둔 땅의 포도원과 거둔 뒤의 밭(25:12. 오월 25:8)
 * · 전이 있던 산 위의 빈 터(25:13. 기구는 그리지 않음) · 그 땅을 떠나는 빈 길(25:21 "본토에서 떠났더라").
 * 그리지 않은 것: 사람, 군대·진·토성(25:1), 성벽에 뚫린 구멍, 불타는 전·궁·집과 연기, 헐리는 순간, 사슬(25:7), 놋기둥·받침·놋바다와 그릇들(25:13-17), 언약궤, 립나의 일(25:6-7, 25:21). */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  function zion(c) { return k.hill(3501, 350, 30, 0.7, '#A8B49A') + k.mount(450, 430, 760, 130, c); }
  function fore(c, t) { return k.hill(3502, 430, 14, 1.6, c) + k.ground(455, k.dk(c, 0.06)) + k.rocks(3503, 485, 585, 7, '#B8A88A') + k.tufts(3504, 470, 585, 12, t); }
  /* 헐린 돌무더기: 낮은 돌과 기운 돌덩이 */
  function rubble(seed, x0, x1, y, n, c) {
    var r = k.rng(seed), o = '', i, x, s;
    for (i = 0; i < n; i++) {
      x = x0 + (i + r() * 0.8) / n * (x1 - x0); s = 0.6 + r() * 0.9;
      o += i % 3 ? k.rock(x, y + r() * 12, 34 * s, 15 * s, i % 2 ? c : k.lt(c, 0.12)) : k.R(x, y - 10 * s + r() * 8, 26 * s, 11 * s, k.dk(c, 0.1), ' transform="rotate(' + k.f1(r() * 30 - 15) + ' ' + k.f1(x) + ' ' + y + ')"');
    }
    return o;
  }
  /* 1) 예루살렘 성(왕하 25:1-2): 에워싸이기 전의 성과 성벽. 군대와 토성은 그리지 않는다 */
  function city() {
    return k.sky('noon') + k.cloud(240, 150, 1, '#FBF7EE') + k.cloud(680, 200, 0.7, '#FBF7EE') + zion('#B8A47C') + k.temple(450, 318, 0.7, '#E6D2A2') + k.town(3505, 450, 372, 470, 8, '#D9BC8C', 1) +
      k.wall(190, 398, 520, 30, '#C9A878', 3506) + k.gate(330, 398, 80, 46, '#D0B080') + fore('#9AA86A', '#7E8C4A');
  }
  /* 2) 밤중에 두 성벽 사이 왕의 동산 곁문 길(왕하 25:4): 두 벽 사이의 빈 길과 끝의 작은 문 */
  function between() {
    var w = '#4A4E6E', d = '#34385A', g = '#3A5A50', o = k.sky('night') + k.stars(3507, 46, 250) + k.hill(3508, 300, 22, 0.8, '#2A3358');
    o += k.E(612, 262, 36, 22, g) + k.E(668, 240, 40, 26, k.lt(g, 0.1)) + k.E(728, 214, 42, 26, g);
    o += k.P('M900,150 L540,300 L540,410 L900,600 Z', w) + k.P('M900,150 L540,300 L540,312 L900,170 Z', k.lt(w, 0.14)) + k.P('M0,120 L360,300 L360,410 L0,600 Z', d) + k.P('M0,120 L360,300 L360,312 L0,142 Z', k.lt(d, 0.14));
    o += k.R(360, 300, 180, 110, k.mix(w, d, 0.5)) + k.R(360, 300, 180, 9, k.lt(w, 0.14)) + k.P('M424,410 v-58 q26,-26 52,0 v58 Z', '#1A2140');
    o += k.P('M0,600 L360,410 L540,410 L900,600 Z', '#3C3F5C') + k.road(450, 600, 300, 450, 410, 50, '#56587A', 0) + k.rocks(3509, 470, 590, 5, '#4E5274', 250, 650);
    return o;
  }
  /* 3) 여리고 평지와 아라바 길(왕하 25:4-5): 넓은 평지와 빈 길. 쫓는 군사와 잡힌 왕은 그리지 않는다 */
  function plain() {
    return k.sky('dry') + k.hill(3510, 286, 16, 0.6, '#B4B4B0') + k.hill(3511, 306, 8, 0.5, '#C2B694') + k.ground(318, k.lg(['#D6C294', '#C2A46E'])) + k.R(0, 340, 900, 5, '#B89C68', k.op(0.5)) + k.R(0, 372, 900, 7, '#B4965E', k.op(0.4)) +
      k.road(380, 600, 230, 600, 320, 14, '#E2D2A8', -120, '#C8B080') + k.rocks(3512, 380, 580, 9, '#B8A27A') + k.tufts(3513, 350, 585, 16, '#9A9458');
  }
  /* 4) 헐린 사면 성벽과 빈 터(왕하 25:9-10): 사건 뒤의 풍경. 불과 연기는 그리지 않고 하늘도 붉게 하지 않는다 */
  function ruins() {
    return k.sky('grey') + k.cloud(300, 160, 1.1, '#E4E2DA') + zion('#A89A7E') + k.E(450, 356, 250, 26, '#94866C', k.op(0.5)) + rubble(3514, 250, 650, 352, 9, '#B0A48C') +
      k.R(196, 384, 60, 14, '#B8A27C') + k.R(420, 380, 44, 18, '#B8A27C') + k.R(640, 386, 66, 12, '#B8A27C') + rubble(3515, 190, 710, 398, 16, '#BCA884') + fore('#98A070', '#7E8650');
  }
  /* 5) 그 땅에 남겨 둔 포도원과 밭(왕하 25:12): 비탈의 포도나무 줄과 거둔 뒤의 밭(오월, 25:8) */
  function vines() {
    var o = k.sky('morning') + k.cloud(620, 160, 0.9, '#FBF7EE') + k.hill(3516, 300, 26, 0.7, '#A8B8A4') + k.hill(3517, 350, 20, 1.0, '#A8A870') + k.ground(372, k.lg(['#B49A62', '#9A7C4A'])), r = k.rng(3518), row, i;
    for (row = 0; row < 5; row++) {
      var y = 392 + row * 24 + row * row * 3, s = 0.6 + row * 0.2;
      o += k.R(0, y - 2, 410, 5 * s, '#86683C', k.op(0.5));
      for (i = 0; i < 12; i++) { var x = 20 + i * 44 * (0.9 + row * 0.07) + r() * 10; if (x < 390) o += k.E(x, y - 9 * s, 17 * s, 10 * s, i % 2 ? '#5E7A3E' : '#6F8448') + k.E(x - 4 * s, y - 13 * s, 8 * s, 5 * s, '#8FA65A'); }
    }
    return o + k.stubble(3519, 388, 590, 110, '#6E5430', 430, 900) + k.tufts(3520, 500, 590, 6, '#6F8448', 400, 600);
  }
  /* 6) 여호와의 전이 있던 자리(왕하 25:13): 같은 산 위의 빈 터. 깨뜨려 가져간 기구는 그리지 않는다 */
  function court() {
    return k.sky('dry') + k.cloud(620, 190, 0.9, '#EEE8DA') + zion('#A89A7E') + k.R(360, 296, 180, 9, '#C8BA9A') + k.R(360, 303, 180, 3, '#94866C', k.op(0.5)) + rubble(3523, 230, 670, 372, 10, '#B0A48C') + fore('#98A070', '#7E8650');
  }
  /* 7) 유다가 그 땅을 떠남(왕하 25:21): 먼 땅으로 이어지는 빈 길. 끌려가는 사람과 립나의 일은 그리지 않는다 */
  function away() {
    return k.sky('grey') + k.mount(250, 372, 620, 120, '#8E96A8') + k.mount(680, 380, 560, 90, '#A09CA4') + k.hill(3526, 368, 14, 0.9, '#B09A78') + k.ground(392, k.lg(['#C4A672', '#A88654'])) +
      k.road(520, 600, 250, 380, 384, 12, '#E0C898', 130, '#BC9E68') + k.rocks(3527, 420, 585, 8, '#A88E66') + k.tufts(3528, 410, 585, 12, '#8A8048');
  }
  SA.reg('OT-35', { beats: [city, between, plain, ruins, vines, court, away], arrive: 0, end: 6 });
})();

/* ── OT-37 고레스의 조서와 성전을 다시 지음 (스 1:1-11, 3:8-13, 6:14-18) ──
 * 그린 것과 근거: 고레스의 조서(스 1:1. 말아 둔 두루마리 하나, 글자 없음. 방은 본문에 없어 벽·창·낮은 상만, 빛줄기 없음) · 둘레 사람들이 도운 은그릇과 황금과 기타 물건(1:6)
 * · 여호와의 전 기명 금반·은반·금대접·은대접(1:7-10. 세어 놓은 줄로) · 예루살렘 하나님의 전 터에 놓인 지대(3:8, 3:10-12. 돌의 크기·모양은 본문에 없어 낮은 돌 한 켜로)
 * · 필역한 전(6:15)과 봉헌한 하나님의 전(6:16. 생김새는 본문에 없어 OT-34의 전과 같은 윤곽의 본채·곁채·문만, 더 작게. 솔로몬의 두 놋기둥은 왕하 25:13에 가져갔으므로 그리지 않음).
 * 그리지 않은 것: 사람(고레스, 세스바살, 스룹바벨, 예수아, 제사장, 노인들, 백성), 바사 왕궁과 신들의 당(1:7), 짐승(1:6)과 제물(6:17), 칼(1:9), 나팔·제금·예복(3:10), 바벨론에서 오는 길의 풍경, 전의 안쪽과 기구·단. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, GO = '#E2B84A', SI = '#C9D0D6', ST = '#D9CDB4';
  /* 대접(우묵한 그릇)과 반(넓은 접시) */
  function bowl(x, y, s, c) {
    return k.E(x, y + 1, 17 * s, 3.5 * s, '#16233F', k.op(0.2)) + k.P('M' + k.f1(x - 19 * s) + ',' + k.f1(y - 15 * s) + ' Q' + k.f1(x - 16 * s) + ',' + y + ' ' + k.f1(x - 6 * s) + ',' + y + ' L' + k.f1(x + 6 * s) + ',' + y + ' Q' + k.f1(x + 16 * s) + ',' + y + ' ' + k.f1(x + 19 * s) + ',' + k.f1(y - 15 * s) + ' Z', c) +
      k.E(x, y - 15 * s, 19 * s, 4.5 * s, k.lt(c, 0.3)) + k.E(x, y - 14.5 * s, 14 * s, 3 * s, k.dk(c, 0.3), k.op(0.5));
  }
  function dish(x, y, s, c) { return k.E(x, y + 2 * s, 24 * s, 5 * s, '#16233F', k.op(0.2)) + k.E(x, y, 24 * s, 6 * s, c) + k.E(x, y - 1 * s, 16 * s, 3.6 * s, k.dk(c, 0.25), k.op(0.45)) + k.E(x - 6 * s, y - 2 * s, 8 * s, 1.4 * s, k.lt(c, 0.5), k.op(0.7)); }
  /* 놓인 지대: 낮은 돌 한 켜가 네모로 둘린 자리 */
  function base(x, y, s) {
    var o = k.E(x, y + 3 * s, 150 * s, 12 * s, '#16233F', k.op(0.16)) + k.P('M' + k.f1(x - 100 * s) + ',' + k.f1(y - 44 * s) + ' L' + k.f1(x + 100 * s) + ',' + k.f1(y - 44 * s) + ' L' + k.f1(x + 130 * s) + ',' + y + ' L' + k.f1(x - 130 * s) + ',' + y + ' Z', '#A8926A'), i;
    for (i = 0; i < 8; i++) o += k.R(x - 100 * s + i * 25 * s, y - 52 * s, 24 * s, 9 * s, i % 2 ? ST : k.lt(ST, 0.15));
    o += k.P('M' + k.f1(x - 100 * s) + ',' + k.f1(y - 52 * s) + ' l' + k.f1(-30 * s) + ',' + k.f1(40 * s) + ' v' + k.f1(12 * s) + ' l' + k.f1(30 * s) + ',' + k.f1(-43 * s) + ' Z', k.dk(ST, 0.12)) + k.P('M' + k.f1(x + 100 * s) + ',' + k.f1(y - 52 * s) + ' l' + k.f1(30 * s) + ',' + k.f1(40 * s) + ' v' + k.f1(12 * s) + ' l' + k.f1(-30 * s) + ',' + k.f1(-43 * s) + ' Z', k.dk(ST, 0.28));
    for (i = 0; i < 8; i++) o += k.R(x - 130 * s + i * 32.5 * s, y - 12 * s, 31.5 * s, 13 * s, i % 2 ? k.lt(ST, 0.15) : ST) + k.R(x - 130 * s + i * 32.5 * s, y - 2 * s, 31.5 * s, 3 * s, k.dk(ST, 0.35), k.op(0.4));
    return o;
  }
  /* 다시 지은 전: 지대 위의 본채·곁채·문만(생김새는 본문에 없음. 두 놋기둥 없음) */
  function hall(x, y, s) {
    var c = '#E2D2AC', d = k.dk(c, 0.3), l = k.lt(c, 0.25), t = 1.6 * s, b = y - 13 * s, o, i;
    o = k.E(x, y + 3 * s, 150 * s, 12 * s, '#16233F', k.op(0.16)) + k.R(x - 130 * s, b, 260 * s, 13 * s, ST) + k.R(x - 130 * s, y - 3 * s, 260 * s, 3 * s, k.dk(ST, 0.35), k.op(0.4)) +
      k.R(x - 62 * t, b - 46 * t, 124 * t, 46 * t, k.mix(c, d, 0.22)) + k.R(x - 65 * t, b - 49 * t, 130 * t, 5 * t, l, ' rx="2"') + k.R(x - 36 * t, b - 104 * t, 72 * t, 104 * t, c) + k.R(x + 12 * t, b - 104 * t, 24 * t, 104 * t, d, k.op(0.3)) + k.R(x - 39 * t, b - 108 * t, 78 * t, 6 * t, l, ' rx="2"');
    for (i = 1; i < 5; i++) o += k.R(x - 36 * t, b - i * 21 * t, 72 * t, 1.2 * t, d, k.op(0.22));
    return o + k.R(x - 12 * t, b - 56 * t, 24 * t, 56 * t, k.dk(c, 0.6));
  }
  /* 1) 고레스의 조서(스 1:1): 낮은 상 위의 말아 둔 두루마리. 왕궁과 왕은 그리지 않는다 */
  function decree() { return k.room('#BDAA8C', '#9A7E5C', 420, { win: [150, 130, 120, 170], sky: '#D6EEE4', beam: false }) + k.table(480, 500, 300, 60, '#8A5E36') + k.scroll(480, 430, 2.1, false); }
  /* 2) 둘레 사람들이 도운 은그릇과 황금과 기타 물건(스 1:6): 짐승은 그리지 않는다 */
  function gifts() {
    return k.sky('morning') + k.cloud(300, 170, 0.9, '#FBF7EE') + k.hill(3701, 310, 24, 0.8, '#B4BCA8') + k.hill(3702, 350, 14, 1.2, '#C2B48A') + k.ground(366, k.lg(['#D2BC8E', '#B89A68'])) + k.rocks(3703, 380, 400, 4, '#B8A27A') +
      k.basket(620, 420, 1.6, '#9A7242', SI) + k.basket(290, 452, 2.4, '#A87E4A', GO) + bowl(540, 462, 2.2, SI) + bowl(420, 468, 1.6, SI) + bowl(640, 466, 1.5, SI) + k.tufts(3704, 480, 585, 10, '#8A8650');
  }
  /* 3) 꺼내어 세어 넘긴 여호와의 전 기명(스 1:7-10): 금반·은반·금대접·은대접. 수효 그대로는 그리지 못해 줄만 */
  function vessels() {
    var o = k.room('#8E8072', '#B8A486', 250), i;
    for (i = 0; i < 9; i++) o += dish(150 + i * 75, 300, 0.9, i < 2 ? GO : SI);
    for (i = 0; i < 7; i++) o += bowl(165 + i * 95, 368, 1.5, i < 2 ? GO : SI);
    for (i = 0; i < 5; i++) o += dish(190 + i * 130, 440, 2.1, i < 1 ? GO : SI);
    return o;
  }
  function site(n) { return k.sky(n) + k.hill(3705, 330, 22, 0.8, '#A8B4A4') + k.mount(450, 372, 1500, 56, '#B4A27C') + k.ground(368, k.lg(['#CDB88E', '#B49A6C'])) + k.rocks(3707, 500, 590, 5, '#B8A88A') + k.tufts(3708, 480, 590, 10, '#8A8A52'); }
  function far(n) { return k.sky(n) + k.cloud(230, 150, 1, '#FBF7EE') + k.hill(3709, 350, 30, 0.7, '#A8B49A') + k.mount(450, 430, 760, 130, '#B4A27C') + k.rocks(3710, 396, 404, 9, '#BCA884', 200, 700) + k.hill(3711, 430, 14, 1.6, '#9AA86A') + k.ground(455, '#98A066') + k.tufts(3712, 470, 585, 12, '#7E8C4A'); }
  /* 4) 여호와의 전 지대를 놓음(스 3:10): 산 위 전 터에 놓인 돌 한 켜와 다듬은 돌. 나팔과 제금은 그리지 않는다 */
  function found() { return site('morning') + base(450, 470, 1.7) + k.blocks(730, 420, 0.7, ST); }
  /* 5) 지대가 놓임을 보고 외치는 소리가 멀리 들림(스 3:12-13): 멀리서 본 예루살렘의 전 터와 지대 */
  function heard() { return far('day') + base(450, 332, 0.5); }
  /* 6) 전을 필역함(스 6:15): 같은 터에 선 전을 멀리서 */
  function done() { return far('noon') + k.cloud(650, 190, 0.7, '#FBF7EE') + hall(450, 332, 0.5); }
  /* 7) 하나님의 전 봉헌(스 6:16): 지대 위에 선 전. 제물은 그리지 않는다 */
  function house() { return site('day') + k.cloud(690, 150, 0.9, '#FBF7EE') + hall(450, 470, 1.7); }
  SA.reg('OT-37', { beats: [decree, gifts, vessels, found, heard, done, house], arrive: 0, end: 6 });
})();

/* ── OT-38 에스더 (에 4:1-17, 7:1-10) ──
 * 그린 것과 근거: 대궐 문과 그 앞 성중 광장(에 4:2, 4:6) · 굵은 베와 조금 흩어진 재(4:1. 물건으로만) · 에스더가 보낸 의복과 조서 초본(4:4, 4:8. 글자 없음)
 * · 전갈이 오간 대궐 문(4:6, 4:10. 가까이서) · 왕궁(4:13)과 수산(4:16) · 잔치 자리의 상과 술잔(7:1-2) · 왕궁 후원(7:7. 담과 나무와 길만).
 * 궁과 광장, 후원의 생김새는 본문에 없어 평지붕 건물과 담만 단순하게. 때는 본문에 없어 모두 낮 하늘.
 * 그리지 않은 것: 사람(모르드개, 에스더, 하닥, 왕, 하만), 안뜰과 왕좌와 금홀(4:11은 에스더의 말 속에만 나온다. 5:1-2는 범위 밖), 기둥과 휘장(1:5-6은 범위 밖), 걸상(7:8), 하만의 나무(7:9-10), 바사의 신상·날개 달린 형상, 금식하는 모습, 해·달·별, 빛줄기. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit, WL = '#D8C49C';
  /* 평지붕 궁: 낮고 긴 몸채와 기둥 줄 */
  function palace(x, y, s, c) {
    var o = k.R(x - 150 * s, y - 60 * s, 300 * s, 60 * s, c) + k.R(x - 156 * s, y - 66 * s, 312 * s, 8 * s, k.lt(c, 0.25), ' rx="2"') + k.R(x - 90 * s, y - 96 * s, 180 * s, 32 * s, k.lt(c, 0.08)) + k.R(x - 95 * s, y - 101 * s, 190 * s, 7 * s, k.lt(c, 0.3), ' rx="2"') + k.R(x - 120 * s, y - 46 * s, 240 * s, 46 * s, k.dk(c, 0.4)), i;
    for (i = 0; i < 9; i++) o += k.R(x - 120 * s + i * 28.5 * s, y - 46 * s, 12 * s, 46 * s, k.lt(c, 0.2));
    return o;
  }
  /* 대궐 문과 그 앞 성중 광장(에 4:2, 4:6) */
  function square(n, c) {
    var d = k.dk(c, 0.25), o = k.sky(n) + k.cloud(250, 150, 0.9, '#FBF7EE') + palace(450, 262, 1.05, k.mix(c, '#C9D8E4', 0.3)) + k.R(0, 250, 900, 135, c) + k.R(0, 244, 900, 9, k.lt(c, 0.25)) + k.R(0, 340, 900, 45, d, k.op(0.25));
    o += k.R(350, 190, 200, 195, k.lt(c, 0.06)) + k.R(490, 190, 60, 195, d, k.op(0.3)) + k.R(342, 182, 216, 11, k.lt(c, 0.3), ' rx="2"') + k.P('M398,385 v-112 q52,-50 104,0 v112 Z', k.dk(c, 0.62)) + k.P('M410,385 v-106 q40,-38 80,0 v106 Z', '#7E6A52');
    o += k.ground(385, k.lg(['#D6C6A2', '#BCA47A'])) + k.R(0, 385, 900, 8, '#A88E64', k.op(0.4));
    for (var i = 1; i < 5; i++) o += k.R(0, 385 + i * i * 9, 900, 2, '#A89068', k.op(0.3));
    return o + k.house(-40, 520, 230, 210, k.dk(c, 0.08), { doorAt: 0.6 }) + k.house(720, 510, 240, 190, k.dk(c, 0.14), { doorAt: 0.12 });
  }
  /* 접은 천. rough면 굵은 베(거친 올과 찢긴 가장자리) */
  function cloth(x, y, s, c, rough) {
    var i, t = '';
    if (rough) { for (i = 0; i < 4; i++) t += k.R(x - 44 * s, y - 20 * s + i * 5 * s, 90 * s, 1.5 * s, '#3E3024', k.op(0.35)); t += k.P('M' + k.f1(x + 44 * s) + ',' + y + ' l14,-7 l-9,-5 l12,-8 l-13,-4 Z', c); }
    return k.E(x, y + 2, 50 * s, 7 * s, '#16233F', k.op(0.18)) + k.P('M' + k.f1(x - 46 * s) + ',' + y + ' Q' + k.f1(x - 50 * s) + ',' + k.f1(y - 20 * s) + ' ' + k.f1(x - 30 * s) + ',' + k.f1(y - 24 * s) + ' L' + k.f1(x + 34 * s) + ',' + k.f1(y - 22 * s) + ' Q' + k.f1(x + 50 * s) + ',' + k.f1(y - 16 * s) + ' ' + k.f1(x + 46 * s) + ',' + y + ' Z', c) +
      k.P('M' + k.f1(x - 44 * s) + ',' + k.f1(y - 9 * s) + ' Q' + x + ',' + k.f1(y - 15 * s) + ' ' + k.f1(x + 47 * s) + ',' + k.f1(y - 8 * s) + ' L' + k.f1(x + 46 * s) + ',' + y + ' L' + k.f1(x - 46 * s) + ',' + y + ' Z', k.dk(c, 0.25)) + k.R(x - 30 * s, y - 24 * s, 62 * s, 4 * s, k.lt(c, 0.25), ' rx="2" opacity=".7"') + t;
  }
  /* 1) 대궐 문 앞의 굵은 베와 재(에 4:1-2): 물건으로만. 재는 베 위와 둘레의 옅은 얼룩 */
  function sack() { return square('grey', WL) + k.E(470, 468, 34, 5, '#A8A6A0', k.op(0.4)) + cloth(380, 462, 1.5, '#7A6248', 1) + k.E(360, 432, 30, 5, '#B8B6B0', k.op(0.4)) + k.E(300, 470, 22, 4, '#A8A6A0', k.op(0.4)); }
  /* 2) 에스더가 보낸 의복과 조서 초본(에 4:4, 4:8): 같은 광장 */
  function sent() { return square('day', WL) + cloth(370, 462, 1.5, '#5E78A8') + k.scroll(560, 462, 1.9, false); }
  /* 3) 하닥이 말을 전하러 오간 대궐 문(에 4:6, 4:10): 가까이서 본 빈 문. 안뜰과 금홀은 그리지 않는다 */
  function gate() { return '<g transform="translate(-270,-210) scale(1.6)">' + square('noon', WL) + '</g>'; }
  function susa(n, cx) {
    var c = '#DEC8A0', hz = '#B4BEB4', g = '#B8A06E';
    return k.sky(n) + k.cloud(cx, 150, 1, '#FBF7EE') + k.hill(3802, 300, 18, 0.7, hz) + k.mount(450, 400, 720, 96, k.mix(c, hz, 0.45)) + palace(450, 312, 0.9, c) +
      k.town(3803, 450, 420, 640, 9, k.dk(c, 0.06), 1.1, { haze: hz }) + k.ground(420, g) + k.rocks(3804, 450, 580, 6, k.mix(g, '#FBF7EE', 0.2)) + k.tufts(3805, 440, 585, 12, k.dk(g, 0.25));
  }
  /* 4) "너는 왕궁에 있으니"(에 4:13): 멀리서 본 수산의 왕궁과 성 */
  function far() { return susa('day', 640); }
  /* 5) 수산(에 4:16): 같은 자리. 때는 본문에 없어 낮 하늘에 구름 자리만 다르게 */
  function fast() { return susa('noon', 250); }
  /* 6) 왕후 에스더의 잔치(에 7:1-2): 상과 술잔. 걸상과 사람, 빛줄기는 그리지 않는다 */
  function feast() {
    var o = k.room('#B89A7A', '#9A6E4E', 400, { win: [640, 120, 120, 180], sky: '#CDEBE4', beam: false }) + k.table(430, 492, 380, 66, '#7A5232'), a = [330, 430, 530], i, x;
    for (i = 0; i < 3; i++) { x = a[i]; o += k.R(x - 4, 396, 8, 20, '#C99A3A') + k.E(x, 417, 17, 4, '#B0842E') + k.P('M' + (x - 21) + ',366 Q' + (x - 19) + ',398 ' + x + ',398 Q' + (x + 19) + ',398 ' + (x + 21) + ',366 Z', '#E2B84A') + k.P('M' + (x + 6) + ',398 Q' + (x + 19) + ',396 ' + (x + 21) + ',366 L' + (x + 10) + ',366 Z', '#B0842E', k.op(0.5)) + k.E(x, 366, 21, 5, '#7A2E3E'); }
    return o;
  }
  /* 7) 왕궁 후원(에 7:7): 담과 나무와 길만. 하만의 나무는 그리지 않는다 */
  function garden() {
    return k.sky('day') + k.cloud(600, 150, 0.9, '#FBF7EE') + k.R(0, 236, 900, 140, '#CDB48A') + k.R(0, 228, 900, 10, '#E2D0A8') + k.R(0, 330, 900, 46, '#A88E64', k.op(0.25)) + k.ground(376, k.lg(['#8E9A5A', '#6F8448'])) + k.road(450, 600, 200, 452, 376, 60, '#D8C8A0', 0) +
      k.tree(190, 400, 1.7, '#6B4426', '#5E7A3E', '#7E9A52') + k.tree(730, 410, 1.9, '#6B4426', '#5E7A3E', '#7E9A52') + k.bush(280, 448, 1.3, '#5E7A3E') + k.bush(640, 456, 1.4, '#66823E') + k.tufts(3806, 470, 590, 12, '#566E38');
  }
  SA.reg('OT-38', { beats: [sack, sent, gate, far, fast, feast, garden], arrive: 0, end: 6 });
})();

/* ── OT-40 말라기, 약속을 기다림 (말 3:1, 4:1-6) ──
 * 범위 전체가 여호와의 말씀이고 사건의 장면이 없다. 배경을 꾸미지 않고, 말씀 속에 이름이 나오는 곳만 같은 낮 하늘 아래 꾸밈없이 그린다.
 * 그린 것과 근거: "그 전"(말 3:1. OT-37의 다시 지은 전과 같은 윤곽으로 멀리 작게. 길은 그리지 않음) · 호렙(4:4. 멀리 산 하나, 불·구름 없음) · "그 땅"(4:6. 언덕과 땅만).
 * 4:1-3은 그릴 곳이 본문에 없어 첫 대목의 그림을 그대로, 4:5는 4:6의 땅 그림을 그대로 쓴다(대목마다 뜻을 싣는 풍경을 짓지 않는다).
 * 그리지 않은 것: 사람(사자, 언약의 사자, 모세, 엘리야, 아비와 자녀), 예비할 길(3:1. 말씀 속의 표현), 풀무불과 초개·뿌리와 가지(4:1), 의로운 해와 광선·송아지·외양간(4:2), 재(4:3), 마른 들·푸른 들·새벽·노을 같은 때와 날씨의 대비, 밭과 집, 해·달·별, 불과 빛줄기, 돌판·두루마리. */
(function () {
  'use strict';
  var SA = window.BO3D && BO3D.sceneArt; if (!SA) return;
  var k = SA.kit;
  /* 멀리 보이는 전: 본채·곁채·문만 */
  function hall(x, y, s) {
    var c = '#E2D2AC', d = k.dk(c, 0.3), l = k.lt(c, 0.25);
    return k.R(x - 80 * s, y - 8 * s, 160 * s, 8 * s, '#D9CDB4') + k.R(x - 62 * s, y - 54 * s, 124 * s, 46 * s, k.mix(c, d, 0.22)) + k.R(x - 65 * s, y - 57 * s, 130 * s, 5 * s, l, ' rx="2"') + k.R(x - 36 * s, y - 112 * s, 72 * s, 104 * s, c) +
      k.R(x + 12 * s, y - 112 * s, 24 * s, 104 * s, d, k.op(0.3)) + k.R(x - 39 * s, y - 116 * s, 78 * s, 6 * s, l, ' rx="2"') + k.R(x - 12 * s, y - 64 * s, 24 * s, 56 * s, k.dk(c, 0.6));
  }
  function land(a) { return k.sky('day') + k.cloud(a, 160, 1, '#FBF7EE') + k.hill(4001, 340, 28, 0.7, '#A8B49A') + (a < 400 ? k.mount(450, 420, 760, 110, '#B4A27C') + hall(450, 312, 0.5) : '') + k.hill(4002, 418, 14, 1.3, '#9AA86A') + k.ground(448, '#98A066') + k.rocks(4003, 470, 585, 5, '#B8A88A') + k.tufts(4004, 460, 585, 12, '#7E8C4A'); }
  /* 1~3) "그 전"(말 3:1): 멀리 언덕 위의 전. 길과 사자는 그리지 않는다. 4:1-3은 그릴 곳이 없어 같은 그림 */
  function house() { return land(240); }
  /* 4) 호렙(말 4:4): 멀리 광야의 산. 이 절에 불과 구름이 없으므로 넣지 않는다 */
  function horeb() {
    return k.sky('day') + k.hill(4014, 330, 26, 0.5, '#B4A8A0') + k.mount(470, 392, 800, 205, '#A8826A') + k.mount(200, 396, 420, 110, '#B8947A') + k.mount(760, 398, 380, 90, '#B48E72') + k.hill(4015, 392, 10, 1.1, '#CDAA7C') +
      k.ground(410, k.lg(['#E0C48E', '#C8A46C'])) + k.rocks(4016, 420, 585, 11, '#B8946C') + k.tufts(4017, 430, 585, 6, '#A89858');
  }
  /* 5~6) "그 땅"(말 4:6): 언덕과 땅만. 4:5는 그릴 곳이 없어 같은 그림. 엘리야와 사람, 집과 밭은 그리지 않는다 */
  function earth() { return land(620); }
  SA.reg('OT-40', { beats: [house, house, house, horeb, earth, earth], arrive: 0, end: 5 });
})();
