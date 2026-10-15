const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),plan=JSON.parse(fs.readFileSync(path.join(__dirname,'preflight.json'),'utf8'));
assert.equal(root.toLowerCase(),path.resolve(plan.destination).toLowerCase());
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function inside(relative){const file=path.resolve(root,relative);assert(file.startsWith(root+path.sep),'Path escaped visualization workspace');return file;}
for(const file of plan.files){assert.equal(hash(inside(file.relative)),file.sha256,'Moved file changed: '+file.relative);}
const before={files:plan.files.length,bytes:plan.files.reduce((n,file)=>n+file.bytes,0),allMovedFilesMatch:true};
const slashOld=plan.source,slashNew=root.replaceAll('\\','/'),nativeOld=path.resolve(plan.source),nativeNew=root;
const textTypes=new Set(['.json','.js','.cjs','.mjs','.html','.md','.ps1','.txt','.css','.svg','.py','.yml','.yaml']);
const rewritten=[];
for(const file of plan.files){if(!textTypes.has(path.extname(file.relative).toLowerCase()))continue;const target=inside(file.relative),bytes=fs.readFileSync(target),text=bytes.toString('utf8');if(!Buffer.from(text,'utf8').equals(bytes))continue;
  const next=text.replaceAll(slashOld,slashNew).replaceAll(nativeOld.replaceAll('\\','\\\\'),nativeNew.replaceAll('\\','\\\\')).replaceAll(nativeOld,nativeNew);
  if(next!==text){fs.writeFileSync(target,next);rewritten.push(file.relative);}
}
const archiveRelative='archive/optimization-figures-interim-20261014',archive=inside(archiveRelative),record=JSON.parse(fs.readFileSync(path.join(archive,'manifest.json'),'utf8')),removedDuplicates=[];
for(const figure of record.figures){
  const source=inside(figure.sourceVersion+'/'+path.basename(figure.originalPath));assert.equal(hash(source),figure.sourceSha256,'Approved source changed');
  const sourceCopy=inside(archiveRelative+'/'+figure.archivedSource);assert.equal(hash(sourceCopy),hash(source),'Duplicate differed');fs.unlinkSync(sourceCopy);removedDuplicates.push(path.relative(root,sourceCopy).replaceAll('\\','/'));
  const oldViewer=inside(archiveRelative+'/'+figure.viewer),newViewer=inside(figure.viewer);assert(!fs.existsSync(newViewer));fs.renameSync(oldViewer,newViewer);assert.equal(hash(newViewer),figure.viewerSha256);
  figure.originalPath=source.replaceAll('\\','/');figure.archivedSource=path.relative(root,source).replaceAll('\\','/');figure.sourcePath=figure.originalPath;figure.viewerPath=newViewer.replaceAll('\\','/');figure.originalReview=archiveRelative+'/'+figure.originalReview;
}
const oldIndex=inside(archiveRelative+'/index.html'),newIndex=inside('index.html');assert(!fs.existsSync(newIndex));fs.renameSync(oldIndex,newIndex);
let menu=fs.readFileSync(newIndex,'utf8');menu=menu.replace('중간 확정본 · 2026.10.14','작업 기준 · 2026.10.14 중간 확정').replace('이 보관본은 중간 확정 당시의 모습을 유지합니다.','이 폴더에서 원본 소스를 수정하고 재생 파일을 갱신합니다.');fs.writeFileSync(newIndex,menu);
record.kind='optimization-figures-workspace';record.workspaceRoot=slashNew;record.archivePath=slashNew;record.indexPath=slashNew+'/index.html';record.manifestPath=slashNew+'/optimization-figures-current.json';record.preservationPolicy='2026-10-15 사용자 요청: 소스, 시안, 재생 파일을 portfolio에서 함께 관리하고 이력은 Git으로 관리한다. 별도 완성본이나 원본 복사본을 만들지 않는다.';
fs.writeFileSync(inside('optimization-figures-current.json'),JSON.stringify(record,null,2));
fs.writeFileSync(path.join(archive,'manifest.json'),JSON.stringify({...record,kind:'former-interim-record',currentManifest:'../../optimization-figures-current.json'},null,2));
fs.writeFileSync(path.join(archive,'README.md'),'# 2026-10-14 중간 확정 기록\n\n2026-10-15 사용자 요청으로 작업 파일 전체를 portfolio로 이전했다. 재생 파일과 목록은 visualizations 루트에 있고, 별도 원본 복사본은 제거했다. 현재 기준은 ../../optimization-figures-current.json 과 ../../README.md 이다. 이 폴더는 당시 검증 기록만 남긴다.\n');
fs.writeFileSync(path.join(archive,'verify-archive.cjs'),"require('../../verify-workspace.cjs');\n");
const figure5Path=inside('figure-5-current.json'),figure5=JSON.parse(fs.readFileSync(figure5Path,'utf8'));figure5.approvedBaselinePath=slashNew;fs.writeFileSync(figure5Path,JSON.stringify(figure5,null,2));
fs.writeFileSync(inside('.gitignore'),'# Generated review screenshots and local migration inventory\n**/qa/*.png\n**/metadata/*diagnostic.png\nmigration/preflight.json\n');
for(const file of plan.existingPortfolioFiles){assert.equal(hash(path.resolve(root,'../../../',file.relative)),file.sha256,'Existing portfolio file changed: '+file.relative);}
assert.equal(fs.readdirSync(plan.source).length,0,'Old directory must be empty');
const report={pass:true,migratedAt:new Date().toISOString(),source:plan.source,destination:slashNew,...before,pathFilesUpdated:rewritten.length,removedExactDuplicateSources:removedDuplicates,currentFigureCount:5,existingPortfolioFilesUnchanged:true,oldDirectoryEmpty:true};
fs.writeFileSync(inside('migration/result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
