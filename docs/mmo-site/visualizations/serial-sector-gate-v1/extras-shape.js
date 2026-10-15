    a.study=[];
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],keyName=key+'-study-'+i,title=after?'Msg':'Msg '+(i+1);
      const e=Object.fromEntries(['token','tokenClip','msgClip','msgClipPath','ribbon','arrow','outline','front','poolExitClip'].map(n=>[n,sid(keyName+'-'+n)]));
      out.push(`<defs><clipPath id="${e.msgClipPath}" clipPathUnits="userSpaceOnUse"><rect id="${e.msgClip}" x="${m.x-6}" y="${m.y}" width="${m.w+12}" height="${m.h}"></rect></clipPath></defs>`);
      tag('path',{id:e.ribbon,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-linejoin':'miter',opacity:0,'data-role':'allocation-direction'});
      tag('polygon',{id:e.arrow,points:'0,0 -6,-3 -6,3',fill:C.active,opacity:0});
      box(m.x,m.y,m.w,m.h,'none',C.active,{id:e.outline,opacity:0});
      tag('path',{id:e.front,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});
      out.push(`<defs><clipPath id="${e.poolExitClip}" clipPathUnits="userSpaceOnUse"><rect x="${a.pool.right+1}" y="${offset}" width="${width-a.pool.right-1}" height="${rowHeight}"></rect><rect x="0" y="${offset}" width="${width}" height="${a.pool.y-offset-1}"></rect><rect x="0" y="${a.pool.y+a.pool.h+1}" width="${width}" height="${offset+rowHeight-a.pool.y-a.pool.h-1}"></rect></clipPath></defs><g clip-path="url(#${e.poolExitClip})"><g id="${e.token}" opacity="0">`);
      out.push(`<defs><clipPath id="${e.tokenClip}-path"><rect id="${e.tokenClip}" x="-30" y="-13" width="60" height="26"></rect></clipPath></defs>`);
      out.push(`<g clip-path="url(#${e.tokenClip}-path)">`);
      box(-30,-13,60,26,C.surface,C.active);box(-29,-12,58,3,C.active,null,{opacity:.65});rawText(title,-23,0,compact?14:16,C.text,'start',{class:'sector-mono'});
      out.push('</g></g></g>');a.study.push(e);
    }
