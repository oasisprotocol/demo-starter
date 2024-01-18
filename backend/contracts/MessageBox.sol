// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

contract MessageBox {
    string public message;
    address public author;

    function setMessage(string calldata in_message) external {
        message = in_message;
        author = msg.sender;
    }

    function retrieveMessage() external view returns (string memory) {
        string memory senderStr = Strings.toHexString(uint160(msg.sender), 20);
        string memory authorStr = Strings.toHexString(uint160(author), 20);
        return string(abi.encodePacked(senderStr, ' -> ' , authorStr));
    }
}
