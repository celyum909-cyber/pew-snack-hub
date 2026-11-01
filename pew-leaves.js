/* Depew Snack Hub - autumn leaves (light version).
   Every couple of seconds a leaf drifts slowly down across the app, swaying and spinning, then falls off the bottom.
   Orange, red, gold, green and brown, in maple, oak and birch shapes. Taps go straight through them.
   Kept light for phones: no shadows or 3D tilting, only a few leaves at a time, and nothing runs while scrolling.
   Turns itself off automatically after Thanksgiving (from Nov 27, phone's local time).
   Loaded by pew-catalog.js. To remove it early, delete the "pew-leaves.js" block at the bottom of pew-catalog.js. */
(function(){
  var END = new Date(2026, 10, 27); // Nov 27, 2026, 12:00 AM local time (the day after Thanksgiving)
  if (new Date() >= END) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!Element.prototype.animate) return;

  var EVERY_MIN = 2200, EVERY_MAX = 3400; // a new leaf every couple of seconds
  var MAX_LEAVES = 5;                     // never more than this on screen

  var COLORS = ['#e8711c', '#d9381e', '#f2b51c', '#7aa53a', '#a5582a', '#f08a24'];
  var SHAPES = [
    'M50 4 L57 24 L70 16 L66 36 L86 30 L76 48 L94 54 L74 62 L80 76 L62 70 L54 86 L52 96 L48 96 L46 86 L38 70 L20 76 L26 62 L6 54 L24 48 L14 30 L34 36 L30 16 L43 24 Z',
    'M50 4 C60 8 58 18 66 20 C76 22 76 32 70 36 C80 40 80 50 72 54 C80 60 76 70 66 70 C62 78 56 84 52 86 L52 96 L48 96 L48 86 C44 84 38 78 34 70 C24 70 20 60 28 54 C20 50 20 40 30 36 C24 32 24 22 34 20 C42 18 40 8 50 4 Z',
    'M50 4 C72 18 84 40 78 62 C74 76 62 86 52 88 L52 96 L48 96 L48 88 C38 86 26 76 22 62 C16 40 28 18 50 4 Z'
  ];
  var VEINS = 'M50 90 L50 14 M50 52 L68 36 M50 52 L32 36 M50 70 L66 58 M50 70 L34 58';

  // build each leaf picture once and reuse it, so the phone isn't drawing new artwork every time
  var pics = [];
  SHAPES.forEach(function(shape){ COLORS.forEach(function(col){
    pics.push('url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="' + shape + '" fill="' + col + '"/><path d="' + VEINS + '" stroke="#00000030" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>') + '")');
  }); });

  var layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:880;contain:strict';
  var count = 0, timer = 0;

  function rnd(a, b){ return a + Math.random() * (b - a); }

  function leaf(){
    if (new Date() >= END){ clearTimeout(timer); layer.remove(); return; }
    if (document.hidden || count >= MAX_LEAVES || document.body.classList.contains('game-open')){ next(); return; }
    var size = rnd(30, 48), w = window.innerWidth, h = window.innerHeight;
    var el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:0;top:0;width:' + size + 'px;height:' + size + 'px;background:' + pics[Math.floor(Math.random() * pics.length)] + ' center/contain no-repeat;will-change:transform';
    layer.appendChild(el); count++;

    // drift down with a gentle side-to-side sway while slowly spinning (only movement, which phones handle easily)
    var x0 = rnd(-0.05, 1.0) * w, drift = rnd(-0.25, 0.25) * w, sway = rnd(25, 55), swings = Math.round(rnd(2, 4));
    var dur = rnd(10000, 15000), spin = rnd(-300, 300), steps = 12, frames = [];
    for (var i = 0; i <= steps; i++){
      var t = i / steps, s = Math.sin(t * Math.PI * swings);
      frames.push({transform: 'translate3d(' + (x0 + drift * t + s * sway).toFixed(1) + 'px,' + (-60 + t * (h + 120)).toFixed(1) + 'px,0) rotate(' + (spin * t + s * 30).toFixed(1) + 'deg)'});
    }
    el.animate(frames, {duration: dur, easing: 'linear', fill: 'forwards'}).onfinish = function(){ el.remove(); count--; };
    next();
  }
  function next(){ clearTimeout(timer); timer = setTimeout(leaf, rnd(EVERY_MIN, EVERY_MAX)); }

  function start(){ document.body.appendChild(layer); timer = setTimeout(leaf, 800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
