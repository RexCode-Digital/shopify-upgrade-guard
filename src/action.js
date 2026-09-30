import * as fs from 'node:fs';
import process from 'node:process';
import { scan } from './scan.js';
import { formatHuman, shouldFail } from './output.js';
const input = (name) => process.env[`INPUT_${name.toUpperCase().replaceAll('-', '_')}`] || '';
const setOutput = (name, value) => { const delimiter = `ghadelimiter_${Date.now()}`; fs.appendFileSync(process.env.GITHUB_OUTPUT || '/dev/null', `${name}<<${delimiter}\n${value}\n${delimiter}\n`); };
const target = input('target') || undefined; const threshold = input('fail-on') || 'never'; const failOnNew = input('fail-on-new') === 'true'; const root = input('path') || process.env.GITHUB_WORKSPACE || process.cwd();
try {
  const result = await scan(root, { target, failOn: threshold, baseRef: process.env.GITHUB_BASE_REF || undefined }); const json = JSON.stringify(result); const active = result.findings.filter((finding) => !finding.baselined);
  setOutput('outcome', shouldFail(result, threshold, failOnNew) ? 'failure' : 'success'); setOutput('finding-count', String(active.length)); setOutput('new-finding-count', String(active.filter((item) => item.lifecycle === 'NEW').length)); setOutput('error-count', String(active.filter((item) => item.severity === 'error').length)); setOutput('current-versions', JSON.stringify(result.inventory)); setOutput('result-json', json);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Shopify Upgrade Guard\n\n${formatHuman(result)}\n`);
  for (const finding of active) if (finding.file && finding.line) console.error(`::warning file=${finding.file},line=${finding.line},col=${finding.column}::${finding.title}`);
  if (shouldFail(result, threshold, failOnNew)) { console.error(`::error::Upgrade findings exceeded --fail-on ${threshold}${failOnNew ? ' for NEW findings' : ''}`); process.exitCode = 1; }
} catch (error) { console.error(`::error::${error.message}`); process.exitCode = 2; }
