const normalize=value=>JSON.parse(JSON.stringify(value));
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const oldApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram,bundleFrame,bundlePreviewFrame,applyBundleFrame})');
  const checked=[];
  const canonicalAttributes=markup=>Array.from(markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)).map(m=>({tag:m[1],attrs:Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^\"]*)"/g)].filter(a=>!['id','href','filter','clip-path'].includes(a[1])).map(a=>[a[1],a[2]]))}));
  for(const width of [1024,736,700,699,360,320]){
    const scene=api.createBundleAnimationScene(width),old=oldApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),oldProgram=oldApi.createBundleProgram(scene.compact),nodes=parse(scene.markup),oldNodes=parse(old.markup);
    assert.deepEqual(normalize(scene.metrics),normalize(old.metrics));assert.deepEqual(normalize(program),normalize(oldProgram));
    assert(!scene.markup.includes('subject-frame'));assert(!scene.markup.includes('subject-surface'));
    const actualMarks=canonicalAttributes(scene.markup),oldMarks=canonicalAttributes(old.markup);assert.equal(actualMarks.length,oldMarks.length);
    let altered=0;
    for(let i=0;i<actualMarks.length;i++){
      const actual=actualMarks[i],previous=oldMarks[i];assert.equal(actual.tag,previous.tag);
      for(const key of new Set([...Object.keys(actual.attrs),...Object.keys(previous.attrs)])){
        if(actual.attrs[key]===previous.attrs[key])continue;
        assert(['fill','stroke'].includes(key),`Unexpected geometry/style change: ${key}`);assert.equal(actual.attrs[key],'var(--pcb-data-focus)');assert.equal(previous.attrs[key],'var(--pcb-active)');
        if(colorFigure===1)assert(['individual-msg-region','queue-lit-outline'].includes(actual.attrs['data-role']));
        else assert(['payload-lit-fill','data-ready-strip'].includes(actual.attrs['data-role']));altered++;
      }
    }
    assert.equal(altered,16);
    for(let r=0;r<2;r++){
      assert.deepEqual(normalize(scene.rows[r].character.positions),normalize(old.rows[r].character.positions));
      assert.deepEqual(normalize(scene.rows[r].packets.map(p=>p.payload)),normalize(old.rows[r].packets.map(p=>p.payload)));
      for(const beams of ['sourceBeams','copyBeams','outletBeams']){
        assert.deepEqual(normalize(scene.rows[r][beams].map(b=>b.points)),normalize(old.rows[r][beams].map(b=>b.points)));
        for(const beam of scene.rows[r][beams]){assert.equal(nodes.get(beam.trace).getAttribute('stroke'),'var(--pcb-active)');assert.equal(nodes.get(beam.head).getAttribute('fill'),'var(--pcb-active)');}
      }
    }
    for(const segment of program.segments){
      const frame=api.bundleFrame(segment.start+segment.duration/2,program),oldFrame=oldApi.bundleFrame(segment.start+segment.duration/2,oldProgram);assert.deepEqual(normalize(frame),normalize(oldFrame));
      api.applyBundleFrame(scene,frame,setter(nodes));oldApi.applyBundleFrame(old,oldFrame,setter(oldNodes));
      const newEntries=Array.from(nodes.values()),oldEntries=Array.from(oldNodes.values());assert.equal(newEntries.length,oldEntries.length);
      for(let i=0;i<newEntries.length;i++){
        for(const key of ['opacity','fill-opacity','width','transform','stroke-dashoffset','data-facing'])assert.equal(newEntries[i].getAttribute(key),oldEntries[i].getAttribute(key));
        assert.equal(newEntries[i].textContent,oldEntries[i].textContent);
      }
      if(segment.phase==='message'){
        const packet=scene.rows[segment.row].packets[segment.actor];assert.equal(Number(nodes.get(packet.mask).getAttribute('width')),packet.width/2);
      }
    }
    api.applyBundleFrame(scene,api.bundlePreviewFrame(program),setter(nodes));
    for(const label of scene.labels){
      ctx.font=`500 ${label.size}px PCB-Review`;const measured=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);
      assert(label.size>=11);assert(left>=-1&&left+measured<=width+1,`Label outside ${width}: ${label.label}`);
      assert(label.y-label.size/2>=0&&label.y+label.size/2<=scene.height);
    }
    const final=api.bundleFrame(program.end,program);api.applyBundleFrame(scene,final,setter(nodes));
    for(let r=0;r<2;r++){const row=scene.rows[r],state=final.rows[r];assert(state.moves.every(v=>v===1));assert(state.packets.every(v=>v===1));assert.equal(state.gray,0);assert.equal(state.opacity,1);for(const q of row.queue)assert.equal(nodes.get(q.id).getAttribute('opacity'),'0');}
    if(colorFigure===1){assert.equal(final.rows[0].calls,4);assert.equal(final.rows[1].calls,1);assert.equal(final.rows[0].copies,0);assert.equal(final.rows[1].copies,0);}
    else {assert.equal(scene.rows[0].messages.length,4);assert.equal(scene.rows[1].messages.length,1);assert.equal(final.rows[0].copies,4);assert.equal(final.rows[1].copies,1);}
    checked.push({width,height:scene.height,duration:program.end,colorOnlyChanges:altered});
  }
  const rt=runtime(),design=rt.designs[0],animation=design.animation;
  assert.equal(animation.getState().preview,true);assert.equal(animation.getState().playing,false);assert.equal(rt.saves.length,0);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>0);
  design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
  design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>paused);
  const target=animation.getProgram().segments.find(s=>s.row===1&&s.phase==='tick');animation.seek(target.start+target.duration/2);const phase=animation.getState().phase;
  rt.resize(320);assert.equal(animation.getState().phase,phase);assert.equal(design.board.getAttribute('viewBox'),'0 0 320 1080');
  design.buttons.play.fire('click');rt.advance();rt.advance(80);design.buttons.play.fire('click');const restored=runtime(736,false,rt.saves.at(-1));assert.equal(restored.designs[0].animation.getState().phase,animation.getState().phase);assert.equal(restored.saves.length,0);
  design.buttons.preview.fire('click');assert.equal(animation.getState().preview,true);
  const reduced=runtime(736,true);reduced.designs[0].buttons.play.fire('click');assert.equal(reduced.designs[0].animation.getState().playing,false);assert.equal(reduced.pending.size,0);
  for(const [folder,file,hash] of [
    ['wsasend-ring-light-v4','queue-light.html','3431e454ad51b28872379eaf4e01d58f4dd3b6b0e0bcf3bdf1193fcae039e97d'],
    ['sector-bundle-before-speed-v18','before-speed.html','41d9ad560871c9045803e4501011c81c384edb74da648177332d6c35420d3ace']
  ])assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'..',folder,file))).digest('hex'),hash);
  for(const width of [736,320]){
    const program=api.createBundleProgram(width<700),stage=(row,phase,actor)=>program.segments.find(s=>s.row===row&&s.phase===phase&&(actor===undefined||s.actor===actor));
    await snapshot(width,'silkscreen',null,`preview-${width}`);
    if(colorFigure===1){await snapshot(width,'silkscreen',stage(0,'queue',0).end,`before-ring-${width}`);await snapshot(width,'silkscreen',stage(1,'queue',3).end+100,`after-ring-${width}`);}
    else {await snapshot(width,'silkscreen',stage(0,'message',3).end,`before-msg-${width}`);await snapshot(width,'silkscreen',stage(1,'bundle').end+100,`after-msg-${width}`);}
  }
  const report={ok:true,figure:colorFigure,targetColor:baseColors['--pcb-data-focus'],checked,onlyTargetColorChanged:true,originalContrastAndTimingRestored:true,acceptedOriginalsPreserved:true,playPauseVerified:true,stateRestoreVerified:true,resizePreservesPhase:true,reducedMotionVerified:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
