/* Depew Snack Hub - "Deal alerts" (push notifications). Loaded by index.html with one script tag.
   Puts a "Turn on deal alerts" button under the Deal of the Day. When a customer taps it and allows
   notifications, this phone is signed up with the pew-deal Worker. sw.js shows the alerts. */
(function(){
  var API = 'https://pew-deal.celyum909.workers.dev';
  var SYNC_KEY = 'pew-push-sync-v1';

  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  // iPhone only allows alerts for apps added to the Home Screen (iOS 16.4+)
  var needsInstall = isIOS && !installed;
  if (!supported && !needsInstall) return; // very old browser: show nothing

  var css = '.pew-alerts{position:relative;z-index:4;margin:16px 16px 0;display:flex;align-items:center;gap:12px;width:calc(100% - 32px);padding:12px 14px;border:1px solid #ffffff66;border-radius:16px;background:#0c1224;color:#fff;text-align:left;font:inherit;box-shadow:0 8px 20px #0005}'
    + '.pew-alerts:disabled{opacity:.7;cursor:default}.pew-alerts-ico{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#ffe340;color:#0c1224;font-size:19px}'
    + '.pew-alerts-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.pew-alerts-txt b{font-size:15px;font-weight:800}.pew-alerts-txt small{font-size:12.5px;color:#c7ccdb;line-height:1.35}'
    + '.pew-alerts-go{flex:none;padding:8px 13px;border-radius:999px;background:#ed0015;font-size:12px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}'
    + '.pew-alerts.on .pew-alerts-ico{background:#3ee06b}.pew-alerts.on .pew-alerts-go{background:#ffffff1f}';

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  function keyBytes(b64){
    var s = b64.replace(/-/g, '+').replace(/_/g, '/');
    var bin = atob(s + '==='.slice((s.length + 3) % 4));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function post(path, body){
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function(r){ if (!r.ok) throw new Error('server ' + r.status); return r.json(); });
  }
  function getReg(){
    return navigator.serviceWorker.getRegistration().then(function(reg){
      return reg || navigator.serviceWorker.register('sw.js');
    }).then(function(){ return navigator.serviceWorker.ready; });
  }
  function getSub(){ return supported ? getReg().then(function(reg){ return reg.pushManager.getSubscription(); }) : Promise.resolve(null); }

  // fetch the key early so the tap goes straight to the permission prompt
  var keyPromise = null;
  function getKey(){
    if (!keyPromise) keyPromise = fetch(API + '/push/key').then(function(r){ if (!r.ok) throw new Error('key'); return r.json(); })
      .then(function(j){ return j.key; }).catch(function(e){ keyPromise = null; throw e; });
    return keyPromise;
  }

  ready(function(){
    var anchor = document.getElementById('deal');
    if (!anchor) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'pew-alerts'; btn.id = 'pew-alerts';
    btn.innerHTML = '<span class="pew-alerts-ico" aria-hidden="true">🔔</span><span class="pew-alerts-txt"><b></b><small></small></span><span class="pew-alerts-go"></span>';
    anchor.insertAdjacentElement('afterend', btn);
    var titleEl = btn.querySelector('b'), subEl = btn.querySelector('small'), goEl = btn.querySelector('.pew-alerts-go');
    var state = 'off', busy = false;

    function show(s, note){
      state = s; btn.classList.toggle('on', s === 'on'); btn.disabled = s === 'blocked';
      goEl.hidden = s === 'blocked';
      if (s === 'install'){ titleEl.textContent = 'Get deal alerts'; subEl.textContent = note || 'Add the app to your Home Screen first, then turn alerts on there.'; goEl.textContent = 'How'; }
      else if (s === 'on'){ titleEl.textContent = 'Deal alerts are on'; subEl.textContent = note || "We'll let you know when there's a new Deal of the Day."; goEl.textContent = 'Turn off'; }
      else if (s === 'blocked'){ titleEl.textContent = 'Deal alerts are blocked'; subEl.textContent = 'To get them, allow notifications for this site in your phone settings.'; }
      else { titleEl.textContent = 'Get deal alerts'; subEl.textContent = note || 'A quick heads-up on your phone when there’s a new Deal of the Day.'; goEl.textContent = 'Turn on'; }
    }

    function refresh(){
      if (needsInstall) return show('install');
      if (Notification.permission === 'denied') return show('blocked');
      getSub().then(function(sub){
        if (sub && Notification.permission === 'granted'){
          show('on');
          // keep the Worker's list fresh (cheap: the Worker only writes when something changed)
          var last = 0; try { last = +localStorage.getItem(SYNC_KEY) || 0; } catch (e) {}
          if (Date.now() - last > 7 * 864e5) post('/push/subscribe', { subscription: sub.toJSON() }).then(function(){ try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch (e) {} }).catch(function(){});
        } else show('off');
      }).catch(function(){ show('off'); });
    }

    function turnOn(){
      busy = true; subEl.textContent = 'Turning on…';
      // ask first, straight from the tap (iPhone requires that)
      var ask = Notification.requestPermission ? Notification.requestPermission() : Promise.resolve('default');
      Promise.resolve(ask).then(function(p){
        if (p !== 'granted'){ if (p === 'denied') show('blocked'); else show('off', 'No problem - tap again any time.'); throw null; }
        return Promise.all([getReg(), getKey()]);
      }).then(function(r){
        var reg = r[0], key = r[1];
        return reg.pushManager.getSubscription().then(function(old){
          return old || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
        });
      }).then(function(sub){
        return post('/push/subscribe', { subscription: sub.toJSON() });
      }).then(function(){
        try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch (e) {}
        show('on', "You're all set! We'll ping you when the deal changes.");
      }).catch(function(e){
        if (e !== null) show('off', "Couldn't turn alerts on right now. Please try again.");
      }).then(function(){ busy = false; });
    }

    function turnOff(){
      busy = true; subEl.textContent = 'Turning off…';
      getSub().then(function(sub){
        if (!sub) return;
        var ep = sub.endpoint;
        return sub.unsubscribe().then(function(){ return post('/push/unsubscribe', { endpoint: ep }).catch(function(){}); });
      }).then(function(){ try { localStorage.removeItem(SYNC_KEY); } catch (e) {} show('off', 'Alerts are off. Tap to turn them back on.'); })
        .catch(function(){ show('on', "Couldn't turn alerts off. Try again."); })
        .then(function(){ busy = false; });
    }

    btn.addEventListener('click', function(){
      if (busy) return;
      if (state === 'install'){ if (window.pewShowInstall) window.pewShowInstall(); return; }
      if (state === 'on') turnOff(); else if (state === 'off') turnOn();
    });

    refresh();
    if (supported && !needsInstall && Notification.permission !== 'denied') getKey().catch(function(){});
  });
})();
