// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MessageBox {
    string public message;
    address public author;

    function setMessage(string calldata in_message) external {
        message = in_message;
        author = msg.sender;
    }
}
