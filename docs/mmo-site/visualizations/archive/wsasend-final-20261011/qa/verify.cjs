const {chromium}=require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const qa=__dirname,dir=path.resolve(qa,'..');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:1536,height:1080}});
 const errors=[],network=[],checks=[],layouts=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(pathToFileURL(path.join(dir,'current-design.html')).href);await page.evaluate(()=>document.fonts.ready);
 const seek=t=>page.evaluate(t=>document.getElementById('wsasend-pcb-animation-v1').animation.seek(t),t);
 const check=(name,ok,actual)=>{checks.push({name,ok,actual});if(!ok)throw Error(name+': '+JSON.stringify(actual));};
 const {t:T,m:M}=await page.evaluate(()=>{const a=document.getElementById('wsasend-pcb-animation-v1').animation;return {t:a.timings,m:a.motion};});
 const near=(a,b)=>Math.abs(a-b)<.00001;
 const rendered=()=>page.evaluate(()=>{
  const root=document.getElementById('wsasend-pcb-animation-v1');
  const sel=(role,row)=>[...root.querySelectorAll('[data-role="'+role+'"][data-row="'+row+'"]')];
  return {
   counts:[0,1].map(r=>sel('request-count',r).map(e=>Number(e.textContent))[0]),
   lit:[0,1].map(r=>sel('queue-slot',r).filter(e=>e.getAttribute('data-selected')==='true').length),
   levels:[0,1].map(r=>sel('queue-slot',r).map(e=>Number(e.getAttribute('data-light-level')))),
   pending:[0,1].map(r=>sel('queue-pending',r)[0].textContent),
   focus:[0,1].map(r=>{const e=sel('animation-row',r)[0];return {opacity:Number(e.getAttribute('opacity')),filter:e.style.filter};}),
   chars:[...root.querySelectorAll('[data-role="character"]')].map(e=>({kind:e.getAttribute('data-character'),eyes:e.querySelectorAll('[data-role="mage-eye"]').length,transform:e.getAttribute('transform')}))
  };
 });
 check('presentation-duration',T.end>=20000&&T.end<=24000,T.end);
 check('unified-motion',[T.move,T.inputEnd-T.move,T.msgEnd-T.inputEnd,T.queueOn-T.queueStart,T.call-T.sendStart,T.batchCall-T.tick].every(d=>d===M.main)&&M.main===400,{t:T,m:M});
 await seek(0);const initial=await rendered();
 check('mage-and-two-eyes',initial.chars.every(c=>c.kind==='mage'&&c.eyes===2),initial.chars);
 check('inactive-after-starts-empty',initial.lit[1]===0&&initial.counts[1]===0&&near(initial.focus[1].opacity,.32),initial);
 const afterFrozen=initial.chars[1].transform;
 for(let i=0;i<4;i++){
  const start=T.start+i*T.period;
  const s=await seek(start+T.queueOn+M.state),r=await rendered();
  check('before-enqueue-'+i,s.callsBefore===i&&s.pendingBefore===1&&r.lit[0]===1&&near(r.levels[0][i],1)&&r.pending[0]==='1개 대기'&&r.chars[1].transform===afterFrozen,{s,r});
  await seek(start+T.call+M.state/2);const half=await rendered();
  check('before-drain-fade-'+i,near(half.levels[0][i],.5)&&half.counts[0]===i+1&&half.lit[0]===0&&half.pending[0]==='0개 대기',half);
  await seek(start+T.call+M.state);const clear=await rendered();
  check('before-queue-cleared-'+i,clear.levels[0].every(x=>x===0)&&clear.counts[0]===i+1,clear);
 }
 await seek(T.switchStart+M.main/2);const mid=await rendered();
 check('focus-crossfade',mid.focus.every(f=>near(f.opacity,.66)),mid.focus);
 await seek(T.afterStart);const beginningAfter=await rendered();const beforeFrozen=beginningAfter.chars[0].transform;
 for(let i=0;i<4;i++){
  const at=T.afterStart+T.start+i*T.periodAfter+T.queueOn+M.state;
  const s=await seek(at),r=await rendered();
  check('after-accumulates-'+i,s.callsAfter===0&&s.pendingAfter===i+1&&r.lit[1]===i+1&&r.levels[1].slice(0,i+1).every(x=>x===1)&&r.chars[0].transform===beforeFrozen&&near(r.focus[0].opacity,.32),{s,r});
 }
 const batchGlobal=T.afterStart+T.batchCall;
 await seek(batchGlobal-1);const waiting=await rendered();
 check('four-pending-until-batch-arrival',waiting.counts[1]===0&&waiting.lit[1]===4&&waiting.pending[1]==='4개 대기',waiting);
 await seek(batchGlobal+M.state/2);const batchFade=await rendered();
 check('batch-queue-fades-together',batchFade.counts[1]===1&&batchFade.lit[1]===0&&batchFade.levels[1].slice(0,4).every(x=>near(x,.5))&&batchFade.pending[1]==='0개 대기',batchFade);
 await seek(T.compareStart);const batchClear=await rendered();
 check('batch-queue-cleared',batchClear.levels[1].every(x=>x===0)&&batchClear.pending[1]==='0개 대기',batchClear);
 await seek(T.compareStart+M.main/2);const compareMid=await rendered();
 check('comparison-restores-before-smoothly',near(compareMid.focus[0].opacity,.66)&&compareMid.focus[1].opacity===1,compareMid.focus);
 const finalState=await seek(T.end),final=await rendered();
 check('final-comparison',finalState.activeRow==='comparison'&&final.counts[0]===4&&final.counts[1]===1&&final.focus.every(f=>f.opacity===1&&f.filter==='grayscale(0)')&&final.lit.every(x=>x===0)&&final.pending.every(x=>x==='0개 대기'),{finalState,final});
 for(const p of [.25,.5,.75]){
  const expected=p*p*(3-2*p),parts=[];
  const tests=[['character',0],['input-transfer',T.move],['message-fill',T.inputEnd],['queue-transfer',T.queueStart],['send-transfer',T.sendStart]];
  for(const [role,offset] of tests){
   await seek(T.start+offset+M.main*p);
   const value=await page.evaluate(role=>{const root=document.getElementById('wsasend-pcb-animation-v1');const q='[data-role="'+role+'"][data-row="0"]'+(role==='character'?'':'[data-message="0"]');const el=root.querySelector(q);return role==='message-fill'?Number(el.getAttribute('width'))/188:Number(el.getAttribute('data-motion-progress'));},role);
   parts.push({role,value});
  }
  check('same-easing-'+p,parts.every(v=>near(v.value,expected)),{expected,parts});
 }
 await seek(T.start+T.msgEnd+M.hold/2);
 const fillBox=await page.locator('[data-role="message-fill"][data-row="0"][data-message="0"]').evaluate(e=>({w:Number(e.getAttribute('width')),h:Number(e.getAttribute('height'))}));
 check('horizontal-fill-and-readable-hold',fillBox.w===188&&fillBox.h===52,fillBox);
 await seek(T.start+T.queueStart+M.main/2);
 const carrier=await page.evaluate(()=>{const n=document.querySelector('[data-transfer="queue-transfer"][data-row="0"][data-message="0"]');return {items:n.getAttribute('data-items'),opacity:Number(n.getAttribute('opacity')),label:n.querySelector('text').textContent};});
 check('numbered-message-carrier',carrier.items==='1'&&carrier.label==='1'&&carrier.opacity>0,carrier);
 await seek(T.afterStart+T.tick+M.main/2);
 const bundle=await page.evaluate(()=>{const n=document.querySelector('[data-transfer="send-transfer"][data-row="1"]');return {items:n.getAttribute('data-items'),bars:n.querySelectorAll('[data-role="batch-message"]').length,opacity:Number(n.getAttribute('opacity'))};});
 check('one-bundle-holds-four-messages',bundle.items==='4'&&bundle.bars===4&&bundle.opacity>0,bundle);
 const shoot=async(name,t)=>{await seek(t);await page.locator('#wsasend-pcb-animation-v1').screenshot({path:path.join(qa,name)});};
 await shoot('before-queue-filled.png',T.start+T.queueOn+M.state);
 await shoot('before-queue-drained.png',T.start+T.call+M.state);
 await shoot('message-fill.png',T.start+T.inputEnd+M.main/2);
 await shoot('queue-transfer.png',T.start+T.queueStart+M.main/2);
 await shoot('individual-transfer.png',T.start+T.sendStart+M.main/2);
 await shoot('batch-transfer.png',T.afterStart+T.tick+M.main/2);
 await shoot('after-queue-cleared.png',T.compareStart);
 await shoot('result-desktop.png',T.end);
 for(const width of [1536,1024,736,660,659,390,320]){
  await page.setViewportSize({width,height:1080});
  await page.waitForFunction(w=>Number(document.querySelector('.pcb-board').getAttribute('width'))===w,width);
  await seek(T.end);
  const l=await page.evaluate(()=>{
   const root=document.getElementById('wsasend-pcb-animation-v1'),box=root.getBoundingClientRect();
   const visible=e=>{for(let n=e;n&&n!==root;n=n.parentElement)if(Number(n.getAttribute('opacity')??1)<=.02)return false;return true;};
   const texts=[...root.querySelectorAll('svg text')].filter(e=>e.textContent&&visible(e)).map(e=>{const b=e.getBoundingClientRect();return {text:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height};});
   const overlaps=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1)overlaps.push([a.text,b.text]);}
   const clipped=texts.filter(t=>t.x<box.left-.5||t.x+t.w>box.right+.5);
   const characters=[...root.querySelectorAll('[data-role="animation-row"]')].map(row=>{const a=row.querySelector('[data-role="character"]').getBoundingClientRect(),b=row.querySelector('rect').getBoundingClientRect();return {w:a.width,h:a.height,contained:a.x>=b.x&&a.y>=b.y&&a.right<=b.right&&a.bottom<=b.bottom};});
   return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,overlaps,clipped,minTextHeight:Math.min(...texts.map(t=>t.h)),characters};
  });layouts.push(l);
  check('layout-'+width,!l.overflow&&!l.overlaps.length&&!l.clipped.length&&l.characters.every(c=>c.contained)&&l.minTextHeight>=11,l);
  if(width===736||width===320)await shoot('result-'+width+'.png',T.end);
  if(width===736){await shoot('queue-transfer-736.png',T.start+T.queueStart+M.main/2);await shoot('batch-transfer-736.png',T.afterStart+T.tick+M.main/2);}
 }
 await page.setViewportSize({width:1024,height:900});await seek(T.start+T.move/2);
 await page.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.play());await page.waitForTimeout(150);
 await page.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.pause());
 const paused=await page.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.getState());await page.waitForTimeout(150);
 const still=await page.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.getState());
 check('pause-preserves-state',paused.time===still.time&&!still.playing,still);
 await page.locator('.pcb-replay').click();const replay=await page.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.getState());
 check('replay-resets-comparison',replay.time<160&&replay.callsBefore===0&&replay.callsAfter===0&&replay.activeRow==='before'&&replay.compareProgress===0,replay);
 await seek(T.end-10);await page.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.play());await page.waitForTimeout(120);
 const stopped=await page.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.getState());
 check('single-cycle-stop',!stopped.playing&&stopped.time===T.end,stopped);
 const reduced=await browser.newPage({viewport:{width:736,height:900},reducedMotion:'reduce'});await reduced.goto(pathToFileURL(path.join(dir,'current-design.html')).href);
 const reducedState=await reduced.evaluate(()=>document.getElementById('wsasend-pcb-animation-v1').animation.getState());
 check('reduced-motion-starts-paused',!reducedState.playing&&reducedState.time===0,reducedState);
 const inline=await browser.newPage({viewport:{width:768,height:900}});inline.on('pageerror',e=>errors.push(e.message));await inline.goto(pathToFileURL(path.join(qa,'inline-preview.html')).href);
 const frame=inline.frames().find(f=>f!==inline.mainFrame());await frame.waitForSelector('#wsasend-pcb-animation-v1');
 const inlineFinal=await frame.evaluate(()=>{const a=document.getElementById('wsasend-pcb-animation-v1').animation;return a.seek(a.timings.end);});
 check('inline-final-comparison',inlineFinal.activeRow==='comparison'&&inlineFinal.callsBefore===4&&inlineFinal.callsAfter===1,inlineFinal);
 check('no-runtime-errors',errors.length===0,errors);check('offline-ready',network.length===0,network);
 fs.writeFileSync(path.join(qa,'verification.json'),JSON.stringify({passed:checks.length,timing:{t:T,m:M},checks,layouts,errors,network},null,2));
 console.log(JSON.stringify({passed:checks.length,durationSeconds:T.end/1000,layouts,errors,network}));
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
