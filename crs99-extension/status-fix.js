(() => {
  const normalize = (value = "") => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const unavailableLabels = new Set([
    "em andamento",
    "projeto em andamento",
    "concluido",
    "projeto concluido",
    "finalizado",
    "projeto finalizado",
    "cancelado",
    "projeto cancelado",
    "encerrado",
    "projeto encerrado"
  ]);

  function projectKeyFromLocation() {
    const path = location.pathname.replace(/\/+$/, "");
    return path
      .replace(/^\/project\/bid\//, "")
      .replace(/^\/project\//, "")
      .split("/")[0];
  }

  function detectUnavailable() {
    const candidates = [...document.querySelectorAll("button, a, span, strong, .btn, .label, .badge")];
    for (const el of candidates) {
      const text = normalize(el.textContent || "");
      if (unavailableLabels.has(text)) return text;
    }
    return "";
  }

  async function rememberBlocked(projectKey, label) {
    if (!projectKey || !chrome?.storage?.local) return;
    const current = await chrome.storage.local.get("crs99BlockedProjects");
    const blocked = current?.crs99BlockedProjects || {};
    blocked[projectKey] = {
      status: label || "indisponivel",
      seenAt: new Date().toISOString(),
      url: location.href.split("#")[0]
    };
    await chrome.storage.local.set({ crs99BlockedProjects: blocked });
  }

  function updatePanel(label) {
    const panel = document.querySelector("#crs99-copilot");
    if (!panel) return;

    const status = panel.querySelector(".crs99-status");
    const main = panel.querySelector(".crs99-main");
    const version = panel.querySelector(".crs99-head span");

    if (version) version.textContent = "v0.4.0 · Premium Autopilot";
    if (status) {
      status.innerHTML = '<span class="crs99-badge danger">INDISPONÍVEL</span> Projeto já está em andamento/encerrado.';
    }
    if (main) {
      main.disabled = true;
      main.textContent = "Projeto indisponível";
    }
  }

  const label = detectUnavailable();
  if (!label) return;

  const key = projectKeyFromLocation();
  updatePanel(label);
  rememberBlocked(key, label).catch(() => {});
})();