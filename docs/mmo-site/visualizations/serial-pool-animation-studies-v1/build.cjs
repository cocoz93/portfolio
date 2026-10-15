const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=__dirname,baseline=path.resolve(dir,'../serial-sector-current'),base=fs.readFileSync(path.join(baseline,'sector-reuse.html'),'utf8');
let source=fs.readFileSync(path.join(baseline,'scene.js'),'utf8');
source=source.replace('function createSectorReuseScene(width){',"function createSectorReuseScene(width,style='slot'){").replace("kind='sector-restored-current'","kind='sector-pool-study-'+style");
const noticeStart=source.indexOf('  function notice('),noticeEnd=source.indexOf('  function world(',noticeStart);
assert(noticeStart>=0&&noticeEnd>noticeStart);
source=source.slice(0,noticeStart)+fs.readFileSync(path.join(dir,'notice-shape.js'),'utf8')+'\n'+source.slice(noticeEnd);
const poolStart=source.indexOf('  function pool('),poolEnd=source.indexOf('  // Static and traveling buffers');assert(poolStart>=0&&poolEnd>poolStart);
source=source.slice(0,poolStart)+fs.readFileSync(path.join(dir,'pool-shape.js'),'utf8')+'\n'+source.slice(poolEnd);
source=source.replace('contact(a.pool.right+2,a.pool.cy,2);wire([[a.pool.right,a.pool.cy],[a.pool.right+2,a.pool.cy]]','contact(a.pool.right+2,a.pool.outputY,2);wire([[a.pool.right,a.pool.outputY],[a.pool.right+2,a.pool.outputY]]');
const pinsAnchor='for(const py of [dataTop+4,dataTop+dataHeight/2,dataTop+dataHeight-4]){pin(x,py,-1);pin(x+msgWidth,py,1);}';
assert.equal(source.split(pinsAnchor).length,2);
source=source.replace(pinsAnchor,'for(const py of [dataTop+4,dataTop+dataHeight/2,dataTop+dataHeight-4])pin(x,py,-1);for(const py of [cy-12,cy,cy+12])pin(x+msgWidth,py,1);');
const sequenceStart=source.indexOf('function createReuseProgram('),sequenceEnd=source.indexOf('function reusePoint(',sequenceStart);
assert(sequenceStart>=0&&sequenceEnd>sequenceStart);
source=source.slice(0,sequenceStart)+fs.readFileSync(path.join(dir,'sequence.js'),'utf8')+'\n'+source.slice(sequenceEnd);
const extraAnchor="    out.push('</g>');if(!after)wire([[24,rowHeight],[width-24,rowHeight]],C.edge);";
assert.equal(source.split(extraAnchor).length,2);source=source.replace(extraAnchor,fs.readFileSync(path.join(dir,'extras-shape.js'),'utf8')+'\n'+extraAnchor);
const extra=fs.readFileSync(path.join(dir,'studies.js'),'utf8'),controller=fs.readFileSync(path.join(dir,'controller.js'),'utf8');
const script=source+'\n'+extra+'\n'+controller;new vm.Script(script);
fs.writeFileSync(path.join(dir,'scene.js'),source+'\n'+extra);
const api=vm.runInNewContext(source+'\n'+extra+';({createPoolStudyScene,createReuseProgram,sectorFrame,applyPoolStudyFrame})');
const css=base.match(/<style>([\s\S]*?)<\/style>/)[1].replaceAll('#serial-sector-current','#serial-pool-animation-studies');
const panels=[['slot','슬롯 인출'],['gate','회로 게이트'],['card','카드 출납']].map(([style,name],index)=>{
  const s=api.createPoolStudyScene(736,style);
  return `<section data-variant="${name}" aria-label="${name} 애니메이션"${index?' hidden':''}>
  <div id="pool-study-${style}">
    <svg class="sector-board" xmlns="http://www.w3.org/2000/svg" width="736" height="${s.height}" viewBox="0 0 736 ${s.height}" role="img" aria-labelledby="${style}-title ${style}-desc">
      <title id="${style}-title">${name} · Msg 풀 할당과 반납</title>
      <desc id="${style}-desc">캐릭터가 중앙에 도착하면 세 수신자를 가리키는 회색 화살표가 모두 나타납니다. 현재 처리하는 수신자의 화살표만 파란색으로 바뀌고, 화살표의 길이와 위치는 그대로 유지됩니다. 변경 전에는 수신자 한 명마다 Msg 할당, SendQ Copy, 반납까지 파란색을 유지합니다. 변경 후에는 Msg 하나를 먼저 생성하고, S1, S2, S3에 차례로 Copy하며 해당 수신자만 점등한 뒤 마지막에 풀에 반납합니다. 두 경우 모두 세 SendQ에 바이트 사본이 남습니다.</desc>
      ${s.markup}
    </svg>
    <div class="viz-controls">
      <button type="button" class="btn btn-primary" data-study-action="short" aria-pressed="false">할당·반납 재생</button>
      <button type="button" class="btn" data-study-action="play" aria-pressed="false">전체 재생</button>
      <button type="button" class="btn" data-study-action="reset">처음으로</button>
    </div>
    <div class="sector-state-line"><span class="sector-status text-small" aria-live="polite">할당 → 사용 → 반납</span></div>
  </div>
</section>`;
}).join('\n');
const fragment=`<style>\n${css}\n</style>
<div id="serial-pool-animation-studies" class="viz-carousel" aria-label="Msg 풀 할당과 반납 애니메이션 시안" data-previous-label="이전 시안" data-next-label="다음 시안">
${panels}
</div>
<script>\n${script}\n</script>\n`;
assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
const file=path.join(dir,'pool-animation-studies.html');fs.writeFileSync(file,fragment);
console.log(JSON.stringify({file,bytes:Buffer.byteLength(fragment),variants:['슬롯 인출','회로 게이트','카드 출납'],baselineUnmodified:true}));
