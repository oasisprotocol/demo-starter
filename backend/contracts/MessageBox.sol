// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MessageBox {
    string private _message;
    address public author;

    modifier isAuthor() {
        require(msg.sender == author, "not allowed");
        _;
    }

    constructor() {
        author = msg.sender;
    }

    function setMessage(string calldata m) external {
        _message = m;
        author = msg.sender;
    }

    function message() external view isAuthor returns (string memory) {
        return _message;
    }

    function publicMessage() external view returns (string memory) {
        return _message;
    }
}