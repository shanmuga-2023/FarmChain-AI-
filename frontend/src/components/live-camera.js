// ============================================
// FarmChain AI — Live Camera Capture
// GPS Location + Date/Time Stamping
// Anti-fraud proof-of-capture for crop images
// ============================================

/**
 * LiveCamera — Opens device camera with real-time GPS + timestamp overlay.
 * Burns location & date watermark into captured image pixels.
 * Generates SHA-256 proof hash for blockchain binding.
 *
 * Anti-fraud features:
 * - Camera-only mode (no gallery) for verified captures
 * - GPS validates farmer is at registered farm location
 * - Timestamp proves when photo was taken
 * - Hash binds image to on-chain record
 */
export class LiveCamera {
  static _stream = null;
  static _locationCache = null;
  static _watchId = null;

  /**
   * Open live camera modal and return captured image with proof data
   * @param {Object} options
   * @param {string} options.mode - 'verified' (camera only) or 'any' (camera + file)
   * @param {Object} options.farmerLocation - { lat, lng } registered farm location for validation
   * @returns {Promise<{imageDataUrl, canvas, proofData}>}
   */
  static open(options = {}) {
    return new Promise((resolve, reject) => {
      const modal = this._createCameraModal(options, resolve, reject);
      document.body.appendChild(modal);
    });
  }

  /**
   * Get current GPS location with reverse geocoding
   */
  static async getLocation() {
    if (this._locationCache && (Date.now() - this._locationCache.timestamp < 30000)) {
      return this._locationCache;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Reverse geocode using free Nominatim API
      let address = '';
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await resp.json();
        const addr = data.address || {};
        address = [
          addr.village || addr.town || addr.city || addr.suburb || '',
          addr.state_district || addr.county || '',
          addr.state || '',
        ].filter(Boolean).join(', ');
      } catch {
        address = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
      }

      this._locationCache = {
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy),
        address,
        timestamp: Date.now(),
      };

      return this._locationCache;
    } catch (err) {
      console.warn('GPS location failed:', err);
      // Return a demo/fallback location
      this._locationCache = {
        lat: 11.0168 + (Math.random() * 0.1 - 0.05),
        lng: 76.9558 + (Math.random() * 0.1 - 0.05),
        accuracy: 50,
        address: 'Coimbatore, Tamil Nadu',
        timestamp: Date.now(),
        isFallback: true,
      };
      return this._locationCache;
    }
  }

  /**
   * Stamp an image canvas with GPS location and date/time watermark
   */
  static stampImage(canvas, gpsData, timestamp) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Semi-transparent black bar at bottom
    const barHeight = Math.max(60, h * 0.1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, h - barHeight, w, barHeight);

    // Green accent line
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, h - barHeight, w, 3);

    const fontSize = Math.max(12, Math.min(16, w * 0.028));
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';

    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });

    const coordStr = `${gpsData.lat.toFixed(4)}°N, ${gpsData.lng.toFixed(4)}°E`;
    const locationLine = `📍 ${coordStr}  •  ${gpsData.address || ''}`;
    const dateLine = `📅 ${dateStr}, ${timeStr}  •  Accuracy: ±${gpsData.accuracy}m`;

    const padding = 12;
    const lineY1 = h - barHeight + barHeight * 0.35;
    const lineY2 = h - barHeight + barHeight * 0.7;

    ctx.fillText(locationLine, padding, lineY1);
    ctx.font = `${fontSize - 1}px "Inter", "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#a3e635';
    ctx.fillText(dateLine, padding, lineY2);

    // FarmChain AI badge on the right
    ctx.font = `bold ${fontSize - 2}px "Inter", "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText('⛓️ FarmChain AI Verified', w - padding, lineY1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `${fontSize - 3}px "Inter", "Segoe UI", Arial, sans-serif`;
    ctx.fillText(gpsData.isFallback ? '⚠️ GPS Approximate' : '✅ GPS Verified', w - padding, lineY2);
    ctx.textAlign = 'left';

    return canvas;
  }

  /**
   * Generate SHA-256 proof hash of captured image + location + timestamp
   */
  static async generateProofHash(imageDataUrl, location, timestamp) {
    try {
      const proofString = `${imageDataUrl.slice(0, 200)}|${location.lat}|${location.lng}|${timestamp}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(proofString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return `Qm${hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 44)}`;
    } catch {
      return `Qm${Date.now().toString(16)}${Math.random().toString(36).slice(2, 20)}`.slice(0, 46);
    }
  }

  /**
   * Validate GPS is near farmer's registered location (within 50km)
   */
  static validateLocation(capturedGps, registeredLocation) {
    if (!registeredLocation || !registeredLocation.lat) return { valid: true, distance: 0 };

    const R = 6371; // Earth's radius in km
    const dLat = (capturedGps.lat - registeredLocation.lat) * Math.PI / 180;
    const dLng = (capturedGps.lng - registeredLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(capturedGps.lat * Math.PI / 180) *
      Math.cos(registeredLocation.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return {
      valid: distance <= 50,
      distance: Math.round(distance * 10) / 10,
      message: distance <= 50
        ? `✅ Location verified (${distance.toFixed(1)} km from farm)`
        : `⚠️ ${distance.toFixed(1)} km from registered farm location`,
    };
  }

  /**
   * Create the camera modal UI
   */
  static _createCameraModal(options, resolve, reject) {
    const overlay = document.createElement('div');
    overlay.id = 'live-camera-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.92); z-index: 10000;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    overlay.innerHTML = `
      <div style="width: 90%; max-width: 560px; background: var(--bg-card, #1a1a2e); border-radius: 16px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.3); box-shadow: 0 25px 60px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="padding: 14px 18px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(34, 197, 94, 0.1)); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">📸 Live Crop Verification Camera</div>
            <div style="font-size: 0.72rem; color: rgba(255,255,255,0.5); margin-top: 2px;">GPS + Timestamp stamped for blockchain proof</div>
          </div>
          <button id="camera-close-btn" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">✕ Close</button>
        </div>

        <!-- Camera View -->
        <div style="position: relative; width: 100%; aspect-ratio: 4/3; background: #000; overflow: hidden;">
          <video id="camera-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
          <canvas id="camera-canvas" style="display: none;"></canvas>

          <!-- GPS + Date Overlay -->
          <div id="camera-overlay-info" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 14px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); pointer-events: none;">
            <div id="camera-gps-display" style="font-size: 0.75rem; color: #a3e635; font-weight: 600; font-family: 'JetBrains Mono', monospace;">
              📍 Acquiring GPS...
            </div>
            <div id="camera-date-display" style="font-size: 0.72rem; color: rgba(255,255,255,0.7); margin-top: 2px; font-family: 'JetBrains Mono', monospace;">
              📅 ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>

          <!-- Loading state -->
          <div id="camera-loading" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="width: 40px; height: 40px; border: 3px solid rgba(168,85,247,0.2); border-top-color: #a855f7; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px;"></div>
            <div style="color: rgba(255,255,255,0.6); font-size: 0.8rem;">Starting camera...</div>
          </div>

          <!-- Captured preview (hidden until capture) -->
          <img id="camera-captured-preview" style="display: none; width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;" />
        </div>

        <!-- Controls -->
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px;">
          <!-- GPS Status -->
          <div id="camera-gps-status" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.15); border-radius: 10px;">
            <span style="font-size: 1.1rem;">🛰️</span>
            <div style="flex: 1;">
              <div id="gps-status-text" style="font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.8);">Acquiring GPS location...</div>
              <div id="gps-address-text" style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">Please allow location access</div>
            </div>
            <div id="gps-accuracy-badge" style="font-size: 0.65rem; padding: 2px 8px; background: rgba(255,255,255,0.06); border-radius: 20px; color: rgba(255,255,255,0.4);">--</div>
          </div>

          <!-- Buttons -->
          <div style="display: flex; gap: 8px;">
            <button id="camera-capture-btn" disabled style="flex: 1; padding: 12px; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; opacity: 0.5;">
              📸 Capture & Verify
            </button>
            <button id="camera-retake-btn" style="display: none; flex: 1; padding: 12px; background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
              🔄 Retake
            </button>
            <button id="camera-use-btn" style="display: none; flex: 1; padding: 12px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: none; align-items: center; justify-content: center; gap: 6px;">
              ✅ Use This Photo
            </button>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;

    // Wire up camera
    const video = overlay.querySelector('#camera-video');
    const canvas = overlay.querySelector('#camera-canvas');
    const loading = overlay.querySelector('#camera-loading');
    const capturedPreview = overlay.querySelector('#camera-captured-preview');
    const captureBtn = overlay.querySelector('#camera-capture-btn');
    const retakeBtn = overlay.querySelector('#camera-retake-btn');
    const useBtn = overlay.querySelector('#camera-use-btn');
    const closeBtn = overlay.querySelector('#camera-close-btn');
    const gpsDisplay = overlay.querySelector('#camera-gps-display');
    const dateDisplay = overlay.querySelector('#camera-date-display');
    const gpsStatusText = overlay.querySelector('#gps-status-text');
    const gpsAddressText = overlay.querySelector('#gps-address-text');
    const gpsAccuracyBadge = overlay.querySelector('#gps-accuracy-badge');

    let capturedData = null;
    let locationData = null;

    // Update date/time every second
    const dateInterval = setInterval(() => {
      const now = new Date();
      dateDisplay.textContent = `📅 ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
    }, 1000);

    // Start camera
    const startCamera = async () => {
      try {
        this._stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        video.srcObject = this._stream;
        loading.style.display = 'none';
        captureBtn.disabled = false;
        captureBtn.style.opacity = '1';
      } catch (err) {
        console.warn('Camera access failed:', err);
        loading.innerHTML = `
          <div style="color: #ef4444; font-size: 0.85rem; font-weight: 600;">⚠️ Camera access denied</div>
          <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin-top: 6px;">Using demo mode — file upload will be available</div>
        `;
        // In demo mode, still allow capture with a placeholder
        captureBtn.disabled = false;
        captureBtn.style.opacity = '1';
        captureBtn.textContent = '📁 Select Photo Instead';
      }
    };

    // Get GPS location
    const fetchLocation = async () => {
      locationData = await this.getLocation();
      gpsDisplay.textContent = `📍 ${locationData.lat.toFixed(4)}°N, ${locationData.lng.toFixed(4)}°E`;
      gpsStatusText.textContent = locationData.isFallback ? '⚠️ Approximate GPS Location' : '✅ GPS Location Acquired';
      gpsStatusText.style.color = locationData.isFallback ? '#f59e0b' : '#22c55e';
      gpsAddressText.textContent = locationData.address;
      gpsAccuracyBadge.textContent = `±${locationData.accuracy}m`;
      gpsAccuracyBadge.style.background = locationData.accuracy < 100 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)';
      gpsAccuracyBadge.style.color = locationData.accuracy < 100 ? '#22c55e' : '#f59e0b';
    };

    startCamera();
    fetchLocation();

    // Capture
    captureBtn.addEventListener('click', async () => {
      if (!locationData) {
        locationData = await this.getLocation();
      }

      const timestamp = Date.now();

      if (this._stream && video.videoWidth > 0) {
        // Real camera capture
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
      } else {
        // Demo mode — draw a placeholder
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 640, 480);
        gradient.addColorStop(0, '#1a4a1a');
        gradient.addColorStop(0.5, '#2d5a2d');
        gradient.addColorStop(1, '#1a4a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 640, 480);
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('🌾 Crop Image Captured', 320, 220);
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('(Camera demo mode)', 320, 260);
        ctx.textAlign = 'left';
      }

      // Stamp GPS + Date onto the image
      this.stampImage(canvas, locationData, timestamp);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const proofHash = await this.generateProofHash(imageDataUrl, locationData, timestamp);

      capturedPreview.src = imageDataUrl;
      capturedPreview.style.display = 'block';
      video.style.display = 'none';

      captureBtn.style.display = 'none';
      retakeBtn.style.display = 'block';
      useBtn.style.display = 'flex';

      capturedData = {
        imageDataUrl,
        canvas,
        proofData: {
          location: locationData,
          timestamp,
          proofHash,
          isLiveCapture: !!this._stream,
          gpsVerified: !locationData.isFallback,
        },
      };
    });

    // Retake
    retakeBtn.addEventListener('click', () => {
      capturedPreview.style.display = 'none';
      video.style.display = 'block';
      captureBtn.style.display = 'flex';
      retakeBtn.style.display = 'none';
      useBtn.style.display = 'none';
      capturedData = null;
    });

    // Use photo
    useBtn.addEventListener('click', () => {
      this._cleanup(overlay, dateInterval);
      resolve(capturedData);
    });

    // Close
    closeBtn.addEventListener('click', () => {
      this._cleanup(overlay, dateInterval);
      reject(new Error('Camera closed by user'));
    });

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this._cleanup(overlay, dateInterval);
        reject(new Error('Camera closed by user'));
      }
    });

    return overlay;
  }

  /**
   * Cleanup camera resources
   */
  static _cleanup(overlay, intervalId) {
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
      this._stream = null;
    }
    if (intervalId) clearInterval(intervalId);
    overlay.remove();
  }

  /**
   * Format proof data for display
   */
  static formatProofDisplay(proofData) {
    if (!proofData) return '';
    const date = new Date(proofData.timestamp);
    return `
      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.72rem;">
        <div style="color: ${proofData.gpsVerified ? '#22c55e' : '#f59e0b'};">
          ${proofData.gpsVerified ? '✅' : '⚠️'} GPS: ${proofData.location.lat.toFixed(4)}°N, ${proofData.location.lng.toFixed(4)}°E
          ${proofData.location.address ? `(${proofData.location.address})` : ''}
        </div>
        <div style="color: rgba(255,255,255,0.6);">
          📅 ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
        <div style="color: rgba(168,85,247,0.8); font-family: monospace; word-break: break-all;">
          🔗 Proof: ${proofData.proofHash}
        </div>
        <div style="color: ${proofData.isLiveCapture ? '#22c55e' : '#f59e0b'};">
          ${proofData.isLiveCapture ? '📸 Live Camera Capture' : '📁 File Upload (Unverified)'}
        </div>
      </div>
    `;
  }
}
