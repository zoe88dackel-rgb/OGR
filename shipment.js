(function(){
  'use strict';
  const root=document.querySelector('[data-shipment]');
  if(!root)return;
  const rail=root.querySelector('.shipment-rail');
  const stops=Array.from(root.querySelectorAll('[data-shipment-step]'));
  const panels=Array.from(root.querySelectorAll('.shipment-panel'));
  const vehicle=root.querySelector('.shipment-vehicle');
  const track=root.querySelector('.shipment-track');
  const previous=root.querySelector('[data-shipment-prev]');
  const next=root.querySelector('[data-shipment-next]');
  const vertical=matchMedia('(min-width:421px) and (max-width:700px)');
  const compact=matchMedia('(max-width:420px)');
  let current=0;
  function position(){
    const bounds=rail.getBoundingClientRect();
    const points=stops.map(button=>{
      const r=button.querySelector('.shipment-stop-number').getBoundingClientRect();
      return{x:r.left-bounds.left+r.width/2+rail.scrollLeft,y:r.top-bounds.top+r.height/2};
    });
    const first=points[0],last=points[points.length-1],p=points[current];
    if(vertical.matches){
      vehicle.style.transform='translate3d(0,'+(p.y-13)+'px,0)';
      Object.assign(track.style,{left:first.x+'px',top:first.y+'px',width:'2px',height:(last.y-first.y)+'px'});
    }else{
      vehicle.style.transform='translate3d('+(p.x-24)+'px,0,0)';
      Object.assign(track.style,{left:first.x+'px',top:'46px',width:(last.x-first.x)+'px',height:'2px'});
    }
    root.style.setProperty('--shipment-progress',current/(stops.length-1));
  }
  function select(index,focus){
    current=Math.max(0,Math.min(stops.length-1,index));
    stops.forEach((button,i)=>{
      button.setAttribute('aria-selected',String(i===current));button.tabIndex=i===current?0:-1;
      button.classList.toggle('complete',i<current);
      if(i===current&&focus)button.focus();
    });
    panels.forEach((panel,i)=>{panel.hidden=i!==current;});
    previous.disabled=current===0;next.disabled=current===stops.length-1;
    root.querySelector('[data-shipment-count]').textContent=String(current+1).padStart(2,'0')+' / 06';
    position();
    if(compact.matches){
      const button=stops[current];
      rail.scrollTo({left:Math.max(0,button.offsetLeft+button.offsetWidth/2-rail.clientWidth/2),behavior:'instant'});
    }
  }
  stops.forEach((button,index)=>{
    button.addEventListener('click',()=>select(index,false));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      event.preventDefault();
      select(event.key==='Home'?0:event.key==='End'?stops.length-1:current+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1),true);
    });
  });
  previous.addEventListener('click',()=>select(current-1,false));
  next.addEventListener('click',()=>select(current+1,false));
  if('ResizeObserver' in window)new ResizeObserver(position).observe(rail);
  else addEventListener('resize',position);
  vertical.addEventListener('change',position);
  compact.addEventListener('change',position);
  if(document.fonts)document.fonts.ready.then(position);
  select(0,false);
})();
