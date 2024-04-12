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

    constructor(string memory _eventName, string memory _eventDescription, uint8 memory _startDate, uint8 memory _endDate, string memory _userName) {
        eventName = _eventName
        eventDescription = _eventDescription
        startDate = _startDate
        endDate = _endDate
    }

    function joinEvent(string memory userName) external {
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }
        if (userRecords[msg.sender].userName != "") {
            revert UserAlreadyExists();
        }
        User memory newUser = User(userName, []);
        userRecords[msg.sender] = newUser;
    }

    function endorse(string memory endorsement) external {
        if (block.timestamp < startDate) {
            revert EventNotStarted();
        }
        if (block.timestamp > endDate) {
            revert DeadlineExpired();
        }
        userRecords[msg.sender].endorsements.push(endorsement);
    }

    function deadline() external {
        // mint NFT
    }

}