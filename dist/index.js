import * as fs from 'node:fs';
import process from 'node:process';
import { scan } from '../src/scan.js';
import { formatHuman, shouldFail } from '../src/output.js';
const input = (name) => process.env[`INPUT_${name.toUpperCase().replaceAll('-', '_')}`] || '';
const setOutput = (name, value) => { const delimiter = `ghadelimiter_${Date.now()}`; fs.appendFileSync(process.env.GITHUB_OUTPUT || '/dev/null', `${name}<<${delimiter}\n${value}\n${delimiter}\n`); };
const target = input('target') || undefined; const threshold = input('fail-on') || 'never'; const root = input('path') || process.env.GITHUB_WORKSPACE || process.cwd();
try {
  const result = await scan(root, { target });
  const json = JSON.stringify(result);
  setOutput('outcome', shouldFail(result, threshold) ? 'failure' : 'success'); setOutput('finding-count', String(result.findings.length));
  setOutput('error-count', String(result.findings.filter((item) => item.severity === 'error').length)); setOutput('current-versions', JSON.stringify([...new Set(result.findings.map((item) => item.snippet).filter(Boolean))])); setOutput('result-json', json);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Shopify Upgrade Guard\n\n${formatHuman(result)}\n`);
  for (const finding of result.findings) if (finding.file && finding.line) console.error(`::warning file=${finding.file},line=${finding.line},col=${finding.column}::${finding.title}`);
  if (shouldFail(result, threshold)) { console.error(`::error::Upgrade findings exceeded --fail-on ${threshold}`); process.exitCode = 1; }
} catch (error) { console.error(`::error::${error.message}`); process.exitCode = 2; }
