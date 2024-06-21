// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";

struct Sig {
    uint8 v;
    bytes32 r;
    bytes32 s;
}

contract MessageBox {
    string private _message;
    address public author;

    function toAsciiStringAddr(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }


    function getSiweMsg() external view returns (bytes memory) {
        string memory domain="demo-starter";
        string memory uri="http://localhost:5173";
        string memory version="1";
        string memory chainId="0x5afd";
        string memory nonce="1";
        string memory issuedAt="2021-09-30T16:25:24Z";

        // TODO: contract address needs to be hex case-sensitive checksummed.
        bytes memory siweMsg = abi.encodePacked(domain, " wants you to sign in with your Ethereum account:\n0x", toAsciiStringAddr(address(this)), "\n\n\n\nURI: ", uri, "\nVersion: ",version,"\nChain ID: ", chainId, "\nNonce: ", nonce, "\nIssued At: ", issuedAt);
        return siweMsg;
    }

    modifier _authorOnly(Sig calldata auth) {
        bytes memory eip191msg = abi.encodePacked("\x19Ethereum Signed Message:\n", "203", this.getSiweMsg());
        address addr = ecrecover(keccak256(eip191msg), auth.v, auth.r, auth.s);
        if (addr != author) {
            revert("not allowed");
        }
        _;
    }

    function setMessage(string calldata in_message) external {
        _message = in_message;
        author = msg.sender;
    }

    function message(Sig calldata auth) external view _authorOnly(auth) returns (string memory) {
      return _message;
    }
}
