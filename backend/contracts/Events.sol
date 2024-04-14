// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import {EIP155Signer} from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";
import {EthereumUtils} from "@oasisprotocol/sapphire-contracts/contracts/EthereumUtils.sol";

contract Events {
    struct Endorsee {
        bytes endorseeNameEncrypted;
        string[] endorsements;
    }

    struct EventDetails {
        string eventName;
        string eventDescription;
        uint8 startDate;
        uint8 endDate;
        bytes32 passwordHash;
        mapping(bytes => Endorsee) endorseeRecords;
    }

    mapping(uint256 => EventDetails) public events;

    uint16 public eventCount = 0;
    bytes32 gasslessKey;
    address gasslessAddress;
    address internal owner;
    bytes32 internal encKey;

    error EventNotStarted();
    error DeadlineExpired();
    error NotEndorsee();
    error NotGasslessAddress();
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor() {
        (gasslessAddress, gasslessKey) = EthereumUtils.generateKeypair();
        owner = msg.sender;
        encKey = bytes32(Sapphire.randomBytes(32, ""));
    }

    function newEvent(
        string memory _eventName,
        string memory _eventDescription,
        uint8 _startDate,
        uint8 _endDate,
        string memory _eventPasswordString,
        address[] memory _newEndorseeAddresses,
        string[] memory _newEndorseeNames
    ) external payable returns (uint16) {
        events[eventCount + 1].eventName = _eventName;
        events[eventCount + 1].eventDescription = _eventDescription;
        events[eventCount + 1].startDate = _startDate;
        events[eventCount + 1].endDate = _endDate;
        events[eventCount + 1].passwordHash = keccak256(abi.encodePacked(_eventPasswordString));
        for (uint i = 0; i < eventCount; i++) {
            bytes memory newAddressEncoded = abi.encode(_newEndorseeAddresses[i]);
            bytes memory newNameEncoded = abi.encode(_newEndorseeNames[i]);
            bytes memory newAddressEncrypted = Sapphire.encrypt(encKey, 0, newAddressEncoded, "");
            bytes memory newNameEncrypted = Sapphire.encrypt(encKey, 0, newNameEncoded, "");

            events[i].endorseeRecords[newAddressEncrypted].endorseeNameEncrypted = newNameEncrypted;
        }
        address(gasslessAddress).call{value: 0.01 ether}("");
        eventCount++;
        return eventCount;
    }

    function genGaslessEndorseTx(
        string memory _endorsement,
        address _endorseeAddress,
        uint256 _nonce,
        uint256 _eventId
    ) external view returns (bytes memory) {
        bytes memory endorseeAddressEncoded = abi.encode(_endorseeAddress);
        bytes memory endorseeAddressEncrypted = Sapphire.encrypt(
            encKey,
            0,
            endorseeAddressEncoded,
            ""
        );
        if (
            keccak256(
                abi.encodePacked(
                    (
                        events[_eventId]
                            .endorseeRecords[endorseeAddressEncrypted]
                            .endorseeNameEncrypted
                    )
                )
            ) == keccak256(abi.encodePacked(("")))
        ) {
            revert NotEndorsee();
        }
        if (block.timestamp < events[_eventId].startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > events[_eventId].endDate) {
            revert DeadlineExpired();
        }
        bytes memory gaslessTx = EIP155Signer.sign(
            gasslessAddress,
            gasslessKey,
            EIP155Signer.EthTx({
                nonce: uint64(_nonce),
                gasPrice: 100_000_000_000,
                gasLimit: 250_000, //update based on gas checks
                to: address(this),
                value: 0,
                data: abi.encodeCall(
                    this.endorse,
                    (_endorsement, endorseeAddressEncrypted, _eventId)
                ),
                chainId: block.chainid
            })
        );
        return gaslessTx;
    }

    function endorse(
        string memory _endorsement,
        bytes memory _endorseeAddressEncrypted,
        uint256 _eventId
    ) public payable {
        if (block.timestamp < events[_eventId].startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > events[_eventId].endDate) {
            revert DeadlineExpired();
        }
        if (msg.sender != gasslessAddress) {
            revert NotGasslessAddress();
        }
        if (
            keccak256(
                abi.encodePacked(
                    (
                        events[_eventId]
                            .endorseeRecords[_endorseeAddressEncrypted]
                            .endorseeNameEncrypted
                    )
                )
            ) == keccak256(abi.encodePacked(("")))
        ) {
            revert NotEndorsee();
        }
        events[_eventId].endorseeRecords[_endorseeAddressEncrypted].endorsements.push(_endorsement);
        address(gasslessAddress).call{value: 0.01 ether}("");
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(gasslessAddress).balance);
    }

    // function deadline() external {
    //     // mint NFT
    // }
}
