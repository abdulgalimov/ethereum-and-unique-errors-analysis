import { config, NetInfo } from "../scripts/config";
import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { expect } from "chai";
import { getContractInfo, getSigner } from "./utils";
import { Sdk } from "@unique-nft/substrate-client";
import { EvmCallError } from "@unique-nft/substrate-client/errors";
import "@unique-nft/substrate-client/evm";
import { KeyringProvider, KeyringAccount } from "@unique-nft/accounts/keyring";
import { EvmCallArguments } from "@unique-nft/substrate-client/evm";

const { abi } = getContractInfo();

function createContract(info: NetInfo): Contract {
  const signer = getSigner(info);

  return new ethers.Contract(info.contractAddress, abi, signer);
}

describe("Compare Goerli/Unique", function () {
  this.timeout(60000);

  let unique: Contract;
  let goerli: Contract;
  let account: KeyringAccount;
  let sdk: Sdk;
  let evmCallArgs: EvmCallArguments;

  beforeEach(async () => {
    unique = createContract(config.uniquerc);
    goerli = createContract(config.goerli);

    if (config.uniquerc.seed && config.uniquerc.wssUrl && !sdk) {
      const provider = new KeyringProvider({
        type: "sr25519",
      });
      await provider.init();
      account = provider.addSeed(config.uniquerc.seed) as KeyringAccount;
      sdk = new Sdk({ chainWsUrl: config.uniquerc.wssUrl, signer: account });
      await sdk.connect();

      evmCallArgs = {
        address: account.getAddress(),
        contractAddress: config.uniquerc.contractAddress,
        abi,
        funcName: "",
        args: [],
      };
    }
  });

  describe("Properties", () => {
    function readFromSdk(funcName: string, args: any[] = []) {
      return sdk.evm.call({
        ...evmCallArgs,
        funcName,
        args,
      });
    }

    async function compareProperties(funcName: string, args: any[] = []) {
      const uniqueValue = await unique.functions[funcName](...args);
      const goerliValue = await goerli.functions[funcName](...args);
      const sdkValue = await readFromSdk(funcName, args);

      expect(uniqueValue).to.deep.eq(goerliValue);
      expect(uniqueValue[0]).to.deep.eq(sdkValue);
    }

    it("string value", async () => {
      await compareProperties("stringValue");
    });

    it("bool value", async () => {
      await compareProperties("boolValue");
    });

    it("struct value", async () => {
      await compareProperties("myDataValue");
    });

    it("list value", async () => {
      await compareProperties("myDataList", [0]);
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

      let sdkData;
      if (sdk) {
        try {
          await sdk.evm.call({
            ...evmCallArgs,
            funcName,
            args,
          });
        } catch (err: any) {
          const evmError = err as EvmCallError;
          sdkData = evmError.details.data;
        }
      }

      expect(uniqueData, "data is undefined").to.not.be.undefined;
      expect(uniqueData, "data is null").to.not.be.null;
      expect(uniqueData).to.eq(goerliData);
      if (sdk) expect(uniqueData).to.eq(sdkData);
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
