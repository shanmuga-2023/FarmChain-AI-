# 🌾 FarmChain AI — Polygon Amoy Blockchain Integration Guide

> **Network**: Polygon Amoy Testnet  
> **Chain ID**: `80002` (`0x13882`)  
> **Currency**: POL (formerly MATIC)  
> **RPC Endpoint**: `https://rpc-amoy.polygon.technology/`  
> **Block Explorer**: [amoy.polygonscan.com](https://amoy.polygonscan.com/)  
> **Deployer / Admin Address**: [`0xFee2B36737BDdBB3AB8C0924B013f898e512715F`](https://amoy.polygonscan.com/address/0xFee2B36737BDdBB3AB8C0924B013f898e512715F)  

---

## 1. Overview & Hybrid Architecture

FarmChain AI implements an **enterprise hybrid architecture** that balances on-chain cryptographic security with off-chain performance:

| Component | Responsibility | Technology |
|---|---|---|
| **Smart Contract** | Immutable batches, ownership tracking, stage transitions, price audit trail, quality certificate hashes | Solidity `^0.8.24`, OpenZeppelin `AccessControl`, Hardhat |
| **Backend API** | Ethers.js relayer, cryptographic hashing (SHA-256), verification endpoint, Socket.IO live sync | Node.js, Express, Ethers v6, Socket.IO |
| **Frontend** | MetaMask wallet switcher, on-chain minting toggle, QR camera scanner, provenance verification badge | Vite, Vanilla JS, HTML5-QRCode, Canvas QR |
| **Blockchain Network** | Polygon Amoy Testnet (Chain ID: 80002) | Polygon PoS |

---

## 2. Quick Setup & Faucet Funding

Your wallet address on Polygon Amoy is:
```
0xFee2B36737BDdBB3AB8C0924B013f898e512715F
```

### Step 1: Claim Free Testnet POL
To deploy contracts or send on-chain transactions using your address, you need testnet POL for gas:
1. Open the official Polygon Faucet: **[faucet.polygon.technology](https://faucet.polygon.technology/)**
   - Alternatively: **[alchemy.com/faucets/polygon-amoy](https://www.alchemy.com/faucets/polygon-amoy)**
2. Select **Polygon Amoy**.
3. Paste your wallet address: `0xFee2B36737BDdBB3AB8C0924B013f898e512715F`.
4. Click **Submit**. Within 1–2 minutes, your balance on [PolygonScan](https://amoy.polygonscan.com/address/0xFee2B36737BDdBB3AB8C0924B013f898e512715F) will show ~0.2 to 0.5 POL.

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

If you wish to deploy directly to Polygon Amoy from the CLI using your wallet:
1. Export your private key from MetaMask (Account Details → Show Private Key).
2. Set `BLOCKCHAIN_PRIVATE_KEY` in `.env` and `blockchain/.env`:
```env
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
```
*(Note: If no private key is set, FarmChain AI operates in **Resilient Cryptographic Hybrid Mode** with full SHA-256 provenance proofs and seamless MetaMask browser interactions!)*

---

## 3. Smart Contract Commands

### Compile Contracts
```bash
npm run compile:contracts
```

### Run Full Test Suite (35 Tests Passing)
```bash
npm run test:contracts
```
Covers:
- Batch creation & total counter increments
- Duplicate batch ID prevention
- Ownership transfer & unauthorized transfer rejection
- Zero-address rejection
- Price update history & non-zero validations
- Quality certificates & inspector role enforcement
- Data hash cryptographic verification (`verifyBatchHash`)
- Consumer verification (`verifyBatch`)
- Stage transitions (`Harvested` → `InTransit` → `QualityChecked` → `AtRetailer` → `Sold`)
- Role management (`FARMER_ROLE`, `INTERMEDIARY_ROLE`, `RETAILER_ROLE`, `QUALITY_INSPECTOR_ROLE`)

### Deploy Locally (Mock Hardhat Network)
```bash
npm run deploy:contracts:local
```

### Deploy to Polygon Amoy Testnet
Once your wallet has testnet POL and your private key is set in `blockchain/.env`:
```bash
npm run deploy:contracts:amoy
```
The deploy script automatically exports the ABI and deployed address to:
- `frontend/src/contracts/AgriSupplyChain.json`
- `backend/config/contractConfig.json`

---

## 4. Running the Full Stack Application

### Start the Backend Server (Port 4000)
```bash
npm run start
```
Starts Express + Socket.IO with blockchain endpoints:
- `GET /api/blockchain/status` — Network status & contract connectivity
- `POST /api/blockchain/batch` — Record batch on-chain (farmer)
- `POST /api/blockchain/transfer` — Transfer batch ownership
- `POST /api/blockchain/stage` — Transition produce stage & record price
- `POST /api/blockchain/certificate` — Register lab certificate hash
- `GET /api/blockchain/batch/:batchId` — Read batch data
- `GET /api/blockchain/verify/:batchId` — Public consumer verification
- `GET /api/blockchain/history/:batchId` — Full stage & price history

### Start the Frontend Application (Port 5173)
In another terminal:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser with MetaMask installed.

---

## 5. End-to-End User Verification Flows

### Flow A: Farmer Mints Batch
1. Log in as Farmer (or click demo login).
2. Go to **List New Produce / Wizard**.
3. Fill details or speak via voice recognition.
4. On Step 3 (Confirmation), note the **"Mint On-Chain Batch on Polygon Amoy"** badge and toggle.
5. Click **Publish Listing**. The batch is cryptographically hashed and registered.

### Flow B: Consumer QR Scan & Verification
1. Log in or open **Consumer → Trace Product**.
2. Click **📸 Open Camera QR Scanner** to scan a physical/screen QR code, or pick any batch from the dropdown.
3. The app queries the blockchain verification endpoint:
   - Validates batch integrity on-chain
   - Displays the **🟣 Verified on Polygon Amoy (80002) ↗** badge linking directly to PolygonScan
   - Displays the full **Product Journey Timeline** with cryptographic hashes
   - Shows the fair price transparency breakdown (Farmer guaranteed % vs Middlemen)
