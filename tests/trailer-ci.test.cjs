const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
// One subtest per scenario, so a failing case reports by name and never hides the rest.
// exit: the publisher's exit code. calls: how many GitHub writes it made (1 = the create only,
// 2 = create then complete). end: the conclusion of the last write. refused: its identity refusal is on stderr.
const RUN_URL='https://github.com/fixture/wardrobe/actions/runs/1/attempts/1';
const IDENTITY=/does not identify this producer, workflow run and exact PR head/;
const scenarios=[
 ['success','check response carries the check page GitHub really returns: accepted, completes success',{exit:0,calls:2,end:'success'}],
 ['echoed-details','check response echoes the requested run URL: accepted, completes success',{exit:0,calls:2,end:'success'}],
 ['foreign-check-details','check response names another check: refused, completes failure',{exit:1,calls:2,end:'failure',refused:true}],
 ['foreign-repo-details','check response names another repository: refused, completes failure',{exit:1,calls:2,end:'failure',refused:true}],
 ['trailing-slash-details','check response address has a trailing slash: refused, completes failure',{exit:1,calls:2,end:'failure',refused:true}],
 ['identity','check response comes from another app: refused, the created check still completes failure',{exit:1,calls:2,end:'failure',refused:true}],
 ['bad-id','create answers an unusable check id: refused, nothing is completed',{exit:1,calls:1,refused:true}],
 ['patch-id','complete answers a different check id: refused after the write, exits non-zero',{exit:1,calls:2,refused:true}],
 ['policy-violation','reader reports failing commits: completes failure naming only their short SHAs',{exit:1,calls:2,end:'failure'}],
 ['base-mismatch','base ref does not match the event: completes failure',{exit:1,calls:2,end:'failure'}],
 ['fetch-failure','pull request objects cannot be fetched: completes failure',{exit:1,calls:2,end:'failure'}],
 ['digest','published reader fails its digest: completes failure',{exit:1,calls:2,end:'failure'}],
 ['reader-failure','reader exits non-zero with no findings: completes failure',{exit:1,calls:2,end:'failure'}],
 ['publish-failure','completing write is rejected: exits non-zero',{exit:1}],
 ['conclusion','GitHub persists another conclusion: exits non-zero',{exit:1,calls:2}],
 ['no-token','no token for the data fetch: completes failure',{exit:1,end:'failure'}],
 ['invalid-env','malformed pull request number: refused before any write',{exit:1,calls:0}],
 ['wrong-workflow','workflow ref belongs to another repository: refused before any write',{exit:1,calls:0}],
];
test('trusted trailer publisher verifies provenance and fails closed on every external boundary',async t=>{
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'ztyle-trailer-ci-'));
 const root=path.resolve(__dirname,'..'),log=path.join(fixture,'calls.jsonl');
 const env={GH_TOKEN:'synthetic-test-token',GITHUB_TOKEN:'synthetic-test-token',GITHUB_REPOSITORY:'fixture/wardrobe',HEAD_SHA:'a'.repeat(40),BASE_SHA:'b'.repeat(40),PR_NUMBER:'1',GITHUB_RUN_ID:'1',GITHUB_RUN_ATTEMPT:'1',GITHUB_WORKFLOW_REF:'fixture/wardrobe/.github/workflows/forbidden-commit-trailers.yml@refs/heads/main',TEST_TRAILER_LOG:log};
 try {
  for(const [scenario,title,want] of scenarios) await t.test(title,()=>{
   fs.writeFileSync(log,'');
   const extra=scenario==='no-token'?{GH_TOKEN:''}:scenario==='invalid-env'?{PR_NUMBER:'../x'}:scenario==='wrong-workflow'?{GITHUB_WORKFLOW_REF:'other/repo/.github/workflows/forbidden-commit-trailers.yml@refs/heads/main'}:{};
   const run=spawnSync(process.execPath,['--import',path.join(__dirname,'fixtures/trailer-ci/hooks.mjs'),path.join(root,'scripts/consumer_trailer_ci.mts'),fixture],{encoding:'utf8',env:{...process.env,...env,...extra,TEST_TRAILER_SCENARIO:scenario},timeout:15000});
   assert.equal(run.status,want.exit,scenario+': '+run.stderr);
   const calls=fs.readFileSync(log,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
   // A scenario expected to reach GitHub must have gone through the mock: an empty log there means the
   // loader hook no longer intercepts the publisher, and every "exits 1" case would pass for no reason.
   if(want.calls!==undefined)assert.equal(calls.length,want.calls,scenario+': GitHub writes');
   if(want.end){
    const last=calls.at(-1);
    assert.equal(last.body.status,'completed',scenario);
    assert.equal(last.body.conclusion,want.end,scenario);
    assert.ok(last.args.includes('PATCH')&&last.args.includes('repos/fixture/wardrobe/check-runs/7'),scenario+': completes the check it created');
    assert.ok(calls[0].args.includes('POST')&&calls[0].args.includes('repos/fixture/wardrobe/check-runs'),scenario+': creates first');
   }
   if(want.refused)assert.match(run.stderr,IDENTITY,scenario);
   if(want.exit===0){
    assert.match(run.stdout,/fixture trailers passed/);
    assert.equal(calls.at(-1).body.output.text,undefined,'No failing-commit text on success');
   }
   if(scenario==='policy-violation'){
    const output=calls.at(-1).body.output;
    assert.equal(output.text,'Commits failing the base trailer policy: abc1234, def5678');
    assert.ok(output.summary.includes(RUN_URL),'Failure summary links the run');
    assert.ok(!JSON.stringify(output).includes('Mallory')&&!JSON.stringify(output).includes('example.test'),'Commit text reached the check');
   }
   assert.ok(!run.stdout.includes('synthetic-test-token')&&!run.stderr.includes('synthetic-test-token'),'Credential in output');
  });
 } finally {fs.rmSync(fixture,{recursive:true,force:true});}
});
