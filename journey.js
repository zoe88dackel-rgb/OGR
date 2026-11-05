(function(){
  var path=document.getElementById('jrpath'); if(!path) return;
  var done=document.getElementById('jrdone'), box=document.getElementById('jrbox'), L=path.getTotalLength();
  done.style.strokeDasharray=L; done.style.strokeDashoffset=L;
  var steps=[].slice.call(document.querySelectorAll('.jr-steps li'));
  var names=['工厂','集货点','边境','本地仓','买家','回款'];
  var g=document.querySelector('.jr-nodes'), ns='http://www.w3.org/2000/svg';
  steps.forEach(function(s,i){var p=path.getPointAtLength(L*Math.min(+s.dataset.p,.999));
    var n=document.createElementNS(ns,'g');n.setAttribute('class','jr-node');
    n.innerHTML='<circle cx="'+p.x+'" cy="'+p.y+'" r="9"/><text x="'+p.x+'" y="'+(p.y+(i%2?-18:30))+'" text-anchor="middle">'+names[i]+'</text>';
    g.appendChild(n);});
  var nodes=g.children, cur=0, shown=0, target=0, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function place(t){var p=path.getPointAtLength(L*Math.min(t,.999));box.setAttribute('transform','translate('+p.x+' '+p.y+')');done.style.strokeDashoffset=L*(1-t);}
  function tick(){shown+= (target-shown)*.12; if(Math.abs(target-shown)<.002) shown=target; place(shown); if(shown!==target) requestAnimationFrame(tick);}
  function go(i){cur=i;var s=steps[i];steps.forEach(function(x,k){x.classList.toggle('cur',k===i)});
    for(var k=0;k<nodes.length;k++) nodes[k].classList.toggle('on',k<=i);
    document.getElementById('jrWhere').textContent=s.dataset.where;
    var w=document.getElementById('jrWho'); w.className='who '+s.dataset.who; w.textContent=s.querySelector('.who').textContent;
    document.getElementById('jrDays').textContent=s.dataset.days;
    target=+s.dataset.p; if(reduce){shown=target;place(target)}else requestAnimationFrame(tick);}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting) go(steps.indexOf(e.target))})},{rootMargin:'-45% 0px -45% 0px'});
  steps.forEach(function(s){io.observe(s)}); go(0);

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
