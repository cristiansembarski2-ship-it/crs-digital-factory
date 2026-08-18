(() => {
  if (window.__CRS99_MOBILE_ROUTE_FIX__) return;
  window.__CRS99_MOBILE_ROUTE_FIX__ = true;

  const QUEUE_URL = "/crs99/opportunities.json";
  const LOCAL_KEY = "crs99MobileLocalV1";
  const PREPARED_KEY = "crs99MobilePreparedV1";

  const normalize = (value = "") => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  function projectId(value = "") {
    let text = String(value || "");
    try { if (/^https?:/i.test(text)) text = new URL(text).pathname; } catch {}
    text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");
    let m = text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);
    if (m) return m[1];
    m = text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);
    if (m) return m[1];
    m = text.match(/(?:^|[-/])(\d{4,})$/);
    return m ? m[1] : "";
  }

  function getJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function markPrepared(id) {
    const ids = new Set(getJson(PREPARED_KEY, []));
    ids.add(String(id));
    localStorage.setItem(PREPARED_KEY, JSON.stringify([...ids]));
  }

  function flash(message, bad = false) {
    let box = document.getElementById("crs99-route-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "crs99-route-toast";
      box.style.cssText = "position:fixed;left:50%;bottom:24px;z-index:2147483647;transform:translateX(-50%);width:min(92vw,500px);padding:12px 15px;border-radius:14px;font:800 13px/1.35 system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.35)";
      document.documentElement.appendChild(box);
    }
    box.style.background = bad ? "#fee2e2" : "#e9fdf4";
    box.style.color = bad ? "#7f1d1d" : "#08261a";
    box.textContent = message;
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.remove(), 2600);
  }

  function cardData(card) {
    const id = String(card?.dataset?.projectId || "").trim();
    const title = card?.querySelector(".job-title")?.textContent?.trim() || "Projeto";
    const preview = card?.querySelector(".proposal-preview")?.textContent?.trim() || "";
    const priceText = card?.querySelector(".job-price")?.textContent || "";
    const daysText = card?.querySelector(".job-days")?.textContent || "";
    const priceMatch = priceText.replace(/\./g, "").replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
    const daysMatch = daysText.match(/(\d+)/);
    const price = priceMatch ? Number(priceMatch[1]) : "";
    const days = daysMatch ? Number(daysMatch[1]) : "";
    const proposal = normalize(preview).includes("sem texto de proposta salvo") ? "" : preview;
    return { id, title, proposal, price, days };
  }

  function localUrl(id) {
    const locals = getJson(LOCAL_KEY, []);
    const item = locals.find((x) => projectId(x.url || x.projectKey || x.localId) === String(id));
    return item?.url || "";
  }

  async function remoteUrl(id) {
    try {
      const res = await fetch(`${QUEUE_URL}?route=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return "";
      const data = await res.json();
      const item = (data.opportunities || []).find((x) => projectId(x.url || x.projectKey) === String(id));
      return item?.url || "";
    } catch { return ""; }
  }

  function slugify(text = "") {
    return normalize(text)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
  }

  async function exactProjectUrl(data) {
    let url = localUrl(data.id) || await remoteUrl(data.id);
    if (!url) url = `https://www.99freelas.com.br/project/${slugify(data.title)}-${data.id}`;
    try {
      const u = new URL(url, "https://www.99freelas.com.br");
      u.hash = "";
      return u.href;
    } catch { return ""; }
  }

  function payloadHash(data) {
    if (!/^\d{4,}$/.test(data.id) || !data.proposal || data.price === "" || data.days === "") return "";
    const payload = { v: 2, id: data.id, title: data.title, price: data.price, days: data.days, proposal: data.proposal, ts: Date.now() };
    return `#crs99=${encodeURIComponent(JSON.stringify(payload))}`;
  }

  function updatedBookmarklet() {
    return `javascript:(async()=>{const n=(v='')=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ').trim(),a=(s,r=document)=>[...r.querySelectorAll(s)],vis=e=>{if(!e)return false;const x=e.getBoundingClientRect(),s=getComputedStyle(e);return x.width>0&&x.height>0&&s.display!=='none'&&s.visibility!=='hidden'},ok=e=>e&&!e.disabled&&!e.readOnly&&!['hidden','submit','button','checkbox','radio','file'].includes(e.type||'')&&vis(e),ctx=e=>{const p=[e.name,e.id,e.placeholder,e.getAttribute('aria-label')].filter(Boolean);if(e.id){try{const l=document.querySelector('label[for="'+CSS.escape(e.id)+'"]');if(l)p.push(l.textContent||'')}catch{}}const d=e.closest('.form-group,.field,.control-group,.row,.input-group,.modal,form,div');if(d)p.push((d.innerText||'').slice(0,450));return n(p.join(' '))},best=(c,t,tag='')=>{const r=c.filter(ok).map(e=>{const z=ctx(e);let q=0;t.forEach((x,i)=>{if(z.includes(n(x)))q+=50-i});if(tag&&e.tagName===tag)q+=5;return{e,q}}).sort((x,y)=>y.q-x.q);return r[0]&&r[0].q>0?r[0].e:null},set=(e,v)=>{if(!e||v==null)return false;try{e.focus();const z=String(v);if(e.isContentEditable){e.textContent=z;e.dispatchEvent(new Event('input',{bubbles:true}))}else{const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,s=Object.getOwnPropertyDescriptor(p,'value')?.set;s?s.call(e,z):e.value=z;e.dispatchEvent(new Event('input',{bubbles:true}))}e.dispatchEvent(new Event('change',{bubbles:true}));return true}catch{return false}},msg=(m,c='#15803d')=>{let b=document.getElementById('crs99-mobile-banner');if(!b){b=document.createElement('div');b.id='crs99-mobile-banner';b.style='position:fixed;left:12px;right:12px;bottom:18px;z-index:2147483647;padding:14px 16px;border-radius:12px;color:#fff;font:700 14px/1.35 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45)';document.documentElement.appendChild(b)}b.style.background=c;b.textContent=m},sleep=ms=>new Promise(r=>setTimeout(r,ms));try{const h=location.hash.match(/(?:^#|&)crs99=([^&]+)/);if(!h)return msg('CRS99: abra o projeto pelo botão “Preparar e abrir” do Mobile.','#b91c1c');const p=JSON.parse(decodeURIComponent(h[1])),path=location.pathname.replace(/\\/+$/,''),m1=path.match(/\\/project\\/bid\\/(\\d{4,})$/i),m2=path.match(/\\/project\\/[^/]*?(\\d{4,})$/i),id=(m1||m2||[])[1];if(!id||String(id)!==String(p.id))return msg('CRS99 BLOQUEOU: o ID desta página não corresponde ao projeto preparado.','#b91c1c');if(Date.now()-Number(p.ts||0)>30*60*1000)return msg('CRS99 BLOQUEOU: preparação antiga. Abra novamente pelo Mobile.','#b91c1c');const body=n(document.body?.innerText||'');if(/melhorar proposta|editar proposta|cancelar proposta|voce ja enviou uma proposta/.test(body))return msg('CRS99: esta proposta já aparece como enviada.','#92400e');const tryFill=()=>{const ta=[...a('textarea'),...a('[contenteditable="true"]')].filter(ok),pf=best(ta,['detalhes da proposta','detalhes','proposta','mensagem','descricao','apresentacao'],'TEXTAREA')||(ta.length===1?ta[0]:null),ins=a('input'),vf=best(ins,['sua oferta','valor da proposta','oferta','preco','valor','r$']),df=best(ins,['duracao estimada','duracao','prazo','dias','entrega','tempo']);let c=0;if(pf&&set(pf,p.proposal))c++;if(vf&&set(vf,p.price))c++;if(df&&set(df,p.days))c++;return c};let c=tryFill();if(c<3){const acts=a('button,a,input[type="button"],input[type="submit"]').filter(vis),act=acts.find(e=>{const t=n(e.textContent||e.value||'');return t==='enviar proposta'||t==='fazer proposta'||t.includes('enviar proposta')});if(!act){if(/\\bfechado\\b|\\bcancelado\\b|nao aceita novas propostas/.test(body))return msg('CRS99: este projeto não está aceitando novas propostas.','#92400e');return msg('CRS99 não encontrou o botão de proposta nesta página.','#b91c1c')}if(act.tagName==='A'&&act.href&&!act.href.startsWith('javascript:')){try{const u=new URL(act.href,location.href);if(u.pathname!==location.pathname){u.hash=location.hash;location.href=u.href;return}}catch{}}act.click();for(let i=0;i<25&&c<3;i++){await sleep(180);c=tryFill()}}if(c===3){history.replaceState(null,'',location.pathname+location.search);msg('CRS OK — proposta, valor e prazo preenchidos. Revise e toque em “Enviar proposta” manualmente.')}else msg('CRS encontrou '+c+'/3 campos. Não envie antes de revisar manualmente.','#b91c1c')}catch(e){msg('CRS99 encontrou um erro: '+String(e&&e.message||e),'#b91c1c')}})();`;
  }

  const BOOKMARKLET_V3 = updatedBookmarklet();
  const codeBox = document.getElementById("bookmarkletCode");
  if (codeBox) codeBox.value = BOOKMARKLET_V3;

  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    if (!target) return;

    if (target.id === "copyBookmarkletBtn") {
      event.preventDefault();
      event.stopImmediatePropagation();
      try { await navigator.clipboard.writeText(BOOKMARKLET_V3); }
      catch {
        const area = document.createElement("textarea");
        area.value = BOOKMARKLET_V3;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      flash("Ativador CRS99 atualizado e copiado.");
      return;
    }

    const card = target.closest("article.job");
    if (!card) return;
    if (!target.classList.contains("prepare-bid") && !target.classList.contains("open-bid")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const data = cardData(card);
    const base = await exactProjectUrl(data);
    if (!base) {
      flash("Não consegui localizar o endereço real deste projeto.", true);
      return;
    }

    if (target.classList.contains("open-bid")) {
      window.location.href = base;
      return;
    }

    const hash = payloadHash(data);
    if (!hash) {
      flash("Faltam proposta, valor ou prazo neste projeto.", true);
      return;
    }

    markPrepared(data.id);
    flash("Abrindo a página real do projeto…");
    setTimeout(() => { window.location.href = `${base}${hash}`; }, 120);
  }, true);
})();
