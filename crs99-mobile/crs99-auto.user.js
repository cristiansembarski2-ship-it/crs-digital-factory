// ==UserScript==
// @name         CRS99 Auto Preencher
// @namespace    https://crs-digital-factory.vercel.app/
// @version      2.1.0
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

  const VERSION = '2.1.0';
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

    const backLinks = [...document.querySelectorAll('a[href]')].filter((a) => {
      const t = norm(a.textContent || '');
      const href = String(a.getAttribute('href') || '');
      return t.includes('voltar a pagina do projeto') || /\/project\//i.test(href);
    });
    backLinks.forEach((a) => add(a.href || a.getAttribute('href')));

    return [...ids];
  }

  function titleLooksSame(payloadTitle = '') {
    const expected = norm(payloadTitle);
    if (!expected) return false;
    const headings = [...document.querySelectorAll('h1,h2,h3')]
      .map((el) => norm(el.textContent || ''))
      .filter(Boolean);
    if (headings.some((h) => h.includes(expected) || expected.includes(h))) return true;

    const expectedTokens = expected.split(' ').filter((x) => x.length >= 4);
    if (expectedTokens.length < 3) return false;
    return headings.some((h) => {
      const matched = expectedTokens.filter((t) => h.includes(t)).length;
      return matched / expectedTokens.length >= 0.7;
    });
  }

  function sameProject(payload) {
    const ids = projectIdsOnPage();
    const wanted = String(payload?.id || '');
    if (ids.includes(wanted)) return { ok: true, ids };
    if (ids.length > 0) return { ok: false, ids };
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
        const horizontal = Math.abs(fr.left - lr.left);
        const score = Math.max(0, vertical) * 4 + horizontal;
        if (score < bestScore) {
          bestScore = score;
          best = field;
        }
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

    if (!proposal) {
      proposal = [...document.querySelectorAll('textarea')].find((el) => visible(el) && norm(el.placeholder).includes('detalhes da proposta')) || null;
    }

    if (!price) {
      price = allInputs.find((el) => {
        const m = norm([el.name, el.id, el.placeholder, el.getAttribute('aria-label')].filter(Boolean).join(' '));
        return m.includes('oferta') && !m.includes('final');
      }) || null;
    }

    if (!days) {
      days = allInputs.find((el) => {
        const m = norm([el.name, el.id, el.placeholder, el.getAttribute('aria-label')].filter(Boolean).join(' '));
        return m.includes('duracao') || m.includes('prazo') || m.includes('dias');
      }) || null;
    }

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
    try { el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: value })); } catch {}
    try { el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value })); } catch { el.dispatchEvent(new Event('input', { bubbles: true })); }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Unidentified' }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function numericEqual(a, b) {
    const parse = (v) => {
      const s = String(v ?? '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    };
    const x = parse(a), y = parse(b);
    return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) < 0.01;
  }

  function textEqual(current, expected) {
    const a = norm(current);
    const b = norm(expected);
    return a === b || (b.length > 20 && a.includes(b.slice(0, 20)));
  }

  async function writeStable(el, value, mode) {
    if (!el) return false;
    const next = String(value);
    for (let i = 0; i < 8; i++) {
      try { el.focus({ preventScroll: true }); } catch { try { el.focus(); } catch {} }
      try { if (el._valueTracker?.setValue) el._valueTracker.setValue(''); } catch {}
      try { nativeSetter(el, next); emit(el, next); } catch {}
      await sleep(180);
      const current = el.value ?? el.textContent ?? '';
      const ok = mode === 'number' ? numericEqual(current, next) : textEqual(current, next);
      if (ok) return true;
    }
    return false;
  }

  function opener() {
    return [...document.querySelectorAll('a,button,input[type="button"]')].find((el) => {
      if (!visible(el) || el.closest('form')) return false;
      if (String(el.type || '').toLowerCase() === 'submit') return false;
      const t = norm(el.textContent || el.value || '');
      return t === 'enviar proposta' || t === 'fazer proposta' || t === 'enviar uma proposta';
    }) || null;
  }

  function status() {
    const f = fields();
    return {
      f,
      label: `campos: oferta ${f.price ? '✓' : '✗'} | duração ${f.days ? '✓' : '✗'} | detalhes ${f.proposal ? '✓' : '✗'}`
    };
  }

  async function fillOnce(payload) {
    const { f } = status();
    const ok = { price: false, days: false, proposal: false };
    if (f.price) ok.price = await writeStable(f.price, payload.price, 'number');
    if (f.days) ok.days = await writeStable(f.days, payload.days, 'number');
    if (f.proposal) ok.proposal = await writeStable(f.proposal, payload.proposal, 'text');
    return { f, ok, count: Object.values(ok).filter(Boolean).length };
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

    banner('iniciando…');

    for (let round = 0; round < 18; round++) {
      const s = status();
      if (!s.f.price || !s.f.days || !s.f.proposal) {
        if (round === 2) {
          const open = opener();
          if (open) open.click();
        }
        if (round % 4 === 0) banner(s.label, 'warn');
        await sleep(300);
        continue;
      }

      const result = await fillOnce(payload);
      banner(`teste ${result.count}/3 — oferta ${result.ok.price ? '✓' : '✗'} | duração ${result.ok.days ? '✓' : '✗'} | detalhes ${result.ok.proposal ? '✓' : '✗'}`, result.count === 3 ? 'good' : 'warn');

      if (result.count === 3) {
        await sleep(900);
        const check = fields();
        const stable = check.price && check.days && check.proposal
          && numericEqual(check.price.value, payload.price)
          && numericEqual(check.days.value, payload.days)
          && textEqual(check.proposal.value, payload.proposal);

        if (stable) {
          try { history.replaceState(null, '', location.pathname + location.search); } catch {}
          banner('OK: oferta, duração e detalhes preenchidos. Revise e envie manualmente.');
          return;
        }
      }
      await sleep(250);
    }

    const s = status();
    banner(`não concluiu — ${s.label}. Não envie antes de revisar.`, 'bad');
  }

  function start() {
    run().catch((e) => banner(`erro: ${String(e?.message || e)}`, 'bad'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
