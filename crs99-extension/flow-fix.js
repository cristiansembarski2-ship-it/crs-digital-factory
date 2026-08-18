(() => {
  if (window.__CRS99_FLOW_FIX__) return;
  window.__CRS99_FLOW_FIX__ = true;

  const normalize = (value = "") => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const $all = (selector, root = document) => [...root.querySelectorAll(selector)];

  function canonical(value = "") {
    let text = String(value || "");
    try { if (/^https?:/i.test(text)) text = new URL(text).pathname; } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    const bid = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (bid) return bid[1];
    const project = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (project) return project[1];
    const suffix = text.match(/(?:^|[-/])(\d{4,})$/);
    return suffix ? suffix[1] : "";
  }

  const currentId = canonical(location.pathname);
  const isBidPage = /\/project\/bid\//i.test(location.pathname);
  if (!currentId) return;

  async function mirrorPlan(plan, sourceKey = "") {
    if (!plan) return;
    const id = canonical(plan.projectKey || plan.projectId || plan.sourceUrl || sourceKey);
    if (!id) return;
    const rawSource = String(sourceKey || "");
    const alreadyCanonical = rawSource === id && String(plan.projectKey || plan.projectId || "") === id;
    if (alreadyCanonical) return;
    const safe = { ...plan, projectKey: id, projectId: id };
    await chrome.storage.local.set({ [`crs99Plan:${id}`]: safe, crs99LastPreparedPlan: safe });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const [key, change] of Object.entries(changes)) {
      if (!key.startsWith("crs99Plan:") || !change.newValue) continue;
      const sourceKey = key.slice("crs99Plan:".length);
      const id = canonical(change.newValue.projectKey || change.newValue.projectId || change.newValue.sourceUrl || sourceKey);
      if (!id || sourceKey === id && String(change.newValue.projectKey || change.newValue.projectId || "") === id) continue;
      mirrorPlan(change.newValue, sourceKey).catch(() => {});
    }
  });

  async function getPlanForCurrent() {
    const data = await chrome.storage.local.get(null);
    const direct = data[`crs99Plan:${currentId}`];
    if (direct && canonical(direct.projectKey || direct.projectId || direct.sourceUrl) === currentId) return direct;

    const last = data.crs99LastPreparedPlan;
    if (last) {
      const lastId = canonical(last.projectKey || last.projectId || last.sourceUrl);
      const age = Date.now() - new Date(last.generatedAt || 0).getTime();
      if (lastId === currentId && age < 30 * 60 * 1000) return last;
    }

    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith("crs99Plan:") || !value) continue;
      const id = canonical(value.projectKey || value.projectId || value.sourceUrl || key.slice("crs99Plan:".length));
      if (id === currentId) return value;
    }
    return null;
  }

  function visible(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
  }

  function context(el) {
    const parts = [el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.getAttribute("data-label")].filter(Boolean);
    if (el.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) parts.push(label.textContent || "");
      } catch {}
    }
    const parent = el.closest(".form-group,.field,.control-group,.row,.input-group,.form-control-group,div");
    if (parent) parts.push((parent.innerText || "").slice(0, 350));
    return normalize(parts.join(" "));
  }

  function bestField(candidates, terms, preferTag = "") {
    const ranked = candidates
      .filter(visible)
      .map(el => {
        const ctx = context(el);
        let score = 0;
        terms.forEach((term, index) => { if (ctx.includes(normalize(term))) score += 30 - index; });
        if (preferTag && el.tagName === preferTag) score += 4;
        return { el, score };
      })
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.score > 0 ? ranked[0].el : null;
  }

  function findProposal() {
    const candidates = [...$all("textarea"), ...$all('[contenteditable="true"]')].filter(visible);
    return bestField(candidates, ["proposta", "detalhes da proposta", "mensagem", "descricao", "apresentacao", "sobre o projeto"], "TEXTAREA")
      || (candidates.length === 1 ? candidates[0] : candidates.sort((a,b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0])
      || null;
  }

  function findPrice() {
    const direct = $all('input[name*="price" i],input[name*="value" i],input[name*="offer" i],input[id*="price" i],input[id*="value" i],input[id*="offer" i]').filter(visible);
    return bestField(direct.length ? direct : $all('input').filter(visible), ["valor da proposta", "valor", "preco", "preço", "orcamento", "orçamento", "oferta", "r$"]);
  }

  function findDays() {
    const direct = $all('input[name*="day" i],input[name*="term" i],input[name*="deadline" i],input[id*="day" i],input[id*="term" i],input[id*="deadline" i]').filter(visible);
    return bestField(direct.length ? direct : $all('input').filter(visible), ["prazo", "dias", "entrega", "tempo", "duracao", "duração"]);
  }

  function setValue(el, value) {
    if (!el || value == null) return false;
    const next = String(value);
    try {
      el.focus();
      if (el.isContentEditable) {
        el.textContent = next;
        if (typeof InputEvent === "function") el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: next }));
        else el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(el, next); else el.value = next;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
      el.dataset.crs99Filled = "true";
      return true;
    } catch {
      return false;
    }
  }

  function panelMessage(text) {
    const panel = document.querySelector("#crs99-copilot");
    const msg = panel?.querySelector(".crs99-message");
    if (msg) msg.textContent = text;
  }

  let filling = false;
  let filledForId = "";
  async function robustFill() {
    if (filling || !/\/project\/bid\//i.test(location.pathname)) return false;
    const idNow = canonical(location.pathname);
    if (!idNow || filledForId === idNow) return true;
    filling = true;
    try {
      const plan = await getPlanForCurrent();
      if (!plan) {
        panelMessage("Não encontrei o plano deste projeto. Não vou reutilizar proposta de outro projeto.");
        return false;
      }
      const planId = canonical(plan.projectKey || plan.projectId || plan.sourceUrl);
      if (planId !== idNow) {
        panelMessage("Proteção CRS: o plano salvo pertence a outro projeto. Preenchimento bloqueado.");
        return false;
      }
      if (plan.decision === "skip") return false;

      let bestResult = 0;
      for (let attempt = 0; attempt < 28; attempt++) {
        const proposal = findProposal();
        const price = findPrice();
        const days = findDays();
        let result = 0;
        if (proposal && plan.proposal && setValue(proposal, plan.proposal)) result++;
        if (price && plan.price != null && setValue(price, plan.price)) result++;
        if (days && plan.days != null && setValue(days, plan.days)) result++;
        bestResult = Math.max(bestResult, result);
        if (result >= 3) {
          filledForId = idNow;
          const submit = $all('button,input[type="submit"]').find(el => normalize(el.textContent || el.value).includes("enviar proposta"));
          if (submit) {
            submit.dataset.crs99Ready = "true";
            submit.title = "CRS: campos preenchidos. Revise e faça apenas o clique final.";
            submit.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          panelMessage("Pronto: proposta, valor e prazo preenchidos automaticamente.");
          return true;
        }
        await new Promise(r => setTimeout(r, 300));
      }
      panelMessage(bestResult ? "Preenchi parte do formulário; algum campo mudou no 99Freelas." : "O formulário abriu, mas os campos não foram reconhecidos. Não preenchi dados errados.");
      return bestResult > 0;
    } finally {
      filling = false;
    }
  }

  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      filledForId = "";
      if (/\/project\/bid\//i.test(lastPath)) setTimeout(() => robustFill().catch(() => {}), 100);
    }
  }, 250);

  if (isBidPage) setTimeout(() => robustFill().catch(() => {}), 50);
})();