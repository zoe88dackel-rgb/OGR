(function(){
  'use strict';
  var moved={"model.html":{"model-part-4":"shipping.html","model-part-5":"finance.html","model-part-6":"payout.html"},"categories.html":{"categories-part-4":"shipping.html"},"compliance.html":{"compliance-part-1":"shipping.html"},"compare.html":{"compare-part-2":"finance.html","compare-part-3":"finance.html","compare-part-4":"finance.html"},"payout.html":{"payout-part-2":"finance.html"},"calculator.html":{"compare-part-2":"finance.html","compare-part-3":"finance.html","payout-part-2":"finance.html","compare-part-4":"finance.html","model-part-5":"finance.html"}};
  var page=location.pathname.split('/').pop();
  function followAnchor(){
    var id=location.hash.slice(1);
    var target=moved[page]&&moved[page][id];
    if(target&&!document.getElementById(id)){
      var destination=new URL(target,location.href);
      destination.search=location.search;
      destination.searchParams.set('v','motion-8');
      destination.hash=location.hash;
      // Skip capturing the intermediate page during a bookmark redirect.
      addEventListener('pageswap',function(event){
        if(event.viewTransition)event.viewTransition.skipTransition();
      },{once:true});
      location.replace(destination.href);
    }
  }
  addEventListener('hashchange',followAnchor);
  followAnchor();
})();
