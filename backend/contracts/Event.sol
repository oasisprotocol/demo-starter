// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Event {
    string public eventName
    string public eventDescription
    string public startDate
    string public endDate

    // interface mapping user
    // - wallet address: 0x…
    // - user name: deca12x
    // - endorsements: [”string with endor1”, ”string with endor2”, ”string with endor3”…]

    constructor(string calldata _eventName, string calldata _eventDescription, string calldata _startDate, string calldata _endDate) {
        eventName = _eventName
        eventDescription = _eventDescription
        startDate = _startDate
        endDate = _endDate
    }

    function joinEvent() external {
        // add user to event
    }

    function endorse() external {
        // add endorsement to user
    }

    function deadline() external {
        // mint NFT
    }

}
