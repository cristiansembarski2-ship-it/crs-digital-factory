(() => {
  if (window.__CRS99_COPILOT__) return;
  window.__CRS99_COPILOT__ = true;

  const PREMIUM_MODE = true;
  const VERSION = "0.3.0";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = (value = "") => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const currentUrl = location.href.split("#")[0];
  const currentPath = location.pathname.replace(/\/+$/, "");
  const isBidPage = /\/project\/bid\//.test(currentPath);
  const projectKey = currentPath
    .replace(/^\/project\/bid\//, "")
    .replace(/^\/project\//, "")
    .split("/")[0];

  const pageText = normalize(document.body?.innerText || "");
  const title = $("h1")?.textContent?.trim() || document.title.replace(/\s*\|.*$/, "").trim();

  const closed = [
    "projeto fechado",
    "projeto encerrado",
    "orcamento: fechado",
    "orcamento fechado",
    "nao esta recebendo propostas",
    "nao aceita mais propostas",
    "projeto cancelado"
  ].some((term) => pageText.includes(term));

  const unavailable = [
    "projeto em andamento",
    "em andamento",
    "projeto concluido",
    "projeto finalizado",
    "contratacao concluida"
  ].some((term) => pageText.includes(term));

  const exclusive = [
    "projeto exclusivo",
    "exclusivo para freelancers",
    "projeto exclusivo temporariamente"
  ].some((term) => pageText.includes(term));

  function findBidAction() {
    const anchors = $$('a[href*="/project/bid/"]');
    if (anchors.length) return anchors[0];

    return $$('a, button').find((el) => {
      const text = normalize(el.textContent || "");
      return text === "enviar proposta" || text.includes("enviar proposta") || text.includes("fazer proposta");
    }) || null;
  }

  function localFitScore() {
    const positive = {
      "compras": 1.4,
      "estoque": 1.4,
      "fornecedor": 1.2,
      "fornecedores": 1.2,
      "excel": 1.3,
      "google sheets": 1.3,
      "planilha": 1.0,
      "csv": 1.0,
      "sku": 1.0,
      "cotacao": 1.2,
      "pedido": 0.8,
      "dashboard": 0.8,
      "automacao": 1.2,
      "automatizar": 1.2,
      "power query": 0.8,
      "relatorio": 0.7,
      "pesquisa": 0.8,
      "levantamento": 0.8,
      "landing page": 1.0,
      "pagina de vendas": 1.0,
      "html": 0.7,
      "css": 0.6,
      "javascript": 0.7,
      "python": 0.8,
      "apresentacao": 0.7,
      "powerpoint": 0.8,
      "canva": 0.6,
      "word": 0.5,
      "pdf": 0.5,
      "traducao": 0.6,
      "espanhol": 0.5
    };
    const negative = {
      "erp completo": 2.5,
      "sap": 1.2,
      "oracle": 1.0,
      "aplicativo mobile": 1.5,
      "full stack": 1.0,
      "whatsapp api": 0.8,
      "sistema completo": 1.2,
      "sdr": 3.5,
      "atender leads": 3.0,
      "atender os leads": 3.0,
      "follow-up": 2.5,
      "follow up": 2.5,
      "contornar objecoes": 3.0,
      "atendimento comercial": 3.0,
      "horario comercial": 2.0,
      "ligacoes para clientes": 2.5,
      "prospeccao ativa": 2.5,
      "presencial": 3.0,
      "experiencia comprovada": 1.0,
      "portfolio obrigatorio": 1.5
    };

    let score = 3.5;
    Object.entries(positive).forEach(([term, weight]) => {
      if (pageText.includes(term)) score += weight;
    });
    Object.entries(negative).forEach(([term, weight]) => {
      if (pageText.includes(term)) score -= weight;
    });
    if (exclusive && PREMIUM_MODE) score += 0.5;
    if (closed || unavailable) score = 0;
    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
  }

  function hasForbiddenContact(text = "") {
    const value = normalize(text);
    return {
      blocked: /https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text)
        || /\bwhatsapp\b|\btelefone\b|\btelegram\b|\binstagram\b/.test(value)
        || /\(\d{2}\)\s*\d{4,5}[-\s]?\d{4}/.test(text),
      reason: "A proposta contém possível contato ou link externo. Remova antes de preencher."
    };
  }

  function fieldContext(el) {
    const parts = [
      el.name,
      el.id,
      el.placeholder,
      el.getAttribute("aria-label"),
      el.getAttribute("data-label")
    ].filter(Boolean);

    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) parts.push(label.textContent);
    }

    const parent = el.closest(".form-group, .field, .control-group, .row, div");
    if (parent) parts.push((parent.innerText || "").slice(0, 260));
    return normalize(parts.join(" "));
  }

  function isUsableField(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    if (el.type && ["hidden", "submit", "button", "checkbox", "radio", "file"].includes(el.type)) return false;
    return true;
  }

  function findField(terms, kind = "input") {
    let candidates = [];
    if (kind === "textarea") {
      candidates = [...$$('textarea'), ...$$('[contenteditable="true"]')];
    } else {
      candidates = $$('input, select').filter(isUsableField);
    }

    const scored = candidates.map((el) => {
      const context = fieldContext(el);
      let score = 0;
      terms.forEach((term, index) => {
        if (context.includes(normalize(term))) score += 10 - index;
      });
      if (kind === "textarea" && el.tagName === "TEXTAREA") score += 2;
      return { el, score };
    }).filter((item) => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.el || null;
  }

  function setNativeValue(el, value) {
    if (!el) return false;

    if (el.isContentEditable) {
      el.focus();
      el.textContent = String(value);
    } else {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype
        : el.tagName === "SELECT" ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      if (descriptor?.set) descriptor.set.call(el, String(value));
      else el.value = String(value);
    }

    ["input", "change", "blur"].forEach((type) => {
      el.dispatchEvent(new Event(type, { bubbles: true }));
    });
    return true;
  }

  function findProposalField() {
    const direct = $$('textarea').filter(isUsableField);
    if (direct.length === 1) return direct[0];
    return findField(["proposta", "descricao", "mensagem", "detalhes", "apresentacao"], "textarea")
      || direct.sort((a, b) => (b.getBoundingClientRect().height - a.getBoundingClientRect().height))[0]
      || null;
  }

  function findPriceField() {
    return findField(["valor da proposta", "valor", "preco", "orcamento", "oferta", "r$"], "input");
  }

  function findDaysField() {
    return findField(["prazo", "dias", "entrega", "tempo"], "input");
  }

  function fillBid(opportunity) {
    if (closed || unavailable) return { ok: false, message: "Projeto indisponível para novas propostas. Preenchimento bloqueado." };
    if (exclusive && !PREMIUM_MODE && opportunity?.allowExclusive !== true) {
      return { ok: false, message: "Projeto exclusivo detectado. Esta conta não está configurada como elegível." };
    }
    if (!opportunity?.proposal) return { ok: false, message: "Não há proposta aprovada na fila CRS para este projeto." };

    const contactCheck = hasForbiddenContact(opportunity.proposal);
    if (contactCheck.blocked) return { ok: false, message: contactCheck.reason };

    const proposalField = findProposalField();
    const priceField = findPriceField();
    const daysField = findDaysField();
    const filled = [];
    const missing = [];

    if (proposalField && setNativeValue(proposalField, opportunity.proposal)) filled.push("proposta");
    else missing.push("proposta");

    if (priceField && opportunity.price != null && setNativeValue(priceField, opportunity.price)) filled.push("valor");
    else if (opportunity.price != null) missing.push("valor");

    if (daysField && opportunity.days != null && setNativeValue(daysField, opportunity.days)) filled.push("prazo");
    else if (opportunity.days != null) missing.push("prazo");

    const submit = $$('button, input[type="submit"]').find((el) => normalize(el.textContent || el.value || "").includes("enviar proposta"));
    if (submit) {
      submit.dataset.crs99Protected = "true";
      submit.title = "CRS 99 Copilot: revise os campos antes do clique final.";
    }

    if (!filled.length) {
      return { ok: false, message: "Não consegui identificar os campos do formulário nesta versão da página." };
    }

    const suffix = missing.length ? ` Não identifiquei automaticamente: ${missing.join(", ")}.` : "";
    return { ok: true, message: `Preenchido: ${filled.join(", ")}.${suffix} Revise e faça o clique final manualmente.` };
  }

  function copyBriefing() {
    const heading = title || "Projeto 99Freelas";
    const descriptionNode = $('[class*="description"], .project-description, main, article');
    const excerpt = (descriptionNode?.innerText || document.body.innerText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    const text = `99FREELAS\nTítulo: ${heading}\nURL: ${currentUrl}\n\nConteúdo:\n${excerpt}`;
    return navigator.clipboard.writeText(text);
  }

  function getQueue() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CRS99_GET_QUEUE" }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: false, error: "Sem resposta da extensão" });
      });
    });
  }

  function matchOpportunity(data) {
    const list = Array.isArray(data?.opportunities) ? data.opportunities : [];
    return list.find((item) => {
      const itemKey = item.projectKey || item.slug || "";
      return itemKey === projectKey
        || item.url?.includes(projectKey)
        || item.bidUrl?.includes(projectKey);
    }) || null;
  }

  const panel = document.createElement("aside");
  panel.id = "crs99-copilot";
  panel.innerHTML = `
    <div class="crs99-head">
      <div>
        <strong>CRS 99 Copilot</strong>
        <span>v${VERSION} · Premium</span>
      </div>
      <button type="button" class="crs99-minimize" aria-label="Minimizar">−</button>
    </div>
    <div class="crs99-body">
      <div class="crs99-title"></div>
      <div class="crs99-status"></div>
      <div class="crs99-score"></div>
      <div class="crs99-package"></div>
      <div class="crs99-message" aria-live="polite"></div>
      <div class="crs99-actions">
        <button type="button" class="crs99-primary crs99-main">Carregando…</button>
        <button type="button" class="crs99-secondary crs99-copy">Copiar briefing</button>
        <button type="button" class="crs99-secondary crs99-refresh">Atualizar fila</button>
      </div>
      <small class="crs99-foot">Premium ativo. Nunca envia proposta sozinho; revise antes do clique final.</small>
    </div>`;
  document.documentElement.appendChild(panel);

  const refs = {
    body: $(".crs99-body", panel),
    title: $(".crs99-title", panel),
    status: $(".crs99-status", panel),
    score: $(".crs99-score", panel),
    package: $(".crs99-package", panel),
    message: $(".crs99-message", panel),
    main: $(".crs99-main", panel),
    copy: $(".crs99-copy", panel),
    refresh: $(".crs99-refresh", panel),
    minimize: $(".crs99-minimize", panel)
  };

  let opportunity = null;

  function setMessage(text, type = "info") {
    refs.message.textContent = text || "";
    refs.message.dataset.type = type;
  }

  function renderBase() {
    refs.title.textContent = title || projectKey || "Projeto 99Freelas";

    if (closed || unavailable) {
      refs.status.innerHTML = '<span class="crs99-badge danger">INDISPONÍVEL</span> Projeto não aceita nova proposta.';
    } else if (exclusive && PREMIUM_MODE) {
      refs.status.innerHTML = '<span class="crs99-badge good">EXCLUSIVO · PREMIUM</span> Pode concorrer agora.';
    } else if (exclusive) {
      refs.status.innerHTML = '<span class="crs99-badge warn">EXCLUSIVO</span> Verifique elegibilidade.';
    } else if (findBidAction() || isBidPage) {
      refs.status.innerHTML = '<span class="crs99-badge good">ABERTO</span> Página aceita fluxo de proposta.';
    } else {
      refs.status.innerHTML = '<span class="crs99-badge neutral">INCERTO</span> Não encontrei confirmação de envio.';
    }

    const score = localFitScore();
    const decision = score >= 7 ? "ATACAR" : score >= 5 ? "REVISAR" : "PULAR";
    refs.score.textContent = `Aderência local: ${score.toFixed(1)}/10 · ${decision}`;
  }

  function renderOpportunity() {
    if (!opportunity) {
      refs.package.innerHTML = '<strong>Fila CRS:</strong> nenhum pacote aprovado para esta URL.';
      refs.main.textContent = isBidPage ? "Sem pacote aprovado" : "Abrir formulário";
      refs.main.disabled = closed || unavailable || (!isBidPage && !findBidAction());
      return;
    }

    const status = opportunity.status || "ready";
    const price = opportunity.price != null ? `R$ ${opportunity.price}` : "—";
    const days = opportunity.days != null ? `${opportunity.days} dias` : "—";
    const fit = opportunity.fit != null ? `${opportunity.fit}/10` : "—";
    refs.package.innerHTML = `
      <strong>Pacote CRS encontrado</strong>
      <div>Aderência: ${fit} · Valor: ${price} · Prazo: ${days}</div>
      <div>Risco: ${opportunity.risk || "não registrado"}</div>`;

    if (status === "sent") {
      refs.main.textContent = "Proposta já registrada como enviada";
      refs.main.disabled = true;
      return;
    }

    if (["closed", "unavailable"].includes(status) || closed || unavailable) {
      refs.main.textContent = "Projeto indisponível";
      refs.main.disabled = true;
      return;
    }

    if (isBidPage) {
      refs.main.textContent = "Preencher proposta";
      refs.main.disabled = false;
    } else {
      refs.main.textContent = exclusive && PREMIUM_MODE ? "Abrir proposta Premium" : "Abrir formulário da proposta";
      refs.main.disabled = !findBidAction() && !opportunity.bidUrl;
    }
  }

  async function refreshQueue() {
    refs.refresh.disabled = true;
    setMessage("Atualizando fila CRS…");
    const response = await getQueue();
    refs.refresh.disabled = false;

    if (!response?.ok) {
      opportunity = null;
      renderOpportunity();
      setMessage(response?.error || "Não foi possível carregar a fila CRS.", "error");
      return;
    }

    opportunity = matchOpportunity(response.data);
    renderOpportunity();
    setMessage(opportunity ? "Pacote sincronizado com a fila CRS." : "Projeto ainda não analisado pela fila CRS.", opportunity ? "success" : "info");
  }

  refs.main.addEventListener("click", () => {
    if (refs.main.disabled || closed || unavailable) return;

    if (!isBidPage) {
      const action = findBidAction();
      if (action?.href) {
        location.href = action.href;
        return;
      }
      if (opportunity?.bidUrl) {
        location.href = opportunity.bidUrl;
        return;
      }
      if (action) {
        action.click();
        return;
      }
      setMessage("Não encontrei o formulário de proposta nesta página.", "error");
      return;
    }

    const result = fillBid(opportunity);
    setMessage(result.message, result.ok ? "success" : "error");
  });

  refs.copy.addEventListener("click", async () => {
    try {
      await copyBriefing();
      setMessage("Briefing copiado. Use isso quando a fila ainda não tiver criado um pacote.", "success");
    } catch {
      setMessage("Não consegui copiar o briefing automaticamente.", "error");
    }
  });

  refs.refresh.addEventListener("click", refreshQueue);
  refs.minimize.addEventListener("click", () => {
    const hidden = refs.body.hidden = !refs.body.hidden;
    refs.minimize.textContent = hidden ? "+" : "−";
  });

  renderBase();
  refreshQueue();
})();