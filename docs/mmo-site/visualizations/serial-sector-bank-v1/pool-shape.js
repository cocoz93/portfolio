  function pool(cx,cy,key){
    const b={cx,cy,x:cx-39,y:cy-32,w:78,h:64,left:cx-39,right:cx+39,outputY:cy};
    const ids=Object.fromEntries(['count','flash','slotFill','slotActive','indicator','card','gateLeft','gateRight','interiorClip','available','activeBuffer'].map(name=>[name,sid(key+'-pool-'+name)]));
    bounds.push({...b,role:'msg-pool'});
    box(b.x,b.y,b.w,b.h,C.surface,C.edge,{'data-role':'pool-gate','data-interior':interior});
    txt('Msg 풀',cx,cy-20,12,C.muted,'middle',{class:'sector-mono'});
    wire([[b.x+1,cy-11],[b.right-1,cy-11]],C.edge,{opacity:.7});
    box(b.right-8,b.y+7,3,3,C.active,null,{id:ids.indicator,opacity:0});
    out.push(`<defs><clipPath id="${ids.interiorClip}"><rect x="${b.x+5}" y="${cy-10}" width="68" height="21"></rect></clipPath></defs>`);
    out.push(`<g clip-path="url(#${ids.interiorClip})">`);
    box(cx-31,cy-9,62,19,C.bg,null,{id:ids.slotFill,opacity:.7});
    box(cx-31,cy-9,62,19,C.active,null,{id:ids.slotActive,opacity:0});
    let buffer={x:cx-24,y:cy-4,w:48,h:10},travel=44,gateAxis='x';
    if(interior==='stack'){
      // Overlapping free buffers: only the front buffer is checked out.
      box(cx-25,cy-8,45,11,C.surface,C.track,{opacity:.55});
      box(cx-23,cy-5,45,11,C.surface,C.track,{opacity:.75});
      buffer={x:cx-21,y:cy-2,w:45,h:10};travel=42;
      wire([[cx+25,cy+3],[cx+30,cy+3],[cx+30,cy]],C.track,{opacity:.8});
    }else if(interior==='bank'){
      // Three illustrative slots, with the output slot nearest the existing outlet.
      for(const x of [cx-27,cx-8,cx+11]){
        box(x,cy-8,14,16,C.bg,C.edge);
        wire([[x+3,cy+5],[x+11,cy+5]],C.track,{opacity:.5});
      }
      for(const x of [cx-26,cx-7]){box(x,cy-7,12,14,C.surface,C.track,{opacity:.8});box(x+2,cy-5,8,2,C.muted,null,{opacity:.5});}
      buffer={x:cx+12,y:cy-7,w:12,h:14};travel=23;
    }else if(interior==='chip'){
      // A memory component and an output register, aligned with the existing circuit.
      for(const y of [cy-6,cy,cy+6]){wire([[cx-29,y],[cx-24,y]],C.track);wire([[cx+24,y],[cx+29,y]],C.track);}
      box(cx-24,cy-8,48,16,C.empty,C.track);
      for(const x of [cx-18,cx-12,cx-6])box(x,cy-4,3,8,C.track,null,{opacity:.45});
      wire([[cx+2,cy-5],[cx+2,cy+5]],C.edge);
      buffer={x:cx+6,y:cy-4,w:12,h:8};travel=24;
    }else{
      // A reserve on the left and a visible transfer well on the right.
      for(let i=0;i<3;i++)box(cx-28,cy-8+i*5,18,3,C.track,null,{opacity:.4+i*.2});
      wire([[cx-7,cy],[cx-1,cy]],C.track);
      box(cx+1,cy-8,27,16,C.empty,C.edge);
      buffer={x:cx+5,y:cy-5,w:19,h:10};travel=23;gateAxis='y';
    }
    out.push(`<g id="${ids.available}" opacity="1"><g id="${ids.card}">`);
    box(buffer.x,buffer.y,buffer.w,buffer.h,C.surface,C.track);
    box(buffer.x+2,buffer.y+2,Math.max(3,buffer.w-4),2,C.muted,null,{opacity:.65});
    out.push('</g></g>');
    out.push(`<g id="${ids.activeBuffer}" opacity="0">`);
    box(buffer.x,buffer.y,buffer.w,buffer.h,C.active);
    box(buffer.x+2,buffer.y+2,Math.max(3,buffer.w-4),2,C.text,null,{opacity:.7});
    out.push('</g>');
    out.push(`<g id="${ids.gateLeft}">`);wire([[cx+30,cy-8],[cx+30,cy-3]],C.pin,{opacity:.8});out.push('</g>');
    out.push(`<g id="${ids.gateRight}">`);wire([[cx+30,cy+3],[cx+30,cy+8]],C.pin,{opacity:.8});out.push('</g>');
    out.push('</g>');
    box(b.x,b.y,b.w,b.h,'none',C.active,{id:ids.flash,opacity:0});
    txt('대기',cx,cy+23,11,C.muted,'middle',{id:ids.count});
    return {...b,...ids,interior,buffer,travel,gateAxis};
  }
