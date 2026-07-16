/**
 * reviews.js — Google Reviews Integration
 */

class ReviewsModule {
  constructor() {
    this.selectedRating = 0;
    this.settings = null;
    this.submitted = false;
  }

  async init() {
    this.settings = await window.SupabaseService.getSettings();
    this.renderRatingDisplay();
    this.bindStars();
    this.bindSubmit();
  }

  renderRatingDisplay() {
    const container = document.getElementById('rating-display');
    if (!container || !this.settings) return;

    const avg = this.settings.averageRating || 4.8;
    const count = this.settings.totalReviews || 0;
    const stars = '★'.repeat(Math.floor(avg)) + (avg % 1 >= 0.5 ? '½' : '☆'.repeat(5 - Math.ceil(avg)));

    container.innerHTML = `
      <div style="text-align:center; padding: 8px 0;">
        <div style="font-size: 52px; font-weight: 800; color: var(--text-primary); line-height:1;">${avg}</div>
        <div style="font-size: 28px; color: var(--brand-gold-400); letter-spacing: 4px; margin: 6px 0;">
          ${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}
        </div>
        <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">
          Based on ${count.toLocaleString()} Google Reviews
        </div>
      </div>
    `;
  }

  bindStars() {
    document.querySelectorAll('.star-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => this.selectRating(i + 1));
      btn.addEventListener('mouseenter', () => this.previewRating(i + 1));
      btn.addEventListener('mouseleave', () => this.previewRating(this.selectedRating));
    });
  }

  previewRating(rating) {
    document.querySelectorAll('.star-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i < rating);
    });
  }

  selectRating(rating) {
    this.selectedRating = rating;
    this.previewRating(rating);

    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    const ratingLabel = document.getElementById('rating-label');
    if (ratingLabel) {
      ratingLabel.textContent = labels[rating] || '';
      ratingLabel.style.color = rating >= 4 ? 'var(--brand-gold-500)' : 'var(--text-muted)';
    }
  }

  bindSubmit() {
    const btn = document.getElementById('submit-review-btn');
    btn?.addEventListener('click', () => this.submitReview());

    const directBtn = document.getElementById('direct-review-btn');
    directBtn?.addEventListener('click', () => this.openGoogleReview());
  }

  async submitReview() {
    if (this.selectedRating === 0) {
      window.App.showToast('⭐ Please select a star rating first!', 'warning');
      return;
    }

    const btn = document.getElementById('submit-review-btn');
    if (btn) {
      btn.innerHTML = '<span class="spinner"></span> Opening Google Reviews...';
      btn.disabled = true;
    }

    await new Promise(r => setTimeout(r, 800));

    this.openGoogleReview();
    this.showThankYou();
  }

  openGoogleReview() {
    const url = this.settings?.googleReviewUrl ||
      'https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID';
    window.open(url, '_blank', 'noopener');
    window.Analytics.logShare('google_review');
  }

  showThankYou() {
    const panel = document.getElementById('review-panel');
    const thankyou = document.getElementById('thankyou-panel');

    if (panel) panel.style.display = 'none';
    if (thankyou) {
      thankyou.style.display = 'flex';
      thankyou.classList.add('anim-bounce-in');
    }

    // Confetti burst
    this.burstConfetti();
    this.submitted = true;
  }

  burstConfetti() {
    const colors = ['#d4940a', '#f5c842', '#236b42', '#3dab6a', '#ffffff', '#fad978'];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.5;

    for (let i = 0; i < 28; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left: ${centerX + (Math.random() - 0.5) * 200}px;
        top: ${centerY}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        transform: rotate(${Math.random() * 360}deg);
        animation-delay: ${Math.random() * 400}ms;
        animation-duration: ${600 + Math.random() * 600}ms;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  }
}

window.ReviewsModule = new ReviewsModule();
