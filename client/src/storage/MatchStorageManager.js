// matchStorage.js

import { submitMatch } from "../requests/ApiRequests";
import QRCode from "qrcode";

export const generateKey = (
  { eventKey, matchCode, station },
  userToken,
  synced = false
) => {
  let key = `match_${eventKey}_${matchCode}_${station}_${userToken.id}`;
  if (synced) {
    key += "_synced";
  }
  return key;
};
export const saveMatch = (matchData, searchParams, userToken) => {
  console.log(matchData);
  const key = generateKey(searchParams, userToken, false);
  localStorage.setItem(key, JSON.stringify(matchData));
  // After saving, popup a QR code with the match data.
  showQRCodePopup(matchData);
};

export const loadMatch = (searchParams, userToken, synced = false) => {
  const key = generateKey(searchParams, userToken, synced);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const syncMatch = async (searchParams, userToken) => {
  const unsyncedKey = generateKey(searchParams, userToken, false);
  const dataString = localStorage.getItem(unsyncedKey);
  if (!dataString) {
    console.warn("No match data found for key", unsyncedKey);
    return;
  }
  const matchData = JSON.parse(dataString);

  try {
    const response = await submitMatch(matchData);
    if (response.status === 200) {
      // Rename key to include _synced
      const syncedKey = generateKey(searchParams, userToken, true);
      localStorage.removeItem(unsyncedKey);
      localStorage.setItem(syncedKey, dataString);
    } else {
      console.error("Sync failed with status", response.status);
    }
  } catch (err) {
    console.error("Error syncing match:", err);
  }
};

export const resyncAllMatches = async () => {
  const keysToSync = [];

  // Gather all keys that match our naming scheme.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("match_")) {
      keysToSync.push(key);
    }
  }

  for (const key of keysToSync) {
    try {
      const dataString = localStorage.getItem(key);
      if (!dataString) continue;
      const matchData = JSON.parse(dataString);

      // Extract searchParams and userToken.id from the key.
      // Expected formats:
      //   match_<eventKey>_<matchCode>_<station>_<userId>
      //   match_<eventKey>_<matchCode>_<station>_<userId>_synced
      const parts = key.split("_");
      if (parts.length < 5) {
        console.error("Invalid key format:", key);
        continue;
      }
      const [, eventKey, matchCode, station, userId] = parts;
      const searchParams = { eventKey, matchCode, station };
      const userToken = { id: userId };

      const response = await submitMatch(matchData);
      if (response.status === 200) {
        const syncedKey = generateKey(searchParams, userToken, true);
        if (key !== syncedKey) {
          localStorage.removeItem(key);
          localStorage.setItem(syncedKey, dataString);
        }
      } else {
        console.error(
          "Resync failed for key",
          key,
          "with status",
          response.status
        );
      }
    } catch (err) {
      console.error("Error resyncing key", key, err);
    }
  }
};

/**
 * Pops up a modal overlay that displays a QR code with the matchData.
 * This version uses the npm-installed `qrcode` package to generate a data URL.
 *
 * @param {Object} matchData - The match data to encode in the QR code.
 */
export const showQRCodePopup = (matchData) => {
  // Create overlay element
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  // Create container for QR code
  const container = document.createElement("div");
  container.style.backgroundColor = "white";
  container.style.padding = "20px";
  container.style.borderRadius = "8px";
  container.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";
  container.style.position = "relative";

  // Add close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  container.appendChild(closeButton);

  // Create an img element to hold the generated QR code.
  const qrImg = document.createElement("img");
  container.appendChild(qrImg);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Convert matchData to a JSON string
  const qrData = JSON.stringify(matchData);

  QRCode.toDataURL(
    qrData,
    {
      width: 1000, // Fixed width to better display a large QR code.
      margin: 2,
      errorCorrectionLevel: "L",
      version: 40,
    },
    (err, url) => {
      if (err) {
        console.error("Error generating QR code", err);
        return;
      }
      // Set the generated URL as the src for the image
      qrImg.src = url;
    }
  );
};
