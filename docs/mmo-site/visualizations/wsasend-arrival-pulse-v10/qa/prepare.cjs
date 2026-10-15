const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const configs=[
  {name:'wsasend-arrival-pulse-v10',base:'wsasend-crisp-blue-v9',oldKind:'wsasend-crisp-blue-',kind:'wsasend-arrival-pulse-',oldFile:'ring-crisp-blue.html',file:'ring-arrival-pulse.html',figure:1},
  {name:'sector-bundle-arrival-pulse-v25',base:'sector-bundle-crisp-blue-v24',oldKind:'msg-crisp-blue-',kind:'msg-arrival-pulse-',oldFile:'msg-crisp-blue.html',file:'msg-arrival-pulse.html',figure:2}
];
const helper=fs.readFileSync(path.join(__dirname,'pulse-cue.js'),'utf8');
const qaPrefix=fs.readFileSync(path.join(root,'wsasend-crisp-blue-v9/qa/review.cjs'),'utf8').split('const crispFigure=')[0];
const qaMain=fs.readFileSync(path.join(__dirname,'pulse-review-main.cjs'),'utf8');
const change=(source,from,to)=>{assert(source.includes(from),from);return source.replace(from,to);};
for(const config of configs){
  const dir=path.join(root,config.name),base=path.join(root,config.base);fs.mkdirSync(path.join(dir,'qa'),{recursive:true});
  let scene=fs.readFileSync(path.join(base,'scene-template.js'),'utf8').replace(config.oldKind,config.kind);
  if(config.figure===1){
    scene=change(scene,'      meta.queue.push({id,cx,cy,outer:r,inner,a,b});',"      const flash=sid(meta.row,'queue-flash',index);\n      tag('path',{id:flash,d:ringPath(cx,cy,r,inner,a,b),fill:C.active,opacity:0,'data-role':'queue-arrival-flash'});\n      meta.queue.push({id,flash,cx,cy,outer:r,inner,a,b});");
  }else{
    const from="    return {clip,mask,fill:key+'-fill',width:w-2,base:key+'-base',normal:[],ink:[],inkColor:bright?C.bg:C.text};";
    const to="    const flash=ready?key+'-flash':null;\n    if(flash)box(x+1,y+1,w-2,h-2,C.active,null,{id:flash,'clip-path':`url(#${clip})`,opacity:0,'data-role':'packet-arrival-flash'});\n    return {clip,mask,flash,fill:key+'-fill',width:w-2,base:key+'-base',normal:[],ink:[],inkColor:bright?C.bg:C.text};";
    scene=change(scene,from,to);
  }
  fs.writeFileSync(path.join(dir,'scene-template.js'),scene);fs.writeFileSync(path.join(dir,'scene-body.jsfrag'),scene.slice(scene.indexOf('/* MAGE_RENDERER */')));
  let motion=fs.readFileSync(path.join(base,'motion.js'),'utf8');
  if(config.figure===1)motion=change(motion,'const alpha=.72+.28*strength','const alpha=.72');
  else motion=change(motion,'set(packet.fill,{opacity:bundleLight(p,.72,1)});','set(packet.fill,{opacity:.72});');
  assert(motion.trimEnd().endsWith('}'));motion=motion.trimEnd();const finalBrace=motion.lastIndexOf('}');
  motion=motion.slice(0,finalBrace)+'  applyArrivalFlashes(scene,frame,set);\n'+motion.slice(finalBrace)+'\n'+helper.replace('__RING_MODE__',config.figure===1?'true':'false');
  fs.writeFileSync(path.join(dir,'motion.js'),motion);
  let template=fs.readFileSync(path.join(base,'design-studies-template.html'),'utf8').replaceAll(config.base,config.name);
  if(config.figure===1){
    template=template.replaceAll('wsasend-crisp-blue-minimal','wsasend-arrival-pulse-minimal').replaceAll('wsasend-crisp-blue-title','wsasend-arrival-pulse-title').replaceAll('wsasend-crisp-blue-desc','wsasend-arrival-pulse-desc');
    template=change(template,'저장된 칸의 채움 농도는 72퍼센트, 입력과 송신 순간에는 100퍼센트로 높이며 숫자는 밝은 글자로 표시합니다.','저장된 칸은 선명한 블루로 남습니다. 데이터 도착 시 그 칸이 밝은 전기 블루로 약 0.15초 동안 점등된 뒤 0.3초에 걸쳐 원래 블루로 돌아옵니다. 송신할 때는 저장된 칸들이 함께 한 번 점등되고, 비워진 칸은 꺼집니다. 점등 중인 숫자는 어두운 글자로 표시합니다.');
  }else{
    template=template.replaceAll('msg-crisp-blue-minimal','msg-arrival-pulse-minimal').replaceAll('msg-crisp-blue-title','msg-arrival-pulse-title').replaceAll('msg-crisp-blue-desc','msg-arrival-pulse-desc');
    template=change(template,'저장된 데이터의 채움 농도는 72퍼센트, 입력 순간에는 100퍼센트입니다.','저장된 데이터는 선명한 블루로 남습니다. 각 데이터가 도착하면 해당 칸이 밝은 전기 블루로 약 0.15초 점등된 뒤 0.3초에 걸쳐 원래 블루로 돌아옵니다. 묶음 Msg 완성 시 내부 데이터 네 칸이 함께 한 번 점등됩니다. 점등 중인 좌표는 어두운 글자로 표시합니다.');
  }
  fs.writeFileSync(path.join(dir,'design-studies-template.html'),template);
  fs.writeFileSync(path.join(dir,'qa/build.cjs'),fs.readFileSync(path.join(base,'qa/build.cjs'),'utf8').replaceAll(config.oldFile,config.file));
  const prefix=qaPrefix.replaceAll('wsasend-crisp-blue-v9',config.name).replaceAll('ring-crisp-blue.html',config.file).replace('bundleCharacterPose,applyBundleFrame})','bundleCharacterPose,applyBundleFrame,bundleArrivalPulse})');
  fs.writeFileSync(path.join(dir,'qa/review.cjs'),prefix+`\nconst pulseFigure=${config.figure},acceptedDir=${JSON.stringify(config.base)};\n`+qaMain);
}
console.log('Arrival and completion pulses prepared on both accepted blue designs.');
