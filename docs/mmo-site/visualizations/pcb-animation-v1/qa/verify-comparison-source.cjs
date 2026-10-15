const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.resolve(__dirname,'..');
const checks=[];
function check(name,ok,actual){checks.push({name,ok,actual});if(!ok)throw Error(name+': '+JSON.stringify(actual));}
function modelFrom(source){
 const timing=source.slice(source.indexOf('  const M ='),source.indexOf('  const reduced ='));
 const helpers=source.slice(source.indexOf('  const clamp ='),source.indexOf('  function blendColor'));
 const models=source.slice(source.indexOf('  function rowModel'),source.indexOf('  function paint'));
 const code='(()=>{let time=0,playing=false,mode="desktop";const reduced={matches:false};'+timing+helpers+models+';return {T,M,rowModel,model,motionProgress};})()';
 return new vm.Script(code).runInNewContext();
}
const source=fs.readFileSync(path.join(dir,'wsasend-design-compare.html'),'utf8');
const scripts=[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
check('single-script-initialization',scripts.length===1,scripts.length);
new vm.Script(scripts[0][1]);
check('no-cross-script-dom-objects',!source.includes('root.animation')&&!source.includes('roots.map(root => root.animation)'),true);
check('no-mutation-observer-dependency',!source.includes('MutationObserver'),true);
check('single-style-sheet',(source.match(/<style>/g)||[]).length===1,true);
check('embedded-fonts-shared-once',(source.match(/@font-face/g)||[]).length===2,true);
check('under-256-kib',Buffer.byteLength(source)<256*1024,Buffer.byteLength(source));
check('standalone-matches-fragment',fs.readFileSync(path.join(dir,'index.html'),'utf8').includes(source),true);
check('old-comparison-reference-updated',fs.readFileSync(path.join(dir,'wsasend-design-comparison.html'),'utf8')===source,true);
const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check('no-duplicate-static-ids',new Set(ids).size===ids.length,ids);
const refs=[...scripts[0][1].matchAll(/document\.getElementById\("([^"]+)"\)/g)].map(m=>m[1]);
check('queried-roots-exist',refs.every(id=>ids.includes(id)),refs);
check('both-design-buttons-present',source.includes('>이전 디자인</button>')&&source.includes('>이번 디자인</button>'),true);
check('scripts-outside-panels',source.lastIndexOf('</section>')<source.indexOf('<script>'),true);
check('initialization-after-dom-ready',source.includes('"DOMContentLoaded", startComparison'),true);
check('startup-failure-has-visible-diagnostic',source.includes('비교 화면 초기화 오류: ')&&source.includes('detail.setAttribute("role", "alert")'),true);
const old=fs.readFileSync(path.join(dir,'wsasend-pcb-previous.html'),'utf8');
const current=fs.readFileSync(path.join(dir,'wsasend-pcb-animation.html'),'utf8');
check('previous-and-current-preserved',old.includes('presentation-v7')&&current.includes('graphic-system-v9'),true);
check('original-standalone-snapshots-preserved',fs.readFileSync(path.join(dir,'previous-design.html'),'utf8').includes(old)&&fs.readFileSync(path.join(dir,'current-design.html'),'utf8').includes(current),true);
const initializers=scripts[0][1].split(/function initialize(?:Previous|Current)\(\)\{/).slice(1);
check('both-generated-initializers-found',initializers.length===2,initializers.length);
const models=initializers.map(modelFrom);
const T=models[0].T,M=models[0].M;
check('matching-timelines',JSON.stringify(T)===JSON.stringify(models[1].T)&&T.end===22580,T);
check('spatial-motion-duration-preserved',M.main===400&&M.state===200,M);
check('original-animation-timing-restored',JSON.stringify(T)===JSON.stringify(modelFrom(current).T)&&JSON.stringify(M)===JSON.stringify(modelFrom(current).M),true);
for(let i=0;i<4;i++){
 const start=T.start+i*T.period;
 const queued=models.map(m=>m.model(start+T.queueOn+M.state));
 check('before-event-'+i,queued.every(s=>s.pendingBefore===1&&s.callsBefore===i),queued.map(s=>({calls:s.callsBefore,pending:s.pendingBefore})));
 const drained=models.map(m=>m.model(start+T.call+M.state));
 check('before-drained-'+i,drained.every(s=>s.pendingBefore===0&&s.callsBefore===i+1),drained.map(s=>({calls:s.callsBefore,pending:s.pendingBefore})));
 const after=models.map(m=>m.model(T.afterStart+T.start+i*T.periodAfter+T.queueOn+M.state));
 check('after-event-'+i,after.every(s=>s.pendingAfter===i+1&&s.callsAfter===0),after.map(s=>({calls:s.callsAfter,pending:s.pendingAfter})));
}
const batch=models.map(m=>m.model(T.afterStart+T.batchCall));
check('batch-clears-four-once',batch.every(s=>s.pendingAfter===0&&s.callsAfter===1),batch.map(s=>({calls:s.callsAfter,pending:s.pendingAfter})));
for(const [i,initializer] of initializers.entries()){
 const traceSource=initializer.slice(initializer.indexOf('  function trace('),initializer.indexOf('  function setTrace('));
 const archived=[old,current][i];
 const originalTrace=archived.slice(archived.indexOf('  function trace('),archived.indexOf('  function setTrace('));
 check('original-signal-geometry-restored-'+i,traceSource.replace(/\r\n/g,'\n')===originalTrace.replace(/\r\n/g,'\n'),true);
}
const final=models.map(m=>m.model(T.end));
check('final-four-vs-one-both-bright',final.every(s=>s.callsBefore===4&&s.callsAfter===1&&s.pendingBefore===0&&s.pendingAfter===0&&s.activeRow==='comparison'&&s.compareProgress===1),final.map(s=>({before:s.callsBefore,after:s.callsAfter})));
fs.writeFileSync(path.join(__dirname,'comparison-source-verification.json'),JSON.stringify({scope:'Source and domain model checks; user-host rendering is not verified.',checks},null,2));
console.log(JSON.stringify({passed:checks.length,bytes:Buffer.byteLength(source),scope:'source-and-domain-model'}));
