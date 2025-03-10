# Oasis Starter dApp

This is a skeleton for confidential Oasis dApps:

- `backend` contains the example MessageBox Solidity contract and Hardhat utils
  for deploying the contract and managing it via command line.
- `frontend` contains a React-based web application which communicates with your
  smart contract.

This monorepo is set up for `pnpm`. Install dependencies by running:

```sh
pnpm install
```

## Backend

Move to the `backend` folder and build smart contracts:

```sh
pnpm build
```

### Localnet deployment and Testing

Spin up the [Sapphire Localnet] image:

```shell
docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet
```

Once Localnet is ready, deploy the contract using the first test account by
invoking:

```shell
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
npx hardhat deploy localhost --network sapphire-localnet
```

Similarly, you can run tests on Localnet:

```shell
npx hardhat test --network sapphire-localnet
```

### Production deployment

Prepare your hex-encoded private key for paying the deployment gas fee and store
it as an environment variable:

```shell
export PRIVATE_KEY=0x...
```

Alternative CMD command for Windows:

```powershell
set PRIVATE_KEY=0x...
```

To deploy the contract on Testnet or Mainnet for your dApp that will be
accessible on `yourdomain.com`:

```shell
npx hardhat deploy yourdomain.com --network sapphire-testnet
npx hardhat deploy yourdomain.com --network sapphire
```

[Sapphire Localnet]: https://github.com/oasisprotocol/oasis-web3-gateway/pkgs/container/sapphire-localnet

## Frontend

Once the contract is deployed, the MessageBox address will be reported. Store it
inside the `frontend` folder's `.env.development` (for Localnet) or
`.env.production` (for Testnet or Mainnet - uncomment the appropriate network),
for example:

```
VITE_MESSAGE_BOX_ADDR=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Run locally

Run the hot-reload version of the frontend configured in `.env.development` by
running:

```sh
pnpm dev
```

Navigate to http://localhost:5173 with your browser to view your dApp. Some
browsers (e.g. Brave) may require https connection and a CA-signed certificate
to access the wallet. In this case, read the section below on how to properly
deploy your dApp.

Note: If you use the same MetaMask accounts in your browser and restart the
sapphire-localnet docker image, don't forget to _clear your MetaMask activity_
each time to fetch correct account nonce.

### Production deployment

Build assets for deployment by running:

```sh
pnpm build
```

`dist` folder will contain the generated HTML files that can be hosted.

#### Different Website Base

If run dApp on a non-root base dir, add

```
BASE_DIR=/my/public/path
```

to `.env.production` and bundle the app with

```
pnpm build-only --base=/my/public/path/
```

Then copy the `dist` folder to a place of your `/my/public/path` location.
