const normalize=value=>JSON.parse(JSON.stringify(value));
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const oldFragment=fs.readFileSync(path.resolve(dir,'..',acceptedDir,pulseFigure===1?'ring-crisp-blue.html':'msg-crisp-blue.html'),'utf8');assert.deepEqual(readColors(fragment),readColors(oldFragment));
  const oldApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram,bundleFrame})');
  for(const [age,expected] of [[-1,0],[0,0],[20,.5],[40,1],[100,1],[150,1],[300,.5],[450,0],[700,0]])assert.equal(api.bundleArrivalPulse(1000+age,1000),expected);
  assert.equal(api.bundleArrivalPulse(100,Infinity),0);
  const checked=[];
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width),old=oldApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup);
    assert.deepEqual(normalize(scene.metrics),normalize(old.metrics));assert.deepEqual(normalize(program),normalize(oldApi.createBundleProgram(scene.compact)));
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
        const frame=api.bundleFrame(segment.end+80,program);api.applyBundleFrame(scene,frame,setter(nodes));
        assert.equal(nodes.get(row.queue[index].flash).getAttribute('opacity'),'1');assert.equal(nodes.get(row.queueLabels[index]).getAttribute('fill'),'var(--pcb-char-ink)');
        if(rowIndex===1)for(let j=0;j<index;j++)assert.equal(nodes.get(row.queue[j].flash).getAttribute('opacity'),'0');
      }
      const send=stage(1,'outlet'),sending=api.bundleFrame(send.start+80,program);api.applyBundleFrame(scene,sending,setter(nodes));
      for(const q of scene.rows[1].queue)assert.equal(nodes.get(q.flash).getAttribute('opacity'),'1');
      const expired=api.bundleFrame(stage(1,'queue',1).end+450,program);api.applyBundleFrame(scene,expired,setter(nodes));assert.equal(nodes.get(scene.rows[1].queue[1].flash).getAttribute('opacity'),'0');
    }else{
      assert.equal((scene.markup.match(/data-role="packet-arrival-flash"/g)||[]).length,8);
      for(const rowIndex of [0,1])for(let index=0;index<4;index++){
        const segment=stage(rowIndex,'message',index),row=scene.rows[rowIndex],frame=api.bundleFrame(segment.end+80,program);api.applyBundleFrame(scene,frame,setter(nodes));
        assert.equal(nodes.get(row.packets[index].flash).getAttribute('opacity'),'1');assert.equal(nodes.get(row.packets[index].normal[0]).getAttribute('fill'),'var(--pcb-char-ink)');
        for(let j=index+1;j<4;j++)assert.equal(nodes.get(row.packets[j].flash).getAttribute('opacity'),'0');
      }
      const bundle=stage(1,'bundle');api.applyBundleFrame(scene,api.bundleFrame(bundle.end+80,program),setter(nodes));for(const p of scene.rows[1].packets)assert.equal(nodes.get(p.flash).getAttribute('opacity'),'1');
      api.applyBundleFrame(scene,api.bundleFrame(bundle.end+450,program),setter(nodes));for(const p of scene.rows[1].packets)assert.equal(nodes.get(p.flash).getAttribute('opacity'),'0');
    }
    for(const segment of program.segments){const time=segment.start+segment.duration/2,frame=api.bundleFrame(time,program);assert.deepEqual(normalize(frame),normalize(oldApi.bundleFrame(time,program)));api.applyBundleFrame(scene,frame,setter(nodes));}
    const final=api.bundleFrame(program.end,program);api.applyBundleFrame(scene,final,setter(nodes));
    for(const row of scene.rows){for(const q of row.queue){assert.equal(nodes.get(q.id).getAttribute('opacity'),'0');if(q.flash)assert.equal(nodes.get(q.flash).getAttribute('opacity'),'0');}for(const p of row.packets)if(p.flash){assert.equal(nodes.get(p.flash).getAttribute('opacity'),'0');assert.equal(nodes.get(p.normal[0]).getAttribute('fill'),'var(--pcb-text)');}}
    for(const label of scene.labels){ctx.font=`500 ${label.size}px PCB-Review`;const w=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?w/2:label.anchor==='end'?w:0);assert(label.size>=11);assert(left>=-1&&left+w<=width+1);}
    api.applyBundleFrame(scene,api.bundlePreviewFrame(program),setter(nodes));checked.push({width,height:scene.height,duration:program.end});
  }
  const rt=runtime(),design=rt.designs[0],animation=design.animation;
  assert.equal(animation.getState().preview,true);assert.equal(rt.saves.length,0);design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>0);
  design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  const event=animation.getProgram().segments.find(s=>s.row===1&&s.phase===(pulseFigure===1?'queue':'bundle')&&(pulseFigure===2||s.actor===3));animation.seek(event.end+80);const phase=animation.getState().phase;
  design.buttons.play.fire('click');rt.advance();design.buttons.play.fire('click');const restored=runtime(736,false,rt.saves.at(-1));assert.equal(restored.designs[0].animation.getState().phase,phase);rt.resize(320);assert.equal(animation.getState().phase,phase);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);assert.equal(reduced.pending.size,0);
  for(const width of [736,320]){
    const program=api.createBundleProgram(width<700),stage=(row,phase,actor)=>program.segments.find(s=>s.row===row&&s.phase===phase&&(actor===undefined||s.actor===actor));await snapshot(width,'silkscreen',null,`preview-${width}`);
    if(pulseFigure===1){await snapshot(width,'silkscreen',stage(1,'queue',2).end+80,`arrival-${width}`);await snapshot(width,'silkscreen',stage(1,'outlet').start+80,`send-${width}`);await snapshot(width,'silkscreen',stage(1,'queue',2).end+450,`settled-${width}`);}
    else {await snapshot(width,'silkscreen',stage(1,'message',2).end+80,`arrival-${width}`);await snapshot(width,'silkscreen',stage(1,'bundle').end+80,`complete-${width}`);await snapshot(width,'silkscreen',stage(1,'bundle').end+450,`settled-${width}`);}
  }
  const report={ok:true,figure:pulseFigure,bytes:Buffer.byteLength(fragment),checked,pulseRiseMs:40,pulseHoldUntilMs:150,pulseFadeMs:300,arrivalOnly:true,emptySlotsNeverLit:true,completionSynchronizationVerified:true,restColorRestored:true,paletteGeometryAndTimingPreserved:true,playPauseVerified:true,resizeAndRestoreVerified:true,reducedMotionVerified:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
