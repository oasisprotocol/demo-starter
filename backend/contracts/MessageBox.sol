// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/auth/SiweAuth.sol";

contract MessageBox is SiweAuth {
    string private _message;
    address public author;


    modifier isAuthor(bytes calldata bearer) {
        // Use msg.sender for transactions and signed calls, fallback to
        // checking bearer.
        if (msg.sender != author && authMsgSender(bearer) != author) {
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

    function message(bytes calldata bearer) external view isAuthor(bearer) returns (string memory) {
        return _message;
    }
}
