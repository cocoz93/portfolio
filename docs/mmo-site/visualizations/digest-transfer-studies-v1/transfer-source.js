const TRANSFER_DESIGNS=[{key:'ribbon',name:'신호 띠'},{key:'frame',name:'묶음 프레임'},{key:'gate',name:'입력 게이트'}];
function createTransferProgram(){const full=createAfterProgram(),ready=full.segments.find(s=>s.phase==='ready'&&s.rx===0),hold=full.segments.find(s=>s.phase==='hold'&&s.rx===0);return {full,start:ready.start,end:hold.end-ready.start};}
function transferFrame(time,program){const f=afterFrame(program.start+Math.max(0,Math.min(program.end,time)),program.full);if(time>=program.end){f.step='hold';f.progress=1;f.rx=0;f.item=-1;f.done=true;f.phase='S1 SendQ · Msg 4개 · 1회 적재 완료';}return f;}
function routeSpan(points,start,end){
  const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),length=distances.reduce((a,b)=>a+b,0),lo=Math.max(0,Math.min(length,start)),hi=Math.max(0,Math.min(length,end));if(hi<=lo)return 'M0 0';const out=[afterPoint(points,lo/length)];let at=0;for(let i=0;i<distances.length;i++){at+=distances[i];if(at>lo&&at<hi)out.push(points[i+1]);}out.push(afterPoint(points,hi/length));return out.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
}
function createTransferScene(width,key){
  const scene=createAfterScene(width,'after','digest-transfer-'+key),prefix=scene.kind,C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',active:'var(--pcb-active)',text:'var(--pcb-text)'},ids={ribbon:prefix+'-ribbon',packet:prefix+'-packet',pulse:prefix+'-pulse',sourcePort:prefix+'-source-port',gate:prefix+'-gate',gateFill:prefix+'-gate-fill'},packetIds=[];
  let markup=`<path id="${ids.ribbon}" d="M0 0" fill="none" stroke="${C.active}" stroke-width="8" stroke-linecap="butt" stroke-linejoin="miter" opacity="0"/>`;
  markup+=`<g id="${ids.packet}" opacity="0"><rect x="-40" y="-22" width="80" height="44" fill="${C.surface}" stroke="${C.active}" stroke-width="1.5"/><text x="0" y="-11" font-size="12" dominant-baseline="middle" text-anchor="middle" fill="${C.text}" class="sector-mono">Digest</text>`;
  for(let i=0;i<4;i++){const x=-35+i*18,id=prefix+'-packet-'+i;packetIds.push(id);markup+=`<rect x="${x}" y="0" width="16" height="16" fill="${C.active}"/><text id="${id}" x="${x+8}" y="8" font-size="12" dominant-baseline="middle" text-anchor="middle" fill="${C.bg}" class="sector-mono">${i+1}</text>`;}
  markup+=`</g><rect id="${ids.pulse}" x="-4" y="-4" width="8" height="8" fill="${C.active}" opacity="0"/>`;
  const source=scene.routes[0][0],target=scene.routes[0].at(-1),vertical=scene.compact;
  markup+=`<rect id="${ids.sourcePort}" x="${source[0]-(vertical?10:3)}" y="${source[1]-(vertical?3:10)}" width="${vertical?20:6}" height="${vertical?6:20}" fill="${C.active}" opacity="0"/>`;
  markup+=`<g id="${ids.gate}" opacity="0"><rect x="${target[0]-(vertical?10:3)}" y="${target[1]-(vertical?3:10)}" width="${vertical?20:6}" height="${vertical?6:20}" fill="${C.surface}" stroke="${C.edge}" stroke-width="1.5"/><rect id="${ids.gateFill}" x="${target[0]-(vertical?9:2)}" y="${target[1]-(vertical?2:9)}" width="${vertical?18:0}" height="${vertical?0:18}" fill="${C.active}"/></g>`;
  markup=markup.replace(/<(rect|path)\b([^>]*)\/>/g,'<$1$2></$1>');
  return {...scene,markup:scene.markup+'\n'+markup,transfer:{key,ids,packetIds,source,target,vertical}};
}
function applyTransferFrame(scene,f,set){
  applyAfterFrame(scene,f,set);const {key,ids,packetIds,source,target,vertical}=scene.transfer,route=scene.routes[0],active=f.step==='deliver',arrived=f.calls[0]===1,p=f.progress,C={active:'var(--pcb-active)',edge:'var(--pcb-edge)'};
  set(scene.carrier,{opacity:0});set(scene.trail,{opacity:arrived?1:0,d:arrived?afterTrace(route,1):'M0 0'});
  for(const id of[ids.ribbon,ids.packet,ids.pulse,ids.sourcePort,ids.gate])set(id,{opacity:0});
  if(key==='ribbon'&&active){const length=route.slice(1).reduce((sum,v,i)=>sum+Math.hypot(v[0]-route[i][0],v[1]-route[i][1]),0),band=64,head=(length+band)*p;set(ids.ribbon,{opacity:1,d:routeSpan(route,head-band,head)});}
  if(key==='frame'&&active){const point=afterPoint(route,p);set(ids.packet,{opacity:1,transform:`translate(${point[0]} ${point[1]})`});for(let i=0;i<4;i++)set(packetIds[i],{},String(AFTER_SELECTED[0][i].id));}
  if(key==='gate'){
    set(ids.sourcePort,{opacity:active||arrived?1:0});set(ids.gate,{opacity:1});const open=arrived?1:active?Math.max(0,Math.min(1,(p-.72)/.28)):0;set(ids.gateFill,vertical?{height:4*open}:{width:4*open});
    if(active){const point=afterPoint(route,p);set(ids.pulse,{opacity:1,transform:`translate(${point[0]} ${point[1]})`});set(scene.trail,{opacity:1,d:afterTrace(route,p)});}
  }
}
