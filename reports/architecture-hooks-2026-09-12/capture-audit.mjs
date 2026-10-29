import { chromium } from 'playwright';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const pool = await Promise.all((await readdir('puzzles/pool')).filter(f => f.endsWith('.json')).map(async f => JSON.parse(await readFile('puzzles/pool/' + f, 'utf8'))));
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [['desktop',1440,900],['tablet',1024,768],['mobile',390,844]]) {
    const context = await browser.newContext({viewport:{width,height},locale:'en-US',deviceScaleFactor:1});
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.addInitScript(() => { localStorage.setItem('foldwink:onboarded','true'); localStorage.setItem('foldwink:lang','en'); });
    await page.goto('http://127.0.0.1:5186/',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:"Play today's puzzle",exact:true}).waitFor();
    await page.screenshot({path:path.join(out, name+'-menu.png')});
    console.log(name+' menu', JSON.stringify(await page.evaluate(() => ({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,viewport:innerWidth}))));
    await page.getByRole('button',{name:'Easy puzzle',exact:true}).click();
    await page.locator('[data-state=idle]').first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-state=idle]')].length === 16 && [...document.querySelectorAll('[data-state=idle]')].every(el => Number(getComputedStyle(el).opacity) > .99));
    await page.screenshot({path:path.join(out,name+'-game.png')});
    const words = await page.locator('[data-state=idle]').allTextContents();
    const puzzle = pool.find(p => p.groups.flatMap(g=>g.items).every(w=>words.map(x=>x.trim()).includes(w)));
    if (!puzzle) throw new Error('No matching local puzzle');
    console.log(name+' puzzle', puzzle.id, puzzle.title);
    for (const [i,g] of puzzle.groups.entries()) {
      for(const word of g.items) await page.getByRole('button',{name:word,exact:true}).click();
      await page.getByRole('button',{name:'Submit',exact:true}).click();
      if(i===0) await page.screenshot({path:path.join(out,name+'-solved-row.png')});
    }
    await page.getByText('Break Wax Seal',{exact:true}).waitFor();
    await page.screenshot({path:path.join(out,name+'-reward.png')});
    console.log(name+' reward-storage', await page.evaluate(()=>localStorage.getItem('foldwink:archivistProfile')));
    console.log(name+' reward-accessibility', await page.locator('body').evaluate(el=>({dialogs:el.querySelectorAll('[role=dialog]').length,focused:document.activeElement?.outerHTML.slice(0,300)})));
    await page.getByText('Break Wax Seal',{exact:true}).click();
    await page.getByRole('button',{name:'Claim & Continue',exact:true}).click();
    await page.screenshot({path:path.join(out,name+'-result.png')});
    console.log(name+' result', await page.locator('body').innerText());
    await context.close();
  }
} finally { await browser.close(); }
