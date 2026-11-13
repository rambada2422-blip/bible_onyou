#!/usr/bin/env node
/* 그림(SVG)을 한 파일(web/js/art.js)로 묶고, 한 파일짜리 미리보기 페이지(dist/preview.html)를 만든다.
 * 실행: node tools/build.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const web = path.join(root, 'web');

function clean(svg) {
  return svg.replace(/<\?xml[^>]*\?>/g, '').replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\r/g, '').replace(/\n\s*/g, '\n').trim();
}
function list(dir, ext) {
  const p = path.join(web, 'assets', dir);
  return fs.existsSync(p) ? fs.readdirSync(p).filter((f) => f.endsWith(ext)).sort() : [];
}

const art = {}, meta = {};
for (const f of list('bg', '.svg')) art[f.replace('.svg', '')] = clean(fs.readFileSync(path.join(web, 'assets/bg', f), 'utf8'));
for (const f of list('bg', '.meta.json')) {
  const m = JSON.parse(fs.readFileSync(path.join(web, 'assets/bg', f), 'utf8'));
  meta[m.key || f.replace('.meta.json', '')] = m;
}
for (const f of list('char', '.svg')) art[f.replace('.svg', '')] = clean(fs.readFileSync(path.join(web, 'assets/char', f), 'utf8'));

/* 끼워 넣기 규칙 점검: 금지 요소가 있으면 멈춘다 */
const bad = [];
for (const [k, s] of Object.entries(art)) {
  for (const tag of ['<script', '<image', '<foreignObject', '<text', 'href="http']) if (s.includes(tag)) bad.push(`${k}: ${tag}`);
}
if (bad.length) { console.error('금지 요소 발견:\n' + bad.join('\n')); process.exit(1); }

const artJs = '/* tools/build.js가 만든 파일. 직접 고치지 말 것. */\nwindow.BO = window.BO || {};\nBO.art = ' +
  JSON.stringify(art) + ';\nBO.artMeta = ' + JSON.stringify(meta) + ';\n';
fs.writeFileSync(path.join(web, 'js/art.js'), artJs);

const read = (p) => fs.readFileSync(path.join(web, p), 'utf8');
const esc = (js) => js.replace(/<\/script/gi, '<\\/script');
const fonts = 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&family=Jua&display=swap';
const page = [
  '<title>성경 탐험대</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  `<link rel="stylesheet" href="${fonts}">`,
  '<style>\n' + read('css/app.css') + '\n</style>',
  '<div id="app" class="app"></div>',
  ...['js/content.js', 'js/icons.js', 'js/art.js', 'js/app.js'].map((p) => '<script>\n' + esc(read(p)) + '\n</script>')
].join('\n');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/preview.html'), page);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + 'KB';
console.log('그림', Object.keys(art).length + '개:', Object.keys(art).join(', '));
console.log('위치 정보:', Object.keys(meta).join(', ') || '(없음)');
console.log('art.js', kb(artJs), '· dist/preview.html', kb(page));
