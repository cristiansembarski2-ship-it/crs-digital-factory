(() => {
  if (window.__CRS99_SCANNER_FAST__) return;
  window.__CRS99_SCANNER_FAST__ = true;

  const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
  function idFrom(value="") { let text=String(value||""); try{if(/^https?:/i.test(text))text=new URL(text).pathname;}catch{} text=text.replace(/[?#].*$/,"").replace(/\/+$/,""); let m=text.match(/\/project\/[^/]*?(\d{4,})(?:\/|$)/i); if(m)return m[1]; m=text.match(/(?:^|[-/])(\d{4,})$/); return m?m[1]:""; }
  function blockedSet(blocked={}) { const s=new Set(); for(const [k,v] of Object.entries(blocked)) if(["sent","sent_pending","closed","unavailable"].includes(v?.status)){const id=idFrom(k||v?.url);if(id)s.add(id);} return s; }
  function cardFor(a){return a.closest("article,li,.project,.project-item,.media,.card,.list-group-item,.box")||a.parentElement?.parentElement||a.parentElement;}
  function score(text){const n=norm(text);let s=3.6;for(const t of ["excel","planilha","google sheets","csv","dashboard","automacao","pesquisa","dados","cadastro","site","landing page","wordpress","canva","word","pdf","revisao","copy","vsl","roteiro","seo","python","script","api","traducao","video","reels","candidatura"])if(n.includes(t))s+=.55;const m=n.match(/propostas?:\s*(\d+)/);const p=m?Number(m[1]):null;if(p!=null){if(p<=3)s+=2;else if(p<=10)s+=1.2;else if(p>60)s-=1;}if(/publicado hoje|publicada hoje|ha \d+ minutos|há \d+ minutos/.test(n))s+=.7;return{score:Math.max(2,Math.min(10,Math.round(s*10)/10)),proposals:p};}

  async function scan(){
    const d=await chrome.storage.local.get(["crs99ActiveQueue","crs99BlockedProjects"]);const blocked=blockedSet(d.crs99BlockedProjects||{}),map=new Map();
    for(const x of (Array.isArray(d.crs99ActiveQueue)?d.crs99ActiveQueue:[])){const id=idFrom(x.key||x.href);if(id&&!blocked.has(id))map.set(id,{...x,key:id,projectId:id});}
    const seen=new Set();
    for(const a of [...document.querySelectorAll('a[href*="/project/"]')]){
      let href;try{href=new URL(a.href||a.getAttribute("href"),location.origin).href.split("#")[0];}catch{continue;}
      if(/\/project\/(?:new|bid)(?:\/|$)/i.test(new URL(href).pathname))continue;
      const id=idFrom(href);if(!id||blocked.has(id)||seen.has(id))continue;
      const title=(a.textContent||"").trim().replace(/\s+/g," ");if(title.length<4)continue;
      const card=cardFor(a);const text=(card?.innerText||title).replace(/\s+/g," ").trim();if(text.length<20)continue;
      const n=norm(text);if(["projeto fechado","projeto encerrado","projeto em andamento","concluido","cancelado"].some(t=>n.includes(t)))continue;
      const sc=score(text);map.set(id,{...(map.get(id)||{}),key:id,projectId:id,href,title,score:sc.score,proposals:sc.proposals,discoveredAt:map.get(id)?.discoveredAt||new Date().toISOString(),seenAt:new Date().toISOString()});seen.add(id);
    }
    const queue=[...map.values()].sort((a,b)=>Number(b.score||0)-Number(a.score||0)||(a.proposals??999)-(b.proposals??999)).slice(0,80);
    await chrome.storage.local.set({crs99ActiveQueue:queue,crs99SourceUrl:"https://www.99freelas.com.br/projects",crs99LastScanAt:new Date().toISOString()});
  }

  let timer; const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>scan().catch(()=>{}),450);};
  setTimeout(()=>scan().catch(()=>{}),120);
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("pageshow",schedule);
})();