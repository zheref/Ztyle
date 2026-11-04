const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('artwork preparation fills missing dated options and reruns without losing prior catalog entries', () => {
  const root = path.resolve(__dirname, '..');
  const catalogPath = path.join(root, 'src/domain/catalog.json');
  const generatorPath = path.join(root, 'scripts/prepare-october-additions.cjs');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const previous = catalog.filter(l => !['addition-itachi','addition-david','addition-soshiro'].includes(l.rotationId));
  const cachedCatalog = require.cache[catalogPath];
  const cachedGenerator = require.cache[generatorPath];
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'ztyle-art-preparation-'));
  const before = process.cwd();
  try {
    fs.mkdirSync(path.join(fixture, 'src/domain'), {recursive:true});
    fs.mkdirSync(path.join(fixture, 'reference'), {recursive:true});
    require.cache[catalogPath] = {id:catalogPath, filename:catalogPath, loaded:true, exports:structuredClone(previous)};
    process.chdir(fixture);
    delete require.cache[generatorPath];
    require(generatorPath);
    const generated = JSON.parse(fs.readFileSync('src/domain/catalog.json','utf8'));
    assert.deepEqual(generated.slice(0, previous.length), previous);
    assert.equal(generated.length, previous.length + 27);
    assert.equal(new Set(generated.map(l=>l.id)).size, generated.length);
    const jobs = JSON.parse(fs.readFileSync('reference/october-additions-artwork-jobs.json','utf8'));
    assert.equal(jobs.jobs.length, 27);
    assert.deepEqual([...new Set(jobs.jobs.map(j=>j.date))], ['2026-10-29','2026-10-30','2026-10-31']);
    for(const j of jobs.jobs) {
      const look = generated.find(l=>l.id===j.id);
      assert.ok(look && look.pieces.length >= 4);
      assert.equal(look.image, '');
    }
    const paths = ['src/domain/catalog.json','src/domain/calendar-additions.json','reference/october-additions-artwork-jobs.json'];
    const contents = paths.map(p=>fs.readFileSync(p,'utf8'));
    delete require.cache[generatorPath];
    require(generatorPath);
    paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'), contents[i], 'Rerun changed '+p));
  } finally {
    process.chdir(before);
    if(cachedCatalog) require.cache[catalogPath] = cachedCatalog; else delete require.cache[catalogPath];
    if(cachedGenerator) require.cache[generatorPath] = cachedGenerator; else delete require.cache[generatorPath];
    fs.rmSync(fixture,{recursive:true,force:true});
  }
});
