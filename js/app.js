/**
 * app.js — Main Application Controller
 * Orchestrates all modules, handles tab navigation, theme, and init
 */

class App {
  constructor() {
    this.theme = localStorage.getItem('mkc_theme') || 'light';
    this.currentLocation = null;
    this.initialized = false;
    this.toastQueue = [];
  }

  async init() {
    // Apply saved theme
    this.applyTheme(this.theme);

    // Show loader
    this.showLoader();

    // Parse QR location from URL
    this.currentLocation = window.QRRouter.parseLocation();

    // Update location banner
    this.updateLocationBanner(this.currentLocation);

    // Connect backend
    await window.SupabaseService.connect();

    // Init analytics
    await window.Analytics.init();

    // Apply i18n
    window.I18n.applyTranslations();

    // Bind navigation (theme/lang)
    this.bindThemeToggle();
    this.bindLanguageToggle();

    // Init search
    this.bindMapSearch();

    // Init map directly
    await window.CampusMap.init(this.currentLocation);

    // Hide loader and show app
    await this.hideLoader();

    // Init Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.initialized = true;
  }

  showLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.style.display = 'flex';
  }

  async hideLoader() {
    await new Promise(r => setTimeout(r, 1200));
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('out');
      await new Promise(r => setTimeout(r, 400));
      loader.remove();
    }
  }

  updateLocationBanner(location) {
    const nameEl = document.getElementById('current-location-name');
    const subEl = document.getElementById('current-location-sub');
    if (nameEl) nameEl.textContent = location.name;
    if (subEl) subEl.textContent = location.description;

    // Also update page title
    document.title = `${location.name} — Markaz Knowledge City`;
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mkc_theme', theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  bindThemeToggle() {
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
    });
  }

  bindLanguageToggle() {
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        window.I18n.setLanguage(lang);
        document.querySelectorAll('[data-lang]').forEach(b => {
          b.classList.toggle('active', b.dataset.lang === lang);
        });
      });
    });
  }

  bindMapSearch() {
    const input = document.getElementById('map-search');
    if (!input) return;

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        window.CampusMap.search(input.value.trim());
      }, 200);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim()) window.CampusMap.search(input.value.trim());
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.map-search-bar')) {
        const dropdown = document.getElementById('map-search-results');
        if (dropdown) dropdown.style.display = 'none';
      }
    });
  }

  // ---- Toast Notification System ----
  showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease both';
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  }
}

// Expose globally
window.App = new App();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.App.init().catch(console.error);
});
