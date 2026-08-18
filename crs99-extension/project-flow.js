(() => {
  if (window.__CRS99_PROJECT_FLOW__) return;
  window.__CRS99_PROJECT_FLOW__ = true;

  const {
    idFrom, normalize, sentText, closedText, titleSimilarity,
    migrateOnce, getJob, setJob, markSent, markClosed
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

  function pageText() {
    return (document.body?.innerText || "").replace(/\s+/g, " ").trim();
  }

  function visible(element) {
    if (!element) return false;
    const r = element.getBoundingClientRect();
    const s = getComputedStyle(element);
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
  }

  function banner(message, type = "info") {
    let box = document.getElementById("crs99-v11-banner");
    if (!box) {
      box = document.createElement("div");
      box.id = "crs99-v11-banner";
      box.style.cssText = "position:fixed;right:16px;bottom:58px;z-index:2147483646;max-width:390px;padding:11px 13px;border-radius:9px;color:#fff;font:700 12px/1.35 Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.28)";
      document.documentElement.appendChild(box);
    }
    box.style.background = type === "good" ? "#15803d" : type === "bad" ? "#b91c1c" : "#111827";
    box.textContent = message;
  }

  function ensureRadarLink() {
    if (document.getElementById("crs99-radar-link")) return;
    const a = document.createElement("a");
    a.id = "crs99-radar-link";
    a.href = "https://www.99freelas.com.br/projects";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Abrir Radar CRS";
    a.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483646;padding:9px 12px;border-radius:8px;background:#0ea5e9;color:#fff;text-decoration:none;font:700 12px Arial,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.22)";
    document.documentElement.appendChild(a);
  }

  function slugTitleFromProjectUrl(url = location.href) {
    try {
      const u = new URL(url, location.origin);
      if (!/^\/project\/(?!bid\/)/i.test(u.pathname)) return "";
      const last = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "");
      return last.replace(/-\d{4,}$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    } catch { return ""; }
  }

  function headingCandidates() {
    return all("h1,h2,h3").filter(visible).map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).filter((x) => x.length >= 5);
  }

  function projectTitle() {
    const slug = slugTitleFromProjectUrl();
    const candidates = headingCandidates();
    if (slug && candidates.length) {
      const ranked = candidates.map((text) => ({ text, score: titleSimilarity(text, slug) })).sort((a, b) => b.score - a.score);
      if (ranked[0]?.score >= 0.45) return ranked[0].text;
    }
    return candidates[0] || document.title.replace(/\s*\|.*$/, "").trim() || `Projeto ${projectId}`;
  }

  function bidTitle() {
    const candidates = headingCandidates();
    return candidates[0] || document.title.replace(/\s*\|.*$/, "").trim() || "";
  }

  function detectCategory(projectTitleText, descriptionText) {
    const t = normalize(projectTitleText);
    const allText = normalize(`${projectTitleText} ${descriptionText}`);
    const rules = [
      ["marketplace", /marketplace|mercado livre|shopee|amazon|venda de produtos|produtos infantis/],
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
    for (const [name, rx] of rules) if (rx.test(t)) return name;
    for (const [name, rx] of rules) if (rx.test(allText)) return name;
    return "generic";
  }

  function buildPlan() {
    const title = projectTitle();
    const description = pageText().slice(0, 12000);
    const text = normalize(`${title} ${description}`);
    const category = detectCategory(title, description);
    const base = {
      marketplace: [350, 3], sales: [350, 3], spreadsheet: [690, 4], landing: [490, 3],
      research: [390, 3], data: [250, 3], presentation: [350, 3], design: [300, 3],
      document: [250, 2], script: [690, 4], translation: [300, 3], copy: [350, 3],
      video: [350, 3], social: [300, 3], jobs: [300, 7], generic: [300, 3]
    }[category];
    let [price, days] = base;
    if (category === "spreadsheet" && /automacao|automatizar|estoque|dashboard|power query|sku/.test(text)) price = 790;
    if (category === "script" && /api|n8n|make|webhook|integracao/.test(text)) { price = 790; days = 5; }
    if (category === "research") {
      const q = text.replace(/\./g, "").match(/\b(\d{2,6})\s*(?:canais|leads|empresas|contatos|itens|produtos|registros|linhas)\b/);
      if (q && Number(q[1]) >= 1000) { price = 890; days = 5; }
    }

    const hardBlocked = /presencial obrigatorio|responsavel tecnico obrigatorio|crc obrigatorio|oab obrigatoria|crea obrigatorio|crm obrigatorio|burlar captcha|bypass anti bot|invadir sistema|hackear/.test(text);
    const intro = {
      marketplace: `Olá! Li o escopo de “${title}”. Posso atuar na organização e execução da operação de vendas no marketplace, alinhando catálogo, oferta, rotina e pontos de melhoria conforme o escopo.`,
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
      marketplace: "Sugiro começar alinhando produtos, marketplace, objetivo e rotina esperada. A partir disso organizo a execução em etapas e registro o que foi realizado para manter o processo claro.",
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
    const credibility = /experiencia comprovada|portfolio obrigatorio|cases obrigatorios|resultados comprovados/.test(text)
      ? "\n\nSobre experiência/portfólio: não vou atribuir a mim cases ou resultados que não possuo. Posso demonstrar a abordagem em uma amostra curta ou começar por um piloto menor."
      : "";
    return {
      projectId,
      projectUrl: location.href.split("?")[0].split("#")[0],
      title,
      titleFingerprint: normalize(title),
      slugFingerprint: normalize(slugTitleFromProjectUrl()),
      category,
      price,
      days,
      decision: hardBlocked ? "skip" : "opportunistic",
      proposal: `${intro}\n\n${body}${credibility}\n\nPrazo estimado: ${days} dias úteis após receber os materiais/acessos necessários. Proposta inicial: R$ ${price}.`,
      preparedAt: new Date().toISOString()
    };
  }

  function findBidAction() {
    return all('a[href*="/project/bid/"]').find((a) => idFrom(a.href) === projectId) || null;
  }

  function usable(element) {
    if (!element || element.disabled || element.readOnly) return false;
    if (element.type && ["hidden", "submit", "button", "checkbox", "radio", "file"].includes(element.type)) return false;
    return visible(element);
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
      terms.forEach((term, index) => { if (context.includes(normalize(term))) score += 40 - index; });
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
        if (setter) setter.call(element, next); else element.value = next;
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new Event("blur", { bubbles: true }));
      return true;
    } catch { return false; }
  }

  function proposalField() {
    const c = [...all("textarea"), ...all('[contenteditable="true"]')].filter(usable);
    return bestField(c, ["detalhes", "proposta", "mensagem", "descricao", "apresentacao"], "TEXTAREA") || (c.length === 1 ? c[0] : null);
  }
  const priceField = () => bestField(all("input"), ["sua oferta", "valor da proposta", "oferta", "preco", "valor", "r$"]);
  const daysField = () => bestField(all("input"), ["duracao estimada", "prazo", "dias", "entrega", "tempo"]);

  function clearCRSGeneratedText() {
    const p = proposalField();
    if (p && normalize(p.value || p.textContent || "").includes("ola li o escopo de")) setValue(p, "");
  }

  async function invalidatePlan(reason) {
    clearCRSGeneratedText();
    await chrome.storage.local.remove(PLAN_KEY);
    const job = await getJob(projectId);
    if (job?.status !== "sent" && job?.status !== "closed") await setJob(projectId, { status: "new" });
    banner(`CRS BLOQUEOU O AUTOFILL: ${reason}`, "bad");
  }

  async function fillBid() {
    if (mode !== "autofill" || requestedId !== projectId) {
      await invalidatePlan("esta aba não foi aberta pelo botão correspondente deste projeto.");
      return;
    }

    const stored = await chrome.storage.local.get([PLAN_KEY, "crs99Jobs"]);
    const plan = stored[PLAN_KEY];
    const job = stored.crs99Jobs?.[projectId];
    if (!plan || String(plan.projectId) !== projectId) {
      await invalidatePlan("não existe plano exclusivo para este ID.");
      return;
    }
    if (idFrom(plan.projectUrl) !== projectId) {
      await invalidatePlan("a URL de origem do plano pertence a outro projeto.");
      return;
    }
    const age = Date.now() - new Date(plan.preparedAt || 0).getTime();
    if (!Number.isFinite(age) || age < 0 || age > 15 * 60 * 1000) {
      await invalidatePlan("o plano está antigo; prepare novamente a partir do Radar.");
      return;
    }

    const currentBidTitle = bidTitle();
    const similarity = titleSimilarity(plan.title, currentBidTitle);
    if (similarity < 0.55) {
      await invalidatePlan(`título não corresponde. Plano: “${plan.title}” | Formulário: “${currentBidTitle}”.`);
      return;
    }
    if (!plan.proposal || !plan.proposal.includes(plan.title)) {
      await invalidatePlan("o texto salvo não contém o título deste projeto.");
      return;
    }
    if (job?.status === "sent" || sentText(pageText())) {
      await markSent(projectId, { projectUrl: plan.projectUrl, title: plan.title });
      banner("Esta proposta já foi enviada.");
      return;
    }

    for (let attempt = 0; attempt < 14; attempt++) {
      const p = proposalField();
      const price = priceField();
      const days = daysField();
      let filled = 0;
      if (p && setValue(p, plan.proposal)) filled++;
      if (price && setValue(price, plan.price)) filled++;
      if (days && setValue(days, plan.days)) filled++;
      if (filled === 3) {
        banner(`CRS OK — ${currentBidTitle}. Proposta, valor e prazo preenchidos. Revise antes de enviar.`, "good");
        return;
      }
      await sleep(220);
    }
    banner("CRS não encontrou todos os campos. Não envie antes de revisar manualmente.", "bad");
  }

  async function prepareProject() {
    if (requestedId !== projectId) {
      banner("CRS bloqueou: ID do botão e ID da página não coincidem.", "bad");
      return;
    }
    const current = pageText();
    if (sentText(current)) {
      await markSent(projectId, { projectUrl: location.href.split("?")[0], title: projectTitle() });
      banner("Este projeto já possui proposta enviada.");
      return;
    }
    if (closedText(current)) {
      await markClosed(projectId, { projectUrl: location.href.split("?")[0], title: projectTitle() });
      banner("Este projeto não aceita novas propostas.");
      return;
    }

    const plan = buildPlan();
    const slug = slugTitleFromProjectUrl(plan.projectUrl);
    if (slug && titleSimilarity(plan.title, slug) < 0.45) {
      banner(`CRS bloqueou: o título lido não combina com a URL. Lido: “${plan.title}”.`, "bad");
      return;
    }
    if (plan.decision === "skip") {
      banner("Projeto bloqueado por requisito realmente incompatível.", "bad");
      return;
    }

    await chrome.storage.local.set({ [PLAN_KEY]: plan });
    await setJob(projectId, { projectUrl: plan.projectUrl, title: plan.title, status: "prepared" });

    const action = findBidAction();
    if (!action) {
      banner("Não encontrei um link de proposta com o mesmo ID. Abra o formulário manualmente e não envie até revisar.", "bad");
      return;
    }
    const bidUrl = new URL(action.href, location.origin);
    if (idFrom(bidUrl.href) !== projectId) {
      banner("CRS bloqueou: o formulário encontrado pertence a outro ID.", "bad");
      return;
    }
    bidUrl.searchParams.set("crs99", "autofill");
    bidUrl.searchParams.set("crs99id", projectId);
    location.href = bidUrl.href;
  }

  function isOfficialSend(element) {
    const text = normalize(element?.textContent || element?.value || "");
    return text.includes("enviar proposta") || text.includes("fazer proposta");
  }

  async function recordSent() {
    const stored = await chrome.storage.local.get(PLAN_KEY);
    const plan = stored[PLAN_KEY];
    await markSent(projectId, {
      projectUrl: plan?.projectUrl || location.href.split("?")[0],
      title: plan?.title || bidTitle()
    });
    await chrome.storage.local.remove(PLAN_KEY);
  }

  document.addEventListener("click", (event) => {
    if (!isBidPage) return;
    const target = event.target instanceof Element ? event.target.closest('button,input[type="submit"],input[type="button"],a') : null;
    if (target && isOfficialSend(target)) recordSent().catch(() => {});
  }, true);
  document.addEventListener("submit", (event) => {
    if (!isBidPage) return;
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    const submit = all('button,input[type="submit"]', form).find(isOfficialSend) || all('button,input[type="submit"]').find(isOfficialSend);
    if (submit) recordSent().catch(() => {});
  }, true);

  ensureRadarLink();
  migrateOnce().then(async () => {
    const current = pageText();
    if (sentText(current)) {
      await markSent(projectId, { projectUrl: location.href.split("?")[0], title: isBidPage ? bidTitle() : projectTitle() });
      if (!isBidPage) banner("Este projeto já possui proposta enviada.");
      return;
    }
    if (closedText(current) && !isBidPage) {
      await markClosed(projectId, { projectUrl: location.href.split("?")[0], title: projectTitle() });
      return;
    }
    if (isBidPage) {
      if (mode === "autofill") await fillBid();
      return;
    }
    if (mode === "prepare") await prepareProject();
  }).catch((error) => banner(`CRS encontrou um erro e bloqueou o fluxo: ${String(error?.message || error)}`, "bad"));
})();