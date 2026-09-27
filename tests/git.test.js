import test from 'node:test';
import assert from 'node:assert/strict';
import { changedLines } from '../src/git.js';
test('PR line classification uses a validated base ref', async () => { assert.equal(await changedLines(process.cwd(), '../not-safe'), null); const ranges = await changedLines(process.cwd(), 'HEAD'); assert.equal(ranges instanceof Map, true); });
