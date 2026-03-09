# ⚡ ReactorX: Autonomous Reactive DeFi 

ReactorX is a next-generation decentralized lending and borrowing protocol built exclusively for the **Somnia Network**. Unlike traditional DeFi protocols that rely on external off-chain bots or keepers for liquidations and state updates, ReactorX leverages **Somnia's Native Reactivity** to perform these actions directly on-chain.

![ReactorX Header](https://somnia.network/favicon.ico)

## 🌟 Key Features

- **Native On-Chain Reactivity**: Automatic liquidations and interest updates powered by Somnia's ICE consensus.
- **Dynamic Risk Management**: Real-time health factor monitoring with instant reactive responses to price changes.
- **Premium User Experience**: Glassmorphic UI with support for both Dark and Light themes.
- **AI-Powered Assistant**: Integrated AI support knowledgeable about the protocol architecture and user positions.
- **Integrated AMM**: Seamless asset swapping directly within the platform.
- **Real-Time Event Log**: Persistent transaction history that survives page refreshes.

## 🏗️ Architecture

- **ReactorEngine**: The core lending factory managing collateral, debt, and interest rates.
- **ReactorDex**: A high-speed AMM for swapping between testnet assets (STT, USDC, USDT, WETH).
- **PriceOracle**: A unified price feed system reflecting real-time market values.
- **Somnia ICE**: Utilizing on-chain subscriptions to trigger logic without centralized relays.

## 🚀 Getting Started

### Prerequisites

- [MetaMask](https://metamask.io/) or equivalent EVM wallet.
- Connection to **Somnia Shannon Testnet** (Chain ID: `50312`).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Earnwithalee7890/ReactorX.git
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Configure environment variables (optional):
   Copy `.env.example` to `.env` and fill in your details.

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity ^0.8.20
- **Frontend**: Next.js 15, TypeScript, TailwindCSS (for base layout), Vanilla CSS (for premium components)
- **Blockchain Interaction**: Wagmi, Viem, Ethers.js
- **Network**: Somnia Shannon Testnet

## 💧 Faucet Links

- [Official Somnia Faucet](https://testnet.somnia.network)
- [ReactorX Internal Faucet](https://reactor-x.vercel.app/faucet)

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with 💜 for the **Somnia Reactivity Mini Hackathon**.
