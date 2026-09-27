import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../src/scan.js';
import { writeBaseline } from '../src/baseline.js';
test('config drives target, fail policy inputs, and excludes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'upgradeguard-config-')); await writeFile(join(root, '.upgradeguard.json'), JSON.stringify({ targetVersion: '2026-04', failOn: 'warning', exclude: ['ignored/**'] })); await writeFile(join(root, 'ignored/code.js'), 'useBuyerJourneyIntercept()').catch(async () => { const { mkdir } = await import('node:fs/promises'); await mkdir(join(root, 'ignored')); await writeFile(join(root, 'ignored/code.js'), 'useBuyerJourneyIntercept()'); });
  const result = await scan(root); assert.equal(result.targetVersion, '2026-04'); assert.equal(result.findings.length, 0);
});
test('invalid config fails closed', async () => { const root = await mkdtemp(join(tmpdir(), 'upgradeguard-invalid-config-')); await writeFile(join(root, '.upgradeguard.json'), '{bad'); await assert.rejects(() => scan(root), /Invalid \.upgradeguard\.json/); });
test('baseline fingerprints suppress only matching findings', async () => {
  const root = await mkdtemp(join(tmpdir(), 'upgradeguard-baseline-')); await writeFile(join(root, 'code.js'), 'fetch("/admin/api/2025-01/products.json")'); const before = await scan(root); await writeBaseline(root, before.findings); const after = await scan(root); assert.equal(after.baselinedCount, 2); assert.equal(after.findings.every((finding) => finding.baselined), true); assert.match(await readFile(join(root, '.upgradeguard-baseline.json'), 'utf8'), /fingerprint/);
});
