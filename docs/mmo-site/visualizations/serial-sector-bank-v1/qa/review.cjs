const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',sharp=require(path.join(modules,'sharp')),canvas=require(path.join(modules,'@napi-rs/canvas'));
canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/consola.ttf','PCB-Code-Review');
const dir=path.resolve(__dirname,'..'),file=path.join(dir,'figure-3.html'),fragment=fs.readFileSync(file,'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8'),script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];
const api=vm.runInNewContext(source+';({createPoolStudyScene,createReuseProgram,sectorFrame,applyPoolStudyFrame:applyPoolInteriorFrame,studySlotPoints})');
const previous=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'../serial-sector-current/scene.js'),'utf8')+';({createSectorReuseScene})');
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]])),styles=['bank'],widths=[1024,736,700,699,360,320],normal=v=>JSON.parse(JSON.stringify(v));
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
class E{constructor(tag,attrs={}){this.tagName=tag;this.attrs=attrs;this.listeners={};this.textContent='';}get id(){return this.attrs.id;}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}fire(k,event={}){for(const fn of this.listeners[k]??[])fn(event);}}
function parse(markup){const nodes=new Map();for(const m of markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)){const a=Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map(n=>[n[1],n[2]]));if(a.id){assert(!nodes.has(a.id),'Duplicate ID '+a.id);nodes.set(a.id,new E(m[1],a));}}return nodes;}
function setter(nodes){return (id,attrs,text)=>{const n=nodes.get(id);assert(n,'Missing '+id);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;};}
function serialize(markup,nodes){return markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,body)=>{const id=body.match(/\bid="([^"]+)"/)?.[1];return id&&nodes.has(id)?`<${tag} ${Object.entries(nodes.get(id).attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>`:all;}).replace(/(<text\b[^>]*\bid="([^"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>`${open}${esc(nodes.get(id).textContent||body)}${end}`).replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name]);return colors[name];});}
async function snapshot(style,width,time,name){const s=api.createPoolStudyScene(width,style),p=api.createReuseProgram(),nodes=parse(s.markup);api.applyPoolStudyFrame(s,api.sectorFrame(time,p),setter(nodes));const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}.sector-mono{font-family:PCB-Code-Review,monospace}</style>${serialize(s.markup,nodes)}</svg>`;fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));}
function runtime({width:initialWidth=736,saved=null,reduced=false,echo=false}={}){
  let clock=100,id=0;const pending=new Map(),timers=new Map(),saves=[],resizes=new Map(),mutations=new Map(),document=new E('document'),window=new E('window'),media=new E('media'),root=new E('div');
  const components={};for(const style of styles){const container=new E('div'),board=new E('svg'),short=new E('button'),play=new E('button'),reset=new E('button'),status=new E('span'),panel=new E('section');let width=initialWidth;
    panel.dataset={};panel.hidden=false;container.parentElement=panel;container.getBoundingClientRect=()=>({width});container.querySelector=s=>s==='.sector-board'?board:s==='.sector-status'?status:s.includes('short')?short:s.includes('reset')?reset:play;
    board.children=[new E('title'),new E('desc')];board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());components[style]={container,board,short,play,reset,status,panel,resize(w){width=w;resizes.get(container)([{contentRect:{width:w}}]);}};
  }
  document.getElementById=id=>{if(id==='serial-figure-3-interim')return root;const c=components[id.replace('pool-study-','')];assert(c);return c.container;};media.matches=reduced;
  window.openai={widgetState:saved,setWidgetState:state=>{saves.push(state);if(echo)window.fire('openai:set_globals',{detail:{globals:{widgetState:state}}});return Promise.resolve();}};
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,Map,Promise,performance:{now:()=>clock},setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){this.fn=fn;}observe(el){resizes.set(el,this.fn);}},MutationObserver:class{constructor(fn){this.fn=fn;}observe(el){mutations.set(el,this.fn);}}});
  return {root,components,window,media,pending,timers,saves,advance(delta=16,{raf=true}={}){clock+=delta;if(raf)for(const [key,fn] of [...pending.entries()])if(pending.delete(key))fn(clock);for(const [key,value] of [...timers.entries()])if(value.at<=clock&&timers.delete(key))value.fn();},hide(style){components[style].panel.hidden=true;mutations.get(components[style].panel)();}};
}
async function main(){
  new vm.Script(script);assert(Buffer.byteLength(fragment)<1_000_000);assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));parse(fragment.split('<script>')[0]);
  assert.equal([...fragment.matchAll(/<section\b/g)].length,1);assert(!fragment.includes('class="viz-carousel"'),'Only the selected slot bank is shown');
  const program=api.createReuseProgram(),event=(row,phase,actor=0)=>program.segments.find(s=>s.row===row&&s.phase===phase&&s.actor===actor),times=new Set([0,program.end]);
  const focusStart=event(0,'recipient').start,focusEnd=(event(0,'release').end+event(0,'recipient',1).start)/2;
  for(let actor=0;actor<3;actor++){
    assert.equal(event(0,'recipient',actor).end,event(0,'allocate',actor).start);
    if(actor>0)assert(event(0,'recipient',actor).start>event(0,'release',actor-1).end,'Next arrow follows previous buffer return');
    assert(event(1,'recipient',actor).start>=event(1,'addref').end,'Shared buffer is built before the first recipient arrow');
    if(actor>0)assert(event(1,'recipient',actor).start>=event(1,'hold',actor-1).end,'Next arrow follows the previous Copy');
    const before=api.sectorFrame(event(0,'recipient',actor).start+event(0,'recipient',actor).duration*.5,program).rows[0];
    assert.equal(before.created,actor);assert.equal(before.copies,actor);assert(!before.messages.some(m=>m.live));
    const after=api.sectorFrame(event(1,'recipient',actor).start+event(1,'recipient',actor).duration*.5,program).rows[1];
    assert.equal(after.created,1);assert.equal(after.copies,actor);assert(after.messages[0].live&&after.messages[0].build===1);
  }
  for(const s of program.segments)for(const p of [0,.05,.15,.3,.4,.5,.65,.8,.9,.97,1])times.add(s.start+s.duration*p);
  for(const width of widths)for(const style of styles){
    const scene=api.createPoolStudyScene(width,style),old=previous.createSectorReuseScene(width),nodes=parse(scene.markup),set=setter(nodes);
    assert.equal([...scene.markup.matchAll(/data-character="mage"/g)].length,2,'A remains a mage in both maps');
    assert.equal([...scene.markup.matchAll(/data-character="swordsman"/g)].length,6,'All six recipient figures use the same swordsman');
    for(const use of scene.markup.matchAll(/<use\b([^>]+)>/g)){const href=use[1].match(/href="#([^"]+)"/)[1];assert(nodes.has(href),'Every character references an existing definition');}
    const geometry=s=>s.bounds.map(({x,y,w,h,role})=>({x,y,w,h,role}));assert.deepEqual(normal(geometry(scene)),normal(geometry(old)),'Composition and all component sizes stay fixed');
    const ctx=canvas.createCanvas(1,1).getContext('2d');for(const label of scene.labels){ctx.font=`500 ${label.size}px ${/^Msg|^Ref/.test(label.text)?'PCB-Code-Review':'PCB-Review'}`;const w=ctx.measureText(label.text).width,left=label.anchor==='start'?label.x:label.anchor==='end'?label.x-w:label.x-w/2;assert(left>=0&&left+w<=width&&label.y>=0&&label.y<=scene.height);}
    for(let row=0;row<2;row++)for(let recipient=0;recipient<3;recipient++){
      const a=scene.rows[row],m=a.messages[row===0?recipient:0],q=a.queues[recipient],copy=a.copies[recipient],points=normal(copy.points);
      assert.equal(points[0][1],m.cy,'Copy starts at the centered output pin');assert.equal(points.at(-1)[1],q.cy,'Copy meets the existing SendQ inlet');
      if(row===0||recipient===1){assert.equal(points.length,2);assert.equal(points[0][1],points[1][1],'Matching heights use a single horizontal segment');}
      else{assert.equal(points.length,4);assert.equal(points[0][1],points[1][1]);assert.equal(points[1][0],points[2][0]);assert.equal(points[2][1],points[3][1]);assert(Math.abs(points[2][1]-points[1][1])>=108,'Vertical branch is deliberate, not an 11 or 12 px dogleg');}
      const phase=event(row,'copy',recipient);let previousPoint;
      for(const p of [.1,.25,.4,.55,.7,.85,.95]){
        api.applyPoolStudyFrame(scene,api.sectorFrame(phase.start+phase.duration*p,program),set);
        const point=nodes.get(copy.carrier).getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
        if(row===0||recipient===1)assert.equal(point[1],q.cy,'Actual replay follows a straight line');
        if(previousPoint){assert(point[0]>=previousPoint[0]);assert((q.cy-m.cy)>=0?point[1]>=previousPoint[1]:point[1]<=previousPoint[1],'No reversal or vertical wobble');}
        previousPoint=point;
      }
    }
    for(const t of times){const frame=api.sectorFrame(t,program);api.applyPoolStudyFrame(scene,frame,set);assert(frame.rows[0].messages.filter(m=>m.live).length<=1);
      for(let row=0;row<2;row++){
        const r=frame.rows[row],w=scene.worlds[row],visible=w.notices.filter(n=>Number(nodes.get(n.head).getAttribute('opacity'))>0);
        assert(visible.length<=1,'Only the current recipient arrow is blue');
        for(let j=0;j<3;j++){
          const n=w.notices[j],base=nodes.get(n.baseTrace),head=nodes.get(n.head);
          assert.equal(Number(base.getAttribute('opacity')),.5*r.targetsOpacity,'All three gray target paths stay visible after arrival');
          assert.equal(nodes.get(n.baseHead).getAttribute('opacity'),base.getAttribute('opacity'));
          assert.equal(nodes.get(n.trace).getAttribute('stroke-dashoffset'),'0','Blue arrow never grows along its path');
          assert.equal(head.getAttribute('points'),n.headPoints,'Arrowhead stays at the fixed destination');
          assert.equal(nodes.get(n.baseHead).getAttribute('points'),n.headPoints);
          assert.deepEqual(normal(n.points),normal(old.worlds[row].notices[j].points),'Target routes stay in their original positions');
          if(j!==r.activeRecipient){assert.equal(nodes.get(n.trace).getAttribute('opacity'),'0');assert.equal(head.getAttribute('opacity'),'0');}
        }
        if(row===1)for(const request of scene.rows[row].requests)assert.equal(nodes.get(request.carrier).getAttribute('opacity'),'0','Shared Msg allocation is not triggered by three recipients');
        if(row===1&&r.messages[0].live){const ref=r.messages[0].ref,expected=ref>1?'초기 1 + 수신자 '+(ref-1):'초기 참조 1';assert.equal(nodes.get(scene.rows[row].reuseCaption).textContent,expected,'Ref includes the initial reference and remaining recipient ownership');}
        const pool=scene.rows[row].pool;
        assert.equal(pool.w,78);assert.equal(pool.h,64);assert.equal(pool.outputY,pool.cy,'The chosen gate outlet stays fixed');
        if(r.messages.some(m=>m.live)&&!r.transfer)assert.equal(nodes.get(pool.available).getAttribute('opacity'),'0','Checked-out buffer does not remain available inside the pool');
        if(r.returned.some(Boolean)&&!r.transfer&&!r.messages.some(m=>m.live))assert.equal(nodes.get(pool.available).getAttribute('opacity'),'1','Returned buffer is available again');
      }
      for(const n of nodes.values())for(const value of Object.values(n.attrs))assert(!/NaN|Infinity|undefined|\[object Object\]/.test(value));
      for(let row=0;row<2;row++)for(let i=0;i<scene.rows[row].messages.length;i++){
        const a=scene.rows[row],m=a.messages[i],f=frame.rows[row].messages[i],transfer=frame.rows[row].transfer;
        assert.equal(nodes.get(a.allocations[i].carrier).getAttribute('opacity'),'0');assert.equal(nodes.get(a.returns[i].carrier).getAttribute('opacity'),'0','Legacy scaled full-card carrier is absent');
        if(!f.live&&transfer?.actor!==i)assert.equal(nodes.get(m.group).getAttribute('opacity'),'0','Returned and future Msg are absent');
        const token=nodes.get(a.study[i].token);if(Number(token.getAttribute('opacity'))>0){assert.equal(style,'slot');assert(!/scale\(/.test(token.getAttribute('transform')),'Msg text never shrinks in transit');const p=token.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);assert(p[0]-30>=0&&p[0]+30<=width&&p[1]-13>=0&&p[1]+13<=scene.height);}
      }
    }
    const refs=[event(1,'build').end-1,event(1,'addref').end,...[0,1,2].map(i=>event(1,'copy',i).end),event(1,'release').end].map(t=>api.sectorFrame(t,program).rows[1].messages[0].ref);assert.deepEqual(normal(refs),[1,4,3,2,1,0]);
    if(style==='slot')for(let row=0;row<2;row++)for(let actor=0;actor<(row===0?3:1);actor++){
      const a=scene.rows[row],m=a.messages[actor],extras=a.study[actor],allocation=event(row,'allocate',actor);
      const route=normal(api.studySlotPoints(a,m,a.pool.cx,m.x+35,scene.compact));
      if(row===0&&actor===0){assert.equal(route.length,2,'First allocation has one straight segment');assert.equal(route[0][1],route[1][1]);}
      else{assert.equal(route.length,4,'Different destination heights use exactly two orthogonal bends');assert.equal(route[0][1],route[1][1]);assert.equal(route[1][0],route[2][0]);assert.equal(route[2][1],route[3][1]);assert(Math.abs(route[2][1]-route[1][1])>=108,'No tiny vertical dogleg');}
      for(let i=1;i<route.length;i++){assert(route[i][0]===route[i-1][0]||route[i][1]===route[i-1][1]);assert(route[i][0]!==route[i-1][0]||route[i][1]!==route[i-1][1]);}
      const tokenMarkup=scene.markup.slice(scene.markup.indexOf(`<g id="${extras.token}"`));
      const tokenLabel=tokenMarkup.match(/<text ([^>]+)>/)[1];
      assert(tokenLabel.includes(`font-size="${scene.compact?14:16}"`)&&tokenLabel.includes('x="-23"')&&tokenLabel.includes('y="0"'));
      for(const p of [.76,.8,.85,.9,.95]){
        api.applyPoolStudyFrame(scene,api.sectorFrame(allocation.start+allocation.duration*(.3+.7*p),program),set);
        const clip=nodes.get(extras.msgClip);assert.equal(Number(clip.getAttribute('width')),m.w+12);assert.equal(Number(clip.getAttribute('height')),m.h,'No secondary size animation at docking');
        assert.equal(nodes.get(extras.outline).getAttribute('opacity'),'0');
        const point=nodes.get(extras.token).getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
        assert(Math.abs(point[0]-23-(m.x+12))<1e-9);assert(Math.abs(point[1]-(m.y+(scene.compact?13:15)))<1e-9,'Docked label has no position jump');
      }
    }
    const final=api.sectorFrame(program.end,program);assert.deepEqual(normal(final.rows.map(r=>r.created)),[3,1]);assert.deepEqual(normal(final.rows.map(r=>r.copies)),[3,3]);assert(final.rows.every(r=>r.queues.every(q=>q.filled)));
  }
  for(const style of styles){
    const host=runtime({echo:true}),c=host.components[style];assert(!c.container.animation.getState().playing);assert.equal(c.container.animation.getState().time,focusStart);
    c.short.fire('click');host.advance(250);assert(c.container.animation.getState().playing);c.short.fire('click');const stopped=normal(c.container.animation.getState());host.advance(500);assert.deepEqual(normal(c.container.animation.getState()),stopped);c.resize(320);assert.deepEqual(normal(c.container.animation.getState()),stopped);
    c.short.fire('click');for(let i=0;i<100&&c.container.animation.getState().playing;i++)host.advance(100);assert.equal(c.container.animation.getState().time,focusEnd);assert(!c.container.animation.getState().phase.includes('전달 요청'),'Focused replay does not start the next allocation');assert.equal(host.pending.size+host.timers.size,0);
    c.reset.fire('click');assert.equal(c.container.animation.getState().time,focusStart);c.play.fire('click');for(let i=0;i<110&&c.container.animation.getState().playing;i++)host.advance(250);assert.equal(c.container.animation.getState().time,program.end);assert.equal(host.pending.size+host.timers.size,0);
    const saved=runtime({saved:host.saves.at(-1)});assert.equal(saved.components[style].container.animation.getState().time,program.end);assert(!saved.components[style].container.animation.getState().playing);
    c.reset.fire('click');c.short.fire('click');host.advance(200,{raf:false});assert(c.container.animation.getState().time>focusStart);host.hide(style);assert(!c.container.animation.getState().playing);assert.equal(host.pending.size+host.timers.size,0);
    const reduced=runtime({reduced:true});reduced.components[style].short.fire('click');assert(!reduced.components[style].container.animation.getState().playing);assert.equal(reduced.components[style].container.animation.getState().time,focusEnd);
  }
  const allocate=event(0,'allocate'),release=event(0,'release');
  for(const style of styles){
    await snapshot(style,736,focusStart,style+'-idle');
    await snapshot(style,736,event(0,'recipient').start+event(0,'recipient').duration*.1,style+'-recipient-color-start');
    for(const [name,p] of [['exit',.42],['rail',.68],['arrive',.91]])await snapshot(style,736,allocate.start+allocate.duration*p,style+'-allocate-'+name);
    await snapshot(style,736,event(0,'hold').start+150,style+'-in-use');
    await snapshot(style,736,release.start+release.duration*.35,style+'-return');
    await snapshot(style,736,focusEnd,style+'-returned');
    await snapshot(style,320,allocate.start+allocate.duration*.85,style+'-compact');
    await snapshot(style,736,event(1,'copy',1).end+200,style+'-shared');
    await snapshot(style,736,event(0,'copy').start+event(0,'copy').duration*.5,style+'-copy-straight');
    await snapshot(style,736,event(1,'copy',0).start+event(1,'copy',0).duration*.5,style+'-copy-turn');
    for(let actor=0;actor<3;actor++){
      await snapshot(style,736,event(0,'recipient',actor).start+event(0,'recipient',actor).duration*.75,style+'-recipient-before-'+actor);
      await snapshot(style,736,event(1,'recipient',actor).start+event(1,'recipient',actor).duration*.75,style+'-recipient-after-'+actor);
    }
    await snapshot(style,736,event(1,'addref').end-1,style+'-shared-ready-before-arrows');
  }
  const result={ok:true,variants:styles,widths,checkedFramesPerVariant:times.size,oneBlueRecipientArrowAtATime:true,grayTargetsRemainVisible:true,arrowGeometryIsFixed:true,mageAndSwordsmanRolesVerified:true,referenceOwnershipCaptionVerified:true,beforeNextArrowFollowsReturn:true,afterSharedMsgBuiltBeforeArrows:true,afterSharedMsgRetainedAcrossRecipientArrows:true,allComponentPositionsAndSizesUnchanged:true,copyMatchingHeightsAreStraight:true,copyBranchesUseTwoExplicitOrthogonalTurns:true,copyMotionHasNoVerticalWobble:true,focusedReplayStopsBeforeNextAllocation:true,fullSourceRetainedThroughCopies:true,referenceSequence:[1,4,3,2,1,0],copies:[3,3],creation:[3,1],durationMs:program.end,replayPauseResetRestoreResizeVerified:true,noAutoplayOnVariantSelection:true,browserHostVerified:false,sha256:crypto.createHash('sha256').update(fragment).digest('hex'),baselineSha256:crypto.createHash('sha256').update(fs.readFileSync(path.resolve(dir,'../serial-sector-current/sector-reuse.html'))).digest('hex')};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
