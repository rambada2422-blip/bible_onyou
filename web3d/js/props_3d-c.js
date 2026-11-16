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
