const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('../src/domain/planner.cjs');
const catalog = require('../src/domain/catalog.json');
const additions = require('../src/domain/calendar-additions.json');
test('October 29–31 preserve the requested characters across all goals and options', () => {
  const expected=['Itachi Uchiha','David Martinez','Soshiro Hoshina'];
  additions.forEach((row,i)=>{
    assert.ok(row.name.startsWith(expected[i]));
    assert.equal(p.rotationForDate(row.date).rotationId,row.rotationId);
    for(const goal of ['warm','cold','gym']) {
      const group=catalog.filter(l=>l.rotationId===row.rotationId && l.variant===goal);
      assert.deepEqual(group.map(l=>l.option),[1,2,3]);
      assert.equal(new Set(group.map(l=>JSON.stringify(l.pieces))).size,3);
      for(const pref of ['original','alternative','signature','mix']) {
        const plan=p.suggestWeek([row.date],catalog,[],goal,22,{},pref);
        assert.equal(catalog.find(l=>l.id===plan[row.date]).character,expected[i]);
      }
    }
  });
  assert.equal(p.rotationForDate('2026-11-29'),undefined);
  assert.equal(p.rotationForDate('2026-10-22').name,'Kirito (SAO)');
});
test('new artwork jobs retain solid colors, compact proportions and spiky warm/gym hair',()=>{
  const jobs=require('../reference/october-additions-artwork-jobs.json').jobs;
  assert.equal(jobs.length,27);
  for(const j of jobs) {
    assert.match(j.prompt,/172 cm/);
    assert.match(j.prompt,/ONE PLAIN SOLID COLOR/);
    if(j.variant!=='cold') assert.match(j.prompt,/UPRIGHT SPIKY BLACK HAIR/);
    if(j.option===3) assert.match(j.prompt,/BRANDING: SMALL TONAL MARKS ONLY/);
  }
});
