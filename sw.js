// Nama cache untuk menyimpan aset aplikasi
const CACHE_NAME = 'iso-app-cache-v2'; // Versi cache diperbarui
// Daftar URL yang akan di-cache saat service worker diinstal
const urlsToCache = [
  '/',
  '/index.html',
  'logo.png', // Logo baru
  'logo-192.png', // Ikon baru
  'logo-512.png', // Ikon baru
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
    })
  );
});

// Event 'fetch': Dipanggil setiap kali aplikasi membuat permintaan jaringan (mis. gambar, skrip, dll.)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika permintaan ditemukan di cache, kembalikan dari cache
        if (response) {
          return response;
        }

        // Jika tidak, buat permintaan ke jaringan
        return fetch(event.request).then(
          networkResponse => {
            // Periksa apakah respons valid sebelum di-cache
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse;
            }

            // Duplikat respons karena stream hanya bisa dibaca sekali
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Simpan respons ke dalam cache untuk penggunaan di masa depan
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetching failed:', error);
          // Mungkin ingin memberikan fallback di sini jika diperlukan
        });
      })
  );
});

