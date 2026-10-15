(() => {
  const root=document.getElementById('serial-pool-animation-studies');if(!root)return;
  const program=createReuseProgram(),duration=program.end,media=matchMedia('(prefers-reduced-motion: reduce)');
  const first=program.segments.find(s=>s.row===0&&s.phase==='recipient'&&s.actor===0);
  const returned=program.segments.find(s=>s.row===0&&s.phase==='release'&&s.actor===0);
  const next=program.segments.find(s=>s.row===0&&s.phase==='recipient'&&s.actor===1);
  const focusStart=first.start,focusEnd=returned.end+(next.start-returned.end)/2,controllers=[];
  const kind='serial-pool-animation-studies-v6';let revision=0,lastSavedRevision='';
  const session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  let selected='slot';
  function save(){if(!window.openai?.setWidgetState)return;lastSavedRevision=session+':'+(++revision);window.openai.setWidgetState({modelContent:{kind,figure:3,poolAnimation:selected,variantName:controllers.find(c=>c.style===selected).panel.dataset.variant,...controllers.find(c=>c.style===selected).getState()},privateContent:{kind,revision:lastSavedRevision,selected,variants:Object.fromEntries(controllers.map(c=>[c.style,c.getState()]))}}).catch(()=>{});}
  for(const style of ['slot','gate','card']){
    const container=document.getElementById('pool-study-'+style),panel=container.parentElement;
    const board=container.querySelector('.sector-board'),short=container.querySelector('[data-study-action="short"]'),play=container.querySelector('[data-study-action="play"]'),reset=container.querySelector('[data-study-action="reset"]'),status=container.querySelector('.sector-status');
    let scene,nodes=new Map(),time=focusStart,playing=false,endTime=focusEnd,mode='focus',lastWidth=0,raf=0,timer=0,startedAt=0,startedTime=0;
    function set(id,attrs,text){const el=nodes.get(id);if(!el)throw Error('Missing '+id);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;}
    function getState(){const f=sectorFrame(time,program);return {time,playing,mode,endTime,phase:f.phase,recipientBefore:f.rows[0].activeRecipient<0?null:'S'+(f.rows[0].activeRecipient+1),recipientAfter:f.rows[1].activeRecipient<0?null:'S'+(f.rows[1].activeRecipient+1),createdBefore:f.rows[0].created,createdAfter:f.rows[1].created,copiesBefore:f.rows[0].copies,copiesAfter:f.rows[1].copies,refAfter:f.rows[1].messages[0].ref,returnedAfter:f.rows[1].returned[0]};}
    function render(){if(!scene)return;const f=sectorFrame(time,program);applyPoolStudyFrame(scene,f,set);const label=mode==='focus'&&time>=focusEnd?'할당 → 사용 → 반납 완료':f.phase;if(status.textContent!==label)status.textContent=label;short.textContent=playing&&mode==='focus'?'일시정지':'할당·반납 재생';play.textContent=playing&&mode==='full'?'일시정지':mode==='full'&&time>0&&time<duration?'이어 재생':'전체 재생';short.setAttribute('aria-pressed',String(playing&&mode==='focus'));play.setAttribute('aria-pressed',String(playing&&mode==='full'));}
    function cancel(){if(raf)cancelAnimationFrame(raf);if(timer)clearTimeout(timer);raf=0;timer=0;}
    function update(){if(playing)time=Math.min(endTime,startedTime+Math.max(0,performance.now()-startedAt));}
    function stop(){update();cancel();playing=false;}
    function schedule(){raf=requestAnimationFrame(tick);timer=setTimeout(tick,80);}
    function tick(){cancel();if(!playing)return;update();render();if(time>=endTime){stop();render();save();}else schedule();}
    function start(nextMode){selected=style;if(playing&&mode===nextMode){stop();render();save();return;}stop();if(mode!==nextMode||time>=endTime){time=nextMode==='focus'?focusStart:0;}mode=nextMode;endTime=mode==='focus'?focusEnd:duration;if(media.matches)time=endTime;else{playing=true;startedTime=time;startedAt=performance.now();schedule();}render();save();}
    short.addEventListener('click',()=>start('focus'));play.addEventListener('click',()=>start('full'));reset.addEventListener('click',()=>{selected=style;stop();mode='focus';time=focusStart;endTime=focusEnd;render();save();});
    function draw(width){if(!Number.isFinite(width)||width<=0)return;width=Math.max(320,Math.round(width));if(width===lastWidth)return;scene=createPoolStudyScene(width,style);const accessible=Array.from(board.children).filter(el=>['title','desc'].includes(el.tagName.toLowerCase()));board.replaceChildren(...accessible);board.insertAdjacentHTML('beforeend',scene.markup);board.setAttribute('width',String(width));board.setAttribute('height',String(scene.height));board.setAttribute('viewBox',`0 0 ${width} ${scene.height}`);nodes=new Map(Array.from(board.querySelectorAll('[id]')).map(el=>[el.id,el]));lastWidth=width;render();}
    const controller={style,panel,getState,restore(s){stop();mode=s.mode==='full'?'full':'focus';endTime=mode==='full'?duration:focusEnd;time=Math.max(0,Math.min(endTime,Number(s.time)||0));render();},stop(){stop();render();},seek(t){stop();time=Math.max(0,Math.min(duration,Number(t)||0));render();}};controllers.push(controller);container.animation=controller;
    draw(container.getBoundingClientRect().width||736);
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(entries=>draw(entries[0].contentRect.width)).observe(container);
    if(typeof MutationObserver!=='undefined')new MutationObserver(()=>{if(panel.hidden)controller.stop();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  }
  function restore(state){const s=state?.privateContent;if(!s||s.kind!==kind||s.revision===lastSavedRevision)return;if(['slot','gate','card'].includes(s.selected))selected=s.selected;for(const c of controllers)if(s.variants?.[c.style])c.restore(s.variants[c.style]);}
  restore(window.openai?.widgetState);window.addEventListener('openai:set_globals',e=>restore(e.detail?.globals?.widgetState));
  media.addEventListener('change',()=>{if(media.matches)for(const c of controllers)c.stop();});
  root.animation={getStates:()=>controllers.map(c=>({style:c.style,...c.getState()}))};
})();
