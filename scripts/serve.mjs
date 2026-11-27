/**
 * Мини-сервер для локальной разработки (без зависимостей).
 * Запуск: npm run dev  →  http://127.0.0.1:8080
 * Порт можно переопределить: PORT=3000 npm run dev
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.sql': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';

    const filePath = normalize(join(root, pathname));
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const info = await stat(filePath).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
});

let currentPort = port;

function onListening() {
  console.log(`Wordly dev server: http://${host}:${currentPort}`);
}

server.on('error', (error) => {
  if ((error.code === 'EACCES' || error.code === 'EADDRINUSE') && currentPort < port + 20) {
    currentPort += 1;
    server.listen(currentPort, host, onListening);
    return;
  }
  console.error(error);
  process.exit(1);
});

server.listen(currentPort, host, onListening);
