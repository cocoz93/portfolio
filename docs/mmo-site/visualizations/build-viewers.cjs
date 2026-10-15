const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const dir=__dirname,file=path.join(dir,'optimization-figures-current.json'),manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const python=process.env.VISUALIZATION_PYTHON||'C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const renderer=process.env.VISUALIZATION_RENDERER||'C:/Users/USER/.codex/plugins/cache/openai-bundled/visualize/1.0.49/skills/visualize/scripts/render.py';
for(const figure of manifest.figures){
  const result=cp.spawnSync(python,[renderer,figure.sourcePath,figure.viewerPath,'--force','--title',figure.number+'번 · '+figure.name],{stdio:'inherit'});if(result.status!==0)throw Error('Viewer build failed: '+figure.number);
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sourceHash=hash(figure.sourcePath);
  if(figure.sourceSha256!==sourceHash){figure.originalReviewMatchesSource=false;figure.standalonePlayPauseVerified=false;}
  figure.sourceSha256=sourceHash;figure.archivedSourceSha256=sourceHash;figure.archivedSourceHashVerified=true;figure.viewerSha256=hash(figure.viewerPath);
}
manifest.lastBuildAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(manifest,null,2));
