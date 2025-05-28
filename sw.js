const CACHE_NAME = "lifetuner-v1.0.0";
const DATA_CACHE_NAME = "lifetuner-data-v1.0.0";

const urlsToCache = [
  "/",
  "/index.html",
  "/app.js",
  "/modules/data-manager.js",
  "/modules/analytics.js",
  "/modules/ui-components.js",
  "/modules/goal-tracker.js",
  "/modules/ai-assistant.js",
  "/modules/theme-manager.js",
  "/modules/onboarding.js",
  "/modules/event-handler.js",
  "/modules/form-manager.js",
  "/modules/pwa-manager.js",
  "/manifest.json",
];

const externalResources = [
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js",
];

self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log("[SW] Caching app shell");
        return cache.addAll(urlsToCache);
      }),
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log("[SW] Caching external resources");
        return cache.addAll(
          externalResources.map((url) => new Request(url, { mode: "cors" }))
        );
      }),
    ])
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else if (
    externalResources.some((resource) => request.url.includes(resource))
  ) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache first failed:", error);
    return (await caches.match("/offline.html")) || new Response("Offline");
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DATA_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log("[SW] Network first fallback to cache");
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || (await fetchPromise);
}

self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "lifetuner-data-sync") {
    event.waitUntil(syncLifeTunerData());
  } else if (event.tag === "daily-reminder") {
    event.waitUntil(sendDailyReminder());
  }
});

async function syncLifeTunerData() {
  try {
    const syncData = await getSyncData();

    if (syncData.length > 0) {
      console.log("[SW] Syncing", syncData.length, "items");

      for (const item of syncData) {
        try {
          await processSyncItem(item);
          await removeSyncItem(item.id);
        } catch (error) {
          console.error("[SW] Sync item failed:", error);
          await updateSyncItemRetryCount(item.id);
        }
      }

      await notifyClients({ type: "SYNC_COMPLETE" });
    }
  } catch (error) {
    console.error("[SW] Background sync failed:", error);
  }
}

async function sendDailyReminder() {
  const lastEntry = await getLastDataEntry();
  const today = new Date().toDateString();

  if (!lastEntry || new Date(lastEntry.date).toDateString() !== today) {
    await self.registration.showNotification("LifeTuner Podsetnik", {
      body: "Ne zaboravite da unesete podatke za danas!",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: "daily-reminder",
      renotify: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: "open-app",
          title: "Otvori aplikaciju",
        },
        {
          action: "remind-later",
          title: "Podsetiti kasnije",
        },
      ],
    });
  }
}

self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  let notificationData = {
    title: "LifeTuner",
    body: "Vreme je za dnevni unos!",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Date.now().toString(),
    },
    actions: [
      {
        action: "open-app",
        title: "Otvori LifeTuner",
        icon: "/icon-96x96.png",
      },
      {
        action: "dismiss",
        title: "Odbaci",
        icon: "/icon-96x96.png",
      },
    ],
    tag: "lifetuner-notification",
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event.action);
  event.notification.close();

  if (event.action === "open-app") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  } else if (event.action === "remind-later") {
    setTimeout(() => {
      self.registration.showNotification("LifeTuner Podsetnik", {
        body: "Ponovo vas podsetamo da unesete podatke!",
        icon: "/icon-192x192.png",
        tag: "reminder-later",
      });
    }, 60 * 60 * 1000);
  }
});

self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "SKIP_WAITING":
        self.skipWaiting();
        break;
      case "GET_VERSION":
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case "FORCE_UPDATE":
        forceUpdate();
        break;
      case "SYNC_DATA":
        syncLifeTunerData();
        break;
    }
  }
});

async function getSyncData() {
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data || []);
      };
      clients[0].postMessage({ type: "GET_SYNC_DATA" }, [channel.port2]);
    });
  }
  return [];
}

async function getLastDataEntry() {
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      clients[0].postMessage({ type: "GET_LAST_ENTRY" }, [channel.port2]);
    });
  }
  return null;
}

async function processSyncItem(item) {
  console.log("[SW] Processing sync item:", item);
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

async function removeSyncItem(id) {
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    clients[0].postMessage({ type: "REMOVE_SYNC_ITEM", id });
  }
}

async function updateSyncItemRetryCount(id) {
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    clients[0].postMessage({ type: "UPDATE_RETRY_COUNT", id });
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

async function forceUpdate() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

  await notifyClients({ type: "FORCE_RELOAD" });
}

if ("periodicSync" in self.registration) {
  self.addEventListener("periodicsync", (event) => {
    if (event.tag === "daily-check") {
      event.waitUntil(sendDailyReminder());
    }
  });
}

console.log("[SW] Service Worker loaded");
