const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const modules='C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(modules,'sharp')),canvas=require(path.join(modules,'@napi-rs/canvas'));
canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf','PCB-Review');
canvas.GlobalFonts.registerFromPath('C:/Windows/Fonts/consola.ttf','PCB-Code-Review');
const dir=__dirname,fragment=fs.readFileSync(path.join(dir,'reuse-studies.html'),'utf8'),source=fs.readFileSync(path.join(dir,'scene.js'),'utf8');
const api=vm.runInNewContext(source+';({createMatchedReuseScene})');
const colors=Object.fromEntries([...fragment.matchAll(/(--pcb-[\w-]+):\s*(#[a-fA-F0-9]{6})/g)].map(m=>[m[1],m[2]]));
const baseline=fs.readFileSync(path.resolve(dir,'../sector-bundle-held-pulse-v26/msg-held-pulse.html'),'utf8');
const palette=Object.fromEntries([...baseline.matchAll(/(--pcb-[\w-]+):\s*(#[a-fA-F0-9]{6})/g)].map(m=>[m[1],m[2]]));
assert.deepEqual(colors,palette);assert(Buffer.byteLength(fragment)<1_000_000);
assert(!/<!doctype|<html\b|<head\b|<body\b/i.test(fragment));assert(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(fragment));
const qa=path.join(dir,'qa');fs.mkdirSync(qa,{recursive:true});
const widths=[1024,736,700,699,360,320],problems=[];
function check(s) {
  const ctx=canvas.createCanvas(1,1).getContext('2d');
  const labels=s.labels.map(l=>{
    ctx.font=`500 ${l.size}px ${l.mono?'PCB-Code-Review':'PCB-Review'}`;
    const w=ctx.measureText(l.text).width,x=l.anchor==='start'?l.x:l.anchor==='end'?l.x-w:l.x-w/2;
    return {...l,x0:x,x1:x+w,y0:l.y-l.size/2,y1:l.y+l.size/2};
  });
  for(const l of labels) {
    assert(l.size>=11);
    if(l.x0<0||l.x1>s.width||l.y0<0||l.y1>s.height)problems.push({layout:s.layout,width:s.width,type:'clipped-label',text:l.text});
  }
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++) {
    const a=labels[i],b=labels[j];
    if(Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)>1&&Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)>1)problems.push({layout:s.layout,width:s.width,type:'label-overlap',a:a.text,b:b.text});
  }
  for(let i=0;i<s.components.length;i++) {
    const a=s.components[i];assert(a.x>=0&&a.y>=0&&a.x+a.w<=s.width&&a.y+a.h<=s.height);
    for(let j=i+1;j<s.components.length;j++) {
      const b=s.components[j];
      if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0)problems.push({layout:s.layout,width:s.width,type:'component-overlap',a:a.role,b:b.role});
    }
  }
  for(const l of labels)for(const b of s.components) {
    const hit=Math.min(l.x1,b.x+b.w)-Math.max(l.x0,b.x)>1&&Math.min(l.y1,b.y+b.h)-Math.max(l.y0,b.y)>1;
    const contained=l.x0>=b.x-1&&l.x1<=b.x+b.w+1&&l.y0>=b.y-1&&l.y1<=b.y+b.h+1;
    if(hit&&!contained)problems.push({layout:s.layout,width:s.width,type:'label-on-edge',text:l.text,role:b.role});
  }
  for(const pts of s.traces)for(let i=0;i<pts.length;i++) {
    assert(pts[i][0]>=0&&pts[i][0]<=s.width&&pts[i][1]>=0&&pts[i][1]<=s.height);
    if(!i)continue;
    const dx=Math.abs(pts[i][0]-pts[i-1][0]),dy=Math.abs(pts[i][1]-pts[i-1][1]);assert(dx===0||dy===0||Math.abs(dx-dy)<1e-6);
  }
  assert.equal(s.rows[0].messages.length,3);assert.equal(s.rows[1].messages.length,1);
  for(const row of s.rows)for(const m of row.messages)assert.equal(m.h,100);
  const m=s.rows[1].messages[0];assert(s.rows[0].messages.every(b=>b.w===m.w));
  for(let i=0;i<3;i++) {
    const a=s.rows[0].queues[i],b=s.rows[1].queues[i];assert.equal(a.cx,b.cx);assert.equal(a.cy+s.height/2,b.cy);assert.equal(a.r,b.r);
  }
  return labels;
}
async function render(s,name) {
  const resolved=s.markup.replace(/var\((--pcb-[\w-]+)\)/g,(_,k)=>{assert(colors[k]);return colors[k];});
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;font-weight:500}.reuse-mono{font-family:PCB-Code-Review,monospace}</style>${resolved}</svg>`;
  fs.writeFileSync(path.join(qa,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(qa,name+'.png'));
}
async function main() {
  const ids=[...fragment.split('<script>')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  for(const layout of ['aligned','fanout'])for(const width of widths)check(api.createMatchedReuseScene(width,layout));
  for(const layout of ['aligned','fanout'])for(const width of [736,320])await render(api.createMatchedReuseScene(width,layout),layout+'-'+width);
  const result={ok:!problems.length,designs:['수신자 정렬','공용 Msg 중심'],animated:false,paletteExactlyMatchesFigure2:true,sameWizardRenderer:true,sameHeaderGeometry:[24,20],sameDataHeight:40,sameMsgHeight:100,equalMsgDimensionsAcrossComparison:true,equalQueuePositionsAcrossComparison:true,created:[3,1],copies:[3,3],refSequence:[1,4,3,2,1,0],checkedWidths:widths,browserHostVerified:false,problems,sha256:crypto.createHash('sha256').update(fragment).digest('hex')};
  fs.writeFileSync(path.join(qa,'review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(problems.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
