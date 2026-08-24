# 🌾 FarmChain AI 2.0

### Production-Grade Decentralized Farm-to-Consumer Marketplace & Agritech Trust Protocol

> A full-stack decentralized agricultural platform connecting farmers directly to consumers with **EVM Solidity smart contracts**, **AI Visual Quality Oracle (TensorFlow.js MobileNet)**, **Spatial-Temporal QR anti-cloning**, **ERC-4337 Account Abstraction (Gasless Tx)**, **zk-SNARK privacy shielding**, **vernacular voice-based crop registration (Hindi, Tamil, English)**, **dynamic AI-quality-based payment splits**, and **Sybil QR attack detection with escrow freeze**.

[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20-363636?style=for-the-badge&logo=solidity)](contracts/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Socket.io-339933?style=for-the-badge&logo=nodedotjs)](server/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite)](src/)
[![AI](https://img.shields.io/badge/AI-TensorFlow.js%20MobileNet%20v2-FF6F00?style=for-the-badge&logo=tensorflow)](src/ai/)
[![ERC-4337](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-8247E5?style=for-the-badge&logo=ethereum)](src/web3/gasless.js)
[![Voice](https://img.shields.io/badge/Voice%20AI-Web%20Speech%20API%20(HI%2C%20TA%2C%20EN)-f59e0b?style=for-the-badge)](src/utils/voice.js)
[![Security](https://img.shields.io/badge/Security-Geo--Velocity%20%2B%20RBAC%20%2B%20Anti--Clone-06b6d4?style=for-the-badge)](src/ai/geo-velocity.js)
[![Multilingual](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20TA%20%7C%20TE-22c55e?style=for-the-badge)](src/i18n/)

---

## 📌 Problem & Enterprise Solution

Indian farmers routinely lose **40–60% of crop value** to opaque intermediary markups, arbitrary spot prices, paper certificate fraud, and delayed payment settlements. Beyond this, three **critical trust gaps** plague every blockchain supply chain project:

1. **The GIGO Problem**: Blockchain is immutable — but if a farmer lies and registers rotten tomatoes as "Premium Organic," the blockchain just permanently records a lie.
2. **The Photocopy Attack**: QR codes are cryptographic, but what stops a retailer from printing 100 copies of a genuine QR and slapping it on cheap produce?
3. **The Adoption Friction**: No rural Indian farmer will manage a 12-word MetaMask seed phrase or pay gas fees.

**FarmChain AI 2.0** solves all of these through:

1. **🔬 AI Visual Quality Oracle (`src/ai/visual-oracle.js`)**: TensorFlow.js MobileNet v2 runs **entirely in-browser** (edge AI) to objectively score crop quality before data goes on-chain. Products scoring <40% are **blocked from registration**. The image SHA-256 hash is cryptographically bound to the on-chain record via IPFS CID.
2. **🛡️ Spatial-Temporal QR Anti-Cloning (`src/ai/geo-velocity.js`)**: Records geolocation + timestamp on every consumer scan. Uses the **Haversine formula** to calculate velocity between scans. If the same batch is scanned in Mumbai and Delhi within 10 minutes (12,500 km/h — faster than a fighter jet), it's flagged as **CLONE_DETECTED**.
3. **⛽ ERC-4337 Account Abstraction (`src/web3/gasless.js`)**: Phone OTP login auto-creates a smart contract wallet — no MetaMask, no seed phrase. All gas fees are sponsored by the **FarmChain Paymaster**. Farmers pay ₹0 to register produce on-chain.
4. **💰 Dynamic AI-Quality Payment Splits (`src/blockchain/contracts.js`)**: AI Quality Score ≥95% → Farmer gets **65%** (up from 60%) with platform fee waived. Score <60% → Farmer gets 55% with extra going to a Quality Assurance fund.
5. **🔒 zk-SNARK Volume Privacy (`src/pages/intermediary/dashboard.js`)**: Intermediaries can shield wholesale volume and revenue data from competitors using a privacy toggle.
6. **🧪 Sybil QR Attack Simulation (`src/pages/admin/fraud.js`)**: Admin can simulate 5 concurrent QR scans across Indian cities — triggers automatic escrow fund freeze via smart contract.
7. **🎙️ Vernacular Voice Registration (`src/utils/voice.js`)**: Hindi, Tamil, English speech auto-fills product forms.
8. **💳 Automated Escrow (`contracts/MarketplaceEscrow.sol`)**: Smart contract enforces revenue splits upon delivery verification.
9. **📡 Wi-Fi Resilient Mandi Oracle (`src/utils/api.js`)**: Streams live commodity prices with offline caching.

---

## 🗺️ Role-Based Modules & Key Capabilities

| Role | Core Workflows | Killer Feature Highlights |
|:-----|:---------------|:--------------------------|
| 🌾 **Farmer** | Voice Crop Listing, AI Quality Scan, Orders | 🔬 AI Visual Oracle photo upload with quality gate, ⛽ Gasless transactions (₹0 gas), 🎙️ Voice input Hindi/Tamil/English, 🏆 Quality bonus (+5% for 95%+ crops) |
| 🏪 **Intermediary** | Bulk Procurement, Logistics, Privacy | 🔒 zk-SNARK volume privacy toggle, B2B wholesale routing, automated 20% margin tracking |
| 🛒 **Retailer** | Wholesale Sourcing, Shelf QR | Category-filtered B2B catalog, supplier verification, printable QR tags |
| 👤 **Consumer** | Marketplace, Trace, Anti-Cloning | 🛡️ Spatial-temporal QR clone detection, velocity-based fraud alerts, AI quality score display, dynamic price splits |
| 🔧 **Admin** | Security, Fraud, Sybil Detection | 🧪 Sybil QR attack simulation (5-city concurrent scan), escrow freeze trigger, QR clone velocity alerts in fraud engine |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND APPLICATION                                  │
│  • SPA Router with RBAC Guards & In-Page Smooth Anchor Scrolling               │
│  • 🔬 AI Visual Quality Oracle (TensorFlow.js MobileNet v2, Edge AI)           │
│  • 🛡️ Spatial-Temporal QR Anti-Cloning (Haversine Velocity Engine)             │
│  • ⛽ ERC-4337 Account Abstraction (Phone OTP + Paymaster)                     │
│  • 🎙️ Vernacular Voice Recognition (Hindi, Tamil, English)                     │
│  • 🔒 zk-SNARK Volume Privacy Toggle                                          │
│  • 5 Role Dashboards (Farmer, Intermediary, Retailer, Consumer, Admin)         │
│  • 🔔 Interactive Notification Center (ORDER_PLACED, ORDER_STATUS)             │
│  • i18n Translation Engine (English, Hindi, Tamil, Telugu)                     │
└───────────────────────────────────┬────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────────┐
│ Real-Time    │             │ Smart        │             │ AI & Cybersec    │
│ Backend API  │             │ Contracts    │             │ Intelligence     │
│ • Express.js │             │ • Solidity   │             │ • Visual Oracle  │
│ • Socket.io  │             │ • Hardhat    │             │   (MobileNet v2) │
│ • Live Mandi │             │ • Sepolia    │             │ • Geo-Velocity   │
│   Oracle     │             │ • Basescan   │             │   Anti-Cloning   │
│ • Paymaster  │             │ • AI Quality │             │ • Fraud Detector │
│   Gas Relay  │             │   Fields     │             │ • Demand ML      │
└──────────────┘             └──────────────┘             └──────────────────┘
```

---

## 📦 Smart Contract Suite (`contracts/`)

| Contract | Purpose | Key Functions |
|:---------|:--------|:--------------|
| [`MarketplaceEscrow.sol`](contracts/MarketplaceEscrow.sol) | Trustless escrow & automated dynamic splits | `createOrder()`, `confirmShipment()`, `confirmDeliveryAndRelease()` |
| [`ProductRegistry.sol`](contracts/ProductRegistry.sol) | Immutable batch registration + **AI Quality Oracle binding** | `registerProduct(... aiQualityScore, aiQualityGrade, imageIpfsHash)`, `ProductQualityVerified` event |
| [`SupplyChainTracker.sol`](contracts/SupplyChainTracker.sol) | Checkpoint and cold-chain temperature logs | `logCheckpoint()`, `getProductCheckpoints()` |
| [`QualityCertifier.sol`](contracts/QualityCertifier.sol) | Organic & AGMARK lab test verifications | `authorizeInspector()`, `issueCertificate()` |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

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
- Product Registry API: `GET/POST http://localhost:4000/api/products`
- Order Settlement API: `GET/POST/PATCH http://localhost:4000/api/orders`
- Health Check: `GET http://localhost:4000/api/health`

### 4. Start the Frontend Application (Port 5173)

```bash
npm run dev
```

Open **http://localhost:5173/** in your browser.

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

---

## 📜 License

MIT License. Developed for transparent agriculture, fair farmer compensation, and tamper-proof food supply chains.
