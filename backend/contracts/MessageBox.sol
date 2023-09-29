// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract MessageBox {
    string public message;
    address public author;

    mapping(address => string) privateMessage;
    mapping(address => address) privateAuthor;
    uint messageCounter;

    bytes captchaSeed;

    constructor() {
        captchaSeed = Sapphire.randomBytes(32, "");
    }

    function setMessage(string calldata in_message) external {
        message = in_message;
        author = msg.sender;
    }

    function computeCaptcha() public view returns (uint, uint) {
        bytes memory a = abi.encode(captchaSeed, messageCounter, "0");
        bytes memory b = abi.encode(captchaSeed, messageCounter, "1");

        return (uint(keccak256(a)) % 100, uint(keccak256(b)) % 100);
    }

    function checkCaptcha(address in_recipient, uint in_captcha) private view returns (bool) {
        (uint a, uint b) = computeCaptcha();
        return ((a+b) == in_captcha);
    }

    function setPrivateMessage(address in_recipient, string calldata in_message, uint captcha) external {
        require(checkCaptcha(in_recipient, captcha), "CAPTCHA check failed");

        privateMessage[in_recipient] = in_message;
        privateAuthor[in_recipient] = msg.sender;
        messageCounter++;
    }

    function readPrivateMessage() external view returns (string memory, address) {
        return (privateMessage[msg.sender], privateAuthor[msg.sender]);
    }
}
