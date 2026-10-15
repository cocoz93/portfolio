  function notice(points,key){
    const trace=sid(key+'-notice'),head=sid(key+'-notice-head');
    const baseTrace=sid(key+'-notice-idle'),baseHead=sid(key+'-notice-idle-head');
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    const end=points.at(-1),prev=points.at(-2),distance=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1;
    const sx=(end[0]-prev[0])/distance,sy=(end[1]-prev[1])/distance;
    const headPoints=`${end[0]-sx*5-sy*3},${end[1]-sy*5+sx*3} ${end.join(',')} ${end[0]-sx*5+sy*3},${end[1]-sy*5-sx*3}`;
    const line={d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none','stroke-width':1.5};
    tag('path',{...line,id:baseTrace,stroke:C.muted,opacity:0,'data-role':'recipient-arrow-idle'});
    tag('polygon',{id:baseHead,points:headPoints,fill:C.muted,opacity:0});
    tag('path',{...line,id:trace,stroke:C.active,'stroke-dashoffset':0,opacity:0,'data-role':'notice-arrow'});
    tag('polygon',{id:head,points:headPoints,fill:C.active,opacity:0});
    return {points,length,trace,head,baseTrace,baseHead,headPoints};
  }
