(() => {
  if (window.__CRS99_PROFILE_FILTER__) return;
  window.__CRS99_PROFILE_FILTER__ = true;

  const QUEUE_URL = '/crs99/opportunities.json';
  const STATUS_URL = '/api/crs99-status';
  const cache = new Map();
  let queueById = new Map();
  let running = false;
  let timer = 0;

  const normalize = (v='') => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const projectId = (v='') => {
    const s = String(v||'').replace(/[?#].*$/,'').replace(/\/+$/,'');
    let m = s.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (m) return m[1];
    m = s.match(/(?:^|[-/])(\d{4,})$/);
    return m ? m[1] : '';
  };

  function preferenceScore(text='') {
    const t = normalize(text);
    if (/\b(video|videos|reels|ugc|capcut|filmagem|gravar|gravacao|camera|motion|after effects|premiere)\b/.test(t)) return -1000;
    if (/\b(site|sites|wordpress|elementor|landing page|landing pages|blog|woocommerce|loja virtual|pagina web)\b/.test(t)) return 100;
    if (/\b(excel|planilha|planilhas|google sheets|sheets|dashboard|formulario|pontuacao|estoque|orcamento|custos|preco de venda|financeir|csv)\b/.test(t)) return 98;
    if (/\b(automacao|automatizar|dados|digitacao|pesquisa|revisao|formatacao|traducao|seo|google ads|administrativ|cadastro de produtos|javascript|python)\b/.test(t)) return 80;
    if (/\b(canva|apresentacao|slides|cartilha|material institucional|design|artes|copy|texto|conteudo)\b/.test(t)) return 60;
    if (/\b(prospeccao|sdr|bdr|trafego|redes sociais)\b/.test(t)) return 30;
    return 15;
  }

  async function loadQueue() {
    try {
      const r = await fetch(`${QUEUE_URL}?profile=${Date.now()}`, {cache:'no-store'});
      const data = await r.json();
      queueById = new Map((data.opportunities || []).map(x => [projectId(x.url || x.projectKey), x]));
    } catch {
      queueById = new Map();
    }
  }

  async function liveAvailable(url) {
    if (!url) return false;
    const old = cache.get(url);
    if (old && Date.now() - old.ts < 300000) return old.ok;
    try {
      const r = await fetch(`${STATUS_URL}?url=${encodeURIComponent(url)}&t=${Date.now()}`, {cache:'no-store'});
      const data = await r.json();
      const ok = Boolean(data && data.ok && data.available);
      cache.set(url, {ok, ts:Date.now()});
      return ok;
    } catch {
      cache.set(url, {ok:false, ts:Date.now()});
      return false;
    }
  }

  async function mapLimit(items, limit, worker) {
    let cursor = 0;
    const runners = Array.from({length: Math.min(limit, items.length)}, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        await worker(items[index]);
      }
    });
    await Promise.all(runners);
  }

  async function apply() {
    if (running) return;
    const list = document.getElementById('list');
    const filter = document.getElementById('statusFilter');
    const count = document.getElementById('countText');
    const pill = document.getElementById('syncPill');
    if (!list || !filter || !count) return;

    const activeMode = ['active','candidate','prepared'].includes(filter.value);
    if (!activeMode) return;

    running = true;
    try {
      if (!queueById.size) await loadQueue();
      const cards = [...list.querySelectorAll('article.job')];
      if (!cards.length) return;

      if (pill) {
        pill.textContent = 'Validando disponíveis…';
        pill.className = 'pill neutral';
      }

      const candidates = cards.map(card => {
        const id = String(card.dataset.projectId || '');
        const item = queueById.get(id);
        const title = card.querySelector('.job-title')?.textContent || item?.title || '';
        const risk = card.querySelector('.job-risk')?.textContent || item?.risk || '';
        return {card, item, score: preferenceScore(`${title} ${risk}`)};
      }).filter(x => x.item && x.score > 0 && !['sent','closed','unavailable'].includes(x.item.status));

      cards.forEach(card => { card.hidden = true; });
      const confirmed = [];
      await mapLimit(candidates, 4, async x => {
        if (await liveAvailable(x.item.url)) confirmed.push(x);
      });

      confirmed.sort((a,b) => (b.score - a.score) || (Number(b.item.fit || 0) - Number(a.item.fit || 0)));
      for (const x of confirmed) {
        x.card.hidden = false;
        list.appendChild(x.card);
      }

      count.textContent = `${confirmed.length} ${confirmed.length === 1 ? 'projeto disponível' : 'projetos disponíveis'}`;
      const empty = document.getElementById('emptyState');
      if (empty) empty.classList.toggle('hidden', confirmed.length !== 0);
      if (pill) {
        pill.textContent = 'Só disponíveis';
        pill.className = 'pill good';
      }
    } finally {
      running = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(apply, 160);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadQueue();
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      cache.clear();
      queueById.clear();
      setTimeout(schedule, 300);
    }, true);
    document.getElementById('statusFilter')?.addEventListener('change', schedule);
    document.getElementById('searchInput')?.addEventListener('input', schedule);
    const list = document.getElementById('list');
    if (list) new MutationObserver(schedule).observe(list, {childList:true});
    schedule();
  });
})();
