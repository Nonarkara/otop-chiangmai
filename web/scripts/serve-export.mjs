// Small local preview for Next's output: 'export'. Not a production server.
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };
export async function createPreviewServer(directory) {
  const root = await realpath(directory);
  const inside = path => path.startsWith(root + sep);
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400).end('Bad path'); return; }
    const base = resolve(root, '.' + pathname);
    if (base !== root && !inside(base)) { response.writeHead(403).end(); return; }
    let body, file;
    for (const candidate of [base, base + '.html', resolve(base, 'index.html')]) {
      try {
        const actual = await realpath(candidate);
        if (!inside(actual) || !(await stat(actual)).isFile()) continue;
        body = await readFile(actual); file = actual; break;
      } catch { /* Try the next static-export route. */ }
    }
    if (!file) { response.writeHead(404).end(request.method === 'HEAD' ? undefined : 'Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Length': body.length, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../out');
  try {
    const server = await createPreviewServer(directory);
    const port = Number(process.env.PORT || 3000);
    server.listen(port, '127.0.0.1', () => console.log(`Static preview: http://127.0.0.1:${port}`));
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  } catch (error) {
    console.error(`Cannot open web/out. Run npm run build first. ${error.message}`);
    process.exitCode = 1;
  }
}
