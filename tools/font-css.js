// 웹 원본의 글꼴과 이용 조건을 단일 HTML 미리보기 안에 함께 넣는다.
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../web/assets/fonts');

module.exports = function fontCss() {
  const css = fs.readFileSync(path.join(dir, 'fonts.css'), 'utf8');
  const license = fs.readFileSync(path.join(dir, 'OFL.txt'), 'utf8');
  return '/*\n' + license + '\n*/\n' + css.replace(/url\("([\w-]+\.woff2)"\)/g, (_, name) => {
    const data = fs.readFileSync(path.join(dir, name)).toString('base64');
    return 'url("data:font/woff2;base64,' + data + '")';
  });
};
