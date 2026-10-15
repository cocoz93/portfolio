(() => {
  const root=document.getElementById('digest-figure-four-v3');if(!root)return;
  const board=root.querySelector('.digest-board'),play=root.querySelector('[data-action="play"]'),reset=root.querySelector('[data-action="reset"]'),status=root.querySelector('[data-status]');
  const program=createDigestProgram(),kind='digest-figure-four-v3',media=matchMedia('(prefers-reduced-motion: reduce)');
  let time=program.end,playing=false,scene=null,nodes=new Map(),lastWidth=0,raf=0,timer=0,startedAt=0,startedTime=0,revision=0,lastSaved='';
  const session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  function set(id,attrs,text){const node=nodes.get(id);if(!node)throw Error('Missing node: '+id);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));if(text!==undefined)node.textContent=text;}
  function getState(){const f=digestFrame(time,program);return {time,playing,phase:f.phase,afterStage:f.done?3:f.rows[1].stage,registeredPacketIds:DIGEST_PACKETS.filter((p,i)=>f.rows[1].pending[i]===1).map(p=>p.id),selectedPacketIds:DIGEST_SELECTED.filter((p,i)=>f.rows[1].joined[i]===1).map(p=>p.id),excludedPacketIds:[6,7],callsBefore:f.rows[0].calls,callsAfter:f.rows[1].calls,digestBuiltOnce:f.rows[1].joined.every(v=>v===1),validSectors:9,packetsPerSession:5,receivingSector:'R',residents:['S1','S2']};}
  function render(){if(!scene)return;const f=digestFrame(time,program);applyDigestFrame(scene,f,set);if(status.textContent!==f.phase)status.textContent=f.phase;play.textContent=playing?'일시정지':time>=program.end?'재생':time>0?'이어 재생':'재생';play.setAttribute('aria-pressed',String(playing));}
  function save(){if(!window.openai?.setWidgetState)return;lastSaved=session+':'+(++revision);window.openai.setWidgetState({modelContent:{kind,figure:4,...getState()},privateContent:{kind,revision:lastSaved,time}}).catch(()=>{});}
  function cancel(){if(raf)cancelAnimationFrame(raf);if(timer)clearTimeout(timer);raf=0;timer=0;}
  function update(){if(playing)time=Math.min(program.end,startedTime+Math.max(0,performance.now()-startedAt));}
  function stop(){update();cancel();playing=false;}
  function schedule(){raf=requestAnimationFrame(tick);timer=setTimeout(tick,80);}
  function tick(){cancel();if(!playing)return;update();render();if(time>=program.end){stop();render();save();}else schedule();}
  play.addEventListener('click',()=>{if(playing){stop();render();save();return;}if(time>=program.end)time=0;if(media.matches)time=program.end;else{playing=true;startedAt=performance.now();startedTime=time;schedule();}render();save();});
  reset.addEventListener('click',()=>{stop();time=0;render();save();});
  function draw(width){if(!Number.isFinite(width)||width<=0)return;width=Math.max(320,Math.round(width));if(width===lastWidth)return;
    scene=createDigestScene(width);const accessible=Array.from(board.children).filter(el=>['title','desc'].includes(el.tagName.toLowerCase()));board.replaceChildren(...accessible);board.insertAdjacentHTML('beforeend',scene.markup);
    board.setAttribute('width',String(width));board.setAttribute('height',String(scene.height));board.setAttribute('viewBox',`0 0 ${width} ${scene.height}`);nodes=new Map(Array.from(board.querySelectorAll('[id]')).map(el=>[el.id,el]));lastWidth=width;render();
  }
  function restore(snapshot){const s=snapshot?.privateContent;if(!s||s.kind!==kind||s.revision===lastSaved)return;stop();time=Math.max(0,Math.min(program.end,Number(s.time)||0));render();}
  draw(root.getBoundingClientRect().width||736);restore(window.openai?.widgetState);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(entries=>draw(entries[0].contentRect.width)).observe(root);
  window.addEventListener('openai:set_globals',e=>restore(e.detail?.globals?.widgetState));
  media.addEventListener('change',()=>{if(media.matches){stop();render();save();}});
  root.animation={getState,seek(t){stop();time=Math.max(0,Math.min(program.end,Number(t)||0));render();},duration:program.end};
})();
