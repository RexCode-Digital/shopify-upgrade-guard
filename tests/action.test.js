import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
test('Action metadata declares every documented output and uses node24', async () => { const metadata = await readFile(join(process.cwd(), 'action.yml'), 'utf8'); assert.match(metadata, /using: node24/); for (const output of ['outcome', 'finding-count', 'error-count', 'current-versions', 'result-json']) assert.match(metadata, new RegExp(`^  ${output}:`, 'm')); });
test('bundled Action runs without installing project dependencies', t => { const root = mkdtempSync(join(tmpdir(), 'upgrade-action-')); t.after(() => rmSync(root, { recursive: true, force: true })); const output = spawnSync(process.execPath, ['dist/index.js'], { cwd: process.cwd(), env: { ...process.env, INPUT_PATH: 'tests/fixtures/healthy', INPUT_FAIL_ON_NEW: 'false', GITHUB_OUTPUT: join(root, 'outputs') }, encoding: 'utf8' }); assert.equal(output.status, 0, output.stderr); });
