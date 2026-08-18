(() => {
  if (window.__CRS99_PROJECTS_FLOW__) return;
  window.__CRS99_PROJECTS_FLOW__ = true;

  const { idFrom, normalize, migrateOnce, getJobs } = window.CRS99;

  const style = document.createElement("style");
  style.textContent = `
    .crs99-action-wrap{display:block;margin:8px 0 4px;clear:both}
    .crs99-action{display:inline-block;padding:8px 12px;border:0;border-radius:7px;background:#0ea5e9;color:#fff!important;text-decoration:none!important;font:700 12px/1.2 Arial,sans-serif;cursor:pointer}
    .crs99-action:hover{filter:brightness(1.06);text-decoration:none!important}
    .crs99-action.sent{background:#8a94a3;cursor:default}
    #crs99-rescan{position:fixed;right:16px;bottom:16px;z-index:2147483646;border:0;border-radius:9px;padding:9px 12px;background:#101827;color:#fff;font:700 12px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.24);cursor:pointer}
  `;
  document.documentElement.appendChild(style);

  function validProjectHref(href = "") {
    try {
      const path = new URL(href, location.origin).pathname.replace(/\/+$/, "");
      return /^\/project\/(?!bid(?:\/|$)|new(?:\/|$))[^/]*\d{4,}$/i.test(path);
    } catch { return false; }
  }

  function anchorScore(anchor) {
    const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return -100;
    let score = 0;
    if (text.length >= 10 && text.length <= 180) score += 8;
    if (anchor.closest("h1,h2,h3,h4,h5")) score += 8;
    const cls = normalize(anchor.className || "");
    if (cls.includes("title") || cls.includes("project")) score += 3;
    if (/visualizar|detalhes|cliente|propostas?|ofertas?|ver projeto/i.test(text)) score -= 8;
    return score + Math.min(4, text.length / 50);
  }

  function findProjects() {
    const bestById = new Map();
    for (const anchor of document.querySelectorAll('a[href*="/project/"]')) {
      if (anchor.closest(".crs99-action-wrap")) continue;
      const href = anchor.href || anchor.getAttribute("href") || "";
      if (!validProjectHref(href)) continue;
      const id = idFrom(href);
      if (!id) continue;
      const score = anchorScore(anchor);
      const previous = bestById.get(id);
      if (!previous || score > previous.score) {
        bestById.set(id, {
          id,
          anchor,
          href: new URL(href, location.origin).href.split("#")[0],
          score
        });
      }
    }
    return [...bestById.values()].filter((item) => item.score > -20);
  }

  function renderAction(item, job) {
    let wrap = document.querySelector(`.crs99-action-wrap[data-crs99-id="${CSS.escape(item.id)}"]`);
    if (!wrap) {
      wrap = document.createElement("span");
      wrap.className = "crs99-action-wrap";
      wrap.dataset.crs99Id = item.id;
      item.anchor.insertAdjacentElement("afterend", wrap);
    }
    wrap.innerHTML = "";

    if (job?.status === "closed") {
      wrap.remove();
      return;
    }

    if (job?.status === "sent") {
      const sent = document.createElement("span");
      sent.className = "crs99-action sent";
      sent.textContent = "Enviada";
      wrap.appendChild(sent);
      return;
    }

    // Link nativo: mais confiável que window.open() e mantém o Radar aberto.
    const action = document.createElement("a");
    action.className = "crs99-action";
    action.textContent = "Preparar proposta";
    action.dataset.crs99Id = item.id;

    const url = new URL(item.href, location.origin);
    url.searchParams.set("crs99", "prepare");
    url.searchParams.set("crs99id", item.id);

    action.href = url.href;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    wrap.appendChild(action);
  }

  async function scan() {
    const jobs = await getJobs();
    const items = findProjects();
    const visibleIds = new Set(items.map((item) => item.id));

    document.querySelectorAll(".crs99-action-wrap[data-crs99-id]").forEach((wrap) => {
      if (!visibleIds.has(wrap.dataset.crs99Id)) wrap.remove();
    });

    for (const item of items) renderAction(item, jobs[item.id]);

    const ready = items.filter((item) => !["sent", "closed"].includes(jobs[item.id]?.status)).length;
    const button = document.getElementById("crs99-rescan");
    if (button) button.textContent = `Atualizar Radar (${ready})`;
  }

  const rescan = document.createElement("button");
  rescan.id = "crs99-rescan";
  rescan.type = "button";
  rescan.textContent = "Atualizar Radar";
  rescan.title = "Recarrega a lista do 99Freelas e mostra os projetos atuais";
  rescan.addEventListener("click", () => {
    rescan.disabled = true;
    rescan.textContent = "Atualizando…";
    location.reload();
  });
  document.documentElement.appendChild(rescan);

  let timer = null;
  window.addEventListener("scroll", () => {
    clearTimeout(timer);
    timer = setTimeout(() => scan().catch(() => {}), 350);
  }, { passive: true });

  window.addEventListener("pageshow", () => scan().catch(() => {}));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.crs99Jobs) scan().catch(() => {});
  });

  migrateOnce().then(scan).catch(() => {});
})();