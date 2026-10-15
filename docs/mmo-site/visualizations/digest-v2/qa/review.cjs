const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',sharp=require(path.join(modules,'sharp')),canvas=require(path.join(modules,'@napi-rs/canvas'));
canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/consola.ttf','PCB-Code-Review');
const dir=path.resolve(__dirname,'..'),fragment=fs.readFileSync(path.join(dir,'figure-4.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8'),script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];
const api=vm.runInNewContext(source+';({createDigestScene,createDigestProgram,digestFrame,applyDigestFrame,digestPoint})'),program=api.createDigestProgram();
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]])),normal=v=>JSON.parse(JSON.stringify(v));
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
class E{constructor(tag,attrs={}){this.tagName=tag;this.attrs=attrs;this.listeners={};this.textContent='';}get id(){return this.attrs.id;}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}fire(k,event={}){for(const fn of this.listeners[k]??[])fn(event);}}
function parse(markup){const nodes=new Map();for(const m of markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)){const a=Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map(n=>[n[1],n[2]]));if(a.id){assert(!nodes.has(a.id),'Duplicate ID '+a.id);nodes.set(a.id,new E(m[1],a));}}return nodes;}
function setter(nodes){return(id,attrs,text)=>{const n=nodes.get(id);assert(n,'Missing '+id);for(const [k,v] of Object.entries(attrs)){if(typeof v==='number')assert(Number.isFinite(v));n.setAttribute(k,v);}if(text!==undefined)n.textContent=text;};}
function serialize(markup,nodes){return markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,body)=>{const id=body.match(/\bid="([^"]+)"/)?.[1];return id&&nodes.has(id)?`<${tag} ${Object.entries(nodes.get(id).attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>`:all;}).replace(/(<text\b[^>]*\bid="([^"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>open+esc(nodes.get(id).textContent||body)+end).replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name]);return colors[name];});}
async function snapshot(width,time,name){const scene=api.createDigestScene(width),nodes=parse(scene.markup);api.applyDigestFrame(scene,api.digestFrame(time,program),setter(nodes));const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:'Malgun Gothic',sans-serif;font-weight:500}.sector-mono{font-family:Consolas,monospace}</style>${serialize(scene.markup,nodes)}</svg>`;fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));}
function runtime({width:initialWidth=736,saved=null,reduced=false,echo=false}={}){
  let clock=0,id=0,width=initialWidth;const pending=new Map(),timers=new Map(),saves=[],document=new E('document'),window=new E('window'),media=new E('media'),root=new E('div'),board=new E('svg'),play=new E('button'),reset=new E('button'),status=new E('div');let resize;
  root.querySelector=s=>s==='.digest-board'?board:s.includes('play')?play:s.includes('reset')?reset:status;root.getBoundingClientRect=()=>({width});
  board.children=[new E('title'),new E('desc')];board.replaceChildren=(...c)=>{board.children=c;};board.insertAdjacentHTML=(_,markup)=>{board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
  document.getElementById=id=>{assert.equal(id,'digest-figure-four-v2');return root;};media.matches=reduced;
  window.openai={widgetState:saved,setWidgetState:s=>{saves.push(s);if(echo)window.fire('openai:set_globals',{detail:{globals:{widgetState:s}}});return Promise.resolve();}};
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,Map,Promise,performance:{now:()=>clock},setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}}});
  return {root,board,play,reset,status,window,media,pending,timers,saves,advance(delta=16,{raf=true}={}){clock+=delta;if(raf)for(const [key,fn]of[...pending])if(pending.delete(key))fn(clock);for(const[key,value]of[...timers])if(value.at<=clock&&timers.delete(key))value.fn();},resize(w){width=w;resize([{contentRect:{width:w}}]);}};
}
async function main(){
  new vm.Script(script);assert(Buffer.byteLength(fragment)<1_000_000);assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));assert(!/<!doctype|<html\b|<body\b|<head\b/i.test(fragment));parse(fragment.split('<script>')[0]);
  const final=api.digestFrame(program.end,program);assert.deepEqual(normal(final.rows.map(r=>r.calls)),[[9,9],[1,1]]);assert.deepEqual(normal(final.rows[0].queues),normal(final.rows[1].queues));assert(final.rows[1].joined.every(v=>v===1));
  for(const s of program.segments.filter(s=>s.row===1&&s.phase==='deliver'))assert(api.digestFrame(s.start,program).rows[1].joined.every(v=>v===1),'Digest must be complete before each resident request');
  assert.equal(program.segments.filter(s=>s.row===1&&s.phase==='concat').length,9,'Each of 9 packets concatenated once, outside resident loop');
  assert.equal(program.segments.filter(s=>s.row===0&&s.phase==='deliver').length,18);assert.equal(program.segments.filter(s=>s.row===1&&s.phase==='deliver').length,2);
  const firstResidentDone=program.segments.find(s=>s.row===1&&s.phase==='hold'&&s.recipient===0),shared=api.digestFrame(firstResidentDone.start,program).rows[1];
  assert(shared.joined.every(v=>v===1),'Digest remains intact for the next resident');assert.deepEqual(normal(shared.calls),[1,0]);assert(shared.queues[0].every(v=>v===1)&&shared.queues[1].every(v=>v===0),'Separate SendQs with one whole-digest Copy per resident');
  const widths=[1024,736,700,699,360,320],times=new Set([0,program.end]);for(const s of program.segments)for(const p of [0,.01,.5,.99,1])times.add(s.start+(s.end-s.start)*p);
  const ctx=canvas.createCanvas(1,1).getContext('2d');
  for(const width of widths){const scene=api.createDigestScene(width),nodes=parse(scene.markup);for(const b of scene.bounds)assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=scene.height,'Bounds '+JSON.stringify(b));
    for(const label of scene.labels){if(label.local)continue;ctx.font=`500 ${label.size}px ${/^Msg|RequestSend|^[123]$/.test(label.text)?'PCB-Code-Review':'PCB-Review'}`;const w=ctx.measureText(label.text).width,left=label.anchor==='start'?label.x:label.anchor==='end'?label.x-w:label.x-w/2;assert(left>=0&&left+w<=width&&label.y>=0&&label.y<=scene.height,'Text outside: '+width+' '+JSON.stringify({...label,left,w}));}
    for(const points of scene.paths)for(const p of points)assert(p[0]>=0&&p[0]<=width&&p[1]>=0&&p[1]<=scene.height,'Circuit outside bounds');
    const markupIds=new Set(nodes.keys());for(const m of scene.markup.matchAll(/href="#([^"]+)"/g))assert(markupIds.has(m[1]),'Unresolved character');
    assert.equal(scene.rows[1].source.length,9,'All nine source sectors contain a visible packet');assert.equal(scene.rows[1].queue.length,2,'Two residents inside R');
    for(const t of times){const frame=api.digestFrame(t,program);api.applyDigestFrame(scene,frame,setter(nodes));for(const row of frame.rows){assert(row.calls.every(c=>Number.isInteger(c)&&c>=0&&c<=9));assert(row.built.every(v=>v>=0&&v<=1));assert(row.joined.every(v=>v>=0&&v<=1));}
      const active=frame.activeRow;if(active<2&&active>=0)assert.equal(nodes.get(scene.rows[1-active].group).attrs.opacity,'0.27');
      for(const row of scene.rows){const traveler=nodes.get(row.traveler);if(traveler.attrs.opacity==='1'){const [x,y]=traveler.attrs.transform.match(/[-\d.]+/g).map(Number);assert(x-23>=0&&x+23<=width&&y-11>=0&&y+11<=scene.height,'Traveler inside scene');}}
    }
    for(const row of scene.rows)for(const points of [...row.requests.flat(),...row.deliveries,...row.concat]){
      const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=distances.reduce((a,b)=>a+b,0);const p1=api.digestPoint(points,.00001),p2=api.digestPoint(points,.00002);assert(Math.abs(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])-total*.00001)<.0001,'Constant initial travel speed');
    }
  }
  const r=runtime({echo:true});assert.equal(r.root.animation.getState().time,program.end);assert.equal(r.saves.length,0);assert.equal(r.pending.size,0,'No autoplay');r.play.fire('click');r.advance(1200);assert(r.root.animation.getState().playing);r.play.fire('click');const paused=r.root.animation.getState().time;r.advance(500);assert.equal(r.root.animation.getState().time,paused);r.resize(320);assert.equal(r.board.attrs.width,'320');assert.equal(r.root.animation.getState().time,paused);
  r.play.fire('click');r.advance(program.end);assert.equal(r.root.animation.getState().time,program.end);assert.equal(r.root.animation.getState().playing,false);assert.deepEqual(normal(r.root.animation.getState().callsAfter),[1,1]);assert.equal(r.pending.size,0);r.reset.fire('click');assert.equal(r.root.animation.getState().time,0);
  const restored=runtime({saved:{privateContent:{kind:'digest-figure-four-v2',revision:'old',time:1000}}});assert.equal(restored.root.animation.getState().time,1000);assert.equal(restored.root.animation.getState().playing,false);assert.equal(restored.saves.length,0);
  const reduced=runtime({reduced:true});reduced.reset.fire('click');reduced.play.fire('click');assert.equal(reduced.root.animation.getState().time,program.end);assert.equal(reduced.pending.size,0);
  const fallback=runtime();fallback.play.fire('click');fallback.advance(program.end,{raf:false});assert.equal(fallback.root.animation.getState().time,program.end);
  const event=(row,phase,item=-1,recipient=-1)=>program.segments.find(s=>s.row===row&&s.phase===phase&&s.item===item&&s.recipient===recipient);
  await snapshot(736,program.end,'final-736');await snapshot(320,program.end,'final-320');
  const before=event(0,'hold',1,0);await snapshot(736,before.start+80,'before-second-packet');
  const ready=event(1,'digest-ready');await snapshot(736,ready.start+80,'digest-ready');
  const sent=event(1,'hold',-1,0);await snapshot(736,sent.start+80,'digest-first-resident');
  const report={pass:true,widths,frames:times.size,durationMs:program.end,example:{validSectors:9,packetsPerSector:1,packets:9,residents:2,callsBefore:[9,9],callsAfter:[1,1],identicalBytesPerResident:true,digestConcatenationsPerReceivingSector:1},functionalRuntimeVerified:true,browserHostVerified:false,bytes:Buffer.byteLength(fragment),sha256:crypto.createHash('sha256').update(fragment).digest('hex')};fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
