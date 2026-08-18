(() => {
  if (window.CRS99) return;

  const SCHEMA = 1;
  const normalize = (value = "") => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  function idFrom(value = "") {
    let text = String(value || "");
    try {
      if (/^https?:/i.test(text)) text = new URL(text).pathname;
    } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");

    let match = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (match) return match[1];
    match = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (match) return match[1];
    match = text.match(/\/p\/(\d{4,})(?:\/|$)/i);
    if (match) return match[1];
    match = text.match(/(?:^|[-/])(\d{4,})$/);
    return match ? match[1] : "";
  }

  function sentText(text = "") {
    const value = normalize(text);
    return [
      "melhorar proposta",
      "editar proposta",
      "editar sua proposta",
      "cancelar proposta",
      "retirar proposta",
      "voce ja enviou uma proposta",
      "voce enviou uma proposta",
      "sua proposta foi enviada",
      "proposta enviada com sucesso"
    ].some((term) => value.includes(term));
  }

  function closedText(text = "") {
    const value = normalize(text);
    return [
      "projeto fechado",
      "projeto encerrado",
      "projeto em andamento",
      "projeto concluido",
      "projeto finalizado",
      "projeto cancelado",
      "nao esta recebendo propostas",
      "nao aceita mais propostas"
    ].some((term) => value.includes(term));
  }

  async function migrateOnce() {
    const data = await chrome.storage.local.get(null);
    if (data.crs99LeanSchema === SCHEMA) return;

    const jobs = {};
    const importJob = (rawId, status, source = {}) => {
      const id = idFrom(rawId || source.projectId || source.projectKey || source.url || "");
      if (!id || !["sent", "closed"].includes(status)) return;
      const previous = jobs[id];
      if (previous?.status === "sent") return;
      jobs[id] = {
        projectId: id,
        projectUrl: source.url || previous?.projectUrl || "",
        title: source.title || previous?.title || "",
        status,
        updatedAt: source.sentAt || source.seenAt || source.analyzedAt || new Date().toISOString()
      };
    };

    for (const [key, value] of Object.entries(data.crs99BlockedProjects || {})) {
      if (value?.status === "sent") importJob(key, "sent", value);
      if (["closed", "unavailable"].includes(value?.status)) importJob(key, "closed", value);
    }

    for (const item of Array.isArray(data.crs99History) ? data.crs99History : []) {
      if (item?.status === "sent") importJob(item.projectId || item.projectKey || item.url, "sent", item);
      if (["closed", "unavailable"].includes(item?.status)) importJob(item.projectId || item.projectKey || item.url, "closed", item);
    }

    const legacyKeys = Object.keys(data).filter((key) =>
      key.startsWith("crs99Plan:") ||
      [
        "crs99ActiveQueue",
        "crs99BlockedProjects",
        "crs99History",
        "crs99LastPreparedPlan",
        "crs99QueueSchema",
        "crs99SourceUrl",
        "crs99LastScanAt",
        "crs99TargetProjectId",
        "crs99TargetHref",
        "crs99TargetAt"
      ].includes(key)
    );

    await chrome.storage.local.set({ crs99LeanSchema: SCHEMA, crs99Jobs: jobs });
    if (legacyKeys.length) await chrome.storage.local.remove(legacyKeys);
  }

  async function getJobs() {
    const data = await chrome.storage.local.get("crs99Jobs");
    return data.crs99Jobs || {};
  }

  async function getJob(id) {
    const jobs = await getJobs();
    return jobs[String(id)] || null;
  }

  async function setJob(id, patch = {}) {
    const projectId = idFrom(id) || String(id || "");
    if (!/^\d{4,}$/.test(projectId)) return null;
    const jobs = await getJobs();
    const current = jobs[projectId] || { projectId, status: "new" };
    const next = {
      ...current,
      ...patch,
      projectId,
      updatedAt: new Date().toISOString()
    };
    jobs[projectId] = next;
    await chrome.storage.local.set({ crs99Jobs: jobs });
    return next;
  }

  async function markSent(id, extra = {}) {
    return setJob(id, { ...extra, status: "sent" });
  }

  async function markClosed(id, extra = {}) {
    return setJob(id, { ...extra, status: "closed" });
  }

  window.CRS99 = {
    SCHEMA,
    normalize,
    idFrom,
    sentText,
    closedText,
    migrateOnce,
    getJobs,
    getJob,
    setJob,
    markSent,
    markClosed
  };
})();