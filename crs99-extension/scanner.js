(async () => {
  if (window.__CRS99_SCANNER__) return;
  window.__CRS99_SCANNER__ = true;

  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const positives = {
    "excel":2,"google sheets":2,"planilha":1.7,"csv":1.5,"dashboard":1.4,"automacao":1.8,"automatizar":1.8,"estoque":1.5,
    "pesquisa":1.3,"levantamento":1.2,"lista":.8,"dados":.7,"data entry":1,"cadastro":.9,"digitacao":.9,"transcricao":.9,
    "landing page":1.5,"pagina de vendas":1.4,"site":.7,"html":1,"css":1,"javascript":1,"wordpress":.8,"elementor":.8,
    "powerpoint":1.2,"canva":1.1,"apresentacao":1.1,"design":.7,"word":.9,"pdf":.8,"formatacao":1,"revisao":1,"apa":1,"abnt":1,
    "copy":1,"vsl":1.1,"redacao":.9,"roteiro":1,"seo":.7,"python":1.2,"script":1.1,"web scraping":1,"api":.7,
    "traducao":1,"espanhol":.9,"ingles":.6,"video":.7,"reels":.8,"edicao":.7,"social media":.6,"candidatura":.9,"buscar vagas":1
  };
  const unavailable = ["projeto em andamento","projeto fechado","encerrado","finalizado","concluido","cancelado"];

  function keyFrom(href) {
    try { return new URL(href, location.origin).pathname.replace(/^\/project\//, "").replace(/\/+$/, "").split("/")[0]; }
    catch { return ""; }
  }
  function visible(el) {
    if (!el?.isConnected) return false;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
  }
  function cardFor(a) {
    return a.closest("article, li, .project, .project-item, .media, .card, .list-group-item, .box") || a.parentElement?.parentElement || a.parentElement;
  }
  function score(text) {
    const n = normalize(text);
    let value = 3.6;
    for (const [term, weight] of Object.entries(positives)) if (n.includes(term)) value += weight;
    if (n.includes("projeto exclusivo") || n.includes("exclusivo para")) value += 1.4;
    const m = n.match(/propostas?:\s*(\d+)/);
    const proposals = m ? Number(m[1]) : null;
    if (proposals != null) {
      if (proposals <= 3) value += 2.3; else if (proposals <= 7) value += 1.8; else if (proposals <= 15) value += 1.2;
      else if (proposals <= 30) value += .3; else if (proposals > 60) value -= 1;
    }
    if (/publicado hoje|publicada hoje|ha \d+ minutos|há \d+ minutos/.test(n)) value += .8;
    return { score: Math.max(0, Math.min(10, Math.round(value * 10) / 10)), proposals };
  }

  async function scan() {
    const stored = await chrome.storage.local.get(["crs99BlockedProjects", "crs99ActiveQueue"]);
    const blocked = stored.crs99BlockedProjects || {};
    const previous = Array.isArray(stored.crs99ActiveQueue) ? stored.crs99ActiveQueue : [];
    const now = Date.now();
    const freshPrevious = previous.filter(x => now - new Date(x.discoveredAt || 0).getTime() < 48 * 3600 * 1000 && !blocked[x.key]);
    const map = new Map(freshPrevious.map(x => [x.key, x]));

    const links = [...document.querySelectorAll('a[href*="/project/"]')]
      .filter(visible)
      .filter(a => !/\/project\/(?:new|bid)\//.test(a.getAttribute("href") || ""));

    for (const a of links) {
      const href = new URL(a.href, location.origin).href.split("#")[0];
      const key = keyFrom(href);
      if (!key || blocked[key]) continue;
      const card = cardFor(a);
      if (!card || !visible(card)) continue;
      const text = (card.innerText || a.textContent || "").trim();
      const n = normalize(text);
      if (text.length < 25 || unavailable.some(t => n.includes(t))) continue;
      const title = (a.textContent || "").trim().replace(/\s+/g, " ");
      if (!title || title.length < 4) continue;
      const s = score(text);
      if (s.score < 2) continue;
      map.set(key, {
        key, href, title, score: s.score, proposals: s.proposals,
        discoveredAt: map.get(key)?.discoveredAt || new Date().toISOString(),
        seenAt: new Date().toISOString(), sourceUrl: location.href
      });
    }

    const queue = [...map.values()]
      .filter(x => !blocked[x.key])
      .sort((a,b) => b.score - a.score || (a.proposals ?? 999) - (b.proposals ?? 999))
      .slice(0, 60);

    await chrome.storage.local.set({ crs99ActiveQueue: queue, crs99SourceUrl: location.href, crs99LastScanAt: new Date().toISOString() });
    window.dispatchEvent(new CustomEvent("crs99:queue-updated"));
  }

  let timer;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => scan().catch(() => {}), 250); };
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((m) => {
      const target = m.target instanceof Element ? m.target : null;
      if (target?.closest?.("#crs99-quick-queue")) return false;
      return [...m.addedNodes].some((node) => node instanceof Element && !node.closest?.("#crs99-quick-queue") && node.id !== "crs99-quick-queue");
    });
    if (relevant) schedule();
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  window.addEventListener("crs99:rescan", schedule);
  scan().catch(() => {});
})();