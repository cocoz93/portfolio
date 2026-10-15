const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');
let scene=fs.readFileSync(path.join(dir,'scene-template.js'),'utf8');
const marker=scene.indexOf('/* MAGE_RENDERER */');assert(marker>0);
scene=scene.slice(0,marker).replace("const kind='unified-'","const kind='header-'").replace('height=compact?1040:548','height=compact?1080:548')+fs.readFileSync(path.join(dir,'scene-body.jsfrag'),'utf8');
fs.writeFileSync(path.join(dir,'scene-template.js'),scene);
for(const name of ['design-studies-template.html','qa/review.cjs']){
  const file=path.join(dir,name);let text=fs.readFileSync(file,'utf8').replaceAll('sector-bundle-unified-v15','sector-bundle-header-v16');
  if(name.endsWith('.html')){
    text=text.replace('모든 Msg의 높이는 80픽셀, 제목 영역은 24픽셀,','모든 Msg의 높이는 100픽셀, 이름표 영역은 24픽셀, 실제 패킷 헤더를 나타내는 별도의 회색 Header 영역은 20픽셀,');
    text=text.replace('Msg 이름과 좌표는 같은','변경 전의 Msg 네 개에는 각각 Header가 있고, 변경 후 묶음 Msg에는 Header 하나와 네 좌표 데이터가 있습니다. Header의 도형 크기는 실제 바이트 비율을 나타내지 않습니다. Msg 이름과 좌표는 같은');
  }else{
    text=text.replaceAll('unified.html','packet-header.html').replaceAll('message-header-divider','message-title-divider').replace('0 0 320 1040','0 0 320 1080');
    text=text.replace('messageHeight:80,headerHeight:24','messageHeight:100,titleHeight:24,protocolHeaderHeight:20,protocolHeadersBefore:4,protocolHeadersAfter:1,headerAppearance: \'neutral gray, payload-only blue emphasis\'');
    const anchor="assert.equal((scene.markup.match(/data-role=\"message-title-divider\"/g)||[]).length,5);";assert(text.includes(anchor));
    text=text.replace(anchor,anchor+"\n    assert.equal((scene.markup.match(/data-role=\"packet-header\"/g)||[]).length,5);\n    assert.equal(scene.rows[0].packets.filter(p=>p.protocolHeader).length,4);\n    assert(scene.rows[1].bundleProtocolHeader);assert(scene.rows[1].packets.every(p=>!p.protocolHeader));");
  }
  fs.writeFileSync(file,text);
}
const build=path.join(dir,'qa/build.cjs');fs.writeFileSync(build,fs.readFileSync(build,'utf8').replaceAll('unified.html','packet-header.html'));
console.log('Added shared header section; preserved four ordered payloads and original animation timing.');
