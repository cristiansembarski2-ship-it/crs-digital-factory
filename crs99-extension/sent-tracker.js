(() => {
  if (window.__CRS99_SENT_TRACKER__) return;
  window.__CRS99_SENT_TRACKER__ = true;

  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const path = location.pathname.replace(/\/+$/, "");
  const projectKey = path.replace(/^\/project\/bid\//, "").replace(/^\/project\//, "").split("/")[0];
  const isBidPage = /\/project\/bid\//.test(path);
  if (!projectKey) return;

  let marked = false;
  const pendingKey = `crs99PendingSend:${projectKey}`;

  function officialSubmitIn(root = document) {
    return [...root.querySelectorAll('button, input[type="submit"]')].find((el) => {
      const text = normalize(el.textContent || el.value || "");
      return text.includes("enviar proposta") || text.includes("fazer proposta");
    }) || null;
  }

  function pageConfirmsSent() {
    const text = normalize(document.body?.innerText || "");
    return [
      "proposta enviada com sucesso",
      "sua proposta foi enviada",
      "voce enviou uma proposta",
      "voce ja enviou uma proposta",
      "proposta ja enviada",
      "editar sua proposta"
    ].some((term) => text.includes(term));
  }

  function showPending() {
    const panel = document.querySelector("#crs99-copilot");
    const message = panel?.querySelector(".crs99-message");
    if (message) message.textContent = "Envio solicitado. Aguardando confirmação do 99Freelas antes de retirar da fila.";
  }

  async function rememberSent(reason = "confirmed") {
    if (marked || !chrome?.storage?.local) return;
    marked = true;
    sessionStorage.removeItem(pendingKey);

    const now = new Date().toISOString();
    const result = await chrome.storage.local.get(["crs99BlockedProjects", "crs99History"]);
    const blocked = result?.crs99BlockedProjects || {};
    blocked[projectKey] = { status: "sent", sentAt: now, seenAt: now, reason, url: location.href.split("#")[0] };

    const history = Array.isArray(result?.crs99History) ? result.crs99History : [];
    const existing = history.find((item) => item.projectKey === projectKey) || {};
    const entry = { ...existing, projectKey, url: existing.url || location.href.split("?")[0].split("#")[0], status: "sent", sentAt: now };
    const nextHistory = [entry, ...history.filter((item) => item.projectKey !== projectKey)].slice(0, 300);
    await chrome.storage.local.set({ crs99BlockedProjects: blocked, crs99History: nextHistory });

    const panel = document.querySelector("#crs99-copilot");
    if (panel) {
      const status = panel.querySelector(".crs99-status");
      const message = panel.querySelector(".crs99-message");
      if (status) status.innerHTML = '<span class="crs99-badge good">ENVIADA</span> Confirmada pelo 99Freelas e removida da fila de novas.';
      if (message) message.textContent = "Proposta confirmada como enviada. Este projeto não volta para a fila ativa.";
    }
  }

  if (pageConfirmsSent()) rememberSent("page-confirmation").catch(() => {});

  document.addEventListener("submit", (event) => {
    if (!isBidPage) return;
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    const submit = officialSubmitIn(form) || officialSubmitIn(document);
    if (!submit) return;
    sessionStorage.setItem(pendingKey, new Date().toISOString());
    showPending();
    setTimeout(() => {
      if (pageConfirmsSent()) rememberSent("post-submit-confirmation").catch(() => {});
    }, 800);
  }, true);

  const observer = new MutationObserver(() => {
    if (!marked && pageConfirmsSent()) rememberSent("ajax-confirmation").catch(() => {});
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
})();