/* Service worker — Absensi Siswa QR (versi sebenarnya).
   Menyimpan app shell di HP sehingga halaman bisa dibuka tanpa internet setelah
   sekali dimuat dengan internet. Hanya file aplikasi sendiri yang di-cache;
   lalu lintas Firestore (firestore.googleapis.com) TIDAK PERNAH di-cache dan
   selalu lewat jaringan, supaya data absensi tidak basi. */
var CACHE = "absensi-qr-real-v1";
var APP_SHELL = [
  "./",
  "./index.html",
  "./roster.js",
  "./jsQR.min.js",
  "./qrcode.min.js",
  "./firebase-app-compat.js",
  "./firebase-firestore-compat.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(APP_SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;
  var u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return; /* CDN/API: biarkan lewat jaringan */
  e.respondWith(
    caches.match(e.request).then(function(dariCache){
      var ambilJaringan = fetch(e.request).then(function(res){
        if (res && res.ok){
          var salinan = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, salinan); });
        }
        return res;
      }).catch(function(){
        return dariCache || caches.match("./index.html");
      });
      return dariCache || ambilJaringan;
    })
  );
});
