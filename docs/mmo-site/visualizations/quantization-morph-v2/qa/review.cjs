const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',pw=require(path.join(modules,'playwright'));
const dir=path.resolve(__dirname,'..'),fragment=fs.readFileSync(path.join(dir,'quantization.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8'),normal=v=>JSON.parse(JSON.stringify(v));
const api=vm.runInNewContext(source+';({EXAMPLE,quantize,dequantize,packDirState,REPRESENTATIONS,createProgram,comparisonFrame,partFrame,createScene,applyFrame})'),program=api.createProgram();
async function main(){
  assert.equal(api.quantize(api.EXAMPLE.x),37440);assert.equal(api.quantize(api.EXAMPLE.y),12459);assert.equal(api.packDirState(4,1),0x14);
  for(const q of[0,1,512,37440,12459,60928,65024])assert.equal(api.quantize(api.dequantize(q)),q);
  for(let i=0;i<120000;i+=13){const v=Math.fround(i/1000),restored=api.dequantize(api.quantize(v));assert(Math.abs(v-restored)<=1/1024+0.000008);}
  assert.deepEqual(normal(api.REPRESENTATIONS.before.map(f=>f.bytes)),[4,4,4,2]);assert.deepEqual(normal(api.REPRESENTATIONS.after.map(f=>f.bytes)),[4,2,2,1]);
  assert.equal(4+2+100*14,1406);assert.equal(4+2+100*9,906);
  for(const t of[0,250,400,800,1000,2000,5000]){const a=api.partFrame(t,program.before),b=api.partFrame(t,program.after);assert.equal(a.serverX,b.serverX);assert.equal(a.serverY,b.serverY);}
  for(const side of['before','after']){const p=program[side],frame=api.partFrame(p.end,p);assert.deepEqual(normal(frame.fields),[1,1,1,1]);assert.equal(frame.serverX,api.EXAMPLE.x);assert.equal(frame.serverY,api.EXAMPLE.y);}
  const quantizeStep=program.after.segments.find(s=>s.phase==='quantize'),quantizedHold=program.after.segments.find(s=>s.phase==='quantized'),packStep=program.after.segments.find(s=>s.phase==='pack');
  assert(quantizedHold.end-quantizedHold.start>=1000,'Keep the shortened coordinates visible');
  const prior=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'../quantization-v1/scene.js'),'utf8')+';({createScene})');
  for(const width of[736,320])for(const side of['before','after']){const old=prior.createScene(width,side),scene=api.createScene(width,side);assert.deepEqual(normal([scene.world,scene.server,scene.chip.x,scene.chip.y,scene.packet.x,scene.packet.y,scene.packet.w,scene.packet.h,scene.height,scene.routes]),normal([old.world,old.server,old.chip.x,old.chip.y,old.packet.x,old.packet.y,old.packet.w,old.packet.h,old.height,old.routes]));}
  const browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const wrapper=`<style>body{margin:0;background:#0d1421;color:#eef2fb;font:14px 'Malgun Gothic',sans-serif}.viz-controls{display:flex;gap:8px;padding:8px}.btn{padding:8px 12px;font:inherit;background:#151f2c;color:#eef2fb;border:1px solid #354b61}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden}.text-small{font-size:12px}[data-status]{padding:8px}</style>${fragment}`;
  await page.setViewportSize({width:736,height:1100});await page.setContent(wrapper);await page.evaluate(()=>document.fonts.ready);
  const kind='quantization-figure-five-morph-v2',afterStart=program.before.end+program.gap;
  const times=new Set([0,program.before.end,afterStart,program.end]);for(const[part,offset]of[[program.before,0],[program.after,afterStart]])for(const s of part.segments)for(const p of[0,.5,1])times.add(offset+s.start+p*(s.end-s.start));
  const widths=[1024,736,700,699,360,320];
  for(const width of widths){await page.setViewportSize({width,height:1200});await page.waitForTimeout(40);
    for(const t of times){await page.evaluate(({kind,t})=>document.getElementById(kind).animation.seek(t),{kind,t});const invalid=await page.evaluate(kind=>{const root=document.getElementById(kind),problems=[];for(const svg of root.querySelectorAll('[data-board]')){const w=svg.viewBox.baseVal.width,h=svg.viewBox.baseVal.height;for(const el of svg.querySelectorAll('text')){if(el.closest('defs'))continue;const b=el.getBBox();if(b.x<-.5||b.y<-.5||b.x+b.width>w+.5||b.y+b.height>h+.5)problems.push({text:el.textContent,box:{x:b.x,y:b.y,w:b.width,h:b.height},w,h});if(parseFloat(getComputedStyle(el).fontSize)<11)problems.push({small:el.textContent});}}if(document.documentElement.scrollWidth>window.innerWidth)problems.push({overflow:document.documentElement.scrollWidth});return problems;},kind);assert.deepEqual(invalid,[],`Clipping at ${width}, time ${t}`);}
    await page.evaluate(({kind,t})=>document.getElementById(kind).animation.seek(t),{kind,t:program.end});
    const overlaps=await page.evaluate(kind=>{const result=[];for(const svg of document.getElementById(kind).querySelectorAll('[data-board]')){const labels=[...svg.querySelectorAll('text')].filter(e=>!e.closest('defs')).map(e=>({text:e.textContent,b:e.getBBox()}));for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(Math.min(a.b.x+a.b.width,b.b.x+b.b.width)-Math.max(a.b.x,b.b.x)>1&&Math.min(a.b.y+a.b.height,b.b.y+b.b.height)-Math.max(a.b.y,b.b.y)>1)result.push([a.text,b.text]);}}return result;},kind);assert.deepEqual(overlaps,[],`Text overlaps at ${width}`);
    await page.locator('#'+kind).screenshot({path:path.join(__dirname,'final-'+width+'.png')});
  }
  await page.setViewportSize({width:736,height:1100});await page.waitForTimeout(40);
  for(const fraction of[0,.25,.5,.75,1]){
    const t=afterStart+quantizeStep.start+(quantizeStep.end-quantizeStep.start)*fraction,eased=fraction*fraction*(3-2*fraction);
    await page.evaluate(({kind,t})=>document.getElementById(kind).animation.seek(t),{kind,t});
    const fields=await page.evaluate(()=>[0,1,2,3].map(i=>{const prefix='quantization-after-field-'+i,fill=document.getElementById(prefix+'-fill');return {width:Number(fill.getAttribute('width')),fill:fill.getAttribute('fill'),name:document.getElementById(prefix+'-name').textContent,value:document.getElementById(prefix+'-value').textContent};}));
    assert.equal(fields[0].width,172);assert.equal(fields[3].width,86);assert.equal(fields[0].fill,'var(--pcb-pin)');assert.equal(fields[3].fill,'var(--pcb-pin)');
    for(const i of[1,2]){assert(Math.abs(fields[i].width-(172-86*eased))<1e-6);assert.equal(fields[i].fill,'var(--pcb-active)');assert.equal(fields[i].name,eased>=.5?(i===1?'qx':'qy'):(i===1?'x':'y'));}
    const servers=await page.evaluate(kind=>document.getElementById(kind).animation.getState(),kind);assert.deepEqual(servers.serverAfter,[api.EXAMPLE.x,api.EXAMPLE.y]);
    await page.locator('#'+kind).screenshot({path:path.join(__dirname,'coordinate-shrink-'+Math.round(fraction*100)+'.png')});
  }
  for(const[name,t]of[['before-fields',program.before.segments.find(s=>s.phase==='write'&&s.row===2).end],['after-coordinate-hold',afterStart+quantizedHold.start+700],['after-state-pack',afterStart+packStep.start+300]]){await page.evaluate(({kind,t})=>document.getElementById(kind).animation.seek(t),{kind,t});await page.locator('#'+kind).screenshot({path:path.join(__dirname,name+'.png')});}
  await page.locator('[data-action="reset"]').click();assert.equal((await page.evaluate(kind=>document.getElementById(kind).animation.getState(),kind)).time,0);
  await page.locator('[data-action="play"]').click();await page.waitForTimeout(220);let state=await page.evaluate(kind=>document.getElementById(kind).animation.getState(),kind);assert(state.playing&&state.time>100);assert.equal(await page.locator('[data-board="after"]').evaluate(el=>el.style.filter),'grayscale(1)');
  await page.locator('[data-action="play"]').click();const paused=await page.evaluate(kind=>document.getElementById(kind).animation.getState().time,kind);await page.waitForTimeout(150);assert.equal(await page.evaluate(kind=>document.getElementById(kind).animation.getState().time,kind),paused);
  await page.evaluate(({kind,afterStart})=>document.getElementById(kind).animation.seek(afterStart+100),{kind,afterStart});assert.equal(await page.locator('[data-board="before"]').evaluate(el=>el.style.filter),'grayscale(1)');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-action="play"]').click();state=await page.evaluate(kind=>document.getElementById(kind).animation.getState(),kind);assert.equal(state.time,program.end);assert.equal(state.playing,false);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(({kind})=>window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{widgetState:{privateContent:{kind,revision:'restore-test',time:3000}}}}})),{kind});assert.equal(await page.evaluate(kind=>document.getElementById(kind).animation.getState().time,kind),3000);
  assert.deepEqual(errors,[]);await browser.close();
  const report={pass:true,widths,frames:times.size,durationMs:program.end,entryBytesBefore:14,entryBytesAfter:9,batchCount:100,packetBytesBefore:1406,packetBytesAfter:906,quantScale:512,coordinateMorph:{fromBytes:4,toBytes:2,durationMs:850,holdMs:1150,simultaneous:true},secondaryFieldsMuted:true,layoutPreserved:true,example:{serverX:api.EXAMPLE.x,serverY:api.EXAMPLE.y,qx:37440,qy:12459,dirState:20},serverCoordinatesPreserved:true,nativeControlsVerified:true,standaloneBrowserRuntimeVerified:true,browserHostVerified:false,serverBinaryExecuted:false,bytes:Buffer.byteLength(fragment),sha256:crypto.createHash('sha256').update(fragment).digest('hex')};fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
