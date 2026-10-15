const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const colors=[{key:'mint',name:'민트',hex:'#79cfb0'},{key:'lavender',name:'라벤더',hex:'#baabf4'},{key:'coral',name:'코랄',hex:'#ef9c91'},{key:'amber',name:'앰버',hex:'#f2bb67'}];
const configs=[
  {name:'wsasend-color-studies-v8',base:'wsasend-ring-color-v7',oldKind:'wsasend-ring-color-',kind:'wsasend-color-study-',file:'ring-color-studies.html',oldFile:'ring-color.html',figure:1},
  {name:'sector-bundle-color-studies-v23',base:'sector-bundle-msg-color-v22',oldKind:'msg-color-',kind:'msg-color-study-',file:'msg-color-studies.html',oldFile:'msg-color.html',figure:2}
];
const original=fs.readFileSync(path.join(root,'pcb-animation-v1/wsasend-pcb-previous.html'),'utf8');
const mage=fs.readFileSync(path.join(root,'sector-bundle-layouts-v1/qa/layouts.cjs'),'utf8');
const begin=mage.indexOf('  function mageDefinition(){'),end=mage.indexOf('  function sector(');assert(begin>0&&end>begin);
const qaPrefixBase=fs.readFileSync(path.join(root,'wsasend-ring-color-v7/qa/review.cjs'),'utf8').split('const colorFigure=')[0];
const qaMain=fs.readFileSync(path.join(__dirname,'studies-review-main.cjs'),'utf8');
const replaceOnce=(source,from,to)=>{assert(source.includes(from),`Missing source anchor: ${from}`);return source.replace(from,to);};
for(const config of configs){
  const dir=path.join(root,config.name),base=path.join(root,config.base);fs.mkdirSync(path.join(dir,'qa'),{recursive:true});
  let scene=fs.readFileSync(path.join(base,'scene-template.js'),'utf8');
  scene=replaceOnce(scene,"material='minimal'){","material='minimal',color='mint'){");
  scene=replaceOnce(scene,`const kind='${config.oldKind}'+material`,`const kind='${config.kind}'+color+'-'+material`);
  scene=replaceOnce(scene,"  width=Math.max(320,width);","  width=Math.max(320,width);\n  if(!['mint','lavender','coral','amber'].includes(color))throw Error('Unsupported color');");
  fs.writeFileSync(path.join(dir,'scene-template.js'),scene);
  let motion=fs.readFileSync(path.join(base,'motion.js'),'utf8');
  if(config.figure===1){
    motion=replaceOnce(motion,"  const frame=bundleFrame(program.end,program);", "  const send=program.segments.find(segment=>segment.row===1&&segment.phase==='outlet');\n  const frame=bundleFrame(send.start+send.duration*.5,program);\n  for(const row of frame.rows){row.opacity=1;row.gray=0;}");
    motion=replaceOnce(motion,"frame.phase='같은 Msg 4개 · WSASend 4회 → 1회'","frame.phase='송신 요청 중 · 같은 Msg 4개 · 호출 4회 → 1회'");
  }
  fs.writeFileSync(path.join(dir,'motion.js'),motion);
  const source=scene.replace('/* MAGE_RENDERER */',mage.slice(begin,end))+'\n'+motion;new vm.Script(source);fs.writeFileSync(path.join(dir,'scene.js'),source);
  const api=vm.runInNewContext(source+';({createBundleAnimationScene,createBundleProgram,bundlePreviewFrame,applyBundleFrame})');
  function literalScene(color){
    const scene=api.createBundleAnimationScene(736,'silkscreen','chamfer','minimal',color),frame=api.bundlePreviewFrame(api.createBundleProgram(false)),attrs=new Map(),texts=new Map();
    api.applyBundleFrame(scene,frame,(id,values,text)=>{attrs.set(id,{...(attrs.get(id)||{}),...values});if(text!==undefined)texts.set(id,text);});
    let markup=scene.markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,body)=>{
      const id=body.match(/\bid="([^\"]+)"/)?.[1];if(!id||!attrs.has(id))return all;
      const values=Object.fromEntries([...body.matchAll(/([\w:-]+)="([^\"]*)"/g)].map(m=>[m[1],m[2]]));Object.assign(values,attrs.get(id));
      return `<${tag} ${Object.entries(values).map(([key,value])=>`${key}="${String(value).replaceAll('"','&quot;')}"`).join(' ')}>`;
    });
    return markup.replace(/(<text\b[^>]*\bid="([^\"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,end)=>texts.has(id)?`${open}${texts.get(id)}${end}`:all);
  }
  let template=fs.readFileSync(path.join(base,'design-studies-template.html'),'utf8').replaceAll(config.base,config.name);
  template=replaceOnce(template,`<div id="${config.name}">`,`<div id="${config.name}" class="viz-carousel" aria-label="${config.figure===1?'링버퍼':'Msg'} 강조색 비교" data-previous-label="이전 색상" data-next-label="다음 색상">`);
  const section=template.match(/  <section\b[\s\S]*?  <\/section>/)[0];
  const sections=colors.map((color,index)=>{
    let part=section.replace(/id="([^\"]+)"/g,(_,id)=>`id="${id}-${color.key}"`).replace(/aria-labelledby="([^\"]+)"/g,(_,ids)=>`aria-labelledby="${ids.split(' ').map(id=>id+'-'+color.key).join(' ')}"`);
    part=part.replace(/data-variant="[^\"]+"/,`data-variant="${color.name}" data-color="${color.key}"${index?' hidden':''}`);
    part=part.replace(/aria-label="[^\"]+"/,`aria-label="${color.name} 강조색"`);
    part=part.replaceAll('앰버색',color.name+'색').replace('<!-- SCENE_MINIMAL -->',literalScene(color.key));
    if(config.figure===1)part=part.replace('같은 Msg 4개 · WSASend 4회 → 1회</span>','송신 요청 중 · 같은 Msg 4개 · 호출 4회 → 1회</span>');
    return part;
  }).join('\n');
  template=template.replace(section,sections);
  template=replaceOnce(template,'</style>',colors.map(color=>`#${config.name} [data-color="${color.key}"] {--pcb-data-focus:${color.hex}}`).join('\n')+'\n</style>');
  template=replaceOnce(template,"const layout=design.getAttribute('data-layout'),", "const color=design.getAttribute('data-color'),layout=design.getAttribute('data-layout'),");
  template=replaceOnce(template,'scene=createBundleAnimationScene(width,layout,routing,material);','scene=createBundleAnimationScene(width,layout,routing,material,color);');
  template=replaceOnce(template,'return {layout,routing,material,name:','return {layout,routing,material,color,name:');
  template=replaceOnce(template,'return {layout,routing,material,segment:','return {layout,routing,material,color,segment:');
  template=replaceOnce(template,'if(saved?.layout!==layout','if(saved?.color!==color||saved?.layout!==layout');
  template=replaceOnce(template,'find(entry=>entry.layout===controller.state().layout','find(entry=>entry.color===controller.state().color&&entry.layout===controller.state().layout');
  fs.writeFileSync(path.join(dir,'design-studies-template.html'),template);
  const fragment=template.replace('/* ORIGINAL_FONTS */',original.match(/@font-face\{[^}]+\}/g).join('\n')).replace('/* MATCHED_SOURCE */',source);
  new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);assert(Buffer.byteLength(fragment)<1_000_000);
  fs.writeFileSync(path.join(dir,config.file),fragment);
  let prefix=qaPrefixBase.replaceAll('wsasend-ring-color-v7',config.name).replaceAll('ring-color.html',config.file);
  prefix=replaceOnce(prefix,"const names={minimal:'데이터만 강조'};",`const names=${JSON.stringify(Object.fromEntries(colors.map(color=>[color.key,color.name])))};`);
  prefix=prefix.replaceAll('data-routing="${routing}"','data-color="${routing}"');
  prefix=replaceOnce(prefix,"routing='minimal'","routing='mint'");prefix=replaceOnce(prefix,"routing='minimal'","routing='mint'");
  prefix=replaceOnce(prefix,"api.createBundleAnimationScene(width,layout,'chamfer',routing)","api.createBundleAnimationScene(width,layout,'chamfer','minimal',routing)");
  prefix=replaceOnce(prefix,"'data-material':routing,","'data-material':'minimal','data-color':routing,");
  fs.writeFileSync(path.join(dir,'qa/review.cjs'),prefix+`\nconst studyFigure=${config.figure},acceptedDir=${JSON.stringify(config.base)},colorSpecs=${JSON.stringify(colors)};\n`+qaMain);
  console.log(JSON.stringify({figure:config.figure,bytes:Buffer.byteLength(fragment),path:path.join(dir,config.file),colors:colors.map(color=>color.name)}));
}
