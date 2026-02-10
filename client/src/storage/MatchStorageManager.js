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
  `${reportId}_match_${eventKey}_${matchKey}_${station}_${userToken.id}${synced ? "_synced" : ""
  }`;

export const saveMatch = (
  matchData,
  searchParams,
  userToken,
  submitAfter = true,
  postSubmitCallback = null
) => {
  console.log(matchData);
  const syncedKey = generateKey(
    matchData.reportId,
    Object.fromEntries(searchParams),
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
    Object.fromEntries(searchParams),
    userToken,
    false
  );
  localStorage.setItem(unsyncedKey, JSON.stringify(matchData));
  submitAfter
    ? submitMatch(matchData, searchParams, userToken, postSubmitCallback)
    : showQRCodePopup(matchData, searchParams);
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
    console.log("abcde", eventKey, matchKey, station, matchData);
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

export const showQRCodePopup = (matchData, searchParams) => {
  const { eventKey, matchKey, station } = Object.fromEntries(searchParams);
  const jsonString = JSON.stringify({ eventKey, matchKey, station, matchData });
  const CHUNK_SIZE = 750; // Safe limit for dense QR codes
  const totalChunks = Math.ceil(jsonString.length / CHUNK_SIZE);
  const chunks = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunkData = jsonString.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    // Header format: "P<current>/<total>:<data>" -> e.g. "P1/3:{...}"
    // This allows the scanner app to detect multipart and reassemble.
    // Ensure index is 1-based for the header.
    const header = totalChunks > 1 ? `P${i + 1}/${totalChunks}:` : "";
    chunks.push(header + chunkData);
  }

  let currentIndex = 0;

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999";

  const container = document.createElement("div");
  container.style.cssText =
    "background-color:white;padding:20px;border-radius:12px;box-shadow:0 0 20px rgba(0,0,0,0.5);position:relative;display:flex;flex-direction:column;align-items:center;max-width:90vw;";

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.cssText = "position:absolute;top:10px;right:10px;padding:5px 10px;cursor:pointer;background:#ff4444;color:white;border:none;border-radius:4px;";
  closeButton.onclick = () => document.body.removeChild(overlay);
  container.appendChild(closeButton);

  const title = document.createElement("h2");
  title.innerText = totalChunks > 1 ? `Part ${currentIndex + 1} of ${totalChunks}` : "Scan QR Code";
  title.style.marginBottom = "10px";
  container.appendChild(title);

  const qrImg = document.createElement("img");
  qrImg.style.maxWidth = "80vh";
  qrImg.style.maxHeight = "60vh";
  qrImg.style.border = "1px solid #ccc";
  container.appendChild(qrImg);

  // Navigation container
  const navContainer = document.createElement("div");
  navContainer.style.marginTop = "15px";
  navContainer.style.display = totalChunks > 1 ? "flex" : "none";
  navContainer.style.gap = "20px";
  container.appendChild(navContainer);

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "Previous";
  prevBtn.style.padding = "10px 20px";
  prevBtn.style.fontSize = "18px";
  prevBtn.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateQR();
    }
  };
  navContainer.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.innerText = "Next";
  nextBtn.style.padding = "10px 20px";
  nextBtn.style.fontSize = "18px";
  nextBtn.onclick = () => {
    if (currentIndex < totalChunks - 1) {
      currentIndex++;
      updateQR();
    }
  };
  navContainer.appendChild(nextBtn);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const updateQR = () => {
    title.innerText = totalChunks > 1 ? `Part ${currentIndex + 1} of ${totalChunks}` : "Scan QR Code";

    // Update button states
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalChunks - 1;

    QRCode.toDataURL(
      chunks[currentIndex],
      { width: 800, margin: 2, errorCorrectionLevel: "L" },
      (err, url) => {
        if (err) return console.error("Error generating QR code", err);
        qrImg.src = url;
      }
    );
  };

  updateQR();
};
