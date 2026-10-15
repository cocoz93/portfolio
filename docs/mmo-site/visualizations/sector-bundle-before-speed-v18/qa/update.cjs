const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'..');
for(const name of ['design-studies-template.html','qa/review.cjs','qa/build.cjs']){
  const file=path.join(dir,name);let text=fs.readFileSync(file,'utf8').replaceAll('sector-bundle-signal-v17','sector-bundle-before-speed-v18').replaceAll('signal-contrast.html','before-speed.html');
  if(name==='qa/review.cjs'){
    text=text.replace('../sector-bundle-before-speed-v18/motion.js','../sector-bundle-signal-v17/motion.js');
    text=text.replace('messageFillMs:350,sourceTransferDesktopMs:350','playbackRateBefore:1.25,playbackRateAfter:1,transitionRate:1,messageFillMs:{before:280,after:350},sourceTransferDesktopMs:{before:280,after:350}');
  }
  if(name.endsWith('.html'))text=text.replace('再生하면','再生하면').replace('재생하면 변경 전 다음 변경 후가 순서대로 움직입니다.','재생하면 변경 전은 기존의 1.25배속, 변경 후와 전후 전환은 기존 속도로 순서대로 움직입니다.');
  fs.writeFileSync(file,text);
}
console.log('Before-only playback rate 1.25; after and transition timings retained.');
