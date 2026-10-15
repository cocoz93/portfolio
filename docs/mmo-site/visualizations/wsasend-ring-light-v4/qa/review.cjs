const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'queue-light.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,bundlePathPoint,bundleCharacterPose,applyBundleFrame})');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const names={minimal:'데이터만 강조'};
const readColors=css=>Object.fromEntries([...css.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const baseColors=readColors(fragment.match(/#wsasend-ring-light-v4 \{([^}]+)\}/)[1]);
const palettes=Object.fromEntries(Object.keys(names).map(routing=>[routing,{...baseColors,...readColors(fragment.match(new RegExp(`#wsasend-ring-light-v4 \\[data-routing="${routing}"\\] \\{([^}]+)\\}`))?.[1]||'')}]));
const baseline=fs.readFileSync(path.resolve(dir,'../archive/wsasend-restored-20261012/wsasend-restored.html'),'utf8');
const baselineColors=Object.fromEntries([...baseline.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
for(const colors of Object.values(palettes))assert.deepEqual(colors,baselineColors,'Every variant must match figure 1 palette exactly');
function luminance(hex){const values=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;}
const paletteChecks=[];
for(const [routing,colors] of Object.entries(palettes)){
  for(const key of ['--pcb-bg','--pcb-surface','--pcb-edge','--pcb-empty',...Object.keys(colors).filter(k=>k.startsWith('--pcb-char-'))])assert.equal(colors[key],baselineColors[key],`Preserve background and components: ${routing}/${key}`);
  const active=luminance(colors['--pcb-active']),bg=luminance(colors['--pcb-bg']);
  assert((active+.05)/(bg+.05)>=4.5,'Signal labels must remain readable');
  paletteChecks.push({routing,active:colors['--pcb-active'],luminance:active,signalTextContrast:(active+.05)/(bg+.05)});
}
function assertSeparatePaths(beams,context){
  function segments(points){return points.slice(1).map((p,i)=>[points[i],p]).filter(([a,b])=>a[0]!==b[0]||a[1]!==b[1]);}
  function crosses([a,b],[c,d]){
    const eps=1e-7;
    const orient=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
    const on=(p,q,r)=>r[0]>=Math.min(p[0],q[0])-eps&&r[0]<=Math.max(p[0],q[0])+eps&&r[1]>=Math.min(p[1],q[1])-eps&&r[1]<=Math.max(p[1],q[1])+eps;
    const [o1,o2,o3,o4]=[orient(a,b,c),orient(a,b,d),orient(c,d,a),orient(c,d,b)];
    return o1*o2< -eps&&o3*o4< -eps||Math.abs(o1)<eps&&on(a,b,c)||Math.abs(o2)<eps&&on(a,b,d)||Math.abs(o3)<eps&&on(c,d,a)||Math.abs(o4)<eps&&on(c,d,b);
  }
  for(let i=0;i<beams.length;i++)for(let j=i+1;j<beams.length;j++)
    for(const a of segments(beams[i].points))for(const b of segments(beams[j].points))assert(!crosses(a,b),`Crossed parallel traces ${context}: ${i}/${j}`);
}
const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
class Element{
  constructor(tagName,attrs={}){this.tagName=tagName;this.attrs=attrs;this.textContent='';this.listeners={};}
  get id(){return this.attrs.id;}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return this.attrs[key]??null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  fire(type,event={}){this.listeners[type]?.forEach(fn=>fn(event));}
}
function parse(markup){
  const nodes=new Map();
  for(const m of markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)){
    const attrs=Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^\"]*)"/g)].map(a=>[a[1],a[2]]));
    if(attrs.id){assert(!nodes.has(attrs.id),`Duplicate ID ${attrs.id}`);nodes.set(attrs.id,new Element(m[1],attrs));}
  }
  for(const m of markup.matchAll(/<text\b[^>]*\bid="([^\"]+)"[^>]*>([^<]*)<\/text>/g))nodes.get(m[1]).textContent=m[2];
  return nodes;
}
function setter(nodes){return (id,attrs,text)=>{assert(nodes.has(id),id);const el=nodes.get(id);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);if(text!==undefined)el.textContent=text;};}
function serialized(markup,nodes,routing='minimal'){
  let updated=markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,attrs)=>{
    const id=attrs.match(/\bid="([^\"]+)"/)?.[1];if(!id||!nodes.has(id))return all;
    return `<${tag} ${Object.entries(nodes.get(id).attrs).map(([key,v])=>`${key}="${escape(v)}"`).join(' ')}>`;
  });
  updated=updated.replace(/(<text\b[^>]*\bid="([^\"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>`${open}${escape(nodes.get(id).textContent)}${end}`);
  return updated.replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(palettes[routing][name],name);return palettes[routing][name];});
}
async function snapshot(width,layout,time,name,routing='minimal'){
  const scene=api.createBundleAnimationScene(width,layout,'chamfer',routing),program=api.createBundleProgram(scene.compact),frame=time===null?api.bundlePreviewFrame(program):api.bundleFrame(time,program),nodes=parse(scene.markup);
  api.applyBundleFrame(scene,frame,setter(nodes));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${serialized(scene.markup,nodes,routing)}</svg>`;
  fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));
}
function runtime(width=736,reduced=false,saved=null){
  let actualWidth=width,timestamp=100,frameId=0,resize;const pending=new Map(),saves=[];
  const designs=Object.keys(names).map((routing,index)=>{
    const layout='silkscreen',design=new Element('section',{'data-layout':layout,'data-routing':'chamfer','data-material':routing,'data-variant':names[routing]}),board=new Element('svg'),buttons={play:new Element('button'),preview:new Element('button')},status=new Element('span');
    design.hidden=index>0;
    board.children=[new Element('title'),new Element('desc')];board.nodes=new Map();board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.markup=markup;board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
    design.querySelector=selector=>selector==='.study-board'?board:selector==='.study-status'?status:selector.includes('preview')?buttons.preview:buttons.play;
    design.board=board;design.buttons=buttons;design.status=status;return design;
  });
  const root={querySelectorAll:()=>designs,getBoundingClientRect:()=>({width:actualWidth})},document=new Element('document'),window=new Element('window');document.hidden=false;document.getElementById=id=>{assert.equal(id,'wsasend-ring-light-v4');return root;};
  window.openai={widgetState:saved,setWidgetState:snapshot=>{saves.push(snapshot);return Promise.resolve();}};
  const media=new Element('media');media.matches=reduced;
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=++frameId;pending.set(id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},Map,Promise});
  function advance(delta=16){timestamp+=delta;const callbacks=Array.from(pending.values());pending.clear();callbacks.forEach(fn=>fn(timestamp));}
  return {designs,document,window,media,pending,saves,advance,resize(next){actualWidth=next;resize([{contentRect:{width:next}}]);advance();}};
}
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
  parse(fragment.replace(/<script>[\s\S]*?<\/script>/g,''));
  const normalize=value=>JSON.parse(JSON.stringify(value));
  const figure2Source=fs.readFileSync(path.resolve(dir,'../sector-bundle-before-speed-v18/scene.js'),'utf8');
  const figure2=vm.runInNewContext(figure2Source+';({createBundleAnimationScene})');
  const checked=[];
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup),reference=figure2.createBundleAnimationScene(width);
    assert.equal(scene.height,reference.height);assert(scene.metrics.mapW<reference.metrics.mapW&&scene.metrics.mapH<reference.metrics.mapH);assert(scene.metrics.ringR>=reference.metrics.ringR*1.5);
    assert(!scene.markup.includes('bundle-packet'));assert(!scene.markup.includes('bundle-msg-region'));
    for(let r=0;r<2;r++){
      const row=scene.rows[r];assert.equal(row.messages.length,4);assert.equal(row.packets.length,4);assert.equal(row.queue.length,4);
      assert.equal(row.sourceBeams.length,4);assert.equal(row.copyBeams.length,4);assert.equal(row.outletBeams.length,1);
      assert.equal(row.character.positions.length,reference.rows[r].character.positions.length);
      assert.deepEqual(normalize(row.character.coordinates),normalize(reference.rows[r].character.coordinates));
      assert.deepEqual(normalize(row.character.directions),normalize(reference.rows[r].character.directions));
      for(const message of row.messages){assert(message.height<100&&message.width<=56);assert.equal(message.protocolHeaderHeight,0);}
      for(const packet of row.packets){assert(Number(nodes.get(packet.base).getAttribute('width'))<48);assert(Number(nodes.get(packet.base).getAttribute('height'))<40);assert(packet.header&&!packet.protocolHeader);}
      assert.deepEqual(normalize(row.packets.map(p=>p.payload)),normalize(reference.rows[0].packets.map(p=>p.payload)));
      assertSeparatePaths(row.sourceBeams,`source ${width}/${r}`);assertSeparatePaths(row.copyBeams,`copy ${width}/${r}`);
      const qlabel=nodes.get(row.queueCount);assert(qlabel);
    }
    assert(scene.rows[0].messages.every(m=>m.height<reference.rows[0].messages[0].height));
    assert.equal((scene.markup.match(/data-role="packet-header"/g)||[]).length,0);
    assert.equal((scene.markup.match(/data-role="call-count"/g)||[]).length,2);
    assert.equal((scene.markup.match(/data-character="mage"/g)||[]).length,2);
    for(const label of scene.labels){
      ctx.font=`500 ${label.size}px PCB-Review`;const measured=ctx.measureText(label.label).width;
      const left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);
      assert(label.size>=11);assert(left>=-1&&left+measured<=width+1,`Label outside ${width}: ${label.label}`);
      assert(label.y-label.size/2>=0&&label.y+label.size/2<=scene.height);
    }
    for(const points of scene.traces)for(const [x,y] of points)assert(x>=0&&x<=width&&y>=0&&y<=scene.height);
    const beforeOutlets=program.segments.filter(s=>s.row===0&&s.phase==='outlet'),afterOutlets=program.segments.filter(s=>s.row===1&&s.phase==='outlet');
    assert.equal(beforeOutlets.length,4);assert.equal(afterOutlets.length,1);
    for(let i=0;i<4;i++){
      const queue=program.segments.find(s=>s.row===0&&s.phase==='queue'&&s.actor===i),release=program.segments.find(s=>s.row===0&&s.phase==='release'&&s.actor===i);
      const ready=api.bundleFrame(queue.end,program),sent=api.bundleFrame(release.end,program);
      api.applyBundleFrame(scene,ready,setter(nodes));assert.equal(nodes.get(scene.rows[0].queueCount).textContent,'1개');
      assert.equal(ready.rows[0].copies,1);assert.equal(ready.rows[0].calls,i);assert.equal(ready.rows[0].drains[i],0);
      assert.equal(sent.rows[0].copies,0);assert.equal(sent.rows[0].calls,i+1);assert.equal(sent.rows[0].drains[i],1);
      api.applyBundleFrame(scene,sent,setter(nodes));assert.equal(nodes.get(scene.rows[0].queueCount).textContent,'0개');assert.equal(nodes.get(scene.rows[0].queue[i].id).getAttribute('opacity'),'0');
      for(let j=0;j<i;j++)assert.equal(ready.rows[0].drains[j],1);
      const afterQueue=program.segments.find(s=>s.row===1&&s.phase==='queue'&&s.actor===i),accumulated=api.bundleFrame(afterQueue.end,program);
      assert.equal(accumulated.rows[1].copies,i+1);assert.equal(accumulated.rows[1].calls,0);
      api.applyBundleFrame(scene,accumulated,setter(nodes));assert.equal(nodes.get(scene.rows[1].queueCount).textContent,`${i+1}개`);for(let j=0;j<=i;j++)assert.equal(nodes.get(scene.rows[1].queue[j].id).getAttribute('opacity'),'1');
    }
    const tick=program.segments.find(s=>s.phase==='tick'),waiting=api.bundleFrame(tick.start,program);
    assert.equal(waiting.rows[1].copies,4);assert.equal(waiting.rows[1].calls,0);
    const final=api.bundleFrame(program.end,program);assert.equal(final.rows[0].calls,4);assert.equal(final.rows[1].calls,1);assert.equal(final.rows[0].copies,0);assert.equal(final.rows[1].copies,0);
    for(const row of final.rows){assert(row.moves.every(v=>v===1));assert(row.packets.every(v=>v===1));assert.equal(row.opacity,1);assert.equal(row.gray,0);}
    api.applyBundleFrame(scene,final,setter(nodes));
    assert.equal(nodes.get(scene.rows[0].callCount).textContent,'4회');assert.equal(nodes.get(scene.rows[1].callCount).textContent,'1회');
    for(const row of scene.rows){assert.equal(nodes.get(row.queueCount).textContent,'0개');assert.equal(nodes.get(row.character.face).getAttribute('data-facing'),'south');}
    for(const segment of program.segments){
      const mid=(segment.start+segment.end)/2,frame=api.bundleFrame(mid,program);api.applyBundleFrame(scene,frame,setter(nodes));
      if(segment.phase==='message'){
        const packet=scene.rows[segment.row].packets[segment.actor];assert.equal(Number(nodes.get(packet.mask).getAttribute('width')),packet.width/2);
        assert.equal(Number(nodes.get(packet.fill).getAttribute('opacity')),.46);
      }
      if(segment.phase==='queue'){
        const row=scene.rows[segment.row],state=frame.rows[segment.row],packet=row.packets[segment.actor];
        assert(Number(nodes.get(packet.contentGroup).getAttribute('opacity'))<1);
        const active=Number(nodes.get(row.queue[segment.actor].id).getAttribute('fill-opacity'));
        const other=row.queue.find((q,i)=>i!==segment.actor&&state.queue[i]===1&&state.drains[i]===0);
        if(other)assert(active>Number(nodes.get(other.id).getAttribute('fill-opacity')));
      }
      if(segment.phase==='move')assert.equal(nodes.get(scene.rows[segment.row].character.face).getAttribute('data-facing'),scene.rows[segment.row].character.directions[segment.actor]);
      if(segment.row===0&&segment.phase!=='rowEnd'){assert.equal(frame.rows[1].opacity,.28);assert.equal(frame.rows[1].gray,1);}
      if(segment.row===1&&!['switch','compare'].includes(segment.phase)){assert.equal(frame.rows[0].opacity,.28);assert.equal(frame.rows[0].gray,1);}
    }
    checked.push({width,height:scene.height,duration:program.end,beforeMsgs:4,afterMsgs:4,beforeCalls:4,afterCalls:1});
  }
  const rt=runtime(),design=rt.designs[0],animation=design.animation;
  assert.equal(animation.getState().preview,true);assert.equal(animation.getState().playing,false);assert.equal(rt.saves.length,0);
  design.buttons.play.fire('click');assert.equal(animation.getState().playing,true);rt.advance(16);rt.advance(80);assert(animation.getState().time>0);
  design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>paused);
  const program=animation.getProgram(),tick=program.segments.find(s=>s.phase==='tick');animation.seek(tick.start);assert.equal(animation.getState().queuedAfter,4);assert.equal(animation.getState().callsAfter,0);
  rt.resize(320);assert.equal(animation.getState().queuedAfter,4);assert.equal(animation.getState().callsAfter,0);assert.equal(design.board.getAttribute('viewBox'),'0 0 320 1080');
  design.buttons.play.fire('click');rt.advance();rt.advance(80);design.buttons.play.fire('click');const saved=rt.saves.at(-1),restored=runtime(736,false,saved);assert.equal(restored.designs[0].animation.getState().queuedAfter,4);assert.equal(restored.saves.length,0);
  design.buttons.preview.fire('click');assert.equal(animation.getState().preview,true);assert.equal(animation.getState().callsBefore,4);assert.equal(animation.getState().callsAfter,1);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);assert.equal(reduced.pending.size,0);
  for(const [file,expected] of [
    ['../archive/wsasend-restored-20261012/wsasend-restored.html','856E1491CC7799AEC9D43B0433B1F57F34E022C9044971A2353B7ABD40817DEB'],
    ['../sector-bundle-before-speed-v18/before-speed.html','41D9AD560871C9045803E4501011C81C384EDB74DA648177332D6C35420D3ACE']
  ])assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,file))).digest('hex').toUpperCase(),expected,'Approved originals preserved');
  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'../wsasend-matched-v1/wsasend-matched.html'))).digest('hex'),'c17cc20d0f535bb5cbfda3e89b93d9d2386c6289411e5f426f48b38e09f09ef8');
  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'../wsasend-ring-focus-v2/ring-focus.html'))).digest('hex'),'486a3859b5301b6d45001be783646849c5e5bb341bd0eafeb8bc40642c1fc48f');
  const previousApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'../wsasend-ring-focus-v2/scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram})');
  for(const width of [736,320]){
    const current=api.createBundleAnimationScene(width),prior=previousApi.createBundleAnimationScene(width);
    assert.deepEqual(normalize(current.metrics),normalize(prior.metrics));
    for(let r=0;r<2;r++){
      assert.deepEqual(normalize(current.rows[r].character.positions),normalize(prior.rows[r].character.positions));
      for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.deepEqual(normalize(current.rows[r][beams].map(b=>b.points)),normalize(prior.rows[r][beams].map(b=>b.points)));
    }
    assert.deepEqual(normalize(api.createBundleProgram(current.compact)),normalize(previousApi.createBundleProgram(prior.compact)));
  }
  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'../wsasend-ring-emphasis-v3/ring-emphasis.html'))).digest('hex'),'6fc7373d7ca936f09996265b87235f9c2a9175f7c1a273af8818e7cd407c9745');
  const program736=api.createBundleProgram(false),segment=(r,p,i=0)=>program736.segments.find(s=>s.row===r&&s.phase===p&&s.actor===i);
  await snapshot(736,'silkscreen',null,'final-736');await snapshot(320,'silkscreen',null,'final-320');
  await snapshot(736,'silkscreen',segment(0,'queue',0).end,'before-queue-lit');
  await snapshot(736,'silkscreen',segment(0,'release',0).end,'before-queue-empty');
  await snapshot(736,'silkscreen',program736.segments.find(s=>s.phase==='tick').start,'after-accumulated');
  const send=program736.segments.find(s=>s.row===1&&s.phase==='outlet');await snapshot(736,'silkscreen',send.start+send.duration*.65,'after-send');
  const message=segment(0,'message',0);await snapshot(736,'silkscreen',message.start+message.duration*.5,'left-right-fill');
  const moving=segment(0,'move',2);await snapshot(736,'silkscreen',moving.start+moving.duration*.5,'character-moving');
  const enqueue=segment(1,'queue',2);await snapshot(736,'silkscreen',enqueue.start+enqueue.duration*.5,'active-slot');
  await verifyQueueLighting(api,parse,setter,snapshot,normalize,previousApi,assert);
  const report={queueLightHoldVerified:true,sendLightingSynchronized:true,queueCounterVerified:true,MsgHandoffDimmingVerified:true,activeSlotContrastVerified:true,geometryAndTimingPreserved:true,ok:true,bytes:Buffer.byteLength(fragment),paletteChecks,checked,manualPlay:true,playPauseVerified:true,resizePreservesPhase:true,reducedMotionVerified:true,stateRestoreVerified:true,originalsPreserved:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
async function verifyQueueLighting(api,parse,setter,snapshot,normalize,previousApi,assert){
  for(const width of [736,320]){
    const scene=api.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup);
    const prior=previousApi.createBundleAnimationScene(width);
    assert.deepEqual(normalize(scene.metrics),normalize(prior.metrics));
    assert.equal((scene.markup.match(/data-role="queue-lit-outline"/g)||[]).length,8);
    assert.equal((scene.markup.match(/data-role="outlet-lit-trace"/g)||[]).length,2);
    for(let actor=0;actor<4;actor++){
      const segment=program.segments.find(s=>s.row===1&&s.phase==='queue'&&s.actor===actor);
      for(const age of [0,100,200]){
        const frame=api.bundleFrame(segment.end+age,program);assert.equal(frame.rows[1].queueLights[actor],1);
        api.applyBundleFrame(scene,frame,setter(nodes));
        assert.equal(Number(nodes.get(scene.rows[1].queue[actor].id).getAttribute('fill-opacity')),.8);
        assert.equal(Number(nodes.get(scene.rows[1].queueRims[actor]).getAttribute('opacity')),1);
        assert.equal(nodes.get(scene.rows[1].queueLabels[actor]).getAttribute('fill'),'var(--pcb-char-ink)');
      }
      const rested=api.bundleFrame(segment.end+400,program);assert.equal(rested.rows[1].queueLights[actor],0);
      api.applyBundleFrame(scene,rested,setter(nodes));assert.equal(Number(nodes.get(scene.rows[1].queue[actor].id).getAttribute('fill-opacity')),.3);
      assert.equal(Number(nodes.get(scene.rows[1].queueRims[actor]).getAttribute('opacity')),0);
    }
    const send=program.segments.find(s=>s.row===1&&s.phase==='outlet'),sending=api.bundleFrame(send.start+200,program);
    api.applyBundleFrame(scene,sending,setter(nodes));
    assert.equal(sending.rows[1].sendLight,1);assert.equal(sending.rows[1].calls,1);
    assert.equal(Number(nodes.get(scene.rows[1].outletLight).getAttribute('opacity')),1);
    for(let i=0;i<4;i++){assert.equal(Number(nodes.get(scene.rows[1].queueRims[i]).getAttribute('opacity')),1);assert.equal(Number(nodes.get(scene.rows[1].queue[i].id).getAttribute('fill-opacity')),.8);}
    const released=program.segments.find(s=>s.row===1&&s.phase==='release'),done=api.bundleFrame(released.end,program);
    api.applyBundleFrame(scene,done,setter(nodes));
    assert.equal(done.rows[1].copies,0);assert.equal(nodes.get(scene.rows[1].queueCount).textContent,'0개');
    assert.equal(Number(nodes.get(scene.rows[1].outletLight).getAttribute('opacity')),0);
    for(let i=0;i<4;i++){assert.equal(Number(nodes.get(scene.rows[1].queueRims[i]).getAttribute('opacity')),0);assert.equal(Number(nodes.get(scene.rows[1].queue[i].id).getAttribute('opacity')),0);}
    for(const row of scene.rows)for(const id of row.queueRims)assert.equal(nodes.get(id).getAttribute('stroke-width'),'1.5');
    for(let time=0;time<program.end;time+=100){
      const frame=api.bundleFrame(time,program);api.applyBundleFrame(scene,frame,setter(nodes));
      for(const row of frame.rows){assert(row.queueLights.every(p=>p>=0&&p<=1));assert(row.sendLight>=0&&row.sendLight<=1);}
    }
    const last=program.segments.find(s=>s.row===1&&s.phase==='queue'&&s.actor===3);
    await snapshot(width,'silkscreen',last.end+100,`held-light-${width}`);
    await snapshot(width,'silkscreen',send.start+200,`send-light-${width}`);
  }
}

main().catch(error=>{console.error(error);process.exitCode=1;});

