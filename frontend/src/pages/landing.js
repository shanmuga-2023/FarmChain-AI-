// ============================================
// FarmChain AI — Landing Page
// Editorial asymmetric layout with terracotta identity
// ============================================

import { store } from '../data/store.js';
import { router } from '../utils/router.js';
import { blockchain } from '../blockchain/core.js';
import { i18n } from '../i18n/index.js';
import { formatCurrency, getCropEmoji } from '../utils/helpers.js';
import { fetchMandiRates } from '../utils/api.js';

// --- SVG Icon Library (inline, no emoji) ---
const ICONS = {
  chain: `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  signal: `<svg viewBox="0 0 24 24"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/></svg>`,
  shield: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></svg>`,
  scan: `<svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
  globe: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  wheat: `<svg viewBox="0 0 24 24"><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/></svg>`,
  store: `<svg viewBox="0 0 24 24"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>`,
  cart: `<svg viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  user: `<svg viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  settings: `<svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  truck: `<svg viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
  smartphone: `<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
};

// SVG illustration: supply chain network
function heroIllustration() {
  return `
    <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Connection lines -->
      <line x1="100" y1="80" x2="200" y2="160" stroke="rgba(194,97,58,0.2)" stroke-width="1.5" class="flow-line"/>
      <line x1="300" y1="80" x2="200" y2="160" stroke="rgba(194,97,58,0.2)" stroke-width="1.5" class="flow-line"/>
      <line x1="200" y1="160" x2="120" y2="280" stroke="rgba(194,97,58,0.2)" stroke-width="1.5" class="flow-line"/>
      <line x1="200" y1="160" x2="280" y2="280" stroke="rgba(194,97,58,0.2)" stroke-width="1.5" class="flow-line"/>

      <!-- Node: Farm -->
      <g class="node" style="animation-delay: 0s">
        <circle cx="100" cy="80" r="32" fill="rgba(61,170,109,0.08)" stroke="rgba(61,170,109,0.3)" stroke-width="1.5"/>
        <text x="100" y="76" text-anchor="middle" fill="#3DAA6D" font-size="20">${ICONS.wheat ? '🌾' : ''}</text>
        <text x="100" y="96" text-anchor="middle" fill="rgba(139,149,165,0.8)" font-family="DM Sans" font-size="10" font-weight="500">Farm</text>
      </g>

      <!-- Node: Verify -->
      <g class="node" style="animation-delay: 0.5s">
        <circle cx="300" cy="80" r="32" fill="rgba(194,97,58,0.08)" stroke="rgba(194,97,58,0.3)" stroke-width="1.5"/>
        <text x="300" y="76" text-anchor="middle" fill="#C2613A" font-size="18">✓</text>
        <text x="300" y="96" text-anchor="middle" fill="rgba(139,149,165,0.8)" font-family="DM Sans" font-size="10" font-weight="500">Verify</text>
      </g>

      <!-- Node: Chain (center) -->
      <g class="node" style="animation-delay: 1s">
        <circle cx="200" cy="160" r="40" fill="rgba(194,97,58,0.06)" stroke="rgba(194,97,58,0.25)" stroke-width="2"/>
        <circle cx="200" cy="160" r="28" fill="rgba(194,97,58,0.04)" stroke="rgba(194,97,58,0.15)" stroke-width="1"/>
        <text x="200" y="156" text-anchor="middle" fill="#C2613A" font-family="DM Serif Display" font-size="16">AI</text>
        <text x="200" y="174" text-anchor="middle" fill="rgba(139,149,165,0.8)" font-family="DM Sans" font-size="10" font-weight="500">Blockchain</text>
      </g>

      <!-- Node: Retail -->
      <g class="node" style="animation-delay: 1.5s">
        <circle cx="120" cy="280" r="32" fill="rgba(74,143,212,0.08)" stroke="rgba(74,143,212,0.3)" stroke-width="1.5"/>
        <text x="120" y="276" text-anchor="middle" fill="#4A8FD4" font-size="18">🏬</text>
        <text x="120" y="296" text-anchor="middle" fill="rgba(139,149,165,0.8)" font-family="DM Sans" font-size="10" font-weight="500">Retail</text>
      </g>

      <!-- Node: Consumer -->
      <g class="node" style="animation-delay: 2s">
        <circle cx="280" cy="280" r="32" fill="rgba(139,108,193,0.08)" stroke="rgba(139,108,193,0.3)" stroke-width="1.5"/>
        <text x="280" y="276" text-anchor="middle" fill="#8B6CC1" font-size="18">👤</text>
        <text x="280" y="296" text-anchor="middle" fill="rgba(139,149,165,0.8)" font-family="DM Sans" font-size="10" font-weight="500">Consumer</text>
      </g>
    </svg>
  `;
}

export function renderLanding(container) {
  const blockCount = blockchain.getBlockCount();
  const txCount = blockchain.getAllTransactions().length;
  const products = store.get('products') || [];
  const users = store.get('users') || {};
  const userCount = Object.keys(users).length;

  container.innerHTML = `
    <div class="landing-page">
      <div class="landing-bg-grid"></div>

      <!-- Navigation -->
      <nav class="landing-nav" id="landing-nav">
        <div class="container">
          <div class="logo" style="cursor: pointer;" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
            <div class="logo-icon">${ICONS.chain}</div>
            <span>FarmChain <span class="text-gradient">AI</span></span>
          </div>
          <ul class="nav-links">
            <li><a href="#how-it-works" class="smooth-scroll">${i18n.t('howItWorks')}</a></li>
            <li><a href="#mandi-section" class="smooth-scroll">Mandi Rates</a></li>
            <li><a href="#features" class="smooth-scroll">Features</a></li>
            <li>${i18n.renderLanguageSelector()}</li>
            <li><a href="#roles" class="nav-cta smooth-scroll">${i18n.t('getStarted')}</a></li>
          </ul>
        </div>
      </nav>

      <!-- Hero — Split layout -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="hero-badge-dot"></span>
              ${i18n.t('tagline')}
            </div>
            <h1>
              ${i18n.t('heroTitle1')}<br/>
              <span class="accent">${i18n.t('heroTitle2')}</span><br/>
              ${i18n.t('heroTitle3')}
            </h1>
            <p class="hero-subtitle">
              ${i18n.t('heroSubtitle')}
            </p>
            <div class="hero-actions">
              <a href="#roles" class="btn btn-primary smooth-scroll">
                ${i18n.t('getStarted')} <span style="margin-left:4px">${ICONS.arrowRight}</span>
              </a>
              <a href="#how-it-works" class="btn btn-secondary smooth-scroll">
                ${i18n.t('learnMore')}
              </a>
            </div>
          </div>
          <div class="hero-visual">
            ${heroIllustration()}
          </div>
        </div>
      </section>

      <!-- Stats Ticker -->
      <section class="stats-ticker">
        <div class="container">
          <div class="stats-grid stagger-children">
            <div class="stat-item">
              <div class="stat-value">${blockCount}</div>
              <div class="stat-label">${i18n.t('blocksMined')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${txCount}</div>
              <div class="stat-label">${i18n.t('txRecorded')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${products.length}</div>
              <div class="stat-label">${i18n.t('productsListed')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${userCount}</div>
              <div class="stat-label">${i18n.t('activeUsers')}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Live Mandi Rates — horizontal ticker -->
      <section class="mandi-section" id="mandi-section">
        <div class="container">
          <div class="mandi-header">
            <div class="mandi-header-left">
              ${ICONS.signal}
              <div>
                <h3>Live eNAM & AgMarkNet Spot Rates</h3>
                <p>Real-time oracle benchmarks from government mandis</p>
              </div>
            </div>
            <span class="badge badge-success" id="oracle-status-badge" style="font-size: var(--text-xs); padding: 5px 10px;">Connected</span>
          </div>

          <div class="mandi-ticker-wrap">
            <div class="mandi-ticker animate" id="mandi-cards-container">
              <div class="mandi-card">
                <div class="mandi-card-crop">Rice — Punjab</div>
                <div class="mandi-card-price">₹2,450 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ +3.2% High demand</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Onion — Nashik</div>
                <div class="mandi-card-price">₹2,100 <span>/ quintal</span></div>
                <div class="mandi-card-trend steady">→ Steady arrival</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Wheat — Madhya Pradesh</div>
                <div class="mandi-card-price">₹2,380 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ +1.8% Steady</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Turmeric — Erode</div>
                <div class="mandi-card-price">₹10,800 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ +5.4% Export surge</div>
              </div>
              <!-- Duplicates for seamless loop -->
              <div class="mandi-card">
                <div class="mandi-card-crop">Rice — Punjab</div>
                <div class="mandi-card-price">₹2,450 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ +3.2% High demand</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Onion — Nashik</div>
                <div class="mandi-card-price">₹2,100 <span>/ quintal</span></div>
                <div class="mandi-card-trend steady">→ Steady arrival</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Wheat — Madhya Pradesh</div>
                <div class="mandi-card-price">₹2,380 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ +1.8% Steady</div>
              </div>
              <div class="mandi-card">
                <div class="mandi-card-crop">Turmeric — Erode</div>
                <div class="mandi-card-price">₹10,800 <span>/ quintal</span></div>
                <div class="mandi-card-trend up">↑ +5.4% Export surge</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works — alternating steps -->
      <section class="how-it-works" id="how-it-works">
        <div class="container">
          <div class="section-header centered">
            <span class="section-eyebrow">How It Works</span>
            <h2>${i18n.t('howItWorks')}</h2>
            <p>${i18n.t('howItWorksSub')}</p>
          </div>

          <div class="steps-container stagger-children">
            <div class="step-row">
              <div class="step-content">
                <h3>${i18n.t('step1Title')}</h3>
                <p>${i18n.t('step1Desc')}</p>
              </div>
              <div class="step-marker">
                <div class="step-number">1</div>
              </div>
              <div class="step-icon-area">
                ${ICONS.wheat}
              </div>
            </div>

            <div class="step-row">
              <div class="step-icon-area">
                ${ICONS.shield}
              </div>
              <div class="step-marker">
                <div class="step-number">2</div>
              </div>
              <div class="step-content">
                <h3>${i18n.t('step2Title')}</h3>
                <p>${i18n.t('step2Desc')}</p>
              </div>
            </div>

            <div class="step-row">
              <div class="step-content">
                <h3>${i18n.t('step3Title')}</h3>
                <p>${i18n.t('step3Desc')}</p>
              </div>
              <div class="step-marker">
                <div class="step-number">3</div>
              </div>
              <div class="step-icon-area">
                ${ICONS.truck}
              </div>
            </div>

            <div class="step-row">
              <div class="step-icon-area">
                ${ICONS.smartphone}
              </div>
              <div class="step-marker">
                <div class="step-number">4</div>
              </div>
              <div class="step-content">
                <h3>${i18n.t('step4Title')}</h3>
                <p>${i18n.t('step4Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features — asymmetric grid -->
      <section class="features-section" id="features">
        <div class="container">
          <div class="section-header">
            <span class="section-eyebrow">Capabilities</span>
            <h2>Built for Every Stakeholder</h2>
            <p>From soil to shelf — every transaction is verified, priced fairly, and fully traceable.</p>
          </div>

          <div class="features-layout">
            <!-- Hero feature -->
            <div class="feature-hero">
              <div class="feature-hero-text">
                <h3>AI Fair Pricing Engine</h3>
                <p>Machine learning benchmarks seasonal curves, MSP government floors, and real-time mandi spot trends. Farmers scoring 95%+ on AI quality checks earn a 5% bonus. No middleman opacity — every price component is visible on-chain.</p>
              </div>
              <div class="feature-hero-visual">
                ${ICONS.cpu}
              </div>
            </div>

            <!-- 3-column feature grid -->
            <div class="features-grid stagger-children">
              <div class="feature-card">
                <div class="feature-icon">${ICONS.shield}</div>
                <h3>Smart Escrow Settlement</h3>
                <p>Solidity contracts enforce trustless revenue splits: 60% farmer, 20% logistics, 15% retail, 5% platform. Released on delivery verification.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">${ICONS.scan}</div>
                <h3>Farm-to-Fork QR Traceability</h3>
                <p>Consumers scan packaging to verify soil data, organic certifications, and full chain of custody. Clone detection catches counterfeit scans in real-time.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">${ICONS.globe}</div>
                <h3>Vernacular & Offline-Ready</h3>
                <p>Native localization in Hindi, Tamil, Telugu, and Kannada with offline-first caching for rural areas with intermittent connectivity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Role Selection — featured role + 2×2 grid -->
      <section class="roles-section" id="roles">
        <div class="container">
          <div class="section-header">
            <span class="section-eyebrow">Get Started</span>
            <h2>${i18n.t('chooseRole')}</h2>
            <p>${i18n.t('chooseRoleSub')}</p>
          </div>

          <div class="roles-layout">
            <!-- Featured: Farmer -->
            <div class="role-featured" data-role="farmer" id="role-farmer">
              <span class="role-card-tag">Primary Stakeholder</span>
              <h3>${i18n.t('farmerRole')}</h3>
              <p>${i18n.t('farmerRoleDesc')}</p>
              <button class="btn btn-primary">${i18n.t('enterAs')} ${i18n.t('farmerRole')} <span style="margin-left:4px">${ICONS.arrowRight}</span></button>
            </div>

            <!-- 2×2 grid for other roles -->
            <div class="roles-grid-small">
              <div class="role-card" data-role="intermediary" id="role-intermediary">
                <div class="role-card-icon" style="background: var(--semantic-amber-dim); color: var(--semantic-amber);">
                  ${ICONS.store}
                </div>
                <h3>${i18n.t('intermediaryRole')}</h3>
                <p>${i18n.t('intermediaryRoleDesc')}</p>
                <button class="btn btn-secondary btn-sm">${i18n.t('enterAs')} ${i18n.t('intermediaryRole')}</button>
              </div>
              <div class="role-card" data-role="retailer" id="role-retailer">
                <div class="role-card-icon" style="background: var(--semantic-blue-dim); color: var(--semantic-blue);">
                  ${ICONS.cart}
                </div>
                <h3>${i18n.t('retailerRole')}</h3>
                <p>${i18n.t('retailerRoleDesc')}</p>
                <button class="btn btn-secondary btn-sm">${i18n.t('enterAs')} ${i18n.t('retailerRole')}</button>
              </div>
              <div class="role-card" data-role="consumer" id="role-consumer">
                <div class="role-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">
                  ${ICONS.user}
                </div>
                <h3>${i18n.t('consumerRole')}</h3>
                <p>${i18n.t('consumerRoleDesc')}</p>
                <button class="btn btn-secondary btn-sm">${i18n.t('enterAs')} ${i18n.t('consumerRole')}</button>
              </div>
              <div class="role-card" data-role="admin" id="role-admin">
                <div class="role-card-icon" style="background: var(--semantic-red-dim); color: var(--semantic-red);">
                  ${ICONS.settings}
                </div>
                <h3>${i18n.t('adminRole')}</h3>
                <p>${i18n.t('adminRoleDesc')}</p>
                <button class="btn btn-secondary btn-sm">${i18n.t('enterAs')} ${i18n.t('adminRole')}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer — 3-column -->
      <footer class="landing-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div class="logo">
                <div class="logo-icon">${ICONS.chain}</div>
                <span>FarmChain <span class="text-gradient">AI</span></span>
              </div>
              <p>Decentralized agricultural marketplace connecting farmers directly to consumers through blockchain trust and AI-driven fair pricing.</p>
            </div>
            <div class="footer-col">
              <h4>Platform</h4>
              <ul>
                <li><a href="#how-it-works" class="smooth-scroll">How It Works</a></li>
                <li><a href="#features" class="smooth-scroll">Features</a></li>
                <li><a href="#mandi-section" class="smooth-scroll">Mandi Rates</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Technology</h4>
              <ul>
                <li><a href="#features" class="smooth-scroll">Smart Contracts</a></li>
                <li><a href="#features" class="smooth-scroll">AI Quality Oracle</a></li>
                <li><a href="#features" class="smooth-scroll">QR Traceability</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>FarmChain AI — Blockchain AgriTech Platform</p>
            <p>Solidity Contracts · AI Oracle · Multilingual · QR Trace</p>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Smooth scroll handler for in-page section links
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
    if (window.scrollY > 50) {
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
