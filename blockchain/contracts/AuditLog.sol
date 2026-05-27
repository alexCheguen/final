// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ParkingAuditLog {
    address public owner;

    event AuditRegistrado(
        string indexed sessionId,
        string dataHash,
        string action,
        uint256 timestamp
    );

    modifier soloOwner() {
        require(msg.sender == owner, "No autorizado");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registrar(
        string calldata sessionId,
        string calldata dataHash,
        string calldata action
    ) external soloOwner {
        emit AuditRegistrado(sessionId, dataHash, action, block.timestamp);
    }
}
