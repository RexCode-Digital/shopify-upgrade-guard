const order = { error: 0, warning: 1, info: 2 };
export function formatHuman(result) {
  const lines = ['Shopify Upgrade Guard', '', `Target version: ${result.targetVersion}`, `Files scanned: ${result.filesScanned}`, ''];
  if (!result.findings.length) return lines.concat('No upgrade risks found.', '', 'Result: scan passed').join('\n');
  lines.push(`${result.findings.length} upgrade risk${result.findings.length === 1 ? '' : 's'} found`, '');
  for (const finding of [...result.findings].sort((a, b) => order[a.severity] - order[b.severity])) lines.push(`${finding.severity.toUpperCase()}  ${finding.ruleId}`, finding.title, `  ${finding.file}:${finding.line}`, `  ${finding.currentState}`, `  Migration: ${finding.migration}`, `  Source: ${finding.source}`, '');
  lines.push('Result: migration recommended'); return lines.join('\n');
}
export function shouldFail(result, threshold = 'never') { if (threshold === 'never') return false; return result.findings.some((finding) => threshold === 'info' || (threshold === 'warning' && finding.severity !== 'info') || (threshold === 'error' && finding.severity === 'error')); }
export function toSarif(result) { return { version: '2.1.0', $schema: 'https://json.schemastore.org/sarif-2.1.0.json', runs: [{ tool: { driver: { name: 'Shopify Upgrade Guard', informationUri: 'https://github.com/efegokdemir/shopify-upgrade-guard' } }, results: result.findings.map((finding) => ({ ruleId: finding.ruleId, level: finding.severity === 'error' ? 'error' : finding.severity === 'warning' ? 'warning' : 'note', message: { text: `${finding.title}. ${finding.migration}` }, locations: [{ physicalLocation: { artifactLocation: { uri: finding.file }, region: { startLine: finding.line } } }] })) }] }; }
