#!/usr/bin/env node
/* 실행: node tools/build-david.js → dist/david.html */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const game = path.join(root, 'web/david');
const dist = path.join(root, 'dist');
const types = { '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };

function embed(file) {
  const type = types[path.extname(file)];
  if (!type) throw new Error('오프라인 실행본에서 지원하지 않는 파일 ' + file);
  return 'data:' + type + ';base64,' + fs.readFileSync(file).toString('base64');
}

function styleSheet(_, relative) {
  const file = path.resolve(game, relative);
  const css = fs.readFileSync(file, 'utf8').replace(
    /url\((['"])([^'"]+)\1\)/g,
    (match, quote, asset) => 'url("' + embed(path.resolve(path.dirname(file), asset)) + '")'
  );
  return '<style>\n' + css + '\n</style>';
}

function script(_, relative) {
  const js = fs.readFileSync(path.resolve(game, relative), 'utf8').replace(
    /(['"])(media\/[^'"]+)\1/g,
    (match, quote, asset) => quote + embed(path.resolve(game, asset)) + quote
  );
  return '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>';
}

const license = fs.readFileSync(path.join(root, 'web/assets/fonts/OFL.txt'), 'utf8');
const html = fs.readFileSync(path.join(game, 'index.html'), 'utf8')
  .replace(/<link rel="stylesheet" href="([^"]+)">/g, styleSheet)
  .replace(/<script src="([^"]+)"><\/script>/g, script)
  .replace('</head>', () => '<!--\n' + license + '\n-->\n</head>');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'david.html'), html);
console.log('다윗 오프라인 실행본 dist/david.html');
