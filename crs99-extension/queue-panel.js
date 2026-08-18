(() => {
  if (window.__CRS99_QUEUE_PANEL__) return;
  window.__CRS99_QUEUE_PANEL__ = true;

  const normalize = (value = "") => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const HIDDEN = new Set(["sent", "sent_pending", "closed", "unavailable"]);

  function canonical(value = "") {
    let text = String(value || "");
    try { if (/^https?:/i.test(text)) text = new URL(text).pathname; } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    const bid = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (bid) return bid[1];
    const conv = text.match(/\/p\/(\d{4,})(?:\/|$)/i);
    if (conv) return conv[1];
    const project = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (project) return project[1];
    const suffix = text.match(/(?:^|[-/])(\d{4,})$/);
    return suffix ? suffix[1] : "";
  }

  const style = document.createElement("style");
  style.textContent = `
    #crs99-quick-queue{position:fixed;right:18px;bottom:18px;width:350px;max-height:72vh;z-index:2147483646;background:#101827;color:#fff;border-radius:14px;box-shadow:0 14px 38px rgba(0,0,0,.35);overflow:hidden;font-family:Arial,sans-serif}
    #crs99-quick-queue *{box-sizing:border-box}
    #crs99-quick-queue .qhead{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;border-bottom:1px solid rgba(255,255,255,.12);font-weight:800}
    #crs99-quick-queue .qcount{font-size:12px;opacity:.8}
    #crs99-quick-queue .qlist{padding:8px;overflow:auto;max-height:55vh}
    #crs99-quick-queue .qgo,#crs99-quick-queue .qrefresh{width:100%;border:0;border-radius:9px;cursor:pointer;font-weight:800}
    #crs99-quick-queue .qgo{display:block;text-align:left;margin:0 0 7px;padding:10px 11px;background:#11a8e5;color:#fff;font-size:12px;line-height:1.25}
    #crs99-quick-queue .qgo:hover{filter:brightness(1.08)}
    #crs99-quick-queue .qrefresh{margin:0 8px 8px;width:calc(100% - 16px);padding:9px;background:#e8eef5;color:#233044}
    #crs99-quick-queue .qrefresh[disabled]{opacity:.6;cursor:wait}
    #crs99-quick-queue .qempty{padding:18px 10px;text-align:center;font-size:12px;opacity:.8}
  `;
  document.documentElement.appendChild(style);

  const panel = document.createElement("aside");
  panel.id = "crs99-quick-queue";
  panel.innerHTML = `<div class="qhead"><span>CRS — Próximas</span><span class="qcount">0 novas</span></div><div class="qlist"></div><button type="button" class="qrefresh">Atualizar</button>`;
  document.documentElement.appendChild(panel);

  const list = panel.querySelector(".qlist");
  const count = panel.querySelector(".qcount");
  const refresh = panel.querySelector(".qrefresh");

  async function state() {
    const data = await chrome.storage.local.get(["crs99ActiveQueue", "crs99BlockedProjects", "crs99SourceUrl"]);
    const blocked = data.crs99BlockedProjects || {};
    const map = new Map();
    for (const item of (Array.isArray(data.crs99ActiveQueue) ? data.crs99ActiveQueue : [])) {
      const id = canonical(item?.key || item?.href || item?.url || "");
      if (!id || HIDDEN.has(blocked[id]?.status)) continue;
      const next = { ...item, key: id, projectId: id };
      const prev = map.get(id);
      if (!prev || Number(next.score || 0) >= Number(prev.score || 0)) map.set(id, next);
    }
    return { queue: [...map.values()], blocked, sourceUrl: data.crs99SourceUrl || "https://www.99freelas.com.br/projects" };
  }

  async function render() {
    const { queue } = await state();
    count.textContent = `${queue.length} novas`;
    list.innerHTML = "";
    if (!queue.length) {
      list.innerHTML = '<div class="qempty">Sem novas na fila.</div>';
      return;
    }
    queue.slice(0, 15).forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "qgo";
      const title = String(item.title || "Projeto").replace(/\s+/g, " ").trim();
      button.textContent = `${index + 1}. Enviar — ${title.length > 62 ? title.slice(0, 59) + "…" : title}`;
      button.title = title;
      button.addEventListener("click", async () => {
        const id = canonical(item.key || item.href);
        await chrome.storage.local.set({ crs99TargetProjectId: id, crs99TargetHref: item.href, crs99TargetAt: new Date().toISOString() });
        const url = new URL(item.href, location.origin);
        url.searchParams.set("crs99", "prepare");
        url.searchParams.set("crs99id", id);
        location.href = url.href;
      });
      list.appendChild(button);
    });
  }

  async function block(rawKey, status, extra = {}) {
    const id = canonical(rawKey || extra.url || "");
    if (!id) return;
    const data = await chrome.storage.local.get(["crs99BlockedProjects", "crs99ActiveQueue", "crs99History"]);
    const blocked = data.crs99BlockedProjects || {};
    const now = new Date().toISOString();
    blocked[id] = { ...(blocked[id] || {}), projectId: id, status, seenAt: now, ...extra };
    const queue = (Array.isArray(data.crs99ActiveQueue) ? data.crs99ActiveQueue : []).filter(x => canonical(x?.key || x?.href) !== id);
    const history = Array.isArray(data.crs99History) ? data.crs99History : [];
    const existing = history.find(x => canonical(x?.projectKey || x?.url) === id) || {};
    const entry = { ...existing, projectKey: id, projectId: id, status, ...(status === "sent" ? { sentAt: existing.sentAt || now } : {}) };
    await chrome.storage.local.set({ crs99BlockedProjects: blocked, crs99ActiveQueue: queue, crs99History: [entry, ...history.filter(x => canonical(x?.projectKey || x?.url) !== id)].slice(0, 400) });
  }

  function detectStatus(text) {
    const n = normalize(text);
    if (["voce ja enviou uma proposta", "voce enviou uma proposta", "sua proposta foi enviada", "editar sua proposta", "editar proposta", "retirar proposta"].some(t => n.includes(t))) return "sent";
    if (["projeto fechado", "projeto encerrado", "projeto em andamento", "projeto concluido", "projeto finalizado", "projeto cancelado", "nao esta recebendo propostas", "nao aceita mais propostas"].some(t => n.includes(t))) return "closed";
    return "";
  }

  function basicScore(text) {
    const n = normalize(text);
    let s = 3.6;
    const terms = ["excel","planilha","google sheets","csv","dashboard","automacao","pesquisa","dados","cadastro","site","landing page","wordpress","canva","word","pdf","revisao","copy","vsl","roteiro","seo","python","script","api","traducao","video","reels","candidatura"];
    for (const t of terms) if (n.includes(t)) s += .65;
    const m = n.match(/propostas?:\s*(\d+)/); const proposals = m ? Number(m[1]) : null;
    if (proposals != null) { if (proposals <= 3) s += 2; else if (proposals <= 10) s += 1.2; else if (proposals > 60) s -= 1; }
    return { score: Math.max(2, Math.min(10, Math.round(s * 10) / 10)), proposals };
  }

  function validProjectAnchor(a) {
    try {
      const url = new URL(a.getAttribute("href") || a.href, location.origin);
      return /^\/project\/(?!new(?:\/|$)|bid(?:\/|$))[^/?#]*\d{4,}\/?$/i.test(url.pathname);
    } catch { return false; }
  }

  async function fetchFreshFromSource(sourceUrl) {
    const response = await fetch(sourceUrl, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao atualizar projetos");
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const { blocked } = await state();
    const found = [];
    const seen = new Set();

    for (const a of [...doc.querySelectorAll('a[href*="/project/"]')].filter(validProjectAnchor)) {
      const href = new URL(a.getAttribute("href"), location.origin).href.split("#")[0];
      const id = canonical(href);
      if (!id || seen.has(id) || HIDDEN.has(blocked[id]?.status)) continue;
      const card = a.closest("article, li, .project, .project-item, .media, .card, .list-group-item, .box") || a.parentElement?.parentElement || a.parentElement;
      const title = (a.textContent || "").trim().replace(/\s+/g, " ");
      const text = (card?.textContent || title).replace(/\s+/g, " ").trim();
      if (title.length < 4 || text.length < 20) continue;
      const status = detectStatus(text);
      if (status) { await block(id, status, { url: href, reason: "source-card" }); continue; }
      const s = basicScore(text);
      found.push({ key: id, projectId: id, href, title, score: s.score, proposals: s.proposals, discoveredAt: new Date().toISOString(), seenAt: new Date().toISOString(), sourceUrl });
      seen.add(id);
    }

    const current = await chrome.storage.local.get("crs99ActiveQueue");
    const map = new Map();
    for (const item of (Array.isArray(current.crs99ActiveQueue) ? current.crs99ActiveQueue : [])) {
      const id = canonical(item?.key || item?.href);
      if (id && !HIDDEN.has(blocked[id]?.status)) map.set(id, { ...item, key: id, projectId: id });
    }
    found.forEach(x => map.set(x.key, { ...(map.get(x.key) || {}), ...x }));
    const merged = [...map.values()].sort((a,b) => b.score - a.score || (a.proposals ?? 999) - (b.proposals ?? 999)).slice(0, 80);
    await chrome.storage.local.set({ crs99ActiveQueue: merged, crs99LastScanAt: new Date().toISOString() });
  }

  async function validateKnown() {
    const { queue } = await state();
    for (const item of queue.slice(0, 30)) {
      try {
        const res = await fetch(item.href, { credentials: "include", cache: "no-store" });
        if (!res.ok) continue;
        const html = await res.text();
        const status = detectStatus(html);
        if (status) await block(item.key, status, { url: item.href, reason: "refresh-check" });
      } catch {}
    }
  }

  async function reconcileCurrentPage() {
    const id = canonical(location.pathname);
    if (!id) return;
    const text = document.body?.innerText || "";
    let status = detectStatus(text);
    if (/^\/p\/\d+/i.test(location.pathname)) {
      const n = normalize(text);
      if (["enviada pelo sistema", "enviei uma proposta", "detalhes da proposta"].some(t => n.includes(t))) status = "sent";
    }
    if (status) await block(id, status, { url: location.href, reason: "current-page" });
  }

  async function refreshQueue() {
    refresh.disabled = true;
    refresh.textContent = "Atualizando…";
    try {
      await reconcileCurrentPage();
      const { sourceUrl } = await state();
      if (/^\/projects(?:\/|$)/i.test(location.pathname)) {
        window.dispatchEvent(new CustomEvent("crs99:rescan"));
        await new Promise(r => setTimeout(r, 600));
      }
      await fetchFreshFromSource(sourceUrl);
      await validateKnown();
      await reconcileCurrentPage();
      await render();
    } catch {
      await render();
    } finally {
      refresh.disabled = false;
      refresh.textContent = "Atualizar";
    }
  }

  refresh.addEventListener("click", () => refreshQueue());
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.crs99ActiveQueue || changes.crs99BlockedProjects)) render().catch(() => {});
  });
  window.addEventListener("crs99:queue-updated", () => render().catch(() => {}));
  window.addEventListener("pageshow", () => reconcileCurrentPage().then(render).catch(() => render()));
  reconcileCurrentPage().then(render).catch(() => render());
})();