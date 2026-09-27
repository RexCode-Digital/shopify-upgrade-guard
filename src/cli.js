#!/usr/bin/env node
import { scan } from './scan.js';
import { formatHuman, shouldFail, toSarif } from './output.js';
import { rules } from './rules.js';
import { versionSummary } from './versions.js';
import process from 'node:process';
const args = process.argv.slice(2); const command = args[0] ?? 'scan';
const value = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
if (args.includes('--help') || command === 'help') { console.log('Usage: shopify-upgrade-guard <scan|rules|versions|explain> [options]\n\nscan options:\n  --target YYYY-MM   compare against a target version\n  --format human|json|sarif\n  --fail-on never|error|warning|info\n  --path DIR         repository to scan'); process.exit(0); }
if (args.includes('--version')) { console.log('0.1.0'); process.exit(0); }
try {
  if (command === 'rules') { for (const rule of rules) console.log(`${rule.id}\t${rule.surface}\t${rule.severity}\t${rule.title}\n  ${rule.documentationUrl}`); process.exit(0); }
  if (command === 'versions') { for (const item of versionSummary()) console.log(`${item.version} ${item.status} — accessible until ${item.accessibleUntil}`); process.exit(0); }
  if (command === 'explain') { const rule = rules.find((item) => item.id === args[1]); if (!rule) throw new Error(`Unknown rule: ${args[1]}`); console.log(`${rule.id}: ${rule.title}\n\n${rule.description}\n\nSource: ${rule.documentationUrl}${rule.migrationUrl ? `\nMigration: ${rule.migrationUrl}` : ''}`); process.exit(0); }
  if (command !== 'scan') throw new Error(`Unknown command: ${command}`);
  const result = await scan(value('--path') ?? process.cwd(), { target: value('--target') }); const format = value('--format') ?? 'human';
  console.log(format === 'json' ? JSON.stringify(result, null, 2) : format === 'sarif' ? JSON.stringify(toSarif(result), null, 2) : formatHuman(result));
  process.exitCode = shouldFail(result, value('--fail-on') ?? 'never') ? 1 : 0;
} catch (error) { console.error(`shopify-upgrade-guard: ${error.message}`); process.exitCode = 2; }
