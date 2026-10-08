(() => {
  const COLLAPSED_INDEX_SELECTOR =
    "#publisher-container .index-message-wrapper > span.index-message";
  const VIDEO_SELECTOR = "#movie_player > div.html5-video-container > video";
  const QUEUE_PANEL_SELECTOR = "ytd-playlist-panel-renderer";
  const QUEUE_ITEMS_SELECTOR = "#items";
  const CURRENT_QUEUE_INDEX_SELECTOR = "#index-container #index";
  const CURRENT_QUEUE_ICON = "▶";
  const TOTAL_CLASS = "yt-queue-total-time";
  const TOTAL_ATTRIBUTE = "data-yt-queue-total-time";
  const DURATION_SELECTORS = [
    "ytd-thumbnail-overlay-time-status-renderer #text",
    "ytd-thumbnail-overlay-time-status-renderer span",
    ".badge-shape-wiz__text",
  ];

  let pendingUpdate = 0;
  let currentVideo = null;

  function parseDuration(value) {
    const text = value.replace(/\s+/g, "").trim();

    if (!/^\d{1,3}(?::\d{1,2}){1,2}$/.test(text)) {
      return 0;
    }

    const parts = text.split(":").map(Number);

    if (parts.some((part) => Number.isNaN(part) || part < 0)) {
      return 0;
    }

    if (parts.slice(1).some((part) => part > 59)) {
      return 0;
    }

    return parts.reduce((total, part) => total * 60 + part, 0);
  }

  function formatDuration(totalSeconds) {
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function findQueuePanel() {
    return document.querySelector(QUEUE_PANEL_SELECTOR);
  }

  function getQueueRows(panel) {
    const items = panel?.querySelector(QUEUE_ITEMS_SELECTOR);

    return items ? [...items.children] : [];
  }

  function isCurrentQueueRow(row) {
    const index = row.querySelector(CURRENT_QUEUE_INDEX_SELECTOR);

    return (index?.textContent || "").trim() === CURRENT_QUEUE_ICON;
  }

  function readRowDuration(row) {
    for (const selector of DURATION_SELECTORS) {
      for (const element of row.querySelectorAll(selector)) {
        const seconds = parseDuration(element.textContent || "");

        if (seconds > 0) {
          return seconds;
        }
      }
    }

    return 0;
  }

  function getCurrentVideoSeconds() {
    const video = document.querySelector(VIDEO_SELECTOR);

    return video && Number.isFinite(video.currentTime) ? Math.floor(video.currentTime) : 0;
  }

  function getRemainingQueueSeconds(rows) {
    const currentRowIndex = rows.findIndex(isCurrentQueueRow);

    if (currentRowIndex < 0) {
      return null;
    }

    const currentRowDuration = readRowDuration(rows[currentRowIndex]);
    const followingRowsDuration = rows
      .slice(currentRowIndex + 1)
      .reduce((total, row) => total + readRowDuration(row), 0);

    return Math.max(currentRowDuration - getCurrentVideoSeconds(), 0) + followingRowsDuration;
  }

  function ensureTotalElement() {
    const index = document.querySelector(COLLAPSED_INDEX_SELECTOR);

    if (!index) {
      return null;
    }

    const container = index.parentElement || index;
    let total = container.querySelector(`[${TOTAL_ATTRIBUTE}]`);

    if (!total) {
      total = document.createElement("span");
      total.className = TOTAL_CLASS;
      total.setAttribute(TOTAL_ATTRIBUTE, "");
      index.insertAdjacentElement("afterend", total);
    }

    return total;
  }

  function renderRemainingTime(totalSeconds) {
    const total = ensureTotalElement();

    if (!total) {
      return;
    }

    const text = ` (${formatDuration(totalSeconds)})`;

    if (total.textContent !== text) {
      total.textContent = text;
    }
  }

  function updateQueueTotal() {
    pendingUpdate = 0;
    observeCurrentVideo();

    const rows = getQueueRows(findQueuePanel());
    const remainingSeconds = getRemainingQueueSeconds(rows);

    if (remainingSeconds !== null) {
      renderRemainingTime(remainingSeconds);
    }
  }

  function scheduleUpdate() {
    if (!pendingUpdate) {
      pendingUpdate = window.setTimeout(updateQueueTotal, 1000);
    }
  }

  function observeCurrentVideo() {
    const nextVideo = document.querySelector(VIDEO_SELECTOR);

    if (currentVideo === nextVideo) {
      return;
    }

    if (currentVideo) {
      currentVideo.removeEventListener("timeupdate", scheduleUpdate);
      currentVideo.removeEventListener("seeked", scheduleUpdate);
      currentVideo.removeEventListener("loadedmetadata", scheduleUpdate);
    }

    currentVideo = nextVideo;

    if (currentVideo) {
      currentVideo.addEventListener("timeupdate", scheduleUpdate);
      currentVideo.addEventListener("seeked", scheduleUpdate);
      currentVideo.addEventListener("loadedmetadata", scheduleUpdate);
    }
  }

  const observer = new MutationObserver(scheduleUpdate);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("yt-navigate-finish", scheduleUpdate);

  scheduleUpdate();
})();
