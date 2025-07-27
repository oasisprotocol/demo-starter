// contracts/Hello.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SendMail {
    string public message;

    struct EmailStatus {
        string email;
        bool sent; // default is false
        bool replied; // default is false
    }

    EmailStatus[] public emails;

    // A mapping to quickly check if an email already exists and its index
    mapping(bytes32 => uint256) private emailHashToIndex;
    // A mapping to track if an email has been added to avoid duplicates
    mapping(bytes32 => bool) private emailExists;


    constructor() {
    }

    function sendEmail(string memory _email) external {
        // Calculate the hash of the email
        bytes32 emailHash = keccak256(bytes(_email));

        // Prevent adding duplicate emails
        require(!emailExists[emailHash], "Email already exists.");

        emails.push(EmailStatus({email: _email, sent: true, replied: false}));
        // Store the index of the newly added email
        emailHashToIndex[emailHash] = emails.length - 1;
        // Mark the email as existing
        emailExists[emailHash] = true;
    }

    function markEmailAsReplied(string memory _email) external {
        bytes32 emailHash = keccak256(bytes(_email));

        // Check if the email exists before iterating
        require(emailExists[emailHash], "Email not found.");

        // Retrieve the index directly from the mapping
        uint256 index = emailHashToIndex[emailHash];

        // Ensure the index is valid and the email string matches (redundant but good for safety)
        require(index < emails.length && keccak256(bytes(emails[index].email)) == emailHash, "Email not found or index mismatch.");

        emails[index].replied = true;
    }

    function getEmailStatus(uint256 index) external view returns (string memory, bool) {
        require(index < emails.length, "Index out of bounds");
        EmailStatus memory emailStatus = emails[index];
        return (emailStatus.email, emailStatus.sent);
    }

    function getAllEmailsFlat() external view returns (string[] memory, bool[] memory, bool[] memory) {
        uint256 len = emails.length;
        string[] memory emailArr = new string[](len);
        bool[] memory sentArr = new bool[](len);
        bool[] memory repliedArr = new bool[](len);

        for (uint256 i = 0; i < len; i++) {
            emailArr[i] = emails[i].email;
            sentArr[i] = emails[i].sent;
            repliedArr[i] = emails[i].replied;
        }
        return (emailArr, sentArr, repliedArr);
    }

    function getAllEmails() external view returns (EmailStatus[] memory) {
        return emails;
    }

    function setMessage(string memory _msg) external {
        message = _msg;
    }
}