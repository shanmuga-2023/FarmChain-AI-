import { router } from '../utils/router.js';
import { i18n } from '../i18n/index.js';

export function renderLanding(container) {
  // Always replay intro on a fresh page load/refresh.
  // The flag is only set *after* the intro finishes, so navigating within
  // the app (hash changes) still skips it — only hard reloads trigger it.
  sessionStorage.removeItem('farmchainIntroShown');
  const isIntroSkipped = false;

  // Render cinematic intro + new landing page
  container.innerHTML = `
    <style>
      /* --- Intro Styles --- */
      .cinematic-intro {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        z-index: 99999;
      }
      #intro-logo-container {
        opacity: 0;
        transform: scale(0.92);
        transition: opacity 0.5s ease, transform 0.5s ease;
        display: flex;
        justify-content: center;
        align-items: center;
        filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.15));
        z-index: 10;
      }
      #intro-logo-container img {
        width: 220px;
        height: auto;
      }
      #intro-video-container {
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: auto;
        z-index: 1;
      }
      #intro-video {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
      }
      
      /* --- New Landing Page Styles --- */
      .landing-page {
        background: #ffffff;
        color: #0f172a;
        font-family: 'Inter', sans-serif;
      }
      
      /* Navigation */
      .landing-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 48px;
        background: #ffffff;
        border-bottom: 1px solid #f1f5f9;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .nav-left {
        display: flex;
        align-items: center;
        gap: 40px;
      }
      .nav-logo {
        height: 32px;
      }
      .nav-links {
        display: flex;
        gap: 24px;
      }
      .nav-links a {
        color: #475569;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        transition: color 0.2s;
      }
      .nav-links a:hover {
        color: #0ea5e9;
      }
      .nav-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      /* Hero Section */
      .landing-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 100px 48px;
        max-width: 900px;
        margin: 0 auto;
      }
      .hero-content {
        flex: 1;
      }
      .hero-badge {
        display: inline-block;
        padding: 6px 12px;
        background: #f0f9ff;
        color: #0ea5e9;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 24px;
        border: 1px solid #bae6fd;
      }
      .hero-title {
        font-size: 4rem;
        font-weight: 800;
        line-height: 1.1;
        margin-bottom: 24px;
        letter-spacing: -0.02em;
      }
      .hero-title .line1 { color: #0f172a; display: block; }
      .hero-title .line2 { color: #f59e0b; display: block; } /* FarmChain Orange/Gold */
      
      .hero-subtitle {
        font-size: 1.15rem;
        color: #475569;
        line-height: 1.6;
        margin-bottom: 40px;
        max-width: 700px;
      }
      
      .hero-actions {
        display: flex;
        gap: 16px;
        align-items: center;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }
      
      .btn-hero-primary {
        background: #f59e0b;
        color: white;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.2s;
        border: none;
        cursor: pointer;
      }
      .btn-hero-primary:hover {
        background: #d97706;
      }
      .btn-hero-secondary {
        background: #ffffff;
        color: #0f172a;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        text-decoration: none;
        border: 1px solid #cbd5e1;
        transition: all 0.2s;
        cursor: pointer;
      }
      .btn-hero-secondary:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }
      .btn-hero-video {
        background: transparent;
        color: #475569;
        padding: 14px 20px;
        border-radius: 8px;
        font-weight: 600;
        text-decoration: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .btn-hero-video:hover {
        color: #0ea5e9;
      }
      
      .hero-trust {
        display: flex;
        gap: 24px;
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 500;
        flex-wrap: wrap;
        justify-content: center;
      }
      
      /* Hero Card (Right) */
      .hero-visual {
        flex: 1;
        display: flex;
        justify-content: flex-end;
      }
      .verification-card {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e2e8f0;
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        width: 100%;
        max-width: 480px;
        backdrop-filter: blur(10px);
      }
      .vc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .vc-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: 0.5px;
      }
      .vc-badge-net {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .vc-product {
        margin-bottom: 24px;
      }
      .vc-product h3 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: #0f172a;
      }
      .vc-status {
        display: inline-block;
        background: #dcfce7;
        color: #166534;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .vc-location {
        font-size: 0.9rem;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .vc-pricing {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
      }
      .vc-price-box {
        flex: 1;
      }
      .vc-price-box .label {
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .vc-price-box .val {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
      }
      .vc-price-box .sub {
        font-size: 0.75rem;
        color: #0ea5e9;
        font-weight: 600;
        margin-top: 4px;
      }
      
      .vc-timeline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        position: relative;
      }
      .vc-timeline::before {
        content: '';
        position: absolute;
        top: 12px;
        left: 10px;
        right: 10px;
        height: 2px;
        background: #e2e8f0;
        z-index: 1;
      }
      .vc-node {
        position: relative;
        z-index: 2;
        background: #fff;
        padding: 0 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .vc-dot {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #0ea5e9;
        border: 4px solid #bae6fd;
      }
      .vc-node:last-child .vc-dot { background: #cbd5e1; border-color: #f1f5f9; }
      .vc-node span {
        font-size: 0.7rem;
        font-weight: 600;
        color: #475569;
      }
      
      .vc-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #e2e8f0;
        padding-top: 20px;
      }
      .vc-hash {
        font-family: monospace;
        font-size: 0.8rem;
        color: #94a3b8;
      }
      .btn-verify {
        background: #10b981;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
      }
      
      /* Metrics Strip */
      .metrics-strip {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        padding: 40px 48px;
      }
      .metrics-container {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
      }
      .metric-item {
        flex: 1;
        text-align: center;
        border-right: 1px solid #e2e8f0;
      }
      .metric-item:last-child {
        border-right: none;
      }
      .metric-val {
        font-size: 2.5rem;
        font-weight: 800;
        color: #f59e0b;
        margin-bottom: 8px;
      }
      .metric-label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.5px;
      }
      
      /* How It Works */
      .how-section {
        padding: 100px 48px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .how-header {
        text-align: center;
        margin-bottom: 60px;
      }
      .how-badge {
        display: inline-block;
        padding: 6px 12px;
        background: #f1f5f9;
        color: #64748b;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 16px;
        letter-spacing: 1px;
      }
      .how-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 16px;
      }
      .how-subtitle {
        font-size: 1.1rem;
        color: #475569;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
      }
      
      .how-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
      }
      .how-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 32px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        transition: transform 0.2s;
      }
      .how-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      }
      .hc-badge {
        display: inline-block;
        background: #f0f9ff;
        color: #0ea5e9;
        width: 32px;
        height: 32px;
        line-height: 32px;
        text-align: center;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.9rem;
        margin-bottom: 20px;
      }
      .hc-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 12px;
      }
      .hc-desc {
        font-size: 0.95rem;
        color: #475569;
        line-height: 1.6;
      }
      
      /* Responsive */
      @media (max-width: 1024px) {
        .how-grid { grid-template-columns: repeat(2, 1fr); }
        .hero-title { font-size: 3rem; }
      }
      @media (max-width: 768px) {
        .landing-hero { flex-direction: column; padding: 40px 24px; text-align: center; gap: 40px; }
        .hero-actions { justify-content: center; }
        .hero-trust { justify-content: center; }
        .hero-visual { justify-content: center; }
        .landing-nav { padding: 16px 24px; }
        .nav-links { display: none; } /* Hide on mobile to keep compact */
        .metrics-container { flex-wrap: wrap; gap: 24px 0; }
        .metric-item { flex: 0 0 50%; border-right: none; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
        .how-grid { grid-template-columns: 1fr; }
        .how-section { padding: 60px 24px; }
        .hero-title { font-size: 2.5rem; }
      }
    </style>
    
    <!-- Cinematic Intro Section -->
    <div class="cinematic-intro" id="cinematic-container">
      <div id="intro-video-container">
        <button id="skip-intro-btn" style="position:absolute; bottom:40px; right:40px; z-index:99; background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4); padding:8px 16px; border-radius:20px; font-size:0.85rem; font-weight:600; cursor:pointer; backdrop-filter:blur(10px);">Skip Intro &gt;&gt;</button>
        <video id="intro-video" muted playsinline preload="auto">
          <source src="/tomato_supply_chain.mp4" type="video/mp4" />
        </video>
      </div>
      <div id="intro-logo-container">
        <img src="/logo.png" alt="FarmChain Logo" />
      </div>
    </div>
    
    <!-- New Landing Page Content -->
    <div class="landing-page">
      <!-- Navigation -->
      <nav class="landing-nav">
        <div class="nav-left">
          <img src="/logo.png" alt="FarmChain" class="nav-logo" style="filter: brightness(0); height: 28px;" />
        </div>
        <div class="nav-right">
          <select id="lang-switch-landing" class="farmchain-lang-select" style="background: transparent; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; font-size: 0.85rem; font-weight: 500; color: #475569; cursor: pointer;">
            <option value="en" ${i18n.currentLocale === 'en' ? 'selected' : ''}>EN | English</option>
            <option value="hi" ${i18n.currentLocale === 'hi' ? 'selected' : ''}>HI | हिन्दी</option>
            <option value="ta" ${i18n.currentLocale === 'ta' ? 'selected' : ''}>TA | தமிழ்</option>
            <option value="te" ${i18n.currentLocale === 'te' ? 'selected' : ''}>TE | తెలుగు</option>
          </select>
          <button id="login-btn" class="btn btn-primary" onclick="window.location.hash='/login'" style="padding: 8px 16px; border-radius: 8px; font-weight: 600;">${i18n.t('landing.hero.enterBtn') || 'Explore Platform'}</button>
        </div>
      </nav>
      
      <!-- Hero Section -->
      <section class="landing-hero">
        <h1 class="hero-title">
          <span class="line1">${i18n.t('landing.newHero.title1') || 'Fair Harvest Prices.'}</span>
          <span class="line2">${i18n.t('landing.newHero.title2') || 'Zero-Trust Provenance.'}</span>
        </h1>
        <p class="hero-subtitle">
          ${i18n.t('landing.newHero.subtitle') || "India's premier agricultural marketplace connecting farmers, traders, retailers, and consumers with AI-driven MSP floors, smart escrow contracts, and cryptographic QR traceability."}
        </p>
        <div class="hero-actions">
          <button class="btn-hero-primary" onclick="window.location.hash='/login'">${i18n.t('landing.newHero.primaryBtn') || 'Explore Platform →'}</button>
        </div>
        <div class="hero-trust">
          <span>${i18n.t('landing.newHero.trust1') || '★ 4.9/5 Farmer Satisfaction'}</span>
          <span>${i18n.t('landing.newHero.trust2') || '100% Escrow Protected'}</span>
          <span>${i18n.t('landing.newHero.trust3') || '0.4s Gasless Finality'}</span>
        </div>
      </section>
      
      <!-- Metrics Strip -->
      <section class="metrics-strip">
        <div class="metrics-container">
          <div class="metric-item">
            <div class="metric-val">${i18n.t('landing.newHero.stat1Value') || '31'}</div>
            <div class="metric-label">${i18n.t('landing.newHero.stat1Label') || 'BATCHES SEALED ON LEDGER'}</div>
          </div>
          <div class="metric-item">
            <div class="metric-val">${i18n.t('landing.newHero.stat2Value') || '₹4.20 Cr'}</div>
            <div class="metric-label">${i18n.t('landing.newHero.stat2Label') || 'ESCROW PROTECTED'}</div>
          </div>
          <div class="metric-item">
            <div class="metric-val">${i18n.t('landing.newHero.stat3Value') || '16'}</div>
            <div class="metric-label">${i18n.t('landing.newHero.stat3Label') || 'ACTIVE FARM PRODUCE'}</div>
          </div>
          <div class="metric-item">
            <div class="metric-val">${i18n.t('landing.newHero.stat4Value') || '9'}</div>
            <div class="metric-label">${i18n.t('landing.newHero.stat4Label') || 'REGISTERED STAKEHOLDERS'}</div>
          </div>
        </div>
      </section>
      
      <!-- How It Works -->
      <section class="how-section" id="how-it-works">
        <div class="how-header">
          <div class="how-badge">${i18n.t('landing.newHero.howBadge') || 'TRANSPARENT PHYSICAL LEDGER'}</div>
          <h2 class="how-title">${i18n.t('landing.newHero.howTitle') || 'How FarmChain Works'}</h2>
          <p class="how-subtitle">${i18n.t('landing.newHero.howSubtitle') || 'From seed sowing to supermarket shelf — every physical handoff is cryptographically sealed on-chain.'}</p>
        </div>
        
        <div class="how-grid">
          <div class="how-card">
            <div class="hc-badge">01</div>
            <h3 class="hc-title">${i18n.t('landing.newHero.step1Title') || '1. Harvest & AI Pricing'}</h3>
            <p class="hc-desc">${i18n.t('landing.newHero.step1Desc') || 'Farmer logs produce batch. AI forecast rates and locks an guaranteed MSP floor price directly into a smart escrow contract.'}</p>
          </div>
          <div class="how-card">
            <div class="hc-badge">02</div>
            <h3 class="hc-title">${i18n.t('landing.newHero.step2Title') || '2. Mandi Inspection'}</h3>
            <p class="hc-desc">${i18n.t('landing.newHero.step2Desc') || 'APMC intermediary verifies produce grade & QR link. Every contract records batch custody and funds the escrow pool.'}</p>
          </div>
          <div class="how-card">
            <div class="hc-badge">03</div>
            <h3 class="hc-title">${i18n.t('landing.newHero.step3Title') || '3. Retail Cold Chain'}</h3>
            <p class="hc-desc">${i18n.t('landing.newHero.step3Desc') || 'Retail supermarket receives authenticated lots. Temperature and transit checkpoints are anchored to immutable Polygon blocks.'}</p>
          </div>
          <div class="how-card">
            <div class="hc-badge">04</div>
            <h3 class="hc-title">${i18n.t('landing.newHero.step4Title') || '4. Consumer QR Trace'}</h3>
            <p class="hc-desc">${i18n.t('landing.newHero.step4Desc') || 'Consumer scans the unique on-package QR code to view the complete immutable farm journey, certificates, and farmer payouts.'}</p>
          </div>
        </div>
      </section>
    </div>
  `;

  // Attach event listeners
  container.querySelector('#login-btn').addEventListener('click', () => {
    router.navigate('/login');
  });

  const langSwitch = container.querySelector('#lang-switch-landing');
  if (langSwitch) {
    langSwitch.addEventListener('change', (e) => {
      i18n.setLanguage(e.target.value);
      // The global farmchain:lang_changed event in main.js will re-render all pages
    });
  }

  // Handle intro logic
  const logo = container.querySelector('#intro-logo-container');
  const vidContainer = container.querySelector('#intro-video-container');
  const vid = container.querySelector('#intro-video');
  const cinematicContainer = container.querySelector('#cinematic-container');

  if (isIntroSkipped && cinematicContainer) {
    cinematicContainer.style.display = 'none';
  } else {

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const setOpacity = (op) => { logo.style.opacity = op; };

  const finishIntro = () => {
    if (!cinematicContainer) return;
    cinematicContainer.style.transition = 'opacity 0.5s ease';
    cinematicContainer.style.opacity = '0';
    setTimeout(() => {
      cinematicContainer.style.display = 'none';
      sessionStorage.setItem('farmchainIntroShown', 'true');
      window.scrollTo(0, 0);
    }, 500);
  };

  vid.addEventListener('ended', finishIntro);
  vid.addEventListener('error', finishIntro);
    const skipBtn = container.querySelector('#skip-intro-btn');
    if(skipBtn) skipBtn.addEventListener('click', finishIntro);

  const startSequence = async () => {
    // 1. Initial elegant entrance
    await wait(100);
    logo.style.opacity = '1';
    logo.style.transform = 'scale(1)';
    
    // Initial visible time
    await wait(700); 

    // Adjust transition speed for crisp blinking
    logo.style.transition = 'opacity 0.2s ease-in-out';

    // 2. Blink 1
    setOpacity('0');
    await wait(300);
    setOpacity('1');
    await wait(400);

    // 3. Blink 2
    setOpacity('0');
    await wait(300);
    setOpacity('1');
    await wait(400);

    // 4. Fade logo out smoothly before video
    logo.style.transition = 'opacity 0.4s ease';
    setOpacity('0');
    await wait(400); // Wait for logo to fully disappear

    // 5. Fade video in and play
    vidContainer.style.opacity = '1';
    try {
      await vid.play();
    } catch (err) {
      console.warn("Autoplay prevented or video missing.");
      finishIntro();
    }
  };

  // Kick off sequence
    startSequence();
  }
}
