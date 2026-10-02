import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { createPreviewServer } from '../scripts/serve-export.mjs';
let directory, server, base;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'otop-preview-'));
  await mkdir(join(directory, 'out/products'), { recursive: true });
  await writeFile(join(directory, 'out/index.html'), '<h1>Home</h1>');
  await writeFile(join(directory, 'out/products.html'), '<h1>Products</h1>');
  await writeFile(join(directory, 'out/products/bowl.html'), '<h1>Bowl</h1>');
  await writeFile(join(directory, 'out/app.js'), 'void 0;');
  await writeFile(join(directory, 'private.txt'), 'not public');
  await symlink(join(directory, 'private.txt'), join(directory, 'out/leak.txt'));
  server = await createPreviewServer(join(directory, 'out'));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) { server.close(); await once(server, 'close'); } if (directory) await rm(directory, { recursive: true }); });
test('root, clean routes, nested routes, and query strings', async () => {
  for (const [route, text] of [['/', 'Home'], ['/products', 'Products'], ['/products/bowl', 'Bowl'], ['/products?category=crafts', 'Products']]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(text));
  }
});
test('assets get a usable MIME type', async () => {
  assert.match((await fetch(base + '/app.js')).headers.get('content-type'), /javascript/);
});
test('HEAD has metadata and no body', async () => {
  const response = await fetch(base + '/products', { method: 'HEAD' });
  assert.equal(response.status, 200); assert.ok(Number(response.headers.get('content-length')) > 0); assert.equal(await response.text(), '');
});
test('missing routes, invalid paths, and mutation methods', async () => {
  assert.equal((await fetch(base + '/missing')).status, 404);
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
});
test('encoded traversal and symlinks cannot expose files outside export', async () => {
  assert.equal((await fetch(base + '/..%2Fprivate.txt')).status, 403);
  assert.equal((await fetch(base + '/leak.txt')).status, 404);
});
