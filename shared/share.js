(() => {
  "use strict";

  function clean(value, fallback) {
    const normalized = String(value || "").trim();
    return normalized || fallback;
  }

  function slug(value, fallback) {
    return clean(value, fallback)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || fallback;
  }

  function shareUrl(container) {
    const url = new URL(container.dataset.crsShareUrl || window.location.pathname, window.location.origin);
    const campaign = slug(container.dataset.crsShareCampaign, "mapa-3-cotacoes");
    const content = slug(container.dataset.crsShareContent || window.location.pathname, "pagina");
    url.hash = "";
    url.search = "";
    url.searchParams.set("utm_source", "compartilhamento");
    url.searchParams.set("utm_medium", "site");
    url.searchParams.set("utm_campaign", campaign);
    url.searchParams.set("utm_content", content);
    return url.toString();
  }

  async function copyUrl(url, status) {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = "Link copiado.";
    } catch (_) {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      status.textContent = "Link copiado.";
    }
  }

  function initialize(container) {
    const title = clean(container.dataset.crsShareTitle, document.title);
    const text = clean(container.dataset.crsShareText, "Conheça esta ferramenta gratuita da CRS Digital.");
    const url = shareUrl(container);
    const encodedMessage = encodeURIComponent(text + " " + url);
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    container.innerHTML = `<div class="crs-share-copy"><strong>Isso pode ajudar outra pessoa?</strong><span>Compartilhe a ferramenta ou este guia sem cadastro e sem spam.</span></div><div class="crs-share-actions"><button class="crs-share-button primary" type="button" data-share-native>Compartilhar</button><a class="crs-share-button" data-share-whatsapp target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="crs-share-button" data-share-linkedin target="_blank" rel="noopener noreferrer">LinkedIn</a><a class="crs-share-button" data-share-email>E-mail</a><button class="crs-share-button" type="button" data-share-copy>Copiar link</button><p class="crs-share-status" role="status" aria-live="polite"></p></div>`;

    const status = container.querySelector(".crs-share-status");
    container.querySelector("[data-share-whatsapp]").href = "https://wa.me/?text=" + encodedMessage;
    container.querySelector("[data-share-linkedin]").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl;
    container.querySelector("[data-share-email]").href = "mailto:?subject=" + encodedTitle + "&body=" + encodedMessage;
    container.querySelector("[data-share-copy]").addEventListener("click", () => copyUrl(url, status));
    container.querySelector("[data-share-native]").addEventListener("click", async () => {
      if (!navigator.share) {
        await copyUrl(url, status);
        return;
      }
      try {
        await navigator.share({ title, text, url });
        status.textContent = "Compartilhamento aberto.";
      } catch (error) {
        if (error && error.name !== "AbortError") status.textContent = "Não foi possível abrir o compartilhamento.";
      }
    });
  }

  document.querySelectorAll("[data-crs-share]").forEach(initialize);
})();
