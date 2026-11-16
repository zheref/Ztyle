// In-process subprocess dispatcher: no OS shims, network or real credentials.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function spawnSync(exe,args,options={}) {
 const scenario=process.env.TEST_TRAILER_SCENARIO;
 const result={status:0,stdout:'',stderr:''};
 if(exe!=='gh' && (options.env?.GH_TOKEN || options.env?.GITHUB_TOKEN))throw Error('Credential leaked to data reader');
 if(exe==='gh') {
  const body=JSON.parse(options.input);
  const patch=args.includes('PATCH');
  if(scenario==='publish-failure' && patch)return {...result,status:1};
  const id=7;
  // The default answer is what GitHub really sends for a check made with an Actions token: it does
  // not keep the requested details_url and returns the check's own page instead.
  const out={id,name:body.name||'forbidden-commit-trailers',head_sha:process.env.HEAD_SHA,app:{slug:'github-actions'},external_id:process.env.GITHUB_WORKFLOW_REF+':1:1',details_url:'https://github.com/fixture/wardrobe/runs/'+id,status:body.status,conclusion:body.conclusion};
  // The requested run URL echoed back: accepted for as long as the publisher still accepts it.
  if(scenario==='echoed-details')out.details_url='https://github.com/fixture/wardrobe/actions/runs/1/attempts/1';
  // Near misses of the rewrite must still be refused.
  if(scenario==='foreign-check-details')out.details_url='https://github.com/fixture/wardrobe/runs/'+(id+1);
  if(scenario==='foreign-repo-details')out.details_url='https://github.com/other/wardrobe/runs/'+id;
  if(scenario==='trailing-slash-details')out.details_url+='/';
  if(scenario==='identity')out.app.slug='untrusted';
  if(scenario==='bad-id' && !patch)out.id=String(id);
  if(scenario==='patch-id' && patch)out.id=id+1;
  if(scenario==='conclusion' && patch)out.conclusion='neutral';
  fs.appendFileSync(process.env.TEST_TRAILER_LOG,JSON.stringify({args,body})+'\n');
  result.stdout=JSON.stringify(out);
 } else if(exe==='git') {
  if(args.includes('fetch') && scenario==='fetch-failure')return {...result,status:1};
  if(args.includes('rev-parse'))result.stdout=(scenario==='base-mismatch'?'0'.repeat(40):args[1].endsWith('.base')?process.env.BASE_SHA:process.env.HEAD_SHA)+'\n';
  if(args.includes('show'))result.stdout='{"commits":{"forbiddenTrailers":["Co-Authored-By"]}}';
 } else if(exe==='curl') {
  fs.writeFileSync(args[args.indexOf('-o')+1],scenario==='digest'?'unverified helper':fs.readFileSync(fileURLToPath(new URL('./reader.sh',import.meta.url))));
 } else if(exe==='sh') {
  if(!args.includes('--forbidden-only')||!args.includes('--forbid-trailers-from'))throw Error('Unsafe reader invocation');
  if(scenario==='reader-failure')return {...result,status:1};
  // The reader prints one line per failing commit, led by its short SHA; only those SHAs may reach the check.
  if(scenario==='policy-violation')return {...result,status:1,stdout:'abc1234  author=Mallory <m@example.test>  committer=Mallory <m@example.test>  (forbidden trailer) [mention](https://example.test) @someone\ndef5678  author=Mallory <m@example.test>  committer=Mallory <m@example.test>  (forbidden trailer)\n'};
  result.stdout='fixture trailers passed\n';
 } else throw Error('Unexpected fixture executable: '+exe);
 return result;
}
