// The same contiguous data stripe represents each Msg or Digest enqueue.
function signalRouteSpan(points,start,end){
  const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),length=distances.reduce((a,b)=>a+b,0),lo=Math.max(0,Math.min(length,start)),hi=Math.max(0,Math.min(length,end));if(hi<=lo)return 'M0 0';const out=[afterPoint(points,lo/length)];let at=0;for(let i=0;i<distances.length;i++){at+=distances[i];if(at>lo&&at<hi)out.push(points[i+1]);}out.push(afterPoint(points,hi/length));return out.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
}
function createSignalScene(width,side='after'){
  const scene=createAfterScene(width,side);const id=scene.kind+'-signal-ribbon';return {...scene,signalBaseMarkup:scene.markup,signalRibbon:id,markup:scene.markup+`\n<path id="${id}" d="M0 0" fill="none" stroke="var(--pcb-active)" stroke-width="8" stroke-linecap="butt" stroke-linejoin="miter" opacity="0"></path>`};
}
function applySignalAfterFrame(scene,f,set){
  applyAfterFrame(scene,f,set);applySignalRibbon(scene,f,set);
}
function applySignalBeforeFrame(scene,f,set){
  applyMatchedBeforeFrame(scene,f,set);applySignalRibbon(scene,f,set);
}
function applySignalRibbon(scene,f,set){
  set(scene.signalRibbon,{opacity:0});
  if(f.step==='deliver'){
    const route=scene.routes[f.rx],length=route.slice(1).reduce((sum,v,i)=>sum+Math.hypot(v[0]-route[i][0],v[1]-route[i][1]),0),band=64,head=(length+band)*f.progress;
    set(scene.carrier,{opacity:0});set(scene.trail,{opacity:0});set(scene.signalRibbon,{opacity:1,d:signalRouteSpan(route,head-band,head)});
  }
}
