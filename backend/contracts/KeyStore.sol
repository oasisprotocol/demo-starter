// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import {EIP155Signer} from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";

contract KeyStore {
    address private constant gasslessAddress;
    bytes32 private constant gasslessKey;

    constructor(address publicAddress, bytes32 privateKey) {
        gasslessAddress = publicAddress;
        gasslessKey = privateKey;
    }

    function get
}
