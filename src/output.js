const order = { error: 0, warning: 1, info: 2 };
export function activeFindings(result) { return result.findings.filter((finding) => !finding.baselined); }
export function formatHuman(result) {
  const active = activeFindings(result); const lines = ['Shopify Upgrade Guard', '', `Target version: ${result.targetVersion}`, `Files scanned: ${result.filesScanned}`, ''];
  lines.push('Current repository');
  lines.push(...sectionLines(result.currentProblems.filter((finding) => !finding.baselined), 'Current debt'));
  lines.push('', 'Upgrade blockers');
  lines.push(...sectionLines(result.upgradeBlockers.filter((finding) => !finding.baselined), 'Target migration')); 
  const introduced = active.filter((finding) => finding.changeStatus === 'introduced'); const existing = active.filter((finding) => finding.changeStatus === 'pre-existing');
  if (introduced.length || existing.length) lines.push('', `Introduced by this PR: ${introduced.length}`, `Pre-existing: ${existing.length}`);
  if (!active.length) lines.push('No upgrade risks found.', '', 'Result: scan passed'); else lines.push('', `${active.length} active risk${active.length === 1 ? '' : 's'} found`, `Baselined: ${result.baselinedCount}`, '', 'Result: migration recommended');
  return lines.join('\n');
}
function sectionLines(findings, fallback) { if (!findings.length) return [`No ${fallback.toLowerCase()}.`]; const lines = []; for (const finding of [...findings].sort((a, b) => order[a.severity] - order[b.severity])) lines.push(`${finding.severity.toUpperCase()}  ${finding.ruleId}`, finding.title, `  ${finding.file}:${finding.line}`, `  ${finding.reason ?? finding.currentState}`, `  Migration: ${finding.migration}`, `  Source: ${finding.source}`, ''); return lines; }
export function validatePolicy(threshold) { if (!['never','error','warning','info'].includes(threshold)) throw new Error('fail-on must be never, error, warning, or info'); }
export function shouldFail(result, threshold = 'never', newOnly = false) { validatePolicy(threshold); if (newOnly && !result.comparisonAvailable) throw new Error('fail-on-new requires an available Git base comparison; use --base-ref or a pull request checkout with full history'); if (threshold === 'never') return false; return activeFindings(result).filter((finding) => !newOnly || finding.lifecycle === 'NEW').some((finding) => threshold === 'info' || (threshold === 'warning' && finding.severity !== 'info') || (threshold === 'error' && finding.severity === 'error')); }
export function toSarif(result) {
  const ruleMap = new Map(); for (const finding of activeFindings(result)) if (!ruleMap.has(finding.ruleId)) ruleMap.set(finding.ruleId, { id: finding.ruleId, shortDescription: { text: finding.title }, helpUri: finding.source, properties: { severity: finding.severity, confidence: finding.confidence } });
  const rules = [...ruleMap.values()]; return { version: '2.1.0', $schema: 'https://json.schemastore.org/sarif-2.1.0.json', runs: [{ tool: { driver: { name: 'Shopify Upgrade Guard', informationUri: 'https://github.com/RexCode-Digital/shopify-upgrade-guard', rules } }, results: activeFindings(result).map((finding) => ({ ruleId: finding.ruleId, ruleIndex: rules.findIndex((rule) => rule.id === finding.ruleId), level: finding.severity === 'error' ? 'error' : finding.severity === 'warning' ? 'warning' : 'note', message: { text: `${finding.title}. ${finding.reason ?? finding.migration}` }, partialFingerprints: { primaryLocationLineHash: finding.fingerprint }, locations: [{ physicalLocation: { artifactLocation: { uri: finding.file.replaceAll('\\', '/').split('/').map(encodeURIComponent).join('/') }, region: { startLine: finding.line, startColumn: finding.column } } }] })) }] }; }
