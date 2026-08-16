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
    creatorShareBtn: "Creator Share"
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
    hiddenCostForm: "Hidden Cost Calculated"
  };

  document.addEventListener("submit", (event) => {
    const id = event.target && event.target.id;
    if (id && formEvents[id]) track(formEvents[id], { path: location.pathname });
  });
})();