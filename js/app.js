document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  API.checkHealth();
  setInterval(() => API.checkHealth(), 20000);

  Upload.init((data, filename) => {
    const { summary, columns, charts, preview } = data;

    Renderer.renderFileBadge(filename, summary.shape);
    Renderer.renderKPIs(summary.kpis);
    Renderer.renderInsights(summary.insights);
    Charts.renderAll(charts);
    Renderer.renderColumns(columns);
    Renderer.renderTable(preview || [], preview?.[0] ? Object.keys(preview[0]) : []);

    document.getElementById("screenUpload").style.display = "none";
    document.getElementById("screenDash").style.display   = "flex";
    activateTab("tabCharts");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("newFileBtn")?.addEventListener("click", () => {
    Charts.renderAll([]);
    document.getElementById("screenDash").style.display   = "none";
    document.getElementById("screenUpload").style.display = "flex";
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  const TAB_PANELS = { tabCharts:"panelCharts", tabCols:"panelCols", tabPreview:"panelPreview" };
  function activateTab(id) {
    Object.keys(TAB_PANELS).forEach(t => {
      const btn   = document.getElementById(t);
      const panel = document.getElementById(TAB_PANELS[t]);
      const on    = t === id;
      btn?.classList.toggle("active", on);
      btn?.setAttribute("aria-selected", String(on));
      if (panel) panel.style.display = on ? "block" : "none";
    });
  }
  document.querySelectorAll(".tab[role='tab']").forEach(btn =>
    btn.addEventListener("click", () => activateTab(btn.id))
  );

  // Tooltip tracking
  document.addEventListener("mousemove", e => {
    const tip = document.getElementById("tooltip");
    if (tip?.classList.contains("show")) {
      tip.style.left = (e.clientX + 14) + "px";
      tip.style.top  = (e.clientY - 28) + "px";
    }
  });

  document.getElementById("themeToggle")?.addEventListener("click", () =>
    setTimeout(() => Charts.applyDefaults(), 80)
  );
});
