// 자동 조작용 게임 파일만 루프백 주소로 제공한다.
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const { createReadStream } = require('node:fs');

const root = path.resolve(__dirname, '../..');
const web = path.join(root, 'web');
const web3d = path.join(root, 'web3d');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2'
};

// 모바일 브라우저는 결말로 이동할 때 MP4의 뒷부분만 다시 요청한다.
async function serveFilm(req, res, file) {
  const { size } = await fs.stat(file);
  const headers = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes' };
  const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  let start = 0, end = size - 1, status = 200;
  if (match && (match[1] || match[2])) {
    start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    if (match[1] && match[2]) end = Math.min(end, Number(match[2]));
    if (start > end) {
      res.writeHead(416, { ...headers, 'Content-Range': 'bytes */' + size }).end();
      return;
    }
    status = 206;
    headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + size;
  }
  res.writeHead(status, { ...headers, 'Content-Length': end - start + 1 });
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = createReadStream(file, { start, end });
  res.on('close', () => stream.destroy());
  stream.on('error', error => res.destroy(error));
  stream.pipe(res);
}

async function serve(req, res) {
  try {
    if (req.url === '/favicon.ico') {
      res.writeHead(204).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    let file;
    if (pathname === '/preview3d.html' || pathname === '/preview.html' || pathname === '/dist/preview.html' || pathname === '/nile.html') {
      file = path.join(root, 'dist', path.basename(pathname));
    } else if (/^(?:\/dist)?\/videos\/exodus-palace\/(?:0[1-9]|10)\.mp4$/.test(pathname)) {
      return await serveFilm(req, res, path.join(root, pathname.slice(1)));
    } else {
      const source = pathname.startsWith('/web3d/') ? web3d : web;
      const relative = pathname.replace(/^\/web(?:3d)?(?=\/)/, '');
      file = await fs.realpath(path.resolve(source, '.' + relative));
      if (!file.startsWith(source + path.sep)) {
        res.writeHead(404).end();
        return;
      }
    }
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch (error) {
    res.writeHead(['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404 : 400).end();
  }
}

async function gameOrigin(browser, handler = serve) {
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  browser.once('disconnected', () => server.close());
  server.unref();
  return 'http://127.0.0.1:' + server.address().port;
}

const proxy = process.env.HTTPS_PROXY
  ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' }
  : undefined;

// 관리형 Chromium이 file: 이동을 제한하면 같은 HTML 하나만 루프백에서 제공한다.
async function openOfflineBundle(context, file, fragment = '') {
  const filePage = await context.newPage();
  try {
    await filePage.goto(pathToFileURL(path.resolve(file)).href + fragment);
    return filePage;
  } catch (error) {
    if (!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR')) throw error;
    // 차단된 탭에서 늦게 열리는 브라우저 오류 페이지가 다음 탐색을 덮지 않게 한다.
    await filePage.close();
  }
  const html = await fs.readFile(file);
  const origin = await gameOrigin(context.browser(), (req, res) => {
    if (req.url !== '/expedition.html') return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': types['.html'] }).end(html);
  });
  const bundle = origin + '/expedition.html';
  const page = await context.newPage();
  await context.route(/^https?:/, route => {
    const request = route.request();
    return request.url() === bundle && request.isNavigationRequest() && request.frame() === page.mainFrame()
      ? route.continue() : route.abort();
  });
  await context.setOffline(false);
  await page.goto(bundle + fragment);
  return page;
}

module.exports = { gameOrigin, openOfflineBundle, proxy };
