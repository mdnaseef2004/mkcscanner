/**
 * story.js — Social Media Story Template Generator
 * Canvas-based photo + frame overlay composer
 */

class StoryGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.selectedFrame = 0;
    this.userPhoto = null;
    this.captionText = '';
    this.frames = [
      {
        id: 0,
        name: 'Classic Markaz',
        src: 'assets/templates/frame1.png',
        img: null,
        loaded: false,
        bgColor: '#0a2416',
      },
      {
        id: 1,
        name: 'Arched Elegance',
        src: 'assets/templates/frame2.png',
        img: null,
        loaded: false,
        bgColor: '#103520',
      },
      {
        id: 2,
        name: 'Gold Minimal',
        src: null,
        img: null,
        loaded: true,
        bgColor: '#0a2416',
        isGenerated: true,
      },
    ];

    this.autoCaptions = [
      'Exploring Markaz Knowledge City, Calicut 🌟',
      'Learning at Markaz Knowledge City, Kerala 📚',
      'Visiting the heart of Islamic education in Kerala 🕌',
      'Proud to be at Markaz Knowledge City! 🏛️',
      'Knowledge, Culture, Heritage — Markaz KC 🌿',
    ];

    this.currentCaption = 0;
  }

  async init() {
    this.canvas = document.getElementById('storyCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 540;
    this.canvas.height = 960;

    await this.preloadFrames();
    this.renderTemplateGrid();
    this.bindEvents();
    this.renderCanvas();
  }

  async preloadFrames() {
    const promises = this.frames
      .filter(f => f.src)
      .map(frame => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { frame.img = img; frame.loaded = true; resolve(); };
        img.onerror = () => { frame.loaded = true; resolve(); };
        img.src = frame.src;
      }));
    await Promise.all(promises);
  }

  renderTemplateGrid() {
    const grid = document.getElementById('template-grid');
    if (!grid) return;

    grid.innerHTML = this.frames.map((frame, i) => `
      <div class="template-card ${i === this.selectedFrame ? 'selected' : ''}"
        onclick="window.StoryGenerator.selectFrame(${i})">
        ${frame.img
          ? `<img src="${frame.src}" alt="${frame.name}" />`
          : `<div style="
              width:100%; aspect-ratio:9/16;
              background: ${frame.bgColor};
              display:flex; flex-direction:column; align-items:center;
              justify-content:center; gap:8px; color:rgba(255,255,255,0.7);
              font-size:12px; text-align:center;
            ">
              <div style="font-size:28px;">✨</div>
              <div>${frame.name}</div>
            </div>`
        }
        <div class="template-label">${frame.name}</div>
        <div class="template-check">✓</div>
      </div>
    `).join('');
  }

  selectFrame(index) {
    this.selectedFrame = index;
    document.querySelectorAll('.template-card').forEach((c, i) => {
      c.classList.toggle('selected', i === index);
    });
    this.renderCanvas();
  }

  bindEvents() {
    // Photo upload
    const uploadBtn = document.getElementById('upload-photo-btn');
    const photoInput = document.getElementById('photo-input');
    uploadBtn?.addEventListener('click', () => photoInput?.click());
    photoInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          this.userPhoto = img;
          this.renderCanvas();
          window.App.showToast('📸 Photo added!', 'success');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Caption input
    const captionInput = document.getElementById('story-caption');
    captionInput?.addEventListener('input', (e) => {
      this.captionText = e.target.value;
      this.renderCanvas();
    });

    // Auto-generate caption
    const autoBtn = document.getElementById('auto-caption-btn');
    autoBtn?.addEventListener('click', () => {
      this.currentCaption = (this.currentCaption + 1) % this.autoCaptions.length;
      const caption = this.autoCaptions[this.currentCaption];
      if (captionInput) captionInput.value = caption;
      this.captionText = caption;
      this.renderCanvas();
    });

    // Download
    const dlBtn = document.getElementById('download-story-btn');
    dlBtn?.addEventListener('click', () => this.downloadStory());

    // Share to Instagram
    const igBtn = document.getElementById('share-ig-btn');
    igBtn?.addEventListener('click', () => this.shareToInstagram());
  }

  renderCanvas() {
    const { canvas, ctx } = this;
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const frame = this.frames[this.selectedFrame];

    // Background
    ctx.fillStyle = frame.bgColor || '#0a2416';
    ctx.fillRect(0, 0, W, H);

    // Islamic geometric pattern background (generated)
    this.drawIslamicPattern(ctx, W, H);

    // Draw user photo in center
    if (this.userPhoto) {
      const padding = 60;
      const photoArea = { x: padding, y: H * 0.18, w: W - padding * 2, h: H * 0.52 };
      ctx.save();
      ctx.beginPath();
      this.roundRect(ctx, photoArea.x, photoArea.y, photoArea.w, photoArea.h, 20);
      ctx.clip();

      // Fit photo
      const scale = Math.max(photoArea.w / this.userPhoto.width, photoArea.h / this.userPhoto.height);
      const sw = this.userPhoto.width * scale;
      const sh = this.userPhoto.height * scale;
      const sx = photoArea.x + (photoArea.w - sw) / 2;
      const sy = photoArea.y + (photoArea.h - sh) / 2;
      ctx.drawImage(this.userPhoto, sx, sy, sw, sh);
      ctx.restore();
    } else {
      // Placeholder
      const cx = W / 2, cy = H * 0.43;
      ctx.save();
      ctx.beginPath();
      this.roundRect(ctx, 60, H * 0.18, W - 120, H * 0.52, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(212,148,10,0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📸', cx, cy - 10);
      ctx.font = '500 16px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('Tap to add your photo', cx, cy + 40);
    }

    // Draw frame overlay
    if (frame.img) {
      ctx.drawImage(frame.img, 0, 0, W, H);
    } else {
      // Draw generated frame
      this.drawGeneratedFrame(ctx, W, H, frame);
    }

    // Caption text at bottom
    const caption = this.captionText || this.autoCaptions[0];
    this.drawCaption(ctx, caption, W, H);

    // Logo / branding
    this.drawBranding(ctx, W, H);
  }

  drawIslamicPattern(ctx, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#d4940a';
    ctx.lineWidth = 1;
    const size = 60;
    for (let x = 0; x < W; x += size) {
      for (let y = 0; y < H; y += size) {
        ctx.beginPath();
        // Simple 8-pointed star pattern
        const cx = x + size / 2;
        const cy = y + size / 2;
        const r = size * 0.35;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const innerR = r * 0.4;
          if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
          else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
          const innerAngle = angle + Math.PI / 8;
          ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawGeneratedFrame(ctx, W, H, frame) {
    // Top banner
    const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.18);
    topGrad.addColorStop(0, 'rgba(10,36,22,0.98)');
    topGrad.addColorStop(1, 'rgba(10,36,22,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, H * 0.18);

    // Bottom banner
    const btmGrad = ctx.createLinearGradient(0, H * 0.72, 0, H);
    btmGrad.addColorStop(0, 'rgba(10,36,22,0)');
    btmGrad.addColorStop(1, 'rgba(10,36,22,0.98)');
    ctx.fillStyle = btmGrad;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // Gold top border
    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, '#9a6800');
    goldGrad.addColorStop(0.5, '#f5c842');
    goldGrad.addColorStop(1, '#9a6800');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 4, W, 4);
  }

  drawCaption(ctx, text, W, H) {
    if (!text) return;
    const maxWidth = W - 80;
    const lineHeight = 36;
    const lines = this.wrapText(ctx, text, maxWidth, '600 22px Inter, sans-serif');
    const totalH = lines.length * lineHeight;
    const startY = H - 100 - totalH;

    ctx.textAlign = 'center';
    lines.forEach((line, i) => {
      // Text shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = '600 22px Inter, sans-serif';
      ctx.fillText(line, W / 2 + 1, startY + i * lineHeight + 1);
      // Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, W / 2, startY + i * lineHeight);
    });
  }

  drawBranding(ctx, W, H) {
    // Top: Markaz text
    ctx.textAlign = 'center';
    ctx.font = '700 28px Playfair Display, serif';
    const titleGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
    titleGrad.addColorStop(0, '#9a6800');
    titleGrad.addColorStop(0.5, '#f5c842');
    titleGrad.addColorStop(1, '#9a6800');
    ctx.fillStyle = titleGrad;
    ctx.fillText('MARKAZ KNOWLEDGE CITY', W / 2, 56);

    ctx.font = '400 16px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Calicut, Kerala • markaz.edu.in', W / 2, 80);

    // Bottom: location & hashtag
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('#MarkazKnowledgeCity #MKC', W / 2, H - 64);

    ctx.font = '400 14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('@markazkc • @markaz.edu.in', W / 2, H - 42);
  }

  wrapText(ctx, text, maxWidth, font) {
    ctx.font = font;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  downloadStory() {
    const link = document.createElement('a');
    link.download = 'markaz-story.png';
    link.href = this.canvas.toDataURL('image/png', 0.92);
    link.click();
    window.App.showToast('✅ Story saved! Share it on Instagram, WhatsApp, or Facebook.', 'success', 4000);
    window.Analytics.logShare('story_download');
  }

  shareToInstagram() {
    this.downloadStory();
    setTimeout(() => {
      window.App.showToast('📱 Story downloaded! Open Instagram and upload from your gallery.', 'info', 5000);
    }, 800);
  }
}

window.StoryGenerator = new StoryGenerator();
