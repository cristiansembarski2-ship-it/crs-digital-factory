(() => {
  "use strict";

  const config = window.CRS_CONFIG || {};
  const settings = config.observability || {};

  function loadScript(src, id) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.defer = true;
    script.src = src;
    document.head.appendChild(script);
  }

  if (settings.speedInsightsEnabled !== false) {
    window.si = window.si || function () {
      (window.siq = window.siq || []).push(arguments);
    };
    loadScript("/_vercel/speed-insights/script.js", "crs-speed-insights");
  }

  if (settings.webAnalyticsEnabled === true) {
    window.va = window.va || function () {
      (window.vaq = window.vaq || []).push(arguments);
    };
    loadScript("/_vercel/insights/script.js", "crs-web-analytics");
  }

  const isRfqLinkPage = window.location.pathname.startsWith("/link-cotacao-fornecedores/");

  if (isRfqLinkPage) {
    loadScript("/link-cotacao-fornecedores/history.js", "crs-rfq-history");
  }

  function track(name, data) {
    if (typeof window.va !== "function") return;
    try {
      window.va("event", { name, data: data || {} });
    } catch (_) {
      // Analytics must never interfere with the product experience.
    }
  }

  const clickEvents = {
    shareBtn: "Desafio Share",
    cardBtn: "Desafio Card Download",
    copyBtn: "Desafio Link Copy",
    exampleBtn: "Desafio Example",
    approveBtn: "Desafio Send Approval",
    challengeBtn: "Desafio Challenge Colleague",
    rfqCopyBtn: "RFQ Copy",
    rfqShareBtn: "RFQ Share",
    rfqExampleBtn: "RFQ Example",
    hiddenCopyBtn: "Hidden Cost Copy",
    hiddenShareBtn: "Hidden Cost Share",
    hiddenExampleBtn: "Hidden Cost Example",
    creatorGenerateBtn: "Creator Case Generated",
    creatorCopyBtn: "Creator Copy",
    creatorShareBtn: "Creator Share",
    diagExampleBtn: "Savings Diagnostic Example",
    diagShareBtn: "Savings Diagnostic Share",
    diagCopyBtn: "Savings Diagnostic Copy",
    rfqLinkExampleBtn: "RFQ Link Example",
    rfqInviteShareBtn: "RFQ Invite Shared",
    rfqInviteCopyBtn: "RFQ Invite Copied",
    rfqInviteOpenBtn: "RFQ Supplier View Opened",
    rfqResponseShareBtn: "RFQ Response Shared",
    rfqResponseCopyBtn: "RFQ Response Copied",
    rfqAddComparisonBtn: "RFQ Response Added To Comparison",
    rfqBackCreateBtn: "RFQ New Request Started"
  };

  const trackedIds = Object.keys(clickEvents).map((id) => "#" + id).join(", ");

  document.addEventListener("click", (event) => {
    const target = event.target.closest(`[data-crs-track-content]${trackedIds ? ", " + trackedIds : ""}`);
    if (!target) return;

    const explicit = target.getAttribute("data-crs-track-content");
    if (explicit) {
      track("CTA Click", { content: explicit, path: location.pathname });
      return;
    }

    if (clickEvents[target.id]) {
      track(clickEvents[target.id], { path: location.pathname });
    }
  });

  const formEvents = {
    quoteForm: "Desafio Result Generated",
    rfqForm: "RFQ Generated",
    hiddenCostForm: "Hidden Cost Calculated",
    savingsDiagnosticForm: "Savings Diagnostic Generated",
    rfqLinkForm: "RFQ Link Created",
    supplierResponseForm: "RFQ Supplier Response Generated"
  };

  document.addEventListener("submit", (event) => {
    const id = event.target && event.target.id;
    if (id && formEvents[id]) track(formEvents[id], { path: location.pathname });
  });

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element && !element.value && value !== undefined && value !== null) {
      element.value = String(value);
    }
  }

  function prefillRfqTemplate() {
    if (!isRfqLinkPage || location.hash) return;

    const key = new URLSearchParams(location.search).get("template");
    if (!key) return;

    const templates = {
      epi: {
        item: "EPIs conforme relação de compra",
        qty: 1,
        unit: "lote",
        spec: "Informar marca/fabricante, CA vigente quando aplicável, tamanhos disponíveis, quantidade por embalagem e ficha técnica dos itens ofertados.",
        notes: "Destacar frete, disponibilidade, prazo de reposição, validade dos produtos e possibilidade de amostra quando aplicável."
      },
      escritorio: {
        item: "Materiais de escritório conforme lista",
        qty: 1,
        unit: "lote",
        spec: "Cotação por item com marca ofertada, unidade de fornecimento e quantidade por embalagem. Informar equivalentes somente quando tecnicamente comparáveis.",
        notes: "Destacar frete, prazo de entrega, disponibilidade e valor mínimo de pedido, se houver."
      },
      ti: {
        item: "Equipamentos e acessórios de TI conforme especificação",
        qty: 1,
        unit: "lote",
        spec: "Informar fabricante, modelo exato, configuração, sistema/licenças incluídos, garantia, prazo de suporte e condição do equipamento (novo, lacrado e com nota fiscal, quando aplicável).",
        notes: "Destacar frete, prazo de entrega, garantia on-site/balcão, disponibilidade e validade da proposta."
      },
      frete: {
        item: "Serviço de transporte / frete",
        qty: 1,
        unit: "operação",
        spec: "Informar modalidade, tipo de veículo, capacidade, cobertura geográfica, prazo de trânsito, rastreamento, seguro e condições para coleta/entrega. Ajuste o escopo com origem, destino, peso e volume reais.",
        notes: "Separar frete base, pedágio, GRIS, ad valorem, taxas adicionais, estadia e demais cobranças aplicáveis."
      },
      manutencao: {
        item: "Serviço de manutenção",
        qty: 1,
        unit: "serviço",
        spec: "Detalhar mão de obra, materiais/peças, horas previstas, qualificação técnica, escopo incluído e exclusões. Informar necessidade de visita técnica antes da proposta, quando aplicável.",
        notes: "Destacar prazo para atendimento, garantia do serviço, peças incluídas, deslocamento e condições para serviços adicionais."
      },
      uniformes: {
        item: "Uniformes profissionais",
        qty: 1,
        unit: "lote",
        spec: "Informar tecido/composição, gramatura quando aplicável, cores, grade de tamanhos, tipo de acabamento, aplicação de logotipo e padrão de embalagem. Solicitar amostra antes da produção quando necessário.",
        notes: "Destacar custo de personalização, prazo de amostra, prazo de produção, frete e política para troca de tamanhos."
      },
      limpeza: {
        item: "Materiais de limpeza conforme lista",
        qty: 1,
        unit: "lote",
        spec: "Informar marca/fabricante, apresentação, volume por embalagem, rendimento ou diluição quando aplicável e documentação técnica/sanitária exigível.",
        notes: "Destacar frete, prazo, validade dos produtos, disponibilidade e quantidade mínima por item."
      },
      mro: {
        item: "Materiais MRO / manutenção industrial",
        qty: 1,
        unit: "lote",
        spec: "Cotação por código/part number, fabricante, descrição técnica e unidade. Equivalentes devem ser identificados separadamente e acompanhados de documentação técnica para validação.",
        notes: "Destacar itens disponíveis em estoque, lead time dos demais, frete, garantia e condições para devolução de item incompatível."
      }
    };

    const template = templates[key];
    if (!template) return;

    setValue("li", template.item);
    setValue("lq", template.qty);
    setValue("lu", template.unit);
    setValue("ls", template.spec);
    setValue("ln", template.notes);
    setValue("lpay", "30 dias");
    setValue("lv", "10 dias");

    const itemField = document.getElementById("li");
    if (itemField) itemField.focus();

    track("RFQ Template Loaded", { template: key });
  }

  function installSupplierToBuyerLoop() {
    if (!isRfqLinkPage) return;

    const isSupplierLanding = location.hash.startsWith("#req=");
    const isBuyerResponseLanding = location.hash.startsWith("#resp=");

    if (isSupplierLanding) {
      track("RFQ Supplier Landing", { path: location.pathname });
    }
    if (isBuyerResponseLanding) {
      track("RFQ Buyer Response Landing", { path: location.pathname });
    }

    if (!isSupplierLanding) return;

    const supplierView = document.getElementById("supplierView");
    if (!supplierView || document.getElementById("supplierBuyerLoop")) return;

    const card = document.createElement("section");
    card.id = "supplierBuyerLoop";
    card.style.gridColumn = "1 / -1";
    card.style.padding = "20px";
    card.style.border = "1px solid rgba(69,224,196,.35)";
    card.style.borderRadius = "18px";
    card.style.background = "rgba(69,224,196,.06)";
    card.innerHTML = `
      <span style="display:block;color:#45e0c4;font-weight:900;text-transform:uppercase;letter-spacing:.08em;font-size:12px;margin-bottom:8px">Sua empresa também compra?</span>
      <strong style="display:block;font-size:22px;margin-bottom:7px">Transforme este convite em um novo ciclo.</strong>
      <p style="margin:0 0 14px;color:#c4d0de;line-height:1.55">Depois de responder, você também pode criar gratuitamente uma cotação padronizada para enviar aos seus próprios fornecedores.</p>
      <a href="/link-cotacao-fornecedores/?utm_source=supplier&utm_medium=referral&utm_campaign=rfq-loop" data-crs-track-content="rfq-supplier-becomes-buyer" style="display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 16px;border-radius:12px;background:linear-gradient(135deg,#74ccff,#45e0c4);color:#06111e;text-decoration:none;font-weight:900">Criar minha própria cotação →</a>
    `;
    supplierView.appendChild(card);
  }

  prefillRfqTemplate();
  installSupplierToBuyerLoop();
})();