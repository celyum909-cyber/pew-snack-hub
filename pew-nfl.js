/* Depew Snack Hub - NFL score ticker.
   A slanted strip (same angle as the rest of the app) between the Deal of the Day card and the deal alerts,
   with this week's NFL games scrolling across: live scores, finals and upcoming kickoff times.
   Bills games are highlighted. Scores come from ESPN's free public scoreboard and refresh every 30 seconds
   while the strip is on screen. If the scores can't load, the strip hides itself.
   Loaded by pew-catalog.js. To remove it, delete the "pew-nfl.js" block at the bottom of pew-catalog.js. */
(function(){
  var API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
  var REFRESH = 30000, SPEED = 45; // scroll speed in pixels per second

  var css = document.createElement('style');
  css.textContent =
    '#pew-nfl{position:relative;z-index:3;width:100%;margin:40px 0 18px;padding:5px 0;background:linear-gradient(90deg,#0756d9,#ed0015);transform:skewY(-6deg);filter:drop-shadow(0 12px 15px #0008)}' +
    '#pew-nfl[hidden]{display:none}' +
    '#pew-nfl .nfl-in{display:flex;align-items:center;height:56px;background:#020203;color:#fff;overflow:hidden;box-shadow:inset 0 1px 0 #ffffff18}' +
    '#pew-nfl .nfl-tag{flex:none;display:flex;align-items:center;gap:6px;height:100%;padding:0 12px 0 14px;background:#020203;font-size:13px;font-weight:950;letter-spacing:1px;color:#ffe340;position:relative;z-index:1;box-shadow:10px 0 12px #020203}' +
    '#pew-nfl .nfl-view{flex:1;min-width:0;overflow:hidden;height:100%;display:flex;align-items:center}' +
    '#pew-nfl .nfl-track{display:flex;width:max-content;will-change:transform;animation:nflscroll var(--nfl-dur,40s) linear infinite}' +
    '#pew-nfl.paused .nfl-track{animation-play-state:paused}' +
    '@keyframes nflscroll{to{transform:translateX(-50%)}}' +
    '@media (prefers-reduced-motion:reduce){#pew-nfl .nfl-view{overflow-x:auto}#pew-nfl .nfl-track{animation:none}}' +
    '#pew-nfl .g{display:inline-flex;align-items:center;gap:7px;padding:0 16px;font-size:15px;white-space:nowrap;border-right:1px solid #ffffff1f}' +
    '#pew-nfl .t{font-weight:800;letter-spacing:.3px}#pew-nfl .s{font-weight:950;font-variant-numeric:tabular-nums}' +
    '#pew-nfl .lose{opacity:.55}#pew-nfl .at{color:#8b98a5;font-size:12px}' +
    '#pew-nfl .b{font-size:10px;font-weight:900;padding:3px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:.3px}' +
    '#pew-nfl .b.live{background:#2ecc71;color:#06210f}#pew-nfl .b.final{background:#3a4350;color:#e8edf2}#pew-nfl .b.pre{background:#16263a;color:#9fb4cc}' +
    '#pew-nfl .g.bills{background:linear-gradient(90deg,#0756d933,#ed001533)}#pew-nfl .g.bills .t{color:#ffe340}' +
    '#pew-nfl .dot{width:7px;height:7px;border-radius:50%;background:#2ecc71;box-shadow:0 0 0 0 #2ecc71aa;animation:nflpulse 1.6s infinite}' +
    '@keyframes nflpulse{70%{box-shadow:0 0 0 7px #2ecc7100}100%{box-shadow:0 0 0 0 #2ecc7100}}';

  var box, track, timer = 0, lastHtml = '', visible = true;

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function kickoff(ev, comp){
    var d = new Date(comp.date || ev.date);
    if (isNaN(d)) return comp.status.type.shortDetail || 'Upcoming';
    var today = new Date(), tom = new Date(); tom.setDate(today.getDate() + 1);
    var time = d.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    if (d.toDateString() === today.toDateString()) return time;
    if (d.toDateString() === tom.toDateString()) return 'Tmrw ' + time;
    return d.toLocaleDateString([], {weekday: 'short'}) + ' ' + time;
  }

  function gameHtml(ev){
    var comp = ev.competitions && ev.competitions[0]; if (!comp) return '';
    var away = null, home = null;
    (comp.competitors || []).forEach(function(c){ if (c.homeAway === 'home') home = c; else away = c; });
    if (!away || !home) return '';
    var state = comp.status && comp.status.type ? comp.status.type.state : 'pre';
    var bills = [away, home].some(function(c){ return c.team && c.team.abbreviation === 'BUF'; });
    var ab = function(c){ return esc(c.team ? c.team.abbreviation : '?'); };
    var badge, aCls = '', hCls = '';
    if (state === 'in'){ badge = '<span class="b live">' + esc(comp.status.type.shortDetail || 'Live') + '</span>'; }
    else if (state === 'post'){
      badge = '<span class="b final">Final</span>';
      var as = +away.score, hs = +home.score;
      if (as > hs) hCls = ' lose'; else if (hs > as) aCls = ' lose';
    }
    else badge = '<span class="b pre">' + esc(kickoff(ev, comp)) + '</span>';
    var scores = state !== 'pre';
    return '<span class="g' + (bills ? ' bills' : '') + '">' +
      '<span class="t' + aCls + '">' + ab(away) + '</span>' + (scores ? '<span class="s' + aCls + '">' + esc(away.score) + '</span>' : '') +
      '<span class="at">@</span>' +
      '<span class="t' + hCls + '">' + ab(home) + '</span>' + (scores ? '<span class="s' + hCls + '">' + esc(home.score) + '</span>' : '') +
      badge + '</span>';
  }

  function load(){
    clearTimeout(timer);
    if (document.hidden || (!visible && !box.hidden)){ timer = setTimeout(load, REFRESH); return; }
    fetch(API, {cache: 'no-store'}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
      var evs = (d && d.events) || [];
      // live games first, then upcoming, then finals
      var rank = {'in': 0, 'pre': 1, 'post': 2};
      evs.sort(function(a, b){
        var sa = a.competitions[0].status.type.state, sb = b.competitions[0].status.type.state;
        return (rank[sa] - rank[sb]) || (new Date(a.date) - new Date(b.date));
      });
      var html = evs.map(gameHtml).join('');
      if (!html){ box.hidden = true; return; }
      var live = evs.some(function(e){ return e.competitions[0].status.type.state === 'in'; });
      box.querySelector('.nfl-tag').innerHTML = (live ? '<span class="dot"></span>' : '🏈') + 'NFL';
      if (html !== lastHtml){
        lastHtml = html;
        track.innerHTML = html + html; // two copies so the loop is seamless
        requestAnimationFrame(function(){ track.style.setProperty('--nfl-dur', Math.max(20, track.scrollWidth / 2 / SPEED) + 's'); });
      }
      box.hidden = false;
    }).catch(function(){ if (!lastHtml) box.hidden = true; })
      .then(function(){ timer = setTimeout(load, REFRESH); });
  }

  function place(){
    var deal = document.getElementById('deal'); if (!deal) return false;
    var alerts = document.getElementById('pew-alerts');
    if (alerts && alerts.parentNode === deal.parentNode) alerts.parentNode.insertBefore(box, alerts);
    else deal.insertAdjacentElement('afterend', box);
    return true;
  }

  function start(){
    document.head.appendChild(css);
    box = document.createElement('section');
    box.id = 'pew-nfl'; box.hidden = true; box.setAttribute('aria-label', 'NFL scores');
    box.innerHTML = '<div class="nfl-in"><span class="nfl-tag">🏈NFL</span><div class="nfl-view"><div class="nfl-track"></div></div></div>';
    track = box.querySelector('.nfl-track');
    if (!place()) return;
    // the deal alerts strip may be added a moment later; keep the ticker above it
    setTimeout(place, 1500); setTimeout(place, 4000);
    // pause scrolling and refreshing when the strip is off screen (easier on the phone)
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(en){
        visible = en[0].isIntersecting; box.classList.toggle('paused', !visible);
        if (visible && Date.now() - (box._last || 0) > REFRESH){ box._last = Date.now(); load(); }
      }).observe(box);
    }
    box._last = Date.now(); load();
    document.addEventListener('visibilitychange', function(){ if (!document.hidden && visible) load(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
