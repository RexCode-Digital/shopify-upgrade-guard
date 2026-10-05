import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const cli = join(process.cwd(), 'src/cli.js'); const fixture = join(process.cwd(), 'tests/fixtures/healthy');
function run(...args) { return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' }); }
test('CLI help and version are available', () => { assert.equal(run('--help').status, 0); assert.match(run('--version').stdout, /0\.2\.5/); });
test('CLI emits JSON and SARIF', () => { const json = run('scan', '--path', fixture, '--format', 'json'); assert.equal(JSON.parse(json.stdout).inventory[0].surface, 'admin_graphql_api'); const sarif = run('scan', '--path', fixture, '--format', 'sarif'); assert.equal(JSON.parse(sarif.stdout).version, '2.1.0'); });
test('CLI returns 2 for invalid command or target and applies fail policy', () => { assert.equal(run('nope').status, 2); assert.equal(run('scan', '--target', '2026-03').status, 2); const failing = run('scan', '--path', join(process.cwd(), 'tests/fixtures/legacy'), '--fail-on', 'error'); assert.equal(failing.status, 1); });
