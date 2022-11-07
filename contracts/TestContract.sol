// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

import "./other.sol";

contract TestContract is EIP712 {
    struct MyData {
        uint v1;
        string v2;
    }

    uint public totalValue = 0;
    string public stringValue = "my test string";
    bool public boolValue = true;
    uint[] public list = [1, 2, 3];
    MyData public myDataValue = MyData(3, "my data");
    MyData[1] public myDataList;

    error TestError(uint256 myNum, string myStr, MyData myData);

    constructor(uint withError) EIP712("test", "1.0") {
        myDataList[0].v1 = 2;
        myDataList[0].v2 = "v2 in data list";

        if (withError == 1) {
            errRevert();
        } else if (withError == 2) {
            errRequire(0);
        } else if (withError == 3) {
            errRequireWithIf(0);
        } else if (withError == 4) {
            errCustomError(111);
        } else if (withError == 5) {
            errEmptyArrayPop();
        } else if (withError == 6) {
            errZeroDiv(0);
        }
    }

    event ChangeValue(uint delta);
    event AddValue(uint delta, MyData myData);

    function getTestValue(bool test) external pure returns(string memory value) {
        value = test ? "abc" : "xyz";
    }

    function errRevert() public pure {
        revert("error revert");
    }

    function errRequire(uint value) public pure {
        require(value != 0);
    }

    function errRequireWithIf(uint value) public pure {
        require(value !=0, "error require with if");
    }

    function errCustomError(uint256 v) public pure {
        MyData memory myData = MyData(2, "my data string");

        revert TestError({
        myNum: v,
        myStr: "error string",
        myData: myData
        });
    }

    uint[] arr;
    function errEmptyArrayPop() public {
        arr.pop();
    }

    function callZeroAddress() public {
        OtherContract otherContract;
        otherContract.testOther();
    }

    function callInvalidOther(OtherContract otherContract) public {
        otherContract.testOther();
    }

    function callInvalidAddress(address otherAddress) public {
        OtherContract otherContract = OtherContract(otherAddress);
        otherContract.testOther();
    }

    function errZeroDiv(int v) public pure returns(int) {
        return 1/v;
    }


    function addValue(uint value) public returns(bool) {
        require(value != 0, "No zero value");

        totalValue += value;

        emit ChangeValue(value);

        emit AddValue(value, MyData(999, "add value event"));

        return true;
    }


    function getChainId() external view returns (uint256) {
        return block.chainid;
    }

    function verify(
        bytes memory signature,
        address signer,
        address mailTo,
        string memory mailContents
    ) external view returns(address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(keccak256("Mail(address to,string contents)"), mailTo, keccak256(bytes(mailContents))))
        );
        address recoveredSigner = ECDSA.recover(digest, signature);
        return recoveredSigner;
    }
}

