/**
 * map.js — Interactive Campus Map (Leaflet.js + OpenStreetMap)
 */

class CampusMap {
  constructor() {
    this.map = null;
    this.userMarker = null;
    this.buildingMarkers = [];
    this.routingControl = null;
    this.currentLocation = null;
    this.allLocations = [];
    this.searchQuery = '';
    this.initialized = false;
  }

  /**
   * Initialize the Leaflet map
   */
  async init(currentLocation) {
    if (this.initialized) return;
    this.currentLocation = currentLocation;
    this.allLocations = window.QRRouter.getAllLocations();

    // Wait for Leaflet to load
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded');
      return;
    }

    // Campus center (average of all locations)
    const centerLat = currentLocation.lat;
    const centerLng = currentLocation.lng;

    // Create map
    this.map = L.map('leaflet-map', {
      center: [centerLat, centerLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      minZoom: 14,
    }).addTo(this.map);

    // Attribution (small, bottom-left)
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© OpenStreetMap')
      .addTo(this.map);

    // Add all building markers
    this.addBuildingMarkers();

    // Add "You Are Here" marker
    this.addUserMarker(currentLocation);

    // Draw campus boundary polygon
    this.drawCampusBoundary();

    this.initialized = true;
    this.updateNearbyCards(currentLocation);
  }

  /**
   * Create custom building marker icon
   */
  createBuildingIcon(location, isUserLocation = false) {
    const color = isUserLocation ? '#d4940a' : location.color || '#236b42';
    const size = isUserLocation ? 44 : 36;
    const emoji = location.icon;

    return L.divIcon({
      className: '',
      html: `
        <div style="
          width: ${size}px; height: ${size}px;
          background: ${color};
          border: 3px solid white;
          border-radius: ${isUserLocation ? '50%' : '10px 10px 0 10px'};
          display: flex; align-items: center; justify-content: center;
          font-size: ${isUserLocation ? '20px' : '16px'};
          box-shadow: 0 3px 12px rgba(0,0,0,0.35);
          transform: ${isUserLocation ? 'none' : 'rotate(0deg)'};
          position: relative;
          animation: ${isUserLocation ? 'markerBounce 2.5s ease-in-out infinite' : 'none'};
          cursor: pointer;
        ">
          ${emoji}
          ${isUserLocation ? `
            <div style="
              position: absolute; inset: -8px;
              border-radius: 50%;
              border: 3px solid ${color};
              opacity: 0;
              animation: youAreHerePulse 2s ease-out infinite;
              pointer-events: none;
            "></div>
          ` : ''}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, isUserLocation ? size / 2 : size],
      popupAnchor: [0, -size],
    });
  }

  /**
   * Add all building markers to the map
   */
  addBuildingMarkers() {
    this.allLocations.forEach(loc => {
      const isUser = loc.id === this.currentLocation.id;
      const icon = this.createBuildingIcon(loc, isUser);

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(this.map);

      // Popup content
      const nearbyLocs = window.QRRouter.getNearbyLocations(loc.lat, loc.lng, 3);
      const dist = isUser ? '' : window.QRRouter.formatDistance(
        window.QRRouter.calcDistance(
          this.currentLocation.lat, this.currentLocation.lng,
          loc.lat, loc.lng
        )
      );

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; min-width: 180px; padding: 4px 0;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <i data-lucide="${loc.icon}" style="color: ${loc.color}; width: 24px; height: 24px;"></i>
            <div>
              <div style="font-size:14px;font-weight:700;color:#1a4d30;line-height:1.2;">${loc.name}</div>
              ${isUser ? '<div style="font-size:10px;background:#d4940a;color:white;padding:2px 6px;border-radius:999px;display:inline-block;margin-top:2px;font-weight:600;">📍 YOU ARE HERE</div>' : ''}
            </div>
          </div>
          <p style="font-size:12px;color:#6b8f7a;margin:0 0 8px;line-height:1.4;">${loc.description}</p>
          ${loc.hours ? `<div style="font-size:11px;color:#9a6800;font-weight:600;">⏰ ${loc.hours}</div>` : ''}
          ${loc.phone ? `<div style="font-size:11px;color:#236b42;margin-top:2px;">📞 ${loc.phone}</div>` : ''}
          ${!isUser ? `<div style="font-size:11px;color:#9a6800;font-weight:600;margin-top:4px;">📏 ${dist}</div>` : ''}
          ${!isUser ? `<button onclick="window.CampusMap.getDirections('${loc.id}')" style="
            margin-top: 8px; width: 100%; padding: 8px;
            background: linear-gradient(135deg, #1a4d30, #236b42);
            color: white; border: none; border-radius: 6px;
            font-size: 12px; font-weight: 600; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
          "><i data-lucide="map" style="width: 14px; height: 14px;"></i> Get Directions</button>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 240,
        className: 'campus-popup',
      });

      if (isUser) {
        // Open popup automatically for user location
        setTimeout(() => marker.openPopup(), 1000);
      }

      this.buildingMarkers.push({ id: loc.id, marker });
    });
  }

  /**
   * Add the "You Are Here" user marker
   */
  addUserMarker(location) {
    this.userMarker = this.buildingMarkers.find(m => m.id === location.id)?.marker;
  }

  /**
   * Draw campus boundary as a polygon
   */
  drawCampusBoundary() {
    const boundary = [
      [11.12280, 75.82260],
      [11.12280, 75.82480],
      [11.12500, 75.82480],
      [11.12500, 75.82260],
    ];

    L.polygon(boundary, {
      color: '#1e5e38',
      weight: 2,
      fillColor: '#236b42',
      fillOpacity: 0.04,
      dashArray: '6, 6',
    }).addTo(this.map);
  }

  /**
   * Get directions from current location to a destination
   */
  getDirections(destinationId) {
    const dest = window.CAMPUS_LOCATIONS[destinationId];
    if (!dest) return;

    // Close any open popups
    this.map.closePopup();

    // Remove previous routing if any
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }

    // Draw a simple polyline between current and destination
    if (this.routingPolyline) {
      this.map.removeLayer(this.routingPolyline);
    }

    const from = [this.currentLocation.lat, this.currentLocation.lng];
    const to = [dest.lat, dest.lng];

    // Draw animated route line
    this.routingPolyline = L.polyline([from, to], {
      color: '#d4940a',
      weight: 4,
      dashArray: '10, 8',
      lineCap: 'round',
    }).addTo(this.map);

    // Fit map to show both points
    this.map.fitBounds(L.latLngBounds([from, to]), { padding: [60, 60] });

    // Show distance info
    const dist = window.QRRouter.calcDistance(from[0], from[1], to[0], to[1]);
    const distFormatted = window.QRRouter.formatDistance(dist);
    const walkTime = Math.ceil(dist / 80); // ~80m per minute walking

    window.App.showToast(
      `Route to ${dest.name} — ${distFormatted} (~${walkTime} min walk)`,
      'info',
      5000
    );

    // Highlight destination marker
    const destMarker = this.buildingMarkers.find(m => m.id === destinationId);
    if (destMarker) {
      destMarker.marker.openPopup();
    }
  }

  /**
   * Search and filter markers
   */
  search(query) {
    this.searchQuery = query.toLowerCase();
    const results = this.allLocations.filter(loc =>
      loc.name.toLowerCase().includes(this.searchQuery) ||
      loc.description.toLowerCase().includes(this.searchQuery) ||
      loc.category.toLowerCase().includes(this.searchQuery)
    );

    this.renderSearchResults(results);
  }

  /**
   * Render search result dropdown
   */
  renderSearchResults(results) {
    const dropdown = document.getElementById('map-search-results');
    if (!dropdown) return;

    if (!this.searchQuery || results.length === 0) {
      dropdown.innerHTML = '';
      dropdown.style.display = 'none';
      return;
    }

    dropdown.style.display = 'block';
    dropdown.innerHTML = results.map(loc => `
      <div class="search-result-item" onclick="window.CampusMap.flyToLocation('${loc.id}')">
        <i data-lucide="${loc.icon}" class="result-icon"></i>
        <div>
          <div class="result-name">${loc.name}</div>
          <div class="result-desc">${loc.description}</div>
        </div>
      </div>
    `).join('');
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /**
   * Fly to a specific location on the map
   */
  flyToLocation(locationId) {
    const loc = window.CAMPUS_LOCATIONS[locationId];
    if (!loc) return;

    document.getElementById('map-search-results').style.display = 'none';
    document.getElementById('map-search').value = '';

    this.map.flyTo([loc.lat, loc.lng], 18, { animate: true, duration: 0.8 });

    const markerData = this.buildingMarkers.find(m => m.id === locationId);
    if (markerData) {
      setTimeout(() => markerData.marker.openPopup(), 900);
    }
  }

  /**
   * Re-center map to current user location
   */
  recenter() {
    if (!this.currentLocation) return;
    this.map.flyTo([this.currentLocation.lat, this.currentLocation.lng], 17, {
      animate: true,
      duration: 0.6
    });
    // Clear route
    if (this.routingPolyline) {
      this.map.removeLayer(this.routingPolyline);
      this.routingPolyline = null;
    }
  }

  /**
   * Update nearby location cards below the map
   */
  updateNearbyCards(currentLocation) {
    const container = document.getElementById('nearby-locations');
    if (!container) return;

    const nearby = window.QRRouter.getNearbyLocations(
      currentLocation.lat, currentLocation.lng, 8
    );

    container.innerHTML = nearby.map(loc => `
      <div class="info-card-mini hover-lift" onclick="window.CampusMap.flyToLocation('${loc.id}')">
        <i data-lucide="${loc.icon}" class="icon"></i>
        <div class="name">${loc.name}</div>
        <div class="dist">${window.QRRouter.formatDistance(loc.distance)}</div>
        <button class="directions-btn" onclick="event.stopPropagation(); window.CampusMap.getDirections('${loc.id}')" style="display:flex;align-items:center;justify-content:center;gap:4px;">
          <i data-lucide="map" style="width: 14px; height: 14px;"></i> Directions
        </button>
      </div>
    `).join('');
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

// Export singleton
window.CampusMap = new CampusMap();
