// 자동 조작용 게임 파일만 루프백 주소로 제공한다.
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const { once } = require('node:events');

const root = path.resolve(__dirname, '../..');
const web = path.join(root, 'web');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png'
};

async function serve(req, res) {
  try {
    if (req.url === '/favicon.ico') {
      res.writeHead(204).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    let file;
    if (pathname === '/preview3d.html') {
      file = path.join(root, 'dist/preview3d.html');
    } else {
      file = await fs.realpath(path.resolve(web, '.' + pathname));
      if (!file.startsWith(web + path.sep)) {
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

async function gameOrigin(browser) {
  const server = http.createServer(serve);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  browser.once('disconnected', () => server.close());
  server.unref();
  return 'http://127.0.0.1:' + server.address().port;
}

const proxy = process.env.HTTPS_PROXY
  ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' }
  : undefined;

module.exports = { gameOrigin, proxy };
