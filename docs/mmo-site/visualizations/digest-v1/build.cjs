const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=__dirname,baseDir=path.resolve(dir,'../serial-sector-bank-v1');
const base=fs.readFileSync(path.join(baseDir,'figure-3.html'),'utf8'),baseSource=fs.readFileSync(path.join(baseDir,'scene.js'),'utf8');
const characterStart=baseSource.indexOf('  function mageDefinition(){'),characterEnd=baseSource.indexOf('  box(0,0,width,height,C.bg);',characterStart);assert(characterStart>=0&&characterEnd>characterStart);
const characters=baseSource.slice(characterStart,characterEnd).replace('"data-character":"mage"','id:sid(actor+\'-character\'),"data-character":"mage"');
const source=fs.readFileSync(path.join(dir,'scene-source.js'),'utf8').replace('/*CHARACTERS*/',characters);
fs.writeFileSync(path.join(dir,'scene.js'),source);const api=vm.runInNewContext(source+';({createDigestScene,createDigestProgram,digestFrame,applyDigestFrame})');
const scene=api.createDigestScene(736),program=api.createDigestProgram(),nodes=new Map();
for(const m of scene.markup.matchAll(/<([\w:-]+)\b([^<>]*)>/g)){const a=Object.fromEntries([...m[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));if(a.id)nodes.set(a.id,{tag:m[1],attrs:a,text:null});}
api.applyDigestFrame(scene,api.digestFrame(program.end,program),(id,attrs,text)=>{const n=nodes.get(id);assert(n,id);Object.assign(n.attrs,attrs);if(text!==undefined)n.text=text;});
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const markup=scene.markup.replace(/<([\w:-]+)\b([^<>]*)>/g,(all,tag,body)=>{const id=body.match(/\bid="([^"]+)"/)?.[1],n=nodes.get(id);return n?`<${tag} ${Object.entries(n.attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>`:all;}).replace(/(<text\b[^>]*\bid="([^"]+)"[^>]*>)([^<]*)(<\/text>)/g,(all,open,id,body,close)=>open+(nodes.get(id)?.text===null?body:esc(nodes.get(id).text))+close);
const css=base.match(/<style>([\s\S]*?)<\/style>/)[1].replaceAll('#serial-figure-3-interim','#digest-figure-four');
const script=source+'\n'+fs.readFileSync(path.join(dir,'controller.js'),'utf8');new vm.Script(script);
const html=fs.readFileSync(path.join(dir,'template.html'),'utf8').replace('/*STYLES*/',css).replace('<!--SCENE-->',markup).replace('/*SCRIPT*/',script);
assert(Buffer.byteLength(html)<1_000_000);assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(html));assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script));
fs.writeFileSync(path.join(dir,'figure-4.html'),html);
console.log(JSON.stringify({file:path.join(dir,'figure-4.html'),bytes:Buffer.byteLength(html),durationMs:program.end,sha256:crypto.createHash('sha256').update(html).digest('hex')}));
