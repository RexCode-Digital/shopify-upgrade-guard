import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discover, validateExcludePattern } from '../src/discovery.js';
test('discovery is deterministic, bounded, and excludes generated/vendor directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'upgradeguard-discovery-')); await mkdir(join(root, 'node_modules')); await mkdir(join(root, 'dist')); await mkdir(join(root, 'vendor')); await mkdir(join(root, 'nested'));
  await writeFile(join(root, 'z.js'), 'fetch("/admin/api/2026-07/products.json")'); await writeFile(join(root, 'a.js'), 'fetch("/admin/api/2026-04/products.json")'); await writeFile(join(root, 'node_modules/ignored.js'), 'useBuyerJourneyIntercept()'); await writeFile(join(root, 'dist/ignored.js'), 'useBuyerJourneyIntercept()'); await writeFile(join(root, 'vendor/ignored.js'), 'useBuyerJourneyIntercept()'); await writeFile(join(root, 'nested/large.js'), 'x'.repeat(1024 * 1024 + 1)); await symlink(join(root, 'a.js'), join(root, 'nested/link.js'));
  const result = await discover(root); assert.deepEqual(result.files.map((file) => file.relativePath), ['a.js', 'z.js']);
});
test('exclude patterns are repository-relative and safe', () => { assert.doesNotThrow(() => validateExcludePattern('fixtures/**')); assert.throws(() => validateExcludePattern('/tmp/*'), /Invalid/); assert.throws(() => validateExcludePattern('../secret'), /Invalid/); });
