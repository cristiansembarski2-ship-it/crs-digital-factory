(() => {
  if (window.__CRS99_SMART_FILTER__) return;
  window.__CRS99_SMART_FILTER__ = true;

  const QUEUE_URL = "/crs99/opportunities.json";
  const STATUS_URL = "/api/crs99-status";
  const CHECK_TTL = 5 * 60 * 1000;
  const cache = new Map();
  let queueById = new Map();
  let running = false;
  let timer = 0;

  const normalize = (v = "") => String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  function projectId(value = "") {
    let s = String(value || "");
    try { if (/^https?:/i.test(s)) s = new URL(s).pathname; } catch {}
    s = s.replace(/[?#].*$/, "").replace(/\/+$/, "");
    let m = s.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (m) return m[1];
    m = s.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (m) return m[1];
    m = s.match(/(?:^|[-/])(\d{4,})$/);
    return m ? m[1] : "";
  }

  function preferenceScore(text = "") {
    const t = normalize(text);
    if (/\b(video|videos|reels|ugc|capcut|gravacao|gravar|filmagem|camera|motion|after effects|premiere)\b/.test(t)) return -1000;
    if (/\b(site|sites|wordpress|elementor|landing page|landing pages|blog|web design|pagina web|woocommerce|loja virtual)\b/.test(t)) return 100;
    if (/\b(excel|planilha|planilhas|google sheets|sheets|dashboard|formulario|pontuacao|estoque|orcamento|custos|preco de venda|financeir|csv|vba|power query)\b/.test(t)) return 98;
    if (/\b(automacao|automatizar|dados|data entry|digitacao|pesquisa|revisao|formatacao|traducao|seo|google ads|administrativ|cadastro de produtos|python|javascript)\b/.test(t)) return 78;
    if (/\b(canva|apresentacao|slides|cartilha|material institucional|design|artes|copy|roteiro|texto|conteudo)\b/.test(t)) return 55;
    if (/\b(prospeccao|sdr|bdr|trafego|social media|redes sociais)\b/.test(t)) return 25;
    return 10;
  }

  async function loadQueue(force = false) {
    if (queueById.size && !force) return;
    try {
      const res = await fetch(`${QUEUE_URL}?smart=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      queueById = new Map((data.opportunities || []).map(item => [projectId(item.url || item.projectKey), item]));
    } catch {}
  }

  async function isAvailable(item) {
    const url = item?.url;
    if (!url) return false;
    const hit = cache.get(url);
    if (hit && Date.now() - hit.ts < CHECK_TTL) return hit.available;
    try {
      const res = await fetch(`${STATUS_URL}?url=${encodeURIComponent(url)}&t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      const available = Boolean(data && data.ok && data.available);
      cache.set(url, { available, ts: Date.now(), reason: data?.reason || "" });
      return available;
    } catch {
      cache.set(url, { available: false, ts: Date.now(), reason: "check-error" });
      return false;
    }
  }

  async function mapLimit(items, limit, fn) {
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        await fn(items[index], index);
      }
    });
    await Promise.all(workers);
  }

  function setPill(text, tone = "neutral") {
    const pill = document.getElementById("syncPill");
    if (!pill) return;
    pill.textContent = text;
    pill.className = `pill ${tone}`;
  }

  function showAllCards() {
    document.querySelectorAll("article.job").forEach(card => {
      card.hidden = false;
      card.style.removeProperty("display");
    });
  }

  async function apply() {
    if (running) return;
    const list = document.getElementById("list");
    const filter = document.getElementById("statusFilter");
    const count = document.getElementById("countText");
    if (!list || !filter || !count) return;

    const smartMode = ["active", "candidate", "prepared"].includes(filter.value);
    if (!smartMode) {
      showAllCards();
      return;
    }

    running = true;
    try {
      await loadQueue();
      const cards = [...list.querySelectorAll("article.job")];
      if (!cards.length) return;

      setPill("Validando disponíveis…", "neutral");
      cards.forEach(card => { card.hidden = true; });

      const candidates = cards.map(card => {
        const id = String(card.dataset.projectId || "");
        const item = queueById.get(id);
        const title = card.querySelector(".job-title")?.textContent || item?.title || "";
        const risk = card.querySelector(".job-risk")?.textContent || item?.risk || "";
        return { card, item, score: preferenceScore(`${title} ${risk}`) };
      }).filter(x => x.item && x.score > 0 && !["sent", "closed", "unavailable"].includes(x.item.status));

      const confirmed = [];
      await mapLimit(candidates, 4, async entry => {
        if (await isAvailable(entry.item)) confirmed.push(entry);
      });

      confirmed.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const fitDiff = Number(b.item.fit || 0) - Number(a.item.fit || 0);
        if (fitDiff) return fitDiff;
        return projectId(b.item.url) - projectId(a.item.url);
      });

      for (const entry of confirmed) {
        entry.card.hidden = false;
        list.appendChild(entry.card);
      }

      count.textContent = `${confirmed.length} ${confirmed.length === 1 ? "projeto disponível" : "projetos disponíveis"}`;
      setPill("Só disponíveis", "good");
      const empty = document.getElementById("emptyState");
      if (empty) empty.classList.toggle("hidden", confirmed.length !== 0);
    } finally {
      running = false;
    }
  }

  function schedule(delay = 160) {
    clearTimeout(timer);
    timer = setTimeout(apply, delay);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const filter = document.getElementById("statusFilter");
    const search = document.getElementById("searchInput");
    const refresh = document.getElementById("refreshBtn");
    const list = document.getElementById("list");

    filter?.addEventListener("change", () => schedule(80));
    search?.addEventListener("input", () => schedule(120));
    refresh?.addEventListener("click", () => {
      cache.clear();
      queueById.clear();
      setTimeout(() => schedule(50), 300);
    }, true);

    if (list) {
      new MutationObserver(() => {
        if (!running) schedule(180);
      }).observe(list, { childList: true });
    }

    schedule(300);
  });
})();
