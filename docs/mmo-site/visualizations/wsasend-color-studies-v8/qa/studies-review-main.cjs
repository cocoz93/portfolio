const normalize=value=>JSON.parse(JSON.stringify(value));
const composite=(top,bottom,alpha)=>'#'+[0,1,2].map(i=>Math.round(parseInt(top.slice(1+i*2,3+i*2),16)*alpha+parseInt(bottom.slice(1+i*2,3+i*2),16)*(1-alpha)).toString(16).padStart(2,'0')).join('');
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
async function main(){
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const opening=fragment.slice(0,fragment.indexOf('<script>'));
  assert(opening.includes('class="viz-carousel"'));assert.equal((opening.match(/class="study-design"/g)||[]).length,4);assert.equal((opening.match(/data-color="[^"]+" hidden/g)||[]).length,3);
  const allNodes=parse(opening),oldApi=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'..',acceptedDir,'scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram,bundleFrame})');
  const checked=[],contrastChecks=[];
  for(const spec of colorSpecs){
    assert.equal(palettes[spec.key]['--pcb-data-focus'],spec.hex);
    const textRatio=contrast(baseColors['--pcb-text'],composite(spec.hex,baseColors['--pcb-empty'],.46));
    const inkRatio=contrast(baseColors['--pcb-char-ink'],composite(spec.hex,baseColors['--pcb-empty'],.8));
    assert(textRatio>=4.5);assert(inkRatio>=4.5);contrastChecks.push({name:spec.name,dataTextContrast:textRatio,brightRingNumberContrast:inkRatio});
    for(const width of [736,700,699,360,320]){
      const scene=api.createBundleAnimationScene(width,'silkscreen','chamfer','minimal',spec.key),old=oldApi.createBundleAnimationScene(width),program=api.createBundleProgram(scene.compact),nodes=parse(scene.markup);
      assert.deepEqual(normalize(scene.metrics),normalize(old.metrics));assert.deepEqual(normalize(program),normalize(oldApi.createBundleProgram(scene.compact)));assert.equal(scene.height,old.height);
      assert(!scene.markup.includes('subject-frame'));assert(!scene.markup.includes('subject-surface'));
      for(let r=0;r<2;r++){
        const row=scene.rows[r],previous=old.rows[r];assert.deepEqual(normalize(row.character.positions),normalize(previous.character.positions));assert.deepEqual(normalize(row.packets.map(p=>p.payload)),normalize(previous.packets.map(p=>p.payload)));
        for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.deepEqual(normalize(row[beams].map(b=>b.points)),normalize(previous[beams].map(b=>b.points)));
        const targetIds=studyFigure===1?row.queue.map(q=>q.id):row.packets.map(p=>p.fill);for(const id of targetIds)assert.equal(nodes.get(id).getAttribute('fill'),'var(--pcb-data-focus)');
      }
      for(const label of scene.labels){
        ctx.font=`500 ${label.size}px PCB-Review`;const measured=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);
        assert(label.size>=11);assert(left>=-1&&left+measured<=width+1,`Label outside ${width}: ${label.label}`);
      }
      const times=program.segments.filter(s=>['move','message','queue','outlet','release','compare'].includes(s.phase)).map(s=>s.start+s.duration/2);
      for(const time of times){const frame=api.bundleFrame(time,program);assert.deepEqual(normalize(frame),normalize(oldApi.bundleFrame(time,program)));api.applyBundleFrame(scene,frame,setter(nodes));}
      const preview=api.bundlePreviewFrame(program);api.applyBundleFrame(scene,preview,setter(nodes));
      if(studyFigure===1){assert.equal(preview.rows[0].calls,4);assert.equal(preview.rows[1].calls,1);assert.equal(preview.rows[1].copies,4);assert.equal(preview.rows[1].sendLight,1);assert.equal(preview.rows[0].gray,0);assert.equal(preview.rows[1].gray,0);}
      checked.push({color:spec.name,width,height:scene.height,duration:program.end});
    }
  }
  const rt=runtime();assert.equal(rt.designs.length,4);assert.equal(rt.saves.length,0);
  for(let index=0;index<4;index++){
    rt.designs.forEach((design,i)=>{design.hidden=i!==index;});
    const design=rt.designs[index],animation=design.animation;assert.equal(animation.getState().playing,false);assert.equal(animation.getState().color,colorSpecs[index].key);
    design.buttons.play.fire('click');rt.advance();rt.advance(80);assert(animation.getState().time>0);
    design.buttons.play.fire('click');const paused=animation.getState().time;rt.advance(80);assert.equal(animation.getState().time,paused);
    const target=animation.getProgram().segments.find(s=>s.row===1&&s.phase==='tick');animation.seek(target.start+target.duration/2);assert.equal(animation.getState().color,colorSpecs[index].key);
    design.buttons.play.fire('click');rt.advance();rt.advance(80);design.buttons.play.fire('click');
  }
  const saved=rt.saves.at(-1),restored=runtime(736,false,saved);assert.equal(restored.saves.length,0);
  for(let i=0;i<4;i++){assert.equal(restored.designs[i].animation.getState().phase,rt.designs[i].animation.getState().phase);assert.equal(restored.designs[i].animation.getState().color,colorSpecs[i].key);}
  const phases=rt.designs.map(design=>design.animation.getState().phase);rt.resize(320);
  for(let i=0;i<4;i++){assert.equal(rt.designs[i].animation.getState().phase,phases[i]);assert.equal(rt.designs[i].board.getAttribute('viewBox'),'0 0 320 1080');}
  const reduced=runtime(736,true);for(const design of reduced.designs){design.buttons.play.fire('click');assert.equal(design.animation.getState().playing,false);}assert.equal(reduced.pending.size,0);
  for(const spec of colorSpecs){await snapshot(736,'silkscreen',null,`preview-${spec.key}`,spec.key);}
  await snapshot(320,'silkscreen',null,'mobile-mint','mint');
  const report={ok:true,figure:studyFigure,bytes:Buffer.byteLength(fragment),colors:colorSpecs,checked,contrastChecks,uniqueIDs:allNodes.size,unchangedMovementAndTiming:true,nativeCarousel:true,independentPlaybackVerified:true,colorStateRestoreVerified:true,resizePreservesPhase:true,reducedMotionVerified:true,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
