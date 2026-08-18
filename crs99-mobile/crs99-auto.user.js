// ==UserScript==
// @name         CRS99 Auto Preencher
// @namespace    https://crs-digital-factory.vercel.app/
// @version      1.1.0
// @description  Preenche automaticamente proposta, valor e prazo no 99Freelas quando a página é aberta pelo CRS99 Mobile. Nunca envia a proposta.
// @match        https://www.99freelas.com.br/project/*
// @run-at       document-idle
// @grant        none
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
      const t = normalize(term);
      if (meta.includes(t)) score += 500 - index * 12;
    });
    negatives.forEach((term, index) => {
      const t = normalize(term);
      if (meta.includes(t)) score -= 800 - index * 10;
    });

    ancestorTexts(element).forEach(({ text, distance }) => {
      const proximity = Math.max(1, 7 - distance);
      positives.forEach((term, index) => {
        const t = normalize(term);
        if (text.includes(t)) score += proximity * (60 - Math.min(index, 8) * 4);
      });
      negatives.forEach((term, index) => {
        const t = normalize(term);
        if (text.includes(t)) score -= proximity * (110 - Math.min(index, 8) * 5);
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

  function setValue(element, value) {
    if (!element || value == null) return false;
    try {
      const next = String(value);
      element.focus();

      if (element.isContentEditable) {
        element.textContent = next;
        element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: next }));
      } else {
        const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(element, next); else element.value = next;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('keyup', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      return normalize(element.value ?? element.textContent).length > 0;
    } catch {
      return false;
    }
  }

  function fields() {
    const textCandidates = [...all('textarea'), ...all('[contenteditable="true"]')];
    const inputs = all('input').filter(usable);

    const proposal = bestField(
      textCandidates,
      ['escreva aqui os detalhes da proposta', 'detalhes da proposta', 'detalhes', 'proposta', 'mensagem', 'descricao', 'apresentacao'],
      [],
      'TEXTAREA'
    ) || textCandidates.filter(usable)[0] || null;

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

  function fill(payload) {
    const f = fields();
    let count = 0;

    if (f.proposal && setValue(f.proposal, payload.proposal)) count++;
    if (f.price && setValue(f.price, payload.price)) count++;
    if (f.days && setValue(f.days, payload.days)) count++;

    return { count, fields: f };
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

    let result = { count: 0, fields: {} };
    for (let i = 0; i < 15 && result.count < 3; i++) {
      result = fill(payload);
      if (result.count === 3) break;
      await sleep(180);
    }

    if (result.count < 3) {
      const trigger = safeProposalTrigger();
      if (trigger) {
        trigger.click();
        for (let i = 0; i < 35 && result.count < 3; i++) {
          await sleep(180);
          result = fill(payload);
        }
      }
    }

    if (result.count === 3) {
      history.replaceState(null, '', location.pathname + location.search);
      banner('CRS OK — Sua oferta, duração e detalhes preenchidos. Revise e toque em “Enviar proposta” manualmente.');
    } else {
      const missing = [];
      if (!result.fields?.price) missing.push('Sua oferta');
      if (!result.fields?.days) missing.push('Duração');
      if (!result.fields?.proposal) missing.push('Detalhes');
      banner(`CRS encontrou ${result.count}/3 campos${missing.length ? ` — faltou: ${missing.join(', ')}` : ''}. Não envie antes de revisar.`, 'bad');
    }
  }

  run().catch((error) => banner(`CRS99 encontrou um erro: ${String(error?.message || error)}`, 'bad'));
})();
