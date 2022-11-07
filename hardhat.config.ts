import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config } from "./scripts/config";

const hardhatConfig: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {},
    goerli: {
      url: config.goerli.rpcUrl,
      accounts: [`0x${config.metamaskPrivateKey}`],
    },
    moonbeam: {
      url: config.moonbeam.rpcUrl,
      accounts: [`0x${config.metamaskPrivateKey}`],
    },
    uniquerc: {
      url: config.uniquerc.rpcUrl,
      accounts: [`0x${config.metamaskPrivateKey}`],
    },
  },
};

export default hardhatConfig;
