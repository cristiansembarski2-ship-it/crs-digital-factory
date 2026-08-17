(() => {
  const normalize = (value = "") => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function currentProjectKey() {
    return location.pathname
      .replace(/\/+$/, "")
      .replace(/^\/project\/bid\//, "")
      .replace(/^\/project\//, "")
      .split("/")[0];
  }

  function visible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function bestProjectTitle() {
    const keyWords = new Set(
      normalize(currentProjectKey())
        .split(/[-\s]+/)
        .filter((word) => word.length >= 3 && !/^\d+$/.test(word))
    );

    const candidates = [...document.querySelectorAll("main h1, article h1, .container h1, h1")]
      .filter((el, index, arr) => arr.indexOf(el) === index)
      .map((el) => {
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        const words = normalize(text).split(/\s+/).filter(Boolean);
        const overlap = words.reduce((sum, word) => sum + (keyWords.has(word) ? 1 : 0), 0);
        const score = overlap * 10 + (visible(el) ? 5 : 0) + (el.closest("main, article") ? 2 : 0);
        return { text, score };
      })
      .filter((item) => item.text.length >= 4)
      .sort((a, b) => b.score - a.score);

    if (candidates[0]?.score > 0) return candidates[0].text;

    return document.title
      .replace(/\s*[|–-]\s*99\s*freelas.*$/i, "")
      .replace(/^\(\d+\)\s*/, "")
      .trim() || currentProjectKey().replace(/-/g, " ");
  }

  function syncPanelTitle() {
    const panel = document.getElementById("crs99-copilot");
    if (!panel) return;

    const titleNode = panel.querySelector(".crs99-title");
    const versionNode = panel.querySelector(".crs99-head span");
    const title = bestProjectTitle();

    if (titleNode && title && titleNode.textContent !== title) titleNode.textContent = title;
    if (versionNode && versionNode.textContent !== "v0.1.2") versionNode.textContent = "v0.1.2";
  }

  let scheduled = false;
  const scheduleSync = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      syncPanelTitle();
    });
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("popstate", scheduleSync);
  window.addEventListener("hashchange", scheduleSync);
  setInterval(syncPanelTitle, 1200);
  syncPanelTitle();
})();
