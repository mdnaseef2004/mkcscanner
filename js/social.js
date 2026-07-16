/**
 * social.js — Social Media Hub
 */

class SocialHub {
  constructor() {
    this.settings = null;
  }

  async init() {
    this.settings = await window.SupabaseService.getSettings();
    this.render();
  }

  render() {
    const container = document.getElementById('social-links-container');
    if (!container || !this.settings) return;

    const s = this.settings;

    const links = [
      {
        id: 'instagram',
        name: 'Instagram',
        handle: '@markazkc',
        icon: '📸',
        bg: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
        url: s.instagramUrl,
      },
      {
        id: 'facebook',
        name: 'Facebook',
        handle: 'Markaz Knowledge City',
        icon: '👥',
        bg: '#1877f2',
        url: s.facebookUrl,
      },
      {
        id: 'youtube',
        name: 'YouTube',
        handle: '@markazkc',
        icon: '▶️',
        bg: '#ff0000',
        url: s.youtubeUrl,
      },
      {
        id: 'website',
        name: 'Official Website',
        handle: 'markaz.edu.in',
        icon: '🌐',
        bg: 'var(--gradient-brand)',
        url: s.websiteUrl,
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        handle: 'Contact Us',
        icon: '💬',
        bg: '#25d366',
        url: `https://wa.me/${s.whatsappNumber?.replace(/\D/g, '')}`,
      },
      {
        id: 'phone',
        name: 'Phone',
        handle: s.whatsappNumber || '+91-483-271-0000',
        icon: '📞',
        bg: 'var(--gradient-brand)',
        url: `tel:${s.whatsappNumber}`,
      },
    ];

    container.innerHTML = links.map((link, i) => `
      <a href="${link.url}" target="_blank" rel="noopener"
        class="social-card anim-fade-up anim-delay-${Math.min(i * 100, 400)}"
        id="social-${link.id}"
        onclick="window.Analytics.logShare('social_${link.id}')">
        <div class="social-icon-wrap" style="background: ${link.bg};">
          <span style="font-size:22px;">${link.icon}</span>
        </div>
        <div class="social-info">
          <div class="social-name">${link.name}</div>
          <div class="social-handle">${link.handle}</div>
        </div>
        <span class="social-arrow">›</span>
      </a>
    `).join('');
  }
}

window.SocialHub = new SocialHub();
