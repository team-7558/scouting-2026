/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NavigationRoute } from "workbox-routing";

clientsClaim();
self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);

// 👇 Add this
const handler = async ({ request }) => {
  return caches.match('/index.html');
};

const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);