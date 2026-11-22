/* bible_onyou 3D 모델 — 모세와 양. web3d/js/models.js 다음에 읽는다. */
(function () {
  'use strict';
  var kit = window.BO3D._modelKit;
  var T = kit.T, PI = kit.PI, TAU = kit.TAU, DEG = kit.DEG, config = kit.config, rng = kit.rng, lerp = kit.lerp, clamp = kit.clamp, smooth = kit.smooth, ease = kit.ease, spow = kit.spow, K = kit.K, mix = kit.mix, mat = kit.mat, glowTex = kit.glowTex, glowSprite = kit.glowSprite, TR = kit.TR, Builder = kit.Builder, _e = kit._e, _q = kit._q, _p = kit._p, _s = kit._s, _m3 = kit._m3, _a = kit._a, _b = kit._b, _c = kit._c, _n = kit._n, grid = kit.grid, fixPole = kit.fixPole, loft = kit.loft, limb = kit.limb, ball = kit.ball, sbox = kit.sbox, tubeAlong = kit.tubeAlong, curvePts = kit.curvePts, V = kit.V, displace = kit.displace, lumpy = kit.lumpy, hairCap = kit.hairCap, onEll = kit.onEll, SKIN = kit.SKIN, SKIN_SH = kit.SKIN_SH, EYE = kit.EYE, LEATHER = kit.LEATHER, LEATHER_SH = kit.LEATHER_SH, BRASS = kit.BRASS, BRASS_HI = kit.BRASS_HI, BRASS_SH = kit.BRASS_SH, BRASS_DP = kit.BRASS_DP;

  /* ================================================================== 모세 */
  var M_SKIN = '#C48A5E', M_SKIN_SH = '#A56E47';
  var DOWN = new T.Vector3(0, -1, 0), XAX = new T.Vector3(1, 0, 0);

  function makeMoses() {
    var sm = mat('smooth'), cl = mat('cloth');
    var hy = 0.146, hx = 0.128, hz = 0.136;
    var headY = 1.585, waistY = 1.0, shY = 1.365, sw = 0.2;
    var ua = 0.29, fa = 0.26;
    var TUNIC = '#EADBB6', STRIPE = '#B58A5C', CLOAK = '#9C5438', CLOAK_SH = '#6A3423', CLOAK_HI = '#B4683F', BEARD = '#F6F1E6';
    var group = new T.Group();

    // 줄무늬를 위한 둘레 나눔: 넓은 칸(짝수 번)과 좁은 칸(홀수 번)이 번갈아 나온다
    var ANG = [], i, a0 = 90 - 15.5;
    for (i = 0; i < 16; i++) { ANG.push(a0 * DEG); a0 += (i % 2 === 0) ? 31 : 14; }
    var tunicCol = function (x, y, z, nx, ny, nz, ti) { return (Math.floor(ti / 2) % 16) % 2 ? STRIPE : TUNIC; };

    /* --- 발(샌들). hideface에서는 옷자락에 가려 보이지 않는다 --- */
    var feet = new T.Group();
    group.add(feet);
    function makeFoot(s) {
      var g = new T.Group(), b = new Builder();
      b.add(sbox(0.052, 0.034, 0.118, 0.75, 8, 3), function (x, y) { return y < 0.024 ? '#5A3A22' : M_SKIN; }, TR(0, 0.036, 0.045));
      b.add(new T.BoxGeometry(0.112, 0.016, 0.03), '#5A3A22', TR(0, 0.062, 0.085, 0.25, 0, 0));
      b.add(new T.CylinderGeometry(0.04, 0.036, 0.2, 6, 1, true), M_SKIN_SH, TR(0, 0.15, -0.02));
      g.add(b.mesh(sm));
      g.rotation.y = s * 0.18;
      feet.add(g);
      return g;
    }
    var footL = makeFoot(1), footR = makeFoot(-1);

    /* --- 통옷 아랫자락(허리 아래) --- */
    var skirtB = new Builder();
    skirtB.add(loft([[0.135, 0.19, 0.165], [0.13, 0.255, 0.22], [0.5, 0.225, 0.195], [0.82, 0.2, 0.165], [1.0, 0.186, 0.15]], 16, ANG), tunicCol, null, [0.1, 0.7, 0.86]);
    var skirt = skirtB.mesh(sm, [0, waistY, 0]);
    skirt.position.set(0, waistY, 0);
    group.add(skirt);

    /* --- 윗몸 --- */
    var upper = new T.Group();
    upper.position.set(0, waistY, 0);
    group.add(upper);
    var ch = new Builder();
    ch.add(loft([[0.98, 0.188, 0.152], [1.24, 0.2, 0.158], [1.37, 0.17, 0.13], [1.43, 0.075, 0.07]], 16, ANG), tunicCol);
    ch.add(new T.CylinderGeometry(0.055, 0.06, 0.1, 8, 1, true), M_SKIN_SH, TR(0, 1.46, 0.005));
    // 허리띠와 늘어진 끝자락
    ch.add(loft([[0.965, 0.185, 0.15], [0.972, 0.2, 0.166], [1.035, 0.2, 0.166], [1.042, 0.186, 0.15]], 10), '#4F5D7A');
    ch.add(new T.BoxGeometry(0.05, 0.2, 0.014), '#4F5D7A', TR(0.075, 0.885, 0.176, -0.07, 0.3, 0.06));
    ch.add(new T.BoxGeometry(0.044, 0.16, 0.014), '#3F4C66', TR(0.115, 0.9, 0.165, -0.07, 0.5, -0.05));
    upper.add(ch.mesh(sm, [0, waistY, 0]));

    /* --- 겉옷: 앞이 열려 있고 어깨에서 종아리까지 내려온다 --- */
    var cloakTop = 1.4, nc = 12, openHalf = 36;
    var cloakRows = [[0.2, 0.3, 0.268], [0.6, 0.272, 0.24], [1.0, 0.246, 0.2], [1.25, 0.246, 0.19], [1.36, 0.232, 0.17], [1.425, 0.14, 0.115]];
    var cloakG = grid(nc, cloakRows.length - 1, false, function (u, v, o, ci, j) {
      var r = cloakRows[j], a = (90 + openHalf + u * (360 - 2 * openHalf)) * DEG;
      var edge = Math.pow(Math.abs(u * 2 - 1), 6);             // 앞섶은 몸 쪽으로 살짝 말린다
      o.set(r[1] * Math.cos(a) * (1 - 0.1 * edge), r[0], r[2] * Math.sin(a) * (1 - 0.06 * edge) - 0.012);
    });
    var cloakCol = function (x, y, z, nx, ny, nz, ti) { var k = Math.floor(ti / 2) % nc % 3; return k === 1 ? CLOAK_SH : (k === 2 ? CLOAK : CLOAK_HI); };
    var cloakB = new Builder();
    cloakB.add(cloakG, cloakCol, null, [0.15, 0.8, 0.86]);
    var cloak = cloakB.mesh(cl, [0, cloakTop, 0]);
    cloak.position.set(0, cloakTop - waistY, 0);
    upper.add(cloak);

    /* --- 머리 --- */
    var headO = [0, 1.455, 0];
    var head = new T.Group();
    head.position.set(0, headO[1] - waistY, 0);
    upper.add(head);
    var hb = new Builder();
    var HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, headY + y, z, rx, ry, rz, sx, sy, sz); };
    var ON = function (a, yf, lift, sx, sy, sz) { return onEll(0, headY, 0, hx, hy, hz, a, yf, lift, sx, sy, sz); };
    hb.add(ball(10, 6), M_SKIN, HM(0, 0, 0, 0, 0, 0, hx, hy, hz));
    hb.add(ball(5, 3), M_SKIN_SH, ON(0, -0.1, 0, hx * 0.15, hy * 0.2, hz * 0.2));                                   // 코
    [-1, 1].forEach(function (s) {
      hb.add(new T.CircleGeometry(1, 8), '#33241C', ON(s * 21, 0.07, 0.012, hx * 0.075, hy * 0.085, 1));
      hb.add(ball(5, 3), BEARD, ON(s * 22, 0.27, 0.01, hx * 0.2, hy * 0.05, hz * 0.07).multiply(TR(0, 0, 0, 0, 0, s * -0.16)));     // 흰 눈썹
      hb.add(ball(5, 3), BEARD, ON(s * 14, -0.37, 0.03, hx * 0.3, hy * 0.11, hz * 0.13).multiply(TR(0, 0, 0, 0, 0, s * 0.4)));      // 콧수염
    });
    // 수염: 턱을 감싸고 가슴까지 내려온다
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 0.66, hz * 0.2, 0.15, 0, 0, hx * 0.99, hy * 0.6, hz * 0.9), [headY - hy * 1.3, headY - hy * 0.5, 0.9]);
    hb.add(ball(7, 4), BEARD, HM(0, -hy * 1.28, hz * 0.52, 0.3, 0, 0, hx * 0.64, hy * 0.74, hz * 0.44), [headY - hy * 2.1, headY - hy * 1.1, 0.86]);
    // 머리쓰개와 머리띠
    hb.add(hairCap(hx, hy, hz, { s: 1.12, sEdge: 1.14, front: 56, side: 168, back: 192, d1: 34, d2: 52, b1: 70, b2: 130, hang: 1, flare: 0.24, backOut: 1.06, nu: 12, nv: 6, pow: 0.85, tuck: 0.9 }),
      '#F3EAD4', HM(0, 0, 0), [headY - hy * 2.4, headY - hy * 0.2, 0.84]);
    hb.add(new T.TorusGeometry(1, 0.085, 3, 10), '#8A4B34', HM(0, hy * 0.5, 0, PI / 2 - 0.1, 0, 0, hx * 1.03, hz * 1.04, hy * 1.0));
    head.add(hb.mesh(sm, headO));

    /* --- 팔: 넓은 겉옷 소매 --- */
    function makeArm(s) {
      var sh = new T.Group(), el = new T.Group(), S = new T.Vector3(s * sw, shY - waistY, 0);
      sh.position.copy(S);
      el.position.set(0, -ua, 0);
      var up = new Builder(), lo = new Builder();
      up.add(limb(0.076, 0.08, ua, 6, true, true), CLOAK);
      lo.add(loft([[-fa * 0.74, 0.036, 0.036], [-fa * 0.8, 0.082, 0.082], [-fa * 0.4, 0.082, 0.082], [0, 0.077, 0.077]], 6),
        function (x, y, z, nx, ny, nz, ti) { return ti < 12 ? CLOAK_SH : CLOAK; });                                        // 소매 끝 안쪽은 어둡게
      lo.add(limb(0.04, 0.034, fa, 6), M_SKIN);
      lo.add(ball(6, 4), M_SKIN, TR(0, -fa - 0.03, 0, 0, 0, 0, 0.041, 0.052, 0.046));
      sh.add(up.mesh(sm));
      el.add(lo.mesh(sm));
      sh.add(el);
      upper.add(sh);
      return { sh: sh, el: el, S: S };
    }
    var armL = makeArm(1), armR = makeArm(-1);

    /* --- 자세 --- */
    var restU = V(0.12, -1, 0.02).normalize(), restF = V(0.06, -1, 0.16).normalize();
    var hideU = V(-0.295, 0.362, 0.885).normalize(), hideF = V(-0.8, 0.42, -0.43).normalize();

    // 얼굴을 가릴 때 든 팔에서 늘어지는 넓은 소매(hideface에서만 보인다). 팔뚝을 감싸고 아래로 처진 자루 모양.
    var drapeE = armL.S.clone().addScaledVector(hideU, ua), drapeW = drapeE.clone().addScaledVector(hideF, fa);
    var dAx = hideF.clone(), dUp = V(0, 1, 0).addScaledVector(dAx, -dAx.y).normalize(), dFw = dAx.clone().cross(dUp);
    var DR = [[-0.16, 0.085, 0.08, 0.1], [0.12, 0.09, 0.085, 0.17], [0.42, 0.092, 0.088, 0.27], [0.74, 0.092, 0.09, 0.35], [0.98, 0.088, 0.088, 0.37], [1.0, 0, 0, 0]];   // [팔뚝 위의 자리, 앞뒤, 위, 처진 깊이]
    var drapeG = grid(8, DR.length - 1, true, function (u, v, o, ci, j) {
      var r = DR[j], a = u * TAU + 0.39, sa = Math.sin(a);
      o.copy(drapeE).lerp(drapeW, r[0]).addScaledVector(dFw, r[1] * Math.cos(a)).addScaledVector(dUp, sa > 0 ? r[2] * sa : r[3] * sa);
    });
    var drapeB = new Builder();
    drapeB.add(drapeG, function (x, y, z, nx, ny, nz, ti) {
      if (ti >= 64) return '#4E2416';
      var k = Math.floor(ti / 2) % 8 % 4;
      return k === 1 ? CLOAK_SH : (k === 3 ? CLOAK_HI : CLOAK);
    });
    var drapeO = [0, drapeE.y + 0.09, 0];
    var drape = drapeB.mesh(sm, drapeO);
    drape.position.fromArray(drapeO);
    drape.visible = false;
    upper.add(drape);

    /* --- 목자의 지팡이: 위가 굽었다 --- */
    var staffPts = [V(0, 0, 0), V(0, 0.5, 0), V(0, 1.0, 0), V(0, 1.5, 0)].concat(
      curvePts([V(0, 1.6, 0), V(0, 1.72, 0.012), V(0, 1.81, 0.06), V(0, 1.835, 0.13), V(0, 1.79, 0.19), V(0, 1.71, 0.2)], 7));
    var staffB = new Builder();
    staffB.add(tubeAlong(staffPts, function (t) { return lerp(0.024, 0.017, t); }, 0, 4, true), '#6B4526');
    var staff = staffB.mesh(sm);
    group.add(staff);
    var GRIP = 1.1;

    /* --- 움직임 --- */
    var pose = { approach: 0, hideface: 1 };
    var st = { k: 0, target: 0, w: 0, ph: 0, t: 0 };
    var dU = new T.Vector3(), dF = new T.Vector3(), qa = new T.Quaternion(), qb = new T.Quaternion(), qx = new T.Quaternion();
    var G = new T.Vector3(), E = new T.Vector3(), nv_ = new T.Vector3(), pole = new T.Vector3();

    function aim(arm, u, f) {
      qa.setFromUnitVectors(DOWN, u);
      arm.sh.quaternion.copy(qa);
      qb.setFromUnitVectors(DOWN, f);
      arm.el.quaternion.copy(qa).invert().multiply(qb);
    }
    function update(dt, moving) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      st.t += dt;
      st.k += clamp(st.target - st.k, -dt / 0.45, dt / 0.45);
      st.w += ((moving ? 1 : 0) - st.w) * Math.min(1, dt * 7);
      st.ph += dt * 4.6 * st.w;
      var k = ease(st.k), w = st.w * (1 - k), s = Math.sin(st.ph), c = Math.cos(st.ph), br = Math.sin(st.t * 1.5);

      // 옷자락: hideface에서는 땅까지 내려와 발을 가린다
      skirt.scale.y = lerp(1, (waistY + 0.012) / (waistY - 0.13), k);
      cloak.scale.y = lerp(1, (cloakTop + 0.008) / (cloakTop - 0.2), k);
      feet.visible = st.k < 0.55;
      skirt.rotation.x = 0.035 * s * w;
      footL.position.set(0.085, Math.max(0, c) * 0.045 * w, 0.14 * s * w);
      footR.position.set(-0.085, Math.max(0, -c) * 0.045 * w, -0.14 * s * w);

      upper.position.y = waistY + 0.012 * Math.abs(c) * w;
      upper.rotation.set(0.08 * k + 0.03 * w + 0.004 * br, 0.05 * s * w, 0);
      head.rotation.set(0.55 * k + 0.02 * w, 0.03 * Math.sin(st.t * 0.5) * (1 - k) * (1 - w), 0);

      // 왼팔: 내린 팔 ↔ 얼굴을 가린 팔
      dU.copy(restU).lerp(hideU, k).normalize();
      dF.copy(restF).lerp(hideF, k).normalize();
      if (w > 0.001) { qx.setFromAxisAngle(XAX, 0.3 * s * w); dU.applyQuaternion(qx); dF.applyQuaternion(qx); }
      aim(armL, dU, dF);
      drape.visible = st.k > 0.55;
      if (drape.visible) drape.scale.set(1, smooth(0.55, 1, st.k), 1);

      // 지팡이: 걸을 때 앞뒤로 짚는다
      staff.position.set(-0.36, Math.max(0, c) * 0.06 * w, 0.3 + 0.17 * s * w);
      staff.rotation.set(-0.05 - 0.16 * s * w, 0, 0.03);
      // 오른손이 지팡이를 잡도록 어깨와 팔꿈치를 푼다(2관절 IK)
      G.set(0, GRIP, 0).applyEuler(staff.rotation).add(staff.position);
      G.sub(upper.position).applyQuaternion(qa.copy(upper.quaternion).invert());
      nv_.subVectors(G, armR.S);
      var dist = Math.min(nv_.length(), ua + fa - 0.004);
      nv_.normalize();
      var al = (ua * ua - fa * fa + dist * dist) / (2 * dist), hh = Math.sqrt(Math.max(0, ua * ua - al * al));
      pole.set(-0.3, -0.75, -0.6);
      pole.addScaledVector(nv_, -pole.dot(nv_)).normalize();
      E.copy(armR.S).addScaledVector(nv_, al).addScaledVector(pole, hh);
      dU.subVectors(E, armR.S).normalize();
      dF.copy(armR.S).addScaledVector(nv_, dist).sub(E).normalize();
      aim(armR, dU, dF);
    }
    // instant가 true면 보간 없이 바로 바꾼다
    function setPose(name, instant) {
      if (!pose.hasOwnProperty(name)) return;
      st.target = pose[name];
      if (instant) { st.k = st.target; update(0, false); }
    }
    update(0, false);
    return { group: group, setPose: setPose, update: update };
  }

  /* ================================================================== 양 */
  function makeSheep(seed) {
    var R = rng((seed | 0) + 11), sm = mat('smooth');
    var sc = 0.86 + R() * 0.22;
    var WOOL = mix('#F7F0DF', '#E9DCC0', R() * 0.6), FACE = '#6B5040', EAR = '#553D2C', LEG = '#4A372C';
    var group = new T.Group(), body = new T.Group();
    group.add(body);
    group.scale.setScalar(sc);

    var b = new Builder(), i;
    var cy = 0.42, cz = -0.06, grad = [0.2, 0.5, 0.8];
    b.add(ball(10, 7), WOOL, TR(0, cy, cz, 0, 0, 0, 0.235, 0.215, 0.36), grad);
    for (i = 0; i < 11; i++) {
      var az = (i / 11) * TAU + R() * 0.5, el = 0.15 + R() * 1.1, r = 0.105 + R() * 0.05;
      b.add(ball(6, 4), WOOL, TR(Math.cos(az) * Math.cos(el) * 0.2, cy + Math.sin(el) * 0.175 - 0.01, cz + Math.sin(az) * Math.cos(el) * 0.31, R(), R(), 0, r, r * 0.86, r * 1.05), grad);
    }
    b.add(ball(6, 4), WOOL, TR(0, cy + 0.03, cz - 0.38, 0.5, 0, 0, 0.06, 0.075, 0.055), grad);        // 꼬리
    var firstLeg = b.pos.length;
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (q) {
      b.add(new T.CylinderGeometry(0.046, 0.034, 0.26, 6, 1, true), LEG, TR(q[0] * 0.115, 0.165, cz + q[1] * 0.2 + 0.01, q[1] * -0.05, 0, q[0] * -0.04));
      b.add(new T.CylinderGeometry(0.036, 0.04, 0.05, 6, 1), '#2E221B', TR(q[0] * 0.12, 0.025, cz + q[1] * 0.207 + 0.01));
    });
    var fleece = b.mesh(mat('sheepWalk'));
    // 발굽 쪽만 움직이는 두 걸음 자세. 몸과 다리를 한 번에 그린다.
    fleece.geometry.morphTargetsRelative = true;
    fleece.geometry.morphAttributes.position = [-1, 1].map(function (phase) {
      var offsets = new Float32Array(b.pos.length);
      for (var at = firstLeg; at < b.pos.length; at += 3) {
        var weight = clamp((0.30 - b.pos[at + 1]) / 0.28, 0, 1);
        var stride = Math.sign(b.pos[at] * (b.pos[at + 2] - cz)) * phase;
        offsets[at + 1] = Math.max(0, stride) * weight * 0.055;
        offsets[at + 2] = stride * weight * 0.12;
      }
      return new T.BufferAttribute(offsets, 3);
    });
    fleece.updateMorphTargets();
    body.add(fleece);

    // 머리(목에서 숙인다)
    var neckO = [0, 0.5, 0.2];
    var neck = new T.Group();
    neck.position.fromArray(neckO);
    body.add(neck);
    var h = new Builder(), HM = function (x, y, z, rx, ry, rz, sx, sy, sz) { return TR(x, neckO[1] + y, neckO[2] + z, rx, ry, rz, sx, sy, sz); };
    h.add(ball(7, 5), WOOL, HM(0, 0.0, 0.03, 0.4, 0, 0, 0.14, 0.15, 0.15), [0.36, 0.56, 0.84]);
    h.add(ball(8, 6), FACE, HM(0, 0.035, 0.2, 0.42, 0, 0, 0.08, 0.088, 0.14));
    h.add(ball(6, 4), '#58402F', HM(0, -0.012, 0.31, 0.42, 0, 0, 0.052, 0.045, 0.045));
    h.add(ball(6, 4), WOOL, HM(0, 0.115, 0.115, 0.2, 0, 0, 0.085, 0.07, 0.085));
    var ears = [];
    [-1, 1].forEach(function (s) {
      h.add(ball(5, 3), '#1E1511', HM(s * 0.066, 0.064, 0.235, 0, 0, 0, 0.017, 0.019, 0.015));
      var eb = new Builder();
      eb.add(ball(6, 4), EAR, TR(s * 0.055, -0.012, 0, 0, 0, 0, 0.062, 0.024, 0.036));
      var ear = eb.mesh(sm);
      ear.position.set(s * 0.066, 0.085, 0.13);
      ear.rotation.z = s * -0.5;
      neck.add(ear);
      ears.push(ear);
    });
    neck.add(h.mesh(sm, neckO));

    var st = { t: R() * 40, off: R(), stride: R() * TAU, mv: 0, alert: 0 };
    function update(dt, spd, attention, turn) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      st.t += dt;
      st.mv = lerp(st.mv, clamp(spd || 0, 0, 1), Math.min(1, dt * 6));
      var t = st.t, mv = st.mv, cyc = (t * 0.07 + st.off) % 1;
      var g = smooth(0.0, 0.1, cyc) * (1 - smooth(0.66, 0.76, cyc)) * (1 - mv * 0.85); // 1: 풀을 뜯는 중
      st.alert = lerp(st.alert, attention || 0, Math.min(1, dt * 4));
      g *= 1 - st.alert;
      st.stride += dt * st.mv * 9;
      var step = Math.sin(st.stride);
      fleece.morphTargetInfluences[0] = Math.max(0, -step) * st.mv;
      fleece.morphTargetInfluences[1] = Math.max(0, step) * st.mv;
      neck.rotation.x = lerp(0.05, 0.98, g) + g * 0.06 * Math.sin(t * 6.5) + (1 - g) * (0.03 * Math.sin(t * 1.1) + mv * 0.06 * step);
      var look = 0.12 * Math.sin(t * 0.43 + st.off * 9) * (1 - 0.6 * g);
      neck.rotation.y = lerp(neck.rotation.y, lerp(look, clamp(turn || 0, -0.70, 0.70), st.alert), Math.min(1, dt * 6));
      body.position.y = Math.abs(step) * 0.025 * mv;
      body.rotation.x = g * 0.05;
      body.rotation.z = step * 0.032 * mv;
      body.scale.set(1 + 0.012 * Math.sin(t * 1.7), 1, 1);
      var fl = Math.max(0, Math.sin(t * 0.9 + st.off * 20) - 0.93) * 14;
      ears[0].rotation.z = 0.5 + fl * 0.5;
      ears[1].rotation.z = -0.5 - fl * 0.5;
    }
    update(0, 0);
    return { group: group, update: update };
  }

  window.BO3D.models.moses = makeMoses;
  window.BO3D.models.sheep = makeSheep;
})();
