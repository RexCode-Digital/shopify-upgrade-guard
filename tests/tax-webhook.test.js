import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scan } from '../src/scan.js';

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'upgrade-tax-webhook-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
  return root;
}

test('flags a configured tax summary webhook only from target API version 2027-01', async (t) => {
  const root = fixture(t, {
    'shopify.app.toml': `[webhooks]
api_version = "2027-01"

[[webhooks.subscriptions]]
topics = ["orders/create", "tax_summaries/create"]
uri = "/webhooks/tax-summary"
`
  });

  assert.equal((await scan(root, { target: '2026-10' })).findings.some((item) => item.ruleId === 'UG-TAX-001'), false);
  const finding = (await scan(root, { target: '2027-01' })).findings.find((item) => item.ruleId === 'UG-TAX-001');
  const laterTarget = (await scan(root, { target: '2027-04' })).findings.find((item) => item.ruleId === 'UG-TAX-001');
  assert.ok(finding);
  assert.ok(laterTarget);
  assert.equal(finding.line, 5);
  assert.equal(finding.severity, 'warning');
  assert.equal(finding.classification, 'target');
  assert.equal(finding.confidence, 'medium');
  assert.match(finding.migration, /Global IDs|GIDs/);
});

test('matches multiline topic arrays but ignores comments and Events configuration', async (t) => {
  const root = fixture(t, {
    'shopify.app.production.toml': `[webhooks]
api_version = "2027-01"

[events]
api_version = "2027-01"

[[events.subscription]]
topic = "tax_summaries/create"
actions = ["update"]

[[webhooks.subscriptions]]
topics = [
  "orders/create",
  # "tax_summaries/create",
]
uri = "/webhooks/orders"

[[webhooks.subscriptions]]
topics = [
  "products/update",
  "tax_summaries/create",
]
uri = "/webhooks/tax-summary"
`
  });

  const findings = (await scan(root, { target: '2027-01' })).findings.filter((item) => item.ruleId === 'UG-TAX-001');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 19);
  assert.equal(findings[0].file, 'shopify.app.production.toml');
});

test('ignores tax-like strings outside a declared Shopify app webhook subscription', async (t) => {
  const root = fixture(t, {
    'src/webhooks.js': `const topic = "tax_summaries/create";`,
    'shopify.app.toml': `[webhooks]
api_version = "2027-01"

[[webhooks.subscriptions]]
topics = ["taxes/create"]
uri = "/webhooks/taxes"

[[events.subscription]]
topic = "TaxSummary"
actions = ["update"]
uri = "/events/tax-summary"
`
  });

  assert.equal((await scan(root, { target: '2027-01' })).findings.some((item) => item.ruleId === 'UG-TAX-001'), false);
});

test('does not match a tax topic embedded in another valid TOML string', async (t) => {
  const root = fixture(t, {
    'shopify.app.toml': `[webhooks]
api_version = "2027-01"

[[webhooks.subscriptions]]
topics = ["orders/create", "not-a-topic \\\"tax_summaries/create"]
uri = "/webhooks/orders"
`
  });

  assert.equal((await scan(root, { target: '2027-01' })).findings.some((item) => item.ruleId === 'UG-TAX-001'), false);
});

test('ignores a topic-like scalar where Shopify expects an array', async (t) => {
  const root = fixture(t, {
    'shopify.app.toml': `[webhooks]
api_version = "2027-01"

[[webhooks.subscriptions]]
topics = "tax_summaries/create"
uri = "/webhooks/orders"
`
  });

  assert.equal((await scan(root, { target: '2027-01' })).findings.some((item) => item.ruleId === 'UG-TAX-001'), false);
});

test('rejects malformed Shopify app TOML without echoing its values', async (t) => {
  const root = fixture(t, {
    'shopify.app.toml': `[webhooks]
api_version = "2027-01"

[[webhooks.subscriptions]]
topics = ["tax_summaries/create"]
uri = "PRIVATE_CONFIGURATION_VALUE"
uri = "/duplicate-key"
`
  });

  await assert.rejects(scan(root, { target: '2027-01' }), (error) => {
    assert.match(error.message, /Malformed Shopify app TOML in shopify\.app\.toml/);
    assert.doesNotMatch(error.message, /PRIVATE_CONFIGURATION_VALUE/);
    return true;
  });
});
