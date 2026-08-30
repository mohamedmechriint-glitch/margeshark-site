// sw.js - Service worker minimal pour MargeShark PWA.
// Rôle volontairement limité : mettre en cache la coquille de l'app (HTML/
// CSS/JS statiques) pour un chargement instantané et l'installabilité PWA.
// Les appels réseau vers l'API (analyse, licence) ne sont JAMAIS mis en
// cache - toujours en direct, jamais de données périmées sur une analyse.

const CACHE_NAME = "margeshark-pwa-v1";
const APP_SHELL = ["/app.html", "/manifest.json", "/icon-pwa-192.png", "/icon-pwa-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jamais de cache pour les appels API (analyse, auth, etc.) - toujours
  // en direct vers le serveur.
  if (url.pathname.startsWith("/api/") || url.hostname.includes("railway.app")) {
    return; // Laisse la requête suivre son cours normal, sans intervention.
  }

  // Pour le reste (coquille de l'app) : cache d'abord, réseau en secours.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
