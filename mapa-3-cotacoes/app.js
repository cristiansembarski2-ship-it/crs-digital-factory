(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const draftKey = "crs_mapa_3_cotacoes_v1";
  const state = { items: [], result: null };
  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function num(value) {
    const clean = String(value ?? "").trim().replace(/\./g, "").replace(",", ".");
    const parsed = Number(clean);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  function money(value) { return currency.format(value || 0); }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char])); }
  function supplierNames() { return $$(".supplier-name").map((input, index) => input.value.trim() || "Fornecedor " + (index + 1)); }

  function defaultItem(index = 0) {
    return { id: Date.now() + index + Math.random(), name: "", qty: "1", prices: ["", "", ""] };
  }

  function renderItems() {
    const body = $("#itemsBody");
    body.innerHTML = state.items.map((item, index) => [
      '<tr data-row="' + index + '">',
      '<td><input class="item-name" aria-label="Nome do item" value="' + escapeHtml(item.name) + '" placeholder="Ex.: Cadeira ergonômica"></td>',
      '<td><input class="qty" aria-label="Quantidade" value="' + escapeHtml(item.qty) + '" inputmode="decimal"></td>',
      ...item.prices.map((price, supplier) => '<td><input class="price" data-price="' + supplier + '" aria-label="Preço unitário do fornecedor ' + (supplier + 1) + '" value="' + escapeHtml(price) + '" inputmode="decimal" placeholder="0,00"></td>'),
      '<td><button class="remove" type="button" aria-label="Remover item">×</button></td>',
      "</tr>"
    ].join("")).join("");

    $$("tr[data-row]", body).forEach((row, index) => {
      $(".item-name", row).addEventListener("input", event => { state.items[index].name = event.target.value; saveDraft(); });
      $(".qty", row).addEventListener("input", event => { state.items[index].qty = event.target.value; saveDraft(); });
      $$(".price", row).forEach(input => input.addEventListener("input", event => {
        state.items[index].prices[+event.target.dataset.price] = event.target.value;
        saveDraft();
      }));
      $(".remove", row).addEventListener("click", () => {
        if (state.items.length === 1) { state.items[0] = defaultItem(); }
        else state.items.splice(index, 1);
        renderItems(); saveDraft();
      });
    });
  }

  function renderConditions(values = []) {
    const names = supplierNames();
    $("#conditionsGrid").innerHTML = names.map((name, index) => {
      const value = values[index] || {};
      return [
        '<article class="condition-card" data-condition="' + index + '">',
        "<h3>" + escapeHtml(name) + "</h3>",
        '<div class="condition-fields">',
        '<label>Frete (R$)<input data-field="freight" value="' + escapeHtml(value.freight ?? "0") + '" inputmode="decimal"></label>',
        '<label>Desconto (R$)<input data-field="discount" value="' + escapeHtml(value.discount ?? "0") + '" inputmode="decimal"></label>',
        '<label>Entrega (dias)<input data-field="days" value="' + escapeHtml(value.days ?? "") + '" inputmode="numeric" placeholder="Opcional"></label>',
        '<label>Nota técnica (0–10)<input data-field="score" value="' + escapeHtml(value.score ?? "") + '" inputmode="decimal" placeholder="Opcional"></label>',
        '<label class="wide">Condição de pagamento<input data-field="payment" value="' + escapeHtml(value.payment ?? "") + '" maxlength="80" placeholder="Ex.: 30 dias"></label>',
        "</div></article>"
      ].join("");
    }).join("");
    $$("#conditionsGrid input").forEach(input => input.addEventListener("input", saveDraft));
  }

  function readConditions() {
    return $$(".condition-card").map(card => Object.fromEntries($$("input", card).map(input => [input.dataset.field, input.value])));
  }

  function updateSupplierLabels(keepConditions = true) {
    const conditions = keepConditions ? readConditions() : [];
    const names = supplierNames();
    $$("[data-supplier-head]").forEach(head => { head.textContent = names[+head.dataset.supplierHead]; });
    renderConditions(conditions);
  }

  function validate() {
    $$(".field-error").forEach(element => element.classList.remove("field-error"));
    let valid = true;
    $$("tr[data-row]").forEach((row, index) => {
      const item = state.items[index];
      const name = $(".item-name", row);
      const qty = $(".qty", row);
      if (!item.name.trim()) { name.classList.add("field-error"); valid = false; }
      if (!Number.isFinite(num(item.qty)) || num(item.qty) <= 0) { qty.classList.add("field-error"); valid = false; }
      $$(".price", row).forEach((input, supplier) => {
        if (item.prices[supplier] === "" || !Number.isFinite(num(item.prices[supplier])) || num(item.prices[supplier]) < 0) {
          input.classList.add("field-error"); valid = false;
        }
      });
    });
    $$(".condition-card").forEach(card => {
      for (const field of ["freight", "discount"]) {
        const input = $('[data-field="' + field + '"]', card);
        if (!Number.isFinite(num(input.value)) || num(input.value) < 0) { input.classList.add("field-error"); valid = false; }
      }
      const score = $('[data-field="score"]', card);
      if (score.value !== "" && (!Number.isFinite(num(score.value)) || num(score.value) < 0 || num(score.value) > 10)) {
        score.classList.add("field-error"); valid = false;
      }
    });
    if (!valid) alert("Revise os campos destacados. Preencha todos os itens, quantidades e preços.");
    return valid;
  }

  function calculate() {
    if (!validate()) return;
    const names = supplierNames();
    const conditions = readConditions();
    const totals = names.map((name, supplier) => {
      const subtotal = state.items.reduce((sum, item) => sum + num(item.qty) * num(item.prices[supplier]), 0);
      const freight = num(conditions[supplier].freight) || 0;
      const discount = num(conditions[supplier].discount) || 0;
      return {
        supplier, name, subtotal, freight, discount,
        total: Math.max(0, subtotal + freight - discount),
        days: conditions[supplier].days === "" ? null : num(conditions[supplier].days),
        score: conditions[supplier].score === "" ? null : num(conditions[supplier].score),
        payment: conditions[supplier].payment.trim()
      };
    });
    const ordered = [...totals].sort((a, b) => a.total - b.total);
    state.result = { totals, ordered, names, conditions, createdAt: new Date().toISOString() };
    renderResult();
    saveDraft();
  }

  function renderProReason(result, winner) {
    const reason = $("#proReason");
    const cta = $("#resultProCta");
    if (!reason || !cta) return;

    const scored = result.totals.filter(item => Number.isFinite(item.score));
    const timed = result.totals.filter(item => Number.isFinite(item.days));
    const bestScore = scored.length >= 2 ? [...scored].sort((a, b) => b.score - a.score)[0] : null;
    const fastest = timed.length >= 2 ? [...timed].sort((a, b) => a.days - b.days)[0] : null;
    const secondGap = Math.max(0, result.ordered[1].total - winner.total);
    const gapPct = winner.total > 0 ? secondGap / winner.total : 0;

    let message;
    let ctaText;
    let trackContent;

    if (bestScore && bestScore.supplier !== winner.supplier) {
      message = '<strong>Existe um conflito real nesta compra:</strong> ' + escapeHtml(winner.name) + ' tem o menor custo, mas ' + escapeHtml(bestScore.name) + ' recebeu a maior nota técnica (' + bestScore.score.toLocaleString("pt-BR") + '/10). O Pro permite ponderar preço e critérios qualitativos para documentar por que uma proposta vence.';
      ctaText = "Ponderar preço + qualidade no Pro — R$ 49,90";
      trackContent = "mapa-gratis-divergencia-nota-checkout";
    } else if (fastest && fastest.supplier !== winner.supplier) {
      message = '<strong>Preço e prazo apontam para fornecedores diferentes:</strong> ' + escapeHtml(winner.name) + ' tem o menor custo, enquanto ' + escapeHtml(fastest.name) + ' tem o menor prazo informado (' + fastest.days.toLocaleString("pt-BR") + ' dias). O Pro ajuda a registrar pesos e critérios quando a decisão não é apenas preço.';
      ctaText = "Ponderar preço + prazo no Pro — R$ 49,90";
      trackContent = "mapa-gratis-divergencia-prazo-checkout";
    } else if (secondGap > 0 && gapPct <= 0.05) {
      message = '<strong>A diferença de preço é pequena:</strong> apenas ' + money(secondGap) + ' separa o menor custo do segundo colocado. Quando a diferença é estreita, qualidade, prazo, pagamento e risco podem mudar a decisão. O Pro permite formalizar esses critérios e manter o histórico.';
      ctaText = "Documentar critérios no Pro — R$ 49,90";
      trackContent = "mapa-gratis-gap-pequeno-checkout";
    } else {
      message = '<strong>Quer transformar esta comparação em processo?</strong> O Pro adiciona até 50 itens, pesos, avaliação qualitativa, cadastro de fornecedores, ranking e histórico para compras recorrentes.';
      ctaText = "Documentar esta decisão no Pro — R$ 49,90";
      trackContent = "mapa-gratis-processo-checkout";
    }

    reason.innerHTML = message;
    reason.hidden = false;
    cta.textContent = ctaText;
    cta.dataset.crsTrackContent = trackContent;
  }

  function renderResult() {
    const result = state.result;
    if (!result) return;
    const winner = result.ordered[0];
    $("#winnerBadge").textContent = "Menor custo: " + winner.name;
    $("#summaryGrid").innerHTML = result.totals.map(item => [
      '<article class="summary-card ' + (item.supplier === winner.supplier ? "winner" : "") + '">',
      "<span>" + escapeHtml(item.name) + "</span>",
      "<strong>" + money(item.total) + "</strong>",
      "<small>" + (item.supplier === winner.supplier ? "Menor custo total" : "Custo total") + "</small>",
      "<dl><dt>Itens</dt><dd>" + money(item.subtotal) + "</dd><dt>Frete</dt><dd>" + money(item.freight) + "</dd><dt>Desconto</dt><dd>− " + money(item.discount) + "</dd><dt>Entrega</dt><dd>" + (item.days == null ? "—" : item.days + " dias") + "</dd><dt>Nota técnica</dt><dd>" + (item.score == null ? "—" : item.score.toLocaleString("pt-BR") + "/10") + "</dd><dt>Pagamento</dt><dd>" + escapeHtml(item.payment || "—") + "</dd></dl>",
      "</article>"
    ].join("")).join("");
    $("#savingSecond").textContent = money(Math.max(0, result.ordered[1].total - winner.total));
    $("#savingRange").textContent = money(Math.max(0, result.ordered[2].total - winner.total));
    $("#itemCount").textContent = state.items.length;
    renderProReason(result, winner);
    $("#results").hidden = false;
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function csvCell(value) { return '"' + String(value ?? "").replace(/"/g, '""') + '"'; }
  function exportCsv() {
    if (!state.result) return;
    const names = state.result.names;
    const rows = [["item","quantidade",names[0]+" unitário",names[0]+" total",names[1]+" unitário",names[1]+" total",names[2]+" unitário",names[2]+" total"]];
    state.items.forEach(item => rows.push([item.name,num(item.qty),...item.prices.flatMap(price => [num(price),num(price)*num(item.qty)])]));
    rows.push([]);
    state.result.totals.forEach(item => rows.push([item.name,"subtotal",item.subtotal,"frete",item.freight,"desconto",item.discount,"total",item.total,"entrega_dias",item.days ?? "","nota_tecnica",item.score ?? "","pagamento",item.payment]));
    const csv = "\ufeff" + rows.map(row => row.map(csvCell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "mapa_3_cotacoes.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function snapshot() {
    return { items: state.items, names: supplierNames(), conditions: readConditions(), result: state.result };
  }
  function saveDraft() {
    try { localStorage.setItem(draftKey, JSON.stringify(snapshot())); } catch {}
  }
  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (!draft) return false;
      state.items = Array.isArray(draft.items) && draft.items.length ? draft.items : [defaultItem()];
      $$(".supplier-name").forEach((input, index) => { input.value = draft.names?.[index] || "Fornecedor " + (index + 1); });
      renderItems(); renderConditions(draft.conditions || []); state.result = draft.result || null;
      if (state.result) renderResult();
      return true;
    } catch { return false; }
  }

  function loadDemo() {
    state.items = [
      { id:1, name:"Notebook corporativo", qty:"5", prices:["3290","3150","3360"] },
      { id:2, name:"Dock USB-C", qty:"5", prices:["420","465","399"] },
      { id:3, name:"Mochila executiva", qty:"5", prices:["210","185","225"] }
    ];
    const names = ["Alfa Tecnologia","Beta Suprimentos","Gama Comercial"];
    $$(".supplier-name").forEach((input,index) => { input.value = names[index]; });
    renderItems();
    renderConditions([
      {freight:"180",discount:"350",days:"8",score:"8.8",payment:"28 dias"},
      {freight:"0",discount:"100",days:"12",score:"8.2",payment:"30/60 dias"},
      {freight:"250",discount:"500",days:"5",score:"9.1",payment:"À vista"}
    ]);
    state.result = null; $("#results").hidden = true; saveDraft(); calculate();
  }

  $("#addItem").addEventListener("click", () => { state.items.push(defaultItem(state.items.length)); renderItems(); saveDraft(); });
  $("#calculate").addEventListener("click", calculate);
  $("#exportCsv").addEventListener("click", exportCsv);
  $("#printResult").addEventListener("click", () => window.print());
  $("#loadDemo").addEventListener("click", loadDemo);
  $("#loadDemoTop").addEventListener("click", () => { location.hash = "comparador"; loadDemo(); });
  $$(".supplier-name").forEach(input => input.addEventListener("input", () => { updateSupplierLabels(); saveDraft(); }));

  if (!loadDraft()) {
    state.items = [defaultItem(1), defaultItem(2), defaultItem(3)];
    renderItems(); renderConditions();
  }
})();
