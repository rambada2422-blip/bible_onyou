#!/usr/bin/env node
/* 저장소의 js 파일에 깨진 글자(\uFFFD)가 없는지 확인한다.
 * tools/check.js가 tools/lint/*.js를 스스로 찾아 돌리는지 확인하는 기본 검사다.
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const skipDir = new Set(['.git', 'node_modules', 'dist', 'vendor']);
const files = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDir.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && ent.name.endsWith('.js')) files.push(full);
  }
}

walk(root);
files.sort();

const bad = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  if (txt.includes('\uFFFD')) {
    const lines = txt.split('\n');
    const hit = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('\uFFFD')) hit.push(i + 1);
    }
    bad.push(path.relative(root, f).replace(/\\/g, '/') + ':' + hit.slice(0, 5).join(','));
  }
}

if (bad.length) {
  console.error('깨진 글자(\\uFFFD) 발견: ' + bad.join(', '));
  process.exit(1);
}
console.log('js 파일 ' + files.length + '개 깨진 글자 없음');
