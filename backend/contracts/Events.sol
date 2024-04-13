// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import {EIP155Signer} from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";

contract Events {
    struct Endorsee {
        string endorseeName;
        string[] endorsements;
    }

    struct EventDetails {
        string eventName;
        string eventDescription;
        uint8 startDate;
        uint8 endDate;
        bytes32 passwordHash;
        mapping(address => Endorsee) endorseeRecords;
    }

    mapping(uint256 => EventDetails) public events;

    bytes32 internal constant gasslessKey;
    address internal constant gasslessAddress;
    bytes32 internal constant encKey;

    error UserAlreadyExists(); // needed?
    error EventNotStarted();
    error DeadlineExpired();
    error NotEndorsee();
    error NotGasslessAddress();
    error UserNotInWhitelist(); // needed?

    constructor() {
        (gasslessAddress, gasslessKey) = EthereumUtils.generateKeypair();
        encKey = bytes32(Sapphire.randomBytes(32, ""));
        // TODO: fund gasslessAddress
    }

    function newEvent(
        string memory _eventName,
        string memory _eventDescription,
        uint8 _startDate,
        uint8 _endDate,
        string memory _eventPasswordString
        address[] memory _endorseeAddresses
        string[] memory _endorseeNames
    ) external {
        eventName = _eventName;
        eventDescription = _eventDescription;
        startDate = _startDate;
        endDate = _endDate;
        passwordHash = keccak256(abi.encodePacked(_eventPasswordString));
        for (uint i = 0; i < _endorseeAddresses.length; i++) {
            Endorsee memory newEndorsee = Endorsee(_endorseeNames[i], new string[](0));
            endorseeRecords[_endorseeAddresses[i]] = newEndorsee;
            // TODO: encrypt & decrypt addresses & usernames with sapphire library
            // bytes memory pcEncoded = abi.encode(PayoutCertificate(coupon, payoutAddr));
            // bytes memory gasslessKey = Sapphire.encrypt(encKey, 0, pcEncoded, "");
        }
    }

    function genGaslessEndorseTx(
        string memory _endorsement,
        address memory _endorseeAddress,
        uint256 _nonce
        uint256 _eventId
    ) external view {
        if (keccak256(abi.encodePacked((events[_eventId].endorseeRecords[_endorseeAddress].endorseeName))) ==
            keccak256(abi.encodePacked(("")))) {
            revert NotEndorsee();
        }
        if (block.timestamp < startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }
        bytes memory gaslessTx = EIP155Signer.sign(
            gasslessAddress,
            gasslessKey,
            EIP155Signer.EthTx({
                nonce: _nonce,
                gasPrice: 100_000_000_000,
                gasLimit: 250_000, //update based on gas checks
                to: address(this),
                value: 0,
                data: abi.encodeCall(this.endorse, _endorsement, _endorseeAddress),
                chainId: block.chainid
            })
        );
        return gaslessTx;
    }

    function endorse(string memory _endorsement, address memory _endorseeAddress) private {
        if (block.timestamp < startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }
        if (msg.sender != gasslessAddress) {
            revert NotGasslessAddress();
        }
        if (keccak256(abi.encodePacked((events[_eventId].endorseeRecords[_endorseeAddress].endorseeName))) ==
            keccak256(abi.encodePacked(("")))) {
            revert NotEndorsee();
        }
        events[_eventId].endorseeRecords[_endorseeAddress].endorsements.push(_endorsement);
        address(gasslessAddress).call{value: 0.01 ether}("");
    }

    // function deadline() external {
    //     // mint NFT
    // }
}
