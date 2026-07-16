/**
 * posters.js — Poster Download Center
 */

class PosterCenter {
  constructor() {
    this.posters = [];
    this.currentCategory = 'all';
    this.activeSharePosterId = null;
    this.settings = null;
  }

  async init() {
    this.settings = await window.SupabaseService.getSettings();
    await this.loadPosters();
    this.renderFilters();
    this.renderPosters();
    this.bindShareSheet();
  }

  async loadPosters() {
    this.posters = await window.SupabaseService.getPosters();
  }

  renderFilters() {
    const container = document.getElementById('poster-filters');
    if (!container) return;

    const categories = ['all', 'general', 'events', 'academic'];
    const labels = { all: '🗂️ All', general: '📋 General', events: '🎉 Events', academic: '📚 Academic' };

    container.innerHTML = categories.map(cat => `
      <button class="chip ${cat === this.currentCategory ? 'active' : ''}"
        data-cat="${cat}" onclick="window.PosterCenter.filterBy('${cat}')">
        ${labels[cat]}
      </button>
    `).join('');
  }

  filterBy(category) {
    this.currentCategory = category;
    document.querySelectorAll('#poster-filters .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.cat === category);
    });
    this.renderPosters();
  }

  renderPosters() {
    const container = document.getElementById('poster-grid');
    if (!container) return;

    const filtered = this.currentCategory === 'all'
      ? this.posters
      : this.posters.filter(p => p.category === this.currentCategory);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 40px; margin-bottom: 12px;">🖼️</div>
          <div style="font-size: 14px; font-weight: 600;">No posters yet</div>
          <div style="font-size: 12px; margin-top: 4px;">
            Upload posters via the Admin Dashboard
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((poster, i) => `
      <div class="poster-card anim-fade-up anim-delay-${Math.min(i * 100, 400)}" id="poster-${poster.id}">
        ${poster.url
          ? `<img class="poster-thumb" src="${poster.url}" alt="${poster.title}" loading="lazy" />`
          : `<div class="poster-thumb-placeholder">
              <div class="icon">🖼️</div>
              <div>${poster.title}</div>
            </div>`
        }
        <div class="poster-info">
          <div class="poster-title">${poster.title}</div>
          <div class="poster-actions">
            <button class="btn btn-primary btn-sm" style="flex:1;"
              onclick="window.PosterCenter.downloadPoster(${poster.id})">
              ⬇️ Download
            </button>
            <button class="btn btn-ghost btn-sm"
              onclick="window.PosterCenter.openShareSheet(${poster.id})">
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  async downloadPoster(posterId) {
    const poster = this.posters.find(p => p.id === posterId);
    if (!poster) return;

    window.App.showToast('⬇️ Downloading poster...', 'info', 2000);
    window.Analytics.logDownload(posterId, poster.title);

    if (poster.url) {
      try {
        const response = await fetch(poster.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `markaz-${poster.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
        window.App.showToast('✅ Poster saved to your device!', 'success');
      } catch(e) {
        // Fallback: open in new tab
        window.open(poster.url, '_blank');
        window.App.showToast('✅ Poster opened for download!', 'success');
      }
    } else {
      window.App.showToast('ℹ️ No poster image uploaded yet. Please check back soon.', 'info', 3000);
    }
  }

  openShareSheet(posterId) {
    this.activeSharePosterId = posterId;
    const sheet = document.getElementById('share-sheet');
    if (sheet) {
      sheet.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeShareSheet() {
    const sheet = document.getElementById('share-sheet');
    if (sheet) {
      sheet.classList.remove('open');
      document.body.style.overflow = '';
      this.activeSharePosterId = null;
    }
  }

  bindShareSheet() {
    const sheet = document.getElementById('share-sheet');
    const backdrop = document.getElementById('share-backdrop');
    if (!sheet) return;

    backdrop?.addEventListener('click', () => this.closeShareSheet());

    document.querySelectorAll('[data-share-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.shareAction;
        this.handleShare(action);
      });
    });
  }

  async handleShare(action) {
    const poster = this.posters.find(p => p.id === this.activeSharePosterId);
    const posterUrl = poster?.url || window.location.href;
    const text = `Check out this poster from Markaz Knowledge City, Calicut! ${posterUrl}`;

    window.Analytics.logShare(action, this.activeSharePosterId);

    switch(action) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, guide user
        if (poster?.url) {
          await this.downloadPoster(this.activeSharePosterId);
          window.App.showToast('📸 Poster downloaded! Open Instagram Stories and select it from your gallery.', 'info', 5000);
        }
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(posterUrl)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(posterUrl || window.location.href);
          window.App.showToast('🔗 Link copied to clipboard!', 'success');
        } catch(e) {
          window.App.showToast('Could not copy link', 'warning');
        }
        break;
      case 'native':
        if (navigator.share) {
          await navigator.share({
            title: 'Markaz Knowledge City',
            text: 'Visit Markaz Knowledge City, Calicut — Kerala\'s premier Islamic knowledge hub.',
            url: posterUrl || window.location.href,
          });
        }
        break;
    }

    this.closeShareSheet();
  }
}

window.PosterCenter = new PosterCenter();
