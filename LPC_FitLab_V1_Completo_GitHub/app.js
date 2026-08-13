(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const els = {
    fileInput:$('fileInput'), fileMeta:$('fileMeta'), frameW:$('frameW'), frameH:$('frameH'),
    autoGrid:$('autoGrid'), applyGrid:$('applyGrid'), suggestions:$('gridSuggestions'),
    sheet:$('sheetCanvas'), frame:$('frameCanvas'), anim:$('animCanvas'), placeholder:$('canvasPlaceholder'),
    showGrid:$('showGrid'), sheetInfo:$('sheetInfo'), diag:$('diagnosticList'), score:$('scoreBadge'),
    animStart:$('animStart'), animCount:$('animCount'), animFps:$('animFps'), animName:$('animName'),
    exportJson:$('exportJson'), exportTres:$('exportTres'), proInterest:$('proInterest'), proThanks:$('proThanks')
  };
  const sctx = els.sheet.getContext('2d', {willReadFrequently:true});
  const fctx = els.frame.getContext('2d');
  const actx = els.anim.getContext('2d');
  let img=null, sourceName='', selectedFrame=0, analysis=null, animTimer=null, metrics=loadMetrics();

  function track(name){ metrics[name]=(metrics[name]||0)+1; localStorage.setItem('crs_fitlab_metrics',JSON.stringify(metrics)); window.dispatchEvent(new CustomEvent('crs:metric',{detail:{product_id:'lpc-fitlab',event:name}})); }
  function loadMetrics(){ try{return JSON.parse(localStorage.getItem('crs_fitlab_metrics'))||{}}catch{return{}} }
  track('landing_view');

  function loadImageFromBlob(blob,name='sprite.png'){
    if(!blob || blob.type!=='image/png'){ alert('Use um arquivo PNG.'); return; }
    if(blob.size>20*1024*1024){ alert('Limite da V1: 20 MB.'); return; }
    const url=URL.createObjectURL(blob), im=new Image();
    im.onload=()=>{ URL.revokeObjectURL(url); img=im; sourceName=name; selectedFrame=0; els.placeholder.style.display='none'; track('tool_start'); suggestAndApply(); };
    im.onerror=()=>{URL.revokeObjectURL(url);alert('Não foi possível abrir o PNG.');};
    im.src=url;
  }

  els.fileInput.addEventListener('change',e=>{const f=e.target.files[0]; if(f) loadImageFromBlob(f,f.name)});
  const dz=$('canvasDropZone');
  ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')}));
  dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0]; if(f) loadImageFromBlob(f,f.name)});

  function makeDemo(){
    const fw=64,fh=64,cols=8,rows=4,c=document.createElement('canvas'); c.width=fw*cols;c.height=fh*rows; const x=c.getContext('2d');
    for(let r=0;r<rows;r++) for(let col=0;col<cols;col++){
      if(r===3&&col===7) continue;
      const ox=col*fw,oy=r*fh,shift=(col%4)-1.5;
      x.fillStyle=`hsl(${(r*80+col*8)%360} 70% 62%)`; x.fillRect(ox+26+shift,oy+20,12,22);
      x.fillStyle='#f1c9a5'; x.fillRect(ox+27+shift,oy+10,10,10);
      x.fillStyle='#0f172a'; x.fillRect(ox+25+shift,oy+42,5,13);x.fillRect(ox+35+shift,oy+42,5,13);
      x.fillStyle='#e2e8f0'; x.fillRect(ox+22+shift,oy+22,4,16);x.fillRect(ox+38+shift,oy+22,4,16);
    }
    c.toBlob(b=>loadImageFromBlob(b,'demo_lpc_sintetica.png'),'image/png');
  }
  $('loadDemo').addEventListener('click',makeDemo); $('loadDemoTop').addEventListener('click',()=>{location.hash='tool';makeDemo()});
  $('resetAll').addEventListener('click',()=>{stopAnim();img=null;analysis=null;sctx.clearRect(0,0,els.sheet.width,els.sheet.height);fctx.clearRect(0,0,160,160);actx.clearRect(0,0,160,160);els.placeholder.style.display='block';els.fileMeta.textContent='Nenhum arquivo carregado.';els.fileMeta.className='meta empty';els.diag.innerHTML='<p>O diagnóstico aparecerá após o carregamento.</p>';els.sheetInfo.textContent='Aguardando arquivo';els.exportJson.disabled=els.exportTres.disabled=true;els.score.textContent='—';els.score.className='badge'});

  function candidateGrids(){
    if(!img) return [];
    const sizes=[16,24,32,40,48,64,72,80,96,128,192,256], out=[];
    for(const w of sizes) for(const h of sizes){ if(img.width%w===0&&img.height%h===0){ const cells=(img.width/w)*(img.height/h); if(cells>=4&&cells<=1024) out.push({w,h,cells,score:(w===64?4:0)+(h===64?4:0)+(w===h?2:0)-Math.abs(Math.log2(w/h))}); } }
    return out.sort((a,b)=>b.score-a.score||a.cells-b.cells).slice(0,8);
  }
  function showSuggestions(){
    const cs=candidateGrids(); els.suggestions.innerHTML='';
    cs.forEach(c=>{const b=document.createElement('button');b.textContent=`${c.w}×${c.h} • ${c.cells} frames`;b.onclick=()=>{els.frameW.value=c.w;els.frameH.value=c.h;applyGrid()};els.suggestions.appendChild(b)});
    return cs;
  }
  function suggestAndApply(){
    const cs=showSuggestions(); if(cs.length){els.frameW.value=cs[0].w;els.frameH.value=cs[0].h;} else {els.frameW.value=64;els.frameH.value=64;} applyGrid();
  }
  els.autoGrid.addEventListener('click',showSuggestions); els.applyGrid.addEventListener('click',applyGrid); els.showGrid.addEventListener('change',drawSheet);

  function applyGrid(){
    if(!img) return;
    const fw=+els.frameW.value,fh=+els.frameH.value;
    if(!Number.isFinite(fw)||!Number.isFinite(fh)||fw<8||fh<8){alert('Informe dimensões válidas para o frame.');return;}
    analysis=analyze(fw,fh); drawSheet(); renderDiagnostics(); drawSelectedFrame(); els.exportJson.disabled=els.exportTres.disabled=false; track('value_completed');
  }

  function analyze(fw,fh){
    const divisible=img.width%fw===0&&img.height%fh===0, cols=Math.floor(img.width/fw),rows=Math.floor(img.height/fh),total=cols*rows;
    const tmp=document.createElement('canvas');tmp.width=img.width;tmp.height=img.height;const ctx=tmp.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const frames=[]; let transparentPixels=0,totalPixels=0;
    for(let i=0;i<total;i++){
      const cx=i%cols,cy=Math.floor(i/cols),data=ctx.getImageData(cx*fw,cy*fh,fw,fh).data; let minX=fw,minY=fh,maxX=-1,maxY=-1,nonzero=0;
      for(let p=0;p<data.length;p+=4){const a=data[p+3];totalPixels++;if(a<8)transparentPixels++;if(a>8){nonzero++;const px=(p/4)%fw,py=Math.floor((p/4)/fw);if(px<minX)minX=px;if(px>maxX)maxX=px;if(py<minY)minY=py;if(py>maxY)maxY=py;}}
      const empty=nonzero===0,bbox=empty?null:{minX,minY,maxX,maxY,w:maxX-minX+1,h:maxY-minY+1,cx:(minX+maxX)/2,cy:(minY+maxY)/2}; frames.push({index:i,col:cx,row:cy,empty,nonzero,bbox});
    }
    const nonEmpty=frames.filter(f=>!f.empty), centers=nonEmpty.map(f=>f.bbox.cx), avg=centers.length?centers.reduce((a,b)=>a+b,0)/centers.length:fw/2;
    const deviations=centers.map(v=>Math.abs(v-avg)), maxDev=deviations.length?Math.max(...deviations):0;
    return {fw,fh,cols,rows,total,divisible,frames,empty:frames.filter(f=>f.empty).map(f=>f.index),alphaRatio:totalPixels?transparentPixels/totalPixels:0,centerAverage:+avg.toFixed(2),maxCenterDeviation:+maxDev.toFixed(2)};
  }

  function drawSheet(){
    if(!img||!analysis)return; const maxW=980,maxH=650,scale=Math.min(maxW/img.width,maxH/img.height,1); els.sheet.width=Math.max(1,Math.round(img.width*scale));els.sheet.height=Math.max(1,Math.round(img.height*scale));sctx.imageSmoothingEnabled=false;sctx.clearRect(0,0,els.sheet.width,els.sheet.height);sctx.drawImage(img,0,0,els.sheet.width,els.sheet.height);
    if(els.showGrid.checked){sctx.strokeStyle='rgba(125,211,252,.7)';sctx.lineWidth=1;const sw=analysis.fw*scale,sh=analysis.fh*scale;for(let x=0;x<=els.sheet.width;x+=sw){sctx.beginPath();sctx.moveTo(x,0);sctx.lineTo(x,els.sheet.height);sctx.stroke()}for(let y=0;y<=els.sheet.height;y+=sh){sctx.beginPath();sctx.moveTo(0,y);sctx.lineTo(els.sheet.width,y);sctx.stroke()}sctx.strokeStyle='#fbbf24';sctx.lineWidth=2;const col=selectedFrame%analysis.cols,row=Math.floor(selectedFrame/analysis.cols);sctx.strokeRect(col*sw+1,row*sh+1,sw-2,sh-2)}
    els.sheetInfo.textContent=`${img.width}×${img.height}px • ${analysis.cols}×${analysis.rows} células • ${analysis.total} frames`;
    els.fileMeta.textContent=`${sourceName} • ${img.width}×${img.height}px • grade ${analysis.fw}×${analysis.fh}`;els.fileMeta.className='meta';
  }

  els.sheet.addEventListener('click',e=>{if(!analysis)return;const r=els.sheet.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*els.sheet.width,y=(e.clientY-r.top)/r.height*els.sheet.height;const col=Math.min(analysis.cols-1,Math.floor(x/(els.sheet.width/analysis.cols))),row=Math.min(analysis.rows-1,Math.floor(y/(els.sheet.height/analysis.rows)));selectedFrame=row*analysis.cols+col;drawSheet();drawSelectedFrame();});

  function drawFrameTo(ctx,index){
    if(!img||!analysis)return;ctx.clearRect(0,0,160,160);const col=index%analysis.cols,row=Math.floor(index/analysis.cols),scale=Math.min(150/analysis.fw,150/analysis.fh),dw=analysis.fw*scale,dh=analysis.fh*scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,col*analysis.fw,row*analysis.fh,analysis.fw,analysis.fh,(160-dw)/2,(160-dh)/2,dw,dh);
  }
  function drawSelectedFrame(){drawFrameTo(fctx,Math.min(selectedFrame,analysis.total-1))}

  function renderDiagnostics(){
    const a=analysis, items=[]; let score=100;
    if(a.divisible) items.push(['good','Grade fecha exatamente no PNG.',`${a.cols} colunas × ${a.rows} linhas.`]); else {items.push(['bad','A grade não divide o PNG exatamente.','Há sobra de pixels; ajuste o tamanho do frame.']);score-=45;}
    if(a.empty.length===0) items.push(['good','Nenhum frame totalmente transparente.','']); else {items.push(['warn',`${a.empty.length} frame(s) totalmente transparente(s).`,`Índices: ${a.empty.slice(0,24).join(', ')}${a.empty.length>24?'…':''}`]);score-=Math.min(25,a.empty.length*3);}
    if(a.maxCenterDeviation<=Math.max(2,a.fw*.06)) items.push(['good','Centro visual horizontal relativamente consistente.',`Desvio máx. aproximado: ${a.maxCenterDeviation}px.`]); else {items.push(['warn','Há variação perceptível no centro visual entre frames.',`Desvio máx. aproximado: ${a.maxCenterDeviation}px. Pode ser animação legítima ou desalinhamento.`]);score-=15;}
    if(a.alphaRatio>.1) items.push(['good','Transparência detectada.',`${Math.round(a.alphaRatio*100)}% dos pixels amostrados têm alpha quase zero.`]); else items.push(['warn','Pouca transparência detectada.','Confirme se o fundo do spritesheet deveria ser transparente.']);
    if(a.total>0&&a.total<=512) items.push(['good',`${a.total} frames analisados localmente.`,`Frame atual: ${selectedFrame}.`]); else {items.push(['warn',`${a.total} frames na grade.`,`Grades muito grandes podem indicar tamanho de frame incorreto.`]);score-=5;}
    els.diag.innerHTML=items.map(i=>`<div class="diag ${i[0]}"><strong>${escapeHtml(i[1])}</strong>${i[2]?`<br><span>${escapeHtml(i[2])}</span>`:''}</div>`).join('');
    score=Math.max(0,score);els.score.textContent=`${score}/100`;els.score.className='badge '+(score>=85?'good':score>=60?'warn':'bad');
  }
  function escapeHtml(v){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  function stopAnim(){if(animTimer){clearInterval(animTimer);animTimer=null}}
  $('playAnim').addEventListener('click',()=>{if(!analysis)return;stopAnim();let i=0;const start=Math.max(0,+els.animStart.value||0),count=Math.max(1,+els.animCount.value||1),fps=Math.max(1,Math.min(60,+els.animFps.value||8));drawFrameTo(actx,start%analysis.total);animTimer=setInterval(()=>{drawFrameTo(actx,(start+(i++%count))%analysis.total)},1000/fps)});
  $('stopAnim').addEventListener('click',stopAnim);

  function download(name,text,type='application/json'){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500);track('export_completed')}
  els.exportJson.addEventListener('click',()=>{if(!analysis)return;download(baseName()+'.fitlab.json',JSON.stringify({product:'LPC FitLab',version:'1.0.0-lite',source:{name:sourceName,width:img.width,height:img.height},grid:{frame_width:analysis.fw,frame_height:analysis.fh,columns:analysis.cols,rows:analysis.rows,total:analysis.total},animation:{name:safeAnimName(),start:+els.animStart.value||0,count:+els.animCount.value||1,fps:+els.animFps.value||8},diagnostics:{divisible:analysis.divisible,empty_frames:analysis.empty,alpha_ratio:analysis.alphaRatio,max_center_deviation_px:analysis.maxCenterDeviation}},null,2))});
  els.exportTres.addEventListener('click',()=>{if(!analysis)return; const start=Math.max(0,+els.animStart.value||0),count=Math.max(1,+els.animCount.value||1),fps=Math.max(1,+els.animFps.value||8),name=safeAnimName();let sub=[],frames=[];for(let k=0;k<count;k++){const idx=(start+k)%analysis.total,col=idx%analysis.cols,row=Math.floor(idx/analysis.cols),sid=k+2;sub.push(`[sub_resource type="AtlasTexture" id="AtlasTexture_${sid}"]\natlas = ExtResource("1_tex")\nregion = Rect2(${col*analysis.fw}, ${row*analysis.fh}, ${analysis.fw}, ${analysis.fh})\n`);frames.push(`{\n\"duration\": 1.0,\n\"texture\": SubResource(\"AtlasTexture_${sid}\")\n}`)}const txt=`[gd_resource type="SpriteFrames" load_steps=${count+2} format=3]\n\n[ext_resource type="Texture2D" path="res://${sourceName.replace(/[^a-zA-Z0-9._-]/g,'_')}" id="1_tex"]\n\n${sub.join('\n')}\n[resource]\nanimations = [{\n\"frames\": [${frames.join(',')}],\n\"loop\": true,\n\"name\": &\"${name}\",\n\"speed\": ${fps}.0\n}]\n`;download(baseName()+'.tres',txt,'text/plain')});
  function safeAnimName(){return (els.animName.value||'default').trim().replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40)||'default'}
  function baseName(){return (sourceName||'sprite').replace(/\.png$/i,'').replace(/[^a-zA-Z0-9._-]/g,'_')}

  els.proInterest.addEventListener('click',()=>{track('paid_cta_click');const n=(+localStorage.getItem('crs_fitlab_pro_interest')||0)+1;localStorage.setItem('crs_fitlab_pro_interest',n);els.proThanks.textContent='Interesse registrado neste navegador. O Pro só será aberto quando a versão Lite provar uso real.'});
})();
