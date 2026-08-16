(() => {
  "use strict";

  const core = window.CRS_SAVINGS_CORE;
  const form = document.querySelector("[data-savings-form]");
  const resultPanel = document.querySelector("[data-savings-result]");
  const copyButton = document.querySelector("[data-copy-result]");
  const exampleButton = document.querySelector("[data-fill-example]");
  const resetButton = document.querySelector("[data-reset-calculator]");
  const liveMessage = document.querySelector("[data-live-message]");
  const supportPrompt = document.querySelector("[data-support-after-result]");
  const supportLink = document.querySelector("[data-support-after-result] a");
  let latestResult = null;

  if (!core || !form || !resultPanel) return;

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
  const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

  function field(name) {
    return form.elements.namedItem(name);
  }

  function setText(selector, value) {
    const element = resultPanel.querySelector(selector);
    if (element) element.textContent = value;
  }

  function clearErrors() {
    form.querySelectorAll("[data-field-error]").forEach((element) => {
      element.textContent = "";
    });
    form.querySelectorAll("[aria-invalid='true']").forEach((element) => {
      element.setAttribute("aria-invalid", "false");
    });
  }

  function showErrors(errors) {
    Object.entries(errors).forEach(([name, message]) => {
      const input = field(name);
      const error = form.querySelector(`[data-field-error="${name}"]`);
      if (input) input.setAttribute("aria-invalid", "true");
      if (error) error.textContent = message;
    });

    const firstInvalid = form.querySelector("[aria-invalid='true']");
    if (firstInvalid) firstInvalid.focus();
    liveMessage.textContent = "Revise os campos destacados para calcular.";
  }

  function formatPercent(value) {
    return value === null ? "Não aplicável" : `${decimal.format(Math.abs(value))}%`;
  }

  function operationalTrack(name, data) {
    try {
      const params = new URLSearchParams(window.location.search);
      const payload = {
        name,
        path: window.location.pathname,
        content: data && data.outcome ? String(data.outcome) : "",
        source: params.get("utm_source") || "",
        medium: params.get("utm_medium") || "",
        campaign: params.get("utm_campaign") || "",
        referrer: document.referrer ? new URL(document.referrer).hostname : ""
      };
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "omit"
      }).catch(() => {});
    } catch (_) {
      // Telemetry must never interfere with the calculator.
    }
  }

  function track(name, data) {
    const operationalNames = {
      savings_calculated: "Savings Calculated",
      savings_result_shared: "Savings Result Shared",
      support_clicked_from_savings_result: "Savings Result Pro Click"
    };
    if (operationalNames[name]) operationalTrack(operationalNames[name], data || {});

    if (typeof window.va !== "function") return;
    try {
      window.va("event", { name, data: data || {} });
    } catch (_error) {
      // Métricas nunca devem interferir na calculadora.
    }
  }

  function ensureShareButton() {
    const actions = resultPanel.querySelector(".result-actions");
    if (!actions || actions.querySelector("[data-share-savings-result]")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.shareSavingsResult = "";
    button.textContent = "Compartilhar resultado";
    button.title = "Compartilha apenas a variação percentual e o link da calculadora; os valores em reais não são incluídos.";
    actions.insertBefore(button, actions.firstChild);

    button.addEventListener("click", async () => {
      if (!latestResult) return;

      const percent = formatPercent(latestResult.savingsPercent);
      const baseUrl = `${window.location.origin}/calculadora-savings/?utm_source=share&utm_medium=result&utm_campaign=savings-calculator`;
      const text = latestResult.outcome === "increase"
        ? `Minha negociação ficou ${percent} acima do baseline nesta estimativa. Faça seu cálculo grátis na Calculadora de Savings da Compra Sem Achismo.`
        : latestResult.outcome === "neutral"
          ? "Minha comparação ficou sem variação em relação ao baseline. Faça seu cálculo grátis na Calculadora de Savings da Compra Sem Achismo."
          : `Minha negociação ficou ${percent} abaixo do baseline nesta estimativa. Faça seu cálculo grátis na Calculadora de Savings da Compra Sem Achismo.`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: "Resultado da Calculadora de Savings",
            text,
            url: baseUrl
          });
        } else {
          await navigator.clipboard.writeText(`${text}\n${baseUrl}`);
          button.textContent = "Link e resultado copiados";
          window.setTimeout(() => { button.textContent = "Compartilhar resultado"; }, 1800);
        }
        liveMessage.textContent = "Resultado preparado para compartilhar sem incluir valores monetários.";
        track("savings_result_shared", { outcome: latestResult.outcome });
      } catch (error) {
        if (error && error.name === "AbortError") return;
        liveMessage.textContent = "Não foi possível compartilhar automaticamente.";
      }
    });
  }

  ensureShareButton();

  function updateSupportPrompt(result) {
    if (!supportPrompt) return;
    const title = supportPrompt.querySelector("strong");
    const copy = supportPrompt.querySelector("p");
    const amount = currency.format(Math.abs(result.savingsTotal));

    if (result.outcome === "saving") {
      if (title) title.textContent = `Você acabou de estimar ${amount} de saving. Como vai provar isso no fechamento?`;
      if (copy) copy.textContent = "O Painel Pro separa saving potencial e reconhecido, guarda baseline, evidência, responsável, status e metas para até 200 iniciativas — sem transformar um cálculo isolado em número impossível de defender depois.";
      if (supportLink) {
        supportLink.textContent = "Organizar os savings no Painel Pro — R$ 67";
        supportLink.dataset.crsTrackContent = "savings-resultado-saving-checkout";
      }
    } else if (result.outcome === "increase") {
      if (title) title.textContent = `O cenário negociado ficou ${amount} acima do baseline.`;
      if (copy) copy.textContent = "Nem toda negociação vira saving. O Painel Pro ajuda a manter baseline, status, evidências e iniciativas separadas para evitar reconhecer economia onde ela não existe.";
      if (supportLink) {
        supportLink.textContent = "Controlar iniciativas no Painel Pro — R$ 67";
        supportLink.dataset.crsTrackContent = "savings-resultado-aumento-checkout";
      }
    } else {
      if (title) title.textContent = "Sem variação nesta negociação. O controle continua importando.";
      if (copy) copy.textContent = "O Painel Pro organiza iniciativas, metas, baseline, evidências e saving reconhecido em uma visão única para que o resultado mensal não dependa de cálculos soltos.";
      if (supportLink) {
        supportLink.textContent = "Ver o Painel de Savings Pro — R$ 67";
        supportLink.dataset.crsTrackContent = "savings-resultado-neutro-checkout";
      }
    }
  }

  function renderResult(result) {
    latestResult = result;
    resultPanel.hidden = false;
    if (supportPrompt) supportPrompt.hidden = false;
    resultPanel.dataset.outcome = result.outcome;

    const isIncrease = result.outcome === "increase";
    const isNeutral = result.outcome === "neutral";
    const absoluteTotal = Math.abs(result.savingsTotal);

    setText("[data-result-label]", isIncrease ? "Aumento estimado" : isNeutral ? "Sem variação" : "Saving estimado");
    setText("[data-result-main]", currency.format(absoluteTotal));
    setText("[data-baseline-total]", currency.format(result.baselineTotal));
    setText("[data-negotiated-total]", currency.format(result.negotiatedTotal));
    setText("[data-unit-difference]", currency.format(Math.abs(result.differenceUnit)));
    setText("[data-saving-percent]", formatPercent(result.savingsPercent));
    setText(
      "[data-result-explanation]",
      isIncrease
        ? "O cenário negociado ficou acima do baseline para o volume informado."
        : isNeutral
          ? "Os dois cenários têm o mesmo valor total para o volume informado."
          : "Esta é a economia potencial para o volume informado, antes das validações internas."
    );

    updateSupportPrompt(result);
    liveMessage.textContent = `${isIncrease ? "Aumento" : isNeutral ? "Sem variação" : "Saving"} estimado: ${currency.format(absoluteTotal)}.`;
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    track("savings_calculated", { outcome: result.outcome });
  }

  function calculate() {
    clearErrors();
    const result = core.calculateSavings({
      baselineUnit: field("baselineUnit").value,
      negotiatedUnit: field("negotiatedUnit").value,
      quantity: field("quantity").value
    });

    if (!result.ok) {
      resultPanel.hidden = true;
      if (supportPrompt) supportPrompt.hidden = true;
      latestResult = null;
      showErrors(result.errors);
      return;
    }

    renderResult(result);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });

  exampleButton?.addEventListener("click", () => {
    field("baselineUnit").value = "50,00";
    field("negotiatedUnit").value = "46,00";
    field("quantity").value = "1200";
    calculate();
  });

  resetButton?.addEventListener("click", () => {
    form.reset();
    clearErrors();
    latestResult = null;
    resultPanel.hidden = true;
    if (supportPrompt) supportPrompt.hidden = true;
    liveMessage.textContent = "Calculadora limpa.";
    field("baselineUnit").focus();
  });

  copyButton?.addEventListener("click", async () => {
    if (!latestResult) return;

    const label = latestResult.outcome === "increase" ? "Aumento estimado" : latestResult.outcome === "neutral" ? "Variação" : "Saving estimado";
    const summary = [
      "Resumo da Calculadora de Savings — CRS Digital",
      `Baseline total: ${currency.format(latestResult.baselineTotal)}`,
      `Valor negociado total: ${currency.format(latestResult.negotiatedTotal)}`,
      `${label}: ${currency.format(Math.abs(latestResult.savingsTotal))}`,
      `Variação percentual: ${formatPercent(latestResult.savingsPercent)}`,
      "Cálculo gerencial estimado; valide a política interna antes de reconhecer o resultado."
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      copyButton.textContent = "Resumo copiado";
      liveMessage.textContent = "Resumo copiado para a área de transferência.";
      window.setTimeout(() => { copyButton.textContent = "Copiar resumo"; }, 1800);
    } catch (_error) {
      liveMessage.textContent = "Não foi possível copiar automaticamente. Selecione os resultados na tela.";
    }
  });

  supportLink?.addEventListener("click", () => {
    track("support_clicked_from_savings_result", { outcome: latestResult ? latestResult.outcome : "unknown" });
  });
})();