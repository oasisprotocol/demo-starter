// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecretBox {
    address public immutable owner;

    uint256 public immutable DEPOSIT_AMOUNT;
    string private secret;
    address private payer;

    constructor(uint256 amount) {
        owner = msg.sender;
        DEPOSIT_AMOUNT = amount;
    }

    function setSecret(string calldata s) external {
        require(msg.sender == owner, "not owner");
        secret = s;
    }

    function getSecret() external view returns (string memory) {
        require(msg.sender == payer, "not payer");
        return secret;
    }

    receive() external payable {
        require(msg.value >= DEPOSIT_AMOUNT, "amount too low");
        payer = msg.sender;
    }
}
