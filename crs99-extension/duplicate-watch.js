(() => {
  if (window.__CRS99_DUPLICATE_WATCH__) return;
  window.__CRS99_DUPLICATE_WATCH__ = true;

  const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const stop = new Set(["para","com","sem","uma","um","de","da","do","das","dos","e","em","no","na","nos","nas","por","que","se","ao","aos","o","a","os","as","projeto","freelancer","preciso","busco"]);

  function keyFromUrl(href) {
    try {
      return new URL(href, location.origin).pathname.replace(/\/+$/, "").replace(/^\/project\//, "").split("/")[0];
    } catch { return ""; }
  }

  function cardFor(a) {
    return a.closest('article, li, .project, .project-item, .media, .card, .list-group-item, .box') || a.parentElement?.parentElement || a.parentElement;
  }

  function tokens(text) {
    return new Set(normalize(text).split(" ").filter(w => w.length >= 4 && !stop.has(w)).slice(0, 140));
  }

  function similarity(a, b) {
    if (!a.size || !b.size) return 0;
    let intersection = 0;
    for (const t of a) if (b.has(t)) intersection += 1;
    const union = a.size + b.size - intersection;
    return union ? intersection / union : 0;
  }

  function annotate(card, pct, otherTitle) {
    if (!card || card.querySelector('.crs99-duplicate-note')) return;
    const note = document.createElement('div');
    note.className = 'crs99-duplicate-note';
    note.style.cssText = 'margin:6px 0;padding:6px 8px;border-radius:6px;background:rgba(245,158,11,.14);font-size:12px;font-weight:700;line-height:1.3;';
    note.textContent = `⚠ ${pct}% semelhante a outro anúncio${otherTitle ? `: ${otherTitle.slice(0,70)}` : ''}. Apenas alerta; não foi excluído.`;
    card.appendChild(note);
  }

  async function run() {
    const anchors = [...document.querySelectorAll('a[href*="/project/"]')].filter(a => !/\/project\/(new|bid)\//.test(a.getAttribute('href') || ''));
    const current = [];
    const seen = new Set();

    for (const a of anchors) {
      const href = new URL(a.href, location.origin).href;
      const key = keyFromUrl(href);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const card = cardFor(a);
      if (!card) continue;
      const title = (a.textContent || '').replace(/\s+/g, ' ').trim();
      const text = (card.innerText || title).replace(/\s+/g, ' ').trim();
      if (text.length < 60) continue;
      current.push({ key, href, title, text: text.slice(0, 3500), card, tokenSet: tokens(`${title} ${text}`) });
    }

    const stored = await chrome.storage.local.get('crs99RecentProjects');
    const history = Array.isArray(stored.crs99RecentProjects) ? stored.crs99RecentProjects : [];

    for (let i = 0; i < current.length; i++) {
      let best = null;
      for (let j = 0; j < current.length; j++) {
        if (i === j || current[i].key === current[j].key) continue;
        const s = similarity(current[i].tokenSet, current[j].tokenSet);
        if (!best || s > best.s) best = { s, title: current[j].title };
      }
      for (const old of history) {
        if (!old?.key || old.key === current[i].key || !old.text) continue;
        const s = similarity(current[i].tokenSet, tokens(`${old.title || ''} ${old.text}`));
        if (!best || s > best.s) best = { s, title: old.title || '' };
      }
      if (best && best.s >= 0.66) annotate(current[i].card, Math.round(best.s * 100), best.title);
    }

    const now = new Date().toISOString();
    const merged = [
      ...current.map(x => ({ key: x.key, href: x.href, title: x.title, text: x.text, seenAt: now })),
      ...history.filter(old => old?.key && !seen.has(old.key))
    ].slice(0, 120);
    await chrome.storage.local.set({ crs99RecentProjects: merged });
  }

  let timer;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => run().catch(() => {}), 400); };
  new MutationObserver(schedule).observe(document.body || document.documentElement, { childList: true, subtree: true });
  schedule();
})();