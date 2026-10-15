const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'original-tone.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,bundlePathPoint,bundleCharacterPose,applyBundleFrame})');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const names={original:'원본 블루',copper:'구리빛 신호',mint:'민트 신호',lavender:'라벤더 신호'};
const readColors=css=>Object.fromEntries([...css.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const baseColors=readColors(fragment.match(/#sector-bundle-original-tone-v11 \{([^}]+)\}/)[1]);
const palettes=Object.fromEntries(Object.keys(names).map(tone=>[tone,{...baseColors,...readColors(fragment.match(new RegExp(`#sector-bundle-original-tone-v11 \\[data-tone="${tone}"\\] \\{([^}]+)\\}`))?.[1]||'')}]));
const baseline=fs.readFileSync(path.resolve(dir,'../archive/wsasend-restored-20261012/wsasend-restored.html'),'utf8');
const baselineColors=Object.fromEntries([...baseline.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
assert.deepEqual(palettes.original,baselineColors,'Original variant must match figure 1 palette exactly');
function luminance(hex){const values=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;}
const paletteChecks=[];
for(const [tone,colors] of Object.entries(palettes)){
  for(const key of ['--pcb-bg','--pcb-surface','--pcb-edge','--pcb-empty',...Object.keys(colors).filter(k=>k.startsWith('--pcb-char-'))])assert.equal(colors[key],baselineColors[key],`Preserve background and components: ${tone}/${key}`);
  const active=luminance(colors['--pcb-active']),bg=luminance(colors['--pcb-bg']);
  if(tone!=='original')assert(active<luminance(baselineColors['--pcb-active']));
  assert((active+.05)/(bg+.05)>=4.5,'Signal labels must remain readable');
  paletteChecks.push({tone,active:colors['--pcb-active'],luminance:active,signalTextContrast:(active+.05)/(bg+.05)});
}
function assertSeparatePaths(beams,context){
  function segments(points){return points.slice(1).map((p,i)=>[points[i],p]).filter(([a,b])=>a[0]!==b[0]||a[1]!==b[1]);}
  function crosses([a,b],[c,d]){
    const ah=a[1]===b[1],ch=c[1]===d[1];
    if(ah===ch){
      const axis=ah?0:1,other=1-axis;
      return a[other]===c[other]&&Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis]))<=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]));
    }
    const [h,v]=ah?[[a,b],[c,d]]:[[c,d],[a,b]];
    return v[0][0]>=Math.min(h[0][0],h[1][0])&&v[0][0]<=Math.max(h[0][0],h[1][0])&&h[0][1]>=Math.min(v[0][1],v[1][1])&&h[0][1]<=Math.max(v[0][1],v[1][1]);
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
function serialized(markup,nodes,tone='original'){
  let updated=markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,attrs)=>{
    const id=attrs.match(/\bid="([^\"]+)"/)?.[1];if(!id||!nodes.has(id))return all;
    return `<${tag} ${Object.entries(nodes.get(id).attrs).map(([key,v])=>`${key}="${escape(v)}"`).join(' ')}>`;
  });
  updated=updated.replace(/(<text\b[^>]*\bid="([^\"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>`${open}${escape(nodes.get(id).textContent)}${end}`);
  return updated.replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(palettes[tone][name],name);return palettes[tone][name];});
}
async function snapshot(width,layout,time,name,tone='original'){
  const scene=api.createBundleAnimationScene(width,layout,tone),program=api.createBundleProgram(scene.compact),frame=time===null?api.bundlePreviewFrame(program):api.bundleFrame(time,program),nodes=parse(scene.markup);
  api.applyBundleFrame(scene,frame,setter(nodes));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${serialized(scene.markup,nodes,tone)}</svg>`;
  fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));
}
function runtime(width=736,reduced=false,saved=null){
  let actualWidth=width,timestamp=100,frameId=0,resize;const pending=new Map(),saves=[];
  const designs=Object.keys(names).map((tone,index)=>{
    const layout='silkscreen',design=new Element('section',{'data-layout':layout,'data-tone':tone,'data-variant':names[tone]}),board=new Element('svg'),buttons={play:new Element('button'),preview:new Element('button')},status=new Element('span');
    design.hidden=index>0;
    board.children=[new Element('title'),new Element('desc')];board.nodes=new Map();board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.markup=markup;board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
    design.querySelector=selector=>selector==='.study-board'?board:selector==='.study-status'?status:selector.includes('preview')?buttons.preview:buttons.play;
    design.board=board;design.buttons=buttons;design.status=status;return design;
  });
  const root={querySelectorAll:()=>designs,getBoundingClientRect:()=>({width:actualWidth})},document=new Element('document'),window=new Element('window');document.hidden=false;document.getElementById=id=>{assert.equal(id,'sector-bundle-original-tone-v11');return root;};
  window.openai={widgetState:saved,setWidgetState:snapshot=>{saves.push(snapshot);return Promise.resolve();}};
  const media=new Element('media');media.matches=reduced;
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=++frameId;pending.set(id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},Map,Promise});
  function advance(delta=16){timestamp+=delta;const callbacks=Array.from(pending.values());pending.clear();callbacks.forEach(fn=>fn(timestamp));}
  return {designs,document,window,media,pending,saves,advance,resize(next){actualWidth=next;resize([{contentRect:{width:next}}]);advance();}};
}
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
  assert.equal((fragment.match(/data-variant="/g)||[]).length,4);assert.equal((fragment.match(/class="viz-carousel"/g)||[]).length,1);assert.equal((fragment.match(/data-tone="[^"]+" data-layout="silkscreen" aria-label="[^"]+" hidden/g)||[]).length,3);assert(!script.includes('IntersectionObserver'));parse(fragment);
  const original=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8');assert.deepEqual(fragment.match(/@font-face\{[^}]+\}/g),original.match(/@font-face\{[^}]+\}/g));
  const checked=[];
  for(const tone of Object.keys(names))for(const layout of ['silkscreen'])for(const width of [736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width,layout,tone),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup);
    assert.equal((scene.markup.match(/data-character="mage"/g)||[]).length,2);assert.equal((scene.markup.match(/data-role="outlet-label"/g)||[]).length,2);assert.equal((scene.markup.match(/data-role="bundle-entry"/g)||[]).length,4);
    assert.equal((scene.markup.match(/data-role="kernel-boundary"/g)||[]).length,2);assert.equal((scene.markup.match(/data-role="kernel-label"/g)||[]).length,2);
    assert(program.segments.filter(s=>s.phase==='message').every(s=>s.duration===350));assert(program.segments.filter(s=>s.phase==='move'||s.phase==='queue').every(s=>s.duration===650));
    if(layout==='chip')assert.equal((scene.markup.match(/data-role="queue-housing"/g)||[]).length,2);
    if(layout==='silkscreen')assert(scene.markup.includes('component-footprint'));
    if(layout!=='chip')assert(scene.markup.includes('data-ready-strip'));
    assert(!scene.markup.includes('copy-count'));assert(!scene.markup.includes('request-state'));assert.equal(JSON.stringify(scene.rows[0].packets.map(p=>p.payload)),JSON.stringify(scene.rows[1].packets.map(p=>p.payload)));
    assert.equal(JSON.stringify(scene.rows[1].packets.map(p=>p.payload)),JSON.stringify([{move:1,x:0,y:1},{move:2,x:1,y:1},{move:3,x:1,y:0},{move:4,x:2,y:0}]));
    const bounds=scene.labels.map(label=>{assert(label.size>=11);ctx.font=`${label.size}px PCB-Review`;const w=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?w/2:label.anchor==='end'?w:0);return {label:label.label,left,right:left+w,top:label.y-label.size/2,bottom:label.y+label.size/2};});
    bounds.forEach(b=>assert(b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=scene.height,`Clipping ${layout}/${width}: ${b.label}`));
    for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){const a=bounds[i],b=bounds[j];assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),`Overlap ${layout}/${width}: ${a.label}/${b.label}`);}
    for(const caption of bounds.filter(b=>['개별 Msg 4개','4개를 Msg 하나로'].includes(b.label))){
      for(const points of scene.traces)for(let i=1;i<points.length;i++){
        const [a,b]=[points[i-1],points[i]];
        if(a[1]===b[1]&&Math.min(a[0],b[0])<caption.right&&Math.max(a[0],b[0])>caption.left)assert(a[1]<caption.top-4||a[1]>caption.bottom+4,`Caption trace clearance ${layout}/${width}`);
      }
    }
    for(const row of scene.rows){
      assert.equal(row.sourceBeams.length,4);
      assert.equal(row.copyBeams.length,row.row===0?4:1);
      assertSeparatePaths(row.sourceBeams,`${width}/${row.row}/input`);
      assertSeparatePaths(row.copyBeams,`${width}/${row.row}/output`);
      if(row.row===1){
        row.packets.forEach(packet=>packet.normal.forEach(id=>assert(!nodes.get(id).textContent.includes('Msg'),'Internal entries must be raw coordinates')));
        assert.equal(nodes.get(row.bundle.normal[0]).textContent,'Msg');
      }
      const c=row.character;
      for(let index=0;index<4;index++){
        const [a,b]=[c.coordinates[index],c.coordinates[index+1]];assert.equal(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]),1);
        for(const p of [0,.5,1]){const moves=Array.from({length:4},(_,step)=>step<index?1:step===index?p:0),pose=api.bundleCharacterPose(c,moves),unit=c.size/32;assert(pose.x-16*unit>=c.grid.x&&pose.x+16*unit<=c.grid.x+c.grid.w);assert(pose.y-20*unit>=c.grid.y&&pose.y+16*unit<=c.grid.y+c.grid.h);}
      }
      for(const beam of [...row.sourceBeams,...row.copyBeams,...row.outletBeams]){
        for(let i=1;i<beam.points.length;i++)assert(beam.points[i][0]===beam.points[i-1][0]||beam.points[i][1]===beam.points[i-1][1]);
        for(const p of [0,.25,.5,.75,1]){const [x,y]=api.bundlePathPoint(beam.points,p),halfW=beam.headWidth/2,halfH=beam.headHeight/2;assert(x-halfW>=0&&x+halfW<=width&&y-halfH>=0&&y+halfH<=scene.height);}
      }
    }
    api.applyBundleFrame(scene,api.bundlePreviewFrame(program),setter(nodes));
    scene.rows.forEach(row=>row.movementArrows.forEach(id=>assert.equal(nodes.get(id).getAttribute('opacity'),'0','Static view must hide movement arrows')));
    if(!scene.compact){
      assert.equal((scene.markup.match(/data-role="source-message-divider"/g)||[]).length,2);
      for(const row of scene.rows){
        for(const beam of row.sourceBeams){const ys=beam.points.map(p=>p[1]);assert(Math.min(...ys)<beam.points[0][1]);assert(beam.points.at(-1)[1]>Math.min(...ys));}
        for(const beam of row.copyBeams){const ys=beam.points.map(p=>p[1]);assert(Math.max(...ys)>beam.points[0][1]);assert(Math.max(...ys)>beam.points.at(-1)[1]);}
      }
    }
    assert.equal(nodes.get(scene.rows[0].queueCount).textContent,'Msg 4개');assert.equal(nodes.get(scene.rows[1].queueCount).textContent,'Msg 1개');
    for(const row of scene.rows){
      const beam=row.outletBeams[0];assert.equal(beam.headWidth,16);assert.equal(beam.headHeight,10);assert(row.boundaryProgress>0&&row.boundaryProgress<1);
      const outlet=program.segments.find(s=>s.row===row.row&&s.phase==='outlet');
      api.applyBundleFrame(scene,api.bundleFrame(outlet.start+outlet.duration*.5,program),setter(nodes));assert.equal(nodes.get(row.kernelBoundary).getAttribute('stroke'),'var(--pcb-track)');
      api.applyBundleFrame(scene,api.bundleFrame(outlet.start+outlet.duration*.8,program),setter(nodes));assert.equal(nodes.get(row.kernelBoundary).getAttribute('stroke'),'var(--pcb-active)');assert(Number(nodes.get(beam.head).getAttribute('opacity'))>0);
      assert.equal(api.bundleFrame(outlet.start+outlet.duration*.8,program).rows[row.row].release,0,'Queue must stay filled until send signal exits');
    }
    for(const segment of program.segments){
      api.applyBundleFrame(scene,api.bundleFrame(segment.start+segment.duration*.5,program),setter(nodes));
      const visible=scene.rows.flatMap(row=>row.movementArrows.filter(id=>Number(nodes.get(id).getAttribute('opacity'))>0));
      assert.equal(visible.length,segment.phase==='move'?1:0,'Only the current movement may show an arrow');
    }
    api.applyBundleFrame(scene,api.bundleFrame(program.end,program),setter(nodes));
    for(const row of scene.rows){assert.equal(nodes.get(row.queueCount).textContent,'비움');row.queue.forEach(q=>assert.equal(nodes.get(q.id).getAttribute('opacity'),'0'));}
    checked.push({tone,layout,width,height:scene.height,durationMs:program.end});
  }
  const test=runtime();assert.equal(test.saves.length,0);assert.equal(test.pending.size,0);
  for(const design of test.designs){const initial=design.animation.getState();assert(initial.preview&&!initial.playing);assert.equal(initial.queuedBefore,4);assert.equal(initial.queuedAfter,1);}
  const aligned=test.designs[0];aligned.buttons.play.fire('click');assert.equal(aligned.animation.getState().time,0);assert.equal(aligned.animation.getState().playing,true);
  assert(test.designs.slice(1).every(design=>design.animation.getState().preview&&!design.animation.getState().playing));
  test.advance();test.advance(40);const t=aligned.animation.getState().time;assert(t>0);aligned.buttons.play.fire('click');test.advance(40);assert.equal(aligned.animation.getState().time,t);assert(!aligned.animation.getState().playing);
  aligned.buttons.play.fire('click');test.advance();test.advance(40);assert(aligned.animation.getState().time>t);
  test.document.hidden=true;const hidden=aligned.animation.getState().time;test.advance(500);assert.equal(aligned.animation.getState().time,hidden);test.document.hidden=false;test.document.fire('visibilitychange');
  aligned.hidden=true;test.advance(500);assert.equal(aligned.animation.getState().time,hidden);aligned.hidden=false;
  assert(test.designs.slice(1).every(design=>design.animation.getState().preview&&!design.animation.getState().playing),'Switching palettes must not start animation');
  const copy=aligned.animation.getProgram().segments.find(s=>s.row===0&&s.phase==='copy');aligned.animation.seek(copy.start+copy.duration*.4);const before=aligned.animation.getState();test.resize(320);const after=aligned.animation.getState();assert.equal(before.phase,after.phase);const resizedCopy=aligned.animation.getProgram().segments.find(s=>s.id===copy.id);assert(Math.abs((after.time-resizedCopy.start)/resizedCopy.duration-.4)<1e-8);assert.equal(aligned.board.getAttribute('viewBox'),'0 0 320 862');
  aligned.buttons.preview.fire('click');assert(aligned.animation.getState().preview&&!aligned.animation.getState().playing);assert.equal(aligned.animation.getState().queuedBefore,4);
  aligned.buttons.play.fire('click');const savedSnapshot=test.saves.at(-1),restored=runtime(736,false,savedSnapshot);assert(restored.designs[0].animation.getState().playing);assert.equal(restored.saves.length,0);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert(reduced.designs[0].animation.getState().preview&&!reduced.designs[0].animation.getState().playing);
  for(const layout of ['silkscreen']){await snapshotFrame(layout);}
  for(const tone of Object.keys(names)){await snapshot(736,'silkscreen',null,tone+'-736',tone);await snapshot(320,'silkscreen',null,tone+'-320',tone);}
  async function snapshotFrame(layout){await snapshot(736,layout,null,layout+'-736');await snapshot(320,layout,null,layout+'-320');const p=api.createBundleProgram(false),s=p.segments.find(s=>s.row===1&&s.phase==='outlet');await snapshot(736,layout,s.start+s.duration/2,layout+'-outlet');}
  const desktop=api.createBundleProgram(false),moving=desktop.segments.find(s=>s.phase==='move');await snapshot(736,'silkscreen',moving.start+moving.duration/2,'silkscreen-moving');
  const outlet=desktop.segments.find(s=>s.row===1&&s.phase==='outlet'),release=desktop.segments.find(s=>s.row===1&&s.phase==='release'),message=desktop.segments.find(s=>s.row===1&&s.phase==='message'&&s.actor===2);
  await snapshot(736,'silkscreen',outlet.start+outlet.duration*.8,'kernel-crossing');await snapshot(736,'silkscreen',release.start+release.duration*.5,'queue-release');await snapshot(736,'silkscreen',message.start+message.duration*.5,'message-fill');
  const previous=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'../sector-bundle-pcb-studies-v4/motion.js'),'utf8')+';createBundleProgram(false)');assert(desktop.end<previous.end);
  const report={browserHostVerified:false,figure:2,variants:Object.values(names),palette:'original equals archived figure 1 palette; three alternative signals on the same navy background',paletteChecks,traceCrossings:0,inputLanes:4,outputLanesBefore:4,outputLanesAfter:1,initialView:'both rows queued',messagesPreserved:4,outboundMsgsBefore:4,outboundMsgsAfter:1,charactersPerRow:1,dividerRestored:true,movementArrows:'current move only',inputRoute:'upper left',outputRoute:'lower right',messageFillMs:350,sourceTransferDesktopMs:350,previousDurationMs:previous.end,newDurationMs:desktop.end,outlet:'16 by 10 signal crosses a kernel boundary',queueEmptiesOnReplay:true,controllerChecks:'independent manual playback, hidden palette clock, pause, static preview, saved state, resize and reduced motion',checked};fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(error=>{console.error(error);process.exitCode=1});
