const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),old=path.resolve(dir,'../sector-bundle-before-speed-v18');
let body=fs.readFileSync(path.join(old,'scene-body.jsfrag'),'utf8');
const start=body.indexOf('    box(map.x,map.y,map.w,map.h,'),end=body.indexOf('    const centers=',start);assert(start>0&&end>start);
let character=body.slice(start,end).replaceAll('map.','sourceMap.').replaceAll('sid(row,','sid(\'shared\',');
character=character.replace('cellW=grid.w/3,cellH=grid.h/3','cellW=grid.w,cellH=grid.h/5').replace('[[0,2],[0,1],[1,1],[1,0],[2,0]]','[[0,4],[0,3],[0,2],[0,1],[0,0]]');
character=character.replace('for(let i=1;i<3;i++){wire([[grid.x+cellW*i,grid.y],[grid.x+cellW*i,grid.y+grid.h]],C.edge,false,.45);wire([[grid.x,grid.y+cellH*i],[grid.x+grid.w,grid.y+cellH*i]],C.edge,false,.45);}','for(let i=1;i<5;i++)wire([[grid.x,grid.y+cellH*i],[grid.x+grid.w,grid.y+cellH*i]],C.edge,false,.45);');
character=character.replace('meta.movementArrows=[]','const movementArrows=[]').replaceAll('meta.movementArrows','movementArrows').replace('meta.character=','const sharedCharacter=').replace("directions:['north','east','north','east']","directions:['north','north','north','north']").replace('sourceCell,targetCell};','sourceCell,targetCell,movementArrows};');
body=body.slice(0,start)+'    meta.character=sharedCharacter;meta.movementArrows=movementArrows;\n'+body.slice(end);
const marker='  for(let row=0;row<2;row++){';
assert(body.includes(marker));
body=body.replace(marker,"  const sourceMap={x:compact?(width-G.mapW)/2:left,y:compact?62:102,w:G.mapW,h:compact?218:392};\n  txt('캐릭터 이동',sourceMap.x+sourceMap.w/2,compact?46:35,12,C.muted);\n  out.push('<g data-role=\"shared-movement-source\">');\n"+character+"  out.push('</g>');\n"+marker);
body=body.replace("txt('캐릭터 이동',left+G.mapW/2,35,12,C.muted);",'');
body=body.replace('offset=row*(compact?548:248),cy=offset+(compact?134:174)','offset=row*(compact?346:248),cy=offset+(compact?418:174)');
body=body.replace('msgTop=compact?offset+248:cy-G.packetH/2','msgTop=cy-G.packetH/2').replace('ringY=compact?offset+458:cy','ringY=compact?offset+578:cy');
body=body.replace("txt(after?'변경 후':'변경 전',compact?20:left,offset+(compact?20:76)","txt(after?'변경 후':'변경 전',compact?20:messageX,offset+(compact?326:76)");
body=body.replace("if(compact){txt('캐릭터 이동',width/2,offset+46,12,C.muted);txt('SendQ',ringX,offset+396,12,C.muted);}","if(compact)txt('SendQ',ringX,offset+516,12,C.muted);");
const inputStart=body.indexOf("        const sourceX=width/2-9+i*G.pitch,laneY=map.y+map.h+(i===0||i===3?8:14);");
const inputEnd=body.indexOf('        if(!after){',inputStart);assert(inputStart>0&&inputEnd>inputStart);
body=body.slice(0,inputStart)+"        const sourceY=sourceMap.y+sourceMap.h+8,node=[width/2,sourceMap.y+sourceMap.h+28],inputY=msgTop-G.lead,busY=inputY-18;\n        terminal(width/2,sourceMap.y+sourceMap.h+4,sourceMap.y+sourceMap.h,'y');\n        const branch=clippedCorners(after?[node,[4,node[1]],[4,busY],[centers[i],busY]]:[node,[node[0],busY],[centers[i],busY]]);\n        inputs.push([[width/2,sourceY],...branch,[centers[i],inputY]]);\n"+body.slice(inputEnd);
body=body.replaceAll('compact?530:298','compact?654:298').replace('wire([[20,compact?654:298]','wire([[compact?20:mapRightDivider(),compact?654:298]');
body=body.replace("  return {markup:out.join('\\n'),width,height,compact,layout,routing,material,metrics:G,labels,traces,rows};","  return {markup:out.join('\\n'),width,height,compact,layout,routing,material,metrics:G,labels,traces,rows,sharedCharacter,sourceMap};");
body=body.replace('  for(let row=0;row<2;row++){','  function mapRightDivider(){return sourceMap.x+sourceMap.w+16;}\n  for(let row=0;row<2;row++){');
fs.writeFileSync(path.join(dir,'scene-body.jsfrag'),body);
const template=fs.readFileSync(path.join(old,'scene-template.js'),'utf8'),prefix=template.slice(0,template.indexOf('/* MAGE_RENDERER */')).replace("const kind='signal-'","const kind='maponly-'").replace('height=compact?1080:548','height=compact?980:548');
fs.writeFileSync(path.join(dir,'scene-template.js'),prefix+body);
for(const name of ['design-studies-template.html','qa/build.cjs','qa/review.cjs']){
  const file=path.join(dir,name);let text=fs.readFileSync(file,'utf8').replaceAll('sector-bundle-before-speed-v18','sector-bundle-map-only-v20').replaceAll('sector-bundle-shared-move-v19','sector-bundle-map-only-v20').replaceAll('before-speed.html','map-only.html').replaceAll('shared-movement.html','map-only.html');
  if(name.endsWith('.html')){
    text=text.replace('(0,1), (1,1), (1,0), (2,0)','(0,3), (0,2), (0,1), (0,0)');
    text=text.replace('좁은 화면에서도 부품을 줄이지 않고 캐릭터, Msg, SendQ를 위에서 아래로 쌓습니다.','두 이동 사각형의 기존 좌우 경계를 유지하고 세로로 하나로 통합했습니다. 마법사 한 명이 다섯 칸의 세로 경로를 아래에서 위로 네 번 이동하며, 전후가 같은 이동판을 공유합니다. 데스크톱의 입력 배선, 출력 배선, Msg와 SendQ의 좌표와 크기는 합치기 전 버전과 같습니다. 좁은 화면에서는 같은 부품 크기로 이동판과 두 처리 구간을 세로로 쌓습니다.');
  }else if(name==='qa/review.cjs'){
    text=text.replace("getAttribute('width'),'56'","getAttribute('width'),'48'").replace('dataCell:[56,40]','dataCell:[48,40]').replace('mapSize:[72,218]','mapSize:[120,392]');
    text=text.replace('data-role="source-message-divider"/g)||[]).length,1','data-role="source-message-divider"/g)||[]).length,2');
    text=text.replace('assert(row.sharedInput);assert(row.sourceBeams.every(beam=>JSON.stringify(beam.points[0])===JSON.stringify(scene.rows[0].sourceBeams[0].points[0])));','if(!scene.compact)assertSeparatePaths(row.sourceBeams,`${routing}/${width}/${row.row}/input`);');
    text=text.replace("desktopLayout:'one centered shared source, wider message cells'","desktopLayout:'v18 component coordinates and all transfer traces restored; only source board merged'");
    const apiAnchor="const script=fragment.match(/<script>([\\s\\S]*?)<\\/script>/)[1];new vm.Script(script);";assert(text.includes(apiAnchor));
    text=text.replace(apiAnchor,apiAnchor+"\nconst beforeMerge=vm.runInNewContext(fs.readFileSync(path.resolve(dir,'../sector-bundle-before-speed-v18/scene.js'),'utf8')+';({createBundleAnimationScene,createBundleProgram})');");
    const geoAnchor='const reference=originalTiming.createBundleProgram(scene.compact);';assert(text.includes(geoAnchor));
    text=text.replace(geoAnchor,"if(!scene.compact){const restored=beforeMerge.createBundleAnimationScene(width,layout,routing,material);\n      for(let row=0;row<2;row++){\n        for(const beams of ['sourceBeams','copyBeams','outletBeams'])assert.equal(JSON.stringify(scene.rows[row][beams].map(beam=>beam.points)),JSON.stringify(restored.rows[row][beams].map(beam=>beam.points)),`Restored ${beams} coordinates`);\n        const shape=row=>row.messages.map(({id,...geometry})=>geometry);assert.equal(JSON.stringify(shape(scene.rows[row])),JSON.stringify(shape(restored.rows[row])),'Msg sizes and positions must match v18');\n        for(let index=0;index<scene.rows[row].queue.length;index++){const {id,...newShape}=scene.rows[row].queue[index],{id:oldId,...oldShape}=restored.rows[row].queue[index];assert.equal(JSON.stringify(newShape),JSON.stringify(oldShape),'SendQ sizes and positions must match v18');}\n      }\n    }\n    "+geoAnchor);
  }
  fs.writeFileSync(file,text);
}
console.log('Restored v18 stage geometry and desktop transfer paths; merged only the source board.');
