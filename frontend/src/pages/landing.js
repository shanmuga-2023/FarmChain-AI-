// ============================================
// FarmChain AI — Landing Page
// The Trusted Ledger: Physical record of real goods moving from soil to plate
// ============================================

import { store } from '../data/store.js';
import { router } from '../utils/router.js';
import { blockchain } from '../blockchain/core.js';
import { i18n } from '../i18n/index.js';
import { formatCurrency } from '../utils/helpers.js';
import { fetchMandiRates } from '../utils/api.js';

// SVG Icon Library (inline, utilitarian, no emojis in buttons)
const ICONS = {
  chain: `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  signal: `<svg viewBox="0 0 24 24"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/></svg>`,
  shield: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></svg>`,
  scan: `<svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
  globe: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  wheat: `<svg viewBox="0 0 24 24"><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/></svg>`,
  store: `<svg viewBox="0 0 24 24"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>`,
  cart: `<svg viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  user: `<svg viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
};

// Demo crop datasets for live AI pricing simulator
const PRICING_DEMO_DATA = {
  mango: {
    name: 'Alphonso Mangoes',
    origin: 'Ratnagiri, Maharashtra',
    mspFloor: 45.00,
    qualityBonus: 5.50,
    qualityGrade: 'A+ (96% Brix Index)',
    demandBonus: 6.20,
    demandReason: 'High festival demand (+14%)',
    storageBonus: 1.80,
    total: 58.50,
    unit: 'kg',
    hash: '0x8f2a...4b19',
  },
  rice: {
    name: 'Sona Masoori Rice',
    origin: 'Kurnool, Andhra Pradesh',
    mspFloor: 23.00,
    qualityBonus: 2.50,
    qualityGrade: 'Export Grade (0% broken)',
    demandBonus: 2.80,
    demandReason: 'Steady buffer procurement',
    storageBonus: 1.20,
    total: 29.50,
    unit: 'kg',
    hash: '0x3c71...99e4',
  },
  onion: {
    name: 'Nashik Red Onions',
    origin: 'Nashik, Maharashtra',
    mspFloor: 18.00,
    qualityBonus: 1.80,
    qualityGrade: 'Standard 45-55mm uniform',
    demandBonus: 3.40,
    demandReason: 'Mandi arrival tightness (+18%)',
    storageBonus: 0.80,
    total: 24.00,
    unit: 'kg',
    hash: '0x1d92...87a2',
  },
  turmeric: {
    name: 'Salem Turmeric',
    origin: 'Salem, Tamil Nadu',
    mspFloor: 95.00,
    qualityBonus: 12.00,
    qualityGrade: 'High Curcumin (5.2% verified)',
    demandBonus: 14.50,
    demandReason: 'Pharma export quota active',
    storageBonus: 3.50,
    total: 125.00,
    unit: 'kg',
    hash: '0xaa40...16fd',
  },
};

// Hero Route SVG Illustration (Draws itself on load)
function renderHeroCustodyRoute() {
  return `
    <div class="custody-display-card">
      <div class="custody-card-header">
        <div>
          <div class="custody-crop-title">Alphonso Mangoes · Lot #RAT-924</div>
          <div class="custody-crop-meta">Ratnagiri Orchards → Bandra Gourmet Mart</div>
        </div>
        <div class="stamp-seal stamp-verified">
          ${ICONS.check} Verified Ledger
        </div>
      </div>

      <div class="custody-route-svg-wrap">
        <svg viewBox="0 0 460 100" width="100%" height="90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Background track -->
          <line x1="40" y1="45" x2="420" y2="45" stroke="rgba(43, 36, 26, 0.15)" stroke-width="2" stroke-dasharray="4 4"/>
          
          <!-- Animated route draw -->
          <line x1="40" y1="45" x2="420" y2="45" stroke="#2C4A3E" stroke-width="2.5" class="custody-route-line-active"/>

          <!-- Checkpoint 1: Farmer -->
          <g>
            <circle cx="40" cy="45" r="14" fill="#FAF6ED" stroke="#4A7C59" stroke-width="2"/>
            <circle cx="40" cy="45" r="6" fill="#4A7C59"/>
            <text x="40" y="78" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" font-weight="600" fill="#2B241A">Farm</text>
            <text x="40" y="90" text-anchor="middle" font-family="IBM Plex Mono" font-size="8.5" fill="#8A7E6B">Sep 1</text>
          </g>

          <!-- Checkpoint 2: APMC Intermediary -->
          <g>
            <circle cx="166" cy="45" r="14" fill="#FAF6ED" stroke="#B8963E" stroke-width="2"/>
            <circle cx="166" cy="45" r="6" fill="#B8963E"/>
            <text x="166" y="78" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" font-weight="600" fill="#2B241A">Mandi</text>
            <text x="166" y="90" text-anchor="middle" font-family="IBM Plex Mono" font-size="8.5" fill="#8A7E6B">Sep 2</text>
          </g>

          <!-- Checkpoint 3: Retailer -->
          <g>
            <circle cx="293" cy="45" r="14" fill="#FAF6ED" stroke="#8B5E3C" stroke-width="2"/>
            <circle cx="293" cy="45" r="6" fill="#8B5E3C"/>
            <text x="293" y="78" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" font-weight="600" fill="#2B241A">Store</text>
            <text x="293" y="90" text-anchor="middle" font-family="IBM Plex Mono" font-size="8.5" fill="#8A7E6B">Sep 4</text>
          </g>

          <!-- Checkpoint 4: Consumer Table -->
          <g>
            <circle cx="420" cy="45" r="14" fill="#FAF6ED" stroke="#6B5B7B" stroke-width="2"/>
            <circle cx="420" cy="45" r="6" fill="#6B5B7B"/>
            <text x="420" y="78" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" font-weight="600" fill="#2B241A">Consumer</text>
            <text x="420" y="90" text-anchor="middle" font-family="IBM Plex Mono" font-size="8.5" fill="#8A7E6B">Sep 5</text>
          </g>
        </svg>
      </div>

      <div class="custody-steps-grid">
        <div class="custody-step-box active">
          <div class="custody-step-stage">Stage 01</div>
          <div class="custody-step-actor">Harvest Logged</div>
          <div class="custody-step-time">24°C · Soil pH 6.4</div>
        </div>
        <div class="custody-step-box active">
          <div class="custody-step-stage">Stage 02</div>
          <div class="custody-step-actor">APMC Oracle</div>
          <div class="custody-step-time">Quality A+ Stamped</div>
        </div>
        <div class="custody-step-box active">
          <div class="custody-step-stage">Stage 03</div>
          <div class="custody-step-actor">Cold Logistics</div>
          <div class="custody-step-time">GPS Batch #4410</div>
        </div>
        <div class="custody-step-box active">
          <div class="custody-step-stage">Stage 04</div>
          <div class="custody-step-actor">QR Stamped</div>
          <div class="custody-step-time">Escrow Released</div>
        </div>
      </div>
    </div>
  `;
}

export function renderLanding(container) {
  const blockCount = blockchain.getBlockCount();
  const txCount = blockchain.getAllTransactions().length;
  const products = store.get('products') || [];
  const users = store.get('users') || {};
  const userCount = Object.keys(users).length;

  let activeProduceKey = 'mango';

  container.innerHTML = `
    <div class="landing-page">
      <!-- Navigation -->
      <nav class="landing-nav" id="landing-nav">
        <div class="container">
          <div class="logo" style="cursor: pointer;" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
            <div class="logo-icon">${ICONS.chain}</div>
            <span>FarmChain AI</span>
          </div>
          <ul class="nav-links">
            <li><a href="#how-it-works" class="smooth-scroll">How It Works</a></li>
            <li><a href="#demos-section" class="smooth-scroll">Interactive Demos</a></li>
            <li><a href="#mandi-section" class="smooth-scroll">Mandi Board</a></li>
            <li><a href="#roles" class="smooth-scroll">Select Role</a></li>
            <li>${i18n.renderLanguageSelector()}</li>
            <li><a href="#roles" class="nav-cta smooth-scroll">Enter Marketplace</a></li>
          </ul>
        </div>
      </nav>

      <!-- Hero — The Physical Ledger Headline -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="hero-badge-dot"></span>
              The Trusted Produce Ledger
            </div>
            <h1>
              Know exactly which farm your food came from.
            </h1>
            <p class="hero-subtitle">
              Alphonso Mangoes from Ratnagiri, verified across four custody stages, delivered to your table with tamper-proof blockchain proof and AI fair pricing.
            </p>
            <div class="hero-actions">
              <a href="#roles" class="btn btn-primary smooth-scroll">
                Enter Marketplace
              </a>
              <a href="#demos-section" class="btn btn-secondary smooth-scroll">
                Inspect Live Demos
              </a>
            </div>
          </div>
          <div class="hero-visual">
            ${renderHeroCustodyRoute()}
          </div>
        </div>
      </section>

      <!-- Stats Ticker — Physical Ledger Strip -->
      <section class="stats-ticker">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${blockCount}</div>
              <div class="stat-label">Blocks Recorded</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${txCount}</div>
              <div class="stat-label">Transactions Mined</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${products.length || 18}</div>
              <div class="stat-label">Produce Batches Traced</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${userCount || 24}</div>
              <div class="stat-label">Verified Stakeholders</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Demonstrators: AI Pricing & QR Traceability -->
      <section class="demos-section" id="demos-section">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">Interactive Engine</span>
            <h2>Two Verified Technologies. Demonstrated in Real Time.</h2>
            <p>Test the transparent AI pricing equation and unroll a complete farm-to-fork chain of custody.</p>
          </div>

          <div class="demos-grid">
            <!-- Demonstrator 1: AI Pricing Calculator -->
            <div class="demo-card" id="demo-pricing-card">
              <div class="demo-card-header">
                <div>
                  <h3>AI Fair Pricing Engine</h3>
                  <div style="font-size: var(--text-xs); color: var(--loam-faded);">Transparent on-chain formula benchmark</div>
                </div>
                <div class="stamp-seal" id="pricing-stamp-status">
                  ${ICONS.lock} Price Locked
                </div>
              </div>

              <div class="demo-selector-row">
                <button class="demo-pill-btn active" data-crop="mango">Alphonso Mango</button>
                <button class="demo-pill-btn" data-crop="rice">Sona Masoori</button>
                <button class="demo-pill-btn" data-crop="onion">Nashik Onion</button>
                <button class="demo-pill-btn" data-crop="turmeric">Salem Turmeric</button>
              </div>

              <div class="pricing-equation" id="pricing-equation-box">
                <!-- Dynamically rendered by updatePricingDemo -->
              </div>

              <div style="display: flex; gap: 10px; align-items: center; margin-top: auto;">
                <button class="btn btn-primary btn-sm" id="btn-lock-price">
                  Lock Price on Smart Contract
                </button>
                <span class="stamp-hash" id="demo-lock-hash">Tx: 0x8f2a...4b19</span>
              </div>
            </div>

            <!-- Demonstrator 2: QR Trace Simulator -->
            <div class="demo-card" id="demo-trace-card">
              <div class="demo-card-header">
                <div>
                  <h3>QR Traceability Simulator</h3>
                  <div style="font-size: var(--text-xs); color: var(--loam-faded);">Physical custody record unrolled from QR scan</div>
                </div>
                <div class="stamp-seal stamp-verified">
                  ${ICONS.scan} Tamper-Proof
                </div>
              </div>

              <div style="background: var(--parchment-warm); padding: 14px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-hairline); display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; font-size: var(--text-sm); color: var(--loam);">Lot #RAT-8841 · 1,200 kg</div>
                  <div style="font-size: var(--text-xs); color: var(--loam-faded); font-family: var(--font-mono);">Ratnagiri Alphonso · Organic Certified</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-simulate-scan">
                  Scan QR Stamp
                </button>
              </div>

              <div class="trace-timeline-list" id="trace-timeline-container">
                <div class="trace-item">
                  <div>
                    <div class="trace-item-role">Farmer · Ratnagiri Groves</div>
                    <div class="trace-item-title">Harvested & Moisture Logged</div>
                    <div class="trace-item-meta">Sep 1, 07:30 IST | 24°C, 65% Humidity | Sensor ID #SN-441</div>
                  </div>
                </div>
                <div class="trace-item">
                  <div>
                    <div class="trace-item-role">Intermediary · Pune APMC Hub</div>
                    <div class="trace-item-title">Quality Oracle Verified Grade A+</div>
                    <div class="trace-item-meta">Sep 2, 11:15 IST | Purity 96% | Escrow 60% locked</div>
                  </div>
                </div>
                <div class="trace-item">
                  <div>
                    <div class="trace-item-role">Retailer · Bandra Gourmet Mart</div>
                    <div class="trace-item-title">Batch QR Code Stamped on Carton</div>
                    <div class="trace-item-meta">Sep 4, 16:40 IST | Shelf Unit #B12 | Hash: 0x9e12...55ad</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works: Chain-of-Custody 4 Stages -->
      <section class="how-it-works" id="how-it-works">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">Chain of Custody</span>
            <h2>Four Handlers. One Indelible Ledger.</h2>
            <p>Every transaction from harvest to checkout is immutably sealed on-chain.</p>
          </div>

          <div class="steps-container">
            <div class="step-row">
              <div class="step-content">
                <h3>01. Harvest & Fair Price Lock</h3>
                <p>The farmer logs the harvest weight and batch data. The AI Oracle calculates a transparent price floor based on MSP guidelines, moisture readings, and real-time APMC arrivals.</p>
              </div>
              <div class="step-marker">
                <div class="step-number">01</div>
              </div>
              <div class="step-icon-area">
                ${ICONS.wheat}
              </div>
            </div>

            <div class="step-row">
              <div class="step-icon-area">
                ${ICONS.store}
              </div>
              <div class="step-marker">
                <div class="step-number">02</div>
              </div>
              <div class="step-content">
                <h3>02. Mandi Verification & Batch Merge</h3>
                <p>Intermediaries aggregate individual farmer lots into standardized transport batches while preserving original grower attribution and farm soil metrics on the ledger.</p>
              </div>
            </div>

            <div class="step-row">
              <div class="step-content">
                <h3>03. Retail Receipt & QR Stamping</h3>
                <p>Retailers verify shipment temperature logs at delivery. Each retail pack is stamped with an immutable QR code linked directly to the parent batch block hash.</p>
              </div>
              <div class="step-marker">
                <div class="step-number">03</div>
              </div>
              <div class="step-icon-area">
                ${ICONS.scan}
              </div>
            </div>

            <div class="step-row">
              <div class="step-icon-area">
                ${ICONS.shield}
              </div>
              <div class="step-marker">
                <div class="step-number">04</div>
              </div>
              <div class="step-content">
                <h3>04. Consumer Scan & Instant Escrow</h3>
                <p>Consumers scan the packaging QR code to reveal the entire journey. Checkout triggers the smart contract escrow to immediately release fair payouts to all handlers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Live Mandi Rates Board -->
      <section class="mandi-section" id="mandi-section">
        <div class="container">
          <div class="mandi-header">
            <div class="mandi-header-left">
              ${ICONS.signal}
              <div>
                <h3>APMC & eNAM Live Market Board</h3>
                <p>Real-time oracle spot rates benchmarked across government mandis</p>
              </div>
            </div>
            <span class="stamp-seal stamp-verified" id="oracle-status-badge">Connected Oracle</span>
          </div>

          <div class="mandi-ticker-wrap">
            <div class="mandi-ticker animate" id="mandi-cards-container">
              <div class="mandi-card">
                <div class="mandi-card-crop">Rice — Punjab APMC</div>
                <div class="mandi-card-price">₹2,450 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ ₹24.50/kg · High demand</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Red Onion — Nashik</div>
                <div class="mandi-card-price">₹2,100 <span>/ quintal</span></div>
                <div class="mandi-card-trend steady">→ ₹21.00/kg · Steady arrival</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Sharbati Wheat — Sehore</div>
                <div class="mandi-card-price">₹2,380 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ ₹23.80/kg · Consistent</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Turmeric — Erode APMC</div>
                <div class="mandi-card-price">₹10,800 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ ₹108.00/kg · Export surge</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Alphonso — Ratnagiri</div>
                <div class="mandi-card-price">₹4,500 <span>/ crate</span></div>
                <div class="mandi-card-trend up">↑ ₹450/doz · Prime harvest</div>
              </div>
              <!-- Loop duplicates -->
              <div class="mandi-card">
                <div class="mandi-card-crop">Rice — Punjab APMC</div>
                <div class="mandi-card-price">₹2,450 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ ₹24.50/kg · High demand</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Red Onion — Nashik</div>
                <div class="mandi-card-price">₹2,100 <span>/ quintal</span></div>
                <div class="mandi-card-trend steady">→ ₹21.00/kg · Steady arrival</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Sharbati Wheat — Sehore</div>
                <div class="mandi-card-price">₹2,380 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ ₹23.80/kg · Consistent</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Turmeric — Erode APMC</div>
                <div class="mandi-card-price">₹10,800 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ ₹108.00/kg · Export surge</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Alphonso — Ratnagiri</div>
                <div class="mandi-card-price">₹4,500 <span>/ crate</span></div>
                <div class="mandi-card-trend up">↑ ₹450/doz · Prime harvest</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Role Selection: 4 Distinct Color Cards -->
      <section class="roles-section" id="roles">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">Stakeholder Access</span>
            <h2>Select Your Portal</h2>
            <p>Enter the ecosystem through your designated role interface.</p>
          </div>

          <div class="roles-grid-four">
            <!-- Role 1: Farmer (Crop Green) -->
            <div class="role-distinct-card role-farmer-theme" id="role-farmer">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">Producer</span>
                  <div class="role-icon-box" style="background: var(--role-farmer-bg); color: var(--role-farmer);">
                    ${ICONS.wheat}
                  </div>
                </div>
                <h3>Farmer</h3>
                <p>List harvests, verify quality tests with AI vision, and lock fair pricing backed by smart escrow.</p>
              </div>
              <button class="btn">Enter as Farmer</button>
            </div>

            <!-- Role 2: Intermediary (Grain Gold) -->
            <div class="role-distinct-card role-intermediary-theme" id="role-intermediary">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">Aggregator</span>
                  <div class="role-icon-box" style="background: var(--role-intermediary-bg); color: var(--role-intermediary);">
                    ${ICONS.store}
                  </div>
                </div>
                <h3>Intermediary</h3>
                <p>Source lots from verified farms, merge into batches, and forward with uninterrupted custody.</p>
              </div>
              <button class="btn">Enter as Intermediary</button>
            </div>

            <!-- Role 3: Retailer (Market Clay) -->
            <div class="role-distinct-card role-retailer-theme" id="role-retailer">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">Storefront</span>
                  <div class="role-icon-box" style="background: var(--role-retailer-bg); color: var(--role-retailer);">
                    ${ICONS.cart}
                  </div>
                </div>
                <h3>Retailer</h3>
                <p>Receive shipments, inspect cold-chain proofs, stamp retail QR codes, and stock verified produce.</p>
              </div>
              <button class="btn">Enter as Retailer</button>
            </div>

            <!-- Role 4: Consumer (Table Plum) -->
            <div class="role-distinct-card role-consumer-theme" id="role-consumer">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">Consumer</span>
                  <div class="role-icon-box" style="background: var(--role-consumer-bg); color: var(--role-consumer);">
                    ${ICONS.user}
                  </div>
                </div>
                <h3>Consumer</h3>
                <p>Scan packaging QR codes, inspect the physical origin story, and buy direct with guaranteed authenticity.</p>
              </div>
              <button class="btn">Enter as Consumer</button>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="javascript:void(0)" id="role-admin" style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--loam-faded); text-decoration: underline;">
              Platform Inspector & Oracle Admin Access
            </a>
          </div>
        </div>
      </section>

      <!-- Footer: Physical Ledger Format -->
      <footer class="landing-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div class="logo">
                <div class="logo-icon">${ICONS.chain}</div>
                <span>FarmChain AI</span>
              </div>
              <p>Physical agricultural ledger powered by EVM smart contracts, APMC mandi oracles, and tamper-proof QR custody.</p>
            </div>
            <div class="footer-col">
              <h4>Ledger Features</h4>
              <ul>
                <li><a href="#how-it-works" class="smooth-scroll">Chain of Custody</a></li>
                <li><a href="#demos-section" class="smooth-scroll">AI Pricing Formula</a></li>
                <li><a href="#mandi-section" class="smooth-scroll">APMC Mandi Board</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Architecture</h4>
              <ul>
                <li><a href="#demos-section" class="smooth-scroll">Escrow Contracts</a></li>
                <li><a href="#demos-section" class="smooth-scroll">Clone Detection</a></li>
                <li><a href="#roles" class="smooth-scroll">Role Portals</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>FarmChain AI — Transparent Soil-to-Plate Custody</p>
            <p>Solid Proofs · Fair Pricing · QR Verification</p>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Function to render AI Pricing Equation
  function updatePricingDemo(key) {
    const data = PRICING_DEMO_DATA[key];
    if (!data) return;

    const box = container.querySelector('#pricing-equation-box');
    if (!box) return;

    box.innerHTML = `
      <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-family: var(--font-heading); font-size: 1rem; font-weight: 700; color: var(--loam);">${data.name}</span>
        <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--loam-faded);">${data.origin}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">MSP Government Floor</span>
        <span class="equation-val">₹${data.mspFloor.toFixed(2)} / ${data.unit}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">AI Quality Bonus (${data.qualityGrade})</span>
        <span class="equation-val plus">+₹${data.qualityBonus.toFixed(2)}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">Regional Demand Factor (${data.demandReason})</span>
        <span class="equation-val plus">+₹${data.demandBonus.toFixed(2)}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">Moisture & Storage Index</span>
        <span class="equation-val plus">+₹${data.storageBonus.toFixed(2)}</span>
      </div>
      <div class="equation-total-row">
        <span class="equation-total-label">Locked Transparent Price</span>
        <span class="equation-total-price">₹${data.total.toFixed(2)} <span style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--loam-faded);">/ ${data.unit}</span></span>
      </div>
    `;

    const hashSpan = container.querySelector('#demo-lock-hash');
    if (hashSpan) {
      hashSpan.textContent = `Tx: ${data.hash}`;
    }
  }

  // Initialize first pricing demo
  updatePricingDemo(activeProduceKey);

  // Pill click handlers
  container.querySelectorAll('.demo-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.demo-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeProduceKey = btn.dataset.crop;
      updatePricingDemo(activeProduceKey);
    });
  });

  // Lock price button interaction
  const lockBtn = container.querySelector('#btn-lock-price');
  lockBtn?.addEventListener('click', () => {
    lockBtn.innerHTML = `Stamped ✓`;
    lockBtn.classList.add('is-success');
    const stampStatus = container.querySelector('#pricing-stamp-status');
    if (stampStatus) {
      stampStatus.classList.add('stamp-verified');
      stampStatus.innerHTML = `✓ Block Sealed`;
    }
    setTimeout(() => {
      lockBtn.innerHTML = `Lock Price on Smart Contract`;
      lockBtn.classList.remove('is-success');
    }, 2500);
  });

  // Simulate scan button interaction
  const scanBtn = container.querySelector('#btn-simulate-scan');
  scanBtn?.addEventListener('click', () => {
    scanBtn.innerHTML = `Verifying...`;
    scanBtn.classList.add('is-loading');

    setTimeout(() => {
      scanBtn.classList.remove('is-loading');
      scanBtn.innerHTML = `✓ Authenticated`;
      scanBtn.classList.add('btn-primary');
      scanBtn.classList.remove('btn-secondary');

      const timeline = container.querySelector('#trace-timeline-container');
      if (timeline) {
        timeline.insertAdjacentHTML('beforeend', `
          <div class="trace-item" style="border-left-color: var(--semantic-success); animation: fadeIn 0.4s var(--ease-out);">
            <div>
              <div class="trace-item-role" style="color: var(--semantic-success);">Consumer Verification Stamp ✓</div>
              <div class="trace-item-title">Produce Authenticated via Mobile Scan</div>
              <div class="trace-item-meta">Just now | Clean Chain Proof | Zero Counterfeits Detected</div>
            </div>
          </div>
        `);
      }
    }, 700);
  });

  // Smooth scroll handler
  container.querySelectorAll('.smooth-scroll, a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href')?.replace('#', '');
      if (targetId) {
        e.preventDefault();
        const targetElement = container.querySelector(`#${targetId}`) || document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Language switcher handler
  container.querySelector('#lang-selector')?.addEventListener('change', (e) => {
    i18n.setLanguage(e.target.value);
    renderLanding(container);
  });

  // Fetch live Mandi rates from backend API
  fetchMandiRates().then(rates => {
    if (!rates) return;
    const cardsContainer = container.querySelector('#mandi-cards-container');
    if (!cardsContainer) return;

    const cropEntries = Object.entries(rates);
    if (cropEntries.length > 0) {
      const cardsHtml = cropEntries.map(([cropName, data]) => {
        const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';
        const trendClass = data.trend === 'up' ? 'up' : data.trend === 'down' ? 'down' : 'steady';

        return `
          <div class="mandi-card">
            <div class="mandi-card-crop">${cropName} — ${data.mandi || 'APMC Market'}</div>
            <div class="mandi-card-price">₹${data.pricePerQuintal || (data.pricePerKg * 100)} <span>/ quintal</span></div>
            <div class="mandi-card-trend ${trendClass}">${trendIcon} ₹${data.pricePerKg}/kg · ${data.status || 'Live Spot'}</div>
          </div>
        `;
      }).join('');
      // Duplicate for seamless ticker loop
      cardsContainer.innerHTML = cardsHtml + cardsHtml;
    }
  });

  // Role selection handlers
  const roleMap = {
    'role-farmer': 'farmer',
    'role-intermediary': 'intermediary',
    'role-retailer': 'retailer',
    'role-consumer': 'consumer',
    'role-admin': 'admin',
  };

  for (const [id, role] of Object.entries(roleMap)) {
    container.querySelector(`#${id}`)?.addEventListener('click', () => {
      router.navigate(`/login?role=${role}`);
    });
  }

  // Navbar scroll effect
  const nav = container.querySelector('#landing-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  });

  // Pause ticker on hover
  const ticker = container.querySelector('.mandi-ticker');
  const tickerWrap = container.querySelector('.mandi-ticker-wrap');
  if (tickerWrap && ticker) {
    tickerWrap.addEventListener('mouseenter', () => ticker.classList.remove('animate'));
    tickerWrap.addEventListener('mouseleave', () => ticker.classList.add('animate'));
  }
}
