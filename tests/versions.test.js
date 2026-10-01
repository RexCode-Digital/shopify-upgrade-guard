import test from 'node:test';
import assert from 'node:assert/strict';
import { becomesUnsupportedBefore, compareVersions, isAtOrAfter, parseVersion, statusFor, targetRecord } from '../src/versions.js';

test('accepts only quarterly Shopify versions', () => {
  for (const value of ['2025-01', '2026-04', '2026-07', '2026-10']) assert.equal(parseVersion(value), value);
  for (const value of ['2026-00', '2026-03', '2026-11', 'v2026-07', 'latest']) assert.equal(parseVersion(value), null);
});
test('compares quarterly versions centrally', () => {
  assert.equal(compareVersions('2025-10', '2026-01'), -1);
  assert.equal(compareVersions('2026-01', '2026-04'), -1);
  assert.equal(compareVersions('2026-10', '2026-07'), 1);
  assert.equal(isAtOrAfter('2026-07', '2026-07'), true);
  assert.throws(() => compareVersions('2026-03', '2026-04'), /invalid Shopify versions/);
});
test('distinguishes stable, release candidate, unsupported, and future versions', () => {
  assert.equal(statusFor('2025-07'), 'unsupported');
  assert.equal(statusFor('2026-10'), 'latest-stable');
  assert.equal(statusFor('2027-01'), 'unknown/future');
  assert.equal(targetRecord('2027-01').status, 'unknown/future');
  assert.throws(() => targetRecord('2026-03'), /quarterly/);
});
test('calculates support horizon against target', () => {
  assert.equal(becomesUnsupportedBefore('2025-10', '2026-10'), true);
  assert.equal(becomesUnsupportedBefore('2026-01', '2026-10'), false);
});
