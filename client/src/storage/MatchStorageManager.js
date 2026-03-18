// matchStorage.js

import QRCode from "qrcode";
import { submitMatch as submitMatchRequest } from "../requests/ApiRequests";

// Track submissions in progress by their unsynced key.
const submissionsInProgress = new Set();

// Generate a unique key for a match.
export const generateKey = (
  reportId,
  { eventKey, matchKey, station },
  userToken,
  synced = false
) =>
  `${reportId}_match_${eventKey}_${matchKey}_${station}_${userToken.id}${synced ? "_synced" : ""
  }`;

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

export const submitMatch = async (
  matchData,
  searchParams,
  userToken,
  postSubmitCallback = null
) => {
  console.log("submitting", matchData, searchParams, userToken);
  const unsyncedKey = generateKey(
    matchData.reportId,
    Object.fromEntries(searchParams),
    userToken,
    false
  );
  const syncedKey = generateKey(
    matchData.reportId,
    Object.fromEntries(searchParams),
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
    const { eventKey, matchKey, station } = Object.fromEntries(searchParams);
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
    if (postSubmitCallback) {
      postSubmitCallback(response);
    }
    if (response?.status === 200)
      return true;
    return false;
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

// ... existing imports and generateKey/loadMatch/submitMatch remain the same ...

export const saveMatch = (
  matchData,
  searchParams,
  userToken,
  submitAfter = true,
  postSubmitCallback = null,
  qrPayload = null // The binary string from Sidebar
) => {
  const syncedKey = generateKey(matchData.reportId, Object.fromEntries(searchParams), userToken, true);

  if (localStorage.getItem(syncedKey)) {
    console.info(`Match already synced (${syncedKey}). Saving locally skipped.`);
    return;
  }

  const unsyncedKey = generateKey(matchData.reportId, Object.fromEntries(searchParams), userToken, false);
  // Always save the full JSON to local storage as a backup
  localStorage.setItem(unsyncedKey, JSON.stringify(matchData));

  if (submitAfter) {
    submitMatch(matchData, searchParams, userToken, postSubmitCallback);
  } else {
    // Pass the tiny string if we have it, otherwise fallback to the object
    showQRCodePopup(qrPayload || matchData, searchParams);
  }
};

export const showQRCodePopup = (data, searchParams) => {
  let qrString = "";

  if (typeof data === "string") {
    // 1. SUCCESS: Use our new tiny BinaryDTO string
    qrString = data;
  } else {
    // 2. FALLBACK: If BinaryDTO failed, just use standard JSON
    // We'll skip the buggy compressData and just stringify it.
    console.warn("Binary payload missing, falling back to JSON");
    const { eventKey, matchKey, station } = Object.fromEntries(searchParams);
    qrString = JSON.stringify({ ...data, eventKey, matchKey, station });
  }

  // 2. Create the UI
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999";

  const container = document.createElement("div");
  container.style.cssText = "background-color:white;padding:30px;border-radius:16px;position:relative;display:flex;flex-direction:column;align-items:center;max-width:90vw;";

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.cssText = "position:absolute;top:10px;right:10px;padding:5px 10px;cursor:pointer;background:#ff4444;color:white;border:none;border-radius:4px;";
  closeButton.onclick = () => document.body.removeChild(overlay);
  container.appendChild(closeButton);

  const title = document.createElement("h2");
  title.innerText = "Scan Match Data";
  title.style.marginBottom = "15px";
  container.appendChild(title);

  const qrImg = document.createElement("img");
  qrImg.style.width = "400px";
  qrImg.style.height = "400px";
  qrImg.style.border = "1px solid #ccc";
  container.appendChild(qrImg);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // 3. Generate the actual QR
  QRCode.toDataURL(
    qrString,
    { width: 600, margin: 2, errorCorrectionLevel: "M" },
    (err, url) => {
      if (err) return console.error("Error generating QR code", err);
      qrImg.src = url;
    }
  );
};