const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const configs=[
  {name:'wsasend-crisp-blue-v9',base:'wsasend-ring-light-v4',oldKind:'wsasend-ring-light-',kind:'wsasend-crisp-blue-',oldFile:'queue-light.html',file:'ring-crisp-blue.html',figure:1},
  {name:'sector-bundle-crisp-blue-v24',base:'sector-bundle-before-speed-v18',oldKind:'signal-',kind:'msg-crisp-blue-',oldFile:'before-speed.html',file:'msg-crisp-blue.html',figure:2}
];
const prefixBase=fs.readFileSync(path.join(root,'wsasend-ring-light-v4/qa/review.cjs'),'utf8').split('async function main(){')[0];
const main=fs.readFileSync(path.join(__dirname,'crisp-review-main.cjs'),'utf8');
const change=(source,from,to)=>{assert(source.includes(from),from);return source.replace(from,to);};
for(const config of configs){
  const dir=path.join(root,config.name),base=path.join(root,config.base);fs.mkdirSync(path.join(dir,'qa'),{recursive:true});
  let scene=fs.readFileSync(path.join(base,'scene-template.js'),'utf8').replace(config.oldKind,config.kind);
  scene=change(scene,'const C={bg:',"const C={focus:'var(--pcb-data-focus)',bg:");
  if(config.figure===1)scene=change(scene,"const filledStyle={fill:C.active,'fill-opacity':.28};","const filledStyle={fill:C.focus,'fill-opacity':.72};");
  else {
    scene=change(scene,'ready?C.active:C.muted','ready?C.focus:C.muted');
    scene=change(scene,'box(x+1,y+h-3,w-2,2,C.active,null','box(x+1,y+h-3,w-2,2,C.focus,null');
  }
  fs.writeFileSync(path.join(dir,'scene-template.js'),scene);
  fs.writeFileSync(path.join(dir,'scene-body.jsfrag'),scene.slice(scene.indexOf('/* MAGE_RENDERER */')));
  let motion=fs.readFileSync(path.join(base,'motion.js'),'utf8');
  if(config.figure===1){
    motion=change(motion,'const alpha=.30+.50*strength','const alpha=.72+.28*strength');
    motion=change(motion,"ink=lamp.effectiveAlpha>.51?'var(--pcb-char-ink)':(meta.queueInk||'var(--pcb-text)')","ink=meta.queueInk||'var(--pcb-text)'");
    motion=change(motion,'  const frame=bundleFrame(program.end,program);',"  const send=program.segments.find(segment=>segment.row===1&&segment.phase==='outlet');\n  const frame=bundleFrame(send.start+send.duration*.5,program);\n  for(const row of frame.rows){row.opacity=1;row.gray=0;}");
    motion=change(motion,"frame.phase='같은 Msg 4개 · WSASend 4회 → 1회'","frame.phase='송신 요청 중 · 같은 Msg 4개 · 호출 4회 → 1회'");
  }else motion=change(motion,'set(packet.fill,{opacity:bundleLight(p)});','set(packet.fill,{opacity:bundleLight(p,.72,1)});');
  fs.writeFileSync(path.join(dir,'motion.js'),motion);
  let template=fs.readFileSync(path.join(base,'design-studies-template.html'),'utf8').replaceAll(config.base,config.name);
  template=change(template,'--pcb-active:#6cc7ff;','--pcb-active:#238fff;--pcb-data-focus:#0066d6;');
  if(config.figure===1){
    template=template.replaceAll('wsasend-ring-light-minimal','wsasend-crisp-blue-minimal').replaceAll('wsasend-ring-light-title','wsasend-crisp-blue-title').replaceAll('wsasend-ring-light-desc','wsasend-crisp-blue-desc');
    template=change(template,'밝은 칸의 숫자는 어두운 글자로 표시해 읽기 쉽게 합니다.','링버퍼 데이터는 짙고 선명한 블루로 채웁니다. 저장된 칸의 채움 농도는 72퍼센트, 입력과 송신 순간에는 100퍼센트로 높이며 숫자는 밝은 글자로 표시합니다. 첫 화면은 색 확인을 위한 송신 요청 중 장면이며, 재생하면 기존 타이밍으로 전체 과정을 보여줍니다.');
  }else {
    template=template.replaceAll('bundle-fill-minimal','msg-crisp-blue-minimal').replaceAll('fill-minimal-title','msg-crisp-blue-title').replaceAll('fill-minimal-desc','msg-crisp-blue-desc');
    template=change(template,'좌표 칸과 SendQ는 비었을 때 어둡게, 데이터가 들어올 때 더 밝은 블루로 채웁니다.','Msg의 좌표 데이터 칸은 비었을 때 어둡게, 채워지면 짙고 선명한 블루로 표시합니다. 저장된 데이터의 채움 농도는 72퍼센트, 입력 순간에는 100퍼센트입니다. SendQ의 기존 채움 방식은 유지합니다.');
  }
  fs.writeFileSync(path.join(dir,'design-studies-template.html'),template);
  fs.writeFileSync(path.join(dir,'qa/build.cjs'),fs.readFileSync(path.join(base,'qa/build.cjs'),'utf8').replaceAll(config.oldFile,config.file));
  let prefix=prefixBase.replaceAll('wsasend-ring-light-v4',config.name).replaceAll('queue-light.html',config.file);
  prefix=change(prefix,"assert.deepEqual(colors,baselineColors,'Every variant must match figure 1 palette exactly')","assert.deepEqual(Object.fromEntries(Object.entries(colors).filter(([key])=>!['--pcb-data-focus','--pcb-active'].includes(key))),Object.fromEntries(Object.entries(baselineColors).filter(([key])=>key!=='--pcb-active')))");
  fs.writeFileSync(path.join(dir,'qa/review.cjs'),prefix+`\nconst crispFigure=${config.figure},acceptedDir=${JSON.stringify(config.base)};\n`+main);
}
console.log('Original layout restored; saturated blue and stronger target fills prepared.');
