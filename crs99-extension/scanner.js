(async () => {
  if (window.__CRS99_SCANNER__) return;
  window.__CRS99_SCANNER__ = true;

  const PREMIUM_MODE = true;
  const initialUrl = location.href;
  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  function getQueue() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CRS99_GET_QUEUE" }, (response) => {
        if (chrome.runtime.lastError) return resolve(null);
        resolve(response?.ok ? response.data : null);
      });
    });
  }

  function getLocalBlocked() {
    return new Promise((resolve) => {
      chrome.storage.local.get("crs99BlockedProjects", (result) => {
        if (chrome.runtime.lastError) return resolve({});
        resolve(result?.crs99BlockedProjects || {});
      });
    });
  }

  function projectKeyFromUrl(href) {
    try {
      const path = new URL(href, location.origin).pathname.replace(/\/+$/, "");
      return path.replace(/^\/project\//, "").split("/")[0];
    } catch {
      return "";
    }
  }

  const [queue, localBlocked] = await Promise.all([getQueue(), getLocalBlocked()]);
  const queueMap = new Map((queue?.opportunities || []).map((item) => [item.projectKey, item]));

  function isBlockedByQueue(key) {
    if (localBlocked?.[key]) return true;
    const item = queueMap.get(key);
    return !!item && ["sent", "closed", "unavailable"].includes(item.status);
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  const positives = {
    "excel": 2.0, "google sheets": 2.0, "planilha": 1.7, "csv": 1.5, "dashboard": 1.4,
    "automacao": 1.8, "automatizar": 1.8, "estoque": 1.5, "compras": 1.5, "fornecedor": 1.3,
    "pesquisa": 1.3, "levantamento": 1.2, "lista": 0.8, "dados": 0.7, "data entry": 1.0,
    "cadastro": 0.9, "digitacao": 0.9, "transcricao": 0.9, "organizar": 0.8, "limpeza de dados": 1.2,
    "landing page": 1.5, "pagina de vendas": 1.4, "site": 0.7, "html": 1.0, "css": 1.0, "javascript": 1.0,
    "wordpress": 0.8, "elementor": 0.8, "loja virtual": 0.6, "catalogo": 0.8, "produto": 0.5,
    "powerpoint": 1.2, "canva": 1.1, "apresentacao": 1.1, "design": 0.7, "criativo": 0.8,
    "word": 0.9, "pdf": 0.8, "formatacao": 1.0, "revisao": 1.0, "correcao": 0.9, "apa": 1.0, "abnt": 1.0,
    "copy": 1.0, "vsl": 1.1, "redacao": 0.9, "roteiro": 1.0, "descricao de produto": 1.0, "seo": 0.7,
    "python": 1.2, "script": 1.1, "web scraping": 1.0, "api": 0.7,
    "traducao": 1.0, "espanhol": 0.9, "ingles": 0.6,
    "video": 0.7, "reels": 0.8, "edicao": 0.7, "social media": 0.6,
    "curriculo": 0.8, "buscar vagas": 1.0, "candidatura": 0.9
  };

  // No modo validação, dificuldade não elimina. Só incompatibilidades reais pesam forte.
  const negatives = {
    "presencial obrigatorio": 4.0, "trabalho presencial": 3.0,
    "responsavel tecnico": 3.5, "crc obrigatorio": 3.5, "oab obrigatoria": 3.5,
    "crea obrigatorio": 3.5, "crm obrigatorio": 3.5,
    "segunda a sabado em horario fixo": 1.5, "atendimento integral": 1.4
  };

  const unavailableTerms = ["em andamento", "projeto em andamento", "projeto fechado", "encerrado", "finalizado", "concluido", "cancelado"];
  const exclusiveTerms = ["projeto exclusivo", "exclusivo para", "exclusivo temporariamente"];

  function cardFor(a) {
    return a.closest('article, li, .project, .project-item, .media, .card, .list-group-item, .box') || a.parentElement?.parentElement || a.parentElement;
  }

  function scoreText(text) {
    const n = normalize(text);
    let score = 3.6;
    const hits = [];

    for (const [term, weight] of Object.entries(positives)) {
      if (n.includes(term)) {
        score += weight;
        hits.push(term);
      }
    }
    for (const [term, weight] of Object.entries(negatives)) {
      if (n.includes(term)) score -= weight;
    }

    const exclusive = exclusiveTerms.some(term => n.includes(term));
    if (exclusive) score += PREMIUM_MODE ? 1.4 : -3.0;
    if (unavailableTerms.some(term => n.includes(term))) score = 0;

    const proposalMatch = n.match(/propostas?:\s*(\d+)/);
    const proposals = proposalMatch ? Number(proposalMatch[1]) : null;
    if (proposals != null) {
      if (proposals <= 3) score += 2.3;
      else if (proposals <= 7) score += 1.8;
      else if (proposals <= 15) score += 1.2;
      else if (proposals <= 30) score += 0.3;
      else if (proposals <= 60) score -= 0.5;
      else score -= 1.0;
    }

    if (/publicado hoje|publicada hoje|hoje[,\s]/.test(n)) score += 0.8;
    if (/ha \d+ minutos|há \d+ minutos/.test(n)) score += 0.8;

    return {
      score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
      proposals,
      exclusive,
      hits: [...new Set(hits)].slice(0, 5)
    };
  }

  function openPrepared(href) {
    const url = new URL(href, location.origin);
    url.searchParams.set("crs99", "prepare");
    location.href = url.href;
  }

  function addInlinePrepareButton(card, item) {
    if (!card || !item?.key || item.score < 2.0) return;
    if (card.querySelector(`.crs99-inline-prepare[data-project-key="${CSS.escape(item.key)}"]`)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "crs99-inline-prepare";
    button.dataset.projectKey = item.key;
    button.textContent = item.score >= 6.5 ? "CRS: Preparar proposta" : "CRS: Analisar oportunidade";
    button.title = "Abre o projeto para análise completa. Dificuldade sozinha não elimina a vaga.";
    button.style.cssText = "margin:8px 0 4px;padding:7px 11px;border:0;border-radius:7px;font-weight:700;cursor:pointer;background:#2563eb;color:#fff;font-size:12px;line-height:1.2;position:relative;z-index:20;";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPrepared(item.href);
    });
    card.appendChild(button);
  }

  function collectItems() {
    const links = [...document.querySelectorAll('a[href*="/project/"]')]
      .filter(a => isVisible(a))
      .filter(a => !/\/project\/(new|bid)\//.test(a.getAttribute("href") || "") && !/\/project\/new/.test(a.getAttribute("href") || ""));

    const byHref = new Map();
    let skippedKnown = 0;

    for (const a of links) {
      const href = new URL(a.href, location.origin).href;
      if (byHref.has(href)) continue;
      const key = projectKeyFromUrl(href);
      if (!key || isBlockedByQueue(key)) {
        skippedKnown += 1;
        continue;
      }

      const card = cardFor(a);
      if (!card || !isVisible(card)) continue;
      const text = (card.innerText || a.textContent || "").trim();
      if (text.length < 30) continue;
      if (unavailableTerms.some(term => normalize(text).includes(term))) {
        skippedKnown += 1;
        continue;
      }

      const title = (a.textContent || "").trim().replace(/\s+/g, " ");
      const data = scoreText(text);
      if (data.score <= 0) continue;

      const item = { href, key, title: title || "Projeto 99Freelas", text, card, ...data };
      byHref.set(href, item);
      addInlinePrepareButton(card, item);
    }

    const items = [...byHref.values()];
    items.sort((a, b) => {
      if (a.exclusive !== b.exclusive) return a.exclusive ? -1 : 1;
      if ((a.proposals ?? 999) !== (b.proposals ?? 999) && Math.abs(a.score - b.score) < 1.2) return (a.proposals ?? 999) - (b.proposals ?? 999);
      return b.score - a.score;
    });
    return { items, skippedKnown };
  }

  function ensurePanel() {
    let panel = document.querySelector("#crs99-live-scanner");
    if (panel) return panel;
    panel = document.createElement("aside");
    panel.id = "crs99-live-scanner";
    panel.innerHTML = `
      <div class="crs99s-head"><strong>CRS 99 — Radar Validação</strong><span>analisando…</span></div>
      <div class="crs99s-body">
        <div class="crs99s-note">Modo validação: amplitude alta. Dificuldade não elimina; enviados e fechados somem.</div>
        <div class="crs99s-list"></div>
        <button class="crs99s-refresh" type="button">Reanalisar carregados</button>
      </div>`;
    document.documentElement.appendChild(panel);
    panel.querySelector(".crs99s-refresh")?.addEventListener("click", () => render());
    return panel;
  }

  function render() {
    const { items, skippedKnown } = collectItems();
    const panel = ensurePanel();
    const count = panel.querySelector(".crs99s-head span");
    const note = panel.querySelector(".crs99s-note");
    const list = panel.querySelector(".crs99s-list");

    if (count) count.textContent = `${items.length} candidatas carregadas`;
    if (note) note.textContent = `Modo validação. Abrimos mais possibilidades e priorizamos recência + baixa concorrência.${skippedKnown ? ` ${skippedKnown} já enviados/fechados foram ignorados.` : ""}`;

    const top = items.filter(i => i.score >= 2.0).slice(0, 20);
    if (!list) return;
    list.innerHTML = "";

    if (!top.length) {
      list.innerHTML = '<div class="crs99s-empty">Sem novas candidatas entre os projetos carregados. Continue descendo ou vá para a próxima página.</div>';
      return;
    }

    top.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "crs99s-item";
      row.dataset.projectKey = item.key;
      const decision = item.score >= 7 ? "ABRIR AGORA" : item.score >= 5 ? "BOA CANDIDATA" : "VALIDAR";
      row.innerHTML = `
        <div class="crs99s-rank">#${index + 1} · pré-filtro ${item.score.toFixed(1)}/10 · ${decision}${item.exclusive ? " · PREMIUM EXCLUSIVO" : ""}${item.proposals != null ? ` · ${item.proposals} propostas` : ""}</div>
        <div class="crs99s-title"></div>
        <div class="crs99s-tags">${item.hits.length ? item.hits.join(" · ") : "aderência ampla"}</div>
        <button type="button">Analisar e preparar</button>`;
      row.querySelector(".crs99s-title").textContent = item.title;
      row.querySelector("button").addEventListener("click", () => openPrepared(item.href));
      list.appendChild(row);
    });
  }

  let renderTimer = null;
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 250);
  }

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : null;
      if (target?.closest("#crs99-live-scanner")) return false;
      const nodes = [...mutation.addedNodes].filter(node => node instanceof Element);
      return nodes.some(node => !node.matches?.(".crs99-inline-prepare") && !node.closest?.("#crs99-live-scanner"));
    });
    if (relevant) scheduleRender();
  });

  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  render();

  setInterval(() => {
    if (location.href !== initialUrl) location.reload();
  }, 800);
})();