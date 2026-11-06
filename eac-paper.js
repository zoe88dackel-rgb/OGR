(function(){
  'use strict';
  const reader=document.getElementById('paper-reader');
  const fields=window.EAC_PAPER_FIELDS;
  if(!reader||!Array.isArray(fields))return;
  const tabs=Array.from(document.querySelectorAll('[data-paper]'));
  const image=document.getElementById('paper-image');
  const highlight=document.getElementById('paper-highlight');
  const detail=document.getElementById('paper-detail');
  const fieldBox=document.getElementById('paper-fields');
  const stage=image.parentElement;
  const sheet=document.createElement('div');sheet.className='paper-sheet';
  stage.append(sheet);sheet.append(image,highlight);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let type='doc',selected=0,ready=false,request=0;
  let detailAnimations=[];
  const turnAnimations=[];
  const easing='cubic-bezier(.25,.8,.25,1)';
  function clearDetailMotion(){
    detailAnimations.forEach(animation=>animation.cancel());detailAnimations=[];
    detail.querySelectorAll('.paper-detail-exit').forEach(node=>node.remove());
  }
  function animateDetail(previous,height){
    if(!ready||reduced.matches||!detail.animate)return;
    const children=Array.from(detail.children);
    const nextHeight=detail.getBoundingClientRect().height;
    previous.className='paper-detail-exit';previous.setAttribute('aria-hidden','true');previous.inert=true;
    detail.append(previous);
    const exit=previous.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'}],{duration:140,easing});
    exit.onfinish=()=>previous.remove();detailAnimations.push(exit);
    children.forEach((child,i)=>detailAnimations.push(child.animate([
      {opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}
    ],{duration:280,delay:45+i*25,easing,fill:'backwards'})));
    detailAnimations.push(detail.animate([{height:height+'px'},{height:nextHeight+'px'}],{duration:360,easing}));
  }
  const sources={
    doc:{src:'assets/eac-doc-original.png',width:880,height:787,alt:'项目指南中的 DoC 声明教学样张，含中文字段标注',caption:'DoC：项目认证指南中的标注原图。示例产品是聚合物包装，不代表其他品类被覆盖。',url:'https://mcnr4asdohn7.feishu.cn/wiki/VZ6hwKx2fiRFkskrBdcchBUDnZn#TGwWdxgmKorieYxVbUWc6o6Nn1f'},
    coc:{src:'assets/eac-coc-official.png',width:1224,height:984,alt:'Ozon 官方文章中的 CoC 历史教学样张，纸面有效期至 2025 年 9 月 30 日',caption:'CoC：Ozon 官方文章中的历史样张。纸面有效期至 30.09.2025，已结束；仅用于字段识读，不可作为当前有效证书使用。',url:'https://seller.ozon.ru/media/instructions/sertifikat-sootvetstviya-na-produkciyu-chto-eto-i-zachem-on-nuzhen/'}
  };
  const buttons=fields.map(function(field,i){
    const button=document.createElement('button');button.type='button';button.textContent=(i+1)+'. '+field.label;
    button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','paper-detail');
    button.addEventListener('click',function(){if(selected===i)return;selected=i;renderField();});fieldBox.append(button);return button;
  });
  function renderField(){
    const previousHeight=detail.getBoundingClientRect().height;
    clearDetailMotion();
    const previous=document.createElement('div');
    Array.from(detail.children).forEach(child=>previous.append(child.cloneNode(true)));
    const field=fields[selected];
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
    const [left,top,width,height]=field[type];
    Object.assign(highlight.style,{left:left+'%',top:top+'%',width:width+'%',height:height+'%'});highlight.hidden=false;
    detail.replaceChildren();
    const heading=document.createElement('h3');heading.textContent=(selected+1)+'. '+field.label;
    const russian=document.createElement('p');russian.className='paper-russian';russian.textContent=field.ru;
    const general=document.createElement('p');general.textContent=field.text;
    const example=document.createElement('p');example.className='paper-example';example.textContent=field[type+'Text'];
    detail.append(heading,russian,general,example);
    animateDetail(previous,previousHeight);
  }
  async function choose(value){
    const ticket=++request;
    tabs.forEach(tab=>{const active=tab.dataset.paper===value;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    if(ready && value===type)return;
    const nextImage=new Image();nextImage.src=sources[value].src;
    try{await nextImage.decode();}catch(error){
      if(ticket===request) tabs.forEach(tab=>{const active=tab.dataset.paper===type;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
      return;
    }
    if(ticket!==request)return;
    const previousType=type;
    type=value;const source=sources[type];
    turnAnimations.splice(0).forEach(animation=>animation.cancel());
    stage.querySelectorAll('.paper-sheet-exit').forEach(node=>node.remove());
    const previous=ready&&!reduced.matches?sheet.cloneNode(true):null;
    if(previous){
      previous.className='paper-sheet-exit';previous.setAttribute('aria-hidden','true');previous.inert=true;
      previous.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
      stage.append(previous);
    }
    tabs.forEach(tab=>{const active=tab.dataset.paper===type;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    reader.setAttribute('aria-labelledby','paper-tab-'+type);
    image.src=source.src;image.alt=source.alt;image.width=source.width;image.height=source.height;
    document.getElementById('paper-caption').textContent=source.caption;
    document.getElementById('paper-original').href=source.src;
    document.getElementById('paper-source').href=source.url;
    renderField();
    if(previous && sheet.animate){
      const direction=type==='coc'?1:-1;
      const exit=previous.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY('+(-direction*12)+'px)'}],{duration:180,easing});
      exit.onfinish=()=>previous.remove();turnAnimations.push(exit);
      turnAnimations.push(sheet.animate([{opacity:0,transform:'translateY('+(direction*12)+'px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing}));
    }
    if(previousType!==type) reader.dataset.paper=type;
    ready=true;
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>choose(tab.dataset.paper));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?1:1-tabs.indexOf(tab);
      choose(tabs[index].dataset.paper);tabs[index].focus();
    });
  });
  choose(type);
})();
