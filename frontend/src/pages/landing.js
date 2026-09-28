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
      
      /* --- New Landing Page Styles (Matching Dark Glassmorphic Login Design) --- */
      .landing-page {
        background: radial-gradient(circle at 50% 15%, #2a3462 0%, #151b36 40%, #0a0d1b 100%);
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        min-height: 100vh;
      }
      
      /* Navigation */
      .landing-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 48px;
        background: rgba(10, 13, 27, 0.75);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      }
      .nav-left {
        display: flex;
        align-items: center;
        gap: 40px;
      }
      .nav-logo {
        height: 32px;
        filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4));
      }
      .nav-brand-text {
        font-size: 1.35rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -0.5px;
        display: flex;
        align-items: center;
      }
      .nav-brand-text span {
        color: #38bdf8;
      }
      .nav-links {
        display: flex;
        gap: 24px;
      }
      .nav-links a {
        color: #8e9cb5;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
        transition: color 0.2s;
      }
      .nav-links a:hover {
        color: #38bdf8;
      }
      .nav-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .landing-lang-select {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        background: rgba(18, 23, 44, 0.85);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        color: #cbd5e1;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
      }
      .landing-lang-select:hover {
        border-color: rgba(56, 189, 248, 0.5);
      }
      .landing-lang-select option {
        background: #161c36;
        color: #ffffff;
      }
      .landing-nav-btn {
        background: linear-gradient(90deg, #6b21a8 0%, #4338ca 50%, #3b82f6 100%);
        color: #ffffff;
        border: none;
        border-radius: 9999px;
        padding: 9px 24px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.3px;
        cursor: pointer;
        box-shadow: 0 8px 22px -3px rgba(99, 102, 241, 0.55);
        transition: all 0.25s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
      }
      .landing-nav-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px -4px rgba(99, 102, 241, 0.75);
        filter: brightness(1.1);
      }
      
      /* Hero Section */
      .landing-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 100px 48px;
        max-width: 960px;
        margin: 0 auto;
        position: relative;
      }
      .hero-content {
        flex: 1;
      }
      .hero-badge {
        display: inline-block;
        padding: 6px 16px;
        background: rgba(56, 189, 248, 0.12);
        color: #38bdf8;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 24px;
        border: 1px solid rgba(56, 189, 248, 0.28);
      }
      .hero-title {
        font-size: 4.2rem;
        font-weight: 800;
        line-height: 1.12;
        margin-bottom: 24px;
        letter-spacing: -0.025em;
      }
      .hero-title .line1 {
        color: #ffffff;
        display: block;
        text-shadow: 0 2px 24px rgba(0, 0, 0, 0.5);
      }
      .hero-title .line2 {
        color: #f59e0b;
        display: block;
        text-shadow: 0 0 40px rgba(245, 158, 11, 0.35);
      }
      
      .hero-subtitle {
        font-size: 1.18rem;
        color: #94a3b8;
        line-height: 1.65;
        margin-bottom: 40px;
        max-width: 740px;
      }
      
      .hero-actions {
        display: flex;
        gap: 16px;
        align-items: center;
        justify-content: center;
        margin-bottom: 36px;
        flex-wrap: wrap;
      }
      
      .btn-hero-primary {
        background: linear-gradient(90deg, #6b21a8 0%, #4338ca 50%, #3b82f6 100%);
        color: #ffffff;
        padding: 15px 36px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: 0.3px;
        text-decoration: none;
        transition: all 0.25s ease;
        border: none;
        cursor: pointer;
        box-shadow: 0 12px 30px -4px rgba(99, 102, 241, 0.55);
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .btn-hero-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 36px -4px rgba(99, 102, 241, 0.75);
        filter: brightness(1.1);
      }
      .btn-hero-secondary {
        background: rgba(22, 28, 54, 0.65);
        color: #ffffff;
        padding: 15px 32px;
        border-radius: 9999px;
        font-weight: 600;
        text-decoration: none;
        border: 1px solid rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        transition: all 0.2s;
        cursor: pointer;
      }
      .btn-hero-secondary:hover {
        background: rgba(26, 33, 62, 0.85);
        border-color: rgba(56, 189, 248, 0.5);
      }
      
      .hero-trust {
        display: flex;
        gap: 28px;
        font-size: 0.88rem;
        color: #8e9cb5;
        font-weight: 500;
        flex-wrap: wrap;
        justify-content: center;
      }
      .hero-trust span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      
      /* Metrics Strip */
      .metrics-strip {
        background: rgba(14, 18, 38, 0.65);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding: 44px 48px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
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
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        padding: 0 16px;
      }
      .metric-item:last-child {
        border-right: none;
      }
      .metric-val {
        font-size: 2.7rem;
        font-weight: 800;
        color: #fbbf24;
        text-shadow: 0 0 30px rgba(245, 158, 11, 0.3);
        margin-bottom: 8px;
        letter-spacing: -0.02em;
      }
      .metric-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: #8e9cb5;
        letter-spacing: 0.8px;
      }
      
      /* How It Works */
      .how-section {
        padding: 100px 48px 120px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .how-header {
        text-align: center;
        margin-bottom: 64px;
      }
      .how-badge {
        display: inline-block;
        padding: 6px 16px;
        background: rgba(56, 189, 248, 0.12);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.28);
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 18px;
        letter-spacing: 1px;
      }
      .how-title {
        font-size: 2.75rem;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 16px;
        letter-spacing: -0.02em;
      }
      .how-subtitle {
        font-size: 1.12rem;
        color: #94a3b8;
        max-width: 650px;
        margin: 0 auto;
        line-height: 1.65;
      }
      
      .how-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
      }
      .how-card {
        background: rgba(18, 24, 48, 0.75);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 22px;
        padding: 34px 28px;
        box-shadow: 0 14px 34px -4px rgba(0, 0, 0, 0.45);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
      }
      .how-card:hover {
        transform: translateY(-8px);
        border-color: rgba(56, 189, 248, 0.4);
        box-shadow: 0 22px 45px -8px rgba(14, 165, 233, 0.25), 0 0 24px rgba(99, 102, 241, 0.2);
        background: rgba(22, 30, 58, 0.85);
      }
      .hc-badge {
        display: inline-block;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.25));
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.35);
        width: 36px;
        height: 36px;
        line-height: 34px;
        text-align: center;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.95rem;
        margin-bottom: 22px;
        box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
      }
      .hc-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 12px;
      }
      .hc-desc {
        font-size: 0.92rem;
        color: #94a3b8;
        line-height: 1.65;
      }
      
      /* Responsive */
      @media (max-width: 1024px) {
        .how-grid { grid-template-columns: repeat(2, 1fr); }
        .hero-title { font-size: 3rem; }
      }
      @media (max-width: 768px) {
        .landing-hero { padding: 60px 24px; }
        .hero-actions { justify-content: center; }
        .hero-trust { justify-content: center; }
        .landing-nav { padding: 16px 24px; }
        .metrics-container { flex-wrap: wrap; gap: 24px 0; }
        .metric-item { flex: 0 0 50%; border-right: none; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 16px; }
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
          <div style="display: flex; align-items: center; gap: 12px; text-decoration: none; cursor: pointer;" onclick="window.location.hash='/'">
            <img src="/logo.png" alt="FarmChain" class="nav-logo" />
            <span class="nav-brand-text">Farm<span>Chain</span></span>
          </div>
        </div>
        <div class="nav-right">
          <select id="lang-switch-landing" class="landing-lang-select">
            <option value="en" ${i18n.currentLocale === 'en' ? 'selected' : ''}>EN | English</option>
            <option value="hi" ${i18n.currentLocale === 'hi' ? 'selected' : ''}>HI | हिन्दी</option>
            <option value="ta" ${i18n.currentLocale === 'ta' ? 'selected' : ''}>TA | தமிழ்</option>
            <option value="te" ${i18n.currentLocale === 'te' ? 'selected' : ''}>TE | తెలుగు</option>
          </select>
          <button id="login-btn" class="landing-nav-btn">${i18n.t('landing.hero.enterBtn') || 'Explore Platform'}</button>
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
