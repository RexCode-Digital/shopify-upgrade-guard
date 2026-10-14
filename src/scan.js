import { readFile, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { discover, validateExcludePattern } from './discovery.js';
import { rules, attachFile } from './rules.js';
import { latestStable, parseVersion, targetRecord } from './versions.js';
import { applyBaseline, loadBaseline } from './baseline.js';
import { withBaseTree } from './git.js';
import { safeRead } from './safe-file.js';
import { validatePolicy } from './output.js';

export async function loadConfig(root) {
  try { const config = JSON.parse(await safeRead(root, '.upgradeguard.json')); validateConfig(config); return config; }
  catch (error) { if (error.code === 'ENOENT') return {}; throw new Error(`Invalid .upgradeguard.json: ${error instanceof SyntaxError ? 'malformed JSON' : error.message}`); }
}
function validateConfig(config) { if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Configuration must be an object.'); if (config.targetVersion !== undefined && !parseVersion(config.targetVersion)) throw new Error('targetVersion must be a quarterly YYYY-MM version.'); if (config.failOn !== undefined && !['never', 'error', 'warning', 'info'].includes(config.failOn)) throw new Error('failOn must be never, error, warning, or info.'); if (config.exclude !== undefined && (!Array.isArray(config.exclude) || config.exclude.some((pattern) => validateExcludePattern(pattern) === undefined))) throw new Error('exclude must be an array of repository-relative glob patterns.'); if (config.baseline !== undefined && (typeof config.baseline !== 'string' || config.baseline.startsWith('/') || config.baseline.includes('..'))) throw new Error('baseline must be a repository-relative file path.'); }
export async function scan(root, options = {}) {
  root = resolve(root);
  const head = await analyze(root, options);
  const baseline = options.noBaseline ? { fingerprints: new Set(), entries: [], file: null } : await loadBaseline(root, options.baseline ?? head.baselinePath);
  let findings = head.findings;
  let resolvedFindings = [];
  let comparisonAvailable = false;
  if (options.baseRef) {
    const comparison = await withBaseTree(root, options.baseRef, async (baseRoot, metadata) => ({
      base: await analyze(baseRoot, { ...options, baseRef: undefined, noBaseline: true }),
      renames: metadata.renames
    }));
    const classified = classifyFindings(comparison.base.findings, head.findings, comparison.renames);
    findings = classified.findings;
    resolvedFindings = classified.resolved;
    comparisonAvailable = true;
  }
  let resultFindings = applyBaseline(findings, baseline);
  if (!comparisonAvailable) resultFindings = resultFindings.map((finding) => ({ ...finding, lifecycle: finding.baselined ? 'EXISTING' : 'UNCHANGED' }));
  const active = resultFindings.filter((finding) => !finding.baselined); const currentProblems = active.filter((finding) => finding.classification === 'current'); const upgradeBlockers = active.filter((finding) => finding.classification === 'target');
  return { schemaVersion: 1, comparisonAvailable, skipped: head.skipped, tool: 'shopify-upgrade-guard', targetVersion: head.targetVersion, failOn: head.failOn, latestStable: latestStable.version, filesScanned: head.filesScanned, inventory: head.inventory, findings: resultFindings, resolvedFindings, currentProblems, upgradeBlockers, baselinedCount: resultFindings.filter((finding) => finding.baselined).length, resolvedBaselineCount: [...baseline.fingerprints].filter((fingerprint) => !resultFindings.some((finding) => finding.fingerprint === fingerprint)).length, baselineFile: baseline.file };
}

async function analyze(root, options = {}) {
  root = resolve(root);
  if (!(await lstat(root)).isDirectory()) throw new Error('Scan root must be a regular directory');
  const config = await loadConfig(root); const targetVersion = options.target ?? config.targetVersion ?? latestStable.version; const failOn = options.failOn ?? config.failOn ?? 'never'; targetRecord(targetVersion); validatePolicy(failOn);
  const exclude = options.exclude ?? config.exclude ?? []; exclude.forEach(validateExcludePattern);
  const { files, inventory, skipped } = await discover(root, { exclude }); const context = { root, targetVersion, inventory };
  const findings = [];
  for (const file of files) for (const rule of rules) {
    const detected = rule.detect(file); const matches = detected.length ? attachFile(detected, file) : inventoryMatches(rule, inventory, file);
    for (const match of matches) { const evaluated = rule.evaluate(match, context); if (evaluated) findings.push(toFinding(rule, evaluated, targetVersion)); }
  }
  return { targetVersion, failOn, skipped, filesScanned: files.length, inventory, findings: dedupe(findings), baselinePath: options.baseline ?? config.baseline };
}

function classifyFindings(baseFindings, headFindings, renames) {
  const identity = (finding, baseSide = false) => {
    const file = baseSide ? renames.get(finding.file) ?? finding.file : finding.file;
    const snippet = String(finding.snippet ?? '').replace(/\s+/g, ' ').trim();
    return `${finding.ruleId}|${finding.surface}|${file}|${snippet}`;
  };
  const count = (items, baseSide) => {
    const counts = new Map();
    for (const item of items) { const key = identity(item, baseSide); counts.set(key, (counts.get(key) ?? 0) + 1); }
    return counts;
  };
  const baseCounts = count(baseFindings, true); const headCounts = count(headFindings, false); const seenHead = new Map();
  const findings = headFindings.map((finding) => {
    const key = identity(finding); const occurrence = seenHead.get(key) ?? 0; seenHead.set(key, occurrence + 1);
    const existing = occurrence < (baseCounts.get(key) ?? 0);
    return { ...finding, changeStatus: existing ? 'pre-existing' : 'introduced', lifecycle: existing ? 'EXISTING' : 'NEW' };
  });
  const seenBase = new Map(); const resolved = [];
  for (const finding of baseFindings) {
    const key = identity(finding, true); const occurrence = seenBase.get(key) ?? 0; seenBase.set(key, occurrence + 1);
    if (occurrence >= (headCounts.get(key) ?? 0)) resolved.push({ ...finding, changeStatus: 'resolved', lifecycle: 'RESOLVED', baselined: false });
  }
  return { findings, resolved };
}

function inventoryMatches(rule, inventory, file) { if (!rule.id.startsWith('UG-VERSION')) return []; return inventory.filter((item) => item.file === file.relativePath).map((item) => ({ file: item.file, line: item.line, column: 1, snippet: `${item.source}: ${item.version}`, version: item.version, guidance: 'Update this Shopify version to a supported stable release and test the migration.' })); }
function toFinding(rule, match, targetVersion) { return { ruleId: rule.id, severity: match.severity ?? rule.severity, title: match.title ?? rule.title, surface: rule.surface, file: match.file, line: match.line, column: match.column, snippet: match.snippet, targetVersion, currentState: rule.description, migration: match.guidance, source: rule.documentationUrl, migrationUrl: rule.migrationUrl ?? null, confidence: match.confidence ?? rule.confidence, classification: match.classification, reason: match.reason, deprecatedIn: rule.deprecatedIn ?? null, removedIn: rule.removedIn ?? null }; }
function dedupe(findings) { return [...new Map(findings.map((finding) => [`${finding.ruleId}|${finding.file}|${finding.line}|${finding.snippet}`, finding])).values()]; }
