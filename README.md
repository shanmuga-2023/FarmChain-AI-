# 🌾 FarmChain AI 2.0

### Production-Grade Decentralized Farm-to-Consumer Marketplace & Agritech Trust Protocol

> A full-stack decentralized agricultural platform connecting farmers directly to consumers with **EVM Solidity smart contracts**, **Dual-Mode (Voice 🎤 + Manual ⌨️) Guided Product Listing Wizard**, **Live Farm Camera with In-Pixel Exact GPS Location & Date/Time Timestamp Watermark**, **Client-Side AI Quality Assessment**, **QualityGuard Multi-Tier Anti-Fraud & 3-Strike System**, **Spatial-Temporal QR anti-cloning**, **ERC-4337 Account Abstraction (Gasless Tx & Zero Blockchain Jargon for Farmers)**, **zk-SNARK privacy shielding**, **4-Language Regional Localization (English, Hindi, Tamil, Telugu)**, **dynamic AI-quality-based payment splits**, **Firebase Authentication & Firestore**, **real-time WebSocket sync (Socket.io)**, and **Sybil QR attack detection with escrow freeze**.

[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20-363636?style=for-the-badge&logo=solidity)](blockchain/contracts/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Socket.io-339933?style=for-the-badge&logo=nodedotjs)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite)](frontend/)
[![AI](https://img.shields.io/badge/AI-Produce%20Quality%20Grader%20(A%2FB%2FC)-FF6F00?style=for-the-badge&logo=tensorflow)](frontend/src/ai/crop-grader.js)
[![Anti-Fraud](https://img.shields.io/badge/Security-QualityGuard%203--Strikes-dc2626?style=for-the-badge)](frontend/src/ai/quality-guard.js)
[![Live Camera](https://img.shields.io/badge/Proof%20of%20Harvest-Exact%20GPS%20%2B%20Date%2FTime%20Watermark-059669?style=for-the-badge)](frontend/src/components/live-camera.js)
[![ERC-4337](https://img.shields.io/badge/ERC--4337-Zero%20Blockchain%20Jargon-8247E5?style=for-the-badge&logo=ethereum)](frontend/src/web3/gasless.js)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](frontend/src/firebase/)
[![Voice AI](https://img.shields.io/badge/Voice%20AI-Web%20Speech%20(EN%2C%20HI%2C%20TA%2C%20TE)-f59e0b?style=for-the-badge)](frontend/src/utils/voice.js)
[![Security](https://img.shields.io/badge/Security-Geo--Velocity%20%2B%20Anti--Clone-06b6d4?style=for-the-badge)](frontend/src/ai/geo-velocity.js)

---

## 📌 Problem & Enterprise Solution

Indian farmers routinely lose **40–60% of crop value** to opaque intermediary markups, arbitrary spot prices, paper certificate fraud, and delayed payment settlements. Beyond this, **five critical trust and usability gaps** plague conventional agricultural supply chains:

1. **The GIGO Problem**: Blockchain is immutable — but if a farmer lies and registers rotten produce as "Grade A Organic," the blockchain merely records a lie forever.
2. **The Agricultural Fraud Problem (Cheating Intermediary / Retailer / Consumer)**: What if a farmer uploads downloaded stock photos of healthy crops from the internet instead of their own farm harvest? What if produce arrives degraded or rotten?
3. **The Technology & Jargon Barrier**: Rural Indian farmers will not manage 12-word seed phrases, hex wallet addresses, gas fees, or complex crypto dashboards. Interface terminology must be 100% farmer-centric.
4. **The Input Accessibility Barrier**: A farmer standing in a field with soiled hands needs to speak naturally in their native tongue (Tamil, Hindi, Telugu, English) OR use large tactile touch buttons — both must be equal, first-class listing methods.
5. **The Photocopy Attack**: QR codes are cryptographic, but what stops an intermediary or retailer from printing 100 copies of a genuine QR code and pasting it on cheap, substandard produce?

**FarmChain AI 2.0** solves all of these through:

1. **🎙️ Dual-Mode (Voice 🎤 + Manual ⌨️) Guided Product Listing Wizard ([`product-wizard.js`](frontend/src/pages/farmer/product-wizard.js))**:
   - 4-step progressive wizard: **Details (Speak/Type) → Photo (Live Camera/Upload) → Review & Confirm → Silent Smart-Wallet Listing**.
   - Farmer can toggle freely between **🎤 Speak** and **⌨️ Type Manually** without losing any entered data.
   - Multilingual speech recognition auto-parses numbers and crop names across **Tamil, Hindi, Telugu, and English**.
   - Sticky footer with guaranteed visible Next/Review buttons, tactile mode buttons, and custom dropdown styling.
   - Built-in multi-language SpeechSynthesis Read-Aloud for hands-free confirmation before publishing.
2. **📸 Live Farm Camera with In-Pixel Exact GPS & Date/Time Timestamp ([`live-camera.js`](frontend/src/components/live-camera.js))**:
   - Direct hardware camera integration prevents uploading downloaded stock photos from the internet.
   - **Multi-layer GPS location acquisition** (Hardware GPS + Browser Geolocation + Network IP fallback) with real-time reverse geocoding via BigDataCloud & Nominatim to exact village/town, district, and state.
   - **Manual precision refinement** box with one-tap presets for agricultural hubs (Thuraiyur, Trichy, Coimbatore, Nashik, etc.).
   - Live clock ticking date and timestamp (`📅 24-Sep-2026, 08:35 PM IST`).
   - Location, coordinates, accuracy ($\pm 15\text{m}$), and timestamp are **permanently burned into the canvas image pixels**.
   - Dedicated **"📸 Live Farm Camera"** button on the Farmer Products page and Dashboard for instant field verification and 1-click crop listing.
3. **🤫 Zero Blockchain Jargon for Farmers ([`gasless.js`](frontend/src/web3/gasless.js), [`product-wizard.js`](frontend/src/pages/farmer/product-wizard.js))**:
   - All Web3 complexities (smart contract calls, gas fees, private keys, wallet signatures) execute **100% silently in the background** via ERC-4337 Account Abstraction and Paymaster sponsorship.
   - Farmer only sees familiar agricultural terms: *"Produce Batch"*, *"Harvest Date"*, *"Guaranteed Payout (60% min)"*, *"Produce Listed for Sale! 🎉"*.
4. **🔬 In-Browser AI Produce Quality Grader ([`crop-grader.js`](frontend/src/ai/crop-grader.js), [`visual-oracle.js`](frontend/src/ai/visual-oracle.js))**:
   - Edge AI grading (Grade A / B / C) evaluates produce freshness, color saturation, and uniformity directly in-browser.
   - Grading is an advisory helper that attracts premium buyers — it never blocks a farmer from listing if offline or if sensors fail.
5. **🛡️ QualityGuard Multi-Tier Anti-Fraud & 3-Strike System ([`quality-guard.js`](frontend/src/ai/quality-guard.js))**:
   - **3-Strike System**: Strike 1 = formal warning + payout penalty; Strike 2 = product delisting + public fraud flag; Strike 3 = account permanently suspended.
   - **Intermediary Checkpoint Re-Verification**: Intermediaries re-scan goods upon arrival; if quality degrades $> 20\%$, an automated dispute is filed and smart escrow holds funds.
   - **Farmer Reputation Score**: 0–100 dynamic trust score visible on all product listings.
6. **🛡️ Spatial-Temporal QR Anti-Cloning ([`geo-velocity.js`](frontend/src/ai/geo-velocity.js))**:
   - Records geolocation + timestamp on every consumer scan. Uses the **Haversine formula** to calculate velocity between scans.
   - If the same batch is scanned in Mumbai and Delhi within 10 minutes (12,500 km/h), it's immediately flagged as **CLONE_DETECTED**.
7. **💰 Dynamic AI-Quality Payment Splits ([`contracts.js`](frontend/src/blockchain/contracts.js))**: AI Quality Score ≥95% → Farmer gets **65%** (up from 60%) with platform fee waived. Score <60% → Farmer gets 55% with extra allocated to a Quality Assurance fund.
8. **🔒 zk-SNARK Volume Privacy ([`dashboard.js`](frontend/src/pages/intermediary/dashboard.js))**: Intermediaries can shield wholesale volume and revenue data from competitors using a zero-knowledge privacy toggle.
9. **🧪 Sybil QR Attack Simulation ([`fraud.js`](frontend/src/pages/admin/fraud.js))**: Admin can simulate 5 concurrent QR scans across Indian cities — triggers automatic escrow fund freeze via smart contract.
10. **💳 Automated Escrow ([`MarketplaceEscrow.sol`](blockchain/contracts/MarketplaceEscrow.sol))**: Smart contract enforces revenue splits upon delivery verification.
11. **📡 Wi-Fi Resilient Mandi Oracle ([`api.js`](frontend/src/utils/api.js))**: Streams live commodity spot rates with offline caching.
12. **🔥 Firebase Integration ([`firebase/`](frontend/src/firebase/))**: Firebase Authentication (Email/Password + Phone OTP) and Firestore for persistent cloud-synced data.
13. **🌐 Complete Vernacular Localization & Parity Engine ([`i18n/`](frontend/src/i18n/index.js), [`translations.js`](frontend/src/i18n/translations.js))**:
    - Full-platform, zero-lag dynamic language switching across 4 languages: **English (`en`)**, **Hindi (`hi`)**, **Tamil (`ta`)**, and **Telugu (`te`)**.
    - Over 1,217 localized keys per language with strict 100% 1:1 key parity, no empty strings, and zero untranslated fallbacks.
    - Verified by automated AST & dictionary CI validator ([`scripts/check-i18n.js`](scripts/check-i18n.js)).
    - Seamlessly integrated with Web Speech recognition and synthesis for native vernacular audio assistance.

---

## 🗺️ Role-Based Modules & Key Capabilities

| Role | Core Workflows | Killer Feature Highlights |
|:-----|:---------------|:--------------------------|
| 🌾 **Farmer** | Dual-Mode Listing Wizard (Voice 🎤 + Manual ⌨️), Live Farm Camera with GPS & Timestamp, Orders | 📸 **Live Farm Camera** with in-pixel GPS coordinates & date/timestamp, 🎙️ **Dual-Mode 4-Step Listing Wizard** (Voice & Manual as first-class inputs), 🤫 **Zero Blockchain Terminology**, 🌐 Full **Tamil, Hindi, Telugu, English** localization, 🔬 AI Quality Grade badge, 🛡️ QualityGuard reputation profile, ⛽ ₹0 Gas Paymaster |
| 🏪 **Intermediary** | Bulk Procurement, Quality Re-Verification, Privacy | 🔬 **Quality Checkpoint Re-Verification** (scans received batches; triggers auto-dispute if quality dropped >20%), 🔒 zk-SNARK volume privacy toggle, B2B wholesale routing, automated margin tracking |
| 🛒 **Retailer** | Wholesale Sourcing, Shelf QR | 🔬 Verified AI Quality Grade badge & Live GPS tags on catalog items, printable QR tags |
| 👤 **Consumer** | Marketplace, Trace, Anti-Cloning | 🛡️ Spatial-temporal QR clone detection, velocity-based fraud alerts, AI quality score & GPS harvest proof display, dynamic price splits |
| 🔧 **Admin** | Security, Fraud, Sybil Detection, Forecasting | 🛡️ Quality fraud alerts & repeat offender tracking, 🧪 Sybil QR attack simulation (5-city concurrent scan), escrow freeze trigger, demand forecasting, blockchain explorer, user management |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Vite + Vanilla JS)                          │
│  • SPA Router with RBAC Guards & In-Page Smooth Anchor Scrolling               │
│  • 🔬 AI Visual Quality Oracle (MobileNet v2: Poor/Average/Good Formula)       │
│  • 📸 Live Camera Capture (In-Pixel GPS + Timestamp Canvas Watermark)          │
│  • 🛡️ QualityGuard Multi-Tier Anti-Fraud (3-Strike Rule & Checkpoint Disputes) │
│  • 🛡️ Spatial-Temporal QR Anti-Cloning (Haversine Velocity Engine)             │
│  • ⛽ ERC-4337 Account Abstraction (Phone OTP + Paymaster)                     │
│  • 🎙️ Vernacular Voice Recognition (Hindi, Tamil, English)                     │
│  • 🔒 zk-SNARK Volume Privacy Toggle                                          │
│  • 5 Role Dashboards (Farmer, Intermediary, Retailer, Consumer, Admin)         │
│  • 🔔 Interactive Notification Center (ORDER_PLACED, ORDER_STATUS)             │
│  • i18n Translation Engine (English, Hindi, Tamil, Telugu)                     │
│  • 🔥 Firebase Auth (Email/Password + Phone OTP) & Firestore                  │
└───────────────────────────────────┬────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────────────────┐
       ▼                            ▼                                        ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────────┐
│ Real-Time    │             │ Smart        │             │ AI & Cybersec    │
│ Backend API  │             │ Contracts    │             │ Intelligence     │
│ • Express.js │             │ • Solidity   │             │ • Visual Oracle  │
│ • Socket.io  │             │ • Hardhat    │             │   (MobileNet v2) │
│ • Live Mandi │             │ • Polygon /  │             │ • QualityGuard   │
│   Oracle     │             │   Base       │             │   Anti-Fraud     │
│ • JSON DB    │             │ • AI Quality │             │ • Geo-Velocity   │
│ • REST API   │             │   Fields     │             │ • Fraud Detector │
│ (Port 4000)  │             │ • Escrow     │             │ • Demand ML      │
└──────────────┘             └──────────────┘             └──────────────────┘
```

---

## 📁 Project Structure (Monorepo)

```
farmchain-ai/
├── frontend/                          # Vite + Vanilla JS SPA
│   ├── index.html                     # App entry point
│   ├── vite.config.js                 # Vite dev server config (port 5173)
│   ├── public/                        # Static assets (favicon, images)
│   └── src/
│       ├── main.js                    # SPA router, RBAC guards, app bootstrap
│       ├── ai/                        # AI & ML modules (all edge/in-browser)
│       │   ├── visual-oracle.js       # MobileNet v2 3-class quality scoring
│       │   ├── quality-guard.js       # QualityGuard anti-fraud & 3-strike engine
│       │   ├── geo-velocity.js        # Haversine spatial-temporal QR anti-cloning
│       │   ├── fraud-detector.js      # Anomaly detection & fraud alerting
│       │   ├── demand-forecaster.js   # ML-based demand prediction
│       │   └── price-predictor.js     # AI fair-price suggestion engine
│       ├── blockchain/                # On-chain interaction layer
│       │   ├── contracts.js           # ABI bindings & smart contract calls
│       │   └── core.js               # Blockchain core utilities
│       ├── web3/                      # Web3 wallet & gasless infrastructure
│       │   ├── gasless.js             # ERC-4337 Account Abstraction + Paymaster
│       │   ├── provider.js            # Ethers.js provider setup
│       │   └── contracts.js           # Contract address registry
│       ├── firebase/                  # Firebase integration
│       │   ├── config.js              # Firebase project configuration
│       │   ├── auth.js                # Firebase Authentication (Email + Phone)
│       │   └── firestore.js           # Firestore database operations
│       ├── pages/                     # Role-based dashboard pages
│       │   ├── landing.js             # Public landing page
│       │   ├── auth.js                # Login / Register page
│       │   ├── farmer/                # Farmer role
│       │   │   ├── dashboard.js       # Farmer dashboard + Live Farm Camera quick action
│       │   │   ├── product-wizard.js  # Dual-Mode (Voice 🎤 + Manual ⌨️) guided 4-step wizard
│       │   │   ├── products.js        # Harvest products + Live Farm Camera + verification modal
│       │   │   └── orders.js          # Order management
│       │   ├── intermediary/          # Intermediary role
│       │   │   ├── dashboard.js       # Checkpoint Re-Verification + zk-SNARK privacy
│       │   │   └── inventory.js       # Inventory management
│       │   ├── retailer/              # Retailer role
│       │   │   ├── dashboard.js       # Retailer dashboard
│       │   │   └── source.js          # B2B sourcing catalog + Quality badges
│       │   ├── consumer/              # Consumer role
│       │   │   ├── marketplace.js     # Consumer marketplace
│       │   │   ├── orders.js          # Consumer orders
│       │   │   └── trace.js           # QR traceability + anti-cloning demo
│       │   └── admin/                 # Admin role
│       │       ├── dashboard.js       # Admin dashboard
│       │       ├── fraud.js           # Quality fraud signals & Sybil QR simulation
│       │       ├── explorer.js        # Blockchain explorer
│       │       ├── forecast.js        # Demand forecasting
│       │       └── users.js           # User management
│       ├── components/                # Reusable UI components
│       │   ├── sidebar.js             # Navigation sidebar
│       │   ├── live-camera.js         # Live camera modal with GPS + date watermark
│       │   ├── notification-center.js # Real-time notification panel
│       │   ├── charts.js              # Chart.js wrapper components
│       │   ├── camera-qr-scanner.js   # QR code camera scanner
│       │   └── wallet-connect.js      # Wallet connection widget
│       ├── utils/                     # Shared utilities
│       │   ├── api.js                 # Backend API client + offline cache
│       │   ├── voice.js               # Vernacular voice recognition
│       │   ├── router.js              # Client-side SPA router
│       │   ├── notifications.js       # Notification system
│       │   ├── qr.js                  # QR code generation
│       │   ├── helpers.js             # Common helper functions
│       │   └── sanitize.js            # Input sanitization
│       ├── i18n/                      # Internationalization
│       │   ├── index.js               # i18n engine
│       │   └── translations.js        # EN, HI, TA, TE translations
│       ├── data/                      # Client-side data
│       │   ├── store.js               # State management store
│       │   └── seed.js                # Demo seed data
│       └── styles/                    # CSS stylesheets
│           ├── index.css              # Global styles & design tokens
│           ├── components.css         # Component-level styles
│           └── dashboard.css          # Dashboard layout styles
│
├── backend/                           # Express.js + Socket.io API Server
│   ├── index.js                       # Server entry point (port 4000)
│   ├── db.js                          # JSON file-based persistent database
│   ├── data_store.json                # Persistent data file
│   ├── routes/
│   │   └── api.js                     # REST API routes (products, orders, mandi)
│   └── services/
│       └── mandiData.js               # Live Mandi spot rate data service
│
├── blockchain/                        # Hardhat + Solidity smart contracts
│   ├── hardhat.config.cjs             # Hardhat config (Polygon Amoy, Base Sepolia)
│   ├── contracts/
│   │   ├── MarketplaceEscrow.sol      # Trustless escrow & dynamic payment splits
│   │   ├── ProductRegistry.sol        # Immutable batch registration + AI Oracle
│   │   ├── SupplyChainTracker.sol     # Checkpoint & cold-chain temperature logs
│   │   └── QualityCertifier.sol       # Organic & AGMARK lab verifications
│   └── scripts/
│       └── deploy.js                  # Contract deployment script
│
├── scripts/
│   ├── check-i18n.js                  # 100% i18n parity & AST missing-key validator
│   └── apply-all-translations.js      # Monorepo translation generator
├── package.json                       # Root monorepo package.json
├── problemdetail.md                   # Comprehensive problem & solution spec
├── walkthrough.md                     # Feature walkthrough & judge defense guide
└── README.md                          # This file
```

---

## 📦 Smart Contract Suite (`blockchain/contracts/`)

| Contract | Purpose | Key Functions |
|:---------|:--------|:--------------|
| [`MarketplaceEscrow.sol`](blockchain/contracts/MarketplaceEscrow.sol) | Trustless escrow & automated dynamic splits | `createOrder()`, `confirmShipment()`, `confirmDeliveryAndRelease()` |
| [`ProductRegistry.sol`](blockchain/contracts/ProductRegistry.sol) | Immutable batch registration + **AI Quality Oracle binding** | `registerProduct(... aiQualityScore, aiQualityGrade, imageIpfsHash)`, `ProductQualityVerified` event |
| [`SupplyChainTracker.sol`](blockchain/contracts/SupplyChainTracker.sol) | Checkpoint and cold-chain temperature logs | `logCheckpoint()`, `getProductCheckpoints()` |
| [`QualityCertifier.sol`](blockchain/contracts/QualityCertifier.sol) | Organic & AGMARK lab test verifications | `authorizeInspector()`, `issueCertificate()` |

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | Vite + Vanilla JS | SPA with client-side routing, no framework overhead |
| **Styling** | Vanilla CSS + DM Sans / DM Serif Display | Premium design system with glassmorphism |
| **AI / ML** | TensorFlow.js (MobileNet v2) | In-browser edge AI visual quality scoring |
| **Charts** | Chart.js | Dashboard visualizations & analytics |
| **Blockchain** | Solidity 0.8.20 + Hardhat | Smart contract development & deployment |
| **Web3** | Ethers.js v6 | Blockchain interaction layer |
| **ERC-4337** | Account Abstraction (Paymaster) | Gasless transactions for farmers |
| **Auth** | Firebase Authentication | Email/Password + Phone OTP login |
| **Database** | Firebase Firestore + JSON file DB | Cloud-synced + local persistent storage |
| **Backend** | Express.js + Socket.io | REST API + real-time WebSocket sync |
| **QR** | qrcode + html5-qrcode | QR generation & camera scanning |
| **i18n** | Custom engine | English, Hindi, Tamil, Telugu |
| **Voice** | Web Speech API | Vernacular voice input |
| **Networks** | Polygon Amoy, Base Sepolia | EVM testnet deployment targets |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### 1. Install Dependencies

```bash
npm install
```

> This installs all dependencies for the frontend, backend, and blockchain from the root `package.json`.

### 2. Compile Solidity Smart Contracts

```bash
npm run compile:contracts
```

### 3. Start the Real-Time Sync Backend Server (Port 4000)

```bash
npm run server
```

The backend server provides:
- Live Mandi Spot Rates Oracle: `GET http://localhost:4000/api/mandi-rates`
- Product Registry API: `GET/POST/PATCH/DELETE http://localhost:4000/api/products` (Full CRUD + `GET /api/products/:id`)
- Order Settlement API: `GET/POST/PATCH http://localhost:4000/api/orders`
- Health Check: `GET http://localhost:4000/api/health`

### 4. Start the Frontend Application (Port 5173)

```bash
npm run dev
```

Open **http://localhost:5173/** in your browser.

### 5. Build for Production (Optional)

```bash
npm run build
npm run preview
```

### 6. Verify i18n Localization Parity (Optional)

```bash
node scripts/check-i18n.js
```

> Runs a full verification scan across all 1,217+ translation keys in `en`, `hi`, `ta`, and `te`, ensuring 100% 1:1 key parity, no empty strings, and zero missing keys.

---

## 👥 Demo Logins

Pre-configured demo accounts for testing all 5 stakeholder roles:

| Role | Email | Password | Alt Login |
|:-----|:------|:---------|:----------|
| 🌾 **Farmer** | `farmer@farmchain.io` | `farmer123` | 📱 Phone OTP (Gasless) |
| 🏪 **Intermediary** | `trader@farmchain.io` | `trader123` | |
| 🛒 **Retailer** | `retailer@farmchain.io` | `retailer123` | |
| 👤 **Consumer** | `consumer@farmchain.io` | `consumer123` | 📱 Phone OTP (Gasless) |
| 🔧 **Admin** | `admin@farmchain.io` | `admin123` | |

---

---

## 🛡️ Anti-Fraud & Quality Protection Architecture (Judge Q&A Guide)

> **Judges' Critical Question:**  
> *"If a farmer delivers poor quality or waste produce, or cheats the intermediary, retailer, and consumer — what is the solution?"*

FarmChain AI 2.0 implements a **4-tier defense architecture** that prevents, detects, isolates, and penalizes agricultural fraud across the supply chain:

```
┌────────────────────────────────────────────────────────────────────────┐
│               FarmChain AI 2.0 — 4-Tier Anti-Fraud Architecture        │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 1: CAPTURE & PROOF OF HARVEST                                     │
│  • Hardware Live Camera Stream (Blocks stock/internet image uploads)   │
│  • In-Pixel Watermarking: GPS coordinates, District, Live Timestamp   │
│  • Cryptographic SHA-256 Harvest Proof Hash burned into pixels         │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 2: EDGE AI QUALITY & FRESHNESS GATE                               │
│  • MobileNet V2 3-Class Classifier (Grade A / Grade B / Waste Reject)  │
│  • Rotten & Waste Produce Hard-Rejection (>65% minimum quality floor)  │
│  • AI Fair-Price Suggestion anchored to government MSP mandi rates     │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 3: CHECKPOINT RE-VERIFICATION & SMART ESCROW                      │
│  • Intermediary & Retailer arrival scanning with dispute triggers      │
│  • Delta check: >20% quality degradation halts transaction             │
│  • MarketplaceEscrow.sol holds funds until physical receipt verified   │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 4: REPUTATION, 3-STRIKE PENALTIES & GEO-VELOCITY DEFENSE          │
│  • QualityGuard 3-Strike System: 3 verified disputes = permanent ban   │
│  • Public trust & reputation scores (0-100) visible across network     │
│  • Geo-Velocity Sybil Defense: Impossible multi-city QR scan freezes   │
└────────────────────────────────────────────────────────────────────────┘
```

### Direct Judge Q&A Matrix

| Attack / Cheat Scenario | FarmChain AI Defense Mechanism | Technical Enforcement |
|:---|:---|:---|
| **Farmer uploads stock/downloaded photos of healthy crops from internet** | **Hardware Live Camera + In-Pixel Watermark**: Direct hardware camera stream with multi-layer GPS and reverse geocoding. Real-time GPS coordinates, village/district location, and date/time timestamp are rendered and permanently burned into the canvas image buffer. | [`live-camera.js`](frontend/src/components/live-camera.js)<br>`LiveCamera.stampImage()` & `LiveCamera.generateProofHash()` creates a SHA-256 fingerprint. |
| **Farmer intimidated by crypto/blockchain jargon** | **Zero Blockchain Terminology**: No wallet addresses, private keys, gas fees, or transaction hashes shown to the farmer. The wizard operates with familiar terms: *"Produce Batch"*, *"Harvest Date"*, *"Guaranteed Payout (60% min)"*, *"Produce Listed for Sale! 🎉"*. | [`product-wizard.js`](frontend/src/pages/farmer/product-wizard.js), [`gasless.js`](frontend/src/web3/gasless.js) |
| **Hands soiled in field / illiterate farmer** | **Dual-Mode (Voice 🎤 + Manual ⌨️) Guided Wizard**: Farmer speaks or types crop name, quantity, and price. Multi-language speech recognition parses Hindi, Tamil, Telugu, and English, with built-in Read-Aloud TTS for auditory confirmation. | [`voice.js`](frontend/src/utils/voice.js), [`i18n/index.js`](frontend/src/i18n/index.js) |
| **Farmer attempts to register rotten, diseased, or waste crop** | **MobileNet V2 3-Class Scoring Gate & Crop Grader**: Client-side edge AI classifies produce freshness into Grade A / B / C badges with objective quality scores. | [`crop-grader.js`](frontend/src/ai/crop-grader.js), [`visual-oracle.js`](frontend/src/ai/visual-oracle.js) |
| **Farmer takes photo of a good tomato sample, but ships rotten crates to the intermediary** | **Intermediary Checkpoint Re-Verification**: Intermediary inspects and re-scans upon arrival. If re-scanned score drops $>20\%$ below farmer's registered score, an automatic dispute is created. | [`dashboard.js`](frontend/src/pages/intermediary/dashboard.js)<br>`QualityGuard.handleQualityDispute()` |
| **Financial loss to buyer / intermediary** | **Trustless Smart Escrow Hold**: Buyer funds are held in `MarketplaceEscrow.sol`. Funds are only released upon checkpoint verification. Disputed funds are automatically refunded to the buyer. | [`MarketplaceEscrow.sol`](blockchain/contracts/MarketplaceEscrow.sol) |
| **Repeat offenders & bad actors** | **QualityGuard 3-Strike System**: Farmers accumulating 3 verified quality disputes are permanently suspended. Every dispute reduces the farmer's public reputation score (0–100). | [`quality-guard.js`](frontend/src/ai/quality-guard.js)<br>`QualityGuard.recordQualityResult()` |
| **Retailer / consumer transparency** | **Traceability & Verification Badges**: Retailer and consumer dashboards display verified AI quality percentages, grades (A+/A/B/C), and harvest GPS proof tags. | [`source.js`](frontend/src/pages/retailer/source.js), [`trace.js`](frontend/src/pages/consumer/trace.js) |

---

## 🧪 1-Click Judge Demo Showcase Guide

### 🔬 Demo 1: Live Farm Camera with Exact GPS & Date/Time Watermark
1. Log in as Farmer (`farmer@farmchain.io` or click Farmer demo card).
2. Go to **My Products** → Click **📸 Live Farm Camera** in the topbar (or **Open Live Camera** in the banner).
3. In the Live Camera modal:
   - Notice the live viewfinder with **Exact Location** (`📍 Thuraiyur, Tiruchirappalli, Tamil Nadu • 11.1481°N, 78.5991°E`).
   - Notice the live **Date & Timestamp** clock updating every second (`📅 24-Sep-2026, 08:35 PM IST`).
   - Try clicking **✏️ Edit** to test manual location pinpointing or tap a quick agricultural hub preset (Thuraiyur, Trichy, Coimbatore, Nashik).
4. Click **📸 Capture & Verify**:
   - Location, coordinates, accuracy (±15m), and timestamp are **burned directly into the canvas pixels**.
   - Review the captured sample with the anti-fraud watermark bar.
5. Click **✅ Use This Photo**:
   - Farm Verification modal opens with exact coordinates, date/timestamp, and SHA-256 cryptographic proof hash.
   - Click **➕ List This Crop for Sale** → Add Product Wizard opens with this verified photo, exact location, and timestamp pre-loaded!

### 🎙️ Demo 2: Dual-Mode (Voice 🎤 + Manual ⌨️) Guided Listing Wizard
1. On the **My Products** page, click **➕ Add Product** (or continue from Live Camera above).
2. At the top of Step 1, notice the prominent mode toggle: **🎤 Speak** and **⌨️ Type Manually**:
   - Tap **🎤 Speak**: Speak *"500 kg Basmati Rice at 48 rupees"* in English, Hindi, Tamil, or Telugu.
   - Live transcript box updates in real-time, parsing crop name, quantity, unit, and price.
   - Switch to **⌨️ Type Manually** anytime — zero data is lost.
   - Inspect the custom high-contrast dropdowns (Category, Unit, Organic) with visible chevrons.
3. Notice the **Sticky Footer**: The **Continue to Photo 📸 →** button is pinned at the bottom and 100% visible without scrolling.
4. Click **Continue to Photo 📸 →**:
   - Step 2 displays the photo preview with the **Live Camera Sensor Verified** badge showing exact location and capture timestamp.
   - Client-side AI produces freshness Grade (Grade A/B/C) with freshness score.
5. Click **Continue to Review 📋 →**:
   - Step 3 displays the summary card with guaranteed 60% minimum payout, price breakdown, exact GPS origin, and harvest timestamp.
   - Click **🔊 Listen to Summary Aloud** to hear the complete batch details read aloud in your chosen language.
6. Click **🚀 List for Sale in Marketplace**:
   - Step 4 displays instant celebration screen ("Produce Listed for Sale! 🎉") with **Zero Blockchain Jargon**.

### 🌐 Demo 3: Instant Vernacular Localization (English / Hindi / Tamil / Telugu)
1. On any page (Landing, Farmer Dashboard, Marketplace, Consumer Trace, or Product Wizard), locate the **Language Selector** in the navigation header.
2. Switch between **English (EN)**, **हिंदी (HI)**, **தமிழ் (TA)**, and **తెలుగు (TE)**.
3. Observe **zero-lag, instant translation** across the entire UI:
   - Dynamic buttons, status badges, metrics, modal dialogs, and validation toasts.
   - Crop names, units, mandi spot rate updates, and role-specific agricultural terminology.
   - 100% 1:1 key parity across 1,217+ translated strings with zero untranslated fallback glitches.
4. Voice Wizard and Text-to-Speech (`🔊 Listen to Summary Aloud`) automatically switch their speech recognition and voice models to match your chosen vernacular language.

### 🛡️ Demo 4: Spatial-Temporal QR Anti-Cloning (Solves Photocopy Attack)
1. Log in as Consumer (`consumer@farmchain.io`) → Navigate to **Trace Product**.
2. Click **✅ Test Authentic Batch** → see full blockchain journey with "🟢 Spatially Verified" badge.
3. Click **📋 Test Cloned QR (Photocopy Attack)** → triggers a Mumbai→Delhi clone detection:
   - **🚨 CYBERSECURITY ALERT: QR Clone Detected**
   - Velocity: **12,500 km/h** (faster than a fighter jet)
   - Visual comparison: Car (120 km/h) → Train (300 km/h) → Aircraft (900 km/h) → **This QR: 12,500 km/h**
   - Recommendation: **DO NOT PURCHASE**
4. Click **🚨 Test Spoofed / Fake QR** → triggers **Cryptographic Verification Failed** security rejection.

### ⛽ Demo 5: Account Abstraction / Gasless Login (Solves Adoption)
1. Go to the **Login Page**.
2. In the "📱 Phone OTP Login (ERC-4337)" section, enter any 10-digit number.
3. Click **📱 Send OTP** → OTP is auto-displayed for judges.
4. Enter the OTP → **Smart Wallet Created!** — no MetaMask, no seed phrase.
5. See the wallet address and "Gas: Sponsored by Paymaster" confirmation.
6. Register a product as farmer → notice "⛽ Gas: ₹0.00 · Sponsored by FarmChain Paymaster".

### 🔒 Demo 6: zk-SNARK Privacy Toggle
1. Log in as Intermediary (`trader@farmchain.io`).
2. See the **🔒 Zero-Knowledge Volume Privacy** banner.
3. Toggle the switch ON → all stat card values replaced with 🔒, charts blurred with "ZK-SHIELDED" overlay.
4. Toggle OFF → values restored.

### 🧪 Demo 7: Sybil QR Attack Simulation
1. Log in as Admin (`admin@farmchain.io`) → Go to **Fraud Alerts**.
2. Click **🧪 Simulate Sybil QR Attack (Cloned Labels)**.
3. See 5 simultaneous scans across Mumbai, Delhi, Bangalore, Chennai, Kolkata — all within 2 minutes.
4. **Escrow Funds FROZEN** notification from MarketplaceEscrow.sol.

### 💰 Demo 8: Dynamic Quality-Based Payment Splits
1. After registering a product with AI score ≥95%, navigate to the Consumer Trace page.
2. See the Price Transparency chart: Farmer **65%** (up from 60%), Platform **0%** (waived).
3. The "🏆 High-Quality Bonus Active" badge is displayed.

### 📊 Demo 9: Admin Analytics & Blockchain Explorer
1. Log in as Admin (`admin@farmchain.io`).
2. Navigate to **Dashboard** → view platform-wide analytics, user stats, and revenue metrics.
3. Go to **Blockchain Explorer** → browse on-chain transactions, blocks, and contract events.
4. Visit **Demand Forecast** → see AI-driven demand prediction charts for crop categories.

### 🔬 Demo 10: Intermediary Quality Re-Verification & Dispute Resolution (Anti-Fraud Checkpoint)
1. Log in as Intermediary (`trader@farmchain.io`).
2. Scroll to the **🔬 Quality Re-Verification (Anti-Fraud)** section.
3. Notice received product batches with farmer's initial registered quality score.
4. Click **🔬 Re-Verify Quality** on an incoming batch:
   - System runs a secondary verification scan simulating warehouse arrival.
   - If quality matches → **"✅ Quality Confirmed: Escrow Released"**.
   - If quality degraded >20% (e.g., initial 88% → arrival 42%) → **"🚨 Quality Dispute Raised: Escrow Frozen & Farmer Issued Strike 1"**.

### ⭐ Demo 11: QualityGuard 3-Strike Penalty & Farmer Trust Scores
1. Log in as Farmer (`farmer@farmchain.io`) → Go to **My Products**.
2. Notice the **Farmer Trust Profile Banner**:
   - Dynamic **Reputation Score** (e.g., `85/100 · Good Standing`).
   - Active **Strikes Gauge** (e.g., `1 / 3 Strikes · ⚠️ Warning Active`).
   - Quality Tier breakdown: Good / Average / Poor historical delivery ratio.
3. Log in as Admin (`admin@farmchain.io`) → **Fraud Alerts**:
   - Inspect active signals: `QUALITY_MISMATCH`, `REPEAT_QUALITY_OFFENDER`, and `WASTE_PRODUCT_ATTEMPT`.

---

## 🌐 Network Configuration

Smart contracts are configured for deployment on:

| Network | Chain ID | RPC Endpoint |
|:--------|:---------|:-------------|
| **Hardhat (Local)** | 31337 | `http://127.0.0.1:8545` |
| **Polygon Amoy** | 80002 | `https://rpc-amoy.polygon.technology/` |
| **Base Sepolia** | 84532 | `https://sepolia.base.org` |

Set environment variables for testnet deployment:
```bash
export PRIVATE_KEY="your-wallet-private-key"
export POLYGON_AMOY_RPC="https://rpc-amoy.polygon.technology/"
export BASE_SEPOLIA_RPC="https://sepolia.base.org"
```

---

## 📜 License

MIT License. Developed for transparent agriculture, fair farmer compensation, and tamper-proof food supply chains.
