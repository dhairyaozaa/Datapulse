const API = (() => {
  async function checkHealth() {
    const dot   = document.getElementById("apiDot");
    const label = document.getElementById("apiLabel");
    try {
      const r = await fetch(`${CONFIG.API_BASE}/health`, {
        signal: AbortSignal.timeout(5000),
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (r.ok) {
        if (dot)   dot.className    = "api-dot ok";
        if (label) label.textContent = "backend live";
        return true;
      }
    } catch (_) {}
    if (dot)   dot.className    = "api-dot err";
    if (label) label.textContent = "backend offline";
    return false;
  }

  async function upload(file, onProgress) {
    const form = new FormData();
    form.append("file", file);
    onProgress(8, "Uploading…");

    let pct = 8;
    const tick = setInterval(() => {
      if (pct < 72) { pct += Math.random() * 7; onProgress(pct, "Analysing…"); }
    }, 350);

    let resp;
    try {
      resp = await fetch(`${CONFIG.API_BASE}/upload`, {
        method: "POST",
        body: form,
        headers: { "ngrok-skip-browser-warning": "true" },
      });
    } catch (e) {
      clearInterval(tick);
      throw new Error("Cannot reach backend. Run: npm run dev  (and ngrok if on GitHub Pages)");
    }

    clearInterval(tick);
    onProgress(90, "Building charts…");

    if (!resp.ok) {
      let msg = `Server error (${resp.status})`;
      try { const j = await resp.json(); msg = j.error || j.detail || msg; } catch (_) {}
      throw new Error(msg);
    }

    const data = await resp.json();
    onProgress(100, "Done! Building dashboard…");
    return data;
  }

  return { checkHealth, upload };
})();
