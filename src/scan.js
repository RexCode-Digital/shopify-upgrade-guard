import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discover } from './discovery.js';
import { rules } from './rules.js';
import { latestStable, parseVersion } from './versions.js';
export async function loadConfig(root) { try { return JSON.parse(await readFile(join(root, '.upgradeguard.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return {}; throw new Error(`Invalid .upgradeguard.json: ${error.message}`); } }
export async function scan(root, options = {}) {
  const config = await loadConfig(root); const target = options.target ?? config.targetVersion ?? latestStable.version;
  if (!parseVersion(target)) throw new Error(`Invalid target version: ${target}. Expected YYYY-MM.`);
  const files = await discover(root); const findings = [];
  for (const file of files) for (const rule of rules) for (const match of rule.detect(file)) findings.push({ ruleId: rule.id, severity: rule.severity, title: rule.title, surface: rule.surface, file: file.relativePath, line: match.line, column: match.column, snippet: match.snippet, targetVersion: target, currentState: rule.description, migration: match.guidance, source: rule.documentationUrl, migrationUrl: rule.migrationUrl ?? null, confidence: rule.confidence });
  return { schemaVersion: 1, tool: 'shopify-upgrade-guard', targetVersion: target, latestStable: latestStable.version, filesScanned: files.length, findings };
}
