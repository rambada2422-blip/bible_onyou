/* 구약 3D 장면에서 함께 쓰는 단순한 소품(코드 모델). 인형풍, 꼭짓점 색 없이 평면 음영.
 * 본문이 모양을 말하지 않는 것(장막, 병거의 생김새)은 단순한 꼴로만 둔다. 글자·무늬·신상은 넣지 않는다(스타일가이드 2절).
 *   BO3D.props.tent(seed)            장막
 *   BO3D.props.chariot(seed)         말 두 마리가 끄는 병거(사람은 태우지 않는다)
 *   BO3D.props.cloudPillar(h)        구름 기둥(출 13:21, 14:19). 형상 없이 둥근 구름 덩이만. { group, setNight(0..1), update(t) }
 *   BO3D.props.stoneHeap(seed, n)    돌무더기
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var T = THREE;
  function rng(seed) { var s = (seed * 2654435761) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function std(c, o) { var m = new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.92 }); if (o) for (var k in o) m[k] = o[k]; return m; }
  var MAT = {};
  function M(c) { return MAT[c] || (MAT[c] = std(c)); }

  function tent(seed) {
    var g = new T.Group(), r = rng(seed + 7), cols = ['#8A6A4A', '#6E5A44', '#9A7A54', '#5E4E3E', '#7A5E40'];
    var w = 2.4 + r() * 1.4, d = 2.0 + r() * 1.2, h = 1.4 + r() * 0.5, c = cols[seed % cols.length];
    var geo = new T.CylinderGeometry(0.02, 1, 1, 4, 1, true); geo.rotateY(Math.PI / 4);
    var cloth = new T.MeshStandardMaterial({ color: c, flatShading: true, side: T.DoubleSide, roughness: 1 });
    var m = new T.Mesh(geo, cloth); m.scale.set(w * 0.72, h, d * 0.72); m.position.y = h / 2; m.castShadow = true; g.add(m);
    var pole = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, h + 0.3, 5), M('#5A4430')); pole.position.y = (h + 0.3) / 2; g.add(pole);
    g.userData.stillProp = true;   /* 움직이지 않는 소품: 장면에 바로 놓였으면 틀이 한 덩어리로 합쳐 그린다(mergeTagged) */
    return g;
  }

  /* 말: 몸통, 목, 머리, 다리 넷. 걸을 때 다리를 흔든다 */
  function horse(col) {
    var g = new T.Group(), m = M(col), dark = M('#2E2420');
    var body = new T.Mesh(new T.BoxGeometry(0.55, 0.6, 1.5), m); body.position.y = 1.25; g.add(body);
    var neck = new T.Mesh(new T.BoxGeometry(0.32, 0.75, 0.38), m); neck.position.set(0, 1.62, 0.78); neck.rotation.x = -0.6; g.add(neck);
    var head = new T.Mesh(new T.BoxGeometry(0.26, 0.28, 0.6), m); head.position.set(0, 1.92, 1.12); head.rotation.x = 0.35; g.add(head);
    var mane = new T.Mesh(new T.BoxGeometry(0.08, 0.6, 0.3), dark); mane.position.set(0, 1.78, 0.68); mane.rotation.x = -0.6; g.add(mane);
    var tail = new T.Mesh(new T.BoxGeometry(0.1, 0.55, 0.12), dark); tail.position.set(0, 1.2, -0.82); tail.rotation.x = 0.4; g.add(tail);
    var legs = [];
    [[-0.18, 0.55], [0.18, 0.55], [-0.18, -0.55], [0.18, -0.55]].forEach(function (q, i) {
      var pv = new T.Group(); pv.position.set(q[0], 0.98, q[1]);
      var lg = new T.Mesh(new T.BoxGeometry(0.13, 0.98, 0.13), m); lg.position.y = -0.49; pv.add(lg);
      g.add(pv); legs.push(pv);
    });
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return { group: g, legs: legs };
  }
  function chariot(seed) {
    var r = rng(seed + 3), g = new T.Group(), wood = M('#8A5A32'), rim = M('#5A3A20');
    var box = new T.Mesh(new T.BoxGeometry(1.3, 0.75, 0.9), wood); box.position.set(0, 0.95, -1.9); g.add(box);
    var front = new T.Mesh(new T.BoxGeometry(1.3, 0.3, 0.08), M('#B08048')); front.position.set(0, 1.45, -1.48); g.add(front);
    var axle = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.9, 6), rim); axle.rotation.z = Math.PI / 2; axle.position.set(0, 0.6, -2.0); g.add(axle);
    var wheels = [];
    [-0.88, 0.88].forEach(function (x) {
      var wh = new T.Mesh(new T.TorusGeometry(0.52, 0.06, 5, 14), rim); wh.rotation.y = Math.PI / 2; wh.position.set(x, 0.6, -2.0); g.add(wh); wheels.push(wh);
      for (var k = 0; k < 3; k++) { var sp = new T.Mesh(new T.BoxGeometry(0.04, 1.0, 0.04), rim); sp.position.copy(wh.position); sp.rotation.x = k * 1.05; g.add(sp); }
    });
    var pole = new T.Mesh(new T.BoxGeometry(0.08, 0.08, 2.4), wood); pole.position.set(0, 1.0, -0.4); g.add(pole);
    var cols = ['#7A5A3E', '#5E4632', '#A88A68', '#3E302A'];
    var h1 = horse(cols[Math.floor(r() * 4)]), h2 = horse(cols[Math.floor(r() * 4)]);
    h1.group.position.set(-0.42, 0, 0.5); h2.group.position.set(0.42, 0, 0.5); g.add(h1.group); g.add(h2.group);
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    var ph = r() * 6;
    return {
      group: g, wheels: wheels,
      update: function (dt, speed, t) {
        var a = speed > 0.05 ? Math.sin((t + ph) * 9) * 0.5 : 0;
        [h1, h2].forEach(function (h, k) { h.legs.forEach(function (lg, i) { lg.rotation.x = (i % 2 === k % 2 ? a : -a); }); });
      }
    };
  }

  /* 구름 기둥: 둥근 구름 덩이를 겹쳐 쌓는다. 얼굴·사람 같은 모양이 생기지 않게 크고 매끈한 공만 쓴다.
     밤(setNight 1)에는 한쪽이 은은하게 밝다(출 14:20, 이스라엘 쪽을 비춤) */
  function cloudPillar(h) {
    var g = new T.Group(), r = rng(1419), H = h || 40, puffs = [];
    var mat = new T.MeshStandardMaterial({ color: '#F4F1EA', roughness: 1, flatShading: false, emissive: new T.Color('#FFD9A0'), emissiveIntensity: 0 });
    for (var i = 0; i < 26; i++) {
      var y = (i / 25) * H, rad = 3.2 + 1.6 * Math.sin(i * 0.9) * 0.4 + r() * 1.2 + (i > 20 ? (i - 20) * 0.9 : 0);
      var s = new T.Mesh(new T.SphereGeometry(rad, 14, 10), mat);
      s.position.set((r() - 0.5) * 2.2, y + 2, (r() - 0.5) * 2.2); g.add(s); puffs.push({ m: s, y: s.position.y, ph: r() * 6 });
    }
    var glow = new T.PointLight('#FFC27A', 0, 120, 1.6); glow.position.set(0, H * 0.4, -6); g.add(glow);
    return {
      group: g,
      setNight: function (n) { mat.emissiveIntensity = 0.55 * n; mat.color.set(n > 0.5 ? '#E8E2D8' : '#F4F1EA'); glow.intensity = 1.6 * n; },
      update: function (t) { puffs.forEach(function (p) { p.m.position.y = p.y + Math.sin(t * 0.3 + p.ph) * 0.4; }); }
    };
  }

  function stoneHeap(seed, n) {
    var g = new T.Group(), r = rng(seed + 11), mat = M('#A89C88');
    for (var i = 0; i < (n || 12); i++) {
      var s = new T.Mesh(new T.DodecahedronGeometry(0.22 + r() * 0.12, 0), mat);
      var a = r() * 6.28, d = r() * 0.6; s.position.set(Math.cos(a) * d, 0.15 + (i > 7 ? 0.25 : 0), Math.sin(a) * d); s.rotation.set(r() * 3, r() * 3, 0); s.castShadow = true; g.add(s);
    }
    return g;
  }

  /* 멀리 보이는 군사(진영의 줄): 통옷, 머리, 투구, 창. 사람의 생김새는 그리지 않는다(멀리서 보는 크기) */
  function soldier(seed, tunic, helm, opt) {
    var r = rng(seed + 29), g = new T.Group(), body = new T.Group(), tmp = new T.Group();
    var robe = new T.Mesh(new T.CylinderGeometry(0.17, 0.27, 1.15, 7), M(tunic || '#8A5A3A')); robe.position.y = 0.6; tmp.add(robe);
    var torso = new T.Mesh(new T.CylinderGeometry(0.2, 0.17, 0.4, 7), M(tunic || '#8A5A3A')); torso.position.y = 1.32; tmp.add(torso);
    var head = new T.Mesh(new T.SphereGeometry(0.13, 8, 6), M('#B98A62')); head.position.y = 1.63; tmp.add(head);
    if (helm) { var hm = new T.Mesh(new T.SphereGeometry(0.15, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M(helm)); hm.position.y = 1.66; tmp.add(hm); }
    if (!opt || opt.spear !== false) { var sp = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 2.1, 4), M('#6B4A2A')); sp.position.set(0.27, 1.15, 0.05); tmp.add(sp); }   /* 창이 본문에 없는 장면은 { spear: false } */
    /* 통옷·머리·투구·창을 꼭짓점 색 mesh 하나로 굽는다(한 사람 = 그리기 한 번. 생김새는 같다) */
    var one = bake(tmp); one.castShadow = true; body.add(one); g.add(body);
    var ph = r() * 6;
    return { group: g, update: function (dt, speed, t) { body.position.y = speed > 0.1 ? Math.abs(Math.sin((t || 0) * 8 + ph)) * 0.06 : 0; } };
  }
  function shield(col) {
    var g = new T.Group(), m = new T.Mesh(new T.BoxGeometry(0.75, 1.2, 0.08), M(col || '#9A7A4A')); m.position.y = 1.0; m.castShadow = true; g.add(m);
    var b = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.05, 10), M('#B98A3E')); b.rotation.x = Math.PI / 2; b.position.set(0, 1.0, 0.06); g.add(b);
    return g;
  }

  /* ── 그리기 호출 줄이기 ──
   * 색만 다른 재질은 꼭짓점 색으로 옮겨 한 재질로 그린다(흰 재질 × 꼭짓점 색 = 원래 색. 화면은 같다).
   * 재질의 나머지 성질(평면 음영, 양면, 거칠기, 투명도, 빛남 등)이 같은 것끼리만 합친다. */
  var VCM = {};
  function sig(m) {
    return [m.type, m.flatShading ? 1 : 0, m.side, m.roughness, m.metalness, m.transparent ? 1 : 0, m.opacity, m.emissive ? m.emissive.getHex() : 0, m.emissiveIntensity, m.map ? m.map.uuid : '', m.depthWrite ? 1 : 0, m.fog ? 1 : 0, m.alphaTest].join('|');
  }
  function okToBake(m) { return m && (m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshBasicMaterial) && !Array.isArray(m) && !m.map && !m.skinning && !m.morphTargets; }
  function vcMat(m) {
    var k = sig(m), v = VCM[k];
    if (!v) { v = m.clone(); v.color.set('#FFFFFF'); v.vertexColors = true; v.needsUpdate = true; VCM[k] = v; }
    return v;
  }
  /* mesh들의 기하를 한 덩어리로 잇는다. items: [{ geo, mtx, mat }] (mtx는 덩어리 좌표로 옮기는 행렬) */
  function joinGeo(items) {
    var n = 0, k = 0, c = new T.Color(), nm = new T.Matrix3();
    var parts = items.map(function (it) { var g = it.geo.index ? it.geo.toNonIndexed() : it.geo; n += g.attributes.position.count; return g; });
    var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), v = new T.Vector3();
    items.forEach(function (it, ii) {
      var g = parts[ii], P = g.attributes.position, N = g.attributes.normal, C = it.mat.vertexColors ? g.attributes.color : null, j;
      c.copy(it.mat.color || c.set('#FFFFFF')); nm.getNormalMatrix(it.mtx);
      for (j = 0; j < P.count; j++, k++) {
        v.fromBufferAttribute(P, j).applyMatrix4(it.mtx); pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
        if (N) { v.fromBufferAttribute(N, j).applyMatrix3(nm).normalize(); nor[k * 3] = v.x; nor[k * 3 + 1] = v.y; nor[k * 3 + 2] = v.z; }
        col[k * 3] = c.r * (C ? C.getX(j) : 1); col[k * 3 + 1] = c.g * (C ? C.getY(j) : 1); col[k * 3 + 2] = c.b * (C ? C.getZ(j) : 1);
      }
      if (g !== it.geo) g.dispose();
    });
    var bg = new T.BufferGeometry();
    bg.setAttribute('position', new T.BufferAttribute(pos, 3)); bg.setAttribute('normal', new T.BufferAttribute(nor, 3)); bg.setAttribute('color', new T.BufferAttribute(col, 3));
    bg.computeBoundingSphere();
    return bg;
  }
  /* 한 물건(여러 재질의 도막)을 꼭짓점 색 mesh 하나로 굽는다. 도막의 재질 성질이 모두 같아야 한다(색만 다름). 좌표는 root 기준 */
  function bake(root) {
    var items = [], inv = new T.Matrix4(), first = null;
    root.updateMatrixWorld(true); inv.copy(root.matrixWorld).invert();
    root.traverse(function (m) { if (m.isMesh && m.visible && okToBake(m.material)) { if (!first) first = m.material; items.push({ geo: m.geometry, mtx: new T.Matrix4().multiplyMatrices(inv, m.matrixWorld), mat: m.material }); } });
    var mesh = new T.Mesh(joinGeo(items), vcMat(first));
    items.forEach(function (it) { it.geo.dispose(); });
    return mesh;
  }
  /* 움직이지 않는 물건 여럿을 한 덩어리(재질 성질별)로 합친다. 합친 뒤에는 따로 움직이거나 숨길 수 없다.
     opt.cell: 이 크기(m)의 칸마다 따로 합친다(화면 밖의 칸은 그리지 않게). opt.keepShadow: 그림자 드리움을 원래대로(없으면 모두 드리운다) */
  function mergeStatic(objs, opt) {
    opt = opt || {};
    var groups = {}, out = new T.Group(), wp = new T.Vector3();
    objs.forEach(function (o) {
      o.updateMatrixWorld(true);
      var cellKey = '';
      if (opt.cell) { wp.setFromMatrixPosition(o.matrixWorld); cellKey = Math.floor(wp.x / opt.cell) + ',' + Math.floor(wp.z / opt.cell) + '|'; }
      o.traverse(function (m) {
        if (!m.isMesh || !m.visible) return;
        for (var a = m.parent; a && a !== o.parent; a = a.parent) if (!a.visible) return;
        if (!okToBake(m.material)) { var keep = m.clone(); keep.matrix.copy(m.matrixWorld); keep.matrix.decompose(keep.position, keep.quaternion, keep.scale); out.add(keep); return; }
        var cast = opt.keepShadow ? !!m.castShadow : true, key = cellKey + sig(m.material) + (cast ? '|c' : '|n');
        var e = groups[key] || (groups[key] = { mat: m.material, cast: cast, recv: false, items: [] });
        if (m.receiveShadow || !opt.keepShadow) e.recv = true;
        e.items.push({ geo: m.geometry, mtx: m.matrixWorld.clone(), mat: m.material });
      });
    });
    Object.keys(groups).forEach(function (k) {
      var e = groups[k], mesh = new T.Mesh(joinGeo(e.items), vcMat(e.mat)); mesh.castShadow = e.cast; mesh.receiveShadow = e.recv; out.add(mesh);
    });
    return out;
  }
  /* 장면에 이미 놓인 물건들을 합친 덩어리로 바꿔 놓는다(원래 물건은 장면에서 뺀다) */
  function mergeInScene(scene, objs, opt) {
    var m = mergeStatic(objs, opt);
    objs.forEach(function (o) { if (o.parent) o.parent.remove(o); });
    scene.add(m);
    return m;
  }
  /* 장면에 바로 놓인(장면의 직접 자식인) 움직이지 않는 소품(userData.stillProp: 바위·덤불·나무·장막 등)을 칸마다 한 덩어리로 합친다.
     틀(game.js buildScene)이 장면을 만든 뒤 한 번 부른다. 숨겨 둔 것, 다른 묶음 안에 든 것(장면이 따로 보이고 숨기는 것)은 건드리지 않는다. */
  function mergeTagged(scene, opt) {
    var objs = scene.children.filter(function (o) { return o.userData && o.userData.stillProp && o.visible; });
    if (objs.length < 2) return null;
    return mergeInScene(scene, objs, { cell: (opt && opt.cell) || 48, keepShadow: true });
  }
  BO3D.props = { tent: tent, chariot: chariot, horse: horse, cloudPillar: cloudPillar, stoneHeap: stoneHeap, soldier: soldier, shield: shield, rng: rng, mergeStatic: mergeStatic, mergeInScene: mergeInScene, mergeTagged: mergeTagged, bake: bake };
})();
