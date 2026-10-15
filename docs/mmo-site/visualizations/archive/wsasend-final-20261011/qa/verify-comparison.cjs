const {chromium}=require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const dir=path.resolve(__dirname,'..'),checks=[],errors=[],network=[];
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:736,height:850}});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
 const surface=page;
 await surface.locator('#wsasend-design-comparison').waitFor();
 const frame=page;
 await frame.evaluate(()=>document.fonts.ready);
 const tick=()=>frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await tick();
 const check=(name,ok,actual)=>{checks.push({name,ok,actual});if(!ok)throw Error(name+': '+JSON.stringify(actual));};
 const read=()=>frame.evaluate(()=>{
  const panels=[...document.querySelectorAll('#wsasend-design-comparison > section')];
  return panels.map(p=>{const r=p.querySelector('[data-comparison-design]');return {
   hidden:p.hidden,rect:{height:p.getBoundingClientRect().height,width:p.getBoundingClientRect().width},state:r.animation.getState(),
   register:r.querySelectorAll('[data-role="message-register"]').length,
   pending:[...r.querySelectorAll('[data-role="queue-pending"]')].map(e=>e.textContent),
   levels:[...r.querySelectorAll('[data-role="queue-slot"]')].map(e=>Number(e.getAttribute('data-light-level')))
  };});
 });
 let views=await read();
 check('previous-first-completed-frame',!views[0].hidden&&views[1].hidden&&views.every(v=>!v.state.playing&&v.state.time===22580),views);
 check('different-graphic-systems',views[0].register===0&&views[1].register===2,views.map(v=>v.register));
 const duplicateIds=await frame.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});
 check('unique-ids-and-clip-paths',duplicateIds.length===0,duplicateIds);
 const height=views[0].rect.height;
 await page.screenshot({path:path.join(__dirname,'comparison-previous-736.png'),fullPage:true});
 await surface.getByRole('button',{name:'이번 디자인',exact:true}).click();await tick();
 views=await read();
 check('current-switch-same-frame',views[0].hidden&&!views[1].hidden&&views[1].state.time===22580&&!views[1].state.playing&&views[1].state.mode==='desktop',views);
 check('stable-stage-height',Math.abs(views[1].rect.height-height)<1,{previous:height,current:views[1].rect.height});
 await page.screenshot({path:path.join(__dirname,'comparison-current-736.png'),fullPage:true});
 await frame.evaluate(()=>document.getElementById('wsasend-pcb-comparison-current').animation.seek(6500));
 await surface.getByRole('button',{name:'이전 디자인',exact:true}).first().click();await tick();
 views=await read();
 check('seek-preserved-on-switch',!views[0].hidden&&views[0].state.time===6500&&views[0].state.callsBefore===views[1].state.callsBefore&&views[0].levels.every((v,i)=>v===views[1].levels[i]),views);
 await frame.evaluate(()=>document.getElementById('wsasend-pcb-comparison-previous').animation.replay());
 await page.waitForTimeout(300);
 await surface.getByRole('button',{name:'이번 디자인',exact:true}).click();await tick();
 views=await read();
 check('switch-pauses-at-matching-time',views.every(v=>!v.state.playing)&&views[0].state.time>0&&views[0].state.time===views[1].state.time,views.map(v=>v.state));
 await frame.evaluate(()=>{
  for(const r of document.querySelectorAll('[data-comparison-design]'))r.animation.seek(r.animation.timings.afterStart+r.animation.timings.tick);
 });
 views=await read();
 check('same-tick-end-state',views.every(v=>v.state.pendingAfter===4&&v.state.callsAfter===0&&v.pending[1]==='4개 대기'),views);
 await frame.evaluate(()=>{for(const r of document.querySelectorAll('[data-comparison-design]'))r.animation.seek(r.animation.timings.end);});
 for(const width of [1536,736,390,320]){
  await page.setViewportSize({width,height:850});await tick();
  for(const [key,button] of [['previous','이전 디자인'],['current','이번 디자인']]){
   const current=await read(),wanted=key==='previous'?0:1;
   if(current[wanted].hidden){await surface.getByRole('button',{name:button,exact:true}).first().click();await tick();}
   const layout=await frame.evaluate(key=>{
    const r=document.getElementById('wsasend-pcb-comparison-'+key),b=r.getBoundingClientRect();
    const allText=[...r.querySelectorAll('svg text')].filter(e=>{
      for(let n=e;n&&n!==r;n=n.parentElement)if(Number(n.getAttribute('opacity')??1)===0)return false;
      return e.getBoundingClientRect().height>0;
    });
    return {width:b.width,mode:r.animation.getState().mode,overflow:document.documentElement.scrollWidth>window.innerWidth+1,minTextHeight:Math.min(...allText.map(e=>e.getBoundingClientRect().height)),clipped:allText.filter(e=>{const t=e.getBoundingClientRect();return t.left<b.left-1||t.right>b.right+1;}).map(e=>e.textContent),counts:[...r.querySelectorAll('[data-role="request-count"]')].map(e=>Number(e.textContent))};
   },key);
   check('layout-'+key+'-'+width,!layout.overflow&&layout.clipped.length===0&&layout.minTextHeight>=11&&layout.counts.join(',')==='4,1',layout);
   if(width===320)await page.screenshot({path:path.join(__dirname,'comparison-'+key+'-320.png'),fullPage:true});
  }
 }
 check('no-runtime-errors',errors.length===0,errors);check('no-network-requests',network.length===0,network);
 const inline=await browser.newPage({viewport:{width:768,height:850}});
 inline.on('pageerror',e=>errors.push(e.message));
 await inline.goto(pathToFileURL(path.join(__dirname,'comparison-inline-preview.html')).href);
 const inlineSurface=inline.frameLocator('iframe');
 await inlineSurface.locator('#wsasend-design-comparison').waitFor();
 await inlineSurface.getByRole('button',{name:'다음 디자인',exact:true}).click();
 const inlineFrame=inline.frames().find(f=>f!==inline.mainFrame());
 const inlineState=await inlineFrame.evaluate(()=>({
  previousHidden:document.querySelector('[data-variant="이전 디자인"]').hidden,
  currentHidden:document.querySelector('[data-variant="이번 디자인"]').hidden,
  state:document.getElementById('wsasend-pcb-comparison-current').animation.getState()
 }));
 check('inline-selector-and-same-frame',inlineState.previousHidden&&!inlineState.currentHidden&&inlineState.state.time===22580&&!inlineState.state.playing&&inlineState.state.callsBefore===4&&inlineState.state.callsAfter===1,inlineState);
 check('inline-no-runtime-errors',errors.length===0,errors);
 fs.writeFileSync(path.join(__dirname,'comparison-verification.json'),JSON.stringify({checks,errors,network},null,2));
 console.log(JSON.stringify({passed:checks.length,errors,network}));
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exit(1);});
