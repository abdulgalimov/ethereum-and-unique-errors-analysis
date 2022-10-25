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
import fetch from "node-fetch";
import { Coder } from "abi-coder";

const { abi } = getContractInfo();

function createContract(info: NetInfo): Contract {
  const signer = getSigner(info);

  return new ethers.Contract(info.contractAddress, abi, signer);
}

describe("Compare Goerli/Unique", function () {
  this.timeout(120_000);

  let uniqueEthers: Contract;
  let goerliEthers: Contract;
  let account: KeyringAccount;
  let uniqueSdk: Sdk;
  let evmCallArgs: EvmCallArguments;

  beforeEach(async () => {
    uniqueEthers = createContract(config.uniquerc);
    goerliEthers = createContract(config.goerli);

    if (config.uniquerc.seed && config.uniquerc.wssUrl && !uniqueSdk) {
      const provider = new KeyringProvider({
        type: "sr25519",
      });
      await provider.init();
      account = provider.addSeed(config.uniquerc.seed) as KeyringAccount;
      uniqueSdk = new Sdk({
        chainWsUrl: config.uniquerc.wssUrl,
        signer: account,
      });
      await uniqueSdk.connect();

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
      return uniqueSdk.evm.call({
        ...evmCallArgs,
        funcName,
        args,
      });
    }

    async function compareProperties(funcName: string, args: any[] = []) {
      const uniqueValue = await uniqueEthers[funcName](...args);
      const goerliValue = await goerliEthers[funcName](...args);
      const sdkValue = await readFromSdk(funcName, args);

      expect(uniqueValue).to.deep.eq(goerliValue);
      expect(uniqueValue).to.deep.eq(sdkValue);
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
      const uniqueResult = await (
        await uniqueEthers.functions.addValue(123)
      ).wait();

      const goerliResult = await (
        await goerliEthers.functions.addValue(123)
      ).wait();

      const { submittableResult } = await uniqueSdk.evm.send.submitWaitResult({
        address: account.getAddress(),
        contractAddress: config.uniquerc.contractAddress,
        abi,
        funcName: "addValue",
        args: [123],
      });
      const evmLogsData: any[] = submittableResult
        .filterRecords("evm", "Log")
        .map((event) => (event.event.data.length ? event.event.data[0] : null));

      expect(uniqueResult.logs[0].data).to.eq(goerliResult.logs[0].data);
      expect(uniqueResult.logs[1].data).to.eq(goerliResult.logs[1].data);

      expect(uniqueResult.logs[0].data).to.eq(evmLogsData[0].data.toString());
      expect(uniqueResult.logs[1].data).to.eq(evmLogsData[1].data.toString());
    });
  });

  describe("Errors", () => {
    async function callRpc(netInfo: NetInfo, funcName: string, argsMap: any) {
      const signer = getSigner(netInfo);
      const coder = new Coder(abi);

      const body = {
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            from: await signer.getAddress(),
            to: goerliEthers.address,
            data: coder.encodeFunction(funcName, argsMap),
          },
        ],
        id: 1,
      };

      const options = {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(body),
      };

      return fetch(netInfo.rpcUrl, options).then((res) => res.json());
    }

    async function _compareByRpc(funcName: string, args: any[]) {
      const abiItem = abi.find((item: any) => item.name === funcName);
      const argsMap = args.reduce((map, value, index) => {
        map[abiItem.inputs[index].name] = value;
        return map;
      }, {});
      const goerliResult = await callRpc(config.goerli, funcName, argsMap);
      const uniqueResult = await callRpc(config.uniquerc, funcName, argsMap);

      expect(
        goerliResult.error,
        "[by fetch rpc] 'error' object not equal"
      ).to.deep.eq(uniqueResult.error);
    }

    async function _compareByEthers(funcName: string, args: any[]) {
      const options = {
        gasLimit: 1_000_000,
      };
      let uniqueData;
      try {
        await uniqueEthers.callStatic[funcName](...args, options);
      } catch (err: any) {
        uniqueData = err.error?.error?.data;
      }

      let goerliData;
      try {
        await goerliEthers.callStatic[funcName](...args, options);
      } catch (err: any) {
        goerliData = err.data;
      }

      let sdkData;
      if (uniqueSdk) {
        try {
          await uniqueSdk.evm.call({
            ...evmCallArgs,
            funcName,
            args,
          });
        } catch (err: any) {
          const evmError = err as EvmCallError;
          sdkData = evmError.details.data;
        }
      }

      expect(uniqueData, "[by ethers] data is undefined").to.not.be.undefined;
      expect(uniqueData, "[by ethers], data is null").to.not.be.null;
      expect(uniqueData, "[by ethers] unique not equal goerli").to.eq(
        goerliData
      );
      if (uniqueSdk)
        expect(uniqueData, "[by ethers] unique not equal sdk").to.eq(sdkData);
    }

    async function compareCallErrors(funcName: string, args: any[]) {
      await _compareByEthers(funcName, args);
      await _compareByRpc(funcName, args);
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
