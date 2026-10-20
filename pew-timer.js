/* Deal of the Day countdown timer.
   Sits in the dark area right under the deal picture.
   - Default: counts down to closing time (12 AM Depew time) every day and restarts the next morning.
   - If the owner sets an end time in the owner app, it counts down to that moment, then shows "DEAL ENDED".
   To remove: delete the "pew-timer.js" block at the bottom of pew-catalog.js. */
(function(){
  var W='https://pew-deal.celyum909.workers.dev';
  var TZ='America/New_York';
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  var css=document.createElement('style');
  css.textContent=
  '.deal-timer{display:flex;align-items:center;gap:8px;width:max-content;max-width:100%;margin:0 0 12px 42px;padding:6px 11px;border-radius:999px;background:#ffffff14;border:1px solid #ffffff33;color:#fff;font-weight:900;font-size:clamp(11px,2.9vw,13px);letter-spacing:.4px;line-height:1.2;font-variant-numeric:tabular-nums}'+
  '.deal-timer .dt-lab{color:#ffd43b;text-transform:uppercase;font-size:.85em;letter-spacing:1px}'+
  '.deal-timer .dt-dot{width:8px;height:8px;border-radius:50%;background:#ef233c;box-shadow:0 0 0 0 #ef233c88;animation:dtpulse 1.6s ease-out infinite;flex:none}'+
  '.deal-timer.dt-soon .dt-time{color:#ff8a95}'+
  '.deal-timer.dt-ended{background:#2a0b10;border-color:#ef233c88}.deal-timer.dt-ended .dt-dot{animation:none;background:#777}'+
  '@keyframes dtpulse{70%{box-shadow:0 0 0 7px #ef233c00}100%{box-shadow:0 0 0 0 #ef233c00}}'+
  '@media (prefers-reduced-motion:reduce){.deal-timer .dt-dot{animation:none}}';
  document.head.appendChild(css);

  var box=el('span','deal-timer');box.hidden=true;
  var dot=el('span','dt-dot');dot.setAttribute('aria-hidden','true');
  var lab=el('span','dt-lab','Ends in');var tm=el('span','dt-time','');
  box.append(dot,lab,tm);
  var endsAt=null; // owner-set end time (ms) or null = closing time

  // seconds until the next 12:00 AM in Depew (New York) time
  function secsToMidnightNY(){
    var p={};try{new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value})}catch(e){return null}
    var h=parseInt(p.hour,10)%24,m=parseInt(p.minute,10),s=parseInt(p.second,10);
    return 86400-(h*3600+m*60+s);
  }
  function fmt(sec){
    var d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=sec%60;
    function z(n){return n<10?'0'+n:''+n}
    return d>0?d+'d '+h+'h '+z(m)+'m':(h>0?h+'h '+z(m)+'m '+z(s)+'s':z(m)+'m '+z(s)+'s');
  }
  function tick(){
    var sec;
    if(endsAt){sec=Math.floor((endsAt-Date.now())/1000)}else{sec=secsToMidnightNY()}
    if(sec==null){box.hidden=true;return}
    if(sec<=0&&endsAt){box.className='deal-timer dt-ended';lab.textContent='Deal ended';tm.textContent='';box.setAttribute('aria-label','This deal has ended');return}
    box.className='deal-timer'+(sec<3600?' dt-soon':'');
    lab.textContent=endsAt?'Deal ends in':'Today’s deal ends in';tm.textContent=fmt(sec);
    box.removeAttribute('aria-label');
  }
  function place(){
    var copy=document.querySelector('#deal .deal-copy');if(!copy)return false;
    var hours=copy.querySelector('.store-hours');
    if(hours&&hours.nextSibling)copy.insertBefore(box,hours.nextSibling);else copy.insertBefore(box,copy.firstChild);
    return true;
  }
  function start(){
    if(!place())return;
    tick();box.hidden=false;setInterval(tick,1000);
    document.addEventListener('visibilitychange',tick);
    fetch(W+'/deal',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(d){
      var e=d&&Number(d.ends);endsAt=e&&isFinite(e)?e:null;tick();
    }).catch(function(){});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
