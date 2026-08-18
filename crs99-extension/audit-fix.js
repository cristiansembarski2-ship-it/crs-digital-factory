(() => {
  if (window.__CRS99_AUDIT_FIX__) return;
  window.__CRS99_AUDIT_FIX__ = true;

  const params = new URLSearchParams(location.search);
  if (params.get("crs99auditfix") !== "1") return;

  const { idFrom, normalize, titleSimilarity } = window.CRS99;
  const projectId = idFrom(location.pathname);
  const requestedId = params.get("crs99id") || "";
  if (!projectId || requestedId !== projectId) return;

  // O fluxo normal também usa crs99id. Removemos esse parâmetro antes de
  // project-flow.js executar, deixando esta tela exclusivamente para auditoria.
  const cleanUrl = new URL(location.href);
  cleanUrl.searchParams.delete("crs99id");
  history.replaceState(null, "", cleanUrl.href);

  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function visible(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
  }

  function banner(text, good = false) {
    let box = document.getElementById("crs99-audit-fix-banner");
    if (!box) {
      box = document.createElement("div");
      box.id = "crs99-audit-fix-banner";
      box.style.cssText = "position:fixed;right:16px;bottom:104px;z-index:2147483647;max-width:430px;padding:12px 14px;border-radius:9px;color:#fff;font:700 12px/1.4 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)";
      document.documentElement.appendChild(box);
    }
    box.style.background = good ? "#15803d" : "#b91c1c";
    box.textContent = text;
  }

  function titleCandidates() {
    return all("h1,h2,h3").filter(visible).map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).filter((x) => x.length >= 5);
  }

  function fieldContext(el) {
    const parts = [el.name, el.id, el.placeholder, el.getAttribute("aria-label")].filter(Boolean);
    if (el.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) parts.push(label.textContent || "");
      } catch {}
    }
    const parent = el.closest(".form-group,.field,.control-group,.row,.input-group,div");
    if (parent) parts.push((parent.innerText || "").slice(0, 350));
    return normalize(parts.join(" "));
  }

  function proposalField() {
    const candidates = [...all("textarea"), ...all('[contenteditable="true"]')].filter(visible).map((el) => {
      const ctx = fieldContext(el);
      let score = 0;
      if (/detalhes|proposta|mensagem|descricao|apresentacao/.test(ctx)) score += 30;
      if (el.tagName === "TEXTAREA") score += 5;
      return { el, score };
    }).sort((a,b) => b.score - a.score);
    return candidates[0]?.score > 0 ? candidates[0].el : null;
  }

  function setValue(el, value) {
    if (!el) return false;
    try {
      el.focus();
      if (el.isContentEditable) {
        el.textContent = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(el, value); else el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
      return true;
    } catch { return false; }
  }

  async function run() {
    const key = `crs99AuditFix:${projectId}`;
    const stored = await chrome.storage.local.get(key);
    const fix = stored[key];
    if (!fix || String(fix.projectId) !== projectId || !fix.proposal) {
      banner("Auditoria CRS: não encontrei uma correção válida para este projeto.");
      return;
    }

    const age = Date.now() - new Date(fix.createdAt || 0).getTime();
    if (!Number.isFinite(age) || age < 0 || age > 60 * 60 * 1000) {
      banner("Auditoria CRS: a correção expirou. Rode a auditoria novamente.");
      return;
    }

    const headings = titleCandidates();
    if (headings.length) {
      const best = headings.map((title) => ({ title, score: titleSimilarity(title, fix.title) })).sort((a,b) => b.score - a.score)[0];
      if (!best || best.score < 0.55) {
        banner(`Auditoria CRS bloqueou: o formulário não parece pertencer a “${fix.title}”.`);
        return;
      }
    }

    for (let attempt = 0; attempt < 14; attempt++) {
      const field = proposalField();
      if (field && setValue(field, fix.proposal)) {
        banner(`CORREÇÃO PREPARADA — ${fix.title}. Revise o texto e clique no botão oficial para salvar/melhorar a proposta.`, true);
        return;
      }
      await sleep(220);
    }
    banner("Auditoria CRS não encontrou o campo de texto. Não alterei nada.");
  }

  setTimeout(() => run().catch(() => banner("Auditoria CRS encontrou um erro ao preparar a correção.")), 60);
})();