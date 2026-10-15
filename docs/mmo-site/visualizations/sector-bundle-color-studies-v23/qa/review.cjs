const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'msg-color-studies.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,bundlePathPoint,bundleCharacterPose,applyBundleFrame})');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const names={"mint":"민트","lavender":"라벤더","coral":"코랄","amber":"앰버"};
const readColors=css=>Object.fromEntries([...css.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const baseColors=readColors(fragment.match(/#sector-bundle-color-studies-v23 \{([^}]+)\}/)[1]);
const palettes=Object.fromEntries(Object.keys(names).map(routing=>[routing,{...baseColors,...readColors(fragment.match(new RegExp(`#sector-bundle-color-studies-v23 \\[data-color="${routing}"\\] \\{([^}]+)\\}`))?.[1]||'')}]));
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
function serialized(markup,nodes,routing='mint'){
  let updated=markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,attrs)=>{
    const id=attrs.match(/\bid="([^\"]+)"/)?.[1];if(!id||!nodes.has(id))return all;
    return `<${tag} ${Object.entries(nodes.get(id).attrs).map(([key,v])=>`${key}="${escape(v)}"`).join(' ')}>`;
  });
  updated=updated.replace(/(<text\b[^>]*\bid="([^\"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>`${open}${escape(nodes.get(id).textContent)}${end}`);
  return updated.replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(palettes[routing][name],name);return palettes[routing][name];});
}
async function snapshot(width,layout,time,name,routing='mint'){
  const scene=api.createBundleAnimationScene(width,layout,'chamfer','minimal',routing),program=api.createBundleProgram(scene.compact),frame=time===null?api.bundlePreviewFrame(program):api.bundleFrame(time,program),nodes=parse(scene.markup);
  api.applyBundleFrame(scene,frame,setter(nodes));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${serialized(scene.markup,nodes,routing)}</svg>`;
  fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));
}
function runtime(width=736,reduced=false,saved=null){
  let actualWidth=width,timestamp=100,frameId=0,resize;const pending=new Map(),saves=[];
  const designs=Object.keys(names).map((routing,index)=>{
    const layout='silkscreen',design=new Element('section',{'data-layout':layout,'data-routing':'chamfer','data-material':'minimal','data-color':routing,'data-variant':names[routing]}),board=new Element('svg'),buttons={play:new Element('button'),preview:new Element('button')},status=new Element('span');
    design.hidden=index>0;
    board.children=[new Element('title'),new Element('desc')];board.nodes=new Map();board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.markup=markup;board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
    design.querySelector=selector=>selector==='.study-board'?board:selector==='.study-status'?status:selector.includes('preview')?buttons.preview:buttons.play;
    design.board=board;design.buttons=buttons;design.status=status;return design;
  });
  const root={querySelectorAll:()=>designs,getBoundingClientRect:()=>({width:actualWidth})},document=new Element('document'),window=new Element('window');document.hidden=false;document.getElementById=id=>{assert.equal(id,'sector-bundle-color-studies-v23');return root;};
  window.openai={widgetState:saved,setWidgetState:snapshot=>{saves.push(snapshot);return Promise.resolve();}};
  const media=new Element('media');media.matches=reduced;
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:fn=>{const id=++frameId;pending.set(id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},Map,Promise});
  function advance(delta=16){timestamp+=delta;const callbacks=Array.from(pending.values());pending.clear();callbacks.forEach(fn=>fn(timestamp));}
  return {designs,document,window,media,pending,saves,advance,resize(next){actualWidth=next;resize([{contentRect:{width:next}}]);advance();}};
}


const studyFigure=2,acceptedDir="sector-bundle-msg-color-v22",colorSpecs=[{"key":"mint","name":"민트","hex":"#79cfb0"},{"key":"lavender","name":"라벤더","hex":"#baabf4"},{"key":"coral","name":"코랄","hex":"#ef9c91"},{"key":"amber","name":"앰버","hex":"#f2bb67"}];
const normalize=value=>JSON.parse(JSON.stringify(value));
const composite=(top,bottom,alpha)=>'#'+[0,1,2].map(i=>Math.round(parseInt(top.slice(1+i*2,3+i*2),16)*alpha+parseInt(bottom.slice(1+i*2,3+i*2),16)*(1-alpha)).toString(16).padStart(2,'0')).join('');
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const opening=fragment.slice(0,fragment.indexOf('<script>'));
  assert(opening.includes('class="viz-carousel"'));assert.equal((opening.match(/class="study-design"/g)||[]).length,4);assert.equal((opening.match(/data-color="[^"]+" hidden/g)||[]).length,3);
  const allNodes=parse(opening),oldApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram,bundleFrame})');
  const checked=[],contrastChecks=[];
  for(const spec of colorSpecs){
    assert.equal(palettes[spec.key]['--pcb-data-focus'],spec.hex);
    const textRatio=contrast(baseColors['--pcb-text'],composite(spec.hex,baseColors['--pcb-empty'],.46));
    const inkRatio=contrast(baseColors['--pcb-char-ink'],composite(spec.hex,baseColors['--pcb-empty'],.8));
    assert(textRatio>=4.5);assert(inkRatio>=4.5);contrastChecks.push({name:spec.name,dataTextContrast:textRatio,brightRingNumberContrast:inkRatio});
    for(const width of [736,700,699,360,320]){
      const scene=api.createBundleAnimationScene(width,'silkscreen','chamfer','minimal',spec.key),old=oldApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup);
      assert.deepEqual(normalize(scene.metrics),normalize(old.metrics));assert.deepEqual(normalize(program),normalize(oldApi.createBundleProgram(scene.compact)));assert.equal(scene.height,old.height);
      assert(!scene.markup.includes('subject-frame'));assert(!scene.markup.includes('subject-surface'));
      for(let r=0;r<2;r++){
        const row=scene.rows[r],previous=old.rows[r];assert.deepEqual(normalize(row.character.positions),normalize(previous.character.positions));assert.deepEqual(normalize(row.packets.map(p=>p.payload)),normalize(previous.packets.map(p=>p.payload)));
        for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.deepEqual(normalize(row[beams].map(b=>b.points)),normalize(previous[beams].map(b=>b.points)));
        const targetIds=studyFigure===1?row.queue.map(q=>q.id):row.packets.map(p=>p.fill);for(const id of targetIds)assert.equal(nodes.get(id).getAttribute('fill'),'var(--pcb-data-focus)');
      }
      for(const label of scene.labels){
        ctx.font=`500 ${label.size}px PCB-Review`;const measured=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);
        assert(label.size>=11);assert(left>=-1&&left+measured<=width+1,`Label outside ${width}: ${label.label}`);
      }
      const times=program.segments.filter(s=>['move','message','queue','outlet','release','compare'].includes(s.phase)).map(s=>s.start+s.duration/2);
      for(const time of times){const frame=api.bundleFrame(time,program);assert.deepEqual(normalize(frame),normalize(oldApi.bundleFrame(time,program)));api.applyBundleFrame(scene,frame,setter(nodes));}
      const preview=api.bundlePreviewFrame(program);api.applyBundleFrame(scene,preview,setter(nodes));
      if(studyFigure===1){assert.equal(preview.rows[0].calls,4);assert.equal(preview.rows[1].calls,1);assert.equal(preview.rows[1].copies,4);assert.equal(preview.rows[1].sendLight,1);assert.equal(preview.rows[0].gray,0);assert.equal(preview.rows[1].gray,0);}
      checked.push({color:spec.name,width,height:scene.height,duration:program.end});
    }
  }
  const rt=runtime();assert.equal(rt.designs.length,4);assert.equal(rt.saves.length,0);
  for(let index=0;index<4;index++){
    rt.designs.forEach((design,i)=>{design.hidden=i!==index;});
    const design=rt.designs[index],animation=design.animation;assert.equal(animation.getState().playing,false);assert.equal(animation.getState().color,colorSpecs[index].key);
    design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>0);
    design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
    const target=animation.getProgram().segments.find(s=>s.row===1&&s.phase==='tick');animation.seek(target.start+target.duration/2);assert.equal(animation.getState().color,colorSpecs[index].key);
    design.buttons.play.fire('click');rt.advance();rt.advance(80);design.buttons.play.fire('click');
  }
  const saved=rt.saves.at(-1),restored=runtime(736,false,saved);assert.equal(restored.saves.length,0);
  for(let i=0;i<4;i++){assert.equal(restored.designs[i].animation.getState().phase,rt.designs[i].animation.getState().phase);assert.equal(restored.designs[i].animation.getState().color,colorSpecs[i].key);}
  const phases=rt.designs.map(design=>design.animation.getState().phase);rt.resize(320);
  for(let i=0;i<4;i++){assert.equal(rt.designs[i].animation.getState().phase,phases[i]);assert.equal(rt.designs[i].board.getAttribute('viewBox'),'0 0 320 1080');}
  const reduced=runtime(736,true);for(const design of reduced.designs){design.buttons.play.fire('click');assert.equal(design.animation.getState().playing,false);}assert.equal(reduced.pending.size,0);
  for(const spec of colorSpecs){await snapshot(736,'silkscreen',null,`preview-${spec.key}`,spec.key);}
  await snapshot(320,'silkscreen',null,'mobile-mint','mint');
  const report={ok:true,figure:studyFigure,bytes:Buffer.byteLength(fragment),colors:colorSpecs,checked,contrastChecks,uniqueIDs:allNodes.size,unchangedMovementAndTiming:true,nativeCarousel:true,independentPlaybackVerified:true,colorStateRestoreVerified:true,resizePreservesPhase:true,reducedMotionVerified:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
