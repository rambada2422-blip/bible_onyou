/* bible_onyou 3D 모델 — 세 주인공(최온·휴·온우). web3d/js/models.js 다음에 읽는다. */
(function () {
  'use strict';
  var kit = window.BO3D._modelKit;
  var T = kit.T, PI = kit.PI, TAU = kit.TAU, DEG = kit.DEG, config = kit.config, rng = kit.rng, lerp = kit.lerp, clamp = kit.clamp, smooth = kit.smooth, ease = kit.ease, spow = kit.spow, K = kit.K, mix = kit.mix, mat = kit.mat, glowTex = kit.glowTex, glowSprite = kit.glowSprite, TR = kit.TR, Builder = kit.Builder, _e = kit._e, _q = kit._q, _p = kit._p, _s = kit._s, _m3 = kit._m3, _a = kit._a, _b = kit._b, _c = kit._c, _n = kit._n, grid = kit.grid, fixPole = kit.fixPole, loft = kit.loft, limb = kit.limb, ball = kit.ball, sbox = kit.sbox, tubeAlong = kit.tubeAlong, curvePts = kit.curvePts, V = kit.V, displace = kit.displace, lumpy = kit.lumpy, hairCap = kit.hairCap, onEll = kit.onEll, SKIN = kit.SKIN, SKIN_SH = kit.SKIN_SH, EYE = kit.EYE, LEATHER = kit.LEATHER, LEATHER_SH = kit.LEATHER_SH, BRASS = kit.BRASS, BRASS_HI = kit.BRASS_HI, BRASS_SH = kit.BRASS_SH, BRASS_DP = kit.BRASS_DP;

  var KIDS = {
    choeon: {
      H: 1.35, ratio: 4.1, legFrac: 0.39, sw: 0.125, hem: 1.12,
      top: '#EE7B62', topSh: '#D2604A', collar: '#F6D078', sleeve: '#F6D078', cuff: null,
      pants: '#5F7FAE', pantsHi: '#8AA6CE',
      shoe: '#F2B544', shoeHi: '#F8CD6E', sole: '#8C5E24',
      pack: '#6F8448', packSh: '#566D38', packHi: '#8FA658', packSize: [0.11, 0.112, 0.058],
      hair: '#5E3D2E', hairHi: '#7A5440'
    },
    hyu: {
      H: 1.55, ratio: 4.5, legFrac: 0.42, sw: 0.15, hem: 1.06,
      top: '#2F9C95', topSh: '#237A75', collar: '#52B8B0', sleeve: null, cuff: '#F3E9D6',
      pants: '#A9744A', pantsHi: '#C08C60',
      shoe: '#E4BE7E', shoeHi: '#EDD09A', sole: '#7A4A28',
      pack: '#E0A93B', packSh: '#C48E28', packHi: '#F2C867', packSize: [0.13, 0.152, 0.066],
      hair: '#4A382F', hairHi: '#65503F'
    },
    onwoo: {
      H: 1.72, ratio: 4.9, legFrac: 0.45, sw: 0.172, hem: 1.06,
      top: '#4E5FB0', topSh: '#3C4B92', collar: '#7080CC', sleeve: null, cuff: '#3C4B92',
      pants: '#DCC293', pantsHi: '#EDDAB4',
      shoe: '#5565B5', shoeHi: '#F3EBDB', sole: '#F3EBDB',
      pack: '#9A6238', packSh: '#7A4A28', packHi: '#B57A48', packSize: [0.14, 0.172, 0.07],
      hair: '#3F3540', hairHi: '#5A4D5E'
    }
  };
  // 몸통 둘레를 나누는 각도. 앞(90°) 가운데에 좁은 칸(2번)을 두어 여민 옷 사이의 속옷을 칠할 수 있게 한다.
  var TORSO_ANG = [15, 45, 70, 110, 135, 165, 195, 225, 250, 290, 315, 345].map(function (d) { return d * DEG; });


  function makeKid(key) {
    if (!KIDS[key]) key = 'choeon';
    var d = KIDS[key], girl = key === 'choeon';
    var H = d.H, sw = d.sw;
    var hy = H / d.ratio / 2, hx = hy * 0.95, hz = hy * 0.96;
    var headY = H - hy * 1.15;
    var shY = headY - hy - 0.018 * H;                // 목 밑(몸통 꼭대기)
    var hipY = H * d.legFrac, L = shY - hipY;
    var ankle = 0.05 * H, thigh = (hipY - ankle) * 0.5, shin = thigh;
    var hipX = sw * 0.5, armX = sw * 0.98, armY = hipY + L * 0.83;
    var ua = 0.145 * H, fa = 0.135 * H, handR = 0.034 * H;
    var rArm = sw * 0.33, rLeg = sw * 0.5;
    var Y = function (f) { return hipY + L * f; };
    var sm = mat('smooth');

    var group = new T.Group();
    var rig = new T.Group();
    group.add(rig);

    /* --- 골반(바지) --- */
    var pel = new Builder();
    pel.add(loft([[Y(-0.085), 0, 0], [Y(-0.07), sw * 0.66, sw * 0.52], [Y(-0.01), sw * 0.98, sw * 0.7], [Y(0.08), sw * 0.97, sw * 0.71], [Y(0.2), sw * 0.9, sw * 0.66]], 12, TORSO_ANG), d.pants);
    rig.add(pel.mesh(sm));

    /* --- 윗몸 --- */
    var chestO = [0, Y(0.1), 0];
    var chest = new T.Group();
    chest.position.fromArray(chestO);
    rig.add(chest);
    var tor = new Builder(), hw = d.hem;
    var topCol = function (x, y, z, nx, ny, nz, ti) {
      var j = Math.floor(ti / 24), i = Math.floor(ti / 2) % 12;
      if (key === 'onwoo' && i === 2 && j >= 1) return '#FBF7EE';        // 열어 입은 재킷 사이의 티셔츠
      if (girl && i === 2 && j >= 5) return d.sleeve;                     // 조끼 목선 사이의 노란 티셔츠
      return j <= 1 ? d.topSh : d.top;
    };
    var topRows = [[Y(0.115), sw * 0.86, sw * 0.62], [Y(0.10), sw * hw, sw * hw * 0.74], [Y(0.185), sw * (hw - 0.03), sw * (hw - 0.03) * 0.74], [Y(0.32), sw * 0.97, sw * 0.72],
      [Y(0.60), sw * 1.0, sw * 0.76], [Y(0.84), sw * 1.0, sw * 0.71], [Y(0.95), sw * 0.72, sw * 0.54], [Y(1.0), sw * 0.38, sw * 0.36]];
    tor.add(loft(topRows, 12, TORSO_ANG), topCol, null, [Y(0.1), Y(0.7), 0.9]);
    // 몸통 겉면: 높이 y에서 x 자리의 앞뒤 두께, x 자리의 어깨 높이
    var surfZ = function (x, y) {
      for (var k = 1; k < topRows.length - 1; k++) if (y <= topRows[k + 1][0]) break;
      k = Math.min(k, topRows.length - 2);
      var t = clamp((y - topRows[k][0]) / (topRows[k + 1][0] - topRows[k][0]), 0, 1), rx = lerp(topRows[k][1], topRows[k + 1][1], t), rz = lerp(topRows[k][2], topRows[k + 1][2], t);
      return rz * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)));
    };
    var topAt = function (x) {
      for (var k = topRows.length - 1; k > 1; k--) if (topRows[k - 1][1] >= Math.abs(x)) break;
      return lerp(topRows[k - 1][0], topRows[k][0], clamp((topRows[k - 1][1] - Math.abs(x)) / (topRows[k - 1][1] - topRows[k][1]), 0, 1));
    };
    tor.add(new T.TorusGeometry(1, 0.26, 3, 8), d.collar, TR(0, Y(0.985), 0, PI / 2, 0, 0, sw * 0.37, sw * 0.36, sw * 0.42));       // 깃
    tor.add(new T.CylinderGeometry(sw * 0.25, sw * 0.27, headY - hy * 0.8 - Y(0.96), 8, 1, true), SKIN_SH, TR(0, (headY - hy * 0.8 + Y(0.96)) / 2, 0));
    if (girl) {
      // 조끼 주머니
      [-1, 1].forEach(function (s) { tor.add(new T.BoxGeometry(sw * 0.44, sw * 0.36, sw * 0.1), '#F7A48E', TR(s * sw * 0.5, Y(0.31), sw * 0.69, -0.03, s * 0.4, 0)); });
    } else if (key === 'hyu') {
      tor.add(new T.BoxGeometry(sw * 0.07, L * 0.74, sw * 0.06), d.topSh, TR(0, Y(0.53), sw * 0.735, -0.02, 0, 0));           // 지퍼 선
    } else {
      [-1, 1].forEach(function (s) { tor.add(sbox(sw * 0.14, L * 0.2, sw * 0.05, 0.6, 4, 2), d.collar, TR(s * sw * 0.36, Y(0.77), sw * 0.71, -0.12, s * 0.4, s * -0.2)); });    // 라펠
    }
    // 배낭
    var pk = d.packSize, pz = -(sw * 0.7 + pk[2] * 0.72), py = Y(0.56);
    tor.add(sbox(pk[0], pk[1], pk[2], 0.55, 8, 4), d.pack, TR(0, py, pz), [py - pk[1], py + pk[1], 0.86]);
    tor.add(sbox(pk[0] * 1.04, pk[1] * 0.42, pk[2] * 1.06, 0.55, 8, 3), d.packSh, TR(0, py + pk[1] * 0.62, pz - 0.004));
    tor.add(sbox(pk[0] * 0.7, pk[1] * 0.36, pk[2] * 0.5, 0.6, 6, 3), d.packHi, TR(0, py - pk[1] * 0.42, pz - pk[2] * 0.78));
    tor.add(new T.CircleGeometry(0.02, 8), BRASS_HI, TR(0, py + pk[1] * 0.32, pz - pk[2] * 1.075, 0, PI, 0));
    [-1, 1].forEach(function (s) {       // 어깨끈: 몸통 겉면을 따라 앞가슴에서 어깨를 넘어 배낭까지
      tor.add(grid(1, 9, false, function (u, v, o) {
        var x = s * sw * 0.56 + (0.5 - u) * sw * 0.2, front = v < 0.56;
        var y = Math.min(front ? lerp(Y(0.46), Y(1.0), v / 0.56) : lerp(Y(1.0), Y(0.62), (v - 0.56) / 0.44), topAt(x));
        o.set(x, y + 0.006, (front ? 1 : -1) * (surfZ(x, y) + 0.007));
      }), s > 0 ? LEATHER : LEATHER_SH);
    });
    chest.add(tor.mesh(sm, chestO));

    /* --- 머리 --- */
    var headO = [0, headY - hy * 0.9, 0];
    var head = new T.Group();
    head.position.set(0, headO[1] - chestO[1], 0);
    chest.add(head);
    var hb = new Builder();
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    hb.add(ball(12, 7), SKIN, HM(0, 0, 0, 0, 0, 0, hx, hy, hz), [headY - hy, headY - hy * 0.3, 0.93]);
    [-1, 1].forEach(function (s) {
      hb.add(new T.CircleGeometry(1, 10), EYE, ON(s * 21, -0.15, 0.012, hx * 0.1, hy * (girl ? 0.145 : 0.13), 1));
      hb.add(new T.CircleGeometry(1, 5), '#FFFFFF', ON(s * 21 - 1.6, -0.1, 0.02, hx * 0.03, hy * 0.035, 1));
      hb.add(new T.CircleGeometry(1, 6), mix(SKIN, '#F0907C', 0.6), ON(s * 41, -0.43, 0.012, hx * 0.15, hy * 0.09, 1));
      if (!girl) hb.add(ball(5, 3), SKIN, HM(s * hx * 0.97, -0.13 * hy, -hz * 0.03, 0, 0, 0, hx * 0.11, hy * 0.17, hz * 0.12));
    });
    hb.add(new T.CircleGeometry(1, 6, PI, PI), '#B8574B', ON(0, -0.47, 0.012, hx * (girl ? 0.115 : 0.095), hy * (girl ? 0.09 : 0.06), 1));
    var hairCol = function (x, y) { return mix(d.hair, d.hairHi, smooth(headY + hy * 0.1, headY + hy * 1.15, y) * 0.85); };
    if (girl) {
      hb.add(hairCap(hx, hy, hz, { s: 1.17, sEdge: 1.22, front: 69, side: 150, back: 146, d1: 24, d2: 44, hang: 1, flare: -0.1, nu: 14, nv: 6, pow: 0.92, tuck: 0.8 }), hairCol, HM(0, 0, 0));
      // 머리핀
      hb.add(sbox(hx * 0.2, hy * 0.045, hz * 0.06, 0.6, 4, 2), '#EE7B62', ON(-44, 0.42, 0.2, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.5)));
      hb.add(sbox(hx * 0.2, hy * 0.045, hz * 0.06, 0.6, 4, 2), '#F7A48E', ON(-47, 0.28, 0.2, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.5)));
    } else if (key === 'hyu') {
      hb.add(hairCap(hx, hy, hz, { s: 1.18, sEdge: 1.12, front: 62, side: 80, back: 116, d1: 44, d2: 78, hang: 0.25, sweep: 6, zig: 4, nu: 14, nv: 5, tuck: 0.87 }), hairCol, HM(0, 0, 0));
      hb.add(sbox(hx * 0.1, hy * 0.2, hz * 0.1, 1.5, 5, 3), d.hair, HM(hx * 0.12, hy * 1.2, -hz * 0.1, 0.2, 0, -0.55));       // 삐친 머리
      hb.add(sbox(hx * 0.34, hy * 0.17, hz * 0.14, 1.2, 6, 3), d.hair, ON(-14, 0.56, 0.13, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.3)));        // 앞머리 가닥
      // 동그란 안경
      [-1, 1].forEach(function (s) {
        hb.add(new T.TorusGeometry(hx * 0.235, hx * 0.03, 3, 9), '#2E5F66', ON(s * 22, -0.15, 0.075, 1, 1, 1));
        hb.add(new T.BoxGeometry(hx * 0.04, hy * 0.035, hz * 0.62), '#2E5F66', HM(s * hx * 0.93, -0.13 * hy, hz * 0.48, 0, s * 0.2, 0));
      });
      hb.add(new T.BoxGeometry(hx * 0.2, hy * 0.035, hz * 0.03), '#2E5F66', ON(0, -0.12, 0.085, 1, 1, 1));
    } else {
      hb.add(hairCap(hx, hy, hz, {
        s: 1.2, sEdge: 1.12, front: 57, side: 77, back: 112, d1: 42, d2: 74, hang: 0.2, sweep: -11, zig: 3, nu: 14, nv: 6, tuck: 0.87,
        shape: function (p, ca, sa, w) { if (sa > 0) { p.z += hz * 0.1 * sa * Math.sin(w * PI); p.y += hy * 0.05 * sa * Math.sin(w * PI); } }       // 앞머리를 띄운다
      }), hairCol, HM(0, 0, 0));
      hb.add(sbox(hx * 0.5, hy * 0.19, hz * 0.16, 1.2, 6, 3), d.hair, ON(-10, 0.6, 0.15, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, 0.42)));        // 옆으로 넘긴 앞머리
      hb.add(sbox(hx * 0.26, hy * 0.14, hz * 0.14, 1.2, 6, 3), d.hair, ON(34, 0.6, 0.13, 1, 1, 1).multiply(TR(0, 0, 0, 0, 0, -0.5)));
    }
    head.add(hb.mesh(sm, headO));

    /* --- 팔 --- */
    function makeArm(s) {
      var sh = new T.Group(), el = new T.Group();
      sh.position.set(s * armX, armY - chestO[1], 0);
      el.position.set(0, -ua, 0);
      var up = new Builder(), lo = new Builder();
      if (d.sleeve) {
        up.add(limb(rArm * 0.92, rArm * 0.88, ua, 6, false, true), SKIN);
        up.add(limb(rArm * 1.3, rArm * 1.26, ua * 0.52, 6, true, false), d.sleeve);
        lo.add(limb(rArm * 0.88, rArm * 0.76, fa, 6), SKIN);
      } else {
        up.add(limb(rArm * 1.18, rArm * 1.04, ua, 6, true, true), d.top);
        lo.add(limb(rArm * 1.04, rArm * 0.94, fa * 0.94, 6), d.top);
        lo.add(limb(rArm * 1.0, rArm * 1.0, fa * 0.13, 6), d.cuff, TR(0, -fa * 0.87, 0));
      }
      lo.add(ball(6, 4), SKIN, TR(0, -fa - handR * 0.5, 0, 0, 0, 0, handR * 0.8, handR, handR * 0.92));
      if (key === 'onwoo' && s < 0) {
        // 책: 표지에는 아무 표시도 없다
        var bm = TR(-0.012, -fa - handR * 1.4 - 0.075, 0.02, 0.1, 0, 0);
        lo.add(new T.BoxGeometry(0.046, 0.16, 0.215), '#8A5230', bm);
        lo.add(new T.BoxGeometry(0.034, 0.146, 0.206), '#F3E9D6', bm.clone().multiply(TR(0, -0.003, 0.008)));
        lo.add(new T.BoxGeometry(0.05, 0.164, 0.03), '#6B3C20', bm.clone().multiply(TR(0, 0, -0.096)));
        lo.add(new T.BoxGeometry(0.006, 0.05, 0.014), '#D9503F', bm.clone().multiply(TR(0.004, -0.1, 0.05)));
      }
      sh.add(up.mesh(sm));
      el.add(lo.mesh(sm));
      sh.add(el);
      chest.add(sh);
      return { sh: sh, el: el };
    }
    var armL = makeArm(1), armR = makeArm(-1);

    /* --- 다리 --- */
    function makeLeg(s) {
      var hip = new T.Group(), knee = new T.Group();
      hip.position.set(s * hipX, hipY, 0);
      knee.position.set(0, -thigh, 0);
      var up = new Builder(), lo = new Builder();
      if (girl) {
        up.add(limb(rLeg * 0.86, rLeg * 0.78, thigh, 7, false, true), SKIN);
        up.add(limb(rLeg * 1.1, rLeg * 1.16, thigh * 0.5, 7), d.pants);                               // 반바지
        up.add(limb(rLeg * 1.18, rLeg * 1.2, thigh * 0.09, 7), d.pantsHi, TR(0, -thigh * 0.47, 0));
        lo.add(limb(rLeg * 0.78, rLeg * 0.7, shin * 0.5, 7), SKIN);
        lo.add(limb(rLeg * 0.76, rLeg * 0.74, shin * 0.16, 7), '#F6EEDD', TR(0, -shin * 0.38, 0));    // 양말
        lo.add(limb(rLeg * 0.96, rLeg * 0.92, shin * 0.5, 7), d.shoe, TR(0, -shin * 0.52, 0));        // 장화 목
        lo.add(limb(rLeg * 1.06, rLeg * 1.04, shin * 0.09, 7), d.shoeHi, TR(0, -shin * 0.5, 0));
      } else {
        up.add(limb(rLeg * 1.0, rLeg * 0.88, thigh, 7, false, true), d.pants);
        lo.add(limb(rLeg * 0.88, rLeg * 0.8, shin * 0.97, 7), d.pants);
        lo.add(limb(rLeg * 0.86, rLeg * 0.85, shin * 0.1, 7), d.pantsHi, TR(0, -shin * 0.87, 0));     // 바짓단
      }
      var ry = ankle * 0.62, shoe = displace(sbox(rLeg * (girl ? 1.0 : 0.98), ry, 0.082 * H, 0.72, 8, 5), function (v) { if (v.y < -ry * 0.8) v.y = -ry * 0.8; });
      lo.add(shoe, function (x, y) { return y < -shin - ankle + ry * 0.36 ? d.sole : d.shoe; }, TR(0, -shin - ankle + ry * 0.8, 0.032 * H));
      hip.add(up.mesh(sm));
      knee.add(lo.mesh(sm));
      hip.add(knee);
      rig.add(hip);
      return { hip: hip, knee: knee };
    }
    var legL = makeLeg(1), legR = makeLeg(-1);

    /* --- 움직임 --- */
    var st = { t: (key === 'hyu' ? 1.3 : key === 'onwoo' ? 2.7 : 0), ph: 0, w: 0, run: 0 };
    var legLen = hipY - ankle;
    function legPose(l, s, c, A, Kn, w, r) {      // 다리 하나를 놓고, 엉덩이에서 발목까지의 높이를 돌려준다
      l.hip.rotation.x = -A * s * w - 0.06 * r * w;
      l.knee.rotation.x = (Kn * Math.max(0, c) * (0.55 + 0.45 * (1 - Math.abs(s))) + 0.12 * Math.max(0, s)) * w;
      return thigh * Math.cos(l.hip.rotation.x) + shin * Math.cos(l.hip.rotation.x + l.knee.rotation.x);
    }
    function update(dt, speed) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      speed = Math.abs(speed || 0);
      st.t += dt;
      var moving = speed > 0.03;
      st.w += ((moving ? 1 : 0) - st.w) * Math.min(1, dt * 9);
      st.run += (clamp((speed - 1.7) / 2.2, 0, 1) - st.run) * Math.min(1, dt * 6);
      // 걸음 박자는 속도에 비례하고, 빨라지면 보폭도 조금 길어진다
      var stride = legLen * (1.75 + 0.75 * Math.max(0, speed - 1.2));
      st.ph += dt * speed / stride * TAU;
      var w = st.w, r = st.run, s = Math.sin(st.ph), c = Math.cos(st.ph);
      var A = lerp(0.2, 0.52, clamp(speed / 1.1, 0, 1)) + 0.26 * r;
      var Kn = lerp(0.85, 1.45, r), br = Math.sin(st.t * 1.9);

      var reach = Math.max(legPose(legL, s, c, A, Kn, w, r), legPose(legR, -s, -c, A, Kn, w, r));
      rig.position.y = reach - legLen + r * w * 0.035 * Math.abs(Math.sin(st.ph));

      var lean = (0.04 + 0.13 * r) * w;
      chest.rotation.set(lean, 0.09 * s * w, 0);
      chest.position.y = chestO[1] + 0.004 * br * (1 - w);
      head.rotation.set(-lean * 0.7 + 0.02 * Math.sin(st.t * 0.8) * (1 - w), -0.06 * s * w + 0.05 * Math.sin(st.t * 0.37) * (1 - w), 0);

      var B = A * 0.95, bend = lerp(0.22, 1.25, r), splay = 0.13 + 0.015 * br * (1 - w);
      armL.sh.rotation.set(B * s * w, 0, splay);
      armL.el.rotation.x = -(0.12 + (bend + 0.25 * Math.max(0, -s)) * w);
      if (key === 'onwoo') {      // 책 든 팔은 덜 흔든다
        armR.sh.rotation.set(-B * 0.4 * s * w + 0.05, 0, -splay);
        armR.el.rotation.x = -(0.3 + 0.1 * w + 0.5 * r * w);
      } else {
        armR.sh.rotation.set(-B * s * w, 0, -splay);
        armR.el.rotation.x = -(0.12 + (bend + 0.25 * Math.max(0, s)) * w);
      }
    }
    update(0, 0);
    return { group: group, update: update };
  }

  window.BO3D.models.kid = makeKid;
})();
