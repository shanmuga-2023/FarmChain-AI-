# 🌾 FarmChain AI 2.0

### Production-Grade Decentralized Farm-to-Consumer Marketplace & Agritech Trust Protocol

> A full-stack decentralized agricultural platform connecting farmers directly to consumers with **EVM Solidity smart contracts**, **live eNAM/AgMarkNet Mandi oracles**, **vernacular voice-based crop registration (Hindi, Tamil, English)**, **cryptographic QR anti-counterfeiting & camera scanning**, **streamlined 2-event real-time notifications**, **role-based access control (RBAC)**, and **public testnet explorer verification**.

[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20-363636?style=for-the-badge&logo=solidity)](contracts/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20Socket.io-339933?style=for-the-badge&logo=nodedotjs)](server/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20Vanilla%20JS-646CFF?style=for-the-badge&logo=vite)](src/)
[![Multilingual](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20TA%20%7C%20TE-22c55e?style=for-the-badge)](src/i18n/)
[![Voice](https://img.shields.io/badge/Voice%20AI-Web%20Speech%20API%20(HI%2C%20TA%2C%20EN)-f59e0b?style=for-the-badge)](src/utils/voice.js)
[![Security](https://img.shields.io/badge/Security-RBAC%20%2B%20Anti--Tamper%20QR-06b6d4?style=for-the-badge)](src/utils/)

---

## 📌 Problem & Enterprise Solution

Indian farmers routinely lose **40–60% of crop value** to opaque intermediary markups, arbitrary spot prices, paper certificate fraud, and delayed payment settlements.

**FarmChain AI 2.0** solves this through:
1. **Decentralized Escrow (`MarketplaceEscrow.sol`)**: Automatically enforces a **60% Farmer / 20% Intermediary / 15% Retailer / 5% Platform** revenue distribution upon delivery verification.
2. **🎙️ Vernacular Voice Registration (`src/utils/voice.js`)**: Real smallholder farmers speak naturally in **Hindi (हिंदी)**, **Tamil (தமிழ்)**, or **English**, and the Web Speech NLP parser auto-fills the product listing form.
3. **🛡️ QR Anti-Counterfeit & Provenance Verification (`src/pages/consumer/trace.js`)**: Physical produce labels are cryptographically verified; genuine batches display the complete farm-to-fork journey, while fake/tampered QR codes trigger instant **"🚨 Cryptographic Verification Failed"** alerts.
4. **📡 Wi-Fi Resilient Mandi Oracle (`src/utils/api.js`)**: Streams real-time commodity spot rates from eNAM and AgMarkNet with local caching for zero-freeze offline demo resilience.
5. **🔔 Streamlined 2-Event Notification Center (`src/utils/notifications.js`)**: Real-time interactive notification dropdown delivering high-priority alerts for `ORDER_PLACED` (with escrow lock breakdown) and `ORDER_STATUS_CHANGED` (accepted, shipped, delivered).
6. **🚨 Live Fraud Anomaly Detection (`src/ai/fraud-detector.js`)**: Real-time ML flags predatory price markups (>50% above AI fair benchmark) and suspicious batch manipulation in the Admin dashboard.
7. **⛓️ Public Testnet Verification (`src/web3/contracts.js`)**: Live transaction hashes and contract addresses with direct clickable **Etherscan Sepolia** and **Basescan Sepolia** explorer links.
8. **🔐 Role-Based Access Control (RBAC)**: Route guards protect all 5 stakeholder dashboards with automatic redirection and session management.

---

## 🗺️ Role-Based Modules & Key Capabilities

| Role | Core Workflows | Hackathon Highlights |
|:-----|:---------------|:---------------------|
| 🌾 **Farmer** | Voice Crop Listing, Orders, AI Pricing | 🎙️ Voice input in Hindi/Tamil/English, live APMC Mandi benchmark pricing, high-res Base64 QR code generation, order fulfillment |
| 🏪 **Intermediary** | Bulk Procurement, Logistics, Inventory | B2B wholesale order routing, real-time inventory stock management, automated 20% margin tracking |
| 🛒 **Retailer** | Wholesale Sourcing, Shelf QR | Category-filtered B2B catalog, supplier verification ratings, printable customer shelf QR tags |
| 👤 **Consumer** | Marketplace, Checkout, Provenance | Dynamic 60/20/15/5% price breakdown, order history tracking, 1-click authentic vs spoofed QR demo showcase |
| 🔧 **Admin** | Platform Health, Security, AI Insights | Blockchain block explorer with Etherscan links, live fraud spike simulation (+140% markup), predictive demand forecasting, user moderation |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND APPLICATION                            │
│  • SPA Router with RBAC Guards & In-Page Smooth Anchor Scrolling       │
│  • 🎙️ Vernacular Voice Recognition (Hindi, Tamil, English)             │
│  • 5 Role Dashboards (Farmer, Intermediary, Retailer, Consumer, Admin)  │
│  • 🔔 Interactive Notification Center (ORDER_PLACED, ORDER_STATUS)     │
│  • 🛡️ Anti-Counterfeit Produce Provenance & Live Camera QR Scanner     │
│  • i18n Translation Engine (English, Hindi, Tamil, Telugu)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ Real-Time    │             │ Smart        │             │ AI           │
│ Backend API  │             │ Contracts    │             │ Intelligence │
│ • Express.js │             │ • Solidity   │             │ • Fair Price │
│ • Socket.io  │             │ • Hardhat    │             │   Mandi Model│
│ • Live Mandi │             │ • Sepolia    │             │ • Fraud Det. │
│   Oracle     │             │ • Basescan   │             │ • Demand ML  │
└──────────────┘             └──────────────┘             └──────────────┘
```

---

## 📦 Smart Contract Suite (`contracts/`)

| Contract | Purpose | Key Functions |
|:---------|:--------|:--------------|
| [`MarketplaceEscrow.sol`](contracts/MarketplaceEscrow.sol) | Trustless escrow & automated 60/20/15/5 split | `createOrder()`, `confirmShipment()`, `confirmDeliveryAndRelease()` |
| [`ProductRegistry.sol`](contracts/ProductRegistry.sol) | Immutable batch registration & metadata | `registerProduct()`, `updateProductPrice()`, `getProduct()` |
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

| Role | Email | Password |
|:-----|:------|:---------|
| 🌾 **Farmer** | `farmer@farmchain.io` | `farmer123` |
| 🏪 **Intermediary** | `trader@farmchain.io` | `trader123` |
| 🛒 **Retailer** | `retailer@farmchain.io` | `retailer123` |
| 👤 **Consumer** | `consumer@farmchain.io` | `consumer123` |
| 🔧 **Admin** | `admin@farmchain.io` | `admin123` |

---

## 🧪 1-Click Judge Demo Showcase Guide

1. **🎙️ Voice Registration Demo**:
   - Log in as Farmer (`farmer@farmchain.io`).
   - Go to **My Products** $\rightarrow$ Click **➕ Add Product** $\rightarrow$ Click **🎙️ Start Speaking** (select Hindi/Tamil/English).
   - Say *"500 kg Basmati Rice at 48 rupees"* $\rightarrow$ fields auto-fill $\rightarrow$ AI Fair Price suggests market rates $\rightarrow$ Register on blockchain.
2. **📱 QR Generation Demo**:
   - Click the 📱 QR button on the registered batch to view the high-resolution scannable QR label.
3. **🛡️ Consumer Trace & Anti-Counterfeit Demo**:
   - Log in as Consumer (`consumer@farmchain.io`) $\rightarrow$ Navigate to **Trace Product**.
   - Click **✅ Test Authentic Batch** $\rightarrow$ reveals full blockchain journey & 60% farmer escrow split.
   - Click **🚨 Test Spoofed / Fake QR** $\rightarrow$ triggers instant **Cryptographic Verification Failed** security rejection.
4. **🔔 Real-Time Order Notifications**:
   - Place an order as Consumer $\rightarrow$ Farmer gets instant `🛍️ Order Placed` notification with escrow lock details in the topbar bell 🔔 dropdown.
   - Accept & Ship as Farmer $\rightarrow$ Consumer gets instant `🚚 Order Shipped` notification.
5. **🚨 Live Fraud Anomaly Demo**:
   - Log in as Admin (`admin@farmchain.io`) $\rightarrow$ Go to **Fraud Alerts**.
   - Click **🧪 Trigger Live Fraud Spike (+140% Markup)** $\rightarrow$ real-time anomaly flagged with 95% critical risk score.

---

## 📜 License

MIT License. Developed for transparent agriculture, fair farmer compensation, and tamper-proof food supply chains.
