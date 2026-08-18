(() => {
  if (window.__CRS99_SCANNER_V021__) return;
  window.__CRS99_SCANNER_V021__ = true;

  const normalize = (value = "") => String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const positives = {
    "excel": 2.0, "google sheets": 2.0, "planilha": 1.5, "csv": 1.5, "dashboard": 1.4,
    "automacao": 1.8, "automatizar": 1.8, "estoque": 1.6, "compras": 1.6, "fornecedor": 1.4,
    "pesquisa": 1.2, "leads": 1.2, "landing page": 1.4, "html": 1.0, "css": 1.0, "javascript": 1.0,
    "powerpoint": 1.2, "canva": 1.0, "apresentacao": 1.0, "word": 0.9, "pdf": 0.8,
    "copy": 0.9, "descricao de produto": 1.0, "python": 1.2, "script": 1.0, "traducao": 0.8, "espanhol": 0.8
  };

  const negatives = {
    "trafego pago": 2.0, "gestor de trafego": 2.0, "atendimento integral": 2.5, "segunda a sabado": 1.5,
    "presencial": 3.0, "arquitetura": 2.5, "engenheiro": 1.5, "advogado": 1.0, "contador": 1.5,
    "woocommerce": 1.8, "wordpress": 1.0, "erp completo": 3.0, "aplicativo mobile": 2.0, "full stack": 1.8,
    "experiencia comprovada": 1.2, "portfolio obrigatorio": 1.8
  };

  let queueMap = new Map();
  let lastQueueFetch = 0;
  let lastUrl = location.href;
  let lastSignature = "";
  let scanTimer = null;

  function getQueue() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CRS99_GET_QUEUE" }, (response) => {
        if (chrome.runtime.lastError) return resolve(null);
        resolve(response?.ok ? response.data : null);
      });
    });
  }

  async function refreshQueue(force = false) {
    if (!force && Date.now() - lastQueueFetch < 60000) return;
    const queue = await getQueue();
    if (queue?.opportunities) {
      queueMap = new Map(queue.opportunities.map((item) => [item.projectKey, item]));
      lastQueueFetch = Date.now();
    }
  }

  function projectKeyFromUrl(href) {
    try {
      const path = new URL(href, location.origin).pathname.replace(/\/+$/, "");
      return path.replace(/^\/project\//, "").split("/")[0];
    } catch {
      return "";
    }
  }

  function isBlockedByQueue(key) {
    const item = queueMap.get(key);
    if (!item) return false;
    if (item.status === "sent" || item.status === "closed") return true;
    if (item.status === "exclusive") {
      const until = item.reopenAt ? Date.parse(item.reopenAt) : NaN;
      return Number.isFinite(until) ? Date.now() < until : true;
    }
    return false;
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1 && el.getClientRects().length > 0;
  }

  function cardFor(a) {
    const direct = a.closest('article, li, .project, .project-item, .media, .card, .list-group-item, .box, .project-row, [class*="project-item"], [class*="project-row"]');
    if (direct && isVisible(direct)) return direct;

    let node = a.parentElement;
    for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
      const text = (node.innerText || "").trim();
      if (isVisible(node) && text.length >= 80 && text.length <= 2500) return node;
    }
    return a.parentElement;
  }

  function scoreText(text) {
    const n = normalize(text);
    let score = 3.0;
    const hits = [];

    for (const [term, weight] of Object.entries(positives)) {
      if (n.includes(term)) { score += weight; hits.push(term); }
    }
    for (const [term, weight] of Object.entries(negatives)) {
      if (n.includes(term)) score -= weight;
    }

    if (n.includes("projeto exclusivo") || n.includes("exclusivo para")) score -= 3.0;

    const proposalMatch = n.match(/propostas?:\s*(\d+)/);
    const proposals = proposalMatch ? Number(proposalMatch[1]) : null;
    if (proposals != null) {
      if (proposals <= 5) score += 1.5;
      else if (proposals <= 15) score += 0.8;
      else if (proposals >= 80) score -= 1.2;
      else if (proposals >= 40) score -= 0.6;
    }

    return {
      score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
      proposals,
      hits: [...new Set(hits)].slice(0, 4)
    };
  }

  function collectItems() {
    const links = [...document.querySelectorAll('a[href*="/project/"]')]
      .filter((a) => isVisible(a))
      .filter((a) => !/\/project\/(new|bid)\//.test(a.getAttribute("href") || ""))
      .filter((a) => !/\/project\/new/.test(a.getAttribute("href") || ""));

    const seen = new Set();
    const items = [];
    let skippedKnown = 0;

    for (const a of links) {
      const href = new URL(a.href, location.origin).href;
      if (seen.has(href)) continue;

      const key = projectKeyFromUrl(href);
      if (!key) continue;
      seen.add(href);

      if (isBlockedByQueue(key)) {
        skippedKnown += 1;
        continue;
      }

      const card = cardFor(a);
      if (!card || !isVisible(card)) continue;
      const text = (card.innerText || a.textContent || "").trim();
      if (text.length < 40) continue;

      const title = (a.textContent || "").trim().replace(/\s+/g, " ");
      if (!title || title.length < 5) continue;

      const data = scoreText(text);
      items.push({ href, key, title, text, ...data });
    }

    items.sort((a, b) => b.score - a.score || (a.proposals ?? 999) - (b.proposals ?? 999));
    return { items, skippedKnown };
  }

  function render(items, skippedKnown) {
    document.getElementById("crs99-live-scanner")?.remove();

    const strong = items.filter((i) => i.score >= 6.5);
    const chosen = strong.length >= 3
      ? strong.slice(0, 8)
      : items.slice(0, Math.min(8, Math.max(3, items.length)));

    const panel = document.createElement("aside");
    panel.id = "crs99-live-scanner";
    panel.innerHTML = `
      <div class="crs99s-head"><strong>CRS 99 — Radar ao vivo</strong><span>${items.length} projetos úteis</span></div>
      <div class="crs99s-body">
        <div class="crs99s-note">Ranking somente dos projetos visíveis nesta página. ${skippedKnown ? `${skippedKnown} já enviados/fechados/exclusivos foram pulados.` : "A confirmação final acontece ao abrir o projeto."}</div>
        <div class="crs99s-list"></div>
        <button class="crs99s-refresh" type="button">Reanalisar página</button>
      </div>`;

    document.documentElement.appendChild(panel);
    const list = panel.querySelector(".crs99s-list");

    if (!chosen.length) {
      list.innerHTML = '<div class="crs99s-empty">Nenhum projeto utilizável foi detectado nesta página.</div>';
    } else {
      chosen.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "crs99s-item";
        const belowCut = item.score < 6.5 ? " · abaixo do corte principal" : "";
        row.innerHTML = `
          <div class="crs99s-rank">#${index + 1} · ${item.score.toFixed(1)}/10${item.proposals != null ? ` · ${item.proposals} propostas` : ""}${belowCut}</div>
          <div class="crs99s-title"></div>
          <div class="crs99s-tags">${item.hits.length ? item.hits.join(" · ") : "aderência geral"}</div>
          <button type="button">Abrir projeto</button>`;
        row.querySelector(".crs99s-title").textContent = item.title;
        row.querySelector("button").addEventListener("click", () => { location.href = item.href; });
        list.appendChild(row);
      });
    }

    panel.querySelector(".crs99s-refresh").addEventListener("click", () => scheduleScan(true, 50));
  }

  async function runScan(forceQueue = false) {
    await refreshQueue(forceQueue);
    const { items, skippedKnown } = collectItems();
    render(items, skippedKnown);
    lastUrl = location.href;
    lastSignature = items.map((i) => i.key).join("|");
  }

  function scheduleScan(forceQueue = false, delay = 350) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => runScan(forceQueue), delay);
  }

  const observer = new MutationObserver(() => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      const visibleKeys = [...document.querySelectorAll('a[href*="/project/"]')]
        .filter(isVisible)
        .map((a) => projectKeyFromUrl(a.href))
        .filter(Boolean)
        .join("|");
      if (location.href !== lastUrl || visibleKeys !== lastSignature) runScan(false);
    }, 500);
  });

  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

  setInterval(() => {
    if (location.href !== lastUrl) scheduleScan(false, 100);
  }, 1000);

  runScan(true);
})();
