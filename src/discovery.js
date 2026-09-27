import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
const ignored = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', 'vendor', '.next', '.cache']);
const supported = new Set(['.js', '.jsx', '.ts', '.tsx', '.graphql', '.gql', '.toml', '.json']);
export async function discover(root) {
  const files = [];
  async function walk(directory) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.upgradeguard.json') continue;
      if (entry.isDirectory()) { if (!ignored.has(entry.name)) await walk(join(directory, entry.name)); continue; }
      const extension = entry.name.endsWith('.toml') ? '.toml' : entry.name.slice(entry.name.lastIndexOf('.'));
      if (!supported.has(extension) || entry.name.endsWith('.min.js')) continue;
      const path = join(directory, entry.name); const text = await readFile(path, 'utf8');
      if (Buffer.byteLength(text, 'utf8') <= 1024 * 1024) files.push({ path, relativePath: relative(root, path), text });
    }
  }
  await walk(root); return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
