(function(){
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||!('requestAnimationFrame' in window))return;
  const root=document.documentElement;
  const header=document.querySelector('header.site');
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  let story=null,route=null,queued=false,resizeQueued=false;
  // Reuse the original hero nodes, keeping all copy, icons and event handlers.
  const hero=document.querySelector('main>.ihero');
  if(hero){
    const wrapper=document.createElement('section');wrapper.className='scroll-story';
    const pin=document.createElement('div');pin.className='story-pin';
    const intro=document.createElement('div');intro.className='story-intro';
    const metrics=document.createElement('div');metrics.className='story-metrics';
    const inner=document.createElement('div');inner.className='in';
    const mock=hero.querySelector('.mock');
    hero.before(wrapper);intro.appendChild(hero);inner.appendChild(mock);metrics.appendChild(inner);
    const artifacts=document.createElement('div');artifacts.className='story-artifacts';artifacts.setAttribute('aria-hidden','true');
    const buttons=Array.from(hero.querySelectorAll('h1>.ico'));
    const labels=Array.from(hero.querySelectorAll('h1>b')).map(el=>el.textContent.replace(/^，/,'').trim());
    const items=buttons.map((button,i)=>{
      const item=document.createElement('div');item.className='story-artifact';
      const icon=document.createElement('span');icon.className=button.className.replace(/\bpop\b/g,'').trim();icon.innerHTML=button.innerHTML;
      const label=document.createElement('span');label.className='story-artifact-label';label.textContent=labels[i];
      item.append(icon,label);artifacts.appendChild(item);return{item,button,label,from:null};
    });
    pin.append(intro,metrics,artifacts);wrapper.appendChild(pin);
    story={wrapper,pin,intro,metrics,hero,items,cards:Array.from(mock.children),phrases:Array.from(hero.querySelectorAll('h1>b')),enabled:false};
  }
  const candidates=Array.from(document.querySelectorAll('.grid>.card,.split>.card,.h2,.eyebrow'))
    .filter(el=>!el.closest('.scroll-story')&&!el.closest('.jr-stage'));
  const groups=new Map();
  candidates.forEach(el=>{
    const anchor=el.matches('.card')?el.parentElement:el.parentElement;
    if(!groups.has(anchor))groups.set(anchor,[]);
    const members=groups.get(anchor);members.push({el,index:members.length});
    el.classList.add('progress-item');
  });
  const path=document.getElementById('jrpath');
  if(path){
    const svg=path.closest('svg'),done=document.getElementById('jrdone').cloneNode(false),box=document.getElementById('jrbox').cloneNode(true);
    done.id='jrScrubDone';box.id='jrScrubBox';
    const nodes=svg.querySelector('.jr-nodes');nodes.before(done,box);
    const length=path.getTotalLength();done.style.strokeDasharray=length;
    svg.classList.add('route-scrub-enabled');
    route={svg,path,done,box,length,steps:Array.from(document.querySelectorAll('.jr-steps>li'))};
  }
  function layout(){
    resizeQueued=false;
    if(story){
      // Keep the same point in the story when a monitor, zoom or orientation changes.
      const previous=story.enabled&&Number.isFinite(story.position)?{
        progress:(story.position-story.start)/story.distance,
        beyond:story.position-story.start-story.distance-story.height
      }:null;
      const top=header?Math.ceil(header.getBoundingClientRect().height):0;
      // The source UI has a bounded reading width. Its animation frame must also
      // be bounded, rather than stretching into thousands of empty pixels at 4K.
      const available=Math.min(innerHeight-top,960);
      story.height=available;
      story.wrapper.style.setProperty('--story-top',top+'px');
      story.wrapper.style.setProperty('--story-height',available+'px');
      // Measure the two original content groups independently at the real width.
      story.wrapper.classList.remove('story-static');
      story.intro.style.transform='none';
      const introHeight=story.hero.scrollHeight;
      const metricsHeight=story.metrics.firstElementChild.scrollHeight;
      story.enabled=available>=430&&Math.max(introHeight,metricsHeight)<=available-16;
      story.wrapper.classList.toggle('story-static',!story.enabled);
      story.distance=available*(innerWidth<=700?1.65:2.15);
      story.wrapper.style.height=story.enabled?(available+story.distance)+'px':'auto';
      story.top=top;
      story.start=story.wrapper.getBoundingClientRect().top+scrollY-top;
      const pinRect=story.pin.getBoundingClientRect(),heroRect=hero.getBoundingClientRect();
      story.items.forEach(({button},i)=>{
        const r=button.getBoundingClientRect();
        const mobile=innerWidth<=700;
        story.items[i].from={x:r.left-pinRect.left+r.width/2,y:r.top-pinRect.top+r.height/2,scale:r.width/64};
        story.items[i].to={x:mobile?innerWidth*(i%2? .73:.27):heroRect.left-pinRect.left+heroRect.width*(i+.5)/4,y:available*(mobile?(i<2?.34:.63):.48)};
      });
      if(!story.enabled){story.intro.inert=false;story.phrases.forEach(el=>el.style.removeProperty('opacity'));story.items.forEach(({button})=>button.style.removeProperty('visibility'));}
      if(previous&&story.enabled){
        if(previous.progress>=0&&previous.progress<=1){
          scrollTo({top:story.start+previous.progress*story.distance,behavior:'instant'});
        }else if(previous.progress>1){
          scrollTo({top:story.start+story.distance+story.height+previous.beyond,behavior:'instant'});
        }
      }
      story.position=scrollY;
    }
    requestUpdate();
  }
  function update(){
    queued=false;
    // Read layout first; write styles only after the complete measurement pass.
    let stage=null,routeFrame=null;
    if(story&&story.enabled){
      const r=story.wrapper.getBoundingClientRect();
      stage=clamp((story.top-r.top)/story.distance);
      story.position=scrollY;
    }
    const reveal=[];
    groups.forEach((members,anchor)=>{
      const r=anchor.getBoundingClientRect();
      if(r.top>innerHeight+250||r.bottom< -250)return;
      members.forEach(item=>{
        const progress=clamp((innerHeight*.96-r.top-item.index*42)/(innerHeight*.36));
        reveal.push([item.el,smooth(progress)]);
      });
    });
    if(route){
      const positions=route.steps.map(step=>{const r=step.getBoundingClientRect();return{step,center:r.top+r.height/2,height:r.height};});
      const focus=innerHeight*.5;
      let value=0;
      if(positions[positions.length-1].center<=focus)value=1;
      else for(let i=0;i<positions.length-1;i++){
        if(positions[i].center<=focus&&positions[i+1].center>focus){
          const t=clamp((focus-positions[i].center)/(positions[i+1].center-positions[i].center));
          value=+positions[i].step.dataset.p+(+positions[i+1].step.dataset.p- +positions[i].step.dataset.p)*t;
          break;
        }
      }
      routeFrame={value,positions};
    }
    if(stage!==null){
      const exit=smooth((stage-.20)/.22),enter=smooth((stage-.57)/.23);
      story.intro.style.opacity=1-exit;
      story.intro.style.transform='translate3d(0,'+(-exit*65)+'px,0) scale('+(1-exit*.045)+')';
      const inactive=exit>.97;
      if(story.intro.inert!==inactive)story.intro.inert=inactive;
      story.intro.style.pointerEvents=inactive?'none':'auto';
      story.metrics.style.opacity=enter;
      story.metrics.style.transform='translate3d(0,'+((1-enter)*story.pin.clientHeight*.55)+'px,0) scale('+(0.94+enter*.06)+')';
      story.cards.forEach((card,i)=>{
        const p=smooth((stage-(.59+i*.055))/.18);
        const side=i===0?-1:i===2?1:0;
        card.style.translate=(side*(1-p)*100)+'px '+((1-p)*(36+i*20))+'px';
        card.style.rotate=(side*(1-p)*6)+'deg';
        card.style.scale=.92+p*.08;
        card.style.opacity=.1+p*.9;
      });
      story.phrases.forEach((phrase,i)=>{
        phrase.style.opacity='1';
      });
      story.items.forEach(({item,button,label,from,to},i)=>{
        if(!from)return;
        const travel=smooth((stage-(.18+i*.015))/.22);
        const leave=smooth((stage-.60)/.16);
        const alpha=smooth((stage-.17)/.065)*(1-leave);
        const x=from.x+(to.x-from.x)*travel;
        const y=from.y+(to.y-from.y)*travel-leave*90;
        const width=innerWidth<=700?160:180;
        const scale=from.scale+(1-from.scale)*travel;
        item.style.transform='translate3d('+(x-width/2)+'px,'+(y-32)+'px,0) scale('+scale+')';
        item.style.opacity=alpha;
        label.style.opacity=smooth((stage-.31)/.1)*(1-leave);
        button.style.visibility=stage>.235?'hidden':'';
      });
    }
    reveal.forEach(([el,p])=>{
      el.style.setProperty('--reveal-alpha',(.22+p*.78).toFixed(3));
      el.style.setProperty('--reveal-y',((1-p)*36).toFixed(2)+'px');
      el.style.setProperty('--reveal-scale',(.985+p*.015).toFixed(4));
    });
    if(routeFrame){
      const p=route.path.getPointAtLength(route.length*routeFrame.value);
      route.box.setAttribute('transform','translate('+p.x+' '+p.y+')');
      route.done.style.strokeDashoffset=route.length*(1-routeFrame.value);
      routeFrame.positions.forEach(({step,center,height})=>{
        const proximity=1-clamp(Math.abs(center-innerHeight*.5)/(innerHeight*.48+height*.2));
        step.style.setProperty('--step-alpha',(.42+.58*smooth(proximity)).toFixed(3));
        step.style.setProperty('--step-y',((1-smooth(proximity))*14).toFixed(2)+'px');
      });
    }
  }
  function requestUpdate(){if(!queued){queued=true;requestAnimationFrame(update);}}
  root.classList.add('progress-enhanced');
  addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',()=>{if(!resizeQueued){resizeQueued=true;requestAnimationFrame(layout);}});
  if(header&&'ResizeObserver' in window)new ResizeObserver(layout).observe(header);
  if(document.fonts)document.fonts.ready.then(layout);
  // Respond to a system preference change without leaving a pinned section behind.
  reduced.addEventListener('change',()=>location.reload());
  layout();
})();
