import { config, NetInfo } from "../scripts/config";
import Web3 from "web3";
import { Account } from "web3-core";
import { expect } from "chai";
import "@unique-nft/substrate-client/evm";
import {
  signTypedData,
  SignTypedDataVersion,
  TypedMessage,
} from "@metamask/eth-sig-util";
import { getContractInfo } from "./utils";

const { abi } = getContractInfo();

describe.only("EIP712 Goerli/Unique", function () {
  this.timeout(120_000);

  async function runVerify(netInfo: NetInfo) {
    const { rpcUrl, contractAddress } = netInfo;

    const web3 = new Web3(rpcUrl);

    const eip712web3 = new web3.eth.Contract(abi, contractAddress);

    const account = web3.eth.accounts.privateKeyToAccount(
      config.metamaskPrivateKey
    );

    const chainId = await (await eip712web3.methods.getChainId()).call();

    const mail = {
      to: account.address,
      contents: "mail message",
    };

    const data: TypedMessage<any> = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Mail: [
          { name: "to", type: "address" },
          { name: "contents", type: "string" },
        ],
      },
      domain: {
        name: "test",
        version: "1.0",
        chainId,
        verifyingContract: contractAddress,
      },
      primaryType: "Mail",
      message: mail,
    };
    const signature = signTypedData({
      privateKey: Buffer.from(config.metamaskPrivateKey, "hex"),
      data,
      version: SignTypedDataVersion.V4,
    });

    const signer = account.address;

    const bytes = Buffer.from(signature.substring(2), "hex");
    const recoveredSigner = await (
      await eip712web3.methods.verify(bytes, signer, mail.to, mail.contents)
    ).call();

    expect(recoveredSigner.toLowerCase()).to.eq(signer.toLowerCase());
  }

  it("goerli", async function () {
    await runVerify(config.goerli);
  });

  it("uniquerc", async function () {
    await runVerify(config.uniquerc);
  });
});
