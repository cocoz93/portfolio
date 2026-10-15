const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'ring-held-pulse.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,bundlePathPoint,bundleCharacterPose,applyBundleFrame,bundleArrivalPulse})');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const names={minimal:'데이터만 강조'};
const readColors=css=>Object.fromEntries([...css.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const baseColors=readColors(fragment.match(/#wsasend-held-pulse-v11 \{([^}]+)\}/)[1]);
const palettes=Object.fromEntries(Object.keys(names).map(routing=>[routing,{...baseColors,...readColors(fragment.match(new RegExp(`#wsasend-held-pulse-v11 \\[data-routing="${routing}"\\] \\{([^}]+)\\}`))?.[1]||'')}]));
const baseline=fs.readFileSync(path.resolve(dir,'../archive/wsasend-restored-20261012/wsasend-restored.html'),'utf8');
const baselineColors=Object.fromEntries([...baseline.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
for(const colors of Object.values(palettes))assert.deepEqual(Object.fromEntries(Object.entries(colors).filter(([key])=>!['--pcb-data-focus','--pcb-active'].includes(key))),Object.fromEntries(Object.entries(baselineColors).filter(([key])=>key!=='--pcb-active')));
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
  const root={querySelectorAll:()=>designs,getBoundingClientRect:()=>({width:actualWidth})},document=new Element('document'),window=new Element('window');document.hidden=false;document.getElementById=id=>{assert.equal(id,'wsasend-held-pulse-v11');return root;};
  window.openai={widgetState:saved,setWidgetState:snapshot=>{saves.push(snapshot);return Promise.resolve();}};
  const media=new Element('media');media.matches=reduced;
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=++frameId;pending.set(id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},Map,Promise});
  function advance(delta=16){timestamp+=delta;const callbacks=Array.from(pending.values());pending.clear();callbacks.forEach(fn=>fn(timestamp));}
  return {designs,document,window,media,pending,saves,advance,resize(next){actualWidth=next;resize([{contentRect:{width:next}}]);advance();}};
}



const pulseFigure=1,acceptedDir="wsasend-arrival-pulse-v10";
const normalize=value=>JSON.parse(JSON.stringify(value));
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const oldFragment=fs.readFileSync(path.resolve(dir,'..',acceptedDir,pulseFigure===1?'ring-arrival-pulse.html':'msg-arrival-pulse.html'),'utf8');assert.deepEqual(readColors(fragment),readColors(oldFragment));
  const oldApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram,bundleFrame})');
  for(const [age,expected] of [[-1,0],[0,0],[20,.5],[40,1],[100,1],[400,1],[540,1],[715,.5],[890,0],[1000,0]])assert.equal(api.bundleArrivalPulse(1000+age,1000),expected);
  assert.equal(api.bundleArrivalPulse(100,Infinity),0);
  const checked=[];
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width),old=oldApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup);
    assert.deepEqual(normalize(scene.metrics),normalize(old.metrics));verifyHoldTiming(program,oldApi.createBundleProgram(scene.compact));
    assert(!scene.markup.includes('subject-frame'));assert(!scene.markup.includes('subject-surface'));
    for(let r=0;r<2;r++){
      const row=scene.rows[r],previous=old.rows[r];assert.deepEqual(normalize(row.character.positions),normalize(previous.character.positions));assert.deepEqual(normalize(row.packets.map(p=>p.payload)),normalize(previous.packets.map(p=>p.payload)));
      assert.deepEqual(normalize(row.messages.map(({id,...geometry})=>geometry)),normalize(previous.messages.map(({id,...geometry})=>geometry)));
      for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.deepEqual(normalize(row[beams].map(b=>b.points)),normalize(previous[beams].map(b=>b.points)));
    }
    const stage=(row,phase,actor)=>program.segments.find(s=>s.row===row&&s.phase===phase&&(actor===undefined||s.actor===actor));
    if(pulseFigure===1){
      assert.equal((scene.markup.match(/data-role="queue-arrival-flash"/g)||[]).length,8);
      for(const rowIndex of [0,1])for(let index=0;index<4;index++){
        const segment=stage(rowIndex,'queue',index),row=scene.rows[rowIndex];
        const frame=api.bundleFrame(segment.end+400,program);api.applyBundleFrame(scene,frame,setter(nodes));
        assert.equal(nodes.get(row.queue[index].flash).getAttribute('opacity'),'1');assert.equal(nodes.get(row.queueLabels[index]).getAttribute('fill'),'var(--pcb-char-ink)');
        if(rowIndex===1)for(let j=0;j<index;j++)assert.equal(nodes.get(row.queue[j].flash).getAttribute('opacity'),'0');
      }
      const send=stage(1,'outlet'),sending=api.bundleFrame(send.start+400,program);api.applyBundleFrame(scene,sending,setter(nodes));
      for(const q of scene.rows[1].queue)assert.equal(nodes.get(q.flash).getAttribute('opacity'),'1');
      const expired=api.bundleFrame(stage(1,'queue',1).end+890,program);api.applyBundleFrame(scene,expired,setter(nodes));assert.equal(nodes.get(scene.rows[1].queue[1].flash).getAttribute('opacity'),'0');
    }else{
      assert.equal((scene.markup.match(/data-role="packet-arrival-flash"/g)||[]).length,8);
      for(const rowIndex of [0,1])for(let index=0;index<4;index++){
        const segment=stage(rowIndex,'message',index),row=scene.rows[rowIndex],frame=api.bundleFrame(segment.end+400,program);api.applyBundleFrame(scene,frame,setter(nodes));
        assert.equal(nodes.get(row.packets[index].flash).getAttribute('opacity'),'1');assert.equal(nodes.get(row.packets[index].normal[0]).getAttribute('fill'),'var(--pcb-char-ink)');
        for(let j=index+1;j<4;j++)assert.equal(nodes.get(row.packets[j].flash).getAttribute('opacity'),'0');
      }
      const bundle=stage(1,'bundle');api.applyBundleFrame(scene,api.bundleFrame(bundle.end+400,program),setter(nodes));for(const p of scene.rows[1].packets)assert.equal(nodes.get(p.flash).getAttribute('opacity'),'1');
      api.applyBundleFrame(scene,api.bundleFrame(bundle.end+890,program),setter(nodes));for(const p of scene.rows[1].packets)assert.equal(nodes.get(p.flash).getAttribute('opacity'),'0');
    }
    for(const segment of program.segments){const time=segment.start+segment.duration/2,frame=api.bundleFrame(time,program);assert(frame.rows.every(row=>row.opacity>=.28&&row.opacity<=1));api.applyBundleFrame(scene,frame,setter(nodes));}
    const final=api.bundleFrame(program.end,program);api.applyBundleFrame(scene,final,setter(nodes));
    for(const row of scene.rows){for(const q of row.queue){assert.equal(nodes.get(q.id).getAttribute('opacity'),'0');if(q.flash)assert.equal(nodes.get(q.flash).getAttribute('opacity'),'0');}for(const p of row.packets)if(p.flash){assert.equal(nodes.get(p.flash).getAttribute('opacity'),'0');assert.equal(nodes.get(p.normal[0]).getAttribute('fill'),'var(--pcb-text)');}}
    for(const label of scene.labels){ctx.font=`500 ${label.size}px PCB-Review`;const w=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?w/2:label.anchor==='end'?w:0);assert(label.size>=11);assert(left>=-1&&left+w<=width+1);}
    api.applyBundleFrame(scene,api.bundlePreviewFrame(program),setter(nodes));checked.push({width,height:scene.height,duration:program.end});
  }
  const rt=runtime(),design=rt.designs[0],animation=design.animation;
  assert.equal(animation.getState().preview,true);assert.equal(rt.saves.length,0);design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>0);
  design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  const event=animation.getProgram().segments.find(s=>s.row===1&&s.phase===(pulseFigure===1?'queue':'bundle')&&(pulseFigure===2||s.actor===3));animation.seek(event.end+400);const phase=animation.getState().phase;
  design.buttons.play.fire('click');rt.advance();design.buttons.play.fire('click');const restored=runtime(736,false,rt.saves.at(-1));assert.equal(restored.designs[0].animation.getState().phase,phase);rt.resize(320);assert.equal(animation.getState().phase,phase);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);assert.equal(reduced.pending.size,0);
  for(const width of [736,320]){
    const program=api.createBundleProgram(width<700),stage=(row,phase,actor)=>program.segments.find(s=>s.row===row&&s.phase===phase&&(actor===undefined||s.actor===actor));await snapshot(width,'silkscreen',null,`preview-${width}`);
    if(pulseFigure===1){await snapshot(width,'silkscreen',stage(1,'queue',2).end+400,`arrival-${width}`);await snapshot(width,'silkscreen',stage(1,'outlet').start+400,`send-${width}`);await snapshot(width,'silkscreen',stage(1,'queue',2).end+890,`settled-${width}`);}
    else {await snapshot(width,'silkscreen',stage(1,'message',2).end+400,`arrival-${width}`);await snapshot(width,'silkscreen',stage(1,'bundle').end+400,`complete-${width}`);await snapshot(width,'silkscreen',stage(1,'bundle').end+890,`settled-${width}`);}
  }
  const report={ok:true,figure:pulseFigure,bytes:Buffer.byteLength(fragment),checked,pulseRiseMs:40,pulseHoldUntilMs:540,pulseFullHoldMs:500,pulseFadeMs:350,arrivalOnly:true,emptySlotsNeverLit:true,completionSynchronizationVerified:true,restColorRestored:true,paletteAndGeometryPreserved:true,targetedHoldsExtended:true,playPauseVerified:true,resizeAndRestoreVerified:true,reducedMotionVerified:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}

function verifyHoldTiming(program,previous){
  assert.equal(program.segments.length,previous.segments.length);
  let extra=0;
  for(let i=0;i<program.segments.length;i++){
    const current=program.segments[i],old=previous.segments[i];
    for(const key of ['row','phase','actor','label'])assert.equal(current[key],old[key]);
    let expected=old.duration;
    if(pulseFigure===1&&current.phase==='outlet')expected=650;
    if(current.row===1&&current.phase==='hold')expected=550;
    assert.equal(current.duration,expected);extra+=expected-old.duration;
  }
  assert.equal(program.end,previous.end+extra);
  assert.equal(extra,pulseFigure===1?2810:1850);
}

main().catch(error=>{console.error(error);process.exitCode=1;});
