(() => {
  if (window.__CRS99_SCANNER_SYNC__) return;
  window.__CRS99_SCANNER_SYNC__ = true;

  async function syncHidden() {
    if (!chrome?.storage?.local) return;
    const result = await chrome.storage.local.get("crs99BlockedProjects");
    const blocked = result?.crs99BlockedProjects || {};
    const hiddenKeys = new Set(Object.entries(blocked)
      .filter(([, value]) => ["sent", "closed", "unavailable"].includes(value?.status))
      .map(([key]) => key));

    document.querySelectorAll("#crs99-live-scanner .crs99s-item[data-project-key]").forEach((row) => {
      if (hiddenKeys.has(row.dataset.projectKey)) row.remove();
    });

    document.querySelectorAll(".crs99-inline-prepare[data-project-key]").forEach((button) => {
      if (hiddenKeys.has(button.dataset.projectKey)) button.remove();
    });

    const list = document.querySelector("#crs99-live-scanner .crs99s-list");
    const count = document.querySelector("#crs99-live-scanner .crs99s-head span");
    if (list && !list.querySelector(".crs99s-item")) {
      list.innerHTML = '<div class="crs99s-empty">Sem novas oportunidades entre os projetos carregados. Continue descendo ou vá para a próxima página.</div>';
    }
    if (count) {
      const visible = document.querySelectorAll("#crs99-live-scanner .crs99s-item[data-project-key]").length;
      count.textContent = `${visible} novas na janela`;
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.crs99BlockedProjects) syncHidden().catch(() => {});
  });

  window.addEventListener("pageshow", () => syncHidden().catch(() => {}));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncHidden().catch(() => {});
  });

  setInterval(() => syncHidden().catch(() => {}), 1500);
  syncHidden().catch(() => {});
})();