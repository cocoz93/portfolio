function applyPoolInteriorFrame(scene,state,set){
  applyPoolStudyFrame(scene,state,set);
  for(let row=0;row<2;row++){
    const a=scene.rows[row],r=state.rows[row],pool=a.pool,transfer=r.transfer;
    const checkedOut=r.messages.some(m=>m.live)||transfer?.kind==='return';
    const incoming=transfer?.kind==='allocation'&&transfer.p>=.3,outgoing=transfer?.kind==='return';
    const p=incoming?(transfer.p-.3)/.7:outgoing?transfer.p:0;
    let available=checkedOut?0:1,active=0,offset=0,opening=0;
    if(incoming){
      const exit=studyRange(p,.1,.44);
      available=1-studyRange(p,0,.12);active=studyRange(p,0,.12)*(1-studyRange(p,.28,.44));
      offset=pool.travel*exit;opening=studyRange(p,.02,.14)*(1-studyRange(p,.45,.66));
    }else if(outgoing){
      const entry=studyRange(p,.68,.94);
      offset=pool.travel*(1-entry);active=studyRange(p,.64,.76)*(1-studyRange(p,.92,1));
      available=studyRange(p,.92,1);opening=studyRange(p,.56,.7)*(1-studyRange(p,.92,1));
    }
    set(pool.slotFill,{opacity:.7});set(pool.slotActive,{opacity:0});
    set(pool.available,{opacity:available});set(pool.card,{opacity:1,transform:'translate(0 0)'});
    set(pool.activeBuffer,{opacity:active,transform:`translate(${offset} 0)`});
    set(pool.gateLeft,{transform:`translate(0 ${-3*opening})`});set(pool.gateRight,{transform:`translate(0 ${3*opening})`});
  }
}
