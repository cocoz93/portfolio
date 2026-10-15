const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const configs=[
  {name:'wsasend-subject-focus-v6',base:'wsasend-ring-light-v4',oldKind:'wsasend-ring-light-',kind:'wsasend-subject-focus-',oldFile:'queue-light.html',file:'ring-subject-focus.html',figure:1},
  {name:'sector-bundle-subject-focus-v21',base:'sector-bundle-before-speed-v18',oldKind:'signal-',kind:'msg-subject-focus-',oldFile:'before-speed.html',file:'msg-subject-focus.html',figure:2}
];
const reviewBase=fs.readFileSync(path.join(root,'wsasend-ring-light-v4/qa/review.cjs'),'utf8').split('async function main(){')[0];
const reviewMain=fs.readFileSync(path.join(__dirname,'focus-review-main.cjs'),'utf8');
for(const config of configs){
  const dir=path.join(root,config.name);
  const baseline=fs.readFileSync(path.join(root,config.base,'scene-template.js'),'utf8');
  const marker='/* MAGE_RENDERER */',index=baseline.indexOf(marker);assert(index>=0);
  const body=fs.readFileSync(path.join(dir,'scene-body.jsfrag'),'utf8');
  fs.writeFileSync(path.join(dir,'scene-template.js'),baseline.slice(0,index).replace(config.oldKind,config.kind)+body);
  let template=fs.readFileSync(path.join(root,config.base,'design-studies-template.html'),'utf8').replaceAll(config.base,config.name);
  if(config.figure===1){
    template=template.replaceAll('wsasend-ring-light-minimal','wsasend-subject-focus-minimal').replaceAll('wsasend-ring-light-title','wsasend-subject-focus-title').replaceAll('wsasend-ring-light-desc','wsasend-subject-focus-desc');
    template=template.replace('기존 재생 속도를 유지합니다.','기본 이동과 전달 속도는 유지하고, 변경 후의 적재 후 보관은 0.36초, 틱 끝 누적 상태는 1초, 큐 배출은 0.3초 동안 표시합니다. 링버퍼 영역 전체의 바탕과 모서리 표시를 두고 캐릭터, Msg, 배선의 대비를 낮춰 링버퍼를 먼저 볼 수 있게 합니다.');
  }else{
    template=template.replaceAll('bundle-fill-minimal','msg-subject-focus-minimal').replaceAll('fill-minimal-title','msg-subject-focus-title').replaceAll('fill-minimal-desc','msg-subject-focus-desc');
    template=template.replace('채움은 기존과 같은 속도로 왼쪽에서 오른쪽으로 진행합니다.','채움은 기존과 같은 속도로 왼쪽에서 오른쪽으로 진행합니다. Msg 영역 전체의 바탕과 모서리 표시를 두고 캐릭터, SendQ, 배선의 대비를 낮춰 Msg를 먼저 볼 수 있게 합니다. 데이터가 들어온 Msg의 외곽을 밝게 표시해 개별 Msg 네 개와 묶음 Msg 하나의 경계를 구분합니다. 변경 후의 Msg 완성 상태는 0.8초 동안 보여줍니다.');
  }
  fs.writeFileSync(path.join(dir,'design-studies-template.html'),template);
  let build=fs.readFileSync(path.join(root,config.base,'qa/build.cjs'),'utf8').replaceAll(config.oldFile,config.file);
  fs.writeFileSync(path.join(dir,'qa/build.cjs'),build);
  const review=reviewBase.replaceAll('wsasend-ring-light-v4',config.name).replaceAll('queue-light.html',config.file)+`\nconst focusFigure=${config.figure},acceptedDir=${JSON.stringify(config.base)};\n`+reviewMain;
  fs.writeFileSync(path.join(dir,'qa/review.cjs'),review);
}
console.log('Prepared both review candidates; accepted files preserved.');
