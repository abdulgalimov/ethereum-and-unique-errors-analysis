import { config, NetInfo } from "../scripts/config";
import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { expect } from "chai";
import { getContractInfo, getSigner } from "./utils";

const { abi } = getContractInfo();

function createContract(info: NetInfo): Contract {
  const signer = getSigner(info);

  return new ethers.Contract(info.contractAddress, abi, signer);
}

describe("Compare Goerli/Unique", function () {
  this.timeout(60000);

  let unique: Contract;
  let goerli: Contract;

  beforeEach(async () => {
    unique = createContract(config.uniquerc);
    goerli = createContract(config.goerli);
  });

  describe("Properties", () => {
    it("string value", async () => {
      const uniqueValue = await unique.functions.stringValue();
      const goerliValue = await goerli.functions.stringValue();
      expect(uniqueValue).to.deep.eq(goerliValue);
    });

    it("bool value", async () => {
      const uniqueValue = await unique.functions.boolValue();
      const goerliValue = await goerli.functions.boolValue();
      expect(uniqueValue).to.deep.eq(goerliValue);
    });

    it("struct value", async () => {
      const uniqueValue = await unique.functions.myDataValue();
      const goerliValue = await goerli.functions.myDataValue();
      expect(uniqueValue).to.deep.eq(goerliValue);
    });

    it("list value", async () => {
      const uniqueValue = await unique.functions.myDataList(0);
      const goerliValue = await goerli.functions.myDataList(0);
      expect(uniqueValue).to.deep.eq(goerliValue);
    });
  });

  describe("Events", () => {
    it("read events", async () => {
      const uniqueResult = await (await unique.functions.addValue(123)).wait();
      const goerliResult = await (await goerli.functions.addValue(123)).wait();

      expect(uniqueResult.logs[0].data).to.eq(goerliResult.logs[0].data);
      expect(uniqueResult.logs[1].data).to.eq(goerliResult.logs[1].data);
    });
  });

  describe("Errors", () => {
    async function compareCallErrors(funcName: string, args: any[]) {
      const options = {
        gasLimit: 1_000_000,
      };
      let uniqueData;
      try {
        await unique.functions[funcName](...args, options);
      } catch (err: any) {
        uniqueData = err.error?.error?.data;
      }

      let goerliData;
      try {
        await goerli.functions[funcName](...args, options);
      } catch (err: any) {
        goerliData = err.data;
      }

      expect(uniqueData, "data is undefined").to.not.be.undefined;
      expect(uniqueData, "data is null").to.not.be.null;
      expect(uniqueData).to.eq(goerliData);
    }

    it("function errRevert", async () => {
      await compareCallErrors("errRevert", []);
    });

    it("function errRequire", async () => {
      await compareCallErrors("errRequire", [0]);
    });

    it("function errRequireWithIf", async () => {
      await compareCallErrors("errRequireWithIf", [0]);
    });

    it("function errCustomError", async () => {
      await compareCallErrors("errCustomError", [123]);
    });

    it("function errZeroDiv", async () => {
      await compareCallErrors("errZeroDiv", [0]);
    });

    it("function errEmptyArrayPop", async () => {
      await compareCallErrors("errEmptyArrayPop", []);
    });

    it("function callZeroAddress", async () => {
      await compareCallErrors("callZeroAddress", []);
    });

    it("function callInvalidAddress", async () => {
      await compareCallErrors("callInvalidAddress", [
        "0x6c7c7B12D818f279f43D93B77142BCc19D2d8CB5",
      ]);
    });
  });
});
