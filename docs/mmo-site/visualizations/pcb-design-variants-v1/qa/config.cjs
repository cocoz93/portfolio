const characterColors={"pcb-char-ink":"#08121e","pcb-char-steel":"#dce9f3","pcb-char-steel-dark":"#617e9a","pcb-char-blue-mid":"#2579ad","pcb-char-blue-dark":"#17466a","pcb-char-skin":"#ecd0b5","pcb-char-skin-dark":"#bd947a"};
const DESIGNS=[
  {key:"schematic",name:"설계 도면형",colors:{"pcb-bg":"#0c1729","pcb-surface":"#0c1729","pcb-edge":"#42607c","pcb-track":"#9fb9d3","pcb-text":"#eff6ff","pcb-muted":"#b5c6d9","pcb-active":"#77d5ff","pcb-soft":"#183246","pcb-empty":"#14283e",...characterColors}},
  {key:"package",name:"칩 패키지형",colors:{"pcb-bg":"#0b251f","pcb-surface":"#071410","pcb-edge":"#47665a","pcb-track":"#b3c3b4","pcb-text":"#eef6ef","pcb-muted":"#b7c8bc","pcb-active":"#78dfc6","pcb-soft":"#153b32","pcb-empty":"#123329",...characterColors}},
  {key:"bus",name:"버스 배선형",colors:{"pcb-bg":"#101923","pcb-surface":"#182b3b","pcb-edge":"#3f5b72","pcb-track":"#8fa9bd","pcb-text":"#eff4fa","pcb-muted":"#b8c5d3","pcb-active":"#67c8ff","pcb-soft":"#21465e","pcb-empty":"#213547",...characterColors}}
];
module.exports={DESIGNS};
