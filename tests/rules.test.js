import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../src/scan.js';
const makeRepo = async (files) => { const root = await mkdtemp(join(tmpdir(), 'upgradeguard-rules-')); for (const [name, text] of Object.entries(files)) { const path = join(root, name); await mkdir(join(path, '..'), { recursive: true }); await writeFile(path, text); } return root; };
const ids = (result) => result.findings.map((finding) => finding.ruleId);

test('checkout deprecation is target-aware at the exact boundary', async () => {
  const root = await makeRepo({ 'extensions/checkout/shopify.extension.toml': 'api_version = "2026-04"\nblock_progress = true\n', 'extensions/checkout/index.ts': 'useBuyerJourneyIntercept(() => ({behavior: "allow"}));' });
  assert.equal(ids(await scan(root, { target: '2026-04' })).includes('UG-CHECKOUT-001'), false);
  const atBoundary = await scan(root, { target: '2026-07' });
  assert.equal(atBoundary.findings.filter((finding) => finding.ruleId === 'UG-CHECKOUT-001')[0].classification, 'target');
  assert.equal(ids(await scan(root, { target: '2026-10' })).includes('UG-CHECKOUT-002'), true);
});
test('already affected checkout code is current debt even with a later target', async () => {
  const root = await makeRepo({ 'extensions/checkout/shopify.extension.toml': 'api_version = "2026-07"\n', 'extensions/checkout/index.ts': 'useBuyerJourneyIntercept(() => ({behavior: "allow"}));' });
  assert.equal((await scan(root, { target: '2026-04' })).findings[0].classification, 'current');
});
test('comments and string literals do not trigger checkout hook rules', async () => {
  const root = await makeRepo({ 'extensions/checkout/shopify.extension.toml': 'api_version = "2026-04"\n# block_progress = true\n', 'extensions/checkout/index.ts': '// useBuyerJourneyIntercept\nconst label = "useBuyerJourneyIntercept";' });
  assert.equal(ids(await scan(root, { target: '2026-04' })).some((id) => id.startsWith('UG-CHECKOUT')), false);
});
test('REST URL matches but GraphQL URL does not', async () => {
  const root = await makeRepo({ 'admin.js': "fetch('/admin/api/2026-07/products.json');\nfetch('/admin/api/2026-07/graphql.json');" });
  const result = await scan(root); assert.equal(result.findings.filter((finding) => finding.ruleId === 'UG-REST-001').length, 1); assert.equal(result.inventory[0].surface, 'admin_rest_api');
});
test('unrelated REST-like identifiers do not match without Shopify context', async () => { const root = await makeRepo({ 'utility.js': 'const restResources = registry.resources;' }); const result = await scan(root); assert.equal(result.findings.some((finding) => finding.ruleId === 'UG-REST-001'), false); });
test('unrelated TOML version keys are not Shopify inventory', async () => { const root = await makeRepo({ 'tool.toml': 'api_version = "2025-01"' }); const result = await scan(root); assert.equal(result.inventory.length, 0); });
