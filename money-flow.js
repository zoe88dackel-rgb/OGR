(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mf=document.getElementById('mf'); if(!mf) return;
  var price=120, vat=price*22/122, com=price*.08, ship=1.79, clr=1600/600, wh=.98, duty=(price-vat)*.1*.55, local=(46+2+25)*.088, acq=price*.015;
  var parts=[['销售 VAT',vat,'#8a8f9a','22%，Ozon 代缴'],['佣金',com,'#3a78f5','8%'],['跨境段（估）',ship+clr+wh+duty,'#7ea4f7','运费、清关摊销、操作、关税；以实际报价和账单为准'],['本地段',local+acq,'#b7cbf8','配送、收单（估）'],['平台回款',price-vat-com-ship-clr-wh-duty-local-acq,'#3a9a2f','再减去你的采购成本就是利润']];
  var bar=mf.querySelector('.mf-bar'), lg=mf.querySelector('.mf-legend');
  parts.forEach(function(p){var i=document.createElement('i');i.style.background=p[2];i.dataset.w=(p[1]/price*100)+'%';i.textContent=p[1]/price>.09?p[0]:'';bar.appendChild(i);
    var li=document.createElement('li');li.style.setProperty('--c',p[2]);li.innerHTML='<div>'+p[0]+' <b class="num">'+p[1].toFixed(2)+' 元</b><small>'+p[3]+'</small></div>';lg.appendChild(li);});
  var fill=function(){[].forEach.call(bar.children,function(i){i.style.width=i.dataset.w})};
  if(reduce) fill(); else new IntersectionObserver(function(es,o){if(es[0].isIntersecting){fill();o.disconnect()}},{threshold:.4}).observe(bar);
})();
