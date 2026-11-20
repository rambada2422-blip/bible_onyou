#!/usr/bin/env node
/* 3D 샘플용: 아바타 그림을 묶고(web3d/js/avatars.js), 한 파일짜리 미리보기(dist/preview3d.html)를 만든다.
 * 실행: node tools/build3d.js
 * 미리보기에는 three.js(vendor 폴더의 사본)를 함께 넣는다. 이 작업 환경에서 CDN 주소를 확인할 수 없어서다.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const clean = (s) => s.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\n\s*/g, '\n').trim();

const av = {};
for (const k of ['choeon', 'hyu', 'onwoo']) av[k] = clean(read(`web/assets/char/${k}-avatar.svg`));
fs.writeFileSync(path.join(root, 'web3d/js/avatars.js'),
  '/* tools/build3d.js가 만든 파일. 직접 고치지 말 것. */\nwindow.BO3D = window.BO3D || {};\nBO3D.avatars = ' + JSON.stringify(av) + ';\n');

/* Blender로 만든 모델(GLB)과 압도 장면 그림(JPG)을 글자 형태로 묶는다 */
const glb = {};
for (const f of fs.existsSync(path.join(root, 'web3d/assets')) ? fs.readdirSync(path.join(root, 'web3d/assets')).filter((x) => x.endsWith('.glb')) : []) {
  glb[f.replace('.glb', '')] = fs.readFileSync(path.join(root, 'web3d/assets', f)).toString('base64');
}
const awe = {};
const aweDir = path.join(root, 'web3d/assets/awe');
for (const f of fs.existsSync(aweDir) ? fs.readdirSync(aweDir).filter((x) => x.endsWith('.jpg')).sort() : []) {
  awe[f.replace('.jpg', '')] = fs.readFileSync(path.join(aweDir, f)).toString('base64');
}
fs.writeFileSync(path.join(root, 'web3d/js/glbdata.js'),
  '/* tools/build3d.js가 만든 파일. 직접 고치지 말 것. */\nwindow.BO3D = window.BO3D || {};\nBO3D.glbData = ' + JSON.stringify(glb) + ';\nBO3D.aweData = ' + JSON.stringify(awe) + ';\n');

const sharon = {};
for (const face of ['avatar', 'ask', 'joy', 'cheer']) {
  const png = path.join(root, 'web3d/assets/sharon', `sharon-${face}.png`);
  if (fs.existsSync(png)) sharon[face] = fs.readFileSync(png).toString('base64');
}
fs.writeFileSync(path.join(root, 'web3d/js/sharondata.js'),
  '/* tools/build3d.js가 만든 파일. 직접 고치지 말 것. */\nwindow.BO3D = window.BO3D || {};\nBO3D.sharonData = ' + JSON.stringify(sharon) + ';\n');

const esc = (js) => js.replace(/<\/script/gi, '<\\/script');
const fontCss = require('./font-css');
const scripts = ['web/js/content.js', 'web3d/js/content3d.js', 'web/js/icons.js', 'web3d/js/avatars.js', 'web3d/js/sharondata.js', 'web3d/js/models.js', 'web3d/js/models_jordan.js', 'web3d/js/glbdata.js', 'web3d/js/world.js', 'web3d/js/jordan.js', 'web3d/js/fx.js', 'web3d/js/game-scene.js', 'web3d/js/game-ui.js', 'web3d/js/game-awe.js', 'web3d/js/game-exploration.js', 'web3d/js/game-travel.js', 'web3d/js/game-jordan.js', 'web3d/js/game-story.js', 'web3d/js/game-controls.js', 'web3d/js/game-loop.js', 'web3d/js/game-debug.js', 'web3d/js/game-save.js', 'web3d/js/game.js'];
const page = [
  '<!doctype html><html lang="ko"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<title>성경 탐험대 3D</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<style>\n' + read('web/css/app.css') + '\n' + read('web3d/css/game.css') + '\n</style>',
  '</head><body>',
  '<div id="game" class="g3 app"><canvas id="c"></canvas><div id="ui"></div></div>',
  '<script>\n' + esc(read('web3d/vendor/three.min.js')) + '\n</script>',
  '<script>\n' + esc(read('web3d/vendor/GLTFLoader.js')) + '\n</script>',
  ...scripts.filter((p) => fs.existsSync(path.join(root, p))).map((p) => '<script>\n' + esc(read(p)) + '\n</script>'),
  '<style>\n' + fontCss() + '\n</style>',
  '</body></html>'
].join('\n');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/preview3d.html'), page);
console.log('avatars.js 생성 · dist/preview3d.html', (Buffer.byteLength(page) / 1024).toFixed(0) + 'KB');
