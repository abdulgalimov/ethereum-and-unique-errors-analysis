import { ethers } from "hardhat";
import { config } from "./config";
import * as fs from "fs";

const outFilename = `./dist/${config.network}.json`;

async function main() {
  const TestContract = await ethers.getContractFactory("TestContract");
  const testContract = await TestContract.deploy(0);

  await testContract.deployed();

  console.log(`TestContract deployed to ${testContract.address}`);
  const saveData = {
    contractAddress: testContract.address,
  };
  const saveStr = JSON.stringify(saveData, null, 2);
  fs.writeFileSync(outFilename, saveStr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
