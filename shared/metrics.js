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
})();
