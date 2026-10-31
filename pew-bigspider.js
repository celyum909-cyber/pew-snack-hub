/* Depew Snack Hub - big hairy Halloween spider.
   About every 30 seconds a big realistic spider crawls in from a random edge, scurries and looks around
   for a couple of seconds, then leaves. Tap it and it rushes off.
   If someone squishes the little cartoon spider (pew-spider.js), the big one comes out right after it.
   Never on screen at the same time as the little spider. All artwork is drawn in code.
   Turns itself off automatically after Halloween (from Nov 1, phone's local time).
   Loaded by pew-catalog.js. To remove it early, delete the "pew-bigspider.js" block at the bottom of pew-catalog.js. */
(function(){
  'use strict';
  var now = new Date();
  var END = new Date(now.getFullYear(), 10, 1); // Nov 1, 12:00 AM local time
  if (now >= END || now.getMonth() < 9) return;  // only runs in October
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var GAP_MIN = 25000, GAP_MAX = 35000;  // about every 30 seconds

  var css = document.createElement('style');
  css.textContent =
    '#big-spider{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:899}' +
    '#big-spider[hidden],#big-spider-tap[hidden]{display:none}' +
    '#big-spider-tap{position:fixed;left:0;top:0;z-index:899;border:0;padding:0;margin:0;background:transparent;opacity:0;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transform-origin:center}';

  var canvas, c, tap;
  var w = innerWidth, h = innerHeight, dpr = 1, scale = 1;
  var x = 0, y = 0, angle = 0, last = 0, clock = 0, travel = 0;
  var target = {x: 0, y: 0}, walking = false, speed = 65, mode = 'off', until = 0, plan = [], lookBase = 0;
  var raf = 0, timer = 0;

  // ---------- drawing (from the spider overlay) ----------
  var seed = 731;
  function random(){ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  var fur = []; for (var i = 0; i < 480; i++) fur.push({a: random() * Math.PI * 2, r: Math.sqrt(random()), l: 2 + random() * 5, v: random()});
  var legs = [];
  [-1, 1].forEach(function(side){ for (var row = 0; row < 4; row++) legs.push({side: side, row: row, phase: (row % 2 + (side === 1 ? 1 : 0)) % 2, foot: null, from: null, to: null, swing: false}); });
  function world(px, py){ return {x: x + (px * Math.cos(angle) - py * Math.sin(angle)) * scale, y: y + (px * Math.sin(angle) + py * Math.cos(angle)) * scale}; }
  function local(p){ var dx = (p.x - x) / scale, dy = (p.y - y) / scale; return {x: dx * Math.cos(angle) + dy * Math.sin(angle), y: -dx * Math.sin(angle) + dy * Math.cos(angle)}; }
  function line(pts, width, color){ c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y); c.lineWidth = width; c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
  function limb(a, b, width){
    line([a, b], width, '#17100d'); line([{x: a.x - 1, y: a.y - 1}, {x: b.x - 1, y: b.y - 1}], width * .36, '#49372a');
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    for (var j = 0; j < len; j += 2.8){
      var t = j / len, px = a.x + dx * t, py = a.y + dy * t;
      for (var s = -1; s <= 1; s += 2){
        var l = 2 + 2.8 * (.5 + .5 * Math.sin(j * 7.1));
        line([{x: px + nx * s * width * .35, y: py + ny * s * width * .35}, {x: px + nx * s * (width * .6 + l) - dx / len * 2, y: py + ny * s * (width * .6 + l) - dy / len * 2}], .55, j % 3 < 1 ? '#927960' : '#403127');
      }
    }
  }
  function oval(px, py, rx, ry){
    var g = c.createRadialGradient(px - rx * .3, py - ry * .4, 1, px, py, ry * 1.2);
    g.addColorStop(0, '#65503a'); g.addColorStop(.35, '#30241b'); g.addColorStop(.8, '#19120f'); g.addColorStop(1, '#080706');
    c.fillStyle = g; c.beginPath(); c.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); c.fill();
    for (var k = 0; k < fur.length; k++){ var f = fur[k], fx = px + Math.cos(f.a) * rx * f.r, fy = py + Math.sin(f.a) * ry * f.r;
      c.strokeStyle = f.v > .78 ? '#917859' : '#3e3024'; c.lineWidth = .55; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(f.a) * f.l, fy + Math.sin(f.a) * f.l); c.stroke(); }
  }
  function draw(){
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
    c.save(); c.translate(5, 8); c.filter = 'blur(5px)'; c.fillStyle = '#00000038'; c.beginPath(); c.ellipse(0, 8, 32, 44, 0, 0, Math.PI * 2); c.fill(); c.restore();
    for (var n = 0; n < legs.length; n++){
      var leg = legs[n], s = leg.side, r = leg.row, ys = [-58, -24, 26, 65], xs = [54, 72, 76, 58];
      var hip = {x: s * 11, y: -16 + r * 9}, rest = {x: s * xs[r], y: ys[r]};
      var phase = (travel / 28 + leg.phase * .5) % 1, swing = walking && phase < .38;
      if (!leg.foot){ leg.foot = world(rest.x, rest.y); leg.from = leg.foot; leg.to = leg.foot; }
      if (swing && !leg.swing){ leg.from = {x: leg.foot.x, y: leg.foot.y}; leg.to = world(rest.x, rest.y - 16); }
      if (swing){ var t = phase / .38, e = t * t * (3 - 2 * t); leg.foot = {x: leg.from.x + (leg.to.x - leg.from.x) * e, y: leg.from.y + (leg.to.y - leg.from.y) * e}; }
      leg.swing = swing;
      var foot = local(leg.foot); if (Math.hypot(foot.x - rest.x, foot.y - rest.y) > 50){ leg.foot = world(rest.x, rest.y); foot = rest; }
      var lift = swing ? Math.sin(phase / .38 * Math.PI) * 7 : 0;
      var knee = {x: s * (Math.abs(foot.x) * .65 + 14), y: hip.y + (foot.y - hip.y) * .43 - lift}, ankle = {x: foot.x * .96, y: hip.y + (foot.y - hip.y) * .83 - lift * .4};
      c.save(); c.globalAlpha = .2; c.translate(4, 6); line([hip, knee, ankle, foot], 6, '#000'); c.restore();
      limb(hip, knee, 7); limb(knee, ankle, 4.4); limb(ankle, foot, 1.8);
    }
    var breath = 1 + Math.sin(clock * 2) * .009; c.save(); c.scale(breath, breath); oval(0, 18, 22, 29); oval(0, -13, 17, 20); c.restore();
    [-1, 1].forEach(function(s){
      limb({x: s * 9, y: -25}, {x: s * 18, y: -37}, 4); limb({x: s * 18, y: -37}, {x: s * 12, y: -43}, 2.5);
      c.fillStyle = '#100c0a'; c.beginPath(); c.ellipse(s * 5, -31, 5, 7, s * .2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#8b7c63'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s * 5, -35); c.quadraticCurveTo(s * 9, -44, s * 2, -46); c.stroke();
    });
    [[-4,-27,2],[4,-27,2],[-9,-25,1.2],[9,-25,1.2],[-5,-23,1],[5,-23,1],[-11,-22,.8],[11,-22,.8]].forEach(function(q){
      c.fillStyle = '#050505'; c.beginPath(); c.arc(q[0], q[1], q[2], 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c0ae8b'; c.beginPath(); c.arc(q[0] - .4, q[1] - .5, q[2] * .28, 0, Math.PI * 2); c.fill();
    });
    c.restore();
  }

  // ---------- a visit: crawl in, scurry and look around ~2 seconds, crawl out ----------
  function off(){ return 120 * scale; } // how far past the edge counts as off screen
  function inside(){ var m = Math.min(100 * scale, w * .25, h * .25); return {x: m + Math.random() * Math.max(1, w - m * 2), y: m + Math.random() * Math.max(1, h - m * 2)}; }
  function edgePoint(side){
    var o = off();
    if (side === 0) return {x: -o, y: h * (.15 + Math.random() * .7)};
    if (side === 1) return {x: w + o, y: h * (.15 + Math.random() * .7)};
    if (side === 2) return {x: w * (.15 + Math.random() * .7), y: -o};
    return {x: w * (.15 + Math.random() * .7), y: h + o};
  }
  function nearestEdge(){ var d = [x, w - x, y, h - y]; return d.indexOf(Math.min.apply(null, d)); }
  function near(p, min, max){ var a = Math.random() * Math.PI * 2, r = (min + Math.random() * (max - min)) * scale, m = 90 * scale;
    return {x: Math.max(m, Math.min(w - m, p.x + Math.cos(a) * r)), y: Math.max(m, Math.min(h - m, p.y + Math.sin(a) * r))}; }

  function smallSpiderOut(){ var s = document.getElementById('hw-spider'); return s && !s.hidden; }

  function visit(fromSquish){
    clearTimeout(timer);
    if (new Date() >= END){ stopAll(); return; }
    if (mode !== 'off') return;
    if (!fromSquish && (document.hidden || smallSpiderOut() || document.body.classList.contains('game-open'))){ timer = setTimeout(function(){ visit(false); }, 2500); return; }
    resize();
    var start = edgePoint(Math.floor(Math.random() * 4)), a = inside(), b = near(a, 70, 150);
    x = start.x; y = start.y;
    angle = Math.atan2(a.y - y, a.x - x) + Math.PI / 2;
    legs.forEach(function(l){ l.foot = null; });
    plan = [
      {go: a, speed: fromSquish ? 520 : 380},          // rush in
      {look: .5 + Math.random() * .5},                   // stop and look around
      {go: b, speed: 230},                               // scurry a little
      {look: .4 + Math.random() * .5},                   // look again
      {leave: true, speed: 420}                          // run off the nearest edge
    ];
    window.__pewBigSpiderOut = true;
    mode = 'visit'; canvas.hidden = false; tap.hidden = false; nextStep();
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function nextStep(){
    var st = plan.shift();
    if (!st){ finish(); return; }
    if (st.look){ walking = false; until = clock + st.look; lookBase = angle; return; }
    if (st.leave){ var e = edgePoint(nearestEdge()); target = e; }
    else target = st.go;
    speed = st.speed; walking = true; until = Infinity;
  }
  function scare(e){
    if (mode !== 'visit') return;
    e.preventDefault(); e.stopPropagation();
    var dx = x - (e.clientX != null ? e.clientX : x), dy = y - (e.clientY != null ? e.clientY : y);
    if (Math.hypot(dx, dy) < 12){ var n = nearestEdge(); dx = [-1, 1, 0, 0][n]; dy = [0, 0, -1, 1][n]; }
    var len = Math.hypot(dx, dy), dist = Math.hypot(w, h) + 240 * scale;
    target = {x: x + dx / len * dist, y: y + dy / len * dist};
    plan = []; mode = 'flee'; walking = true; speed = 650; until = Infinity; tap.hidden = true;
  }
  function finish(){
    mode = 'off'; walking = false; window.__pewBigSpiderOut = false;
    cancelAnimationFrame(raf); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    canvas.hidden = true; tap.hidden = true;
    timer = setTimeout(function(){ visit(false); }, GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN));
  }

  function frame(time){
    var dt = Math.min(.04, (time - last) / 1000 || .016); last = time; clock += dt;
    if (walking){
      var dx = target.x - x, dy = target.y - y, dist = Math.hypot(dx, dy);
      var desired = Math.atan2(dy, dx) + Math.PI / 2, turn = Math.atan2(Math.sin(desired - angle), Math.cos(desired - angle));
      angle += turn * Math.min(1, dt * (mode === 'flee' ? 18 : 9));
      var step = Math.min(dist, speed * scale * dt);
      if (dist > 2){ x += dx / dist * step; y += dy / dist * step; travel += step / scale; }
      else { walking = false; if (mode === 'visit') nextStep(); }
    } else if (mode === 'visit'){
      // looking around: small turns of the body
      angle = lookBase + Math.sin(clock * 5) * .22 + Math.sin(clock * 2.3) * .12;
      if (clock >= until) nextStep();
    }
    var o = off();
    if ((mode === 'flee' || !plan.length) && (x < -o || x > w + o || y < -o || y > h + o)){ finish(); return; }
    if (mode === 'visit'){
      tap.style.width = 160 * scale + 'px'; tap.style.height = 170 * scale + 'px';
      tap.style.transform = 'translate(' + (x - 80 * scale) + 'px,' + (y - 85 * scale) + 'px) rotate(' + angle + 'rad)';
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function resize(){
    w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr; scale = Math.min(1.5, Math.max(.72, w / 430));
  }
  function stopAll(){ clearTimeout(timer); cancelAnimationFrame(raf); if (canvas) canvas.remove(); if (tap) tap.remove(); window.__pewBigSpiderOut = false; }

  function start(){
    document.head.appendChild(css);
    canvas = document.createElement('canvas'); canvas.id = 'big-spider'; canvas.setAttribute('aria-hidden', 'true'); canvas.hidden = true;
    tap = document.createElement('button'); tap.id = 'big-spider-tap'; tap.type = 'button'; tap.setAttribute('aria-label', 'Scare the spider away'); tap.hidden = true;
    document.body.appendChild(canvas); document.body.appendChild(tap);
    c = canvas.getContext('2d');
    tap.addEventListener('pointerdown', scare);
    tap.addEventListener('click', function(e){ if (e.detail === 0) scare(e); });
    addEventListener('resize', function(){ if (mode !== 'off') resize(); });
    document.addEventListener('visibilitychange', function(){ last = performance.now(); });
    // the little spider got squished: the big one comes out behind it
    document.addEventListener('pew:spider-squished', function(){ setTimeout(function(){ visit(true); }, 700); });
    timer = setTimeout(function(){ visit(false); }, 12000 + Math.random() * 8000); // first visit a little after the page opens
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
