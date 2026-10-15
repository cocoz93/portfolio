const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(modules,'sharp')),canvas=require(path.join(modules,'@napi-rs/canvas'));
canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');
const dir=path.resolve(__dirname,'..'),fragment=fs.readFileSync(path.join(dir,'serial-sharing-design-studies.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scenes.js'),'utf8');
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1],api=vm.runInNewContext(source+';({createSharingStudy})');
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));
const variants=['work','fanout','lifetime'],widths=[1024,736,700,699,360,320],problems=[];
function textBounds(s){
  for(let i=0;i<s.bounds.length;i++)for(let j=i+1;j<s.bounds.length;j++){const a=s.bounds[i],b=s.bounds[j];if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0)problems.push({variant:s.variant,width:s.width,type:'component-overlap',a:a.role,b:b.role});}
  const ctx=canvas.createCanvas(1,1).getContext('2d');
  const labels=s.labels.map(l=>{ctx.font=`500 ${l.size}px PCB-Review`;const w=ctx.measureText(l.text).width,x=l.anchor==='start'?l.x:l.anchor==='end'?l.x-w:l.x-w/2;return {...l,x0:x,x1:x+w,y0:l.y-l.size/2,y1:l.y+l.size/2};});
  for(const l of labels){assert(l.size>=11);if(l.x0<0||l.x1>s.width||l.y0<0||l.y1>s.height)problems.push({variant:s.variant,width:s.width,type:'clipped',label:l.text});}
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)>1&&Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)>1)problems.push({variant:s.variant,width:s.width,type:'label-overlap',a:a.text,b:b.text});}
  for(const label of labels)for(const b of s.bounds){
    const fullyInside=label.x0>=b.x-1&&label.x1<=b.x+b.w+1&&label.y0>=b.y-1&&label.y1<=b.y+b.h+1;
    const intersects=Math.min(label.x1,b.x+b.w)-Math.max(label.x0,b.x)>1&&Math.min(label.y1,b.y+b.h)-Math.max(label.y0,b.y)>1;
    if(intersects&&!fullyInside)problems.push({variant:s.variant,width:s.width,type:'label-over-component-edge',label:label.text,role:b.role});
  }
}
function runtime(width){
  let resize,raf;const drawings=[];
  const boards=variants.map(variant=>({variant,children:[{tagName:'title'},{tagName:'desc'}],attrs:{},replaceChildren(...items){this.children=items;},insertAdjacentHTML(_,markup){this.markup=markup;drawings.push({variant,markup});},setAttribute(k,v){this.attrs[k]=v;}}));
  const designs=boards.map((board,i)=>({querySelector(s){assert.equal(s,'.proposal-board');return board;},getAttribute(name){assert.equal(name,'data-study');return variants[i];}}));
  const root={querySelectorAll(s){assert.equal(s,'[data-study]');return designs;},getBoundingClientRect:()=>({width})};
  vm.runInNewContext(script,{document:{getElementById(id){assert.equal(id,'serial-sharing-design-studies-v4');return root;}},requestAnimationFrame(fn){raf=fn;return 1;},ResizeObserver:class{constructor(fn){resize=fn;}observe(node){assert.equal(node,root);}}});
  return {boards,drawings,resize(newWidth){resize([{contentRect:{width:newWidth}}]);raf();}};
}
async function snapshot(width,variant){
  const s=api.createSharingStudy(width,variant),markup=s.markup.replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name]);return colors[name];});
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${markup}</svg>`;
  const name=`${variant}-${width}`;fs.writeFileSync(path.join(__dirname,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,name+'.png'));
}
async function main(){
  new vm.Script(script);assert(Buffer.byteLength(fragment)<1_000_000);
  assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));assert(!/\\"|\\n/.test(fragment.split('<script>')[0]));
  assert.equal([...fragment.matchAll(/<section\b/g)].length,3);assert.equal([...fragment.matchAll(/aria-label="[^"]+" hidden/g)].length,2);
  const idMatches=[...fragment.split('<script>')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(idMatches).size,idMatches.length);
  for(const width of widths)for(const variant of variants){const s=api.createSharingStudy(width,variant);assert.equal(s.width,width);assert.equal(s.height,width<700?992:736);assert(!/NaN|Infinity|undefined/.test(s.markup));for(const b of s.bounds)assert(b.x>=0&&b.y>=0&&b.x+b.w<=width&&b.y+b.h<=s.height,`Offscreen ${variant}/${width}/${b.role}`);for(const ps of s.paths)for(let i=0;i<ps.length;i++){const [x,y]=ps[i];assert(x>=0&&x<=width&&y>=0&&y<=s.height);if(i>0)assert(x===ps[i-1][0]||y===ps[i-1][1]);}textBounds(s);}
  const accepted=fs.readFileSync(path.resolve(dir,'../sector-bundle-held-pulse-v26/msg-held-pulse.html'),'utf8'),prior=Object.fromEntries([...accepted.matchAll(/(--pcb-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m=>[m[1],m[2]]));for(const [name,color] of Object.entries(colors))assert.equal(color,prior[name],name);
  const host=runtime(736);assert.equal(host.drawings.length,3);host.resize(320);for(const board of host.boards){assert.equal(board.attrs.width,'320');assert.equal(board.attrs.height,'992');assert.equal(board.children.length,2);}host.resize(736);for(const b of host.boards)assert.equal(b.attrs.height,'736');
  for(const width of [736,320])for(const variant of variants)await snapshot(width,variant);
  const result={ok:problems.length===0,figure:3,staticDesigns:variants,paletteMatched:true,responsiveWidths:widths,orthogonalTraces:true,textProblems:problems,runtimeResizeVerified:true,accessibleTitleAndDescriptionPreserved:true,carouselNavigation:'native-host',browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(problems.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
