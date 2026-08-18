(() => {
  if (window.__CRS99_AUDIT_FIX_V2__) return;
  window.__CRS99_AUDIT_FIX_V2__ = true;

  const { idFrom, normalize, titleSimilarity } = window.CRS99;
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Na tela Minhas Propostas, a versão anterior construía /project/bid/<projectId>
  // por conta própria. Isso não é confiável: o 99Freelas pode usar outra rota/ID
  // para editar uma proposta existente. Interceptamos SOMENTE essa abertura e
  // mandamos primeiro para a página real do projeto.
  if (/^\/my-proposals(?:\/|$)/i.test(location.pathname)) {
    const nativeOpen = window.open.bind(window);
    window.open = function(url, target, features) {
      try {
        const requested = new URL(String(url || ""), location.origin);
        const id = idFrom(requested.pathname);
        if (id && /\/project\/bid\//i.test(requested.pathname) && requested.searchParams.get("crs99auditfix") === "1") {
          const project = all('a[href*="/project/"]').find((a) => {
            const href = a.href || a.getAttribute("href") || "";
            return idFrom(href) === id && !/\/project\/bid\//i.test(href);
          });
          if (project) {
            const real = new URL(project.href || project.getAttribute("href"), location.origin);
            real.searchParams.set("crs99auditfixstart", "1");
            real.searchParams.set("crs99id", id);
            return nativeOpen(real.href, target || "_blank", features);
          }
        }
      } catch {}
      return nativeOpen(url, target, features);
    };
    return;
  }

  const params = new URLSearchParams(location.search);
  const pathId = idFrom(location.pathname);
  const requestedId = params.get("crs99id") || "";
  const startMode = params.get("crs99auditfixstart") === "1";

  function visible(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function banner(text, good = false) {
    let box = document.getElementById("crs99-audit-fix-banner");
    if (!box) {
      box = document.createElement("div");
      box.id = "crs99-audit-fix-banner";
      box.style.cssText = "position:fixed;right:16px;bottom:104px;z-index:2147483647;max-width:450px;padding:12px 14px;border-radius:9px;color:#fff;font:700 12px/1.4 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)";
      document.documentElement.appendChild(box);
    }
    box.style.background = good ? "#15803d" : "#b91c1c";
    box.textContent = text;
  }

  function titleCandidates() {
    return all("h1,h2,h3")
      .filter(visible)
      .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
      .filter((text) => text.length >= 5 && !/^404$/.test(text));
  }

  function findImproveAction() {
    const candidates = all("a,button,input[type='button'],input[type='submit']");
    return candidates.find((el) => {
      const text = normalize(el.textContent || el.value || "");
      return text.includes("melhorar proposta") || text.includes("editar proposta") || text.includes("editar sua proposta");
    }) || null;
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
    const candidates = [...all("textarea"), ...all('[contenteditable="true"]')]
      .filter(visible)
      .map((el) => {
        const ctx = fieldContext(el);
        let score = 0;
        if (/detalhes|proposta|mensagem|descricao|apresentacao/.test(ctx)) score += 30;
        if (el.tagName === "TEXTAREA") score += 5;
        return { el, score };
      })
      .sort((a, b) => b.score - a.score);
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
        if (setter) setter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
      return true;
    } catch {
      return false;
    }
  }

  async function readFix(id) {
    const key = `crs99AuditFix:${id}`;
    const stored = await chrome.storage.local.get(key);
    const fix = stored[key];
    if (!fix || String(fix.projectId) !== String(id) || !fix.proposal) return null;
    const age = Date.now() - new Date(fix.createdAt || 0).getTime();
    if (!Number.isFinite(age) || age < 0 || age > 60 * 60 * 1000) return null;
    return fix;
  }

  async function beginFromProject() {
    if (!startMode || !requestedId || pathId !== requestedId) return false;
    const fix = await readFix(requestedId);
    if (!fix) {
      banner("Auditoria CRS: a correção não existe ou expirou. Volte a Minhas Propostas e gere novamente.");
      return true;
    }

    const headings = titleCandidates();
    if (headings.length) {
      const best = headings.map((title) => ({ title, score: titleSimilarity(title, fix.title) })).sort((a, b) => b.score - a.score)[0];
      if (!best || best.score < 0.55) {
        banner(`Auditoria CRS bloqueou: esta página não parece ser “${fix.title}”.`);
        return true;
      }
    }

    const action = findImproveAction();
    if (!action) {
      banner("Auditoria CRS: não encontrei o botão real “Melhorar proposta” neste projeto. Não alterei nada.");
      return true;
    }

    await chrome.storage.local.set({
      crs99AuditPendingFix: {
        projectId: requestedId,
        title: fix.title,
        createdAt: new Date().toISOString()
      }
    });

    if (action.tagName === "A" && action.href) {
      location.href = action.href;
    } else {
      action.click();
    }
    return true;
  }

  async function pendingFix() {
    const stored = await chrome.storage.local.get("crs99AuditPendingFix");
    const pending = stored.crs99AuditPendingFix;
    if (!pending?.projectId) return null;
    const age = Date.now() - new Date(pending.createdAt || 0).getTime();
    if (!Number.isFinite(age) || age < 0 || age > 10 * 60 * 1000) {
      await chrome.storage.local.remove("crs99AuditPendingFix");
      return null;
    }
    return pending;
  }

  async function fillPendingCorrection() {
    const pending = await pendingFix();
    if (!pending) return false;
    const fix = await readFix(pending.projectId);
    if (!fix) {
      await chrome.storage.local.remove("crs99AuditPendingFix");
      return false;
    }

    // Nunca preenche uma página 404 ou outra página qualquer.
    const pageText = normalize(document.body?.innerText || "");
    if (pageText.includes("pagina que voce esta tentando acessar nao foi encontrada") || pageText.includes("404")) return false;

    const headings = titleCandidates();
    if (headings.length) {
      const best = headings.map((title) => ({ title, score: titleSimilarity(title, fix.title) })).sort((a, b) => b.score - a.score)[0];
      if (!best || best.score < 0.55) return false;
    }

    for (let attempt = 0; attempt < 14; attempt++) {
      const field = proposalField();
      if (field && setValue(field, fix.proposal)) {
        await chrome.storage.local.remove("crs99AuditPendingFix");
        banner(`CORREÇÃO PREPARADA — ${fix.title}. Revise o texto e clique no botão oficial para salvar/melhorar a proposta.`, true);
        return true;
      }
      await sleep(220);
    }
    return false;
  }

  setTimeout(async () => {
    try {
      if (await beginFromProject()) return;
      await fillPendingCorrection();
    } catch {
      banner("Auditoria CRS encontrou um erro no fluxo de correção. Não alterei nada.");
    }
  }, 80);
})();