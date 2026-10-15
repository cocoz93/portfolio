(() => {
  function initializeComparison() {
    const comparison = document.getElementById("wsasend-design-comparison");
    if (!comparison) return;
    const panels = Array.from(comparison.querySelectorAll("[data-comparison-panel]"));
    const buttons = Array.from(comparison.querySelectorAll("[data-show-design]"));
    const KIND = "wsasend-pcb-design-comparison-v2";
    let selected = 0;

    /*INITIALIZERS*/

    const views = [initializePrevious(), initializeCurrent()];
    for (const view of views) view.animation.seek(view.animation.timings.end);

    let layoutFrame = 0, pendingWidth = 0, layoutWidth = 0, layoutHeight = 0;
    function queueLayout(width) {
      if (!Number.isFinite(width) || width <= 0) return;
      pendingWidth = width;
      if (layoutFrame) return;
      // Rebuilding SVG changes the observed height. Do it in the next frame,
      // outside ResizeObserver delivery, and ignore height-only notifications.
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = 0;
        const nextWidth = pendingWidth;
        if (Math.abs(nextWidth - layoutWidth) < .5) return;
        layoutWidth = nextWidth;
        for (const view of views) view.redraw(nextWidth);
        const height = nextWidth < 660 ? 2354 : 914 * nextWidth / 1536 + 72;
        if (Math.abs(height - layoutHeight) >= .5) {
          for (const panel of panels) panel.style.minHeight = height + "px";
          layoutHeight = height;
        }
      });
    }
    function selectDesign(next) {
      if (next === selected) return;
      const current = views[selected].animation;
      const state = current.getState();
      current.pause();
      views[next].animation.seek(state.time);
      selected = next;
      panels.forEach((panel, i) => { panel.hidden = i !== selected; });
      buttons.forEach((button, i) => { button.setAttribute("aria-pressed", String(i === selected)); });
    }
    function persistComparison() {
      const bridge = window.openai;
      if (typeof bridge?.setWidgetState !== "function") return;
      const state = views[selected].animation.getState();
      const snapshot = {
        modelContent: {
          kind:KIND, design:selected === 0 ? "이전 디자인" : "이번 디자인",
          phase:state.phase, callsBefore:state.callsBefore, callsAfter:state.callsAfter
        },
        privateContent: {kind:KIND, selected, time:state.time, playing:state.playing}
      };
      Promise.resolve(bridge.setWidgetState(snapshot)).catch(() => {});
    }
    function restoreComparison(snapshot) {
      const state = snapshot?.privateContent;
      if (state?.kind !== KIND || !Number.isFinite(state.time)) return;
      if (state.selected !== 0 && state.selected !== 1) return;
      selectDesign(state.selected);
      const animation = views[selected].animation;
      animation.seek(state.time);
      if (state.playing && state.time < animation.timings.end) animation.play();
    }
    buttons.forEach((button, i) => button.addEventListener("click", () => {
      selectDesign(i);
      persistComparison();
    }));
    window.addEventListener("openai:set_globals", event => restoreComparison(event.detail?.globals?.widgetState));
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries.find(item => item.target === comparison);
      if (entry) queueLayout(entry.contentRect.width);
    });
    resizeObserver.observe(comparison);
    queueLayout(comparison.getBoundingClientRect().width);
    restoreComparison(window.openai?.widgetState);
  }
  function startComparison() {
    try {
      initializeComparison();
    } catch (error) {
      const comparison = document.getElementById("wsasend-design-comparison");
      if (!comparison) return;
      const detail = document.createElement("p");
      detail.setAttribute("role", "alert");
      detail.style.cssText = "padding:16px 5%;font:400 14px PCB-Pretendard,sans-serif;color:#eef2fb;background:#0d1421;margin:0";
      detail.textContent = "비교 화면 초기화 오류: " + (error?.message || String(error));
      comparison.appendChild(detail);
    }
  }
  if (document.getElementById("wsasend-design-comparison")) {
    startComparison();
  } else {
    document.addEventListener("DOMContentLoaded", startComparison, {once:true});
  }
})();
