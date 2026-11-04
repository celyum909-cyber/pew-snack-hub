/* Depew Snack Hub - Cube Tetris (limited-time test build).
   A small slanted "BETA" button right beside the PLAY button (next to the NFL tag).
   Tapping it opens the Cube Tetris test game (cube/index.html) full screen:
   - a bar on top: the game name, "LIMITED-TIME TEST BUILD", and × to close
   - a "Leave a comment" tab under the game, tappable any time while playing. Comments go to the server
     and only the store owner login can read them (owner app → Comments).
   Loaded by pew-catalog.js. To remove it, delete the "pew-cube.js" block at the bottom of pew-catalog.js. */
(function(){
  var API = 'https://pew-deal.celyum909.workers.dev';
  var css = document.createElement('style');
  css.textContent =
    /* the BETA button: same size and slant as PLAY and the NFL tag, on the same line as PLAY */
    '#ct-play{position:relative;z-index:4;display:inline-block;vertical-align:top;width:max-content;margin:-6px 0 6px 10px;padding:3px;border:0;background:linear-gradient(90deg,#7fd3ff,#b47cff);transform:skewY(-6deg);filter:drop-shadow(0 8px 10px #0008);cursor:pointer;-webkit-tap-highlight-color:transparent;font:inherit}' +
    '#pew-nfl.closed + #bt-play + #ct-play{margin-top:0}' +
    '#ct-play span{display:flex;align-items:center;gap:6px;height:38px;padding:0 14px;background:#020203;color:#b9e6ff;font-size:13px;font-weight:950;letter-spacing:1px}' +
    '#ct-play b{color:#fff;font-size:11px}' +
    /* NFL tag, PLAY and BETA share one line on a phone, even when the tag says GAME IS ON! */
    '#pew-nfl.closed .nfl-tag{padding:0 10px;letter-spacing:.4px}#bt-play span,#ct-play span{padding:0 10px;letter-spacing:.4px}#bt-play,#ct-play{margin-left:8px}#pew-nfl.closed{margin-left:12px}' +
    '#ct-play:active{filter:brightness(1.15) drop-shadow(0 8px 10px #0008)}' +
    /* the game window */
    '#ct-ov{position:fixed;inset:0;z-index:1000;width:100%;max-width:480px;margin:auto;background:#cdc8d8;display:flex;flex-direction:column}' +
    '#ct-ov[hidden]{display:none}' +
    '#ct-ov .ct-bar{flex:none;display:flex;align-items:center;gap:10px;padding:calc(6px + env(safe-area-inset-top)) 10px 6px 14px;background:#020203;border-bottom:3px solid;border-image:linear-gradient(90deg,#7fd3ff,#b47cff) 1}' +
    '#ct-ov .ct-name{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}' +
    '#ct-ov .ct-name strong{font-size:14px;font-weight:950;letter-spacing:1px;color:#b9e6ff}' +
    '#ct-ov .ct-name small{font-size:10px;font-weight:900;letter-spacing:1.2px;color:#ffe340}' +
    '#ct-ov .ct-x{flex:none;width:40px;height:40px;border-radius:50%;border:1px solid #ffffff50;background:#1a222d;color:#fff;font-size:26px;line-height:1;cursor:pointer}' +
    '#ct-ov iframe{flex:1;min-height:0;width:100%;border:0;background:#cdc8d8}' +
    /* the comment tab under the game, and the panel it opens */
    '#ct-ov .ct-tab{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;padding:8px 14px calc(8px + env(safe-area-inset-bottom));border:0;border-top:3px solid #b47cff;background:#020203;color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}' +
    '#ct-ov .ct-tab span{color:#b9e6ff}' +
    '#ct-ov .ct-sheet{position:absolute;left:0;right:0;bottom:0;z-index:2;background:#0b0f14;color:#e8edf2;border-radius:18px 18px 0 0;border-top:4px solid #b47cff;padding:14px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -12px 30px #0009;font-family:inherit;animation:ctup .22s ease-out}' +
    '#ct-ov .ct-sheet[hidden]{display:none}' +
    '@keyframes ctup{from{transform:translateY(30px);opacity:0}}' +
    '#ct-ov .ct-sheet h3{margin:0 0 4px;font-size:18px;font-weight:950}' +
    '#ct-ov .ct-sheet p{margin:0 0 10px;font-size:13px;color:#9fb0c2;line-height:1.4}' +
    '#ct-ov .ct-sheet textarea,#ct-ov .ct-sheet input{display:block;width:100%;box-sizing:border-box;margin:0 0 8px;padding:11px 12px;border-radius:12px;border:1px solid #ffffff30;background:#1a222d;color:#fff;font:inherit;font-size:16px}' +
    '#ct-ov .ct-sheet textarea{min-height:96px;resize:vertical}' +
    '#ct-ov .ct-row{display:flex;gap:8px;margin-top:4px}' +
    '#ct-ov .ct-row button{flex:1;padding:13px;border-radius:12px;border:1px solid #ffffff30;background:#1a222d;color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}' +
    '#ct-ov .ct-row .ct-send{background:linear-gradient(90deg,#3a8dde,#8a4fe0);border-color:transparent}' +
    '#ct-ov .ct-row button:disabled{opacity:.6}' +
    '#ct-ov .ct-msg{min-height:18px;margin-top:8px;font-size:13px;font-weight:700}' +
    '#ct-ov .ct-msg.ok{color:#9dff57}#ct-ov .ct-msg.bad{color:#ff8a8a}';

  var btn, ov, frame, sheet, video, wasPlaying = false;

  function place(){
    var play = document.getElementById('bt-play'), nfl = document.getElementById('pew-nfl'), deal = document.getElementById('deal');
    if (play && play.parentNode) play.insertAdjacentElement('afterend', btn);   // right beside PLAY
    else if (nfl && nfl.parentNode) nfl.insertAdjacentElement('afterend', btn);
    else if (deal) deal.insertAdjacentElement('afterend', btn);
  }
  function open(){
    if (!frame.src) frame.src = 'cube/?v=1';
    video = document.getElementById('hero-video');
    wasPlaying = video && !video.paused; if (video) video.pause();
    ov.hidden = false; document.body.classList.add('game-open');
    ov.querySelector('.ct-x').focus();
  }
  function close(){
    sheet.hidden = true;
    ov.hidden = true; document.body.classList.remove('game-open');
    if (video && wasPlaying) video.play().catch(function(){});
    btn.focus({preventScroll: true});
  }
  function msg(t, kind){ var m = sheet.querySelector('.ct-msg'); m.textContent = t || ''; m.className = 'ct-msg' + (kind ? ' ' + kind : ''); }
  function send(){
    var ta = sheet.querySelector('textarea'), nm = sheet.querySelector('input'), go = sheet.querySelector('.ct-send');
    var text = ta.value.trim();
    if (text.length < 2){ msg('Please write a comment first.', 'bad'); ta.focus(); return; }
    var ua = navigator.userAgent || '', p = /iPhone|iPad|iPod/.test(ua) ? 'i' : /Android/.test(ua) ? 'a' : 'o';
    go.disabled = true; go.textContent = 'Sending…'; msg('');
    fetch(API + '/feedback', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({game: 'cube', text: text, name: nm.value.trim(), p: p})})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return {ok: r.ok, j: j}; }); })
      .then(function(x){
        if (!x.ok){ msg(x.j.error || "Couldn't send it. Please try again.", 'bad'); return; }
        ta.value = ''; msg('Thanks! Your comment was sent to the store. 🙌', 'ok');
        setTimeout(function(){ if (!sheet.hidden && !ta.value) sheet.hidden = true; msg(''); }, 2200);
      })
      .catch(function(){ msg("Couldn't reach the store. Check your internet and try again.", 'bad'); })
      .then(function(){ go.disabled = false; go.textContent = 'Send'; });
  }

  function start(){
    if (!document.getElementById('deal')) return;
    document.head.appendChild(css);
    btn = document.createElement('button');
    btn.id = 'ct-play'; btn.type = 'button'; btn.setAttribute('aria-label', 'Play Cube Tetris, a test game');
    btn.innerHTML = '<span>🧊 BETA <b>▶</b></span>';
    ov = document.createElement('section');
    ov.id = 'ct-ov'; ov.hidden = true; ov.setAttribute('aria-label', 'Cube Tetris test game');
    ov.innerHTML =
      '<div class="ct-bar"><div class="ct-name"><strong>🧊 CUBE TETRIS</strong><small>LIMITED-TIME TEST BUILD</small></div><button type="button" class="ct-x" aria-label="Close Cube Tetris">×</button></div>' +
      '<iframe title="Cube Tetris test game"></iframe>' +
      '<button type="button" class="ct-tab" aria-haspopup="dialog">💬 <span>Leave a comment</span> about this test game</button>' +
      '<div class="ct-sheet" role="dialog" aria-label="Leave a comment" hidden>' +
        '<h3>Tell us what you think</h3><p>Bugs, ideas, too hard, too easy? Only the store sees your comment.</p>' +
        '<textarea maxlength="600" placeholder="Type your comment…" aria-label="Your comment"></textarea>' +
        '<input maxlength="30" placeholder="Your name (optional)" aria-label="Your name (optional)" autocomplete="nickname">' +
        '<div class="ct-row"><button type="button" class="ct-cancel">Back to the game</button><button type="button" class="ct-send">Send</button></div>' +
        '<div class="ct-msg" role="status" aria-live="polite"></div>' +
      '</div>';
    frame = ov.querySelector('iframe'); sheet = ov.querySelector('.ct-sheet');
    document.body.appendChild(ov);
    place();
    // PLAY and the NFL ticker may be added a moment later; keep BETA right beside PLAY
    setTimeout(place, 2000); setTimeout(place, 5000);
    btn.addEventListener('click', open);
    ov.querySelector('.ct-x').addEventListener('click', close);
    ov.querySelector('.ct-tab').addEventListener('click', function(){ sheet.hidden = !sheet.hidden; if (!sheet.hidden) sheet.querySelector('textarea').focus(); });
    ov.querySelector('.ct-cancel').addEventListener('click', function(){ sheet.hidden = true; msg(''); });
    ov.querySelector('.ct-send').addEventListener('click', send);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !ov.hidden){ if (!sheet.hidden) sheet.hidden = true; else close(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
