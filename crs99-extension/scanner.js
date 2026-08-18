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
    if (!item) return false;
    return ["sent", "closed", "unavailable"].includes(item.status);
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  const links = [...document.querySelectorAll('a[href*="/project/"]')]
    .filter(a => isVisible(a))
    .filter(a => !/\/project\/(new|bid)\//.test(a.getAttribute('href') || '') && !/\/project\/new/.test(a.getAttribute('href') || ''));

  const positives = {
    "excel": 2.0, "google sheets": 2.0, "planilha": 1.6, "csv": 1.5, "dashboard": 1.4,
    "automacao": 1.8, "automatizar": 1.8, "estoque": 1.6, "compras": 1.6, "fornecedor": 1.4,
    "pesquisa": 1.2, "levantamento": 1.2, "organizar dados": 1.2, "limpeza de dados": 1.2,
    "landing page": 1.5, "pagina de vendas": 1.4, "site institucional": 1.1, "html": 1.0, "css": 1.0, "javascript": 1.0,
    "powerpoint": 1.2, "canva": 1.0, "apresentacao": 1.1, "word": 0.9, "pdf": 0.8, "formatacao": 0.9, "revisao": 0.8,
    "copy": 0.9, "descricao de produto": 1.0, "python": 1.2, "script": 1.0, "web scraping": 1.0,
    "traducao": 0.8, "espanhol": 0.8
  };
  const negatives = {
    "trafego pago": 2.0, "gestor de trafego": 2.0, "atendimento integral": 2.5, "segunda a sabado": 1.5,
    "presencial": 3.0, "arquitetura": 2.5, "engenheiro": 1.5, "advogado": 1.0, "contador": 1.5,
    "woocommerce": 1.8, "wordpress": 1.0, "erp completo": 3.0, "aplicativo mobile": 2.0, "full stack": 1.8,
    "experiencia comprovada": 1.2, "portfolio obrigatorio": 1.8,
    "sdr": 4.0, "atender os leads": 3.5, "atender leads": 3.5, "follow-up": 3.0, "follow up": 3.0,
    "contornar objecoes": 3.5, "vender a proxima etapa": 4.0, "acompanhar os leads": 3.0,
    "recuperar pacientes": 3.0, "fazer atendimento comercial": 3.5, "conversao para agendamento": 3.5,
    "horario comercial": 2.5, "ligacoes para clientes": 3.0, "prospeccao ativa": 3.0, "closer": 3.5
  };
  const unavailableTerms = ["em andamento", "projeto em andamento", "projeto fechado", "encerrado", "finalizado", "concluido", "cancelado"];
  const exclusiveTerms = ["projeto exclusivo", "exclusivo para", "exclusivo temporariamente"];

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

    const exclusive = exclusiveTerms.some(term => n.includes(term));
    if (exclusive) score += PREMIUM_MODE ? 1.2 : -3.0;
    if (unavailableTerms.some(term => n.includes(term))) score = 0;

    const proposalMatch = n.match(/propostas?:\s*(\d+)/);
    const proposals = proposalMatch ? Number(proposalMatch[1]) : null;
    if (proposals != null) {
      if (proposals <= 5) score += 1.8;
      else if (proposals <= 15) score += 1.0;
      else if (proposals >= 80) score -= 1.4;
      else if (proposals >= 40) score -= 0.7;
    }

    if (/publicado hoje|hoje[,\s]/.test(n)) score += 0.5;

    return {
      score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
      proposals,
      exclusive,
      hits: [...new Set(hits)].slice(0, 4)
    };
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
    if (!isVisible(card)) continue;
    const text = (card?.innerText || a.textContent || '').trim();
    if (text.length < 40) continue;
    if (unavailableTerms.some(term => normalize(text).includes(term))) { skippedKnown += 1; seen.add(href); continue; }
    seen.add(href);
    const title = (a.textContent || '').trim().replace(/\s+/g, ' ');
    const data = scoreText(text);
    if (data.score <= 0) continue;
    items.push({ href, key, title: title || 'Projeto 99Freelas', text, ...data });
  }

  items.sort((a, b) => {
    if (a.exclusive !== b.exclusive) return a.exclusive ? -1 : 1;
    return b.score - a.score || (a.proposals ?? 999) - (b.proposals ?? 999);
  });

  const strong = items.filter(i => i.score >= 6.5);
  const top = (strong.length >= 4 ? strong : items.filter(i => i.score >= 3.5)).slice(0, 10);

  document.querySelector('#crs99-live-scanner')?.remove();
  const panel = document.createElement('aside');
  panel.id = 'crs99-live-scanner';
  panel.innerHTML = `
    <div class="crs99s-head"><strong>CRS 99 — Radar Premium</strong><span>${items.length} projetos úteis</span></div>
    <div class="crs99s-body">
      <div class="crs99s-note">Premium ativo: exclusivos entram primeiro. ${skippedKnown ? `${skippedKnown} enviados/fechados/em andamento foram pulados.` : 'A confirmação final acontece ao abrir o projeto.'}</div>
      <div class="crs99s-list"></div>
      <button class="crs99s-refresh" type="button">Reanalisar página</button>
    </div>`;
  document.documentElement.appendChild(panel);
  const list = panel.querySelector('.crs99s-list');

  if (!top.length) {
    list.innerHTML = '<div class="crs99s-empty">Nenhuma vaga útil nesta página. Vá para a próxima página.</div>';
  } else {
    top.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'crs99s-item';
      row.dataset.projectKey = item.key;
      const decision = item.score >= 7 ? 'ATACAR' : item.score >= 5 ? 'REVISAR' : 'BAIXA';
      row.innerHTML = `
        <div class="crs99s-rank">#${index + 1} · ${item.score.toFixed(1)}/10 · ${decision}${item.exclusive ? ' · PREMIUM EXCLUSIVO' : ''}${item.proposals != null ? ` · ${item.proposals} propostas` : ''}</div>
        <div class="crs99s-title"></div>
        <div class="crs99s-tags">${item.hits.length ? item.hits.join(' · ') : 'aderência geral'}</div>
        <button type="button">Abrir projeto</button>`;
      row.querySelector('.crs99s-title').textContent = item.title;
      row.querySelector('button').addEventListener('click', () => location.href = item.href);
      list.appendChild(row);
    });
  }

  panel.querySelector('.crs99s-refresh').addEventListener('click', () => location.reload());

  setInterval(() => {
    if (location.href !== initialUrl) location.reload();
  }, 800);
})();