// In-process subprocess dispatcher: no OS shims, network or real credentials.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function spawnSync(exe,args,options={}) {
 const scenario=process.env.TEST_TRAILER_SCENARIO;
 const result={status:0,stdout:'',stderr:''};
 if(exe!=='gh' && (options.env?.GH_TOKEN || options.env?.GITHUB_TOKEN))throw Error('Credential leaked to data reader');
 if(exe==='gh') {
  const body=JSON.parse(options.input);
  if(scenario==='publish-failure' && args.includes('PATCH'))return {...result,status:1};
  const out={id:7,name:body.name||'forbidden-commit-trailers',head_sha:process.env.HEAD_SHA,app:{slug:'github-actions'},external_id:process.env.GITHUB_WORKFLOW_REF+':1:1',details_url:'https://github.com/fixture/wardrobe/actions/runs/1/attempts/1',status:body.status,conclusion:body.conclusion};
  if(scenario==='identity')out.app.slug='untrusted';
  if(scenario==='conclusion' && args.includes('PATCH'))out.conclusion='neutral';
  fs.appendFileSync(process.env.TEST_TRAILER_LOG,JSON.stringify(body)+'\n');
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
  result.stdout='fixture trailers passed\n';
 } else throw Error('Unexpected fixture executable: '+exe);
 return result;
}
