const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'ring-color.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,bundlePathPoint,bundleCharacterPose,applyBundleFrame})');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const names={minimal:'데이터만 강조'};
const readColors=css=>Object.fromEntries([...css.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const baseColors=readColors(fragment.match(/#wsasend-ring-color-v7 \{([^}]+)\}/)[1]);
const palettes=Object.fromEntries(Object.keys(names).map(routing=>[routing,{...baseColors,...readColors(fragment.match(new RegExp(`#wsasend-ring-color-v7 \\[data-routing="${routing}"\\] \\{([^}]+)\\}`))?.[1]||'')}]));
const baseline=fs.readFileSync(path.resolve(dir,'../archive/wsasend-restored-20261012/wsasend-restored.html'),'utf8');
const baselineColors=Object.fromEntries([...baseline.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
for(const colors of Object.values(palettes))assert.deepEqual(Object.fromEntries(Object.entries(colors).filter(([key])=>key!=='--pcb-data-focus')),baselineColors,'All existing colors preserved');
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
  const root={querySelectorAll:()=>designs,getBoundingClientRect:()=>({width:actualWidth})},document=new Element('document'),window=new Element('window');document.hidden=false;document.getElementById=id=>{assert.equal(id,'wsasend-ring-color-v7');return root;};
  window.openai={widgetState:saved,setWidgetState:snapshot=>{saves.push(snapshot);return Promise.resolve();}};
  const media=new Element('media');media.matches=reduced;
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=++frameId;pending.set(id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},Map,Promise});
  function advance(delta=16){timestamp+=delta;const callbacks=Array.from(pending.values());pending.clear();callbacks.forEach(fn=>fn(timestamp));}
  return {designs,document,window,media,pending,saves,advance,resize(next){actualWidth=next;resize([{contentRect:{width:next}}]);advance();}};
}

const colorFigure=1,acceptedDir="wsasend-ring-light-v4";
const normalize=value=>JSON.parse(JSON.stringify(value));
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const oldApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,applyBundleFrame})');
  const checked=[];
  const canonicalAttributes=markup=>Array.from(markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)).map(m=>({tag:m[1],attrs:Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^\"]*)"/g)].filter(a=>!['id','href','filter','clip-path'].includes(a[1])).map(a=>[a[1],a[2]]))}));
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width),old=oldApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),oldProgram=oldApi.createBundleProgram(scene.compact),nodes=parse(scene.markup),oldNodes=parse(old.markup);
    assert.deepEqual(normalize(scene.metrics),normalize(old.metrics));assert.deepEqual(normalize(program),normalize(oldProgram));
    assert(!scene.markup.includes('subject-frame'));assert(!scene.markup.includes('subject-surface'));
    const actualMarks=canonicalAttributes(scene.markup),oldMarks=canonicalAttributes(old.markup);assert.equal(actualMarks.length,oldMarks.length);
    let altered=0;
    for(let i=0;i<actualMarks.length;i++){
      const actual=actualMarks[i],previous=oldMarks[i];assert.equal(actual.tag,previous.tag);
      for(const key of new Set([...Object.keys(actual.attrs),...Object.keys(previous.attrs)])){
        if(actual.attrs[key]===previous.attrs[key])continue;
        assert(['fill','stroke'].includes(key),`Unexpected geometry/style change: ${key}`);assert.equal(actual.attrs[key],'var(--pcb-data-focus)');assert.equal(previous.attrs[key],'var(--pcb-active)');
        if(colorFigure===1)assert(['individual-msg-region','queue-lit-outline'].includes(actual.attrs['data-role']));
        else assert(['payload-lit-fill','data-ready-strip'].includes(actual.attrs['data-role']));altered++;
      }
    }
    assert.equal(altered,16);
    for(let r=0;r<2;r++){
      assert.deepEqual(normalize(scene.rows[r].character.positions),normalize(old.rows[r].character.positions));
      assert.deepEqual(normalize(scene.rows[r].packets.map(p=>p.payload)),normalize(old.rows[r].packets.map(p=>p.payload)));
      for(const beams of ['sourceBeams','copyBeams','outletBeams']){
        assert.deepEqual(normalize(scene.rows[r][beams].map(b=>b.points)),normalize(old.rows[r][beams].map(b=>b.points)));
        for(const beam of scene.rows[r][beams]){assert.equal(nodes.get(beam.trace).getAttribute('stroke'),'var(--pcb-active)');assert.equal(nodes.get(beam.head).getAttribute('fill'),'var(--pcb-active)');}
      }
    }
    for(const segment of program.segments){
      const frame=api.bundleFrame(segment.start+segment.duration/2,program),oldFrame=oldApi.bundleFrame(segment.start+segment.duration/2,oldProgram);assert.deepEqual(normalize(frame),normalize(oldFrame));
      api.applyBundleFrame(scene,frame,setter(nodes));oldApi.applyBundleFrame(old,oldFrame,setter(oldNodes));
      const newEntries=Array.from(nodes.values()),oldEntries=Array.from(oldNodes.values());assert.equal(newEntries.length,oldEntries.length);
      for(let i=0;i<newEntries.length;i++){
        for(const key of ['opacity','fill-opacity','width','transform','stroke-dashoffset','data-facing'])assert.equal(newEntries[i].getAttribute(key),oldEntries[i].getAttribute(key));
        assert.equal(newEntries[i].textContent,oldEntries[i].textContent);
      }
      if(segment.phase==='message'){
        const packet=scene.rows[segment.row].packets[segment.actor];assert.equal(Number(nodes.get(packet.mask).getAttribute('width')),packet.width/2);
      }
    }
    api.applyBundleFrame(scene,api.bundlePreviewFrame(program),setter(nodes));
    for(const label of scene.labels){
      ctx.font=`500 ${label.size}px PCB-Review`;const measured=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);
      assert(label.size>=11);assert(left>=-1&&left+measured<=width+1,`Label outside ${width}: ${label.label}`);
      assert(label.y-label.size/2>=0&&label.y+label.size/2<=scene.height);
    }
    const final=api.bundleFrame(program.end,program);api.applyBundleFrame(scene,final,setter(nodes));
    for(let r=0;r<2;r++){const row=scene.rows[r],state=final.rows[r];assert(state.moves.every(v=>v===1));assert(state.packets.every(v=>v===1));assert.equal(state.gray,0);assert.equal(state.opacity,1);for(const q of row.queue)assert.equal(nodes.get(q.id).getAttribute('opacity'),'0');}
    if(colorFigure===1){assert.equal(final.rows[0].calls,4);assert.equal(final.rows[1].calls,1);assert.equal(final.rows[0].copies,0);assert.equal(final.rows[1].copies,0);}
    else {assert.equal(scene.rows[0].messages.length,4);assert.equal(scene.rows[1].messages.length,1);assert.equal(final.rows[0].copies,4);assert.equal(final.rows[1].copies,1);}
    checked.push({width,height:scene.height,duration:program.end,colorOnlyChanges:altered});
  }
  const rt=runtime(),design=rt.designs[0],animation=design.animation;
  assert.equal(animation.getState().preview,true);assert.equal(animation.getState().playing,false);assert.equal(rt.saves.length,0);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>0);
  design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>paused);
  const target=animation.getProgram().segments.find(s=>s.row===1&&s.phase==='tick');animation.seek(target.start+target.duration/2);const phase=animation.getState().phase;
  rt.resize(320);assert.equal(animation.getState().phase,phase);assert.equal(design.board.getAttribute('viewBox'),'0 0 320 1080');
  design.buttons.play.fire('click');rt.advance();rt.advance(80);design.buttons.play.fire('click');const restored=runtime(736,false,rt.saves.at(-1));assert.equal(restored.designs[0].animation.getState().phase,animation.getState().phase);assert.equal(restored.saves.length,0);
  design.buttons.preview.fire('click');assert.equal(animation.getState().preview,true);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);assert.equal(reduced.pending.size,0);
  for(const [folder,file,hash] of [
    ['wsasend-ring-light-v4','queue-light.html','3431e454ad51b28872379eaf4e01d58f4dd3b6b0e0bcf3bdf1193fcae039e97d'],
    ['sector-bundle-before-speed-v18','before-speed.html','41d9ad560871c9045803e4501011c81c384edb74da648177332d6c35420d3ace']
  ])assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'..',folder,file))).digest('hex'),hash);
  for(const width of [736,320]){
    const program=api.createBundleProgram(width<700),stage=(row,phase,actor)=>program.segments.find(s=>s.row===row&&s.phase===phase&&(actor===undefined||s.actor===actor));
    await snapshot(width,'silkscreen',null,`preview-${width}`);
    if(colorFigure===1){await snapshot(width,'silkscreen',stage(0,'queue',0).end,`before-ring-${width}`);await snapshot(width,'silkscreen',stage(1,'queue',3).end+100,`after-ring-${width}`);}
    else {await snapshot(width,'silkscreen',stage(0,'message',3).end,`before-msg-${width}`);await snapshot(width,'silkscreen',stage(1,'bundle').end+100,`after-msg-${width}`);}
  }
  const report={ok:true,figure:colorFigure,targetColor:baseColors['--pcb-data-focus'],checked,onlyTargetColorChanged:true,originalContrastAndTimingRestored:true,acceptedOriginalsPreserved:true,playPauseVerified:true,stateRestoreVerified:true,resizePreservesPhase:true,reducedMotionVerified:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
