// ============================================
// FarmChain AI — Spatial-Temporal QR Anti-Cloning
// Detects physically impossible QR scan patterns
// Prevents photocopy / clone attacks on QR labels
// ============================================

/**
 * Geo-Velocity Fraud Engine
 *
 * When a consumer scans a QR code, we record their geolocation + timestamp.
 * If the SAME batch is scanned from a location that's physically impossible
 * to reach in the elapsed time (e.g., Mumbai → Delhi in 10 minutes), we
 * flag it as a CLONE DETECTED.
 *
 * Uses the Haversine formula for great-circle distance calculation.
 */

const SCAN_HISTORY_KEY = 'farmchain_qr_scans';

// Velocity thresholds (km/h)
const VELOCITY_THRESHOLDS = {
  SAFE: 120,            // Normal ground transport
  SUSPICIOUS: 500,      // Fast train / possible air
  IMPOSSIBLE: 900,      // Faster than commercial aircraft — definitely cloned
};

// Indian city coordinates for demo simulations
const INDIAN_CITIES = {
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Delhi': { lat: 28.7041, lon: 77.1025 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
};

export class GeoVelocityChecker {
  /**
   * Record a QR scan event
   */
  static recordScan(batchId, lat, lon, timestamp = Date.now(), city = null) {
    const scans = this._getScans();
    if (!scans[batchId]) scans[batchId] = [];

    scans[batchId].push({
      lat,
      lon,
      timestamp,
      city: city || this._estimateCity(lat, lon),
      scanId: `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    });

    this._saveScans(scans);
    return scans[batchId];
  }

  /**
   * Check velocity between the new scan and all previous scans
   * Returns the worst-case (highest velocity) result
   */
  static checkVelocity(batchId, newLat, newLon, newTimestamp = Date.now()) {
    const scans = this._getScans();
    const history = scans[batchId] || [];

    if (history.length === 0) {
      return {
        verdict: 'FIRST_SCAN',
        message: 'First scan recorded — spatial-temporal tracking initiated',
        velocity: 0,
        distance: 0,
        timeDelta: 0,
        totalScans: 1,
        previousScans: [],
      };
    }

    let worstVerdict = 'SAFE';
    let worstVelocity = 0;
    let worstScan = null;

    for (const scan of history) {
      const distance = this._haversineDistance(scan.lat, scan.lon, newLat, newLon);
      const timeDelta = Math.abs(newTimestamp - scan.timestamp) / 3600000; // hours

      // Avoid division by zero — scans less than 1 minute apart with distance
      const velocity = timeDelta > 0.0167
        ? distance / timeDelta
        : distance > 1 ? 99999 : 0;

      if (velocity > worstVelocity) {
        worstVelocity = velocity;
        worstScan = scan;
      }

      if (velocity >= VELOCITY_THRESHOLDS.IMPOSSIBLE) {
        worstVerdict = 'CLONE_DETECTED';
      } else if (velocity >= VELOCITY_THRESHOLDS.SUSPICIOUS && worstVerdict !== 'CLONE_DETECTED') {
        worstVerdict = 'SUSPICIOUS';
      }
    }

    const lastScan = history[history.length - 1];
    const distance = this._haversineDistance(lastScan.lat, lastScan.lon, newLat, newLon);
    const timeDelta = Math.abs(newTimestamp - lastScan.timestamp);

    return {
      verdict: worstVerdict,
      velocity: Math.round(worstVelocity),
      distance: Math.round(distance),
      timeDelta,
      timeDeltaFormatted: this._formatTimeDelta(timeDelta),
      totalScans: history.length + 1,
      previousScan: lastScan,
      conflictingScan: worstScan,
      newLocation: { lat: newLat, lon: newLon, city: this._estimateCity(newLat, newLon) },
      message: this._getVerdictMessage(worstVerdict, worstVelocity, distance),
      previousScans: history,
    };
  }

  /**
   * Get full scan report for a batch (for admin dashboard)
   */
  static getScanReport(batchId) {
    const scans = this._getScans();
    const history = scans[batchId] || [];

    return {
      batchId,
      totalScans: history.length,
      scans: history,
      uniqueCities: [...new Set(history.map(s => s.city).filter(Boolean))],
      firstScan: history[0] || null,
      lastScan: history[history.length - 1] || null,
      isSuspicious: this._isHistorySuspicious(history),
    };
  }

  /**
   * Get all scan reports (for admin)
   */
  static getAllReports() {
    const scans = this._getScans();
    return Object.keys(scans).map(batchId => this.getScanReport(batchId));
  }

  /**
   * Simulate a Sybil QR attack (5 concurrent scans across India)
   * Used for admin demo
   */
  static simulateSybilAttack(batchId) {
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'];
    const now = Date.now();
    const results = [];

    for (const cityName of cities) {
      const city = INDIAN_CITIES[cityName];
      // All scans within a 2-minute window — physically impossible
      const timestamp = now - Math.round(Math.random() * 120000);

      this.recordScan(batchId, city.lat, city.lon, timestamp, cityName);

      results.push({
        city: cityName,
        lat: city.lat,
        lon: city.lon,
        timestamp,
        timeFormatted: new Date(timestamp).toLocaleTimeString('en-IN'),
      });
    }

    // Check velocity between first and last
    const firstCity = INDIAN_CITIES[cities[0]];
    const lastCity = INDIAN_CITIES[cities[cities.length - 1]];
    const velocity = this._haversineDistance(firstCity.lat, firstCity.lon, lastCity.lat, lastCity.lon) / (2 / 60); // 2 mins

    return {
      batchId,
      attackCities: results,
      maxVelocity: Math.round(velocity),
      verdict: 'SYBIL_ATTACK_DETECTED',
      message: `🚨 Sybil Attack: ${cities.length} simultaneous scans across ${cities.join(', ')} within 2 minutes. Escrow funds FROZEN.`,
      escrowFrozen: true,
    };
  }

  /**
   * Seed a demo scan (for consumer trace demo)
   */
  static seedDemoScan(batchId, cityName = 'Mumbai') {
    const city = INDIAN_CITIES[cityName] || INDIAN_CITIES['Mumbai'];
    const scans = this._getScans();

    if (!scans[batchId] || scans[batchId].length === 0) {
      this.recordScan(
        batchId,
        city.lat + (Math.random() * 0.05 - 0.025),
        city.lon + (Math.random() * 0.05 - 0.025),
        Date.now() - 3600000, // 1 hour ago
        cityName
      );
    }
  }

  /**
   * Clear scan history (for reset)
   */
  static reset() {
    localStorage.removeItem(SCAN_HISTORY_KEY);
  }

  // ==========================================
  // Internal helpers
  // ==========================================

  /**
   * Haversine formula — great-circle distance in km
   */
  static _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static _toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Estimate nearest Indian city from coordinates
   */
  static _estimateCity(lat, lon) {
    let nearest = 'Unknown';
    let minDist = Infinity;

    for (const [city, coords] of Object.entries(INDIAN_CITIES)) {
      const dist = this._haversineDistance(lat, lon, coords.lat, coords.lon);
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }

    return minDist < 100 ? nearest : `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
  }

  static _getVerdictMessage(verdict, velocity, distance) {
    switch (verdict) {
      case 'CLONE_DETECTED':
        return `🚨 CYBERSECURITY ALERT: QR Clone Detected! Velocity ${velocity.toLocaleString()} km/h across ${distance.toLocaleString()} km — physically impossible. Produce is likely counterfeit.`;
      case 'SUSPICIOUS':
        return `⚠️ Suspicious scan pattern detected. Velocity ${velocity.toLocaleString()} km/h suggests possible air transport or QR sharing.`;
      default:
        return `✅ Spatial-Temporal Verified. Scan velocity ${velocity.toLocaleString()} km/h within normal range.`;
    }
  }

  static _formatTimeDelta(ms) {
    if (ms < 60000) return `${Math.round(ms / 1000)} seconds`;
    if (ms < 3600000) return `${Math.round(ms / 60000)} minutes`;
    return `${(ms / 3600000).toFixed(1)} hours`;
  }

  static _isHistorySuspicious(history) {
    if (history.length < 2) return false;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      const dist = this._haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
      const timeDelta = Math.abs(curr.timestamp - prev.timestamp) / 3600000;
      const velocity = timeDelta > 0 ? dist / timeDelta : 0;

      if (velocity >= VELOCITY_THRESHOLDS.SUSPICIOUS) return true;
    }
    return false;
  }

  static _getScans() {
    try {
      return JSON.parse(localStorage.getItem(SCAN_HISTORY_KEY) || '{}');
    } catch {
      return {};
    }
  }

  static _saveScans(scans) {
    try {
      localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(scans));
    } catch (e) {
      console.warn('Failed to save scan history:', e);
    }
  }
}
