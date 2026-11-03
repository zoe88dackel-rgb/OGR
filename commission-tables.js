(function(){
  'use strict';
  const browser=document.getElementById('rates-browser');
  if(!browser)return;
  const toggle=document.getElementById('fullBtn');
  const tabs=Array.from(browser.querySelectorAll('[data-rate-tab]'));
  const small=matchMedia('(max-width:700px)');
  const catalogs=[['global','q1','t1','commission-part-5'],['local','q2','t2','commission-part-6']].map(([key,id,tableId,panelId])=>({
    key,id,panel:document.getElementById(panelId),input:document.getElementById(id),
    rows:Array.from(document.querySelectorAll('#'+tableId+' tbody tr')),page:0
  }));
  let active='global';
  function render(c){
    const query=c.input.value.trim().toLocaleLowerCase();
    const matching=c.rows.filter(row=>(row.dataset.q||row.textContent).toLocaleLowerCase().includes(query));
    const size=small.matches?5:10;
    const count=Math.ceil(matching.length/size);
    c.page=Math.max(0,Math.min(c.page,Math.max(0,count-1)));
    const start=c.page*size,end=Math.min(start+size,matching.length);
    const visible=new Set(matching.slice(start,end));
    c.rows.forEach(row=>{row.hidden=!visible.has(row);});
    document.getElementById(c.id+'Status').textContent=matching.length?'共 '+matching.length+' 个类目 · 显示 '+(start+1)+'–'+end+' 条':'找到 0 个类目';
    document.getElementById(c.id+'Page').textContent=count?'第 '+(c.page+1)+' / '+count+' 页':'暂无结果';
    document.getElementById(c.id+'Prev').disabled=c.page===0;
    document.getElementById(c.id+'Next').disabled=!count||c.page>=count-1;
    document.getElementById(c.id+'Clear').disabled=!query;
    document.getElementById(c.id+'Empty').hidden=matching.length!==0;
    c.panel.querySelector('.commission-table').hidden=matching.length===0;
  }
  function select(key,focus){
    active=key;
    tabs.forEach(tab=>{
      const current=tab.dataset.rateTab===key;
      tab.setAttribute('aria-selected',String(current));tab.tabIndex=current?0:-1;
      if(current&&focus)tab.focus();
    });
    catalogs.forEach(c=>{c.panel.hidden=c.key!==key;});
  }
  toggle.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')!=='true';
    browser.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
    toggle.textContent=open?'收起完整佣金表':'查看完整佣金表 · 可搜索与分页';
  });
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(tab.dataset.rateTab,false));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const target=event.key==='Home'?0:event.key==='End'?1:(index+1)%tabs.length;
      select(tabs[target].dataset.rateTab,true);
    });
  });
  catalogs.forEach(c=>{
    c.input.addEventListener('input',()=>{c.page=0;render(c);});
    c.input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){c.input.value='';c.page=0;render(c);}
    });
    document.getElementById(c.id+'Clear').addEventListener('click',()=>{c.input.value='';c.page=0;render(c);c.input.focus();});
    document.getElementById(c.id+'Prev').addEventListener('click',()=>{c.page--;render(c);});
    document.getElementById(c.id+'Next').addEventListener('click',()=>{c.page++;render(c);});
    render(c);
  });
  small.addEventListener('change',()=>catalogs.forEach(c=>{c.page=0;render(c);}));
  select(active,false);
  function followHash(){
    const id=location.hash.slice(1),catalog=catalogs.find(c=>c.panel.id===id);
    if(!catalog)return;
    browser.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.textContent='收起完整佣金表';
    select(catalog.key,false);
    requestAnimationFrame(()=>catalog.panel.scrollIntoView({block:'start',behavior:'instant'}));
  }
  addEventListener('hashchange',followHash);followHash();
})();
