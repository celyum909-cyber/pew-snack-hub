/* Pickup ordering (PILOT): customers add items, place an order, pay at the counter, pick it up.
   No card is taken in the pilot. Orders go to the Worker; staff see them in the manager app's Orders tab.
   To remove the feature, delete the "pew-orders.js" block at the bottom of pew-catalog.js. */
(function(){
  var W='https://pew-deal.celyum909.workers.dev';
  var LS_CART='pew-cart',LS_ORD='pew-order';
  function get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
  function set(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  function cents(s){var m=String(s||'').match(/^\$\s*(\d+)(?:\.(\d{1,2}))?$/);if(!m)return null;return parseInt(m[1],10)*100+(m[2]?parseInt((m[2]+'0').slice(0,2),10):0)}
  function money(c){return '$'+(c/100).toFixed(2)}
  var cart=get(LS_CART)||[];if(!Array.isArray(cart))cart=[];
  var active=get(LS_ORD); // {id,t,num,status}
  var STATUS={new:['Order received','Staff will start on it soon.'],ready:['Ready for pickup!','Come on in. Pay at the counter and give your name.'],done:['Picked up','Thanks for ordering!'],cancelled:['Order cancelled','Please ask at the counter if you have questions.']};

  var css=document.createElement('style');
  css.textContent=
  '#po-dock{position:fixed;left:0;right:0;bottom:calc(10px + env(safe-area-inset-bottom));z-index:900;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;padding:0 12px}'+
  '#po-dock>button{pointer-events:auto;width:100%;max-width:456px;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 16px;border-radius:14px;border:1px solid #ffffff30;font-weight:800;font-size:15px;color:#fff;box-shadow:0 8px 24px #000a;text-align:left}'+
  '#po-bar{background:#ef233c}#po-chip{background:#14121a}#po-chip.ready{background:#0f7a3b;animation:populse 1.6s ease-in-out infinite}'+
  '@keyframes populse{50%{box-shadow:0 0 0 6px #3ddc8444}}'+
  '#po-bar small,#po-chip small{display:block;font-weight:600;font-size:12px;opacity:.85;margin-top:2px}'+
  '.po-add{display:block;width:100%;margin:14px 0 4px;padding:14px;border:0;border-radius:12px;background:#ef233c;color:#fff;font-weight:900;font-size:16px}'+
  '.po-add.added{background:#0f7a3b}'+
  '#po-ov{position:fixed;inset:0;z-index:1500;background:#000b;display:flex;align-items:flex-end;justify-content:center}'+
  '#po-ov[hidden]{display:none}'+
  '#po-sheet{width:100%;max-width:480px;max-height:92%;overflow:auto;background:#101016;color:#f3f3f7;border-radius:20px 20px 0 0;padding:18px 16px calc(20px + env(safe-area-inset-bottom));font-family:inherit}'+
  '#po-sheet h2{margin:0 0 4px;font-size:22px}#po-sheet p{margin:0 0 12px;font-size:14px;line-height:1.4;color:#c9c9d2}'+
  '.po-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}'+
  '.po-x{width:38px;height:38px;border-radius:50%;border:1px solid #ffffff30;background:#1b1b24;color:#fff;font-size:22px;line-height:1}'+
  '.po-pilot{margin:0 0 12px;padding:10px 12px;border-radius:10px;background:#2a2308;border:1px solid #ffd43b66;color:#ffe48a;font-size:13px;line-height:1.4}'+
  '.po-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #ffffff18}'+
  '.po-row img{width:48px;height:48px;border-radius:8px;object-fit:cover;background:#222;flex:none}'+
  '.po-row .po-n{flex:1;min-width:0;font-weight:700;font-size:14px;line-height:1.25}.po-row .po-n span{display:block;font-weight:500;font-size:12px;color:#a9a9b4}'+
  '.po-q{display:flex;align-items:center;gap:8px}.po-q button{width:32px;height:32px;border-radius:50%;border:1px solid #ffffff40;background:#1b1b24;color:#fff;font-size:18px;font-weight:800}.po-q b{min-width:16px;text-align:center}'+
  '.po-total{display:flex;justify-content:space-between;font-weight:900;font-size:17px;margin:12px 0}'+
  '#po-sheet label{display:block;margin:10px 0 4px;font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#a9a9b4}'+
  '#po-sheet input,#po-sheet textarea{width:100%;padding:12px;border-radius:10px;border:1px solid #ffffff30;background:#1b1b24;color:#fff;font:inherit;font-size:16px}'+
  '.po-go{display:block;width:100%;margin-top:14px;padding:15px;border:0;border-radius:12px;background:#ef233c;color:#fff;font-weight:900;font-size:17px}.po-go[disabled]{opacity:.55}'+
  '.po-link{display:block;margin:12px auto 0;background:none;border:0;color:#9ab;text-decoration:underline;font-size:13px}'+
  '.po-err{margin-top:10px;color:#ff8a95;font-size:14px;font-weight:700}'+
  '.po-big{font-size:64px;font-weight:900;line-height:1;text-align:center;margin:8px 0;color:#ffd43b}'+
  '.po-stat{text-align:center;font-size:20px;font-weight:900;margin:4px 0}.po-stat.ready{color:#3ddc84}'+
  '.po-list{margin:12px 0;padding:0;list-style:none;font-size:14px;color:#d8d8e0}.po-list li{padding:4px 0}';
  document.head.appendChild(css);

  var dock=el('div');dock.id='po-dock';
  var chip=el('button');chip.id='po-chip';chip.type='button';chip.hidden=true;
  var bar=el('button');bar.id='po-bar';bar.type='button';bar.hidden=true;
  dock.append(chip,bar);
  var ov=el('div');ov.id='po-ov';ov.hidden=true;var sheet=el('div');sheet.id='po-sheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','Your pickup order');ov.append(sheet);

  function count(){return cart.reduce(function(a,i){return a+i.q},0)}
  function total(){var c=0,u=false;cart.forEach(function(i){if(i.c==null)u=true;else c+=i.c*i.q});return{c:c,u:u}}
  function saveCart(){set(LS_CART,cart);paint()}
  function paint(){
    var n=count(),t=total();
    bar.hidden=n===0;
    if(n){bar.textContent='';var l=el('span','',null);l.append(document.createTextNode('View your order · '+n+(n===1?' item':' items')));var s=el('small','',t.c?('About '+money(t.c)+(t.u?' + items priced at the counter':'')):'Priced at the counter');l.append(s);bar.append(l,el('span','','›'))}
    if(active&&STATUS[active.status]){
      chip.hidden=false;chip.className=active.status==='ready'?'ready':'';chip.id='po-chip';
      chip.textContent='';var l2=el('span','');l2.append(document.createTextNode('Order #'+active.num+' · '+STATUS[active.status][0]));l2.append(el('small','',STATUS[active.status][1]));chip.append(l2,el('span','','›'));
    }else chip.hidden=true;
  }
  function addItem(it){
    var f=cart.filter(function(x){return x.n===it.n&&x.p===it.p})[0];
    if(f)f.q=Math.min(20,f.q+1);else cart.push({n:it.n,p:it.p,c:cents(it.p),q:1,img:it.img});
    saveCart();
  }
  function head(title,sub){var top=el('div','po-top');top.append(el('h2','',title));var x=el('button','po-x','×');x.type='button';x.setAttribute('aria-label','Close');x.onclick=closeSheet;top.append(x);sheet.append(top);if(sub)sheet.append(el('p','',sub))}
  function openSheet(){ov.hidden=false;document.documentElement.style.overflow='hidden'}
  function closeSheet(){ov.hidden=true;document.documentElement.style.overflow=''}
  ov.addEventListener('click',function(e){if(e.target===ov)closeSheet()});

  function viewCart(){
    sheet.textContent='';
    if(!cart.length){head('Your order','Nothing here yet. Open a snack and tap Add to order.');return}
    head('Your pickup order');
    sheet.append(el('div','po-pilot','PILOT: no card needed. Place your order, then pay at the counter when you pick it up.'));
    cart.forEach(function(i,ix){
      var r=el('div','po-row');
      if(i.img){var im=el('img');im.alt='';im.src=i.img;r.append(im)}
      var nm=el('div','po-n',i.n);nm.append(el('span','',i.p||'Price at counter'));r.append(nm);
      var q=el('div','po-q');var m=el('button','','−');m.type='button';m.setAttribute('aria-label','Less');var b=el('b','',String(i.q));var p=el('button','','+');p.type='button';p.setAttribute('aria-label','More');
      m.onclick=function(){i.q--;if(i.q<1)cart.splice(ix,1);saveCart();viewCart()};
      p.onclick=function(){i.q=Math.min(20,i.q+1);saveCart();viewCart()};
      q.append(m,b,p);r.append(q);sheet.append(r);
    });
    var t=total(),tr=el('div','po-total');tr.append(el('span','','Total (estimate)'),el('span','',t.c?(money(t.c)+(t.u?' +':'')):'At the counter'));sheet.append(tr);
    var l1=el('label','','Name for pickup');l1.htmlFor='po-name';var name=el('input');name.id='po-name';name.maxLength=40;name.autocomplete='given-name';name.value=(get('pew-name')||'');
    var l2=el('label','','Phone (optional)');l2.htmlFor='po-phone';var ph=el('input');ph.id='po-phone';ph.type='tel';ph.maxLength=20;ph.autocomplete='tel';
    var l3=el('label','','Note for the store (optional)');l3.htmlFor='po-note';var nt=el('textarea');nt.id='po-note';nt.rows=2;nt.maxLength=200;
    sheet.append(l1,name,l2,ph,l3,nt);
    var err=el('div','po-err');sheet.append(err);
    var go=el('button','po-go','Place order · pay at pickup');go.type='button';sheet.append(go);
    var cl=el('button','po-link','Empty my order');cl.type='button';cl.onclick=function(){cart=[];saveCart();closeSheet()};sheet.append(cl);
    go.onclick=function(){
      err.textContent='';if(!name.value.trim()){err.textContent='Please add a name so we can find your order.';name.focus();return}
      go.disabled=true;go.textContent='Sending...';set('pew-name',name.value.trim());
      fetch(W+'/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.value,phone:ph.value,note:nt.value,items:cart.map(function(i){return{n:i.n,q:i.q,c:i.c}})})})
      .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
      .then(function(x){
        if(!x.ok)throw new Error(x.j.error||'Could not place the order.');
        active={id:x.j.id,t:x.j.token,num:x.j.num,status:'new',items:cart.map(function(i){return{n:i.n,q:i.q}})};set(LS_ORD,active);
        cart=[];set(LS_CART,cart);paint();viewOrder();
      }).catch(function(e){go.disabled=false;go.textContent='Place order · pay at pickup';err.textContent=(e&&e.message)||"Couldn't reach the store. Check your internet and try again."});
    };
  }
  function viewOrder(){
    sheet.textContent='';if(!active){closeSheet();return}
    head('Your order');
    sheet.append(el('div','po-big','#'+active.num));
    var st=STATUS[active.status]||STATUS.new;
    sheet.append(el('div','po-stat'+(active.status==='ready'?' ready':''),st[0]),el('p','',st[1]));
    if(active.items&&active.items.length){var ul=el('ul','po-list');active.items.forEach(function(i){ul.append(el('li','',i.q+' × '+i.n))});sheet.append(ul)}
    sheet.append(el('div','po-pilot','PILOT: no card was charged. Pay at the counter when you pick up.'));
    if(active.status==='done'||active.status==='cancelled'){var d=el('button','po-go','Done');d.type='button';d.onclick=function(){active=null;set(LS_ORD,null);paint();closeSheet()};sheet.append(d)}
    else{var c=el('button','po-link','Close');c.type='button';c.onclick=closeSheet;sheet.append(c)}
  }
  function poll(){
    if(!active||active.status==='done'||active.status==='cancelled'||document.hidden)return;
    fetch(W+'/orders/status?id='+encodeURIComponent(active.id)+'&t='+encodeURIComponent(active.t),{cache:'no-store'})
    .then(function(r){if(r.status===404){active=null;set(LS_ORD,null);paint();return null}return r.json()})
    .then(function(j){if(!j||!j.status)return;if(j.status!==active.status){active.status=j.status;set(LS_ORD,active);paint();if(!ov.hidden&&sheet.querySelector('.po-big'))viewOrder()}})
    .catch(function(){});
  }
  bar.onclick=function(){viewCart();openSheet()};
  chip.onclick=function(){viewOrder();openSheet()};

  // "Add to order" button inside the product details window
  function hook(){
    var dlg=document.getElementById('detail');if(!dlg)return;
    var copy=dlg.querySelector('.sheet-copy');if(!copy||copy.querySelector('.po-add'))return;
    var b=el('button','po-add','Add to order');b.type='button';
    b.addEventListener('click',function(e){
      e.stopPropagation();
      var n=(document.getElementById('detail-title')||{}).textContent||'';
      var p=((document.getElementById('detail-price')||{}).textContent||'').trim();
      var im=document.getElementById('detail-image');
      if(!n)return;addItem({n:n,p:p,img:im&&im.src&&im.src.indexOf('data:')!==0&&im.src.length<400?im.src:''});
      b.textContent='Added ✓ Add another';b.classList.add('added');setTimeout(function(){b.textContent='Add to order';b.classList.remove('added')},1800);
    });
    copy.appendChild(b);
  }
  function start(){document.body.append(dock,ov);hook();paint();poll();setInterval(poll,20000);document.addEventListener('visibilitychange',poll)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
