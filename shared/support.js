(() => {
  "use strict";

  const product = document.body.dataset.crsProduct || "crs-digital";
  if (product === "mapa-3-cotacoes") return;

  const config = window.CRS_CONFIG || {};
  const supportUrl = config.supportUrl || "https://link.mercadopago.com.br/crsdigital";
  const sessionKey = "crs_support_prompt_" + product;
  const messages = {
    "lpc-fitlab": "Sua exportação ficou pronta. Se o FitLab economizou seu tempo, você pode apoiar com qualquer valor.",
    "fiscalsafe": "Seu relatório foi gerado. Se esta conferência ajudou seu trabalho, você pode apoiar com qualquer valor.",
    "plantao-ics": "Seu calendário está pronto. Se ele facilitou sua escala, você pode pagar um café para a CRS Digital."
  };

  function cleanReferrer() {
    try {
      return document.referrer ? new URL(document.referrer).hostname : "";
    } catch {
      return "";
    }
  }

  function sendOperationalEvent(name, content) {
    try {
      const params = new URLSearchParams(window.location.search);
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          path: window.location.pathname,
          content: String(content || "").slice(0, 120),
          source: params.get("utm_source") || "",
          medium: params.get("utm_medium") || "",
          campaign: params.get("utm_campaign") || "",
          referrer: cleanReferrer()
        }),
        keepalive: true,
        credentials: "omit"
      }).catch(() => {});
    } catch {}
  }

  function rememberClick(surface = "unknown") {
    try {
      const key = "crs_support_clicks";
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      data[product] = (data[product] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
    sendOperationalEvent("Support Click", `${product}:${surface}`);
  }

  function trackValue(surface = "value") {
    sendOperationalEvent("Tool Value Completed", `${product}:${surface}`);
  }

  function buildDialog() {
    if (document.querySelector(".crs-support-dialog")) return;
    const dialog = document.createElement("div");
    dialog.className = "crs-support-dialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "crs-support-title");
    dialog.innerHTML = [
      '<section class="crs-support-card">',
      "<small>Resultado concluído</small>",
      '<h2 id="crs-support-title">Esta ferramenta ajudou?</h2>',
      '<p data-crs-support-message></p>',
      '<div class="crs-support-actions">',
      '<a data-crs-support-pay href="' + supportUrl + '">☕ Apoiar com qualquer valor</a>',
      '<button type="button" data-crs-support-close>Agora não</button>',
      "</div>",
      "</section>"
    ].join("");
    dialog.querySelector("[data-crs-support-message]").textContent = messages[product] || "Se esta ferramenta ajudou, apoie a criação de novas ferramentas gratuitas.";
    dialog.querySelector("[data-crs-support-pay]").addEventListener("click", () => rememberClick("dialog"));
    dialog.querySelector("[data-crs-support-close]").addEventListener("click", () => { dialog.hidden = true; });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.hidden = true; });
    document.body.appendChild(dialog);
  }

  function show(detail = {}) {
    buildDialog();
    const dialog = document.querySelector(".crs-support-dialog");
    const message = dialog.querySelector("[data-crs-support-message]");
    if (detail.message) message.textContent = detail.message;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {}
    dialog.hidden = false;
  }

  function addChip() {
    if (document.querySelector(".crs-support-chip")) return;
    const chip = document.createElement("a");
    chip.className = "crs-support-chip";
    chip.href = supportUrl;
    chip.target = "_blank";
    chip.rel = "noopener noreferrer";
    chip.textContent = "☕ Apoiar";
    chip.setAttribute("aria-label", "Apoiar voluntariamente a CRS Digital");
    chip.addEventListener("click", () => rememberClick("chip"));
    document.body.appendChild(chip);
  }

  window.CRS_SUPPORT = Object.freeze({ show });
  window.addEventListener("crs:value-completed", (event) => {
    trackValue("event");
    show(event.detail || {});
  });
  window.addEventListener("crs:metric", (event) => {
    if (event.detail && event.detail.event === "export_completed") show();
  });

  document.querySelectorAll("[data-crs-value-action]").forEach((element) => {
    element.addEventListener("click", () => {
      if (element.disabled) return;
      const message = element.dataset.crsValueMessage || "";
      trackValue(element.id || "value-action");
      setTimeout(() => show({ message }), 700);
    });
  });

  document.querySelectorAll("[data-crs-support-link]").forEach((element) => {
    element.addEventListener("click", () => rememberClick("inline"));
  });

  buildDialog();
  addChip();
})();