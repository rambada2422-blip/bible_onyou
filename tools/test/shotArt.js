// 장면 그림(sceneart.js) 점검: 장면의 대목마다 그림을 휴대폰 화면의 풍경 칸 크기(390×338, 아래 43px은 글 시트에 가린다)로 찍어 한 장에 모은다.
// 사용: node tools/test/shotArt.js <저장 폴더> <OT-NN ...|all> [--parts <조각 js 폴더>] [--big]
//  - 그림마다 금지 요소(<text>, <image>, <script>, 외부 주소)가 없는지, 그리다 오류가 나지 않는지, 글자 수(크기)를 본다.
//  - --parts: 아직 sceneart.js에 합치지 않은 조각 파일(*.js)을 함께 읽는다. --big: 한 장씩 크게(780×676)도 찍는다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const args = process.argv.slice(2), out = args[0] || '/tmp/shotArt';
let ids = [], parts = null, big = false;
for (let i = 1; i < args.length; i++) { if (args[i] === '--parts') parts = args[++i]; else if (args[i] === '--big') big = true; else ids.push(args[i]); }
fs.mkdirSync(out, { recursive: true });
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1260, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  let js = read('web3d/js/otdata.js') + '\n' + read('web3d/js/eraart.js') + '\n' + read('web3d/js/sceneart.js');
  await p.setContent('<style>body{margin:0;background:#222;font:12px sans-serif;color:#fff}' + read('web3d/css/story.css').split('/* 시간 이동 */')[1] + '.g{display:flex;flex-wrap:wrap;gap:6px;padding:6px}.c{position:relative;width:390px;height:338px;overflow:hidden}.c svg{width:100%;height:100%;display:block}.c i{position:absolute;left:0;right:0;bottom:0;height:43px;background:rgba(251,247,238,.55)}.c b{position:absolute;left:4px;top:4px;background:#000a;padding:2px 6px;border-radius:6px;font-weight:400}</style><div class="g" id="g"></div><script>' + js.replace(/<\/script/gi, '<\\/script') + '</script>');
  /* 조각은 파일마다 따로 읽는다(한 조각의 문법 오류가 다른 조각을 막지 않게) */
  if (parts) for (const f of fs.readdirSync(parts).filter((x) => x.endsWith('.js')).sort()) { try { await p.addScriptTag({ content: fs.readFileSync(path.join(parts, f), 'utf8') }); } catch (e) { errs.push(f + ': ' + e.message); } }
  const all = await p.evaluate(() => BO3D.sceneArt.ids());
  if (!ids.length || ids[0] === 'all') ids = all;
  let total = 0, bad = 0;
  for (const id of ids) {
    const r = await p.evaluate((id) => {
      const d = BO3D.ot.scenes[id], g = document.getElementById('g'), res = { n: d.beats.length, items: [], has: BO3D.sceneArt.has(id) };
      g.innerHTML = '';
      const ats = [-1].concat(d.beats.map((x, i) => i)).concat(['end']);
      ats.forEach((at) => {
        let svg = '', err = '';
        try { svg = BO3D.eraArt.art('wilderness', { scene: id, at: at }); if (!BO3D.sceneArt.draw(id, at)) err = '그림 없음(시대 풍경으로 떨어짐)'; } catch (e) { err = String(e); }
        const c = document.createElement('div'); c.className = 'c'; c.innerHTML = svg + '<i></i><b>' + id + ' ' + (at === -1 ? '도착' : at === 'end' ? '끝' : (at + 1) + ' · ' + d.beats[at].ref) + '</b>'; g.appendChild(c);
        const ban = /<text|<image|<script|<foreignObject|href=|url\(\s*["']?http|feTurbulence|NaN|undefined/.exec(svg);
        res.items.push({ at: at, len: svg.length, err: err, ban: ban ? ban[0] : '' });
      });
      return res;
    }, id);
    await p.screenshot({ path: path.join(out, id + '.png'), fullPage: true });
    if (big) { await p.addStyleTag({ content: '.c{width:780px;height:676px}.c i{height:86px}' }); await p.screenshot({ path: path.join(out, id + '-big.png'), fullPage: true }); await p.addStyleTag({ content: '.c{width:390px;height:338px}.c i{height:43px}' }); }
    const sum = r.items.reduce((a, x) => a + x.len, 0), mx = Math.max(...r.items.map((x) => x.len));
    const pr = r.items.filter((x) => x.err || x.ban);
    total++; if (pr.length || !r.has) bad++;
    console.log(id + ': 대목 ' + r.n + ' · 그림 한 장 최대 ' + (mx / 1024).toFixed(1) + 'KB' + (r.has ? '' : ' · 등록 안 됨') + (pr.length ? ' · 문제 ' + pr.map((x) => x.at + ':' + (x.err || x.ban)).join(', ') : ''));
  }
  console.log('장면 ' + total + ' · 문제 있는 장면 ' + bad + ' · 오류 ' + errs.length); errs.forEach((e) => console.log(e));
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
