const Charts = (() => {
  const instances = {};
  const PAL = ["#ceff45","#45d0ff","#ff4466","#ffa830","#a87cff","#45ffbe","#ff7845","#458cff"];

  function applyDefaults() {
    const light  = document.body.classList.contains("light");
    const text2  = light ? "#3d4a6a" : "#5e6a86";
    const text3  = light ? "#8892b4" : "#333d58";
    const tipBg  = light ? "#ffffff" : "#1b2135";
    const tipBd  = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
    const grid   = light ? "rgba(0,0,0,0.04)"  : "rgba(255,255,255,0.035)";

    Chart.defaults.color          = text2;
    Chart.defaults.font.family    = "'JetBrains Mono', monospace";
    Chart.defaults.font.size      = 11;
    Chart.defaults.plugins.legend.display = false;

    const tt = Chart.defaults.plugins.tooltip;
    tt.backgroundColor   = tipBg;
    tt.borderColor       = tipBd;
    tt.borderWidth       = 1;
    tt.padding           = 14;
    tt.cornerRadius      = 10;
    tt.caretSize         = 5;
    tt.caretPadding      = 6;
    tt.titleFont         = { family:"'Syne',sans-serif", weight:"800", size:12 };
    tt.bodyFont          = { family:"'JetBrains Mono',monospace", size:11 };
    tt.titleColor        = light ? "#0b0e18" : "#e2e8f8";
    tt.bodyColor         = text2;
    tt.footerColor       = text3;
    tt.displayColors     = true;
    tt.boxWidth          = 8;
    tt.boxHeight         = 8;
    tt.boxPadding        = 4;
    tt.multiKeyBackground = "transparent";

    Chart.defaults.scale.grid.color        = grid;
    Chart.defaults.scale.grid.drawBorder   = false;
    Chart.defaults.scale.ticks.color       = text3;
    Chart.defaults.scale.ticks.padding     = 8;
  }

  function kill(id) {
    if (instances[id]) { try{instances[id].destroy();}catch(_){} delete instances[id]; }
  }
  function make(id, cfg) {
    kill(id);
    const el = document.getElementById(id);
    if (!el) return null;
    const c = new Chart(el, cfg);
    instances[id] = c;
    return c;
  }

  /* Colour helpers */
  function hexRgba(hex, a) {
    const h = hex.replace("#","");
    const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function mkGrad(ctx, col, alpha0=0.32, alpha1=0.0) {
    const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height * 0.85);
    g.addColorStop(0, hexRgba(col, alpha0));
    g.addColorStop(1, hexRgba(col, alpha1));
    return g;
  }

  /* Shared axis options */
  const xNoGrid = (extra={}) => ({
    grid:{display:false}, border:{display:false},
    ticks:{maxRotation:30, maxTicksLimit:14, ...extra.ticks}, ...extra
  });
  const yDashed = (extra={}) => ({
    grid:{color:Chart.defaults.scale.grid.color, drawTicks:false},
    border:{display:false, dash:[5,4]},
    ticks:{maxTicksLimit:6, ...extra.ticks}, ...extra
  });

  /* Nice number formatter for axis */
  function fmtNum(v) {
    if (Math.abs(v) >= 1e6)  return (v/1e6).toFixed(1)  + "M";
    if (Math.abs(v) >= 1e3)  return (v/1e3).toFixed(1)  + "K";
    if (Math.abs(v) % 1 !== 0) return v.toFixed(1);
    return String(v);
  }

  /* ── Line / timeseries ─────────────────────────────────── */
  function buildLine(spec, id) {
    const isTs   = spec.type === "timeseries";
    const labels = isTs
      ? (spec.datasets[0]?.data?.map(p => {
          // Format date strings nicely
          const d = new Date(p.x);
          return isNaN(d) ? p.x : d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
        }) ?? [])
      : (spec.labels ?? []);

    const datasets = spec.datasets.map((ds, i) => {
      const col  = ds.color || PAL[i % PAL.length];
      const data = isTs ? ds.data.map(p => p.y ?? null) : ds.data;
      const fill = i === 0 && datasets?.length <= 2;
      return {
        label: ds.label,
        data,
        borderColor: col,
        borderWidth: 2.5,
        tension: 0.44,
        pointRadius: 0,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "#060810",
        pointHoverBorderColor: col,
        pointHoverBorderWidth: 2.5,
        fill: fill,
        backgroundColor: ctx => fill ? mkGrad(ctx.chart.ctx, col, 0.28, 0) : "transparent",
      };
    });

    const multi = datasets.length > 1;
    make(id, {
      type:"line",
      data:{labels, datasets},
      options:{
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:"index", intersect:false},
        scales:{
          x: xNoGrid({ticks:{maxTicksLimit:10, maxRotation:0}}),
          y: yDashed({ticks:{callback: v => fmtNum(v)}}),
        },
        animation:{duration:1000, easing:"easeOutQuart"},
        plugins:{
          legend:{
            display:multi, position:"top",
            labels:{
              boxWidth:16, boxHeight:2, padding:20,
              color:Chart.defaults.color,
              usePointStyle:false,
            }
          },
          tooltip:{
            callbacks:{
              title: items => items[0].label,
              label: ctx => `  ${ctx.dataset.label}: ${fmtNum(ctx.parsed.y ?? 0)}`,
            }
          }
        },
      }
    });
  }

  /* ── Bar ──────────────────────────────────────────────── */
  function buildBar(spec, id) {
    const horiz  = !!spec.horizontal;
    const multi  = spec.datasets.length > 1;
    const colMap = spec.datasets.map((ds,i) => ds.color || PAL[i % PAL.length]);

    const datasets = spec.datasets.map((ds, i) => {
      const col = colMap[i];
      // Colour each bar individually when single dataset (rainbow histogram)
      const bgs = multi
        ? hexRgba(col, 0.72)
        : spec.labels.map((_, li) => hexRgba(PAL[li % PAL.length], 0.72));
      const hbgs = multi
        ? hexRgba(col, 0.95)
        : spec.labels.map((_, li) => hexRgba(PAL[li % PAL.length], 0.95));
      return {
        label: ds.label, data: ds.data,
        backgroundColor: bgs,
        hoverBackgroundColor: hbgs,
        borderRadius: horiz ? 5 : 7,
        borderSkipped: false,
        borderWidth: 0,
      };
    });

    make(id, {
      type:"bar",
      data:{labels:spec.labels, datasets},
      options:{
        indexAxis: horiz ? "y" : "x",
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:"index", intersect:false},
        scales: horiz
          ? { x:yDashed({ticks:{callback:v=>fmtNum(v)}}), y:xNoGrid({ticks:{font:{size:10},maxTicksLimit:20}}) }
          : { x:xNoGrid({ticks:{maxTicksLimit:16}}),        y:yDashed({ticks:{callback:v=>fmtNum(v)}}) },
        animation:{duration:900, easing:"easeOutQuart"},
        plugins:{
          legend:{
            display:multi, position:"top",
            labels:{boxWidth:12,boxHeight:12,padding:18,color:Chart.defaults.color}
          },
          tooltip:{
            callbacks:{
              label: ctx => `  ${ctx.dataset.label}: ${fmtNum(ctx.parsed[horiz?"x":"y"] ?? 0)}`
            }
          }
        },
      }
    });
  }

  /* ── Grouped bar ──────────────────────────────────────── */
  function buildGrouped(spec, id) {
    make(id, {
      type:"bar",
      data:{
        labels:spec.labels,
        datasets:spec.datasets.map((ds,i) => {
          const col = ds.color || PAL[i % PAL.length];
          return {
            label:ds.label, data:ds.data,
            backgroundColor:hexRgba(col,0.72),
            hoverBackgroundColor:hexRgba(col,0.95),
            borderRadius:6, borderSkipped:false, borderWidth:0,
          };
        }),
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:"index", intersect:false},
        scales:{
          x:xNoGrid({ticks:{maxRotation:30,maxTicksLimit:16}}),
          y:yDashed({ticks:{callback:v=>fmtNum(v)}}),
        },
        animation:{duration:900, easing:"easeOutQuart"},
        plugins:{
          legend:{display:true,position:"top",
            labels:{boxWidth:12,boxHeight:12,padding:18,color:Chart.defaults.color}},
          tooltip:{callbacks:{label:ctx=>`  ${ctx.dataset.label}: ${fmtNum(ctx.parsed.y??0)}`}}
        },
      }
    });
  }

  /* ── Stacked bar ──────────────────────────────────────── */
  function buildStacked(spec, id) {
    make(id, {
      type:"bar",
      data:{
        labels:spec.labels,
        datasets:spec.datasets.map((ds,i) => {
          const col = ds.color || PAL[i % PAL.length];
          return {
            label:ds.label, data:ds.data,
            backgroundColor:hexRgba(col,0.78),
            hoverBackgroundColor:hexRgba(col,1),
            borderWidth:0,
          };
        }),
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:"index", intersect:false},
        scales:{
          x:{stacked:true,...xNoGrid({ticks:{maxRotation:30}})},
          y:{stacked:true,...yDashed({ticks:{callback:v=>fmtNum(v)}})},
        },
        animation:{duration:900, easing:"easeOutQuart"},
        plugins:{
          legend:{display:true,position:"top",
            labels:{boxWidth:12,boxHeight:12,padding:18,color:Chart.defaults.color}},
        },
      }
    });
  }

  /* ── Donut ────────────────────────────────────────────── */
  function buildDonut(spec, id) {
    const n      = spec.labels?.length || 6;
    const colors = spec.datasets[0]?.colors || PAL.slice(0, n);
    const data   = spec.datasets[0]?.data || [];
    const total  = data.reduce((a,b)=>(a||0)+(b||0), 0);

    make(id, {
      type:"doughnut",
      data:{
        labels:spec.labels,
        datasets:[{
          data,
          backgroundColor: colors.map(c => hexRgba(c, 0.80)),
          hoverBackgroundColor: colors,
          borderColor: "transparent",
          borderWidth:0,
          hoverOffset: 12,
          spacing: 2,
        }],
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        cutout:"68%",
        animation:{animateRotate:true, duration:1100, easing:"easeOutQuart"},
        layout:{padding:{bottom:8}},
        plugins:{
          legend:{
            display:true, position:"bottom",
            labels:{
              boxWidth:9, boxHeight:9, padding:16,
              color:Chart.defaults.color,
              usePointStyle:true, pointStyleWidth:9,
              font:{size:11},
            }
          },
          tooltip:{
            callbacks:{
              label: ctx => {
                const pct = total ? ((ctx.parsed/total)*100).toFixed(1) : "0.0";
                return `  ${ctx.label}: ${Number(ctx.parsed).toLocaleString()} (${pct}%)`;
              }
            }
          }
        },
      }
    });
  }

  /* ── Scatter ──────────────────────────────────────────── */
  function buildScatter(spec, id) {
    const col = spec.datasets[0]?.color || PAL[2];
    make(id, {
      type:"scatter",
      data:{
        datasets:spec.datasets.map(ds => ({
          label:ds.label, data:ds.data,
          backgroundColor:hexRgba(col, 0.42),
          hoverBackgroundColor:hexRgba(col, 0.85),
          borderColor:hexRgba(col, 0.65),
          hoverBorderColor:col,
          borderWidth:1,
          pointRadius:4.5,
          pointHoverRadius:8,
          pointStyle:"circle",
        })),
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        scales:{
          x:{...yDashed(), title:{display:true, text:spec.xLabel||"X", color:Chart.defaults.color, font:{size:11,family:"'Syne',sans-serif",weight:"700"}, padding:{top:8}}},
          y:{...yDashed(), title:{display:true, text:spec.yLabel||"Y", color:Chart.defaults.color, font:{size:11,family:"'Syne',sans-serif",weight:"700"}}},
        },
        animation:{duration:1000},
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:ctx=>`  (${fmtNum(ctx.parsed.x)}, ${fmtNum(ctx.parsed.y)})`}}
        },
      }
    });
  }

  /* ── Heatmap ──────────────────────────────────────────── */
  function buildHeatmap(spec, id) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    const {labels, data:mat} = spec;
    const n  = labels.length;
    const cs = Math.min(52, Math.max(28, Math.floor(340/n)));
    const fs = Math.max(8, Math.floor(cs * 0.25));
    const light = document.body.classList.contains("light");

    let html = `<div class="hm-scroll"><div style="display:inline-flex;flex-direction:column;gap:3px">`;

    // Column labels
    html += `<div style="display:flex;gap:3px;margin-left:${cs+6}px">`;
    labels.forEach(l =>
      html += `<div class="hm-axis" style="width:${cs}px;text-align:center;font-size:${fs}px;opacity:.7" title="${l}">${l.slice(0,7)}</div>`
    );
    html += `</div>`;

    // Rows
    for (let r=0;r<n;r++) {
      html += `<div class="hm-row" style="gap:3px">`;
      html += `<div class="hm-axis" style="width:${cs}px;text-align:right;padding-right:6px;font-size:${fs}px;line-height:${cs}px;opacity:.7" title="${labels[r]}">${labels[r].slice(0,7)}</div>`;
      for (let c=0;c<n;c++) {
        const v   = mat[r][c] ?? 0;
        const abs = Math.abs(v);
        const a   = (abs * 0.9 + 0.05).toFixed(2);
        const bg  = v >= 0
          ? `rgba(206,255,69,${a})`
          : `rgba(255,68,102,${a})`;
        const fg = abs > 0.5 ? (light?"#0b0e18":"#060810") : (light?"#666":"#5e6a86");
        html += `<div class="hm-cell" title="${labels[r]} × ${labels[c]}: ${v.toFixed(3)}"
          style="width:${cs}px;height:${cs}px;background:${bg};color:${fg};font-size:${fs}px"
        >${v.toFixed(2)}</div>`;
      }
      html += `</div>`;
    }
    html += `</div></div>`;
    wrap.innerHTML = html;

    const tip = document.getElementById("tooltip");
    wrap.querySelectorAll(".hm-cell").forEach(cell => {
      cell.addEventListener("mouseenter", () => {if(tip){tip.textContent=cell.title;tip.classList.add("show");}});
      cell.addEventListener("mouseleave", () => tip?.classList.remove("show"));
      cell.addEventListener("mousemove",  e  => {if(tip){tip.style.left=(e.clientX+14)+"px";tip.style.top=(e.clientY-28)+"px";}});
    });
  }

  /* ── Render all ───────────────────────────────────────── */
  function renderAll(specs) {
    applyDefaults();
    const grid = document.getElementById("chartsGrid");
    const noC  = document.getElementById("noCharts");
    if (!grid) return;

    Object.keys(instances).forEach(k => kill(k));
    grid.innerHTML = "";

    if (!specs?.length) {
      if (noC) noC.style.display = "block";
      return;
    }
    if (noC) noC.style.display = "none";

    const typeLabel = {
      timeseries:"over time", bar:"by category", donut:"breakdown",
      scatter:"correlation", grouped_bar:"comparison",
      stacked_bar:"composition", heatmap:"all numeric columns",
      line:"trend over rows"
    };

    specs.forEach((spec, i) => {
      const domId  = `cc_${i}`;
      const isWide = spec.size === "wide";
      const isHeat = spec.type === "heatmap";
      const delay  = `s${Math.min(i+1,6)}`;
      const minH   = isWide ? 280 : 250;
      const sub    = typeLabel[spec.type] || "";

      const card = document.createElement("div");
      card.className = `c-card ${isWide?"span-12":"span-6"} ${delay}`;
      card.setAttribute("aria-label", spec.title);

      if (isHeat) {
        card.innerHTML = `
          <div class="c-head">
            <div class="c-title">${spec.title}</div>
            ${sub?`<div class="c-sub">${sub}</div>`:""}
          </div>
          <div id="${domId}"></div>`;
      } else {
        card.innerHTML = `
          <div class="c-head">
            <div class="c-title">${spec.title}</div>
            ${sub?`<div class="c-sub">${sub}</div>`:""}
          </div>
          <div class="canvas-wrap" style="min-height:${minH}px">
            <canvas id="${domId}" role="img" aria-label="${spec.title}"></canvas>
          </div>`;
      }

      grid.appendChild(card);

      setTimeout(() => {
        switch(spec.type) {
          case "line":
          case "timeseries":  buildLine(spec,domId);    break;
          case "bar":         buildBar(spec,domId);     break;
          case "grouped_bar": buildGrouped(spec,domId); break;
          case "stacked_bar": buildStacked(spec,domId); break;
          case "donut":       buildDonut(spec,domId);   break;
          case "scatter":     buildScatter(spec,domId); break;
          case "heatmap":     buildHeatmap(spec,domId); break;
        }
      }, i * 55);
    });
  }

  return { renderAll, applyDefaults };
})();
