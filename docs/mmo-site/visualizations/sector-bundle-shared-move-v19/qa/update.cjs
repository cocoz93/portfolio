const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
const sceneFile=path.join(dir,'scene-template.js'),original=fs.readFileSync(sceneFile,'utf8'),marker=original.indexOf('/* MAGE_RENDERER */');assert(marker>0);
const body=fs.readFileSync(path.join(dir,'shared-layout.jsfrag'),'utf8');fs.writeFileSync(path.join(dir,'scene-body.jsfrag'),body);
fs.writeFileSync(sceneFile,original.slice(0,marker).replace("const kind='signal-'","const kind='shared-'").replace('height=compact?1080:548','height=compact?980:548')+body);
for(const name of ['design-studies-template.html','qa/review.cjs','qa/build.cjs']){
  const file=path.join(dir,name);let text=fs.readFileSync(file,'utf8').replaceAll('sector-bundle-before-speed-v18','sector-bundle-shared-move-v19').replaceAll('before-speed.html','shared-movement.html');
  if(name.endsWith('.html')){
    text=text.replace('(0,1), (1,1), (1,0), (2,0)','(0,3), (0,2), (0,1), (0,0)').replace('48 곱하기 40픽셀','56 곱하기 40픽셀');
    text=text.replace('좁은 화면에서도 부품을 줄이지 않고 캐릭터, Msg, SendQ를 위에서 아래로 쌓습니다.','왼쪽의 이동판 하나와 마법사 하나를 전후가 공유합니다. 다섯 칸의 세로 경로를 아래에서 위로 네 번 이동합니다. 변경 후가 시작될 때 캐릭터가 잠깐 사라졌다가 출발점에 나타나 같은 이동을 반복합니다. 좁은 화면에서도 이동판은 하나이며 전후 Msg와 SendQ만 아래로 쌓습니다.');
  }else if(name==='qa/review.cjs'){
    text=text.replace("getAttribute('width'),'48'","getAttribute('width'),'56'").replace('0 0 320 1080','0 0 320 980');
    text=text.replace('data-character="mage"/g)||[]).length,2','data-character="mage"/g)||[]).length,1');
    text=text.replace('[{move:1,x:0,y:1},{move:2,x:1,y:1},{move:3,x:1,y:0},{move:4,x:2,y:0}]','[{move:1,x:0,y:3},{move:2,x:0,y:2},{move:3,x:0,y:1},{move:4,x:0,y:0}]');
    text=text.replace('assertSeparatePaths(row.sourceBeams,`${routing}/${width}/${row.row}/input`);','assert(row.sharedInput);assert(row.sourceBeams.every(beam=>JSON.stringify(beam.points[0])===JSON.stringify(scene.rows[0].sourceBeams[0].points[0])));');
    text=text.replace('data-role="source-message-divider"/g)||[]).length,2','data-role="source-message-divider"/g)||[]).length,1');
    text=text.replace('for(const beam of row.sourceBeams){const ys=beam.points.map(p=>p[1]);assert(Math.min(...ys)<beam.points[0][1]);assert(beam.points.at(-1)[1]>Math.min(...ys));}','for(const beam of row.sourceBeams)assert.equal(beam.points.at(-1)[1],row.messages[0].y-8);');
    text=text.replace("const expected=segment.phase==='move'&&segment.row===row.row?row.character.directions[segment.actor]:'south';","const expected=segment.phase==='move'?'north':'south';");
    text=text.replace('const visible=scene.rows.flatMap(row=>row.movementArrows.filter(id=>Number(nodes.get(id).getAttribute(\'opacity\'))>0));','const visible=scene.sharedCharacter.movementArrows.filter(id=>Number(nodes.get(id).getAttribute(\'opacity\'))>0);');
    text=text.replace('dataCell:[48,40]','dataCell:[56,40]').replace('mapSize:[120,144]','mapSize:[72,218],sharedCharacters:1,sharedMovementMaps:1,sourcePath:\'four upward moves replayed for both rows\',reset:\'fade out at endpoint then return to origin without emitting a message\'').replace('charactersPerRow:1','charactersTotal:1').replace("desktopLayout:'original stage centers'","desktopLayout:'one centered shared source, wider message cells'");
    const anchor='const checked=[];';assert(text.includes(anchor));text=text.replace(anchor,anchor+"\n  assert.equal((fragment.replace(/<script>[\\s\\S]*?<\\/script>/g,'').match(/data-role=\"source-sector\"/g)||[]).length,1);");
  }
  fs.writeFileSync(file,text);
}
console.log('One shared five-cell map and one mage; four ordered upward updates in both rows.');
