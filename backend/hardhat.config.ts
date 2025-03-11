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

// Unencrypted contract deployment.
task('deploy')
  .addPositionalParam('domain', 'dApp domain which Metamask will be allowed for signing-in')
  .setAction(async (args, hre) => {
    await hre.run('compile')

    // For deployment unwrap the provider to enable contract verification.
    const uwProvider = new JsonRpcProvider(hre.network.config.url)
    const MessageBox = await hre.ethers.getContractFactory(
      'MessageBox',
      new hre.ethers.Wallet(accounts[0], uwProvider)
    )
    const messageBox = await MessageBox.deploy(args.domain)
    await messageBox.waitForDeployment()

    console.log(`MessageBox address: ${await messageBox.getAddress()}`)
    return messageBox
  })

// Read message from the MessageBox.
task('message')
  .addPositionalParam('address', 'contract address')
  .setAction(async (args, hre) => {
    await hre.run('compile')

    const messageBox = await hre.ethers.getContractAt('MessageBox', args.address)
    const domain = await messageBox.domain()

    const acc = new hre.ethers.Wallet(accounts[0], hre.ethers.provider)
    const siweMsg = new SiweMessage({
      domain,
      address: await acc.getAddress(),
      uri: domain.includes(':') ? domain : `http://${domain}`,
      version: '1',
      chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    }).toMessage()
    const sig = hre.ethers.Signature.from(await acc.signMessage(siweMsg))
    const authToken = await messageBox.login(siweMsg, sig)
    const message = await messageBox.message(authToken)
    const author = await messageBox.author()
    console.log(`The message is: ${message}, author: ${author}`)
  })

// Set message.
task('setMessage')
  .addPositionalParam('address', 'contract address')
  .addPositionalParam('message', 'message to set')
  .setAction(async (args, hre) => {
    await hre.run('compile')

    let messageBox = await hre.ethers.getContractAt('MessageBox', args.address)
    const tx = await messageBox.setMessage(args.message)
    const receipt = await tx.wait()
    console.log(`Success! Transaction hash: ${receipt!.hash}`)
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
    version: '0.8.16',
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
