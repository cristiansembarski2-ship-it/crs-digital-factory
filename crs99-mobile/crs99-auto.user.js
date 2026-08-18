// ==UserScript==
// @name         CRS99 Auto Preencher
// @namespace    https://crs-digital-factory.vercel.app/
// @version      1.2.0
// @description  Preenche automaticamente proposta, valor e prazo no 99Freelas quando a página é aberta pelo CRS99 Mobile. Nunca envia a proposta.
// @match        https://www.99freelas.com.br/project/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-auto.user.js
// @downloadURL  https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-auto.user.js
// ==/UserScript==

(() => {
  'use strict';

  const normalize = (value = '') => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function visible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  }

  function usable(element) {
    if (!element || element.disabled || element.readOnly) return false;
    const type = String(element.type || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'file'].includes(type)) return false;
    return visible(element);
  }

  function banner(message, tone = 'good') {
    let box = document.getElementById('crs99-auto-banner');
    if (!box) {
      box = document.createElement('div');
      box.id = 'crs99-auto-banner';
      box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:18px;z-index:2147483647;padding:14px 16px;border-radius:12px;color:#fff;font:700 14px/1.35 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45)';
      document.documentElement.appendChild(box);
    }
    box.style.background = tone === 'bad' ? '#b91c1c' : tone === 'warn' ? '#92400e' : '#15803d';
    box.textContent = message;
  }

  function payloadFromHash() {
    const match = location.hash.match(/(?:^#|&)crs99=([^&]+)/);
    if (!match) return null;
    try { return JSON.parse(decodeURIComponent(match[1])); }
    catch { return null; }
  }

  function currentProjectId() {
    const path = location.pathname.replace(/\/+$/, '');
    const direct = path.match(/\/project\/bid\/(\d{4,})$/i);
    if (direct) return direct[1];
    const slug = path.match(/\/project\/[^/]*?(\d{4,})$/i);
    return slug ? slug[1] : '';
  }

  function metadataText(element) {
    const parts = [
      element.name,
      element.id,
      element.placeholder,
      element.getAttribute('aria-label'),
      element.getAttribute('data-name'),
      element.getAttribute('data-field')
    ].filter(Boolean);

    if (element.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
        if (label) parts.push(label.textContent || '');
      } catch {}
    }

    return normalize(parts.join(' '));
  }

  function ancestorTexts(element, depth = 6) {
    const result = [];
    let node = element;
    for (let i = 0; i < depth; i++) {
      node = node?.parentElement;
      if (!node) break;
      const text = normalize((node.innerText || '').slice(0, 1200));
      if (text) result.push({ text, distance: i + 1 });
    }
    return result;
  }

  function scoreField(element, positives, negatives = [], preferTag = '') {
    if (!usable(element)) return -Infinity;
    let score = 0;
    const meta = metadataText(element);

    positives.forEach((term, index) => {
      if (meta.includes(normalize(term))) score += 500 - index * 12;
    });
    negatives.forEach((term, index) => {
      if (meta.includes(normalize(term))) score -= 800 - index * 10;
    });

    ancestorTexts(element).forEach(({ text, distance }) => {
      const proximity = Math.max(1, 7 - distance);
      positives.forEach((term, index) => {
        if (text.includes(normalize(term))) score += proximity * (60 - Math.min(index, 8) * 4);
      });
      negatives.forEach((term, index) => {
        if (text.includes(normalize(term))) score -= proximity * (110 - Math.min(index, 8) * 5);
      });
    });

    if (preferTag && element.tagName === preferTag) score += 80;
    return score;
  }

  function bestField(candidates, positives, negatives = [], preferTag = '') {
    const ranked = candidates
      .map((element) => ({ element, score: scoreField(element, positives, negatives, preferTag) }))
      .filter((item) => Number.isFinite(item.score))
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.score > 0 ? ranked[0].element : null;
  }

  function detailsField() {
    const textareas = all('textarea').filter(usable);
    const exactPlaceholder = textareas.find((element) => {
      const p = normalize(element.placeholder || '');
      return p.includes('escreva aqui os detalhes da proposta') || p.includes('detalhes da proposta');
    });
    if (exactPlaceholder) return exactPlaceholder;

    const labelled = textareas.find((element) => {
      const meta = metadataText(element);
      if (meta.includes('detalhes')) return true;
      return ancestorTexts(element, 4).some(({ text }) => text.includes('detalhes'));
    });
    return labelled || textareas[0] || null;
  }

  function fields() {
    const inputs = all('input').filter(usable);
    const proposal = detailsField();
    const price = bestField(
      inputs,
      ['sua oferta', 'valor da proposta', 'oferta', 'preco', 'valor', 'r$'],
      ['oferta final', 'como e calculada', 'taxa']
    );
    const days = bestField(
      inputs,
      ['duracao estimada', 'duracao', 'dias', 'prazo', 'entrega', 'tempo'],
      ['sua oferta', 'oferta final', 'valor', 'r$']
    );
    return { proposal, price, days };
  }

  function nativeSet(element, next) {
    const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    const tracker = element._valueTracker;
    if (tracker && typeof tracker.setValue === 'function') {
      try { tracker.setValue(''); } catch {}
    }
    if (setter) setter.call(element, next);
    else element.value = next;
  }

  function emit(element, next) {
    try {
      element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: next }));
    } catch {}
    try {
      element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: next }));
    } catch {
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Unidentified' }));
  }

  async function forceValue(element, value) {
    if (!element || value == null) return false;
    const next = String(value);

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        element.focus({ preventScroll: true });
      } catch {
        try { element.focus(); } catch {}
      }

      try {
        nativeSet(element, next);
        emit(element, next);
      } catch {}

      await sleep(90);
      const current = String(element.value ?? element.textContent ?? '');
      if (current === next || normalize(current) === normalize(next)) return true;

      try {
        element.value = next;
        emit(element, next);
      } catch {}
      await sleep(90);

      const fallbackCurrent = String(element.value ?? element.textContent ?? '');
      if (fallbackCurrent === next || normalize(fallbackCurrent) === normalize(next)) return true;
    }

    return false;
  }

  async function fill(payload) {
    const f = fields();
    const result = { count: 0, fields: f, ok: { proposal: false, price: false, days: false } };

    if (f.price) result.ok.price = await forceValue(f.price, payload.price);
    if (f.days) result.ok.days = await forceValue(f.days, payload.days);
    if (f.proposal) result.ok.proposal = await forceValue(f.proposal, payload.proposal);

    result.count = Object.values(result.ok).filter(Boolean).length;
    return result;
  }

  function alreadySent() {
    const body = normalize(document.body?.innerText || '');
    return /melhorar proposta|editar proposta|cancelar proposta|voce ja enviou uma proposta/.test(body);
  }

  function closedProject() {
    const body = normalize(document.body?.innerText || '');
    return /nao aceita novas propostas|projeto encerrado|projeto fechado|cancelado/.test(body);
  }

  function safeProposalTrigger() {
    const candidates = all('a,button,input[type="button"]').filter(visible);
    return candidates.find((element) => {
      if (element.closest('form')) return false;
      if (String(element.type || '').toLowerCase() === 'submit') return false;
      const text = normalize(element.textContent || element.value || '');
      return text === 'enviar proposta' || text === 'fazer proposta' || text === 'enviar uma proposta';
    }) || null;
  }

  async function run() {
    const payload = payloadFromHash();
    if (!payload) return;

    const id = currentProjectId();
    if (!id || String(id) !== String(payload.id)) {
      banner('CRS99 BLOQUEOU: esta página não corresponde ao projeto preparado.', 'bad');
      return;
    }

    if (!payload.proposal || payload.price === '' || payload.days === '') {
      banner('CRS99 BLOQUEOU: proposta, valor ou prazo estão incompletos.', 'bad');
      return;
    }

    const age = Date.now() - Number(payload.ts || 0);
    if (!Number.isFinite(age) || age < 0 || age > 30 * 60 * 1000) {
      banner('CRS99 BLOQUEOU: preparação antiga. Abra novamente pelo Mobile.', 'bad');
      return;
    }

    if (alreadySent()) {
      banner('CRS99: esta proposta já aparece como enviada.', 'warn');
      return;
    }
    if (closedProject()) {
      banner('CRS99: este projeto não está aceitando novas propostas.', 'warn');
      return;
    }

    banner('CRS99: preparando campos…');

    let result = { count: 0, fields: {}, ok: {} };
    for (let i = 0; i < 5 && result.count < 3; i++) {
      result = await fill(payload);
      if (result.count === 3) break;
      await sleep(250);
    }

    if (result.count < 3) {
      const trigger = safeProposalTrigger();
      if (trigger) {
        trigger.click();
        for (let i = 0; i < 10 && result.count < 3; i++) {
          await sleep(250);
          result = await fill(payload);
        }
      }
    }

    if (result.count === 3) {
      history.replaceState(null, '', location.pathname + location.search);
      banner('CRS OK — Sua oferta, duração e detalhes preenchidos. Revise e toque em “Enviar proposta” manualmente.');
    } else {
      const missing = [];
      if (!result.ok?.price) missing.push('Sua oferta');
      if (!result.ok?.days) missing.push('Duração');
      if (!result.ok?.proposal) missing.push('Detalhes');
      banner(`CRS encontrou ${result.count}/3 campos — faltou: ${missing.join(', ') || 'campo não identificado'}. Não envie antes de revisar.`, 'bad');
    }
  }

  run().catch((error) => banner(`CRS99 encontrou um erro: ${String(error?.message || error)}`, 'bad'));
})();
