// Synthetic subprocesses for the publisher integration tests: no network or real credentials.
const fs=require('node:fs'),path=require('node:path');
const exe=path.basename(process.argv[1]),args=process.argv.slice(2),scenario=process.env.TEST_TRAILER_SCENARIO;
const fail=()=>process.exit(1);
if(exe!=='gh' && (process.env.GH_TOKEN || process.env.GITHUB_TOKEN)) throw Error('Credential leaked to data reader');
if(exe==='gh') {
 const body=JSON.parse(fs.readFileSync(0,'utf8'));
 if(scenario==='publish-failure' && args.includes('PATCH')) fail();
 const out={id:7,name:body.name||'forbidden-commit-trailers',head_sha:process.env.HEAD_SHA,app:{slug:'github-actions'},external_id:process.env.GITHUB_WORKFLOW_REF+':1:1',details_url:'https://github.com/fixture/wardrobe/actions/runs/1/attempts/1',status:body.status,conclusion:body.conclusion};
 if(scenario==='identity') out.app.slug='untrusted';
 if(scenario==='conclusion' && args.includes('PATCH'))out.conclusion='neutral';
 fs.appendFileSync(process.env.TEST_TRAILER_LOG,JSON.stringify(body)+'\n');
 process.stdout.write(JSON.stringify(out));
} else if(exe==='git') {
 if(args.includes('fetch') && scenario==='fetch-failure')fail();
 if(args.includes('rev-parse')) process.stdout.write((scenario==='base-mismatch'?'0'.repeat(40):args.includes(path.join(process.argv.at(-1),'.base'))?process.env.BASE_SHA:args[1].endsWith('.base')?process.env.BASE_SHA:process.env.HEAD_SHA)+'\n');
 if(args.includes('show'))process.stdout.write('{"commits":{"forbiddenTrailers":["Co-Authored-By"]}}');
} else if(exe==='curl') {
 const target=args[args.indexOf('-o')+1];
 fs.writeFileSync(target,scenario==='digest'?'unverified helper':fs.readFileSync(path.join(__dirname,'reader.sh')));
} else if(exe==='sh') {
 if(!args.includes('--forbidden-only')||!args.includes('--forbid-trailers-from'))throw Error('Unsafe reader invocation');
 if(scenario==='reader-failure') fail();
 process.stdout.write('fixture trailers passed\n');
} else throw Error('Unexpected fixture executable');
