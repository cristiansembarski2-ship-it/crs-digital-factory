(() => {
  "use strict";

  const config = Object.freeze({
    brandName: "CRS Digital",
    supportUrl: "https://link.mercadopago.com.br/crsdigital",
    contactEmail: "",
    siteUrl: "https://crs-digital-factory.vercel.app",
    mercadoPagoFeeRate: 0.05,
    observability: Object.freeze({ webAnalyticsEnabled: true, speedInsightsEnabled: true }),
    commerce: Object.freeze({
      mapa3CotacoesPro: Object.freeze({
        name: "Mapa 3 Cotações Pro",
        price: 49.90,
        currency: "BRL",
        checkoutUrl: "https://pay.kiwify.com.br/cNesrrZ",
        campaign: "mapa-3-cotacoes-pro",
        status: "Disponível"
      }),
      painelSavingsComprasPro: Object.freeze({
        name: "Painel de Savings de Compras Pro",
        price: 67.00,
        currency: "BRL",
        checkoutUrl: "https://pay.kiwify.com.br/8PCmyr9",
        campaign: "painel-savings-compras-pro",
        status: "Disponível"
      })
    }),
    products: Object.freeze([
      Object.freeze({ id: "lpc-fitlab", name: "LPC FitLab for Godot 4", path: "/LPC_FitLab_V1_Completo_GitHub/", status: "Disponível" }),
      Object.freeze({ id: "fiscalsafe", name: "FiscalSafe XML", path: "/fiscalsafe/", status: "Disponível" }),
      Object.freeze({ id: "plantao-ics", name: "Plantão.ics", path: "/Plantao_ICS_V1/", status: "Disponível" }),
      Object.freeze({ id: "mapa-3-cotacoes", name: "Mapa 3 Cotações", path: "/mapa-3-cotacoes/", status: "Disponível" }),
      Object.freeze({ id: "calculadora-savings", name: "Calculadora de Savings", path: "/calculadora-savings/", status: "Disponível" }),
      Object.freeze({ id: "mapa-3-cotacoes-pro", name: "Mapa 3 Cotações Pro", path: "/mapa-3-cotacoes-pro/", status: "Disponível", price: 49.90 }),
      Object.freeze({ id: "painel-savings-compras-pro", name: "Painel de Savings de Compras Pro", path: "/painel-savings-compras-pro/", status: "Disponível", price: 67.00 })
    ])
  });

  window.CRS_CONFIG = config;

  const AFF_KEY = "crs_mapa_affiliate";
  const AFF_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  function base64UrlDecode(value) {
    try {
      let normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
      while (normalized.length % 4) normalized += "=";
      return decodeURIComponent(escape(atob(normalized)));
    } catch (_) {
      return "";
    }
  }

  function base64UrlEncode(value) {
    try {
      return btoa(unescape(encodeURIComponent(String(value || ""))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    } catch (_) {
      return "";
    }
  }

  function validKiwifyCheckout(raw) {
    try {
      const url = new URL(raw);
      return url.protocol === "https:" && (url.hostname === "pay.kiwify.com.br" || url.hostname.endsWith(".kiwify.com.br"));
    } catch (_) {
      return false;
    }
  }

  function rememberIncomingAffiliate() {
    const incoming = new URLSearchParams(window.location.search).get("aff");
    if (!incoming) return;
    const decoded = base64UrlDecode(incoming);
    if (!validKiwifyCheckout(decoded)) return;
    try {
      localStorage.setItem(AFF_KEY, JSON.stringify({ url: decoded, ts: Date.now() }));
    } catch (_) {
      // Storage can be unavailable; checkout still works normally.
    }
  }

  function storedAffiliate() {
    try {
      const raw = localStorage.getItem(AFF_KEY);
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      if (!parsed || !validKiwifyCheckout(parsed.url) || !Number.isFinite(parsed.ts) || Date.now() - parsed.ts > AFF_TTL_MS) {
        localStorage.removeItem(AFF_KEY);
        return "";
      }
      return parsed.url;
    } catch (_) {
      return "";
    }
  }

  function currentAffiliateToken() {
    const url = storedAffiliate();
    return url ? base64UrlEncode(url) : "";
  }

  function appendAffiliateToInternalUrl(rawUrl) {
    try {
      const token = currentAffiliateToken();
      if (!token) return rawUrl;
      const url = new URL(rawUrl, window.location.origin);
      if (url.origin !== window.location.origin) return rawUrl;
      if (url.pathname.startsWith("/apoie/")) return rawUrl;
      url.searchParams.set("aff", token);
      return url.toString();
    } catch (_) {
      return rawUrl;
    }
  }

  window.CRS_AFFILIATE = Object.freeze({
    getCheckoutUrl: storedAffiliate,
    getToken: currentAffiliateToken,
    appendToUrl: appendAffiliateToInternalUrl
  });

  rememberIncomingAffiliate();

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

  function trackedCheckoutUrl(product, element, productKey) {
    const affiliateCheckout = productKey === "mapa3CotacoesPro" ? storedAffiliate() : "";
    const checkout = new URL(affiliateCheckout || product.checkoutUrl);
    const incoming = new URLSearchParams(window.location.search);
    const content = normalizeTrackingValue(element.dataset.crsTrackContent || element.textContent, "cta");
    const route = pageSlug();

    checkout.searchParams.set("src", affiliateCheckout ? "crs-affiliate-tool" : "crs-site");
    checkout.searchParams.set("utm_source", normalizeTrackingValue(incoming.get("utm_source"), affiliateCheckout ? "affiliate-tool" : "crs-digital"));
    checkout.searchParams.set("utm_medium", normalizeTrackingValue(incoming.get("utm_medium"), affiliateCheckout ? "affiliate-referral" : "owned-site"));
    checkout.searchParams.set("utm_campaign", normalizeTrackingValue(incoming.get("utm_campaign"), product.campaign || route));
    checkout.searchParams.set("utm_content", normalizeTrackingValue(incoming.get("utm_content"), route + "-" + content));
    checkout.searchParams.set("s1", route);
    checkout.searchParams.set("s2", content);
    return checkout.toString();
  }

  function decorateInternalAnchor(element) {
    if (!element || element.hasAttribute("data-crs-checkout-link")) return;
    const raw = element.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
    try {
      const url = new URL(raw, window.location.origin);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/apoie/")) return;
      const decorated = appendAffiliateToInternalUrl(url.toString());
      if (decorated !== url.toString()) element.href = decorated;
    } catch (_) {
      // Ignore malformed links.
    }
  }

  function propagateAffiliateToInternalLinks() {
    if (!currentAffiliateToken()) return;
    document.querySelectorAll("a[href]").forEach(decorateInternalAnchor);
  }

  function decorateSharedText(text) {
    if (!currentAffiliateToken() || typeof text !== "string" || !text.includes(config.siteUrl)) return text;
    const escaped = config.siteUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped + "\\/[^\\s<>\"']*", "g");
    return text.replace(pattern, (match) => appendAffiliateToInternalUrl(match));
  }

  function installSharePropagation() {
    if (!currentAffiliateToken()) return;

    try {
      if (typeof navigator.share === "function") {
        const originalShare = navigator.share.bind(navigator);
        navigator.share = (data) => {
          const next = data && typeof data === "object" ? { ...data } : data;
          if (next && next.url) next.url = appendAffiliateToInternalUrl(next.url);
          if (next && next.text) next.text = decorateSharedText(next.text);
          return originalShare(next);
        };
      }
    } catch (_) {
      // Some browsers expose navigator.share as read-only.
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = (text) => originalWriteText(decorateSharedText(text));
      }
    } catch (_) {
      // Some browsers expose clipboard methods as read-only.
    }

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href]");
      if (anchor) decorateInternalAnchor(anchor);
    }, true);
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
      if (!config.contactEmail) {
        element.hidden = true;
        element.removeAttribute("href");
        return;
      }
      element.hidden = false;
      element.href = "mailto:" + config.contactEmail;
      if (!element.textContent.trim()) element.textContent = config.contactEmail;
    });
    document.querySelectorAll("[data-crs-checkout-link]").forEach((element) => {
      const productKey = element.dataset.crsCheckoutLink;
      const product = config.commerce[productKey];
      if (!product || !product.checkoutUrl) return;
      element.href = trackedCheckoutUrl(product, element, productKey);
      element.target = "_blank";
      element.rel = "noopener noreferrer sponsored";
    });
    propagateAffiliateToInternalLinks();
    installSharePropagation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyConfig, { once: true });
  } else {
    applyConfig();
  }
})();
