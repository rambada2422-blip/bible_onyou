/* bible_onyou 3D 모델 2 (인물): 이스라엘 백성, 제사장, 백성을 이끄는 사람 (수 3:1-17) */
(function () {
  'use strict';
  var T = window.THREE;
  var BO3D = window.BO3D = window.BO3D || {};
  var K2 = BO3D._jordanKit;
  var PI = K2.PI, TAU = K2.TAU, DEG = K2.DEG;
  var rng = K2.rng, lerp = K2.lerp, clamp = K2.clamp, shade = K2.shade, mat = K2.mat, TR = K2.TR;
  var Builder = K2.Builder, grid = K2.grid, loft = K2.loft, ball = K2.ball, sbox = K2.sbox;
  var tubeAlong = K2.tubeAlong, V = K2.V, displace = K2.displace, lumpy = K2.lumpy;
  var hairCap = K2.hairCap, onEll = K2.onEll;
  var SKINS = K2.SKINS, EYE = K2.EYE, addArm = K2.addArm, solveArm = K2.solveArm, addFoot = K2.addFoot, ext = K2.ext;

  /* ================================================================== 이스라엘 백성 */
  var KINDS = ['man', 'woman', 'boy', 'man', 'woman', 'girl', 'woman', 'man', 'woman', 'man'];
  // 몸통 둘레 나눔(8칸). 앞(90°) 가운데에 좁은 칸(1번)이 있다.
  var ANG8 = [30, 76, 104, 150, 200, 250, 290, 340].map(function (d) { return d * DEG; });
  var FAM = {
    cream: ['#EADBB6', '#DCCBA2', '#E6D2A8'],
    earth: ['#C9A772', '#B58A5C', '#A9774A'],
    ochre: ['#C89A4A', '#B9873C'],
    olive: ['#7C8C52', '#6F8448', '#93A066'],
    indigo: ['#4F5D7A', '#3F4C66', '#5E6F91'],
    russet: ['#9C5438', '#8A4B34', '#A8643F']
  };
  var TUNIC_FAMS = ['cream', 'cream', 'earth', 'earth', 'ochre', 'olive', 'indigo', 'russet'];
  var CLOAK_FAMS = ['earth', 'olive', 'olive', 'indigo', 'indigo', 'russet', 'russet'];
  var HEADCLOTHS = ['#F3EAD4', '#E4D3AC', '#D9C7A0', '#C9B58A', '#BFC5A4', '#A9B4C4', '#D6B08A', '#B9785A'];
  var SASHES = ['#4F5D7A', '#8A4B34', '#6B4526', '#E4D3AC', '#59683C', '#B9873C'];
  var HAIRS = ['#2B211C', '#33261E', '#3D2B20', '#241C1A'];
  var BEARDS = ['#2B211C', '#3A2A20', '#4A372A', '#5E5650', '#33261E'];

  function makeIsraelite(seed) {
    seed = seed | 0;
    var R = rng(seed * 7 + 4001), sm = mat('smooth');
    var pick = function (a) { return a[Math.min(a.length - 1, Math.floor(R() * a.length))]; };
    var kind = KINDS[((seed % 10) + 10) % 10];
    var man = kind === 'man', woman = kind === 'woman', child = !man && !woman, girl = kind === 'girl';
    var H = man ? 1.62 + R() * 0.14 : woman ? 1.55 + R() * 0.11 : 1.1 + R() * 0.18;     // 머리 꼭대기까지(머리쓰개 제외)
    var k = H / 1.73, q = k * (child ? 1.1 : woman ? 0.94 : 1);
    var hy = (child ? 0.1 : 0.087) * H, hx = hy * 0.88, hz = hy * 0.93;
    var headY = H - hy, neckY = headY - hy * 0.96, shY = neckY - 0.062 * k, waistY = (child ? 0.55 : 0.58) * H;
    var sw = 0.2 * q, ua = 0.165 * H, fa = 0.15 * H;
    var skin = pick(SKINS), SK = skin[0], SK_SH = skin[1];

    var tf = pick(TUNIC_FAMS), TUNIC = pick(FAM[tf]), cf = pick(CLOAK_FAMS);
    if (cf === tf) cf = cf === 'olive' ? 'indigo' : 'olive';
    var CLOAK = pick(FAM[cf]);
    var hasCloak = R() < (man ? 0.78 : woman ? 0.55 : 0.25);
    var striped = man && R() < 0.3;
    var SASH = pick(SASHES), CLOTH = pick(HEADCLOTHS);
    var carry = man ? pick(['none', 'none', 'staff', 'staff', 'sack']) : woman ? pick(['none', 'baby', 'baby', 'head', 'sack']) : pick(['none', 'none', 'none', 'sack']);
    var hemY = man ? (0.15 + R() * 0.1) * k : woman ? 0.055 * k : (0.29 + R() * 0.08) * k;
    var hemW = woman ? 1.08 : 1;

    var group = new T.Group(), rig = new T.Group();
    group.add(rig);
    group.userData.height = H;
    group.userData.kind = kind;

    /* --- 몸: 통옷, 허리띠, 겉옷, 머리를 mesh 하나로 --- */
    var b = new Builder();
    var T_SH = shade(TUNIC, 0.86), T_ST = shade(TUNIC, 0.7);
    var rows = [
      [hemY, 0.25 * q * hemW, 0.212 * q * hemW],
      [lerp(hemY, waistY, 0.52), 0.222 * q, 0.188 * q],
      [waistY - 0.03 * k, 0.19 * q, 0.154 * q],
      [waistY + 0.04 * k, 0.194 * q, 0.158 * q],
      [lerp(waistY, shY, 0.6), 0.2 * q, 0.16 * q],
      [shY + 0.005, 0.168 * q, 0.126 * q],
      [neckY + 0.014 * k, 0.07 * q, 0.066 * q]
    ];
    b.add(loft(rows, 8, ANG8), function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / 16), i = Math.floor(ti / 2) % 8;
      if (j === 2) return SASH;
      if (striped) return i % 2 ? T_ST : TUNIC;
      return (i === 3 || i === 6) ? T_SH : TUNIC;
    }, null, [hemY, hemY + 0.5 * k, 0.84]);

    if (hasCloak) {
      // 겉옷(남자·아이: 종아리까지 / 여자: 허리께까지 오는 어깨 덮개). 앞섶은 몸에 붙는다.
      var open = woman ? 52 : 40, nc = 6;
      var chem = woman ? waistY - 0.12 * k : Math.max(hemY + 0.09 * k, 0.24 * k);
      var cr = woman
        ? [[chem, 0.262 * q, 0.214 * q], [lerp(waistY, shY, 0.45), 0.25 * q, 0.2 * q], [shY - 0.05 * k, 0.24 * q, 0.182 * q], [neckY + 0.004, 0.122 * q, 0.104 * q]]
        : [[chem, 0.312 * q, 0.272 * q], [waistY, 0.255 * q, 0.21 * q], [shY - 0.06 * k, 0.244 * q, 0.184 * q], [neckY + 0.004, 0.122 * q, 0.104 * q]];
      var C_SH = shade(CLOAK, 0.8), C_HI = shade(CLOAK, 1.1);
      b.add(grid(nc, cr.length - 1, false, function (u, v, o, ci, j) {
        var r = cr[j], a = (90 + open + u * (360 - 2 * open)) * DEG, edge = Math.pow(Math.abs(u * 2 - 1), 4);
        o.set(r[1] * Math.cos(a) * (1 - 0.15 * edge), r[0], r[2] * Math.sin(a) * (1 - 0.06 * edge) - 0.01 * k);
      }), function (x, y, z, nx, ny, nz, ti) { var c = Math.floor(ti / 2) % nc; return c === 1 || c === 4 ? C_SH : (c === 2 ? C_HI : CLOAK); }, null, [chem, chem + 0.5 * k, 0.85]);
    }

    /* --- 머리 --- */
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    b.add(ball(8, 4), SK, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    [-1, 1].forEach(function (s) { b.add(new T.CircleGeometry(1, 5), EYE, ON(s * 18, child ? -0.06 : 0.02, 0.05, hx * 0.115, hy * (child ? 0.13 : 0.115), 1)); });
    if (man) {
      // 머리쓰개와 머리띠, 수염
      b.add(hairCap(hx, hy, hz, { s: 1.13, sEdge: 1.16, front: 54, side: 158, back: 184, d1: 30, d2: 50, b1: 70, b2: 130, hang: 1, flare: 0.16, flareX: 1.5, backOut: 1.06, nu: 8, nv: 4, ths: [0, 0, 54, 28, 0], tuck: 0.92 }),
        CLOTH, HM(0, 0, 0), [headY - hy * 2.4, headY - hy * 0.2, 0.84]);
      var bandC = pick(['#8A4B34', '#3F4C66', '#6B4526', '#59683C']);
      b.add(loft([[headY + hy * 0.36, hx * 1.1, hz * 1.11], [headY + hy * 0.6, hx * 0.98, hz * 0.99]], 8), bandC);
      b.add(ball(5, 3), pick(BEARDS), HM(0, -hy * 0.7, hz * 0.3, 0.2, 0, 0, hx * 0.84, hy * (0.46 + R() * 0.2), hz * 0.62));
    } else if (woman || girl) {
      // 어깨까지 내려오는 머릿수건
      var L = girl ? 0.8 : 1;
      b.add(hairCap(hx, hy, hz, { s: 1.13, sEdge: 1.17, front: 50, side: 90 + 98 * L, back: 90 + 116 * L, d1: 28, d2: 54, hang: 1, flare: 0.26, flareX: 1.8, backOut: 1.04, nu: 8, nv: 4, ths: [0, 0, 54, 28, 0], tuck: 0.92 }),
        CLOTH, HM(0, 0, 0), [headY - hy * 3, headY - hy * 0.3, 0.84]);
    } else {
      // 사내아이: 맨머리
      b.add(hairCap(hx, hy, hz, { s: 1.12, sEdge: 1.08, front: 52, side: 96, back: 122, d1: 36, d2: 66, hang: 0.3, zig: 3, nu: 8, nv: 4, ths: [0, 0, 52, 27, 0], tuck: 0.9 }), pick(HAIRS), HM(0, 0, 0));
    }

    /* --- 짐 --- */
    var SACK = pick(['#C9B58A', '#B9A27A', '#A98C62', '#D9C7A0']);
    if (carry === 'sack') {
      b.add(displace(ball(5, 3), lumpy(R, 0.1)), function (x, y, z, nx, ny) { return ny < -0.3 ? shade(SACK, 0.78) : SACK; },
        TR(-0.1 * q, shY - 0.14 * k, -0.25 * q, 0.2, 0, 0.15, 0.2 * k, 0.25 * k, 0.16 * k));
    } else if (carry === 'head') {
      b.add(displace(ball(6, 4), lumpy(R, 0.1)), function (x, y, z, nx, ny) { return ny < -0.3 ? shade(SACK, 0.78) : SACK; },
        TR(0, H + 0.115 * k, -0.01, 0, R() * 3, 0, 0.21 * k, 0.13 * k, 0.2 * k));
    } else if (carry === 'baby') {
      // 포대기에 싸서 안은 아기
      var wrap = pick(['#E4D3AC', '#D9C7A0', '#C9B58A']);
      b.add(sbox(0.085 * k, 0.2 * k, 0.085 * k, 0.8, 6, 3), wrap, TR(-0.015 * k, shY - 0.25 * k, 0.185 * q + 0.02, 0.1, 0, 1.0));
      b.add(ball(5, 3), SK, TR(0.155 * k, shY - 0.155 * k, 0.2 * q + 0.02, 0, 0, 0, 0.062 * k, 0.066 * k, 0.064 * k));
    }
    rig.add(b.mesh(sm));

    /* --- 팔 --- */
    var SLEEVE = hasCloak ? CLOAK : TUNIC, S_IN = shade(SLEEVE, 0.6);
    var swing = [1, 1];                          // 왼팔(+X), 오른팔(-X)을 얼마나 흔드는지
    function makeArm(s) {
      var ab = new Builder(), U = V(s * 0.11, -1, 0.02), F = V(s * 0.04, -1, 0.17);
      var idx = s > 0 ? 0 : 1;
      if (carry === 'baby') { U = V(s * 0.1, -1, 0.2); F = V(-s * 0.72, s > 0 ? 0.1 : 0.42, 0.66); swing[idx] = 0; }
      else if (carry === 'head' && s > 0) { U = V(0.62, 0.72, 0.08); F = V(-0.62, 0.78, -0.02); swing[idx] = 0; }
      else if (carry === 'sack' && s < 0) { U = V(-0.12, -1, 0.22); F = V(0.3, 0.92, 0.22); swing[idx] = 0; }
      else if (carry === 'staff' && s < 0) { U = V(-0.1, -1, 0.3); F = V(0.04, -0.28, 1); swing[idx] = 0.28; }
      var a = addArm(ab, { ua: ua, fa: fa, U: U, F: F, r0: 0.07 * q, r1: 0.062 * q, r2: 0.058 * q, nu: 5, cut: 0.97, sleeve: SLEEVE, inner: S_IN, skin: SK, hand: 0.042 * k });
      if (carry === 'staff' && s < 0) {
        var hx_ = a.W.x + a.F.x * 0.03 * k, hz_ = a.W.z + a.F.z * 0.03 * k;
        ab.add(tubeAlong([V(hx_, -shY + 0.02, hz_ + 0.02), V(hx_, a.W.y + 0.34 * k, hz_ - 0.01)], 0.017 * k, 0.014 * k, 4, true), '#6B4526');
      }
      var m = ab.mesh(sm);
      m.position.set(s * sw, shY, 0);
      rig.add(m);
      return m;
    }
    var armL = makeArm(1), armR = makeArm(-1);

    /* --- 발 --- */
    var footX = 0.085 * q;
    function makeFoot(s) {
      var fb = new Builder();
      addFoot(fb, k, SK, SK_SH, woman ? 0 : hemY + 0.1 * k, false);
      var m = fb.mesh(sm);
      m.rotation.y = s * 0.16;
      group.add(m);
      return m;
    }
    var footL = makeFoot(1), footR = makeFoot(-1);

    /* --- 움직임 --- */
    var st = { t: R() * 10, ph: R() * TAU, w: 0 };
    var stride = 0.78 * H, stepHalf = 0.17 * k, liftH = 0.05 * k;
    function update(dt, speed) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      speed = Math.abs(speed || 0);
      st.t += dt;
      st.w += ((speed > 0.03 ? 1 : 0) - st.w) * Math.min(1, dt * 8);
      st.ph += dt * speed / stride * TAU;
      var w = st.w, s = Math.sin(st.ph), c = Math.cos(st.ph), br = Math.sin(st.t * 1.6);
      var amp = clamp(speed / 1.1, 0.5, 1.25);
      footL.position.set(footX, Math.max(0, c) * liftH * w, stepHalf * amp * s * w);
      footR.position.set(-footX, Math.max(0, -c) * liftH * w, -stepHalf * amp * s * w);
      footL.rotation.x = -0.2 * s * w;
      footR.rotation.x = 0.2 * s * w;
      rig.position.y = 0.016 * k * Math.abs(c) * w;
      rig.rotation.set(0.035 * w + 0.005 * br * (1 - w), 0.07 * s * w, 0.018 * c * w);
      var A = 0.4 * amp * w;
      armL.rotation.x = swing[0] * A * s + 0.012 * br * swing[0];
      armR.rotation.x = -swing[1] * A * s + 0.012 * br * swing[1];
    }
    update(0, 0);
    return { group: group, update: update };
  }

  /* ================================================================== 제사장(단순판) */
  var LINEN = '#F6F1E4', LINEN_SH = '#DFD7C4', LINEN_DP = '#C9BFA8';
  var SASH_BLUE = '#3B5FAE', SASH_PURPLE = '#6E3F93', SASH_SCARLET = '#C5372F';
  var _priestCount = 0;

  function makePriest(side) {
    var s = (side === 'R' || side === 'r') ? -1 : 1;        // 채를 메는 어깨: 'L' = +X(왼어깨), 'R' = -X(오른어깨)
    var sm = mat('smooth'), group = new T.Group(), rig = new T.Group();
    group.add(rig);
    var v = _priestCount++ % 4;                              // 네 사람이 조금씩 다르게(피부, 수염 빛깔). 키와 어깨 높이는 같다.
    var H = 1.71, k = H / 1.73, hy = 0.086 * H, hx = hy * 0.88, hz = hy * 0.93;
    var headY = H - hy, neckY = headY - hy * 0.97, shY = neckY - 0.125 * k, waistY = 0.58 * H;      // 채가 턱 아래에 놓이도록 어깨를 조금 낮게 잡았다
    var sw = 0.2 * k, ua = 0.168 * H, fa = 0.152 * H;
    var SK = SKINS[v][0], SK_SH = SKINS[v][1], HAIR = HAIRS[v], BEARD = BEARDS[v === 3 ? 4 : v];
    var poleR = 0.028, poleX = s * 0.186 * k, poleY = shY + 0.064 * k;

    /* --- 몸: 발목까지 오는 흰 세마포 통옷, 청색·자색·홍색 띠 --- */
    var b = new Builder(), nu = 12;
    var rows = [
      [0.045, 0.252 * k, 0.216 * k],
      [lerp(0.045, waistY, 0.5), 0.224 * k, 0.19 * k],
      [waistY - 0.035 * k, 0.189 * k, 0.153 * k],
      [waistY + 0.04 * k, 0.192 * k, 0.156 * k],
      [lerp(waistY, shY, 0.6), 0.2 * k, 0.16 * k],
      [shY + 0.005, 0.172 * k, 0.13 * k],
      [shY + 0.07 * k, 0.12 * k, 0.1 * k],
      [neckY + 0.012 * k, 0.07 * k, 0.066 * k]
    ];
    b.add(loft(rows, nu), function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / (2 * nu)), i = Math.floor(ti / 2) % nu;
      if (j === 2) return LINEN_SH;
      return i % 3 === 1 ? LINEN_SH : LINEN;
    }, null, [0.05, 0.6, 0.88]);
    // 띠: 세 가지 색 실이 섞여 짜인 모습(둘레를 따라 색이 번갈아 나온다)
    var SASH3 = [SASH_BLUE, SASH_PURPLE, SASH_SCARLET];
    b.add(loft([[waistY - 0.042 * k, 0.2 * k, 0.164 * k], [waistY + 0.046 * k, 0.203 * k, 0.167 * k]], 12),
      function (x, y, z, nx, ny, nz, ti) { return SASH3[Math.floor(ti / 2) % 3]; });
    // 띠의 늘어진 끝자락 두 가닥
    [[0.05, 0.0, 0.3], [0.1, 0.035, 0.24]].forEach(function (e, n) {
      b.add(grid(1, 3, false, function (u, vv, o) {
        o.set(e[0] * k + (u - 0.5) * 0.046 * k + (1 - vv) * 0.012 * n, waistY - e[2] * k * (1 - vv) - 0.01, 0.172 * k - e[1] * k + 0.02 * k * (1 - vv) * (1 - vv));
      }), function (x, y, z, nx, ny, nz, ti) { return SASH3[(Math.floor(ti / 2) + n) % 3]; });
    });
    b.add(new T.CylinderGeometry(0.056 * k, 0.06 * k, 0.1 * k, 6, 1, true), SK_SH, TR(0, neckY + 0.03 * k, 0.004));

    /* --- 머리: 채 반대쪽으로 조금 기울였다 --- */
    var tilt = TR(0, neckY, 0, 0, 0, s * 0.1).multiply(TR(0, -neckY, 0));
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return tilt.clone().multiply(TR(x, headY + y, z, rx, ry, rz, sx, sy, sz)); };
    var ON = function (a, yf, lift, sx, sy, sz) { return tilt.clone().multiply(onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz)); };
    b.add(ball(10, 6), SK, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    b.add(ball(4, 2), SK_SH, ON(0, -0.1, 0, hx * 0.13, hy * 0.17, hz * 0.16));
    [-1, 1].forEach(function (e) { b.add(new T.CircleGeometry(1, 6), EYE, ON(e * 21, 0.06, 0.014, hx * 0.085, hy * 0.095, 1)); });
    b.add(hairCap(hx, hy, hz, { s: 1.07, sEdge: 1.09, front: 60, side: 100, back: 128, d1: 38, d2: 64, hang: 0.4, nu: 10, nv: 3, ws: [1, 1, 0.5, 0], tuck: 0.9 }), HAIR, HM(0, 0, 0));
    b.add(ball(7, 4), BEARD, HM(0, -hy * 0.66, hz * 0.22, 0.15, 0, 0, hx * 0.95, hy * 0.52, hz * 0.84));
    b.add(ball(6, 3), BEARD, HM(0, -hy * 1.08, hz * 0.46, 0.3, 0, 0, hx * 0.56, hy * 0.42, hz * 0.4));
    // 흰 두건: 이마 위로 둥글게 감아 올린 관
    var capM = HM(0, hy * 0.2, -hz * 0.03, -0.13, 0, 0);
    b.add(loft([[0, hx * 1.1, hz * 1.11], [hy * 0.27, hx * 1.2, hz * 1.21], [hy * 0.62, hx * 1.15, hz * 1.16], [hy * 0.92, hx * 0.9, hz * 0.92], [hy * 1.1, hx * 0.5, hz * 0.52], [hy * 1.15, 0, 0]], 10),
      function (x, y, z, nx, ny, nz, ti) { return Math.floor(ti / 20) === 0 ? LINEN_SH : LINEN; }, capM);
    rig.add(b.mesh(sm));

    /* --- 팔 --- */
    var armUp = new Builder(), armDn = new Builder();
    var S = V(s * sw, shY, 0), G = V(poleX + s * 0.012, poleY + poleR - 0.02, 0.26 * k);
    var ik = solveArm(S, G, ua, fa, V(s * 0.75, -1, 0.05));
    var base = { ua: ua, fa: fa, r0: 0.074 * k, r1: 0.072 * k, r2: 0.078 * k, nu: 6, cut: 0.62, sleeve: LINEN, inner: LINEN_DP, skin: SK, hand: 0.045 * k, rw: 0.034 * k };
    addArm(armUp, ext(base, { U: ik.U, F: ik.F, cut: 0.5 }));
    addArm(armDn, ext(base, { U: V(-s * 0.1, -1, 0.02), F: V(-s * 0.03, -1, 0.16), cut: 0.78 }));
    var mUp = armUp.mesh(sm), mDn = armDn.mesh(sm);
    mUp.position.copy(S);
    mDn.position.set(-s * sw, shY, 0);
    rig.add(mUp);
    rig.add(mDn);

    /* --- 발 --- */
    var fb = new Builder();
    [-1, 1].forEach(function (e) { addFoot(fb, k, SK, SK_SH, 0, true, TR(e * 0.085 * k, 0, 0, 0, e * 0.18, 0)); });
    group.add(fb.mesh(sm));

    group.userData.poleY = poleY;
    group.userData.poleX = poleX;
    group.userData.poleRadius = poleR;
    group.userData.height = H + hy * 0.5;

    var t = v * 1.7;
    function update(dt) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      t += dt;
      var br = Math.sin(t * 1.35);
      rig.scale.set(1 + 0.0015 * br, 1 + 0.0025 * br, 1 + 0.004 * br);          // 숨쉬기
      rig.rotation.z = 0.003 * Math.sin(t * 0.47);
      mDn.rotation.x = 0.02 * Math.sin(t * 0.8 + 1);
    }
    update(0);
    return { group: group, update: update };
  }

  /* ================================================================== 백성을 이끄는 사람(단순판) */
  function makeLeader() {
    var sm = mat('smooth'), cl = mat('cloth'), group = new T.Group(), rig = new T.Group();
    group.add(rig);
    var H = 1.76, k = H / 1.73, hy = 0.086 * H, hx = hy * 0.88, hz = hy * 0.93;
    var headY = H - hy, neckY = headY - hy * 0.97, shY = neckY - 0.066 * k, waistY = 0.58 * H;
    var sw = 0.205 * k, ua = 0.168 * H, fa = 0.152 * H;
    var SK = '#BE8558', SK_SH = '#9F6B45', HAIR = '#2A201B', HAIR_HI = '#3F3028', BEARD = '#2E231D';
    var TUNIC = '#DCC79A', TUNIC_SH = '#C4AD80', BELT = '#5E4029', BELT_SH = '#4A3220';
    var CLOAK = '#B8352B', CLOAK_SH = '#8C2520', CLOAK_HI = '#D04A38';

    /* --- 몸: 종아리까지 오는 통옷과 가죽 띠 --- */
    var b = new Builder(), nu = 12, hemY = 0.2 * k;
    var rows = [
      [hemY, 0.25 * k, 0.215 * k],
      [lerp(hemY, waistY, 0.5), 0.224 * k, 0.19 * k],
      [waistY - 0.035 * k, 0.19 * k, 0.154 * k],
      [waistY + 0.045 * k, 0.194 * k, 0.158 * k],
      [lerp(waistY, shY, 0.6), 0.204 * k, 0.162 * k],
      [shY + 0.005, 0.176 * k, 0.132 * k],
      [neckY + 0.012 * k, 0.078 * k, 0.072 * k]
    ];
    b.add(loft(rows, nu), function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / (2 * nu)), i = Math.floor(ti / 2) % nu;
      if (j === 0 && y < hemY + 0.09 * k) return TUNIC_SH;
      return i % 3 === 0 ? TUNIC_SH : TUNIC;
    }, null, [hemY, 0.75, 0.86]);
    b.add(loft([[waistY - 0.044 * k, 0.201 * k, 0.166 * k], [waistY + 0.05 * k, 0.204 * k, 0.169 * k]], 12),
      function (x, y, z, nx, ny, nz, ti) { return Math.floor(ti / 2) % 4 === 1 ? BELT_SH : BELT; });
    b.add(new T.BoxGeometry(0.05 * k, 0.21 * k, 0.014), BELT, TR(-0.07 * k, waistY - 0.12 * k, 0.178 * k, -0.07, -0.3, -0.05));
    b.add(new T.CylinderGeometry(0.058 * k, 0.063 * k, 0.1 * k, 8, 1, true), SK_SH, TR(0, neckY + 0.03 * k, 0.004));
    rig.add(b.mesh(sm));

    /* --- 붉은 겉옷: 앞이 열려 있고 어깨에서 종아리까지 --- */
    var nc = 12, openHalf = 38, cloakTop = neckY + 0.004;
    var cRows = [[hemY + 0.07 * k, 0.308 * k, 0.274 * k], [lerp(hemY, waistY, 0.5), 0.28 * k, 0.244 * k], [waistY, 0.254 * k, 0.206 * k], [lerp(waistY, shY, 0.7), 0.254 * k, 0.196 * k], [shY - 0.005, 0.24 * k, 0.176 * k], [cloakTop, 0.142 * k, 0.116 * k]];
    var cb = new Builder();
    cb.add(grid(nc, cRows.length - 1, false, function (u, v, o, ci, j) {
      var r = cRows[j], a = (90 + openHalf + u * (360 - 2 * openHalf)) * DEG, edge = Math.pow(Math.abs(u * 2 - 1), 6);
      o.set(r[1] * Math.cos(a) * (1 - 0.1 * edge), r[0], r[2] * Math.sin(a) * (1 - 0.06 * edge) - 0.012 * k);
    }), function (x, y, z, nx, ny, nz, ti) { var c = Math.floor(ti / 2) % nc % 3; return c === 1 ? CLOAK_SH : (c === 2 ? CLOAK : CLOAK_HI); }, null, [hemY, 0.85, 0.84]);
    rig.add(cb.mesh(cl));

    /* --- 머리: 짙은 머리, 짙은 수염, 머리띠 --- */
    var headO = [0, neckY, 0], head = new T.Group();
    head.position.fromArray(headO);
    rig.add(head);
    var hb = new Builder();
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    hb.add(ball(10, 6), SK, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    hb.add(ball(5, 3), SK_SH, ON(0, -0.1, 0, hx * 0.15, hy * 0.2, hz * 0.2));                                   // 코
    [-1, 1].forEach(function (e) {
      hb.add(new T.CircleGeometry(1, 8), EYE, ON(e * 21, 0.07, 0.012, hx * 0.078, hy * 0.088, 1));
      hb.add(new T.BoxGeometry(hx * 0.36, hy * 0.07, hz * 0.06), HAIR, ON(e * 22, 0.27, 0.01, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, e * -0.16)));     // 짙은 눈썹
      hb.add(new T.BoxGeometry(hx * 0.42, hy * 0.11, hz * 0.1), BEARD, ON(e * 13, -0.37, 0.02, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, e * 0.36)));     // 콧수염
    });
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 0.64, hz * 0.2, 0.15, 0, 0, hx * 0.99, hy * 0.56, hz * 0.9));           // 턱을 감싼 수염(가슴까지 내려오지 않는다)
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 1.06, hz * 0.46, 0.3, 0, 0, hx * 0.62, hy * 0.5, hz * 0.44));
    hb.add(hairCap(hx, hy, hz, { s: 1.1, sEdge: 1.14, front: 50, side: 112, back: 138, d1: 34, d2: 62, hang: 0.55, flare: 0.1, sweep: 4, zig: 2.5, nu: 12, nv: 5, tuck: 0.88 }),
      function (x, y) { return y > headY + hy * 0.75 ? HAIR_HI : HAIR; }, HM(0, 0, 0));
    hb.add(loft([[headY + hy * 0.42, hx * 1.1, hz * 1.12], [headY + hy * 0.62, hx * 0.99, hz * 1.01]], 12), '#E4D3AC');
    head.add(hb.mesh(sm, headO));

    /* --- 팔: 두 팔을 내리고 곧게 서 있다 (수 3장에는 손짓이 기록되어 있지 않다) --- */
    var base = { ua: ua, fa: fa, r0: 0.078 * k, r1: 0.08 * k, r2: 0.086 * k, nu: 6, cut: 0.74, sleeve: CLOAK, inner: CLOAK_SH, skin: SK, hand: 0.046 * k, rw: 0.036 * k };
    var arms = [1, -1].map(function (e) {
      var ab = new Builder();
      addArm(ab, ext(base, { U: V(e * 0.11, -1, 0.02), F: V(e * 0.035, -1, 0.17) }));
      var m = ab.mesh(sm);
      m.position.set(e * sw, shY, 0);
      rig.add(m);
      return m;
    });

    /* --- 발 --- */
    var fb = new Builder();
    [-1, 1].forEach(function (e) { addFoot(fb, k, SK, SK_SH, hemY + 0.1 * k, true, TR(e * 0.09 * k, 0, 0, 0, e * 0.18, 0)); });
    group.add(fb.mesh(sm));
    group.userData.height = H;

    var t = 0;
    function update(dt) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      t += dt;
      var br = Math.sin(t * 1.4);
      rig.scale.set(1 + 0.0015 * br, 1 + 0.0025 * br, 1 + 0.004 * br);
      rig.rotation.set(0, 0.012 * Math.sin(t * 0.35), 0);
      head.rotation.set(0.012 * Math.sin(t * 0.6), 0.07 * Math.sin(t * 0.42), 0);
      arms[0].rotation.x = 0.02 * Math.sin(t * 0.8 + 1);
      arms[1].rotation.x = 0.02 * Math.sin(t * 0.8 + 2.6);
    }
    update(0);
    return { group: group, update: update };
  }

  BO3D.models2 = BO3D.models2 || {};
  BO3D.models2.israelite = makeIsraelite;
  BO3D.models2.priestSimple = makePriest;
  BO3D.models2.leaderSimple = makeLeader;
})();
