/* REVIEW_HELPERS */
function runtime({width:initialWidth=736,reduced=false,saved=null,sourceScript=script,rootId='serial-sector-player-links-v8',echo=false}={}){
  let width=initialWidth,clock=100,id=0,resize;const pending=new Map(),timers=new Map(),saves=[],root=new E('div'),board=new E('svg'),play=new E('button'),preview=new E('button'),status=new E('span'),document=new E('document'),window=new E('window'),media=new E('media');
  root.getBoundingClientRect=()=>({width});root.querySelector=s=>s==='.sector-board'?board:s==='.sector-status'?status:s.includes('preview')?preview:play;
  board.children=[new E('title'),new E('desc')];board.replaceChildren=(...children)=>{board.children=children;};board.insertAdjacentHTML=(_,markup)=>{board.nodes=parse(markup);};board.querySelectorAll=()=>Array.from(board.nodes.values());
  document.hidden=false;document.getElementById=id=>{assert.equal(id,rootId);return root;};media.matches=reduced;
  window.openai={widgetState:saved,setWidgetState:state=>{saves.push(state);if(echo)window.fire('openai:set_globals',{detail:{globals:{widgetState:state}}});return Promise.resolve();}};
  vm.runInNewContext(sourceScript,{document,window,matchMedia:()=>media,Map,Promise,performance:{now:()=>clock},setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id),ResizeObserver:class{constructor(fn){resize=fn;}observe(){} }});
  return {root,board,play,preview,status,document,window,media,pending,timers,saves,advance(delta=16,{raf=true,timer=true}={}){clock+=delta;if(raf){const callbacks=[...pending.entries()];for(const [key,fn] of callbacks){if(pending.delete(key))fn(clock);}}if(timer){const callbacks=[...timers.entries()];for(const [key,value] of callbacks){if(value.at<=clock&&timers.delete(key))value.fn();}}},resize(next){width=next;resize([{contentRect:{width:next}}]);}};
}
async function main(){
  const p=api.createReuseProgram(),duration=p.end,event=(row,phase,actor=0)=>p.segments.find(s=>s.row===row&&s.phase===phase&&s.actor===actor),times=new Set([0,duration]);
  for(const s of p.segments)for(const d of [0,1,s.duration/2,s.duration,s.duration+1])times.add(Math.min(duration,s.start+d));
  for(const width of widths){
    const s=api.createSectorReuseScene(width),nodes=parse(s.markup);boundsCheck(s);
    assert.equal([...s.markup.matchAll(/data-role="sector"/g)].length,18);assert.equal(s.worlds.length,2);assert.equal(s.rows[0].messages.length,3);assert.equal(s.rows[1].messages.length,1);
    assert(!/buffer-pool|버퍼 풀/.test(s.markup));assert(s.rows.every(r=>!r.pool&&!r.returns));assert(s.rows.flatMap(r=>r.messages).every(m=>m.w===80&&m.h===80));
    for(let row=0;row<2;row++){
      const w=s.worlds[row],a=s.rows[row];assert.equal(w.end[0]-w.start[0],90);assert.equal(w.start[1],w.end[1]);
      assert.equal(w.recipients.length,3);
      for(let i=0;i<3;i++){
        const q=a.queues[i],player=w.recipients[i],b=a.copies[i];assert.equal(q.player,player.player);assert.equal(q.cx,player.cx);assert.equal(q.cy-player.cy,41);
        assert.deepEqual(normal(b.points.at(-1)),[q.right+6,q.cy]);assert(q.left>=w.x&&q.right<=w.x+w.size&&q.top>=w.y&&q.bottom<=w.y+w.size);
        assert(Math.abs(w.end[0]-player.cx)>=32,'Sender must not overlap receiver');assert(Math.abs(w.end[0]-q.cx)>=32,'Sender must not overlap queue');
      }
      for(const b of a.inputs)assert.deepEqual(normal(b.points[0]),normal(w.sourcePort));
    }
    for(const b of s.bounds)assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=s.height);
    for(const time of times){const f=api.sectorFrame(time,p);api.applySectorFrame(s,f,setter(nodes));for(const n of nodes.values())for(const value of Object.values(n.attrs))assert(!/NaN|Infinity|undefined/.test(value));}
    for(let row=0;row<2;row++){
      const move=event(row,'move'),w=s.worlds[row];api.applySectorFrame(s,api.sectorFrame(move.start+move.duration/2,p),setter(nodes));assert.equal(nodes.get(w.face).getAttribute('data-facing'),'east');
      api.applySectorFrame(s,api.sectorFrame(move.end+1,p),setter(nodes));assert.equal(nodes.get(w.face).getAttribute('data-facing'),'south');assert.equal(nodes.get(w.hero).getAttribute('transform'),'translate(90 0)');
      assert.equal(nodes.get(s.rows[1-row].group).getAttribute('opacity'),'.38'.replace(/^\./,'0.'));
    }
    for(let i=0;i<3;i++){
      const copy=event(1,'copy',i),f=api.sectorFrame(copy.end+100,p);api.applySectorFrame(s,f,setter(nodes));assert.equal(nodes.get(s.rows[1].messages[0].content).getAttribute('opacity'),'1');assert.equal(f.rows[1].messages[0].ref,3-i);assert(!f.rows[1].returned[0]);assert.equal(nodes.get(s.rows[1].queues[i].flash).getAttribute('opacity'),'1');assert.equal(nodes.get(s.worlds[1].receiverFlashes[i]).getAttribute('opacity'),'0.6');
      const mid=api.sectorFrame(copy.start+copy.duration/2,p);api.applySectorFrame(s,mid,setter(nodes));assert.equal(nodes.get(s.rows[1].copies[i].carrier).getAttribute('opacity'),'1');
    }
    const refs=[event(1,'build').end-1,event(1,'addref').end,...[0,1,2].map(i=>event(1,'copy',i).end),event(1,'release').end].map(t=>api.sectorFrame(t,p).rows[1].messages[0].ref);assert.deepEqual(normal(refs),[1,4,3,2,1,0]);
    const final=api.sectorFrame(duration,p);api.applySectorFrame(s,final,setter(nodes));assert.deepEqual(normal(final.rows.map(r=>r.created)),[3,1]);assert.deepEqual(normal(final.rows.map(r=>r.copies)),[3,3]);assert(final.rows[1].queues.every(q=>q.filled));assert(final.rows[1].returned[0]);assert.equal(nodes.get(s.rows[1].ref).textContent,'Ref 0 · 풀 반환');assert.equal(nodes.get(s.rows[1].messages[0].content).getAttribute('opacity'),'0');
  }
  const prior=fs.readFileSync(path.resolve(dir,'../sector-bundle-held-pulse-v26/msg-held-pulse.html'),'utf8'),palette=Object.fromEntries([...prior.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));assert.deepEqual(colors,palette);assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));assert(!/\\"|\\n/.test(fragment.split('<script>')[0]));parse(fragment.split('<script>')[0]);
  // Reproduce the old controller failures, then repeat the same scenarios on v7.
  const oldFragment=fs.readFileSync(path.resolve(dir,'../serial-sector-zero-v6/sector-reuse-rough.html'),'utf8'),oldScript=oldFragment.match(/<script>([\s\S]*?)<\/script>/)[1],oldOptions={sourceScript:oldScript,rootId:'serial-sector-zero-v6'};
  const oldHidden=runtime(oldOptions);oldHidden.document.hidden=true;oldHidden.play.fire('click');oldHidden.advance();assert(!oldHidden.root.animation.getState().playing);assert.equal(oldHidden.root.animation.getState().time,0);
  const oldEcho=runtime({...oldOptions,echo:true});oldEcho.play.fire('click');assert(!oldEcho.root.animation.getState().playing);
  const oldSparse=runtime(oldOptions);oldSparse.play.fire('click');oldSparse.advance();oldSparse.advance(1000);assert.equal(oldSparse.root.animation.getState().time,100);
  const host=runtime();assert(host.root.animation.getState().preview);assert.equal(host.saves.length,0);host.play.fire('click');host.advance(100);assert(host.root.animation.getState().playing);assert.equal(host.root.animation.getState().time,100);
  host.play.fire('click');const paused=host.root.animation.getState().time;host.advance(500);assert.equal(host.root.animation.getState().time,paused);assert.equal(host.pending.size+host.timers.size,0);
  host.root.animation.seek(event(1,'copy',1).end+100);const before=host.root.animation.getState();host.resize(320);assert.deepEqual(normal(host.root.animation.getState()),normal(before));assert.equal(host.board.getAttribute('height'),'1368');assert.equal(host.board.children.length,2);
  host.play.fire('click');host.play.fire('click');const saved=host.saves.at(-1),restored=runtime({saved});assert.deepEqual(normal(restored.root.animation.getState()),normal(host.root.animation.getState()));assert.equal(restored.saves.length,0);
  host.preview.fire('click');assert(host.root.animation.getState().preview);host.window.fire('openai:set_globals',{detail:{globals:{widgetState:saved}}});assert.equal(host.root.animation.getState().time,saved.privateContent.time);
  const reduced=runtime({width:320,reduced:true});reduced.play.fire('click');assert.equal(reduced.root.animation.getState().time,duration);assert(!reduced.root.animation.getState().playing);assert.equal(reduced.pending.size+reduced.timers.size,0);
  const hidden=runtime();hidden.document.hidden=true;hidden.play.fire('click');hidden.advance(1000,{raf:false});assert(hidden.root.animation.getState().playing);assert.equal(hidden.root.animation.getState().time,1000);
  const echo=runtime({echo:true});echo.play.fire('click');echo.advance(1000);assert(echo.root.animation.getState().playing);assert.equal(echo.root.animation.getState().time,1000);
  const sparse=runtime();sparse.play.fire('click');sparse.advance(1000,{timer:false});assert.equal(sparse.root.animation.getState().time,1000);
  const finish=runtime({echo:true});finish.play.fire('click');for(let i=0;i<100&&finish.root.animation.getState().playing;i++)finish.advance(250);assert.equal(finish.root.animation.getState().time,duration);assert.equal(finish.pending.size+finish.timers.size,0);finish.play.fire('click');finish.advance(500);assert.equal(finish.root.animation.getState().time,500);assert(finish.root.animation.getState().playing);
  await snapshot(736,null,'preview-736');await snapshot(320,null,'preview-320');await snapshot(736,event(0,'move').start+event(0,'move').duration/2,'movement-before');await snapshot(736,event(1,'move').start+event(1,'move').duration/2,'movement-after');await snapshot(736,event(1,'copy',1).start+event(1,'copy',1).duration/2,'copy-to-player');await snapshot(736,event(1,'copy',1).end+100,'retained-736');await snapshot(736,duration,'final-736');
  const result={ok:problems.length===0,figure:3,separateMovementMaps:true,sectorCountPerRow:9,queuesBesideActualRecipients:true,allCopyPathsReachRecipientQueues:true,sourcePathsStartAtMovingPlayer:true,poolDrawingRemoved:true,returnWiringRemoved:true,paletteMatched:true,allocationAndSerialization:[3,1],copyCount:[3,3],retainedDuringAllCopies:true,afterRefSequence:[1,4,3,2,1,0],queueCopiesRemainAfterPoolReturn:true,durationMs:duration,checkedWidths:widths,checkedFrames:times.size,oldFailuresReproduced:['hidden-document-stop','state-echo-stop','sparse-frame-time-clamp'],fixedCasesVerified:['timer-fallback','state-echo','sparse-frame-time'],playPauseRestartAndRestoreVerified:true,reducedMotionVerified:true,browserHostVerified:false,problems,sha256:crypto.createHash('sha256').update(fragment).digest('hex')};fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(problems.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
