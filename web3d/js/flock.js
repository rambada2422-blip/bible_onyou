/* 양 떼: 모세가 치던 장인 이드로의 양 떼 (출 3:1).
 * 휴대폰에서 끊기지 않도록 양 한 종류의 모양을 몸통 하나, 머리 하나로 묶어 InstancedMesh로 그린다.
 * 그리는 횟수는 마릿수와 상관없이 몸통 1번 + 머리 1번이다.
 *
 * 움직임 (본문에 없는 연출은 넣지 않는다. 양 떼가 모세를 따라 호렙에 이른 것만 보여 준다):
 *   home   : 처음 자리에서 풀을 뜯는다
 *   follow : 모세가 걷기 시작하면 뒤를 따라 무리 지어 걷는다
 *   graze  : 모세가 언덕에 오르면 언덕 서쪽 기슭에 머물며 풀을 뜯는다 (양 떼는 언덕에 오르지 않는다)
 * 아이가 가까이 오면 양이 조금 비켜선다.
 * 시범(2026-11-17, 탐험대 이야기): 아이가 무리 곁에서 가만히 서 있으면 가까운 양 한 마리가 천천히 다가와 고개를 든다. 아이가 움직이면 돌아간다.
 * 그래픽 시험(2026-11-17, docs/20): 양마다 하는 짓이 다르다 — 풀 뜯기, 고개 들어 둘러보기, 되새김질, 앉아 쉬기, 귀 털기, 꼬리 흔들기.
 *   모두 양이 평소에 하는 짓이고 본문의 흐름(모세를 따라 호렙에 이름)은 그대로다. 그리는 횟수는 여전히 몸통 1번 + 머리 1번이다
 *   (꼬리와 귀는 꼭짓점에 부위 번호 aPart를 달아 두고, gfx_horeb.js의 재질이 양마다 다른 값 aAnim으로 움직인다. 그 재질이 없으면 꼬리·귀만 가만히 있다).
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var T = THREE;

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* 코드로 만든 양 한 마리에서 몸통과 머리(귀 포함)의 모양을 뽑아 각각 하나로 합친다 */
  function template(M) {
    var one = M.sheep(1), g = one.group, body = g.children[0], neck = null;
    body.children.forEach(function (c) { if (c.isGroup) neck = c; });
    g.scale.setScalar(1); g.updateMatrixWorld(true);
    var inv = new T.Matrix4();
    function bake(meshes, space) {
      inv.copy(space.matrixWorld).invert();
      var pos = [], nor = [], col = [], m4 = new T.Matrix4(), n3 = new T.Matrix3(), v = new T.Vector3(), ranges = [];
      meshes.forEach(function (m) {
        m4.multiplyMatrices(inv, m.matrixWorld); n3.getNormalMatrix(m4);
        ranges.push([pos.length / 3, pos.length / 3 + m.geometry.attributes.position.count]);
        var P = m.geometry.attributes.position, N = m.geometry.attributes.normal, Cc = m.geometry.attributes.color, i;
        for (i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z);
          v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); nor.push(v.x, v.y, v.z);
          col.push(Cc.getX(i), Cc.getY(i), Cc.getZ(i));
        }
      });
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      geo.computeBoundingSphere();
      geo.userData.ranges = ranges;
      return geo;
    }
    /* 부위 번호: 0 몸·머리, 1 꼬리, 2·3 귀(왼쪽·오른쪽 순서는 models.js의 makeSheep과 같다) */
    function parts(geo, list) {
      var a = new Float32Array(geo.attributes.position.count);
      list.forEach(function (r) { for (var k = r[0]; k < r[1] && k < a.length; k++) a[k] = r[2]; });
      geo.setAttribute('aPart', new T.BufferAttribute(a, 1));
    }
    var bodyMeshes = body.children.filter(function (c) { return c.isMesh; });
    var headMeshes = neck ? neck.children.filter(function (c) { return c.isMesh; }) : [];
    var out = { body: bake(bodyMeshes, body), head: headMeshes.length ? bake(headMeshes, neck) : null, neck: neck ? neck.position.clone() : new T.Vector3(0, 0.5, 0.2), material: bodyMeshes[0].material };
    /* 꼬리: 몸통을 만드는 순서(큰 공 360 + 털 뭉치 11 x 108 꼭짓점 뒤의 108개)로 찾고, 자리가 맞는지 확인한다. 맞지 않으면 꼬리는 움직이지 않는다 */
    var bp = out.body.attributes.position, t0 = 360 + 11 * 108, t1 = t0 + 108, cx = 0, cy = 0, cz = 0, k;
    if (bp.count >= t1) { for (k = t0; k < t1; k++) { cx += bp.getX(k); cy += bp.getY(k); cz += bp.getZ(k); } cx /= 108; cy /= 108; cz /= 108; }
    var tailOk = bp.count >= t1 && Math.abs(cx) < 0.03 && Math.abs(cy - 0.45) < 0.05 && Math.abs(cz + 0.44) < 0.05;
    parts(out.body, tailOk ? [[t0, t1, 1]] : []);
    if (out.head) { var hr = out.head.userData.ranges; parts(out.head, hr.length >= 3 ? [[hr[0][0], hr[0][1], 2], [hr[1][0], hr[1][1], 3]] : []); }
    out.tailOk = tailOk;
    return out;
  }

  function create(scene, W, opts) {
    var M = BO3D.models || {};
    if (!M.sheep) return null;
    var N = opts.count || 40, P = W.P, H = W.height;
    var tp = template(M);
    var bodyIM = new T.InstancedMesh(tp.body, tp.material, N), headIM = tp.head ? new T.InstancedMesh(tp.head, tp.material, N) : null;
    bodyIM.castShadow = true; bodyIM.frustumCulled = false;
    if (headIM) { headIM.castShadow = true; headIM.frustumCulled = false; }
    bodyIM.userData.gfx = 'sheep'; if (headIM) headIM.userData.gfx = 'sheep';
    /* 양마다 꼬리(x)와 귀(y)의 각도. 몸통과 머리가 같은 값을 함께 쓴다 */
    var animArr = new Float32Array(N * 2), animAttr = new T.InstancedBufferAttribute(animArr, 2);
    tp.body.setAttribute('aAnim', animAttr); if (tp.head) tp.head.setAttribute('aAnim', animAttr);
    scene.add(bodyIM); if (headIM) scene.add(headIM);

    var R = rng(4242), sh = [], i, tint = new T.Color();
    for (i = 0; i < N; i++) {
      sh.push({ x: 0, z: 0, yaw: 0, vx: 0, vz: 0, s: 0.84 + R() * 0.26, ph: R() * 40, off: R(), hx: 0, hz: 0, walk: 0, wt: R() * 8, bob: 0,
        beh: 'graze', bt: 0, hp: 0.9, hy: 0, hyT: 0, lie: 0, tw: 0, ef: 0, push: 0 });
      /* 털 색을 조금씩 다르게. 몇 마리는 짙은 털 */
      var dark = R() < 0.12;
      tint.setRGB(dark ? 0.55 : 0.93 + R() * 0.07, dark ? 0.47 : 0.9 + R() * 0.08, dark ? 0.4 : 0.84 + R() * 0.12);
      bodyIM.setColorAt(i, tint);
      if (headIM) headIM.setColorAt(i, tint.setRGB(1, 1, 1));
    }
    if (bodyIM.instanceColor) bodyIM.instanceColor.needsUpdate = true;
    if (headIM && headIM.instanceColor) headIM.instanceColor.needsUpdate = true;

    var mode = 'home', center = new T.Vector3(), home = P.flock, graze = P.flockGraze;
    /* 무리 안의 자리: 해바라기 씨 배열로 고르게 흩는다 */
    function slot(i, cx, cz, spread) {
      var a = i * 2.39996 + 0.3, r = spread * Math.sqrt((i + 0.5) / N);
      return [cx + Math.cos(a) * r, cz + Math.sin(a) * r * 0.8];
    }
    function placeAll(cx, cz, spread) {
      sh.forEach(function (q, i) {
        var p = slot(i, cx, cz, spread);
        q.x = p[0] + (R() - 0.5) * 0.8; q.z = p[1] + (R() - 0.5) * 0.8; q.hx = q.x; q.hz = q.z; q.vx = q.vz = 0; q.yaw = R() * 6.28;
      });
    }
    function reset() {
      mode = 'home'; placeAll(home[0], home[1], 6.2);
      sh.forEach(function (q) { pick(q); q.bt *= RB(); q.lie = q.beh === 'rest' ? 1 : 0; q.hp = q.beh === 'graze' ? 0.98 : q.beh === 'look' ? 0 : 0.3; q.hy = 0; q.tw = q.ef = q.push = 0; });
      write(0);
    }
    function settle() {
      var far = Math.hypot(center.x - graze[0], center.z - graze[1]) > 14;
      mode = 'graze';
      if (far) placeAll(graze[0], graze[1], 6.0);
      sh.forEach(function (q, i) { var p = slot(i, graze[0], graze[1], 6.0); q.hx = p[0]; q.hz = p[1]; });
    }

    var m4 = new T.Matrix4(), q4 = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(), ps = new T.Vector3(), nm = new T.Matrix4(), nq = new T.Quaternion(), ne = new T.Euler(), npos = new T.Vector3(), one = new T.Vector3(1, 1, 1);
    var avoid = null, calm = null, friend = -1;
    function write(t) {
      center.set(0, 0, 0);
      sh.forEach(function (q, i) {
        var y = H(q.x, q.z);
        var gz = smooth(0.35, 0.9, q.hp) * (1 - q.lie);   /* 풀을 뜯느라 고개를 숙인 정도 */
        var bob = Math.abs(Math.sin(q.wt * 7)) * 0.035 * q.walk;
        e.set(gz * 0.05 + Math.sin(q.wt * 7) * 0.03 * q.walk, q.yaw, 0);
        q4.setFromEuler(e); sc.setScalar(q.s); ps.set(q.x, y + bob - 0.19 * q.s * q.lie, q.z);   /* 앉아 쉴 때는 다리를 접은 만큼 몸을 낮춘다 */
        m4.compose(ps, q4, sc); bodyIM.setMatrixAt(i, m4);
        if (headIM) {
          ne.set(q.hp, q.hy, 0);
          nq.setFromEuler(ne); npos.copy(tp.neck);
          nm.compose(npos, nq, one); m4.multiply(nm); headIM.setMatrixAt(i, m4);
        }
        center.x += q.x; center.z += q.z;
      });
      center.multiplyScalar(1 / N); center.y = H(center.x, center.z);
      bodyIM.instanceMatrix.needsUpdate = true; if (headIM) headIM.instanceMatrix.needsUpdate = true;
    }

    /* 매 프레임: 목표 자리로 끌리고, 서로 밀어내고, 아이를 피한다 */
    /* 양마다 하는 짓(그래픽 시험): 풀 뜯기 · 고개 들어 둘러보기 · 되새김질 · 앉아 쉬기, 그리고 가끔 꼬리 흔들기와 귀 털기.
       모세를 따라 걸을 때와 아이가 가까이 와서 비켜설 때는 일어나 걷는다 */
    var RB = rng(9090);
    function pick(q) {
      var r = RB();
      if (r < 0.5) { q.beh = 'graze'; q.bt = 4 + RB() * 6; }
      else if (r < 0.78) { q.beh = 'look'; q.bt = 2 + RB() * 3.5; q.hyT = (RB() - 0.5) * 1.3; }
      else if (r < 0.93) { q.beh = 'chew'; q.bt = 2 + RB() * 3; }
      else { q.beh = 'rest'; q.bt = 9 + RB() * 10; }
    }
    function behave(dt, t) {
      sh.forEach(function (q, i) {
        var isFriend = i === friend && calm, hpT, hyT = 0, lieT = 0;
        q.bt -= dt; if (q.bt <= 0) pick(q);
        q.push = Math.max(0, q.push - dt);
        if ((mode === 'follow' || q.push > 0 || isFriend) && q.beh === 'rest') { q.beh = 'look'; q.bt = 1.5 + RB() * 2; q.hyT = 0; }
        if (isFriend) {   /* 가만히 선 아이를 바라본다 */
          var want = Math.atan2(calm.x - q.x, calm.z - q.z) - q.yaw; want = Math.atan2(Math.sin(want), Math.cos(want));
          hpT = 0.02; hyT = Math.max(-0.9, Math.min(0.9, want));
        } else if (q.walk > 0.3) hpT = 0.12;
        else if (q.beh === 'graze') hpT = 0.98 + 0.06 * Math.sin(t * 6.5 + i);
        else if (q.beh === 'look') { hpT = 0.0; hyT = q.hyT + 0.1 * Math.sin(t * 0.43 + q.off * 9); if (RB() < dt * 0.25) q.hyT = (RB() - 0.5) * 1.4; }
        else if (q.beh === 'chew') { hpT = 0.24 + 0.045 * Math.sin(t * 8.5 + i * 1.7); hyT = 0.12 * Math.sin(t * 0.43 + q.off * 9); }
        else { hpT = 0.34 + 0.03 * Math.sin(t * 7.5 + i); lieT = 1; }
        q.hp += (hpT - q.hp) * Math.min(1, dt * 3.2); q.hy += (hyT - q.hy) * Math.min(1, dt * 2.2); q.lie += (lieT - q.lie) * Math.min(1, dt * 1.6);
        if (!REDUCED) {
          if (q.tw <= 0 && RB() < dt * 0.14) q.tw = 0.7 + RB() * 0.9;
          if (q.ef <= 0 && RB() < dt * 0.22) q.ef = 0.28;
        }
        q.tw = Math.max(0, q.tw - dt); q.ef = Math.max(0, q.ef - dt);
        animArr[i * 2] = q.tw > 0 ? Math.sin(t * 19 + i) * 0.6 * Math.min(1, q.tw * 4) : 0;
        animArr[i * 2 + 1] = q.ef > 0 ? Math.sin((1 - q.ef / 0.28) * Math.PI) * 0.55 : 0;
      });
      animAttr.needsUpdate = true;
    }

    function update(dt, t, mosesPos, mosesWalking, mosesLeg) {
      dt = Math.min(dt, 0.05);
      if (mode === 'home' && mosesWalking) mode = 'follow';
      if (mode === 'follow' && (mosesLeg >= 3 || !mosesWalking)) settle();
      var fx = 0, fz = 0, fyaw = 0;
      if (mode === 'follow') {
        /* 모세 뒤로 무리가 길게 늘어선다 */
        fyaw = Math.atan2(mosesPos.x - center.x, mosesPos.z - center.z);
        fx = Math.sin(fyaw); fz = Math.cos(fyaw);
      }
      sh.forEach(function (q, i) {
        var tx, tz, maxSp;
        if (mode === 'follow') {
          var row = Math.floor(i / 5), col = (i % 5) - 2;
          var back = 2.6 + row * 1.25;
          tx = mosesPos.x - fx * back + fz * col * 1.05 + Math.sin(i * 7.1) * 0.35;
          tz = mosesPos.z - fz * back - fx * col * 1.05 + Math.cos(i * 5.3) * 0.35;
          maxSp = 2.6;
        } else {
          /* 풀을 뜯으며 제자리 둘레를 천천히 맴돈다 */
          tx = q.hx + Math.sin(t * 0.05 + q.ph) * 0.9; tz = q.hz + Math.cos(t * 0.04 + q.ph * 1.3) * 0.9;
          maxSp = mode === 'graze' && Math.hypot(q.x - q.hx, q.z - q.hz) > 3 ? 2.2 : 0.35;
          if (q.beh === 'rest' && q.lie > 0.2) { tx = q.x; tz = q.z; }   /* 앉아 쉬는 양은 제자리 */
          if (i === friend && calm) {   /* 가만히 선 아이 쪽으로 한 걸음 앞까지 */
            var cdx = q.x - calm.x, cdz = q.z - calm.z, cd = Math.sqrt(cdx * cdx + cdz * cdz) || 1;
            tx = calm.x + cdx / cd * 1.35; tz = calm.z + cdz / cd * 1.35; maxSp = 0.9;
          }
        }
        var ax = (tx - q.x) * 1.4, az = (tz - q.z) * 1.4;
        /* 서로 너무 붙지 않게 */
        for (var j = 0; j < N; j++) {
          if (j === i) continue;
          var o = sh[j], dx = q.x - o.x, dz = q.z - o.z, d2 = dx * dx + dz * dz;
          if (d2 < 0.81 && d2 > 1e-6) { var d = Math.sqrt(d2), k = (0.9 - d) / d * 6; ax += dx * k; az += dz * k; }
        }
        if (avoid && !(i === friend && calm)) {
          var adx = q.x - avoid.x, adz = q.z - avoid.z, ad2 = adx * adx + adz * adz;
          if (ad2 < 4 && ad2 > 1e-6) { var ad = Math.sqrt(ad2), ak = (2 - ad) / ad * 7; ax += adx * ak; az += adz * ak; q.push = 0.6; }
        }
        q.vx += (ax - q.vx * 2.2) * dt * 2.2; q.vz += (az - q.vz * 2.2) * dt * 2.2;
        var sp = Math.hypot(q.vx, q.vz);
        if (sp > maxSp) { q.vx *= maxSp / sp; q.vz *= maxSp / sp; sp = maxSp; }
        var nx = q.x + q.vx * dt, nz = q.z + q.vz * dt;
        /* 언덕 비탈로 올라가지 않는다 */
        if (W.hill && W.hill(nx, nz) > 1.6) { q.vx *= -0.3; q.vz *= -0.3; } else { q.x = nx; q.z = nz; }
        q.walk += ((sp > 0.25 ? 1 : 0) - q.walk) * Math.min(1, dt * 4);
        q.wt += dt * sp * 1.2;
        if (sp > 0.12) { var want = Math.atan2(q.vx, q.vz), dd = Math.atan2(Math.sin(want - q.yaw), Math.cos(want - q.yaw)); q.yaw += dd * Math.min(1, dt * 5); }
      });
      behave(dt, t);
      write(t);
    }

    reset();
    return {
      update: update, reset: reset, settle: settle, center: function () { return center; },
      setAvoid: function (v) { avoid = v; }, count: N, meshes: [bodyIM, headIM],
      /* 걷고 있는 양 한 마리의 발 자리(없으면 null). 발밑 먼지를 일으킬 때 쓴다. r: 0..1 */
      walkers: function (r) { var q = sh[Math.floor(r * N) % N]; return q.walk > 0.5 ? { x: q.x, y: H(q.x, q.z), z: q.z } : null; },
      behaviors: function () { var c = {}; sh.forEach(function (q) { c[q.beh] = (c[q.beh] || 0) + 1; }); c.tail = tp.tailOk; return c; },
      /* 가만히 선 아이의 자리(없으면 null). 가장 가까운 양 한 마리가 다가온다 */
      setCalm: function (v) {
        if (!v || mode === 'follow') { calm = null; friend = -1; return; }
        calm = v;
        if (friend < 0) { var bd = 1e9; sh.forEach(function (q, i) { var d = Math.hypot(q.x - v.x, q.z - v.z); if (d < bd) { bd = d; friend = i; } }); if (bd > 9) { friend = -1; calm = null; } }
      },
      friendDist: function () { return friend >= 0 && calm ? Math.hypot(sh[friend].x - calm.x, sh[friend].z - calm.z) : 999; }
    };
  }

  BO3D.flock = { create: create };
})();
