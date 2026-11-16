/* 3D 장면 설정: OT-08 요셉이 애굽으로 팔려 가고 형들을 다시 만남 (창 37:12-36, 45:1-15). 도단의 들. (자동 작업 3d-a. 장면표의 3D 12장면 밖의 추가 제안)
 * 배치: 가운데에 형들과 양 떼, 그 곁에 구덩이. 구덩이 너머 멀리에 길르앗에서 와서 애굽으로 내려가는 사람들이 지나는 길(화면에서 길르앗 쪽이 +X 끝, 애굽 쪽이 -X 끝).
 *   요셉은 양 떼 너머 먼 곳(+Z, -X)에서 걸어온다. 아이들은 형들·구덩이·길에서 떨어진 들의 가장자리(+X)에서만 다닌다. 실제 거리를 줄여서 만들었다.
 *   화면의 글에는 본문에 없는 방향 말을 쓰지 않는다(길르앗에서 오는, 애굽으로 내려가는).
 * 본문에 맞춘 점 (content/ot/OT-08.json design3d)
 *  - 장소는 도단의 들 한 곳(37:17). 헤브론 골짜기·세겜(37:12-17), 아버지가 있는 곳(37:32-35), 애굽(37:36, 45장)은 만들지 않고 글로만 전한다.
 *  - 형들이 양 떼를 친다(37:12, 37:17). 요셉이 채색옷을 입고(37:3, 37:23) 멀리서 걸어오고, 형들이 그쪽을 본다(37:18). 형들이 한 말(37:19-22)은 소리로 만들지 않는다.
 *  - 37:23-24: 요셉은 보이지 않는다. 형들이 구덩이 곁에 서 있고 채색옷만 형들 곁 땅에 놓여 있다. 붙잡는·벗기는·던지는 동작은 만들지 않는다(결과만, 멀리서).
 *    구덩이는 땅에 뚫린 어두운 구멍으로만. 안은 보이지 않는다(37:24: 비었고 물이 없다).
 *  - 37:25-28: 길르앗에서 와서 애굽으로 내려가는 무리와 짐 실은 낙타(37:25). 요셉은 이미 그 무리 가운데에서(묶이지 않고, 채색옷 없이) 함께 길을 간다. 멀리서만.
 *    끌어올리는 동작과 은을 주고받는 손은 만들지 않는다. 형들은 구덩이 곁에서 그쪽을 본다(37:25).
 *  - 37:29: 르우벤이 구덩이로 돌아와 그 곁에 선다. 옷을 찢는 동작(37:29, 37:34), 숫염소와 피 묻은 옷(37:31), 야곱의 애통(37:34-35)은 만들지 않는다(글로만).
 *  - 45:1-15: 사람이 없는 들과 애굽으로 내려가는 길 쪽을 해가 기운 빛으로 비추고 글로만 전한다. 애굽의 모습과 다시 만나는 모습은 만들지 않는다.
 * 감수가 필요한 설정: 들·구덩이·길의 자리와 생김새(줄인 거리), 요셉이 걸어오는 쪽, 도단에 있던 형들의 수(열 사람으로 둠. 본문은 수를 말하지 않는다), 형들과 상인들의 생김새와 수,
 *   낙타의 수(다섯)와 짐의 생김새, 채색옷의 색(겉옷 파랑·속옷 노랑·띠 빨강. 무늬 없음)과 요셉의 생김새, 37:23 뒤의 요셉을 물들이지 않은 옷으로 둔 것,
 *   37:25-28 동안 르우벤을 보이지 않게 한 것(37:29 "돌아와서"), 형들이 앉아 먹는 모습(37:25)을 그리지 않고 서 있게 한 것, 45장 대목의 기운 해 빛(본문에 때가 없다),
 *   지켜보기가 끝난 뒤 들을 37장의 낮 모습(양 떼와 형들)으로 되돌려 둔 것.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-08'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, PA = BO3D.props3da || {}, FX = api.FX, R = PR.rng(837);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    function line(pts) {   /* 꺾은선 길: at(s) → [x, z, 향], dist(x, z), len */
      var L = [0], k;
      for (k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      return {
        len: L[L.length - 1],
        at: function (s) { s = Math.max(0, Math.min(L[L.length - 1], s)); for (var j = 1; j < pts.length; j++) if (s <= L[j]) { var t = (s - L[j - 1]) / (L[j] - L[j - 1]); return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t, Math.atan2(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1])]; } return [pts[0][0], pts[0][1], 0]; },
        dist: function (x, z) { var best = 1e9; for (var j = 0; j + 1 < pts.length; j++) { var a0 = pts[j], b0 = pts[j + 1], vx = b0[0] - a0[0], vz = b0[1] - a0[1], t = Math.max(0, Math.min(1, ((x - a0[0]) * vx + (z - a0[1]) * vz) / (vx * vx + vz * vz))); best = Math.min(best, Math.hypot(x - a0[0] - vx * t, z - a0[1] - vz * t)); } return best; }
      };
    }
    var PIT = [-3, -5], FLOCK = [8, 26], COAT = [-4.2, -1.6];
    var ROAD = line([[200, -78], [70, -46], [0, -34], [-70, -30], [-200, -4]]);       /* 길르앗 쪽(+X) → 애굽 쪽(-X) (37:25) */
    var JP = line([[-95, 150], [-55, 80], [-24, 34]]), J_MID = Math.hypot(40, 70);    /* 요셉이 걸어오는 길(37:17-18). 끝은 형들에게서 아직 떨어진 곳(37:18 "가까이 오기 전") */
    var CAR0 = 227, CAR_END = 400;
    function height(x, z) {
      var h = 0.6 * noise(x * 0.04 + 2, z * 0.04 + 5) + 0.3 * Math.sin(x * 0.03) * Math.cos(z * 0.028);
      h *= sm(2.5, 9, Math.hypot(x - PIT[0], z - PIT[1])) * 0.6 + 0.4;
      h += sm(170, 290, Math.hypot(x, z)) * (5 + 16 * noise(x * 0.016 + 3, z * 0.016));
      return h;
    }
    function walkable(x, z) { return x >= 24 && x <= 60 && z >= -6 && z <= 44; }

    var scene = new T.Scene();
    scene.background = new T.Color('#E9E2C6'); scene.fog = new T.Fog('#E6DFC2', 90, 380);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#6FA6CC'), hor = new T.Color('#F2E9CC'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(640, 640, 170, 170); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), f1 = new T.Color('#B4B678'), f2 = new T.Color('#A2A866'), dry = new T.Color('#D4BE8C'), rd = new T.Color('#E2CFA2'), hl = new T.Color('#A79A78');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(f1).lerp(f2, noise(x * 0.07, z * 0.07));                                   /* 양 떼를 치는 들(37:12) */
      c.lerp(dry, sm(14, 46, x) * 0.85 + 0.35 * sm(0.5, 0.85, noise(x * 0.03 + 9, z * 0.03)));   /* 마른 땅(광야 쪽, 37:22) */
      c.lerp(dry, sm(8, 3, Math.hypot(x - PIT[0], z - PIT[1])) * 0.9);
      c.lerp(rd, sm(4.5, 1.5, ROAD.dist(x, z)) * 0.75);                                /* 사람들이 지나는 길(37:25) */
      if (y > 6) c.lerp(hl, sm(6, 20, y));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#B59A66', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function near(x, z, p, r) { return Math.hypot(x - p[0], z - p[1]) < r; }
    var PARTS = [[27, 30], [56, 40], [28, 0]], START = [40, 20], MACHINE = [50, 12];
    function clear(x, z) {   /* 사람·양 떼·구덩이·길·재료 자리는 비워 둔다 */
      if (near(x, z, PIT, 16) || near(x, z, FLOCK, 15) || near(x, z, [4, 12], 14) || ROAD.dist(x, z) < 7 || JP.dist(x, z) < 6) return false;
      if (near(x, z, START, 5) || near(x, z, MACHINE, 6)) return false;
      for (var k = 0; k < 3; k++) if (near(x, z, PARTS[k], 4)) return false;
      return true;
    }
    if (MO.rock) for (i = 0; i < 40; i++) { var ro = MO.rock(800 + i); ro.scale.multiplyScalar(0.5 + R() * 1.3); var rx = -150 + R() * 300, rz = -150 + R() * 300; if (!clear(rx, rz)) continue; put(ro, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 34; i++) { var sh = MO.shrub(80 + i), hx = -150 + R() * 300, hz = -150 + R() * 300; if (!clear(hx, hz)) continue; put(sh, hx, hz, -0.05); }

    /* 물 없는 빈 구덩이(37:24): 땅에 뚫린 어두운 구멍. 안은 보이지 않는다 */
    var pit = PA.pit ? PA.pit(1.3) : new T.Group(); put(pit, PIT[0], PIT[1]);
    /* 땅에 놓인 채색옷(37:23) */
    var coat = PA.coatOnGround ? PA.coatOnGround() : new T.Group(); put(coat, COAT[0], COAT[1]); coat.rotation.y = 0.7; coat.visible = false;
    /* 양 떼(37:12, 37:17) */
    var flock = null;
    try { if (BO3D.flock) flock = BO3D.flock.create(scene, { P: { flock: FLOCK, flockGraze: FLOCK }, height: height }, { count: 30 }); } catch (e) { flock = null; }
    function showFlock(v) { if (flock) flock.meshes.forEach(function (m) { if (m) m.visible = v; }); }

    function man(seed) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, { kind: 'man', carry: 'none' }); } catch (e2) { o = null; } if (!o) o = PR.soldier(seed, '#7A6A4A', null); o.group.rotation.order = 'YXZ'; return o; }
    /* 요셉의 형들(37:12). 0번이 르우벤(37:21, 37:29). 생김새로 구별하지 않는다 */
    var TEND = [[0, 14], [3.5, 12.5], [7, 13.5], [11, 15], [12.5, 17], [-2.5, 18], [-3, 23], [-5, 27], [5, 16.2], [10.5, 11.5]];
    var ATPIT = [[-6.2, -6.5], [-6.6, -4.2], [-6, -2], [-4.6, -8.4], [-2.6, -8.9], [-7.8, -8.2], [-8.4, -5.6], [-8, -2.6], [-0.6, -8.6], [-5.6, 0]];
    var bros = [];
    for (i = 0; i < 10; i++) { var bo = man(i * 23 + 11); put(bo.group, TEND[i][0], TEND[i][1]); bros.push({ o: bo, to: TEND[i].slice(), face: FLOCK }); }
    /* 요셉(Blender). 열일곱 살(37:2)이라 키를 조금 줄인다. 채색옷을 벗긴 뒤(37:23)에는 물들이지 않은 옷 색으로 바꾼다 */
    var jos = { group: api.fallback('#4F7FB5', 1.6, 0.25), update: function () {} }, coatOn = true, dyed = [];
    put(jos.group, JP.at(0)[0], JP.at(0)[1]); jos.group.visible = false;
    function setCoat(on) {
      coatOn = on;
      dyed.forEach(function (q) { q.attr.array.set(on ? q.orig : q.plain); q.attr.needsUpdate = true; });
    }
    api.person('joseph', function (nm) {
      nm.group.scale.setScalar(0.94); nm.group.position.copy(jos.group.position); nm.group.rotation.copy(jos.group.rotation); nm.group.visible = jos.group.visible;
      scene.remove(jos.group); scene.add(nm.group); jos = nm;
      nm.group.traverse(function (m) {
        var a = m.isMesh && m.geometry && m.geometry.attributes.color; if (!a) return;
        var ud = m.geometry.userData;
        if (!ud.josOrig) {
          var orig = a.array.slice(), plain = a.array.slice(), n = a.itemSize, U = a.normalized ? (a.array instanceof Uint16Array ? 65535 : 255) : 1, k, r, gg, b, t, f;
          for (k = 0; k < a.count; k++) {
            r = orig[k * n] / U; gg = orig[k * n + 1] / U; b = orig[k * n + 2] / U; t = null;
            if (b > r * 1.3) { t = [0.80, 0.75, 0.60]; f = b / 0.71; }                                  /* 겉옷(파랑) → 물들이지 않은 천 */
            else if (r > 0.05 && gg / r > 0.78 && b / r < 0.55) { t = [0.90, 0.85, 0.72]; f = r / 0.91; }   /* 속옷(노랑) */
            else if (r > 0.05 && gg / r < 0.45) { t = [0.48, 0.35, 0.23]; f = r / 0.72; }                   /* 띠(빨강) */
            if (t) { f = Math.max(0.5, Math.min(1.2, f)) * U; plain[k * n] = t[0] * f; plain[k * n + 1] = t[1] * f; plain[k * n + 2] = t[2] * f; }
          }
          ud.josOrig = orig; ud.josPlain = plain;
        }
        dyed.push({ attr: a, orig: ud.josOrig, plain: ud.josPlain });
      });
      setCoat(coatOn);
    });
    /* 이스마엘 사람들(미디안 상인들)의 무리와 짐 실은 낙타(37:25, 37:28). ds = 맨 앞에서 뒤로 떨어진 거리, lat = 길 가운데에서 옆으로 */
    var CV = [['man', 0, 0.9], ['camel', 2.6, 0], ['camel', 6.6, 0], ['man', 9.6, 1.0], ['jos', 11.2, -0.9], ['man', 12.8, 1.0], ['camel', 16, 0], ['camel', 20, 0], ['man', 22.6, -1.0], ['camel', 25.6, 0], ['man', 28.2, 0.9]];
    var caravan = [], carS = CAR0, carOn = false;
    CV.forEach(function (q, k) {
      var o = q[0] === 'jos' ? null : q[0] === 'camel' ? (PA.camel ? PA.camel(k) : { group: api.fallback('#B08A5E', 2, 0.5), update: function () {} }) : man(k * 31 + 401);
      if (o) { scene.add(o.group); o.group.visible = false; }
      caravan.push({ kind: q[0], ds: q[1], lat: q[2], o: o });
    });
    function placeCaravan(dt, moving) {
      caravan.forEach(function (m) {
        var s = carS - m.ds, q = ROAD.at(s), o = m.kind === 'jos' ? jos : m.o, vis = carOn && s < CAR_END;
        if (m.kind === 'jos' && !carOn) return;
        o.group.visible = vis; if (!vis) return;
        var px = q[0] + Math.cos(q[2]) * m.lat, pz = q[1] - Math.sin(q[2]) * m.lat;
        o.group.position.set(px, height(px, pz), pz); o.group.rotation.y = q[2];
        if (m.kind === 'jos') { if (o.update) o.update(dt, moving); } else if (o.update) o.update(dt, moving ? 1 : 0);
      });
    }

    var phase = 'idle', josS = 0, josMax = 0, tod = 0, todWant = 0, ca = new T.Color(), cb = new T.Color();
    var TOD = [['#E9E2C6', '#FFFFFF', 0.64, 0.74, '#FFF0CF'], ['#E8C49A', '#EEC6A0', 0.54, 0.56, '#FFC088']];   /* 0 낮, 1 기운 해 */
    function applyTod() {
      var t = Math.min(1, Math.max(0, tod)), A = TOD[0], B = TOD[1];
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyM.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t; ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t));
    }
    function josAt(s) { var q = JP.at(s); jos.group.position.set(q[0], height(q[0], q[1]), q[1]); jos.group.rotation.y = q[2]; }
    function broAt(b, p) { b.o.group.position.set(p[0], height(p[0], p[1]), p[1]); b.to = p.slice(); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      var was = phase; phase = p;
      coat.visible = false; carOn = false; carS = CAR0; todWant = 0; showFlock(true);
      bros.forEach(function (b, k) { b.o.group.visible = true; broAt(b, TEND[k]); b.face = FLOCK; });
      jos.group.visible = false; setCoat(true);
      if (p === 'idle' || p === 'after') { josS = 0; josMax = 0; tod = 0; applyTod(); }
      if (p === 'come' || p === 'near') {                                                 /* 37:17-18: 멀리서 걸어온다. 형들이 그쪽을 본다 */
        if (was !== 'come' && was !== 'near') josS = p === 'near' ? J_MID : 0;
        josMax = p === 'come' ? J_MID : JP.len; jos.group.visible = true; josAt(josS);
        bros.forEach(function (b) { b.face = 'jos'; });
      }
      if (p === 'pit' || p === 'sold') {                                                  /* 37:23-24: 요셉은 보이지 않고, 채색옷만 땅에 놓여 있다 */
        coat.visible = true; bros.forEach(function (b, k) { broAt(b, ATPIT[k]); b.face = PIT; });
      }
      if (p === 'sold') {                                                                 /* 37:25-28: 요셉은 이미 상인들의 무리 가운데에서 길을 간다 */
        carOn = true; setCoat(false); bros[0].o.group.visible = false; bros.forEach(function (b) { b.face = 'car'; });
      }
      if (p === 'reuben') { broAt(bros[0], [-15, -13]); bros[0].to = [-5.1, -6.3]; bros[0].face = PIT; }   /* 37:29: 르우벤이 구덩이로 돌아온다 */
      if (p === 'egypt') { todWant = 1; showFlock(false); bros.forEach(function (b) { b.o.group.visible = false; }); }   /* 45장: 이 들에는 그리지 않는다 */
      placeCaravan(0, false);
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    /* 지켜보기 카메라: 틀이 화면을 위로 20% 올려 주므로 볼 것(t)을 거의 그대로 겨눈다 */
    function cam(p, up, t) {
      var py = height(p[0], p[1]) + up, d = Math.hypot(t[0] - p[0], t[2] - p[1]), el = Math.atan2(t[1] + height(t[0], t[2]) - py, d) - 0.04;
      return { pos: [p[0], py, p[1]], look: [t[0], py + d * Math.tan(el), t[2]] };
    }
    if (FX) FX.sortLayers(scene);
    var PH = ['come', 'near', 'pit', 'sold', 'reuben', 'egypt', 'egypt', 'egypt'];

    return {
      id: 'OT-08', scene: scene, sun: sun, sunOff: [-32, 50, 28],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x < 24) return { who: 'onwoo', text: '사람들과 구덩이 쪽으로는 가지 말자. 우리는 떨어져서 지켜보는 사람이야.' };
        if (z < -6) return { who: 'hyu', text: '저쪽으로는 사람들이 지나는 길이 나 있어. 길은 비워 두고 여기까지만 가자.' };
        return { who: 'hyu', text: '들에서 너무 멀리 가지는 말자.' };
      },
      P: { start: START, machine: MACHINE, machineRot: -1.9,
        /* 재료가 놓인 곳(quests[i].found): 양 떼가 있는 들 쪽 / 사람들에게서 떨어진 광야 쪽 / 들의 가장자리 빈 땅 */
        parts: PARTS, lookSpot: PARTS[2],
        look: { focus: [0, 4], mid: [12, 2], dy: 1.2, backE: 7, upE: 3 } },
      eventCam: function (i) {
        if (i === 2) return cam([20, 4], 3.4, [-3.4, 0.9, -4.4]);                                   /* 37:23-24: 구덩이와 그 곁의 형들, 땅에 놓인 채색옷. 멀리서 */
        if (i === 3) { var jp = jos.group.position, far = carS - 11.2 >= CAR_END; return cam([7, 5], 4.2, far ? [-150, 1.4, -14] : [jp.x, 1.4, jp.z]); }   /* 37:25-28: 형들 너머로 멀어져 가는 무리 */
        if (i === 4) return cam([14, 3], 3.2, [-3.6, 1, -5.6]);                                     /* 37:29: 구덩이 곁의 르우벤 */
        if (i === 5) return cam([12, -12], 7, [-120, 3, -20]);                                      /* 45장: 애굽으로 내려가는 길 쪽의 빈 들 */
        if (i === 6) return cam([10, -10], 8, [-120, 3, -14]);
        if (i === 7) return cam([8, -8], 9, [-120, 3, -8]);
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 들의 가장자리에 내려앉았어요. 들에는 양 떼가 있고, 양을 치는 사람들이 보여요.', say: { who: 'hyu', text: '양 떼와 사람들에게서 떨어져서, 들의 가장자리에서만 다니자.' } },
      lookText: '요셉 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      beatNote: function (i) {
        if (i === 0) return '헤브론 골짜기와 세겜에서 있었던 일은 이 들에서는 보이지 않아요. 우리는 도단의 들로 걸어오는 요셉을 봐요.';
        if (i === 1) return '형들이 서로 한 말은 여기까지 들리지 않아요. 성경책에서 읽어요.';
        if (i === 2) return '우리는 멀리서 보고 있어요. 그 일이 있은 뒤의 모습만 보여요. 구덩이 안은 보이지 않아요.';
        if (i === 3) return '우리는 멀리서 보고 있어요. 요셉이 팔린 뒤, 상인들의 무리가 애굽으로 내려가는 길을 가는 모습이에요.';
        if (i === 4) return '아버지가 있는 곳과 애굽에서 있었던 일은 이 들에서는 보이지 않아요. 글로 읽어요.';
        return '여러 해 뒤 애굽에서 있었던 일이에요. 이 들에서는 보이지 않아요. 글로 읽어요.';
      },
      helpNote: function (after) { return after === 5 ? '이 돕기는 여러 해 뒤 애굽에서 있었던 일을 글로 따라가는 탐험대 이야기예요. 이 들에는 그 자리를 만들지 않았어요.' : null; },
      sceneDoneText: '요셉 이야기를 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'flock', name: '양 떼', desc: '요셉의 형들이 치던 아버지의 양 떼', ref: '창 37:12', hint: '들에서 풀을 뜯는 양들을 담아 보세요.', range: 70, crop: 0.5,
          visible: function () { return phase !== 'egypt'; }, pos: function () { if (flock) { var fc = flock.center(); return v3(fc.x, fc.y + 0.6, fc.z); } return v3(FLOCK[0], height(FLOCK[0], FLOCK[1]) + 0.6, FLOCK[1]); } },
        { id: 'brothers', name: '요셉의 형들', desc: '요셉은 형들의 뒤를 따라가 도단에서 그들을 만났다', ref: '창 37:17', hint: '양 떼 곁에 있는 사람들이에요.', range: 70, crop: 0.5,
          visible: function () { return bros[1].o.group.visible; }, pos: function () { var bp = bros[1].o.group.position; return v3(bp.x, bp.y + 1.1, bp.z); } },
        { id: 'joseph', name: '채색옷을 입은 요셉', desc: '아버지 이스라엘이 여러 아들보다 깊이 사랑하여 채색옷을 지어 준 아들', ref: '창 37:3', hint: '재료를 하나 찾은 뒤, 양 떼 너머 멀리서 걸어오는 사람을 찾아보세요.', range: 220, crop: 0.25,
          visible: function () { return jos.group.visible && coatOn; }, pos: function () { return v3(jos.group.position.x, jos.group.position.y + 1.1, jos.group.position.z); } },
        { id: 'pit', name: '빈 구덩이', desc: '그 구덩이는 비어 있었고 그 속에 물이 없었다', ref: '창 37:24', hint: '사람들 너머 땅에 뚫린 어두운 구멍이에요. 가까이 가지 말고 멀리서 담아요.', range: 80, crop: 0.3, pos: function () { return v3(PIT[0], height(PIT[0], PIT[1]) + 0.3, PIT[1]); } },
        { id: 'road', name: '애굽으로 내려가는 길', desc: '길르앗에서 오는 이스마엘 사람들이 낙타에 짐을 싣고 애굽으로 내려가던 길', ref: '창 37:25', hint: '구덩이 너머 멀리, 들을 가로지르는 밝은 띠를 담아 보세요.', range: 200, crop: 0.6, pos: function () { return v3(-30, height(-30, -32) + 0.5, -32); } }
      ],
      reset: function () { setPhase('idle'); },
      partFound: function (i) { if (i === 0) setPhase('come'); if (i === 1) setPhase('near'); },
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-08.json): 0 = 37:12-17, 1 = 37:18-22, 2 = 37:23-24, 3 = 37:25-28, 4 = 37:29-36, 5 = 45:1-4, 6 = 45:5-8, 7 = 45:9-15 */
      beatPose: function (i) { setPhase(PH[i] || 'idle'); },
      update: function (dt, now, ctx) {
        if (phase === 'egypt' && ctx && ctx.state === 'free') setPhase('after');   /* 지켜보기와 관문이 끝나면 들은 37장의 낮 모습으로 돌아온다 */
        if (Math.abs(tod - todWant) > 0.003) { tod += (todWant - tod) * Math.min(1, dt * 1.3); applyTod(); }
        var jmv = false;
        if ((phase === 'come' || phase === 'near') && josS < josMax) { josS = Math.min(josMax, josS + 1.3 * dt); josAt(josS); jmv = true; }
        if (phase === 'sold') { if (carS - 28.2 < CAR_END) carS += 1.0 * dt; placeCaravan(dt, true); }
        else if (jos.update) jos.update(dt, jmv);
        var jp = jos.group.position;
        bros.forEach(function (b) {
          var o = b.o, p = o.group.position; if (!o.group.visible) return;
          var dx = b.to[0] - p.x, dz = b.to[1] - p.z, d = Math.hypot(dx, dz), mv = d > 0.2;
          if (mv) { var st = Math.min(d, 1.5 * dt); p.x += dx / d * st; p.z += dz / d * st; p.y = height(p.x, p.z); o.group.rotation.y = Math.atan2(dx, dz); }
          else { var f = b.face === 'jos' || b.face === 'car' ? [jp.x, jp.z] : b.face; o.group.rotation.y = Math.atan2(f[0] - p.x, f[1] - p.z); }
          if (o.update) o.update(dt, mv ? 1 : 0, now);
        });
        if (flock && phase !== 'egypt') { flock.setAvoid(ctx && ctx.player ? ctx.player : null); flock.update(dt, now, jp, false, 0); }
      },
      audio: function (A, pp) { if (flock && phase !== 'egypt' && pp) { var fc = flock.center(); A.setFlock(Math.hypot(pp.x - fc.x, pp.z - fc.z)); } else A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(34 + Math.sin(a2) * 6, 7, 34); camera.lookAt(4, 1, 14); },
      debug: { phase: function () { return { phase: phase, tod: tod, josS: josS, jos: jos.group.visible, coatOn: coatOn, coat: coat.visible, carS: carS, car: carOn }; }, arrived: function () { return phase !== 'idle'; } }
    };
  };
})();
