// ============================================
// FarmChain AI — Landing Page
// Hero, How It Works, Role Selection, Live Mandi Rates, Features, Multilingual
// ============================================

import { store } from '../data/store.js';
import { router } from '../utils/router.js';
import { blockchain } from '../blockchain/core.js';
import { i18n } from '../i18n/index.js';
import { formatCurrency, getCropEmoji } from '../utils/helpers.js';
import { fetchMandiRates } from '../utils/api.js';

export function renderLanding(container) {
  const blockCount = blockchain.getBlockCount();
  const txCount = blockchain.getAllTransactions().length;
  const products = store.get('products') || [];
  const users = store.get('users') || {};
  const userCount = Object.keys(users).length;

  container.innerHTML = `
    <div class="landing-page">
      <!-- Background Orbs -->
      <div class="landing-bg-orbs">
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
      </div>

      <!-- Navigation -->
      <nav class="landing-nav" id="landing-nav">
        <div class="container">
          <div class="logo" style="cursor: pointer;" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
            <div class="logo-icon">⛓️</div>
            <span>FarmChain <span class="text-gradient">AI</span></span>
          </div>
          <ul class="nav-links">
            <li><a href="#how-it-works" class="smooth-scroll">${i18n.t('howItWorks')}</a></li>
            <li><a href="#mandi-section" class="smooth-scroll">${i18n.t('liveMandiRates')}</a></li>
            <li><a href="#features" class="smooth-scroll">Features</a></li>
            <li><a href="#roles" class="smooth-scroll">${i18n.t('getStarted')}</a></li>
            <li>${i18n.renderLanguageSelector()}</li>
            <li><a href="#roles" class="nav-cta smooth-scroll">${i18n.t('getStarted')} →</a></li>
          </ul>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-badge">
            <span class="hero-badge-dot"></span>
            ${i18n.t('tagline')}
          </div>
          <h1>
            ${i18n.t('heroTitle1')}<br/>
            <span class="text-gradient">${i18n.t('heroTitle2')}</span><br/>
            ${i18n.t('heroTitle3')}
          </h1>
          <p class="hero-subtitle">
            ${i18n.t('heroSubtitle')}
          </p>
          <div class="hero-actions">
            <a href="#roles" class="btn btn-primary smooth-scroll">
              🚀 ${i18n.t('getStarted')}
            </a>
            <a href="#how-it-works" class="btn btn-secondary smooth-scroll">
              📖 ${i18n.t('learnMore')}
            </a>
          </div>
        </div>
      </section>

      <!-- Live Stats Ticker -->
      <section class="stats-ticker">
        <div class="container">
          <div class="stats-grid stagger-children">
            <div class="stat-item">
              <div class="stat-value text-gradient">${blockCount}</div>
              <div class="stat-label">${i18n.t('blocksMined')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value text-gradient">${txCount}</div>
              <div class="stat-label">${i18n.t('txRecorded')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value text-gradient">${products.length}</div>
              <div class="stat-label">${i18n.t('productsListed')}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value text-gradient">${userCount}</div>
              <div class="stat-label">${i18n.t('activeUsers')}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Live Mandi Spot Price Ticker -->
      <section class="mandi-section" id="mandi-section" style="padding: 50px 0; background: rgba(6, 182, 212, 0.04); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
        <div class="container">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.6rem;">📡</span>
              <div>
                <h3 style="font-size: 1.2rem; font-weight: 700;">Live eNAM & AgMarkNet Mandi Spot Rates</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Real-time oracle spot benchmarks from government and regional mandis</p>
              </div>
            </div>
            <span class="badge badge-success" id="oracle-status-badge" style="animation: pulse-glow 2s infinite; font-size: 0.8rem; padding: 6px 12px;">● Connected to Backend Oracle</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;" id="mandi-cards-container">
            <div class="stat-card" style="padding: 18px;">
              <div style="font-size: 0.85rem; color: var(--text-muted);">🌾 Rice (Punjab)</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-green); margin: 4px 0;">₹2,450 <span style="font-size: 0.75rem;">/ quintal</span></div>
              <div style="font-size: 0.8rem; color: var(--accent-green);">↑ High demand (+3.2%)</div>
            </div>
            <div class="stat-card" style="padding: 18px;">
              <div style="font-size: 0.85rem; color: var(--text-muted);">🧅 Onion (Nashik)</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-green); margin: 4px 0;">₹2,100 <span style="font-size: 0.75rem;">/ quintal</span></div>
              <div style="font-size: 0.8rem; color: var(--accent-amber);">→ Steady arrival</div>
            </div>
            <div class="stat-card" style="padding: 18px;">
              <div style="font-size: 0.85rem; color: var(--text-muted);">🌿 Wheat (MP)</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-green); margin: 4px 0;">₹2,380 <span style="font-size: 0.75rem;">/ quintal</span></div>
              <div style="font-size: 0.8rem; color: var(--accent-green);">↑ Steady (+1.8%)</div>
            </div>
            <div class="stat-card" style="padding: 18px;">
              <div style="font-size: 0.85rem; color: var(--text-muted);">🟡 Turmeric (Erode)</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-cyan); margin: 4px 0;">₹10,800 <span style="font-size: 0.75rem;">/ quintal</span></div>
              <div style="font-size: 0.8rem; color: var(--accent-cyan);">★ Export Surge (+5.4%)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="how-it-works" id="how-it-works" style="padding: 60px 0;">
        <div class="container">
          <div class="section-header" style="text-align: center; margin-bottom: 40px;">
            <h2>${i18n.t('howItWorks')}</h2>
            <p style="color: var(--text-muted);">${i18n.t('howItWorksSub')}</p>
          </div>
          <div class="steps-grid stagger-children">
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-icon">🌾</div>
              <h3>${i18n.t('step1Title')}</h3>
              <p>${i18n.t('step1Desc')}</p>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-icon">✅</div>
              <h3>${i18n.t('step2Title')}</h3>
              <p>${i18n.t('step2Desc')}</p>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-icon">🚚</div>
              <h3>${i18n.t('step3Title')}</h3>
              <p>${i18n.t('step3Desc')}</p>
            </div>
            <div class="step-card">
              <div class="step-number">4</div>
              <div class="step-icon">📱</div>
              <h3>${i18n.t('step4Title')}</h3>
              <p>${i18n.t('step4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section" id="features" style="padding: 60px 0; background: rgba(34, 197, 94, 0.03); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
        <div class="container">
          <div class="section-header" style="text-align: center; margin-bottom: 40px;">
            <h2>Enterprise Features ⚡</h2>
            <p style="color: var(--text-muted);">Built for farmers, logistics partners, retailers, consumers, and regulators</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
            <div class="card" style="padding: 24px;">
              <div style="font-size: 2rem; margin-bottom: 12px;">⚖️</div>
              <h3 style="margin-bottom: 8px; font-size: 1.15rem;">Automated Smart Escrow</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Solidity contracts enforce trustless settlement with guaranteed 60% farmer direct payout, 20% logistics, 15% retail, and 5% platform protocol fees.
              </p>
            </div>
            <div class="card" style="padding: 24px;">
              <div style="font-size: 2rem; margin-bottom: 12px;">🤖</div>
              <h3 style="margin-bottom: 8px; font-size: 1.15rem;">AI Fair Pricing Engine</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Machine learning model benchmarks seasonal curves, MSP government floors, and real-time mandi spot trends to eliminate predatory middleman cuts.
              </p>
            </div>
            <div class="card" style="padding: 24px;">
              <div style="font-size: 2rem; margin-bottom: 12px;">🔍</div>
              <h3 style="margin-bottom: 8px; font-size: 1.15rem;">Farm-to-Fork QR Trace</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Consumers scan packaging labels using camera video stream decoding to verify soil telemetry, organic lab certifications, and full chain custody.
              </p>
            </div>
            <div class="card" style="padding: 24px;">
              <div style="font-size: 2rem; margin-bottom: 12px;">🌐</div>
              <h3 style="margin-bottom: 8px; font-size: 1.15rem;">Multi-Language & Offline</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Native vernacular localization in English, Hindi, Tamil, Telugu, and Kannada with graceful local state fallback for rural connectivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Role Selection -->
      <section class="roles-section" id="roles" style="padding: 60px 0;">
        <div class="container">
          <div class="section-header" style="text-align: center; margin-bottom: 40px;">
            <h2>${i18n.t('chooseRole')}</h2>
            <p style="color: var(--text-muted);">${i18n.t('chooseRoleSub')}</p>
          </div>
          <div class="roles-grid stagger-children">
            <div class="role-card" data-role="farmer" id="role-farmer">
              <span class="role-card-icon">🌾</span>
              <h3>${i18n.t('farmerRole')}</h3>
              <p>${i18n.t('farmerRoleDesc')}</p>
              <button class="btn btn-primary btn-sm">${i18n.t('enterAs')} ${i18n.t('farmerRole')} →</button>
            </div>
            <div class="role-card" data-role="intermediary" id="role-intermediary">
              <span class="role-card-icon">🏪</span>
              <h3>${i18n.t('intermediaryRole')}</h3>
              <p>${i18n.t('intermediaryRoleDesc')}</p>
              <button class="btn btn-primary btn-sm">${i18n.t('enterAs')} ${i18n.t('intermediaryRole')} →</button>
            </div>
            <div class="role-card" data-role="retailer" id="role-retailer">
              <span class="role-card-icon">🛒</span>
              <h3>${i18n.t('retailerRole')}</h3>
              <p>${i18n.t('retailerRoleDesc')}</p>
              <button class="btn btn-primary btn-sm">${i18n.t('enterAs')} ${i18n.t('retailerRole')} →</button>
            </div>
            <div class="role-card" data-role="consumer" id="role-consumer">
              <span class="role-card-icon">👤</span>
              <h3>${i18n.t('consumerRole')}</h3>
              <p>${i18n.t('consumerRoleDesc')}</p>
              <button class="btn btn-primary btn-sm">${i18n.t('enterAs')} ${i18n.t('consumerRole')} →</button>
            </div>
            <div class="role-card" data-role="admin" id="role-admin">
              <span class="role-card-icon">🔧</span>
              <h3>${i18n.t('adminRole')}</h3>
              <p>${i18n.t('adminRoleDesc')}</p>
              <button class="btn btn-primary btn-sm">${i18n.t('enterAs')} ${i18n.t('adminRole')} →</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="container">
          <p>⛓️ FarmChain AI 2.0 — Production-Grade Decentralized AgriTech Platform</p>
          <p style="margin-top: 8px; font-size: 0.75rem;">Solidity Smart Contracts • Live Mandi Oracle • Multilingual • QR Traceability</p>
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
      cardsContainer.innerHTML = cropEntries.map(([cropName, data]) => {
        const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';
        const trendColor = data.trend === 'up' ? 'var(--accent-green)' : data.trend === 'down' ? 'var(--accent-red)' : 'var(--accent-amber)';
        const emoji = getCropEmoji(cropName);

        return `
          <div class="stat-card" style="padding: 18px;">
            <div style="font-size: 0.85rem; color: var(--text-muted);">${emoji} ${cropName} (${data.mandi || 'APMC Market'})</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-green); margin: 4px 0;">₹${data.pricePerQuintal || (data.pricePerKg * 100)} <span style="font-size: 0.75rem;">/ quintal</span></div>
            <div style="font-size: 0.8rem; color: ${trendColor}; font-weight: 600;">${trendIcon} ₹${data.pricePerKg}/kg · ${data.status || 'Live Spot'}</div>
          </div>
        `;
      }).join('');
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
}
