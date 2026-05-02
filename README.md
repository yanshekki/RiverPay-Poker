# 🃏 RiverPay Poker

**Decentralized Texas Hold'em Poker on Avalanche**  
Smart-contract secured · USDT settlement · Real-time multiplayer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue)](https://soliditylang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)

---

## 📖 Overview

RiverPay Poker is a fully decentralized poker platform running on the **Avalanche C-Chain**. Every game room is its own smart contract deployed via factory pattern, ensuring complete transparency and trustless settlement. Players deposit USDT directly into the room contract and receive cryptographically-signed withdrawal claims from the backend.

### 🔑 Key Features

- **Trustless Settlement** — All funds held in auditable smart contracts. The backend cannot withdraw player funds.
- **Factory Contract Pattern** — Each poker room gets its own clone contract for complete isolation.
- **USDT Native** — Play with real USDT on Avalanche. Automatic 10% platform commission on wins.
- **EIP-712 Signed Withdrawals** — Backend signs withdrawal claims; players submit them on-chain.
- **Multi-Wallet Support** — MetaMask, Trust Wallet, Coinbase Wallet, Rainbow, Rabby, OKX, WalletConnect (mobile).
- **Push-to-Talk Voice Chat** — Hold mic button to speak to everyone at the table.
- **Multi-Language** — 廣東話 (zh-HK) · English
- **Real-Time** — Socket.io-powered game state, turn timer, and live pot updates.
- **Responsive** — Desktop elliptical table + mobile vertical layout.

---

## 🏗 Architecture

```
poker-game/
├── poker-backend/           # Express + Socket.io + Prisma
│   ├── contracts/           # Solidity smart contracts
│   │   ├── PokerFactory.sol # Factory + Room (Clone pattern)
│   │   └── PokerBank.sol    # Standalone bank contract
│   ├── src/
│   │   ├── server.js        # Main server entry
│   │   ├── game/            # Texas Hold'em engine
│   │   │   ├── Room.js      # Game logic + side-pot algorithm
│   │   │   └── Deck.js      # Shuffled deck
│   │   ├── services/        # Web3, Redis, DB
│   │   ├── routes/          # REST API routes
│   │   ├── dto/             # Zod validation schemas
│   │   └── middleware/      # Auth + validation middleware
│   ├── prisma/              # Database schema
│   └── hardhat.config.js    # Smart contract tooling
│
├── poker-frontend/          # React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── pages/           # Lobby + GameRoom
│   │   ├── components/
│   │   │   ├── ui/          # GlassPanel, NeonButton, Chip, TimerBar…
│   │   │   ├── game/        # PokerTable, PlayingCard, PlayerBadge, ActionPanel…
│   │   │   ├── lobby/       # WalletModal, SettingsModal, RoomList…
│   │   │   ├── voice/       # VoiceChat (push-to-talk)
│   │   │   ├── layout/      # Header, SideMenu
│   │   │   └── language/    # LanguageSwitcher
│   │   ├── hooks/           # useGameSocket, useVoiceChat, useConfetti
│   │   ├── i18n/            # Translation files (en, zh-HK)
│   │   ├── config/          # Environment config
│   │   ├── providers/       # Web3Provider (wagmi + Web3Modal)
│   │   ├── store/           # Zustand state
│   │   └── services/        # Socket.io client
│   └── tailwind.config.js   # Custom design tokens + animations
└── start.sh                 # Quick start script
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 22
- MySQL + Redis (or Docker)
- Avalanche C-Chain RPC access

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/riverpay-poker.git
cd riverpay-poker

# Backend
cd poker/poker-backend
npm install
npx prisma generate
npx prisma db push

# Frontend
cd ../poker-frontend
npm install
```

### 2. Configure Environment

**Backend** (`poker/poker-backend/.env`):

```env
PORT=3001
PRIVATE_KEY=0x_your_backend_private_key
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
DATABASE_URL=mysql://user:pass@localhost:3306/poker_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=*
```

**Frontend** (`poker/poker-frontend/.env`):

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_CHAIN_RPC=https://api.avax.network/ext/bc/C/rpc
VITE_USDT_ADDRESS=0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7
```

### 3. Deploy Smart Contracts

```bash
cd poker/poker-backend
npx hardhat compile
npx hardhat run scripts/deploy.js --network avalanche
# Update ContractData.json in both backend/ and frontend/src/
```

### 4. Run

```bash
./start.sh         # Both backend + frontend
# or individually:
./start.sh backend # Express on :3001
./start.sh frontend # Vite on :5173
```

Open **http://localhost:5173** — connect wallet, create a room, and play!

---

## 🎮 Smart Contracts

### PokerFactory.sol

Factory pattern using OpenZeppelin's `Clones` library. Each room is a minimal proxy clone, dramatically reducing gas costs.

| Function | Description |
|----------|-------------|
| `createRoom(roomId)` | Deploys a new room clone (player pays gas) |
| `setImplementation(address)` | Upgrades the room logic template |

### PokerRoom.sol (per-room clone)

| Function | Description |
|----------|-------------|
| `deposit(amount)` | Player deposits USDT → receives chips |
| `claim(amount, nonce, signature)` | Backend-signed withdrawal |
| `sweep()` | Backend collects platform commission |

---

## 🔒 Security

- **Non-custodial** — Backend never holds player funds. All funds are in room contracts.
- **EIP-712 signatures** — Withdrawals require cryptographically-verified backend signatures.
- **Transaction verification** — Every deposit is validated on-chain before chips are credited.
- **Replay protection** — Nonce-based signature scheme + Redis transaction deduplication.
- **DTO validation** — All API and socket parameters validated with Zod schemas.
- **Rate limiting** — Redis-based rate limiting on auth endpoints.

---

## 🌐 Wallet Support

| Wallet | Desktop | Mobile | Method |
|--------|---------|--------|--------|
| MetaMask | ✅ | ✅ | Browser Extension / WalletConnect |
| Trust Wallet | ✅ | ✅ | WalletConnect |
| Coinbase Wallet | ✅ | ✅ | Browser Extension / WalletConnect |
| Rainbow | ✅ | ✅ | WalletConnect |
| Rabby | ✅ | ✅ | Browser Extension / WalletConnect |
| OKX Wallet | ✅ | ✅ | WalletConnect |
| Any WalletConnect | ✅ | ✅ | QR Code / Deep Link |

---

## 🛠 Tech Stack

**Frontend**  
React 19 · Vite 8 · Tailwind CSS 3 · wagmi 3 · Web3Modal · Framer Motion · Zustand · react-i18next · Socket.io Client

**Backend**  
Express 5 · Socket.io 4 · Prisma · Redis (ioredis) · Zod · ethers.js 6 · JSON Web Token

**Smart Contracts**  
Solidity ^0.8.20 · Hardhat · OpenZeppelin (Clones, ECDSA, SafeERC20)

---

## 📄 License

MIT © RiverPay Poker

---

**Built for trustless, transparent poker on Avalanche.** 🃏
