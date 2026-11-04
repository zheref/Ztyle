const test=require('node:test'),assert=require('node:assert/strict');
const hooks=require('../gatsby-node.js');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('normal builds omit instrumentation and diagnostic entry; explicit browser builds include only requested React sources',()=>{
  const old=process.env.ZTYLE_BROWSER_COVERAGE;
  const before=process.cwd(),fixture=fs.mkdtempSync(path.join(os.tmpdir(),'ztyle-coverage-config-'));
  fs.mkdirSync(path.join(fixture,'.nen/browser'),{recursive:true});
  fs.writeFileSync(path.join(fixture,'.nen/browser/build.json'),JSON.stringify({builtAt:'test-build',sources:{}}));
  process.chdir(fixture);
  const plugins=[],configs=[];
  const args={actions:{setBabelPlugin:p=>plugins.push(p),setWebpackConfig:c=>configs.push(c)},getConfig:()=>({entry:{app:'original-app',other:'preserved'}}),stage:'build-javascript'};
  try {
    delete process.env.ZTYLE_BROWSER_COVERAGE;
    hooks.onCreateBabelConfig(args);hooks.onCreateWebpackConfig(args);
    assert.equal(plugins.length,0);assert.equal(configs.length,0);
    process.env.ZTYLE_BROWSER_COVERAGE='1';
    hooks.onCreateBabelConfig(args);
    hooks.onCreateWebpackConfig({...args,stage:'build-html'});
    assert.equal(configs.length,0);
    hooks.onCreateWebpackConfig(args);
    assert.deepEqual(plugins[0].options.include,['src/pages/index.js','src/components/PlannerCalendar.js']);
    assert.ok(configs[0].plugins[0].options.banner.includes('Capture browser coverage'));
    assert.ok(configs[0].plugins[0].options.banner.includes('test-build'));
    assert.equal(configs[0].entry,undefined);
  } finally {process.chdir(before);fs.rmSync(fixture,{recursive:true,force:true});if(old===undefined)delete process.env.ZTYLE_BROWSER_COVERAGE;else process.env.ZTYLE_BROWSER_COVERAGE=old;}
});
