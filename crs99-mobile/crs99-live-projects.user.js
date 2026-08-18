// ==UserScript==
// @name         CRS99 Projetos ao Vivo
// @namespace    https://crs-digital-factory.vercel.app/
// @version      1.0.2
// @description  Destaca os projetos mais alinhados na lista logada do 99Freelas. Não envia propostas.
// @match        https://www.99freelas.com.br/projects*
// @match        https://99freelas.com.br/projects*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// @downloadURL  https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// ==/UserScript==

(() => {
  'use strict';

  const BOX_ID = 'crs99-live-box';
  const norm = (v='') => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function projectId(href='') {
    try {
      const u = new URL(String(href||''), location.origin);
      const m = u.pathname.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
      return m ? m[1] : '';
    } catch { return ''; }
  }

  function score(text='') {
    const t = norm(text);
    if (/\b(video|videos|reels|ugc|capcut|gravacao|gravar|filmagem|camera|motion|after effects|premiere)\b/.test(t)) return { n:-999, tag:'VÍDEO — IGNORAR' };

    let n = 0;
    let tag = 'OUTRO';

    if (/\b(wordpress|elementor|woocommerce|landing page|landing pages|site|sites|loja virtual|pagina web|web design|blog)\b/.test(t)) {
      n += 100;
      tag = 'SITE';
    }

    if (/\b(excel|planilha|planilhas|google sheets|sheets|dashboard|estoque|orcamento|custos|precificacao|financeir|csv|vba|power query|formulario)\b/.test(t)) {
      n += 98;
      tag = tag === 'SITE' ? 'SITE + PLANILHA' : 'PLANILHA';
    }

    if (/\b(automacao|automatizar|dados|data entry|digitacao|pesquisa|revisao|formatacao|traducao|seo|cadastro|python|javascript)\b/.test(t)) n += 50;
    if (/\b(canva|apresentacao|slides|cartilha|material institucional|design|copy|texto|conteudo)\b/.test(t)) n += 20;
    if (/\b(prospeccao|sdr|bdr|closer|trafego|social media|redes sociais|meta ads)\b/.test(t)) n -= 45;
    if (/\b(django|multi-tenant|seguranca da informacao)\b/.test(t)) n -= 35;

    const proposals = t.match(/propostas?\s*[:：]?\s*(\d+)/);
    if (proposals) {
      const p = Number(proposals[1]);
      if (p <= 10) n += 20;
      else if (p <= 30) n += 10;
      else if (p >= 100) n -= 25;
      else if (p >= 60) n -= 12;
    }

    if (/publicado\s*[:：]?\s*(1 hora|2 horas|3 horas|4 horas|5 horas|6 horas)/.test(t)) n += 8;
    return { n, tag: n >= 90 ? `TOP • ${tag}` : n >= 50 ? `BOA • ${tag}` : tag };
  }

  function cardText(anchor) {
    let el = anchor;
    for (let i=0; i<8 && el; i++, el=el.parentElement) {
      if (el.id === BOX_ID) break;
      const t = norm(el.innerText || '');
      if (t.length > 100 && (t.includes('propostas') || t.includes('publicado') || t.includes('cliente'))) return el.innerText || '';
    }
    return anchor.textContent || '';
  }

  function collect() {
    const seen = new Set();
    const jobs = [];
    const links = [...document.querySelectorAll('a[href*="/project/"]')].filter(a => !a.closest(`#${BOX_ID}`));

    for (const a of links) {
      const id = projectId(a.href);
      if (!id || seen.has(id)) continue;

      const title = String(a.textContent || '').replace(/\s+/g,' ').trim();
      if (title.length < 8 || title.length > 180) continue;

      seen.add(id);
      const s = score(cardText(a));
      jobs.push({ id, title, href:a.href, n:s.n, tag:s.tag });
    }

    return jobs.sort((a,b) => b.n - a.n);
  }

  function getHost() {
    return document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  }

  function render() {
    const jobs = collect();
    let box = document.getElementById(BOX_ID);

    if (!jobs.length) {
      if (box) box.remove();
      return false;
    }

    const good = jobs.filter(j => j.n > 35).slice(0, 10);
    if (!box) {
      box = document.createElement('section');
      box.id = BOX_ID;
      box.style.cssText = 'margin:12px auto 16px;max-width:980px;padding:14px;border-radius:14px;background:#0b1220;color:#fff;font:14px/1.35 Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.22)';
      const host = getHost();
      host.insertBefore(box, host.firstChild || null);
    }

    const rows = good.length
      ? good.map((j,i) => `<a href="${esc(j.href)}" style="display:block;margin-top:8px;padding:10px;border-radius:10px;background:${i<3?'#16351f':'#172033'};color:#fff;text-decoration:none"><strong>${i+1}. ${esc(j.title)}</strong><br><span style="opacity:.75">${esc(j.tag)}</span></a>`).join('')
      : '<div style="margin-top:8px;opacity:.75">Nenhum projeto com aderência alta nesta tela.</div>';

    box.innerHTML = `<strong>CRS99 • melhores projetos carregados agora</strong><div style="opacity:.75;margin-top:4px">${jobs.length} projetos lidos diretamente desta tela</div>${rows}`;
    return true;
  }

  // O 99Freelas pode terminar de montar a lista alguns segundos depois do carregamento.
  // Fazemos poucas leituras e paramos; sem MutationObserver e sem loop contínuo.
  [300, 1200, 3000, 6000].forEach(ms => setTimeout(render, ms));
})();
