const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const configs=[
  {name:'wsasend-ring-color-v7',base:'wsasend-ring-light-v4',oldKind:'wsasend-ring-light-',kind:'wsasend-ring-color-',oldFile:'queue-light.html',file:'ring-color.html',figure:1},
  {name:'sector-bundle-msg-color-v22',base:'sector-bundle-before-speed-v18',oldKind:'signal-',kind:'msg-color-',oldFile:'before-speed.html',file:'msg-color.html',figure:2}
];
const qaPrefix=fs.readFileSync(path.join(root,'wsasend-ring-light-v4/qa/review.cjs'),'utf8').split('async function main(){')[0];
const qaMain=fs.readFileSync(path.join(__dirname,'color-review-main.cjs'),'utf8');
for(const config of configs){
  const dir=path.join(root,config.name),baseline=path.join(root,config.base);fs.mkdirSync(path.join(dir,'qa'),{recursive:true});
  let scene=fs.readFileSync(path.join(baseline,'scene-template.js'),'utf8').replace(config.oldKind,config.kind);
  scene=scene.replace("const C={bg:","const C={focus:'var(--pcb-data-focus)',bg:");
  if(config.figure===1){
    const begin=scene.indexOf('  function ring(cx,cy,r,after,meta){'),end=scene.indexOf('  function clippedCorners(points){');assert(begin>=0&&end>begin);
    scene=scene.slice(0,begin)+scene.slice(begin,end).replaceAll('C.active','C.focus')+scene.slice(end);
  }else{
    const from="ready?C.active:C.muted",to="ready?C.focus:C.muted";assert(scene.includes(from));scene=scene.replace(from,to);
    const strip="box(x+1,y+h-3,w-2,2,C.active,null";assert(scene.includes(strip));scene=scene.replace(strip,"box(x+1,y+h-3,w-2,2,C.focus,null");
  }
  fs.writeFileSync(path.join(dir,'scene-template.js'),scene);
  fs.writeFileSync(path.join(dir,'scene-body.jsfrag'),scene.slice(scene.indexOf('/* MAGE_RENDERER */')));
  fs.copyFileSync(path.join(baseline,'motion.js'),path.join(dir,'motion.js'));
  let template=fs.readFileSync(path.join(baseline,'design-studies-template.html'),'utf8').replaceAll(config.base,config.name);
  template=template.replace('--pcb-active:#6cc7ff;','--pcb-active:#6cc7ff;--pcb-data-focus:#f2bb67;');
  if(config.figure===1){
    template=template.replaceAll('wsasend-ring-light-minimal','wsasend-ring-color-minimal').replaceAll('wsasend-ring-light-title','wsasend-ring-color-title').replaceAll('wsasend-ring-light-desc','wsasend-ring-color-desc');
    template=template.replace('밝은 칸의 숫자는','링버퍼에 데이터가 있는 칸의 채움과 기존 점등 테두리만 앰버색으로 구분합니다. 배경, 배선, Msg의 블루, 주변 대비, 기존 애니메이션 속도는 그대로입니다. 밝은 칸의 숫자는');
  }else{
    template=template.replaceAll('bundle-fill-minimal','msg-color-minimal').replaceAll('fill-minimal-title','msg-color-title').replaceAll('fill-minimal-desc','msg-color-desc');
    template=template.replace('좌표 칸과 SendQ는 비었을 때 어둡게, 데이터가 들어올 때 더 밝은 블루로 채웁니다.','좌표 데이터 칸만 앰버색으로 채워 강조하고, SendQ와 배선은 기존 블루를 사용합니다. 배경, 주변 대비, 크기, 선, 기존 애니메이션 속도는 그대로입니다.');
    template=template.replace('차분한 블루로 남습니다.','차분한 채움으로 남습니다.');
  }
  fs.writeFileSync(path.join(dir,'design-studies-template.html'),template);
  fs.writeFileSync(path.join(dir,'qa/build.cjs'),fs.readFileSync(path.join(baseline,'qa/build.cjs'),'utf8').replaceAll(config.oldFile,config.file));
  let prefix=qaPrefix.replaceAll('wsasend-ring-light-v4',config.name).replaceAll('queue-light.html',config.file);
  prefix=prefix.replace("assert.deepEqual(colors,baselineColors,'Every variant must match figure 1 palette exactly')","assert.deepEqual(Object.fromEntries(Object.entries(colors).filter(([key])=>key!=='--pcb-data-focus')),baselineColors,'All existing colors preserved')");
  fs.writeFileSync(path.join(dir,'qa/review.cjs'),prefix+`\nconst colorFigure=${config.figure},acceptedDir=${JSON.stringify(config.base)};\n`+qaMain);
}
console.log('Restored approved geometry, contrast, and timing; only target data color differs.');
