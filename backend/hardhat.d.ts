import "hardhat/types/runtime";

import "@nomicfoundation/hardhat-ethers";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    ethers: typeof import("ethers");
  }
}