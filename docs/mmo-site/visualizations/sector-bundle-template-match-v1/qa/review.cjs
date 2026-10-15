const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp'));
const {createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');
const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'sector-bundle-template-match.html'),'utf8');
const baseline=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8');
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const original=Object.fromEntries([...baseline.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
for(const [name,value] of Object.entries(colors))assert.equal(value,original[name],`Palette drift ${name}`);
assert.deepEqual(fragment.match(/@font-face\{[^}]+\}/g),baseline.match(/@font-face\{[^}]+\}/g));
const create=vm.runInNewContext(fs.readFileSync(path.join(dir,'scene.js'),'utf8')+';createMatchedBundle');
const checked=[];
async function main(){
  for(const width of [736,700,680,679,360,320]){
    const scene=create(width),bounds=[];
    for(const [role,count] of Object.entries({'source-sector':2,'individual-packet':4,'bundle-packet':1,'bundle-entry':4,'recipient-queue':6,'copy-count':2}))
      assert.equal((scene.markup.match(new RegExp(`data-role="${role}"`,'g'))||[]).length,count);
    for(const copies of [4,1])assert.equal((scene.markup.match(new RegExp(`data-enqueues="${copies}"`,'g'))||[]).length,3);
    for(const [actor,direction] of Object.entries({A:'east',B:'north',C:'west',D:'south'}))
      assert.equal((scene.markup.match(new RegExp(`data-facing="${direction}" data-actor="${actor}"`,'g'))||[]).length,2);
    for(const label of scene.labels){
      assert(label.size>=11);ctx.font=`${label.size}px PCB-Review`;
      const measured=ctx.measureText(label.label).width,left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0);
      const bound={label:label.label,left,right:left+measured,top:label.y-label.size/2,bottom:label.y+label.size/2};
      assert(left>=0&&bound.right<=width&&bound.top>=0&&bound.bottom<=scene.height,`Clipped label ${width}: ${label.label}`);bounds.push(bound);
    }
    for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){
      const a=bounds[i],b=bounds[j];assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),`Label overlap ${width}: ${a.label}/${b.label}`);
    }
    for(const points of scene.traces)for(let i=0;i<points.length;i++){
      assert(points[i][0]>=0&&points[i][0]<=width&&points[i][1]>=0&&points[i][1]<=scene.height);
      if(i)assert(points[i][0]===points[i-1][0]||points[i][1]===points[i-1][1]);
    }
    if([736,320].includes(width)){
      const markup=scene.markup.replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name]);return colors[name]});
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${markup}</svg>`;
      fs.writeFileSync(path.join(__dirname,`template-match-${width}.svg`),svg);
      await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,`template-match-${width}.png`));
    }
    checked.push({width,height:scene.height,labels:scene.labels.length});
  }
  const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
  assert(Buffer.byteLength(fragment)<1_000_000);assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const board={attrs:{},children:[{tagName:'title'},{tagName:'desc'}],setAttribute(k,v){this.attrs[k]=v},replaceChildren(...c){this.children=c},insertAdjacentHTML(_,m){this.markup=m}};
  const root={querySelector:()=>board,getBoundingClientRect:()=>({width:320})};let frame,resize;
  vm.runInNewContext(script,{document:{getElementById:()=>root},requestAnimationFrame:fn=>{frame=fn;return 1},ResizeObserver:class{constructor(fn){resize=fn}observe(){}}});
  frame();assert.equal(board.attrs.viewBox,'0 0 320 818');resize([{contentRect:{width:736}}]);frame();assert.equal(board.attrs.viewBox,'0 0 736 478');assert.equal(board.children.length,2);
  const report={verification:'source, geometry, offscreen SVG rendering',browserHostVerified:false,static:true,matchedOriginalPalette:true,matchedOriginalFonts:true,checked};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(error=>{console.error(error);process.exitCode=1});
