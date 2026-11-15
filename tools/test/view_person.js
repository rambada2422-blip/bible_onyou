// 인물 GLB를 네 방향(앞·오른쪽·뒤·왼쪽)과 동작별로 찍는다. 사용: node tools/test/view_person.js <이름(web3d/assets/이름.glb)> <저장 png> [동작 이름]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const name = process.argv[2], out = process.argv[3], clip = process.argv[4] || 'Idle';
const root = path.join(__dirname, '..', '..');
const glb = fs.readFileSync(path.join(root, 'web3d/assets', name + '.glb')).toString('base64');
const html = `<html><body style="margin:0;background:#E9DFC9"><canvas id=c width=1200 height=600></canvas>
<script>${fs.readFileSync(path.join(root, 'web3d/vendor/three.min.js'), 'utf8')}</script>
<script>${fs.readFileSync(path.join(root, 'web3d/vendor/GLTFLoader.js'), 'utf8')}</script>
<script>
const T = THREE, r = new T.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
r.setScissorTest(true);
const sc = new T.Scene(); sc.background = new T.Color('#E9DFC9');
sc.add(new T.HemisphereLight('#D9EEF2', '#B98A55', 0.7)); const d = new T.DirectionalLight('#FFE9C4', 0.75); d.position.set(-3, 5, 4); sc.add(d);
const bin = atob('${glb}'), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
new T.GLTFLoader().parse(buf.buffer, '', (g) => {
  sc.add(g.scene); const mx = new T.AnimationMixer(g.scene); const c = g.animations.find((a) => a.name === '${clip}') || g.animations[0];
  if (c) { mx.clipAction(c).play(); mx.update(c.duration * 0.4); }
  const box = new T.Box3().setFromObject(g.scene), h = box.max.y - box.min.y;
  const cam = new T.PerspectiveCamera(30, 300 / 600, 0.1, 50);
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((a, i) => {
    cam.position.set(Math.sin(a) * h * 2.3, h * 0.55, Math.cos(a) * h * 2.3); cam.lookAt(0, h * 0.5, 0);
    r.setViewport(i * 300, 0, 300, 600); r.setScissor(i * 300, 0, 300, 600); r.render(sc, cam);
  });
  document.title = 'done ' + h.toFixed(3);
});
</script></body></html>`;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1200, height: 600 } })).newPage();
  const f = path.join(require('os').tmpdir(), 'view_' + name + '.html'); fs.writeFileSync(f, html);
  await p.goto('file://' + f); await p.waitForFunction(() => document.title.startsWith('done'), null, { timeout: 60000 });
  console.log(name, await p.title());
  await p.screenshot({ path: out }); await b.close();
})();
