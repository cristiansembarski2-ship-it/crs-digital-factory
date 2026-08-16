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

  function track(name, data) {
    if (typeof window.va !== "function") return;
    try {
      window.va("event", { name, data: data || {} });
    } catch (_) {
      // Analytics must never interfere with the product experience.
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-crs-track-content], #shareBtn, #cardBtn, #copyBtn, #exampleBtn");
    if (!target) return;

    const explicit = target.getAttribute("data-crs-track-content");
    if (explicit) {
      track("CTA Click", {
        content: explicit,
        path: location.pathname
      });
      return;
    }

    const names = {
      shareBtn: "Desafio Share",
      cardBtn: "Desafio Card Download",
      copyBtn: "Desafio Link Copy",
      exampleBtn: "Desafio Example"
    };

    if (names[target.id]) {
      track(names[target.id], { path: location.pathname });
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target && event.target.id === "quoteForm") {
      track("Desafio Result Generated", { path: location.pathname });
    }
  });
})();