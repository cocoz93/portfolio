const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'queue-cue-studies.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,bundlePathPoint,bundleCharacterPose,applyBundleFrame,bundleCoreRanges,bundleAdvance})');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const names={led:'LED 점등',blocks:'블록 입출력',fill:'채움·비움'};
const readColors=css=>Object.fromEntries([...css.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const baseColors=readColors(fragment.match(/#wsasend-cue-studies-v5 \{([^}]+)\}/)[1]);
const palettes=Object.fromEntries(Object.keys(names).map(routing=>[routing,{...baseColors,...readColors(fragment.match(new RegExp(`#wsasend-cue-studies-v5 \\[data-routing="${routing}"\\] \\{([^}]+)\\}`))?.[1]||'')}]));
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
function serialized(markup,nodes,routing='led'){
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
    const layout='silkscreen',design=new Element('section',{'data-layout':layout,'data-routing':'chamfer','data-material':routing,'data-variant':names[routing]}),board=new Element('svg'),buttons={play:new Element('button'),full:new Element('button')},status=new Element('span');
    design.hidden=index>0;
    board.children=[new Element('title'),new Element('desc')];board.nodes=new Map();board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.markup=markup;board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
    design.querySelector=selector=>selector==='.study-board'?board:selector==='.study-status'?status:selector.includes('full')?buttons.full:buttons.play;
    design.board=board;design.buttons=buttons;design.status=status;return design;
  });
  const root={querySelectorAll:()=>designs,getBoundingClientRect:()=>({width:actualWidth})},document=new Element('document'),window=new Element('window');document.hidden=false;document.getElementById=id=>{assert.equal(id,'wsasend-cue-studies-v5');return root;};
  window.openai={widgetState:saved,setWidgetState:snapshot=>{saves.push(snapshot);return Promise.resolve();}};
  const media=new Element('media');media.matches=reduced;
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=++frameId;pending.set(id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},Map,Promise});
  function advance(delta=16){timestamp+=delta;const callbacks=Array.from(pending.values());pending.clear();callbacks.forEach(fn=>fn(timestamp));}
  return {designs,document,window,media,pending,saves,advance,resize(next){actualWidth=next;resize([{contentRect:{width:next}}]);advance();}};
}
async function main(){
  const normalize=value=>JSON.parse(JSON.stringify(value));
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  assert.equal((fragment.match(/class="viz-carousel"/g)||[]).length,1);
  assert.equal((fragment.match(/data-variant="/g)||[]).length,3);
  parse(fragment.replace(/<script>[\s\S]*?<\/script>/g,''));
  const prior=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'../wsasend-ring-light-v4/scene.js'),'utf8')+';({createBundleAnimationScene})');
  const layouts=[];
  for(const material of Object.keys(names))for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width,'silkscreen','chamfer',material),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup),reference=prior.createBundleAnimationScene(width);
    assert.deepEqual(normalize(scene.metrics),normalize(reference.metrics));assert.equal(scene.height,reference.height);
    for(let r=0;r<2;r++){
      const row=scene.rows[r];assert.equal(row.messages.length,4);assert.equal(row.queue.length,4);assert.equal(row.packets.length,4);
      assert.deepEqual(normalize(row.character.positions),normalize(reference.rows[r].character.positions));
      assert.deepEqual(normalize(row.packets.map(p=>p.payload)),normalize(reference.rows[r].packets.map(p=>p.payload)));
      for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.deepEqual(normalize(row[beams].map(b=>b.points)),normalize(reference.rows[r][beams].map(b=>b.points)));
      assertSeparatePaths(row.sourceBeams,`${material}/${width}/source`);assertSeparatePaths(row.copyBeams,`${material}/${width}/copy`);
    }
    for(const label of scene.labels){
      ctx.font=`500 ${label.size}px PCB-Review`;const w=ctx.measureText(label.label).width,x=label.x-(label.anchor==='middle'?w/2:label.anchor==='end'?w:0);
      assert(label.size>=11);assert(x>=-1&&x+w<=width+1,`${material}/${width}: ${label.label}`);assert(label.y-label.size/2>=0&&label.y+label.size/2<=scene.height);
    }
    const preview=api.bundlePreviewFrame(program);assert.equal(preview.rows[0].calls,4);assert.equal(preview.rows[1].calls,0);assert.equal(preview.rows[1].copies,4);
    api.applyBundleFrame(scene,preview,setter(nodes));
    assert.equal(nodes.get(scene.rows[0].queueCount).textContent,'0개');assert.equal(nodes.get(scene.rows[1].queueCount).textContent,'4개');
    for(let actor=0;actor<4;actor++){
      const before=program.segments.find(s=>s.row===0&&s.phase==='queue'&&s.actor===actor),release=program.segments.find(s=>s.row===0&&s.phase==='release'&&s.actor===actor);
      const loaded=api.bundleFrame(before.end,program),emptied=api.bundleFrame(release.end,program);
      assert.equal(loaded.rows[0].copies,1);assert.equal(emptied.rows[0].copies,0);assert.equal(emptied.rows[0].calls,actor+1);
      api.applyBundleFrame(scene,emptied,setter(nodes));assert.equal(nodes.get(scene.rows[0].queueCount).textContent,'0개');
      const after=program.segments.find(s=>s.row===1&&s.phase==='queue'&&s.actor===actor),accumulated=api.bundleFrame(after.end,program);
      assert.equal(accumulated.rows[1].copies,actor+1);assert.equal(accumulated.rows[1].calls,0);
      api.applyBundleFrame(scene,accumulated,setter(nodes));assert.equal(nodes.get(scene.rows[1].queueCount).textContent,`${actor+1}개`);
    }
    const final=api.bundleFrame(program.end,program);assert.equal(final.rows[0].calls,4);assert.equal(final.rows[1].calls,1);
    assert.equal(final.rows[0].copies,0);assert.equal(final.rows[1].copies,0);api.applyBundleFrame(scene,final,setter(nodes));
    for(const row of scene.rows){assert.equal(nodes.get(row.queueCount).textContent,'0개');assert.equal(nodes.get(row.character.face).getAttribute('data-facing'),'south');}
    for(const segment of program.segments){
      const frame=api.bundleFrame((segment.start+segment.end)/2,program);api.applyBundleFrame(scene,frame,setter(nodes));
      if(segment.phase==='queue'){
        const row=scene.rows[segment.row],packet=row.packets[segment.actor];assert(Number(nodes.get(packet.contentGroup).getAttribute('opacity'))<1);
        if(material==='fill'){const window=row.queueWindows[segment.actor];assert(Math.abs(Number(nodes.get(window.mask).getAttribute('width'))-window.width/2)<1e-6);}
        if(material==='blocks'){const tile=row.queueBlocks[segment.actor];assert(nodes.get(tile.group).getAttribute('transform')!=='translate(0 0)');assert.equal(nodes.get(tile.group).getAttribute('opacity'),'1');}
      }
    }
    const ranges=api.bundleCoreRanges(program),coreDuration=ranges.reduce((sum,r)=>sum+r.duration,0);
    let t=ranges[0].start,elapsed=0;while(t<program.end&&elapsed<coreDuration+100){t=api.bundleAdvance(t,50,program,'core');elapsed+=50;}
    assert.equal(t,program.end);assert(elapsed<=coreDuration+50);
    layouts.push({material,width,height:scene.height,coreDuration,fullDuration:program.end});
  }
  const sceneFor=material=>api.createBundleAnimationScene(736,'silkscreen','chamfer',material),program=api.createBundleProgram(false);
  const loadedSegment=program.segments.find(s=>s.row===1&&s.phase==='queue'&&s.actor===3),held=api.bundleFrame(loadedSegment.end+100,program);
  const led=sceneFor('led'),ledNodes=parse(led.markup);api.applyBundleFrame(led,held,setter(ledNodes));assert(Number(ledNodes.get(led.rows[1].queueFlashes[3]).getAttribute('opacity'))>.6);
  const blocks=sceneFor('blocks'),blockNodes=parse(blocks.markup);api.applyBundleFrame(blocks,held,setter(blockNodes));
  for(const tile of blocks.rows[1].queueBlocks){assert.equal(blockNodes.get(tile.group).getAttribute('transform'),'translate(0 0)');assert.equal(blockNodes.get(tile.group).getAttribute('opacity'),'1');}
  const send=program.segments.find(s=>s.row===1&&s.phase==='outlet');api.applyBundleFrame(blocks,api.bundleFrame(send.start+send.duration*.45,program),setter(blockNodes));
  assert(blocks.rows[1].queueBlocks.some(tile=>blockNodes.get(tile.group).getAttribute('transform')!=='translate(0 0)'));
  assert(blocks.rows[1].queueBlocks.every(tile=>blockNodes.get(tile.group).getAttribute('opacity')==='1'));
  assert.equal(blockNodes.get(blocks.rows[1].outletBeams[0].head).getAttribute('opacity'),'0');
  const filling=sceneFor('fill'),fillNodes=parse(filling.markup),release=program.segments.find(s=>s.row===1&&s.phase==='release');
  api.applyBundleFrame(filling,api.bundleFrame(release.start+release.duration*.5,program),setter(fillNodes));
  for(const window of filling.rows[1].queueWindows){assert(Math.abs(Number(fillNodes.get(window.mask).getAttribute('width'))-window.width/2)<1e-6);assert(Number(fillNodes.get(window.mask).getAttribute('x'))>window.x);}
  const rt=runtime(),first=rt.designs[0],animation=first.animation;
  assert.equal(rt.designs.length,3);assert(rt.designs.every(d=>!d.animation.getState().playing));assert.equal(rt.saves.length,0);
  first.buttons.play.fire('click');assert.equal(animation.getState().mode,'core');assert.equal(animation.getState().playing,true);
  rt.advance();rt.advance(80);assert(animation.getState().time>0);
  first.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  first.buttons.full.fire('click');assert.equal(animation.getState().mode,'full');assert.equal(animation.getState().time,0);rt.advance();rt.advance(80);
  first.buttons.full.fire('click');assert.equal(animation.getState().playing,false);
  first.buttons.play.fire('click');assert.equal(animation.getState().mode,'core');rt.advance();rt.advance(80);first.buttons.play.fire('click');
  const saved=rt.saves.at(-1),restored=runtime(736,false,saved);assert.equal(restored.designs[0].animation.getState().mode,'core');assert.equal(restored.saves.length,0);
  animation.seek(loadedSegment.end+100);rt.resize(320);assert.equal(animation.getState().queuedAfter,4);assert.equal(first.board.getAttribute('viewBox'),'0 0 320 1080');
  rt.resize(736);animation.play('core');for(let i=0;i<400&&animation.getState().playing;i++)rt.advance(80);
  assert.equal(animation.getState().playing,false);assert.equal(animation.getState().callsBefore,4);assert.equal(animation.getState().callsAfter,1);
  assert.equal(rt.designs[1].animation.getState().playing,false);assert.equal(rt.designs[2].animation.getState().playing,false);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);
  assert.equal(reduced.pending.size,0);assert.equal(reduced.designs[0].animation.getState().queuedAfter,4);
  for(const [file,expected] of [
    ['../archive/wsasend-restored-20261012/wsasend-restored.html','856E1491CC7799AEC9D43B0433B1F57F34E022C9044971A2353B7ABD40817DEB'],
    ['../sector-bundle-before-speed-v18/before-speed.html','41D9AD560871C9045803E4501011C81C384EDB74DA648177332D6C35420D3ACE']
  ])assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,file))).digest('hex').toUpperCase(),expected);
  for(const material of Object.keys(names)){
    await snapshot(736,'silkscreen',null,`${material}-preview`,material);
    await snapshot(320,'silkscreen',null,`${material}-mobile`,material);
    const entering=program.segments.find(s=>s.row===1&&s.phase==='queue'&&s.actor===2);
    await snapshot(736,'silkscreen',entering.start+entering.duration*.7,`${material}-entry`,material);
    await snapshot(736,'silkscreen',send.start+send.duration*.45,`${material}-send`,material);
    if(material==='blocks')await snapshot(320,'silkscreen',send.start+send.duration*.65,'blocks-mobile-send',material);
    await snapshot(736,'silkscreen',release.start+release.duration*.5,`${material}-release`,material);
  }
  const report={ok:true,bytes:Buffer.byteLength(fragment),variants:names,layouts,playModesVerified:true,stateRestoreVerified:true,resizeVerified:true,reducedMotionVerified:true,perSessionSemanticsVerified:true,sourceLayoutPreserved:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:true,bytes:report.bytes,variants:report.variants,checks:layouts.length,coreDuration:layouts[0].coreDuration,fullDuration:layouts[0].fullDuration,browserHostVerified:false},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
