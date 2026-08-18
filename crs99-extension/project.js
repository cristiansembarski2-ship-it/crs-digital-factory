(() => {
  if (window.__CRS99_PROJECT_V1__) return;
  window.__CRS99_PROJECT_V1__ = true;

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

  function projectTitle() {
    return document.querySelector("h1")?.textContent?.trim()
      || document.title.replace(/\s*\|.*$/, "").trim()
      || `Projeto ${projectId}`;
  }

  function projectDescription() {
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

  function detectCategory(title, description) {
    const titleN = normalize(title);
    const text = normalize(`${title} ${description}`);

    if (/\bsdr\b|prospectar|prospeccao|captacao de clientes|captar clientes|geracao de leads|vendedor|vendas|afiliado/.test(titleN)) return "sales";
    if (/excel|google sheets|planilha|csv|dashboard|estoque|sku/.test(titleN)) return "spreadsheet";
    if (/landing page|pagina de vendas|wordpress|elementor|site institucional|html|css/.test(titleN)) return "landing";
    if (/pesquisa|levantamento|lista de|coleta de dados/.test(titleN)) return "research";
    if (/data entry|digitacao|cadastro|preenchimento de dados/.test(titleN)) return "data";
    if (/powerpoint|apresentacao|slides|pitch deck/.test(titleN)) return "presentation";
    if (/canva|criativo|carrossel|banner|design/.test(titleN)) return "design";
    if (/apa|abnt|dissertacao|tese|word|pdf|formatacao|revisao|transcricao/.test(titleN)) return "document";
    if (/python|javascript|script|automacao|web scraping|api|webhook|n8n|make/.test(titleN)) return "script";
    if (/traducao|traduzir|espanhol|portugues/.test(titleN)) return "translation";
    if (/vsl|copy|copywriting|redacao|roteiro|descricao de produto|seo/.test(titleN)) return "copy";
    if (/edicao de video|reels|video|capcut|shorts/.test(titleN)) return "video";
    if (/social media|instagram|tiktok|calendario editorial|legendas/.test(titleN)) return "social";
    if (/buscar vagas|candidatura|linkedin|indeed|vagas.com/.test(titleN)) return "jobs";

    if (/\bsdr\b|prospectar|prospeccao|captacao de clientes|captar clientes|geracao de leads|vendedor|vendas|afiliado/.test(text)) return "sales";
    if (/excel|google sheets|planilha|csv|dashboard|estoque|sku/.test(text)) return "spreadsheet";
    if (/landing page|pagina de vendas|wordpress|elementor|site institucional|html|css/.test(text)) return "landing";
    if (/pesquisa|levantamento|lista de|coleta de dados/.test(text)) return "research";
    if (/data entry|digitacao|cadastro|preenchimento de dados/.test(text)) return "data";
    if (/powerpoint|apresentacao|slides|pitch deck/.test(text)) return "presentation";
    if (/canva|criativo|carrossel|banner|design/.test(text)) return "design";
    if (/apa|abnt|dissertacao|tese|word|pdf|formatacao|revisao|transcricao/.test(text)) return "document";
    if (/python|javascript|script|automacao|web scraping|api|webhook|n8n|make/.test(text)) return "script";
    if (/traducao|traduzir|espanhol|portugues/.test(text)) return "translation";
    if (/vsl|copy|copywriting|redacao|roteiro|descricao de produto|seo/.test(text)) return "copy";
    if (/edicao de video|reels|video|capcut|shorts/.test(text)) return "video";
    if (/social media|instagram|tiktok|calendario editorial|legendas/.test(text)) return "social";
    if (/buscar vagas|candidatura|linkedin|indeed|vagas.com/.test(text)) return "jobs";
    return "generic";
  }

  function buildPlan() {
    const title = projectTitle();
    const description = projectDescription();
    const text = normalize(`${title} ${description}`);
    const category = detectCategory(title, description);

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
    }[category];

    let [price, days] = base;
    if (category === "spreadsheet" && /automacao|automatizar|estoque|dashboard|power query|sku/.test(text)) price = 790;
    if (category === "script" && /api|n8n|make|webhook|integracao/.test(text)) { price = 790; days = 5; }
    if (category === "research") {
      const quantity = text.replace(/\./g, "").match(/\b(\d{2,6})\s*(?:canais|leads|empresas|contatos|itens|produtos|registros|linhas)\b/);
      if (quantity && Number(quantity[1]) >= 1000) { price = 890; days = 5; }
    }

    const hardBlocked = /presencial obrigatorio|responsavel tecnico obrigatorio|crc obrigatorio|oab obrigatoria|crea obrigatorio|crm obrigatorio|burlar captcha|bypass anti-bot|invadir sistema|hackear/.test(text);

    const intro = {
      sales: `Olá! Li o escopo de “${title}”. Posso atuar na prospecção e qualificação inicial de potenciais clientes, seguindo o público e os canais definidos por você.`,
      spreadsheet: `Olá! Li o escopo de “${title}”. Posso organizar e automatizar a solução mantendo o processo claro e fácil de usar.`,
      landing: `Olá! Li o escopo de “${title}”. Posso desenvolver a página de forma responsiva e organizada, seguindo o material e as referências fornecidas.`,
      research: `Olá! Li o escopo de “${title}”. Posso executar a pesquisa com critérios consistentes e entregar os dados organizados para validação.`,
      data: `Olá! Li o escopo de “${title}”. Posso organizar e preencher os dados com padronização e revisão de inconsistências.`,
      presentation: `Olá! Li o escopo de “${title}”. Posso transformar o conteúdo em uma apresentação clara, consistente e editável.`,
      design: `Olá! Li o escopo de “${title}”. Posso criar as peças no formato solicitado, mantendo consistência visual e organização.`,
      document: `Olá! Li o escopo de “${title}”. Posso revisar, organizar e padronizar o material conforme os critérios solicitados.`,
      script: `Olá! Li o escopo de “${title}”. Posso desenvolver a automação/script com foco no fluxo descrito, testes e uma entrega simples de manter.`,
      translation: `Olá! Li o escopo de “${title}”. Posso fazer a tradução preservando sentido, tom e naturalidade, com revisão final.`,
      copy: `Olá! Li o escopo de “${title}”. Posso escrever e estruturar o texto com foco em clareza, retenção e objetivo comercial.`,
      video: `Olá! Li o escopo de “${title}”. Posso organizar a edição mantendo ritmo, legibilidade e consistência visual.`,
      social: `Olá! Li o escopo de “${title}”. Posso estruturar o conteúdo com foco no objetivo informado e consistência de publicação.`,
      jobs: `Olá! Li o escopo de “${title}”. Posso executar a busca e candidatura de forma organizada, seguindo os critérios informados e registrando cada ação.`,
      generic: `Olá! Li com atenção o escopo de “${title}”. Posso executar a entrega de forma objetiva, validando os requisitos e mantendo o trabalho dentro do combinado.`
    }[category];

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
    }[category];

    const credibility = /experiencia comprovada|portfolio obrigatorio|portfólio obrigatório|cases obrigatorios|cases obrigatórios|resultados comprovados/.test(text)
      ? "\n\nSobre experiência/portfólio: não vou atribuir a mim cases ou resultados que não possuo. Posso demonstrar a abordagem em uma amostra curta ou começar por um piloto menor."
      : "";

    return {
      projectId,
      projectKey: projectId,
      projectUrl: location.href.split("?")[0].split("#")[0],
      title,
      category,
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

  function fieldContext(element) {
    const parts = [
      element.name,
      element.id,
      element.placeholder,
      element.getAttribute("aria-label")
    ].filter(Boolean);

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

  function usable(element) {
    if (!element || element.disabled || element.readOnly) return false;
    if (element.type && ["hidden", "submit", "button", "checkbox", "radio", "file"].includes(element.type)) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function bestField(candidates, terms, preferTag = "") {
    const ranked = candidates
      .filter(usable)
      .map((element) => {
        const context = fieldContext(element);
        let score = 0;
        terms.forEach((term, index) => {
          if (context.includes(normalize(term))) score += 40 - index;
        });
        if (preferTag && element.tagName === preferTag) score += 5;
        return { element, score };
      })
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.score > 0 ? ranked[0].element : null;
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

  async function fillBid() {
    if (requestedId && requestedId !== projectId) {
      banner("CRS bloqueou o preenchimento: o ID do botão não corresponde a esta proposta.", "bad");
      return false;
    }

    const job = await getJob(projectId);
    const plan = job?.plan;
    if (!plan || String(plan.projectId) !== projectId) {
      banner("CRS não encontrou um plano válido para este projeto. Nada foi preenchido.", "bad");
      return false;
    }

    if (job.status === "sent" || sentText(pageText())) {
      await markSent(projectId, { projectUrl: plan.projectUrl, title: plan.title });
      banner("Esta proposta já foi enviada.", "info");
      return false;
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
        return true;
      }

      await sleep(200);
    }

    banner("Não consegui identificar todos os campos do formulário. Nada será enviado automaticamente.", "bad");
    return false;
  }

  async function prepareProject() {
    if (requestedId && requestedId !== projectId) {
      banner("CRS bloqueou este projeto: o ID do botão e o ID da página não coincidem.", "bad");
      return;
    }

    const currentText = pageText();
    if (sentText(currentText)) {
      await markSent(projectId, { projectUrl: location.href.split("?")[0], title: projectTitle() });
      banner("Este projeto já possui proposta enviada.", "info");
      return;
    }
    if (closedText(currentText)) {
      await markClosed(projectId, { projectUrl: location.href.split("?")[0], title: projectTitle() });
      banner("Este projeto não aceita novas propostas.", "info");
      return;
    }

    const plan = buildPlan();
    if (plan.decision === "skip") {
      await setJob(projectId, { projectUrl: plan.projectUrl, title: plan.title, status: "closed" });
      banner("Projeto bloqueado por requisito incompatível com a operação.", "bad");
      return;
    }

    await setJob(projectId, {
      projectUrl: plan.projectUrl,
      title: plan.title,
      status: "prepared",
      plan
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

  document.addEventListener("click", (event) => {
    if (!isBidPage) return;
    const target = event.target instanceof Element
      ? event.target.closest('button,input[type="submit"],input[type="button"],a')
      : null;
    if (!target || !isOfficialSend(target)) return;
    getJob(projectId).then((job) => markSent(projectId, {
      projectUrl: job?.projectUrl || location.href.split("?")[0],
      title: job?.title || projectTitle()
    })).catch(() => {});
  }, true);

  document.addEventListener("submit", (event) => {
    if (!isBidPage) return;
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    const submit = all('button,input[type="submit"]', form).find(isOfficialSend)
      || all('button,input[type="submit"]').find(isOfficialSend);
    if (!submit) return;
    getJob(projectId).then((job) => markSent(projectId, {
      projectUrl: job?.projectUrl || location.href.split("?")[0],
      title: job?.title || projectTitle()
    })).catch(() => {});
  }, true);

  migrateOnce()
    .then(async () => {
      const text = pageText();
      if (sentText(text)) {
        await markSent(projectId, { projectUrl: location.href.split("?")[0], title: projectTitle() });
        if (!isBidPage) banner("Este projeto já possui proposta enviada.");
        return;
      }
      if (closedText(text) && !isBidPage) {
        await markClosed(projectId, { projectUrl: location.href.split("?")[0], title: projectTitle() });
        return;
      }

      if (isBidPage) {
        if (mode === "autofill" || requestedId === projectId) await fillBid();
        return;
      }

      if (mode === "prepare") await prepareProject();
    })
    .catch(() => {});
})();