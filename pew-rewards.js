/* Depew Snack Hub — rewards punch card.
   1 punch per purchase of $10 or more. 10 punches = a free bag of chips.
   Staff make a one-time QR code in the owner app (owner.html → Punch). The customer scans it with the phone
   camera (opens this site with ?punch=CODE) or with "Scan code" inside the app, and one hole is punched.
   The card is saved on the Cloudflare Worker under the customer's phone number, so it follows them to any phone,
   browser or the installed app. Punches saved on a phone before this (localStorage "pew-rewards") are carried over once.
   Loaded by pew-catalog.js. To remove the feature, delete the "pew-rewards.js" block at the bottom of pew-catalog.js. */
(function(){
  /* ON/OFF SWITCH: false = punch card hidden on the live store. Change to true to turn it back on. */
  var PUNCH_CARD_ON = false;
  if(!PUNCH_CARD_ON) return;

  var W = 'https://pew-deal.celyum909.workers.dev';
  var R = { punches: 10, minSale: 10, reward: 'free bag of chips', store: 'Depew Snack Hub' };
  var KEY = 'pew-rewards';            // old on-phone card (before phone numbers); only read to carry punches over
  var PHONE_KEY = 'pew-rewards-phone', CACHE_KEY = 'pew-rewards-card';
  var JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'; // only loaded if the phone has no built-in QR reader

  function getJ(k){ try{ var v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; }catch(e){ return null; } }
  function setLS(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }catch(e){} }
  var phone = (function(){ try{ return localStorage.getItem(PHONE_KEY) || ''; }catch(e){ return ''; } })();
  var legacy = getJ(KEY) || {};
  function legacyLeft(){ return legacy.carried ? 0 : Math.max(0, Math.min(R.punches, (legacy.punches | 0) - (legacy.claimed | 0) * R.punches)); }
  function norm(c){ c = c || {}; return {punches: c.punches | 0, claimed: c.claimed | 0, log: Array.isArray(c.log) ? c.log : [], last4: c.last4 || ''}; }
  // what the card shows: the server card (cached on this phone for a fast first paint), or old on-phone punches before a number is added
  var rw = phone ? norm(getJ(CACHE_KEY)) : norm({punches: legacyLeft()});
  function useCard(c){ rw = norm(c); setLS(CACHE_KEY, rw); }
  function api(path, body){
    return fetch(W + path, body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {cache: 'no-store'})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return {ok: r.ok, j: j}; }); });
  }
  function digits(v){ var d = String(v || '').replace(/\D/g, ''); if(d.length === 11 && d[0] === '1') d = d.slice(1); return /^[2-9]\d{9}$/.test(d) ? d : ''; }
  var pendingCode = null;
  function onCard(){ return Math.max(0, rw.punches - rw.claimed * R.punches); }
  function shown(){ return Math.min(R.punches, onCard()); }
  var fresh = -1, armT;

  var css = document.createElement('style');
  css.textContent =
  /* tokens: Snack Hub red card, yellow highlights, gold FREE spot; holes show the dark sheet behind */
  '#rw-ov,#rw-strip{--brand:#ed0015;--on-brand:#fff;--member:#ffe340;--accent:#0756d9;--reward:#ffd43b;--highlight:#ffe340;--bg:#0b0b10;--ink:#f3f3f7;--muted:#a9a9b4;--panel:#15151c;--panel-2:#22222b;--line:#ffffff1c;--shadow:0 12px 30px #000c}'+
  /* entry strip on the page, same slanted style as the game strip */
  '#rw-strip{position:relative;width:100%;margin:46px 0 0;padding:5px 0;background:linear-gradient(90deg,#ffd43b,#ffb020);transform:skewY(-6deg);filter:drop-shadow(0 12px 15px #0008)}'+
  '#rw-strip+.game-feature{margin-top:26px}'+
  '#rw-open{display:flex;width:100%;align-items:center;gap:14px;min-height:92px;padding:14px 17px;border:0;background:#020203;color:#fff;text-align:left;box-shadow:inset 0 1px 0 #ffffff18}'+
  '#rw-open:active{filter:brightness(1.08)}'+
  '.rw-mini{flex:none;display:grid;grid-template-columns:repeat(5,13px);gap:5px;padding:9px;border-radius:10px;background:linear-gradient(135deg,#ed0015,#8a000c)}'+
  '.rw-mini i{width:13px;height:13px;border-radius:50%;border:1.5px dashed #ffffff80}'+
  '.rw-mini i.on{border:0;background:#020203;box-shadow:0 0 0 2px #ffe340aa}'+
  '.rw-mini i.p{border:1.5px solid #ffd43b}.rw-mini i.p.on{box-shadow:0 0 0 2px #ffd43b}'+
  '.rw-st{min-width:0;flex:1}.rw-st small{display:block;font-size:12px;font-weight:900;letter-spacing:1.4px;color:#ffe340}'+
  '.rw-st b{display:block;font-size:clamp(17px,4.6vw,21px);font-weight:950;line-height:1.1;text-transform:lowercase;letter-spacing:-.4px}'+
  '.rw-st span{display:block;font-size:13px;color:#c9c9d2;margin-top:3px}'+
  '.rw-go{flex:none;font-size:24px;color:#ffd43b}'+
  '#rw-strip.full #rw-open{box-shadow:inset 0 0 0 2px #ffd43b}'+
  /* full-screen sheet */
  '#rw-ov{position:fixed;inset:0;z-index:1600;background:#000c;display:flex;align-items:flex-end;justify-content:center}'+
  '#rw-ov[hidden]{display:none}'+
  '#rw-sheet{width:100%;max-width:480px;max-height:94%;overflow:auto;background:var(--bg);color:var(--ink);border-radius:20px 20px 0 0;padding:16px 16px calc(24px + env(safe-area-inset-bottom));font-family:inherit}'+
  '.rw-top{display:flex;justify-content:space-between;align-items:center;margin:0 0 14px}.rw-top h2{margin:0;font-size:22px;font-weight:950;text-transform:uppercase;letter-spacing:-.4px}'+
  '.rw-x{width:40px;height:40px;border-radius:50%;border:1px solid #ffffff30;background:var(--panel-2);color:#fff;font-size:24px;line-height:1}'+
  '#rw-sheet h3{margin:22px 0 6px;font-size:13px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted)}'+
  '#rw-sheet p{font-size:14px;line-height:1.45;color:#c9c9d2;margin:6px 0}'+
  '.rw-toast{margin:0 0 14px;padding:12px 14px;border-radius:12px;font-weight:800;font-size:15px;text-align:center;background:#0f3d24;border:1px solid #3ddc84;color:#bff5d6}'+
  '.rw-toast.bad{background:#3a0d12;border-color:#ff5a66;color:#ffc7cc}'+
  /* the punch card (from the shop-punch-card template) */
  '.pcard{position:relative;max-width:440px;margin:0 auto;border-radius:20px;color:var(--on-brand);background:linear-gradient(135deg,var(--brand),color-mix(in srgb,var(--brand) 55%,#000));box-shadow:var(--shadow);overflow:hidden;isolation:isolate}'+
  '.pcard::after{content:"";position:absolute;right:-50px;bottom:-80px;width:210px;height:210px;border-radius:50%;background:var(--member);opacity:.2;z-index:-1}'+
  '.pcard::before{content:"";position:absolute;left:-50px;top:-70px;width:150px;height:150px;border-radius:50%;background:var(--accent);opacity:.18;z-index:-1}'+
  '.pc-notch{position:absolute;top:66px;width:22px;height:22px;border-radius:50%;background:var(--bg);box-shadow:inset 0 2px 3px rgba(0,0,0,.3)}'+
  '.pc-notch.l{left:-11px}.pc-notch.r{right:-11px}'+
  '.pc-top{display:flex;align-items:center;gap:12px;padding:18px 18px 16px}'+
  '.pc-logo{width:42px;height:42px;border-radius:11px;flex:none;display:grid;place-items:center;font-weight:900;font-size:14px;background:#020203;color:#fff;overflow:hidden}'+
  '.pc-logo img{width:118%;height:118%;object-fit:contain}'+
  '.pc-top small{display:block;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;font-weight:900;color:var(--highlight)}'+
  '.pc-top b{display:block;font-size:21px;line-height:1.15;font-weight:950}'+
  '.pc-no{margin-left:auto;align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:1px;opacity:.75;white-space:nowrap}'+
  '.pc-body{padding:16px 20px 14px;border-top:2px dashed color-mix(in srgb,var(--on-brand) 35%,transparent)}'+
  '.holes{display:grid;grid-template-columns:repeat(5,1fr);gap:12px 14px}'+
  '.hole{position:relative;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;border:2px dashed color-mix(in srgb,var(--on-brand) 45%,transparent);color:color-mix(in srgb,var(--on-brand) 75%,transparent);font-size:14px;font-weight:800}'+
  '.hole.prize{border:2px solid var(--reward);color:var(--reward);font-size:10px;font-weight:900;letter-spacing:.6px;flex-direction:column;line-height:1;gap:2px}'+
  '.hole.prize svg{width:16px;height:16px;fill:var(--reward)}'+
  '.hole.on{border:0;background:var(--bg);box-shadow:inset 0 5px 7px rgba(0,0,0,.6),0 0 0 3px color-mix(in srgb,var(--member) 60%,transparent)}'+
  '.hole.on>*{visibility:hidden}'+
  '.hole.prize.on{box-shadow:inset 0 5px 7px rgba(0,0,0,.6),0 0 0 3px var(--reward)}'+
  '.hole.new{animation:rwpunch .45s cubic-bezier(.2,1.5,.4,1) both}'+
  '.hole.new::after{content:"";position:absolute;inset:8%;border-radius:50%;background:var(--brand);box-shadow:0 2px 4px rgba(0,0,0,.3);animation:rwchad .9s ease-in both;animation-delay:inherit}'+
  '@keyframes rwpunch{from{transform:scale(.3);opacity:0}}'+
  '@keyframes rwchad{0%{transform:none;opacity:1}100%{transform:translate(14px,70px) rotate(220deg) scale(.7);opacity:0}}'+
  '@media (prefers-reduced-motion:reduce){.hole.new{animation:none}.hole.new::after{display:none}}'+
  '.pc-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--on-brand) 22%,transparent);font-size:13px}'+
  '.pc-foot b{font-size:15px}'+
  '.pcard.full{box-shadow:0 0 0 3px var(--reward),0 0 0 7px color-mix(in srgb,var(--reward) 30%,transparent),var(--shadow)}'+
  '.pc-note{margin:16px 0 0!important;text-align:center}'+
  '.rw-bar{height:8px;border-radius:4px;background:var(--panel-2);margin:14px 0 8px;overflow:hidden}'+
  '.rw-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--reward));border-radius:4px;transition:width .5s}'+
  '.rw-bt{display:flex;justify-content:space-between;font-size:13px;color:var(--muted)}.rw-bt b{color:var(--ink)}'+
  '.rw-ready{margin-top:14px;padding:16px;border-radius:16px;text-align:center;background:color-mix(in srgb,var(--reward) 18%,var(--panel));border:1px solid var(--reward)}'+
  '.rw-ready h4{margin:0 0 4px;font-size:20px;font-weight:950}'+
  '.rw-btn{display:block;width:100%;margin-top:12px;padding:15px;border:1px solid #ffffff30;border-radius:12px;background:var(--panel-2);color:#fff;font-weight:900;font-size:16px}'+
  '.rw-btn.red{background:var(--brand);border-color:var(--brand)}'+
  '.rw-ready .rw-btn{background:var(--panel)}.rw-ready .rw-btn.arm{background:var(--reward);color:#111;border-color:var(--reward)}'+
  '.rw-row{display:flex;gap:8px;margin-top:10px}.rw-row input{flex:1;min-width:0;padding:13px;border-radius:12px;border:1px solid #ffffff30;background:var(--panel-2);color:#fff;font:inherit;font-size:18px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}'+
  '.rw-row .rw-btn{width:auto;margin:0;padding:13px 18px}'+
  '.rw-cam{position:relative;margin-top:12px;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:1}'+
  '.rw-cam video{width:100%;height:100%;object-fit:cover;display:block}'+
  '.rw-cam::after{content:"";position:absolute;inset:18%;border:3px solid #ffd43b;border-radius:16px;box-shadow:0 0 0 999px #0006}'+
  '.rw-cam span{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:13px;font-weight:800;color:#fff;z-index:1;text-shadow:0 1px 3px #000}'+
  '.rw-who{text-align:center;margin:14px 0 0!important;font-size:13px!important}.rw-link{background:none;border:0;padding:0;color:#ffe340;font:inherit;font-weight:800;text-decoration:underline}'+
  '.rw-phone{margin-top:18px;padding:16px;border-radius:16px;background:var(--panel);border:1px solid #ffd43b88}.rw-phone h4{margin:0 0 6px;font-size:18px;font-weight:950}'+
  '.rw-phone .rw-row input{letter-spacing:.04em;text-transform:none}'+
  '.rw-hist{list-style:none;padding:0;margin:0}.rw-hist li{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}';
  document.head.appendChild(css);

  function el(t, c, h){ var e = document.createElement(t); if(c) e.className = c; if(h != null) e.innerHTML = h; return e; }
  var strip = el('section'); strip.id = 'rw-strip'; strip.setAttribute('aria-label', 'Rewards card');
  var ov = el('div'); ov.id = 'rw-ov'; ov.hidden = true;
  var sheet = el('div'); sheet.id = 'rw-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Your rewards card'); ov.append(sheet);
  var toast = null, stream = null, scanning = false;

  function paintStrip(){
    var n = shown(), full = n >= R.punches, dots = '';
    for(var i = 0; i < R.punches; i++) dots += '<i class="' + (i < n ? 'on' : '') + (i === R.punches - 1 ? ' p' : '') + '"></i>';
    strip.className = full ? 'full' : '';
    strip.innerHTML = '<button type="button" id="rw-open"><span class="rw-mini" aria-hidden="true">' + dots + '</span><span class="rw-st"><small>REWARDS CARD</small><b>' +
      (full ? 'your free bag of chips is ready!' : n + ' of ' + R.punches + ' punched') + '</b><span>' +
      (full ? 'Tap to show it at the counter' : phone ? '$' + R.minSale + '+ purchase = 1 punch' : 'Tap to start your card') + '</span></span><span class="rw-go" aria-hidden="true">›</span></button>';
    strip.querySelector('#rw-open').onclick = function(){ openSheet(); };
  }

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"/></svg>';
  function render(){
    var n = shown(), full = n >= R.punches, extra = onCard() - R.punches;
    var A = window.__PEW_ASSETS__, logoSrc = A && A['assets/logo.png'];
    var holes = '';
    for(var i = 0; i < R.punches; i++){
      var on = i < n, last = i === R.punches - 1;
      holes += '<span class="hole' + (on ? ' on' : '') + (last ? ' prize' : '') + (on && fresh >= 0 && i >= fresh ? ' new' : '') + '" style="animation-delay:' + (Math.max(0, i - fresh) * .15) + 's">' + (last ? STAR + '<span>FREE</span>' : '<span>' + (i + 1) + '</span>') + '</span>';
    }
    var left = R.punches - n;
    sheet.innerHTML =
      '<div class="rw-top"><h2>Rewards</h2><button class="rw-x" type="button" aria-label="Close">×</button></div>' +
      (toast ? '<div class="rw-toast' + (toast.bad ? ' bad' : '') + '" role="status">' + toast.text + '</div>' : '') +
      '<div class="pcard' + (full ? ' full' : '') + '" role="img" aria-label="' + R.store + ' rewards card: ' + n + ' of ' + R.punches + ' punched">' +
        '<span class="pc-notch l"></span><span class="pc-notch r"></span>' +
        '<div class="pc-top"><span class="pc-logo">' + (logoSrc ? '<img src="' + logoSrc + '" alt="">' : 'SH') + '</span><div><small>Rewards card</small><b>' + R.store + '</b></div><span class="pc-no">No. ' + String(rw.claimed + 1).padStart(3, '0') + '</span></div>' +
        '<div class="pc-body"><div class="holes">' + holes + '</div>' +
        '<div class="pc-foot"><span>1 punch per purchase of $' + R.minSale + '+</span><span><b>' + n + '</b> of ' + R.punches + ' punched</span></div></div>' +
      '</div>' +
      '<p class="pc-note">Fill all ' + R.punches + ' for a <b>' + R.reward + '</b>.</p>' +
      '<div class="rw-bar"><i style="width:' + (n / R.punches * 100) + '%"></i></div>' +
      '<div class="rw-bt"><span><b>' + n + '</b> of ' + R.punches + ' punches</span><span>' + (full ? 'Card complete' : left + (left === 1 ? ' more purchase' : ' more purchases') + ' to go') + '</span></div>' +
      (full ? '<div class="rw-ready"><h4>You\'ve earned a ' + R.reward + '!</h4><p>Show this screen at the counter to claim it.</p>' + (extra > 0 ? '<p>' + extra + (extra === 1 ? ' punch carries' : ' punches carry') + ' over to your next card.</p>' : '') + '<button type="button" class="rw-btn" id="rw-claim">Staff: mark as claimed</button></div>' : '') +
      (phone ?
      '<p class="rw-who">Card for the number ending <b>' + (rw.last4 || phone.slice(-4)) + '</b> · <button type="button" class="rw-link" id="rw-change">Not you? Change number</button></p>' +
      '<h3>Get a punch</h3><p>Spend $' + R.minSale + ' or more in one purchase and ask at the counter for your punch code.</p>' +
      '<button type="button" class="rw-btn red" id="rw-scan">' + (scanning ? 'Stop camera' : 'Scan code') + '</button>' +
      (scanning ? '<div class="rw-cam"><video playsinline muted autoplay></video><span>Point at the code on the counter phone</span></div>' : '') +
      '<div class="rw-row"><input id="rw-code" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC123" aria-label="Punch code"><button type="button" class="rw-btn" id="rw-type">Add</button></div>'
      :
      '<div class="rw-phone"><h4>' + (pendingCode ? 'Add your phone number to get this punch' : 'Start your card with your phone number') + '</h4>' +
      '<p>Your card is saved under your number, so it follows you to any phone or the Snack Hub app. Use the same number every time.' + (legacyLeft() ? ' The ' + legacyLeft() + (legacyLeft() === 1 ? ' punch' : ' punches') + ' already on this phone will move onto it.' : '') + '</p>' +
      '<div class="rw-row"><input id="rw-tel" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="(716) 555-0123" aria-label="Phone number"><button type="button" class="rw-btn red" id="rw-link">' + (pendingCode ? 'Add punch' : 'Start') + '</button></div></div>') +
      '<h3>Your punches</h3>' + (rw.log.length ? '<ul class="rw-hist">' + rw.log.slice(0, 8).map(function(o){ return '<li><span>' + new Date(o.at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) + ' · ' + new Date(o.at).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'}) + '</span><span>' + (o.claim ? R.reward + ' claimed' : o.carried ? '+' + o.carried + ' moved over' : '+1') + '</span></li>'; }).join('') + '</ul>' : '<p>No punches yet. Your first purchase of $' + R.minSale + '+ starts the card.</p>') +
      '<h3>How it works</h3><p>Each purchase of $' + R.minSale + ' or more earns 1 punch, however much you spend. Fill ' + R.punches + ' punches for a ' + R.reward + '. Punch codes work once and expire after 10 minutes.</p>' +
      '<p>Your card is saved under your phone number, so it works in any browser, on a new phone, or in the Snack Hub app. Just enter the same number.</p>';
    fresh = -1;
    sheet.querySelector('.rw-x').onclick = closeSheet;
    if(!phone){
      var tel = sheet.querySelector('#rw-tel');
      sheet.querySelector('#rw-link').onclick = function(){ link(tel.value); };
      tel.onkeydown = function(e){ if(e.key === 'Enter') link(tel.value); };
      return;
    }
    sheet.querySelector('#rw-change').onclick = function(){ phone = ''; setLS(PHONE_KEY, null); setLS(CACHE_KEY, null); rw = norm({punches: legacyLeft()}); toast = null; stopScan(false); paintStrip(); render(); };
    sheet.querySelector('#rw-scan').onclick = function(){ scanning ? stopScan(true) : startScan(); };
    var inp = sheet.querySelector('#rw-code');
    sheet.querySelector('#rw-type').onclick = function(){ redeem(inp.value); };
    inp.onkeydown = function(e){ if(e.key === 'Enter') redeem(inp.value); };
    if(scanning && stream){ var v = sheet.querySelector('.rw-cam video'); v.srcObject = stream; v.play().catch(function(){}); }
  }

  sheet.addEventListener('click', function(e){
    var b = e.target.closest('#rw-claim'); if(!b) return;
    if(!b.classList.contains('arm')){ b.classList.add('arm'); b.textContent = 'Tap again to confirm'; clearTimeout(armT); armT = setTimeout(function(){ b.classList.remove('arm'); b.textContent = 'Staff: mark as claimed'; }, 4000); return; }
    b.disabled = true; b.textContent = 'Saving…';
    api('/card/claim', {phone: phone}).then(function(x){
      if(x.j && x.j.log) useCard(x.j);
      toast = x.ok ? {text: 'Enjoy your ' + R.reward + '! A fresh card is ready.'} : {text: x.j.error || 'Could not mark it claimed. Try again.', bad: true};
      paintStrip(); render();
    }).catch(function(){ toast = {text: "Couldn't reach the store. Check your internet and try again.", bad: true}; render(); });
  });

  function openSheet(){ ov.hidden = false; document.documentElement.style.overflow = 'hidden'; render(); }
  function closeSheet(){ stopScan(false); ov.hidden = true; toast = null; document.documentElement.style.overflow = ''; }
  ov.addEventListener('click', function(e){ if(e.target === ov) closeSheet(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !ov.hidden) closeSheet(); });

  var busy = false;
  function redeem(raw){
    var code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(busy) return;
    if(code.length !== 6){ toast = {text: 'Punch codes have 6 letters and numbers.', bad: true}; if(!ov.hidden) render(); return; }
    if(!phone){ pendingCode = code; toast = {text: 'Almost there! Enter your phone number to add this punch.'}; stopScan(false); openSheet(); return; }
    busy = true;
    api('/punch/redeem', {code: code, phone: phone})
      .then(function(x){
        if(!x.ok){ toast = {text: x.j.error || 'That code did not work. Ask at the counter for a new one.', bad: true}; openSheet(); return; }
        var before = shown();
        if(x.j.card) useCard(x.j.card);
        var n = shown(); fresh = n > before ? before : -1;
        toast = {text: n >= R.punches ? 'Card complete! You\'ve earned a ' + R.reward + '!' : 'Punched! ' + n + ' of ' + R.punches + ' on your card.'};
        stopScan(false); paintStrip(); openSheet();
      })
      .catch(function(){ toast = {text: "Couldn't reach the store. Check your internet and try again.", bad: true}; openSheet(); })
      .then(function(){ busy = false; });
  }

  // first time: save the card under the customer's phone number, moving over any punches already on this phone
  function link(raw){
    var d = digits(raw);
    if(!d){ toast = {text: 'Please enter a 10-digit phone number.', bad: true}; render(); var t = sheet.querySelector('#rw-tel'); if(t){ t.value = raw; t.focus(); } return; }
    if(busy) return; busy = true;
    var carry = legacyLeft();
    api('/card/open', {phone: d, carry: carry}).then(function(x){
      busy = false;
      if(!x.ok){ toast = {text: x.j.error || 'Could not open your card. Try again.', bad: true}; render(); return; }
      if(carry){ legacy.carried = true; setLS(KEY, legacy); }
      phone = d; setLS(PHONE_KEY, d); useCard(x.j); paintStrip();
      toast = {text: carry ? 'Your card is saved! ' + carry + (carry === 1 ? ' punch' : ' punches') + ' moved over from this phone.' : (x.j.punches ? 'Welcome back! Here\'s your card.' : 'Your card is ready!')};
      if(pendingCode){ var c = pendingCode; pendingCode = null; redeem(c); } else render();
    }).catch(function(){ busy = false; toast = {text: "Couldn't reach the store. Check your internet and try again.", bad: true}; render(); });
  }

  // in-app scanner: built-in BarcodeDetector when the phone has it, otherwise the small jsQR library
  var detector = null, jsqrP = null;
  function loadJsQR(){ return jsqrP || (jsqrP = new Promise(function(ok, no){ var s = document.createElement('script'); s.src = JSQR; s.onload = function(){ window.jsQR ? ok(window.jsQR) : no(); }; s.onerror = no; document.head.appendChild(s); })); }
  function codeFrom(text){
    var m = String(text || '').match(/[?&]punch=([A-Za-z0-9]{6})/); if(m) return m[1];
    m = String(text || '').trim().match(/^[A-Za-z0-9]{6}$/); return m ? m[0] : null;
  }
  function startScan(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast = {text: 'This phone can\'t open the camera here. Type the 6-letter code instead.', bad: true}; render(); return; }
    navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false}).then(function(s){
      stream = s; scanning = true; toast = null; render();
      try{ if('BarcodeDetector' in window) detector = new BarcodeDetector({formats: ['qr_code']}); }catch(e){ detector = null; }
      if(!detector) loadJsQR().catch(function(){ toast = {text: 'The scanner could not load. Type the 6-letter code instead.', bad: true}; stopScan(true); });
      var c = document.createElement('canvas'), cx = c.getContext('2d', {willReadFrequently: true});
      (function loop(){
        if(!scanning) return;
        var v = sheet.querySelector('.rw-cam video');
        if(!v || v.readyState < 2){ requestAnimationFrame(loop); return; }
        var found = function(t){ var code = codeFrom(t); if(code){ scanning = false; redeem(code); return true; } return false; };
        if(detector){ detector.detect(v).then(function(r){ if(!(r[0] && found(r[0].rawValue))) setTimeout(loop, 150); }).catch(function(){ setTimeout(loop, 300); }); return; }
        if(window.jsQR){
          var w = 480, h = Math.round(w * v.videoHeight / v.videoWidth) || 480; c.width = w; c.height = h; cx.drawImage(v, 0, 0, w, h);
          var r = window.jsQR(cx.getImageData(0, 0, w, h).data, w, h, {inversionAttempts: 'dontInvert'});
          if(r && found(r.data)) return;
        }
        setTimeout(loop, 150);
      })();
    }).catch(function(){ toast = {text: 'Camera permission was blocked. Type the 6-letter code instead.', bad: true}; render(); });
  }
  function stopScan(rerender){ scanning = false; if(stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; } if(rerender && !ov.hidden) render(); }

  function start(){
    var game = document.querySelector('.game-feature');
    if(game) game.parentNode.insertBefore(strip, game); else (document.querySelector('main') || document.body).append(strip);
    document.body.append(ov); paintStrip();
    if(phone) api('/card?phone=' + phone).then(function(x){ if(x.ok && x.j.log){ useCard(x.j); paintStrip(); if(!ov.hidden) render(); } }).catch(function(){});
    // opened from the counter QR code: ...?punch=ABC123
    var m = location.search.match(/[?&]punch=([A-Za-z0-9]{6})/);
    if(m){
      try{ var u = new URL(location.href); u.searchParams.delete('punch'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); }catch(e){}
      redeem(m[1]);
    }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
