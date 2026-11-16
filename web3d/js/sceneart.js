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
