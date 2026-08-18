// ==UserScript==
// @name         CRS99 Projetos ao Vivo
// @namespace    https://crs-digital-factory.vercel.app/
// @version      1.0.1
// @description  Destaca os projetos mais alinhados na lista logada do 99Freelas. Não envia propostas.
// @match        https://www.99freelas.com.br/projects*
// @match        https://99freelas.com.br/projects*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// @downloadURL  https://raw.githubusercontent.com/cristiansembarski2-ship-it/crs-digital-factory/main/crs99-mobile/crs99-live-projects.user.js
// ==/UserScript==

(() => {
  'use strict';
  const norm = (v='') => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const idFrom = (href='') => (String(href).match(/\/project\/[^/]*?(\d{4,})(?:[/?#]|$)/i)||[])[1] || '';

  function score(text='') {
    const t = norm(text);
    if (/\b(video|videos|reels|ugc|capcut|gravacao|gravar|filmagem|camera|motion|after effects|premiere)\b/.test(t)) return {n:-999, tag:'VÍDEO — IGNORAR'};
    let n=0, tag='OUTRO';
    if (/\b(wordpress|elementor|woocommerce|landing page|landing pages|site|sites|loja virtual|pagina web|web design|blog)\b/.test(t)) { n+=100; tag='SITE'; }
    if (/\b(excel|planilha|planilhas|google sheets|sheets|dashboard|estoque|orcamento|custos|precificacao|financeir|csv|vba|power query|formulario)\b/.test(t)) { n+=98; tag = tag==='SITE' ? 'SITE + PLANILHA' : 'PLANILHA'; }
    if (/\b(automacao|automatizar|dados|data entry|digitacao|pesquisa|revisao|formatacao|traducao|seo|cadastro|python|javascript)\b/.test(t)) n+=50;
    if (/\b(canva|apresentacao|slides|cartilha|material institucional|design|copy|texto|conteudo)\b/.test(t)) n+=20;
    if (/\b(prospeccao|sdr|bdr|closer|trafego|social media|redes sociais|meta ads)\b/.test(t)) n-=45;
    if (/\b(django|multi-tenant|seguranca da informacao)\b/.test(t)) n-=35;
    const m=t.match(/propostas?\s*[:：]?\s*(\d+)/);
    if (m) { const p=Number(m[1]); if(p<=10)n+=20; else if(p<=30)n+=10; else if(p>=100)n-=25; else if(p>=60)n-=12; }
    if (/publicado\s*[:：]?\s*(1 hora|2 horas|3 horas|4 horas|5 horas|6 horas)/.test(t)) n+=8;
    return {n, tag:n>=90?`TOP • ${tag}`:n>=50?`BOA • ${tag}`:tag};
  }

  function cardOf(a) {
    let el=a;
    for(let i=0;i<7&&el;i++,el=el.parentElement){
      if (el.id === 'crs99-live-box') return a.parentElement;
      const t=norm(el.innerText||'');
      if(t.length>120&&(t.includes('propostas')||t.includes('publicado')||t.includes('cliente'))) return el;
    }
    return a.parentElement;
  }

  function collect(){
    const seen=new Set(), out=[];
    for(const a of document.querySelectorAll('a[href*="/project/"]')){
      if (a.closest('#crs99-live-box')) continue;
      const id=idFrom(a.href); if(!id||seen.has(id)) continue;
      const title=String(a.textContent||'').replace(/\s+/g,' ').trim(); if(title.length<8) continue;
      const card=cardOf(a), s=score(card?.innerText||title);
      seen.add(id); out.push({id,title,href:a.href,...s});
    }
    return out.sort((a,b)=>b.n-a.n);
  }

  let lastFingerprint='';
  function render(){
    const jobs=collect(); if(!jobs.length) return;
    const good=jobs.filter(j=>j.n>35).slice(0,10);
    const fingerprint=good.map(j=>`${j.id}:${j.n}`).join('|');
    if (fingerprint === lastFingerprint && document.getElementById('crs99-live-box')) return;
    lastFingerprint=fingerprint;

    let box=document.getElementById('crs99-live-box');
    if(!box){
      box=document.createElement('section'); box.id='crs99-live-box';
      box.style.cssText='margin:12px auto 16px;max-width:980px;padding:14px;border-radius:14px;background:#0b1220;color:#fff;font:14px/1.35 Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.22)';
      const host=document.querySelector('main')||document.body; host.insertBefore(box,host.firstChild);
    }
    box.innerHTML=`<strong>CRS99 • melhores projetos carregados agora</strong><div style="opacity:.75;margin-top:4px">${jobs.length} projetos lidos diretamente desta tela</div>`+
      good.map((j,i)=>`<a href="${j.href}" style="display:block;margin-top:8px;padding:10px;border-radius:10px;background:${i<3?'#16351f':'#172033'};color:#fff;text-decoration:none"><strong>${i+1}. ${j.title.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</strong><br><span style="opacity:.75">${j.tag}</span></a>`).join('');
  }

  let timer=0;
  const refresh=()=>{ clearTimeout(timer); timer=setTimeout(render,250); };
  const observer=new MutationObserver((mutations)=>{
    const relevant=mutations.some((m)=>{
      if (m.target?.nodeType===1 && m.target.closest?.('#crs99-live-box')) return false;
      return [...m.addedNodes].some((n)=>!(n.nodeType===1 && (n.id==='crs99-live-box' || n.closest?.('#crs99-live-box'))));
    });
    if (relevant) refresh();
  });

  refresh();
  observer.observe(document.body,{childList:true,subtree:true});
})();
