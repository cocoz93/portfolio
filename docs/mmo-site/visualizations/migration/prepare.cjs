const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source=path.resolve(__dirname,'..'),destination='C:/Users/USER/Desktop/MyGit/portfolio/docs/mmo-site/visualizations';
assert(!fs.existsSync(destination),'Destination must be new');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(dir===source&&entry.name==='migration')continue;const full=path.join(dir,entry.name);assert(!fs.lstatSync(full).isSymbolicLink(),'Reparse/symbolic link is not allowed');if(entry.isDirectory())walk(full);else{const bytes=fs.readFileSync(full);files.push({relative:path.relative(source,full).replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}}}
walk(source);
const existing=['docs/index.html','docs/home/portfolio.html','docs/mmo-site/index.html','docs/mmo-site/.gitignore','docs/mmo-site/parts/client.css','docs/mmo-site/parts/common.css','docs/mmo-site/parts/scene.js'].map(relative=>({relative,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.resolve(destination,'../../../',relative))).digest('hex')}));
const plan={preparedAt:new Date().toISOString(),source:source.replaceAll('\\','/'),destination,files,existingPortfolioFiles:existing};
fs.writeFileSync(path.join(__dirname,'preflight.json'),JSON.stringify(plan,null,2));console.log(JSON.stringify({source:plan.source,destination,files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0)}));
