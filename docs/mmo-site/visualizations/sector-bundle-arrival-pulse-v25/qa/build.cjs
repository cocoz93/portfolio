const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const original=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8');
const previous=fs.readFileSync(path.resolve(dir,'../sector-bundle-layouts-v1/qa/layouts.cjs'),'utf8');
const begin=previous.indexOf('  function mageDefinition(){'),end=previous.indexOf('  function sector(');assert(begin>0&&end>begin);
const source=fs.readFileSync(path.join(dir,'scene-template.js'),'utf8').replace('/* MAGE_RENDERER */',previous.slice(begin,end))+'\n'+fs.readFileSync(path.join(dir,'motion.js'),'utf8');new vm.Script(source);
fs.writeFileSync(path.join(dir,'scene.js'),source,'utf8');
const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundlePreviewFrame,applyBundleFrame})');
function literalScene(layout,routing,material){
  const scene=api.createBundleAnimationScene(736,layout,routing,material),frame=api.bundlePreviewFrame(api.createBundleProgram(false)),attrs=new Map(),texts=new Map();
  api.applyBundleFrame(scene,frame,(id,values,text)=>{attrs.set(id,{...(attrs.get(id)||{}),...values});if(text!==undefined)texts.set(id,text);});
  let markup=scene.markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,body)=>{
    const id=body.match(/\bid="([^\"]+)"/)?.[1];if(!id||!attrs.has(id))return all;
    const values=Object.fromEntries([...body.matchAll(/([\w:-]+)="([^\"]*)"/g)].map(m=>[m[1],m[2]]));Object.assign(values,attrs.get(id));
    return `<${tag} ${Object.entries(values).map(([key,value])=>`${key}="${String(value).replaceAll('"','&quot;')}"`).join(' ')}>`;
  });
  return markup.replace(/(<text\b[^>]*\bid="([^\"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>texts.has(id)?`${open}${texts.get(id)}${end}`:all);
}
let fragment=fs.readFileSync(path.join(dir,'design-studies-template.html'),'utf8').replace('/* ORIGINAL_FONTS */',original.match(/@font-face\{[^}]+\}/g).join('\n')).replace('/* MATCHED_SOURCE */',source);
fragment=fragment.replace('<!-- SCENE_MINIMAL -->',literalScene('silkscreen','chamfer','minimal'));
new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);
fs.writeFileSync(path.join(dir,'msg-arrival-pulse.html'),fragment,'utf8');console.log(JSON.stringify({bytes:Buffer.byteLength(fragment),path:path.join(dir,'msg-arrival-pulse.html')}));
