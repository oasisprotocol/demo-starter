import { promises as fs } from 'fs'
import path from 'path'

import '@nomicfoundation/hardhat-ethers'
import '@oasisprotocol/sapphire-hardhat'
import '@typechain/hardhat'
import canonicalize from 'canonicalize'
import { JsonRpcProvider, Wallet } from 'ethers'
import 'hardhat-watcher'
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'
import { HardhatUserConfig, task } from 'hardhat/config'
import { SiweMessage } from 'siwe'
import 'solidity-coverage'
import { HDAccountsUserConfig } from 'hardhat/types'

const TASK_EXPORT_ABIS = 'export-abis'

task(TASK_COMPILE, async (_args, hre, runSuper) => {
  await runSuper()
  await hre.run(TASK_EXPORT_ABIS)
})

task(TASK_EXPORT_ABIS, async (_args, hre) => {
  const srcDir = path.basename(hre.config.paths.sources)
  const outDir = path.join(hre.config.paths.root, 'abis')

  const [artifactNames] = await Promise.all([
    hre.artifacts.getAllFullyQualifiedNames(),
    fs.mkdir(outDir, { recursive: true }),
  ])

  await Promise.all(
    artifactNames.map(async fqn => {
      const { abi, contractName, sourceName } = await hre.artifacts.readArtifact(fqn)
      if (abi.length === 0 || !sourceName.startsWith(srcDir) || contractName.endsWith('Test')) return
      await fs.writeFile(`${path.join(outDir, contractName)}.json`, `${canonicalize(abi)}\n`)
    })
  )
})

// BattleChess deployment with automatic frontend env update
task('deploy-battlechess').setAction(async (_, hre) => {
  await hre.run('compile')

  const [deployer] = await hre.ethers.getSigners()
  const battleChess = await (await hre.ethers.deployContract('BattleChess')).waitForDeployment()
  const address = await battleChess.getAddress()

  console.log(`BattleChess deployed to: ${address}`)

  // Update frontend environment file if it exists
  const envPath = path.join(__dirname, '../../frontend/.env.development')
  try {
    await fs.access(envPath) // Check if file exists
    await fs.writeFile(envPath, `VITE_GAME_ADDR=${address}\nVITE_NETWORK=0x5afd\n`)
    console.log(`Updated frontend config at ${envPath}`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Frontend env file not found at ${envPath}, skipping auto-update`)
    } else {
      console.warn(`Could not update frontend config: ${err}`)
    }
  }

  return battleChess
})

// Create a new chess game
task('create-game')
  .addPositionalParam('address', 'contract address')
  .setAction(async (args, hre) => {
    await hre.run('compile')

    const battleChess = await hre.ethers.getContractAt('BattleChess', args.address)
    const dummyHash = hre.ethers.keccak256('0x01')
    const tx = await battleChess.create(dummyHash)
    const receipt = await tx.wait()
    console.log(`Game created! Transaction hash: ${receipt!.hash}`)
  })

// View board state
task('view-board')
  .addPositionalParam('address', 'contract address')
  .addPositionalParam('gameId', 'game ID')
  .setAction(async (args, hre) => {
    await hre.run('compile')

    const battleChess = await hre.ethers.getContractAt('BattleChess', args.address)
    const board = await battleChess.viewBoard(args.gameId)
    console.log('Board state:', board)
  })

// Hardhat Node and sapphire-localnet test mnemonic.
const TEST_HDWALLET: HDAccountsUserConfig = {
  mnemonic: 'test test test test test test test test test test test junk',
  path: "m/44'/60'/0'/0",
  initialIndex: 0,
  count: 20,
  passphrase: '',
}
const firstPrivateKey = Wallet.fromPhrase(TEST_HDWALLET.mnemonic).privateKey

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [firstPrivateKey]

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      // https://hardhat.org/metamask-issue.html
      chainId: 1337,
    },
    sapphire: {
      url: 'https://sapphire.oasis.io',
      chainId: 0x5afe,
      accounts,
    },
    'sapphire-testnet': {
      url: 'https://testnet.sapphire.oasis.io',
      chainId: 0x5aff,
      accounts,
    },
    'sapphire-localnet': {
      // docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet
      url: 'http://localhost:8545',
      chainId: 0x5afd,
      accounts,
    },
  },
  solidity: {
    version: '0.8.25',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  watcher: {
    compile: {
      tasks: ['compile'],
      files: ['./contracts/'],
    },
    test: {
      tasks: ['test'],
      files: ['./contracts/', './test'],
    },
    coverage: {
      tasks: ['coverage'],
      files: ['./contracts/', './test'],
    },
  },
  mocha: {
    require: ['ts-node/register/files'],
    timeout: 50_000,
  },
}

export default config
