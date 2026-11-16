/* 자동 작업 3d-c(시대 7~10의 새 3D 장면)가 함께 쓰는 것. 기존 틀과 소품(props_ot.js)은 바꾸지 않고 더하기만 한다.
 *   BO3D.c3d.on(id)        그 장면의 자료(content/ot/OT-NN.json)가 3D 장면(design3d.build true)일 때만 true.
 *                          3d-c의 장면 설정 파일은 이것이 true일 때만 BO3D.scene3d에 등록한다. false로 되돌리면 이야기 카드로만 간다.
 *   BO3D.c3d.noise(x, z)   부드러운 잡음(0~1). 땅의 높낮이와 색에 쓴다
 *   BO3D.c3d.sm(a, b, x)   a에서 b 사이를 0~1로 부드럽게
 * 본문이 모양을 말하지 않는 것은 단순한 꼴로만 둔다. 글자·무늬·신상은 넣지 않는다.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var C = BO3D.c3d = BO3D.c3d || {};
  C.on = function (id) { var d = BO3D.ot && BO3D.ot.scenes && BO3D.ot.scenes[id]; return !!(d && d.has3d && d.quests && d.quests.length === 3); };
  C.sm = function (a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
  C.hash = hash;
  C.noise = function (x, z) {
    var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
})();
/* 더하기(2026-11-16): 꼭짓점 색을 지키며 같은 재질의 물체를 한 덩어리로 합친다(그리기 호출을 줄인다).
 *   BO3D.props.mergeStatic은 꼭짓점 색을 버려서, 꼭짓점 색으로 칠한 모형(종려·바위·떨기)이 검게 보인다. 3d-c 장면은 이것을 쓴다. */
(function () {
  'use strict';
  var C = BO3D.c3d;
  C.merge = function (objs) {
    var T = THREE, byMat = [], out = new T.Group();
    objs.forEach(function (o) {
      o.updateMatrixWorld(true);
      o.traverse(function (m) {
        if (!m.isMesh || !m.visible) return;
        var g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
        var e = byMat.filter(function (x) { return x.mat === m.material; })[0]; if (!e) { e = { mat: m.material, gs: [] }; byMat.push(e); } e.gs.push(g);
      });
    });
    byMat.forEach(function (e) {
      var n = 0, k = 0, hasCol = e.gs.some(function (g) { return !!g.attributes.color; });
      e.gs.forEach(function (g) { n += g.attributes.position.count; });
      var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = hasCol ? new Float32Array(n * 3) : null;
      e.gs.forEach(function (g) {
        var cnt = g.attributes.position.count, ca = g.attributes.color, w;
        pos.set(g.attributes.position.array, k * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, k * 3);
        if (col) for (w = 0; w < cnt; w++) { col[(k + w) * 3] = ca ? ca.getX(w) : 1; col[(k + w) * 3 + 1] = ca ? ca.getY(w) : 1; col[(k + w) * 3 + 2] = ca ? ca.getZ(w) : 1; }
        k += cnt; g.dispose();
      });
      var bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(pos, 3)); bg.setAttribute('normal', new T.BufferAttribute(nor, 3)); if (col) bg.setAttribute('color', new T.BufferAttribute(col, 3)); bg.computeBoundingSphere();
      var mesh = new T.Mesh(bg, e.mat); mesh.castShadow = true; mesh.receiveShadow = true; out.add(mesh);
    });
    return out;
  };
})();
