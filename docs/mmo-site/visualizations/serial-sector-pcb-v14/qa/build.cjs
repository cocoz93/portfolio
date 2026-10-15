const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),previous=path.resolve(dir,'../serial-sector-presentation-v12');
const mage=fs.readFileSync(path.resolve(dir,'../sector-bundle-held-pulse-v26/scene.js'),'utf8'),begin=mage.indexOf('  function mageDefinition(){'),end=mage.indexOf('  function movement(');assert(begin>=0&&end>begin);
const prior=fs.readFileSync(path.join(previous,'scene-template.js'),'utf8');
let world=prior.slice(prior.indexOf('  function world('),prior.indexOf('  function pool('));
world=world.replace("txt('A',w.start[0]-23,w.start[1]+9,13", "txt('A',w.start[0],w.start[1]+25,13").replace('[[sx,sy+19],[sx,sy+39]]','[[sx+19,sy+19],[sx+19,sy+39]]');
let engine=prior.slice(prior.indexOf('function createReuseProgram('),prior.indexOf('function applySectorFrame('));
engine=engine.replace("add(row,'copy',i,600)","add(row,'copy',i,360)").replace("add(row,'copy',i,600)","add(row,'copy',i,i===1?360:600)").replace("ref:preview?(row===0?1:4):0","ref:preview?1:0");
engine=engine.replace("phase:'같은 알림 · Msg 생성 3회 → 1회'", "phase:'같은 알림 · Msg 생성 3회 → 1회 · SendQ Copy는 각각 3회'");
const source=fs.readFileSync(path.join(dir,'scene-template.js'),'utf8').replace('/* MAGE_RENDERER */',mage.slice(begin,end)).replace('/* WORLD_RENDERER */',world).replace('/* REUSE_ENGINE */',engine);
new vm.Script(source);fs.writeFileSync(path.join(dir,'scene.js'),source);const api=vm.runInNewContext(source+';({createSectorReuseScene})');
const fonts=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8').match(/@font-face\{[^}]+\}/g).join('\n');
let template=fs.readFileSync(path.join(dir,'sector-template.html'),'utf8').replaceAll('sector-ownership-v13','sector-pcb-v14').replaceAll('sector-ownership-title','sector-pcb-title').replaceAll('sector-ownership-desc','sector-pcb-desc');
fs.writeFileSync(path.join(dir,'sector-template.html'),template);
const fragment=template.replace('/* ORIGINAL_FONTS */',fonts).replace('/* SECTOR_SOURCE */',source).replace('<!-- SECTOR_SCENE -->',api.createSectorReuseScene(736).markup);
new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);assert(Buffer.byteLength(fragment)<1_000_000);fs.writeFileSync(path.join(dir,'sector-reuse.html'),fragment);
const previousReview=fs.readFileSync(path.join(previous,'qa/review.cjs'),'utf8');
let helpers=previousReview.slice(0,previousReview.indexOf('async function main(')).replaceAll('sector-presentation-v12','sector-pcb-v14');
helpers=helpers.replace("canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');", "canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/consola.ttf','PCB-Code-Review');")
 .replace('ctx.font=`500 ${l.size}px PCB-Review`', 'ctx.font=`500 ${l.size}px ${l.family===\'mono\'?\'PCB-Code-Review\':\'PCB-Review\'}`')
 .replace("sans-serif;font-weight:500}</style>","sans-serif;font-weight:500}.sector-ref{font-family:PCB-Code-Review,monospace}</style>");
fs.writeFileSync(path.join(__dirname,'review.cjs'),helpers+'\n'+fs.readFileSync(path.join(__dirname,'review-template.cjs'),'utf8'));
console.log(JSON.stringify({path:path.join(dir,'sector-reuse.html'),bytes:Buffer.byteLength(fragment)}));
