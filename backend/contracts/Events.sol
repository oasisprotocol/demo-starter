// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import {EIP155Signer} from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";

contract Events {
    struct User {
        string userName;
        string[] endorsements;
    }

    struct EventDetails {
        string eventName;
        string eventDescription;
        uint8 startDate;
        uint8 endDate;
        address[] whitelistWallets;
        mapping(address => User) userRecords;
    }

    mapping(uint256 => EventDetails) public events;

    bytes32 internal constant gasslessKey;
    address internal constant gasslessAddress;
    bytes32 internal constant encKey;

    error UserAlreadyExists();
    error EventNotStarted();
    error DeadlineExpired();
    error NotWhitelisted();
    error NotGasslessAddress();
    error UserNotInWhitelist();

    constructor() {
        (gasslessAddress, gasslessKey) = EthereumUtils.generateKeypair();
        encKey = bytes32(Sapphire.randomBytes(32, ""));
        // TODO: fund gasslessAddress
    }

    function addEvent(
        string memory _eventName,
        string memory _eventDescription,
        uint8 _startDate,
        uint8 _endDate,
        string memory _userName
        address[] memory _whitelistWallets
    ) {
        eventName = _eventName;
        eventDescription = _eventDescription;
        startDate = _startDate;
        endDate = _endDate;
        User memory newUser = User(_userName, new string[](0));
        userRecords[msg.sender] = newUser;
        whitelistWallets = _whitelistWallets;
    }

    // change function to match new state structure (event struct)
    function joinEvent(string memory userName, uint256 eventId) external {
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }
        if (whitelistWallets[msg.sender] == false) {
            revert NotWhitelisted();
        }
        if (
            keccak256(abi.encodePacked((userRecords[msg.sender].userName))) !=
            keccak256(abi.encodePacked(("")))
        ) {
            revert UserAlreadyExists();
        }
        User memory newUser = User(userName, new string[](0));
        userRecords[msg.sender] = newUser;
    }

    function genGaslessEndorseTx(
        string memory endorsement,
        address memory endorseeAddress,
        uint256 nonce
    ) external view {
        if (whitelistWallets[msg.sender] == false) {
            revert NotWhitelisted();
        }
        if (block.timestamp < startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }

        // bytes memory pcEncoded = abi.encode(PayoutCertificate(coupon, payoutAddr));
        // bytes memory gasslessKey = Sapphire.encrypt(encKey, 0, pcEncoded, "");

        bytes memory gaslessTx = EIP155Signer.sign(
            gasslessAddress,
            gasslessKey,
            EIP155Signer.EthTx({
                nonce: nonce,
                gasPrice: 100_000_000_000,
                gasLimit: 250_000, //update based on gas checks
                to: address(this),
                value: 0,
                data: abi.encodeCall(this.endorse, endorsement, endorseeAddress),
                chainId: block.chainid
            })
        );
        return gaslessTx;
    }

    function endorse(string memory endorsement, address memory endorseeAddress) external {
        if (block.timestamp < startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }
        if (msg.sender != gasslessAddress) {
            revert NotGasslessAddress();
        }
        if (keccak256(abi.encodePacked((userRecords[endorseeAddress].userName))) == keccak256(abi.encodePacked(("")))) {
            revert UserNotInWhitelist();
        }
        userRecords[endorseeAddress].endorsements.push(endorsement);
        address(gasslessAddress).call{value: 0.01 ether}("");
    }

    // function deadline() external {
    //     // mint NFT
    // }
}
