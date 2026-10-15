const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const configs=[
  {name:'wsasend-held-pulse-v11',base:'wsasend-arrival-pulse-v10',oldKind:'wsasend-arrival-pulse-',kind:'wsasend-held-pulse-',oldFile:'ring-arrival-pulse.html',file:'ring-held-pulse.html',figure:1},
  {name:'sector-bundle-held-pulse-v26',base:'sector-bundle-arrival-pulse-v25',oldKind:'msg-arrival-pulse-',kind:'msg-held-pulse-',oldFile:'msg-arrival-pulse.html',file:'msg-held-pulse.html',figure:2}
];
const prefixBase=fs.readFileSync(path.join(root,'wsasend-arrival-pulse-v10/qa/review.cjs'),'utf8').split('const pulseFigure=')[0];
const mainBase=fs.readFileSync(path.join(root,'wsasend-arrival-pulse-v10/qa/pulse-review-main.cjs'),'utf8');
const change=(source,from,to)=>{assert(source.includes(from),from);return source.replace(from,to);};
const verifyTiming=`
function verifyHoldTiming(program,previous){
  assert.equal(program.segments.length,previous.segments.length);
  let extra=0;
  for(let i=0;i<program.segments.length;i++){
    const current=program.segments[i],old=previous.segments[i];
    for(const key of ['row','phase','actor','label'])assert.equal(current[key],old[key]);
    let expected=old.duration;
    if(pulseFigure===1&&current.phase==='outlet')expected=650;
    if(current.row===1&&current.phase==='hold')expected=550;
    assert.equal(current.duration,expected);extra+=expected-old.duration;
  }
  assert.equal(program.end,previous.end+extra);
  assert.equal(extra,pulseFigure===1?2810:1850);
}
`;
for(const config of configs){
  const dir=path.join(root,config.name),base=path.join(root,config.base);fs.mkdirSync(path.join(dir,'qa'),{recursive:true});
  const scene=fs.readFileSync(path.join(base,'scene-template.js'),'utf8').replace(config.oldKind,config.kind);
  fs.writeFileSync(path.join(dir,'scene-template.js'),scene);fs.writeFileSync(path.join(dir,'scene-body.jsfrag'),scene.slice(scene.indexOf('/* MAGE_RENDERER */')));
  let motion=fs.readFileSync(path.join(base,'motion.js'),'utf8');
  motion=change(motion,'if(age<=0||age>=450)return 0;','if(age<=0||age>=890)return 0;');
  motion=change(motion,'if(age<=150)return 1;','if(age<=540)return 1;');
  motion=change(motion,'return 1-bundleEase((age-150)/300);','return 1-bundleEase((age-540)/350);');
  if(config.figure===1){
    motion=change(motion,"add(0,'outlet',transfer,actor)","add(0,'outlet',650,actor)");
    motion=change(motion,"add(1,'outlet',transfer)","add(1,'outlet',650)");
    motion=change(motion,"add(1,'hold',160,actor)","add(1,'hold',550,actor)");
  }else {
    assert(motion.includes("add(1,'hold',180"));motion=motion.replaceAll("add(1,'hold',180","add(1,'hold',550");
  }
  fs.writeFileSync(path.join(dir,'motion.js'),motion);
  const template=fs.readFileSync(path.join(base,'design-studies-template.html'),'utf8').replaceAll(config.base,config.name).replaceAll(config.oldKind,config.kind).replaceAll('약 0.15초','약 0.5초').replaceAll('0.3초에 걸쳐','0.35초에 걸쳐');
  fs.writeFileSync(path.join(dir,'design-studies-template.html'),template);
  fs.writeFileSync(path.join(dir,'qa/build.cjs'),fs.readFileSync(path.join(base,'qa/build.cjs'),'utf8').replaceAll(config.oldFile,config.file));
  let main=mainBase.replaceAll('ring-crisp-blue.html','ring-arrival-pulse.html').replaceAll('msg-crisp-blue.html','msg-arrival-pulse.html');
  main=change(main,'[[\u002d1,0],[0,0],[20,.5],[40,1],[100,1],[150,1],[300,.5],[450,0],[700,0]]','[[-1,0],[0,0],[20,.5],[40,1],[100,1],[400,1],[540,1],[715,.5],[890,0],[1000,0]]');
  main=change(main,'assert.deepEqual(normalize(program),normalize(oldApi.createBundleProgram(scene.compact)));','verifyHoldTiming(program,oldApi.createBundleProgram(scene.compact));');
  main=change(main,'assert.deepEqual(normalize(frame),normalize(oldApi.bundleFrame(time,program)));','assert(frame.rows.every(row=>row.opacity>=.28&&row.opacity<=1));');
  main=main.replaceAll('+80','+400').replaceAll('+450','+890');
  main=change(main,'pulseHoldUntilMs:150,pulseFadeMs:300','pulseHoldUntilMs:540,pulseFullHoldMs:500,pulseFadeMs:350');
  main=change(main,'paletteGeometryAndTimingPreserved:true','paletteAndGeometryPreserved:true,targetedHoldsExtended:true');
  main=main.replace('main().catch',verifyTiming+'\nmain().catch');
  const prefix=prefixBase.replaceAll('wsasend-arrival-pulse-v10',config.name).replaceAll('ring-arrival-pulse.html',config.file);
  fs.writeFileSync(path.join(dir,'qa/review.cjs'),prefix+`\nconst pulseFigure=${config.figure},acceptedDir=${JSON.stringify(config.base)};\n`+main);
}
console.log('Extended the full-bright hold to 500 ms and settling to 350 ms.');
