(() => {
  if (window.__CRS99_SENT_TRACKER__) return;
  window.__CRS99_SENT_TRACKER__ = true;

  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const path = location.pathname.replace(/\/+$/, "");
  const projectKey = path.replace(/^\/project\/bid\//, "").replace(/^\/project\//, "").split("/")[0];
  const isBidPage = /\/project\/bid\//.test(path);
  if (!projectKey) return;

  let marked = false;

  function officialSubmitIn(root = document) {
    return [...root.querySelectorAll('button, input[type="submit"]')].find((el) => {
      const text = normalize(el.textContent || el.value || "");
      return text.includes("enviar proposta") || text.includes("fazer proposta");
    }) || null;
  }

  function pageConfirmsSent() {
    const text = normalize(document.body?.innerText || "");
    return ["proposta enviada com sucesso","sua proposta foi enviada","voce enviou uma proposta","voce ja enviou uma proposta","editar sua proposta","editar proposta"].some(t => text.includes(t));
  }

  async function rememberSent(reason = "human-submit") {
    if (marked || !chrome?.storage?.local) return;
    marked = true;
    const now = new Date().toISOString();
    const result = await chrome.storage.local.get(["crs99BlockedProjects","crs99History","crs99ActiveQueue"]);
    const blocked = result.crs99BlockedProjects || {};
    blocked[projectKey] = { ...(blocked[projectKey] || {}), status:"sent", sentAt:now, seenAt:now, reason, url:location.href.split("#")[0] };

    const history = Array.isArray(result.crs99History) ? result.crs99History : [];
    const existing = history.find(x => x.projectKey === projectKey) || {};
    const entry = { ...existing, projectKey, status:"sent", sentAt:now, url:existing.url || location.href.split("?")[0].split("#")[0] };
    const nextHistory = [entry, ...history.filter(x => x.projectKey !== projectKey)].slice(0,300);
    const active = (Array.isArray(result.crs99ActiveQueue) ? result.crs99ActiveQueue : []).filter(x => x.key !== projectKey);
    await chrome.storage.local.set({ crs99BlockedProjects:blocked, crs99History:nextHistory, crs99ActiveQueue:active });
  }

  if (pageConfirmsSent()) rememberSent("page-confirmation").catch(() => {});

  document.addEventListener("submit", (event) => {
    if (!isBidPage) return;
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form || !officialSubmitIn(form) && !officialSubmitIn(document)) return;
    rememberSent("human-submit").catch(() => {});
  }, true);

  document.addEventListener("click", (event) => {
    if (!isBidPage) return;
    const target = event.target instanceof Element ? event.target.closest('button, input[type="submit"]') : null;
    if (!target) return;
    const text = normalize(target.textContent || target.value || "");
    if (!text.includes("enviar proposta") && !text.includes("fazer proposta")) return;
    setTimeout(() => rememberSent("human-submit-click").catch(() => {}), 100);
  }, true);

  new MutationObserver(() => {
    if (!marked && pageConfirmsSent()) rememberSent("ajax-confirmation").catch(() => {});
  }).observe(document.body || document.documentElement, { childList:true, subtree:true, characterData:true });
})();