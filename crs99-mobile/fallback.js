(() => {
  if (window.__CRS99_MOBILE_FALLBACK__) return;
  window.__CRS99_MOBILE_FALLBACK__ = true;

  const PREPARED_KEY = "crs99MobilePreparedV1";
  const normalize = (value = "") => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  function readPrepared() {
    try { return new Set(JSON.parse(localStorage.getItem(PREPARED_KEY) || "[]")); }
    catch { return new Set(); }
  }

  function markPrepared(id) {
    const ids = readPrepared();
    ids.add(String(id));
    localStorage.setItem(PREPARED_KEY, JSON.stringify([...ids]));
  }

  function cardData(card) {
    const id = String(card?.dataset?.projectId || "").trim();
    const title = card?.querySelector(".job-title")?.textContent?.trim() || "Projeto";
    const risk = card?.querySelector(".job-risk")?.textContent?.trim() || "";
    const priceText = card?.querySelector(".job-price")?.textContent || "";
    const daysText = card?.querySelector(".job-days")?.textContent || "";
    const priceMatch = priceText.replace(/\./g, "").replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
    const daysMatch = daysText.match(/(\d+)/);
    const price = priceMatch ? Number(priceMatch[1]) : "";
    const days = daysMatch ? Number(daysMatch[1]) : "";
    return { id, title, risk, price, days };
  }

  function proposalFor(data) {
    const t = normalize(`${data.title} ${data.risk}`);
    const title = data.title;
    let intro = `Olá! Li o projeto “${title}” e consigo executar a entrega de forma organizada, mantendo o escopo claro e validando os pontos principais antes de finalizar.`;
    let body = "Primeiro alinho os materiais e regras de entrada, depois faço a execução, reviso o resultado e entrego tudo pronto para uso, com uma rodada objetiva de ajustes dentro do escopo combinado.";

    if (/excel|planilha|dashboard|google sheets|estoque|orcamento|custos|preco de venda|investidor|financeir/.test(t)) {
      intro = `Olá! Li o projeto “${title}”. Posso estruturar a planilha de forma clara e automatizar os cálculos e controles necessários, deixando o arquivo simples de usar e manter.`;
      body = "Começo validando as regras e a base atual, depois organizo fórmulas, validações e automações, testo os principais cenários e entrego o arquivo revisado com uma orientação curta de uso.";
    } else if (/wordpress|elementor|site|landing page|blog/.test(t)) {
      intro = `Olá! Li o projeto “${title}”. Posso cuidar da implementação e dos ajustes do site de forma responsiva, organizada e fiel ao material fornecido.`;
      body = "Primeiro valido acesso, backup e escopo das páginas; depois implemento os ajustes, reviso desktop/mobile e entrego a primeira versão pronta para sua conferência.";
    } else if (/video|reels|meta ads|capcut|edicao/.test(t)) {
      intro = `Olá! Li o projeto “${title}”. Posso editar o material com cortes, ritmo, textos e transições consistentes com a referência e com o objetivo do conteúdo.`;
      body = "Organizo o lote, faço a primeira edição seguindo o padrão visual combinado e deixo uma rodada objetiva de ajustes para fechar o material sem alongar o processo.";
    } else if (/canva|cartilha|revista|artes|design|material institucional/.test(t)) {
      intro = `Olá! Li o projeto “${title}”. Posso criar o material com hierarquia visual clara, consistência entre as peças e arquivo final organizado para uso e edição.`;
      body = "Começo pelo conteúdo e referências fornecidas, estruturo o layout, desenvolvo a primeira versão e faço uma rodada objetiva de ajustes antes da entrega final.";
    } else if (/formulario|pontuacao|autoconhecimento/.test(t)) {
      intro = `Olá! Li o projeto “${title}”. Posso estruturar o formulário e a lógica de pontuação junto com a planilha de apoio, deixando o fluxo simples de conferir e manter.`;
      body = "Primeiro valido as regras de pontuação e saídas esperadas, depois monto o formulário, conecto a base, testo os cenários e entrego uma versão revisada para validação.";
    } else if (/organizacao financeira|estruturacao operacional|microempresa/.test(t)) {
      intro = `Olá! Li o projeto “${title}”. Posso organizar os controles e a rotina operacional em uma estrutura simples, visual e prática para o dia a dia.`;
      body = "Começo entendendo como os dados são registrados hoje, organizo categorias e controles, monto a estrutura de acompanhamento e deixo o processo documentado para facilitar a continuidade.";
    }

    const close = data.days
      ? `Consigo entregar a primeira versão em até ${data.days} ${data.days === 1 ? "dia útil" : "dias úteis"} após receber os materiais e regras necessários.`
      : "Assim que receber os materiais necessários, consigo iniciar e alinhar a primeira entrega.";

    return `${intro}\n\n${body}\n\n${close}`;
  }

  function hydrateCard(card) {
    if (!(card instanceof HTMLElement)) return;
    const preview = card.querySelector(".proposal-preview");
    if (!preview) return;
    const current = normalize(preview.textContent || "");
    if (!current.includes("sem texto de proposta salvo")) return;
    const data = cardData(card);
    if (!data.id) return;
    const proposal = proposalFor(data);
    card.dataset.crsFallbackProposal = proposal;
    preview.textContent = proposal;
    preview.title = "Proposta gerada automaticamente pelo CRS99 Mobile para revisão antes do envio.";
  }

  function hydrateAll(root = document) {
    root.querySelectorAll?.("article.job").forEach(hydrateCard);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      return true;
    }
  }

  function flash(message) {
    let box = document.getElementById("crs99-fallback-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "crs99-fallback-toast";
      box.style.cssText = "position:fixed;left:50%;bottom:24px;z-index:2147483647;transform:translateX(-50%);width:min(92vw,500px);padding:12px 15px;border-radius:14px;background:#e9fdf4;color:#08261a;font:800 13px/1.35 system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.35)";
      document.documentElement.appendChild(box);
    }
    box.textContent = message;
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.remove(), 2300);
  }

  function payloadUrl(data, proposal) {
    if (!/^\d{4,}$/.test(data.id) || !proposal || data.price === "" || data.days === "") return "";
    const payload = { v: 1, id: data.id, title: data.title, price: data.price, days: data.days, proposal, ts: Date.now() };
    return `https://www.99freelas.com.br/project/bid/${data.id}#crs99=${encodeURIComponent(JSON.stringify(payload))}`;
  }

  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    if (!target) return;
    const card = target.closest("article.job");
    if (!card) return;
    hydrateCard(card);
    const proposal = card.dataset.crsFallbackProposal;
    if (!proposal) return;
    const data = cardData(card);

    if (target.classList.contains("copy-proposal")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await copyText(proposal);
      flash("Proposta gerada e copiada.");
      return;
    }

    if (target.classList.contains("copy-all")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const text = [`Valor: R$ ${String(data.price).replace(".", ",")}`, `Prazo: ${data.days} dias`, `Proposta:\n${proposal}`].join("\n\n");
      await copyText(text);
      flash("Pacote completo copiado.");
      return;
    }

    if (target.classList.contains("prepare-bid")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const url = payloadUrl(data, proposal);
      if (!url) {
        flash("Ainda falta algum dado para preparar este projeto.");
        return;
      }
      markPrepared(data.id);
      flash("Proposta gerada. Abrindo o formulário correto…");
      setTimeout(() => {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) location.href = url;
      }, 120);
    }
  }, true);

  const observer = new MutationObserver(() => hydrateAll());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => hydrateAll());
  else hydrateAll();
})();
