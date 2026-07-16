/**
 * admin.js — Admin Dashboard Logic
 */

class AdminDashboard {
  constructor() {
    this.currentSection = 'overview';
    this.analytics = null;
    this.posters = [];
    this.charts = {};
  }

  async init() {
    // Check authentication
    if (!window.SupabaseService.isAuthenticated()) {
      this.showLogin();
      return;
    }
    this.showDashboard();
    await this.loadSection('overview');
  }

  showLogin() {
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-shell').style.display = 'none';
    document.getElementById('admin-shell').classList.remove('active');

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      const errEl = document.getElementById('login-error');

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in...';
      errEl.textContent = '';

      const { user, error } = await window.SupabaseService.signIn(email, password);

      if (error || !user) {
        errEl.textContent = error?.message || 'Login failed. Please try again.';
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
        return;
      }

      document.getElementById('admin-login').style.display = 'none';
      this.showDashboard();
      await this.loadSection('overview');
    });
  }

  showDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    const shell = document.getElementById('admin-shell');
    shell.style.display = 'flex';
    shell.classList.add('active');

    // Bind sidebar nav
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        if (section) this.loadSection(section);
      });
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await window.SupabaseService.signOut();
      location.reload();
    });
  }

  async loadSection(section) {
    this.currentSection = section;

    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update page title
    const titles = {
      overview: '📊 Analytics Overview',
      posters: '🖼️ Poster Manager',
      story: '✨ Story Templates',
      map: '🗺️ Map Locations',
      qr: '📱 QR Code Generator',
      settings: '⚙️ Settings',
    };
    document.getElementById('admin-page-title').textContent = titles[section] || section;

    // Render section content
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="spinner-green spinner" style="margin:40px auto;display:block;width:40px;height:40px;"></div>';

    await new Promise(r => setTimeout(r, 300));

    switch(section) {
      case 'overview': await this.renderOverview(content); break;
      case 'posters': await this.renderPosters(content); break;
      case 'story': await this.renderStoryTemplates(content); break;
      case 'map': await this.renderMapManager(content); break;
      case 'qr': await this.renderQRGenerator(content); break;
      case 'settings': await this.renderSettings(content); break;
    }
  }

  async renderOverview(container) {
    this.analytics = await window.SupabaseService.getAnalytics();
    const a = this.analytics;

    container.innerHTML = `
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${a.totalScans}</div>
          <div class="stat-label">Total QR Scans</div>
          <div class="stat-icon">📱</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${a.totalDownloads}</div>
          <div class="stat-label">Poster Downloads</div>
          <div class="stat-icon">⬇️</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${a.totalShares}</div>
          <div class="stat-label">Total Shares</div>
          <div class="stat-icon">🔗</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Object.keys(a.locationCounts || {}).length || 0}</div>
          <div class="stat-label">Active QR Locations</div>
          <div class="stat-icon">📍</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <!-- Daily Scans -->
        <div class="admin-card">
          <div class="admin-card-title">📈 Daily Scans (Last 7 Days)</div>
          <div class="chart-container"><canvas id="chart-daily"></canvas></div>
        </div>
        <!-- Top Locations -->
        <div class="admin-card">
          <div class="admin-card-title">📍 Top Scanned Locations</div>
          <div class="chart-container"><canvas id="chart-locations"></canvas></div>
        </div>
      </div>

      <!-- Recent Scans Table -->
      <div class="admin-card">
        <div class="admin-card-title">🕐 Recent QR Scans</div>
        ${a.recentScans.length === 0
          ? `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0;">
              No scans recorded yet. QR scans will appear here automatically.
             </p>`
          : `<div style="overflow-x:auto;">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Time</th>
                    <th>Device</th>
                  </tr>
                </thead>
                <tbody>
                  ${a.recentScans.slice(0,15).map(scan => `
                    <tr>
                      <td>${scan.location_name || scan.location_id}</td>
                      <td>${new Date(scan.timestamp).toLocaleString()}</td>
                      <td style="font-size:11px;color:var(--text-muted);">
                        ${scan.user_agent?.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`
        }
      </div>
    `;

    // Render charts
    this.renderCharts(a);
  }

  renderCharts(analytics) {
    // Daily scans chart
    const dailyCtx = document.getElementById('chart-daily')?.getContext('2d');
    if (dailyCtx && typeof Chart !== 'undefined' && analytics.dailyCounts) {
      const labels = analytics.dailyCounts.map(d =>
        new Date(d.date).toLocaleDateString('en', { weekday: 'short' })
      );
      const data = analytics.dailyCounts.map(d => d.count);

      new Chart(dailyCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Scans',
            data,
            backgroundColor: 'rgba(35, 107, 66, 0.7)',
            borderColor: '#236b42',
            borderWidth: 2,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Location breakdown chart
    const locCtx = document.getElementById('chart-locations')?.getContext('2d');
    if (locCtx && typeof Chart !== 'undefined' && analytics.locationCounts) {
      const entries = Object.entries(analytics.locationCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 6);

      new Chart(locCtx, {
        type: 'doughnut',
        data: {
          labels: entries.map(e => e[0]),
          datasets: [{
            data: entries.map(e => e[1]),
            backgroundColor: [
              '#236b42','#d4940a','#1877f2','#ff0000','#25d366','#833ab4'
            ],
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } }
          }
        }
      });
    }
  }

  async renderPosters(container) {
    const posters = await window.SupabaseService.getPosters();

    container.innerHTML = `
      <!-- Upload Zone -->
      <div class="admin-card" style="margin-bottom:20px;">
        <div class="admin-card-title">⬆️ Upload New Poster</div>
        <form id="upload-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div>
              <label class="admin-form-label">Poster Title</label>
              <input type="text" class="admin-form-input" id="poster-title" placeholder="e.g. Annual Day 2025" required />
            </div>
            <div>
              <label class="admin-form-label">Category</label>
              <select class="admin-form-input" id="poster-category">
                <option value="general">General</option>
                <option value="events">Events</option>
                <option value="academic">Academic</option>
              </select>
            </div>
          </div>
          <div class="upload-zone" id="drop-zone">
            <div class="upload-icon">🖼️</div>
            <div class="upload-text">Click or drag poster image here</div>
            <div class="upload-hint">JPG, PNG, WEBP — Max 5MB</div>
            <input type="file" id="poster-file" accept="image/*" style="display:none" />
          </div>
          <div id="upload-preview" style="margin-top:12px;display:none;">
            <img id="upload-preview-img" style="max-height:120px;border-radius:8px;margin-bottom:8px;" />
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-12" id="upload-submit">
            ⬆️ Upload Poster
          </button>
        </form>
      </div>

      <!-- Existing Posters -->
      <div class="admin-card">
        <div class="admin-card-title">🖼️ Existing Posters (${posters.length})</div>
        ${posters.length === 0
          ? '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:24px 0;">No posters yet. Upload your first one above.</p>'
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">
              ${posters.map(p => `
                <div style="background:var(--bg-secondary);border-radius:10px;overflow:hidden;border:1px solid var(--border-color);">
                  ${p.url
                    ? `<img src="${p.url}" style="width:100%;aspect-ratio:3/4;object-fit:cover;" />`
                    : `<div style="aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;font-size:24px;background:var(--bg-card);">🖼️</div>`
                  }
                  <div style="padding:8px;">
                    <div style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">${p.title}</div>
                    <span style="font-size:10px;background:rgba(35,107,66,.1);color:#236b42;padding:2px 6px;border-radius:999px;">${p.category}</span>
                    <button onclick="window.AdminDashboard.deletePoster(${p.id})"
                      style="display:block;width:100%;margin-top:6px;padding:4px;font-size:11px;background:rgba(239,68,68,.1);color:#ef4444;border:none;border-radius:4px;cursor:pointer;">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;

    this.bindUploadForm();
  }

  bindUploadForm() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('poster-file');
    const preview = document.getElementById('upload-preview');
    const previewImg = document.getElementById('upload-preview-img');

    dropZone?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file && previewImg && preview) {
        previewImg.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      }
    });

    // Drag & drop
    dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files?.[0];
      if (file && fileInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        if (previewImg && preview) {
          previewImg.src = URL.createObjectURL(file);
          preview.style.display = 'block';
        }
      }
    });

    document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('poster-title')?.value.trim();
      const category = document.getElementById('poster-category')?.value;
      const file = document.getElementById('poster-file')?.files?.[0];
      const btn = document.getElementById('upload-submit');

      if (!title) { window.App?.showToast('Please enter a poster title', 'warning'); return; }
      if (!file) { window.App?.showToast('Please select an image file', 'warning'); return; }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Uploading...';

      const { error } = await window.SupabaseService.uploadPoster(file, title, category);

      if (error) {
        window.App?.showToast(`Upload failed: ${error.message}`, 'warning');
      } else {
        window.App?.showToast('✅ Poster uploaded successfully!', 'success');
        await this.loadSection('posters');
      }
    });
  }

  async deletePoster(id) {
    if (!confirm('Delete this poster? This cannot be undone.')) return;
    const { error } = await window.SupabaseService.deletePoster(id);
    if (!error) {
      window.App?.showToast('🗑️ Poster deleted', 'info');
      await this.loadSection('posters');
    }
  }

  async renderStoryTemplates(container) {
    container.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-title">✨ Story Frame Templates</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          The app currently includes 3 built-in story frames. To add custom frames, place PNG images in
          <code>assets/templates/</code> and update the frames array in <code>js/story.js</code>.
        </p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div style="background:var(--bg-secondary);border-radius:10px;overflow:hidden;">
            <img src="../assets/templates/frame1.png" style="width:100%;aspect-ratio:9/16;object-fit:cover;" />
            <div style="padding:8px;font-size:12px;font-weight:600;">Classic Markaz</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:10px;overflow:hidden;">
            <img src="../assets/templates/frame2.png" style="width:100%;aspect-ratio:9/16;object-fit:cover;" />
            <div style="padding:8px;font-size:12px;font-weight:600;">Arched Elegance</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;">
            <div style="aspect-ratio:9/16;background:#0a2416;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);font-size:14px;text-align:center;padding:16px;">
              Gold Minimal<br>(Generated)
            </div>
            <div style="padding:8px;font-size:12px;font-weight:600;">Gold Minimal</div>
          </div>
        </div>
      </div>
    `;
  }

  async renderMapManager(container) {
    const locations = await window.SupabaseService.getCampusLocations();

    container.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-title">📍 Campus Location Manager</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          Update campus location names, descriptions, and GPS coordinates.
          Changes appear immediately on the visitor map.
        </p>
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Icon</th><th>Name</th><th>Category</th><th>Latitude</th><th>Longitude</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${locations.map(loc => `
                <tr id="loc-row-${loc.id}">
                  <td style="font-size:20px;">${loc.icon}</td>
                  <td><input class="admin-form-input" style="min-width:140px;" value="${loc.name}" id="loc-name-${loc.id}" /></td>
                  <td><span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(35,107,66,.1);color:#236b42;">${loc.category}</span></td>
                  <td><input class="admin-form-input" style="width:110px;" value="${loc.lat}" id="loc-lat-${loc.id}" type="number" step="0.00001" /></td>
                  <td><input class="admin-form-input" style="width:110px;" value="${loc.lng}" id="loc-lng-${loc.id}" type="number" step="0.00001" /></td>
                  <td>
                    <button onclick="window.AdminDashboard.saveLocation('${loc.id}')"
                      class="btn btn-primary btn-sm">Save</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async saveLocation(id) {
    const name = document.getElementById(`loc-name-${id}`)?.value;
    const lat = parseFloat(document.getElementById(`loc-lat-${id}`)?.value);
    const lng = parseFloat(document.getElementById(`loc-lng-${id}`)?.value);

    const { error } = await window.SupabaseService.updateCampusLocation(id, { name, lat, lng });
    if (error) window.App?.showToast('Failed to update location', 'warning');
    else window.App?.showToast(`✅ ${name} updated!`, 'success');
  }

  async renderQRGenerator(container) {
    const locations = Object.values(window.CAMPUS_LOCATIONS);
    const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', '');

    container.innerHTML = `
      <div class="admin-card" style="margin-bottom:20px;">
        <div class="admin-card-title">📱 QR Code Generator</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          Print and place these QR codes at the corresponding campus locations.
          Each QR opens the visitor app with the correct "You Are Here" marker.
        </p>
        <div class="qr-grid" id="qr-grid">
          ${locations.map(loc => `
            <div class="qr-item">
              <div id="qr-${loc.id}" style="width:120px;height:120px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:11px;color:#666;">
                Generating...
              </div>
              <div class="qr-name">${loc.icon} ${loc.name}</div>
              <button onclick="window.AdminDashboard.downloadQR('${loc.id}', '${loc.name.replace(/'/g, '')}')"
                class="btn btn-ghost btn-sm" style="width:100%;margin-top:6px;">⬇️ Download</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Generate QR codes
    if (typeof QRCode === 'undefined') {
      // Load QRCode.js dynamically
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    locations.forEach(loc => {
      const el = document.getElementById(`qr-${loc.id}`);
      if (!el) return;
      el.innerHTML = '';
      const url = `${baseUrl}index.html?location=${loc.id}`;
      new QRCode(el, {
        text: url,
        width: 120,
        height: 120,
        colorDark: '#0a2416',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });
    });
  }

  downloadQR(locId, locName) {
    const canvas = document.querySelector(`#qr-${locId} canvas`);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `markaz-qr-${locId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    window.App?.showToast(`✅ QR code for "${locName}" downloaded!`, 'success');
  }

  async renderSettings(container) {
    const settings = await window.SupabaseService.getSettings();

    container.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-title">⚙️ App Settings</div>
        <form id="settings-form">
          <div style="display:grid;gap:14px;">
            <div>
              <label class="admin-form-label">Google Review URL</label>
              <input class="admin-form-input" id="s-google-review" value="${settings.googleReviewUrl || ''}" placeholder="https://search.google.com/local/writereview?placeid=..." />
            </div>
            <div>
              <label class="admin-form-label">Instagram URL</label>
              <input class="admin-form-input" id="s-instagram" value="${settings.instagramUrl || ''}" />
            </div>
            <div>
              <label class="admin-form-label">Facebook URL</label>
              <input class="admin-form-input" id="s-facebook" value="${settings.facebookUrl || ''}" />
            </div>
            <div>
              <label class="admin-form-label">YouTube URL</label>
              <input class="admin-form-input" id="s-youtube" value="${settings.youtubeUrl || ''}" />
            </div>
            <div>
              <label class="admin-form-label">Official Website</label>
              <input class="admin-form-input" id="s-website" value="${settings.websiteUrl || ''}" />
            </div>
            <div>
              <label class="admin-form-label">WhatsApp Number</label>
              <input class="admin-form-input" id="s-whatsapp" value="${settings.whatsappNumber || ''}" placeholder="+914832710000" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label class="admin-form-label">Avg. Google Rating</label>
                <input class="admin-form-input" id="s-rating" type="number" min="1" max="5" step="0.1" value="${settings.averageRating || 4.8}" />
              </div>
              <div>
                <label class="admin-form-label">Total Reviews</label>
                <input class="admin-form-input" id="s-reviews" type="number" value="${settings.totalReviews || 0}" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary" id="save-settings-btn">💾 Save Settings</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('save-settings-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Saving...';

      const newSettings = {
        googleReviewUrl: document.getElementById('s-google-review')?.value,
        instagramUrl: document.getElementById('s-instagram')?.value,
        facebookUrl: document.getElementById('s-facebook')?.value,
        youtubeUrl: document.getElementById('s-youtube')?.value,
        websiteUrl: document.getElementById('s-website')?.value,
        whatsappNumber: document.getElementById('s-whatsapp')?.value,
        averageRating: parseFloat(document.getElementById('s-rating')?.value) || 4.8,
        totalReviews: parseInt(document.getElementById('s-reviews')?.value) || 0,
      };

      const { error } = await window.SupabaseService.updateSettings(newSettings);
      btn.disabled = false;
      btn.innerHTML = '💾 Save Settings';

      if (error) window.App?.showToast('Failed to save settings', 'warning');
      else window.App?.showToast('✅ Settings saved!', 'success');
    });
  }
}

window.AdminDashboard = new AdminDashboard();

document.addEventListener('DOMContentLoaded', async () => {
  await window.SupabaseService.connect();
  await window.AdminDashboard.init();
});
