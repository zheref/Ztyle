// Measurement/extraction only. Browser scenarios run separately through Codex CUA.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCoverageMap}=require('istanbul-lib-coverage');
const {createContext}=require('istanbul-lib-report');
const reports=require('istanbul-reports');
const manifest=JSON.parse(fs.readFileSync('.nen/browser/build.json','utf8'));
const run=JSON.parse(fs.readFileSync('.nen/browser/run.json','utf8'));
if(run.buildId!==manifest.builtAt || run.result!=='passed' || !run.cases?.length) throw Error('Missing or stale successful browser scenario result');
const files=fs.readdirSync('.nen/browser').filter(p=>/^capture-.*\.json$/.test(p));
if(!files.length) throw Error('No browser coverage capture; run the CUA scenario first.');
for(const [file,hash] of Object.entries(manifest.sources)) {
  if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==hash) throw Error('Stale browser capture: '+file);
}
const map=createCoverageMap({});
for(const file of files) {
 const captured=JSON.parse(fs.readFileSync(path.join('.nen/browser',file),'utf8'));
 if(JSON.stringify(captured.manifest)!==JSON.stringify(manifest)) throw Error('Stale browser capture manifest');
 map.merge(captured.coverage);
}
for(const relative of Object.keys(manifest.sources)) {
  const full=path.resolve(relative);
  if(!map.files().includes(full)) throw Error('Uninstrumented browser source: '+relative);
}
const context=createContext({dir:'.nen/browser/report',coverageMap:map});
reports.create('lcovonly').execute(context);
reports.create('text').execute(context);
fs.writeFileSync('.nen/browser/report/summary.json',JSON.stringify(map.getCoverageSummary().toJSON(),null,2));

const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
fs.writeFileSync('.nen/browser/report/junit.xml',`<?xml version="1.0"?><testsuite name="CUA browser scenarios" tests="${run.cases.length}" failures="0">${run.cases.map(name=>`<testcase name="${xml(name)}"/>`).join('')}</testsuite>`);
