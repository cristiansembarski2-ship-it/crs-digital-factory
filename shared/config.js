(() => {
  "use strict";

  const config = Object.freeze({
    brandName: "CRS Digital",
    supportUrl: "https://link.mercadopago.com.br/crsdigital",
    contactEmail: "cristiansemebarski2@gmail.com",
    siteUrl: "https://crs-digital-factory.vercel.app",
    mercadoPagoFeeRate: 0.05,
    observability: Object.freeze({ webAnalyticsEnabled: false, speedInsightsEnabled: true }),
    commerce: Object.freeze({
      mapa3CotacoesPro: Object.freeze({
        name: "Mapa 3 Cotações Pro",
        price: 49.90,
        currency: "BRL",
        checkoutUrl: null,
        status: "Checkout em configuração"
      })
    }),
    products: Object.freeze([
      Object.freeze({ id: "lpc-fitlab", name: "LPC FitLab for Godot 4", path: "/LPC_FitLab_V1_Completo_GitHub/", status: "Disponível" }),
      Object.freeze({ id: "fiscalsafe", name: "FiscalSafe XML", path: "/fiscalsafe/", status: "Disponível" }),
      Object.freeze({ id: "plantao-ics", name: "Plantão.ics", path: "/Plantao_ICS_V1/", status: "Disponível" }),
      Object.freeze({ id: "mapa-3-cotacoes", name: "Mapa 3 Cotações", path: "/mapa-3-cotacoes/", status: "Disponível" }),
      Object.freeze({ id: "mapa-3-cotacoes-pro", name: "Mapa 3 Cotações Pro", path: "/mapa-3-cotacoes-pro/", status: "Checkout em configuração", price: 49.90 })
    ])
  });

  window.CRS_CONFIG = config;

  function applyConfig() {
    document.querySelectorAll("[data-crs-brand]").forEach((element) => {
      element.textContent = config.brandName;
    });
    document.querySelectorAll("[data-crs-support-link]").forEach((element) => {
      element.href = config.supportUrl;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    });
    document.querySelectorAll("[data-crs-contact-link]").forEach((element) => {
      element.href = "mailto:" + config.contactEmail;
      if (!element.textContent.trim()) element.textContent = config.contactEmail;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyConfig, { once: true });
  } else {
    applyConfig();
  }
})();