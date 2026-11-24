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
function rasterSize(buf, ext) {
  if (ext === '.png') {
    if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (ext === '.jpg') {
    if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
    let i = 2;
    while (i + 1 < buf.length) {
      if (buf[i] !== 0xFF) return null;
      while (i < buf.length && buf[i] === 0xFF) i++;
      if (i >= buf.length) return null;
      const m = buf[i++];
      if (m === 0xD8 || m === 0xD9 || (m >= 0xD0 && m <= 0xD7) || m === 0x01) continue;
      if (i + 1 >= buf.length) return null;
      const len = buf.readUInt16BE(i);
      if (len < 2 || i + len > buf.length) return null;
      if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) {
        if (len < 7) return null;
        return { h: buf.readUInt16BE(i + 3), w: buf.readUInt16BE(i + 5) };
      }
      i += len;
    }
  }
  return null;
}

const art = {}, meta = {}, handSvg = {}, bgByKey = {};
for (const ext of ['.svg', '.jpg', '.png']) {
  for (const f of list('bg', ext)) {
    const k = f.slice(0, -ext.length);
    (bgByKey[k] = bgByKey[k] || []).push(f);
  }
}
for (const [k, files] of Object.entries(bgByKey)) {
  if (files.length > 1) {
    console.error(`같은 키의 배경 그림 파일이 함께 있습니다: ${k} (${files.join(', ')})`);
    process.exit(1);
  }
}

for (const f of list('bg', '.svg')) {
  const k = f.replace('.svg', '');
  art[k] = handSvg[k] = clean(fs.readFileSync(path.join(web, 'assets/bg', f), 'utf8'));
}

let rasterTotal = 0;
for (const ext of ['.jpg', '.png']) {
  const mime = ext === '.jpg' ? 'image/jpeg' : 'image/png';
  for (const f of list('bg', ext)) {
    const k = f.slice(0, -ext.length);
    const buf = fs.readFileSync(path.join(web, 'assets/bg', f));
    if (buf.length > 300 * 1024) {
      console.error(`사진형 배경 그림 파일이 300KB를 넘습니다: ${f} (${(buf.length / 1024).toFixed(1)}KB)`);
      process.exit(1);
    }
    const sz = rasterSize(buf, ext);
    // 재앙 관찰 그림과 유월절 방은 단서가 가로로 배치되어 있다.
    const [width, height] = k.startsWith('plague-') ? [720, 480]
      : k === 'ex07-room' ? [1200, 800] : k === 'ex04-palace' ? [864, 486] : [900, 1200];
    if (!sz || sz.w !== width || sz.h !== height) {
      console.error(`사진형 배경 그림 크기가 가로 ${width} × 세로 ${height} 픽셀이 아닙니다: ${f} (${sz ? sz.w + '×' + sz.h : '크기 확인 불가'})`);
      process.exit(1);
    }
    rasterTotal += buf.length;
    if (rasterTotal > 1.5 * 1024 * 1024) {
      console.error(`사진형 배경 그림 파일을 모두 합친 크기가 1.5MB를 넘습니다 (${(rasterTotal / (1024 * 1024)).toFixed(2)}MB)`);
      process.exit(1);
    }
    art[k] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice"><g id="${k}-state-main"><image href="data:${mime};base64,${buf.toString('base64')}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/></g></svg>`;
  }
}

for (const f of list('bg', '.meta.json')) {
  const m = JSON.parse(fs.readFileSync(path.join(web, 'assets/bg', f), 'utf8'));
  meta[m.key || f.replace('.meta.json', '')] = m;
}
for (const f of list('char', '.svg')) {
  const k = f.replace('.svg', '');
  art[k] = handSvg[k] = clean(fs.readFileSync(path.join(web, 'assets/char', f), 'utf8'));
}

/* 끼워 넣기 규칙 점검: 손으로 쓴 SVG 파일에 금지 요소가 있으면 멈춘다 */
const bad = [];
for (const [k, s] of Object.entries(handSvg)) {
  for (const tag of ['<script', '<image', '<foreignObject', '<text', 'href="http']) if (s.includes(tag)) bad.push(`${k}: ${tag}`);
}
if (bad.length) { console.error('금지 요소 발견:\n' + bad.join('\n')); process.exit(1); }

const artJs = '/* tools/build.js가 만든 파일. 직접 고치지 말 것. */\nwindow.BO = window.BO || {};\nBO.art = ' +
  JSON.stringify(art) + ';\nBO.artMeta = ' + JSON.stringify(meta) + ';\n';
fs.writeFileSync(path.join(web, 'js/art.js'), artJs);

const read = (p) => fs.readFileSync(path.join(web, p), 'utf8');
const esc = (js) => js.replace(/<\/script/gi, '<\\/script');
// 원본 웹과 오프라인 묶음에서 같은 데이터를 동기적으로 읽는다.
const field = JSON.parse(read('data/wilderness.json'));
fs.writeFileSync(path.join(web, 'js/wilderness-data.js'),
  '/* web/data/wilderness.json에서 tools/build.js로 생성 */\nBO.wildField = ' + JSON.stringify(field, null, 2) + ';\n');
const fontCss = require('./font-css');
const scripts = [
  'js/content.js', 'js/icons.js', 'js/order-question.js', 'js/reference-input.js', 'js/art.js',
  'js/app-core.js', 'js/app-questions.js', 'js/app-scene.js', 'js/palace-story.js', 'js/nile-routes.js', 'js/nile-art.js', 'js/nile-rapids.js', 'js/nile-game.js', 'js/palace-watch-scenes.js', 'js/palace-watch.js', 'js/palace.js', 'js/red-sea-landscape.js', 'js/red-sea-play.js', 'js/red-sea.js', 'js/wilderness-data.js', 'js/wilderness-scripture.js', 'js/wilderness-landscape.js', 'js/wilderness-feel.js', 'js/wilderness.js', 'js/exodus-trail.js', 'js/passover.js', 'js/app.js',
];
// 단일 HTML에서도 본문 음성을 인터넷 연결 없이 재생한다.
const palaceAudio = {};
for (const file of list('audio/palace', '.mp3')) {
  const audio = fs.readFileSync(path.join(web, 'assets/audio/palace', file));
  palaceAudio[path.basename(file, '.mp3')] = 'data:audio/mpeg;base64,' + audio.toString('base64');
}
const watchImages = {};
for (const file of list('palace-watch', '.jpg')) {
  const photo = fs.readFileSync(path.join(web, 'assets/palace-watch', file));
  watchImages[path.basename(file, '.jpg')] = 'data:image/jpeg;base64,' + photo.toString('base64');
}
const redSeaImages = {};
for (const key of ['camp', 'shore', 'rear', 'wind', 'walls', 'bank', 'return', 'song', 'drum']) {
  const image = fs.readFileSync(path.join(web, 'assets/red-sea', key + '.webp'));
  redSeaImages[key] = 'data:image/webp;base64,' + image.toString('base64');
}
const page = [
  '<!doctype html><html lang="ko"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<title>성경 탐험대</title>',
  '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,' + Buffer.from(read('assets/char/timemachine.svg')).toString('base64') + '">',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<style>\n' + read('css/app.css') + '\n' + read('css/nile.css') + '\n' + read('css/palace-watch.css') + '\n' + read('css/exodus-trail.css') + '\n' + read('css/red-sea.css') + '\n' + read('css/wilderness.css') + '\n</style>',
  '</head><body>',
  '<div id="app" class="app"></div>',
  '<script>window.BO = window.BO || {}; BO.palaceAudio = ' + JSON.stringify(palaceAudio) + '; BO.palaceWatchImages = ' + JSON.stringify(watchImages) + '; BO.redSeaImages = ' + JSON.stringify(redSeaImages) + ';</script>',
  ...scripts.map((p) => '<script>\n' + esc(read(p)) + '\n</script>'),
  '<style>\n' + fontCss() + '\n</style>',
  '</body></html>'
].join('\n');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const filmDir = 'videos/exodus-palace';
fs.mkdirSync(path.join(root, 'dist', filmDir), { recursive: true });
for (let chapter = 1; chapter <= 10; chapter++) {
  const name = String(chapter).padStart(2, '0') + '.mp4';
  fs.copyFileSync(path.join(root, filmDir, name), path.join(root, 'dist', filmDir, name), fs.constants.COPYFILE_FICLONE);
}
fs.writeFileSync(path.join(root, 'dist/preview.html'), page);

// 물길 단독 입구는 공통 저장과 본문을 그대로 쓰고, 왕궁 음성·그림·글꼴은 왕궁에 들어갈 때만 불러온다.
const riverScripts = ['content', 'icons', 'app-core', 'palace-story', 'nile-routes', 'nile-art', 'nile-rapids', 'nile-game'];
const riverPage = [
  '<!doctype html><html lang="ko"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<title>나일강 물길 탐험 · 바이블 온유</title>',
  '<link rel="icon" href="data:,">',
  '<style>' + read('css/app.css') + '\n' + read('css/nile.css') + '</style></head>',
  '<body><div id="app" class="app"></div>',
  ...riverScripts.map(name => '<script>' + esc(read('js/' + name + '.js')) + '</script>'),
  '<script>BO.app2d.nile.open(function () { location.assign("./index.html#palace"); });</script>',
  '</body></html>'
].join('\n');
fs.writeFileSync(path.join(root, 'dist/nile.html'), riverPage);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + 'KB';
console.log('그림', Object.keys(art).length + '개:', Object.keys(art).join(', '));
console.log('위치 정보:', Object.keys(meta).join(', ') || '(없음)');
console.log('art.js', kb(artJs), '· dist/preview.html', kb(page));
