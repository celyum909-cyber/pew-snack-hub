/* Depew Snack Hub - Halloween spooky sounds.
   Soft owl hoots, wolf howls and a gust of wind, one at a time, every 15-30 seconds at random.
   The sounds are made right here in code (Web Audio), so there are no sound files and nothing to license.
   Phones only allow sound after the customer touches the screen, so it starts after their first tap or scroll.
   Turns itself off automatically after Halloween (from Nov 1, phone's local time).
   Loaded by pew-catalog.js. To remove it early, delete the "pew-spooky.js" block at the bottom of pew-catalog.js. */
(function(){
  var now = new Date();
  var END = new Date(now.getFullYear(), 10, 1); // Nov 1, 12:00 AM local time
  if (now >= END || now.getMonth() < 9) return;  // only runs in October

  var VOLUME = 0.35;              // overall loudness (0 to 1) - kept soft on purpose
  var MIN_GAP = 15000, MAX_GAP = 30000;
  var ctx = null, master = null, timer = null, last = -1;

  function rnd(a, b){ return a + Math.random() * (b - a); }

  function setup(){
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch(e){ return; }
    master = ctx.createGain(); master.gain.value = VOLUME;
    // a touch of echo so it sounds like it's out in the dark
    var delay = ctx.createDelay(1); delay.delayTime.value = 0.23;
    var fb = ctx.createGain(); fb.gain.value = 0.28;
    var wet = ctx.createGain(); wet.gain.value = 0.35;
    master.connect(ctx.destination);
    master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
    if (ctx.state === 'suspended') ctx.resume();
    schedule(rnd(4000, 8000)); // first sound shortly after they start using the app
  }

  function noiseBuffer(sec){
    var len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // one breathy "hoo": a soft sine that bends down in pitch, plus a little air
  function hoo(t, f, dur, vol, pan){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 1.06, t);
    o.frequency.exponentialRampToValueAtTime(f, t + dur * 0.3);
    o.frequency.exponentialRampToValueAtTime(f * 0.86, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
    g.gain.setValueAtTime(vol, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var n = ctx.createBufferSource(); n.buffer = noiseBuffer(dur);
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
    var ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(vol * 0.25, t + 0.05); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    var out = p || master; if (p){ p.pan.value = pan; p.connect(master); }
    o.connect(g); g.connect(out); n.connect(bp); bp.connect(ng); ng.connect(out);
    o.start(t); o.stop(t + dur + 0.05); n.start(t); n.stop(t + dur);
  }

  function owl(){
    var t = ctx.currentTime + 0.05, f = rnd(330, 400), pan = rnd(-0.8, 0.8);
    // great horned owl rhythm: hoo, hoo-hoo ... hoo, hoo
    hoo(t, f, 0.42, 0.55, pan);
    hoo(t + 0.62, f * 1.02, 0.2, 0.45, pan);
    hoo(t + 0.86, f, 0.24, 0.45, pan);
    hoo(t + 1.45, f * 0.98, 0.45, 0.5, pan);
    hoo(t + 2.1, f * 0.95, 0.5, 0.42, pan);
  }

  function wolf(){
    var t = ctx.currentTime + 0.05, dur = rnd(2.8, 3.6), base = rnd(280, 340), pan = rnd(-0.7, 0.7);
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'sine';
    // the howl: rise up, hold with a wobble, then sag down at the end
    [o, o2].forEach(function(x, i){
      var m = i ? 1 : 1.003;
      x.frequency.setValueAtTime(base * 0.75 * m, t);
      x.frequency.exponentialRampToValueAtTime(base * 1.9 * m, t + dur * 0.28);
      x.frequency.setValueAtTime(base * 1.9 * m, t + dur * 0.62);
      x.frequency.exponentialRampToValueAtTime(base * 1.35 * m, t + dur);
    });
    var vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2; vg.gain.value = 6;
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    // soften the buzzy sawtooth into a throaty "ooo"
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 6;
    var mix = ctx.createGain(); mix.gain.value = 0.18;
    var sine = ctx.createGain(); sine.gain.value = 0.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.35);
    g.gain.setValueAtTime(0.5, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(mix); mix.connect(lp); o2.connect(sine); sine.connect(lp); lp.connect(g);
    var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p){ p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master);
    [o, o2, vib].forEach(function(x){ x.start(t); x.stop(t + dur + 0.05); });
  }

  function wind(){
    var t = ctx.currentTime + 0.05, dur = rnd(3.5, 5);
    var n = ctx.createBufferSource(); n.buffer = noiseBuffer(dur);
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4;
    bp.frequency.setValueAtTime(380, t);
    bp.frequency.linearRampToValueAtTime(rnd(750, 950), t + dur * 0.45);
    bp.frequency.linearRampToValueAtTime(420, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(3, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(g); g.connect(master);
    n.start(t); n.stop(t + dur);
  }

  var SOUNDS = [owl, wolf, owl, wind]; // owls a bit more often

  function videoHasSound(){
    var v = document.querySelector('video');
    return v && !v.paused && !v.muted;
  }

  function play(){
    if (new Date() >= END){ clearTimeout(timer); return; }
    if (!document.hidden && ctx && ctx.state === 'running' && !videoHasSound() && !document.body.classList.contains('game-open')){
      var i; do { i = Math.floor(Math.random() * SOUNDS.length); } while (SOUNDS[i] === SOUNDS[last] && Math.random() < 0.7);
      last = i;
      try { SOUNDS[i](); } catch(e){}
    }
    schedule(rnd(MIN_GAP, MAX_GAP));
  }
  function schedule(ms){ clearTimeout(timer); timer = setTimeout(play, ms); }

  // phones only allow sound after a touch, so wake the audio on the first one (and again if the phone pauses it)
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(function(ev){
    window.addEventListener(ev, setup, {passive: true, capture: true});
  });
  document.addEventListener('visibilitychange', function(){
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  // for testing: window.__pewSpooky.owl() etc.
  window.__pewSpooky = { owl: function(){ setup(); owl(); }, wolf: function(){ setup(); wolf(); }, wind: function(){ setup(); wind(); } };
})();
