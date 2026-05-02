# 🃏 RiverPay Poker

**Decentralized Texas Hold'em on Avalanche**  
Smart-contract escrow · USDT settlement · Real-time multiplayer

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 How It Works

1. **Creator** deploys a new room contract via the factory (pays a small amount of AVAX for gas)
2. **Players** deposit USDT into the room contract → receive chips in-game
3. **Play** Texas Hold'em with real-time Socket.io multiplayer
4. **Winners** receive cryptographically-signed withdrawal claims → submit on-chain to claim USDT
5. **Platform** collects 10% commission from winning pots via `sweep()`

All funds are held in isolated per-room smart contracts. The backend never holds player money.

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥ 22 | Runtime |
| npm | ≥ 10 | Package manager |
| MySQL | ≥ 8 | Persistent storage (rooms, users, transactions) |
| Redis | ≥ 7 | Session cache, rate limiting, game state recovery |
| Git | any | Clone the repo |

### 1. Clone & Install

```bash
git clone https://github.com/yanshekki/RiverPay-Poker.git
cd RiverPay-Poker

# Backend
cd poker/poker-backend
npm install

# Frontend
cd ../poker-frontend
npm install
```

### 2. Environment Configuration

Create `poker/poker-backend/.env`:

```env
# ── Server ──
PORT=3001
NODE_ENV=development

# ── Blockchain ──
PRIVATE_KEY=0x_your_backend_private_key
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
USDT_ADDRESS=0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7
PLATFORM_WALLET=0x_your_commission_wallet

# ── CORS ──
CORS_ORIGIN=*

# ── Database ──
DATABASE_URL=mysql://user:password@localhost:3306/poker_db
REDIS_URL=redis://localhost:6379

# ── Auth ──
JWT_SECRET=your_jwt_secret_change_me
JWT_EXPIRES_IN=7d

# ── Platform ──
PLATFORM_FEE_PERCENT=10
```

Create `poker/poker-frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_CHAIN_RPC=https://api.avax.network/ext/bc/C/rpc
VITE_USDT_ADDRESS=0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7
```

> **WalletConnect Project ID**: Get one free at [cloud.reown.com](https://cloud.reown.com) — required for WalletConnect QR codes.

### 3. Database Setup

```bash
cd poker/poker-backend

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

### 4. Deploy Smart Contracts

```bash
cd poker/poker-backend

# Compile Solidity
npx hardhat compile

# Deploy to Avalanche Fuji Testnet (test first!)
npx hardhat run scripts/deploy.js --network fuji

# Deploy to Avalanche Mainnet
npx hardhat run scripts/deploy.js --network avalanche
```

After deployment, `ContractData.json` is auto-generated with the factory address + ABIs.

**Copy it to the frontend:**

```bash
cp ContractData.json ../poker-frontend/src/ContractData.json
```

> ⚠️ The frontend needs `ContractData.json` to interact with the deployed contracts.

### 5. Run

```bash
# From repo root:
./start.sh          # Both backend (:3001) + frontend (:5173)

# Or individually:
./start.sh backend
./start.sh frontend
```

Open **http://localhost:5173** — connect wallet, create a room, deposit USDT, and play!

---

## 🏗 Architecture

```
poker-game/
├── poker-backend/
│   ├── contracts/              # Solidity smart contracts
│   │   ├── PokerFactory.sol    # Factory + Room (OpenZeppelin Clones)
│   │   └── PokerBank.sol       # Standalone bank (alternative)
│   ├── scripts/
│   │   └── deploy.js           # Deployment script (exports ContractData.json)
│   ├── prisma/
│   │   └── schema.prisma       # MySQL schema (User, Room, Transaction)
│   ├── src/
│   │   ├── server.js           # Express + Socket.io entry point
│   │   ├── game/
│   │   │   ├── Room.js         # Texas Hold'em engine + side-pot algorithm
│   │   │   └── Deck.js         # Crypto-secure Fisher-Yates shuffle
│   │   ├── services/
│   │   │   ├── web3.js         # Claim signatures, sweep, deposit verification
│   │   │   └── redis.js        # Session, rate limit, game state persistence
│   │   ├── routes/
│   │   │   └── auth.js         # Nonce challenge + JWT auth
│   │   ├── dto/
│   │   │   └── index.js        # Zod validation schemas
│   │   └── middleware/
│   │       └── validate.js     # Zod validation middleware
│   └── hardhat.config.js
│
├── poker-frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Lobby.jsx       # Main lobby: wallet connect, create room
│   │   │   └── GameRoom.jsx    # Game table, actions, voice chat
│   │   ├── components/
│   │   │   ├── game/           # PokerTable, PlayingCard, ActionPanel, etc.
│   │   │   ├── lobby/          # WalletModal, SettingsModal, RoomList
│   │   │   ├── layout/         # Header, SideMenu
│   │   │   ├── voice/          # Push-to-talk VoiceChat
│   │   │   ├── language/       # LanguageSwitcher (🇭🇰 zh-HK / 🇬🇧 en)
│   │   │   └── ui/             # GlassPanel, TimerBar, Chip, ErrorToast
│   │   ├── hooks/              # useGameSocket, useVoiceChat, useConfetti
│   │   ├── i18n/               # Translation files
│   │   ├── providers/          # Web3Provider (wagmi + WalletConnect)
│   │   ├── store/              # Zustand state
│   │   ├── services/           # Socket.io client
│   │   └── utils/              # spawnConfetti
│   └── tailwind.config.js
│
├── start.sh                    # Start script
└── README.md
```

---

## 🎮 Smart Contracts

### PokerFactory

Factory pattern using OpenZeppelin `Clones` for minimal-proxy room creation (low gas cost).

| Function | Access | Description |
|----------|--------|-------------|
| `constructor(usdt, signer, platformWallet)` | Deployer | Sets immutable USDT, signer, and commission wallet |
| `createRoom(roomId)` | Anyone | Deploys a new room clone (caller pays gas) |
| `setImplementation(address)` | Owner | Upgrades the Room logic template |

### PokerRoom (per-room clone)

| Function | Access | Description |
|----------|--------|-------------|
| `initialize(usdt, signer, wallet, roomId)` | Factory | One-time setup (anti re-init) |
| `deposit(amount)` | Anyone | Deposits USDT → contract escrow |
| `claim(amount, nonce, signature)` | Anyone | Redeems backend-signed withdrawal |
| `sweep()` | backendSigner | Collects accumulated commission |

---

## 🔒 Security

| Layer | Mechanism |
|-------|-----------|
| **Deposit verification** | On-chain tx receipt + Deposit event parsing |
| **Double-spend** | Redis atomic SET NX + DB unique txHash constraint |
| **Withdrawals** | EIP-712 typed signatures + nonce replay protection |
| **Card shuffle** | `crypto.randomInt()` — cryptographically secure |
| **API validation** | Zod schemas on all 8 socket events + 2 REST endpoints |
| **Auth** | Wallet signature challenge → JWT → Socket.io middleware |
| **Rate limiting** | Redis-based: 10 auth/min, 5 actions/sec, 3 deposits/10sec |
| **Game persistence** | Full state (cards, bets, hands) persisted to Redis for crash recovery |

---

## 🌐 Wallet Support

| Wallet | Desktop | Mobile |
|--------|---------|--------|
| MetaMask | ✅ Extension | ✅ App deep-link |
| Brave Wallet | ✅ Built-in | ✅ Built-in |
| Rabby | ✅ Extension | — |
| Coinbase Wallet | ✅ Extension | ✅ App |
| Trust Wallet | — | ✅ App |
| WalletConnect | ✅ QR Code | ✅ QR + deep-link |

---

## 🛠 Tech Stack

**Frontend**  
React 19 · Vite 8 · Tailwind CSS 3 · wagmi 3 · WalletConnect · Framer Motion · Zustand · react-i18next · Socket.io Client

**Backend**  
Express 5 · Socket.io 4 · Prisma · Redis (ioredis) · Zod · ethers.js 6 · JWT

**Smart Contracts**  
Solidity ^0.8.24 · Hardhat · OpenZeppelin (Clones, ECDSA, SafeERC20, Ownable)

---

## 📄 License

MIT © RiverPay Poker

---

## 🏢 Powered by [YSK Limited](https://ysk.hk/)

RiverPay Poker is built and maintained by **YSK Limited** — Hong Kong's premier remote development team specializing in Web3, full-stack systems, and cross-platform app development.

> Need a custom blockchain app? [**Hire us →**](https://ysk.hk/)

---

## 👨‍💻 About the Creator

Built by **[Ki](https://linktr.ee/yanshekki)** — full-stack developer & Web3 builder.

[![Linktree](https://img.shields.io/badge/linktr.ee-yanshekki-39E09B?logo=linktree&logoColor=white)](https://linktr.ee/yanshekki)

### ☕ Support This Project

If you find RiverPay Poker useful, consider buying me a coffee! ❤️

<p align="center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://linktr.ee/yanshekki" alt="Support QR" width="180" />
</p>

| Network | Address |
|---------|---------|
| **EVM** (Ethereum, Avalanche, BSC, Polygon...) | `yanshekki.eth` |
| **NEAR** | `yanshekki.near` |
| **Cardano (ADA)** | `$yanshekki` |

> Every donation helps keep this project alive and evolving. Thank you! 🙏
