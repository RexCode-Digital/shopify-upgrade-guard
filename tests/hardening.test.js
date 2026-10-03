import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { scan } from '../src/scan.js';
import { shouldFail } from '../src/output.js';
const cli=path.resolve('src/cli.js');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'upgrade-hardening-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('ScriptTag writes are current restrictions even for earlier targets',async t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'app.js'),'scriptTagCreate; scriptTagUpdate;');const r=await scan(root,{target:'2026-04'});assert.equal(r.findings.filter(f=>f.ruleId==='UG-SCRIPT-001'&&f.classification==='current').length,2);
 fs.writeFileSync(path.join(root,'app.js'),'scriptTagDelete; scriptTags;');assert.equal((await scan(root)).findings.length,0);
 fs.writeFileSync(path.join(root,'app.js'),'fetch("/admin/api/2026-07/script_tags.json");');assert.equal((await scan(root)).findings.find(f=>f.ruleId==='UG-SCRIPT-001').severity,'warning');
});
test('documented 2027-01 root removal handles aliases and local fragments only at boundary',async t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'app.graphql'),'query {...Root}\nfragment Root on QueryRoot { alias: automaticDiscounts(first:1){nodes{__typename}} }');
 assert.ok(!(await scan(root,{target:'2026-10'})).findings.some(f=>f.ruleId==='UG-ADMIN-002'));
 const finding=(await scan(root,{target:'2027-01'})).findings.find(f=>f.ruleId==='UG-ADMIN-002');assert.ok(finding);assert.equal(finding.line,2);
 fs.writeFileSync(path.join(root,'app.graphql'),'query { shop { automaticDiscounts } }');assert.ok(!(await scan(root,{target:'2027-01'})).findings.some(f=>f.ruleId==='UG-ADMIN-002'));
 fs.writeFileSync(path.join(root,'app.js'),'const automaticDiscounts = []; // automaticDiscounts');fs.rmSync(path.join(root,'app.graphql'));assert.equal((await scan(root,{target:'2027-01'})).findings.length,0);
});
test('named configurations enter version inventory',async t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'shopify.app.production.toml'),'[webhooks]\napi_version="2026-07"');assert.equal((await scan(root)).inventory[0].surface,'shopify_app');
});
test('invalid policy, absent root and unavailable Git comparison fail explicitly',async t=>{
 const root=fixture(t);await assert.rejects(()=>scan(root,{failOn:'typo'}),/fail-on/);await assert.rejects(()=>scan(path.join(root,'missing')),/ENOENT/);await assert.rejects(()=>scan(root,{baseRef:'main'}),/git/);assert.throws(()=>shouldFail({findings:[]},'warning',true),/requires/);
 for(const args of [['--fail-on','typo'],['--format','typo'],['--path'],['--unknown']])assert.equal(spawnSync(process.execPath,[cli,'scan',...args]).status,2);
 assert.equal(spawnSync(process.execPath,[cli,'scan','--path',root,'--fail-on-new','--fail-on','warning']).status,2);
});
test('baseline check honors suppression while create refuses unknown subcommand',async t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'app.js'),'useBuyerJourneyIntercept();');assert.equal(spawnSync(process.execPath,[cli,'baseline','create','--path',root]).status,0);
 assert.equal(spawnSync(process.execPath,[cli,'baseline','check','--path',root,'--fail-on','warning']).status,0);
 assert.equal(spawnSync(process.execPath,[cli,'baseline','wrong','--path',root]).status,2);
});
test('symlink config and baseline never read external data',async t=>{
 const root=fixture(t),outside=fixture(t);const target=path.join(outside,'external.json');fs.writeFileSync(target,'{}');
 try{fs.symlinkSync(target,path.join(root,'.upgradeguard.json'));}catch(e){if(e.code==='EPERM')return t.skip('Symlink privileges unavailable');throw e;}
 await assert.rejects(()=>scan(root),/Symbolic link/);fs.rmSync(path.join(root,'.upgradeguard.json'));fs.symlinkSync(target,path.join(root,'.upgradeguard-baseline.json'));await assert.rejects(()=>scan(root),/Symbolic link/);
});

test('malformed configuration and baseline errors do not echo input values',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'upgrade-redaction-'));
 try{fs.writeFileSync(path.join(root,'.upgradeguard.json'),'{"private":"REDACTION_SENTINEL" broken}');await assert.rejects(()=>scan(root),e=>e.message.includes('malformed JSON')&&!e.message.includes('REDACTION_SENTINEL'));fs.rmSync(path.join(root,'.upgradeguard.json'));fs.writeFileSync(path.join(root,'.upgradeguard-baseline.json'),'{"private":"REDACTION_SENTINEL" broken}');await assert.rejects(()=>scan(root),e=>e.message.includes('malformed JSON')&&!e.message.includes('REDACTION_SENTINEL'));}
 finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('ordinary scans do not implicitly compare GitHub PR environment refs',async t=>{
 const root=fixture(t);const previous=process.env.GITHUB_BASE_REF;process.env.GITHUB_BASE_REF='missing-base';
 try{const result=await scan(root);assert.equal(result.comparisonAvailable,false);}
 finally{if(previous===undefined)delete process.env.GITHUB_BASE_REF;else process.env.GITHUB_BASE_REF=previous;}
});

test('GraphQL removal rules ignore unrelated identifiers and resolve literal fields/types',async t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'app.js'),'const priceRule = {}; const lastIncompleteCheckout = null; const Checkout = {}; // priceRule');
 assert.ok(!(await scan(root)).findings.some(f=>['UG-ADMIN-001','UG-CUSTOMER-001'].includes(f.ruleId)));
 fs.writeFileSync(path.join(root,'app.graphql'),'query { customer { alias: lastIncompleteCheckout { ... on Checkout { id } } } }\nfragment Warning on DraftOrderDiscountNotAppliedWarning { priceRule { id } }');
 const ids=(await scan(root)).findings.map(f=>f.ruleId);assert.ok(ids.includes('UG-ADMIN-001'));assert.ok(ids.includes('UG-CUSTOMER-001'));
});
