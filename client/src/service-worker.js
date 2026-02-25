/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

clientsClaim();
self.skipWaiting();

// This will be replaced at build time
precacheAndRoute(self.__WB_MANIFEST);