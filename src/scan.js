import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discover, validateExcludePattern } from './discovery.js';
import { rules, attachFile } from './rules.js';
import { latestStable, parseVersion, targetRecord } from './versions.js';
import { applyBaseline, loadBaseline } from './baseline.js';
import { changedLines } from './git.js';

export async function loadConfig(root) {
  try { const config = JSON.parse(await readFile(join(root, '.upgradeguard.json'), 'utf8')); validateConfig(config); return config; }
  catch (error) { if (error.code === 'ENOENT') return {}; throw new Error(`Invalid .upgradeguard.json: ${error.message}`); }
}
function validateConfig(config) { if (config.targetVersion !== undefined && !parseVersion(config.targetVersion)) throw new Error('targetVersion must be a quarterly YYYY-MM version.'); if (config.failOn !== undefined && !['never', 'error', 'warning', 'info'].includes(config.failOn)) throw new Error('failOn must be never, error, warning, or info.'); if (config.exclude !== undefined && (!Array.isArray(config.exclude) || config.exclude.some((pattern) => validateExcludePattern(pattern) === undefined))) throw new Error('exclude must be an array of repository-relative glob patterns.'); if (config.baseline !== undefined && (typeof config.baseline !== 'string' || config.baseline.startsWith('/') || config.baseline.includes('..'))) throw new Error('baseline must be a repository-relative file path.'); }
export async function scan(root, options = {}) {
  const config = await loadConfig(root); const targetVersion = options.target ?? config.targetVersion ?? latestStable.version; const failOn = options.failOn ?? config.failOn ?? 'never'; targetRecord(targetVersion);
  const exclude = options.exclude ?? config.exclude ?? []; exclude.forEach(validateExcludePattern);
  const { files, inventory } = await discover(root, { exclude }); const context = { root, targetVersion, inventory };
  const findings = [];
  for (const file of files) for (const rule of rules) {
    const detected = rule.detect(file); const matches = detected.length ? attachFile(detected, file) : inventoryMatches(rule, inventory, file);
    for (const match of matches) { const evaluated = rule.evaluate(match, context); if (evaluated) findings.push(toFinding(rule, evaluated, targetVersion)); }
  }
  const baseline = options.noBaseline ? { fingerprints: new Set(), entries: [], file: null } : await loadBaseline(root, options.baseline ?? config.baseline); let resultFindings = applyBaseline(dedupe(findings), baseline);
  const baseRef = options.baseRef ?? process.env.GITHUB_BASE_REF;
  if (baseRef) { try { const ranges = await changedLines(root, baseRef); resultFindings = resultFindings.map((finding) => ({ ...finding, changeStatus: isChanged(finding, ranges) ? 'introduced' : 'pre-existing', lifecycle: isChanged(finding, ranges) ? 'NEW' : 'EXISTING' })); } catch { resultFindings = resultFindings.map((finding) => ({ ...finding, lifecycle: finding.baselined ? 'EXISTING' : 'UNCHANGED' })); } }
  else resultFindings = resultFindings.map((finding) => ({ ...finding, lifecycle: finding.baselined ? 'EXISTING' : 'UNCHANGED' }));
  const active = resultFindings.filter((finding) => !finding.baselined); const currentProblems = active.filter((finding) => finding.classification === 'current'); const upgradeBlockers = active.filter((finding) => finding.classification === 'target');
  return { schemaVersion: 1, tool: 'shopify-upgrade-guard', targetVersion, failOn, latestStable: latestStable.version, filesScanned: files.length, inventory, findings: resultFindings, currentProblems, upgradeBlockers, baselinedCount: resultFindings.filter((finding) => finding.baselined).length, resolvedBaselineCount: [...baseline.fingerprints].filter((fingerprint) => !resultFindings.some((finding) => finding.fingerprint === fingerprint)).length, baselineFile: baseline.file };
}
function inventoryMatches(rule, inventory, file) { if (!rule.id.startsWith('UG-VERSION')) return []; return inventory.filter((item) => item.file === file.relativePath).map((item) => ({ file: item.file, line: item.line, column: 1, snippet: `${item.source}: ${item.version}`, version: item.version, guidance: 'Update this Shopify version to a supported stable release and test the migration.' })); }
function toFinding(rule, match, targetVersion) { return { ruleId: rule.id, severity: rule.severity, title: rule.title, surface: rule.surface, file: match.file, line: match.line, column: match.column, snippet: match.snippet, targetVersion, currentState: rule.description, migration: match.guidance, source: rule.documentationUrl, migrationUrl: rule.migrationUrl ?? null, confidence: rule.confidence, classification: match.classification, reason: match.reason, deprecatedIn: rule.deprecatedIn ?? null, removedIn: rule.removedIn ?? null }; }
function dedupe(findings) { return [...new Map(findings.map((finding) => [`${finding.ruleId}|${finding.file}|${finding.line}|${finding.snippet}`, finding])).values()]; }
function isChanged(finding, ranges) { return Boolean(ranges?.get(finding.file)?.some((range) => finding.line >= range.start && finding.line <= range.end)); }
