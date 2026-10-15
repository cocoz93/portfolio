const fs = require("node:fs");
const path = require("node:path");
const {createSectorBundleDiagram} = require("./diagram.cjs");
const directory=path.resolve(__dirname,"..");
const prior=fs.readFileSync(path.resolve(directory,"../pcb-animation-v1/wsasend-pcb-previous.html"),"utf8");
const fontRules=prior.match(/@font-face\{[^}]+\}/g);
if(!fontRules || fontRules.length!==2)throw new Error("기존 PCB 글꼴 두 개를 확인하지 못했습니다.");
const template=fs.readFileSync(path.join(directory,"sector-bundle-template.html"),"utf8");
const diagram=fs.readFileSync(path.join(__dirname,"diagram.cjs"),"utf8").replace(/\nif \(typeof module[^\n]+\n?$/,"\n");
const initial=createSectorBundleDiagram(736);
const fragment=template.replace("/* EMBEDDED_FONTS */",fontRules.join("\n"))
  .replace("<!-- INITIAL_BOARD -->",initial.markup)
  .replace("/* DIAGRAM_FUNCTION */",diagram);
const filename=path.join(directory,"sector-bundle-static.html");
fs.writeFileSync(filename,fragment,"utf8");
const script=fragment.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
console.log(JSON.stringify({path:filename,bytes:Buffer.byteLength(fragment),scope:"static-sector-bundle",width:736,height:initial.height}));
