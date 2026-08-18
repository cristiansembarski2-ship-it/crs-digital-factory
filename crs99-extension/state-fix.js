(() => {
  if (window.__CRS99_STATE_FIX__) return;
  window.__CRS99_STATE_FIX__ = true;

  const HIDDEN = new Set(["sent", "sent_pending", "closed", "unavailable"]);
  let migrating = false;
  let lastSignature = "";

  function canonical(value = "") {
    let text = String(value || "");
    try { if (/^https?:/i.test(text)) text = new URL(text).pathname; } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    const bid = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (bid) return bid[1];
    const conversation = text.match(/\/p\/(\d{4,})(?:\/|$)/i);
    if (conversation) return conversation[1];
    const project = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (project) return project[1];
    const suffix = text.match(/(?:^|[-/])(\d{4,})$/);
    return suffix ? suffix[1] : "";
  }

  function statusRank(status = "") {
    return ({ sent: 5, sent_pending: 4, closed: 3, unavailable: 2, analyzed: 1 })[status] || 0;
  }

  async function migrate() {
    if (migrating || !chrome?.storage?.local) return;
    migrating = true;
    try {
      const all = await chrome.storage.local.get(null);
      const blockedOld = all.crs99BlockedProjects || {};
      const blocked = {};
      for (const [rawKey, value] of Object.entries(blockedOld)) {
        const id = canonical(rawKey || value?.url || "");
        if (!id) continue;
        const prev = blocked[id];
        if (!prev || statusRank(value?.status) >= statusRank(prev?.status)) blocked[id] = { ...prev, ...value, projectId: id };
      }

      const queueMap = new Map();
      for (const item of (Array.isArray(all.crs99ActiveQueue) ? all.crs99ActiveQueue : [])) {
        const id = canonical(item?.key || item?.href || item?.url || "");
        if (!id || HIDDEN.has(blocked[id]?.status)) continue;
        const next = { ...item, key: id, projectId: id };
        const prev = queueMap.get(id);
        if (!prev || Number(next.score || 0) >= Number(prev.score || 0)) queueMap.set(id, next);
      }
      const queue = [...queueMap.values()].slice(0, 80);

      const historyMap = new Map();
      for (const item of (Array.isArray(all.crs99History) ? all.crs99History : [])) {
        const id = canonical(item?.projectKey || item?.projectId || item?.url || "");
        if (!id) continue;
        const next = { ...item, projectKey: id, projectId: id };
        const prev = historyMap.get(id);
        const nextTime = new Date(next.sentAt || next.analyzedAt || 0).getTime();
        const prevTime = new Date(prev?.sentAt || prev?.analyzedAt || 0).getTime();
        if (!prev || nextTime >= prevTime) historyMap.set(id, next);
      }
      const history = [...historyMap.values()].slice(0, 400);

      const writes = { crs99BlockedProjects: blocked, crs99ActiveQueue: queue, crs99History: history };
      const removals = [];
      const planSignature = [];
      for (const [key, value] of Object.entries(all)) {
        if (!key.startsWith("crs99Plan:")) continue;
        const raw = key.slice("crs99Plan:".length);
        const id = canonical(raw || value?.projectKey || value?.sourceUrl || "");
        if (!id) continue;
        const canonicalKey = `crs99Plan:${id}`;
        const plan = { ...value, projectKey: id, projectId: id };
        planSignature.push([canonicalKey, plan.generatedAt || ""]);
        if (!all[canonicalKey] || key === canonicalKey) writes[canonicalKey] = plan;
        else {
          const a = new Date(value?.generatedAt || 0).getTime();
          const b = new Date(all[canonicalKey]?.generatedAt || 0).getTime();
          if (a > b) writes[canonicalKey] = plan;
        }
        if (key !== canonicalKey) removals.push(key);
      }

      const signature = JSON.stringify({ blocked, queue, history, planSignature: planSignature.sort() });
      if (signature === lastSignature && removals.length === 0) return;
      lastSignature = signature;
      await chrome.storage.local.set(writes);
      if (removals.length) await chrome.storage.local.remove([...new Set(removals)]);
    } finally {
      migrating = false;
    }
  }

  async function markCurrentSent() {
    const id = canonical(location.pathname);
    if (!id) return;
    const body = (document.body?.innerText || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
    const conversation = /^\/p\/\d+/i.test(location.pathname);
    const confirms = ["voce ja enviou uma proposta", "voce enviou uma proposta", "sua proposta foi enviada", "editar sua proposta", "editar proposta", "retirar proposta"].some(t => body.includes(t));
    const conversationConfirms = conversation && ["enviada pelo sistema", "enviei uma proposta", "detalhes da proposta"].some(t => body.includes(t));
    if (!confirms && !conversationConfirms) return;

    const data = await chrome.storage.local.get(["crs99BlockedProjects", "crs99ActiveQueue", "crs99History"]);
    const blocked = data.crs99BlockedProjects || {};
    if (blocked[id]?.status === "sent") return;
    const now = new Date().toISOString();
    blocked[id] = { ...(blocked[id] || {}), projectId: id, status: "sent", seenAt: now, sentAt: blocked[id]?.sentAt || now, reason: "page-reconciliation", url: location.href };
    const queue = (Array.isArray(data.crs99ActiveQueue) ? data.crs99ActiveQueue : []).filter(x => canonical(x?.key || x?.href) !== id);
    const history = Array.isArray(data.crs99History) ? data.crs99History : [];
    const existing = history.find(x => canonical(x?.projectKey || x?.url) === id) || {};
    const entry = { ...existing, projectKey: id, projectId: id, status: "sent", sentAt: existing.sentAt || now, url: existing.url || location.href };
    await chrome.storage.local.set({ crs99BlockedProjects: blocked, crs99ActiveQueue: queue, crs99History: [entry, ...history.filter(x => canonical(x?.projectKey || x?.url) !== id)].slice(0, 400) });
  }

  let migrateTimer;
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== "local" || migrating) return;
    clearTimeout(migrateTimer);
    migrateTimer = setTimeout(() => migrate().catch(() => {}), 120);
  });

  let sentTimer;
  const scheduleSentCheck = () => {
    clearTimeout(sentTimer);
    sentTimer = setTimeout(() => markCurrentSent().catch(() => {}), 180);
  };

  migrate().then(markCurrentSent).catch(() => {});
  window.addEventListener("pageshow", () => { migrate().then(markCurrentSent).catch(() => {}); });
  new MutationObserver(scheduleSentCheck).observe(document.body || document.documentElement, { childList: true, subtree: true });
})();