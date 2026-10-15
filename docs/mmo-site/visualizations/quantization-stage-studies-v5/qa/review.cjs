const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',pw=require(path.join(modules,'playwright'));
const dir=path.resolve(__dirname,'..'),fragment=fs.readFileSync(path.join(dir,'quantization-studies.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({EXAMPLE,quantize,dequantize,createProgram,partFrame,createScene,applyFrame})'),program=api.createProgram(),offset=program.before.end+program.gap;
const oldDir=path.resolve(dir,'../quantization-before-msg-v4'),oldSource=fs.readFileSync(path.join(oldDir,'scene.js'),'utf8'),oldApi=vm.runInNewContext(oldSource+';({createScene})');
let browser;
async function main(){
  assert.equal(api.quantize(api.EXAMPLE.x),37440);assert.equal(api.quantize(api.EXAMPLE.y),12459);assert.equal(program.end,10350);
  const qStep=program.after.segments.find(s=>s.phase==='quantize'),deliver=program.after.segments.find(s=>s.phase==='deliver'),store=program.after.segments.find(s=>s.phase==='store');
  assert(qStep.end<=deliver.start&&deliver.end<=store.start);
  const widths=[1024,736,700,699,360,320],designs=['bytes','ticks'],normal=v=>JSON.parse(JSON.stringify(v));
  for(const width of widths)for(const side of['before','after'])for(const design of designs){
    const scene=api.createScene(width,side,design),old=oldApi.createScene(width,side);
    for(const key of['x','y','size','cell'])assert.equal(scene.world[key],old.world[key],'Preserve character grid');
    assert.deepEqual(normal(scene.server),normal(old.server));
    for(const key of['x','y','w','h'])assert.equal(scene.packet[key],old.packet[key],'Preserve Msg');
    assert.deepEqual(normal(scene.route),normal(old.route));assert.equal(scene.height,old.height);assert.equal(scene.packet.rows.length,2);
    for(const b of scene.bounds)assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=scene.height);
    if(design==='ticks'&&side==='after')for(const r of scene.ruler.rows)assert(Math.abs(r.sourceOffset)<38);
  }
  for(const t of[0,500,800,2000,4000,program.after.end]){const before=api.partFrame(t,program.before),after=api.partFrame(t,program.after);assert.equal(before.serverX,after.serverX);assert.equal(before.serverY,after.serverY);}
  for(const t of[qStep.start,(qStep.start+qStep.end)/2,qStep.end,deliver.end])assert.equal(api.partFrame(t,program.after).filled,0);
  browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:736,height:1000});
  await page.setContent(`<style>body{margin:0;background:#0d1421;color:#eef2fb;font:14px 'Malgun Gothic',sans-serif}[hidden]{display:none!important}.viz-controls{display:flex;gap:8px;padding:8px}.btn{padding:8px 12px;font:inherit;background:#151f2c;color:#eef2fb;border:1px solid #354b61}.text-small{font-size:12px}[data-status]{padding:8px}</style>${fragment}`);
  await page.evaluate(()=>document.fonts.ready);
  const ids=await page.evaluate(()=>Array.from(document.querySelectorAll('[id]'),e=>e.id));assert.equal(ids.length,new Set(ids).size,'All SVG and control IDs are unique');
  const initial=await page.evaluate(()=>document.getElementById('quantization-stage-studies-v5').studyStates());assert(initial.every(s=>s.preview&&!s.playing));
  const times=new Set([0,program.before.end,offset,program.end]);for(const[p,start]of[[program.before,0],[program.after,offset]])for(const s of p.segments)for(const f of[0,.25,.5,.75,1])times.add(start+s.start+f*(s.end-s.start));
  for(const design of designs){const kind='quantization-stage-study-'+design+'-v5';
    await page.evaluate(kind=>{for(const el of document.querySelectorAll('.quantization-product'))el.hidden=el.id!==kind;},kind);
    for(const width of widths){await page.setViewportSize({width,height:1200});await page.waitForTimeout(40);
      for(const time of times){await page.evaluate(({kind,time})=>document.getElementById(kind).animation.seek(time),{kind,time});
        const invalid=await page.evaluate(kind=>{const root=document.getElementById(kind),problems=[];
          for(const svg of root.querySelectorAll('[data-board]')){const w=svg.viewBox.baseVal.width,h=svg.viewBox.baseVal.height,labels=[];
            for(const el of svg.querySelectorAll('text')){if(el.closest('defs'))continue;let visible=true;for(let a=el;a&&a!==svg;a=a.parentElement)if(Number(a.getAttribute('opacity')??1)<=.001)visible=false;if(!visible)continue;const local=el.getBBox(),matrix=svg.getCTM().inverse().multiply(el.getCTM()),a=new DOMPoint(local.x,local.y).matrixTransform(matrix),z=new DOMPoint(local.x+local.width,local.y+local.height).matrixTransform(matrix),b={x:a.x,y:a.y,width:z.x-a.x,height:z.y-a.y};if(b.x<-.5||b.y<-.5||b.x+b.width>w+.5||b.y+b.height>h+.5)problems.push({clipped:el.textContent,b});if(parseFloat(getComputedStyle(el).fontSize)<11)problems.push({small:el.textContent});labels.push({text:el.textContent,b});}
            for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(Math.min(a.b.x+a.b.width,b.b.x+b.b.width)-Math.max(a.b.x,b.b.x)>1&&Math.min(a.b.y+a.b.height,b.b.y+b.b.height)-Math.max(a.b.y,b.b.y)>1)problems.push({overlap:[a.text,b.text],a:a.b,b:b.b});}
          }if(document.documentElement.scrollWidth>window.innerWidth)problems.push({overflow:document.documentElement.scrollWidth});return problems;
        },kind);assert.deepEqual(invalid,[],`${design}, width ${width}, time ${time}`);
      }
      await page.evaluate(({kind,t})=>document.getElementById(kind).animation.seek(t),{kind,t:program.end});await page.locator('#'+kind).screenshot({path:path.join(__dirname,design+'-final-'+width+'.png')});
      if([736,320].includes(width))for(const[name,t]of[['conversion',offset+qStep.start+637.5],['quantized',offset+qStep.end+100],['arrival',offset+deliver.start+240]]){await page.evaluate(({kind,t})=>document.getElementById(kind).animation.seek(t),{kind,t});await page.locator('#'+kind).screenshot({path:path.join(__dirname,design+'-'+name+'-'+width+'.png')});}
    }
    await page.setViewportSize({width:736,height:1000});await page.waitForTimeout(40);
    for(const f of[0,.25,.5,.75,1]){const eased=f*f*(3-2*f),time=offset+qStep.start+(qStep.end-qStep.start)*f;await page.evaluate(({kind,time})=>document.getElementById(kind).animation.seek(time),{kind,time});
      const sample=await page.evaluate(design=>[0,1].map(i=>{const base='quantization-stage-'+design+'-after-';return {carrierWidth:Number(document.getElementById(base+'carrier-'+i+'-fill').getAttribute('width')),msgWidth:Number(document.getElementById(base+'field-'+i+'-fill').getAttribute('width')),msgValue:document.getElementById(base+'field-'+i+'-value').textContent,dot:document.getElementById(base+'ruler-'+i+'-point')?.getAttribute('cx')};}),design);
      const scene=api.createScene(736,'after',design);for(let i=0;i<2;i++){assert(Math.abs(sample[i].carrierWidth-(172-86*eased))<1e-6);assert.equal(sample[i].msgWidth,0);assert.equal(sample[i].msgValue,String(api.quantize(i===0?api.EXAMPLE.x:api.EXAMPLE.y)));if(design==='ticks')assert(Math.abs(Number(sample[i].dot)-scene.ruler.rows[i].sourceOffset*(1-eased))<1e-6);}
    }
    const root=page.locator('#'+kind);await root.locator('[data-action="reset"]').click();assert.equal((await page.evaluate(kind=>document.getElementById(kind).animation.getState(),kind)).time,0);
    await root.locator('[data-action="play"]').click();await page.waitForTimeout(180);let state=await page.evaluate(kind=>document.getElementById(kind).animation.getState(),kind);assert(state.playing&&state.time>80);assert.equal(await root.locator('[data-board="after"]').evaluate(el=>el.style.filter),'grayscale(1)');
    await root.locator('[data-action="play"]').click();const paused=await page.evaluate(kind=>document.getElementById(kind).animation.getState().time,kind);await page.waitForTimeout(100);assert.equal(await page.evaluate(kind=>document.getElementById(kind).animation.getState().time,kind),paused);
    await page.evaluate(({kind,t})=>document.getElementById(kind).animation.seek(t),{kind,t:offset+100});assert.equal(await root.locator('[data-board="before"]').evaluate(el=>el.style.filter),'grayscale(1)');
    await page.emulateMedia({reducedMotion:'reduce'});await root.locator('[data-action="play"]').click();state=await page.evaluate(kind=>document.getElementById(kind).animation.getState(),kind);assert.equal(state.time,program.end);assert(!state.playing);await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{widgetState:{privateContent:{kind:'quantization-stage-studies-v5',revision:'restore-test',designs:[{kind:'quantization-stage-study-bytes-v5',time:2000,preview:false},{kind:'quantization-stage-study-ticks-v5',time:3000,preview:false}]}}}}})));
  const restored=await page.evaluate(()=>document.getElementById('quantization-stage-studies-v5').studyStates());assert.deepEqual(restored.map(s=>s.time),[2000,3000]);assert(restored.every(s=>!s.playing));
  assert.deepEqual(errors,[]);await browser.close();browser=null;
  const report={pass:true,designs:['바이트가 줄어드는 모습','눈금으로 바꾸는 모습'],widths,framesPerWidthPerDesign:times.size,durationMs:program.end,preserveGeometry:['character grid','server coordinate card','Msg','PCB route','board height'],coordinateBytesBefore:8,coordinateBytesAfter:4,quantizationStageLabel:'양자화',conversionBeforeMsg:true,noFloatWrittenToAfterMsg:true,serverCoordinatesPreserved:true,quantizeResult:[37440,12459],byteShrinkAndRulerMotionVerified:true,nativeControlsVerified:true,savedStatesVerified:true,reducedMotionVerified:true,standaloneBrowserRuntimeVerified:true,browserHostVerified:false,hostCarouselVerified:false,serverBinaryExecuted:false,oldVersionSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(oldDir,'quantization.html'))).digest('hex'),bytes:Buffer.byteLength(fragment),sha256:crypto.createHash('sha256').update(fragment).digest('hex')};
  assert.equal(report.oldVersionSha256,'d116f7015490d7f98b0d5f03fe5c462305a039496b9ab43faeaad9385f3503e5');fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
