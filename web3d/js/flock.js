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

  /* 코드로 만든 양 한 마리에서 몸통과 머리(귀 포함)의 모양을 뽑아 각각 하나로 합친다 */
  function template(M) {
    var one = M.sheep(1), g = one.group, body = g.children[0], neck = null;
    body.children.forEach(function (c) { if (c.isGroup) neck = c; });
    g.scale.setScalar(1); g.updateMatrixWorld(true);
    var inv = new T.Matrix4();
    function bake(meshes, space) {
      inv.copy(space.matrixWorld).invert();
      var pos = [], nor = [], col = [], m4 = new T.Matrix4(), n3 = new T.Matrix3(), v = new T.Vector3();
      meshes.forEach(function (m) {
        m4.multiplyMatrices(inv, m.matrixWorld); n3.getNormalMatrix(m4);
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
      return geo;
    }
    var bodyMeshes = body.children.filter(function (c) { return c.isMesh; });
    var headMeshes = neck ? neck.children.filter(function (c) { return c.isMesh; }) : [];
    var out = { body: bake(bodyMeshes, body), head: headMeshes.length ? bake(headMeshes, neck) : null, neck: neck ? neck.position.clone() : new T.Vector3(0, 0.5, 0.2), material: bodyMeshes[0].material };
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
    scene.add(bodyIM); if (headIM) scene.add(headIM);

    var R = rng(4242), sh = [], i, tint = new T.Color();
    for (i = 0; i < N; i++) {
      sh.push({ x: 0, z: 0, yaw: 0, vx: 0, vz: 0, s: 0.84 + R() * 0.26, ph: R() * 40, off: R(), hx: 0, hz: 0, walk: 0, wt: R() * 8, bob: 0 });
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
    function reset() { mode = 'home'; placeAll(home[0], home[1], 6.2); write(0); }
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
        var cyc = (t * 0.07 + q.off) % 1;
        var gz = q.walk > 0.3 || i === friend ? 0 : smooth(0.0, 0.1, cyc) * (1 - smooth(0.66, 0.76, cyc));
        var bob = Math.abs(Math.sin(q.wt * 7)) * 0.035 * q.walk;
        e.set(gz * 0.05 + Math.sin(q.wt * 7) * 0.03 * q.walk, q.yaw, 0);
        q4.setFromEuler(e); sc.setScalar(q.s); ps.set(q.x, y + bob, q.z);
        m4.compose(ps, q4, sc); bodyIM.setMatrixAt(i, m4);
        if (headIM) {
          ne.set((q.walk > 0.3 ? 0.12 : 0.05 + 0.93 * gz) + gz * 0.06 * Math.sin(t * 6.5 + i), 0.12 * Math.sin(t * 0.43 + q.off * 9) * (1 - 0.6 * gz), 0);
          nq.setFromEuler(ne); npos.copy(tp.neck);
          nm.compose(npos, nq, one); m4.multiply(nm); headIM.setMatrixAt(i, m4);
        }
        center.x += q.x; center.z += q.z;
      });
      center.multiplyScalar(1 / N); center.y = H(center.x, center.z);
      bodyIM.instanceMatrix.needsUpdate = true; if (headIM) headIM.instanceMatrix.needsUpdate = true;
    }

    /* 매 프레임: 목표 자리로 끌리고, 서로 밀어내고, 아이를 피한다 */
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
          if (ad2 < 4 && ad2 > 1e-6) { var ad = Math.sqrt(ad2), ak = (2 - ad) / ad * 7; ax += adx * ak; az += adz * ak; }
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
      write(t);
    }

    reset();
    return {
      update: update, reset: reset, settle: settle, center: function () { return center; },
      setAvoid: function (v) { avoid = v; }, count: N, meshes: [bodyIM, headIM],
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
