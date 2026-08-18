(() => {
  if (window.__CRS99_AUTOPILOT_FAST__) return;
  window.__CRS99_AUTOPILOT_FAST__ = true;

  const norm = (v="") => String(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
  const all = (s,r=document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function idFrom(value="") {
    let text = String(value || "");
    try { if (/^https?:/i.test(text)) text = new URL(text).pathname; } catch {}
    text = text.replace(/[?#].*$/,"").replace(/\/+$/,"");
    let m = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i); if (m) return m[1];
    m = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i); if (m) return m[1];
    m = text.match(/\/p\/(\d{4,})(?:\/|$)/i); if (m) return m[1];
    m = text.match(/(?:^|[-/])(\d{4,})$/); return m ? m[1] : "";
  }

  const id = idFrom(location.pathname);
  if (!id) return;
  const isBid = /\/project\/bid\//i.test(location.pathname);
  const mode = new URLSearchParams(location.search).get("crs99");

  function category(text) {
    const n = norm(text);
    if (/excel|google sheets|planilha|csv|dashboard|estoque|sku/.test(n)) return "spreadsheet";
    if (/landing page|pagina de vendas|wordpress|elementor|site institucional|html|css/.test(n)) return "landing";
    if (/pesquisa|levantamento|lista de|coleta de dados|leads/.test(n)) return "research";
    if (/data entry|digitacao|cadastro|preenchimento de dados/.test(n)) return "data";
    if (/powerpoint|apresentacao|slides|pitch deck/.test(n)) return "presentation";
    if (/canva|criativo|carrossel|banner|design/.test(n)) return "design";
    if (/apa|abnt|dissertacao|tese|word|pdf|formatacao|revisao|transcricao/.test(n)) return "document";
    if (/python|javascript|script|automacao web|web scraping|api|webhook|n8n|make/.test(n)) return "script";
    if (/traducao|traduzir|espanhol|portugues/.test(n)) return "translation";
    if (/vsl|copy|copywriting|redacao|roteiro|descricao de produto|seo/.test(n)) return "copy";
    if (/edicao de video|reels|video|capcut|shorts/.test(n)) return "video";
    if (/social media|instagram|tiktok|calendario editorial|legendas/.test(n)) return "social";
    if (/buscar vagas|candidatura|linkedin|indeed|vagas.com/.test(n)) return "jobs";
    return "generic";
  }

  function buildPlan() {
    const text = (document.body?.innerText || "").replace(/\s+/g," ").trim();
    const n = norm(text);
    const title = document.querySelector("h1")?.textContent?.trim() || document.title.replace(/\s*\|.*$/,"").trim() || `Projeto ${id}`;
    const cat = category(text);
    const cfg = {
      spreadsheet:[790,4], landing:[490,3], research:[390,3], data:[290,3], presentation:[390,3], design:[350,3], document:[290,2], script:[690,4], translation:[350,3], copy:[390,3], video:[390,3], social:[350,3], jobs:[350,7], generic:[350,3]
    }[cat];
    let [price,days] = cfg;
    if (cat === "script" && /api|n8n|make|webhook/.test(n)) { price = 790; days = 5; }
    if (cat === "spreadsheet" && /automacao|estoque|dashboard|power query|sku/.test(n)) price = 790;
    if (cat === "research") {
      const q = n.replace(/\./g,"").match(/\b(\d{2,6})\s*(?:canais|leads|empresas|contatos|itens|produtos|registros|linhas)\b/);
      if (q && Number(q[1]) >= 1000) { price = 890; days = 5; }
    }
    const hard = /presencial obrigatorio|responsavel tecnico obrigatorio|crc obrigatorio|oab obrigatoria|crea obrigatorio|crm obrigatorio|burlar captcha|bypass anti-bot|invadir sistema|hackear/.test(n);
    const intros = {
      spreadsheet:`Olá! Li o escopo de “${title}”. Posso organizar e automatizar a solução mantendo o processo claro e fácil de usar.`,
      landing:`Olá! Li o escopo de “${title}”. Posso desenvolver a página de forma responsiva e organizada, seguindo o material e a referência fornecidos.`,
      research:`Olá! Li o escopo de “${title}”. Posso executar a pesquisa com critérios consistentes e entregar os dados organizados para validação.`,
      data:`Olá! Li o escopo de “${title}”. Posso organizar e preencher os dados com padronização e revisão de inconsistências.`,
      presentation:`Olá! Li o escopo de “${title}”. Posso transformar o conteúdo em uma apresentação clara, consistente e editável.`,
      design:`Olá! Li o escopo de “${title}”. Posso criar as peças no formato solicitado, mantendo consistência visual e organização.`,
      document:`Olá! Li o escopo de “${title}”. Posso revisar, organizar e padronizar o material conforme os critérios solicitados.`,
      script:`Olá! Li o escopo de “${title}”. Posso desenvolver a automação/script com foco no fluxo descrito, testes e uma entrega simples de manter.`,
      translation:`Olá! Li o escopo de “${title}”. Posso fazer a tradução preservando sentido, tom e naturalidade, com revisão final.`,
      copy:`Olá! Li o escopo de “${title}”. Posso escrever e estruturar o texto com foco em clareza, retenção e objetivo comercial.`,
      video:`Olá! Li o escopo de “${title}”. Posso organizar a edição mantendo ritmo, legibilidade e consistência visual.`,
      social:`Olá! Li o escopo de “${title}”. Posso estruturar o conteúdo e as peças com foco no objetivo informado e consistência de publicação.`,
      jobs:`Olá! Li o escopo de “${title}”. Posso executar a busca e candidatura de forma organizada, seguindo os critérios informados e registrando cada ação.`,
      generic:`Olá! Li com atenção o escopo de “${title}”. Posso executar a entrega de forma objetiva, validando os requisitos e mantendo o trabalho dentro do combinado.`
    };
    const body = cat === "research" ? "A entrega será organizada em colunas claras, com critérios verificáveis e indicação quando alguma informação não estiver publicamente disponível." : cat === "spreadsheet" ? "Reviso a estrutura, implemento fórmulas/automação, testo dependências e entrego o arquivo organizado." : "Primeiro confirmo os dados de entrada e o resultado esperado; depois executo, valido e entrego o material pronto.";
    const proposal = `${intros[cat]}\n\n${body}\n\nPrazo estimado: ${days} dias úteis após receber os materiais/acessos necessários. Proposta inicial: R$ ${price}.`;
    return { projectId:id, projectKey:id, title, category:cat, price, days, proposal, decision:hard?"skip":"opportunistic", generatedAt:new Date().toISOString(), sourceUrl:location.href.split("?")[0] };
  }

  async function savePlan(plan) {
    await chrome.storage.local.set({ [`crs99Plan:${id}`]: plan, crs99LastPreparedPlan: plan });
  }

  function findBidAction() {
    return all('a[href*="/project/bid/"]').find(a => idFrom(a.href) === id) || all('a,button').find(el => {
      const t = norm(el.textContent || el.value || "");
      return t.includes("enviar proposta") || t.includes("fazer proposta");
    }) || null;
  }

  function ctx(el) {
    const p = [el.name,el.id,el.placeholder,el.getAttribute("aria-label")].filter(Boolean);
    const parent = el.closest(".form-group,.field,.control-group,.row,.input-group,div");
    if (parent) p.push((parent.innerText || "").slice(0,300));
    return norm(p.join(" "));
  }
  function vis(el) { if (!el || el.disabled || el.readOnly) return false; const r=el.getBoundingClientRect(); return r.width>0 && r.height>0; }
  function best(cands, terms, tag="") {
    const ranked = cands.filter(vis).map(el => { const c=ctx(el); let s=0; terms.forEach((t,i)=>{ if(c.includes(norm(t))) s += 30-i; }); if(tag && el.tagName===tag) s+=4; return {el,s}; }).sort((a,b)=>b.s-a.s);
    return ranked[0]?.s>0 ? ranked[0].el : null;
  }
  function setVal(el,val) {
    if (!el || val==null) return false;
    const s=String(val); el.focus();
    if (el.isContentEditable) { el.textContent=s; el.dispatchEvent(new Event("input",{bubbles:true})); }
    else { const proto=el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set; if(setter) setter.call(el,s); else el.value=s; el.dispatchEvent(new Event("input",{bubbles:true})); }
    el.dispatchEvent(new Event("change",{bubbles:true})); el.dispatchEvent(new Event("blur",{bubbles:true})); return true;
  }

  async function fill() {
    let data = await chrome.storage.local.get([`crs99Plan:${id}`,"crs99LastPreparedPlan"]);
    let plan = data[`crs99Plan:${id}`];
    if (!plan && idFrom(data.crs99LastPreparedPlan?.sourceUrl || data.crs99LastPreparedPlan?.projectId || "") === id) plan = data.crs99LastPreparedPlan;
    if (!plan || plan.decision === "skip" || String(plan.projectId || plan.projectKey) !== id) return false;
    for (let i=0;i<12;i++) {
      const textareas=[...all("textarea"),...all('[contenteditable="true"]')];
      const proposal=best(textareas,["proposta","mensagem","descricao","apresentacao"],"TEXTAREA") || (textareas.filter(vis).length===1?textareas.filter(vis)[0]:null);
      const inputs=all("input").filter(vis);
      const price=best(inputs,["valor da proposta","valor","preco","orcamento","oferta","r$"]);
      const days=best(inputs,["prazo","dias","entrega","tempo"]);
      let ok=0; if(proposal&&setVal(proposal,plan.proposal))ok++; if(price&&setVal(price,plan.price))ok++; if(days&&setVal(days,plan.days))ok++;
      if (ok>=3) { const submit=all('button,input[type="submit"],input[type="button"],a').find(el=>norm(el.textContent||el.value||"").includes("enviar proposta")); if(submit){submit.dataset.crs99Ready="true"; submit.scrollIntoView({behavior:"smooth",block:"center"});} return true; }
      await sleep(200);
    }
    return false;
  }

  if (isBid) { setTimeout(()=>fill().catch(()=>{}),50); return; }
  if (mode === "prepare") {
    setTimeout(async () => {
      const plan = buildPlan();
      if (plan.decision === "skip") return;
      await savePlan(plan);
      const action = findBidAction();
      if (!action) return;
      if (action.href) { const u=new URL(action.href,location.origin); u.searchParams.set("crs99","autofill"); u.searchParams.set("crs99id",id); location.href=u.href; }
      else action.click();
    },80);
  }
})();