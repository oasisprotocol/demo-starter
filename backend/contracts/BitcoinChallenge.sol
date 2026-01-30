// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SiweAuth} from "@oasisprotocol/sapphire-contracts/contracts/auth/SiweAuth.sol";
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

/**
 * @title BitcoinChallenge
 * @dev A smart contract that generates a Bitcoin private key and address using elliptic curve cryptography.
 *
 * This contract implements Bitcoin's secp256k1 elliptic curve operations and address generation.
 * It uses Sapphire's confidential computing features to securely generate and store a private key,
 * which can only be accessed by the contract owner through SIWE authentication.
 *
 * Based on https://strm.sh/posts/bitcoin-address-generation-in-pure-python/
 *
 * Key features:
 * - Generates a random 32-byte private key using Sapphire's secure randomness
 * - Implements secp256k1 elliptic curve point operations (addition, scalar multiplication)
 * - Converts public key to Bitcoin address format (P2PKH) with proper hashing and checksums
 * - Exports private key in Wallet Import Format (WIF) for owner access
 * - Uses Base58 encoding for Bitcoin address and WIF format compatibility
 * - Owner-only access control with SIWE authentication support
 */
contract BitcoinChallenge is SiweAuth {
    struct Point {
        uint256 x;
        uint256 y;
    }

    bytes constant B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    bytes32 private secretKey;
    address public owner;

    modifier isOwner(bytes memory authToken) {
        if (msg.sender != owner && authMsgSender(authToken) != owner) {
            revert("not allowed");
        }
        _;
    }

    constructor(string memory domain) SiweAuth(domain) {
        owner = msg.sender;
        secretKey = bytes32(Sapphire.randomBytes(32, ""));
    }

    function getSecretKey(bytes memory authToken) external view isOwner(authToken) returns (string memory) {
        return getWif(secretKey);
    }

    function getBitcoinAddress() external view returns (string memory) {
        bytes memory pkBytes;
        (pkBytes, ) = Sapphire.generateSigningKeyPair(
            Sapphire.SigningAlg.Secp256k1PrehashedSha256,
            abi.encodePacked(secretKey)
        );
        bytes32 hash = sha256(pkBytes);
        bytes20 hash160 = ripemd160(abi.encodePacked(hash));

        bytes memory addr = new bytes(21);
        addr[0] = 0x00;
        for (uint i = 0; i < 20; i++) {
            addr[i + 1] = bytes1(hash160[i]);
        }

        bytes32 checksum = sha256(abi.encodePacked(sha256(addr)));

        bytes memory fullAddress = new bytes(25);
        for (uint i = 0; i < 21; i++) {
            fullAddress[i] = addr[i];
        }
        for (uint i = 0; i < 4; i++) {
            fullAddress[i + 21] = checksum[i];
        }

        return b58Encode(fullAddress);
    }

    // https://github.com/storyicon/base58-solidity/blob/master/contracts/Base58.sol
    function b58Encode(bytes memory data) public pure returns (string memory) {
        uint256 size = data.length;
        uint256 zeroCount;
        while (zeroCount < size && data[zeroCount] == 0) {
            zeroCount++;
        }
        size = zeroCount + ((size - zeroCount) * 8351) / 6115 + 1;
        bytes memory slot = new bytes(size);
        uint32 carry;
        int256 m;
        int256 high = int256(size) - 1;
        for (uint256 i = 0; i < data.length; i++) {
            m = int256(size - 1);
            for (carry = uint8(data[i]); m > high || carry != 0; m--) {
                carry = carry + 256 * uint8(slot[uint256(m)]);
                slot[uint256(m)] = bytes1(uint8(carry % 58));
                carry /= 58;
            }
            high = m;
        }
        uint256 n;
        for (n = zeroCount; n < size && slot[n] == 0; n++) {}
        size = slot.length - (n - zeroCount);
        bytes memory out = new bytes(size);
        for (uint256 i = 0; i < size; i++) {
            uint256 j = i + n - zeroCount;
            out[i] = B58_ALPHABET[uint8(slot[j])];
        }
        return string(out);
    }

    function getWif(bytes32 privkey) public pure returns (string memory) {
        bytes memory wif = new bytes(34);
        wif[0] = 0x80;
        for (uint i = 0; i < 32; i++) {
            wif[i + 1] = privkey[i];
        }

        wif[33] = 0x01;
        bytes32 checksum = sha256(abi.encodePacked(sha256(wif)));
        bytes memory fullWif = new bytes(38);
        for (uint i = 0; i < 33; i++) {
            fullWif[i] = wif[i];
        }
        fullWif[33] = 0x01;
        for (uint i = 0; i < 4; i++) {
            fullWif[i + 34] = checksum[i];
        }

        return b58Encode(fullWif);
    }
}