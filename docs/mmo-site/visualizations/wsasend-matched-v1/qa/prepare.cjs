const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
function once(text,old,replacement){assert(text.includes(old),old);assert.equal(text.split(old).length,2,old);return text.replace(old,replacement);}
let body=fs.readFileSync(path.join(dir,'scene-body.jsfrag'),'utf8');
const bundleStart=body.indexOf('    if(after){\n      const id='),bundleEnd=body.indexOf('    for(let i=0;i<4;i++){\n      const x=centers',bundleStart);
assert(bundleStart>0&&bundleEnd>bundleStart);body=body.slice(0,bundleStart)+body.slice(bundleEnd);
body=once(body,"index=after?'entry'+i:i","index=i");
body=body.replaceAll('if(!after){','{').replaceAll('if(!after)terminal','terminal');
body=once(body,"'data-role':after?'bundle-entry':'individual-data-entry'","'data-role':'individual-data-entry'");
body=once(body,"data-kind=\"${row===1?'bundle':'individual'}\"","data-kind=\"individual\"");
const blocks=[
  '      if(after){\n        const x=messageX+groupW/2,y=msgBottom+16',
  '      if(after){\n        const x=messageX+groupW/2;terminal'
];
for(const start of blocks){const a=body.indexOf(start),b=body.indexOf('\n      }',a);assert(a>0&&b>a);body=body.slice(0,a)+body.slice(b+8);}
body=once(body,"outputs.forEach(points=>wire(points,after?C.active:C.track,false,after?.85:.65))","outputs.forEach(points=>wire(points,C.track,false,.65))");
body=once(body,"after?'4개를 Msg 하나로':'개별 Msg 4개'","'같은 Msg 4개'");
body=once(body,"12,after?C.active:C.muted,'middle',false,{'data-role':'message-caption'}","12,C.muted,'middle',false,{'data-role':'message-caption'}");
body=once(body,'ring(ringX,ringY,G.ringR,after,meta);','ring(ringX,ringY,G.ringR,false,meta);');
body=once(body,"outletLabel:sid(row,'outlet-label'),","callCount:sid(row,'call-count'),outletLabel:sid(row,'outlet-label'),");
body=once(body,"    tag('path',{id:meta.kernelBoundary", "    txt('0회',(start+boundary)/2,ringY+15,12,C.muted,'middle',true,{id:meta.callCount,'data-role':'call-count'});\n    tag('path',{id:meta.kernelBoundary");
fs.writeFileSync(path.join(dir,'scene-body.jsfrag'),body);
let template=fs.readFileSync(path.join(dir,'scene-template.js'),'utf8');
template=template.slice(0,template.indexOf('/* MAGE_RENDERER */'))+body;
template=once(template,"txt(after?'묶음':'개별',cx,cy-5,14,C.text);","txt(meta.row===1?'누적':'즉시',cx,cy-5,14,C.text);");
template=once(template,"data-comparison=\"${after?'after':'before'}\"","data-comparison=\"${meta.row===1?'after':'before'}\"");
fs.writeFileSync(path.join(dir,'scene-template.js'),template);
let html=fs.readFileSync(path.join(dir,'design-studies-template.html'),'utf8');
html=html.replaceAll('sector-bundle-before-speed-v18','wsasend-matched-v1').replaceAll('bundle-fill-minimal','wsasend-matched-minimal').replaceAll('fill-minimal-title','wsasend-matched-title').replaceAll('fill-minimal-desc','wsasend-matched-desc').replaceAll('데이터만 강조','틱 끝 묶음 송신').replaceAll('같은 이동 메시지 4개 · Msg 4개 → 1개','같은 Msg 4개 · WSASend 4회 → 1회');
html=html.replace(/<desc id="wsasend-matched-desc">[\s\S]*?<\/desc>/,'<desc id="wsasend-matched-desc">1번 그림. 같은 수신 세션의 이동 메시지 네 개와 SendQ를 비교합니다. 변경 전에는 한 칸 이동할 때마다 Msg를 SendQ에 넣고 즉시 WSASend를 호출하여 큐를 비웁니다. 변경 후에는 같은 네 개의 Msg를 SendQ에 누적한 뒤 틱 끝에 WSASend를 한 번 호출합니다. Msg 자체를 합치는 최적화가 아닙니다. 오른쪽의 작은 송신 출구는 커널에 대한 송신 요청을 나타내며, 수신 완료나 TCP 패킷 수를 의미하지 않습니다. 두 개의 이동판, 마법사, Msg와 Header, 원형 큐, 접점과 사선 배선은 2번 그림과 같은 규칙을 사용합니다. 정지한 캐릭터는 정면을 보고 이동 중에만 해당 방향을 봅니다. Msg 채움은 왼쪽에서 오른쪽으로 진행합니다. 비활성 비교 행은 회색으로 표시합니다.</desc>');
html=once(html,'outboundMsgsBefore:f.rows[0].copies,outboundMsgsAfter:f.rows[1].copies,','callsBefore:f.rows[0].calls,callsAfter:f.rows[1].calls,');
html=once(html,'queuedBefore:f.rows[0].release>=1?0:f.rows[0].copies,queuedAfter:f.rows[1].release>=1?0:f.rows[1].copies','queuedBefore:f.rows[0].copies,queuedAfter:f.rows[1].copies');
fs.writeFileSync(path.join(dir,'design-studies-template.html'),html);
let build=fs.readFileSync(path.join(dir,'qa/build.cjs'),'utf8').replaceAll('before-speed.html','wsasend-matched.html');fs.writeFileSync(path.join(dir,'qa/build.cjs'),build);
console.log('Prepared Figure 1 with Figure 2 geometry.');
