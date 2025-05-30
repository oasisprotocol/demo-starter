# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Oasis Sapphire Time Capsule dApp demonstrating confidential time-locked messages. It consists of:
- **Backend**: Solidity smart contract (`TimeCapsule`) with Hardhat tooling
- **Frontend**: React-based web application using Vite, RainbowKit, and wagmi

## Common Development Commands

### Backend (in `backend/` directory)

```bash
# Install dependencies (from root)
pnpm install

# Build contracts and generate TypeScript bindings
pnpm build

# Run tests on Sapphire Localnet
npx hardhat test --network sapphire-localnet

# Deploy contract
export PRIVATE_KEY=0x...
npx hardhat deploy yourdomain.com --network sapphire-testnet
npx hardhat deploy yourdomain.com --network sapphire

# Hardhat tasks for contract interaction
npx hardhat set-message <address> "message" <duration_in_seconds> --network <network>
npx hardhat get-message <address> --network <network>

# Linting and formatting
pnpm lint
pnpm format
```

### Frontend (in `frontend/` directory)

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
pnpm test:setup  # Install Playwright dependencies
```

### Root-level commands

```bash
# Code quality
pnpm eslint
pnpm prettier-check
pnpm prettier
```

## Architecture Overview

### Smart Contract (`TimeCapsule.sol`)

The contract inherits from `SiweAuth` for authentication and implements:
- `setMessage()`: Store a message with a reveal timestamp
- `getMessage()`: Retrieve message after reveal time (author only)
- `getCapsuleStatus()`: Public view of capsule state

Key features:
- Messages are encrypted until reveal time
- Only the message author can retrieve after unlock
- Uses SIWE (Sign-In with Ethereum) for authentication

### Frontend Structure

- **Provider Stack**: ErrorBoundary → Wagmi → QueryClient → RainbowKit → Web3Auth → AppState
- **Routing**: Hash-based routing with React Router
- **State Management**: React Context for app state and Web3 authentication
- **Styling**: CSS Modules for component isolation
- **Network Support**: Sapphire Mainnet, Testnet, and Localnet

### Environment Configuration

Backend deployment requires:
- `PRIVATE_KEY`: Hex-encoded private key for deployment

Frontend requires:
- `VITE_MESSAGE_BOX_ADDR`: Deployed TimeCapsule contract address
- `VITE_NETWORK`: Network ID (0x5afe for mainnet, 0x5aff for testnet, 0x5afd for localnet)

## Testing Strategy

- Backend: Hardhat tests with time manipulation for capsule unlock testing
- Frontend: Playwright E2E tests
- Local development: Sapphire Localnet Docker container

## Key Dependencies

- **Backend**: Hardhat, ethers.js v6, @oasisprotocol/sapphire-contracts, TypeChain
- **Frontend**: React 18, Vite, wagmi v2, RainbowKit, @oasisprotocol/sapphire-wagmi-v2