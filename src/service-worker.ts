import resources from "resources:";

declare var self: ServiceWorkerGlobalScope;

const version = "0.0.1";
const assetCacheName = `cache-${version}`;

self.addEventListener("activate", (event) => {
  console.log("activate: ");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== assetCacheName)
      );
    })
  );
});

self.addEventListener("install", (event) => {
  console.log("install: ");
  const urlsToCache = resources
    .concat(["", "global.css"])
    .map((resource) => `/${resource}`);

  event.waitUntil(
    caches.open(assetCacheName).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event: FetchEvent): Promise<Response> {
  const cache = await caches.open(assetCacheName);

  if (!event.request.url.includes("github")) {
    const response = await cache.match(event.request);

    if (response) {
      return response;
    }
    return fetch(event.request);
  }
  console.log("github fetch");

  const response = await cache.match(event.request);

  if (response) {
    return response;
  }

  return fetch(event.request).then(async (response) => {
    // Check if we received a valid response
    console.log("response: ", response);

    console.log("caching response: ");
    const responseToCache = response.clone();

    const cache = await caches.open(assetCacheName);
    await cache.put(event.request, responseToCache);

    return response;
  });
}
