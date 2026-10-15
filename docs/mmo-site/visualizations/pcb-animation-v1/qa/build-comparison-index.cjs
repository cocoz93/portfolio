const fs=require('fs'),path=require('path');
const dir=path.resolve(__dirname,'..');
const current=fs.readFileSync(path.join(dir,'wsasend-pcb-animation.html'),'utf8');
const standalone=fs.readFileSync(path.join(dir,'current-design.html'),'utf8');
const comparison=fs.readFileSync(path.join(dir,'wsasend-design-compare.html'),'utf8');
if(standalone.split(current).length!==2)throw Error('Current snapshot mismatch');
fs.writeFileSync(path.join(dir,'index.html'),standalone.replace(current,()=>comparison));
console.log(JSON.stringify({bytes:Buffer.byteLength(comparison),standalone:true}));
