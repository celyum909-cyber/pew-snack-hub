/* Depew Snack Hub - applies price / name / photo changes made in the Snack Hub Manager app.
   Loaded by index.html with one script tag. If anything goes wrong the original products stay as they are. */
(function(){
  var API='https://pew-deal.celyum909.workers.dev';
  function apply(){
    var c=window.__PEW_CONTENT__;
    if(!c||!c.carousels||typeof createCarousel!=='function'||typeof createChipDial!=='function')return;
    fetch(API+'/products',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(d){
      var edits=d&&d.edits;if(!edits||!Object.keys(edits).length)return;
      c.carousels.forEach(function(car){
        car.products=car.products.filter(function(p){return !(edits[p.id]&&edits[p.id].hidden)});
        car.products.forEach(function(p){
          var e=edits[p.id];if(!e)return;
          if(e.name)p.name=e.name;
          if(e.subtitle)p.subtitle=e.subtitle;
          if(e.price)p.price=e.price;
          if(e.description)p.description=e.description;
          if(e.img){p.image=API+'/products/image/'+p.id+'?v='+e.img;p.dialImage=undefined;}
        });
      });
      var host=document.querySelector('#carousels'),track=document.querySelector('#chip-dial-track');
      if(!host||!track)return;
      host.innerHTML='';
      var fresh=track.cloneNode(false);track.replaceWith(fresh); // drops the old scroll listeners
      var chips=c.carousels.find(function(x){return x.title==='Chips'});
      if(chips)createChipDial(chips.products.filter(function(p){return p.image}));
      c.carousels.forEach(function(col){host.append(createCarousel(col))});
    }).catch(function(){});
  }
  if(document.readyState==='complete')apply();else window.addEventListener('load',apply);
})();

/* Adds extra hero videos to the logo-tap switcher, in this order:
   1) videos listed in videos/videos.json (files uploaded to GitHub)
   2) videos added from the Manager app (stored on the Cloudflare Worker) */
(function(){
  var W='https://pew-deal.celyum909.workers.dev';
  function getJ(u){return fetch(u,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null})}
  function go(){
    if(typeof heroVideos==='undefined'||!Array.isArray(heroVideos))return;
    Promise.all([getJ('videos/videos.json?v='+Date.now()),getJ(W+'/videos')]).then(function(r){
      var a=r[0],b=r[1];
      if(a&&Array.isArray(a.videos))a.videos.forEach(function(v){
        if(!v||!v.file)return;
        heroVideos.push({src:'videos/'+v.file,poster:v.poster?'videos/'+v.poster:'',name:v.name||v.file,hasAudio:!!v.audio});
      });
      if(b&&Array.isArray(b.list))b.list.forEach(function(v){
        if(!v||!v.id)return;
        heroVideos.push({src:W+'/videos/file/'+v.id+'?v='+v.updated,poster:v.hasPoster?W+'/videos/poster/'+v.id+'?v='+v.updated:'',name:v.name||'Video',hasAudio:!!v.audio});
      });
      var lb=document.querySelector('.floating-logo');
      if(lb&&heroVideos.length>1)lb.setAttribute('aria-label','Switch to '+heroVideos[1].name+' video');
    });
  }
  if(document.readyState==='complete')go();else window.addEventListener('load',go);
})();
