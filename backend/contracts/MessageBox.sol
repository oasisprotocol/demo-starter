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
        // TASK: Generate random seed and store it to captchaSeed.
    }

    function setMessage(string calldata in_message) external {
        message = in_message;
        author = msg.sender;
    }

    function computeCaptcha() public view returns (uint, uint) {
        // TASK: Derive two numbers from captchaSeed and messageCounter.
    }

    function checkCaptcha(address in_recipient, uint in_captcha) private view returns (bool) {
        // TASK: Compare, if provided captcha matches the expected one.
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
