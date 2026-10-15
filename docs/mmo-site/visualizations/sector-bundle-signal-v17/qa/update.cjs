const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const sceneFile=path.join(dir,'scene-template.js'),source=fs.readFileSync(sceneFile,'utf8'),marker=source.indexOf('/* MAGE_RENDERER */');assert(marker>0);
fs.writeFileSync(sceneFile,source.slice(0,marker)+fs.readFileSync(path.join(dir,'scene-body.jsfrag'),'utf8'));
for(const name of ['design-studies-template.html','qa/review.cjs','qa/build.cjs']){
  const file=path.join(dir,name);let text=fs.readFileSync(file,'utf8').replaceAll('sector-bundle-header-v16','sector-bundle-signal-v17').replaceAll('packet-header.html','signal-contrast.html');
  if(name.endsWith('.html'))text=text.replace('SendQ와 Msg의 큰 면은 낮은 강도로 채우고 저장된 데이터의 숫자, 준비 표시와 이동 신호를 하늘색으로 강조합니다.','좌표 칸과 SendQ는 비었을 때 어둡게, 데이터가 들어올 때 더 밝은 블루로 채웁니다. 현재 채우는 칸이 가장 밝고 저장 후에는 차분한 블루로 남습니다. Header와 Msg 이름표는 회색으로 채워져 데이터와 구분됩니다. 채움은 기존과 같은 속도로 왼쪽에서 오른쪽으로 진행합니다.');
  fs.writeFileSync(file,text);
}
console.log('Raised incoming-data contrast; retained palette, layout and animation durations.');
