(() => {
  if (window.__CRS99_AUDIT__) return;
  window.__CRS99_AUDIT__ = true;

  const { normalize, idFrom, titleSimilarity, migrateOnce, getJobs } = window.CRS99;
  const ORIGIN = location.origin;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function projectTitleFromDoc(doc, fallbackUrl = "") {
    const headings = [...doc.querySelectorAll("h1,h2,h3")]
      .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
      .filter((x) => x.length >= 5);
    if (headings.length) return headings[0];
    try {
      const seg = decodeURIComponent(new URL(fallbackUrl, ORIGIN).pathname.split("/").filter(Boolean).pop() || "");
      return seg.replace(/-\d{4,}$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    } catch {}
    return "";
  }

  function descriptionFromDoc(doc) {
    const selectors = [".project-description", "[class*='project-description']", "[id*='project-description']", ".description", "main", "article", "body"];
    for (const selector of selectors) {
      const node = doc.querySelector(selector);
      const text = (node?.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length >= 80) return text.slice(0, 12000);
    }
    return "";
  }

  function extractBidHref(doc, id, baseUrl) {
    const anchors = [...doc.querySelectorAll('a[href*="/project/bid/"]')];
    const exact = anchors.find((a) => idFrom(a.getAttribute("href") || a.href) === id);
    if (!exact) return `https://www.99freelas.com.br/project/bid/${id}`;
    try { return new URL(exact.getAttribute("href") || exact.href, baseUrl).href; }
    catch { return `https://www.99freelas.com.br/project/bid/${id}`; }
  }

  function textareaProposal(doc) {
    const candidates = [...doc.querySelectorAll("textarea")].map((el) => {
      const ctx = normalize([el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.parentElement?.textContent].filter(Boolean).join(" "));
      const text = (el.value || el.textContent || "").trim();
      let score = 0;
      if (/detalhes|proposta|mensagem|descricao|apresentacao/.test(ctx)) score += 20;
      if (text.length > 40) score += 10;
      if (/li o escopo de/.test(normalize(text))) score += 30;
      return { text, score };
    }).filter((x) => x.text.length > 20).sort((a,b) => b.score - a.score);
    return candidates[0]?.text || "";
  }

  function quotedScope(proposal) {
    const raw = String(proposal || "");
    const patterns = [
      /li\s+(?:com\s+aten[cç][aã]o\s+)?o\s+escopo\s+de\s*[“\"']([^”\"']{4,220})[”\"']/i,
      /escopo\s+de\s*[“\"']([^”\"']{4,220})[”\"']/i
    ];
    for (const rx of patterns) {
      const m = raw.match(rx);
      if (m) return m[1].replace(/\s+/g, " ").trim();
    }
    return "";
  }

  function conversationProposal(doc) {
    const text = (doc.body?.innerText || doc.body?.textContent || "").replace(/\r/g, "");
    const quoted = text.match(/(?:Detalhes da proposta:|Enviei uma proposta[^\n]*\n)([\s\S]{40,2500}?)(?=\n\s*(?:Caua|Cliente|Freelancer|R\$|Valor|Prazo|Enviada pelo sistema|$))/i);
    if (quoted) return quoted[1].trim();
    const idx = normalize(text).indexOf("li o escopo de");
    if (idx >= 0) {
      const rawStart = Math.max(0, idx - 40);
      return text.slice(rawStart, rawStart + 2200).trim();
    }
    return "";
  }

  function detectCategory(title, description) {
    const t = normalize(title);
    const all = normalize(`${title} ${description}`);
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
    for (const [name, rx] of rules) if (rx.test(all)) return name;
    return "generic";
  }

  function correctedProposal(title, description) {
    const kind = detectCategory(title, description);
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
    }[kind];
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
    }[kind];
    return `${intro}\n\n${body}\n\nMantenho o valor e o prazo já enviados; esta correção altera apenas o texto da proposta para refletir corretamente este projeto.`;
  }

  async function fetchDoc(url) {
    const response = await fetch(url, { credentials: "include", cache: "no-store", redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    return { doc: new DOMParser().parseFromString(html, "text/html"), finalUrl: response.url || url };
  }

  async function auditOne(job) {
    const id = String(job.projectId || "");
    if (!id) return { id, status: "review", reason: "ID ausente" };
    let projectUrl = job.projectUrl || "";
    if (!projectUrl) return { id, status: "review", title: job.title || `Projeto ${id}`, reason: "URL original não ficou salva; revisão manual necessária." };

    try {
      const project = await fetchDoc(projectUrl);
      const title = projectTitleFromDoc(project.doc, project.finalUrl || projectUrl) || job.title || `Projeto ${id}`;
      const description = descriptionFromDoc(project.doc);
      const bidHref = extractBidHref(project.doc, id, project.finalUrl || projectUrl);

      let proposal = "";
      try {
        const bid = await fetchDoc(bidHref);
        proposal = textareaProposal(bid.doc);
      } catch {}

      if (!proposal) {
        try {
          const conv = await fetchDoc(`${ORIGIN}/p/${id}`);
          proposal = conversationProposal(conv.doc);
        } catch {}
      }

      if (!proposal) {
        return { id, title, projectUrl, bidHref, description, status: "review", reason: "Não consegui ler automaticamente o texto enviado." };
      }

      const quoted = quotedScope(proposal);
      if (!quoted) {
        return { id, title, projectUrl, bidHref, description, proposal, status: "review", reason: "Texto encontrado, mas sem o título citado no padrão do Copilot." };
      }

      const similarity = titleSimilarity(title, quoted);
      const result = {
        id, title, quoted, similarity, projectUrl, bidHref, description, proposal,
        status: similarity >= 0.65 ? "ok" : similarity < 0.45 ? "wrong" : "review",
        reason: similarity >= 0.65 ? "Título citado combina com o projeto." : similarity < 0.45 ? "Título citado não combina com o projeto." : "Semelhança intermediária; revisar antes de alterar."
      };

      if (result.status === "wrong") {
        result.correctedProposal = correctedProposal(title, description);
        await chrome.storage.local.set({ [`crs99AuditFix:${id}`]: {
          projectId: id,
          projectUrl,
          bidHref,
          title,
          proposal: result.correctedProposal,
          createdAt: new Date().toISOString()
        }});
      }
      return result;
    } catch (error) {
      return { id, title: job.title || `Projeto ${id}`, projectUrl, status: "review", reason: `Falha ao consultar: ${String(error?.message || error)}` };
    }
  }

  function ensureUI() {
    if (document.getElementById("crs99-audit-button")) return;
    const style = document.createElement("style");
    style.textContent = `
      #crs99-audit-button{position:fixed;right:16px;bottom:56px;z-index:2147483646;border:0;border-radius:9px;padding:9px 12px;background:#7c3aed;color:#fff;font:700 12px Arial,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.24)}
      #crs99-audit-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif}
      #crs99-audit-panel{width:min(900px,96vw);max-height:88vh;background:#fff;color:#172033;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.38);overflow:hidden;display:flex;flex-direction:column}
      #crs99-audit-head{padding:14px 16px;background:#111827;color:#fff;display:flex;justify-content:space-between;align-items:center;font-weight:800}
      #crs99-audit-close{border:0;background:#374151;color:#fff;border-radius:7px;padding:6px 9px;cursor:pointer}
      #crs99-audit-summary{padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:700}
      #crs99-audit-list{padding:12px;overflow:auto}
      .crs99-audit-card{border:1px solid #dfe4ea;border-radius:10px;padding:11px;margin-bottom:9px}
      .crs99-audit-card.wrong{border-color:#ef4444;background:#fff7f7}.crs99-audit-card.review{border-color:#f59e0b;background:#fffbeb}.crs99-audit-card.ok{border-color:#22c55e;background:#f0fdf4}
      .crs99-audit-title{font-weight:800;margin-bottom:5px}.crs99-audit-meta{font-size:12px;line-height:1.45}.crs99-audit-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.crs99-audit-actions button,.crs99-audit-actions a{border:0;border-radius:7px;padding:7px 9px;font:700 12px Arial,sans-serif;text-decoration:none;cursor:pointer;background:#e5e7eb;color:#172033}.crs99-audit-actions .fix{background:#2563eb;color:#fff}
    `;
    document.documentElement.appendChild(style);

    const button = document.createElement("button");
    button.id = "crs99-audit-button";
    button.type = "button";
    button.textContent = "CRS: Auditar enviadas";
    button.addEventListener("click", runAudit);
    document.documentElement.appendChild(button);
  }

  function openPanel() {
    document.getElementById("crs99-audit-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "crs99-audit-overlay";
    overlay.innerHTML = `<div id="crs99-audit-panel"><div id="crs99-audit-head"><span>Auditoria de propostas enviadas</span><button id="crs99-audit-close">Fechar</button></div><div id="crs99-audit-summary">Preparando auditoria…</div><div id="crs99-audit-list"></div></div>`;
    document.documentElement.appendChild(overlay);
    overlay.querySelector("#crs99-audit-close").addEventListener("click", () => overlay.remove());
    return overlay;
  }

  function renderResults(overlay, results) {
    const wrong = results.filter((r) => r.status === "wrong");
    const review = results.filter((r) => r.status === "review");
    const ok = results.filter((r) => r.status === "ok");
    overlay.querySelector("#crs99-audit-summary").textContent = `ERRADAS: ${wrong.length} · REVISAR: ${review.length} · OK: ${ok.length} · TOTAL: ${results.length}`;
    const list = overlay.querySelector("#crs99-audit-list");
    list.innerHTML = "";
    const ordered = [...wrong, ...review, ...ok];
    for (const r of ordered) {
      const card = document.createElement("div");
      card.className = `crs99-audit-card ${r.status}`;
      const label = r.status === "wrong" ? "❌ ERRADA" : r.status === "review" ? "⚠️ REVISAR" : "✅ OK";
      card.innerHTML = `<div class="crs99-audit-title">${label} — ${escapeHtml(r.title || `Projeto ${r.id}`)}</div><div class="crs99-audit-meta">${escapeHtml(r.reason || "")} ${r.quoted ? `<br><b>Título citado na proposta:</b> ${escapeHtml(r.quoted)}` : ""}</div><div class="crs99-audit-actions"></div>`;
      const actions = card.querySelector(".crs99-audit-actions");
      if (r.projectUrl) {
        const a = document.createElement("a"); a.href = r.projectUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "Abrir projeto"; actions.appendChild(a);
      }
      if (r.status === "wrong" && r.bidHref) {
        const fix = document.createElement("button");
        fix.className = "fix"; fix.textContent = "Abrir correção";
        fix.addEventListener("click", () => {
          const u = new URL(r.bidHref, ORIGIN); u.searchParams.set("crs99auditfix", "1"); u.searchParams.set("crs99id", r.id); window.open(u.href, "_blank");
        });
        actions.appendChild(fix);
      }
      if (r.status === "wrong" && r.correctedProposal) {
        const copy = document.createElement("button"); copy.textContent = "Copiar texto corrigido";
        copy.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(r.correctedProposal); copy.textContent = "Copiado"; }
          catch { window.prompt("Copie o texto corrigido:", r.correctedProposal); }
        });
        actions.appendChild(copy);
      }
      list.appendChild(card);
    }
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>\"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
  }

  async function runAudit() {
    const overlay = openPanel();
    await migrateOnce();
    const jobs = await getJobs();
    const sent = Object.values(jobs).filter((j) => j?.status === "sent");
    if (!sent.length) {
      overlay.querySelector("#crs99-audit-summary").textContent = "Nenhuma proposta enviada registrada localmente.";
      return;
    }

    const results = [];
    const summary = overlay.querySelector("#crs99-audit-summary");
    let index = 0;
    const workers = Array.from({ length: Math.min(3, sent.length) }, async () => {
      while (true) {
        const current = index++;
        if (current >= sent.length) break;
        summary.textContent = `Auditando ${Math.min(current + 1, sent.length)}/${sent.length}…`;
        const result = await auditOne(sent[current]);
        results.push(result);
        await sleep(100);
      }
    });
    await Promise.all(workers);
    results.sort((a,b) => String(a.id).localeCompare(String(b.id)));
    await chrome.storage.local.set({ crs99LastAudit: { at: new Date().toISOString(), results } });
    renderResults(overlay, results);
  }

  migrateOnce().then(ensureUI).catch(ensureUI);
})();