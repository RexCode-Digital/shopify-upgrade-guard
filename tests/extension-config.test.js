import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../src/scan.js';

async function fixture(t, config) {
  const root = await mkdtemp(join(tmpdir(), 'upgradeguard-extension-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, 'extensions', 'example', 'shopify.extension.toml');
  await mkdir(join(file, '..'), { recursive: true });
  await writeFile(file, config);
  return root;
}

const checkoutConfig = `api_version = "2026-10"
[[extensions]]
type = "ui_extension"
name = "Checkout extension"
[[extensions.targeting]]
target = "purchase.checkout.block.render"
module = "./src/Checkout.tsx"
[[extensions.metafields]]
namespace = "$app:private_namespace"
key = "private_customer_key"
[[extensions.targeting.metafields]]
namespace = "$app"
key = "checkout_preference"
`;

test('owner_type check is target-aware and reports safe table locations', async (t) => {
  const root = await fixture(t, checkoutConfig);
  assert.equal((await scan(root, { target: '2026-07' })).findings.some((item) => item.ruleId === 'UG-EXT-001'), false);

  const beforeRequired = await scan(root, { target: '2026-10' });
  const warnings = beforeRequired.findings.filter((item) => item.ruleId === 'UG-EXT-001');
  assert.equal(warnings.length, 2);
  assert.deepEqual(warnings.map((item) => item.line), [8, 11]);
  assert.ok(warnings.every((item) => item.column === 1 && item.severity === 'warning' && item.classification === 'target'));
  assert.ok(warnings.every((item) => item.file === 'extensions/example/shopify.extension.toml' && item.surface === 'checkout_ui_extension'));
  assert.ok(warnings.every((item) => item.confidence === 'high' && item.snippet.startsWith('[[extensions.')));
  assert.ok(!JSON.stringify(warnings).includes('private_namespace'));
  assert.ok(!JSON.stringify(warnings).includes('private_customer_key'));

  const atRequiredVersion = (await scan(root, { target: '2027-01' })).findings.filter((item) => item.ruleId === 'UG-EXT-001');
  assert.equal(atRequiredVersion.length, 2);
  assert.ok(atRequiredVersion.every((item) => item.severity === 'error' && /blocks deployments/.test(item.reason)));
});

test('multiple extensions and nested targets are associated with their own eligibility', async (t) => {
  const root = await fixture(t, `api_version = "2026-10"
[[extensions]]
type = "ui_extension"
name = "Admin extension"
[[extensions.targeting]]
target = "admin.product-details.block.render"
[[extensions.metafields]]
namespace = "not-eligible"
key = "not-eligible"
[[extensions]]
type = "ui_extension"
name = "Customer account extension"
[[extensions.targeting]]
target = "customer-account.profile.block.render"
[[extensions."metafields"]]
namespace = "$app"
key = "account-global"
[[extensions.targeting."metafields"]]
namespace = "$app"
key = "account-target"
[[extensions.targeting]]
target = "admin.product-details.block.render"
[[extensions.targeting.metafields]]
namespace = "$app"
key = "admin-target"
`);
  const findings = (await scan(root, { target: '2027-01' })).findings.filter((item) => item.ruleId === 'UG-EXT-001');
  assert.equal(findings.length, 2);
  assert.deepEqual(findings.map((item) => item.line), [15, 18]);
  assert.ok(findings.every((item) => item.surface === 'customer_account_ui_extension'));
  assert.ok(findings.every((item) => item.severity === 'error'));
});

test('other extension types, targets, comments, and string contents are not declarations', async (t) => {
  const root = await fixture(t, `[[extensions]]
type = "ui_extension"
description = """A description containing a fake table:
[[extensions.metafields]]
namespace = "fake"
key = "fake"
"""
[[extensions.targeting]]
target = "purchase.checkout.block.render"
[[extensions."targeting.metafields"]]
namespace = "literal-dot-key"
key = "not-a-target-table"
[[extensions]]
type = "pos_ui_extension"
[[extensions.targeting]]
target = "purchase.checkout.block.render"
[[extensions.metafields]]
namespace = "wrong-extension-type"
key = "wrong-extension-type"
[[extensions]]
type = "ui_extension"
[[extensions.targeting]]
target = "pos.home.tile.render"
[[extensions.metafields]]
namespace = "wrong-target"
key = "wrong-target"
# [[extensions.targeting.metafields]]
# owner_type = "PRODUCT"
`);
  assert.equal((await scan(root, { target: '2027-01' })).findings.some((item) => item.ruleId === 'UG-EXT-001'), false);
});

test('malformed extension TOML fails the scan without echoing configuration values', async (t) => {
  const root = await fixture(t, `[[extensions]]
type = "ui_extension"
[[extensions.targeting]]
target = "purchase.checkout.block.render"
[[extensions.metafields]
namespace = "PRIVATE_CONFIGURATION_VALUE"
key = "broken"
`);
  await assert.rejects(scan(root, { target: '2027-01' }), (error) => {
    assert.match(error.message, /Malformed Shopify extension TOML/);
    assert.doesNotMatch(error.message, /PRIVATE_CONFIGURATION_VALUE/);
    return true;
  });
});

test('owner_type entries and report JSON remain stable', async (t) => {
  const config = checkoutConfig.replace('key = "private_customer_key"', 'key = "private_customer_key"\nowner_type = "CUSTOMER"')
    .replace('key = "checkout_preference"', 'key = "checkout_preference"\nowner_type = "CUSTOMER"');
  const root = await fixture(t, config);
  const first = await scan(root, { target: '2027-01' });
  const second = await scan(root, { target: '2027-01' });
  assert.equal(first.findings.some((item) => item.ruleId === 'UG-EXT-001'), false);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});
