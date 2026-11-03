(function(){
  var D=window.CMP||[], R=0.088, ogr={c:'#3a9a2f'}, cats=document.getElementById('cmpCat'); if(!cats) return;
  var prices=[[200,'200 ₽'],[1000,'1000 ₽'],[3000,'3000 ₽'],[8000,'8000 ₽']], ci=0, pi=1;
  function rb(r,p){return p<=1500?r[0]:p<=5000?r[1]:r[2]}
  function fb(f,p){return p<=100?f[0]:p<=300?f[1]:f[2]}
  function btn(box,txt,i,on,cb){var b=document.createElement('button');b.type='button';b.innerHTML=txt;b.setAttribute('aria-pressed',on);b.onclick=function(){cb(i)};box.appendChild(b)}
  D.forEach(function(d,i){btn(cats,d[0],i,i===ci,function(k){ci=k;draw()})});
  var pb=document.getElementById('cmpPrice');
  prices.forEach(function(p,i){btn(pb,p[1]+'<small>≈'+Math.round(p[0]*R)+' 元</small>',i,i===pi,function(k){pi=k;draw()})});
  function draw(){
    [].forEach.call(cats.children,function(b,k){b.setAttribute('aria-pressed',k===ci)});
    [].forEach.call(pb.children,function(b,k){b.setAttribute('aria-pressed',k===pi)});
    var d=D[ci],p=prices[pi][0],y=p*R;
    var rows=[['OGR',8,'#3a9a2f','全品类统一。物流、关税、VAT 另计，但不用俄罗斯公司，1–2 天送达'],
              ['跨境 rFBS',rb(d[1],p),'#3a78f5','佣金低，但自己发国际物流，买家等 15–25 天'],
              ['本土 FBO',fb(d[2],p),'#e8692a','需要俄罗斯法人，自己负责进口和税务']];
    document.getElementById('cmpTitle').innerHTML='<b>'+d[0]+'</b>，售价 <b>'+p+' ₽</b>（约 '+Math.round(y)+' 元）';
    document.getElementById('cmpRows').innerHTML=rows.map(function(r){return '<div class="cmp-row" style="--c:'+r[2]+'"><div class="t"><span>'+r[0]+'</span><b class="num">'+r[1]+'%<small>≈ '+(y*r[1]/100).toFixed(1)+' 元/件</small></b></div><div class="track"><i data-w="'+(r[1]/55*100)+'%"></i></div><p>'+r[3]+'</p></div>'}).join('');
    requestAnimationFrame(function(){requestAnimationFrame(function(){[].forEach.call(document.querySelectorAll('#cmpRows i'),function(i){i.style.width=i.dataset.w})})});
    var lo=Math.min(8,rb(d[1],p)),hi=fb(d[2],p);
    document.getElementById('cmpNote').textContent='同一件货，佣金最低和最高相差 '+(hi-lo).toFixed(1).replace('.0','')+' 个百分点。只比佣金不够：OGR 的 8% 之外还有跨境运费、关税和 22% 销售 VAT，本土店的高佣金里也包含 Ozon 的更多服务。';
  }
  draw();
  // dot plot at 1000 RUB
  var box=document.getElementById('dots'), max=55, x=function(v){return (v/max*100)+'%'};
  box.innerHTML=D.map(function(d){var a=8,b=rb(d[1],1000),c=fb(d[2],1000);
    return '<div class="drow"><div class="n">'+d[0]+'</div><div class="dline"><i class="span" style="left:'+x(a)+';width:'+((c-a)/max*100)+'%"></i>'+
    '<i class="d" style="left:'+x(a)+';--c:#3a9a2f"></i><i class="d" style="left:'+x(b)+';--c:#3a78f5"><em>'+b+'%</em></i><i class="d" style="left:'+x(c)+';--c:#e8692a"><em>'+c+'%</em></i></div></div>'}).join('')+
    '<div class="daxis"><div></div><div>'+[0,10,20,30,40,50].map(function(v){return '<span style="left:'+x(v)+'">'+v+'%</span>'}).join('')+'</div></div>';
})();
