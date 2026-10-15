const fs=require('node:fs'),path=require('node:path');const dir=path.resolve(__dirname,'..'),old=path.resolve(dir,'../serial-sector-pool-story-v10');
for(const name of ['scene-template.js','qa/build.cjs','qa/review-template.cjs'])fs.writeFileSync(path.join(dir,name),fs.readFileSync(path.join(old,name),'utf8').replaceAll('sector-pool-story-v10','sector-msg-focus-v11'),'utf8');
