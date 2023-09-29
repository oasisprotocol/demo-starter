// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MessageBox {
    string public message;
    address public author;

    mapping(address => string) privateMessage;
    mapping(address => address) privateAuthor;

    function setMessage(string calldata in_message) external {
        message = in_message;
        author = msg.sender;
    }

    function setPrivateMessage(address in_recipient, string calldata in_message) external {
        // TASK: Implement setting the private message and author.
    }

    function readPrivateMessage() external view returns (string memory, address) {
        // TASK: Return the private message of the caller and its author.
    }
}
