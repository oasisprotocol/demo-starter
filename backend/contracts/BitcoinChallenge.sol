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

    uint256 constant P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    uint256 constant GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint256 constant GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;

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

//        Point memory G = Point(GX, GY);
//        uint256 sk = uint256(secretKey);
//        Point memory pubPoint = pointMul(sk, G);
//
//        bytes memory pkBytes = pointToBytes(pubPoint);

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

    function pointAdd(Point memory p1, Point memory p2) public pure returns (Point memory) {
        if (p1.x == 0 && p1.y == 0) return p2;
        if (p2.x == 0 && p2.y == 0) return p1;

        uint256 l;
        if (p1.x == p2.x && p1.y == p2.y) {
            l = mulmod(mulmod(3, mulmod(p1.x, p1.x, P), P), modInverse(mulmod(2, p1.y, P), P), P);
        } else {
            l = mulmod(submod(p2.y, p1.y, P), modInverse(submod(p2.x, p1.x, P), P), P);
        }

        uint256 newX = submod(submod(mulmod(l, l, P), p1.x, P), p2.x, P);
        uint256 newY = submod(mulmod(l, submod(p1.x, newX, P), P), p1.y, P);

        return Point(newX, newY);
    }

    function pointMul(uint256 scalar, Point memory point) public pure returns (Point memory) {
        Point memory result = Point(0, 0);
        Point memory addend = point;

        for (uint i = 0; i < 256; i++) {
            if ((scalar >> i) & 1 == 1) {
                result = pointAdd(result, addend);
            }
            addend = pointAdd(addend, addend);
        }

        return result;
    }

    function modInverse(uint256 a, uint256 m) public pure returns (uint256) {
        return modExp(a, m - 2, m);
    }

    function modExp(uint256 base, uint256 exp, uint256 mod) public pure returns (uint256) {
        uint256 result = 1;
        base = base % mod;
        while (exp > 0) {
            if (exp % 2 == 1) {
                result = mulmod(result, base, mod);
            }
            exp = exp / 2;
            base = mulmod(base, base, mod);
        }
        return result;
    }

    function submod(uint256 a, uint256 b, uint256 mod) public pure returns (uint256) {
        return addmod(a, mod - b, mod);
    }

    function pointToBytes(Point memory point) public pure returns (bytes memory) {
        bytes memory result = new bytes(65);
        result[0] = 0x04;

        for (uint i = 0; i < 32; i++) {
            result[i + 1] = bytes1(uint8(point.x >> (8 * (31 - i))));
            result[i + 33] = bytes1(uint8(point.y >> (8 * (31 - i))));
        }

        return result;
    }

    function getWif(bytes32 privkey) public pure returns (string memory) {
        bytes memory wif = new bytes(33);
        wif[0] = 0x80;
        for (uint i = 0; i < 32; i++) {
            wif[i + 1] = privkey[i];
        }

        bytes32 checksum = sha256(abi.encodePacked(sha256(wif)));
        bytes memory fullWif = new bytes(37);
        for (uint i = 0; i < 33; i++) {
            fullWif[i] = wif[i];
        }
        for (uint i = 0; i < 4; i++) {
            fullWif[i + 33] = checksum[i];
        }

        return b58Encode(fullWif);
    }
}