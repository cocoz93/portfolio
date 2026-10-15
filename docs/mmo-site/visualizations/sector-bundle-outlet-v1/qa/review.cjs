const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp')),{createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'four-messages-one-msg.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePathPoint,bundleCharacterPose,applyBundleFrame})');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
class Element{
  constructor(tagName,attrs={}){this.tagName=tagName;this.attrs=attrs;this.textContent='';this.listeners={};}
  get id(){return this.attrs.id;}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return this.attrs[key]??null;}
  addEventListener(type,callback){this.listeners[type]=callback;}
  fire(type,event={}){this.listeners[type]?.(event);}
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
function serialized(markup,nodes){
  let updated=markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,attrs)=>{
    const id=attrs.match(/\bid="([^\"]+)"/)?.[1];if(!id||!nodes.has(id))return all;
    return `<${tag} ${Object.entries(nodes.get(id).attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(' ')}>`;
  });
  updated=updated.replace(/(<text\b[^>]*\bid="([^\"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>`${open}${escape(nodes.get(id).textContent)}${end}`);
  return updated.replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name],name);return colors[name]});
}
async function snapshot(width,time,name){
  const scene=api.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),frame=api.bundleFrame(time,program),nodes=parse(scene.markup);
  api.applyBundleFrame(scene,frame,(id,attrs,text)=>{assert(nodes.has(id),id);const el=nodes.get(id);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);if(text!==undefined)el.textContent=text;});
  const markup=serialized(scene.markup,nodes),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${markup}</svg>`;
  fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));
}
function runtime(width=736,reduced=false,saved=null){
  let actualWidth=width,timestamp=100,frameId=0,resize,intersect;
  const pending=new Map(),saves=[],board=new Element('svg'),buttons={play:new Element('button'),replay:new Element('button')},status=new Element('span');
  board.children=[new Element('title'),new Element('desc')];board.nodes=new Map();
  board.replaceChildren=(...children)=>{board.children=children;};
  board.insertAdjacentHTML=(_,markup)=>{board.markup=markup;board.nodes=parse(markup);};
  board.querySelectorAll=()=>Array.from(board.nodes.values());
  const root={querySelector(selector){return selector==='.bundle-animation-board'?board:selector==='.outlet-motion-status'?status:selector.includes('replay')?buttons.replay:buttons.play;},getBoundingClientRect:()=>({width:actualWidth})};
  const document=new Element('document');document.hidden=false;document.getElementById=()=>root;
  const window=new Element('window');window.openai={widgetState:saved,setWidgetState:snapshot=>{saves.push(snapshot);return Promise.resolve();}};
  const media=new Element('media');media.matches=reduced;
  vm.runInNewContext(script,{document,window,matchMedia:()=>media,requestAnimationFrame:callback=>{const id=++frameId;pending.set(id,callback);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(callback){resize=callback;}observe(){}},IntersectionObserver:class{constructor(callback){intersect=callback;}observe(){}disconnect(){}},Map,Promise});
  function advance(delta=16){timestamp+=delta;const callbacks=Array.from(pending.values());pending.clear();callbacks.forEach(callback=>callback(timestamp));}
  return {root,board,buttons,status,document,window,media,saves,pending,advance,visible:()=>intersect?.([{isIntersecting:true}]),resize(next){actualWidth=next;resize([{contentRect:{width:next}}]);advance();}};
}
async function main(){
  const original=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8');
  assert.deepEqual(fragment.match(/@font-face\{[^}]+\}/g),original.match(/@font-face\{[^}]+\}/g));
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
  assert(fragment.includes('WSASend'));assert(!fragment.includes('request-state'));assert(!fragment.includes('send-beam'));
  const checked=[];
  for(const width of [736,700,680,679,360,320]){
    const scene=api.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact);parse(scene.markup);
    assert.equal((scene.markup.match(/data-character="mage"/g)||[]).length,2);
    assert.equal((scene.markup.match(/data-role="outlet-label"/g)||[]).length,2);
    assert.equal((scene.markup.match(/data-role="bundle-entry"/g)||[]).length,4);
    assert(scene.markup.includes('data-role="bundle-packet" data-count="4"'));
    assert(scene.markup.includes('data-role="bundle-msg-region" data-entry-count="4"'));
    const beforePayload=scene.rows[0].packets.map(packet=>packet.payload),afterPayload=scene.rows[1].packets.map(packet=>packet.payload);
    assert.equal(JSON.stringify(beforePayload),JSON.stringify(afterPayload),'Before/after message data or order differs');
    assert.equal(JSON.stringify(afterPayload),JSON.stringify([{move:1,x:0,y:1},{move:2,x:1,y:1},{move:3,x:1,y:0},{move:4,x:2,y:0}]));
    assert(!scene.markup.includes('Copy 횟수'));assert(!scene.markup.includes('data-role="copy-count"'));
    for(const row of scene.rows){
      const character=row.character;
      for(let index=0;index<4;index++){
        const [a,b]=[character.coordinates[index],character.coordinates[index+1]];
        assert.equal(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]),1);
        for(const progress of [0,.25,.5,.75,1]){
          const moves=Array.from({length:4},(_,step)=>step<index?1:step===index?progress:0),pose=api.bundleCharacterPose(character,moves);
          const unit=character.size/32;
          assert(pose.x-16*unit>=character.grid.x&&pose.x+16*unit<=character.grid.x+character.grid.w);
          assert(pose.y-20*unit>=character.grid.y&&pose.y+16*unit<=character.grid.y+character.grid.h);
        }
      }
    }
    const bounds=scene.labels.map(label=>{assert(label.size>=11);ctx.font=`${label.size}px PCB-Review`;const measured=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);return {label:label.label,left,right:left+measured,top:label.y-label.size/2,bottom:label.y+label.size/2};});
    bounds.forEach(b=>assert(b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=scene.height,`Clipping ${width}: ${b.label}`));
    for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){const a=bounds[i],b=bounds[j];assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),`Overlap ${width}: ${a.label}/${b.label}`);}
    const allPaths=scene.rows.flatMap(row=>[...row.sourceBeams,...row.copyBeams,...row.outletBeams]);
    for(const beam of allPaths){for(let i=1;i<beam.points.length;i++)assert(beam.points[i][0]===beam.points[i-1][0]||beam.points[i][1]===beam.points[i-1][1]);for(const p of [0,.2,.5,.8,1]){const [x,y]=api.bundlePathPoint(beam.points,p);assert(x-3.5>=0&&x+3.5<=width&&y-3.5>=0&&y+3.5<=scene.height);}}
    const queues=program.segments.filter(segment=>segment.phase==='queue');
    queues.forEach(segment=>{const before=api.bundleFrame(segment.end-1,program),after=api.bundleFrame(segment.end,program);assert.equal(before.rows[segment.row].copies,segment.row===0?segment.actor:0);assert.equal(after.rows[segment.row].copies,segment.row===0?segment.actor+1:1);});
    const afterBuild=program.segments.find(segment=>segment.row===1&&segment.phase==='bundle'),buildStart=api.bundleFrame(afterBuild.start,program);
    assert.equal(buildStart.rows[1].moves.filter(p=>p===1).length,4);assert.equal(buildStart.rows[1].packets.filter(p=>p===1).length,4);assert.equal(buildStart.rows[1].bundleReady,0);assert.equal(buildStart.rows[1].copies,0);
    const afterCopy=program.segments.find(segment=>segment.row===1&&segment.phase==='copy'),ready=api.bundleFrame(afterCopy.start,program).rows[1];
    assert.equal(ready.bundleReady,1);assert.equal(ready.packets.filter(p=>p===1).length,4);
    const entryBuilds=program.segments.filter(segment=>segment.row===1&&segment.phase==='message');assert.equal(entryBuilds.length,4);
    entryBuilds.forEach(segment=>assert.equal(api.bundleFrame(segment.end,program).rows[1].packets.filter(p=>p===1).length,segment.actor+1));
    const final=api.bundleFrame(program.end,program);assert.equal(final.rows[0].copies,4);assert.equal(final.rows[1].copies,1);assert.equal(final.rows[0].opacity,1);assert.equal(final.rows[1].opacity,1);assert.equal(final.rows[0].gray,0);
    assert.equal(final.rows[0].queue.filter(value=>value===1).length,4);
    assert.equal(final.rows[1].queue[0],1);
    assert.equal(final.rows[0].release,1);assert.equal(final.rows[1].release,1);
    assert.equal(final.rows[0].requested,true);assert.equal(final.rows[1].requested,true);
    for(const row of [0,1]){
      const hold=program.segments.find(segment=>segment.row===row&&segment.phase==='holdQueue'),outlet=program.segments.find(segment=>segment.row===row&&segment.phase==='outlet'),release=program.segments.find(segment=>segment.row===row&&segment.phase==='release');
      assert.equal(hold.duration,900);assert.equal(outlet.start,hold.end);assert.equal(release.start,outlet.end);
      for(const time of [hold.start,outlet.start,outlet.start+outlet.duration/2]){const state=api.bundleFrame(time,program).rows[row];assert.equal(state.copies,row===0?4:1);assert.equal(state.release,0);assert.equal(state.requested,false);}
      const halfway=api.bundleFrame(release.start+release.duration/2,program).rows[row];assert.equal(halfway.requested,true);assert.equal(halfway.release,.5);
      const nodes=parse(scene.markup);api.applyBundleFrame(scene,api.bundleFrame(program.end,program),(id,attrs,text)=>{assert(nodes.has(id),id);for(const [key,value] of Object.entries(attrs))nodes.get(id).setAttribute(key,value);if(text!==undefined)nodes.get(id).textContent=text;});
      scene.rows[row].queue.forEach(region=>assert.equal(nodes.get(region.id).getAttribute('opacity'),'0'));
      assert.equal(nodes.get(scene.rows[row].queueCount).textContent,'비움');
    }
    assert.equal(program.segments.filter(segment=>segment.phase==='outlet').length,2);
    const beforeMove=program.segments.find(segment=>segment.phase==='move');assert.equal(api.bundleFrame(beforeMove.start+200,program).rows[1].gray,1);
    const afterMove=program.segments.find(segment=>segment.row===1&&segment.phase==='move');assert.equal(api.bundleFrame(afterMove.start+200,program).rows[0].gray,1);
    const afterCopies=program.segments.filter(segment=>segment.row===1&&segment.phase==='copy');assert.equal(afterCopies.length,1);
    checked.push({width,height:scene.height,durationMs:program.end});
  }
  const test=runtime();assert.equal(test.root.animation.getState().outboundMsgsBefore,4);assert.equal(test.root.animation.getState().containedMovesBefore,4);assert.equal(test.root.animation.getState().containedMovesAfter,4);assert.equal(test.root.animation.getState().queuedBefore,0);assert.equal(test.root.animation.getState().queuedAfter,0);assert.equal(test.root.animation.getState().sendRequestedBefore,true);assert.equal(test.root.animation.getState().sendRequestedAfter,true);assert.equal(test.saves.length,0);test.visible();assert.equal(test.root.animation.getState().outboundMsgsBefore,0);assert.equal(test.root.animation.getState().playing,true);
  test.advance();test.advance(40);const movedTime=test.root.animation.getState().time;assert(movedTime>0);
  test.buttons.play.fire('click');assert.equal(test.root.animation.getState().playing,false);assert.equal(test.saves.length,1);test.advance(40);assert.equal(test.root.animation.getState().time,movedTime);
  test.buttons.play.fire('click');test.advance();test.advance(40);assert(test.root.animation.getState().time>movedTime);
  test.document.hidden=true;const hiddenTime=test.root.animation.getState().time;test.advance(500);assert.equal(test.root.animation.getState().time,hiddenTime);test.document.hidden=false;test.document.fire('visibilitychange');
  const program=test.root.animation.getProgram(),copy=program.segments.find(segment=>segment.row===0&&segment.phase==='copy');test.root.animation.seek(copy.start+copy.duration*.4);
  const beforeResize=test.root.animation.getState();test.resize(320);const afterResize=test.root.animation.getState();assert.equal(beforeResize.phase,afterResize.phase);assert.equal(afterResize.outboundMsgsBefore,0);assert.equal(test.board.getAttribute('viewBox'),'0 0 320 818');
  const segment=test.root.animation.getProgram().segments.find(s=>s.id===copy.id);assert(Math.abs((afterResize.time-segment.start)/segment.duration-.4)<1e-8);
  test.buttons.replay.fire('click');assert.equal(test.root.animation.getState().time,0);assert.equal(test.root.animation.getState().outboundMsgsAfter,0);assert.equal(test.root.animation.getState().playing,true);
  const reduced=runtime(736,true);reduced.visible();assert.equal(reduced.root.animation.getState().playing,false);assert.equal(reduced.root.animation.getState().outboundMsgsAfter,1);reduced.buttons.replay.fire('click');assert.equal(reduced.root.animation.getState().playing,false);
  const saved=test.saves.at(-1),restored=runtime(736,false,saved);assert.equal(restored.root.animation.getState().playing,true);assert.equal(restored.saves.length,0);
  const desktop=api.createBundleProgram(false),mobile=api.createBundleProgram(true);
  const b=desktop.segments.find(s=>s.row===0&&s.phase==='copy'),a=desktop.segments.find(s=>s.row===1&&s.phase==='message'&&s.actor===2),bundle=desktop.segments.find(s=>s.phase==='bundle'),q=desktop.segments.find(s=>s.row===1&&s.phase==='queue'),outlet=desktop.segments.find(s=>s.row===1&&s.phase==='outlet'),release=desktop.segments.find(s=>s.row===1&&s.phase==='release');
  await snapshot(736,b.start+b.duration*.6,'before-copy');await snapshot(736,a.start+a.duration*.65,'after-msg');await snapshot(736,bundle.start+bundle.duration*.65,'bundle-ready');await snapshot(736,q.start+q.duration*.6,'after-queue');await snapshot(736,desktop.end,'complete-736');await snapshot(320,mobile.end,'complete-320');
  await snapshot(736,outlet.start+outlet.duration*.5,'outlet-mid');await snapshot(736,release.start+release.duration*.5,'release-mid');await snapshot(320,mobile.segments.find(s=>s.row===1&&s.phase==='outlet').start+325,'outlet-320');
  const report={verification:'three primary stages with a small WSASend outlet, four original movement messages and order preserved, hold then pulse exits then queue empties, DOM-emulated controls and resize, geometry, offscreen SVG frames',browserHostVerified:false,outboundMsgsBefore:4,outboundMsgsAfter:1,containedMovesBefore:4,containedMovesAfter:4,charactersPerRow:1,bundleFinalizedAtTickEnd:true,queueEmptied:true,outletOnly:true,checked};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(error=>{console.error(error);process.exitCode=1});
