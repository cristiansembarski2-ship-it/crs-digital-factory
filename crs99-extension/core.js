(() => {
  if (window.CRS99) return;

  const SCHEMA = 2;
  const normalize = (value = "") => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function idFrom(value = "") {
    let text = String(value || "");
    try { if (/^https?:/i.test(text)) text = new URL(text).pathname; } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    let m = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i); if (m) return m[1];
    m = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i); if (m) return m[1];
    m = text.match(/\/p\/(\d{4,})(?:\/|$)/i); if (m) return m[1];
    m = text.match(/(?:^|[-/])(\d{4,})$/); return m ? m[1] : "";
  }

  function sentText(text = "") {
    const v = normalize(text);
    return [
      "melhorar proposta", "editar proposta", "editar sua proposta", "cancelar proposta",
      "retirar proposta", "voce ja enviou uma proposta", "voce enviou uma proposta",
      "sua proposta foi enviada", "proposta enviada com sucesso"
    ].some((term) => v.includes(normalize(term)));
  }

  function closedText(text = "") {
    const v = normalize(text);
    return [
      "projeto fechado", "projeto encerrado", "projeto em andamento", "projeto concluido",
      "projeto finalizado", "projeto cancelado", "nao esta recebendo propostas", "nao aceita mais propostas"
    ].some((term) => v.includes(normalize(term)));
  }

  function titleSimilarity(a = "", b = "") {
    const A = normalize(a);
    const B = normalize(b);
    if (!A || !B) return 0;
    if (A === B || A.includes(B) || B.includes(A)) return 1;
    const stop = new Set(["de","da","do","das","dos","e","em","para","com","a","o","um","uma","no","na","nos","nas"]);
    const sa = new Set(A.split(" ").filter((x) => x.length > 2 && !stop.has(x)));
    const sb = new Set(B.split(" ").filter((x) => x.length > 2 && !stop.has(x)));
    if (!sa.size || !sb.size) return 0;
    let common = 0;
    for (const x of sa) if (sb.has(x)) common++;
    return common / Math.max(sa.size, sb.size);
  }

  async function migrateOnce() {
    const data = await chrome.storage.local.get(null);
    if (data.crs99LeanSchema === SCHEMA) return;

    const jobs = {};
    const keep = (rawId, source = {}) => {
      const id = idFrom(rawId || source.projectId || source.projectKey || source.projectUrl || source.url || "");
      if (!id) return;
      const status = source.status;
      if (!["sent", "closed"].includes(status)) return;
      if (jobs[id]?.status === "sent") return;
      jobs[id] = {
        projectId: id,
        projectUrl: source.projectUrl || source.url || "",
        title: source.title || "",
        status,
        updatedAt: source.sentAt || source.updatedAt || source.seenAt || new Date().toISOString()
      };
    };

    for (const [id, job] of Object.entries(data.crs99Jobs || {})) keep(id, job);
    for (const [key, value] of Object.entries(data.crs99BlockedProjects || {})) {
      if (value?.status === "sent") keep(key, { ...value, status: "sent" });
      if (["closed", "unavailable"].includes(value?.status)) keep(key, { ...value, status: "closed" });
    }
    for (const item of Array.isArray(data.crs99History) ? data.crs99History : []) {
      if (item?.status === "sent") keep(item.projectId || item.projectKey || item.url, { ...item, status: "sent" });
      if (["closed", "unavailable"].includes(item?.status)) keep(item.projectId || item.projectKey || item.url, { ...item, status: "closed" });
    }

    const removeKeys = Object.keys(data).filter((key) =>
      key.startsWith("crs99Plan:") ||
      [
        "crs99ActiveQueue", "crs99BlockedProjects", "crs99History", "crs99LastPreparedPlan",
        "crs99QueueSchema", "crs99SourceUrl", "crs99LastScanAt", "crs99TargetProjectId",
        "crs99TargetHref", "crs99TargetAt", "crs99PendingId"
      ].includes(key)
    );

    await chrome.storage.local.set({ crs99LeanSchema: SCHEMA, crs99Jobs: jobs });
    if (removeKeys.length) await chrome.storage.local.remove(removeKeys);
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
    const next = { ...current, ...patch, projectId, updatedAt: new Date().toISOString() };
    jobs[projectId] = next;
    await chrome.storage.local.set({ crs99Jobs: jobs });
    return next;
  }

  const markSent = (id, extra = {}) => setJob(id, { ...extra, status: "sent" });
  const markClosed = (id, extra = {}) => setJob(id, { ...extra, status: "closed" });

  window.CRS99 = {
    SCHEMA, normalize, idFrom, sentText, closedText, titleSimilarity,
    migrateOnce, getJobs, getJob, setJob, markSent, markClosed
  };
})();