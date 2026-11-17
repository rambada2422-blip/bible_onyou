// 기존 Playwright/브라우저를 사용한다. 작업 폴더·운영체제에 종속되지 않는 미리보기 주소.
const path = require('path');
const { pathToFileURL } = require('url');
const playwright = require('playwright');
const previewURL = pathToFileURL(path.resolve(__dirname, '../../../dist/preview3d.html')).href;
const chromium = {
  launch(options) {
    const opt = Object.assign({}, options);
    if (process.env.BO3D_BROWSER) opt.executablePath = process.env.BO3D_BROWSER;
    return playwright.chromium.launch(opt);
  }
};
module.exports = { chromium, previewURL };
