// ============================================
// FarmChain AI — Landing Page
// The Trusted Ledger: Physical record of real goods moving from soil to plate
// ============================================

import { store } from '../data/store.js';
import { router } from '../utils/router.js';
import { blockchain } from '../blockchain/core.js';
import { i18n } from '../i18n/index.js';
import { formatCurrency, formatNumber, localizeCropName, localizeLocation, localizeUnit } from '../utils/helpers.js';
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
const getPricingDemoData = () => ({
  mango: {
    cropKey: 'crops.mango',
    originKey: 'locations.ratnagiri',
    mspFloor: 45.00,
    qualityBonus: 5.50,
    qualityGrade: 'A+ (96% Brix Index)',
    demandBonus: 6.20,
    demandReasonKey: 'landing.pricing.demandReasonMango',
    storageBonus: 1.80,
    total: 58.50,
    unit: 'kg',
    hash: '0x8f2a...4b19',
  },
  rice: {
    cropKey: 'crops.rice',
    originKey: 'locations.kurnool',
    mspFloor: 23.00,
    qualityBonus: 2.50,
    qualityGrade: 'Export Grade (0% broken)',
    demandBonus: 2.80,
    demandReasonKey: 'landing.pricing.demandReasonRice',
    storageBonus: 1.20,
    total: 29.50,
    unit: 'kg',
    hash: '0x3c71...99e4',
  },
  onion: {
    cropKey: 'crops.onion',
    originKey: 'locations.nashik',
    mspFloor: 18.00,
    qualityBonus: 1.80,
    qualityGrade: 'Standard 45-55mm uniform',
    demandBonus: 3.40,
    demandReasonKey: 'landing.pricing.demandReasonOnion',
    storageBonus: 0.80,
    total: 24.00,
    unit: 'kg',
    hash: '0x1d92...87a2',
  },
  turmeric: {
    cropKey: 'crops.turmeric',
    originKey: 'locations.salem',
    mspFloor: 95.00,
    qualityBonus: 12.00,
    qualityGrade: 'High Curcumin (5.2% verified)',
    demandBonus: 14.50,
    demandReasonKey: 'landing.pricing.demandReasonTurmeric',
    storageBonus: 3.50,
    total: 125.00,
    unit: 'kg',
    hash: '0xaa40...16fd',
  },
});

// Hero Route SVG Illustration (Draws itself on load)
function renderHeroCustodyRoute() {
  return `
    <div class="custody-display-card">
      <div class="custody-card-header">
        <div>
          <div class="custody-crop-title">${i18n.t('landing.custody.cropTitle')}</div>
          <div class="custody-crop-meta">${i18n.t('landing.custody.cropMeta')}</div>
        </div>
        <div class="stamp-seal stamp-verified">
          ${ICONS.check} ${i18n.t('landing.custody.verifiedLedger')}
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
            <text x="40" y="78" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="10" font-weight="600" fill="#2B241A">${i18n.t('landing.custody.farm')}</text>
            <text x="40" y="90" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="8.5" fill="#8A7E6B">${i18n.t('landing.custody.sep1')}</text>
          </g>

          <!-- Checkpoint 2: APMC Intermediary -->
          <g>
            <circle cx="166" cy="45" r="14" fill="#FAF6ED" stroke="#B8963E" stroke-width="2"/>
            <circle cx="166" cy="45" r="6" fill="#B8963E"/>
            <text x="166" y="78" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="10" font-weight="600" fill="#2B241A">${i18n.t('landing.custody.mandi')}</text>
            <text x="166" y="90" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="8.5" fill="#8A7E6B">${i18n.t('landing.custody.sep2')}</text>
          </g>

          <!-- Checkpoint 3: Retailer -->
          <g>
            <circle cx="293" cy="45" r="14" fill="#FAF6ED" stroke="#8B5E3C" stroke-width="2"/>
            <circle cx="293" cy="45" r="6" fill="#8B5E3C"/>
            <text x="293" y="78" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="10" font-weight="600" fill="#2B241A">${i18n.t('landing.custody.store')}</text>
            <text x="293" y="90" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="8.5" fill="#8A7E6B">${i18n.t('landing.custody.sep4')}</text>
          </g>

          <!-- Checkpoint 4: Consumer Table -->
          <g>
            <circle cx="420" cy="45" r="14" fill="#FAF6ED" stroke="#6B5B7B" stroke-width="2"/>
            <circle cx="420" cy="45" r="6" fill="#6B5B7B"/>
            <text x="420" y="78" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="10" font-weight="600" fill="#2B241A">${i18n.t('landing.custody.consumer')}</text>
            <text x="420" y="90" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif" font-size="8.5" fill="#8A7E6B">${i18n.t('landing.custody.sep5')}</text>
          </g>
        </svg>
      </div>

      <div class="custody-steps-grid">
        <div class="custody-step-box active">
          <div class="custody-step-stage">${i18n.t('landing.custody.stage1')}</div>
          <div class="custody-step-actor">${i18n.t('landing.custody.stage1Title')}</div>
          <div class="custody-step-time">${i18n.t('landing.custody.stage1Desc')}</div>
        </div>
        <div class="custody-step-box active">
          <div class="custody-step-stage">${i18n.t('landing.custody.stage2')}</div>
          <div class="custody-step-actor">${i18n.t('landing.custody.stage2Title')}</div>
          <div class="custody-step-time">${i18n.t('landing.custody.stage2Desc')}</div>
        </div>
        <div class="custody-step-box active">
          <div class="custody-step-stage">${i18n.t('landing.custody.stage3')}</div>
          <div class="custody-step-actor">${i18n.t('landing.custody.stage3Title')}</div>
          <div class="custody-step-time">${i18n.t('landing.custody.stage3Desc')}</div>
        </div>
        <div class="custody-step-box active">
          <div class="custody-step-stage">${i18n.t('landing.custody.stage4')}</div>
          <div class="custody-step-actor">${i18n.t('landing.custody.stage4Title')}</div>
          <div class="custody-step-time">${i18n.t('landing.custody.stage4Desc')}</div>
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
            <li><a href="#how-it-works" class="smooth-scroll">${i18n.t('landing.nav.howItWorks')}</a></li>
            <li><a href="#demos-section" class="smooth-scroll">${i18n.t('landing.nav.demos')}</a></li>
            <li><a href="#mandi-section" class="smooth-scroll">${i18n.t('landing.nav.mandi')}</a></li>
            <li><a href="#roles" class="smooth-scroll">${i18n.t('landing.nav.roles')}</a></li>
            <li>${i18n.renderLanguageSelector()}</li>
            <li><a href="#roles" class="nav-cta smooth-scroll">${i18n.t('landing.nav.enter')}</a></li>
          </ul>
        </div>
      </nav>

      <!-- Hero — The Physical Ledger Headline -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="hero-badge-dot"></span>
              ${i18n.t('landing.hero.badge')}
            </div>
            <h1>
              ${i18n.t('landing.hero.title')}
            </h1>
            <p class="hero-subtitle">
              ${i18n.t('landing.hero.subtitle')}
            </p>
            <div class="hero-actions">
              <a href="#roles" class="btn btn-primary smooth-scroll">
                ${i18n.t('landing.hero.enterBtn')}
              </a>
              <a href="#demos-section" class="btn btn-secondary smooth-scroll">
                ${i18n.t('landing.hero.inspectBtn')}
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
              <div class="stat-value">${formatNumber(blockCount)}</div>
              <div class="stat-label">${i18n.t('landing.stats.blocks')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatNumber(txCount)}</div>
              <div class="stat-label">${i18n.t('landing.stats.txs')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatNumber(products.length || 18)}</div>
              <div class="stat-label">${i18n.t('landing.stats.batches')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatNumber(userCount || 24)}</div>
              <div class="stat-label">${i18n.t('landing.stats.users')}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Demonstrators: AI Pricing & QR Traceability -->
      <section class="demos-section" id="demos-section">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">${i18n.t('landing.demos.eyebrow')}</span>
            <h2>${i18n.t('landing.demos.title')}</h2>
            <p>${i18n.t('landing.demos.subtitle')}</p>
          </div>

          <div class="demos-grid">
            <!-- Demonstrator 1: AI Pricing Calculator -->
            <div class="demo-card" id="demo-pricing-card">
              <div class="demo-card-header">
                <div>
                  <h3>${i18n.t('landing.demos.pricingTitle')}</h3>
                  <div style="font-size: var(--text-xs); color: var(--loam-faded);">${i18n.t('landing.demos.pricingSub')}</div>
                </div>
                <div class="stamp-seal" id="pricing-stamp-status">
                  ${ICONS.lock} ${i18n.t('landing.demos.priceLocked')}
                </div>
              </div>

              <div class="demo-selector-row">
                <button class="demo-pill-btn active" data-crop="mango">${i18n.t('crops.mango')}</button>
                <button class="demo-pill-btn" data-crop="rice">${i18n.t('crops.rice')}</button>
                <button class="demo-pill-btn" data-crop="onion">${i18n.t('crops.onion')}</button>
                <button class="demo-pill-btn" data-crop="turmeric">${i18n.t('crops.turmeric')}</button>
              </div>

              <div class="pricing-equation" id="pricing-equation-box">
                <!-- Dynamically rendered by updatePricingDemo -->
              </div>

              <div style="display: flex; gap: 10px; align-items: center; margin-top: auto;">
                <button class="btn btn-primary btn-sm" id="btn-lock-price">
                  ${i18n.t('landing.demos.lockBtn')}
                </button>
                <span class="stamp-hash" id="demo-lock-hash">Tx: 0x8f2a...4b19</span>
              </div>
            </div>

            <!-- Demonstrator 2: QR Trace Simulator -->
            <div class="demo-card" id="demo-trace-card">
              <div class="demo-card-header">
                <div>
                  <h3>${i18n.t('landing.demos.traceTitle')}</h3>
                  <div style="font-size: var(--text-xs); color: var(--loam-faded);">${i18n.t('landing.demos.traceSub')}</div>
                </div>
                <div class="stamp-seal stamp-verified">
                  ${ICONS.scan} ${i18n.t('landing.demos.tamperProof')}
                </div>
              </div>

              <div style="background: var(--parchment-warm); padding: 14px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-hairline); display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; font-size: var(--text-sm); color: var(--loam);">${i18n.t('landing.demos.sampleBatch')}</div>
                  <div style="font-size: var(--text-xs); color: var(--loam-faded); font-family: var(--font-mono);">${i18n.t('landing.demos.sampleMeta')}</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-simulate-scan">
                  ${i18n.t('landing.demos.scanBtn')}
                </button>
              </div>

              <div class="trace-timeline-list" id="trace-timeline-container">
                <div class="trace-item">
                  <div>
                    <div class="trace-item-role">${i18n.t('landing.demos.stage1Actor')}</div>
                    <div class="trace-item-title">${i18n.t('landing.demos.stage1Title')}</div>
                    <div class="trace-item-meta">${i18n.t('landing.demos.stage1Meta')}</div>
                  </div>
                </div>
                <div class="trace-item">
                  <div>
                    <div class="trace-item-role">${i18n.t('landing.demos.stage2Actor')}</div>
                    <div class="trace-item-title">${i18n.t('landing.demos.stage2Title')}</div>
                    <div class="trace-item-meta">${i18n.t('landing.demos.stage2Meta')}</div>
                  </div>
                </div>
                <div class="trace-item">
                  <div>
                    <div class="trace-item-role">${i18n.t('landing.demos.stage3Actor')}</div>
                    <div class="trace-item-title">${i18n.t('landing.demos.stage3Title')}</div>
                    <div class="trace-item-meta">${i18n.t('landing.demos.stage3Meta')}</div>
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
            <span class="section-eyebrow">${i18n.t('landing.how.eyebrow')}</span>
            <h2>${i18n.t('landing.how.title')}</h2>
            <p>${i18n.t('landing.how.subtitle')}</p>
          </div>

          <div class="steps-container">
            <div class="step-row">
              <div class="step-content">
                <h3>${i18n.t('landing.how.step1Title')}</h3>
                <p>${i18n.t('landing.how.step1Desc')}</p>
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
                <h3>${i18n.t('landing.how.step2Title')}</h3>
                <p>${i18n.t('landing.how.step2Desc')}</p>
              </div>
            </div>

            <div class="step-row">
              <div class="step-content">
                <h3>${i18n.t('landing.how.step3Title')}</h3>
                <p>${i18n.t('landing.how.step3Desc')}</p>
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
                <h3>${i18n.t('landing.how.step4Title')}</h3>
                <p>${i18n.t('landing.how.step4Desc')}</p>
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
                <h3>${i18n.t('landing.mandi.title')}</h3>
                <p>${i18n.t('landing.mandi.subtitle')}</p>
              </div>
            </div>
            <span class="stamp-seal stamp-verified" id="oracle-status-badge">${i18n.t('landing.mandi.oracleBadge')}</span>
          </div>

          <div class="mandi-ticker-wrap">
            <div class="mandi-ticker animate" id="mandi-cards-container">
              <div class="mandi-card">
                <div class="mandi-card-crop">${i18n.t('crops.rice')} — Punjab APMC</div>
                <div class="mandi-card-price">${formatCurrency(2450)} <span>/ ${i18n.t('units.quintal')}</span></div>
                <div class="mandi-card-trend up">↑ ${formatCurrency(24.50)}/${i18n.t('units.kg')} · ${i18n.t('landing.mandi.highDemand')}</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">${i18n.t('crops.onion')} — ${i18n.t('locations.nashik')}</div>
                <div class="mandi-card-price">${formatCurrency(2100)} <span>/ ${i18n.t('units.quintal')}</span></div>
                <div class="mandi-card-trend steady">→ ${formatCurrency(21.00)}/${i18n.t('units.kg')} · ${i18n.t('landing.mandi.steadyArrival')}</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">${i18n.t('crops.wheat')} — Sehore</div>
                <div class="mandi-card-price">${formatCurrency(2380)} <span>/ ${i18n.t('units.quintal')}</span></div>
                <div class="mandi-card-trend up">↑ ${formatCurrency(23.80)}/${i18n.t('units.kg')} · ${i18n.t('landing.mandi.consistent')}</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">${i18n.t('crops.turmeric')} — ${i18n.t('locations.erode')} APMC</div>
                <div class="mandi-card-price">${formatCurrency(10800)} <span>/ ${i18n.t('units.quintal')}</span></div>
                <div class="mandi-card-trend up">↑ ${formatCurrency(108.00)}/${i18n.t('units.kg')} · ${i18n.t('landing.mandi.exportSurge')}</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">${i18n.t('crops.mango')} — ${i18n.t('locations.ratnagiri')}</div>
                <div class="mandi-card-price">${formatCurrency(4500)} <span>/ ${i18n.t('units.crate')}</span></div>
                <div class="mandi-card-trend up">↑ ${formatCurrency(450)}/${i18n.t('units.dozen')} · ${i18n.t('landing.mandi.primeHarvest')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Role Selection: 4 Distinct Color Cards -->
      <section class="roles-section" id="roles">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">${i18n.t('landing.roles.eyebrow')}</span>
            <h2>${i18n.t('landing.roles.title')}</h2>
            <p>${i18n.t('landing.roles.subtitle')}</p>
          </div>

          <div class="roles-grid-four">
            <!-- Role 1: Farmer (Crop Green) -->
            <div class="role-distinct-card role-farmer-theme" id="role-farmer">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">${i18n.t('landing.roles.farmerTag')}</span>
                  <div class="role-icon-box" style="background: var(--role-farmer-bg); color: var(--role-farmer);">
                    ${ICONS.wheat}
                  </div>
                </div>
                <h3>${i18n.t('roles.farmer')}</h3>
                <p>${i18n.t('landing.roles.farmerDesc')}</p>
              </div>
              <button class="btn">${i18n.t('landing.roles.farmerBtn')}</button>
            </div>

            <!-- Role 2: Intermediary (Grain Gold) -->
            <div class="role-distinct-card role-intermediary-theme" id="role-intermediary">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">${i18n.t('landing.roles.intermediaryTag')}</span>
                  <div class="role-icon-box" style="background: var(--role-intermediary-bg); color: var(--role-intermediary);">
                    ${ICONS.store}
                  </div>
                </div>
                <h3>${i18n.t('roles.intermediary')}</h3>
                <p>${i18n.t('landing.roles.intermediaryDesc')}</p>
              </div>
              <button class="btn">${i18n.t('landing.roles.intermediaryBtn')}</button>
            </div>

            <!-- Role 3: Retailer (Market Clay) -->
            <div class="role-distinct-card role-retailer-theme" id="role-retailer">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">${i18n.t('landing.roles.retailerTag')}</span>
                  <div class="role-icon-box" style="background: var(--role-retailer-bg); color: var(--role-retailer);">
                    ${ICONS.cart}
                  </div>
                </div>
                <h3>${i18n.t('roles.retailer')}</h3>
                <p>${i18n.t('landing.roles.retailerDesc')}</p>
              </div>
              <button class="btn">${i18n.t('landing.roles.retailerBtn')}</button>
            </div>

            <!-- Role 4: Consumer (Table Plum) -->
            <div class="role-distinct-card role-consumer-theme" id="role-consumer">
              <div>
                <div class="role-card-top">
                  <span class="role-tag">${i18n.t('landing.roles.consumerTag')}</span>
                  <div class="role-icon-box" style="background: var(--role-consumer-bg); color: var(--role-consumer);">
                    ${ICONS.user}
                  </div>
                </div>
                <h3>${i18n.t('roles.consumer')}</h3>
                <p>${i18n.t('landing.roles.consumerDesc')}</p>
              </div>
              <button class="btn">${i18n.t('landing.roles.consumerBtn')}</button>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="javascript:void(0)" id="role-admin" style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--loam-faded); text-decoration: underline;">
              ${i18n.t('landing.roles.adminLink')}
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
              <p>${i18n.t('landing.footer.brandDesc')}</p>
            </div>
            <div class="footer-col">
              <h4>${i18n.t('landing.footer.col1Title')}</h4>
              <ul>
                <li><a href="#how-it-works" class="smooth-scroll">${i18n.t('landing.nav.howItWorks')}</a></li>
                <li><a href="#demos-section" class="smooth-scroll">${i18n.t('landing.demos.pricingTitle')}</a></li>
                <li><a href="#mandi-section" class="smooth-scroll">${i18n.t('landing.nav.mandi')}</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>${i18n.t('landing.footer.col2Title')}</h4>
              <ul>
                <li><a href="#demos-section" class="smooth-scroll">${i18n.t('landing.footer.escrowContracts')}</a></li>
                <li><a href="#demos-section" class="smooth-scroll">${i18n.t('landing.footer.cloneDetection')}</a></li>
                <li><a href="#roles" class="smooth-scroll">${i18n.t('landing.nav.roles')}</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>${i18n.t('landing.footer.bottom1')}</p>
            <p>${i18n.t('landing.footer.bottom2')}</p>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Function to render AI Pricing Equation
  function updatePricingDemo(key) {
    const demoData = getPricingDemoData();
    const data = demoData[key];
    if (!data) return;

    const box = container.querySelector('#pricing-equation-box');
    if (!box) return;

    const cropName = i18n.t(data.cropKey);
    const origin = i18n.t(data.originKey);
    const demandReason = i18n.t(data.demandReasonKey);
    const unit = localizeUnit(data.unit);

    box.innerHTML = `
      <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-family: var(--font-heading); font-size: 1rem; font-weight: 700; color: var(--loam);">${cropName}</span>
        <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--loam-faded);">${origin}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">${i18n.t('landing.pricing.mspFloor')}</span>
        <span class="equation-val">${formatCurrency(data.mspFloor)} / ${unit}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">${i18n.t('landing.pricing.qualityBonus')} (${data.qualityGrade})</span>
        <span class="equation-val plus">+${formatCurrency(data.qualityBonus)}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">${i18n.t('landing.pricing.demandFactor')} (${demandReason})</span>
        <span class="equation-val plus">+${formatCurrency(data.demandBonus)}</span>
      </div>
      <div class="equation-row">
        <span class="equation-label">${i18n.t('landing.pricing.storageIndex')}</span>
        <span class="equation-val plus">+${formatCurrency(data.storageBonus)}</span>
      </div>
      <div class="equation-total-row">
        <span class="equation-total-label">${i18n.t('landing.pricing.lockedPrice')}</span>
        <span class="equation-total-price">${formatCurrency(data.total)} <span style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--loam-faded);">/ ${unit}</span></span>
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
    lockBtn.innerHTML = `${i18n.t('landing.demos.stamped')}`;
    lockBtn.classList.add('is-success');
    const stampStatus = container.querySelector('#pricing-stamp-status');
    if (stampStatus) {
      stampStatus.classList.add('stamp-verified');
      stampStatus.innerHTML = `${i18n.t('landing.demos.blockSealed')}`;
    }
    setTimeout(() => {
      lockBtn.innerHTML = i18n.t('landing.demos.lockBtn');
      lockBtn.classList.remove('is-success');
    }, 2500);
  });

  // Simulate scan button interaction
  const scanBtn = container.querySelector('#btn-simulate-scan');
  scanBtn?.addEventListener('click', () => {
    scanBtn.innerHTML = i18n.t('landing.demos.verifying');
    scanBtn.classList.add('is-loading');

    setTimeout(() => {
      scanBtn.classList.remove('is-loading');
      scanBtn.innerHTML = i18n.t('landing.demos.authenticated');
      scanBtn.classList.add('btn-primary');
      scanBtn.classList.remove('btn-secondary');

      const timeline = container.querySelector('#trace-timeline-container');
      if (timeline) {
        timeline.insertAdjacentHTML('beforeend', `
          <div class="trace-item" style="border-left-color: var(--semantic-success); animation: fadeIn 0.4s var(--ease-out);">
            <div>
              <div class="trace-item-role" style="color: var(--semantic-success);">${i18n.t('landing.demos.consumerStamp')}</div>
              <div class="trace-item-title">${i18n.t('landing.demos.produceAuth')}</div>
              <div class="trace-item-meta">${i18n.t('landing.demos.cleanProof')}</div>
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
