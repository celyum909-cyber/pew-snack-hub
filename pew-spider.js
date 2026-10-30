/* Depew Snack Hub - Halloween spider.
   Every 10 seconds a little spider walks across the screen pulling a "Happy Halloween" banner.
   Tap the spider to squish it. Turns itself off automatically after Halloween (from Nov 1, phone's local time).
   Loaded by pew-catalog.js. To remove it early, delete the "pew-spider.js" block at the bottom of pew-catalog.js. */
(function(){
  var now = new Date();
  var END = new Date(now.getFullYear(), 10, 1); // Nov 1, 12:00 AM local time
  if (now >= END || now.getMonth() < 9) return;  // only runs in October
  var GAP = 10000;  // wait between walks (ms)
  var WALK = 9000;  // time to cross the screen (ms)

  var css = document.createElement('style');
  css.textContent =
    '#hw-spider{position:fixed;left:0;top:0;z-index:900;pointer-events:none;will-change:transform}' +
    '#hw-spider[hidden]{display:none}' +
    '#hw-spider .hw-row{display:flex;align-items:center;flex-direction:row-reverse}' +
    '#hw-spider.rtl .hw-row{flex-direction:row}' +
    '#hw-spider .hw-bug{pointer-events:auto;width:64px;height:64px;margin:-8px;padding:8px;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
    '#hw-spider .hw-bug svg{display:block;width:48px;height:48px;overflow:visible;filter:drop-shadow(0 0 2px #ffffffcc) drop-shadow(0 0 6px #ff9f1c88) drop-shadow(0 3px 3px #0009)}' +
    '#hw-spider.rtl .hw-bug svg{transform:scaleX(-1)}' +
    '#hw-spider .hw-silk{width:26px;height:2px;background:linear-gradient(90deg,#fff8,#fffc)}' +
    '#hw-spider .hw-flag{white-space:nowrap;padding:7px 14px 7px 12px;border-radius:6px;background:linear-gradient(135deg,#ff7a00,#ff9f1c);color:#140600;font:900 15px/1 system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.3px;text-transform:uppercase;box-shadow:0 6px 14px #0008,inset 0 -3px 0 #0003;transform-origin:center;animation:hwflap 1.1s ease-in-out infinite}' +
    '@keyframes hwflap{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg) translateY(2px)}}' +
    '#hw-spider .lg{transform-box:fill-box;animation:hwleg .32s ease-in-out infinite alternate}' +
    '#hw-spider .lg.b{animation-delay:-.16s}' +
    '#hw-spider .lg.l{transform-origin:right center}#hw-spider .lg.r{transform-origin:left center}' +
    '@keyframes hwleg{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}' +
    '#hw-spider .hw-body{animation:hwbob .32s ease-in-out infinite alternate}' +
    '@keyframes hwbob{to{transform:translateY(1.5px)}}' +
    '#hw-spider.dead .lg,#hw-spider.dead .hw-body,#hw-spider.dead .hw-flag{animation:none}' +
    '#hw-spider.dead .hw-bug svg{animation:hwsquish .25s ease-out forwards}' +
    '@keyframes hwsquish{to{transform:scale(1.35,.25) translateY(14px)}}' +
    '#hw-spider.rtl.dead .hw-bug svg{animation-name:hwsquishr}' +
    '@keyframes hwsquishr{to{transform:scaleX(-1) scale(1.35,.25) translateY(14px)}}' +
    '#hw-spider.dead .hw-flag,#hw-spider.dead .hw-silk{transition:transform 1s cubic-bezier(.5,0,.9,.5),opacity 1s;transform:translateY(70vh) rotate(25deg);opacity:0}' +
    '.hw-splat{position:fixed;z-index:901;pointer-events:none;width:90px;height:90px;margin:-45px 0 0 -45px;animation:hwsplat 1.6s ease-out forwards}' +
    '.hw-splat b{position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;font:900 16px/1 system-ui,-apple-system,Segoe UI,sans-serif;color:#9dff57;text-shadow:0 2px 4px #000,0 0 10px #3c0}' +
    '@keyframes hwsplat{0%{opacity:0;transform:scale(.4)}12%{opacity:1;transform:scale(1.1)}25%{transform:scale(1)}75%{opacity:1}100%{opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){#hw-spider .lg,#hw-spider .hw-body,#hw-spider .hw-flag{animation:none}}';

  // a cute cartoon spider facing right
  var legs = '';
  [[-14,'a'],[-5,'b'],[5,'a'],[14,'b']].forEach(function(p){
    var y = 30 + p[0] * 0.55, cls = p[1];
    legs += '<path class="lg l ' + cls + '" d="M22 ' + y + ' q-9 ' + (-10 + p[0]*0.4) + ' -18 ' + (p[0]*0.9 + 6) + '" />';
    legs += '<path class="lg r ' + (cls === 'a' ? 'b' : 'a') + '" d="M42 ' + y + ' q9 ' + (-10 + p[0]*0.4) + ' 18 ' + (p[0]*0.9 + 6) + '" />';
  });
  var SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="#111" stroke-width="3" stroke-linecap="round">' + legs + '</g>' +
    '<g class="hw-body"><ellipse cx="32" cy="34" rx="13" ry="11" fill="#1a1a1f"/><ellipse cx="28" cy="31" rx="4" ry="2.5" fill="#ffffff22"/>' +
    '<circle cx="44" cy="30" r="8" fill="#26262c"/>' +
    '<circle cx="45" cy="27.5" r="3.2" fill="#fff"/><circle cx="50" cy="28.5" r="2.7" fill="#fff"/>' +
    '<circle cx="46" cy="28" r="1.5" fill="#111"/><circle cx="50.8" cy="29" r="1.3" fill="#111"/>' +
    '<path d="M44 34 q3 2 6 0" stroke="#ff7a00" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M27 27 l3 6 l3 -6 z" fill="#ff7a00" opacity=".9"/></g></svg>';
  var SPLAT = '<svg viewBox="0 0 90 90" aria-hidden="true"><path fill="#6fd13b" d="M45 18c6 0 7 9 12 8s9-9 13-5-3 11 1 15 13 1 13 7-10 5-11 10 8 11 3 15-11-3-15 1-3 13-10 13-6-10-11-11-11 7-15 2 4-11 0-15-14-1-14-8 11-5 12-10-7-11-2-15 10 4 14 0 2-12 10-12z"/>' +
    '<circle cx="45" cy="45" r="13" fill="#1a1a1f"/><path d="M38 41l5 5m0-5l-5 5M48 41l5 5m0-5l-5 5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg><b>SQUISHED!</b>';

  var box, bug, anim = null, timer = null, busy = false;

  function build(){
    document.head.appendChild(css);
    box = document.createElement('div'); box.id = 'hw-spider'; box.hidden = true;
    box.innerHTML = '<div class="hw-row"><button type="button" class="hw-bug" aria-label="Squish the Halloween spider">' + SVG + '</button>' +
      '<span class="hw-silk"></span><span class="hw-flag">🎃 Happy Halloween</span></div>';
    document.body.appendChild(box);
    bug = box.querySelector('.hw-bug');
    bug.addEventListener('pointerdown', function(e){ e.preventDefault(); squish(); });
    bug.addEventListener('click', function(e){ e.preventDefault(); squish(); });
  }

  function walk(){
    if (new Date() >= END){ stop(); return; }
    if (document.hidden || busy){ later(); return; }
    busy = true;
    var rtl = Math.random() < 0.5;
    box.className = rtl ? 'rtl' : '';
    box.hidden = false;
    var w = box.offsetWidth, vw = window.innerWidth, vh = window.innerHeight;
    var y = Math.round(vh * (0.18 + Math.random() * 0.6));
    var from = rtl ? vw + 10 : -w - 10, to = rtl ? -w - 10 : vw + 10;
    var wob = 18;
    anim = box.animate([
      {transform: 'translate(' + from + 'px,' + y + 'px)'},
      {transform: 'translate(' + (from + (to - from) * 0.33) + 'px,' + (y - wob) + 'px)'},
      {transform: 'translate(' + (from + (to - from) * 0.66) + 'px,' + (y + wob) + 'px)'},
      {transform: 'translate(' + to + 'px,' + y + 'px)'}
    ], {duration: WALK, easing: 'linear', fill: 'forwards'});
    anim.onfinish = function(){ box.hidden = true; anim = null; busy = false; later(); };
  }

  function squish(){
    if (!anim || box.classList.contains('dead')) return;
    anim.pause();
    var r = bug.getBoundingClientRect();
    box.classList.add('dead');
    var s = document.createElement('div'); s.className = 'hw-splat'; s.innerHTML = SPLAT;
    s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(s);
    if (navigator.vibrate) try{ navigator.vibrate(40); }catch(e){}
    setTimeout(function(){ s.remove(); }, 1700);
    setTimeout(function(){
      if (anim) anim.cancel(); anim = null;
      box.hidden = true; box.className = ''; busy = false; later();
    }, 1100);
  }

  function later(){ clearTimeout(timer); timer = setTimeout(walk, GAP); }
  function stop(){ clearTimeout(timer); if (anim) anim.cancel(); if (box) box.remove(); }

  function start(){ build(); timer = setTimeout(walk, 2500); } // first spider shortly after the page opens
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
