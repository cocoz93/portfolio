const { chromium } = require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const {pathToFileURL}=require('url');
const dir=__dirname;
let browser;
(async()=>{
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage({viewport:{width:736,height:740},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(dir,'character-options-preview.html')).href);
  const frame=page.frames().find(f=>f!==page.mainFrame());
  await frame.waitForSelector('[data-character="knight"]');
  await frame.locator('body').evaluate(async()=>{await document.fonts.ready});
  const names=['실버 기사','청년 검사','후드 레인저','로브 마법사'];
  const screenshots=[];
  const variants=[];
  for(let i=0;i<names.length;i++){
    await frame.evaluate((name)=>{const root=document.getElementById('wsasend-character-options');root.querySelectorAll(':scope > section').forEach(s=>s.hidden=s.dataset.variant!==name);},names[i]);
    const stage=frame.locator('[data-variant="'+names[i]+'"] .cc-stage');
    const shot=path.join(dir,'character-'+(i+1)+'.png');await stage.screenshot({path:shot});screenshots.push(shot);
    variants.push(await stage.evaluate(s=>({name:s.parentElement.dataset.variant,characters:s.querySelectorAll('[data-character]').length,rectangles:s.querySelectorAll('[data-character] rect').length,svgCount:s.querySelectorAll('svg').length,stageWidth:s.getBoundingClientRect().width,stageHeight:s.getBoundingClientRect().height})));
  }
  const widths=[];
  for(const width of [736,660,480,390,320]){
    await page.setViewportSize({width,height:900});
    await frame.waitForFunction(w=>innerWidth===w-32,width);
    await frame.evaluate(()=>{document.querySelectorAll('#wsasend-character-options > section').forEach((s,i)=>s.hidden=i!==0)});
    widths.push(await frame.evaluate(()=>{const root=document.getElementById('wsasend-character-options'),s=root.querySelector('section:not([hidden])');const bounds=s.getBoundingClientRect();const clipped=[...s.querySelectorAll('svg,figcaption,h2')].filter(e=>{const b=e.getBoundingClientRect();return b.left<bounds.left-1||b.right>bounds.right+1}).map(e=>e.tagName);return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,rootWidth:root.getBoundingClientRect().width,clipped};}));
  }
  await page.setViewportSize({width:736,height:740});
  await frame.waitForFunction(()=>innerWidth===704);
  await frame.evaluate(()=>{document.querySelectorAll('#wsasend-character-options > section').forEach((s,i)=>s.hidden=i!==0)});
  const navigation=[];
  for(const name of names){
    await frame.locator('.viz-carousel-picker summary').click();
    await frame.locator('button').filter({hasText:new RegExp('^'+name+'$')}).click();
    navigation.push(await frame.evaluate(()=>document.querySelector('#wsasend-character-options > section:not([hidden])').dataset.variant));
  }
  await frame.locator('.viz-carousel-picker summary').click();
  await frame.locator('button').filter({hasText:new RegExp('^'+names[0]+'$')}).click();
  await page.screenshot({path:path.join(dir,'character-options-browser.png'),fullPage:true});
  const controls=await frame.locator('button').allTextContents();
  const report={variants,widths,navigation,controls,errors,screenshots};
  fs.writeFileSync(path.join(dir,'character-options-verification.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  await browser.close();
  if(errors.length||widths.some(w=>w.scrollWidth>w.width+1||w.clipped.length)||variants.some(v=>v.characters!==3)||navigation.some((n,i)=>n!==names[i]))process.exitCode=1;
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
