(() => {
  if (window.__CRS99_SENT_TRACKER__) return;
  window.__CRS99_SENT_TRACKER__ = true;

  const normalize = (value = "") => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  function canonical(value = "") {
    let text = String(value || "");
    try { if (/^https?:/i.test(text)) text = new URL(text).pathname; } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    const bid = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (bid) return bid[1];
    const project = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (project) return project[1];
    const suffix = text.match(/(?:^|[-/])(\d{4,})$/);
    return suffix ? suffix[1] : "";
  }

  const projectId = canonical(location.pathname);
  const isBidPage = /\/project\/bid\//i.test(location.pathname);
  if (!projectId) return;
  let confirmed = false;

  function officialSubmitIn(root = document) {
    return [...root.querySelectorAll('button, input[type="submit"]')].find((el) => {
      const text = normalize(el.textContent || el.value || "");
      return text === "enviar proposta" || text.includes("enviar proposta") || text.includes("fazer proposta");
    }) || null;
  }

  function pageConfirmsSent() {
    const text = normalize(document.body?.innerText || "");
    return ["proposta enviada com sucesso", "sua proposta foi enviada", "voce enviou uma proposta", "voce ja enviou uma proposta", "editar sua proposta", "editar proposta", "retirar proposta"].some(t => text.includes(t));
  }

  async function remember(status, reason) {
    if (!chrome?.storage?.local) return;
    const now = new Date().toISOString();
    const result = await chrome.storage.local.get(["crs99BlockedProjects", "crs99History", "crs99ActiveQueue"]);
    const blocked = result.crs99BlockedProjects || {};
    blocked[projectId] = { ...(blocked[projectId] || {}), projectId, status, seenAt: now, ...(status === "sent" ? { sentAt: blocked[projectId]?.sentAt || now } : {}), reason, url: location.href.split("#")[0] };

    const history = Array.isArray(result.crs99History) ? result.crs99History : [];
    const existing = history.find(x => String(x.projectKey || x.projectId) === projectId) || {};
    const entry = { ...existing, projectKey: projectId, projectId, status, ...(status === "sent" ? { sentAt: existing.sentAt || now } : {}) };
    const active = (Array.isArray(result.crs99ActiveQueue) ? result.crs99ActiveQueue : []).filter(x => String(x.key || x.projectId) !== projectId && canonical(x.href || "") !== projectId);
    await chrome.storage.local.set({ crs99BlockedProjects: blocked, crs99History: [entry, ...history.filter(x => String(x.projectKey || x.projectId) !== projectId)].slice(0, 400), crs99ActiveQueue: active });
  }

  async function markPending(reason) {
    if (confirmed) return;
    await remember("sent_pending", reason);
  }

  async function markSent(reason) {
    if (confirmed) return;
    confirmed = true;
    await remember("sent", reason);
  }

  if (pageConfirmsSent()) markSent("page-confirmation").catch(() => {});

  document.addEventListener("submit", (event) => {
    if (!isBidPage) return;
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form || (!officialSubmitIn(form) && !officialSubmitIn(document))) return;
    markPending("human-submit").catch(() => {});
    setTimeout(() => { if (pageConfirmsSent()) markSent("post-submit-confirmation").catch(() => {}); }, 700);
  }, true);

  document.addEventListener("click", (event) => {
    if (!isBidPage) return;
    const target = event.target instanceof Element ? event.target.closest('button, input[type="submit"]') : null;
    if (!target) return;
    const text = normalize(target.textContent || target.value || "");
    if (!text.includes("enviar proposta") && !text.includes("fazer proposta")) return;
    markPending("human-submit-click").catch(() => {});
    setTimeout(() => { if (pageConfirmsSent()) markSent("click-confirmation").catch(() => {}); }, 800);
  }, true);

  new MutationObserver(() => {
    if (!confirmed && pageConfirmsSent()) markSent("ajax-confirmation").catch(() => {});
  }).observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
})();