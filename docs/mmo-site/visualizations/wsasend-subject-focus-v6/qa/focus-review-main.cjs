const normalize=value=>JSON.parse(JSON.stringify(value));
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
  assert(!fragment.includes('<!-- SCENE_MINIMAL -->'));
  const acceptedApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram})');
  const checked=[];
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width),prior=acceptedApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),oldProgram=acceptedApi.createBundleProgram(scene.compact),nodes=parse(scene.markup);
    assert.deepEqual(normalize(scene.metrics),normalize(prior.metrics));
    assert.equal(scene.height,prior.height);
    assert.equal(scene.rows[0].messages.length,4);assert.equal(scene.rows[1].messages.length,focusFigure===1?4:1);
    for(let r=0;r<2;r++){
      const row=scene.rows[r],old=prior.rows[r];
      assert.deepEqual(normalize(row.character.positions),normalize(old.character.positions));
      assert.deepEqual(normalize(row.packets.map(p=>p.payload)),normalize(old.packets.map(p=>p.payload)));
      assert.deepEqual(normalize(row.messages.map(({id,...geometry})=>geometry)),normalize(old.messages.map(({id,...geometry})=>geometry)));
      for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.deepEqual(normalize(row[beams].map(b=>b.points)),normalize(old[beams].map(b=>b.points)));
      const {x,y,w,h}=row.focusBounds;assert(x>=0&&y>=0&&x+w<=width&&y+h<=scene.height);
      assert.equal(nodes.get(row.focusSurface).getAttribute('fill'),'var(--pcb-surface)');
    }
    for(const label of scene.labels){
      ctx.font=`500 ${label.size}px PCB-Review`;const measured=ctx.measureText(label.label).width;
      const left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);
      assert(label.size>=11);assert(left>=-1&&left+measured<=width+1,`Label outside ${width}: ${label.label}`);
      assert(label.y-label.size/2>=0&&label.y+label.size/2<=scene.height);
    }
    for(const points of scene.traces)for(const [x,y] of points)assert(x>=0&&x<=width&&y>=0&&y<=scene.height);
    assert.equal(program.segments.length,oldProgram.segments.length);
    for(let i=0;i<program.segments.length;i++){
      const segment=program.segments[i],old=oldProgram.segments[i];
      assert.equal(segment.phase,old.phase);assert.equal(segment.actor,old.actor);assert.equal(segment.row,old.row);
      let expected=old.duration;
      if(focusFigure===1){if(segment.phase==='release')expected=300;if(segment.row===1&&segment.phase==='hold')expected=360;if(segment.phase==='tick')expected=1000;}
      else if(segment.row===1&&segment.phase==='hold'&&segment.actor===-1)expected=800;
      assert.equal(segment.duration,expected);
      const frame=api.bundleFrame((segment.start+segment.end)/2,program);api.applyBundleFrame(scene,frame,setter(nodes));
      for(let r=0;r<2;r++){
        const row=scene.rows[r],subject=focusFigure===1?'queue':'messages';
        assert.equal(nodes.get(row.layers[subject]).getAttribute('opacity'),'1');
        for(const name of ['source','inputs','outputs','outlet'])assert(Number(nodes.get(row.layers[name]).getAttribute('opacity'))<1);
      }
      if(segment.phase==='move')assert.equal(nodes.get(scene.rows[segment.row].character.face).getAttribute('data-facing'),scene.rows[segment.row].character.directions[segment.actor]);
      if(segment.phase==='message'){
        const packet=scene.rows[segment.row].packets[segment.actor];assert.equal(Number(nodes.get(packet.mask).getAttribute('width')),packet.width/2);
      }
      if(segment.row===0&&segment.phase!=='rowEnd'){assert.equal(frame.rows[1].opacity,.28);assert.equal(frame.rows[1].gray,1);}
      if(segment.row===1&&!['switch','compare'].includes(segment.phase)){assert.equal(frame.rows[0].opacity,.28);assert.equal(frame.rows[0].gray,1);}
    }
    const final=api.bundleFrame(program.end,program);api.applyBundleFrame(scene,final,setter(nodes));
    for(let r=0;r<2;r++){
      const row=scene.rows[r],state=final.rows[r];assert(state.moves.every(v=>v===1));assert(state.packets.every(v=>v===1));assert.equal(state.gray,0);assert.equal(state.opacity,1);
      assert.equal(nodes.get(row.character.face).getAttribute('data-facing'),'south');
      assert.equal(nodes.get(row.queueCount).textContent,focusFigure===1?'0개':'비움');
      for(const region of row.queue)assert.equal(Number(nodes.get(region.id).getAttribute('opacity')),0);
    }
    if(focusFigure===1){
      assert.equal(final.rows[0].calls,4);assert.equal(final.rows[1].calls,1);
      for(let actor=0;actor<4;actor++){
        const beforeQueue=program.segments.find(s=>s.row===0&&s.phase==='queue'&&s.actor===actor),beforeRelease=program.segments.find(s=>s.row===0&&s.phase==='release'&&s.actor===actor),afterQueue=program.segments.find(s=>s.row===1&&s.phase==='queue'&&s.actor===actor);
        assert.equal(api.bundleFrame(beforeQueue.end,program).rows[0].copies,1);assert.equal(api.bundleFrame(beforeRelease.end,program).rows[0].copies,0);
        assert.equal(api.bundleFrame(beforeRelease.end,program).rows[0].calls,actor+1);assert.equal(api.bundleFrame(afterQueue.end,program).rows[1].copies,actor+1);
      }
    }else{
      assert.equal(final.rows[0].copies,4);assert.equal(final.rows[1].copies,1);
      assert.equal((scene.markup.match(/data-role="packet-header"/g)||[]).length,5);
      assert.equal((scene.markup.match(/data-role="bundle-entry"/g)||[]).length,4);
      for(const row of scene.rows)for(const message of row.messages)assert.equal(nodes.get(message.id).getAttribute('stroke'),'var(--pcb-active)');
      const firstBefore=program.segments.find(s=>s.row===0&&s.phase==='move'),firstAfter=program.segments.find(s=>s.row===1&&s.phase==='move');assert.equal(firstAfter.duration/firstBefore.duration,1.25);
    }
    api.applyBundleFrame(scene,api.bundlePreviewFrame(program),setter(nodes));
    checked.push({width,height:scene.height,duration:program.end,geometryAndBeamPathsPreserved:true});
  }
  const rt=runtime(),design=rt.designs[0],animation=design.animation;
  assert.equal(animation.getState().preview,true);assert.equal(animation.getState().playing,false);assert.equal(rt.saves.length,0);
  design.buttons.play.fire('click');rt.advance(16);rt.advance(80);assert(animation.getState().time>0);
  design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>paused);
  const target=animation.getProgram().segments.find(s=>s.row===1&&s.phase===(focusFigure===1?'tick':'hold')&&s.actor===-1);
  animation.seek(target.start+target.duration/2);const phase=animation.getState().phase;
  rt.resize(320);assert.equal(animation.getState().phase,phase);assert.equal(design.board.getAttribute('viewBox'),'0 0 320 1080');
  design.buttons.play.fire('click');rt.advance();rt.advance(80);design.buttons.play.fire('click');
  const saved=rt.saves.at(-1),restored=runtime(736,false,saved);assert.equal(restored.designs[0].animation.getState().phase,animation.getState().phase);assert.equal(restored.saves.length,0);
  design.buttons.preview.fire('click');assert.equal(animation.getState().preview,true);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);assert.equal(reduced.pending.size,0);
  for(const [name,file,hash] of [
    ['wsasend-ring-light-v4','queue-light.html','3431e454ad51b28872379eaf4e01d58f4dd3b6b0e0bcf3bdf1193fcae039e97d'],
    ['sector-bundle-before-speed-v18','before-speed.html','41d9ad560871c9045803e4501011c81c384edb74da648177332d6c35420d3ace']
  ])assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'..',name,file))).digest('hex'),hash);
  for(const width of [736,320]){
    const program=api.createBundleProgram(width<700),stage=(row,phase,actor)=>program.segments.find(s=>s.row===row&&s.phase===phase&&(actor===undefined||s.actor===actor));
    await snapshot(width,'silkscreen',null,`preview-${width}`);
    if(focusFigure===1){
      await snapshot(width,'silkscreen',stage(0,'queue',0).end,`before-lit-${width}`);
      await snapshot(width,'silkscreen',stage(1,'tick').start+100,`after-held-${width}`);
      const send=stage(1,'outlet');await snapshot(width,'silkscreen',send.start+send.duration*.5,`after-send-${width}`);
    }else{
      await snapshot(width,'silkscreen',stage(0,'message',2).end,`before-msg-${width}`);
      await snapshot(width,'silkscreen',stage(1,'bundle').end+400,`after-msg-complete-${width}`);
    }
  }
  const report={ok:true,figure:focusFigure,bytes:Buffer.byteLength(fragment),checked,paletteChecks,subjectForegroundVerified:true,semanticsPreserved:true,meaningfulDwellVerified:true,playPauseVerified:true,resizePreservesPhase:true,reducedMotionVerified:true,stateRestoreVerified:true,acceptedOriginalsPreserved:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
