(() => {
  "use strict";

  const form = document.getElementById("rfqLinkForm");
  const anchor = document.getElementById("savedResponses");
  if (!form || !anchor) return;

  const STORAGE_KEY = "crs_rfq_templates_v1";
  const MAX_ITEMS = 12;
  const fields = {
    item: "li",
    qty: "lq",
    unit: "lu",
    spec: "ls",
    place: "lp",
    deadline: "ld",
    payment: "lpay",
    validity: "lv",
    notes: "ln"
  };

  function track(name) {
    try {
      if (typeof window.va === "function") {
        window.va("event", { name, data: { path: location.pathname } });
      }
    } catch (_) {}
  }

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch (_) {}
  }

  function snapshot() {
    const data = {};
    Object.entries(fields).forEach(([key, id]) => {
      const element = document.getElementById(id);
      data[key] = element ? String(element.value || "").trim() : "";
    });
    data.savedAt = new Date().toISOString();
    return data;
  }

  function fingerprint(item) {
    return [item.item, item.unit, item.spec].join("|").toLowerCase().slice(0, 500);
  }

  function saveCurrent() {
    const item = snapshot();
    if (!item.item || !item.qty || !item.unit) return;
    const key = fingerprint(item);
    const next = read().filter((existing) => fingerprint(existing) !== key);
    next.unshift(item);
    write(next);
    render();
  }

  function fill(item) {
    Object.entries(fields).forEach(([key, id]) => {
      const element = document.getElementById(id);
      if (element) element.value = item[key] || "";
    });
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    const first = document.getElementById("li");
    if (first) first.focus();
    track("RFQ Template Reused");
  }

  function remove(index) {
    const items = read();
    items.splice(index, 1);
    write(items);
    render();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const panel = document.createElement("section");
  panel.id = "rfqHistoryPanel";
  panel.style.marginTop = "22px";
  anchor.insertAdjacentElement("afterend", panel);

  function render() {
    const items = read();
    if (!items.length) {
      panel.innerHTML = "";
      return;
    }

    panel.innerHTML = `
      <div style="padding-top:18px;border-top:1px solid rgba(255,255,255,.08)">
        <h3 style="margin:0 0 6px">Cotações recentes neste navegador</h3>
        <p class="sub" style="margin-bottom:12px">Reutilize um pedido anterior e gere um novo link sem preencher tudo de novo. O histórico fica somente neste dispositivo.</p>
        <div style="display:grid;gap:9px">
          ${items.map((item, index) => `
            <div style="padding:12px;border:1px solid #20334a;border-radius:13px;background:#091827">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
                <div>
                  <b>${escapeHtml(item.item)}</b>
                  <small style="display:block;color:#9fb1c7;margin-top:3px">${escapeHtml(item.qty)} ${escapeHtml(item.unit)}${item.place ? " • " + escapeHtml(item.place) : ""}</small>
                </div>
                <div style="display:flex;gap:7px;flex-wrap:wrap">
                  <button class="button" type="button" data-rfq-reuse="${index}" style="min-height:38px;padding:8px 11px;font-size:12px">Reutilizar</button>
                  <button class="button" type="button" data-rfq-remove="${index}" style="min-height:38px;padding:8px 11px;font-size:12px">Excluir</button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  panel.addEventListener("click", (event) => {
    const reuse = event.target.closest("[data-rfq-reuse]");
    if (reuse) {
      const item = read()[Number(reuse.dataset.rfqReuse)];
      if (item) fill(item);
      return;
    }

    const removeButton = event.target.closest("[data-rfq-remove]");
    if (removeButton) remove(Number(removeButton.dataset.rfqRemove));
  });

  form.addEventListener("submit", () => {
    window.setTimeout(saveCurrent, 0);
  });

  render();
})();