import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const bundle=fs.readFileSync('dist/index.js');
const licenses=fs.readFileSync('dist/licenses.txt');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const build=spawnSync(npm,['run','build:action'],{stdio:'inherit',shell:process.platform==='win32'});assert.equal(build.status,0);assert.deepEqual(fs.readFileSync('dist/index.js'),bundle,'Committed Action bundle is stale');
assert.deepEqual(fs.readFileSync('dist/licenses.txt'),licenses,'Committed Action licence inventory is stale');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'guard-action-'));
try {
 fs.writeFileSync(path.join(root,'shopify.app.toml'),'application_url="https://example.test"\n[access_scopes]\nscopes=""\n');
 fs.writeFileSync(path.join(root,'package.json'),'{}');fs.writeFileSync(path.join(root,'index.'+("dist/index.js".endsWith('.cjs')?'cjs':'mjs')),bundle);
 const script=path.join(root,'index.'+("dist/index.js".endsWith('.cjs')?'cjs':'mjs'));
 const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',env:{...process.env,INPUT_PATH:root,INPUT_FAIL_ON:'never',INPUT_FORMAT:'json',GITHUB_OUTPUT:path.join(root,'outputs'),RUNNER_TEMP:root}});assert.equal(result.status,0,result.stderr);assert.match(fs.readFileSync(path.join(root,'outputs'),'utf8'),/outcome/);
 console.log('Standalone bundled Action passed without source or dependencies');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
