// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./DateTime.sol";

struct Sig {
    uint8 v;
    bytes32 r;
    bytes32 s;
}

struct Bearer {
    string domain;
    address userAddr;
    uint256 validUntil; // in Unix timestamp.
}

contract SiweAuth {
    string _domain;
    bytes32 _bearerEncKey;
    address _authMsgSender;
    DateTime _dateTime;

    uint constant DEFAULT_VALIDITY=24*3600; // in seconds.

    struct ParsedSiweMessage {
        bytes schemeDomain;
        address addr;
        bytes statement;
        bytes uri;
        bytes version;
        uint chainId;
        bytes nonce;
        bytes issuedAt;
        bytes expirationTime;
        bytes notBefore;
        bytes requestId;
        bytes[] resources;
    }

    // Converts string containing hex address without 0x prefix to solidity address object.
    function _hexStringToAddress(bytes memory s) private pure returns (address) {
        require(s.length == 40, "Invalid address length");
        bytes memory r = new bytes(s.length/2);
        for (uint i=0; i<s.length/2; ++i) {
            r[i] = bytes1(_fromHexChar(uint8(s[2*i])) * 16 + _fromHexChar(uint8(s[2*i+1])));
        }
        return address(bytes20(r));
    }

    function _fromHexChar(uint8 c) private pure returns (uint8) {
        if (bytes1(c) >= bytes1('0') && bytes1(c) <= bytes1('9')) {
            return c - uint8(bytes1('0'));
        }
        if (bytes1(c) >= bytes1('a') && bytes1(c) <= bytes1('f')) {
            return 10 + c - uint8(bytes1('a'));
        }
        if (bytes1(c) >= bytes1('A') && bytes1(c) <= bytes1('F')) {
            return 10 + c - uint8(bytes1('A'));
        }
        return 0;
    }

    constructor(string memory in_domain) {
        _bearerEncKey = bytes32(Sapphire.randomBytes(32, ""));
        _domain = in_domain;
        _dateTime = new DateTime();
    }

    // Substring.
    function _substr(bytes memory str, uint startIndex, uint endIndex) private pure returns (bytes memory) {
        bytes memory result = new bytes(endIndex-startIndex);
        for(uint i = startIndex; i < endIndex && i<str.length; i++) {
            result[i-startIndex] = str[i];
        }
        return result;
    }

    // String to Uint using decimal format. No error handling.
    function _parseUint(bytes memory b) public pure returns (uint) {
        uint result = 0;
        for (uint i = 0; i < b.length; i++) {
            result = result * 10 + (uint(uint8(b[i])) - 0x30);
        }
        return (result);
    }


    // Parses "NAME: VALUE" in str starting at index i and ending at \n.
    // Returns the VALUE and new i, if NAME matched; otherwise empty value and old i.
    function _parseField(bytes calldata str, string memory name, uint i) private pure returns (bytes memory value, uint) {
        uint j=i;
        for (; j<str.length; j++) {
            if (str[j]==':') {
                // Delimiter found, check the name.
                if (keccak256(_substr(str, i, j))!=keccak256(bytes(name))) {
                    return ("", i);
                }
                i=j+2;
                j++;
            }
            if (str[j]==0x0a) {
                return (_substr(str, i, j), j);
            }
        }

        return ("", i);
    }

    // Parses bullets, one per line in str starting at i.
    // Returns the array of parsed values and a new i.
    function _parseArray(bytes calldata str, uint i) private pure returns (bytes[] memory values, uint count) {
        // First count the number of resources.
        bool newLine=true;
        uint j=0;
        for (; j<str.length-1; j++) {
            if (newLine==true) {
                // New line must commence with "- ".
                if (str[j]=='-' && str[j+1]==' ') {
                    j+=2;
                    count++;
                    newLine=false;
                } else {
                    break;
                }
            }
            if (str[j]==0x0a) {
                newLine=true;
            }
        }

        // Then build an array.
        values = new bytes[](count);
        uint c=0;
        j=i;
        for (; j<str.length-1 && c!=count; j++) {
            if (str[j]=='-' && str[j+1]==' ') {
                i=j+2;
            }
            if (str[j]==0x0a) {
                values[c] = _substr(str, i, j);
                c++;
            }
        }

        return (values, j);
    }

    // Parses SIWE message.
    function _parseSiweMsg(bytes calldata siweMsg) private pure returns (ParsedSiweMessage memory) {
        ParsedSiweMessage memory p;
        uint i=0;

        // dApp Domain.
        for (; i<siweMsg.length; i++) {
            if (siweMsg[i]==' ') {
                p.schemeDomain = _substr(siweMsg, 0, i);
                break;
            }
        }

        i += 49; // " wants you to sign in with your Ethereum account:\n"

        // Address.
        p.addr = _hexStringToAddress(_substr(siweMsg, i+=2, i+=40));
        i+=2; // Two new lines

        if (keccak256(_substr(siweMsg, i, i+4))!=keccak256("URI:")) {
            for (uint j=i; j<siweMsg.length-1; j++) {
                if (siweMsg[j]==0x0a && siweMsg[j+1]==0x0a) {
                    p.statement = _substr(siweMsg, i, j);
                    i=j;
                    break;
                }
            }
        }

        (p.uri, i) = _parseField(siweMsg, "URI", i);
        (p.version, i) = _parseField(siweMsg, "Version", i);
        bytes memory chainId;
        (chainId, i) = _parseField(siweMsg, "Chain ID", i);
        p.chainId = _parseUint(chainId);
        (p.nonce, i) = _parseField(siweMsg, "Nonce", i);
        (p.issuedAt, i) = _parseField(siweMsg, "Issued At", i);
        (p.expirationTime, i) = _parseField(siweMsg, "Expiration Time", i);
        (p.notBefore, i) = _parseField(siweMsg, "Not Before", i);
        (p.requestId, i) = _parseField(siweMsg, "Request ID", i);

        // Parse resources, if they exist.
        uint newI;
        (, newI) = _parseField(siweMsg, "Resources", i);
        if (newI!=i) {
            (p.resources, i) = _parseArray(siweMsg, newI);
        }

        return p;
    }

    // Parses RFC 3339 (ISO 8601) string to DateTime object.
    function _timestampFromIso(bytes memory str) private view returns (uint256) {
        return _dateTime.toTimestamp(
            uint16(bytes2(_substr(str, 0, 4))),
            uint8(bytes1(_substr(str, 5, 7))),
            uint8(bytes1(_substr(str, 8,10))),
            uint8(bytes1(_substr(str, 11,13))),
            uint8(bytes1(_substr(str, 14,16))),
            uint8(bytes1(_substr(str, 17,19)))
        );
    }

    // Verifies the SIWE message and its signature and generates the bearer token.
    function login(string calldata siweMsg, Sig calldata sig) external view returns (bytes memory) {
        Bearer memory b;

        // Derive the user's address from the signature.
        bytes memory eip191msg = abi.encodePacked("\x19Ethereum Signed Message:\n", "203", siweMsg);
        address addr = ecrecover(keccak256(eip191msg), sig.v, sig.r, sig.s);
        b.userAddr = addr;

        ParsedSiweMessage memory p = _parseSiweMsg(bytes(siweMsg));

        require(p.chainId==block.chainid, "chain ID mismatch");
        require(keccak256(p.schemeDomain)==keccak256(bytes(_domain)), "domain mismatch");
        require(p.addr==addr, "SIWE address does not match signer's address");

        if (p.notBefore.length!=0) {
            require(block.timestamp > _timestampFromIso(p.notBefore), "not before not reached yet");
        }
        require(block.timestamp < _timestampFromIso(p.expirationTime), "expired");

        if (p.expirationTime.length!=0) {
            // Compute expected block number at expiration time.
            b.validUntil = _timestampFromIso(p.expirationTime);
        } else {
            // Otherwise, just take the default validity.
            b.validUntil = block.timestamp + DEFAULT_VALIDITY;
        }

        bytes memory encB = Sapphire.encrypt(_bearerEncKey, 0, abi.encode(b), "");
        return encB;
    }

    // Returns the domain associated with the dApp.
    function domain() public view returns (string memory) {
        return _domain;
    }

    // Validates the bearer token and returns authenticated msg.sender.
    function authMsgSender(bytes calldata bearer) internal view returns (address) {
        bytes memory bearerEncoded = Sapphire.decrypt(_bearerEncKey, 0, bearer, "");
        Bearer memory b = abi.decode(bearerEncoded, (Bearer));
        require(keccak256(bytes(b.domain))==keccak256(bytes(_domain)), "invalid domain");
        require(b.validUntil>=block.timestamp, "expired");
        return b.userAddr;
    }
}
