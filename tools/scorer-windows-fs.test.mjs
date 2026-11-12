import assert from 'node:assert/strict';
import { lstat, mkdir, mkdtemp, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { symlink } from './scorer-windows-fs.mjs';

async function workspace(t) {
  const temporaryRoot = fileURLToPath(new URL('../tmp/', import.meta.url));
  await mkdir(temporaryRoot, { recursive: true });
  const directory = await mkdtemp(join(temporaryRoot, 'scorer-fs-'));
  const source = join(directory, 'source');
  const link = join(directory, 'node_modules');
  const marker = join(source, 'package.json');
  t.after(async () => {
    for (const file of [link, marker]) {
      try {
        await unlink(file);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    await rmdir(source);
    await rmdir(directory);
  });
  await mkdir(source);
  await writeFile(marker, '{"name":"fixture"}');
  return { directory, source, link, marker };
}

test('a workspace can read linked dependencies and unlink without deleting the source', async t => {
  const { source, link, marker } = await workspace(t);
  await symlink(source, link);
  assert((await lstat(link)).isSymbolicLink());
  assert.equal(await readFile(join(link, 'package.json'), 'utf8'), '{"name":"fixture"}');
  await unlink(link);
  assert.equal(await readFile(marker, 'utf8'), '{"name":"fixture"}');
});

test('relative directory targets resolve against the link directory', async t => {
  const { link } = await workspace(t);
  await symlink('./source', link);
  assert.equal(await readFile(join(link, 'package.json'), 'utf8'), '{"name":"fixture"}');
});

test(
  'missing dependency directories report a filesystem error on Windows',
  { skip: process.platform !== 'win32' },
  async t => {
    const { directory, link } = await workspace(t);
    await assert.rejects(symlink(join(directory, 'missing'), link), { code: 'ENOENT' });
    await assert.rejects(lstat(link), { code: 'ENOENT' });
  }
);
