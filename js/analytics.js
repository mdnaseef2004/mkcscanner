/**
 * analytics.js — QR Scan & User Action Analytics
 */

class Analytics {
  constructor() {
    this.queue = [];
    this.ready = false;
  }

  async init() {
    this.ready = true;
    // Flush queued events
    for (const event of this.queue) {
      await this.processEvent(event);
    }
    this.queue = [];
  }

  async processEvent({ type, data }) {
    if (!window.SupabaseService) return;
    try {
      if (type === 'scan') {
        await window.SupabaseService.logScanEvent(data.location.id, data.location.name);
      } else if (type === 'download') {
        await window.SupabaseService.logDownloadEvent(data.posterId, data.title);
      } else if (type === 'share') {
        await window.SupabaseService.logShareEvent(data.shareType, data.posterId);
      }
    } catch(e) {
      console.warn('Analytics event failed:', e);
    }
  }

  logScan(location, rawSlug) {
    const event = { type: 'scan', data: { location, rawSlug } };
    if (this.ready) this.processEvent(event);
    else this.queue.push(event);
  }

  logDownload(posterId, title) {
    const event = { type: 'download', data: { posterId, title } };
    if (this.ready) this.processEvent(event);
    else this.queue.push(event);
  }

  logShare(shareType, posterId = null) {
    const event = { type: 'share', data: { shareType, posterId } };
    if (this.ready) this.processEvent(event);
    else this.queue.push(event);
  }
}

window.Analytics = new Analytics();
