# 🌾 FarmChain

### Production-Grade Decentralized Farm-to-Consumer Marketplace & Agritech Trust Protocol

> A full-stack decentralized agricultural platform connecting farmers directly to consumers with **EVM Solidity smart contracts on Polygon Amoy (Chain ID: 80002)**, **Dual-Mode (Voice 🎤 + Manual ⌨️) Guided Product Listing Wizard**, **Live Farm Camera with In-Pixel Exact GPS Location & Date/Time Timestamp Watermark**, **Client-Side AI Quality Assessment**, **QualityGuard Multi-Tier Anti-Fraud & 3-Strike System**, **Spatial-Temporal QR anti-cloning**, **ERC-4337 Account Abstraction (Gasless Tx & Zero Blockchain Jargon for Farmers)**, **zk-SNARK privacy shielding**, **4-Language Regional Localization (English, Hindi, Tamil, Telugu)**, **dynamic AI-quality-based payment splits**, **Firebase Authentication & Firestore**, **real-time WebSocket sync (Socket.io)**, and **Sybil QR attack detection with escrow freeze**.

[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.24-363636?style=for-the-badge&logo=solidity)](blockchain/contracts/)
[![Polygon Amoy](https://img.shields.io/badge/Polygon%20Amoy-Chain%20ID%2080002-8247E5?style=for-the-badge&logo=polygon)](https://amoy.polygonscan.com/address/0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Socket.io-339933?style=for-the-badge&logo=nodedotjs)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite)](frontend/)
[![Hardhat Tests](https://img.shields.io/badge/Tests-35%20Passing-brightgreen?style=for-the-badge&logo=hardhat)](blockchain/test/AgriSupplyChain.test.js)
[![AI](https://img.shields.io/badge/AI-Produce%20Quality%20Grader%20(A%2FB%2FC)-FF6F00?style=for-the-badge&logo=tensorflow)](frontend/src/ai/crop-grader.js)
[![Anti-Fraud](https://img.shields.io/badge/Security-QualityGuard%203--Strikes-dc2626?style=for-the-badge)](frontend/src/ai/quality-guard.js)
[![Live Camera](https://img.shields.io/badge/Proof%20of%20Harvest-Exact%20GPS%20%2B%20Date%2FTime%20Watermark-059669?style=for-the-badge)](frontend/src/components/live-camera.js)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](frontend/src/firebase/)
[![Voice AI](https://img.shields.io/badge/Voice%20AI-Web%20Speech%20(EN%2C%20HI%2C%20TA%2C%20TE)-f59e0b?style=for-the-badge)](frontend/src/utils/voice.js)
[![Security](https://img.shields.io/badge/Security-Geo--Velocity%20%2B%20Anti--Clone-06b6d4?style=for-the-badge)](frontend/src/ai/geo-velocity.js)

---

## 🚀 Live On-Chain Deployment (Polygon Amoy Testnet)

The flagship **AgriSupplyChain** smart contract is officially deployed and active on Polygon Amoy:

| Parameter | Live Value |
|---|---|
| **Network** | Polygon Amoy Testnet |
| **Chain ID** | `80002` (`0x13882`) |
| **Contract Name** | `AgriSupplyChain` |
| **Deployed Address** | [`0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A`](https://amoy.polygonscan.com/address/0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A) |
| **Deployment Tx** | [`0xd3286941cd949ab64e8f9e29462490d9e4461810b5a656677fe2fca2c7694ccb`](https://amoy.polygonscan.com/tx/0xd3286941cd949ab64e8f9e29462490d9e4461810b5a656677fe2fca2c7694ccb) |
| **Deployer / Admin** | [`0xFee2B36737BDdBB3AB8C0924B013f898e512715F`](https://amoy.polygonscan.com/address/0xFee2B36737BDdBB3AB8C0924B013f898e512715F) |
| **High-Availability RPC** | `https://polygon-amoy-bor-rpc.publicnode.com` |
| **Explorer** | [amoy.polygonscan.com](https://amoy.polygonscan.com/) |

---

## 📌 Problem & Enterprise Solution

Indian farmers routinely lose **40–60% of crop value** to opaque intermediary markups, arbitrary spot prices, paper certificate fraud, and delayed payment settlements. Beyond this, **five critical trust and usability gaps** plague conventional agricultural supply chains:

1. **The GIGO Problem**: Blockchain is immutable — but if a farmer lies and registers rotten produce as "Grade A Organic," the blockchain merely records a lie forever.
2. **The Agricultural Fraud Problem (Cheating Intermediary / Retailer / Consumer)**: What if a farmer uploads downloaded stock photos of healthy crops from the internet instead of their own farm harvest? What if produce arrives degraded or rotten?
3. **The Technology & Jargon Barrier**: Rural Indian farmers will not manage 12-word seed phrases, hex wallet addresses, gas fees, or complex crypto dashboards. Interface terminology must be 100% farmer-centric.
4. **The Input Accessibility Barrier**: A farmer standing in a field with soiled hands needs to speak naturally in their native tongue (Tamil, Hindi, Telugu, English) OR use large tactile touch buttons — both must be equal, first-class listing methods.
5. **The Photocopy Attack**: QR codes are cryptographic, but what stops an intermediary or retailer from printing 100 copies of a genuine QR code and pasting it on cheap, substandard produce?

**FarmChain** solves all of these through:

1. **⛓️ Immutable On-Chain Provenance & Stage Lifecycle ([`AgriSupplyChain.sol`](blockchain/contracts/AgriSupplyChain.sol))**:
   - Full supply chain stage lifecycle: **Harvested (0) → In Transit (1) → Quality Checked (2) → At Retailer (3) → Sold (4)**.
   - Price audit trail per stage exposes middleman markups and guarantees fair farmer compensation.
   - Quality certificates with SHA-256 lab report hashes verified on-chain.
   - Overloaded public verification (`verifyBatch`) accessible to consumers via QR code.
2. **🎙️ Dual-Mode (Voice 🎤 + Manual ⌨️) Guided Product Listing Wizard ([`product-wizard.js`](frontend/src/pages/farmer/product-wizard.js))**:
   - 4-step progressive wizard: **Details (Speak/Type) → Photo (Live Camera/Upload) → Review & Confirm → Silent Smart-Wallet Listing**.
   - Optional 1-click **"Mint On-Chain Batch on Polygon Amoy"** toggle.
   - Farmer can toggle freely between **🎤 Speak** and **⌨️ Type Manually** without losing entered data.
   - Multilingual speech recognition auto-parses numbers and crop names across **Tamil, Hindi, Telugu, and English**.
   - Built-in multi-language SpeechSynthesis Read-Aloud for hands-free confirmation before publishing.
3. **📸 Live Farm Camera with In-Pixel Exact GPS & Date/Time Timestamp ([`live-camera.js`](frontend/src/components/live-camera.js))**:
   - Direct hardware camera integration prevents uploading downloaded stock photos from the internet.
   - **Multi-layer GPS location acquisition** (Hardware GPS + Browser Geolocation + Network IP fallback) with real-time reverse geocoding to village/town, district, and state.
   - Location, coordinates, accuracy ($\pm 15\text{m}$), and timestamp are **permanently burned into the canvas image pixels**.
4. **🤫 Zero Blockchain Jargon for Farmers ([`gasless.js`](frontend/src/web3/gasless.js), [`product-wizard.js`](frontend/src/pages/farmer/product-wizard.js))**:
   - All Web3 complexities execute silently in the background via ERC-4337 Account Abstraction and Paymaster sponsorship, or direct MetaMask when preferred.
   - Farmer only sees familiar agricultural terms: *"Produce Batch"*, *"Harvest Date"*, *"Guaranteed Payout (60% min)"*, *"Produce Listed for Sale! 🎉"*.
5. **🔬 In-Browser AI Produce Quality Grader ([`crop-grader.js`](frontend/src/ai/crop-grader.js), [`visual-oracle.js`](frontend/src/ai/visual-oracle.js))**:
   - Edge AI grading (Grade A / B / C) evaluates produce freshness, color saturation, and uniformity directly in-browser.
6. **🛡️ QualityGuard Multi-Tier Anti-Fraud & 3-Strike System ([`quality-guard.js`](frontend/src/ai/quality-guard.js))**:
   - **3-Strike System**: Strike 1 = formal warning + payout penalty; Strike 2 = product delisting + public fraud flag; Strike 3 = account permanently suspended.
   - **Intermediary Checkpoint Re-Verification**: Intermediaries re-scan goods upon arrival; if quality degrades $> 20\%$, an automated dispute is filed.
7. **🛡️ Spatial-Temporal QR Anti-Cloning ([`geo-velocity.js`](frontend/src/ai/geo-velocity.js))**:
   - Records geolocation + timestamp on every consumer scan. Uses the **Haversine formula** to calculate velocity between scans.
   - If the same batch is scanned in Mumbai and Delhi within 10 minutes (12,500 km/h), it's immediately flagged as **CLONE_DETECTED**.
8. **💰 Dynamic AI-Quality Payment Splits ([`contracts.js`](frontend/src/blockchain/contracts.js))**:
   - AI Quality Score ≥95% → Farmer gets **65%** (up from 60%) with platform fee waived. Score <60% → Farmer gets 55% with balance allocated to Quality Assurance.
9. **🌐 Complete Vernacular Localization Engine ([`i18n/`](frontend/src/i18n/index.js), [`translations.js`](frontend/src/i18n/translations.js))**:
   - Zero-lag dynamic language switching across 4 languages: **English (`en`)**, **Hindi (`hi`)**, **Tamil (`ta`)**, and **Telugu (`te`)**.
   - Over 1,217 localized keys per language with strict 100% 1:1 key parity.

---

## 🗺️ Role-Based Modules & Key Capabilities

| Role | Core Workflows | Feature Highlights |
|:-----|:---------------|:-------------------|
| 🌾 **Farmer** | Dual-Mode Listing Wizard (Voice 🎤 + Manual ⌨️), Live Farm Camera with GPS & Timestamp, Orders | 📸 Live Farm Camera with in-pixel GPS & timestamp, 🎙️ Dual-Mode Wizard, ⛓️ **Mint On-Chain Batch on Polygon Amoy**, 🤫 Zero Blockchain Terminology, 🌐 Full regional localization, 🔬 AI Quality Grade badge, ⛽ ₹0 Gas Paymaster |
| 🏪 **Intermediary** | Bulk Procurement, Quality Re-Verification, Stage Updates | 🔬 Checkpoint Re-Verification, ⛓️ On-chain stage transitions (`Harvested` → `InTransit` → `QualityChecked`), 🔒 zk-SNARK volume privacy toggle, B2B wholesale routing |
| 🛒 **Retailer** | Wholesale Sourcing, Shelf QR, Stage Transition | 🔬 Verified AI Quality Grade badge, Live GPS harvest tags, on-chain stage update to `AtRetailer` & `Sold`, printable QR tags |
| 👤 **Consumer** | Marketplace, Trace, Anti-Cloning, QR Verification | 🟣 **Polygon Amoy On-Chain Verification Badge** with direct PolygonScan link, spatial-temporal QR clone detection, price transparency breakdown |
| 🔧 **Admin** | Security, Fraud, Sybil Detection, Forecasting, Roles | 🛡️ Role management (`addFarmer`, `addInspector`), Quality fraud alerts, 🧪 Sybil QR attack simulation, demand forecasting |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Vite + Vanilla JS)                          │
│  • SPA Router with RBAC Guards                                                 │
│  • 🟣 Web3 Provider (MetaMask + Auto Network Switch to Polygon Amoy 80002)     │
│  • 📸 Live Camera Capture (In-Pixel GPS + Timestamp Canvas Watermark)          │
│  • 🔬 AI Visual Quality Oracle (MobileNet v2: Freshness & Quality Scoring)     │
│  • 🛡️ QualityGuard Multi-Tier Anti-Fraud (3-Strike Rule & Checkpoint Disputes) │
│  • 🛡️ Spatial-Temporal QR Anti-Cloning (Haversine Velocity Engine)             │
│  • 🎙️ Vernacular Voice Recognition & TTS (English, Hindi, Tamil, Telugu)       │
│  • 5 Role Dashboards (Farmer, Intermediary, Retailer, Consumer, Admin)         │
│  • 🔥 Firebase Auth (Email/Password + Phone OTP) & Firestore                  │
└───────────────────────────────────┬────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────────────────┐
       ▼                            ▼                                        ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────────┐
│ Real-Time    │             │ Blockchain   │             │ AI & Cybersec    │
│ Backend API  │             │ Smart Layer  │             │ Intelligence     │
│ • Express.js │             │ • Polygon    │             │ • Visual Oracle  │
│ • Socket.io  │             │   Amoy Test- │             │   (MobileNet v2) │
│ • Blockchain │             │   net (80002)│             │ • QualityGuard   │
│   Endpoints  │             │ • AgriSupply-│             │   Anti-Fraud     │
│   (/api/     │             │   Chain.sol  │             │ • Geo-Velocity   │
│   blockchain)│             │ • Role-Based │             │ • Fraud Detector │
│ • JSON DB    │             │   Access     │             │ • Demand ML      │
│ (Port 4000)  │             │ • Live Sync  │             │                  │
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
│       ├── ai/                        # AI & ML modules (edge/in-browser)
│       │   ├── visual-oracle.js       # MobileNet v2 quality scoring
│       │   ├── quality-guard.js       # Anti-fraud & 3-strike engine
│       │   ├── geo-velocity.js        # Haversine spatial-temporal QR anti-cloning
│       │   ├── fraud-detector.js      # Anomaly detection & fraud alerting
│       │   └── price-predictor.js     # AI fair-price suggestion engine
│       ├── contracts/                 # Deployed contract artifacts
│       │   └── AgriSupplyChain.json   # Live Polygon Amoy contract ABI & address
│       ├── web3/                      # Web3 wallet & contract infrastructure
│       │   ├── provider.js            # MetaMask & Polygon Amoy network switcher
│       │   ├── contracts.js           # AgriSupplyChain interaction helpers
│       │   └── gasless.js             # ERC-4337 Account Abstraction
│       ├── firebase/                  # Firebase integration
│       │   ├── config.js              # Firebase project configuration
│       │   ├── auth.js                # Authentication (Email + Phone)
│       │   └── firestore.js           # Firestore database operations
│       ├── pages/                     # Role-based dashboard pages
│       │   ├── landing.js             # Public landing page
│       │   ├── auth.js                # Login / Register page
│       │   ├── farmer/                # Farmer role (Wizard, Products, Orders)
│       │   ├── intermediary/          # Intermediary role (Re-Verification, Inventory)
│       │   ├── retailer/              # Retailer role (Sourcing, Shelf QR)
│       │   ├── consumer/              # Consumer role (Marketplace, Trace QR)
│       │   └── admin/                 # Admin role (Fraud, Explorer, Roles)
│       ├── components/                # Reusable UI components
│       │   ├── camera-qr-scanner.js   # QR code camera scanner & parser
│       │   ├── live-camera.js         # Live camera modal with GPS + date watermark
│       │   └── notification-center.js # Real-time notification panel
│       ├── i18n/                      # Internationalization (EN, HI, TA, TE)
│       └── styles/                    # High-contrast editorial stylesheets
│
├── backend/                           # Express.js + Socket.io API Server
│   ├── index.js                       # Server entry point (port 4000)
│   ├── db.js                          # Persistent JSON database
│   ├── data_store.json                # Persistent data store
│   ├── config/
│   │   └── contractConfig.json        # Auto-exported contract config
│   ├── routes/
│   │   ├── api.js                     # Core API routes (products, orders, mandi)
│   │   └── blockchain.js              # Blockchain endpoints (/api/blockchain/*)
│   └── services/
│       ├── blockchain.js              # Ethers.js Polygon Amoy service + hybrid ledger
│       └── mandiData.js               # Live Mandi spot rate service
│
├── blockchain/                        # Hardhat + Solidity smart contracts
│   ├── hardhat.config.cjs             # Hardhat config (Solidity 0.8.24, Polygon Amoy)
│   ├── package.json                   # Blockchain scripts & dependencies
│   ├── contracts/
│   │   ├── AgriSupplyChain.sol        # Flagship supply chain contract (Amoy Deployed)
│   │   ├── MarketplaceEscrow.sol      # Trustless escrow & dynamic payment splits
│   │   ├── ProductRegistry.sol        # Batch registration + AI Oracle
│   │   ├── SupplyChainTracker.sol     # Checkpoint and transit logs
│   │   └── QualityCertifier.sol       # Organic & AGMARK lab verifications
│   ├── scripts/
│   │   ├── deploy.js                  # Polygon Amoy deployment script with gas overrides
│   │   └── export-abi.cjs             # Automated ABI & address exporter
│   └── test/
│       └── AgriSupplyChain.test.js    # Comprehensive Hardhat unit test suite (35 tests)
│
├── BLOCKCHAIN_SETUP.md                # Dedicated step-by-step blockchain run guide
├── package.json                       # Root monorepo scripts & dependencies
└── README.md                          # This file
```

---

## 📦 Smart Contract Suite

| Contract | Network | Key Functions | Details |
|:---------|:--------|:--------------|:--------|
| [`AgriSupplyChain.sol`](blockchain/contracts/AgriSupplyChain.sol) | **Polygon Amoy (`80002`)** — Deployed at `0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A` | `createBatch()`, `transferOwnership()`, `updateStage()`, `addQualityCertificate()`, `getBatchDetails()`, `verifyBatch()`, `verifyBatchHash()`, `getStageHistory()`, `getPriceHistory()` | Role-based permissions (`ADMIN`, `FARMER`, `INTERMEDIARY`, `RETAILER`, `QUALITY_INSPECTOR`), 5-stage lifecycle, immutable price audit trail, and SHA-256 verification. |
| [`MarketplaceEscrow.sol`](blockchain/contracts/MarketplaceEscrow.sol) | Local / Testnet | `createOrder()`, `confirmShipment()`, `confirmDeliveryAndRelease()` | Trustless escrow holding buyer funds until physical checkpoint delivery. |
| [`ProductRegistry.sol`](blockchain/contracts/ProductRegistry.sol) | Local / Testnet | `registerProduct()`, `getProduct()` | Metadata registry with AI quality oracle binding. |
| [`SupplyChainTracker.sol`](blockchain/contracts/SupplyChainTracker.sol) | Local / Testnet | `logCheckpoint()`, `getProductCheckpoints()` | Checkpoint & cold-chain temperature logs. |
| [`QualityCertifier.sol`](blockchain/contracts/QualityCertifier.sol) | Local / Testnet | `authorizeInspector()`, `issueCertificate()` | AGMARK & Organic quality certification hashes. |

---

## 🧪 Hardhat Test Suite (35 Passing Tests)

Run the full smart contract test suite covering all lifecycle operations, validations, and security checks:

```bash
npm run test:contracts
```

Output:
```
  AgriSupplyChain
    Batch Creation
      ✔ should create a batch successfully
      ✔ should increment totalBatches counter
      ✔ should record initial ownership in history
    Duplicate Prevention
      ✔ should reject duplicate batchId
    Ownership Transfer
      ✔ should transfer ownership successfully
      ✔ should record transfer in ownership history
      ✔ should allow chained transfers
    Unauthorized Transfer Rejection
      ✔ should reject transfer by non-owner
      ✔ should reject transfer to self
    Zero Address Rejection
      ✔ should reject transfer to zero address
    Price Update + History
      ✔ should update price and emit event
      ✔ should maintain full price history
      ✔ should reject price update from non-owner
      ✔ should reject zero price
    Quality Certificates
      ✔ should add quality certificate and emit event
      ✔ should allow multiple certificates
    Unauthorized Certificate Rejection
      ✔ should reject certificate from non-inspector
      ✔ should reject certificate from farmer (no inspector role)
    Hash Verification
      ✔ should return true for matching hash
      ✔ should return false for non-matching hash
    Invalid Batch Handling
      ✔ should revert getBatch for non-existent batch
      ✔ should revert transferOwnership for non-existent batch
      ✔ should revert updatePrice for non-existent batch
      ✔ should revert addQualityCertificate for non-existent batch
      ✔ should revert verifyBatchHash for non-existent batch
      ✔ should return false for verifyBatch when batch does not exist
    Stages & Traceability Lifecycle
      ✔ should start at Harvested stage
      ✔ should transition through stages: InTransit -> QualityChecked -> AtRetailer -> Sold
      ✔ consumer verifyBatch should return validity, owner, and stage
    Event Emission
      ✔ should emit BatchCreated with correct args
      ✔ should emit PriceUpdated with correct args
    Role-based Access
      ✔ should reject batch creation from non-farmer
      ✔ admin should be able to add farmers and inspectors
      ✔ should reject empty batchId
      ✔ should reject zero quantity

  35 passing (916ms)
```

---

## 🌐 Backend Blockchain REST API (`/api/blockchain`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/blockchain/status` | Network status, active contract address, and explorer links |
| `POST` | `/api/blockchain/batch` | Mint new produce batch on-chain (Farmer) |
| `POST` | `/api/blockchain/transfer` | Transfer batch ownership to buyer/intermediary |
| `POST` | `/api/blockchain/stage` | Transition stage (`Harvested` → `InTransit` → `QualityChecked` → `AtRetailer` → `Sold`) + price |
| `POST` | `/api/blockchain/certificate` | Record lab quality certificate hash |
| `GET` | `/api/blockchain/batch/:batchId` | Read on-chain batch data |
| `GET` | `/api/blockchain/verify/:batchId` | Public verification endpoint for consumer QR scanning |
| `GET` | `/api/blockchain/history/:batchId` | Complete stage transitions & price history |

---

## 🚀 Quick Start & Run Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Smart Contract Commands
```bash
# Compile contracts
npm run compile:contracts

# Run 35 automated tests
npm run test:contracts

# Deploy to local Hardhat node
npm run deploy:contracts:local

# Deploy to Polygon Amoy Testnet (requires private key & testnet POL)
npm run deploy:contracts:amoy

# Export ABI & address to frontend and backend
npm run export:contracts
```

### 3. Start Backend Server (Port 4000)
```bash
npm run start
```
Starts the Express & Socket.io server connected directly to the live contract on Polygon Amoy.

### 4. Start Frontend Application (Port 5173)
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 👥 Demo Logins

| Role | Email | Password | Alt Login |
|:-----|:------|:---------|:----------|
| 🌾 **Farmer** | `farmer@farmchain.io` | `farmer123` | 📱 Phone OTP (Gasless) |
| 🏪 **Intermediary** | `trader@farmchain.io` | `trader123` | |
| 🛒 **Retailer** | `retailer@farmchain.io` | `retailer123` | |
| 👤 **Consumer** | `consumer@farmchain.io` | `consumer123` | 📱 Phone OTP (Gasless) |
| 🔧 **Admin** | `admin@farmchain.io` | `admin123` | |

---

## 🛡️ Anti-Fraud & Quality Protection Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│               FarmChain — 4-Tier Anti-Fraud Architecture        │
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
│ TIER 3: CHECKPOINT RE-VERIFICATION & ON-CHAIN STAGES                   │
│  • Intermediary & Retailer arrival scanning with dispute triggers      │
│  • Delta check: >20% quality degradation halts transaction             │
│  • AgriSupplyChain.sol records stages, handlers, prices, and certs    │
│  • MarketplaceEscrow.sol holds funds until physical receipt verified   │
├────────────────────────────────────────────────────────────────────────┤
│ TIER 4: REPUTATION, 3-STRIKE PENALTIES & GEO-VELOCITY DEFENSE          │
│  • QualityGuard 3-Strike System: 3 verified disputes = permanent ban   │
│  • Public trust & reputation scores (0-100) visible across network     │
│  • Geo-Velocity Sybil Defense: Impossible multi-city QR scan freezes   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 1-Click Judge Demo Showcase Guide

### 🟣 Demo 1: Polygon Amoy On-Chain Verification (Live Blockchain)
1. Go to **Consumer → Trace Product** (`#/consumer/trace`).
2. Select any produce batch (e.g. `PROD-001` Organic Alphonso Mangoes).
3. Notice the **🟣 Verified on Polygon Amoy (80002) ↗** badge in the product hero section.
4. Click the badge — it opens directly on **[amoy.polygonscan.com](https://amoy.polygonscan.com/address/0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A)**.
5. Inspect the **Product Journey Timeline** and **Price Transparency Breakdown** (Farmer guaranteed 60%+ share vs Middlemen).

### 📸 Demo 2: Live Farm Camera with Exact GPS & Date/Time Watermark
1. Log in as Farmer (`farmer@farmchain.io` or click Farmer demo card).
2. Go to **My Products** → Click **📸 Live Farm Camera** in the topbar.
3. Observe the live viewfinder with **Exact Location** (`📍 Thuraiyur, Tiruchirappalli, Tamil Nadu • 11.1481°N, 78.5991°E`) and live clock (`📅 IST`).
4. Click **📸 Capture & Verify** — coordinates and timestamp are burned into the canvas image pixels.
5. Click **✅ Use This Photo** → **➕ List This Crop for Sale** — wizard opens with proof pre-loaded.

### 🎙️ Demo 3: Dual-Mode Guided Listing Wizard + On-Chain Minting
1. In the **Add Product Wizard**, toggle between **🎤 Speak** and **⌨️ Type Manually**.
2. Tap **🎤 Speak**: Speak *"500 kg Basmati Rice at 48 rupees"* in English, Hindi, Tamil, or Telugu.
3. Progress through Photo → Review & Confirm.
4. On Step 3, note the **"Mint On-Chain Batch on Polygon Amoy"** toggle (enabled by default).
5. Click **🚀 List for Sale in Marketplace** — the batch is cryptographically hashed and minted on-chain.

### 🛡️ Demo 4: Spatial-Temporal QR Anti-Cloning (Photocopy Attack Defense)
1. In **Consumer → Trace Product**, click **📋 Test Cloned QR (Photocopy Attack)**.
2. Triggers an impossible Mumbai → Delhi concurrent scan (12,500 km/h velocity).
3. The UI immediately displays a high-visibility alert: **🚨 CYBERSECURITY ALERT: QR Clone Detected** with a recommendation to reject the produce.

### 🌐 Demo 5: Instant Vernacular Localization
1. Locate the **Language Selector** in the navigation header.
2. Switch between **English (EN)**, **हिंदी (HI)**, **தமிழ் (TA)**, and **తెలుగు (TE)**.
3. Zero-lag, 100% complete translation across all screens, metrics, buttons, and voice models.

---

## 📜 License

MIT License. Developed for transparent agriculture, fair farmer compensation, and tamper-proof food supply chains.
