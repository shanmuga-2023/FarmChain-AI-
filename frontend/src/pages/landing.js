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
  container.innerHTML = `
    <style>
      .landing-page {
        --hud-bg: #050816;
        --hud-panel: rgba(8, 13, 26, 0.65);
        --hud-card: rgba(255, 255, 255, 0.04);
        --hud-border: rgba(255, 255, 255, 0.08);
        --hud-cyan: #22D3EE;
        --hud-blue: #38BDF8;
        --hud-purple: #6366F1;
        --hud-text: #F8FAFC;
        --hud-text-sec: #94A3B8;
        --hud-muted: #64748B;
        --hud-green: #22C55E;
        
        background-color: var(--hud-bg);
        background-image: 
          radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.05), transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.08), transparent 40%),
          linear-gradient(var(--hud-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--hud-border) 1px, transparent 1px);
        background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
        min-height: 100vh;
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        color: var(--hud-text);
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
      }
      
      [data-theme="light"] .landing-page {
        --hud-bg: #F4F7FB;
        --hud-panel: rgba(255, 255, 255, 0.75);
        --hud-card: rgba(255, 255, 255, 0.75);
        --hud-border: rgba(0, 0, 0, 0.08);
        --hud-cyan: #0284C7;
        --hud-blue: #0369A1;
        --hud-purple: #4F46E5;
        --hud-text: #0F172A;
        --hud-text-sec: #475569;
        --hud-muted: #94A3B8;
        --hud-green: #16A34A;
      }

      .hud-header {
        position: fixed; top: 0; width: 100%; z-index: 100;
        padding: 16px 24px;
        background: var(--hud-panel);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border-bottom: 1px solid var(--hud-border);
        display: flex; justify-content: space-between; align-items: center;
      }
      
      .hud-logo {
        font-weight: 800; font-size: 1.2rem; letter-spacing: 2px;
        color: var(--hud-cyan);
        text-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
      }
      
      .hud-nav {
        display: flex; align-items: center; gap: 24px;
        font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;
      }

      .hud-btn-outline {
        border: 1px solid var(--hud-cyan);
        color: var(--hud-cyan);
        padding: 8px 16px; text-decoration: none;
        font-weight: 600; letter-spacing: 1px;
        box-shadow: inset 0 0 10px rgba(34, 211, 238, 0.1);
        transition: all 0.2s;
      }
      
      .hud-btn-outline:hover {
        background: rgba(34, 211, 238, 0.1);
        box-shadow: inset 0 0 15px rgba(34, 211, 238, 0.2), 0 0 15px rgba(34, 211, 238, 0.2);
      }

      .hud-hero {
        flex: 1; padding: 140px 24px 80px; display: flex; align-items: center; justify-content: center;
      }

      .hud-hero-inner {
        max-width: 1200px; width: 100%; margin: 0 auto;
        display: flex; gap: 64px; align-items: center; flex-wrap: wrap;
      }

      .hud-hero-text { flex: 1; min-width: 320px; animation: hudFadeInUp 0.8s ease-out forwards; }
      
      .hud-status {
        font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;
        color: var(--hud-green); letter-spacing: 2px; margin-bottom: 24px;
        display: inline-flex; align-items: center; gap: 8px;
        padding: 6px 12px; border: 1px solid var(--hud-green);
        background: rgba(34, 197, 94, 0.05);
      }

      .hud-title {
        font-size: 4.5rem; font-weight: 800; line-height: 1.1; margin: 0 0 24px 0;
        letter-spacing: -1px; text-transform: uppercase;
      }
      
      .hud-gradient-text {
        background: linear-gradient(135deg, var(--hud-cyan), var(--hud-purple));
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }

      .hud-desc {
        font-size: 1.1rem; color: var(--hud-text-sec); line-height: 1.6;
        margin: 0 0 40px 0; max-width: 480px; font-weight: 500;
      }

      .hud-cta {
        display: inline-flex; align-items: center; justify-content: center;
        height: 52px; padding: 0 32px; font-size: 1.1rem; font-weight: 700;
        text-decoration: none; color: #FFF; letter-spacing: 1px;
        background: linear-gradient(135deg, var(--hud-cyan), var(--hud-purple));
        border: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 0 25px rgba(34, 211, 238, 0.15);
        transition: all 0.2s;
      }
      .hud-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 35px rgba(34, 211, 238, 0.3);
      }

      .hud-v-card {
        flex: 1; min-width: 320px;
        background: var(--hud-card); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        border: 1px solid var(--hud-border);
        border-radius: 16px; padding: 24px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        font-family: 'JetBrains Mono', monospace;
        transition: all 0.3s;
        animation: hudFloat 6s ease-in-out infinite;
      }
      .hud-v-card:hover {
        border-color: rgba(34, 211, 238, 0.35);
        box-shadow: 0 0 30px rgba(34, 211, 238, 0.1);
      }

      .hud-v-header {
        font-size: 0.8rem; color: var(--hud-text-sec); letter-spacing: 1px;
        border-bottom: 1px solid var(--hud-border); padding-bottom: 12px; margin-bottom: 20px;
      }
      
      .hud-v-asset {
        border: 1px dashed var(--hud-cyan); padding: 16px;
        background: rgba(34, 211, 238, 0.05); margin-bottom: 24px;
        font-size: 0.9rem; line-height: 1.6;
      }

      .hud-v-box {
        border: 1px solid var(--hud-border); padding: 12px;
        font-size: 0.85rem; line-height: 1.5; background: rgba(255,255,255,0.02);
      }
      .hud-v-arrow {
        text-align: center; color: var(--hud-text-sec); padding: 4px 0; font-size: 1.2rem;
      }
      .hud-v-footer {
        font-size: 0.8rem; color: var(--hud-purple); letter-spacing: 1px;
        border-top: 1px solid var(--hud-border); padding-top: 12px; margin-top: 20px;
        text-align: right; font-weight: 700;
      }

      .hud-features-section { padding: 40px 24px 100px; max-width: 1200px; margin: 0 auto; width: 100%; }
      .hud-section-title {
        font-family: 'JetBrains Mono', monospace; color: var(--hud-cyan);
        font-size: 1rem; letter-spacing: 2px; margin-bottom: 32px;
      }
      .hud-features-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;
      }
      .hud-f-card {
        background: var(--hud-card); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        border: 1px solid var(--hud-border); border-radius: 14px; padding: 24px;
        transition: all 0.2s;
      }
      .hud-f-card:hover {
        border-color: rgba(34, 211, 238, 0.35); box-shadow: 0 0 20px rgba(34, 211, 238, 0.1);
      }
      .hud-f-number {
        font-family: 'JetBrains Mono', monospace; color: var(--hud-cyan); font-size: 1.2rem;
        margin-bottom: 12px; font-weight: 700;
      }
      .hud-f-title {
        font-size: 1.1rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase;
      }
      .hud-f-desc {
        font-size: 0.95rem; color: var(--hud-text-sec); line-height: 1.5;
      }

      .hud-footer {
        border-top: 1px solid var(--hud-border); padding: 32px 24px;
        display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
        font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--hud-muted);
        background: rgba(0,0,0,0.2);
      }

      @keyframes hudFadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes hudFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      @media (max-width: 768px) {
        .hud-title { font-size: 3rem; }
        .hud-hero { padding-top: 100px; }
      }
    </style>

    <div class="landing-page">
      <!-- Header -->
      <nav class="hud-header" id="landing-nav">
        <div class="hud-logo" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" style="cursor:pointer;">FARMCHAIN AI</div>
        <div class="hud-nav">
          <div id="landing-lang-placeholder"></div>
          <a href="#/auth" class="hud-btn-outline">LOGIN</a>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hud-hero">
        <div class="hud-hero-inner">
          <div class="hud-hero-text">
            <div class="hud-status">[● SYSTEM ONLINE]</div>
            <h1 class="hud-title">TRACE EVERY<br/><span class="hud-gradient-text">HARVEST.</span><br/>TRUST EVERY ORIGIN.</h1>
            <p class="hud-desc">Track origin. Verify quality. Follow every transaction — from farm to final buyer.</p>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <a href="#/auth" class="hud-cta">[ ENTER PLATFORM &rarr; ]</a>
            </div>
            
            <div style="margin-top: 32px; display: flex; gap: 24px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--hud-text-sec);">
              <div>[ NETWORK: ONLINE ]</div>
              <div>[ TRACE: ACTIVE ]</div>
            </div>
          </div>

          <!-- Right Visual -->
          <div class="hud-v-card">
            <div class="hud-v-header">● LIVE TRACE | FARMCHAIN NETWORK</div>
            <div class="hud-v-body">
               <div class="hud-v-asset">
                  <div style="color: var(--hud-cyan); font-size: 0.75rem; margin-bottom: 8px;">[ SCANNING ASSET ]</div>
                  <strong style="color: var(--hud-text); font-size: 1rem;">Premium Alphonso Mango</strong><br/>
                  <span style="color: var(--hud-green); font-size: 0.8rem; margin-top: 4px; display: inline-block;">ORIGIN VERIFIED ✓</span>
               </div>
               <div class="hud-v-step">
                  <div class="hud-v-box">
                    <strong style="color: var(--hud-text);">FARM</strong><br/>Nashik, Maharashtra
                  </div>
                  <div class="hud-v-arrow">&darr;</div>
                  <div class="hud-v-box">
                    <strong style="color: var(--hud-text);">PROCESSING</strong><br/><span style="color: var(--hud-green);">✓ Verified</span>
                  </div>
                  <div class="hud-v-arrow">&darr;</div>
                  <div class="hud-v-box">
                    <strong style="color: var(--hud-text);">CONSUMER</strong><br/><span style="color: var(--hud-green);">✓ Authenticated</span>
                  </div>
               </div>
            </div>
            <div class="hud-v-footer">● BLOCKCHAIN VERIFIED</div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="hud-features-section">
        <div class="hud-section-title">// PLATFORM MODULES</div>
        <div class="hud-features-grid">
          <div class="hud-f-card">
            <div class="hud-f-number">01</div>
            <div class="hud-f-title">AI VERIFICATION</div>
            <div class="hud-f-desc">AI-assisted produce grading and quality verification.</div>
          </div>
          <div class="hud-f-card">
            <div class="hud-f-number">02</div>
            <div class="hud-f-title">BLOCKCHAIN TRACE</div>
            <div class="hud-f-desc">Immutable supply-chain records from origin to consumer.</div>
          </div>
          <div class="hud-f-card">
            <div class="hud-f-number">03</div>
            <div class="hud-f-title">LIVE PRICING</div>
            <div class="hud-f-desc">Transparent market pricing and transaction visibility.</div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="hud-footer">
        <div>FARMCHAIN AI <br/> <span style="color: var(--hud-text-sec);">TRACE &bull; VERIFY &bull; CONNECT</span></div>
        <div>© 2026 FarmChain AI</div>
        <div>SYSTEM STATUS: <span style="color: var(--hud-green);">● ONLINE</span></div>
      </footer>
    </div>
  `;
  
  // Try to render the language selector if possible
  setTimeout(() => {
    const langPlaceholder = container.querySelector('#landing-lang-placeholder');
    if (langPlaceholder && typeof i18n !== 'undefined') {
      langPlaceholder.innerHTML = i18n.renderLanguageSelector('landing-lang-select', 'background: transparent; border: none; color: var(--hud-text-sec); font-family: "JetBrains Mono", monospace; font-size: 0.85rem; cursor: pointer; outline: none;');
    }
  }, 0);
  
  // Navigation scroll behavior
  const nav = container.querySelector('#landing-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        nav.style.background = 'var(--hud-panel)';
        nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
      } else {
        nav.style.background = 'var(--hud-panel)';
        nav.style.boxShadow = 'none';
      }
    });
  }
}
