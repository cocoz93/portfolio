const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',sharp=require(path.join(modules,'sharp')),canvas=require(path.join(modules,'@napi-rs/canvas'));canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/consola.ttf','PCB-Code-Review');
const dir=path.resolve(__dirname,'..'),fragment=fs.readFileSync(path.join(dir,'sector-reuse.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8'),script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];
const api=vm.runInNewContext(source+';({createSectorReuseScene,createReuseProgram,sectorFrame,applySectorFrame})'),colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]])),problems=[],widths=[1024,736,700,699,360,320];
const normal=v=>JSON.parse(JSON.stringify(v)),esc=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
class E{constructor(tag,attrs={}){this.tagName=tag;this.attrs=attrs;this.listeners={};this.textContent='';}get id(){return this.attrs.id;}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}fire(k,event={}){for(const fn of this.listeners[k]??[])fn(event);}}
function parse(markup){const nodes=new Map();for(const m of markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)){const a=Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map(n=>[n[1],n[2]]));if(a.id){assert(!nodes.has(a.id),'Duplicate ID '+a.id);nodes.set(a.id,new E(m[1],a));}}return nodes;}
function setter(nodes){return (id,attrs,text)=>{const n=nodes.get(id);assert(n,'Missing '+id);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;};}
function boundsCheck(s){const ctx=canvas.createCanvas(1,1).getContext('2d'),ls=s.labels.map(l=>{ctx.font=`500 ${l.size}px ${/^(Msg(?: \d+| 풀)?|Ref \d+)$/.test(l.text)?'PCB-Code-Review':'PCB-Review'}`;const w=ctx.measureText(l.text).width,x=l.anchor==='start'?l.x:l.anchor==='end'?l.x-w:l.x-w/2;return {...l,x0:x,x1:x+w,y0:l.y-l.size/2,y1:l.y+l.size/2};});for(const l of ls){assert(l.size>=11);if(l.x0<0||l.x1>s.width||l.y0<0||l.y1>s.height)problems.push({width:s.width,type:'clipped',label:l.text});}for(let i=0;i<ls.length;i++)for(let j=i+1;j<ls.length;j++){const a=ls[i],b=ls[j];if(a.exclusive&&a.exclusive===b.exclusive)continue;if(Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)>1&&Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)>1)problems.push({width:s.width,type:'label-overlap',a:a.text,b:b.text});}for(let i=0;i<s.bounds.length;i++)for(let j=i+1;j<s.bounds.length;j++){const a=s.bounds[i],b=s.bounds[j];if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0)problems.push({width:s.width,type:'component-overlap',a:a.role,b:b.role});}for(const l of ls)for(const b of s.bounds){const inside=l.x0>=b.x-1&&l.x1<=b.x+b.w+1&&l.y0>=b.y-1&&l.y1<=b.y+b.h+1,intersect=Math.min(l.x1,b.x+b.w)-Math.max(l.x0,b.x)>1&&Math.min(l.y1,b.y+b.h)-Math.max(l.y0,b.y)>1;if(intersect&&!inside)problems.push({width:s.width,type:'label-component-edge',label:l.text,role:b.role});}for(const l of ls)for(const row of s.rows)for(const beam of row.copies)for(let i=1;i<beam.points.length;i++){const [x1,y1]=beam.points[i-1],[x2,y2]=beam.points[i];const hit=x1===x2?x1>l.x0+2&&x1<l.x1-2&&Math.min(l.y1,Math.max(y1,y2))-Math.max(l.y0,Math.min(y1,y2))>2:y1>l.y0+2&&y1<l.y1-2&&Math.min(l.x1,Math.max(x1,x2))-Math.max(l.x0,Math.min(x1,x2))>2;if(hit)problems.push({width:s.width,type:'label-on-trace',label:l.text});}}
function serialize(markup,nodes){return markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,body)=>{const id=body.match(/\bid="([^"]+)"/)?.[1];return id&&nodes.has(id)?`<${tag} ${Object.entries(nodes.get(id).attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>`:all;}).replace(/(<text\b[^>]*\bid="([^"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>`${open}${esc(nodes.get(id).textContent||body)}${end}`).replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name]);return colors[name];});}
async function snapshot(width,time,name){const s=api.createSectorReuseScene(width),p=api.createReuseProgram(),nodes=parse(s.markup);api.applySectorFrame(s,api.sectorFrame(time??0,p,time===null),setter(nodes));const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}.sector-mono{font-family:PCB-Code-Review,monospace}</style>${serialize(s.markup,nodes)}</svg>`;fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));}

function runtime({width:initialWidth=736,reduced=false,saved=null,sourceScript=script,rootId='serial-sector-current',echo=false}={}){
  let width=initialWidth,clock=100,id=0,resize;const pending=new Map(),timers=new Map(),saves=[],root=new E('div'),board=new E('svg'),play=new E('button'),preview=new E('button'),status=new E('span'),document=new E('document'),window=new E('window'),media=new E('media');
  root.getBoundingClientRect=()=>({width});root.querySelector=s=>s==='.sector-board'?board:s==='.sector-status'?status:s.includes('preview')?preview:play;
  board.children=[new E('title'),new E('desc')];board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
  document.hidden=false;document.getElementById=id=>{assert.equal(id,rootId);return root;};media.matches=reduced;
  window.openai={widgetState:saved,setWidgetState:state=>{saves.push(state);if(echo)window.fire('openai:set_globals',{detail:{globals:{widgetState:state}}});return Promise.resolve();}};
  vm.runInNewContext(sourceScript,{document,window,matchMedia:()=>media,Map,Promise,performance:{now:()=>clock},setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){} }});
  return {root,board,play,preview,status,document,window,media,pending,timers,saves,advance(delta=16,{raf=true,timer=true}={}){clock+=delta;if(raf){const callbacks=[...pending.entries()];for(const [key,fn] of callbacks){if(pending.delete(key))fn(clock);}}if(timer){const callbacks=[...timers.entries()];for(const [key,value] of callbacks){if(value.at<=clock&&timers.delete(key))value.fn();}}},resize(next){width=next;resize([{contentRect:{width:next}}]);}};
}



async function main(){
  const previous=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'../serial-sector-presentation-v12/scene.js'),'utf8')+';({createSectorReuseScene})');
  const program=api.createReuseProgram(),event=(row,phase,actor=0)=>program.segments.find(s=>s.row===row&&s.phase===phase&&s.actor===actor);
  const normalize=v=>JSON.parse(JSON.stringify(v).replaceAll('sector-restored-current','sector-presentation-v12'));
  const times=new Set([0,program.end]);
  for(const s of program.segments)for(const p of [0,.15,.3,.5,.75,.95,1])times.add(Math.min(program.end,s.start+s.duration*p));
  for(const width of widths){
    const scene=api.createSectorReuseScene(width),old=previous.createSectorReuseScene(width);boundsCheck(scene);
    assert.equal(scene.width,old.width);assert.equal(scene.height,old.height);
    assert.deepEqual(normalize(scene.bounds.filter(b=>b.role!=='msg-pool')),normal(old.bounds.filter(b=>b.role!=='msg-pool')),'Map, Msg and SendQ geometry stays fixed');
    assert.equal([...scene.markup.matchAll(/data-character="mage"/g)].length,8);assert(!/-ghost|-origin-A|-other-/.test(scene.markup));
    for(let row=0;row<2;row++){
      const a=scene.rows[row],w=scene.worlds[row];
      assert.equal(a.pool.cy,scene.height/2*row+(scene.compact?348:88));
      assert(a.pool.y<Math.min(...a.messages.map(m=>m.y)));assert(a.pool.right<a.messages[0].left);
      assert.deepEqual(normal(w.start),[w.x+30,w.y+90]);assert.deepEqual(normal(w.end),[w.x+90,w.y+90]);
      for(let i=0;i<3;i++){
        assert.equal(w.recipientBoxes[i].cx,w.x+150);assert.equal(w.recipientBoxes[i].cy,w.y+30+i*60);
        const points=w.notices[i].points;assert.equal(points.length,2);
        const dx=points[1][0]-points[0][0],dy=points[1][1]-points[0][1];assert(dx>0);
        if(i===1)assert.equal(dy,0);else assert.equal(Math.abs(dx),Math.abs(dy));
        const input=a.inputCircuits[i];assert.equal(a.requests[i].type,'request');
        assert.deepEqual(normal(input.rawPoints[0]),[w.recipientBoxes[i].right+4,w.recipientBoxes[i].cy]);
        for(let k=1;k<input.rawPoints.length;k++){const u=input.rawPoints[k-1],v=input.rawPoints[k];assert(u[0]===v[0]||u[1]===v[1]);}
      }
      for(const route of [...a.inputCircuits,a.allocationTrunk,...a.allocationBranches]){
        for(let i=0;i<route.points.length;i++){
          const [x,y]=route.points[i];assert(x>=0&&x<=scene.width&&y>=0&&y<=scene.height);
          if(i){const u=route.points[i-1],dx=Math.abs(x-u[0]),dy=Math.abs(y-u[1]);assert(dx===0||dy===0||Math.abs(dx-dy)<1e-6);}
        }
      }
      for(let i=0;i<a.messages.length;i++){
        const m=a.messages[i];assert.deepEqual(normal(a.allocations[i].points.at(-1)),[m.cx,m.dataCy]);
        assert.deepEqual(normal(a.returns[i].points[0]),[m.cx,m.dataCy]);
        assert.deepEqual(normal(a.allocations[i].glyphOffset),[0,-(scene.compact?11:12)]);
        assert.deepEqual(normal(a.allocations[i].glyphSize),[m.w,m.h]);
      }
    }
    const nodes=parse(scene.markup),set=setter(nodes);
    api.applySectorFrame(scene,api.sectorFrame(0,program),set);
    for(const row of scene.rows){for(const m of row.messages)assert.equal(nodes.get(m.group).getAttribute('opacity'),'0','Initial Msg frames are absent');assert.equal(nodes.get(row.allocationTrunk.id).getAttribute('opacity'),'0');}
    for(const t of times){
      const frame=api.sectorFrame(t,program);api.applySectorFrame(scene,frame,set);
      assert(frame.rows[0].messages.filter(m=>m.live).length<=1,'At most one before Msg is in use');
      for(let row=0;row<2;row++)for(let i=0;i<scene.rows[row].messages.length;i++){
        const m=scene.rows[row].messages[i],state=frame.rows[row].messages[i],opacity=Number(nodes.get(m.group).getAttribute('opacity'));
        const arriving=frame.rows[row].transfer?.kind==='allocation'&&frame.rows[row].transfer.actor===i;
        if(!state.live&&!arriving)assert.equal(opacity,0,'Unallocated and returned Msg frames are absent');
      }
      for(const n of nodes.values())for(const value of Object.values(n.attrs))assert(!/NaN|Infinity|undefined|\[object Object\]/.test(value));
      for(const row of scene.rows)for(const flight of [...row.requests,...row.allocations,...row.returns,...row.copies]){
        const n=nodes.get(flight.carrier);if(Number(n.getAttribute('opacity'))<=0)continue;
        const transform=n.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/);assert(transform);
        const [x,y,scale]=transform.slice(1).map(Number),[w,h]=flight.glyphSize,[ox,oy]=flight.glyphOffset;
        assert(x+(ox-w/2)*scale>=0&&x+(ox+w/2)*scale<=scene.width&&y+(oy-h/2)*scale>=0&&y+(oy+h/2)*scale<=scene.height,'Moving objects fit');
      }
    }
    for(let i=0;i<3;i++){
      const alloc=event(0,'allocate',i),release=event(0,'release',i),copy=event(0,'copy',i);
      const f=api.sectorFrame(alloc.start+alloc.duration*.15,program);api.applySectorFrame(scene,f,set);
      assert.equal(nodes.get(scene.rows[0].requests[i].carrier).getAttribute('opacity'),'1');assert.equal(nodes.get(scene.rows[0].allocations[i].carrier).getAttribute('opacity'),'0');
      assert.equal(f.rows[0].created,i);
      const source=api.sectorFrame(alloc.start+alloc.duration*.6,program);api.applySectorFrame(scene,source,set);assert.equal(source.rows[0].created,i+1);assert(Number(nodes.get(scene.rows[0].allocations[i].carrier).getAttribute('opacity'))>0);
      const afterReturn=api.sectorFrame(release.end+1,program);api.applySectorFrame(scene,afterReturn,set);assert.equal(nodes.get(scene.rows[0].messages[i].group).getAttribute('opacity'),'0');assert(afterReturn.rows[0].queues[i].filled);
      assert(copy.start>alloc.end&&release.start>copy.end);if(i<2)assert(event(0,'allocate',i+1).start>release.end);
    }
    for(let i=0;i<3;i++){
      const copy=event(1,'copy',i),f=api.sectorFrame(copy.start+copy.duration/2,program);assert(f.rows[1].messages[0].live&&f.rows[1].messages[0].build===1);
    }
    const refs=[event(1,'build').end-1,event(1,'addref').end,...[0,1,2].map(i=>event(1,'copy',i).end),event(1,'release').end].map(t=>api.sectorFrame(t,program).rows[1].messages[0].ref);
    assert.deepEqual(normal(refs),[1,4,3,2,1,0]);
    const final=api.sectorFrame(program.end,program);assert.deepEqual(normal(final.rows.map(r=>r.created)),[3,1]);assert.deepEqual(normal(final.rows.map(r=>r.copies)),[3,3]);
    assert(final.rows.every(r=>r.queues.every(q=>q.filled)));
  }
  const host=runtime({echo:true});assert(!host.root.animation.getState().preview);assert.equal(host.root.animation.getState().time,0);assert.equal(host.play.textContent,'재생');
  host.play.fire('click');host.advance(1000);assert(host.root.animation.getState().playing);host.play.fire('click');const state=host.root.animation.getState();host.advance(500);assert.deepEqual(normal(host.root.animation.getState()),normal(state));
  host.resize(320);assert.deepEqual(normal(host.root.animation.getState()),normal(state));assert.deepEqual(normal(runtime({saved:host.saves.at(-1)}).root.animation.getState()),normal(state));
  host.preview.fire('click');assert.equal(host.root.animation.getState().time,0);assert(!host.root.animation.getState().preview);assert.equal(host.preview.textContent,'처음으로');
  const reduced=runtime({reduced:true});reduced.play.fire('click');assert.equal(reduced.root.animation.getState().time,program.end);assert(!reduced.root.animation.getState().playing);
  const hidden=runtime();hidden.document.hidden=true;hidden.play.fire('click');hidden.advance(1000,{raf:false});assert.equal(hidden.root.animation.getState().time,1000);
  const finish=runtime({echo:true});finish.play.fire('click');for(let i=0;i<110&&finish.root.animation.getState().playing;i++)finish.advance(250);assert.equal(finish.root.animation.getState().time,program.end);assert.equal(finish.pending.size+finish.timers.size,0);
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));parse(fragment.split('<script>')[0]);
  await snapshot(736,0,'initial-736');await snapshot(320,0,'initial-320');
  await snapshot(736,event(0,'notify-hold').start+100,'notification-before');
  const first=event(0,'allocate');await snapshot(736,first.start+first.duration*.15,'request-before');await snapshot(736,first.start+first.duration*.7,'allocate-before');
  await snapshot(736,event(0,'copy',1).start+100,'msg-two-before');await snapshot(320,event(0,'copy',1).start+100,'msg-two-320');
  await snapshot(736,event(0,'release',1).start+200,'return-before');await snapshot(736,event(1,'copy',1).end+100,'retained-736');await snapshot(736,program.end,'final-736');
  const result={ok:!problems.length,figure:3,initialMsgsAbsent:true,onlyOneBeforeMsgAtATime:true,returnedMsgsDisappear:true,beforeSequence:'allocate use return 1 then 2 then 3',poolMovedUp:true,notifications:'two diagonal straight arrows and one horizontal straight arrow',functionalCircuitRoutes:'recipient sectors to pool to Msg',fullBufferAllocationAndReturnGlyph:true,requestPrecedesBufferAllocation:true,msgAndQueueGeometryUnchanged:true,refSequence:[1,4,3,2,1,0],creationCount:[3,1],copyCount:[3,3],queueCopiesRemainAfterReturn:true,durationMs:program.end,controlsAndPlaybackVerified:true,checkedWidths:widths,checkedFrames:times.size,browserHostVerified:false,problems,sha256:crypto.createHash('sha256').update(fragment).digest('hex')};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(problems.length)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
