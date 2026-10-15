const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const deps='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp'));
const {createCanvas,GlobalFonts}=require(path.join(deps,'@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');
const ctx=createCanvas(10,10).getContext('2d'),dir=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(dir,'scenes.js'),'utf8'),create=vm.runInNewContext(source+';createPcbStudy');
const pixels=JSON.parse(fs.readFileSync(path.join(__dirname,'mage-pixels.json'),'utf8'));
const checks=[];
async function review(){
  for(const width of [736,700,680,679,360,320]){
    for(const design of ['mask','schematic','assembly']){
      const scene=create(width,design,pixels);
      assert.equal(scene.roleCounts.character,2);
      assert.equal(scene.roleCounts.message,8);
      assert.equal(scene.roleCounts['queue-slot'],16);
      assert.equal(scene.roleCounts['send-trace'],5);
      assert.equal(scene.roleCounts['call-count'],2);
      assert.equal((scene.markup.match(/data-role="batch-message"/g)||[]).length,4);
      assert.equal((scene.markup.match(/data-lit="true"/g)||[]).length,4);
      assert(scene.markup.includes('data-calls="4"')&&scene.markup.includes('data-calls="1"'));
      assert(!/\b(?:linearGradient|radialGradient|filter)\b/.test(scene.markup));
      const boxes=[];
      for(const label of scene.labels){
        assert(label.size>=11);
        ctx.font=`${label.size}px PCB-Review`;
        const tw=ctx.measureText(label.label).width;
        const left=label.x-(label.anchor==='middle'?tw/2:label.anchor==='end'?tw:0),right=left+tw;
        assert(left>=0&&right<=width&&label.y-label.size/2>=0&&label.y+label.size/2<=scene.height,`${design} ${width}: clipped ${label.label}`);
        boxes.push({label:label.label,left,right,top:label.y-label.size/2,bottom:label.y+label.size/2});
      }
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
        const a=boxes[i],b=boxes[j];
        assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),`${design} ${width}: overlapping labels ${a.label} / ${b.label}`);
      }
      for(const route of scene.traces)for(let i=1;i<route.length;i++){
        assert(route[i][0]===route[i-1][0]||route[i][1]===route[i-1][1]);
        for(const point of [route[i],route[i-1]])assert(point[0]>=0&&point[0]<=width&&point[1]>=0&&point[1]<=scene.height);
      }
      if([736,320].includes(width)){
        const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}.pcb-study-mono{font-family:PCB-Review,'Malgun Gothic',monospace}</style>${scene.markup}</svg>`;
        fs.writeFileSync(path.join(__dirname,`${design}-${width}.svg`),svg);
        await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,`${design}-${width}.png`));
      }
      checks.push({design,width,height:scene.height,labels:scene.labels.length,pads:scene.roleCounts.pad,traces:scene.traces.length});
    }
  }
  const fragment=fs.readFileSync(path.join(dir,'wsasend-pcb-studies.html'),'utf8');
  assert(Buffer.byteLength(fragment)<1024*1024);
  assert.equal((fragment.match(/<section data-variant=/g)||[]).length,3);
  assert.equal((fragment.match(/hidden>/g)||[]).length,2);
  const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];
  new vm.Script(script);
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
  // Exercise responsive source updates without using a browser or URL navigation.
  const boards=['mask','schematic','assembly'].map(design=>({attrs:{'data-design':design},children:[{tagName:'title'},{tagName:'desc'}],getAttribute(key){return this.attrs[key]},setAttribute(key,value){this.attrs[key]=value},replaceChildren(...children){this.children=children},insertAdjacentHTML(_,html){this.markup=html}}));
  let width=320,callback,pending;
  const root={querySelectorAll:()=>boards,getBoundingClientRect:()=>({width})};
  vm.runInNewContext(script,{document:{getElementById:()=>root},requestAnimationFrame:fn=>{pending=fn;return 1},ResizeObserver:class{constructor(fn){callback=fn}observe(){}}});
  pending();assert(boards.every(board=>board.attrs.viewBox==='0 0 320 810'));
  width=736;callback([{contentRect:{width}}]);pending();assert(boards.every(board=>board.attrs.viewBox==='0 0 736 506'));
  assert(boards.every(board=>board.children.length===2&&board.markup.includes('data-calls="4"')));
  const report={verification:'source, emulated responsive component, offscreen SVG rasterization',browserHostVerified:false,staticDesigns:true,checks};
  fs.writeFileSync(path.join(__dirname,'review.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}
review().catch(error=>{console.error(error);process.exitCode=1});
