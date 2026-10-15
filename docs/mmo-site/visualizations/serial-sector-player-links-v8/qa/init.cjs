const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'..'),prior=path.resolve(dir,'../serial-sector-separated-v7');
for(const name of ['scene-template.js','sector-template.html','qa/build.cjs','qa/review-template.cjs']){
  let source=fs.readFileSync(path.join(prior,name),'utf8').replaceAll('sector-separated-v7','sector-player-links-v8');
  if(name==='sector-template.html')source=source.replace('height="800" viewBox="0 0 736 800"','height="864" viewBox="0 0 736 864"');
  if(name==='qa/build.cjs')source=source.replace('[...row.copies,row.input]','[...row.copies,...row.inputs]');
  if(name==='qa/review-template.cjs')source=source.replace('],72)','],90)').replace(",72);",",90);").replace('translate(72 0)','translate(90 0)').replace("'1280'","'1368'");
  fs.writeFileSync(path.join(dir,name),source,'utf8');
}
