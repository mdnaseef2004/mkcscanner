/**
 * supabase.js — Supabase Client & Helpers
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project credentials
 * from https://supabase.com/dashboard/project/[your-project]/settings/api
 */

// ============================================================
// ⚙️ CONFIGURATION — Replace these with your Supabase project details
// ============================================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
// ============================================================

// Check if Supabase JS is loaded
let supabaseClient = null;

function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.warn('Supabase JS not loaded. Running in demo/local mode.');
    return null;
  }
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase connected');
    return supabaseClient;
  } catch (e) {
    console.error('Supabase init failed:', e);
    return null;
  }
}

// ---- Demo / Local Fallback Data ----
const LOCAL_DATA = {
  posters: [
    { id: 1, title: 'Markaz Knowledge City Welcome', category: 'general', url: null, downloads: 0 },
    { id: 2, title: 'Academic Year 2025-26 Inauguration', category: 'events', url: null, downloads: 0 },
    { id: 3, title: 'Convocation Ceremony', category: 'events', url: null, downloads: 0 },
    { id: 4, title: 'Knowledge Hub Grand Opening', category: 'general', url: null, downloads: 0 },
    { id: 5, title: 'Islamic Education Programs', category: 'academic', url: null, downloads: 0 },
    { id: 6, title: 'Visitor\'s Guide 2025', category: 'general', url: null, downloads: 0 },
  ],
  analytics: {
    scans: JSON.parse(localStorage.getItem('mkc_scans') || '[]'),
    downloads: JSON.parse(localStorage.getItem('mkc_downloads') || '[]'),
    shares: JSON.parse(localStorage.getItem('mkc_shares') || '[]'),
  }
};

class SupabaseService {
  constructor() {
    this.client = null;
    this.isDemo = true;
  }

  async connect() {
    this.client = initSupabase();
    this.isDemo = !this.client ||
      SUPABASE_URL.includes('YOUR_PROJECT_ID') ||
      SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');

    if (this.isDemo) {
      console.info('ℹ️ Running in DEMO mode. Configure Supabase credentials in js/supabase.js to enable full backend.');
    }
    return this;
  }

  // ---- Auth ----
  async signIn(email, password) {
    if (this.isDemo) {
      // Demo admin credentials
      if (email === 'admin@markaz.edu' && password === 'admin123') {
        localStorage.setItem('mkc_admin_token', 'demo_token');
        return { user: { email }, error: null };
      }
      return { user: null, error: { message: 'Invalid credentials. Use admin@markaz.edu / admin123 in demo mode.' } };
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (data?.session) localStorage.setItem('mkc_admin_token', data.session.access_token);
    return { user: data?.user, error };
  }

  async signOut() {
    localStorage.removeItem('mkc_admin_token');
    if (!this.isDemo && this.client) await this.client.auth.signOut();
  }

  isAuthenticated() {
    return !!localStorage.getItem('mkc_admin_token');
  }

  // ---- Posters ----
  async getPosters(category = null) {
    if (this.isDemo) {
      const data = LOCAL_DATA.posters;
      return category ? data.filter(p => p.category === category) : data;
    }
    let query = this.client.from('posters').select('*').order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    return data || [];
  }

  async uploadPoster(file, title, category) {
    if (this.isDemo) {
      const newPoster = {
        id: Date.now(),
        title,
        category,
        url: URL.createObjectURL(file),
        downloads: 0,
        created_at: new Date().toISOString()
      };
      LOCAL_DATA.posters.unshift(newPoster);
      return { poster: newPoster, error: null };
    }
    // Upload to Supabase storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error: uploadError } = await this.client.storage
      .from('posters')
      .upload(fileName, file);

    if (uploadError) return { poster: null, error: uploadError };

    const { data: urlData } = this.client.storage.from('posters').getPublicUrl(fileName);
    const { data, error } = await this.client.from('posters').insert({
      title,
      category,
      storage_path: fileName,
      url: urlData.publicUrl,
      downloads: 0
    }).select().single();

    return { poster: data, error };
  }

  async deletePoster(id) {
    if (this.isDemo) {
      const idx = LOCAL_DATA.posters.findIndex(p => p.id === id);
      if (idx > -1) LOCAL_DATA.posters.splice(idx, 1);
      return { error: null };
    }
    const { error } = await this.client.from('posters').delete().eq('id', id);
    return { error };
  }

  // ---- Analytics ----
  async logScanEvent(locationId, locationName) {
    const event = {
      id: Date.now(),
      location_id: locationId,
      location_name: locationName,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-CA'),
    };

    if (this.isDemo) {
      const scans = JSON.parse(localStorage.getItem('mkc_scans') || '[]');
      scans.unshift(event);
      // Keep last 500
      localStorage.setItem('mkc_scans', JSON.stringify(scans.slice(0, 500)));
      return;
    }

    await this.client.from('scan_events').insert(event);
  }

  async logDownloadEvent(posterId, posterTitle) {
    const event = {
      poster_id: posterId,
      poster_title: posterTitle,
      timestamp: new Date().toISOString(),
    };

    if (this.isDemo) {
      const downloads = JSON.parse(localStorage.getItem('mkc_downloads') || '[]');
      downloads.unshift(event);
      localStorage.setItem('mkc_downloads', JSON.stringify(downloads.slice(0, 500)));
      return;
    }

    await this.client.from('download_events').insert(event);
  }

  async logShareEvent(type, posterId) {
    if (this.isDemo) {
      const shares = JSON.parse(localStorage.getItem('mkc_shares') || '[]');
      shares.unshift({ type, poster_id: posterId, timestamp: new Date().toISOString() });
      localStorage.setItem('mkc_shares', JSON.stringify(shares.slice(0, 500)));
      return;
    }
    await this.client.from('share_events').insert({ type, poster_id: posterId });
  }

  // ---- Analytics Read ----
  async getAnalytics() {
    if (this.isDemo) {
      const scans = JSON.parse(localStorage.getItem('mkc_scans') || '[]');
      const downloads = JSON.parse(localStorage.getItem('mkc_downloads') || '[]');
      const shares = JSON.parse(localStorage.getItem('mkc_shares') || '[]');

      // Location scan counts
      const locationCounts = {};
      scans.forEach(s => {
        locationCounts[s.location_name] = (locationCounts[s.location_name] || 0) + 1;
      });

      // Daily scan counts (last 7 days)
      const dailyCounts = {};
      const last7 = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-CA');
      });
      last7.forEach(d => dailyCounts[d] = 0);
      scans.forEach(s => {
        if (dailyCounts.hasOwnProperty(s.date)) dailyCounts[s.date]++;
      });

      return {
        totalScans: scans.length,
        totalDownloads: downloads.length,
        totalShares: shares.length,
        locationCounts,
        dailyCounts: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
        recentScans: scans.slice(0, 20),
      };
    }

    // Real Supabase queries
    const [scansResult, downloadsResult, sharesResult] = await Promise.all([
      this.client.from('scan_events').select('*').order('timestamp', { ascending: false }),
      this.client.from('download_events').select('count'),
      this.client.from('share_events').select('count'),
    ]);

    return {
      totalScans: scansResult.data?.length || 0,
      totalDownloads: downloadsResult.count || 0,
      totalShares: sharesResult.count || 0,
      recentScans: scansResult.data?.slice(0, 20) || [],
    };
  }

  // ---- Campus Locations ----
  async getCampusLocations() {
    if (this.isDemo) return Object.values(window.CAMPUS_LOCATIONS);
    const { data } = await this.client.from('campus_locations').select('*');
    return data || Object.values(window.CAMPUS_LOCATIONS);
  }

  async updateCampusLocation(id, updates) {
    if (this.isDemo) {
      if (window.CAMPUS_LOCATIONS[id]) {
        Object.assign(window.CAMPUS_LOCATIONS[id], updates);
      }
      return { error: null };
    }
    const { error } = await this.client.from('campus_locations')
      .update(updates).eq('id', id);
    return { error };
  }

  // ---- Settings ----
  async getSettings() {
    const defaults = {
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID',
      instagramUrl: 'https://instagram.com/markazkc',
      facebookUrl: 'https://facebook.com/markazkc',
      youtubeUrl: 'https://youtube.com/@markazkc',
      websiteUrl: 'https://markaz.edu.in',
      whatsappNumber: '+914832710000',
      averageRating: 4.8,
      totalReviews: 1247,
    };

    if (this.isDemo) {
      return { ...defaults, ...JSON.parse(localStorage.getItem('mkc_settings') || '{}') };
    }

    const { data } = await this.client.from('settings').select('*').single();
    return { ...defaults, ...(data || {}) };
  }

  async updateSettings(settings) {
    if (this.isDemo) {
      const current = JSON.parse(localStorage.getItem('mkc_settings') || '{}');
      localStorage.setItem('mkc_settings', JSON.stringify({ ...current, ...settings }));
      return { error: null };
    }
    const { error } = await this.client.from('settings').upsert(settings);
    return { error };
  }
}

window.SupabaseService = new SupabaseService();
