// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Sig {
    uint8 v;
    bytes32 r;
    bytes32 s;
}

contract MessageBox {
    string private _message;
    address public author;

    function getSiweMsg() external view returns (bytes memory) {
        string memory domain="demo-starter";
        string memory uri="http://localhost:5173";
        string memory version="1";
        string memory chainId="0x5afd";
        string memory nonce="1";
        string memory issuedAt="2021-09-30T16:25:24Z";

        bytes memory siweMsg = abi.encodePacked(domain, " wants you to sign in with your Ethereum account:\n", address(this), "\n\n\n\nURI: ", uri, "\nVersion: ",version,"\nChain ID: ", chainId, "\nNonce: ", nonce, "\nIssued At: ", issuedAt);
        return siweMsg;
    }

    modifier _authorOnly(Sig calldata auth) {
        address addr = ecrecover(keccak256(this.getSiweMsg()), auth.v, auth.r, auth.s);
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
