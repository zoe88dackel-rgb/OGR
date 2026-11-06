function commissionCost(price,rate){
  if(!Number.isFinite(price)||price<=0||price>100000000||!Number.isFinite(rate)||rate<0||rate>100)return null;
  return price*rate/100;
}
(function(){
  if(typeof document==='undefined')return;
  var form=document.getElementById('commission-form');if(!form)return;
  var priceInput=document.getElementById('commission-price');
  var rateInputs=['global','local'].map(function(key){return {key:key,input:document.getElementById('commission-'+key)};});
  function format(value){return '¥'+value.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function render(){
    var price=priceInput.value.trim()===''?NaN:Number(priceInput.value),valid=commissionCost(price,8)!==null;
    var errors=[];if(!valid)errors.push('请填写大于 0 且不超过 1 亿元的售价。');
    var values=[{key:'ogr',rate:8}].concat(rateInputs.map(function(item){
      var text=item.input.value.trim(),rate=text===''?null:Number(text);
      if(rate!==null&&(!Number.isFinite(rate)||rate<0||rate>100)){errors.push((item.key==='global'?'跨境':'本土')+'佣金率需在 0–100% 之间。');rate=null;}
      item.input.setAttribute('aria-invalid',String(text!==''&&rate===null));
      return {key:item.key,rate:rate};
    }));
    priceInput.setAttribute('aria-invalid',String(!valid));
    document.getElementById('commission-error').textContent=errors.join(' ');
    values.forEach(function(item){
      var result=valid&&item.rate!==null?commissionCost(price,item.rate):null;
      var amount=document.getElementById('commission-'+item.key+'-amount');
      amount.textContent=result!==null?format(result):valid?'填写费率后比较':'请先填写有效售价';
      amount.classList.toggle('pending',result===null);
      document.getElementById('commission-'+item.key+'-rate').textContent=item.rate!==null?item.rate+'%':'待核对';
      document.getElementById('commission-'+item.key+'-formula').textContent=result!==null?price.toLocaleString('zh-CN')+' × '+item.rate+'%':'先确认类目与售价档位';
      document.getElementById('commission-'+item.key+'-bar').style.width=result!==null?item.rate+'%':'0%';
    });
  }
  var frame;form.addEventListener('submit',function(event){event.preventDefault();});
  form.addEventListener('input',function(){cancelAnimationFrame(frame);frame=requestAnimationFrame(render);});
  render();
})();
