// ==UserScript==
// @name         CRS99 Projetos ao Vivo
// @namespace    https://crs-digital-factory.vercel.app/
// @version      1.0.3
// @description  Diagnostica e destaca projetos carregados na lista logada do 99Freelas. Não envia propostas.
// @match        https://www.99freelas.com.br/*
// @match        https://99freelas.com.br/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// @downloadURL  https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// ==/UserScript==

(() => {
  'use strict';

  if (!location.pathname.startsWith('/projects')) return;

  const BOX_ID = 'crs99-live-box';
  const norm = (v='') => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function ensureBox() {
    let box = document.getElementById(BOX_ID);
    if (!box) {
      box = document.createElement('section');
      box.id = BOX_ID;
      box.style.cssText = 'position:relative;z-index:2147483000;margin:10px 8px 14px;padding:12px;border-radius:12px;background:#0b1220;color:#fff;font:14px/1.35 Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.22)';
      (document.body || document.documentElement).insertBefore(box, (document.body || document.documentElement).firstChild || null);
    }
    return box;
  }

  function projectId(href='') {
    const s = String(href || '');
    const m = s.match(/\/project\/[^?#]*?(\d{4,})(?:[/?#]|$)/i);
    return m ? m[1] : '';
  }

  function score(text='') {
    const t = norm(text);
    if (/\b(video|videos|reels|ugc|capcut|gravacao|gravar|filmagem|camera|motion|after effects|premiere)\b/.test(t)) return -999;
    let n = 0;
    if (/\b(wordpress|elementor|woocommerce|landing page|landing pages|site|sites|loja virtual|pagina web|web design|blog)\b/.test(t)) n += 100;
    if (/\b(excel|planilha|planilhas|google sheets|sheets|dashboard|estoque|orcamento|custos|precificacao|financeir|csv|vba|power query|formulario)\b/.test(t)) n += 98;
    if (/\b(automacao|automatizar|dados|data entry|digitacao|pesquisa|revisao|formatacao|traducao|seo|cadastro|python|javascript)\b/.test(t)) n += 45;
    if (/\b(prospeccao|sdr|bdr|closer|trafego|social media|redes sociais|meta ads)\b/.test(t)) n -= 45;
    const p = t.match(/propostas?\s*[:：]?\s*(\d+)/);
    if (p) {
      const q = Number(p[1]);
      if (q <= 10) n += 20;
      else if (q <= 30) n += 10;
      else if (q >= 100) n -= 25;
      else if (q >= 60) n -= 12;
    }
    return n;
  }

  function scan() {
    const box = ensureBox();
    const rawLinks = [...document.querySelectorAll('a[href]')].filter(a => !a.closest('#' + BOX_ID));
    const projectLinks = rawLinks.filter(a => /\/project\//i.test(a.getAttribute('href') || a.href || ''));
    const seen = new Set();
    const jobs = [];

    for (const a of projectLinks) {
      const href = a.href || a.getAttribute('href') || '';
      const id = projectId(href);
      if (!id || seen.has(id)) continue;
      const title = String(a.textContent || '').replace(/\s+/g,' ').trim();
      if (title.length < 6) continue;
      seen.add(id);
      let node = a;
      let text = title;
      for (let i=0; i<7 && node; i++, node=node.parentElement) {
        const t = norm(node.innerText || '');
        if (t.includes('propostas') || t.includes('publicado') || t.includes('cliente')) { text = node.innerText || title; break; }
      }
      jobs.push({ id, href, title, n: score(text) });
    }

    jobs.sort((a,b) => b.n - a.n);
    const good = jobs.filter(j => j.n > 35).slice(0, 8);
    const rows = good.map((j,i) => `<a href="${esc(j.href)}" style="display:block;margin-top:7px;padding:9px;border-radius:9px;background:#172033;color:#fff;text-decoration:none"><strong>${i+1}. ${esc(j.title)}</strong></a>`).join('');

    box.innerHTML = `<strong>CRS99 v1.0.3 • ATIVO</strong><div style="margin-top:4px;opacity:.8">Links na página: ${rawLinks.length} • links de projeto: ${projectLinks.length} • projetos identificados: ${jobs.length}</div>${rows || '<div style="margin-top:7px;opacity:.8">Nenhum projeto identificado ainda.</div>'}`;
  }

  ensureBox().innerHTML = '<strong>CRS99 v1.0.3 • ATIVO</strong><div style="margin-top:4px;opacity:.8">Lendo a página…</div>';
  [200, 1000, 2500, 5000, 9000].forEach(ms => setTimeout(scan, ms));
})();
