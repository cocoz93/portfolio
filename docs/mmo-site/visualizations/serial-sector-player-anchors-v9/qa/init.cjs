const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'..'),prior=path.resolve(dir,'../serial-sector-separated-v7');
for(const name of ['scene-template.js','sector-template.html','qa/build.cjs','qa/review-template.cjs']){
  const source=fs.readFileSync(path.join(prior,name),'utf8').replaceAll('sector-separated-v7','sector-player-anchors-v9');
  fs.writeFileSync(path.join(dir,name),source,'utf8');
}
