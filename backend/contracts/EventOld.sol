// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Event {
    string public eventName;
    string public eventDescription;
    uint8 public startDate;
    uint8 public endDate;

    struct User {
        string userName;
        string[] endorsements;
    }

    mapping(address => User) public userRecords;

    error UserAlreadyExists();
    error EventNotStarted();
    error DeadlineExpired();

    constructor(
        string memory _eventName,
        string memory _eventDescription,
        uint8 _startDate,
        uint8 _endDate,
        string memory _userName
    ) {
        eventName = _eventName;
        eventDescription = _eventDescription;
        startDate = _startDate;
        endDate = _endDate;
        // TODO: add user
        // TODO: WHITELIST ADDRESSES
        // TODO: generate _sk (secret key)
    }

    function joinEvent(string memory userName) external {
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
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

    function genGaslessEndorse

    function endorse(string memory endorsement, address memory endorseeAddress) external {
        if (block.timestamp < startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }
        require(msg.sender == _skAddress);
        // TODO: check if endorsee is in whitelist
        userRecords[endorseeAddress].endorsements.push(endorsement);
        // TODO: get this secret key
        // TODO: see how expensive is endorse with 140char, then set value below
        address(_skAddress).call{value: 0.01 ether}("");
    }

    // function deadline() external {
    //     // mint NFT
    // }
}
