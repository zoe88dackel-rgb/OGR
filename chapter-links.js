(function(){
  'use strict';
  var moved={"model.html":{"model-part-4":"shipping.html","model-part-5":"calculator.html","model-part-6":"payout.html"},"categories.html":{"categories-part-4":"shipping.html"},"compliance.html":{"compliance-part-1":"shipping.html"},"compare.html":{"compare-part-2":"calculator.html","compare-part-3":"calculator.html","compare-part-4":"calculator.html"},"payout.html":{"payout-part-2":"calculator.html"}};
  var page=location.pathname.split('/').pop();
  var id=location.hash.slice(1);
  var target=moved[page]&&moved[page][id];
  if(target&&!document.getElementById(id)){
    var destination=new URL(target,location.href);
    destination.search=location.search;
    destination.searchParams.set('v','seller-flow-1');
    destination.hash=location.hash;
    // Skip capturing the intermediate page during a bookmark redirect.
    addEventListener('pageswap',function(event){
      if(event.viewTransition)event.viewTransition.skipTransition();
    },{once:true});
    location.replace(destination.href);
  }
})();
