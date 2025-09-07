// Nama cache untuk menyimpan aset aplikasi
const CACHE_NAME = 'iso-app-cache-v4'; // Versi cache dinaikkan untuk memicu update
// Daftar URL yang akan di-cache saat service worker diinstal
const urlsToCache = [
  '/',
  '/index.html',
  'manifest.json',
  'logo.png',
  'logo-192.png',
  'logo-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Event 'install': Dipanggil saat service worker pertama kali diinstal
self.addEventListener('install', event => {
  // Menunggu hingga proses caching selesai
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Menambahkan semua URL dari 'urlsToCache' ke dalam cache
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Memaksa service worker baru untuk aktif
  );
});

// Event 'activate': Dipanggil setelah service worker diinstal dan siap mengambil alih kontrol
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Menghapus cache lama jika ada
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Mengambil kontrol dari tab yang terbuka
  );
});

// Event 'fetch': Dipanggil setiap kali aplikasi membuat permintaan jaringan
// Strategi: Coba jaringan dulu, jika gagal baru ambil dari cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return fetch(event.request)
        .then(networkResponse => {
          // Jika permintaan jaringan berhasil, perbarui cache
          // Memperbolehkan menyimpan respons 'opaque' (untuk skrip dari domain lain seperti Firebase)
          if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika permintaan jaringan gagal (misal, offline), coba ambil dari cache
          return cache.match(event.request);
        });
    })
  );
});

