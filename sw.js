// Service worker de la app de la piscina.
// La app se guarda en el teléfono para abrir sin cobertura.
// Supabase y el tiempo siempre van por la red: nunca se sirven de la caché.
// Al actualizarse solo borra sus cachés (piscina-*): en la misma web hay otras apps con las suyas.
const CACHE='piscina-v2';
const APP=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('piscina-')&&k!==CACHE).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(/supabase\.co$|open-meteo\.com$/.test(u.hostname))return;          // datos: siempre red
  if(u.origin===location.origin){
    // la app: primero la red (para coger las versiones nuevas), y si no hay, la copia guardada
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(k=>k.put(e.request,c));return r;})
      .catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
    return;
  }
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    // tipografías: la copia guardada vale
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(CACHE).then(k=>k.put(e.request,c));return n;})));
  }
});
