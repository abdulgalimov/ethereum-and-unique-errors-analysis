import * as fs from "fs";

require("dotenv").config();

export interface NetInfo {
  rpcUrl: string;
  contractAddress: string;
}

export interface UniquercNetInfo extends NetInfo {
  wssUrl: string;
  seed: string;
}

export interface Config {
  localhost: NetInfo;
  goerli: NetInfo;
  moonbeam: NetInfo;
  uniquerc: UniquercNetInfo;

  metamaskPrivateKey: string;
  network: Network;
}

export enum Network {
  LOCALHOST = "localhost",
  GOERLI = "goerli",
  MOONBEAM = "moonbeam",
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
  localhost: {
    rpcUrl: "http://127.0.0.1:8545/",
    contractAddress: readContractAddress(Network.LOCALHOST),
  },
  goerli: {
    rpcUrl: process.env.GOERLI_RPC_URL as string,
    contractAddress: readContractAddress(Network.GOERLI),
  },
  moonbeam: {
    rpcUrl: process.env.MOONBEAM_RPC_URL as string,
    contractAddress: readContractAddress(Network.MOONBEAM),
  },
  uniquerc: {
    rpcUrl: process.env.UNIQUERC_RPC_URL as string,
    contractAddress: readContractAddress(Network.UNIQUERC),
    wssUrl: process.env.UNIQUERC_WSS_URL as string,
    seed: process.env.UNIQUERC_SEED as string,
  },
  metamaskPrivateKey: process.env.METAMASK_PRIVATE_KEY as string,
  network: process.env.HARDHAT_NETWORK as Network,
};
