const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),oldMage=fs.readFileSync(path.resolve(dir,'../sector-bundle-held-pulse-v26/scene.js'),'utf8'),begin=oldMage.indexOf('  function mageDefinition(){'),end=oldMage.indexOf('  function movement(');assert(begin>=0&&end>begin);
const source=fs.readFileSync(path.join(dir,'scene-template.js'),'utf8').replace('/* MAGE_RENDERER */',oldMage.slice(begin,end));
new vm.Script(source);fs.writeFileSync(path.join(dir,'scene.js'),source,'utf8');const api=vm.runInNewContext(source+';({createSectorReuseScene})');
const fonts=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8').match(/@font-face\{[^}]+\}/g).join('\n');
const fragment=fs.readFileSync(path.join(dir,'sector-template.html'),'utf8').replace('/* ORIGINAL_FONTS */',fonts).replace('/* SECTOR_SOURCE */',source).replace('<!-- SECTOR_SCENE -->',api.createSectorReuseScene(736).markup);new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);assert(Buffer.byteLength(fragment)<1_000_000);fs.writeFileSync(path.join(dir,'sector-reuse.html'),fragment,'utf8');console.log(JSON.stringify({path:path.join(dir,'sector-reuse.html'),bytes:Buffer.byteLength(fragment)}));
const oldReview=fs.readFileSync(path.resolve(dir,'../serial-sector-zero-v6/qa/review.cjs'),'utf8');
const helpers=oldReview.slice(0,oldReview.indexOf('function runtime(')).replaceAll('sector-reuse-rough.html','sector-reuse.html').replace('[...row.copies,...row.returns,...row.allocations]','[...row.copies,row.input]');
fs.writeFileSync(path.join(__dirname,'review.cjs'),fs.readFileSync(path.join(__dirname,'review-template.cjs'),'utf8').replace('/* REVIEW_HELPERS */',helpers),'utf8');
