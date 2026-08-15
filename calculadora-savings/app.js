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
  const supportLink = document.querySelector("[data-support-result-link]");
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

    liveMessage.textContent = `${isIncrease ? "Aumento" : isNeutral ? "Sem variação" : "Saving"} estimado: ${currency.format(absoluteTotal)}.`;
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    if (typeof window.va === "function") {
      window.va("event", {
        name: "savings_calculated",
        data: { outcome: result.outcome }
      });
    }
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
    if (typeof window.va === "function") {
      window.va("event", { name: "support_clicked_from_savings_result" });
    }
  });
})();
