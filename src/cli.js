#!/usr/bin/env node
import { scan } from './scan.js';
import { formatHuman, shouldFail, toSarif } from './output.js';
import { rules } from './rules.js';
import { versionSummary } from './versions.js';
import { writeBaseline } from './baseline.js';
import packageJson from '../package.json' with { type: 'json' };
import process from 'node:process';
const args = process.argv.slice(2); const command = args[0] ?? 'scan';
const value = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
if (args.includes('--help') || command === 'help') { console.log('Usage: shopify-upgrade-guard <scan|baseline|rules|versions|explain> [options]\n\nscan options:\n  --target YYYY-MM   compare against a target version\n  --format human|json|sarif\n  --fail-on never|error|warning|info\n  --fail-on-new      apply threshold only to NEW findings\n  --base-ref REF     classify findings against a Git base ref\n  --exclude GLOB     ignore a repository-relative path pattern\n  --path DIR         repository to scan\n\nbaseline create|check writes or evaluates .upgradeguard-baseline.json'); process.exit(0); }
if (args.includes('--version')) { console.log(packageJson.version); process.exit(0); }
try {
  if (command === 'rules') { for (const rule of rules) console.log(`${rule.id}\t${rule.surface}\t${rule.severity}\t${rule.title}\n  ${rule.documentationUrl}`); process.exit(0); }
  if (command === 'versions') { for (const item of versionSummary()) console.log(`${item.version} ${item.status} — accessible until ${item.accessibleUntil}`); process.exit(0); }
  if (command === 'explain') { const rule = rules.find((item) => item.id === args[1]); if (!rule) throw new Error(`Unknown rule: ${args[1]}`); console.log(`${rule.id}: ${rule.title}\n\n${rule.description}\n\nSource: ${rule.documentationUrl}${rule.migrationUrl ? `\nMigration: ${rule.migrationUrl}` : ''}`); process.exit(0); }
  if (command === 'baseline') { const root = value('--path') ?? process.cwd(); const result = await scan(root, { target: value('--target'), noBaseline: true }); if ((args[1] ?? 'create') === 'check') { console.log(formatHuman(result)); process.exitCode = shouldFail(result, value('--fail-on') ?? 'never', args.includes('--fail-on-new')) ? 1 : 0; } else { const payload = await writeBaseline(root, result.findings); console.log(`Wrote ${payload.findings.length} findings to .upgradeguard-baseline.json`); process.exitCode = 0; } process.exit(process.exitCode ?? 0); }
  if (command !== 'scan') throw new Error(`Unknown command: ${command}`);
  const root = value('--path') ?? process.cwd(); const excludes = args.flatMap((arg, index) => arg === '--exclude' ? [args[index + 1]] : []).filter(Boolean); const result = await scan(root, { target: value('--target'), failOn: value('--fail-on'), baseRef: value('--base-ref'), exclude: excludes.length ? excludes : undefined }); const format = value('--format') ?? 'human';
  console.log(format === 'json' ? JSON.stringify(result, null, 2) : format === 'sarif' ? JSON.stringify(toSarif(result), null, 2) : formatHuman(result));
  process.exitCode = shouldFail(result, result.failOn, args.includes('--fail-on-new')) ? 1 : 0;
} catch (error) { console.error(`shopify-upgrade-guard: ${error.message}`); process.exitCode = 2; }
