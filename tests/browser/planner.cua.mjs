// CUA browser tests run only against the instrumented, synthetic-data origin.
const assert=(value,message)=>{if(!value)throw Error(message);};
const button=(tab,name)=>tab.playwright.getByRole('button',{name,exact:true});
async function goToMonth(tab,label) {
 await button(tab,'Month').click();
 for(let n=0;n<120;n++){
  const current=await tab.playwright.locator('.period-label').innerText();
  if(current===label)return;
  await button(tab,new Date(current+' 1')>new Date(label+' 1')?'Previous month':'Next month').click();
 }
 throw Error('Fixture month outside bounded navigation range');
}
export async function plannerFlows(tab) {
  await button(tab,'Planner').click();
  for(const view of ['Day','Week','Month']) {
    await button(tab,view).click();
    const lower=view.toLowerCase();
    await button(tab,'Next '+lower).click();
    await button(tab,'Previous '+lower).click();
    await button(tab,'Today').click();
    await tab.playwright.locator('.planner-toolbar select').first().selectOption('gym');
    await tab.playwright.getByLabel('Automatic outfit option').selectOption('signature');
    await button(tab,'Plan '+lower).click();
    assert((await tab.playwright.locator('.toast').innerText()).includes('planned'),'Plan action did not confirm');
    await button(tab,'Dismiss notification').click();
  }
  await button(tab,'Week').click();
  const swap=tab.playwright.getByLabel(/^Swap /).first();
  const targets=await swap.locator('option').evaluateAll(options=>options.map(o=>o.value).filter(Boolean));
  assert(targets.length>0,'No available swap target');
  await swap.selectOption(targets[0]);
  assert((await tab.playwright.locator('.toast').innerText()).includes('swapped'),'Swap failed');
  await tab.playwright.locator('.planner-toolbar select').first().selectOption('cold');
  await tab.playwright.getByLabel('Automatic outfit option').selectOption('alternative');
  await button(tab,'Plan week').click();
  await tab.playwright.locator('.day-art').first().click();
  await tab.playwright.getByLabel('ADD TO YOUR ROTATION').fill('2026-10-30');
  await button(tab,'Wear this look').click();
  await tab.playwright.locator('.day-art').first().click();
  await tab.playwright.getByLabel('ADD TO YOUR ROTATION').fill('2026-10-30');
  await button(tab,'Remove saved assignment for this date').click();
  await goToMonth(tab,'November 2026');
  await tab.playwright.getByRole('button',{name:'Choose outfit for Sunday, November 29',exact:true}).click();
  assert(await tab.playwright.getByRole('heading',{name:'Make this day yours.',exact:true}).isVisible(),'Missing open-day picker');
  await tab.playwright.locator('.date-look-picker button').first().click();
  await button(tab,'Wear this look').click();
  await button(tab,'Today').click();
  await tab.playwright.locator('.planner-toolbar select').first().selectOption('warm');
  await tab.playwright.getByLabel('Automatic outfit option').selectOption('mix');
  await button(tab,'Plan month').click();
  return ['day/week/month planning and navigation','manual assignment and removal','weekly swap','fifth-occurrence picker','all option preferences'];
}
