/* Hollow Signal — limited-time Halloween thank-you for Depew Snack Hub customers.
   Adds a card near the bottom of the app. Tap it: a full-screen panel slides down and the
   Hollow Signal intro video plays (with sound). When the video ends, an ENTER button appears
   and the video keeps looping quietly behind it. Tap ENTER to open the Hollow Signal field kit.
   Files it uses: hallow/intro.mp4, hallow/card.jpg, hallow/index.html
   Hides itself on END_DATE. Add ?hs=1 to the address to preview it after that date. */
(function(){
  var END=new Date(2026,11,1,0,0,0); // Dec 1, 2026
  var preview=/[?&]hs=1\b/.test(location.search);
  if(!preview&&new Date()>=END)return;
  var BASE=(function(){var s=document.currentScript&&document.currentScript.src;return s?s.replace(/[^\/]*$/,''):''})();
  var DIR=BASE+'hallow/';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ready(f){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f()}

  ready(function(){
    if(document.getElementById('hs-card'))return;
    var main=document.querySelector('main.phone')||document.body;

    var css=document.createElement('style');
    css.textContent=
    '#hs-card{display:block;position:relative;width:100%;margin:0;padding:0;border:0;border-top:1px solid #ff8a1f55;background:#050306;color:#fff;text-align:left;cursor:pointer;overflow:hidden;font-family:inherit;-webkit-tap-highlight-color:transparent}'+
    '#hs-card .hs-bg{display:block;width:100%;height:230px;object-fit:cover;object-position:50% 40%;opacity:.8}'+
    '#hs-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#050306 0,#05030600 30%,#050306d0 78%,#050306)}'+
    '#hs-card .hs-copy{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:0 20px 20px}'+
    '#hs-card .hs-tag{display:inline-block;padding:4px 10px;border-radius:999px;background:#ff7a1a;color:#1a0900;font-size:11px;font-weight:900;letter-spacing:1px;text-transform:uppercase}'+
    '#hs-card h3{margin:8px 0 4px;font-size:25px;line-height:1.05;letter-spacing:.5px;color:#ffb347;text-shadow:0 0 18px #ff7a1a99}'+
    '#hs-card p{margin:0 0 12px;font-size:14px;line-height:1.35;color:#e8e8ed}'+
    '#hs-card .hs-go{display:inline-flex;gap:7px;align-items:center;padding:10px 16px;border-radius:999px;border:1px solid #5dffa088;background:#07210f;color:#7dffb0;font-weight:800;font-size:14px}'+
    '#hs-card:active{filter:brightness(1.15)}'+
    '#hs-ov{position:fixed;inset:0;z-index:2000;width:100%;max-width:480px;margin:0 auto;background:#050306;overflow:hidden;transform:translateY(-100%);transition:transform .65s cubic-bezier(.2,.8,.2,1)}'+
    '#hs-ov.hs-down{transform:none}'+
    '#hs-ov iframe{position:absolute;inset:0;display:block;width:100%;height:100%;border:0;background:#050306}'+
    '#hs-intro{position:absolute;inset:0;z-index:2;background:#050306;transition:opacity .7s ease}'+
    '#hs-intro.hs-gone{opacity:0;pointer-events:none}'+
    /* the video can't be tapped, paused or scrubbed: no controls, and a cover sits over it */
    '#hs-intro video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}'+
    '#hs-intro .hs-shield{position:absolute;inset:0}'+
    '#hs-enter{position:absolute;left:50%;bottom:calc(9% + env(safe-area-inset-bottom));z-index:3;transform:translate(-50%,24px);opacity:0;pointer-events:none;'+
      'padding:16px 46px;border-radius:999px;border:2px solid #7dffb0;background:#04140bdd;color:#b9ffd6;font:900 20px/1 system-ui,sans-serif;letter-spacing:6px;text-transform:uppercase;cursor:pointer;'+
      'box-shadow:0 0 22px #3dff8f88,inset 0 0 18px #3dff8f44;text-shadow:0 0 10px #3dff8f;transition:opacity .6s ease,transform .6s cubic-bezier(.2,.8,.2,1)}'+
    '#hs-enter.hs-show{opacity:1;transform:translate(-50%,0);pointer-events:auto;animation:hsglow 1.8s ease-in-out .6s infinite}'+
    '#hs-enter:active{background:#0b3a1f}'+
    '@keyframes hsglow{50%{box-shadow:0 0 38px #3dff8fcc,inset 0 0 22px #3dff8f66}}'+
    '#hs-x{position:absolute;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:4;width:42px;height:42px;border-radius:50%;border:1px solid #ff8a1f88;background:#050306cc;color:#ffb347;font-size:26px;line-height:1;cursor:pointer}'+
    '@media (prefers-reduced-motion:reduce){#hs-ov{transition:transform .2s}#hs-enter.hs-show{animation:none}}';
    document.head.appendChild(css);

    var card=document.createElement('button');
    card.id='hs-card';card.type='button';card.setAttribute('aria-label','Open Hollow Signal, a limited-time Halloween thank-you');
    card.innerHTML='<img class="hs-bg" alt="" src="'+DIR+'card.jpg">'+
      '<span class="hs-copy"><span class="hs-tag">Limited time · Halloween</span>'+
      '<h3>HOLLOW SIGNAL</h3>'+
      '<p>Our thank-you to you, Depew! A spooky ghost-hunting field kit, free for about two months this Halloween season.</p>'+
      '<span class="hs-go">Tap to enter <span aria-hidden="true">▶</span></span></span>';
    // sits under the Candy Jar game, above the "Made by" footer
    var foot=main.querySelector('.made-by');
    if(foot)main.insertBefore(card,foot);else main.appendChild(card);

    var ov=null,pausedVids=[];
    function open(){
      if(ov)return;
      ov=document.createElement('div');ov.id='hs-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Hollow Signal');

      // the app loads quietly underneath while the intro plays
      var fr=document.createElement('iframe');fr.title='Hollow Signal';
      fr.setAttribute('allow','camera; microphone; autoplay; fullscreen; screen-wake-lock; accelerometer; gyroscope; magnetometer');
      fr.src=DIR+'index.html';

      var intro=document.createElement('div');intro.id='hs-intro';
      var v=document.createElement('video');
      v.src=DIR+'intro.mp4';v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
      v.preload='auto';v.disablePictureInPicture=true;v.setAttribute('disablepictureinpicture','');
      v.setAttribute('controlslist','nodownload nofullscreen noremoteplayback');v.setAttribute('aria-hidden','true');
      var shield=document.createElement('div');shield.className='hs-shield';
      var enter=document.createElement('button');enter.id='hs-enter';enter.type='button';enter.textContent='Enter';
      intro.appendChild(v);intro.appendChild(shield);intro.appendChild(enter);

      var x=document.createElement('button');x.id='hs-x';x.type='button';x.setAttribute('aria-label','Close Hollow Signal');x.textContent='×';
      ov.appendChild(fr);ov.appendChild(intro);ov.appendChild(x);document.body.appendChild(ov);
      document.documentElement.style.overflow='hidden';
      try{[].forEach.call(document.querySelectorAll('main video'),function(el){if(!el.paused){pausedVids.push(el);el.pause()}})}catch(e){}

      // start the video right inside the tap so the phone allows sound
      v.muted=false;
      var p=v.play();
      if(p&&p.catch)p.catch(function(){v.muted=true;v.play().catch(function(){})});

      // after the first play, show ENTER and keep the video looping (quietly)
      var shown=false;
      function showEnter(){
        if(shown)return;shown=true;
        enter.classList.add('hs-show');
        v.muted=true;v.loop=true;
        try{v.currentTime=0}catch(e){}
        v.play().catch(function(){});
        try{enter.focus({preventScroll:true})}catch(e){}
      }
      v.addEventListener('ended',showEnter);
      v.addEventListener('error',showEnter); // if the video can't load, don't trap anyone
      // never allow pausing: if something pauses it before ENTER, start it again
      v.addEventListener('pause',function(){if(ov&&!intro.classList.contains('hs-gone')&&!v.ended)v.play().catch(function(){})});

      enter.addEventListener('click',function(){
        intro.classList.add('hs-gone');
        setTimeout(function(){try{v.pause();v.removeAttribute('src');v.load()}catch(e){}if(intro.parentNode)intro.parentNode.removeChild(intro)},750);
        try{fr.focus()}catch(e){}
      });
      x.addEventListener('click',close);
      document.addEventListener('keydown',esc);

      // slide the panel down
      void ov.offsetWidth;
      requestAnimationFrame(function(){ov.classList.add('hs-down')});
    }
    function esc(e){if(e.key==='Escape')close()}
    function close(){
      if(!ov)return;
      document.removeEventListener('keydown',esc);
      var el=ov;ov=null;
      try{var vv=el.querySelector('video');if(vv)vv.pause()}catch(e){}
      el.classList.remove('hs-down');
      setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},reduce?200:650);
      document.documentElement.style.overflow='';
      pausedVids.forEach(function(el){try{el.play()}catch(e){}});pausedVids=[];
    }
    card.addEventListener('click',open);
  });
})();
