const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'..');
function once(s,old,value){assert(s.includes(old),old);assert.equal(s.split(old).length,2,old);return s.replace(old,value);}
let scene=fs.readFileSync(path.join(dir,'scene-template.js'),'utf8');
scene=scene.slice(0,scene.indexOf('/* MAGE_RENDERER */'))+fs.readFileSync(path.join(dir,'scene-body.jsfrag'),'utf8');
scene=once(scene,"const kind='wsasend-ring-emphasis-'","const kind='wsasend-ring-light-'");
scene=once(scene,'      meta.queue.push({id,cx,cy,outer:r,inner,a,b});',"      meta.queue.push({id,cx,cy,outer:r,inner,a,b});\n      const rim=sid(meta.row,'queue-rim',index);meta.queueRims.push(rim);\n      tag('path',{id:rim,d:ringPath(cx,cy,r,inner,a,b),fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0,'data-role':'queue-lit-outline'});");
fs.writeFileSync(path.join(dir,'scene-template.js'),scene);
let html=fs.readFileSync(path.join(dir,'design-studies-template.html'),'utf8').replaceAll('wsasend-ring-emphasis-v3','wsasend-ring-light-v4').replaceAll('wsasend-ring-emphasis-minimal','wsasend-ring-light-minimal').replaceAll('wsasend-ring-emphasis-title','wsasend-ring-light-title').replaceAll('wsasend-ring-emphasis-desc','wsasend-ring-light-desc');
html=html.replace(/<desc id="wsasend-ring-light-desc">[\s\S]*?<\/desc>/,'<desc id="wsasend-ring-light-desc">1번 그림. 같은 수신 세션의 SendQ에 같은 네 개의 Msg가 들어갑니다. 변경 전에는 하나가 들어올 때마다 즉시 WSASend를 호출하고 큐를 비웁니다. 변경 후에는 네 Msg를 누적한 뒤 틱 끝에 한 번 요청합니다. Msg 자체를 합치는 최적화가 아닙니다. 입력 중인 칸은 내부 채움과 테두리가 함께 켜지고 적재 후 0.2초 동안 밝기를 유지한 뒤 차분해집니다. 송신 요청 중에는 저장된 칸과 출력 배선이 함께 켜지고, 큐가 비워지면 소등합니다. 밝은 칸의 숫자는 어두운 글자로 표시해 읽기 쉽게 합니다. 링버퍼의 대기 개수는 변경 전 1과 0을 반복하고, 변경 후 1, 2, 3, 4로 늘었다가 0이 됩니다. 크기와 구도, 원본 블루, Msg 전달 후 톤이 낮아지는 동작, 기존 재생 속도를 유지합니다. 송신 출구는 커널에 대한 요청이며 수신 완료나 TCP 패킷 수를 의미하지 않습니다.</desc>');
fs.writeFileSync(path.join(dir,'design-studies-template.html'),html);
fs.writeFileSync(path.join(dir,'qa/build.cjs'),fs.readFileSync(path.join(dir,'qa/build.cjs'),'utf8').replaceAll('ring-emphasis.html','queue-light.html'));
let review=fs.readFileSync(path.join(dir,'qa/review.cjs'),'utf8').replaceAll('ring-emphasis.html','queue-light.html').replaceAll('wsasend-ring-emphasis-v3','wsasend-ring-light-v4');
const previous=path.resolve(dir,'../wsasend-ring-emphasis-v3/ring-emphasis.html'),sha=crypto.createHash('sha256').update(fs.readFileSync(previous)).digest('hex');
review=once(review,'  const program736=api.createBundleProgram(false)',`  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(dir,'../wsasend-ring-emphasis-v3/ring-emphasis.html'))).digest('hex'),'${sha}');\n  const program736=api.createBundleProgram(false)`);
review=once(review,"  const report={queueCounterVerified:true", "  await verifyQueueLighting(api,parse,setter,snapshot,normalize,previousApi,assert);\n  const report={queueLightHoldVerified:true,sendLightingSynchronized:true,queueCounterVerified:true");
review=review.replace('main().catch(error=>{console.error(error);process.exitCode=1;});',fs.readFileSync(path.join(dir,'qa/lighting-checks.jsfrag'),'utf8')+"\nmain().catch(error=>{console.error(error);process.exitCode=1;});\n");
fs.writeFileSync(path.join(dir,'qa/review.cjs'),review);
console.log('Prepared stronger fill, active rim, 200ms hold, and synchronized outlet lighting.');
