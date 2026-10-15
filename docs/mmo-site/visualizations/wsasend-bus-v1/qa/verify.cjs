const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const deps = 'C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(path.join(deps, 'sharp'));
const { createCanvas, GlobalFonts } = require(path.join(deps, '@napi-rs/canvas'));
GlobalFonts.registerFromPath('C:/Windows/Fonts/malgun.ttf', 'PCB-Review');
const dir = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(dir, 'animation.js'), 'utf8');
const template = fs.readFileSync(path.join(dir, 'wsasend-bus-template.html'), 'utf8');
const palette = Object.fromEntries([...template.matchAll(/(--pcb-[\w-]+):\s*(#[\da-f]+)/gi)].map(m => [m[1], m[2]]));
const color = value => {
  let s = String(value).replace(/var\((--pcb-[\w-]+)\)/g, (_, key) => {
    if (!palette[key]) throw Error(`Missing palette: ${key}`);
    return palette[key];
  });
  s = s.replace(/color-mix\(in srgb,\s*(#[\da-f]{6})\s+([\d.e+-]+)%,\s*(#[\da-f]{6})\)/gi, (_, a, percent, b) => {
    const t = Number(percent) / 100;
    const rgb = [0, 1, 2].map(i => Math.round(parseInt(a.slice(1 + i * 2, 3 + i * 2), 16) * t + parseInt(b.slice(1 + i * 2, 3 + i * 2), 16) * (1 - t)));
    return '#' + rgb.map(n => n.toString(16).padStart(2, '0')).join('');
  });
  return s;
};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function segments(d) {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  let x = 0, y = 0, i = 0, command = '', total = 0;
  const list = [];
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) command = tokens[i++];
    let nx = x, ny = y;
    if (command === 'M' || command === 'L') { nx = Number(tokens[i++]); ny = Number(tokens[i++]); }
    else if (command === 'H') nx = Number(tokens[i++]);
    else if (command === 'V') ny = Number(tokens[i++]);
    else throw Error(`Unsupported trace command ${command}`);
    if (command !== 'M') {
      const length = Math.hypot(nx - x, ny - y);
      list.push({ x, y, nx, ny, length, start: total }); total += length;
    }
    x = nx; y = ny;
    if (command === 'M') command = 'L';
  }
  return { list, total, end: { x, y } };
}
class Element {
  constructor(tag, attrs = {}) { this.tagName = tag; this.attrs = { ...attrs }; this.children = []; this.parentNode = null; this.style = {}; this.handlers = {}; this._text = ''; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  appendChild(el) { el.parentNode = this; this.children.push(el); return el; }
  insertBefore(el, before) { el.parentNode = this; this.children.splice(this.children.indexOf(before), 0, el); return el; }
  remove() { if (this.parentNode) this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); }
  set textContent(value) { this._text = String(value); }
  get textContent() { return this._text; }
  addEventListener(event, fn) { this.handlers[event] = fn; }
  matches(selector) {
    if (selector.startsWith('.')) return (this.attrs.class || '').split(/\s+/).includes(selector.slice(1));
    if (selector.startsWith('#')) return this.attrs.id === selector.slice(1);
    return this.tagName === selector;
  }
  querySelector(selector) { for (const child of this.children) { if (child.matches(selector)) return child; const found = child.querySelector(selector); if (found) return found; } return null; }
  getTotalLength() { return segments(this.attrs.d).total; }
  getPointAtLength(distance) {
    const s = segments(this.attrs.d);
    const item = s.list.find(p => distance <= p.start + p.length) || s.list.at(-1);
    if (!item) return s.end;
    const t = Math.max(0, Math.min(1, (distance - item.start) / item.length));
    return { x: item.x + (item.nx - item.x) * t, y: item.y + (item.ny - item.y) * t };
  }
}
function walk(el, fn) { fn(el); for (const child of el.children) walk(child, fn); }
function serialize(el, resolved = true) {
  const convert = value => resolved ? color(value) : String(value);
  const attrs = Object.entries(el.attrs).map(([key, value]) => `${key}="${escape(convert(value))}"`).join(' ');
  const style = Object.entries(el.style).map(([key, value]) => `${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}:${convert(value)}`).join(';');
  return `<${el.tagName}${attrs ? ' ' + attrs : ''}${style ? ` style="${escape(style)}"` : ''}>${escape(el._text)}${el.children.map(child => serialize(child, resolved)).join('')}</${el.tagName}>`;
}
function harness(width, reduce = false) {
  const root = new Element('div', { id: 'wsasend-bus-v1' });
  const svg = root.appendChild(new Element('svg', { class: 'pcb-board', xmlns: 'http://www.w3.org/2000/svg' }));
  const play = root.appendChild(new Element('button', { class: 'pcb-play' }));
  const replay = root.appendChild(new Element('button', { class: 'pcb-replay' }));
  const status = root.appendChild(new Element('span', { class: 'pcb-status' }));
  const dimensions = { width }; root.getBoundingClientRect = () => dimensions;
  let resize, saved, frames = new Map(), id = 0;
  const events = {};
  const sandbox = {
    document: { getElementById: name => name === root.attrs.id ? root : null, createElementNS: (_, tag) => new Element(tag), addEventListener() {} },
    window: { addEventListener: (name, fn) => { events[name] = fn; }, openai: { setWidgetState: snapshot => { saved = snapshot; return Promise.resolve(); } } },
    matchMedia: () => ({ matches: reduce, addEventListener() {} }),
    ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} },
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id)
  };
  vm.runInNewContext(source, sandbox, { timeout: 3000 });
  const list = role => { const found = []; walk(svg, el => { if (el.attrs['data-role'] === role) found.push(el); }); return found; };
  return { root, svg, play, replay, status, list, events, saved: () => saved,
    resize(next) { dimensions.width = next; resize(); },
    advance(now) { const jobs = [...frames.values()]; frames.clear(); for (const job of jobs) job(now); }
  };
}
function svgText(h) {
  const css = `<style>text{font-family:PCB-Review,'Malgun Gothic',sans-serif;fill:${palette['--pcb-text']};font-weight:500}.pcb-muted{fill:${palette['--pcb-muted']}}.pcb-accent{fill:${palette['--pcb-active']}}.pcb-mono{font-family:PCB-Review,'Malgun Gothic',monospace}</style>`;
  return serialize(h.svg).replace('>', '>' + css);
}
function extractModels(code) {
  const timing = code.slice(code.indexOf('  const M ='), code.indexOf('  const reduced ='));
  const helpers = code.slice(code.indexOf('  const clamp ='), code.indexOf('  function blendColor'));
  const model = code.slice(code.indexOf('  function rowModel'), code.indexOf('  function paint'));
  return vm.runInNewContext(`(()=>{let time=0,playing=false,mode='desktop';const reduced={matches:false};${timing}${helpers}${model};return{T,M,rowModel,model};})()`);
}
const original = fs.readFileSync(path.resolve(dir, '../pcb-animation-v1/wsasend-pcb-previous.html'), 'utf8');
const previous = extractModels(original.match(/<script>([\s\S]*?)<\/script>/)[1]);
const current = extractModels(source);
assert.deepEqual(JSON.parse(JSON.stringify(current.T)), JSON.parse(JSON.stringify(previous.T)));
assert.deepEqual(JSON.parse(JSON.stringify(current.M)), JSON.parse(JSON.stringify(previous.M)));
const { T, M } = current;
assert.equal(T.end, 22580);
for (let at = 0; at <= T.end; at += 20) {
  assert.equal(JSON.stringify(current.model(at)), JSON.stringify(previous.model(at)), `Domain drift at ${at}`);
}
const metrics = createCanvas(10, 10).getContext('2d');
const widths = [736, 660, 659, 360, 320];
const phases = {
  initial: 0,
  'before-queue': T.start + T.queueOn + M.state,
  'before-drained': T.start + T.call + M.state,
  'after-stored': T.afterStart + T.start + 3 * T.periodAfter + T.queueOn + M.state,
  'after-send': T.afterStart + T.tick + M.main / 2,
  final: T.end
};
const phaseResults = [];
const renders = [];
async function run() {
  for (const width of widths) {
    const h = harness(width);
    assert.equal(h.list('character').length, 2);
    assert.equal(h.list('message-fill').length, 8);
    assert.equal(h.list('queue-slot').length, 16);
    assert.equal(h.list('send-transfer').length, 5);
    assert.equal(h.list('message-signal').filter(el => el.attrs['data-items'] === '4').length, 1);
    const expectedHeight = width < 660 ? 772 : 476;
    assert.equal(h.svg.attrs.viewBox, `0 0 ${width} ${expectedHeight}`);
    for (const [name, at] of Object.entries(phases)) {
      const state = h.root.animation.seek(at);
      if (width === 736) phaseResults.push({ name, at, before: state.callsBefore, after: state.callsAfter, pendingBefore: state.pendingBefore, pendingAfter: state.pendingAfter });
      let texts = 0;
      walk(h.svg, el => {
        if (el.tagName !== 'text' || !el._text) return;
        if (el.parentNode.attrs['data-role'] === 'message-signal') return;
        const font = Number(el.attrs['font-size']); assert(font >= 11, `Small text: ${el._text}`);
        metrics.font = `${font}px PCB-Review`;
        const measured = metrics.measureText(el._text).width;
        const x = Number(el.attrs.x), y = Number(el.attrs.y), anchor = el.attrs['text-anchor'];
        const left = x - (anchor === 'middle' ? measured / 2 : anchor === 'end' ? measured : 0);
        assert(left >= 0 && left + measured <= width + .5 && y - font / 2 >= 0 && y + font / 2 <= expectedHeight, `Text clipped at ${width}: ${el._text}`);
        texts++;
      });
      if (width === 736 || ([320, 660].includes(width) && ['final', 'after-send'].includes(name))) {
        const svg = svgText(h), stem = `${name}-${width}`;
        fs.writeFileSync(path.join(__dirname, stem + '.svg'), svg);
        await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, stem + '.png'));
        renders.push(stem + '.png');
      }
      if (width === 736 && name === 'initial') {
        fs.writeFileSync(path.join(__dirname, 'initial-scene.svg.txt'), `<g id="wsasend-bus-static-preview">${h.svg.children.map(el => serialize(el, false)).join('')}</g>`);
      }
    }
    h.root.animation.seek(T.start + T.inputEnd + M.main / 2);
    const filling = h.list('message-fill').find(el => el.attrs['data-row'] === '0' && el.attrs['data-message'] === '0');
    assert.equal(Number(filling.attrs.width), 55);
    assert.equal(Number(filling.attrs.height), 26);
    for (let i = 0; i < 4; i++) {
      h.root.animation.seek(T.start + i * T.period + T.queueOn + M.state);
      assert.equal(h.root.animation.getState().pendingBefore, 1);
      const beforeSlots = h.list('queue-slot').filter(el => el.attrs['data-row'] === '0');
      assert.equal(beforeSlots.filter(el => Number(el.attrs['data-light-level']) === 1).length, 1);
      h.root.animation.seek(T.start + i * T.period + T.call + M.state);
      assert.equal(h.root.animation.getState().pendingBefore, 0);
      assert.equal(h.root.animation.getState().callsBefore, i + 1);
      assert(beforeSlots.every(el => Number(el.attrs['data-light-level']) === 0));
      h.root.animation.seek(T.afterStart + T.start + i * T.periodAfter + T.queueOn + M.state);
      assert.equal(h.root.animation.getState().pendingAfter, i + 1);
      const afterSlots = h.list('queue-slot').filter(el => el.attrs['data-row'] === '1');
      assert.equal(afterSlots.filter(el => Number(el.attrs['data-light-level']) === 1).length, i + 1);
      assert.equal(h.root.animation.getState().callsAfter, 0);
    }
    h.root.animation.seek(T.end);
    assert(h.list('queue-slot').every(el => Number(el.attrs['data-light-level']) === 0));
    assert(h.list('animation-row').every(el => Number(el.attrs.opacity) === 1));
    h.play.handlers.click(); assert.equal(h.root.animation.getState().time, 0); assert.equal(h.root.animation.getState().playing, true);
    h.play.handlers.click(); assert.equal(h.root.animation.getState().playing, false);
    h.replay.handlers.click(); assert.equal(h.root.animation.getState().time, 0); assert.equal(h.root.animation.getState().playing, true);
    assert.equal(h.saved().privateContent.kind, 'wsasend-bus-animation-v1');
    h.root.animation.seek(5000);
    h.resize(width === 320 ? 736 : 320);
    assert.equal(h.root.animation.getState().time, 5000);
    assert.equal(h.list('character').length, 2);
  }
  const reduced = harness(736, true);
  assert.equal(reduced.root.animation.getState().playing, false);
  const animation = harness(736);
  animation.advance(1000); animation.advance(1100);
  assert.equal(animation.root.animation.getState().time, 100);
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(source));
  const report = { verification: 'source, emulated component DOM, offscreen SVG rasterization', browserHostVerified: false, widths, timelineMs: T.end, phases: phaseResults, renders, checks: ['unchanged model at every 20ms', 'queue enters and drains', 'batch accumulates four and drains', '4 versus 1 calls', 'left-to-right Msg fills', 'play, pause and replay', 'resize preserves playhead', 'reduced motion pauses', 'label bounds and minimum size'] };
  fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
