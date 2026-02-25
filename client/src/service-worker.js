/* eslint-disable no-restricted-globals */
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

clientsClaim();
self.skipWaiting(); // optional, SW activates immediately

// Precache CRA build files
precacheAndRoute(self.__WB_MANIFEST);

// Navigation fallback for SPA
const handler = createHandlerBoundToURL("/index.html");
registerRoute(({ request }) => request.mode === "navigate", handler);

// ---- Option 3: Network-first for JS/CSS bundles ----
registerRoute(
  ({ request, url }) =>
    request.destination === "script" || request.destination === "style",
  new NetworkFirst({
    cacheName: "static-resources",
    networkTimeoutSeconds: 5, // fallback to cache if network is slow
  })
);