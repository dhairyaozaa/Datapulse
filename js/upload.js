const Upload = (() => {
  const ACCEPTED = [".csv",".xlsx",".xls",".json",".pdf",".txt",".doc",".docx"];
  let _onSuccess = null;
  let _busy = false;

  function panel(id) {
    ["panelIdle","panelLoading","panelError"].forEach(p => {
      const el = document.getElementById(p);
      if (!el) return;
      el.style.display = p === id ? "flex" : "none";
    });
  }

  function setProgress(pct, msg) {
    const fill = document.getElementById("progFill");
    const lbl  = document.getElementById("loadingMsg");
    const pct2 = document.getElementById("progPct");
    const p    = Math.min(Math.round(pct), 100);
    if (fill) fill.style.width = p + "%";
    if (lbl)  lbl.textContent  = msg;
    if (pct2) pct2.textContent = p + "%";
    const pw = document.querySelector(".prog-wrap");
    if (pw)   pw.setAttribute("aria-valuenow", String(p));
  }

  function validate(file) {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext))
      return `"${ext}" not supported. Use: ${ACCEPTED.join(", ")}`;
    if (file.size > CONFIG.MAX_FILE_MB * 1024 * 1024)
      return `File too large (max ${CONFIG.MAX_FILE_MB} MB).`;
    return null;
  }

  async function handle(file) {
    if (!file || _busy) return;
    _busy = true;

    const err = validate(file);
    if (err) {
      document.getElementById("errorMsg").textContent = err;
      panel("panelError");
      _busy = false;
      return;
    }

    panel("panelLoading");
    setProgress(5, "Reading file…");

    try {
      const data = await API.upload(file, (pct, msg) => setProgress(pct, msg));
      setProgress(100, "Done! Building dashboard…");
      await new Promise(r => setTimeout(r, 500));
      panel("panelIdle");
      setProgress(0, "");
      if (_onSuccess) _onSuccess(data, file.name);
    } catch (e) {
      document.getElementById("errorMsg").textContent = e.message;
      panel("panelError");
    } finally {
      _busy = false;
    }
  }

  function init(onSuccess) {
    _onSuccess = onSuccess;
    panel("panelIdle"); // ensure correct initial state

    const zone   = document.getElementById("dropZone");
    const input  = document.getElementById("fileInput");
    const browse = document.getElementById("browseBtn");
    const retry  = document.getElementById("retryBtn");

    browse?.addEventListener("click",  e => { e.stopPropagation(); input?.click(); });
    zone?.addEventListener("click",    e => { if (e.target !== input) input?.click(); });
    zone?.addEventListener("keydown",  e => { if (e.key==="Enter"||e.key===" "){e.preventDefault();input?.click();} });
    input?.addEventListener("change",  () => { const f=input.files?.[0]; input.value=""; handle(f); });

    zone?.addEventListener("dragenter", e => { e.preventDefault(); zone.classList.add("drag-over"); });
    zone?.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("drag-over"); });
    zone?.addEventListener("dragleave", e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("drag-over"); });
    zone?.addEventListener("drop",      e => { e.preventDefault(); zone.classList.remove("drag-over"); handle(e.dataTransfer?.files?.[0]); });

    retry?.addEventListener("click", () => panel("panelIdle"));
  }

  return { init };
})();
