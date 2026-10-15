const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(dir,'scenes.js'),'utf8');new vm.Script(source);const api=vm.runInNewContext(source+';({createSharingStudy})');
const fonts=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8').match(/@font-face\{[^}]+\}/g).join('\n');
let fragment=fs.readFileSync(path.join(dir,'studies-template.html'),'utf8').replace('/* ORIGINAL_FONTS */',fonts).replace('/* STUDY_SOURCE */',source);
for(const variant of ['work','fanout','lifetime'])fragment=fragment.replace(`<!-- ${variant.toUpperCase()}_SCENE -->`,api.createSharingStudy(736,variant).markup);
new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);assert(Buffer.byteLength(fragment)<1_000_000);fs.writeFileSync(path.join(dir,'serial-sharing-design-studies.html'),fragment,'utf8');console.log(JSON.stringify({path:path.join(dir,'serial-sharing-design-studies.html'),bytes:Buffer.byteLength(fragment),variants:3,animated:false}));
