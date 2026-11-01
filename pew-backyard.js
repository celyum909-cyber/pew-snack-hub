/* Depew Snack Hub - Backyard Toss game.
   A small slanted "PLAY" button in the red area just below the NFL ticker (same size as the ticker's NFL tag).
   Tapping it opens the Backyard Toss game (backyard/index.html) full screen, with a × bar on top to close it.
   Loaded by pew-catalog.js. To remove it, delete the "pew-backyard.js" block at the bottom of pew-catalog.js. */
(function(){
  var css = document.createElement('style');
  css.textContent =
    '#bt-play{position:relative;z-index:4;display:block;width:max-content;margin:4px 0 -22px 16px;padding:3px;border:0;background:linear-gradient(90deg,#2f8f3a,#ffe340);transform:skewY(-6deg);filter:drop-shadow(0 8px 10px #0008);cursor:pointer;-webkit-tap-highlight-color:transparent;font:inherit}' +
    '#bt-play span{display:flex;align-items:center;gap:6px;height:38px;padding:0 14px;background:#020203;color:#ffe340;font-size:13px;font-weight:950;letter-spacing:1px}' +
    '#bt-play b{color:#fff;font-size:11px}' +
    '#bt-play:active{filter:brightness(1.15) drop-shadow(0 8px 10px #0008)}' +
    '#bt-ov{position:fixed;inset:0;z-index:1000;width:100%;max-width:480px;margin:auto;background:#07130e;display:flex;flex-direction:column}' +
    '#bt-ov[hidden]{display:none}' +
    '#bt-ov .bt-bar{flex:none;display:flex;align-items:center;justify-content:space-between;padding:calc(6px + env(safe-area-inset-top)) 10px 6px 14px;background:#020203;border-bottom:3px solid;border-image:linear-gradient(90deg,#2f8f3a,#ffe340) 1}' +
    '#bt-ov .bt-bar strong{font-size:14px;font-weight:950;letter-spacing:1px;color:#ffe340}' +
    '#bt-ov .bt-x{width:40px;height:40px;border-radius:50%;border:1px solid #ffffff50;background:#1a222d;color:#fff;font-size:26px;line-height:1;cursor:pointer}' +
    '#bt-ov iframe{flex:1;width:100%;border:0;background:#07130e}';

  var btn, ov, frame, video, wasPlaying = false;

  function place(){
    var nfl = document.getElementById('pew-nfl'), deal = document.getElementById('deal');
    if (nfl && nfl.parentNode) nfl.insertAdjacentElement('afterend', btn);   // right below the NFL ticker
    else if (deal) deal.insertAdjacentElement('afterend', btn);
  }
  function open(){
    if (!frame.src) frame.src = 'backyard/?v=1';
    video = document.getElementById('hero-video');
    wasPlaying = video && !video.paused; if (video) video.pause();
    ov.hidden = false; document.body.classList.add('game-open');
    ov.querySelector('.bt-x').focus();
  }
  function close(){
    ov.hidden = true; document.body.classList.remove('game-open');
    if (video && wasPlaying) video.play().catch(function(){});
    btn.focus({preventScroll: true});
  }

  function start(){
    if (!document.getElementById('deal')) return;
    document.head.appendChild(css);
    btn = document.createElement('button');
    btn.id = 'bt-play'; btn.type = 'button'; btn.setAttribute('aria-label', 'Play Backyard Toss');
    btn.innerHTML = '<span>🏈 PLAY <b>▶</b></span>';
    ov = document.createElement('section');
    ov.id = 'bt-ov'; ov.hidden = true; ov.setAttribute('aria-label', 'Backyard Toss game');
    ov.innerHTML = '<div class="bt-bar"><strong>🏈 BACKYARD TOSS</strong><button type="button" class="bt-x" aria-label="Close Backyard Toss">×</button></div><iframe title="Backyard Toss game"></iframe>';
    frame = ov.querySelector('iframe');
    document.body.appendChild(ov);
    place();
    // the NFL ticker may be added a moment later; keep the button right below it
    setTimeout(place, 1500); setTimeout(place, 4500);
    btn.addEventListener('click', open);
    ov.querySelector('.bt-x').addEventListener('click', close);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !ov.hidden) close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
