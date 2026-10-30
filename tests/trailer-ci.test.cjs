const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('trusted trailer publisher verifies provenance and fails closed on every external boundary',()=>{
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'ztyle-trailer-ci-'));
 const root=path.resolve(__dirname,'..'),log=path.join(fixture,'calls.jsonl');
 const env={GH_TOKEN:'synthetic-test-token',GITHUB_TOKEN:'synthetic-test-token',GITHUB_REPOSITORY:'fixture/wardrobe',HEAD_SHA:'a'.repeat(40),BASE_SHA:'b'.repeat(40),PR_NUMBER:'1',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'1',GITHUB_WORKFLOW_REF:'fixture/wardrobe/.github/workflows/forbidden-commit-trailers.yml@refs/heads/main',TEST_TRAILER_LOG:log};
 try {
  for(const scenario of ['success','identity','base-mismatch','fetch-failure','digest','reader-failure','publish-failure','conclusion','no-token','invalid-env','wrong-workflow']) {
   fs.writeFileSync(log,'');
   const extra=scenario==='no-token'?{GH_TOKEN:''}:scenario==='invalid-env'?{PR_NUMBER:'../x'}:scenario==='wrong-workflow'?{GITHUB_WORKFLOW_REF:'other/repo/.github/workflows/forbidden-commit-trailers.yml@refs/heads/main'}:{};
   const run=spawnSync(process.execPath,['--import',path.join(__dirname,'fixtures/trailer-ci/hooks.mjs'),path.join(root,'scripts/consumer_trailer_ci.mts'),fixture],{encoding:'utf8',env:{...process.env,...env,...extra,TEST_TRAILER_SCENARIO:scenario},timeout:15000});
   assert.equal(run.status,scenario==='success'?0:1,scenario+': '+run.stderr);
   const calls=fs.readFileSync(log,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
   if(scenario==='success'){assert.equal(calls.at(-1).conclusion,'success');assert.match(run.stdout,/fixture trailers passed/);}
   if(['digest','reader-failure','fetch-failure','base-mismatch','no-token'].includes(scenario))assert.equal(calls.at(-1).conclusion,'failure',scenario);
   assert.ok(!run.stdout.includes('synthetic-test-token')&&!run.stderr.includes('synthetic-test-token'),'Credential in output');
  }
 } finally {fs.rmSync(fixture,{recursive:true,force:true});}
});
