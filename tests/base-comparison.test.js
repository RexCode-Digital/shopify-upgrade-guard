import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, renameSync, existsSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { scan } from '../src/scan.js';
import { shouldFail, formatHuman } from '../src/output.js';
import { runGit } from '../src/git.js';

async function repository(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'upgrade-base-comparison-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  await runGit(root, ['init', '-b', 'main']);
  await runGit(root, ['config', 'user.name', 'Upgrade Guard Tests']);
  await runGit(root, ['config', 'user.email', 'upgrade-guard-tests@example.invalid']);
  for (const [name, content] of Object.entries(files)) {
    const file = join(root, name); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content);
  }
  await commit(root, 'base');
  await runGit(root, ['branch', 'base']);
  return root;
}

async function commit(root, message) {
  await runGit(root, ['add', '--all']);
  await runGit(root, ['commit', '-m', message]);
}

test('base and head scans classify a configuration-only target change as new', async (t) => {
  const root = await repository(t, {
    '.upgradeguard.json': '{"targetVersion":"2026-10"}\n',
    'market.graphql': 'mutation Update { marketCurrencySettingsUpdate(marketId: "1", input: {}) { userErrors { message } } }\n'
  });
  writeFileSync(join(root, '.upgradeguard.json'), '{"targetVersion":"2027-01"}\n');
  await commit(root, 'raise target API version');
  const result = await scan(root, { baseRef: 'base' });
  const finding = result.findings.find((item) => item.ruleId === 'UG-ADMIN-006');
  assert.equal(result.comparisonAvailable, true);
  assert.equal(finding?.lifecycle, 'NEW');
  assert.equal(result.resolvedFindings.length, 0);
  assert.equal(shouldFail(result, 'error', true), true);
});

test('renamed findings remain pre-existing when their source is unchanged', async (t) => {
  const root = await repository(t, {
    '.upgradeguard.json': '{"targetVersion":"2027-01"}\n',
    'admin.graphql': 'mutation Update { marketCurrencySettingsUpdate(marketId: "1", input: {}) { userErrors { message } } }\n'
  });
  mkdirSync(join(root, 'queries'));
  renameSync(join(root, 'admin.graphql'), join(root, 'queries', 'markets.graphql'));
  await commit(root, 'move market query');
  const result = await scan(root, { baseRef: 'base' });
  const finding = result.findings.find((item) => item.ruleId === 'UG-ADMIN-006');
  assert.equal(finding?.lifecycle, 'EXISTING');
  assert.equal(finding?.changeStatus, 'pre-existing');
  assert.equal(result.resolvedFindings.length, 0);
});

test('resolved findings are reported from the base tree', async (t) => {
  const root = await repository(t, {
    '.upgradeguard.json': '{"targetVersion":"2027-01"}\n',
    'admin.graphql': 'mutation Update { marketCurrencySettingsUpdate(marketId: "1", input: {}) { userErrors { message } } }\n'
  });
  writeFileSync(join(root, 'admin.graphql'), 'query { shop { name } }\n');
  await commit(root, 'remove obsolete market mutation');
  const result = await scan(root, { baseRef: 'base' });
  assert.equal(result.findings.length, 0);
  assert.equal(result.resolvedFindings.length, 1);
  assert.equal(result.resolvedFindings[0].lifecycle, 'RESOLVED');
  assert.match(formatHuman(result), /Resolved by this PR: 1/);
});

test('base checkout does not run repository filters or hooks', async (t) => {
  const root = await repository(t, {
    '.gitattributes': '*.graphql filter=untrusted\n',
    'admin.graphql': 'query { shop { name } }\n'
  });
  const marker = join(root, 'checkout-command-ran');
  const markerToken = Buffer.from(marker).toString('base64');
  const command = `"${process.execPath}" -e "require('node:fs').writeFileSync(Buffer.from('${markerToken}','base64').toString(),'ran')"`;
  await runGit(root, ['config', 'filter.untrusted.smudge', command]);
  const hook = join(root, '.git', 'hooks', 'post-checkout');
  writeFileSync(hook, `#!/bin/sh\n${command}\n`); chmodSync(hook, 0o755);
  await scan(root, { baseRef: 'base' });
  assert.equal(existsSync(marker), false);
});
