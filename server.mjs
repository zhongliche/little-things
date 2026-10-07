import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml' };
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = resolve(root, `.${requested}`);
  if (!file.startsWith(resolve(root) + sep) && file !== resolve(root, 'index.html')) { res.writeHead(403);res.end('Forbidden');return; }
  try { const body = await readFile(file);res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream','Cache-Control':'no-cache' });res.end(body); }
  catch { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});res.end('Not found'); }
});
server.listen(4173, '0.0.0.0', () => console.log('顺手已就绪：http://localhost:4173'));
