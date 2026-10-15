  function pool(cx,cy,key){
    const b={cx,cy,x:cx-39,y:cy-32,w:78,h:64,left:cx-39,right:cx+39,outputY:cy+(style==='slot'?7:0)};
    const ids=Object.fromEntries(['count','flash','slotFill','slotActive','indicator','card','gateLeft','gateRight'].map(name=>[name,sid(key+'-pool-'+name)]));
    bounds.push({...b,role:'msg-pool'});
    box(b.x,b.y,b.w,b.h,C.surface,C.edge,{'data-role':'pool-'+style});
    box(b.x+1,b.y+1,b.w-2,23,C.muted,null,{opacity:.14});wire([[b.x+1,b.y+24],[b.x+b.w-1,b.y+24]],C.edge,{opacity:.6});
    txt('Msg 풀',cx,cy-17,12,C.muted,'middle',{class:'sector-mono'});
    box(cx-29,cy-5,58,14,C.bg,C.edge,{'data-role':'pool-aperture'});
    box(cx-27,cy-3,54,10,C.soft,null,{id:ids.slotFill,opacity:.6});
    box(cx-27,cy-3,54,10,C.active,null,{id:ids.slotActive,opacity:0});
    box(b.x+b.w-8,b.y+7,3,3,C.active,null,{id:ids.indicator,opacity:0});
    out.push(`<g id="${ids.card}">`);
    if(style==='slot'){
      for(let i=0;i<3;i++)wire([[cx-23,cy-2+i*4],[cx+23,cy-2+i*4]],C.pin,{opacity:i===0?.85:.4});
    }else if(style==='gate'){
      box(cx-4,cy-2,8,8,C.pin,null,{opacity:.8});
    }else{
      box(cx-23,cy-3,46,10,C.surface,C.pin);
      wire([[cx-18,cy+1],[cx+12,cy+1]],C.muted,{opacity:.6});
    }
    out.push('</g>');
    if(style==='slot')wire([[cx+24,b.outputY],[b.right,b.outputY]],C.track,{opacity:.65});
    out.push(`<g id="${ids.gateLeft}">`);if(style==='gate')box(cx-27,cy-3,21,10,C.edge);out.push('</g>');
    out.push(`<g id="${ids.gateRight}">`);if(style==='gate')box(cx+6,cy-3,21,10,C.edge);out.push('</g>');
    box(b.x,b.y,b.w,b.h,'none',C.active,{id:ids.flash,opacity:0});
    txt('대기',cx,cy+20,11,C.muted,'middle',{id:ids.count});
    return {...b,...ids};
  }
