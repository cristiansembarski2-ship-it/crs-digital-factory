(() => {
  const QUEUE_URL = "/crs99/opportunities.json";
  const LOCAL_KEY = "crs99MobileLocalV1";
  const SENT_KEY = "crs99MobileSentV1";
  const $ = (sel, root = document) => root.querySelector(sel);

  const refs = {
    refresh: $("#refreshBtn"),
    syncPill: $("#syncPill"),
    quickBtn: $("#quickBtn"),
    installBtn: $("#installBtn"),
    quickPanel: $("#quickPanel"),
    closeQuick: $("#closeQuickBtn"),
    quickUrl: $("#quickUrl"),
    quickTitle: $("#quickTitleInput"),
    quickPrice: $("#quickPrice"),
    quickDays: $("#quickDays"),
    quickProposal: $("#quickProposal"),
    saveQuick: $("#saveQuickBtn"),
    openQuick: $("#openQuickBtn"),
    search: $("#searchInput"),
    filter: $("#statusFilter"),
    count: $("#countText"),
    updated: $("#updatedText"),
    list: $("#list"),
    empty: $("#emptyState"),
    toast: $("#toast"),
    template: $("#cardTemplate")
  };

  let queue = [];
  let queueUpdatedAt = "";
  let deferredInstall = null;
  let toastTimer = null;

  const normalize = (value = "") => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  function projectId(value = "") {
    let text = String(value || "");
    try {
      if (/^https?:/i.test(text)) text = new URL(text).pathname;
    } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    let match = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (match) return match[1];
    match = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (match) return match[1];
    match = text.match(/(?:^|[-/])(\d{4,})$/);
    return match ? match[1] : "";
  }

  function bidUrl(item = {}) {
    if (item.bidUrl) return item.bidUrl;
    const id = projectId(item.url || item.projectKey || "");
    return id ? `https://www.99freelas.com.br/project/bid/${id}` : (item.url || "");
  }

  function getJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function localItems() {
    return getJson(LOCAL_KEY, []);
  }

  function sentIds() {
    return new Set(getJson(SENT_KEY, []));
  }

  function itemId(item = {}) {
    return projectId(item.url || item.projectKey || "") || item.localId || item.projectKey || item.title || crypto.randomUUID();
  }

  function withLocalState(item) {
    const id = itemId(item);
    const sent = sentIds();
    return {
      ...item,
      _id: id,
      _local: Boolean(item.localId),
      _displayStatus: sent.has(id) ? "sent" : (item.status || "candidate")
    };
  }

  function allItems() {
    const remote = queue.map(withLocalState);
    const remoteIds = new Set(remote.map((x) => x._id));
    const local = localItems().map(withLocalState).filter((x) => !remoteIds.has(x._id));
    return [...local, ...remote];
  }

  function money(value) {
    const number = Number(String(value ?? "").replace(",", "."));
    if (!Number.isFinite(number)) return "—";
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
  }

  function plainPrice(value) {
    const number = Number(String(value ?? "").replace(",", "."));
    if (!Number.isFinite(number)) return "";
    return String(number).replace(".", ",");
  }

  function dayText(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return `${n} ${n === 1 ? "dia" : "dias"}`;
  }

  function statusLabel(status) {
    if (status === "sent") return ["ENVIADA", "good"];
    if (["closed", "unavailable"].includes(status)) return ["FECHADO", "danger"];
    if (status === "ready") return ["PRONTA", "good"];
    return ["CANDIDATA", "warn"];
  }

  function toast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 2100);
  }

  async function copy(text, label) {
    if (!text) {
      toast(`${label} não disponível.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(String(text));
      toast(`${label} copiado.`);
    } catch {
      const area = document.createElement("textarea");
      area.value = String(text);
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      toast(`${label} copiado.`);
    }
  }

  function packageText(item) {
    return [
      item.price != null ? `Valor: R$ ${plainPrice(item.price)}` : "",
      item.days != null ? `Prazo: ${item.days} dias` : "",
      item.proposal ? `Proposta:\n${item.proposal}` : ""
    ].filter(Boolean).join("\n\n");
  }

  function filteredItems() {
    const query = normalize(refs.search.value);
    const filter = refs.filter.value;
    return allItems().filter((item) => {
      const status = item._displayStatus;
      const statusOk = filter === "all"
        || (filter === "active" && !["sent", "closed", "unavailable"].includes(status))
        || (filter === "candidate" && ["candidate", "ready"].includes(status))
        || (filter === "sent" && status === "sent")
        || (filter === "closed" && ["closed", "unavailable"].includes(status));
      if (!statusOk) return false;
      if (!query) return true;
      return normalize([item.title, item.projectKey, item.risk, item.proposal].join(" ")).includes(query);
    }).sort((a, b) => {
      const aActive = ["sent", "closed", "unavailable"].includes(a._displayStatus) ? 0 : 1;
      const bActive = ["sent", "closed", "unavailable"].includes(b._displayStatus) ? 0 : 1;
      if (aActive !== bActive) return bActive - aActive;
      return Number(b.fit || 0) - Number(a.fit || 0);
    });
  }

  function render() {
    refs.list.textContent = "";
    const items = filteredItems();
    refs.count.textContent = `${items.length} ${items.length === 1 ? "projeto" : "projetos"}`;
    refs.empty.classList.toggle("hidden", items.length !== 0);

    if (queueUpdatedAt) {
      const date = new Date(queueUpdatedAt);
      refs.updated.textContent = Number.isNaN(date.getTime()) ? queueUpdatedAt : `Fila: ${date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
    } else {
      refs.updated.textContent = "Fila local";
    }

    for (const item of items) {
      const node = refs.template.content.cloneNode(true);
      const article = $(".job", node);
      const badges = $(".job-badges", node);
      const [label, tone] = statusLabel(item._displayStatus);
      badges.innerHTML = `<span class="pill ${tone}">${label}</span>${item.exclusive ? '<span class="pill good">PREMIUM</span>' : ""}${item._local ? '<span class="pill neutral">LOCAL</span>' : ""}`;
      $(".job-title", node).textContent = item.title || "Projeto sem título";
      $(".job-fit", node).textContent = item.fit != null ? `${item.fit}/10` : "—";
      $(".job-price", node).textContent = money(item.price);
      $(".job-days", node).textContent = dayText(item.days);
      const risk = $(".job-risk", node);
      risk.textContent = item.risk || "Sem risco registrado.";
      const preview = $(".proposal-preview", node);
      preview.textContent = item.proposal || "Sem texto de proposta salvo.";

      $(".copy-proposal", node).addEventListener("click", () => copy(item.proposal, "Proposta"));
      $(".copy-price", node).addEventListener("click", () => copy(plainPrice(item.price), "Valor"));
      $(".copy-days", node).addEventListener("click", () => copy(item.days != null ? String(item.days) : "", "Prazo"));
      $(".copy-all", node).addEventListener("click", () => copy(packageText(item), "Pacote"));

      const open = $(".open-bid", node);
      const target = bidUrl(item);
      if (!target || ["closed", "unavailable"].includes(item._displayStatus)) {
        open.disabled = true;
        open.textContent = ["closed", "unavailable"].includes(item._displayStatus) ? "Projeto indisponível" : "Link indisponível";
      } else {
        open.addEventListener("click", () => window.location.href = target);
      }

      const more = $(".more-btn", node);
      const menu = $(".job-menu", node);
      more.addEventListener("click", () => menu.classList.toggle("hidden"));

      const markSent = $(".mark-sent", node);
      markSent.disabled = item._displayStatus === "sent";
      markSent.addEventListener("click", () => {
        const ids = sentIds();
        ids.add(item._id);
        setJson(SENT_KEY, [...ids]);
        toast("Marcado como enviado neste celular.");
        render();
      });

      const remove = $(".remove-local", node);
      remove.classList.toggle("hidden", !item._local);
      remove.addEventListener("click", () => {
        const next = localItems().filter((x) => itemId(x) !== item._id);
        setJson(LOCAL_KEY, next);
        toast("Item local removido.");
        render();
      });

      article.dataset.projectId = item._id;
      refs.list.appendChild(node);
    }
  }

  async function loadQueue() {
    refs.syncPill.textContent = "Sincronizando…";
    refs.syncPill.className = "pill neutral";
    refs.refresh.disabled = true;
    try {
      const response = await fetch(`${QUEUE_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      queue = Array.isArray(data.opportunities) ? data.opportunities : [];
      queueUpdatedAt = data.updatedAt || "";
      refs.syncPill.textContent = "Fila online";
      refs.syncPill.className = "pill good";
    } catch (error) {
      refs.syncPill.textContent = "Somente local";
      refs.syncPill.className = "pill warn";
      toast("Não foi possível atualizar a fila online.");
      console.error(error);
    } finally {
      refs.refresh.disabled = false;
      render();
    }
  }

  function quickItem() {
    const url = refs.quickUrl.value.trim();
    return {
      localId: projectId(url) || `local-${Date.now()}`,
      projectKey: projectId(url) || `local-${Date.now()}`,
      title: refs.quickTitle.value.trim() || "Proposta rápida",
      url,
      status: "ready",
      fit: null,
      price: refs.quickPrice.value.trim().replace(",", ".") || null,
      days: refs.quickDays.value.trim() || null,
      risk: "Criada manualmente no CRS 99 Mobile.",
      proposal: refs.quickProposal.value.trim()
    };
  }

  function clearQuick() {
    refs.quickUrl.value = "";
    refs.quickTitle.value = "";
    refs.quickPrice.value = "";
    refs.quickDays.value = "";
    refs.quickProposal.value = "";
  }

  refs.quickBtn.addEventListener("click", () => {
    refs.quickPanel.classList.remove("hidden");
    refs.quickUrl.focus();
    refs.quickPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  refs.closeQuick.addEventListener("click", () => refs.quickPanel.classList.add("hidden"));

  refs.saveQuick.addEventListener("click", () => {
    const item = quickItem();
    if (!item.proposal && item.price == null && item.days == null) {
      toast("Preencha pelo menos proposta, valor ou prazo.");
      return;
    }
    const existing = localItems();
    const id = itemId(item);
    const next = [item, ...existing.filter((x) => itemId(x) !== id)];
    setJson(LOCAL_KEY, next);
    toast("Proposta salva neste celular.");
    clearQuick();
    refs.quickPanel.classList.add("hidden");
    refs.filter.value = "active";
    render();
  });

  refs.openQuick.addEventListener("click", () => {
    const item = quickItem();
    const target = bidUrl(item);
    if (!target) {
      toast("Cole primeiro o link do projeto.");
      return;
    }
    window.location.href = target;
  });

  refs.refresh.addEventListener("click", loadQueue);
  refs.search.addEventListener("input", render);
  refs.filter.addEventListener("change", render);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstall = event;
    refs.installBtn.classList.remove("hidden");
  });

  refs.installBtn.addEventListener("click", async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    refs.installBtn.classList.add("hidden");
  });

  window.addEventListener("appinstalled", () => toast("CRS 99 Mobile instalado."));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  }

  render();
  loadQueue();
})();
