(() => {
  if (window.__CRS99_MY_PROPOSALS__) return;
  window.__CRS99_MY_PROPOSALS__ = true;

  const { normalize, idFrom, titleSimilarity } = window.CRS99;
  const ORIGIN = location.origin;

  const style = document.createElement('style');
  style.textContent = `
    .crs99-mp-badge{display:inline-block;margin:6px 6px 6px 0;padding:5px 8px;border-radius:7px;font:700 12px Arial,sans-serif}
    .crs99-mp-ok{background:#dcfce7;color:#166534}
    .crs99-mp-wrong{background:#fee2e2;color:#991b1b}
    .crs99-mp-review{background:#fef3c7;color:#92400e}
    .crs99-mp-fix{display:inline-block;margin:6px 0;padding:6px 9px;border:0;border-radius:7px;background:#dc2626;color:#fff;font:700 12px Arial,sans-serif;cursor:pointer}
    #crs99-mp-summary{position:fixed;right:16px;bottom:16px;z-index:2147483646;background:#111827;color:#fff;border-radius:10px;padding:10px 12px;font:700 12px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)}
  `;
  document.documentElement.appendChild(style);

  function projectAnchors() {
    return [...document.querySelectorAll('a[href*="/project/"]')]
      .filter(a => idFrom(a.href || a.getAttribute('href')))
      .filter(a => !/\/project\/bid\//i.test(a.href || ''));
  }

  function nearestProposalBlock(anchor) {
    let node = anchor;
    for (let i = 0; i < 8 && node; i++, node = node.parentElement) {
      const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
      if (/Enviada:\s*\d{2}\/\d{2}\/\d{4}/i.test(text) && /Oferta/i.test(text)) return node;
    }
    return anchor.parentElement || anchor;
  }

  function quotedScope(text = '') {
    const raw = String(text || '');
    const patterns = [
      /li\s+(?:com\s+aten[cç][aã]o\s+)?o\s+escopo\s+de\s*[?“\"']([^?”\"']{4,220})[?”\"']/i,
      /escopo\s+de\s*[?“\"']([^?”\"']{4,220})[?”\"']/i
    ];
    for (const rx of patterns) {
      const m = raw.match(rx);
      if (m) return m[1].replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  function statusText(block) {
    const text = normalize(block?.innerText || block?.textContent || '');
    if (text.includes('projeto fechado')) return 'closed';
    if (text.includes('projeto cancelado')) return 'closed';
    if (text.includes('rejeitada')) return 'closed';
    return 'active';
  }

  function proposalSnippet(block, title) {
    const text = (block?.innerText || block?.textContent || '').replace(/\r/g, '');
    const idx = text.indexOf(title);
    let rest = idx >= 0 ? text.slice(idx + title.length) : text;
    rest = rest.replace(/^\s+/,'');
    const sentAt = rest.search(/Enviada:\s*\d{2}\/\d{2}\/\d{4}/i);
    if (sentAt >= 0) rest = rest.slice(sentAt);
    const marker = rest.search(/Olá!|Olá,|Li o projeto|Posso desenvolver|Tenho interesse|Entendi que|Posso realizar/i);
    if (marker >= 0) rest = rest.slice(marker);
    return rest.slice(0, 2800).trim();
  }

  function classify(title, block) {
    const proposal = proposalSnippet(block, title);
    const quoted = quotedScope(proposal);
    if (quoted) {
      const similarity = titleSimilarity(title, quoted);
      if (similarity < 0.45) return { status:'wrong', quoted, similarity, proposal, reason:'O título citado na proposta é de outro projeto.' };
      if (similarity >= 0.65) return { status:'ok', quoted, similarity, proposal, reason:'O título citado corresponde ao projeto.' };
      return { status:'review', quoted, similarity, proposal, reason:'O título citado é parecido, mas não o bastante para corrigir automaticamente.' };
    }

    // Propostas antigas/manuais nem sempre citam o título. Não inferimos erro sem evidência.
    return { status:'review', quoted:'', similarity:null, proposal, reason:'A proposta não cita um título comparável; revisão manual conservadora.' };
  }

  function projectTitle(anchor) {
    return (anchor.textContent || '').replace(/\s+/g,' ').trim();
  }

  function removeOldUI(block, id) {
    block.querySelectorAll(`.crs99-mp-ui[data-crs99-id="${CSS.escape(id)}"]`).forEach(el => el.remove());
  }

  async function fetchText(url) {
    const r = await fetch(url, { credentials:'include', cache:'no-store', redirect:'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return { text: await r.text(), url: r.url || url };
  }

  function parseDoc(html) { return new DOMParser().parseFromString(html, 'text/html'); }

  function descriptionFromDoc(doc) {
    const selectors = ['.project-description','[class*="project-description"]','[id*="project-description"]','.description','main','article','body'];
    for (const sel of selectors) {
      const node = doc.querySelector(sel);
      const text = (node?.textContent || '').replace(/\s+/g,' ').trim();
      if (text.length >= 80) return text.slice(0,12000);
    }
    return '';
  }

  function detectCategory(title, description) {
    const t = normalize(title), all = normalize(`${title} ${description}`);
    const rules = [
      ['marketplace', /marketplace|mercado livre|shopee|amazon|venda de produtos|produtos infantis/],
      ['sales', /\bsdr\b|prospectar|prospeccao|captacao de clientes|captar clientes|geracao de leads|vendedor|vendas|afiliado/],
      ['spreadsheet', /excel|google sheets|planilha|csv|dashboard|estoque|sku/],
      ['landing', /landing page|pagina de vendas|wordpress|elementor|site institucional|html|css/],
      ['research', /pesquisa|levantamento|lista de|coleta de dados/],
      ['data', /data entry|digitacao|cadastro|preenchimento de dados|apoio administrativo|secretaria remota/],
      ['presentation', /powerpoint|apresentacao|slides|pitch deck/],
      ['design', /canva|criativo|carrossel|banner|design|logo|logotipo|miniatura/],
      ['document', /apa|abnt|dissertacao|tese|word|pdf|formatacao|revisao|livro|resumos/],
      ['script', /python|javascript|script|automacao|web scraping|api|webhook|n8n|make|manychat|moodle/],
      ['translation', /traducao|traduzir|espanhol|portugues|ingles/],
      ['copy', /vsl|copy|copywriting|redacao|roteiro|descricao de produto|depoimento textual/],
      ['video', /edicao de video|motion design|reels|video|capcut|shorts|ugc/],
      ['social', /social media|instagram|tiktok|redes sociais|calendario editorial|legendas/],
      ['jobs', /buscar vagas|candidatura|linkedin|indeed|vagas.com/]
    ];
    for (const [name, rx] of rules) if (rx.test(t)) return name;
    for (const [name, rx] of rules) if (rx.test(all)) return name;
    return 'generic';
  }

  function correctedProposal(title, description) {
    const kind = detectCategory(title, description);
    const intro = {
      marketplace:`Olá! Li o escopo de “${title}”. Posso atuar na organização e execução da operação de vendas no marketplace, alinhando catálogo, oferta, rotina e pontos de melhoria conforme o escopo.`,
      sales:`Olá! Li o escopo de “${title}”. Posso atuar na prospecção e qualificação inicial de potenciais clientes, seguindo o público, os canais e a rotina definidos no projeto.`,
      spreadsheet:`Olá! Li o escopo de “${title}”. Posso organizar e executar o trabalho em Excel/Google Sheets com foco no processo descrito, mantendo a estrutura clara e validável.`,
      landing:`Olá! Li o escopo de “${title}”. Posso desenvolver e organizar a página conforme o material, referências e objetivo informados no projeto.`,
      research:`Olá! Li o escopo de “${title}”. Posso executar a pesquisa com critérios consistentes e entregar os dados organizados para validação.`,
      data:`Olá! Li o escopo de “${title}”. Posso executar a rotina operacional e organizar os dados com padronização, registro e revisão de inconsistências.`,
      presentation:`Olá! Li o escopo de “${title}”. Posso transformar o conteúdo em uma apresentação clara, consistente e editável.`,
      design:`Olá! Li o escopo de “${title}”. Posso desenvolver a peça visual conforme o objetivo e as referências fornecidas, mantendo consistência e boa legibilidade.`,
      document:`Olá! Li o escopo de “${title}”. Posso revisar, organizar e padronizar o material conforme os critérios solicitados, preservando o conteúdo e a estrutura necessária.`,
      script:`Olá! Li o escopo de “${title}”. Posso estruturar a configuração/automação em etapas, validar o fluxo e documentar o que for implementado.`,
      translation:`Olá! Li o escopo de “${title}”. Posso trabalhar o conteúdo preservando sentido, tom e naturalidade, com revisão final.`,
      copy:`Olá! Li o escopo de “${title}”. Posso escrever e estruturar o texto com foco no objetivo do projeto, clareza e adequação ao público.`,
      video:`Olá! Li o escopo de “${title}”. Posso organizar a edição conforme o material e a referência, cuidando de ritmo, cortes, textos e consistência visual.`,
      social:`Olá! Li o escopo de “${title}”. Posso estruturar o conteúdo e a rotina de publicação conforme o objetivo informado, mantendo consistência entre as peças.`,
      jobs:`Olá! Li o escopo de “${title}”. Posso executar a busca e candidatura de forma organizada, seguindo os critérios informados e registrando as ações.`,
      generic:`Olá! Li com atenção o escopo de “${title}”. Posso executar a entrega de forma objetiva, alinhando primeiro o resultado esperado e mantendo o trabalho dentro do combinado.`
    }[kind];
    const body = {
      marketplace:'Sugiro começar alinhando produtos, marketplace, objetivo e rotina esperada. A partir disso organizo a execução em etapas e registro o que foi realizado.',
      sales:'Sugiro começar alinhando público-alvo, canal, abordagem, volume esperado e forma de acompanhamento. Assim conseguimos medir rapidamente o processo antes de ampliar.',
      spreadsheet:'Primeiro valido a estrutura e as regras do arquivo; depois implemento o necessário, testo os principais cenários e entrego o material organizado.',
      landing:'Organizo estrutura, seções, CTAs e versão mobile, testo a responsividade e entrego a página dentro do escopo combinado.',
      research:'A entrega será organizada em colunas claras, com critérios verificáveis e indicação quando alguma informação não estiver publicamente disponível.',
      data:'Faço a execução em lotes, padronizo o registro e reviso duplicidades ou inconsistências antes de concluir.',
      presentation:'Organizo hierarquia, títulos e mensagens principais, entregando o arquivo editável e pronto para apresentação.',
      design:'Estruturo composição, hierarquia visual e acabamento conforme o formato solicitado e as referências disponíveis.',
      document:'Faço a revisão e padronização de estrutura, títulos, espaçamento, referências e demais critérios aplicáveis ao material.',
      script:'Primeiro valido entradas, acessos e regras; depois configuro/implemento, testo o fluxo e entrego uma orientação curta de uso.',
      translation:'A entrega inclui adaptação do texto, revisão de fluidez e consistência de termos.',
      copy:'Estruturo o texto conforme o objetivo do projeto e entrego uma versão pronta para revisão e pequenos ajustes.',
      video:'Organizo cortes, ritmo, textos e transições conforme o material, a referência e o volume combinado.',
      social:'Posso organizar pauta, textos e peças em um lote inicial para validar direção e rotina antes de ampliar a recorrência.',
      jobs:'Registro vaga, empresa, link e status para manter o processo rastreável e aplicar somente quando os critérios principais forem compatíveis.',
      generic:'Primeiro confirmo os dados de entrada e o resultado esperado; depois executo, valido e entrego o material dentro do escopo.'
    }[kind];
    return `${intro}\n\n${body}\n\nMantenho o valor e o prazo já enviados; esta alteração corrige apenas o texto da proposta para refletir corretamente este projeto.`;
  }

  async function prepareFix(id, projectUrl, title, button) {
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparando…';
    try {
      const page = await fetchText(projectUrl);
      const doc = parseDoc(page.text);
      const description = descriptionFromDoc(doc);
      const proposal = correctedProposal(title, description);
      const fix = { projectId:id, projectUrl, bidHref:`${ORIGIN}/project/bid/${id}`, title, proposal, createdAt:new Date().toISOString() };
      await chrome.storage.local.set({ [`crs99AuditFix:${id}`]: fix });
      const url = new URL(fix.bidHref);
      url.searchParams.set('crs99auditfix','1');
      url.searchParams.set('crs99id',id);
      window.open(url.href, '_blank', 'noopener');
      button.textContent = 'Correção aberta';
    } catch (e) {
      button.disabled = false;
      button.textContent = old;
      alert(`CRS não conseguiu preparar a correção deste projeto: ${String(e?.message || e)}`);
    }
  }

  function render() {
    const seen = new Set();
    let ok = 0, wrong = 0, review = 0, closed = 0;

    for (const anchor of projectAnchors()) {
      const id = idFrom(anchor.href || anchor.getAttribute('href'));
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const title = projectTitle(anchor);
      if (!title || title.length < 4) continue;
      const block = nearestProposalBlock(anchor);
      removeOldUI(block, id);

      if (statusText(block) === 'closed') { closed++; continue; }
      const result = classify(title, block);
      if (result.status === 'ok') ok++;
      else if (result.status === 'wrong') wrong++;
      else review++;

      const ui = document.createElement('div');
      ui.className = 'crs99-mp-ui';
      ui.dataset.crs99Id = id;
      const badge = document.createElement('span');
      badge.className = `crs99-mp-badge crs99-mp-${result.status}`;
      badge.textContent = result.status === 'ok' ? '✅ CRS: OK' : result.status === 'wrong' ? '❌ CRS: ERRADA' : '⚠️ CRS: REVISAR';
      badge.title = result.reason + (result.quoted ? ` Citado: ${result.quoted}` : '');
      ui.appendChild(badge);

      if (result.status === 'wrong') {
        const fix = document.createElement('button');
        fix.type = 'button';
        fix.className = 'crs99-mp-fix';
        fix.textContent = 'Corrigir proposta';
        fix.addEventListener('click', () => prepareFix(id, anchor.href, title, fix));
        ui.appendChild(fix);
      }
      anchor.insertAdjacentElement('afterend', ui);
    }

    let summary = document.getElementById('crs99-mp-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'crs99-mp-summary';
      document.documentElement.appendChild(summary);
    }
    summary.textContent = `CRS Auditor: ${wrong} erradas · ${review} revisar · ${ok} OK${closed ? ` · ${closed} fechadas ignoradas` : ''}`;
  }

  setTimeout(render, 80);
  window.addEventListener('pageshow', render);
})();