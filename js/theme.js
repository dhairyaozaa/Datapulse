const Theme = (() => {
  function apply(light) {
    document.body.classList.toggle("light", light);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = light ? "◐" : "◑";
    localStorage.setItem("dp-theme", light ? "light" : "dark");
  }
  function init() {
    const saved       = localStorage.getItem("dp-theme");
    const preferLight = window.matchMedia?.("(prefers-color-scheme:light)").matches;
    apply(saved === "light" || (!saved && preferLight));
    document.getElementById("themeToggle")?.addEventListener("click", () =>
      apply(!document.body.classList.contains("light"))
    );
  }
  return { init };
})();
