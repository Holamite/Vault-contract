// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Vault {
    address public owner;

    struct Grant {
        address donor;
        address beneficiary;
        uint amount;
        uint unlockTime;
        bool withdrawn;
    }

    Grant[] public grants;

    event GrantOffered(
        uint indexed grantId,
        address indexed donor,
        address indexed beneficiary,
        uint amount,
        uint unlockTime
    );
    event GrantClaimed(
        uint indexed grantId,
        address indexed beneficiary,
        uint amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function offerGrant(
        address _beneficiary,
        uint _unlockTime
    ) external payable {
        require(msg.value > 0, "Invalid amount");
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(
            _unlockTime > block.timestamp,
            "Unlock time must be in the future"
        );

        uint grantId = grants.length;
        grants.push(
            Grant({
                donor: msg.sender,
                beneficiary: _beneficiary,
                amount: msg.value,
                unlockTime: _unlockTime,
                withdrawn: false
            })
        );

        emit GrantOffered(
            grantId,
            msg.sender,
            _beneficiary,
            msg.value,
            _unlockTime
        );
    }

    function claimGrant(uint _grantId) external {
        require(_grantId < grants.length, "Invalid grant ID");

        Grant storage grant = grants[_grantId];
        require(
            msg.sender == grant.beneficiary,
            "Only beneficiary can claim the grant"
        );
        require(!grant.withdrawn, "Grant already withdrawn");
        require(
            block.timestamp >= grant.unlockTime,
            "Grant is not yet unlocked"
        );

        grant.withdrawn = true;
        payable(msg.sender).transfer(grant.amount);

        emit GrantClaimed(_grantId, msg.sender, grant.amount);
    }

    function withdraw(uint _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(_amount);
    }

    function getNumberOfGrants() external view returns (uint) {
        return grants.length;
    }

    function getGrant(
        uint _grantId
    ) external view returns (address, address, uint, uint, bool) {
        require(_grantId < grants.length, "Invalid grant ID");

        Grant storage grant = grants[_grantId];
        return (
            grant.donor,
            grant.beneficiary,
            grant.amount,
            grant.unlockTime,
            grant.withdrawn
        );
    }

    receive() external payable {}
}
