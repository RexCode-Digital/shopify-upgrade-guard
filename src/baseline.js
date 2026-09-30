import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const BASELINE_FILE = '.upgradeguard-baseline.json';
export function fingerprint(finding) { return createHash('sha256').update(`${finding.ruleId}|${finding.surface}|${finding.file}|${finding.snippet.replace(/\s+/g, ' ').trim()}`).digest('hex').slice(0, 16); }
export async function loadBaseline(root) {
  try { const parsed = JSON.parse(await readFile(join(root, BASELINE_FILE), 'utf8')); if (!Array.isArray(parsed.findings)) throw new Error('findings must be an array'); return { fingerprints: new Set(parsed.findings.map((item) => item.fingerprint)), entries: parsed.findings }; }
  catch (error) { if (error.code === 'ENOENT') return { fingerprints: new Set(), entries: [] }; throw new Error(`Invalid ${BASELINE_FILE}: ${error.message}`); }
}
export async function writeBaseline(root, findings) { const payload = { schemaVersion: 1, generatedAt: new Date().toISOString(), findings: findings.map((finding) => ({ fingerprint: fingerprint(finding), ruleId: finding.ruleId, surface: finding.surface, file: finding.file })).sort((a, b) => a.fingerprint.localeCompare(b.fingerprint)) }; await writeFile(join(root, BASELINE_FILE), `${JSON.stringify(payload, null, 2)}\n`, 'utf8'); return payload; }
export function applyBaseline(findings, baseline) { return findings.map((finding) => ({ ...finding, fingerprint: fingerprint(finding), baselined: baseline.fingerprints.has(fingerprint(finding)) })); }
