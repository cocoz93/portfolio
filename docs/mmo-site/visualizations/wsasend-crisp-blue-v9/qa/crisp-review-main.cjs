const normalize=value=>JSON.parse(JSON.stringify(value));
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  assert.equal(baseColors['--pcb-data-focus'],'#0066d6');assert.equal(baseColors['--pcb-active'],'#238fff');
  const textContrast=(luminance(baseColors['--pcb-text'])+.05)/(luminance(baseColors['--pcb-data-focus'])+.05);assert(textContrast>=4.5);
  const oldApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram,bundleFrame})');
  const checked=[];
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width),old=oldApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup);
    assert.deepEqual(normalize(scene.metrics),normalize(old.metrics));assert.deepEqual(normalize(program),normalize(oldApi.createBundleProgram(scene.compact)));
    assert(!scene.markup.includes('subject-surface'));assert(!scene.markup.includes('subject-frame'));
    for(let r=0;r<2;r++){
      const row=scene.rows[r],previous=old.rows[r];assert.deepEqual(normalize(row.character.positions),normalize(previous.character.positions));assert.deepEqual(normalize(row.packets.map(p=>p.payload)),normalize(previous.packets.map(p=>p.payload)));
      assert.deepEqual(normalize(row.messages.map(({id,...geometry})=>geometry)),normalize(previous.messages.map(({id,...geometry})=>geometry)));
      for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.deepEqual(normalize(row[beams].map(b=>b.points)),normalize(previous[beams].map(b=>b.points)));
    }
    for(const segment of program.segments){
      const time=segment.start+segment.duration/2,frame=api.bundleFrame(time,program);assert.deepEqual(normalize(frame),normalize(oldApi.bundleFrame(time,program)));api.applyBundleFrame(scene,frame,setter(nodes));
      if(crispFigure===1&&segment.phase==='queue'){
        const row=scene.rows[segment.row];assert.equal(Number(nodes.get(row.queue[segment.actor].id).getAttribute('fill-opacity')),.86);assert.equal(nodes.get(row.queueLabels[segment.actor]).getAttribute('fill'),'var(--pcb-muted)');
      }
      if(crispFigure===2&&segment.phase==='message'){
        const packet=scene.rows[segment.row].packets[segment.actor];assert.equal(Number(nodes.get(packet.fill).getAttribute('opacity')),1);assert.equal(Number(nodes.get(packet.mask).getAttribute('width')),packet.width/2);
      }
    }
    const final=api.bundleFrame(program.end,program);api.applyBundleFrame(scene,final,setter(nodes));
    for(const row of scene.rows)for(const q of row.queue)assert.equal(nodes.get(q.id).getAttribute('opacity'),'0');
    if(crispFigure===1){assert.equal(final.rows[0].calls,4);assert.equal(final.rows[1].calls,1);}
    else {assert.equal(scene.rows[0].messages.length,4);assert.equal(scene.rows[1].messages.length,1);for(const row of scene.rows)for(const p of row.packets)assert.equal(Number(nodes.get(p.fill).getAttribute('opacity')),.72);}
    for(const label of scene.labels){ctx.font=`500 ${label.size}px PCB-Review`;const w=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?w/2:label.anchor==='end'?w:0);assert(label.size>=11);assert(left>=-1&&left+w<=width+1);}
    api.applyBundleFrame(scene,api.bundlePreviewFrame(program),setter(nodes));
    checked.push({width,height:scene.height,duration:program.end,geometryPreserved:true});
  }
  const rt=runtime(),design=rt.designs[0],animation=design.animation;
  assert.equal(animation.getState().preview,true);assert.equal(rt.saves.length,0);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>0);design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  const target=animation.getProgram().segments.find(s=>s.row===1&&s.phase==='tick');animation.seek(target.start+target.duration/2);const phase=animation.getState().phase;rt.resize(320);assert.equal(animation.getState().phase,phase);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);design.buttons.play.fire('click');assert.equal(runtime(736,false,rt.saves.at(-1)).designs[0].animation.getState().phase,animation.getState().phase);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);assert.equal(reduced.pending.size,0);
  for(const [folder,file,hash] of [
    ['wsasend-ring-light-v4','queue-light.html','3431e454ad51b28872379eaf4e01d58f4dd3b6b0e0bcf3bdf1193fcae039e97d'],
    ['sector-bundle-before-speed-v18','before-speed.html','41d9ad560871c9045803e4501011c81c384edb74da648177332d6c35420d3ace']
  ])assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'..',folder,file))).digest('hex'),hash);
  for(const width of [736,320]){
    const program=api.createBundleProgram(width<700),stage=(row,phase,actor)=>program.segments.find(s=>s.row===row&&s.phase===phase&&(actor===undefined||s.actor===actor));
    await snapshot(width,'silkscreen',null,`preview-${width}`);
    if(crispFigure===1){await snapshot(width,'silkscreen',stage(0,'queue',0).end,`before-filled-${width}`);await snapshot(width,'silkscreen',stage(1,'tick').start,`after-stored-${width}`);}
    else {const message=stage(1,'message',2);await snapshot(width,'silkscreen',message.start+message.duration*.5,`active-data-${width}`);}
  }
  const report={ok:true,figure:crispFigure,bytes:Buffer.byteLength(fragment),saturatedFocusColor:baseColors['--pcb-data-focus'],whiteTextContrast:textContrast,checked,strongTargetFillVerified:true,originalGeometryAndTimingPreserved:true,originalsPreserved:true,playPauseVerified:true,resizePreservesPhase:true,stateRestoreVerified:true,reducedMotionVerified:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
