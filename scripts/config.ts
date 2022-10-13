import * as fs from "fs";

require("dotenv").config();

export interface NetInfo {
  rpcUrl: string;
  contractAddress: string;
}

export interface Config {
  goerli: NetInfo;
  uniquerc: NetInfo;

  metamaskPrivateKey: string;
  network: Network;
}

export enum Network {
  LOCALHOST = "localhost",
  GOERLI = "goerli",
  UNIQUERC = "uniquerc",
}

function readContractAddress(network: Network) {
  const filename = `./dist/${network}.json`;
  if (fs.existsSync(filename)) {
    const fileStr = fs.readFileSync(filename).toString();
    return JSON.parse(fileStr).contractAddress;
  }

  const key = `${network.toUpperCase()}_CONTRACT_ADDRESS`;
  return process.env[key];
}

export const config: Config = {
  goerli: {
    rpcUrl: process.env.GOERLI_RPC_URL as string,
    contractAddress: readContractAddress(Network.GOERLI),
  },
  uniquerc: {
    rpcUrl: process.env.UNIQUERC_RPC_URL as string,
    contractAddress: readContractAddress(Network.UNIQUERC),
  },
  metamaskPrivateKey: process.env.METAMASK_PRIVATE_KEY as string,
  network: process.env.HARDHAT_NETWORK as Network,
};
