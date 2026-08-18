(() => {
  const QUEUE_URL = "/crs99/opportunities.json";
  const LOCAL_KEY = "crs99MobileLocalV1";
  const SENT_KEY = "crs99MobileSentV1";
  const PREPARED_KEY = "crs99MobilePreparedV1";
  const $ = (sel, root = document) => root.querySelector(sel);

  const refs = {
    refresh: $("#refreshBtn"),
    syncPill: $("#syncPill"),
    quickBtn: $("#quickBtn"),
    setupBtn: $("#setupBtn"),
    installBtn: $("#installBtn"),
    setupPanel: $("#setupPanel"),
    closeSetup: $("#closeSetupBtn"),
    bookmarkletCode: $("#bookmarkletCode"),
    copyBookmarklet: $("#copyBookmarkletBtn"),
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

  function payloadUrl(item = {}) {
    const base = bidUrl(item);
    const id = projectId(base || item.url || item.projectKey || "");
    if (!base || !id) return "";
    const payload = {
      v: 1,
      id,
      title: item.title || "",
      price: item.price ?? "",
      days: item.days ?? "",
      proposal: item.proposal || "",
      ts: Date.now()
    };
    return `${base.split("#")[0]}#crs99=${encodeURIComponent(JSON.stringify(payload))}`;
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

  function preparedIds() {
    return new Set(getJson(PREPARED_KEY, []));
  }

  function itemId(item = {}) {
    return projectId(item.url || item.projectKey || "") || item.localId || item.projectKey || item.title || crypto.randomUUID();
  }

  function withLocalState(item) {
    const id = itemId(item);
    const sent = sentIds();
    const prepared = preparedIds();
    const remoteStatus = item.status || "candidate";
    let displayStatus = remoteStatus;
    if (sent.has(id) || remoteStatus === "sent") displayStatus = "sent";
    else if (["closed", "unavailable"].includes(remoteStatus)) displayStatus = remoteStatus;
    else if (prepared.has(id)) displayStatus = "prepared";
    return {
      ...item,
      _id: id,
      _local: Boolean(item.localId),
      _displayStatus: displayStatus
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
    if (status === "prepared") return ["PREPARADA", "good"];
    if (status === "ready") return ["PRONTA", "good"];
    return ["CANDIDATA", "warn"];
  }

  function toast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 2300);
  }

  async function copy(text, label) {
    if (!text) {
      toast(`${label} não disponível.`);
      return false;
    }
    try {
      await navigator.clipboard.writeText(String(text));
      toast(`${label} copiado.`);
      return true;
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
      return true;
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
        || (filter === "prepared" && status === "prepared")
        || (filter === "sent" && status === "sent")
        || (filter === "closed" && ["closed", "unavailable"].includes(status));
      if (!statusOk) return false;
      if (!query) return true;
      return normalize([item.title, item.projectKey, item.risk, item.proposal].join(" ")).includes(query);
    }).sort((a, b) => {
      const order = { prepared: 3, ready: 2, candidate: 2, sent: 1, closed: 0, unavailable: 0 };
      const diff = (order[b._displayStatus] ?? 1) - (order[a._displayStatus] ?? 1);
      if (diff) return diff;
      return Number(b.fit || 0) - Number(a.fit || 0);
    });
  }

  function openExternal(url) {
    if (!url) return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = url;
  }

  function markPrepared(id) {
    const ids = preparedIds();
    ids.add(String(id));
    setJson(PREPARED_KEY, [...ids]);
  }

  function unmarkPrepared(id) {
    const ids = preparedIds();
    ids.delete(String(id));
    setJson(PREPARED_KEY, [...ids]);
  }

  function prepareAndOpen(item) {
    if (!item.proposal || item.price == null || item.days == null) {
      toast("Faltam proposta, valor ou prazo neste projeto.");
      return;
    }
    const target = payloadUrl(item);
    if (!target) {
      toast("Link do projeto inválido.");
      return;
    }
    markPrepared(item._id || itemId(item));
    render();
    toast("Projeto preparado. Execute o favorito CRS99 no formulário.");
    setTimeout(() => openExternal(target), 180);
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

      const target = bidUrl(item);
      const blocked = !target || ["closed", "unavailable"].includes(item._displayStatus);

      const prepare = $(".prepare-bid", node);
      if (blocked || item._displayStatus === "sent") {
        prepare.disabled = true;
        prepare.textContent = item._displayStatus === "sent" ? "Proposta já enviada" : (["closed", "unavailable"].includes(item._displayStatus) ? "Projeto indisponível" : "Link indisponível");
      } else {
        prepare.addEventListener("click", () => prepareAndOpen(item));
      }

      const open = $(".open-bid", node);
      if (blocked) {
        open.disabled = true;
        open.textContent = ["closed", "unavailable"].includes(item._displayStatus) ? "Projeto indisponível" : "Link indisponível";
      } else {
        open.addEventListener("click", () => openExternal(target));
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
        unmarkPrepared(item._id);
        toast("Marcado como enviado neste celular.");
        render();
      });

      const markUnprepared = $(".mark-unprepared", node);
      markUnprepared.classList.toggle("hidden", item._displayStatus !== "prepared");
      markUnprepared.addEventListener("click", () => {
        unmarkPrepared(item._id);
        toast("Marca de preparada removida.");
        render();
      });

      const remove = $(".remove-local", node);
      remove.classList.toggle("hidden", !item._local);
      remove.addEventListener("click", () => {
        const next = localItems().filter((x) => itemId(x) !== item._id);
        setJson(LOCAL_KEY, next);
        unmarkPrepared(item._id);
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
    const id = projectId(url) || `local-${Date.now()}`;
    return {
      localId: id,
      projectKey: id,
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

  function saveQuickItem(item) {
    const existing = localItems();
    const id = itemId(item);
    const next = [item, ...existing.filter((x) => itemId(x) !== id)];
    setJson(LOCAL_KEY, next);
  }

  function bookmarklet() {
    return `javascript:(()=>{const n=(v='')=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ').trim(),a=(s,r=document)=>[...r.querySelectorAll(s)],vis=e=>{if(!e)return false;const x=e.getBoundingClientRect(),s=getComputedStyle(e);return x.width>0&&x.height>0&&s.display!=='none'&&s.visibility!=='hidden'},ok=e=>e&&!e.disabled&&!e.readOnly&&!['hidden','submit','button','checkbox','radio','file'].includes(e.type||'')&&vis(e),ctx=e=>{const p=[e.name,e.id,e.placeholder,e.getAttribute('aria-label')].filter(Boolean);if(e.id){try{const l=document.querySelector('label[for="'+CSS.escape(e.id)+'"]');if(l)p.push(l.textContent||'')}catch{}}const d=e.closest('.form-group,.field,.control-group,.row,.input-group,div');if(d)p.push((d.innerText||'').slice(0,350));return n(p.join(' '))},best=(c,t,tag='')=>{const r=c.filter(ok).map(e=>{const z=ctx(e);let q=0;t.forEach((x,i)=>{if(z.includes(n(x)))q+=40-i});if(tag&&e.tagName===tag)q+=5;return{e,q}}).sort((x,y)=>y.q-x.q);return r[0]&&r[0].q>0?r[0].e:null},set=(e,v)=>{if(!e||v==null)return false;try{e.focus();const z=String(v);if(e.isContentEditable){e.textContent=z;e.dispatchEvent(new Event('input',{bubbles:true}))}else{const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,s=Object.getOwnPropertyDescriptor(p,'value')?.set;s?s.call(e,z):e.value=z;e.dispatchEvent(new Event('input',{bubbles:true}))}e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('blur',{bubbles:true}));return true}catch{return false}},msg=(m,c='#15803d')=>{let b=document.getElementById('crs99-mobile-banner');if(!b){b=document.createElement('div');b.id='crs99-mobile-banner';b.style='position:fixed;left:12px;right:12px;bottom:18px;z-index:2147483647;padding:14px 16px;border-radius:12px;color:#fff;font:700 14px/1.35 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45)';document.documentElement.appendChild(b)}b.style.background=c;b.textContent=m};try{const h=location.hash.match(/(?:^#|&)crs99=([^&]+)/);if(!h)return msg('CRS99: abra este formulário pelo botão “Preparar e abrir” do Mobile.','#b91c1c');const p=JSON.parse(decodeURIComponent(h[1])),id=(location.pathname.match(/\\/project\\/bid\\/(\\d{4,})/i)||[])[1];if(!id||String(id)!==String(p.id))return msg('CRS99 BLOQUEOU: o ID do formulário não corresponde ao projeto preparado.','#b91c1c');const body=n(document.body?.innerText||'');if(/melhorar proposta|editar proposta|cancelar proposta|voce ja enviou uma proposta/.test(body))return msg('CRS99: esta proposta já aparece como enviada.','#92400e');if(Date.now()-Number(p.ts||0)>30*60*1000)return msg('CRS99 BLOQUEOU: preparação antiga. Abra novamente pelo Mobile.','#b91c1c');const ta=[...a('textarea'),...a('[contenteditable="true"]')].filter(ok),pf=best(ta,['detalhes','proposta','mensagem','descricao','apresentacao'],'TEXTAREA')||(ta.length===1?ta[0]:null),ins=a('input'),vf=best(ins,['sua oferta','valor da proposta','oferta','preco','valor','r$']),df=best(ins,['duracao estimada','prazo','dias','entrega','tempo']);let c=0;if(pf&&set(pf,p.proposal))c++;if(vf&&set(vf,p.price))c++;if(df&&set(df,p.days))c++;if(c===3){history.replaceState(null,'',location.pathname+location.search);msg('CRS OK — proposta, valor e prazo preenchidos. Revise e toque em “Enviar proposta” manualmente.')}else msg('CRS encontrou '+c+'/3 campos. Não envie antes de revisar manualmente.','#b91c1c')}catch(e){msg('CRS99 encontrou um erro: '+String(e&&e.message||e),'#b91c1c')}})();`;
  }

  const bookmarkletCode = bookmarklet();
  refs.bookmarkletCode.value = bookmarkletCode;

  refs.setupBtn.addEventListener("click", () => {
    refs.setupPanel.classList.remove("hidden");
    refs.quickPanel.classList.add("hidden");
    refs.setupPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  refs.closeSetup.addEventListener("click", () => refs.setupPanel.classList.add("hidden"));
  refs.copyBookmarklet.addEventListener("click", () => copy(bookmarkletCode, "Ativador CRS99"));

  refs.quickBtn.addEventListener("click", () => {
    refs.quickPanel.classList.remove("hidden");
    refs.setupPanel.classList.add("hidden");
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
    saveQuickItem(item);
    toast("Proposta salva neste celular.");
    clearQuick();
    refs.quickPanel.classList.add("hidden");
    refs.filter.value = "active";
    render();
  });

  refs.openQuick.addEventListener("click", () => {
    const item = quickItem();
    if (!projectId(item.url)) {
      toast("Cole primeiro o link de um projeto do 99Freelas.");
      return;
    }
    if (!item.proposal || item.price == null || item.days == null) {
      toast("Preencha proposta, valor e prazo antes de preparar.");
      return;
    }
    saveQuickItem(item);
    prepareAndOpen(withLocalState(item));
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
