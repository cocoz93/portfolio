const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {createBundleLayout}=require("./layouts.cjs");
const dependencies="C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const sharp=require(path.join(dependencies,"sharp"));
const {createCanvas,GlobalFonts}=require(path.join(dependencies,"@napi-rs/canvas"));
GlobalFonts.registerFromPath("C:/Windows/Fonts/malgun.ttf","PCB-Review");
const metrics=createCanvas(1,1).getContext("2d");
const colors={"pcb-bg":"#091a23","pcb-surface":"#0a131c","pcb-edge":"#35525f","pcb-track":"#91acb4","pcb-text":"#eef6f8","pcb-muted":"#b0c2ca","pcb-active":"#67d5e6","pcb-soft":"#143440","pcb-empty":"#142630","pcb-char-ink":"#08121e","pcb-char-steel":"#dce9f3","pcb-char-steel-dark":"#617e9a","pcb-char-blue-mid":"#2579ad","pcb-char-blue-dark":"#17466a","pcb-char-skin":"#ecd0b5","pcb-char-skin-dark":"#bd947a"};
async function main(){
  const fragment=fs.readFileSync(path.resolve(__dirname,"../sector-bundle-pcb.html"),"utf8");
  new vm.Script(fragment.match(/<script>([\s\S]*?)<\/script>/)[1]);
  const issues=[];
  if(Buffer.byteLength(fragment)>=1_000_000)issues.push("fragment exceeds size budget");
  if((fragment.match(/class="viz-carousel"/g)||[]).length!==1)issues.push("carousel root count is invalid");
  const checked=[];
  for(const kind of ["fanout","anatomy","matrix"]){
    for(const width of [736,700,699,360,320]){
      const scene=createBundleLayout(width,kind),bounds=[];
      const characters=Array.from(scene.markup.matchAll(/<use [^>]*data-character="mage" data-facing="([^"]+)" data-actor="([^"]+)"/g));
      const expectedFacing={A:"east",B:"north",C:"west",D:"south"};
      if(characters.length!==4||characters.some(match=>expectedFacing[match[2]]!==match[1]))issues.push({kind,width,reason:"character directions do not match movement"});
      for(const facing of Object.values(expectedFacing))if(!scene.markup.includes(`id="bundle-mage-${kind}-${facing}"`))issues.push({kind,width,reason:"missing directional sprite",facing});
      for(const label of scene.labels){
        metrics.font=`500 ${label.size}px PCB-Review`;
        const measured=metrics.measureText(label.label).width;
        const left=label.anchor==="middle"?label.x-measured/2:label.anchor==="end"?label.x-measured:label.x;
        const bound={label:label.label,left,right:left+measured,top:label.y-label.size*.5,bottom:label.y+label.size*.5};
        if(bound.left<-.1||bound.right>width+.1||bound.top<0||bound.bottom>scene.height)issues.push({kind,width,label:label.label,reason:"label outside diagram"});
        if(label.size<11)issues.push({kind,width,label:label.label,reason:"text smaller than 11px"});
        bounds.push(bound);
      }
      for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){
        const a=bounds[i],b=bounds[j];
        if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)issues.push({kind,width,reason:"label collision",a:a.label,b:b.label});
      }
      for(const points of scene.traces){
        for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])issues.push({kind,width,reason:"diagonal trace"});
        for(const [x,y] of points)if(x<0||x>width||y<0||y>scene.height)issues.push({kind,width,reason:"trace outside diagram"});
      }
      if(kind!=="matrix"){
        if((scene.markup.match(/data-role="individual-packet"/g)||[]).length!==4||(scene.markup.match(/data-role="bundle-packet"/g)||[]).length!==1)issues.push({kind,width,reason:"packet count does not match 4 to 1"});
      }else{
        const before=(scene.markup.match(/data-role="copy-operation" data-comparison="before"/g)||[]).length;
        const after=(scene.markup.match(/data-role="copy-operation" data-comparison="after"/g)||[]).length;
        if(before!==12||after!==3)issues.push({kind,width,reason:"matrix operations do not match 12 to 3"});
      }
      for(const actor of ["A","B","C","D"])if(!scene.markup.includes(`data-role="bundle-entry" data-actor="${actor}"`))issues.push({kind,width,reason:"bundle missing actor",actor});
      if(width===736||width===320){
        const body=scene.markup.replace(/var\(--([^\)]+)\)/g,(_,name)=>colors[name]);
        const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:Malgun Gothic,sans-serif;font-weight:500}</style><rect width="${width}" height="${scene.height}" fill="${colors["pcb-bg"]}"/>${body}</svg>`;
        fs.writeFileSync(path.join(__dirname,`${kind}-${width}.svg`),svg);
        await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,`${kind}-${width}.png`));
      }
      checked.push({kind,width,height:scene.height});
    }
  }
  const atlasScene=createBundleLayout(736,"fanout");
  const atlasDefs=Array.from(atlasScene.markup.matchAll(/<defs>[\s\S]*?<\/defs>/g),match=>match[0]).join("").replace(/var\(--([^\)]+)\)/g,(_,name)=>colors[name]);
  const atlas=`<svg xmlns="http://www.w3.org/2000/svg" width="736" height="260"><rect width="736" height="260" fill="${colors["pcb-bg"]}"/>${atlasDefs}${["east","north","west","south"].map((facing,i)=>`<use href="#bundle-mage-fanout-${facing}" transform="translate(${92+184*i} 145) scale(4)"/><text x="${92+184*i}" y="28" fill="${colors["pcb-text"]}" font-family="sans-serif" font-size="16" text-anchor="middle">${facing}</text>`).join("")}</svg>`;
  await sharp(Buffer.from(atlas)).png().toFile(path.join(__dirname,"mage-directions.png"));
  const result={scope:"source, diagram geometry, and offscreen SVG rendering",checked,issues,browserHostVerified:false};
  fs.writeFileSync(path.join(__dirname,"review.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
