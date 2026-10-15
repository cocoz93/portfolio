const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {createSectorBundleDiagram}=require("./diagram.cjs");
const dependencyDir="C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const sharp=require(path.join(dependencyDir,"sharp"));
const {createCanvas,GlobalFonts}=require(path.join(dependencyDir,"@napi-rs/canvas"));
GlobalFonts.registerFromPath("C:/Windows/Fonts/malgun.ttf","PCB-Review");
const metrics=createCanvas(1,1).getContext("2d");
const colors={"pcb-bg":"#0d1421","pcb-surface":"#151f2c","pcb-edge":"#354b61","pcb-track":"#7895ae","pcb-text":"#eef2fb","pcb-muted":"#a8b8ca","pcb-active":"#6cc7ff","pcb-soft":"#1b3a50","pcb-empty":"#172536","pcb-pin":"#829bb1","pcb-char-ink":"#08121e","pcb-char-steel":"#dce9f3","pcb-char-steel-dark":"#617e9a","pcb-char-blue-mid":"#2579ad","pcb-char-blue-dark":"#17466a","pcb-char-skin":"#ecd0b5","pcb-char-skin-dark":"#bd947a"};
const issues=[];
async function main(){
  const fragment=fs.readFileSync(path.resolve(__dirname,"../sector-bundle-static.html"),"utf8");
  const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];
  new vm.Script(script);
  if(/<!doctype|<html[ >]|<body[ >]|<head[ >]/i.test(fragment))issues.push("inline fragment contains document wrapper");
  if(Buffer.byteLength(fragment)>=1_000_000)issues.push("fragment exceeds size budget");
  const widths=[736,680,659,360,320];
  for(const width of widths){
    const scene=createSectorBundleDiagram(width);
    for(const label of scene.texts){
      metrics.font=`500 ${label.size}px PCB-Review`;
      const measured=metrics.measureText(label.label).width;
      const left=label.anchor==="middle"?label.x-measured/2:label.anchor==="end"?label.x-measured:label.x;
      if(left<-0.01||left+measured>width+.01||label.y-label.size/2<0||label.y+label.size/2>scene.height)issues.push({width,label:label.label,reason:"text outside diagram",left,right:left+measured});
      if(label.size<11)issues.push({width,label:label.label,reason:"text smaller than 11px"});
    }
    for(const trace of scene.traces){
      for(let i=1;i<trace.points.length;i++){
        const a=trace.points[i-1],b=trace.points[i];
        if(a[0]!==b[0]&&a[1]!==b[1])issues.push({width,reason:"non-orthogonal connector",a,b});
      }
      for(const [x,y] of trace.points)if(x<0||x>width||y<0||y>scene.height)issues.push({width,reason:"connector outside diagram",x,y});
    }
    const before=scene.markup.split('<g data-comparison="before">')[1].split('<g data-comparison="after">')[0];
    const after=scene.markup.split('<g data-comparison="after">')[1];
    if((before.match(/data-role="individual-packet"/g)||[]).length!==4)issues.push({width,reason:"before does not contain four packets"});
    if((after.match(/data-role="bundle-packet"/g)||[]).length!==1)issues.push({width,reason:"after does not contain one bundle"});
    if((before.match(/data-role="enqueue-trace"/g)||[]).length!==4||(after.match(/data-role="enqueue-trace"/g)||[]).length!==1)issues.push({width,reason:"enqueue trace count is inconsistent"});
    for(const actor of ["A","B","C","D"]){
      if(!before.includes(`data-role="packet-entry" data-actor="${actor}"`)||!after.includes(`data-role="packet-entry" data-actor="${actor}"`))issues.push({width,reason:"actor state missing",actor});
    }
    let markup=scene.markup.replace(/var\(--([^\)]+)\)/g,(_,name)=>colors[name]);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${scene.height}" viewBox="0 0 ${width} ${scene.height}"><style>text{font-family:Malgun Gothic,sans-serif;font-weight:500}</style><rect width="${width}" height="${scene.height}" fill="${colors["pcb-bg"]}"/>${markup}</svg>`;
    fs.writeFileSync(path.join(__dirname,`sector-bundle-${width}.svg`),svg);
    await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,`sector-bundle-${width}.png`));
  }
  const result={scope:"source, SVG geometry, and offscreen SVG render",widths,issues,browserPlaybackVerified:false};
  fs.writeFileSync(path.join(__dirname,"review.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
