// Gym Progress v13
// Offline service worker intentionally disabled to prevent stale iOS/GitHub Pages cache.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>{
  event.waitUntil(self.registration.unregister());
});
