(function(){
  'use strict';
  const deck=document.getElementById('deck');
  const slides=Array.from(deck.querySelectorAll('.slide'));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const previous=document.getElementById('prevSlide'), next=document.getElementById('nextSlide');
  let current=0, scheduled=false, opener=null, lastHeight=deck.clientHeight;
  const aliases={'commission-tables':'commission-tables'};
  function update(){
    if(deck.clientHeight!==lastHeight)return;
    const index=Math.max(0,Math.min(slides.length-1,Math.round(deck.scrollTop/deck.clientHeight)));
    const changed=index!==current;
    current=index;
    document.getElementById('pageNumber').textContent=String(index+1).padStart(2,'0');
    document.getElementById('progressFill').style.width=((index+1)/slides.length*100)+'%';
    document.getElementById('currentGroup').textContent=slides[index].dataset.group;
    previous.disabled=index===0;next.disabled=index===slides.length-1;
    slides.forEach((slide,k)=>{slide.classList.toggle('is-active',k===index);slide.inert=k!==index;});
    document.querySelectorAll('.toc-list a').forEach(link=>{
      if(link.hash==='#'+slides[index].id)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    if(changed){
      history.replaceState(null,'','#'+slides[index].id);
      document.getElementById('pageAnnouncement').textContent=(index+1)+' / '+slides.length+'，'+slides[index].querySelector('h2').textContent;
    }
  }
  function go(index,instant){
    index=Math.max(0,Math.min(slides.length-1,index));
    // Release keyboard focus before making the previous slide inert.
    if(deck.contains(document.activeElement))document.activeElement.blur();
    const jump=instant||reduce||Math.abs(index-current)>1;
    deck.scrollTo({top:index*deck.clientHeight,behavior:jump?'instant':'smooth'});
    if(jump)update();
  }
  deck.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{update();scheduled=false;});}},{passive:true});
  previous.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));
  let lockedUntil=0,lastWheel=0,accumulated=0;
  deck.addEventListener('wheel',event=>{
    if(event.ctrlKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
    let el=event.target, scrollable=false;
    while(el&&el!==deck){
      const style=getComputedStyle(el);
      if(/auto|scroll/.test(style.overflowY)&&el.scrollHeight>el.clientHeight+2){
        if(event.deltaY>0&&el.scrollTop+el.clientHeight<el.scrollHeight-2)scrollable=true;
        if(event.deltaY<0&&el.scrollTop>2)scrollable=true;
      }
      el=el.parentElement;
    }
    if(scrollable)return;
    event.preventDefault();
    const now=performance.now(),gap=now-lastWheel;lastWheel=now;
    if(now<lockedUntil||gap<180&&lockedUntil>0){accumulated=0;return;}
    if(gap>200)accumulated=0;
    accumulated+=event.deltaY*(event.deltaMode===1?16:1);
    if(Math.abs(accumulated)<25)return;
    go(current+(accumulated>0?1:-1));accumulated=0;lockedUntil=now+650;
  },{passive:false});
  document.addEventListener('keydown',event=>{
    const opened=document.querySelector('dialog[open]');
    if(opened&&event.key==='Escape'){event.preventDefault();opened.close();return;}
    if(opened||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.target.closest('input,textarea,select,button,[contenteditable="true"]'))return;
    if(event.key==='ArrowDown'||event.key==='PageDown'||event.key===' '){event.preventDefault();go(current+1);}
    if(event.key==='ArrowUp'||event.key==='PageUp'){event.preventDefault();go(current-1);}
    if(event.key==='Home'){event.preventDefault();go(0);}
    if(event.key==='End'){event.preventDefault();go(slides.length-1);}
  },true);
  function openDialog(id,button){
    const dialog=document.getElementById(id);
    if(!dialog)return;
    opener=button;dialog.showModal();
    dialog.querySelector('.dialog-close').focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const open=event.target.closest('[data-dialog]');
    if(open){openDialog(open.dataset.dialog,open);return;}
    const preset=event.target.closest('[data-open-preset]');
    if(preset){
      openDialog('calculator-detail',preset);
      document.querySelector('#calculator-detail .pre[data-p="'+preset.dataset.openPreset+'"]').click();
      return;
    }
    const close=event.target.closest('.dialog-close');
    if(close){close.closest('dialog').close();return;}
    const anchor=event.target.closest('a[href^="#"]');
    if(anchor){
      const id=anchor.hash.slice(1),index=slides.findIndex(slide=>slide.id===id);
      if(index<0)return;
      event.preventDefault();
      document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
      go(index);history.replaceState(null,'','#'+id);
    }
  });
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.addEventListener('close',()=>{if(opener&&opener.isConnected)opener.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  });
  function fromHash(instant){const hash=location.hash.slice(1),index=slides.findIndex(slide=>slide.id===(aliases[hash]||hash));if(index>=0)go(index,instant);}
  addEventListener('hashchange',()=>fromHash(false));
  const viewportObserver=new ResizeObserver(()=>{
    if(deck.clientHeight!==lastHeight){lastHeight=deck.clientHeight;go(current,true);}
  });viewportObserver.observe(deck);
  // Mobile uses native selects for the same original category/price choices.
  ['cmpCat','cmpPrice'].forEach((id,index)=>{
    const chips=document.getElementById(id), select=document.createElement('select');
    select.className='mobile-select';select.setAttribute('aria-label',index?'前台售价':'类目');
    Array.from(chips.children).forEach((button,k)=>{const option=document.createElement('option');option.value=k;option.textContent=button.textContent;select.appendChild(option);});
    select.selectedIndex=Array.from(chips.children).findIndex(button=>button.getAttribute('aria-pressed')==='true');
    select.addEventListener('change',()=>chips.children[select.value].click());chips.after(select);
    chips.addEventListener('click',()=>{select.selectedIndex=Array.from(chips.children).findIndex(button=>button.getAttribute('aria-pressed')==='true');});
  });
  const commissionNote=document.getElementById('cmpNote');
  const disclosure=document.createElement('details');disclosure.className='cmp-disclosure';
  disclosure.innerHTML='<summary aria-label="佣金口径说明">说明</summary>';
  commissionNote.before(disclosure);disclosure.appendChild(commissionNote);
  const desktop=matchMedia('(min-width:701px)');
  const showNote=()=>{disclosure.open=desktop.matches;};showNote();desktop.addEventListener('change',showNote);
  // Click feedback animates the drawing so the button keeps its existing layout.
  document.querySelectorAll('.ico').forEach(icon=>icon.addEventListener('click',()=>{
    if(reduce)return;const svg=icon.querySelector('svg');svg.getAnimations().forEach(animation=>animation.cancel());
    svg.animate([{transform:'translateY(0) rotate(0) scale(1)'},{transform:'translateY(-5px) rotate(-14deg) scale(1.15)',offset:.4},{transform:'translateY(0) rotate(8deg) scale(.94)',offset:.72},{transform:'translateY(0) rotate(0) scale(1)'}],{duration:520,easing:'ease-out'});
  }));
  // Each route screen keeps the source's path, stage labels and responsibility data.
  document.querySelectorAll('.route-stage').forEach(stage=>{
    const svg=stage.querySelector('svg'),paths=svg.querySelectorAll('path'),path=paths[0],done=paths[1];
    const length=path.getTotalLength(),progress=+stage.dataset.progress;
    done.style.strokeDasharray=length;done.style.strokeDashoffset=length*(1-progress);
    const point=path.getPointAtLength(length*Math.min(progress,.999));
    const box=svg.querySelector('g:last-child');box.setAttribute('transform','translate('+point.x+' '+point.y+')');
    const nodes=svg.querySelector('.route-nodes');
    const positions=[0,.2,.47,.68,.9,1],names=['工厂','佛山','边境','本地仓','买家','回款'];
    positions.forEach((position,index)=>{
      const p=path.getPointAtLength(length*Math.min(position,.999));
      const group=document.createElementNS('http://www.w3.org/2000/svg','g');
      group.innerHTML='<circle cx="'+p.x+'" cy="'+p.y+'" r="8" fill="'+(position<=progress?'#3a78f5':'#fff')+'" stroke="#aabbdd" stroke-width="2"/><text x="'+p.x+'" y="'+(p.y+(index%2?-18:28))+'" text-anchor="middle" fill="#6c6f78" font-size="12">'+names[index]+'</text>';
      nodes.appendChild(group);
    });
  });
  update();fromHash(true);
})();
