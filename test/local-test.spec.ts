import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";
import { TestContract, TestContract__factory } from "../typechain-types";

describe.skip("local test", () => {
  let owner: SignerWithAddress;
  let signers: SignerWithAddress[];
  let testContract: TestContract;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers.shift() as SignerWithAddress;

    const factory: TestContract__factory = await ethers.getContractFactory(
      "TestContract"
    );
    testContract = await factory.deploy(0);
    await testContract.deployed();
  });

  it("function errRevert", async () => {
    const err = await expect(
      testContract.functions.errRevert()
    ).to.rejectedWith();

    expect(err.data).to.eq(
      "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c6572726f72207265766572740000000000000000000000000000000000000000"
    );
    expect(err.reason).to.eq("error revert");
  });

  it.skip("function errRequire", async () => {
    const err = await expect(
      testContract.functions.errRequire(0)
    ).to.rejectedWith();

    expect(err.data).to.eq(
      "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c6572726f72207265766572740000000000000000000000000000000000000000"
    );
    expect(err.reason).to.eq("error revert");
  });

  it("function errRequireWithIf", async () => {
    const err = await expect(
      testContract.functions.errRequireWithIf(0)
    ).to.rejectedWith();

    expect(err.data).to.eq(
      "0x08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000156572726f72207265717569726520776974682069660000000000000000000000"
    );
    expect(err.reason).to.eq("error require with if");
  });

  it("function errCustomError", async () => {
    const callValue = 123;

    const err = await expect(
      testContract.functions.errCustomError(callValue)
    ).to.rejectedWith();

    const v1 = BigNumber.from(2);
    const v2 = "my data string";
    const myData: any = [v1, v2];
    myData.v1 = v1;
    myData.v2 = v2;

    const arr: any = [BigNumber.from(callValue), "error string", myData];
    arr.myNum = BigNumber.from(callValue);
    arr.myStr = "error string";
    arr.myData = myData;
    expect(err.data).to.eq(
      "0x68336fca000000000000000000000000000000000000000000000000000000000000007b000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000c6572726f7220737472696e67000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000e6d79206461746120737472696e67000000000000000000000000000000000000"
    );
    expect(err.errorArgs).to.deep.eq(arr);
  });

  it("function errZeroDiv", async () => {
    const err = await expect(
      testContract.functions.errZeroDiv(0)
    ).to.rejectedWith();

    expect(err.data).to.eq(
      "0x4e487b710000000000000000000000000000000000000000000000000000000000000012"
    );
    expect(err.errorArgs[0].toHexString()).to.eq("0x12");
  });

  it("function errEmptyArrayPop", async () => {
    const err = await expect(
      testContract.functions.errEmptyArrayPop()
    ).to.rejectedWith();

    expect(err.data).to.eq(
      "0x4e487b710000000000000000000000000000000000000000000000000000000000000031"
    );
  });

  it("function callZeroAddress", async () => {
    const err = await expect(
      testContract.functions.callZeroAddress()
    ).to.rejectedWith();

    expect(err.data).to.eq("0x");
  });

  it("function callInvalidAddress", async () => {
    const err = await expect(
      testContract.functions.callInvalidAddress(
        "0x6c7c7B12D818f279f43D93B77142BCc19D2d8CB5"
      )
    ).to.rejectedWith();

    expect(err.data).to.eq("0x");
  });
});
