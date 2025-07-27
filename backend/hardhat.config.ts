import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  networks: {
    sapphire: {
      url: "https://sapphire.oasis.io", // hoặc testnet: https://testnet.sapphire.oasis.io
      chainId: 23294, // 0x5afe
      accounts: [process.env.PRIVATE_KEY!], // key để deploy
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;