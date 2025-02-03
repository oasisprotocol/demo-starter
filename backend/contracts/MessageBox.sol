// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SiweAuth} from "@oasisprotocol/sapphire-contracts/contracts/auth/SiweAuth.sol";

contract MessageBox is SiweAuth {
    string private _message;
    address public author;

    modifier isAuthor(bytes memory authToken) {
        // Use msg.sender for transactions and signed calls, fallback to
        // checking bearer.
        if (msg.sender != author && authMsgSender(authToken) != author) {
            revert("not allowed");
        }
        _;
    }

    constructor(string memory domain) SiweAuth(domain) {}

    function setMessage(string calldata m) external {
        _message = m;
        author = msg.sender;
    }

    function message(
        bytes memory authToken
    ) external view isAuthor(authToken) returns (string memory) {
        return _message;
    }
}
