/* 자동 작업 3d-a(시대 1~4의 새 3D 장면)가 함께 쓰는 소품(코드 모델). props_ot.js와 같은 방식: 인형풍, 평면 음영, 글자·무늬·신상 없음.
 * 본문이 모양을 말하지 않는 것은 단순한 꼴로만 둔다.
 *   BO3D.props3da.tabernacle()   멀리서 보는 회막: 뜰의 흰 휘장(출 27:9-18)과 그 안의 장막(출 26장). 안의 기구는 만들지 않는다
 *   BO3D.props3da.grapePole()    막대기에 꿴, 포도 한 송이가 달린 가지(민 13:23). 길이 방향이 Z
 *   BO3D.props3da.fruitCloth()   땅에 편 천 위의 석류와 무화과(민 13:23, 13:26)
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var T = THREE, MAT = {};
  function M(c, o) { var k = c + (o ? JSON.stringify(o) : ''); if (!MAT[k]) { MAT[k] = new T.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.95 }); if (o) for (var q in o) MAT[k][q] = o[q]; } return MAT[k]; }
  function box(w, h, d, c, x, y, z, o) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), M(c, o)); m.position.set(x, y, z); m.castShadow = true; return m; }

  /* 회막. 뜰은 길이 100규빗·너비 50규빗·휘장 높이 5규빗(출 27:18), 문은 동쪽(출 27:13-16). 1규빗을 0.45m로 잡았다.
     장막은 뜰의 서쪽에 두고 덮개(출 26:14)로 덮인 겉모습만. +X가 동쪽 */
  function tabernacle() {
    var g = new T.Group(), L = 45, W = 22.5, Hh = 2.25, linen = '#EFE9DC', post = '#8A6A44', i;
    g.add(box(L, Hh, 0.08, linen, 0, Hh / 2, -W / 2)); g.add(box(L, Hh, 0.08, linen, 0, Hh / 2, W / 2)); g.add(box(0.08, Hh, W, linen, -L / 2, Hh / 2, 0));
    g.add(box(0.08, Hh, 6.75, linen, L / 2, Hh / 2, -7.875)); g.add(box(0.08, Hh, 6.75, linen, L / 2, Hh / 2, 7.875));
    g.add(box(0.1, Hh, 9, '#5E5E9C', L / 2, Hh / 2, 0));                                         /* 뜰 문의 휘장(출 27:16) */
    for (i = 0; i <= 10; i++) { g.add(box(0.14, Hh + 0.25, 0.14, post, -L / 2 + i * 4.5, (Hh + 0.25) / 2, -W / 2)); g.add(box(0.14, Hh + 0.25, 0.14, post, -L / 2 + i * 4.5, (Hh + 0.25) / 2, W / 2)); }
    for (i = 1; i < 5; i++) { g.add(box(0.14, Hh + 0.25, 0.14, post, -L / 2, (Hh + 0.25) / 2, -W / 2 + i * 4.5)); g.add(box(0.14, Hh + 0.25, 0.14, post, L / 2, (Hh + 0.25) / 2, -W / 2 + i * 4.5)); }
    g.add(box(13.5, 4.5, 4.5, '#5A463A', -11, 2.25, 0)); g.add(box(14.1, 0.25, 5.1, '#4A3A30', -11, 4.6, 0));   /* 장막과 덮개 */
    return g;
  }

  function grapePole() {
    var g = new T.Group(), wood = M('#7A5232'), i;
    var st = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 2.5, 6), wood); st.rotation.x = Math.PI / 2; st.castShadow = true; g.add(st);
    var br = new T.Mesh(new T.CylinderGeometry(0.018, 0.022, 0.5, 5), M('#6A5A32')); br.rotation.x = Math.PI / 2 - 0.25; br.position.set(0, -0.05, 0); g.add(br);
    var leaf = M('#5E7A3A', { side: T.DoubleSide });
    [[-0.16, 0.5], [0.15, -0.6], [0.05, 1.2]].forEach(function (q) { var lf = new T.Mesh(new T.CircleGeometry(0.1, 5), leaf); lf.position.set(q[0] * 0.5, -0.07, q[0]); lf.rotation.set(-1.2, q[1], 0.3); g.add(lf); });
    /* 포도 한 송이: 아래로 갈수록 좁아지는 알들. 길이 약 0.5m(사람보다 작다) */
    var gm = M('#5A2E5E'), gm2 = M('#6E3A6E'), n = 0;
    for (var ring = 0; ring < 7; ring++) {
      var rad = 0.13 * (1 - ring / 7.5), cnt = Math.max(1, Math.round(7 * (1 - ring / 8)));
      for (i = 0; i < cnt; i++) { var a = i / cnt * 6.283 + ring * 0.7, b = new T.Mesh(new T.SphereGeometry(0.048, 6, 5), (n++ % 3) ? gm : gm2); b.position.set(Math.cos(a) * rad, -0.14 - ring * 0.062, Math.sin(a) * rad); b.castShadow = true; g.add(b); }
    }
    return g;
  }

  function fruitCloth() {
    var g = new T.Group(), i;
    var cl = new T.Mesh(new T.BoxGeometry(1.3, 0.03, 0.9), M('#D8C8A0')); cl.position.y = 0.015; cl.receiveShadow = true; g.add(cl);
    for (i = 0; i < 5; i++) { var p = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), M('#B03A2E')); p.position.set(-0.4 + i * 0.13, 0.1, -0.15 + (i % 2) * 0.14); p.castShadow = true; g.add(p); var cr = new T.Mesh(new T.ConeGeometry(0.03, 0.05, 5), M('#8A2E24')); cr.position.set(p.position.x, 0.19, p.position.z); g.add(cr); }   /* 석류 */
    for (i = 0; i < 6; i++) { var f = new T.Mesh(new T.SphereGeometry(0.05, 7, 5), M(i % 2 ? '#5A4A5E' : '#6A7A3E')); f.scale.y = 1.25; f.position.set(0.22 + (i % 3) * 0.12, 0.085, -0.12 + Math.floor(i / 3) * 0.16); f.castShadow = true; g.add(f); }   /* 무화과 */
    return g;
  }
  BO3D.props3da = { tabernacle: tabernacle, grapePole: grapePole, fruitCloth: fruitCloth, M: M, box: box };
})();
