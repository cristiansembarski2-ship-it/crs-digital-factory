(async () => {
  if (window.__CRS99_SCANNER__) return;
  window.__CRS99_SCANNER__ = true;

  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  function getQueue() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CRS99_GET_QUEUE" }, (response) => {
        if (chrome.runtime.lastError) return resolve(null);
        resolve(response?.ok ? response.data : null);
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

  const queue = await getQueue();
  const queueMap = new Map((queue?.opportunities || []).map((item) => [item.projectKey, item]));

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

  const links = [...document.querySelectorAll('a[href*="/project/"]')]
    .filter(a => !/\/project\/(new|bid)\//.test(a.getAttribute('href') || '') && !/\/project\/new/.test(a.getAttribute('href') || ''));

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

  function cardFor(a) {
    return a.closest('article, li, .project, .project-item, .media, .card, .list-group-item, .row, .box') || a.parentElement?.parentElement || a.parentElement;
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
    if (n.includes('projeto exclusivo') || n.includes('exclusivo para')) score -= 3.0;
    const proposalMatch = n.match(/propostas?:\s*(\d+)/);
    const proposals = proposalMatch ? Number(proposalMatch[1]) : null;
    if (proposals != null) {
      if (proposals <= 5) score += 1.5;
      else if (proposals <= 15) score += 0.8;
      else if (proposals >= 80) score -= 1.2;
      else if (proposals >= 40) score -= 0.6;
    }
    return { score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)), proposals, hits: [...new Set(hits)].slice(0, 4) };
  }

  const seen = new Set();
  const items = [];
  let skippedKnown = 0;
  for (const a of links) {
    const href = new URL(a.href, location.origin).href;
    if (seen.has(href)) continue;
    const key = projectKeyFromUrl(href);
    if (isBlockedByQueue(key)) { skippedKnown += 1; seen.add(href); continue; }
    const card = cardFor(a);
    const text = (card?.innerText || a.textContent || '').trim();
    if (text.length < 40) continue;
    seen.add(href);
    const title = (a.textContent || '').trim().replace(/\s+/g, ' ');
    const data = scoreText(text);
    items.push({ href, key, title: title || 'Projeto 99Freelas', text, ...data });
  }

  items.sort((a, b) => b.score - a.score || (a.proposals ?? 999) - (b.proposals ?? 999));
  const top = items.filter(i => i.score >= 6.5).slice(0, 8);

  const panel = document.createElement('aside');
  panel.id = 'crs99-live-scanner';
  panel.innerHTML = `
    <div class="crs99s-head"><strong>CRS 99 — Radar ao vivo</strong><span>${items.length} projetos úteis</span></div>
    <div class="crs99s-body">
      <div class="crs99s-note">Ranking desta página. ${skippedKnown ? `${skippedKnown} já enviados/fechados/exclusivos foram pulados.` : 'A confirmação final acontece ao abrir o projeto.'}</div>
      <div class="crs99s-list"></div>
      <button class="crs99s-refresh" type="button">Reanalisar página</button>
    </div>`;
  document.documentElement.appendChild(panel);
  const list = panel.querySelector('.crs99s-list');

  if (!top.length) {
    list.innerHTML = '<div class="crs99s-empty">Nenhuma vaga com aderência suficiente nesta página.</div>';
  } else {
    top.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'crs99s-item';
      row.innerHTML = `
        <div class="crs99s-rank">#${index + 1} · ${item.score.toFixed(1)}/10${item.proposals != null ? ` · ${item.proposals} propostas` : ''}</div>
        <div class="crs99s-title"></div>
        <div class="crs99s-tags">${item.hits.length ? item.hits.join(' · ') : 'aderência geral'}</div>
        <button type="button">Abrir projeto</button>`;
      row.querySelector('.crs99s-title').textContent = item.title;
      row.querySelector('button').addEventListener('click', () => location.href = item.href);
      list.appendChild(row);
    });
  }

  panel.querySelector('.crs99s-refresh').addEventListener('click', () => location.reload());
})();
