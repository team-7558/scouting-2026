// matchStorage.js

import { submitMatch as submitMatchRequest } from "../requests/ApiRequests";
import QRCode from "qrcode";

// Track submissions in progress by their unsynced key.
const submissionsInProgress = new Set();

// Generate a unique key for a match.
export const generateKey = (
  reportId,
  { eventKey, matchKey, station },
  userToken,
  synced = false
) =>
  `${reportId}_match_${eventKey}_${matchKey}_${station}_${userToken.id}${
    synced ? "_synced" : ""
  }`;

export const saveMatch = (
  matchData,
  searchParams,
  userToken,
  submitAfter = true
) => {
  const syncedKey = generateKey(
    matchData.reportId,
    searchParams,
    userToken,
    true
  );
  if (localStorage.getItem(syncedKey)) {
    console.info(
      `Match already synced (${syncedKey}). Saving locally skipped.`
    );
    return;
  }
  const unsyncedKey = generateKey(
    matchData.reportId,
    searchParams,
    userToken,
    false
  );
  localStorage.setItem(unsyncedKey, JSON.stringify(matchData));
  submitAfter
    ? submitMatch(matchData, searchParams, userToken)
    : showQRCodePopup(matchData);
};

export const loadMatch = (
  reportId,
  searchParams,
  userToken,
  synced = false
) => {
  const key = generateKey(reportId, searchParams, userToken, synced);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const submitMatch = async (matchData, searchParams, userToken) => {
  const unsyncedKey = generateKey(
    matchData.reportId,
    searchParams,
    userToken,
    false
  );
  const syncedKey = generateKey(
    matchData.reportId,
    searchParams,
    userToken,
    true
  );

  if (localStorage.getItem(syncedKey)) {
    console.info(`Match already synced (${syncedKey}). Submission skipped.`);
    return;
  }
  if (submissionsInProgress.has(unsyncedKey)) {
    console.warn(`Submission for ${unsyncedKey} is already in progress.`);
    return;
  }
  submissionsInProgress.add(unsyncedKey);

  try {
    const { eventKey, matchKey, station } = searchParams;
    const response = await submitMatchRequest({
      eventKey,
      matchKey,
      station,
      matchData,
    });
    if (response?.status === 200) {
      localStorage.removeItem(unsyncedKey);
      localStorage.setItem(syncedKey, JSON.stringify(matchData));
    }
    return response;
  } catch (err) {
    console.error("Error submitting match:", err);
    throw err;
  } finally {
    submissionsInProgress.delete(unsyncedKey);
  }
};

export const resyncAllMatches = async () => {
  const keysToSync = Object.keys(localStorage).filter((key) =>
    key.includes("match_")
  );
  for (const key of keysToSync) {
    try {
      const dataString = localStorage.getItem(key);
      if (!dataString) continue;
      const matchData = JSON.parse(dataString);
      const parts = key.split("_");
      if (parts.length < 5) {
        console.error("Invalid key format:", key);
        continue;
      }
      // Extract reportId, eventKey, matchKey, station, and userId.
      const [reportId, , eventKey, matchKey, station, rawUserId] = parts;
      const userId = rawUserId.replace("_synced", "");
      const searchParams = { eventKey, matchKey, station };
      const userToken = { id: userId };

      const response = await submitMatch(matchData, searchParams, userToken);
      if (response?.status === 200) {
        const syncedKey = generateKey(
          matchData.reportId,
          searchParams,
          userToken,
          true
        );
        if (key !== syncedKey) {
          localStorage.removeItem(key);
          localStorage.setItem(syncedKey, dataString);
        }
      } else {
        console.error(
          `Resync failed for ${key} with status ${response?.status}`
        );
      }
    } catch (err) {
      console.error("Error resyncing key", key, err);
    }
  }
};

export const showQRCodePopup = (matchData) => {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000";

  const container = document.createElement("div");
  container.style.cssText =
    "background-color:white;padding:20px;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.3);position:relative";

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.cssText = "position:absolute;top:10px;right:10px";
  closeButton.onclick = () => document.body.removeChild(overlay);
  container.appendChild(closeButton);

  const qrImg = document.createElement("img");
  container.appendChild(qrImg);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  QRCode.toDataURL(
    JSON.stringify(matchData),
    { width: 1000, margin: 2, errorCorrectionLevel: "L", version: 40 },
    (err, url) => {
      if (err) return console.error("Error generating QR code", err);
      qrImg.src = url;
    }
  );
};
