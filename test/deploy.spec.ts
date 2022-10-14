import { config } from "../scripts/config";
import { expect } from "chai";
import { ethers } from "ethers";
import { deployByWeb3, getContractInfo, getSigner } from "./utils";

const { abi, bytecode } = getContractInfo();

describe("Deploy", function () {
  describe("By web3", () => {
    async function compareDeployError(errCode: number) {
      let uniqueData;
      try {
        await deployByWeb3(config.uniquerc, errCode);
      } catch (err: any) {
        uniqueData = err.data;
      }

      let goerliData;
      try {
        await deployByWeb3(config.goerli, errCode);
      } catch (err: any) {
        goerliData = err.data;
      }

      expect(uniqueData, "data is undefined").to.not.be.undefined;
      expect(uniqueData, "data is null").to.not.be.null;
      expect(uniqueData).to.eq(goerliData);
    }

    it("compare 1", async () => {
      await compareDeployError(1);
    });
    it("compare 2", async () => {
      await compareDeployError(2);
    });
    it("compare 3", async () => {
      await compareDeployError(3);
    });
    it("compare 4", async () => {
      await compareDeployError(4);
    });
    it("compare 5", async () => {
      await compareDeployError(5);
    });
    it("compare 6", async () => {
      await compareDeployError(6);
    });

    it("web3-goerli", async () => {
      const errCode = 1;

      try {
        deployByWeb3(config.goerli, errCode);
      } catch (err: any) {
        let data: string;
        switch (errCode) {
          case 1:
            data =
              "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c6572726f72207265766572740000000000000000000000000000000000000000";
            break;
          default:
            throw new Error("invalid error code");
        }
        expect(err.data).to.eq(data);
      }
    });
  });

  describe.skip("By ethers", () => {
    it("fail", async () => {
      const signer = getSigner(config.goerli);
      const TestContract = await new ethers.ContractFactory(
        abi,
        bytecode,
        signer
      );
      try {
        const test = await TestContract.deploy(3, { gasLimit: 1_000_000 });
        await test.deployed();
      } catch (err: any) {
        //console.log(err);
      }
    });
  });
});
