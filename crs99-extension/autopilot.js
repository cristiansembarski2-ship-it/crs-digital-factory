(() => {
  if (window.__CRS99_AUTOPILOT__) return;
  window.__CRS99_AUTOPILOT__ = true;

  const VERSION = "0.6.0";
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
  const hardBlockTerms = [
    "presencial obrigatorio", "trabalho presencial obrigatorio", "responsavel tecnico obrigatorio",
    "crc obrigatorio", "oab obrigatoria", "crea obrigatorio", "crm obrigatorio", "crp obrigatorio",
    "burlar captcha", "bypass anti-bot", "invadir sistema", "hackear conta"
  ];
  const manualHeavyTerms = [
    "sdr", "atender leads", "atender os leads", "follow-up", "follow up", "contornar objecoes", "closer",
    "atendimento comercial", "ligacoes para clientes", "prospeccao ativa", "acompanhar leads", "recuperar pacientes",
    "atendimento ao cliente", "suporte ao cliente", "responder whatsapp", "responder mensagens"
  ];
  const credibilityTerms = [
    "experiencia comprovada", "portfolio obrigatorio", "portfólio obrigatório", "cases obrigatorios", "cases obrigatórios",
    "resultados comprovados", "case de sucesso", "comprovacao de resultado", "comprovação de resultado"
  ];
  const recurrenceTerms = [
    "recorrente", "recorrencia", "recorrência", "toda semana", "semanal", "mensal", "por semana",
    "demanda continua", "demanda contínua", "longo prazo", "varios projetos", "vários projetos", "3 a 4", "3-4"
  ];
  const hasAny = (terms, text = pageText) => terms.some((term) => text.includes(normalize(term)));
  const isUnavailable = hasAny(unavailableTerms);
  const hardBlocked = hasAny(hardBlockTerms);

  function detectCategory(text) {
    if (hasAny(["excel", "google sheets", "planilha", "csv", "power query", "dashboard", "estoque", "sku"], text)) return "spreadsheet";
    if (hasAny(["landing page", "pagina de vendas", "site institucional", "html", "css", "site estatico", "elementor", "wordpress"], text)) return "landing";
    if (hasAny(["pesquisa", "levantamento", "lista de", "canais no youtube", "encontrar empresas", "coleta de dados", "leads"], text)) return "research";
    if (hasAny(["buscar vagas", "candidatura a vagas", "candidatar", "candidaturas", "linkedin", "indeed", "vagas.com"], text)) return "job_application";
    if (hasAny(["data entry", "digitacao", "digitação", "cadastro de produtos", "cadastro", "copiar e colar", "preenchimento de dados"], text)) return "data_entry";
    if (hasAny(["powerpoint", "apresentacao", "apresentação", "slides", "pitch deck"], text)) return "presentation";
    if (hasAny(["canva", "criativo", "post instagram", "carrossel", "banner", "design para redes"], text)) return "design_canva";
    if (hasAny(["apa", "abnt", "dissertacao", "dissertação", "tese", "word", "pdf", "formatacao", "formatação", "diagramacao", "diagramação", "revisao de texto", "correcao de texto", "transcricao", "transcrição", "relatorio"], text)) return "document";
    if (hasAny(["python", "javascript", "script", "automacao web", "automação web", "web scraping", "api", "webhook", "n8n", "make"], text)) return "script";
    if (hasAny(["traducao", "tradução", "traduzir", "espanhol", "portugues", "português"], text)) return "translation";
    if (hasAny(["vsl", "copy", "copywriting", "redacao", "redação", "roteiro", "descricao de produto", "texto de vendas", "conteudo comercial", "conteúdo comercial", "seo"], text)) return "copy";
    if (hasAny(["edicao de video", "edição de vídeo", "reels", "video", "vídeo", "capcut", "shorts"], text)) return "video";
    if (hasAny(["social media", "instagram", "tiktok", "calendario editorial", "calendário editorial", "legendas para posts"], text)) return "social_content";
    if (hasAny(["catalogo", "catálogo", "woocommerce", "loja virtual", "cadastro ecommerce", "e-commerce"], text)) return "catalog";
    return "generic";
  }

  function extractSignals(text) {
    const signalMap = [
      ["excel", "Excel"], ["google sheets", "Google Sheets"], ["dashboard", "dashboard"], ["estoque", "estoque"],
      ["sku", "SKU"], ["api", "API"], ["python", "Python"], ["javascript", "JavaScript"], ["wordpress", "WordPress"],
      ["canva", "Canva"], ["vsl", "VSL"], ["copy", "copy"], ["apa", "APA"], ["abnt", "ABNT"], ["pdf", "PDF"],
      ["youtube", "YouTube"], ["email", "e-mail"], ["espanhol", "espanhol"], ["reels", "Reels"], ["seo", "SEO"]
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
    const match = cleaned.match(/\b(\d{2,6})\s*(?:canais|leads|empresas|contatos|itens|produtos|registros|linhas|vagas|candidaturas|posts|videos|vídeos|paginas|páginas)\b/);
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
    return { proposals, topFreelancer, promoted, interested: interestedMatch ? Number(interestedMatch[1]) : null };
  }

  function recencyBonus() {
    if (/publicad[oa]\s+(?:ha|há)\s+\d+\s+minut/i.test(pageTextRaw)) return 1.5;
    if (/publicad[oa]\s+(?:ha|há)\s+[1-3]\s+hor/i.test(pageTextRaw)) return 1.2;
    if (/publicad[oa]\s+(?:ha|há)\s+\d+\s+hor/i.test(pageTextRaw) || /publicad[oa]\s+hoje/i.test(pageTextRaw)) return 0.7;
    if (/publicad[oa]\s+(?:ha|há)\s+1\s+dia/i.test(pageTextRaw)) return 0.1;
    if (/publicad[oa]\s+(?:ha|há)\s+[2-9]\s+dias/i.test(pageTextRaw)) return -0.5;
    return 0;
  }

  function missingScope(category) {
    const flags = [];
    if (category === "document" && !/\b\d+\s*(?:paginas|páginas|laudas|palavras|words)\b/i.test(pageTextRaw)) flags.push("volume do documento não informado");
    if (category === "video" && !/\b\d+\s*(?:min|minutos|seg|segundos|videos|vídeos|reels)\b/i.test(pageTextRaw)) flags.push("duração/volume de vídeo não informado");
    if (category === "copy" && hasAny(["vsl"]) && !/\b\d+\s*(?:min|minutos|palavras)\b/i.test(pageTextRaw)) flags.push("duração/tamanho da VSL não informado");
    if (category === "research" && !extractQuantity(pageText) && hasAny(["lista", "canais", "leads", "empresas"])) flags.push("quantidade de registros não informada");
    if (category === "data_entry" && !extractQuantity(pageText)) flags.push("volume de registros não informado");
    if (category === "script" && !hasAny(["entrada", "saida", "saída", "fluxo", "regra", "api", "arquivo", "dados", "exemplo"])) flags.push("especificação técnica parcial");
    return flags;
  }

  function categoryBase(category) {
    const map = {
      spreadsheet: { technical: 9.1, automation: 9.1, financial: 7.8, effort: 5.5, price: 690, days: 4 },
      landing: { technical: 8.4, automation: 8.3, financial: 7.1, effort: 5.0, price: 490, days: 3 },
      research: { technical: 8.8, automation: 8.6, financial: 6.8, effort: 5.4, price: 390, days: 3 },
      job_application: { technical: 8.1, automation: 7.0, financial: 6.1, effort: 6.2, price: 350, days: 7 },
      data_entry: { technical: 9.0, automation: 8.4, financial: 5.8, effort: 4.8, price: 290, days: 3 },
      presentation: { technical: 8.5, automation: 8.4, financial: 6.4, effort: 4.5, price: 390, days: 3 },
      design_canva: { technical: 8.1, automation: 7.7, financial: 6.2, effort: 4.8, price: 350, days: 3 },
      document: { technical: 9.0, automation: 8.6, financial: 5.9, effort: 4.0, price: 290, days: 2 },
      script: { technical: 8.2, automation: 9.2, financial: 7.9, effort: 6.6, price: 690, days: 4 },
      translation: { technical: 8.5, automation: 9.2, financial: 5.6, effort: 3.8, price: 350, days: 3 },
      copy: { technical: 8.5, automation: 8.7, financial: 7.4, effort: 4.8, price: 390, days: 3 },
      video: { technical: 7.2, automation: 6.0, financial: 6.4, effort: 6.8, price: 390, days: 3 },
      social_content: { technical: 8.0, automation: 8.0, financial: 6.4, effort: 5.5, price: 350, days: 3 },
      catalog: { technical: 8.1, automation: 8.0, financial: 6.4, effort: 5.8, price: 390, days: 4 },
      generic: { technical: 6.5, automation: 6.5, financial: 5.5, effort: 6.0, price: 350, days: 3 }
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
    const manualHeavy = hasAny(manualHeavyTerms);
    const base = categoryBase(category);

    let technical = base.technical;
    let automation = base.automation;
    let financial = base.financial;
    let effort = base.effort;
    let price = base.price;
    let days = base.days;
    let risk = "baixo";

    if (category === "spreadsheet" && hasAny(["automacao", "automatizar", "estoque", "dashboard", "power query", "sku"])) { technical += 0.4; price = 790; }
    if (category === "spreadsheet" && hasAny(["compras", "fornecedor", "cotacao"])) { technical += 0.3; financial += 0.4; }
    if (category === "landing" && hasAny(["modelo pronto", "copy pronta", "conteudo pronto", "referencia pronta"])) { technical += 0.4; effort -= 0.8; price = 450; }
    if (category === "landing" && hasAny(["wordpress", "woocommerce", "elementor"])) { effort += 0.7; price = 590; days = 4; }
    if (category === "script" && hasAny(["api", "integracao", "integração", "n8n", "make", "webhook"])) { effort += 0.9; price = Math.max(price, 790); days = 5; }
    if (category === "research" && quantity) {
      if (quantity >= 2000) { price = 1290; days = 5; effort = 7.0; financial += 1.0; risk = "médio — volume alto; validar disponibilidade dos dados"; }
      else if (quantity >= 1000) { price = 890; days = 5; effort = 6.5; financial += 0.7; }
      else if (quantity >= 500) { price = 590; days = 4; effort = 5.8; }
    }
    if (category === "data_entry" && quantity && quantity >= 1000) { price = 590; days = 5; effort = 6.5; }
    if (category === "copy" && hasAny(["vsl"])) { financial += 0.6; technical += 0.2; }
    if (recurring) financial += 1.2;
    if (manualHeavy) {
      automation = Math.min(automation, 4.0);
      effort = Math.max(effort, 8.2);
      risk = "médio — exige participação humana recorrente; propor piloto limitado";
    }
    if (credibilityRisk && risk === "baixo") risk = "médio — cliente pede experiência/cases; responder com transparência e teste/spec";
    if (missing.length && risk === "baixo") risk = `médio — escopo parcial: ${missing.join("; ")}`;
    if (hardBlocked) risk = "alto — requisito realmente incompatível com nossa operação";

    let commercial = 6.2 + recencyBonus();
    if (competition.proposals != null) {
      if (competition.proposals <= 3) commercial += 2.5;
      else if (competition.proposals <= 7) commercial += 1.9;
      else if (competition.proposals <= 15) commercial += 1.2;
      else if (competition.proposals <= 25) commercial += 0.5;
      else if (competition.proposals <= 40) commercial -= 0.2;
      else if (competition.proposals <= 70) commercial -= 0.8;
      else commercial -= 1.4;
    }
    commercial -= Math.min(1.0, competition.topFreelancer * 0.25);
    commercial -= Math.min(0.5, competition.promoted * 0.15);
    if (credibilityRisk) commercial -= 0.7;
    if (pageText.includes("projeto exclusivo") || pageText.includes("exclusivo para")) commercial += 0.9;

    technical = clamp(technical);
    commercial = clamp(commercial);
    financial = clamp(financial);
    automation = clamp(automation);
    effort = clamp(effort);
    const recurrence = recurring ? 8.8 : 4.8;
    const scopePenalty = Math.min(0.5, missing.length * 0.2);
    const credibilityPenalty = credibilityRisk ? 0.4 : 0;
    const manualPenalty = manualHeavy ? 0.3 : 0;
    const riskPenalty = risk.startsWith("alto") ? 0.8 : risk.startsWith("médio") ? 0.2 : 0;

    let priority = (technical * 0.24) + (commercial * 0.32) + (financial * 0.17) + (automation * 0.11) + (recurrence * 0.08) + ((10 - effort) * 0.08) - scopePenalty - credibilityPenalty - manualPenalty - riskPenalty;
    if (isUnavailable || hardBlocked) priority = 0;
    priority = clamp(priority);

    let decision;
    if (isUnavailable || hardBlocked) decision = "skip";
    else if (priority >= 6.7 && technical >= 6.0) decision = "priority";
    else if (priority >= 4.7 && technical >= 4.5) decision = "opportunistic";
    else decision = "review";

    if (credibilityRisk && decision === "priority") decision = "opportunistic";
    if (manualHeavy && decision === "priority") decision = "opportunistic";

    const strategy = commercial <= 5.3 ? "entrada" : commercial >= 7.8 && financial >= 7 ? "premium" : "normal";
    if (strategy === "entrada") price = Math.max(150, Math.round(price * 0.90 / 10) * 10);
    if (strategy === "premium") price = Math.round(price * 1.08 / 10) * 10;
    const priceMin = Math.max(120, Math.round(price * 0.85 / 10) * 10);
    const priceMax = Math.round(price * 1.20 / 10) * 10;

    const promote = priority >= 7.5 && commercial >= 6.8 && financial >= 6.3 && !credibilityRisk && missing.length === 0 && (competition.proposals == null || competition.proposals <= 25);

    return {
      version: VERSION, validationMode: true, projectKey, title, category, signals, quantity, competition, missing,
      technical, commercial, financial, automation, effort, recurrence, priority,
      credibilityRisk, manualHeavy, decision, strategy, promote, price, priceMin, priceMax, days, risk,
      proposal: buildProposal({ category, signals, quantity, price, days, risk, missing, credibilityRisk, manualHeavy }),
      generatedAt: new Date().toISOString(), sourceUrl: location.href.split("?")[0].split("#")[0]
    };
  }

  function buildProposal({ category, signals, quantity, price, days, risk, missing, credibilityRisk, manualHeavy }) {
    const focus = signals.length ? signals.slice(0, 4).join(", ") : "os pontos descritos no escopo";
    const safeTitle = title.replace(/\s+/g, " ").trim();
    const intros = {
      spreadsheet: `Olá! Li o escopo de “${safeTitle}”. Posso estruturar e validar a solução priorizando ${focus}.`,
      landing: `Olá! Li o escopo de “${safeTitle}”. Posso desenvolver a página de forma responsiva e organizada, seguindo o material e a referência fornecidos.`,
      research: `Olá! Li o escopo de “${safeTitle}”. Posso executar a pesquisa com critérios consistentes e entregar os dados organizados para validação.`,
      job_application: `Olá! Li o escopo de “${safeTitle}”. Posso executar a busca e candidatura de forma organizada, seguindo os critérios informados e registrando cada ação.`,
      data_entry: `Olá! Li o escopo de “${safeTitle}”. Posso organizar e preencher os dados com padronização, revisão e controle de inconsistências.`,
      presentation: `Olá! Li o escopo de “${safeTitle}”. Posso transformar o conteúdo em uma apresentação clara, consistente e editável.`,
      design_canva: `Olá! Li o escopo de “${safeTitle}”. Posso criar e organizar as peças no formato solicitado, mantendo consistência visual e arquivos editáveis quando aplicável.`,
      document: `Olá! Li o escopo de “${safeTitle}”. Posso revisar, organizar e padronizar o material conforme os critérios solicitados.`,
      script: `Olá! Li o escopo de “${safeTitle}”. Posso desenvolver a automação/script com foco no fluxo descrito, validação de entradas e uma saída simples de manter.`,
      translation: `Olá! Li o escopo de “${safeTitle}”. Posso fazer a tradução preservando sentido, tom e naturalidade, com revisão final.`,
      copy: `Olá! Li o escopo de “${safeTitle}”. Posso escrever e estruturar o texto com foco em clareza, retenção e intenção comercial.`,
      video: `Olá! Li o escopo de “${safeTitle}”. Posso organizar a edição mantendo ritmo, legibilidade e consistência visual.`,
      social_content: `Olá! Li o escopo de “${safeTitle}”. Posso estruturar o conteúdo e as peças com foco no objetivo informado e consistência de publicação.`,
      catalog: `Olá! Li o escopo de “${safeTitle}”. Posso organizar o catálogo/cadastro com padronização de campos, revisão e consistência entre produtos.`,
      generic: `Olá! Li com atenção o escopo de “${safeTitle}”. Posso executar a entrega de forma objetiva, validando requisitos e mantendo o trabalho dentro do combinado.`
    };
    const bodies = {
      spreadsheet: `Reviso a estrutura, implemento fórmulas/automação, testo dependências e entrego o arquivo organizado com orientação curta de uso.`,
      landing: `Organizo estrutura, seções, CTAs e versão mobile, testo a responsividade e entrego o material pronto dentro do escopo combinado.`,
      research: `A entrega terá dados em colunas separadas, critérios verificáveis e indicação clara quando alguma informação não estiver publicamente disponível.${quantity ? ` Para aproximadamente ${quantity} registros, farei a validação em lotes.` : ""}`,
      job_application: `Posso começar com um piloto de 7 dias ou um lote definido de candidaturas, registrando vaga, empresa, link e status para você acompanhar.`,
      data_entry: `Faço o preenchimento em lotes, padronizo formatos e reviso duplicidades/erros antes da entrega.`,
      presentation: `Organizo hierarquia, títulos, mensagens principais e consistência visual, entregando o arquivo editável e pronto para apresentação.`,
      design_canva: `Estruturo layout, hierarquia e consistência visual, entregando as peças no formato combinado e com uma rodada de pequenos ajustes.`,
      document: `Faço revisão e padronização de estrutura, títulos, referências, espaçamento e tabelas conforme o padrão solicitado.`,
      script: `Primeiro valido entradas e regras; depois implemento, testo casos de erro e entrego o código organizado com instruções de execução.`,
      translation: `A entrega inclui tradução, revisão de fluidez e consistência de termos.`,
      copy: `Estruturo abertura, desenvolvimento, objeções e chamada para ação conforme o objetivo do projeto, entregando o texto pronto para revisão.`,
      video: `Organizo cortes, ritmo, textos e transições conforme o material e o volume combinado.`,
      social_content: `Posso organizar pauta, textos e peças em um lote inicial para validar direção antes de ampliar a recorrência.`,
      catalog: `Padronizo títulos, descrições, categorias e demais campos combinados, com revisão de inconsistências antes da entrega.`,
      generic: `Primeiro confirmo entradas e resultado esperado; depois executo, valido e entrego o material pronto.`
    };
    const transparency = credibilityRisk ? `\n\nSobre experiência/portfólio: não vou atribuir a mim cases ou resultados que não possuo. Posso demonstrar a abordagem em uma amostra/spec curta ou iniciar por um piloto menor.` : "";
    const manual = manualHeavy ? `\n\nComo há uma parte operacional/humana recorrente, proponho começar com um piloto limitado para validar volume, rotina e resultado antes de ampliar.` : "";
    const boundary = missing.length ? `\n\nAlguns pontos ainda precisam ser confirmados (${missing.join("; ")}), mas isso não impede iniciar o alinhamento. O valor abaixo é uma referência inicial para o escopo descrito.` : risk.startsWith("médio") ? `\n\nPonto a alinhar antes do início: ${risk.replace(/^médio\s*[—-]\s*/i, "")}.` : "";
    return `${intros[category] || intros.generic}\n\n${bodies[category] || bodies.generic}${transparency}${manual}${boundary}\n\nPrazo estimado: ${days} dias úteis após receber os materiais/acessos necessários. Proposta inicial: R$ ${price}.`;
  }

  function getSavedPlan() {
    return new Promise((resolve) => chrome.storage.local.get([`crs99Plan:${projectKey}`], (result) => resolve(result?.[`crs99Plan:${projectKey}`] || null)));
  }

  function savePlan(plan) {
    return new Promise((resolve) => {
      chrome.storage.local.get(["crs99History"], (result) => {
        const history = Array.isArray(result.crs99History) ? result.crs99History : [];
        const entry = {
          projectKey: plan.projectKey, url: plan.sourceUrl, title: plan.title, analyzedAt: plan.generatedAt,
          priority: plan.priority, decision: plan.decision, technical: plan.technical, commercial: plan.commercial,
          financial: plan.financial, automation: plan.automation, effort: plan.effort,
          proposals: plan.competition?.proposals ?? null, price: plan.price, status: "analyzed"
        };
        const next = [entry, ...history.filter((x) => x.projectKey !== plan.projectKey)].slice(0, 300);
        chrome.storage.local.set({ [`crs99Plan:${projectKey}`]: plan, crs99History: next }, () => resolve());
      });
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
    const candidates = textarea ? [...$$('textarea'), ...$$('[contenteditable="true"]')].filter(usable) : $$('input, select').filter(usable);
    const ranked = candidates.map((el) => {
      const ctx = fieldContext(el);
      let score = 0;
      terms.forEach((term, i) => { if (ctx.includes(normalize(term))) score += 20 - i; });
      if (textarea && el.tagName === "TEXTAREA") score += 3;
      return { el, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
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
    const labelMap = { priority: "PRIORITÁRIA", opportunistic: "ENVIAR / OPORTUNISTA", review: "VALIDAR COM RESSALVA", skip: "IGNORAR" };
    const effortLabel = plan.effort <= 4 ? "baixo" : plan.effort <= 7 ? "médio" : "alto";
    if (version) version.textContent = `v${VERSION} · Modo Validação`;
    if (score) score.innerHTML = `<strong>Prioridade: ${plan.priority.toFixed(1)}/10 — ${labelMap[plan.decision] || plan.decision}</strong><br>Técnica ${plan.technical.toFixed(1)} · Comercial ${plan.commercial.toFixed(1)} · Financeiro ${plan.financial.toFixed(1)} · Automação ${plan.automation.toFixed(1)}<br>Esforço: ${effortLabel}${plan.competition?.proposals != null ? ` · Concorrência: ${plan.competition.proposals} propostas` : ""}`;
    if (pack) {
      const scope = plan.missing.length ? `<div>⚠️ Escopo parcial: ${plan.missing.join("; ")}</div>` : "";
      const credibility = plan.credibilityRisk ? `<div>⚠️ Sem inventar experiência: proposta usa piloto/spec.</div>` : "";
      const manual = plan.manualHeavy ? `<div>⚠️ Parte manual alta: começar por piloto limitado.</div>` : "";
      const promote = plan.promote ? `<div><strong>⭐ CANDIDATA A PROPOSTA PROMOVIDA</strong></div>` : "";
      pack.innerHTML = `<strong>Oferta sugerida</strong><div>R$ ${plan.priceMin}–${plan.priceMax} · sugerido R$ ${plan.price} · ${plan.days} dias</div><div>Estratégia: ${plan.strategy} · Risco: ${plan.risk}</div>${promote}${scope}${credibility}${manual}`;
    }
    if (msg && message) msg.textContent = message;
  }

  async function autoFillBid(plan) {
    if (plan.decision === "skip") {
      updatePanel(plan, "Não preenchi: existe um bloqueio real para esta oportunidade.");
      return;
    }
    const proposal = findField(["proposta", "mensagem", "descricao", "apresentacao", "detalhes"], true);
    const price = findField(["valor da proposta", "valor", "preco", "orcamento", "oferta", "r$"]);
    const days = findField(["prazo", "dias", "entrega", "tempo"]);
    const filled = [];
    if (proposal && setValue(proposal, plan.proposal)) filled.push("proposta");
    if (price && setValue(price, plan.price)) filled.push("valor");
    if (days && setValue(days, plan.days)) filled.push("prazo");
    updatePanel(plan, filled.length ? `Pronto: ${filled.join(", ")} preenchidos. Revise e faça o clique final.` : "Não consegui localizar os campos automaticamente.");
    const submit = $$('button, input[type="submit"]').find((el) => normalize(el.textContent || el.value || "").includes("enviar proposta"));
    if (submit) {
      submit.dataset.crs99Ready = "true";
      submit.title = "CRS 99: proposta preparada. O clique final continua humano.";
      submit.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function prepareAndOpenBid() {
    const plan = planForProject();
    await savePlan(plan);
    updatePanel(plan, plan.decision === "skip" ? "Oportunidade bloqueada por requisito realmente incompatível." : "Oportunidade validável. Preparando proposta…");
    if (plan.decision === "skip") return;
    const action = findBidAction();
    if (!action) {
      updatePanel(plan, "Não encontrei o fluxo atual de envio. Não vou forçar a proposta.");
      return;
    }
    if (action.href) {
      const url = new URL(action.href, location.origin);
      url.searchParams.set(PREPARE_PARAM, AUTOFILL_VALUE);
      location.href = url.href;
      return;
    }
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
    button.textContent = plan.decision === "priority" ? "Preparar proposta prioritária" : plan.decision === "opportunistic" ? "Preparar proposta" : plan.decision === "review" ? "Preparar com ressalva" : "Projeto bloqueado";
    button.disabled = plan.decision === "skip";
    button.addEventListener("click", prepareAndOpenBid);
    actions.prepend(button);
  }

  if (isBidPage) {
    getSavedPlan().then((saved) => {
      if (saved && (mode === AUTOFILL_VALUE || saved.projectKey === projectKey)) autoFillBid(saved);
    });
    return;
  }
  if (mode === PREPARE_VALUE) setTimeout(prepareAndOpenBid, 250);
  else setTimeout(addManualPrepareButton, 250);
})();