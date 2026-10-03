import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'guard-package-'));
const npm=process.platform==='win32'?'npm.cmd':'npm';
function run(command,args,cwd=root) { const result=spawnSync(command,args,{cwd,encoding:'utf8',shell:process.platform==='win32'&&command===npm}); assert.equal(result.status,0,result.stderr||result.stdout);return result.stdout; }
try {
 const meta=JSON.parse(fs.readFileSync('package.json','utf8'));
 const tarball=JSON.parse(run(npm,['pack','--json','--pack-destination',root],process.cwd()))[0].filename;
 fs.mkdirSync(path.join(root,'consumer'));fs.writeFileSync(path.join(root,'consumer/package.json'),'{}');
 run(npm,['install','--ignore-scripts','--no-audit','--no-fund',path.join(root,tarball)],path.join(root,'consumer'));
 const cli=path.join(root,'consumer/node_modules',meta.name,'src/cli.js');
 assert.equal(run(process.execPath,[cli,'--version']).trim(),meta.version);
 const fixture=path.join(root,'fixture');fs.mkdirSync(fixture);fs.writeFileSync(path.join(fixture,'shopify.app.toml'),'application_url="https://example.test"\n[access_scopes]\nscopes=""\n');
 const json=JSON.parse(run(process.execPath,[cli,'scan','--path',fixture,'--format','json','--fail-on','never']));assert.ok(json.findings);
 const sarif=JSON.parse(run(process.execPath,[cli,'scan','--path',fixture,'--format','sarif','--fail-on','never']));assert.equal(sarif.version,'2.1.0');
 console.log(`Clean tarball install, CLI, JSON and SARIF passed for ${meta.name}@${meta.version}`);
} finally { fs.rmSync(root,{recursive:true,force:true}); }
