(() => {
  "use strict";

  const button = document.getElementById("resultShare");
  if (!button) return;

  function shareUrl() {
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "mapa-3-cotacoes");
    url.searchParams.set("utm_content", "resultado");

    const raw = url.toString();
    if (window.CRS_AFFILIATE && typeof window.CRS_AFFILIATE.appendToUrl === "function") {
      return window.CRS_AFFILIATE.appendToUrl(raw);
    }
    return raw;
  }

  async function shareResult() {
    const original = button.textContent;
    const url = shareUrl();
    const data = {
      title: "Mapa 3 Cotações — comparador gratuito",
      text: "Use este comparador gratuito para colocar 3 fornecedores lado a lado por preço, frete, prazo e custo total.",
      url
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }

    const copyText = data.text + "\n" + url;
    try {
      await navigator.clipboard.writeText(copyText);
      button.textContent = "Link copiado ✓";
      setTimeout(() => { button.textContent = original; }, 1800);
    } catch (_) {
      window.prompt("Copie o link do comparador:", url);
    }
  }

  button.addEventListener("click", shareResult);
})();
