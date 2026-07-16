/**
 * qr-router.js — QR Code Location Router
 * Parses URL params and maps location slugs to campus data
 */

const CAMPUS_LOCATIONS = {
  'main-gate': {
    id: 'main-gate',
    name: 'Main Entrance Gate',
    nameAr: 'البوابة الرئيسية',
    nameMl: 'പ്രധാന കവാടം',
    description: 'Main entrance to Markaz Knowledge City campus',
    icon: 'map-pin',
    lat: 11.12320,
    lng: 75.82340,
    category: 'entrance',
    phone: '+91-483-271-0000',
    hours: '24/7',
    color: '#1e5e38'
  },
  'knowledge-hub': {
    id: 'knowledge-hub',
    name: 'Knowledge Hub',
    nameAr: 'مركز المعرفة',
    nameMl: 'നോളജ് ഹബ്',
    description: 'State-of-the-art learning and innovation center',
    icon: 'book-open',
    lat: 11.12400,
    lng: 75.82380,
    category: 'academic',
    phone: '+91-483-271-0001',
    hours: '8:00 AM – 8:00 PM',
    color: '#236b42'
  },
  'convention-centre': {
    id: 'convention-centre',
    name: 'Convention Centre',
    nameAr: 'مركز المؤتمرات',
    nameMl: 'കൺവെൻഷൻ സെന്റർ',
    description: 'Large conference and event venue with 2000+ seating',
    icon: 'layout',
    lat: 11.12450,
    lng: 75.82300,
    category: 'facility',
    phone: '+91-483-271-0002',
    hours: '7:00 AM – 10:00 PM',
    color: '#9a6800'
  },
  'library': {
    id: 'library',
    name: 'Central Library',
    nameAr: 'المكتبة المركزية',
    nameMl: 'സെൻട്രൽ ലൈബ്രറി',
    description: 'Multi-floor library with thousands of books and digital resources',
    icon: 'library',
    lat: 11.12380,
    lng: 75.82420,
    category: 'academic',
    phone: '+91-483-271-0003',
    hours: '8:00 AM – 9:00 PM',
    color: '#1a4d30'
  },
  'masjid': {
    id: 'masjid',
    name: 'Campus Mosque',
    nameAr: 'المسجد الجامعي',
    nameMl: 'ക്യാമ്പസ് മസ്ജിദ്',
    description: 'Beautiful mosque open for all five daily prayers',
    icon: 'moon',
    lat: 11.12360,
    lng: 75.82280,
    category: 'religious',
    phone: '',
    hours: 'Prayer Times',
    color: '#103520'
  },
  'parking': {
    id: 'parking',
    name: 'Main Parking Area',
    nameAr: 'منطقة الانتظار الرئيسية',
    nameMl: 'പ്രധാന പാർക്കിംഗ്',
    description: 'Multi-level parking for 500+ vehicles',
    icon: 'parking-circle',
    lat: 11.12300,
    lng: 75.82350,
    category: 'facility',
    phone: '',
    hours: '24/7',
    color: '#5c3d00'
  },
  'admin-block': {
    id: 'admin-block',
    name: 'Administration Block',
    nameAr: 'مبنى الإدارة',
    nameMl: 'അഡ്മിൻ ബ്ലോക്ക്',
    description: 'Administrative offices, registrar, and student services',
    icon: 'briefcase',
    lat: 11.12420,
    lng: 75.82400,
    category: 'office',
    phone: '+91-483-271-0010',
    hours: '9:00 AM – 5:00 PM',
    color: '#2d8a55'
  },
  'cafeteria': {
    id: 'cafeteria',
    name: 'Cafeteria & Food Court',
    nameAr: 'الكافيتيريا',
    nameMl: 'കഫറ്റേറിയ',
    description: 'Halal dining with local and international cuisine',
    icon: 'coffee',
    lat: 11.12440,
    lng: 75.82360,
    category: 'food',
    phone: '+91-483-271-0005',
    hours: '7:00 AM – 10:00 PM',
    color: '#c08000'
  },
  'hospital': {
    id: 'hospital',
    name: 'Markaz Hospital',
    nameAr: 'مستشفى مركز',
    nameMl: 'മർകസ് ഹോസ്പിറ്റൽ',
    description: 'Modern multi-specialty hospital serving the campus and community',
    icon: 'activity',
    lat: 11.12280,
    lng: 75.82400,
    category: 'medical',
    phone: '+91-483-271-1000',
    hours: '24/7 Emergency',
    color: '#b91c1c'
  },
  'guest-house': {
    id: 'guest-house',
    name: 'Guest House',
    nameAr: 'دار الضيافة',
    nameMl: 'ഗസ്റ്റ് ഹൌസ്',
    description: 'Comfortable accommodation for visitors and guests',
    icon: 'home',
    lat: 11.12350,
    lng: 75.82460,
    category: 'facility',
    phone: '+91-483-271-0006',
    hours: '24/7',
    color: '#7a5200'
  },
  'sports-complex': {
    id: 'sports-complex',
    name: 'Sports Complex',
    nameAr: 'مجمع رياضي',
    nameMl: 'സ്പോർട്സ് കോംപ്ലക്സ്',
    description: 'Indoor and outdoor sports facilities for students and visitors',
    icon: 'flag',
    lat: 11.12480,
    lng: 75.82330,
    category: 'sports',
    phone: '+91-483-271-0007',
    hours: '6:00 AM – 9:00 PM',
    color: '#1d4ed8'
  }
};

const CATEGORY_LABELS = {
  entrance: { label: 'Entrance', color: '#1e5e38' },
  academic:  { label: 'Academic', color: '#236b42' },
  facility:  { label: 'Facility', color: '#9a6800' },
  religious: { label: 'Mosque', color: '#103520' },
  office:    { label: 'Office', color: '#2d8a55' },
  food:      { label: 'Food & Dining', color: '#c08000' },
  medical:   { label: 'Medical', color: '#b91c1c' },
  sports:    { label: 'Sports', color: '#1d4ed8' }
};

class QRRouter {
  constructor() {
    this.currentLocation = null;
    this.defaultLocation = CAMPUS_LOCATIONS['main-gate'];
  }

  /**
   * Parse URL query params to get the current location
   */
  parseLocation() {
    const params = new URLSearchParams(window.location.search);
    const locationSlug = params.get('location') || params.get('loc') || params.get('l');

    if (locationSlug && CAMPUS_LOCATIONS[locationSlug]) {
      this.currentLocation = CAMPUS_LOCATIONS[locationSlug];
    } else if (locationSlug) {
      // Unknown location slug — use default
      console.warn(`Unknown location slug: ${locationSlug}. Using default.`);
      this.currentLocation = this.defaultLocation;
    } else {
      // No QR param — show default (main gate)
      this.currentLocation = this.defaultLocation;
    }

    // Log scan for analytics
    this.logScan(this.currentLocation, locationSlug);
    return this.currentLocation;
  }

  /**
   * Log this QR scan to analytics
   */
  logScan(location, rawSlug) {
    if (window.Analytics) {
      window.Analytics.logScan(location, rawSlug);
    }
    // Also store in sessionStorage for later use
    sessionStorage.setItem('currentLocation', JSON.stringify(location));
  }

  /**
   * Get all locations for map display
   */
  getAllLocations() {
    return Object.values(CAMPUS_LOCATIONS);
  }

  /**
   * Get nearby locations sorted by distance
   */
  getNearbyLocations(lat, lng, limit = 5) {
    return Object.values(CAMPUS_LOCATIONS)
      .filter(loc => loc.lat !== lat || loc.lng !== lng)
      .map(loc => ({
        ...loc,
        distance: this.calcDistance(lat, lng, loc.lat, loc.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  /**
   * Haversine distance formula (returns meters)
   */
  calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  /**
   * Format distance for display
   */
  formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  }
}

// Export singleton
window.QRRouter = new QRRouter();
window.CAMPUS_LOCATIONS = CAMPUS_LOCATIONS;
window.CATEGORY_LABELS = CATEGORY_LABELS;
