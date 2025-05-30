# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Oasis Sapphire Fog-of-War Chess dApp demonstrating confidential gameplay mechanics. It consists of:

- **Backend**: Solidity smart contract (`BattleChess`) with Hardhat tooling
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
pnpm hardhat deploy-battlechess --network sapphire-testnet
pnpm hardhat deploy-battlechess --network sapphire

# Hardhat tasks for contract interaction
pnpm hardhat create-game <address> --network <network>
pnpm hardhat view-board <address> <gameId> --network <network>

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

### Smart Contract (`BattleChess.sol`)

The contract implements fog-of-war chess with confidential board state:

- `create()`: Create a new game with optional random first move
- `join()`: Join an existing game  
- `commit()`: Submit a hashed move
- `reveal()`: Reveal the actual move
- `claimTimeout()`: Claim victory if opponent times out
- `viewBoard()`: View board with fog-of-war visibility

Key features:

- Full board state is kept confidential
- Players only see their own pieces and adjacent squares
- Commit-reveal pattern prevents front-running
- Hash-based replay protection
- Automatic queen promotion for pawns

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

- `VITE_GAME_ADDR`: Deployed BattleChess contract address
- `VITE_NETWORK`: Network ID (0x5afe for mainnet, 0x5aff for testnet, 0x5afd for localnet)

## Testing Strategy

- Backend: Hardhat tests with time manipulation for capsule unlock testing
- Frontend: Playwright E2E tests
- Local development: Sapphire Localnet Docker container

## Key Dependencies

- **Backend**: Hardhat, ethers.js v6, @oasisprotocol/sapphire-contracts, TypeChain
- **Frontend**: React 18, Vite, wagmi v2, RainbowKit, @oasisprotocol/sapphire-wagmi-v2
