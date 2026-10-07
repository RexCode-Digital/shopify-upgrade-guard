import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scan } from '../src/scan.js';

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'upgrade-current-gaps-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    const target = path.join(root, name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text);
  }
  return root;
}
const ids = (report) => report.findings.map((item) => item.ruleId);

test('metafieldInteger GraphQL fields and type conditions are target-aware', async (t) => {
  const root = fixture(t, { 'collection.graphql': `query Conditions { collections(first: 1) { nodes { source { inclusion { conditions { ...IntegerCondition } } } } } }\nfragment IntegerCondition on CollectionSourceInclusionConditionMetafieldInteger { value }\nmutation Update($input: CollectionSourceInclusionConditionInput!) { collectionUpdate(input: { conditions: [{ metafieldInteger: { value: 42 } }] }) { userErrors { message } } }` });
  assert.ok(!ids(await scan(root, { target: '2026-10' })).includes('UG-ADMIN-003'));
  const result = await scan(root, { target: '2027-01' });
  assert.ok(result.findings.some((item) => item.ruleId === 'UG-ADMIN-003'));
  assert.match(result.findings.find((item) => item.ruleId === 'UG-ADMIN-003').migration, /metafieldInt/);
  fs.writeFileSync(path.join(root, 'collection.graphql'), 'query { collections(first: 1) { nodes { id } } }');
  assert.ok(!ids(await scan(root, { target: '2027-01' })).includes('UG-ADMIN-003'));
});

test('barcode deprecation is a warning only for statically selected Admin ProductVariant fields', async (t) => {
  const root = fixture(t, {
    'read.ts': 'const query = `query {\n  productVariant(id: $id) { code: barcode }\n  productVariants(first: 2) { nodes { ...VariantCodes } }\n}\nfragment VariantCodes on ProductVariant {\n  barcode\n}`;'
  });
  assert.ok(!ids(await scan(root, { target: '2026-07' })).includes('UG-ADMIN-004'));
  const findings = (await scan(root, { target: '2026-10' })).findings.filter((item) => item.ruleId === 'UG-ADMIN-004');
  assert.equal(findings.length, 2);
  assert.ok(findings.every((item) => item.severity === 'warning' && item.classification === 'target'));
  fs.writeFileSync(path.join(root, 'read.ts'), 'const query = `query { products(first: 1) { nodes { title } } }`; const unrelated = `query { shop { barcode } }`;');
  assert.ok(!ids(await scan(root, { target: '2026-10' })).includes('UG-ADMIN-004'));
});

test('segment syntax findings require a segment GraphQL query argument', async (t) => {
  const root = fixture(t, {
    'segments.graphql': `mutation CreateSegment { segmentCreate(input: { name: "test", query: "shopify_email.opened() = true AND last_order_date > 90_days_ago" }) { userErrors { message } } }`,
    'unrelated.graphql': `query { shop { metafield(namespace: "x", key: "y") { value } } }`
  });
  assert.ok(!ids(await scan(root, { target: '2026-07' })).includes('UG-SEGMENT-001'));
  const result = await scan(root, { target: '2026-10' });
  assert.equal(result.findings.filter((item) => item.ruleId === 'UG-SEGMENT-001').length, 2);
  assert.ok(result.findings.filter((item) => item.ruleId === 'UG-SEGMENT-001').every((item) => item.severity === 'warning'));
  fs.writeFileSync(path.join(root, 'segments.graphql'), 'mutation { segmentCreate(input: { name: "test", query: "shopify_email.opened MATCHES () AND last_order_date > -90d" }) { userErrors { message } } }');
  assert.ok(!ids(await scan(root, { target: '2026-10' })).includes('UG-SEGMENT-001'));
});

test('removed inventory error handling is target-aware and comments/prose do not trigger', async (t) => {
  const root = fixture(t, { 'inventory.ts': `if (error.code === 'ITEM_NOT_STOCKED_AT_LOCATION') recover();\n// case ITEM_NOT_STOCKED_AT_LOCATION: obsolete\nconst note = "ITEM_NOT_STOCKED_AT_LOCATION";` });
  assert.ok(!ids(await scan(root, { target: '2026-07' })).includes('UG-ADMIN-005'));
  const finding = (await scan(root, { target: '2026-10' })).findings.find((item) => item.ruleId === 'UG-ADMIN-005');
  assert.ok(finding); assert.equal(finding.severity, 'error');
  fs.writeFileSync(path.join(root, 'inventory.ts'), '// error.code === "ITEM_NOT_STOCKED_AT_LOCATION"\nconst note = "ITEM_NOT_STOCKED_AT_LOCATION";');
  assert.ok(!ids(await scan(root, { target: '2026-10' })).includes('UG-ADMIN-005'));
});
