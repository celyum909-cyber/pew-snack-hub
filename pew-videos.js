/* Depew Snack Hub - adds the videos uploaded in the Snack Hub Manager to the logo video rotation,
   and hides built-in videos the manager turned off. If anything goes wrong the built-in videos keep working. */
(function(){
  var API='https://pew-deal.celyum909.workers.dev';
  function apply(){
    if(typeof heroVideos==='undefined'||!Array.isArray(heroVideos))return;
    fetch(API+'/videos',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(d){
      if(!d)return;
      (d.hiddenBuiltin||[]).forEach(function(name){
        var i=heroVideos.findIndex(function(v){return v.name===name});
        if(i>0)heroVideos.splice(i,1); // the first video can't be removed
      });
      (d.items||[]).forEach(function(v){
        heroVideos.push({src:API+'/videos/file/'+v.id,poster:API+'/videos/poster/'+v.id,name:v.name,hasAudio:!!v.audio});
      });
    }).catch(function(){});
  }
  if(document.readyState==='complete')apply();else window.addEventListener('load',apply);
})();
