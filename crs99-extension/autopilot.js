(() => {
  if (window.__CRS99_AUTOPILOT__) return;
  window.__CRS99_AUTOPILOT__ = true;

  const VERSION = "0.4.0";
  const PREPARE_PARAM = "crs99";
  const PREPARE_VALUE = "prepare";
  const AUTOFILL_VALUE = "autofill";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = (value = "") => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const path = location.pathname.replace(/\/+$/, "");
  const isBidPage = /\/project\/bid\//.test(path);
  const projectKey = path
    .replace(/^\/project\/bid\//, "")
    .replace(/^\/project\//, "")
    .split("/")[0];
  const params = new URLSearchParams(location.search);
  const mode = params.get(PREPARE_PARAM);

  if (!projectKey) return;

  const pageTextRaw = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
  const pageText = normalize(pageTextRaw);
  const title = $("h1")?.textContent?.trim() || document.title.replace(/\s*\|.*$/, "").trim() || projectKey;

  const unavailableTerms = [
    "projeto fechado", "projeto encerrado", "nao esta recebendo propostas", "nao aceita mais propostas",
    "projeto em andamento", "em andamento", "projeto concluido", "projeto finalizado", "projeto cancelado"
  ];
  const humanServiceTerms = [
    "sdr", "atender leads", "atender os leads", "follow-up", "follow up", "contornar objecoes",
    "atendimento comercial", "horario comercial", "ligacoes para clientes", "prospeccao ativa", "closer",
    "acompanhar leads", "acompanhar os leads", "vender a proxima etapa", "recuperar pacientes"
  ];
  const hardBlockTerms = [
    "trabalho presencial", "presencial obrigatorio", "advogado", "responsavel tecnico", "contador registrado",
    "erp completo", "aplicativo mobile completo", "app mobile completo"
  ];

  const hasAny = (terms, text = pageText) => terms.some((term) => text.includes(term));
  const isUnavailable = hasAny(unavailableTerms);

  function detectCategory(text) {
    if (hasAny(["excel", "google sheets", "planilha", "csv", "power query", "dashboard", "estoque", "sku"], text)) return "spreadsheet";
    if (hasAny(["landing page", "pagina de vendas", "pagina institucional", "html", "css", "site estatico"], text)) return "landing";
    if (hasAny(["pesquisa", "levantamento", "lista de", "canais no youtube", "leads", "encontrar empresas", "coleta de dados"], text)) return "research";
    if (hasAny(["powerpoint", "apresentacao", "slides", "canva"], text)) return "presentation";
    if (hasAny(["word", "pdf", "formatacao", "diagramacao", "revisao de texto", "relatorio"], text)) return "document";
    if (hasAny(["python", "javascript", "script", "automacao web", "web scraping"], text)) return "script";
    if (hasAny(["traducao", "traduzir", "espanhol", "portugues"], text)) return "translation";
    if (hasAny(["copy", "copywriting", "descricao de produto", "texto de vendas", "conteudo comercial"], text)) return "copy";
    return "generic";
  }

  function extractSignals(text) {
    const signalMap = [
      ["estoque", "controle de estoque"], ["sku", "SKU/códigos"], ["fornecedor", "fornecedores"],
      ["dashboard", "dashboard"], ["power query", "Power Query"], ["google sheets", "Google Sheets"],
      ["excel", "Excel"], ["csv", "CSV"], ["validacao", "validação de dados"], ["api", "integração/API"],
      ["responsiv", "responsividade mobile"], ["cta", "CTAs"], ["copy", "copy"],
      ["email", "e-mails públicos"], ["youtube", "YouTube"], ["fontes", "fontes públicas"],
      ["powerpoint", "PowerPoint"], ["canva", "Canva"], ["pdf", "PDF"], ["word", "Word"],
      ["python", "Python"], ["javascript", "JavaScript"], ["espanhol", "espanhol"]
    ];
    const found = [];
    for (const [needle, label] of signalMap) {
      if (text.includes(needle) && !found.includes(label)) found.push(label);
      if (found.length >= 5) break;
    }
    return found;
  }

  function extractQuantity(text) {
    const cleaned = text.replace(/\./g, "");
    const match = cleaned.match(/\b(\d{2,6})\s*(?:canais|leads|empresas|contatos|itens|produtos|registros|linhas)\b/);
    return match ? Number(match[1]) : null;
  }

  function planForProject() {
    const category = detectCategory(pageText);
    const signals = extractSignals(pageText);
    const quantity = extractQuantity(pageText);
    let fit = 5.5;
    let price = 390;
    let days = 3;
    let risk = "baixo";

    if (category === "spreadsheet") {
      fit = 8.6;
      price = 590;
      days = 4;
      if (hasAny(["automacao", "automatizar", "estoque", "dashboard", "power query", "sku"])) { fit += 0.7; price = 790; }
      if (hasAny(["compras", "fornecedor", "cotacao"])) fit += 0.4;
      if (hasAny(["api", "integracao", "make", "n8n", "webhook"])) { fit -= 0.8; price = Math.max(price, 990); days = 5; risk = "médio — validar integração/acessos"; }
    } else if (category === "landing") {
      fit = 8.0;
      price = 490;
      days = 3;
      if (hasAny(["modelo pronto", "copy pronta", "conteudo pronto", "referencia pronta"])) { fit += 0.7; price = 450; }
      if (hasAny(["wordpress", "woocommerce", "elementor"])) { fit -= 1.5; risk = "médio — CMS/plugin pode ampliar escopo"; price = 690; days = 4; }
      if (hasAny(["e-commerce completo", "loja completa", "checkout customizado"])) { fit -= 2.0; risk = "alto — escopo maior que landing page"; }
    } else if (category === "research") {
      fit = 8.2;
      price = 390;
      days = 3;
      if (quantity && quantity >= 2000) { price = 1290; days = 5; risk = "médio — volume e disponibilidade de dados públicos"; }
      else if (quantity && quantity >= 1000) { price = 990; days = 5; risk = "médio — volume de validação"; }
      else if (quantity && quantity >= 500) { price = 690; days = 4; }
      if (hasAny(["email", "e-mail"])) risk = "médio — e-mail somente quando público/disponível";
    } else if (category === "presentation") {
      fit = 7.8; price = 390; days = 3;
    } else if (category === "document") {
      fit = 7.6; price = 290; days = 2;
    } else if (category === "script") {
      fit = 7.8; price = 690; days = 4;
      if (hasAny(["login", "captcha", "anti-bot", "burlar", "bypass"])) { fit -= 2.5; risk = "alto — restrições técnicas/termos do site"; }
    } else if (category === "translation") {
      fit = 7.4; price = 350; days = 3;
    } else if (category === "copy") {
      fit = 7.5; price = 390; days = 3;
    }

    if (hasAny(humanServiceTerms)) { fit = Math.min(fit, 2.8); risk = "alto — exige atuação humana contínua"; }
    if (hasAny(hardBlockTerms)) { fit = Math.min(fit, 2.0); risk = "alto — fora do escopo operacional"; }
    if (hasAny(["experiencia comprovada", "portfolio obrigatorio", "cases obrigatorios"])) { fit -= 1.2; risk = "médio — exige prova que não devemos inventar"; }
    if (pageText.includes("projeto exclusivo") || pageText.includes("exclusivo para")) fit += 0.3;
    if (isUnavailable) fit = 0;

    fit = Math.max(0, Math.min(10, Math.round(fit * 10) / 10));
    const decision = fit >= 7 ? "attack" : fit >= 5 ? "review" : "skip";

    return {
      version: VERSION,
      projectKey,
      title,
      category,
      signals,
      quantity,
      fit,
      decision,
      price,
      days,
      risk,
      proposal: buildProposal({ category, signals, quantity, price, days, risk }),
      generatedAt: new Date().toISOString(),
      sourceUrl: location.href.split("?")[0].split("#")[0]
    };
  }

  function buildProposal({ category, signals, quantity, price, days, risk }) {
    const focus = signals.length ? signals.slice(0, 4).join(", ") : "os pontos descritos no escopo";
    const safeTitle = title.replace(/\s+/g, " ").trim();
    const intros = {
      spreadsheet: `Olá! Li o escopo de “${safeTitle}”. Posso estruturar a solução sem mudar a lógica principal do seu processo, priorizando ${focus}.`,
      landing: `Olá! Li o escopo de “${safeTitle}”. Posso montar a página de forma responsiva e organizada, seguindo o material/referência fornecido e priorizando ${focus}.`,
      research: `Olá! Li o escopo de “${safeTitle}”. Posso organizar a pesquisa em uma planilha limpa, com critérios consistentes, fontes públicas e os campos separados para validação.`,
      presentation: `Olá! Li o escopo de “${safeTitle}”. Posso transformar o conteúdo em uma apresentação clara, consistente e pronta para uso, preservando a mensagem e melhorando a organização visual.`,
      document: `Olá! Li o escopo de “${safeTitle}”. Posso organizar e padronizar o material, corrigindo estrutura e formatação para entregar um arquivo limpo e fácil de continuar editando.`,
      script: `Olá! Li o escopo de “${safeTitle}”. Posso desenvolver a automação/script com foco no fluxo descrito, validação de entradas e uma saída simples de manter.`,
      translation: `Olá! Li o escopo de “${safeTitle}”. Posso fazer a tradução preservando sentido, tom e naturalidade, com revisão final antes da entrega.`,
      copy: `Olá! Li o escopo de “${safeTitle}”. Posso escrever e organizar o texto com foco em clareza, intenção comercial e leitura natural, respeitando o posicionamento informado.`,
      generic: `Olá! Li com atenção o escopo de “${safeTitle}”. Posso executar a entrega de forma objetiva, validando primeiro os requisitos e mantendo o trabalho dentro do que foi solicitado.`
    };

    const bodies = {
      spreadsheet: `Meu plano é: revisar a estrutura atual, implementar as fórmulas/automação, testar com dados de exemplo, proteger os pontos sensíveis e entregar o arquivo organizado com uma orientação curta de uso. Incluo uma rodada de pequenos ajustes após a entrega.`,
      landing: `Vou organizar estrutura, seções, CTAs e versão mobile, revisar o comportamento responsivo e entregar os arquivos prontos. Ajustes que dependam de hospedagem, CMS ou integrações não descritas podem ser alinhados antes de começar.`,
      research: `A entrega terá dados em colunas separadas, critérios verificáveis e indicação clara quando alguma informação não estiver publicamente disponível — sem preencher dados por suposição.${quantity ? ` Para o volume de aproximadamente ${quantity} registros, farei a validação em lotes para manter consistência.` : ""}`,
      presentation: `Organizo hierarquia, títulos, mensagens principais e consistência visual, entregando o arquivo editável e uma versão pronta para apresentação.`,
      document: `Faço a padronização de títulos, espaçamento, tabelas e estrutura, além da revisão visual final, entregando o arquivo editável e/ou PDF conforme o escopo.`,
      script: `Primeiro valido entradas e regras do fluxo; depois implemento o script, testo casos de erro e entrego o código organizado com instruções de execução.`,
      translation: `A entrega inclui tradução, revisão de fluidez e consistência de termos. Se houver vocabulário técnico específico, sigo a terminologia fornecida pelo projeto.`,
      copy: `Estruturo a mensagem principal, benefícios, objeções e chamada para ação conforme o objetivo do projeto, entregando o texto pronto para revisão e publicação.`,
      generic: `Primeiro confirmo os dados de entrada e o resultado esperado; depois executo, valido e entrego o material pronto, com uma rodada de pequenos ajustes dentro do escopo.`
    };

    const boundary = risk.startsWith("médio")
      ? `O principal ponto a confirmar antes de iniciar é: ${risk.replace(/^médio\s*[—-]\s*/i, "")}.`
      : risk.startsWith("alto")
        ? `Há um ponto de risco no escopo (${risk.replace(/^alto\s*[—-]\s*/i, "")}); por isso eu alinharia esse item antes da contratação para não prometer algo fora do possível.`
        : "";

    return `${intros[category] || intros.generic}\n\n${bodies[category] || bodies.generic}${boundary ? `\n\n${boundary}` : ""}\n\nPrazo proposto: ${days} dias úteis após receber os materiais/acessos necessários. Valor: R$ ${price}.`;
  }

  function getSavedPlan() {
    return new Promise((resolve) => {
      chrome.storage.local.get([`crs99Plan:${projectKey}`], (result) => {
        resolve(result?.[`crs99Plan:${projectKey}`] || null);
      });
    });
  }

  function savePlan(plan) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [`crs99Plan:${projectKey}`]: plan }, () => resolve());
    });
  }

  function findBidAction() {
    const direct = $$('a[href*="/project/bid/"]');
    if (direct.length) return direct[0];
    return $$('a, button').find((el) => {
      const t = normalize(el.textContent || "");
      return t.includes("enviar proposta") || t.includes("fazer proposta");
    }) || null;
  }

  function fieldContext(el) {
    const parts = [el.name, el.id, el.placeholder, el.getAttribute("aria-label")].filter(Boolean);
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) parts.push(label.textContent || "");
    }
    const parent = el.closest(".form-group, .field, .control-group, .row, div");
    if (parent) parts.push((parent.innerText || "").slice(0, 300));
    return normalize(parts.join(" "));
  }

  function usable(el) {
    if (!el || el.disabled || el.readOnly) return false;
    if (el.type && ["hidden", "submit", "button", "checkbox", "radio", "file"].includes(el.type)) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findField(terms, textarea = false) {
    const candidates = textarea
      ? [...$$('textarea'), ...$$('[contenteditable="true"]')].filter(usable)
      : $$('input, select').filter(usable);
    const ranked = candidates.map((el) => {
      const ctx = fieldContext(el);
      let score = 0;
      terms.forEach((term, i) => { if (ctx.includes(normalize(term))) score += 20 - i; });
      if (textarea && el.tagName === "TEXTAREA") score += 3;
      return { el, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    return ranked[0]?.el || (textarea && candidates.length === 1 ? candidates[0] : null);
  }

  function setValue(el, value) {
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
    ["input", "change", "blur"].forEach(type => el.dispatchEvent(new Event(type, { bubbles: true })));
    return true;
  }

  function updatePanel(plan, message = "") {
    const panel = $("#crs99-copilot");
    if (!panel) return;
    const version = $(".crs99-head span", panel);
    const score = $(".crs99-score", panel);
    const pack = $(".crs99-package", panel);
    const msg = $(".crs99-message", panel);
    if (version) version.textContent = `v${VERSION} · Premium Autopilot`;
    if (score) {
      const label = plan.decision === "attack" ? "ATACAR" : plan.decision === "review" ? "REVISAR" : "PULAR";
      score.textContent = `Aderência local: ${plan.fit.toFixed(1)}/10 · ${label}`;
    }
    if (pack) {
      pack.innerHTML = `<strong>Plano automático preparado</strong><div>R$ ${plan.price} · ${plan.days} dias · ${plan.category}</div><div>Risco: ${plan.risk}</div>`;
    }
    if (msg && message) msg.textContent = message;
  }

  async function autoFillBid(plan) {
    const proposal = findField(["proposta", "mensagem", "descricao", "apresentacao", "detalhes"], true);
    const price = findField(["valor da proposta", "valor", "preco", "orcamento", "oferta", "r$"]);
    const days = findField(["prazo", "dias", "entrega", "tempo"]);
    const filled = [];
    if (proposal && setValue(proposal, plan.proposal)) filled.push("proposta");
    if (price && setValue(price, plan.price)) filled.push("valor");
    if (days && setValue(days, plan.days)) filled.push("prazo");

    updatePanel(plan, filled.length ? `Pronto: ${filled.join(", ")} preenchidos. Revise e clique no botão oficial Enviar proposta.` : "Não consegui localizar os campos automaticamente.");

    const submit = $$('button, input[type="submit"]').find(el => normalize(el.textContent || el.value || "").includes("enviar proposta"));
    if (submit) {
      submit.dataset.crs99Ready = "true";
      submit.title = "CRS 99: proposta preenchida. Clique somente após revisar.";
      submit.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function prepareAndOpenBid() {
    const plan = planForProject();
    updatePanel(plan, plan.decision === "attack" ? "Projeto aprovado pelo Autopilot. Preparando proposta…" : "Projeto não passou no corte automático.");

    if (plan.decision !== "attack") return;
    await savePlan(plan);

    const action = findBidAction();
    if (!action) {
      updatePanel(plan, "Projeto parece bom, mas não encontrei o fluxo atual de envio. Não vou forçar a proposta.");
      return;
    }

    let target = action.href || "";
    if (target) {
      const url = new URL(target, location.origin);
      url.searchParams.set(PREPARE_PARAM, AUTOFILL_VALUE);
      location.href = url.href;
      return;
    }

    action.click();
  }

  async function addManualPrepareButton() {
    if (isBidPage || isUnavailable) return;
    const plan = planForProject();
    updatePanel(plan);
    const actions = $("#crs99-copilot .crs99-actions");
    if (!actions || $(".crs99-autopilot", actions)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "crs99-primary crs99-autopilot";
    button.textContent = plan.decision === "attack" ? "Preparar proposta completa" : plan.decision === "review" ? "Revisar antes de propor" : "Projeto fora do corte";
    button.disabled = plan.decision !== "attack";
    button.addEventListener("click", prepareAndOpenBid);
    actions.prepend(button);
  }

  if (isBidPage) {
    getSavedPlan().then((saved) => {
      if (saved && (mode === AUTOFILL_VALUE || saved.projectKey === projectKey)) autoFillBid(saved);
    });
    return;
  }

  if (mode === PREPARE_VALUE) {
    setTimeout(prepareAndOpenBid, 250);
  } else {
    setTimeout(addManualPrepareButton, 250);
  }
})();