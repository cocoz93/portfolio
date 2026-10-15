const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {createPcbDesign}=require("./designs.cjs");
const {DESIGNS}=require("./config.cjs");
const dependencies="C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const sharp=require(path.join(dependencies,"sharp"));
const {createCanvas,GlobalFonts}=require(path.join(dependencies,"@napi-rs/canvas"));
GlobalFonts.registerFromPath("C:/Windows/Fonts/malgun.ttf","PCB-Review");
const metrics=createCanvas(1,1).getContext("2d");
async function main(){
  const fragment=fs.readFileSync(path.resolve(__dirname,"../pcb-design-variants.html"),"utf8");
  new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);
  const issues=[],checked=[];
  if(Buffer.byteLength(fragment)>=1_000_000)issues.push("fragment exceeds size budget");
  if((fragment.match(/class="viz-carousel"/g)||[]).length!==1)issues.push("carousel root count is invalid");
  if((fragment.match(/<section data-variant=/g)||[]).length!==3)issues.push("variant count is invalid");
  for(const {key,colors} of DESIGNS){
    for(const width of [736,700,699,360,320]){
      const scene=createPcbDesign(width,key),bounds=[];
      const expectedFacing={A:"east",B:"north",C:"west",D:"south"};
      const characters=Array.from(scene.markup.matchAll(/<use [^>]*data-character="mage" data-facing="([^"]+)" data-actor="([^"]+)"/g));
      if(characters.length!==4||characters.some(match=>expectedFacing[match[2]]!==match[1]))issues.push({key,width,reason:"character directions do not match movement"});
      const definitions=new Set(Array.from(scene.markup.matchAll(/ id="([^"]+)"/g),match=>match[1]));
      for(const match of scene.markup.matchAll(/href="#([^"]+)"/g))if(!definitions.has(match[1]))issues.push({key,width,reason:"missing SVG reference",id:match[1]});
      for(const label of scene.labels){
        metrics.font=`500 ${label.size}px PCB-Review`;
        const measured=metrics.measureText(label.label).width;
        const left=label.anchor==="middle"?label.x-measured/2:label.anchor==="end"?label.x-measured:label.x;
        const bound={label:label.label,left,right:left+measured,top:label.y-label.size*.5,bottom:label.y+label.size*.5};
        if(bound.left<-.1||bound.right>width+.1||bound.top<0||bound.bottom>scene.height)issues.push({key,width,label:label.label,reason:"label outside diagram"});
        if(label.size<11)issues.push({key,width,label:label.label,reason:"text smaller than 11px"});
        bounds.push(bound);
      }
      for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){
        const a=bounds[i],b=bounds[j];
        if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)issues.push({key,width,reason:"label collision",a:a.label,b:b.label});
      }
      for(const points of scene.traces){
        for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])issues.push({key,width,reason:"diagonal trace"});
        for(const [x,y] of points)if(x<0||x>width||y<0||y>scene.height)issues.push({key,width,reason:"trace outside diagram"});
      }
      const count=role=>(scene.markup.match(new RegExp(`data-role="${role}"`,"g"))||[]).length;
      if(count("single-source-sector")!==1||count("individual-packet")!==4||count("bundle-packet")!==1||count("recipient-queue")!==6)issues.push({key,width,reason:"packet or recipient count differs across designs"});
      for(const actor of ["A","B","C","D"])if(!scene.markup.includes(`data-role="bundle-entry" data-actor="${actor}"`))issues.push({key,width,reason:"bundle missing actor",actor});
      const enqueues=Array.from(scene.markup.matchAll(/data-enqueues="(\d+)"/g),match=>Number(match[1]));
      if(enqueues.join(",")!=="4,4,4,1,1,1")issues.push({key,width,reason:"copy counts differ across designs"});
      if(width===736||width===320){
        const body=scene.markup.replace(/var\(--([^\)]+)\)/g,(_,name)=>{
          if(!colors[name])throw new Error("Missing color: "+name);
          return colors[name];
        });
        const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:Malgun Gothic,sans-serif;font-weight:500}</style>${body}</svg>`;
        fs.writeFileSync(path.join(__dirname,`${key}-${width}.svg`),svg);
        await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,`${key}-${width}.png`));
      }
      checked.push({design:key,width,height:scene.height});
    }
  }
  const result={scope:"source, responsive diagram geometry, same data across designs, and offscreen SVG rendering",checked,issues,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,"review.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
