# YouTube Queue Total Time

Chrome extension that adds the remaining duration of the current YouTube queue next to the queue index.

It targets the collapsed/compact queue index:

- Collapsed miniplayer queue index: `#publisher-container .index-message-wrapper > span.index-message`

## Install locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select this folder: `./youtube-queue-total-time`.
5. Open YouTube, add videos to the queue, and expand or collapse the queue panel.

The collapsed view displays `1 / 4 (m:ss)` or `1 / 4 (h:mm:ss)`.
The injected duration is rendered in an owned sibling span marked with
`data-yt-queue-total-time`, instead of rewriting YouTube's index text.

The displayed time is remaining queue time: the current queue item's duration
minus `video.currentTime`, plus every following queue item's full duration.
The current queue item is detected from the `#items` child whose
`#index-container #index` element contains the `▶` icon.
