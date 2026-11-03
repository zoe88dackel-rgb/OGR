(function(){
  var path=document.getElementById('jrpath'); if(!path) return;
  var done=document.getElementById('jrdone'), box=document.getElementById('jrbox'), L=path.getTotalLength();
  done.style.strokeDasharray=L; done.style.strokeDashoffset=L;
  var steps=[].slice.call(document.querySelectorAll('.jr-steps li'));
  var names=['工厂','佛山','边境','本地仓','买家','回款'];
  var positions=[[70,104],[288,104],[520,104],[520,244],[288,244],[70,244]];
  var distances=[0,218,450,590,822,1040];
  var icons=[
    '<path d="M3 20V10l6 3V8l6 3V4h5v16H3zM7 16h1m4 0h1m4 0h1"/>',
    '<path d="m3 9 9-6 9 6v12H3zM8 21V11h8v10M8 15h8m-8 3h8"/>',
    '<path d="M5 21V3h14v18M3 21h18M9 7h6m-6 4h6m-3 4v3m-3-3 3 3 3-3"/>',
    '<path d="m3 8 9-5 9 5v12H3zM7 20v-8h10v8M7 16h10M3 8l9 5 9-5"/>',
    '<path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7"/>',
    '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18m-4 5h1M6 6V4h11"/>'
  ];
  var g=document.querySelector('.jr-nodes'), ns='http://www.w3.org/2000/svg';
  steps.forEach(function(s,i){
    var p=positions[i], n=document.createElementNS(ns,'g');
    n.setAttribute('class','jr-flow-node'); n.setAttribute('role','button');n.setAttribute('tabindex','0');n.setAttribute('aria-label',s.querySelector('h3').textContent);
    n.innerHTML='<rect class="jr-node-bg" x="'+(p[0]-25)+'" y="'+(p[1]-25)+'" width="50" height="50" rx="14"/><svg x="'+(p[0]-13)+'" y="'+(p[1]-13)+'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[i]+'</svg><text x="'+p[0]+'" y="'+(p[1]+49)+'" text-anchor="middle" class="jr-flow-label">'+names[i]+'</text>';
    function activate(){s.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});go(i);}
    n.addEventListener('click',activate);n.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
    g.appendChild(n);
  });
  var nodes=g.children, shown=0, target=0, frame=0, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function place(t){var p=path.getPointAtLength(L*Math.min(t,1));box.setAttribute('transform','translate('+p.x+' '+p.y+')');done.style.strokeDashoffset=L*(1-t);}
  function tick(){shown+=(target-shown)*.16;if(Math.abs(target-shown)<.001)shown=target;place(shown);frame=shown!==target?requestAnimationFrame(tick):0;}
  function go(i){
    var s=steps[i];steps.forEach(function(x,k){x.classList.toggle('cur',k===i)});
    for(var k=0;k<nodes.length;k++){nodes[k].classList.toggle('on',k<=i);nodes[k].classList.toggle('current',k===i);if(k===i)nodes[k].setAttribute('aria-current','step');else nodes[k].removeAttribute('aria-current');}
    document.getElementById('jrWhere').textContent=s.dataset.where;
    var w=document.getElementById('jrWho');w.className='who '+s.dataset.who;w.textContent=s.querySelector('.who').textContent;
    document.getElementById('jrDays').textContent=s.dataset.days;
    document.getElementById('jrCounter').textContent=String(i+1).padStart(2,'0')+' / 06';
    target=distances[i]/L;
    if(reduce){shown=target;place(target);}else if(!frame)frame=requestAnimationFrame(tick);
  }
  var queued=false;
  function sync(){
    queued=false;var band=innerHeight*.46,best=0;
    steps.forEach(function(s,i){if(s.getBoundingClientRect().top<=band)best=i;});go(best);
  }
  addEventListener('scroll',function(){if(!queued){queued=true;requestAnimationFrame(sync);}},{passive:true});
  addEventListener('resize',sync);sync();
  // money flow
  var mf=document.getElementById('mf'); if(!mf) return;
  var price=120, vat=price*22/122, com=price*.08, ship=1.79, clr=1600/600, wh=.98, duty=(price-vat)*.1*.55, local=(46+2+25)*.088, acq=price*.015;
  var parts=[['销售 VAT',vat,'#8a8f9a','22%，Ozon 代缴'],['佣金',com,'#3a78f5','8%'],['跨境段',ship+clr+wh+duty,'#7ea4f7','运费、清关摊销、操作、关税'],['本地段',local+acq,'#b7cbf8','配送、收单（估）'],['平台回款',price-vat-com-ship-clr-wh-duty-local-acq,'#3a9a2f','再减去你的采购成本就是利润']];
  var bar=mf.querySelector('.mf-bar'), lg=mf.querySelector('.mf-legend');
  parts.forEach(function(p){var i=document.createElement('i');i.style.background=p[2];i.dataset.w=(p[1]/price*100)+'%';i.textContent=p[1]/price>.09?p[0]:'';bar.appendChild(i);
    var li=document.createElement('li');li.style.setProperty('--c',p[2]);li.innerHTML='<div>'+p[0]+' <b class="num">'+p[1].toFixed(2)+' 元</b><small>'+p[3]+'</small></div>';lg.appendChild(li);});
  var fill=function(){[].forEach.call(bar.children,function(i){i.style.width=i.dataset.w})};
  if(reduce) fill(); else new IntersectionObserver(function(es,o){if(es[0].isIntersecting){fill();o.disconnect()}},{threshold:.4}).observe(bar);
})();
