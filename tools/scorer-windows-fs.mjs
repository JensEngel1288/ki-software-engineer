import { stat, symlink as createSymlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export * from 'node:fs/promises';

// Directory junctions let scorer workspaces share node_modules on Windows.
export async function symlink(target, linkPath, type) {
  if (process.platform === 'win32' && type === undefined) {
    const absoluteTarget = resolve(dirname(linkPath), target);
    if ((await stat(absoluteTarget)).isDirectory()) {
      return createSymlink(absoluteTarget, linkPath, 'junction');
    }
  }
  return createSymlink(target, linkPath, type);
}
