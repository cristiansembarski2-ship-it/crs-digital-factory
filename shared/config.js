(() => {
  "use strict";

  const config = Object.freeze({
    brandName: "CRS Digital",
    supportUrl: "https://link.mercadopago.com.br/crsdigital",
    contactEmail: "cristiansemebarski2@gmail.com",
    siteUrl: "https://crs-digital-factory.vercel.app",
    mercadoPagoFeeRate: 0.05,
    observability: Object.freeze({ webAnalyticsEnabled: true, speedInsightsEnabled: true }),
    commerce: Object.freeze({
      mapa3CotacoesPro: Object.freeze({
        name: "Mapa 3 Cotações Pro",
        price: 49.90,
        currency: "BRL",
        checkoutUrl: "https://pay.kiwify.com.br/cNesrrZ",
        status: "Disponível"
      })
    }),
    products: Object.freeze([
      Object.freeze({ id: "lpc-fitlab", name: "LPC FitLab for Godot 4", path: "/LPC_FitLab_V1_Completo_GitHub/", status: "Disponível" }),
      Object.freeze({ id: "fiscalsafe", name: "FiscalSafe XML", path: "/fiscalsafe/", status: "Disponível" }),
      Object.freeze({ id: "plantao-ics", name: "Plantão.ics", path: "/Plantao_ICS_V1/", status: "Disponível" }),
      Object.freeze({ id: "mapa-3-cotacoes", name: "Mapa 3 Cotações", path: "/mapa-3-cotacoes/", status: "Disponível" }),
      Object.freeze({ id: "mapa-3-cotacoes-pro", name: "Mapa 3 Cotações Pro", path: "/mapa-3-cotacoes-pro/", status: "Disponível", price: 49.90 })
    ])
  });

  window.CRS_CONFIG = config;

  function normalizeTrackingValue(value, fallback) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return normalized || fallback;
  }

  function pageSlug() {
    return normalizeTrackingValue(window.location.pathname.replace(/^\/+|\/+$/g, "") || "home", "home");
  }

  function trackedCheckoutUrl(product, element) {
    const checkout = new URL(product.checkoutUrl);
    const incoming = new URLSearchParams(window.location.search);
    const content = normalizeTrackingValue(element.dataset.crsTrackContent || element.textContent, "cta");
    const route = pageSlug();

    checkout.searchParams.set("src", "crs-site");
    checkout.searchParams.set("utm_source", normalizeTrackingValue(incoming.get("utm_source"), "crs-digital"));
    checkout.searchParams.set("utm_medium", normalizeTrackingValue(incoming.get("utm_medium"), "owned-site"));
    checkout.searchParams.set("utm_campaign", normalizeTrackingValue(incoming.get("utm_campaign"), "mapa-3-cotacoes-pro"));
    checkout.searchParams.set("utm_content", normalizeTrackingValue(incoming.get("utm_content"), route + "-" + content));
    checkout.searchParams.set("s1", route);
    checkout.searchParams.set("s2", content);
    return checkout.toString();
  }

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
    document.querySelectorAll("[data-crs-checkout-link]").forEach((element) => {
      const product = config.commerce[element.dataset.crsCheckoutLink];
      if (!product || !product.checkoutUrl) return;
      element.href = trackedCheckoutUrl(product, element);
      element.target = "_blank";
      element.rel = "noopener noreferrer sponsored";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyConfig, { once: true });
  } else {
    applyConfig();
  }
})();
