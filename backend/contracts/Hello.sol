// contracts/Hello.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Hello {
    string public message;

    constructor(string memory _msg) {
        message = _msg;
    }

    function setMessage(string memory _msg) external {
        message = _msg;
    }
}