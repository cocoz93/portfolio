const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=__dirname,baseline=path.resolve(dir,'../serial-sector-current'),base=fs.readFileSync(path.join(baseline,'sector-reuse.html'),'utf8');
let source=fs.readFileSync(path.join(baseline,'scene.js'),'utf8');
source=source.replace('function createSectorReuseScene(width){',"function createSectorReuseScene(width,style='gate'){").replace("kind='sector-restored-current'","kind='sector-gate-'+style");
const characterAnchor='  function mage(x';assert.equal(source.split(characterAnchor).length,2);
source=source.replace(characterAnchor,fs.readFileSync(path.join(dir,'recipient-character.js'),'utf8')+'\n'+characterAnchor);
source=source.replace('box(0,0,width,height,C.bg);mageDefinition();','box(0,0,width,height,C.bg);mageDefinition();swordsmanDefinition();');
const recipientAnchor="mage(cx,cy-1,28,'south',key+'-S'+(i+1));";assert.equal(source.split(recipientAnchor).length,2);
source=source.replace(recipientAnchor,"swordsman(cx,cy-1,28,key+'-S'+(i+1));");
source=source.replace("txt('같은 Msg 재사용',mx,cy+66,13,C.muted","txt('빌더 1 + 수신자 3',mx,cy+66,13,C.muted");
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
const css=base.match(/<style>([\s\S]*?)<\/style>/)[1].replaceAll('#serial-sector-current','#serial-sector-gate')+'\n#serial-sector-gate { --pcb-char-hair:#554539; }';
const panels=[['gate','회로 게이트']].map(([style,name])=>{
  const s=api.createPoolStudyScene(736,style);
  return `<section aria-label="${name} 애니메이션">
  <div id="pool-study-${style}">
    <svg class="sector-board" xmlns="http://www.w3.org/2000/svg" width="736" height="${s.height}" viewBox="0 0 736 ${s.height}" role="img" aria-labelledby="${style}-title ${style}-desc">
      <title id="${style}-title">${name} · Msg 풀 할당과 반납</title>
      <desc id="${style}-desc">마법사 A가 중앙에 도착하면 검사 S1, S2, S3를 가리키는 회색 화살표가 모두 나타납니다. 현재 처리하는 수신자의 화살표만 파란색으로 바뀝니다. 변경 전에는 수신자마다 Msg를 할당, 직렬화, SendQ Copy, 반납합니다. 변경 후에는 Msg 하나를 생성해 빌더 참조 1을 갖고, 수신자 세 명 몫 AddRef(3)으로 Ref 4가 됩니다. Copy마다 수신자 몫을 SubRef해서 4, 3, 2, 1로 줄고, 마지막 빌더 SubRef로 Ref 0이 되어 풀에 반납합니다. 두 경우 모두 세 SendQ에 바이트 사본이 남습니다.</desc>
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
<div id="serial-sector-gate" aria-label="회로 게이트 · Msg 공유와 반환">
${panels}
</div>
<script>\n${script}\n</script>\n`;
assert(Buffer.byteLength(fragment)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));
const file=path.join(dir,'sector-gate.html');fs.writeFileSync(file,fragment);
console.log(JSON.stringify({file,bytes:Buffer.byteLength(fragment),design:'회로 게이트',characters:{A:'mage',receivers:'swordsman'},baselineUnmodified:true}));
