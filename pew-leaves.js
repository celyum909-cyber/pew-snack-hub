/* Depew Snack Hub - autumn leaves.
   Every couple of seconds a leaf drifts slowly down across the app, swaying and spinning.
   Orange, red, gold, green and brown, in maple, oak and birch shapes. Taps go straight through them.
   Some leaves land in a thin pile along the bottom. The pile clears slowly on its own,
   and swiping a finger across it brushes the leaves away.
   Turns itself off automatically after Thanksgiving (from Nov 27, phone's local time).
   Loaded by pew-catalog.js. To remove it early, delete the "pew-leaves.js" block at the bottom of pew-catalog.js. */
(function(){
  var now = new Date();
  var END = new Date(2026, 10, 27); // Nov 27, 2026, 12:00 AM local time (the day after Thanksgiving)
  if (now >= END) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!Element.prototype.animate) return;

  var EVERY_MIN = 1600, EVERY_MAX = 2800; // a new leaf every couple of seconds
  var MAX_LEAVES = 8;                     // never more than this on screen

  var COLORS = [
    ['#e8711c', '#b4470c'], // orange
    ['#d9381e', '#9c1f10'], // red
    ['#f2b51c', '#c27d0a'], // gold
    ['#7aa53a', '#4d7322'], // green
    ['#a5582a', '#6e3516'], // brown
    ['#f08a24', '#c0300f']  // orange-red
  ];
  var SHAPES = [
    // maple
    'M50 4 L57 24 L70 16 L66 36 L86 30 L76 48 L94 54 L74 62 L80 76 L62 70 L54 86 L52 96 L48 96 L46 86 L38 70 L20 76 L26 62 L6 54 L24 48 L14 30 L34 36 L30 16 L43 24 Z',
    // oak
    'M50 4 C60 8 58 18 66 20 C76 22 76 32 70 36 C80 40 80 50 72 54 C80 60 76 70 66 70 C62 78 56 84 52 86 L52 96 L48 96 L48 86 C44 84 38 78 34 70 C24 70 20 60 28 54 C20 50 20 40 30 36 C24 32 24 22 34 20 C42 18 40 8 50 4 Z',
    // birch / simple leaf
    'M50 4 C72 18 84 40 78 62 C74 76 62 86 52 88 L52 96 L48 96 L48 88 C38 86 26 76 22 62 C16 40 28 18 50 4 Z'
  ];
  var VEINS = 'M50 90 L50 14 M50 52 L68 36 M50 52 L32 36 M50 70 L66 58 M50 70 L34 58';

  var layer = document.createElement('div');
  layer.id = 'pew-leaves';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:880';
  var count = 0, timer = 0;

  function rnd(a, b){ return a + Math.random() * (b - a); }

  function leaf(){
    if (new Date() >= END){ stop(); return; }
    if (document.hidden || count >= MAX_LEAVES || document.body.classList.contains('game-open')){ next(); return; }
    var col = COLORS[Math.floor(Math.random() * COLORS.length)], shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    var size = rnd(30, 50), w = window.innerWidth, h = window.innerHeight;
    var el = document.createElement('div'), gid = 'pl' + Math.random().toString(36).slice(2);
    el.style.cssText = 'position:absolute;left:0;top:0;width:' + size + 'px;height:' + size + 'px;will-change:transform;filter:drop-shadow(0 4px 4px #0006)';
    el.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + col[0] + '"/><stop offset="1" stop-color="' + col[1] + '"/></linearGradient></defs>' +
      '<path d="' + shape + '" fill="url(#' + gid + ')"/><path d="' + VEINS + '" stroke="#0000002e" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
    layer.appendChild(el); count++;

    // drift down with a gentle side-to-side sway, slowly spinning and tilting.
    // Some leaves land on the pile at the bottom of the screen instead of falling off it.
    var lands = pile.length < PILE_MAX && Math.random() < LAND_CHANCE;
    var x0 = rnd(-0.05, 1.0) * w, drift = rnd(-0.25, 0.25) * w, sway = rnd(25, 60), swings = Math.round(rnd(2, 4));
    var dur = rnd(9000, 14000), spin = rnd(-360, 360), steps = 24, frames = [];
    var restY = h - size * rnd(0.55, 0.95), restRot = rnd(-180, 180), endX = 0;
    if (lands){ x0 = rnd(0.02, 0.92) * w; drift = rnd(-0.12, 0.12) * w; }
    var fallTo = lands ? restY : h + 60;
    for (var i = 0; i <= steps; i++){
      var t = i / steps, s = Math.sin(t * Math.PI * 2 * swings / 2), settle = lands ? Math.max(0, (t - 0.85) / 0.15) : 0;
      var x = x0 + drift * t + s * sway * (1 - settle), y = -60 + t * (fallTo + 60);
      if (i === steps) endX = x;
      var rot = lands && i === steps ? restRot : spin * t + s * 25, tilt = lands ? s * 55 * (1 - settle) : s * 55;
      frames.push({transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) rotateX(' + tilt.toFixed(1) + 'deg)',
        opacity: t < 0.05 ? t / 0.05 : (!lands && t > 0.92) ? (1 - t) / 0.08 : 0.92});
    }
    var a = el.animate(frames, {duration: dur, easing: lands ? 'cubic-bezier(.2,0,.6,1)' : 'linear', fill: 'forwards'});
    a.onfinish = function(){
      count--;
      if (!lands){ el.remove(); return; }
      rest(el, endX, restY, restRot, size);
    };
    next();
  }

  // ---------- the pile at the bottom ----------
  // A thin pile that clears slowly on its own. Swiping a finger across it brushes leaves away.
  // The leaves never block taps, so buttons underneath always work.
  var PILE_MAX = 22, LAND_CHANCE = 0.45, pile = [];
  function rest(el, x, y, rot, size){
    var p = {el: el, x: x, y: y, rot: rot, size: size, gone: false};
    pile.push(p);
    p.fade = setTimeout(function(){ crumble(p); }, rnd(25000, 45000)); // clears slowly on its own
    while (pile.length > PILE_MAX) crumble(pile[0]);
  }
  function drop(p){ p.gone = true; clearTimeout(p.fade); var i = pile.indexOf(p); if (i >= 0) pile.splice(i, 1); }
  function crumble(p){
    if (p.gone) return; drop(p);
    var base = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) rotate(' + p.rot.toFixed(1) + 'deg)';
    p.el.getAnimations().forEach(function(an){ an.cancel(); });
    p.el.animate([{transform: base, opacity: .92}, {transform: base + ' scale(.6)', opacity: 0}], {duration: 2200, easing: 'ease-in', fill: 'forwards'}).onfinish = function(){ p.el.remove(); };
  }
  function brush(p, vx, vy, fx, fy){
    if (p.gone) return; drop(p);
    var cx = p.x + p.size / 2, cy = p.y + p.size / 2, dx = cx - fx, dy = cy - fy, d = Math.hypot(dx, dy) || 1;
    // push the leaf away from the finger, plus the way the finger is moving, with a little upward toss
    var px = dx / d * 90 + vx * 0.35, py = dy / d * 50 + vy * 0.35 - rnd(60, 120);
    var spinTo = p.rot + rnd(-540, 540);
    var from = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) rotate(' + p.rot.toFixed(1) + 'deg)';
    var mid = 'translate(' + (p.x + px * .6).toFixed(1) + 'px,' + (p.y + py * .6).toFixed(1) + 'px) rotate(' + ((p.rot + spinTo) / 2).toFixed(1) + 'deg)';
    var to = 'translate(' + (p.x + px).toFixed(1) + 'px,' + (p.y + py + 140).toFixed(1) + 'px) rotate(' + spinTo.toFixed(1) + 'deg)';
    p.el.getAnimations().forEach(function(an){ an.cancel(); });
    p.el.animate([{transform: from, opacity: .92}, {transform: mid, opacity: .85, offset: .45}, {transform: to, opacity: 0}],
      {duration: 900, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards'}).onfinish = function(){ p.el.remove(); };
  }
  var lastPt = null;
  function sweep(x, y){
    var t = performance.now(), vx = 0, vy = 0;
    if (lastPt && t - lastPt.t < 120){ var dt = Math.max(8, t - lastPt.t); vx = (x - lastPt.x) / dt * 1000; vy = (y - lastPt.y) / dt * 1000; }
    lastPt = {x: x, y: y, t: t};
    if (!pile.length) return;
    var reach = 34;
    pile.slice().forEach(function(p){
      var cx = p.x + p.size / 2, cy = p.y + p.size / 2;
      if (Math.abs(cx - x) < p.size / 2 + reach && Math.abs(cy - y) < p.size / 2 + reach) brush(p, vx, vy, x, y);
    });
  }
  window.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse' || e.buttons) sweep(e.clientX, e.clientY); }, {passive: true});
  window.addEventListener('pointerdown', function(e){ lastPt = null; sweep(e.clientX, e.clientY); }, {passive: true});
  window.addEventListener('touchmove', function(e){ var t = e.touches[0]; if (t) sweep(t.clientX, t.clientY); }, {passive: true});
  window.addEventListener('resize', function(){ pile.slice().forEach(crumble); });

  function next(){ clearTimeout(timer); timer = setTimeout(leaf, rnd(EVERY_MIN, EVERY_MAX)); }
  function stop(){ clearTimeout(timer); pile.slice().forEach(drop); layer.remove(); }

  function start(){ document.body.appendChild(layer); timer = setTimeout(leaf, 800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
