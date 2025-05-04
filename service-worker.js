// Service Worker for Guberaan Builders Contact Form PWA
const CACHE_NAME = 'guberaan-form-cache-v1';
const OFFLINE_URL = 'offline.html';
const DB_NAME = 'guberaan-contact-form';
const STORE_NAME = 'pending-submissions';

// Files to cache for offline use
const filesToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

// Install event - cache all required files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(filesToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Fetch failed; returning offline page instead.', error);
            
            // If the request is for a page, return the offline page
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other resources, just fail gracefully
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-form-data') {
    event.waitUntil(syncFormData());
  }
});

// Function to sync form data in the background
async function syncFormData() {
  try {
    const db = await openDB();
    const submissions = await getPendingSubmissions(db);

    console.log(`Service worker syncing ${submissions.length} submissions`);

    if (submissions.length === 0) {
      return;
    }

    // API URL should match the one in app.js
    const API_URL = 'https://script.google.com/macros/s/AKfycbyjG9bXCMVncKd3FelMP1__USQf5o4DXkAPvir_TEy5GiJarUcwDUQXOTeW7YzTuJ72kQ/exec';

    // Process each pending submission
    for (const submission of submissions) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission.data)
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'success') {
            // Remove from local storage after successful submission
            await deleteSubmission(db, submission.id);
            console.log(`Synced and deleted submission ${submission.id}`);
          } else {
            console.error(`Failed to sync submission ${submission.id}: ${result.message}`);
          }
        } else {
          console.error(`Failed to sync submission ${submission.id}: Network response was not ok`);
        }
      } catch (error) {
        console.error(`Error syncing submission ${submission.id}:`, error);
      }
    }

  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Open IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = event => {
      reject('Database error: ' + event.target.error);
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
  });
}

// Get all pending submissions from IndexedDB
function getPendingSubmissions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete a submission from IndexedDB
function deleteSubmission(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}