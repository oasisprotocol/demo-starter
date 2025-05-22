// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SiweAuth} from "@oasisprotocol/sapphire-contracts/contracts/auth/SiweAuth.sol";

contract TimeCapsule is SiweAuth {
    string private _message;
    address public author;
    uint256 public revealTimestamp;

    event MessageSet(address indexed author, string message, uint256 revealTimestamp);
    // Removed MessageRetrieved event as it was causing issues in a view function.
    // Retrieval can be inferred by a successful call to getMessage by the dApp.

    error CapsuleLocked();
    error NotAuthor();
    error RevealDurationMustBePositive();

    modifier onlyAuthorAfterReveal(bytes memory authToken) {
        if (block.timestamp < revealTimestamp) {
            revert CapsuleLocked();
        }
        // Use msg.sender for transactions and signed calls, fallback to
        // checking bearer for view calls.
        if (msg.sender != author && authMsgSender(authToken) != author) {
            revert NotAuthor();
        }
        _;
    }

    constructor(string memory domain) SiweAuth(domain) {}

    function setMessage(string calldata m, uint256 _revealDurationInSeconds) external {
        if (_revealDurationInSeconds == 0) {
            // Changed from > 0 to == 0 for direct revert condition
            revert RevealDurationMustBePositive();
        }
        uint256 newRevealTimestamp = block.timestamp + _revealDurationInSeconds;

        _message = m;
        author = msg.sender;
        revealTimestamp = newRevealTimestamp;

        emit MessageSet(msg.sender, m, newRevealTimestamp);
    }

    function getMessage(
        bytes memory authToken
    )
        external
        view
        onlyAuthorAfterReveal(authToken)
        returns (
            string memory messageContent,
            address messageAuthor,
            uint256 messageRevealTimestamp
        )
    {
        // The onlyAuthorAfterReveal modifier already checks timestamp and authorship.
        // Removed: emit MessageRetrieved(...) as it's a state modification.
        return (_message, author, revealTimestamp);
    }

    // Public getter for capsule status without needing full auth token for message content.
    function getCapsuleStatus()
        external
        view
        returns (address currentAuthor, uint256 currentRevealTimestamp, bool isReadyToReveal)
    {
        return (author, revealTimestamp, block.timestamp >= revealTimestamp);
    }
}
