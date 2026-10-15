const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const baseline=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8');
const original=fs.readFileSync(path.resolve(dir,'../sector-bundle-layouts-v1/qa/layouts.cjs'),'utf8');
const branch=original.indexOf('  if(kind==="fanout")'),end=original.indexOf('  }else if(kind==="anatomy")');
assert(branch>0&&end>branch);
let scene=original.slice(0,branch)+original.slice(branch,end)+'  }\n  return {markup:out.join("\\n"),height,width,kind,compact,labels,traces};\n}\n';
scene=scene.replace('function createBundleLayout(width,kind){','function createOriginalToneBundle(width){\n  const kind="original-tone";');
scene=scene.replace('if(kind==="fanout")','if(kind==="original-tone")');
function replaceOnce(before,after){assert(scene.includes(before),'Missing style anchor '+before.slice(0,70));scene=scene.replace(before,after);}
replaceOnce('  function mageDefinition(){',`  function pin(x,y,w,h){box(x,y,w,h,"var(--pcb-pin)",null,{opacity:.55,"data-role":"connection-pin"});}
  function messagePins(x,y,w,h){
    for(let i=0;i<2;i++){
      const py=y+6+i*(h-15);
      pin(x-6,py,4,3);pin(x+w+2,py,4,3);
    }
  }
  function queuePins(x,y,w,h){
    pin(x-6,y+h/2-2,4,4);pin(x+w+2,y+h/2-2,4,4);
    for(let i=0;i<4;i++){
      const px=x+w*(i+1)/5;
      pin(px-2,y-5,4,3);pin(px-2,y+h+2,4,3);
    }
  }
  function bundlePins(x,y,w,h){
    for(let i=0;i<4;i++){
      const py=y+h*(i+1)/5;
      pin(x-6,py-1.5,4,3);pin(x+w+2,py-1.5,4,3);
    }
  }
  function mageDefinition(){`);
replaceOnce('    box(x,y,w,h,C.bg,C.edge,{rx:2,"data-role":"single-source-sector"});',`    box(x,y,w,h,C.bg,C.edge,{rx:2,"data-role":"single-source-sector"});
    box(x+10,y+10,w-20,h-20,"none",C.edge,{"stroke-width":.8,opacity:.6});
    wire([[x+w/2,y+10],[x+w/2,y+h-10]],C.edge);
    wire([[x+10,y+h/2],[x+w-10,y+h/2]],C.edge);`);
replaceOnce('    box(x,y,w,h,C.surface,C.edge,{rx:2,"data-role":"individual-packet","data-actor":actor});','    messagePins(x,y,w,h);\n    box(x,y,w,h,C.surface,C.edge,{rx:2,"data-role":"individual-packet","data-actor":actor});');
replaceOnce('txt("H",x+head/2,y+h/2,12','txt("헤더",x+head/2,y+h/2,12');
replaceOnce('    box(x,y,w,h,C.surface,C.active,{rx:2,"data-role":"bundle-packet","data-count":4});','    bundlePins(x,y,w,h);\n    box(x,y,w,h,C.surface,C.active,{rx:2,"data-role":"bundle-packet","data-count":4});');
replaceOnce('txt("새 H",x+19,y+16,12','txt("새 헤더",x+32,y+16,12');
replaceOnce('    box(x,y,w,h,C.surface,C.edge,{rx:2});','    queuePins(x,y,w,h);\n    box(x,y,w,h,C.surface,C.edge,{rx:2});');
replaceOnce('txt(`×${after?1:4}`,x+w-19,y+h/2,13','txt(`×${after?1:4}`,x+w-19,y+h/2,22');
// A plain background keeps the same figure tone as the approved WSASend comparison.
replaceOnce('  mageDefinition();','  box(0,0,width,height,C.bg);\n  mageDefinition();');
new vm.Script(scene);
fs.writeFileSync(path.join(dir,'scene.js'),scene,'utf8');
const create=vm.runInNewContext(scene+';createOriginalToneBundle');
let fragment=fs.readFileSync(path.join(dir,'sector-bundle-original-tone-template.html'),'utf8');
fragment=fragment.replace('/* ORIGINAL_FONTS */',baseline.match(/@font-face\{[^}]+\}/g).join('\n')).replace('<!-- ORIGINAL_TONE_SCENE -->',create(736).markup).replace('/* ORIGINAL_TONE_SOURCE */',scene);
new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);
fs.writeFileSync(path.join(dir,'sector-bundle-original-tone.html'),fragment,'utf8');
console.log(JSON.stringify({bytes:Buffer.byteLength(fragment),path:path.join(dir,'sector-bundle-original-tone.html')}));
