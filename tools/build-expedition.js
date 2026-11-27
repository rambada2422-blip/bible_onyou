// 오프라인 단일 파일과 웹 원본이 같은 게임 코드를 실행한다.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const web = path.join(root, 'web');
const read = (file) => fs.readFileSync(path.join(web, file), 'utf8');
const types = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
function embedded(file) {
  const mime = types[path.extname(file)];
  if (!mime) throw Error('지원하지 않는 파일 ' + file);
  return 'data:' + mime + ';base64,' + fs.readFileSync(path.join(web, file)).toString('base64');
}
function build() {
  const html = read('expedition.html')
    .replace(
      /<link rel="stylesheet" href="([^"]+)">/,
      (_, file) =>
        '<style>' +
        read(file).replace(/url\('\.\.\/(assets\/[^']+)'\)/g, (_, asset) => 'url(' + embedded(asset) + ')') +
        '</style>'
    )
    .replace(/<script src="([^"]+)"><\/script>/g, (_, file) => {
      let js = read(file);
      if (file.endsWith('/assets.js'))
        js = js.replace(/'(assets\/[^']+)'/g, (_, asset) => "'" + embedded(asset) + "'");
      return '<script>' + js.replace(/<\/script/gi, '<\\/script') + '</script>';
    })
    .replace('</head>', () => '<!-- ' + read('assets/fonts/OFL.txt') + ' -->\n</head>');
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dist/expedition.html'), html);
}
module.exports = build;
if (require.main === module) build();
