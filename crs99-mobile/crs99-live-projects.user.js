// ==UserScript==
// @name         CRS99 Projetos ao Vivo
// @namespace    https://crs-digital-factory.vercel.app/
// @version      1.1.1
// @description  Analisa manualmente os projetos visíveis na lista logada do 99Freelas. Não envia propostas.
// @match        https://www.99freelas.com.br/projects*
// @match        https://99freelas.com.br/projects*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// @downloadURL  https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// ==/UserScript==

(() => {
  'use strict';

  const BTN_ID = 'crs99-live-scan-btn';
  const BOX_ID = 'crs99-live-results';

  const norm = (v='') => String(v || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();

  const esc = (v='') => String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function projectId(href='') {
    const m = String(href || '').match(/\/project\/[^?#]*?(\d{4,})(?:[/?#]|$)/i);
    return m ? m[1] : '';
  }

  function score(text='') {
    const t = norm(text);
    if (/\b(video|videos|reels|ugc|capcut|gravacao|gravar|filmagem|camera|motion|after effects|premiere)\b/.test(t)) {
      return { n:-999, tag:'IGNORAR • VÍDEO' };
    }

    let n = 0;
    let tag = 'OUTRO';

    if (/\b(wordpress|elementor|woocommerce|landing page|landing pages|site|sites|loja virtual|pagina web|web design|blog)\b/.test(t)) {
      n += 100; tag = 'SITE';
    }

    if (/\b(excel|planilha|planilhas|google sheets|sheets|dashboard|estoque|orcamento|custos|precificacao|financeir|csv|vba|power query|formulario)\b/.test(t)) {
      n += 98; tag = tag === 'SITE' ? 'SITE + PLANILHA' : 'PLANILHA';
    }

    if (/\b(automacao|automatizar|dados|data entry|digitacao|pesquisa|revisao|formatacao|traducao|seo|google ads|administrativ|cadastro|python|javascript)\b/.test(t)) n += 45;
    if (/\b(canva|apresentacao|slides|cartilha|material institucional|design|copy|texto|conteudo)\b/.test(t)) n += 18;
    if (/\b(prospeccao|sdr|bdr|closer|trafego|social media|redes sociais|meta ads)\b/.test(t)) n -= 70;
    if (/\b(django|multi-tenant|saas|aplicativo|app mobile|seguranca da informacao)\b/.test(t)) n -= 35;

    const p = t.match(/propostas?\s*[:：]?\s*(\d+)/);
    if (p) {
      const q = Number(p[1]);
      if (q <= 10) n += 20;
      else if (q <= 30) n += 10;
      else if (q >= 100) n -= 25;
      else if (q >= 60) n -= 12;
    }

    if (/publicado\s*[:：]?\s*(1 hora|2 horas|3 horas|4 horas|5 horas|6 horas)/.test(t)) n += 8;

    return { n, tag: n >= 90 ? `TOP • ${tag}` : n >= 45 ? `BOA • ${tag}` : tag };
  }

  function idsInside(node) {
    const ids = new Set();
    if (!node?.querySelectorAll) return ids;
    for (const a of node.querySelectorAll('a[href*="/project/"]')) {
      const id = projectId(a.href || a.getAttribute('href') || '');
      if (id) ids.add(id);
      if (ids.size > 1) break;
    }
    return ids;
  }

  // Pega o maior bloco próximo do link que ainda pertence a UM único projeto.
  // Se o próximo ancestral já contém dois projetos, paramos antes dele.
  function projectText(anchor, id) {
    let node = anchor;
    let best = String(anchor.innerText || anchor.textContent || '').trim();

    for (let i = 0; i < 7 && node; i++, node = node.parentElement) {
      if (node.id === BOX_ID) break;
      const ids = idsInside(node);
      if (ids.size > 1) break;
      if (ids.size === 1 && !ids.has(id)) break;

      const text = String(node.innerText || '').trim();
      if (text.length >= best.length && text.length <= 2600) best = text;
    }

    return best;
  }

  function displayTitle(anchor) {
    const heading = anchor.querySelector?.('h1,h2,h3,h4,h5,h6,[class*="title"],[class*="Title"]');
    let text = String(heading?.textContent || anchor.textContent || '').replace(/\s+/g, ' ').trim();

    // Quando o link engloba o card inteiro, corta nos rótulos mais comuns da listagem.
    text = text.split(/\s+(?:Desenvolvimento Web|Assistente Virtual|Comercial|Design|Marketing|Redação|Traducao|Tradução|Administra[cç][aã]o|Finan[cç]as|Engenharia|Programação|Programacao)\s*\|/i)[0].trim();
    if (text.length > 120) text = text.slice(0, 117).trimEnd() + '…';
    return text;
  }

  function collect() {
    const seen = new Set();
    const jobs = [];
    const anchors = document.querySelectorAll('a[href*="/project/"]');

    for (const a of anchors) {
      if (a.closest(`#${BOX_ID}`)) continue;
      const href = a.href || a.getAttribute('href') || '';
      const id = projectId(href);
      if (!id || seen.has(id)) continue;

      const title = displayTitle(a);
      if (title.length < 8) continue;

      seen.add(id);
      const text = projectText(a, id);
      const s = score(text);
      jobs.push({ id, href, title, n:s.n, tag:s.tag });
    }

    jobs.sort((a,b) => b.n - a.n);
    return jobs;
  }

  function closeResults() {
    document.getElementById(BOX_ID)?.remove();
  }

  function renderResults(jobs) {
    closeResults();

    const box = document.createElement('section');
    box.id = BOX_ID;
    box.style.cssText = 'position:fixed;left:8px;right:8px;top:70px;bottom:18px;z-index:2147483646;overflow:auto;padding:12px;border-radius:14px;background:#0b1220;color:#fff;font:14px/1.35 Arial,sans-serif;box-shadow:0 10px 35px rgba(0,0,0,.55)';

    const good = jobs.filter(j => j.n > 35).slice(0, 12);
    const rows = good.length
      ? good.map((j,i) => `<a href="${esc(j.href)}" style="display:block;margin-top:8px;padding:10px;border-radius:10px;background:${i < 3 ? '#16351f' : '#172033'};color:#fff;text-decoration:none"><strong>${i+1}. ${esc(j.title)}</strong><br><span style="opacity:.78">${esc(j.tag)}</span></a>`).join('')
      : '<div style="margin-top:10px;opacity:.8">Nenhum projeto com aderência alta entre os projetos visíveis.</div>';

    box.innerHTML = `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><strong>CRS99 • ${jobs.length} projetos lidos</strong><button id="crs99-live-close" type="button" style="border:0;border-radius:8px;padding:7px 10px;font-weight:700">Fechar</button></div>${rows}`;
    document.body.appendChild(box);
    document.getElementById('crs99-live-close')?.addEventListener('click', closeResults, { once:true });
  }

  function analyze() {
    const btn = document.getElementById(BTN_ID);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'CRS99 lendo…';
    }

    setTimeout(() => {
      try {
        renderResults(collect());
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'CRS99 analisar';
        }
      }
    }, 50);
  }

  function installButton() {
    if (document.getElementById(BTN_ID) || !document.body) return;
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = 'CRS99 analisar';
    btn.style.cssText = 'position:fixed;right:12px;bottom:72px;z-index:2147483645;border:0;border-radius:999px;padding:11px 14px;background:#0b1220;color:#fff;font:700 13px Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.4)';
    btn.addEventListener('click', analyze);
    document.body.appendChild(btn);
  }

  installButton();
})();
