/* Depew Snack Hub - "Add to your phone" banner. Loaded by index.html with one script tag. */
(function(){
  function addLink(rel,href){var l=document.createElement('link');l.rel=rel;l.href=href;document.head.appendChild(l);}
  addLink('manifest','manifest.webmanifest');
  addLink('apple-touch-icon','apple-touch-icon.png');
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
  }
  var css='.a2hs{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;max-width:460px;margin:0 auto;background:#0c1224;border:1px solid #2c334b;border-radius:16px;box-shadow:0 18px 50px -12px rgba(0,0,0,.8);padding:14px 14px 14px 12px;display:flex;gap:12px;align-items:flex-start;transform:translateY(140%);transition:transform .35s ease;font-family:Arial,Helvetica,sans-serif;color:#fff}.a2hs[hidden]{display:none}.a2hs.show{transform:none}.a2hs img{width:48px;height:48px;border-radius:12px;flex:none}.a2hs-body{flex:1;min-width:0}.a2hs-title{font-weight:800;font-size:14.5px}.a2hs-steps{font-size:13px;color:#c7ccdb;line-height:1.45;margin-top:4px}.a2hs-steps b{color:#fff}.a2hs-share{display:inline-block;width:15px;height:15px;vertical-align:-2px}.a2hs-install{margin-top:10px;background:#ed0015;color:#fff;border:none;border-radius:999px;padding:9px 16px;font-weight:800;font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}.a2hs-close{flex:none;background:none;border:none;color:#9aa2b8;font-size:22px;line-height:1;padding:2px 4px;cursor:pointer}.a2hs-link{display:block;text-align:center;color:#fff;font:700 13px Arial,Helvetica,sans-serif;text-decoration:underline;padding:14px 0 6px}';
  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn);}
  ready(function(){
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var b=document.createElement('div');b.className='a2hs';b.id='a2hs';b.setAttribute('role','dialog');b.setAttribute('aria-label','Add Depew Snack Hub to your phone');b.hidden=true;
    b.innerHTML='<img src="icon-192.png" alt=""><div class="a2hs-body"><div class="a2hs-title">Add Depew Snack Hub to your phone</div><div class="a2hs-steps" id="a2hs-steps"></div><button class="a2hs-install" id="a2hs-install" type="button" hidden>Add to Home Screen</button></div><button class="a2hs-close" id="a2hs-close" type="button" aria-label="Close">&times;</button>';
    document.body.appendChild(b);
    var steps=document.getElementById('a2hs-steps'),btn=document.getElementById('a2hs-install'),KEY='pew-a2hs-dismissed-v1',deferred=null;
    var ua=navigator.userAgent||'';
    var isIOS=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    var isPhone=isIOS||/Android/.test(ua);
    var installed=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
    function recent(){try{return Date.now()-(+localStorage.getItem(KEY)||0)<3*864e5}catch(e){return false}}
    function remember(){try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}}
    function hide(){b.classList.remove('show');setTimeout(function(){b.hidden=true},400)}
    function show(){b.hidden=false;requestAnimationFrame(function(){requestAnimationFrame(function(){b.classList.add('show')})})}
    var share='<svg class="a2hs-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
    steps.innerHTML=isIOS?'Tap '+share+' <b>Share</b> at the bottom of Safari, then <b>Add to Home Screen</b>.':'Tap the <b>&#8942;</b> menu at the top right, then <b>Add to Home screen</b> or <b>Install app</b>.';
    window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;steps.textContent="Get today's deals in one tap - no app store needed.";btn.hidden=false});
    btn.addEventListener('click',function(){if(!deferred)return;deferred.prompt();deferred.userChoice.then(function(c){deferred=null;if(c&&c.outcome==='accepted')hide()})});
    window.addEventListener('appinstalled',function(){remember();hide()});
    document.getElementById('a2hs-close').addEventListener('click',function(){remember();hide()});
    window.pewShowInstall=function(){if(installed){steps.textContent="You're already using the Depew Snack Hub app.";btn.hidden=true}show()};
    var a=document.createElement('a');a.href='#';a.className='a2hs-link';a.textContent='Add Depew Snack Hub to your phone';
    a.addEventListener('click',function(e){e.preventDefault();window.pewShowInstall()});
    var ph=document.querySelector('.phone');(ph||document.body).appendChild(a);
    if(isPhone&&!installed&&!recent())setTimeout(show,2500);
  });
})();
