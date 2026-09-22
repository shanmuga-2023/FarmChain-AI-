# 🌾 FarmChain AI 2.0

### Production-Grade Decentralized Farm-to-Consumer Marketplace & Agritech Trust Protocol

> A full-stack decentralized agricultural platform connecting farmers directly to consumers with **EVM Solidity smart contracts**, **MobileNet V2 3-Class Quality Scoring Pipeline**, **Live Camera with In-Pixel GPS & Timestamp Watermark**, **QualityGuard Multi-Tier Anti-Fraud & 3-Strike System**, **Spatial-Temporal QR anti-cloning**, **ERC-4337 Account Abstraction (Gasless Tx)**, **zk-SNARK privacy shielding**, **vernacular voice-based crop registration (Hindi, Tamil, English)**, **dynamic AI-quality-based payment splits**, **Firebase Authentication & Firestore**, **real-time WebSocket sync (Socket.io)**, and **Sybil QR attack detection with escrow freeze**.

[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20-363636?style=for-the-badge&logo=solidity)](blockchain/contracts/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Socket.io-339933?style=for-the-badge&logo=nodedotjs)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite)](frontend/)
[![AI](https://img.shields.io/badge/AI-MobileNet%20v2%20(Poor%2FAvg%2FGood)-FF6F00?style=for-the-badge&logo=tensorflow)](frontend/src/ai/visual-oracle.js)
[![Anti-Fraud](https://img.shields.io/badge/Security-QualityGuard%203--Strikes-dc2626?style=for-the-badge)](frontend/src/ai/quality-guard.js)
[![Live Camera](https://img.shields.io/badge/Proof%20of%20Harvest-GPS%20%2B%20Timestamp%20Watermark-059669?style=for-the-badge)](frontend/src/components/live-camera.js)
[![ERC-4337](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-8247E5?style=for-the-badge&logo=ethereum)](frontend/src/web3/gasless.js)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](frontend/src/firebase/)
[![Voice](https://img.shields.io/badge/Voice%20AI-Web%20Speech%20API%20(HI%2C%20TA%2C%20EN)-f59e0b?style=for-the-badge)](frontend/src/utils/voice.js)
[![Security](https://img.shields.io/badge/Security-Geo--Velocity%20%2B%20RBAC%20%2B%20Anti--Clone-06b6d4?style=for-the-badge)](frontend/src/ai/geo-velocity.js)

---

## 📌 Problem & Enterprise Solution

Indian farmers routinely lose **40–60% of crop value** to opaque intermediary markups, arbitrary spot prices, paper certificate fraud, and delayed payment settlements. Beyond this, **four critical trust gaps** plague conventional agricultural supply chains:

1. **The GIGO Problem**: Blockchain is immutable — but if a farmer lies and registers rotten produce as "Grade A Organic," the blockchain merely records a lie forever.
2. **The Agricultural Fraud Problem (Cheating Intermediary / Retailer / Consumer)**: What if a farmer delivers rotten/waste crops after registering a good sample? What if a farmer uploads downloaded stock photos of healthy crops from the internet instead of their own farm harvest?
3. **The Photocopy Attack**: QR codes are cryptographic, but what stops an intermediary or retailer from printing 100 copies of a genuine QR code and pasting it on cheap, substandard produce?
4. **The Adoption Friction**: Rural Indian farmers will not manage a 12-word MetaMask seed phrase or pay network gas fees.

**FarmChain AI 2.0** solves all of these through:

1. **🔬 MobileNet V2 3-Class Quality Scoring Pipeline ([`visual-oracle.js`](frontend/src/ai/visual-oracle.js))**:
   TensorFlow.js MobileNet v2 runs **100% in-browser** (Edge AI) to compute class probabilities across three grades: **Poor ($P_P$)**, **Average ($P_A$)**, and **Good ($P_G$)**.
   $$\text{Quality Score} = P(\text{Poor}) \times 0 + P(\text{Average}) \times 50 + P(\text{Good}) \times 100$$
   - **Hard Quality Gate**: Products scoring $< 40\%$ are **strictly blocked from on-chain registration**.
   - **Waste Detection**: Products scoring $< 20\%$ trigger automated `WASTE_PRODUCT_ATTEMPT` fraud alerts.
   - **Dynamic Formula Card**: Full transparent mathematical breakdown displayed directly to stakeholders.
2. **📸 Live Camera with In-Pixel GPS & Timestamp Watermark ([`live-camera.js`](frontend/src/components/live-camera.js))**:
   - Hardware camera feed (`facingMode: 'environment'`) prevents pre-selected internet/stock photos.
   - Real-time GPS coordinates ($\text{Latitude, Longitude}$, reverse-geocoded village/district) and capture timestamp are **burned directly into the canvas pixels**.
   - Generates a **SHA-256 capture proof hash** binding the photo, location, and time to the on-chain batch record.
   - Dual-mode support: **"✅ Live Camera Verified"** vs **"⚠️ Unverified Photo"**.
3. **🛡️ QualityGuard Multi-Tier Anti-Fraud & 3-Strike System ([`quality-guard.js`](frontend/src/ai/quality-guard.js))**:
   - **3-Strike System**: Strike 1 = formal warning + payout penalty (55% share instead of 60%); Strike 2 = product delisting + public fraud flag; Strike 3 = **account permanently suspended** from registering new batches.
   - **Intermediary Checkpoint Re-Verification**: Intermediaries re-scan goods upon arrival; if quality degrades $> 20\%$, an automated dispute is filed and smart escrow holds funds.
   - **Farmer Reputation Score**: 0–100 dynamic trust score visible on all product listings.
4. **🛡️ Spatial-Temporal QR Anti-Cloning ([`geo-velocity.js`](frontend/src/ai/geo-velocity.js))**: Records geolocation + timestamp on every consumer scan. Uses the **Haversine formula** to calculate velocity between scans. If the same batch is scanned in Mumbai and Delhi within 10 minutes (12,500 km/h — faster than a fighter jet), it's flagged as **CLONE_DETECTED**.
5. **⛽ ERC-4337 Account Abstraction ([`gasless.js`](frontend/src/web3/gasless.js))**: Phone OTP login auto-creates a smart contract wallet — no MetaMask, no seed phrase. All gas fees are sponsored by the **FarmChain Paymaster**. Farmers pay ₹0 to register produce on-chain.
6. **💰 Dynamic AI-Quality Payment Splits ([`contracts.js`](frontend/src/blockchain/contracts.js))**: AI Quality Score ≥95% → Farmer gets **65%** (up from 60%) with platform fee waived. Score <60% → Farmer gets 55% with extra going to a Quality Assurance fund.
7. **🔒 zk-SNARK Volume Privacy ([`dashboard.js`](frontend/src/pages/intermediary/dashboard.js))**: Intermediaries can shield wholesale volume and revenue data from competitors using a privacy toggle.
8. **🧪 Sybil QR Attack Simulation ([`fraud.js`](frontend/src/pages/admin/fraud.js))**: Admin can simulate 5 concurrent QR scans across Indian cities — triggers automatic escrow fund freeze via smart contract.
9. **🎙️ Vernacular Voice Registration ([`voice.js`](frontend/src/utils/voice.js))**: Hindi, Tamil, English speech auto-fills product forms.
10. **💳 Automated Escrow ([`MarketplaceEscrow.sol`](blockchain/contracts/MarketplaceEscrow.sol))**: Smart contract enforces revenue splits upon delivery verification.
11. **📡 Wi-Fi Resilient Mandi Oracle ([`api.js`](frontend/src/utils/api.js))**: Streams live commodity prices with offline caching.
12. **🔥 Firebase Integration ([`firebase/`](frontend/src/firebase/))**: Firebase Authentication (Email/Password + Phone OTP) and Firestore for persistent cloud-synced data.

---

## 🗺️ Role-Based Modules & Key Capabilities

| Role | Core Workflows | Killer Feature Highlights |
|:-----|:---------------|:--------------------------|
| 🌾 **Farmer** | Voice Crop Listing, Live Camera AI Quality Scan, Orders | 📸 Live Camera with GPS & date watermark, 🔬 MobileNet 3-class scoring with 40% gate, 🛡️ QualityGuard reputation badge, ⛽ Gasless transactions (₹0 gas), 🎙️ Voice input Hindi/Tamil/English, 🏆 Quality bonus (+5% for 95%+ crops) |
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
│       │   │   ├── dashboard.js       # Farmer dashboard
│       │   │   ├── products.js        # Product listing + Live Camera + AI quality
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FARMCHAIN ANTI-FRAUD PIPELINE                            │
│                                                                                 │
│   1. PROOF OF HARVEST (FARM LEVEL)                                              │
│   📸 Live Camera Feed Only (Hardware Camera API, No Gallery Uploads for Proof)   │
│   📍 Real-Time GPS (Lat/Long + Reverse Geocoding) Burned into Pixels            │
│   📅 Timestamp Watermark Burned into Canvas Pixel Data                          │
│   🔐 SHA-256 Proof Hash bound to blockchain transaction                        │
│                                ↓                                                │
│   2. OBJECTIVE PRE-LISTING QUALITY GATE                                         │
│   🔬 MobileNet V2 Class Probabilities: [Poor: P_P, Average: P_A, Good: P_G]     │
│   🧮 Quality Score = P(Poor)×0 + P(Average)×50 + P(Good)×100                   │
│   ⛔ If Score < 40% → STRICTLY BLOCKED from Blockchain Registration             │
│   🚨 If Score < 20% → WASTE_PRODUCT_ATTEMPT Fraud Alert Triggered               │
│                                ↓                                                │
│   3. SUPPLY CHAIN CHECKPOINT RE-VERIFICATION (INTERMEDIARY LEVEL)               │
│   📦 Intermediary re-scans batch upon delivery arrival                          │
│   📉 If Quality degrades > 20% (Delta Check) → Automated Dispute Raised         │
│   🔒 Smart Escrow holds funds in MarketplaceEscrow.sol (Farmer NOT paid)        │
│                                ↓                                                │
│   4. ACCOUNTABILITY & 3-STRIKE PENALTY PROTOCOL                                 │
│   ⚠️ Strike 1: Official Warning + Farmer Share reduced (55% vs 60%)             │
│   🚫 Strike 2: Product Delisted + Public Bad Actor Registry Flag                │
│   ⛔ Strike 3: ACCOUNT SUSPENDED — Banned from listing future harvests          │
│   ⭐ Dynamic Farmer Reputation Score (0–100) visible to all wholesale buyers   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Direct Judge Q&A Matrix

| Attack / Cheat Scenario | FarmChain AI Defense Mechanism | Technical Enforcement |
|:---|:---|:---|
| **Farmer uploads stock/downloaded photos of healthy crops from internet** | **Hardware Live Camera + In-Pixel Watermark**: Accesses device camera (`facingMode: 'environment'`). Real-time GPS and timestamp are rendered and permanently burned into the canvas image buffer. | [`live-camera.js`](frontend/src/components/live-camera.js)<br>`LiveCamera.generateProofHash()` creates a SHA-256 fingerprint. |
| **Farmer attempts to register rotten, diseased, or waste crop** | **MobileNet V2 3-Class Scoring Gate**: Images are classified into Poor ($0$), Average ($50$), and Good ($100$). Produces mathematically verified score: $$S = P_P \cdot 0 + P_A \cdot 50 + P_G \cdot 100$$ If $S < 40\%$, registration is physically blocked. | [`visual-oracle.js`](frontend/src/ai/visual-oracle.js)<br>`VisualOracle.analyzeCropQuality()` |
| **Farmer takes photo of a good tomato sample, but ships rotten crates to the intermediary** | **Intermediary Checkpoint Re-Verification**: Intermediary inspects and re-scans upon arrival. If re-scanned score drops $>20\%$ below farmer's registered score, an automatic dispute is created. | [`dashboard.js`](frontend/src/pages/intermediary/dashboard.js)<br>`QualityGuard.handleQualityDispute()` |
| **Financial loss to buyer / intermediary** | **Trustless Smart Escrow Hold**: Buyer funds are held in `MarketplaceEscrow.sol`. Funds are only released upon checkpoint verification. Disputed funds are automatically refunded to the buyer. | [`MarketplaceEscrow.sol`](blockchain/contracts/MarketplaceEscrow.sol) |
| **Repeat offenders & bad actors** | **QualityGuard 3-Strike System**: Farmers accumulating 3 verified quality disputes are permanently suspended. Every dispute reduces the farmer's public reputation score (0–100). | [`quality-guard.js`](frontend/src/ai/quality-guard.js)<br>`QualityGuard.recordQualityResult()` |
| **Retailer / consumer transparency** | **Traceability & Verification Badges**: Retailer and consumer dashboards display verified AI quality percentages, grades (A+/A/B/C), and harvest GPS proof tags. | [`source.js`](frontend/src/pages/retailer/source.js), [`trace.js`](frontend/src/pages/consumer/trace.js) |

---

## 🧪 1-Click Judge Demo Showcase Guide

### 🔬 Demo 1: MobileNet V2 3-Class Scoring & Live Camera (Solves GIGO & Fake Photos)
1. Log in as Farmer (`farmer@farmchain.io`).
2. Go to **My Products** → Click **➕ Add Product**.
3. Under Crop Photo, click **📸 Live Camera (Verified)**:
   - Notice the live viewfinder with real-time GPS coordinates and timestamp overlay.
   - Click **📸 Capture Photo** → GPS and timestamp are burned directly into the image pixels.
   - See the **"✅ Live Camera Verified"** badge with GPS coordinates and SHA-256 proof hash.
4. Click **🔬 Run AI Analysis**:
   - MobileNet v2 evaluates the image and generates class probabilities.
   - See the 3-Class breakdown: **Poor 🔴**, **Average 🟡**, **Good 🟢**.
   - Inspect the live **Formula Breakdown Card**:
     $$\text{Quality Score} = P(\text{Poor}) \times 0 + P(\text{Average}) \times 50 + P(\text{Good}) \times 100$$
5. If score $\ge 40\%$, the product is allowed for registration.
6. Try with a poor crop image (score $< 40\%$) → see the system **STRICTLY BLOCK** registration.

### 🛡️ Demo 2: Spatial-Temporal QR Anti-Cloning (Solves Photocopy Attack)
1. Log in as Consumer (`consumer@farmchain.io`) → Navigate to **Trace Product**.
2. Click **✅ Test Authentic Batch** → see full blockchain journey with "🟢 Spatially Verified" badge.
3. Click **📋 Test Cloned QR (Photocopy Attack)** → triggers a Mumbai→Delhi clone detection:
   - **🚨 CYBERSECURITY ALERT: QR Clone Detected**
   - Velocity: **12,500 km/h** (faster than a fighter jet)
   - Visual comparison: Car (120 km/h) → Train (300 km/h) → Aircraft (900 km/h) → **This QR: 12,500 km/h**
   - Recommendation: **DO NOT PURCHASE**
4. Click **🚨 Test Spoofed / Fake QR** → triggers **Cryptographic Verification Failed** security rejection.

### ⛽ Demo 3: Account Abstraction / Gasless Login (Solves Adoption)
1. Go to the **Login Page**.
2. In the "📱 Phone OTP Login (ERC-4337)" section, enter any 10-digit number.
3. Click **📱 Send OTP** → OTP is auto-displayed for judges.
4. Enter the OTP → **Smart Wallet Created!** — no MetaMask, no seed phrase.
5. See the wallet address and "Gas: Sponsored by Paymaster" confirmation.
6. Register a product as farmer → notice "⛽ Gas: ₹0.00 · Sponsored by FarmChain Paymaster".

### 🔒 Demo 4: zk-SNARK Privacy Toggle
1. Log in as Intermediary (`trader@farmchain.io`).
2. See the **🔒 Zero-Knowledge Volume Privacy** banner.
3. Toggle the switch ON → all stat card values replaced with 🔒, charts blurred with "ZK-SHIELDED" overlay.
4. Toggle OFF → values restored.

### 🧪 Demo 5: Sybil QR Attack Simulation
1. Log in as Admin (`admin@farmchain.io`) → Go to **Fraud Alerts**.
2. Click **🧪 Simulate Sybil QR Attack (Cloned Labels)**.
3. See 5 simultaneous scans across Mumbai, Delhi, Bangalore, Chennai, Kolkata — all within 2 minutes.
4. **Escrow Funds FROZEN** notification from MarketplaceEscrow.sol.

### 🎙️ Demo 6: Voice Registration
1. Log in as Farmer → **Add Product** → Click **🎙️ Start Speaking** (Hindi/Tamil/English).
2. Say *"500 kg Basmati Rice at 48 rupees"* → fields auto-fill → AI Fair Price suggests market rates.

### 💰 Demo 7: Dynamic Quality-Based Payment Splits
1. After registering a product with AI score ≥95%, navigate to the Consumer Trace page.
2. See the Price Transparency chart: Farmer **65%** (up from 60%), Platform **0%** (waived).
3. The "🏆 High-Quality Bonus Active" badge is displayed.

### 📊 Demo 8: Admin Analytics & Blockchain Explorer
1. Log in as Admin (`admin@farmchain.io`).
2. Navigate to **Dashboard** → view platform-wide analytics, user stats, and revenue metrics.
3. Go to **Blockchain Explorer** → browse on-chain transactions, blocks, and contract events.
4. Visit **Demand Forecast** → see AI-driven demand prediction charts for crop categories.

### 🔬 Demo 9: Intermediary Quality Re-Verification & Dispute Resolution (Anti-Fraud Checkpoint)
1. Log in as Intermediary (`trader@farmchain.io`).
2. Scroll to the **🔬 Quality Re-Verification (Anti-Fraud)** section.
3. Notice received product batches with farmer's initial registered quality score.
4. Click **🔬 Re-Verify Quality** on an incoming batch:
   - System runs a secondary verification scan simulating warehouse arrival.
   - If quality matches → **"✅ Quality Confirmed: Escrow Released"**.
   - If quality degraded $>20\%$ (e.g., initial $88\% \to$ arrival $42\%$) → **"🚨 Quality Dispute Raised: Escrow Frozen & Farmer Issued Strike 1"**.

### ⭐ Demo 10: QualityGuard 3-Strike Penalty & Farmer Trust Scores
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
