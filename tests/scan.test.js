import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { scan } from '../src/scan.js';
import { shouldFail } from '../src/output.js';
const fixtures = join(process.cwd(), 'tests/fixtures');
test('healthy fixture has no findings', async () => { const result = await scan(join(fixtures, 'healthy')); assert.equal(result.findings.length, 0); });
test('legacy fixture reports documented patterns with locations', async () => { const result = await scan(join(fixtures, 'legacy'), { target: '2026-10' }); assert.ok(result.findings.some((item) => item.ruleId === 'UG-CHECKOUT-001' && item.line === 2)); assert.ok(result.findings.some((item) => item.ruleId === 'UG-CHECKOUT-002')); assert.ok(result.findings.some((item) => item.ruleId === 'UG-REST-001')); assert.ok(result.findings.some((item) => item.ruleId === 'UG-VERSION-001')); assert.equal(shouldFail(result, 'error'), true); });
test('generated directories are excluded', async () => { const result = await scan(join(fixtures, 'legacy')); assert.equal(result.findings.some((item) => item.file.startsWith('dist/')), false); });
