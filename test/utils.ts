import { config, NetInfo } from "../scripts/config";
import { ethers } from "ethers";
import Web3 from "web3";

export function getSigner(info: NetInfo) {
  const provider = ethers.getDefaultProvider(info.rpcUrl);
  return new ethers.Wallet(config.metamaskPrivateKey, provider);
}

const {
  abi,
  bytecode,
} = require("../artifacts/contracts/TestContract.sol/TestContract.json");

export function getContractInfo() {
  return { abi, bytecode };
}

export async function deployByWeb3(netInfo: NetInfo, errCode: number) {
  const web3 = new Web3(netInfo.rpcUrl);

  const incrementer = new web3.eth.Contract(abi, netInfo.contractAddress);

  const incrementerTx = incrementer.deploy({
    data: bytecode,
    arguments: [errCode],
  });

  const tx = await web3.eth.accounts.signTransaction(
    {
      data: incrementerTx.encodeABI(),
      gas: await incrementerTx.estimateGas(),
    },
    config.metamaskPrivateKey
  );
  return web3.eth.sendSignedTransaction(tx.rawTransaction as string);
}
