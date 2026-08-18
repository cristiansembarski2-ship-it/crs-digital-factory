// ==UserScript==
// @name         CRS99 Auto Preencher
// @namespace    https://crs-digital-factory.vercel.app/
// @version      2.2.0
// @description  Preenche automaticamente Sua oferta, Duracao estimada e Detalhes no 99Freelas. Nunca envia a proposta.
// @match        https://www.99freelas.com.br/project/*
// @match        https://99freelas.com.br/project/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-auto.user.js
// @downloadURL  https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-auto.user.js
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '2.2.0';
  const STORAGE_KEY = 'crs99PayloadV2';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (v = '') => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  function banner(message, tone = 'good') {
    let box = document.getElementById('crs99-auto-banner');
    if (!box) {
      box = document.createElement('div');
      box.id = 'crs99-auto-banner';
      box.style.cssText = 'position:fixed;left:10px;right:10px;bottom:16px;z-index:2147483647;padding:13px 14px;border-radius:12px;color:white;font:700 14px/1.35 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)';
      (document.body || document.documentElement).appendChild(box);
    }
    box.style.background = tone === 'bad' ? '#b91c1c' : tone === 'warn' ? '#92400e' : '#15803d';
    box.textContent = `CRS99 v${VERSION} — ${message}`;
  }

  function payloadFromHash() {
    const m = location.hash.match(/(?:^#|&)crs99=([^&]+)/);
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch { return null; }
  }

  function loadPayload() {
    const fromHash = payloadFromHash();
    if (fromHash) {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromHash)); } catch {}
      return fromHash;
    }
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function idFromUrl(value = '') {
    try {
      const u = new URL(String(value || ''), location.origin);
      const p = u.pathname.replace(/\/+$/, '');
      let m = p.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
      if (m) return m[1];
      m = p.match(/\/project\/[^/]*?[-/](\d{4,})(?:\/|$)/i);
      if (m) return m[1];
      m = p.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
      return m ? m[1] : '';
    } catch { return ''; }
  }

  function projectIdsOnPage() {
    const ids = new Set();
    const add = (value) => {
      const id = idFromUrl(value);
      if (id) ids.add(String(id));
    };

    add(location.href);
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    if (canonical) add(canonical);

    [...document.querySelectorAll('a[href]')].forEach((a) => {
      const t = norm(a.textContent || '');
      const href = String(a.getAttribute('href') || '');
      if (t.includes('voltar a pagina do projeto') || /\/project\//i.test(href)) add(a.href || href);
    });
    return [...ids];
  }

  function titleLooksSame(payloadTitle = '') {
    const expected = norm(payloadTitle);
    if (!expected) return false;
    const headings = [...document.querySelectorAll('h1,h2,h3')].map((el) => norm(el.textContent || '')).filter(Boolean);
    if (headings.some((h) => h.includes(expected) || expected.includes(h))) return true;
    const tokens = expected.split(' ').filter((x) => x.length >= 4);
    if (tokens.length < 3) return false;
    return headings.some((h) => tokens.filter((t) => h.includes(t)).length / tokens.length >= 0.7);
  }

  function sameProject(payload) {
    const ids = projectIdsOnPage();
    const wanted = String(payload?.id || '');
    if (ids.includes(wanted)) return { ok: true, ids };
    if (ids.length) return { ok: false, ids };
    return { ok: titleLooksSame(payload?.title || ''), ids };
  }

  function visible(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 2 && r.height > 2 && s.display !== 'none' && s.visibility !== 'hidden';
  }

  function tinyTextElements(text) {
    const target = norm(text);
    return [...document.querySelectorAll('label,h1,h2,h3,h4,h5,strong,b,p,span,div')]
      .filter((el) => visible(el))
      .filter((el) => {
        const t = norm(el.innerText || el.textContent || '');
        return t === target || (t.includes(target) && t.length <= target.length + 35);
      });
  }

  function nearestBelow(labelText, selector, maxGap = 330) {
    const labels = tinyTextElements(labelText);
    const fields = [...document.querySelectorAll(selector)].filter(visible);
    let best = null;
    let bestScore = Infinity;
    for (const label of labels) {
      const lr = label.getBoundingClientRect();
      for (const field of fields) {
        const fr = field.getBoundingClientRect();
        const vertical = fr.top - lr.bottom;
        if (vertical < -20 || vertical > maxGap) continue;
        const score = Math.max(0, vertical) * 4 + Math.abs(fr.left - lr.left);
        if (score < bestScore) { bestScore = score; best = field; }
      }
    }
    return best;
  }

  function fields() {
    const allInputs = [...document.querySelectorAll('input')].filter((el) => {
      const type = String(el.type || '').toLowerCase();
      return visible(el) && !['hidden','submit','button','checkbox','radio','file'].includes(type);
    });

    let price = nearestBelow('Sua oferta', 'input', 220);
    let days = nearestBelow('Duração estimada', 'input', 240) || nearestBelow('Duracao estimada', 'input', 240);
    let proposal = nearestBelow('Detalhes', 'textarea', 300);

    if (!proposal) proposal = [...document.querySelectorAll('textarea')].find((el) => visible(el) && norm(el.placeholder).includes('detalhes da proposta')) || null;
    if (!price) price = allInputs.find((el) => {
      const m = norm([el.name, el.id, el.placeholder, el.getAttribute('aria-label')].filter(Boolean).join(' '));
      return m.includes('oferta') && !m.includes('final');
    }) || null;
    if (!days) days = allInputs.find((el) => {
      const m = norm([el.name, el.id, el.placeholder, el.getAttribute('aria-label')].filter(Boolean).join(' '));
      return m.includes('duracao') || m.includes('prazo') || m.includes('dias');
    }) || null;

    if (price) {
      const nearFinal = tinyTextElements('Oferta final').some((label) => {
        const lr = label.getBoundingClientRect();
        const pr = price.getBoundingClientRect();
        return pr.top >= lr.bottom - 20 && pr.top - lr.bottom < 220;
      });
      if (nearFinal) price = nearestBelow('Sua oferta', 'input', 220);
    }
    return { price, days, proposal };
  }

  function nativeSetter(el, value) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (set) set.call(el, value); else el.value = value;
  }

  function emit(el, value) {
    try { el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: String(value) })); }
    catch { el.dispatchEvent(new Event('input', { bubbles: true })); }
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function parseNumber(v) {
    const text = String(v ?? '').trim().replace(/[^0-9,.-]/g, '');
    if (!text) return NaN;
    let cleaned = text;
    if (cleaned.includes(',') && cleaned.includes('.')) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    else if (cleaned.includes(',')) cleaned = cleaned.replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function numericEqual(a, b) {
    const x = parseNumber(a), y = Number(b);
    return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) < 0.01;
  }

  function textEqual(a, b) {
    return norm(a) === norm(b);
  }

  async function setSimple(el, value, mode = 'text') {
    if (!el) return false;
    const next = String(value);
    try {
      if (el._valueTracker?.setValue) el._valueTracker.setValue('');
      nativeSetter(el, next);
      emit(el, next);
    } catch { return false; }
    await sleep(180);
    return mode === 'number' ? numericEqual(el.value, value) : textEqual(el.value, next);
  }

  async function setCurrency(el, value) {
    if (!el) return false;
    const amount = Number(value);
    if (!Number.isFinite(amount)) return false;

    // O campo do 99Freelas usa máscara em centavos. Ex.: "690" vira R$ 6,90.
    // Enviamos os centavos (69000) para a máscara resultar em R$ 690,00.
    const centsDigits = String(Math.round(amount * 100));
    try {
      if (el._valueTracker?.setValue) el._valueTracker.setValue('');
      nativeSetter(el, '');
      emit(el, '');
      nativeSetter(el, centsDigits);
      emit(el, centsDigits);
    } catch { return false; }

    await sleep(260);
    if (numericEqual(el.value, amount)) return true;

    // Fallback único para páginas sem a máscara em centavos.
    try {
      const formatted = amount.toFixed(2).replace('.', ',');
      nativeSetter(el, formatted);
      emit(el, formatted);
    } catch { return false; }
    await sleep(220);
    return numericEqual(el.value, amount);
  }

  function opener() {
    return [...document.querySelectorAll('a,button,input[type="button"]')].find((el) => {
      if (!visible(el) || el.closest('form')) return false;
      if (String(el.type || '').toLowerCase() === 'submit') return false;
      const t = norm(el.textContent || el.value || '');
      return t === 'enviar proposta' || t === 'fazer proposta' || t === 'enviar uma proposta';
    }) || null;
  }

  async function run() {
    const payload = loadPayload();
    if (!payload) return;

    const match = sameProject(payload);
    if (!match.ok) {
      banner(`bloqueado: projeto diferente do preparado${match.ids.length ? ` (página: ${match.ids.join(', ')} / preparado: ${payload.id})` : ''}.`, 'bad');
      return;
    }

    const age = Date.now() - Number(payload.ts || 0);
    if (!payload.proposal || payload.price === '' || payload.days === '' || !Number.isFinite(age) || age < 0 || age > 30 * 60 * 1000) {
      banner('bloqueado: dados incompletos ou preparação vencida.', 'bad');
      return;
    }

    let f = fields();
    if (!f.price || !f.days || !f.proposal) {
      const open = opener();
      if (open) open.click();
      await sleep(650);
      f = fields();
    }

    if (!f.price || !f.days || !f.proposal) {
      banner(`campos encontrados: oferta ${f.price ? '✓' : '✗'} | duração ${f.days ? '✓' : '✗'} | detalhes ${f.proposal ? '✓' : '✗'}.`, 'bad');
      return;
    }

    banner('preenchendo uma vez…', 'warn');
    const okPrice = await setCurrency(f.price, payload.price);
    const okDays = await setSimple(f.days, payload.days, 'number');
    const okProposal = await setSimple(f.proposal, payload.proposal, 'text');

    await sleep(500);
    f = fields();
    const stablePrice = okPrice && f.price && numericEqual(f.price.value, payload.price);
    const stableDays = okDays && f.days && numericEqual(f.days.value, payload.days);
    const stableProposal = okProposal && f.proposal && textEqual(f.proposal.value, payload.proposal);
    const count = [stablePrice, stableDays, stableProposal].filter(Boolean).length;

    if (count === 3) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch {}
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      banner('OK: oferta, duração e detalhes preenchidos. Revise e envie manualmente.');
      return;
    }

    banner(`parou após 1 tentativa — oferta ${stablePrice ? '✓' : '✗'} | duração ${stableDays ? '✓' : '✗'} | detalhes ${stableProposal ? '✓' : '✗'}. Não envie ainda.`, 'bad');
  }

  function start() { run().catch((e) => banner(`erro: ${String(e?.message || e)}`, 'bad')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
