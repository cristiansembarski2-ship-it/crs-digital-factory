(() => {
  if (window.__CRS99_PROPOSAL_ANALYSIS__) return;
  window.__CRS99_PROPOSAL_ANALYSIS__ = true;

  const CRS = window.CRS99;
  if (!CRS) return;

  const params = new URLSearchParams(location.search);
  const mode = params.get("crs99");
  const requestedId = params.get("crs99id");

  // Atua SOMENTE antes do autofill iniciado pelo Radar.
  // Não altera Radar, auditoria, preço, prazo, texto, envio ou navegação normal.
  if (mode !== "prepare" || !requestedId) return;
  if (CRS.idFrom(location.href) !== requestedId) return;

  const basicNormalize = (value = "") => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const page = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
  const headings = [...document.querySelectorAll("h1,h2,h3")]
    .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
    .filter((x) => x.length >= 5);

  function slugTitle() {
    try {
      const last = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "");
      return last.replace(/-\d{4,}$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    } catch { return ""; }
  }

  const slug = slugTitle();
  const title = headings
    .map((text) => ({ text, score: CRS.titleSimilarity(text, slug) }))
    .sort((a, b) => b.score - a.score)[0]?.text || headings[0] || slug;

  if (!title) return;

  const t = basicNormalize(title);
  const d = basicNormalize(page);

  // Leitura semântica mais específica. O título vale mais que palavras soltas da descrição.
  const rules = [
    ["marketplace", [/\bmarketplace\b/, /mercado livre/, /\bshopee\b/, /\bamazon\b/, /e commerce/, /loja virtual/]],
    ["sales", [/\bsdr\b/, /prospecc/, /captacao de clientes/, /geracao de leads/, /\bleads\b/, /\bvendas\b/, /\bcomercial\b/, /vendedor/, /afiliad/]],
    ["spreadsheet", [/\bexcel\b/, /google sheets/, /\bplanilha/, /\bdashboard\b/, /\bestoque\b/, /power query/, /\bsku\b/, /\bcsv\b/]],
    ["landing", [/\bsite\b/, /\bwebsite\b/, /landing page/, /wordpress/, /elementor/, /site institucional/, /pagina web/, /\bhtml\b/, /\bcss\b/]],
    ["research", [/\bpesquisa\b/, /levantamento/, /coleta de dados/, /encontrar \d+/, /lista de (?:empresas|canais|contatos|leads)/]],
    ["data", [/data entry/, /digitacao/, /insercao de dados/, /preenchimento de dados/, /\bcadastro\b/, /apoio administrativo/, /secretaria remota/]],
    ["presentation", [/powerpoint/, /apresentacao/, /\bslides\b/, /pitch deck/]],
    ["design", [/\blogo\b/, /logotipo/, /identidade visual/, /miniatura/, /thumbnail/, /criativo/, /\bbanner\b/, /\bcanva\b/, /design grafico/]],
    ["document", [/\brevisao\b/, /\blivro\b/, /dissertacao/, /\btese\b/, /\bapa\b/, /\babnt\b/, /formatacao/, /\bpdf\b/, /\bresumo/, /transcricao/]],
    ["script", [/automacao/, /automatizar/, /\bscript\b/, /\bpython\b/, /\bapi\b/, /webhook/, /\bn8n\b/, /\bmake\b/, /manychat/, /\bmoodle\b/]],
    ["translation", [/traducao/, /traduzir/, /traducao para ingles/, /traducao para espanhol/, /versao em ingles/, /versao em espanhol/]],
    ["copy", [/copywriter/, /copywriting/, /\bvsl\b/, /\bcopy\b/, /redacao/, /\broteiro\b/, /depoimento textual/, /texto comercial/]],
    ["video", [/motion design/, /edicao de video/, /editar video/, /\breels\b/, /\bshorts\b/, /\bcapcut\b/, /video para youtube/, /canal do youtube/]],
    ["social", [/social media/, /redes sociais/, /\binstagram\b/, /\btiktok\b/, /calendario editorial/]],
    ["jobs", [/busca ativa.*vagas/, /candidatura.*vagas/, /buscar vagas/, /\blinkedin\b/, /\bindeed\b/, /vagas com/]]
  ];

  function score(text, patterns, weight) {
    let total = 0;
    for (const rx of patterns) if (rx.test(text)) total += weight;
    return total;
  }

  const ranked = rules.map(([category, patterns], index) => {
    const titleScore = score(t, patterns, 5);
    const descriptionScore = score(d, patterns, 1);
    return { category, titleScore, descriptionScore, score: titleScore + descriptionScore, index };
  }).sort((a, b) => b.score - a.score || b.titleScore - a.titleScore || a.index - b.index);

  let semanticCategory = ranked[0]?.score > 0 ? ranked[0].category : "generic";
  if (/motion design/.test(t) && /video|edicao/.test(t)) semanticCategory = "video";
  if (/depoimento textual/.test(t)) semanticCategory = "copy";
  if (/digitacao|insercao de dados|secretaria remota/.test(t)) semanticCategory = "data";

  // Replica a classificação atual apenas para COMPARAR. Não a modifica.
  function currentCategory(titleText, descriptionText) {
    const titleNorm = basicNormalize(titleText);
    const allNorm = basicNormalize(`${titleText} ${descriptionText}`);
    const currentRules = [
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
    for (const [name, rx] of currentRules) if (rx.test(titleNorm)) return name;
    for (const [name, rx] of currentRules) if (rx.test(allNorm)) return name;
    return "generic";
  }

  const automaticCategory = currentCategory(title, page);
  const allText = `${t} ${d}`;
  let reviewReason = "";

  const riskRules = [
    [/alteracao integral de nome civil|\bpeticao\b|\badvocacia\b|\badvogado\b|\boab\b/, "escopo jurídico especializado"],
    [/\balterdata\b|\besocial\b|fechamento de folha|folha de pagamento|departamento pessoal/, "escopo especializado de folha/eSocial"],
    [/seo local|otimizacao seo/, "o escopo é especificamente de SEO e o texto automático atual pode ficar genérico ou inadequado"],
    [/\bugc\b.{0,180}\b(gravar|aparecer|rosto|voz|receber produto|produto sera enviado|filmagem)\b|\b(gravar|aparecer|filmagem)\b.{0,180}\bugc\b/, "o projeto de UGC parece exigir gravação/aparição física"],
    [/ingles conversacional.{0,180}(ligacao|chamada|reuniao|call)|(?:ligacao|chamada|reuniao|call).{0,180}ingles conversacional/, "o projeto parece exigir conversação ao vivo em inglês"]
  ];

  for (const [rx, reason] of riskRules) {
    if (rx.test(allText)) {
      reviewReason = reason;
      break;
    }
  }

  if (!reviewReason && /\b(logo|logotipo|identidade visual)\b/.test(t) && /\b(site|website|landing page|wordpress)\b/.test(t)) {
    reviewReason = "o título combina entregas diferentes de design e site e merece um texto específico";
  }

  const top = ranked[0] || { score: 0, titleScore: 0 };
  const second = ranked[1] || { score: 0 };
  const semanticConfident = top.titleScore >= 5 || (top.score >= 4 && top.score - second.score >= 2);

  if (!reviewReason && semanticConfident && semanticCategory !== "generic" && automaticCategory !== semanticCategory) {
    reviewReason = `a análise do escopo indica “${semanticCategory}”, mas o gerador atual classificaria como “${automaticCategory}”`;
  }

  const analysis = {
    projectId: requestedId,
    title,
    semanticCategory,
    automaticCategory,
    topScore: top.score || 0,
    secondScore: second.score || 0,
    reviewRequired: Boolean(reviewReason),
    reviewReason,
    analyzedAt: new Date().toISOString(),
    version: 2
  };

  try {
    chrome.storage.local.set({ [`crs99ProposalAnalysis:${requestedId}`]: analysis });
  } catch {}

  if (!reviewReason) return;

  // Bloqueia SOMENTE o autofill desta oportunidade. Nenhum outro componente é alterado.
  window.__CRS99_PROJECT_FLOW__ = true;

  const box = document.createElement("div");
  box.id = "crs99-semantic-review";
  box.style.cssText = "position:fixed;right:16px;bottom:58px;z-index:2147483647;max-width:430px;padding:12px 14px;border-radius:9px;background:#b91c1c;color:#fff;font:700 12px/1.4 Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.28)";
  box.textContent = `CRS NÃO PREENCHEU: ${reviewReason}. Revise este projeto manualmente antes de enviar proposta.`;
  document.documentElement.appendChild(box);

  const radar = document.createElement("a");
  radar.href = "https://www.99freelas.com.br/projects";
  radar.target = "_blank";
  radar.rel = "noopener noreferrer";
  radar.textContent = "Abrir Radar CRS";
  radar.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:9px 12px;border-radius:8px;background:#0ea5e9;color:#fff;text-decoration:none;font:700 12px Arial,sans-serif";
  document.documentElement.appendChild(radar);
})();