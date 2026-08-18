(() => {
  if (window.__CRS99_QUEUE_PANEL__) return;
  window.__CRS99_QUEUE_PANEL__ = true;

  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const keyFrom = (href) => {
    try { return new URL(href, location.origin).pathname.replace(/^\/project\//, "").replace(/\/+$/, "").split("/")[0]; }
    catch { return ""; }
  };

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
    const data = await chrome.storage.local.get(["crs99ActiveQueue","crs99BlockedProjects","crs99SourceUrl"]);
    const blocked = data.crs99BlockedProjects || {};
    const queue = (Array.isArray(data.crs99ActiveQueue) ? data.crs99ActiveQueue : []).filter(x => x?.key && !blocked[x.key] && !["sent","sent_pending","closed","unavailable"].includes(blocked[x.key]?.status));
    return { queue, blocked, sourceUrl: data.crs99SourceUrl || "https://www.99freelas.com.br/projects" };
  }

  async function render() {
    const { queue } = await state();
    count.textContent = `${queue.length} novas`;
    list.innerHTML = "";
    if (!queue.length) {
      list.innerHTML = '<div class="qempty">Sem novas na fila.</div>';
      return;
    }
    queue.slice(0, 12).forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "qgo";
      const title = String(item.title || "Projeto").replace(/\s+/g, " ").trim();
      button.textContent = `${index + 1}. Enviar — ${title.length > 58 ? title.slice(0,55) + "…" : title}`;
      button.title = title;
      button.addEventListener("click", () => {
        const url = new URL(item.href, location.origin);
        url.searchParams.set("crs99", "prepare");
        location.href = url.href;
      });
      list.appendChild(button);
    });
  }

  async function block(key, status, extra = {}) {
    if (!key) return;
    const data = await chrome.storage.local.get(["crs99BlockedProjects","crs99ActiveQueue"]);
    const blocked = data.crs99BlockedProjects || {};
    blocked[key] = { ...(blocked[key] || {}), status, seenAt:new Date().toISOString(), ...extra };
    const queue = (Array.isArray(data.crs99ActiveQueue) ? data.crs99ActiveQueue : []).filter(x => x.key !== key);
    await chrome.storage.local.set({ crs99BlockedProjects: blocked, crs99ActiveQueue: queue });
  }

  function detectStatus(text) {
    const n = normalize(text);
    const sent = ["voce ja enviou uma proposta","voce enviou uma proposta","editar proposta","editar sua proposta","retirar proposta","sua proposta foi enviada"].some(t => n.includes(t));
    if (sent) return "sent";
    const closed = ["projeto fechado","projeto encerrado","projeto em andamento","projeto concluido","projeto finalizado","projeto cancelado","nao esta recebendo propostas"].some(t => n.includes(t));
    if (closed) return "closed";
    return "";
  }

  function basicScore(text) {
    const n = normalize(text);
    let s = 3.6;
    const terms = ["excel","planilha","google sheets","csv","dashboard","automacao","pesquisa","dados","cadastro","site","landing page","wordpress","canva","word","pdf","revisao","copy","vsl","roteiro","seo","python","script","api","traducao","video","reels","candidatura"];
    for (const t of terms) if (n.includes(t)) s += .65;
    const m = n.match(/propostas?:\s*(\d+)/); const proposals = m ? Number(m[1]) : null;
    if (proposals != null) { if (proposals <= 3) s += 2; else if (proposals <= 10) s += 1.2; else if (proposals > 60) s -= 1; }
    return { score:Math.max(2,Math.min(10,Math.round(s*10)/10)), proposals };
  }

  async function fetchFreshFromSource(sourceUrl) {
    const response = await fetch(sourceUrl, { credentials:"include", cache:"no-store" });
    if (!response.ok) throw new Error("Falha ao atualizar projetos");
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html,"text/html");
    const { blocked } = await state();
    const found = [];
    const seen = new Set();
    for (const a of [...doc.querySelectorAll('a[href*="/project/"]')]) {
      const href = new URL(a.getAttribute("href"), location.origin).href.split("#")[0];
      if (/\/project\/(?:new|bid)\//.test(href)) continue;
      const key = keyFrom(href);
      if (!key || seen.has(key) || blocked[key]) continue;
      const card = a.closest("article, li, .project, .project-item, .media, .card, .list-group-item, .box") || a.parentElement?.parentElement || a.parentElement;
      const title = (a.textContent || "").trim().replace(/\s+/g," ");
      const text = (card?.textContent || title).replace(/\s+/g," ").trim();
      if (title.length < 4 || text.length < 20) continue;
      const s = basicScore(text);
      found.push({ key, href, title, score:s.score, proposals:s.proposals, discoveredAt:new Date().toISOString(), seenAt:new Date().toISOString(), sourceUrl });
      seen.add(key);
    }
    const current = await chrome.storage.local.get("crs99ActiveQueue");
    const map = new Map((Array.isArray(current.crs99ActiveQueue) ? current.crs99ActiveQueue : []).map(x => [x.key,x]));
    found.forEach(x => map.set(x.key, { ...(map.get(x.key)||{}), ...x }));
    const merged = [...map.values()].filter(x => !blocked[x.key]).sort((a,b)=>b.score-a.score || (a.proposals??999)-(b.proposals??999)).slice(0,60);
    await chrome.storage.local.set({ crs99ActiveQueue:merged, crs99LastScanAt:new Date().toISOString() });
  }

  async function validateKnown() {
    const { queue } = await state();
    for (const item of queue.slice(0, 20)) {
      try {
        const res = await fetch(item.href, { credentials:"include", cache:"no-store" });
        if (!res.ok) continue;
        const text = await res.text();
        const status = detectStatus(text);
        if (status) await block(item.key, status, { url:item.href, reason:"refresh-check" });
      } catch {}
    }
  }

  async function refreshQueue() {
    refresh.disabled = true;
    refresh.textContent = "Atualizando…";
    try {
      if (/\/projects\/?$/.test(location.pathname) || location.pathname.startsWith("/projects")) {
        window.dispatchEvent(new CustomEvent("crs99:rescan"));
        await new Promise(r => setTimeout(r, 700));
      } else {
        const { sourceUrl } = await state();
        await fetchFreshFromSource(sourceUrl);
      }
      await validateKnown();
      await render();
    } finally {
      refresh.disabled = false;
      refresh.textContent = "Atualizar";
    }
  }

  async function reconcileConversationPage() {
    if (!/^\/p\//.test(location.pathname)) return;
    const body = normalize(document.body?.innerText || "");
    if (!body.includes("enviada pelo sistema") && !body.includes("enviei uma proposta") && !body.includes("proposta de r$")) return;
    const { queue } = await state();
    let best = null;
    for (const item of queue) {
      const words = normalize(item.title).split(" ").filter(w => w.length >= 5);
      if (!words.length) continue;
      const hits = words.filter(w => body.includes(w)).length;
      const ratio = hits / words.length;
      if (!best || ratio > best.ratio) best = { item, ratio };
    }
    if (best?.ratio >= .55) await block(best.item.key, "sent", { reason:"proposal-conversation-detected", url:location.href });
  }

  refresh.addEventListener("click", () => refreshQueue().catch(() => render()));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.crs99ActiveQueue || changes.crs99BlockedProjects)) render().catch(() => {});
  });
  window.addEventListener("crs99:queue-updated", () => render().catch(() => {}));
  window.addEventListener("pageshow", () => { reconcileConversationPage().then(render).catch(() => {}); });
  reconcileConversationPage().then(render).catch(() => render());
})();