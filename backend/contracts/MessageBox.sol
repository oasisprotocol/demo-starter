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

    modifier _authorOnly(Sig calldata auth) {
        address addr = ecrecover(keccak256(""), auth.v, auth.r, auth.s);
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
