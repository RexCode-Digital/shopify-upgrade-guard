import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discover, validateExcludePattern } from '../src/discovery.js';

const characters = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'];
const atom = fc.array(fc.constantFrom(...characters), { minLength: 1, maxLength: 18 })
  .map((value) => value.join(''));
const options = { seed: 20261024, numRuns: 80, endOnFailure: true };

test('GraphQL files with fragments retain one deterministic Admin API version observation', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'upgradeguard-property-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src'));
  const apiVersion = fc.constantFrom('2026-04', '2026-07', '2026-10');
  const fieldName = atom.map((value) => `field_${value}`);
  await fc.assert(fc.asyncProperty(apiVersion, fc.array(fieldName, { minLength: 1, maxLength: 10 }), async (version, fields) => {
    const source = [
      'const query = `#graphql',
      'query Generated { shop { ...SelectedFields } }',
      `fragment SelectedFields on Shop { ${fields.join(' ')} }`,
      '`;',
      `const endpoint = "https://example.myshopify.com/admin/api/${version}/graphql.json";`,
    ].join('\n');
    await writeFile(join(root, 'src', 'admin.ts'), source);
    const first = await discover(root);
    const second = await discover(root);
    const observations = first.inventory.filter((item) => item.surface === 'admin_graphql_api');
    assert.deepEqual(observations.map(({ surface, version: found, file, line, source: kind }) => ({ surface, version: found, file, line, source: kind })), [
      { surface: 'admin_graphql_api', version, file: 'src/admin.ts', line: 5, source: 'admin_graphql_url' },
    ]);
    assert.deepEqual(first.inventory, second.inventory);
  }), options);
});

test('unsupported API month strings are not inventoried as Shopify versions', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'upgradeguard-invalid-version-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const invalidVersion = fc.tuple(
    fc.integer({ min: 2020, max: 2035 }),
    fc.constantFrom(0, 2, 3, 5, 6, 8, 9, 11, 12, 13, 99),
  ).map(([year, month]) => `${year}-${String(month).padStart(2, '0')}`);
  await fc.assert(fc.asyncProperty(invalidVersion, async (version) => {
    await writeFile(join(root, 'shopify.app.toml'), `[webhooks]\napi_version = "${version}"\n`);
    const result = await discover(root);
    assert.deepEqual(result.inventory, []);
  }), options);
});

test('repository-relative exclude patterns reject traversal and absolute paths', () => {
  const pattern = fc.array(fc.constantFrom(...[...'abcdefghijklmnopqrstuvwxyz0123456789_*?-']), { minLength: 1, maxLength: 80 })
    .map((value) => value.join(''));
  fc.assert(fc.property(pattern, (value) => {
    assert.equal(validateExcludePattern(value), value);
    assert.throws(() => validateExcludePattern(`../${value}`), /Invalid exclude pattern/);
    assert.throws(() => validateExcludePattern(`/${value}`), /Invalid exclude pattern/);
  }), options);
});
