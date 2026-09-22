# 🌾 FarmChain AI 2.0

### Production-Grade Decentralized Farm-to-Consumer Marketplace & Agritech Trust Protocol

> A full-stack decentralized agricultural platform connecting farmers directly to consumers with **EVM Solidity smart contracts**, **AI Visual Quality Oracle (TensorFlow.js MobileNet)**, **Spatial-Temporal QR anti-cloning**, **ERC-4337 Account Abstraction (Gasless Tx)**, **zk-SNARK privacy shielding**, **vernacular voice-based crop registration (Hindi, Tamil, English)**, **dynamic AI-quality-based payment splits**, **Firebase Authentication & Firestore**, **real-time WebSocket sync (Socket.io)**, and **Sybil QR attack detection with escrow freeze**.

[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20-363636?style=for-the-badge&logo=solidity)](blockchain/contracts/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Socket.io-339933?style=for-the-badge&logo=nodedotjs)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite)](frontend/)
[![AI](https://img.shields.io/badge/AI-TensorFlow.js%20MobileNet%20v2-FF6F00?style=for-the-badge&logo=tensorflow)](frontend/src/ai/)
[![ERC-4337](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-8247E5?style=for-the-badge&logo=ethereum)](frontend/src/web3/gasless.js)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](frontend/src/firebase/)
[![Voice](https://img.shields.io/badge/Voice%20AI-Web%20Speech%20API%20(HI%2C%20TA%2C%20EN)-f59e0b?style=for-the-badge)](frontend/src/utils/voice.js)
[![Security](https://img.shields.io/badge/Security-Geo--Velocity%20%2B%20RBAC%20%2B%20Anti--Clone-06b6d4?style=for-the-badge)](frontend/src/ai/geo-velocity.js)
[![Multilingual](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20TA%20%7C%20TE-22c55e?style=for-the-badge)](frontend/src/i18n/)

---

## 📌 Problem & Enterprise Solution

Indian farmers routinely lose **40–60% of crop value** to opaque intermediary markups, arbitrary spot prices, paper certificate fraud, and delayed payment settlements. Beyond this, three **critical trust gaps** plague every blockchain supply chain project:

1. **The GIGO Problem**: Blockchain is immutable — but if a farmer lies and registers rotten tomatoes as "Premium Organic," the blockchain just permanently records a lie.
2. **The Photocopy Attack**: QR codes are cryptographic, but what stops a retailer from printing 100 copies of a genuine QR and slapping it on cheap produce?
3. **The Adoption Friction**: No rural Indian farmer will manage a 12-word MetaMask seed phrase or pay gas fees.

**FarmChain AI 2.0** solves all of these through:

1. **🔬 AI Visual Quality Oracle ([`visual-oracle.js`](frontend/src/ai/visual-oracle.js))**: TensorFlow.js MobileNet v2 runs **entirely in-browser** (edge AI) to objectively score crop quality before data goes on-chain. Products scoring <40% are **blocked from registration**. The image SHA-256 hash is cryptographically bound to the on-chain record via IPFS CID.
2. **🛡️ Spatial-Temporal QR Anti-Cloning ([`geo-velocity.js`](frontend/src/ai/geo-velocity.js))**: Records geolocation + timestamp on every consumer scan. Uses the **Haversine formula** to calculate velocity between scans. If the same batch is scanned in Mumbai and Delhi within 10 minutes (12,500 km/h — faster than a fighter jet), it's flagged as **CLONE_DETECTED**.
3. **⛽ ERC-4337 Account Abstraction ([`gasless.js`](frontend/src/web3/gasless.js))**: Phone OTP login auto-creates a smart contract wallet — no MetaMask, no seed phrase. All gas fees are sponsored by the **FarmChain Paymaster**. Farmers pay ₹0 to register produce on-chain.
4. **💰 Dynamic AI-Quality Payment Splits ([`contracts.js`](frontend/src/blockchain/contracts.js))**: AI Quality Score ≥95% → Farmer gets **65%** (up from 60%) with platform fee waived. Score <60% → Farmer gets 55% with extra going to a Quality Assurance fund.
5. **🔒 zk-SNARK Volume Privacy ([`dashboard.js`](frontend/src/pages/intermediary/dashboard.js))**: Intermediaries can shield wholesale volume and revenue data from competitors using a privacy toggle.
6. **🧪 Sybil QR Attack Simulation ([`fraud.js`](frontend/src/pages/admin/fraud.js))**: Admin can simulate 5 concurrent QR scans across Indian cities — triggers automatic escrow fund freeze via smart contract.
7. **🎙️ Vernacular Voice Registration ([`voice.js`](frontend/src/utils/voice.js))**: Hindi, Tamil, English speech auto-fills product forms.
8. **💳 Automated Escrow ([`MarketplaceEscrow.sol`](blockchain/contracts/MarketplaceEscrow.sol))**: Smart contract enforces revenue splits upon delivery verification.
9. **📡 Wi-Fi Resilient Mandi Oracle ([`api.js`](frontend/src/utils/api.js))**: Streams live commodity prices with offline caching.
10. **🔥 Firebase Integration ([`firebase/`](frontend/src/firebase/))**: Firebase Authentication (Email/Password + Phone OTP) and Firestore for persistent cloud-synced data.

---

## 🗺️ Role-Based Modules & Key Capabilities

| Role | Core Workflows | Killer Feature Highlights |
|:-----|:---------------|:--------------------------|
| 🌾 **Farmer** | Voice Crop Listing, AI Quality Scan, Orders | 🔬 AI Visual Oracle photo upload with quality gate, ⛽ Gasless transactions (₹0 gas), 🎙️ Voice input Hindi/Tamil/English, 🏆 Quality bonus (+5% for 95%+ crops) |
| 🏪 **Intermediary** | Bulk Procurement, Logistics, Privacy | 🔒 zk-SNARK volume privacy toggle, B2B wholesale routing, automated 20% margin tracking |
| 🛒 **Retailer** | Wholesale Sourcing, Shelf QR | Category-filtered B2B catalog, supplier verification, printable QR tags |
| 👤 **Consumer** | Marketplace, Trace, Anti-Cloning | 🛡️ Spatial-temporal QR clone detection, velocity-based fraud alerts, AI quality score display, dynamic price splits |
| 🔧 **Admin** | Security, Fraud, Sybil Detection, Forecasting | 🧪 Sybil QR attack simulation (5-city concurrent scan), escrow freeze trigger, demand forecasting, blockchain explorer, user management |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Vite + Vanilla JS)                          │
│  • SPA Router with RBAC Guards & In-Page Smooth Anchor Scrolling               │
│  • 🔬 AI Visual Quality Oracle (TensorFlow.js MobileNet v2, Edge AI)           │
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
│ • Live Mandi │             │ • Polygon /  │             │ • Geo-Velocity   │
│   Oracle     │             │   Base       │             │   Anti-Cloning   │
│ • JSON DB    │             │ • AI Quality │             │ • Fraud Detector │
│ • REST API   │             │   Fields     │             │ • Demand ML      │
│ (Port 4000)  │             │              │             │ • Price Predictor│
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
│       │   ├── visual-oracle.js       # TensorFlow.js MobileNet v2 quality scoring
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
│       │   │   ├── products.js        # Product listing + AI quality upload
│       │   │   └── orders.js          # Order management
│       │   ├── intermediary/          # Intermediary role
│       │   │   ├── dashboard.js       # zk-SNARK privacy toggle dashboard
│       │   │   └── inventory.js       # Inventory management
│       │   ├── retailer/              # Retailer role
│       │   │   ├── dashboard.js       # Retailer dashboard
│       │   │   └── source.js          # B2B sourcing catalog
│       │   ├── consumer/              # Consumer role
│       │   │   ├── marketplace.js     # Consumer marketplace
│       │   │   ├── orders.js          # Consumer orders
│       │   │   └── trace.js           # QR traceability + anti-cloning demo
│       │   └── admin/                 # Admin role
│       │       ├── dashboard.js       # Admin dashboard
│       │       ├── fraud.js           # Sybil QR attack simulation
│       │       ├── explorer.js        # Blockchain explorer
│       │       ├── forecast.js        # Demand forecasting
│       │       └── users.js           # User management
│       ├── components/                # Reusable UI components
│       │   ├── sidebar.js             # Navigation sidebar
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

## 🧪 1-Click Judge Demo Showcase Guide

### 🔬 Demo 1: AI Visual Quality Oracle (Solves GIGO)
1. Log in as Farmer (`farmer@farmchain.io`).
2. Go to **My Products** → Click **➕ Add Product**.
3. Click **📸 Upload Crop Photo** → select any crop image.
4. Click **🔬 Run AI Analysis** → watch TensorFlow.js MobileNet load and analyze in-browser.
5. See the AI Quality Verdict: score gauge, grade (A+/A/B/C), IPFS hash, and disease flags.
6. Register the product → AI score is **cryptographically bound** to the on-chain record.
7. If score ≥95%, the farmer earns a **🏆 Quality Bonus (+5% extra share)**.

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
