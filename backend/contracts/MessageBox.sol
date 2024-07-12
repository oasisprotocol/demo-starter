// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/auth/SiweAuth.sol";

contract MessageBox is SiweAuth {
    string private _message;
    address public author;

    modifier authorOnly(bytes calldata bearer) {
        if (authMsgSender(bearer) != author) {
            revert("not allowed");
        }
        _;
    }

    constructor(string memory domain) SiweAuth(domain) {
    }

    function setMessage(string calldata in_message) external {
        _message = in_message;
        author = msg.sender;
    }

    function message(bytes calldata bearer) external view authorOnly(bearer) returns (string memory) {
      return _message;
    }
}
