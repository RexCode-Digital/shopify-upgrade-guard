import { lstat, readFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep, join } from 'node:path';
export async function safePath(root, file, allowMissing = false) {
  const absolute = resolve(root, file), rel = relative(resolve(root), absolute);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error('Input must be a repository-relative file path');
  let current = resolve(root);
  for (const part of rel.split(sep)) {
    current = join(current, part);
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('Symbolic link inputs are not supported'); }
    catch (error) { if (allowMissing && error.code === 'ENOENT' && current === absolute) return absolute; throw error; }
  }
  const stat = await lstat(absolute);
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('Input must be a regular file up to 1 MiB');
  return absolute;
}
export async function safeRead(root, file) { return readFile(await safePath(root, file), 'utf8'); }
