(() => {
  if (window.__CRS99_AUTOPILOT__) return;
  window.__CRS99_AUTOPILOT__ = true;

  const VERSION = "0.5.0";
  const PREPARE_PARAM = "crs99";
  const PREPARE_VALUE = "prepare";
  const AUTOFILL_VALUE = "autofill";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const clamp = (n, min = 0, max = 10) => Math.max(min, Math.min(max, Math.round(n * 10) / 10));

  const path = location.pathname.replace(/\/+$/, "");
  const isBidPage = /\/project\/bid\//.test(path);
  const projectKey = path.replace(/^\/project\/bid\//, "").replace(/^\/project\//, "").split("/")[0];
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
    "sdr", "atender leads", "atender os leads", "follow-up", "follow up", "contornar objecoes", "closer",
    "atendimento comercial", "horario comercial", "ligacoes para clientes", "prospeccao ativa",
    "acompanhar leads", "acompanhar os leads", "vender a proxima etapa", "recuperar pacientes"
  ];
  const hardBlockTerms = [
    "trabalho presencial", "presencial obrigatorio", "advogado", "responsavel tecnico", "contador registrado",
    "erp completo", "aplicativo mobile completo", "app mobile completo"
  ];
  const credibilityTerms = [
    "experiencia comprovada", "experiência comprovada", "portfolio obrigatorio", "portfólio obrigatório",
    "cases obrigatorios", "cases obrigatórios", "resultados comprovados", "case de sucesso", "comprovacao de resultado"
  ];
  const recurrenceTerms = [
    "recorrente", "recorrencia", "toda semana", "semanal", "mensal", "por semana", "demanda continua",
    "longo prazo", "3 a 4", "3-4", "varios projetos", "vários projetos"
  ];
  const hasAny = (terms, text = pageText) => terms.some((term) => text.includes(normalize(term)));
  const isUnavailable = hasAny(unavailableTerms);

  function detectCategory(text) {
    if (hasAny(["excel", "google sheets", "planilha", "csv", "power query", "dashboard", "estoque", "sku"], text)) return "spreadsheet";
    if (hasAny(["landing page", "pagina de vendas", "pagina institucional", "html", "css", "site estatico"], text)) return "landing";
    if (hasAny(["pesquisa", "levantamento", "lista de", "canais no youtube", "encontrar empresas", "coleta de dados"], text)) return "research";
    if (hasAny(["buscar vagas", "candidatura a vagas", "candidatar", "candidaturas", "linkedin", "indeed", "vagas.com"], text)) return "job_application";
    if (hasAny(["powerpoint", "apresentacao", "slides", "canva"], text)) return "presentation";
    if (hasAny(["apa", "abnt", "dissertacao", "dissertação", "tese", "word", "pdf", "formatacao", "diagramacao", "revisao de texto", "correcao de texto", "relatorio"], text)) return "document";
    if (hasAny(["python", "javascript", "script", "automacao web", "web scraping"], text)) return "script";
    if (hasAny(["traducao", "traduzir", "espanhol", "portugues"], text)) return "translation";
    if (hasAny(["vsl", "copy", "copywriting", "descricao de produto", "texto de vendas", "conteudo comercial"], text)) return "copy";
    if (hasAny(["edicao de video", "edição de vídeo", "reels", "video", "vídeo"], text)) return "video";
    return "generic";
  }

  function extractSignals(text) {
    const signalMap = [
      ["estoque", "controle de estoque"], ["sku", "SKU/códigos"], ["fornecedor", "fornecedores"],
      ["dashboard", "dashboard"], ["power query", "Power Query"], ["google sheets", "Google Sheets"],
      ["excel", "Excel"], ["csv", "CSV"], ["validacao", "validação de dados"], ["api", "integração/API"],
      ["responsiv", "responsividade mobile"], ["cta", "CTAs"], ["vsl", "VSL"], ["copy", "copy"],
      ["email", "e-mails públicos"], ["youtube", "YouTube"], ["fontes", "fontes públicas"],
      ["powerpoint", "PowerPoint"], ["canva", "Canva"], ["apa", "APA"], ["abnt", "ABNT"],
      ["pdf", "PDF"], ["word", "Word"], ["python", "Python"], ["javascript", "JavaScript"], ["espanhol", "espanhol"]
    ];
    const found = [];
    for (const [needle, label] of signalMap) {
      if (text.includes(needle) && !found.includes(label)) found.push(label);
      if (found.length >= 6) break;
    }
    return found;
  }

  function extractQuantity(text) {
    const cleaned = text.replace(/\./g, "");
    const match = cleaned.match(/\b(\d{2,6})\s*(?:canais|leads|empresas|contatos|itens|produtos|registros|linhas|vagas|candidaturas)\b/);
    return match ? Number(match[1]) : null;
  }

  function extractCompetition() {
    const patterns = [/(?:propostas?|ofertas?)\s*:?\s*(\d{1,4})/i, /(\d{1,4})\s+(?:propostas?|ofertas?)/i];
    let proposals = null;
    for (const pattern of patterns) {
      const m = pageTextRaw.match(pattern);
      if (m) { proposals = Number(m[1]); break; }
    }
    const topFreelancer = (pageText.match(/top freelancer/g) || []).length;
    const promoted = (pageText.match(/proposta promovida/g) || []).length;
    const interestedMatch = pageTextRaw.match(/(?:interessados?|freelancers interessados?)\s*:?\s*(\d{1,4})/i);
    const interested = interestedMatch ? Number(interestedMatch[1]) : null;
    return { proposals, topFreelancer, promoted, interested };
  }

  function recencyBonus() {
    if (/publicad[oa]\s+(?:ha|há)\s+\d+\s+minut/i.test(pageTextRaw)) return 1.1;
    if (/publicad[oa]\s+(?:ha|há)\s+[1-3]\s+hor/i.test(pageTextRaw)) return 0.9;
    if (/publicad[oa]\s+(?:ha|há)\s+\d+\s+hor/i.test(pageTextRaw) || /publicad[oa]\s+hoje/i.test(pageTextRaw)) return 0.5;
    if (/publicad[oa]\s+(?:ha|há)\s+1\s+dia/i.test(pageTextRaw)) return 0.1;
    if (/publicad[oa]\s+(?:ha|há)\s+[2-9]\s+dias/i.test(pageTextRaw)) return -0.6;
    return 0;
  }

  function missingScope(category) {
    const flags = [];
    if (category === "document") {
      const hasSize = /\b\d+\s*(?:paginas|páginas|laudas|palavras|words)\b/i.test(pageTextRaw);
      if (!hasSize) flags.push("volume do documento não informado");
      if (hasAny(["apa", "abnt", "dissertacao", "dissertação", "tese"]) && !hasAny(["modelo", "manual", "template", "arquivo", "anexo"])) flags.push("modelo/arquivo de referência não visível");
    }
    if (category === "video" && !/\b\d+\s*(?:min|minutos|seg|segundos|videos|vídeos|reels)\b/i.test(pageTextRaw)) flags.push("duração/volume de vídeo não informado");
    if (category === "copy" && hasAny(["vsl"]) && !/\b\d+\s*(?:min|minutos|palavras)\b/i.test(pageTextRaw)) flags.push("duração/tamanho da VSL não informado");
    if (category === "research" && !extractQuantity(pageText) && hasAny(["lista", "canais", "leads", "empresas"])) flags.push("quantidade de registros não informada");
    if (category === "script" && !hasAny(["entrada", "saida", "saída", "fluxo", "regra", "api", "arquivo", "dados"])) flags.push("especificação técnica insuficiente");
    return flags;
  }

  function categoryBase(category) {
    const map = {
      spreadsheet: { technical: 9.0, automation: 9.0, financial: 7.8, effort: 5.5, price: 690, days: 4 },
      landing: { technical: 8.5, automation: 8.5, financial: 7.0, effort: 4.5, price: 490, days: 3 },
      research: { technical: 8.7, automation: 8.5, financial: 6.8, effort: 5.0, price: 390, days: 3 },
      job_application: { technical: 8.0, automation: 7.0, financial: 6.2, effort: 6.0, price: 350, days: 7 },
      presentation: { technical: 8.3, automation: 8.2, financial: 6.3, effort: 4.0, price: 390, days: 3 },
      document: { technical: 8.8, automation: 8.4, financial: 5.8, effort: 3.8, price: 290, days: 2 },
      script: { technical: 8.0, automation: 9.2, financial: 7.8, effort: 6.2, price: 690, days: 4 },
      translation: { technical: 8.2, automation: 9.0, financial: 5.5, effort: 3.5, price: 350, days: 3 },
      copy: { technical: 8.2, automation: 8.5, financial: 7.3, effort: 4.5, price: 390, days: 3 },
      video: { technical: 6.8, automation: 5.5, financial: 6.2, effort: 6.5, price: 390, days: 3 },
      generic: { technical: 5.5, automation: 5.5, financial: 5.0, effort: 6.0, price: 390, days: 3 }
    };
    return { ...map[category] };
  }

  function planForProject() {
    const category = detectCategory(pageText);
    const signals = extractSignals(pageText);
    const quantity = extractQuantity(pageText);
    const competition = extractCompetition();
    const missing = missingScope(category);
    const credibilityRisk = hasAny(credibilityTerms);
    const recurring = hasAny(recurrenceTerms);
    const base = categoryBase(category);

    let technical = base.technical;
    let automation = base.automation;
    let financial = base.financial;
    let effort = base.effort;
    let price = base.price;
    let days = base.days;
    let risk = "baixo";

    if (category === "spreadsheet") {
      if (hasAny(["automacao", "automatizar", "estoque", "dashboard", "power query", "sku"])) { technical += 0.5; price = 790; }
      if (hasAny(["compras", "fornecedor", "cotacao"])) { technical += 0.3; financial += 0.4; }
      if (hasAny(["api", "integracao", "make", "n8n", "webhook"])) { technical -= 0.7; effort += 1.3; price = Math.max(price, 990); days = 5; risk = "médio — validar integração/acessos"; }
    }
    if (category === "landing") {
      if (hasAny(["modelo pronto", "copy pronta", "conteudo pronto", "referencia pronta"])) { technical += 0.4; effort -= 0.7; price = 450; }
      if (hasAny(["wordpress", "woocommerce", "elementor"])) { technical -= 1.0; effort += 1.2; price = 690; days = 4; risk = "médio — CMS/plugin pode ampliar escopo"; }
    }
    if (category === "research" && quantity) {
      if (quantity >= 2000) { price = 1290; days = 5; effort = 7.0; financial += 1.0; risk = "médio — volume e disponibilidade de dados públicos"; }
      else if (quantity >= 1000) { price = 990; days = 5; effort = 6.5; financial += 0.8; }
      else if (quantity >= 500) { price = 690; days = 4; effort = 5.8; }
      if (hasAny(["email", "e-mail"])) risk = "médio — e-mail somente quando público/disponível";
    }
    if (category === "copy" && hasAny(["vsl"])) { financial += 0.5; technical += 0.2; }
    if (category === "script" && hasAny(["login", "captcha", "anti-bot", "burlar", "bypass"])) { technical -= 2.5; effort += 1.5; risk = "alto — restrições técnicas/termos do site"; }
    if (hasAny(humanServiceTerms)) { technical = Math.min(technical, 3.0); automation = Math.min(automation, 3.0); effort = 9.0; risk = "alto — exige atuação humana contínua"; }
    if (hasAny(hardBlockTerms)) { technical = Math.min(technical, 2.0); automation = Math.min(automation, 2.5); effort = 9.5; risk = "alto — fora do escopo operacional"; }
    if (credibilityRisk) risk = risk === "baixo" ? "médio — cliente exige experiência/portfólio que não devemos inventar" : risk;
    if (missing.length) risk = risk === "baixo" ? `médio — escopo incompleto: ${missing.join("; ")}` : risk;
    if (recurring) financial += 1.0;

    let commercial = 6.4 + recencyBonus();
    if (competition.proposals != null) {
      if (competition.proposals <= 4) commercial += 2.0;
      else if (competition.proposals <= 10) commercial += 1.1;
      else if (competition.proposals <= 20) commercial += 0.2;
      else if (competition.proposals <= 35) commercial -= 1.0;
      else if (competition.proposals <= 60) commercial -= 1.8;
      else commercial -= 2.6;
    }
    commercial -= Math.min(1.8, competition.topFreelancer * 0.45);
    commercial -= Math.min(1.0, competition.promoted * 0.3);
    if (credibilityRisk) commercial -= 1.6;
    if (pageText.includes("projeto exclusivo") || pageText.includes("exclusivo para")) commercial += 0.7;

    technical = clamp(technical);
    commercial = clamp(commercial);
    financial = clamp(financial);
    automation = clamp(automation);
    effort = clamp(effort);
    const recurrence = recurring ? 8.5 : 4.5;
    const scopePenalty = missing.length ? Math.min(1.5, 0.5 + missing.length * 0.4) : 0;
    const credibilityPenalty = credibilityRisk ? 1.1 : 0;
    const riskPenalty = risk.startsWith("alto") ? 1.4 : risk.startsWith("médio") ? 0.5 : 0;
    let priority = (technical * 0.28) + (commercial * 0.30) + (financial * 0.16) + (automation * 0.14) + (recurrence * 0.07) + ((10 - effort) * 0.05) - scopePenalty - credibilityPenalty - riskPenalty;
    if (isUnavailable) priority = 0;
    priority = clamp(priority);

    let decision = priority >= 7.0 && technical >= 7.0 ? "priority" : priority >= 5.2 && technical >= 6.0 ? "opportunistic" : "skip";
    if (missing.length && decision === "priority") decision = "review";
    if (credibilityRisk && decision === "priority") decision = "review";
    if (risk.startsWith("alto")) decision = "skip";
    if (isUnavailable) decision = "skip";

    const strategy = commercial <= 4.5 ? "agressiva" : commercial >= 7.5 && financial >= 7 ? "premium" : "normal";
    if (strategy === "agressiva") price = Math.round(price * 0.88 / 10) * 10;
    if (strategy === "premium") price = Math.round(price * 1.10 / 10) * 10;
    const priceMin = Math.max(120, Math.round(price * 0.85 / 10) * 10);
    const priceMax = Math.round(price * 1.20 / 10) * 10;

    return {
      version: VERSION, projectKey, title, category, signals, quantity, competition, missing,
      technical, commercial, financial, automation, effort, recurrence, priority,
      credibilityRisk, decision, strategy, price, priceMin, priceMax, days, risk,
      proposal: buildProposal({ category, signals, quantity, price, days, risk, missing, credibilityRisk }),
      generatedAt: new Date().toISOString(), sourceUrl: location.href.split("?")[0].split("#")[0]
    };
  }

  function buildProposal({ category, signals, quantity, price, days, risk, missing, credibilityRisk }) {
    const focus = signals.length ? signals.slice(0, 4).join(", ") : "os pontos descritos no escopo";
    const safeTitle = title.replace(/\s+/g, " ").trim();
    const intros = {
      spreadsheet: `Olá! Li o escopo de “${safeTitle}”. Posso estruturar a solução sem mudar a lógica principal do processo, priorizando ${focus}.`,
      landing: `Olá! Li o escopo de “${safeTitle}”. Posso montar a página de forma responsiva e organizada, seguindo o material fornecido e priorizando ${focus}.`,
      research: `Olá! Li o escopo de “${safeTitle}”. Posso organizar a pesquisa em uma planilha limpa, com critérios consistentes, fontes públicas e campos separados para validação.`,
      job_application: `Olá! Li o escopo de “${safeTitle}”. Posso executar a busca e candidatura de forma organizada, seguindo os critérios informados e mantendo um registro claro das vagas trabalhadas.`,
      presentation: `Olá! Li o escopo de “${safeTitle}”. Posso transformar o conteúdo em uma apresentação clara, consistente e pronta para uso.`,
      document: `Olá! Li o escopo de “${safeTitle}”. Posso organizar, revisar e padronizar o material conforme os critérios solicitados, mantendo o arquivo editável e consistente.`,
      script: `Olá! Li o escopo de “${safeTitle}”. Posso desenvolver a automação/script com foco no fluxo descrito, validação de entradas e uma saída simples de manter.`,
      translation: `Olá! Li o escopo de “${safeTitle}”. Posso fazer a tradução preservando sentido, tom e naturalidade, com revisão final antes da entrega.`,
      copy: `Olá! Li o escopo de “${safeTitle}”. Posso escrever e estruturar o texto com foco em clareza, retenção e intenção comercial, respeitando o posicionamento informado.`,
      video: `Olá! Li o escopo de “${safeTitle}”. Posso organizar a edição conforme o formato solicitado, mantendo ritmo, legibilidade e consistência visual.`,
      generic: `Olá! Li com atenção o escopo de “${safeTitle}”. Posso executar a entrega de forma objetiva, validando primeiro os requisitos e mantendo o trabalho dentro do solicitado.`
    };
    const bodies = {
      spreadsheet: `Meu plano é revisar a estrutura atual, implementar fórmulas/automação, testar dependências, proteger pontos sensíveis e entregar o arquivo organizado com uma orientação curta de uso.`,
      landing: `Vou organizar estrutura, seções, CTAs e versão mobile, revisar o comportamento responsivo e entregar os arquivos prontos dentro do escopo combinado.`,
      research: `A entrega terá dados em colunas separadas, critérios verificáveis e indicação clara quando alguma informação não estiver publicamente disponível — sem preencher dados por suposição.${quantity ? ` Para aproximadamente ${quantity} registros, farei validação em lotes.` : ""}`,
      job_application: `Posso trabalhar por um período-piloto com limite de candidaturas, registrar vaga, empresa, link e status, e aplicar somente quando os requisitos principais forem compatíveis com o perfil definido.`,
      presentation: `Organizo hierarquia, títulos, mensagens principais e consistência visual, entregando o arquivo editável e pronto para apresentação.`,
      document: `Faço a revisão e padronização de estrutura, títulos, referências, espaçamento e tabelas conforme o padrão solicitado, entregando o arquivo editável.`,
      script: `Primeiro valido entradas e regras do fluxo; depois implemento o script, testo casos de erro e entrego o código organizado com instruções de execução.`,
      translation: `A entrega inclui tradução, revisão de fluidez e consistência de termos.`,
      copy: `Estruturo abertura, desenvolvimento, objeções e chamada para ação conforme o objetivo do projeto, entregando o texto pronto para revisão.`,
      video: `Organizo cortes, ritmo, textos e transições conforme o material e a duração combinados, mantendo o projeto dentro do volume definido.`,
      generic: `Primeiro confirmo os dados de entrada e o resultado esperado; depois executo, valido e entrego o material pronto.`
    };
    const transparency = credibilityRisk ? `\n\nSobre experiência/portfólio: não vou atribuir a mim resultados ou cases que não possuo. Posso, se for útil, demonstrar a abordagem em uma amostra/spec curta antes de ampliar o trabalho.` : "";
    const boundary = missing.length ? `\n\nAntes de fechar o escopo definitivo, preciso confirmar: ${missing.join("; ")}.` : risk.startsWith("médio") ? `\n\nPonto a confirmar antes do início: ${risk.replace(/^médio\s*[—-]\s*/i, "")}.` : "";
    const commercial = missing.length ? `\n\nComo o volume ainda não está totalmente definido, a faixa preliminar é R$ ${Math.max(120, Math.round(price * 0.85 / 10) * 10)}–${Math.round(price * 1.20 / 10) * 10}; confirmo o valor final após visualizar o material.` : `\n\nPrazo proposto: ${days} dias úteis após receber os materiais/acessos necessários. Valor: R$ ${price}.`;
    return `${intros[category] || intros.generic}\n\n${bodies[category] || bodies.generic}${transparency}${boundary}${commercial}`;
  }

  function getSavedPlan() {
    return new Promise((resolve) => chrome.storage.local.get([`crs99Plan:${projectKey}`], (result) => resolve(result?.[`crs99Plan:${projectKey}`] || null)));
  }

  function savePlan(plan) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["crs99History"], (result) => {
        const history = Array.isArray(result.crs99History) ? result.crs99History : [];
        const entry = { projectKey: plan.projectKey, url: plan.sourceUrl, title: plan.title, analyzedAt: plan.generatedAt, priority: plan.priority, decision: plan.decision, technical: plan.technical, commercial: plan.commercial, financial: plan.financial, automation: plan.automation, effort: plan.effort, proposals: plan.competition?.proposals ?? null, price: plan.price, status: "analyzed" };
        const next = [entry, ...history.filter((x) => x.projectKey !== plan.projectKey)].slice(0, 200);
        chrome.storage.local.set({ [`crs99Plan:${projectKey}`]: plan, crs99History: next }, () => resolve());
      });
    });
  }

  function findBidAction() {
    const direct = $$('a[href*="/project/bid/"]');
    if (direct.length) return direct[0];
    return $$('a, button').find((el) => { const t = normalize(el.textContent || ""); return t.includes("enviar proposta") || t.includes("fazer proposta"); }) || null;
  }

  function fieldContext(el) {
    const parts = [el.name, el.id, el.placeholder, el.getAttribute("aria-label")].filter(Boolean);
    if (el.id) { const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (label) parts.push(label.textContent || ""); }
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
    const candidates = textarea ? [...$$('textarea'), ...$$('[contenteditable="true"]')].filter(usable) : $$('input, select').filter(usable);
    const ranked = candidates.map((el) => { const ctx = fieldContext(el); let score = 0; terms.forEach((term, i) => { if (ctx.includes(normalize(term))) score += 20 - i; }); if (textarea && el.tagName === "TEXTAREA") score += 3; return { el, score }; }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    return ranked[0]?.el || (textarea && candidates.length === 1 ? candidates[0] : null);
  }

  function setValue(el, value) {
    if (!el) return false;
    if (el.isContentEditable) { el.focus(); el.textContent = String(value); }
    else {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      if (descriptor?.set) descriptor.set.call(el, String(value)); else el.value = String(value);
    }
    ["input", "change", "blur"].forEach((type) => el.dispatchEvent(new Event(type, { bubbles: true })));
    return true;
  }

  function updatePanel(plan, message = "") {
    const panel = $("#crs99-copilot");
    if (!panel) return;
    const version = $(".crs99-head span", panel);
    const score = $(".crs99-score", panel);
    const pack = $(".crs99-package", panel);
    const msg = $(".crs99-message", panel);
    const labelMap = { priority: "CANDIDATURA PRIORITÁRIA", opportunistic: "CANDIDATURA OPORTUNISTA", review: "REVISAR ESCOPO", skip: "IGNORAR" };
    const effortLabel = plan.effort <= 4 ? "baixo" : plan.effort <= 6.5 ? "médio" : "alto";
    if (version) version.textContent = `v${VERSION} · Decision Engine`;
    if (score) score.innerHTML = `<strong>Prioridade: ${plan.priority.toFixed(1)}/10 — ${labelMap[plan.decision] || plan.decision}</strong><br>Técnica ${plan.technical.toFixed(1)} · Comercial ${plan.commercial.toFixed(1)} · Financeiro ${plan.financial.toFixed(1)} · Automação ${plan.automation.toFixed(1)}<br>Esforço: ${effortLabel}${plan.competition?.proposals != null ? ` · Concorrência: ${plan.competition.proposals} propostas` : ""}`;
    if (pack) {
      const scope = plan.missing.length ? `<div>⚠️ Escopo incompleto: ${plan.missing.join("; ")}</div>` : "";
      const credibility = plan.credibilityRisk ? `<div>⚠️ Credibilidade: não inventar experiência/cases.</div>` : "";
      pack.innerHTML = `<strong>Oferta sugerida</strong><div>R$ ${plan.priceMin}–${plan.priceMax} · sugerido R$ ${plan.price} · ${plan.days} dias</div><div>Estratégia: ${plan.strategy} · Risco: ${plan.risk}</div>${scope}${credibility}`;
    }
    if (msg && message) msg.textContent = message;
  }

  async function autoFillBid(plan) {
    if (plan.decision === "review" || plan.decision === "skip") { updatePanel(plan, "Não preenchi automaticamente: o projeto exige revisão de escopo/credibilidade antes de comprometer preço."); return; }
    const proposal = findField(["proposta", "mensagem", "descricao", "apresentacao", "detalhes"], true);
    const price = findField(["valor da proposta", "valor", "preco", "orcamento", "oferta", "r$"]);
    const days = findField(["prazo", "dias", "entrega", "tempo"]);
    const filled = [];
    if (proposal && setValue(proposal, plan.proposal)) filled.push("proposta");
    if (price && setValue(price, plan.price)) filled.push("valor");
    if (days && setValue(days, plan.days)) filled.push("prazo");
    updatePanel(plan, filled.length ? `Pronto: ${filled.join(", ")} preenchidos. Revise e clique no botão oficial Enviar proposta.` : "Não consegui localizar os campos automaticamente.");
    const submit = $$('button, input[type="submit"]').find((el) => normalize(el.textContent || el.value || "").includes("enviar proposta"));
    if (submit) { submit.dataset.crs99Ready = "true"; submit.title = "CRS 99: proposta preenchida. Clique somente após revisar."; submit.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }

  async function prepareAndOpenBid() {
    const plan = planForProject();
    await savePlan(plan);
    updatePanel(plan, plan.decision === "priority" || plan.decision === "opportunistic" ? "Candidatura aprovada. Preparando proposta…" : "Projeto exige revisão ou não passou no corte automático.");
    if (!["priority", "opportunistic"].includes(plan.decision)) return;
    const action = findBidAction();
    if (!action) { updatePanel(plan, "Não encontrei o fluxo atual de envio. Não vou forçar a proposta."); return; }
    if (action.href) { const url = new URL(action.href, location.origin); url.searchParams.set(PREPARE_PARAM, AUTOFILL_VALUE); location.href = url.href; return; }
    action.click();
  }

  async function addManualPrepareButton() {
    if (isBidPage || isUnavailable) return;
    const plan = planForProject();
    await savePlan(plan);
    updatePanel(plan);
    const actions = $("#crs99-copilot .crs99-actions");
    if (!actions || $(".crs99-autopilot", actions)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "crs99-primary crs99-autopilot";
    button.textContent = plan.decision === "priority" ? "Preparar proposta prioritária" : plan.decision === "opportunistic" ? "Preparar proposta oportunista" : plan.decision === "review" ? "Revisar escopo antes" : "Projeto fora do corte";
    button.disabled = !["priority", "opportunistic"].includes(plan.decision);
    button.addEventListener("click", prepareAndOpenBid);
    actions.prepend(button);
  }

  if (isBidPage) {
    getSavedPlan().then((saved) => { if (saved && (mode === AUTOFILL_VALUE || saved.projectKey === projectKey)) autoFillBid(saved); });
    return;
  }
  if (mode === PREPARE_VALUE) setTimeout(prepareAndOpenBid, 250);
  else setTimeout(addManualPrepareButton, 250);
})();