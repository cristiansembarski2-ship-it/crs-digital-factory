(() => {
  if (window.__CRS99_PROJECT_FLOW__) return;
  window.__CRS99_PROJECT_FLOW__ = true;

  const {
    idFrom,
    normalize,
    sentText,
    closedText,
    migrateOnce,
    getJob,
    setJob,
    markSent,
    markClosed
  } = window.CRS99;

  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const path = location.pathname.replace(/\/+$/, "");
  const projectId = idFrom(path);
  if (!projectId) return;

  const PLAN_KEY = `crs99Plan:${projectId}`;
  const isBidPage = /\/project\/bid\//i.test(path);
  const params = new URLSearchParams(location.search);
  const mode = params.get("crs99");
  const requestedId = params.get("crs99id");

  function banner(message, type = "info") {
    let box = document.getElementById("crs99-v1-banner");
    if (!box) {
      box = document.createElement("div");
      box.id = "crs99-v1-banner";
      box.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483646;max-width:360px;padding:11px 13px;border-radius:9px;color:#fff;font:700 12px/1.35 Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.28)";
      document.documentElement.appendChild(box);
    }
    box.style.background = type === "good" ? "#15803d" : type === "bad" ? "#b91c1c" : "#111827";
    box.textContent = message;
  }

  function pageText() {
    return (document.body?.innerText || "").replace(/\s+/g, " ").trim();
  }

  function title() {
    return document.querySelector("h1")?.textContent?.trim()
      || document.title.replace(/\s*\|.*$/, "").trim()
      || `Projeto ${projectId}`;
  }

  function description() {
    const selectors = [
      ".project-description",
      "[class*='project-description']",
      "[id*='project-description']",
      ".description",
      "main",
      "article"
    ];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = (node?.innerText || "").replace(/\s+/g, " ").trim();
      if (text.length >= 80) return text.slice(0, 9000);
    }
    return pageText().slice(0, 9000);
  }

  function category(projectTitle, projectDescription) {
    const titleN = normalize(projectTitle);
    const text = normalize(`${projectTitle} ${projectDescription}`);

    const rules = [
      ["sales", /\bsdr\b|prospectar|prospeccao|captacao de clientes|captar clientes|geracao de leads|vendedor|vendas|afiliado/],
      ["spreadsheet", /excel|google sheets|planilha|csv|dashboard|estoque|sku/],
      ["landing", /landing page|pagina de vendas|wordpress|elementor|site institucional|html|css/],
      ["research", /pesquisa|levantamento|lista de|coleta de dados/],
      ["data", /data entry|digitacao|cadastro|preenchimento de dados/],
      ["presentation", /powerpoint|apresentacao|slides|pitch deck/],
      ["design", /canva|criativo|carrossel|banner|design/],
      ["document", /apa|abnt|dissertacao|tese|word|pdf|formatacao|revisao|transcricao/],
      ["script", /python|javascript|script|automacao|web scraping|api|webhook|n8n|make/],
      ["translation", /traducao|traduzir|espanhol|portugues/],
      ["copy", /vsl|copy|copywriting|redacao|roteiro|descricao de produto|seo/],
      ["video", /edicao de video|reels|video|capcut|shorts/],
      ["social", /social media|instagram|tiktok|calendario editorial|legendas/],
      ["jobs", /buscar vagas|candidatura|linkedin|indeed|vagas.com/]
    ];

    for (const [name, regex] of rules) if (regex.test(titleN)) return name;
    for (const [name, regex] of rules) if (regex.test(text)) return name;
    return "generic";
  }

  function buildPlan() {
    const projectTitle = title();
    const projectDescription = description();
    const text = normalize(`${projectTitle} ${projectDescription}`);
    const kind = category(projectTitle, projectDescription);

    const base = {
      sales: [350, 3],
      spreadsheet: [690, 4],
      landing: [490, 3],
      research: [390, 3],
      data: [250, 3],
      presentation: [350, 3],
      design: [300, 3],
      document: [250, 2],
      script: [690, 4],
      translation: [300, 3],
      copy: [350, 3],
      video: [350, 3],
      social: [300, 3],
      jobs: [300, 7],
      generic: [300, 3]
    }[kind];

    let [price, days] = base;
    if (kind === "spreadsheet" && /automacao|automatizar|estoque|dashboard|power query|sku/.test(text)) price = 790;
    if (kind === "script" && /api|n8n|make|webhook|integracao/.test(text)) { price = 790; days = 5; }
    if (kind === "research") {
      const quantity = text.replace(/\./g, "").match(/\b(\d{2,6})\s*(?:canais|leads|empresas|contatos|itens|produtos|registros|linhas)\b/);
      if (quantity && Number(quantity[1]) >= 1000) { price = 890; days = 5; }
    }

    const hardBlocked = /presencial obrigatorio|responsavel tecnico obrigatorio|crc obrigatorio|oab obrigatoria|crea obrigatorio|crm obrigatorio|burlar captcha|bypass anti-bot|invadir sistema|hackear/.test(text);

    const intro = {
      sales: `Olá! Li o escopo de “${projectTitle}”. Posso atuar na prospecção e qualificação inicial de potenciais clientes, seguindo o público e os canais definidos por você.`,
      spreadsheet: `Olá! Li o escopo de “${projectTitle}”. Posso organizar e automatizar a solução mantendo o processo claro e fácil de usar.`,
      landing: `Olá! Li o escopo de “${projectTitle}”. Posso desenvolver a página de forma responsiva e organizada, seguindo o material e as referências fornecidas.`,
      research: `Olá! Li o escopo de “${projectTitle}”. Posso executar a pesquisa com critérios consistentes e entregar os dados organizados para validação.`,
      data: `Olá! Li o escopo de “${projectTitle}”. Posso organizar e preencher os dados com padronização e revisão de inconsistências.`,
      presentation: `Olá! Li o escopo de “${projectTitle}”. Posso transformar o conteúdo em uma apresentação clara, consistente e editável.`,
      design: `Olá! Li o escopo de “${projectTitle}”. Posso criar as peças no formato solicitado, mantendo consistência visual e organização.`,
      document: `Olá! Li o escopo de “${projectTitle}”. Posso revisar, organizar e padronizar o material conforme os critérios solicitados.`,
      script: `Olá! Li o escopo de “${projectTitle}”. Posso desenvolver a automação/script com foco no fluxo descrito, testes e uma entrega simples de manter.`,
      translation: `Olá! Li o escopo de “${projectTitle}”. Posso fazer a tradução preservando sentido, tom e naturalidade, com revisão final.`,
      copy: `Olá! Li o escopo de “${projectTitle}”. Posso escrever e estruturar o texto com foco em clareza, retenção e objetivo comercial.`,
      video: `Olá! Li o escopo de “${projectTitle}”. Posso organizar a edição mantendo ritmo, legibilidade e consistência visual.`,
      social: `Olá! Li o escopo de “${projectTitle}”. Posso estruturar o conteúdo com foco no objetivo informado e consistência de publicação.`,
      jobs: `Olá! Li o escopo de “${projectTitle}”. Posso executar a busca e candidatura de forma organizada, seguindo os critérios informados e registrando cada ação.`,
      generic: `Olá! Li com atenção o escopo de “${projectTitle}”. Posso executar a entrega de forma objetiva, validando os requisitos e mantendo o trabalho dentro do combinado.`
    }[kind];

    const body = {
      sales: "Sugiro começar com um piloto curto, alinhando público-alvo, canal, abordagem e volume esperado. Registro os contatos trabalhados e os retornos para medir rapidamente o processo antes de ampliar.",
      spreadsheet: "Reviso a estrutura, implemento fórmulas/automação, testo dependências e entrego o arquivo organizado com uma orientação curta de uso.",
      landing: "Organizo estrutura, seções, CTAs e versão mobile, testo a responsividade e entrego a página dentro do escopo combinado.",
      research: "A entrega será organizada em colunas claras, com critérios verificáveis e indicação quando alguma informação não estiver publicamente disponível.",
      data: "Faço o preenchimento em lotes, padronizo formatos e reviso duplicidades e inconsistências antes da entrega.",
      presentation: "Organizo hierarquia, títulos e mensagens principais, entregando o arquivo editável e pronto para apresentação.",
      design: "Estruturo layout e hierarquia visual e entrego as peças no formato combinado.",
      document: "Faço a revisão e padronização de estrutura, títulos, referências, espaçamento e tabelas conforme o padrão solicitado.",
      script: "Primeiro valido entradas e regras; depois implemento, testo casos de erro e entrego o código organizado com instruções de execução.",
      translation: "A entrega inclui tradução, revisão de fluidez e consistência de termos.",
      copy: "Estruturo o texto conforme o objetivo do projeto e entrego o material pronto para revisão.",
      video: "Organizo cortes, ritmo, textos e transições conforme o material e o volume combinado.",
      social: "Posso organizar pauta, textos e peças em um lote inicial para validar direção antes de ampliar a recorrência.",
      jobs: "Registro vaga, empresa, link e status para manter o processo rastreável e aplicar somente quando os critérios principais forem compatíveis.",
      generic: "Primeiro confirmo os dados de entrada e o resultado esperado; depois executo, valido e entrego o material pronto."
    }[kind];

    const credibility = /experiencia comprovada|portfolio obrigatorio|portfólio obrigatório|cases obrigatorios|cases obrigatórios|resultados comprovados/.test(text)
      ? "\n\nSobre experiência/portfólio: não vou atribuir a mim cases ou resultados que não possuo. Posso demonstrar a abordagem em uma amostra curta ou começar por um piloto menor."
      : "";

    return {
      projectId,
      projectUrl: location.href.split("?")[0].split("#")[0],
      title: projectTitle,
      category: kind,
      price,
      days,
      decision: hardBlocked ? "skip" : "opportunistic",
      proposal: `${intro}\n\n${body}${credibility}\n\nPrazo estimado: ${days} dias úteis após receber os materiais/acessos necessários. Proposta inicial: R$ ${price}.`,
      generatedAt: new Date().toISOString()
    };
  }

  function findBidAction() {
    const exact = all('a[href*="/project/bid/"]').find((anchor) => idFrom(anchor.href) === projectId);
    if (exact) return exact;
    return all("a,button").find((element) => {
      const text = normalize(element.textContent || element.value || "");
      return text.includes("enviar proposta") || text.includes("fazer proposta");
    }) || null;
  }

  function usable(element) {
    if (!element || element.disabled || element.readOnly) return false;
    if (element.type && ["hidden", "submit", "button", "checkbox", "radio", "file"].includes(element.type)) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function fieldContext(element) {
    const parts = [element.name, element.id, element.placeholder, element.getAttribute("aria-label")].filter(Boolean);
    if (element.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
        if (label) parts.push(label.textContent || "");
      } catch {}
    }
    const parent = element.closest(".form-group,.field,.control-group,.row,.input-group,div");
    if (parent) parts.push((parent.innerText || "").slice(0, 350));
    return normalize(parts.join(" "));
  }

  function bestField(candidates, terms, preferTag = "") {
    const ranked = candidates.filter(usable).map((element) => {
      const context = fieldContext(element);
      let score = 0;
      terms.forEach((term, index) => {
        if (context.includes(normalize(term))) score += 40 - index;
      });
      if (preferTag && element.tagName === preferTag) score += 5;
      return { element, score };
    }).sort((a, b) => b.score - a.score);
    return ranked[0]?.score > 0 ? ranked[0].element : null;
  }

  function setValue(element, value) {
    if (!element || value == null) return false;
    const next = String(value);
    try {
      element.focus();
      if (element.isContentEditable) {
        element.textContent = next;
        element.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        const proto = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(element, next);
        else element.value = next;
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("blur", { bubbles: true }));
      return true;
    } catch {
      return false;
    }
  }

  function findProposalField() {
    const candidates = [...all("textarea"), ...all('[contenteditable="true"]')].filter(usable);
    return bestField(candidates, ["detalhes", "proposta", "mensagem", "descricao", "apresentacao"], "TEXTAREA")
      || (candidates.length === 1 ? candidates[0] : null);
  }

  function findPriceField() {
    return bestField(all("input"), ["sua oferta", "valor da proposta", "oferta", "preco", "preço", "valor", "r$"]);
  }

  function findDaysField() {
    return bestField(all("input"), ["duracao estimada", "duração estimada", "prazo", "dias", "entrega", "tempo"]);
  }

  async function fillBid() {
    if (requestedId && requestedId !== projectId) {
      banner("CRS bloqueou o preenchimento: o ID do botão não corresponde a esta proposta.", "bad");
      return;
    }

    const stored = await chrome.storage.local.get([PLAN_KEY, "crs99Jobs"]);
    const plan = stored[PLAN_KEY];
    const job = stored.crs99Jobs?.[projectId];

    if (!plan || String(plan.projectId) !== projectId) {
      banner("CRS não encontrou um plano válido para este projeto. Nada foi preenchido.", "bad");
      return;
    }

    if (job?.status === "sent" || sentText(pageText())) {
      await markSent(projectId, { projectUrl: plan.projectUrl, title: plan.title });
      banner("Esta proposta já foi enviada.");
      return;
    }

    for (let attempt = 0; attempt < 16; attempt++) {
      const proposal = findProposalField();
      const price = findPriceField();
      const days = findDaysField();
      let filled = 0;
      if (proposal && setValue(proposal, plan.proposal)) filled += 1;
      if (price && setValue(price, plan.price)) filled += 1;
      if (days && setValue(days, plan.days)) filled += 1;

      if (filled === 3) {
        const submit = all('button,input[type="submit"],input[type="button"]').find((element) => {
          const text = normalize(element.textContent || element.value || "");
          return text.includes("enviar proposta") || text.includes("fazer proposta");
        });
        if (submit) {
          submit.dataset.crs99Ready = "true";
          submit.title = "CRS: proposta, valor e prazo preenchidos. Revise e faça o clique final.";
          submit.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        banner("Pronto: proposta, valor e prazo preenchidos. Faça apenas o clique final.", "good");
        return;
      }
      await sleep(200);
    }

    banner("Não consegui identificar todos os campos do formulário. Nada será enviado automaticamente.", "bad");
  }

  async function prepareProject() {
    if (requestedId && requestedId !== projectId) {
      banner("CRS bloqueou este projeto: o ID do botão e o ID da página não coincidem.", "bad");
      return;
    }

    const current = pageText();
    if (sentText(current)) {
      await markSent(projectId, { projectUrl: location.href.split("?")[0], title: title() });
      banner("Este projeto já possui proposta enviada.");
      return;
    }
    if (closedText(current)) {
      await markClosed(projectId, { projectUrl: location.href.split("?")[0], title: title() });
      banner("Este projeto não aceita novas propostas.");
      return;
    }

    const plan = buildPlan();
    if (plan.decision === "skip") {
      await setJob(projectId, { projectUrl: plan.projectUrl, title: plan.title, status: "closed" });
      banner("Projeto bloqueado por requisito incompatível com a operação.", "bad");
      return;
    }

    await chrome.storage.local.set({ [PLAN_KEY]: plan });
    await setJob(projectId, {
      projectUrl: plan.projectUrl,
      title: plan.title,
      status: "prepared"
    });

    const action = findBidAction();
    if (!action) {
      banner("Não encontrei o botão oficial de proposta neste projeto.", "bad");
      return;
    }

    if (action.href) {
      const bidUrl = new URL(action.href, location.origin);
      if (idFrom(bidUrl.href) !== projectId) {
        banner("CRS bloqueou a navegação porque o formulário pertence a outro ID.", "bad");
        return;
      }
      bidUrl.searchParams.set("crs99", "autofill");
      bidUrl.searchParams.set("crs99id", projectId);
      location.href = bidUrl.href;
      return;
    }

    action.click();
  }

  function isOfficialSend(element) {
    const text = normalize(element?.textContent || element?.value || "");
    return text.includes("enviar proposta") || text.includes("fazer proposta");
  }

  async function recordSent() {
    const job = await getJob(projectId);
    await markSent(projectId, {
      projectUrl: job?.projectUrl || location.href.split("?")[0],
      title: job?.title || title()
    });
  }

  document.addEventListener("click", (event) => {
    if (!isBidPage) return;
    const target = event.target instanceof Element
      ? event.target.closest('button,input[type="submit"],input[type="button"],a')
      : null;
    if (target && isOfficialSend(target)) recordSent().catch(() => {});
  }, true);

  document.addEventListener("submit", (event) => {
    if (!isBidPage) return;
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    const submit = all('button,input[type="submit"]', form).find(isOfficialSend)
      || all('button,input[type="submit"]').find(isOfficialSend);
    if (submit) recordSent().catch(() => {});
  }, true);

  migrateOnce().then(async () => {
    const current = pageText();
    if (sentText(current)) {
      await markSent(projectId, { projectUrl: location.href.split("?")[0], title: title() });
      if (!isBidPage) banner("Este projeto já possui proposta enviada.");
      return;
    }
    if (closedText(current) && !isBidPage) {
      await markClosed(projectId, { projectUrl: location.href.split("?")[0], title: title() });
      return;
    }
    if (isBidPage) {
      if (mode === "autofill" || requestedId === projectId) await fillBid();
      return;
    }
    if (mode === "prepare") await prepareProject();
  }).catch(() => {});
})();