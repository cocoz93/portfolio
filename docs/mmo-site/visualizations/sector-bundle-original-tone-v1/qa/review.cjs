const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp'));
const {createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');
const ctx=createCanvas(10,10).getContext('2d');
const fragment=fs.readFileSync(path.join(dir,'sector-bundle-original-tone.html'),'utf8');
const baseline=fs.readFileSync(path.resolve(dir,'../pcb-animation-v1/wsasend-pcb-previous.html'),'utf8');
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(match=>[match[1],match[2]]));
const originalColors=Object.fromEntries([...baseline.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(match=>[match[1],match[2]]));
for(const [name,value] of Object.entries(colors))assert.equal(value,originalColors[name],`Palette drift ${name}`);
assert.deepEqual(fragment.match(/@font-face\{[^}]+\}/g),baseline.match(/@font-face\{[^}]+\}/g));
const create=vm.runInNewContext(fs.readFileSync(path.join(dir,'scene.js'),'utf8')+';createOriginalToneBundle');
const widths=[736,700,699,360,320],checked=[];
async function main(){
  for(const width of widths){
    const scene=create(width),bounds=[];
    assert.equal((scene.markup.match(/data-role="single-source-sector"/g)||[]).length,1);
    assert.equal((scene.markup.match(/data-role="individual-packet"/g)||[]).length,4);
    assert.equal((scene.markup.match(/data-role="bundle-packet"/g)||[]).length,1);
    assert.equal((scene.markup.match(/data-role="bundle-entry"/g)||[]).length,4);
    assert.equal((scene.markup.match(/data-role="recipient-queue"/g)||[]).length,6);
    assert.equal((scene.markup.match(/data-enqueues="4"/g)||[]).length,3);
    assert.equal((scene.markup.match(/data-enqueues="1"/g)||[]).length,3);
    const facing={A:'east',B:'north',C:'west',D:'south'};
    for(const actor of Object.keys(facing))assert(scene.markup.includes(`data-facing="${facing[actor]}" data-actor="${actor}"`));
    for(const label of scene.labels){
      assert(label.size>=11);
      ctx.font=`${label.size}px PCB-Review`;
      const measured=ctx.measureText(label.label).width;
      const left=label.x-(label.anchor==='middle'?measured/2:label.anchor==='end'?measured:0),right=left+measured;
      const bound={label:label.label,left,right,top:label.y-label.size/2,bottom:label.y+label.size/2};
      assert(left>=0&&right<=width&&bound.top>=0&&bound.bottom<=scene.height,`Clipped label ${width}: ${label.label}`);
      bounds.push(bound);
    }
    for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){
      const a=bounds[i],b=bounds[j];
      assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),`Label overlap ${width}: ${a.label}/${b.label}`);
    }
    for(const points of scene.traces)for(let i=1;i<points.length;i++){
      assert(points[i][0]===points[i-1][0]||points[i][1]===points[i-1][1]);
      assert(points[i][0]>=0&&points[i][0]<=width&&points[i][1]>=0&&points[i][1]<=scene.height);
    }
    if([736,320].includes(width)){
      const markup=scene.markup.replace(/var\((--pcb-[\w-]+)\)/g,(_,name)=>{assert(colors[name]);return colors[name]});
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}</style>${markup}</svg>`;
      fs.writeFileSync(path.join(__dirname,`original-tone-${width}.svg`),svg);
      await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,`original-tone-${width}.png`));
    }
    checked.push({width,height:scene.height,labels:scene.labels.length});
  }
  const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
  assert(Buffer.byteLength(fragment)<1_000_000);
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  const board={attrs:{},children:[{tagName:'title'},{tagName:'desc'}],setAttribute(key,value){this.attrs[key]=value},replaceChildren(...children){this.children=children},insertAdjacentHTML(_,markup){this.markup=markup}};
  const root={querySelector:()=>board,getBoundingClientRect:()=>({width:320})};
  let frame,resize;
  vm.runInNewContext(script,{document:{getElementById:()=>root},requestAnimationFrame:fn=>{frame=fn;return 1},ResizeObserver:class{constructor(fn){resize=fn}observe(){}}});
  frame();assert.equal(board.attrs.viewBox,'0 0 320 1000');
  resize([{contentRect:{width:736}}]);frame();assert.equal(board.attrs.viewBox,'0 0 736 650');
  assert.equal(board.children.length,2);
  const report={verification:'source, component sizing, offscreen SVG rendering',browserHostVerified:false,static:true,matchedOriginalPalette:true,matchedOriginalFonts:true,checked};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
main().catch(error=>{console.error(error);process.exitCode=1});
