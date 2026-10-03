import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { safeRead, safePath } from './safe-file.js';

export const BASELINE_FILE = '.upgradeguard-baseline.json';
export function fingerprint(finding) { return createHash('sha256').update(`${finding.ruleId}|${finding.surface}|${finding.file}|${finding.snippet.replace(/\s+/g, ' ').trim()}`).digest('hex').slice(0, 16); }
export async function loadBaseline(root, file = BASELINE_FILE) {
  try { const parsed = JSON.parse(await safeRead(root, file)); if (!Array.isArray(parsed.findings) || parsed.findings.some((item) => typeof item.fingerprint !== 'string')) throw new Error('findings must be an array of fingerprinted findings'); return { fingerprints: new Set(parsed.findings.map((item) => item.fingerprint)), entries: parsed.findings, file }; }
  catch (error) { if (error.code === 'ENOENT') return { fingerprints: new Set(), entries: [], file }; throw new Error(`Invalid ${file}: ${error instanceof SyntaxError ? 'malformed JSON' : error.message}`); }
}
export async function writeBaseline(root, findings, file = BASELINE_FILE) { const payload = { schemaVersion: 1, generatedAt: new Date().toISOString(), findings: findings.map((finding) => ({ fingerprint: fingerprint(finding), ruleId: finding.ruleId, surface: finding.surface, file: finding.file })).sort((a, b) => a.fingerprint.localeCompare(b.fingerprint)) }; await writeFile(await safePath(root, file, true), `${JSON.stringify(payload, null, 2)}\n`, 'utf8'); return payload; }
export function applyBaseline(findings, baseline) { return findings.map((finding) => ({ ...finding, fingerprint: fingerprint(finding), baselined: baseline.fingerprints.has(fingerprint(finding)) })); }
