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
