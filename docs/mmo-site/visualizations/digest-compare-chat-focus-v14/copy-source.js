// Match the numbered Msg-to-Digest carrier: one Msg before, all Msgs together after.
// The complete source buffer remains visible; only this visual copy travels to SendQ.
function createCopyScene(width,side='after'){
  const scene=createAfterScene(width,side),before=side==='before',count=before?1:AFTER_PACKETS.length;
  const copy=scene.kind+'-payload-copy',copyFrame=scene.kind+'-payload-copy-frame',copyLabels=[],copyTiles=[];
  const tile=16,gap=4,padding=6,copyWidth=padding*2+count*tile+(count-1)*gap,copyHeight=28;
  const rows=scene.digest.rows;
  const copyRoutes=scene.queues.map((q,rx)=>{const usedRows=rows.slice(0,before?1:AFTER_SELECTED[rx].length),origin=[rows[0].x+90,usedRows.reduce((sum,row)=>sum+row.cy,0)/usedRows.length];return [origin,scene.compact?[q.cx,q.cy-q.qr+8]:[q.cx-q.qr+8,q.cy]];});
  const marks=[`<g id="${copy}" opacity="0" data-role="payload-copy" data-copy-count="${count}">`,
    `<rect id="${copyFrame}" x="${-copyWidth/2}" y="${-copyHeight/2}" width="${copyWidth}" height="${copyHeight}" fill="var(--pcb-surface)" stroke="var(--pcb-active)" stroke-width="1.5"></rect>`];
  for(let i=0;i<count;i++){
    const x=-copyWidth/2+padding+i*(tile+gap),tileId=copy+'-tile-'+i,labelId=copy+'-label-'+i;copyTiles.push(tileId);copyLabels.push(labelId);
    marks.push(`<rect id="${tileId}" x="${x}" y="-8" width="16" height="16" fill="var(--pcb-active)"></rect>`);
    marks.push(`<text id="${labelId}" x="${x+8}" y="0" font-size="11" dominant-baseline="middle" text-anchor="middle" fill="var(--pcb-bg)" class="sector-mono">${i+1}</text>`);
  }
  marks.push('</g>');
  return {...scene,copy,copyFrame,copyLabels,copyTiles,copyRoutes,copyWidth,copyHeight,markup:scene.markup+'\n'+marks.join('\n')};
}
function applyCopyAfterFrame(scene,f,set){applyAfterFrame(scene,f,set);applyPayloadCopy(scene,f,set);}
function applyCopyBeforeFrame(scene,f,set){applyMatchedBeforeFrame(scene,f,set);applyPayloadCopy(scene,f,set);}
function applyPayloadCopy(scene,f,set){
  // The old output carrier and its trail are hidden; gathering keeps its original marks.
  set(scene.trail,{opacity:0});set(scene.copy,{opacity:0});
  if(f.step!=='deliver')return;
  set(scene.carrier,{opacity:0});
  const ids=scene.variant==='before'?[AFTER_PACKETS[f.packet].id]:AFTER_SELECTED[f.rx].map(packet=>packet.id);
  const width=12+ids.length*16+(ids.length-1)*4;set(scene.copyFrame,{x:-width/2,width});
  for(let i=0;i<scene.copyLabels.length;i++){const x=-width/2+6+i*20,visible=i<ids.length;set(scene.copyTiles[i],{x,opacity:visible?1:0});set(scene.copyLabels[i],{x:x+8,opacity:visible?1:0},visible?String(ids[i]):'');}
  const point=afterPoint(scene.copyRoutes[f.rx],f.progress);
  // Fade only while entering the queue. The enqueue and ring fill occur on arrival.
  const opacity=f.progress<=.8?1:Math.max(0,(1-f.progress)/.2);
  set(scene.copy,{opacity,transform:`translate(${point[0]} ${point[1]})`,'data-recipient':'S'+(f.rx+1),'data-copy-count':ids.length,'data-msg-ids':ids.join(',')});
}
