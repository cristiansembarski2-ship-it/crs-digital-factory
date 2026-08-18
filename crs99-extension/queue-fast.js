(() => {
  if (window.__CRS99_QUEUE_FAST__) return;
  window.__CRS99_QUEUE_FAST__ = true;

  const QUEUE_SCHEMA=3;
  const HIDDEN=new Set(["sent","sent_pending","closed","unavailable"]);
  const norm=(v="")=>String(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();

  function idFrom(value=""){
    let text=String(value||"");
    try{if(/^https?:/i.test(text))text=new URL(text).pathname;}catch{}
    text=text.replace(/[?#].*$/,"").replace(/\/+$/,"");
    let m=text.match(/\/project\/bid\/(\d{4,})(?:\/|$)/i);if(m)return m[1];
    m=text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i);if(m)return m[1];
    m=text.match(/\/p\/(\d{4,})(?:\/|$)/i);if(m)return m[1];
    m=text.match(/(?:^|[-/])(\d{4,})$/);return m?m[1]:"";
  }

  function validProjectHref(href=""){
    try{const p=new URL(href,location.origin).pathname.replace(/\/+$/,"");return /^\/project\/(?!new(?:\/|$)|bid(?:\/|$))[^/]*\d{4,}$/i.test(p);}catch{return false;}
  }

  function titleFromHref(href=""){
    try{const seg=decodeURIComponent(new URL(href,location.origin).pathname.split("/").filter(Boolean).pop()||"");const s=seg.replace(/-\d{4,}$/," ").replace(/[-_]+/g," ").replace(/\s+/g," ").trim();return s?s.charAt(0).toUpperCase()+s.slice(1):"Projeto 99Freelas";}catch{return"Projeto 99Freelas";}
  }

  function blockedSet(blocked={}){
    const set=new Set();
    for(const[k,v]of Object.entries(blocked))if(HIDDEN.has(v?.status)){const id=idFrom(k||v?.url||v?.projectId);if(id)set.add(id);}
    return set;
  }

  async function ensureSchema(){
    const d=await chrome.storage.local.get(["crs99QueueSchema"]);
    if(d.crs99QueueSchema===QUEUE_SCHEMA)return;
    await chrome.storage.local.set({crs99QueueSchema:QUEUE_SCHEMA,crs99ActiveQueue:[]});
  }

  async function mark(id,status,reason,url=location.href){
    if(!id)return;
    const d=await chrome.storage.local.get(["crs99BlockedProjects","crs99ActiveQueue","crs99History"]);
    const blocked=d.crs99BlockedProjects||{},now=new Date().toISOString();
    blocked[id]={...(blocked[id]||{}),projectId:id,status,reason,url,seenAt:now,...(status==="sent"?{sentAt:blocked[id]?.sentAt||now}:{})};
    const q=(Array.isArray(d.crs99ActiveQueue)?d.crs99ActiveQueue:[]).filter(x=>idFrom(x.key||x.href||x.url)!==id);
    const history=Array.isArray(d.crs99History)?d.crs99History:[],old=history.find(x=>idFrom(x.projectId||x.projectKey||x.url)===id)||{};
    const entry={...old,projectId:id,projectKey:id,status,...(status==="sent"?{sentAt:old.sentAt||now}:{})};
    await chrome.storage.local.set({crs99BlockedProjects:blocked,crs99ActiveQueue:q,crs99History:[entry,...history.filter(x=>idFrom(x.projectId||x.projectKey||x.url)!==id)].slice(0,400)});
  }

  function statusFrom(text=""){
    const n=norm(text);
    if(["melhorar proposta","voce ja enviou uma proposta","voce enviou uma proposta","sua proposta foi enviada","editar sua proposta","editar proposta","retirar proposta","enviada pelo sistema","enviei uma proposta","detalhes da proposta"].some(t=>n.includes(t)))return"sent";
    if(["projeto fechado","projeto encerrado","projeto em andamento","projeto concluido","projeto finalizado","projeto cancelado","nao esta recebendo propostas","nao aceita mais propostas"].some(t=>n.includes(t)))return"closed";
    return"";
  }

  async function reconcileCurrent(){
    const id=idFrom(location.pathname);if(!id)return;
    const status=statusFrom(document.body?.innerText||"");
    if(status)await mark(id,status,"current-page");
  }

  const style=document.createElement("style");
  style.textContent=`#crs99-fastq{position:fixed;right:16px;bottom:16px;width:330px;max-height:70vh;z-index:2147483646;background:#101827;color:#fff;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.32);overflow:hidden;font-family:Arial,sans-serif}#crs99-fastq *{box-sizing:border-box}#crs99-fastq .h{display:flex;justify-content:space-between;align-items:center;padding:10px 11px;font-weight:800;border-bottom:1px solid rgba(255,255,255,.12)}#crs99-fastq .c{font-size:12px;opacity:.8}#crs99-fastq .l{padding:7px;overflow:auto;max-height:54vh}#crs99-fastq .go{width:100%;margin:0 0 6px;padding:9px 10px;border:0;border-radius:8px;background:#13a8e3;color:#fff;font-weight:800;font-size:12px;text-align:left;cursor:pointer}#crs99-fastq .r{width:calc(100% - 14px);margin:0 7px 7px;padding:8px;border:0;border-radius:8px;background:#edf2f7;color:#1f2937;font-weight:800;cursor:pointer}#crs99-fastq .e{padding:14px;text-align:center;font-size:12px;opacity:.75}`;
  document.documentElement.appendChild(style);
  const panel=document.createElement("aside");panel.id="crs99-fastq";panel.innerHTML='<div class="h"><span>CRS — Próximas</span><span class="c">0 novas</span></div><div class="l"></div><button class="r" type="button">Atualizar</button>';document.documentElement.appendChild(panel);
  const list=panel.querySelector(".l"),count=panel.querySelector(".c"),refresh=panel.querySelector(".r");

  async function getQueue(){
    await ensureSchema();
    const d=await chrome.storage.local.get(["crs99ActiveQueue","crs99BlockedProjects"]),blocked=blockedSet(d.crs99BlockedProjects||{}),map=new Map();
    for(const item of(Array.isArray(d.crs99ActiveQueue)?d.crs99ActiveQueue:[])){
      const id=idFrom(item.key||item.href||item.url);if(!id||blocked.has(id)||!validProjectHref(item.href)||idFrom(item.href)!==id)continue;
      const next={...item,key:id,projectId:id,title:titleFromHref(item.href)},prev=map.get(id);
      if(!prev||Number(next.score||0)>=Number(prev.score||0))map.set(id,next);
    }
    return[...map.values()].sort((a,b)=>Number(b.score||0)-Number(a.score||0)||(a.proposals??999)-(b.proposals??999));
  }

  async function render(){
    const q=await getQueue();count.textContent=`${q.length} novas`;list.innerHTML="";
    if(!q.length){list.innerHTML='<div class="e">Sem novas na fila.</div>';return;}
    q.slice(0,15).forEach((item,i)=>{
      const id=idFrom(item.href);if(!id||id!==String(item.key))return;
      const b=document.createElement("button");b.type="button";b.className="go";const t=titleFromHref(item.href);b.textContent=`${i+1}. Enviar — ${t.length>58?t.slice(0,55)+"…":t}`;b.title=`Projeto ${id}: ${t}`;
      b.addEventListener("click",async()=>{if(idFrom(item.href)!==id)return;await chrome.storage.local.set({crs99TargetProjectId:id,crs99TargetHref:item.href,crs99TargetAt:new Date().toISOString()});const u=new URL(item.href,location.origin);u.searchParams.set("crs99","prepare");u.searchParams.set("crs99id",id);location.href=u.href;});list.appendChild(b);
    });
  }

  function parseProjects(html,base){
    const doc=new DOMParser().parseFromString(html,"text/html"),out=[],seen=new Set();
    for(const a of[...doc.querySelectorAll('a[href*="/project/"]')]){
      let href;try{href=new URL(a.getAttribute("href")||a.href,base).href.split("#")[0];}catch{continue;}
      if(!validProjectHref(href))continue;
      const id=idFrom(href);if(!id||seen.has(id))continue;
      const card=a.closest("article,li,.project,.project-item,.media,.card,.list-group-item,.box")||a.parentElement?.parentElement||a.parentElement,text=(card?.textContent||a.textContent||"").replace(/\s+/g," ").trim();
      if(text.length<20)continue;
      const st=statusFrom(text);if(st){seen.add(id);continue;}
      let score=3.5;for(const term of["excel","planilha","google sheets","dados","pesquisa","site","landing","wordpress","canva","word","pdf","revisao","copy","roteiro","seo","python","script","api","traducao","video","reels","cadastro"])if(norm(text).includes(term))score+=.5;
      const pm=norm(text).match(/propostas?:\s*(\d+)/),proposals=pm?Number(pm[1]):null;if(proposals!=null&&proposals<=10)score+=1;
      out.push({key:id,projectId:id,href,title:titleFromHref(href),score:Math.min(10,score),proposals,discoveredAt:new Date().toISOString(),seenAt:new Date().toISOString()});seen.add(id);
    }
    return out;
  }

  async function refreshListAndCleanup(){
    refresh.disabled=true;refresh.textContent="Atualizando…";
    try{
      await ensureSchema();
      const source="https://www.99freelas.com.br/projects",res=await fetch(source,{credentials:"include",cache:"no-store"});
      if(res.ok){
        const found=parseProjects(await res.text(),location.origin),d=await chrome.storage.local.get(["crs99BlockedProjects"]),blocked=blockedSet(d.crs99BlockedProjects||{}),fresh=[];
        for(const x of found)if(!blocked.has(x.key)&&idFrom(x.href)===x.key)fresh.push(x);
        await chrome.storage.local.set({crs99ActiveQueue:fresh.slice(0,80),crs99SourceUrl:source,crs99LastScanAt:new Date().toISOString()});
      }

      const q=(await getQueue()).slice(0,40);let idx=0;
      async function worker(){
        while(idx<q.length){
          const item=q[idx++],id=idFrom(item.href);if(!id)continue;
          try{
            const r=await fetch(item.href,{credentials:"include",cache:"no-store",redirect:"follow"});
            if(r.ok){const status=statusFrom(await r.text());if(status){await mark(id,status,"manual-project-check",item.href);continue;}}
            const conv=await fetch(`https://www.99freelas.com.br/p/${id}`,{credentials:"include",cache:"no-store",redirect:"follow"});
            if(conv.ok){const status=statusFrom(await conv.text());if(status==="sent")await mark(id,"sent","manual-conversation-check",conv.url);}
          }catch{}
        }
      }
      await Promise.all(Array.from({length:Math.min(6,q.length)},()=>worker()));
      await reconcileCurrent();await render();
    }finally{refresh.disabled=false;refresh.textContent="Atualizar";}
  }

  function isSendControl(el){const t=norm(el?.textContent||el?.value||"");return t.includes("enviar proposta")||t.includes("fazer proposta");}
  document.addEventListener("click",e=>{const el=e.target instanceof Element?e.target.closest('button,input[type="submit"],input[type="button"],a'):null;if(!el||!isSendControl(el)||!/\/project\/bid\//i.test(location.pathname))return;const id=idFrom(location.pathname);mark(id,"sent_pending","human-send-click").then(render).catch(()=>{});},true);
  document.addEventListener("submit",()=>{if(!/\/project\/bid\//i.test(location.pathname))return;const id=idFrom(location.pathname);mark(id,"sent_pending","human-form-submit").then(render).catch(()=>{});},true);

  refresh.addEventListener("click",()=>refreshListAndCleanup().catch(()=>render()));
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==="local"&&(changes.crs99ActiveQueue||changes.crs99BlockedProjects))render().catch(()=>{});});
  ensureSchema().then(()=>reconcileCurrent()).then(render).catch(()=>render());
  setTimeout(()=>reconcileCurrent().then(render).catch(()=>{}),1200);
})();