import test from 'node:test';
import assert from 'node:assert/strict';
import { formatHuman, shouldFail, toSarif } from '../src/output.js';
const result = { targetVersion: '2026-10', filesScanned: 1, baselinedCount: 0, findings: [{ ruleId: 'UG-X', severity: 'warning', title: 'Example', surface: 'checkout_ui_extension', file: 'x.ts', line: 4, column: 1, snippet: 'x', targetVersion: '2026-10', currentState: 'state', migration: 'fix', source: 'https://shopify.dev/x', confidence: 'high', classification: 'target', reason: 'reason', baselined: false }], currentProblems: [], upgradeBlockers: [] };
test('human output separates target blockers and policy thresholds', () => { assert.match(formatHuman(result), /Upgrade blockers/); assert.equal(shouldFail(result, 'warning'), true); assert.equal(shouldFail(result, 'error'), false); assert.equal(shouldFail(result, 'never'), false); });
test('SARIF declares rule metadata and locations', () => { const sarif = toSarif(result); assert.equal(sarif.runs[0].tool.driver.rules[0].id, 'UG-X'); assert.equal(sarif.runs[0].results[0].ruleIndex, 0); assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.region.startLine, 4); });
