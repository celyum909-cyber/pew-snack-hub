/* Depew Snack Hub - NFL score ticker.
   A slanted strip (same angle as the rest of the app) between the Deal of the Day card and the deal alerts,
   with this week's NFL games scrolling across: live scores, finals and upcoming kickoff times.
   Tap a game to open a card with more about it: records, quarter-by-quarter score, who has the ball,
   down and distance, last play, win chances, top players, TV channel and stadium.
   On days with no NFL games the strip folds down to a small "NFL" tag. Tapping the tag opens it to show
   that there are no games today and what's coming up next; tapping it again closes it.
   Bills games are highlighted. Scores come from ESPN's free public scoreboard and refresh every 30 seconds
   while the strip is on screen. If the scores can't load, the strip hides itself.
   Loaded by pew-catalog.js. To remove it, delete the "pew-nfl.js" block at the bottom of pew-catalog.js. */
(function(){
  var API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
  var REFRESH = 30000, SPEED = 45; // scroll speed in pixels per second
  var CARD_REFRESH = 15000;        // how often an open game card updates

  var css = document.createElement('style');
  css.textContent =
    '#pew-nfl{position:relative;z-index:3;width:100%;margin:40px 0 18px;padding:5px 0;background:linear-gradient(90deg,#0756d9,#ed0015);transform:skewY(-6deg);filter:drop-shadow(0 12px 15px #0008)}' +
    '#pew-nfl[hidden]{display:none}' +
    '#pew-nfl .nfl-in{display:flex;align-items:center;height:56px;background:#020203;color:#fff;overflow:hidden;box-shadow:inset 0 1px 0 #ffffff18}' +
    '#pew-nfl .nfl-tag{flex:none;display:flex;align-items:center;gap:6px;height:100%;margin:0;border:0;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;padding:0 12px 0 14px;background:#020203;font-size:13px;font-weight:950;letter-spacing:1px;color:#ffe340;position:relative;z-index:1;box-shadow:10px 0 12px #020203}' +
    '#pew-nfl .nfl-view{flex:1;min-width:0;overflow:hidden;height:100%;display:flex;align-items:center}' +
    '#pew-nfl .nfl-track{display:flex;width:max-content;will-change:transform;animation:nflscroll var(--nfl-dur,40s) linear infinite}' +
    '#pew-nfl.paused .nfl-track,#pew-nfl .nfl-track.still{animation-play-state:paused}' +
    '#pew-nfl .car{font-size:11px;color:#8b98a5;margin-left:2px;transition:transform .2s}#pew-nfl:not(.closed) .car{transform:rotate(90deg)}' +
    '#pew-nfl .msg{display:inline-flex;align-items:center;gap:8px;height:56px;padding:0 16px;font-size:14px;font-weight:800;color:#c9d3dd;white-space:nowrap;border-right:1px solid #ffffff1f}#pew-nfl .msg em{font-style:normal;color:#8b98a5;font-weight:700}' +
    /* folded down to a small tag on days with no games */
    '#pew-nfl.closed{width:max-content;margin:30px 0 10px 16px;padding:3px}#pew-nfl.closed .nfl-in{height:38px}#pew-nfl.closed .nfl-view{display:none}#pew-nfl.closed .nfl-tag{box-shadow:none;padding:0 14px}' +
    '@keyframes nflscroll{to{transform:translateX(-50%)}}' +
    '@media (prefers-reduced-motion:reduce){#pew-nfl .nfl-view{overflow-x:auto}#pew-nfl .nfl-track{animation:none}}' +
    '#pew-nfl .g{display:inline-flex;align-items:center;gap:7px;height:56px;margin:0;padding:0 16px;border:0;border-right:1px solid #ffffff1f;background:none;color:inherit;font:inherit;font-size:15px;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '#pew-nfl .g:active{background:#ffffff14}#pew-nfl.touch .nfl-track{animation-play-state:paused}' +
    '#pew-nfl .t{font-weight:800;letter-spacing:.3px}#pew-nfl .s{font-weight:950;font-variant-numeric:tabular-nums}' +
    '#pew-nfl .lose{opacity:.55}#pew-nfl .at{color:#8b98a5;font-size:12px}' +
    '#pew-nfl .b{font-size:10px;font-weight:900;padding:3px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:.3px}' +
    '#pew-nfl .b.live{background:#2ecc71;color:#06210f}#pew-nfl .b.final{background:#3a4350;color:#e8edf2}#pew-nfl .b.pre{background:#16263a;color:#9fb4cc}' +
    '#pew-nfl .g.bills{background:linear-gradient(90deg,#0756d933,#ed001533)}#pew-nfl .g.bills .t{color:#ffe340}' +
    '#pew-nfl .dot,#nfl-card .dot{width:7px;height:7px;border-radius:50%;background:#2ecc71;box-shadow:0 0 0 0 #2ecc71aa;animation:nflpulse 1.6s infinite}' +
    '@keyframes nflpulse{70%{box-shadow:0 0 0 7px #2ecc7100}100%{box-shadow:0 0 0 0 #2ecc7100}}' +
    /* game card */
    '#nfl-ov{position:fixed;inset:0;z-index:1600;background:#000b;display:flex;align-items:flex-end;justify-content:center}' +
    '#nfl-ov[hidden]{display:none}' +
    '#nfl-card{width:100%;max-width:480px;max-height:92%;overflow:auto;background:#0b0f14;color:#e8edf2;border-radius:20px 20px 0 0;padding:14px 16px calc(22px + env(safe-area-inset-bottom));font-family:inherit;border-top:4px solid;border-image:linear-gradient(90deg,#0756d9,#ed0015) 1;animation:nflup .25s ease-out}' +
    '@keyframes nflup{from{transform:translateY(40px);opacity:0}}' +
    '#nfl-card .top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}' +
    '#nfl-card .st{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;color:#9fb4cc}' +
    '#nfl-card .st.live{color:#2ecc71}#nfl-card .x{width:38px;height:38px;flex:none;border-radius:50%;border:1px solid #ffffff30;background:#1a222d;color:#fff;font-size:22px;line-height:1}' +
    '#nfl-card .team{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:#121821;margin-top:8px;border-left:5px solid var(--tc,#444)}' +
    '#nfl-card .team img{width:42px;height:42px;object-fit:contain;flex:none}' +
    '#nfl-card .tn{flex:1;min-width:0}#nfl-card .tn b{display:block;font-size:17px;font-weight:900;line-height:1.15}#nfl-card .tn small{font-size:12.5px;color:#8b98a5}' +
    '#nfl-card .ball{font-size:14px;margin-left:4px}#nfl-card .to{display:inline-flex;gap:3px;margin-left:8px;vertical-align:middle}#nfl-card .to i{width:9px;height:4px;border-radius:2px;background:#ffe340}#nfl-card .to i.u{background:#ffffff26}' +
    '#nfl-card .pts{font-size:32px;font-weight:950;font-variant-numeric:tabular-nums}#nfl-card .lose{opacity:.5}' +
    '#nfl-card .sit{margin-top:12px;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,#0756d92e,#ed00152e);border:1px solid #ffffff1f}' +
    '#nfl-card .sit b{display:block;font-size:18px;font-weight:950}#nfl-card .rz{display:inline-block;margin-left:8px;padding:2px 7px;border-radius:4px;background:#ed0015;color:#fff;font-size:11px;font-weight:900;vertical-align:middle}' +
    '#nfl-card .sit p{margin:6px 0 0;font-size:14px;line-height:1.4;color:#c9d3dd}' +
    '#nfl-card h4{margin:18px 0 8px;font-size:12px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;color:#8b98a5}' +
    '#nfl-card .wp i{display:block;height:100%}#nfl-card .wp{display:flex;height:10px;border-radius:5px;overflow:hidden;background:#222}#nfl-card .wpl{display:flex;justify-content:space-between;margin-top:6px;font-size:13px;font-weight:800}' +
    '#nfl-card table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}#nfl-card th{font-size:11px;color:#8b98a5;font-weight:800;padding:4px 6px;text-align:center}#nfl-card th:first-child,#nfl-card td:first-child{text-align:left}' +
    '#nfl-card td{padding:7px 6px;text-align:center;border-top:1px solid #ffffff14}#nfl-card td:last-child{font-weight:950}' +
    '#nfl-card .ld{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid #ffffff14;font-size:14px}#nfl-card .ld span{color:#8b98a5}#nfl-card .ld b{text-align:right}' +
    '#nfl-card .info{margin-top:16px;font-size:13px;color:#8b98a5;line-height:1.6}#nfl-card .info b{color:#e8edf2}';

  var box, track, timer = 0, lastHtml = '', visible = true, byId = {};
  var gameDay = null, userOpen = null; // userOpen: null = automatic, true/false = the customer tapped the tag

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
    return '<button type="button" class="g' + (bills ? ' bills' : '') + '" data-id="' + esc(ev.id) + '" aria-label="' + esc(ev.name || '') + ' - tap for details">' +
      '<span class="t' + aCls + '">' + ab(away) + '</span>' + (scores ? '<span class="s' + aCls + '">' + esc(away.score) + '</span>' : '') +
      '<span class="at">@</span>' +
      '<span class="t' + hCls + '">' + ab(home) + '</span>' + (scores ? '<span class="s' + hCls + '">' + esc(home.score) + '</span>' : '') +
      badge + '</button>';
  }

  function load(){
    clearTimeout(timer);
    var open = ov && !ov.hidden;
    if (document.hidden || (!visible && !box.hidden && !open)){ timer = setTimeout(load, REFRESH); return; }
    fetch(API, {cache: 'no-store'}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
      var evs = (d && d.events) || [];
      byId = {}; evs.forEach(function(e){ byId[e.id] = e; });
      if (ov && !ov.hidden) renderCard();
      // live games first, then upcoming, then finals
      var rank = {'in': 0, 'pre': 1, 'post': 2};
      evs.sort(function(a, b){
        var sa = a.competitions[0].status.type.state, sb = b.competitions[0].status.type.state;
        return (rank[sa] - rank[sb]) || (new Date(a.date) - new Date(b.date));
      });
      // is there NFL football today? (a game live right now, or one that starts/started today)
      var today = new Date().toDateString();
      var isDay = evs.some(function(e){ var st = e.competitions[0].status.type.state; return st === 'in' || new Date(e.competitions[0].date || e.date).toDateString() === today; });
      if (isDay !== gameDay){ gameDay = isDay; userOpen = null; }
      var live = evs.some(function(e){ return e.competitions[0].status.type.state === 'in'; });
      var html, still = false;
      if (gameDay) html = evs.map(gameHtml).join('');
      else {
        var next = evs.filter(function(e){ return e.competitions[0].status.type.state === 'pre'; }).map(gameHtml).join('');
        html = '<span class="msg">No NFL games today' + (next ? ' <em>· Coming up:</em>' : '') + '</span>' + next;
        still = !next;
      }
      box.querySelector('.nfl-tag').innerHTML = (live ? '<span class="dot"></span>' : '🏈') + 'NFL<span class="car" aria-hidden="true">▶</span>';
      if (html !== lastHtml){
        lastHtml = html;
        track.innerHTML = still ? html : html + html; // two copies so the loop is seamless
        track.classList.toggle('still', still);
        requestAnimationFrame(function(){ track.style.setProperty('--nfl-dur', Math.max(20, track.scrollWidth / 2 / SPEED) + 's'); });
      }
      applyOpen();
      box.hidden = false;
    }).catch(function(){ if (!lastHtml) box.hidden = true; })
      .then(function(){ timer = setTimeout(load, ov && !ov.hidden ? CARD_REFRESH : REFRESH); });
  }

  // ---------- game card ----------
  var ov = null, card = null, openId = null, holdT = 0;
  function sideOf(comp){ var a = null, h = null; (comp.competitors || []).forEach(function(c){ if (c.homeAway === 'home') h = c; else a = c; }); return {away: a, home: h}; }
  function rec(c){ var r = (c.records || []).filter(function(x){ return x.name === 'overall' || x.type === 'total'; })[0] || (c.records || [])[0]; return r ? r.summary : ''; }
  function col(c){ var t = c.team || {}; return '#' + (t.color && t.color !== '000000' ? t.color : (t.alternateColor || '444444')); }
  function renderCard(){
    var ev = byId[openId]; if (!ev){ card.innerHTML = '<div class="top"><span class="st">Game not found</span><button type="button" class="x" aria-label="Close">×</button></div>'; return; }
    var comp = ev.competitions[0], t = comp.status.type, state = t.state, sd = sideOf(comp), a = sd.away, h = sd.home;
    var sit = comp.situation || {}, poss = state === 'in' ? sit.possession : null;
    var aL = '', hL = '';
    if (state === 'post'){ if (+a.score > +h.score) hL = ' lose'; else if (+h.score > +a.score) aL = ' lose'; }
    var tvs = []; (comp.broadcasts || []).forEach(function(b){ (b.names || []).forEach(function(n){ if (tvs.indexOf(n) < 0) tvs.push(n); }); });
    var stTxt = state === 'in' ? '<span class="dot"></span>' + esc(t.detail || t.shortDetail || 'Live') : state === 'post' ? esc(t.detail || 'Final') : esc(new Date(comp.date || ev.date).toLocaleString([], {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}));
    function teamRow(c, lose, side){
      var tm = c.team || {}, to = sit[side + 'Timeouts'], tos = '';
      if (state === 'in' && to != null){ tos = '<span class="to" aria-label="' + to + ' timeouts left">'; for (var i = 0; i < 3; i++) tos += '<i class="' + (i < to ? '' : 'u') + '"></i>'; tos += '</span>'; }
      return '<div class="team" style="--tc:' + col(c) + '">' + (tm.logo ? '<img src="' + esc(tm.logo) + '" alt="" loading="lazy">' : '') +
        '<div class="tn' + lose + '"><b>' + esc(tm.displayName || tm.abbreviation) + (poss && poss === (tm.id || c.id) ? '<span class="ball" title="Has the ball">🏈</span>' : '') + '</b><small>' + esc(rec(c)) + (side === 'home' ? ' · Home' : ' · Away') + '</small>' + tos + '</div>' +
        (state !== 'pre' ? '<span class="pts' + lose + '">' + esc(c.score) + '</span>' : '') + '</div>';
    }
    var html = '<div class="top"><span class="st' + (state === 'in' ? ' live' : '') + '">' + stTxt + '</span><button type="button" class="x" aria-label="Close">×</button></div>' +
      teamRow(a, aL, 'away') + teamRow(h, hL, 'home');
    if (state === 'in' && (sit.downDistanceText || (sit.lastPlay && sit.lastPlay.text))){
      html += '<div class="sit">' + (sit.downDistanceText ? '<b>' + esc(sit.downDistanceText) + (sit.isRedZone ? '<span class="rz">RED ZONE</span>' : '') + '</b>' : '') +
        (sit.lastPlay && sit.lastPlay.text ? '<p><strong>Last play:</strong> ' + esc(sit.lastPlay.text) + '</p>' : '') +
        (sit.lastPlay && sit.lastPlay.drive && sit.lastPlay.drive.description ? '<p>Drive: ' + esc(sit.lastPlay.drive.description) + '</p>' : '') + '</div>';
    }
    var pr = sit.lastPlay && sit.lastPlay.probability;
    if (state === 'in' && pr && pr.homeWinPercentage != null){
      var hp = Math.round(pr.homeWinPercentage * 100), ap = 100 - hp;
      html += '<h4>Chance to win</h4><div class="wp"><i style="width:' + ap + '%;background:' + col(a) + '"></i><i style="width:' + hp + '%;background:' + col(h) + '"></i></div>' +
        '<div class="wpl"><span>' + esc(a.team.abbreviation) + ' ' + ap + '%</span><span>' + esc(h.team.abbreviation) + ' ' + hp + '%</span></div>';
    }
    var al = a.linescores || [], hl = h.linescores || [], n = Math.max(al.length, hl.length);
    if (state !== 'pre' && n){
      var hd = '<tr><th></th>', ra = '<tr><td>' + esc(a.team.abbreviation) + '</td>', rh = '<tr><td>' + esc(h.team.abbreviation) + '</td>';
      for (var q = 0; q < Math.max(4, n); q++){
        hd += '<th>' + (q < 4 ? 'Q' + (q + 1) : 'OT') + '</th>';
        ra += '<td>' + (al[q] ? esc(al[q].value) : '–') + '</td>'; rh += '<td>' + (hl[q] ? esc(hl[q].value) : '–') + '</td>';
      }
      html += '<h4>Score by quarter</h4><table>' + hd + '<th>T</th></tr>' + ra + '<td>' + esc(a.score) + '</td></tr>' + rh + '<td>' + esc(h.score) + '</td></tr></table>';
    }
    var labels = {passingYards: 'Passing', rushingYards: 'Rushing', receivingYards: 'Receiving'}, abbrById = {};
    [a, h].forEach(function(c){ abbrById[(c.team && c.team.id) || c.id] = c.team ? c.team.abbreviation : ''; });
    var leads = (comp.leaders || []).filter(function(l){ return labels[l.name] && l.leaders && l.leaders[0]; });
    if (state !== 'pre' && leads.length){
      html += '<h4>Top players</h4>' + leads.map(function(l){ var x = l.leaders[0], tid = x.team && x.team.id;
        return '<div class="ld"><span>' + labels[l.name] + '</span><b>' + esc(x.athlete ? (x.athlete.shortName || x.athlete.displayName) : '') + (abbrById[tid] ? ' (' + esc(abbrById[tid]) + ')' : '') + ' · ' + esc(x.displayValue) + '</b></div>'; }).join('');
    }
    var odds = comp.odds && comp.odds[0];
    var info = [];
    if (tvs.length) info.push('📺 <b>' + esc(tvs.join(', ')) + '</b>');
    if (comp.venue && comp.venue.fullName) info.push('🏟️ ' + esc(comp.venue.fullName) + (comp.venue.address && comp.venue.address.city ? ', ' + esc(comp.venue.address.city) : ''));
    if (state === 'pre' && odds && odds.details) info.push('Line: ' + esc(odds.details) + (odds.overUnder ? ' · O/U ' + esc(odds.overUnder) : ''));
    html += '<div class="info">' + info.join('<br>') + (state === 'in' ? '<br>Updates every 15 seconds.' : '') + '</div>';
    card.innerHTML = html;
  }
  function openGame(id){
    if (!ov){
      ov = document.createElement('div'); ov.id = 'nfl-ov'; ov.hidden = true;
      card = document.createElement('div'); card.id = 'nfl-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Game details');
      ov.appendChild(card); document.body.appendChild(ov);
      ov.addEventListener('click', function(e){ if (e.target === ov || e.target.closest('.x')) closeGame(); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && ov && !ov.hidden) closeGame(); });
    }
    openId = id; renderCard(); ov.hidden = false; document.documentElement.style.overflow = 'hidden';
    clearTimeout(timer); timer = setTimeout(load, CARD_REFRESH);
  }
  function closeGame(){ ov.hidden = true; openId = null; document.documentElement.style.overflow = ''; clearTimeout(timer); timer = setTimeout(load, REFRESH); }

  function applyOpen(){
    var open = userOpen != null ? userOpen : !!gameDay;
    box.classList.toggle('closed', !open);
    var tag = box.querySelector('.nfl-tag');
    tag.setAttribute('aria-expanded', open ? 'true' : 'false');
    tag.setAttribute('aria-label', open ? 'NFL scores - tap to close' : 'NFL scores - tap to open');
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
    box.innerHTML = '<div class="nfl-in"><button type="button" class="nfl-tag">🏈NFL</button><div class="nfl-view"><div class="nfl-track"></div></div></div>';
    track = box.querySelector('.nfl-track');
    // hold the strip still while a finger is on it, so a game is easy to tap
    box.addEventListener('pointerdown', function(){ clearTimeout(holdT); box.classList.add('touch'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(ev){ box.addEventListener(ev, function(){ clearTimeout(holdT); holdT = setTimeout(function(){ box.classList.remove('touch'); }, 1500); }); });
    box.querySelector('.nfl-tag').addEventListener('click', function(){ userOpen = box.classList.contains('closed'); applyOpen(); });
    track.addEventListener('click', function(e){ var g = e.target.closest('.g'); if (g && g.dataset.id) openGame(g.dataset.id); });
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
