const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(modules,'sharp')),canvas=require(path.join(modules,'@napi-rs/canvas'));canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');
const dir=path.resolve(__dirname,'..'),fragment=fs.readFileSync(path.join(dir,'serial-sharing-lifecycle.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8'),script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];
const api=vm.runInNewContext(source+';({createRefScene,createRefProgram,refFrame,refPreview,applyRefFrame,refPulse})');
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));
const normal=v=>JSON.parse(JSON.stringify(v)),esc=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
class Element{
  constructor(tagName,attrs={}){this.tagName=tagName;this.attrs=attrs;this.listeners={};this.textContent='';}
  get id(){return this.attrs.id;}
  getAttribute(k){return this.attrs[k]??null;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  fire(k,event={}){for(const fn of this.listeners[k]??[])fn(event);}
}
function parse(markup){const nodes=new Map();for(const m of markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)){const a=Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map(n=>[n[1],n[2]]));if(a.id){assert(!nodes.has(a.id),`Duplicate ID ${a.id}`);nodes.set(a.id,new Element(m[1],a));}}for(const m of markup.matchAll(/<text\b[^>]*\bid="([^"]+)"[^>]*>([^<]*)<\/text>/g))nodes.get(m[1]).textContent=m[2];return nodes;}
function setter(nodes){return (id,attrs,text)=>{const n=nodes.get(id);assert(n,`Missing ${id}`);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;};}
function serialize(markup,nodes){return markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,body)=>{const id=body.match(/\bid="([^"]+)"/)?.[1];return id&&nodes.has(id)?`<${tag} ${Object.entries(nodes.get(id).attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>`:all;}).replace(/(<text\b[^>]*\bid="([^"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>`${open}${esc(nodes.get(id).textContent)}${end}`).replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name],name);return colors[name];});}
async function snapshot(width,time,name){const scene=api.createRefScene(width),p=api.createRefProgram(),f=time===null?api.refPreview(p):api.refFrame(time,p),nodes=parse(scene.markup);api.applyRefFrame(scene,f,setter(nodes));const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${serialize(scene.markup,nodes)}</svg>`;fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));}
function runtime(initialWidth=736,isReduced=false,saved=null){
  let width=initialWidth,clock=100,id=0,resize;const pending=new Map(),saves=[];
  const design=new Element('section'),board=new Element('svg'),play=new Element('button'),preview=new Element('button'),status=new Element('span');
  board.children=[new Element('title'),new Element('desc')];board.nodes=new Map();board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.markup=markup;board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
  design.querySelector=s=>s==='.sharing-board'?board:s==='.sharing-status'?status:s.includes('preview')?preview:play;
  const root={querySelector:()=>design,getBoundingClientRect:()=>({width})},document=new Element('document'),window=new Element('window'),media=new Element('media');document.hidden=false;document.getElementById=name=>{assert.equal(name,'serial-sharing-lifecycle-v3');return root;};media.matches=isReduced;window.openai={widgetState:saved,setWidgetState:state=>{saves.push(state);return Promise.resolve();}};
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}},Map,Promise});
  function advance(delta=16){clock+=delta;const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(clock));}
  return {design,board,play,preview,status,document,window,media,pending,saves,advance,resize(next){width=next;resize([{contentRect:{width:next}}]);advance();}};
}
function textBounds(scene,nodes){
  const ctx=canvas.createCanvas(1,1).getContext('2d'),labels=scene.labels.map(l=>{const n=l.id&&nodes.get(l.id),text=n?n.textContent:l.label;ctx.font=`500 ${l.size}px PCB-Review`;const w=ctx.measureText(text).width,x=l.anchor==='start'?l.x:l.anchor==='end'?l.x-w:l.x-w/2;return {...l,text,x0:x,x1:x+w,y0:l.y-l.size/2,y1:l.y+l.size/2};});
  for(const l of labels){assert(l.size>=11);assert(l.x0>=-1&&l.x1<=scene.width+1,`Clipped label at ${scene.width}: ${l.text} ${l.x0}-${l.x1}`);assert(l.y0>=0&&l.y1<=scene.height,`Vertical clipping ${l.text}`);}
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];assert(!(Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)>1&&Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)>1),`Overlapping labels ${scene.width}: ${a.text} (${a.x0},${a.y}) / ${b.text} (${b.x0},${b.y})`);}
}
async function verifyLifecycle(){
  const p=api.createRefProgram(),segment=(row,phase,actor=0)=>p.segments.find(s=>s.row===row&&s.phase===phase&&s.actor===actor);
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createRefScene(width),nodes=parse(scene.markup),offset=scene.height/2,a=scene.rows[0],b=scene.rows[1],pa=a.packets[0],pb=b.packets[0];assert.equal(pa.x,pb.x);assert.equal(pa.y,pb.y-offset);assert.equal(pa.w,pb.w);assert.equal(pa.h,pb.h);
    for(let i=0;i<3;i++){assert.deepEqual(normal(a.copy[i].points),normal(b.copy[i].points.map(([x,y])=>[x,y-offset])));assert.equal(a.queues[i].cx,b.queues[i].cx);assert.equal(a.queues[i].cy,b.queues[i].cy-offset);}
    for(const row of scene.rows)for(const beams of [row.source,row.copy,row.returns])for(const beam of beams)for(const [x,y] of beam.points)assert(x>=3&&x<=width-3&&y>=3&&y<=scene.height-3,'Visible transfer stays inside diagram');
    for(let i=0;i<3;i++){const built=segment(0,'build',i),returned=segment(0,'return',i);api.applyRefFrame(scene,api.refFrame(built.end+100,p),setter(nodes));assert.equal(nodes.get(pa.title).textContent,'Msg '+(i+1));assert.equal(nodes.get(pa.content).getAttribute('opacity'),'1');assert.equal(nodes.get(pa.refGroup).getAttribute('opacity'),'0','Before has no competing Ref display');api.applyRefFrame(scene,api.refFrame(returned.start+300,p),setter(nodes));assert.equal(nodes.get(pa.content).getAttribute('opacity'),'0','Each old Msg disappears after its own return');assert.equal(nodes.get(a.pool.group).getAttribute('opacity'),'1');assert.equal(nodes.get(a.queues[i].label).textContent,'Msg');}
    for(let i=0;i<3;i++){const copying=segment(1,'copy',i);api.applyRefFrame(scene,api.refFrame(copying.start+400,p),setter(nodes));assert.equal(nodes.get(pb.content).getAttribute('opacity'),'1','One shared Msg survives every Copy');assert.equal(nodes.get(pb.title).textContent,'Msg');assert.equal(nodes.get(pb.mask).getAttribute('width'),String(pb.w-16));assert.equal(nodes.get(pb.flash).getAttribute('opacity'),'1');assert.equal(nodes.get(b.pool.group).getAttribute('opacity'),'0','Pool hidden until final owner releases');api.applyRefFrame(scene,api.refFrame(copying.end+400,p),setter(nodes));assert.equal(nodes.get(pb.ref).textContent,String(3-i));assert.equal(nodes.get(pb.content).getAttribute('opacity'),'1');}
    const finalReturn=segment(1,'return'),f=api.refFrame(finalReturn.start+400,p);api.applyRefFrame(scene,f,setter(nodes));assert.equal(nodes.get(pb.ref).textContent,'0');assert.equal(nodes.get(pb.content).getAttribute('opacity'),'0');assert.equal(nodes.get(b.returns[0].head).getAttribute('opacity'),'1');assert.equal(nodes.get(b.pool.flash).getAttribute('opacity'),'1');assert.deepEqual(normal(f.rows[1].queues),[1,1,1]);
  }
  await snapshot(736,segment(0,'build',1).end+100,'before-msg2-736');await snapshot(736,segment(0,'return',1).start+300,'before-empty-736');await snapshot(736,segment(1,'copy',1).start+400,'after-retained-736');await snapshot(736,segment(1,'return').start+400,'after-pool-736');await snapshot(320,segment(1,'return').start+400,'after-pool-320');
}
async function main(){
  await verifyLifecycle();
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));assert(!/\\"|\\n/.test(fragment.split('<script>')[0]));
  const accepted=fs.readFileSync(path.resolve(dir,'../sector-bundle-held-pulse-v26/msg-held-pulse.html'),'utf8'),prior=Object.fromEntries([...accepted.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));assert.deepEqual(colors,prior);
  const p=api.createRefProgram(),event=(row,phase,actor=0)=>p.segments.find(s=>s.row===row&&s.phase===phase&&s.actor===actor),afterAdd=event(1,'addref');
  assert.equal(p.end,19750);
  assert.equal(api.refFrame(afterAdd.start+1,p).rows[1].packets[0].ref,4);
  assert.equal(api.refFrame(event(1,'build').end,p).rows[1].packets[0].ref,1);
  for(let i=0;i<3;i++){
    assert.equal(api.refFrame(event(0,'build',i).end,p).rows[0].packets[i].ref,1);
    assert.equal(api.refFrame(event(0,'addref',i).start+1,p).rows[0].packets[i].ref,2);
    assert.equal(api.refFrame(event(0,'copy',i).end,p).rows[0].packets[i].ref,1);
    assert.equal(api.refFrame(event(0,'return',i).start+1,p).rows[0].packets[i].ref,0);
    const f=api.refFrame(event(1,'copy',i).end,p);assert.equal(f.rows[1].packets[0].ref,3-i);assert.equal(f.rows[1].copies,i+1);assert.equal(f.rows[1].queues[i],1);
  }
  const released=api.refFrame(event(1,'return').start+1,p),final=api.refFrame(p.end,p);assert.equal(released.rows[1].packets[0].ref,0);assert.deepEqual(normal(released.rows[1].queues),[1,1,1]);assert.equal(final.rows[0].builds,3);assert.equal(final.rows[1].builds,1);assert.deepEqual(normal(final.rows.map(r=>r.copies)),[3,3]);assert(final.rows.flatMap(r=>r.packets).every(packet=>packet.ref===0&&packet.freed));
  const times=new Set([0,p.end]);for(const s of p.segments)for(const delta of [0,1,s.duration/2,s.duration-1,s.duration,s.duration+1])times.add(Math.min(p.end,s.start+delta));
  for(const [age,value] of [[-1,0],[0,0],[20,.5],[40,1],[400,1],[540,1],[715,.5],[890,0]])assert.equal(api.refPulse(1000+age,1000),value);
  const checked=[];
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createRefScene(width),nodes=parse(scene.markup);assert.equal(scene.rows[0].packets.length,1);assert.equal(scene.rows[1].packets.length,1);assert.equal(scene.rows[0].queues.length,3);assert.equal(scene.rows[1].queues.length,3);
    for(const b of scene.bounds)assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=scene.height,`Offscreen ${width}/${b.role}`);
    api.applyRefFrame(scene,api.refPreview(p),setter(nodes));textBounds(scene,nodes);
    for(const time of times){const f=api.refFrame(time,p);assert(f.rows.flatMap(r=>r.packets).every(b=>b.ref>=0&&b.ref<=4));api.applyRefFrame(scene,f,setter(nodes));textBounds(scene,nodes);for(const n of nodes.values())for(const value of Object.values(n.attrs))assert(!/NaN|Infinity|undefined/.test(value),`Invalid SVG value ${value}`);}
    const test=event(1,'build').end+400;api.applyRefFrame(scene,api.refFrame(test,p),setter(nodes));assert.equal(nodes.get(scene.rows[1].packets[0].flash).getAttribute('opacity'),'1');
    for(let i=0;i<3;i++){api.applyRefFrame(scene,api.refFrame(event(1,'copy',i).end+400,p),setter(nodes));assert.equal(nodes.get(scene.rows[1].queues[i].flash).getAttribute('opacity'),'1');}
    checked.push({width,height:scene.height,frames:times.size});
  }
  const host=runtime();assert(host.design.animation.getState().preview);assert.equal(host.saves.length,0);host.play.fire('click');host.advance();host.advance(400);assert(host.design.animation.getState().playing);const paused=host.design.animation.getState().time;host.play.fire('click');host.advance(400);assert.equal(host.design.animation.getState().time,paused);host.play.fire('click');host.advance();host.advance(80);assert(host.design.animation.getState().time>paused);host.play.fire('click');
  host.design.animation.seek(event(1,'copy',1).end+400);const beforeResize=host.design.animation.getState();host.resize(320);assert.deepEqual(normal(host.design.animation.getState()),normal(beforeResize));assert.equal(host.board.getAttribute('width'),'320');
  host.play.fire('click');host.play.fire('click');const saved=host.saves.at(-1),restored=runtime(736,false,saved);assert.deepEqual(normal(restored.design.animation.getState()),normal(host.design.animation.getState()));assert.equal(restored.saves.length,0);
  host.preview.fire('click');assert(host.design.animation.getState().preview);host.window.fire('openai:set_globals',{detail:{globals:{widgetState:saved}}});assert.equal(host.design.animation.getState().time,saved.privateContent.time);
  const reduced=runtime(320,true);reduced.play.fire('click');assert(reduced.design.animation.getState().preview);assert(!reduced.design.animation.getState().playing);assert.equal(reduced.pending.size,0);
  const finish=runtime();finish.play.fire('click');for(let i=0;i<1400&&finish.design.animation.getState().playing;i++)finish.advance(16);assert.equal(finish.design.animation.getState().time,p.end);assert.equal(finish.pending.size,0);assert.equal(finish.design.animation.getState().refAfter,0);
  await snapshot(736,null,'preview-736');await snapshot(320,null,'preview-320');await snapshot(736,afterAdd.start+400,'addref-736');await snapshot(736,event(1,'copy',1).end+400,'subref-736');await snapshot(320,event(1,'copy',1).end+400,'subref-320');await snapshot(736,p.end,'final-736');
  const result={ok:true,figure:3,checked,durationMs:p.end,paletteMatched:true,alignedGeometryAndWiring:true,singleBufferPositionBothRows:true,repeatedCreationVisible:true,sharedBufferRetainedDuringCopies:true,refOnlyAfter:true,poolAppearsOnRelease:true,initialRefs:1,beforeRefSequence:[1,2,1,0],afterRefSequence:[1,4,3,2,1,0],copiesBefore:3,copiesAfter:3,createdBefore:3,createdAfter:1,sendQMode:'ring-buffer-byte-copy',refReleasedAt:'immediately-after-copy',refsZeroWhileQueueCopiesRemain:true,pulseFullHoldMs:500,textBoundsVerified:true,playPauseVerified:true,resizeRestoreVerified:true,reducedMotionVerified:true,browserHostVerified:false};fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
