/* 자동 작업 3d-b(시대 5~6의 새 3D 장면)가 함께 쓰는 소품과 도우미. 틀(game.js 등)과 props_ot.js는 고치지 않고 이 파일에 더한다.
 *   BO3D.p3b.on(id)                 그 장면의 design3d.build가 true인가. false면 재료·물음을 이야기 카드 때의 모습(재료 1개)으로 되돌려 둔다
 *   BO3D.p3b.sm / hash / noise      지형 함수용
 *   BO3D.p3b.sky(scene, seed)       하늘 반구와 별 → { mat, stars }
 *   BO3D.p3b.ground(height, colorAt, size, seg)   꼭짓점 색 땅
 *   BO3D.p3b.tod(scene, sky, hemi, sun, table)    때(낮·저녁·밤)를 부드럽게 바꾼다 → { set(i, now), update(dt), value() }
 *   BO3D.p3b.mergeColored(objs)     움직이지 않는 물건을 재질별로 합친다(꼭짓점 색을 지킨다. props_ot.js의 mergeStatic은 색을 버린다)
 *   BO3D.p3b.actors(height)         사람을 걷게 하고 굽히고 앉히는 도우미 → { make, at, go, step, swap }
 *   BO3D.p3b.man(seed) / woman(seed) / child(seed)   백성 모형(짐 없음). 본문이 정한 사람은 씨앗값을 고정해 쓴다
 *   BO3D.p3b.house(w, h, d, mat) / jar(h) / ox(색) / polyDist(pts, x, z)
 * 본문이 모양을 말하지 않는 것은 단순한 꼴로만 둔다. 글자·무늬·신상은 넣지 않는다(스타일가이드 2절).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var T = THREE;
  function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
  function noise(x, z) {
    var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function std(c, o) { var m = new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.95 }); if (o) for (var k in o) m[k] = o[k]; return m; }

  /* 이 갈래의 3D 장면은 장면표(대표 장면 12개) 밖의 추가 제안이다. design3d.build를 false로 되돌리면 3D를 등록하지 않고,
     이야기 카드가 전과 같이 돌도록 재료를 첫째 하나만 남기고 탐지기 물음을 뺀다(이야기 카드 때의 재료는 늘 첫째에 둔다). */
  function on(id) {
    var d = BO3D.ot && BO3D.ot.scenes && BO3D.ot.scenes[id];
    if (!d) return false;
    if (d.has3d) return true;
    if (d.mission && d.mission.materials && d.mission.materials.length > 1) d.mission.materials = [d.mission.materials[0]];
    if (d.quests) delete d.quests;
    return false;
  }

  function sky(scene, seed, top, hor) {
    var R = BO3D.props.rng(seed || 1), g = new T.SphereGeometry(560, 24, 14), p = g.attributes.position, c = new Float32Array(p.count * 3), cc = new T.Color(), a = new T.Color(top || '#79AFCF'), b = new T.Color(hor || '#F4E6C4'), i;
    for (i = 0; i < p.count; i++) { var t = Math.max(0, p.getY(i) / 560); cc.copy(b).lerp(a, sm(0.02, 0.7, t)); c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; }
    g.setAttribute('color', new T.BufferAttribute(c, 3));
    var m = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(g, m));
    var sg = new T.BufferGeometry(), sp = []; for (i = 0; i < 500; i++) { var sa = R() * 6.28, se = 0.1 + R() * 1.3; sp.push(Math.cos(sa) * Math.cos(se) * 520, Math.sin(se) * 520, Math.sin(sa) * Math.cos(se) * 520); }
    sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    var stars = new T.PointsMaterial({ color: '#FFF6D8', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }); scene.add(new T.Points(sg, stars));
    return { mat: m, stars: stars };
  }
  function ground(height, colorAt, size, seg) {
    var g = new T.PlaneGeometry(size || 520, size || 520, seg || 160, seg || 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), i;
    for (i = 0; i < pos.count; i++) { var x = pos.getX(i), z = pos.getZ(i); pos.setY(i, height(x, z)); colorAt(x, z, c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); m.receiveShadow = true; return m;
  }
  /* table[i] = [배경·안개 색, 하늘에 곱하는 색, 반구 빛 세기, 해 세기, 해 색, 별(0~1)] */
  function tod(scene, skyO, hemi, sun, table) {
    var v = 0, want = 0, ca = new T.Color(), cb = new T.Color();
    function apply() {
      var a = Math.min(table.length - 1, Math.floor(v)), b = Math.min(table.length - 1, a + 1), t = v - a, A = table[a], B = table[b];
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); if (scene.fog) scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyO.mat.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t;
      ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t)); skyO.stars.opacity = ((A[5] || 0) + ((B[5] || 0) - (A[5] || 0)) * t) * 0.9;
    }
    apply();
    return {
      set: function (i, now) { want = i; if (now) { v = i; apply(); } },
      update: function (dt) { if (Math.abs(v - want) > 0.003) { v += (want - v) * Math.min(1, dt * 0.7); apply(); } },
      value: function () { return v; }
    };
  }

  function mergeColored(objs) {
    var byMat = [], out = new T.Group();
    objs.forEach(function (o) {
      o.updateMatrixWorld(true);
      o.traverse(function (m) {
        if (!m.isMesh || !m.visible) return;
        var g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
        var e = byMat.filter(function (x) { return x.mat === m.material; })[0]; if (!e) { e = { mat: m.material, gs: [] }; byMat.push(e); } e.gs.push(g);
      });
    });
    byMat.forEach(function (e) {
      var n = 0, k = 0, hasCol = e.gs.every(function (g) { return !!g.attributes.color; }); e.gs.forEach(function (g) { n += g.attributes.position.count; });
      var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = hasCol ? new Float32Array(n * 3) : null;
      e.gs.forEach(function (g) {
        pos.set(g.attributes.position.array, k * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, k * 3);
        if (col) { var ca = g.attributes.color, q; for (q = 0; q < ca.count; q++) { col[(k + q) * 3] = ca.getX(q); col[(k + q) * 3 + 1] = ca.getY(q); col[(k + q) * 3 + 2] = ca.getZ(q); } }
        k += g.attributes.position.count; g.dispose();
      });
      var bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(pos, 3)); bg.setAttribute('normal', new T.BufferAttribute(nor, 3)); if (col) bg.setAttribute('color', new T.BufferAttribute(col, 3)); bg.computeBoundingSphere();
      var mesh = new T.Mesh(bg, e.mat); mesh.castShadow = true; mesh.receiveShadow = true; out.add(mesh);
    });
    return out;
  }

  function person(seed, kind) {
    var o = null, M2 = BO3D.models2 || {};
    try { if (M2.israelite) o = M2.israelite(seed, { kind: kind, carry: 'none' }); } catch (e) { o = null; }
    if (!o) o = BO3D.props.soldier(seed, '#7A6A54', null);
    o.group.rotation.order = 'YXZ';
    return o;
  }

  /* 사람을 움직이는 도우미. a = make(모형) → at(a, x, z, 방향) / go(a, [[x,z]…], 빠르기, 끝 방향) / step(a, dt)
     bendWant(몸을 굽힘 0~1), sitWant(앉음·무릎 꿇음 0~1)는 장면이 정한다. swap은 Blender 인물이 읽히면 대체 모형과 바꾼다. */
  function actors(height) {
    function make(o, glb) { o.group.rotation.order = 'YXZ'; return { o: o, g: o.group, glb: !!glb, path: null, sp: 1.3, faceEnd: null, bend: 0, bendWant: 0, sit: 0, sitWant: 0, lift: 0, mv: 0 }; }
    function at(a, x, z, ry, lift) { a.path = null; a.lift = lift || 0; a.bend = a.bendWant = 0; a.sit = a.sitWant = 0; a.g.position.set(x, height(x, z) + a.lift, z); a.g.rotation.set(0, ry === undefined ? a.g.rotation.y : ry, 0); a.mv = 0; }
    function go(a, pts, sp, faceEnd) { a.path = pts.map(function (p) { return [p[0], p[1]]; }); a.sp = sp || 1.3; a.faceEnd = faceEnd === undefined ? null : faceEnd; }
    function step(a, dt) {
      var p = a.g.position, mv = 0;
      if (a.path && a.path.length) {
        var q = a.path[0], dx = q[0] - p.x, dz = q[1] - p.z, d = Math.sqrt(dx * dx + dz * dz), s = a.sp * dt;
        if (d <= s) { p.x = q[0]; p.z = q[1]; a.path.shift(); if (!a.path.length && a.faceEnd !== null) a.g.rotation.y = a.faceEnd; }
        else { p.x += dx / d * s; p.z += dz / d * s; a.g.rotation.y = Math.atan2(dx, dz); }
        mv = a.sp;
      }
      a.mv = mv;
      a.bend += (a.bendWant - a.bend) * Math.min(1, dt * 2.2); a.sit += (a.sitWant - a.sit) * Math.min(1, dt * 2.2);
      a.g.rotation.x = a.bend * 0.75; p.y = height(p.x, p.z) + a.lift - a.sit * 0.5 - a.bend * 0.12;
      if (a.o.update) a.o.update(dt, a.glb ? mv > 0 : mv);
    }
    function swap(a, nm, scene) {
      nm.group.rotation.order = 'YXZ'; nm.group.position.copy(a.g.position); nm.group.rotation.copy(a.g.rotation); nm.group.visible = a.g.visible;
      if (a.kids) a.kids.forEach(function (k) { nm.group.add(k); });
      scene.remove(a.g); scene.add(nm.group); a.o = nm; a.g = nm.group; a.glb = true;
    }
    function moving(a) { return !!(a.path && a.path.length); }
    return { make: make, at: at, go: go, step: step, swap: swap, moving: moving };
  }

  /* 흙벽 집: 상자 몸통, 평평한 지붕 둘레의 낮은 턱, 문 하나와 작은 창. 생김새는 본문에 없어 단순하게만(감수 대상). 문은 +Z 쪽 */
  var DARK = null, RIM = null;
  function house(w, h, d, mat) {
    DARK = DARK || std('#5A4028'); RIM = RIM || std('#C4A678');
    var g = new T.Group(), b = new T.Mesh(new T.BoxGeometry(w, h, d), mat); b.castShadow = true; g.add(b);
    var r = new T.Mesh(new T.BoxGeometry(w + 0.3, 0.35, d + 0.3), RIM); r.position.y = h / 2 + 0.1; g.add(r);
    var dr = new T.Mesh(new T.BoxGeometry(0.95, 1.9, 0.12), DARK); dr.position.set(-w * 0.18, -h / 2 + 1.25, d / 2 + 0.02); g.add(dr);
    var wn = new T.Mesh(new T.BoxGeometry(0.5, 0.55, 0.12), DARK); wn.position.set(w * 0.24, -h / 2 + 2.0, d / 2 + 0.02); g.add(wn);
    var w2 = new T.Mesh(new T.BoxGeometry(0.12, 0.55, 0.5), DARK); w2.position.set(w / 2 + 0.02, -h / 2 + 2.0, d * 0.15); g.add(w2);
    return g;
  }
  function jar(h) {
    var pts = [[0.0, 0], [0.16, 0], [0.26, 0.25], [0.28, 0.5], [0.2, 0.8], [0.11, 0.92], [0.14, 1]].map(function (p) { return new T.Vector2(p[0] * (h || 0.8), p[1] * (h || 0.8)); });
    var m = new T.Mesh(new T.LatheGeometry(pts, 10), std('#B07A52', { side: T.DoubleSide })); m.castShadow = true; return m;
  }
  /* 수소: 몸통·목·머리·뿔·다리. 서 있거나 걷는 모습만(잡는 모습은 그리지 않는다). → { group, update(dt, speed) } */
  function ox(col) {
    var g = new T.Group(), m = std(col || '#7A5A3E'), dk = std('#3A2A20'), hn = std('#E6DCC4'), legs = [], t = 0;
    var body = new T.Mesh(new T.BoxGeometry(0.75, 0.8, 1.7), m); body.position.y = 1.05; g.add(body);
    var hump = new T.Mesh(new T.BoxGeometry(0.6, 0.3, 0.6), m); hump.position.set(0, 1.5, 0.45); g.add(hump);
    var neck = new T.Mesh(new T.BoxGeometry(0.45, 0.55, 0.5), m); neck.position.set(0, 1.25, 1.0); neck.rotation.x = 0.5; g.add(neck);
    var head = new T.Mesh(new T.BoxGeometry(0.42, 0.4, 0.6), m); head.position.set(0, 1.2, 1.38); head.rotation.x = 0.5; g.add(head);
    [-1, 1].forEach(function (s) { var h = new T.Mesh(new T.ConeGeometry(0.05, 0.36, 5), hn); h.position.set(s * 0.26, 1.5, 1.22); h.rotation.z = -s * 0.9; g.add(h); });
    var tail = new T.Mesh(new T.BoxGeometry(0.07, 0.7, 0.07), dk); tail.position.set(0, 1.0, -0.9); tail.rotation.x = 0.15; g.add(tail);
    [[-0.25, 0.62], [0.25, 0.62], [-0.25, -0.62], [0.25, -0.62]].forEach(function (q) { var pv = new T.Group(); pv.position.set(q[0], 0.7, q[1]); var lg = new T.Mesh(new T.BoxGeometry(0.17, 0.7, 0.17), m); lg.position.y = -0.35; pv.add(lg); g.add(pv); legs.push(pv); });
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, update: function (dt, speed) { t += dt * (speed || 0) * 4; var a2 = speed > 0.05 ? Math.sin(t) * 0.4 : 0; legs.forEach(function (l, i) { l.rotation.x = (i === 0 || i === 3) ? a2 : -a2; }); } };
  }
  /* 꺾은선 pts에서 (x, z)까지의 거리 */
  function polyDist(pts, x, z) {
    var best = 1e9, i;
    for (i = 0; i + 1 < pts.length; i++) {
      var ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      var t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0, d = Math.hypot(x - ax - dx * t, z - az - dz * t);
      if (d < best) best = d;
    }
    return best;
  }

  BO3D.p3b = { on: on, sm: sm, hash: hash, noise: noise, std: std, sky: sky, ground: ground, tod: tod, mergeColored: mergeColored, actors: actors,
    man: function (s) { return person(s, 'man'); }, woman: function (s) { return person(s, 'woman'); }, child: function (s) { return person(s, s % 2 ? 'boy' : 'girl'); },
    house: house, jar: jar, ox: ox, polyDist: polyDist };
})();
