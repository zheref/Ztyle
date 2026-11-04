// Run from Codex's CUA REPL with a bound localhost tab and an fs.writeFile capture callback.
// This browser scenario reads and clicks UI only; it never saves, swaps or overwrites an outfit.
export default async function verifyOctoberCalendar(tab, capture) {
  const button = name => tab.playwright.getByRole('button', {name, exact:true});
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await button('Planner').click();
  await button('Month').click();
  let found = false;
  for(let i=0;i<120;i++) {
    const label=await tab.playwright.locator('.period-label').innerText();
    if(label==='October 2026') { found=true; break; }
    const current=new Date(label+' 1');
    assert(!Number.isNaN(current.getTime()), 'Unrecognized calendar month: '+label);
    await button(current>new Date('2026-10-01T12:00:00')?'Previous month':'Next month').click();
  }
  assert(found,'October 2026 is outside the bounded navigation range');
  const days=[['Thursday, October 29','Itachi Uchiha','itachi'],['Friday, October 30','David Martinez','david'],['Saturday, October 31','Soshiro Hoshina','soshiro']];
  let checked=0;
  for(const [date,character,slug] of days) {
    await tab.playwright.getByRole('button',{name:new RegExp('^Edit '+date+': '+character)}).click();
    for(const [variant,label] of [['warm','Warm weather'],['cold','Cold weather'],['gym','Gym session']]) {
      await button(label).click();
      for(let option=1;option<=3;option++) {
        await button(`Option ${option} ${['Original','Alternative','Signature'][option-1]}`).click();
        const image=tab.playwright.locator('.detail-art img');
        const src=await image.getAttribute('src');
        assert(src===`/art/${slug}-${variant}-${option}-anime.webp`,`${character} ${variant} ${option}: wrong image ${src}`);
        assert(await image.evaluate(img=>img.complete && img.naturalWidth>0), `${src} failed to load`);
        assert(await tab.playwright.getByRole('heading',{name:'The outfit formula',exact:true}).isVisible(),'Missing outfit formula');
        checked++;
      }
    }
    await button('Expand outfit image full screen').click();
    const full=tab.playwright.locator('.artwork-viewer img');
    assert((await full.getAttribute('src')).endsWith(`${slug}-gym-3-anime-full.webp`),'Missing full-resolution Signature guide');
    await button('Read labels').click();
    await button('Fit entire image').click();
    await button('Close full-screen image').click();
    await button('Close dialog').click();
  }
  await button('Week').click();
  await capture(await tab.screenshot({fullPage:false}));
  return {checked, dates:days.map(d=>d[0]), result:'passed'};
};
