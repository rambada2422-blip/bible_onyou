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
