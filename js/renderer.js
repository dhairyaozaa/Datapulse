const Renderer = (() => {

  function renderKPIs(kpis) {
    const row = document.getElementById("kpiRow");
    if (!row) return;
    row.innerHTML = kpis.map((k, i) => `
      <div class="kpi-card s${Math.min(i+1,6)}" role="listitem">
        <div class="kpi-icon" aria-hidden="true">${k.icon}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${k.value}</div>
        ${k.sub ? `<div class="kpi-sub">${k.sub}</div>` : ""}
      </div>`).join("");
  }

  function renderInsights(insights) {
    const strip = document.getElementById("insightStrip");
    const list  = document.getElementById("insightList");
    if (!strip || !list) return;
    if (!insights?.length) { strip.style.display = "none"; return; }
    list.innerHTML = insights.map((ins, i) => `
      <li class="insight-item" style="animation-delay:${i*.06}s">
        ${ins.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}
      </li>`).join("");
    strip.style.display = "flex";
  }

  function renderColumns(columns) {
    const grid = document.getElementById("colGrid");
    if (!grid) return;
    const entries = Object.entries(columns || {});
    if (!entries.length) { grid.innerHTML = '<p class="empty-msg">No column data available.</p>'; return; }
    grid.innerHTML = entries.map(([col, meta], i) => `
      <div class="col-card s${Math.min((i%6)+1,6)}">
        <div class="col-name" title="${col}">${col}</div>
        <span class="type-pill ${meta.type}">${meta.type}</span>
        <div class="col-stats">${buildStats(meta)}</div>
      </div>`).join("");
  }

  function buildStats(meta) {
    const row = (k,v) => `<div class="cs-row"><span class="cs-k">${k}</span><span class="cs-v">${v}</span></div>`;
    const fmt = v => v==null?"—":typeof v==="number"?(Number.isInteger(v)?v.toLocaleString():v.toFixed(3)):String(v);
    const rows = [row("missing", meta.missing??0), row("unique", meta.unique??0)];
    if (meta.type==="numeric") {
      rows.push(row("mean",fmt(meta.mean)),row("min",fmt(meta.min)),row("max",fmt(meta.max)));
      if (meta.std!=null) rows.push(row("std±",fmt(meta.std)));
    } else if ((meta.type==="categorical"||meta.type==="boolean") && meta.top_values) {
      Object.entries(meta.top_values).slice(0,3).forEach(([k,v])=>rows.push(row("top",`${k} (${v})`)));
    } else if (meta.type==="datetime") {
      rows.push(row("from",meta.min?.slice(0,10)??"—"),row("to",meta.max?.slice(0,10)??"—"));
    }
    return rows.join("");
  }

  function renderTable(preview, headers) {
    const head = document.getElementById("tHead");
    const body = document.getElementById("tBody");
    const note = document.getElementById("previewNote");
    if (!head||!body) return;
    const cols = headers?.length ? headers : (preview[0] ? Object.keys(preview[0]) : []);
    head.innerHTML = `<tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr>`;
    body.innerHTML = preview.map(row =>
      `<tr>${cols.map(c=>{
        const v=row[c];
        const isNum = v!==null&&v!==""&&!isNaN(Number(v));
        return `<td class="${isNum?"num":""}">${v??""}</td>`;
      }).join("")}</tr>`).join("");
    if (note) note.textContent = `Showing first ${preview.length} rows`;
  }

  function renderFileBadge(filename, shape) {
    const n = document.getElementById("fpName");
    const s = document.getElementById("fpShape");
    if (n) n.textContent = filename;
    if (s) s.textContent = `${(shape.rows||0).toLocaleString()} rows × ${shape.cols||0} cols`;
  }

  return { renderKPIs, renderInsights, renderColumns, renderTable, renderFileBadge };
})();
