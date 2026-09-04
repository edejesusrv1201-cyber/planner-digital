var CACHE_NAME = "planner-digital-v3";
var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(APP_SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys()
      .then(function(names){
        return Promise.all(
          names.filter(function(n){ return n !== CACHE_NAME; })
               .map(function(n){ return caches.delete(n); })
        );
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;

  var url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return; // deja pasar recursos externos (ej. Google Fonts)

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request)
        .then(function(response){
          if(response && response.status === 200){
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
          }
          return response;
        })
        .catch(function(){
          if(event.request.mode === "navigate"){
            return caches.match("./index.html");
          }
        });
    })
  );
});

self.addEventListener("notificationclick", function(event){
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList){
      for(var i = 0; i < clientList.length; i++){
        if("focus" in clientList[i]) return clientList[i].focus();
      }
      if(clients.openWindow) return clients.openWindow("./");
    })
  );
});
